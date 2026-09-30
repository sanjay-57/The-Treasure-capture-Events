import { useParams } from 'react-router'
import { motion, useReducedMotion } from 'motion/react'
import { Button, Container, Eyebrow } from '../../components/ui'
import { Icon, LogoMark, type IconName } from '../../components/Icon'
import { Reveal, RevealText, Stagger, StaggerItem, EASE } from '../../components/motion'
import { Kolam, Ornament, TempleBorder, Vilakku } from '../../components/tamil'
import { COMMON, formatDate, formatINR, useLang, useT, type Bi } from '../../lib/i18n'
import { toast, useTitle } from '../../lib/ui'
import { useStore, type Order } from '../../lib/store'
import { ADDONS, PACKAGES, VENUES, districtName, eventByKey } from '../../lib/data'
import { formatTime, hoursLabel } from './shared'

const copy = {
  eyebrow: { en: 'Enquiry received', ta: 'விசாரணை பெறப்பட்டது' },
  thanks: { en: 'Thank you,', ta: 'நன்றி,' },
  lead: {
    en: 'Your date is pencilled in. We will call you within 24 hours to confirm everything — no payment until then.',
    ta: 'உங்கள் தேதி குறித்து வைக்கப்பட்டுள்ளது. 24 மணி நேரத்திற்குள் அழைத்து அனைத்தையும் உறுதிசெய்வோம் — அதுவரை எந்தக் கட்டணமும் இல்லை.',
  },
  ref: { en: 'Booking reference', ta: 'பதிவு எண்' },
  copy: { en: 'Copy reference', ta: 'பதிவு எண்ணை நகலெடு' },
  copied: { en: 'Reference copied', ta: 'பதிவு எண் நகலெடுக்கப்பட்டது' },
  summary: { en: 'Your celebration', ta: 'உங்கள் விழா' },
  total: { en: 'Estimated total', ta: 'மதிப்பிடப்பட்ட மொத்தம்' },
  payOffline: { en: 'Pay offline after confirmation', ta: 'உறுதிப்படுத்தலுக்குப் பின் நேரடியாகச் செலுத்தலாம்' },
  invoice: { en: 'Customer record & draft invoice created', ta: 'வாடிக்கையாளர் பதிவு & வரைவு ரசீது உருவாக்கப்பட்டது' },
  whatsapp: { en: 'WhatsApp confirmation', ta: 'WhatsApp உறுதிப்படுத்தல்' },
  sentTo: { en: 'Sent to', ta: 'அனுப்பப்பட்டது:' },
  business: { en: 'Business account', ta: 'வணிகக் கணக்கு' },
  today: { en: 'Today', ta: 'இன்று' },
  pending: { en: 'Your confirmation is on its way.', ta: 'உங்கள் உறுதிப்படுத்தல் வந்துகொண்டிருக்கிறது.' },
  next: { en: 'What happens next', ta: 'அடுத்து என்ன நடக்கும்' },
  nextNote: { en: 'Track every stage live from your dashboard — you are already signed in.', ta: 'ஒவ்வொரு கட்டத்தையும் உங்கள் பக்கத்தில் நேரலையாகப் பாருங்கள் — நீங்கள் ஏற்கனவே உள்நுழைந்துள்ளீர்கள்.' },
  upNext: { en: 'Up next', ta: 'அடுத்தது' },
  dashboard: { en: 'Go to my dashboard', ta: 'என் பக்கத்திற்குச் செல்' },
  gallery: { en: 'Explore the gallery', ta: 'காட்சியகத்தைப் பாருங்கள்' },
  tentative: { en: 'tentative', ta: 'தற்காலிகம்' },
  notFound: { en: 'We couldn’t find that booking.', ta: 'அந்தப் பதிவைக் கண்டுபிடிக்க முடியவில்லை.' },
  notFoundBody: {
    en: 'The link may be incomplete. Your reference is in your WhatsApp confirmation — or sign in with your mobile number to see your order.',
    ta: 'இணைப்பு முழுமையாக இல்லாமல் இருக்கலாம். உங்கள் பதிவு எண் WhatsApp உறுதிப்படுத்தலில் உள்ளது — அல்லது கைபேசி எண்ணுடன் உள்நுழைந்து ஆர்டரைப் பாருங்கள்.',
  },
  startBooking: { en: 'Start a booking', ta: 'பதிவைத் தொடங்கு' },
}

export default function Confirmed() {
  const { id = '' } = useParams()
  const order = useStore(s => s.orders.find(o => o.id === id))
  useTitle({ en: 'Booking received', ta: 'பதிவு பெறப்பட்டது' })
  if (!order) return <NotFound />
  return <ConfirmedView order={order} />
}

function NotFound() {
  const t = useT(copy)
  const lang = useLang()
  return (
    <div className="pb-[calc(5rem+env(safe-area-inset-bottom))] pt-36 md:pb-28 md:pt-48">
      <Container className="flex max-w-xl flex-col items-center text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-ink/[0.04] text-ink/40">
          <Icon name="search" size={26} />
        </span>
        <h1 className="t-2 mt-6">{t.notFound}</h1>
        <p className="t-lead mt-4 text-ink/60">{t.notFoundBody}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button to="/book" icon="arrowRight">
            {t.startBooking}
          </Button>
          <Button to="/login" variant="outline">
            {COMMON.login[lang]}
          </Button>
        </div>
      </Container>
    </div>
  )
}

function ConfirmedView({ order }: { order: Order }) {
  const lang = useLang()
  const t = useT(copy)
  const first = order.client.name.split(/[ &]/)[0] || order.client.name

  const copyRef = async () => {
    try {
      await navigator.clipboard.writeText(order.id)
      toast(t.copied, 'ruby')
    } catch {
      /* clipboard blocked — the reference stays visible on screen */
    }
  }

  return (
    <div className="relative overflow-hidden pb-[calc(5rem+env(safe-area-inset-bottom))] pt-36 md:pb-28 md:pt-48">
      <Container>
        {/* Hero */}
        <div className="flex flex-col items-center text-center">
          {lang === 'ta' ? <LampMoment /> : <CheckMoment />}
          <Reveal delay={0.4}>
            <Eyebrow className="mt-6 md:mt-8">{t.eyebrow}</Eyebrow>
          </Reveal>
          <RevealText key={lang} as="h1" immediate delay={0.5} text={`${t.thanks} ${first}.`} className="t-1 mt-5 text-ink [overflow-wrap:anywhere]" />
          <Reveal delay={0.7}>
            <p className="t-lead mx-auto mt-5 max-w-xl text-ink/60">{t.lead}</p>
          </Reveal>
          <Reveal delay={0.85}>
            <div className="glass mt-8 inline-flex max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-full py-2 pl-5 pr-2">
              <span className="text-[12px] text-ink/50">{t.ref}</span>
              <span className="font-mono text-[15px] font-semibold tracking-wide text-ink">{order.id}</span>
              <button type="button" onClick={copyRef} aria-label={t.copy} title={t.copy} className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white transition hover:bg-ruby cursor-pointer active:scale-95">
                <Icon name="copy" size={15} />
              </button>
            </div>
          </Reveal>
        </div>

        <Ornament className="my-12 md:my-16" />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-8">
          <Reveal>
            <OrderSummary order={order} />
          </Reveal>
          <Reveal delay={0.12}>
            <WhatsAppPreview order={order} />
          </Reveal>
        </div>

        <Timeline order={order} />

        <Reveal>
          <div className="mt-12 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center md:mt-16">
            <Button to="/dashboard" size="lg" icon="arrowRight">
              {t.dashboard}
            </Button>
            <Button to="/gallery" size="lg" variant="outline">
              {t.gallery}
            </Button>
          </div>
        </Reveal>
      </Container>
    </div>
  )
}

// ─── Hero moments ────────────────────────────────────────────────────────────

/** English: a ruby seal that draws its ring, fills, ticks and sends out a soft burst. */
function CheckMoment() {
  const reduce = useReducedMotion()
  const sparks = Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2)
  return (
    <div className="relative flex h-32 w-32 items-center justify-center" aria-hidden="true">
      {!reduce &&
        sparks.map((a, i) => (
          <motion.span
            key={i}
            className={`absolute left-1/2 top-1/2 -ml-1 -mt-1 h-2 w-2 rounded-full ${i % 3 === 0 ? 'bg-ink' : 'bg-ruby'}`}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
            animate={{ x: Math.cos(a) * 92, y: Math.sin(a) * 92, opacity: [0, 1, 0], scale: [0.4, 1, 0.6] }}
            transition={{ duration: 1.3, delay: 0.95, ease: EASE }}
          />
        ))}
      <div className="absolute inset-0 rounded-full bg-ruby/15 blur-2xl" />
      <svg viewBox="0 0 120 120" className="relative h-32 w-32">
        <motion.circle cx="60" cy="60" r="56" fill="none" stroke="#c0163c" strokeWidth="2" strokeLinecap="round" initial={{ pathLength: 0, rotate: -90 }} animate={{ pathLength: 1 }} transition={{ duration: 1, ease: [0.65, 0, 0.35, 1] }} style={{ originX: '50%', originY: '50%' }} />
        <motion.circle cx="60" cy="60" r="46" fill="#c0163c" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.7, delay: 0.55, ease: EASE }} style={{ originX: '50%', originY: '50%' }} />
        <motion.path d="M40 61 L54 75 L81 46" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.55, delay: 0.95, ease: [0.65, 0, 0.35, 1] }} />
      </svg>
    </div>
  )
}

/** Tamil: a kolam draws itself around a lit kuthu vilakku. */
function LampMoment() {
  return (
    <div className="relative flex h-[210px] w-[210px] items-center justify-center" aria-hidden="true">
      <motion.div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(226,38,79,0.28),transparent_65%)]" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.4, ease: EASE }} />
      <Kolam size={210} className="absolute inset-0 text-ruby/70" strokeWidth={1.2} />
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.3, ease: EASE }} className="relative">
        <Vilakku height={130} />
      </motion.div>
    </div>
  )
}

// ─── Summary ─────────────────────────────────────────────────────────────────

function OrderSummary({ order }: { order: Order }) {
  const lang = useLang()
  const t = useT(copy)
  const ev = eventByKey(order.eventType)
  const venue = VENUES.find(v => v.key === order.venueType)
  const pkg = PACKAGES.find(p => p.key === order.packageId)
  const extras = order.addons.map(a => ADDONS.find(x => x.key === a)?.name[lang]).filter(Boolean)
  const rows: { icon: IconName; value: string; sub?: string }[] = [
    { icon: 'sparkle', value: ev?.name[lang] ?? order.eventType, sub: hoursLabel(order.durationHours, lang) },
    { icon: 'mapPin', value: [venue?.name[lang], order.venueName].filter(Boolean).join(' · '), sub: `${order.venueAddress} · ${districtName(order.district, lang)}` },
    {
      icon: 'calendar',
      value: formatDate(order.date, lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      sub: [order.time && formatTime(order.time, lang), order.dateCertainty === 'tentative' && t.tentative].filter(Boolean).join(' · ') || undefined,
    },
    { icon: 'gem', value: pkg?.name[lang] ?? '', sub: extras.length ? extras.join(', ') : undefined },
  ]
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[30px] border hairline bg-white shadow-soft">
      {lang === 'ta' && <TempleBorder />}
      <div className="flex-1 p-5 sm:p-7">
        <p className="t-label text-ink/45">{t.summary}</p>
        <ul className="mt-5 space-y-4">
          {rows.map(r => (
            <li key={r.icon} className="flex items-start gap-3.5">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ruby-soft text-ruby">
                <Icon name={r.icon} size={17} />
              </span>
              <div className="min-w-0">
                <p className="font-medium leading-snug text-ink">{r.value}</p>
                {r.sub && <p className="mt-0.5 break-words text-[13px] leading-snug text-ink/50">{r.sub}</p>}
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="border-t hairline bg-ink/[0.025] p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[13px] text-ink/50">{t.total}</p>
            <p className="mt-1 font-display text-[2.1rem] font-semibold sm:text-[2.4rem] leading-none tabular-nums text-ink">{formatINR(order.quote.total)}</p>
          </div>
          <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-ruby">
            <Icon name="lock" size={14} />
            {t.payOffline}
          </p>
        </div>
        <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-ink/45">
          <Icon name="receipt" size={14} className="text-ink/40" />
          {t.invoice}
          <span className="break-all font-mono text-ink/60">
            {order.customerId} · {order.invoiceId}
          </span>
        </p>
      </div>
    </div>
  )
}

// ─── WhatsApp preview (palette-true: ink, white, ruby) ───────────────────────

function WhatsAppPreview({ order }: { order: Order }) {
  const lang = useLang()
  const t = useT(copy)
  const reduce = useReducedMotion()
  const msg = useStore(s => s.outbox.find(m => m.orderId === order.id && m.audience === 'client'))
  const at = msg ? new Date(msg.at) : new Date(order.createdAt)
  const time = at.toLocaleTimeString(lang === 'ta' ? 'ta-IN' : 'en-IN', { hour: 'numeric', minute: '2-digit' })

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[30px] bg-ink shadow-soft">
      <div className="flex items-center gap-3 px-5 py-4 text-white">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
          <LogoMark size={24} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-[14.5px] font-semibold">
            {COMMON.brand[lang]}
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ruby">
              <Icon name="check" size={10} strokeWidth={3} />
            </span>
          </p>
          <p className="text-[11.5px] text-white/50">{t.business}</p>
        </div>
        <Icon name="whatsapp" size={20} className="text-white/60" />
      </div>
      <div className="relative flex-1 bg-mist px-4 py-5 sm:px-5">
        <div aria-hidden="true" className={`${lang === 'ta' ? 'kolam-bg' : ''} pointer-events-none absolute inset-0 opacity-[0.06]`} style={lang === 'ta' ? undefined : { backgroundImage: 'radial-gradient(rgba(10,10,11,0.5) 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
        <div className="relative flex flex-col gap-3">
          <span className="mx-auto rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-ink/50 shadow-[0_1px_1px_rgba(10,10,11,0.06)]">{t.today}</span>
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3, ease: EASE }}
            className="relative max-w-[92%] origin-top-left self-start rounded-[18px] rounded-tl-[4px] bg-white px-4 pb-2 pt-3 shadow-[0_1px_1.5px_rgba(10,10,11,0.1)]"
          >
            <p className="t-label mb-1.5 text-ruby">{t.whatsapp}</p>
            <p className="whitespace-pre-line break-words text-[14px] leading-relaxed text-ink/85">{msg ? msg.body : t.pending}</p>
            <p className="mt-1.5 flex items-center justify-end gap-1 text-[10.5px] text-ink/40">
              {time}
              <span className="relative inline-flex w-[18px] text-ruby" aria-hidden="true">
                <Icon name="check" size={13} strokeWidth={2.4} />
                <Icon name="check" size={13} strokeWidth={2.4} className="absolute left-[5px]" />
              </span>
            </p>
          </motion.div>
        </div>
      </div>
      <p className="flex items-center gap-2 px-5 py-3.5 text-[12px] text-white/50">
        <Icon name="phone" size={13} />
        {t.sentTo} <span className="font-medium text-white/80">{order.client.contact}</span>
      </p>
    </div>
  )
}

// ─── What happens next ───────────────────────────────────────────────────────

function Timeline({ order }: { order: Order }) {
  const lang = useLang()
  const t = useT(copy)
  const couple = eventByKey(order.eventType)?.couple ?? true
  const steps: { icon: IconName; name: Bi; note: Bi }[] = [
    { icon: 'phone', name: { en: 'Confirmation call', ta: 'உறுதிப்படுத்தும் அழைப்பு' }, note: { en: 'Within 24 hours', ta: '24 மணி நேரத்திற்குள்' } },
    { icon: 'users', name: { en: 'Team meeting', ta: 'குழு கூட்டம்' }, note: { en: 'We plan coverage and assign your photographers', ta: 'படப்பிடிப்பைத் திட்டமிட்டு கலைஞர்களை ஒதுக்குவோம்' } },
    couple
      ? { icon: 'heart', name: { en: 'Couple meeting', ta: 'மணமக்கள் சந்திப்பு' }, note: { en: 'Rituals, shot list and timings with you', ta: 'சடங்குகள், படப் பட்டியல், நேரம் பற்றிக் கலந்துரையாடல்' } }
      : { icon: 'heart', name: { en: 'Family consultation', ta: 'குடும்ப ஆலோசனை' }, note: { en: 'Rituals, shot list and timings with your family', ta: 'உங்கள் குடும்பத்துடன் சடங்குகள், நேரம் பற்றிக் கலந்துரையாடல்' } },
    { icon: 'camera', name: { en: 'The event', ta: 'விழா நாள்' }, note: { en: 'We capture every moment', ta: 'ஒவ்வொரு தருணத்தையும் படம்பிடிப்போம்' } },
    { icon: 'image', name: { en: 'Photo selection', ta: 'படத் தேர்வு' }, note: { en: 'Pick favourites in your private gallery', ta: 'உங்கள் தனிப்பட்ட கேலரியில் பிடித்த படங்களைத் தேர்வு செய்யுங்கள்' } },
    { icon: 'book', name: { en: 'Album design', ta: 'ஆல்பம் வடிவமைப்பு' }, note: { en: 'Cover, paper, size and typography', ta: 'அட்டை, தாள், அளவு, எழுத்துரு' } },
    { icon: 'truck', name: { en: 'Delivery', ta: 'ஒப்படைப்பு' }, note: { en: 'Your album arrives home', ta: 'ஆல்பம் உங்கள் வீடு வந்து சேரும்' } },
  ]

  return (
    <section className="mt-16 md:mt-24" aria-labelledby="next-heading">
      <div className="mx-auto max-w-2xl text-center">
        <Reveal>
          <Eyebrow>{order.id}</Eyebrow>
        </Reveal>
        <RevealText key={lang} as="h2" text={t.next} className="t-2 mt-4" />
        <Reveal delay={0.1}>
          <p id="next-heading" className="mt-4 text-ink/55">
            {t.nextNote}
          </p>
        </Reveal>
      </div>

      <div className="relative mt-10 md:mt-12">
        {/* Connecting line (vertical on mobile, horizontal on desktop) */}
        <motion.div
          aria-hidden="true"
          className="absolute bottom-6 left-[21px] top-6 w-px origin-top bg-gradient-to-b from-ruby via-ink/15 to-ink/10 lg:bottom-auto lg:left-[7%] lg:right-[7%] lg:top-[21px] lg:h-px lg:w-auto lg:origin-left lg:bg-gradient-to-r"
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true, margin: '0px 0px -10% 0px' }}
          transition={{ duration: 1.6, ease: EASE }}
        />
        <Stagger className="relative grid gap-6 lg:grid-cols-7 lg:gap-3" gap={0.1}>
          {steps.map((s, i) => (
            <StaggerItem key={s.name.en} className="flex items-start gap-4 lg:flex-col lg:items-center lg:text-center">
              <span className={`relative flex h-[43px] w-[43px] shrink-0 items-center justify-center rounded-full border ${i === 0 ? 'border-ruby bg-ruby text-white shadow-ruby' : 'border-ink/10 bg-white text-ink/60'}`}>
                {i === 0 && <span className="absolute inset-0 rounded-full bg-ruby/40 animate-pulse-ring" />}
                <Icon name={s.icon} size={18} className="relative" />
              </span>
              <div className="min-w-0 pt-1 lg:pt-0">
                {i === 0 && <p className="t-label mb-1 text-ruby">{t.upNext}</p>}
                <p className="font-medium leading-snug text-ink">{s.name[lang]}</p>
                <p className="mt-1 text-[12.5px] leading-snug text-ink/50">{s.note[lang]}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}
