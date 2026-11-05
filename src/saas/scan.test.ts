import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { assetsCsv, cameraName, diffAssets, duplicatesByFingerprint, eventsFromAssets, exifDate, exifToFields, fingerprintOf, folderOf, folderTree, kindOf, matchSelection, parseMarker, pathSkipped, searchAssets, splitName, toAsset, type StoredAsset } from './scan'

const at = (d: string) => new Date(d).getTime()
const A = (path: string, extra: Partial<StoredAsset> = {}, driveId = 'd1'): StoredAsset => ({ ...toAsset(driveId, { path, bytes: 100, modified: at('2026-02-01T10:00:00Z') }), ...extra })

describe('names and kinds', () => {
  it('detects kinds case-insensitively', () => {
    expect(kindOf('NEF')).toBe('raw')
    expect(kindOf('cr3')).toBe('raw')
    expect(kindOf('JPG')).toBe('photo')
    expect(kindOf('HEIC')).toBe('photo')
    expect(kindOf('MOV')).toBe('video')
    expect(kindOf('xmp')).toBe('other')
    expect(kindOf('')).toBe('other')
  })
  it('splits filename and extension like Proof.filename', () => {
    expect(splitName('DSC_4821.NEF')).toEqual({ filename: 'DSC_4821', ext: 'NEF' })
    expect(splitName('a.b.jpg')).toEqual({ filename: 'a.b', ext: 'jpg' })
    expect(splitName('README')).toEqual({ filename: 'README', ext: '' })
  })
  it('guesses the event folder, skipping a year level', () => {
    expect(folderOf('2026/Sharma wedding/RAW/DSC_1.NEF')).toBe('2026/Sharma wedding')
    expect(folderOf('Sharma wedding/RAW/DSC_1.NEF')).toBe('Sharma wedding')
    expect(folderOf('2026/DSC_1.NEF')).toBe('2026')
    expect(folderOf('DSC_1.NEF')).toBeUndefined()
  })
  it('skips hidden and system paths', () => {
    expect(pathSkipped('.Spotlight-V100/Store/x')).toBe(true)
    expect(pathSkipped('$RECYCLE.BIN/x.jpg')).toBe(true)
    expect(pathSkipped('System Volume Information/a')).toBe(true)
    expect(pathSkipped('2026/._DSC_1.NEF')).toBe(true)
    expect(pathSkipped('2026/.DS_Store')).toBe(true)
    expect(pathSkipped('.tce-drive.json')).toBe(true)
    expect(pathSkipped('2026/Sharma/DSC_1.NEF')).toBe(false)
  })
  it('builds assets from pass-1 entries', () => {
    const a = toAsset('d1', { path: '2026/Sharma/RAW/DSC_4821.NEF', bytes: 5, modified: at('2026-01-02T00:00:00Z') })
    expect(a).toMatchObject({ id: 'd1:2026/Sharma/RAW/DSC_4821.NEF', filename: 'DSC_4821', ext: 'NEF', kind: 'raw', folder: '2026/Sharma', modifiedAt: '2026-01-02T00:00:00.000Z' })
  })
})

describe('diffAssets', () => {
  it('finds added, removed and changed; keeps metadata for unchanged', () => {
    const prev = [A('a/1.jpg', { camera: 'X', metaAt: 'y' }), A('a/2.jpg'), A('a/3.jpg')]
    const next = [A('a/1.jpg'), A('a/2.jpg', { bytes: 999 }), A('a/4.jpg')]
    const d = diffAssets(prev, next)
    expect(d.added.map(a => a.path)).toEqual(['a/4.jpg'])
    expect(d.removed.map(a => a.path)).toEqual(['a/3.jpg'])
    expect(d.changed.map(a => a.path)).toEqual(['a/2.jpg'])
    expect(d.unchanged[0]).toMatchObject({ path: 'a/1.jpg', camera: 'X', metaAt: 'y' })
  })
  it('treats a new mtime as changed', () => {
    const d = diffAssets([A('x.jpg')], [A('x.jpg', { modifiedAt: '2026-03-01T00:00:00.000Z' })])
    expect(d.changed).toHaveLength(1)
  })
})

describe('derived views', () => {
  const assets = [
    A('2026/Sharma wedding/RAW/DSC_1.NEF', { takenAt: '2026-01-10T05:00:00.000Z', bytes: 30 }),
    A('2026/Sharma wedding/RAW/DSC_2.NEF', { takenAt: '2026-01-11T05:00:00.000Z', bytes: 30 }),
    A('2026/Sharma wedding/RAW/DSC_2.xmp', { modifiedAt: '2026-06-01T00:00:00.000Z', bytes: 1 }),
    A('2026/Sharma wedding/Video/C001.MP4', { takenAt: '2026-01-10T06:00:00.000Z', bytes: 500 }),
    A('Misc/notes.txt'),
  ]
  it('groups events by folder with counts and media date range', () => {
    const ev = eventsFromAssets(assets)
    expect(ev).toHaveLength(1)
    expect(ev[0]).toMatchObject({ folder: '2026/Sharma wedding', files: 4, raws: 2, videos: 1, photos: 0, bytes: 561, from: '2026-01-10T05:00:00.000Z', to: '2026-01-11T05:00:00.000Z' })
  })
  it('builds a folder tree with recursive counts', () => {
    const t = folderTree(assets)
    expect(t.files).toBe(5)
    const y = t.children.find(c => c.name === '2026')!
    expect(y.files).toBe(4)
    const w = y.children[0]
    expect(w.children.map(c => c.name)).toEqual(['RAW', 'Video'])
    expect(w.children[0]).toMatchObject({ files: 3, bytes: 61, path: '2026/Sharma wedding/RAW' })
  })
  it('groups duplicates by fingerprint across drives', () => {
    const g = duplicatesByFingerprint([A('a.jpg', { fingerprint: 'f1' }), A('b.jpg', { fingerprint: 'f1' }, 'd2'), A('c.jpg', { fingerprint: 'f2' }), A('d.jpg')])
    expect(g).toHaveLength(1)
    expect(g[0].map(a => a.driveId)).toEqual(['d1', 'd2'])
  })
  it('searches by text, kind, folder, camera and date; caps rows', () => {
    const rows = [...assets, A('2025/Old/IMG_1.JPG', { camera: 'Canon EOS R5', takenAt: '2025-05-05T00:00:00.000Z' })]
    expect(searchAssets(rows, { text: 'dsc_2' }).total).toBe(2)
    expect(searchAssets(rows, { kind: 'raw' }).total).toBe(2)
    expect(searchAssets(rows, { folder: 'video' }).total).toBe(1)
    expect(searchAssets(rows, { camera: 'eos' }).rows[0].filename).toBe('IMG_1')
    expect(searchAssets(rows, { from: '2026-01-11', to: '2026-01-31' }).total).toBe(1)
    const capped = searchAssets(rows, {}, 2)
    expect(capped.rows).toHaveLength(2)
    expect(capped.total).toBe(6)
  })
  it('exports CSV with quoting', () => {
    const csv = assetsCsv([A('a/b, c.jpg')], () => ({ label: 'Drive "A"', kept: 'Shelf 1' }))
    const line = csv.split('\n')[1]
    expect(line.startsWith('"Drive ""A""",Shelf 1,"a/b, c.jpg"')).toBe(true)
  })
})

describe('matchSelection', () => {
  const assets = [
    A('2026/Sharma/RAW/DSC_1.NEF'),
    A('2026/Sharma/RAW/DSC_2.NEF'),
    A('2026/Sharma/JPG/DSC_1.JPG'),
    A('2026/Sharma/JPG/DSC_3.JPG'),
    A('Backup/Sharma/DSC_1.NEF', {}, 'd2'),
    A('Backup/Sharma/DSC_2.NEF', {}, 'd2'),
  ]
  it('prefers RAW, groups by folder, reports missing and backups', () => {
    const m = matchSelection(['DSC_1', 'dsc_2', 'DSC_3', 'DSC_9', 'DSC_9'], assets)
    expect(m.best.get('dsc_1')?.ext).toBe('NEF')
    expect(m.best.get('dsc_3')?.ext).toBe('JPG')
    expect(m.missing).toEqual(['DSC_9'])
    expect(m.locations[0]).toEqual({ driveId: 'd1', dir: '2026/Sharma/RAW', count: 2 })
    expect(m.alsoOn).toEqual([{ driveId: 'd2', count: 2 }])
  })
  it('only uses retired drives as a last resort', () => {
    const m = matchSelection(['DSC_1'], assets, new Set(['d1']))
    expect(m.best.get('dsc_1')?.driveId).toBe('d2')
  })
})

describe('EXIF mapping', () => {
  it('maps exifr output to asset fields', () => {
    expect(
      exifToFields({ Make: 'NIKON CORPORATION', Model: 'NIKON Z 6_2', DateTimeOriginal: new Date('2026-01-10T05:00:00Z'), BodySerialNumber: '6012345', LensModel: 'NIKKOR Z 24-70mm f/2.8 S', ExifImageWidth: 6048, ExifImageHeight: 4024 }),
    ).toEqual({ takenAt: '2026-01-10T05:00:00.000Z', camera: 'NIKON Z 6_2', serial: '6012345', lens: 'NIKKOR Z 24-70mm f/2.8 S', w: 6048, h: 4024 })
  })
  it('falls back across tag names and ignores junk', () => {
    const f = exifToFields({ Make: 'SONY', Model: 'ILCE-7M4', CreateDate: '2026:03:14 10:22:01', SerialNumber: 123, ImageWidth: 7008, ImageHeight: 0 })
    expect(f.camera).toBe('SONY ILCE-7M4')
    expect(f.serial).toBe('123')
    expect(f.w).toBe(7008)
    expect(f.h).toBeUndefined()
    expect(f.takenAt).toBe(new Date(2026, 2, 14, 10, 22, 1).toISOString())
    expect(exifToFields(null)).toEqual({})
  })
  it('dedupes make in camera names', () => {
    expect(cameraName('Canon', 'Canon EOS R5')).toBe('Canon EOS R5')
    expect(cameraName(undefined, 'X100V')).toBe('X100V')
    expect(cameraName('FUJIFILM', undefined)).toBe('FUJIFILM')
  })
  it('rejects empty EXIF dates', () => {
    expect(exifDate('0000:00:00 00:00:00')).toBeUndefined()
    expect(exifDate(42)).toBeUndefined()
  })
})

describe('fingerprint and marker', () => {
  it('is size plus SHA-1 of the first 1 MB', async () => {
    const big = new Uint8Array(1024 * 1024 + 10).map((_, i) => i % 251)
    const expected = createHash('sha1').update(big.subarray(0, 1024 * 1024)).digest('hex')
    expect(await fingerprintOf(big.length, big)).toBe(`${big.length}-${expected}`)
    const small = new Uint8Array([1, 2, 3])
    expect(await fingerprintOf(3, small.buffer)).toBe(`3-${createHash('sha1').update(small).digest('hex')}`)
  })
  it('parses the drive marker defensively', () => {
    expect(parseMarker('{"markerId":"u1","studioId":"s","label":"A","createdAt":"t"}')).toEqual({ markerId: 'u1', studioId: 's', label: 'A', createdAt: 't' })
    expect(parseMarker('{"label":"A"}')).toBeNull()
    expect(parseMarker('not json')).toBeNull()
  })
})
