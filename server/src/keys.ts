import type { Coll } from '../../src/api/collections'
import { phone10 } from './util'

export interface Keys {
  owner?: string | null
  parent?: string | null
  code?: string | null
}

type D = Record<string, any>
const s = (v: unknown) => (typeof v === 'string' && v ? v : null)

/**
 * Lookup columns per collection. owner = who it belongs to, parent = what it hangs off,
 * code = a share code or phone used for lookups. Scoping in policy/ reads these.
 */
export const KEYS: Record<Coll, (doc: D, id: string) => Keys> = {
  orders: d => ({ owner: phone10(d.client?.contact) || null, code: s(d.status) }),
  leads: d => ({ owner: phone10(d.contact) || null }),
  workers: () => ({}),
  outbox: d => ({ parent: s(d.orderId), owner: phone10(d.to) || null }),
  cms: () => ({}),
  studios: d => ({ owner: s(d.id), code: phone10(d.phone) || null }),
  // parent = the customer's phone, so a TTC customer finds galleries made for their number.
  events: d => ({ owner: s(d.studioId), parent: phone10(d.clientPhone) || null, code: s(d.code)?.toLowerCase() ?? null }),
  proofs: d => ({ parent: s(d.eventId) }),
  picks: (_d, id) => ({ parent: id }),
  activity: d => ({ parent: s(d.eventId) }),
  drives: d => ({ owner: s(d.studioId), code: s(d.markerId) }),
  scans: d => ({ parent: s(d.driveId) }),
  terms: d => ({ owner: s(d.studioId) }),
  messages: d => ({ owner: s(d.studioId) }),
  plans: () => ({}),
  projects: d => ({ owner: s(d.studioId), parent: s(d.galleryEventId), code: s(d.code)?.toLowerCase() ?? null }),
  settings: (_d, id) => ({ owner: id }),
}
