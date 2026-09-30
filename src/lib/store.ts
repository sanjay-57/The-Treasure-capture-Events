import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Lang } from './i18n'
import {
  DEFAULT_ALBUM, PROOF_SETS, SEED_WORKERS, STATUS_META, STATUS_ORDER, eventByKey,
  type AddonKey, type AlbumSpec, type CrowdKey, type DistrictKey, type EventKey, type GalleryCover, type OrderStatus,
  type PackageKey, type VenueType, type Worker,
} from './data'
import { computeQuote, type Quote } from './pricing'
import type { GalleryCat } from './gallery'

/*
 * Front-end mock of the backend. Everything persists to localStorage so the
 * admin and client views stay in sync across reloads and tabs. Each action
 * notes the API call that will replace it once the Fastify backend exists.
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
  distanceKm: number
  date: string
  time: string
  dateCertainty: 'exact' | 'tentative'
  packageId: PackageKey
  addons: AddonKey[]
  name: string
  contact: string
  email: string
  notes: string
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
  packageId: 'signature',
  addons: [],
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
  distanceKm: number
  date: string
  time: string
  dateCertainty: 'exact' | 'tentative'
  packageId: PackageKey
  addons: AddonKey[]
  notes: string
  quote: Quote
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

  updateDraft: (patch: Partial<BookingDraft>) => void
  resetDraft: () => void
  /** POST /enquiries → creates Order, customer + draft invoice, WhatsApp ack. Returns the order id. */
  submitEnquiry: () => string | null

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
  updateOrderQuoteTotal: (orderId: string, total: number) => void

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

function historyUpTo(status: OrderStatus, startDaysAgo: number) {
  const idx = STATUS_ORDER.indexOf(status)
  return STATUS_ORDER.slice(0, idx + 1).map((s, i) => ({ status: s, at: daysAgo(Math.max(0, startDaysAgo - i * 6)) }))
}

function seedOrder(p: {
  id: string; name: string; contact: string; email?: string; district: DistrictKey; eventType: EventKey; hours: number
  crowd: CrowdKey; venueType: VenueType; venueName: string; venueAddress: string; km: number; date: string; time: string
  pkg: PackageKey; addons: AddonKey[]; status: OrderStatus; created: number; paid: number[]; workers: string[]; selection?: string[]
}): Order {
  const quote = computeQuote({ eventType: p.eventType, durationHours: p.hours, crowd: p.crowd, venueType: p.venueType, distanceKm: p.km, packageId: p.pkg, addons: p.addons })
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
    packageId: p.pkg,
    addons: p.addons,
    notes: '',
    quote,
    status: p.status,
    history: historyUpTo(p.status, p.created),
    payments: p.paid.map((amount, i) => ({ id: uid(), amount, mode: i === 0 ? 'upi' : 'bank', at: daysAgo(p.created - 2 - i * 10) })),
    customerId: 'CU-' + p.id.slice(-4),
    invoiceId: 'INV-' + p.id.slice(-4),
    workerIds: p.workers,
    selection: p.selection ?? [],
  }
}

/** Demo client login: +91 98765 43210 (order in the photo-selection stage). */
export const DEMO_CLIENT_PHONE = '9876543210'

function seedOrders(): Order[] {
  return [
    seedOrder({ id: 'TTC-2026-0142', name: 'Priya & Karthik', contact: '+91 98765 43210', email: 'priya.k@example.com', district: 'madurai', eventType: 'wedding', hours: 10, crowd: 'grand', venueType: 'mahal', venueName: 'Sri Meenakshi Mahal', venueAddress: 'Anna Nagar, Madurai', km: 8, date: daysAhead(-24), time: '06:00', pkg: 'heirloom', addons: ['drone', 'sameday'], status: 'SELECT_PHOTOS', created: 70, paid: [40000, 35000], workers: ['w1', 'w6'], selection: ['t_couple_garland', 't_bride_silk', 't_ritual_fire'] }),
    seedOrder({ id: 'TTC-2026-0151', name: 'Aishwarya Menon', contact: '+91 91234 56780', district: 'chennai', eventType: 'reception', hours: 6, crowd: 'large', venueType: 'mahal', venueName: 'ECR Beach Resort', venueAddress: 'East Coast Road, Chennai', km: 34, date: daysAhead(18), time: '18:30', pkg: 'signature', addons: ['ledwall'], status: 'TEAM_MEETING', created: 12, paid: [15000], workers: ['w2'] }),
    seedOrder({ id: 'TTC-2026-0156', name: 'Lakshmi Narayanan', contact: '+91 99401 22110', district: 'thanjavur', eventType: 'puberty', hours: 4, crowd: 'medium', venueType: 'home', venueName: '', venueAddress: 'Medical College Road, Thanjavur', km: 5, date: daysAhead(9), time: '09:00', pkg: 'essential', addons: [], status: 'BRIDE_GROOM_MEETING', created: 8, paid: [5000], workers: ['w5'] }),
    seedOrder({ id: 'TTC-2026-0160', name: 'Divya & Arjun', contact: '+91 90031 45566', district: 'dindigul', eventType: 'outdoor', hours: 6, crowd: 'intimate', venueType: 'home', venueName: 'Kodaikanal lake', venueAddress: 'Kodaikanal, Dindigul', km: 42, date: daysAhead(32), time: '05:30', pkg: 'signature', addons: ['drone'], status: 'ENQUIRY', created: 1, paid: [], workers: [] }),
    seedOrder({ id: 'TTC-2026-0128', name: 'Sneha & Vikram', contact: '+91 97877 66554', district: 'coimbatore', eventType: 'wedding', hours: 12, crowd: 'grand', venueType: 'mahal', venueName: 'Codissia Convention Hall', venueAddress: 'Avinashi Road, Coimbatore', km: 12, date: daysAhead(-60), time: '07:30', pkg: 'heirloom', addons: ['extraalbum'], status: 'ALBUM_CUSTOMIZATION', created: 110, paid: [50000, 30000], workers: ['w3', 'w1'] }),
    seedOrder({ id: 'TTC-2026-0117', name: 'Deepa & Senthil', contact: '+91 98945 33221', district: 'tirunelveli', eventType: 'engagement', hours: 5, crowd: 'large', venueType: 'mahal', venueName: 'Temple mandapam', venueAddress: 'Town, Tirunelveli', km: 3, date: daysAhead(-90), time: '17:00', pkg: 'signature', addons: [], status: 'DELIVERED', created: 140, paid: [20000, 25500], workers: ['w7'] }),
    seedOrder({ id: 'TTC-2026-0133', name: 'Ravi Shankar', contact: '+91 93456 78123', district: 'salem', eventType: 'birthday', hours: 3, crowd: 'medium', venueType: 'home', venueName: '', venueAddress: 'Fairlands, Salem', km: 4, date: daysAhead(-40), time: '17:00', pkg: 'essential', addons: ['booth'], status: 'BILLED', created: 55, paid: [10000], workers: ['w4'] }),
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

// ─── Store ───────────────────────────────────────────────────────────────────

export const useStore = create<State & Actions>()(
  persist(
    (set, get) => {
      const patchOrder = (id: string, fn: (o: Order) => Order) =>
        set(s => ({ orders: s.orders.map(o => (o.id === id ? fn(o) : o)) }))

      const pushMessage = (msg: Omit<OutboxMessage, 'id' | 'at' | 'channel'>) =>
        set(s => ({ outbox: [{ ...msg, id: uid(), at: now(), channel: 'whatsapp' as const }, ...s.outbox].slice(0, 200) }))

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

        updateDraft: patch => set(s => ({ draft: { ...s.draft, ...patch } })),
        resetDraft: () => set(s => ({ draft: { ...EMPTY_DRAFT, name: s.lead?.name ?? '', contact: s.lead?.contact ?? '' } })),

        submitEnquiry: () => {
          const d = get().draft
          if (!d.district || !d.eventType || !d.name || !d.contact) return null
          const quote = computeQuote({ eventType: d.eventType, durationHours: d.durationHours, crowd: d.crowd, venueType: d.venueType, distanceKm: d.distanceKm, packageId: d.packageId, addons: d.addons })
          const seq = 170 + get().orders.length
          const id = `TTC-${new Date().getFullYear()}-${String(seq).padStart(4, '0')}`
          const order: Order = {
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
            distanceKm: d.distanceKm,
            date: d.date,
            time: d.time,
            dateCertainty: d.dateCertainty,
            packageId: d.packageId,
            addons: d.addons,
            notes: d.notes,
            quote,
            status: 'ENQUIRY',
            history: [{ status: 'ENQUIRY', at: now() }],
            payments: [],
            customerId: 'CU-' + uid().slice(0, 5).toUpperCase(),
            invoiceId: 'INV-' + String(seq).padStart(4, '0'),
            workerIds: [],
            selection: [],
          }
          set(s => ({
            orders: [order, ...s.orders],
            session: { role: 'client', orderId: id, name: d.name, contact: d.contact },
            draft: { ...EMPTY_DRAFT, name: d.name, contact: d.contact },
          }))
          pushMessage({ audience: 'client', to: d.contact, toName: d.name, template: 'enquiry_received', body: statusMessage(order, 'ENQUIRY'), orderId: id })
          return id
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
        updateOrderQuoteTotal: (orderId, total) => patchOrder(orderId, o => ({ ...o, quote: { ...o.quote, total } })),

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
            album: pastAlbum ? x.album ?? { ...DEFAULT_ALBUM, cover: 'silk', color: 'ruby', paper: 'lustre', sheets: 40, title: x.client.name, subtitle: '12 · 02 · 2026', submittedAt: daysAgo(8) } : idx < STATUS_ORDER.indexOf('ALBUM_CUSTOMIZATION') ? undefined : x.album,
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
      version: 3,
      storage: createJSONStorage(() => localStorage),
      // v1: new default hero slides (landscape frames only).
      // v2: billing ids no longer Zoho-prefixed.
      // v3: hero slides without faces; warmer default banner copy.
      migrate: (persisted, version) => {
        const p = persisted as State
        if (version < 3 && p?.cms) {
          p.cms = { ...p.cms, heroSlides: SEED_CMS.heroSlides }
          if (p.cms.banner?.en === 'Wedding season 2026–27 dates are filling fast — lock yours with a ₹5,000 advance.') p.cms.banner = { ...p.cms.banner, en: SEED_CMS.banner.en, ta: SEED_CMS.banner.ta }
        }
        if (version < 2 && p?.orders) {
          p.orders = p.orders.map(o => {
            const { zohoCustomerId, zohoInvoiceId, ...rest } = o as Order & { zohoCustomerId?: string; zohoInvoiceId?: string }
            return { ...rest, customerId: o.customerId ?? zohoCustomerId ?? '', invoiceId: o.invoiceId ?? zohoInvoiceId ?? '' }
          })
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

export { DEFAULT_ALBUM }
