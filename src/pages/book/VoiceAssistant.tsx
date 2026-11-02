import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Icon } from '../../components/Icon'
import { EASE } from '../../components/motion'
import { KolamCorner } from '../../components/tamil'
import { formatINR, useLang, useT, type Bi } from '../../lib/i18n'
import { useStore } from '../../lib/store'
import {
  ALBUM_TIERS, CATALOGUE_BY_ID, MAX_HOURS, MIN_HOURS, SESSION_HOURS, albumIn, cartHours, cartPackageItems, cartTierName, MAX_SESSIONS, MIN_SESSIONS, TIER_META, cartExtras, coverageFor,
  cartEntries, presetName, resolvePrices, setCartHours, setCartQty, tierCart, tierPreset, variantDelta,
  type Cart, type CatalogueId,
} from '../../lib/catalogue'
import { ALBUM_LINES, defaultAlbumChoice, eventByKey } from '../../lib/data'
import { useListener, useSpeaker } from '../../lib/speech'
import { parseIntents, type Intent } from './intent'
import { MIC_BLOCKED, micBlocked, quoteFor } from './shared'
import { computeQuote } from '../../lib/pricing'
import { PACKAGE_ALBUM_POINTS } from '../../lib/packageNote'

const copy = {
  title: { en: 'Cart assistant', ta: 'குரல் உதவியாளர்' },
  subtitle: { en: 'Speak in Tamil or English', ta: 'தமிழிலோ ஆங்கிலத்திலோ பேசுங்கள்' },
  voiceOn: { en: 'Spoken replies on', ta: 'குரல் பதில் இயக்கத்தில்' },
  voiceOff: { en: 'Spoken replies off', ta: 'குரல் பதில் நிறுத்தத்தில்' },
  placeholder: { en: 'Type or tap the mic', ta: 'தட்டச்சு செய்யுங்கள் அல்லது மைக்கைத் தொடுங்கள்' },
  send: { en: 'Send', ta: 'அனுப்பு' },
  mic: { en: 'Speak to the assistant', ta: 'உதவியாளரிடம் பேசுங்கள்' },
  stopMic: { en: 'Stop listening', ta: 'கேட்பதை நிறுத்து' },
  listening: { en: 'Listening…', ta: 'கேட்கிறேன்…' },
  noMic: { en: 'Voice input is not available in this browser — type your request instead.', ta: 'இந்த உலாவியில் குரல் உள்ளீடு இல்லை — உங்கள் கோரிக்கையைத் தட்டச்சு செய்யுங்கள்.' },
  try: { en: 'Try', ta: 'முயற்சிக்கவும்' },
  you: { en: 'You', ta: 'நீங்கள்' },
  log: { en: 'Conversation', ta: 'உரையாடல்' },
}

const GREETING: Bi = {
  en: 'Vanakkam! Tell me what you would like. I can add or remove items, switch packages, set your hours, pick an album, or read out your total.',
  ta: 'வணக்கம்! உங்களுக்கு என்ன வேண்டும் என்று சொல்லுங்கள். பொருட்களைச் சேர்க்கவோ நீக்கவோ, தொகுப்பை மாற்றவோ, நேரத்தை அமைக்கவோ, ஆல்பம் தேர்ந்தெடுக்கவோ, மொத்தத் தொகையைச் சொல்லவோ முடியும்.',
}

const HELP: Bi = {
  en: 'You can say things like “add drone”, “switch to Gold”, “six hours”, “add cinematic”, “Aura 35 sheets” or “what’s my total?”.',
  ta: '“ட்ரோன் சேர்”, “கோல்ட் தொகுப்பு”, “ஆறு மணி நேரம்”, “சினிமா வீடியோ சேர்”, “Aura 35 sheets”, “மொத்தம் எவ்வளவு?” என்று சொல்லலாம்.',
}

interface Msg {
  id: number
  from: 'bot' | 'user'
  text: Bi | string
}

const join = (parts: Bi[]): Bi => ({ en: parts.map(p => p.en).join(' '), ta: parts.map(p => p.ta).join(' ') })

/** Applies intents to the booking draft and builds a bilingual reply. */
function runIntents(intents: Intent[]): { reply: Bi; goNext: boolean } {
  const { draft, updateDraft, cms } = useStore.getState()
  const prices = resolvePrices(cms.catalogue.prices)
  const ev = draft.eventType ? eventByKey(draft.eventType) : undefined
  let cart: Cart = draft.cart
  const parts: Bi[] = []
  let changed = false
  let goNext = false
  const qtyOf = (id: CatalogueId) => cart.items[id] ?? 0

  for (let n = 0; n < intents.length; n++) {
    const i = intents[n]
    switch (i.kind) {
      case 'item': {
        const item = CATALOGUE_BY_ID[i.id]
        const name = item.name
        const have = qtyOf(i.id)
        if (i.op === 'add') {
          const want = item.group ? 1 : have + (i.qty ?? 1)
          if (item.onRequest) {
            parts.push({ en: `${name.en} is on request — we’ll price it with you on a call.`, ta: `${name.ta} கோரிக்கையின் பேரில் — அழைப்பில் விலை சொல்வோம்.` })
          } else if (item.packageOnly && have === 0 && !(cartPackageItems(cart, ev?.tiers)[i.id] ?? 0)) {
            parts.push({ en: `${name.en} comes inside our packages, not on its own.`, ta: `${name.ta} தொகுப்புகளில் மட்டும் வரும், தனியாக இல்லை.` })
          } else if (item.group && have > 0) {
            parts.push({ en: `${name.en} is already in your cart.`, ta: `${name.ta} ஏற்கனவே உள்ளது.` })
          } else if (item.max && want > item.max) {
            parts.push({ en: `We can add up to ${item.max} of ${name.en}.`, ta: `${name.en} அதிகபட்சம் ${item.max} வரை சேர்க்கலாம்.` })
          } else {
            const before = draft.eventType ? computeQuote({ eventType: draft.eventType, cart, distanceKm: 0 }, prices).total : 0
            const wasPackage = cart.tier !== 'custom' ? cartTierName(cart) : undefined
            cart = setCartQty(cart, i.id, want)
            changed = true
            if (wasPackage && cart.tier === 'custom') parts.push({ en: `That ends the ${wasPackage.en} package.`, ta: `இதனால் ${wasPackage.ta} தொகுப்பு முடிவடைகிறது.` })
            const after = draft.eventType ? computeQuote({ eventType: draft.eventType, cart, distanceKm: 0 }, prices).total : 0
            const cost = Math.max(0, after - before)
            parts.push({ en: `Added ${name.en}${want > 1 ? ` (now ${want})` : ''} (+${formatINR(cost)}).`, ta: `${name.ta} சேர்க்கப்பட்டது${want > 1 ? ` (இப்போது ${want})` : ''} (+${formatINR(cost)}).` })
          }
        } else if (have > 0) {
          const next = i.qty !== undefined ? Math.max(0, have - i.qty) : 0
          const wasPackage = cart.tier !== 'custom' ? cartTierName(cart) : undefined
          cart = setCartQty(cart, i.id, next)
          changed = true
          parts.push(next > 0 ? { en: `${name.en} is now ${next}.`, ta: `${name.ta} இப்போது ${next}.` } : { en: `Removed ${name.en}.`, ta: `${name.ta} நீக்கப்பட்டது.` })
          if (wasPackage && cart.tier === 'custom') parts.push({ en: `That ends the ${wasPackage.en} package.`, ta: `இதனால் ${wasPackage.ta} தொகுப்பு முடிவடைகிறது.` })
        } else {
          parts.push({ en: `${name.en} wasn’t in your cart.`, ta: `${name.ta} உங்கள் பட்டியலில் இல்லை.` })
        }
        break
      }
      case 'tier': {
        // "Beach" is a package only for outdoor shoots; elsewhere it adds that look as a shoot.
        if (i.family && ev && ev.tiers.kind !== i.family) {
          if (i.fallback) intents.push({ kind: 'item', id: i.fallback, op: 'add' })
          break
        }
        const meta = { name: i.tier === 'custom' || !ev ? TIER_META[i.tier].name : presetName(ev.tiers, i.tier) }
        if (cart.tier === i.tier) {
          parts.push({ en: `You’re already on ${meta.name.en}.`, ta: `ஏற்கனவே ${meta.name.ta} தொகுப்பில் இருக்கிறீர்கள்.` })
        } else if (i.tier === 'custom' || !ev) {
          cart = { ...cart, tier: 'custom' }
          changed = true
          parts.push({ en: 'Switched to a custom package — add or remove anything you like.', ta: 'தனிப்பயன் தொகுப்புக்கு மாற்றப்பட்டது — விரும்பியதைச் சேர்க்கலாம், நீக்கலாம்.' })
        } else {
          cart = tierCart(ev.tiers, i.tier, cart.sessions, cartHours(cart))
          changed = true
          parts.push({ en: `Switched to the ${meta.name.en} package.`, ta: `${meta.name.ta} தொகுப்புக்கு மாற்றப்பட்டது.` })
        }
        break
      }
      case 'hours':
      case 'sessions':
      case 'sessionsDelta': {
        const want = i.kind === 'hours' ? i.hours : i.kind === 'sessions' ? i.sessions * SESSION_HOURS : cartHours(cart) + i.delta * SESSION_HOURS
        const next = Math.min(MAX_HOURS, Math.max(MIN_HOURS, want))
        if (next !== want) {
          parts.push(i.kind === 'hours'
            ? { en: `We book ${MIN_HOURS} to ${MAX_HOURS} hours.`, ta: `${MIN_HOURS} முதல் ${MAX_HOURS} மணி நேரம் வரை பதிவு செய்யலாம்.` }
            : { en: `We book ${MIN_SESSIONS} to ${MAX_SESSIONS} sessions.`, ta: `${MIN_SESSIONS} முதல் ${MAX_SESSIONS} அமர்வுகள் வரை பதிவு செய்யலாம்.` })
        }
        if (next !== cartHours(cart)) {
          cart = setCartHours(cart, next)
          changed = true
        }
        parts.push({ en: `Coverage set to ${coverageFor(next).label.en}.`, ta: `படப்பிடிப்பு: ${coverageFor(next).label.ta}.` })
        break
      }
      case 'albumLine': {
        const line = ALBUM_LINES.find(l => l.key === i.line)!
        // A line needs one of the 25 / 35 / 45 sheet albums; add the 25-sheet one if there is none.
        if (!ALBUM_TIERS.some(t => t.id === albumIn(cart)?.id) && !intents.some(x => x.kind === 'item' && x.id.startsWith('album_'))) {
          const wasPackage = cart.tier !== 'custom' ? cartTierName(cart) : undefined
          const before = draft.eventType ? computeQuote({ eventType: draft.eventType, cart, distanceKm: 0 }, prices).total : 0
          cart = setCartQty(cart, 'album_25', 1)
          const after = draft.eventType ? computeQuote({ eventType: draft.eventType, cart, distanceKm: 0 }, prices).total : 0
          parts.push({ en: `Added ${CATALOGUE_BY_ID.album_25.name.en} (${after >= before ? '+' : ''}${formatINR(after - before)}).`, ta: `${CATALOGUE_BY_ID.album_25.name.ta} சேர்க்கப்பட்டது (${after >= before ? '+' : ''}${formatINR(after - before)}).` })
          if (wasPackage && cart.tier === 'custom') parts.push({ en: `That ends the ${wasPackage.en} package.`, ta: `இதனால் ${wasPackage.ta} தொகுப்பு முடிவடைகிறது.` })
        }
        cart = { ...cart, album: cart.album?.line === i.line ? cart.album : defaultAlbumChoice(i.line) }
        changed = true
        parts.push({ en: `Album line: ${line.name.en}.`, ta: `ஆல்பம் வகை: ${line.name.ta}.` })
        break
      }
      case 'askPackage': {
        if (!ev || (i.family && ev.tiers.kind !== i.family)) break
        const name = presetName(ev.tiers, i.tier)
        const pkg = tierCart(ev.tiers, i.tier, 1, cartHours(cart))
        const q = computeQuote({ eventType: ev.key, cart: pkg, distanceKm: 0 }, prices)
        const inside = cartEntries(pkg).filter(e => e.item.unit !== 'included')
        const list: Bi = { en: inside.map(e => e.item.name.en).join(', '), ta: inside.map(e => e.item.name.ta).join(', ') }
        const saving = Math.abs(q.package?.saving ?? 0)
        parts.push({
          en: `${name.en} package: ${list.en}. ${formatINR(q.total)}${saving ? `, saving ${formatINR(saving)} against booking each item` : ''}.`,
          ta: `${name.ta} தொகுப்பில்: ${list.ta}. ${formatINR(q.total)}${saving ? `; தனித்தனியாக எடுப்பதைவிட ${formatINR(saving)} குறைவு` : ''}.`,
        })
        const v = tierPreset(ev.tiers, i.tier).variants?.[0]
        if (v) parts.push({ en: `With ${v.label.en} it is +${formatINR(variantDelta(ev.tiers, i.tier, 0, prices))}.`, ta: `${v.label.ta} எடுத்தால் +${formatINR(variantDelta(ev.tiers, i.tier, 0, prices))}.` })
        if (albumIn(pkg)) parts.push(PACKAGE_ALBUM_POINTS[0], PACKAGE_ALBUM_POINTS[1])
        break
      }
      case 'askItem': {
        const item = CATALOGUE_BY_ID[i.id]
        const price = item.onRequest
          ? { en: 'priced on request; ask us', ta: 'விலை கேட்டுச் சொல்கிறோம்' }
          : prices[i.id] === 0
            ? { en: 'included free', ta: 'இலவசமாகச் சேர்ந்தது' }
            : { en: formatINR(prices[i.id]), ta: formatINR(prices[i.id]) }
        const has = qtyOf(i.id) > 0
        parts.push({
          en: `${item.name.en}: ${price.en}.${has ? ' It is already in your list.' : ''}`,
          ta: `${item.name.ta}: ${price.ta}.${has ? ' ஏற்கனவே உங்கள் பட்டியலில் உள்ளது.' : ''}`,
        })
        break
      }
      case 'askAlbum': {
        const tiers = ALBUM_TIERS.map(a => ({ sheets: a.sheets, price: formatINR(prices[a.id]) }))
        parts.push({
          en: `Albums from our lines: ${tiers.map(a => `${a.sheets} sheets ${a.price}`).join(', ')}.`,
          ta: `எங்கள் ஆல்பங்கள்: ${tiers.map(a => `${a.sheets} தாள் ${a.price}`).join(', ')}.`,
        })
        const own = albumIn(cart)
        if (own && cart.tier !== 'custom') {
          const pkgName = cartTierName(cart)
          parts.push({ en: `Your ${pkgName.en} package already includes ${own.name.en}.`, ta: `உங்கள் ${pkgName.ta} தொகுப்பில் ஏற்கனவே ${own.name.ta} உள்ளது.` })
        }
        parts.push(PACKAGE_ALBUM_POINTS[1], PACKAGE_ALBUM_POINTS[2])
        break
      }
      case 'clearExtras': {
        const extras = cartExtras(cart)
        if (extras.length) {
          for (const e of extras) cart = setCartQty(cart, e.item.id, 0)
          changed = true
          parts.push({ en: 'Cleared all extras — crew only now.', ta: 'அனைத்து கூடுதல்களும் நீக்கப்பட்டன — இப்போது குழு மட்டும்.' })
        } else {
          parts.push({ en: 'There are no extras to remove.', ta: 'நீக்குவதற்குக் கூடுதல் சேவைகள் எதுவும் இல்லை.' })
        }
        break
      }
      case 'help':
        parts.push(HELP)
        break
      case 'greet':
        parts.push({ en: 'Vanakkam!', ta: 'வணக்கம்!' }, HELP)
        break
      case 'next':
        goNext = true
        break
      case 'total':
        break
    }
  }

  if (changed) updateDraft({ cart, durationHours: cartHours(cart) })

  const quote = quoteFor({ ...draft, cart }, prices)
  const asksTotal = intents.some(i => i.kind === 'total')
  if (quote && asksTotal) {
    const tier = { name: cartTierName(cart) }
    const h = cartHours(cart)
    const extras = cartExtras(cart)
    const list: Bi = { en: extras.map(e => e.item.name.en).join(', '), ta: extras.map(e => e.item.name.ta).join(', ') }
    parts.push({
      en: `Your estimated total is ${formatINR(quote.total)} — ${quote.package?.label.en ?? `${tier.name.en} package`}, ${h} hours${extras.length ? `, with ${list.en}` : ''}.`,
      ta: `உங்கள் மதிப்பிடப்பட்ட மொத்தம் ${formatINR(quote.total)} — ${quote.package?.label.ta ?? `${tier.name.ta} தொகுப்பு`}, ${h} மணி நேரம்${extras.length ? `, கூடவே ${list.ta}` : ''}.`,
    })
  } else if (quote && changed) {
    const label = quote.package?.label ?? cartTierName(cart)
    parts.push({ en: `${label.en}: your total is now ${formatINR(quote.total)}.`, ta: `${label.ta}: இப்போது மொத்தம் ${formatINR(quote.total)}.` })
  }

  if (goNext) parts.push({ en: 'Great — taking you to your details.', ta: 'சரி — உங்கள் விவரப் பக்கத்திற்குச் செல்கிறோம்.' })

  if (!parts.length) {
    parts.push({
      en: 'Sorry, I didn’t catch that. Try “add drone” or “what’s the total?”.',
      ta: 'மன்னிக்கவும், புரியவில்லை. “ட்ரோன் சேர்” அல்லது “மொத்தம் எவ்வளவு?” என்று முயற்சிக்கவும்.',
    })
  }
  return { reply: join(parts), goNext }
}

/** Contextual quick prompts in the current language. */
function useSuggestions(): Bi[] {
  const cart = useStore(s => s.draft.cart)
  const has = (id: CatalogueId) => (cart.items[id] ?? 0) > 0
  const list: Bi[] = []
  list.push(has('drone') ? { en: 'Add a 360° selfie booth', ta: '360° செல்ஃபி பூத் சேர்' } : { en: 'Add drone', ta: 'ட்ரோன் சேர்' })
  list.push(has('pendrive') ? { en: 'Add semi-candid video', ta: 'செமி-கேண்டிட் வீடியோ சேர்' } : { en: 'Add a pendrive', ta: 'பென்டிரைவ் சேர்' })
  list.push(cartHours(cart) <= SESSION_HOURS ? { en: 'Make it six hours', ta: 'ஆறு மணி நேரம்' } : { en: 'Just four hours', ta: 'நான்கு மணி நேரம் மட்டும்' })
  list.push(has('vid_cinematic') ? { en: 'Add documentary too', ta: 'ஆவணப் பாணியும் சேர்' } : { en: 'Add cinematic video', ta: 'சினிமா வீடியோ சேர்' })
  list.push(cart.tier === 'premium' ? { en: 'Switch to Silver', ta: 'சில்வர் தொகுப்பு' } : { en: 'Switch to Gold', ta: 'கோல்ட் தொகுப்பு' })
  list.push({ en: 'Aura 35 sheets', ta: 'Aura 35 sheets' })
  list.push({ en: 'What’s in Gold?', ta: 'கோல்டில் என்ன இருக்கு?' })
  list.push({ en: 'What’s my total?', ta: 'மொத்தம் எவ்வளவு?' })
  return list
}

export function VoiceAssistant() {
  const lang = useLang()
  const t = useT(copy)
  const navigate = useNavigate()
  const suggestions = useSuggestions()
  const [messages, setMessages] = useState<Msg[]>([{ id: 0, from: 'bot', text: GREETING }])
  const [input, setInput] = useState('')
  const [voiceReplies, setVoiceReplies] = useState(true)
  const [thinking, setThinking] = useState(false)
  const { speak, stop: stopSpeaking, speaking, supported: canSpeak } = useSpeaker(lang)
  const logRef = useRef<HTMLDivElement>(null)
  const nextId = useRef(1)
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const handle = useCallback(
    (raw: string) => {
      const text = raw.trim()
      if (!text) return
      setMessages(m => [...m, { id: nextId.current++, from: 'user', text }])
      setInput('')
      setThinking(true)

      /*
       * GEMINI: replace the local parser below with the backend call
       *   POST /voice/chat { text, lang, draft } → Gemini (free tier) with function calling,
       * declaring the `Intent` union from ./intent as the tool schema. Gemini returns
       * tool calls (add_addon, set_package, set_hours, get_total…) plus a natural reply
       * in the user's language; apply the calls with the same `runIntents` logic.
       */
      const intents = parseIntents(text)

      timers.current.push(
        window.setTimeout(() => {
          const { reply, goNext } = runIntents(intents)
          setThinking(false)
          setMessages(m => [...m, { id: nextId.current++, from: 'bot', text: reply }])
          const current = useStore.getState().lang
          if (voiceReplies && canSpeak) speak(reply[current])
          if (goNext) timers.current.push(window.setTimeout(() => navigate('/book/details'), 1400))
        }, 420),
      )
    },
    [voiceReplies, canSpeak, speak, navigate],
  )

  const listener = useListener(lang, handle)

  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages, thinking, listener.interim])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    handle(input)
  }

  const [micDenied, setMicDenied] = useState(false)
  const toggleMic = () => {
    if (listener.listening) return listener.stop()
    stopSpeaking()
    listener.start()
    void micBlocked().then(setMicDenied)
  }

  const busy = listener.listening || speaking

  return (
    <div className="relative">
      {/* Colour field behind the glass */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[26px] md:rounded-[32px]">
        <div className="absolute -left-16 -top-20 h-72 w-72 rounded-full bg-ruby/35 blur-3xl" />
        <div className="absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-ink/25 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-40 w-40 rounded-full bg-ruby-bright/25 blur-3xl animate-float" />
      </div>

      <section className="glass-strong relative overflow-hidden rounded-[26px] md:rounded-[32px]" aria-label={t.title}>
        {lang === 'ta' && <KolamCorner className="pointer-events-none absolute -right-1 -top-1 rotate-90 opacity-50" />}

        {/* Header */}
        <div className="flex items-center gap-3 border-b hairline px-4 py-3.5 sm:px-6 sm:py-4">
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-ruby-bright to-ruby-deep text-white shadow-ruby">
            {busy && <span className="absolute inset-0 rounded-full bg-ruby/50 animate-pulse-ring" />}
            <Icon name="sparkle" size={19} className="relative" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-[1.15rem] font-semibold leading-tight text-ink md:text-[1.25rem]">{t.title}</p>
            <p className="truncate text-[12px] text-ink/50">{t.subtitle}</p>
          </div>
          {canSpeak && (
            <button
              type="button"
              onClick={() => {
                if (voiceReplies) stopSpeaking()
                setVoiceReplies(v => !v)
              }}
              aria-pressed={voiceReplies}
              aria-label={voiceReplies ? t.voiceOn : t.voiceOff}
              title={voiceReplies ? t.voiceOn : t.voiceOff}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition cursor-pointer ${voiceReplies ? 'bg-ink text-white' : 'bg-ink/[0.06] text-ink/50 hover:text-ink'}`}
            >
              <Icon name={voiceReplies ? 'volume' : 'x'} size={17} />
            </button>
          )}
        </div>

        {/* Conversation */}
        <div ref={logRef} data-lenis-prevent role="log" aria-live="polite" aria-label={t.log} className="no-scrollbar h-[min(300px,45dvh)] space-y-3 overflow-y-auto overscroll-contain px-4 py-4 sm:h-[320px] sm:px-6 sm:py-5">
          <AnimatePresence initial={false}>
            {messages.map(m => {
              const text = typeof m.text === 'string' ? m.text : m.text[lang]
              const mine = m.from === 'user'
              return (
                <motion.div
                  key={m.id}
                  layout="position"
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.45, ease: EASE }}
                  className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                >
                  <p
                    className={`max-w-[88%] whitespace-pre-line break-words rounded-[20px] px-4 py-2.5 text-[14px] leading-relaxed md:max-w-[86%] ${
                      mine ? 'rounded-br-md bg-ink text-white' : 'rounded-bl-md border border-white/80 bg-white/85 text-ink/85 shadow-[0_1px_2px_rgba(10,10,11,0.05)]'
                    }`}
                  >
                    <span className="sr-only">{mine ? `${t.you}: ` : `${t.title}: `}</span>
                    {text}
                  </p>
                </motion.div>
              )
            })}
            {listener.interim && (
              <motion.div key="interim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-end">
                <p className="max-w-[86%] rounded-[20px] rounded-br-md border border-dashed border-ink/20 px-4 py-2.5 text-[14px] italic text-ink/55">{listener.interim}</p>
              </motion.div>
            )}
            {thinking && (
              <motion.div key="typing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex">
                <span className="flex items-center gap-1 rounded-[20px] rounded-bl-md bg-white/85 px-4 py-3.5" aria-hidden="true">
                  {[0, 1, 2].map(i => (
                    <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-ink/40" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.12 }} />
                  ))}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Suggestions */}
        <div className="no-scrollbar mask-fade-x flex gap-2 overflow-x-auto px-3 pb-3 sm:px-6" data-lenis-prevent>
          {suggestions.map(s => (
            <button
              key={s.en}
              type="button"
              onClick={() => handle(s[lang])}
              className="h-10 shrink-0 rounded-full border border-ink/10 bg-white/70 px-3.5 text-[12.5px] md:h-9 font-medium text-ink/70 transition hover:border-ruby/40 hover:text-ruby cursor-pointer first:ml-2 last:mr-2"
            >
              {s[lang]}
            </button>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={submit} className="flex items-center gap-2 border-t hairline px-3 py-3 sm:gap-2.5 sm:px-5 sm:py-4">
          <button
            type="button"
            onClick={toggleMic}
            disabled={!listener.supported}
            aria-label={listener.listening ? t.stopMic : t.mic}
            aria-pressed={listener.listening}
            title={listener.supported ? t.mic : t.noMic}
            className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white transition-all duration-300 cursor-pointer active:scale-95 disabled:cursor-not-allowed disabled:bg-ink/15 disabled:shadow-none ${
              listener.listening ? 'bg-ruby-deep' : 'bg-ruby shadow-ruby hover:bg-ruby-bright'
            }`}
          >
            {listener.listening && (
              <>
                <span className="absolute inset-0 rounded-full bg-ruby/50 animate-pulse-ring" />
                <span className="absolute inset-0 rounded-full bg-ruby/30 animate-pulse-ring [animation-delay:0.6s]" />
              </>
            )}
            <Icon name={listener.listening ? 'pause' : 'mic'} size={20} className="relative" />
          </button>
          <label className="sr-only" htmlFor="voice-cart-input">
            {t.placeholder}
          </label>
          <input
            id="voice-cart-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={listener.listening ? t.listening : t.placeholder}
            autoComplete="off"
            enterKeyHint="send"
            className="h-12 min-w-0 flex-1 rounded-full border border-ink/10 bg-white/80 px-4 text-base text-ink md:text-[14.5px] outline-none transition placeholder:text-ink/35 focus:border-ruby focus:ring-4 focus:ring-ruby/10"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            aria-label={t.send}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink text-white transition hover:bg-ink-3 active:scale-95 disabled:opacity-30 cursor-pointer"
          >
            <Icon name="send" size={18} />
          </button>
        </form>
        {!listener.supported && <p className="-mt-1 px-4 pb-4 text-[12px] leading-snug text-ink/45 sm:px-6">{t.noMic}</p>}
        {listener.supported && micDenied && !listener.listening && (
          <p role="alert" className="-mt-1 flex items-start gap-2 px-4 pb-4 text-[12px] leading-snug text-ruby-deep sm:px-6">
            <Icon name="info" size={14} className="mt-px shrink-0" />
            {MIC_BLOCKED[lang]}
          </p>
        )}
      </section>
    </div>
  )
}
