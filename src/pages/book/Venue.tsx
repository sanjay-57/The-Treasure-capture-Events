import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { Field, LangImg, Segmented, Badge } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { Reveal, EASE } from '../../components/motion'
import { KolamCorner, Ornament, TempleBorder } from '../../components/tamil'
import { formatDate, formatINR, useLang, useT } from '../../lib/i18n'
import { useTitle } from '../../lib/ui'
import { useStore } from '../../lib/store'
import { TRAVEL_FREE_KM, TRAVEL_PER_KM, VENUES, districtName, type VenueType } from '../../lib/data'
import { estimateDistanceKm } from '../../lib/pricing'
import { StepGuard, StepHeader, StepNav, SubHeading, todayISO } from './shared'

const copy = {
  title: { en: 'Where, and when?', ta: 'எங்கே, எப்போது?' },
  lead: {
    en: 'Tell us about the venue and the date. Travel within 20 km of our studio is always free.',
    ta: 'இடம் மற்றும் தேதியைச் சொல்லுங்கள். எங்கள் ஸ்டுடியோவிலிருந்து 20 கி.மீ-க்குள் பயணம் எப்போதும் இலவசம்.',
  },
  venueType: { en: 'Venue type', ta: 'இட வகை' },
  venueTypeLabel: { en: 'Choose venue type', ta: 'இட வகையைத் தேர்ந்தெடுக்கவும்' },
  homeCrowd: { en: 'Usually under 50 guests', ta: 'பொதுவாக 50-க்கும் குறைவான விருந்தினர்' },
  mahalCrowd: { en: 'Usually 100+ guests', ta: 'பொதுவாக 100-க்கும் மேற்பட்ட விருந்தினர்' },
  noSurcharge: { en: 'No venue surcharge', ta: 'இடக் கூடுதல் கட்டணம் இல்லை' },
  lightingKit: { en: 'stage lighting kit', ta: 'மேடை விளக்கு அமைப்பு' },
  address: { en: 'Venue address', ta: 'இட முகவரி' },
  addressNote: { en: 'We use it to plan travel and the right kit for the space.', ta: 'பயணத்தையும் இடத்திற்கேற்ற உபகரணங்களையும் திட்டமிட இது உதவும்.' },
  homeName: { en: 'House / family name', ta: 'வீடு / குடும்பப் பெயர்' },
  mahalName: { en: 'Mahal / hall name', ta: 'மண்டபம் / அரங்கின் பெயர்' },
  homeNamePh: { en: 'House name', ta: 'இல்லத்தின் பெயர்' },
  mahalNamePh: { en: 'Mahal or hall name', ta: 'மண்டபத்தின் பெயர்' },
  optional: { en: 'Optional', ta: 'விருப்பத்திற்கு' },
  fullAddress: { en: 'Full address', ta: 'முழு முகவரி' },
  addressPh: { en: 'Full address', ta: 'முழு முகவரி' },
  distTitle: { en: 'Distance from our studio', ta: 'எங்கள் ஸ்டுடியோவிலிருந்து தூரம்' },
  estimate: { en: 'Estimate', ta: 'மதிப்பீடு' },
  calculating: { en: 'Calculating…', ta: 'கணக்கிடுகிறது…' },
  enterAddress: { en: 'Enter the address to estimate distance.', ta: 'தூரத்தை மதிப்பிட முகவரியை உள்ளிடுங்கள்.' },
  within: { en: 'Within the free 20 km radius — no travel charge.', ta: 'இலவச 20 கி.மீ வரம்புக்குள் — பயணக் கட்டணம் இல்லை.' },
  beyond: { en: 'beyond the free radius', ta: 'இலவச வரம்புக்கு அப்பால்' },
  perKm: { en: `₹${TRAVEL_PER_KM}/km`, ta: `கி.மீ-க்கு ₹${TRAVEL_PER_KM}` },
  free: { en: 'Free', ta: 'இலவசம்' },
  freeZone: { en: '20 km free', ta: '20 கி.மீ இலவசம்' },
  km: { en: 'km', ta: 'கி.மீ' },
  distNote: {
    en: 'A quick front-end estimate. When you submit, our server confirms the exact road distance with Google Maps Distance Matrix.',
    ta: 'இது தோராயமான மதிப்பீடு. சமர்ப்பித்தவுடன், எங்கள் சர்வர் Google Maps Distance Matrix மூலம் சரியான சாலைத் தூரத்தை உறுதிசெய்யும்.',
  },
  when: { en: 'Date & time', ta: 'தேதி & நேரம்' },
  whenNote: { en: 'Not fixed yet? Mark it tentative and we will pencil it in.', ta: 'இன்னும் உறுதியாகவில்லையா? தற்காலிகம் எனக் குறியுங்கள்; நாங்கள் குறித்து வைக்கிறோம்.' },
  exact: { en: 'Exact date', ta: 'உறுதியான தேதி' },
  tentative: { en: 'Tentative', ta: 'தற்காலிகம்' },
  date: { en: 'Event date', ta: 'நிகழ்வுத் தேதி' },
  approxDate: { en: 'Approximate date', ta: 'தோராயமான தேதி' },
  time: { en: 'Start time', ta: 'தொடக்க நேரம்' },
  timeHint: { en: 'Muhurtham or first ritual', ta: 'முகூர்த்தம் அல்லது முதல் சடங்கு' },
  tentativeHint: {
    en: 'We will hold the month and confirm the exact date with you on our call.',
    ta: 'அந்த மாதத்தை உங்களுக்காக ஒதுக்கி வைத்து, அழைப்பின்போது சரியான தேதியை உறுதிசெய்வோம்.',
  },
  daysAway: { en: 'days away', ta: 'நாட்கள் உள்ளன' },
  today: { en: 'Today', ta: 'இன்று' },
  next: { en: 'Continue to package', ta: 'தொகுப்புக்குத் தொடர்க' },
  needAddress: { en: 'Add the venue address', ta: 'இட முகவரியைச் சேர்க்கவும்' },
  needDate: { en: 'pick a date', ta: 'தேதியைத் தேர்ந்தெடுக்கவும்' },
  and: { en: ' and ', ta: ', ' },
  toContinue: { en: ' to continue', ta: ' — பின் தொடரலாம்' },
}

export default function Venue() {
  return (
    <StepGuard step={2}>
      <VenueStep />
    </StepGuard>
  )
}

function VenueStep() {
  const lang = useLang()
  const t = useT(copy)
  useTitle({ en: 'Book · Venue & date', ta: 'பதிவு · இடம் & தேதி' })
  const draft = useStore(s => s.draft)
  const updateDraft = useStore(s => s.updateDraft)
  const navigate = useNavigate()

  const missing: string[] = []
  if (!draft.venueAddress.trim()) missing.push(t.needAddress)
  if (!draft.date) missing.push(missing.length ? t.needDate : t.needDate.charAt(0).toUpperCase() + t.needDate.slice(1))
  const hint = missing.length ? missing.join(t.and) + t.toContinue : undefined

  return (
    <div>
      <StepHeader step={2} title={t.title} lead={t.lead} />

      <SubHeading index="i." title={t.venueType} />
      <VenueStage value={draft.venueType} onChange={v => updateDraft({ venueType: v })} />
      {lang === 'ta' && <TempleBorder className="mt-4 opacity-70" />}

      <Ornament className="my-10 md:my-14" />

      <SubHeading index="ii." title={t.address} note={t.addressNote} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Reveal className="space-y-5">
          <div>
            <Field
              label={`${draft.venueType === 'home' ? t.homeName : t.mahalName} · ${t.optional}`}
              value={draft.venueName}
              onChange={v => updateDraft({ venueName: v })}
              placeholder={draft.venueType === 'home' ? t.homeNamePh : t.mahalNamePh}
              icon={draft.venueType === 'home' ? 'home' : 'building'}
              maxLength={80}
            />
          </div>
          <Field label={t.fullAddress} value={draft.venueAddress} onChange={v => updateDraft({ venueAddress: v })} placeholder={t.addressPh} icon="mapPin" rows={3} required maxLength={240} />
        </Reveal>
        <Reveal delay={0.1}>
          <DistanceMeter />
        </Reveal>
      </div>

      <Ornament className="my-10 md:my-14" />

      <SubHeading index="iii." title={t.when} note={t.whenNote} />
      <DateTime />

      <StepNav back="/book/event" onNext={() => navigate('/book/package')} nextLabel={t.next} disabled={!!hint} hint={hint} />
    </div>
  )
}

// ─── Venue stage: glass toggle over a crossfading photo ──────────────────────

function VenueStage({ value, onChange }: { value: VenueType; onChange: (v: VenueType) => void }) {
  const lang = useLang()
  const t = useT(copy)
  const id = useId()
  const venue = VENUES.find(v => v.key === value) ?? VENUES[0]
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const onKey = (e: KeyboardEvent) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return
    e.preventDefault()
    const next = value === 'home' ? 'mahal' : 'home'
    onChange(next)
    refs.current[VENUES.findIndex(v => v.key === next)]?.focus()
  }

  return (
    <Reveal>
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[26px] bg-ink shadow-soft sm:aspect-[16/10] md:rounded-[32px]">
        {VENUES.map(v => (
          <motion.div
            key={v.key}
            className="absolute inset-0"
            initial={false}
            animate={{ opacity: v.key === value ? 1 : 0, scale: v.key === value ? 1 : 1.08 }}
            transition={{ duration: 1.1, ease: EASE }}
            aria-hidden={v.key !== value}
          >
            <LangImg pair={v.img} w={1200} sizes="(min-width: 1024px) 720px, 100vw" className="h-full w-full" />
          </motion.div>
        ))}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/5 to-ink/25" />

        {/* Info card */}
        <motion.div
          key={value + lang}
          initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.7, ease: EASE }}
          className="glass absolute left-3 top-3 max-w-[calc(100%-24px)] rounded-[22px] p-4 sm:left-5 sm:top-5 sm:max-w-[320px] sm:p-5"
        >
          {lang === 'ta' && <KolamCorner className="pointer-events-none absolute -right-1 -top-1 rotate-90 opacity-60" />}
          <p className="flex items-center gap-2 text-[11px] font-medium text-ink/55">
            <Icon name="users" size={13} className="text-ruby" />
            {value === 'home' ? t.homeCrowd : t.mahalCrowd}
          </p>
          <p className="t-3 mt-1.5 text-ink [overflow-wrap:anywhere]">{venue.name[lang]}</p>
          <p className="mt-1 text-[13px] leading-snug text-ink/60">{venue.note[lang]}</p>
          <p className="mt-3 text-[12.5px] font-semibold tabular-nums text-ruby">{venue.add ? `+${formatINR(venue.add)} · ${t.lightingKit}` : t.noSurcharge}</p>
        </motion.div>

        {/* Glass toggle */}
        <div className="absolute inset-x-0 bottom-4 flex justify-center px-3 sm:bottom-6">
          <div role="radiogroup" aria-label={t.venueTypeLabel} onKeyDown={onKey} className="glass-dark relative flex w-full max-w-[360px] rounded-full p-1.5">
            {VENUES.map((v, i) => {
              const active = v.key === value
              return (
                <button
                  key={v.key}
                  ref={el => {
                    refs.current[i] = el
                  }}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  tabIndex={active ? 0 : -1}
                  onClick={() => onChange(v.key)}
                  className={`relative z-10 flex h-12 flex-1 items-center justify-center gap-2 rounded-full px-3 text-[14px] font-medium transition-colors duration-300 cursor-pointer ${active ? 'text-ink' : 'text-white/75 hover:text-white'}`}
                >
                  {active && (
                    <motion.span
                      layoutId={`venue-thumb-${id}`}
                      className="absolute inset-0 -z-10 rounded-full bg-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,1),0_6px_20px_-6px_rgba(0,0,0,0.5)] backdrop-blur-xl"
                      transition={{ type: 'spring', stiffness: 400, damping: 36 }}
                    />
                  )}
                  <Icon name={v.key === 'home' ? 'home' : 'building'} size={17} className={active ? 'text-ruby' : ''} />
                  <span className="truncate">{v.name[lang]}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </Reveal>
  )
}

// ─── Distance meter ──────────────────────────────────────────────────────────

const SCALE_KM = 80

function DistanceMeter() {
  const lang = useLang()
  const t = useT(copy)
  const reduce = useReducedMotion()
  const address = useStore(s => s.draft.venueAddress)
  const district = useStore(s => s.draft.district)
  const km = useStore(s => s.draft.distanceKm)
  const updateDraft = useStore(s => s.updateDraft)
  const [calculating, setCalculating] = useState(false)
  const last = useRef(address)

  // Debounced stand-in for the backend Distance Matrix call.
  useEffect(() => {
    if (address === last.current && (km > 0 || !address.trim())) return
    last.current = address
    if (!address.trim()) {
      updateDraft({ distanceKm: 0 })
      setCalculating(false)
      return
    }
    setCalculating(true)
    const timer = window.setTimeout(() => {
      updateDraft({ distanceKm: estimateDistanceKm(address, district) })
      setCalculating(false)
    }, 650)
    return () => window.clearTimeout(timer)
  }, [address, district, km, updateDraft])

  const has = !!address.trim() && km > 0
  const far = km > TRAVEL_FREE_KM
  const surcharge = far ? Math.round(((km - TRAVEL_FREE_KM) * TRAVEL_PER_KM) / 100) * 100 : 0
  const pos = Math.min(1, km / SCALE_KM)
  const freePos = TRAVEL_FREE_KM / SCALE_KM

  const mv = useMotionValue(km)
  const kmText = useTransform(mv, v => Math.round(v).toString())
  useEffect(() => {
    if (reduce) return mv.set(km)
    const c = animate(mv, km, { duration: 1, ease: EASE })
    return () => c.stop()
  }, [km, mv, reduce])

  return (
    <div className="glass-ruby-tint relative h-full overflow-hidden rounded-[26px] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium leading-snug text-ink/70">
          {t.distTitle}
          {district && <span className="block text-ink/45">{districtName(district, lang)}</span>}
        </p>
        <Badge tone="white">{t.estimate}</Badge>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        {calculating ? (
          <span className="skeleton inline-block h-[2.9rem] w-24 rounded-xl" aria-label={t.calculating} />
        ) : (
          <motion.span className="font-display text-[3rem] font-semibold leading-none tabular-nums text-ink">{has ? kmText : '—'}</motion.span>
        )}
        <span className="text-ink/50">{t.km}</span>
      </div>

      {/* Meter */}
      <div className="relative mt-7" aria-hidden="true">
        <div className="relative h-2.5 overflow-hidden rounded-full bg-white/80">
          <div className="absolute inset-y-0 left-0 bg-ink/[0.07]" style={{ width: `${freePos * 100}%` }} />
          <motion.div className="absolute inset-y-0 left-0 rounded-full bg-ink" initial={false} animate={{ width: `${(has ? Math.min(pos, freePos) : 0) * 100}%` }} transition={{ duration: 0.9, ease: EASE }} />
          <motion.div
            className="absolute inset-y-0 rounded-r-full bg-gradient-to-r from-ruby to-ruby-bright"
            style={{ left: `${freePos * 100}%` }}
            initial={false}
            animate={{ width: `${(has && far ? pos - freePos : 0) * 100}%` }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.15 }}
          />
        </div>
        {/* 20 km marker */}
        <div className="absolute -top-1.5 h-5 w-px bg-ruby" style={{ left: `${freePos * 100}%` }} />
        {/* Venue pin */}
        <motion.div className="absolute -top-[26px] -translate-x-1/2" initial={false} animate={{ left: `${(has ? pos : 0) * 100}%`, opacity: has ? 1 : 0 }} transition={{ duration: 0.9, ease: EASE }}>
          <span className={`flex h-5 w-5 items-center justify-center rounded-full text-white shadow-md ${far ? 'bg-ruby' : 'bg-ink'}`}>
            <Icon name="mapPin" size={11} strokeWidth={2.2} />
          </span>
        </motion.div>
        <div className="relative mt-2 h-4 text-[10.5px] font-medium tabular-nums text-ink/45">
          <span className="absolute left-0">0</span>
          <span className="absolute -translate-x-1/2 whitespace-nowrap text-ruby" style={{ left: `${freePos * 100}%` }}>
            {t.freeZone}
          </span>
          <span className="absolute right-0">{SCALE_KM}+</span>
        </div>
      </div>

      <div className="mt-5 min-h-[2.6rem] text-[13px] leading-snug">
        {!address.trim() ? (
          <p className="text-ink/50">{t.enterAddress}</p>
        ) : calculating ? (
          <p className="text-ink/50">{t.calculating}</p>
        ) : far ? (
          <p className="text-ink/75">
            <span className="font-semibold tabular-nums text-ruby">+{formatINR(surcharge)}</span> · {km - TRAVEL_FREE_KM} {t.km} {t.beyond} ({t.perKm})
          </p>
        ) : (
          <p className="flex items-start gap-1.5 font-medium text-ink/75">
            <Icon name="check" size={15} className="mt-0.5 text-ruby" strokeWidth={2.2} />
            {t.within}
          </p>
        )}
      </div>
      <p className="mt-4 border-t border-ruby/10 pt-3 text-[11px] leading-relaxed text-ink/45">{t.distNote}</p>
    </div>
  )
}

// ─── Date & time ─────────────────────────────────────────────────────────────

const inputCls =
  'h-[52px] w-full min-w-0 rounded-2xl border border-ink/10 bg-white/80 pl-11 pr-4 text-base text-ink [&::-webkit-date-and-time-value]:text-left md:text-[15px] outline-none transition-all duration-200 focus:border-ruby focus:bg-white focus:ring-4 focus:ring-ruby/10 [color-scheme:light]'

function DateTime() {
  const lang = useLang()
  const t = useT(copy)
  const draft = useStore(s => s.draft)
  const updateDraft = useStore(s => s.updateDraft)
  const dateId = useId()
  const timeId = useId()
  const min = todayISO()
  const tentative = draft.dateCertainty === 'tentative'
  const days = draft.date ? Math.round((new Date(draft.date + 'T00:00:00').getTime() - new Date(min + 'T00:00:00').getTime()) / 864e5) : null

  return (
    <Reveal>
      <div className="rounded-[28px] border hairline bg-white/70 p-5 shadow-soft sm:p-7">
        <Segmented
          value={draft.dateCertainty}
          onChange={v => updateDraft({ dateCertainty: v })}
          options={[
            { value: 'exact', label: t.exact },
            { value: 'tentative', label: t.tentative },
          ]}
        />

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor={dateId} className="t-label mb-2 flex items-center gap-1 text-ink/55">
              {tentative ? t.approxDate : t.date}
              <span className="text-ruby">*</span>
            </label>
            <div className="relative">
              <Icon name="calendar" size={17} className="pointer-events-none absolute left-4 top-[17px] text-ink/35" />
              <input
                id={dateId}
                type="date"
                min={min}
                value={draft.date}
                required
                onChange={e => {
                  const v = e.target.value
                  updateDraft({ date: v && v < min ? min : v })
                }}
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label htmlFor={timeId} className="t-label mb-2 flex items-center gap-1 text-ink/55">
              {t.time}
            </label>
            <div className="relative">
              <Icon name="clock" size={17} className="pointer-events-none absolute left-4 top-[17px] text-ink/35" />
              <input id={timeId} type="time" value={draft.time} onChange={e => updateDraft({ time: e.target.value })} className={inputCls} />
            </div>
            <p className="mt-1.5 text-xs text-ink/45">{t.timeHint}</p>
          </div>
        </div>

        {draft.date && (
          <motion.div
            key={draft.date + draft.dateCertainty + lang}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-ink/[0.04] px-4 py-3.5"
          >
            <Icon name="calendar" size={18} className="text-ruby" />
            <p className="font-display text-[1.1rem] font-semibold text-ink md:text-[1.2rem]">
              {formatDate(draft.date, lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            {days !== null && days >= 0 && (
              <span className="text-[13px] text-ink/50">{days === 0 ? t.today : `${days} ${t.daysAway}`}</span>
            )}
          </motion.div>
        )}
        {tentative && <p className="mt-4 flex items-start gap-2 text-[13px] leading-relaxed text-ink/55"><Icon name="info" size={15} className="mt-0.5 text-ruby" />{t.tentativeHint}</p>}
      </div>
    </Reveal>
  )
}
