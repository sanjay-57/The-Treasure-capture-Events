import type { Bi } from './i18n'
import { TRAVEL_FREE_KM, TRAVEL_PER_KM, eventByKey, type DistrictKey, type EventKey } from './data'
import { districtCentre, roadKmFromStudio, type LatLng } from './geo'
import {
  BUNDLES, CATALOGUE, CATALOGUE_BY_ID, DEFAULT_PRICES, SECTION_META,
  bundlePrice, cartEntries, cartHours, coverageFor, droneMultiplier, packageBaseItems, presetName, presetSum, presetTarget, tierCart, withIncluded,
  type BundleGroup, type Cart, type CatalogueId, type Coverage, type FixedTier, type PriceMap, type Section,
} from './catalogue'

/*
 * The quote engine. A cart (package + hours + item quantities) and the
 * resolved price map go in; itemised lines grouped by section come out.
 *
 * Order of operations for crew: bundle first, then the hours multiplier.
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
  /** Negative lines the invoice styles as savings. */
  kind?: 'saving'
  /** Candid bundle the saving line belongs to. */
  bundle?: BundleGroup
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

export interface PackageInfo {
  key: FixedTier
  name: Bi
  target: number
  saving: number
  /** Package items the customer took out. */
  removed: CatalogueId[]
  /** Items the customer added on top. */
  added: CatalogueId[]
  /** "Gold package + Drone − Calendar" */
  label: Bi
  variant?: number
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
  coverage: Coverage
  package?: PackageInfo
}

const SECTION_ORDER: LineSection[] = ['crew', 'special', 'addon', 'deliverable', 'travel', 'adjustment', 'tax']

const EXTRA_SECTION_NAMES: Record<'travel' | 'adjustment' | 'tax', Bi> = {
  travel: { en: 'Travel', ta: 'பயணம்' },
  adjustment: { en: 'Adjustments', ta: 'சரிசெய்தல்கள்' },
  tax: { en: 'Tax', ta: 'வரி' },
}

export const sectionName = (key: LineSection): Bi => (key in SECTION_META ? SECTION_META[key as Section].name : EXTRA_SECTION_NAMES[key as 'travel'])

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`

const multDetail = (m: number, h: number): Bi => ({ en: `× ${m.toFixed(2)} (${h} h)`, ta: `× ${m.toFixed(2)} (${h} மணி நேரம்)` })

export function computeQuote(q: QuoteInput, prices: PriceMap = DEFAULT_PRICES): Quote {
  const lines: QuoteLine[] = []
  const coverage = coverageFor(cartHours(q.cart))
  const mult = coverage.multiplier

  for (const { item, qty } of cartEntries(q.cart)) {
    const unit = prices[item.id]
    let amount = 0
    let detail: Bi | undefined = item.note
    if (item.unit === 'session') {
      const m = item.noMini ? droneMultiplier(coverage.hours) : mult
      amount = Math.round(unit * qty * m)
      detail = multDetail(m, coverage.hours)
    } else if (item.unit === 'included' || item.onRequest) {
      amount = 0
    } else {
      amount = unit * qty
      if (qty > 1) detail = { en: `${qty} × ${inr(unit)}`, ta: `${qty} × ${inr(unit)}` }
    }
    lines.push({ label: item.name, detail, amount, section: item.section, id: item.id, qty, unitPrice: unit })
  }

  // Candid bundles: one line per style above, then one negative saving line per group.
  for (const g of Object.keys(BUNDLES) as BundleGroup[]) {
    const ids = CATALOGUE.filter(i => i.bundle === g && (q.cart.items[i.id] ?? 0) > 0).map(i => i.id)
    if (ids.length < 2) continue
    const { saving } = bundlePrice(g, ids, prices)
    if (saving <= 0) continue
    lines.push({
      section: 'crew', kind: 'saving', bundle: g,
      label: { en: 'Candid bundle saving', ta: 'கேண்டிட் தொகுப்புச் சேமிப்பு' },
      detail: { en: `${BUNDLES[g].name.en} · ${ids.length} styles`, ta: `${BUNDLES[g].name.ta} · ${ids.length} பாணிகள்` },
      amount: -Math.round(saving * mult),
    })
  }

  // Package saving: target − sum of the package's items, as long as the package is intact.
  const pkg = packageInfo(q.eventType, q.cart, prices)
  if (pkg && pkg.saving !== 0) {
    lines.push({
      section: 'crew', kind: 'saving',
      label: { en: 'Package saving', ta: 'தொகுப்புச் சேமிப்பு' },
      detail: { en: `${pkg.name.en} · ${inr(pkg.target)} for the set`, ta: `${pkg.name.ta} · தொகுப்பிற்கு ${inr(pkg.target)}` },
      amount: pkg.saving,
    })
  }

  const far = q.distanceKm > TRAVEL_FREE_KM
  const travel = far ? Math.round(((q.distanceKm - TRAVEL_FREE_KM) * TRAVEL_PER_KM) / 100) * 100 : 0
  if (q.distanceKm > 0) {
    lines.push({
      section: 'travel',
      label: { en: 'Travel', ta: 'பயணம்' },
      detail: far
        ? { en: `About ${q.distanceKm} km by road · beyond ${TRAVEL_FREE_KM} km free radius`, ta: `சாலை வழியாகச் சுமார் ${q.distanceKm} கி.மீ · ${TRAVEL_FREE_KM} கி.மீ இலவச வரம்புக்கு அப்பால்` }
        : { en: `About ${q.distanceKm} km by road · within free radius`, ta: `சாலை வழியாகச் சுமார் ${q.distanceKm} கி.மீ · இலவச வரம்புக்குள்` },
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

  return { lines, sections, subtotal, adjustments, tax, total: subtotal + adjustments + tax, travel, far, coverage, package: pkg }
}

/**
 * How the cart relates to the package it started from. Undefined for custom
 * carts and for presets without a target.
 */
export function packageInfo(eventType: EventKey, cart: Cart, prices: PriceMap = DEFAULT_PRICES): PackageInfo | undefined {
  if (cart.tier === 'custom') return undefined
  const ev = eventByKey(eventType)
  if (!ev) return undefined
  // The cart remembers which package family it came from; old carts fall back to the event's.
  const spec = !cart.kind || cart.kind === ev.tiers.kind ? ev.tiers : { kind: cart.kind }
  const variant = cart.variant
  const target = presetTarget(spec, cart.tier, variant)
  if (target === undefined) return undefined
  const base = withIncluded(packageBaseItems(spec, cart.tier, variant))
  const removed = (Object.keys(base) as CatalogueId[]).filter(id => CATALOGUE_BY_ID[id].unit !== 'included' && (base[id] ?? 0) > 0 && (cart.items[id] ?? 0) === 0)
  const added = (Object.keys(cart.items) as CatalogueId[]).filter(id => CATALOGUE_BY_ID[id].unit !== 'included' && (cart.items[id] ?? 0) > 0 && (base[id] ?? 0) === 0)
  const saving = target - presetSum(spec, cart.tier, prices, variant)
  const name = presetName(spec, cart.tier)
  const label: Bi = {
    en: [`${name.en} package`, ...added.map(id => `+ ${CATALOGUE_BY_ID[id].name.en}`), ...removed.map(id => `− ${CATALOGUE_BY_ID[id].name.en}`)].join(' '),
    ta: [`${name.ta} தொகுப்பு`, ...added.map(id => `+ ${CATALOGUE_BY_ID[id].name.ta}`), ...removed.map(id => `− ${CATALOGUE_BY_ID[id].name.ta}`)].join(' '),
  }
  return { key: cart.tier, name, target, saving, removed, added, label, variant }
}

/** Price of a package for an event, one 4-hour session, no travel. */
export function tierPrice(eventType: EventKey, tier: FixedTier, prices: PriceMap = DEFAULT_PRICES, sessions = 1): number {
  const ev = eventByKey(eventType)
  if (!ev) return 0
  return computeQuote({ eventType, cart: tierCart(ev.tiers, tier, sessions), distanceKm: 0 }, prices).total
}

/** "From" price for an event, for marketing pages: the Bronze package. */
export function startingPrice(eventType: EventKey, prices: PriceMap = DEFAULT_PRICES): number {
  return tierPrice(eventType, 'basic', prices)
}

/** Lines whose section is a catalogue section (what the customer configured). */
export const catalogueLines = (q: Quote) => q.lines.filter(l => CATALOGUE.some(i => i.id === l.id))

/**
 * Travel estimate in road km from the studio: straight line × 1.3 to the
 * venue pin, or to the district's headquarters town when there is no pin.
 * 0 when neither is known. The studio confirms the actual route on the call;
 * a Distance Matrix key would replace this (roadmap 6.5).
 */
export function estimateDistanceKm(pin: LatLng | undefined, district: DistrictKey | ''): number {
  const to = pin ?? districtCentre(district)
  return to ? roadKmFromStudio(to) : 0
}
