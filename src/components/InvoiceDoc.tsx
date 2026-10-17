import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { Icon, LogoMark } from './Icon'
import { Badge } from './ui'
import { EASE } from './motion'
import { COMMON, formatDate, formatINR, useLang, useT } from '../lib/i18n'
import { districtName, eventByKey } from '../lib/data'
import { balanceDue, invoiceState, milestones, paidTotal, useStore, type MilestoneKey, type Order, type Payment } from '../lib/store'

/*
 * The invoice as a document — the studio's own, no third-party billing.
 * Rendered on the client dashboard, in the admin billing screen and, with
 * `print`, as the static copy that goes to the printer / PDF.
 */

const copy = {
  invoice: { en: 'Invoice', ta: 'ரசீது' },
  quote: { en: 'Quotation', ta: 'மதிப்பீடு' },
  draft: { en: 'Draft', ta: 'வரைவு' },
  sent: { en: 'Sent', ta: 'அனுப்பப்பட்டது' },
  partial: { en: 'Partially paid', ta: 'பகுதி செலுத்தப்பட்டது' },
  paid: { en: 'Paid', ta: 'செலுத்தப்பட்டது' },
  issued: { en: 'Issued', ta: 'வழங்கிய தேதி' },
  revised: { en: 'Revised', ta: 'திருத்தியது' },
  orderRef: { en: 'Order', ta: 'ஆர்டர்' },
  customer: { en: 'Customer ID', ta: 'வாடிக்கையாளர் ID' },
  billTo: { en: 'Billed to', ta: 'பெறுநர்' },
  event: { en: 'Event', ta: 'நிகழ்வு' },
  description: { en: 'Description', ta: 'விவரம்' },
  amount: { en: 'Amount', ta: 'தொகை' },
  sessions: { en: 'sessions', ta: 'அமர்வுகள்' },
  session: { en: 'session', ta: 'அமர்வு' },
  included: { en: 'Included', ta: 'அடங்கும்' },
  subtotal: { en: 'Subtotal', ta: 'கூட்டுத்தொகை' },
  total: { en: 'Total', ta: 'மொத்தம்' },
  received: { en: 'Received', ta: 'பெறப்பட்டது' },
  balance: { en: 'Balance due', ta: 'நிலுவைத் தொகை' },
  schedule: { en: 'Payment schedule', ta: 'கட்டண அட்டவணை' },
  advance: { en: 'Advance to confirm the date', ta: 'தேதியை உறுதி செய்ய முன்பணம்' },
  eventDue: { en: 'Before the event', ta: 'நிகழ்வுக்கு முன்' },
  deliveryDue: { en: 'Before album delivery', ta: 'ஆல்பம் ஒப்படைப்புக்கு முன்' },
  done: { en: 'Received', ta: 'பெறப்பட்டது' },
  payments: { en: 'Payments received', ta: 'பெறப்பட்ட கட்டணங்கள்' },
  noPayments: { en: 'No payments recorded yet.', ta: 'இன்னும் கட்டணம் எதுவும் பதிவாகவில்லை.' },
  upi: { en: 'UPI', ta: 'UPI' },
  bank: { en: 'Bank transfer', ta: 'வங்கி பரிமாற்றம்' },
  cash: { en: 'Cash at studio', ta: 'ஸ்டுடியோவில் ரொக்கம்' },
  payTo: { en: 'Pay to', ta: 'செலுத்த' },
  synced: { en: 'Issued by the studio', ta: 'ஸ்டுடியோவால் வழங்கப்பட்டது' },
  thanks: { en: 'Thank you for trusting us with your memories.', ta: 'உங்கள் நினைவுகளை எங்களிடம் ஒப்படைத்தமைக்கு நன்றி.' },
  gstNote: { en: 'Amounts in Indian rupees. Travel is estimated from the venue address and confirmed before the event.', ta: 'தொகைகள் இந்திய ரூபாயில். பயணம் இடத்தின் முகவரியிலிருந்து மதிப்பிடப்பட்டு நிகழ்வுக்கு முன் உறுதி செய்யப்படும்.' },
}

const MILESTONE_LABEL: Record<MilestoneKey, keyof typeof copy> = { advance: 'advance', event: 'eventDue', delivery: 'deliveryDue' }

export function InvoiceDoc({ order, print = false, showPayments = true }: { order: Order; print?: boolean; showPayments?: boolean }) {
  const t = useT(copy)
  const c = useT(COMMON)
  const lang = useLang()
  const studio = useStore(s => s.cms.studio)
  const bank = useStore(s => s.cms.bank)
  const state = invoiceState(order)
  const paid = paidTotal(order)
  const due = balanceDue(order)
  const ev = eventByKey(order.eventType)
  const q = order.quote
  const itemSections = q.sections.filter(s => !['adjustment', 'tax'].includes(s.key))
  const adjustments = q.sections.find(s => s.key === 'adjustment')
  const isQuote = state === 'draft' || state === 'sent'
  const plan = milestones(order)
  let row = 0

  return (
    <div>
      <div className="h-1.5 bg-gradient-to-r from-ruby-deep via-ruby to-ruby-bright" aria-hidden="true" />
      <div className="p-5 sm:p-6 md:p-10">
        {/* Header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="flex min-w-0 items-start gap-3">
            <LogoMark size={40} />
            <div className="min-w-0">
              <p className={`leading-tight ${lang === 'ta' ? 'font-accent text-[18px] font-semibold' : 'font-display text-[22px] font-semibold'}`}>{c.brand}</p>
              <p className="mt-1 max-w-[260px] text-[12.5px] leading-relaxed text-ink/50">{lang === 'ta' ? studio.addressTa : studio.addressEn}</p>
              <p className="text-[12.5px] text-ink/50 [overflow-wrap:anywhere]">
                {studio.phone} · {studio.email}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-2xl border hairline px-4 py-3 sm:block sm:rounded-none sm:border-0 sm:p-0 sm:text-right">
            <div>
              <p className="t-label text-ink/45">{isQuote ? t.quote : t.invoice}</p>
              <p className="mt-1 font-mono text-[19px] font-semibold tracking-tight sm:text-[22px]">{order.invoiceId}</p>
            </div>
            <Badge tone={state === 'paid' ? 'ruby' : state === 'partial' || state === 'sent' ? 'ink' : 'outline'} className="sm:mt-2">
              {state === 'paid' && <Icon name="check" size={12} strokeWidth={2.6} />}
              {t[state]}
            </Badge>
          </div>
        </div>

        {/* Meta */}
        <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 rounded-2xl bg-ink/[0.025] p-4 text-[13px] sm:mt-8 sm:gap-x-6 sm:p-5 md:grid-cols-4">
          <Meta label={t.issued} value={formatDate(order.invoice.issuedAt, lang)} />
          <Meta label={order.invoice.revisedAt ? t.revised : t.orderRef} value={order.invoice.revisedAt ? formatDate(order.invoice.revisedAt, lang) : <span className="font-mono">{order.id}</span>} />
          <Meta label={t.customer} value={<span className="font-mono">{order.customerId}</span>} />
          <Meta label={t.balance} value={<span className={due > 0 ? 'text-ruby' : ''}>{formatINR(due)}</span>} />
        </dl>

        {/* Parties */}
        <div className="mt-6 grid gap-5 sm:mt-8 sm:grid-cols-2 sm:gap-6">
          <div>
            <p className="t-label text-ink/45">{t.billTo}</p>
            <p className="mt-2 text-[16px] font-semibold">{order.client.name}</p>
            <p className="text-[13.5px] text-ink/55">{order.client.contact}</p>
            {order.client.email && <p className="text-[13.5px] text-ink/55 [overflow-wrap:anywhere]">{order.client.email}</p>}
          </div>
          <div>
            <p className="t-label text-ink/45">{t.event}</p>
            <p className="mt-2 text-[16px] font-semibold">
              {ev?.name[lang]} · {formatDate(order.date, lang)}
            </p>
            <p className="text-[13.5px] text-ink/55">{[order.venueName, order.venueAddress].filter(Boolean).join(', ')}</p>
            <p className="text-[13.5px] text-ink/55">{districtName(order.district, lang)}</p>
          </div>
        </div>

        {/* Lines by section */}
        <div className="mt-8 sm:mt-9">
          <div className="flex justify-between border-b border-ink/10 pb-2.5 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ink/40">
            <span>{t.description}</span>
            <span>{t.amount}</span>
          </div>
          {itemSections.map(sec => (
            <div key={sec.key} className="border-b border-ink/[0.06] py-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-ruby">
                  {sec.name[lang]}
                  {sec.key === 'crew' && <span className="ml-1.5 normal-case tracking-normal text-ink/45">· {order.cart.sessions} {order.cart.sessions > 1 ? t.sessions : t.session}</span>}
                </p>
                <p className="text-[13px] font-semibold tabular-nums">{formatINR(sec.amount)}</p>
              </div>
              <ul className="mt-1.5">
                {sec.lines.map(l => (
                  <motion.li
                    key={`${sec.key}-${l.id ?? l.label.en}`}
                    className="flex items-start justify-between gap-3 py-1.5 sm:gap-4"
                    initial={print ? false : { opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, ease: EASE, delay: row++ * 0.03 }}
                  >
                    <span className="min-w-0">
                      <span className="block text-[14px] leading-snug sm:text-[14.5px]">{l.label[lang]}</span>
                      {l.detail && <span className="mt-0.5 block text-[12px] leading-snug text-ink/45">{l.detail[lang]}</span>}
                    </span>
                    <span className={`shrink-0 text-[14px] tabular-nums sm:text-[14.5px] ${l.amount === 0 ? 'text-ink/40' : 'text-ink/80'}`}>{l.amount === 0 ? t.included : formatINR(l.amount)}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          ))}

          <dl className="ml-auto mt-5 max-w-sm space-y-2.5 text-[14px] sm:text-[14.5px]">
            {(q.adjustments !== 0 || q.tax > 0) && (
              <div className="flex justify-between gap-4 text-ink/60">
                <dt>{t.subtotal}</dt>
                <dd className="tabular-nums">{formatINR(q.subtotal)}</dd>
              </div>
            )}
            {adjustments?.lines.map((l, i) => (
              <div key={i} className="flex justify-between gap-4 text-ink/70">
                <dt>{l.label[lang]}</dt>
                <dd className={`tabular-nums ${l.amount < 0 ? 'text-ruby' : ''}`}>{l.amount < 0 ? '−' : '+'}{formatINR(Math.abs(l.amount))}</dd>
              </div>
            ))}
            {q.tax > 0 && (
              <div className="flex justify-between gap-4 text-ink/70">
                <dt>GST {order.invoice.gstPct}%</dt>
                <dd className="tabular-nums">{formatINR(q.tax)}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4 border-t border-ink/10 pt-3">
              <dt className="font-semibold">{t.total}</dt>
              <dd className="font-semibold tabular-nums">{formatINR(q.total)}</dd>
            </div>
            <div className="flex justify-between gap-4 text-ink/60">
              <dt>{t.received}</dt>
              <dd className="tabular-nums">− {formatINR(paid)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-t border-ink/10 pt-3">
              <dt className="font-semibold">{t.balance}</dt>
              <dd className={`font-display text-[24px] font-semibold tabular-nums sm:text-[28px] ${due > 0 ? 'text-ruby' : 'text-ink'}`}>{formatINR(due)}</dd>
            </div>
          </dl>
        </div>

        {/* Schedule */}
        <div className="mt-8 sm:mt-10">
          <p className="t-label text-ink/45">{t.schedule}</p>
          <ol className="mt-3 grid gap-2 sm:grid-cols-3">
            {plan.map((m, i) => (
              <li key={m.key} className={`rounded-2xl border p-3.5 ${m.done ? 'border-ruby/30 bg-ruby-soft/50' : 'hairline'}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/40">{i + 1} · {m.pct}%</span>
                  {m.done && <Icon name="check" size={14} strokeWidth={2.6} className="text-ruby" />}
                </div>
                <p className="mt-1.5 text-[15px] font-semibold tabular-nums">{formatINR(m.amount)}</p>
                <p className="mt-0.5 text-[12px] leading-snug text-ink/55">{t[MILESTONE_LABEL[m.key]]}</p>
                {!m.done && m.paid > 0 && <p className="mt-1 text-[11.5px] text-ruby">{formatINR(m.paid)} {t.done.toLowerCase()}</p>}
              </li>
            ))}
          </ol>
        </div>

        {/* Payments */}
        {showPayments && (
          <div className="mt-8 sm:mt-10">
            <p className="t-label text-ink/45">{t.payments}</p>
            {order.payments.length === 0 ? (
              <p className="mt-3 rounded-2xl border border-dashed border-ink/15 p-4 text-[13.5px] text-ink/50">{t.noPayments}</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {order.payments.map(p => (
                  <PaymentRow key={p.id} p={p} />
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Pay to + notes */}
        <div className="mt-8 grid gap-4 rounded-2xl bg-ink/[0.025] p-4 text-[12.5px] text-ink/60 sm:grid-cols-2 sm:p-5">
          <div>
            <p className="t-label text-ink/45">{t.payTo}</p>
            <p className="mt-1.5 font-medium text-ink/80">{bank.name}</p>
            <p>UPI · <span className="font-mono">{bank.upi}</span></p>
            <p>A/c <span className="font-mono">{bank.acc}</span> · IFSC <span className="font-mono">{bank.ifsc}</span></p>
          </div>
          <div>
            {order.invoice.note && <p className="mb-2 whitespace-pre-line text-ink/75">{order.invoice.note}</p>}
            <p className="leading-relaxed">{t.gstNote}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex flex-col gap-3 border-t border-ink/[0.07] pt-5 text-[12.5px] text-ink/45 sm:mt-10 sm:flex-row sm:items-center sm:justify-between sm:pt-6">
          <span className="inline-flex items-center gap-1.5">
            <Icon name="receipt" size={13} />
            {t.synced} · {order.invoiceId}
          </span>
          <span className="italic-accent text-[15px] text-ink/60">{t.thanks}</span>
        </div>
      </div>
    </div>
  )
}

function Meta({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/40">{label}</dt>
      <dd className="mt-1 break-words font-medium text-ink/85 md:truncate">{value}</dd>
    </div>
  )
}

export function PaymentRow({ p, action }: { p: Payment; action?: ReactNode }) {
  const t = useT(copy)
  const lang = useLang()
  const mode = p.mode === 'upi' ? t.upi : p.mode === 'bank' ? t.bank : t.cash
  const icon = p.mode === 'cash' ? 'home' : p.mode === 'bank' ? 'building' : 'phone'
  return (
    <li className="flex items-center gap-3 rounded-2xl border hairline p-3 sm:gap-3.5 sm:p-3.5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ruby-soft text-ruby">
        <Icon name={icon} size={17} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-medium">{mode}</span>
        <span className="block truncate text-[12.5px] text-ink/50">
          {formatDate(p.at, lang)}
          {p.note ? ` · ${p.note}` : ''}
        </span>
      </span>
      <span className="shrink-0 text-[15px] font-semibold tabular-nums">{formatINR(p.amount)}</span>
      {action}
    </li>
  )
}

/* Printing shows only a static copy of the invoice mounted directly under <body>. */
export const PRINT_CSS = `
#ttc-print { display: none; }
@media print {
  @page { margin: 12mm; }
  html, body { background: #fff !important; }
  body > *:not(#ttc-print) { display: none !important; }
  #ttc-print { display: block !important; }
  #ttc-print * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}`
