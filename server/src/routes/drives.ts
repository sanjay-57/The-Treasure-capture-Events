import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { scopeOf, type Ctx } from '../context'
import { forbid } from '../util'

const Asset = z
  .object({ id: z.string().min(1).max(80), driveId: z.string(), filename: z.string().max(400), kind: z.string().max(10), fingerprint: z.string().max(80).optional() })
  .passthrough()

/** Drive catalogue rows. Hundreds of thousands per studio, so they never ride in /api/sync. */
export default async function driveRoutes(app: FastifyInstance, ctx: Ctx) {
  const { db } = ctx
  const q = {
    put: db.prepare('INSERT OR REPLACE INTO assets (id, drive_id, studio_id, filename, kind, fingerprint, data) VALUES (?, ?, ?, ?, ?, ?, ?)'),
    del: db.prepare('DELETE FROM assets WHERE id = ? AND drive_id = ?'),
    wipe: db.prepare('DELETE FROM assets WHERE drive_id = ?'),
    list: db.prepare('SELECT data FROM assets WHERE drive_id = ? LIMIT ? OFFSET ?'),
  }

  function ownDrive(req: any, driveId: string) {
    const scope = scopeOf(ctx, req)
    const drive = ctx.docs.get('drives', driveId)
    if (!drive || !(scope.admin || scope.ownsDrive(driveId, drive))) throw forbid()
    return drive
  }

  app.post('/api/drives/:driveId/assets', { config: { rateLimit: false }, bodyLimit: 50 * 1024 * 1024 }, async req => {
    const { driveId } = req.params as { driveId: string }
    const drive = ownDrive(req, driveId)
    const body = z.object({ upsert: z.array(Asset).max(2000).default([]), remove: z.array(z.string()).max(20000).default([]), replaceAll: z.boolean().optional() }).parse(req.body)
    db.transaction(() => {
      if (body.replaceAll) q.wipe.run(driveId)
      for (const id of body.remove) q.del.run(id, driveId)
      for (const a of body.upsert) {
        if (a.driveId !== driveId) continue
        q.put.run(a.id, driveId, drive.studioId, a.filename, a.kind, a.fingerprint ?? null, JSON.stringify(a))
      }
    })()
    return { upserted: body.upsert.length, removed: body.remove.length }
  })

  app.get('/api/drives/:driveId/assets', async req => {
    const { driveId } = req.params as { driveId: string }
    ownDrive(req, driveId)
    const { limit, offset } = z.object({ limit: z.coerce.number().int().min(1).max(50000).default(50000), offset: z.coerce.number().int().min(0).default(0) }).parse(req.query)
    return (q.list.all(driveId, limit, offset) as { data: string }[]).map(r => JSON.parse(r.data))
  })

  /** Search every drive of the studio: filename or path contains q. */
  app.get('/api/assets/search', async req => {
    const scope = scopeOf(ctx, req)
    const p = z.object({ q: z.string().max(200).default(''), kind: z.string().max(10).optional(), studioId: z.string().optional(), limit: z.coerce.number().int().min(1).max(2000).default(500) }).parse(req.query)
    const studioId = scope.admin && p.studioId ? p.studioId : req.auth.grants.studioId
    if (!studioId) throw forbid()
    const like = `%${p.q.replace(/[%_]/g, m => '\\' + m)}%`
    const rows = db
      .prepare(`SELECT data FROM assets WHERE studio_id = ? AND (filename LIKE ? ESCAPE '\\' OR json_extract(data, '$.path') LIKE ? ESCAPE '\\') ${p.kind ? 'AND kind = ?' : ''} LIMIT ?`)
      .all(...[studioId, like, like, ...(p.kind ? [p.kind] : []), p.limit]) as { data: string }[]
    return rows.map(r => JSON.parse(r.data))
  })
}
