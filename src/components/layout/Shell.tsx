import { useEffect, type ReactNode } from 'react'
import { Navigate, useLocation, useOutlet } from 'react-router'
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from 'motion/react'
import { useLenis } from 'lenis/react'
import { Nav } from './Nav'
import { Footer } from './Footer'
import { LeadPopup } from './LeadPopup'
import { EASE } from '../motion'
import { Icon } from '../Icon'
import { useUi } from '../../lib/ui'
import { useStore } from '../../lib/store'
import { useLang } from '../../lib/i18n'

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

/** Keeps <html lang> in sync so the CSS font and type-scale switch with the language. */
export function LangSync() {
  const lang = useLang()
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])
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

export function SiteLayout() {
  return (
    <div className="flex min-h-[100svh] flex-col">
      <ScrollProgress />
      <Nav />
      <main className="relative flex-1">
        <AnimatedOutlet groupBy={groupTopLevel} />
      </main>
      <Footer />
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
