import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { motion } from 'motion/react'
import { Icon } from '../../components/Icon'
import { BackLink, Button, Chip, EmptyState, Modal } from '../../components/ui'
import { EASE } from '../../components/motion'
import { HowToPose, PoseImage } from '../../components/poses'
import { eventByKey } from '../../lib/data'
import { formatDate, useLang, useT } from '../../lib/i18n'
import { FAITHS, POSES, POSE_EVENTS, poseById, type Faith, type PoseDef } from '../../lib/poses'
import { useStore, type Order } from '../../lib/store'
import { useTitle } from '../../lib/ui'
import { Panel, PageHeader, SearchInput, StatusPill } from './kit'

/*
 * Crew reference: the full pose library (with the ritual tags the client
 * never sees) and each order's shot list — the poses the client liked, with
 * the posing notes, ready to study or print before the day.
 */

const copy = {
  eyebrow: { en: 'Crew reference', ta: 'குழு வழிகாட்டி' },
  title: { en: 'Pose library', ta: 'போஸ் நூலகம்' },
  sub: { en: '{n} poses across {m} events. Each card is exactly what clients see, with the notes the crew follows.', ta: '{m} நிகழ்வுகளில் {n} போஸ்கள். வாடிக்கையாளர் பார்ப்பதும் குழு பின்பற்றும் குறிப்புகளும் இதே.' },
  shotLists: { en: 'Shot lists', ta: 'படப் பட்டியல்கள்' },
  shotListsSub: { en: 'Pose guides sent to clients', ta: 'வாடிக்கையாளருக்கு அனுப்பிய போஸ் வழிகாட்டிகள்' },
  noLists: { en: 'No pose guides sent yet. Send one from an order once the advance is in.', ta: 'இன்னும் போஸ் வழிகாட்டி அனுப்பவில்லை. முன்பணம் வந்ததும் ஆர்டரிலிருந்து அனுப்புங்கள்.' },
  locked: { en: 'Locked', ta: 'உறுதி' },
  rating: { en: 'Rating', ta: 'மதிப்பீட்டில்' },
  liked: { en: 'liked', ta: 'பிடித்தவை' },
  all: { en: 'All', ta: 'அனைத்தும்' },
  allEvents: { en: 'All events', ta: 'அனைத்து நிகழ்வுகளும்' },
  common: { en: 'Common', ta: 'பொதுவானவை' },
  search: { en: 'Search poses', ta: 'போஸ்களைத் தேடு' },
  count: { en: 'poses', ta: 'போஸ்கள்' },
  none: { en: 'Nothing matches these filters', ta: 'இந்த வடிகட்டிகளுக்குப் பொருந்துவது இல்லை' },
  usedIn: { en: 'Used for', ta: 'பயன்படும் நிகழ்வுகள்' },
  clientHidden: { en: 'Clients don’t see this tag', ta: 'இந்தக் குறி வாடிக்கையாளருக்குத் தெரியாது' },
}

const fill = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''))

export default function PoseLibrary() {
  const t = useT(copy)
  const lang = useLang()
  useTitle({ en: 'Pose library', ta: 'போஸ் நூலகம்' })
  const orders = useStore(s => s.orders)
  const [event, setEvent] = useState<string>('all')
  const [faith, setFaith] = useState<'all' | 'common' | Faith>('all')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<PoseDef | null>(null)

  const sent = useMemo(() => orders.filter(o => o.poses).sort((a, b) => (b.poses!.sentAt > a.poses!.sentAt ? 1 : -1)), [orders])
  const needle = q.trim().toLowerCase()
  const list = POSES.filter(p =>
    (event === 'all' || p.events.includes(event as PoseDef['events'][number])) &&
    (faith === 'all' || (faith === 'common' ? !p.faith : p.faith === faith)) &&
    (!needle || p.title.en.toLowerCase().includes(needle) || p.title.ta.includes(q.trim())),
  )

  return (
    <div>
      <PageHeader eyebrow={t.eyebrow} title={t.title} subtitle={fill(t.sub, { n: POSES.length, m: POSE_EVENTS.length })} />

      <Panel title={t.shotLists} subtitle={t.shotListsSub} icon="camera" className="mb-6" bodyClass="p-2 md:p-3">
        {sent.length === 0 ? (
          <p className="px-3 py-4 text-[13px] text-ink/50">{t.noLists}</p>
        ) : (
          <ul className="divide-y divide-ink/[0.06]">
            {sent.map(o => <ShotRow key={o.id} o={o} />)}
          </ul>
        )}
      </Panel>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <SearchInput value={q} onChange={setQ} placeholder={t.search} className="md:w-72" />
      </div>

      <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
        <Chip active={event === 'all'} onClick={() => setEvent('all')}>{t.allEvents}</Chip>
        {POSE_EVENTS.map(e => (
          <Chip key={e} active={event === e} onClick={() => setEvent(e)}>
            <span className="whitespace-nowrap">{eventByKey(e)?.name[lang]}</span>
          </Chip>
        ))}
      </div>
      <div className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        <Chip active={faith === 'all'} onClick={() => setFaith('all')}>{t.all}</Chip>
        <Chip active={faith === 'common'} onClick={() => setFaith('common')}>{t.common}</Chip>
        {FAITHS.map(f => (
          <Chip key={f.key} active={faith === f.key} onClick={() => setFaith(f.key)}>
            <span className="whitespace-nowrap">{f.label[lang]}</span>
          </Chip>
        ))}
      </div>

      <p className="mt-5 text-[12.5px] text-ink/45">{list.length} {t.count}</p>
      {list.length === 0 ? (
        <div className="mt-3"><EmptyState icon="search" title={t.none} /></div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:gap-4">
          {list.map((p, i) => (
            <motion.button
              key={p.id}
              type="button"
              onClick={() => setOpen(p)}
              className="group text-left cursor-pointer"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: EASE, delay: Math.min(i, 12) * 0.025 }}
            >
              <span className="relative block overflow-hidden rounded-2xl border hairline">
                <PoseImage pose={p} className="transition duration-700 group-hover:scale-[1.03]" />
                {p.faith && (
                  <span className="absolute left-2 top-2 rounded-full bg-ink/80 px-2 py-0.5 text-[10.5px] font-semibold text-white">{FAITHS.find(f => f.key === p.faith)?.label[lang]}</span>
                )}
              </span>
              <span className="mt-2 block text-[13.5px] font-medium leading-snug text-ink">{p.title[lang]}</span>
              <span className="mt-0.5 block truncate text-[11.5px] text-ink/45">{p.events.map(e => eventByKey(e)?.name[lang]).join(' · ')}</span>
            </motion.button>
          ))}
        </div>
      )}

      <Modal open={!!open} onClose={() => setOpen(null)} label={open?.title[lang] ?? ''} className="max-w-3xl">
        {open && (
          <div className="grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <PoseImage pose={open} eager className="md:h-full" />
            <div className="p-6 md:p-8">
              {open.faith && (
                <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-ink/[0.06] px-2.5 py-1 text-[11px] font-semibold text-ink/70">
                  <Icon name="eye" size={12} />
                  {FAITHS.find(f => f.key === open.faith)?.label[lang]} · {t.clientHidden}
                </p>
              )}
              <h3 className="t-3 pr-8">{open.title[lang]}</h3>
              <div className="mt-5">
                <HowToPose pose={open} compact />
              </div>
              <p className="t-label mt-6 text-ink/40">{t.usedIn}</p>
              <p className="mt-1.5 text-[13px] text-ink/65">{open.events.map(e => eventByKey(e)?.name[lang]).join(' · ')}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function ShotRow({ o }: { o: Order }) {
  const t = useT(copy)
  const lang = useLang()
  const plan = o.poses!
  const liked = plan.ids.filter(id => plan.picks[id] === 'yes').length
  const rated = plan.ids.filter(id => plan.picks[id]).length
  return (
    <li>
      <Link to={`/admin/poses/${o.id}`} className="flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-ink/[0.03]">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${plan.submittedAt ? 'bg-ink text-white' : 'bg-ruby-soft text-ruby'}`}>
          <Icon name={plan.submittedAt ? 'check' : 'clock'} size={15} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-semibold text-ink">{o.client.name}</span>
          <span className="block truncate text-[12px] text-ink/45">
            {eventByKey(o.eventType)?.name[lang]} · {o.date ? formatDate(o.date, lang, { day: 'numeric', month: 'short' }) : '—'} · {plan.submittedAt ? t.locked : `${t.rating} ${rated}/${plan.ids.length}`}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block text-[15px] font-semibold tabular-nums text-ruby">{liked}</span>
          <span className="block text-[11px] text-ink/40">{t.liked}</span>
        </span>
        <Icon name="chevronRight" size={16} className="shrink-0 text-ink/30" />
      </Link>
    </li>
  )
}

// ─── Shot list ───────────────────────────────────────────────────────────────

const shot = {
  back: { en: 'Back to order', ta: 'ஆர்டருக்குத் திரும்பு' },
  eyebrow: { en: 'Shot list', ta: 'படப் பட்டியல்' },
  print: { en: 'Print', ta: 'அச்சிடு' },
  library: { en: 'Pose library', ta: 'போஸ் நூலகம்' },
  notFound: { en: 'Order not found', ta: 'ஆர்டர் கிடைக்கவில்லை' },
  noPlan: { en: 'No pose guide sent yet', ta: 'இன்னும் போஸ் வழிகாட்டி அனுப்பவில்லை' },
  noPlanBody: { en: 'Send one from the order page once the advance is recorded.', ta: 'முன்பணம் பதிவானதும் ஆர்டர் பக்கத்திலிருந்து அனுப்புங்கள்.' },
  openOrder: { en: 'Open order', ta: 'ஆர்டரைத் திற' },
  liked: { en: 'Client loves these', ta: 'வாடிக்கையாளர் விரும்பியவை' },
  open: { en: 'Not rated yet', ta: 'இன்னும் மதிப்பிடவில்லை' },
  skipped: { en: 'Skip these', ta: 'இவற்றைத் தவிர்க்கவும்' },
  pending: { en: 'The client is still choosing — this list updates as they rate.', ta: 'வாடிக்கையாளர் இன்னும் தேர்வு செய்கிறார் — மதிப்பிடும்போது பட்டியல் புதுப்பிக்கப்படும்.' },
  locked: { en: 'Locked by the client on {date}.', ta: '{date} அன்று வாடிக்கையாளர் உறுதி செய்தார்.' },
  noLikes: { en: 'No liked poses yet.', ta: 'இன்னும் பிடித்த போஸ்கள் இல்லை.' },
}

export function ShotList() {
  const { id } = useParams()
  const t = useT(shot)
  const lang = useLang()
  const o = useStore(s => s.orders.find(x => x.id === id))
  useTitle({ en: o ? `Shot list · ${o.client.name}` : 'Shot list', ta: o ? `படப் பட்டியல் · ${o.client.name}` : 'படப் பட்டியல்' })

  if (!o) {
    return (
      <div>
        <BackLink to="/admin/poses">{t.library}</BackLink>
        <div className="mt-8"><EmptyState icon="search" title={t.notFound} /></div>
      </div>
    )
  }
  const plan = o.poses
  const ev = eventByKey(o.eventType)

  return (
    <div>
      <div className="print:hidden"><BackLink to={`/admin/orders/${o.id}`}>{t.back}</BackLink></div>
      <div className="mt-5">
        <PageHeader
          eyebrow={t.eyebrow}
          title={o.client.name}
          subtitle={
            <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <StatusPill status={o.status} eventType={o.eventType} />
              <span className="text-[13px] text-ink/50">
                {ev?.name[lang]} · {o.date ? formatDate(o.date, lang, { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}{o.venueName ? ` · ${o.venueName}` : ''}
              </span>
            </span>
          }
          actions={plan ? <span className="print:hidden"><Button variant="outline" size="sm" iconLeft="receipt" onClick={() => window.print()}>{t.print}</Button></span> : undefined}
        />
      </div>

      {!plan ? (
        <EmptyState icon="camera" title={t.noPlan} body={t.noPlanBody} action={<Button to={`/admin/orders/${o.id}`} variant="ink" size="sm">{t.openOrder}</Button>} />
      ) : (
        <ShotBody o={o} />
      )}
    </div>
  )
}

function ShotBody({ o }: { o: Order }) {
  const t = useT(shot)
  const lang = useLang()
  const plan = o.poses!
  const poses = plan.ids.map(poseById).filter((p): p is PoseDef => !!p)
  const liked = poses.filter(p => plan.picks[p.id] === 'yes')
  const open = poses.filter(p => !plan.picks[p.id])
  const skipped = poses.filter(p => plan.picks[p.id] === 'no')

  return (
    <div>
      <p className={`mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12.5px] font-medium ${plan.submittedAt ? 'bg-ink text-white' : 'bg-ruby-soft text-ruby-deep'}`}>
        <Icon name={plan.submittedAt ? 'check' : 'clock'} size={13} />
        {plan.submittedAt ? fill(t.locked, { date: formatDate(plan.submittedAt, lang, { day: 'numeric', month: 'long' }) }) : t.pending}
      </p>

      <p className="t-label mb-3 text-ink/45">{t.liked} · {liked.length}</p>
      {liked.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink/15 px-4 py-6 text-center text-[13px] text-ink/50">{t.noLikes}</p>
      ) : (
        <ol className="grid gap-4 md:grid-cols-2">
          {liked.map((p, i) => (
            <li key={p.id} className="flex gap-4 rounded-[22px] border hairline bg-white p-3 shadow-[0_1px_2px_rgba(10,10,11,0.04)] break-inside-avoid md:p-4">
              <span className="w-28 shrink-0 overflow-hidden rounded-xl sm:w-36">
                <PoseImage pose={p} />
              </span>
              <div className="min-w-0 flex-1 py-1">
                <p className="font-mono text-[11px] text-ruby">{String(i + 1).padStart(2, '0')}</p>
                <h3 className="mt-0.5 text-[16px] font-semibold leading-snug text-ink">{p.title[lang]}</h3>
                <div className="mt-3">
                  <HowToPose pose={p} compact />
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      {open.length > 0 && <TitleList label={t.open} poses={open} />}
      {skipped.length > 0 && <TitleList label={t.skipped} poses={skipped} muted />}
    </div>
  )
}

function TitleList({ label, poses, muted }: { label: string; poses: PoseDef[]; muted?: boolean }) {
  const lang = useLang()
  return (
    <div className="mt-8">
      <p className="t-label mb-3 text-ink/45">{label} · {poses.length}</p>
      <div className="flex flex-wrap gap-2">
        {poses.map(p => (
          <span key={p.id} className={`rounded-full border px-3 py-1.5 text-[12.5px] ${muted ? 'border-ink/10 text-ink/40 line-through decoration-ink/25' : 'border-ink/15 text-ink/70'}`}>{p.title[lang]}</span>
        ))}
      </div>
    </div>
  )
}
