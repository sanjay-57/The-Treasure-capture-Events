import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { Icon } from '../../components/Icon'
import { Button, EmptyState, Segmented } from '../../components/ui'
import { EASE } from '../../components/motion'
import { DISTRICTS, EVENTS, STATUS_ORDER, districtName, eventByKey, statusName, type OrderStatus, type Worker } from '../../lib/data'
import { formatDate, formatINR, useLang, useT, type Lang } from '../../lib/i18n'
import { toast, useTitle } from '../../lib/ui'
import { balanceDue, normalizePhone, paidTotal, useStore, type Order } from '../../lib/store'
import { AC, AvatarStack, MiniSelect, PageHeader, SearchInput, StageMeter, StatusPill, daysUntil, initials, nextStatus, relTime } from './kit'

const copy = {
  eyebrow: { en: 'Enquiries & bookings', ta: 'விசாரணைகள் & பதிவுகள்' },
  title: { en: 'Orders', ta: 'ஆர்டர்கள்' },
  sub: { en: 'Every enquiry from the booking flow. Advance a stage to update the client’s dashboard and send their WhatsApp.', ta: 'முன்பதிவு வழியாக வந்த அனைத்து விசாரணைகளும். நிலையை மாற்றினால் வாடிக்கையாளர் பக்கம் புதுப்பிக்கப்பட்டு WhatsApp அனுப்பப்படும்.' },
  list: { en: 'List', ta: 'பட்டியல்' },
  board: { en: 'Board', ta: 'பலகை' },
  search: { en: 'Search name, order id or phone', ta: 'பெயர், ஆர்டர் எண், தொலைபேசி' },
  allStatus: { en: 'All stages', ta: 'அனைத்து நிலைகள்' },
  allDistricts: { en: 'All districts', ta: 'அனைத்து மாவட்டங்கள்' },
  allEvents: { en: 'All events', ta: 'அனைத்து நிகழ்வுகள்' },
  sortCreated: { en: 'Newest first', ta: 'புதியவை முதலில்' },
  sortDate: { en: 'Event date', ta: 'நிகழ்வுத் தேதி' },
  sortBalance: { en: 'Highest balance', ta: 'அதிக நிலுவை' },
  sort: { en: 'Sort', ta: 'வரிசை' },
  district: { en: 'District', ta: 'மாவட்டம்' },
  event: { en: 'Event', ta: 'நிகழ்வு' },
  colOrder: { en: 'Client', ta: 'வாடிக்கையாளர்' },
  colEvent: { en: 'Event', ta: 'நிகழ்வு' },
  colDate: { en: 'Date', ta: 'தேதி' },
  colStage: { en: 'Stage', ta: 'நிலை' },
  colCrew: { en: 'Crew', ta: 'குழு' },
  colBalance: { en: 'Balance', ta: 'நிலுவை' },
  showing: { en: 'orders', ta: 'ஆர்டர்கள்' },
  advance: { en: 'Advance', ta: 'அடுத்த நிலை' },
  moved: { en: 'Moved to', ta: 'நிலை மாற்றம்:' },
  dragHint: { en: 'Drag cards between columns, or use Advance.', ta: 'அட்டைகளை நெடுவரிசைகளுக்கு இழுக்கலாம், அல்லது “அடுத்த நிலை” அழுத்தவும்.' },
  empty: { en: 'Drop here', ta: 'இங்கே விடவும்' },
  newOrder: { en: 'New booking', ta: 'புதிய பதிவு' },
  unassigned: { en: 'Unassigned', ta: 'ஒதுக்கப்படவில்லை' },
}

type Sort = 'created' | 'date' | 'balance'

export default function Orders() {
  const t = useT(copy)
  const lang = useLang()
  const orders = useStore(s => s.orders)
  const workers = useStore(s => s.workers)
  const [params, setParams] = useSearchParams()
  useTitle({ en: 'Orders', ta: 'ஆர்டர்கள்' })

  const status = (params.get('status') ?? 'all') as OrderStatus | 'all'
  const district = params.get('district') ?? 'all'
  const event = params.get('event') ?? 'all'
  const sort = (params.get('sort') ?? 'created') as Sort
  const view = params.get('view') === 'board' ? 'board' : 'list'
  const q = params.get('q') ?? ''

  const setParam = (k: string, v: string, def: string) => {
    const next = new URLSearchParams(params)
    if (v === def || !v) next.delete(k)
    else next.set(k, v)
    setParams(next, { replace: true })
  }

  const base = useMemo(() => {
    const s = q.trim().toLowerCase()
    const d = s.replace(/\D/g, '')
    return orders.filter(o => {
      if (district !== 'all' && o.district !== district) return false
      if (event !== 'all' && o.eventType !== event) return false
      if (s && !(o.id.toLowerCase().includes(s) || o.client.name.toLowerCase().includes(s) || (d.length >= 3 && normalizePhone(o.client.contact).includes(d)))) return false
      return true
    })
  }, [orders, district, event, q])

  const filtered = useMemo(() => {
    const list = status === 'all' ? base : base.filter(o => o.status === status)
    const sorted = [...list]
    if (sort === 'created') sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    if (sort === 'balance') sorted.sort((a, b) => balanceDue(b) - balanceDue(a))
    if (sort === 'date') sorted.sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'))
    return sorted
  }, [base, status, sort])

  const counts = useMemo(() => Object.fromEntries(STATUS_ORDER.map(s => [s, base.filter(o => o.status === s).length])) as Record<OrderStatus, number>, [base])
  const hasFilters = status !== 'all' || district !== 'all' || event !== 'all' || !!q

  return (
    <div>
      <PageHeader
        eyebrow={t.eyebrow}
        title={t.title}
        subtitle={t.sub}
        actions={
          <>
            <Segmented
              value={view}
              onChange={v => setParam('view', v, 'list')}
              options={[
                { value: 'list', label: <span className="flex items-center gap-1.5"><Icon name="rows" size={14} />{t.list}</span> },
                { value: 'board', label: <span className="flex items-center gap-1.5"><Icon name="grid" size={14} />{t.board}</span> },
              ]}
            />
          </>
        }
      />

      {/* Stage chips */}
      <div className="no-scrollbar -mx-4 mb-4 flex scroll-px-4 gap-1.5 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0" data-lenis-prevent>
        {(['all', ...STATUS_ORDER] as const).map(s => {
          const active = status === s
          const n = s === 'all' ? base.length : counts[s]
          return (
            <button
              key={s}
              type="button"
              onClick={() => setParam('status', s, 'all')}
              aria-pressed={active}
              className={`relative flex h-10 shrink-0 items-center gap-2 rounded-full px-3.5 text-[13px] font-medium transition-colors md:h-9 cursor-pointer ${active ? 'text-white' : 'text-ink/60 hover:text-ink'}`}
            >
              {active && <motion.span layoutId="orders-status-chip" className="absolute inset-0 rounded-full bg-ink" transition={{ type: 'spring', stiffness: 420, damping: 36 }} />}
              {!active && <span className="absolute inset-0 rounded-full border border-ink/[0.08] bg-white" />}
              <span className="relative whitespace-nowrap">{s === 'all' ? t.allStatus : statusName(s, undefined, lang)}</span>
              <span className={`relative rounded-full px-1.5 text-[11px] font-semibold tabular-nums ${active ? 'bg-white/15' : s === 'ENQUIRY' && n > 0 ? 'bg-ruby text-white' : 'bg-ink/[0.06] text-ink/50'}`}>{n}</span>
            </button>
          )
        })}
      </div>

      {/* Toolbar */}
      <div className="mb-5 grid grid-cols-2 gap-2 md:flex md:items-center">
        <SearchInput value={q} onChange={v => setParam('q', v, '')} placeholder={t.search} className="col-span-2 md:w-[320px]" />
        <MiniSelect label={t.district} icon="mapPin" value={district} onChange={v => setParam('district', v, 'all')} options={[{ value: 'all', label: t.allDistricts }, ...DISTRICTS.map(d => ({ value: d.key, label: d.name[lang] }))]} />
        <MiniSelect label={t.event} icon="camera" value={event} onChange={v => setParam('event', v, 'all')} options={[{ value: 'all', label: t.allEvents }, ...EVENTS.map(e => ({ value: e.key, label: e.name[lang] }))]} />
        <MiniSelect<Sort> label={t.sort} icon="filter" value={sort} onChange={v => setParam('sort', v, 'created')} className="col-span-2 md:col-span-1 md:ml-auto" options={[{ value: 'created', label: t.sortCreated }, { value: 'date', label: t.sortDate }, { value: 'balance', label: t.sortBalance }]} />
      </div>

      <div className="mb-3 flex min-h-8 items-center justify-between gap-3 text-[12.5px] text-ink/45">
        <span>
          <span className="font-semibold text-ink">{view === 'list' ? filtered.length : base.length}</span> {t.showing}
        </span>
        {hasFilters && (
          <button type="button" onClick={() => setParams(view === 'board' ? { view: 'board' } : {}, { replace: true })} className="-my-1 py-1 font-medium text-ruby transition hover:text-ruby-deep cursor-pointer">
            {AC.clearFilters[lang]}
          </button>
        )}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={view} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4, ease: EASE }}>
          {view === 'list' ? (
            filtered.length === 0 ? (
              <EmptyState icon="search" title={AC.noResults[lang]} action={<Button variant="outline" size="sm" onClick={() => setParams({}, { replace: true })}>{AC.clearFilters[lang]}</Button>} />
            ) : (
              <OrderTable orders={filtered} workers={workers} />
            )
          ) : (
            <Board orders={base} focus={status} workers={workers} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ─── List ────────────────────────────────────────────────────────────────────

const crewNames = (o: Order, workers: Worker[], lang: Lang) => o.workerIds.map(id => workers.find(w => w.id === id)?.name[lang]).filter((n): n is string => !!n)

function OrderTable({ orders, workers }: { orders: Order[]; workers: Worker[] }) {
  const t = useT(copy)
  const lang = useLang()
  return (
    <div className="overflow-hidden rounded-[22px] border hairline bg-white shadow-[0_1px_2px_rgba(10,10,11,0.04)] sm:rounded-[26px]">
      <div className="hidden grid-cols-[minmax(0,2.2fr)_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.5fr)_90px_minmax(0,1fr)_20px] gap-4 border-b hairline bg-ink/[0.015] px-6 py-3 lg:grid">
        {[t.colOrder, t.colEvent, t.colDate, t.colStage, t.colCrew, t.colBalance, ''].map((h, i) => (
          <span key={i} className={`t-label text-ink/40 ${i === 5 ? 'text-right' : ''}`}>{h}</span>
        ))}
      </div>
      <ul>
        <AnimatePresence initial={false}>
          {orders.map((o, i) => {
            const due = balanceDue(o)
            const d = daysUntil(o.date)
            const ev = eventByKey(o.eventType)
            return (
              <motion.li
                key={o.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 10) * 0.03, duration: 0.45, ease: EASE } }}
                exit={{ opacity: 0 }}
                className="border-b hairline last:border-0"
              >
                <Link to={`/admin/orders/${o.id}`} className="group block px-4 py-4 transition hover:bg-ink/[0.02] md:px-6 lg:grid lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.5fr)_90px_minmax(0,1fr)_20px] lg:items-center lg:gap-4">
                  {/* Client */}
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-[12px] font-semibold ${o.status === 'ENQUIRY' ? 'bg-ruby text-white' : 'bg-ink/[0.05] text-ink/70'}`}>
                      {initials(o.client.name)}
                      {o.status === 'ENQUIRY' && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-ruby-bright" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14.5px] font-semibold text-ink">{o.client.name}</p>
                      <p className="truncate text-[12px] text-ink/45"><span className="font-mono">{o.id}</span> · {relTime(o.createdAt, lang)}</p>
                    </div>
                    <div className="shrink-0 text-right lg:hidden">
                      <p className={`whitespace-nowrap text-[14px] font-semibold tabular-nums ${due > 0 ? 'text-ink' : 'text-ink/40'}`}>{due > 0 ? formatINR(due) : AC.paid[lang]}</p>
                      <p className="mt-0.5 whitespace-nowrap text-[11px] text-ink/40">{o.date ? formatDate(o.date, lang, { day: 'numeric', month: 'short' }) : AC.tbc[lang]}</p>
                    </div>
                  </div>
                  {/* Event */}
                  <div className="mt-2.5 flex min-w-0 items-center gap-1.5 pl-[52px] md:mt-3 md:gap-2 md:pl-0 lg:mt-0 lg:block">
                    <p className="min-w-0 shrink truncate text-[13px] font-medium text-ink md:text-[13.5px]">{ev?.name[lang]}</p>
                    <p className="flex min-w-0 items-center gap-1 truncate text-[12px] text-ink/45"><span className="lg:hidden">·</span><Icon name="mapPin" size={12} className="hidden lg:block" />{districtName(o.district, lang)}</p>
                  </div>
                  {/* Date */}
                  <div className="hidden lg:block">
                    <p className="text-[13.5px] font-medium text-ink">{o.date ? formatDate(o.date, lang, { day: 'numeric', month: 'short', year: 'numeric' }) : AC.tbc[lang]}</p>
                    {d !== null && d >= 0 && d <= 30 && <p className={`text-[11.5px] font-medium ${d <= 7 ? 'text-ruby' : 'text-ink/45'}`}>{d === 0 ? AC.today[lang] : lang === 'ta' ? `${d} நாளில்` : `in ${d}d`}</p>}
                  </div>
                  {/* Stage */}
                  <div className="mt-2.5 flex min-w-0 items-center gap-2.5 pl-[52px] md:mt-3 md:gap-3 md:pl-0 lg:mt-0 lg:block">
                    <StatusPill status={o.status} eventType={o.eventType} className="min-w-0" />
                    <StageMeter status={o.status} className="w-14 shrink-0 sm:w-24 lg:mt-2 lg:w-[128px]" />
                    <span className="ml-auto shrink-0 lg:hidden"><AvatarStack names={crewNames(o, workers, lang)} size={24} /></span>
                  </div>
                  {/* Crew */}
                  <div className="hidden lg:block">
                    <AvatarStack names={crewNames(o, workers, lang)} size={28} empty={<span className="text-[11.5px] text-ruby/80">{t.unassigned}</span>} />
                  </div>
                  {/* Balance */}
                  <div className="hidden text-right lg:block">
                    <p className={`text-[14px] font-semibold tabular-nums ${due > 0 ? 'text-ink' : 'text-ink/40'}`}>{due > 0 ? formatINR(due) : AC.paid[lang]}</p>
                    <p className="text-[11.5px] tabular-nums text-ink/40">{formatINR(paidTotal(o))} / {formatINR(o.quote.total)}</p>
                  </div>
                  <Icon name="chevronRight" size={16} className="hidden text-ink/25 transition group-hover:translate-x-0.5 group-hover:text-ruby lg:block" />
                </Link>
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ul>
    </div>
  )
}

// ─── Kanban ──────────────────────────────────────────────────────────────────

function Board({ orders, focus, workers }: { orders: Order[]; focus: OrderStatus | 'all'; workers: Worker[] }) {
  const t = useT(copy)
  const lang = useLang()
  const setStatus = useStore(s => s.setStatus)
  const [dragId, setDragId] = useState<string | null>(null)
  const [over, setOver] = useState<OrderStatus | null>(null)

  const move = (id: string, to: OrderStatus) => {
    const o = orders.find(x => x.id === id)
    if (!o || o.status === to) return
    setStatus(id, to)
    toast(`${t.moved} ${statusName(to, o.eventType, lang)} · ${AC.waSent[lang]}`)
  }

  return (
    <div>
      <p className="mb-3 hidden items-center gap-2 text-[12.5px] text-ink/45 md:flex"><Icon name="info" size={14} />{t.dragHint}</p>
      <LayoutGroup>
        <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-6 md:-mx-8 md:scroll-px-8 md:px-8" data-lenis-prevent>
          {STATUS_ORDER.map(s => {
            const col = orders.filter(o => o.status === s).sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'))
            const dim = focus !== 'all' && focus !== s
            return (
              <section
                key={s}
                onDragOver={e => { e.preventDefault(); setOver(s) }}
                onDragLeave={() => setOver(o => (o === s ? null : o))}
                onDrop={e => {
                  e.preventDefault()
                  const id = e.dataTransfer.getData('text/plain')
                  if (id) move(id, s)
                  setOver(null)
                  setDragId(null)
                }}
                className={`flex w-[82vw] max-w-[320px] shrink-0 snap-start flex-col rounded-[24px] p-2 sm:w-[278px] sm:max-w-none transition-all duration-300 ${over === s ? 'bg-ruby-soft ring-2 ring-ruby/30' : 'bg-ink/[0.035]'} ${dim ? 'opacity-45' : ''}`}
              >
                <header className="flex items-center gap-2 px-2.5 pb-2.5 pt-2">
                  <span className={`h-2 w-2 rounded-full ${s === 'ENQUIRY' ? 'bg-ruby-bright' : s === 'DELIVERED' || s === 'BILLED' ? 'bg-ink' : 'bg-ruby'}`} />
                  <h3 className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink">{statusName(s, undefined, lang)}</h3>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold tabular-nums text-ink/55">{col.length}</span>
                </header>
                <div className="flex min-h-[120px] flex-1 flex-col gap-2">
                  {col.map(o => (
                    <BoardCard key={o.id} o={o} workers={workers} dragging={dragId === o.id} onDragStart={() => setDragId(o.id)} onDragEnd={() => { setDragId(null); setOver(null) }} onAdvance={() => { const n = nextStatus(o.status); if (n) move(o.id, n) }} />
                  ))}
                  {col.length === 0 && (
                    <div className={`flex flex-1 items-center justify-center rounded-2xl border border-dashed text-[12px] transition ${over === s ? 'border-ruby/50 text-ruby' : 'border-ink/10 text-ink/30'}`}>{t.empty}</div>
                  )}
                </div>
              </section>
            )
          })}
        </div>
      </LayoutGroup>
    </div>
  )
}

function BoardCard({ o, workers, dragging, onDragStart, onDragEnd, onAdvance }: { o: Order; workers: Worker[]; dragging: boolean; onDragStart: () => void; onDragEnd: () => void; onAdvance: () => void }) {
  const t = useT(copy)
  const lang = useLang()
  const due = balanceDue(o)
  const next = nextStatus(o.status)
  const d = daysUntil(o.date)
  return (
    <motion.div layout layoutId={`card-${o.id}`} transition={{ type: 'spring', stiffness: 380, damping: 34 }}>
      <div
        draggable
        onDragStart={e => { e.dataTransfer.setData('text/plain', o.id); e.dataTransfer.effectAllowed = 'move'; onDragStart() }}
        onDragEnd={onDragEnd}
        className={`group rounded-[18px] border hairline bg-white p-3.5 shadow-[0_1px_2px_rgba(10,10,11,0.05)] transition hover:shadow-soft cursor-grab active:cursor-grabbing ${dragging ? 'rotate-[1.5deg] opacity-50' : ''}`}
      >
        <Link to={`/admin/orders/${o.id}`} className="block" draggable={false}>
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 truncate text-[14px] font-semibold text-ink group-hover:text-ruby">{o.client.name}</p>
            <span className="shrink-0 font-mono text-[10.5px] text-ink/35">{o.id.slice(-4)}</span>
          </div>
          <p className="mt-0.5 truncate text-[12px] text-ink/50">{eventByKey(o.eventType)?.name[lang]} · {districtName(o.district, lang)}</p>
          <div className="mt-3 flex items-center gap-2 text-[11.5px]">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${d !== null && d >= 0 && d <= 7 ? 'bg-ruby-soft text-ruby-deep' : 'bg-ink/[0.04] text-ink/55'}`}>
              <Icon name="calendar" size={11} />
              {o.date ? formatDate(o.date, lang, { day: 'numeric', month: 'short' }) : AC.tbc[lang]}
            </span>
            <span className={`ml-auto font-semibold tabular-nums ${due > 0 ? 'text-ink' : 'text-ink/35'}`}>{due > 0 ? formatINR(due) : AC.paid[lang]}</span>
          </div>
        </Link>
        <div className="mt-3 flex items-center justify-between gap-2 border-t hairline pt-2.5">
          <AvatarStack names={crewNames(o, workers, lang)} size={24} empty={<span className="text-[11px] text-ruby/80">{t.unassigned}</span>} />
          {next && (
            <button type="button" onClick={onAdvance} className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full bg-ink px-3.5 text-[12px] font-semibold text-white md:h-7 md:px-2.5 md:text-[11.5px] transition hover:bg-ruby active:scale-95 cursor-pointer" title={statusName(next, o.eventType, lang)}>
              {t.advance}
              <Icon name="arrowRight" size={12} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
