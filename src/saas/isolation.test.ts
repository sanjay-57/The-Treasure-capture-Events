import { beforeEach, describe, expect, it } from 'vitest'
import { resolveGalleryCode, resolvePosesCode } from './links'
import { useOsStore } from './os/store'
import { drivesOf, eventsOf, galleryOf, picksOf, projectsOf, proofsOf, termsOf } from './scope'
import { useStudioStore } from './store'
import type { Proof } from './types'

/** Plan Phase 8: one photographer never sees another's rows. */
describe('tenant isolation', () => {
  beforeEach(() => {
    useStudioStore.getState().resetStudioDemo()
    useOsStore.getState().resetOsDemo()
    // A second studio with real data of its own: a project (and its gallery), a proof, a pick, a drive.
    const kural = useOsStore.getState().createProject('st_kural', { name: 'Selvi & Ravi Wedding', type: 'Wedding', clientNames: 'Selvi & Ravi', greetName: 'Selvi', phone: '+91 98765 44444' })
    const ev = kural.galleryEventId!
    const st = useStudioStore.getState()
    st.addProofs(ev, [{ id: 'pf_kural', eventId: ev, name: 'k.jpg', w: 10, h: 10, bytes: 10, sort: 0, chapter: 'all' } as unknown as Proof])
    st.togglePick(ev, 'pf_kural')
    st.addDrive({ studioId: 'st_kural', label: 'Kural drive', markerId: 'k', capacityBytes: 1, usedBytes: 0, kept: '', notes: '', fileCount: 0, photoCount: 0, videoCount: 0, rawCount: 0, status: 'ok' })
  })

  const both = ['st_lens', 'st_kural'] as const

  it('every /studio/* list holds only the session studio’s rows', () => {
    const os = useOsStore.getState()
    const st = useStudioStore.getState()
    for (const sid of both) {
      const projects = projectsOf(os.projects, sid)
      const events = eventsOf(st.events, sid)
      const eventIds = new Set(events.map(e => e.id))
      expect(projects.length).toBeGreaterThan(0)
      expect(events.length).toBeGreaterThan(0)
      expect(projects.every(p => p.studioId === sid)).toBe(true)
      expect(events.every(e => e.studioId === sid)).toBe(true)
      expect(proofsOf(st.proofs, st.events, sid).every(p => eventIds.has(p.eventId))).toBe(true)
      expect(Object.keys(picksOf(st.picks, st.events, sid)).every(id => eventIds.has(id))).toBe(true)
      expect(drivesOf(st.drives, sid).every(d => d.studioId === sid)).toBe(true)
      expect(termsOf(st.terms, sid).every(t => t.studioId === sid)).toBe(true)
      for (const p of projects) {
        const g = galleryOf(p, st.events)
        if (g) expect(g.studioId).toBe(sid)
      }
    }
    // The two studios share nothing.
    const lens = new Set(projectsOf(os.projects, 'st_lens').map(p => p.id))
    expect(projectsOf(os.projects, 'st_kural').some(p => lens.has(p.id))).toBe(false)
    expect(proofsOf(st.proofs, st.events, 'st_lens').some(p => p.id === 'pf_kural')).toBe(false)
    expect(Object.keys(picksOf(st.picks, st.events, 'st_lens')).some(id => id.startsWith('ev_') && eventsOf(st.events, 'st_kural').some(e => e.id === id))).toBe(false)
  })

  it('no session → nothing', () => {
    const st = useStudioStore.getState()
    expect(projectsOf(useOsStore.getState().projects, undefined)).toEqual([])
    expect(eventsOf(st.events, undefined)).toEqual([])
    expect(proofsOf(st.proofs, st.events, undefined)).toEqual([])
  })

  it('a gallery linked across studios is not served', () => {
    const st = useStudioStore.getState()
    const kuralEv = eventsOf(st.events, 'st_kural')[0]
    expect(galleryOf({ studioId: 'st_lens', galleryEventId: kuralEv.id }, st.events)).toBeUndefined()
  })

  it('customer codes resolve to the owning studio only', () => {
    const os = useOsStore.getState()
    const st = useStudioStore.getState()
    const hit = resolveGalleryCode('divya2rk', os.projects, st.events)!
    expect(hit.project?.studioId).toBe('st_lens')
    expect(hit.event?.studioId).toBe('st_lens')
    const poses = resolvePosesCode('divya2rk', os.projects)!
    expect(poses.studioId).toBe('st_lens')
    expect(poses.pin).toBe('4821')
    expect(poses.poses?.sentAt).toBeTruthy()
  })

  it('demo data: st_lens has two projects with galleries and one with poses sent', () => {
    const lens = projectsOf(useOsStore.getState().projects, 'st_lens').filter(p => !p.name.startsWith('Selvi'))
    const events = useStudioStore.getState().events
    expect(lens.filter(p => galleryOf(p, events)).length).toBeGreaterThanOrEqual(2)
    expect(lens.filter(p => p.poses?.sentAt).length).toBeGreaterThanOrEqual(1)
  })
})
