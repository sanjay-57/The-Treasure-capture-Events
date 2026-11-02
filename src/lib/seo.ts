/*
 * SEO basics (roadmap 7.2). The domain is the one already printed in WhatsApp
 * messages; confirm it with the client before launch. Keep this file free of
 * React imports; scripts/sitemap.mjs loads it under Node.
 */

import type { Lang } from './i18n'
// Explicit .ts extensions so Node (scripts/sitemap.mjs, a prerender script) can load these too.
import { DISTRICTS, EVENTS, type DistrictKey, type EventKey } from './data.ts'
import { STORIES } from './gallery.ts'

export const SITE_URL = 'https://treasurecaptureevents.in'

/** Public, crawlable routes. Booking steps, dashboards, admin and invites stay out. */
export const PUBLIC_ROUTES = ['/', '/gallery', '/services', '/about', '/contact', '/book', '/terms', '/privacy', '/photography']

// ─── Landing pages: /photography/:district/:event ───────────────────────────

/**
 * URL slug per bookable event, worded the way people search. Baby shoots are
 * contact-only (Cradle Captures) and commercial shoots are quoted per brief,
 * so neither gets district pages.
 */
export const LANDING_EVENT_SLUGS: Partial<Record<EventKey, string>> = {
  wedding: 'wedding',
  engagement: 'engagement',
  reception: 'reception',
  puberty: 'puberty-ceremony',
  earpiercing: 'ear-piercing',
  naming: 'naming-ceremony',
  birthday: 'birthday',
  babyshower: 'baby-shower',
  prewedding: 'pre-wedding-shoot',
  outdoor: 'outdoor-shoot',
  model: 'model-portfolio',
  corporate: 'corporate-event',
}

/** Events with landing pages, in the site's usual event order. */
export const LANDING_EVENTS: EventKey[] = EVENTS.filter(e => e.bookable !== false && LANDING_EVENT_SLUGS[e.key]).map(e => e.key)

export const landingPath = (district: DistrictKey, event: EventKey) => `/photography/${district}/${LANDING_EVENT_SLUGS[event]}`

/** Reads the two URL segments back to keys; null for anything we don't publish. */
export function parseLandingSlug(district: string | undefined, eventSlug: string | undefined): { district: DistrictKey; event: EventKey } | null {
  const d = DISTRICTS.find(x => x.key === district)
  const event = LANDING_EVENTS.find(k => LANDING_EVENT_SLUGS[k] === eventSlug)
  return d && event ? { district: d.key, event } : null
}

export const landingPaths = () => DISTRICTS.flatMap(d => LANDING_EVENTS.map(e => landingPath(d.key, e)))

/**
 * Every public, indexable path (English form; Tamil is the same path with
 * ?lang=ta). The sitemap and any pre-render step both read this.
 */
export function indexablePaths(): string[] {
  return [...PUBLIC_ROUTES, ...STORIES.map(s => `/gallery/${s.slug}`), ...landingPaths()]
}

// ─── Language in the URL ─────────────────────────────────────────────────────

/** English is the plain URL; Tamil is the same path with ?lang=ta. */
export function langFromSearch(search: string): Lang | null {
  const v = new URLSearchParams(search).get('lang')
  return v === 'ta' || v === 'en' ? v : null
}

/** `search` with the lang param set for Tamil or removed for English, other params kept. Returns '' or '?…'. */
export function withLangParam(search: string, lang: Lang): string {
  const p = new URLSearchParams(search)
  if (lang === 'ta') p.set('lang', 'ta')
  else p.delete('lang')
  const out = p.toString()
  return out ? `?${out}` : ''
}

/** Absolute URL of a path in one language. */
export const langUrl = (path: string, lang: Lang) => `${SITE_URL}${path}${lang === 'ta' ? '?lang=ta' : ''}`

const xmlEscape = (s: string) => s.replace(/&/g, '&amp;')

/** One <url> per path and language, each listing both languages plus x-default as alternates. */
export function sitemapXml(paths: string[], lastmod: string): string {
  const urls = paths.flatMap(p => {
    const alt = [
      `    <xhtml:link rel="alternate" hreflang="en" href="${xmlEscape(langUrl(p, 'en'))}"/>`,
      `    <xhtml:link rel="alternate" hreflang="ta" href="${xmlEscape(langUrl(p, 'ta'))}"/>`,
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(langUrl(p, 'en'))}"/>`,
    ].join('\n')
    return (['en', 'ta'] as const).map(l => `  <url>\n    <loc>${xmlEscape(langUrl(p, l))}</loc>\n    <lastmod>${lastmod}</lastmod>\n${alt}\n  </url>`)
  }).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`
}

export function robotsTxt(): string {
  return ['User-agent: *', 'Disallow: /admin', 'Disallow: /dashboard', 'Disallow: /book/', 'Disallow: /i/', 'Disallow: /login', '', `Sitemap: ${SITE_URL}/sitemap.xml`, ''].join('\n')
}

export interface StudioInfo {
  phone: string
  email: string
  addressEn: string
}

/**
 * LocalBusiness JSON-LD built from the same CMS details the footer and Contact
 * page show, so it stays in step when the studio edits them in admin.
 * schema.org has no "Photographer" business type; ProfessionalService is the closest.
 */
export function studioJsonLd(studio: StudioInfo, areaServed: string[], offers: { name: string; price: number }[]) {
  // "14, West Masi Street, Madurai 625001" → street, city, postcode
  const parts = studio.addressEn.split(',').map(s => s.trim())
  const last = parts.at(-1) ?? ''
  const postalCode = last.match(/\d{6}/)?.[0]
  const locality = last.replace(/\d{6}/, '').trim() || 'Madurai'
  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'ProfessionalService'],
    '@id': `${SITE_URL}/#studio`,
    name: 'The Treasure Capture Events',
    description: 'Wedding and family-function photography and videography studio in Madurai, Tamil Nadu.',
    url: SITE_URL,
    telephone: studio.phone.replace(/\s/g, ''),
    email: studio.email,
    priceRange: '₹₹',
    address: {
      '@type': 'PostalAddress',
      streetAddress: parts.slice(0, -1).join(', '),
      addressLocality: locality,
      postalCode,
      addressRegion: 'Tamil Nadu',
      addressCountry: 'IN',
    },
    openingHoursSpecification: [{
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '09:30',
      closes: '20:00',
    }],
    areaServed: areaServed.map(name => ({ '@type': 'City', name })),
    makesOffer: offers.map(o => ({
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: o.price,
      itemOffered: { '@type': 'Service', name: o.name },
    })),
  }
}

/** BreadcrumbList JSON-LD; `path` is site-relative. */
export function breadcrumbJsonLd(items: { name: string; path: string }[], lang: Lang) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: langUrl(it.path, lang) })),
  }
}

export function faqJsonLd(faq: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  }
}

/** One service in one district, offered by the studio from studioJsonLd. Leave `price` out while it's a placeholder. */
export function serviceJsonLd(o: { name: string; serviceType: string; description: string; area: string; path: string; lang: Lang; price?: number }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: o.name,
    serviceType: o.serviceType,
    description: o.description,
    url: langUrl(o.path, o.lang),
    provider: { '@id': `${SITE_URL}/#studio` },
    areaServed: { '@type': 'AdministrativeArea', name: `${o.area}, Tamil Nadu` },
    ...(o.price ? { offers: { '@type': 'Offer', priceCurrency: 'INR', price: o.price } } : {}),
  }
}

/** Safe to drop into <script type="application/ld+json">. */
export const jsonLdString = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c')
