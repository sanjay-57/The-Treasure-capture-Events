import { describe, expect, it, vi } from 'vitest'
import { DISTRICTS, TRAVEL_FREE_KM, TRAVEL_PER_KM } from './data'
import { ROAD_FACTOR, STUDIO_COORDS, districtCentre, haversineKm, nominatimUrl, parseNominatim, parsePhoton, roadKmFromStudio, searchPlaces } from './geo'
import { computeQuote, estimateDistanceKm } from './pricing'
import { EMPTY_CART } from './catalogue'

const MADURAI = { lat: 9.9252, lng: 78.1198 }
const DINDIGUL = { lat: 10.3673, lng: 77.9803 }
const TIRUNELVELI = { lat: 8.7139, lng: 77.7567 }

describe('haversine', () => {
  it('is 0 for the same point and symmetric', () => {
    expect(haversineKm(MADURAI, MADURAI)).toBe(0)
    expect(haversineKm(MADURAI, DINDIGUL)).toBeCloseTo(haversineKm(DINDIGUL, MADURAI), 9)
  })

  it('Madurai → Dindigul is about 51 km in a straight line', () => {
    expect(haversineKm(MADURAI, DINDIGUL)).toBeGreaterThan(48)
    expect(haversineKm(MADURAI, DINDIGUL)).toBeLessThan(54)
  })

  it('Madurai → Tirunelveli is about 140 km in a straight line', () => {
    expect(haversineKm(MADURAI, TIRUNELVELI)).toBeGreaterThan(132)
    expect(haversineKm(MADURAI, TIRUNELVELI)).toBeLessThan(146)
  })
})

describe('road estimate', () => {
  it('is the straight line × 1.3, in whole km', () => {
    expect(ROAD_FACTOR).toBe(1.3)
    const km = roadKmFromStudio(DINDIGUL)
    expect(Number.isInteger(km)).toBe(true)
    expect(km).toBe(Math.round(haversineKm(STUDIO_COORDS, DINDIGUL) * 1.3))
    // Real road distance is about 63 km; the estimate lands in that range.
    expect(km).toBeGreaterThan(60)
    expect(km).toBeLessThan(72)
  })

  it('never reports 0 for a real pin', () => {
    expect(roadKmFromStudio(STUDIO_COORDS)).toBe(1)
  })

  it('uses the pin when there is one', () => {
    expect(estimateDistanceKm(TIRUNELVELI, 'madurai')).toBe(roadKmFromStudio(TIRUNELVELI))
  })

  it('falls back to the district centre without a pin', () => {
    expect(estimateDistanceKm(undefined, 'dindigul')).toBe(roadKmFromStudio(districtCentre('dindigul')!))
    expect(estimateDistanceKm(undefined, 'madurai')).toBeLessThan(TRAVEL_FREE_KM)
    expect(estimateDistanceKm(undefined, 'chennai')).toBeGreaterThan(500)
  })

  it('is 0 with neither pin nor district', () => {
    expect(estimateDistanceKm(undefined, '')).toBe(0)
  })

  it('every district has a centre inside Tamil Nadu', () => {
    for (const d of DISTRICTS) {
      expect(d.centre.lat).toBeGreaterThan(8)
      expect(d.centre.lat).toBeLessThan(13.6)
      expect(d.centre.lng).toBeGreaterThan(76.2)
      expect(d.centre.lng).toBeLessThan(80.4)
    }
  })
})

describe('travel charge', () => {
  const travel = (km: number) => computeQuote({ eventType: 'wedding', cart: EMPTY_CART, distanceKm: km })
  const line = (km: number) => travel(km).lines.find(l => l.section === 'travel')

  it('no line at 0 km', () => {
    expect(line(0)).toBeUndefined()
    expect(travel(0).travel).toBe(0)
  })

  it('free up to and including the free radius', () => {
    expect(travel(TRAVEL_FREE_KM).far).toBe(false)
    expect(travel(TRAVEL_FREE_KM).travel).toBe(0)
    expect(line(12)?.detail?.en).toBe('About 12 km by road · within free radius')
  })

  it('per km beyond the radius, rounded to ₹100', () => {
    expect(travel(TRAVEL_FREE_KM + 1).far).toBe(true)
    expect(travel(TRAVEL_FREE_KM + 1).travel).toBe(Math.round(TRAVEL_PER_KM / 100) * 100)
    expect(travel(68).travel).toBe(Math.round(((68 - TRAVEL_FREE_KM) * TRAVEL_PER_KM) / 100) * 100)
    expect(line(68)?.detail?.en).toBe(`About 68 km by road · beyond ${TRAVEL_FREE_KM} km free radius`)
  })

  it('a Dindigul venue without a pin is charged', () => {
    const km = estimateDistanceKm(undefined, 'dindigul')
    expect(travel(km).travel).toBe(Math.round(((km - TRAVEL_FREE_KM) * TRAVEL_PER_KM) / 100) * 100)
  })
})

describe('Nominatim', () => {
  it('builds a search biased to a viewbox around the point', () => {
    const u = new URL(nominatimUrl('Sri Meenakshi Mahal', MADURAI))
    expect(u.origin + u.pathname).toBe('https://nominatim.openstreetmap.org/search')
    expect(u.searchParams.get('q')).toBe('Sri Meenakshi Mahal')
    expect(u.searchParams.get('format')).toBe('jsonv2')
    expect(u.searchParams.get('countrycodes')).toBe('in')
    expect(u.searchParams.get('bounded')).toBe('0')
    expect(u.searchParams.get('limit')).toBe('6')
    const [left, top, right, bottom] = u.searchParams.get('viewbox')!.split(',').map(Number)
    expect(left).toBeLessThan(MADURAI.lng)
    expect(right).toBeGreaterThan(MADURAI.lng)
    expect(top).toBeGreaterThan(MADURAI.lat)
    expect(bottom).toBeLessThan(MADURAI.lat)
  })

  it('parses results and drops malformed ones', () => {
    const places = parseNominatim([
      { place_id: 1, lat: '9.9301234', lon: '78.1012345', name: 'Sri Meenakshi Mahal', display_name: 'Sri Meenakshi Mahal, Anna Nagar, Madurai, Tamil Nadu, India' },
      { place_id: 2, lat: '9.91', lon: '78.12', name: '', display_name: 'Town Hall Road, Madurai, Tamil Nadu, India' },
      { place_id: 3, lat: 'x', lon: '78', display_name: 'Broken' },
      null,
    ])
    expect(places).toEqual([
      { id: '1', name: 'Sri Meenakshi Mahal', address: 'Anna Nagar, Madurai, Tamil Nadu, India', lat: 9.93012, lng: 78.10123 },
      { id: '2', name: 'Town Hall Road', address: 'Madurai, Tamil Nadu, India', lat: 9.91, lng: 78.12 },
    ])
    expect(parseNominatim({ error: 'nope' })).toEqual([])
  })

  it('degrades to an empty list on network errors and bad status', async () => {
    const down = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    expect(await searchPlaces('Anna Nagar', MADURAI, undefined, down)).toEqual([])
    const busy = vi.fn().mockResolvedValue(new Response('', { status: 429 }))
    expect(await searchPlaces('Anna Nagar', MADURAI, undefined, busy)).toEqual([])
  })

  it('skips the network for short queries', async () => {
    const f = vi.fn()
    expect(await searchPlaces('ab', MADURAI, undefined, f)).toEqual([])
    expect(f).not.toHaveBeenCalled()
  })

  it('spaces requests at least a second apart', async () => {
    vi.useFakeTimers()
    try {
      const calls: number[] = []
      const f = vi.fn(async () => (calls.push(Date.now()), new Response('[]')))
      const a = searchPlaces('Anna Nagar', MADURAI, undefined, f)
      const b = searchPlaces('KK Nagar', MADURAI, undefined, f)
      await vi.advanceTimersByTimeAsync(5000)
      await Promise.all([a, b])
      expect(calls).toHaveLength(2)
      expect(calls[1] - calls[0]).toBeGreaterThanOrEqual(1000)
    } finally {
      vi.useRealTimers()
    }
  })

  it('an aborted search resolves empty without fetching', async () => {
    const ctrl = new AbortController()
    const f = vi.fn()
    const p = searchPlaces('Anna Nagar', MADURAI, ctrl.signal, f)
    ctrl.abort()
    expect(await p).toEqual([])
  })
})

describe('Photon type-ahead', () => {
  it('turns features into suggestions, dropping duplicates and junk', () => {
    const f = (name: string, lng: number, lat: number, extra: Record<string, unknown> = {}) => ({ geometry: { coordinates: [lng, lat] }, properties: { osm_type: 'N', osm_id: name.length, name, city: 'Madurai', state: 'Tamil Nadu', ...extra } })
    const out = parsePhoton({ features: [f('Sri Meenakshi Mahal', 78.12345678, 9.92), f('Sri Meenakshi Mahal', 78.12, 9.92), { geometry: { coordinates: [78, 9] }, properties: {} }, { geometry: {}, properties: { name: 'x' } }] })
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ name: 'Sri Meenakshi Mahal', address: 'Madurai, Tamil Nadu', lat: 9.92, lng: 78.12346 })
  })

  it('is empty for anything that is not a feature collection', () => {
    expect(parsePhoton(null)).toEqual([])
    expect(parsePhoton({ features: 'nope' })).toEqual([])
  })
})
