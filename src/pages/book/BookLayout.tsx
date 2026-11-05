import { useEffect } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { AnimatedOutlet } from '../../components/layout/Shell'
import { Container, Steps } from '../../components/ui'
import { EASE } from '../../components/motion'
import { CartFlightLayer } from '../../components/CartFlight'
import { useLang } from '../../lib/i18n'
import { useStore, type BookingDraft } from '../../lib/store'
import { DISTRICTS, EVENTS } from '../../lib/data'
import { STEP_LABELS, STEP_PATHS, normalizePath, stepIndexOf } from './shared'
import { MobileQuoteBar, QuotePanel } from './Summary'
import { VoiceGuide } from './VoiceGuide'
import { EventBackdrop, PictorialTales } from './EventBackdrop'

/**
 * Chrome for the five booking steps: progress, the inner animated outlet
 * and the live quote (sticky panel on desktop, glass bar + sheet on mobile).
 * The confirmation screen renders full-width without the chrome.
 */
export default function BookLayout() {
  const lang = useLang()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const updateDraft = useStore(s => s.updateDraft)
  const path = normalizePath(pathname)
  const step = stepIndexOf(path)
  const confirmed = path.startsWith('/book/confirmed')

  // Footer and service links deep-link with ?district= and ?event= — apply them, then clean the URL.
  useEffect(() => {
    const d = params.get('district')
    const e = params.get('event')
    if (!d && !e) return
    const patch: Partial<BookingDraft> = {}
    const district = DISTRICTS.find(x => x.key === d)
    // Contact-only events (newborn / toddler) never enter the booking draft.
    const event = EVENTS.find(x => x.key === e && x.bookable !== false)
    if (district) patch.district = district.key
    if (event) patch.eventType = event.key
    if (Object.keys(patch).length) updateDraft(patch)
    const hasDistrict = !!(district || useStore.getState().draft.district)
    navigate(hasDistrict && step <= 1 ? '/book/event' : path, { replace: true })
  }, [params, updateDraft, navigate, step, path])

  return (
    <div className="relative isolate min-h-screen">
      {!confirmed && <EventBackdrop />}
      {/* Ambient light for the glass to refract, plus a faint kolam field in Tamil */}
      <div aria-hidden="true" className="ambient pointer-events-none absolute inset-0 -z-10" />
      <AnimatePresence>
        {lang === 'ta' && (
          <motion.div
            key="kolam"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.06 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="kolam-bg pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] [mask-image:linear-gradient(to_bottom,#000_0%,rgba(0,0,0,0.6)_40%,transparent_100%)]"
          />
        )}
      </AnimatePresence>

      {confirmed ? (
        <AnimatedOutlet />
      ) : (
        <div className="pb-[calc(9rem+env(safe-area-inset-bottom))] pt-36 md:pb-36 md:pt-48 lg:pb-28">
          <Container>
            <motion.nav initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }} aria-label={lang === 'ta' ? 'பதிவு படிகள்' : 'Booking steps'}>
              <Steps steps={STEP_LABELS.map(s => s[lang])} current={Math.max(0, step)} onStep={i => navigate(STEP_PATHS[i])} />
            </motion.nav>
            <div className="mt-8 grid gap-10 md:mt-12 md:gap-12 lg:mt-14 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_372px] xl:gap-16">
              <div className="min-w-0">
                <AnimatedOutlet />
              </div>
              <div className="hidden lg:block">
                <div className="sticky top-28">
                  <QuotePanel />
                </div>
              </div>
            </div>
            <PictorialTales />
          </Container>
          <MobileQuoteBar />
        </div>
      )}
      <VoiceGuide />
      <CartFlightLayer />
    </div>
  )
}
