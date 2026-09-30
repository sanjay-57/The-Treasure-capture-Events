import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Button, Field } from '../../components/ui'
import { Icon, type IconName } from '../../components/Icon'
import { Reveal, Stagger, StaggerItem, EASE } from '../../components/motion'
import { KolamCorner, Ornament } from '../../components/tamil'
import { formatDate, formatINR, useLang, useT } from '../../lib/i18n'
import { toast, useTitle } from '../../lib/ui'
import { useStore } from '../../lib/store'
import { ADDONS, CROWDS, PACKAGES, VENUES, districtName, eventByKey } from '../../lib/data'
import { AnimatedINR, StepGuard, StepHeader, SubHeading, formatTime, hoursLabel, quoteFor, useDockAction } from './shared'

const copy = {
  title: { en: 'Almost there.', ta: 'இன்னும் ஒரு படி.' },
  lead: {
    en: 'Tell us who to call, review everything once, and send your enquiry. No payment is taken online.',
    ta: 'யாரை அழைக்க வேண்டும் என்று சொல்லுங்கள், அனைத்தையும் ஒருமுறை சரிபாருங்கள், பிறகு விசாரணையை அனுப்புங்கள். இணையத்தில் எந்தக் கட்டணமும் வசூலிக்கப்படாது.',
  },
  you: { en: 'Your details', ta: 'உங்கள் விவரங்கள்' },
  name: { en: 'Full name', ta: 'முழுப் பெயர்' },
  namePh: { en: 'Your full name', ta: 'உங்கள் முழுப் பெயர்' },
  mobile: { en: 'Mobile number', ta: 'கைபேசி எண்' },
  mobilePh: { en: 'Mobile number', ta: 'கைபேசி எண்' },
  mobileHint: { en: 'We will WhatsApp your confirmation here.', ta: 'உறுதிப்படுத்தலை இந்த எண்ணுக்கு WhatsApp-இல் அனுப்புவோம்.' },
  email: { en: 'Email', ta: 'மின்னஞ்சல்' },
  optional: { en: 'optional', ta: 'விருப்பத்திற்கு' },
  emailPh: { en: 'Email address', ta: 'மின்னஞ்சல் முகவரி' },
  notes: { en: 'Anything we should know?', ta: 'நாங்கள் தெரிந்துகொள்ள வேண்டியவை?' },
  notesPh: {
    en: 'Rituals, family traditions, must-have shots, timings…',
    ta: 'சடங்குகள், குடும்ப மரபுகள், கட்டாயம் வேண்டிய படங்கள், நேரங்கள்…',
  },
  errName: { en: 'Please enter your name.', ta: 'உங்கள் பெயரை உள்ளிடுங்கள்.' },
  errMobile: { en: 'Enter a valid 10-digit Indian mobile number.', ta: 'சரியான 10 இலக்க இந்திய கைபேசி எண்ணை உள்ளிடுங்கள்.' },
  errEmail: { en: 'That email doesn’t look right.', ta: 'மின்னஞ்சல் முகவரி சரியாக இல்லை.' },
  errTerms: { en: 'Please accept the terms to continue.', ta: 'தொடர விதிமுறைகளை ஏற்றுக்கொள்ளுங்கள்.' },
  review: { en: 'Review your celebration', ta: 'உங்கள் விழாவைச் சரிபாருங்கள்' },
  reviewNote: { en: 'Tap edit on any line to change it — your choices are kept.', ta: 'மாற்ற, எந்த வரியிலும் “திருத்து” என்பதைத் தொடுங்கள் — உங்கள் தேர்வுகள் சேமிக்கப்பட்டிருக்கும்.' },
  district: { en: 'District', ta: 'மாவட்டம்' },
  event: { en: 'Event', ta: 'நிகழ்வு' },
  venue: { en: 'Venue', ta: 'இடம்' },
  when: { en: 'Date & time', ta: 'தேதி & நேரம்' },
  pkg: { en: 'Package', ta: 'தொகுப்பு' },
  edit: { en: 'Edit', ta: 'திருத்து' },
  tentative: { en: 'Tentative', ta: 'தற்காலிகம்' },
  timeTbc: { en: 'time to be confirmed', ta: 'நேரம் பின்னர் உறுதிசெய்யப்படும்' },
  noExtras: { en: 'No extras', ta: 'கூடுதல் சேவைகள் இல்லை' },
  km: { en: 'km', ta: 'கி.மீ' },
  quote: { en: 'Quote', ta: 'மதிப்பீடு' },
  total: { en: 'Estimated total', ta: 'மதிப்பிடப்பட்ட மொத்தம்' },
  free: { en: 'Free', ta: 'இலவசம்' },
  gst: { en: 'Indicative, before GST. Confirmed on your call.', ta: 'தோராயமான தொகை, GST தவிர. அழைப்பில் உறுதிசெய்யப்படும்.' },
  send: { en: 'Send enquiry', ta: 'விசாரணையை அனுப்பு' },
  sendShort: { en: 'Send', ta: 'அனுப்பு' },
  sending: { en: 'Sending…', ta: 'அனுப்புகிறது…' },
  what: { en: 'What happens when you send', ta: 'அனுப்பியவுடன் என்ன நடக்கும்' },
  w1: { en: 'Your customer profile and a draft invoice are created — nothing is charged.', ta: 'உங்கள் வாடிக்கையாளர் விவரமும் வரைவு ரசீதும் உருவாகும் — எந்தக் கட்டணமும் வசூலிக்கப்படாது.' },
  w2: { en: 'A WhatsApp confirmation with your booking reference arrives instantly.', ta: 'உங்கள் பதிவு எண்ணுடன் WhatsApp உறுதிப்படுத்தல் உடனே வரும்.' },
  w3: { en: 'We call within 24 hours to confirm the date. Pay offline only after that.', ta: '24 மணி நேரத்திற்குள் அழைத்துத் தேதியை உறுதிசெய்வோம். அதன் பிறகே நேரடியாகக் கட்டணம் செலுத்தலாம்.' },
  agree1: { en: 'I agree to the ', ta: '' },
  terms: { en: 'Terms & Conditions', ta: 'விதிமுறைகளை' },
  agree2: { en: ' and understand payment is made offline after confirmation.', ta: ' ஏற்கிறேன்; உறுதிப்படுத்தலுக்குப் பின் கட்டணம் நேரடியாகச் செலுத்தப்படும் என்பதைப் புரிந்துகொள்கிறேன்.' },
  failed: { en: 'Something is missing — please check the form.', ta: 'ஏதோ விடுபட்டுள்ளது — படிவத்தைச் சரிபாருங்கள்.' },
  back: { en: 'Back', ta: 'பின் செல்' },
  demo: { en: 'Front-end demo: billing and WhatsApp calls are simulated.', ta: 'முன்னோட்டம்: கட்டண, WhatsApp அழைப்புகள் மாதிரியாக இயங்குகின்றன.' },
}

const isMobile = (s: string) => {
  let d = s.replace(/\D/g, '')
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2)
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1)
  return /^[6-9]\d{9}$/.test(d)
}
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim())

export default function Details() {
  return (
    <StepGuard step={4}>
      <DetailsStep />
    </StepGuard>
  )
}

function DetailsStep() {
  const lang = useLang()
  const t = useT(copy)
  useTitle({ en: 'Book · Your details', ta: 'பதிவு · உங்கள் விவரம்' })
  const draft = useStore(s => s.draft)
  const updateDraft = useStore(s => s.updateDraft)
  const submitEnquiry = useStore(s => s.submitEnquiry)
  const navigate = useNavigate()
  const [touched, setTouched] = useState({ name: false, contact: false, email: false, terms: false })
  const [agree, setAgree] = useState(false)
  const [sending, setSending] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  useDockAction({ onNext: () => formRef.current?.requestSubmit(), label: t.send, short: t.sendShort, icon: 'send', busy: sending })

  const errors = {
    name: draft.name.trim().length < 2 ? t.errName : '',
    contact: !isMobile(draft.contact) ? t.errMobile : '',
    email: draft.email.trim() && !isEmail(draft.email) ? t.errEmail : '',
    terms: !agree ? t.errTerms : '',
  }
  const valid = !errors.name && !errors.contact && !errors.email && !errors.terms

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (sending) return
    setTouched({ name: true, contact: true, email: true, terms: true })
    if (!valid) {
      toast(t.failed)
      const first = (['name', 'contact', 'email', 'terms'] as const).find(k => errors[k])
      document.querySelector<HTMLElement>(`[data-field="${first}"] input, [data-field="${first}"] textarea`)?.focus()
      return
    }
    setSending(true)
    // POST /enquiries — the store mock creates the order, customer + draft invoice and the WhatsApp ack.
    window.setTimeout(() => {
      updateDraft({ name: draft.name.trim(), email: draft.email.trim() })
      const id = submitEnquiry()
      if (id) navigate(`/book/confirmed/${id}`)
      else {
        setSending(false)
        toast(t.failed)
      }
    }, 900)
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate>
      <StepHeader step={4} title={t.title} lead={t.lead} />

      <SubHeading index="i." title={t.you} />
      <Reveal>
        <div className="relative rounded-[28px] border hairline bg-white/75 p-5 shadow-soft sm:p-7">
          {lang === 'ta' && <KolamCorner className="pointer-events-none absolute right-0 top-0 rotate-90 opacity-60" />}
          <div className="grid gap-5 sm:grid-cols-2">
            <div data-field="name" onBlur={() => setTouched(s => ({ ...s, name: true }))}>
              <Field label={t.name} name="name" value={draft.name} onChange={v => updateDraft({ name: v })} placeholder={t.namePh} icon="users" required maxLength={80} error={touched.name ? errors.name : ''} />
            </div>
            <div data-field="contact" onBlur={() => setTouched(s => ({ ...s, contact: true }))}>
              <Field
                label={t.mobile}
                name="tel"
                type="tel"
                inputMode="tel"
                value={draft.contact}
                onChange={v => updateDraft({ contact: v.replace(/[^\d+\s-]/g, '') })}
                placeholder={t.mobilePh}
                icon="phone"
                required
                maxLength={16}
                error={touched.contact ? errors.contact : ''}
                hint={t.mobileHint}
              />
            </div>
            <div data-field="email" className="sm:col-span-2" onBlur={() => setTouched(s => ({ ...s, email: true }))}>
              <Field label={`${t.email} · ${t.optional}`} name="email" type="email" inputMode="email" value={draft.email} onChange={v => updateDraft({ email: v })} placeholder={t.emailPh} icon="mail" maxLength={120} error={touched.email ? errors.email : ''} />
            </div>
            <div className="sm:col-span-2">
              <Field label={`${t.notes} · ${t.optional}`} value={draft.notes} onChange={v => updateDraft({ notes: v })} placeholder={t.notesPh} rows={3} maxLength={600} />
            </div>
          </div>
        </div>
      </Reveal>

      <Ornament className="my-10 md:my-14" />

      <SubHeading index="ii." title={t.review} note={t.reviewNote} />
      <Review />

      <Ornament className="my-10 md:my-14" />

      <Reveal>
        <div className="glass-ruby-tint rounded-[28px] p-5 sm:p-7">
          <p className="t-label text-ruby-deep">{t.what}</p>
          <Stagger className="mt-5 grid gap-4 md:grid-cols-3" gap={0.08}>
            {([
              ['receipt', t.w1],
              ['whatsapp', t.w2],
              ['phone', t.w3],
            ] as [IconName, string][]).map(([icon, text], i) => (
              <StaggerItem key={icon} className="flex items-start gap-3 md:flex-col">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-ruby shadow-soft">
                  <Icon name={icon} size={18} />
                </span>
                <p className="text-[13.5px] leading-relaxed text-ink/70">
                  <span className="mr-1.5 font-display font-semibold italic text-ruby">{i + 1}.</span>
                  {text}
                </p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </Reveal>

      <div data-field="terms" className="mt-8">
        <label className="group flex cursor-pointer items-start gap-3.5">
          <input
            type="checkbox"
            checked={agree}
            onChange={e => {
              setAgree(e.target.checked)
              setTouched(s => ({ ...s, terms: true }))
            }}
            className="peer sr-only"
            aria-invalid={touched.terms && !!errors.terms}
            aria-describedby="terms-error"
          />
          <span
            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-all duration-300 peer-focus-visible:ring-4 peer-focus-visible:ring-ruby/25 ${
              agree ? 'border-ruby bg-ruby text-white' : touched.terms && errors.terms ? 'border-ruby bg-white text-transparent' : 'border-ink/20 bg-white text-transparent group-hover:border-ink/40'
            }`}
            aria-hidden="true"
          >
            <Icon name="check" size={15} strokeWidth={2.6} />
          </span>
          <span className="text-[14px] leading-relaxed text-ink/70">
            {t.agree1}
            <Link to="/terms" target="_blank" className="font-medium text-ink underline decoration-ruby/50 underline-offset-4 transition hover:text-ruby" onClick={e => e.stopPropagation()}>
              {t.terms}
            </Link>
            {t.agree2}
          </span>
        </label>
        <AnimatePresence>
          {touched.terms && errors.terms && (
            <motion.p id="terms-error" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: EASE }} className="ml-[38px] mt-1.5 text-xs text-ruby">
              {errors.terms}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-8 flex flex-col-reverse items-stretch gap-4 border-t hairline pt-6 sm:flex-row sm:items-center sm:justify-between md:mt-10 md:pt-8">
        <Button to="/book/package" variant="ghost" iconLeft="arrowLeft" className="self-start">
          {t.back}
        </Button>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <div className="hidden md:contents">
            <Button type="submit" size="lg" icon={sending ? undefined : 'send'} disabled={sending} className="w-full sm:w-auto">
              {sending ? (
                <span className="flex items-center gap-2.5">
                  <motion.span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
                  {t.sending}
                </span>
              ) : (
                t.send
              )}
            </Button>
          </div>
          <p className="text-center text-[11px] text-ink/40 sm:text-right">{t.demo}</p>
        </div>
      </div>
    </form>
  )
}

function Review() {
  const lang = useLang()
  const t = useT(copy)
  const d = useStore(s => s.draft)
  const quote = quoteFor(d)
  const ev = eventByKey(d.eventType)
  const venue = VENUES.find(v => v.key === d.venueType)
  const pkg = PACKAGES.find(p => p.key === d.packageId)
  const crowd = CROWDS.find(c => c.key === d.crowd)
  const extras = d.addons.map(a => ADDONS.find(x => x.key === a)?.name[lang]).filter(Boolean).join(', ')

  const rows: { icon: IconName; label: string; value: string; sub?: string; to: string }[] = [
    { icon: 'mapPin', label: t.district, value: districtName(d.district, lang), to: '/book' },
    { icon: 'sparkle', label: t.event, value: ev?.name[lang] ?? '—', sub: `${hoursLabel(d.durationHours, lang)} · ${crowd?.name[lang] ?? ''} (${crowd?.range ?? ''})`, to: '/book/event' },
    {
      icon: d.venueType === 'home' ? 'home' : 'building',
      label: t.venue,
      value: [venue?.name[lang], d.venueName].filter(Boolean).join(' · '),
      sub: `${d.venueAddress}${d.distanceKm ? ` · ~${d.distanceKm} ${t.km}` : ''}`,
      to: '/book/venue',
    },
    {
      icon: 'calendar',
      label: t.when,
      value: formatDate(d.date, lang, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }),
      sub: [d.time ? formatTime(d.time, lang) : t.timeTbc, d.dateCertainty === 'tentative' ? t.tentative : ''].filter(Boolean).join(' · '),
      to: '/book/venue',
    },
    { icon: 'gem', label: t.pkg, value: pkg?.name[lang] ?? '', sub: extras || t.noExtras, to: '/book/package' },
  ]

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <Reveal>
        <ul className="divide-y divide-ink/[0.07] overflow-hidden rounded-[28px] border hairline bg-white/75 shadow-soft">
          {rows.map(r => (
            <li key={r.label} className="flex items-start gap-3 px-4 py-4 sm:gap-4 sm:px-6">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink/[0.04] text-ruby">
                <Icon name={r.icon} size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="t-label text-ink/45">{r.label}</p>
                <p className="mt-1 font-medium leading-snug text-ink [overflow-wrap:anywhere]">{r.value}</p>
                {r.sub && <p className="mt-0.5 break-words text-[12.5px] leading-snug text-ink/50">{r.sub}</p>}
              </div>
              <Link to={r.to} aria-label={`${t.edit} · ${r.label}`} className="-mr-2 -mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center gap-1 rounded-full text-[12.5px] font-medium text-ink/55 transition hover:bg-ink/[0.05] hover:text-ruby sm:mr-0 sm:mt-0 sm:w-auto sm:px-3 md:h-8">
                <Icon name="edit" size={13} />
                <span className="hidden sm:inline">{t.edit}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Reveal>

      {quote && (
        <Reveal delay={0.1}>
          <div className="relative h-full overflow-hidden rounded-[28px] bg-ink p-5 text-white sm:p-6">
            <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-ruby/40 blur-3xl" />
            {lang === 'ta' && <div aria-hidden="true" className="kolam-bg-white pointer-events-none absolute inset-0 opacity-[0.06]" />}
            <div className="relative">
              <p className="t-label text-white/50">{t.quote}</p>
              <ul className="mt-4 space-y-3">
                {quote.lines.map(l => (
                  <li key={l.label.en} className="flex items-start justify-between gap-4 text-[13.5px]">
                    <div className="min-w-0">
                      <p className="leading-snug text-white/85">{l.label[lang]}</p>
                      {l.detail && <p className="mt-0.5 text-[11.5px] leading-snug text-white/40">{l.detail[lang]}</p>}
                    </div>
                    <span className={`shrink-0 tabular-nums ${l.amount ? 'text-white' : 'text-white/40'}`}>{l.amount ? formatINR(l.amount) : t.free}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex items-end justify-between gap-4 border-t border-white/10 pt-5">
                <p className="text-[13px] text-white/60">{t.total}</p>
                <AnimatedINR value={quote.total} className="font-display text-[2.2rem] font-semibold leading-none text-white" />
              </div>
              <p className="mt-3 text-[11px] leading-snug text-white/40">{t.gst}</p>
            </div>
          </div>
        </Reveal>
      )}
    </div>
  )
}
