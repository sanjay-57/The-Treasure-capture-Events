import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react'
import { useLenis } from 'lenis/react'
import { Icon } from '../Icon'
import { Button, useScrollLock } from '../ui'
import { EASE } from '../motion'
import { Thoranam } from '../tamil'
import { COMMON, useLang, useT } from '../../lib/i18n'
import { requestLang, useUi } from '../../lib/ui'
import { useMyOrder, useStore } from '../../lib/store'
import { STATUS_META, statusName } from '../../lib/data'

const LINKS = [
  { to: '/', label: COMMON.home },
  { to: '/gallery', label: COMMON.gallery },
  { to: '/services', label: COMMON.services },
  { to: '/about', label: COMMON.about },
  { to: '/contact', label: COMMON.contact },
]

export function Logo({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  const lang = useLang()
  return (
    <Link to="/" className="group flex items-center gap-2.5" aria-label={COMMON.brand[lang]}>
      {!compact && (
        <span className={`leading-none ${light ? 'text-white' : 'text-ink'}`}>
          <span className="block whitespace-nowrap text-[19px] font-semibold tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            {COMMON.brandShort.en}
          </span>
        </span>
      )}
    </Link>
  )
}

export function LangToggle({ dark = false, className = '' }: { dark?: boolean; className?: string }) {
  const lang = useLang()
  return (
    <div role="radiogroup" aria-label="Language / மொழி" className={`relative inline-flex items-center rounded-full p-[3px] ${dark ? 'bg-white/12' : 'bg-ink/[0.06]'} ${className}`}>
      {(['en', 'ta'] as const).map(l => {
        const active = lang === l
        return (
          <button
            key={l}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => requestLang(l)}
            className={`relative z-10 h-8 rounded-full px-3 text-[13px] font-semibold transition-colors duration-300 cursor-pointer ${active ? 'text-white' : dark ? 'text-white/75 hover:text-white' : 'text-ink/60 hover:text-ink'}`}
            style={{ fontFamily: l === 'ta' ? "'Arima', serif" : "'Inter', sans-serif" }}
          >
            {active && <motion.span layoutId="lang-thumb" className="absolute inset-0 -z-10 rounded-full bg-ruby shadow-ruby" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
            {l === 'en' ? 'EN' : 'தமிழ்'}
          </button>
        )
      })}
    </div>
  )
}

/** PRD "dynamic state header": logged-in clients see their order stage and next action. */
function OrderStatusBar({ onDark }: { onDark: boolean }) {
  const order = useMyOrder()
  const lang = useLang()
  const { pathname } = useLocation()
  if (!order || pathname.startsWith('/dashboard')) return null
  const meta = STATUS_META[order.status]
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE, delay: 0.2 }} className="mx-auto mt-2 flex w-fit max-w-full items-center md:max-w-[calc(100%-24px)]">
      <Link
        to={meta.cta?.to ?? '/dashboard'}
        className={`group flex min-w-0 max-w-full items-center gap-3 rounded-full py-1.5 pl-3 pr-1.5 text-[13px] transition ${onDark ? 'glass-dark' : 'glass'}`}
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inset-0 rounded-full bg-ruby animate-pulse-ring" />
          <span className="relative h-2 w-2 rounded-full bg-ruby" />
        </span>
        <span className={`min-w-0 truncate ${onDark ? 'text-white/80' : 'text-ink/65'}`}>
          <span className="hidden sm:inline">{order.id} · </span>
          <span className={`font-semibold ${onDark ? 'text-white' : 'text-ink'}`}>{statusName(order.status, order.eventType, lang)}</span>
        </span>
        {meta.cta && (
          <span className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-ruby px-3 py-1 text-[12px] font-semibold text-white">
            {meta.cta.label[lang]}
            <Icon name="arrowRight" size={13} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        )}
      </Link>
    </motion.div>
  )
}

function Banner() {
  const banner = useStore(s => s.cms.banner)
  const lang = useLang()
  const [closed, setClosed] = useState(() => sessionStorage.getItem('ttc-banner-closed') === '1')
  if (!banner.enabled || closed) return null
  return (
    <div className="relative bg-ink text-white">
      <Link to={banner.link || '/book'} className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-10 py-2 text-center text-[12.5px] text-white/85 transition hover:text-white">
        <Icon name="sparkle" size={14} className="text-ruby-bright" />
        <span className="truncate">{lang === 'ta' ? banner.ta : banner.en}</span>
        <Icon name="arrowRight" size={13} className="hidden sm:block" />
      </Link>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => {
          sessionStorage.setItem('ttc-banner-closed', '1')
          setClosed(true)
        }}
        className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-white/50 sm:right-3 sm:h-auto sm:w-auto sm:p-1 transition hover:text-white cursor-pointer"
      >
        <Icon name="x" size={14} />
      </button>
    </div>
  )
}

export function Nav() {
  const lang = useLang()
  const t = useT(COMMON)
  const session = useStore(s => s.session)
  const navOnDark = useUi(s => s.navOnDark)
  const { pathname } = useLocation()
  const lenis = useLenis()
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [open, setOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)

  useMotionValueEvent(scrollY, 'change', y => {
    const prev = scrollY.getPrevious() ?? 0
    setScrolled(y > 40)
    setHidden(y > 240 && y > prev && !open)
  })

  useEffect(() => setOpen(false), [pathname])
  useEffect(() => useUi.setState({ navHidden: hidden }), [hidden])
  // Publish the real header height (nav + order status pill) so sticky bars clear it.
  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    const root = document.documentElement
    const ro = new ResizeObserver(() => root.style.setProperty('--nav-h', `${el.offsetHeight}px`))
    ro.observe(el)
    return () => {
      ro.disconnect()
      root.style.removeProperty('--nav-h')
    }
  }, [])
  useEffect(() => {
    if (open) lenis?.stop()
    else lenis?.start()
  }, [open, lenis])
  useScrollLock(open)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Clear glass over a dark hero, dark glass on fully dark pages, light glass otherwise.
  const onDark = navOnDark === 'page' || (navOnDark === 'hero' && !scrolled)
  const solidDark = navOnDark === 'page' && scrolled
  // The nav is for clients only; staff reach the admin through the footer's staff login.
  const accountTo = session?.role === 'client' ? '/dashboard' : '/login'
  const accountLabel = session?.role === 'client' ? t.dashboard : t.login
  // Tamil labels run longer, so the inline links need the wider breakpoint before they fit.
  const ta = lang === 'ta'

  return (
    <>
      <motion.header
        ref={headerRef}
        className="fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)]"
        animate={{ y: hidden ? '-110%' : '0%' }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <AnimatePresence initial={false}>{!scrolled && <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden"><Banner /></motion.div>}</AnimatePresence>

        <div className="pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] pt-2 md:pl-[max(0.75rem,env(safe-area-inset-left))] md:pr-[max(0.75rem,env(safe-area-inset-right))] md:pt-3">
          <nav
            className={`relative mx-auto flex h-[60px] max-w-6xl items-center justify-between rounded-full pl-3 pr-1.5 transition-all duration-500 md:pl-5 md:pr-2 ${
              solidDark ? 'glass-ruby-dark' : onDark ? 'bg-ruby-deep/15 border border-white/15 backdrop-blur-xl' : 'glass-strong'
            }`}
            aria-label="Main"
          >
            <div className="shrink-0">
              <Logo light={onDark} />
            </div>

            <ul className={`hidden min-w-0 flex-1 items-center justify-center px-3 ${ta ? 'gap-0 xl:flex' : 'gap-0.5 lg:flex xl:gap-1'}`}>
              {LINKS.map(l => (
                <li key={l.to}>
                  <NavLink
                    to={l.to}
                    end={l.to === '/'}
                    className={({ isActive }) =>
                      `relative block whitespace-nowrap rounded-full py-2 font-medium transition-colors duration-300 ${ta ? 'px-2.5 text-[13px]' : 'px-3 text-[14px] xl:px-3.5'} ${
                        isActive ? (onDark ? 'text-white' : 'text-ink') : onDark ? 'text-white/70 hover:text-white' : 'text-ink/60 hover:text-ink'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && <motion.span layoutId="nav-active" className={`absolute inset-0 -z-10 rounded-full ${onDark ? 'bg-white/15' : 'bg-ink/[0.06]'}`} transition={{ type: 'spring', stiffness: 380, damping: 34 }} />}
                        {l.label[lang]}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className="flex shrink-0 items-center gap-1.5">
              <LangToggle dark={onDark} className="max-sm:hidden" />
              <Link
                to={accountTo}
                aria-label={accountLabel}
                title={accountLabel}
                className={`hidden h-10 items-center gap-1.5 whitespace-nowrap rounded-full border text-[13.5px] font-medium transition md:flex ${ta ? 'w-10 justify-center' : 'w-10 justify-center xl:w-auto xl:px-4'} ${onDark ? 'border-white/25 text-white/90 hover:bg-white/10 hover:text-white' : 'border-ink/15 text-ink/75 hover:bg-ink/[0.05] hover:text-ink'}`}
              >
                <Icon name={session?.role === 'client' ? 'dashboard' : 'users'} size={16} />
                {!ta && <span className="hidden xl:inline">{accountLabel}</span>}
              </Link>
              <Button to="/book" size="sm" className="!h-10 whitespace-nowrap !px-5 max-md:hidden">
                {t.book}
              </Button>
              <button
                type="button"
                onClick={() => setOpen(o => !o)}
                aria-label={open ? (lang === 'ta' ? 'மூடு' : 'Close menu') : lang === 'ta' ? 'பட்டியல்' : 'Menu'}
                aria-expanded={open}
                className={`flex h-11 w-11 items-center justify-center rounded-full transition cursor-pointer ${ta ? 'xl:hidden' : 'lg:hidden'} ${onDark ? 'text-white hover:bg-white/10' : 'text-ink hover:bg-ink/5'}`}
              >
                <Icon name={open ? 'x' : 'menu'} size={20} />
              </button>
            </div>
          </nav>

          <AnimatePresence>
            {lang === 'ta' && !scrolled && !open && (
              <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.7, ease: EASE }}
                className="mx-auto -mt-1 max-w-[calc(72rem-48px)] px-6 md:px-8"
              >
                <Thoranam dark={!onDark} className="h-[46px]" />
              </motion.div>
            )}
          </AnimatePresence>

          <OrderStatusBar onDark={onDark} />
        </div>
      </motion.header>

      <MobileMenu open={open} onClose={() => setOpen(false)} accountTo={accountTo} accountLabel={accountLabel} />
    </>
  )
}

function MobileMenu({ open, onClose, accountTo, accountLabel }: { open: boolean; onClose: () => void; accountTo: string; accountLabel: string }) {
  const lang = useLang()
  const t = useT(COMMON)
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={`fixed inset-0 z-40 ${lang === 'ta' ? 'xl:hidden' : 'lg:hidden'}`}
          initial={{ clipPath: 'circle(0% at calc(100% - 44px) 44px)' }}
          animate={{ clipPath: 'circle(150% at calc(100% - 44px) 44px)' }}
          exit={{ clipPath: 'circle(0% at calc(100% - 44px) 44px)' }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <div className="ambient-dark grain absolute inset-0" />
          <div className="relative flex h-full flex-col overflow-y-auto overscroll-contain px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-28 sm:px-7 sm:pt-32" data-lenis-prevent>
            <nav className="flex flex-1 flex-col" aria-label="Mobile">
              {LINKS.map((l, i) => (
                <motion.div key={l.to} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.06, duration: 0.7, ease: EASE }}>
                  <NavLink
                    to={l.to}
                    end={l.to === '/'}
                    onClick={onClose}
                    className={({ isActive }) => `t-2 flex min-h-14 items-center justify-between gap-4 border-b border-white/10 py-3.5 sm:py-4 ${isActive ? 'text-white' : 'text-white/55'}`}
                  >
                    {l.label[lang]}
                    <Icon name="arrowUpRight" size={22} className="shrink-0 text-ruby-bright" />
                  </NavLink>
                </motion.div>
              ))}
            </nav>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-8 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="t-label text-white/50">{t.language}</span>
                <LangToggle dark />
              </div>
              <Button to={accountTo} variant="glass-dark" size="lg" full onClick={onClose} iconLeft="users">
                {accountLabel}
              </Button>
              <Button to="/book" size="lg" full onClick={onClose} icon="arrowRight">
                {t.book}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
