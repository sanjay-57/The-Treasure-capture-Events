import { useMemo } from 'react'
import { Link } from 'react-router'
import { Button, EmptyState } from '../../../components/ui'
import { formatDate, pick, useLang, useT } from '../../../lib/i18n'
import { useTitle } from '../../../lib/ui'
import { PageHeader, Panel } from '../../../pages/admin/kit'
import { useCurrentStudio, useStudioStore } from '../../store'
import { StatusBadge } from '../../studio/shared'
import { PROJECT_STATUS } from './copy'
import { Kpi, Pill, useProjects } from './parts'

const copy = {
  title: { en: 'Dashboard', ta: 'முகப்பு' },
  hello: { en: 'Today at', ta: 'இன்று' },
  active: { en: 'Active projects', ta: 'செயலில் உள்ள திட்டங்கள்' },
  awaitingSel: { en: 'Galleries awaiting selection', ta: 'தேர்வுக்குக் காத்திருக்கும் காட்சியகங்கள்' },
  received: { en: 'Selections received', ta: 'பெறப்பட்ட தேர்வுகள்' },
  awaitingPoses: { en: 'Poses awaiting choice', ta: 'தேர்வுக்குக் காத்திருக்கும் போஸ்கள்' },
  recent: { en: 'Recent projects', ta: 'சமீபத்திய திட்டங்கள்' },
  all: { en: 'All projects', ta: 'அனைத்தும்' },
  noGallery: { en: 'No gallery', ta: 'காட்சியகம் இல்லை' },
  posesSent: { en: 'Poses sent', ta: 'போஸ்கள் அனுப்பப்பட்டன' },
  posesDone: { en: 'Poses chosen', ta: 'போஸ்கள் தேர்வானது' },
  newProject: { en: 'New project', ta: 'புதிய திட்டம்' },
  noProjects: { en: 'Start with your first project', ta: 'உங்கள் முதல் திட்டத்துடன் தொடங்குங்கள்' },
  noProjectsB: { en: 'Add a project for each client. It comes with an album selection gallery and a pose chooser.', ta: 'ஒவ்வொரு வாடிக்கையாளருக்கும் ஒரு திட்டம் சேர்க்கவும். அதில் ஆல்பத் தேர்வுக் காட்சியகமும் போஸ் தேர்வும் இருக்கும்.' },
}

const CLOSED = new Set(['delivered', 'completed', 'cancelled'])

export default function Dashboard() {
  const t = useT(copy)
  const lang = useLang()
  useTitle(copy.title)
  const studio = useCurrentStudio()!
  const projects = useProjects()
  const galleries = useStudioStore(s => s.events)

  const data = useMemo(() => {
    const linked = new Set(projects.map(p => p.galleryEventId).filter(Boolean))
    const mine = galleries.filter(e => e.studioId === studio.id && linked.has(e.id))
    return {
      active: projects.filter(p => !CLOSED.has(p.status)).length,
      awaitingSel: mine.filter(e => e.status === 'open').length,
      received: mine.filter(e => e.status === 'submitted').length,
      awaitingPoses: projects.filter(p => p.poses?.sentAt && !p.poses.submittedAt && p.features?.poses !== false).length,
      recent: [...projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 8),
    }
  }, [projects, galleries, studio.id])

  return (
    <div>
      <PageHeader eyebrow={`${t.hello} ${studio.name}`} title={t.title} subtitle={formatDate(new Date().toISOString(), lang, { weekday: 'long', day: 'numeric', month: 'long' })} actions={<Button to="/studio/projects?new=1" iconLeft="plus">{t.newProject}</Button>} />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi icon="book" label={t.active} value={data.active} to="/studio/projects" />
        <Kpi icon="image" label={t.awaitingSel} value={data.awaitingSel} to="/studio/galleries" />
        <Kpi icon="heart" label={t.received} value={data.received} to="/studio/galleries" />
        <Kpi icon="users" label={t.awaitingPoses} value={data.awaitingPoses} to="/studio/projects" />
      </div>

      {projects.length === 0 ? (
        <div className="mt-8"><EmptyState icon="book" title={t.noProjects} body={t.noProjectsB} action={<Button to="/studio/projects?new=1" iconLeft="plus">{t.newProject}</Button>} /></div>
      ) : (
        <div className="mt-8">
          <Panel title={t.recent} icon="book" bodyClass="p-2" action={<Link to="/studio/projects" className="text-[13px] font-medium text-ink/55 hover:text-ink">{t.all}</Link>}>
            <ul>
              {data.recent.map(p => {
                const g = p.galleryEventId ? galleries.find(e => e.id === p.galleryEventId) : undefined
                return (
                  <li key={p.id}>
                    <Link to={`/studio/projects/${p.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-2xl px-3 py-2.5 hover:bg-ink/[0.03]">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-medium text-ink">{p.name}</span>
                        <span className="block truncate text-[12.5px] text-ink/50">{p.clientNames} · {pick(lang, PROJECT_STATUS[p.status])}</span>
                      </span>
                      {g ? <StatusBadge status={g.status} /> : <Pill>{t.noGallery}</Pill>}
                      {p.poses?.submittedAt ? <Pill tone="green">{t.posesDone}</Pill> : p.poses?.sentAt ? <Pill tone="amber">{t.posesSent}</Pill> : null}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </Panel>
        </div>
      )}
    </div>
  )
}
