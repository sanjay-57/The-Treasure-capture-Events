import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, animate, motion } from 'motion/react'
import { create } from 'zustand'
import { Icon, type IconName } from './Icon'
import { EASE } from './motion'
import { formatINR } from '../lib/i18n'

/*
 * "Fly to cart". When a family adds an option, its photo lifts off the card,
 * arcs across the screen and lands on the live total, which bumps, throws a
 * few ruby-and-gold sparks and shows a "+1". Taking an option out flies it
 * back from the total to its card. Picking a package pours its items in one
 * after another.
 *
 * Any element wrapped in <CartTarget> can receive a flight; the first one on
 * screen wins, so the desktop panel, the phone dock and the tablet bar all
 * work without wiring. With reduced motion only the bump plays.
 */

export type FlightDirection = 'in' | 'out'

interface Point {
  x: number
  y: number
}

interface Flight {
  key: number
  direction: FlightDirection
  from: Point & { size: number }
  to: Point
  src?: string
  icon: IconName
  delay: number
  receipt?: Receipt
}

/** What the phone chip says once a flight lands. */
export interface Receipt {
  label: string
  amount?: number
  direction: FlightDirection
}

interface FlightStore {
  flights: Flight[]
  /** Bumps once per landing so targets can react. */
  pulse: number
  kind: FlightDirection
  /** Latest landed change, for the phone chip; n bumps per landing. */
  last: (Receipt & { n: number }) | null
  land: (key: number, direction: FlightDirection) => void
}

export const useCartFlight = create<FlightStore>(set => ({
  flights: [],
  pulse: 0,
  kind: 'in',
  last: null,
  land: (key, direction) =>
    set(s => {
      const f = s.flights.find(x => x.key === key)
      return { flights: s.flights.filter(x => x.key !== key), pulse: s.pulse + 1, kind: direction, last: f?.receipt ? { ...f.receipt, n: s.pulse + 1 } : s.last }
    }),
}))

let seq = 0
let lastPointer: Point | null = null
let tracking = false

/** Remembers the last tap so an option without a card of its own still has a lift-off point. */
function trackPointer() {
  if (tracking || typeof window === 'undefined') return
  tracking = true
  window.addEventListener(
    'pointerdown',
    e => {
      lastPointer = { x: e.clientX, y: e.clientY }
    },
    { capture: true, passive: true },
  )
}

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const visible = (el: Element) => {
  const r = el.getBoundingClientRect()
  return r.width > 0 && r.height > 0
}

const optionEl = (id: string) => document.querySelector<HTMLElement>(`[data-opt="${id}"]`) ?? document.getElementById(`opt-${id}`)

/** Centre of the cart total that is on screen right now, if any. */
function findTarget(): Point | null {
  const el = Array.from(document.querySelectorAll<HTMLElement>('[data-cart-target]')).find(visible)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}

/**
 * Where a flight lifts off: the option's photo, else the element itself,
 * else the last tap. An explicit element may sit below the fold (a package
 * pouring in); its flight then starts at the screen edge.
 */
function findOrigin(id: string, from?: HTMLElement): { point: Point & { size: number }; src?: string } | null {
  const host = from ?? optionEl(id)
  const img = host?.querySelector('img')
  const el = img ?? host
  if (el && visible(el)) {
    const r = el.getBoundingClientRect()
    const near = r.bottom > -240 && r.top < window.innerHeight + 240
    if (near || from) {
      const y = Math.min(window.innerHeight + 24, Math.max(-24, r.top + r.height / 2))
      const src = img?.currentSrc || img?.src || undefined
      return { point: { x: r.left + r.width / 2, y, size: Math.max(32, Math.min(r.width, r.height, 96)) }, src }
    }
  }
  if (lastPointer) return { point: { ...lastPointer, size: 44 } }
  return null
}

export interface FlyOptions {
  /** Catalogue id; the origin is looked up as [data-opt=id] or #opt-id. */
  id: string
  direction?: FlightDirection
  /** Explicit origin when the option has no card of its own. */
  from?: HTMLElement
  /** Drawn when the origin has no photo. */
  icon?: IconName
  delay?: number
  /** Name and price for the phone chip. */
  label?: string
  amount?: number
}

/** Sends one option flying into (or out of) the cart. Safe anywhere; a no-op without a DOM or a visible total. */
export function flyToCart({ id, direction = 'in', from, icon = 'sparkle', delay = 0, label, amount }: FlyOptions) {
  const receipt: Receipt | undefined = label ? { label, amount, direction } : undefined
  if (typeof document === 'undefined') return
  const to = findTarget()
  const origin = findOrigin(id, from)
  if (import.meta.env.DEV) console.info('[cart-flight]', id, direction, { target: !!to, origin: !!origin, reducedMotion: reduced() })
  if (!to) return
  if (!origin || reduced()) {
    useCartFlight.setState(s => ({ pulse: s.pulse + 1, kind: direction, last: receipt ? { ...receipt, n: s.pulse + 1 } : s.last }))
    return
  }
  useCartFlight.setState(s => ({ flights: [...s.flights, { key: ++seq, direction, from: origin.point, to, src: origin.src, icon, delay, receipt }] }))
}

/** A whole package pouring in: the items nearest the viewport lift off one after another. */
export function pourIntoCart(ids: string[], max = 6, label?: string) {
  if (typeof document === 'undefined') return
  const mid = window.innerHeight / 2
  ids
    .map(id => ({ id, el: optionEl(id) }))
    .filter((x): x is { id: string; el: HTMLElement } => !!x.el && visible(x.el))
    .map(x => ({ ...x, d: Math.abs(x.el.getBoundingClientRect().top - mid) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, max)
    .forEach((x, i) => flyToCart({ id: x.id, from: x.el, delay: i * 0.09, label: i === 0 ? label : undefined }))
}

// ─── The flying sprite ───────────────────────────────────────────────────────

const SIZE = 56
const STEPS = 20
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/** Points along a quadratic arc from a to b, lifted over the straight line, with the easing baked in. */
function arc(a: Point, b: Point) {
  const dx = b.x - a.x
  const lift = Math.min(240, 80 + Math.abs(dx) * 0.16 + Math.abs(b.y - a.y) * 0.1)
  const cx = (a.x + b.x) / 2 - dx * 0.1
  const cy = Math.min(a.y, b.y) - lift
  const xs: number[] = []
  const ys: number[] = []
  for (let i = 0; i <= STEPS; i++) {
    const t = easeInOut(i / STEPS)
    const u = 1 - t
    xs.push(u * u * a.x + 2 * u * t * cx + t * t * b.x - SIZE / 2)
    ys.push(u * u * a.y + 2 * u * t * cy + t * t * b.y - SIZE / 2)
  }
  return { xs, ys }
}

function Sprite({ f }: { f: Flight }) {
  const land = useCartFlight(s => s.land)
  const inward = f.direction === 'in'
  const { xs, ys } = inward ? arc(f.from, f.to) : arc(f.to, f.from)
  const dur = 0.85
  const start = inward ? Math.max(0.8, Math.min(1.4, f.from.size / SIZE)) : 0.35
  const path = { duration: dur, delay: f.delay, ease: 'linear' as const }
  const shape = { duration: dur, delay: f.delay, ease: EASE, times: [0, 0.22, 0.78, 1] }
  return (
    <>
      {inward && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none fixed z-[79] rounded-[18px] border-2 border-ruby"
          style={{ left: f.from.x - f.from.size / 2, top: f.from.y - f.from.size / 2, width: f.from.size, height: f.from.size }}
          initial={{ scale: 0.85, opacity: 0.7 }}
          animate={{ scale: 1.7, opacity: 0 }}
          transition={{ duration: 0.7, delay: f.delay, ease: EASE }}
        />
      )}
      {/* Comet trail: two fading ghosts a beat behind */}
      {[0.05, 0.1].map((lag, i) => (
        <motion.span
          key={lag}
          aria-hidden="true"
          className="pointer-events-none fixed left-0 top-0 z-[79] rounded-full bg-ruby"
          style={{ width: SIZE, height: SIZE }}
          initial={{ x: xs[0], y: ys[0], scale: 0, opacity: 0 }}
          animate={{ x: xs, y: ys, scale: inward ? [start * 0.8, 0.9 - i * 0.15, 0.8 - i * 0.15, 0.2] : [0.3, 0.8, 0.7, 0.6], opacity: [0, i ? 0.25 : 0.45, i ? 0.25 : 0.45, 0] }}
          transition={{ x: { ...path, delay: f.delay + lag }, y: { ...path, delay: f.delay + lag }, scale: { ...shape, delay: f.delay + lag }, opacity: { ...shape, delay: f.delay + lag } }}
        />
      ))}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[80]"
        style={{ width: SIZE, height: SIZE }}
        initial={{ x: xs[0], y: ys[0], scale: start, rotate: 0, opacity: inward ? 1 : 0.8 }}
        animate={{
          x: xs,
          y: ys,
          scale: inward ? [start, 1.12, 1, 0.28] : [0.35, 1.05, 1, 0.9],
          rotate: inward ? [0, -12, 6, 18] : [0, 10, -6, 0],
          opacity: inward ? [1, 1, 1, 0.9] : [0.8, 1, 1, 0],
        }}
        transition={{ x: path, y: path, scale: shape, rotate: shape, opacity: shape }}
        onAnimationComplete={() => land(f.key, f.direction)}
      >
        <span className="block h-full w-full overflow-hidden rounded-full border-2 border-white bg-ruby shadow-[0_14px_34px_-8px_rgba(155,17,30,0.65)]">
          {f.src ? <img src={f.src} alt="" className="h-full w-full object-cover" /> : <Icon name={f.icon} size={24} className="m-auto h-full text-white" />}
        </span>
        <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-gold shadow-[0_0_12px_2px_rgba(201,162,39,0.75)]" />
      </motion.div>
    </>
  )
}

/** Mount once wherever the cart lives. Portals the sprites onto the body. */
export function CartFlightLayer() {
  const flights = useCartFlight(s => s.flights)
  useEffect(trackPointer, [])
  if (typeof document === 'undefined') return null
  return createPortal(
    <>
      {flights.map(f => (
        <Sprite key={f.key} f={f} />
      ))}
    </>,
    document.body,
  )
}

// ─── The landing spot ────────────────────────────────────────────────────────

const SPARKS = Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2 - Math.PI / 2)

export function Burst({ kind, badge = true }: { kind: FlightDirection; badge?: boolean }) {
  const inward = kind === 'in'
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0">
      <motion.span
        className={`absolute -inset-1.5 rounded-2xl border-2 ${inward ? 'border-ruby/60' : 'border-ink/25'}`}
        initial={{ scale: 0.92, opacity: 0.8 }}
        animate={{ scale: 1.3, opacity: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
      />
      {inward &&
        SPARKS.map((a, i) => (
          <motion.span
            key={i}
            className={`absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full ${i % 2 ? 'bg-gold' : 'bg-ruby'}`}
            initial={{ x: -3, y: -3, scale: 0, opacity: 1 }}
            animate={{ x: -3 + Math.cos(a) * (36 + (i % 3) * 10), y: -3 + Math.sin(a) * (24 + (i % 2) * 10), scale: [0, 1.3, 0], opacity: [1, 1, 0] }}
            transition={{ duration: 0.75, ease: EASE, delay: 0.015 * i }}
          />
        ))}
      {badge && <motion.span
        className={`absolute -top-2 right-0 rounded-full px-1.5 py-0.5 font-sans text-[11px] font-bold leading-none text-white ${inward ? 'bg-ruby shadow-ruby' : 'bg-ink/60'}`}
        initial={{ y: 6, opacity: 0, scale: 0.6 }}
        animate={{ y: [6, -14, -22], opacity: [0, 1, 0], scale: [0.6, 1, 1] }}
        transition={{ duration: 1.05, ease: EASE }}
      >
        {inward ? '+1' : '−1'}
      </motion.span>}
    </span>
  )
}

/** Wraps a cart total so flights can land on it: it bumps, sparks and shows ±1. */
export function CartTarget({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const pulse = useCartFlight(s => s.pulse)
  const kind = useCartFlight(s => s.kind)
  const seen = useRef(pulse)
  const [burst, setBurst] = useState<{ n: number; kind: FlightDirection } | null>(null)

  useEffect(() => {
    if (pulse === seen.current) return
    seen.current = pulse
    const el = ref.current
    if (!el || !visible(el)) return
    if (!reduced()) animate(el, { scale: kind === 'in' ? [1, 1.12, 0.96, 1] : [1, 0.92, 1.03, 1] }, { duration: 0.6, ease: EASE })
    setBurst({ n: pulse, kind })
  }, [pulse, kind])

  return (
    <div ref={ref} data-cart-target className={`relative ${className}`}>
      {children}
      {burst && !reduced() && <Burst key={burst.n} kind={burst.kind} />}
    </div>
  )
}

// ─── Card feedback ───────────────────────────────────────────────────────────

/** Squeezes a thumbnail when its count rises (plucked) or falls (put back). */
export function usePluck<T extends HTMLElement>(count: number, depth = 0.84) {
  const ref = useRef<T>(null)
  const prev = useRef(count)
  useEffect(() => {
    const was = prev.current
    prev.current = count
    const el = ref.current
    if (!el || was === count || reduced()) return
    animate(el, count > was ? { scale: [1, depth, 1.06, 1], rotate: [0, -4, 2, 0] } : { scale: [1, 1.05, 0.95, 1] }, { duration: 0.55, ease: EASE })
  }, [count, depth])
  return ref
}

export function Pluck({ n, depth, className = '', children }: { n: number; depth?: number; className?: string; children: ReactNode }) {
  const ref = usePluck<HTMLSpanElement>(n, depth)
  return (
    <span ref={ref} className={className}>
      {children}
    </span>
  )
}

// ─── Phone receipt chip ──────────────────────────────────────────────────────

/** "+ Drone · ₹5,000" above the phone dock for a moment after each landing. */
export function CartToast({ className = '' }: { className?: string }) {
  const last = useCartFlight(s => s.last)
  const [shown, setShown] = useState<typeof last>(null)
  useEffect(() => {
    if (!last) return
    setShown(last)
    const t = window.setTimeout(() => setShown(null), 2200)
    return () => window.clearTimeout(t)
  }, [last])
  return (
    <div className={`pointer-events-none flex justify-center ${className}`} aria-live="polite">
      <AnimatePresence>
        {shown && (
          <motion.p
            key={shown.n}
            initial={{ y: 12, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -6, opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="glass-strong inline-flex max-w-full items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3.5 text-[12.5px] font-medium text-ink"
          >
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white ${shown.direction === 'in' ? 'bg-ruby' : 'bg-ink/45'}`}>
              <Icon name={shown.direction === 'in' ? 'plus' : 'minus'} size={13} strokeWidth={2.6} />
            </span>
            <span className={`truncate ${shown.direction === 'out' ? 'text-ink/55 line-through decoration-ink/25' : ''}`}>{shown.label}</span>
            {shown.direction === 'in' && shown.amount ? <span className="shrink-0 font-semibold tabular-nums text-ruby">{formatINR(shown.amount)}</span> : null}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
