import { useEffect, useRef, useState } from 'react'
import { Icon } from '../../components/Icon'
import { Button, Modal } from '../../components/ui'
import { Progress, Switch, TextInput } from '../../pages/admin/kit'
import { useT } from '../../lib/i18n'
import { toast } from '../../lib/ui'
import { uid, useStudioStore } from '../store'
import { formatBytes } from '../usage'
import { clearScanNote, needsMeta, newMarkerId, Pass2, pickFsa, runPass1, sourceFromFiles, supportsFsa, writeMarker, type Pass1Result, type Pass2Progress, type Source, type WalkProgress } from '../scan'
import type { Drive } from '../types'
import { DRV } from './copy'
import { invalidateAssets, nf, parseCapacity } from './data'

type Step = 'pick' | 'identify' | 'walk' | 'meta' | 'done' | 'error'

/**
 * Add / rescan / verify a drive: pick folder → say which drive it is →
 * pass 1 (names, sizes, dates) → optional pass 2 (EXIF, video headers,
 * fingerprints; pausable) → summary.
 */
export function ScanFlow({ open, onClose, studioId, driveId, verify = false, onDone }: { open: boolean; onClose: () => void; studioId: string; driveId?: string; verify?: boolean; onDone?: (driveId: string) => void }) {
  const t = useT(DRV)
  const allDrives = useStudioStore(s => s.drives)
  const drives = allDrives.filter(d => d.studioId === studioId)
  const { addDrive, updateDrive, recordScan } = useStudioStore.getState()

  const [step, setStep] = useState<Step>('pick')
  const [fsa, setFsa] = useState(false)
  const [src, setSrc] = useState<Source | null>(null)
  const [choice, setChoice] = useState<string>('new')
  const [form, setForm] = useState({ label: '', kept: '', capacity: '' })
  const [walkP, setWalkP] = useState<WalkProgress>({ files: 0, bytes: 0, dir: '' })
  const [p1, setP1] = useState<Pass1Result | null>(null)
  const [target, setTarget] = useState<Drive | null>(null)
  const [fps, setFps] = useState(true)
  const [p2, setP2] = useState<Pass2Progress | null>(null)
  const [paused, setPaused] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const abort = useRef<AbortController | null>(null)
  const pass2 = useRef<Pass2 | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => setFsa(supportsFsa()), [])
  useEffect(() => {
    if (!open) return
    setStep('pick')
    setSrc(null)
    setP1(null)
    setP2(null)
    setTarget(null)
    setPaused(false)
    setCancelled(false)
    setChoice(driveId ?? 'new')
    setForm({ label: '', kept: '', capacity: '' })
  }, [open, driveId])
  // Closing the modal stops whatever is running.
  useEffect(() => () => {
    abort.current?.abort()
    pass2.current?.stop()
  }, [])

  const close = () => {
    abort.current?.abort()
    pass2.current?.stop()
    onClose()
  }

  const known = src?.marker ? drives.find(d => d.markerId === src.marker!.markerId) : undefined
  const expected = driveId ? drives.find(d => d.id === driveId) : undefined

  const gotSource = (s: Source | null) => {
    if (!s) return
    setSrc(s)
    const k = s.marker ? drives.find(d => d.markerId === s.marker!.markerId) : undefined
    setChoice(k?.id ?? driveId ?? 'new')
    setForm(f => ({ ...f, label: s.marker?.label || s.rootName }))
    setStep('identify')
  }

  const pick = async (mode: 'read' | 'readwrite' = 'readwrite') => {
    if (fsa) {
      try {
        const s = await pickFsa(mode)
        setCancelled(!s)
        gotSource(s)
      } catch {
        toast(t.scanFailed, 'ruby')
      }
    } else inputRef.current?.click()
  }

  const capacity = parseCapacity(form.capacity)
  const canStart = choice !== 'new' || (form.label.trim() && capacity !== null)

  const start = async () => {
    if (!src) return
    // Resolve the drive record.
    let drive: Drive
    if (choice === 'new') {
      drive = await addDrive({
        studioId, label: form.label.trim(), markerId: src.marker?.markerId ?? newMarkerId(), kept: form.kept.trim(), notes: '', capacityBytes: capacity ?? undefined,
        usedBytes: 0, fileCount: 0, photoCount: 0, videoCount: 0, rawCount: 0, status: 'ok',
      })
    } else {
      drive = drives.find(d => d.id === choice)!
      // The drive already carries a marker from elsewhere: adopt it rather than rewrite the disk.
      if (src.marker && src.marker.markerId !== drive.markerId) {
        updateDrive(drive.id, { markerId: src.marker.markerId })
        drive = { ...drive, markerId: src.marker.markerId }
      }
    }
    if (!drive) return
    setTarget(drive)
    if (src.reader === 'fsa' && !src.marker) {
      const ok = await writeMarker(src, { markerId: drive.markerId, studioId, label: drive.label, createdAt: new Date().toISOString() })
      if (!ok) toast(t.markerFailed)
    }
    setStep('walk')
    const ac = new AbortController()
    abort.current = ac
    try {
      const r = await runPass1(src, drive.id, { signal: ac.signal, onProgress: setWalkP, scanId: uid('sc') })
      abort.current = null
      invalidateAssets(drive.id)
      const cur = useStudioStore.getState().drives.find(d => d.id === drive.id)
      updateDrive(drive.id, { ...r.counts, lastScanAt: r.scan.at, status: cur?.status === 'retired' ? 'retired' : 'ok' })
      if (!verify) recordScan(r.scan)
      setP1(r)
      const pending = r.assets.filter(a => needsMeta(a, verify)).length
      if (pending) setStep('meta')
      else finish(drive.id, r)
    } catch (e) {
      abort.current = null
      if ((e as DOMException)?.name === 'AbortError') return
      setStep('error')
    }
  }

  const finish = (id: string, r: Pass1Result | null, mismatched = 0) => {
    clearScanNote(id)
    if (verify && r) recordScan({ ...r.scan, changed: r.scan.changed + mismatched })
    invalidateAssets(id)
    setStep('done')
    onDone?.(id)
  }

  const runMeta = async () => {
    if (!p1 || !target) return
    const queue = p1.assets.filter(a => needsMeta(a, verify))
    const job = new Pass2(queue, p1.files, { verify, fingerprints: fps, onProgress: setP2 })
    pass2.current = job
    setP2({ ...job.progress })
    await job.run()
    pass2.current = null
    finish(target.id, p1, job.progress.mismatched)
  }

  const stepTitle = verify ? t.verifyTitle : t.scanTitle

  return (
    <Modal open={open} onClose={close} label={stepTitle}>
      <div className="p-6 pt-7 md:p-8">
        <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-ink/[0.06] text-ink">
          <Icon name={step === 'done' ? 'check' : verify ? 'eye' : 'refresh'} size={20} />
        </span>
        <h2 className="pr-10 text-[20px] font-semibold tracking-tight text-ink">{stepTitle}</h2>

        {step === 'pick' && (
          <div className="mt-3 space-y-4 text-[14px] leading-relaxed text-ink/60">
            <p>{t.pickBody}</p>
            {verify && <p>{t.verifyHint}</p>}
            <p className="rounded-2xl bg-mist px-4 py-3 text-[13px]">{fsa ? t.pickWrite : t.pickInput}</p>
            <input
              ref={el => {
                inputRef.current = el
                el?.setAttribute('webkitdirectory', '')
                el?.setAttribute('directory', '')
              }}
              type="file"
              multiple
              className="hidden"
              onChange={e => {
                gotSource(e.target.files ? sourceFromFiles(e.target.files) : null)
                e.target.value = ''
              }}
            />
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={close}>{t.cancel}</Button>
              {fsa && cancelled && <Button variant="outline" onClick={() => pick('read')}>{t.readOnly}</Button>}
              <Button variant="ink" iconLeft="inbox" onClick={() => pick()}>{t.choose}</Button>
            </div>
          </div>
        )}

        {step === 'identify' && src && (
          <div className="mt-3 space-y-4">
            <p className="text-[13px] text-ink/50">
              {t.folder}: <span className="font-medium text-ink">{src.rootName}</span>
            </p>
            {known ? (
              <div className="rounded-2xl bg-mist px-4 py-3">
                <p className="text-[14px] font-semibold text-ink">{t.recognised(known.label)}</p>
                <p className="mt-0.5 text-[13px] text-ink/55">{t.recognisedBody}</p>
                {expected && expected.id !== known.id && <p className="mt-2 text-[13px] font-medium text-ruby">{t.mismatch(known.label, expected.label)}</p>}
              </div>
            ) : (
              <>
                <div>
                  <p className="text-[14px] font-semibold text-ink">{t.whichDrive}</p>
                  <p className="mt-0.5 text-[13px] text-ink/55">{src.canWrite || src.marker ? t.whichBodyNew : t.whichBodyNoWrite}</p>
                </div>
                <div className="max-h-56 space-y-1.5 overflow-y-auto" data-lenis-prevent>
                  {[...drives.filter(d => d.status !== 'retired'), ...drives.filter(d => d.status === 'retired')].map(d => (
                    <Choice key={d.id} active={choice === d.id} onClick={() => setChoice(d.id)} title={d.label} sub={d.kept} />
                  ))}
                  <Choice active={choice === 'new'} onClick={() => setChoice('new')} title={t.newDrive} />
                </div>
                {choice === 'new' && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextInput className="sm:col-span-2" label={t.label} value={form.label} onChange={v => setForm({ ...form, label: v })} placeholder={t.labelPh} required />
                    <TextInput label={t.kept} value={form.kept} onChange={v => setForm({ ...form, kept: v })} placeholder={t.keptPh} />
                    <div>
                      <TextInput label={t.capacity} value={form.capacity} onChange={v => setForm({ ...form, capacity: v })} placeholder={t.capacityPh} />
                      {capacity === null && <p className="mt-1 text-[12px] text-ruby">{t.capacityBad}</p>}
                    </div>
                  </div>
                )}
              </>
            )}
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={close}>{t.cancel}</Button>
              <Button variant="ink" onClick={start} disabled={!canStart}>{t.startScan}</Button>
            </div>
          </div>
        )}

        {step === 'walk' && (
          <div className="mt-4 space-y-3">
            <p className="text-[14px] text-ink/60">{t.walking}</p>
            <Progress value={0.15 + 0.7 * (1 - 1 / (1 + walkP.files / 4000))} />
            <p className="text-[13px] tabular-nums text-ink">
              {nf(walkP.files)} {t.files} · {formatBytes(walkP.bytes)}
            </p>
            <p className="truncate text-[12px] text-ink/40">{walkP.dir || '/'}</p>
            <div className="flex justify-end pt-2">
              <Button variant="ghost" onClick={close}>{t.stop}</Button>
            </div>
          </div>
        )}

        {step === 'meta' && p1 && (
          <div className="mt-3 space-y-4">
            <Summary p1={p1} />
            {!p2 ? (
              <>
                <p className="text-[14px] leading-relaxed text-ink/60">{t.metaBody(p1.assets.filter(a => needsMeta(a, verify)).length)}</p>
                {!verify && <Switch checked={fps} onChange={setFps} label={t.fpToggle} />}
                <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                  {!verify && <Button variant="ghost" onClick={() => target && finish(target.id, p1)}>{t.skip}</Button>}
                  <Button variant="ink" onClick={runMeta}>{verify ? t.verify : t.readMeta}</Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-[14px] font-semibold text-ink">{t.metaTitle}</p>
                <Progress value={p2.total ? p2.done / p2.total : 1} />
                <p className="text-[13px] tabular-nums text-ink/60">
                  {nf(p2.done)} / {nf(p2.total)}
                  {verify && p2.mismatched > 0 && <span className="ml-2 font-medium text-ruby">· {nf(p2.mismatched)} {t.changed}</span>}
                </p>
                <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                  <Button variant="ghost" onClick={() => pass2.current?.stop()}>{t.stop}</Button>
                  <Button
                    variant="outline"
                    iconLeft={paused ? 'play' : 'pause'}
                    onClick={() => {
                      const j = pass2.current
                      if (!j) return
                      if (j.isPaused) j.resume()
                      else j.pause()
                      setPaused(j.isPaused)
                    }}
                  >
                    {paused ? t.resume : t.pause}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {step === 'done' && (
          <div className="mt-3 space-y-4">
            <p className="text-[14px] font-semibold text-ink">{t.doneTitle}</p>
            {p1 && <Summary p1={p1} />}
            {verify && p2 && <p className={`text-[14px] ${p2.mismatched ? 'font-medium text-ruby' : 'text-ink/60'}`}>{p2.mismatched ? t.mismatched(p2.mismatched) : t.allGood}</p>}
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={close}>{t.close}</Button>
              {target && !driveId && <Button variant="ink" to={`/studio/drives/${target.id}`} onClick={onClose}>{t.viewDrive}</Button>}
            </div>
          </div>
        )}

        {step === 'error' && (
          <div className="mt-3 space-y-4">
            <p className="text-[14px] text-ruby">{t.scanFailed}</p>
            <div className="flex justify-end">
              <Button variant="ghost" onClick={close}>{t.close}</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

function Choice({ active, onClick, title, sub }: { active: boolean; onClick: () => void; title: string; sub?: string }) {
  return (
    <button type="button" onClick={onClick} className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${active ? 'border-ink bg-ink/[0.03]' : 'border-ink/10 hover:border-ink/30'}`}>
      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${active ? 'border-ink' : 'border-ink/25'}`}>{active && <span className="h-2 w-2 rounded-full bg-ink" />}</span>
      <span className="min-w-0">
        <span className="block truncate text-[14px] font-medium text-ink">{title}</span>
        {sub && <span className="block truncate text-[12px] text-ink/45">{sub}</span>}
      </span>
    </button>
  )
}

function Summary({ p1 }: { p1: Pass1Result }) {
  const t = useT(DRV)
  const s = p1.scan
  return (
    <div className="grid grid-cols-2 gap-2 rounded-2xl bg-mist p-4 text-[13px] sm:grid-cols-4">
      <Stat v={nf(p1.counts.fileCount)} l={t.files} />
      <Stat v={`+${nf(s.added)}`} l={t.added} />
      <Stat v={`−${nf(s.removed)}`} l={t.removed} />
      <Stat v={nf(s.changed)} l={t.changed} />
    </div>
  )
}

const Stat = ({ v, l }: { v: string; l: string }) => (
  <div>
    <p className="text-[16px] font-semibold tabular-nums text-ink">{v}</p>
    <p className="text-ink/50">{l}</p>
  </div>
)
