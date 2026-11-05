import { useMemo, useRef, useState, type DragEvent } from 'react'
import { Icon } from '../../../components/Icon'
import { Button } from '../../../components/ui'
import { ConfirmModal, FormSelect, Panel, Progress } from '../../../pages/admin/kit'
import { useT } from '../../../lib/i18n'
import { toast } from '../../../lib/ui'
import { useStudioStore } from '../../store'
import type { StudioEvent } from '../../types'
import { ACCEPT_ATTR, dropChapter, ensureChapters, loadDone, loadOpenCount, moveChapter, queueTotals, renameChapter, type QueueItem } from '../../upload'
import { formatBytes } from '../../usage'
import { ProofThumb } from '../ProofThumb'
import { clearFinished, enqueue, fromDataTransfer, fromInput, pause, resume, retryFailed, useQueue } from '../uploadQueue'

const copy = {
  dropH: { en: 'Drop the card folder, RAWs or JPGs here', ta: 'கார்டு கோப்புறை, RAW அல்லது JPG-களை இங்கே இடுங்கள்' },
  dropB: {
    en: 'CR2, CR3, NEF, ARW, DNG, RAF, ORF, RW2 or JPG. Your browser makes a 2048 px watermarked proof of each; RAW files never leave your computer. Subfolders become chapters.',
    ta: 'CR2, CR3, NEF, ARW, DNG, RAF, ORF, RW2 அல்லது JPG. உங்கள் உலாவி ஒவ்வொன்றிலிருந்தும் நீர்க்குறியுடன் 2048 px படம் உருவாக்கும்; RAW கோப்புகள் உங்கள் கணினியை விட்டு வெளியேறாது. உட்கோப்புறைகள் அத்தியாயங்களாகும்.',
  },
  files: { en: 'Choose files', ta: 'கோப்புகளைத் தேர்வு செய்' },
  folder: { en: 'Choose folder', ta: 'கோப்புறையைத் தேர்வு செய்' },
  into: { en: 'Loose files go to', ta: 'தனிக் கோப்புகள் செல்லும் அத்தியாயம்' },
  resumeH: { en: 'The last upload did not finish', ta: 'கடந்த பதிவேற்றம் முடியவில்லை' },
  resumeB: { en: 'Drop the same folder again; finished files are skipped.', ta: 'அதே கோப்புறையை மீண்டும் இடுங்கள்; முடிந்த கோப்புகள் தவிர்க்கப்படும்.' },
  doneBefore: { en: 'files finished earlier in this browser', ta: 'கோப்புகள் முன்பே இந்த உலாவியில் முடிந்தன' },
  queue: { en: 'Upload queue', ta: 'பதிவேற்ற வரிசை' },
  pause: { en: 'Pause', ta: 'இடைநிறுத்து' },
  resume: { en: 'Resume', ta: 'தொடர்' },
  pausedNote: { en: 'Paused. Files already being prepared finish first.', ta: 'இடைநிறுத்தப்பட்டது. தயாராகும் கோப்புகள் முதலில் முடியும்.' },
  retry: { en: 'Retry failed', ta: 'தோல்வியானவற்றை மீண்டும் முயல்' },
  clear: { en: 'Clear finished', ta: 'முடிந்தவற்றை அகற்று' },
  done: { en: 'done', ta: 'முடிந்தது' },
  skipped: { en: 'skipped', ta: 'தவிர்க்கப்பட்டது' },
  failed: { en: 'failed', ta: 'தோல்வி' },
  waiting: { en: 'waiting', ta: 'காத்திருக்கிறது' },
  working: { en: 'preparing', ta: 'தயாராகிறது' },
  retrying: { en: 'retrying soon', ta: 'விரைவில் மீண்டும்' },
  dup: { en: 'Same photo already in this event', ta: 'இதே படம் ஏற்கனவே இந்த நிகழ்வில் உள்ளது' },
  finished: { en: 'Finished earlier', ta: 'முன்பே முடிந்தது' },
  spaceFlag: { en: 'space in name', ta: 'பெயரில் இடைவெளி' },
  spaces: {
    en: 'filenames contain a space. Lightroom’s filename search splits the pasted list on spaces, so those photos will not be found. Rename them in Lightroom (Library › Rename Photos) before you export, or find them by hand.',
    ta: 'கோப்புப் பெயர்களில் இடைவெளி உள்ளது. Lightroom தேடல் ஒட்டிய பட்டியலை இடைவெளியில் பிரிக்கும்; அந்தப் படங்கள் கிடைக்காது. ஏற்றுமதிக்கு முன் Lightroom-ல் (Library › Rename Photos) பெயர் மாற்றுங்கள், அல்லது கையால் தேடுங்கள்.',
  },
  ignored: { en: 'files ignored (not RAW or JPG)', ta: 'கோப்புகள் தவிர்க்கப்பட்டன (RAW/JPG அல்ல)' },
  addedChapters: { en: 'new chapters from folders', ta: 'கோப்புறைகளிலிருந்து புதிய அத்தியாயங்கள்' },
  added: { en: 'files added to the queue', ta: 'கோப்புகள் வரிசையில் சேர்க்கப்பட்டன' },
  nothing: { en: 'No RAW or JPG files in that drop', ta: 'அதில் RAW அல்லது JPG கோப்புகள் இல்லை' },
  more: { en: 'more in the queue', ta: 'மேலும் வரிசையில்' },
  chapters: { en: 'Chapters', ta: 'அத்தியாயங்கள்' },
  chaptersSub: { en: 'Rename, reorder or merge. Clients see them in this order.', ta: 'பெயர் மாற்று, வரிசைப்படுத்து, இணை. வாடிக்கையாளர்கள் இந்த வரிசையில் பார்ப்பார்கள்.' },
  photos: { en: 'photos', ta: 'படங்கள்' },
  mergeInto: { en: 'Merge into…', ta: 'இதில் இணை…' },
  mergeTitle: { en: 'Merge chapters?', ta: 'அத்தியாயங்களை இணைக்கவா?' },
  mergeBody: { en: 'All photos move into the other chapter and this chapter is removed.', ta: 'அனைத்துப் படங்களும் மற்ற அத்தியாயத்திற்கு நகரும்; இந்த அத்தியாயம் நீக்கப்படும்.' },
  merge: { en: 'Merge', ta: 'இணை' },
  delete: { en: 'Remove empty chapter', ta: 'காலி அத்தியாயத்தை நீக்கு' },
  addChapter: { en: 'Add chapter', ta: 'அத்தியாயம் சேர்' },
  proofs: { en: 'Proofs', ta: 'படங்கள்' },
  all: { en: 'All chapters', ta: 'அனைத்து அத்தியாயங்கள்' },
  remove: { en: 'Remove proof', ta: 'படத்தை நீக்கு' },
  removeSel: { en: 'Remove selected', ta: 'தேர்ந்தவற்றை நீக்கு' },
  removeTitle: { en: 'Remove these proofs?', ta: 'இந்தப் படங்களை நீக்கவா?' },
  removeBody: { en: 'The previews are deleted and any client picks on them are dropped. Your RAW files are not touched.', ta: 'முன்னோட்டங்கள் நீக்கப்படும்; அவற்றின் மீதான வாடிக்கையாளர் தேர்வுகளும் நீங்கும். உங்கள் RAW கோப்புகள் தொடப்படாது.' },
  showMore: { en: 'Show more', ta: 'மேலும் காட்டு' },
  noProofs: { en: 'No proofs yet', ta: 'இன்னும் படங்கள் இல்லை' },
  stored: { en: 'stored', ta: 'சேமிப்பு' },
  onDisk: { en: 'on your disk, not uploaded', ta: 'உங்கள் வட்டில், பதிவேற்றப்படவில்லை' },
  up: { en: 'Move up', ta: 'மேலே' },
  down: { en: 'Move down', ta: 'கீழே' },
  archived: { en: 'This event is archived: previews were deleted. The selection list is kept.', ta: 'இந்த நிகழ்வு காப்பகத்தில்: முன்னோட்டங்கள் நீக்கப்பட்டன. தேர்வுப் பட்டியல் உள்ளது.' },
}

const PAGE = 120

export function UploadTab({ event }: { event: StudioEvent }) {
  const t = useT(copy)
  const q = useQueue(event.id)
  const totals = queueTotals(q)
  const allProofs = useStudioStore(s => s.proofs)
  const updateEvent = useStudioStore(s => s.updateEvent)
  const updateProof = useStudioStore(s => s.updateProof)
  const removeProofs = useStudioStore(s => s.removeProofs)
  const proofs = useMemo(() => allProofs.filter(p => p.eventId === event.id).sort((a, b) => a.sort - b.sort), [allProofs, event.id])
  const chapters = useMemo(() => [...event.chapters].sort((a, b) => a.sort - b.sort), [event.chapters])
  const [target, setTarget] = useState(chapters[0]?.key ?? 'all')
  const [drag, setDrag] = useState(false)
  const [filter, setFilter] = useState('all')
  const [limit, setLimit] = useState(PAGE)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmRemove, setConfirmRemove] = useState<string[] | null>(null)
  const [merge, setMerge] = useState<{ from: string; into: string } | null>(null)
  const [newChapter, setNewChapter] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)
  const dirInput = useRef<HTMLInputElement>(null)
  const openBefore = useMemo(() => loadOpenCount(event.id), [event.id])
  const doneBefore = useMemo(() => Object.keys(loadDone(event.id)).length, [event.id])
  const counts = useMemo(() => {
    const m = new Map<string, number>()
    for (const p of proofs) m.set(p.chapter, (m.get(p.chapter) ?? 0) + 1)
    return m
  }, [proofs])

  const targetKey = chapters.some(c => c.key === target) ? target : chapters[0]?.key ?? 'all'
  const archived = event.status === 'archived'

  const take = (dropped: ReturnType<typeof fromInput>) => {
    if (!dropped.length) return
    const r = enqueue(event.id, dropped, targetKey)
    if (!r.added) return toast(t.nothing, 'ruby')
    const bits = [`${r.added} ${t.added}`]
    if (r.chaptersAdded) bits.push(`${r.chaptersAdded} ${t.addedChapters}`)
    if (r.ignored) bits.push(`${r.ignored} ${t.ignored}`)
    toast(bits.join(' · '))
  }

  const onDrop = async (e: DragEvent) => {
    e.preventDefault()
    setDrag(false)
    take(await fromDataTransfer(e.dataTransfer))
  }

  const shownItems = useMemo(() => {
    const rank: Record<QueueItem['status'], number> = { working: 0, failed: 1, queued: 2, skipped: 3, done: 4 }
    return [...q.items].sort((a, b) => rank[a.status] - rank[b.status]).slice(0, 80)
  }, [q.items])

  const statusText = (i: QueueItem) => {
    if (i.status === 'done') return t.done
    if (i.status === 'skipped') return `${t.skipped} · ${i.note === 'duplicate' ? t.dup : i.note === 'finished' ? t.finished : i.note ?? ''}`
    if (i.status === 'failed') return `${t.failed} · ${i.error ?? ''}`
    if (i.status === 'working') return t.working
    return i.error ? t.retrying : t.waiting
  }

  const visible = proofs.filter(p => filter === 'all' || p.chapter === filter)
  const chapterName = (k: string) => chapters.find(c => c.key === k)?.name ?? k

  const doMerge = () => {
    if (!merge) return
    for (const p of proofs) if (p.chapter === merge.from) updateProof(p.id, { chapter: merge.into })
    updateEvent(event.id, { chapters: dropChapter(event.chapters, merge.from) })
    if (filter === merge.from) setFilter('all')
    setMerge(null)
  }

  return (
    <div className="grid gap-6">
      {archived && <p className="rounded-2xl bg-ink/[0.05] px-4 py-3 text-[13.5px] text-ink/70">{t.archived}</p>}

      {!archived && (
        <div
          onDragOver={e => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          className={`rounded-[26px] border-2 border-dashed px-5 py-10 text-center transition md:py-14 ${drag ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-ink/15 bg-white'}`}
        >
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-ink/[0.05] text-ink/60"><Icon name="image" size={22} /></span>
          <p className="mt-4 text-[17px] font-semibold text-ink">{t.dropH}</p>
          <p className="mx-auto mt-2 max-w-xl text-[13.5px] leading-relaxed text-ink/55">{t.dropB}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button variant="ink" iconLeft="plus" onClick={() => fileInput.current?.click()}>{t.files}</Button>
            <Button variant="outline" iconLeft="grid" onClick={() => dirInput.current?.click()}>{t.folder}</Button>
          </div>
          <input ref={fileInput} type="file" multiple accept={ACCEPT_ATTR} className="hidden" onChange={e => { take(fromInput(e.target.files)); e.target.value = '' }} />
          <input ref={el => { dirInput.current = el; el?.setAttribute('webkitdirectory', '') }} type="file" multiple className="hidden" onChange={e => { take(fromInput(e.target.files)); e.target.value = '' }} />
          {chapters.length > 1 && (
            <div className="mx-auto mt-6 max-w-xs text-left">
              <FormSelect label={t.into} value={targetKey} onChange={setTarget} options={chapters.map(c => ({ value: c.key, label: c.name }))} />
            </div>
          )}
        </div>
      )}

      {!q.items.length && openBefore > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13.5px] text-amber-950">
          <Icon name="refresh" size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">{t.resumeH}</p>
            <p>{t.resumeB} {doneBefore > 0 && <span className="text-amber-900/70">({doneBefore} {t.doneBefore})</span>}</p>
          </div>
        </div>
      )}

      {q.items.length > 0 && (
        <Panel
          title={t.queue}
          icon="refresh"
          subtitle={`${totals.done} ${t.done} · ${totals.skipped} ${t.skipped} · ${totals.failed} ${t.failed} · ${totals.queued + totals.working} ${t.waiting}`}
          action={
            <div className="flex flex-wrap gap-2">
              {totals.active && (q.paused ? <Button size="sm" variant="ink" iconLeft="play" onClick={() => resume(event.id)}>{t.resume}</Button> : <Button size="sm" variant="outline" iconLeft="pause" onClick={() => pause(event.id)}>{t.pause}</Button>)}
              {totals.failed > 0 && <Button size="sm" variant="outline" iconLeft="refresh" onClick={() => retryFailed(event.id)}>{t.retry}</Button>}
              {!totals.active && <Button size="sm" variant="ghost" onClick={() => clearFinished(event.id)}>{t.clear}</Button>}
            </div>
          }
        >
          <div className="flex items-center gap-3">
            <Progress value={totals.fraction} className="flex-1" />
            <span className="w-12 text-right text-[12.5px] tabular-nums text-ink/60">{Math.round(totals.fraction * 100)}%</span>
          </div>
          {q.paused && totals.active && <p className="mt-2 text-[12.5px] text-ink/55">{t.pausedNote}</p>}
          {totals.spaces > 0 && (
            <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-[12.5px] leading-relaxed text-amber-950">
              <Icon name="info" size={14} className="mt-0.5 shrink-0" /><span><b>{totals.spaces}</b> {t.spaces}</span>
            </p>
          )}
          <ul className="mt-4 max-h-[360px] divide-y divide-ink/[0.05] overflow-y-auto" data-lenis-prevent>
            {shownItems.map(i => (
              <li key={i.id} className="flex items-center gap-3 py-2">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${i.status === 'done' ? 'bg-emerald-100 text-emerald-800' : i.status === 'failed' ? 'bg-ruby/10 text-ruby' : i.status === 'skipped' ? 'bg-ink/[0.05] text-ink/45' : 'bg-ink/[0.05] text-ink/60'}`}>
                  <Icon name={i.status === 'done' ? 'check' : i.status === 'failed' ? 'x' : i.status === 'skipped' ? 'minus' : i.status === 'working' ? 'refresh' : 'clock'} size={13} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-[13px] text-ink">
                    <span className="truncate">{i.name}</span>
                    {i.kind === 'raw' && <span className="rounded bg-ink/[0.06] px-1 text-[10px] font-semibold text-ink/55">RAW</span>}
                    {i.spaces && <span className="rounded bg-amber-100 px-1 text-[10px] font-semibold text-amber-900">{t.spaceFlag}</span>}
                  </p>
                  <p className={`truncate text-[11.5px] ${i.status === 'failed' ? 'text-ruby' : 'text-ink/45'}`}>{chapterName(i.chapter)} · {formatBytes(i.size)} · {statusText(i)}</p>
                  {i.status === 'working' && <Progress value={i.progress} className="mt-1.5" />}
                </div>
                {i.status === 'failed' && i.error && !/No usable preview|could not be decoded|no longer/.test(i.error) && (
                  <button type="button" onClick={() => retryFailed(event.id, i.id)} className="cursor-pointer text-[12px] font-medium text-ink/60 hover:text-ink">{t.retry}</button>
                )}
              </li>
            ))}
          </ul>
          {q.items.length > shownItems.length && <p className="mt-2 text-[12px] text-ink/45">+{q.items.length - shownItems.length} {t.more}</p>}
        </Panel>
      )}

      <Panel title={t.chapters} subtitle={t.chaptersSub} icon="rows">
        <ul className="grid gap-2">
          {chapters.map((c, i) => (
            <li key={c.key} className="flex flex-wrap items-center gap-2">
              <input
                defaultValue={c.name}
                key={`${c.key}-${c.name}`}
                onBlur={e => { if (e.target.value.trim() && e.target.value !== c.name) updateEvent(event.id, { chapters: renameChapter(event.chapters, c.key, e.target.value) }) }}
                onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                className="h-10 min-w-0 flex-1 rounded-xl border border-ink/10 px-3 text-[15px] outline-none focus:border-ruby md:text-[14px]"
              />
              <span className="w-20 text-right text-[12px] tabular-nums text-ink/45">{counts.get(c.key) ?? 0} {t.photos}</span>
              <button type="button" aria-label={t.up} disabled={i === 0} onClick={() => updateEvent(event.id, { chapters: moveChapter(event.chapters, c.key, -1) })} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-ink/50 hover:bg-ink/[0.05] disabled:opacity-30"><Icon name="chevronDown" size={15} className="rotate-180" /></button>
              <button type="button" aria-label={t.down} disabled={i === chapters.length - 1} onClick={() => updateEvent(event.id, { chapters: moveChapter(event.chapters, c.key, 1) })} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-ink/50 hover:bg-ink/[0.05] disabled:opacity-30"><Icon name="chevronDown" size={15} /></button>
              {chapters.length > 1 && (
                <select aria-label={t.mergeInto} value="" onChange={e => e.target.value && setMerge({ from: c.key, into: e.target.value })} className="h-9 max-w-[9rem] cursor-pointer rounded-full border border-ink/10 bg-white px-3 text-[12.5px] text-ink/70">
                  <option value="">{t.mergeInto}</option>
                  {chapters.filter(x => x.key !== c.key).map(x => <option key={x.key} value={x.key}>{x.name}</option>)}
                </select>
              )}
              {!counts.get(c.key) && chapters.length > 1 && (
                <button type="button" aria-label={t.delete} title={t.delete} onClick={() => updateEvent(event.id, { chapters: dropChapter(event.chapters, c.key) })} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-ink/45 hover:bg-ink/[0.05] hover:text-ruby"><Icon name="trash" size={15} /></button>
              )}
            </li>
          ))}
        </ul>
        <div className="mt-3 flex gap-2">
          <input value={newChapter} onChange={e => setNewChapter(e.target.value)} placeholder={t.addChapter} className="h-10 min-w-0 flex-1 rounded-xl border border-dashed border-ink/15 px-3 text-[15px] outline-none focus:border-ruby md:text-[14px]" />
          <Button size="sm" variant="outline" iconLeft="plus" onClick={() => {
            if (!newChapter.trim()) return
            updateEvent(event.id, { chapters: ensureChapters(event.chapters, [newChapter]).chapters })
            setNewChapter('')
          }}>{t.addChapter}</Button>
        </div>
      </Panel>

      <Panel
        title={t.proofs}
        subtitle={`${proofs.length} · ${formatBytes(proofs.reduce((n, p) => n + p.bytes, 0))} ${t.stored} · ${formatBytes(proofs.reduce((n, p) => n + p.originalBytes, 0))} ${t.onDisk}`}
        icon="grid"
        action={selected.size > 0 ? <Button size="sm" variant="outline" iconLeft="trash" onClick={() => setConfirmRemove([...selected])}>{t.removeSel} ({selected.size})</Button> : undefined}
      >
        {proofs.length === 0 ? (
          <p className="text-[13.5px] text-ink/50">{t.noProofs}</p>
        ) : (
          <>
            <div className="mb-4 max-w-xs">
              <FormSelect label={t.chapters} value={filter} onChange={v => { setFilter(v); setLimit(PAGE) }} options={[{ value: 'all', label: t.all }, ...chapters.map(c => ({ value: c.key, label: `${c.name} (${counts.get(c.key) ?? 0})` }))]} />
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
              {visible.slice(0, limit).map(p => {
                const on = selected.has(p.id)
                return (
                  <ProofThumb key={p.id} proof={p} className={on ? 'ring-2 ring-[var(--accent)]' : ''}>
                    <button
                      type="button"
                      aria-label={t.remove}
                      aria-pressed={on}
                      onClick={() => setSelected(s => { const n = new Set(s); if (n.has(p.id)) n.delete(p.id); else n.add(p.id); return n })}
                      className={`absolute right-1.5 top-1.5 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition ${on ? 'bg-[var(--accent)] text-[var(--accent-ink)]' : 'bg-white/85 text-ink/60 opacity-100 md:opacity-0 md:group-hover:opacity-100'}`}
                    >
                      <Icon name={on ? 'check' : 'x'} size={13} />
                    </button>
                  </ProofThumb>
                )
              })}
            </div>
            {visible.length > limit && <div className="mt-4 text-center"><Button size="sm" variant="outline" onClick={() => setLimit(l => l + PAGE)}>{t.showMore} ({visible.length - limit})</Button></div>}
          </>
        )}
      </Panel>

      <ConfirmModal
        open={!!confirmRemove}
        onClose={() => setConfirmRemove(null)}
        onConfirm={() => { if (confirmRemove) removeProofs(confirmRemove); setSelected(new Set()); setConfirmRemove(null) }}
        title={t.removeTitle}
        body={t.removeBody}
        confirmLabel={t.remove}
        icon="trash"
      />
      <ConfirmModal
        open={!!merge}
        onClose={() => setMerge(null)}
        onConfirm={doMerge}
        title={t.mergeTitle}
        body={merge ? `${chapterName(merge.from)} → ${chapterName(merge.into)}. ${t.mergeBody}` : ''}
        confirmLabel={t.merge}
        tone="ink"
      />
    </div>
  )
}
