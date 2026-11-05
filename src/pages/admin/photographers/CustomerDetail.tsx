import { useMemo } from 'react'
import { useParams } from 'react-router'
import { BackLink, EmptyState } from '../../../components/ui'
import { formatDate, formatINR, useLang, useT, type Bi } from '../../../lib/i18n'
import { useTitle } from '../../../lib/ui'
import { galleryLink, portalLink, posesLink } from '../../../saas/links'
import { projectMoney } from '../../../saas/os/money'
import { useOsStore } from '../../../saas/os/store'
import { STAGE_LABEL } from '../../../saas/os/WorkStepper'
import { poseProgress } from '../../../saas/poses/logic'
import { useStudioStore } from '../../../saas/store'
import { StatusBadge } from '../../../saas/studio/shared'
import { CopyButton, Meta, PageHeader, Panel } from '../kit'
import { ProjectControls } from './CustomerControls'
import { PH } from './shared'

const copy = {
  back: { en: 'Back to studio', ta: 'ஸ்டுடியோவுக்குத் திரும்பு' },
  notFound: { en: 'Customer not found', ta: 'வாடிக்கையாளர் இல்லை' },
  notFoundBody: { en: 'The code may be wrong, or the demo data was reset.', ta: 'குறியீடு தவறாக இருக்கலாம், அல்லது டெமோ தரவு மீட்டமைக்கப்பட்டிருக்கலாம்.' },
  summary: { en: 'Summary', ta: 'சுருக்கம்' },
  gallery: { en: 'Gallery', ta: 'காட்சியகம்' },
  noGallery: { en: 'No gallery yet', ta: 'இன்னும் காட்சியகம் இல்லை' },
  photos: { en: 'Photos', ta: 'படங்கள்' },
  picked: { en: 'Picked', ta: 'தேர்ந்தவை' },
  poses: { en: 'Poses', ta: 'போஸ்கள்' },
  notSent: { en: 'Not sent', ta: 'அனுப்பவில்லை' },
  submitted: { en: 'submitted', ta: 'சமர்ப்பிக்கப்பட்டது' },
  answered: { en: 'answered', ta: 'பதிலளித்தவை' },
  money: { en: 'Payments', ta: 'கட்டணங்கள்' },
  total: { en: 'Quote total', ta: 'மொத்த விலை' },
  paid: { en: 'Paid', ta: 'செலுத்தியது' },
  due: { en: 'Outstanding', ta: 'நிலுவை' },
  stage: { en: 'Stage', ta: 'நிலை' },
  links: { en: 'Customer links', ta: 'வாடிக்கையாளர் இணைப்புகள்' },
  pin: { en: 'PIN', ta: 'PIN' },
  copy: { en: 'Copy', ta: 'நகலெடு' },
  date: { en: 'First event', ta: 'முதல் நிகழ்வு' },
} satisfies Record<string, Bi>

/** /admin/photographers/:id/customers/:code — TTC edits one photographer's customer. */
export default function CustomerDetail() {
  const { id = '', code = '' } = useParams()
  const t = useT(copy)
  const lang = useLang()
  const studio = useStudioStore(s => s.studios.find(x => x.id === id))
  const project = useOsStore(s => s.projects.find(p => p.studioId === id && p.code === code.toLowerCase()))
  const event = useStudioStore(s => (project?.galleryEventId ? s.events.find(e => e.id === project.galleryEventId && e.studioId === id) : undefined))
  const proofs = useStudioStore(s => s.proofs)
  const picks = useStudioStore(s => (event ? s.picks[event.id] : undefined))
  const proofCount = useMemo(() => (event ? proofs.filter(p => p.eventId === event.id).length : 0), [proofs, event])
  useTitle({ en: project?.name ?? 'Customer', ta: project?.name ?? 'வாடிக்கையாளர்' })

  const back = <BackLink to={`/admin/photographers/${id}`}>{t.back}</BackLink>
  if (!studio || !project)
    return (
      <div>
        {back}
        <div className="mt-6"><EmptyState icon="search" title={t.notFound} body={t.notFoundBody} /></div>
      </div>
    )

  const money = projectMoney(project)
  const pp = project.poses ? poseProgress(project.poses) : undefined
  const first = project.events.map(e => e.date).filter(Boolean).sort()[0]

  return (
    <div>
      {back}
      <div className="mt-5" />
      <PageHeader
        eyebrow={`${PH.wing[lang]} · ${studio.name}`}
        title={project.name}
        subtitle={<span>{project.clientNames} · {project.phone}{first ? ` · ${formatDate(first, lang)}` : ''}</span>}
      />
      <div className="grid gap-4 md:gap-5 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 md:space-y-5 lg:col-span-2">
          <ProjectControls project={project} studioPicker={studio.pickerVersion ?? 'normal'} />
        </div>
        <div className="min-w-0 space-y-4 md:space-y-5">
          <Panel title={t.summary} icon="dashboard">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
              <Meta label={t.stage}>{STAGE_LABEL[project.stage ?? 'booked'][lang]}</Meta>
              <Meta label={t.gallery}>{event ? <StatusBadge status={event.status} /> : t.noGallery}</Meta>
              {event && <Meta label={t.photos}>{proofCount}</Meta>}
              {event && <Meta label={t.picked}>{(picks ?? []).length}/{event.quota}</Meta>}
              <Meta label={t.poses} className="col-span-2">
                {!project.poses?.sentAt || !pp ? t.notSent : `${pp.answered}/${pp.total} ${t.answered}${project.poses.submittedAt ? ` · ${t.submitted} ${formatDate(project.poses.submittedAt, lang)}` : ''}`}
              </Meta>
            </dl>
          </Panel>
          <Panel title={t.money} icon="rupee">
            <dl className="grid grid-cols-3 gap-4 tabular-nums">
              <Meta label={t.total}>{formatINR(money.total)}</Meta>
              <Meta label={t.paid}>{formatINR(money.paid)}</Meta>
              <Meta label={t.due}>{formatINR(money.outstanding)}</Meta>
            </dl>
          </Panel>
          <Panel title={t.links} icon="share">
            <p className="mb-3 text-[13px] text-ink/55">{t.pin}: <span className="font-semibold tabular-nums text-ink">{project.pin}</span></p>
            <ul className="space-y-2.5">
              {[galleryLink(project.code), posesLink(project.code), portalLink(project.code)].map(href => (
                <li key={href} className="flex items-center gap-2">
                  <a href={href} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate text-[13px] text-ink/70 underline decoration-ink/20 underline-offset-2 hover:text-ink">{href.replace(/^https?:\/\//, '')}</a>
                  <CopyButton text={href} label={t.copy} />
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  )
}
