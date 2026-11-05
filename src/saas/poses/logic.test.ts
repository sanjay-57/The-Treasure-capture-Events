import { describe, expect, it } from 'vitest'
import { FREE_THEMES, PREMIUM_THEMES } from '../../lib/invite'
import { POSES } from '../../lib/poses'
import { INVITE_THEMES_FOR, moveId, poseProgress, poseSetFor, shotList } from './logic'

describe('pose plans', () => {
  it('religion adds its ritual poses to the common set', () => {
    const common = poseSetFor('wedding')
    const hindu = poseSetFor('wedding', 'hindu')
    const muslim = poseSetFor('wedding', 'muslim')
    expect(common.length).toBeGreaterThan(0)
    expect(hindu).toEqual(expect.arrayContaining(common))
    expect(hindu).toContain('wed-thaali')
    expect(muslim).not.toContain('wed-thaali')
    expect(common.every(id => !POSES.find(p => p.id === id)!.faith)).toBe(true)
  })

  it('counts answers and ignores ids no longer in the library', () => {
    const plan = { ids: ['wed-first-look', 'wed-walk', 'wed-thaali', 'gone-pose'], picks: { 'wed-first-look': 'yes', 'wed-walk': 'no', 'gone-pose': 'yes' } as const }
    expect(poseProgress(plan)).toEqual({ total: 3, yes: 1, no: 1, answered: 2, left: 1, complete: false })
    expect(poseProgress({ ...plan, picks: { ...plan.picks, 'wed-thaali': 'yes' } }).complete).toBe(true)
    expect(poseProgress({ ids: [], picks: {} }).complete).toBe(false)
  })

  it('shot list keeps the studio order and only yes answers', () => {
    const plan = { ids: ['wed-walk', 'wed-first-look', 'wed-thaali'], picks: { 'wed-first-look': 'yes', 'wed-walk': 'yes', 'wed-thaali': 'no' } as const }
    expect(shotList(plan).map(p => p.id)).toEqual(['wed-walk', 'wed-first-look'])
  })

  it('moves ids within bounds', () => {
    expect(moveId(['a', 'b', 'c'], 'b', -1)).toEqual(['b', 'a', 'c'])
    expect(moveId(['a', 'b', 'c'], 'c', 1)).toEqual(['a', 'b', 'c'])
  })

  it('invite suggestions are real theme ids', () => {
    const all = new Set<string>([...FREE_THEMES, ...PREMIUM_THEMES])
    for (const list of Object.values(INVITE_THEMES_FOR)) for (const t of list) expect(all.has(t)).toBe(true)
  })
})
