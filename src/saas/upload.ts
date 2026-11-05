import { idbPut } from './blobs'
import { isLan } from '../api/mode'
import { ApiError } from '../api/client'
import { uploadProofFiles } from '../api/upload'
import type { Chapter, Proof } from './types'

/**
 * Browser-side proof preparation and the upload queue rules.
 *
 * Photographers drop RAWs or JPGs. Only a ~1 MB watermarked JPEG proof ever
 * leaves the browser; RAW files are never uploaded (decided 5 Nov 2026, no RAW
 * cloud backup). For a RAW we use the full-size JPEG preview the camera embeds
 * inside it, found by walking JPEG markers properly (see walkJpeg).
 *
 * Everything above the "Browser only" line is pure and unit-tested in node
 * (upload.test.ts). Below it needs createImageBitmap and a canvas.
 */

// ─── File kinds ──────────────────────────────────────────────────────────────

export const RAW_EXTS = ['CR2', 'CR3', 'NEF', 'ARW', 'DNG', 'RAF', 'ORF', 'RW2'] as const
export const JPEG_EXTS = ['JPG', 'JPEG'] as const
export type FileKind = 'raw' | 'jpeg'

export const ACCEPT_ATTR = [...RAW_EXTS, ...JPEG_EXTS].map(e => `.${e.toLowerCase()}`).join(',')

/** "DSC 0001.NEF" → { stem: "DSC 0001", ext: "NEF" }. The stem is the Lightroom link. */
export function splitName(name: string): { stem: string; ext: string } {
  const base = name.split(/[\\/]/).pop() ?? name
  const dot = base.lastIndexOf('.')
  if (dot <= 0) return { stem: base, ext: '' }
  return { stem: base.slice(0, dot), ext: base.slice(dot + 1).toUpperCase() }
}

export function classify(name: string): FileKind | null {
  const { stem, ext } = splitName(name)
  if (stem.startsWith('.')) return null // ._DSC_0001.NEF (macOS resource forks), .DS_Store
  if ((RAW_EXTS as readonly string[]).includes(ext)) return 'raw'
  if ((JPEG_EXTS as readonly string[]).includes(ext)) return 'jpeg'
  return null
}

// ─── Embedded JPEG finder ────────────────────────────────────────────────────

export interface JpegSpan {
  start: number
  /** Exclusive: index just after the EOI marker. */
  end: number
  width: number
  height: number
  /** EXIF orientation inside this JPEG's own APP1, if it carries one. */
  orientation?: number
}

/** Huffman DCT frames (baseline, extended, progressive): what browsers decode. */
const DECODABLE_SOF = new Set([0xc0, 0xc1, 0xc2])
/** All other SOFn: lossless (C3, C7, CB, CF: the RAW data itself in CR2/DNG), hierarchical, arithmetic. */
const isSof = (m: number) => m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc

const u16 = (b: Uint8Array, i: number, le: boolean) => (le ? b[i] | (b[i + 1] << 8) : (b[i] << 8) | b[i + 1])
const u32 = (b: Uint8Array, i: number, le: boolean) =>
  le ? (b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24)) >>> 0 : ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0

/** Orientation (tag 0x0112) from the IFD0 of a TIFF block at [start, end). */
export function tiffOrientation(b: Uint8Array, start: number, end: number): number | undefined {
  if (end - start < 8) return undefined
  const le = b[start] === 0x49 && b[start + 1] === 0x49
  if (!le && !(b[start] === 0x4d && b[start + 1] === 0x4d)) return undefined
  if (u16(b, start + 2, le) !== 42) return undefined
  const ifd = start + u32(b, start + 4, le)
  if (ifd + 2 > end) return undefined
  const count = u16(b, ifd, le)
  for (let k = 0; k < count; k++) {
    const e = ifd + 2 + k * 12
    if (e + 12 > end) return undefined
    if (u16(b, e, le) === 0x0112) {
      const v = u16(b, e + 8, le)
      return v >= 1 && v <= 8 ? v : undefined
    }
  }
  return undefined
}

function app1Orientation(b: Uint8Array, start: number, end: number): number | undefined {
  // "Exif\0\0"
  if (end - start < 14 || b[start] !== 0x45 || b[start + 1] !== 0x78 || b[start + 2] !== 0x69 || b[start + 3] !== 0x66 || b[start + 4] !== 0 || b[start + 5] !== 0) return undefined
  return tiffOrientation(b, start + 6, end)
}

/**
 * Walks one JPEG stream from its SOI at `start` and returns its span, or null
 * if it is not a complete, browser-decodable JPEG. Segment lengths are followed
 * up to each SOS; in entropy-coded data FF 00 (stuffing), FF D0–D7 (restart
 * markers) and FF FF (fill) are skipped, so an FF D9 byte pair can only end
 * the image when it is a real marker. Progressive JPEGs (several scans with
 * DHT between them) are followed scan by scan.
 */
export function walkJpeg(b: Uint8Array, start: number): JpegSpan | null {
  const n = b.length
  if (b[start] !== 0xff || b[start + 1] !== 0xd8) return null
  let i = start + 2
  let width = 0
  let height = 0
  let orientation: number | undefined
  while (i < n) {
    if (b[i] !== 0xff) return null
    while (i < n && b[i] === 0xff) i++
    if (i >= n) return null
    const m = b[i++]
    if (m === 0xd9) return width && height ? { start, end: i, width, height, orientation } : null
    if (m === 0x01 || (m >= 0xd0 && m <= 0xd7)) continue
    if (m === 0xd8 || m === 0x00) return null
    if (i + 1 >= n) return null
    const len = (b[i] << 8) | b[i + 1]
    if (len < 2 || i + len > n) return null
    const body = i + 2
    const segEnd = i + len
    if (isSof(m)) {
      if (!DECODABLE_SOF.has(m) || len < 8) return null
      height = (b[body + 1] << 8) | b[body + 2]
      width = (b[body + 3] << 8) | b[body + 4]
      if (!width || !height) return null
    } else if (m === 0xe1 && orientation === undefined) {
      orientation = app1Orientation(b, body, segEnd)
    }
    if (m === 0xda) {
      if (!width) return null
      let j = segEnd
      for (;;) {
        j = b.indexOf(0xff, j)
        if (j < 0 || j + 1 >= n) return null
        const nx = b[j + 1]
        if (nx === 0xff) j += 1
        else if (nx === 0x00 || (nx >= 0xd0 && nx <= 0xd7)) j += 2
        else break
      }
      i = j
      continue
    }
    i = segEnd
  }
  return null
}

/** Every complete JPEG stream inside a file (RAW previews, thumbnails), in file order. */
export function findEmbeddedJpegs(b: Uint8Array): JpegSpan[] {
  const out: JpegSpan[] = []
  let i = 0
  for (;;) {
    i = b.indexOf(0xff, i)
    if (i < 0 || i + 2 >= b.length) break
    if (b[i + 1] === 0xd8 && b[i + 2] === 0xff) {
      const span = walkJpeg(b, i)
      if (span) {
        out.push(span)
        i = span.end
        continue
      }
    }
    i++
  }
  return out
}

/** Smallest long edge an embedded preview must have to make a usable proof. */
export const MIN_PREVIEW_EDGE = 1000

/** Usable embedded previews, best first (most pixels, then most bytes). */
export function rankPreviews(spans: JpegSpan[], minEdge = MIN_PREVIEW_EDGE): JpegSpan[] {
  return spans
    .filter(s => Math.max(s.width, s.height) >= minEdge)
    .sort((a, b) => b.width * b.height - a.width * a.height || b.end - b.start - (a.end - a.start))
}

/**
 * Canon CR3 is ISO-BMFF, which exifr cannot read; its EXIF sits in CMT1 (IFD0)
 * and CMT2 (EXIF IFD) boxes as plain TIFF blocks. Returns those blocks.
 */
export function findCr3TiffBlocks(b: Uint8Array, limit = 4 * 1024 * 1024): Uint8Array[] {
  const out: Uint8Array[] = []
  const end = Math.min(b.length, limit)
  for (let i = 4; i + 12 <= end; i++) {
    if (b[i] !== 0x43 || b[i + 1] !== 0x4d || b[i + 2] !== 0x54) continue // "CMT"
    const d = b[i + 3]
    if (d < 0x31 || d > 0x34) continue
    const size = u32(b, i - 4, false)
    const from = i + 4
    const to = i - 4 + size
    if (size < 16 || to > b.length) continue
    const le = b[from] === 0x49 && b[from + 1] === 0x49
    const be = b[from] === 0x4d && b[from + 1] === 0x4d
    if ((le || be) && u16(b, from + 2, le) === 42) out.push(b.subarray(from, to))
  }
  return out
}

// ─── Geometry ────────────────────────────────────────────────────────────────

export const PROOF_EDGE = 2048
export const THUMB_EDGE = 480
export const JPEG_QUALITY = 0.8

/** Scales to fit `max` on the long edge. Never enlarges. */
export function fitLongEdge(w: number, h: number, max: number): { w: number; h: number } {
  if (w <= 0 || h <= 0) return { w: 0, h: 0 }
  const s = Math.min(1, max / Math.max(w, h))
  return { w: Math.max(1, Math.round(w * s)), h: Math.max(1, Math.round(h * s)) }
}

/** EXIF orientations 5–8 turn the picture a quarter, so width and height swap. */
export const swapsAxes = (o: number | undefined) => !!o && o >= 5 && o <= 8

/**
 * Canvas transform that draws an image of size sw × sh (as stored) upright,
 * for EXIF orientation o. The canvas must be sh × sw when swapsAxes(o).
 */
export function orientationMatrix(o: number | undefined, sw: number, sh: number): [number, number, number, number, number, number] {
  switch (o) {
    case 2: return [-1, 0, 0, 1, sw, 0]
    case 3: return [-1, 0, 0, -1, sw, sh]
    case 4: return [1, 0, 0, -1, 0, sh]
    case 5: return [0, 1, 1, 0, 0, 0]
    case 6: return [0, 1, -1, 0, sh, 0]
    case 7: return [0, -1, -1, 0, sh, sw]
    case 8: return [0, -1, 1, 0, 0, sw]
    default: return [1, 0, 0, 1, 0, 0]
  }
}

/** Watermark font size in px for a proof of this size. */
export const watermarkPx = (w: number, h: number) => Math.max(12, Math.min(64, Math.round(Math.max(w, h) * 0.02)))

// ─── Chapters from folders ───────────────────────────────────────────────────

/** Camera-card folders that are never a chapter: DCIM, 100CANON, 101ND850, 100MSDCF… */
const CARD_DIR = /^(dcim|\d{3}[a-z0-9_]{5})$/i

/**
 * Chapter name for a dropped file's relative path ("Wedding/Ceremony/DSC_1.NEF").
 * With one dropped folder the first subfolder is the chapter; when several
 * folders were dropped together each top folder is one. Card folders are
 * skipped. Loose files have no chapter.
 */
export function chapterFromPath(path: string, multiRoot = false): string | undefined {
  const parts = path.replace(/\\/g, '/').split('/').filter(Boolean)
  parts.pop()
  const dirs = multiRoot ? parts : parts.slice(1)
  for (const d of dirs) {
    const name = d.trim()
    if (name && !CARD_DIR.test(name)) return name
  }
  return undefined
}

/** Top-level folder of a relative path, or '' for a loose file. */
export const rootOf = (path: string) => {
  const parts = path.replace(/\\/g, '/').split('/').filter(Boolean)
  return parts.length > 1 ? parts[0] : ''
}

export const slugKey = (name: string) => name.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'chapter'

/** Adds any chapters that don't exist yet (matched by name, case-insensitive) and maps each name to its key. */
export function ensureChapters(chapters: Chapter[], names: string[]): { chapters: Chapter[]; keyOf: Record<string, string>; added: number } {
  const out = [...chapters]
  const keyOf: Record<string, string> = {}
  let added = 0
  for (const raw of names) {
    const name = raw.trim()
    if (!name || keyOf[name]) continue
    const hit = out.find(c => c.name.toLowerCase() === name.toLowerCase() || c.key === name.toLowerCase())
    if (hit) {
      keyOf[name] = hit.key
      continue
    }
    const base = slugKey(name)
    let key = base
    for (let k = 2; out.some(c => c.key === key); k++) key = `${base}-${k}`
    out.push({ key, name, sort: out.reduce((m, c) => Math.max(m, c.sort), -1) + 1 })
    keyOf[name] = key
    added++
  }
  return { chapters: out, keyOf, added }
}

export function renameChapter(chapters: Chapter[], key: string, name: string): Chapter[] {
  return chapters.map(c => (c.key === key ? { ...c, name: name.trim() || c.name } : c))
}

/** Moves a chapter one place up (-1) or down (+1) and renumbers sort. */
export function moveChapter(chapters: Chapter[], key: string, dir: -1 | 1): Chapter[] {
  const list = [...chapters].sort((a, b) => a.sort - b.sort)
  const i = list.findIndex(c => c.key === key)
  const j = i + dir
  if (i < 0 || j < 0 || j >= list.length) return list.map((c, k) => ({ ...c, sort: k }))
  ;[list[i], list[j]] = [list[j], list[i]]
  return list.map((c, k) => ({ ...c, sort: k }))
}

/** Removes `from` after its photos move into `into`. */
export const dropChapter = (chapters: Chapter[], from: string) =>
  chapters.filter(c => c.key !== from).sort((a, b) => a.sort - b.sort).map((c, k) => ({ ...c, sort: k }))

// ─── Duplicates and resume ───────────────────────────────────────────────────

/**
 * Same photo already in the event: same filename and the same camera serial.
 * An unknown serial on either side matches any serial, so a RAW+JPG pair
 * (IMG_0001.CR3 and IMG_0001.JPG) or a re-drop of a file whose RAW EXIF we
 * could not read still counts as one photo.
 */
export function isDuplicate(existing: Pick<Proof, 'filename' | 'serial'>[], filename: string, serial?: string): boolean {
  return existing.some(p => p.filename === filename && (!p.serial || !serial || p.serial === serial))
}

/** Identity of a dropped file across reloads (File objects are not kept). */
export const fileSig = (path: string, size: number) => `${path}|${size}`

// ─── Queue state machine ─────────────────────────────────────────────────────

export type ItemStatus = 'queued' | 'working' | 'done' | 'failed' | 'skipped'

export interface QueueItem {
  id: string
  name: string
  /** Path relative to the dropped folder, or the bare name. */
  path: string
  kind: FileKind
  size: number
  chapter: string
  status: ItemStatus
  /** 0..1 within this file. */
  progress: number
  attempts: number
  /** Retry not before this time (ms epoch). */
  nextAt?: number
  error?: string
  /** Why it was skipped: duplicate, already uploaded… */
  note?: string
  /** Filename contains a space: Lightroom's filename search splits on it. */
  spaces: boolean
  proofId?: string
}

export interface QueueState {
  items: QueueItem[]
  paused: boolean
}

export const EMPTY_QUEUE: QueueState = { items: [], paused: false }
/** At most 4 files in flight, of which at most 2 RAWs (a RAW is read whole into memory). */
export const LIMITS = { total: 4, raw: 2 }
export const MAX_ATTEMPTS = 4

/** 1 s, 2 s, 4 s … capped at 30 s. */
export const backoffMs = (attempt: number) => Math.min(30_000, 1000 * 2 ** Math.max(0, attempt - 1))

export type QueueAction =
  | { type: 'add'; items: QueueItem[] }
  | { type: 'start'; id: string }
  | { type: 'progress'; id: string; value: number }
  | { type: 'done'; id: string; proofId: string }
  | { type: 'skip'; id: string; note: string }
  | { type: 'fail'; id: string; error: string; transient: boolean; now: number }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'retry'; id?: string }
  | { type: 'clearFinished' }

const patch = (s: QueueState, id: string, f: (i: QueueItem) => QueueItem): QueueState => ({ ...s, items: s.items.map(i => (i.id === id ? f(i) : i)) })

export function queueReducer(s: QueueState, a: QueueAction): QueueState {
  switch (a.type) {
    case 'add':
      return { ...s, items: [...s.items, ...a.items] }
    case 'start':
      return patch(s, a.id, i => (i.status === 'queued' ? { ...i, status: 'working', progress: 0, attempts: i.attempts + 1, nextAt: undefined, error: undefined } : i))
    case 'progress':
      return patch(s, a.id, i => (i.status === 'working' ? { ...i, progress: Math.max(i.progress, Math.min(1, a.value)) } : i))
    case 'done':
      return patch(s, a.id, i => ({ ...i, status: 'done', progress: 1, proofId: a.proofId, error: undefined, nextAt: undefined }))
    case 'skip':
      return patch(s, a.id, i => ({ ...i, status: 'skipped', progress: 1, note: a.note, nextAt: undefined }))
    case 'fail':
      return patch(s, a.id, i =>
        a.transient && i.attempts < MAX_ATTEMPTS
          ? { ...i, status: 'queued', progress: 0, error: a.error, nextAt: a.now + backoffMs(i.attempts) }
          : { ...i, status: 'failed', progress: 0, error: a.error, nextAt: undefined },
      )
    case 'pause':
      return { ...s, paused: true }
    case 'resume':
      return { ...s, paused: false }
    case 'retry':
      return { ...s, items: s.items.map(i => (i.status === 'failed' && (!a.id || i.id === a.id) ? { ...i, status: 'queued', attempts: 0, error: undefined, nextAt: undefined } : i)) }
    case 'clearFinished':
      return { ...s, items: s.items.filter(i => i.status === 'queued' || i.status === 'working') }
  }
}

/** Ids to start now, oldest first, within LIMITS. Empty while paused. */
export function nextToStart(s: QueueState, now: number, limits = LIMITS): string[] {
  if (s.paused) return []
  const working = s.items.filter(i => i.status === 'working')
  let total = working.length
  let raw = working.filter(i => i.kind === 'raw').length
  const out: string[] = []
  for (const i of s.items) {
    if (total >= limits.total) break
    if (i.status !== 'queued' || (i.nextAt && i.nextAt > now)) continue
    if (i.kind === 'raw' && raw >= limits.raw) continue
    out.push(i.id)
    total++
    if (i.kind === 'raw') raw++
  }
  return out
}

/** Earliest pending retry time, so the runner knows when to wake up. */
export function nextWakeAt(s: QueueState, now: number): number | undefined {
  let t: number | undefined
  for (const i of s.items) if (i.status === 'queued' && i.nextAt && i.nextAt > now) t = t === undefined ? i.nextAt : Math.min(t, i.nextAt)
  return t
}

export interface QueueTotals {
  total: number
  queued: number
  working: number
  done: number
  failed: number
  skipped: number
  spaces: number
  /** 0..1 by bytes; skipped and failed files count as finished. */
  fraction: number
  active: boolean
}

export function queueTotals(s: QueueState): QueueTotals {
  const t: QueueTotals = { total: s.items.length, queued: 0, working: 0, done: 0, failed: 0, skipped: 0, spaces: 0, fraction: 0, active: false }
  let all = 0
  let got = 0
  for (const i of s.items) {
    t[i.status]++
    if (i.spaces) t.spaces++
    const w = Math.max(1, i.size)
    all += w
    got += i.status === 'done' || i.status === 'skipped' || i.status === 'failed' ? w : w * i.progress
  }
  t.fraction = all ? got / all : 0
  t.active = t.queued + t.working > 0
  return t
}

// ─── EXIF ────────────────────────────────────────────────────────────────────

export interface ShotMeta {
  camera?: string
  serial?: string
  takenAt?: string
  orientation?: number
}

const COMPANY = /\s+(corporation|corp\.?|co\.?,?\s*ltd\.?|imaging|optical|electric|company|inc\.?)$/i

/** "NIKON CORPORATION" + "NIKON Z 6_2" → "NIKON Z 6_2"; "Canon" + "Canon EOS R5" → "Canon EOS R5". */
export function cameraName(make?: string, model?: string): string | undefined {
  const mk = (make ?? '').trim().replace(COMPANY, '').trim()
  const md = (model ?? '').trim()
  if (!md) return mk || undefined
  if (!mk || md.toLowerCase().startsWith(mk.toLowerCase().split(/\s+/)[0])) return md
  return `${mk} ${md}`
}

/** "2026:11:02 18:04:11" or a Date → ISO string. */
export function exifDate(v: unknown): string | undefined {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? undefined : v.toISOString()
  if (typeof v !== 'string') return undefined
  const m = v.match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/)
  if (!m) return undefined
  const d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6])
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
}

/** Picks our fields from merged exifr output (named or numeric keys). */
export function metaFrom(o: Record<string | number, unknown> | undefined | null): ShotMeta {
  if (!o) return {}
  const get = (name: string, code: number) => o[name] ?? o[code]
  const str = (v: unknown) => (typeof v === 'string' || typeof v === 'number' ? String(v).trim() || undefined : undefined)
  const serial = str(get('SerialNumber', 0xa431)) ?? str(get('BodySerialNumber', 0xa431)) ?? str(get('CameraSerialNumber', 0xc62f)) ?? str(o.InternalSerialNumber)
  const orient = Number(get('Orientation', 0x0112))
  return {
    camera: cameraName(str(get('Make', 0x010f)), str(get('Model', 0x0110))),
    serial,
    takenAt: exifDate(get('DateTimeOriginal', 0x9003)) ?? exifDate(get('CreateDate', 0x9004)),
    orientation: orient >= 1 && orient <= 8 ? orient : undefined,
  }
}

const mergeMeta = (a: ShotMeta, b: ShotMeta): ShotMeta => ({
  camera: a.camera ?? b.camera,
  serial: a.serial ?? b.serial,
  takenAt: a.takenAt ?? b.takenAt,
  orientation: a.orientation ?? b.orientation,
})

const EXIFR_OPTS = {
  tiff: true, exif: true, gps: false, interop: false, ifd1: false, xmp: false, icc: false, iptc: false, jfif: false, ihdr: false,
  makerNote: false, userComment: false, translateValues: false, mergeOutput: true,
}

/**
 * EXIF via exifr. exifr reads TIFF-based files (CR2, NEF, ARW, DNG) and JPEG;
 * it cannot read CR3 (ISO-BMFF) or RAF (Fujifilm container), and rejects ORF and
 * RW2 headers. For those we try CR3's CMT boxes, a patched ORF/RW2 header, and
 * finally the EXIF of the embedded preview. Never throws.
 */
export async function readMeta(input: Uint8Array | Blob, embedded?: Uint8Array): Promise<ShotMeta> {
  let parse: (data: Uint8Array | Blob, opts: object) => Promise<Record<string, unknown> | undefined>
  try {
    parse = (await import('exifr')).parse as typeof parse
  } catch {
    return {}
  }
  const tryParse = async (d: Uint8Array | Blob) => {
    try {
      return metaFrom(await parse(d, EXIFR_OPTS))
    } catch {
      return {}
    }
  }
  let meta = await tryParse(input)
  if (input instanceof Uint8Array && (!meta.camera || !meta.takenAt)) {
    // CR3: CMT1 = IFD0 (Make, Model, Orientation), CMT2 = EXIF IFD (DateTimeOriginal, serial).
    for (const block of findCr3TiffBlocks(input)) meta = mergeMeta(meta, await tryParse(block.slice()))
    // ORF ("IIRO"/"IIRS"/"MMOR") and RW2 ("IIU\0") are TIFF with a different magic number.
    const le = input[0] === 0x49 && input[1] === 0x49
    if (!meta.camera && input.length > 8 && (le || input[0] === 0x4d) && u16(input, 2, le) !== 42) {
      const head = input.slice(0, Math.min(input.length, 8 * 1024 * 1024))
      if (le) [head[2], head[3]] = [42, 0]
      else [head[2], head[3]] = [0, 42]
      meta = mergeMeta(meta, await tryParse(head))
    }
  }
  if (embedded && (!meta.camera || !meta.takenAt || !meta.serial)) meta = mergeMeta(meta, await tryParse(embedded))
  return meta
}

// ═══ Browser only below this line ═══════════════════════════════════════════

export class UploadError extends Error {
  transient: boolean
  constructor(message: string, transient = false) {
    super(message)
    this.transient = transient
  }
}

export const NO_PREVIEW_MSG = 'No usable preview inside this RAW. Export a JPG from Lightroom for this one.'

type AnyCanvas = OffscreenCanvas | HTMLCanvasElement
type Ctx = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D

function makeCanvas(w: number, h: number): AnyCanvas {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h)
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

function ctxOf(c: AnyCanvas): Ctx {
  const ctx = c.getContext('2d') as Ctx | null
  if (!ctx) throw new UploadError('This browser could not open a drawing canvas.')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  return ctx
}

async function encodeJpeg(c: AnyCanvas, quality = JPEG_QUALITY): Promise<Blob> {
  if ('convertToBlob' in c) return c.convertToBlob({ type: 'image/jpeg', quality })
  return new Promise((res, rej) => c.toBlob(b => (b ? res(b) : rej(new UploadError('Could not encode the JPEG.'))), 'image/jpeg', quality))
}

function burnWatermark(ctx: Ctx, w: number, h: number, text: string) {
  const t = text.trim()
  if (!t) return
  const px = watermarkPx(w, h)
  const pad = Math.round(px * 0.9)
  ctx.save()
  ctx.font = `600 ${px}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`
  ctx.textAlign = 'right'
  ctx.textBaseline = 'bottom'
  ctx.shadowColor = 'rgba(0,0,0,0.45)'
  ctx.shadowBlur = Math.round(px * 0.3)
  ctx.fillStyle = 'rgba(255,255,255,0.78)'
  ctx.fillText(t, w - pad, h - pad)
  ctx.restore()
}

export interface Prepared {
  preview: Blob
  thumb: Blob
  w: number
  h: number
  meta: ShotMeta
}

export type PrepareResult = { kind: 'ok'; data: Prepared } | { kind: 'skip'; note: string }

/**
 * File → watermarked 2048 px proof + 480 px thumbnail. `claim` runs once the
 * EXIF is known and before the expensive decode: return a skip note to stop
 * (duplicate), or null to go on.
 */
export async function prepareFile(
  file: File,
  opts: { watermark: string; onProgress?: (p: number) => void; claim?: (filename: string, serial?: string) => string | null },
): Promise<PrepareResult> {
  const { stem } = splitName(file.name)
  const kind = classify(file.name)
  const step = opts.onProgress ?? (() => {})
  let meta: ShotMeta
  let manualOrientation = 1
  let decodeFrom: Blob[]

  if (kind === 'raw') {
    let bytes: Uint8Array
    try {
      bytes = new Uint8Array(await file.arrayBuffer())
    } catch {
      throw new UploadError('Could not read this file from the disk. Is the card or drive still connected?', true)
    }
    step(0.25)
    const ranked = rankPreviews(findEmbeddedJpegs(bytes))
    if (!ranked.length) throw new UploadError(NO_PREVIEW_MSG)
    // Copy the previews out so the big RAW buffer can be freed.
    const slices = ranked.slice(0, 3).map(s => ({ span: s, bytes: bytes.slice(s.start, s.end) }))
    meta = await readMeta(bytes, slices[0].bytes)
    bytes = new Uint8Array(0)
    step(0.4)
    const skip = opts.claim?.(stem, meta.serial)
    if (skip) return { kind: 'skip', note: skip }
    if (slices[0].span.orientation === undefined && meta.orientation) manualOrientation = meta.orientation
    decodeFrom = slices.map(s => new Blob([s.bytes as BlobPart], { type: 'image/jpeg' }))
  } else {
    meta = await readMeta(file)
    step(0.3)
    const skip = opts.claim?.(stem, meta.serial)
    if (skip) return { kind: 'skip', note: skip }
    decodeFrom = [file]
  }

  let bitmap: ImageBitmap | undefined
  for (const b of decodeFrom) {
    try {
      bitmap = await createImageBitmap(b, { imageOrientation: 'from-image' })
      break
    } catch {
      /* try the next preview */
    }
  }
  if (!bitmap) throw new UploadError(kind === 'raw' ? NO_PREVIEW_MSG : 'This JPG could not be decoded. It may be damaged.')
  step(0.55)

  try {
    if (kind === 'raw' && Math.max(bitmap.width, bitmap.height) < MIN_PREVIEW_EDGE) throw new UploadError(NO_PREVIEW_MSG)
    const swap = swapsAxes(manualOrientation)
    const ow = swap ? bitmap.height : bitmap.width
    const oh = swap ? bitmap.width : bitmap.height
    const { w, h } = fitLongEdge(ow, oh, PROOF_EDGE)
    const sw = swap ? h : w
    const sh = swap ? w : h
    const canvas = makeCanvas(w, h)
    const ctx = ctxOf(canvas)
    ctx.setTransform(...orientationMatrix(manualOrientation, sw, sh))
    ctx.drawImage(bitmap, 0, 0, sw, sh)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    burnWatermark(ctx, w, h, opts.watermark)
    const preview = await encodeJpeg(canvas)
    step(0.75)
    const t = fitLongEdge(w, h, THUMB_EDGE)
    const tc = makeCanvas(t.w, t.h)
    ctxOf(tc).drawImage(canvas, 0, 0, t.w, t.h)
    const thumb = await encodeJpeg(tc)
    step(0.85)
    return { kind: 'ok', data: { preview, thumb, w, h, meta } }
  } finally {
    bitmap.close()
  }
}

/**
 * The one "send preview to server" step. Mock mode: IndexedDB in this browser.
 * LAN mode: both JPEGs go to the studio server, which serves them back by URL.
 */
export async function sendPreview(eventId: string, proofId: string, preview: Blob, thumb: Blob): Promise<{ previewKey?: string; thumbKey?: string; url?: string; thumbUrl?: string }> {
  if (isLan()) {
    try {
      const r = await uploadProofFiles(eventId, proofId, preview, thumb)
      return { url: r.url, thumbUrl: r.thumbUrl }
    } catch (e) {
      const transient = !(e instanceof ApiError) || e.status === 0 || e.status >= 500 || e.status === 429
      throw new UploadError(e instanceof Error ? e.message : 'Upload failed. Retrying.', transient)
    }
  }
  const previewKey = `${eventId}/${proofId}`
  const thumbKey = `${eventId}/${proofId}_t`
  try {
    await idbPut('previews', preview, previewKey)
    await idbPut('previews', thumb, thumbKey)
  } catch (e) {
    const name = e instanceof DOMException ? e.name : ''
    if (name === 'QuotaExceededError') throw new UploadError('Browser storage is full. Free some space or remove old events, then retry.')
    throw new UploadError('Saving the preview failed. Retrying.', true)
  }
  return { previewKey, thumbKey }
}

// ─── Done-list per event (honest resume after a reload) ─────────────────────

const doneKey = (eventId: string) => `tcs-upload-done:${eventId}`
const openKey = (eventId: string) => `tcs-upload-open:${eventId}`

/** sig → proofId of every file finished for this event in this browser. */
export function loadDone(eventId: string): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(doneKey(eventId)) ?? '{}') as Record<string, string>
  } catch {
    return {}
  }
}

export function saveDone(eventId: string, map: Record<string, string>) {
  try {
    localStorage.setItem(doneKey(eventId), JSON.stringify(map))
  } catch {
    /* storage full: resume just re-checks duplicates */
  }
}

/** Files still unfinished when the page was left, so the next visit can say so. */
export function loadOpenCount(eventId: string): number {
  try {
    return Number(localStorage.getItem(openKey(eventId)) ?? 0) || 0
  } catch {
    return 0
  }
}

export function saveOpenCount(eventId: string, n: number) {
  try {
    if (n > 0) localStorage.setItem(openKey(eventId), String(n))
    else localStorage.removeItem(openKey(eventId))
  } catch {
    /* ignore */
  }
}

export function forgetUploads(eventId: string) {
  try {
    localStorage.removeItem(doneKey(eventId))
    localStorage.removeItem(openKey(eventId))
  } catch {
    /* ignore */
  }
}
