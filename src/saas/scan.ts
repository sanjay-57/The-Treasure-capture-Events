import type { Asset, AssetKind, Drive, Scan } from './types'
import { idbAll, idbDeleteWhere, idbPutMany, idbDel } from './blobs'
import { BMFF_EXT, blobReader, readVideoMeta } from './meta'

/**
 * Storage devices manager: reads a photographer's drive in the browser and
 * keeps METADATA only (names, sizes, dates, EXIF, a fingerprint). File
 * contents never leave the machine.
 *
 * Two readers:
 *  - File System Access (`showDirectoryPicker`, Chrome / Edge desktop). Can
 *    write a `.tce-drive.json` marker so the drive is recognised next time.
 *  - `<input webkitdirectory>` (Firefox, Safari). Read-only: the user says
 *    which drive it is.
 *
 * The top half of this file is pure (unit-tested); the bottom half touches the
 * browser and IndexedDB.
 */

// ─── Kinds and paths ─────────────────────────────────────────────────────────

export const RAW_EXT = new Set(['cr2', 'cr3', 'nef', 'nrw', 'arw', 'srf', 'sr2', 'dng', 'raf', 'orf', 'rw2', 'pef', 'srw', '3fr', 'iiq', 'x3f'])
export const PHOTO_EXT = new Set(['jpg', 'jpeg', 'heic', 'heif', 'png', 'tif', 'tiff', 'webp'])
export const VIDEO_EXT = new Set(['mp4', 'mov', 'm4v', 'avi', 'mts', 'm2ts', 'mkv', 'mxf', '3gp'])

export function kindOf(ext: string): AssetKind {
  const e = ext.toLowerCase().replace(/^\./, '')
  if (RAW_EXT.has(e)) return 'raw'
  if (PHOTO_EXT.has(e)) return 'photo'
  if (VIDEO_EXT.has(e)) return 'video'
  return 'other'
}

/** "DSC_4821.NEF" → { filename: "DSC_4821", ext: "NEF" }. Dotfiles and no-dot names keep ext "". */
export function splitName(name: string): { filename: string; ext: string } {
  const i = name.lastIndexOf('.')
  if (i <= 0 || i === name.length - 1) return { filename: name, ext: '' }
  return { filename: name.slice(0, i), ext: name.slice(i + 1) }
}

export const MARKER_FILE = '.tce-drive.json'

const SKIP_DIRS = new Set(['.spotlight-v100', '.trashes', '.fseventsd', '.temporaryitems', '.documentrevisions-v100', 'system volume information', '$recycle.bin', 'recycler', '.trash', 'lost+found'])
const SKIP_FILES = new Set(['thumbs.db', 'desktop.ini', '.ds_store', MARKER_FILE])

/** Hidden and system folders the walk never enters. */
export const skipDir = (name: string) => name.startsWith('.') || SKIP_DIRS.has(name.toLowerCase())
/** OS litter (AppleDouble `._x`, .DS_Store, Thumbs.db) and our own marker. */
export const skipFile = (name: string) => name.startsWith('._') || SKIP_FILES.has(name.toLowerCase()) || (name.startsWith('.') && name.length < 3)

/** True when any folder on the path is hidden or system (used for the FileList reader). */
export const pathSkipped = (path: string) => {
  const parts = path.split('/')
  return parts.slice(0, -1).some(skipDir) || skipFile(parts[parts.length - 1])
}

/** Directory part of a path: "2026/Sharma/RAW/a.NEF" → "2026/Sharma/RAW"; root files → "". */
export const dirOf = (path: string) => {
  const i = path.lastIndexOf('/')
  return i < 0 ? '' : path.slice(0, i)
}

/** Event folder guess: first path segment, or the second when the first is a year ("2026/Sharma wedding/…"). */
export function folderOf(path: string): string | undefined {
  const parts = path.split('/').filter(Boolean)
  if (parts.length < 2) return undefined
  if (/^(19|20)\d{2}$/.test(parts[0]) && parts.length >= 3) return `${parts[0]}/${parts[1]}`
  return parts[0]
}

/** Stable id so a rescan overwrites the same IndexedDB record. */
export const assetId = (driveId: string, path: string) => `${driveId}:${path}`

/** One file as pass 1 sees it. */
export interface Entry {
  path: string
  bytes: number
  /** ms since epoch */
  modified: number
}

/**
 * Stored shape. `metaAt` marks pass 2 (EXIF / header / fingerprint) as done
 * for this version of the file; it is local to the scanner and not part of
 * the shared Asset type.
 */
export type StoredAsset = Asset & { metaAt?: string }

export function toAsset(driveId: string, e: Entry): StoredAsset {
  const name = e.path.slice(e.path.lastIndexOf('/') + 1)
  const { filename, ext } = splitName(name)
  return {
    id: assetId(driveId, e.path),
    driveId,
    path: e.path,
    filename,
    ext,
    kind: kindOf(ext),
    bytes: e.bytes,
    modifiedAt: new Date(e.modified || 0).toISOString(),
    folder: folderOf(e.path),
  }
}

// ─── Diff ────────────────────────────────────────────────────────────────────

export interface Diff {
  added: StoredAsset[]
  removed: StoredAsset[]
  changed: StoredAsset[]
  /** Previous records, metadata intact. */
  unchanged: StoredAsset[]
}

/**
 * Compares a fresh walk (`next`, pass-1 fields only) with what was stored.
 * Same path + same size + same mtime = unchanged (keeps EXIF and fingerprint);
 * a different size or mtime = changed (metadata dropped, pass 2 redoes it).
 */
export function diffAssets(prev: StoredAsset[], next: StoredAsset[]): Diff {
  const old = new Map(prev.map(a => [a.path, a]))
  const out: Diff = { added: [], removed: [], changed: [], unchanged: [] }
  const seen = new Set<string>()
  for (const n of next) {
    seen.add(n.path)
    const o = old.get(n.path)
    if (!o) out.added.push(n)
    else if (o.bytes !== n.bytes || o.modifiedAt !== n.modifiedAt) out.changed.push(n)
    else out.unchanged.push(o)
  }
  for (const o of prev) if (!seen.has(o.path)) out.removed.push(o)
  return out
}

export interface DriveCounts {
  fileCount: number
  photoCount: number
  videoCount: number
  rawCount: number
  usedBytes: number
}

export function countsOf(assets: Asset[]): DriveCounts {
  const c: DriveCounts = { fileCount: 0, photoCount: 0, videoCount: 0, rawCount: 0, usedBytes: 0 }
  for (const a of assets) {
    c.fileCount++
    c.usedBytes += a.bytes
    if (a.kind === 'photo') c.photoCount++
    else if (a.kind === 'raw') c.rawCount++
    else if (a.kind === 'video') c.videoCount++
  }
  return c
}

// ─── Derived views ───────────────────────────────────────────────────────────

export const dateOf = (a: Asset) => a.takenAt || a.modifiedAt

export interface DetectedEvent {
  folder: string
  files: number
  photos: number
  raws: number
  videos: number
  bytes: number
  /** Earliest / latest takenAt || modifiedAt, ISO. */
  from: string
  to: string
}

/** Groups assets by their guessed event folder, newest first. Folders with no photo, raw or video are left out. */
export function eventsFromAssets(assets: Asset[]): DetectedEvent[] {
  const m = new Map<string, DetectedEvent>()
  for (const a of assets) {
    if (!a.folder) continue
    let e = m.get(a.folder)
    const d = dateOf(a)
    if (!e) m.set(a.folder, (e = { folder: a.folder, files: 0, photos: 0, raws: 0, videos: 0, bytes: 0, from: '', to: '' }))
    e.files++
    e.bytes += a.bytes
    if (a.kind === 'photo') e.photos++
    else if (a.kind === 'raw') e.raws++
    else if (a.kind === 'video') e.videos++
    // Media dates only: a sidecar edited last week should not stretch the range.
    if (a.kind !== 'other') {
      if (!e.from || d < e.from) e.from = d
      if (!e.to || d > e.to) e.to = d
    }
  }
  return [...m.values()].filter(e => e.photos + e.raws + e.videos > 0).sort((a, b) => (a.to < b.to ? 1 : a.to > b.to ? -1 : a.folder.localeCompare(b.folder)))
}

/** Groups of 2+ assets sharing a fingerprint (same file on this or another drive), biggest first. */
export function duplicatesByFingerprint(assets: Asset[]): Asset[][] {
  const m = new Map<string, Asset[]>()
  for (const a of assets) {
    if (!a.fingerprint) continue
    const g = m.get(a.fingerprint)
    if (g) g.push(a)
    else m.set(a.fingerprint, [a])
  }
  return [...m.values()].filter(g => g.length > 1).sort((a, b) => b[0].bytes * b.length - a[0].bytes * a.length)
}

export interface TreeNode {
  name: string
  path: string
  files: number
  bytes: number
  children: TreeNode[]
}

/** Folder tree with recursive file counts and sizes; children sorted by name. */
export function folderTree(assets: Asset[]): TreeNode {
  const root: TreeNode = { name: '', path: '', files: 0, bytes: 0, children: [] }
  const index = new Map<string, TreeNode>([['', root]])
  const nodeFor = (dir: string): TreeNode => {
    const hit = index.get(dir)
    if (hit) return hit
    const parent = nodeFor(dirOf(dir))
    const n: TreeNode = { name: dir.slice(dir.lastIndexOf('/') + 1), path: dir, files: 0, bytes: 0, children: [] }
    parent.children.push(n)
    index.set(dir, n)
    return n
  }
  for (const a of assets) {
    let n: TreeNode | undefined = nodeFor(dirOf(a.path))
    // Walk up adding to every ancestor.
    for (let dir = n.path; ; dir = dirOf(dir)) {
      n = index.get(dir)!
      n.files++
      n.bytes += a.bytes
      if (dir === '') break
    }
  }
  const sort = (n: TreeNode) => {
    n.children.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    n.children.forEach(sort)
  }
  sort(root)
  return root
}

// ─── Search ──────────────────────────────────────────────────────────────────

export interface AssetQuery {
  text?: string
  folder?: string
  /** yyyy-mm-dd, inclusive, on takenAt || modifiedAt */
  from?: string
  to?: string
  camera?: string
  kind?: AssetKind | 'all'
}

export function matchesQuery(a: Asset, q: AssetQuery): boolean {
  if (q.kind && q.kind !== 'all' && a.kind !== q.kind) return false
  const text = q.text?.trim().toLowerCase()
  if (text && !`${a.filename}.${a.ext}`.toLowerCase().includes(text) && !a.path.toLowerCase().includes(text)) return false
  const folder = q.folder?.trim().toLowerCase()
  if (folder && !dirOf(a.path).toLowerCase().includes(folder)) return false
  const cam = q.camera?.trim().toLowerCase()
  if (cam && !(a.camera ?? '').toLowerCase().includes(cam)) return false
  const d = dateOf(a).slice(0, 10)
  if (q.from && d < q.from) return false
  if (q.to && d > q.to) return false
  return true
}

/** Filters, sorts by path and caps. `total` is the uncapped match count. */
export function searchAssets<T extends Asset>(assets: T[], q: AssetQuery, cap = 500): { rows: T[]; total: number } {
  const rows: T[] = []
  let total = 0
  for (const a of assets) {
    if (!matchesQuery(a, q)) continue
    total++
    if (rows.length < cap) rows.push(a)
  }
  rows.sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true }))
  return { rows, total }
}

const csvCell = (v: string | number | undefined) => {
  const s = v === undefined ? '' : String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function assetsCsv(rows: Asset[], driveOf: (id: string) => Pick<Drive, 'label' | 'kept'> | undefined): string {
  const head = ['drive', 'kept', 'path', 'filename', 'ext', 'kind', 'bytes', 'modified', 'taken', 'camera', 'serial', 'lens', 'width', 'height', 'duration_sec', 'codec', 'fingerprint']
  const lines = rows.map(a => {
    const d = driveOf(a.driveId)
    return [d?.label, d?.kept, a.path, a.filename, a.ext, a.kind, a.bytes, a.modifiedAt, a.takenAt, a.camera, a.serial, a.lens, a.w, a.h, a.durationSec, a.codec, a.fingerprint].map(csvCell).join(',')
  })
  return [head.join(','), ...lines].join('\n')
}

// ─── Selection locator ───────────────────────────────────────────────────────

const KIND_RANK: Record<AssetKind, number> = { raw: 0, photo: 1, video: 2, other: 3 }
export const nameKey = (s: string) => s.trim().toLowerCase()

export interface Location {
  driveId: string
  dir: string
  count: number
}

export interface SelectionMatch {
  /** Chosen copy per requested name (lower-cased key). */
  best: Map<string, Asset>
  /** Requested names with no asset anywhere, original spelling, de-duplicated. */
  missing: string[]
  /** Where the chosen copies live, most first. */
  locations: Location[]
  /** Per other drive: how many requested names also have a copy there (backups). */
  alsoOn: { driveId: string; count: number }[]
}

/**
 * Matches selected proof filenames (no extension) against drive assets,
 * case-insensitively. Prefers RAW, then photo; among equal kinds it picks the
 * folder holding the most matches so the summary reads "all 28 are in X".
 * `retired` drives are only used when nothing else has the file.
 */
export function matchSelection(filenames: string[], assets: Asset[], retired: Set<string> = new Set()): SelectionMatch {
  const wanted = new Map<string, string>()
  for (const f of filenames) if (f.trim() && !wanted.has(nameKey(f))) wanted.set(nameKey(f), f.trim())
  const cands = new Map<string, Asset[]>()
  for (const a of assets) {
    const k = nameKey(a.filename)
    if (!wanted.has(k)) continue
    const g = cands.get(k)
    if (g) g.push(a)
    else cands.set(k, [a])
  }
  const rank = (a: Asset) => (retired.has(a.driveId) ? 10 : 0) + KIND_RANK[a.kind]
  const locKey = (a: Asset) => `${a.driveId}\u0000${dirOf(a.path)}`
  // How many names each location could serve at its best rank.
  const pool = new Map<string, number>()
  for (const g of cands.values()) {
    const top = Math.min(...g.map(rank))
    for (const k of new Set(g.filter(a => rank(a) === top).map(locKey))) pool.set(k, (pool.get(k) ?? 0) + 1)
  }
  const best = new Map<string, Asset>()
  const locs = new Map<string, Location>()
  const backups = new Map<string, Set<string>>()
  for (const [k, g] of cands) {
    const top = Math.min(...g.map(rank))
    const pickA = g.filter(a => rank(a) === top).sort((a, b) => (pool.get(locKey(b)) ?? 0) - (pool.get(locKey(a)) ?? 0) || a.path.localeCompare(b.path))[0]
    best.set(k, pickA)
    const lk = locKey(pickA)
    const l = locs.get(lk)
    if (l) l.count++
    else locs.set(lk, { driveId: pickA.driveId, dir: dirOf(pickA.path), count: 1 })
    for (const a of g) {
      if (a.driveId === pickA.driveId) continue
      const s = backups.get(a.driveId) ?? new Set<string>()
      s.add(k)
      backups.set(a.driveId, s)
    }
  }
  return {
    best,
    missing: [...wanted].filter(([k]) => !cands.has(k)).map(([, v]) => v),
    locations: [...locs.values()].sort((a, b) => b.count - a.count || a.dir.localeCompare(b.dir)),
    alsoOn: [...backups].map(([driveId, s]) => ({ driveId, count: s.size })).sort((a, b) => b.count - a.count),
  }
}

// ─── EXIF mapping ────────────────────────────────────────────────────────────

export interface ExifFields {
  takenAt?: string
  camera?: string
  serial?: string
  lens?: string
  w?: number
  h?: number
}

const str = (v: unknown) => (typeof v === 'string' ? v.replace(/\0/g, '').trim() : typeof v === 'number' ? String(v) : '') || undefined
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.round(v) : undefined)

/** "2026:03:14 10:22:01" (EXIF, camera-local time) or a Date → ISO string. */
export function exifDate(v: unknown): string | undefined {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? undefined : v.toISOString()
  if (typeof v !== 'string') return undefined
  const m = v.match(/^(\d{4})[:-](\d{2})[:-](\d{2})[ T](\d{2}):(\d{2}):(\d{2})/)
  if (!m || m[1] === '0000') return undefined
  const d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6])
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
}

/** "Canon" + "Canon EOS R5" → "Canon EOS R5"; "NIKON CORPORATION" + "NIKON Z 6_2" → "NIKON Z 6_2"; "SONY" + "ILCE-7M4" → "SONY ILCE-7M4". */
export function cameraName(make?: string, model?: string): string | undefined {
  const mk = str(make)
  const md = str(model)
  if (!md) return mk
  if (!mk) return md
  const first = mk.split(/\s+/)[0].toLowerCase()
  return md.toLowerCase().startsWith(first) ? md : `${mk} ${md}`
}

/** Maps an exifr output object (merged, revived) to Asset fields. */
export function exifToFields(t: Record<string, unknown> | null | undefined): ExifFields {
  if (!t) return {}
  const out: ExifFields = {
    takenAt: exifDate(t.DateTimeOriginal) ?? exifDate(t.CreateDate) ?? exifDate(t.DateTimeDigitized),
    camera: cameraName(t.Make as string, t.Model as string),
    serial: str(t.BodySerialNumber) ?? str(t.SerialNumber) ?? str(t.CameraSerialNumber) ?? str(t.InternalSerialNumber),
    lens: str(t.LensModel) ?? str(t.Lens),
    w: num(t.ExifImageWidth) ?? num(t.PixelXDimension) ?? num(t.ImageWidth),
    h: num(t.ExifImageHeight) ?? num(t.PixelYDimension) ?? num(t.ImageHeight),
  }
  for (const k of Object.keys(out) as (keyof ExifFields)[]) if (out[k] === undefined) delete out[k]
  return out
}

// ─── Fingerprint ─────────────────────────────────────────────────────────────

export const FP_BYTES = 1024 * 1024

const hex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('')

/** `${size}-${sha1(first 1 MB)}`. `head` is the first min(size, 1 MB) bytes. */
export async function fingerprintOf(size: number, head: ArrayBuffer | Uint8Array): Promise<string> {
  const data = head instanceof Uint8Array ? head : new Uint8Array(head)
  const slice = data.length > FP_BYTES ? data.subarray(0, FP_BYTES) : data
  return `${size}-${hex(await crypto.subtle.digest('SHA-1', slice as unknown as BufferSource))}`
}

// ════════════════════════════════════════════════════════════════════════════
// Browser half
// ════════════════════════════════════════════════════════════════════════════

/* Minimal File System Access shapes (not in the ES2020 + DOM lib we compile with). */
interface FsHandle {
  kind: 'file' | 'directory'
  name: string
}
export interface FsFileHandle extends FsHandle {
  kind: 'file'
  getFile(): Promise<File>
  createWritable?(): Promise<{ write(data: string | Blob): Promise<void>; close(): Promise<void>; abort?(): Promise<void> }>
}
export interface FsDirHandle extends FsHandle {
  kind: 'directory'
  values(): AsyncIterable<FsFileHandle | FsDirHandle>
  getFileHandle(name: string, opts?: { create?: boolean }): Promise<FsFileHandle>
  getDirectoryHandle?(name: string, opts?: { create?: boolean }): Promise<FsDirHandle>
  queryPermission?(d: { mode: 'read' | 'readwrite' }): Promise<PermissionState>
  requestPermission?(d: { mode: 'read' | 'readwrite' }): Promise<PermissionState>
}
type PickerWindow = Window & { showDirectoryPicker?: (o?: { mode?: 'read' | 'readwrite'; id?: string }) => Promise<FsDirHandle> }

/** Chrome / Edge desktop. Safe to call during prerender. */
export const supportsFsa = () => typeof window !== 'undefined' && typeof (window as PickerWindow).showDirectoryPicker === 'function' && window.isSecureContext

export interface Marker {
  markerId: string
  studioId: string
  label: string
  createdAt: string
}

export const parseMarker = (text: string): Marker | null => {
  try {
    const m = JSON.parse(text) as Partial<Marker>
    return typeof m.markerId === 'string' && m.markerId ? { markerId: m.markerId, studioId: String(m.studioId ?? ''), label: String(m.label ?? ''), createdAt: String(m.createdAt ?? '') } : null
  } catch {
    return null
  }
}

export const newMarkerId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`)

/** A picked folder, from either reader. */
export interface Source {
  reader: 'fsa' | 'input'
  rootName: string
  /** Marker read from the root (FSA only). */
  marker: Marker | null
  /** Whether we hold write permission (FSA readwrite granted). */
  canWrite: boolean
  dir?: FsDirHandle
  files?: File[]
}

/**
 * Opens the folder picker. Resolves null if the user cancels (or refuses the
 * write prompt, which Chrome reports the same way); offer `mode: 'read'` then.
 */
export async function pickFsa(mode: 'read' | 'readwrite' = 'readwrite'): Promise<Source | null> {
  const w = window as PickerWindow
  let dir: FsDirHandle
  try {
    dir = await w.showDirectoryPicker!({ mode, id: 'tce-drive' })
  } catch (e) {
    if ((e as DOMException)?.name === 'AbortError') return null
    throw e
  }
  let canWrite = false
  try {
    canWrite = (await dir.queryPermission?.({ mode: 'readwrite' })) === 'granted'
  } catch {
    canWrite = false
  }
  let marker: Marker | null = null
  try {
    const fh = await dir.getFileHandle(MARKER_FILE)
    marker = parseMarker(await (await fh.getFile()).text())
  } catch {
    marker = null
  }
  return { reader: 'fsa', rootName: dir.name, marker, canWrite, dir }
}

/** Wraps a FileList from `<input webkitdirectory>`. */
export function sourceFromFiles(list: FileList | File[]): Source | null {
  const files = Array.from(list)
  if (!files.length) return null
  const first = (files[0] as File & { webkitRelativePath?: string }).webkitRelativePath || files[0].name
  return { reader: 'input', rootName: first.split('/')[0], marker: null, canWrite: false, files }
}

/** Writes (or rewrites) the marker. Returns false when the browser refuses. */
export async function writeMarker(src: Source, marker: Marker): Promise<boolean> {
  if (src.reader !== 'fsa' || !src.dir) return false
  try {
    if (!src.canWrite && src.dir.requestPermission) src.canWrite = (await src.dir.requestPermission({ mode: 'readwrite' })) === 'granted'
    if (!src.canWrite) return false
    const fh = await src.dir.getFileHandle(MARKER_FILE, { create: true })
    if (!fh.createWritable) return false
    const w = await fh.createWritable()
    await w.write(JSON.stringify(marker, null, 2))
    await w.close()
    src.marker = marker
    return true
  } catch {
    return false
  }
}

const yieldUi = () => new Promise<void>(r => setTimeout(r, 0))

export interface WalkProgress {
  files: number
  bytes: number
  dir: string
}

/** Pass 1 walk. `onBatch` receives entries every ~500 files; File getters are kept for pass 2. */
async function walk(src: Source, signal: AbortSignal, onBatch: (b: Entry[]) => Promise<void>, onProgress: (p: WalkProgress) => void, files: Map<string, () => Promise<File>>) {
  let batch: Entry[] = []
  const prog: WalkProgress = { files: 0, bytes: 0, dir: '' }
  const push = async (e: Entry) => {
    batch.push(e)
    prog.files++
    prog.bytes += e.bytes
    if (batch.length >= 500) {
      const b = batch
      batch = []
      await onBatch(b)
      onProgress({ ...prog })
      await yieldUi()
    }
  }
  if (src.reader === 'input') {
    for (const f of src.files ?? []) {
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
      const rel = (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name
      const path = rel.split('/').slice(1).join('/') || f.name
      if (pathSkipped(path)) continue
      files.set(path, async () => f)
      await push({ path, bytes: f.size, modified: f.lastModified })
    }
  } else if (src.dir) {
    const stack: { dir: FsDirHandle; path: string }[] = [{ dir: src.dir, path: '' }]
    while (stack.length) {
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
      const { dir, path } = stack.pop()!
      prog.dir = path
      onProgress({ ...prog })
      const fileHandles: FsFileHandle[] = []
      const subdirs: { dir: FsDirHandle; path: string }[] = []
      try {
        for await (const h of dir.values()) {
          if (h.kind === 'directory') {
            if (!skipDir(h.name)) subdirs.push({ dir: h, path: path ? `${path}/${h.name}` : h.name })
          } else if (!skipFile(h.name)) fileHandles.push(h)
        }
      } catch {
        continue // unreadable folder (permissions): skip, keep walking
      }
      // getFile() per file is the slow part; run a few at a time.
      for (let i = 0; i < fileHandles.length; i += 16) {
        if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
        const chunk = fileHandles.slice(i, i + 16)
        const got = await Promise.all(chunk.map(h => h.getFile().then(f => ({ h, f }), () => null)))
        for (const g of got) {
          if (!g) continue
          const p = path ? `${path}/${g.h.name}` : g.h.name
          const h = g.h
          files.set(p, () => h.getFile())
          await push({ path: p, bytes: g.f.size, modified: g.f.lastModified })
        }
      }
      // Reverse so the walk visits folders in name order.
      subdirs.sort((a, b) => b.path.localeCompare(a.path))
      stack.push(...subdirs)
    }
  }
  if (batch.length) await onBatch(batch)
  onProgress({ ...prog })
}

// ─── Partial-progress note (localStorage) ────────────────────────────────────

export interface ScanNote {
  driveId: string
  phase: 'walk' | 'meta'
  startedAt: string
  files: number
}

const NOTE_KEY = (driveId: string) => `tce-scan:${driveId}`
export const readScanNote = (driveId: string): ScanNote | null => {
  try {
    const s = typeof localStorage !== 'undefined' ? localStorage.getItem(NOTE_KEY(driveId)) : null
    return s ? (JSON.parse(s) as ScanNote) : null
  } catch {
    return null
  }
}
const writeScanNote = (n: ScanNote | null, driveId: string) => {
  try {
    if (n) localStorage.setItem(NOTE_KEY(driveId), JSON.stringify(n))
    else localStorage.removeItem(NOTE_KEY(driveId))
  } catch {
    /* private mode */
  }
}

// ─── Pass 1 ──────────────────────────────────────────────────────────────────

export interface Pass1Result {
  diff: Diff
  /** All current assets after the walk. */
  assets: StoredAsset[]
  counts: DriveCounts
  scan: Scan
  /** path → File getter, for pass 2 in the same session. */
  files: Map<string, () => Promise<File>>
}

/**
 * Walks the drive, diffs against the stored assets, writes new and changed
 * records in batches of 500 as it goes (so a closed tab keeps what was read),
 * then deletes removed ones. Store updates are the caller's (recordScan /
 * updateDrive), so this file stays free of the Zustand store.
 */
export async function runPass1(src: Source, driveId: string, opts: { signal: AbortSignal; onProgress: (p: WalkProgress) => void; scanId: string }): Promise<Pass1Result> {
  const t0 = Date.now()
  const prev = await idbAll<StoredAsset>('assets', 'driveId', driveId)
  const old = new Map(prev.map(a => [a.path, a]))
  const files = new Map<string, () => Promise<File>>()
  const fresh: StoredAsset[] = []
  const note: ScanNote = { driveId, phase: 'walk', startedAt: new Date().toISOString(), files: 0 }
  writeScanNote(note, driveId)
  await walk(
    src,
    opts.signal,
    async batch => {
      const toWrite: StoredAsset[] = []
      for (const e of batch) {
        const a = toAsset(driveId, e)
        fresh.push(a)
        const o = old.get(a.path)
        if (!o || o.bytes !== a.bytes || o.modifiedAt !== a.modifiedAt) toWrite.push(a)
      }
      if (toWrite.length) await idbPutMany('assets', toWrite)
      note.files = fresh.length
      writeScanNote(note, driveId)
    },
    opts.onProgress,
    files,
  )
  const diff = diffAssets(prev, fresh)
  for (let i = 0; i < diff.removed.length; i += 500) {
    await Promise.all(diff.removed.slice(i, i + 500).map(a => idbDel('assets', a.id)))
  }
  const assets = [...diff.unchanged, ...diff.added, ...diff.changed]
  writeScanNote({ ...note, phase: 'meta' }, driveId)
  return {
    diff,
    assets,
    counts: countsOf(assets),
    files,
    scan: { id: opts.scanId, driveId, at: new Date().toISOString(), added: diff.added.length, removed: diff.removed.length, changed: diff.changed.length, durationSec: Math.round((Date.now() - t0) / 1000) },
  }
}

export const clearScanNote = (driveId: string) => writeScanNote(null, driveId)

// ─── Pass 2 ──────────────────────────────────────────────────────────────────

export interface Pass2Progress {
  done: number
  total: number
  /** Verify mode: files whose content fingerprint no longer matches. */
  mismatched: number
}

/** Media files that still need pass 2 (or all media in verify mode). */
export const needsMeta = (a: StoredAsset, verify = false) => a.kind !== 'other' && (verify || !a.metaAt)

export class Pass2 {
  private paused = false
  private stopped = false
  private wake: (() => void) | null = null
  readonly progress: Pass2Progress
  readonly mismatchedPaths: string[] = []

  constructor(
    private queue: StoredAsset[],
    private files: Map<string, () => Promise<File>>,
    private opts: { verify?: boolean; fingerprints?: boolean; concurrency?: number; onProgress: (p: Pass2Progress) => void },
  ) {
    this.progress = { done: 0, total: queue.length, mismatched: 0 }
  }

  pause() {
    this.paused = true
  }
  resume() {
    this.paused = false
    this.wake?.()
    this.wake = null
  }
  stop() {
    this.stopped = true
    this.resume()
  }
  get isPaused() {
    return this.paused
  }

  private async gate() {
    while (this.paused && !this.stopped) await new Promise<void>(r => (this.wake = r))
  }

  /** Runs to the end (or stop). Returns the updated assets. */
  async run(): Promise<StoredAsset[]> {
    const out: StoredAsset[] = []
    let pending: StoredAsset[] = []
    let next = 0
    const flush = async () => {
      if (!pending.length) return
      const b = pending
      pending = []
      await idbPutMany('assets', b)
    }
    const exifr = await import('exifr').then(m => m.default).catch(() => null)
    const worker = async () => {
      while (!this.stopped) {
        await this.gate()
        if (this.stopped) break
        const i = next++
        if (i >= this.queue.length) break
        const a = this.queue[i]
        const updated = await this.one(a, exifr)
        if (updated) {
          out.push(updated)
          pending.push(updated)
          if (pending.length >= 500) await flush()
        }
        this.progress.done++
        if (this.progress.done % 8 === 0 || this.progress.done === this.progress.total) {
          this.opts.onProgress({ ...this.progress })
          await yieldUi()
        }
      }
    }
    await Promise.all(Array.from({ length: this.opts.concurrency ?? 4 }, worker))
    await flush()
    this.opts.onProgress({ ...this.progress })
    return out
  }

  private async one(a: StoredAsset, exifr: { parse: (f: Blob, o: object) => Promise<unknown> } | null): Promise<StoredAsset | null> {
    const get = this.files.get(a.path)
    if (!get) return null
    let file: File
    try {
      file = await get()
    } catch {
      return null
    }
    const next: StoredAsset = { ...a, metaAt: new Date().toISOString() }
    if ((a.kind === 'photo' || a.kind === 'raw') && exifr) {
      try {
        const tags = (await exifr.parse(file, { tiff: true, exif: true, ifd0: true, ifd1: false, gps: false, interop: false, xmp: false, icc: false, iptc: false, jfif: false, ihdr: true, makerNote: false, userComment: false, mergeOutput: true, reviveValues: true })) as Record<string, unknown> | undefined
        Object.assign(next, exifToFields(tags))
      } catch {
        /* CR3, RAF, RW2, X3F and damaged files: exifr can't read them; keep pass-1 fields */
      }
    } else if (a.kind === 'video' && BMFF_EXT.has(a.ext.toLowerCase())) {
      try {
        const m = await readVideoMeta(blobReader(file), file.size)
        if (m) {
          if (m.durationSec) next.durationSec = m.durationSec
          if (m.w) next.w = m.w
          if (m.h) next.h = m.h
          if (m.codec) next.codec = m.codec
        }
      } catch {
        /* unreadable header */
      }
    }
    if (this.opts.fingerprints !== false || this.opts.verify) {
      try {
        const fp = await fingerprintOf(file.size, await file.slice(0, FP_BYTES).arrayBuffer())
        if (this.opts.verify && a.fingerprint && a.fingerprint !== fp) {
          this.progress.mismatched++
          this.mismatchedPaths.push(a.path)
        }
        next.fingerprint = fp
      } catch {
        /* read error */
      }
    }
    return next
  }
}

/** Removes every asset of a drive (used when the drive is deleted). */
export async function deleteDriveAssets(driveId: string) {
  await idbDeleteWhere('assets', 'driveId', driveId)
  clearScanNote(driveId)
}
