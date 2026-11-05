import { describe, expect, it } from 'vitest'
import {
  EMPTY_QUEUE, MAX_ATTEMPTS, backoffMs, cameraName, chapterFromPath, classify, ensureChapters, exifDate, findCr3TiffBlocks, findEmbeddedJpegs, fitLongEdge,
  isDuplicate, metaFrom, moveChapter, nextToStart, nextWakeAt, orientationMatrix, queueReducer, queueTotals, rankPreviews, splitName, swapsAxes, walkJpeg,
  type QueueItem, type QueueState,
} from './upload'

// ─── Synthetic JPEG builder ──────────────────────────────────────────────────

const seg = (marker: number, body: number[]) => [0xff, marker, ((body.length + 2) >> 8) & 255, (body.length + 2) & 255, ...body]
const sof = (w: number, h: number, marker = 0xc0) => seg(marker, [8, h >> 8, h & 255, w >> 8, w & 255, 3, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1])
const sos = () => seg(0xda, [3, 1, 0, 2, 0x11, 3, 0x11, 0, 63, 0])

/** EXIF APP1 with IFD0 holding only Orientation, little-endian. */
const app1Orientation = (o: number) => seg(0xe1, [0x45, 0x78, 0x69, 0x66, 0, 0, 0x49, 0x49, 42, 0, 8, 0, 0, 0, 1, 0, 0x12, 0x01, 3, 0, 1, 0, 0, 0, o, 0, 0, 0, 0, 0, 0, 0])

function jpeg(w: number, h: number, opts: { entropy?: number[]; orientation?: number; sofMarker?: number; progressive?: boolean } = {}) {
  const entropy = opts.entropy ?? [0x12, 0x34, 0xff, 0x00, 0x56, 0xff, 0xd3, 0x78, 0xff, 0x00, 0xd9, 0x9a]
  const parts = [0xff, 0xd8, ...(opts.orientation ? app1Orientation(opts.orientation) : []), ...seg(0xdb, new Array(65).fill(1)), ...sof(w, h, opts.sofMarker), ...seg(0xc4, [0, ...new Array(16).fill(0)]), ...sos(), ...entropy]
  if (opts.progressive) parts.push(...seg(0xc4, [0x10, ...new Array(16).fill(0)]), ...sos(), 0x01, 0x02)
  parts.push(0xff, 0xd9)
  return parts
}

const bytes = (...chunks: number[][]) => new Uint8Array(chunks.flat())

describe('walkJpeg', () => {
  it('follows segments and skips stuffed FF 00 D9 and restart markers in entropy data', () => {
    const j = jpeg(6000, 4000)
    const span = walkJpeg(new Uint8Array(j), 0)
    expect(span).toEqual({ start: 0, end: j.length, width: 6000, height: 4000, orientation: undefined })
  })

  it('reads the preview’s own EXIF orientation', () => {
    expect(walkJpeg(new Uint8Array(jpeg(1620, 1080, { orientation: 6 })), 0)?.orientation).toBe(6)
  })

  it('follows a progressive JPEG across several scans', () => {
    const j = jpeg(2000, 1500, { progressive: true })
    expect(walkJpeg(new Uint8Array(j), 0)?.end).toBe(j.length)
  })

  it('rejects lossless JPEG (the RAW data itself in CR2 / DNG)', () => {
    expect(walkJpeg(new Uint8Array(jpeg(6000, 4000, { sofMarker: 0xc3 })), 0)).toBeNull()
  })

  it('rejects a truncated stream', () => {
    const j = jpeg(3000, 2000)
    expect(walkJpeg(new Uint8Array(j.slice(0, j.length - 2)), 0)).toBeNull()
  })
})

describe('findEmbeddedJpegs + rankPreviews', () => {
  it('finds every JPEG inside RAW-like bytes and ranks the largest first', () => {
    const header = [0x49, 0x49, 0x2a, 0x00, 8, 0, 0, 0, 0xff, 0xd8, 0x00, 0xff] // includes a false FF D8
    const thumb = jpeg(160, 120)
    const mid = jpeg(1620, 1080, { orientation: 8 })
    const full = jpeg(6000, 4000)
    const lossless = jpeg(6000, 4000, { sofMarker: 0xc3 })
    const b = bytes(header, thumb, [1, 2, 3], lossless, mid, [0xff, 0xff, 9], full, [7, 7])
    const spans = findEmbeddedJpegs(b)
    expect(spans.map(s => s.width)).toEqual([160, 1620, 6000])
    const ranked = rankPreviews(spans)
    expect(ranked.map(s => s.width)).toEqual([6000, 1620])
    expect(b[ranked[0].start]).toBe(0xff)
    expect(b[ranked[0].end - 1]).toBe(0xd9)
  })

  it('has nothing usable when only small previews exist', () => {
    expect(rankPreviews(findEmbeddedJpegs(bytes(jpeg(640, 480), jpeg(160, 120))))).toEqual([])
  })
})

describe('findCr3TiffBlocks', () => {
  it('returns the TIFF payload of CMT boxes', () => {
    const tiff = [0x49, 0x49, 42, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    const box = (type: string) => [0, 0, 0, 8 + tiff.length, ...[...type].map(c => c.charCodeAt(0)), ...tiff]
    const blocks = findCr3TiffBlocks(bytes([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70], box('CMT1'), box('CMT2'), box('CMTX')))
    expect(blocks.length).toBe(2)
    expect([...blocks[0].slice(0, 4)]).toEqual([0x49, 0x49, 42, 0])
  })
})

describe('geometry', () => {
  it('fits the long edge without enlarging', () => {
    expect(fitLongEdge(6000, 4000, 2048)).toEqual({ w: 2048, h: 1365 })
    expect(fitLongEdge(4000, 6000, 2048)).toEqual({ w: 1365, h: 2048 })
    expect(fitLongEdge(1600, 1067, 2048)).toEqual({ w: 1600, h: 1067 })
    expect(fitLongEdge(2048, 1365, 480)).toEqual({ w: 480, h: 320 })
    expect(fitLongEdge(0, 10, 2048)).toEqual({ w: 0, h: 0 })
  })

  it('maps EXIF orientation to canvas transforms', () => {
    expect(swapsAxes(6)).toBe(true)
    expect(swapsAxes(3)).toBe(false)
    expect(orientationMatrix(1, 30, 20)).toEqual([1, 0, 0, 1, 0, 0])
    // 6 = rotate 90° CW: source (x, y) → (sh - y, x)
    const [a, b, c, d, e, f] = orientationMatrix(6, 30, 20)
    const map = (x: number, y: number) => [a * x + c * y + e, b * x + d * y + f]
    expect(map(0, 0)).toEqual([20, 0])
    expect(map(30, 20)).toEqual([0, 30])
  })
})

describe('names and chapters', () => {
  it('splits and classifies names', () => {
    expect(splitName('DSC 0001.nef')).toEqual({ stem: 'DSC 0001', ext: 'NEF' })
    expect(splitName('Wedding/A/IMG_1.CR3')).toEqual({ stem: 'IMG_1', ext: 'CR3' })
    expect(classify('x.Rw2')).toBe('raw')
    expect(classify('x.jpeg')).toBe('jpeg')
    expect(classify('x.xmp')).toBeNull()
    expect(classify('._DSC_1.NEF')).toBeNull()
  })

  it('takes the first subfolder as the chapter', () => {
    expect(chapterFromPath('Sharma wedding/Ceremony/DSC_1.NEF')).toBe('Ceremony')
    expect(chapterFromPath('Sharma wedding/Ceremony/Cam B/DSC_1.NEF')).toBe('Ceremony')
    expect(chapterFromPath('Sharma wedding/DSC_1.NEF')).toBeUndefined()
    expect(chapterFromPath('DSC_1.NEF')).toBeUndefined()
    expect(chapterFromPath('Card/DCIM/100CANON/IMG_1.CR3')).toBeUndefined()
    expect(chapterFromPath('Reception/DSC_1.NEF', true)).toBe('Reception')
  })

  it('adds missing chapters and reuses existing ones by name', () => {
    const base = [{ key: 'ceremony', name: 'Ceremony', sort: 0 }]
    const r = ensureChapters(base, ['ceremony', 'Mehendi night', 'Mehendi night'])
    expect(r.added).toBe(1)
    expect(r.keyOf).toEqual({ ceremony: 'ceremony', 'Mehendi night': 'mehendi-night' })
    expect(r.chapters[1]).toEqual({ key: 'mehendi-night', name: 'Mehendi night', sort: 1 })
  })

  it('reorders chapters', () => {
    const cs = [{ key: 'a', name: 'A', sort: 0 }, { key: 'b', name: 'B', sort: 1 }]
    expect(moveChapter(cs, 'b', -1).map(c => c.key)).toEqual(['b', 'a'])
    expect(moveChapter(cs, 'a', -1).map(c => c.key)).toEqual(['a', 'b'])
  })
})

describe('duplicate rule', () => {
  const existing = [{ filename: 'DSC_4821', serial: '6012345' }, { filename: 'IMG_0001', serial: undefined }]
  it('same filename + same serial is a duplicate', () => expect(isDuplicate(existing, 'DSC_4821', '6012345')).toBe(true))
  it('same filename from another body is not', () => expect(isDuplicate(existing, 'DSC_4821', '6098765')).toBe(false))
  it('an unknown serial matches any', () => {
    expect(isDuplicate(existing, 'DSC_4821')).toBe(true)
    expect(isDuplicate(existing, 'IMG_0001', '1')).toBe(true)
  })
  it('different filename is never a duplicate', () => expect(isDuplicate(existing, 'DSC_4822', '6012345')).toBe(false))
})

describe('EXIF helpers', () => {
  it('builds a camera name', () => {
    expect(cameraName('NIKON CORPORATION', 'NIKON Z 6_2')).toBe('NIKON Z 6_2')
    expect(cameraName('Canon', 'Canon EOS R5')).toBe('Canon EOS R5')
    expect(cameraName('SONY', 'ILCE-7M4')).toBe('SONY ILCE-7M4')
    expect(cameraName(undefined, undefined)).toBeUndefined()
  })
  it('parses EXIF dates and numeric keys', () => {
    expect(exifDate('2026:11:02 18:04:11')).toBe(new Date(2026, 10, 2, 18, 4, 11).toISOString())
    expect(exifDate('nope')).toBeUndefined()
    expect(metaFrom({ 0x010f: 'Canon', 0x0110: 'Canon EOS R6', 0xa431: '0123', 0x0112: 6 })).toEqual({ camera: 'Canon EOS R6', serial: '0123', takenAt: undefined, orientation: 6 })
  })
})

// ─── Queue ───────────────────────────────────────────────────────────────────

const item = (id: string, kind: 'raw' | 'jpeg' = 'jpeg', size = 100): QueueItem => ({
  id, name: `${id}.${kind === 'raw' ? 'NEF' : 'JPG'}`, path: id, kind, size, chapter: 'all', status: 'queued', progress: 0, attempts: 0, spaces: false,
})
const withItems = (...items: QueueItem[]): QueueState => queueReducer(EMPTY_QUEUE, { type: 'add', items })

describe('upload queue', () => {
  it('starts at most 4 files, of which at most 2 RAWs', () => {
    const s = withItems(item('r1', 'raw'), item('r2', 'raw'), item('r3', 'raw'), item('j1'), item('j2'), item('j3'))
    expect(nextToStart(s, 0)).toEqual(['r1', 'r2', 'j1', 'j2'])
    const running = ['r1', 'r2', 'j1', 'j2'].reduce((st, id) => queueReducer(st, { type: 'start', id }), s)
    expect(nextToStart(running, 0)).toEqual([])
    const afterRaw = queueReducer(running, { type: 'done', id: 'r1', proofId: 'p' })
    expect(nextToStart(afterRaw, 0)).toEqual(['r3'])
  })

  it('pauses and resumes', () => {
    const s = queueReducer(withItems(item('a')), { type: 'pause' })
    expect(nextToStart(s, 0)).toEqual([])
    expect(nextToStart(queueReducer(s, { type: 'resume' }), 0)).toEqual(['a'])
  })

  it('retries transient failures with backoff, then gives up', () => {
    let s = queueReducer(withItems(item('a')), { type: 'start', id: 'a' })
    s = queueReducer(s, { type: 'fail', id: 'a', error: 'net', transient: true, now: 1000 })
    expect(s.items[0]).toMatchObject({ status: 'queued', nextAt: 1000 + backoffMs(1), error: 'net' })
    expect(nextToStart(s, 1500)).toEqual([])
    expect(nextWakeAt(s, 1500)).toBe(2000)
    expect(nextToStart(s, 2000)).toEqual(['a'])
    for (let k = 1; k < MAX_ATTEMPTS; k++) {
      s = queueReducer(s, { type: 'start', id: 'a' })
      s = queueReducer(s, { type: 'fail', id: 'a', error: 'net', transient: true, now: 0 })
    }
    expect(s.items[0].status).toBe('failed')
    expect(queueReducer(s, { type: 'retry' }).items[0]).toMatchObject({ status: 'queued', attempts: 0 })
  })

  it('fails permanent errors at once', () => {
    let s = queueReducer(withItems(item('a', 'raw')), { type: 'start', id: 'a' })
    s = queueReducer(s, { type: 'fail', id: 'a', error: 'No usable preview', transient: false, now: 0 })
    expect(s.items[0].status).toBe('failed')
  })

  it('backoff doubles and caps at 30 s', () => {
    expect([1, 2, 3, 4, 10].map(backoffMs)).toEqual([1000, 2000, 4000, 8000, 30_000])
  })

  it('totals by bytes, counting skipped and failed as finished', () => {
    let s = withItems(item('a', 'jpeg', 100), item('b', 'jpeg', 300), item('c', 'jpeg', 600))
    s = queueReducer(s, { type: 'start', id: 'a' })
    s = queueReducer(s, { type: 'done', id: 'a', proofId: 'p' })
    s = queueReducer(s, { type: 'skip', id: 'b', note: 'duplicate' })
    s = queueReducer(s, { type: 'start', id: 'c' })
    s = queueReducer(s, { type: 'progress', id: 'c', value: 0.5 })
    const t = queueTotals(s)
    expect(t).toMatchObject({ total: 3, done: 1, skipped: 1, working: 1, active: true })
    expect(t.fraction).toBeCloseTo(0.7)
    expect(queueReducer(s, { type: 'clearFinished' }).items.map(i => i.id)).toEqual(['c'])
  })
})
