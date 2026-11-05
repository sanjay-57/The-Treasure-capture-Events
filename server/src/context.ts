import type { FastifyReply, FastifyRequest } from 'fastify'
import type { Config } from './config'
import type { DB } from './db'
import type { Docs } from './docs'
import type { Engine } from './engine/engine'
import type { Hub } from './live/hub'
import type { Media } from './storage/media'
import { Attempts, COOKIE, Sessions, type Auth } from './auth/sessions'
import { Scope } from './policy/scope'
import type { Grants } from './auth/grants'
import { now } from './util'

export interface Ctx {
  cfg: Config
  db: DB
  docs: Docs
  sessions: Sessions
  attempts: Attempts
  hub: Hub
  engine: Engine
  media: Media
  audit: (actor: string | undefined, action: string, target?: string) => void
}

declare module 'fastify' {
  interface FastifyRequest {
    auth: Auth
  }
}

export const scopeOf = (ctx: Ctx, req: FastifyRequest) => new Scope(req.auth.grants, ctx.docs)

/** Saves new grants for this device and sets the cookie when the session is new. */
export function saveGrants(ctx: Ctx, req: FastifyRequest, reply: FastifyReply, grants: Grants) {
  const out = ctx.sessions.write(req.auth, grants, req.headers['user-agent'], req.ip)
  if (out.token) {
    reply.setCookie(COOKIE, out.token, { path: '/', httpOnly: true, sameSite: 'lax', secure: req.protocol === 'https', maxAge: 30 * 86400 })
  } else if (!out.tokenHash) {
    reply.clearCookie(COOKIE, { path: '/' })
  }
  req.auth = { tokenHash: out.tokenHash, grants }
}

export const auditor = (db: DB) => {
  const ins = db.prepare('INSERT INTO audit (actor, action, target, at) VALUES (?, ?, ?, ?)')
  return (actor: string | undefined, action: string, target?: string) => void ins.run(actor ?? null, action, target ?? null, now())
}
