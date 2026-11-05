import { Link } from 'react-router'
import { Icon } from '../../../components/Icon'
import { formatDate, useT, type Bi } from '../../../lib/i18n'
import { posesLink } from '../../links'
import { poseProgress } from '../../poses/logic'
import { WorkStepper } from '../../os/WorkStepper'
import { useStudioStore } from '../../store'
import type { EventStatus } from '../../types'
import { Bar, Chip, PCard, usePortal } from '../ui'

const copy = {
  welcome: { en: 'Welcome', ta: 'வருக' },
  sub: { en: 'Pick your album photos and choose your poses here.', ta: 'உங்கள் ஆல்பப் படங்களையும் போஸ்களையும் இங்கே தேர்வு செய்யுங்கள்.' },
  selection: { en: 'Photo selection', ta: 'புகைப்படத் தேர்வு' },
  picked: { en: 'picked', ta: 'தேர்ந்தெடுக்கப்பட்டது' },
  selectBy: { en: 'Choose by', ta: 'கடைசி நாள்' },
  openGallery: { en: 'Open gallery', ta: 'காட்சியகத்தைத் திற' },
  work: { en: 'Where your work is', ta: 'உங்கள் வேலை நிலை' },
  nothing: { en: 'Your studio will share your photos and poses here soon.', ta: 'உங்கள் ஸ்டுடியோ விரைவில் படங்களையும் போஸ்களையும் இங்கே பகிரும்.' },
  poses: { en: 'Poses for your shoot', ta: 'படப்பிடிப்புக்கான போஸ்கள்' },
  posesAnswered: { en: 'answered', ta: 'பதிலளிக்கப்பட்டது' },
  posesDone: { en: 'Sent to the studio. Thank you!', ta: 'ஸ்டுடியோவுக்கு அனுப்பப்பட்டது. நன்றி!' },
  openPoses: { en: 'Choose poses', ta: 'போஸ்களைத் தேர்வு செய்' },
  viewPoses: { en: 'View poses', ta: 'போஸ்களைப் பார்' },
}

export const EVENT_STATUS: Record<EventStatus, Bi> = {
  draft: { en: 'Being prepared', ta: 'தயாராகிறது' },
  uploading: { en: 'Being prepared', ta: 'தயாராகிறது' },
  open: { en: 'Open for your selection', ta: 'தேர்வுக்குத் திறந்துள்ளது' },
  submitted: { en: 'Selection submitted', ta: 'தேர்வு சமர்ப்பிக்கப்பட்டது' },
  closed: { en: 'Closed', ta: 'மூடப்பட்டது' },
  archived: { en: 'Archived', ta: 'காப்பகப்படுத்தப்பட்டது' },
}

export default function Dashboard() {
  const { project, base, lang } = usePortal()
  const t = useT(copy)
  const event = useStudioStore(s => (project.galleryEventId ? s.events.find(e => e.id === project.galleryEventId) : undefined))
  const picks = useStudioStore(s => (project.galleryEventId ? (s.picks[project.galleryEventId]?.length ?? 0) : 0))

  const f = project.features
  const plan = f?.poses !== false && project.poses?.sentAt ? project.poses : undefined
  const pp = plan ? poseProgress(plan) : undefined

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-[30px] font-medium leading-tight sm:text-[38px]">
          {t.welcome}, {project.greetName}
        </h1>
        <p className="mt-1.5 text-[14px] text-ink/55">{t.sub}</p>
        {project.theme && <p className="mt-1 text-[14px] font-medium text-[var(--accent)]">{project.theme}</p>}
      </div>

      <PCard title={t.work} icon="clock" className="mb-4">
        <WorkStepper stage={project.stage ?? 'booked'} tone="accent" />
      </PCard>

      {!(event && f?.gallery !== false) && !plan && <p className="text-[14px] text-ink/55">{t.nothing}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        {event && f?.gallery !== false && (
          <PCard title={t.selection} icon="heart">
            <div className="flex items-start justify-between gap-3">
              <p className="font-display text-[32px] font-medium leading-none">
                {picks} <span className="text-ink/40">/ {event.quota}</span>
              </p>
              <Chip tone={event.status === 'open' ? 'accent' : event.status === 'submitted' ? 'good' : 'muted'}>{EVENT_STATUS[event.status][lang]}</Chip>
            </div>
            <Bar ratio={event.quota ? picks / event.quota : 0} className="mt-4" />
            <p className="mt-2 text-[13px] text-ink/60">
              {t.picked}
              {event.status === 'open' && ` · ${t.selectBy} ${formatDate(event.deadline, lang)}`}
            </p>
            {event.status !== 'draft' && event.status !== 'uploading' && event.status !== 'archived' && (
              <Link to={`${base}/selection`} className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-[var(--accent)] px-4 text-[13.5px] font-semibold text-[var(--accent-ink)] hover:brightness-110">
                {t.openGallery}
                <Icon name="arrowRight" size={15} />
              </Link>
            )}
          </PCard>
        )}

        {plan && pp && (
          <PCard title={t.poses} icon="camera">
            {plan.submittedAt ? (
              <p className="flex items-center gap-2 text-[15px] font-medium text-emerald-700">
                <Icon name="check" size={18} />
                {t.posesDone}
              </p>
            ) : (
              <>
                <p className="font-display text-[32px] font-medium leading-none">
                  {pp.answered} <span className="text-ink/40">/ {pp.total}</span>
                </p>
                <Bar ratio={pp.total ? pp.answered / pp.total : 0} className="mt-4" />
                <p className="mt-2 text-[13px] text-ink/60">{t.posesAnswered}</p>
              </>
            )}
            <a href={posesLink(project.code)} className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-[var(--accent)] px-4 text-[13.5px] font-semibold text-[var(--accent-ink)] hover:brightness-110">
              {plan.submittedAt ? t.viewPoses : t.openPoses}
              <Icon name="arrowRight" size={15} />
            </a>
          </PCard>
        )}
      </div>
    </div>
  )
}
