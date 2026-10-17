import { useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Icon } from '../../components/Icon'
import { Stagger, StaggerItem, Reveal, EASE } from '../../components/motion'
import { KolamCorner, Ornament } from '../../components/tamil'
import { formatINR, useLang, useT } from '../../lib/i18n'
import { useTitle } from '../../lib/ui'
import { usePrices, useStore } from '../../lib/store'
import { eventByKey } from '../../lib/data'
import { TIER_META, cartEntries, tierCart, tierPitch, type FixedTier } from '../../lib/catalogue'
import { CartBuilder } from '../../components/CartBuilder'
import { tierPrice } from '../../lib/pricing'
import { StepGuard, StepHeader, StepNav, SubHeading } from './shared'
import { VoiceAssistant } from './VoiceAssistant'

const copy = {
  title: { en: 'Build your package', ta: 'உங்கள் தொகுப்பை அமையுங்கள்' },
  lead: {
    en: 'Start from one of our three packages, then add or remove anything — the quote updates as you go. Or simply tell our assistant what you want, in Tamil or English.',
    ta: 'எங்கள் மூன்று தொகுப்புகளில் ஒன்றிலிருந்து தொடங்கி, எதையும் சேர்க்கலாம் நீக்கலாம் — மதிப்பீடு உடனே மாறும். அல்லது தமிழிலோ ஆங்கிலத்திலோ எங்கள் உதவியாளரிடம் சொல்லுங்கள்.',
  },
  packages: { en: 'Choose a package', ta: 'தொகுப்பைத் தேர்ந்தெடுங்கள்' },
  packagesNote: { en: 'Each one is a ready-made cart. Pick the closest, then fine-tune below.', ta: 'ஒவ்வொன்றும் தயாரான பட்டியல். நெருங்கியதைத் தேர்ந்து, கீழே மாற்றுங்கள்.' },
  popular: { en: 'Most loved', ta: 'அதிகம் விரும்பப்படுவது' },
  perSession: { en: 'for one session', ta: 'ஒரு அமர்வுக்கு' },
  selected: { en: 'Selected', ta: 'தேர்வு செய்யப்பட்டது' },
  customised: { en: 'Customised', ta: 'தனிப்பயனாக்கப்பட்டது' },
  customNote: { en: 'You have changed items, so this is now a custom package. Tap a package to start over from it.', ta: 'பொருட்களை மாற்றியதால் இது இப்போது தனிப்பயன் தொகுப்பு. மீண்டும் தொடங்க ஒரு தொகுப்பைத் தொடவும்.' },
  voice: { en: 'Or just say it', ta: 'அல்லது சொன்னாலே போதும்' },
  voiceNote: {
    en: 'Try “add drone and two frames” or “இரண்டு அமர்வு, மொத்தம் எவ்வளவு?” — the cart updates as you speak.',
    ta: '“ட்ரோனும் இரண்டு பிரேமும் சேர்” அல்லது “இரண்டு அமர்வு, மொத்தம் எவ்வளவு?” என்று சொல்லிப் பாருங்கள் — பேசும்போதே பட்டியல் மாறும்.',
  },
  cart: { en: 'Fine-tune your cart', ta: 'உங்கள் பட்டியலை மாற்றுங்கள்' },
  cartNote: { en: 'Prices shown are what each change adds to your total.', ta: 'காட்டப்படும் விலை ஒவ்வொரு மாற்றமும் மொத்தத்தில் சேர்ப்பது.' },
  sessions: { en: 'Sessions', ta: 'அமர்வுகள்' },
  sessionsNote: { en: 'One session is about five hours. A morning muhurtham and an evening reception are two sessions.', ta: 'ஒரு அமர்வு சுமார் ஐந்து மணி. காலை முகூர்த்தமும் மாலை வரவேற்பும் இரண்டு அமர்வுகள்.' },
  session: { en: 'session', ta: 'அமர்வு' },
  sessionsPl: { en: 'sessions', ta: 'அமர்வுகள்' },
  crew: { en: 'Crew per session', ta: 'ஒரு அமர்வுக்கான குழு' },
  crewNote: { en: 'How many of each you would like on the day. Soft copies of every photo are always included.', ta: 'அன்று ஒவ்வொன்றிலும் எத்தனை பேர் வேண்டும். அனைத்துப் படங்களின் சாஃப்ட் காப்பி எப்போதும் அடங்கும்.' },
  crewSubtotal: { en: 'Crew subtotal', ta: 'குழு கூட்டுத்தொகை' },
  addons: { en: 'Add-ons for the day', ta: 'விழா நாள் கூடுதல்கள்' },
  addonsNote: { en: 'Optional. Toggle any on or off.', ta: 'விருப்பத்திற்கு ஏற்ப. இயக்கலாம் அல்லது நிறுத்தலாம்.' },
  album: { en: 'Album', ta: 'ஆல்பம்' },
  albumNote: { en: 'One hard-copy album, by sheet count — or choose soft copies only.', ta: 'தாள் எண்ணிக்கைப்படி ஒரு ஆல்பம் — அல்லது சாஃப்ட் காப்பி மட்டும்.' },
  softOnly: { en: 'Soft copies only', ta: 'சாஃப்ட் காப்பி மட்டும்' },
  softOnlyNote: { en: 'No printed album', ta: 'அச்சிட்ட ஆல்பம் இல்லை' },
  sheets: { en: 'sheets', ta: 'தாள்கள்' },
  frames: { en: 'Frames & prints', ta: 'பிரேம்கள் & அச்சுகள்' },
  framesNote: { en: 'Any quantity. Premium frames have an acrylic or glass finish.', ta: 'எத்தனை வேண்டுமானாலும். பிரீமியம் பிரேம்கள் அக்ரிலிக் / கண்ணாடி.' },
  special: { en: 'Special shoots', ta: 'சிறப்புப் படப்பிடிப்புகள்' },
  specialNote: { en: 'Separate half-day sessions before or after the event.', ta: 'நிகழ்வுக்கு முன்னோ பின்னோ தனி அரை நாள் அமர்வுகள்.' },
  included: { en: 'Included with your booking', ta: 'உங்கள் பதிவில் அடங்கியவை' },
  free: { en: 'Included', ta: 'அடங்கும்' },
  pending: { en: 'Price to be confirmed', ta: 'விலை உறுதி செய்யப்பட வேண்டும்' },
  each: { en: 'each', ta: 'ஒன்றுக்கு' },
  next: { en: 'Continue to your details', ta: 'உங்கள் விவரங்களுக்குத் தொடர்க' },
  needCrew: { en: 'Add at least one crew member or shoot to continue', ta: 'தொடர குறைந்தது ஒரு கலைஞர் அல்லது படப்பிடிப்பைச் சேர்க்கவும்' },
  less: { en: 'Fewer', ta: 'குறை' },
  more: { en: 'More', ta: 'கூட்டு' },
}

export default function Package() {
  return (
    <StepGuard step={3}>
      <PackageStep />
    </StepGuard>
  )
}

const TIERS: FixedTier[] = ['basic', 'standard', 'premium']

function PackageStep() {
  const lang = useLang()
  const t = useT(copy)
  useTitle({ en: 'Book · Package', ta: 'பதிவு · தொகுப்பு' })
  const eventType = useStore(s => s.draft.eventType)
  const cart = useStore(s => s.draft.cart)
  const setTier = useStore(s => s.setTier)
  const updateDraft = useStore(s => s.updateDraft)
  const prices = usePrices()
  const navigate = useNavigate()
  const ev = eventByKey(eventType)
  if (!ev) return null

  const hasBase = cartEntries(cart).some(e => e.item.section === 'crew' || e.item.section === 'special')

  return (
    <div>
      <StepHeader step={3} title={t.title} lead={t.lead} />

      <SubHeading index="i." title={t.packages} note={t.packagesNote} />
      <Stagger className="grid gap-4 md:grid-cols-3" gap={0.08}>
        {TIERS.map(tier => {
          const meta = TIER_META[tier]
          const active = cart.tier === tier
          const preset = tierCart(ev.tiers, tier)
          const price = tierPrice(ev.key, tier, prices)
          const contents = cartEntries(preset).filter(e => e.item.unit !== 'included')
          return (
            <StaggerItem key={tier} className="h-full">
              <button
                type="button"
                aria-pressed={active}
                onClick={() => setTier(tier)}
                className={`group relative isolate flex h-full w-full flex-col rounded-[26px] border p-5 text-left transition-[border-color,transform,box-shadow] duration-500 cursor-pointer active:scale-[0.99] sm:p-6 ${
                  active ? 'border-ruby shadow-ruby' : 'border-ink/[0.08] bg-white/70 shadow-soft hover:-translate-y-1 hover:border-ink/20'
                }`}
              >
                {active && (
                  <motion.span layoutId="pkg-active" className="absolute inset-0 -z-10 rounded-[26px] bg-gradient-to-b from-ruby-soft to-white" transition={{ type: 'spring', stiffness: 360, damping: 34 }} />
                )}
                {lang === 'ta' && active && <KolamCorner className="pointer-events-none absolute bottom-0 right-0 rotate-180 opacity-70" />}
                <div className="flex min-h-7 items-start justify-between gap-2">
                  {meta.popular ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-ruby px-2.5 py-1 text-[10.5px] font-semibold tracking-wide text-white">
                      <Icon name="star" size={11} strokeWidth={2.2} />
                      {t.popular}
                    </span>
                  ) : (
                    <span />
                  )}
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${active ? 'border-ruby bg-ruby text-white' : 'border-ink/15 bg-white text-transparent'}`} aria-hidden="true">
                    <Icon name="check" size={14} strokeWidth={2.4} />
                  </span>
                </div>
                <p className="t-3 mt-3 text-ink md:mt-4">{meta.name[lang]}</p>
                <p className="mt-1 font-medium tabular-nums text-ruby">
                  {formatINR(price)} <span className="text-[12px] font-normal text-ink/45">{t.perSession}</span>
                </p>
                <p className="mt-3 text-[13px] leading-snug text-ink/60">{tierPitch(ev.tiers, tier)[lang]}</p>
                <ul className="mt-4 space-y-2.5 border-t hairline pt-4 md:mt-5 md:pt-5">
                  {contents.map(({ item, qty }) => (
                    <li key={item.id} className="flex items-start gap-2.5 text-[13px] leading-snug text-ink/75">
                      <Icon name="check" size={14} strokeWidth={2.2} className="mt-0.5 text-ruby" />
                      {item.name[lang]}
                      {qty > 1 && <span className="text-ink/45">× {qty}</span>}
                    </li>
                  ))}
                </ul>
              </button>
            </StaggerItem>
          )
        })}
      </Stagger>
      <AnimatePresence initial={false}>
        {cart.tier === 'custom' && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="mt-4 flex items-start gap-2 overflow-hidden text-[13px] leading-snug text-ink/60"
          >
            <Icon name="edit" size={14} className="mt-0.5 shrink-0 text-ruby" />
            <span>
              <span className="font-semibold text-ruby">{t.customised} · </span>
              {t.customNote}
            </span>
          </motion.p>
        )}
      </AnimatePresence>

      <Ornament className="my-10 md:my-14" />

      <SubHeading index="ii." title={t.voice} note={t.voiceNote} />
      <Reveal>
        <VoiceAssistant />
      </Reveal>

      <Ornament className="my-10 md:my-14" />

      <SubHeading index="iii." title={t.cart} note={t.cartNote} />
      <CartBuilder cart={cart} shootItem={ev.tiers.shootItem} onChange={c => updateDraft({ cart: c })} />

      <StepNav back="/book/venue" onNext={() => navigate('/book/details')} nextLabel={t.next} disabled={!hasBase} hint={!hasBase ? t.needCrew : undefined} />
    </div>
  )
}
