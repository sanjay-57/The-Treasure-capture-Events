import { describe, expect, it } from 'vitest'
import { exportGroups, hasCollisions, hasSpace, lightroomList, selectionCsv, stripExt } from './lightroom'
import type { Proof } from './types'

const proof = (filename: string, sort: number, extra: Partial<Proof> = {}): Proof => ({
  id: `${filename}-${sort}-${extra.serial ?? ''}`,
  eventId: 'e1',
  chapter: 'ceremony',
  filename,
  ext: 'NEF',
  source: 'raw',
  w: 2048,
  h: 1365,
  bytes: 900_000,
  originalBytes: 45_000_000,
  sort,
  ...extra,
})

describe('lightroom list', () => {
  it('joins with comma and space, no extensions', () => {
    expect(lightroomList(['DSC_4821.NEF', 'DSC_4830.jpg', 'B_DSC_0112'])).toBe('DSC_4821, DSC_4830, B_DSC_0112')
  })
  it('drops duplicates and blanks, keeps order', () => {
    expect(lightroomList(['A_2', 'A_1', 'A_2.CR3', ' ', 'A_3'])).toBe('A_2, A_1, A_3')
  })
  it('strips only real extensions', () => {
    expect(stripExt('IMG_0001.CR3')).toBe('IMG_0001')
    expect(stripExt('IMG_0001')).toBe('IMG_0001')
  })
  it('flags names with spaces', () => {
    expect(hasSpace('Wedding 001')).toBe(true)
    expect(hasSpace('Wedding_001')).toBe(false)
  })
})

describe('camera collisions', () => {
  it('one group when names are unique', () => {
    const g = exportGroups([proof('DSC_2', 2), proof('DSC_1', 1)])
    expect(g).toHaveLength(1)
    expect(g[0].line).toBe('DSC_1, DSC_2')
  })
  it('splits per body when two cameras share a filename', () => {
    const a = proof('IMG_0001', 1, { camera: 'Canon EOS R6', serial: '111' })
    const b = proof('IMG_0001', 2, { camera: 'Canon EOS R6', serial: '222' })
    const c = proof('IMG_0002', 3, { camera: 'Canon EOS R6', serial: '111' })
    expect(hasCollisions([a, b, c])).toBe(true)
    const g = exportGroups([a, b, c])
    expect(g).toHaveLength(2)
    expect(g[0].line).toBe('IMG_0001, IMG_0002')
    expect(g[1].line).toBe('IMG_0001')
    expect(g[1].label).toContain('222')
  })
})

describe('csv', () => {
  it('quotes notes with commas', () => {
    const p = proof('DSC_1', 1)
    const csv = selectionCsv([p], [{ proofId: p.id, note: 'crop tighter, warmer', by: 'Priya', at: '2026-11-05' }])
    expect(csv.split('\n')[1]).toBe('DSC_1,NEF,ceremony,,,,Priya,"crop tighter, warmer"')
  })
})
