import fs from 'node:fs'
import path from 'node:path'
import type { FastifyInstance } from 'fastify'
import { scopeOf, type Ctx } from '../context'
import { EXT_FOR, MIME } from '../storage/media'
import { bad, forbid, id, notFound } from '../util'

const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/

/**
 * Photos. The browser makes the 2048 px preview and 400 px thumb (src/saas/upload.ts);
 * this only stores and serves them. Then the browser calls studio.addProofs with the urls,
 * which is what makes them appear live on the customer's phone.
 */
export default async function mediaRoutes(app: FastifyInstance, ctx: Ctx) {
  const { media } = ctx

  app.post('/api/upload/proof/:eventId/:proofId', { config: { rateLimit: false } }, async req => {
    const { eventId, proofId } = req.params as { eventId: string; proofId: string }
    if (!SAFE_ID.test(eventId) || !SAFE_ID.test(proofId)) throw bad('bad_id')
    const scope = scopeOf(ctx, req)
    if (!scope.admin && !scope.ownsEvent(eventId)) throw forbid()
    const out: Record<string, string | number> = {}
    for await (const part of req.parts()) {
      if (part.type !== 'file') continue
      if (part.fieldname !== 'preview' && part.fieldname !== 'thumb') {
        part.file.resume()
        continue
      }
      if (part.mimetype !== 'image/jpeg') throw bad('jpeg_only')
      const file = part.fieldname === 'preview' ? `${proofId}.jpg` : `${proofId}.t.jpg`
      const bytes = await media.save(media.proofFile(eventId, file), part.file)
      if (part.file.truncated) throw bad('file_too_big')
      out[part.fieldname === 'preview' ? 'url' : 'thumbUrl'] = `/media/proofs/${eventId}/${file}`
      if (part.fieldname === 'preview') out.bytes = bytes
    }
    if (!out.url) throw bad('preview_missing')
    out.thumbUrl ??= out.url
    return out
  })

  /** CMS photos, studio logos, voice notes. Anyone signed in; served publicly by key. */
  app.post('/api/upload/file', async req => {
    const g = req.auth.grants
    if (!g.admin && !g.studioId && !g.verified && !g.customer && !g.orderIds.length) throw forbid('login_first')
    const part = await req.file()
    if (!part) throw bad('file_missing')
    const ext = EXT_FOR[part.mimetype]
    if (!ext) throw bad('type_not_allowed')
    const key = `${id('f').replace('_', '-')}.${ext}`
    const bytes = await media.save(media.file(key), part.file)
    if (part.file.truncated) throw bad('file_too_big')
    return { url: `/media/files/${key}`, bytes, type: part.mimetype }
  })

  app.get('/media/proofs/:eventId/:file', async (req, reply) => {
    const { eventId, file } = req.params as { eventId: string; file: string }
    const scope = scopeOf(ctx, req)
    if (!scope.seesEvent(eventId) && !isCover(eventId, file)) throw notFound()
    return send(reply, media.proofFile(eventId, file), 'private, max-age=604800, immutable')
  })

  app.get('/media/files/:key', async (req, reply) => {
    const { key } = req.params as { key: string }
    return send(reply, media.file(key), 'public, max-age=604800, immutable')
  })

  /** The gallery's cover shows on the PIN screen, so it opens without the PIN. */
  function isCover(eventId: string, file: string) {
    const ev = ctx.docs.get('events', eventId)
    const cover = ev?.coverProofId ?? ctx.docs.by('proofs', 'parent', eventId)[0]?.id
    return !!cover && file.startsWith(`${cover}.`)
  }

  function send(reply: any, file: string, cache: string) {
    if (!fs.existsSync(file)) throw notFound()
    const ext = path.extname(file).slice(1).toLowerCase()
    reply.header('Content-Type', MIME[ext] ?? 'application/octet-stream')
    reply.header('Cache-Control', cache)
    reply.header('Content-Length', fs.statSync(file).size)
    return reply.send(fs.createReadStream(file))
  }
}
