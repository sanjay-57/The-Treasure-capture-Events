import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Icon, type IconName } from '../components/Icon'
import { Button, Container, Eyebrow, Field, Select } from '../components/ui'
import { EASE, Reveal, RevealText, Stagger, StaggerItem } from '../components/motion'
import { Kolam, KolamCorner, TamilOnly } from '../components/tamil'
import { COMMON, useLang, useT } from '../lib/i18n'
import { DISTRICTS, EVENTS, type DistrictKey, type EventKey } from '../lib/data'
import { useStore } from '../lib/store'
import { toast, useTitle } from '../lib/ui'
import { FaqList, useTopPad, type FaqItem } from './content/shared'

const TITLE = { en: 'Contact', ta: 'தொடர்புக்கு' }

const copy = {
  eyebrow: { en: 'Contact the studio', ta: 'ஸ்டுடியோவைத் தொடர்புகொள்ள' },
  title: { en: 'Let’s talk about\nyour day.', ta: 'உங்கள் விழாவைப்\nபற்றிப் பேசுவோம்.' },
  lead: {
    en: 'Call, message or drop by West Masi Street. Tell us the ceremony and the date — we’ll take it from there.',
    ta: 'அழையுங்கள், செய்தி அனுப்புங்கள், அல்லது மேற்கு மாசி வீதிக்கு நேரில் வாருங்கள். விழாவையும் தேதியையும் சொல்லுங்கள் — மீதியை நாங்கள் பார்த்துக்கொள்கிறோம்.',
  },
  promise: { en: 'We reply within 2 working hours', ta: '2 பணி நேரங்களுக்குள் பதில்' },

  call: { en: 'Call us', ta: 'அழையுங்கள்' },
  callSub: { en: 'Talk to a real person, not a menu', ta: 'இயந்திரம் அல்ல, உண்மையான மனிதருடன் பேசுங்கள்' },
  wa: { en: 'WhatsApp', ta: 'வாட்ஸ்அப்' },
  waSub: { en: 'Send dates, venues, voice notes', ta: 'தேதி, இடம், குரல் செய்தி அனுப்புங்கள்' },
  email: { en: 'Email', ta: 'மின்னஞ்சல்' },
  emailSub: { en: 'For detailed briefs & documents', ta: 'விரிவான விவரங்கள் & ஆவணங்களுக்கு' },

  formEyebrow: { en: 'Send an enquiry', ta: 'விசாரணை அனுப்புக' },
  formTitle: { en: 'Tell us a little', ta: 'கொஞ்சம் சொல்லுங்கள்' },
  formLead: { en: 'Just the basics. We’ll call to fill in the rest.', ta: 'அடிப்படை விவரங்கள் போதும். மீதியை அழைத்துக் கேட்டுக்கொள்கிறோம்.' },
  name: { en: 'Your name', ta: 'உங்கள் பெயர்' },
  namePh: { en: 'Your full name', ta: 'உங்கள் முழுப் பெயர்' },
  phone: { en: 'Mobile number', ta: 'கைபேசி எண்' },
  phonePh: { en: 'Mobile number', ta: 'கைபேசி எண்' },
  phoneHint: { en: 'We’ll call or WhatsApp you on this number', ta: 'இந்த எண்ணில் அழைப்போம் அல்லது வாட்ஸ்அப் செய்வோம்' },
  event: { en: 'Event type', ta: 'விழா வகை' },
  date: { en: 'Event date', ta: 'விழா தேதி' },
  dateHint: { en: 'Leave blank if not fixed yet', ta: 'இன்னும் முடிவாகவில்லை எனில் விட்டுவிடுங்கள்' },
  district: { en: 'District', ta: 'மாவட்டம்' },
  choose: { en: 'Choose…', ta: 'தேர்ந்தெடுக்கவும்…' },
  other: { en: 'Somewhere else', ta: 'வேறு இடம்' },
  message: { en: 'Message', ta: 'செய்தி' },
  messagePh: { en: 'Tell us about your event', ta: 'உங்கள் நிகழ்வைப் பற்றிச் சொல்லுங்கள்' },
  send: { en: 'Send your message', ta: 'உங்கள் செய்தியை அனுப்புக' },
  consent: { en: 'By sending, you agree to be contacted about your enquiry. See our', ta: 'அனுப்புவதன் மூலம், உங்கள் விசாரணை தொடர்பாக நாங்கள் தொடர்புகொள்ள ஒப்புக்கொள்கிறீர்கள். காண்க:' },
  errName: { en: 'Please tell us your name', ta: 'உங்கள் பெயரைக் குறிப்பிடுங்கள்' },
  errPhone: { en: 'Enter a valid 10-digit mobile number', ta: 'சரியான 10 இலக்கக் கைபேசி எண்ணை உள்ளிடுங்கள்' },
  toast: { en: 'Enquiry sent — we’ll call you soon', ta: 'விசாரணை அனுப்பப்பட்டது — விரைவில் அழைப்போம்' },

  thanks: { en: 'Thank you, {name}.', ta: 'நன்றி, {name}.' },
  thanksLead: {
    en: 'Your enquiry is with the studio. Expect a call or WhatsApp on {phone} within two working hours.',
    ta: 'உங்கள் விசாரணை ஸ்டுடியோவை வந்தடைந்தது. இரண்டு பணி நேரங்களுக்குள் {phone} எண்ணுக்கு அழைப்பு அல்லது வாட்ஸ்அப் வரும்.',
  },
  thanksQuote: { en: 'Meanwhile, see your instant quote', ta: 'அதுவரை, உடனடி மதிப்பீட்டைப் பாருங்கள்' },
  another: { en: 'Send another', ta: 'இன்னொன்று அனுப்பு' },

  visitEyebrow: { en: 'Visit', ta: 'நேரில் வர' },
  visitTitle: { en: 'Head studio, Madurai', ta: 'முதன்மை ஸ்டுடியோ, மதுரை' },
  hours: { en: 'Mon–Sat · 9:30 am – 8 pm', ta: 'திங்கள்–சனி · காலை 9:30 – இரவு 8' },
  sunday: { en: 'Sundays & festival days by appointment', ta: 'ஞாயிறு & பண்டிகை நாட்களில் முன்பதிவின் பேரில்' },
  landmark: { en: 'Five minutes’ walk from the Meenakshi Amman temple west tower', ta: 'மீனாட்சி அம்மன் கோயில் மேற்குக் கோபுரத்திலிருந்து ஐந்து நிமிட நடை' },
  directions: { en: 'Get directions', ta: 'வழி காண' },
  mapTitle: { en: 'Map showing the studio on West Masi Street, Madurai', ta: 'மதுரை மேற்கு மாசி வீதியில் ஸ்டுடியோ இருப்பிடம் காட்டும் வரைபடம்' },

  faqEyebrow: { en: 'Quick answers', ta: 'விரைவான பதில்கள்' },
  faqTitle: { en: 'Before you call', ta: 'அழைக்கும் முன்' },
}

const FAQ: FaqItem[] = [
  {
    q: { en: 'Do I need an appointment to visit the studio?', ta: 'ஸ்டுடியோவுக்கு வர முன்பதிவு தேவையா?' },
    a: {
      en: 'Walk-ins are welcome Monday to Saturday. If you’d like to meet a specific photographer or see albums for your ceremony, a quick call beforehand means they’ll be there and ready.',
      ta: 'திங்கள் முதல் சனி வரை நேரடியாக வரலாம். குறிப்பிட்ட புகைப்படக் கலைஞரைச் சந்திக்க அல்லது உங்கள் விழா வகை ஆல்பங்களைப் பார்க்க விரும்பினால், முன்பே ஒரு அழைப்பு கொடுத்தால் அவர்கள் தயாராக இருப்பார்கள்.',
    },
  },
  {
    q: { en: 'Can we meet at our home instead?', ta: 'எங்கள் வீட்டிலேயே சந்திக்கலாமா?' },
    a: {
      en: 'Of course. Within our districts we’re happy to visit your home for the couple or family meeting — elders often prefer it, and it helps us plan the light.',
      ta: 'நிச்சயமாக. எங்கள் மாவட்டங்களுக்குள் மணமக்கள் / குடும்பச் சந்திப்புக்கு உங்கள் வீட்டுக்கே வருகிறோம் — பெரியவர்களுக்கும் அது வசதி, ஒளியைத் திட்டமிடவும் உதவும்.',
    },
  },
  {
    q: { en: 'Do you travel outside Tamil Nadu?', ta: 'தமிழ்நாட்டுக்கு வெளியேயும் வருவீர்களா?' },
    a: {
      en: 'Yes — we’ve photographed weddings in Bengaluru, Kerala and Sri Lanka. Travel and stay are quoted separately; write to us with the city and dates.',
      ta: 'ஆம் — பெங்களூரு, கேரளா, இலங்கையிலும் திருமணங்களைப் படம்பிடித்துள்ளோம். பயணம் & தங்குமிடம் தனியாக மதிப்பிடப்படும்; நகரம், தேதியுடன் எங்களுக்கு எழுதுங்கள்.',
    },
  },
  {
    q: { en: 'Is my date safe while I decide?', ta: 'முடிவெடுக்கும் வரை என் தேதி பாதுகாப்பாக இருக்குமா?' },
    a: {
      en: 'We hold a tentative date for seven days without any advance. After that it is released, unless the 30% advance confirms it.',
      ta: 'முன்பணம் இல்லாமலேயே ஏழு நாட்கள் தற்காலிகமாகத் தேதியை ஒதுக்கி வைப்போம். அதன் பின் 30% முன்பணம் செலுத்தாவிட்டால் அந்தத் தேதி மற்றவர்களுக்குத் திறக்கப்படும்.',
    },
  },
]

/** Normalises Indian mobile input to 10 digits, or returns null if invalid. */
function normalisePhone(raw: string): string | null {
  let d = raw.replace(/\D/g, '')
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2)
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1)
  return /^[6-9]\d{9}$/.test(d) ? d : null
}

export default function Contact() {
  useTitle(TITLE)
  const t = useT(copy)
  const lang = useLang()
  const pad = useTopPad()
  const studio = useStore(s => s.cms.studio)
  const wa = studio.whatsapp.replace(/\D/g, '')

  const actions: { icon: IconName; label: string; value: string; sub: string; href: string; external?: boolean }[] = [
    { icon: 'phone', label: t.call, value: studio.phone, sub: t.callSub, href: `tel:${studio.phone.replace(/\s/g, '')}` },
    { icon: 'whatsapp', label: t.wa, value: studio.whatsapp, sub: t.waSub, href: `https://wa.me/${wa}`, external: true },
    { icon: 'mail', label: t.email, value: studio.email, sub: t.emailSub, href: `mailto:${studio.email}` },
  ]

  return (
    <div className={`relative isolate overflow-hidden ${pad}`}>
      <div className="ambient pointer-events-none absolute inset-x-0 top-0 -z-10 h-[1100px]" />
      <TamilOnly>
        <div className="kolam-bg pointer-events-none absolute inset-x-0 top-0 -z-10 h-[900px] opacity-[0.06] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      </TamilOnly>

      {/* Header */}
      <Container wide>
        <div className="grid gap-6 md:gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <div>
            <Reveal>
              <Eyebrow>{t.eyebrow}</Eyebrow>
            </Reveal>
            <RevealText as="h1" immediate delay={0.1} text={t.title} className="t-hero mt-5 text-ink md:mt-6" />
          </div>
          <div>
            <Reveal delay={0.35}>
              <p className="t-lead max-w-md text-ink/60">{t.lead}</p>
            </Reveal>
            <Reveal delay={0.5}>
              <span className="glass mt-5 inline-flex items-center gap-2.5 rounded-full md:mt-6 py-2 pl-3 pr-4 text-[13px] font-medium text-ink">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inset-0 rounded-full bg-ruby animate-pulse-ring" />
                  <span className="relative h-2 w-2 rounded-full bg-ruby" />
                </span>
                {t.promise}
              </span>
            </Reveal>
          </div>
        </div>

        {/* Big actions */}
        <Stagger className="mt-10 grid gap-3 md:mt-20 md:grid-cols-3 md:gap-4" gap={0.08}>
          {actions.map(a => (
            <StaggerItem key={a.icon}>
              <a
                href={a.href}
                target={a.external ? '_blank' : undefined}
                rel={a.external ? 'noreferrer' : undefined}
                className="group relative flex h-full items-center gap-4 overflow-hidden rounded-3xl border border-ink/10 bg-white p-4 transition-all duration-500 hover:-translate-y-1 hover:border-ruby hover:shadow-ruby sm:p-6 md:flex-col md:items-stretch md:gap-0 md:rounded-[28px] md:p-8"
              >
                <span className="absolute inset-0 origin-bottom scale-y-0 bg-ruby transition-transform duration-500 ease-out group-hover:scale-y-100" aria-hidden="true" />
                <div className="relative flex shrink-0 items-start justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-white transition-colors duration-500 group-hover:bg-white group-hover:text-ruby md:h-14 md:w-14">
                    <Icon name={a.icon} size={22} />
                  </span>
                  <Icon name="arrowUpRight" size={22} className="hidden text-ink/30 transition-all duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white md:block" />
                </div>
                <div className="relative min-w-0 flex-1">
                  <p className="t-label text-ink/45 transition-colors duration-500 group-hover:text-white/70 md:mt-10">{a.label}</p>
                  <p className="mt-1 font-display text-[1.2rem] leading-tight text-ink transition-colors duration-500 [overflow-wrap:anywhere] group-hover:text-white md:mt-2 md:break-all md:text-[1.75rem]">{a.value.replace('@', '@\u200b')}</p>
                  <p className="mt-1 text-[12.5px] text-ink/50 transition-colors duration-500 group-hover:text-white/75 md:mt-2 md:text-[13.5px]">{a.sub}</p>
                </div>
                <Icon name="arrowUpRight" size={20} className="relative shrink-0 self-start text-ink/30 transition-colors duration-500 group-hover:text-white md:hidden" />
              </a>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>

      {/* Form + visit */}
      <Container wide className="mt-14 md:mt-28">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:gap-8">
          <Reveal y={40}>
            <ContactForm />
          </Reveal>

          <Reveal y={40} delay={0.1} className="flex flex-col gap-6">
            <div className="glass-strong relative flex flex-1 flex-col overflow-hidden rounded-[28px] p-2 md:rounded-[32px]">
              <div className="relative min-h-[260px] flex-1 overflow-hidden rounded-[22px] bg-mist md:min-h-[320px] md:rounded-[26px]">
                <iframe
                  title={t.mapTitle}
                  src="https://www.google.com/maps?q=West+Masi+Street+Madurai&output=embed"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0 h-full w-full border-0 grayscale contrast-[1.08]"
                />
                <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-ink/5" />
                <span className="glass-ruby pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold">
                  <Icon name="mapPin" size={14} />
                  {lang === 'ta' ? 'மதுரை' : 'Madurai'}
                </span>
              </div>
              <div className="p-4 pt-5 sm:p-5 md:p-7">
                <Eyebrow>{t.visitEyebrow}</Eyebrow>
                <h2 className="t-3 mt-3 text-ink">{t.visitTitle}</h2>
                <ul className="mt-5 space-y-3.5 text-[15px] text-ink/70">
                  <li className="flex gap-3">
                    <Icon name="mapPin" size={18} className="mt-0.5 shrink-0 text-ruby" />
                    <span>
                      {lang === 'ta' ? studio.addressTa : studio.addressEn}
                      <span className="mt-0.5 block text-[13px] text-ink/45">{t.landmark}</span>
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <Icon name="clock" size={18} className="mt-0.5 shrink-0 text-ruby" />
                    <span>
                      {t.hours}
                      <span className="mt-0.5 block text-[13px] text-ink/45">{t.sunday}</span>
                    </span>
                  </li>
                </ul>
                <div className="mt-6">
                  <Button href="https://www.google.com/maps/search/?api=1&query=West+Masi+Street+Madurai" variant="outline" iconLeft="mapPin" icon="arrowUpRight" className="w-full sm:w-auto">
                    {t.directions}
                  </Button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </Container>

      {/* FAQ-lite */}
      <Container wide className="py-16 md:py-36">
        <div className="grid gap-6 md:gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <TamilOnly>
              <Kolam size={48} className="mb-5 text-ruby" />
            </TamilOnly>
            <Reveal>
              <Eyebrow>{t.faqEyebrow}</Eyebrow>
            </Reveal>
            <RevealText text={t.faqTitle} className="t-1 mt-4 text-ink md:mt-5" />
          </div>
          <Reveal delay={0.1}>
            <FaqList items={FAQ} defaultOpen={null} />
          </Reveal>
        </div>
      </Container>
    </div>
  )
}

// ─── Form ────────────────────────────────────────────────────────────────────

function ContactForm() {
  const t = useT(copy)
  const c = useT(COMMON)
  const lang = useLang()
  const captureLead = useStore(s => s.captureLead)
  const updateDraft = useStore(s => s.updateDraft)
  const lead = useStore(s => s.lead)

  const [name, setName] = useState(lead?.name ?? '')
  const [phone, setPhone] = useState(lead?.contact ?? '')
  const [event, setEvent] = useState<EventKey | ''>('')
  const [date, setDate] = useState('')
  const [district, setDistrict] = useState<DistrictKey | 'other' | ''>('')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({})
  const [sent, setSent] = useState<{ name: string; phone: string } | null>(null)

  const today = new Date().toISOString().slice(0, 10)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const n = name.trim()
    const p = normalisePhone(phone)
    const errs: typeof errors = {}
    if (n.length < 2) errs.name = t.errName
    if (!p) errs.phone = t.errPhone
    setErrors(errs)
    if (Object.keys(errs).length || !p) return
    const pretty = `+91 ${p.slice(0, 5)} ${p.slice(5)}`
    captureLead(n, pretty, 'contact')
    // Prefill the booking flow so the quote picks up where this form left off.
    updateDraft({
      ...(event ? { eventType: event } : {}),
      ...(district && district !== 'other' ? { district } : {}),
      ...(date ? { date } : {}),
      ...(message.trim() ? { notes: message.trim() } : {}),
    })
    toast(t.toast, 'ruby')
    setSent({ name: n.split(' ')[0], phone: pretty })
  }

  const reset = () => {
    setSent(null)
    setEvent('')
    setDate('')
    setDistrict('')
    setMessage('')
  }

  return (
    <div className="glass-strong relative h-full overflow-hidden rounded-[28px] p-5 sm:p-8 md:rounded-[32px] md:p-10">
      <TamilOnly>
        <KolamCorner className="absolute right-4 top-4 rotate-90" />
        <KolamCorner className="absolute bottom-4 left-4 -rotate-90" />
      </TamilOnly>
      <AnimatePresence mode="wait" initial={false}>
        {sent ? (
          <motion.div
            key="sent"
            initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="flex min-h-[440px] flex-col items-start justify-center md:min-h-[560px]"
            role="status"
          >
            <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-ruby text-white shadow-ruby">
              <span className="absolute inset-0 rounded-full bg-ruby/40 animate-pulse-ring" />
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <motion.path d="m5 12.5 4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, delay: 0.25, ease: EASE }} />
              </svg>
            </span>
            <h2 className="t-2 mt-8 text-ink">{t.thanks.replace('{name}', sent.name)}</h2>
            <p className="t-lead mt-4 max-w-md text-ink/60">{t.thanksLead.replace('{phone}', sent.phone)}</p>
            <div className="mt-8 flex w-full flex-col gap-3 sm:mt-9 sm:w-auto sm:flex-row sm:flex-wrap">
              <Button to="/book" icon="arrowRight">{t.thanksQuote}</Button>
              <Button variant="outline" onClick={reset}>{t.another}</Button>
            </div>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={submit} noValidate initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -10, filter: 'blur(6px)' }} transition={{ duration: 0.4 }}>
            <Eyebrow>{t.formEyebrow}</Eyebrow>
            <h2 className="t-2 mt-3 text-ink">{t.formTitle}</h2>
            <p className="mt-2 text-[15px] text-ink/55">{t.formLead}</p>

            <div className="mt-7 grid gap-5 sm:mt-8 sm:grid-cols-2">
              <Field label={t.name} value={name} onChange={v => { setName(v); if (errors.name) setErrors(e => ({ ...e, name: undefined })) }} placeholder={t.namePh} required icon="users" error={errors.name} name="name" maxLength={60} />
              <Field
                label={t.phone}
                value={phone}
                onChange={v => { setPhone(v); if (errors.phone) setErrors(e => ({ ...e, phone: undefined })) }}
                type="tel"
                inputMode="tel"
                placeholder={t.phonePh}
                required
                icon="phone"
                error={errors.phone}
                hint={t.phoneHint}
                name="phone"
                maxLength={16}
              />
              <Select
                label={t.event}
                value={event}
                onChange={v => setEvent(v as EventKey | '')}
                options={[{ value: '', label: t.choose }, ...EVENTS.map(e => ({ value: e.key, label: e.name[lang] }))]}
              />
              <Select
                label={t.district}
                value={district}
                onChange={v => setDistrict(v as DistrictKey | 'other' | '')}
                options={[{ value: '', label: t.choose }, ...DISTRICTS.map(d => ({ value: d.key, label: d.name[lang] })), { value: 'other', label: t.other }]}
              />
              <div className="sm:col-span-2">
                <DateField label={t.date} value={date} onChange={setDate} min={today} hint={t.dateHint} />
              </div>
              <div className="sm:col-span-2">
                <Field label={t.message} value={message} onChange={setMessage} rows={4} placeholder={t.messagePh} name="message" maxLength={800} />
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Button type="submit" size="lg" icon="send" className="w-full sm:w-auto">{t.send}</Button>
              <p className="text-center text-[12px] leading-relaxed text-ink/45 sm:max-w-xs sm:text-left">
                {t.consent}{' '}
                <Link to="/privacy" className="underline decoration-ink/20 underline-offset-2 hover:text-ruby">{c.privacy}</Link>
              </p>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Native date input styled like <Field>, with a min date. */
function DateField({ label, value, onChange, min, hint }: { label: string; value: string; onChange: (v: string) => void; min: string; hint?: string }) {
  return (
    <div>
      <label htmlFor="contact-date" className="t-label mb-2 flex items-center gap-1 text-ink/55">{label}</label>
      <div className="relative">
        <Icon name="calendar" size={17} className="pointer-events-none absolute left-4 top-[17px] text-ink/35" />
        <input
          id="contact-date"
          type="date"
          value={value}
          min={min}
          onChange={e => onChange(e.target.value)}
          className="block h-[52px] w-full min-w-0 appearance-none rounded-2xl border border-ink/10 bg-white/80 pl-11 pr-4 text-left [&::-webkit-date-and-time-value]:text-left text-[15px] text-ink outline-none transition-all duration-200 focus:border-ruby focus:bg-white focus:ring-4 focus:ring-ruby/10"
        />
      </div>
      {hint && <p className="mt-1.5 text-xs text-ink/45">{hint}</p>}
    </div>
  )
}
