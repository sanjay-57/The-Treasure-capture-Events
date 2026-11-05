import { useEffect, useState } from 'react'
import type { Proof } from './types'

/**
 * Tiny IndexedDB wrapper. Proof previews (≈1 MB each) and drive assets are far
 * too big for localStorage, so they live here. Replaced by B2 signed URLs and
 * Postgres once the server exists; callers only see get/put/del.
 */

const DB = 'ttc-studio'
const VERSION = 1
export type StoreName = 'previews' | 'assets' | 'uploads'

let dbp: Promise<IDBDatabase> | null = null
function db(): Promise<IDBDatabase> {
  if (dbp) return dbp
  dbp = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, VERSION)
    req.onupgradeneeded = () => {
      const d = req.result
      if (!d.objectStoreNames.contains('previews')) d.createObjectStore('previews')
      if (!d.objectStoreNames.contains('uploads')) d.createObjectStore('uploads')
      if (!d.objectStoreNames.contains('assets')) {
        const s = d.createObjectStore('assets', { keyPath: 'id' })
        s.createIndex('driveId', 'driveId')
        s.createIndex('filename', 'filename')
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbp
}

function done(tx: IDBTransaction) {
  return new Promise<void>((res, rej) => {
    tx.oncomplete = () => res()
    tx.onerror = () => rej(tx.error)
    tx.onabort = () => rej(tx.error)
  })
}

export async function idbPut(store: StoreName, value: unknown, key?: IDBValidKey) {
  const tx = (await db()).transaction(store, 'readwrite')
  tx.objectStore(store).put(value, key)
  await done(tx)
}

export async function idbPutMany(store: StoreName, values: unknown[]) {
  const tx = (await db()).transaction(store, 'readwrite')
  const s = tx.objectStore(store)
  for (const v of values) s.put(v)
  await done(tx)
}

export async function idbGet<T>(store: StoreName, key: IDBValidKey): Promise<T | undefined> {
  const tx = (await db()).transaction(store, 'readonly')
  const req = tx.objectStore(store).get(key)
  return new Promise((res, rej) => {
    req.onsuccess = () => res(req.result as T | undefined)
    req.onerror = () => rej(req.error)
  })
}

export async function idbDel(store: StoreName, key: IDBValidKey) {
  const tx = (await db()).transaction(store, 'readwrite')
  tx.objectStore(store).delete(key)
  await done(tx)
}

/** All records in a store, or only those whose index equals `value`. */
export async function idbAll<T>(store: StoreName, index?: string, value?: IDBValidKey): Promise<T[]> {
  const tx = (await db()).transaction(store, 'readonly')
  const s = tx.objectStore(store)
  const req = index ? s.index(index).getAll(value) : s.getAll()
  return new Promise((res, rej) => {
    req.onsuccess = () => res(req.result as T[])
    req.onerror = () => rej(req.error)
  })
}

/** Deletes every record whose index equals `value` (e.g. all assets of a drive). */
export async function idbDeleteWhere(store: StoreName, index: string, value: IDBValidKey) {
  const tx = (await db()).transaction(store, 'readwrite')
  const req = tx.objectStore(store).index(index).openKeyCursor(IDBKeyRange.only(value))
  req.onsuccess = () => {
    const c = req.result
    if (c) {
      tx.objectStore(store).delete(c.primaryKey)
      c.continue()
    }
  }
  await done(tx)
}

// ─── Object URLs for proof previews ──────────────────────────────────────────

const urlCache = new Map<string, string>()

async function blobUrl(key: string): Promise<string | undefined> {
  const hit = urlCache.get(key)
  if (hit) return hit
  const blob = await idbGet<Blob>('previews', key)
  if (!blob) return undefined
  const url = URL.createObjectURL(blob)
  urlCache.set(key, url)
  return url
}

/** Resolves a proof's image source: remote URL if it has one, else the IndexedDB blob. */
export function useProofSrc(proof: Proof | undefined, size: 'thumb' | 'full' = 'full'): string | undefined {
  const remote = proof ? (size === 'thumb' ? proof.thumbUrl ?? proof.url : proof.url) : undefined
  const key = proof ? (size === 'thumb' ? proof.thumbKey ?? proof.previewKey : proof.previewKey) : undefined
  const [src, setSrc] = useState<string | undefined>(remote ?? (key ? urlCache.get(key) : undefined))
  useEffect(() => {
    if (remote) return setSrc(remote)
    if (!key) return setSrc(undefined)
    let live = true
    blobUrl(key).then(u => live && setSrc(u)).catch(() => live && setSrc(undefined))
    return () => {
      live = false
    }
  }, [remote, key])
  return src
}
