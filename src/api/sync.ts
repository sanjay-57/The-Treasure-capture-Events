import type { StoreApi } from 'zustand'
import { useStore, type Session } from '../lib/store'
import { useStudioStore } from '../saas/store'
import { useOsStore, withV3Defaults } from '../saas/os/store'
import { api } from './client'
import { COLLECTIONS, SINGLE_ID, type Change, type Me, type Snapshot, type StoreName } from './collections'

export const STORES: Record<StoreName, StoreApi<any>> = {
  ttc: useStore as unknown as StoreApi<any>,
  studio: useStudioStore as unknown as StoreApi<any>,
  os: useOsStore as unknown as StoreApi<any>,
}

let me: Me = { orderIds: [], gates: { projects: [], events: [] } }
export const currentMe = () => me

/** Projects saved by an older build may lack theme/stage/features; persist's migrate never runs in LAN mode. */
const fix = (coll: string, doc: any) => (coll === 'projects' && doc ? withV3Defaults(doc) : doc)

/** Replaces every server collection in the stores with the snapshot. */
export function hydrate(snap: Snapshot) {
  for (const store of Object.keys(STORES) as StoreName[]) {
    const patch: Record<string, unknown> = {}
    for (const def of COLLECTIONS.filter(c => c.store === store)) {
      const list = snap[def.coll] ?? []
      if (def.shape === 'array') patch[def.key] = list.map(d => fix(def.coll, d.doc))
      else if (def.shape === 'record') patch[def.key] = Object.fromEntries(list.map(d => [d.id, d.doc]))
      else if (list[0]) patch[def.key] = list[0].doc
    }
    STORES[store].setState(patch)
  }
}

/** Merges changes from an action reply or the live stream. */
export function applyChanges(changes: Change[]) {
  if (!changes.length) return
  const patches: Partial<Record<StoreName, Record<string, any>>> = {}
  for (const raw of changes) {
    const c = { ...raw, doc: fix(raw.coll, raw.doc) }
    const def = COLLECTIONS.find(d => d.coll === c.coll)
    if (!def) continue
    const patch = (patches[def.store] ??= {})
    const cur = patch[def.key] ?? STORES[def.store].getState()[def.key]
    if (def.shape === 'single') {
      if (c.doc && c.id === SINGLE_ID) patch[def.key] = c.doc
    } else if (def.shape === 'record') {
      const next = { ...(cur ?? {}) }
      if (c.doc === null) delete next[c.id]
      else next[c.id] = c.doc
      patch[def.key] = next
    } else {
      const idKey = def.idKey ?? 'id'
      const list: any[] = cur ?? []
      const at = list.findIndex(x => String(x?.[idKey]) === c.id)
      if (c.doc === null) patch[def.key] = at === -1 ? list : list.filter((_, i) => i !== at)
      else if (at !== -1) patch[def.key] = list.map((x, i) => (i === at ? c.doc : x))
      else patch[def.key] = c.prepend ? [c.doc, ...list] : [...list, c.doc]
    }
  }
  for (const [store, patch] of Object.entries(patches)) STORES[store as StoreName].setState(patch)
}

/** True when the stores already hold this record (from the snapshot or an earlier change). */
export function hasDoc(coll: string, id: string): boolean {
  const def = COLLECTIONS.find(d => d.coll === coll)
  if (!def) return false
  const cur = STORES[def.store].getState()[def.key]
  if (def.shape === 'single') return !!cur
  if (def.shape === 'record') return !!cur && id in cur
  const idKey = def.idKey ?? 'id'
  return Array.isArray(cur) && cur.some(x => String(x?.[idKey]) === id)
}

const last10 = (s: string) => s.replace(/\D/g, '').slice(-10)

/**
 * Which role this tab shows when the device holds both: staff sign in as admin to read
 * out a code, then the couple signs in on the same laptop. Per tab, so a reload keeps it.
 */
const ROLE_KEY = 'ttc-role'
let role: string | null = null
export function preferRole(next: 'admin' | 'client' | null) {
  role = next
  try {
    if (next) sessionStorage.setItem(ROLE_KEY, next)
    else sessionStorage.removeItem(ROLE_KEY)
  } catch {}
}
function preferredRole(): string | null {
  try {
    return role ?? sessionStorage.getItem(ROLE_KEY)
  } catch {
    return role
  }
}

/** Turns the server's view of this device into the stores' session fields. */
export function applyMe(next: Me) {
  me = next
  const ttc = useStore.getState()
  const cur = ttc.session
  const mine = next.customer || next.orderIds.length ? ttc.orders.filter(o => next.orderIds.includes(o.id) || (next.customer && last10(o.client.contact) === next.customer)) : []
  const o = mine[0]
  const client: Session = cur?.role === 'client' && mine.some(x => x.id === cur.orderId) ? cur : o ? { role: 'client', orderId: o.id, name: o.client.name, contact: o.client.contact } : null
  const admin: Session = next.admin ? { role: 'admin', name: next.admin.name } : null
  const want = preferredRole() ?? cur?.role
  const session = (want === 'client' && client) || (want === 'admin' && admin) || admin || client
  if (JSON.stringify(session) !== JSON.stringify(cur)) useStore.setState({ session })

  const st = useStudioStore.getState()
  if (next.studioId) {
    const studio = st.studios.find(s => s.id === next.studioId)
    if (st.session?.studioId !== next.studioId) useStudioStore.setState({ session: { studioId: next.studioId, phone: studio?.phone ?? '' } })
  } else if (st.session && !(st.session.viewAsAdmin && next.admin)) useStudioStore.setState({ session: null })
}

export let lastSeq = 0
export const setSeq = (n: number) => {
  if (n > lastSeq) lastSeq = n
}

/** Loads everything this device may see. */
export async function fullSync() {
  const r = await api<{ me: Me; seq: number; snapshot: Snapshot }>('/api/sync')
  hydrate(r.snapshot)
  applyMe(r.me)
  setSeq(r.seq)
}
