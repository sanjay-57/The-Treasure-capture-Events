import { DEVICE_ONLY, type StoreName } from '../../../src/api/collections'
import type { Grants } from '../auth/grants'
import type { Slice } from '../engine/slice'
import { STORES, bumpStage } from '../engine/stores'
import { phone10 } from '../util'
import type { Scope } from './scope'

type Args = any[]

export interface Ctx {
  args: Args
  scope: Scope
  /** Grants after the call; `after` may add to them (new order, new studio). */
  grants: Grants
}

export interface Policy {
  /** Non-admin access. Admin may call every listed action unless `adminToo` is false. */
  allow: (c: Ctx) => boolean
  /** Loads the records the action reads and may change. */
  load: (s: Slice, c: Ctx) => void
  /** Replaces the plain `store.action(...args)` call. */
  run?: (c: Ctx, call: () => unknown) => unknown
  /** Runs after commit, with the action's return value. */
  after?: (c: Ctx, result: unknown) => void
}

const nobody = () => false
const OPEN_EVENT = new Set(['open', 'uploading'])

/** Patch keys only TTC admin may set. */
const ADMIN_STUDIO_KEYS = ['id', 'sub', 'pickerVersion', 'portalBanner', 'cancelledAt', 'createdAt', 'phone']
const ADMIN_PROJECT_KEYS = ['id', 'studioId', 'code', 'pickerOverride', 'createdAt']
const ADMIN_EVENT_KEYS = ['id', 'studioId', 'code', 'createdAt']
const patchIsSafe = (patch: unknown, banned: string[]) => !!patch && typeof patch === 'object' && !Object.keys(patch).some(k => banned.includes(k))

// ── Building blocks ─────────────────────────────────────────────────────────

/** Customer of the order in args[0] (or admin). */
const customerOrder: Policy = {
  allow: c => c.scope.ownsOrder(c.args[0]),
  load: (s, c) => s.order(c.args[0]),
}
/** Studio that owns the event in args[0]. */
const studioEvent: Policy = {
  allow: c => c.scope.ownsEvent(c.args[0]),
  load: (s, c) => s.event(c.args[0]),
}
/** Studio that owns the project in args[0]. */
const studioProject: Policy = {
  allow: c => c.scope.ownsProject(c.args[0]),
  load: (s, c) => s.project(c.args[0]),
}
/** Studio, or its customer holding the project's link + PIN. */
const projectCustomer: Policy = {
  allow: c => c.scope.ownsProject(c.args[0]) || c.scope.gateProject(c.args[0]),
  load: (s, c) => s.project(c.args[0]),
}
/** Picking photos: the studio, or the gallery's customer while it is open. */
const picker: Policy = {
  allow: c => c.scope.ownsEvent(c.args[0]) || (c.scope.gateEvent(c.args[0]) && OPEN_EVENT.has(c.scope.event(c.args[0])?.status)),
  load: (s, c) => s.event(c.args[0]),
}
const adminStudio: Policy = { allow: nobody, load: (s, c) => s.studio(c.args[0]) }

// ── The table ───────────────────────────────────────────────────────────────

const TTC: Record<string, Policy> = {
  captureLead: { allow: () => true, load: () => {} },
  // The browser sends its draft as the only argument; the store action reads it from state.
  submitEnquiry: {
    allow: c => isDraft(c.args[0]),
    load: s => s.allOrders(),
    run: c => {
      STORES.ttc.setState({ draft: c.args[0] })
      return STORES.ttc.getState().submitEnquiry()
    },
    // The device that sent the enquiry may follow it without logging in; other orders on the phone need the code.
    after: (c, id) => {
      if (typeof id === 'string' && !c.grants.orderIds.includes(id)) c.grants.orderIds.push(id)
    },
  },
  saveShowroomQuote: { allow: nobody, load: s => s.allOrders() },
  toggleSelection: customerOrder,
  submitSelection: customerOrder,
  saveAlbum: customerOrder,
  submitReview: customerOrder,
  ratePose: customerOrder,
  submitPoses: customerOrder,
}

const STUDIO: Record<string, Policy> = {
  signupStudio: {
    allow: c => !!c.grants.verified && phone10(c.args[0]?.phone) === c.grants.verified && !c.grants.studioId,
    load: s => s.allStudios(),
    after: (c, id) => {
      if (typeof id !== 'string') return
      if (!c.grants.admin) {
        c.grants.studioId = id
        delete c.grants.verified
      }
    },
  },
  updateStudio: { allow: c => c.scope.ownsStudio(c.args[0]) && patchIsSafe(c.args[1], ADMIN_STUDIO_KEYS), load: (s, c) => s.studioBase(c.args[0]) },
  changePlan: { allow: c => c.scope.ownsStudio(c.args[0]), load: (s, c) => s.studioBase(c.args[0]) },

  createEvent: { allow: c => c.scope.ownsStudio(c.args[0]), load: (s, c) => s.studio(c.args[0]) },
  updateEvent: { allow: c => c.scope.ownsEvent(c.args[0]) && patchIsSafe(c.args[1], ADMIN_EVENT_KEYS), load: (s, c) => s.event(c.args[0]) },
  deleteEvent: studioEvent,
  openEvent: studioEvent,
  reopenEvent: studioEvent,
  closeEvent: studioEvent,
  archiveEvent: studioEvent,
  logActivity: { allow: c => c.scope.seesEvent(c.args[0]), load: (s, c) => s.event(c.args[0]) },

  addProofs: {
    allow: c => c.scope.ownsEvent(c.args[0]) && Array.isArray(c.args[1]) && c.args[1].every((p: any) => proofIsSafe(p, c.args[0])),
    load: (s, c) => s.event(c.args[0]),
  },
  removeProofs: {
    allow: c => Array.isArray(c.args[0]) && c.args[0].every((id: string) => { const p = c.scope.proof(id); return !!p && c.scope.ownsEvent(p.eventId) }),
    load: (s, c) => { for (const id of c.args[0] as string[]) s.proof(id) },
  },
  updateProof: {
    allow: c => { const p = c.scope.proof(c.args[0]); return !!p && c.scope.ownsEvent(p.eventId) && patchIsSafe(c.args[1], ['id', 'eventId', 'url', 'thumbUrl']) },
    load: (s, c) => s.proof(c.args[0]),
  },

  togglePick: picker,
  setPicks: picker,
  setPickNote: picker,
  submitSelection: {
    ...picker,
    // The couple submitting also moves the linked project to "selection received".
    run: (c, call) => {
      const out = call()
      for (const p of STORES.os.getState().projects as { id: string; galleryEventId?: string }[])
        if (p.galleryEventId === c.args[0]) bumpStage(p.id, 'selection_received')
      return out
    },
  },

  addDrive: { allow: c => c.scope.ownsStudio(c.args[0]?.studioId), load: (s, c) => s.studioBase(c.args[0]?.studioId) },
  updateDrive: { allow: c => c.scope.ownsDrive(c.args[0]) && patchIsSafe(c.args[1], ['id', 'studioId']), load: (s, c) => s.drive(c.args[0]) },
  removeDrive: { allow: c => c.scope.ownsDrive(c.args[0]), load: (s, c) => s.drive(c.args[0]) },
  recordScan: { allow: c => c.scope.ownsDrive(c.args[0]?.driveId), load: (s, c) => s.drive(c.args[0]?.driveId) },

  markPaid: adminStudio,
  markPending: adminStudio,
  revokePaid: adminStudio,
  declineStudio: adminStudio,
  cancelStudio: adminStudio,
  logStudioMessage: { allow: nobody, load: (s, c) => s.studioBase(c.args[0]?.studioId) },
  updatePlan: { allow: nobody, load: () => {} },
}

const OS: Record<string, Policy> = {
  updateSettings: { allow: c => c.scope.ownsStudio(c.args[0]), load: (s, c) => s.studioBase(c.args[0]) },
  createProject: { allow: c => c.scope.ownsStudio(c.args[0]), load: (s, c) => s.studio(c.args[0]) },
  updateProject: { allow: c => c.scope.ownsProject(c.args[0]) && patchIsSafe(c.args[1], ADMIN_PROJECT_KEYS), load: (s, c) => s.project(c.args[0]) },
  deleteProject: { ...studioProject, load: (s, c) => s.project(c.args[0], true) },
  ensureGallery: { ...studioProject, load: (s, c) => s.project(c.args[0]).studio(c.scope.project(c.args[0])?.studioId) },
  setStage: {
    // The couple's own submit may move the stage to "selection received"; anything else is the studio's.
    allow: c => c.scope.ownsProject(c.args[0]) || (c.scope.gateProject(c.args[0]) && c.args[1] === 'selection_received'),
    load: (s, c) => s.project(c.args[0]),
  },
  acceptContract: projectCustomer,
  addRequest: projectCustomer,
  setPosePick: projectCustomer,
  submitPoses: projectCustomer,
}
for (const name of [
  'setProjectStatus', 'regeneratePin', 'upsertEvent', 'removeEvent', 'setQuoteLines', 'setMilestones', 'recordPayment', 'removePayment',
  'upsertDeliverable', 'removeDeliverable', 'updateContract', 'updateRequest', 'setEventMapsUrl', 'addDocument', 'removeDocument',
  'setFeatures', 'setReligion', 'setTheme', 'setPosePlan', 'togglePoseSend', 'reopenPoses',
]) OS[name] = studioProject

const TABLE: Record<StoreName, Record<string, Policy>> = { ttc: TTC, studio: STUDIO, os: OS }

/**
 * Policy for store.action. Actions not in the table (new ones other chats add) are
 * admin-only and load their whole store, so they work for admin without a server change.
 */
export function policyFor(store: StoreName, action: string): Policy | undefined {
  if (DEVICE_ONLY[store].includes(action)) return undefined
  return TABLE[store][action] ?? { allow: nobody, load: s => s.everything(store) }
}

export const LISTED = TABLE

function isDraft(d: any): boolean {
  return !!d && typeof d === 'object' && typeof d.name === 'string' && typeof d.contact === 'string' && phone10(d.contact).length === 10 && !!d.cart
}

/** Proofs may only point at this server's media for that event, or at an https URL (seed images). */
function proofIsSafe(p: any, eventId: string): boolean {
  if (!p || typeof p !== 'object' || p.eventId !== eventId || typeof p.id !== 'string') return false
  const ok = (u: unknown) => u === undefined || (typeof u === 'string' && (u.startsWith(`/media/proofs/${eventId}/`) || u.startsWith('https://')))
  return ok(p.url) && ok(p.thumbUrl)
}
