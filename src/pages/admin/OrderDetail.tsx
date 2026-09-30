import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Icon } from '../../components/Icon'
import { BackLink, Button, EmptyState, Img, Modal, Segmented } from '../../components/ui'
import { EASE } from '../../components/motion'
import {
  ALBUM, CROWDS, PACKAGES, ROLES, STATUS_META, STATUS_ORDER, VENUES, districtName, eventByKey, statusName,
  type OrderStatus, type Worker,
} from '../../lib/data'
import { formatDate, formatDateTime, formatINR, useLang, useT, useTx } from '../../lib/i18n'
import type { ImgKey } from '../../lib/images'
import { toast, useTitle } from '../../lib/ui'
import { CoverMasthead } from '../dashboard/Photos'
import { proofFile, resolveCover, useProofs } from '../dashboard/shared'
import { balanceDue, paidTotal, useStore, type Order, type OutboxMessage, type Payment, statusMessage } from '../../lib/store'
import {
  AC, Avatar, ConfirmModal, CopyButton, MODE_LABEL, Meta, PageHeader, Panel, Progress, StatusPill, Stars, TextInput, WaBubble, WaFrame,
  daysUntil, inDays, nextStatus, relTime, stageIndex, telHref, waHref,
} from './kit'

const copy = {
  cover: { en: 'Gallery cover', ta: 'கேலரி அட்டைப்பக்கம்' },
  coverSub: { en: 'The magazine-style masthead the client sees above their proofs.', ta: 'வாடிக்கையாளர் தம் படங்களுக்கு மேல் பார்க்கும் இதழ் பாணி தலைப்பு.' },
  coverName: { en: 'Name on cover', ta: 'அட்டையில் பெயர்' },
  coverDate: { en: 'Event date (as printed)', ta: 'நிகழ்வுத் தேதி (அச்சிட வேண்டியபடி)' },
  bannerMode: { en: 'Banner', ta: 'பேனர்' },
  dpMode: { en: 'Display picture', ta: 'முகப்புப் படம்' },
  pickBanner: { en: 'Tap 4–5 uploaded proofs for the banner collage, in order.', ta: 'பேனர் தொகுப்புக்கு 4–5 படங்களை வரிசையாகத் தொடுங்கள்.' },
  pickDp: { en: 'Tap the proof to use as the display picture.', ta: 'முகப்புப் படமாக வேண்டிய படத்தைத் தொடுங்கள்.' },
  needBanner: { en: 'Choose at least 4 banner images', ta: 'குறைந்தது 4 பேனர் படங்களைத் தேர்வுசெய்யுங்கள்' },
  saveCover: { en: 'Save cover', ta: 'அட்டையைச் சேமி' },
  resetCover: { en: 'Use defaults', ta: 'இயல்புநிலை' },
  coverSaved: { en: 'Gallery cover updated', ta: 'கேலரி அட்டை புதுப்பிக்கப்பட்டது' },
  customCover: { en: 'Custom', ta: 'தனிப்பயன்' },
  defaultCover: { en: 'Default', ta: 'இயல்புநிலை' },
  back: { en: 'All orders', ta: 'அனைத்து ஆர்டர்கள்' },
  notFound: { en: 'Order not found', ta: 'ஆர்டர் கிடைக்கவில்லை' },
  notFoundBody: { en: 'It may have been removed when the demo data was reset.', ta: 'டெமோ தரவு மீட்டமைக்கப்பட்டபோது நீக்கப்பட்டிருக்கலாம்.' },
  created: { en: 'Enquired', ta: 'விசாரித்தது' },
  call: { en: 'Call', ta: 'அழை' },
  whatsapp: { en: 'WhatsApp', ta: 'WhatsApp' },
  advanceTo: { en: 'Advance to', ta: 'அடுத்த நிலை:' },
  complete: { en: 'Order complete', ta: 'ஆர்டர் நிறைவு' },
  pipeline: { en: 'Order stage', ta: 'ஆர்டர் நிலை' },
  pipelineSub: { en: 'Changing the stage updates the client’s header and dashboard, and sends a WhatsApp template.', ta: 'நிலையை மாற்றினால் வாடிக்கையாளரின் தலைப்பும் பக்கமும் புதுப்பிக்கப்பட்டு WhatsApp அனுப்பப்படும்.' },
  setStage: { en: 'Move this order to', ta: 'இந்த ஆர்டரை மாற்றவா:' },
  setStageBody: { en: 'The client will receive this message on WhatsApp:', ta: 'வாடிக்கையாளருக்கு WhatsApp-ல் இந்தச் செய்தி அனுப்பப்படும்:' },
  backwards: { en: 'This moves the order back a stage.', ta: 'இது ஆர்டரை முந்தைய நிலைக்குத் திருப்புகிறது.' },
  moveSend: { en: 'Move & send', ta: 'மாற்றி அனுப்பு' },
  details: { en: 'Client & event', ta: 'வாடிக்கையாளர் & நிகழ்வு' },
  client: { en: 'Client', ta: 'வாடிக்கையாளர்' },
  phone: { en: 'Phone', ta: 'தொலைபேசி' },
  email: { en: 'Email', ta: 'மின்னஞ்சல்' },
  event: { en: 'Event', ta: 'நிகழ்வு' },
  when: { en: 'Date & time', ta: 'தேதி & நேரம்' },
  tentative: { en: 'Tentative', ta: 'தற்காலிகம்' },
  district: { en: 'District', ta: 'மாவட்டம்' },
  venue: { en: 'Venue', ta: 'இடம்' },
  crowd: { en: 'Guests', ta: 'விருந்தினர்' },
  duration: { en: 'Coverage', ta: 'படப்பிடிப்பு நேரம்' },
  hours: { en: 'hours', ta: 'மணி நேரம்' },
  distance: { en: 'Distance from studio', ta: 'ஸ்டுடியோவிலிருந்து தூரம்' },
  package: { en: 'Package', ta: 'தொகுப்பு' },
  notes: { en: 'Client notes', ta: 'வாடிக்கையாளர் குறிப்புகள்' },
  quote: { en: 'Quote', ta: 'கட்டண மதிப்பீடு' },
  quoteSub: { en: 'Line items on the invoice', ta: 'ரசீதில் உள்ள விவரங்கள்' },
  subtotal: { en: 'Calculated', ta: 'கணக்கிட்டது' },
  adjustment: { en: 'Adjustment', ta: 'சரிசெய்தல்' },
  finalTotal: { en: 'Final total', ta: 'இறுதித் தொகை' },
  adjust: { en: 'Adjust final total', ta: 'இறுதித் தொகையை மாற்று' },
  saveTotal: { en: 'Update total', ta: 'தொகையைப் புதுப்பி' },
  totalSaved: { en: 'Final total updated · invoice revised', ta: 'இறுதித் தொகை புதுப்பிக்கப்பட்டது · ரசீது திருத்தப்பட்டது' },
  resetCalc: { en: 'Use calculated', ta: 'கணக்கிட்டதைப் பயன்படுத்து' },
  payments: { en: 'Payments', ta: 'கட்டணங்கள்' },
  paymentsSub: { en: 'Offline payments · amount paid & pending', ta: 'நேரடி கட்டணங்கள் · செலுத்தியது & நிலுவை' },
  paid: { en: 'Paid', ta: 'செலுத்தியது' },
  pending: { en: 'Pending', ta: 'நிலுவை' },
  total: { en: 'Total', ta: 'மொத்தம்' },
  record: { en: 'Record payment', ta: 'கட்டணம் பதிவு செய்' },
  amount: { en: 'Amount', ta: 'தொகை' },
  mode: { en: 'Mode', ta: 'முறை' },
  note: { en: 'Note (optional)', ta: 'குறிப்பு (விருப்பம்)' },
  notePh: { en: 'Optional note', ta: 'குறிப்பு (விருப்பம்)' },
  fullBal: { en: 'Full balance', ta: 'முழு நிலுவை' },
  half: { en: 'Half', ta: 'பாதி' },
  recorded: { en: 'Payment recorded · receipt sent on WhatsApp', ta: 'கட்டணம் பதிவானது · WhatsApp ரசீது அனுப்பப்பட்டது' },
  noPayments: { en: 'No payments recorded yet.', ta: 'இன்னும் கட்டணம் எதுவும் பதிவாகவில்லை.' },
  removePay: { en: 'Remove this payment?', ta: 'இந்தக் கட்டணத்தை நீக்கவா?' },
  removePayBody: { en: 'It will also be reversed on the invoice.', ta: 'ரசீதிலும் இது திரும்பப் பெறப்படும்.' },
  remove: { en: 'Remove', ta: 'நீக்கு' },
  removed: { en: 'Payment removed', ta: 'கட்டணம் நீக்கப்பட்டது' },
  invalidAmt: { en: 'Enter an amount above zero', ta: 'பூஜ்ஜியத்திற்கு மேல் தொகை உள்ளிடவும்' },
  invoiceTitle: { en: 'Invoice', ta: 'ரசீது' },
  invoiceSub: { en: 'Managed in the billing area', ta: 'கட்டணப் பகுதியில் நிர்வகிக்கப்படும்' },
  customer: { en: 'Customer ID', ta: 'வாடிக்கையாளர் ID' },
  invoice: { en: 'Invoice', ta: 'ரசீது' },
  state: { en: 'Invoice state', ta: 'ரசீது நிலை' },
  draft: { en: 'Draft', ta: 'வரைவு' },
  partial: { en: 'Partially paid', ta: 'பகுதியளவு செலுத்தப்பட்டது' },
  paidFull: { en: 'Paid', ta: 'முழுமையாகச் செலுத்தப்பட்டது' },
  openBilling: { en: 'Billing', ta: 'கட்டணம்' },
  copy: { en: 'Copy', ta: 'நகலெடு' },
  crew: { en: 'Crew dispatch', ta: 'குழு அனுப்புதல்' },
  crewSub: { en: 'Assigning sends the job to the photographer on WhatsApp', ta: 'ஒதுக்கினால் பணி விவரம் புகைப்படக் கலைஞருக்கு WhatsApp-ல் அனுப்பப்படும்' },
  assigned: { en: 'On this job', ta: 'இந்தப் பணியில்' },
  noCrew: { en: 'Nobody assigned yet — pick from the suggestions below.', ta: 'இன்னும் யாரும் ஒதுக்கப்படவில்லை — கீழே உள்ள பரிந்துரைகளிலிருந்து தேர்ந்தெடுக்கவும்.' },
  suggested: { en: 'Suggested', ta: 'பரிந்துரைகள்' },
  sameDistrict: { en: 'Same district', ta: 'அதே மாவட்டம்' },
  assign: { en: 'Assign', ta: 'ஒதுக்கு' },
  unassign: { en: 'Remove from job', ta: 'பணியிலிருந்து நீக்கு' },
  unassigned: { en: 'removed from this job', ta: 'இந்தப் பணியிலிருந்து நீக்கப்பட்டார்' },
  showAll: { en: 'Show all crew', ta: 'அனைவரையும் காட்டு' },
  showLess: { en: 'Show fewer', ta: 'குறைவாகக் காட்டு' },
  dispatched: { en: 'Job dispatched', ta: 'பணி அனுப்பப்பட்டது' },
  dispatchedBody: { en: 'This WhatsApp was sent to', ta: 'இந்த WhatsApp அனுப்பப்பட்டது:' },
  done: { en: 'Done', ta: 'சரி' },
  jobs: { en: 'jobs', ta: 'பணிகள்' },
  delivery: { en: 'Album delivery', ta: 'ஆல்பம் ஒப்படைப்பு' },
  deliverySub: { en: 'Courier & tracking shown to the client', ta: 'கூரியர் & கண்காணிப்பு வாடிக்கையாளருக்குக் காட்டப்படும்' },
  courier: { en: 'Courier', ta: 'கூரியர்' },
  tracking: { en: 'Tracking number', ta: 'கண்காணிப்பு எண்' },
  saveDelivery: { en: 'Save dispatch', ta: 'அனுப்புதலைச் சேமி' },
  deliverySaved: { en: 'Dispatch details saved', ta: 'அனுப்புதல் விவரம் சேமிக்கப்பட்டது' },
  dispatchedOn: { en: 'Dispatched', ta: 'அனுப்பப்பட்டது' },
  edit: { en: 'Edit', ta: 'திருத்து' },
  markDelivered: { en: 'Mark as delivered', ta: 'ஒப்படைக்கப்பட்டதாகக் குறி' },
  hand: { en: 'Hand delivery', ta: 'நேரடி ஒப்படைப்பு' },
  progress: { en: 'Client progress', ta: 'வாடிக்கையாளர் முன்னேற்றம்' },
  progressSub: { en: 'What the client has done in their dashboard', ta: 'வாடிக்கையாளர் தம் பக்கத்தில் செய்தவை' },
  selection: { en: 'Photo selection', ta: 'படத் தேர்வு' },
  photos: { en: 'photos selected', ta: 'படங்கள் தேர்வு' },
  submitted: { en: 'Submitted', ta: 'சமர்ப்பிக்கப்பட்டது' },
  inProgress: { en: 'In progress', ta: 'நடந்து கொண்டிருக்கிறது' },
  album: { en: 'Album design', ta: 'ஆல்பம் வடிவமைப்பு' },
  notYet: { en: 'Not started', ta: 'இன்னும் தொடங்கவில்லை' },
  sheets: { en: 'sheets', ta: 'தாள்கள்' },
  review: { en: 'Review', ta: 'கருத்து' },
  noReview: { en: 'Awaiting review', ta: 'கருத்துக்காகக் காத்திருக்கிறது' },
  log: { en: 'Message log', ta: 'செய்திப் பதிவு' },
  logSub: { en: 'Every WhatsApp sent for this order', ta: 'இந்த ஆர்டருக்காக அனுப்பிய அனைத்து WhatsApp-களும்' },
  noLog: { en: 'No messages for this order yet.', ta: 'இந்த ஆர்டருக்கு இன்னும் செய்திகள் இல்லை.' },
  toCrew: { en: 'to crew', ta: 'குழுவினருக்கு' },
  toClient: { en: 'to client', ta: 'வாடிக்கையாளருக்கு' },
  history: { en: 'Stage history', ta: 'நிலை வரலாறு' },
}

const statusPreview = statusMessage

export default function OrderDetail() {
  const { id } = useParams()
  const t = useT(copy)
  const lang = useLang()
  const order = useStore(s => s.orders.find(o => o.id === id))
  const setStatus = useStore(s => s.setStatus)
  const [target, setTarget] = useState<OrderStatus | null>(null)
  useTitle({ en: order ? `${order.id} · ${order.client.name}` : 'Order', ta: order ? `${order.id} · ${order.client.name}` : 'ஆர்டர்' })

  if (!order) {
    return (
      <div>
        <BackLink to="/admin/orders">{t.back}</BackLink>
        <div className="mt-8"><EmptyState icon="search" title={t.notFound} body={t.notFoundBody} action={<Button to="/admin/orders" variant="ink" size="sm">{t.back}</Button>} /></div>
      </div>
    )
  }

  const o = order
  const next = nextStatus(o.status)
  const ev = eventByKey(o.eventType)
  const d = daysUntil(o.date)

  const confirmMove = () => {
    if (!target) return
    setStatus(o.id, target)
    toast(`${statusName(target, o.eventType, lang)} · ${AC.waSent[lang]}`)
  }

  return (
    <div>
      <BackLink to="/admin/orders">{t.back}</BackLink>
      <div className="mt-5">
        <PageHeader
          title={o.client.name}
          subtitle={
            <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="inline-flex items-center gap-0.5 font-mono text-[12.5px] text-ink/60">{o.id}<CopyButton text={o.id} label={t.copy} /></span>
              <StatusPill status={o.status} eventType={o.eventType} />
              <span className="text-[13px] text-ink/45">{ev?.name[lang]} · {districtName(o.district, lang)}{d !== null ? ` · ${inDays(d, lang)}` : ''}</span>
            </span>
          }
          actions={
            <>
              <Button href={telHref(o.client.contact)} variant="outline" size="sm" iconLeft="phone" className="flex-1 max-md:!h-10 md:flex-none">{t.call}</Button>
              <Button href={waHref(o.client.contact)} variant="outline" size="sm" iconLeft="whatsapp" className="flex-1 max-md:!h-10 md:flex-none">{t.whatsapp}</Button>
              {next ? (
                <Button size="sm" icon="arrowRight" onClick={() => setTarget(next)} className="w-full max-md:!h-11 md:w-auto">{t.advanceTo} {statusName(next, o.eventType, lang)}</Button>
              ) : (
                <span className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-ink px-4 text-[13px] font-medium text-white md:h-9 md:w-auto md:justify-start"><Icon name="check" size={15} />{t.complete}</span>
              )}
            </>
          }
        />
      </div>

      <Stepper o={o} onPick={s => s !== o.status && setTarget(s)} />

      <div className="mt-4 grid gap-4 md:mt-5 md:gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-4 md:space-y-5">
          <DetailsPanel o={o} />
          <CoverPanel key={lang} o={o} />
          <QuotePanel o={o} />
          <CrewPanel o={o} />
          <ProgressPanel o={o} />
          <LogPanel o={o} />
        </div>
        <div className="min-w-0 space-y-4 md:space-y-5">
          <PaymentsPanel o={o} />
          <InvoicePanel o={o} />
          <DeliveryPanel o={o} onDelivered={() => setTarget('DELIVERED')} />
        </div>
      </div>

      <ConfirmModal
        open={!!target}
        onClose={() => setTarget(null)}
        onConfirm={confirmMove}
        title={`${t.setStage} “${target ? statusName(target, o.eventType, lang) : ''}”?`}
        body={
          <>
            {target && stageIndex(target) < stageIndex(o.status) && <span className="mb-1 block font-medium text-ruby">{t.backwards}</span>}
            {t.setStageBody}
          </>
        }
        confirmLabel={t.moveSend}
        icon="send"
      >
        {target && (
          <WaFrame name={o.client.name} sub={o.client.contact}>
            <WaBubble body={statusPreview(o, target)} template={`status_${target.toLowerCase()}`} compact />
          </WaFrame>
        )}
      </ConfirmModal>
    </div>
  )
}

// ─── Stepper ─────────────────────────────────────────────────────────────────

function Stepper({ o, onPick }: { o: Order; onPick: (s: OrderStatus) => void }) {
  const t = useT(copy)
  const lang = useLang()
  const idx = stageIndex(o.status)
  const at = (s: OrderStatus) => [...o.history].reverse().find(h => h.status === s)?.at
  const scroller = useRef<HTMLDivElement>(null)
  const currentRef = useRef<HTMLLIElement>(null)
  useEffect(() => {
    const el = scroller.current
    const cur = currentRef.current
    if (el && cur && el.scrollWidth > el.clientWidth) el.scrollTo({ left: cur.offsetLeft - (el.clientWidth - cur.offsetWidth) / 2, behavior: 'smooth' })
  }, [idx])
  return (
    <Panel title={t.pipeline} subtitle={t.pipelineSub} icon="filter" kolam bodyClass="px-0 pb-5 pt-6 md:px-4">
      <div ref={scroller} className="no-scrollbar overflow-x-auto px-2 max-md:[mask-image:linear-gradient(to_right,transparent,#000_20px,#000_calc(100%-20px),transparent)] md:px-0" data-lenis-prevent>
        <ol className="relative flex min-w-[680px] md:min-w-[760px]">
          {STATUS_ORDER.map((s, i) => {
            const done = i < idx
            const current = i === idx
            return (
              <li key={s} ref={current ? currentRef : undefined} className="relative flex flex-1 flex-col items-center px-1 text-center">
                {i < STATUS_ORDER.length - 1 && (
                  <span className="absolute left-1/2 top-[15px] h-[2px] w-full bg-ink/10" aria-hidden="true">
                    <motion.span className="block h-full bg-ruby" initial={false} animate={{ width: i < idx ? '100%' : '0%' }} transition={{ duration: 0.6, ease: EASE, delay: i * 0.04 }} />
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onPick(s)}
                  aria-current={current ? 'step' : undefined}
                  aria-label={statusName(s, o.eventType, lang)}
                  className={`group relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-semibold transition-all duration-300 cursor-pointer ${
                    done ? 'bg-ruby text-white hover:scale-110' : current ? 'bg-white text-ruby ring-2 ring-ruby' : 'border border-ink/15 bg-white text-ink/40 hover:border-ink/40 hover:text-ink'
                  }`}
                >
                  {current && <span className="absolute inset-0 rounded-full bg-ruby/25 animate-pulse-ring" />}
                  {done ? <Icon name="check" size={14} strokeWidth={2.4} /> : i + 1}
                </button>
                <button type="button" onClick={() => onPick(s)} className={`mt-2.5 max-w-[110px] text-[12px] leading-snug transition cursor-pointer ${current ? 'font-semibold text-ink' : done ? 'text-ink/65 hover:text-ink' : 'text-ink/40 hover:text-ink'}`}>
                  {statusName(s, o.eventType, lang)}
                </button>
                <span className="mt-1 h-4 text-[10.5px] text-ink/35">{i <= idx && at(s) ? formatDate(at(s), lang, { day: 'numeric', month: 'short' }) : ''}</span>
              </li>
            )
          })}
        </ol>
      </div>
    </Panel>
  )
}

// ─── Details ─────────────────────────────────────────────────────────────────

function DetailsPanel({ o }: { o: Order }) {
  const t = useT(copy)
  const lang = useLang()
  const tx = useTx()
  const crowd = CROWDS.find(c => c.key === o.crowd)
  const venue = VENUES.find(v => v.key === o.venueType)
  const pkg = PACKAGES.find(p => p.key === o.packageId)
  return (
    <Panel title={t.details} icon="users">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-5 md:grid-cols-3 md:gap-x-6">
        <Meta label={t.client}>{o.client.name}</Meta>
        <Meta label={t.phone}>
          <a href={telHref(o.client.contact)} className="inline-flex items-center gap-1 break-all hover:text-ruby">{o.client.contact}</a>
        </Meta>
        <Meta label={t.email}><span className="block truncate">{o.client.email || '—'}</span></Meta>
        <Meta label={t.event}>{eventByKey(o.eventType)?.name[lang]}</Meta>
        <Meta label={t.when}>
          {o.date ? formatDate(o.date, lang, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : AC.tbc[lang]}
          {o.time && <span className="text-ink/50"> · {o.time}</span>}
          {o.dateCertainty === 'tentative' && <span className="ml-1.5 rounded-full bg-ruby-soft px-2 py-0.5 text-[10.5px] font-semibold text-ruby-deep">{t.tentative}</span>}
        </Meta>
        <Meta label={t.district}>{districtName(o.district, lang)}</Meta>
        <Meta label={t.venue} className="col-span-2">
          {venue && <span className="mr-1.5 inline-flex rounded-full bg-ink/[0.05] px-2 py-0.5 text-[11px] font-semibold text-ink/60">{tx(venue.name)}</span>}
          {o.venueName ? `${o.venueName}, ` : ''}{o.venueAddress || '—'}
        </Meta>
        <Meta label={t.distance}>
          {o.distanceKm} km {o.quote.far && <span className="text-[12px] text-ruby">· +{formatINR(o.quote.travel)}</span>}
        </Meta>
        <Meta label={t.crowd}>{crowd ? `${tx(crowd.name)} · ${crowd.range}` : '—'}</Meta>
        <Meta label={t.duration}>{o.durationHours} {t.hours}</Meta>
        <Meta label={t.package}>{pkg ? tx(pkg.name) : '—'}</Meta>
        {o.notes && (
          <Meta label={t.notes} className="col-span-2 md:col-span-3">
            <span className="block rounded-2xl bg-ink/[0.03] px-4 py-3 text-[13.5px] font-normal leading-relaxed text-ink/70">{o.notes}</span>
          </Meta>
        )}
      </dl>
    </Panel>
  )
}

// ─── Quote ───────────────────────────────────────────────────────────────────

function QuotePanel({ o }: { o: Order }) {
  const t = useT(copy)
  const tx = useTx()
  const lang = useLang()
  const update = useStore(s => s.updateOrderQuoteTotal)
  const calc = o.quote.lines.reduce((s, l) => s + l.amount, 0)
  const diff = o.quote.total - calc
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(String(o.quote.total))
  useEffect(() => setVal(String(o.quote.total)), [o.quote.total])

  const save = () => {
    const n = Math.round(Number(val))
    if (!Number.isFinite(n) || n <= 0) return
    update(o.id, n)
    setEditing(false)
    toast(t.totalSaved)
  }

  return (
    <Panel
      title={t.quote}
      subtitle={t.quoteSub}
      icon="receipt"
      action={!editing && <Button variant="ghost" size="sm" iconLeft="edit" onClick={() => setEditing(true)}>{t.adjust}</Button>}
      bodyClass="p-0"
    >
      <ul className="divide-y divide-ink/[0.06]">
        {o.quote.lines.map((l, i) => (
          <li key={i} className="flex items-start justify-between gap-3 px-5 py-3.5 md:gap-4 md:px-6">
            <div className="min-w-0">
              <p className="text-[14px] font-medium text-ink">{tx(l.label)}</p>
              {l.detail && <p className="mt-0.5 text-[12.5px] text-ink/45">{tx(l.detail)}</p>}
            </div>
            <p className={`shrink-0 text-[14px] tabular-nums ${l.amount ? 'text-ink' : 'text-ink/35'}`}>{formatINR(l.amount)}</p>
          </li>
        ))}
      </ul>
      <div className="rounded-b-[26px] border-t hairline bg-ink/[0.02] px-5 py-4 md:px-6">
        {diff !== 0 && (
          <>
            <Row label={t.subtotal} value={formatINR(calc)} muted />
            <Row label={t.adjustment} value={`${diff > 0 ? '+' : '−'}${formatINR(Math.abs(diff))}`} ruby />
          </>
        )}
        <AnimatePresence mode="wait" initial={false}>
          {editing ? (
            <motion.div key="edit" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3, ease: EASE }} className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end">
              <TextInput label={t.finalTotal} value={val} onChange={v => setVal(v.replace(/[^\d]/g, ''))} inputMode="numeric" prefix="₹" autoFocus className="flex-1" />
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <Button variant="ghost" size="sm" onClick={() => { setVal(String(calc)) }}>{t.resetCalc}</Button>
                <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setVal(String(o.quote.total)) }}>{AC.cancel[lang]}</Button>
                <Button variant="ink" size="sm" onClick={save} className="col-span-2 max-sm:!h-11">{t.saveTotal}</Button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-baseline justify-between gap-3 pt-1">
              <span className="text-[14px] font-semibold text-ink">{t.finalTotal}</span>
              <span className="whitespace-nowrap font-display text-[26px] font-medium leading-none tracking-tight text-ink sm:text-[30px]">{formatINR(o.quote.total)}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Panel>
  )
}

function Row({ label, value, muted, ruby }: { label: string; value: string; muted?: boolean; ruby?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 text-[13px]">
      <span className="text-ink/50">{label}</span>
      <span className={`tabular-nums ${ruby ? 'font-semibold text-ruby' : muted ? 'text-ink/60' : 'text-ink'}`}>{value}</span>
    </div>
  )
}

// ─── Payments ────────────────────────────────────────────────────────────────

function PaymentsPanel({ o }: { o: Order }) {
  const t = useT(copy)
  const lang = useLang()
  const logPayment = useStore(s => s.logPayment)
  const removePayment = useStore(s => s.removePayment)
  const paid = paidTotal(o)
  const due = balanceDue(o)
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
    <Panel title={t.payments} subtitle={t.paymentsSub} icon="receipt" bodyClass="p-0" kolam>
      <div className="px-5 pb-5 pt-5 md:px-6">
        <div className="grid grid-cols-3 gap-2">
          <Figure label={t.paid} value={formatINR(paid)} />
          <Figure label={t.pending} value={formatINR(due)} strong={due > 0} />
          <Figure label={t.total} value={formatINR(o.quote.total)} />
        </div>
        <Progress value={o.quote.total ? paid / o.quote.total : 0} className="mt-4" />
        <p className="mt-2 text-[12px] text-ink/45">{due === 0 ? AC.fullyPaid[lang] : `${Math.round((paid / Math.max(1, o.quote.total)) * 100)}% · ${AC.due[lang]} ${formatINR(due)}`}</p>
      </div>

      <div className="border-t hairline bg-ink/[0.015] px-5 py-5 md:px-6">
        <p className="mb-3 text-[13px] font-semibold text-ink">{t.record}</p>
        <div className="space-y-3">
          <TextInput label={t.amount} value={amount} onChange={v => { setAmount(v.replace(/[^\d]/g, '')); setErr('') }} inputMode="numeric" prefix="₹" placeholder="0" />
          {due > 0 && (
            <div className="-mt-1 flex flex-wrap gap-1.5">
              <QuickFill label={`${t.fullBal} · ${formatINR(due)}`} onClick={() => setAmount(String(due))} />
              {due >= 2000 && <QuickFill label={`${t.half} · ${formatINR(Math.round(due / 2))}`} onClick={() => setAmount(String(Math.round(due / 2)))} />}
            </div>
          )}
          <div>
            <p className="t-label mb-1.5 text-ink/50">{t.mode}</p>
            <Segmented<Payment['mode']> size="sm" value={mode} onChange={setMode} className="w-full [&>button]:flex-1" options={(['upi', 'cash', 'bank'] as const).map(m => ({ value: m, label: MODE_LABEL[m][lang] }))} />
          </div>
          <TextInput label={t.note} value={note} onChange={setNote} placeholder={t.notePh} />
          {err && <p className="text-[12.5px] text-ruby">{err}</p>}
          <Button variant="ink" full size="md" iconLeft="plus" onClick={submit}>{t.record}</Button>
        </div>
      </div>

      <div className="border-t hairline px-3 py-3">
        {o.payments.length === 0 ? (
          <p className="px-2 py-3 text-center text-[13px] text-ink/40">{t.noPayments}</p>
        ) : (
          <ul>
            <AnimatePresence initial={false}>
              {[...o.payments].reverse().map(p => (
                <motion.li key={p.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35, ease: EASE }} className="overflow-hidden">
                  <div className="group flex items-center gap-3 rounded-2xl px-2 py-2.5 transition hover:bg-ink/[0.03]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink/[0.05] text-[10.5px] font-bold text-ink/60">{p.mode === 'upi' ? 'UPI' : p.mode === 'cash' ? '₹' : <Icon name="building" size={15} />}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-semibold tabular-nums text-ink">{formatINR(p.amount)}</p>
                      <p className="truncate text-[11.5px] text-ink/45">{MODE_LABEL[p.mode][lang]} · {formatDate(p.at, lang)}{p.note ? ` · ${p.note}` : ''}</p>
                    </div>
                    <button type="button" onClick={() => setRemoving(p)} aria-label={t.remove} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink/30 opacity-100 transition md:h-8 md:w-8 hover:bg-ruby-soft hover:text-ruby md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100 cursor-pointer">
                      <Icon name="trash" size={15} />
                    </button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      <ConfirmModal
        open={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={() => { if (removing) { removePayment(o.id, removing.id); toast(t.removed) } }}
        title={t.removePay}
        body={removing ? `${formatINR(removing.amount)} · ${MODE_LABEL[removing.mode][lang]} · ${formatDate(removing.at, lang)}. ${t.removePayBody}` : ''}
        confirmLabel={t.remove}
        icon="trash"
      />
    </Panel>
  )
}

function Figure({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`min-w-0 rounded-2xl px-2.5 py-2.5 sm:px-3 ${strong ? 'bg-ruby-soft' : 'bg-ink/[0.035]'}`}>
      <p className={`text-[11px] font-medium ${strong ? 'text-ruby-deep/70' : 'text-ink/45'}`}>{label}</p>
      <p className={`mt-0.5 truncate text-[14px] font-semibold tabular-nums sm:text-[15px] ${strong ? 'text-ruby-deep' : 'text-ink'}`}>{value}</p>
    </div>
  )
}

function QuickFill({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-full border border-ink/10 bg-white px-3 py-2 text-[12px] md:px-2.5 md:py-1 md:text-[11.5px] font-medium text-ink/60 transition hover:border-ruby/40 hover:text-ruby cursor-pointer">
      {label}
    </button>
  )
}

// ─── Invoice ─────────────────────────────────────────────────────────────────

function InvoicePanel({ o }: { o: Order }) {
  const t = useT(copy)
  const paid = paidTotal(o)
  const state = paid <= 0 ? 'draft' : paid < o.quote.total ? 'partial' : 'paid'
  const stateLabel = state === 'draft' ? t.draft : state === 'partial' ? t.partial : t.paidFull
  return (
    <Panel
      title={t.invoiceTitle}
      subtitle={t.invoiceSub}
      icon="receipt"
      action={
        <Link to="/admin/billing" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-ink/10 px-3 text-[12px] md:h-8 font-medium text-ink/65 transition hover:border-ink/30 hover:text-ink">
          <Icon name="receipt" size={13} />
          {t.openBilling}
        </Link>
      }
    >
      <dl className="space-y-3.5 text-[13.5px]">
        <ZRow label={t.customer}><span className="font-mono">{o.customerId}</span><CopyButton text={o.customerId} label={t.copy} /></ZRow>
        <ZRow label={t.invoice}><span className="font-mono">{o.invoiceId}</span><CopyButton text={o.invoiceId} label={t.copy} /></ZRow>
        <ZRow label={t.state}>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${state === 'paid' ? 'bg-ink text-white' : state === 'partial' ? 'bg-ruby-soft text-ruby-deep' : 'border border-ink/15 text-ink/60'}`}>
            {state === 'paid' ? <Icon name="check" size={12} strokeWidth={2.4} /> : <span className={`h-1.5 w-1.5 rounded-full ${state === 'partial' ? 'bg-ruby' : 'bg-ink/30'}`} />}
            {stateLabel}
          </span>
        </ZRow>
      </dl>
    </Panel>
  )
}

function ZRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="shrink-0 text-ink/50">{label}</dt>
      <dd className="flex min-w-0 items-center gap-0.5 text-right font-medium text-ink">{children}</dd>
    </div>
  )
}

// ─── Crew ────────────────────────────────────────────────────────────────────

function CrewPanel({ o }: { o: Order }) {
  const t = useT(copy)
  const lang = useLang()
  const workers = useStore(s => s.workers)
  const assign = useStore(s => s.assignWorker)
  const unassign = useStore(s => s.unassignWorker)
  const [showAll, setShowAll] = useState(false)
  const [preview, setPreview] = useState<{ w: Worker; m?: OutboxMessage } | null>(null)

  const onJob = o.workerIds.map(id => workers.find(w => w.id === id)).filter((w): w is Worker => !!w)
  const pool = workers
    .filter(w => !o.workerIds.includes(w.id))
    .sort((a, b) => Number(b.district === o.district) - Number(a.district === o.district) || Number(b.available) - Number(a.available) || b.rating - a.rating)
  const shown = showAll ? pool : pool.slice(0, 4)

  const doAssign = (w: Worker) => {
    assign(o.id, w.id)
    const m = useStore.getState().outbox.find(x => x.orderId === o.id && x.template === 'job_dispatch' && x.to === w.phone)
    setPreview({ w, m })
    toast(AC.waDispatched[lang])
  }

  return (
    <Panel title={t.crew} subtitle={t.crewSub} icon="users">
      <p className="t-label mb-3 text-ink/40">{t.assigned} · {onJob.length}</p>
      {onJob.length === 0 ? (
        <p className="mb-2 rounded-2xl border border-dashed border-ruby/30 bg-ruby-soft/40 px-4 py-3.5 text-[13px] text-ruby-deep">{t.noCrew}</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          <AnimatePresence initial={false}>
            {onJob.map(w => (
              <motion.li key={w.id} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="flex items-center gap-2 rounded-2xl bg-ink py-2.5 pl-3 pr-1.5 text-white md:gap-3 md:px-3.5 md:py-3">
                <Avatar name={w.name[lang]} size={38} tone="ruby" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold">{w.name[lang]}</p>
                  <p className="truncate text-[11.5px] text-white/55">{ROLES[w.role][lang]} · {districtName(w.district, lang)}</p>
                </div>
                <a href={telHref(w.phone)} aria-label={`${t.call} ${w.name[lang]}`} className="flex h-10 w-10 shrink-0 items-center md:h-8 md:w-8 justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"><Icon name="phone" size={14} /></a>
                <button type="button" onClick={() => { unassign(o.id, w.id); toast(`${w.name[lang]} ${t.unassigned}`) }} aria-label={t.unassign} title={t.unassign} className="flex h-10 w-10 shrink-0 items-center md:h-8 md:w-8 justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white cursor-pointer">
                  <Icon name="x" size={14} />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      {pool.length > 0 && (
        <>
          <p className="t-label mb-2 mt-6 text-ink/40">{t.suggested}</p>
          <ul className="divide-y divide-ink/[0.06]">
            {shown.map(w => {
              const same = w.district === o.district
              return (
                <motion.li key={w.id} layout className={`flex items-center gap-3 py-3 ${w.available ? '' : 'opacity-55'}`}>
                  <Avatar name={w.name[lang]} size={38} tone={same ? 'soft' : 'muted'} />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] font-semibold text-ink">
                      <span className="truncate">{w.name[lang]}</span>
                      {same && <span className="rounded-full bg-ruby-soft px-2 py-0.5 text-[10.5px] font-semibold text-ruby-deep">{t.sameDistrict}</span>}
                      {!w.available && <span className="rounded-full bg-ink/[0.06] px-2 py-0.5 text-[10.5px] font-semibold text-ink/55">{AC.busy[lang]}</span>}
                    </p>
                    <p className="mt-0.5 truncate text-[12px] text-ink/45">
                      {ROLES[w.role][lang]} · {districtName(w.district, lang)} · ★ {w.rating.toFixed(1)} · {w.jobs} {t.jobs}
                    </p>
                  </div>
                  <Button variant={w.available ? 'outline' : 'ghost'} size="sm" iconLeft="send" onClick={() => doAssign(w)} className="shrink-0 max-sm:px-3">{t.assign}</Button>
                </motion.li>
              )
            })}
          </ul>
          {pool.length > 4 && (
            <button type="button" onClick={() => setShowAll(s => !s)} className="mt-1 inline-flex min-h-10 items-center gap-1 text-[13px] md:mt-2 md:min-h-0 font-medium text-ink/55 transition hover:text-ruby cursor-pointer">
              {showAll ? t.showLess : `${t.showAll} (${pool.length})`}
              <Icon name="chevronDown" size={14} className={`transition-transform ${showAll ? 'rotate-180' : ''}`} />
            </button>
          )}
        </>
      )}

      <Modal open={!!preview} onClose={() => setPreview(null)} label={t.dispatched}>
        {preview && (
          <div className="p-6 pt-7 md:p-8">
            <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-ruby text-white shadow-ruby"><Icon name="send" size={19} /></span>
            <h2 className="text-[20px] font-semibold tracking-tight text-ink">{t.dispatched}</h2>
            <p className="mt-1.5 text-[14px] text-ink/55">{t.dispatchedBody} {preview.w.name[lang]} · {preview.w.phone}</p>
            <WaFrame name={preview.w.name[lang]} sub={ROLES[preview.w.role][lang]} className="mt-5">
              <WaBubble body={preview.m?.body ?? ''} template="job_dispatch" at={preview.m?.at} />
            </WaFrame>
            <div className="mt-6 flex justify-end">
              <Button variant="ink" onClick={() => setPreview(null)} className="max-sm:w-full">{t.done}</Button>
            </div>
          </div>
        )}
      </Modal>
    </Panel>
  )
}

// ─── Delivery ────────────────────────────────────────────────────────────────

const COURIERS = ['Blue Dart', 'DTDC', 'India Post', 'Professional Couriers']

function DeliveryPanel({ o, onDelivered }: { o: Order; onDelivered: () => void }) {
  const t = useT(copy)
  const lang = useLang()
  const setDelivery = useStore(s => s.setDelivery)
  const [editing, setEditing] = useState(!o.delivery)
  const [courier, setCourier] = useState(o.delivery?.courier ?? '')
  const [tracking, setTracking] = useState(o.delivery?.tracking ?? '')

  const save = () => {
    if (!courier.trim()) return
    setDelivery(o.id, courier.trim(), tracking.trim())
    setEditing(false)
    toast(t.deliverySaved)
  }

  return (
    <Panel title={t.delivery} subtitle={t.deliverySub} icon="truck" action={o.delivery && !editing ? <Button variant="ghost" size="sm" iconLeft="edit" onClick={() => setEditing(true)}>{t.edit}</Button> : undefined}>
      {o.delivery && !editing ? (
        <div>
          <div className="flex items-center gap-3 rounded-2xl bg-ink/[0.035] p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-white"><Icon name="truck" size={18} /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-ink">{o.delivery.courier}</p>
              <p className="flex items-center gap-0.5 font-mono text-[12.5px] text-ink/55">{o.delivery.tracking || '—'}{o.delivery.tracking && <CopyButton text={o.delivery.tracking} label={t.copy} />}</p>
            </div>
          </div>
          <p className="mt-3 text-[12.5px] text-ink/45">{t.dispatchedOn} · {formatDateTime(o.delivery.dispatchedAt, lang)}</p>
          {o.status === 'BILLED' && (
            <Button variant="ink" size="sm" full iconLeft="check" className="mt-4" onClick={onDelivered}>{t.markDelivered}</Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <TextInput label={t.courier} value={courier} onChange={setCourier} />
          <div className="-mt-1 flex flex-wrap gap-1.5">
            {[...COURIERS, t.hand].map(c => <QuickFill key={c} label={c} onClick={() => setCourier(c)} />)}
          </div>
          <TextInput label={t.tracking} value={tracking} onChange={setTracking} />
          <div className="flex gap-2 pt-1">
            {o.delivery && <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>{AC.cancel[lang]}</Button>}
            <Button variant="ink" size="sm" iconLeft="truck" onClick={save} disabled={!courier.trim()} className="flex-1">{t.saveDelivery}</Button>
          </div>
        </div>
      )}
    </Panel>
  )
}

// ─── Gallery cover ───────────────────────────────────────────────────────────

function CoverPanel({ o }: { o: Order }) {
  const t = useT(copy)
  const lang = useLang()
  const setGalleryCover = useStore(s => s.setGalleryCover)
  const proofs = useProofs()
  const current = resolveCover(o, lang)
  const [banner, setBanner] = useState<ImgKey[]>(current.banner)
  const [dp, setDp] = useState<ImgKey>(current.dp)
  const [name, setName] = useState(current.name)
  const [date, setDate] = useState(current.date)
  const [mode, setMode] = useState<'banner' | 'dp'>('banner')

  const draft = { banner, dp, name: name.trim(), date: date.trim() }
  const dirty = JSON.stringify(draft) !== JSON.stringify(current)
  const valid = banner.length >= 4 && !!draft.name && !!draft.date

  const load = (c: typeof current) => {
    setBanner(c.banner)
    setDp(c.dp)
    setName(c.name)
    setDate(c.date)
  }
  const pick = (id: ImgKey) => {
    if (mode === 'dp') return setDp(id)
    setBanner(b => (b.includes(id) ? b.filter(x => x !== id) : b.length >= 5 ? b : [...b, id]))
  }
  const save = () => {
    setGalleryCover(o.id, draft)
    toast(t.coverSaved)
  }
  const reset = () => {
    setGalleryCover(o.id, undefined)
    load(resolveCover({ ...o, cover: undefined }, lang))
  }

  return (
    <Panel
      title={t.cover}
      subtitle={t.coverSub}
      icon="image"
      action={<span className={`rounded-full px-2.5 py-1 text-[11.5px] font-medium ${o.cover ? 'bg-ruby-soft text-ruby-deep' : 'bg-ink/[0.05] text-ink/50'}`}>{o.cover ? t.customCover : t.defaultCover}</span>}
    >
      <div className="rounded-2xl bg-ink/[0.025] p-3 pb-5">
        <CoverMasthead order={{ ...o, cover: { ...draft, name: draft.name || '—', date: draft.date || '—' } }} compact />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <TextInput label={t.coverName} value={name} onChange={setName} required />
        <TextInput label={t.coverDate} value={date} onChange={setDate} required />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <Segmented<'banner' | 'dp'>
          value={mode}
          onChange={setMode}
          size="sm"
          options={[
            { value: 'banner', label: `${t.bannerMode} · ${banner.length}/5` },
            { value: 'dp', label: t.dpMode },
          ]}
        />
        <p className="text-[12px] text-ink/45">{mode === 'dp' ? t.pickDp : t.pickBanner}</p>
      </div>

      <div className="-mx-1 mt-2 grid max-h-[340px] grid-cols-4 gap-2 overflow-y-auto p-1 sm:grid-cols-6" data-lenis-prevent>
        {proofs.map(id => {
          const bi = banner.indexOf(id)
          const isDp = dp === id
          const on = mode === 'dp' ? isDp : bi >= 0
          return (
            <button
              key={id}
              type="button"
              onClick={() => pick(id)}
              aria-pressed={on}
              aria-label={proofFile(id)}
              className={`relative aspect-square overflow-hidden rounded-xl transition cursor-pointer ${on ? 'ring-[3px] ring-ruby ring-offset-2 ring-offset-white' : 'opacity-80 hover:opacity-100'}`}
            >
              <Img k={id} w={200} ratio={1} sizes="90px" className="h-full w-full" />
              {bi >= 0 && <span className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ruby text-[11px] font-semibold text-white">{bi + 1}</span>}
              {isDp && <span className="absolute right-1 top-1 rounded-full bg-ink px-1.5 py-0.5 text-[9.5px] font-semibold text-white">DP</span>}
            </button>
          )
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
        {banner.length < 4 && <p className="mr-auto text-[12.5px] text-ruby">{t.needBanner}</p>}
        {o.cover && <Button variant="ghost" size="sm" onClick={reset}>{t.resetCover}</Button>}
        <Button variant="ink" size="sm" iconLeft="check" onClick={save} disabled={!valid || !dirty} className="max-sm:!h-10 max-sm:flex-1">{t.saveCover}</Button>
      </div>
    </Panel>
  )
}

// ─── Client progress ─────────────────────────────────────────────────────────

function ProgressPanel({ o }: { o: Order }) {
  const t = useT(copy)
  const lang = useLang()
  const a = o.album
  const nm = <T extends { key: string; name: unknown }>(list: readonly T[], key: string) => {
    const f = list.find(x => x.key === key)
    if (!f) return key
    return typeof f.name === 'string' ? f.name : (f.name as { en: string; ta: string })[lang]
  }
  return (
    <Panel title={t.progress} subtitle={t.progressSub} icon="sparkle">
      <div className="grid gap-3 md:grid-cols-3">
        <Tile icon="heart" title={t.selection} state={o.selectionSubmittedAt ? t.submitted : o.selection.length ? t.inProgress : t.notYet} on={!!o.selectionSubmittedAt}>
          <p className="font-display text-[34px] font-medium leading-none text-ink">{o.selection.length}</p>
          <p className="mt-1 text-[12px] text-ink/45">{t.photos}{o.selectionSubmittedAt ? ` · ${formatDate(o.selectionSubmittedAt, lang, { day: 'numeric', month: 'short' })}` : ''}</p>
        </Tile>
        <Tile icon="book" title={t.album} state={a ? t.submitted : t.notYet} on={!!a}>
          {a ? (
            <div className="flex items-start gap-3">
              <span className="mt-0.5 h-10 w-8 shrink-0 rounded-[4px] shadow-[inset_-3px_0_0_rgba(0,0,0,0.18),0_4px_10px_-4px_rgba(0,0,0,0.4)]" style={{ background: ALBUM.colors.find(c => c.key === a.color)?.hex ?? '#0a0a0b' }} />
              <p className="text-[12.5px] leading-relaxed text-ink/65">
                {nm(ALBUM.covers, a.cover)} · {nm(ALBUM.colors, a.color)}<br />
                {nm(ALBUM.papers, a.paper)} · {nm(ALBUM.sizes, a.size)}<br />
                {a.sheets} {t.sheets} · {nm(ALBUM.fonts, a.font)}
              </p>
            </div>
          ) : (
            <p className="text-[12.5px] text-ink/40">—</p>
          )}
        </Tile>
        <Tile icon="star" title={t.review} state={o.review ? formatDate(o.review.at, lang, { day: 'numeric', month: 'short' }) : t.noReview} on={!!o.review}>
          {o.review ? (
            <>
              <Stars value={o.review.rating} />
              <p className="mt-2 line-clamp-3 text-[12.5px] italic leading-relaxed text-ink/65">“{o.review.text}”</p>
            </>
          ) : (
            <p className="text-[12.5px] text-ink/40">—</p>
          )}
        </Tile>
      </div>
    </Panel>
  )
}

function Tile({ icon, title, state, on, children }: { icon: 'heart' | 'book' | 'star'; title: string; state: string; on: boolean; children: React.ReactNode }) {
  return (
    <div className={`rounded-[20px] border p-4 ${on ? 'border-ink/10 bg-white' : 'border-dashed border-ink/12 bg-ink/[0.015]'}`}>
      <div className="mb-3 flex items-center gap-2">
        <Icon name={icon} size={15} className={on ? 'text-ruby' : 'text-ink/35'} />
        <p className="flex-1 truncate text-[13px] font-semibold text-ink">{title}</p>
        <span className={`truncate rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${on ? 'bg-ink text-white' : 'bg-ink/[0.05] text-ink/45'}`}>{state}</span>
      </div>
      {children}
    </div>
  )
}

// ─── Message log ─────────────────────────────────────────────────────────────

function LogPanel({ o }: { o: Order }) {
  const t = useT(copy)
  const lang = useLang()
  const outbox = useStore(s => s.outbox)
  const msgs = useMemo(() => outbox.filter(m => m.orderId === o.id).slice().reverse(), [outbox, o.id])
  return (
    <Panel title={t.log} subtitle={t.logSub} icon="whatsapp" bodyClass="p-3 md:p-4">
      {msgs.length === 0 ? (
        <p className="py-8 text-center text-[13px] text-ink/40">{t.noLog}</p>
      ) : (
        <WaFrame name={o.client.name} sub={`${o.client.contact} · ${o.id}`}>
          <div className="max-h-[60svh] space-y-3 overflow-y-auto pr-1 md:max-h-[440px]" data-lenis-prevent>
            {msgs.map(m => (
              <div key={m.id}>
                <p className="mb-1 text-right text-[11px] text-ink/40">{m.audience === 'worker' ? `${t.toCrew} · ${m.toName}` : t.toClient}</p>
                <WaBubble body={m.body} template={m.template} at={m.at} compact />
              </div>
            ))}
          </div>
        </WaFrame>
      )}
    </Panel>
  )
}
