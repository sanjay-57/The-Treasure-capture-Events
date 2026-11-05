import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Icon } from '../../../components/Icon'
import { Button, EmptyState, Modal } from '../../../components/ui'
import { pick, useLang, useT } from '../../../lib/i18n'
import { toast, useTitle } from '../../../lib/ui'
import { MiniSelect, PageHeader, SearchInput, TextInput } from '../../../pages/admin/kit'
import { useStudioStore } from '../../store'
import { downloadText, StatusBadge } from '../../studio/shared'
import { parseProjectCsv, toCsv, type ImportError, type ImportRow } from '../csv'
import { useOsStore } from '../store'
import { WORK_STAGES, type Project, type ProjectStatus, type WorkStage } from '../types'
import { STAGE_LABEL } from '../WorkStepper'
import { PROJECT_STATUS, PROJECT_STATUSES } from './copy'
import { Pill, useProjects, useStudioId, type Tone } from './parts'

const copy = {
  title: { en: 'Projects', ta: 'திட்டங்கள்' },
  eyebrow: { en: 'Bookings', ta: 'முன்பதிவுகள்' },
  new: { en: 'New Project', ta: 'புதிய திட்டம்' },
  import: { en: 'Import CSV', ta: 'CSV இறக்குமதி' },
  search: { en: 'Search project, client, phone…', ta: 'திட்டம், வாடிக்கையாளர், எண் தேடு…' },
  status: { en: 'Status', ta: 'நிலை' },
  stage: { en: 'Stage', ta: 'கட்டம்' },
  all: { en: 'All', ta: 'அனைத்தும்' },
  type: { en: 'Type', ta: 'வகை' },
  client: { en: 'Client', ta: 'வாடிக்கையாளர்' },
  album: { en: 'Album selection', ta: 'ஆல்பத் தேர்வு' },
  poses: { en: 'Poses', ta: 'போஸ்கள்' },
  noGallery: { en: 'No gallery', ta: 'காட்சியகம் இல்லை' },
  posesOff: { en: 'Not sent', ta: 'அனுப்பவில்லை' },
  posesSent: { en: 'Waiting for client', ta: 'வாடிக்கையாளருக்காகக் காத்திருக்கிறது' },
  posesDone: { en: 'Chosen', ta: 'தேர்வானது' },
  none: { en: 'No projects yet', ta: 'இன்னும் திட்டங்கள் இல்லை' },
  noneB: { en: 'Create a project or import your bookings from a spreadsheet.', ta: 'ஒரு திட்டத்தை உருவாக்கவும் அல்லது விரிதாளிலிருந்து இறக்குமதி செய்யவும்.' },
  noMatch: { en: 'Nothing matches', ta: 'பொருந்துவது இல்லை' },
  name: { en: 'Project name', ta: 'திட்டப் பெயர்' },
  names: { en: 'Client names', ta: 'வாடிக்கையாளர் பெயர்கள்' },
  greet: { en: 'Greet as', ta: 'வரவேற்கும் பெயர்' },
  greetHint: { en: 'Portal says "Welcome, …"', ta: 'தளம் "வணக்கம், …" என்று சொல்லும்' },
  phone: { en: 'Phone', ta: 'தொலைபேசி' },
  email: { en: 'Email', ta: 'மின்னஞ்சல்' },
  create: { en: 'Create and open', ta: 'உருவாக்கித் திற' },
  need: { en: 'Add a project name, client names and a 10-digit phone', ta: 'திட்டப் பெயர், வாடிக்கையாளர் பெயர், 10 இலக்க எண் சேர்க்கவும்' },
  cancel: { en: 'Cancel', ta: 'ரத்து' },
  impTitle: { en: 'Import projects from CSV', ta: 'CSV-இலிருந்து திட்டங்களை இறக்குமதி' },
  impHelp: { en: 'One row per project. Columns (header row needed, any order):', ta: 'ஒரு திட்டத்துக்கு ஒரு வரி. நெடுவரிசைகள் (தலைப்பு வரி தேவை, எந்த வரிசையிலும்):' },
  impReq: { en: 'name, client and phone are required.', ta: 'name, client, phone அவசியம்.' },
  sample: { en: 'Download sample', ta: 'மாதிரியைப் பதிவிறக்கு' },
  choose: { en: 'Choose CSV file', ta: 'CSV கோப்பைத் தேர்ந்தெடு' },
  preview: { en: 'Ready to import', ta: 'இறக்குமதிக்குத் தயார்' },
  errors: { en: 'Rows skipped', ta: 'தவிர்க்கப்பட்ட வரிகள்' },
  line: { en: 'Line', ta: 'வரி' },
  doImport: { en: 'Import {n} projects', ta: '{n} திட்டங்களை இறக்குமதி செய்' },
  imported: { en: '{n} projects imported', ta: '{n} திட்டங்கள் இறக்குமதி ஆனது' },
}

const stageTone = (s: WorkStage | undefined): Tone => (s === 'delivered' ? 'green' : WORK_STAGES.indexOf(s ?? 'booked') >= WORK_STAGES.indexOf('selection_received') ? 'ink' : s === 'selection_sent' ? 'amber' : 'muted')

const STATUS_TONE: Record<ProjectStatus, Tone> = { active: 'blue', on_hold: 'amber', post_production: 'ink', delivered: 'green', completed: 'muted', cancelled: 'muted' }

/** Only the client details are imported; a gallery is made for each project as it is created. */
const IMPORT_COLUMNS = ['name', 'type', 'client', 'phone', 'email'] as const

function posesState(p: Project, t: { posesOff: string; posesSent: string; posesDone: string }) {
  if (p.poses?.submittedAt) return { label: t.posesDone, tone: 'green' as Tone }
  if (p.poses?.sentAt) return { label: t.posesSent, tone: 'amber' as Tone }
  return { label: t.posesOff, tone: 'muted' as Tone }
}

export default function Projects() {
  const t = useT(copy)
  const lang = useLang()
  useTitle(copy.title)
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const studioId = useStudioId()
  const projects = useProjects()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<ProjectStatus | 'all'>('all')
  const [importing, setImporting] = useState(false)
  const galleries = useStudioStore(s => s.events)
  const showNew = params.get('new') === '1'
  const setShowNew = (v: boolean) => setParams(v ? { new: '1' } : {}, { replace: true })

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase()
    return projects
      .filter(p => status === 'all' || p.status === status)
      .filter(p => !n || [p.name, p.clientNames, p.phone, p.type, p.email ?? '', p.code].some(v => v.toLowerCase().includes(n)))
      .map(p => ({ p, gallery: p.galleryEventId ? galleries.find(e => e.id === p.galleryEventId) : undefined }))
      .sort((a, b) => b.p.updatedAt.localeCompare(a.p.updatedAt))
  }, [projects, galleries, q, status])

  return (
    <div>
      <PageHeader
        eyebrow={t.eyebrow}
        title={t.title}
        actions={
          <>
            <Button variant="outline" iconLeft="refresh" onClick={() => setImporting(true)}>{t.import}</Button>
            <Button iconLeft="plus" onClick={() => setShowNew(true)}>{t.new}</Button>
          </>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={q} onChange={setQ} placeholder={t.search} className="sm:max-w-sm sm:flex-1" />
        <MiniSelect label={t.status} icon="filter" value={status} onChange={setStatus} options={[{ value: 'all' as const, label: t.all }, ...PROJECT_STATUSES.map(s => ({ value: s, label: pick(lang, PROJECT_STATUS[s]) }))]} />
      </div>

      {projects.length === 0 ? (
        <EmptyState icon="book" title={t.none} body={t.noneB} action={<Button iconLeft="plus" onClick={() => setShowNew(true)}>{t.new}</Button>} />
      ) : rows.length === 0 ? (
        <EmptyState icon="search" title={t.noMatch} />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-[22px] border border-ink/[0.08] bg-white md:block">
            <table className="w-full min-w-[760px] text-left text-[13.5px]">
              <thead className="text-[11.5px] uppercase tracking-wide text-ink/40">
                <tr className="border-b border-ink/[0.06]">
                  <th className="px-4 py-3 font-medium">{t.name}</th>
                  <th className="px-3 py-3 font-medium">{t.type}</th>
                  <th className="px-3 py-3 font-medium">{t.status}</th>
                  <th className="px-3 py-3 font-medium">{t.stage}</th>
                  <th className="px-3 py-3 font-medium">{t.album}</th>
                  <th className="px-4 py-3 font-medium">{t.poses}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ p, gallery }) => {
                  const ps = posesState(p, t)
                  return (
                    <tr key={p.id} onClick={() => navigate(`/studio/projects/${p.id}`)} className="cursor-pointer border-b border-ink/[0.04] transition last:border-0 hover:bg-ink/[0.02]">
                      <td className="px-4 py-3">
                        <Link to={`/studio/projects/${p.id}`} onClick={e => e.stopPropagation()} className="font-medium text-ink hover:underline">{p.name}</Link>
                        <p className="text-[12px] text-ink/50">{p.clientNames}</p>
                      </td>
                      <td className="px-3 py-3 text-ink/70">{p.type}</td>
                      <td className="px-3 py-3"><Pill tone={STATUS_TONE[p.status]}>{pick(lang, PROJECT_STATUS[p.status])}</Pill></td>
                      <td className="px-3 py-3"><Pill tone={stageTone(p.stage)}>{pick(lang, STAGE_LABEL[p.stage ?? 'booked'])}</Pill></td>
                      <td className="px-3 py-3">{gallery ? <StatusBadge status={gallery.status} /> : <Pill>{t.noGallery}</Pill>}</td>
                      <td className="px-4 py-3"><Pill tone={ps.tone}>{ps.label}</Pill></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <ul className="grid gap-3 md:hidden">
            {rows.map(({ p, gallery }) => {
              const ps = posesState(p, t)
              return (
                <li key={p.id}>
                  <Link to={`/studio/projects/${p.id}`} className="block rounded-[20px] border border-ink/[0.08] bg-white p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold text-ink">{p.name}</p>
                        <p className="text-[12.5px] text-ink/50">{p.type} · {p.clientNames}</p>
                      </div>
                      <span className="flex flex-col items-end gap-1">
                        <Pill tone={STATUS_TONE[p.status]}>{pick(lang, PROJECT_STATUS[p.status])}</Pill>
                        <Pill tone={stageTone(p.stage)}>{pick(lang, STAGE_LABEL[p.stage ?? 'booked'])}</Pill>
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[12px] text-ink/55">
                      {t.album}: {gallery ? <StatusBadge status={gallery.status} /> : <Pill>{t.noGallery}</Pill>}
                      <span className="ml-2">{t.poses}:</span> <Pill tone={ps.tone}>{ps.label}</Pill>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </>
      )}

      <NewProjectModal open={showNew} onClose={() => setShowNew(false)} studioId={studioId} onCreated={id => navigate(`/studio/projects/${id}`, { replace: true })} />
      <ImportModal open={importing} onClose={() => setImporting(false)} studioId={studioId} />
    </div>
  )
}

function NewProjectModal({ open, onClose, studioId, onCreated }: { open: boolean; onClose: () => void; studioId: string; onCreated: (id: string) => void }) {
  const t = useT(copy)
  const createProject = useOsStore(s => s.createProject)
  const [f, setF] = useState({ name: '', type: 'Wedding', clientNames: '', greetName: '', phone: '', email: '' })
  const set = (k: keyof typeof f) => (v: string) => setF(x => ({ ...x, [k]: v }))
  // In LAN mode the create is a server round trip; a second tap would make a second project.
  const [busy, setBusy] = useState(false)
  const submit = async () => {
    if (busy) return
    if (!f.name.trim() || !f.clientNames.trim() || f.phone.replace(/\D/g, '').length < 10) return toast(t.need, 'ruby')
    setBusy(true)
    const p = await createProject(studioId, { name: f.name.trim(), type: f.type.trim() || 'Wedding', clientNames: f.clientNames.trim(), greetName: f.greetName.trim(), phone: f.phone.trim(), email: f.email.trim() || undefined })
    setBusy(false)
    if (!p) return
    setF({ name: '', type: 'Wedding', clientNames: '', greetName: '', phone: '', email: '' })
    onCreated(p.id)
  }
  return (
    <Modal open={open} onClose={onClose} label={t.new}>
      <div className="p-6 pt-8">
        <h2 className="mb-5 text-[20px] font-semibold tracking-tight text-ink">{t.new}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput className="sm:col-span-2" label={t.name} value={f.name} onChange={set('name')} placeholder="Divya & Rahul Wedding" required autoFocus />
          <TextInput label={t.type} value={f.type} onChange={set('type')} />
          <TextInput label={t.names} value={f.clientNames} onChange={set('clientNames')} placeholder="Divya & Rahul" required />
          <TextInput label={t.greet} value={f.greetName} onChange={set('greetName')} placeholder={f.clientNames.split(/\s*&\s*|\s+/)[0] || t.greetHint} />
          <TextInput label={t.phone} value={f.phone} onChange={set('phone')} inputMode="tel" required />
          <TextInput className="sm:col-span-2" label={t.email} value={f.email} onChange={set('email')} inputMode="email" />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>{t.cancel}</Button>
          <Button variant="ink" icon="arrowRight" disabled={busy} onClick={submit}>{t.create}</Button>
        </div>
      </div>
    </Modal>
  )
}

const SAMPLE = toCsv([
  [...IMPORT_COLUMNS],
  ['Anu & Vijay Wedding', 'Wedding', 'Anu & Vijay', '9876543210', 'anu@example.com'],
  ['Priya Baby Shower', 'Baby shower', 'Priya', '9876501234', ''],
])

function ImportModal({ open, onClose, studioId }: { open: boolean; onClose: () => void; studioId: string }) {
  const t = useT(copy)
  const lang = useLang()
  const input = useRef<HTMLInputElement>(null)
  const createProject = useOsStore(s => s.createProject)
  const [parsed, setParsed] = useState<{ file: string; rows: ImportRow[]; errors: ImportError[] } | null>(null)
  const close = () => {
    setParsed(null)
    onClose()
  }
  const onFile = async (f: File | undefined) => {
    if (!f) return
    const text = await f.text()
    setParsed({ file: f.name, ...parseProjectCsv(text) })
  }
  const [busy, setBusy] = useState(false)
  const run = async () => {
    if (!parsed || busy) return
    setBusy(true)
    const failed: ImportRow[] = []
    for (const r of parsed.rows) {
      // undefined = the server refused this row (it already showed why).
      if (!(await createProject(studioId, { name: r.name, type: r.type, clientNames: r.client, greetName: '', phone: r.phone, email: r.email }))) failed.push(r)
    }
    setBusy(false)
    const n = parsed.rows.length - failed.length
    if (n) toast(t.imported.replace('{n}', String(n)))
    // Keep only the rows that failed, so trying again cannot import the others twice.
    if (failed.length) setParsed({ ...parsed, rows: failed })
    else close()
  }
  return (
    <Modal open={open} onClose={close} label={t.impTitle} className="sm:max-w-2xl">
      <div className="p-6 pt-8">
        <h2 className="pr-10 text-[20px] font-semibold tracking-tight text-ink">{t.impTitle}</h2>
        <p className="mt-3 text-[13.5px] text-ink/60">{t.impHelp}</p>
        <p className="mt-1.5 rounded-xl bg-ink/[0.04] px-3 py-2 font-mono text-[12.5px] text-ink/75">{IMPORT_COLUMNS.join(',')}</p>
        <p className="mt-2 text-[12.5px] leading-relaxed text-ink/50">{t.impReq}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="ink" iconLeft="plus" onClick={() => input.current?.click()}>{t.choose}</Button>
          <Button variant="ghost" onClick={() => downloadText('projects-sample.csv', SAMPLE, 'text/csv')}>{t.sample}</Button>
          <input ref={input} type="file" accept=".csv,text/csv" className="hidden" onChange={e => { onFile(e.target.files?.[0]); e.target.value = '' }} />
        </div>

        {parsed && (
          <div className="mt-6 space-y-4">
            <p className="text-[13px] text-ink/50">{parsed.file}</p>
            {parsed.rows.length > 0 && (
              <div>
                <p className="t-label mb-2 text-ink/50">{t.preview} · {parsed.rows.length}</p>
                <div className="max-h-64 overflow-auto rounded-2xl border border-ink/[0.08] bg-white" data-lenis-prevent>
                  <table className="w-full min-w-[520px] text-left text-[12.5px]">
                    <thead className="sticky top-0 bg-white text-ink/45">
                      <tr><th className="px-3 py-2">{t.line}</th><th className="px-3 py-2">{t.name}</th><th className="px-3 py-2">{t.client}</th><th className="px-3 py-2">{t.type}</th></tr>
                    </thead>
                    <tbody>
                      {parsed.rows.map(r => (
                        <tr key={r.line} className="border-t border-ink/[0.05]">
                          <td className="px-3 py-1.5 text-ink/45">{r.line}</td>
                          <td className="px-3 py-1.5 font-medium text-ink">{r.name}</td>
                          <td className="px-3 py-1.5">{r.client} · {r.phone}</td>
                          <td className="px-3 py-1.5">{r.type}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {parsed.errors.length > 0 && (
              <div className="rounded-2xl bg-ruby/[0.06] px-4 py-3">
                <p className="t-label mb-1.5 text-ruby">{t.errors} · {parsed.errors.length}</p>
                <ul className="space-y-1 text-[12.5px] text-ruby-deep">
                  {parsed.errors.map(e => <li key={e.line}>{t.line} {e.line}: {e.message}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={close}>{t.cancel}</Button>
          <Button variant="ink" disabled={busy || !parsed?.rows.length} onClick={run}>{t.doImport.replace('{n}', String(parsed?.rows.length ?? 0))}</Button>
        </div>
      </div>
    </Modal>
  )
}
