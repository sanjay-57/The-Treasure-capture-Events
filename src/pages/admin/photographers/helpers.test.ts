import { describe, expect, it } from 'vitest'
import type { Activity, Plan, Proof, Studio, StudioEvent, Subscription } from '../../../saas/types'
import { paidText, filterRows, lastMonths, monthLabel, reminderText, sortRows, studioLastActivity, studioRow, studiosPerPlan, usageSeries, wingTotals, type WingData } from './helpers'

const NOW = new Date(2026, 10, 15, 12) // 15 Nov 2026
const plans: Plan[] = [
  { key: 'm1', name: '1 month', months: 1, pricePerMonth: 1300 },
  { key: 'm6', name: '6 months', months: 6, pricePerMonth: 999 },
]
const PAID: Subscription = { plan: 'm1', payment: 'paid', startedAt: '2026-11-01T00:00:00.000Z', endsAt: '2026-12-01T00:00:00.000Z', changedAt: '2026-11-01T00:00:00.000Z' }
const studio = (id: string, patch: Partial<Studio> = {}): Studio => ({
  id, name: `Studio ${id}`, slug: id, ownerName: 'Arun Prakash', phone: '+91 90000 11111', whatsapp: '+91 90000 11111', city: 'Madurai', logoUrl: 'data:,', accent: '#000000',
  watermark: '', lang: 'en', defaultQuota: 100, defaultWindowDays: 14, sub: PAID, createdAt: '2026-08-01T00:00:00.000Z',
  onboarded: true, notes: '', ...patch,
})
const ev = (id: string, studioId: string, openedAt?: string, extra: Partial<StudioEvent> = {}): StudioEvent => ({
  id, studioId, code: id, title: id, date: '2026-10-01', clientNames: '', clientPhone: '', lang: 'en', quota: 10, deadline: '2026-12-01',
  status: openedAt ? 'open' : 'draft', chapters: [], createdAt: '2026-09-01T00:00:00.000Z', openedAt, ...extra,
})

describe('months', () => {
  it('lists the last n months oldest first, across a year boundary', () => {
    expect(lastMonths(3, NOW)).toEqual(['2026-09', '2026-10', '2026-11'])
    expect(lastMonths(3, new Date(2026, 0, 31))).toEqual(['2025-11', '2025-12', '2026-01'])
  })
  it('labels a month', () => {
    expect(monthLabel('2026-11')).toMatch(/Nov/)
    expect(monthLabel('2026-11')).toMatch(/2026/)
  })
})

describe('usage', () => {
  const events = [
    ev('a', 's1', new Date(2026, 10, 2).toISOString()),
    ev('b', 's1', new Date(2026, 10, 9).toISOString()),
    ev('c', 's1', new Date(2026, 9, 9).toISOString()),
    ev('d', 's1'),
    ev('e', 's2', new Date(2026, 10, 3).toISOString()),
  ]
  it('counts galleries opened per month for one studio', () => {
    expect(usageSeries('s1', events, 3, NOW)).toEqual([
      { month: '2026-09', count: 0 },
      { month: '2026-10', count: 1 },
      { month: '2026-11', count: 2 },
    ])
  })
  it('finds the latest activity across log and event timestamps', () => {
    const activity: Activity[] = [{ id: 'x', eventId: 'c', kind: 'opened', at: '2026-11-20T00:00:00.000Z' }]
    expect(studioLastActivity('s1', events, activity)).toBe('2026-11-20T00:00:00.000Z')
    expect(studioLastActivity('s1', events, [])).toBe(new Date(2026, 10, 9).toISOString())
    expect(studioLastActivity('nobody', events, activity)).toBeUndefined()
  })
})

describe('rows', () => {
  const studios = [
    studio('s1', { name: 'Lens & Light', sub: { ...PAID, plan: 'm6' } }),
    studio('s2', { name: 'Kural Frames', sub: { ...PAID, payment: 'revoked', changedAt: new Date(2026, 10, 12).toISOString() }, phone: '+91 94430 22222' }),
    studio('s3', { name: 'Nila Weddings', sub: { plan: 'm6', payment: 'pending', changedAt: '2026-11-14T00:00:00.000Z' }, createdAt: '2026-11-14T00:00:00.000Z' }),
    studio('s4', { name: 'Gone', cancelledAt: '2026-10-01T00:00:00.000Z' }),
  ]
  const events = [ev('a', 's1', new Date(2026, 10, 2).toISOString()), ev('k', 's2', new Date(2026, 10, 4).toISOString())]
  const proofs = [{ id: 'p1', eventId: 'a', bytes: 1000 }, { id: 'p2', eventId: 'k', bytes: 500 }] as Proof[]
  const data: WingData = { studios, events, proofs, activity: [], terms: [], plans }
  const rows = studios.map(s => studioRow(s, data, NOW))

  it('builds a row with derived status, days left and the amount due', () => {
    const r = rows[0]
    expect(r.status).toBe('active')
    expect(r.clients).toBe(1)
    expect(r.daysLeft).toBe(16)
    expect(r.storage).toBe(1000)
    expect(r.due).toBe(0)
    expect(rows[1].status).toBe('paused')
    expect(rows[1].due).toBe(1300) // revoked: renewal due
    expect(rows[2].due).toBe(5994) // pending: first term due
    expect(rows[3].status).toBe('cancelled')
    expect(rows[3].due).toBe(0)
  })
  it('sorts by due and by newest', () => {
    expect(sortRows(rows, 'due')[0].studio.id).toBe('s3')
    expect(sortRows(rows, 'newest')[0].studio.id).toBe('s3')
    expect(sortRows(rows, 'name').map(r => r.studio.name)).toEqual(['Gone', 'Kural Frames', 'Lens & Light', 'Nila Weddings'])
  })
  it('filters by status, text and phone digits', () => {
    expect(filterRows(rows, '', 'paused').map(r => r.studio.id)).toEqual(['s2'])
    expect(filterRows(rows, 'nila', 'all').map(r => r.studio.id)).toEqual(['s3'])
    expect(filterRows(rows, '94430', 'all').map(r => r.studio.id)).toEqual(['s2'])
    expect(filterRows(rows, 'madurai', 'active')).toHaveLength(1)
  })
  it('totals the wing, leaving cancelled studios out of dues and storage', () => {
    const t = wingTotals({ ...data, terms: [{ id: 't', studioId: 's1', plan: 'm6', amount: 5994, from: '', to: '', paidAt: '', mode: 'upi', note: '' }] }, NOW)
    expect(t).toMatchObject({ active: 1, pending: 1, paused: 1, expiringSoon: 0, galleriesThisMonth: 2, awaitingSelection: 2, storage: 1500, collected: 5994 })
    expect(t.dues).toBe(1300 + 5994)
    expect(studiosPerPlan(studios)).toEqual({ m6: 2, m1: 1 })
  })
})

describe('messages', () => {
  const s = studio('s1', { name: 'Lens & Light' })
  it('quotes the term, monthly price and total', () => {
    const txt = paidText(s, plans[1], '2027-05-01T00:00:00.000Z', 'TC Studio')
    expect(txt).toContain('Hi Arun')
    expect(txt).toContain('₹999/month')
    expect(txt).toContain('₹5,994')
    expect(txt).toMatch(/2027/)
  })
  it('writes a reminder with the amount due', () => {
    expect(reminderText(s, plans[0], 'TC Studio')).toContain('₹1,300')
  })
})
