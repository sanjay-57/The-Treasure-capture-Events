import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { isPrivate } from '../src/lan'
import { EMPTY_DRAFT } from '../../src/lib/store'
import { STORES } from '../src/engine/stores'
import { boot } from './helpers'

let t: Awaited<ReturnType<typeof boot>>
beforeEach(async () => {
  t = await boot()
})
afterEach(async () => {
  await t.close()
})

const DEMO_CUSTOMER = '+91 98765 43210' // TTC-2026-0142, photo selection stage
/** A booking draft made the way the booking pages make it. */
const draft = (contact: string) => {
  const st = STORES.ttc.getState()
  STORES.ttc.setState({ draft: { ...EMPTY_DRAFT } })
  st.updateDraft({ district: 'madurai', eventType: 'wedding', venueType: 'mahal', venueName: 'Hall', venueAddress: 'Madurai', distanceKm: 5, date: '2027-01-20', time: '07:00', name: 'Test Couple', contact })
  return structuredClone(STORES.ttc.getState().draft)
}

describe('LAN guard', () => {
  it('knows private ranges', () => {
    for (const ip of ['127.0.0.1', '10.1.2.3', '172.20.0.1', '192.168.1.9', '::1', '::ffff:192.168.0.4']) expect(isPrivate(ip)).toBe(true)
    for (const ip of ['8.8.8.8', '172.32.0.1', '::ffff:1.1.1.1', '2001:db8::1']) expect(isPrivate(ip)).toBe(false)
  })
  it('refuses a public address', async () => {
    const r = await t.device('8.8.8.8').get('/api/health')
    expect(r.status).toBe(403)
    expect((await t.device().get('/api/health')).status).toBe(200)
  })
})

describe('seed and sync', () => {
  it('admin sees every collection of the demo', async () => {
    const a = await t.admin()
    const s = (await a.get('/api/sync')).body
    expect(s.me.admin.name).toBe('admin')
    expect(s.snapshot.orders.length).toBe(8)
    expect(s.snapshot.studios.length).toBeGreaterThan(0)
    expect(s.snapshot.cms).toHaveLength(1)
  })
  it('a stranger sees only CMS and plans', async () => {
    const s = (await t.device().get('/api/sync')).body
    const nonEmpty = Object.entries(s.snapshot).filter(([, v]) => (v as unknown[]).length).map(([k]) => k)
    expect(nonEmpty.sort()).toEqual(['cms', 'plans'])
  })
})

describe('admin login', () => {
  it('locks after five wrong passwords', async () => {
    const d = t.device()
    for (let i = 0; i < 5; i++) expect((await d.post('/api/auth/admin/login', { name: 'admin', password: 'nope' })).status).toBe(401)
    expect((await d.post('/api/auth/admin/login', { name: 'admin', password: 'test-pass-123' })).status).toBe(429)
  })
  it('sets an httpOnly cookie', async () => {
    const d = t.device()
    const r = await d.post('/api/auth/admin/login', { name: 'admin', password: 'test-pass-123' })
    expect(String(r.raw.headers['set-cookie'])).toMatch(/HttpOnly/i)
  })
})

describe('customer: enquiry and code login', () => {
  it('an enquiry creates an order the device can follow, and the admin is told', async () => {
    const d = t.device()
    const r = await d.act('ttc', 'submitEnquiry', draft('+91 90000 55555'))
    expect(r.status).toBe(200)
    const id = r.body.result as string
    expect(id).toMatch(/^TTC-\d{4}-\d{4}$/)
    expect(r.body.changes.find((c: any) => c.coll === 'orders').doc.quote.total).toBeGreaterThan(0)
    expect(r.body.me.orderIds).toContain(id)
    const a = await t.admin()
    const snap = (await a.get('/api/sync')).body.snapshot
    expect(snap.orders[0].id).toBe(id)
    expect(snap.outbox[0].doc.template).toBe('quote_sent')
  })
  it('a code is needed to see other orders on the same phone', async () => {
    const d = t.device()
    await d.act('ttc', 'submitEnquiry', draft(DEMO_CUSTOMER))
    const own = (await d.get('/api/sync')).body.snapshot.orders
    expect(own).toHaveLength(1)
    const c = await t.withCode(DEMO_CUSTOMER, 'customer')
    const all = (await c.get('/api/sync')).body.snapshot.orders
    expect(all.map((o: any) => o.id)).toContain('TTC-2026-0142')
  })
  it('unknown phone gets no code; wrong code fails', async () => {
    const d = t.device()
    expect((await d.post('/api/auth/code/request', { phone: '9000000000', purpose: 'customer' })).body.error).toBe('no_booking')
    await d.post('/api/auth/code/request', { phone: DEMO_CUSTOMER, purpose: 'customer' })
    expect((await d.post('/api/auth/code/verify', { phone: DEMO_CUSTOMER, purpose: 'customer', code: '0000' })).status).toBeGreaterThanOrEqual(400)
  })
  it('customer picks photos and submits; status moves to album; others cannot touch it', async () => {
    const c = await t.withCode(DEMO_CUSTOMER, 'customer')
    expect((await c.act('ttc', 'toggleSelection', 'TTC-2026-0142', 'p_new')).status).toBe(200)
    const r = await c.act('ttc', 'submitSelection', 'TTC-2026-0142')
    expect(r.body.changes[0].doc.status).toBe('ALBUM_CUSTOMIZATION')
    expect((await t.device().act('ttc', 'toggleSelection', 'TTC-2026-0142', 'x')).status).toBe(403)
    expect((await c.act('ttc', 'setStatus', 'TTC-2026-0142', 'DELIVERED')).status).toBe(403)
  })
  it('hides admin-only fields from the customer', async () => {
    const a = await t.admin()
    expect((await a.act('ttc', 'sendPoses', 'TTC-2026-0156', ['wed-family', 'pub-portrait'], ['hindu'])).status).toBe(200)
    const c = await t.withCode('+91 99401 22110', 'customer')
    const o = (await c.get('/api/sync')).body.snapshot.orders.find((x: any) => x.id === 'TTC-2026-0156').doc
    expect(o.poses.ids.length).toBeGreaterThan(0)
    expect(o.poses.faiths).toBeUndefined()
  })
})

describe('admin actions', () => {
  it('status change writes history and a WhatsApp message; unlisted actions are admin-only', async () => {
    const a = await t.admin()
    const r = await a.act('ttc', 'setStatus', 'TTC-2026-0160', 'TEAM_MEETING')
    const order = r.body.changes.find((c: any) => c.coll === 'orders').doc
    expect(order.history.at(-1).status).toBe('TEAM_MEETING')
    expect(r.body.changes.some((c: any) => c.coll === 'outbox')).toBe(true)
    expect((await t.device().act('ttc', 'setOrderTheme', 'TTC-2026-0160', 'x')).status).toBe(403)
  })
  it('device-only actions are refused', async () => {
    const a = await t.admin()
    expect((await a.act('ttc', 'setLang', 'ta')).body.error).toBe('device_only')
  })
})

describe('photographer flow', () => {
  const PHONE = '+91 91111 22222'
  const signup = { name: 'Lens Two', ownerName: 'Ravi', phone: PHONE, city: 'Madurai', logoUrl: 'data:image/png;base64,AA', plan: 'm1' }

  async function paidStudio() {
    const p = await t.withCode(PHONE, 'studio')
    expect((await p.get('/api/me')).body.verified).toBe('9111122222')
    const r = await p.act('studio', 'signupStudio', signup)
    expect(r.status).toBe(200)
    const studioId = r.body.result as string
    expect(r.body.me.studioId).toBe(studioId)
    const a = await t.admin()
    expect((await a.act('studio', 'markPaid', studioId, 'upi', '')).status).toBe(200)
    return { p, a, studioId }
  }

  it('sign-up needs a verified phone and cannot be done for someone else', async () => {
    expect((await t.device().act('studio', 'signupStudio', signup)).status).toBe(403)
    const p = await t.withCode(PHONE, 'studio')
    expect((await p.act('studio', 'signupStudio', { ...signup, phone: '9999999999' })).status).toBe(403)
  })

  it('project → upload → customer sees it live → picks → submit', async () => {
    const { p, studioId } = await paidStudio()
    const created = await p.act('os', 'createProject', studioId, { name: 'Anu & Vel', type: 'Wedding', clientNames: 'Anu & Vel', greetName: 'Anu', phone: '9876500000' })
    expect(created.status).toBe(200)
    const project = created.body.changes.find((c: any) => c.coll === 'projects').doc
    const eventId = project.galleryEventId as string
    expect(eventId).toBeTruthy()
    expect(created.body.changes.some((c: any) => c.coll === 'events' && c.id === eventId)).toBe(true)

    // Upload the files, then add the proof record.
    const form = multipart({ preview: jpeg(), thumb: jpeg() })
    const up = await t.app.inject({ method: 'POST', url: `/api/upload/proof/${eventId}/pf_one`, remoteAddress: '192.168.1.20', headers: { cookie: p.cookie, 'content-type': form.type }, payload: form.body })
    expect(up.statusCode).toBe(200)
    const { url, thumbUrl } = up.json()
    const proof = { id: 'pf_one', eventId, chapter: 'all', filename: 'DSC_0001', ext: 'NEF', source: 'raw', w: 2048, h: 1365, bytes: 10, originalBytes: 100, url, thumbUrl, sort: 0 }
    expect((await p.act('studio', 'addProofs', eventId, [proof])).status).toBe(200)
    expect((await p.act('studio', 'openEvent', eventId)).status).toBe(200)

    // Customer opens the link: brand and title first, then the PIN.
    const cust = t.device('192.168.1.40')
    const pre = (await cust.get(`/api/gate/${project.code}`)).body.changes
    expect(pre.find((c: any) => c.coll === 'projects').doc.pin).toBe('••••')
    expect(pre.find((c: any) => c.coll === 'studios').doc.name).toBe('Lens Two')
    expect(pre.find((c: any) => c.coll === 'studios').doc.phone).toBeUndefined()
    expect((await cust.get('/api/sync')).body.snapshot.proofs ?? []).toHaveLength(0)
    expect((await cust.post('/api/auth/gate', { code: project.code, pin: '0000' })).status).toBe(401)
    expect((await cust.post('/api/auth/gate', { code: project.code, pin: project.pin })).status).toBe(200)
    const snap = (await cust.get('/api/sync')).body.snapshot
    expect(snap.proofs.map((x: any) => x.id)).toEqual(['pf_one'])
    expect(snap.projects[0].doc.pin).toBe('••••')
    expect(snap.studios[0].doc.phone).toBeUndefined()
    const img = await t.app.inject({ method: 'GET', url, remoteAddress: '192.168.1.40', headers: { cookie: cust.cookie } })
    expect(img.statusCode).toBe(200)
    expect(img.headers['content-type']).toBe('image/jpeg')
    // The cover shows on the PIN screen; every other photo needs the PIN.
    expect((await t.device().get(url)).status).toBe(200)
    const form2 = multipart({ preview: jpeg(), thumb: jpeg() })
    const up2 = await t.app.inject({ method: 'POST', url: `/api/upload/proof/${eventId}/pf_two`, remoteAddress: '192.168.1.20', headers: { cookie: p.cookie, 'content-type': form2.type }, payload: form2.body })
    expect(up2.statusCode).toBe(200)
    expect((await t.device().get(up2.json().url)).status).toBe(404)
    expect((await t.app.inject({ method: 'GET', url: up2.json().url, remoteAddress: '192.168.1.40', headers: { cookie: cust.cookie } })).statusCode).toBe(200)

    // Pick and submit; the project stage follows.
    expect((await cust.act('studio', 'togglePick', eventId, 'pf_one', 'Anu')).status).toBe(200)
    const sub = await cust.act('studio', 'submitSelection', eventId)
    expect(sub.status).toBe(200)
    expect(sub.body.changes.find((c: any) => c.coll === 'events').doc.status).toBe('submitted')
    expect(sub.body.changes.find((c: any) => c.coll === 'projects')?.doc.stage).toBe('selection_received')
    // Locked after submit.
    expect((await cust.act('studio', 'togglePick', eventId, 'pf_one')).status).toBe(403)
    // The customer cannot do studio things.
    expect((await cust.act('studio', 'reopenEvent', eventId, 3)).status).toBe(403)
  })

  it('archiving deletes the preview files but keeps the proof records', async () => {
    const { p, studioId } = await paidStudio()
    const created = await p.act('os', 'createProject', studioId, { name: 'Old', type: 'Wedding', clientNames: 'Old', greetName: 'Old', phone: '9876500001' })
    const eventId = created.body.changes.find((c: any) => c.coll === 'projects').doc.galleryEventId as string
    const form = multipart({ preview: jpeg(), thumb: jpeg() })
    const up = await t.app.inject({ method: 'POST', url: `/api/upload/proof/${eventId}/pf_old`, remoteAddress: '192.168.1.20', headers: { cookie: p.cookie, 'content-type': form.type }, payload: form.body })
    const { url, thumbUrl } = up.json()
    const proof = { id: 'pf_old', eventId, chapter: 'all', filename: 'DSC_0009', ext: 'NEF', source: 'raw', w: 2048, h: 1365, bytes: 10, originalBytes: 100, url, thumbUrl, sort: 0 }
    expect((await p.act('studio', 'addProofs', eventId, [proof])).status).toBe(200)
    const file = t.ctx.media.proofFile(eventId, 'pf_old.jpg')
    expect(t.ctx.media.exists(file)).toBe(true)
    expect((await p.act('studio', 'archiveEvent', eventId)).status).toBe(200)
    expect(t.ctx.media.exists(file)).toBe(false)
    expect(t.ctx.docs.get('proofs', 'pf_old')?.filename).toBe('DSC_0009')
  })

  it('one studio cannot touch another studio', async () => {
    const { p } = await paidStudio()
    expect((await p.act('studio', 'openEvent', 'ev_sharma')).status).toBe(403)
    expect((await p.act('os', 'updateProject', 'pj_divya', { name: 'x' })).status).toBe(403)
    expect((await p.act('studio', 'markPaid', 'st_lens', 'upi', '')).status).toBe(403)
    const snap = (await p.get('/api/sync')).body.snapshot
    expect((snap.events ?? []).every((e: any) => e.doc.studioId !== 'st_lens')).toBe(true)
  })

  it('a studio cannot set its own payment or picker', async () => {
    const { p, studioId } = await paidStudio()
    expect((await p.act('studio', 'updateStudio', studioId, { sub: { plan: 'm12', payment: 'paid' } })).status).toBe(403)
    expect((await p.act('studio', 'updateStudio', studioId, { accent: '#ff0000' })).status).toBe(200)
  })
})

describe('media paths', () => {
  it('rejects path tricks', async () => {
    const a = await t.admin()
    expect((await a.get('/media/proofs/ev_sharma/..%2F..%2Fttc.db')).status).toBeGreaterThanOrEqual(400)
    expect((await a.get('/media/files/..%2Fsecret.jpg')).status).toBeGreaterThanOrEqual(400)
  })
})

function jpeg() {
  return Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1, 0xff, 0xd9])
}
function multipart(files: Record<string, Buffer>) {
  const b = '----ttcboundary'
  const parts: Buffer[] = []
  for (const [name, buf] of Object.entries(files)) {
    parts.push(Buffer.from(`--${b}\r\nContent-Disposition: form-data; name="${name}"; filename="${name}.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`), buf, Buffer.from('\r\n'))
  }
  parts.push(Buffer.from(`--${b}--\r\n`))
  return { type: `multipart/form-data; boundary=${b}`, body: Buffer.concat(parts) }
}
