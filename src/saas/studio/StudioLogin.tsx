import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '../../components/ui'
import { TextInput } from '../../pages/admin/kit'
import { useT } from '../../lib/i18n'
import { toast, useTitle } from '../../lib/ui'
import { PRODUCT } from '../brand'
import { DEMO_STUDIO_PHONE, useStudioStore } from '../store'
import { StudioMark } from '../theme'
import { planTotal, type PlanKey } from '../types'
import { LangToggle, logoDataUrl } from './shared'
import { isLan } from '../../api/mode'
import { requestCode, verifyCode } from '../../api/auth'

const copy = {
  title: { en: 'Photographer sign in', ta: 'புகைப்படக் கலைஞர் உள்நுழைவு' },
  h: { en: 'Sign in to your studio', ta: 'உங்கள் ஸ்டுடியோவில் உள்நுழையுங்கள்' },
  phone: { en: 'Mobile number', ta: 'கைப்பேசி எண்' },
  send: { en: 'Send OTP', ta: 'OTP அனுப்பு' },
  otp: { en: '4-digit OTP', ta: '4 இலக்க OTP' },
  sentTo: { en: 'We sent a code to', ta: 'குறியீடு அனுப்பப்பட்டது:' },
  verify: { en: 'Verify', ta: 'சரிபார்' },
  change: { en: 'Change number', ta: 'எண்ணை மாற்று' },
  badPhone: { en: 'Enter a 10-digit mobile number', ta: '10 இலக்க கைப்பேசி எண்ணை உள்ளிடுங்கள்' },
  badOtp: { en: 'Enter the 4 digits', ta: '4 இலக்கங்களை உள்ளிடுங்கள்' },
  demo: { en: 'Demo: use', ta: 'டெமோ:' },
  demoOtp: { en: 'and any 4 digits.', ta: 'மற்றும் ஏதேனும் 4 இலக்கங்கள்.' },
  lanOtp: { en: 'Your 4-digit code appears on the Treasure Capture admin screen. Ask the team to read it out.', ta: 'உங்கள் 4 இலக்கக் குறியீடு Treasure Capture நிர்வாகத் திரையில் தெரியும். குழுவிடம் கேளுங்கள்.' },
  newH: { en: 'New here? Set up your studio', ta: 'புதியவரா? உங்கள் ஸ்டுடியோவை அமையுங்கள்' },
  newSub: { en: 'This number has no studio yet. Tell us about your studio and pick a plan; you can sign in as soon as our team confirms your payment.', ta: 'இந்த எண்ணுக்கு இன்னும் ஸ்டுடியோ இல்லை. உங்கள் ஸ்டுடியோ விவரமும் திட்டமும் தாருங்கள்; கட்டணத்தை எங்கள் குழு உறுதிசெய்ததும் உள்நுழையலாம்.' },
  studio: { en: 'Studio name', ta: 'ஸ்டுடியோ பெயர்' },
  owner: { en: 'Your name', ta: 'உங்கள் பெயர்' },
  city: { en: 'City', ta: 'நகரம்' },
  email: { en: 'Email (optional)', ta: 'மின்னஞ்சல் (விருப்பம்)' },
  create: { en: 'Create studio', ta: 'ஸ்டுடியோ உருவாக்கு' },
  missing: { en: 'Studio name, your name and city are needed', ta: 'ஸ்டுடியோ பெயர், உங்கள் பெயர், நகரம் தேவை' },
  logo: { en: 'Studio logo', ta: 'ஸ்டுடியோ லோகோ' },
  upload: { en: 'Upload logo', ta: 'லோகோ பதிவேற்று' },
  logoUrl: { en: 'or paste a logo link', ta: 'அல்லது லோகோ இணைப்பை ஒட்டவும்' },
  logoHint: { en: 'Your clients see this, never ours. PNG, JPG or SVG; resized to 256 px.', ta: 'வாடிக்கையாளர்கள் இதையே பார்ப்பார்கள். PNG, JPG அல்லது SVG; 256 px-க்குச் சுருக்கப்படும்.' },
  needLogo: { en: 'Add your studio logo', ta: 'ஸ்டுடியோ லோகோவைச் சேர்க்கவும்' },
  badLogo: { en: 'That image could not be used. Try a smaller PNG or JPG.', ta: 'அந்தப் படத்தைப் பயன்படுத்த முடியவில்லை. சிறிய PNG/JPG முயற்சிக்கவும்.' },
  plan: { en: 'Plan', ta: 'திட்டம்' },
  perMonth: { en: '/month', ta: '/மாதம்' },
  total: { en: 'total', ta: 'மொத்தம்' },
  about: { en: 'What is this?', ta: 'இது என்ன?' },
  mock: { en: 'OTP is simulated in this preview.', ta: 'இந்த முன்னோட்டத்தில் OTP போலியானது.' },
}

type Step = 'phone' | 'otp' | 'signup'

export default function StudioLogin() {
  const t = useT(copy)
  useTitle(copy.title)
  const navigate = useNavigate()
  const session = useStudioStore(s => s.session)
  const loginStudio = useStudioStore(s => s.loginStudio)
  const signupStudio = useStudioStore(s => s.signupStudio)
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const plans = useStudioStore(s => s.plans)
  const [form, setForm] = useState({ name: '', ownerName: '', city: '', email: '', logoUrl: '' })
  const [plan, setPlan] = useState<PlanKey>('m12')
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (session && !session.viewAsAdmin && step !== 'signup') navigate('/studio', { replace: true })
  }, [session, step, navigate])

  const d = phone.replace(/\D/g, '')
  const pretty = d.length >= 10 ? `+91 ${d.slice(-10, -5)} ${d.slice(-5)}` : phone

  const sendOtp = () => {
    if (d.length < 10) return toast(t.badPhone, 'ruby')
    if (isLan()) {
      setBusy(true)
      requestCode(pretty, 'studio').then(() => setStep('otp'), (e: Error) => toast(e.message, 'ruby')).finally(() => setBusy(false))
      return
    }
    setStep('otp')
  }
  const verify = () => {
    if (!/^\d{4}$/.test(otp)) return toast(t.badOtp, 'ruby')
    if (isLan()) {
      // A known phone signs in (the session effect above redirects); a new one goes on to sign-up.
      setBusy(true)
      verifyCode(pretty, 'studio', otp).then(me => !me.studioId && setStep('signup'), (e: Error) => toast(e.message, 'ruby')).finally(() => setBusy(false))
      return
    }
    const id = loginStudio(pretty)
    if (id) navigate('/studio', { replace: true })
    else setStep('signup')
  }
  const create = async () => {
    if (!form.name.trim() || !form.ownerName.trim() || !form.city.trim()) return toast(t.missing, 'ruby')
    if (!form.logoUrl.trim()) return toast(t.needLogo, 'ruby')
    const id = await signupStudio({ name: form.name.trim(), ownerName: form.ownerName.trim(), city: form.city.trim(), email: form.email.trim() || undefined, phone: pretty, logoUrl: form.logoUrl.trim(), plan })
    if (!id) return
    navigate('/studio/welcome', { replace: true })
  }

  return (
    <div className="flex min-h-[100svh] flex-col bg-[#f6f5f2]">
      <header className="flex items-center justify-between px-5 py-4 md:px-8">
        <Link to="/for-photographers" className="leading-tight">
          <span className="block text-[15px] font-semibold text-ink">{PRODUCT.name}</span>
          <span className="block text-[11.5px] text-ink/45">{PRODUCT.by}</span>
        </Link>
        <LangToggle />
      </header>
      <main className="flex flex-1 items-start justify-center px-5 pb-16 pt-6 md:items-center md:pt-0">
        <div className="w-full max-w-md rounded-[28px] border border-ink/[0.08] bg-white p-6 shadow-[0_20px_60px_-30px_rgba(10,10,11,0.35)] md:p-8">
          {step !== 'signup' ? (
            <>
              <h1 className="text-[24px] font-semibold tracking-tight text-ink">{t.h}</h1>
              <form
                className="mt-6 grid gap-4"
                onSubmit={e => {
                  e.preventDefault()
                  if (step === 'phone') sendOtp()
                  else verify()
                }}
              >
                {step === 'phone' ? (
                  <TextInput label={t.phone} type="tel" inputMode="tel" value={phone} onChange={setPhone} placeholder="98765 43210" autoFocus />
                ) : (
                  <>
                    <p className="text-[14px] text-ink/60">{t.sentTo} <span className="font-medium text-ink">{pretty}</span></p>
                    <TextInput label={t.otp} inputMode="numeric" value={otp} onChange={v => setOtp(v.replace(/\D/g, '').slice(0, 4))} autoFocus />
                  </>
                )}
                <Button type="submit" full>{step === 'phone' ? t.send : t.verify}</Button>
                {step === 'otp' && (
                  <button type="button" onClick={() => { setStep('phone'); setOtp('') }} className="cursor-pointer text-[13px] text-ink/55 hover:text-ink">{t.change}</button>
                )}
              </form>
              <div className="mt-6 rounded-2xl bg-ink/[0.04] px-4 py-3 text-[13px] text-ink/60">
                {isLan() ? t.lanOtp : <>{t.demo}{' '}
                <button type="button" className="cursor-pointer font-medium text-ink underline underline-offset-2" onClick={() => { setPhone(DEMO_STUDIO_PHONE); setStep('phone') }}>{DEMO_STUDIO_PHONE}</button>{' '}
                {t.demoOtp} {t.mock}</>}
              </div>
            </>
          ) : (
            <>
              <h1 className="text-[22px] font-semibold tracking-tight text-ink">{t.newH}</h1>
              <p className="mt-2 text-[14px] leading-relaxed text-ink/55">{t.newSub}</p>
              <form className="mt-6 grid gap-4" onSubmit={e => { e.preventDefault(); create() }}>
                <TextInput label={t.studio} value={form.name} onChange={v => setForm({ ...form, name: v })} required autoFocus />
                <TextInput label={t.owner} value={form.ownerName} onChange={v => setForm({ ...form, ownerName: v })} required />
                <TextInput label={t.city} value={form.city} onChange={v => setForm({ ...form, city: v })} required />
                <TextInput label={t.email} type="email" inputMode="email" value={form.email} onChange={v => setForm({ ...form, email: v })} />
                <div>
                  <p className="t-label mb-1.5 flex items-center gap-1 text-ink/50">{t.logo}<span className="text-ruby">*</span></p>
                  <div className="flex items-center gap-3">
                    <StudioMark studio={{ name: form.name || '?', accent: '#1f1f22', logoUrl: form.logoUrl.trim() || undefined }} size={44} />
                    <button type="button" disabled={busy} onClick={() => fileRef.current?.click()} className="h-10 cursor-pointer rounded-full border border-ink/15 px-4 text-[13px] font-medium text-ink hover:border-ink/40 disabled:opacity-40">{t.upload}</button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={async e => {
                        const f = e.target.files?.[0]
                        e.target.value = ''
                        if (!f) return
                        setBusy(true)
                        try {
                          const url = await logoDataUrl(f)
                          if (url) setForm(x => ({ ...x, logoUrl: url }))
                          else toast(t.badLogo, 'ruby')
                        } catch {
                          toast(t.badLogo, 'ruby')
                        } finally {
                          setBusy(false)
                        }
                      }}
                    />
                  </div>
                  <TextInput className="mt-2" label={t.logoUrl} inputMode="url" placeholder="https://" value={form.logoUrl.startsWith('data:') ? '' : form.logoUrl} onChange={v => setForm({ ...form, logoUrl: v })} />
                  <p className="mt-1.5 text-xs text-ink/45">{t.logoHint}</p>
                </div>
                <fieldset>
                  <legend className="t-label mb-1.5 text-ink/50">{t.plan}</legend>
                  <div className="grid gap-2">
                    {plans.map(p => (
                      <label key={p.key} className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ${plan === p.key ? 'border-ink bg-ink/[0.03]' : 'border-ink/10 hover:border-ink/30'}`}>
                        <input type="radio" name="plan" value={p.key} checked={plan === p.key} onChange={() => setPlan(p.key)} className="accent-ink" />
                        <span className="flex-1 text-[14px] font-medium text-ink">{p.name}</span>
                        <span className="text-right text-[12.5px] tabular-nums text-ink/55">₹{p.pricePerMonth.toLocaleString('en-IN')}{t.perMonth}<span className="block font-semibold text-ink">₹{planTotal(p).toLocaleString('en-IN')} {t.total}</span></span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <p className="text-[13px] text-ink/50">{t.phone}: {pretty}</p>
                <Button type="submit" full>{t.create}</Button>
                <button type="button" onClick={() => setStep('phone')} className="cursor-pointer text-[13px] text-ink/55 hover:text-ink">{t.change}</button>
              </form>
            </>
          )}
          <p className="mt-6 text-center text-[13px]"><Link to="/for-photographers" className="text-ink/50 hover:text-ink">{t.about}</Link></p>
        </div>
      </main>
    </div>
  )
}
