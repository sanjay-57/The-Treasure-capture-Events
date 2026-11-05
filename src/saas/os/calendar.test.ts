import { describe, expect, it } from 'vitest'
import { monthGrid, shiftMonth, weekRange } from './calendar'

describe('calendar', () => {
  it('Nov 2026 grid starts on Monday 26 Oct and covers the month', () => {
    const g = monthGrid(2026, 10)
    expect(g[0][0]).toEqual({ iso: '2026-10-26', day: 26, inMonth: false })
    expect(g.every(w => w.length === 7)).toBe(true)
    const inMonth = g.flat().filter(d => d.inMonth)
    expect(inMonth).toHaveLength(30)
    expect(inMonth[0].iso).toBe('2026-11-01')
    expect(g[g.length - 1][6].iso).toBe('2026-12-06')
  })
  it('Feb 2027 starting Monday fits 4 weeks', () => {
    expect(monthGrid(2027, 1)).toHaveLength(4)
  })
  it('shifts months across years', () => {
    expect(shiftMonth(2026, 11, 1)).toEqual({ year: 2027, month: 0 })
    expect(shiftMonth(2026, 0, -1)).toEqual({ year: 2025, month: 11 })
  })
  it('week range', () => {
    expect(weekRange(new Date(2026, 10, 5))).toEqual({ from: '2026-11-02', to: '2026-11-08' })
  })
})
