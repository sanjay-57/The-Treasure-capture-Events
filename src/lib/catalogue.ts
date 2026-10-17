import type { Bi } from './i18n'
import type { IconName } from '../components/Icon'

/*
 * The studio's rate card — the single source of truth for everything that
 * carries a price. The cart, the fixed tiers, the live quote and the invoice
 * are all built from these rows, so an admin price edit flows everywhere.
 *
 * Rows mirror `Catalouge ttcs.xlsx` (28 items). Items flagged `pending` were
 * mentioned by the client in the discovery call but are not in the sheet yet;
 * their prices are placeholders to confirm before launch.
 */

export type Section = 'crew' | 'addon' | 'deliverable' | 'special'

export type CatalogueId =
  // Base crew — priced per unit, per session (one session ≈ 4–5 hours)
  | 'trad_photo' | 'trad_video' | 'candid_photo' | 'candid_video'
  // Add-on services
  | 'drone' | 'einvite' | 'ledwall' | 'photobooth' | 'selfie360'
  // Deliverables — albums (one per cart), frames (any quantity), prints
  | 'album_25' | 'album_30' | 'album_35' | 'album_40' | 'album_50' | 'album_60'
  | 'frame_12x18' | 'frame_16x24' | 'frame_20x30' | 'frame_24x36'
  | 'pframe_12x18' | 'pframe_16x24' | 'pframe_20x30' | 'pframe_24x36'
  | 'magazine' | 'minibook' | 'calendar'
  // Deliverables included with every booking
  | 'soft_all' | 'soft_edited' | 'trad_film' | 'candid_film'
  // Special shoots — priced per shoot
  | 'prepost_wedding' | 'outdoor_couple' | 'outdoor_baby' | 'outdoor_maternity' | 'model_portfolio' | 'commercial_shoot'

/** Items that are mutually exclusive — the cart keeps one of each group. */
export type ExclusiveGroup = 'album'

export interface CatalogueItem {
  id: CatalogueId
  section: Section
  name: Bi
  note?: Bi
  /** Rupees. Zero means included at no charge. */
  price: number
  /** How the price multiplies: per session × headcount, per piece, per shoot, or not at all. */
  unit: 'session' | 'each' | 'shoot' | 'included'
  /** Only one item from the group can be in the cart. */
  group?: ExclusiveGroup
  /** Upper bound for the quantity stepper. */
  max?: number
  /** Price still to be confirmed with the studio. */
  pending?: boolean
  icon: IconName
  /** Row in the client's Excel sheet, for the audit trail. */
  excelRow?: number
}

export const CATALOGUE: CatalogueItem[] = [
  // ── Base crew ─────────────────────────────────────────────────────────────
  { id: 'trad_photo', section: 'crew', unit: 'session', max: 4, price: 8000, icon: 'camera', excelRow: 1,
    name: { en: 'Traditional photography', ta: 'பாரம்பரிய புகைப்படம்' }, note: { en: 'Stage, rituals and family portraits', ta: 'மேடை, சடங்குகள், குடும்பப் படங்கள்' } },
  { id: 'trad_video', section: 'crew', unit: 'session', max: 4, price: 10000, icon: 'film', excelRow: 2,
    name: { en: 'Traditional videography', ta: 'பாரம்பரிய வீடியோ' }, note: { en: 'Full-length coverage of the function', ta: 'விழாவின் முழு நீள வீடியோ' } },
  { id: 'candid_photo', section: 'crew', unit: 'session', max: 4, price: 12000, icon: 'sparkle', excelRow: 3,
    name: { en: 'Candid photography', ta: 'கேண்டிட் புகைப்படம்' }, note: { en: 'Unposed, storytelling frames', ta: 'இயல்பான, கதை சொல்லும் படங்கள்' } },
  { id: 'candid_video', section: 'crew', unit: 'session', max: 4, price: 20000, icon: 'play', excelRow: 4,
    name: { en: 'Candid videography', ta: 'கேண்டிட் வீடியோ' }, note: { en: 'Cinematic coverage for the highlight film', ta: 'ஹைலைட் படத்திற்கான சினிமா பாணி' } },

  // ── Add-ons ───────────────────────────────────────────────────────────────
  { id: 'drone', section: 'addon', unit: 'each', max: 1, price: 6000, icon: 'drone', excelRow: 5,
    name: { en: 'Drone coverage', ta: 'ட்ரோன் படப்பிடிப்பு' }, note: { en: 'Aerial stills & video', ta: 'வான்வழி படங்கள் & வீடியோ' } },
  { id: 'einvite', section: 'addon', unit: 'each', max: 1, price: 1500, icon: 'mail', excelRow: 6,
    name: { en: 'E-invite', ta: 'மின் அழைப்பிதழ்' }, note: { en: 'Designed digital invitation', ta: 'வடிவமைக்கப்பட்ட டிஜிட்டல் அழைப்பு' } },
  { id: 'ledwall', section: 'addon', unit: 'each', max: 1, price: 12000, icon: 'maximize', excelRow: 7,
    name: { en: 'LED wall · 6×8 ft', ta: 'LED திரை · 6×8 அடி' }, note: { en: 'Live feed for guests', ta: 'விருந்தினர்களுக்கு நேரலை' } },
  { id: 'photobooth', section: 'addon', unit: 'each', max: 1, price: 12000, icon: 'image', excelRow: 8,
    name: { en: 'Photo booth', ta: 'போட்டோ பூத்' }, note: { en: 'Instant printed keepsakes', ta: 'உடனடி அச்சிட்ட நினைவுப் படங்கள்' } },
  { id: 'selfie360', section: 'addon', unit: 'each', max: 1, price: 14000, icon: 'refresh', excelRow: 9,
    name: { en: '360° selfie booth', ta: '360° செல்ஃபி பூத்' }, note: { en: 'Slow-motion spinning videos', ta: 'சுழலும் ஸ்லோ-மோஷன் வீடியோ' } },

  // ── Deliverables · albums (₹500 per sheet) ────────────────────────────────
  { id: 'album_25', section: 'deliverable', unit: 'each', group: 'album', price: 10000, icon: 'book', excelRow: 10,
    name: { en: 'Album · up to 25 sheets', ta: 'ஆல்பம் · 25 தாள் வரை' } },
  { id: 'album_30', section: 'deliverable', unit: 'each', group: 'album', price: 15000, icon: 'book', excelRow: 11,
    name: { en: 'Album · 30 sheets', ta: 'ஆல்பம் · 30 தாள்' } },
  { id: 'album_35', section: 'deliverable', unit: 'each', group: 'album', price: 17500, icon: 'book', excelRow: 12,
    name: { en: 'Album · 35 sheets', ta: 'ஆல்பம் · 35 தாள்' } },
  { id: 'album_40', section: 'deliverable', unit: 'each', group: 'album', price: 20000, icon: 'book', excelRow: 13,
    name: { en: 'Album · 40 sheets', ta: 'ஆல்பம் · 40 தாள்' } },
  { id: 'album_50', section: 'deliverable', unit: 'each', group: 'album', price: 25000, icon: 'book', excelRow: 14,
    name: { en: 'Album · 50 sheets', ta: 'ஆல்பம் · 50 தாள்' } },
  { id: 'album_60', section: 'deliverable', unit: 'each', group: 'album', price: 30000, icon: 'book', excelRow: 15,
    name: { en: 'Album · 60 sheets', ta: 'ஆல்பம் · 60 தாள்' } },

  // ── Deliverables · frames ─────────────────────────────────────────────────
  { id: 'frame_12x18', section: 'deliverable', unit: 'each', max: 10, price: 1200, icon: 'image', excelRow: 16,
    name: { en: 'Frame · 12×18 in', ta: 'பிரேம் · 12×18 அங்குலம்' } },
  { id: 'frame_16x24', section: 'deliverable', unit: 'each', max: 10, price: 2200, icon: 'image', excelRow: 17,
    name: { en: 'Frame · 16×24 in', ta: 'பிரேம் · 16×24 அங்குலம்' } },
  { id: 'frame_20x30', section: 'deliverable', unit: 'each', max: 10, price: 3500, icon: 'image', excelRow: 18,
    name: { en: 'Frame · 20×30 in', ta: 'பிரேம் · 20×30 அங்குலம்' } },
  { id: 'frame_24x36', section: 'deliverable', unit: 'each', max: 10, price: 5000, icon: 'image', excelRow: 19,
    name: { en: 'Frame · 24×36 in', ta: 'பிரேம் · 24×36 அங்குலம்' } },
  { id: 'pframe_12x18', section: 'deliverable', unit: 'each', max: 10, price: 1900, icon: 'gem', pending: true,
    name: { en: 'Premium frame · 12×18 in', ta: 'பிரீமியம் பிரேம் · 12×18' }, note: { en: 'Acrylic / glass finish', ta: 'அக்ரிலிக் / கண்ணாடி' } },
  { id: 'pframe_16x24', section: 'deliverable', unit: 'each', max: 10, price: 3500, icon: 'gem', pending: true,
    name: { en: 'Premium frame · 16×24 in', ta: 'பிரீமியம் பிரேம் · 16×24' }, note: { en: 'Acrylic / glass finish', ta: 'அக்ரிலிக் / கண்ணாடி' } },
  { id: 'pframe_20x30', section: 'deliverable', unit: 'each', max: 10, price: 5600, icon: 'gem', pending: true,
    name: { en: 'Premium frame · 20×30 in', ta: 'பிரீமியம் பிரேம் · 20×30' }, note: { en: 'Acrylic / glass finish', ta: 'அக்ரிலிக் / கண்ணாடி' } },
  { id: 'pframe_24x36', section: 'deliverable', unit: 'each', max: 10, price: 8000, icon: 'gem', pending: true,
    name: { en: 'Premium frame · 24×36 in', ta: 'பிரீமியம் பிரேம் · 24×36' }, note: { en: 'Acrylic / glass finish', ta: 'அக்ரிலிக் / கண்ணாடி' } },

  // ── Deliverables · prints ─────────────────────────────────────────────────
  { id: 'magazine', section: 'deliverable', unit: 'each', max: 10, price: 2500, icon: 'rows', excelRow: 20,
    name: { en: 'Magazine', ta: 'மேகசின்' }, note: { en: 'Editorial-style printed magazine', ta: 'இதழ் பாணி அச்சு' } },
  { id: 'minibook', section: 'deliverable', unit: 'each', max: 10, price: 3500, icon: 'book', pending: true,
    name: { en: 'Mini book', ta: 'மினி புத்தகம்' }, note: { en: 'Pocket-size album for parents', ta: 'பெற்றோருக்கான சிறிய ஆல்பம்' } },
  { id: 'calendar', section: 'deliverable', unit: 'each', max: 10, price: 1500, icon: 'calendar', pending: true,
    name: { en: 'Calendar', ta: 'காலண்டர்' }, note: { en: 'Desk or wall calendar', ta: 'மேசை / சுவர் காலண்டர்' } },

  // ── Included with every booking ───────────────────────────────────────────
  { id: 'soft_all', section: 'deliverable', unit: 'included', price: 0, icon: 'grid', excelRow: 21,
    name: { en: 'All photos · soft copies', ta: 'அனைத்துப் படங்கள் · சாஃப்ட் காப்பி' }, note: { en: 'Every frame we shoot, unedited', ta: 'எடுத்த அனைத்துப் படங்களும்' } },
  { id: 'soft_edited', section: 'deliverable', unit: 'included', price: 0, icon: 'sparkle', excelRow: 22,
    name: { en: 'Edited photos · soft copies', ta: 'எடிட் செய்த படங்கள்' }, note: { en: 'Curated and colour-graded', ta: 'தேர்ந்தெடுத்து எடிட் செய்தவை' } },
  { id: 'trad_film', section: 'deliverable', unit: 'included', price: 0, icon: 'film', excelRow: 23,
    name: { en: 'Traditional video · 2 hr on pendrive', ta: 'பாரம்பரிய வீடியோ · 2 மணி · பென்டிரைவ்' }, note: { en: 'With traditional videography', ta: 'பாரம்பரிய வீடியோவுடன்' } },
  { id: 'candid_film', section: 'deliverable', unit: 'included', price: 0, icon: 'play', excelRow: 24,
    name: { en: 'Candid highlight · 3–4 min', ta: 'கேண்டிட் ஹைலைட் · 3–4 நிமிடம்' }, note: { en: 'With candid videography', ta: 'கேண்டிட் வீடியோவுடன்' } },

  // ── Special shoots ────────────────────────────────────────────────────────
  { id: 'prepost_wedding', section: 'special', unit: 'shoot', max: 2, price: 15000, icon: 'heart', excelRow: 25,
    name: { en: 'Pre / post-wedding shoot', ta: 'திருமணத்திற்கு முன் / பின் படப்பிடிப்பு' }, note: { en: 'Half-day, one location', ta: 'அரை நாள், ஒரு இடம்' } },
  { id: 'outdoor_couple', section: 'special', unit: 'shoot', max: 2, price: 6000, icon: 'users', excelRow: 26,
    name: { en: 'Outdoor couple shoot', ta: 'வெளிப்புற ஜோடி படப்பிடிப்பு' } },
  { id: 'outdoor_baby', section: 'special', unit: 'shoot', max: 2, price: 5000, icon: 'star', excelRow: 27,
    name: { en: 'Outdoor baby shoot', ta: 'வெளிப்புறக் குழந்தை படப்பிடிப்பு' } },
  { id: 'outdoor_maternity', section: 'special', unit: 'shoot', max: 2, price: 5000, icon: 'heart', excelRow: 28,
    name: { en: 'Outdoor maternity shoot', ta: 'வெளிப்புற வளைகாப்பு படப்பிடிப்பு' } },
  { id: 'model_portfolio', section: 'special', unit: 'shoot', max: 2, price: 12000, icon: 'eye', pending: true,
    name: { en: 'Model portfolio shoot', ta: 'மாடல் போர்ட்ஃபோலியோ' }, note: { en: 'Studio or outdoor, half-day', ta: 'ஸ்டுடியோ / வெளிப்புறம், அரை நாள்' } },
  { id: 'commercial_shoot', section: 'special', unit: 'shoot', max: 2, price: 18000, icon: 'building', pending: true,
    name: { en: 'Commercial / ad shoot', ta: 'வணிக / விளம்பரப் படப்பிடிப்பு' }, note: { en: 'Products, interiors, campaigns', ta: 'பொருட்கள், உட்புறம், பிரச்சாரம்' } },
]

export const CATALOGUE_BY_ID = Object.fromEntries(CATALOGUE.map(i => [i.id, i])) as Record<CatalogueId, CatalogueItem>
export const itemById = (id: string): CatalogueItem | undefined => CATALOGUE_BY_ID[id as CatalogueId]

export const SECTION_META: Record<Section, { name: Bi; blurb: Bi; icon: IconName }> = {
  crew: { name: { en: 'Crew', ta: 'குழு' }, blurb: { en: 'Photographers and videographers per session', ta: 'ஒரு அமர்வுக்கான புகைப்பட & வீடியோ கலைஞர்கள்' }, icon: 'camera' },
  addon: { name: { en: 'Add-ons', ta: 'கூடுதல் சேவைகள்' }, blurb: { en: 'Extras for the day itself', ta: 'விழா நாளுக்கான கூடுதல்கள்' }, icon: 'sparkle' },
  deliverable: { name: { en: 'Deliverables', ta: 'வழங்கல்கள்' }, blurb: { en: 'Albums, frames and prints to keep', ta: 'ஆல்பங்கள், பிரேம்கள், அச்சுகள்' }, icon: 'book' },
  special: { name: { en: 'Special shoots', ta: 'சிறப்புப் படப்பிடிப்புகள்' }, blurb: { en: 'Separate sessions before or after', ta: 'முன் அல்லது பின் தனி அமர்வுகள்' }, icon: 'heart' },
}

/** Sheets in an album item, used by the album studio and proofing quota. */
export const ALBUM_SHEETS: Partial<Record<CatalogueId, number>> = { album_25: 25, album_30: 30, album_35: 35, album_40: 40, album_50: 50, album_60: 60 }

// ─── Prices (catalogue + admin overrides) ────────────────────────────────────

export type PriceMap = Record<CatalogueId, number>

export const DEFAULT_PRICES: PriceMap = Object.fromEntries(CATALOGUE.map(i => [i.id, i.price])) as PriceMap

/** Catalogue prices with the admin's overrides applied. */
export function resolvePrices(overrides: Partial<Record<string, number>> = {}): PriceMap {
  const out = { ...DEFAULT_PRICES }
  for (const [k, v] of Object.entries(overrides)) if (k in out && typeof v === 'number' && v >= 0) out[k as CatalogueId] = v
  return out
}

// ─── Cart ────────────────────────────────────────────────────────────────────

export type FixedTier = 'basic' | 'standard' | 'premium'
export type TierKey = FixedTier | 'custom'

export interface Cart {
  tier: TierKey
  /** Coverage sessions; crew items multiply by this. One session ≈ 4–5 hours. */
  sessions: number
  /** Quantity per catalogue item. Absent or 0 means not in the cart. */
  items: Partial<Record<CatalogueId, number>>
}

export const MIN_SESSIONS = 1
export const MAX_SESSIONS = 4

/** Hours of coverage → sessions, the way the studio quotes (5-hour blocks). */
export const sessionsForHours = (hours: number) => Math.min(MAX_SESSIONS, Math.max(MIN_SESSIONS, Math.round(hours / 5)))

export const EMPTY_CART: Cart = { tier: 'standard', sessions: 1, items: {} }

/** Included deliverables ride along with the crew that produces them. */
export function withIncluded(items: Cart['items']): Cart['items'] {
  const out: Cart['items'] = { ...items }
  for (const k of ['soft_all', 'soft_edited', 'trad_film', 'candid_film'] as const) delete out[k]
  const hasCrew = (['trad_photo', 'trad_video', 'candid_photo', 'candid_video'] as const).some(k => (out[k] ?? 0) > 0)
  if (hasCrew) {
    out.soft_all = 1
    out.soft_edited = 1
  }
  if ((out.trad_video ?? 0) > 0) out.trad_film = 1
  if ((out.candid_video ?? 0) > 0) out.candid_film = 1
  return out
}

export const cartQty = (cart: Cart, id: CatalogueId) => cart.items[id] ?? 0

/** Sets a quantity, enforcing exclusive groups and item maximums. Switches the tier to custom. */
export function setCartQty(cart: Cart, id: CatalogueId, qty: number): Cart {
  const item = CATALOGUE_BY_ID[id]
  const items: Cart['items'] = { ...cart.items }
  const n = Math.max(0, Math.min(item.max ?? 99, Math.round(qty)))
  if (item.group) for (const other of CATALOGUE) if (other.group === item.group && other.id !== id) delete items[other.id]
  if (n > 0) items[id] = item.group ? 1 : n
  else delete items[id]
  return { ...cart, tier: 'custom', items: withIncluded(items) }
}

export const albumIn = (cart: Cart): CatalogueItem | undefined => CATALOGUE.find(i => i.group === 'album' && (cart.items[i.id] ?? 0) > 0)
export const albumSheets = (cart: Cart): number => ALBUM_SHEETS[albumIn(cart)?.id ?? 'album_25'] ?? 0

/** Items in the cart with their quantities, catalogue order. */
export function cartEntries(cart: Cart): { item: CatalogueItem; qty: number }[] {
  return CATALOGUE.filter(i => (cart.items[i.id] ?? 0) > 0).map(i => ({ item: i, qty: cart.items[i.id]! }))
}

// ─── Fixed tiers ─────────────────────────────────────────────────────────────

/**
 * Which preset family an event uses. Weddings and family functions are crew
 * heavy; baby and maternity are lighter; special shoots are priced per shoot;
 * corporate work is crew only, no albums.
 */
export type PresetKind = 'family' | 'maternity' | 'shoot' | 'corporate'

export interface TierPreset {
  items: Partial<Record<CatalogueId, number>>
  /** Marketing one-liner for the card. */
  pitch: Bi
}

export const TIER_META: Record<TierKey, { name: Bi; popular?: boolean }> = {
  basic: { name: { en: 'Basic', ta: 'பேசிக்' } },
  standard: { name: { en: 'Standard', ta: 'ஸ்டாண்டர்ட்' }, popular: true },
  premium: { name: { en: 'Premium', ta: 'பிரீமியம்' } },
  custom: { name: { en: 'Custom', ta: 'தனிப்பயன்' } },
}

const PRESETS: Record<PresetKind, Record<FixedTier, TierPreset>> = {
  family: {
    basic: {
      items: { trad_photo: 1, trad_video: 1, album_30: 1 },
      pitch: { en: 'Traditional photo and video with a 30-sheet album.', ta: 'பாரம்பரிய படம் & வீடியோ, 30 தாள் ஆல்பத்துடன்.' },
    },
    standard: {
      items: { trad_photo: 1, trad_video: 1, candid_photo: 1, album_40: 1, frame_16x24: 1 },
      pitch: { en: 'Adds a candid photographer, a bigger album and a frame.', ta: 'கேண்டிட் கலைஞர், பெரிய ஆல்பம், ஒரு பிரேம் கூடுதலாக.' },
    },
    premium: {
      items: { trad_photo: 1, trad_video: 1, candid_photo: 1, candid_video: 1, drone: 1, album_50: 1, frame_24x36: 1, magazine: 1 },
      pitch: { en: 'All four cameras, drone, highlight film and the full print set.', ta: 'நான்கு கேமராக்கள், ட்ரோன், ஹைலைட் படம், முழு அச்சுத் தொகுப்பு.' },
    },
  },
  maternity: {
    basic: {
      items: { trad_photo: 1 },
      pitch: { en: 'One photographer, every photo delivered digitally.', ta: 'ஒரு புகைப்படக் கலைஞர், அனைத்துப் படங்களும் டிஜிட்டலாக.' },
    },
    standard: {
      items: { trad_photo: 1, candid_photo: 1, minibook: 1 },
      pitch: { en: 'Candid coverage too, plus a mini book to keep.', ta: 'கேண்டிட் படங்களும், வைத்துக்கொள்ள ஒரு மினி புத்தகமும்.' },
    },
    premium: {
      items: { trad_photo: 1, candid_photo: 1, candid_video: 1, album_25: 1, frame_12x18: 1 },
      pitch: { en: 'Photo, candid video, an album and a framed print.', ta: 'படம், கேண்டிட் வீடியோ, ஆல்பம், பிரேம் செய்த அச்சு.' },
    },
  },
  shoot: {
    basic: {
      items: {},
      pitch: { en: 'The shoot itself, all photos delivered digitally.', ta: 'படப்பிடிப்பு மட்டும், அனைத்துப் படங்களும் டிஜிட்டலாக.' },
    },
    standard: {
      items: { drone: 1, minibook: 1 },
      pitch: { en: 'Adds drone frames and a mini book.', ta: 'ட்ரோன் படங்களும் மினி புத்தகமும் கூடுதலாக.' },
    },
    premium: {
      items: { drone: 1, album_25: 1, frame_20x30: 1, magazine: 1 },
      pitch: { en: 'Drone, album, a large frame and a magazine.', ta: 'ட்ரோன், ஆல்பம், பெரிய பிரேம், மேகசின்.' },
    },
  },
  corporate: {
    basic: {
      items: { trad_photo: 1 },
      pitch: { en: 'Event photography, delivered same week.', ta: 'நிகழ்வுப் புகைப்படம், அதே வாரம் வழங்கல்.' },
    },
    standard: {
      items: { trad_photo: 1, trad_video: 1 },
      pitch: { en: 'Photo and full-length video coverage.', ta: 'புகைப்படம் மற்றும் முழு நீள வீடியோ.' },
    },
    premium: {
      items: { trad_photo: 1, trad_video: 1, candid_photo: 1, candid_video: 1, drone: 1, ledwall: 1 },
      pitch: { en: 'Four cameras, drone and a live LED wall.', ta: 'நான்கு கேமராக்கள், ட்ரோன், நேரலை LED திரை.' },
    },
  },
}

export interface TierSpec {
  kind: PresetKind
  /** Special-shoot events add their own shoot item to every tier. */
  shootItem?: CatalogueId
}

/** The cart a fixed tier expands to for a given event. */
export function tierCart(spec: TierSpec, tier: FixedTier, sessions = 1): Cart {
  const preset = PRESETS[spec.kind][tier]
  const items: Cart['items'] = { ...preset.items }
  if (spec.shootItem) items[spec.shootItem] = 1
  return { tier, sessions, items: withIncluded(items) }
}

export const tierPitch = (spec: TierSpec, tier: FixedTier): Bi => PRESETS[spec.kind][tier].pitch

// ─── Describing a cart ───────────────────────────────────────────────────────

export const tierName = (tier: TierKey): Bi => TIER_META[tier].name
/** Crew lines in the cart. */
export const cartCrew = (cart: Cart) => cartEntries(cart).filter(e => e.item.section === 'crew')
/** Everything beyond the crew that carries a price — the "extras" chips. */
export const cartExtras = (cart: Cart) => cartEntries(cart).filter(e => e.item.section !== 'crew' && e.item.unit !== 'included')
/** Short bilingual label like "Standard · 2 sessions". */
export const cartLabel = (cart: Cart): Bi => ({
  en: `${TIER_META[cart.tier].name.en} · ${cart.sessions} session${cart.sessions > 1 ? 's' : ''}`,
  ta: `${TIER_META[cart.tier].name.ta} · ${cart.sessions} அமர்வு`,
})
