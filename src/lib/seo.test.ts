import { describe, expect, it } from 'vitest'
import { DISTRICTS } from './data'
import { STORIES } from './gallery'
import { landingCopy } from './landing'
import {
  LANDING_EVENTS, LANDING_EVENT_SLUGS, PUBLIC_ROUTES, PHOTOGRAPHER_ROUTES, SITE_URL, indexablePaths, landingPath, landingPaths, langFromSearch, langUrl, parseLandingSlug, sitemapXml, withLangParam,
} from './seo'

describe('indexable paths', () => {
  it('lists every district × landing event once, plus routes and stories', () => {
    expect(LANDING_EVENTS).not.toContain('babyshoot')
    expect(LANDING_EVENTS).not.toContain('commercial')
    expect(landingPaths()).toHaveLength(DISTRICTS.length * LANDING_EVENTS.length)
    expect(landingPaths()).toHaveLength(96)
    const all = indexablePaths()
    expect(all).toHaveLength(PUBLIC_ROUTES.length + PHOTOGRAPHER_ROUTES.length + STORIES.length + 96)
    expect(all).toContain('/for-photographers/poses')
    expect(new Set(all).size).toBe(all.length)
    expect(all).toContain('/photography/madurai/wedding')
    expect(all).toContain('/photography/theni/puberty-ceremony')
    expect(all.every(p => p.startsWith('/') && !p.includes('?'))).toBe(true)
  })

  it('has unique, URL-safe event slugs', () => {
    const slugs = LANDING_EVENTS.map(e => LANDING_EVENT_SLUGS[e]!)
    expect(new Set(slugs).size).toBe(slugs.length)
    expect(slugs.every(s => /^[a-z]+(-[a-z]+)*$/.test(s))).toBe(true)
  })
})

describe('parseLandingSlug', () => {
  it('round-trips every landing path', () => {
    for (const d of DISTRICTS) for (const e of LANDING_EVENTS) {
      const [, , district, slug] = landingPath(d.key, e).split('/')
      expect(parseLandingSlug(district, slug)).toEqual({ district: d.key, event: e })
    }
  })

  it('rejects unknown districts, raw keys that differ from slugs, and unpublished events', () => {
    expect(parseLandingSlug('kerala', 'wedding')).toBeNull()
    expect(parseLandingSlug('madurai', 'puberty')).toBeNull()
    expect(parseLandingSlug('madurai', 'babyshoot')).toBeNull()
    expect(parseLandingSlug('madurai', undefined)).toBeNull()
    expect(parseLandingSlug(undefined, 'wedding')).toBeNull()
  })
})

describe('language in the URL', () => {
  it('reads ?lang=', () => {
    expect(langFromSearch('?lang=ta')).toBe('ta')
    expect(langFromSearch('?event=wedding&lang=en')).toBe('en')
    expect(langFromSearch('?lang=fr')).toBeNull()
    expect(langFromSearch('')).toBeNull()
  })

  it('adds lang=ta for Tamil and drops it for English, keeping other params', () => {
    expect(withLangParam('', 'ta')).toBe('?lang=ta')
    expect(withLangParam('?cat=weddings', 'ta')).toBe('?cat=weddings&lang=ta')
    expect(withLangParam('?cat=weddings&lang=ta', 'en')).toBe('?cat=weddings')
    expect(withLangParam('?lang=ta', 'en')).toBe('')
    expect(withLangParam('?lang=ta&cat=x', 'ta')).toBe('?lang=ta&cat=x')
  })

  it('builds per-language URLs', () => {
    expect(langUrl('/gallery', 'en')).toBe(`${SITE_URL}/gallery`)
    expect(langUrl('/gallery', 'ta')).toBe(`${SITE_URL}/gallery?lang=ta`)
  })

  it('lists both languages with hreflang alternates in the sitemap', () => {
    const xml = sitemapXml(['/', '/about'], '2026-10-21')
    expect(xml.match(/<url>/g)).toHaveLength(4)
    expect(xml).toContain(`<loc>${SITE_URL}/about?lang=ta</loc>`)
    expect(xml).toContain(`hreflang="x-default" href="${SITE_URL}/about"`)
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"')
  })
})

describe('landing copy', () => {
  it('is unique per page in both languages', () => {
    const pages = DISTRICTS.flatMap(d => LANDING_EVENTS.map(e => landingCopy(d.key, e)!))
    for (const lang of ['en', 'ta'] as const) {
      for (const field of ['h1', 'description'] as const) {
        const values = pages.map(p => p[field][lang])
        expect(new Set(values).size, `${field}.${lang}`).toBe(values.length)
      }
      // The body (intro + local paragraph + FAQ) differs page to page, not just the place name.
      const bodies = pages.map(p => [p.intro, p.local, ...p.faq.map(f => f.a)].map(b => b[lang]).join(' ').split(DISTRICTS.find(d => d.key === p.district)!.name[lang]).join(''))
      expect(new Set(bodies).size).toBe(bodies.length)
    }
    expect(pages.every(p => p.faq.length === 4 && p.tiers.length === 3)).toBe(true)
  })

  it('uses the Madurai wedding wording from the keyword map', () => {
    const p = landingCopy('madurai', 'wedding')!
    expect(p.h1.en).toBe('Wedding photographer in Madurai')
    expect(p.h1.ta).toBe('மதுரையில் திருமண புகைப்படக் கலைஞர்')
  })
})
