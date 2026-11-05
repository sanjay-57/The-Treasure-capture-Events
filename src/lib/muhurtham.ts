import type { Bi } from './i18n'

/*
 * Subha Muhurtham (auspicious wedding) days for 2026 and 2027, reconciled from
 * four published Tamil calendars (calendar.tamildot.com, tamildailycalendar.com,
 * dailycalendartamil.com, hallnect.com) on 2026-11-05. A day is listed only when
 * at least two of them agree. Valarpirai (waxing) / Theipirai (waning) is taken
 * from the sources where they agree and from the lunar phase where they differ.
 * The Tamil month and day follow tamildailycalendar.com (Vakya panchangam).
 * Families confirm the exact window with their own astrologer; this is a guide.
 */

export type TamilMonth =
  | 'chithirai' | 'vaikasi' | 'aani' | 'aadi' | 'aavani' | 'purattasi'
  | 'aippasi' | 'karthigai' | 'margazhi' | 'thai' | 'maasi' | 'panguni'

export type MoonPhase = 'valarpirai' | 'theipirai'

export interface Muhurtham {
  /** ISO date, local to Tamil Nadu. */
  date: string
  month: TamilMonth
  /** Day of the Tamil month. */
  day: number
  phase: MoonPhase
}

export const TAMIL_MONTHS: Record<TamilMonth, Bi> = {
  chithirai: { en: 'Chithirai', ta: 'சித்திரை' },
  vaikasi: { en: 'Vaikasi', ta: 'வைகாசி' },
  aani: { en: 'Aani', ta: 'ஆனி' },
  aadi: { en: 'Aadi', ta: 'ஆடி' },
  aavani: { en: 'Aavani', ta: 'ஆவணி' },
  purattasi: { en: 'Purattasi', ta: 'புரட்டாசி' },
  aippasi: { en: 'Aippasi', ta: 'ஐப்பசி' },
  karthigai: { en: 'Karthigai', ta: 'கார்த்திகை' },
  margazhi: { en: 'Margazhi', ta: 'மார்கழி' },
  thai: { en: 'Thai', ta: 'தை' },
  maasi: { en: 'Maasi', ta: 'மாசி' },
  panguni: { en: 'Panguni', ta: 'பங்குனி' },
}

export const MOON_PHASES: Record<MoonPhase, Bi> = {
  valarpirai: { en: 'Valarpirai', ta: 'வளர்பிறை' },
  theipirai: { en: 'Theipirai', ta: 'தேய்பிறை' },
}

export const MUHURTHAM_LABEL: Bi = { en: 'Subha Muhurtham', ta: 'சுப முகூர்த்தம்' }

const m = (date: string, month: TamilMonth, day: number, p: 'V' | 'T'): Muhurtham => ({ date, month, day, phase: p === 'V' ? 'valarpirai' : 'theipirai' })

/** Sorted ascending by date. */
export const MUHURTHAMS: readonly Muhurtham[] = [
  m('2026-01-28', 'thai', 14, 'V'),
  m('2026-02-06', 'thai', 23, 'T'),
  m('2026-02-08', 'thai', 25, 'T'),
  m('2026-02-13', 'maasi', 1, 'T'),
  m('2026-02-15', 'maasi', 3, 'T'),
  m('2026-02-16', 'maasi', 4, 'T'),
  m('2026-02-20', 'maasi', 8, 'V'),
  m('2026-03-05', 'maasi', 21, 'T'),
  m('2026-03-06', 'maasi', 22, 'T'),
  m('2026-03-08', 'maasi', 24, 'T'),
  m('2026-03-15', 'panguni', 1, 'T'),
  m('2026-03-16', 'panguni', 2, 'T'),
  m('2026-03-25', 'panguni', 11, 'V'),
  m('2026-04-06', 'panguni', 23, 'T'),
  m('2026-04-12', 'panguni', 29, 'T'),
  m('2026-04-13', 'panguni', 30, 'T'),
  m('2026-04-16', 'chithirai', 3, 'T'),
  m('2026-04-20', 'chithirai', 7, 'V'),
  m('2026-04-23', 'chithirai', 10, 'V'),
  m('2026-04-30', 'chithirai', 17, 'V'),
  m('2026-05-08', 'chithirai', 25, 'T'),
  m('2026-05-13', 'chithirai', 30, 'T'),
  m('2026-05-14', 'chithirai', 31, 'T'),
  m('2026-05-18', 'vaikasi', 4, 'V'),
  m('2026-05-28', 'vaikasi', 14, 'V'),
  m('2026-05-29', 'vaikasi', 15, 'V'),
  m('2026-06-04', 'vaikasi', 21, 'T'),
  m('2026-06-07', 'vaikasi', 24, 'T'),
  m('2026-06-17', 'aani', 3, 'V'),
  m('2026-06-18', 'aani', 4, 'V'),
  m('2026-06-24', 'aani', 10, 'V'),
  m('2026-06-25', 'aani', 11, 'V'),
  m('2026-07-02', 'aani', 18, 'T'),
  m('2026-07-05', 'aani', 21, 'T'),
  m('2026-07-12', 'aani', 28, 'T'),
  m('2026-08-23', 'aavani', 6, 'V'),
  m('2026-08-30', 'aavani', 13, 'T'),
  m('2026-08-31', 'aavani', 14, 'T'),
  m('2026-09-07', 'aavani', 21, 'T'),
  m('2026-09-13', 'aavani', 27, 'V'),
  m('2026-09-17', 'aavani', 31, 'V'),
  m('2026-10-25', 'aippasi', 8, 'V'),
  m('2026-10-30', 'aippasi', 13, 'T'),
  m('2026-11-01', 'aippasi', 15, 'T'),
  m('2026-11-11', 'aippasi', 25, 'V'),
  m('2026-11-13', 'aippasi', 27, 'V'),
  m('2026-11-15', 'aippasi', 29, 'V'),
  m('2026-11-16', 'aippasi', 30, 'V'),
  m('2026-11-20', 'karthigai', 4, 'V'),
  m('2026-11-29', 'karthigai', 13, 'T'),
  m('2026-12-04', 'karthigai', 18, 'T'),
  m('2026-12-06', 'karthigai', 20, 'T'),
  m('2026-12-10', 'karthigai', 24, 'V'),
  m('2026-12-13', 'karthigai', 27, 'V'),
  m('2026-12-14', 'karthigai', 28, 'V'),
  m('2027-01-20', 'thai', 6, 'V'),
  m('2027-01-28', 'thai', 14, 'T'),
  m('2027-02-08', 'thai', 25, 'V'),
  m('2027-02-10', 'thai', 27, 'V'),
  m('2027-02-11', 'thai', 28, 'V'),
  m('2027-02-18', 'maasi', 6, 'V'),
  m('2027-02-25', 'maasi', 13, 'T'),
  m('2027-02-26', 'maasi', 14, 'T'),
  m('2027-03-04', 'maasi', 20, 'T'),
  m('2027-03-10', 'maasi', 26, 'V'),
  m('2027-03-11', 'maasi', 27, 'V'),
  m('2027-03-17', 'panguni', 3, 'V'),
  m('2027-03-18', 'panguni', 4, 'V'),
  m('2027-03-24', 'panguni', 10, 'T'),
  m('2027-03-25', 'panguni', 11, 'T'),
  m('2027-04-01', 'panguni', 18, 'T'),
  m('2027-04-04', 'panguni', 21, 'T'),
  m('2027-04-11', 'panguni', 28, 'V'),
  m('2027-04-12', 'panguni', 29, 'V'),
  m('2027-04-18', 'chithirai', 5, 'V'),
  m('2027-04-23', 'chithirai', 10, 'T'),
  m('2027-04-26', 'chithirai', 13, 'T'),
  m('2027-05-03', 'chithirai', 20, 'T'),
  m('2027-05-09', 'chithirai', 26, 'V'),
  m('2027-05-12', 'chithirai', 29, 'V'),
  m('2027-05-16', 'vaikasi', 2, 'V'),
  m('2027-05-17', 'vaikasi', 3, 'V'),
  m('2027-05-23', 'vaikasi', 9, 'T'),
  m('2027-05-26', 'vaikasi', 12, 'T'),
  m('2027-05-27', 'vaikasi', 13, 'T'),
  m('2027-06-07', 'vaikasi', 24, 'V'),
  m('2027-06-10', 'vaikasi', 27, 'V'),
  m('2027-06-13', 'vaikasi', 30, 'V'),
  m('2027-06-24', 'aani', 10, 'T'),
  m('2027-06-25', 'aani', 11, 'T'),
  m('2027-07-05', 'aani', 21, 'V'),
  m('2027-07-09', 'aani', 25, 'V'),
  m('2027-07-14', 'aani', 30, 'V'),
  m('2027-08-20', 'aavani', 4, 'T'),
  m('2027-08-29', 'aavani', 13, 'T'),
  m('2027-09-03', 'aavani', 18, 'V'),
  m('2027-09-05', 'aavani', 20, 'V'),
  m('2027-09-12', 'aavani', 27, 'V'),
  m('2027-09-13', 'aavani', 28, 'V'),
  m('2027-10-20', 'aippasi', 3, 'T'),
  m('2027-10-22', 'aippasi', 5, 'T'),
  m('2027-10-27', 'aippasi', 10, 'T'),
  m('2027-11-01', 'aippasi', 15, 'V'),
  m('2027-11-05', 'aippasi', 19, 'V'),
  m('2027-11-10', 'aippasi', 24, 'V'),
  m('2027-11-11', 'aippasi', 25, 'V'),
  m('2027-11-18', 'karthigai', 2, 'T'),
  m('2027-11-25', 'karthigai', 9, 'T'),
  m('2027-12-02', 'karthigai', 16, 'V'),
  m('2027-12-08', 'karthigai', 22, 'V'),
  m('2027-12-09', 'karthigai', 23, 'V'),
]

const BY_DATE: ReadonlyMap<string, Muhurtham> = new Map(MUHURTHAMS.map(x => [x.date, x]))

/** Years the table covers; outside them `muhurthamOn` is simply unknown, not "no". */
export const MUHURTHAM_YEARS = [2026, 2027] as const

export const muhurthamOn = (iso: string): Muhurtham | undefined => BY_DATE.get(iso)

export const isMuhurtham = (iso: string): boolean => BY_DATE.has(iso)

/** The first `n` muhurtham days on or after `fromISO`. */
export function nextMuhurthams(fromISO: string, n = 1): Muhurtham[] {
  const out: Muhurtham[] = []
  for (const x of MUHURTHAMS) {
    if (x.date < fromISO) continue
    out.push(x)
    if (out.length >= n) break
  }
  return out
}

/** All muhurtham days in a given month (1-based). */
export const muhurthamsInMonth = (year: number, month: number): Muhurtham[] => {
  const prefix = `${year}-${String(month).padStart(2, '0')}-`
  return MUHURTHAMS.filter(x => x.date.startsWith(prefix))
}

/** "Aippasi 25 · Valarpirai" / "ஐப்பசி 25 · வளர்பிறை" */
export function muhurthamDetail(x: Muhurtham, lang: 'en' | 'ta'): string {
  return `${TAMIL_MONTHS[x.month][lang]} ${x.day} · ${MOON_PHASES[x.phase][lang]}`
}
