import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Lang } from './i18n'
import {
  DEFAULT_ALBUM, PROOF_SETS, SEED_WORKERS, STATUS_META, STATUS_ORDER, eventByKey,
  type AlbumSpec, type CrowdKey, type DistrictKey, type EventKey, type GalleryCover, type OrderStatus, type VenueType, type Worker,
} from './data'
import {
  EMPTY_CART, MAX_SESSIONS, MIN_SESSIONS, SESSION_HOURS, resolvePrices, sessionsForHours, setCartQty, tierCart,
  type Cart, type CatalogueId, type FixedTier, type PriceMap,
} from './catalogue'
import { computeQuote, type Adjustment, type Quote } from './pricing'
import type { GalleryCat } from './gallery'

/*
 * Front-end mock of the backend. Everything persists to localStorage so the
 * admin and client views stay in sync across reloads and tabs. Each action
 * notes the API call that will replace it once the backend exists.
 *
 * Billing is the studio's own: quotes are computed from the catalogue, frozen
 * into the order, and adjusted / re-quoted by the admin. No third-party
 * invoicing service.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BookingDraft {
  district: DistrictKey | ''
  eventType: EventKey | ''
  durationHours: number
  crowd: CrowdKey
  venueType: VenueType
  venueName: string
  venueAddress: string
  /** Venue pin from a search result or "Use my location"; drives the travel estimate. Optional, so older saved drafts and orders still load. */
  venueCoords?: { lat: number; lng: number }
  distanceKm: number
  date: string
  time: string
  dateCertainty: 'exact' | 'tentative'
  cart: Cart
  name: string
  contact: string
  email: string
  notes: string
  /** A spoken message for the studio, recorded on the package step. */
  voiceNote?: VoiceNote
}

/** A short recording kept as a data URL until the backend can take uploads. */
export interface VoiceNote {
  url: string
  mime: string
  seconds: number
  at: string
}

export const EMPTY_DRAFT: BookingDraft = {
  district: '',
  eventType: '',
  durationHours: 4,
  crowd: 'medium',
  venueType: 'mahal',
  venueName: '',
  venueAddress: '',
  distanceKm: 0,
  date: '',
  time: '',
  dateCertainty: 'exact',
  cart: EMPTY_CART,
  name: '',
  contact: '',
  email: '',
  notes: '',
}

export interface Payment {
  id: string
  amount: number
  mode: 'upi' | 'cash' | 'bank'
  at: string
  note?: string
}

export type MilestoneKey = 'advance' | 'event' | 'delivery'
export interface Milestone {
  key: MilestoneKey
  /** Share of the invoice total, in percent. The three add up to 100. */
  pct: number
}

export const DEFAULT_SCHEDULE: Milestone[] = [
  { key: 'advance', pct: 20 },
  { key: 'event', pct: 50 },
  { key: 'delivery', pct: 30 },
]

export interface InvoiceMeta {
  /** When the quote was first issued (enquiry time) — re-quotes keep the number, bump `revisedAt`. */
  issuedAt: string
  revisedAt?: string
  /** Set when the studio marks the invoice as sent to the client. */
  sentAt?: string
  gstPct: number
  schedule: Milestone[]
  /** Free-text note printed under the totals. */
  note: string
}

export interface QuoteRevision {
  at: string
  total: number
  note: string
}

export interface Order {
  id: string
  createdAt: string
  client: { name: string; contact: string; email?: string }
  district: DistrictKey
  eventType: EventKey
  durationHours: number
  crowd: CrowdKey
  venueType: VenueType
  venueName: string
  venueAddress: string
  /** Venue pin from a search result or "Use my location"; drives the travel estimate. Optional, so older saved drafts and orders still load. */
  venueCoords?: { lat: number; lng: number }
  distanceKm: number
  date: string
  time: string
  dateCertainty: 'exact' | 'tentative'
  /** What the client configured (or the studio re-quoted). */
  cart: Cart
  /** Discounts and extras added by the studio after the consultation. */
  adjustments: Adjustment[]
  notes: string
  voiceNote?: VoiceNote
  /** Snapshot: catalogue lines + travel + adjustments + tax. `total` is the billed amount. */
  quote: Quote
  invoice: InvoiceMeta
  quoteHistory: QuoteRevision[]
  status: OrderStatus
  history: { status: OrderStatus; at: string }[]
  payments: Payment[]
  customerId: string
  invoiceId: string
  workerIds: string[]
  /** Photo ids chosen in the proofing portal — the only thing persisted per the PRD. */
  selection: string[]
  selectionSubmittedAt?: string
  album?: AlbumSpec & { submittedAt: string }
  review?: { rating: number; text: string; at: string }
  delivery?: { courier: string; tracking: string; dispatchedAt: string }
  /** Gallery cover set by the studio; the client dashboard falls back to defaults when absent. */
  cover?: GalleryCover
  /** Where the quote was made: the public booking flow (default) or the studio showroom. */
  source?: 'web' | 'showroom'
}

export interface OutboxMessage {
  id: string
  channel: 'whatsapp'
  audience: 'client' | 'worker'
  to: string
  toName: string
  template: string
  body: string
  at: string
  orderId?: string
}

export interface Lead {
  id: string
  name: string
  contact: string
  at: string
  source: string
  /** Language the visitor wants to be contacted in. */
  lang?: Lang
}

export interface CmsState {
  /** Announcement strip above the nav. */
  banner: { enabled: boolean; en: string; ta: string; link: string }
  /** Home hero slides for each language, as image keys or external URLs. */
  heroSlides: { en: string[]; ta: string[] }
  /** Gallery items hidden by the admin. */
  hiddenGallery: string[]
  /** Extra gallery items added by URL. */
  extraGallery: { id: string; url: string; cat: GalleryCat; titleEn: string; titleTa: string; district: DistrictKey; tone: 'modern' | 'traditional' | 'both' }[]
  /** Studio contact info shown in the footer / contact page. */
  studio: { phone: string; whatsapp: string; email: string; addressEn: string; addressTa: string; googleReviewUrl: string }
  /** Rate card edits: price overrides per catalogue item and the default GST. */
  catalogue: {
    prices: Partial<Record<CatalogueId, number>>
    gstPct: number
    /** Package savings the admin last reviewed, keyed `kind.tier.variant`. A different live value shows a drift warning. */
    savings?: Record<string, number>
  }
  /** Bank details printed on invoices. */
  bank: { upi: string; name: string; acc: string; ifsc: string; branchEn: string; branchTa: string }
}

export type Session =
  | { role: 'client'; orderId: string; name: string; contact: string }
  | { role: 'admin'; name: string }
  | null

interface State {
  lang: Lang
  /** Bumped on each language switch; drives the curtain transition. */
  langSwitchId: number
  lead: Lead | null
  leadPromptDone: boolean
  session: Session
  draft: BookingDraft
  orders: Order[]
  leads: Lead[]
  workers: Worker[]
  outbox: OutboxMessage[]
  cms: CmsState
  /** Gallery photo ids the visitor has hearted; can be attached to an enquiry. */
  moodboard: string[]
}

interface Actions {
  setLang: (lang: Lang) => void
  captureLead: (name: string, contact: string, source?: string) => void
  dismissLeadPrompt: () => void

  /** Patches the draft; changing the event re-expands a fixed tier for that event. */
  updateDraft: (patch: Partial<BookingDraft>) => void
  resetDraft: () => void
  /** Picks a fixed tier (expands to its preset cart) or switches to custom keeping the current items. */
  setTier: (tier: FixedTier | 'custom', variant?: number) => void
  /** Empties the cart (the customer tapped the active package again). */
  clearCart: () => void
  setCartItem: (id: CatalogueId, qty: number) => void
  setSessions: (n: number) => void
  /** POST /enquiries → creates Order + draft invoice, WhatsApp ack. Returns the order id. */
  submitEnquiry: () => string | null
  /** Showroom "Save as quote": Lead + ENQUIRY order + draft invoice + WhatsApp quote, without touching the visitor's session or draft. */
  saveShowroomQuote: (d: BookingDraft) => string | null

  /** Client OTP login (mocked: any 4-digit code). Returns false when no order matches the number. */
  loginClient: (contact: string) => boolean
  loginAdmin: (name: string) => void
  logout: () => void

  /** PATCH /orders/:id/status → triggers the client WhatsApp template. */
  setStatus: (orderId: string, status: OrderStatus) => void
  /** POST /orders/:id/payments → records the payment against the invoice. */
  logPayment: (orderId: string, payment: Omit<Payment, 'id' | 'at'>) => void
  removePayment: (orderId: string, paymentId: string) => void
  /** POST /orders/:id/assign → WhatsApp dispatch to the worker. */
  assignWorker: (orderId: string, workerId: string) => void
  unassignWorker: (orderId: string, workerId: string) => void
  setDelivery: (orderId: string, courier: string, tracking: string) => void

  // Billing — PATCH /orders/:id/quote …
  /** Re-prices the order from a new cart at today's catalogue prices; keeps a revision entry. */
  updateOrderCart: (orderId: string, cart: Cart, note?: string) => void
  addAdjustment: (orderId: string, label: string, amount: number) => void
  removeAdjustment: (orderId: string, adjustmentId: string) => void
  setInvoiceMeta: (orderId: string, patch: Partial<InvoiceMeta>) => void
  /** Marks the invoice sent and queues the WhatsApp message with the quote summary. */
  sendInvoice: (orderId: string) => void
  /** Admin rate-card edit. Only new quotes pick it up; existing orders keep their snapshot. */
  setCataloguePrice: (id: CatalogueId, price: number | null) => void

  toggleSelection: (orderId: string, photoId: string) => void
  submitSelection: (orderId: string) => void
  setGalleryCover: (orderId: string, cover: GalleryCover | undefined) => void
  saveAlbum: (orderId: string, spec: AlbumSpec) => void
  submitReview: (orderId: string, rating: number, text: string) => void

  upsertWorker: (worker: Worker) => void
  removeWorker: (id: string) => void
  updateCms: (patch: Partial<CmsState>) => void
  sendMessage: (msg: Omit<OutboxMessage, 'id' | 'at' | 'channel'>) => void
  /** Demo only: jump an order to any stage with consistent data (selection, album, delivery, payments). */
  demoJumpTo: (orderId: string, status: OrderStatus) => void
  toggleMood: (id: string) => void
  clearMood: () => void
  resetDemo: () => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 10)
const now = () => new Date().toISOString()
const daysAgo = (d: number) => new Date(Date.now() - d * 864e5).toISOString()
const daysAhead = (d: number) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10)

export const paidTotal = (o: Order) => o.payments.reduce((s, p) => s + p.amount, 0)
export const balanceDue = (o: Order) => Math.max(0, o.quote.total - paidTotal(o))
export const normalizePhone = (s: string) => s.replace(/\D/g, '').slice(-10)

/** Payment milestones with rupee amounts and how much of each is already covered. */
export function milestones(o: Order): { key: MilestoneKey; pct: number; amount: number; paid: number; done: boolean }[] {
  let remaining = paidTotal(o)
  return o.invoice.schedule.map((m, i, all) => {
    const amount = i === all.length - 1 ? o.quote.total - all.slice(0, -1).reduce((s, x) => s + Math.round((o.quote.total * x.pct) / 100), 0) : Math.round((o.quote.total * m.pct) / 100)
    const paid = Math.min(amount, Math.max(0, remaining))
    remaining -= paid
    return { key: m.key, pct: m.pct, amount, paid, done: amount > 0 && paid >= amount }
  })
}

export type InvoiceState = 'draft' | 'sent' | 'partial' | 'paid'
export function invoiceState(o: Order): InvoiceState {
  const paid = paidTotal(o)
  if (o.quote.total > 0 && paid >= o.quote.total) return 'paid'
  if (paid > 0) return 'partial'
  return o.invoice.sentAt ? 'sent' : 'draft'
}

/** Re-computes an order's quote from its cart, adjustments and tax at the given prices. */
export function requote(o: Pick<Order, 'eventType' | 'cart' | 'distanceKm' | 'adjustments' | 'invoice'>, prices: PriceMap): Quote {
  return computeQuote({ eventType: o.eventType, cart: o.cart, distanceKm: o.distanceKm, adjustments: o.adjustments, gstPct: o.invoice.gstPct }, prices)
}

function historyUpTo(status: OrderStatus, startDaysAgo: number) {
  const idx = STATUS_ORDER.indexOf(status)
  return STATUS_ORDER.slice(0, idx + 1).map((s, i) => ({ status: s, at: daysAgo(Math.max(0, startDaysAgo - i * 6)) }))
}

const invoiceNumber = (seq: number, year = new Date().getFullYear()) => `TTCS-${year}-${String(seq).padStart(4, '0')}`

function seedOrder(p: {
  id: string; name: string; contact: string; email?: string; district: DistrictKey; eventType: EventKey; hours: number
  crowd: CrowdKey; venueType: VenueType; venueName: string; venueAddress: string; km: number; date: string; time: string
  tier: FixedTier; extras?: Partial<Record<CatalogueId, number>>; sessions?: number; discount?: number
  status: OrderStatus; created: number; paid: number[]; workers: string[]; selection?: string[]
}): Order {
  const ev = eventByKey(p.eventType)!
  let cart = tierCart(ev.tiers, p.tier, p.sessions ?? sessionsForHours(p.hours), p.hours)
  for (const [id, qty] of Object.entries(p.extras ?? {})) cart = { ...setCartQty(cart, id as CatalogueId, qty as number), tier: cart.tier }
  if (p.extras) cart = { ...cart, tier: 'custom' }
  const adjustments: Adjustment[] = p.discount ? [{ id: uid(), label: 'Season discount', amount: -p.discount, at: daysAgo(p.created - 1) }] : []
  const invoice: InvoiceMeta = { issuedAt: daysAgo(p.created), sentAt: p.status === 'ENQUIRY' ? undefined : daysAgo(p.created - 1), gstPct: 0, schedule: DEFAULT_SCHEDULE, note: '' }
  const base = { eventType: p.eventType, cart, distanceKm: p.km, adjustments, invoice }
  const quote = requote(base, resolvePrices())
  return {
    id: p.id,
    createdAt: daysAgo(p.created),
    client: { name: p.name, contact: p.contact, email: p.email },
    district: p.district,
    eventType: p.eventType,
    durationHours: p.hours,
    crowd: p.crowd,
    venueType: p.venueType,
    venueName: p.venueName,
    venueAddress: p.venueAddress,
    distanceKm: p.km,
    date: p.date,
    time: p.time,
    dateCertainty: 'exact',
    cart,
    adjustments,
    notes: '',
    quote,
    invoice,
    quoteHistory: [{ at: daysAgo(p.created), total: quote.total, note: 'Quote generated from enquiry' }],
    status: p.status,
    history: historyUpTo(p.status, p.created),
    payments: p.paid.map((amount, i) => ({ id: uid(), amount, mode: i === 0 ? 'upi' : 'bank', at: daysAgo(p.created - 2 - i * 10) })),
    customerId: 'CU-' + p.id.slice(-4),
    invoiceId: invoiceNumber(Number(p.id.slice(-4))),
    workerIds: p.workers,
    selection: p.selection ?? [],
  }
}

/** Demo client login: +91 98765 43210 (order in the photo-selection stage). */
export const DEMO_CLIENT_PHONE = '9876543210'

function seedOrders(): Order[] {
  return [
    seedOrder({ id: 'TTC-2026-0142', name: 'Priya & Karthik', contact: '+91 98765 43210', email: 'priya.k@example.com', district: 'madurai', eventType: 'wedding', hours: 10, crowd: 'grand', venueType: 'mahal', venueName: 'Sri Meenakshi Mahal', venueAddress: 'Anna Nagar, Madurai', km: 8, date: daysAhead(-24), time: '06:00', tier: 'premium', sessions: 2, extras: { ledwall: 1 }, discount: 5000, status: 'SELECT_PHOTOS', created: 70, paid: [40000, 60000], workers: ['w1', 'w6'], selection: ['t_couple_garland', 't_bride_silk', 't_ritual_fire'] }),
    seedOrder({ id: 'TTC-2026-0151', name: 'Aishwarya Menon', contact: '+91 91234 56780', district: 'chennai', eventType: 'reception', hours: 6, crowd: 'large', venueType: 'mahal', venueName: 'ECR Beach Resort', venueAddress: 'East Coast Road, Chennai', km: 34, date: daysAhead(18), time: '18:30', tier: 'standard', extras: { ledwall: 1 }, status: 'TEAM_MEETING', created: 12, paid: [15000], workers: ['w2'] }),
    seedOrder({ id: 'TTC-2026-0156', name: 'Lakshmi Narayanan', contact: '+91 99401 22110', district: 'thanjavur', eventType: 'puberty', hours: 4, crowd: 'medium', venueType: 'home', venueName: '', venueAddress: 'Medical College Road, Thanjavur', km: 5, date: daysAhead(9), time: '09:00', tier: 'basic', status: 'BRIDE_GROOM_MEETING', created: 8, paid: [5000], workers: ['w5'] }),
    seedOrder({ id: 'TTC-2026-0160', name: 'Divya & Arjun', contact: '+91 90031 45566', district: 'dindigul', eventType: 'prewedding', hours: 6, crowd: 'intimate', venueType: 'home', venueName: 'Kodaikanal lake', venueAddress: 'Kodaikanal, Dindigul', km: 42, date: daysAhead(32), time: '05:30', tier: 'standard', status: 'ENQUIRY', created: 1, paid: [], workers: [] }),
    seedOrder({ id: 'TTC-2026-0128', name: 'Sneha & Vikram', contact: '+91 97877 66554', district: 'coimbatore', eventType: 'wedding', hours: 12, crowd: 'grand', venueType: 'mahal', venueName: 'Codissia Convention Hall', venueAddress: 'Avinashi Road, Coimbatore', km: 12, date: daysAhead(-60), time: '07:30', tier: 'premium', sessions: 2, extras: { minibook: 2 }, status: 'ALBUM_CUSTOMIZATION', created: 110, paid: [50000, 60000], workers: ['w3', 'w1'] }),
    seedOrder({ id: 'TTC-2026-0117', name: 'Deepa & Senthil', contact: '+91 98945 33221', district: 'tirunelveli', eventType: 'engagement', hours: 5, crowd: 'large', venueType: 'mahal', venueName: 'Temple mandapam', venueAddress: 'Town, Tirunelveli', km: 3, date: daysAhead(-90), time: '17:00', tier: 'standard', status: 'DELIVERED', created: 140, paid: [20000, 32200], workers: ['w7'] }),
    seedOrder({ id: 'TTC-2026-0133', name: 'Ravi Shankar', contact: '+91 93456 78123', district: 'salem', eventType: 'birthday', hours: 3, crowd: 'medium', venueType: 'home', venueName: '', venueAddress: 'Fairlands, Salem', km: 4, date: daysAhead(-40), time: '17:00', tier: 'basic', extras: { photobooth: 1 }, status: 'BILLED', created: 55, paid: [10000], workers: ['w4'] }),
    seedOrder({ id: 'TTC-2026-0162', name: 'Meera Raghavan', contact: '+91 98400 11223', district: 'chennai', eventType: 'babyshower', hours: 3, crowd: 'intimate', venueType: 'home', venueName: '', venueAddress: 'Adyar, Chennai', km: 9, date: daysAhead(21), time: '10:00', tier: 'standard', status: 'ENQUIRY', created: 0, paid: [], workers: [] }),
  ].map(o => o.id === 'TTC-2026-0117' ? { ...o, review: { rating: 5, text: 'Wonderful team.', at: daysAgo(70) }, delivery: { courier: 'Blue Dart', tracking: 'BD7784112', dispatchedAt: daysAgo(80) } } : o)
}

const SEED_CMS: CmsState = {
  banner: {
    enabled: true,
    en: 'Muhurtham dates for the 2026–27 wedding season are being blessed — reserve your auspicious day with a ₹5,000 advance.',
    ta: '2026–27 திருமண சீசனின் முகூர்த்த நாட்கள் நிச்சயமாகி வருகின்றன — ₹5,000 முன்பணத்துடன் உங்கள் சுபதினத்தை உறுதிசெய்யுங்கள்.',
    link: '/book',
  },
  heroSlides: {
    en: ['m_hands_mehndi', 'm_hands_rings', 'm_decor_candle', 'm_ring_hands2'],
    ta: ['t_marigold_hands', 't_lamp_many', 't_ritual_hands', 't_tn_sunset'],
  },
  hiddenGallery: [],
  extraGallery: [],
  studio: {
    phone: '+91 98940 12345',
    whatsapp: '+91 98940 12345',
    email: 'hello@treasurecaptureevents.in',
    addressEn: '14, West Masi Street, Madurai 625001',
    addressTa: '14, மேற்கு மாசி வீதி, மதுரை 625001',
    googleReviewUrl: 'https://g.page/r/treasure-captures/review',
  },
  catalogue: { prices: {}, gstPct: 0 },
  bank: {
    upi: 'treasurecaptureevents@hdfcbank',
    name: 'The Treasure Capture Events',
    acc: '5010 0234 5678 91',
    ifsc: 'HDFC0001234',
    branchEn: 'West Masi Street, Madurai',
    branchTa: 'மேற்கு மாசி வீதி, மதுரை',
  },
}

function initialData(): State {
  return {
    lang: 'en',
    langSwitchId: 0,
    lead: null,
    leadPromptDone: false,
    session: null,
    draft: EMPTY_DRAFT,
    orders: seedOrders(),
    leads: [],
    workers: SEED_WORKERS,
    outbox: [],
    cms: SEED_CMS,
    moodboard: [],
  }
}

/** WhatsApp body for a status change (also used by admin to preview before sending). */
export function statusMessage(order: Order, status: OrderStatus): string {
  const meta = STATUS_META[status]
  const first = order.client.name.split(/[ &]/)[0]
  return `வணக்கம் ${first}! ${meta.name.ta} / ${meta.name.en}.\n${meta.desc.en}${meta.cta ? `\n→ treasurecaptureevents.in${meta.cta.to}` : ''}\nRef: ${order.id}`
}

/** A new ENQUIRY order with its quote snapshot and draft invoice; null when the draft is missing required fields. */
function buildOrder(d: BookingDraft, seq: number, priceMap: PriceMap, gstPct: number, source: Order['source']): Order | null {
  if (!d.district || !d.eventType || !d.name || !d.contact) return null
  const id = `TTC-${new Date().getFullYear()}-${String(seq).padStart(4, '0')}`
  const invoice: InvoiceMeta = { issuedAt: now(), gstPct, schedule: DEFAULT_SCHEDULE, note: '' }
  const quote = requote({ eventType: d.eventType, cart: d.cart, distanceKm: d.distanceKm, adjustments: [], invoice }, priceMap)
  return {
    id,
    createdAt: now(),
    client: { name: d.name, contact: d.contact, email: d.email || undefined },
    district: d.district,
    eventType: d.eventType,
    durationHours: d.durationHours,
    crowd: d.crowd,
    venueType: d.venueType,
    venueName: d.venueName,
    venueAddress: d.venueAddress,
    venueCoords: d.venueCoords,
    distanceKm: d.distanceKm,
    date: d.date,
    time: d.time,
    dateCertainty: d.dateCertainty,
    cart: d.cart,
    adjustments: [],
    notes: d.notes,
    voiceNote: d.voiceNote,
    quote,
    invoice,
    quoteHistory: [{ at: now(), total: quote.total, note: source === 'showroom' ? 'Quote made in the showroom' : 'Quote generated from enquiry' }],
    status: 'ENQUIRY',
    history: [{ status: 'ENQUIRY', at: now() }],
    payments: [],
    customerId: 'CU-' + uid().slice(0, 5).toUpperCase(),
    invoiceId: invoiceNumber(seq),
    workerIds: [],
    selection: [],
    source,
  }
}

/** WhatsApp body carrying the quote — what the customer receives on submit and when the studio re-sends. */
export function quoteMessage(order: Order): string {
  const ev = eventByKey(order.eventType)
  const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`
  const lines = order.quote.sections
    .filter(s => s.key !== 'travel' || s.amount > 0)
    .map(s => `• ${s.name.en}: ${inr(s.amount)}`)
    .join('\n')
  const first = order.client.name.split(/[ &]/)[0]
  return `வணக்கம் ${first}! Here is your estimate for the ${ev?.name.en ?? order.eventType}${order.date ? ` on ${order.date}` : ''}.\n${lines}\nTotal: ${inr(order.quote.total)}\nQuote ${order.invoiceId} · Ref ${order.id}\nWe will call to confirm the date before anything is paid. — The Treasure Capture Events`
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useStore = create<State & Actions>()(
  persist(
    (set, get) => {
      const patchOrder = (id: string, fn: (o: Order) => Order) =>
        set(s => ({ orders: s.orders.map(o => (o.id === id ? fn(o) : o)) }))

      const pushMessage = (msg: Omit<OutboxMessage, 'id' | 'at' | 'channel'>) =>
        set(s => ({ outbox: [{ ...msg, id: uid(), at: now(), channel: 'whatsapp' as const }, ...s.outbox].slice(0, 200) }))

      const prices = () => resolvePrices(get().cms.catalogue.prices)

      /** Rebuilds an order's quote snapshot after a billing change. */
      const rebill = (id: string, fn: (o: Order) => Order, note?: string) =>
        patchOrder(id, o => {
          const next = fn(o)
          const quote = requote(next, prices())
          const changed = quote.total !== o.quote.total
          return {
            ...next,
            quote,
            invoice: { ...next.invoice, revisedAt: changed ? now() : next.invoice.revisedAt },
            quoteHistory: changed || note ? [...next.quoteHistory, { at: now(), total: quote.total, note: note ?? 'Quote updated' }] : next.quoteHistory,
          }
        })

      return {
        ...initialData(),

        setLang: lang => {
          if (lang === get().lang) return
          set(s => ({ lang, langSwitchId: s.langSwitchId + 1 }))
        },

        captureLead: (name, contact, source = 'popup') => {
          const lead = { id: uid(), name, contact, at: now(), source, lang: get().lang }
          set(s => ({ lead, leadPromptDone: true, leads: [lead, ...s.leads], draft: { ...s.draft, name: s.draft.name || name, contact: s.draft.contact || contact } }))
        },
        dismissLeadPrompt: () => set({ leadPromptDone: true }),

        updateDraft: patch =>
          set(s => {
            const draft = { ...s.draft, ...patch }
            const eventChanged = patch.eventType !== undefined && patch.eventType !== s.draft.eventType
            const ev = draft.eventType ? eventByKey(draft.eventType) : undefined
            // A fresh cart fills from the package; a cart the customer cleared on purpose stays empty.
            if (ev && (eventChanged || (!Object.keys(draft.cart.items).length && draft.cart.tier !== 'custom'))) {
              const tier = draft.cart.tier === 'custom' ? 'standard' : draft.cart.tier
              draft.cart = tierCart(ev.tiers, tier, draft.cart.sessions, draft.durationHours)
            }
            return { draft }
          }),
        resetDraft: () => set(s => ({ draft: { ...EMPTY_DRAFT, name: s.lead?.name ?? '', contact: s.lead?.contact ?? '' } })),
        setTier: (tier, variant) =>
          set(s => {
            const ev = s.draft.eventType ? eventByKey(s.draft.eventType) : undefined
            if (tier === 'custom' || !ev) return { draft: { ...s.draft, cart: { ...s.draft.cart, tier: 'custom' } } }
            return { draft: { ...s.draft, cart: tierCart(ev.tiers, tier, s.draft.cart.sessions, s.draft.durationHours, variant) } }
          }),
        clearCart: () => set(s => ({ draft: { ...s.draft, cart: { ...s.draft.cart, tier: 'custom', variant: undefined, album: undefined, items: {} } } })),
        setCartItem: (id, qty) => set(s => ({ draft: { ...s.draft, cart: setCartQty(s.draft.cart, id, qty) } })),
        setSessions: n => set(s => { const sessions = Math.min(MAX_SESSIONS, Math.max(MIN_SESSIONS, Math.round(n))); return { draft: { ...s.draft, durationHours: sessions * SESSION_HOURS, cart: { ...s.draft.cart, sessions, hours: sessions * SESSION_HOURS } } } }),

        submitEnquiry: () => {
          const d = get().draft
          const order = buildOrder(d, 170 + get().orders.length, prices(), get().cms.catalogue.gstPct, 'web')
          if (!order) return null
          set(s => ({
            orders: [order, ...s.orders],
            session: { role: 'client', orderId: order.id, name: d.name, contact: d.contact },
            draft: { ...EMPTY_DRAFT, name: d.name, contact: d.contact },
          }))
          pushMessage({ audience: 'client', to: d.contact, toName: d.name, template: 'quote_sent', body: quoteMessage(order), orderId: order.id })
          return order.id
        },

        saveShowroomQuote: d => {
          const order = buildOrder(d, 170 + get().orders.length, prices(), get().cms.catalogue.gstPct, 'showroom')
          if (!order) return null
          const lead: Lead = { id: uid(), name: d.name, contact: d.contact, at: now(), source: 'showroom', lang: get().lang }
          set(s => ({ orders: [order, ...s.orders], leads: [lead, ...s.leads] }))
          pushMessage({ audience: 'client', to: d.contact, toName: d.name, template: 'quote_sent', body: quoteMessage(order), orderId: order.id })
          return order.id
        },

        loginClient: contact => {
          const n = normalizePhone(contact)
          const order = get().orders.find(o => normalizePhone(o.client.contact) === n)
          if (!order) return false
          set({ session: { role: 'client', orderId: order.id, name: order.client.name, contact: order.client.contact } })
          return true
        },
        loginAdmin: name => set({ session: { role: 'admin', name } }),
        logout: () => set({ session: null }),

        setStatus: (orderId, status) => {
          const order = get().orders.find(o => o.id === orderId)
          if (!order || order.status === status) return
          patchOrder(orderId, o => ({ ...o, status, history: [...o.history, { status, at: now() }] }))
          pushMessage({ audience: 'client', to: order.client.contact, toName: order.client.name, template: `status_${status.toLowerCase()}`, body: statusMessage(order, status), orderId })
        },

        logPayment: (orderId, payment) => {
          patchOrder(orderId, o => ({ ...o, payments: [...o.payments, { ...payment, id: uid(), at: now() }] }))
          const o = get().orders.find(x => x.id === orderId)
          if (o) {
            const due = balanceDue(o)
            pushMessage({
              audience: 'client', to: o.client.contact, toName: o.client.name, template: 'payment_received', orderId,
              body: `நன்றி! Payment of ₹${payment.amount.toLocaleString('en-IN')} received for ${o.invoiceId}. ${due > 0 ? `Balance: ₹${due.toLocaleString('en-IN')}` : 'Fully paid ✓'}`,
            })
          }
        },
        removePayment: (orderId, paymentId) => patchOrder(orderId, o => ({ ...o, payments: o.payments.filter(p => p.id !== paymentId) })),

        assignWorker: (orderId, workerId) => {
          const o = get().orders.find(x => x.id === orderId)
          const w = get().workers.find(x => x.id === workerId)
          if (!o || !w || o.workerIds.includes(workerId)) return
          patchOrder(orderId, x => ({ ...x, workerIds: [...x.workerIds, workerId] }))
          const ev = eventByKey(o.eventType)
          pushMessage({
            audience: 'worker', to: w.phone, toName: w.name.en, template: 'job_dispatch', orderId,
            body: `New job · ${ev?.name.en ?? o.eventType}\n📅 ${o.date || 'TBC'} ${o.time}\n📍 ${o.venueName ? o.venueName + ', ' : ''}${o.venueAddress}\n👤 ${o.client.name} · ${o.client.contact}\nRef: ${o.id}`,
          })
        },
        unassignWorker: (orderId, workerId) => patchOrder(orderId, o => ({ ...o, workerIds: o.workerIds.filter(w => w !== workerId) })),

        setDelivery: (orderId, courier, tracking) => patchOrder(orderId, o => ({ ...o, delivery: { courier, tracking, dispatchedAt: now() } })),

        updateOrderCart: (orderId, cart, note) => rebill(orderId, o => ({ ...o, cart }), note ?? 'Items re-quoted by the studio'),
        addAdjustment: (orderId, label, amount) =>
          rebill(orderId, o => ({ ...o, adjustments: [...o.adjustments, { id: uid(), label, amount, at: now() }] }), `${amount < 0 ? 'Discount' : 'Extra'}: ${label}`),
        removeAdjustment: (orderId, adjustmentId) => rebill(orderId, o => ({ ...o, adjustments: o.adjustments.filter(a => a.id !== adjustmentId) }), 'Adjustment removed'),
        setInvoiceMeta: (orderId, patch) => rebill(orderId, o => ({ ...o, invoice: { ...o.invoice, ...patch } })),
        sendInvoice: orderId => {
          patchOrder(orderId, o => ({ ...o, invoice: { ...o.invoice, sentAt: now() } }))
          const o = get().orders.find(x => x.id === orderId)
          if (o) pushMessage({ audience: 'client', to: o.client.contact, toName: o.client.name, template: 'quote_sent', body: quoteMessage(o), orderId })
        },
        setCataloguePrice: (id, price) =>
          set(s => {
            const next = { ...s.cms.catalogue.prices }
            if (price === null) delete next[id]
            else next[id] = Math.max(0, Math.round(price))
            return { cms: { ...s.cms, catalogue: { ...s.cms.catalogue, prices: next } } }
          }),

        toggleSelection: (orderId, photoId) =>
          patchOrder(orderId, o => ({ ...o, selection: o.selection.includes(photoId) ? o.selection.filter(p => p !== photoId) : [...o.selection, photoId] })),
        submitSelection: orderId => {
          patchOrder(orderId, o => ({ ...o, selectionSubmittedAt: now() }))
          const o = get().orders.find(x => x.id === orderId)
          if (o && o.status === 'SELECT_PHOTOS') get().setStatus(orderId, 'ALBUM_CUSTOMIZATION')
        },
        setGalleryCover: (orderId, cover) => patchOrder(orderId, o => ({ ...o, cover })),
        saveAlbum: (orderId, spec) => patchOrder(orderId, o => ({ ...o, album: { ...spec, submittedAt: now() } })),
        submitReview: (orderId, rating, text) => patchOrder(orderId, o => ({ ...o, review: { rating, text, at: now() } })),

        upsertWorker: worker =>
          set(s => ({ workers: s.workers.some(w => w.id === worker.id) ? s.workers.map(w => (w.id === worker.id ? worker : w)) : [...s.workers, worker] })),
        removeWorker: id => set(s => ({ workers: s.workers.filter(w => w.id !== id) })),
        updateCms: patch => set(s => ({ cms: { ...s.cms, ...patch } })),
        sendMessage: pushMessage,
        demoJumpTo: (orderId, status) => {
          const o = get().orders.find(x => x.id === orderId)
          if (!o) return
          const idx = STATUS_ORDER.indexOf(status)
          const proofs = [...PROOF_SETS.traditional.slice(0, 10), ...PROOF_SETS.modern.slice(0, 8)]
          const pastSelection = idx > STATUS_ORDER.indexOf('SELECT_PHOTOS')
          const pastAlbum = idx > STATUS_ORDER.indexOf('ALBUM_CUSTOMIZATION')
          const delivered = status === 'DELIVERED'
          const basePayments = o.payments.filter(p => p.note !== 'demo-final').slice(0, 2)
          const paid = basePayments.reduce((sum, p) => sum + p.amount, 0)
          patchOrder(orderId, x => ({
            ...x,
            status,
            history: historyUpTo(status, (idx + 1) * 6),
            selection: pastSelection && x.selection.length < 12 ? proofs : !pastSelection && idx < STATUS_ORDER.indexOf('SELECT_PHOTOS') ? [] : x.selection,
            selectionSubmittedAt: pastSelection ? daysAgo(12) : undefined,
            album: pastAlbum ? x.album ?? { ...DEFAULT_ALBUM, cover: 'silk', color: 'ruby', paper: 'lustre', sheets: 35, title: x.client.name, subtitle: '12 · 02 · 2026', submittedAt: daysAgo(8) } : idx < STATUS_ORDER.indexOf('ALBUM_CUSTOMIZATION') ? undefined : x.album,
            delivery: delivered ? { courier: 'Blue Dart', tracking: 'BD' + x.id.slice(-4) + '7781', dispatchedAt: daysAgo(3) } : undefined,
            review: delivered ? x.review : undefined,
            payments: delivered && x.quote.total > paid
              ? [...basePayments, { id: uid(), amount: x.quote.total - paid, mode: 'bank', at: daysAgo(2), note: 'demo-final' }]
              : basePayments,
          }))
          pushMessage({ audience: 'client', to: o.client.contact, toName: o.client.name, template: `status_${status.toLowerCase()}`, body: statusMessage({ ...o, status }, status), orderId })
        },
        toggleMood: id => set(s => ({ moodboard: s.moodboard.includes(id) ? s.moodboard.filter(m => m !== id) : [...s.moodboard, id] })),
        clearMood: () => set({ moodboard: [] }),
        resetDemo: () => set(s => ({ ...initialData(), lang: s.lang, langSwitchId: s.langSwitchId, leadPromptDone: true })),
      }
    },
    {
      name: 'ttc-store-v2',
      version: 5,
      storage: createJSONStorage(() => localStorage),
      // v1: new default hero slides (landscape frames only).
      // v2: billing ids no longer third-party prefixed.
      // v3: hero slides without faces; warmer default banner copy.
      // v4: catalogue-based cart and in-house billing — orders and the draft are reseeded.
      // v5: phase 1 catalogue (hours, candid styles, packages with targets) — orders and the draft are reseeded again.
      migrate: (persisted, version) => {
        const p = persisted as State
        if (version < 4) {
          const fresh = initialData()
          p.orders = fresh.orders
          p.draft = fresh.draft
          p.session = p.session?.role === 'admin' ? p.session : null
          p.cms = { ...fresh.cms, ...(p.cms ?? {}), catalogue: fresh.cms.catalogue, bank: fresh.cms.bank }
        } else if (version < 5) {
          const fresh = initialData()
          p.orders = fresh.orders
          p.draft = fresh.draft
          p.cms = { ...p.cms, catalogue: { ...fresh.cms.catalogue, gstPct: p.cms?.catalogue?.gstPct ?? 0 } }
        }
        return p as State & Actions
      },
      partialize: s => {
        const { langSwitchId: _ignored, ...rest } = s
        return Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== 'function'))
      },
    },
  ),
)

// ─── Selectors ───────────────────────────────────────────────────────────────

/** The order belonging to the logged-in client, if any. */
export function useMyOrder(): Order | undefined {
  return useStore(s => (s.session?.role === 'client' ? s.orders.find(o => o.id === (s.session as { orderId: string }).orderId) : undefined))
}

/** Catalogue prices with the admin's overrides, memoised per override map. */
let priceCache: { src: unknown; map: PriceMap } | null = null
export function usePrices(): PriceMap {
  const overrides = useStore(s => s.cms.catalogue.prices)
  if (!priceCache || priceCache.src !== overrides) priceCache = { src: overrides, map: resolvePrices(overrides) }
  return priceCache.map
}

export { DEFAULT_ALBUM }
