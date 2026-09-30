import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { motion } from 'motion/react'
import { Icon, type IconName } from '../../components/Icon'
import { Button } from '../../components/ui'
import { Counter, EASE } from '../../components/motion'
import { KolamCorner } from '../../components/tamil'
import { STATUS_ORDER, districtName, eventByKey, statusName } from '../../lib/data'
import { formatDate, formatINR, useLang, useT } from '../../lib/i18n'
import { useTitle } from '../../lib/ui'
import { balanceDue, paidTotal, useStore, type Order } from '../../lib/store'
import { AC, AvatarStack, PageHeader, Panel, StatusPill, WaBubble, daysUntil, inDays, relTime } from './kit'

const copy = {
  eyebrow: { en: 'Studio overview', ta: 'ஸ்டுடியோ மேலோட்டம்' },
  morning: { en: 'Good morning', ta: 'காலை வணக்கம்' },
  afternoon: { en: 'Good afternoon', ta: 'மதிய வணக்கம்' },
  evening: { en: 'Good evening', ta: 'மாலை வணக்கம்' },
  sub: { en: 'Here is how the studio is doing today.', ta: 'இன்று ஸ்டுடியோ நிலவரம் இதோ.' },
  newEnq: { en: 'New enquiries', ta: 'புதிய விசாரணைகள்' },
  newEnqSub: { en: 'awaiting a call-back', ta: 'திரும்ப அழைக்க வேண்டியவை' },
  upcoming: { en: 'Events · next 30 days', ta: 'அடுத்த 30 நாள் நிகழ்வுகள்' },
  upcomingSub: { en: 'crew to confirm', ta: 'குழு உறுதிசெய்ய வேண்டும்' },
  collected: { en: 'Collected', ta: 'வசூலானது' },
  collectedSub: { en: 'offline payments logged', ta: 'பதிவான நேரடி கட்டணங்கள்' },
  pending: { en: 'Pending balance', ta: 'நிலுவைத் தொகை' },
  pendingSub: { en: 'across confirmed orders', ta: 'உறுதியான ஆர்டர்களில்' },
  pipeline: { en: 'Order pipeline', ta: 'ஆர்டர் நிலைகள்' },
  pipelineSub: { en: 'Orders at each stage · tap a bar to filter', ta: 'ஒவ்வொரு நிலையிலும் ஆர்டர்கள் · வடிகட்ட தட்டவும்' },
  orders: { en: 'orders', ta: 'ஆர்டர்கள்' },
  money: { en: 'Billing health', ta: 'கட்டண நிலை' },
  moneySub: { en: 'Offline payments recorded', ta: 'பதிவான நேரடி கட்டணங்கள்' },
  booked: { en: 'Booked value', ta: 'பதிவு மதிப்பு' },
  draft: { en: 'Draft', ta: 'வரைவு' },
  partial: { en: 'Partially paid', ta: 'பகுதியளவு' },
  paidFull: { en: 'Paid', ta: 'முழுமை' },
  invoices: { en: 'Invoices', ta: 'ரசீதுகள்' },
  upcomingTitle: { en: 'Upcoming events', ta: 'வரவிருக்கும் நிகழ்வுகள்' },
  upcomingTitleSub: { en: 'Next shoots on the calendar', ta: 'நாட்காட்டியில் அடுத்த படப்பிடிப்புகள்' },
  noUpcoming: { en: 'No events scheduled ahead.', ta: 'வரவிருக்கும் நிகழ்வுகள் இல்லை.' },
  noCrew: { en: 'No crew yet', ta: 'குழு இல்லை' },
  activity: { en: 'WhatsApp activity', ta: 'WhatsApp செயல்பாடு' },
  activitySub: { en: 'Latest automated messages', ta: 'சமீபத்திய தானியங்கு செய்திகள்' },
  noActivity: { en: 'Nothing sent yet. Advancing an order or dispatching crew sends a WhatsApp template here.', ta: 'இதுவரை எதுவும் அனுப்பப்படவில்லை. ஆர்டர் நிலையை மாற்றினாலோ குழுவை அனுப்பினாலோ WhatsApp செய்தி இங்கே தோன்றும்.' },
  openOutbox: { en: 'Open outbox', ta: 'அவுட்பாக்ஸ் திற' },
  quick: { en: 'Quick actions', ta: 'விரைவுச் செயல்கள்' },
  qEnq: { en: 'Review enquiries', ta: 'விசாரணைகளைப் பார்' },
  qBoard: { en: 'Open order board', ta: 'ஆர்டர் பலகை' },
  qCrew: { en: 'Dispatch crew', ta: 'குழுவை அனுப்பு' },
  qBanner: { en: 'Edit homepage', ta: 'முகப்புப் பக்கம் திருத்து' },
  qLeads: { en: 'Call new leads', ta: 'புதிய வாய்ப்புகளை அழை' },
  viewAll: { en: 'View all', ta: 'அனைத்தும்' },
  client: { en: 'to client', ta: 'வாடிக்கையாளருக்கு' },
  worker: { en: 'to crew', ta: 'குழுவினருக்கு' },
}

function greeting(t: { morning: string; afternoon: string; evening: string }) {
  const h = new Date().getHours()
  return h < 12 ? t.morning : h < 17 ? t.afternoon : t.evening
}

export default function Overview() {
  const t = useT(copy)
  const lang = useLang()
  const session = useStore(s => s.session)
  const orders = useStore(s => s.orders)
  const outbox = useStore(s => s.outbox)
  const workers = useStore(s => s.workers)
  const leads = useStore(s => s.leads)
  useTitle({ en: 'Admin overview', ta: 'நிர்வாக மேலோட்டம்' })

  const stats = useMemo(() => {
    const confirmed = orders.filter(o => o.status !== 'ENQUIRY')
    const upcoming = orders
      .map(o => ({ o, d: daysUntil(o.date) }))
      .filter((x): x is { o: Order; d: number } => x.d !== null && x.d >= 0)
      .sort((a, b) => a.d - b.d)
    const invoices = { draft: 0, partial: 0, paid: 0 }
    for (const o of confirmed) {
      const p = paidTotal(o)
      if (p <= 0) invoices.draft++
      else if (p < o.quote.total) invoices.partial++
      else invoices.paid++
    }
    return {
      enquiries: orders.filter(o => o.status === 'ENQUIRY').length,
      next30: upcoming.filter(x => x.d <= 30).length,
      upcoming,
      collected: orders.reduce((s, o) => s + paidTotal(o), 0),
      pending: confirmed.reduce((s, o) => s + balanceDue(o), 0),
      pendingCount: confirmed.filter(o => balanceDue(o) > 0).length,
      booked: confirmed.reduce((s, o) => s + o.quote.total, 0),
      invoices,
      byStatus: STATUS_ORDER.map(s => ({ s, n: orders.filter(o => o.status === s).length })),
    }
  }, [orders])

  const first = (session?.name ?? '').split(' ')[0]

  return (
    <div>
      <PageHeader
        eyebrow={`${t.eyebrow} · ${formatDate(new Date().toISOString(), lang, { weekday: 'long', day: 'numeric', month: 'long' })}`}
        title={`${greeting(t)}${first ? `, ${first}` : ''}.`}
        subtitle={t.sub}
        actions={
          <>
            <Button to="/admin/orders?view=board" variant="outline" size="sm" iconLeft="grid" className="flex-1 md:flex-none">{t.qBoard}</Button>
            <Button to="/admin/orders?status=ENQUIRY" size="sm" icon="arrowRight" className="flex-1 md:flex-none">{t.qEnq}</Button>
          </>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <Kpi i={0} icon="inbox" label={t.newEnq} value={stats.enquiries} sub={`${t.newEnqSub}${leads.length ? ` · +${leads.length} ${AC.leads[lang]}` : ''}`} to="/admin/orders?status=ENQUIRY" />
        <Kpi i={1} icon="calendar" label={t.upcoming} value={stats.next30} sub={t.upcomingSub} to="/admin/orders?sort=date" />
        <Kpi i={2} icon="receipt" label={t.collected} value={stats.collected} money sub={t.collectedSub} highlight />
        <Kpi i={3} icon="clock" label={t.pending} value={stats.pending} money sub={`${stats.pendingCount} · ${t.pendingSub}`} to="/admin/orders?sort=balance" />
      </div>

      <div className="mt-4 grid gap-4 md:mt-5 md:gap-5 lg:grid-cols-3">
        <Panel title={t.pipeline} subtitle={t.pipelineSub} icon="filter" className="lg:col-span-2" kolam action={<Link to="/admin/orders" className="text-[13px] font-medium text-ink/50 transition hover:text-ruby">{t.viewAll}</Link>}>
          <Pipeline data={stats.byStatus} unit={t.orders} />
        </Panel>

        <Panel title={t.money} subtitle={t.moneySub} icon="receipt">
          <p className="t-label text-ink/40">{t.booked}</p>
          <p className="mt-1 font-display text-[34px] font-medium leading-none tracking-tight text-ink">
            <Counter to={stats.booked} prefix="₹" />
          </p>
          <div className="mt-5 flex h-2.5 w-full gap-[2px] overflow-hidden rounded-full bg-ink/[0.06]">
            <motion.span className="h-full rounded-l-full bg-ink" initial={{ width: 0 }} animate={{ width: `${stats.booked ? (stats.collected / Math.max(stats.booked, stats.collected)) * 100 : 0}%` }} transition={{ duration: 1.2, ease: EASE }} />
            <motion.span className="h-full rounded-r-full bg-ruby" initial={{ width: 0 }} animate={{ width: `${stats.booked ? (stats.pending / Math.max(stats.booked, stats.collected)) * 100 : 0}%` }} transition={{ duration: 1.2, delay: 0.15, ease: EASE }} />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 text-[12.5px] min-[400px]:grid-cols-2 min-[400px]:gap-3">
            <p className="flex items-center gap-2 text-ink/60"><span className="h-2 w-2 rounded-full bg-ink" />{t.collected}<span className="ml-auto font-semibold tabular-nums text-ink">{formatINR(stats.collected)}</span></p>
            <p className="flex items-center gap-2 text-ink/60"><span className="h-2 w-2 rounded-full bg-ruby" />{AC.due[lang]}<span className="ml-auto font-semibold tabular-nums text-ink">{formatINR(stats.pending)}</span></p>
          </div>
          <div className="mt-6 border-t hairline pt-4">
            <p className="t-label mb-3 text-ink/40">{t.invoices}</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { l: t.draft, n: stats.invoices.draft, c: 'bg-ink/[0.04] text-ink' },
                { l: t.partial, n: stats.invoices.partial, c: 'bg-ruby-soft text-ruby-deep' },
                { l: t.paidFull, n: stats.invoices.paid, c: 'bg-ink text-white' },
              ].map(x => (
                <div key={x.l} className={`rounded-2xl px-3 py-2.5 ${x.c}`}>
                  <p className="font-display text-[24px] font-medium leading-none">{x.n}</p>
                  <p className="mt-1 truncate text-[11.5px] opacity-70">{x.l}</p>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 md:mt-5 md:gap-5 lg:grid-cols-3">
        <Panel title={t.upcomingTitle} subtitle={t.upcomingTitleSub} icon="calendar" className="lg:col-span-2" bodyClass="p-1.5 md:p-3" action={<Link to="/admin/orders?sort=date" className="text-[13px] font-medium text-ink/50 transition hover:text-ruby">{t.viewAll}</Link>}>
          {stats.upcoming.length === 0 ? (
            <p className="px-4 py-10 text-center text-[14px] text-ink/45">{t.noUpcoming}</p>
          ) : (
            <ul>
              {stats.upcoming.slice(0, 5).map(({ o, d }, i) => (
                <motion.li key={o.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05, duration: 0.6, ease: EASE }}>
                  <Link to={`/admin/orders/${o.id}`} className="group flex items-center gap-3 rounded-2xl p-3 transition hover:bg-ink/[0.03] md:gap-4">
                    <DateTile date={o.date} soon={d <= 7} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14.5px] font-semibold text-ink">{o.client.name}</p>
                      <p className="mt-0.5 truncate text-[12.5px] text-ink/50">
                        {eventByKey(o.eventType)?.name[lang]} · {districtName(o.district, lang)}{o.time ? ` · ${o.time}` : ''}
                      </p>
                      <StatusPill status={o.status} eventType={o.eventType} className="mt-2 sm:hidden" />
                    </div>
                    <div className="hidden sm:block">
                      <CrewNames ids={o.workerIds} workers={workers} empty={t.noCrew} />
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5 self-start pt-1 sm:self-auto sm:pt-0">
                      <span className={`whitespace-nowrap text-[12px] font-semibold ${d <= 7 ? 'text-ruby' : 'text-ink/55'}`}>{inDays(d, lang)}</span>
                      <StatusPill status={o.status} eventType={o.eventType} className="hidden max-w-[140px] sm:inline-flex" />
                    </div>
                  </Link>
                </motion.li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={t.activity} subtitle={t.activitySub} icon="whatsapp" action={<Link to="/admin/messages" className="text-[13px] font-medium text-ink/50 transition hover:text-ruby">{t.openOutbox}</Link>}>
          {outbox.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-ink/[0.04] text-ink/35"><Icon name="send" size={19} /></span>
              <p className="max-w-[260px] text-[13px] leading-relaxed text-ink/50">{t.noActivity}</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {outbox.slice(0, 3).map(m => (
                <li key={m.id}>
                  <p className="mb-1.5 flex items-center gap-1.5 text-[12px] text-ink/50">
                    <span className="font-semibold text-ink">{m.toName}</span>
                    <span>· {m.audience === 'client' ? t.client : t.worker}</span>
                    <span className="ml-auto">{relTime(m.at, lang)}</span>
                  </p>
                  <WaBubble body={m.body.length > 140 ? m.body.slice(0, 140) + '…' : m.body} template={m.template} at={m.at} compact />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <section className="mt-7 md:mt-8">
        <p className="t-label mb-3 text-ink/40">{t.quick}</p>
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-5 md:gap-3 [&>a:last-child]:col-span-2 md:[&>a:last-child]:col-span-1">
          {[
            { icon: 'inbox' as const, label: t.qEnq, to: '/admin/orders?status=ENQUIRY' },
            { icon: 'grid' as const, label: t.qBoard, to: '/admin/orders?view=board' },
            { icon: 'users' as const, label: t.qCrew, to: '/admin/team' },
            { icon: 'phone' as const, label: t.qLeads, to: '/admin/leads' },
            { icon: 'image' as const, label: t.qBanner, to: '/admin/cms' },
          ].map(q => (
            <Link key={q.to} to={q.to} className="group flex min-h-[60px] items-center gap-3 rounded-2xl border hairline bg-white px-3.5 py-3 text-[13.5px] md:min-h-0 md:px-4 md:py-3.5 font-medium text-ink/75 transition hover:-translate-y-0.5 hover:border-ink/15 hover:text-ink hover:shadow-soft">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-ink/[0.045] text-ink/60 transition group-hover:bg-ruby group-hover:text-white"><Icon name={q.icon} size={15} /></span>
              <span className="min-w-0 flex-1 leading-snug">{q.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

function Kpi({ i, icon, label, value, sub, money, highlight, to }: { i: number; icon: IconName; label: string; value: number; sub: string; money?: boolean; highlight?: boolean; to?: string }) {
  const lang = useLang()
  const inner = (
    <>
      {highlight && <div className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-ruby-bright/40 blur-3xl" />}
      {lang === 'ta' && <KolamCorner className={`pointer-events-none absolute right-2 top-2 ${highlight ? 'opacity-40 [&_*]:stroke-white [&_circle]:fill-white' : 'opacity-50'}`} />}
      <span className={`relative flex h-8 w-8 items-center justify-center rounded-xl md:h-9 md:w-9 ${highlight ? 'bg-white/10 text-white' : 'bg-ink/[0.045] text-ink/65'}`}>
        <Icon name={icon} size={17} />
      </span>
      <p className={`relative mt-4 line-clamp-2 min-h-[2.75em] text-[12.5px] font-medium leading-snug md:mt-5 md:min-h-0 ${highlight ? 'text-white/65' : 'text-ink/55'}`}>{label}</p>
      <p className={`relative mt-1.5 whitespace-nowrap font-display font-medium leading-none tracking-tight ${lang === 'ta' ? 'text-[22px] sm:text-[28px] md:text-[34px]' : 'text-[25px] sm:text-[32px] md:text-[40px]'}`}>
        <Counter to={value} prefix={money ? '₹' : ''} duration={1.6} />
      </p>
      <p className={`relative mt-2 truncate text-[12px] ${to ? 'pr-5' : ''} md:pr-0 ${highlight ? 'text-white/50' : 'text-ink/40'}`}>{sub}</p>
      {to && <Icon name="arrowUpRight" size={16} className={`absolute bottom-4 right-4 md:bottom-5 md:right-5 transition ${highlight ? 'text-white/40' : 'text-ink/20 group-hover:text-ruby'}`} />}
    </>
  )
  const cls = `group relative block h-full overflow-hidden rounded-[22px] p-4 transition duration-500 sm:rounded-[26px] sm:p-5 md:p-6 ${
    highlight ? 'bg-ink text-white shadow-[0_20px_50px_-24px_rgba(10,10,11,0.7)]' : 'border hairline bg-white text-ink shadow-[0_1px_2px_rgba(10,10,11,0.04)] hover:-translate-y-0.5 hover:shadow-soft'
  }`
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.7, ease: EASE }} className="min-w-0">
      {to ? <Link to={to} className={cls}>{inner}</Link> : <div className={cls}>{inner}</div>}
    </motion.div>
  )
}

/** Horizontal bars, one per pipeline stage, single ruby series with direct count labels. */
function Pipeline({ data, unit }: { data: { s: (typeof STATUS_ORDER)[number]; n: number }[]; unit: string }) {
  const lang = useLang()
  const max = Math.max(1, ...data.map(d => d.n))
  const [hover, setHover] = useState<number | null>(null)
  return (
    <ol className="space-y-1" onMouseLeave={() => setHover(null)}>
      {data.map((d, i) => (
        <li key={d.s}>
          <Link
            to={`/admin/orders?status=${d.s}`}
            onMouseEnter={() => setHover(i)}
            onFocus={() => setHover(i)}
            className={`grid grid-cols-[minmax(0,8.5rem)_1fr_auto] items-center gap-2.5 rounded-xl px-1.5 py-2 transition min-[400px]:grid-cols-[minmax(0,9.5rem)_1fr_auto] md:grid-cols-[minmax(0,12rem)_1fr_auto] md:gap-3 md:px-2 md:py-1.5 ${hover === i ? 'bg-ink/[0.03]' : ''}`}
            aria-label={`${statusName(d.s, undefined, lang)}: ${d.n} ${unit}`}
          >
            <span className="flex min-w-0 items-center gap-2 text-[12.5px] text-ink/65">
              <span className="w-4 shrink-0 text-right font-mono text-[10.5px] text-ink/30">{i + 1}</span>
              <span className={`truncate ${hover === i ? 'text-ink' : ''}`}>{statusName(d.s, undefined, lang)}</span>
            </span>
            <span className="relative h-[14px] rounded-[4px] bg-ink/[0.035]">
              <motion.span
                className={`absolute inset-y-0 left-0 rounded-[4px] ${d.s === 'DELIVERED' ? 'bg-ink' : d.s === 'ENQUIRY' ? 'bg-ruby-bright' : 'bg-ruby'} ${hover !== null && hover !== i ? 'opacity-40' : ''} transition-opacity`}
                initial={{ width: 0 }}
                animate={{ width: d.n ? `${Math.max((d.n / max) * 100, 3)}%` : '0%' }}
                transition={{ duration: 1, delay: 0.1 + i * 0.05, ease: EASE }}
              />
            </span>
            <span className="w-6 text-right text-[13px] font-semibold tabular-nums text-ink">{d.n}</span>
          </Link>
        </li>
      ))}
    </ol>
  )
}

function DateTile({ date, soon }: { date: string; soon: boolean }) {
  const lang = useLang()
  const d = new Date(date + 'T00:00:00')
  return (
    <span className={`flex h-[52px] w-[52px] shrink-0 flex-col items-center justify-center rounded-2xl ${soon ? 'bg-ruby text-white shadow-ruby' : 'bg-ink/[0.045] text-ink'}`}>
      <span className={`text-[10px] font-semibold uppercase leading-none ${soon ? 'text-white/75' : 'text-ink/45'}`}>{d.toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-IN', { month: 'short' })}</span>
      <span className="mt-1 font-display text-[22px] font-medium leading-none">{d.getDate()}</span>
    </span>
  )
}

function CrewNames({ ids, workers, empty }: { ids: string[]; workers: { id: string; name: { en: string; ta: string } }[]; empty: string }) {
  const lang = useLang()
  const names = ids.map(id => workers.find(w => w.id === id)?.name[lang]).filter((n): n is string => !!n)
  return <AvatarStack names={names} size={26} empty={<span className="rounded-full border border-dashed border-ruby/40 px-2 py-0.5 text-[11px] font-medium text-ruby">{empty}</span>} />
}
