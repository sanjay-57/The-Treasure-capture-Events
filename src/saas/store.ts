import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { IMG, photoUrl, type ImgKey } from '../lib/images'
import { idbDel } from './blobs'
import { termFor } from './usage'
import { DEFAULT_FEATURES, type FeatureFlags, type PickerVersion, type Activity, ActivityKind, Chapter, Drive, Pick, Plan, PlanKey, Proof, Scan, Studio, StudioEvent, StudioMessage, StudioSession, StudioTerm } from './types'

/**
 * Persisted mock of the photographer-section backend. Each action names the
 * endpoint that replaces it (docs/album-selection-plan.md, Phase S3), so the
 * switch to the API is a data-layer change. Proof preview blobs and drive
 * assets live in IndexedDB (blobs.ts), not here.
 */

const now = () => new Date().toISOString()
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()
const daysAhead = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString()
export const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 10)}`

const CODE_CHARS = 'abcdefghjkmnpqrstuvwxyz23456789'
export function shareCode(): string {
  let s = ''
  const a = new Uint32Array(8)
  crypto.getRandomValues(a)
  for (const n of a) s += CODE_CHARS[n % CODE_CHARS.length]
  return s
}

export const DEFAULT_CHAPTERS: Chapter[] = [
  { key: 'getting-ready', name: 'Getting ready', sort: 0 },
  { key: 'ceremony', name: 'Ceremony', sort: 1 },
  { key: 'portraits', name: 'Portraits', sort: 2 },
  { key: 'family', name: 'Family & groups', sort: 3 },
  { key: 'reception', name: 'Reception', sort: 4 },
]

/** Prepaid terms, prices confirmed by the client. Totals: ₹1300 / ₹5994 / ₹10788. */
export const DEFAULT_PLANS: Plan[] = [
  { key: 'm1', name: '1 month', months: 1, pricePerMonth: 1300 },
  { key: 'm6', name: '6 months', months: 6, pricePerMonth: 999 },
  { key: 'm12', name: '12 months', months: 12, pricePerMonth: 899 },
]

/** Placeholder logo (initials on the accent colour) for seed studios. */
export function initialsLogo(name: string, accent: string): string {
  const ini = name.split(/\s+/).filter(w => /^[a-z]/i.test(w)).slice(0, 2).map(w => w[0].toUpperCase()).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" rx="48" fill="${accent}"/><text x="128" y="150" font-family="Georgia,serif" font-size="96" fill="#fff" text-anchor="middle">${ini}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

// ─── Seed ────────────────────────────────────────────────────────────────────

/** Demo photographer login: +91 90000 11111, any 4-digit OTP. */
export const DEMO_STUDIO_PHONE = '+91 90000 11111'

/** Fields added in v3 (picker version, feature defaults, portal banner). Also fills them on older saved studios. */
export const STUDIO_DEFAULTS = (): { pickerVersion: PickerVersion; featureDefaults: FeatureFlags; portalBanner: boolean } => ({ pickerVersion: 'normal', featureDefaults: { ...DEFAULT_FEATURES }, portalBanner: false })

const LENS_FROM = '2026-10-01T00:00:00.000Z'

function seedStudios(): Studio[] {
  return [
    { id: 'st_lens', name: 'Lens & Light Studio', slug: 'lens-and-light', ownerName: 'Arun Prakash', phone: DEMO_STUDIO_PHONE, whatsapp: DEMO_STUDIO_PHONE, email: 'arun@lensandlight.in', city: 'Coimbatore', logoUrl: initialsLogo('Lens Light', '#1f4e79'), accent: '#1f4e79', watermark: '© Lens & Light', lang: 'en', defaultQuota: 250, defaultWindowDays: 14, sub: { plan: 'm12', payment: 'paid', startedAt: LENS_FROM, endsAt: '2027-10-01T00:00:00.000Z', changedAt: LENS_FROM }, ...STUDIO_DEFAULTS(), createdAt: daysAgo(80), onboarded: true, notes: 'Came through a referral from the Madurai expo.' },
    { id: 'st_kural', name: 'Kural Frames', slug: 'kural-frames', ownerName: 'Meena Sundar', phone: '+91 94430 22222', whatsapp: '+91 94430 22222', city: 'Tirunelveli', logoUrl: initialsLogo('Kural Frames', '#7a3e1d'), accent: '#7a3e1d', watermark: '© Kural Frames', lang: 'ta', defaultQuota: 200, defaultWindowDays: 21, sub: { plan: 'm1', payment: 'revoked', startedAt: daysAgo(40), endsAt: daysAgo(10), changedAt: daysAgo(3) }, ...STUDIO_DEFAULTS(), createdAt: daysAgo(120), onboarded: true, notes: 'Revoked: renewal not paid.' },
    { id: 'st_nila', name: 'Nila Weddings', slug: 'nila-weddings', ownerName: 'Vignesh R', phone: '+91 98940 33333', whatsapp: '+91 98940 33333', city: 'Trichy', logoUrl: initialsLogo('Nila Weddings', '#2f5d50'), accent: '#2f5d50', watermark: '© Nila Weddings', lang: 'en', defaultQuota: 300, defaultWindowDays: 14, sub: { plan: 'm6', payment: 'pending', changedAt: daysAgo(1) }, ...STUDIO_DEFAULTS(), createdAt: daysAgo(1), onboarded: true, notes: '' },
  ]
}

const SEED_KEYS = (Object.keys(IMG) as ImgKey[]).filter(k => k.startsWith('m_') || k.startsWith('t_')).slice(0, 54)

function seedProofs(eventId: string, prefix: string): Proof[] {
  const out: Proof[] = SEED_KEYS.map((k, i) => {
    const im = IMG[k]
    const landscape = im.w >= im.h
    const w = landscape ? 2048 : Math.round((2048 * im.w) / im.h)
    const h = landscape ? Math.round((2048 * im.h) / im.w) : 2048
    return {
      id: `${eventId}_p${i}`,
      eventId,
      chapter: DEFAULT_CHAPTERS[Math.min(4, Math.floor((i / SEED_KEYS.length) * 5))].key,
      filename: `${prefix}${String(4800 + i * 3).padStart(4, '0')}`,
      ext: 'NEF',
      source: 'raw',
      camera: 'Nikon Z6 II',
      serial: '6012345',
      takenAt: daysAgo(20 - i / 60),
      w,
      h,
      bytes: 820_000 + ((i * 37_919) % 400_000),
      originalBytes: 44_000_000 + ((i * 1_234_567) % 9_000_000),
      url: photoUrl(k, 1600),
      thumbUrl: photoUrl(k, 480),
      sort: i,
    }
  })
  // A second body that also shot DSC_48xx, to show the per-camera Lightroom split.
  return [
    ...out,
    ...out.slice(6, 9).map((p, j) => ({ ...p, id: `${p.id}_b`, serial: '6098765', camera: 'Nikon Z6 II', sort: out.length + j })),
  ]
}

function seed() {
  const studios = seedStudios()
  const events: StudioEvent[] = [
    { id: 'ev_sharma', studioId: 'st_lens', code: 'demo4821', pin: '2026', title: 'Divya & Rahul · Wedding', date: daysAgo(18).slice(0, 10), clientNames: 'Divya & Rahul', clientPhone: '+91 98765 11111', lang: 'en', quota: 40, deadline: daysAhead(9), status: 'open', chapters: DEFAULT_CHAPTERS, createdAt: daysAgo(10), openedAt: daysAgo(5) },
    { id: 'ev_anbu', studioId: 'st_lens', code: 'anbu7rk2', title: 'Anbu & Kavya · Reception', date: daysAgo(40).slice(0, 10), clientNames: 'Anbu & Kavya', clientPhone: '+91 98765 22222', lang: 'ta', quota: 30, deadline: daysAgo(8), status: 'submitted', chapters: DEFAULT_CHAPTERS, createdAt: daysAgo(35), openedAt: daysAgo(30), submittedAt: daysAgo(9) },
    { id: 'ev_draft', studioId: 'st_lens', code: 'dr4ftq9w', title: 'Saranya · Baby shower', date: daysAgo(2).slice(0, 10), clientNames: 'Saranya', clientPhone: '+91 98765 33333', lang: 'ta', quota: 120, deadline: daysAhead(16), status: 'draft', chapters: DEFAULT_CHAPTERS.slice(0, 3), createdAt: daysAgo(1) },
    { id: 'ev_meera', studioId: 'st_lens', code: 'mr8kq2wz', title: 'Meera & Karthik · Engagement', date: daysAhead(24).slice(0, 10), clientNames: 'Meera & Karthik', clientPhone: '+91 98765 66666', lang: 'en', quota: 150, deadline: daysAhead(40), status: 'draft', chapters: DEFAULT_CHAPTERS.slice(0, 1).map(c => ({ ...c, key: 'all', name: 'All photos' })), createdAt: daysAgo(7) },
    { id: 'ev_kural', studioId: 'st_kural', code: 'kural8mn', title: 'Selvi & Ravi · Wedding', date: daysAgo(12).slice(0, 10), clientNames: 'Selvi & Ravi', clientPhone: '+91 98765 44444', lang: 'ta', quota: 200, deadline: daysAhead(6), status: 'open', chapters: DEFAULT_CHAPTERS, createdAt: daysAgo(11), openedAt: daysAgo(10) },
  ]
  const proofs = [...seedProofs('ev_sharma', 'DSC_'), ...seedProofs('ev_anbu', 'DSC_'), ...seedProofs('ev_kural', 'IMG_')]
  const picks: Record<string, Pick[]> = {
    ev_sharma: proofs.filter(p => p.eventId === 'ev_sharma').filter((_, i) => i % 4 === 0).map((p, i) => ({ proofId: p.id, by: i % 2 ? 'Rahul' : 'Divya', note: i === 1 ? 'Crop a little tighter please' : undefined, at: daysAgo(2) })),
    ev_anbu: proofs.filter(p => p.eventId === 'ev_anbu').filter((_, i) => i % 2 === 0).slice(0, 28).map(p => ({ proofId: p.id, by: 'Kavya', at: daysAgo(9) })),
    ev_kural: proofs.filter(p => p.eventId === 'ev_kural').slice(0, 12).map(p => ({ proofId: p.id, at: daysAgo(4) })),
  }
  const activity: Activity[] = [
    { id: 'a1', eventId: 'ev_sharma', kind: 'created', at: daysAgo(10) },
    { id: 'a2', eventId: 'ev_sharma', kind: 'uploaded', at: daysAgo(6), meta: `${SEED_KEYS.length + 3} proofs` },
    { id: 'a3', eventId: 'ev_sharma', kind: 'shared', at: daysAgo(5), meta: 'WhatsApp' },
    { id: 'a4', eventId: 'ev_sharma', kind: 'opened', at: daysAgo(4), meta: 'Divya' },
    { id: 'a5', eventId: 'ev_sharma', kind: 'selected', at: daysAgo(2), meta: `${picks.ev_sharma.length} picks` },
    { id: 'a6', eventId: 'ev_anbu', kind: 'opened', at: daysAgo(29) },
    { id: 'a7', eventId: 'ev_anbu', kind: 'submitted', at: daysAgo(9), meta: '28 photos' },
  ]
  const drives: Drive[] = [
    { id: 'dr_a', studioId: 'st_lens', label: 'Drive A · 2025 weddings', markerId: '6f1c2a4e-demo-a', capacityBytes: 2_000_398_934_016, usedBytes: 1_612_000_000_000, kept: 'Shelf 1, black case', notes: '', lastScanAt: daysAgo(40), fileCount: 0, photoCount: 0, videoCount: 0, rawCount: 0, status: 'ok', createdAt: daysAgo(70) },
  ]
  const terms: StudioTerm[] = [
    { id: 'tm1', studioId: 'st_lens', plan: 'm12', amount: 10788, from: LENS_FROM, to: '2027-10-01T00:00:00.000Z', paidAt: LENS_FROM, mode: 'upi', note: '' },
    { id: 'tm2', studioId: 'st_kural', plan: 'm1', amount: 1300, from: daysAgo(40), to: daysAgo(10), paidAt: daysAgo(40), mode: 'cash', note: '' },
  ]
  return { studios, events, proofs, picks, activity, drives, scans: [] as Scan[], terms, messages: [] as StudioMessage[], plans: DEFAULT_PLANS }
}

// ─── State ───────────────────────────────────────────────────────────────────

export interface NewEventInput {
  title: string
  date: string
  clientNames: string
  clientPhone: string
  pin?: string
  quota: number
  deadline: string
  lang: 'en' | 'ta'
  chapters?: Chapter[]
}

export interface StudioSignup {
  name: string
  ownerName: string
  phone: string
  city: string
  email?: string
  /** Data URL (resized to 256 px) or a remote URL. */
  logoUrl: string
  plan: PlanKey
}

interface State {
  studios: Studio[]
  events: StudioEvent[]
  proofs: Proof[]
  /** eventId → picks. Only ids, names and notes are stored (no images). */
  picks: Record<string, Pick[]>
  activity: Activity[]
  drives: Drive[]
  scans: Scan[]
  terms: StudioTerm[]
  messages: StudioMessage[]
  plans: Plan[]
  session: StudioSession

  // Auth: POST /auth/otp/request · POST /auth/otp/verify
  /** Signs in an existing studio by phone; returns its id, or null if the phone is unknown. */
  loginStudio: (phone: string) => string | null
  /** New sign-up waits for payment in the TTC admin queue (sub.payment = 'pending'). POST /studios */
  signupStudio: (input: StudioSignup) => string
  logoutStudio: () => void
  /** TTC admin opens a studio's panel as it. POST /admin/studios/:id/impersonate */
  viewAsStudio: (studioId: string) => void

  // Studio profile: PATCH /studio
  updateStudio: (id: string, patch: Partial<Studio>) => void

  // Events: CRUD /studio/events
  createEvent: (studioId: string, input: NewEventInput) => StudioEvent
  updateEvent: (id: string, patch: Partial<StudioEvent>) => void
  deleteEvent: (id: string) => void
  /** POST /events/:id/proofs/complete (after the browser uploaded each preview). */
  addProofs: (eventId: string, proofs: Proof[]) => void
  removeProofs: (ids: string[]) => void
  updateProof: (id: string, patch: Partial<Proof>) => void
  /** draft/uploading → open: client link goes live, deadline starts. */
  openEvent: (id: string) => void
  /** POST /events/:id/reopen */
  reopenEvent: (id: string, extraDays: number) => void
  closeEvent: (id: string) => void
  /** Deletes previews from storage; the selection list stays. */
  archiveEvent: (id: string) => void
  logActivity: (eventId: string, kind: ActivityKind, meta?: string) => void

  // Client gallery: GET /s/:code · PUT /s/:code/selection · POST /s/:code/submit
  togglePick: (eventId: string, proofId: string, by?: string) => void
  setPicks: (eventId: string, picks: Pick[]) => void
  setPickNote: (eventId: string, proofId: string, note: string) => void
  submitSelection: (eventId: string) => void

  // Drives: CRUD /studio/drives · POST /drives/:id/scans
  addDrive: (drive: Omit<Drive, 'id' | 'createdAt'> & { id?: string }) => Drive
  updateDrive: (id: string, patch: Partial<Drive>) => void
  removeDrive: (id: string) => void
  recordScan: (scan: Scan) => void

  // TTC admin: /admin/studios…
  /** 👍 Paid: starts (or extends) a term on the studio's plan and writes a StudioTerm. POST /admin/studios/:id/terms */
  markPaid: (studioId: string, mode: StudioTerm['mode'], note: string) => void
  /** Back to "waiting for payment". PATCH /admin/studios/:id/subscription */
  markPending: (studioId: string) => void
  /** Stops /studio login now; client links get GRACE_DAYS. PATCH /admin/studios/:id/subscription */
  revokePaid: (studioId: string) => void
  /** Plan for the next Paid; the running term is unchanged. PATCH /studio/subscription */
  changePlan: (studioId: string, plan: PlanKey) => void
  declineStudio: (id: string) => void
  cancelStudio: (id: string) => void
  logStudioMessage: (m: Omit<StudioMessage, 'id' | 'at'>) => void
  /** Admin edits a term's name or price; affects future terms only (past terms keep their amount). */
  updatePlan: (key: PlanKey, patch: { name?: string; pricePerMonth?: number }) => void

  resetStudioDemo: () => void
}

export const useStudioStore = create<State>()(
  persist(
    (set, get) => {
      const patchEvent = (id: string, f: (e: StudioEvent) => StudioEvent) => set(s => ({ events: s.events.map(e => (e.id === id ? f(e) : e)) }))
      const patchStudio = (id: string, f: (x: Studio) => Studio) => set(s => ({ studios: s.studios.map(x => (x.id === id ? f(x) : x)) }))
      const log = (eventId: string, kind: ActivityKind, meta?: string) => set(s => ({ activity: [...s.activity, { id: uid('a'), eventId, kind, at: now(), meta }] }))
      const dropPreviews = (ps: Proof[]) => {
        for (const p of ps) {
          if (p.previewKey) idbDel('previews', p.previewKey).catch(() => {})
          if (p.thumbKey) idbDel('previews', p.thumbKey).catch(() => {})
        }
      }

      return {
        ...seed(),
        session: null,

        loginStudio: phone => {
          const d = phone.replace(/\D/g, '').slice(-10)
          const st = get().studios.find(x => x.phone.replace(/\D/g, '').slice(-10) === d && !x.cancelledAt)
          if (!st) return null
          set({ session: { studioId: st.id, phone: st.phone } })
          return st.id
        },
        signupStudio: input => {
          const id = uid('st')
          const studio: Studio = {
            id, name: input.name, slug: input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), ownerName: input.ownerName,
            phone: input.phone, whatsapp: input.phone, email: input.email, city: input.city, logoUrl: input.logoUrl, accent: '#1f1f22', watermark: `© ${input.name}`,
            lang: 'en', defaultQuota: 250, defaultWindowDays: 14, sub: { plan: input.plan, payment: 'pending', changedAt: now() }, ...STUDIO_DEFAULTS(), createdAt: now(), onboarded: false, notes: '',
          }
          set(s => ({ studios: [...s.studios, studio], session: { studioId: id, phone: input.phone } }))
          return id
        },
        logoutStudio: () => set({ session: null }),
        viewAsStudio: studioId => {
          const st = get().studios.find(x => x.id === studioId)
          if (st) set({ session: { studioId, phone: st.phone, viewAsAdmin: true } })
        },

        updateStudio: (id, patch) => patchStudio(id, x => ({ ...x, ...patch })),

        createEvent: (studioId, input) => {
          const e: StudioEvent = {
            id: uid('ev'), studioId, code: shareCode(), pin: input.pin || undefined, title: input.title, date: input.date,
            clientNames: input.clientNames, clientPhone: input.clientPhone, lang: input.lang, quota: input.quota, deadline: input.deadline,
            status: 'draft', chapters: input.chapters ?? DEFAULT_CHAPTERS.slice(0, 1).map(c => ({ ...c, key: 'all', name: 'All photos' })), createdAt: now(),
          }
          set(s => ({ events: [e, ...s.events] }))
          log(e.id, 'created')
          return e
        },
        updateEvent: (id, patch) => patchEvent(id, e => ({ ...e, ...patch })),
        deleteEvent: id => {
          dropPreviews(get().proofs.filter(p => p.eventId === id))
          set(s => {
            const picks = { ...s.picks }
            delete picks[id]
            return { events: s.events.filter(e => e.id !== id), proofs: s.proofs.filter(p => p.eventId !== id), picks, activity: s.activity.filter(a => a.eventId !== id) }
          })
        },
        addProofs: (eventId, proofs) => {
          set(s => ({ proofs: [...s.proofs, ...proofs] }))
          patchEvent(eventId, e => (e.status === 'draft' ? { ...e, status: 'uploading' } : e))
        },
        removeProofs: ids => {
          const set_ = new Set(ids)
          dropPreviews(get().proofs.filter(p => set_.has(p.id)))
          set(s => ({
            proofs: s.proofs.filter(p => !set_.has(p.id)),
            picks: Object.fromEntries(Object.entries(s.picks).map(([k, v]) => [k, v.filter(p => !set_.has(p.proofId))])),
          }))
        },
        updateProof: (id, patch) => set(s => ({ proofs: s.proofs.map(p => (p.id === id ? { ...p, ...patch } : p)) })),
        openEvent: id => {
          const st = get().studios.find(x => x.id === get().events.find(e => e.id === id)?.studioId)
          patchEvent(id, e => ({ ...e, status: 'open', openedAt: e.openedAt ?? now(), deadline: e.deadline || daysAhead(st?.defaultWindowDays ?? 14) }))
          log(id, 'shared')
        },
        reopenEvent: (id, extraDays) => {
          patchEvent(id, e => ({ ...e, status: 'open', submittedAt: undefined, closedAt: undefined, reopenedAt: now(), deadline: daysAhead(extraDays) }))
          log(id, 'reopened', `${extraDays} days`)
        },
        closeEvent: id => {
          patchEvent(id, e => ({ ...e, status: 'closed', closedAt: now() }))
          log(id, 'closed')
        },
        archiveEvent: id => {
          const ps = get().proofs.filter(p => p.eventId === id)
          dropPreviews(ps)
          // Keep proof records (filenames) so the selection list survives; drop the images.
          set(s => ({ proofs: s.proofs.map(p => (p.eventId === id ? { ...p, url: undefined, thumbUrl: undefined, previewKey: undefined, thumbKey: undefined, bytes: 0 } : p)) }))
          patchEvent(id, e => ({ ...e, status: 'archived', archivedAt: now() }))
          log(id, 'archived')
        },
        logActivity: log,

        togglePick: (eventId, proofId, by) =>
          set(s => {
            const cur = s.picks[eventId] ?? []
            const has = cur.some(p => p.proofId === proofId)
            return { picks: { ...s.picks, [eventId]: has ? cur.filter(p => p.proofId !== proofId) : [...cur, { proofId, by, at: now() }] } }
          }),
        setPicks: (eventId, picks) => set(s => ({ picks: { ...s.picks, [eventId]: picks } })),
        setPickNote: (eventId, proofId, note) =>
          set(s => ({ picks: { ...s.picks, [eventId]: (s.picks[eventId] ?? []).map(p => (p.proofId === proofId ? { ...p, note: note || undefined, at: now() } : p)) } })),
        submitSelection: eventId => {
          patchEvent(eventId, e => ({ ...e, status: 'submitted', submittedAt: now() }))
          log(eventId, 'submitted', `${(get().picks[eventId] ?? []).length} photos`)
        },

        addDrive: input => {
          const d: Drive = { ...input, id: input.id ?? uid('dr'), createdAt: now() }
          set(s => ({ drives: [...s.drives, d] }))
          return d
        },
        updateDrive: (id, patch) => set(s => ({ drives: s.drives.map(d => (d.id === id ? { ...d, ...patch } : d)) })),
        removeDrive: id => set(s => ({ drives: s.drives.filter(d => d.id !== id), scans: s.scans.filter(x => x.driveId !== id) })),
        recordScan: scan => set(s => ({ scans: [...s.scans, scan] })),

        markPaid: (studioId, mode, note) => {
          const x = get().studios.find(y => y.id === studioId)
          if (!x) return
          const t = now()
          // Paying early extends the running term instead of overlapping it.
          const running = x.sub.payment === 'paid' && !!x.sub.endsAt && x.sub.endsAt > t
          const term = termFor(x, get().plans, running ? x.sub.endsAt! : t)
          const rec: StudioTerm = { id: uid('tm'), studioId, plan: x.sub.plan, amount: term.amount, from: term.from, to: term.to, paidAt: t, mode, note: note.trim() }
          set(s => ({
            terms: [...s.terms, rec],
            studios: s.studios.map(y => (y.id === studioId ? { ...y, cancelledAt: undefined, sub: { ...y.sub, payment: 'paid', startedAt: running ? y.sub.startedAt : term.from, endsAt: term.to, changedAt: t } } : y)),
          }))
        },
        markPending: studioId => patchStudio(studioId, x => ({ ...x, cancelledAt: undefined, sub: { ...x.sub, payment: 'pending', changedAt: now() } })),
        revokePaid: studioId => patchStudio(studioId, x => ({ ...x, sub: { ...x.sub, payment: 'revoked', changedAt: now() } })),
        changePlan: (studioId, plan) => patchStudio(studioId, x => ({ ...x, sub: { ...x.sub, plan } })),
        declineStudio: id => patchStudio(id, x => ({ ...x, cancelledAt: now() })),
        cancelStudio: id => patchStudio(id, x => ({ ...x, cancelledAt: now() })),
        logStudioMessage: m => set(s => ({ messages: [...s.messages, { ...m, id: uid('sm'), at: now() }] })),
        updatePlan: (key, patch) => set(s => ({ plans: s.plans.map(p => (p.key === key ? { ...p, ...patch } : p)) })),

        resetStudioDemo: () => set({ ...seed(), session: get().session }),
      }
    },
    {
      name: 'ttc-studio-v2',
      version: 3,
      storage: createJSONStorage(() => localStorage),
      // v2 → v3: studios gain pickerVersion, featureDefaults, portalBanner; seed gains the Meera gallery.
      migrate: (persisted, version) => {
        const s = (persisted ?? {}) as Partial<State>
        if (version < 3) {
          s.studios = (s.studios ?? []).map(x => ({ ...STUDIO_DEFAULTS(), ...x }))
          if (s.events && !s.events.some(e => e.id === 'ev_meera')) s.events = [...s.events, ...seed().events.filter(e => e.id === 'ev_meera')]
        }
        return s as State
      },
    },
  ),
)

// ─── Selectors ───────────────────────────────────────────────────────────────

export const useCurrentStudio = () => useStudioStore(s => (s.session ? s.studios.find(x => x.id === s.session!.studioId) : undefined))
export const studioById = (id: string) => useStudioStore.getState().studios.find(x => x.id === id)
export const eventByCode = (code: string) => useStudioStore.getState().events.find(e => e.code === code.toLowerCase())
