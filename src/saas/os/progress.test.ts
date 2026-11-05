import { describe, expect, it } from 'vitest'
import { PROJECT_TABS, advanceStage, tabDone } from './progress'
import { useOsStore } from './store'

describe('project progress', () => {
  const p = useOsStore.getState().projects[0]
  it('seed project tabs', () => {
    expect(tabDone(p, 'overview')).toBe(true)
    expect(tabDone(p, 'gallery')).toBe(false)
    expect(tabDone(p, 'poses')).toBe(false)
  })
  it('gallery tab is done once the selection is submitted or closed', () => {
    expect(tabDone(p, 'gallery', { galleryStatus: 'open' })).toBe(false)
    expect(tabDone(p, 'gallery', { galleryStatus: 'submitted' })).toBe(true)
    expect(tabDone(p, 'gallery', { galleryStatus: 'closed' })).toBe(true)
  })
  it('poses tab is done once the client submits', () => {
    expect(tabDone({ ...p, poses: { faiths: [], eventKey: 'wedding', ids: ['a'], picks: { a: 'yes' }, sentAt: 'x', submittedAt: 'y' } }, 'poses')).toBe(true)
  })
  it('stages only move forward on their own', () => {
    expect(advanceStage('selection_sent', 'selection_received')).toBe('selection_received')
    expect(advanceStage('editing', 'selection_received')).toBe('editing')
    expect(advanceStage(undefined, 'shoot_done')).toBe('shoot_done')
  })
  it('only the album and poses tabs besides overview', () => {
    expect(PROJECT_TABS).toEqual(['overview', 'gallery', 'poses'])
  })
})
