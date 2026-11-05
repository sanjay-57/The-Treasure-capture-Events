import { COLLECTIONS, SINGLE_ID, type Change, type Coll } from '../../../src/api/collections'
import type { Doc, Docs } from '../docs'

/** Logs that only ever grow; loaded empty so a trim (outbox keeps 200) never deletes rows. */
const APPEND_ONLY: Coll[] = ['outbox', 'activity', 'messages']
/** Lists the stores keep newest first; used when no older item was loaded to compare against. */
const NEWEST_FIRST = new Set<Coll>(['orders', 'leads', 'outbox', 'events', 'activity', 'messages'])

/** The records one action may read and change. Everything not loaded is untouched. */
export class Slice {
  readonly m = new Map<Coll, Map<string, any>>()

  constructor(private docs: Docs) {
    this.add('cms', docs.all('cms'))
    this.add('plans', docs.all('plans'))
  }

  add(coll: Coll, docs: Doc | Doc[] | undefined): this {
    if (!docs) return this
    let map = this.m.get(coll)
    if (!map) this.m.set(coll, (map = new Map()))
    for (const d of Array.isArray(docs) ? docs : [docs]) if (!map.has(d.id)) map.set(d.id, d.doc)
    return this
  }
  one(coll: Coll, id: string | undefined): any {
    if (!id) return undefined
    const have = this.m.get(coll)?.get(id)
    if (have) return have
    const doc = this.docs.get(coll, id)
    if (doc) this.add(coll, { id, doc })
    return doc
  }
  get(coll: Coll, id: string): any {
    return this.m.get(coll)?.get(id)
  }

  // Closures: what each kind of subject needs loaded.
  workers() {
    return this.add('workers', this.docs.all('workers'))
  }
  order(id: string) {
    this.one('orders', id)
    return this.workers()
  }
  allOrders() {
    this.add('orders', this.docs.all('orders'))
    return this.workers()
  }
  allStudios() {
    return this.add('studios', this.docs.all('studios'))
  }
  studioBase(id: string | undefined) {
    if (!id) return this
    this.one('studios', id)
    this.one('settings', id)
    return this
  }
  studio(id: string) {
    this.studioBase(id)
    for (const c of ['events', 'terms', 'drives', 'projects'] as const) this.add(c, this.docs.by(c, 'owner', id))
    return this
  }
  event(id: string) {
    const ev = this.one('events', id)
    if (!ev) return this
    this.studioBase(ev.studioId)
    this.add('proofs', this.docs.by('proofs', 'parent', id))
    this.one('picks', id)
    this.add('activity', this.docs.by('activity', 'parent', id))
    this.add('projects', this.docs.by('projects', 'parent', id))
    return this
  }
  project(id: string, withGallery = false) {
    const p = this.one('projects', id)
    if (!p) return this
    this.studioBase(p.studioId)
    if (p.galleryEventId) {
      if (withGallery) this.event(p.galleryEventId)
      else {
        this.one('events', p.galleryEventId)
        this.one('picks', p.galleryEventId)
        this.add('projects', this.docs.by('projects', 'parent', p.galleryEventId))
      }
    }
    return this
  }
  proof(id: string) {
    const p = this.one('proofs', id)
    if (p) this.event(p.eventId)
    return this
  }
  drive(id: string) {
    const d = this.one('drives', id)
    if (!d) return this
    this.studioBase(d.studioId)
    return this.add('scans', this.docs.by('scans', 'parent', id))
  }
  /** Everything a store holds except the append-only logs (admin fallback for unlisted actions). */
  everything(store: 'ttc' | 'studio' | 'os') {
    for (const c of COLLECTIONS) if (c.store === store && !APPEND_ONLY.includes(c.coll)) this.add(c.coll, this.docs.all(c.coll))
    if (store === 'os') for (const c of ['studios', 'events'] as const) this.add(c, this.docs.all(c))
    return this
  }
}

/** Compares what the action left in the store with what was loaded. */
export function diff(slice: Slice, read: (store: string, key: string) => unknown): Change[] {
  const out: Change[] = []
  for (const def of COLLECTIONS) {
    const before = slice.m.get(def.coll) ?? new Map<string, any>()
    const after = read(def.store, def.key)
    if (def.shape === 'single') {
      if (after !== undefined && after !== before.get(SINGLE_ID)) out.push({ coll: def.coll, id: SINGLE_ID, doc: after })
      continue
    }
    const entries: [string, any][] =
      def.shape === 'array'
        ? ((after as any[]) ?? []).map(x => [String(x?.[def.idKey ?? 'id']), x])
        : Object.entries((after as Record<string, any>) ?? {})
    const firstOld = entries.findIndex(([id]) => before.has(id))
    const seen = new Set<string>()
    const prepended: Change[] = []
    entries.forEach(([id, doc], i) => {
      seen.add(id)
      const prev = before.get(id)
      if (prev === doc) return
      const prepend = prev === undefined && (firstOld === -1 ? NEWEST_FIRST.has(def.coll) : i < firstOld)
      if (prepend) prepended.push({ coll: def.coll, id, doc, prepend })
      else out.push({ coll: def.coll, id, doc })
    })
    // Applied one by one, each prepend lands in front, so the last one must go first.
    out.push(...prepended.reverse())
    for (const [id, prev] of before) if (!seen.has(id)) out.push({ coll: def.coll, id, doc: null, prev })
  }
  return out
}
