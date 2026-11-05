import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { EMPTY_DRAFT } from '../../src/lib/store'
import { STORES } from '../src/engine/stores'
import { sha256 } from '../src/util'
import { boot } from './helpers'

let t: Awaited<ReturnType<typeof boot>>
beforeEach(async () => {
  t = await boot()
})
afterEach(async () => {
  await t.close()
})

/** Stands in for an open EventSource: records what the hub writes. */
function tab(cookie: string) {
  const writes: string[] = []
  const res: any = { writeHead() {}, write: (s: string) => writes.push(s), on() {}, end() {} }
  const tok = cookie.split('=')[1]
  t.ctx.hub.attach(res, tok ? sha256(tok) : undefined, undefined)
  const events = (name: string) => writes.filter(w => w.includes(`event: ${name}\n`)).map(w => JSON.parse(w.split('data: ')[1]))
  return { writes, events }
}

describe('live updates', () => {
  it('the customer tab hears new proofs; a stranger tab and another studio do not', async () => {
    const studio = await t.withCode('+91 90000 11111', 'studio') // demo studio st_lens
    expect((await studio.get('/api/me')).body.studioId).toBe('st_lens')
    const cust = t.device('192.168.1.50')
    expect((await cust.post('/api/auth/gate', { code: 'demo4821', pin: '2026' })).status).toBe(200)
    const custTab = tab(cust.cookie)
    const strangerTab = tab('')
    const other = await t.withCode('+91 93333 44444', 'studio')
    const otherTab = tab(other.cookie)

    const proof = { id: 'pf_live', eventId: 'ev_sharma', chapter: 'all', filename: 'DSC_9', ext: 'JPG', source: 'jpeg', w: 10, h: 10, bytes: 1, originalBytes: 1, url: 'https://images.unsplash.com/x', sort: 99 }
    expect((await studio.act('studio', 'addProofs', 'ev_sharma', [proof])).status).toBe(200)

    const got = custTab.events('changes').flatMap(e => e.changes)
    expect(got.some((c: any) => c.coll === 'proofs' && c.id === 'pf_live')).toBe(true)
    expect(strangerTab.events('changes')).toHaveLength(0)
    expect(otherTab.events('changes')).toHaveLength(0)

    // The studio's tab sees the couple's heart.
    const studioTab = tab(studio.cookie)
    await cust.act('studio', 'togglePick', 'ev_sharma', 'pf_live', 'Divya')
    const picks = studioTab.events('changes').flatMap(e => e.changes).find((c: any) => c.coll === 'picks')
    expect(picks.doc.some((p: any) => p.proofId === 'pf_live')).toBe(true)
  })

  it('admin tabs get login codes as they are made', async () => {
    const a = await t.admin()
    const adminTab = tab(a.cookie)
    await t.device().post('/api/auth/code/request', { phone: '+91 98765 43210', purpose: 'customer' })
    const codes = adminTab.events('code')
    expect(codes).toHaveLength(1)
    expect(codes[0].code).toMatch(/^\d{4}$/)
    expect(codes[0].name).toBe('Priya & Karthik')
  })

  it('new orders are listed first', async () => {
    const d = t.device()
    const ids: string[] = []
    for (const contact of ['+91 90000 00001', '+91 90000 00002']) {
      STORES.ttc.setState({ draft: { ...EMPTY_DRAFT } })
      STORES.ttc.getState().updateDraft({ district: 'madurai', eventType: 'wedding', venueAddress: 'x', name: 'N', contact })
      ids.push((await d.act('ttc', 'submitEnquiry', structuredClone(STORES.ttc.getState().draft))).body.result)
    }
    expect(new Set(ids).size).toBe(2)
    const a = await t.admin()
    const orders = (await a.get('/api/sync')).body.snapshot.orders.map((o: any) => o.id)
    expect(orders.slice(0, 2)).toEqual([ids[1], ids[0]])
  })
})
