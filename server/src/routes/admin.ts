import type { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { COLLECTIONS, SINGLE_ID, type Change, type StoreName } from '../../../src/api/collections'
import { hashPassword } from '../auth/password'
import type { Ctx } from '../context'
import { backupNow } from '../jobs/backup'
import { lanUrls } from '../lan'
import { seed } from '../seed'
import { bad, forbid, id, now } from '../util'

export default async function adminRoutes(app: FastifyInstance, ctx: Ctx) {
  const { db, docs, engine } = ctx
  const admin = (req: FastifyRequest) => {
    const a = req.auth.grants.admin
    if (!a) throw forbid('admin_only')
    return a
  }

  app.get('/api/health', async () => ({ ok: true, time: now(), urls: lanUrls(ctx.cfg.port), live: ctx.hub.size }))

  /** Login codes waiting to be read out. */
  app.get('/api/admin/codes', async req => {
    admin(req)
    return db.prepare('SELECT id, phone, purpose, name, code, created_at createdAt, expires_at expiresAt FROM otps WHERE used_at IS NULL AND expires_at > ? ORDER BY id DESC').all(now())
  })

  app.get('/api/admin/admins', async req => {
    admin(req)
    return db.prepare('SELECT id, name, disabled, created_at createdAt, last_login_at lastLoginAt FROM admins ORDER BY created_at').all()
  })
  app.post('/api/admin/admins', async req => {
    const me = admin(req)
    const body = z.object({ name: z.string().min(2).max(60), password: z.string().min(8).max(200) }).parse(req.body)
    const exists = db.prepare('SELECT 1 FROM admins WHERE name = ?').get(body.name)
    if (exists) throw bad('name_taken')
    const aid = id('ad')
    db.prepare('INSERT INTO admins (id, name, password_hash, created_at) VALUES (?, ?, ?, ?)').run(aid, body.name, hashPassword(body.password), now())
    ctx.audit(me.name, 'admin.create', body.name)
    return { id: aid }
  })
  app.post('/api/admin/password', async req => {
    const me = admin(req)
    const body = z.object({ password: z.string().min(8).max(200), adminId: z.string().optional() }).parse(req.body)
    db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(hashPassword(body.password), body.adminId ?? me.id)
    ctx.audit(me.name, 'admin.password', body.adminId ?? me.id)
    return { ok: true }
  })
  app.post('/api/admin/admins/:id/disable', async req => {
    const me = admin(req)
    const { id: aid } = req.params as { id: string }
    if (aid === me.id) throw bad('cannot_disable_self')
    db.prepare('UPDATE admins SET disabled = 1 WHERE id = ?').run(aid)
    ctx.audit(me.name, 'admin.disable', aid)
    return { ok: true }
  })

  /**
   * Brings data typed into a browser during the mock period onto the server. Body = the
   * `state` objects from localStorage keys ttc-store-v2, ttc-studio-v2, ttc-studio-os-v2.
   * Existing records are kept unless overwrite is set.
   */
  app.post('/api/admin/import', { bodyLimit: 60 * 1024 * 1024 }, async req => {
    const me = admin(req)
    const body = z.object({ ttc: z.record(z.string(), z.unknown()).optional(), studio: z.record(z.string(), z.unknown()).optional(), os: z.record(z.string(), z.unknown()).optional(), overwrite: z.boolean().default(false) }).parse(req.body)
    const changes: Change[] = []
    const counts: Record<string, number> = {}
    for (const def of COLLECTIONS) {
      const state = body[def.store as StoreName] as Record<string, unknown> | undefined
      const value = state?.[def.key]
      if (value === undefined || value === null) continue
      const items: [string, unknown][] =
        def.shape === 'array' ? (value as any[]).filter(x => x && typeof x === 'object').map(x => [String(x[def.idKey ?? 'id']), x])
        : def.shape === 'record' ? Object.entries(value as object)
        : [[SINGLE_ID, value]]
      for (const [rid, doc] of items) {
        if (!rid || rid === 'undefined') continue
        if (!body.overwrite && docs.exists(def.coll, rid)) continue
        changes.push({ coll: def.coll, id: rid, doc })
        counts[def.coll] = (counts[def.coll] ?? 0) + 1
      }
    }
    engine.commit(changes)
    ctx.audit(me.name, 'import', JSON.stringify(counts))
    return { imported: counts }
  })

  /** Wipes every record and reloads the demo (or an empty site). Accounts and sessions stay. */
  app.post('/api/admin/reset', async req => {
    const me = admin(req)
    const body = z.object({ mode: z.enum(['demo', 'empty']) }).parse(req.body)
    db.prepare('DELETE FROM assets').run()
    seed(engine, docs, body.mode)
    ctx.audit(me.name, 'reset', body.mode)
    return { ok: true }
  })

  app.post('/api/admin/backup', async req => {
    admin(req)
    if (!ctx.cfg.backupDir) throw bad('set BACKUP_DIR in server/.env')
    return backupNow(ctx)
  })

  app.get('/api/admin/audit', async req => {
    admin(req)
    return db.prepare('SELECT actor, action, target, at FROM audit ORDER BY id DESC LIMIT 300').all()
  })
}
