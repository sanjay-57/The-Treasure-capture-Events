import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Icon } from '../../components/Icon'
import { Button, EmptyState } from '../../components/ui'
import { MiniSelect, PageHeader, Progress, SearchInput, relTime } from '../../pages/admin/kit'
import { formatDate, useLang, useT } from '../../lib/i18n'
import { useCurrentStudio, useStudioStore } from '../store'
import type { EventStatus } from '../types'
import { daysLeft as termDaysLeft, formatBytes, monthKey, planOf } from '../usage'
import { STATUS_LABEL, StatusBadge, daysLeft } from './shared'
import { eventsOf } from '../scope'

const copy = {
  eyebrow: { en: 'Your galleries', ta: 'உங்கள் காட்சியகங்கள்' },
  title: { en: 'Events', ta: 'நிகழ்வுகள்' },
  new: { en: 'New event', ta: 'புதிய நிகழ்வு' },
  search: { en: 'Search couple, title, phone…', ta: 'தம்பதி, தலைப்பு, தொலைபேசி தேடு…' },
  status: { en: 'Status', ta: 'நிலை' },
  all: { en: 'All', ta: 'அனைத்தும்' },
  usage: { en: 'galleries opened this month', ta: 'இந்த மாதம் திறந்த காட்சியகங்கள்' },
  daysLeft: { en: 'days left in your plan', ta: 'திட்டத்தில் மீதமுள்ள நாட்கள்' },
  plan: { en: 'plan', ta: 'திட்டம்' },
  proofs: { en: 'proofs', ta: 'படங்கள்' },
  chosen: { en: 'chosen', ta: 'தேர்வு' },
  left: { en: 'days left', ta: 'நாட்கள் மீதம்' },
  overdue: { en: 'Past deadline', ta: 'காலக்கெடு முடிந்தது' },
  last: { en: 'Last activity', ta: 'கடைசி செயல்பாடு' },
  none: { en: 'No events yet', ta: 'இன்னும் நிகழ்வுகள் இல்லை' },
  noneB: { en: 'Create an event, drop the card folder in, and send the link to your couple.', ta: 'ஒரு நிகழ்வை உருவாக்கி, கார்டு கோப்புறையை இட்டு, இணைப்பைத் தம்பதியருக்கு அனுப்புங்கள்.' },
  noMatch: { en: 'Nothing matches', ta: 'பொருந்துவது இல்லை' },
}

const FILTERS: (EventStatus | 'all')[] = ['all', 'draft', 'uploading', 'open', 'submitted', 'closed', 'archived']

export default function Events() {
  const t = useT(copy)
  const lang = useLang()
  const studio = useCurrentStudio()!
  const allEvents = useStudioStore(s => s.events)
  const proofs = useStudioStore(s => s.proofs)
  const picks = useStudioStore(s => s.picks)
  const activity = useStudioStore(s => s.activity)
  const plans = useStudioStore(s => s.plans)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<EventStatus | 'all'>('all')

  const events = useMemo(() => eventsOf(allEvents, studio.id), [allEvents, studio.id])
  const stats = useMemo(() => {
    const m = new Map<string, { count: number; bytes: number }>()
    for (const p of proofs) {
      const x = m.get(p.eventId) ?? { count: 0, bytes: 0 }
      x.count++
      x.bytes += p.bytes
      m.set(p.eventId, x)
    }
    const last = new Map<string, string>()
    for (const a of activity) if ((last.get(a.eventId) ?? '') < a.at) last.set(a.eventId, a.at)
    return { m, last }
  }, [proofs, activity])

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return events
      .filter(e => status === 'all' || e.status === status)
      .filter(e => !needle || [e.title, e.clientNames, e.clientPhone, e.code].some(v => v.toLowerCase().includes(needle)))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [events, q, status])

  const plan = planOf(plans, studio.sub.plan)
  const month = monthKey(new Date())
  const used = events.filter(e => e.openedAt && monthKey(e.openedAt) === month).length
  const left = termDaysLeft(studio)

  return (
    <div>
      <PageHeader eyebrow={t.eyebrow} title={t.title} actions={<Button to="/studio/events/new" iconLeft="plus">{t.new}</Button>} />

      <div className="mb-6 rounded-[20px] border border-ink/[0.08] bg-white px-5 py-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 text-[13.5px]">
          <span className="text-ink/60"><span className="text-[17px] font-semibold tabular-nums text-ink">{used}</span> {t.usage}</span>
          <Link to="/studio/account" className="text-ink/50 hover:text-ink">{plan.name} {t.plan}</Link>
        </div>
        <Progress value={Math.min(1, left / (plan.months * 30.4))} className="mt-3" />
        <p className="mt-1.5 text-[12px] tabular-nums text-ink/45">{left} {t.daysLeft}</p>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={q} onChange={setQ} placeholder={t.search} className="sm:max-w-sm sm:flex-1" />
        <MiniSelect label={t.status} icon="filter" value={status} onChange={setStatus} options={FILTERS.map(f => ({ value: f, label: f === 'all' ? t.all : STATUS_LABEL[f][lang] }))} />
      </div>

      {events.length === 0 ? (
        <EmptyState icon="image" title={t.none} body={t.noneB} action={<Button to="/studio/events/new" iconLeft="plus">{t.new}</Button>} />
      ) : shown.length === 0 ? (
        <EmptyState icon="search" title={t.noMatch} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map(e => {
            const s = stats.m.get(e.id) ?? { count: 0, bytes: 0 }
            const chosen = (picks[e.id] ?? []).length
            const dl = daysLeft(e.deadline)
            const live = e.status === 'open'
            return (
              <Link key={e.id} to={`/studio/events/${e.id}`} className="group flex flex-col rounded-[22px] border border-ink/[0.08] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(10,10,11,0.35)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[16px] font-semibold text-ink">{e.title}</p>
                    <p className="mt-0.5 text-[12.5px] text-ink/50">{formatDate(e.date, lang)}</p>
                  </div>
                  <StatusBadge status={e.status} />
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3 text-[12px] text-ink/50">
                  <div><p className="text-[17px] font-semibold tabular-nums text-ink">{s.count}</p>{t.proofs}</div>
                  <div><p className="text-[17px] font-semibold tabular-nums text-ink">{chosen}<span className="text-ink/35">/{e.quota}</span></p>{t.chosen}</div>
                  <div><p className="text-[17px] font-semibold tabular-nums text-ink">{formatBytes(s.bytes)}</p>&nbsp;</div>
                </div>
                <Progress value={chosen / Math.max(1, e.quota)} className="mt-4" />
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-ink/[0.06] pt-3 text-[12px] text-ink/50">
                  <span className="flex items-center gap-1.5"><Icon name="clock" size={13} />{t.last}: {relTime(stats.last.get(e.id), lang)}</span>
                  {live && <span className={dl < 0 ? 'font-medium text-ruby' : 'text-ink/70'}>{dl < 0 ? t.overdue : `${dl} ${t.left}`}</span>}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
