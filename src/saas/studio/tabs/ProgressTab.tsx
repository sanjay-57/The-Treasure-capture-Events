import { useMemo } from 'react'
import { Icon, type IconName } from '../../../components/Icon'
import { Panel, Progress, relTime } from '../../../pages/admin/kit'
import { formatDate, formatDateTime, useLang, useT, type Bi } from '../../../lib/i18n'
import { useStudioStore } from '../../store'
import type { ActivityKind, StudioEvent } from '../../types'
import { Stat, daysLeft } from '../shared'

const copy = {
  daysLeft: { en: 'Days left', ta: 'மீதமுள்ள நாட்கள்' },
  deadline: { en: 'Deadline', ta: 'காலக்கெடு' },
  chosen: { en: 'Chosen', ta: 'தேர்வு' },
  people: { en: 'Picks by person', ta: 'நபர் வாரியாகத் தேர்வுகள்' },
  unnamed: { en: 'Not named', ta: 'பெயர் இல்லை' },
  timeline: { en: 'Activity', ta: 'செயல்பாடு' },
  none: { en: 'Nothing yet', ta: 'இன்னும் எதுவும் இல்லை' },
  past: { en: 'past', ta: 'கடந்தது' },
  notOpen: { en: 'not open', ta: 'திறக்கவில்லை' },
}

const KIND: Record<ActivityKind, { label: Bi; icon: IconName }> = {
  created: { label: { en: 'Event created', ta: 'நிகழ்வு உருவாக்கப்பட்டது' }, icon: 'plus' },
  uploaded: { label: { en: 'Proofs uploaded', ta: 'படங்கள் பதிவேற்றப்பட்டன' }, icon: 'image' },
  shared: { label: { en: 'Gallery shared', ta: 'காட்சியகம் பகிரப்பட்டது' }, icon: 'share' },
  opened: { label: { en: 'Client opened the gallery', ta: 'வாடிக்கையாளர் காட்சியகத்தைத் திறந்தார்' }, icon: 'eye' },
  selected: { label: { en: 'Client picked photos', ta: 'வாடிக்கையாளர் படங்களைத் தேர்ந்தார்' }, icon: 'heart' },
  submitted: { label: { en: 'Selection submitted', ta: 'தேர்வு சமர்ப்பிக்கப்பட்டது' }, icon: 'check' },
  reopened: { label: { en: 'Reopened', ta: 'மீண்டும் திறக்கப்பட்டது' }, icon: 'refresh' },
  closed: { label: { en: 'Closed', ta: 'மூடப்பட்டது' }, icon: 'lock' },
  exported: { label: { en: 'List copied for Lightroom', ta: 'Lightroom-க்குப் பட்டியல் நகலெடுக்கப்பட்டது' }, icon: 'copy' },
  archived: { label: { en: 'Archived', ta: 'காப்பகப்படுத்தப்பட்டது' }, icon: 'inbox' },
}

export function ProgressTab({ event: ev }: { event: StudioEvent }) {
  const t = useT(copy)
  const lang = useLang()
  const allActivity = useStudioStore(s => s.activity)
  const picks = useStudioStore(s => s.picks[ev.id])
  const activity = useMemo(() => allActivity.filter(a => a.eventId === ev.id).sort((a, b) => b.at.localeCompare(a.at)), [allActivity, ev.id])
  const byPerson = useMemo(() => {
    const m = new Map<string, number>()
    for (const p of picks ?? []) m.set(p.by?.trim() || '', (m.get(p.by?.trim() || '') ?? 0) + 1)
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [picks])
  const chosen = (picks ?? []).length
  const dl = daysLeft(ev.deadline)

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Panel title={t.timeline} icon="clock">
        {activity.length === 0 ? (
          <p className="text-[13.5px] text-ink/50">{t.none}</p>
        ) : (
          <ol className="relative ml-3 border-l border-ink/10">
            {activity.map(a => (
              <li key={a.id} className="relative pb-5 pl-6 last:pb-0">
                <span className="absolute -left-[13px] top-0 flex h-6 w-6 items-center justify-center rounded-full border border-ink/10 bg-white text-ink/60"><Icon name={KIND[a.kind].icon} size={12} /></span>
                <p className="text-[14px] font-medium text-ink">{KIND[a.kind].label[lang]}{a.meta ? <span className="font-normal text-ink/55"> · {a.meta}</span> : null}</p>
                <p className="text-[12px] text-ink/45">{formatDateTime(a.at, lang)} · {relTime(a.at, lang)}</p>
              </li>
            ))}
          </ol>
        )}
      </Panel>
      <div className="grid content-start gap-6">
        <Panel>
          <div className="grid grid-cols-2 gap-4">
            <Stat label={t.daysLeft} value={ev.status === 'open' ? Math.max(0, dl) : '—'} hint={ev.status === 'open' ? (dl < 0 ? t.past : undefined) : t.notOpen} />
            <Stat label={t.deadline} value={formatDate(ev.deadline, lang, { day: 'numeric', month: 'short' })} />
          </div>
          <div className="mt-5">
            <Stat label={t.chosen} value={`${chosen} / ${ev.quota}`} />
            <Progress value={chosen / Math.max(1, ev.quota)} className="mt-2" />
          </div>
        </Panel>
        <Panel title={t.people} icon="users">
          {byPerson.length === 0 ? (
            <p className="text-[13.5px] text-ink/50">{t.none}</p>
          ) : (
            <ul className="grid gap-2">
              {byPerson.map(([name, n]) => (
                <li key={name} className="flex items-center justify-between text-[14px]">
                  <span className={name ? 'text-ink' : 'text-ink/50'}>{name || t.unnamed}</span>
                  <span className="font-semibold tabular-nums text-ink">{n}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}
