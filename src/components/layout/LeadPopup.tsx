import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Button, Chip, Field, LangImg, Modal } from '../ui'
import { Icon } from '../Icon'
import { Kolam } from '../tamil'
import { useLang, useT } from '../../lib/i18n'
import { useStore } from '../../lib/store'
import { requestLang, useUi } from '../../lib/ui'

const copy = {
  eyebrow: { en: 'Welcome', ta: 'நல்வரவு' },
  title: { en: 'Our wedding guide, for your family', ta: 'உங்கள் குடும்பத்திற்காக எங்கள் திருமண வழிகாட்டி' },
  lead: { en: 'Leave your name and number — we’ll share our 2026–27 wedding guide on WhatsApp and look into your auspicious date, with no obligation.', ta: 'பெயரும் எண்ணும் தாருங்கள் — 2026–27 திருமண வழிகாட்டியை வாட்ஸ்அப்பில் பகிர்ந்து, உங்கள் சுபதினத்தைச் சரிபார்க்கிறோம்.' },
  language: { en: 'Preferred language', ta: 'விருப்ப மொழி' },
  name: { en: 'Your name', ta: 'உங்கள் பெயர்' },
  namePh: { en: 'Your full name', ta: 'உங்கள் முழுப் பெயர்' },
  phone: { en: 'Mobile number', ta: 'மொபைல் எண்' },
  phonePh: { en: 'Mobile number', ta: 'கைபேசி எண்' },
  phoneErr: { en: 'Enter a valid 10-digit mobile number', ta: 'சரியான 10 இலக்க எண்ணை உள்ளிடவும்' },
  submit: { en: 'Send me the guide', ta: 'வழிகாட்டியை அனுப்புங்கள்' },
  later: { en: 'Maybe later', ta: 'பிறகு பார்க்கலாம்' },
  privacy: { en: 'We only use this to contact you about your event.', ta: 'உங்கள் நிகழ்வு குறித்துத் தொடர்பு கொள்ள மட்டுமே பயன்படுத்துவோம்.' },
  thanks: { en: 'Nandri! We’ll be in touch shortly.', ta: 'நன்றி! விரைவில் தொடர்பு கொள்கிறோம்.' },
  thanksSub: { en: 'Expect a WhatsApp message within the hour.', ta: 'ஒரு மணி நேரத்திற்குள் வாட்ஸ்அப் செய்தி வரும்.' },
}

/** PRD lead capture: shown once, on the first visit to any public page. */
export function LeadPopup() {
  const done = useStore(s => s.leadPromptDone)
  const captureLead = useStore(s => s.captureLead)
  const dismiss = useStore(s => s.dismissLeadPrompt)
  const curtain = useUi(s => s.curtain)
  const lang = useLang()
  const t = useT(copy)
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const blocked = pathname.startsWith('/admin') || pathname.startsWith('/login')

  useEffect(() => {
    if (done || blocked) return
    const show = () => setOpen(true)
    const timer = setTimeout(show, 6000)
    const onScroll = () => {
      if (window.scrollY > window.innerHeight * 0.9) show()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', onScroll)
    }
  }, [done, blocked])

  const close = () => {
    setOpen(false)
    if (!sent) dismiss()
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 10) return setError(t.phoneErr)
    setSent(true)
    captureLead(name.trim(), phone.trim())
    setTimeout(() => setOpen(false), 2400)
  }

  return (
    <Modal open={open && !curtain} onClose={close} label={t.title} className="!max-w-3xl">
      <div className="grid md:grid-cols-[0.9fr_1.1fr]">
        <div className="relative hidden min-h-[460px] md:block">
          <LangImg pair={{ en: 'm_bride_bokeh', ta: 't_jasmine_garland' }} w={700} className="absolute inset-0" sizes="400px" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
          <div className="absolute inset-x-5 bottom-5">
            <div className="glass-dark rounded-2xl p-4">
              <p className="font-display text-xl italic-accent text-white">{lang === 'ta' ? '“ஒவ்வொரு சடங்கும் பொக்கிஷம்.”' : '“Every ritual, a treasure.”'}</p>
              <p className="mt-1 text-xs text-white/60">1,400+ {lang === 'ta' ? 'நிகழ்வுகள் · 8 மாவட்டங்கள்' : 'events · 8 districts'}</p>
            </div>
          </div>
        </div>

        <div className="relative px-5 pb-6 pt-8 sm:p-7 md:p-9">
          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex min-h-[300px] flex-col sm:min-h-[380px] items-center justify-center text-center">
                {lang === 'ta' ? <Kolam size={88} className="text-ruby" /> : (
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-ruby text-white shadow-ruby"><Icon name="check" size={28} strokeWidth={2.2} /></span>
                )}
                <p className="t-3 mt-6">{t.thanks}</p>
                <p className="mt-2 text-sm text-ink/55">{t.thanksSub}</p>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={submit} exit={{ opacity: 0 }} className="space-y-4 sm:space-y-5">
                <div>
                  <p className="t-eyebrow text-ruby">{t.eyebrow}</p>
                  <h2 className="t-3 mt-3 pr-10 sm:pr-8">{t.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-ink/60">{t.lead}</p>
                </div>
                <div role="group" aria-label={t.language}>
                  <p className="t-label mb-2 text-ink/55">{t.language}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(['en', 'ta'] as const).map(l => (
                      <Chip key={l} active={lang === l} onClick={() => requestLang(l)} className="h-11 w-full justify-center">
                        <span style={{ fontFamily: l === 'ta' ? "'Arima', serif" : "'Inter', sans-serif" }}>{l === 'en' ? 'English' : 'தமிழ்'}</span>
                      </Chip>
                    ))}
                  </div>
                </div>
                <Field label={t.name} value={name} onChange={setName} placeholder={t.namePh} required icon="users" />
                <Field label={t.phone} value={phone} onChange={v => { setPhone(v); setError('') }} type="tel" inputMode="tel" placeholder={t.phonePh} required icon="phone" error={error} />
                <Button type="submit" full size="lg" icon="arrowRight">{t.submit}</Button>
                <div className="flex flex-col-reverse items-center gap-2 text-center sm:flex-row sm:justify-between sm:gap-4 sm:text-left">
                  <p className="text-[11.5px] leading-snug text-ink/40">{t.privacy}</p>
                  <button type="button" onClick={close} className="shrink-0 py-2 text-[13px] sm:py-0 font-medium text-ink/50 underline-offset-4 hover:text-ink hover:underline cursor-pointer">{t.later}</button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Modal>
  )
}
