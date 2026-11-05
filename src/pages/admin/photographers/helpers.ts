import { planTotal, type Activity, type Plan, type Proof, type Studio, type StudioEvent, type StudioStatus, type StudioTerm } from '../../../saas/types'
import { daysLeft, deriveStatus, monthKey, planOf, storageBytes } from '../../../saas/usage'

/**
 * Pure helpers for the TTC admin Photographers wing. No React, no store, so
 * they run under vitest in node.
 */

/** The last `n` calendar months as YYYY-MM, oldest first, ending with the month of `now`. */
export function lastMonths(n: number, now = new Date()): string[] {
  const out: string[] = []
  const d = new Date(now.getFullYear(), now.getMonth(), 1)
  for (let i = n - 1; i >= 0; i--) out.push(monthKey(new Date(d.getFullYear(), d.getMonth() - i, 1)))
  return out
}

/** Galleries a studio opened to clients in a calendar month (shown as usage; plans do not cap it). */
export function clientsInMonth(studioId: string, events: StudioEvent[], month: string): number {
  return events.filter(e => e.studioId === studioId && e.openedAt && monthKey(e.openedAt) === month).length
}

/** Galleries opened per month for the last `n` months, oldest first. */
export function usageSeries(studioId: string, events: StudioEvent[], n = 6, now = new Date()): { month: string; count: number }[] {
  return lastMonths(n, now).map(month => ({ month, count: clientsInMonth(studioId, events, month) }))
}

/** "2026-11" → "Nov 2026" (or "Nov" with short). */
export function monthLabel(month: string, short = false): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, (m || 1) - 1, 1)
  return d.toLocaleDateString('en-IN', short ? { month: 'short' } : { month: 'short', year: 'numeric' })
}

/** Latest thing that happened in any of the studio's events (activity log or event timestamps). */
export function studioLastActivity(studioId: string, events: StudioEvent[], activity: Activity[]): string | undefined {
  const mine = events.filter(e => e.studioId === studioId)
  const ids = new Set(mine.map(e => e.id))
  let best: string | undefined
  const bump = (iso?: string) => {
    if (iso && (!best || iso > best)) best = iso
  }
  for (const a of activity) if (ids.has(a.eventId)) bump(a.at)
  for (const e of mine) [e.createdAt, e.openedAt, e.submittedAt, e.reopenedAt, e.closedAt, e.archivedAt].forEach(bump)
  return best
}

export interface StudioRow {
  studio: Studio
  status: StudioStatus
  plan: Plan
  /** Galleries opened this month. */
  clients: number
  daysLeft: number
  storage: number
  lastActivity?: string
  /** Plan total owed: waiting for the first payment, or revoked/expired and waiting for renewal. */
  due: number
  events: number
}

export interface WingData {
  studios: Studio[]
  events: StudioEvent[]
  proofs: Proof[]
  activity: Activity[]
  terms: StudioTerm[]
  plans: Plan[]
}

export function studioRow(studio: Studio, d: WingData, now = new Date()): StudioRow {
  const plan = planOf(d.plans, studio.sub.plan)
  const status = deriveStatus(studio, now)
  return {
    studio,
    status,
    plan,
    clients: clientsInMonth(studio.id, d.events, monthKey(now)),
    daysLeft: daysLeft(studio, now),
    storage: storageBytes(studio.id, d.events, d.proofs),
    lastActivity: studioLastActivity(studio.id, d.events, d.activity),
    due: status === 'pending' || status === 'paused' ? planTotal(plan) : 0,
    events: d.events.filter(e => e.studioId === studio.id).length,
  }
}

export type StudioSort = 'name' | 'due' | 'usage' | 'activity' | 'storage' | 'newest'
export type StatusFilter = 'all' | StudioStatus

/** Pending first in a status sort; otherwise by the chosen key with name as tie-break. */
export function sortRows(rows: StudioRow[], by: StudioSort): StudioRow[] {
  const name = (a: StudioRow, b: StudioRow) => a.studio.name.localeCompare(b.studio.name)
  const cmp: Record<StudioSort, (a: StudioRow, b: StudioRow) => number> = {
    name,
    due: (a, b) => b.due - a.due,
    usage: (a, b) => b.clients - a.clients,
    activity: (a, b) => (b.lastActivity ?? '').localeCompare(a.lastActivity ?? ''),
    storage: (a, b) => b.storage - a.storage,
    newest: (a, b) => b.studio.createdAt.localeCompare(a.studio.createdAt),
  }
  return [...rows].sort((a, b) => cmp[by](a, b) || name(a, b))
}

export function filterRows(rows: StudioRow[], q: string, status: StatusFilter): StudioRow[] {
  const needle = q.trim().toLowerCase()
  const qDigits = needle.replace(/\D/g, '')
  return rows.filter(r => {
    if (status !== 'all' && r.status !== status) return false
    if (!needle) return true
    const s = r.studio
    const hay = [s.name, s.ownerName, s.city, s.email ?? '', s.slug].join(' ').toLowerCase()
    return hay.includes(needle) || (qDigits.length >= 3 && s.phone.replace(/\D/g, '').includes(qDigits))
  })
}

/** Totals for the admin overview tile row. */
export function wingTotals(d: WingData, now = new Date()) {
  const month = monthKey(now)
  const rows = d.studios.map(s => studioRow(s, d, now))
  const live = rows.filter(r => r.status !== 'cancelled')
  const count = (st: StudioStatus) => rows.filter(r => r.status === st).length
  return {
    active: count('active'),
    pending: count('pending'),
    paused: count('paused'),
    /** Active studios whose term ends within 14 days. */
    expiringSoon: rows.filter(r => r.status === 'active' && r.daysLeft <= 14).length,
    galleriesThisMonth: d.events.filter(e => e.openedAt && monthKey(e.openedAt) === month && live.some(r => r.studio.id === e.studioId)).length,
    /** Galleries open to the client and not yet submitted, across studios that are not cancelled. */
    awaitingSelection: d.events.filter(e => e.status === 'open' && live.some(r => r.studio.id === e.studioId)).length,
    storage: live.reduce((n, r) => n + r.storage, 0),
    dues: live.reduce((n, r) => n + r.due, 0),
    collected: d.terms.reduce((n, t) => n + t.amount, 0),
  }
}

/** How many studios (not cancelled) sit on each plan. */
export function studiosPerPlan(studios: Studio[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const s of studios) if (!s.cancelledAt) out[s.sub.plan] = (out[s.sub.plan] ?? 0) + 1
  return out
}

const firstName = (s: Studio) => s.ownerName.split(/\s+/)[0] || s.ownerName
const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`
const day = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

/** "6 months at ₹999/month (₹5,994)" */
export const planLine = (plan: Plan) => `${plan.name} at ${inr(plan.pricePerMonth)}/month (${inr(planTotal(plan))})`

export function paidText(studio: Studio, plan: Plan, endsAt: string, product: string): string {
  return `Hi ${firstName(studio)}, payment received for ${studio.name} on ${product}: ${planLine(plan)}. Your account is active until ${day(endsAt)}. Sign in with this number to set up your brand and open your first gallery. – The Treasure Capture Events`
}

export function reminderText(studio: Studio, plan: Plan, product: string): string {
  return `Hi ${firstName(studio)}, a gentle reminder from The Treasure Capture Events: ${inr(planTotal(plan))} is due for your ${product} plan (${planLine(plan)}). You can pay by UPI or bank transfer and reply here once done. Thank you!`
}

export function revokedText(studio: Studio, graceDays: number, product: string): string {
  return `Hi ${firstName(studio)}, your ${product} account for ${studio.name} is on hold because the payment is not confirmed. Client gallery links keep working for ${graceDays} days. Pay the renewal and we will switch it back on right away. – The Treasure Capture Events`
}
