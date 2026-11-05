import { useMemo, useState } from 'react'
import { Icon } from '../../../components/Icon'
import { Button } from '../../../components/ui'
import { ConfirmModal, FormSelect, Panel } from '../../../pages/admin/kit'
import { useT } from '../../../lib/i18n'
import { toast } from '../../../lib/ui'
import { exportGroups, hasSpace, selectionCsv, selectionTxt } from '../../lightroom'
import { useStudioStore } from '../../store'
import type { StudioEvent } from '../../types'
import { ProofThumb } from '../ProofThumb'
import { downloadText, fileSafe } from '../shared'
import { SelectionLocator } from '../../drives/SelectionLocator'

const copy = {
  none: { en: 'No photos chosen yet', ta: 'இன்னும் படங்கள் தேர்வு செய்யப்படவில்லை' },
  noneB: { en: 'When your client hearts photos they appear here.', ta: 'வாடிக்கையாளர் படங்களைத் தேர்ந்ததும் இங்கே தோன்றும்.' },
  lr: { en: 'Copy for Lightroom', ta: 'Lightroom-க்கு நகலெடு' },
  lrSub: { en: 'Paste into Library › Filter bar › Text › Filename › Contains.', ta: 'Library › Filter bar › Text › Filename › Contains-ல் ஒட்டுங்கள்.' },
  copied: { en: 'Copied. Paste it into the Lightroom filter.', ta: 'நகலெடுக்கப்பட்டது. Lightroom வடிகட்டியில் ஒட்டுங்கள்.' },
  split: {
    en: 'Two or more cameras produced the same filenames, so the list is split per camera body. Filter each camera’s folder in Lightroom with its own line, otherwise the other body’s photo with the same name shows up too.',
    ta: 'இரண்டு அல்லது அதிக கேமராக்கள் ஒரே கோப்புப் பெயர்களை உருவாக்கின; எனவே பட்டியல் கேமரா வாரியாகப் பிரிக்கப்பட்டது. ஒவ்வொரு கேமராவின் கோப்புறையையும் அதன் வரியால் வடிகட்டுங்கள், இல்லையெனில் மற்ற கேமராவின் அதே பெயர் படமும் வரும்.',
  },
  photos: { en: 'photos', ta: 'படங்கள்' },
  spaces: { en: 'These names contain a space, which Lightroom’s search splits on. Find them by hand:', ta: 'இந்தப் பெயர்களில் இடைவெளி உள்ளது; Lightroom தேடல் அதில் பிரியும். கையால் தேடுங்கள்:' },
  txt: { en: 'Download TXT', ta: 'TXT பதிவிறக்கு' },
  csv: { en: 'Download CSV', ta: 'CSV பதிவிறக்கு' },
  chosen: { en: 'Chosen photos', ta: 'தேர்ந்த படங்கள்' },
  by: { en: 'by', ta: '' },
  actions: { en: 'Gallery', ta: 'காட்சியகம்' },
  reopen: { en: 'Reopen for', ta: 'மீண்டும் திறக்கும் நாட்கள்' },
  reopenBtn: { en: 'Reopen', ta: 'மீண்டும் திற' },
  reopened: { en: 'Gallery reopened', ta: 'காட்சியகம் மீண்டும் திறக்கப்பட்டது' },
  close: { en: 'Close gallery', ta: 'காட்சியகத்தை மூடு' },
  closed: { en: 'Gallery closed', ta: 'காட்சியகம் மூடப்பட்டது' },
  archive: { en: 'Archive', ta: 'காப்பகப்படுத்து' },
  archiveTitle: { en: 'Archive this event?', ta: 'இந்த நிகழ்வைக் காப்பகப்படுத்தவா?' },
  archiveBody: {
    en: 'All previews are deleted from storage and the client link stops showing photos. The selection list, notes and filenames are kept, so you can still copy it for Lightroom.',
    ta: 'அனைத்து முன்னோட்டங்களும் சேமிப்பிலிருந்து நீக்கப்படும்; வாடிக்கையாளர் இணைப்பில் படங்கள் தெரியாது. தேர்வுப் பட்டியல், குறிப்புகள், கோப்புப் பெயர்கள் இருக்கும்; Lightroom-க்கு நகலெடுக்கலாம்.',
  },
  days: { en: 'days', ta: 'நாட்கள்' },
  archivedNote: { en: 'Archived: previews deleted, list kept.', ta: 'காப்பகம்: முன்னோட்டங்கள் நீக்கப்பட்டன, பட்டியல் உள்ளது.' },
}

const REOPEN_DAYS = ['3', '7', '14'] as const

export function SelectionTab({ event: ev }: { event: StudioEvent }) {
  const t = useT(copy)
  const allProofs = useStudioStore(s => s.proofs)
  const picks = useStudioStore(s => s.picks[ev.id])
  const reopenEvent = useStudioStore(s => s.reopenEvent)
  const closeEvent = useStudioStore(s => s.closeEvent)
  const archiveEvent = useStudioStore(s => s.archiveEvent)
  const logActivity = useStudioStore(s => s.logActivity)
  const [days, setDays] = useState<(typeof REOPEN_DAYS)[number]>('7')
  const [confirmArchive, setConfirmArchive] = useState(false)

  const pickList = useMemo(() => picks ?? [], [picks])
  const selected = useMemo(() => {
    const ids = new Set(pickList.map(p => p.proofId))
    return allProofs.filter(p => p.eventId === ev.id && ids.has(p.id)).sort((a, b) => a.sort - b.sort)
  }, [allProofs, pickList, ev.id])
  const pickOf = useMemo(() => new Map(pickList.map(p => [p.proofId, p])), [pickList])
  const groups = useMemo(() => exportGroups(selected), [selected])
  const spaced = selected.filter(p => hasSpace(p.filename))
  const chapterName = (k: string) => ev.chapters.find(c => c.key === k)?.name ?? k
  const base = fileSafe(ev.title)

  const copyLine = (line: string) => {
    navigator.clipboard?.writeText(line).then(() => toast(t.copied)).catch(() => {})
    logActivity(ev.id, 'exported', 'Lightroom')
  }

  return (
    <div className="grid gap-6">
      {/* Lightroom export */}
      {selected.length > 0 && (
        <Panel title={t.lr} subtitle={t.lrSub} icon="copy">
          {groups.length > 1 && <p className="mb-4 flex items-start gap-2 rounded-xl bg-sky-50 px-3 py-2 text-[13px] leading-relaxed text-sky-950"><Icon name="info" size={14} className="mt-0.5 shrink-0" />{t.split}</p>}
          <div className="grid gap-4">
            {groups.map(g => (
              <div key={g.label}>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <p className="text-[13px] font-medium text-ink">{groups.length > 1 ? g.label : `${g.proofs.length} ${t.photos}`}{groups.length > 1 && <span className="font-normal text-ink/45"> · {g.proofs.length} {t.photos}</span>}</p>
                  <Button size="sm" variant="ink" iconLeft="copy" onClick={() => copyLine(g.line)}>{t.lr}</Button>
                </div>
                <p className="max-h-28 overflow-y-auto break-words rounded-xl bg-ink/[0.04] px-3 py-2 font-mono text-[12px] leading-relaxed text-ink/80" data-lenis-prevent>{g.line}</p>
              </div>
            ))}
          </div>
          {spaced.length > 0 && (
            <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-[12.5px] leading-relaxed text-amber-950">{t.spaces} <span className="font-mono">{spaced.map(p => p.filename).join(' · ')}</span></p>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" iconLeft="receipt" onClick={() => downloadText(`${base}-selection.txt`, selectionTxt(selected))}>{t.txt}</Button>
            <Button size="sm" variant="outline" iconLeft="receipt" onClick={() => downloadText(`${base}-selection.csv`, selectionCsv(selected, pickList, chapterName), 'text/csv')}>{t.csv}</Button>
          </div>
        </Panel>
      )}

      {selected.length > 0 && <SelectionLocator studioId={ev.studioId} filenames={selected.map(p => p.filename)} folderName={`${base}-chosen`} />}

      {/* Gallery actions */}
      <Panel title={t.actions} icon="settings">
        {ev.status === 'archived' ? (
          <p className="text-[13.5px] text-ink/60">{t.archivedNote}</p>
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            <FormSelect className="w-40" label={t.reopen} value={days} onChange={setDays} options={REOPEN_DAYS.map(d => ({ value: d, label: `${d} ${t.days}` }))} />
            <Button variant="outline" iconLeft="refresh" onClick={() => { reopenEvent(ev.id, Number(days)); toast(t.reopened) }}>{t.reopenBtn}</Button>
            {ev.status !== 'closed' && <Button variant="outline" iconLeft="lock" onClick={() => { closeEvent(ev.id); toast(t.closed) }}>{t.close}</Button>}
            <Button variant="ghost" iconLeft="inbox" onClick={() => setConfirmArchive(true)}>{t.archive}</Button>
          </div>
        )}
      </Panel>

      {/* Chosen proofs */}
      <Panel title={t.chosen} subtitle={`${selected.length} / ${ev.quota}`} icon="heart">
        {selected.length === 0 ? (
          <div className="py-6 text-center"><p className="text-[15px] font-medium text-ink">{t.none}</p><p className="mt-1 text-[13px] text-ink/50">{t.noneB}</p></div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {selected.map(p => {
              const pk = pickOf.get(p.id)
              return (
                <div key={p.id}>
                  <ProofThumb proof={p} />
                  {(pk?.by || pk?.note) && (
                    <div className="mt-1 px-1 text-[11.5px] leading-snug">
                      {pk.by && <p className="text-ink/50">{t.by} {pk.by}</p>}
                      {pk.note && <p className="mt-0.5 rounded-lg bg-[var(--accent-soft)] px-2 py-1 text-ink/80">“{pk.note}”</p>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Panel>

      <ConfirmModal open={confirmArchive} onClose={() => setConfirmArchive(false)} onConfirm={() => { archiveEvent(ev.id); setConfirmArchive(false) }} title={t.archiveTitle} body={t.archiveBody} confirmLabel={t.archive} icon="inbox" />
    </div>
  )
}
