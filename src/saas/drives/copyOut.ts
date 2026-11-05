import { dirOf, nameKey, type FsDirHandle, type FsFileHandle, type SelectionMatch } from '../scan'
import type { Asset } from '../types'

/**
 * "Copy chosen RAWs to a folder": the originals a client picked, copied from a
 * scanned drive into a new folder (Chrome / Edge desktop, File System Access).
 * Lightroom / Camera Raw sidecars (`NAME.xmp` next to the RAW) travel along.
 */

export interface CopyItem {
  /** Path from the drive root, as scanned. */
  path: string
  /** File name inside the destination folder. */
  name: string
  bytes: number
}

export interface CopyGroup {
  driveId: string
  items: CopyItem[]
  /** Chosen originals in this group, sidecars not counted. */
  files: number
  bytes: number
}

const baseName = (path: string) => path.slice(path.lastIndexOf('/') + 1)

/** One group per drive, most files first. Destination names never collide. */
export function copyPlan(m: SelectionMatch, assets: Asset[]): CopyGroup[] {
  const sideKey = (driveId: string, dir: string, stem: string) => `${driveId}\u0000${dir}\u0000${nameKey(stem)}`
  const sidecars = new Map<string, Asset>()
  for (const a of assets) if (a.ext.toLowerCase() === 'xmp') sidecars.set(sideKey(a.driveId, dirOf(a.path), a.filename), a)

  const groups = new Map<string, CopyGroup>()
  const used = new Map<string, Set<string>>()
  const add = (g: CopyGroup, a: Asset) => {
    const taken = used.get(g.driveId) ?? new Set<string>()
    used.set(g.driveId, taken)
    let name = baseName(a.path)
    const dot = name.lastIndexOf('.')
    for (let i = 2; taken.has(name.toLowerCase()); i++) name = dot > 0 ? `${baseName(a.path).slice(0, dot)} (${i})${baseName(a.path).slice(dot)}` : `${baseName(a.path)} (${i})`
    taken.add(name.toLowerCase())
    g.items.push({ path: a.path, name, bytes: a.bytes })
    g.bytes += a.bytes
  }
  const best = [...m.best.values()].sort((a, b) => a.path.localeCompare(b.path))
  for (const a of best) {
    let g = groups.get(a.driveId)
    if (!g) groups.set(a.driveId, (g = { driveId: a.driveId, items: [], files: 0, bytes: 0 }))
    add(g, a)
    g.files++
    const side = a.kind === 'raw' ? sidecars.get(sideKey(a.driveId, dirOf(a.path), a.filename)) : undefined
    if (side) add(g, side)
  }
  return [...groups.values()].sort((a, b) => b.files - a.files || a.driveId.localeCompare(b.driveId))
}

export type CopyFailure = 'missing' | 'full' | 'error'

export interface CopyResult {
  copied: number
  /** Already in the destination with the same size (a re-run). */
  skipped: number
  failed: { path: string; reason: CopyFailure }[]
  stopped: boolean
}

const errName = (e: unknown) => (e as DOMException | undefined)?.name ?? ''

/** Walks a scanned path from the drive root. Throws NotFoundError when it's gone. */
export async function resolveFile(root: FsDirHandle, path: string): Promise<File> {
  const parts = path.split('/').filter(Boolean)
  let dir = root
  for (const seg of parts.slice(0, -1)) {
    if (!dir.getDirectoryHandle) throw new DOMException('No directory access', 'NotSupportedError')
    dir = await dir.getDirectoryHandle(seg)
  }
  return (await dir.getFileHandle(parts[parts.length - 1])).getFile()
}

/** True when `root` holds the first file of the plan, i.e. the right drive (top folder) was picked. */
export async function looksLikeRoot(root: FsDirHandle, items: CopyItem[]): Promise<boolean> {
  for (const it of items.slice(0, 3)) {
    try {
      await resolveFile(root, it.path)
      return true
    } catch {
      /* try the next one: a single file may have been moved */
    }
  }
  return items.length === 0
}

/**
 * Copies one file at a time (drives are fastest read in order). Skips names
 * already there with the same size, so a re-run after a cable pull resumes.
 * A full destination stops the run; everything left is reported as `full`.
 */
export async function copyFiles(
  root: FsDirHandle,
  dest: FsDirHandle,
  items: CopyItem[],
  opts: { onProgress?: (done: number, bytes: number) => void; signal?: { aborted: boolean } } = {},
): Promise<CopyResult> {
  const r: CopyResult = { copied: 0, skipped: 0, failed: [], stopped: false }
  let bytes = 0
  for (let i = 0; i < items.length; i++) {
    const it = items[i]
    if (opts.signal?.aborted) {
      r.stopped = true
      break
    }
    let file: File
    try {
      file = await resolveFile(root, it.path)
    } catch (e) {
      r.failed.push({ path: it.path, reason: errName(e) === 'NotFoundError' || errName(e) === 'TypeMismatchError' ? 'missing' : 'error' })
      opts.onProgress?.(i + 1, bytes)
      continue
    }
    try {
      const have = await (await dest.getFileHandle(it.name)).getFile()
      if (have.size === file.size) {
        r.skipped++
        bytes += file.size
        opts.onProgress?.(i + 1, bytes)
        continue
      }
    } catch {
      /* not there yet */
    }
    let w: Awaited<ReturnType<NonNullable<FsFileHandle['createWritable']>>> | undefined
    try {
      const fh = await dest.getFileHandle(it.name, { create: true })
      if (!fh.createWritable) throw new DOMException('No write access', 'NotAllowedError')
      w = await fh.createWritable()
      await w.write(file)
      await w.close()
      r.copied++
      bytes += file.size
    } catch (e) {
      await w?.abort?.().catch(() => {})
      if (errName(e) === 'QuotaExceededError') {
        for (const rest of items.slice(i)) r.failed.push({ path: rest.path, reason: 'full' })
        r.stopped = true
        break
      }
      r.failed.push({ path: it.path, reason: 'error' })
    }
    opts.onProgress?.(i + 1, bytes)
  }
  return r
}

type PickerWindow = Window & { showDirectoryPicker?: (o?: { mode?: 'read' | 'readwrite'; id?: string }) => Promise<FsDirHandle> }

/** Folder picker. Resolves null on cancel. */
export async function pickFolder(mode: 'read' | 'readwrite', id: string): Promise<FsDirHandle | null> {
  try {
    return await (window as PickerWindow).showDirectoryPicker!({ mode, id })
  } catch (e) {
    if (errName(e) === 'AbortError') return null
    throw e
  }
}
