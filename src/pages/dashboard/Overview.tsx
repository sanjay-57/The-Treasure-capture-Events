import { Link } from 'react-router'
import { motion } from 'motion/react'
import { Icon } from '../../components/Icon'
import { Badge, Button, Card, LangImg } from '../../components/ui'
import { EASE, Reveal, Stagger, StaggerItem } from '../../components/motion'
import { COMMON, formatDate, formatINR, useLang, useT, type Bi } from '../../lib/i18n'
import { ADDONS, CROWDS, PACKAGES, ROLES, STATUS_META, STATUS_ORDER, VENUES, districtName, eventByKey, statusName } from '../../lib/data'
import { balanceDue, paidTotal, useMyOrder, useStore, type Order } from '../../lib/store'
import { useTitle } from '../../lib/ui'
import { Fact, ProgressRing, SECTIONS, StageBar, TamilCorners, formatTime, sectionState, stageIdx, stageSince, type SectionState } from './shared'

const copy = {
  title: { en: 'Overview', ta: 'மேலோட்டம்' },
  stage: { en: 'Stage', ta: 'நிலை' },
  of: { en: 'of', ta: '/' },
  since: { en: 'Since', ta: 'முதல்' },
  next: { en: 'Up next', ta: 'அடுத்து' },
  allDone: { en: 'All stages complete', ta: 'அனைத்து நிலைகளும் நிறைவு' },
  timeline: { en: 'View timeline', ta: 'காலவரிசை' },

  payment: { en: 'Payment', ta: 'கட்டணம்' },
  paid: { en: 'paid', ta: 'செலுத்தியது' },
  total: { en: 'Total', ta: 'மொத்தம்' },
  received: { en: 'Received', ta: 'பெறப்பட்டது' },
  balance: { en: 'Balance due', ta: 'நிலுவை' },
  settled: { en: 'Fully settled — thank you', ta: 'முழுமையாகச் செலுத்தப்பட்டது — நன்றி' },
  invoice: { en: 'View invoice', ta: 'ரசீது பார்க்க' },

  details: { en: 'Your event', ta: 'உங்கள் நிகழ்வு' },
  event: { en: 'Event', ta: 'நிகழ்வு' },
  hours: { en: 'hours of coverage', ta: 'மணிநேரப் படப்பிடிப்பு' },
  when: { en: 'Date & time', ta: 'தேதி & நேரம்' },
  tentative: { en: 'Tentative date', ta: 'தற்காலிகத் தேதி' },
  venue: { en: 'Venue', ta: 'இடம்' },
  district: { en: 'District', ta: 'மாவட்டம்' },
  kmAway: { en: 'km from studio', ta: 'கி.மீ தொலைவு' },
  pkg: { en: 'Package', ta: 'தொகுப்பு' },
  guests: { en: 'Guests', ta: 'விருந்தினர்' },
  addons: { en: 'Add-ons', ta: 'கூடுதல் சேவைகள்' },

  team: { en: 'Your team', ta: 'உங்கள் குழு' },
  noTeam: { en: 'We assign your photographers right after the team meeting.', ta: 'குழு கூட்டம் முடிந்ததும் உங்கள் புகைப்படக் கலைஞர்களை ஒதுக்குவோம்.' },
  jobs: { en: 'events', ta: 'நிகழ்வுகள்' },

  shortcuts: { en: 'Everything in one place', ta: 'அனைத்தும் ஒரே இடத்தில்' },
  locked: { en: 'Locked', ta: 'பூட்டு' },
  action: { en: 'Your turn', ta: 'உங்கள் முறை' },
  done: { en: 'Done', ta: 'முடிந்தது' },
  open: { en: 'Open', ta: 'திறந்துள்ளது' },
  termsDesc: { en: 'Booking, payment & delivery policy', ta: 'பதிவு, கட்டணம், ஒப்படைப்பு விதிகள்' },
  help: { en: 'Questions? We reply on WhatsApp within the hour.', ta: 'சந்தேகமா? ஒரு மணி நேரத்தில் வாட்ஸ்அப்பில் பதில்.' },
  whatsapp: { en: 'WhatsApp the studio', ta: 'ஸ்டுடியோவுக்கு வாட்ஸ்அப்' },
}

export default function Overview() {
  useTitle({ en: 'My dashboard', ta: 'என் பக்கம்' })
  const order = useMyOrder()
  if (!order) return null
  return (
    <div className="grid gap-5 lg:grid-cols-12 lg:gap-6">
      <StatusHero order={order} />
      <PaymentCard order={order} />
      <DetailsCard order={order} />
      <TeamCard order={order} />
      <Shortcuts order={order} />
    </div>
  )
}

function StatusHero({ order }: { order: Order }) {
  const t = useT(copy)
  const lang = useLang()
  const meta = STATUS_META[order.status]
  const cur = stageIdx(order.status)
  const nextStage = STATUS_ORDER[cur + 1]
  const ev = eventByKey(order.eventType)

  return (
    <Reveal className="lg:col-span-8">
      <div className="relative isolate flex h-full min-h-[400px] flex-col justify-end overflow-hidden rounded-[28px] bg-ink text-white md:min-h-[420px] md:rounded-[32px]">
        <LangImg pair={ev?.img ?? { en: 'm_couple_lights', ta: 't_couple_garland' }} className="absolute inset-0 -z-20" w={1400} dark priority />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/60 to-ink/10" aria-hidden="true" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/50 to-transparent" aria-hidden="true" />

        <div className="absolute left-5 top-5 flex flex-wrap items-center gap-2 md:left-7 md:top-7">
          <span className="glass-dark inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-medium text-white/85">
            {t.stage} {cur + 1} {t.of} {STATUS_ORDER.length}
          </span>
          <span className="glass-dark hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] text-white/70 sm:inline-flex">
            <Icon name="clock" size={13} />
            {t.since} {formatDate(stageSince(order), lang)}
          </span>
        </div>

        <div className="p-5 pt-24 md:p-8 md:pt-28">
          <motion.h2 className="t-2 max-w-xl text-balance text-white" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.9, ease: EASE }}>
            {statusName(order.status, order.eventType, lang)}
          </motion.h2>
          <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-white/70">{meta.desc[lang]}</p>

          <div className="mt-6 grid gap-2.5 sm:flex sm:flex-wrap">
            {meta.cta && meta.cta.to !== '/dashboard/track' && (
              <Button to={meta.cta.to} icon="arrowRight">
                {meta.cta.label[lang]}
              </Button>
            )}
            <Button to="/dashboard/track" variant="glass-dark" iconLeft="clock">
              {t.timeline}
            </Button>
          </div>

          <div className="glass-dark mt-6 rounded-2xl p-4 md:mt-7">
            <StageBar order={order} dark />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[12.5px]">
              <span className="text-white/55">
                {nextStage ? (
                  <>
                    {t.next}: <span className="font-medium text-white">{statusName(nextStage, order.eventType, lang)}</span>
                  </>
                ) : (
                  <span className="font-medium text-white">{t.allDone}</span>
                )}
              </span>
              <span className="font-mono text-white/45">{Math.round(((cur + 1) / STATUS_ORDER.length) * 100)}%</span>
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  )
}

function PaymentCard({ order }: { order: Order }) {
  const t = useT(copy)
  const paid = paidTotal(order)
  const total = order.quote.total
  const due = balanceDue(order)
  const pct = total > 0 ? paid / total : 0

  return (
    <Reveal delay={0.08} className="lg:col-span-4">
      <Card className="relative flex h-full flex-col p-5 sm:p-6 md:p-7">
        <TamilCorners />
        <div className="flex items-center justify-between">
          <p className="t-label text-ink/50">{t.payment}</p>
          <Badge tone={due === 0 ? 'ruby' : 'muted'}>{order.invoiceId}</Badge>
        </div>
        <div className="my-6 flex justify-center">
          <ProgressRing value={pct} size={164} stroke={12}>
            <span className="font-display text-[34px] font-semibold leading-none tabular-nums sm:text-[40px]">{Math.round(pct * 100)}%</span>
            <span className="mt-1 text-[12px] text-ink/50">{t.paid}</span>
          </ProgressRing>
        </div>
        <dl className="space-y-3 text-[14px]">
          <div className="flex justify-between gap-3">
            <dt className="text-ink/55">{t.total}</dt>
            <dd className="font-medium tabular-nums">{formatINR(total)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-ink/55">{t.received}</dt>
            <dd className="font-medium tabular-nums">{formatINR(paid)}</dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-ink/[0.07] pt-3">
            <dt className="font-medium">{t.balance}</dt>
            <dd className={`font-semibold tabular-nums ${due > 0 ? 'text-ruby' : 'text-ink'}`}>{formatINR(due)}</dd>
          </div>
        </dl>
        {due === 0 && <p className="mt-3 text-[12.5px] text-ruby">{t.settled}</p>}
        <div className="mt-auto pt-6">
          <Button to="/dashboard/billing" variant="outline" full icon="arrowRight">
            {t.invoice}
          </Button>
        </div>
      </Card>
    </Reveal>
  )
}

function DetailsCard({ order }: { order: Order }) {
  const t = useT(copy)
  const lang = useLang()
  const ev = eventByKey(order.eventType)
  const pkg = PACKAGES.find(p => p.key === order.packageId)
  const crowd = CROWDS.find(c => c.key === order.crowd)
  const venue = VENUES.find(v => v.key === order.venueType)
  const addons = order.addons.map(k => ADDONS.find(a => a.key === k)).filter(Boolean) as (typeof ADDONS)[number][]

  return (
    <Reveal className="lg:col-span-8">
      <Card className="relative h-full p-5 sm:p-6 md:p-8">
        <TamilCorners />
        <p className="t-label text-ink/50">{t.details}</p>
        <div className="mt-5 grid gap-x-8 gap-y-5 sm:mt-6 sm:grid-cols-2 sm:gap-y-6 xl:grid-cols-3">
          <Fact icon="sparkle" label={t.event} value={ev?.name[lang] ?? order.eventType} sub={`${order.durationHours} ${t.hours}`} />
          <Fact
            icon="calendar"
            label={t.when}
            value={formatDate(order.date, lang, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
            sub={
              <>
                {formatTime(order.time, lang)}
                {order.dateCertainty === 'tentative' && <span className="ml-2 text-ruby">· {t.tentative}</span>}
              </>
            }
          />
          <Fact icon={order.venueType === 'home' ? 'home' : 'building'} label={t.venue} value={order.venueName || venue?.name[lang] || '—'} sub={order.venueAddress} />
          <Fact icon="mapPin" label={t.district} value={districtName(order.district, lang)} sub={`${order.distanceKm} ${t.kmAway}`} />
          <Fact icon="gem" label={t.pkg} value={pkg?.name[lang] ?? order.packageId} sub={pkg?.pitch[lang]} />
          <Fact icon="users" label={t.guests} value={crowd ? `${crowd.name[lang]} · ${crowd.range}` : '—'} sub={crowd?.note[lang]} />
        </div>
        {addons.length > 0 && (
          <div className="mt-7 border-t border-ink/[0.07] pt-5">
            <p className="t-label text-ink/45">{t.addons}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {addons.map(a => (
                <span key={a.key} className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-white px-3 py-1.5 text-[13px] text-ink/75">
                  <Icon name="plus" size={12} className="text-ruby" />
                  {a.name[lang]}
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>
    </Reveal>
  )
}

function TeamCard({ order }: { order: Order }) {
  const t = useT(copy)
  const lang = useLang()
  const workers = useStore(s => s.workers)
  const team = order.workerIds.map(id => workers.find(w => w.id === id)).filter(Boolean) as typeof workers

  return (
    <Reveal delay={0.08} className="lg:col-span-4">
      <Card className="relative h-full p-5 sm:p-6 md:p-7">
        <TamilCorners />
        <p className="t-label text-ink/50">{t.team}</p>
        {team.length === 0 ? (
          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-ink/[0.03] p-4">
            <Icon name="users" size={18} className="mt-0.5 text-ink/40" />
            <p className="text-[14px] leading-relaxed text-ink/60">{t.noTeam}</p>
          </div>
        ) : (
          <Stagger className="mt-5 space-y-2" gap={0.07}>
            {team.map(w => {
              const initials = w.name.en
                .split(' ')
                .map(p => p[0])
                .join('')
                .slice(0, 2)
              return (
                <StaggerItem key={w.id} y={12}>
                  <div className="flex items-center gap-3.5 rounded-2xl p-2 transition hover:bg-ink/[0.03]">
                    <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-display text-[18px] font-semibold text-white ${w.role === 'lead' ? 'bg-ruby' : 'bg-ink'}`}>
                      {initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium">{w.name[lang]}</p>
                      <p className="truncate text-[13px] text-ink/55">{ROLES[w.role][lang]}</p>
                    </div>
                    <span className="flex shrink-0 flex-col items-end text-[12px] text-ink/50">
                      <span className="inline-flex items-center gap-1 font-medium text-ink/80">
                        <Icon name="star" size={12} className="fill-ruby text-ruby" />
                        {w.rating.toFixed(1)}
                      </span>
                      <span>
                        {w.jobs} {t.jobs}
                      </span>
                    </span>
                  </div>
                </StaggerItem>
              )
            })}
          </Stagger>
        )}
      </Card>
    </Reveal>
  )
}

const STATE_LABEL: Record<SectionState, keyof typeof copy> = { locked: 'locked', action: 'action', done: 'done', open: 'open' }

function Shortcuts({ order }: { order: Order }) {
  const t = useT(copy)
  const c = useT(COMMON)
  const lang = useLang()
  const wa = useStore(s => s.cms.studio.whatsapp).replace(/\D/g, '')
  const tiles: { to: string; icon: (typeof SECTIONS)[number]['icon']; label: Bi; desc: Bi; state?: SectionState }[] = [
    ...SECTIONS.filter(s => s.key !== 'overview').map(s => ({ ...s, state: sectionState(order, s.key) })),
    { to: '/terms', icon: 'info', label: COMMON.terms, desc: copy.termsDesc },
  ]

  return (
    <div className="mt-4 md:mt-6 lg:col-span-12">
      <Reveal>
        <h3 className="t-3">{t.shortcuts}</h3>
      </Reveal>
      <Stagger className="mt-4 grid grid-cols-1 gap-2.5 sm:mt-5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3" gap={0.06}>
        {tiles.map(tile => {
          const st = tile.state
          return (
            <StaggerItem key={tile.to}>
              <Link
                to={tile.to}
                className={`group relative flex h-full items-center gap-3.5 overflow-hidden rounded-[22px] border p-4 transition-all sm:gap-4 sm:rounded-3xl sm:p-5 duration-300 hover:-translate-y-0.5 hover:shadow-soft ${
                  st === 'action' ? 'border-ruby/25 bg-ruby-soft/60' : 'hairline bg-white'
                }`}
              >
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-colors duration-300 ${
                    st === 'action' ? 'bg-ruby text-white' : st === 'locked' ? 'bg-ink/[0.04] text-ink/35' : 'bg-ink text-white group-hover:bg-ruby'
                  }`}
                >
                  <Icon name={st === 'locked' ? 'lock' : tile.icon} size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className={`text-[15.5px] font-semibold ${st === 'locked' ? 'text-ink/50' : 'text-ink'}`}>{tile.label[lang]}</span>
                    {st && st !== 'open' && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${
                          st === 'action' ? 'bg-ruby text-white' : st === 'done' ? 'bg-ink text-white' : 'bg-ink/[0.06] text-ink/50'
                        }`}
                      >
                        {t[STATE_LABEL[st]] as string}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-ink/50">{tile.desc[lang]}</span>
                </span>
                <Icon name={tile.to === '/terms' ? 'arrowUpRight' : 'arrowRight'} size={18} className="shrink-0 text-ink/25 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-ruby" />
              </Link>
            </StaggerItem>
          )
        })}
      </Stagger>

      <Reveal>
        <div className="glass-ruby-tint mt-5 flex flex-col items-stretch justify-between gap-4 rounded-3xl p-5 sm:mt-6 sm:flex-row sm:items-center md:px-7">
          <p className="flex items-start gap-3 text-[14.5px] text-ink/75 sm:items-center">
            <Icon name="whatsapp" size={20} className="mt-0.5 shrink-0 text-ruby sm:mt-0" />
            {t.help}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button href={`https://wa.me/${wa}`} size="sm" icon="arrowUpRight" className="max-sm:!h-11 max-sm:flex-1">
              {t.whatsapp}
            </Button>
            <Button to="/terms" variant="ghost" size="sm" className="max-sm:!h-11">
              {c.terms}
            </Button>
          </div>
        </div>
      </Reveal>
    </div>
  )
}
