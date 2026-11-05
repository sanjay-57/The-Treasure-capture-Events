import { describe, expect, it } from 'vitest'
import { bytesReader, parseMoov, readVideoMeta } from './meta'

const cat = (...parts: Uint8Array[]) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let at = 0
  for (const p of parts) {
    out.set(p, at)
    at += p.length
  }
  return out
}
const be = (n: number, bytes = 4) => {
  const u = new Uint8Array(bytes)
  const v = new DataView(u.buffer)
  if (bytes === 2) v.setUint16(0, n)
  else if (bytes === 8) {
    v.setUint32(0, Math.floor(n / 2 ** 32))
    v.setUint32(4, n >>> 0)
  } else v.setInt32(0, n | 0)
  return u
}
const ascii = (s: string) => new Uint8Array([...s].map(c => c.charCodeAt(0)))
const box = (type: string, ...kids: Uint8Array[]) => {
  const body = cat(...kids)
  return cat(be(body.length + 8), ascii(type), body)
}
const zeros = (n: number) => new Uint8Array(n)

const mvhd0 = (timescale: number, duration: number) => box('mvhd', zeros(4), zeros(8), be(timescale), be(duration), zeros(80))
const mvhd1 = (timescale: number, duration: number) => box('mvhd', new Uint8Array([1, 0, 0, 0]), zeros(16), be(timescale), be(duration, 8), zeros(80))
const matrix = (rot90: boolean) => cat(be(rot90 ? 0 : 65536), be(rot90 ? 65536 : 0), be(0), be(rot90 ? -65536 : 0), be(rot90 ? 0 : 65536), be(0), be(0), be(0), be(0x40000000))
const tkhd0 = (w: number, h: number, rot90 = false) => box('tkhd', zeros(4), zeros(20), zeros(8), zeros(8), matrix(rot90), be(w * 65536), be(h * 65536))
const tkhd1 = (w: number, h: number) => box('tkhd', new Uint8Array([1, 0, 0, 0]), zeros(32), zeros(8), zeros(8), matrix(false), be(w * 65536), be(h * 65536))
const hdlr = (t: string) => box('hdlr', zeros(4), zeros(4), ascii(t), zeros(12), new Uint8Array([0]))
const stsd = (fourcc: string, w = 0, h = 0) => box('stsd', zeros(4), be(1), box(fourcc, zeros(6), be(1, 2), zeros(16), be(w, 2), be(h, 2), zeros(50)))
const trak = (handler: string, tk: Uint8Array, codec: string, sw = 0, sh = 0) => box('trak', tk, box('mdia', hdlr(handler), box('minf', box('stbl', stsd(codec, sw, sh)))))

describe('parseMoov', () => {
  it('reads duration, size and codec from the first video track', () => {
    const moov = box('moov', mvhd0(600, 600 * 75), trak('soun', tkhd0(0, 0), 'mp4a'), trak('vide', tkhd0(3840, 2160), 'hvc1'))
    expect(parseMoov(moov)).toEqual({ durationSec: 75, w: 3840, h: 2160, codec: 'hvc1' })
  })
  it('handles version-1 mvhd / tkhd (64-bit times)', () => {
    const moov = box('moov', mvhd1(90000, 90000 * 12.5), trak('vide', tkhd1(1920, 1080), 'avc1'))
    expect(parseMoov(moov)).toEqual({ durationSec: 12.5, w: 1920, h: 1080, codec: 'avc1' })
  })
  it('swaps width and height for a 90° rotated phone clip', () => {
    const moov = box('moov', mvhd0(1000, 3000), trak('vide', tkhd0(1920, 1080, true), 'avc1'))
    expect(parseMoov(moov)).toMatchObject({ w: 1080, h: 1920 })
  })
  it('falls back to the sample entry size when tkhd has none', () => {
    const moov = box('moov', mvhd0(1000, 1000), trak('vide', tkhd0(0, 0), 'apch', 1280, 720))
    expect(parseMoov(moov)).toEqual({ durationSec: 1, w: 1280, h: 720, codec: 'apch' })
  })
})

describe('readVideoMeta', () => {
  const moov = box('moov', mvhd0(1000, 61_000), trak('vide', tkhd0(1920, 1080), 'avc1'))
  const ftyp = box('ftyp', ascii('isom'), zeros(4), ascii('isomavc1'))

  it('finds moov at the start', async () => {
    const f = cat(ftyp, moov, box('mdat', zeros(1000)))
    expect(await readVideoMeta(bytesReader(f), f.length)).toEqual({ durationSec: 61, w: 1920, h: 1080, codec: 'avc1' })
  })
  it('seeks past a large mdat to a moov at the end', async () => {
    const f = cat(ftyp, box('mdat', zeros(200_000)), moov)
    const reads: number[] = []
    const r = bytesReader(f)
    const meta = await readVideoMeta(async (o, l) => (reads.push(l), r(o, l)), f.length)
    expect(meta?.durationSec).toBe(61)
    expect(Math.max(...reads)).toBeLessThan(1000) // never read the mdat body
  })
  it('handles a 64-bit largesize mdat', async () => {
    const payload = zeros(5000)
    const mdat64 = cat(be(1), ascii('mdat'), be(payload.length + 16, 8), payload)
    const f = cat(ftyp, mdat64, moov)
    expect((await readVideoMeta(bytesReader(f), f.length))?.codec).toBe('avc1')
  })
  it('returns null for non-BMFF data or a missing moov', async () => {
    const junk = new Uint8Array([0x47, 0x40, 0x00, 0x10, 0xff, 0xfe, 0x00, 0x01, 0x02, 0x03])
    expect(await readVideoMeta(bytesReader(junk), junk.length)).toBeNull()
    const noMoov = cat(ftyp, box('mdat', zeros(100)))
    expect(await readVideoMeta(bytesReader(noMoov), noMoov.length)).toBeNull()
  })
})
