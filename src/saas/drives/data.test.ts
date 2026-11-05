import { describe, expect, it } from 'vitest'
import { capacityText, isStale, parseCapacity, SIX_MONTHS_MS } from './data'
import type { Drive } from '../types'

describe('capacity input', () => {
  it('parses common forms', () => {
    expect(parseCapacity('2 TB')).toBe(2e12)
    expect(parseCapacity('500gb')).toBe(5e11)
    expect(parseCapacity('1.5t')).toBe(1.5e12)
    expect(parseCapacity('931')).toBe(931e9)
    expect(parseCapacity('')).toBeUndefined()
    expect(parseCapacity('lots')).toBeNull()
  })
  it('round-trips', () => {
    expect(parseCapacity(capacityText(2e12))).toBe(2e12)
    expect(capacityText(5e11)).toBe('500 GB')
  })
})

describe('isStale', () => {
  const d = (over: Partial<Drive>): Drive => ({ id: 'd', studioId: 's', label: 'A', markerId: 'm', usedBytes: 0, kept: '', notes: '', fileCount: 0, photoCount: 0, videoCount: 0, rawCount: 0, status: 'ok', createdAt: '', ...over })
  it('flags drives not scanned for six months', () => {
    const now = Date.now()
    expect(isStale(d({}), now)).toBe(true)
    expect(isStale(d({ lastScanAt: new Date(now - SIX_MONTHS_MS - 1000).toISOString() }), now)).toBe(true)
    expect(isStale(d({ lastScanAt: new Date(now - 86_400_000).toISOString() }), now)).toBe(false)
    expect(isStale(d({ status: 'retired' }), now)).toBe(false)
  })
})
