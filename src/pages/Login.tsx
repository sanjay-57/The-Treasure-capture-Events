import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent, type ReactNode } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Icon, LogoMark } from '../components/Icon'
import { Button, Container, Eyebrow, LangImg } from '../components/ui'
import { EASE } from '../components/motion'
import { GopuramSkyline, KolamCorner, TamilOnly, Vilakku } from '../components/tamil'
import { useLang, useT } from '../lib/i18n'
import { DEMO_CLIENT_PHONE, normalizePhone, useStore } from '../lib/store'
import { toast, useDarkHero, useTitle } from '../lib/ui'

const copy = {
  title: { en: 'Client login', ta: 'வாடிக்கையாளர் நுழைவு' },
  eyebrow: { en: 'Client portal', ta: 'வாடிக்கையாளர் தளம்' },
  heroA: { en: 'Your story,', ta: 'உங்கள் கதை,' },
  heroB: { en: 'in one place.', ta: 'ஒரே இடத்தில்.' },
  heroLead: {
    en: 'Follow every stage of your order, choose favourites from your proofs and design the album you’ll keep for a lifetime.',
    ta: 'ஆர்டரின் ஒவ்வொரு கட்டத்தையும் பின்தொடருங்கள், பிடித்த படங்களைத் தேர்ந்தெடுங்கள், வாழ்நாள் முழுதும் போற்றும் ஆல்பத்தை வடிவமையுங்கள்.',
  },
  f1: { en: 'Live order tracking', ta: 'ஆர்டர் நிலை நேரலையில்' },
  f2: { en: 'Photo selection', ta: 'படத் தேர்வு' },
  f3: { en: 'Album design', ta: 'ஆல்பம் வடிவமைப்பு' },

  step1Title: { en: 'Sign in with your mobile', ta: 'கைபேசி எண்ணுடன் உள்நுழையுங்கள்' },
  step1Sub: { en: 'Use the number you booked with. We’ll text you a 4-digit code.', ta: 'பதிவு செய்த எண்ணைப் பயன்படுத்துங்கள். 4 இலக்கக் குறியீட்டை அனுப்புவோம்.' },
  mobile: { en: 'Mobile number', ta: 'கைபேசி எண்' },
  invalid: { en: 'Enter a valid 10-digit Indian mobile number.', ta: 'சரியான 10 இலக்க கைபேசி எண்ணை உள்ளிடுங்கள்.' },
  sendCode: { en: 'Send code', ta: 'குறியீட்டை அனுப்பு' },
  sending: { en: 'Sending…', ta: 'அனுப்புகிறது…' },

  step2Title: { en: 'Enter the 4-digit code', ta: '4 இலக்கக் குறியீட்டை உள்ளிடுங்கள்' },
  sentTo: { en: 'Sent by SMS to', ta: 'SMS மூலம் அனுப்பப்பட்டது:' },
  change: { en: 'Change', ta: 'மாற்று' },
  digit: { en: 'Digit', ta: 'இலக்கம்' },
  verifying: { en: 'Verifying…', ta: 'சரிபார்க்கிறது…' },
  verified: { en: 'Verified — opening your dashboard', ta: 'சரிபார்க்கப்பட்டது — உங்கள் பக்கம் திறக்கிறது' },
  resendIn: { en: 'Resend code in', ta: 'மீண்டும் அனுப்ப' },
  seconds: { en: 's', ta: ' வி.' },
  resend: { en: 'Resend code', ta: 'மீண்டும் அனுப்பு' },
  resent: { en: 'A new code is on its way', ta: 'புதிய குறியீடு அனுப்பப்பட்டது' },
  verify: { en: 'Verify & continue', ta: 'சரிபார்த்துத் தொடர்க' },

  noOrderTitle: { en: 'No booking on this number yet', ta: 'இந்த எண்ணில் பதிவு எதுவும் இல்லை' },
  noOrderBody: {
    en: 'Your family’s page opens once you’ve shared your day with us. Begin your story with us — or try the number you booked with.',
    ta: 'உங்கள் நாளை எங்களுடன் பகிர்ந்த பிறகே உங்கள் குடும்பப் பக்கம் திறக்கும். உங்கள் கதையை எங்களுடன் தொடங்குங்கள் — அல்லது பதிவு செய்த எண்ணை முயலுங்கள்.',
  },
  getQuote: { en: 'Begin your story', ta: 'உங்கள் கதையைத் தொடங்குங்கள்' },
  tryAnother: { en: 'Try another number', ta: 'வேறு எண்' },

  demo: { en: 'Demo: 98765 43210, any 4-digit code', ta: 'டெமோ: 98765 43210, ஏதேனும் 4 இலக்கம்' },
  useDemo: { en: 'Use demo', ta: 'டெமோ நிரப்பு' },
  staff: { en: 'Studio staff?', ta: 'ஸ்டுடியோ பணியாளரா?' },
  staffLink: { en: 'Staff login', ta: 'பணியாளர் நுழைவு' },
  secure: { en: 'One-time codes expire in 5 minutes.', ta: 'ஒருமுறைக் குறியீடு 5 நிமிடத்தில் காலாவதியாகும்.' },
}

type Phase = 'idle' | 'sending' | 'verifying' | 'success'

const formatPhone = (d: string) => (d.length > 5 ? `${d.slice(0, 5)} ${d.slice(5)}` : d)
const validPhone = (d: string) => /^[6-9]\d{9}$/.test(d)

/** Only allow in-app redirects. */
function safeNext(raw: string | null) {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/dashboard'
  return raw
}

export default function Login() {
  const t = useT(copy)
  const lang = useLang()
  const session = useStore(s => s.session)
  const orders = useStore(s => s.orders)
  const loginClient = useStore(s => s.loginClient)
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  useDarkHero()
  useTitle(copy.title)

  const [step, setStep] = useState<1 | 2>(1)
  const [digits, setDigits] = useState('')
  const [error, setError] = useState('')
  const [noOrder, setNoOrder] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const timers = useRef<number[]>([])
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms))
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  if (session?.role === 'client') return <Navigate to={next} replace />

  const submitPhone = (e?: FormEvent) => {
    e?.preventDefault()
    if (!validPhone(digits)) {
      setError(t.invalid)
      return
    }
    setError('')
    const exists = orders.some(o => normalizePhone(o.client.contact) === digits)
    if (!exists) {
      setNoOrder(true)
      return
    }
    setPhase('sending')
    later(() => {
      setPhase('idle')
      setStep(2)
    }, 750)
  }

  const verify = () => {
    setPhase('verifying')
    later(() => setPhase('success'), 850)
    later(() => {
      if (!loginClient(digits)) {
        setPhase('idle')
        setStep(1)
        setNoOrder(true)
      }
    }, 1650)
  }

  const reset = () => {
    setNoOrder(false)
    setStep(1)
    setPhase('idle')
  }

  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden bg-ink text-white">
      {/* Backdrop */}
      <LangImg pair={{ en: 'm_couple_lights', ta: 't_couple_garland' }} className="absolute inset-0 -z-20" w={2000} priority dark imgClassName="animate-kenburns" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/70 via-ink/45 to-ink/90 lg:bg-gradient-to-r lg:from-ink/85 lg:via-ink/55 lg:to-ink/30" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t from-ink to-transparent" aria-hidden="true" />
      <TamilOnly>
        <GopuramSkyline className="pointer-events-none absolute inset-x-0 bottom-0 -z-10" color="#c0163c" opacity={0.28} />
      </TamilOnly>

      <Container wide className="grid min-h-[100svh] items-center gap-8 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-28 sm:pt-36 md:gap-10 md:pb-16 md:pt-44 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:gap-16 lg:px-16 lg:pb-24">
        {/* Editorial side */}
        <div className="max-w-xl">
          <TamilOnly>
            <Vilakku height={84} tone="white" className="mb-5 hidden opacity-90 sm:block" />
          </TamilOnly>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}>
            <Eyebrow dark>{t.eyebrow}</Eyebrow>
          </motion.div>
          <h1 className="t-1 mt-4 text-white sm:mt-5">
            <motion.span className="block" initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 1.1, ease: EASE, delay: 0.15 }}>
              {t.heroA}
            </motion.span>
            <motion.span className="italic-accent block text-white/90" initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 1.1, ease: EASE, delay: 0.28 }}>
              {t.heroB}
            </motion.span>
          </h1>
          <motion.p className="t-lead mt-6 hidden max-w-md text-white/70 sm:block" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE, delay: 0.4 }}>
            {t.heroLead}
          </motion.p>
          <motion.ul className="mt-8 hidden flex-wrap gap-2 sm:flex" initial="h" animate="s" variants={{ h: {}, s: { transition: { staggerChildren: 0.08, delayChildren: 0.55 } } }}>
            {[
              { icon: 'clock' as const, label: t.f1 },
              { icon: 'heart' as const, label: t.f2 },
              { icon: 'book' as const, label: t.f3 },
            ].map(f => (
              <motion.li
                key={f.label}
                variants={{ h: { opacity: 0, y: 10 }, s: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } } }}
                className="glass-dark inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] text-white/85"
              >
                <Icon name={f.icon} size={15} className="text-ruby-bright" />
                {f.label}
              </motion.li>
            ))}
          </motion.ul>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, ease: EASE, delay: 0.2 }}
          className="glass-strong relative w-full overflow-hidden rounded-[28px] p-5 text-ink sm:rounded-[32px] sm:p-9"
        >
          {lang === 'ta' && (
            <>
              <KolamCorner className="pointer-events-none absolute left-3 top-3 opacity-60" />
              <KolamCorner className="pointer-events-none absolute bottom-3 right-3 rotate-180 opacity-60" />
            </>
          )}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2.5">
              <LogoMark size={30} />
              <span className="t-label text-ink/55">{t.title}</span>
            </span>
            <span className="flex gap-1.5" aria-hidden="true">
              {[1, 2].map(i => (
                <motion.span key={i} className="h-1.5 rounded-full" animate={{ width: step === i ? 22 : 6, backgroundColor: step >= i ? '#c0163c' : 'rgba(10,10,11,0.15)' }} transition={{ duration: 0.5, ease: EASE }} />
              ))}
            </span>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {noOrder ? (
              <Pane key="none">
                <span className="mt-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-ruby-soft text-ruby sm:mt-8">
                  <Icon name="info" size={22} />
                </span>
                <h2 className="t-3 mt-5 text-balance">{t.noOrderTitle}</h2>
                <p className="mt-2 font-mono text-[13px] text-ink/50">+91 {formatPhone(digits)}</p>
                <p className="mt-3 text-[14.5px] leading-relaxed text-ink/60">{t.noOrderBody}</p>
                <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
                  <Button to="/book" icon="arrowRight" full>
                    {t.getQuote}
                  </Button>
                  <Button variant="outline" onClick={reset} full>
                    {t.tryAnother}
                  </Button>
                </div>
              </Pane>
            ) : step === 1 ? (
              <Pane key="phone">
                <h2 className="t-3 mt-6 text-balance sm:mt-8">{t.step1Title}</h2>
                <p className="mt-2 text-[14.5px] leading-relaxed text-ink/60">{t.step1Sub}</p>
                <form onSubmit={submitPhone} className="mt-6 sm:mt-7" noValidate>
                  <label htmlFor="login-phone" className="t-label mb-2 block text-ink/55">
                    {t.mobile}
                  </label>
                  <div
                    className={`flex h-14 items-center rounded-2xl border bg-white/85 transition-all duration-200 focus-within:bg-white focus-within:ring-4 ${
                      error ? 'border-ruby focus-within:ring-ruby/10' : 'border-ink/10 focus-within:border-ruby focus-within:ring-ruby/10'
                    }`}
                  >
                    <span className="flex h-full items-center gap-1.5 border-r border-ink/10 pl-4 pr-3 text-[15px] font-medium text-ink/70">+91</span>
                    <input
                      id="login-phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      autoFocus
                      value={formatPhone(digits)}
                      onChange={e => {
                        setDigits(e.target.value.replace(/\D/g, '').slice(0, 10))
                        if (error) setError('')
                      }}
                      placeholder={lang === 'ta' ? 'கைபேசி எண்' : 'Mobile number'}
                      aria-invalid={!!error}
                      aria-describedby={error ? 'login-phone-err' : undefined}
                      className="h-full min-w-0 flex-1 bg-transparent px-3 text-[17px] tracking-wide text-ink outline-none placeholder:text-ink/30"
                    />
                    <AnimatePresence>
                      {validPhone(digits) && (
                        <motion.span initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="mr-3 flex h-6 w-6 items-center justify-center rounded-full bg-ruby text-white">
                          <Icon name="check" size={13} strokeWidth={2.6} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <AnimatePresence>
                    {error && (
                      <motion.p id="login-phone-err" role="alert" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden pt-2 text-[13px] text-ruby">
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>
                  <Button type="submit" size="lg" full className="mt-6" disabled={phase === 'sending'} icon={phase === 'sending' ? undefined : 'arrowRight'}>
                    {phase === 'sending' ? (
                      <span className="inline-flex items-center gap-2">
                        <Spinner />
                        {t.sending}
                      </span>
                    ) : (
                      t.sendCode
                    )}
                  </Button>
                </form>
              </Pane>
            ) : (
              <Pane key="otp">
                <h2 className="t-3 mt-6 text-balance sm:mt-8">{t.step2Title}</h2>
                <p className="mt-2 flex flex-wrap items-center gap-x-2 text-[14.5px] text-ink/60">
                  {t.sentTo} <span className="font-mono text-ink">+91 {formatPhone(digits)}</span>
                  <button type="button" onClick={reset} className="font-medium text-ruby underline-offset-4 hover:underline cursor-pointer">
                    {t.change}
                  </button>
                </p>
                <Otp onComplete={verify} disabled={phase !== 'idle'} phase={phase} label={t.digit} groupLabel={t.step2Title} />
                <div className="mt-5 min-h-6" aria-live="polite">
                  <AnimatePresence mode="wait" initial={false}>
                    {phase === 'verifying' ? (
                      <motion.p key="v" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="flex items-center gap-2 text-[13.5px] text-ink/60">
                        <Spinner className="text-ruby" />
                        {t.verifying}
                      </motion.p>
                    ) : phase === 'success' ? (
                      <motion.p key="s" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-[13.5px] font-medium text-ruby">
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 22 }} className="flex h-5 w-5 items-center justify-center rounded-full bg-ruby text-white">
                          <Icon name="check" size={12} strokeWidth={2.8} />
                        </motion.span>
                        {t.verified}
                      </motion.p>
                    ) : (
                      <Resend key="r" onResend={() => toast(t.resent)} />
                    )}
                  </AnimatePresence>
                </div>
              </Pane>
            )}
          </AnimatePresence>

          {/* Demo hint */}
          <div className="glass-ruby-tint mt-6 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-2xl px-4 py-3 sm:mt-8">
            <span className="inline-flex items-center gap-2 text-[13px] font-medium text-ruby-deep">
              <Icon name="sparkle" size={15} className="text-ruby" />
              {t.demo}
            </span>
            {step === 1 && !noOrder && (
              <button
                type="button"
                onClick={() => {
                  setDigits(DEMO_CLIENT_PHONE)
                  setError('')
                }}
                className="inline-flex h-9 items-center rounded-full bg-white/80 px-3.5 text-[12px] font-semibold text-ruby transition hover:bg-white cursor-pointer sm:h-auto sm:px-3 sm:py-1"
              >
                {t.useDemo}
              </button>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 border-t border-ink/[0.07] pt-4 text-[13px] sm:mt-6 sm:gap-2 sm:pt-5">
            <span className="inline-flex items-center gap-1.5 text-ink/45">
              <Icon name="lock" size={13} />
              {t.secure}
            </span>
            <span className="text-ink/50">
              {t.staff}{' '}
              <Link to="/admin/login" className="font-medium text-ink underline-offset-4 hover:text-ruby hover:underline">
                {t.staffLink}
              </Link>
            </span>
          </div>
        </motion.div>
      </Container>
    </section>
  )
}

function Pane({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, x: 24, filter: 'blur(6px)' }}
      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24, filter: 'blur(6px)' }}
      transition={{ duration: 0.45, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" className={`animate-spin ${className}`} aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

/** Four single-digit boxes with auto-advance, backspace-to-previous, arrow keys and paste. */
function Otp({ onComplete, disabled, phase, label, groupLabel }: { onComplete: () => void; disabled: boolean; phase: Phase; label: string; groupLabel: string }) {
  const [vals, setVals] = useState(['', '', '', ''])
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const fired = useRef(false)

  useEffect(() => {
    const id = window.setTimeout(() => refs.current[0]?.focus(), 350)
    return () => clearTimeout(id)
  }, [])

  const commit = (next: string[]) => {
    setVals(next)
    if (next.every(v => v !== '') && !fired.current) {
      fired.current = true
      refs.current.forEach(r => r?.blur())
      onComplete()
    }
  }

  const fillFrom = (start: number, text: string) => {
    const ds = text.replace(/\D/g, '').slice(0, 4 - start).split('')
    if (!ds.length) return
    const next = [...vals]
    ds.forEach((d, k) => (next[start + k] = d))
    commit(next)
    refs.current[Math.min(3, start + ds.length)]?.focus()
  }

  const onKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const next = [...vals]
      if (next[i]) next[i] = ''
      else if (i > 0) {
        next[i - 1] = ''
        refs.current[i - 1]?.focus()
      }
      setVals(next)
    } else if (e.key === 'ArrowLeft' && i > 0) {
      e.preventDefault()
      refs.current[i - 1]?.focus()
    } else if (e.key === 'ArrowRight' && i < 3) {
      e.preventDefault()
      refs.current[i + 1]?.focus()
    }
  }

  const onPaste = (i: number, e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    fillFrom(i, e.clipboardData.getData('text'))
  }

  const success = phase === 'success'

  return (
    <div className="mt-7 flex gap-2.5 sm:gap-3" role="group" aria-label={groupLabel}>
      {vals.map((v, i) => (
        <motion.div
          key={i}
          className="relative flex-1"
          animate={success ? { y: [0, -6, 0] } : { y: 0 }}
          transition={{ duration: 0.5, delay: success ? i * 0.06 : 0, ease: EASE }}
        >
          <input
            ref={el => {
              refs.current[i] = el
            }}
            value={v}
            disabled={disabled}
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            aria-label={`${label} ${i + 1}`}
            maxLength={i === 0 ? 4 : 1}
            onChange={e => {
              const raw = e.target.value.replace(/\D/g, '')
              if (!raw) return
              if (raw.length > 1) return fillFrom(i, raw)
              const next = [...vals]
              next[i] = raw
              commit(next)
              if (i < 3) refs.current[i + 1]?.focus()
            }}
            onKeyDown={e => onKey(i, e)}
            onPaste={e => onPaste(i, e)}
            onFocus={e => e.target.select()}
            className={`aspect-square w-full rounded-2xl border text-center text-[26px] font-semibold text-ink outline-none transition-all duration-300 disabled:opacity-100 sm:text-[30px] ${
              success
                ? 'border-ruby bg-ruby text-white'
                : v
                  ? 'border-ink/25 bg-white'
                  : 'border-ink/10 bg-white/70'
            } focus:border-ruby focus:bg-white focus:ring-4 focus:ring-ruby/10`}
          />
          <AnimatePresence>
            {v && !success && (
              <motion.span
                className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-ruby/40"
                initial={{ opacity: 0.9, scale: 1 }}
                animate={{ opacity: 0, scale: 1.12 }}
                transition={{ duration: 0.5, ease: EASE }}
              />
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  )
}

function Resend({ onResend }: { onResend: () => void }) {
  const t = useT(copy)
  const [left, setLeft] = useState(30)
  useEffect(() => {
    if (left <= 0) return
    const id = window.setTimeout(() => setLeft(l => l - 1), 1000)
    return () => clearTimeout(id)
  }, [left])
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[13.5px] text-ink/50">
      {left > 0 ? (
        <span>
          {t.resendIn} <span className="font-mono tabular-nums text-ink/70">0:{String(left).padStart(2, '0')}</span>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => {
            onResend()
            setLeft(30)
          }}
          className="inline-flex items-center gap-1.5 font-medium text-ruby underline-offset-4 hover:underline cursor-pointer"
        >
          <Icon name="refresh" size={14} />
          {t.resend}
        </button>
      )}
    </motion.div>
  )
}
