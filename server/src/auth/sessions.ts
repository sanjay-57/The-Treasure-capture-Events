import type { DB } from '../db'
import { now, sha256, token } from '../util'
import { emptyGrants, isEmpty, type Grants } from './grants'

export const COOKIE = 'ttc_sid'
const DAYS = 30

export interface Auth {
  tokenHash?: string
  grants: Grants
}

export class Sessions {
  private q: Record<string, any>
  constructor(db: DB) {
    this.q = {
      get: db.prepare('SELECT grants, expires_at FROM sessions WHERE token_hash = ?'),
      ins: db.prepare('INSERT INTO sessions (token_hash, grants, created_at, expires_at, user_agent, ip) VALUES (?, ?, ?, ?, ?, ?)'),
      upd: db.prepare('UPDATE sessions SET grants = ?, expires_at = ? WHERE token_hash = ?'),
      del: db.prepare('DELETE FROM sessions WHERE token_hash = ?'),
      sweep: db.prepare('DELETE FROM sessions WHERE expires_at < ?'),
    }
  }

  private expiry() {
    return new Date(Date.now() + DAYS * 864e5).toISOString()
  }

  /** Grants for a cookie token; empty if unknown or expired. */
  read(tok: string | undefined): Auth {
    if (!tok) return { grants: emptyGrants() }
    const h = sha256(tok)
    return this.readHash(h)
  }
  readHash(h: string): Auth {
    const row = this.q.get.get(h) as { grants: string; expires_at: string } | undefined
    if (!row || row.expires_at < now()) return { grants: emptyGrants() }
    return { tokenHash: h, grants: { ...emptyGrants(), ...JSON.parse(row.grants) } }
  }

  /** Saves new grants. Returns a fresh token when the device had no session. */
  write(auth: Auth, grants: Grants, ua?: string, ip?: string): { token?: string; tokenHash?: string } {
    if (isEmpty(grants)) {
      if (auth.tokenHash) this.q.del.run(auth.tokenHash)
      return {}
    }
    if (auth.tokenHash) {
      this.q.upd.run(JSON.stringify(grants), this.expiry(), auth.tokenHash)
      return { tokenHash: auth.tokenHash }
    }
    const t = token()
    const h = sha256(t)
    this.q.ins.run(h, JSON.stringify(grants), now(), this.expiry(), ua?.slice(0, 200) ?? null, ip ?? null)
    return { token: t, tokenHash: h }
  }

  sweep() {
    this.q.sweep.run(now())
  }
}

/** Failed-attempt counter for PINs, codes and passwords. */
export class Attempts {
  private q: Record<string, any>
  constructor(db: DB) {
    this.q = {
      count: db.prepare('SELECT COUNT(*) n FROM attempts WHERE key = ? AND at > ?'),
      add: db.prepare('INSERT INTO attempts (key, at) VALUES (?, ?)'),
      clear: db.prepare('DELETE FROM attempts WHERE key = ?'),
      sweep: db.prepare('DELETE FROM attempts WHERE at < ?'),
    }
  }
  /** True when `key` failed `max` times in the last `minutes`. */
  locked(key: string, max = 5, minutes = 15): boolean {
    const since = new Date(Date.now() - minutes * 60_000).toISOString()
    return (this.q.count.get(key, since) as { n: number }).n >= max
  }
  fail(key: string) {
    this.q.add.run(key, now())
  }
  clear(key: string) {
    this.q.clear.run(key)
  }
  sweep() {
    this.q.sweep.run(new Date(Date.now() - 864e5).toISOString())
  }
}
