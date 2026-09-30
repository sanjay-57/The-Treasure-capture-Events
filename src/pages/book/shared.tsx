import { useEffect, useRef, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { create } from 'zustand'
import { Button, Eyebrow, ListenButton } from '../../components/ui'
import type { IconName } from '../../components/Icon'
import { RevealText, Reveal, EASE } from '../../components/motion'
import { useLang, useT, formatINR, type Bi } from '../../lib/i18n'
import { useStore, type BookingDraft } from '../../lib/store'
import { computeQuote, type Quote } from '../../lib/pricing'

/*
 * Shared pieces of the booking flow: step metadata, route guards,
 * the live quote selector and the animated price.
 */

export const STEP_PATHS = ['/book', '/book/event', '/book/venue', '/book/package', '/book/details'] as const

export const STEP_LABELS: Bi[] = [
  { en: 'District', ta: 'மாவட்டம்' },
  { en: 'Event', ta: 'நிகழ்வு' },
  { en: 'Venue & date', ta: 'இடம் & தேதி' },
  { en: 'Package', ta: 'தொகுப்பு' },
  { en: 'Your details', ta: 'உங்கள் விவரம்' },
]

export const normalizePath = (p: string) => (p.length > 1 ? p.replace(/\/+$/, '') : p)

export function stepIndexOf(pathname: string): number {
  return STEP_PATHS.indexOf(normalizePath(pathname) as (typeof STEP_PATHS)[number])
}

/** Index of the earliest step whose required inputs are missing (5 = all complete). */
export function firstIncomplete(d: BookingDraft): number {
  if (!d.district) return 0
  if (!d.eventType) return 1
  if (!d.venueAddress.trim() || !d.date) return 2
  return 5
}

/**
 * Redirect target when the given step's prerequisites are missing.
 * Only acts while this step is the current route, so a page that is
 * animating out (e.g. after submit resets the draft) never redirects.
 */
export function useStepRedirect(step: number): string | null {
  const draft = useStore(s => s.draft)
  const { pathname } = useLocation()
  if (normalizePath(pathname) !== STEP_PATHS[step]) return null
  const first = firstIncomplete(draft)
  return first < step ? STEP_PATHS[first] : null
}

/** Wraps a step so it renders only once earlier steps are complete. */
export function StepGuard({ step, children }: { step: number; children: ReactNode }) {
  const to = useStepRedirect(step)
  if (to) return <Navigate to={to} replace />
  return <>{children}</>
}

export function quoteFor(d: BookingDraft): Quote | null {
  if (!d.eventType) return null
  return computeQuote({
    eventType: d.eventType,
    durationHours: d.durationHours,
    crowd: d.crowd,
    venueType: d.venueType,
    distanceKm: d.distanceKm,
    packageId: d.packageId,
    addons: d.addons,
  })
}

export function useQuote(): Quote | null {
  const draft = useStore(s => s.draft)
  return quoteFor(draft)
}

/** Rupee amount that rolls smoothly to each new value. */
export function AnimatedINR({ value, className = '' }: { value: number; className?: string }) {
  const reduce = useReducedMotion()
  const mv = useMotionValue(value)
  const text = useTransform(mv, v => formatINR(v))
  useEffect(() => {
    if (reduce) {
      mv.set(value)
      return
    }
    const c = animate(mv, value, { duration: 0.9, ease: EASE })
    return () => c.stop()
  }, [value, reduce, mv])
  return (
    <motion.span className={`tabular-nums ${className}`} aria-live="polite" aria-atomic="true">
      {text}
    </motion.span>
  )
}

/** The current step's primary action, mirrored into the mobile bottom dock. */
export interface StepAction {
  onNext: () => void
  label: string
  short?: string
  disabled?: boolean
  hint?: string
  busy?: boolean
  icon?: IconName
}

export const useStepAction = create<{ action: StepAction | null }>(() => ({ action: null }))

export function useDockAction(a: StepAction) {
  const ref = useRef(a)
  useEffect(() => {
    ref.current = a
  })
  const { label, short, disabled, hint, busy, icon } = a
  useEffect(() => {
    useStepAction.setState({ action: { label, short, disabled, hint, busy, icon, onNext: () => ref.current.onNext() } })
  }, [label, short, disabled, hint, busy, icon])
  useEffect(() => () => useStepAction.setState({ action: null }), [])
}

const headCopy = {
  step: { en: 'Step', ta: 'படி' },
  of: { en: 'of', ta: '/' },
}

/** Consistent page header for each step. */
export function StepHeader({ step, title, lead, listen }: { step: number; title: string; lead?: string; listen?: Bi }) {
  const t = useT(headCopy)
  const lang = useLang()
  return (
    <header className="mb-8 md:mb-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Eyebrow>
          {t.step} {step + 1} {t.of} 5 · {STEP_LABELS[step][lang]}
        </Eyebrow>
        {listen && <ListenButton text={listen} />}
      </div>
      <RevealText key={lang} as="h1" text={title} immediate className="t-2 mt-4 text-ink [overflow-wrap:anywhere] md:mt-5" />
      {lead && (
        <Reveal delay={0.12}>
          <p className="t-lead mt-4 max-w-2xl text-ink/60">{lead}</p>
        </Reveal>
      )}
    </header>
  )
}

const navCopy = {
  back: { en: 'Back', ta: 'பின் செல்' },
}

/** Back + continue row at the foot of each step; on phones continue lives in the bottom dock. */
export function StepNav({ back, onNext, nextLabel, disabled, hint }: { back?: string; onNext: () => void; nextLabel: string; disabled?: boolean; hint?: string }) {
  const t = useT(navCopy)
  useDockAction({ onNext, label: nextLabel, disabled, hint })
  return (
    <div className="mt-10 flex flex-col-reverse items-stretch gap-4 border-t hairline pt-6 sm:flex-row sm:items-center sm:justify-between md:mt-14 md:pt-8">
      {back ? (
        <Button to={back} variant="ghost" iconLeft="arrowLeft" className="self-start">
          {t.back}
        </Button>
      ) : (
        <span />
      )}
      <div className="hidden flex-col items-stretch gap-2 sm:items-end md:flex">
        <Button onClick={onNext} disabled={disabled} size="lg" icon="arrowRight" className="w-full sm:w-auto">
          {nextLabel}
        </Button>
        {hint && <p className="text-center text-xs text-ink/45 sm:text-right">{hint}</p>}
      </div>
    </div>
  )
}

/** Small section heading used inside steps. */
export function SubHeading({ index, title, note, className = '' }: { index?: string; title: string; note?: string; className?: string }) {
  return (
    <div className={`mb-6 flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-baseline gap-3">
        {index && <span className="font-display text-sm italic text-ruby">{index}</span>}
        <h2 className="t-3 text-ink">{title}</h2>
      </div>
      {note && <p className="max-w-xl text-sm leading-relaxed text-ink/55">{note}</p>}
    </div>
  )
}

export const hoursLabel = (h: number, lang: 'en' | 'ta') => (lang === 'ta' ? `${h} மணி நேரம்` : `${h} hours`)

export const todayISO = () => {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

export function formatTime(t: string, lang: 'en' | 'ta'): string {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const d = new Date(2000, 0, 1, h, m)
  return d.toLocaleTimeString(lang === 'ta' ? 'ta-IN' : 'en-IN', { hour: 'numeric', minute: '2-digit' })
}
