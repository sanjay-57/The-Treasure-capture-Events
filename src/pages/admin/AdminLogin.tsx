import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { AnimatePresence, motion, useAnimationControls } from 'motion/react'
import { Icon, LogoMark } from '../../components/Icon'
import { LangImg } from '../../components/ui'
import { EASE } from '../../components/motion'
import { Kolam } from '../../components/tamil'
import { COMMON, useLang, useT } from '../../lib/i18n'
import { toast, useTitle } from '../../lib/ui'
import { useStore } from '../../lib/store'

const DEMO_PIN = '2026'

const copy = {
  title: { en: 'Studio console', ta: 'ஸ்டுடியோ நிர்வாகம்' },
  lead: { en: 'Orders, crew, payments and the website — in one quiet place.', ta: 'ஆர்டர்கள், குழு, கட்டணங்கள், இணையதளம் — அனைத்தும் ஒரே இடத்தில்.' },
  name: { en: 'Your name', ta: 'உங்கள் பெயர்' },
  namePh: { en: 'Your name', ta: 'உங்கள் பெயர்' },
  pin: { en: 'Access PIN', ta: 'அணுகல் PIN' },
  hint: { en: 'Demo PIN is', ta: 'டெமோ PIN' },
  signIn: { en: 'Enter console', ta: 'உள்நுழை' },
  wrong: { en: 'That PIN is not right. Try 2026.', ta: 'PIN தவறு. 2026 முயற்சிக்கவும்.' },
  needName: { en: 'Please enter your name.', ta: 'உங்கள் பெயரை உள்ளிடவும்.' },
  back: { en: 'Back to website', ta: 'இணையதளத்திற்குத் திரும்பு' },
  welcome: { en: 'Welcome back', ta: 'மீண்டும் வருக' },
  secure: { en: 'Staff only · every action is logged', ta: 'பணியாளர்களுக்கு மட்டும் · ஒவ்வொரு செயலும் பதிவாகும்' },
  showPin: { en: 'Show PIN', ta: 'PIN காட்டு' },
}

export default function AdminLogin() {
  const t = useT(copy)
  const lang = useLang()
  const session = useStore(s => s.session)
  const loginAdmin = useStore(s => s.loginAdmin)
  const navigate = useNavigate()
  const shake = useAnimationControls()
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [reveal, setReveal] = useState(false)
  useTitle({ en: 'Admin sign in', ta: 'நிர்வாக உள்நுழைவு' })

  if (session?.role === 'admin') return <Navigate to="/admin" replace />

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return fail(t.needName)
    if (pin !== DEMO_PIN) return fail(t.wrong)
    loginAdmin(name.trim())
    toast(`${t.welcome}, ${name.trim().split(' ')[0]}`)
    navigate('/admin', { replace: true })
  }
  function fail(msg: string) {
    setError(msg)
    shake.start({ x: [0, -10, 9, -6, 4, 0], transition: { duration: 0.45 } })
  }

  return (
    <div className="relative flex min-h-[100svh] flex-col overflow-hidden bg-ink text-white">
      {/* Backdrop: a dimmed photograph under ruby ambient light, so the glass has something to refract. */}
      <LangImg pair={{ en: 'm_couple_lights', ta: 't_lamp_many' }} w={1800} dark className="absolute inset-0 opacity-40" />
      <div className="ambient-dark absolute inset-0 opacity-[0.88]" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/60" />
      <div className="grain absolute inset-0" />
      <AnimatePresence>
        {lang === 'ta' && (
          <motion.div key="kolam" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="kolam-bg-white pointer-events-none absolute inset-0 opacity-[0.05]" />
        )}
      </AnimatePresence>

      <header className="relative z-10 flex items-center justify-between gap-3 px-4 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] sm:px-5 sm:py-5 md:px-8">
        <Link to="/" className="group inline-flex min-h-10 min-w-0 items-center gap-2 rounded-full py-2 pr-3 text-[13px] font-medium text-white/60 transition hover:text-white">
          <Icon name="arrowLeft" size={16} className="transition-transform group-hover:-translate-x-0.5" />
          {t.back}
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-2 sm:pb-16 sm:pt-4">
        <motion.div initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 0.9, ease: EASE }} className="w-full max-w-[420px]">
          <motion.div animate={shake} className="glass-dark relative overflow-hidden rounded-[28px] px-5 pb-6 pt-8 sm:rounded-[32px] sm:px-9 sm:pb-9 sm:pt-9">
            <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-ruby/30 blur-3xl" />
            <div className="relative flex flex-col items-center text-center">
              {lang === 'ta' ? (
                <div className="relative mb-5 flex h-[72px] w-[72px] items-center justify-center">
                  <Kolam size={72} className="absolute inset-0 text-ruby-bright/70" strokeWidth={1.4} />
                  <LogoMark size={30} className="relative" />
                </div>
              ) : (
                <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/10 bg-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                  <LogoMark size={34} />
                </span>
              )}
              <p className="t-label text-white/45">{COMMON.brand[lang]}</p>
              <h1 className={`mt-2 font-display font-medium ${lang === 'ta' ? 'text-[24px] leading-[1.35] sm:text-[28px]' : 'text-[34px] leading-none tracking-tight sm:text-[40px]'}`}>{t.title}</h1>
              <p className="mt-3 max-w-[300px] text-[13.5px] leading-relaxed text-white/55">{t.lead}</p>
            </div>

            <form onSubmit={submit} className="relative mt-7 space-y-4 sm:mt-8" noValidate>
              <DarkInput label={t.name} value={name} onChange={v => { setName(v); setError('') }} placeholder={t.namePh} icon="users" autoFocus autoComplete="name" />
              <div>
                <DarkInput
                  label={t.pin}
                  value={pin}
                  onChange={v => { setPin(v.replace(/\D/g, '').slice(0, 4)); setError('') }}
                  placeholder="••••"
                  icon="lock"
                  type={reveal ? 'text' : 'password'}
                  inputMode="numeric"
                  mono
                  autoComplete="current-password"
                  trailing={
                    <button type="button" onClick={() => setReveal(r => !r)} aria-label={t.showPin} aria-pressed={reveal} className="flex h-10 w-10 items-center justify-center rounded-full text-white/40 transition hover:bg-white/10 sm:h-8 sm:w-8 hover:text-white cursor-pointer">
                      <Icon name="eye" size={16} />
                    </button>
                  }
                />
                <div className="mt-2.5 flex items-center justify-between gap-3">
                  <span className="flex gap-1.5" aria-hidden="true">
                    {[0, 1, 2, 3].map(i => (
                      <motion.span key={i} className="h-1.5 w-1.5 rounded-full" animate={{ backgroundColor: i < pin.length ? '#e2264f' : 'rgba(255,255,255,0.18)', scale: i === pin.length - 1 ? [1, 1.5, 1] : 1 }} transition={{ duration: 0.3 }} />
                    ))}
                  </span>
                  <button type="button" onClick={() => { setPin(DEMO_PIN); setError('') }} className="rounded-full bg-white/[0.06] px-3 py-2 text-[11.5px] text-white/55 sm:px-2.5 sm:py-1 transition hover:bg-white/10 hover:text-white cursor-pointer">
                    {t.hint} <span className="font-mono font-semibold tracking-widest text-white">2026</span>
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p role="alert" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-2 overflow-hidden text-[13px] text-ruby-bright">
                    <Icon name="info" size={15} />
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <button type="submit" className="group relative mt-2 flex h-[52px] w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-ruby text-[15px] font-semibold text-white shadow-ruby transition hover:bg-ruby-bright active:scale-[0.98] cursor-pointer">
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span className="relative">{t.signIn}</span>
                <Icon name="arrowRight" size={17} className="relative transition-transform group-hover:translate-x-0.5" />
              </button>
            </form>
          </motion.div>
          <p className="mt-5 flex items-center justify-center gap-2 px-2 text-center text-[12px] text-white/35">
            <Icon name="lock" size={13} />
            {t.secure}
          </p>
        </motion.div>
      </main>
    </div>
  )
}

function DarkInput({
  label, value, onChange, placeholder, icon, type = 'text', inputMode, autoFocus, trailing, mono, autoComplete,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; icon: 'users' | 'lock'; type?: string; inputMode?: 'numeric' | 'text'
  autoFocus?: boolean; trailing?: ReactNode; mono?: boolean; autoComplete?: string
}) {
  const id = `al-${label.length}-${icon}`
  return (
    <div>
      <label htmlFor={id} className="t-label mb-2 block text-white/50">{label}</label>
      <div className="relative flex items-center">
        <Icon name={icon} size={17} className="pointer-events-none absolute left-4 text-white/35" />
        <input
          id={id}
          type={type}
          inputMode={inputMode}
          value={value}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`h-[52px] w-full rounded-2xl border border-white/12 bg-white/[0.05] pl-11 pr-12 text-[15px] text-white outline-none transition placeholder:text-white/30 focus:border-ruby-bright focus:bg-white/[0.09] focus:ring-4 focus:ring-ruby/20 max-sm:text-[16px] ${mono ? 'font-mono tracking-[0.4em]' : ''}`}
        />
        {trailing && <span className="absolute right-1.5 sm:right-2">{trailing}</span>}
      </div>
    </div>
  )
}
