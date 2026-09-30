import type { Bi } from './i18n'
import {
  ADDONS, CROWDS, PACKAGES, TRAVEL_FREE_KM, TRAVEL_PER_KM, VENUES, eventByKey,
  type AddonKey, type CrowdKey, type DistrictKey, type EventKey, type PackageKey, type VenueType,
} from './data'

export interface QuoteInput {
  eventType: EventKey
  durationHours: number
  crowd: CrowdKey
  venueType: VenueType
  distanceKm: number
  packageId: PackageKey
  addons: AddonKey[]
}

export interface QuoteLine {
  label: Bi
  detail?: Bi
  amount: number
}

export interface Quote {
  lines: QuoteLine[]
  total: number
  travel: number
  /** True when the venue is outside the free travel radius. */
  far: boolean
}

export const MIN_HOURS = 2
export const MAX_HOURS = 14

export function computeQuote(q: QuoteInput): Quote {
  const ev = eventByKey(q.eventType)
  const lines: QuoteLine[] = []
  if (!ev) return { lines, total: 0, travel: 0, far: false }

  const hours = Math.max(MIN_HOURS, q.durationHours)
  lines.push({
    label: { en: `${ev.name.en} coverage`, ta: `${ev.name.ta} படப்பிடிப்பு` },
    detail: { en: `First ${MIN_HOURS} hours · unlimited digital photos`, ta: `முதல் ${MIN_HOURS} மணிநேரம் · எல்லையற்ற படங்கள்` },
    amount: ev.base,
  })
  if (hours > MIN_HOURS) {
    const extra = hours - MIN_HOURS
    lines.push({
      label: { en: `Extended coverage`, ta: `கூடுதல் நேரம்` },
      detail: { en: `${extra} h × ₹${ev.hourly.toLocaleString('en-IN')}`, ta: `${extra} மணி × ₹${ev.hourly.toLocaleString('en-IN')}` },
      amount: extra * ev.hourly,
    })
  }

  const crowd = CROWDS.find(c => c.key === q.crowd)
  if (crowd && crowd.add > 0) {
    lines.push({ label: { en: `Crowd · ${crowd.range} guests`, ta: `கூட்டம் · ${crowd.range} பேர்` }, detail: crowd.note, amount: crowd.add })
  }

  const venue = VENUES.find(v => v.key === q.venueType)
  if (venue && venue.add > 0) {
    lines.push({ label: { en: 'Mahal lighting kit', ta: 'மண்டப விளக்கு அமைப்பு' }, detail: venue.note, amount: venue.add })
  }

  const pkg = PACKAGES.find(p => p.key === q.packageId)
  if (pkg && pkg.add > 0) {
    lines.push({ label: { en: `${pkg.name.en} package`, ta: `${pkg.name.ta} தொகுப்பு` }, detail: pkg.pitch, amount: pkg.add })
  }

  for (const key of q.addons) {
    const a = ADDONS.find(x => x.key === key)
    if (a) lines.push({ label: a.name, detail: a.note, amount: a.price })
  }

  const far = q.distanceKm > TRAVEL_FREE_KM
  const travel = far ? Math.round((q.distanceKm - TRAVEL_FREE_KM) * TRAVEL_PER_KM / 100) * 100 : 0
  lines.push({
    label: { en: 'Travel', ta: 'பயணம்' },
    detail: far
      ? { en: `${q.distanceKm} km · beyond ${TRAVEL_FREE_KM} km free radius`, ta: `${q.distanceKm} கி.மீ · ${TRAVEL_FREE_KM} கி.மீ இலவச வரம்புக்கு அப்பால்` }
      : { en: `${q.distanceKm} km · within free radius`, ta: `${q.distanceKm} கி.மீ · இலவச வரம்புக்குள்` },
    amount: travel,
  })

  const total = lines.reduce((s, l) => s + l.amount, 0)
  return { lines, total, travel, far }
}

/** Starting price for an event with the Essential package, for marketing pages. */
export function startingPrice(eventType: EventKey): number {
  return eventByKey(eventType)?.base ?? 0
}

/**
 * Front-end stand-in for the Google Maps Distance Matrix call.
 * Deterministic per address so the same input always gives the same distance.
 * Replace with the backend /quote/distance endpoint.
 */
export function estimateDistanceKm(address: string, district: DistrictKey | ''): number {
  const a = address.trim().toLowerCase()
  if (!a) return 0
  if (district && a.includes(district)) return 6 + (hash(a) % 12)
  return 4 + (hash(a + district) % 58)
}

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}
