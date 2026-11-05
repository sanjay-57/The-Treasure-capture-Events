import type { Bi } from '../../lib/i18n'

/** Pure helpers for the client portal. No React, no stores: tested in helpers.test.ts. */

export interface ContractVars {
  client: string
  studio: string
  total: string
}

/** Fills {{client}}, {{studio}}, {{total}} (spaces inside the braces allowed). Unknown placeholders are left as they are. */
export function fillContract(body: string, vars: ContractVars): string {
  return body.replace(/\{\{\s*(client|studio|total)\s*\}\}/g, (_, k: keyof ContractVars) => vars[k])
}

/** Accepts Google Maps share links: maps.google.*, google.*\/maps, goo.gl/maps, maps.app.goo.gl. */
export function isMapsUrl(raw: string): boolean {
  const s = raw.trim()
  if (!s) return false
  let u: URL
  try {
    u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`)
  } catch {
    return false
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return false
  const host = u.hostname.toLowerCase().replace(/^www\./, '')
  const path = u.pathname.toLowerCase()
  if (host === 'maps.app.goo.gl') return path.length > 1
  if (host === 'goo.gl') return path.startsWith('/maps')
  const tld = '(?:com|[a-z]{2}|co\\.[a-z]{2}|com\\.[a-z]{2})'
  if (new RegExp(`^maps\\.google\\.${tld}$`).test(host)) return true
  if (new RegExp(`^google\\.${tld}$`).test(host)) return path.startsWith('/maps')
  return false
}

/** Normalises a pasted maps link so it always carries https://. */
export function normaliseUrl(raw: string): string {
  const s = raw.trim()
  return /^https?:\/\//i.test(s) ? s : `https://${s}`
}

/** Digits for wa.me: 10-digit Indian numbers get the 91 prefix; leading 0 trunk prefix dropped. */
export function waNumber(phone: string): string {
  let d = phone.replace(/\D/g, '')
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1)
  return d.length === 10 ? `91${d}` : d
}

export function waLink(phone: string, text?: string): string {
  const n = waNumber(phone)
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}

export const telLink = (phone: string) => `tel:+${waNumber(phone)}`

/** Dashboard countdown: null days means nothing ahead (the event is done). */
export function countdownLabel(days: number | null): Bi {
  if (days === null) return { en: 'Event done', ta: 'நிகழ்வு முடிந்தது' }
  if (days === 0) return { en: 'Today', ta: 'இன்று' }
  if (days === 1) return { en: 'Tomorrow', ta: 'நாளை' }
  return { en: `${days} days to go`, ta: `இன்னும் ${days} நாட்கள்` }
}

/** "120 / 300", or "—" when the deliverable is not countable. */
export function progressCount(done: number, total: number | null): string {
  return total === null ? '—' : `${Math.min(done, total)} / ${total}`
}

export const PIN_RE = /^\d{4}$/

/** sessionStorage key that remembers a correct PIN for one portal code. */
export const pinKey = (code: string) => `tcp:pin:${code.toLowerCase()}`
export const bannerKey = 'tcp:banner-dismissed'

/** Pinterest board/pin links: pinterest.<tld>/… or pin.it/… */
export function isPinterestUrl(raw: string): boolean {
  const s = raw.trim()
  if (!s) return false
  try {
    const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`)
    const host = u.hostname.toLowerCase().replace(/^(www|[a-z]{2})\./, '')
    return host === 'pin.it' || /^pinterest\.(?:com|[a-z]{2}|co\.[a-z]{2}|com\.[a-z]{2})$/.test(host)
  } catch {
    return false
  }
}

/** Target size for a resized upload, keeping aspect ratio, longest side ≤ max. */
export function fitWithin(w: number, h: number, max = 1600): { w: number; h: number } {
  const s = Math.min(1, max / Math.max(w, h))
  return { w: Math.round(w * s), h: Math.round(h * s) }
}
