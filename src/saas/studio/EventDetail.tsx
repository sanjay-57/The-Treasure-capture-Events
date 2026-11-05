import { Navigate, useParams, useSearchParams } from 'react-router'
import { BackLink } from '../../components/ui'
import { PageHeader, Tabs } from '../../pages/admin/kit'
import { formatDate, useLang, useT } from '../../lib/i18n'
import { useOsStore } from '../os/store'
import { useCurrentStudio, useStudioStore } from '../store'
import { StatusBadge } from './shared'
import { UploadTab } from './tabs/UploadTab'
import { ShareTab } from './tabs/ShareTab'
import { ProgressTab } from './tabs/ProgressTab'
import { SelectionTab } from './tabs/SelectionTab'
import { SettingsTab } from './tabs/SettingsTab'

export { SelectionTab }

const copy = {
  back: { en: 'All events', ta: 'அனைத்து நிகழ்வுகள்' },
  upload: { en: 'Upload', ta: 'பதிவேற்றம்' },
  share: { en: 'Share', ta: 'பகிர்' },
  progress: { en: 'Progress', ta: 'முன்னேற்றம்' },
  selection: { en: 'Selection', ta: 'தேர்வு' },
  settings: { en: 'Settings', ta: 'அமைப்புகள்' },
}

export type DetailTab = 'upload' | 'share' | 'progress' | 'selection' | 'settings'
const TABS: DetailTab[] = ['upload', 'share', 'progress', 'selection', 'settings']

export default function EventDetail() {
  const t = useT(copy)
  const lang = useLang()
  const { id = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const studio = useCurrentStudio()
  const ev = useStudioStore(s => s.events.find(e => e.id === id))
  const proofCount = useStudioStore(s => s.proofs.reduce((n, p) => (p.eventId === id ? n + 1 : n), 0))
  const pickCount = useStudioStore(s => (s.picks[id] ?? []).length)
  const project = useOsStore(s => s.projects.find(p => p.galleryEventId === id && p.studioId === ev?.studioId))

  if (!studio) return null
  if (!ev || ev.studioId !== studio.id) return <Navigate to="/studio/galleries" replace />
  // A project's gallery lives in the project editor now; standalone galleries keep this page.
  if (project) return <Navigate to={`/studio/projects/${project.id}?tab=gallery`} replace />

  const raw = params.get('tab') as DetailTab | null
  const tab: DetailTab = raw && TABS.includes(raw) ? raw : proofCount ? (ev.status === 'submitted' ? 'selection' : 'share') : 'upload'
  const setTab = (v: DetailTab) => setParams(p => { p.set('tab', v); return p }, { replace: true })

  return (
    <div>
      <div className="mb-4"><BackLink to="/studio/galleries">{t.back}</BackLink></div>
      <PageHeader title={ev.title} subtitle={`${ev.clientNames} · ${formatDate(ev.date, lang)}`} actions={<StatusBadge status={ev.status} />} />
      <Tabs
        className="mb-6"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'upload', label: t.upload, icon: 'image', count: proofCount },
          { value: 'share', label: t.share, icon: 'share' },
          { value: 'progress', label: t.progress, icon: 'clock' },
          { value: 'selection', label: t.selection, icon: 'heart', count: pickCount },
          { value: 'settings', label: t.settings, icon: 'settings' },
        ]}
      />
      {tab === 'upload' && <UploadTab event={ev} />}
      {tab === 'share' && <ShareTab event={ev} studio={studio} />}
      {tab === 'progress' && <ProgressTab event={ev} />}
      {tab === 'selection' && <SelectionTab event={ev} />}
      {tab === 'settings' && <SettingsTab event={ev} />}
    </div>
  )
}
