import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { verifyPassword } from '../auth/password'
import { dropRealm, toMe } from '../auth/grants'
import type { Change } from '../../../src/api/collections'
import { saveGrants, type Ctx } from '../context'
import { brand, maskPin } from '../policy/scope'
import { HttpError, bad, digits, notFound, now, phone10, sameText } from '../util'

const CODE_MINUTES = 10
const limit = (max: number) => ({ config: { rateLimit: { max, timeWindow: '1 minute' } } })

const Phone = z.string().min(6).max(30)
const Purpose = z.enum(['customer', 'studio'])

export default async function authRoutes(app: FastifyInstance, ctx: Ctx) {
  const { db, docs, attempts, hub } = ctx
  const q = {
    admin: db.prepare('SELECT id, name, password_hash, disabled FROM admins WHERE name = ?'),
    seen: db.prepare('UPDATE admins SET last_login_at = ? WHERE id = ?'),
    recent: db.prepare('SELECT COUNT(*) n FROM otps WHERE phone = ? AND created_at > ?'),
    retire: db.prepare('UPDATE otps SET used_at = ? WHERE phone = ? AND purpose = ? AND used_at IS NULL'),
    insert: db.prepare('INSERT INTO otps (phone, purpose, code, name, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)'),
    live: db.prepare('SELECT id, code, attempts FROM otps WHERE phone = ? AND purpose = ? AND used_at IS NULL AND expires_at > ? ORDER BY id DESC LIMIT 1'),
    tried: db.prepare('UPDATE otps SET attempts = attempts + 1 WHERE id = ?'),
    use: db.prepare('UPDATE otps SET used_at = ? WHERE id = ?'),
  }

  app.get('/api/me', async req => toMe(req.auth.grants))

  app.post('/api/auth/admin/login', limit(10), async (req, reply) => {
    const body = z.object({ name: z.string().min(1).max(60), password: z.string().min(1).max(200) }).parse(req.body)
    const key = 'admin:' + body.name.toLowerCase()
    if (attempts.locked(key)) throw new HttpError(429, 'locked', 'Too many tries. Wait 15 minutes.')
    const row = q.admin.get(body.name) as { id: string; name: string; password_hash: string; disabled: number } | undefined
    if (!row || row.disabled || !verifyPassword(body.password, row.password_hash)) {
      attempts.fail(key)
      throw new HttpError(401, 'wrong_login', 'Name or password is wrong.')
    }
    attempts.clear(key)
    q.seen.run(now(), row.id)
    saveGrants(ctx, req, reply, { ...req.auth.grants, admin: { id: row.id, name: row.name } })
    ctx.audit(row.name, 'login')
    return toMe(req.auth.grants)
  })

  /** Makes a 4-digit code. On the LAN it appears on the admin screen; staff read it out. */
  app.post('/api/auth/code/request', limit(10), async req => {
    const body = z.object({ phone: Phone, purpose: Purpose }).parse(req.body)
    const phone = phone10(body.phone)
    if (phone.length !== 10) throw bad('bad_phone')
    let name = 'New photographer'
    if (body.purpose === 'customer') {
      const order = docs.by('orders', 'owner', phone)[0]?.doc
      const event = docs.by('events', 'parent', phone)[0]?.doc
      if (!order && !event) throw notFound('no_booking')
      name = order?.client?.name ?? event?.clientNames ?? 'Customer'
    } else {
      const st = docs.by('studios', 'code', phone)[0]?.doc
      if (st) name = st.name
    }
    const since = new Date(Date.now() - CODE_MINUTES * 60_000).toISOString()
    if ((q.recent.get(phone, since) as { n: number }).n >= 3) throw new HttpError(429, 'too_many_codes', 'Three codes were sent already. Wait 10 minutes.')
    q.retire.run(now(), phone, body.purpose)
    const code = digits(4)
    const expiresAt = new Date(Date.now() + CODE_MINUTES * 60_000).toISOString()
    const info = q.insert.run(phone, body.purpose, code, name, now(), expiresAt)
    hub.toAdmins('code', { id: Number(info.lastInsertRowid), phone, purpose: body.purpose, name, code, expiresAt })
    if (ctx.cfg.logOtp) app.log.info(`Login code for ${name} (${phone}, ${body.purpose}): ${code}`)
    return { ok: true, expiresAt }
  })

  app.post('/api/auth/code/verify', limit(20), async (req, reply) => {
    const body = z.object({ phone: Phone, purpose: Purpose, code: z.string().regex(/^\d{4}$/) }).parse(req.body)
    const phone = phone10(body.phone)
    const row = q.live.get(phone, body.purpose, now()) as { id: number; code: string; attempts: number } | undefined
    if (!row) throw new HttpError(400, 'code_expired', 'Ask for a new code.')
    if (row.attempts >= 5) {
      q.use.run(now(), row.id)
      throw new HttpError(429, 'locked', 'Too many wrong codes. Ask for a new one.')
    }
    if (!sameText(row.code, body.code)) {
      q.tried.run(row.id)
      throw new HttpError(401, 'wrong_code', 'That code is not right.')
    }
    q.use.run(now(), row.id)
    hub.toAdmins('code-used', { id: row.id })
    const g = structuredClone(req.auth.grants)
    if (body.purpose === 'customer') g.customer = phone
    else {
      const st = docs.by('studios', 'code', phone).map(d => d.doc).find(s => !s.cancelledAt)
      if (st) {
        g.studioId = st.id
        delete g.verified
      } else g.verified = phone
    }
    saveGrants(ctx, req, reply, g)
    return toMe(g)
  })

  /** Customer link + PIN: /gallery/:code, /poses/:code, /p/:code (project) or /s/:code (gallery). */
  app.post('/api/auth/gate', limit(20), async (req, reply) => {
    const body = z.object({ code: z.string().min(4).max(32), pin: z.string().max(12).optional() }).parse(req.body)
    const code = body.code.toLowerCase()
    const project = docs.by('projects', 'code', code)[0]?.doc
    const event = project ? undefined : docs.by('events', 'code', code)[0]?.doc
    if (!project && !event) throw notFound('no_link')
    const key = `gate:${code}:${req.ip}`
    if (attempts.locked(key)) throw new HttpError(429, 'locked', 'Too many wrong PINs. Wait 15 minutes.')
    const pin: string | undefined = (project ?? event).pin
    if (pin && !sameText(pin, body.pin ?? '')) {
      attempts.fail(key)
      throw new HttpError(401, 'wrong_pin', 'That PIN is not right.')
    }
    attempts.clear(key)
    const g = structuredClone(req.auth.grants)
    const list = project ? g.gates.projects : g.gates.events
    const id = (project ?? event).id
    if (!list.includes(id)) list.push(id)
    saveGrants(ctx, req, reply, g)
    return { me: toMe(g), kind: project ? 'project' : 'event', id }
  })

  /**
   * What a customer link shows before the PIN: the studio's brand, the title, photo
   * metadata (images stay locked except the cover). Private project parts are emptied.
   */
  app.get('/api/gate/:code', limit(60), async req => {
    const code = (req.params as { code: string }).code.toLowerCase()
    const project = docs.by('projects', 'code', code)[0]?.doc
    const event = project ? (project.galleryEventId ? docs.get('events', project.galleryEventId) : undefined) : docs.by('events', 'code', code)[0]?.doc
    if (!project && !event) throw notFound('no_link')
    const studio = docs.get('studios', (project ?? event).studioId)
    const changes: Change[] = []
    if (studio) changes.push({ coll: 'studios', id: studio.id, doc: brand(studio) })
    const settings = studio && docs.get('settings', studio.id)
    if (settings) changes.push({ coll: 'settings', id: studio.id, doc: settings })
    if (project) {
      const p = maskPin(project)
      changes.push({
        coll: 'projects', id: project.id,
        doc: { ...p, phone: '', email: undefined, payments: [], requests: [], documents: [], quote: { ...p.quote, lines: [] }, contract: { ...p.contract, body: '' } },
      })
    }
    if (event) {
      changes.push({ coll: 'events', id: event.id, doc: maskPin(event) })
      for (const d of docs.by('proofs', 'parent', event.id)) changes.push({ coll: 'proofs', id: d.id, doc: d.doc })
    }
    return { changes }
  })

  app.post('/api/auth/logout', async (req, reply) => {
    const body = z.object({ realm: z.enum(['admin', 'customer', 'studio', 'gate']).optional() }).parse(req.body ?? {})
    saveGrants(ctx, req, reply, dropRealm(req.auth.grants, body.realm))
    return toMe(req.auth.grants)
  })
}
