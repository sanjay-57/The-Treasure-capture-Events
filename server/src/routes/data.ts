import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { toMe } from '../auth/grants'
import { saveGrants, type Ctx } from '../context'
import { Scope } from '../policy/scope'
import { policyFor } from '../policy/actions'
import { HttpError, bad, forbid } from '../util'

const Act = z.object({
  store: z.enum(['ttc', 'studio', 'os']),
  action: z.string().regex(/^[a-zA-Z][A-Za-z0-9]{0,60}$/),
  args: z.array(z.unknown()).max(8),
})

/** GET /api/sync (first load), POST /api/act (every store action), GET /api/live (SSE). */
export default async function dataRoutes(app: FastifyInstance, ctx: Ctx) {
  const { docs, engine, hub } = ctx

  app.get('/api/sync', async req => {
    const scope = new Scope(req.auth.grants, docs)
    return { me: toMe(req.auth.grants), seq: hub.seq, snapshot: scope.snapshot() }
  })

  app.post('/api/act', { config: { rateLimit: { max: 900, timeWindow: '1 minute' } } }, async (req, reply) => {
    const { store, action, args } = Act.parse(req.body)
    const policy = policyFor(store, action)
    if (!policy) throw bad('device_only')
    const fn = engine.action(store, action)
    if (!fn) throw new HttpError(404, 'unknown_action', `${store}.${action} does not exist`)

    const grants = structuredClone(req.auth.grants)
    const scope = new Scope(grants, docs)
    const c = { args, scope, grants }
    if (!scope.admin && !policy.allow(c)) throw forbid()

    const slice = engine.slice()
    policy.load(slice, c)
    const { result, changes } = engine.run(slice, () => (policy.run ? policy.run(c, () => fn(...args)) : fn(...args)))
    policy.after?.(c, result)

    if (JSON.stringify(grants) !== JSON.stringify(req.auth.grants)) saveGrants(ctx, req, reply, grants)
    if (scope.admin) ctx.audit(grants.admin?.name, `${store}.${action}`, typeof args[0] === 'string' ? args[0] : undefined)
    return { result: result ?? null, seq: hub.seq, changes: new Scope(grants, docs).filter(changes), me: toMe(grants) }
  })

  app.get('/api/live', (req, reply) => {
    const last = Number(req.headers['last-event-id'] ?? (req.query as { since?: string }).since)
    reply.hijack()
    hub.attach(reply.raw, req.auth.tokenHash, Number.isFinite(last) ? last : undefined)
  })
}
