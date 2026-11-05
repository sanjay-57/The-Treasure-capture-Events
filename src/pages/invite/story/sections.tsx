import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { AnimatePresence, motion, useScroll, useSpring } from 'motion/react'
import { Icon, type IconName } from '../../../components/Icon'
import type { Lang } from '../../../lib/i18n'
import {
  calendarUrl, countdown, dateParts, directionsUrl, inviteDay, isPremium, rsvpUrl, timeLabel,
  type Invite, type InviteEvent,
} from '../../../lib/invite'
import { coupleUrl } from '../caricature'
import { rnd } from '../themes'
import { Cluster, Diya, Invocation, Kolam, Lantern, Rule } from './motifs'
import { shade, type StoryTheme } from './theme'

/*
 * The scrolling page under the opener. Every section rises into view as it is
 * reached (`Reveal`, rooted on the page's own scroller so it also works inside
 * the builder's preview). Sizes are in em off the stage's font size.
 */

export const ScrollRoot = createContext<RefObject<HTMLDivElement | null> | null>(null)

const EASE = [0.22, 1, 0.36, 1] as const

const copy = {
  request: { en: 'Together with their families, request the pleasure of your presence at the wedding of', ta: 'இருவீட்டார் பெரியோர்களின் நல்லாசியுடன் நடைபெறும் திருமண விழாவிற்கு தங்களை அன்புடன் அழைக்கிறோம்' },
  scroll: { en: 'Scroll', ta: 'கீழே' },
  couple: { en: 'The couple', ta: 'மணமக்கள்' },
  story: { en: 'Our story', ta: 'எங்கள் கதை' },
  save: { en: 'Save the date', ta: 'நாளைக் குறித்துக்கொள்ளுங்கள்' },
  scratch: { en: 'Scratch to reveal', ta: 'தேய்த்துப் பாருங்கள்' },
  countdown: { en: 'Counting down to forever', ta: 'நாள் எண்ணிக்கை' },
  units: { en: ['Days', 'Hours', 'Mins', 'Secs'], ta: ['நாள்', 'மணி', 'நிமி', 'விநா'] },
  married: { en: 'Just married!', ta: 'திருமணம் இனிதே நடந்தது!' },
  calendar: { en: 'Add to calendar', ta: 'நாட்காட்டியில் சேர்' },
  events: { en: 'The celebrations', ta: 'விழா நிகழ்வுகள்' },
  muhurtham: { en: 'Muhurtham', ta: 'முகூர்த்தம்' },
  venue: { en: 'The venue', ta: 'மண்டபம்' },
  directions: { en: 'Directions', ta: 'வழி' },
  map: { en: 'Map & QR', ta: 'வரைபடம்' },
  rsvpTitle: { en: 'Will you join us?', ta: 'வருகை தருவீர்களா?' },
  rsvpLine: { en: 'Your blessings mean the world to us. Let us know on WhatsApp.', ta: 'உங்கள் ஆசி எங்களுக்குப் பெரும் பேறு. வாட்ஸ்அப்பில் தெரிவியுங்கள்.' },
  rsvp: { en: 'Joyfully accept', ta: 'மகிழ்வுடன் வருகிறோம்' },
  blessing: { en: 'With love and blessings', ta: 'அன்பும் ஆசியும்' },
  presence: { en: 'Your presence is the greatest gift', ta: 'உங்கள் வருகையே எங்களுக்குப் பெரும் பரிசு' },
  share: { en: 'Share invite', ta: 'பகிர்' },
  fortune: { en: 'A fortune for you', ta: 'வாழ்த்துச் சீட்டு' },
  crafted: { en: 'Crafted by The Treasure Captures', ta: 'The Treasure Captures வடிவமைப்பு' },
}

export function Reveal({ children, delay = 0, y = 28, className, style }: { children: ReactNode; delay?: number; y?: number; className?: string; style?: CSSProperties }) {
  const root = useContext(ScrollRoot)
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.25, root: root ?? undefined }}
      transition={{ duration: 0.9, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

function Heading({ th, children }: { th: StoryTheme; children: ReactNode }) {
  return (
    <Reveal className="mb-[1.4em] flex flex-col items-center gap-[0.5em] text-center">
      <h2 className="text-[1.05em] uppercase tracking-[0.32em]" style={{ fontFamily: `${th.serif}, serif`, color: th.accent }}>{children}</h2>
      <Rule color={th.accent} />
    </Reveal>
  )
}

function Section({ th, children, className = '', style }: { th: StoryTheme; children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <section className={`relative px-[1.6em] py-[3.2em] ${className}`} style={style}>
      {children}
      <div className="pointer-events-none absolute inset-x-[20%] bottom-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${th.line}, transparent)` }} />
    </section>
  )
}

function Button({ th, href, onClick, icon, children, ghost = false }: { th: StoryTheme; href?: string; onClick?: () => void; icon: IconName; children: ReactNode; ghost?: boolean }) {
  const cls = 'inline-flex min-h-[2.9em] items-center justify-center gap-[0.5em] rounded-full px-[1.3em] text-[0.86em] font-semibold tracking-wide transition active:scale-95 cursor-pointer'
  const style: CSSProperties = ghost
    ? { border: `1px solid ${th.accent}`, color: th.accent }
    : { background: th.accent, color: th.onAccent, boxShadow: `0 8px 22px -8px ${th.accent}` }
  const body = <><Icon name={icon} size={16} />{children}</>
  return href
    ? <a href={href} target="_blank" rel="noreferrer" className={cls} style={style}>{body}</a>
    : <button type="button" onClick={onClick} className={cls} style={style}>{body}</button>
}

/** Names in a moving foil, revealed left to right like ink. */
function Name({ th, children, delay }: { th: StoryTheme; children: string; delay: number }) {
  const foil = `linear-gradient(100deg, ${th.accent} 0%, ${shade(th.accent, 0.45)} 22%, ${th.accent} 40%, ${shade(th.accent, -0.2)} 70%, ${th.accent} 100%)`
  return (
    <motion.span
      className="st-foil block px-[0.2em] leading-[1.15]"
      style={{ fontFamily: `${th.script}, ${th.ta}, cursive`, fontSize: '3.3em', backgroundImage: foil, backgroundSize: '220% 100%', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: th.dark ? 'drop-shadow(0 2px 10px rgba(0,0,0,0.5))' : undefined }}
      initial={{ clipPath: 'inset(0 100% 0 0)', opacity: 0 }}
      animate={{ clipPath: 'inset(0 0% 0 0)', opacity: 1 }}
      transition={{ duration: 1.6, delay, ease: [0.5, 0, 0.2, 1] }}
    >
      {children}
    </motion.span>
  )
}

// ─── Hero ───────────────────────────────────────────────────────────────────

export function Hero({ th, invite, lang, play }: { th: StoryTheme; invite: Invite; lang: Lang; play: boolean }) {
  const names = invite[lang]
  const d = 0.25
  return (
    <section className="relative flex min-h-[100cqh] flex-col items-center justify-center overflow-hidden px-[1.8em] py-[4.5em] text-center">
      {th.art.frame ? (
        <img src={th.art.frame} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
      ) : play ? (
        <>
          <div className="pointer-events-none absolute inset-[0.9em] rounded-[0.6em]" style={{ border: `1px solid ${th.line}`, boxShadow: `inset 0 0 0 4px transparent, inset 0 0 0 5px ${th.line}` }} />
          <Cluster th={th} size="52cqw" corner="tl" seed={1} delay={0.2} />
          <Cluster th={th} size="52cqw" corner="br" seed={5} delay={0.5} />
          <Cluster th={th} size="30cqw" corner="tr" seed={9} delay={0.8} />
          <Cluster th={th} size="30cqw" corner="bl" seed={13} delay={1} />
        </>
      ) : null}
      {play && (
        <div className="relative flex flex-col items-center">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: d }} className="mb-[1.4em]">
            <Invocation tradition={invite.tradition} lang={lang} color={th.accent} muted={th.muted} serif={th.serif} />
          </motion.div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: d + 0.3 }}
            className="mb-[1.2em] max-w-[22em] text-[0.82em] leading-relaxed" style={{ color: th.muted, fontFamily: lang === 'ta' ? undefined : `${th.serif}, serif` }}>
            {copy.request[lang]}
          </motion.p>
          <Name th={th} delay={d + 0.6}>{names[0]}</Name>
          <motion.span initial={{ opacity: 0, scale: 0.4, rotate: -30 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ delay: d + 1.5, type: 'spring', stiffness: 140, damping: 12 }}
            className="my-[0.1em] block text-[1.8em]" style={{ fontFamily: `${th.script}, cursive`, color: th.ink }}>&amp;</motion.span>
          <Name th={th} delay={d + 1.7}>{names[1]}</Name>
          {invite.parents?.[lang] && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: d + 2.6 }} className="mt-[1.2em] max-w-[22em] text-[0.8em] leading-relaxed" style={{ color: th.muted }}>
              {invite.parents[lang]}
            </motion.p>
          )}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: d + 2.8 }} className="mt-[1.4em] flex flex-col items-center gap-[0.6em]">
            <Rule color={th.accent} />
            <p className="text-[0.95em] uppercase tracking-[0.22em]" style={{ fontFamily: `${th.serif}, serif`, color: th.ink }}>{inviteDay(invite.date, lang)}</p>
            <p className="text-[0.82em]" style={{ color: th.muted }}>{invite.venue}</p>
          </motion.div>
        </div>
      )}
      {play && (
        <motion.div className="absolute bottom-[1.4em] flex flex-col items-center gap-1 text-[0.66em] uppercase tracking-[0.3em]" style={{ color: th.muted }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: d + 3.4 }}>
          {copy.scroll[lang]}
          <span className="st-bob"><Icon name="chevronDown" size={18} /></span>
        </motion.div>
      )}
    </section>
  )
}

// ─── Couple & story ─────────────────────────────────────────────────────────

export function Couple({ th, invite, lang, art }: { th: StoryTheme; invite: Invite; lang: Lang; art?: string }) {
  const pic = isPremium(invite.theme) ? art || invite.caricature || coupleUrl(th.accent) : undefined
  if (!pic && !invite.story) return null
  const own = !!(art || invite.caricature)
  return (
    <Section th={th}>
      <Heading th={th}>{invite.story ? copy.story[lang] : copy.couple[lang]}</Heading>
      {pic && (
        <Reveal className="mx-auto mb-[1.6em] w-[62%]">
          <div className="relative aspect-[3/4] overflow-hidden" style={{ borderRadius: '50% 50% 0.8em 0.8em / 38% 38% 0.8em 0.8em', background: shade(th.shell[0], 0.25), boxShadow: `0 0 0 4px ${th.paper}, 0 0 0 5px ${th.accent}, 0 24px 50px -20px rgba(0,0,0,0.5)` }}>
            <img src={pic} alt="" className={`absolute inset-0 h-full w-full ${own ? 'object-cover' : 'object-contain object-bottom'}`} />
          </div>
        </Reveal>
      )}
      {invite.story && (
        <Reveal delay={0.15}>
          <p className="mx-auto max-w-[24em] text-center text-[1.02em] italic leading-relaxed" style={{ fontFamily: `${th.serif}, serif`, color: th.ink }}>“{invite.story}”</p>
        </Reveal>
      )}
    </Section>
  )
}

// ─── Save the date ──────────────────────────────────────────────────────────

/** A foil you scratch off with a finger; it clears itself once half is gone. */
function Scratch({ th, label, onDone }: { th: StoryTheme; label: string; onDone: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const moves = useRef(0)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const { width, height } = c.getBoundingClientRect()
    c.width = width * dpr
    c.height = height * dpr
    const g = c.getContext('2d')
    if (!g) return
    g.scale(dpr, dpr)
    const grad = g.createLinearGradient(0, 0, width, height)
    grad.addColorStop(0, shade(th.trim, -0.2))
    grad.addColorStop(0.45, shade(th.trim, 0.45))
    grad.addColorStop(0.55, th.trim)
    grad.addColorStop(1, shade(th.trim, -0.3))
    g.fillStyle = grad
    g.fillRect(0, 0, width, height)
    for (let i = 0; i < 60; i++) {
      g.fillStyle = `rgba(255,255,255,${0.2 + rnd(i) * 0.5})`
      g.beginPath()
      g.arc(rnd(i + 1) * width, rnd(i + 2) * height, 0.6 + rnd(i + 3) * 1.4, 0, Math.PI * 2)
      g.fill()
    }
    g.fillStyle = shade(th.trim, -0.6)
    g.font = `600 ${Math.round(width * 0.06)}px ${th.serif}, serif`
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText(label.toUpperCase(), width / 2, height / 2)
  }, [th, label])
  const scratch = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    const c = e.currentTarget
    const g = c.getContext('2d')
    if (!g) return
    const r = c.getBoundingClientRect()
    g.globalCompositeOperation = 'destination-out'
    g.beginPath()
    g.arc(e.clientX - r.left, e.clientY - r.top, r.width * 0.08, 0, Math.PI * 2)
    g.fill()
    if (++moves.current % 8) return
    // Sample a coarse grid of alpha to judge how much is gone.
    const data = g.getImageData(0, 0, c.width, c.height).data
    let clear = 0
    let n = 0
    for (let i = 3; i < data.length; i += 4 * 97) {
      n++
      if (data[i] === 0) clear++
    }
    if (clear / n > 0.5) onDone()
  }
  return (
    <canvas
      ref={ref}
      className="absolute inset-0 h-full w-full touch-none cursor-grab rounded-[inherit]"
      onPointerDown={e => { drawing.current = true; e.currentTarget.setPointerCapture(e.pointerId); scratch(e) }}
      onPointerMove={scratch}
      onPointerUp={() => { drawing.current = false }}
      onPointerCancel={() => { drawing.current = false }}
    />
  )
}

function Burst({ colors }: { colors: string[] }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {Array.from({ length: 26 }, (_, i) => {
        const a = (i / 26) * Math.PI * 2
        const dist = 70 + rnd(i) * 80
        return (
          <motion.span key={i} className="absolute h-[0.5em] w-[0.3em] rounded-[1px]" style={{ background: colors[i % colors.length] }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{ x: Math.cos(a) * dist, y: Math.sin(a) * dist + 40, opacity: 0, rotate: rnd(i + 5) * 540 }}
            transition={{ duration: 1.4, ease: 'easeOut' }} />
        )
      })}
    </div>
  )
}

function Flip({ value }: { value: number }) {
  const v = String(value).padStart(2, '0')
  return (
    <span className="relative inline-block h-[1.15em] overflow-hidden tabular-nums">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={v} className="block" initial={{ y: '-100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ duration: 0.45, ease: EASE }}>{v}</motion.span>
      </AnimatePresence>
    </span>
  )
}

export function SaveTheDate({ th, invite, lang, still }: { th: StoryTheme; invite: Invite; lang: Lang; still: boolean }) {
  const [shown, setShown] = useState(still)
  const [burst, setBurst] = useState(false)
  const [cd, setCd] = useState(() => countdown(invite))
  useEffect(() => {
    if (still) return
    const id = window.setInterval(() => setCd(countdown(invite)), 1000)
    return () => window.clearInterval(id)
  }, [invite, still])
  const p = dateParts(invite.date, lang)
  const reveal = () => {
    if (shown) return
    setShown(true)
    setBurst(true)
    navigator.vibrate?.([10, 40, 10])
  }
  return (
    <Section th={th}>
      <Heading th={th}>{copy.save[lang]}</Heading>
      <Reveal className="relative mx-auto w-[78%]">
        <div className="relative overflow-hidden rounded-[1.2em] px-[1em] py-[1.4em] text-center" style={{ background: th.paper, border: `1px solid ${th.line}`, boxShadow: '0 20px 40px -24px rgba(0,0,0,0.45)' }}>
          <p className="text-[0.78em] uppercase tracking-[0.26em]" style={{ color: th.muted }}>{p.weekday} · {p.month}</p>
          <p className="my-[0.1em] text-[4.2em] leading-none" style={{ fontFamily: `${th.serif}, serif`, color: th.accent }}>{p.day}</p>
          <p className="text-[0.95em] tracking-[0.3em]" style={{ color: th.ink }}>{p.year}</p>
          {invite.time && <p className="mt-[0.6em] text-[0.8em]" style={{ color: th.muted }}>{copy.muhurtham[lang]} · {timeLabel(invite.time, lang)}</p>}
          <AnimatePresence>
            {!shown && (
              <motion.div className="absolute inset-0 rounded-[1.2em]" exit={{ opacity: 0, scale: 1.04 }} transition={{ duration: 0.6 }}>
                <Scratch th={th} label={copy.scratch[lang]} onDone={reveal} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {burst && <Burst colors={th.fx} />}
      </Reveal>

      <Reveal delay={0.1} className="mt-[2.2em] text-center">
        <p className="mb-[0.8em] text-[0.74em] uppercase tracking-[0.28em]" style={{ color: th.muted }}>{cd.done ? copy.married[lang] : copy.countdown[lang]}</p>
        {!cd.done && (
          <div className="mx-auto grid max-w-[20em] grid-cols-4 gap-[0.5em]">
            {[cd.days, cd.hours, cd.minutes, cd.seconds].map((n, i) => (
              <div key={i} className="rounded-[0.8em] py-[0.6em]" style={{ background: th.paper, border: `1px solid ${th.line}` }}>
                <div className="text-[1.7em] leading-none" style={{ fontFamily: `${th.serif}, serif`, color: th.ink }}>{i === 0 ? <span className="tabular-nums">{n}</span> : <Flip value={n} />}</div>
                <div className="mt-[0.3em] text-[0.6em] uppercase tracking-[0.18em]" style={{ color: th.muted }}>{copy.units[lang][i]}</div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-[1.4em]"><Button th={th} href={calendarUrl(invite)} icon="calendar" ghost>{copy.calendar[lang]}</Button></div>
      </Reveal>
    </Section>
  )
}

// ─── Events timeline ────────────────────────────────────────────────────────

export function Events({ th, invite, lang }: { th: StoryTheme; invite: Invite; lang: Lang }) {
  const root = useContext(ScrollRoot)
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ container: root ?? undefined, target: ref, offset: ['start 80%', 'end 60%'] })
  const grow = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })
  const main: InviteEvent = { name: copy.muhurtham[lang], date: invite.date, time: invite.time, venue: invite.venue }
  const list = [...(invite.events ?? []), main].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
  if (list.length < 2) return null
  return (
    <Section th={th}>
      <Heading th={th}>{copy.events[lang]}</Heading>
      <div ref={ref} className="relative mx-auto max-w-[24em] pl-[2.4em]">
        <div className="absolute bottom-[0.6em] left-[0.75em] top-[0.6em] w-px" style={{ background: th.line }} />
        <motion.div className="absolute bottom-[0.6em] left-[0.75em] top-[0.6em] w-[2px] origin-top" style={{ background: th.accent, scaleY: grow }} />
        {list.map((e, i) => (
          <Reveal key={i} delay={0.05} y={20} className="relative mb-[1.1em] last:mb-0">
            <span className="absolute -left-[2.2em] top-[0.9em] flex h-[1.5em] w-[1.5em] items-center justify-center rounded-full" style={{ background: th.accent, boxShadow: `0 0 0 4px ${th.dark ? '#00000055' : '#ffffffaa'}` }}>
              <span className="h-[0.45em] w-[0.45em] rotate-45" style={{ background: th.onAccent }} />
            </span>
            <div className="rounded-[1em] px-[1.1em] py-[0.9em]" style={{ background: th.paper, border: `1px solid ${e === main ? th.accent : th.line}` }}>
              <p className="text-[1.05em]" style={{ fontFamily: `${th.serif}, serif`, color: e === main ? th.accent : th.ink }}>{e.name}</p>
              <p className="mt-[0.2em] text-[0.8em]" style={{ color: th.muted }}>{inviteDay(e.date, lang)}{e.time ? ` · ${timeLabel(e.time, lang)}` : ''}</p>
              {e.venue && <p className="text-[0.8em]" style={{ color: th.muted }}>{e.venue}</p>}
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}

// ─── Venue ──────────────────────────────────────────────────────────────────

/** A mandapam drawn in line, tracing itself when it scrolls in. */
function Mandapam({ th }: { th: StoryTheme }) {
  const root = useContext(ScrollRoot)
  const lines = [
    'M20 150h200', 'M30 150v-6h180v6', 'M40 144v-8h160v8',
    'M56 136V76M88 136V76M152 136V76M184 136V76',
    'M48 76h144', 'M44 76l20-22h112l20 22', 'M64 54l14-16h84l14 16', 'M78 38l12-12h60l12 12', 'M90 26l30-16 30 16',
    'M120 10V2', 'M104 136v-36a16 16 0 0 1 32 0v36',
  ]
  return (
    <svg viewBox="0 0 240 160" className="mx-auto w-[86%]" aria-hidden="true">
      <motion.g initial="off" whileInView="on" viewport={{ once: true, amount: 0.4, root: root ?? undefined }}>
        {lines.map((d, i) => (
          <motion.path key={i} d={d} fill="none" stroke={th.accent} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"
            variants={{ off: { pathLength: 0, opacity: 0 }, on: { pathLength: 1, opacity: 1 } }}
            transition={{ duration: 1.1, delay: i * 0.12, ease: 'easeInOut' }} />
        ))}
        <motion.circle cx="120" cy="2" r="2.4" fill={th.accent} variants={{ off: { scale: 0 }, on: { scale: 1 } }} transition={{ delay: 1.5 }} />
      </motion.g>
      {Array.from({ length: 9 }, (_, i) => (
        <circle key={i} cx={58 + i * 15.5} cy={84 + Math.sin((i / 8) * Math.PI) * 6} r={3.2} fill={i % 2 ? th.petal[0] : th.petal[1]} />
      ))}
    </svg>
  )
}

export function Venue({ th, invite, lang, onMap }: { th: StoryTheme; invite: Invite; lang: Lang; onMap: () => void }) {
  return (
    <Section th={th}>
      <Heading th={th}>{copy.venue[lang]}</Heading>
      <Reveal>
        {th.art.venue ? (
          <img src={th.art.venue} alt="" className="mx-auto aspect-[4/3] w-full rounded-[1em] object-cover" style={{ boxShadow: '0 24px 50px -24px rgba(0,0,0,0.5)' }} />
        ) : (
          <Mandapam th={th} />
        )}
      </Reveal>
      <Reveal delay={0.1} className="mt-[1.2em] text-center">
        <p className="text-[1.5em] leading-tight" style={{ fontFamily: `${th.serif}, serif`, color: th.ink }}>{invite.venue}</p>
        {invite.address && <p className="mx-auto mt-[0.4em] max-w-[22em] text-[0.82em] leading-relaxed" style={{ color: th.muted }}>{invite.address}</p>}
        <div className="mt-[1.3em] flex flex-wrap justify-center gap-[0.6em]">
          <Button th={th} href={directionsUrl(invite)} icon="mapPin">{copy.directions[lang]}</Button>
          <Button th={th} onClick={onMap} icon="grid" ghost>{copy.map[lang]}</Button>
        </div>
      </Reveal>
    </Section>
  )
}

// ─── RSVP ───────────────────────────────────────────────────────────────────

export function Rsvp({ th, invite, lang }: { th: StoryTheme; invite: Invite; lang: Lang }) {
  const url = rsvpUrl(invite, lang)
  if (!url) return null
  return (
    <Section th={th} className="text-center">
      <Reveal>
        <div className="relative mx-auto max-w-[22em] overflow-hidden rounded-[1.4em] px-[1.4em] py-[2em]" style={{ background: th.paper, border: `1px solid ${th.line}` }}>
          <div className="pointer-events-none absolute -right-[2em] -top-[2em] opacity-40"><Kolam color={th.accent} size="9em" draw={false} /></div>
          <p className="relative text-[1.9em]" style={{ fontFamily: `${th.script}, ${th.ta}, cursive`, color: th.accent }}>{copy.rsvpTitle[lang]}</p>
          <p className="relative mx-auto mt-[0.6em] max-w-[18em] text-[0.84em] leading-relaxed" style={{ color: th.muted }}>{copy.rsvpLine[lang]}</p>
          <div className="relative mt-[1.3em]"><Button th={th} href={url} icon="whatsapp">{copy.rsvp[lang]}</Button></div>
        </div>
      </Reveal>
    </Section>
  )
}

// ─── Finale ─────────────────────────────────────────────────────────────────

export function Finale({ th, invite, lang, onShare, onFortune }: { th: StoryTheme; invite: Invite; lang: Lang; onShare?: () => void; onFortune: () => void }) {
  const root = useContext(ScrollRoot)
  return (
    <section className="relative flex min-h-[90cqh] flex-col items-center justify-center overflow-hidden px-[1.6em] py-[4em] text-center">
      <motion.div className="pointer-events-none absolute inset-0" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: 0.3, root: root ?? undefined }} transition={{ duration: 1.2 }}>
        <FinaleSky th={th} />
      </motion.div>
      <Reveal className="relative">
        <p className="text-[0.74em] uppercase tracking-[0.3em]" style={{ color: th.muted }}>{copy.blessing[lang]}</p>
        <p className="mt-[0.4em] text-[2.6em] leading-tight" style={{ fontFamily: `${th.script}, ${th.ta}, cursive`, color: th.accent }}>{invite[lang][0]} &amp; {invite[lang][1]}</p>
        {invite.parents?.[lang] && <p className="mx-auto mt-[0.8em] max-w-[22em] text-[0.8em] leading-relaxed" style={{ color: th.muted }}>{invite.parents[lang]}</p>}
        <p className="mt-[1em] text-[0.95em] italic" style={{ fontFamily: `${th.serif}, serif`, color: th.ink }}>{copy.presence[lang]}</p>
      </Reveal>
      <Reveal delay={0.2} className="relative mt-[1.8em] flex flex-wrap justify-center gap-[0.6em]">
        {onShare && <Button th={th} onClick={onShare} icon="share">{copy.share[lang]}</Button>}
        <Button th={th} onClick={onFortune} icon="sparkle" ghost>{copy.fortune[lang]}</Button>
      </Reveal>
      <p className="absolute bottom-[1.2em] text-[0.62em] uppercase tracking-[0.24em]" style={{ color: th.muted }}>{copy.crafted[lang]}</p>
    </section>
  )
}

function FinaleSky({ th }: { th: StoryTheme }) {
  switch (th.finale) {
    case 'lanterns':
      return (
        <>
          {Array.from({ length: 14 }, (_, i) => (
            <span key={i} className="st-rise absolute bottom-[-10%]" style={{ left: `${4 + rnd(i) * 88}%`, animationDelay: `${rnd(i + 3) * 9}s`, animationDuration: `${10 + rnd(i + 7) * 8}s` }}>
              <Lantern size={`${1.4 + rnd(i + 1) * 1.6}em`} color={i % 3 ? '#f6a13a' : th.trim} />
            </span>
          ))}
        </>
      )
    case 'diyas':
      return (
        <>
          {Array.from({ length: 16 }, (_, i) => (
            <span key={i} className="st-rise absolute bottom-[12%] h-[0.3em] w-[0.3em] rounded-full" style={{ left: `${rnd(i) * 100}%`, background: '#ffcf6a', boxShadow: '0 0 8px #ffb347', animationDelay: `${rnd(i + 3) * 6}s`, animationDuration: `${5 + rnd(i + 7) * 5}s` }} />
          ))}
          <div className="absolute inset-x-0 bottom-[3.4em] flex justify-center gap-[0.4em]">
            {Array.from({ length: 7 }, (_, i) => <Diya key={i} size={i === 3 ? '3em' : '2.2em'} delay={i * 0.3} />)}
          </div>
        </>
      )
    case 'stars':
      return (
        <>
          {Array.from({ length: 40 }, (_, i) => (
            <span key={i} className="st-twinkle absolute rounded-full" style={{ left: `${rnd(i) * 100}%`, top: `${rnd(i + 50) * 100}%`, width: 2 + rnd(i + 2) * 3, height: 2 + rnd(i + 2) * 3, background: th.fx[i % th.fx.length], animationDelay: `${rnd(i + 9) * 4}s` }} />
          ))}
          <div className="absolute right-[12%] top-[10%] h-[3.2em] w-[3.2em] rounded-full" style={{ background: 'radial-gradient(circle at 35% 35%, #fffdf0, #e9e2c4)', boxShadow: '0 0 60px 10px rgba(255,250,220,0.35)' }} />
        </>
      )
    default:
      return (
        <>
          {Array.from({ length: th.finale === 'confetti' ? 30 : 20 }, (_, i) => (
            <span key={i} className="st-fall absolute top-[-6%]" style={{
              left: `${rnd(i) * 100}%`, width: `${0.5 + rnd(i + 1) * 0.5}em`, height: th.finale === 'confetti' ? '0.35em' : `${0.6 + rnd(i + 1) * 0.5}em`,
              background: th.fx[i % th.fx.length], borderRadius: th.finale === 'confetti' ? 2 : '80% 0 80% 0',
              animationDelay: `${rnd(i + 3) * 8}s`, animationDuration: `${7 + rnd(i + 7) * 6}s`,
            }} />
          ))}
        </>
      )
  }
}

/** Ambient drift over the whole page: a few petals, stars or embers. */
export function Ambient({ th }: { th: StoryTheme }) {
  const n = 10
  const rising = th.finale === 'lanterns' || th.finale === 'diyas'
  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => th.finale === 'stars' ? (
        <span key={i} className="st-twinkle absolute rounded-full" style={{ left: `${rnd(i + 70) * 100}%`, top: `${rnd(i + 90) * 100}%`, width: 3, height: 3, background: th.fx[i % th.fx.length], animationDelay: `${rnd(i) * 4}s` }} />
      ) : (
        <span key={i} className={`${rising ? 'st-rise' : 'st-fall'} absolute ${rising ? 'bottom-[-4%]' : 'top-[-4%]'}`} style={{
          left: `${rnd(i + 30) * 100}%`,
          width: rising ? 4 : 9 + rnd(i) * 6, height: rising ? 4 : 9 + rnd(i) * 6,
          background: rising ? '#ffcf6a' : th.fx[i % th.fx.length],
          borderRadius: rising ? '50%' : '80% 0 80% 0',
          boxShadow: rising ? '0 0 6px #ffb347' : undefined,
          opacity: 0.75,
          animationDelay: `${rnd(i + 5) * 12}s`, animationDuration: `${12 + rnd(i + 9) * 8}s`,
        }} />
      ))}
    </div>
  )
}
