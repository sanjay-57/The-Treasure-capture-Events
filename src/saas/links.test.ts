import { describe, expect, it } from 'vitest'
import { galleryLink, portalLink, posesLink, resolveGalleryCode, resolvePosesCode, whatsappShare } from './links'
import { useOsStore } from './os/store'
import { useStudioStore } from './store'

describe('customer links', () => {
  const projects = useOsStore.getState().projects
  const events = useStudioStore.getState().events
  const studio = useStudioStore.getState().studios.find(s => s.id === 'st_lens')!
  const divya = projects.find(p => p.code === 'divya2rk')!

  it('builds one link per kind from the project code', () => {
    expect(galleryLink('divya2rk')).toMatch(/\/gallery\/divya2rk$/)
    expect(posesLink('divya2rk')).toMatch(/\/poses\/divya2rk$/)
    expect(portalLink('divya2rk')).toMatch(/\/p\/divya2rk$/)
  })

  it('share text names the studio only, in both languages', () => {
    for (const kind of ['gallery', 'poses', 'portal'] as const)
      for (const lang of ['en', 'ta'] as const) {
        const msg = whatsappShare(studio, divya, kind, lang)
        expect(msg).toContain(studio.name)
        expect(msg).toContain(`PIN: ${divya.pin}`)
        expect(msg).not.toMatch(/treasure|ttc/i)
      }
  })

  it('resolves a project code to its gallery', () => {
    const hit = resolveGalleryCode('DIVYA2RK', projects, events)
    expect(hit?.project?.id).toBe('pj_divya')
    expect(hit?.event?.id).toBe('ev_sharma')
  })

  it('still resolves a legacy event code, with its project', () => {
    const hit = resolveGalleryCode('demo4821', projects, events)
    expect(hit?.event?.id).toBe('ev_sharma')
    expect(hit?.project?.id).toBe('pj_divya')
    expect(resolveGalleryCode('anbu7rk2', projects, events)).toEqual({ event: events.find(e => e.id === 'ev_anbu'), project: undefined })
  })

  it('a project without a gallery resolves with no event', () => {
    const p = { ...divya, id: 'pj_x', code: 'nogal123', galleryEventId: undefined }
    expect(resolveGalleryCode('nogal123', [p], events)).toEqual({ project: p, event: undefined })
  })

  it('story slugs and unknown codes fall through (null)', () => {
    expect(resolveGalleryCode('priya-and-arjun-temple-wedding', projects, events)).toBeNull()
    expect(resolveGalleryCode('', projects, events)).toBeNull()
  })

  it('does not join a project to another studio’s event', () => {
    const p = { ...divya, galleryEventId: 'ev_kural' }
    expect(resolveGalleryCode('divya2rk', [p], events)?.event).toBeUndefined()
  })

  it('resolves poses codes by project only', () => {
    expect(resolvePosesCode('divya2rk', projects)?.id).toBe('pj_divya')
    expect(resolvePosesCode('demo4821', projects)).toBeUndefined()
  })
})
