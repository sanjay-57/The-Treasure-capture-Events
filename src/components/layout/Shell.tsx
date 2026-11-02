import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, Navigate, useLocation, useNavigate, useOutlet } from 'react-router'
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring } from 'motion/react'
import { useLenis } from 'lenis/react'
import { Nav } from './Nav'
import { Footer } from './Footer'
import { LeadPopup } from './LeadPopup'
import { EASE } from '../motion'
import { Icon } from '../Icon'
import { useUi } from '../../lib/ui'
import { useStore } from '../../lib/store'
import { COMMON, isAdminPath, useLang, useT } from '../../lib/i18n'
import { langFromSearch, withLangParam } from '../../lib/seo'

/**
 * Outlet with page transitions. The outgoing page fades up and blurs out,
 * the page scrolls to top while hidden, then the new page rises in.
 * `groupBy` lets nested layouts (booking, dashboard) keep their chrome
 * mounted while only their inner outlet transitions.
 */
export function AnimatedOutlet({ groupBy, scrollTop = true, className = '' }: { groupBy?: (path: string) => string; scrollTop?: boolean; className?: string }) {
  const location = useLocation()
  const outlet = useOutlet()
  const lenis = useLenis()
  const reduce = useReducedMotion()
  const key = groupBy ? groupBy(location.pathname) : location.pathname

  return (
    <AnimatePresence
      mode="wait"
      initial={false}
      onExitComplete={() => {
        if (!scrollTop) return
        if (lenis) lenis.scrollTo(0, { immediate: true, force: true })
        else window.scrollTo(0, 0)
      }}
    >
      <motion.div
        key={key}
        className={className}
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, filter: 'blur(8px)' }}
        // Clear filter/transform when done: both create a containing block that would trap position:fixed children.
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: EASE }, transitionEnd: { filter: 'none', transform: 'none' } }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12, filter: 'blur(8px)', transition: { duration: 0.35, ease: [0.4, 0, 1, 1] } }}
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * Keeps <html lang> in sync so the CSS font and type-scale switch with the
 * language, and ties the language to the URL on public pages: ?lang=ta or
 * ?lang=en on arrival sets it, and a toggle rewrites the URL (Tamil adds
 * ?lang=ta, English drops it). Internal links carry no param; the store remembers.
 */
export function LangSync() {
  const lang = useLang()
  const storeLang = useStore(s => s.lang)
  const location = useLocation()
  const navigate = useNavigate()
  const admin = isAdminPath(location.pathname)
  const prev = useRef(storeLang)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  // URL → store
  useEffect(() => {
    const want = langFromSearch(location.search)
    if (!admin && want && want !== useStore.getState().lang) useStore.getState().setLang(want)
  }, [location.search, admin])

  // store → URL, only when the language actually changes (a toggle)
  useEffect(() => {
    if (prev.current === storeLang) return
    prev.current = storeLang
    if (admin) return
    const search = withLangParam(location.search, storeLang)
    if (search !== location.search) navigate({ pathname: location.pathname, search, hash: location.hash }, { replace: true, preventScrollReset: true, state: location.state })
  }, [storeLang, admin, location, navigate])
  return null
}

export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 })
  return <motion.div className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-ruby" style={{ scaleX }} />
}

export function Toaster() {
  const toasts = useUi(s => s.toasts)
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(9.5rem+env(safe-area-inset-bottom))] z-[90] md:bottom-6 flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.4, ease: EASE }}
            className={`${t.tone === 'ruby' ? 'glass-ruby' : 'glass-dark'} flex max-w-md items-center gap-2.5 rounded-full px-5 py-3 text-sm font-medium [&>svg]:shrink-0`}
          >
            <Icon name="check" size={16} strokeWidth={2.2} />
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

/** Top-level group key: nested flows keep their layout mounted across steps. */
const groupTopLevel = (path: string) => {
  const seg = path.split('/')[1]
  return seg === 'book' || seg === 'dashboard' ? seg : path
}

/** Public marketing pages get the phone CTA bar; flows with their own bottom bars don't. */
const ctaBarPath = (path: string) => !/^\/(book|dashboard|admin|login|gallery\/?$|i\/)/.test(path)

const ctaCopy = {
  whatsapp: { en: 'WhatsApp', ta: 'வாட்ஸ்அப்' },
}

/**
 * Slim "Book / WhatsApp" bar pinned to the bottom on phones, shown once the
 * hero (with its own CTAs) has scrolled away. Clears the home indicator.
 */
function MobileCtaBar() {
  const t = useT(ctaCopy)
  const c = useT(COMMON)
  const wa = useStore(s => s.cms.studio.whatsapp).replace(/\D/g, '')
  const { scrollY } = useScroll()
  const [show, setShow] = useState(false)
  useMotionValueEvent(scrollY, 'change', y => setShow(y > window.innerHeight * 0.6))
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: '110%' }}
          animate={{ y: 0 }}
          exit={{ y: '110%' }}
          transition={{ duration: 0.45, ease: EASE }}
          className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:hidden print:hidden"
        >
          <div className="glass-ruby-dark mx-auto flex max-w-md items-center gap-2 rounded-full p-1.5 shadow-2xl">
            <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener" className="flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-[14px] font-medium text-white/90 transition active:scale-[0.97]">
              <Icon name="whatsapp" size={18} />
              {t.whatsapp}
            </a>
            <Link to="/book" className="flex h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full bg-ruby px-4 text-[14px] font-semibold text-white shadow-ruby transition active:scale-[0.97]">
              <span className="truncate">{c.book}</span>
              <Icon name="arrowRight" size={15} className="shrink-0" />
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function SiteLayout() {
  const { pathname } = useLocation()
  const ctaBar = ctaBarPath(pathname)
  return (
    <div className="flex min-h-[100svh] flex-col">
      <ScrollProgress />
      <Nav />
      <main className="relative flex-1">
        <AnimatedOutlet groupBy={groupTopLevel} />
      </main>
      <Footer ctaBar={ctaBar} />
      {ctaBar && <MobileCtaBar />}
      <LeadPopup />
    </div>
  )
}

export function RequireClient({ children }: { children: ReactNode }) {
  const session = useStore(s => s.session)
  const location = useLocation()
  if (session?.role !== 'client') return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />
  return <>{children}</>
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const session = useStore(s => s.session)
  if (session?.role !== 'admin') return <Navigate to="/admin/login" replace />
  return <>{children}</>
}
