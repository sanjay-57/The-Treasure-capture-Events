import { createPortal } from 'react-dom'
import { Icon } from '../../components/Icon'
import { Button, Card } from '../../components/ui'
import { Reveal } from '../../components/motion'
import { InvoiceDoc, PRINT_CSS } from '../../components/InvoiceDoc'
import { formatINR, useLang, useT } from '../../lib/i18n'
import { balanceDue, milestones, paidTotal, useMyOrder, useStore, type Order } from '../../lib/store'
import { toast, useTitle } from '../../lib/ui'
import { PageIntro, ProgressRing, TamilCorners } from './shared'

const copy = {
  eyebrow: { en: 'Billing', ta: 'கட்டணம்' },
  title: { en: 'Your invoice, always up to date.', ta: 'உங்கள் ரசீது, எப்போதும் புதுப்பிக்கப்பட்டது.' },
  lead: {
    en: 'Payments are made offline — UPI, bank transfer or at the studio. We record each one against your invoice the day it arrives.',
    ta: 'கட்டணம் நேரடியாகச் செலுத்தப்படும் — UPI, வங்கி பரிமாற்றம் அல்லது ஸ்டுடியோவில். ஒவ்வொன்றையும் பெற்ற அன்றே ரசீதில் பதிவு செய்வோம்.',
  },
  print: { en: 'Download / print', ta: 'பதிவிறக்கம் / அச்சிடு' },
  summary: { en: 'Payment progress', ta: 'கட்டண நிலை' },
  paidOf: { en: 'paid', ta: 'செலுத்தியது' },
  total: { en: 'Total', ta: 'மொத்தம்' },
  received: { en: 'Received', ta: 'பெறப்பட்டது' },
  balance: { en: 'Balance due', ta: 'நிலுவைத் தொகை' },
  settled: { en: 'Fully settled. Thank you!', ta: 'முழுமையாகச் செலுத்தப்பட்டது. நன்றி!' },
  nextUp: { en: 'Next payment', ta: 'அடுத்த கட்டணம்' },
  advance: { en: 'Advance to confirm your date', ta: 'தேதியை உறுதி செய்ய முன்பணம்' },
  event: { en: 'Before the event', ta: 'நிகழ்வுக்கு முன்' },
  delivery: { en: 'Before album delivery', ta: 'ஆல்பம் ஒப்படைப்புக்கு முன்' },
  howTo: { en: 'How to pay', ta: 'செலுத்தும் முறை' },
  upi: { en: 'UPI', ta: 'UPI' },
  bank: { en: 'Bank transfer', ta: 'வங்கி பரிமாற்றம்' },
  cash: { en: 'Cash at studio', ta: 'ஸ்டுடியோவில் ரொக்கம்' },
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
  askQuote: { en: 'Ask about this quote', ta: 'இந்த மதிப்பீடு பற்றிக் கேள்' },
  copied: { en: 'Copied', ta: 'நகலெடுக்கப்பட்டது' },
  copy: { en: 'Copy', ta: 'நகலெடு' },
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
            <InvoiceDoc order={order} />
          </div>
        </Reveal>
        <aside className="contents md:block md:space-y-6">
          <Summary order={order} className="order-first md:order-none" />
          <HowToPay order={order} />
        </aside>
      </div>
      {createPortal(
        <div id="ttc-print">
          <InvoiceDoc order={order} print />
        </div>,
        document.body,
      )}
    </div>
  )
}

function Summary({ order, className = '' }: { order: Order; className?: string }) {
  const t = useT(copy)
  const paid = paidTotal(order)
  const total = order.quote.total
  const due = balanceDue(order)
  const pct = total > 0 ? paid / total : 0
  const next = milestones(order).find(m => !m.done)
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
        {due === 0 ? (
          <p className="mt-4 flex items-center gap-2 text-[13px] font-medium text-ruby">
            <Icon name="check" size={14} strokeWidth={2.4} />
            {t.settled}
          </p>
        ) : (
          next && (
            <div className="mt-4 rounded-2xl bg-ruby-soft/70 p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ruby">{t.nextUp}</p>
              <p className="mt-1 font-display text-[1.4rem] font-semibold tabular-nums text-ink">{formatINR(next.amount - next.paid)}</p>
              <p className="text-[12.5px] text-ink/60">{t[next.key]}</p>
            </div>
          )
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
  const bank = useStore(s => s.cms.bank)
  const wa = studio.whatsapp.replace(/\D/g, '')
  const msg = encodeURIComponent(`${order.id} · ${order.invoiceId} — UTR: `)
  const ask = encodeURIComponent(`Hi! I have a question about my quote ${order.invoiceId} (${order.id}). `)
  return (
    <Reveal delay={0.1}>
      <div className="glass-ruby-tint relative rounded-[24px] p-5 sm:rounded-[28px] sm:p-6">
        <p className="t-label text-ruby">{t.howTo}</p>

        <div className="mt-4 rounded-2xl bg-white/75 px-4 py-1.5">
          <div className="flex items-center gap-2 pt-2 text-[13px] font-semibold">
            <Icon name="phone" size={15} className="text-ruby" />
            {t.upi}
          </div>
          <CopyRow label={t.upiId} value={bank.upi} />
        </div>

        <div className="mt-3 rounded-2xl bg-white/75 px-4 py-1.5">
          <div className="flex items-center gap-2 pt-2 text-[13px] font-semibold">
            <Icon name="building" size={15} className="text-ruby" />
            {t.bank}
          </div>
          <div className="divide-y divide-ink/[0.06]">
            <CopyRow label={t.accName} value={bank.name} mono={false} />
            <CopyRow label={t.accNo} value={bank.acc} />
            <CopyRow label={t.ifsc} value={bank.ifsc} />
          </div>
          <p className="pb-3 text-[12px] text-ink/50">
            {t.branch}: {lang === 'ta' ? bank.branchTa : bank.branchEn}
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
        <Button href={`https://wa.me/${wa}?text=${ask}`} full size="md" variant="outline" iconLeft="quote" className="mt-2">
          {t.askQuote}
        </Button>
      </div>
    </Reveal>
  )
}
