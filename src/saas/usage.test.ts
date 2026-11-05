import { describe, expect, it } from 'vitest'
import { addMonths, daysLeft, deriveStatus, expiredOn, formatBytes, graceLeftDays, linksLive, termFor } from './usage'
import { planTotal, type Plan, type Studio, type Subscription } from './types'

const plans: Plan[] = [
  { key: 'm1', name: '1 month', months: 1, pricePerMonth: 1300 },
  { key: 'm6', name: '6 months', months: 6, pricePerMonth: 999 },
  { key: 'm12', name: '12 months', months: 12, pricePerMonth: 899 },
]
const studio = (sub: Partial<Subscription> = {}, over: Partial<Studio> = {}): Studio => ({
  id: 's1', name: 'S', slug: 's', ownerName: 'O', phone: '1', whatsapp: '1', city: 'Madurai', logoUrl: 'data:,', accent: '#000', watermark: '© S',
  lang: 'en', defaultQuota: 100, defaultWindowDays: 14, createdAt: '2026-09-10T00:00:00Z', onboarded: true, notes: '',
  sub: { plan: 'm1', payment: 'pending', changedAt: '2026-09-10T00:00:00Z', ...sub }, ...over,
})
const paid = (startedAt: string, endsAt: string) => studio({ payment: 'paid', startedAt, endsAt, changedAt: startedAt })
const at = (iso: string) => new Date(iso)

describe('subscription', () => {
  it('plan totals are 1300 / 5994 / 10788', () => {
    expect(plans.map(planTotal)).toEqual([1300, 5994, 10788])
  })
  it('derives status across pending, paid, expired, revoked and cancelled', () => {
    expect(deriveStatus(studio())).toBe('pending')
    const s = paid('2026-10-01T00:00:00.000Z', '2026-11-01T00:00:00.000Z')
    expect(deriveStatus(s, at('2026-10-20T00:00:00Z'))).toBe('active')
    expect(deriveStatus(s, at('2026-11-02T00:00:00Z'))).toBe('paused')
    expect(expiredOn(s, at('2026-11-02T00:00:00Z'))).toBe('2026-11-01T00:00:00.000Z')
    expect(deriveStatus(studio({ payment: 'revoked' }))).toBe('paused')
    expect(deriveStatus(paid('2026-10-01T00:00:00Z', '2027-10-01T00:00:00Z'), at('2026-10-02T00:00:00Z'))).toBe('active')
    expect(deriveStatus(studio({}, { cancelledAt: '2026-10-01T00:00:00Z' }))).toBe('cancelled')
  })
  it('counts days left in the term', () => {
    const s = paid('2026-10-01T00:00:00Z', '2026-11-01T00:00:00Z')
    expect(daysLeft(s, at('2026-10-21T00:00:00Z'))).toBe(11)
    expect(daysLeft(s, at('2026-11-05T00:00:00Z'))).toBe(0)
    expect(daysLeft(studio())).toBe(0)
  })
  it('keeps links live for 7 days after expiry or revoke, never while pending', () => {
    const s = paid('2026-10-01T00:00:00Z', '2026-11-01T00:00:00Z')
    expect(linksLive(s, at('2026-10-15T00:00:00Z'))).toBe(true)
    expect(linksLive(s, at('2026-11-05T00:00:00Z'))).toBe(true)
    expect(graceLeftDays(s, at('2026-11-05T00:00:00Z'))).toBe(3)
    expect(linksLive(s, at('2026-11-09T00:00:00Z'))).toBe(false)
    const r = studio({ payment: 'revoked', startedAt: '2026-10-01T00:00:00Z', endsAt: '2027-10-01T00:00:00Z', changedAt: '2026-11-01T00:00:00Z' })
    expect(linksLive(r, at('2026-11-04T00:00:00Z'))).toBe(true)
    expect(linksLive(r, at('2026-11-10T00:00:00Z'))).toBe(false)
    expect(linksLive(studio())).toBe(false)
    expect(graceLeftDays(studio())).toBe(0)
  })
  it('term dates for 1, 6 and 12 months, with month-end rollover', () => {
    const start = '2026-01-31T10:00:00.000Z'
    expect(termFor(studio({ plan: 'm1' }), plans, start)).toEqual({ from: start, to: '2026-02-28T10:00:00.000Z', amount: 1300 })
    expect(termFor(studio({ plan: 'm6' }), plans, start)).toEqual({ from: start, to: '2026-07-31T10:00:00.000Z', amount: 5994 })
    expect(termFor(studio({ plan: 'm12' }), plans, start)).toEqual({ from: start, to: '2027-01-31T10:00:00.000Z', amount: 10788 })
    expect(addMonths('2027-12-31T00:00:00.000Z', 2)).toBe('2028-02-29T00:00:00.000Z')
    expect(addMonths('2026-08-31T00:00:00.000Z', 1)).toBe('2026-09-30T00:00:00.000Z')
  })
  it('formats bytes', () => {
    expect(formatBytes(340 * 1024 * 1024)).toBe('340 MB')
    expect(formatBytes(1536)).toBe('1.5 KB')
  })
})
