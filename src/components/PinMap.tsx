import { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import type * as Leaflet from 'leaflet'
import { Icon } from './Icon'
import { MapGate } from './MapEmbed'
import { useLang, useT } from '../lib/i18n'
import { STUDIO_COORDS, roundCoord, type LatLng } from '../lib/geo'

/*
 * A real, draggable map for choosing a spot: tap or click anywhere to drop the
 * pin, drag the pin to fine-tune, or switch to satellite to find the building.
 * Leaflet loads on the client only (the prerender has no window). Street tiles
 * from CARTO, satellite from Esri; both keyless.
 */

const copy = {
  hint: { en: 'Tap the map to drop a pin. Drag it to adjust.', ta: 'பின் போட வரைபடத்தைத் தொடுங்கள். சரிசெய்ய இழுங்கள்.' },
  map: { en: 'Map', ta: 'வரைபடம்' },
  satellite: { en: 'Satellite', ta: 'செயற்கைக்கோள்' },
  dropHere: { en: 'Pin the centre', ta: 'நடுவில் பின் போடு' },
}

const TILES = {
  map: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Imagery © Esri',
  },
} as const

const PIN_SVG = `<svg width="34" height="46" viewBox="0 0 34 46" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 45c0 0 15-15.6 15-27.5C32 8.4 25.3 1.5 17 1.5S2 8.4 2 17.5C2 29.4 17 45 17 45z" fill="#9b111e" stroke="#fff" stroke-width="2.5"/><circle cx="17" cy="17" r="6" fill="#fff"/></svg>`

export function PinMap({ value, center, onPick, label, className = '' }: {
  /** The pin, if one is set. */
  value?: LatLng
  /** Where to look when there is no pin yet (e.g. the district centre). */
  center?: LatLng
  onPick: (ll: LatLng) => void
  /** Accessible name for the map. */
  label: string
  className?: string
}) {
  const lang = useLang()
  const t = useT(copy)
  const box = useRef<HTMLDivElement>(null)
  const map = useRef<Leaflet.Map | null>(null)
  const marker = useRef<Leaflet.Marker | null>(null)
  const layer = useRef<Leaflet.TileLayer | null>(null)
  const L = useRef<typeof Leaflet | null>(null)
  const pickRef = useRef(onPick)
  pickRef.current = onPick
  const [mode, setMode] = useState<'map' | 'satellite'>('map')
  const [ready, setReady] = useState(false)

  const place = (ll: LatLng) => {
    const lf = L.current
    const m = map.current
    if (!lf || !m) return
    if (!marker.current) {
      const icon = lf.divIcon({ html: PIN_SVG, className: 'pin-map-marker', iconSize: [34, 46], iconAnchor: [17, 45] })
      marker.current = lf.marker([ll.lat, ll.lng], { icon, draggable: true, keyboard: false }).addTo(m)
      marker.current.on('dragend', () => {
        const p = marker.current!.getLatLng()
        pickRef.current({ lat: roundCoord(p.lat), lng: roundCoord(p.lng) })
      })
    } else marker.current.setLatLng([ll.lat, ll.lng])
  }

  // Build the map once.
  useEffect(() => {
    let dead = false
    void import('leaflet').then(mod => {
      const lf = (mod as unknown as { default?: typeof Leaflet }).default ?? (mod as unknown as typeof Leaflet)
      if (dead || !box.current) return
      L.current = lf
      const start = value ?? center ?? STUDIO_COORDS
      const m = lf.map(box.current, { zoomControl: false, scrollWheelZoom: false, attributionControl: true }).setView([start.lat, start.lng], value ? 16 : 12)
      lf.control.zoom({ position: 'bottomright' }).addTo(m)
      layer.current = lf.tileLayer(TILES.map.url, { attribution: TILES.map.attribution, maxZoom: 19, subdomains: 'abcd' }).addTo(m)
      m.on('click', e => pickRef.current({ lat: roundCoord(e.latlng.lat), lng: roundCoord(e.latlng.lng) }))
      // Wheel zoom only once the map has been clicked, so scrolling the page never gets caught.
      m.on('focus click', () => m.scrollWheelZoom.enable())
      m.on('blur mouseout', () => m.scrollWheelZoom.disable())
      map.current = m
      if (value) place(value)
      setReady(true)
    })
    return () => {
      dead = true
      map.current?.remove()
      map.current = null
      marker.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Follow the pin when it changes from outside (search pick, "use my location").
  useEffect(() => {
    const m = map.current
    if (!ready || !m) return
    if (value) {
      place(value)
      if (!m.getBounds().pad(-0.2).contains([value.lat, value.lng])) m.flyTo([value.lat, value.lng], Math.max(m.getZoom(), 16), { duration: 0.8 })
    } else if (marker.current) {
      marker.current.remove()
      marker.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.lat, value?.lng, ready])

  // No pin yet and the district changed: look there instead.
  useEffect(() => {
    if (ready && !value && center) map.current?.setView([center.lat, center.lng], 12)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center?.lat, center?.lng, ready])

  useEffect(() => {
    const lf = L.current
    const m = map.current
    if (!ready || !lf || !m) return
    layer.current?.remove()
    const tl = TILES[mode]
    layer.current = lf.tileLayer(tl.url, { attribution: tl.attribution, maxZoom: 19, ...(mode === 'map' ? { subdomains: 'abcd' } : {}) }).addTo(m)
  }, [mode, ready])

  const pinCentre = () => {
    const c = map.current?.getCenter()
    if (c) onPick({ lat: roundCoord(c.lat), lng: roundCoord(c.lng) })
  }

  return (
    <div className={`relative isolate overflow-hidden rounded-[22px] border hairline bg-ink/[0.04] ${className}`}>
      <MapGate>
        <div ref={box} role="application" aria-label={label} className="absolute inset-0 z-0" data-lenis-prevent />
      </MapGate>
      {/* Crosshair for "pin the centre" */}
      {!value && <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 z-[500] h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ruby/70 bg-ruby/10" />}
      <div className="pointer-events-none absolute inset-x-3 top-3 z-[500] flex items-start justify-between gap-2">
        <p className="glass rounded-full px-3 py-1.5 text-[12px] font-medium text-ink/75 max-sm:hidden">{t.hint}</p>
        <div className="glass pointer-events-auto ml-auto flex rounded-full p-0.5" role="group">
          {(['map', 'satellite'] as const).map(k => (
            <button
              key={k}
              type="button"
              aria-pressed={mode === k}
              onClick={() => setMode(k)}
              className={`h-8 rounded-full px-3 text-[12px] font-medium transition-colors cursor-pointer ${mode === k ? 'bg-ink text-white' : 'text-ink/70 hover:text-ink'}`}
            >
              {t[k]}
            </button>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={pinCentre}
        className="glass absolute bottom-3 left-3 z-[500] inline-flex h-10 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-medium text-ink/80 transition hover:text-ruby cursor-pointer"
      >
        <Icon name="mapPin" size={14} className="text-ruby" />
        {t.dropHere}
      </button>
      <p className="sr-only" lang={lang}>{t.hint}</p>
    </div>
  )
}
