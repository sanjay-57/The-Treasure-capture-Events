/**
 * Where every server-owned record lives in the three Zustand stores. Shared by
 * the browser (src/api/sync.ts) and the server (server/src/engine), so both sides
 * agree on ids and shapes. Pure data: never import a store here.
 */

export type StoreName = 'ttc' | 'studio' | 'os'

export type Coll =
  | 'orders' | 'leads' | 'workers' | 'outbox' | 'cms'
  | 'studios' | 'events' | 'proofs' | 'picks' | 'activity' | 'drives' | 'scans' | 'terms' | 'messages' | 'plans'
  | 'projects' | 'settings'

export interface CollDef {
  coll: Coll
  store: StoreName
  /** State key inside the store. */
  key: string
  /** array: list of objects with an id field; record: object keyed by id; single: one object (id 'main'). */
  shape: 'array' | 'record' | 'single'
  /** Id field for array shapes. */
  idKey?: 'id' | 'key'
}

export const COLLECTIONS: CollDef[] = [
  { coll: 'orders', store: 'ttc', key: 'orders', shape: 'array', idKey: 'id' },
  { coll: 'leads', store: 'ttc', key: 'leads', shape: 'array', idKey: 'id' },
  { coll: 'workers', store: 'ttc', key: 'workers', shape: 'array', idKey: 'id' },
  { coll: 'outbox', store: 'ttc', key: 'outbox', shape: 'array', idKey: 'id' },
  { coll: 'cms', store: 'ttc', key: 'cms', shape: 'single' },
  { coll: 'studios', store: 'studio', key: 'studios', shape: 'array', idKey: 'id' },
  { coll: 'events', store: 'studio', key: 'events', shape: 'array', idKey: 'id' },
  { coll: 'proofs', store: 'studio', key: 'proofs', shape: 'array', idKey: 'id' },
  { coll: 'picks', store: 'studio', key: 'picks', shape: 'record' },
  { coll: 'activity', store: 'studio', key: 'activity', shape: 'array', idKey: 'id' },
  { coll: 'drives', store: 'studio', key: 'drives', shape: 'array', idKey: 'id' },
  { coll: 'scans', store: 'studio', key: 'scans', shape: 'array', idKey: 'id' },
  { coll: 'terms', store: 'studio', key: 'terms', shape: 'array', idKey: 'id' },
  { coll: 'messages', store: 'studio', key: 'messages', shape: 'array', idKey: 'id' },
  { coll: 'plans', store: 'studio', key: 'plans', shape: 'array', idKey: 'key' },
  { coll: 'projects', store: 'os', key: 'projects', shape: 'array', idKey: 'id' },
  { coll: 'settings', store: 'os', key: 'settings', shape: 'record' },
]

export const SINGLE_ID = 'main'

/**
 * Store actions that only touch this device (language, booking draft, local login state).
 * The browser keeps running them locally; the server refuses them.
 */
export const DEVICE_ONLY: Record<StoreName, string[]> = {
  ttc: ['setLang', 'dismissLeadPrompt', 'updateDraft', 'resetDraft', 'setTier', 'clearCart', 'setCartItem', 'setSessions', 'loginClient', 'loginAdmin', 'logout', 'toggleMood', 'clearMood', 'resetDemo'],
  studio: ['loginStudio', 'logoutStudio', 'viewAsStudio', 'resetStudioDemo'],
  os: ['resetOsDemo'],
}

export const collDef = (coll: Coll): CollDef => COLLECTIONS.find(c => c.coll === coll)!

/** One record that changed. `doc: null` = deleted. `prepend` tells the browser where a new array item goes. */
export interface Change {
  coll: Coll
  id: string
  doc: unknown | null
  prepend?: boolean
  /** Server only: the record before deletion, used to decide who is told. Never sent. */
  prev?: unknown
}

/** What GET /api/sync returns: each collection in display order. */
export type Snapshot = Partial<Record<Coll, { id: string; doc: unknown }[]>>

/** What the server knows about the caller (GET /api/me). */
export interface Me {
  admin?: { name: string }
  /** Last 10 digits of a phone verified by OTP: sees every TTC order on it. */
  customer?: string
  /** Orders this device created (enquiry) without verifying the phone. */
  orderIds: string[]
  studioId?: string
  /** Phone verified for photographer sign-up but no studio yet. */
  verified?: string
  gates: { projects: string[]; events: string[] }
}
