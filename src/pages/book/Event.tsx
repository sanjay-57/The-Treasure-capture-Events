import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useLenis } from 'lenis/react'
import { LangImg, ChoiceCard, Chip } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { Stagger, StaggerItem, Reveal, EASE } from '../../components/motion'
import { KolamCorner, Ornament } from '../../components/tamil'
import { formatINR, useLang, useT } from '../../lib/i18n'
import { useTitle } from '../../lib/ui'
import { useStore } from '../../lib/store'
import { CROWDS, EVENTS, eventByKey, type EventKey } from '../../lib/data'
import { MAX_HOURS, MIN_HOURS } from '../../lib/pricing'
import { StepGuard, StepHeader, StepNav, SubHeading } from './shared'

const copy = {
  title: { en: 'What are we celebrating?', ta: 'நாம் எதைக் கொண்டாடுகிறோம்?' },
  lead: {
    en: 'Pick the occasion, how long you would like us there, and roughly how many guests to expect.',
    ta: 'நிகழ்வு, நாங்கள் எவ்வளவு நேரம் இருக்க வேண்டும், எத்தனை விருந்தினர்கள் வருவார்கள் என்பதைத் தேர்ந்தெடுங்கள்.',
  },
  occasion: { en: 'The occasion', ta: 'நிகழ்வு' },
  from: { en: 'from', ta: 'தொடக்கம்' },
  duration: { en: 'Hours of coverage', ta: 'படப்பிடிப்பு நேரம்' },
  durationNote: {
    en: 'Every booking starts with 2 hours — and even the minimum includes unlimited, fully edited digital photos.',
    ta: 'ஒவ்வொரு பதிவும் 2 மணி நேரத்தில் தொடங்குகிறது — குறைந்தபட்ச நேரத்திலும் எல்லையற்ற, முழுமையாக எடிட் செய்த டிஜிட்டல் படங்கள் உண்டு.',
  },
  hours: { en: 'hours', ta: 'மணி நேரம்' },
  included: { en: 'First 2 hours included', ta: 'முதல் 2 மணி நேரம் அடங்கும்' },
  extra: { en: 'extended coverage', ta: 'கூடுதல் நேரம்' },
  unlimited: { en: 'Unlimited digital photos', ta: 'எல்லையற்ற டிஜிட்டல் படங்கள்' },
  pickFirst: { en: 'Choose an occasion to see hourly rates', ta: 'மணிநேரக் கட்டணத்தைக் காண நிகழ்வைத் தேர்ந்தெடுங்கள்' },
  slider: { en: 'Coverage duration in hours', ta: 'படப்பிடிப்பு நேரம் (மணி)' },
  crowd: { en: 'Crowd volume', ta: 'விருந்தினர் எண்ணிக்கை' },
  crowdNote: {
    en: 'Homes usually host under 50; mahals often 100 or more. Bigger crowds need more hands on cameras.',
    ta: 'வீடுகளில் பொதுவாக 50-க்கும் குறைவு; மண்டபங்களில் 100-க்கும் மேல். கூட்டம் பெரிதானால் கூடுதல் கலைஞர்கள் தேவை.',
  },
  guests: { en: 'guests', ta: 'பேர்' },
  inc: { en: 'Included', ta: 'அடங்கும்' },
  next: { en: 'Continue to venue', ta: 'இடத்திற்குத் தொடர்க' },
  needEvent: { en: 'Choose an occasion to continue', ta: 'தொடர ஒரு நிகழ்வைத் தேர்ந்தெடுங்கள்' },
}

const PRESETS: { h: number; label: { en: string; ta: string } }[] = [
  { h: 2, label: { en: 'Just the ritual', ta: 'சடங்கு மட்டும்' } },
  { h: 4, label: { en: 'Half day', ta: 'அரை நாள்' } },
  { h: 8, label: { en: 'Full day', ta: 'முழு நாள்' } },
  { h: 12, label: { en: 'Muhurtham to reception', ta: 'முகூர்த்தம் முதல் வரவேற்பு' } },
]

export default function Event() {
  return (
    <StepGuard step={1}>
      <EventStep />
    </StepGuard>
  )
}

function EventStep() {
  const lang = useLang()
  const t = useT(copy)
  useTitle({ en: 'Book · Event', ta: 'பதிவு · நிகழ்வு' })
  const draft = useStore(s => s.draft)
  const updateDraft = useStore(s => s.updateDraft)
  const navigate = useNavigate()
  const lenis = useLenis()
  const durationRef = useRef<HTMLDivElement>(null)
  const ev = eventByKey(draft.eventType)

  const pick = (key: EventKey) => {
    const first = !draft.eventType
    updateDraft({ eventType: key })
    if (first && durationRef.current) {
      window.setTimeout(() => {
        if (!durationRef.current) return
        if (lenis) lenis.scrollTo(durationRef.current, { offset: -140, duration: 1.2 })
        else durationRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 250)
    }
  }

  return (
    <div>
      <StepHeader step={1} title={t.title} lead={t.lead} />

      <SubHeading index="i." title={t.occasion} />
      <Stagger className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4" gap={0.05}>
        {EVENTS.map((e, i) => {
          const active = draft.eventType === e.key
          return (
            <StaggerItem key={e.key}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => pick(e.key)}
                className={`group relative flex h-full w-full flex-col overflow-hidden rounded-[22px] border bg-white/80 text-left transition-all duration-500 cursor-pointer active:scale-[0.985] ${
                  active ? 'border-ruby shadow-ruby' : 'border-ink/[0.08] shadow-soft hover:-translate-y-1 hover:border-ink/20'
                }`}
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <LangImg pair={e.img} w={480} ratio={4 / 3} sizes="(min-width: 768px) 200px, 50vw" className="absolute inset-0" imgClassName="transition-transform duration-[1.2s] ease-out group-hover:scale-[1.06]" priority={i < 4} />
                  <div className={`absolute inset-0 transition-colors duration-500 ${active ? 'bg-ruby/10' : 'bg-transparent'}`} />
                  <span
                    className={`absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full transition-all duration-500 ${active ? 'scale-100 bg-ruby text-white' : 'glass scale-90 text-transparent'}`}
                    aria-hidden="true"
                  >
                    <Icon name="check" size={15} strokeWidth={2.4} />
                  </span>
                </div>
                <div className="relative flex flex-1 flex-col p-3.5 sm:p-4">
                  {lang === 'ta' && active && <KolamCorner className="pointer-events-none absolute bottom-0 right-0 rotate-180 opacity-70" />}
                  <p className="font-display text-[1.05rem] font-semibold leading-tight text-ink [overflow-wrap:anywhere] md:text-[1.12rem]">{e.name[lang]}</p>
                  <p className="mt-1 hidden text-[12px] leading-snug text-ink/50 sm:block">{e.blurb[lang]}</p>
                  <p className="mt-auto pt-3 text-[12px] text-ink/45">
                    {t.from} <span className={`font-semibold tabular-nums ${active ? 'text-ruby' : 'text-ink/80'}`}>{formatINR(e.base)}</span>
                  </p>
                </div>
              </button>
            </StaggerItem>
          )
        })}
      </Stagger>

      <Ornament className="my-10 md:my-14" />

      <div ref={durationRef}>
        <SubHeading index="ii." title={t.duration} note={t.durationNote} />
        <DurationSlider />
      </div>

      <Ornament className="my-10 md:my-14" />

      <SubHeading index="iii." title={t.crowd} note={t.crowdNote} />
      <Stagger className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4" gap={0.06}>
        {CROWDS.map((c, i) => {
          const active = draft.crowd === c.key
          return (
            <StaggerItem key={c.key} className="h-full">
              <ChoiceCard active={active} onClick={() => updateDraft({ crowd: c.key })} className="h-full p-4 sm:p-5">
                <span className="flex gap-0.5 text-ruby" aria-hidden="true">
                  {Array.from({ length: i + 1 }, (_, k) => (
                    <Icon key={k} name="users" size={15} className={active ? '' : 'text-ink/35'} />
                  ))}
                </span>
                <p className="mt-4 font-display text-[1.1rem] font-semibold leading-tight [overflow-wrap:anywhere] md:text-[1.2rem]">{c.name[lang]}</p>
                <p className="mt-0.5 text-[13px] font-medium tabular-nums text-ink/70">
                  {c.range} {t.guests}
                </p>
                <p className="mt-2 text-[12px] leading-snug text-ink/45">{c.note[lang]}</p>
                <p className={`mt-3 text-[12.5px] font-semibold tabular-nums ${c.add ? 'text-ink' : 'text-ink/40'}`}>{c.add ? `+${formatINR(c.add)}` : t.inc}</p>
              </ChoiceCard>
            </StaggerItem>
          )
        })}
      </Stagger>

      <StepNav back="/book" onNext={() => navigate('/book/venue')} nextLabel={t.next} disabled={!ev} hint={!ev ? t.needEvent : undefined} />
    </div>
  )
}

/** Custom duration slider: a native range input (for keyboard + screen readers) under a drawn track. */
function DurationSlider() {
  const lang = useLang()
  const t = useT(copy)
  const hours = useStore(s => s.draft.durationHours)
  const eventType = useStore(s => s.draft.eventType)
  const updateDraft = useStore(s => s.updateDraft)
  const ev = eventByKey(eventType)
  const pct = (hours - MIN_HOURS) / (MAX_HOURS - MIN_HOURS)
  const extra = Math.max(0, hours - MIN_HOURS)
  const set = (h: number) => updateDraft({ durationHours: Math.min(MAX_HOURS, Math.max(MIN_HOURS, h)) })
  const [focus, setFocus] = useState(false)
  const ticks = Array.from({ length: MAX_HOURS - MIN_HOURS + 1 }, (_, i) => MIN_HOURS + i)

  return (
    <Reveal>
      <div className="rounded-[28px] border hairline bg-white/70 p-5 shadow-soft sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-baseline gap-2.5">
            <span className="relative inline-flex h-[3.4rem] min-w-[2.2ch] overflow-hidden font-display text-[3.4rem] font-semibold leading-none tabular-nums text-ink">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span key={hours} initial={{ y: '60%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '-60%', opacity: 0 }} transition={{ duration: 0.45, ease: EASE }}>
                  {hours}
                </motion.span>
              </AnimatePresence>
            </span>
            <span className="text-lg text-ink/55">{t.hours}</span>
          </div>
          <div className="w-full text-[13px] leading-relaxed sm:w-auto sm:text-right">
            <p className="flex items-center gap-1.5 font-medium text-ruby sm:justify-end">
              <Icon name="camera" size={14} />
              {t.unlimited}
            </p>
            {ev ? (
              <p className="text-ink/50">
                {t.included}
                {extra > 0 && (
                  <>
                    {' · '}
                    <span className="font-medium tabular-nums text-ink/80">+{formatINR(extra * ev.hourly)}</span> {t.extra}
                  </>
                )}
              </p>
            ) : (
              <p className="text-ink/40">{t.pickFirst}</p>
            )}
          </div>
        </div>

        <div className="relative mt-6 h-11 sm:mt-8 sm:h-10">
          {/* Track */}
          <div className="absolute inset-x-[14px] top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-ink/[0.08]">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-ruby-deep to-ruby" initial={false} animate={{ width: `${pct * 100}%` }} transition={{ type: 'spring', stiffness: 380, damping: 38 }} />
          </div>
          {/* Hour ticks */}
          <div className="pointer-events-none absolute inset-x-[14px] top-1/2 -translate-y-1/2" aria-hidden="true">
            {ticks.map(h => (
              <span
                key={h}
                className={`absolute top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors duration-300 ${h <= hours ? 'bg-white/80' : 'bg-ink/20'}`}
                style={{ left: `${((h - MIN_HOURS) / (MAX_HOURS - MIN_HOURS)) * 100}%` }}
              />
            ))}
          </div>
          <input
            type="range"
            min={MIN_HOURS}
            max={MAX_HOURS}
            step={1}
            value={hours}
            onChange={e => set(Number(e.target.value))}
            aria-label={t.slider}
            aria-valuetext={lang === 'ta' ? `${hours} மணி நேரம்` : `${hours} hours`}
            onFocus={e => setFocus(e.currentTarget.matches(':focus-visible'))}
            onBlur={() => setFocus(false)}
            className="absolute inset-0 z-10 h-full w-full cursor-grab appearance-none bg-transparent opacity-0 active:cursor-grabbing [&::-moz-range-thumb]:h-7 [&::-moz-range-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:appearance-none"
          />
          {/* Thumb */}
          <div className="pointer-events-none absolute inset-x-[14px] top-1/2" aria-hidden="true">
            <motion.div
              className={`absolute top-0 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_2px_6px_rgba(10,10,11,0.18),0_8px_24px_-6px_rgba(192,22,60,0.45)] ring-ruby/30 transition-[box-shadow] ${focus ? 'ring-4' : 'ring-0'}`}
              initial={false}
              animate={{ left: `${pct * 100}%` }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            >
              <span className="absolute inset-[9px] rounded-full bg-ruby" />
            </motion.div>
          </div>
        </div>
        <div className="relative mx-[14px] mt-1 h-4 text-[11px] tabular-nums text-ink/40" aria-hidden="true">
          {[2, 4, 6, 8, 10, 12, 14].map(h => (
            <span key={h} className="absolute -translate-x-1/2" style={{ left: `${((h - MIN_HOURS) / (MAX_HOURS - MIN_HOURS)) * 100}%` }}>
              {h}
            </span>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {PRESETS.map(p => (
            <Chip key={p.h} active={hours === p.h} onClick={() => set(p.h)} className="!h-10 !px-3.5 !text-[13px] md:!h-9">
              {p.label[lang]} · {p.h}
              {lang === 'ta' ? ' மணி' : ' h'}
            </Chip>
          ))}
        </div>
      </div>
    </Reveal>
  )
}
