import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLang } from '../lib/i18n'

/*
 * Keyless Google Maps embed. Shows a place by search text or by coordinates.
 * Typing waits a moment before the map reloads, so it does not refresh on
 * every key. Venue search with suggestions needs the Places API key (Phase 6).
 * On touch screens the map sits behind a tap-to-use cover so a finger
 * scrolling the page is not caught by the map.
 */

const gateCopy = { en: 'Tap to move the map', ta: 'வரைபடத்தை நகர்த்தத் தட்டவும்' }

/** Touch-only cover over an embedded map; a tap hands gestures to the map until the user touches elsewhere. */
export function MapGate({ children }: { children: ReactNode }) {
  const lang = useLang()
  const ref = useRef<HTMLDivElement>(null)
  const [live, setLive] = useState(false)
  useEffect(() => {
    if (!live) return
    const off = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setLive(false) }
    document.addEventListener('pointerdown', off)
    return () => document.removeEventListener('pointerdown', off)
  }, [live])
  return (
    <div ref={ref} className="absolute inset-0">
      {children}
      {!live && (
        <button type="button" onClick={() => setLive(true)} className="absolute inset-0 hidden items-end justify-center bg-transparent pb-3 [@media(hover:none)]:flex cursor-pointer">
          <span className="glass-dark rounded-full px-3.5 py-2 text-[13px] font-medium text-white">{gateCopy[lang]}</span>
        </button>
      )}
    </div>
  )
}

export const mapsEmbedUrl = (q: string) => `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=15&output=embed`
export const mapsLink = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`

export function MapEmbed({ query, title, className = '' }: { query: string; title: string; className?: string }) {
  const [shown, setShown] = useState(query)
  useEffect(() => {
    const id = window.setTimeout(() => setShown(query), 900)
    return () => window.clearTimeout(id)
  }, [query])
  if (!shown) return null
  return (
    <div className={`relative overflow-hidden rounded-[22px] border hairline bg-ink/[0.04] ${className}`}>
      <MapGate>
        <iframe key={shown} src={mapsEmbedUrl(shown)} title={title} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="absolute inset-0 h-full w-full border-0" />
      </MapGate>
    </div>
  )
}
