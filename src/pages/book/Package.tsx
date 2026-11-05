import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useLenis } from 'lenis/react'
import { AnimatePresence, motion } from 'motion/react'
import { Icon } from '../../components/Icon'
import { Stagger, StaggerItem, Reveal, Sweep, Tilt, EASE } from '../../components/motion'
import { KolamCorner, Ornament } from '../../components/tamil'
import { formatINR, useLang, useT } from '../../lib/i18n'
import { useTitle, useUi } from '../../lib/ui'
import { usePrices, useStore } from '../../lib/store'
import { eventByKey } from '../../lib/data'
import { CATALOGUE_BY_ID, TIER_META, cartEntries, cartHours, presetName, tierCart, tierPreset, type FixedTier } from '../../lib/catalogue'
import { Button } from '../../components/ui'
import { CartBuilder } from '../../components/CartBuilder'
import { PackageAlbumNote } from '../../components/PackageAlbumNote'
import { computeQuote } from '../../lib/pricing'
import { StepGuard, StepHeader, StepNav, SubHeading } from './shared'
import { VoiceAssistant } from './VoiceAssistant'
import { VoiceNote } from './VoiceNote'

const copy = {
  title: { en: 'Build your package', ta: 'உங்கள் தொகுப்பை அமையுங்கள்' },
  lead: {
    en: 'Start from one of our three packages, then add or remove anything below. The quote updates as you go. Or simply tell our assistant what you want, in Tamil or English.',
    ta: 'எங்கள் மூன்று தொகுப்புகளில் ஒன்றிலிருந்து தொடங்கி, கீழே எதையும் சேர்க்கலாம் நீக்கலாம். விலை உடனே மாறும். அல்லது தமிழிலோ ஆங்கிலத்திலோ எங்கள் உதவியாளரிடம் சொல்லுங்கள்.',
  },
  packages: { en: 'Choose a package', ta: 'தொகுப்பைத் தேர்ந்தெடுங்கள்' },
  packagesNote: { en: 'Pick one and everything in it lights up in gold below. Tap it again to start from an empty cart.', ta: 'ஒன்றைத் தேர்ந்தால் அதில் உள்ளவை கீழே தங்க நிறத்தில் தெரியும். காலியான பட்டியலிலிருந்து தொடங்க மீண்டும் தொடுங்கள்.' },
  popular: { en: 'Most loved', ta: 'அதிகம் விரும்பப்படுவது' },
  perSession: { en: 'for one 4-hour session', ta: 'ஒரு 4 மணி நேர அமர்வுக்கு' },
  plans: { en: 'Monthly plans', ta: 'மாதாந்திரத் திட்டங்கள்' },
  plansNote: { en: 'Ongoing brand or school work runs on a monthly agreement. Tell us what you need and we will send a proposal.', ta: 'தொடர் பிராண்ட் / பள்ளி வேலைகள் மாத ஒப்பந்தத்தில். உங்கள் தேவையைச் சொல்லுங்கள், திட்டம் அனுப்புவோம்.' },
  perMonth: { en: '/ month', ta: '/ மாதம்' },
  enquire: { en: 'Enquire', ta: 'விசாரிக்க' },
  orOneOff: { en: 'Or book a one-off shoot', ta: 'அல்லது ஒரு முறை படப்பிடிப்பு' },
  toConfirm: { en: 'price to confirm', ta: 'விலை உறுதி செய்ய' },
  customised: { en: 'Custom', ta: 'நீங்களே மாற்றியது' },
  customNote: { en: 'You changed a main item, so this is now your own package. Tap a package to start over from it.', ta: 'முக்கியப் பொருளை மாற்றியதால் இது இப்போது நீங்களே அமைத்த தொகுப்பு. மீண்டும் தொடங்க ஒரு தொகுப்பைத் தொடுங்கள்.' },
  voice: { en: 'Or just say it', ta: 'அல்லது சொன்னாலே போதும்' },
  voiceNote: {
    en: 'Try “Gold with drone”, “Aura 35 sheets” or “ஆறு மணி நேரம், மொத்தம் எவ்வளவு?”. The cart updates as you speak.',
    ta: '“கோல்ட், ட்ரோனும் சேர்”, “Aura 35 sheets” அல்லது “ஆறு மணி நேரம், மொத்தம் எவ்வளவு?” என்று சொல்லிப் பாருங்கள். பேசும்போதே பட்டியல் மாறும்.',
  },
  note: { en: 'Anything else? Say it', ta: 'வேறு ஏதாவது? சொல்லுங்கள்' },
  noteNote: {
    en: 'Leave us a voice message: rituals we should not miss, family to photograph, a song you love. We listen before we call.',
    ta: 'எங்களுக்கு ஒரு குரல் செய்தி விடுங்கள்: தவறவிடக் கூடாத சடங்குகள், படம் எடுக்க வேண்டிய உறவினர்கள், பிடித்த பாடல். அழைக்கும் முன் கேட்போம்.',
  },
  cart: { en: 'Your options', ta: 'உங்கள் தேர்வுகள்' },
  cartNote: { en: 'Everything we offer, in one list. Gold is in your package; anything you add on top shows in ruby.', ta: 'நாங்கள் தரும் அனைத்தும் ஒரே பட்டியலில். தங்கம் = உங்கள் தொகுப்பில் உள்ளவை; நீங்கள் சேர்ப்பவை சிவப்பில்.' },
  next: { en: 'Continue to your details', ta: 'உங்கள் விவரங்களுக்குத் தொடர்க' },
  needCrew: { en: 'Add at least one crew member or shoot to continue', ta: 'தொடர குறைந்தது ஒரு கலைஞர் அல்லது படப்பிடிப்பைச் சேர்க்கவும்' },
  strip: { en: 'Packages', ta: 'தொகுப்புகள்' },
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
  const clearCart = useStore(s => s.clearCart)
  const updateDraft = useStore(s => s.updateDraft)
  const prices = usePrices()
  const navigate = useNavigate()
  const lenis = useLenis()
  const cardsRef = useRef<HTMLDivElement>(null)
  const [stuck, setStuck] = useState(false)
  const navHidden = useUi(s => s.navHidden)
  const ev = eventByKey(eventType)

  // Once the cards scroll away, a slim strip keeps them one tap away.
  useEffect(() => {
    const el = cardsRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting && e.boundingClientRect.top < 0), { rootMargin: '-90px 0px 0px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [ev?.key])

  if (!ev) return null

  // Commercial adds a plans block first, so later headings shift by one.
  const roman = (n: number) => ['i.', 'ii.', 'iii.', 'iv.', 'v.'][n + (ev.key === 'commercial' ? 1 : 0)]
  const hasBase = cartEntries(cart).some(e => e.item.section === 'crew' || e.item.section === 'special')
  const priceOf = (tier: FixedTier, variant?: number) => computeQuote({ eventType: ev.key, cart: tierCart(ev.tiers, tier, 1, undefined, variant), distanceKm: 0 }, prices).total
  const shownVariant = (tier: FixedTier) => (cart.tier === tier ? cart.variant : undefined)

  /** Picks a package and brings its first item into view; tapping the active one empties the cart. */
  const pick = (tier: FixedTier) => {
    if (cart.tier === tier) {
      clearCart()
      return
    }
    setTier(tier)
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const el = document.querySelector<HTMLElement>('[data-in-package="true"]')
        if (!el) return
        if (lenis) lenis.scrollTo(el, { offset: -180 })
        else el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }),
    )
  }

  return (
    <div>
      <StepHeader step={3} title={t.title} lead={t.lead} />

      {ev.key === 'commercial' && (
        <>
          <SubHeading index="i." title={t.plans} note={t.plansNote} />
          <div className="mb-10 grid gap-4 md:grid-cols-2">
            {(['commercial_brand', 'commercial_school'] as const).map(id => (
              <div key={id} className="flex flex-col rounded-[26px] border border-ink/[0.08] bg-white/70 p-5 shadow-soft">
                <p className="t-3 text-ink">{CATALOGUE_BY_ID[id].name[lang]}</p>
                <p className="mt-1 font-medium tabular-nums text-ruby">
                  {formatINR(prices[id])} <span className="text-[12px] font-normal text-ink/45">{t.perMonth}</span>
                </p>
                <div className="mt-4">
                  <Button to={`/contact?plan=${id}`} variant="outline" size="sm" icon="arrowRight">{t.enquire}</Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <SubHeading index={roman(0)} title={ev.key === 'commercial' ? t.orOneOff : t.packages} note={t.packagesNote} />
      {/* Name and price only; what each package holds shows in gold in the options below */}
      <div ref={cardsRef}>
        <Stagger className="grid grid-cols-3 gap-2 sm:gap-4" gap={0.08}>
          {TIERS.map(tier => {
            const meta = TIER_META[tier]
            const active = cart.tier === tier
            const preset = tierPreset(ev.tiers, tier)
            const v = shownVariant(tier)
            return (
              <StaggerItem key={tier} className="min-w-0">
                <Tilt className="h-full" max={5} glare={false}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => pick(tier)}
                  className={`group relative isolate flex h-full w-full flex-col overflow-hidden rounded-[22px] border p-3 text-left transition-[border-color,transform,box-shadow] duration-500 cursor-pointer active:scale-[0.99] sm:p-5 ${
                    active ? 'border-gold shadow-[0_14px_34px_-18px_rgba(161,118,30,0.7)]' : 'border-ink/[0.08] bg-white/70 shadow-soft hover:-translate-y-1 hover:border-ink/20'
                  }`}
                >
                  {active && (
                    <motion.span layoutId="pkg-active" className="absolute inset-0 -z-10 rounded-[22px] bg-gradient-to-b from-gold-soft to-white" transition={{ type: 'spring', stiffness: 360, damping: 34 }} />
                  )}
                  {active && <Sweep trigger={`${tier}-${cart.variant ?? ''}`} tone="rgba(201,162,39,0.35)" />}
                  {lang === 'ta' && active && <KolamCorner className="pointer-events-none absolute bottom-0 right-0 rotate-180 opacity-70" />}
                  <div className="flex min-h-6 items-start justify-between gap-2">
                    {meta.popular ? (
                      <span className="inline-flex min-w-0 items-center gap-1 rounded-full bg-ruby px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white">
                        <Icon name="star" size={10} strokeWidth={2.2} />
                        <span className="truncate max-sm:sr-only">{t.popular}</span>
                      </span>
                    ) : (
                      <span />
                    )}
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${active ? 'border-gold bg-gold text-white' : 'border-ink/15 bg-white text-transparent'}`} aria-hidden="true">
                      <Icon name="check" size={14} strokeWidth={2.4} />
                    </span>
                  </div>
                  <p className="t-3 mt-2 truncate text-ink">{presetName(ev.tiers, tier)[lang]}</p>
                  <p className={`mt-1 text-[15px] font-semibold sm:text-[17px] tabular-nums ${active ? 'text-gold-deep' : 'text-ruby'}`}>{formatINR(priceOf(tier, v))}</p>
                  <p className="text-[11.5px] text-ink/45">{preset.pending ? t.toConfirm : t.perSession}</p>
                </button>
                </Tilt>
              </StaggerItem>
            )
          })}
        </Stagger>
      </div>
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

      {ev.key !== 'commercial' && <PackageAlbumNote className="mt-5" />}

      {/* Slim package strip, pinned under the nav while the options scroll */}
      <div className="sticky z-30 h-0 transition-[top] duration-500 ease-out" style={{ top: navHidden ? 'calc(env(safe-area-inset-top) + 12px)' : 'calc(var(--nav-h) + 8px)' }}>
        <AnimatePresence>
          {stuck && (
            <motion.nav
              aria-label={t.strip}
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="glass-strong flex gap-1 rounded-full p-1"
            >
              {TIERS.map(tier => {
                const active = cart.tier === tier
                return (
                  <button
                    key={tier}
                    type="button"
                    aria-pressed={active}
                    onClick={() => pick(tier)}
                    className={`flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-full px-2.5 py-1.5 transition-colors duration-300 cursor-pointer ${active ? 'bg-ruby text-white shadow-ruby' : 'text-ink/70 hover:bg-white/60'}`}
                  >
                    <span className={`hidden h-5 w-5 shrink-0 items-center justify-center rounded-full sm:flex ${active ? 'bg-white text-ruby' : 'border border-ink/15 text-transparent'}`} aria-hidden="true">
                      <Icon name="check" size={12} strokeWidth={2.6} />
                    </span>
                    <span className="min-w-0 text-left leading-tight">
                      <span className="block truncate text-[12.5px] font-semibold">{presetName(ev.tiers, tier)[lang]}</span>
                      <span className={`block truncate text-[11px] tabular-nums ${active ? 'text-white/80' : 'text-ink/50'}`}>{formatINR(priceOf(tier, shownVariant(tier)))}</span>
                    </span>
                  </button>
                )
              })}
            </motion.nav>
          )}
        </AnimatePresence>
      </div>

      <Ornament className="my-10 md:my-14" />

      <SubHeading index={roman(1)} title={t.cart} note={t.cartNote} />
      <CartBuilder cart={cart} spec={ev.tiers} onChange={c => updateDraft({ cart: c, durationHours: cartHours(c) })} />

      <Ornament className="my-10 md:my-14" />

      <SubHeading index={roman(2)} title={t.voice} note={t.voiceNote} />
      <Reveal>
        <VoiceAssistant />
      </Reveal>

      <Ornament className="my-10 md:my-14" />

      <SubHeading index={roman(3)} title={t.note} note={t.noteNote} />
      <Reveal>
        <VoiceNote />
      </Reveal>

      <StepNav back="/book/venue" onNext={() => navigate('/book/details')} nextLabel={t.next} disabled={!hasBase} hint={!hasBase ? t.needCrew : undefined} />
    </div>
  )
}
