import { useRef, useState, type ReactNode } from 'react'
import { Button } from '../../components/ui'
import { useT } from '../../lib/i18n'
import { MARKER_FILE, parseMarker, supportsFsa, type FsDirHandle } from '../scan'
import type { Drive } from '../types'
import { DRV } from './copy'
import { copyFiles, looksLikeRoot, pickFolder, type CopyGroup, type CopyResult } from './copyOut'
import { capacityText, nf } from './data'

type Run = { state: 'running'; done: number; total: number } | { state: 'done'; result: CopyResult } | { state: 'error'; message: string }

/** Step 1 picks the destination once; step 2 copies from each drive in turn. */
export function CopyChosen({ groups, drives, folderName }: { groups: CopyGroup[]; drives: Drive[]; folderName: string }) {
  const t = useT(DRV)
  const [dest, setDest] = useState<{ parent: string; dir: FsDirHandle } | null>(null)
  const [runs, setRuns] = useState<Record<string, Run>>({})
  const [destErr, setDestErr] = useState('')
  const stop = useRef({ aborted: false })
  const busy = Object.values(runs).some(r => r.state === 'running')
  const label = (id: string) => drives.find(d => d.id === id)?.label ?? id
  const setRun = (id: string, r: Run) => setRuns(s => ({ ...s, [id]: r }))

  const chooseDest = async () => {
    try {
      const parent = await pickFolder('readwrite', 'tce-copy-dest')
      setDestErr('')
      if (!parent?.getDirectoryHandle) return
      setDest({ parent: parent.name, dir: await parent.getDirectoryHandle(folderName, { create: true }) })
      setRuns({})
    } catch {
      setDestErr(t.cpError)
    }
  }

  const copyFrom = async (g: CopyGroup) => {
    if (!dest) return
    const drive = drives.find(d => d.id === g.driveId)
    const name = label(g.driveId)
    let root: FsDirHandle | null
    try {
      root = await pickFolder('read', 'tce-drive')
    } catch {
      return setRun(g.driveId, { state: 'error', message: t.cpError })
    }
    if (!root) return
    let marker = null
    try {
      marker = parseMarker(await (await (await root.getFileHandle(MARKER_FILE)).getFile()).text())
    } catch {
      marker = null
    }
    if (marker && drive?.markerId && marker.markerId !== drive.markerId) {
      const other = drives.find(d => d.markerId === marker.markerId)?.label || marker.label || root.name
      return setRun(g.driveId, { state: 'error', message: t.cpWrongDrive(other, name) })
    }
    if (!(await looksLikeRoot(root, g.items))) return setRun(g.driveId, { state: 'error', message: t.cpNotRoot(name) })
    stop.current = { aborted: false }
    setRun(g.driveId, { state: 'running', done: 0, total: g.items.length })
    const result = await copyFiles(root, dest.dir, g.items, {
      signal: stop.current,
      onProgress: done => setRun(g.driveId, { state: 'running', done, total: g.items.length }),
    })
    setRun(g.driveId, { state: 'done', result })
  }

  if (!supportsFsa()) {
    return (
      <Section title={t.cpTitle}>
        <p className="text-[13px] text-ink/55">{t.cpNoFsa}</p>
      </Section>
    )
  }

  return (
    <Section title={t.cpTitle}>
      <p className="text-[13px] leading-relaxed text-ink/55">{t.cpBody}</p>

      <div className="space-y-2">
        <p className="text-[13px] font-semibold text-ink">{t.cpStep1}</p>
        {dest ? (
          <p className="flex flex-wrap items-center gap-2 text-[13px] text-ink/70">
            <span className="min-w-0 break-words">{t.cpDest(dest.parent, folderName)}</span>
            <Button size="sm" variant="ghost" disabled={busy} onClick={chooseDest}>{t.cpChange}</Button>
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" variant="ink" iconLeft="inbox" onClick={chooseDest}>{t.cpChoose}</Button>
            <span className="text-[12.5px] text-ink/50">{t.cpInto(folderName)}</span>
          </div>
        )}
        {destErr && <p className="text-[12.5px] text-ruby">{destErr}</p>}
      </div>

      <div className="space-y-2">
        <p className={`text-[13px] font-semibold ${dest ? 'text-ink' : 'text-ink/40'}`}>{t.cpStep2}</p>
        <ul className="divide-y hairline rounded-2xl border hairline">
          {groups.map(g => {
            const r = runs[g.driveId]
            return (
              <li key={g.driveId} className="space-y-2 px-4 py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm" variant="outline" iconLeft="copy" disabled={!dest || busy} onClick={() => copyFrom(g)}>
                    {r?.state === 'done' ? t.cpAgain : t.cpFrom(g.files, label(g.driveId))}
                  </Button>
                  <span className="text-[12.5px] tabular-nums text-ink/50">{capacityText(g.bytes) || `${nf(g.bytes)} B`}</span>
                  {r?.state === 'running' && (
                    <>
                      <span className="text-[13px] tabular-nums text-ink">{t.cpRunning(r.done, r.total)}</span>
                      <Button size="sm" variant="ghost" onClick={() => (stop.current.aborted = true)}>{t.cpStop}</Button>
                    </>
                  )}
                </div>
                {dest && !r && <p className="text-[12px] text-ink/45">{t.cpPickHint(label(g.driveId))}</p>}
                {r?.state === 'running' && (
                  <div className="h-1.5 overflow-hidden rounded-full bg-ink/10">
                    <div className="h-full rounded-full bg-ruby transition-[width]" style={{ width: `${(r.done / Math.max(1, r.total)) * 100}%` }} />
                  </div>
                )}
                {r?.state === 'error' && <p className="text-[12.5px] text-ruby">{r.message}</p>}
                {r?.state === 'done' && <Outcome result={r.result} />}
              </li>
            )
          })}
        </ul>
      </div>
    </Section>
  )
}

function Outcome({ result: r }: { result: CopyResult }) {
  const t = useT(DRV)
  const missing = r.failed.filter(f => f.reason === 'missing').map(f => f.path)
  const failed = r.failed.filter(f => f.reason === 'error').map(f => f.path)
  const full = r.failed.some(f => f.reason === 'full')
  const list = (paths: string[]) => (
    <p className="max-h-28 overflow-y-auto break-words text-[12px] leading-relaxed text-ink/55" data-lenis-prevent>{paths.join(', ')}</p>
  )
  return (
    <div className="space-y-1.5 text-[12.5px]">
      <p className="font-medium text-ink">
        {t.cpDone(r.copied)} {r.skipped > 0 && <span className="font-normal text-ink/55">{t.cpSkipped(r.skipped)}</span>}
      </p>
      {full ? <p className="text-ruby">{t.cpFull}</p> : r.stopped && <p className="text-ink/60">{t.cpStopped}</p>}
      {missing.length > 0 && (<><p className="text-ruby">{t.cpMissing(missing.length)}</p>{list(missing)}</>)}
      {failed.length > 0 && (<><p className="text-ruby">{t.cpFailed(failed.length)}</p>{list(failed)}</>)}
    </div>
  )
}

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="space-y-4 border-t hairline pt-4">
    <p className="text-[14px] font-semibold text-ink">{title}</p>
    {children}
  </div>
)

export default CopyChosen
