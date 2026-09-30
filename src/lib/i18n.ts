import { useMemo } from 'react'
import { useLocation } from 'react-router'
import { useStore } from './store'

export type Lang = 'en' | 'ta'

/** A bilingual value. Every user-facing string in the app is one of these. */
export interface Bi<T = string> {
  en: T
  ta: T
}

/** The admin console is staff-only and English-only, whatever the site language. */
export function isAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

export function useLang(): Lang {
  const lang = useStore(s => s.lang)
  const { pathname } = useLocation()
  return isAdminPath(pathname) ? 'en' : lang
}

/** Resolve a bilingual value for the given language. */
export function pick<T>(lang: Lang, value: Bi<T>): T {
  return value[lang]
}

/** Returns a resolver for inline bilingual values: tx({ en: 'Hi', ta: 'வணக்கம்' }). */
export function useTx() {
  const lang = useLang()
  return useMemo(() => <T,>(value: Bi<T>): T => value[lang], [lang])
}

type Resolved<D> = { [K in keyof D]: D[K] extends Bi<infer T> ? T : never }

/**
 * Resolve a whole copy dictionary at once. Keep en and ta next to each other
 * per key so the two languages can never drift apart:
 *
 *   const copy = { title: { en: 'Gallery', ta: 'காட்சியகம்' } }
 *   const t = useT(copy)  // t.title
 */
export function useT<D extends Record<string, Bi<unknown>>>(dict: D): Resolved<D> {
  const lang = useLang()
  return useMemo(() => {
    const out = {} as Record<string, unknown>
    for (const k in dict) out[k] = dict[k][lang]
    return out as Resolved<D>
  }, [dict, lang])
}

// ─── Formatting ──────────────────────────────────────────────────────────────

export function formatINR(amount: number): string {
  return '₹' + Math.round(amount).toLocaleString('en-IN')
}

export function formatDate(iso: string | undefined, lang: Lang, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-IN', opts)
}

export function formatDateTime(iso: string | undefined, lang: Lang): string {
  return formatDate(iso, lang, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

/** Shared strings used across many screens. Page-specific copy lives with its page. */
export const COMMON = {
  // The studio name is a proper noun and stays in English in both languages.
  brand: { en: 'The Treasure Capture Events', ta: 'The Treasure Capture Events' },
  brandShort: { en: 'Treasure Capture Events', ta: 'Treasure Capture Events' },
  tagline: { en: 'Photography & Album Artistry · Tamil Nadu', ta: 'புகைப்படக் கலை & ஆல்பம் · தமிழ்நாடு' },
  home: { en: 'Home', ta: 'முகப்பு' },
  gallery: { en: 'Gallery', ta: 'காட்சியகம்' },
  services: { en: 'Services', ta: 'சேவைகள்' },
  about: { en: 'Studio', ta: 'எங்களைப் பற்றி' },
  contact: { en: 'Contact', ta: 'தொடர்புக்கு' },
  book: { en: 'Reserve your day', ta: 'சுபதினம் பதிவு' },
  getQuote: { en: 'Begin your story with us', ta: 'உங்கள் கதையை எங்களுடன் தொடங்குங்கள்' },
  login: { en: 'Client login', ta: 'வாடிக்கையாளர் நுழைவு' },
  logout: { en: 'Sign out', ta: 'வெளியேறு' },
  dashboard: { en: 'My dashboard', ta: 'என் பக்கம்' },
  admin: { en: 'Admin', ta: 'நிர்வாகம்' },
  back: { en: 'Back', ta: 'பின் செல்' },
  next: { en: 'Continue', ta: 'தொடர்க' },
  close: { en: 'Close', ta: 'மூடு' },
  save: { en: 'Save', ta: 'சேமி' },
  cancel: { en: 'Cancel', ta: 'ரத்து' },
  viewAll: { en: 'View all', ta: 'அனைத்தும் பார்க்க' },
  language: { en: 'Language', ta: 'மொழி' },
  terms: { en: 'Terms & Conditions', ta: 'விதிமுறைகள்' },
  privacy: { en: 'Privacy', ta: 'தனியுரிமை' },
  district: { en: 'District', ta: 'மாவட்டம்' },
  listen: { en: 'Listen', ta: 'கேளுங்கள்' },
  stop: { en: 'Stop', ta: 'நிறுத்து' },
  required: { en: 'Required', ta: 'அவசியம்' },
  copyright: { en: 'All rights reserved.', ta: 'அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.' },
} satisfies Record<string, Bi>
