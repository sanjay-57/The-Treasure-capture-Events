import { describe, expect, it } from 'vitest'
import { overdueBalance, defaultMilestones, financeSummary, milestoneAmounts, projectMoney, quoteTotals, schedule, taxShareOfPaid } from './money'
import type { Milestone, ProjectPayment, Quote } from './types'

const q = (lines: [number, number][], extra: Partial<Quote> = {}): Quote => ({
  lines: lines.map(([qty, rate], i) => ({ id: `l${i}`, label: `L${i}`, qty, rate })),
  discount: 0,
  taxOn: true,
  taxPct: 18,
  ...extra,
})
const pay = (amount: number, at = '2026-10-01'): ProjectPayment => ({ id: `p${amount}${at}`, amount, mode: 'upi', at })

describe('quote totals', () => {
  it('adds lines, discount, 18% tax', () => {
    const t = quoteTotals(q([[1, 150000], [2, 25000]], { discount: 10000 }))
    expect(t.subtotal).toBe(200000)
    expect(t.taxable).toBe(190000)
    expect(t.tax).toBe(34200)
    expect(t.cgst + t.sgst).toBe(t.tax)
    expect(t.total).toBe(224200)
  })
  it('rounds tax once and splits CGST/SGST exactly', () => {
    const t = quoteTotals(q([[1, 999]]))
    expect(t.tax).toBe(180) // 179.82
    expect(t.cgst).toBe(90)
    expect(t.sgst).toBe(90)
    const odd = quoteTotals(q([[1, 1003]]))
    expect(odd.tax).toBe(181)
    expect(odd.cgst + odd.sgst).toBe(181)
  })
  it('tax off, discount capped at subtotal, negatives ignored', () => {
    const t = quoteTotals(q([[1, 1000], [-2, 500]], { taxOn: false, discount: 5000 }))
    expect(t).toMatchObject({ subtotal: 1000, discount: 1000, tax: 0, total: 0 })
  })
})

describe('milestones', () => {
  it('default schedule covers the total exactly', () => {
    const a = milestoneAmounts(defaultMilestones(), 224200)
    expect(a).toEqual([56050, 56050, 89680, 22420])
    expect(a.reduce((x, y) => x + y)).toBe(224200)
  })
  it('never asks for more than the total', () => {
    const ms: Milestone[] = [
      { id: 'a', label: 'A', mode: 'amount', value: 80000 },
      { id: 'b', label: 'B', mode: 'pct', value: 50 },
    ]
    expect(milestoneAmounts(ms, 100000)).toEqual([80000, 20000])
  })
  it('reports a gap when no rest milestone', () => {
    const s = schedule([{ id: 'a', label: 'A', mode: 'pct', value: 30 }], 100000, [])
    expect(s.gap).toBe(70000)
  })
  it('applies payments oldest first and marks states', () => {
    const ms = defaultMilestones('2026-10-20')
    const s = schedule(ms, 100000, [pay(25000), pay(10000)], new Date('2026-11-05T12:00:00'))
    expect(s.rows.map(r => [r.amount, r.paid, r.state])).toEqual([
      [25000, 25000, 'paid'],
      [25000, 10000, 'partial'],
      [40000, 0, 'overdue'],
      [10000, 0, 'upcoming'],
    ])
    expect(overdueBalance(s)).toBe(40000)
  })
})

describe('project money', () => {
  it('outstanding, credit, next due', () => {
    const p = { quote: q([[1, 100000]], { taxOn: false }), milestones: defaultMilestones(), payments: [pay(30000)] }
    const m = projectMoney(p)
    expect(m.outstanding).toBe(70000)
    expect(m.paidRatio).toBeCloseTo(0.3)
    expect(m.next?.milestone.label).toBe('Balance to 50%')
    expect(m.next?.balance).toBe(20000)
    const over = projectMoney({ ...p, payments: [pay(120000)] })
    expect(over).toMatchObject({ outstanding: 0, credit: 20000 })
    expect(over.next).toBeUndefined()
  })
  it('finance summary skips cancelled', () => {
    const base = { quote: q([[1, 100000]]), milestones: defaultMilestones(), payments: [pay(50000)] }
    const s = financeSummary([{ ...base, status: 'active' }, { ...base, status: 'cancelled' }])
    expect(s).toMatchObject({ booked: 118000, collected: 50000, outstanding: 68000, tax: 18000 })
  })
})

describe('finance roll-ups', () => {
  const mk = (id: string, status: 'active' | 'cancelled', payments: ProjectPayment[]) => ({ id, name: id, status, quote: q([[1, 100000]]), milestones: defaultMilestones(), payments })
  const ps = [
    mk('a', 'active', [pay(50000, '2026-10-03'), pay(10000.4, '2026-11-01T10:00:00.000Z')]),
    mk('b', 'active', [pay(20000, '2026-11-04'), pay(-5, '2026-11-04')]),
    mk('c', 'cancelled', [pay(9999, '2026-11-02')]),
  ]
  it('collects payments across live projects, skipping cancelled and negative ones', () => {
    expect(financeSummary(ps).collected).toBe(80000)
  })
  it('GST inside paid amount', () => {
    expect(taxShareOfPaid({ tax: 18000, total: 118000, paid: 59000 })).toBe(9000)
    expect(taxShareOfPaid({ tax: 18000, total: 118000, paid: 200000 })).toBe(18000)
    expect(taxShareOfPaid({ tax: 0, total: 0, paid: 10 })).toBe(0)
    expect(financeSummary(ps).taxCollected).toBe(taxShareOfPaid({ tax: 18000, total: 118000, paid: 60000 }) + taxShareOfPaid({ tax: 18000, total: 118000, paid: 20000 }))
  })
})
