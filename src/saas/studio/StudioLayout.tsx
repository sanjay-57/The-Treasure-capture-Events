import { Component, useEffect, useState, type ErrorInfo, type ReactNode } from 'react'
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router'
import { Icon, type IconName } from '../../components/Icon'
import { Button, Modal } from '../../components/ui'
import { formatDate, useLang, useT } from '../../lib/i18n'
import { useTitle } from '../../lib/ui'
import { waHref } from '../../pages/admin/kit'
import { PRODUCT } from '../brand'
import { useCurrentStudio, useStudioStore } from '../store'
import { StudioMark, StudioTheme } from '../theme'
import { planTotal } from '../types'
import { daysLeft, deriveStatus, expiredOn, graceLeftDays, planOf } from '../usage'
import { anyUploadActive } from './uploadQueue'
import { LangToggle, TTC_SUPPORT_WA } from './shared'

const copy = {
  title: { en: 'Studio', ta: 'ஸ்டுடியோ' },
  dashboard: { en: 'Dashboard', ta: 'முகப்பு' },
  projects: { en: 'Projects', ta: 'திட்டங்கள்' },
  post: { en: 'Post Production', ta: 'பின்தயாரிப்பு' },
  data: { en: 'Data', ta: 'தரவு' },
  account: { en: 'Account', ta: 'கணக்கு' },
  subscription: { en: 'Subscription', ta: 'சந்தா' },
  profile: { en: 'Profile', ta: 'சுயவிவரம்' },
  how: { en: 'How it works', ta: 'எப்படி வேலை செய்கிறது' },
  more: { en: 'More', ta: 'மேலும்' },
  menu: { en: 'Menu', ta: 'பட்டியல்' },
  main: { en: 'Studio', ta: 'ஸ்டுடியோ' },
  signOut: { en: 'Sign out', ta: 'வெளியேறு' },
  asAdmin: { en: 'Viewing as TTC admin', ta: 'TTC நிர்வாகியாகப் பார்க்கிறீர்கள்' },
  back: { en: 'Back to admin', ta: 'நிர்வாகத்திற்குத் திரும்பு' },
  pendingH: { en: 'Your studio is waiting for payment', ta: 'உங்கள் ஸ்டுடியோ கட்டணத்திற்காகக் காத்திருக்கிறது' },
  pendingB: {
    en: 'Thanks for signing up. Pay for the plan below by UPI or bank transfer and send us the reference on WhatsApp. You can sign in as soon as our team confirms it.',
    ta: 'பதிவு செய்ததற்கு நன்றி. கீழே உள்ள திட்டத்திற்கு UPI அல்லது வங்கிப் பரிமாற்றம் மூலம் செலுத்தி, குறிப்பு எண்ணை WhatsApp-ல் அனுப்புங்கள். எங்கள் குழு உறுதிசெய்ததும் உள்நுழையலாம்.',
  },
  pendingPill: { en: 'Pending — waiting for payment confirmation', ta: 'நிலுவை — கட்டண உறுதிக்காகக் காத்திருக்கிறது' },
  revokedH: { en: 'Your studio is on hold', ta: 'உங்கள் ஸ்டுடியோ நிறுத்தி வைக்கப்பட்டுள்ளது' },
  revokedPill: { en: 'Payment revoked', ta: 'கட்டணம் ரத்து' },
  expiredH: { en: 'Your plan has ended', ta: 'உங்கள் திட்டக் காலம் முடிந்தது' },
  expiredPill: { en: 'Expired on', ta: 'காலாவதியான தேதி' },
  renewB: { en: 'Pay for the plan below to switch your studio back on. We will confirm it on WhatsApp.', ta: 'உங்கள் ஸ்டுடியோவை மீண்டும் இயக்க கீழே உள்ள திட்டத்திற்குச் செலுத்துங்கள். WhatsApp-ல் உறுதிசெய்வோம்.' },
  plan: { en: 'Plan chosen', ta: 'தேர்ந்த திட்டம்' },
  due: { en: 'Amount due', ta: 'செலுத்த வேண்டிய தொகை' },
  perMonth: { en: '/month', ta: '/மாதம்' },
  changePlan: { en: 'Change plan', ta: 'திட்டத்தை மாற்று' },
  pendingEdit: { en: 'Edit studio details', ta: 'ஸ்டுடியோ விவரங்களைத் திருத்து' },
  ask: { en: 'Send payment details on WhatsApp', ta: 'கட்டண விவரத்தை WhatsApp-ல் அனுப்பு' },
  askMsg: { en: 'Hi, I have paid for {plan} (₹{amount}) for {studio}, {phone}. Reference: ', ta: 'வணக்கம், {studio} ({phone}) க்கு {plan} (₹{amount}) செலுத்தியுள்ளேன். குறிப்பு எண்: ' },
  graceLeft: { en: 'Your client links keep working for {n} more day(s).', ta: 'வாடிக்கையாளர் இணைப்புகள் இன்னும் {n} நாள் வேலை செய்யும்.' },
  graceOver: { en: 'Client links have stopped working until the payment is confirmed.', ta: 'கட்டணம் உறுதியாகும் வரை வாடிக்கையாளர் இணைப்புகள் இயங்காது.' },
  ending: { en: 'Your plan ends in {n} day(s).', ta: 'உங்கள் திட்டம் {n} நாளில் முடியும்.' },
  renew: { en: 'Renew', ta: 'புதுப்பி' },
  cancelledH: { en: 'This studio account is closed', ta: 'இந்த ஸ்டுடியோ கணக்கு மூடப்பட்டுள்ளது' },
  cancelledB: { en: 'If you think this is a mistake, message us and we will look into it.', ta: 'இது தவறு என்று நினைத்தால், எங்களுக்கு எழுதுங்கள்; சரிபார்க்கிறோம்.' },
  leave: { en: 'An upload is still running. Leave anyway?', ta: 'பதிவேற்றம் இன்னும் நடக்கிறது. வெளியேறவா?' },
  crashH: { en: 'This page could not open', ta: 'இந்தப் பக்கத்தைத் திறக்க முடியவில்லை' },
  crashB: { en: 'Reload to try again. If it keeps happening, send us the line below on WhatsApp.', ta: 'மீண்டும் முயல ஏற்றுங்கள். தொடர்ந்தால் கீழே உள்ள வரியை WhatsApp-ல் அனுப்புங்கள்.' },
  reload: { en: 'Reload', ta: 'மீண்டும் ஏற்று' },
}

interface NavItem { to: string; label: keyof typeof copy; short?: keyof typeof copy; icon: IconName; end?: boolean; also?: string[] }

const MAIN: NavItem[] = [
  { to: '/studio', label: 'dashboard', icon: 'dashboard', end: true },
  { to: '/studio/projects', label: 'projects', icon: 'book' },
  { to: '/studio/galleries', label: 'post', icon: 'image', also: ['/studio/events'] },
  { to: '/studio/drives', label: 'data', icon: 'gem' },
]
const ACCOUNT: NavItem[] = [
  { to: '/studio/account', label: 'subscription', icon: 'receipt' },
  { to: '/studio/profile', label: 'profile', icon: 'building' },
  { to: '/studio/how', label: 'how', icon: 'info' },
]
/** Phone bottom bar; everything else sits behind "More". */
const BOTTOM = [MAIN[0], MAIN[1], MAIN[2], MAIN[3]]

/** Active for the item's own path and anything nested under it (Dashboard only on /studio itself). */
const navActive = (n: Pick<NavItem, 'to' | 'end' | 'also'>, pathname: string) => {
  const p = pathname.replace(/\/+$/, '') || '/'
  if (n.end) return p === n.to
  return [n.to, ...(n.also ?? [])].some(x => p === x || p.startsWith(`${x}/`))
}

export default function StudioLayout() {
  const t = useT(copy)
  const lang = useLang()
  useTitle(copy.title)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const session = useStudioStore(s => s.session)
  const logoutStudio = useStudioStore(s => s.logoutStudio)
  const studio = useCurrentStudio()
  const plans = useStudioStore(s => s.plans)
  const [more, setMore] = useState(false)
  useEffect(() => setMore(false), [pathname])

  useEffect(() => {
    const onLeave = (e: BeforeUnloadEvent) => {
      if (!anyUploadActive()) return
      e.preventDefault()
      e.returnValue = t.leave
    }
    window.addEventListener('beforeunload', onLeave)
    return () => window.removeEventListener('beforeunload', onLeave)
  }, [t.leave])

  if (!session || !studio) return <Navigate to="/studio/login" replace />
  const onWelcome = pathname.startsWith('/studio/welcome')
  if (!studio.onboarded && !onWelcome) return <Navigate to="/studio/welcome" replace />
  if (onWelcome) return <Outlet />

  const signOut = () => {
    logoutStudio()
    navigate('/studio/login')
  }
  const backToAdmin = () => {
    const id = studio.id
    logoutStudio()
    navigate(`/admin/photographers/${id}`)
  }

  const adminBanner = session.viewAsAdmin && (
    <div className="sticky top-0 z-40 flex items-center justify-between gap-3 bg-amber-300 px-4 py-2 text-[13px] text-ink md:px-8">
      <span className="flex items-center gap-2 font-medium"><Icon name="eye" size={15} />{t.asAdmin} · {studio.name}</span>
      <button type="button" onClick={backToAdmin} className="cursor-pointer rounded-full bg-ink px-3 py-1 text-[12.5px] font-medium text-white">{t.back}</button>
    </div>
  )

  const status = deriveStatus(studio)
  if (status !== 'active') {
    const plan = planOf(plans, studio.sub.plan)
    const amount = planTotal(plan).toLocaleString('en-IN')
    const exp = expiredOn(studio)
    const grace = graceLeftDays(studio)
    const head = status === 'pending' ? t.pendingH : status === 'cancelled' ? t.cancelledH : exp ? t.expiredH : t.revokedH
    const body = status === 'pending' ? t.pendingB : status === 'cancelled' ? t.cancelledB : t.renewB
    const pill = status === 'pending' ? t.pendingPill : status === 'paused' ? (exp ? `${t.expiredPill} ${formatDate(exp, lang)}` : t.revokedPill) : null
    const ask = t.askMsg.replace('{plan}', plan.name).replace('{amount}', amount).replace('{studio}', studio.name).replace('{phone}', studio.phone)
    return (
      <div className="min-h-[100svh] bg-[#f6f5f2]">
        {adminBanner}
        <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-20 text-center">
          <StudioMark studio={studio} size={56} />
          {pill && <span className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-[12.5px] font-semibold text-amber-950"><Icon name="clock" size={13} />{pill}</span>}
          <h1 className="mt-4 text-[24px] font-semibold tracking-tight text-ink">{head}</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-ink/60">{body}</p>
          {status === 'paused' && <p className="mt-2 text-[13px] text-ink/50">{grace > 0 ? t.graceLeft.replace('{n}', String(grace)) : t.graceOver}</p>}
          {status !== 'cancelled' && (
            <div className="mt-8 w-full rounded-[22px] border border-ink/[0.08] bg-white p-5 text-left">
              <div className="flex items-baseline justify-between gap-3">
                <span className="t-label text-ink/45">{t.plan}</span>
                <span className="text-[14px] font-medium text-ink">{plan.name} · ₹{plan.pricePerMonth.toLocaleString('en-IN')}{t.perMonth}</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-3">
                <span className="t-label text-ink/45">{t.due}</span>
                <span className="text-[22px] font-semibold tabular-nums text-ink">₹{amount}</span>
              </div>
              <p className="t-label mb-2 mt-5 text-ink/45">{t.changePlan}</p>
              <div className="grid grid-cols-3 gap-2">
                {plans.map(p => (
                  <button key={p.key} type="button" aria-pressed={p.key === plan.key} onClick={() => useStudioStore.getState().changePlan(studio.id, p.key)} className={`cursor-pointer rounded-xl border px-2 py-2 text-[12.5px] transition ${p.key === plan.key ? 'border-ink bg-ink text-white' : 'border-ink/10 text-ink/70 hover:border-ink/30'}`}>
                    <span className="block font-medium">{p.name}</span>
                    <span className="block tabular-nums opacity-70">₹{planTotal(p).toLocaleString('en-IN')}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button href={waHref(TTC_SUPPORT_WA, status === 'cancelled' ? `${studio.name} (${studio.phone})` : ask)} iconLeft="whatsapp" variant="ink">{t.ask}</Button>
            {status === 'pending' && <Button to="/studio/welcome" variant="outline">{t.pendingEdit}</Button>}
            <Button onClick={signOut} variant="ghost">{t.signOut}</Button>
          </div>
        </div>
      </div>
    )
  }

  const navGroup = (title: string, items: NavItem[], className = '') => {
    return (
      <div className={className}>
        <p className="t-label mb-2 px-3 text-ink/35">{title}</p>
        <ul className="space-y-0.5">
          {items.map(n => {
            const on = navActive(n, pathname)
            return (
              <li key={n.to}>
                <Link to={n.to} aria-current={on ? 'page' : undefined} className={`flex h-10 items-center gap-2.5 rounded-full px-3 text-[13.5px] font-medium transition ${on ? 'bg-ink text-white' : 'text-ink/60 hover:bg-ink/[0.05] hover:text-ink'}`}>
                  <Icon name={n.icon} size={16} />
                  <span className="min-w-0 flex-1 truncate">{t[n.label]}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  const left = daysLeft(studio)
  return (
    <StudioTheme studio={studio} className="min-h-[100svh] bg-[#f6f5f2] pb-24 md:pb-0">
      {adminBanner}
      <header className="sticky top-0 z-30 border-b border-ink/[0.06] bg-[#f6f5f2]/90 backdrop-blur" style={session.viewAsAdmin ? { top: 36 } : undefined}>
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 md:px-8">
          <Link to="/studio" className="flex min-w-0 items-center gap-3">
            <StudioMark studio={studio} size={34} />
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-[14.5px] font-semibold text-ink">{studio.name}</span>
              <span className="block truncate text-[11px] text-ink/45">{PRODUCT.name}</span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <LangToggle />
            <button type="button" onClick={signOut} aria-label={t.signOut} title={t.signOut} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-ink/55 hover:bg-ink/[0.05] hover:text-ink">
              <Icon name="logout" size={17} />
            </button>
          </div>
        </div>
      </header>

      {left <= 7 && (
        <div className="border-b border-amber-200 bg-amber-50">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 text-[13.5px] text-amber-950 md:px-8">
            <Icon name="info" size={16} />
            <span className="font-medium">{t.ending.replace('{n}', String(left))}</span>
            <Link to="/studio/account" className="ml-auto font-medium underline underline-offset-2">{t.renew}</Link>
          </div>
        </div>
      )}

      <div className="mx-auto flex max-w-7xl gap-8 px-4 md:px-8">
        <aside className="sticky top-[61px] hidden max-h-[calc(100svh-61px)] w-56 shrink-0 self-start overflow-y-auto py-8 md:block" data-lenis-prevent>
          {navGroup(t.main, MAIN)}
          {navGroup(t.account, ACCOUNT, 'mt-6')}
        </aside>
        <main className="min-w-0 flex-1 py-6 md:py-10">
          <PageBoundary key={pathname}>
            <Outlet />
          </PageBoundary>
        </main>
      </div>

      <Modal open={more} onClose={() => setMore(false)} label={t.menu}>
        <div className="p-5 pt-8">
          {navGroup(t.main, MAIN)}
          {navGroup(t.account, ACCOUNT, 'mt-5')}
        </div>
      </Modal>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-ink/[0.08] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {BOTTOM.map(n => {
          const on = navActive(n, pathname)
          return (
            <Link key={n.to} to={n.to} className={`relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${on ? 'text-ink' : 'text-ink/45'}`}>
              <Icon name={n.icon} size={19} />{t[n.short ?? n.label]}
            </Link>
          )
        })}
        <button type="button" onClick={() => setMore(true)} className={`flex flex-1 cursor-pointer flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${BOTTOM.some(n => navActive(n, pathname)) ? 'text-ink/45' : 'text-ink'}`}>
          <Icon name="menu" size={19} />{t.more}
        </button>
      </nav>
    </StudioTheme>
  )
}

/**
 * Keeps the studio chrome on screen when one page throws (no more blank screen); keyed by
 * path so moving to another page clears it. A stale lazy chunk after a dev rebuild reloads once.
 */
class PageBoundary extends Component<{ children: ReactNode }, { error: Error | null; where?: string }> {
  state = { error: null as Error | null, where: undefined as string | undefined }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Studio page crashed', error, info.componentStack)
    // The innermost components, so a screenshot of the error says where it broke.
    const names = [...(info.componentStack ?? '').matchAll(/^\s*(?:at\s+)?([A-Z]\w*)/gm)].map(m => m[1]).slice(0, 4)
    if (names.length) this.setState({ where: names.join(' ‹ ') })
    const chunk = /dynamically imported module|Importing a module script failed|error loading dynamically/i.test(error.message)
    if (chunk && !sessionStorage.getItem('studio-chunk-reload')) {
      sessionStorage.setItem('studio-chunk-reload', '1')
      window.location.reload()
    }
  }
  render() {
    return this.state.error ? <PageError error={this.state.error} where={this.state.where} /> : this.props.children
  }
}

function PageError({ error, where }: { error: Error; where?: string }) {
  const t = useT(copy)
  return (
    <div className="mx-auto max-w-lg rounded-[22px] border border-ink/[0.08] bg-white p-6 text-center">
      <Icon name="info" size={22} className="mx-auto text-ruby" />
      <h1 className="mt-3 text-[18px] font-semibold text-ink">{t.crashH}</h1>
      <p className="mt-1.5 text-[13.5px] text-ink/55">{t.crashB}</p>
      <p className="mt-4 break-words rounded-xl bg-ink/[0.04] px-3 py-2 text-left font-mono text-[12px] text-ink/70">
        {error.message}
        {where && <span className="mt-1 block text-ink/45">in {where}</span>}
      </p>
      <Button className="mt-5" variant="ink" iconLeft="refresh" onClick={() => window.location.reload()}>{t.reload}</Button>
    </div>
  )
}
