import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'motion/react'
import { Icon, LogoMark } from '../../components/Icon'
import { Badge, Button, Card } from '../../components/ui'
import { EASE, Reveal } from '../../components/motion'
import { COMMON, formatDate, formatINR, useLang, useT } from '../../lib/i18n'
import { districtName, eventByKey } from '../../lib/data'
import { balanceDue, paidTotal, useMyOrder, useStore, type Order, type Payment } from '../../lib/store'
import { toast, useTitle } from '../../lib/ui'
import { PageIntro, ProgressRing, TamilCorners } from './shared'

const copy = {
  eyebrow: { en: 'Billing', ta: 'கட்டணம்' },
  title: { en: 'Your invoice, always up to date.', ta: 'உங்கள் ரசீது, எப்போதும் புதுப்பிக்கப்பட்டது.' },
  lead: {
    en: 'Payments are made offline — UPI, bank transfer or at the studio. We record each one against your invoice the day it arrives.',
    ta: 'கட்டணம் நேரடியாகச் செலுத்தப்படும் — UPI, வங்கி பரிமாற்றம் அல்லது ஸ்டுடியோவில். ஒவ்வொன்றையும் பெற்ற அன்றே ரசீதில் பதிவு செய்வோம்.',
  },
  invoice: { en: 'Invoice', ta: 'ரசீது' },
  draft: { en: 'Draft', ta: 'வரைவு' },
  partial: { en: 'Partially paid', ta: 'பகுதி செலுத்தப்பட்டது' },
  paidFull: { en: 'Paid', ta: 'செலுத்தப்பட்டது' },
  issued: { en: 'Issued', ta: 'வழங்கிய தேதி' },
  orderRef: { en: 'Order', ta: 'ஆர்டர்' },
  customer: { en: 'Customer ID', ta: 'வாடிக்கையாளர் ID' },
  due: { en: 'Due', ta: 'செலுத்த வேண்டியது' },
  beforeDelivery: { en: 'Before album delivery', ta: 'ஆல்பம் ஒப்படைப்புக்கு முன்' },
  billTo: { en: 'Billed to', ta: 'பெறுநர்' },
  event: { en: 'Event', ta: 'நிகழ்வு' },
  description: { en: 'Description', ta: 'விவரம்' },
  amount: { en: 'Amount', ta: 'தொகை' },
  adjustment: { en: 'Studio adjustment', ta: 'ஸ்டுடியோ சரிசெய்தல்' },
  total: { en: 'Total', ta: 'மொத்தம்' },
  received: { en: 'Received', ta: 'பெறப்பட்டது' },
  balance: { en: 'Balance due', ta: 'நிலுவைத் தொகை' },
  payments: { en: 'Payments received', ta: 'பெறப்பட்ட கட்டணங்கள்' },
  noPayments: { en: 'No payments recorded yet.', ta: 'இன்னும் கட்டணம் எதுவும் பதிவாகவில்லை.' },
  upi: { en: 'UPI', ta: 'UPI' },
  bank: { en: 'Bank transfer', ta: 'வங்கி பரிமாற்றம்' },
  cash: { en: 'Cash at studio', ta: 'ஸ்டுடியோவில் ரொக்கம்' },
  synced: { en: 'Updated by the studio', ta: 'ஸ்டுடியோவால் புதுப்பிக்கப்பட்டது' },
  thanks: { en: 'Thank you for trusting us with your memories.', ta: 'உங்கள் நினைவுகளை எங்களிடம் ஒப்படைத்தமைக்கு நன்றி.' },
  print: { en: 'Download / print', ta: 'பதிவிறக்கம் / அச்சிடு' },

  summary: { en: 'Payment progress', ta: 'கட்டண நிலை' },
  paidOf: { en: 'paid', ta: 'செலுத்தியது' },
  settled: { en: 'Fully settled. Thank you!', ta: 'முழுமையாகச் செலுத்தப்பட்டது. நன்றி!' },

  howTo: { en: 'How to pay', ta: 'செலுத்தும் முறை' },
  upiId: { en: 'UPI ID', ta: 'UPI முகவரி' },
  accName: { en: 'Account name', ta: 'கணக்குப் பெயர்' },
  accNo: { en: 'Account number', ta: 'கணக்கு எண்' },
  ifsc: { en: 'IFSC', ta: 'IFSC' },
  branch: { en: 'Branch', ta: 'கிளை' },
  cashNote: { en: 'Mon–Sat, 9:30 am – 8 pm', ta: 'திங்கள்–சனி, காலை 9:30 – இரவு 8' },
  addRef: {
    en: 'Add your order ID in the payment note, then send the UTR / reference on WhatsApp so we can record it.',
    ta: 'கட்டணக் குறிப்பில் ஆர்டர் எண்ணைச் சேர்த்து, UTR / குறிப்பு எண்ணை வாட்ஸ்அப்பில் அனுப்புங்கள் — உடனே பதிவு செய்வோம்.',
  },
  sendRef: { en: 'Send reference on WhatsApp', ta: 'வாட்ஸ்அப்பில் அனுப்பு' },
  copied: { en: 'Copied', ta: 'நகலெடுக்கப்பட்டது' },
  copy: { en: 'Copy', ta: 'நகலெடு' },
}

const BANK = {
  upi: 'treasurecaptureevents@hdfcbank',
  name: 'The Treasure Capture Events',
  acc: '5010 0234 5678 91',
  ifsc: 'HDFC0001234',
  branch: { en: 'West Masi Street, Madurai', ta: 'மேற்கு மாசி வீதி, மதுரை' },
}

/* Printing shows only a static copy of the invoice mounted directly under <body>. */
const PRINT_CSS = `
#ttc-print { display: none; }
@media print {
  @page { margin: 12mm; }
  html, body { background: #fff !important; }
  body > *:not(#ttc-print) { display: none !important; }
  #ttc-print { display: block !important; }
  #ttc-print * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}`

type InvoiceStatus = 'draft' | 'partial' | 'paidFull'
const statusOf = (o: Order): InvoiceStatus => {
  const paid = paidTotal(o)
  if (paid >= o.quote.total && o.quote.total > 0) return 'paidFull'
  return paid > 0 ? 'partial' : 'draft'
}

export default function Billing() {
  useTitle({ en: 'Billing', ta: 'கட்டணம்' })
  const t = useT(copy)
  const order = useMyOrder()
  if (!order) return null

  return (
    <div>
      <style>{PRINT_CSS}</style>
      <PageIntro
        eyebrow={t.eyebrow}
        title={t.title}
        lead={t.lead}
        aside={
          <Button variant="outline" iconLeft="receipt" onClick={() => window.print()} className="max-sm:w-full">
            {t.print}
          </Button>
        }
      />
      <div className="grid gap-5 md:gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[24px] border hairline bg-white shadow-soft sm:rounded-[28px]">
            <TamilCorners />
            <InvoiceBody order={order} />
          </div>
        </Reveal>
        <aside className="contents md:block md:space-y-6">
          <Summary order={order} className="order-first md:order-none" />
          <HowToPay order={order} />
        </aside>
      </div>
      {createPortal(
        <div id="ttc-print">
          <InvoiceBody order={order} print />
        </div>,
        document.body,
      )}
    </div>
  )
}

function InvoiceBody({ order, print = false }: { order: Order; print?: boolean }) {
  const t = useT(copy)
  const c = useT(COMMON)
  const lang = useLang()
  const studio = useStore(s => s.cms.studio)
  const status = statusOf(order)
  const paid = paidTotal(order)
  const due = balanceDue(order)
  const linesSum = order.quote.lines.reduce((s, l) => s + l.amount, 0)
  const adjustment = order.quote.total - linesSum
  const issued = [...order.history].reverse().find(h => h.status === 'BILLED')?.at ?? order.createdAt
  const ev = eventByKey(order.eventType)

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
                <p className="t-label text-ink/45">{t.invoice}</p>
                <p className="mt-1 font-mono text-[19px] font-semibold tracking-tight sm:text-[22px]">{order.invoiceId}</p>
              </div>
              <Badge tone={status === 'paidFull' ? 'ruby' : status === 'partial' ? 'ink' : 'outline'} className="sm:mt-2">
                {status === 'paidFull' && <Icon name="check" size={12} strokeWidth={2.6} />}
                {t[status]}
              </Badge>
            </div>
          </div>

          {/* Meta */}
          <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 rounded-2xl bg-ink/[0.025] p-4 text-[13px] sm:mt-8 sm:gap-x-6 sm:p-5 md:grid-cols-4">
            <Meta label={t.issued} value={formatDate(issued, lang)} />
            <Meta label={t.orderRef} value={<span className="font-mono">{order.id}</span>} />
            <Meta label={t.customer} value={<span className="font-mono">{order.customerId}</span>} />
            <Meta label={t.due} value={t.beforeDelivery} />
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

          {/* Lines */}
          <div className="mt-8 sm:mt-9">
            <div className="flex justify-between border-b border-ink/10 pb-2.5 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ink/40">
              <span>{t.description}</span>
              <span>{t.amount}</span>
            </div>
            <ul>
              {order.quote.lines.map((l, i) => (
                <motion.li
                  key={i}
                  className="flex items-start justify-between gap-3 border-b border-ink/[0.06] py-3.5 sm:gap-4"
                  initial={print ? false : { opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, ease: EASE, delay: i * 0.04 }}
                >
                  <span className="min-w-0">
                    <span className="block text-[14px] font-medium leading-snug sm:text-[14.5px] sm:leading-normal">{l.label[lang]}</span>
                    {l.detail && <span className="mt-0.5 block text-[12.5px] leading-snug text-ink/50 sm:leading-normal">{l.detail[lang]}</span>}
                  </span>
                  <span className={`shrink-0 text-[14px] tabular-nums sm:text-[14.5px] ${l.amount === 0 ? 'text-ink/40' : ''}`}>{formatINR(l.amount)}</span>
                </motion.li>
              ))}
              {adjustment !== 0 && (
                <li className="flex justify-between gap-4 border-b border-ink/[0.06] py-3.5 text-[14.5px]">
                  <span className="font-medium">{t.adjustment}</span>
                  <span className="tabular-nums">
                    {adjustment < 0 ? '−' : ''}
                    {formatINR(Math.abs(adjustment))}
                  </span>
                </li>
              )}
            </ul>

            <dl className="ml-auto mt-5 max-w-sm space-y-2.5 text-[14px] sm:text-[14.5px]">
              <div className="flex justify-between gap-4">
                <dt className="font-semibold">{t.total}</dt>
                <dd className="font-semibold tabular-nums">{formatINR(order.quote.total)}</dd>
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

          {/* Payments */}
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

function PaymentRow({ p }: { p: Payment }) {
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
    </li>
  )
}

function Summary({ order, className = '' }: { order: Order; className?: string }) {
  const t = useT(copy)
  const paid = paidTotal(order)
  const total = order.quote.total
  const due = balanceDue(order)
  const pct = total > 0 ? paid / total : 0
  return (
    <Reveal delay={0.06} className={className}>
      <Card className="relative p-5 sm:p-6">
        <TamilCorners />
        <p className="t-label text-ink/50">{t.summary}</p>
        <div className="mt-4 flex items-center gap-4 sm:mt-5 sm:gap-5">
          <ProgressRing value={pct} size={112} stroke={10}>
            <span className="font-display text-[28px] font-semibold leading-none tabular-nums">{Math.round(pct * 100)}%</span>
            <span className="mt-0.5 text-[11px] text-ink/50">{t.paidOf}</span>
          </ProgressRing>
          <dl className="min-w-0 flex-1 space-y-2 text-[13.5px]">
            <div className="flex justify-between gap-2">
              <dt className="text-ink/55">{t.total}</dt>
              <dd className="font-medium tabular-nums">{formatINR(total)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-ink/55">{t.received}</dt>
              <dd className="font-medium tabular-nums">{formatINR(paid)}</dd>
            </div>
            <div className="flex justify-between gap-2 border-t border-ink/[0.07] pt-2">
              <dt className="font-medium">{t.balance}</dt>
              <dd className={`font-semibold tabular-nums ${due > 0 ? 'text-ruby' : ''}`}>{formatINR(due)}</dd>
            </div>
          </dl>
        </div>
        {due === 0 && (
          <p className="mt-4 flex items-center gap-2 text-[13px] font-medium text-ruby">
            <Icon name="check" size={14} strokeWidth={2.4} />
            {t.settled}
          </p>
        )}
      </Card>
    </Reveal>
  )
}

function CopyRow({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  const t = useT(copy)
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/40">{label}</p>
        <p className={`mt-0.5 break-all text-[14px] font-medium md:truncate ${mono ? 'font-mono' : ''}`}>{value}</p>
      </div>
      <button
        type="button"
        onClick={() => navigator.clipboard?.writeText(value.replace(/\s/g, mono ? '' : ' ')).then(() => toast(`${t.copied} · ${label}`), () => {})}
        aria-label={`${t.copy} ${label}`}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink/45 md:h-9 md:w-9 transition hover:bg-ink/[0.05] hover:text-ruby cursor-pointer"
      >
        <Icon name="copy" size={15} />
      </button>
    </div>
  )
}

function HowToPay({ order }: { order: Order }) {
  const t = useT(copy)
  const lang = useLang()
  const studio = useStore(s => s.cms.studio)
  const wa = studio.whatsapp.replace(/\D/g, '')
  const msg = encodeURIComponent(`${order.id} · ${order.invoiceId} — UTR: `)
  return (
    <Reveal delay={0.1}>
      <div className="glass-ruby-tint relative rounded-[24px] p-5 sm:rounded-[28px] sm:p-6">
        <p className="t-label text-ruby">{t.howTo}</p>

        <div className="mt-4 rounded-2xl bg-white/75 px-4 py-1.5">
          <div className="flex items-center gap-2 pt-2 text-[13px] font-semibold">
            <Icon name="phone" size={15} className="text-ruby" />
            {t.upi}
          </div>
          <CopyRow label={t.upiId} value={BANK.upi} />
        </div>

        <div className="mt-3 rounded-2xl bg-white/75 px-4 py-1.5">
          <div className="flex items-center gap-2 pt-2 text-[13px] font-semibold">
            <Icon name="building" size={15} className="text-ruby" />
            {t.bank}
          </div>
          <div className="divide-y divide-ink/[0.06]">
            <CopyRow label={t.accName} value={BANK.name} mono={false} />
            <CopyRow label={t.accNo} value={BANK.acc} />
            <CopyRow label={t.ifsc} value={BANK.ifsc} />
          </div>
          <p className="pb-3 text-[12px] text-ink/50">
            {t.branch}: {BANK.branch[lang]}
          </p>
        </div>

        <div className="mt-3 flex items-start gap-3 rounded-2xl bg-white/75 p-4">
          <Icon name="home" size={15} className="mt-0.5 shrink-0 text-ruby" />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold">{t.cash}</p>
            <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink/55">{lang === 'ta' ? studio.addressTa : studio.addressEn}</p>
            <p className="text-[12.5px] text-ink/45">{t.cashNote}</p>
          </div>
        </div>

        <p className="mt-4 text-[12.5px] leading-relaxed text-ink/60">{t.addRef}</p>
        <Button href={`https://wa.me/${wa}?text=${msg}`} full size="md" iconLeft="whatsapp" className="mt-4">
          {t.sendRef}
        </Button>
      </div>
    </Reveal>
  )
}
