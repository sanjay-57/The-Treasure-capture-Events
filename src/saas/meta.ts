/**
 * Minimal ISO-BMFF (MP4 / MOV / M4V / 3GP) header reader. Reads only box
 * headers and the `moov` box through small slices, never the media data, so a
 * 40 GB wedding video costs a few KB of disk reads. Other containers (MTS,
 * AVI, MKV, MXF) return null: duration unknown, which is fine for v1.
 */

export interface VideoMeta {
  durationSec?: number
  w?: number
  h?: number
  /** Sample-entry fourcc of the first video track: avc1, hvc1, hev1, apcn, apch… */
  codec?: string
}

/** Reads `length` bytes at `offset` (may return fewer at end of file). */
export type Reader = (offset: number, length: number) => Promise<Uint8Array>

export const bytesReader = (u: Uint8Array): Reader => async (offset, length) => u.subarray(offset, Math.min(u.length, offset + length))

export const blobReader = (b: Blob): Reader => async (offset, length) => new Uint8Array(await b.slice(offset, Math.min(b.size, offset + length)).arrayBuffer())

/** Extensions this module understands. */
export const BMFF_EXT = new Set(['mp4', 'mov', 'm4v', '3gp', 'qt'])

/** moov boxes above this are not read (a corrupt size, or a pathological file). */
const MOOV_CAP = 64 * 1024 * 1024

const fourcc = (u: Uint8Array, at: number) => String.fromCharCode(u[at], u[at + 1], u[at + 2], u[at + 3])
const u32 = (v: DataView, at: number) => v.getUint32(at)
const u64 = (v: DataView, at: number) => v.getUint32(at) * 2 ** 32 + v.getUint32(at + 4)

interface Box {
  type: string
  /** First byte after the header. */
  start: number
  /** One past the last byte of the box. */
  end: number
}

/** Child boxes laid out back to back in u[from, to). */
function* children(u: Uint8Array, v: DataView, from: number, to: number): Generator<Box> {
  let at = from
  while (at + 8 <= to) {
    let size = u32(v, at)
    const type = fourcc(u, at + 4)
    let header = 8
    if (size === 1) {
      if (at + 16 > to) return
      size = u64(v, at + 8)
      header = 16
    } else if (size === 0) size = to - at
    if (size < header || at + size > to) return
    yield { type, start: at + header, end: at + size }
    at += size
  }
}

const child = (u: Uint8Array, v: DataView, parent: Box, type: string) => {
  for (const b of children(u, v, parent.start, parent.end)) if (b.type === type) return b
  return undefined
}

const path = (u: Uint8Array, v: DataView, from: Box, types: string[]) => {
  let cur: Box | undefined = from
  for (const t of types) {
    if (!cur) return undefined
    cur = child(u, v, cur, t)
  }
  return cur
}

/** Parses a complete `moov` payload (bytes include the moov header). */
export function parseMoov(u: Uint8Array): VideoMeta {
  const v = new DataView(u.buffer, u.byteOffset, u.byteLength)
  const out: VideoMeta = {}
  const moov = children(u, v, 0, u.length).next().value
  if (!moov || moov.type !== 'moov') return out

  const mvhd = child(u, v, moov, 'mvhd')
  if (mvhd && mvhd.end - mvhd.start >= 20) {
    const ver = u[mvhd.start]
    const p = mvhd.start + 4
    const timescale = ver === 1 ? u32(v, p + 16) : u32(v, p + 8)
    const duration = ver === 1 ? u64(v, p + 20) : u32(v, p + 12)
    if (timescale > 0 && duration > 0 && duration !== 0xffffffff) out.durationSec = Math.round((duration / timescale) * 100) / 100
  }

  let fallback: Box | undefined
  for (const trak of children(u, v, moov.start, moov.end)) {
    if (trak.type !== 'trak') continue
    const hdlr = path(u, v, trak, ['mdia', 'hdlr'])
    const isVideo = hdlr ? fourcc(u, hdlr.start + 8) === 'vide' : false
    if (!isVideo) {
      if (!hdlr && !fallback) fallback = trak
      continue
    }
    Object.assign(out, readTrak(u, v, trak))
    return out
  }
  if (fallback) {
    const t = readTrak(u, v, fallback)
    if (t.w) Object.assign(out, t)
  }
  return out
}

function readTrak(u: Uint8Array, v: DataView, trak: Box): VideoMeta {
  const out: VideoMeta = {}
  const tkhd = child(u, v, trak, 'tkhd')
  if (tkhd) {
    const ver = u[tkhd.start]
    const matrixAt = tkhd.start + (ver === 1 ? 52 : 40)
    const wAt = tkhd.start + (ver === 1 ? 88 : 76)
    if (wAt + 8 <= tkhd.end) {
      let w = Math.round(u32(v, wAt) / 65536)
      let h = Math.round(u32(v, wAt + 4) / 65536)
      // Portrait phone clips are stored landscape with a 90° matrix: a = 0, b = ±1.
      const a = v.getInt32(matrixAt)
      const b = v.getInt32(matrixAt + 4)
      if (a === 0 && Math.abs(b) === 65536) [w, h] = [h, w]
      if (w && h) {
        out.w = w
        out.h = h
      }
    }
  }
  const stsd = path(u, v, trak, ['mdia', 'minf', 'stbl', 'stsd'])
  if (stsd && stsd.start + 16 <= stsd.end && u32(v, stsd.start + 4) > 0) {
    const entry = stsd.start + 8
    out.codec = fourcc(u, entry + 4).trim()
    if (!out.w && entry + 36 <= stsd.end) {
      const w = v.getUint16(entry + 32)
      const h = v.getUint16(entry + 34)
      if (w && h) {
        out.w = w
        out.h = h
      }
    }
  }
  return out
}

/**
 * Finds the top-level `moov` box by hopping over box headers (it is often at
 * the end, after a huge `mdat`), reads it and parses it. Null if the file is
 * not ISO-BMFF or has no moov.
 */
export async function readVideoMeta(read: Reader, size: number): Promise<VideoMeta | null> {
  let at = 0
  for (let guard = 0; guard < 10_000 && at + 8 <= size; guard++) {
    const h = await read(at, 16)
    if (h.length < 8) return null
    const hv = new DataView(h.buffer, h.byteOffset, h.byteLength)
    let box = hv.getUint32(0)
    const type = fourcc(h, 4)
    if (guard === 0 && !/^[a-zA-Z0-9 ]{4}$/.test(type)) return null
    if (box === 1) {
      if (h.length < 16) return null
      box = u64(hv, 8)
    } else if (box === 0) box = size - at
    if (box < 8) return null
    if (type === 'moov') {
      if (box > MOOV_CAP) return null
      return parseMoov(await read(at, box))
    }
    at += box
  }
  return null
}
