import { useEffect } from 'react'
import { create } from 'zustand'
import { useLang, type Lang } from './i18n'
import { useStore } from './store'
import { useLocation } from 'react-router'
import { langUrl } from './seo'
import { collectSsrHead } from './ssrHead'

/** Transient UI state that must never be persisted. */
interface UiState {
  /** 'hero': dark full-bleed hero under the nav; 'page': the whole page is dark. */
  navOnDark: false | 'hero' | 'page'
  /** True while the nav is scrolled out of view, so sticky bars can move up. */
  navHidden: boolean
  /** Target language while the curtain transition is running. */
  curtain: Lang | null
  toasts: { id: number; text: string; tone: 'default' | 'ruby' }[]
}

export const useUi = create<UiState>(() => ({ navOnDark: false, navHidden: false, curtain: null, toasts: [] }))

/**
 * Pages with a dark full-bleed hero call this so the nav starts in its
 * light-on-dark style. Pass 'page' when the whole page is dark so the nav
 * stays dark (as dark glass) after scrolling too.
 */
export function useDarkHero(mode: 'hero' | 'page' | false = 'hero') {
  useEffect(() => {
    if (!mode) return
    useUi.setState({ navOnDark: mode })
    return () => useUi.setState({ navOnDark: false })
  }, [mode])
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Switch language behind a full-screen curtain so every string, font and
 * image swaps while hidden, rather than flickering in place.
 */
export function requestLang(target: Lang) {
  const { lang, setLang } = useStore.getState()
  if (target === lang || useUi.getState().curtain) return
  if (prefersReducedMotion()) {
    setLang(target)
    return
  }
  useUi.setState({ curtain: target })
}

/** Sets the document title for the page in the current language. */
export function useTitle(title: { en: string; ta: string }) {
  const lang = useLang()
  if (import.meta.env.SSR) collectSsrHead({ title: `${title[lang]} · The Treasure Capture Events`, lang })
  useEffect(() => {
    document.title = `${title[lang]} · The Treasure Capture Events`
  }, [lang, title.en, title.ta])
}

/**
 * Meta description, canonical, hreflang alternates and Open Graph tags for a
 * public page, in the current language. English is the plain URL and Tamil the
 * same path with ?lang=ta; each language's canonical points at itself.
 */
export function useSeo(description: { en: string; ta: string }) {
  const lang = useLang()
  const { pathname } = useLocation()
  const url = langUrl(pathname, lang)
  const alternates = [
    { hreflang: 'en', href: langUrl(pathname, 'en') },
    { hreflang: 'ta', href: langUrl(pathname, 'ta') },
    { hreflang: 'x-default', href: langUrl(pathname, 'en') },
  ]
  if (import.meta.env.SSR) collectSsrHead({ description: description[lang], canonical: url, alternates })
  useEffect(() => {
    const meta = (attr: 'name' | 'property', key: string, content: string) => {
      let m = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
      if (!m) {
        m = document.createElement('meta')
        m.setAttribute(attr, key)
        document.head.appendChild(m)
      }
      m.content = content
    }
    const link = (selector: string, attrs: Record<string, string>) => {
      let l = document.head.querySelector<HTMLLinkElement>(selector)
      if (!l) {
        l = document.createElement('link')
        document.head.appendChild(l)
      }
      for (const k in attrs) l.setAttribute(k, attrs[k])
    }
    link('link[rel="canonical"]', { rel: 'canonical', href: url })
    for (const a of alternates) link(`link[rel="alternate"][hreflang="${a.hreflang}"]`, { rel: 'alternate', ...a })
    document.documentElement.lang = lang
    meta('name', 'description', description[lang])
    meta('property', 'og:title', document.title)
    meta('property', 'og:description', description[lang])
    meta('property', 'og:url', url)
    meta('property', 'og:locale', lang === 'ta' ? 'ta_IN' : 'en_IN')
  }, [lang, pathname, url, description.en, description.ta]) // alternates derive from pathname
}

let toastId = 0
export function toast(text: string, tone: 'default' | 'ruby' = 'default') {
  const id = ++toastId
  useUi.setState(s => ({ toasts: [...s.toasts, { id, text, tone }] }))
  setTimeout(() => useUi.setState(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 3600)
}
