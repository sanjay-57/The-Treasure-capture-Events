import { useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { Icon, type IconName } from '../../components/Icon'
import { Stagger, StaggerItem, Reveal } from '../../components/motion'
import { KolamCorner, Ornament } from '../../components/tamil'
import { formatINR, useLang, useT } from '../../lib/i18n'
import { useTitle } from '../../lib/ui'
import { useStore } from '../../lib/store'
import { ADDONS, PACKAGES, type AddonKey, type PackageKey } from '../../lib/data'
import { StepGuard, StepHeader, StepNav, SubHeading } from './shared'
import { VoiceAssistant } from './VoiceAssistant'

const copy = {
  title: { en: 'Build your package', ta: 'உங்கள் தொகுப்பை அமையுங்கள்' },
  lead: {
    en: 'Choose a package, add the extras you love — or simply tell our assistant what you want, in Tamil or English.',
    ta: 'ஒரு தொகுப்பைத் தேர்ந்தெடுத்து, விரும்பும் கூடுதல் சேவைகளைச் சேருங்கள் — அல்லது தமிழிலோ ஆங்கிலத்திலோ எங்கள் உதவியாளரிடம் சொல்லுங்கள்.',
  },
  packages: { en: 'Package', ta: 'தொகுப்பு' },
  popular: { en: 'Most loved', ta: 'அதிகம் விரும்பப்படுவது' },
  base: { en: 'Included', ta: 'அடங்கியது' },
  selected: { en: 'Selected', ta: 'தேர்வு செய்யப்பட்டது' },
  choose: { en: 'Choose', ta: 'தேர்ந்தெடு' },
  voice: { en: 'Or just say it', ta: 'அல்லது சொன்னாலே போதும்' },
  voiceNote: {
    en: 'Try “add drone and a same-day reel” or “எட்டு மணி நேரம், மொத்தம் எவ்வளவு?” — the cart updates as you speak.',
    ta: '“ட்ரோனும் அன்றே எடிட் ரீலும் சேர்” அல்லது “8 மணி நேரம், மொத்தம் எவ்வளவு?” என்று சொல்லிப் பாருங்கள் — பேசும்போதே பட்டியல் மாறும்.',
  },
  addons: { en: 'Extras', ta: 'கூடுதல் சேவைகள்' },
  addonsNote: { en: 'Optional. Toggle any on or off — the quote updates instantly.', ta: 'விருப்பத்திற்கு ஏற்ப. இயக்கலாம் அல்லது நிறுத்தலாம் — மதிப்பீடு உடனே மாறும்.' },
  inHeirloom: { en: 'Included in Heirloom', ta: 'பரம்பரைப் பொக்கிஷத்தில் அடங்கும்' },
  next: { en: 'Continue to your details', ta: 'உங்கள் விவரங்களுக்குத் தொடர்க' },
}

const ADDON_ICON: Record<AddonKey, IconName> = {
  drone: 'drone',
  ledwall: 'maximize',
  sameday: 'film',
  extraalbum: 'book',
  preshoot: 'camera',
  booth: 'image',
}

export default function Package() {
  return (
    <StepGuard step={3}>
      <PackageStep />
    </StepGuard>
  )
}

function PackageStep() {
  const lang = useLang()
  const t = useT(copy)
  useTitle({ en: 'Book · Package', ta: 'பதிவு · தொகுப்பு' })
  const packageId = useStore(s => s.draft.packageId)
  const addons = useStore(s => s.draft.addons)
  const updateDraft = useStore(s => s.updateDraft)
  const navigate = useNavigate()

  const choosePackage = (key: PackageKey) =>
    updateDraft({ packageId: key, addons: key === 'heirloom' ? addons.filter(a => a !== 'drone') : addons })

  const toggleAddon = (key: AddonKey) => updateDraft({ addons: addons.includes(key) ? addons.filter(a => a !== key) : [...addons, key] })

  return (
    <div>
      <StepHeader step={3} title={t.title} lead={t.lead} />

      <SubHeading index="i." title={t.packages} />
      <Stagger className="grid gap-4 md:grid-cols-3" gap={0.08}>
        {PACKAGES.map(p => {
          const active = packageId === p.key
          return (
            <StaggerItem key={p.key} className="h-full">
              <button
                type="button"
                aria-pressed={active}
                onClick={() => choosePackage(p.key)}
                className={`group relative isolate flex h-full w-full flex-col rounded-[26px] border p-5 text-left transition-[border-color,transform,box-shadow] duration-500 cursor-pointer active:scale-[0.99] sm:p-6 ${
                  active ? 'border-ruby shadow-ruby' : 'border-ink/[0.08] bg-white/70 shadow-soft hover:-translate-y-1 hover:border-ink/20'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="pkg-active"
                    className="absolute inset-0 -z-10 rounded-[26px] bg-gradient-to-b from-ruby-soft to-white"
                    transition={{ type: 'spring', stiffness: 360, damping: 34 }}
                  />
                )}
                {lang === 'ta' && active && <KolamCorner className="pointer-events-none absolute bottom-0 right-0 rotate-180 opacity-70" />}
                <div className="flex min-h-7 items-start justify-between gap-2">
                  {p.popular ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-ruby px-2.5 py-1 text-[10.5px] font-semibold tracking-wide text-white">
                      <Icon name="star" size={11} strokeWidth={2.2} />
                      {t.popular}
                    </span>
                  ) : (
                    <span />
                  )}
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${active ? 'border-ruby bg-ruby text-white' : 'border-ink/15 bg-white text-transparent'}`}
                    aria-hidden="true"
                  >
                    <Icon name="check" size={14} strokeWidth={2.4} />
                  </span>
                </div>
                <p className="t-3 mt-3 text-ink md:mt-4">{p.name[lang]}</p>
                <p className="mt-1 font-medium tabular-nums text-ruby">{p.add ? `+${formatINR(p.add)}` : t.base}</p>
                <p className="mt-3 text-[13px] leading-snug text-ink/60">{p.pitch[lang]}</p>
                <ul className="mt-4 space-y-2.5 border-t hairline pt-4 md:mt-5 md:pt-5">
                  {p.includes.map(inc => (
                    <li key={inc.en} className="flex items-start gap-2.5 text-[13px] leading-snug text-ink/75">
                      <Icon name="check" size={14} strokeWidth={2.2} className="mt-0.5 text-ruby" />
                      {inc[lang]}
                    </li>
                  ))}
                </ul>
              </button>
            </StaggerItem>
          )
        })}
      </Stagger>

      <Ornament className="my-10 md:my-14" />

      <SubHeading index="ii." title={t.voice} note={t.voiceNote} />
      <Reveal>
        <VoiceAssistant />
      </Reveal>

      <Ornament className="my-10 md:my-14" />

      <SubHeading index="iii." title={t.addons} note={t.addonsNote} />
      <Stagger className="grid gap-3 sm:grid-cols-2" gap={0.05}>
        {ADDONS.map(a => {
          const included = a.key === 'drone' && packageId === 'heirloom'
          const on = included || addons.includes(a.key)
          return (
            <StaggerItem key={a.key}>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                disabled={included}
                onClick={() => toggleAddon(a.key)}
                className={`group flex w-full items-center gap-3.5 rounded-[22px] md:gap-4 border p-4 text-left transition-all duration-300 cursor-pointer disabled:cursor-default ${
                  on ? 'border-ruby/40 bg-ruby-soft/60' : 'border-ink/[0.08] bg-white/70 hover:border-ink/20 hover:bg-white'
                }`}
              >
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-colors duration-300 ${on ? 'bg-ruby text-white' : 'bg-ink/[0.05] text-ink/60'}`}>
                  <Icon name={ADDON_ICON[a.key]} size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14.5px] font-medium leading-snug text-ink">{a.name[lang]}</span>
                  <span className="mt-0.5 block text-[12px] leading-snug text-ink/50">{included ? t.inHeirloom : a.note[lang]}</span>
                  <span className={`mt-1 block text-[12.5px] font-semibold tabular-nums ${on ? 'text-ruby' : 'text-ink/70'}`}>{included ? t.base : `+${formatINR(a.price)}`}</span>
                </span>
                <span className={`relative flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors duration-300 ${on ? 'justify-end bg-ruby' : 'justify-start bg-ink/15'} ${included ? 'opacity-50' : ''}`} aria-hidden="true">
                  <motion.span layout transition={{ type: 'spring', stiffness: 520, damping: 34 }} className="block h-6 w-6 rounded-full bg-white shadow-[0_2px_6px_rgba(10,10,11,0.25)]" />
                </span>
              </button>
            </StaggerItem>
          )
        })}
      </Stagger>

      <StepNav back="/book/venue" onNext={() => navigate('/book/details')} nextLabel={t.next} />
    </div>
  )
}

