import { COLLECTIONS, type Change, type Coll, type Snapshot } from '../../../src/api/collections'
import type { Grants } from '../auth/grants'
import type { Doc, Docs } from '../docs'
import { phone10 } from '../util'

type D = Record<string, any>

/** Studio fields a customer page needs (brand, picker, link status). The rest stays with the studio. */
const BRAND = ['id', 'name', 'slug', 'logoUrl', 'accent', 'watermark', 'whatsapp', 'lang', 'defaultQuota', 'defaultWindowDays', 'sub', 'pickerVersion', 'featureDefaults', 'portalBanner', 'cancelledAt', 'onboarded'] as const
/** Crew fields the client dashboard's team card shows. Phone and availability stay with the studio. */
const WORKER_PUBLIC = ['id', 'name', 'role', 'district', 'rating', 'jobs'] as const

/** Same length as the PIN so the PIN boxes render; the real check happens on the server. */
export const maskPin = (d: D) => (typeof d.pin === 'string' && d.pin ? { ...d, pin: '•'.repeat(d.pin.length) } : d)
export const brand = (d: D) => pick(d, BRAND)

const pick = (d: D, keys: readonly string[]) => Object.fromEntries(keys.filter(k => k in d).map(k => [k, d[k]]))
const omit = (d: D, keys: string[]) => Object.fromEntries(Object.entries(d).filter(([k]) => !keys.includes(k)))

/**
 * Answers "may this session see / touch that record" for one request.
 * Lookups hit SQLite and are memoised for the request.
 */
export class Scope {
  private memo = new Map<string, any>()
  constructor(public g: Grants, private docs: Docs) {}

  get admin() {
    return !!this.g.admin
  }
  private doc(coll: Coll, id: string | undefined): D | undefined {
    if (!id) return undefined
    const k = coll + ':' + id
    if (!this.memo.has(k)) this.memo.set(k, this.docs.get(coll, id))
    return this.memo.get(k)
  }
  private cached<T>(k: string, f: () => T): T {
    if (!this.memo.has(k)) this.memo.set(k, f())
    return this.memo.get(k)
  }

  ownsStudio(id: unknown) {
    return !!this.g.studioId && this.g.studioId === id
  }
  ownsOrder(id: unknown, doc?: D) {
    if (typeof id !== 'string') return false
    if (this.g.orderIds.includes(id)) return true
    const o = doc ?? this.doc('orders', id)
    return !!o && !!this.g.customer && phone10(o.client?.contact) === this.g.customer
  }
  ownsEvent(id: unknown, doc?: D) {
    const e = doc ?? this.doc('events', id as string)
    return !!e && this.ownsStudio(e.studioId)
  }
  /** Customer side of a gallery: opened with its PIN, linked to a project opened with its PIN, or made for the customer's verified phone. */
  gateEvent(id: unknown, doc?: D) {
    if (typeof id !== 'string') return false
    if (this.g.gates.events.includes(id)) return true
    if (this.gatedProjects().some(p => p.galleryEventId === id)) return true
    const e = doc ?? this.doc('events', id)
    return !!e && !!this.g.customer && phone10(e.clientPhone) === this.g.customer
  }
  seesEvent(id: unknown, doc?: D) {
    return this.admin || this.ownsEvent(id, doc) || this.gateEvent(id, doc)
  }
  ownsProject(id: unknown, doc?: D) {
    const p = doc ?? this.doc('projects', id as string)
    return !!p && this.ownsStudio(p.studioId)
  }
  gateProject(id: unknown) {
    return typeof id === 'string' && this.g.gates.projects.includes(id)
  }
  ownsDrive(id: unknown, doc?: D) {
    const d = doc ?? this.doc('drives', id as string)
    return !!d && this.ownsStudio(d.studioId)
  }
  event(id: unknown) {
    return this.doc('events', id as string)
  }
  project(id: unknown) {
    return this.doc('projects', id as string)
  }
  proof(id: unknown) {
    return this.doc('proofs', id as string)
  }

  private gatedProjects(): D[] {
    return this.cached('gp', () => this.g.gates.projects.map(id => this.doc('projects', id)).filter(Boolean) as D[])
  }
  private customerEvents(): D[] {
    return this.cached('ce', () => (this.g.customer ? this.docs.by('events', 'parent', this.g.customer).map(d => d.doc) : []))
  }
  /** Studios whose brand this session sees through a customer link. */
  private brandStudios(): Set<string> {
    return this.cached('bs', () => {
      const ids = new Set<string>()
      for (const p of this.gatedProjects()) ids.add(p.studioId)
      for (const id of this.g.gates.events) {
        const e = this.doc('events', id)
        if (e) ids.add(e.studioId)
      }
      for (const e of this.customerEvents()) ids.add(e.studioId)
      return ids
    })
  }
  private customerWorkers(): Set<string> {
    return this.cached('cw', () => {
      const ids = new Set<string>()
      for (const o of this.customerOrders()) for (const w of o.doc.workerIds ?? []) ids.add(w)
      return ids
    })
  }
  customerOrders(): Doc[] {
    return this.cached('co', () => {
      const out = new Map<string, any>()
      if (this.g.customer) for (const d of this.docs.by('orders', 'owner', this.g.customer)) out.set(d.id, d.doc)
      for (const id of this.g.orderIds) {
        const o = this.doc('orders', id)
        if (o) out.set(id, o)
      }
      return [...out].map(([id, doc]) => ({ id, doc }))
    })
  }

  /** The record as this session may see it, or undefined when hidden. */
  view(coll: Coll, id: string, doc: D): D | undefined {
    if (this.admin) return doc
    switch (coll) {
      case 'cms':
      case 'plans':
        return doc
      case 'orders':
        if (!this.ownsOrder(id, doc)) return undefined
        // Which ritual sets were included is the studio's call; the customer only rates poses.
        return doc.poses ? { ...doc, poses: omit(doc.poses, ['faiths']) } : doc
      case 'workers':
        return this.customerWorkers().has(id) ? pick(doc, WORKER_PUBLIC) : undefined
      case 'leads':
      case 'outbox':
        return undefined
      case 'studios':
        if (this.ownsStudio(id)) return doc
        return this.brandStudios().has(id) ? pick(doc, BRAND) : undefined
      case 'events':
        if (this.ownsEvent(id, doc)) return doc
        return this.gateEvent(id, doc) ? maskPin(doc) : undefined
      case 'proofs':
        return this.seesEvent(doc.eventId) ? doc : undefined
      case 'picks':
        return this.seesEvent(id) ? doc : undefined
      case 'activity':
        return this.ownsEvent(doc.eventId) ? doc : undefined
      case 'drives':
        return this.ownsStudio(doc.studioId) ? doc : undefined
      case 'scans':
        return this.ownsDrive(doc.driveId) ? doc : undefined
      case 'terms':
      case 'messages':
        return this.ownsStudio(doc.studioId) ? doc : undefined
      case 'projects':
        if (this.ownsStudio(doc.studioId)) return doc
        return this.gateProject(id) ? maskPin(doc) : undefined
      case 'settings':
        return this.ownsStudio(id) || this.gatedProjects().some(p => p.studioId === id) ? doc : undefined
    }
  }

  /** Changes this session should hear about, shaped for it. */
  filter(changes: Change[]): Change[] {
    const out: Change[] = []
    for (const c of changes) {
      if (c.doc === null) {
        if (c.prev && this.view(c.coll, c.id, c.prev as D)) out.push({ coll: c.coll, id: c.id, doc: null })
        continue
      }
      const v = this.view(c.coll, c.id, c.doc as D)
      if (v) out.push({ coll: c.coll, id: c.id, doc: v, ...(c.prepend ? { prepend: true } : {}) })
    }
    return out
  }

  /** Everything this session may see, for first load (GET /api/sync). */
  snapshot(): Snapshot {
    const snap: Snapshot = {}
    const put = (coll: Coll, docs: Doc[]) => {
      const list = (snap[coll] ??= [])
      const have = new Set(list.map(d => d.id))
      for (const d of docs) {
        if (have.has(d.id)) continue
        const v = this.view(coll, d.id, d.doc)
        if (v) {
          list.push({ id: d.id, doc: v })
          have.add(d.id)
        }
      }
    }
    if (this.admin) {
      for (const c of COLLECTIONS) put(c.coll, this.docs.all(c.coll))
      return snap
    }
    put('cms', this.docs.all('cms'))
    put('plans', this.docs.all('plans'))

    const events = new Map<string, D>()
    if (this.g.customer || this.g.orderIds.length) {
      const orders = this.customerOrders()
      put('orders', orders)
      put('workers', [...this.customerWorkers()].map(id => ({ id, doc: this.doc('workers', id) })).filter(d => d.doc))
      for (const e of this.customerEvents()) events.set(e.id, e)
    }
    const sid = this.g.studioId
    if (sid) {
      put('studios', this.docs.by('studios', 'owner', sid))
      put('settings', this.docs.by('settings', 'owner', sid))
      for (const c of ['terms', 'messages', 'drives', 'projects'] as const) put(c, this.docs.by(c, 'owner', sid))
      for (const d of this.docs.by('drives', 'owner', sid)) put('scans', this.docs.by('scans', 'parent', d.id))
      for (const d of this.docs.by('events', 'owner', sid)) events.set(d.id, d.doc)
    }
    for (const p of this.gatedProjects()) {
      put('projects', [{ id: p.id, doc: p }])
      put('settings', this.docs.by('settings', 'owner', p.studioId))
      const e = p.galleryEventId && this.doc('events', p.galleryEventId)
      if (e) events.set(e.id, e)
    }
    for (const id of this.g.gates.events) {
      const e = this.doc('events', id)
      if (e) events.set(id, e)
    }
    put('studios', [...this.brandStudios()].map(id => ({ id, doc: this.doc('studios', id) })).filter(d => d.doc))
    put('events', [...events.values()].map(e => ({ id: e.id, doc: e })))
    for (const id of events.keys()) {
      put('proofs', this.docs.by('proofs', 'parent', id))
      put('picks', this.docs.by('picks', 'parent', id))
      if (this.ownsEvent(id)) put('activity', this.docs.by('activity', 'parent', id))
    }
    return snap
  }
}
