import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, useLocation, useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { useLenis } from 'lenis/react'
import { AnimatedOutlet } from '../../components/layout/Shell'
import { Icon } from '../../components/Icon'
import { Badge, Button, Container, Eyebrow } from '../../components/ui'
import { EASE } from '../../components/motion'
import { Kolam, TamilOnly } from '../../components/tamil'
import { COMMON, formatDate, useLang, useT } from '../../lib/i18n'
import { districtName, eventByKey, statusName } from '../../lib/data'
import { useMyOrder, useStore, type Order } from '../../lib/store'
import { toast, useTitle } from '../../lib/ui'
import { DemoSwitcher } from './DemoSwitcher'
import { SECTIONS, TabBarShown, firstName, sectionState, stageIdx, useNavHidden } from './shared'

const copy = {
  eyebrow: { en: 'Client dashboard', ta: 'வாடிக்கையாளர் பக்கம்' },
  hello: { en: 'Vanakkam,', ta: 'வணக்கம்,' },
  order: { en: 'Order', ta: 'ஆர்டர்' },
  copied: { en: 'Order ID copied', ta: 'ஆர்டர் எண் நகலெடுக்கப்பட்டது' },
  copy: { en: 'Copy order ID', ta: 'ஆர்டர் எண்ணை நகலெடு' },
  signedOut: { en: 'Signed out. See you soon.', ta: 'வெளியேறினீர்கள். விரைவில் சந்திப்போம்.' },
  sections: { en: 'Dashboard sections', ta: 'பக்கப் பிரிவுகள்' },
  locked: { en: 'locked', ta: 'பூட்டப்பட்டது' },
  needsYou: { en: 'needs your action', ta: 'உங்கள் செயல் தேவை' },
  missingTitle: { en: 'We couldn’t find your order', ta: 'உங்கள் ஆர்டரைக் கண்டறிய முடியவில்லை' },
  missingBody: {
    en: 'Your session may be from an older visit, or the order was updated by the studio. Sign in again with your mobile number, or reach us and we’ll sort it out.',
    ta: 'இது பழைய அமர்வாக இருக்கலாம், அல்லது ஸ்டுடியோ ஆர்டரைப் புதுப்பித்திருக்கலாம். உங்கள் கைபேசி எண்ணுடன் மீண்டும் உள்நுழையுங்கள், அல்லது எங்களைத் தொடர்புகொள்ளுங்கள்.',
  },
  signInAgain: { en: 'Sign in again', ta: 'மீண்டும் உள்நுழை' },
}

export default function DashboardLayout() {
  const order = useMyOrder()
  const t = useT(copy)
  const logout = useStore(s => s.logout)
  const navigate = useNavigate()

  // Leave first, then clear the session once the dashboard has animated out —
  // otherwise RequireClient in the exiting tree would bounce us to /login.
  const signOut = () => {
    navigate('/', { replace: true })
    window.setTimeout(() => {
      logout()
      toast(t.signedOut)
    }, 450)
  }

  if (!order) return <MissingOrder onSignOut={signOut} />

  return <Dashboard order={order} label={t.sections} onSignOut={signOut} />
}

function Dashboard({ order, label, onSignOut }: { order: Order; label: string; onSignOut: () => void }) {
  const { pathname } = useLocation()
  const lenis = useLenis()
  const contentTop = useRef<HTMLDivElement>(null)
  const end = useRef<HTMLDivElement>(null)
  const [tabsShown, setTabsShown] = useState(true)

  // Phone tab bar slides away once the footer takes over the bottom of the screen.
  useEffect(() => {
    const el = end.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setTabsShown(!e.isIntersecting && e.boundingClientRect.top > 0), { rootMargin: '0px 0px -96px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Phones have no sticky tab strip, so switching sections brings the new one into view.
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const el = contentTop.current
    if (!el || !window.matchMedia('(max-width: 767px)').matches || el.getBoundingClientRect().top > 0) return
    if (lenis) lenis.scrollTo(el, { offset: -96, duration: 0.8 })
    else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 96, behavior: 'smooth' })
  }, [pathname, lenis])

  return (
    <TabBarShown.Provider value={tabsShown}>
      <div className="relative pb-[calc(10rem+env(safe-area-inset-bottom))] pt-36 md:pb-36 md:pt-48">
        {/* Ambient wash and, in Tamil mode, a faint kolam field behind the header. */}
        <div className="ambient pointer-events-none absolute inset-x-0 top-0 h-[520px]" aria-hidden="true" />
        <TamilOnly>
          <div
            className="kolam-bg pointer-events-none absolute inset-x-0 top-0 h-[520px] opacity-[0.12]"
            style={{ maskImage: 'linear-gradient(180deg, #000 20%, transparent)', WebkitMaskImage: 'linear-gradient(180deg, #000 20%, transparent)' }}
            aria-hidden="true"
          />
        </TamilOnly>

        <Container className="relative">
          <Header order={order} onSignOut={onSignOut} />
        </Container>

        <TabBar order={order} label={label} />
        <BottomTabs order={order} label={label} shown={tabsShown} />

        <div ref={contentTop} aria-hidden="true" />
        <Container className="relative mt-8 md:mt-12">
          <AnimatedOutlet scrollTop={false} />
        </Container>
        <DemoSwitcher order={order} />
        <div ref={end} className="absolute inset-x-0 bottom-0 h-px" aria-hidden="true" />
      </div>
    </TabBarShown.Provider>
  )
}

function Header({ order, onSignOut }: { order: Order; onSignOut: () => void }) {
  const t = useT(copy)
  const c = useT(COMMON)
  const lang = useLang()
  const ev = eventByKey(order.eventType)
  const name = firstName(order.client.name)
  const stage = statusName(order.status, order.eventType, lang)

  const copyId = () => {
    navigator.clipboard?.writeText(order.id).then(() => toast(t.copied), () => {})
  }

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }}>
          <Eyebrow>{t.eyebrow}</Eyebrow>
        </motion.div>
        <h1 className="t-1 mt-4 flex flex-wrap items-baseline gap-x-[0.28em]">
          <motion.span initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 1, ease: EASE, delay: 0.05 }}>
            {t.hello}
          </motion.span>
          <motion.span
            className="italic-accent text-ruby"
            initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1, ease: EASE, delay: 0.15 }}
          >
            {name}
          </motion.span>
          {lang === 'ta' && (
            <motion.span initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, ease: EASE, delay: 0.3 }} className="self-center">
              <Kolam size={40} className="text-ruby" strokeWidth={2.2} />
            </motion.span>
          )}
        </h1>

        <motion.div
          className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[14px] text-ink/60 md:gap-x-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.25 }}
        >
          <button
            type="button"
            onClick={copyId}
            title={t.copy}
            aria-label={`${t.copy}: ${order.id}`}
            className="group inline-flex h-10 items-center gap-1.5 rounded-full border border-ink/10 bg-white/70 px-3.5 font-mono text-[12.5px] md:h-auto md:px-3 md:py-1 text-ink/75 transition hover:border-ink/25 hover:text-ink cursor-pointer"
          >
            {order.id}
            <Icon name="copy" size={13} className="text-ink/35 transition group-hover:text-ruby" />
          </button>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="sparkle" size={14} className="text-ruby" />
            {ev?.name[lang] ?? order.eventType}
          </span>
          <span className="hidden h-1 w-1 rounded-full bg-ink/20 md:block" aria-hidden="true" />
          <span className="inline-flex items-center gap-1.5">
            <Icon name="calendar" size={14} className="text-ink/40" />
            {formatDate(order.date, lang, { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <span className="hidden h-1 w-1 rounded-full bg-ink/20 md:block" aria-hidden="true" />
          <span className="inline-flex items-center gap-1.5">
            <Icon name="mapPin" size={14} className="text-ink/40" />
            {districtName(order.district, lang)}
          </span>
        </motion.div>
      </div>

      <motion.div
        className="flex shrink-0 flex-wrap items-center justify-between gap-2.5 md:justify-start"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: EASE, delay: 0.35 }}
      >
        <Badge tone="ruby" className="!px-3 !py-1.5 !text-[12px]">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inset-0 rounded-full bg-white animate-pulse-ring" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-white" />
          </span>
          {stage}
        </Badge>
        <Button variant="outline" size="sm" iconLeft="logout" onClick={onSignOut} className="max-md:!h-10">
          {c.logout}
        </Button>
      </motion.div>
    </div>
  )
}

function TabBar({ order, label }: { order: Order; label: string }) {
  const t = useT(copy)
  const lang = useLang()
  const { pathname } = useLocation()
  const navHidden = useNavHidden()
  const scroller = useRef<HTMLDivElement>(null)
  const [stuck, setStuck] = useState(false)
  const sentinel = useRef<HTMLDivElement>(null)

  // Keep the active tab in view on narrow screens.
  useEffect(() => {
    const sc = scroller.current
    const el = sc?.querySelector<HTMLElement>('[aria-current="page"]')
    if (sc && el) sc.scrollTo({ left: el.offsetLeft - sc.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' })
  }, [pathname, lang])

  // Tighten the bar's shadow once it sticks.
  useEffect(() => {
    const s = sentinel.current
    if (!s) return
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting), { rootMargin: '-100px 0px 0px 0px' })
    io.observe(s)
    return () => io.disconnect()
  }, [])

  const delivered = order.status === 'DELIVERED'
  const cur = stageIdx(order.status)

  return (
    <>
      <div ref={sentinel} className="h-px" aria-hidden="true" />
      <motion.div
        className="sticky z-30 mt-10 hidden px-3 md:block"
        animate={{ top: navHidden ? 12 : 84 }}
        transition={{ duration: 0.5, ease: EASE }}
        initial={false}
      >
        <nav
          aria-label={label}
          className={`mx-auto max-w-6xl rounded-full p-1.5 transition-shadow duration-500 ${stuck ? 'glass-strong' : 'glass'}`}
        >
          <div ref={scroller} className="no-scrollbar mask-fade-x relative flex gap-1 overflow-x-auto md:[mask-image:none] md:[-webkit-mask-image:none]" data-lenis-prevent>
            {SECTIONS.map(s => {
              const state = sectionState(order, s.key)
              const promoted = s.key === 'review' && delivered && !order.review
              return (
                <NavLink
                  key={s.key}
                  to={s.to}
                  end={s.key === 'overview'}
                  className={({ isActive }) =>
                    `relative flex h-11 shrink-0 items-center justify-center gap-2 rounded-full px-4 text-[14px] font-medium transition-colors duration-300 md:flex-1 ${
                      isActive ? 'text-ink' : state === 'locked' ? 'text-ink/40 hover:text-ink/70' : 'text-ink/60 hover:text-ink'
                    }`
                  }
                  aria-label={`${s.label[lang]}${state === 'locked' ? ` (${t.locked})` : state === 'action' ? ` (${t.needsYou})` : ''}`}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span
                          layoutId="dash-tab"
                          className="absolute inset-0 -z-10 rounded-full bg-white shadow-[0_1px_2px_rgba(10,10,11,0.06),0_6px_18px_-6px_rgba(10,10,11,0.2)]"
                          transition={{ type: 'spring', stiffness: 420, damping: 38 }}
                        />
                      )}
                      <Icon name={s.icon} size={16} className={isActive ? 'text-ruby' : ''} />
                      <span className="whitespace-nowrap">{s.label[lang]}</span>
                      {state === 'locked' && <Icon name="lock" size={13} className="text-ink/35" />}
                      {(state === 'action' || promoted) && (
                        <span className="relative flex h-2 w-2" aria-hidden="true">
                          <span className="absolute inset-0 rounded-full bg-ruby animate-pulse-ring" />
                          <span className="relative h-2 w-2 rounded-full bg-ruby" />
                        </span>
                      )}
                      {state === 'done' && s.key !== 'overview' && <Icon name="check" size={13} strokeWidth={2.4} className="text-ruby/70" />}
                    </>
                  )}
                </NavLink>
              )
            })}
          </div>
        </nav>
        {/* Thin pipeline progress under the bar */}
        <div className="mx-auto mt-2 hidden h-[2px] max-w-6xl overflow-hidden rounded-full bg-ink/[0.05] px-6 md:block" aria-hidden="true">
          <motion.div className="h-full origin-left rounded-full bg-ruby/70" initial={{ scaleX: 0 }} animate={{ scaleX: (cur + 1) / 8 }} transition={{ duration: 1.2, ease: EASE, delay: 0.4 }} />
        </div>
      </motion.div>
    </>
  )
}

/** Phone navigation: an app-style tab bar pinned to the bottom of the screen. */
function BottomTabs({ order, label, shown }: { order: Order; label: string; shown: boolean }) {
  const t = useT(copy)
  const lang = useLang()
  const delivered = order.status === 'DELIVERED'

  return createPortal(
    <motion.nav
      aria-label={label}
      inert={!shown}
      className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:hidden print:hidden"
      initial={false}
      animate={{ y: shown ? '0%' : '130%' }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      <div className="glass-strong mx-auto flex max-w-md gap-0.5 rounded-[24px] p-1">
        {SECTIONS.map(s => {
          const state = sectionState(order, s.key)
          const promoted = s.key === 'review' && delivered && !order.review
          return (
            <NavLink
              key={s.key}
              to={s.to}
              end={s.key === 'overview'}
              className={({ isActive }) =>
                `relative flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[20px] px-0.5 transition-colors duration-300 active:scale-95 ${
                  isActive ? 'text-ink' : state === 'locked' ? 'text-ink/35' : 'text-ink/55'
                }`
              }
              aria-label={`${s.label[lang]}${state === 'locked' ? ` (${t.locked})` : state === 'action' || promoted ? ` (${t.needsYou})` : ''}`}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="dash-tab-phone"
                      className="absolute inset-0 -z-10 rounded-[20px] bg-white shadow-[0_1px_2px_rgba(10,10,11,0.06),0_6px_18px_-6px_rgba(10,10,11,0.2)]"
                      transition={{ type: 'spring', stiffness: 420, damping: 38 }}
                    />
                  )}
                  <span className="relative flex">
                    <Icon name={state === 'locked' ? 'lock' : s.icon} size={20} className={isActive ? 'text-ruby' : ''} />
                    {(state === 'action' || promoted) && (
                      <span className="absolute -right-1 -top-0.5 flex h-2 w-2" aria-hidden="true">
                        <span className="absolute inset-0 rounded-full bg-ruby animate-pulse-ring" />
                        <span className="relative h-2 w-2 rounded-full bg-ruby ring-2 ring-white" />
                      </span>
                    )}
                  </span>
                  <span className={`max-w-full truncate font-medium leading-[1.3] ${lang === 'ta' ? 'text-[10px]' : 'text-[11px]'}`}>{s.label[lang]}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </motion.nav>,
    document.body,
  )
}

function MissingOrder({ onSignOut }: { onSignOut: () => void }) {
  const t = useT(copy)
  const c = useT(COMMON)
  const logout = useStore(s => s.logout)
  const navigate = useNavigate()
  useTitle({ en: 'My dashboard', ta: 'என் பக்கம்' })
  return (
    <div className="relative min-h-[80vh] pb-24 pt-36 md:pt-48">
      <div className="ambient pointer-events-none absolute inset-0" aria-hidden="true" />
      <Container className="relative">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE }}
          className="glass-strong mx-auto max-w-xl rounded-[28px] p-6 text-center sm:rounded-[32px] sm:p-8 md:p-12"
        >
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ruby-soft text-ruby">
            <Icon name="search" size={24} />
          </span>
          <h1 className="t-3 mt-6 text-balance">{t.missingTitle}</h1>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-ink/60">{t.missingBody}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              icon="arrowRight"
              onClick={() => {
                logout()
                navigate('/login', { replace: true })
              }}
            >
              {t.signInAgain}
            </Button>
            <Button variant="outline" to="/contact">
              {c.contact}
            </Button>
          </div>
          <button type="button" onClick={onSignOut} className="mt-4 h-10 px-3 text-[13px] md:mt-6 md:h-auto md:px-0 font-medium text-ink/50 underline-offset-4 transition hover:text-ink hover:underline cursor-pointer">
            {c.logout}
          </button>
        </motion.div>
      </Container>
    </div>
  )
}
