import type { Milestone, Project, ProjectPayment, Quote } from './types'

/**
 * All project money maths. Whole rupees everywhere; every rounding happens
 * here so the studio panel, the client portal and printed documents agree.
 */

export const round = (n: number) => Math.round(n)

export interface QuoteTotals {
  subtotal: number
  discount: number
  taxable: number
  taxPct: number
  tax: number
  /** Intra-state GST split. cgst + sgst === tax exactly. */
  cgst: number
  sgst: number
  total: number
}

export const lineTotal = (qty: number, rate: number) => round(Math.max(0, qty) * Math.max(0, rate))

export function quoteTotals(q: Quote): QuoteTotals {
  const subtotal = q.lines.reduce((n, l) => n + lineTotal(l.qty, l.rate), 0)
  const discount = Math.min(subtotal, Math.max(0, round(q.discount)))
  const taxable = subtotal - discount
  const taxPct = q.taxOn ? Math.max(0, q.taxPct) : 0
  const tax = round((taxable * taxPct) / 100)
  const cgst = Math.floor(tax / 2)
  return { subtotal, discount, taxable, taxPct, tax, cgst, sgst: tax - cgst, total: taxable + tax }
}

export type MilestoneState = 'paid' | 'partial' | 'overdue' | 'due' | 'upcoming'

export interface MilestoneRow {
  milestone: Milestone
  amount: number
  /** Running total due up to and including this milestone. */
  cumulative: number
  paid: number
  balance: number
  state: MilestoneState
}

export interface Schedule {
  rows: MilestoneRow[]
  total: number
  /** Sum of milestone amounts. Equals total when the schedule is complete. */
  scheduled: number
  /** total − scheduled: positive = not covered by any milestone, negative = schedule asks for more than the total. */
  gap: number
}

/** Milestone amounts in order. Never asks for more than the total; `rest` takes what's left. */
export function milestoneAmounts(milestones: Milestone[], total: number): number[] {
  let cum = 0
  return milestones.map(m => {
    const left = Math.max(0, total - cum)
    let a: number
    if (m.mode === 'pct') a = round((total * m.value) / 100)
    else if (m.mode === 'amount') a = round(m.value)
    else if (m.mode === 'upto') a = round((total * m.value) / 100) - cum
    else a = left
    a = Math.min(Math.max(0, a), left)
    cum += a
    return a
  })
}

const DAY = 86_400_000
const dayOf = (iso: string) => Math.floor(new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso).getTime() / DAY)

/** Payments are applied to milestones oldest first. Anything beyond the total is `credit`. */
export function schedule(milestones: Milestone[], total: number, payments: ProjectPayment[], today = new Date()): Schedule {
  const amounts = milestoneAmounts(milestones, total)
  let pool = paidTotal(payments)
  let cum = 0
  const todayDay = Math.floor(today.getTime() / DAY)
  let firstOpen = true
  const rows = milestones.map((m, i) => {
    const amount = amounts[i]
    cum += amount
    const paid = Math.min(amount, pool)
    pool -= paid
    const balance = amount - paid
    let state: MilestoneState
    if (balance === 0) state = 'paid'
    else if (m.dueDate && dayOf(m.dueDate) < todayDay) state = 'overdue'
    else if (paid > 0) state = 'partial'
    else state = firstOpen ? 'due' : 'upcoming'
    if (balance > 0) firstOpen = false
    return { milestone: m, amount, cumulative: cum, paid, balance, state }
  })
  const scheduled = amounts.reduce((n, a) => n + a, 0)
  return { rows, total, scheduled, gap: total - scheduled }
}

/** Unpaid balance of milestones past their due date. */
export const overdueBalance = (sch: Schedule) => sch.rows.reduce((n, r) => n + (r.state === 'overdue' ? r.balance : 0), 0)

export const paidTotal = (payments: ProjectPayment[]) => payments.reduce((n, p) => n + Math.max(0, round(p.amount)), 0)

export interface ProjectMoney extends QuoteTotals {
  paid: number
  outstanding: number
  /** Paid beyond the total (refund or carry over). */
  credit: number
  /** 0–1 */
  paidRatio: number
  schedule: Schedule
  /** First milestone with a balance, or undefined when fully paid. */
  next?: MilestoneRow
}

export function projectMoney(p: Pick<Project, 'quote' | 'milestones' | 'payments'>, today = new Date()): ProjectMoney {
  const t = quoteTotals(p.quote)
  const paid = paidTotal(p.payments)
  const sch = schedule(p.milestones, t.total, p.payments, today)
  return {
    ...t,
    paid,
    outstanding: Math.max(0, t.total - paid),
    credit: Math.max(0, paid - t.total),
    paidRatio: t.total > 0 ? Math.min(1, paid / t.total) : 0,
    schedule: sch,
    next: sch.rows.find(r => r.balance > 0),
  }
}

/** Studio-wide finance roll-up for the Finances page. */
export function financeSummary(projects: Pick<Project, 'quote' | 'milestones' | 'payments' | 'status'>[], today = new Date()) {
  let booked = 0
  let collected = 0
  let outstanding = 0
  let overdue = 0
  let tax = 0
  let taxCollected = 0
  for (const p of projects) {
    if (p.status === 'cancelled') continue
    const m = projectMoney(p, today)
    booked += m.total
    collected += m.paid
    outstanding += m.outstanding
    tax += m.tax
    taxCollected += taxShareOfPaid(m)
    overdue += overdueBalance(m.schedule)
  }
  return { booked, collected, outstanding, overdue, tax, taxCollected }
}

/** Standard four-step schedule from the brief: Advance → Balance to 50% → Event Day → On Delivery. */
export function defaultMilestones(eventDate?: string): Milestone[] {
  return [
    { id: 'm_adv', label: 'Advance', mode: 'pct', value: 25 },
    { id: 'm_50', label: 'Balance to 50%', mode: 'upto', value: 50 },
    { id: 'm_day', label: 'Event Day', mode: 'upto', value: 90, dueDate: eventDate },
    { id: 'm_del', label: 'On Delivery', mode: 'rest', value: 0 },
  ]
}

/** GST inside what has been paid so far (pro rata, capped at the full tax; credit carries no tax). */
export function taxShareOfPaid(m: Pick<ProjectMoney, 'tax' | 'total' | 'paid'>): number {
  if (m.total <= 0 || m.tax <= 0) return 0
  return Math.min(m.tax, round((m.tax * Math.min(m.paid, m.total)) / m.total))
}
