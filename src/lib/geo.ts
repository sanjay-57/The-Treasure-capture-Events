import { DISTRICTS, type DistrictKey } from './data'

/*
 * Keyless maps fallback (roadmap 6.5): venue search through OpenStreetMap
 * Nominatim and a straight-line travel estimate. When a Google Maps key
 * arrives, Places and Distance Matrix replace these behind the same shapes.
 */

export interface LatLng {
  lat: number
  lng: number
}

/**
 * The studio's pin. Placeholder: central Madurai near West Masi Street, the
 * CMS address. Swap for the real door coordinates when the client sends them.
 */
export const STUDIO_COORDS: LatLng = { lat: 9.9189, lng: 78.1139 }

/** Roads in Tamil Nadu run about 30 % longer than the straight line. */
export const ROAD_FACTOR = 1.3

const EARTH_KM = 6371.0088
const rad = (d: number) => (d * Math.PI) / 180

/** Great-circle distance in km. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** Estimated road km from the studio: straight line × 1.3, whole km, at least 1. */
export function roadKmFromStudio(to: LatLng, from: LatLng = STUDIO_COORDS): number {
  return Math.max(1, Math.round(haversineKm(from, to) * ROAD_FACTOR))
}

export const districtCentre = (key: DistrictKey | ''): LatLng | undefined => DISTRICTS.find(d => d.key === key)?.centre

/** Round to 5 decimals (about a metre), the precision we store pins at. */
export const roundCoord = (n: number) => Math.round(n * 1e5) / 1e5

// ─── Nominatim search ────────────────────────────────────────────────────────

export interface Place {
  id: string
  /** Short name, e.g. "Sri Meenakshi Mahal". */
  name: string
  /** The rest of the display name, e.g. "Anna Nagar, Madurai, Tamil Nadu, 625020, India". */
  address: string
  lat: number
  lng: number
}

const NOMINATIM = 'https://nominatim.openstreetmap.org/search'
/** Half-width of the bias box around the district centre, in degrees (~40 km). */
const BOX = 0.35

export function nominatimUrl(q: string, near: LatLng = STUDIO_COORDS): string {
  const viewbox = [near.lng - BOX, near.lat + BOX, near.lng + BOX, near.lat - BOX].map(n => n.toFixed(4)).join(',')
  const p = new URLSearchParams({ format: 'jsonv2', q, countrycodes: 'in', viewbox, bounded: '0', limit: '6', 'accept-language': 'en' })
  return `${NOMINATIM}?${p}`
}

/** Turns a Nominatim jsonv2 response into places; anything malformed is dropped. */
export function parseNominatim(json: unknown): Place[] {
  if (!Array.isArray(json)) return []
  const out: Place[] = []
  for (const r of json) {
    if (!r || typeof r !== 'object') continue
    const { place_id, lat, lon, display_name, name } = r as Record<string, unknown>
    const la = Number(lat)
    const ln = Number(lon)
    if (typeof display_name !== 'string' || !Number.isFinite(la) || !Number.isFinite(ln)) continue
    const parts = display_name.split(',').map(s => s.trim()).filter(Boolean)
    const short = typeof name === 'string' && name.trim() ? name.trim() : (parts[0] ?? '')
    const rest = parts[0] === short ? parts.slice(1) : parts
    out.push({ id: String(place_id ?? `${la},${ln}`), name: short, address: rest.join(', '), lat: roundCoord(la), lng: roundCoord(ln) })
  }
  return out
}

/** Nominatim's usage policy allows one request per second from a client. */
export const MIN_GAP_MS = 1000
let lastRequestAt = 0

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (ms <= 0) return resolve()
    const id = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => (clearTimeout(id), reject(new DOMException('Aborted', 'AbortError'))), { once: true })
  })

/**
 * Searches for venues near a point. Never throws: a network error, a bad
 * response or an abort gives an empty list, so the manual address field
 * carries on as before.
 */
export async function searchPlaces(q: string, near?: LatLng, signal?: AbortSignal, fetchImpl: typeof fetch = fetch): Promise<Place[]> {
  const text = q.trim()
  if (text.length < 3) return []
  try {
    // Book the next free slot first, so overlapping calls queue a second apart.
    const at = Math.max(Date.now(), lastRequestAt + MIN_GAP_MS)
    lastRequestAt = at
    await wait(at - Date.now(), signal)
    const res = await fetchImpl(nominatimUrl(text, near), { signal, headers: { Accept: 'application/json' } })
    if (!res.ok) return []
    return parseNominatim(await res.json())
  } catch {
    return []
  }
}

// ─── Type-ahead search (Google Places when keyed, Photon otherwise) ─────────

/*
 * Search as you type, like the Google Maps box: every keystroke (debounced by
 * the caller) returns suggestions that match partial words. With
 * VITE_GOOGLE_MAPS_KEY set (Places API (New) enabled, key restricted to our
 * domains) the suggestions are Google's own; without it Photon, a keyless
 * OpenStreetMap type-ahead, stands in and Nominatim backs it up.
 */

export interface Suggestion {
  id: string
  name: string
  address: string
  /** Present for OSM results; Google results get theirs from `resolveSuggestion`. */
  lat?: number
  lng?: number
  googleId?: string
}

const GOOGLE_KEY = (import.meta.env?.VITE_GOOGLE_MAPS_KEY as string | undefined)?.trim() || ''
export const hasGooglePlaces = () => !!GOOGLE_KEY

/** India, as Photon's bbox: minLon, minLat, maxLon, maxLat. */
const INDIA_BBOX = '68,6,98,36'

/** One Google billing session per search, closed by the details call. */
let googleSession = ''
const newSession = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Math.random()).slice(2))

export function parsePhoton(json: unknown): Suggestion[] {
  const feats = (json as { features?: unknown[] } | null)?.features
  if (!Array.isArray(feats)) return []
  const out: Suggestion[] = []
  const seen = new Set<string>()
  for (const f of feats) {
    const g = (f as { geometry?: { coordinates?: unknown[] } }).geometry?.coordinates
    const p = ((f as { properties?: Record<string, unknown> }).properties ?? {}) as Record<string, string | undefined>
    const lng = Number(g?.[0])
    const lat = Number(g?.[1])
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
    const street = [p.housenumber, p.street].filter(Boolean).join(' ')
    const name = p.name || street || p.locality || p.district || p.city || ''
    if (!name) continue
    const address = [street !== name ? street : '', p.locality, p.district, p.city ?? p.county, p.state, p.postcode].filter((x, i, a) => x && x !== name && a.indexOf(x) === i).join(', ')
    const key = `${name}|${address}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ id: `${p.osm_type ?? ''}${p.osm_id ?? key}`, name, address, lat: roundCoord(lat), lng: roundCoord(lng) })
  }
  return out
}

async function googleSuggest(q: string, near: LatLng, signal?: AbortSignal): Promise<Suggestion[]> {
  if (!googleSession) googleSession = newSession()
  const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': GOOGLE_KEY },
    body: JSON.stringify({
      input: q,
      includedRegionCodes: ['in'],
      languageCode: 'en',
      sessionToken: googleSession,
      locationBias: { circle: { center: { latitude: near.lat, longitude: near.lng }, radius: 50000 } },
    }),
  })
  if (!res.ok) throw new Error(`places ${res.status}`)
  const json = (await res.json()) as { suggestions?: { placePrediction?: { placeId: string; text?: { text: string }; structuredFormat?: { mainText?: { text: string }; secondaryText?: { text: string } } } }[] }
  return (json.suggestions ?? []).flatMap(s => {
    const p = s.placePrediction
    if (!p) return []
    const name = p.structuredFormat?.mainText?.text ?? p.text?.text ?? ''
    return name ? [{ id: p.placeId, googleId: p.placeId, name, address: p.structuredFormat?.secondaryText?.text ?? '' }] : []
  })
}

async function photonSuggest(q: string, near: LatLng, signal?: AbortSignal): Promise<Suggestion[]> {
  const p = new URLSearchParams({ q, lat: String(near.lat), lon: String(near.lng), limit: '8', bbox: INDIA_BBOX, location_bias_scale: '0.4' })
  const res = await fetch(`https://photon.komoot.io/api/?${p}`, { signal })
  if (!res.ok) throw new Error(`photon ${res.status}`)
  return parsePhoton(await res.json())
}

/** Suggestions for the text so far. Never throws; an abort or outage gives []. */
export async function suggestPlaces(q: string, near: LatLng = STUDIO_COORDS, signal?: AbortSignal): Promise<Suggestion[]> {
  const text = q.trim()
  if (text.length < 2) return []
  try {
    if (GOOGLE_KEY) return await googleSuggest(text, near, signal)
  } catch (e) {
    if (signal?.aborted) return []
    console.warn('[geo] Google Places failed, falling back to OpenStreetMap', e)
  }
  try {
    const found = await photonSuggest(text, near, signal)
    if (found.length || text.length < 3) return found
  } catch {
    if (signal?.aborted) return []
  }
  return (await searchPlaces(text, near, signal)).map(p => ({ ...p }))
}

/** Coordinates for a suggestion (Google ones need a details call, which also ends the billing session). */
export async function resolveSuggestion(s: Suggestion): Promise<(Suggestion & { lat: number; lng: number }) | null> {
  if (s.lat !== undefined && s.lng !== undefined) return s as Suggestion & { lat: number; lng: number }
  if (!s.googleId || !GOOGLE_KEY) return null
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(s.googleId)}?sessionToken=${googleSession}`, {
      headers: { 'X-Goog-Api-Key': GOOGLE_KEY, 'X-Goog-FieldMask': 'location,formattedAddress,displayName' },
    })
    googleSession = ''
    if (!res.ok) return null
    const j = (await res.json()) as { location?: { latitude: number; longitude: number }; formattedAddress?: string; displayName?: { text: string } }
    if (!j.location) return null
    return { ...s, name: j.displayName?.text || s.name, address: j.formattedAddress || s.address, lat: roundCoord(j.location.latitude), lng: roundCoord(j.location.longitude) }
  } catch {
    return null
  }
}

/** The nearest address to a dropped pin, for filling the address box. Null when nothing useful is near. */
export async function reverseGeocode(ll: LatLng, signal?: AbortSignal): Promise<Suggestion | null> {
  try {
    const res = await fetch(`https://photon.komoot.io/reverse?lat=${ll.lat}&lon=${ll.lng}&limit=1`, { signal })
    if (!res.ok) return null
    return parsePhoton(await res.json())[0] ?? null
  } catch {
    return null
  }
}
