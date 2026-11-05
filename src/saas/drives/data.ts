import { useEffect, useState } from 'react'
import { idbAll } from '../blobs'
import type { StoredAsset } from '../scan'
import type { Drive } from '../types'

/**
 * Asset reads for the drive screens. Assets live in IndexedDB (200k+ per
 * drive), so they are loaded per drive on demand and cached in memory until a
 * scan or delete invalidates that drive.
 */

const cache = new Map<string, StoredAsset[]>()
const listeners = new Set<() => void>()

export function invalidateAssets(driveId?: string) {
  if (driveId) cache.delete(driveId)
  else cache.clear()
  listeners.forEach(f => f())
}

async function load(driveId: string): Promise<StoredAsset[]> {
  const hit = cache.get(driveId)
  if (hit) return hit
  const rows = await idbAll<StoredAsset>('assets', 'driveId', driveId)
  cache.set(driveId, rows)
  return rows
}

/** All assets of the given drives, or null while loading. */
export function useDriveAssets(driveIds: string[]): StoredAsset[] | null {
  const key = driveIds.join('|')
  const [tick, setTick] = useState(0)
  const [state, setState] = useState<{ key: string; tick: number; rows: StoredAsset[] } | null>(null)
  useEffect(() => {
    const f = () => setTick(t => t + 1)
    listeners.add(f)
    return () => {
      listeners.delete(f)
    }
  }, [])
  useEffect(() => {
    let live = true
    const ids = key ? key.split('|') : []
    Promise.all(ids.map(load))
      .then(parts => live && setState({ key, tick, rows: parts.length === 1 ? parts[0] : parts.flat() }))
      .catch(() => live && setState({ key, tick, rows: [] }))
    return () => {
      live = false
    }
  }, [key, tick])
  return state && state.key === key ? state.rows : null
}

export const SIX_MONTHS_MS = 182 * 86_400_000

/** Not scanned for six months (or never). Retired drives are never stale. */
export const isStale = (d: Drive, now = Date.now()) => d.status !== 'retired' && (!d.lastScanAt || now - new Date(d.lastScanAt).getTime() > SIX_MONTHS_MS)

/** "2 TB", "500gb", "1.5 T", "931" (GB) → bytes (decimal units, as drives are sold). Empty → undefined. */
export function parseCapacity(input: string): number | undefined | null {
  const s = input.trim().toLowerCase().replace(/,/g, '')
  if (!s) return undefined
  const m = s.match(/^(\d+(?:\.\d+)?)\s*(t|tb|g|gb|m|mb)?$/)
  if (!m) return null
  const n = parseFloat(m[1])
  const unit = m[2]?.[0] ?? 'g'
  const mult = unit === 't' ? 1e12 : unit === 'm' ? 1e6 : 1e9
  return n > 0 ? Math.round(n * mult) : null
}

/** Bytes → the short form parseCapacity reads back ("2 TB", "500 GB"). */
export function capacityText(bytes?: number): string {
  if (!bytes) return ''
  if (bytes >= 1e12) return `${+(bytes / 1e12).toFixed(2)} TB`
  return `${+(bytes / 1e9).toFixed(1)} GB`
}

export function downloadText(name: string, text: string, type = 'text/csv') {
  const url = URL.createObjectURL(new Blob(['﻿' + text], { type: `${type};charset=utf-8` }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export const nf = (n: number) => n.toLocaleString('en-IN')
