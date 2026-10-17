import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Icon } from '../../components/Icon'
import { BackLink, Button, EmptyState, Segmented } from '../../components/ui'
import { EASE } from '../../components/motion'
import { CartBuilder } from '../../components/CartBuilder'
import { InvoiceDoc, PRINT_CSS, PaymentRow } from '../../components/InvoiceDoc'
import { eventByKey } from '../../lib/data'
import { cartLabel } from '../../lib/catalogue'
import { formatDate, formatDateTime, formatINR, useLang, useT } from '../../lib/i18n'
import { toast, useTitle } from '../../lib/ui'
import { balanceDue, invoiceState, paidTotal, requote, usePrices, useStore, type InvoiceState, type Milestone, type Order, type Payment } from '../../lib/store'
import { AC, ConfirmModal, MODE_LABEL, PageHeader, Panel, SearchInput, StatusPill, TextInput, initials, relTime } from './kit'

const copy = {
  eyebrow: { en: 'Quotes, invoices & payments', ta: 'மதிப்பீடுகள், ரசீதுகள் & கட்டணங்கள்' },
  title: { en: 'Billing', ta: 'கட்டணம்' },
  sub: { en: 'Every quote is priced from the catalogue and frozen into the order. Re-quote, discount, record payments and send — all from here.', ta: 'ஒவ்வொரு மதிப்பீடும் பட்டியலிலிருந்து கணக்கிடப்பட்டு ஆர்டரில் உறைகிறது. மறு மதிப்பீடு, தள்ளுபடி, கட்டணப் பதிவு, அனுப்புதல் — அனைத்தும் இங்கிருந்தே.' },
  outstanding: { en: 'Outstanding', ta: 'நிலுவை' },
  collected: { en: 'Collected', ta: 'வசூலானது' },
  drafts: { en: 'Unsent quotes', ta: 'அனுப்பாத மதிப்பீடுகள்' },
  search: { en: 'Search name, invoice or order', ta: 'பெயர், ரசீது, ஆர்டர்' },
  all: { en: 'All', ta: 'அனைத்தும்' },
  draft: { en: 'Draft', ta: 'வரைவு' },
  sent: { en: 'Sent', ta: 'அனுப்பியது' },
  partial: { en: 'Part paid', ta: 'பகுதி' },
  paid: { en: 'Paid', ta: 'செலுத்தியது' },
  colInvoice: { en: 'Invoice', ta: 'ரசீது' },
  colClient: { en: 'Client', ta: 'வாடிக்கையாளர்' },
  colEvent: { en: 'Event', ta: 'நிகழ்வு' },
  colTotal: { en: 'Total', ta: 'மொத்தம்' },
  colDue: { en: 'Due', ta: 'நிலுவை' },
  colState: { en: 'State', ta: 'நிலை' },
  empty: { en: 'No invoices match', ta: 'பொருந்தும் ரசீதுகள் இல்லை' },
  // detail
  back: { en: 'All invoices', ta: 'அனைத்து ரசீதுகள்' },
  notFound: { en: 'Invoice not found', ta: 'ரசீது கிடைக்கவில்லை' },
  order: { en: 'Order', ta: 'ஆர்டர்' },
  items: { en: 'Items & sessions', ta: 'பொருட்கள் & அமர்வுகள்' },
  itemsSub: { en: 'Change what the quote covers. Saving re-prices at today’s catalogue rates and keeps a revision.', ta: 'மதிப்பீடு உள்ளடக்கத்தை மாற்றுங்கள். சேமித்தால் இன்றைய விலையில் மறு கணக்கீடு, திருத்தம் பதிவாகும்.' },
  newTotal: { en: 'New total', ta: 'புதிய மொத்தம்' },
  currentTotal: { en: 'Current', ta: 'தற்போது' },
  saveQuote: { en: 'Save & re-quote', ta: 'சேமித்து மறு மதிப்பீடு' },
  requoted: { en: 'Quote revised from the new items', ta: 'புதிய பொருட்களிலிருந்து மதிப்பீடு திருத்தப்பட்டது' },
  adjustments: { en: 'Discounts & extras', ta: 'தள்ளுபடிகள் & கூடுதல்கள்' },
  adjustmentsSub: { en: 'Shown as their own lines on the invoice', ta: 'ரசீதில் தனி வரிகளாகக் காட்டப்படும்' },
  none: { en: 'None yet.', ta: 'இன்னும் இல்லை.' },
  discount: { en: 'Discount', ta: 'தள்ளுபடி' },
  extra: { en: 'Extra charge', ta: 'கூடுதல் கட்டணம்' },
  reason: { en: 'Reason shown on the invoice', ta: 'ரசீதில் காட்டப்படும் காரணம்' },
  reasonPh: { en: 'e.g. Season discount, extra travel day', ta: 'எ.கா. சீசன் தள்ளுபடி, கூடுதல் பயண நாள்' },
  amount: { en: 'Amount', ta: 'தொகை' },
  apply: { en: 'Apply', ta: 'பயன்படுத்து' },
  needReason: { en: 'Add a reason and an amount', ta: 'காரணமும் தொகையும் தேவை' },
  gst: { en: 'GST on this invoice', ta: 'இந்த ரசீதில் GST' },
  noGst: { en: 'Not charged', ta: 'வசூலிக்கப்படவில்லை' },
  schedule: { en: 'Payment schedule & note', ta: 'கட்டண அட்டவணை & குறிப்பு' },
  scheduleSub: { en: 'Percent of the total due at each stage. Must add up to 100.', ta: 'ஒவ்வொரு நிலையிலும் செலுத்த வேண்டிய சதவீதம். மொத்தம் 100 ஆக இருக்க வேண்டும்.' },
  advance: { en: 'Advance', ta: 'முன்பணம்' },
  event: { en: 'Before event', ta: 'நிகழ்வுக்கு முன்' },
  delivery: { en: 'Before delivery', ta: 'ஒப்படைப்புக்கு முன்' },
  sum: { en: 'Adds up to', ta: 'கூட்டுத்தொகை' },
  note: { en: 'Note printed on the invoice', ta: 'ரசீதில் அச்சிடப்படும் குறிப்பு' },
  notePh: { en: 'e.g. Advance is non-refundable within 30 days of the event.', ta: 'எ.கா. நிகழ்வுக்கு 30 நாட்களுக்குள் முன்பணம் திரும்பப் பெற முடியாது.' },
  saveMeta: { en: 'Save schedule & note', ta: 'அட்டவணை & குறிப்பைச் சேமி' },
  metaSaved: { en: 'Invoice updated', ta: 'ரசீது புதுப்பிக்கப்பட்டது' },
  payments: { en: 'Payments', ta: 'கட்டணங்கள்' },
  paymentsSub: { en: 'Offline payments recorded against this invoice', ta: 'இந்த ரசீதில் பதிவான நேரடி கட்டணங்கள்' },
  record: { en: 'Record payment', ta: 'கட்டணம் பதிவு செய்' },
  mode: { en: 'Mode', ta: 'முறை' },
  payNote: { en: 'Note (optional)', ta: 'குறிப்பு (விருப்பம்)' },
  fullBal: { en: 'Full balance', ta: 'முழு நிலுவை' },
  recorded: { en: 'Payment recorded · receipt sent on WhatsApp', ta: 'கட்டணம் பதிவானது · WhatsApp ரசீது அனுப்பப்பட்டது' },
  removePay: { en: 'Remove this payment?', ta: 'இந்தக் கட்டணத்தை நீக்கவா?' },
  removePayBody: { en: 'It will also be reversed on the invoice.', ta: 'ரசீதிலும் இது திரும்பப் பெறப்படும்.' },
  remove: { en: 'Remove', ta: 'நீக்கு' },
  removed: { en: 'Payment removed', ta: 'கட்டணம் நீக்கப்பட்டது' },
  invalidAmt: { en: 'Enter an amount above zero', ta: 'பூஜ்ஜியத்திற்கு மேல் தொகை உள்ளிடவும்' },
  preview: { en: 'Invoice', ta: 'ரசீது' },
  previewSub: { en: 'Exactly what the client sees and prints', ta: 'வாடிக்கையாளர் பார்ப்பதும் அச்சிடுவதும் இதுவே' },
  send: { en: 'Send on WhatsApp', ta: 'WhatsApp-ல் அனுப்பு' },
  resend: { en: 'Re-send', ta: 'மீண்டும் அனுப்பு' },
  sentToast: { en: 'Quote sent to the client on WhatsApp', ta: 'மதிப்பீடு வாடிக்கையாளருக்கு WhatsApp-ல் அனுப்பப்பட்டது' },
  print: { en: 'Print / PDF', ta: 'அச்சிடு / PDF' },
  openOrder: { en: 'Open order', ta: 'ஆர்டரைத் திற' },
  revisions: { en: 'Revisions', ta: 'திருத்தங்கள்' },
  revisionsSub: { en: 'Every change to the billed total', ta: 'மொத்தத் தொகையின் ஒவ்வொரு மாற்றமும்' },
  lastSent: { en: 'Last sent', ta: 'கடைசியாக அனுப்பியது' },
  neverSent: { en: 'Not sent yet', ta: 'இன்னும் அனுப்பவில்லை' },
}

const STATES: (InvoiceState | 'all')[] = ['all', 'draft', 'sent', 'partial', 'paid']

const stateTone: Record<InvoiceState, string> = {
  draft: 'border border-ink/15 text-ink/60',
  sent: 'bg-ruby-soft text-ruby-deep',
  partial: 'bg-ruby text-white',
  paid: 'bg-ink text-white',
}

function StatePill({ o }: { o: Order }) {
  const t = useT(copy)
  const s = invoiceState(o)
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${stateTone[s]}`}>
      {s === 'paid' ? <Icon name="check" size={12} strokeWidth={2.4} /> : <span className={`h-1.5 w-1.5 rounded-full ${s === 'draft' ? 'bg-ink/30' : s === 'sent' ? 'bg-ruby' : 'bg-white'}`} />}
      {t[s]}
    </span>
  )
}

// ─── List ────────────────────────────────────────────────────────────────────

export default function Billing() {
  const t = useT(copy)
  const lang = useLang()
  useTitle({ en: 'Billing', ta: 'கட்டணம்' })
  const orders = useStore(s => s.orders)
  const [state, setState] = useState<InvoiceState | 'all'>('all')
  const [q, setQ] = useState('')

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return orders
      .filter(o => state === 'all' || invoiceState(o) === state)
      .filter(o => !needle || [o.client.name, o.invoiceId, o.id, o.client.contact].some(v => v.toLowerCase().includes(needle)))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [orders, state, q])

  const outstanding = orders.reduce((s, o) => s + balanceDue(o), 0)
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const collected = orders.reduce((s, o) => s + o.payments.filter(p => p.at >= monthStart).reduce((x, p) => x + p.amount, 0), 0)
  const drafts = orders.filter(o => invoiceState(o) === 'draft').length
  const counts = Object.fromEntries(STATES.map(s => [s, s === 'all' ? orders.length : orders.filter(o => invoiceState(o) === s).length])) as Record<InvoiceState | 'all', number>

  return (
    <div>
      <PageHeader eyebrow={t.eyebrow} title={t.title} subtitle={t.sub} />

      <div className="mb-5 grid grid-cols-3 gap-2 md:gap-3">
        <Stat label={t.outstanding} value={formatINR(outstanding)} strong />
        <Stat label={t.collected} value={formatINR(collected)} />
        <Stat label={t.drafts} value={String(drafts)} />
      </div>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {STATES.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setState(s)}
              className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-medium transition cursor-pointer ${state === s ? 'bg-ink text-white' : 'bg-white text-ink/60 border border-ink/10 hover:border-ink/30'}`}
            >
              {t[s]}
              <span className={`tabular-nums ${state === s ? 'text-white/60' : 'text-ink/35'}`}>{counts[s]}</span>
            </button>
          ))}
        </div>
        <SearchInput value={q} onChange={setQ} placeholder={t.search} className="md:w-72" />
      </div>

      {rows.length === 0 ? (
        <EmptyState icon="receipt" title={t.empty} />
      ) : (
        <ul className="overflow-hidden rounded-[26px] border hairline bg-white">
          <li className="hidden grid-cols-[1.1fr_1.4fr_1.2fr_0.8fr_0.8fr_0.9fr_20px] gap-4 border-b hairline px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/40 lg:grid">
            <span>{t.colInvoice}</span><span>{t.colClient}</span><span>{t.colEvent}</span><span className="text-right">{t.colTotal}</span><span className="text-right">{t.colDue}</span><span>{t.colState}</span><span />
          </li>
          <AnimatePresence initial={false}>
            {rows.map(o => {
              const ev = eventByKey(o.eventType)
              const due = balanceDue(o)
              return (
                <motion.li key={o.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: EASE }} className="border-b hairline last:border-b-0">
                  <Link to={`/admin/billing/${o.id}`} className="group grid gap-x-4 gap-y-2 px-4 py-3.5 transition hover:bg-ink/[0.02] md:px-5 lg:grid-cols-[1.1fr_1.4fr_1.2fr_0.8fr_0.8fr_0.9fr_20px] lg:items-center">
                    <div className="flex items-center justify-between gap-3 lg:block">
                      <p className="font-mono text-[13px] font-semibold text-ink">{o.invoiceId}</p>
                      <p className="text-[11.5px] text-ink/40">{o.invoice.sentAt ? `${t.sent} · ${relTime(o.invoice.sentAt, lang)}` : t.neverSent}</p>
                    </div>
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink/[0.05] text-[11.5px] font-semibold text-ink/70">{initials(o.client.name)}</span>
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold text-ink">{o.client.name}</p>
                        <p className="truncate text-[12px] text-ink/45">{o.client.contact}</p>
                      </div>
                      <span className="ml-auto lg:hidden"><StatePill o={o} /></span>
                    </div>
                    <div className="min-w-0 pl-12 lg:pl-0">
                      <p className="truncate text-[13.5px] font-medium text-ink">{ev?.name[lang]}</p>
                      <p className="truncate text-[12px] text-ink/45">{o.date ? formatDate(o.date, lang, { day: 'numeric', month: 'short', year: 'numeric' }) : AC.tbc[lang]} · {cartLabel(o.cart)[lang]}</p>
                    </div>
                    <p className="pl-12 text-[14px] tabular-nums text-ink/70 lg:pl-0 lg:text-right">{formatINR(o.quote.total)}</p>
                    <p className={`pl-12 text-[14px] font-semibold tabular-nums lg:pl-0 lg:text-right ${due > 0 ? 'text-ink' : 'text-ink/40'}`}>{due > 0 ? formatINR(due) : AC.paid[lang]}</p>
                    <span className="hidden lg:block"><StatePill o={o} /></span>
                    <Icon name="chevronRight" size={16} className="hidden text-ink/25 transition group-hover:translate-x-0.5 group-hover:text-ruby lg:block" />
                  </Link>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      )}
    </div>
  )
}

function Stat({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`rounded-[22px] border p-3.5 md:p-5 ${strong ? 'border-ruby/20 bg-ruby-soft/50' : 'hairline bg-white'}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/45">{label}</p>
      <p className={`mt-1.5 truncate font-display text-[1.35rem] font-semibold tabular-nums md:text-[1.7rem] ${strong ? 'text-ruby' : 'text-ink'}`}>{value}</p>
    </div>
  )
}

// ─── Detail ──────────────────────────────────────────────────────────────────

export function BillingDetail() {
  const { id } = useParams()
  const t = useT(copy)
  const order = useStore(s => s.orders.find(o => o.id === id))
  useTitle({ en: `Invoice ${order?.invoiceId ?? ''}`, ta: `ரசீது ${order?.invoiceId ?? ''}` })
  if (!order) {
    return (
      <div>
        <BackLink to="/admin/billing">{t.back}</BackLink>
        <EmptyState icon="receipt" title={t.notFound} />
      </div>
    )
  }
  return <Detail o={order} />
}

function Detail({ o }: { o: Order }) {
  const t = useT(copy)
  const lang = useLang()
  const sendInvoice = useStore(s => s.sendInvoice)
  const ev = eventByKey(o.eventType)
  const send = () => {
    sendInvoice(o.id)
    toast(t.sentToast)
  }
  return (
    <div>
      <style>{PRINT_CSS}</style>
      <BackLink to="/admin/billing">{t.back}</BackLink>
      <PageHeader
        eyebrow={`${t.order} ${o.id}`}
        title={o.invoiceId}
        subtitle={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span>{o.client.name} · {ev?.name[lang]} · {o.date ? formatDate(o.date, lang) : AC.tbc[lang]}</span>
            <StatePill o={o} />
            <StatusPill status={o.status} eventType={o.eventType} />
          </span>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button to={`/admin/orders/${o.id}`} variant="outline" size="sm" iconLeft="external">{t.openOrder}</Button>
            <Button variant="outline" size="sm" iconLeft="receipt" onClick={() => window.print()}>{t.print}</Button>
            <Button variant="ink" size="sm" iconLeft="whatsapp" onClick={send}>{o.invoice.sentAt ? t.resend : t.send}</Button>
          </div>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] xl:gap-6">
        <div className="space-y-5">
          <ItemsPanel o={o} />
          <AdjustmentsPanel o={o} />
          <SchedulePanel o={o} />
          <PaymentsPanel o={o} />
        </div>
        <div className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <Panel title={t.preview} subtitle={`${t.previewSub} · ${o.invoice.sentAt ? `${t.lastSent} ${formatDateTime(o.invoice.sentAt, lang)}` : t.neverSent}`} icon="receipt" bodyClass="p-0">
            <div className="overflow-hidden rounded-b-[26px]">
              <InvoiceDoc order={o} />
            </div>
          </Panel>
          <Panel title={t.revisions} subtitle={t.revisionsSub} icon="clock">
            <ol className="space-y-3">
              {[...o.quoteHistory].reverse().map((r, i) => (
                <li key={i} className="flex items-start gap-3 text-[13px]">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${i === 0 ? 'bg-ruby' : 'bg-ink/20'}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-ink/80">{r.note}</span>
                    <span className="block text-[11.5px] text-ink/40">{formatDateTime(r.at, lang)}</span>
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums text-ink">{formatINR(r.total)}</span>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>

      {createPortal(
        <div id="ttc-print">
          <InvoiceDoc order={o} print />
        </div>,
        document.body,
      )}
    </div>
  )
}

function ItemsPanel({ o }: { o: Order }) {
  const t = useT(copy)
  const lang = useLang()
  const prices = usePrices()
  const updateOrderCart = useStore(s => s.updateOrderCart)
  const [cart, setCart] = useState(o.cart)
  const dirty = JSON.stringify(cart) !== JSON.stringify(o.cart)
  const preview = dirty ? requote({ ...o, cart }, prices).total : o.quote.total
  const save = () => {
    updateOrderCart(o.id, cart)
    toast(t.requoted)
  }
  return (
    <Panel title={t.items} subtitle={t.itemsSub} icon="grid" bodyClass="p-4 md:p-5">
      <CartBuilder cart={cart} shootItem={eventByKey(o.eventType)?.tiers.shootItem} onChange={setCart} />
      <AnimatePresence>
        {dirty && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.3, ease: EASE }} className="sticky bottom-3 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ink p-3 text-white shadow-[0_18px_40px_-16px_rgba(10,10,11,0.5)]">
            <div className="pl-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/50">{t.newTotal}</p>
              <p className="font-display text-[1.4rem] font-semibold tabular-nums">
                {formatINR(preview)} <span className="text-[12px] font-normal text-white/45">{t.currentTotal} {formatINR(o.quote.total)}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setCart(o.cart)} className="!text-white/70 hover:!text-white">{AC.discard[lang]}</Button>
              <Button variant="ruby" size="sm" onClick={save}>{t.saveQuote}</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Panel>
  )
}

function AdjustmentsPanel({ o }: { o: Order }) {
  const t = useT(copy)
  const addAdjustment = useStore(s => s.addAdjustment)
  const removeAdjustment = useStore(s => s.removeAdjustment)
  const setInvoiceMeta = useStore(s => s.setInvoiceMeta)
  const [kind, setKind] = useState<'discount' | 'extra'>('discount')
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [err, setErr] = useState('')
  const apply = () => {
    const n = Math.round(Number(amount))
    if (!label.trim() || !n) return setErr(t.needReason)
    addAdjustment(o.id, label.trim(), kind === 'discount' ? -Math.abs(n) : Math.abs(n))
    setLabel('')
    setAmount('')
    setErr('')
  }
  return (
    <Panel title={t.adjustments} subtitle={t.adjustmentsSub} icon="rupee">
      {o.adjustments.length === 0 ? (
        <p className="text-[13px] text-ink/45">{t.none}</p>
      ) : (
        <ul className="divide-y divide-ink/[0.06]">
          {o.adjustments.map(a => (
            <li key={a.id} className="flex items-center justify-between gap-3 py-2 text-[13.5px]">
              <span className="min-w-0 truncate text-ink/80">{a.label}</span>
              <span className="flex shrink-0 items-center gap-1">
                <span className={`font-semibold tabular-nums ${a.amount < 0 ? 'text-ruby' : 'text-ink'}`}>{a.amount < 0 ? '−' : '+'}{formatINR(Math.abs(a.amount))}</span>
                <button type="button" onClick={() => removeAdjustment(o.id, a.id)} aria-label={t.remove} className="flex h-8 w-8 items-center justify-center rounded-full text-ink/35 transition hover:bg-ink/[0.06] hover:text-ruby cursor-pointer">
                  <Icon name="x" size={14} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 space-y-3 rounded-2xl bg-ink/[0.025] p-3.5">
        <Segmented<'discount' | 'extra'> value={kind} onChange={setKind} size="sm" options={[{ value: 'discount', label: t.discount }, { value: 'extra', label: t.extra }]} />
        <div className="grid gap-3 sm:grid-cols-[1fr_140px_auto] sm:items-end">
          <TextInput label={t.reason} value={label} onChange={v => { setLabel(v); setErr('') }} placeholder={t.reasonPh} />
          <TextInput label={t.amount} value={amount} onChange={v => { setAmount(v.replace(/[^\d]/g, '')); setErr('') }} inputMode="numeric" prefix="₹" placeholder="0" />
          <Button variant="ink" size="sm" onClick={apply} className="max-sm:!h-11">{t.apply}</Button>
        </div>
        {err && <p className="text-[12px] text-ruby">{err}</p>}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 text-[13.5px]">
        <span className="text-ink/60">{t.gst}</span>
        <select
          value={o.invoice.gstPct}
          onChange={e => setInvoiceMeta(o.id, { gstPct: Number(e.target.value) })}
          aria-label={t.gst}
          className="h-9 rounded-full border border-ink/10 bg-white px-3 text-[13px] text-ink/80 outline-none focus:border-ruby cursor-pointer"
        >
          <option value={0}>{t.noGst}</option>
          <option value={5}>5%</option>
          <option value={12}>12%</option>
          <option value={18}>18%</option>
        </select>
      </div>
    </Panel>
  )
}

function SchedulePanel({ o }: { o: Order }) {
  const t = useT(copy)
  const setInvoiceMeta = useStore(s => s.setInvoiceMeta)
  const [schedule, setSchedule] = useState<Milestone[]>(o.invoice.schedule)
  const [note, setNote] = useState(o.invoice.note)
  const sum = schedule.reduce((s, m) => s + m.pct, 0)
  const dirty = JSON.stringify(schedule) !== JSON.stringify(o.invoice.schedule) || note !== o.invoice.note
  const setPct = (i: number, v: string) => setSchedule(s => s.map((m, k) => (k === i ? { ...m, pct: Math.min(100, Math.max(0, Number(v.replace(/[^\d]/g, '')) || 0)) } : m)))
  const save = () => {
    setInvoiceMeta(o.id, { schedule, note })
    toast(t.metaSaved)
  }
  return (
    <Panel title={t.schedule} subtitle={t.scheduleSub} icon="calendar">
      <div className="grid grid-cols-3 gap-2">
        {schedule.map((m, i) => (
          <label key={m.key} className="rounded-2xl border hairline p-3">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/45">{t[m.key]}</span>
            <span className="mt-1.5 flex items-baseline gap-1">
              <input value={m.pct} onChange={e => setPct(i, e.target.value)} inputMode="numeric" className="w-full bg-transparent font-display text-[1.5rem] font-semibold tabular-nums text-ink outline-none" />
              <span className="text-ink/40">%</span>
            </span>
            <span className="block text-[12px] tabular-nums text-ink/50">{formatINR(Math.round((o.quote.total * m.pct) / 100))}</span>
          </label>
        ))}
      </div>
      <p className={`mt-2 text-[12px] ${sum === 100 ? 'text-ink/45' : 'text-ruby'}`}>{t.sum} {sum}%</p>
      <label className="mt-4 block">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/45">{t.note}</span>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder={t.notePh} className="mt-1.5 w-full resize-none rounded-2xl border border-ink/10 bg-white px-3.5 py-2.5 text-[13.5px] text-ink outline-none transition focus:border-ruby" />
      </label>
      <div className="mt-3 flex justify-end">
        <Button variant="ink" size="sm" onClick={save} disabled={!dirty || sum !== 100}>{t.saveMeta}</Button>
      </div>
    </Panel>
  )
}

function PaymentsPanel({ o }: { o: Order }) {
  const t = useT(copy)
  const lang = useLang()
  const logPayment = useStore(s => s.logPayment)
  const removePayment = useStore(s => s.removePayment)
  const due = balanceDue(o)
  const paid = paidTotal(o)
  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState<Payment['mode']>('upi')
  const [note, setNote] = useState('')
  const [err, setErr] = useState('')
  const [removing, setRemoving] = useState<Payment | null>(null)
  const submit = () => {
    const n = Math.round(Number(amount))
    if (!n || n <= 0) return setErr(t.invalidAmt)
    logPayment(o.id, { amount: n, mode, note: note.trim() || undefined })
    setAmount('')
    setNote('')
    setErr('')
    toast(t.recorded)
  }
  return (
    <Panel title={t.payments} subtitle={`${t.paymentsSub} · ${formatINR(paid)} / ${formatINR(o.quote.total)}`} icon="receipt">
      {o.payments.length > 0 && (
        <ul className="mb-4 space-y-2">
          {o.payments.map(p => (
            <PaymentRow
              key={p.id}
              p={p}
              action={
                <button type="button" onClick={() => setRemoving(p)} aria-label={t.remove} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink/35 transition hover:bg-ink/[0.06] hover:text-ruby cursor-pointer">
                  <Icon name="trash" size={14} />
                </button>
              }
            />
          ))}
        </ul>
      )}
      <div className="space-y-3 rounded-2xl bg-ink/[0.025] p-3.5">
        <p className="text-[13px] font-semibold text-ink">{t.record}</p>
        <TextInput label={t.amount} value={amount} onChange={v => { setAmount(v.replace(/[^\d]/g, '')); setErr('') }} inputMode="numeric" prefix="₹" placeholder="0" />
        {due > 0 && (
          <button type="button" onClick={() => setAmount(String(due))} className="rounded-full border border-ink/10 bg-white px-3 py-1.5 text-[12px] font-medium text-ink/60 transition hover:border-ruby/40 hover:text-ruby cursor-pointer">
            {t.fullBal} · {formatINR(due)}
          </button>
        )}
        <Segmented<Payment['mode']> value={mode} onChange={setMode} size="sm" options={(['upi', 'bank', 'cash'] as const).map(m => ({ value: m, label: MODE_LABEL[m][lang] }))} />
        <TextInput label={t.payNote} value={note} onChange={setNote} />
        {err && <p className="text-[12px] text-ruby">{err}</p>}
        <div className="flex justify-end">
          <Button variant="ink" size="sm" onClick={submit}>{t.record}</Button>
        </div>
      </div>
      <ConfirmModal
        open={!!removing}
        onClose={() => setRemoving(null)}
        title={t.removePay}
        body={removing ? `${formatINR(removing.amount)} · ${t.removePayBody}` : ''}
        confirmLabel={t.remove}
        onConfirm={() => { if (removing) { removePayment(o.id, removing.id); toast(t.removed) } }}
      />
    </Panel>
  )
}
