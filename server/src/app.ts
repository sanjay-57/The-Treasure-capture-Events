import fs from 'node:fs'
import path from 'node:path'
import Fastify, { type FastifyInstance } from 'fastify'
import cookie from '@fastify/cookie'
import multipart from '@fastify/multipart'
import rateLimit from '@fastify/rate-limit'
import fastifyStatic from '@fastify/static'
import { ZodError } from 'zod'
import type { Config } from './config'
import { openDb } from './db'
import { Docs } from './docs'
import { Engine } from './engine/engine'
import { Hub } from './live/hub'
import { Media } from './storage/media'
import { Attempts, COOKIE, Sessions } from './auth/sessions'
import { hashPassword } from './auth/password'
import { auditor, type Ctx } from './context'
import { isPrivate } from './lan'
import { seed, type SeedMode } from './seed'
import { HttpError, id, now, token } from './util'
import authRoutes from './routes/auth'
import dataRoutes from './routes/data'
import mediaRoutes from './routes/media'
import driveRoutes from './routes/drives'
import adminRoutes from './routes/admin'

export interface Built {
  app: FastifyInstance
  ctx: Ctx
  /** Set when this boot created the first admin. */
  firstAdmin?: { name: string; password?: string }
}

export async function buildApp(cfg: Config, opts: { logger?: boolean; seed?: SeedMode } = {}): Promise<Built> {
  const db = openDb(cfg.dataDir)
  const docs = new Docs(db)
  const sessions = new Sessions(db)
  const media = new Media(cfg.dataDir)
  const hub = new Hub(sessions, docs)
  const engine = new Engine(docs, changes => {
    // Photos and catalogue rows follow their records.
    for (const c of changes) {
      const prev = c.prev as Record<string, string> | undefined
      // Archiving keeps the proof records (filenames for Lightroom) but deletes the previews, as the studio screen promises.
      if (c.coll === 'events' && (c.doc as { status?: string } | null)?.status === 'archived' && prev?.status !== 'archived') media.removeEvent(c.id)
      if (c.doc !== null) continue
      if (c.coll === 'proofs' && prev?.eventId) media.removeProof(prev.eventId, c.id)
      if (c.coll === 'events') media.removeEvent(c.id)
      if (c.coll === 'drives') db.prepare('DELETE FROM assets WHERE drive_id = ?').run(c.id)
    }
    hub.publish(changes)
  })
  const ctx: Ctx = { cfg, db, docs, sessions, attempts: new Attempts(db), hub, engine, media, audit: auditor(db) }

  if (docs.count('cms') === 0) seed(engine, docs, opts.seed ?? 'demo')
  let firstAdmin: Built['firstAdmin']
  if (!db.prepare('SELECT 1 FROM admins LIMIT 1').get()) {
    const password = cfg.adminPassword ?? token(9)
    db.prepare('INSERT INTO admins (id, name, password_hash, created_at) VALUES (?, ?, ?, ?)').run(id('ad'), cfg.adminName, hashPassword(password), now())
    firstAdmin = { name: cfg.adminName, password: cfg.adminPassword ? undefined : password }
  }

  const app = Fastify({ logger: opts.logger ? { level: 'info', transport: undefined } : false, bodyLimit: 12 * 1024 * 1024, trustProxy: false })

  app.addHook('onRequest', async (req, reply) => {
    if (cfg.lanOnly && !isPrivate(req.ip)) {
      reply.code(403).send({ error: 'lan_only', message: 'This server only answers devices on the studio Wi-Fi.' })
      return reply
    }
  })
  await app.register(cookie)
  await app.register(multipart, { limits: { fileSize: 30 * 1024 * 1024, files: 4 } })
  await app.register(rateLimit, { global: false })
  app.decorateRequest('auth', null as never)
  app.addHook('onRequest', async req => {
    req.auth = sessions.read(req.cookies[COOKIE])
  })

  app.setErrorHandler((err: any, req, reply) => {
    if (err instanceof HttpError) return reply.code(err.status).send({ error: err.code, message: err.message })
    if (err instanceof ZodError) return reply.code(400).send({ error: 'invalid', issues: err.issues.slice(0, 5) })
    if (err.statusCode && err.statusCode < 500) return reply.code(err.statusCode).send({ error: err.code ?? 'error', message: err.message })
    req.log.error(err)
    return reply.code(500).send({ error: 'server_error', message: 'Something went wrong on the server.' })
  })

  for (const routes of [authRoutes, dataRoutes, mediaRoutes, driveRoutes, adminRoutes]) await app.register(async a => routes(a, ctx))

  const index = path.join(cfg.distDir, 'index.html')
  if (cfg.serveSite && fs.existsSync(index)) {
    await app.register(fastifyStatic, {
      root: cfg.distDir,
      index: false,
      // Files are listed at boot (lan:start builds first), so `/` and client routes fall through to index.html.
      wildcard: false,
      cacheControl: false,
      setHeaders: (res: any, file: string) => res.header('Cache-Control', file.includes(`${path.sep}assets${path.sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache'),
    })
    app.setNotFoundHandler((req, reply) => {
      const p = req.url.split('?')[0]
      if (req.method !== 'GET' || p.startsWith('/api/') || p.startsWith('/media/')) return reply.code(404).send({ error: 'not_found' })
      // Single-page app: every other path is a client route.
      return reply.header('Cache-Control', 'no-cache').sendFile('index.html')
    })
  } else {
    app.setNotFoundHandler((_req, reply) => reply.code(404).send({ error: 'not_found' }))
  }

  app.addHook('onClose', async () => {
    hub.close()
    db.close()
  })
  return { app, ctx, firstAdmin }
}
