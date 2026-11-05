import { useEffect, useRef, useState, type ReactNode } from 'react'
import { formatINR } from '../lib/i18n'
import { animate, motion, useInView, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, type Variants } from 'motion/react'

export const EASE = [0.16, 1, 0.3, 1] as const

/** Fade-up with a soft blur as the element enters the viewport. */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className = '',
  once = true,
  as = 'div',
}: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
  once?: boolean
  as?: 'div' | 'section' | 'li' | 'span' | 'p'
}) {
  const reduce = useReducedMotion()
  const M = motion[as]
  return (
    <M
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 0.9, delay, ease: EASE }}
    >
      {children}
    </M>
  )
}

/** Splits a heading into words that rise from a mask one after another. */
export function RevealText({
  text,
  className = '',
  delay = 0,
  as = 'h2',
  stagger = 0.06,
  immediate = false,
}: {
  text: string
  className?: string
  delay?: number
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
  stagger?: number
  /** Animate on mount rather than when scrolled into view (for heroes). */
  immediate?: boolean
}) {
  const reduce = useReducedMotion()
  const M = motion[as]
  const lines = text.split('\n')
  const container: Variants = { hidden: {}, show: { transition: { staggerChildren: stagger, delayChildren: delay } } }
  const word: Variants = reduce
    ? { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.4 } } }
    : { hidden: { y: '110%', rotate: 2 }, show: { y: '0%', rotate: 0, transition: { duration: 1, ease: EASE } } }
  const trigger = immediate ? { animate: 'show' } : { whileInView: 'show', viewport: { once: true, margin: '0px 0px -10% 0px' } }

  return (
    <M className={className} initial="hidden" {...trigger} variants={container} aria-label={text.replace(/\n/g, ' ')}>
      {lines.map((line, li) => (
        <span key={li} className="block" aria-hidden="true">
          {line.split(' ').map((w, wi) => (
            <span key={wi} className="inline-block overflow-hidden align-bottom pb-[0.12em] -mb-[0.12em]">
              <motion.span className="inline-block will-change-transform" variants={word}>
                {w}
                {wi < line.split(' ').length - 1 ? ' ' : ''}
              </motion.span>
            </span>
          ))}
        </span>
      ))}
    </M>
  )
}

/** Parent for staggered children; pair with <StaggerItem>. */
export function Stagger({ children, className = '', gap = 0.08, delay = 0 }: { children: ReactNode; className?: string; gap?: number; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap, delayChildren: delay } } }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className = '', y = 24 }: { children: ReactNode; className?: string; y?: number }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y, filter: 'blur(6px)' },
        show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.8, ease: EASE } },
      }}
    >
      {children}
    </motion.div>
  )
}

/** Image container that wipes open from the bottom while the image settles from a zoom. */
export function ImageReveal({ children, className = '', delay = 0, direction = 'up' }: { children: ReactNode; className?: string; delay?: number; direction?: 'up' | 'left' }) {
  const reduce = useReducedMotion()
  const from = direction === 'up' ? 'inset(100% 0% 0% 0%)' : 'inset(0% 100% 0% 0%)'
  return (
    <motion.div
      className={`overflow-hidden ${className}`}
      initial={reduce ? { opacity: 0 } : { clipPath: from }}
      whileInView={reduce ? { opacity: 1 } : { clipPath: 'inset(0% 0% 0% 0%)' }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      transition={{ duration: 1.3, delay, ease: EASE }}
    >
      <motion.div
        className="h-full w-full"
        initial={reduce ? {} : { scale: 1.25 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, margin: '0px 0px -8% 0px' }}
        transition={{ duration: 1.8, delay, ease: EASE }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

/** Moves its child vertically relative to scroll for a depth effect. */
export function Parallax({ children, className = '', offset = 80 }: { children: ReactNode; className?: string; offset?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-offset, offset])
  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div style={{ y }} className="h-[calc(100%+160px)] -mt-20 w-full">
        {children}
      </motion.div>
    </div>
  )
}

/** Counts up to a number once visible. */
export function Counter({ to, suffix = '', prefix = '', className = '', duration = 2 }: { to: number; suffix?: string; prefix?: string; className?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' })
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!inView) return
    const c = animate(0, to, { duration, ease: EASE, onUpdate: v => setVal(v) })
    return () => c.stop()
  }, [inView, to, duration])
  return (
    <span ref={ref} className={className}>
      {prefix}
      {Math.round(val).toLocaleString('en-IN')}
      {suffix}
    </span>
  )
}

/** Endless horizontal ticker. Children are rendered twice for a seamless loop. */
export function Marquee({ children, className = '', speed = 38, reverse = false }: { children: ReactNode; className?: string; speed?: number; reverse?: boolean }) {
  return (
    <div className={`overflow-hidden mask-fade-x ${className}`}>
      <div
        className="flex w-max animate-marquee"
        style={{ animationDuration: `${speed}s`, animationDirection: reverse ? 'reverse' : 'normal' }}
      >
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  )
}

/** Paragraph whose words brighten one by one as it scrolls through the viewport. */
export function ScrollText({ text, className = '', dimClass = 'opacity-[0.18]' }: { text: string; className?: string; dimClass?: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.45'] })
  const words = text.split(' ')
  return (
    <p ref={ref} className={className} aria-label={text}>
      {words.map((w, i) => (
        <ScrollWord key={i} word={w} range={[i / words.length, (i + 1) / words.length]} progress={scrollYProgress} dimClass={dimClass} />
      ))}
    </p>
  )
}

function ScrollWord({ word, range, progress, dimClass }: { word: string; range: [number, number]; progress: ReturnType<typeof useScroll>['scrollYProgress']; dimClass: string }) {
  const opacity = useTransform(progress, range, [0, 1])
  return (
    <span className="relative mr-[0.25em] inline-block" aria-hidden="true">
      <span className={dimClass}>{word}</span>
      <motion.span style={{ opacity }} className="absolute inset-0">{word}</motion.span>
    </span>
  )
}

/**
 * Card that leans toward the pointer in 3D with a soft glare following it.
 * Mouse and pen only; touch screens and reduced motion get a flat card.
 */
export function Tilt({ children, className = '', max = 7, glare = true }: { children: ReactNode; className?: string; max?: number; glare?: boolean }) {
  const reduce = useReducedMotion()
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const sx = useSpring(px, { stiffness: 220, damping: 22 })
  const sy = useSpring(py, { stiffness: 220, damping: 22 })
  const rotateY = useTransform(sx, [0, 1], [-max, max])
  const rotateX = useTransform(sy, [0, 1], [max, -max])
  const glareBg = useTransform([sx, sy], ([x, y]) => `radial-gradient(420px circle at ${(x as number) * 100}% ${(y as number) * 100}%, rgba(255,255,255,0.28), transparent 45%)`)
  const [hover, setHover] = useState(false)
  if (reduce) return <div className={className}>{children}</div>
  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return
    const r = e.currentTarget.getBoundingClientRect()
    px.set((e.clientX - r.left) / r.width)
    py.set((e.clientY - r.top) / r.height)
  }
  const leave = () => {
    px.set(0.5)
    py.set(0.5)
    setHover(false)
  }
  return (
    <div className={`[perspective:1000px] ${className}`} onPointerMove={move} onPointerEnter={e => e.pointerType !== 'touch' && setHover(true)} onPointerLeave={leave}>
      <motion.div className="relative h-full w-full rounded-[inherit] [transform-style:preserve-3d]" style={{ rotateX, rotateY }}>
        {children}
        {glare && (
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] mix-blend-soft-light"
            style={{ background: glareBg }}
            animate={{ opacity: hover ? 1 : 0 }}
            transition={{ duration: 0.4 }}
          />
        )}
      </motion.div>
    </div>
  )
}

/** A one-off band of light that sweeps across its parent each time `trigger` changes. */
export function Sweep({ trigger, className = '', tone = 'rgba(255,255,255,0.65)' }: { trigger: unknown; className?: string; tone?: string }) {
  const reduce = useReducedMotion()
  if (reduce) return null
  return (
    <motion.span
      key={String(trigger)}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-y-0 -left-1/2 z-10 w-1/2 skew-x-[-18deg] ${className}`}
      style={{ background: `linear-gradient(90deg, transparent, ${tone}, transparent)` }}
      initial={{ x: '0%', opacity: 0 }}
      animate={{ x: '400%', opacity: [0, 1, 0] }}
      transition={{ duration: 1.1, ease: EASE }}
    />
  )
}

/**
 * Rupee amount that rolls smoothly to each new value and flashes ruby when it
 * rises, grey when it falls, before settling back to its own colour.
 */
export function AnimatedINR({ value, className = '', flash = true, live = true }: { value: number; className?: string; flash?: boolean; live?: boolean }) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLSpanElement>(null)
  const mv = useMotionValue(value)
  const text = useTransform(mv, v => formatINR(v))
  const prev = useRef(value)
  useEffect(() => {
    const was = prev.current
    prev.current = value
    if (reduce) {
      mv.set(value)
      return
    }
    const c = animate(mv, value, { duration: 0.9, ease: EASE })
    const el = ref.current
    let f: { stop: () => void } | undefined
    if (flash && el && was !== value) {
      el.style.color = ''
      const base = getComputedStyle(el).color
      f = animate(el, { color: [value > was ? '#9b111e' : '#8a8a92', base] }, { duration: 1.1, ease: EASE })
    }
    return () => {
      c.stop()
      f?.stop()
    }
  }, [value, reduce, mv, flash])
  return (
    <motion.span ref={ref} className={`tabular-nums ${className}`} aria-live={live ? 'polite' : undefined} aria-atomic={live ? 'true' : undefined}>
      {text}
    </motion.span>
  )
}

/** Pulls its child toward the pointer a little, like a magnet. Mouse and pen only. */
export function Magnetic({ children, className = '', strength = 0.28 }: { children: ReactNode; className?: string; strength?: number }) {
  const reduce = useReducedMotion()
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const x = useSpring(mx, { stiffness: 180, damping: 16 })
  const y = useSpring(my, { stiffness: 180, damping: 16 })
  if (reduce) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={`inline-flex ${className}`}
      style={{ x, y }}
      onPointerMove={e => {
        if (e.pointerType === 'touch') return
        const r = e.currentTarget.getBoundingClientRect()
        mx.set((e.clientX - r.left - r.width / 2) * strength)
        my.set((e.clientY - r.top - r.height / 2) * strength)
      }}
      onPointerLeave={() => {
        mx.set(0)
        my.set(0)
      }}
    >
      {children}
    </motion.div>
  )
}

/** A Sweep that plays once, the first time its parent scrolls into view. Parent needs relative + overflow-hidden. */
export function SweepInView({ tone, className = '', delay = 0.3 }: { tone?: string; className?: string; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -15% 0px' })
  const [go, setGo] = useState(false)
  useEffect(() => {
    if (!inView) return
    const id = window.setTimeout(() => setGo(true), delay * 1000)
    return () => window.clearTimeout(id)
  }, [inView, delay])
  return (
    <span ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      {go && <Sweep trigger="once" tone={tone} className={className} />}
    </span>
  )
}
