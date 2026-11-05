import { afterEach, describe, expect, it, vi } from 'vitest'
import { coalesce, createSyncQueue, diffPicks, mergePicks, type PickChange } from './syncQueue'
import type { Pick as ProofPick } from '../types'

const p = (proofId: string, at: string, extra: Partial<ProofPick> = {}): ProofPick => ({ proofId, at, ...extra })
const ids = (xs: ProofPick[]) => xs.map(x => x.proofId).sort()

describe('mergePicks', () => {
  it('unions picks from both sides', () => {
    expect(ids(mergePicks([p('a', '2026-11-01T10:00:00Z')], [p('b', '2026-11-01T09:00:00Z')]))).toEqual(['a', 'b'])
  })
  it('last write wins per proof', () => {
    const m = mergePicks([p('a', '2026-11-01T10:00:00Z', { note: 'local' })], [p('a', '2026-11-01T11:00:00Z', { note: 'remote' })])
    expect(m).toHaveLength(1)
    expect(m[0].note).toBe('remote')
    const n = mergePicks([p('a', '2026-11-01T12:00:00Z', { note: 'local' })], [p('a', '2026-11-01T11:00:00Z', { note: 'remote' })])
    expect(n[0].note).toBe('local')
  })
  it('ties go to local', () => {
    expect(mergePicks([p('a', '2026-11-01T10:00:00Z', { by: 'L' })], [p('a', '2026-11-01T10:00:00Z', { by: 'R' })])[0].by).toBe('L')
  })
  it('a newer un-heart removes an older heart, an older one does not', () => {
    const remote = [p('a', '2026-11-01T10:00:00Z'), p('b', '2026-11-01T10:00:00Z')]
    const m = mergePicks([], remote, { a: '2026-11-01T11:00:00Z', b: '2026-11-01T09:00:00Z' })
    expect(ids(m)).toEqual(['b'])
  })
})

describe('coalesce and diff', () => {
  it('keeps the latest change per proof', () => {
    const cs: PickChange[] = [
      { proofId: 'a', op: 'put', at: '2026-11-01T10:00:00Z' },
      { proofId: 'a', op: 'del', at: '2026-11-01T10:00:01Z' },
      { proofId: 'b', op: 'put', at: '2026-11-01T10:00:00Z' },
    ]
    const c = coalesce(cs)
    expect(c).toHaveLength(2)
    expect(c.find(x => x.proofId === 'a')?.op).toBe('del')
  })
  it('diffs adds, removals and note edits', () => {
    const before = [p('a', '1'), p('b', '1')]
    const after = [p('a', '1', { note: 'crop' }), p('c', '2')]
    const d = diffPicks(before, after, '9')
    expect(d.map(x => `${x.proofId}:${x.op}`).sort()).toEqual(['a:put', 'b:del', 'c:put'])
  })
})

describe('createSyncQueue', () => {
  afterEach(() => vi.useRealTimers())
  it('debounces, batches and reports saving → saved', async () => {
    vi.useFakeTimers()
    const sent: PickChange[][] = []
    const states: string[] = []
    const q = createSyncQueue({ delay: 500, send: async c => void sent.push(c), onState: s => states.push(s) })
    q.push([{ proofId: 'a', op: 'put', at: '1' }])
    q.push([{ proofId: 'a', op: 'del', at: '2' }, { proofId: 'b', op: 'put', at: '2' }])
    expect(sent).toHaveLength(0)
    await vi.advanceTimersByTimeAsync(500)
    expect(sent).toHaveLength(1)
    expect(sent[0]).toHaveLength(2)
    expect(states.at(-1)).toBe('saved')
  })
  it('retries a failed batch', async () => {
    vi.useFakeTimers()
    let fail = true
    const sent: PickChange[][] = []
    const states: string[] = []
    const q = createSyncQueue({ delay: 100, send: async c => { if (fail) { fail = false; throw new Error('4G') } sent.push(c) }, onState: s => states.push(s) })
    q.push([{ proofId: 'a', op: 'put', at: '1' }])
    await vi.advanceTimersByTimeAsync(100)
    expect(states).toContain('error')
    expect(q.pending()).toHaveLength(1)
    await vi.advanceTimersByTimeAsync(1000)
    expect(sent).toHaveLength(1)
    expect(states.at(-1)).toBe('saved')
    q.dispose()
  })
})
