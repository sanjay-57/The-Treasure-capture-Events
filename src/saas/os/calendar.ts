/** Month grid for the project calendar. Pure: tested in calendar.test.ts. Weeks start on Monday. */

export interface GridDay {
  /** YYYY-MM-DD */
  iso: string
  day: number
  inMonth: boolean
}

const pad = (n: number) => String(n).padStart(2, '0')
const isoOf = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`

/** month is 0-based. Returns whole weeks (4–6 rows of 7) covering the month. */
export function monthGrid(year: number, month: number): GridDay[][] {
  const first = new Date(Date.UTC(year, month, 1))
  const lead = (first.getUTCDay() + 6) % 7
  const daysIn = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const cells = Math.ceil((lead + daysIn) / 7) * 7
  const weeks: GridDay[][] = []
  for (let i = 0; i < cells; i++) {
    const d = new Date(Date.UTC(year, month, 1 - lead + i))
    if (i % 7 === 0) weeks.push([])
    weeks[weeks.length - 1].push({ iso: isoOf(d), day: d.getUTCDate(), inMonth: d.getUTCMonth() === month })
  }
  return weeks
}

/** Adds n months to a {year, month} pair. */
export function shiftMonth(year: number, month: number, n: number): { year: number; month: number } {
  const t = year * 12 + month + n
  return { year: Math.floor(t / 12), month: ((t % 12) + 12) % 12 }
}

/** Monday-start ISO week range containing `today` (inclusive), as YYYY-MM-DD strings. */
export function weekRange(today: Date): { from: string; to: string } {
  const d = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()))
  const lead = (d.getUTCDay() + 6) % 7
  const from = new Date(d.getTime() - lead * 86_400_000)
  const to = new Date(from.getTime() + 6 * 86_400_000)
  return { from: isoOf(from), to: isoOf(to) }
}
