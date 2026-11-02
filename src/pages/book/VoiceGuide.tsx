import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Icon } from '../../components/Icon'
import { EASE } from '../../components/motion'
import { KolamCorner } from '../../components/tamil'
import { useLang, useT, type Bi, type Lang } from '../../lib/i18n'
import { useStore } from '../../lib/store'
import { DISTRICTS } from '../../lib/data'
import type { Quote } from '../../lib/pricing'
import { geminiText, hasGemini, parseJsonLoose, type ChatTurn } from '../../lib/gemini'
import { say, stopSpeaking, unlockAudio, useListener, usePlayer, voiceEngine } from '../../lib/speech'
import { MIC_BLOCKED, STEP_LABELS, STEP_PATHS, micBlocked, normalizePath, stepIndexOf, useQuote, useStepAction, useTypingInField } from './shared'
import { GUIDE_CLIPS, STEP_CLIPS, spokenINR, type ClipId } from './voiceScripts'
import { useVoicePage, type ActionArgs, type VoiceAction, type VoicePage, type VoiceReply } from './voicePage'

/*
 * The booking voice guide: a floating assistant that narrates each step (Tamil or
 * English), listens for spoken commands, understands them with Gemini (or local
 * rules when offline) and runs the actions the current page registered through
 * useRegisterVoicePage. Mounted once in BookLayout so it follows the visitor
 * through every step.
 */

const OWNER = 'voice-guide'
const STORAGE_KEY = 'ttc-voice-guide'

const copy = {
  title: { en: 'Voice guide', ta: 'குரல் வழிகாட்டி' },
  fab: { en: 'Voice guide', ta: 'குரல் வழிகாட்டி' },
  open: { en: 'Open the voice guide', ta: 'குரல் வழிகாட்டியைத் திற' },
  close: { en: 'Close', ta: 'மூடு' },
  gemini: { en: 'Gemini voice', ta: 'Gemini குரல்' },
  device: { en: 'Device voice', ta: 'சாதனக் குரல்' },
  auto: { en: 'Auto', ta: 'தானாக' },
  autoLong: { en: 'Guide me on every step', ta: 'ஒவ்வொரு படியிலும் வழிகாட்டு' },
  start: { en: 'Start the voice guide', ta: 'குரல் வழிகாட்டியைத் தொடங்கு' },
  playStep: { en: 'Explain this step', ta: 'இந்தப் படியை விளக்கு' },
  stop: { en: 'Stop', ta: 'நிறுத்து' },
  step: { en: 'Step', ta: 'படி' },
  of: { en: 'of', ta: '/' },
  done: { en: 'Enquiry sent', ta: 'விசாரணை அனுப்பப்பட்டது' },
  preparing: { en: 'Preparing voice…', ta: 'குரல் தயாராகிறது…' },
  speaking: { en: 'Speaking…', ta: 'பேசுகிறேன்…' },
  thinking: { en: 'Thinking…', ta: 'யோசிக்கிறேன்…' },
  mic: { en: 'Tap and speak', ta: 'தொட்டுப் பேசுங்கள்' },
  micLabel: { en: 'Speak to the guide', ta: 'வழிகாட்டியிடம் பேசுங்கள்' },
  stopMic: { en: 'Stop listening', ta: 'கேட்பதை நிறுத்து' },
  listening: { en: 'Listening…', ta: 'கேட்கிறேன்…' },
  transcribing: { en: 'Understanding…', ta: 'புரிந்துகொள்கிறேன்…' },
  hint: { en: 'Tamil or English — just talk', ta: 'தமிழிலோ ஆங்கிலத்திலோ பேசுங்கள்' },
  type: { en: 'Type instead', ta: 'தட்டச்சு செய்ய' },
  placeholder: { en: 'Type what you would say…', ta: 'சொல்ல நினைப்பதைத் தட்டச்சு செய்யுங்கள்…' },
  send: { en: 'Send', ta: 'அனுப்பு' },
  you: { en: 'You', ta: 'நீங்கள்' },
  hears: { en: 'hears', ta: 'கேட்கும் மொழி' },
  noMic: { en: 'Voice input is not available in this browser — type instead.', ta: 'இந்த உலாவியில் குரல் உள்ளீடு இல்லை — தட்டச்சு செய்யுங்கள்.' },
  log: { en: 'Conversation', ta: 'உரையாடல்' },
  trySaying: { en: 'Try saying', ta: 'இப்படிச் சொல்லிப் பாருங்கள்' },
  language: { en: 'Language', ta: 'மொழி' },
}

const GENERIC_EXAMPLES: Bi[] = [
  { en: 'Read my total', ta: 'மொத்தம் எவ்வளவு?' },
  { en: 'Continue', ta: 'அடுத்து' },
  { en: 'Switch to Tamil', ta: 'ஆங்கிலத்தில் பேசு' },
]

const STEP_KEYS = ['district', 'event', 'venue', 'package', 'details'] as const

interface Interpretation {
  reply: string
  actions: { name: string; args: ActionArgs }[]
  clip?: ClipId
}

interface Msg {
  id: number
  from: 'bot' | 'user'
  text: string
}

const normName = (s: string) => s.toLowerCase().trim().replace(/[\s-]+/g, '_')

function quoteSpeech(q: Quote | null, lang: Lang): string {
  if (!q) return lang === 'ta' ? 'முதலில் நிகழ்வைத் தேர்ந்தெடுங்கள்; பிறகு விலையைச் சொல்கிறேன்.' : 'Pick an occasion first and I will tell you the price.'
  const parts = q.sections.filter(s => s.amount > 0 && s.key !== 'tax').map(s => `${s.name[lang]} ${spokenINR(s.amount, lang)}`)
  return lang === 'ta'
    ? `உங்கள் மதிப்பிடப்பட்ட மொத்தம் ${spokenINR(q.total, lang)}, GST தவிர.${parts.length ? ` இதில் ${parts.join(', ')} அடங்கும்.` : ''}`
    : `Your estimated total is ${spokenINR(q.total, lang)}, before GST.${parts.length ? ` That includes ${parts.join(', ')}.` : ''}`
}

function flatten(r: VoiceReply, lang: Lang): { text: string; clip?: string } {
  if (!r) return { text: '' }
  if (typeof r === 'string') return { text: r }
  if ('text' in r && !('en' in r)) return { text: typeof r.text === 'string' ? r.text : r.text[lang], clip: r.clip }
  return { text: (r as Bi)[lang] }
}

// ─── Understanding ───────────────────────────────────────────────────────────

function buildSystem(lang: Lang, step: number, page: VoicePage | null, quote: Quote | null, actions: VoiceAction[]): string {
  const ui = lang === 'ta' ? 'Tamil' : 'English'
  const where = step >= 0 ? `Step ${step + 1} of 5 — ${STEP_LABELS[step].en}.` : 'The confirmation screen (the enquiry has been sent).'
  const tools = actions.map(a => ({ name: a.name, description: a.description, ...(a.params ? { args: a.params } : {}) }))
  return [
    'You are the voice guide of "The Treasure Capture Events", a wedding and event photography studio in Tamil Nadu (head studio in Madurai).',
    'The visitor is booking a shoot on the website, step by step: District → Event → Venue & date → Package → Your details.',
    'You receive what they said (from speech-to-text, so expect small errors) and respond with JSON only.',
    '',
    `Site language right now: ${ui}. Current screen: ${where}`,
    page ? `On screen: ${page.context()}` : '',
    quote ? `Current estimate: ₹${Math.round(quote.total)} before GST (do not quote this yourself; use read_quote).` : '',
    '',
    'Actions you can trigger, by exact name:',
    JSON.stringify(tools),
    '',
    'Respond with exactly this JSON and nothing else:',
    '{"reply": "<what to say aloud>", "actions": [{"name": "<action name>", "args": {}}]}',
    '',
    'Rules:',
    `- Reply in the language the visitor spoke. If they mixed Tamil and English, reply in ${ui}. Tamil replies must be in Tamil script, polite spoken Tamil (நீங்கள் form), never transliterated.`,
    '- One short sentence. The visitor hears it; they do not read it.',
    '- The app speaks its own confirmation after every action (it reads back names, numbers, totals and summaries). When you trigger an action, keep "reply" to a brief acknowledgement or an empty string. Never state prices, totals or booking details yourself; trigger read_quote or read_summary instead.',
    '- For switch_language, explain_step and help, leave "reply" empty.',
    '- Mobile numbers: convert spoken digits in Tamil or English words (ஒன்பது = 9, "double two" = 22) into one plain 10-digit string.',
    '- Names: English letters, capitalised (Priya Karthik). Emails: lowercase, "at" → @, "dot" → ".".',
    '- Trigger send_enquiry only when they clearly ask to send, submit or book. Never trigger go_next or send_enquiry on a guess.',
    '- If you cannot understand, return no actions and briefly ask them to repeat.',
  ]
    .filter(Boolean)
    .join('\n')
}

async function interpretWithGemini(text: string, lang: Lang, step: number, page: VoicePage | null, quote: Quote | null, actions: VoiceAction[], history: ChatTurn[]): Promise<Interpretation | null> {
  const raw = await geminiText({ system: buildSystem(lang, step, page, quote, actions), input: text, history, temperature: 0.2, json: true })
  const parsed = parseJsonLoose<{ reply?: unknown; actions?: unknown }>(raw)
  if (!parsed) return null
  const list = Array.isArray(parsed.actions) ? (parsed.actions as unknown[]) : []
  const acts = list
    .filter((a): a is { name: string; args?: unknown } => !!a && typeof a === 'object' && typeof (a as { name?: unknown }).name === 'string')
    .map(a => ({ name: normName(a.name), args: (a.args && typeof a.args === 'object' ? a.args : {}) as ActionArgs }))
    .filter(a => actions.some(x => x.name === a.name))
  return { reply: typeof parsed.reply === 'string' ? parsed.reply.trim() : '', actions: acts }
}

/** Rule-based fallback used offline or when Gemini is not configured. */
function interpretLocally(raw: string, lang: Lang, step: number, actions: VoiceAction[]): Interpretation {
  const text = raw.toLowerCase().replace(/[’‘]/g, "'").trim()
  const has = (name: string) => actions.some(a => a.name === name)
  const out: Interpretation = { reply: '', actions: [] }
  const act = (name: string, args: ActionArgs = {}) => {
    if (has(name)) out.actions.push({ name, args })
  }

  if (/\b(tamil)\b|தமிழ்/.test(text) && !/english|ஆங்கில/.test(text)) act('switch_language', { lang: 'ta' })
  else if (/\b(english)\b|ஆங்கில/.test(text)) act('switch_language', { lang: 'en' })
  if (/^(stop|quiet|shh|நிறுத்து|போதும்)\b/.test(text)) act('stop')
  if (/\bhelp\b|what can (i|you)|உதவி|என்ன சொல்ல/.test(text)) act('help')
  if (/\b(repeat|again|explain|what (do|should) i do)\b|மீண்டும்|திரும்ப|விளக்கு/.test(text)) act('explain_step')
  if (/\b(total|price|cost|how much|quote|estimate)\b|மொத்தம்|எவ்வளவு|விலை|கட்டணம்/.test(text)) act('read_quote')

  if (step === 0) {
    const d = DISTRICTS.find(x => text.includes(x.name.en.toLowerCase()) || text.includes(x.name.ta) || (x.key === 'coimbatore' && /kovai|கோவை/.test(text)))
    if (d) act('choose_district', { district: d.key })
  }

  const goto = STEP_KEYS.findIndex((_, i) => text.includes(STEP_LABELS[i].en.toLowerCase().split(' ')[0]) || text.includes(STEP_LABELS[i].ta.split(' ')[0]))
  if (goto >= 0 && /\b(go to|open|take me|change|edit)\b|செல்|மாற்று|திருத்து/.test(text)) act('go_to_step', { step: STEP_KEYS[goto] })
  else if (/\b(back|previous)\b|பின் செல்|முந்தைய|பின்னால்/.test(text)) act('go_back')
  else if (/\b(next|continue|proceed)\b|அடுத்து|தொடர/.test(text)) act('go_next')

  const name = /(?:my name is|i am|i'm|name is|this is)\s+([a-z][a-z .'-]{1,40})/.exec(text) ?? /என் பெயர்\s+(\S+(?:\s+\S+)?)/.exec(raw) ?? /பெயர்\s+(\S+)/.exec(raw)
  if (name) act('set_name', { name: name[1].trim().replace(/\b\w/g, c => c.toUpperCase()) })
  const mobile = /(?:\+?91[\s-]?)?([6-9](?:[\s-]?\d){9})(?!\d)/.exec(text)
  if (mobile) act('set_mobile', { mobile: mobile[1].replace(/\D/g, '') })
  const email = /[\w.+-]+@[\w-]+\.[\w.-]+/.exec(text)
  if (email) act('set_email', { email: email[0] })
  if (/\b(summary|read (it|back|everything)|review)\b|சுருக்கம்|வாசி/.test(text)) act('read_summary')
  if (/\b(accept|agree)\b|ஏற்கிறேன்|ஒப்புக்/.test(text)) act('accept_terms')
  if (/\b(send|submit|book it|confirm|place)\b|அனுப்பு|பதிவு செய்|சமர்ப்பி/.test(text)) act('send_enquiry')

  if (!out.actions.length) {
    out.reply = GUIDE_CLIPS['didnt-catch'][lang]
    out.clip = 'didnt-catch'
  }
  return out
}

// ─── Component ───────────────────────────────────────────────────────────────

export function VoiceGuide() {
  const lang = useLang()
  const t = useT(copy)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const setLang = useStore(s => s.setLang)
  const updateDraft = useStore(s => s.updateDraft)
  const quote = useQuote()
  const page = useVoicePage(s => s.page)
  const player = usePlayer()

  const path = normalizePath(pathname)
  const step = stepIndexOf(path)
  const confirmed = path.startsWith('/book/confirmed')
  const clipId: ClipId | null = confirmed ? 'confirmed' : step >= 0 ? STEP_CLIPS[step] : null

  const [open, setOpen] = useState(false)
  const [micDenied, setMicDenied] = useState(false)
  // Phones: sit clear of the bottom dock (taller while it shows a hint) and step aside while the keyboard is up.
  const dockHint = useStepAction(s => !!(s.action?.disabled && s.action.hint))
  const fieldFocused = useTypingInField()
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const nextId = useRef(1)
  const history = useRef<ChatTurn[]>([])
  const followUp = useRef<ClipId | null>(null)
  const spokenFor = useRef<string | null>(null)
  const logRef = useRef<HTMLDivElement>(null)

  // Latest values for the action closures, which are created once.
  const ctx = useRef({ step, clipId, quote, navigate, setLang, updateDraft })
  ctx.current = { step, clipId, quote, navigate, setLang, updateDraft }

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0')
    } catch {
      /* private mode */
    }
  }, [enabled])

  const narrate = useCallback((id: ClipId) => {
    const l = useStore.getState().lang
    return say(GUIDE_CLIPS[id][l], l, { clip: id, owner: OWNER })
  }, [])

  // Narrate each step as the visitor arrives on it.
  useEffect(() => {
    if (!clipId || !enabled) return
    if (spokenFor.current === clipId) return
    spokenFor.current = clipId
    const timer = window.setTimeout(() => void narrate(clipId), 700)
    return () => window.clearTimeout(timer)
  }, [clipId, enabled, narrate])

  const generic = useMemo<VoiceAction[]>(() => {
    const districts = DISTRICTS.map(d => `${d.key} (${d.name.en} / ${d.name.ta})`).join(', ')
    const list: VoiceAction[] = [
      {
        name: 'choose_district',
        description: `Select the district of the celebration and move on (district step only). One of: ${districts}.`,
        params: { district: 'district key' },
        run: a => {
          const d = DISTRICTS.find(x => x.key === String(a.district ?? '').toLowerCase())
          if (!d) return
          ctx.current.updateDraft({ district: d.key })
          window.setTimeout(() => ctx.current.navigate('/book/event'), 300)
          return { en: `${d.name.en} it is.`, ta: `${d.name.ta}, சரி.` }
        },
      },
      {
        name: 'go_next',
        description: 'Continue to the next booking step. Only when the visitor asks to continue / next / proceed.',
        run: () => {
          const a = useStepAction.getState().action
          if (a && !a.disabled) {
            a.onNext()
            return
          }
          if (a?.disabled && a.hint) return a.hint
          const s = ctx.current.step
          if (s >= 0 && s < STEP_PATHS.length - 1) ctx.current.navigate(STEP_PATHS[s + 1])
        },
      },
      {
        name: 'go_back',
        description: 'Go back to the previous booking step.',
        run: () => {
          const s = ctx.current.step
          if (s > 0) ctx.current.navigate(STEP_PATHS[s - 1])
        },
      },
      {
        name: 'go_to_step',
        description: 'Jump to a specific booking step to change something.',
        params: { step: 'district | event | venue | package | details' },
        run: a => {
          const i = STEP_KEYS.indexOf(String(a.step ?? '') as (typeof STEP_KEYS)[number])
          if (i >= 0) ctx.current.navigate(STEP_PATHS[i])
        },
      },
      {
        name: 'switch_language',
        description: 'Switch the site and your voice between Tamil (ta) and English (en).',
        params: { lang: 'ta | en' },
        run: a => {
          const l = a.lang === 'ta' ? 'ta' : 'en'
          ctx.current.setLang(l)
          followUp.current = ctx.current.clipId
          return { text: GUIDE_CLIPS[l === 'ta' ? 'lang-ta' : 'lang-en'], clip: l === 'ta' ? 'lang-ta' : 'lang-en' }
        },
      },
      {
        name: 'explain_step',
        description: 'Repeat or explain what to do on the current step.',
        run: () => {
          const id = ctx.current.clipId
          return id ? { text: GUIDE_CLIPS[id], clip: id } : undefined
        },
      },
      {
        name: 'read_quote',
        description: 'Read out the current estimated price and its breakdown.',
        run: () => quoteSpeech(ctx.current.quote, useStore.getState().lang),
      },
      { name: 'help', description: 'Tell the visitor what they can say.', run: () => ({ text: GUIDE_CLIPS.help, clip: 'help' }) },
      {
        name: 'stop',
        description: 'Stop talking.',
        run: () => {
          stopSpeaking()
          return ''
        },
      },
    ]
    return list
  }, [])

  const handle = useCallback(
    async (raw: string) => {
      const text = raw.trim()
      if (!text) return
      stopSpeaking()
      setInput('')
      setMessages(m => [...m.slice(-7), { id: nextId.current++, from: 'user', text }])
      setThinking(true)

      const current = useVoicePage.getState().page
      const all = [...generic, ...(current?.actions ?? [])]
      const startLang = useStore.getState().lang
      let interp: Interpretation | null = null
      if (hasGemini()) {
        try {
          interp = await interpretWithGemini(text, startLang, ctx.current.step, current, ctx.current.quote, all, history.current)
        } catch (e) {
          console.warn('[voice] Gemini could not interpret this; using local rules:', e)
        }
      }
      if (!interp) interp = interpretLocally(text, startLang, ctx.current.step, all)

      const spoken: string[] = []
      let clip: string | undefined = interp.clip
      for (const a of interp.actions) {
        const def = all.find(x => x.name === a.name)
        if (!def) continue
        try {
          const r = flatten(await def.run(a.args ?? {}), useStore.getState().lang)
          if (r.text) spoken.push(r.text)
          if (r.clip && interp.actions.length === 1 && !interp.reply) clip = r.clip
        } catch (e) {
          console.warn(`[voice] action ${a.name} failed:`, e)
        }
      }

      const finalLang = useStore.getState().lang
      const reply = [interp.reply, ...spoken].filter(Boolean).join(' ') || GUIDE_CLIPS['didnt-catch'][finalLang]
      setThinking(false)
      setMessages(m => [...m.slice(-7), { id: nextId.current++, from: 'bot', text: reply }])
      history.current = [...history.current.slice(-5), { role: 'user', text }, { role: 'model', text: reply }]

      await say(reply, finalLang, { clip: spoken.length || interp.reply ? clip : 'didnt-catch', owner: OWNER })
      const next = followUp.current
      followUp.current = null
      if (next && enabled) {
        spokenFor.current = next
        void narrate(next)
      }
    },
    [generic, enabled, narrate],
  )

  const listener = useListener(lang, text => void handle(text))

  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages, thinking, listener.interim])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const startGuide = () => {
    unlockAudio()
    setEnabled(true)
    setOpen(true)
    const id = clipId
    if (id) spokenFor.current = id
    void (async () => {
      await narrate('welcome')
      if (id && ctx.current.clipId === id) void narrate(id)
    })()
  }

  const toggleAuto = () => {
    if (enabled) {
      stopSpeaking()
      setEnabled(false)
    } else startGuide()
  }

  const playStep = () => {
    unlockAudio()
    if (player.owner === OWNER && (player.speaking || player.loading)) return stopSpeaking()
    if (clipId) {
      spokenFor.current = clipId
      void narrate(clipId)
    }
  }

  const switchLang = (l: Lang) => {
    if (l === lang) return
    setLang(l)
    if (enabled && clipId) {
      spokenFor.current = clipId
      window.setTimeout(() => void narrate(clipId), 900)
    }
  }

  const toggleMic = () => {
    unlockAudio()
    if (listener.listening) return listener.stop()
    stopSpeaking()
    listener.start()
    void micBlocked().then(setMicDenied)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    unlockAudio()
    void handle(input)
  }

  const mine = player.owner === OWNER
  const talking = mine && player.speaking
  const loading = mine && player.loading
  const busy = talking || loading || listener.listening || listener.transcribing || thinking
  const [typing, setTyping] = useState(false)
  const examples = useMemo(() => {
    const list = [...(page?.examples ?? []), ...GENERIC_EXAMPLES]
    if (step === 0) list.unshift({ en: 'Madurai', ta: 'மதுரை' })
    return list
  }, [page, step])

  const status = listener.listening
    ? t.listening
    : listener.transcribing
      ? t.transcribing
      : thinking
        ? t.thinking
        : loading
          ? t.preparing
          : talking
            ? t.speaking
            : `${voiceEngine() === 'gemini' ? t.gemini : t.device} · ${t.hears} ${lang === 'ta' ? 'தமிழ்' : 'English'}`
  const stepTitle = confirmed ? t.done : step >= 0 ? `${t.step} ${step + 1} ${t.of} 5 · ${STEP_LABELS[step][lang]}` : t.title
  const caption = mine && player.caption ? player.caption : clipId ? GUIDE_CLIPS[clipId][lang] : ''

  return (
    <div className={`pointer-events-none fixed ${dockHint ? 'bottom-[calc(8.25rem+env(safe-area-inset-bottom))]' : 'bottom-[calc(5.75rem+env(safe-area-inset-bottom))]'} right-3 z-50 flex flex-col items-end gap-3 md:bottom-[5.5rem] md:right-5 lg:bottom-6 lg:right-6`}>
      <AnimatePresence>
        {open && (
          <motion.section
            key="panel"
            role="dialog"
            aria-label={t.title}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="glass-strong pointer-events-auto relative flex w-[min(92vw,384px)] flex-col overflow-hidden rounded-[28px] shadow-soft"
          >
            {lang === 'ta' && <KolamCorner className="pointer-events-none absolute -right-1 -top-1 rotate-90 opacity-40" />}

            {/* Header */}
            <div className="flex items-center gap-3 px-4 pb-3 pt-4">
              <Orb talking={talking} loading={loading || thinking || listener.transcribing} listening={listener.listening} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-[1.12rem] font-semibold leading-tight text-ink">{t.title}</p>
                <p className="truncate text-[11.5px] text-ink/50" aria-live="polite">{status}</p>
              </div>
              <div className="flex items-center rounded-full bg-ink/[0.06] p-0.5" role="group" aria-label={t.language}>
                {(['en', 'ta'] as Lang[]).map(l => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => switchLang(l)}
                    aria-pressed={lang === l}
                    className={`h-8 rounded-full px-2.5 text-[12px] font-semibold transition cursor-pointer ${lang === l ? 'bg-ink text-white' : 'text-ink/55 hover:text-ink'}`}
                  >
                    {l === 'en' ? 'EN' : 'தமிழ்'}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label={t.close} className="flex h-9 w-9 items-center justify-center rounded-full text-ink/50 transition hover:bg-ink/[0.06] hover:text-ink cursor-pointer">
                <Icon name="x" size={17} />
              </button>
            </div>

            {/* Current step: what the guide is saying, with playback progress */}
            <div className="mx-3 overflow-hidden rounded-[22px] bg-ink text-white">
              <div className="relative px-4 pb-3 pt-3.5">
                <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-ruby/50 blur-3xl" />
                <div className="relative flex items-start justify-between gap-3">
                  <p className="t-label text-white/55">{stepTitle}</p>
                  <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/60" title={t.autoLong}>
                    {t.auto}
                    <input type="checkbox" checked={enabled} onChange={toggleAuto} className="peer sr-only" aria-label={t.autoLong} />
                    <span aria-hidden="true" className={`relative inline-block h-5 w-9 rounded-full transition-colors peer-focus-visible:ring-4 peer-focus-visible:ring-white/30 ${enabled ? 'bg-ruby-bright' : 'bg-white/20'}`}>
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                    </span>
                  </label>
                </div>
                <div className="relative mt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={playStep}
                    disabled={!clipId}
                    aria-label={talking || loading ? t.stop : t.playStep}
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition cursor-pointer active:scale-95 disabled:opacity-40 ${talking || loading ? 'bg-white text-ink' : 'bg-ruby text-white shadow-ruby hover:bg-ruby-bright'}`}
                  >
                    {loading ? (
                      <motion.span className="h-4 w-4 rounded-full border-2 border-ink/30 border-t-ink" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
                    ) : (
                      <Icon name={talking ? 'pause' : 'play'} size={18} className={talking ? '' : 'translate-x-px'} />
                    )}
                  </button>
                  <p className={`line-clamp-3 min-w-0 flex-1 text-[13px] leading-snug ${talking || loading ? 'text-white' : 'text-white/60'}`}>{caption}</p>
                </div>
              </div>
              <div className="h-[3px] w-full bg-white/10" aria-hidden="true">
                <motion.div className="h-full bg-gradient-to-r from-ruby-bright to-white/90" initial={false} animate={{ width: talking ? `${Math.max(2, player.progress * 100)}%` : '0%' }} transition={{ duration: 0.25, ease: 'linear' }} />
              </div>
            </div>

            {/* Conversation */}
            <div ref={logRef} data-lenis-prevent role="log" aria-live="polite" aria-label={t.log} className={`no-scrollbar space-y-2 overflow-y-auto overscroll-contain px-4 transition-all ${messages.length || thinking || listener.interim ? 'max-h-[min(200px,30dvh)] py-3' : 'max-h-0 py-0'}`}>
              <AnimatePresence initial={false}>
                {messages.map(m => {
                  const user = m.from === 'user'
                  return (
                    <motion.div key={m.id} layout="position" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE }} className={`flex ${user ? 'justify-end' : 'justify-start'}`}>
                      <p className={`max-w-[88%] whitespace-pre-line break-words rounded-[18px] px-3.5 py-2 text-[13.5px] leading-relaxed ${user ? 'rounded-br-md bg-ruby text-white' : 'rounded-bl-md border border-white/80 bg-white/85 text-ink/85'}`}>
                        <span className="sr-only">{user ? `${t.you}: ` : `${t.title}: `}</span>
                        {m.text}
                      </p>
                    </motion.div>
                  )
                })}
                {listener.interim && (
                  <motion.div key="interim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-end">
                    <p className="max-w-[88%] rounded-[18px] rounded-br-md border border-dashed border-ruby/40 px-3.5 py-2 text-[13.5px] italic text-ink/60">{listener.interim}</p>
                  </motion.div>
                )}
                {(thinking || listener.transcribing) && (
                  <motion.div key="typing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex">
                    <span className="flex items-center gap-1 rounded-[18px] rounded-bl-md bg-white/85 px-3.5 py-3" aria-hidden="true">
                      {[0, 1, 2].map(i => (
                        <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-ruby/60" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.12 }} />
                      ))}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Things to say */}
            <p className="t-label px-4 pb-1.5 pt-3 text-ink/45">{t.trySaying}</p>
            <div className="no-scrollbar mask-fade-x flex gap-2 overflow-x-auto px-3 pb-3" data-lenis-prevent>
              {examples.map(s => (
                <button
                  key={s.en}
                  type="button"
                  onClick={() => {
                    unlockAudio()
                    void handle(s[lang])
                  }}
                  className="h-9 shrink-0 rounded-full border border-ink/10 bg-white/70 px-3.5 text-[12.5px] font-medium text-ink/70 transition hover:border-ruby/40 hover:text-ruby cursor-pointer first:ml-1 last:mr-1"
                >
                  “{s[lang]}”
                </button>
              ))}
            </div>

            {/* Talk bar */}
            <div className="border-t hairline px-3 pb-3 pt-3">
              <AnimatePresence initial={false}>
                {typing && (
                  <motion.form key="typebar" onSubmit={submit} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }} className="overflow-hidden">
                    <div className="mb-3 flex items-center gap-2">
                      <label className="sr-only" htmlFor="voice-guide-input">
                        {t.placeholder}
                      </label>
                      <input
                        id="voice-guide-input"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder={t.placeholder}
                        autoComplete="off"
                        enterKeyHint="send"
                        autoFocus
                        className="h-11 min-w-0 flex-1 rounded-full border border-ink/10 bg-white/80 px-4 text-base text-ink outline-none transition placeholder:text-ink/35 focus:border-ruby focus:ring-4 focus:ring-ruby/10 md:text-[14px]"
                      />
                      <button type="submit" disabled={!input.trim()} aria-label={t.send} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-white transition hover:bg-ink-3 active:scale-95 disabled:opacity-30 cursor-pointer">
                        <Icon name="send" size={17} />
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center">
                <button type="button" onClick={() => setTyping(v => !v)} aria-pressed={typing} className={`justify-self-start inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium transition cursor-pointer ${typing ? 'bg-ink text-white' : 'text-ink/55 hover:bg-ink/[0.05] hover:text-ink'}`}>
                  <Icon name="edit" size={14} />
                  {t.type}
                </button>
                <button
                  type="button"
                  onClick={toggleMic}
                  disabled={!listener.supported}
                  aria-label={listener.listening ? t.stopMic : t.micLabel}
                  aria-pressed={listener.listening}
                  title={listener.supported ? t.micLabel : t.noMic}
                  className={`relative flex h-16 w-16 items-center justify-center rounded-full text-white transition-all duration-300 cursor-pointer active:scale-95 disabled:cursor-not-allowed disabled:bg-ink/15 disabled:shadow-none ${listener.listening ? 'bg-ruby-deep scale-105' : 'bg-ruby shadow-ruby hover:bg-ruby-bright'}`}
                >
                  {listener.listening && (
                    <>
                      <span className="absolute inset-0 rounded-full bg-ruby/50 animate-pulse-ring" />
                      <span className="absolute inset-0 rounded-full bg-ruby/30 animate-pulse-ring [animation-delay:0.6s]" />
                    </>
                  )}
                  <Icon name={listener.listening ? 'pause' : 'mic'} size={24} className="relative" />
                </button>
                <p className="justify-self-end max-w-[110px] text-right text-[11.5px] leading-tight text-ink/45">{listener.supported ? (listener.listening ? t.listening : t.hint) : t.noMic}</p>
              </div>
              {micDenied && !listener.listening && (
                <p role="alert" className="mt-2 flex items-start gap-2 rounded-2xl bg-ruby-soft/70 px-3 py-2 text-[12px] leading-snug text-ruby-deep">
                  <Icon name="info" size={14} className="mt-px shrink-0" />
                  {MIC_BLOCKED[lang]}
                </p>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Launcher */}
      <div className={`pointer-events-auto flex items-center gap-2 ${fieldFocused && !open ? 'max-md:hidden' : ''}`}>
        <AnimatePresence>
          {!open && !enabled && (
            <motion.button
              key="hint"
              type="button"
              onClick={startGuide}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ delay: 1.2, duration: 0.5, ease: EASE }}
              className="glass hidden h-10 items-center gap-2 rounded-full pl-3.5 pr-4 text-[13px] font-medium text-ink shadow-soft cursor-pointer sm:flex"
            >
              <Icon name="volume" size={15} className="text-ruby" />
              {t.start}
            </motion.button>
          )}
        </AnimatePresence>
        <button
          type="button"
          onClick={() => (open ? setOpen(false) : enabled ? setOpen(true) : startGuide())}
          aria-expanded={open}
          aria-label={open ? t.close : t.open}
          className={`relative flex h-12 w-12 items-center justify-center rounded-full text-white shadow-ruby sm:h-14 sm:w-14 transition-all duration-300 cursor-pointer active:scale-95 ${open ? 'bg-ink' : 'bg-ruby hover:bg-ruby-bright'}`}
        >
          {busy && !open && <span className="absolute inset-0 rounded-full bg-ruby/50 animate-pulse-ring" />}
          {open ? <Icon name="x" size={22} className="relative" /> : talking ? <Bars className="relative" /> : <Icon name="mic" size={22} className="relative" />}
          <span className="sr-only">{t.fab}</span>
        </button>
      </div>
    </div>
  )
}

/** Three bars that dance while the guide speaks. */
function Bars({ className = '', light = true }: { className?: string; light?: boolean }) {
  return (
    <span className={`flex h-5 items-end gap-[3px] ${className}`} aria-hidden="true">
      {[0.55, 1, 0.7].map((peak, i) => (
        <motion.span
          key={i}
          className={`w-[4px] rounded-full ${light ? 'bg-white' : 'bg-ruby'}`}
          animate={{ height: ['30%', `${peak * 100}%`, '45%', `${peak * 80}%`, '30%'] }}
          transition={{ duration: 0.9 + i * 0.15, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </span>
  )
}

/** The guide's avatar: idle sparkle, dancing bars while speaking, rings while listening, spinner while working. */
function Orb({ talking, loading, listening }: { talking: boolean; loading: boolean; listening: boolean }) {
  return (
    <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-ruby-bright to-ruby-deep text-white shadow-ruby">
      {(talking || listening) && <span className="absolute inset-0 rounded-full bg-ruby/50 animate-pulse-ring" />}
      {listening && <span className="absolute inset-0 rounded-full bg-ruby/30 animate-pulse-ring [animation-delay:0.6s]" />}
      {loading ? (
        <motion.span className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
      ) : talking ? (
        <Bars className="relative" />
      ) : listening ? (
        <Icon name="mic" size={18} className="relative" />
      ) : (
        <Icon name="sparkle" size={18} className="relative" />
      )}
    </span>
  )
}
