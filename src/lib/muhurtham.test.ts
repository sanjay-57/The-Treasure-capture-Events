import { describe, expect, it } from 'vitest'
import { MUHURTHAMS, isMuhurtham, muhurthamDetail, muhurthamOn, muhurthamsInMonth, nextMuhurthams } from './muhurtham'

describe('muhurtham table', () => {
  it('is sorted, unique and dated within the covered years', () => {
    const dates = MUHURTHAMS.map(x => x.date)
    expect([...dates].sort()).toEqual(dates)
    expect(new Set(dates).size).toBe(dates.length)
    for (const d of dates) expect(d).toMatch(/^202[67]-\d{2}-\d{2}$/)
  })

  it('looks up a known Karthigai muhurtham', () => {
    const x = muhurthamOn('2026-11-20')
    expect(x).toMatchObject({ month: 'karthigai', day: 4, phase: 'valarpirai' })
    expect(muhurthamDetail(x!, 'en')).toBe('Karthigai 4 · Valarpirai')
    expect(muhurthamDetail(x!, 'ta')).toBe('கார்த்திகை 4 · வளர்பிறை')
    expect(isMuhurtham('2026-11-21')).toBe(false)
  })

  it('finds the next muhurtham on or after a date', () => {
    expect(nextMuhurthams('2026-11-05', 2).map(x => x.date)).toEqual(['2026-11-11', '2026-11-13'])
    expect(nextMuhurthams('2026-11-11')[0].date).toBe('2026-11-11')
    expect(nextMuhurthams('2028-01-01')).toEqual([])
  })

  it('lists no days in Aadi, Purattasi or Margazhi', () => {
    for (const x of MUHURTHAMS) expect(['aadi', 'purattasi', 'margazhi']).not.toContain(x.month)
    expect(muhurthamsInMonth(2027, 1).map(x => x.date)).toEqual(['2027-01-20', '2027-01-28'])
  })
})
