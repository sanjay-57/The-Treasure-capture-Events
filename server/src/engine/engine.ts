import { COLLECTIONS, SINGLE_ID, type Change, type StoreName } from '../../../src/api/collections'
import type { Docs } from '../docs'
import { DEVICE_STATE, STORES } from './stores'
import { Slice, diff } from './slice'

const EMPTY_SINGLE: Record<string, unknown> = {}

/**
 * Runs store actions against database records. Synchronous from load to commit, so
 * two requests can never interleave (Node runs one at a time, better-sqlite3 is sync).
 */
export class Engine {
  constructor(private docs: Docs, private onCommit: (changes: Change[]) => void) {}

  slice(): Slice {
    return new Slice(this.docs)
  }

  /** Loads `slice` into the stores, runs `fn`, saves what changed. */
  run<R>(slice: Slice, fn: () => R): { result: R; changes: Change[] } {
    const out = this.dryRun(slice, fn)
    this.commit(out.changes)
    return out
  }

  /** Same as run, without saving. */
  dryRun<R>(slice: Slice, fn: () => R): { result: R; changes: Change[] } {
    for (const store of Object.keys(STORES) as StoreName[]) {
      const patch: Record<string, unknown> = { ...DEVICE_STATE[store] }
      for (const def of COLLECTIONS.filter(c => c.store === store)) {
        const m = slice.m.get(def.coll) ?? new Map()
        patch[def.key] = def.shape === 'array' ? [...m.values()] : def.shape === 'record' ? Object.fromEntries(m) : m.get(SINGLE_ID) ?? EMPTY_SINGLE
      }
      STORES[store].setState(patch)
    }
    const result = fn()
    const changes = diff(slice, (store, key) => STORES[store as StoreName].getState()[key])
    return { result, changes }
  }

  /** Saves changes made outside a store action (import, seed, upload). */
  commit(changes: Change[]) {
    if (!changes.length) return
    this.docs.tx(() => {
      for (const c of changes) c.doc === null ? this.docs.del(c.coll, c.id) : this.docs.put(c.coll, c.id, c.doc, c.prepend)
    })
    this.onCommit(changes)
  }

  /** The store's action by name, or undefined if it is not a function. */
  action(store: StoreName, name: string): ((...a: unknown[]) => unknown) | undefined {
    const f = STORES[store].getState()[name]
    return typeof f === 'function' ? f : undefined
  }
}
