import { useState } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { Img } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { Stagger, StaggerItem, Reveal, EASE } from '../../components/motion'
import { Ornament } from '../../components/tamil'
import { useLang, useT } from '../../lib/i18n'
import { useTitle } from '../../lib/ui'
import { useStore } from '../../lib/store'
import { DISTRICTS, type DistrictKey } from '../../lib/data'
import { StepHeader } from './shared'

const copy = {
  title: { en: 'Where is the celebration?', ta: 'விழா எங்கே நடைபெறுகிறது?' },
  lead: {
    en: 'We shoot across eight districts of Tamil Nadu, each with a local team. Choose yours to unlock accurate travel and pricing.',
    ta: 'தமிழ்நாட்டின் எட்டு மாவட்டங்களில், ஒவ்வொன்றிலும் உள்ளூர்க் குழுவுடன் படம்பிடிக்கிறோம். சரியான பயண, கட்டண விவரத்திற்கு உங்கள் மாவட்டத்தைத் தேர்ந்தெடுங்கள்.',
  },
  head: { en: 'Head studio', ta: 'தலைமை ஸ்டுடியோ' },
  selected: { en: 'Selected', ta: 'தேர்வு' },
  elsewhere: { en: 'Celebrating elsewhere in Tamil Nadu?', ta: 'தமிழ்நாட்டின் வேறு இடத்தில் விழாவா?' },
  elsewhereNote: {
    en: 'Choose the nearest district — we travel statewide and only charge for distance beyond 20 km.',
    ta: 'அருகிலுள்ள மாவட்டத்தைத் தேர்ந்தெடுங்கள் — மாநிலம் முழுவதும் வருகிறோம்; 20 கி.மீ-க்கு மேல் உள்ள தூரத்திற்கு மட்டுமே கட்டணம்.',
  },
}

const listen = {
  en: 'Welcome to booking. First, choose the district where your celebration will be held. Tap a district card to continue. You will then pick the event, venue, date and package, and see your price update live. No payment is needed now.',
  ta: 'பதிவுக்கு வரவேற்கிறோம். முதலில், உங்கள் விழா நடைபெறும் மாவட்டத்தைத் தேர்ந்தெடுங்கள். தொடர, ஒரு மாவட்ட அட்டையைத் தொடுங்கள். பிறகு நிகழ்வு, இடம், தேதி, தொகுப்பு ஆகியவற்றைத் தேர்ந்தெடுக்கலாம்; விலை உடனுக்குடன் மாறுவதைக் காணலாம். இப்போது எந்தக் கட்டணமும் தேவையில்லை.',
}

export default function District() {
  const lang = useLang()
  const t = useT(copy)
  useTitle({ en: 'Book · Choose district', ta: 'பதிவு · மாவட்டம்' })
  const current = useStore(s => s.draft.district)
  const updateDraft = useStore(s => s.updateDraft)
  const navigate = useNavigate()
  const [picked, setPicked] = useState<DistrictKey | null>(null)

  const choose = (key: DistrictKey) => {
    if (picked) return
    setPicked(key)
    updateDraft({ district: key })
    // Let the selection ring land before the step transition.
    window.setTimeout(() => navigate('/book/event'), 260)
  }

  return (
    <div>
      <StepHeader step={0} title={t.title} lead={t.lead} listen={listen} />

      <Stagger className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4" gap={0.06}>
        {DISTRICTS.map((d, i) => {
          const active = (picked ?? current) === d.key
          return (
            <StaggerItem key={d.key}>
              <motion.button
                type="button"
                onClick={() => choose(d.key)}
                aria-pressed={active}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.4, ease: EASE }}
                className={`group relative block aspect-[3/4] w-full overflow-hidden rounded-[22px] text-left shadow-soft outline-offset-4 transition-shadow duration-500 cursor-pointer ${active ? 'ring-2 ring-ruby ring-offset-2 ring-offset-white' : ''}`}
              >
                <Img k={d.img} w={480} ratio={3 / 4} sizes="(min-width: 768px) 200px, 50vw" className="absolute inset-0 h-full w-full" imgClassName="transition-transform duration-[1.2s] ease-out group-hover:scale-[1.06]" priority={i < 4} />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
                {i === 0 && (
                  <span className="glass-ruby absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10.5px] font-semibold tracking-wide">{t.head}</span>
                )}
                <span
                  className={`absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full transition-all duration-500 ${active ? 'scale-100 bg-ruby text-white opacity-100' : 'scale-75 opacity-0'}`}
                  aria-hidden="true"
                >
                  <Icon name="check" size={15} strokeWidth={2.4} />
                </span>
                <div className="glass-dark absolute inset-x-2 bottom-2 rounded-[16px] px-3 py-2.5">
                  <p className="font-display text-[1.05rem] font-semibold leading-tight text-white [overflow-wrap:anywhere] md:text-[1.15rem]">{d.name[lang]}</p>
                  <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-white/65">{d.note[lang]}</p>
                </div>
              </motion.button>
            </StaggerItem>
          )
        })}
      </Stagger>

      {lang === 'ta' && <Ornament className="mt-10 md:mt-12" />}

      <Reveal delay={0.2}>
        <div className="mt-8 flex items-start gap-4 rounded-3xl border hairline bg-white/60 p-5 md:mt-10">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-ruby-soft text-ruby">
            <Icon name="mapPin" size={18} />
          </span>
          <div className="min-w-0">
            <p className="font-medium text-ink">{t.elsewhere}</p>
            <p className="mt-1 text-sm leading-relaxed text-ink/55">{t.elsewhereNote}</p>
          </div>
        </div>
      </Reveal>
    </div>
  )
}
