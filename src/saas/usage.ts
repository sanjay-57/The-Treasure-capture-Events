import { planTotal, type Plan, type PlanKey, type Proof, type Studio, type StudioEvent, type StudioStatus } from './types'

/** Pure plan, subscription and usage rules, shared by the studio account page and the TTC admin wing. */

export const GRACE_DAYS = 7
const DAY = 86_400_000

export const monthKey = (iso: string | Date) => {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function storageBytes(studioId: string, events: StudioEvent[], proofs: Proof[]): number {
  const ids = new Set(events.filter(e => e.studioId === studioId && e.status !== 'archived').map(e => e.id))
  return proofs.reduce((n, p) => (ids.has(p.eventId) ? n + p.bytes : n), 0)
}

export const planOf = (plans: Plan[], key: PlanKey) => plans.find(p => p.key === key) ?? plans[0]

const ms = (iso?: string) => (iso ? new Date(iso).getTime() : NaN)

/** Paid and the term has not run out. */
const paidAndRunning = (studio: Studio, now: Date) => studio.sub.payment === 'paid' && ms(studio.sub.endsAt) > now.getTime()

/**
 * pending until TTC marks Paid · active while the paid term runs · paused when revoked or expired ·
 * cancelled on decline. The only stored status is cancelledAt.
 */
export function deriveStatus(studio: Studio, now = new Date()): StudioStatus {
  if (studio.cancelledAt) return 'cancelled'
  if (studio.sub.payment === 'pending') return 'pending'
  if (studio.sub.payment === 'revoked') return 'paused'
  return paidAndRunning(studio, now) ? 'active' : 'paused'
}

/** Expired on this date (paid term ran out), else undefined. */
export function expiredOn(studio: Studio, now = new Date()): string | undefined {
  return studio.sub.payment === 'paid' && studio.sub.endsAt && ms(studio.sub.endsAt) <= now.getTime() ? studio.sub.endsAt : undefined
}

/** Whole days left in the paid term (0 when not running). */
export function daysLeft(studio: Studio, now = new Date()): number {
  if (!paidAndRunning(studio, now)) return 0
  return Math.max(0, Math.ceil((ms(studio.sub.endsAt) - now.getTime()) / DAY))
}

/** Adds calendar months in UTC, clamping to the month end (31 Jan + 1 month = 28/29 Feb). */
export function addMonths(iso: string, months: number): string {
  const d = new Date(iso)
  const y = d.getUTCFullYear()
  const m = d.getUTCMonth() + months
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
  const out = new Date(Date.UTC(y, m, Math.min(d.getUTCDate(), last), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), d.getUTCMilliseconds()))
  return out.toISOString()
}

/** The term a payment starting at `startedAt` buys on the studio's chosen plan. */
export function termFor(studio: Studio, plans: Plan[], startedAt: string): { from: string; to: string; amount: number } {
  const plan = planOf(plans, studio.sub.plan)
  return { from: startedAt, to: addMonths(startedAt, plan.months), amount: planTotal(plan) }
}

/** When links started their grace countdown: the revoke time, or the end of the term. */
function stoppedAt(studio: Studio, now: Date): number {
  if (studio.cancelledAt) return NaN
  if (studio.sub.payment === 'revoked') return studio.sub.endsAt ? ms(studio.sub.changedAt) : NaN
  if (studio.sub.payment === 'paid' && !paidAndRunning(studio, now)) return ms(studio.sub.endsAt)
  return NaN
}

/** Client links work while paid and running, and for GRACE_DAYS after a revoke or expiry. */
export function linksLive(studio: Studio, now = new Date()): boolean {
  if (deriveStatus(studio, now) === 'active') return true
  const t = stoppedAt(studio, now)
  return !Number.isNaN(t) && now.getTime() - t < GRACE_DAYS * DAY
}

export function graceLeftDays(studio: Studio, now = new Date()): number {
  const t = stoppedAt(studio, now)
  if (Number.isNaN(t)) return 0
  return Math.max(0, Math.ceil((t + GRACE_DAYS * DAY - now.getTime()) / DAY))
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  const u = ['KB', 'MB', 'GB', 'TB']
  let v = n / 1024
  let i = 0
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024
    i++
  }
  return `${v >= 100 ? v.toFixed(0) : v.toFixed(1)} ${u[i]}`
}
