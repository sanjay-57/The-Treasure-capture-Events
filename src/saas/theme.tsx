import { useEffect, type CSSProperties, type ReactNode } from 'react'
import type { Studio } from './types'

/**
 * White-label wrapper: sets --accent / --accent-ink / --accent-soft from the
 * studio's colour so client galleries never show TTC's ruby. Use Tailwind
 * arbitrary values: bg-[var(--accent)] text-[var(--accent-ink)].
 */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h.padEnd(6, '0').slice(0, 6)
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** WCAG relative luminance; picks white or ink text on the accent. */
export function accentInk(hex: string): string {
  const [r, g, b] = hexToRgb(hex).map(v => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return L > 0.4 ? '#0a0a0b' : '#ffffff'
}

export function accentVars(accent: string): CSSProperties {
  const [r, g, b] = hexToRgb(accent)
  return {
    ['--accent' as string]: accent,
    ['--accent-ink' as string]: accentInk(accent),
    ['--accent-soft' as string]: `rgba(${r}, ${g}, ${b}, 0.1)`,
    ['--accent-ring' as string]: `rgba(${r}, ${g}, ${b}, 0.28)`,
  }
}

export function StudioTheme({ studio, children, className = '' }: { studio: Pick<Studio, 'accent'>; children: ReactNode; className?: string }) {
  return (
    <div style={accentVars(studio.accent)} className={className}>
      {children}
    </div>
  )
}

/** Monogram used when a studio has no logo yet. */
export function StudioMark({ studio, size = 40, className = '' }: { studio: Pick<Studio, 'name' | 'accent'> & { logoUrl?: string }; size?: number; className?: string }) {
  if (studio.logoUrl) return <img src={studio.logoUrl} alt={studio.name} style={{ height: size, width: 'auto' }} className={`object-contain ${className}`} />
  const letters = studio.name.split(/\s+|&/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('')
  return (
    <span aria-hidden="true" style={{ width: size, height: size, background: studio.accent, color: accentInk(studio.accent), fontSize: size * 0.38 }} className={`inline-flex shrink-0 items-center justify-center rounded-full font-display font-semibold ${className}`}>
      {letters}
    </span>
  )
}

/** Head tags useBrandHead rewrites on customer pages: [selector, attribute, create-as]. */
const HEAD_TAGS = {
  icon: ['link[rel="icon"]', 'href', { rel: 'icon' }],
  appleIcon: ['link[rel="apple-touch-icon"]', 'href', { rel: 'apple-touch-icon' }],
  description: ['meta[name="description"]', 'content', { name: 'description' }],
  ogTitle: ['meta[property="og:title"]', 'content', { property: 'og:title' }],
  ogDescription: ['meta[property="og:description"]', 'content', { property: 'og:description' }],
  ogImage: ['meta[property="og:image"]', 'content', { property: 'og:image' }],
  ogSiteName: ['meta[property="og:site_name"]', 'content', { property: 'og:site_name' }],
  themeColor: ['meta[name="theme-color"]', 'content', { name: 'theme-color' }],
  appTitle: ['meta[name="apple-mobile-web-app-title"]', 'content', { name: 'apple-mobile-web-app-title' }],
} as const satisfies Record<string, readonly [string, string, Record<string, string>]>

/**
 * White-label <head> for customer pages (gallery, poses, portal): title,
 * favicon (the studio logo), description, og:* and theme-color all name the
 * studio, never TTC. Restores whatever was there on unmount, and removes tags
 * it had to create. Frontend-only limit: the static index.html still carries
 * TTC's title until JS runs, and link-preview bots that do not run JS see it.
 */
export function useBrandHead(studio: Pick<Studio, 'name' | 'accent'> & { logoUrl?: string } | undefined, title: string, description?: string) {
  const name = studio?.name
  const logo = studio?.logoUrl
  const accent = studio?.accent
  useEffect(() => {
    if (typeof document === 'undefined' || !name) return
    const values: Partial<Record<keyof typeof HEAD_TAGS, string>> = {
      description: description ?? name,
      ogTitle: title,
      ogDescription: description ?? name,
      ogSiteName: name,
      appTitle: name,
      themeColor: accent,
      icon: logo,
      appleIcon: logo,
      ogImage: logo,
    }
    const undo: (() => void)[] = []
    const prevTitle = document.title
    document.title = title
    undo.push(() => {
      document.title = prevTitle
    })
    for (const key of Object.keys(HEAD_TAGS) as (keyof typeof HEAD_TAGS)[]) {
      const value = values[key]
      if (!value) continue
      const [selector, attr, create] = HEAD_TAGS[key]
      let el = document.head.querySelector<HTMLElement>(selector)
      if (el) {
        const prev = el.getAttribute(attr)
        const node = el
        undo.push(() => (prev === null ? node.removeAttribute(attr) : node.setAttribute(attr, prev)))
      } else {
        el = document.createElement(selector.startsWith('link') ? 'link' : 'meta')
        for (const [k, v] of Object.entries(create)) el.setAttribute(k, v)
        document.head.appendChild(el)
        const node = el
        undo.push(() => node.remove())
      }
      el.setAttribute(attr, value)
    }
    return () => undo.reverse().forEach(f => f())
  }, [name, logo, accent, title, description])
}
