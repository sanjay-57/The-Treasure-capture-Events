import { describe, expect, it } from 'vitest'
import { filterCounts, filterProofs, groupByChapter, pickers, quotaState, quotaText, waLink } from './logic'
import type { Chapter, Proof } from '../types'

const proof = (id: string, chapter = 'a', sort = 0): Proof => ({
  id, eventId: 'e', chapter, filename: id.toUpperCase(), ext: 'NEF', source: 'raw', w: 3, h: 2, bytes: 1, originalBytes: 1, sort,
})
const T = { left: 'more', reached: 'Reached', over: 'over' }

describe('quota status', () => {
  it('counts down to the quota', () => {
    expect(quotaText(0, 40, T)).toBe('40 more')
    expect(quotaText(39, 40, T)).toBe('1 more')
    expect(quotaState(10, 40)).toEqual({ kind: 'left', n: 30, ratio: 0.25 })
  })
  it('says reached at exactly the quota', () => {
    expect(quotaText(40, 40, T)).toBe('Reached')
    expect(quotaState(40, 40).ratio).toBe(1)
  })
  it('flags over quota and caps the ring', () => {
    expect(quotaText(43, 40, T)).toBe('3 over')
    expect(quotaState(43, 40)).toEqual({ kind: 'over', n: 3, ratio: 1 })
  })
  it('survives a zero quota', () => {
    expect(quotaState(0, 0).kind).toBe('reached')
    expect(quotaState(2, 0)).toEqual({ kind: 'over', n: 2, ratio: 1 })
  })
})

describe('filters', () => {
  const ps = [proof('p1'), proof('p2'), proof('p3'), proof('p4')]
  const picked = new Set(['p2', 'p4', 'gone'])
  it('counts all / selected / not selected', () => {
    expect(filterCounts(ps, picked)).toEqual({ all: 4, selected: 2, unselected: 2 })
    expect(filterCounts([], picked)).toEqual({ all: 0, selected: 0, unselected: 0 })
  })
  it('filters to match the counts', () => {
    expect(filterProofs(ps, picked, 'all')).toHaveLength(4)
    expect(filterProofs(ps, picked, 'selected').map(p => p.id)).toEqual(['p2', 'p4'])
    expect(filterProofs(ps, picked, 'unselected').map(p => p.id)).toEqual(['p1', 'p3'])
  })
})

describe('chapters and pickers', () => {
  const chapters: Chapter[] = [{ key: 'b', name: 'B', sort: 2 }, { key: 'a', name: 'A', sort: 1 }, { key: 'empty', name: 'E', sort: 3 }]
  it('sorts chapters, drops empty ones, keeps strays', () => {
    const g = groupByChapter(chapters, [proof('x', 'b', 2), proof('y', 'a', 5), proof('z', 'a', 1), proof('w', 'zzz')])
    expect(g.map(x => x.chapter.key)).toEqual(['a', 'b', '__other'])
    expect(g[0].proofs.map(p => p.id)).toEqual(['z', 'y'])
  })
  it('lists who picked, most first', () => {
    expect(pickers([{ proofId: '1', by: 'Divya', at: '' }, { proofId: '2', by: 'Rahul', at: '' }, { proofId: '3', by: 'Rahul', at: '' }, { proofId: '4', at: '' }])).toEqual([
      { name: 'Rahul', count: 2 },
      { name: 'Divya', count: 1 },
    ])
  })
  it('builds wa.me links with a 91 prefix for 10-digit numbers', () => {
    expect(waLink('+91 90000 11111', 'hi there')).toBe('https://wa.me/919000011111?text=hi%20there')
    expect(waLink('94430 22222', 'x')).toBe('https://wa.me/919443022222?text=x')
  })
})
