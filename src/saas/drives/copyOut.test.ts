import { describe, expect, it } from 'vitest'
import { matchSelection, type FsDirHandle, type FsFileHandle } from '../scan'
import type { Asset } from '../types'
import { copyFiles, copyPlan, looksLikeRoot } from './copyOut'

const asset = (driveId: string, path: string, bytes = 100): Asset => {
  const base = path.slice(path.lastIndexOf('/') + 1)
  const dot = base.lastIndexOf('.')
  const ext = base.slice(dot + 1).toLowerCase()
  return {
    id: `${driveId}:${path}`,
    driveId,
    path,
    filename: base.slice(0, dot),
    ext,
    kind: ['nef', 'cr3', 'arw'].includes(ext) ? 'raw' : ext === 'jpg' ? 'photo' : 'other',
    bytes,
    modifiedAt: '2026-11-01T00:00:00Z',
  }
}

/* In-memory File System Access: nested Maps, strings as file contents. */
type Tree = Map<string, Tree | string>
const notFound = () => new DOMException('missing', 'NotFoundError')
function dirHandle(name: string, tree: Tree, opts: { quotaAfter?: number; writes?: { n: number } } = {}): FsDirHandle {
  const writes = opts.writes ?? { n: 0 }
  const file = (fname: string): FsFileHandle => ({
    kind: 'file',
    name: fname,
    getFile: async () => {
      const v = tree.get(fname)
      if (typeof v !== 'string') throw notFound()
      return new File([v], fname)
    },
    createWritable: async () => {
      let buf = ''
      return {
        write: async (d: string | Blob) => {
          if (opts.quotaAfter !== undefined && writes.n >= opts.quotaAfter) throw new DOMException('full', 'QuotaExceededError')
          buf += typeof d === 'string' ? d : await d.text()
        },
        close: async () => {
          writes.n++
          tree.set(fname, buf)
        },
        abort: async () => {},
      }
    },
  })
  return {
    kind: 'directory',
    name,
    values: async function* () {},
    getFileHandle: async (fname, o) => {
      if (!tree.has(fname)) {
        if (!o?.create) throw notFound()
        tree.set(fname, '')
      }
      if (typeof tree.get(fname) !== 'string') throw new DOMException('dir', 'TypeMismatchError')
      return file(fname)
    },
    getDirectoryHandle: async (dname, o) => {
      let sub = tree.get(dname)
      if (sub === undefined) {
        if (!o?.create) throw notFound()
        sub = new Map()
        tree.set(dname, sub)
      }
      if (typeof sub === 'string') throw new DOMException('file', 'TypeMismatchError')
      return dirHandle(dname, sub, { ...opts, writes })
    },
  }
}
const tree = (o: Record<string, string | Record<string, unknown>>): Tree =>
  new Map(Object.entries(o).map(([k, v]) => [k, typeof v === 'string' ? v : tree(v as Record<string, string>)]))

describe('copyPlan', () => {
  const assets = [
    asset('A', 'Sharma/RAW/DSC_1.NEF', 30),
    asset('A', 'Sharma/RAW/DSC_1.xmp', 2),
    asset('A', 'Sharma/RAW/DSC_2.NEF', 30),
    asset('A', 'Sharma/JPG/DSC_2.JPG', 10),
    asset('B', 'Backup/DSC_3.NEF', 40),
    asset('A', 'Other/DSC_9.xmp', 2),
  ]
  it('groups by drive, prefers RAW and brings the sidecar along', () => {
    const plan = copyPlan(matchSelection(['DSC_1', 'DSC_2', 'DSC_3', 'GONE'], assets), assets)
    expect(plan.map(g => [g.driveId, g.files])).toEqual([['A', 2], ['B', 1]])
    expect(plan[0].items.map(i => i.name)).toEqual(['DSC_1.NEF', 'DSC_1.xmp', 'DSC_2.NEF'])
    expect(plan[0].bytes).toBe(62)
  })
  it('renames clashing destination names instead of overwriting', () => {
    const a = [asset('A', 'x/IMG_1.CR3'), asset('A', 'y/img_2.cr3')]
    const m = matchSelection(['IMG_1', 'img_2'], a)
    // Force two picks with the same base name, as two cameras would produce.
    m.best.set('img_2', { ...a[1], path: 'y/IMG_1.CR3' })
    expect(copyPlan(m, a)[0].items.map(i => i.name)).toEqual(['IMG_1.CR3', 'IMG_1 (2).CR3'])
  })
})

describe('copyFiles', () => {
  const items = [
    { path: 'Sharma/RAW/DSC_1.NEF', name: 'DSC_1.NEF', bytes: 5 },
    { path: 'Sharma/RAW/DSC_2.NEF', name: 'DSC_2.NEF', bytes: 5 },
    { path: 'Sharma/RAW/DSC_404.NEF', name: 'DSC_404.NEF', bytes: 5 },
  ]
  const drive = () => tree({ Sharma: { RAW: { 'DSC_1.NEF': 'raw-1', 'DSC_2.NEF': 'raw-2' } } })

  it('copies what exists and reports what is gone', async () => {
    const out: Tree = new Map()
    const seen: number[] = []
    const r = await copyFiles(dirHandle('B', drive()), dirHandle('out', out), items, { onProgress: d => seen.push(d) })
    expect(r).toMatchObject({ copied: 2, skipped: 0, stopped: false, failed: [{ path: 'Sharma/RAW/DSC_404.NEF', reason: 'missing' }] })
    expect(out.get('DSC_2.NEF')).toBe('raw-2')
    expect(seen).toEqual([1, 2, 3])
  })

  it('skips files already copied with the same size (resume)', async () => {
    const out = tree({ 'DSC_1.NEF': 'raw-1', 'DSC_2.NEF': 'ra' })
    const r = await copyFiles(dirHandle('B', drive()), dirHandle('out', out), items.slice(0, 2))
    expect(r).toMatchObject({ copied: 1, skipped: 1 })
    expect(out.get('DSC_2.NEF')).toBe('raw-2')
  })

  it('stops on a full destination and marks the rest', async () => {
    const r = await copyFiles(dirHandle('B', drive()), dirHandle('out', new Map(), { quotaAfter: 1 }), items)
    expect(r.copied).toBe(1)
    expect(r.stopped).toBe(true)
    expect(r.failed.map(f => f.reason)).toEqual(['full', 'full'])
  })

  it('honours stop', async () => {
    const signal = { aborted: false }
    const r = await copyFiles(dirHandle('B', drive()), dirHandle('out', new Map()), items, { signal, onProgress: () => (signal.aborted = true) })
    expect(r).toMatchObject({ copied: 1, stopped: true })
  })

  it('tells the drive root from a folder inside it', async () => {
    const root = dirHandle('B', drive())
    expect(await looksLikeRoot(root, items)).toBe(true)
    expect(await looksLikeRoot(await root.getDirectoryHandle!('Sharma'), items)).toBe(false)
  })
})
