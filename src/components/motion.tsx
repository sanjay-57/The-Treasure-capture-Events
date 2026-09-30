import { useEffect, useRef, useState, type ReactNode } from 'react'
import { animate, motion, useInView, useReducedMotion, useScroll, useTransform, type Variants } from 'motion/react'

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
