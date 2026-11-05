import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Faith } from '../../lib/poses'
import { DEFAULT_CHAPTERS, shareCode, studioById, uid, useStudioStore } from '../store'
import { DEFAULT_FEATURES, type FeatureFlags, type Studio } from '../types'
import { defaultMilestones } from './money'
import { advanceStage } from './progress'
import type { ClientRequest, Contract, Deliverable, Milestone, PosePlan, PoseAnswer, Project, ProjectDoc, ProjectEvent, ProjectPayment, ProjectStatus, QuoteLine, WorkStage } from './types'

/**
 * Persisted mock of the Studio OS backend (projects).
 * Endpoints it stands in for: CRUD /studio/projects,
 * POST /projects/:id/payments, and the client portal's
 * GET /p/:code, POST /p/:code/contract/accept, POST /p/:code/requests,
 * PUT /p/:code/moodboard, PATCH /p/:code/events/:id (maps link),
 * PUT /poses/:code/picks, POST /poses/:code/submit.
 */

const now = () => new Date().toISOString()
const day = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10)
const pin4 = () => String(1000 + Math.floor(Math.random() * 9000))

export const CONTRACT_TEMPLATE = `SERVICES AGREEMENT (sample template, have it checked before use)

This agreement is between {{studio}} ("the Studio") and {{client}} ("the Client") for the photography and videography services listed in the quote, for a total of {{total}} including tax.

1. Booking. The date is reserved once the advance is received. The advance is not refundable if the Client cancels.
2. Payments. The Client pays as per the payment schedule in the portal. Final files and albums are released after the full amount is paid.
3. Coverage. The Studio covers the events, dates and hours listed in the schedule. Extra hours are charged at the rate in the quote.
4. Deliverables. The Studio delivers the items in the deliverables list within the timelines shown in the portal. Timelines start once the Client's photo selection is submitted, where a selection is needed.
5. Copyright. The Studio keeps copyright and may use a small number of images for its portfolio unless the Client asks in writing that it does not.
6. Client duties. The Client shares venue locations, timings and any restrictions at the venue in good time.
7. Changes. Changes to dates or scope are agreed in writing and may change the total.`

export const DELIVERABLE_PRESETS: Omit<Deliverable, 'id'>[] = [
  { label: 'Traditional Photos', spec: 'Unlimited', total: null, done: 0, status: 'not_started' },
  { label: 'Candid Photos', spec: '300 edited', total: 300, done: 0, status: 'not_started' },
  { label: 'Highlight Video', spec: '5–7 min', total: 1, done: 0, status: 'not_started' },
  { label: 'Documentation Video', spec: 'No limit', total: 1, done: 0, status: 'not_started' },
  { label: 'Reel', spec: '60 s', total: 5, done: 0, status: 'not_started' },
]

const lines = (xs: [string, number, number][]): QuoteLine[] => xs.map(([label, qty, rate], i) => ({ id: `ql${i}`, label, qty, rate }))

function seedProjects(): Project[] {
  const wedDate = day(-18)
  const p1: Project = {
    id: 'pj_divya', studioId: 'st_lens', code: 'divya2rk', pin: '4821', status: 'post_production', name: 'Divya & Rahul Wedding', type: 'Wedding',
    clientNames: 'Divya & Rahul', greetName: 'Divya', phone: '+91 98765 11111', email: 'divya@example.com', externalLink: 'https://instagram.com/',
    events: [
      { id: 'pe1', name: 'Reception', date: day(-19), time: '18:30', venue: 'Le Meridien, Coimbatore', mapsUrl: 'https://maps.google.com/?q=Le+Meridien+Coimbatore' },
      { id: 'pe2', name: 'Wedding', date: wedDate, time: '06:00', venue: 'Sri Krishna Mahal, Coimbatore', note: 'Muhurtham 7:30 to 9:00. Arrive by 5:30.' },
    ],
    quote: { lines: lines([['Traditional photography, 2 days', 2, 35000], ['Candid photography, 2 days', 2, 30000], ['Cinematic video, 2 days', 2, 40000], ['Drone, wedding day', 1, 15000], ['Album, 12×36, 40 sheets', 1, 25000]]), discount: 10000, taxOn: true, taxPct: 18 },
    deliverables: [
      { ...DELIVERABLE_PRESETS[0], id: 'dv1', status: 'in_progress' },
      { ...DELIVERABLE_PRESETS[1], id: 'dv2', status: 'in_progress', done: 120, galleryEventId: 'ev_sharma' },
      { ...DELIVERABLE_PRESETS[2], id: 'dv3' },
      { ...DELIVERABLE_PRESETS[3], id: 'dv4' },
      { ...DELIVERABLE_PRESETS[4], id: 'dv5', done: 2, status: 'in_progress' },
    ],
    milestones: defaultMilestones(wedDate).map((m, i) => ({ ...m, dueDate: [day(-90), day(-40), wedDate, day(25)][i] })),
    payments: [
      { id: 'pp1', amount: 50000, mode: 'upi', at: day(-92), ref: 'UPI 4821' },
      { id: 'pp2', amount: 54100, mode: 'bank', at: day(-41), ref: 'NEFT' },
      { id: 'pp3', amount: 60000, mode: 'cash', at: wedDate },
    ],
    contract: { body: CONTRACT_TEMPLATE, extraTerms: 'Album design starts after the selection is submitted.', sentAt: day(-95), acceptedAt: day(-93), acceptedBy: 'Divya' },
    moodboard: { pinterestUrl: 'https://pinterest.com/', notes: 'Soft pastel tones, lots of candid family moments.', images: [] },
    requests: [{ id: 'rq1', text: 'Can we get 3 teaser photos for Instagram this week?', status: 'in_progress', at: day(-3), reply: 'Yes, by Friday.', repliedAt: day(-2) }],
    documents: [{ id: 'doc1', name: 'Quote PDF', url: '#', at: day(-95) }],
    whatsappGroup: 'https://chat.whatsapp.com/',
    galleryEventId: 'ev_sharma',
    theme: 'Chettinad traditional', religion: 'hindu', features: { ...DEFAULT_FEATURES }, stage: 'selection_sent',
    poses: {
      faiths: ['hindu'], eventKey: 'wedding',
      ids: ['wed-first-look', 'wed-forehead', 'wed-walk', 'wed-backhug', 'wed-royal', 'wed-family', 'wed-girls', 'wed-thaali', 'wed-maalai', 'wed-agni', 'wed-metti', 'wed-oonjal'],
      sentAt: day(-25), picks: { 'wed-first-look': 'yes', 'wed-forehead': 'yes', 'wed-walk': 'no', 'wed-backhug': 'yes' },
    },
    createdAt: day(-96), updatedAt: day(-2),
  }
  const p2: Project = {
    id: 'pj_meera', studioId: 'st_lens', code: 'meera7wq', pin: '1234', status: 'active', name: 'Meera & Karthik Engagement', type: 'Engagement',
    clientNames: 'Meera & Karthik', greetName: 'Meera', phone: '+91 98765 66666',
    events: [{ id: 'pe3', name: 'Engagement', date: day(24), time: '17:00', venue: 'Residency Towers, Coimbatore' }],
    quote: { lines: lines([['Candid photography, 4 h', 1, 30000], ['Highlight reel', 1, 8000]]), discount: 0, taxOn: true, taxPct: 18 },
    deliverables: [{ ...DELIVERABLE_PRESETS[1], id: 'dv6', spec: '150 edited', total: 150 }, { ...DELIVERABLE_PRESETS[4], id: 'dv7', total: 1 }],
    milestones: defaultMilestones(day(24)).map((m, i) => ({ ...m, dueDate: [day(-5), day(10), day(24), day(50)][i] })),
    payments: [],
    contract: { body: CONTRACT_TEMPLATE, extraTerms: '', sentAt: day(-6) },
    moodboard: { notes: '', images: [] },
    requests: [], documents: [],
    galleryEventId: 'ev_meera',
    theme: '', features: { ...DEFAULT_FEATURES }, stage: 'booked',
    createdAt: day(-7), updatedAt: day(-6),
  }
  return [p1, p2]
}

/** Studio-wide defaults used when a project is created (Settings page). */
export interface OsSettings {
  taxOn: boolean
  taxPct: number
  milestones: Milestone[]
  deliverables: Omit<Deliverable, 'id'>[]
  contractBody: string
  whatsappGroup: string
}

export const DEFAULT_SETTINGS: OsSettings = {
  taxOn: true,
  taxPct: 18,
  milestones: defaultMilestones(),
  deliverables: DELIVERABLE_PRESETS,
  contractBody: CONTRACT_TEMPLATE,
  whatsappGroup: '',
}

export interface NewProjectInput {
  name: string
  type: string
  clientNames: string
  greetName: string
  phone: string
  email?: string
}

interface OsState {
  projects: Project[]
  /** studioId → defaults. Missing → DEFAULT_SETTINGS. */
  settings: Record<string, OsSettings>

  updateSettings: (studioId: string, patch: Partial<OsSettings>) => void

  createProject: (studioId: string, input: NewProjectInput) => Project
  /** Generic patch for any project field (tabs edit their own slice). */
  updateProject: (id: string, patch: Partial<Project>) => void
  setProjectStatus: (id: string, status: ProjectStatus) => void
  deleteProject: (id: string) => void
  regeneratePin: (id: string) => void

  upsertEvent: (projectId: string, e: ProjectEvent) => void
  removeEvent: (projectId: string, eventId: string) => void
  setQuoteLines: (projectId: string, lines: QuoteLine[]) => void
  setMilestones: (projectId: string, ms: Milestone[]) => void
  recordPayment: (projectId: string, p: Omit<ProjectPayment, 'id'>) => void
  removePayment: (projectId: string, paymentId: string) => void
  upsertDeliverable: (projectId: string, d: Deliverable) => void
  removeDeliverable: (projectId: string, id: string) => void
  updateContract: (projectId: string, patch: Partial<Contract>) => void

  // Client portal actions
  acceptContract: (projectId: string, name: string) => void
  addRequest: (projectId: string, text: string, deliverableId?: string) => void
  updateRequest: (projectId: string, id: string, patch: Partial<ClientRequest>) => void
  setEventMapsUrl: (projectId: string, eventId: string, url: string) => void
  addDocument: (projectId: string, d: Omit<ProjectDoc, 'id' | 'at'>) => void
  removeDocument: (projectId: string, id: string) => void

  // Per-customer settings and work stage (Overview tab)
  setStage: (projectId: string, stage: WorkStage) => void
  setFeatures: (projectId: string, patch: Partial<FeatureFlags>) => void
  setReligion: (projectId: string, faith: Faith | undefined) => void
  setTheme: (projectId: string, theme: string) => void

  // Gallery tab: the project's album selector event (CRUD /studio/events, linked on the project)
  /** Creates and links the project's gallery if it has none; returns the event id. */
  ensureGallery: (projectId: string) => string | undefined

  // Poses tab · /poses/:code
  /** Replaces or patches the pose plan (event type, faiths, ids, order). */
  setPosePlan: (projectId: string, patch: Partial<PosePlan>) => void
  /** Sends the poses link live (sets sentAt), or takes it back. */
  togglePoseSend: (projectId: string) => void
  /** Client answers one pose; saved as they go. undefined clears it. */
  setPosePick: (projectId: string, poseId: string, answer: PoseAnswer | undefined) => void
  submitPoses: (projectId: string, picks?: Record<string, PoseAnswer>) => void
  reopenPoses: (projectId: string) => void

  resetOsDemo: () => void
}

/** Album selector event for a project, in the studio's defaults. */
function newGallery(studio: Studio, p: Pick<Project, 'clientNames' | 'type' | 'phone' | 'events'>) {
  const first = p.events.map(e => e.date).filter(Boolean).sort()[0] ?? new Date().toISOString().slice(0, 10)
  const end = new Date(Date.now() + studio.defaultWindowDays * 86_400_000)
  end.setHours(23, 59, 59, 0)
  return useStudioStore.getState().createEvent(studio.id, {
    title: `${p.clientNames} · ${p.type}`,
    date: first,
    clientNames: p.clientNames,
    clientPhone: p.phone,
    quota: studio.defaultQuota,
    deadline: end.toISOString(),
    lang: studio.lang,
    chapters: DEFAULT_CHAPTERS.map(c => ({ ...c })),
  })
}

/** Fills fields added in v3 on a saved project. */
export function withV3Defaults(p: Partial<Project> & Pick<Project, 'id'>): Project {
  return { theme: '', stage: 'booked', ...p, features: { ...DEFAULT_FEATURES, ...p.features } } as Project
}

export const useOsStore = create<OsState>()(
  persist(
    (set, get) => {
      const patch = (id: string, f: (p: Project) => Partial<Project>) =>
        set(s => ({ projects: s.projects.map(p => (p.id === id ? { ...p, ...f(p), updatedAt: now() } : p)) }))

      const createProject: OsState['createProject'] = (studioId, input) => {
        const cfg = get().settings?.[studioId] ?? DEFAULT_SETTINGS
        const studio = studioById(studioId)
        const p: Project = {
          id: uid('pj'), studioId, code: shareCode(), pin: pin4(), status: 'active', name: input.name, type: input.type,
          clientNames: input.clientNames, greetName: input.greetName || input.clientNames.split(/\s*&\s*|\s+/)[0], phone: input.phone, email: input.email,
          events: [], quote: { lines: [], discount: 0, taxOn: cfg.taxOn, taxPct: cfg.taxPct }, deliverables: cfg.deliverables.map(d => ({ ...d, id: uid('dv') })),
          milestones: cfg.milestones.map(m => ({ ...m, id: uid('ms') })), payments: [],
          contract: { body: cfg.contractBody || CONTRACT_TEMPLATE, extraTerms: '' }, whatsappGroup: cfg.whatsappGroup || undefined, moodboard: { notes: '', images: [] }, requests: [], documents: [],
          theme: '', features: { ...DEFAULT_FEATURES, ...studio?.featureDefaults }, stage: 'booked',
          createdAt: now(), updatedAt: now(),
        }
        // Every project gets its gallery up front: upload inside the project, then copy the link.
        if (studio) {
          p.galleryEventId = newGallery(studio, p).id
          const d = p.deliverables.find(x => /candid|photo/i.test(x.label) && x.total !== null) ?? p.deliverables.find(x => x.total !== null)
          if (d) d.galleryEventId = p.galleryEventId
        }
        set(s => ({ projects: [p, ...s.projects] }))
        return p
      }

      return {
        projects: seedProjects(),
        settings: {},

        updateSettings: (studioId, p) => set(s => ({ settings: { ...s.settings, [studioId]: { ...(s.settings[studioId] ?? DEFAULT_SETTINGS), ...p } } })),

        createProject,
        updateProject: (id, p) => patch(id, () => p),
        setProjectStatus: (id, status) => patch(id, () => ({ status })),
        deleteProject: id => {
          const ev = get().projects.find(p => p.id === id)?.galleryEventId
          // The gallery belongs to the project; drop it unless another project still links it.
          if (ev && !get().projects.some(p => p.id !== id && p.galleryEventId === ev)) useStudioStore.getState().deleteEvent(ev)
          set(s => ({ projects: s.projects.filter(p => p.id !== id) }))
        },
        regeneratePin: id => patch(id, () => ({ pin: pin4() })),

        upsertEvent: (pid, e) => patch(pid, p => ({ events: p.events.some(x => x.id === e.id) ? p.events.map(x => (x.id === e.id ? e : x)) : [...p.events, e] })),
        removeEvent: (pid, eid) => patch(pid, p => ({ events: p.events.filter(x => x.id !== eid) })),
        setQuoteLines: (pid, lines) => patch(pid, p => ({ quote: { ...p.quote, lines } })),
        setMilestones: (pid, milestones) => patch(pid, () => ({ milestones })),
        recordPayment: (pid, pay) => patch(pid, p => ({ payments: [...p.payments, { ...pay, id: uid('pp') }] })),
        removePayment: (pid, id) => patch(pid, p => ({ payments: p.payments.filter(x => x.id !== id) })),
        upsertDeliverable: (pid, d) => patch(pid, p => ({ deliverables: p.deliverables.some(x => x.id === d.id) ? p.deliverables.map(x => (x.id === d.id ? d : x)) : [...p.deliverables, d] })),
        removeDeliverable: (pid, id) => patch(pid, p => ({ deliverables: p.deliverables.filter(x => x.id !== id) })),
        updateContract: (pid, c) => patch(pid, p => ({ contract: { ...p.contract, ...c } })),

        acceptContract: (pid, name) => patch(pid, p => ({ contract: { ...p.contract, acceptedAt: now(), acceptedBy: name } })),
        addRequest: (pid, text, deliverableId) => patch(pid, p => ({ requests: [{ id: uid('rq'), text, deliverableId, status: 'open', at: now() }, ...p.requests] })),
        updateRequest: (pid, id, r) => patch(pid, p => ({ requests: p.requests.map(x => (x.id === id ? { ...x, ...r } : x)) })),
        setEventMapsUrl: (pid, eid, url) => patch(pid, p => ({ events: p.events.map(e => (e.id === eid ? { ...e, mapsUrl: url } : e)) })),
        addDocument: (pid, d) => patch(pid, p => ({ documents: [...p.documents, { ...d, id: uid('doc'), at: now() }] })),
        removeDocument: (pid, id) => patch(pid, p => ({ documents: p.documents.filter(x => x.id !== id) })),

        setStage: (pid, stage) => patch(pid, () => ({ stage })),
        setFeatures: (pid, f) => patch(pid, p => ({ features: { ...p.features, ...f } })),
        setReligion: (pid, religion) => patch(pid, () => ({ religion })),
        setTheme: (pid, theme) => patch(pid, () => ({ theme })),

        ensureGallery: pid => {
          const p = get().projects.find(x => x.id === pid)
          if (!p) return undefined
          if (p.galleryEventId && useStudioStore.getState().events.some(e => e.id === p.galleryEventId)) return p.galleryEventId
          const studio = studioById(p.studioId)
          if (!studio) return undefined
          const ev = newGallery(studio, p)
          const d = p.deliverables.find(x => !x.galleryEventId && /candid|photo/i.test(x.label) && x.total !== null)
          patch(pid, () => ({ galleryEventId: ev.id, deliverables: d ? p.deliverables.map(x => (x.id === d.id ? { ...x, galleryEventId: ev.id } : x)) : p.deliverables }))
          return ev.id
        },

        setPosePlan: (pid, pp) => patch(pid, p => ({ poses: { faiths: [], eventKey: 'wedding', ids: [], picks: {}, ...p.poses, ...pp } })),
        togglePoseSend: pid => patch(pid, p => (p.poses ? { poses: { ...p.poses, sentAt: p.poses.sentAt ? undefined : now() } } : {})),
        setPosePick: (pid, poseId, answer) =>
          patch(pid, p => {
            if (!p.poses || p.poses.submittedAt) return {}
            const picks = { ...p.poses.picks }
            if (answer) picks[poseId] = answer
            else delete picks[poseId]
            return { poses: { ...p.poses, picks } }
          }),
        submitPoses: (pid, picks) => patch(pid, p => (p.poses ? { poses: { ...p.poses, picks: picks ?? p.poses.picks, submittedAt: now() } } : {})),
        reopenPoses: pid => patch(pid, p => (p.poses ? { poses: { ...p.poses, submittedAt: undefined } } : {})),

        resetOsDemo: () => set({ projects: seedProjects(), settings: {} }),
      }
    },
    {
      name: 'ttc-studio-os-v2',
      version: 3,
      storage: createJSONStorage(() => localStorage),
      // v2 → v3: projects gain theme, features, stage (and optional religion, poses, pickerOverride). The seed Meera project gets its gallery.
      migrate: (persisted, version) => {
        const s = (persisted ?? {}) as Partial<OsState>
        if (version < 3) s.projects = (s.projects ?? []).map(p => withV3Defaults(p.id === 'pj_meera' && !p.galleryEventId ? { ...p, galleryEventId: 'ev_meera' } : p))
        return s as OsState
      },
    },
  ),
)

/** Moves the stage forward to `to` (never back). Used by client submits. */
export const bumpStage = (projectId: string, to: WorkStage) => {
  const p = useOsStore.getState().projects.find(x => x.id === projectId)
  if (p) {
    const next = advanceStage(p.stage, to)
    if (next !== p.stage) useOsStore.getState().setStage(projectId, next)
  }
}

export const projectByCode = (code: string) => useOsStore.getState().projects.find(p => p.code === code.toLowerCase())

/** Settings for one studio; stable reference (falls back to the shared default object). */
export const useOsSettings = (studioId: string | undefined) => useOsStore(s => (studioId && s.settings?.[studioId]) || DEFAULT_SETTINGS)
