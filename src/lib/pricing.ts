import type { Bi } from './i18n'
import { TRAVEL_FREE_KM, TRAVEL_PER_KM, eventByKey, type DistrictKey, type EventKey } from './data'
import {
  CATALOGUE, DEFAULT_PRICES, SECTION_META, cartEntries, tierCart,
  type Cart, type CatalogueId, type FixedTier, type PriceMap, type Section,
} from './catalogue'

/*
 * The quote engine. A cart (tier + sessions + item quantities) and the
 * resolved price map go in; itemised lines grouped by section come out.
 * Orders snapshot the result, so later catalogue edits never move an
 * existing bill — the admin re-quotes explicitly when that is wanted.
 */

export type LineSection = Section | 'travel' | 'adjustment' | 'tax'

export interface QuoteLine {
  label: Bi
  detail?: Bi
  amount: number
  section: LineSection
  /** Catalogue item behind the line, when there is one. */
  id?: CatalogueId
  qty?: number
  unitPrice?: number
}

export interface Adjustment {
  id: string
  /** Free text the studio typed, e.g. "Festive discount" or "Extra travel day". */
  label: string
  /** Negative for discounts. */
  amount: number
  at: string
}

export interface QuoteInput {
  eventType: EventKey
  cart: Cart
  distanceKm: number
  adjustments?: Adjustment[]
  /** GST percentage applied on the subtotal after adjustments; 0 = not charged. */
  gstPct?: number
}

export interface SectionTotal {
  key: LineSection
  name: Bi
  amount: number
  lines: QuoteLine[]
}

export interface Quote {
  lines: QuoteLine[]
  sections: SectionTotal[]
  /** Catalogue items + travel, before adjustments and tax. */
  subtotal: number
  adjustments: number
  tax: number
  total: number
  travel: number
  /** True when the venue is outside the free travel radius. */
  far: boolean
}

const SECTION_ORDER: LineSection[] = ['crew', 'special', 'addon', 'deliverable', 'travel', 'adjustment', 'tax']

const EXTRA_SECTION_NAMES: Record<'travel' | 'adjustment' | 'tax', Bi> = {
  travel: { en: 'Travel', ta: 'பயணம்' },
  adjustment: { en: 'Adjustments', ta: 'சரிசெய்தல்கள்' },
  tax: { en: 'Tax', ta: 'வரி' },
}

export const sectionName = (key: LineSection): Bi => (key in SECTION_META ? SECTION_META[key as Section].name : EXTRA_SECTION_NAMES[key as 'travel'])

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`

export function computeQuote(q: QuoteInput, prices: PriceMap = DEFAULT_PRICES): Quote {
  const lines: QuoteLine[] = []
  const sessions = Math.max(1, q.cart.sessions)

  for (const { item, qty } of cartEntries(q.cart)) {
    const unit = prices[item.id]
    let amount = 0
    let detail: Bi | undefined = item.note
    if (item.unit === 'session') {
      amount = unit * qty * sessions
      detail = {
        en: `${qty} × ${sessions} session${sessions > 1 ? 's' : ''}`,
        ta: `${qty} × ${sessions} அமர்வு`,
      }
    } else if (item.unit === 'included') {
      amount = 0
    } else {
      amount = unit * qty
      if (qty > 1) detail = { en: `${qty} × ${inr(unit)}`, ta: `${qty} × ${inr(unit)}` }
    }
    lines.push({ label: item.name, detail, amount, section: item.section, id: item.id, qty, unitPrice: unit })
  }

  const far = q.distanceKm > TRAVEL_FREE_KM
  const travel = far ? Math.round(((q.distanceKm - TRAVEL_FREE_KM) * TRAVEL_PER_KM) / 100) * 100 : 0
  if (q.distanceKm > 0) {
    lines.push({
      section: 'travel',
      label: { en: 'Travel', ta: 'பயணம்' },
      detail: far
        ? { en: `${q.distanceKm} km · beyond ${TRAVEL_FREE_KM} km free radius`, ta: `${q.distanceKm} கி.மீ · ${TRAVEL_FREE_KM} கி.மீ இலவச வரம்புக்கு அப்பால்` }
        : { en: `${q.distanceKm} km · within free radius`, ta: `${q.distanceKm} கி.மீ · இலவச வரம்புக்குள்` },
      amount: travel,
    })
  }

  const subtotal = lines.reduce((s, l) => s + l.amount, 0)

  let adjustments = 0
  for (const a of q.adjustments ?? []) {
    adjustments += a.amount
    lines.push({ section: 'adjustment', label: { en: a.label, ta: a.label }, amount: a.amount })
  }

  const gstPct = q.gstPct ?? 0
  const tax = gstPct > 0 ? Math.round(((subtotal + adjustments) * gstPct) / 100) : 0
  if (tax > 0) lines.push({ section: 'tax', label: { en: `GST ${gstPct}%`, ta: `GST ${gstPct}%` }, amount: tax })

  const sections: SectionTotal[] = SECTION_ORDER.map(key => {
    const own = lines.filter(l => l.section === key)
    return { key, name: sectionName(key), amount: own.reduce((s, l) => s + l.amount, 0), lines: own }
  }).filter(s => s.lines.length > 0)

  return { lines, sections, subtotal, adjustments, tax, total: subtotal + adjustments + tax, travel, far }
}

/** Price of a fixed tier for an event, one session, no travel. */
export function tierPrice(eventType: EventKey, tier: FixedTier, prices: PriceMap = DEFAULT_PRICES, sessions = 1): number {
  const ev = eventByKey(eventType)
  if (!ev) return 0
  return computeQuote({ eventType, cart: tierCart(ev.tiers, tier, sessions), distanceKm: 0 }, prices).total
}

/** "From" price for an event, for marketing pages: the Basic tier. */
export function startingPrice(eventType: EventKey, prices: PriceMap = DEFAULT_PRICES): number {
  return tierPrice(eventType, 'basic', prices)
}

/** Lines whose section is a catalogue section (what the customer configured). */
export const catalogueLines = (q: Quote) => q.lines.filter(l => CATALOGUE.some(i => i.id === l.id))

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
