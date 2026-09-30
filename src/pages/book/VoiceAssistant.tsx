import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Icon } from '../../components/Icon'
import { EASE } from '../../components/motion'
import { KolamCorner } from '../../components/tamil'
import { formatINR, useLang, useT, type Bi } from '../../lib/i18n'
import { useStore } from '../../lib/store'
import { ADDONS, PACKAGES, type AddonKey } from '../../lib/data'
import { MAX_HOURS, MIN_HOURS } from '../../lib/pricing'
import { useListener, useSpeaker } from '../../lib/speech'
import { parseIntents, type Intent } from './intent'
import { quoteFor } from './shared'

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
  en: 'Vanakkam! Tell me what you would like — I can add or remove extras, switch packages, change the hours, or read out your total.',
  ta: 'வணக்கம்! உங்களுக்கு என்ன வேண்டும் என்று சொல்லுங்கள் — கூடுதல் சேவைகளைச் சேர்க்கவோ நீக்கவோ, தொகுப்பை மாற்றவோ, நேரத்தை மாற்றவோ, மொத்தத் தொகையைச் சொல்லவோ முடியும்.',
}

const HELP: Bi = {
  en: 'You can say things like “add drone”, “remove the LED wall”, “switch to Heirloom”, “make it 8 hours” or “what’s my total?”.',
  ta: '“ட்ரோன் சேர்”, “LED திரை வேண்டாம்”, “பரம்பரைப் பொக்கிஷம் தொகுப்பு”, “8 மணி நேரம்”, “மொத்தம் எவ்வளவு?” என்று சொல்லலாம்.',
}

interface Msg {
  id: number
  from: 'bot' | 'user'
  text: Bi | string
}

const join = (parts: Bi[]): Bi => ({ en: parts.map(p => p.en).join(' '), ta: parts.map(p => p.ta).join(' ') })
const addonName = (k: AddonKey) => ADDONS.find(a => a.key === k)!.name

/** Applies intents to the booking draft and builds a bilingual reply. */
function runIntents(intents: Intent[]): { reply: Bi; goNext: boolean } {
  const { draft, updateDraft } = useStore.getState()
  let addons = [...draft.addons]
  let packageId = draft.packageId
  let hours = draft.durationHours
  const parts: Bi[] = []
  let changed = false
  let goNext = false

  for (const i of intents) {
    switch (i.kind) {
      case 'addon': {
        const a = ADDONS.find(x => x.key === i.key)!
        const name = a.name
        if (i.op === 'add') {
          if (i.key === 'drone' && packageId === 'heirloom') {
            parts.push({ en: 'Drone coverage is already part of Heirloom.', ta: 'ட்ரோன் படப்பிடிப்பு ஏற்கனவே பரம்பரைப் பொக்கிஷம் தொகுப்பில் உள்ளது.' })
          } else if (addons.includes(i.key)) {
            parts.push({ en: `${name.en} is already in your cart.`, ta: `${name.ta} ஏற்கனவே உள்ளது.` })
          } else {
            addons.push(i.key)
            changed = true
            parts.push({ en: `Added ${name.en} (+${formatINR(a.price)}).`, ta: `${name.ta} சேர்க்கப்பட்டது (+${formatINR(a.price)}).` })
          }
        } else if (addons.includes(i.key)) {
          addons = addons.filter(x => x !== i.key)
          changed = true
          parts.push({ en: `Removed ${name.en}.`, ta: `${name.ta} நீக்கப்பட்டது.` })
        } else {
          parts.push({ en: `${name.en} wasn’t in your cart.`, ta: `${name.ta} உங்கள் பட்டியலில் இல்லை.` })
        }
        break
      }
      case 'package': {
        const p = PACKAGES.find(x => x.key === i.key)!
        if (packageId === i.key) {
          parts.push({ en: `You’re already on ${p.name.en}.`, ta: `ஏற்கனவே ${p.name.ta} தொகுப்பில் இருக்கிறீர்கள்.` })
        } else {
          packageId = i.key
          changed = true
          parts.push({ en: `Switched to the ${p.name.en} package.`, ta: `${p.name.ta} தொகுப்புக்கு மாற்றப்பட்டது.` })
          if (i.key === 'heirloom' && addons.includes('drone')) {
            addons = addons.filter(x => x !== 'drone')
            parts.push({ en: 'It already includes drone coverage, so I removed the extra drone.', ta: 'அதில் ட்ரோன் ஏற்கனவே உள்ளதால், கூடுதல் ட்ரோனை நீக்கினேன்.' })
          }
        }
        break
      }
      case 'hours':
      case 'hoursDelta': {
        const want = i.kind === 'hours' ? i.hours : hours + i.delta
        const next = Math.min(MAX_HOURS, Math.max(MIN_HOURS, want))
        if (next !== want) parts.push({ en: `We cover ${MIN_HOURS} to ${MAX_HOURS} hours.`, ta: `${MIN_HOURS} முதல் ${MAX_HOURS} மணி நேரம் வரை படம்பிடிப்போம்.` })
        if (next !== hours) {
          hours = next
          changed = true
        }
        parts.push({ en: `Coverage set to ${next} hours.`, ta: `படப்பிடிப்பு நேரம் ${next} மணி நேரமாக அமைக்கப்பட்டது.` })
        break
      }
      case 'clearAddons':
        if (addons.length) {
          addons = []
          changed = true
          parts.push({ en: 'Cleared all extras.', ta: 'அனைத்து கூடுதல் சேவைகளும் நீக்கப்பட்டன.' })
        } else {
          parts.push({ en: 'There are no extras to remove.', ta: 'நீக்குவதற்குக் கூடுதல் சேவைகள் எதுவும் இல்லை.' })
        }
        break
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

  if (changed) updateDraft({ addons, packageId, durationHours: hours })

  const quote = quoteFor({ ...draft, addons, packageId, durationHours: hours })
  const asksTotal = intents.some(i => i.kind === 'total')
  if (quote && asksTotal) {
    const pkg = PACKAGES.find(p => p.key === packageId)!
    const extras: Bi = { en: addons.map(a => addonName(a).en).join(', '), ta: addons.map(a => addonName(a).ta).join(', ') }
    parts.push({
      en: `Your estimated total is ${formatINR(quote.total)} — ${pkg.name.en} package, ${hours} hours${addons.length ? `, plus ${extras.en}` : ''}.`,
      ta: `உங்கள் மதிப்பிடப்பட்ட மொத்தம் ${formatINR(quote.total)} — ${pkg.name.ta} தொகுப்பு, ${hours} மணி நேரம்${addons.length ? `, கூடவே ${extras.ta}` : ''}.`,
    })
  } else if (quote && changed) {
    parts.push({ en: `Your total is now ${formatINR(quote.total)}.`, ta: `இப்போது மொத்தம் ${formatINR(quote.total)}.` })
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
  const addons = useStore(s => s.draft.addons)
  const pkg = useStore(s => s.draft.packageId)
  const hours = useStore(s => s.draft.durationHours)
  const list: Bi[] = []
  list.push(
    addons.includes('drone') || pkg === 'heirloom'
      ? { en: 'Add a same-day reel', ta: 'அன்றே எடிட் ரீல் சேர்' }
      : { en: 'Add drone', ta: 'ட்ரோன் சேர்' },
  )
  list.push(addons.includes('ledwall') ? { en: 'Remove the LED wall', ta: 'LED திரை வேண்டாம்' } : { en: 'Add LED wall', ta: 'LED திரை வேண்டும்' })
  list.push(hours === 8 ? { en: 'Make it 10 hours', ta: '10 மணி நேரம்' } : { en: 'Make it 8 hours', ta: '8 மணி நேரம்' })
  list.push(pkg === 'heirloom' ? { en: 'Switch to Signature', ta: 'சிக்னேச்சர் தொகுப்பு' } : { en: 'Switch to Heirloom', ta: 'பரம்பரைப் பொக்கிஷம் தொகுப்பு' })
  list.push({ en: 'Extra album for parents', ta: 'கூடுதல் ஆல்பம் வேண்டும்' })
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

  const toggleMic = () => {
    if (listener.listening) return listener.stop()
    stopSpeaking()
    listener.start()
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
      </section>
    </div>
  )
}
