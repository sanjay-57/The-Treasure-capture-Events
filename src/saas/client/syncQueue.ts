import type { Pick as ProofPick } from '../types'

/**
 * Client-side sync of the selection.
 *
 * Today the zustand store (src/saas/store.ts) persists picks to localStorage at
 * once, so nothing is ever lost; this queue only models the network half so the
 * swap is one function. When the server exists (Phase S3) pass a `send` that
 * does `PUT /s/:code/selection` with the batched changes, and merge the server's
 * reply with `mergePicks(local, remote)`.
 *
 * Conflict rule: last write wins per proofId, judged by `at` (ISO time).
 * Removals travel as tombstones so a later un-heart beats an earlier heart from
 * another phone.
 */

export interface PickChange {
  proofId: string
  /** put = selected (with by/note), del = unselected. */
  op: 'put' | 'del'
  pick?: ProofPick
  at: string
}

export type SyncState = 'idle' | 'saving' | 'saved' | 'error'

const t = (iso: string | undefined) => (iso ? Date.parse(iso) || 0 : 0)

/**
 * Merge two selections, last write wins per proofId. `tombstones` maps a proofId
 * to when it was unselected on either side; a tombstone newer than the pick removes it.
 */
export function mergePicks(local: ProofPick[], remote: ProofPick[], tombstones: Record<string, string> = {}): ProofPick[] {
  const out = new Map<string, ProofPick>()
  for (const p of remote) out.set(p.proofId, p)
  for (const p of local) {
    const r = out.get(p.proofId)
    // Ties go to local: it is what the person on this phone is looking at.
    if (!r || t(p.at) >= t(r.at)) out.set(p.proofId, p)
  }
  for (const [id, at] of Object.entries(tombstones)) {
    const p = out.get(id)
    if (p && t(at) > t(p.at)) out.delete(id)
  }
  return [...out.values()]
}

/** Coalesce a queue of changes: only the latest per proofId survives. */
export function coalesce(changes: PickChange[]): PickChange[] {
  const m = new Map<string, PickChange>()
  for (const c of changes) {
    const prev = m.get(c.proofId)
    if (!prev || t(c.at) >= t(prev.at)) m.set(c.proofId, c)
  }
  return [...m.values()]
}

/** Diff two pick lists into changes (what the client did since the last sync). */
export function diffPicks(before: ProofPick[], after: ProofPick[], at = new Date().toISOString()): PickChange[] {
  const b = new Map(before.map(p => [p.proofId, p]))
  const a = new Map(after.map(p => [p.proofId, p]))
  const out: PickChange[] = []
  for (const [id, p] of a) {
    const old = b.get(id)
    if (!old || old.note !== p.note || old.by !== p.by) out.push({ proofId: id, op: 'put', pick: p, at: old && old.at === p.at ? at : p.at })
  }
  for (const id of b.keys()) if (!a.has(id)) out.push({ proofId: id, op: 'del', at })
  return out
}

export interface SyncQueueOptions {
  /** Debounce before a batch is sent, ms. */
  delay?: number
  /** Sends one coalesced batch. Reject to retry with backoff. Default: local-only no-op. */
  send?: (changes: PickChange[]) => Promise<void>
  onState?: (s: SyncState) => void
  /** Max backoff between retries, ms. */
  maxBackoff?: number
}

export interface SyncQueue {
  push: (changes: PickChange[]) => void
  flush: () => Promise<void>
  pending: () => PickChange[]
  dispose: () => void
}

/** Local-only stand-in for PUT /s/:code/selection (the store already saved the picks). */
export const localSend = () => new Promise<void>(r => setTimeout(r, 350))

export function createSyncQueue({ delay = 800, send = localSend, onState = () => {}, maxBackoff = 30_000 }: SyncQueueOptions = {}): SyncQueue {
  let queue: PickChange[] = []
  let timer: ReturnType<typeof setTimeout> | undefined
  let inflight = false
  let backoff = 1000
  let disposed = false

  const schedule = (ms: number) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => void flush(), ms)
  }

  async function flush() {
    if (timer) clearTimeout(timer)
    timer = undefined
    if (inflight || disposed || !queue.length) return
    const batch = coalesce(queue)
    queue = []
    inflight = true
    onState('saving')
    try {
      await send(batch)
      backoff = 1000
      inflight = false
      if (disposed) return
      if (queue.length) schedule(delay)
      else onState('saved')
    } catch {
      inflight = false
      // Put the batch back in front; newer changes for the same proof still win in coalesce.
      queue = coalesce([...batch, ...queue])
      if (disposed) return
      onState('error')
      schedule(backoff)
      backoff = Math.min(maxBackoff, backoff * 2)
    }
  }

  return {
    push(changes) {
      if (disposed || !changes.length) return
      queue.push(...changes)
      onState('saving')
      if (!inflight) schedule(delay)
    },
    flush,
    pending: () => coalesce(queue),
    dispose() {
      disposed = true
      if (timer) clearTimeout(timer)
    },
  }
}
