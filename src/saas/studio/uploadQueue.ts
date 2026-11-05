import { create } from 'zustand'
import { useStudioStore, uid } from '../store'
import { hasSpace } from '../lightroom'
import type { Proof } from '../types'
import {
  EMPTY_QUEUE, UploadError, chapterFromPath, classify, ensureChapters, fileSig, isDuplicate, loadDone, nextToStart, nextWakeAt, prepareFile, queueReducer,
  queueTotals, rootOf, saveDone, saveOpenCount, sendPreview, splitName, type QueueAction, type QueueItem, type QueueState,
} from '../upload'

/**
 * Runs the upload queue for each event. Lives at module level so switching
 * tabs or pages inside the studio does not stop an upload. File objects are
 * held in memory only; after a reload the photographer drops the folder again
 * and finished files are skipped via the per-event done-list.
 */

export interface DroppedFile {
  file: File
  /** Relative path inside the drop ("Wedding/Ceremony/DSC_1.NEF") or the bare name. */
  path: string
}

interface QStore {
  queues: Record<string, QueueState>
}

export const useUploadQueues = create<QStore>(() => ({ queues: {} }))

const files = new Map<string, File>()
const timers = new Map<string, number>()
/** "filename|serial" claimed by files in flight, per event: closes the race between two copies processed at once. */
const claimed = new Map<string, { filename: string; serial?: string; itemId: string }[]>()
const pendingProofs = new Map<string, Proof[]>()
const flushTimers = new Map<string, number>()
const uploadedSinceLog = new Map<string, number>()

const getQ = (eventId: string) => useUploadQueues.getState().queues[eventId] ?? EMPTY_QUEUE

function dispatch(eventId: string, a: QueueAction) {
  useUploadQueues.setState(s => ({ queues: { ...s.queues, [eventId]: queueReducer(s.queues[eventId] ?? EMPTY_QUEUE, a) } }))
  const t = queueTotals(getQ(eventId))
  saveOpenCount(eventId, t.queued + t.working)
}

export const useQueue = (eventId: string) => useUploadQueues(s => s.queues[eventId] ?? EMPTY_QUEUE)

export function anyUploadActive(): boolean {
  return Object.values(useUploadQueues.getState().queues).some(q => q.items.some(i => i.status === 'queued' || i.status === 'working'))
}

export interface EnqueueResult {
  added: number
  ignored: number
  chaptersAdded: number
}

/** Adds dropped files to the event's queue; creates chapters for new folder names. */
export function enqueue(eventId: string, dropped: DroppedFile[], targetChapter: string): EnqueueResult {
  const st = useStudioStore.getState()
  const ev = st.events.find(e => e.id === eventId)
  if (!ev) return { added: 0, ignored: dropped.length, chaptersAdded: 0 }
  const usable = dropped.filter(d => classify(d.file.name))
  const ignored = dropped.length - usable.length
  const roots = new Set(usable.map(d => rootOf(d.path)).filter(Boolean))
  const multiRoot = roots.size > 1
  const names = usable.map(d => chapterFromPath(d.path, multiRoot)).filter((n): n is string => !!n)
  const { chapters, keyOf, added: chaptersAdded } = ensureChapters(ev.chapters, names)
  if (chaptersAdded) st.updateEvent(eventId, { chapters })

  const done = loadDone(eventId)
  const proofIds = new Set(st.proofs.filter(p => p.eventId === eventId).map(p => p.id))
  const q = getQ(eventId)
  const inQueue = new Set(q.items.filter(i => i.status !== 'failed').map(i => fileSig(i.path, i.size)))

  const items: QueueItem[] = []
  for (const d of usable) {
    const sig = fileSig(d.path, d.file.size)
    if (inQueue.has(sig)) continue
    inQueue.add(sig)
    const name = chapterFromPath(d.path, multiRoot)
    const it: QueueItem = {
      id: uid('up'),
      name: d.file.name,
      path: d.path,
      kind: classify(d.file.name)!,
      size: d.file.size,
      chapter: (name && keyOf[name]) || targetChapter,
      status: 'queued',
      progress: 0,
      attempts: 0,
      spaces: hasSpace(splitName(d.file.name).stem),
    }
    const prev = done[sig]
    if (prev && proofIds.has(prev)) {
      it.status = 'skipped'
      it.progress = 1
      it.note = 'finished'
      it.proofId = prev
    } else files.set(it.id, d.file)
    items.push(it)
  }
  if (items.length) dispatch(eventId, { type: 'add', items })
  pump(eventId)
  return { added: items.length, ignored, chaptersAdded }
}

export const pause = (eventId: string) => dispatch(eventId, { type: 'pause' })
export function resume(eventId: string) {
  dispatch(eventId, { type: 'resume' })
  pump(eventId)
}
export function retryFailed(eventId: string, id?: string) {
  // Failed files whose File object is gone (dropped before a reload) cannot retry.
  dispatch(eventId, { type: 'retry', id })
  pump(eventId)
}
export function clearFinished(eventId: string) {
  for (const i of getQ(eventId).items) if (i.status !== 'queued' && i.status !== 'working') files.delete(i.id)
  dispatch(eventId, { type: 'clearFinished' })
}

function pump(eventId: string) {
  const now = Date.now()
  const q = getQ(eventId)
  for (const id of nextToStart(q, now)) {
    if (!files.has(id)) {
      dispatch(eventId, { type: 'fail', id, error: 'File no longer available. Drop it again.', transient: false, now })
      continue
    }
    dispatch(eventId, { type: 'start', id })
    void run(eventId, id)
  }
  window.clearTimeout(timers.get(eventId))
  const wake = nextWakeAt(getQ(eventId), now)
  if (wake) timers.set(eventId, window.setTimeout(() => pump(eventId), wake - now + 20))
  maybeLogUploaded(eventId)
}

function claim(eventId: string, itemId: string, filename: string, serial?: string): string | null {
  const st = useStudioStore.getState()
  const existing = [...st.proofs.filter(p => p.eventId === eventId), ...(pendingProofs.get(eventId) ?? [])]
  const inflight = claimed.get(eventId) ?? []
  if (isDuplicate(existing, filename, serial) || isDuplicate(inflight.filter(c => c.itemId !== itemId), filename, serial)) return 'duplicate'
  claimed.set(eventId, [...inflight, { filename, serial, itemId }])
  return null
}

const release = (eventId: string, itemId: string) => claimed.set(eventId, (claimed.get(eventId) ?? []).filter(c => c.itemId !== itemId))

async function run(eventId: string, itemId: string) {
  const file = files.get(itemId)!
  const item = getQ(eventId).items.find(i => i.id === itemId)!
  const st = useStudioStore.getState()
  const ev = st.events.find(e => e.id === eventId)
  const studio = st.studios.find(s => s.id === ev?.studioId)
  let finished = true
  try {
    if (!ev || !studio) throw new UploadError('This event no longer exists.')
    const res = await prepareFile(file, {
      watermark: studio.watermark,
      onProgress: p => dispatch(eventId, { type: 'progress', id: itemId, value: p }),
      claim: (filename, serial) => claim(eventId, itemId, filename, serial),
    })
    if (res.kind === 'skip') {
      dispatch(eventId, { type: 'skip', id: itemId, note: res.note })
      return
    }
    const { preview, thumb, w, h, meta } = res.data
    const proofId = uid('pf')
    const keys = await sendPreview(eventId, proofId, preview, thumb)
    const { stem, ext } = splitName(file.name)
    const proof: Proof = {
      id: proofId,
      eventId,
      chapter: item.chapter,
      filename: stem,
      ext,
      source: item.kind,
      camera: meta.camera,
      serial: meta.serial,
      takenAt: meta.takenAt,
      w,
      h,
      bytes: preview.size + thumb.size,
      originalBytes: file.size,
      previewKey: keys.previewKey,
      thumbKey: keys.thumbKey,
      url: keys.url,
      thumbUrl: keys.thumbUrl,
      sort: 0,
    }
    pendingProofs.set(eventId, [...(pendingProofs.get(eventId) ?? []), proof])
    scheduleFlush(eventId)
    const done = loadDone(eventId)
    done[fileSig(item.path, item.size)] = proofId
    saveDone(eventId, done)
    uploadedSinceLog.set(eventId, (uploadedSinceLog.get(eventId) ?? 0) + 1)
    dispatch(eventId, { type: 'done', id: itemId, proofId })
  } catch (e) {
    const err = e instanceof UploadError ? e : new UploadError(e instanceof Error ? e.message : 'Something went wrong', true)
    dispatch(eventId, { type: 'fail', id: itemId, error: err.message, transient: err.transient, now: Date.now() })
    finished = getQ(eventId).items.find(i => i.id === itemId)?.status === 'failed'
  } finally {
    // Keep the claim while the proof waits in pendingProofs (it is checked there too).
    release(eventId, itemId)
    if (finished) files.delete(itemId)
    pump(eventId)
  }
}

function scheduleFlush(eventId: string) {
  if (flushTimers.has(eventId)) return
  flushTimers.set(eventId, window.setTimeout(() => flush(eventId), 400))
}

/** Adds finished proofs to the store in batches, in capture order, after the existing ones. */
function flush(eventId: string) {
  flushTimers.delete(eventId)
  const batch = pendingProofs.get(eventId) ?? []
  if (!batch.length) return
  pendingProofs.delete(eventId)
  const st = useStudioStore.getState()
  let sort = st.proofs.filter(p => p.eventId === eventId).reduce((m, p) => Math.max(m, p.sort), -1) + 1
  const ordered = [...batch].sort((a, b) => (a.takenAt ?? '').localeCompare(b.takenAt ?? '') || a.filename.localeCompare(b.filename))
  st.addProofs(eventId, ordered.map(p => ({ ...p, sort: sort++ })))
  maybeLogUploaded(eventId)
}

function maybeLogUploaded(eventId: string) {
  const n = uploadedSinceLog.get(eventId) ?? 0
  if (!n || queueTotals(getQ(eventId)).active || pendingProofs.get(eventId)?.length) return
  uploadedSinceLog.delete(eventId)
  useStudioStore.getState().logActivity(eventId, 'uploaded', `${n} proofs`)
}

// ─── Folder drop helpers ─────────────────────────────────────────────────────

/** Files from <input type=file webkitdirectory> or a plain multi-file input. */
export function fromInput(list: FileList | null): DroppedFile[] {
  if (!list) return []
  return [...list].map(f => ({ file: f, path: (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name }))
}

type Entry = { isFile: boolean; isDirectory: boolean; name: string; fullPath: string }
type FileEntry = Entry & { file: (ok: (f: File) => void, err: (e: unknown) => void) => void }
type DirEntry = Entry & { createReader: () => { readEntries: (ok: (es: Entry[]) => void, err: (e: unknown) => void) => void } }

async function walkEntry(entry: Entry, out: DroppedFile[]) {
  if (entry.isFile) {
    const f = await new Promise<File | null>(res => (entry as FileEntry).file(res, () => res(null)))
    if (f) out.push({ file: f, path: entry.fullPath.replace(/^\//, '') || f.name })
    return
  }
  if (!entry.isDirectory) return
  const reader = (entry as DirEntry).createReader()
  // readEntries returns at most ~100 entries per call; keep reading until empty.
  for (;;) {
    const batch = await new Promise<Entry[]>(res => reader.readEntries(res, () => res([])))
    if (!batch.length) break
    for (const e of batch) await walkEntry(e, out)
  }
}

/** Files and folders from a drag-and-drop, with folder paths kept. */
export async function fromDataTransfer(dt: DataTransfer): Promise<DroppedFile[]> {
  const items = [...dt.items].filter(i => i.kind === 'file')
  const entries = items.map(i => (i as DataTransferItem & { webkitGetAsEntry?: () => Entry | null }).webkitGetAsEntry?.() ?? null)
  if (!entries.some(Boolean)) return fromInput(dt.files)
  // Everything on the DataTransfer must be taken before the first await.
  const loose = items.map((i, k) => (entries[k] ? null : i.getAsFile()))
  const out: DroppedFile[] = []
  for (let k = 0; k < entries.length; k++) {
    const e = entries[k]
    const f = loose[k]
    if (e) await walkEntry(e, out)
    else if (f) out.push({ file: f, path: f.name })
  }
  return out
}
