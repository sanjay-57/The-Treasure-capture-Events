import { useId, type CSSProperties } from 'react'
import { motion } from 'motion/react'
import type { Lang } from '../../../lib/i18n'
import type { Tradition } from '../../../lib/invite'
import { rnd } from '../themes'
import type { Bloom, StoryTheme } from './theme'

/*
 * Drawn ornament for the story invite: paper-craft flowers (layered petals,
 * soft gradient, a cut-paper drop shadow), leaves, the mango-leaf toran, a
 * kolam, the kalash, invocations, lamps. Everything is SVG so it stays sharp
 * at any size and in the PNG.
 */

const r1 = (n: number) => Math.round(n * 10) / 10

/** A petal pointing up from the origin, `l` long and `w` wide; `tip` 0 round … 1 pointed. */
const petalPath = (l: number, w: number, tip: number) => {
  const c = l * (0.62 - tip * 0.22)
  return `M0 0C${r1(-w)} ${r1(-c * 0.45)} ${r1(-w * (1 - tip * 0.6))} ${r1(-c - l * 0.18)} 0 ${r1(-l)}C${r1(w * (1 - tip * 0.6))} ${r1(-c - l * 0.18)} ${r1(w)} ${r1(-c * 0.45)} 0 0Z`
}

interface Ring { n: number; l: number; w: number; tip: number; off: number; fill: 0 | 1 }

const RINGS: Record<Bloom, Ring[]> = {
  lotus: [
    { n: 8, l: 1, w: 0.34, tip: 1, off: 0, fill: 0 },
    { n: 8, l: 0.78, w: 0.3, tip: 1, off: 22.5, fill: 1 },
    { n: 6, l: 0.5, w: 0.24, tip: 0.9, off: 0, fill: 1 },
  ],
  rose: [
    { n: 5, l: 1, w: 0.62, tip: 0, off: 0, fill: 0 },
    { n: 5, l: 0.78, w: 0.55, tip: 0, off: 36, fill: 0 },
    { n: 5, l: 0.55, w: 0.45, tip: 0, off: 10, fill: 1 },
    { n: 4, l: 0.34, w: 0.36, tip: 0, off: 50, fill: 1 },
  ],
  peony: [
    { n: 9, l: 1, w: 0.46, tip: 0, off: 0, fill: 0 },
    { n: 8, l: 0.8, w: 0.44, tip: 0, off: 20, fill: 0 },
    { n: 7, l: 0.6, w: 0.4, tip: 0, off: 8, fill: 1 },
    { n: 6, l: 0.4, w: 0.34, tip: 0, off: 30, fill: 1 },
  ],
  marigold: [
    { n: 18, l: 1, w: 0.2, tip: 0, off: 0, fill: 0 },
    { n: 15, l: 0.82, w: 0.2, tip: 0, off: 10, fill: 0 },
    { n: 12, l: 0.62, w: 0.2, tip: 0, off: 4, fill: 1 },
    { n: 9, l: 0.42, w: 0.2, tip: 0, off: 18, fill: 1 },
  ],
  jasmine: [
    { n: 5, l: 1, w: 0.3, tip: 0.55, off: 0, fill: 0 },
    { n: 5, l: 0.7, w: 0.26, tip: 0.5, off: 36, fill: 1 },
  ],
  bougainvillea: [
    { n: 3, l: 1, w: 0.72, tip: 0.3, off: 0, fill: 0 },
    { n: 3, l: 0.66, w: 0.5, tip: 0.3, off: 60, fill: 1 },
  ],
}

/** Shared gradients and the paper shadow; put once inside each <svg> that draws blooms. */
export function BloomDefs({ id, th }: { id: string; th: StoryTheme }) {
  const [outer, inner, heart] = th.petal
  return (
    <defs>
      <radialGradient id={`${id}p0`} cx="50%" cy="100%" r="100%">
        <stop offset="0" stopColor={inner} />
        <stop offset="1" stopColor={outer} />
      </radialGradient>
      <radialGradient id={`${id}p1`} cx="50%" cy="100%" r="100%">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
        <stop offset="0.5" stopColor={inner} />
        <stop offset="1" stopColor={outer} />
      </radialGradient>
      <radialGradient id={`${id}h`}>
        <stop offset="0" stopColor="#fff6c8" />
        <stop offset="1" stopColor={heart} />
      </radialGradient>
      <linearGradient id={`${id}l`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={th.leaf} />
        <stop offset="0.5" stopColor={mix(th.leaf)} />
        <stop offset="1" stopColor={th.leaf} />
      </linearGradient>
      <filter id={`${id}s`} x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="1.4" stdDeviation="1.3" floodColor="#2a1206" floodOpacity="0.32" />
      </filter>
    </defs>
  )
}

const mix = (hex: string) => {
  const n = parseInt(hex.replace('#', ''), 16)
  const up = (v: number) => Math.min(255, Math.round(v + (255 - v) * 0.35))
  return `rgb(${up(n >> 16)},${up((n >> 8) & 255)},${up(n & 255)})`
}

/** One flower of radius `r` at (x, y). Needs <BloomDefs id={id}> in the same svg. */
export function BloomShape({ id, kind, x, y, r, rot = 0 }: { id: string; kind: Bloom; x: number; y: number; r: number; rot?: number }) {
  const rings = RINGS[kind]
  return (
    <g transform={`translate(${r1(x)} ${r1(y)}) rotate(${r1(rot)})`} filter={`url(#${id}s)`}>
      {rings.map((g, gi) => (
        <g key={gi} fill={`url(#${id}p${g.fill})`} stroke="rgba(80,20,10,0.16)" strokeWidth={0.5}>
          {Array.from({ length: g.n }, (_, i) => (
            <path key={i} d={petalPath(r * g.l, r * g.w, g.tip)} transform={`rotate(${r1(g.off + (i * 360) / g.n)})`} />
          ))}
        </g>
      ))}
      {kind === 'lotus' && Array.from({ length: 10 }, (_, i) => (
        <circle key={i} r={r * 0.035} cx={r1(Math.cos(i * 0.63) * r * 0.12)} cy={r1(Math.sin(i * 0.63) * r * 0.12)} fill="#b8860b" />
      ))}
      <circle r={r * (kind === 'marigold' ? 0.16 : kind === 'jasmine' ? 0.1 : 0.14)} fill={`url(#${id}h)`} />
      {kind === 'rose' || kind === 'peony' ? <path d={`M${-r * 0.1} 0a${r * 0.1} ${r * 0.1} 0 1 1 ${r * 0.14} ${r * 0.06}`} fill="none" stroke="rgba(80,20,10,0.3)" strokeWidth={0.6} /> : null}
    </g>
  )
}

export function LeafShape({ id, x, y, l, rot }: { id: string; x: number; y: number; l: number; rot: number }) {
  return (
    <g transform={`translate(${r1(x)} ${r1(y)}) rotate(${r1(rot)})`} filter={`url(#${id}s)`}>
      <path d={`M0 0C${r1(l * 0.3)} ${r1(-l * 0.22)} ${r1(l * 0.75)} ${r1(-l * 0.2)} ${l} 0C${r1(l * 0.75)} ${r1(l * 0.2)} ${r1(l * 0.3)} ${r1(l * 0.22)} 0 0Z`} fill={`url(#${id}l)`} />
      <path d={`M0 0L${r1(l * 0.92)} 0`} stroke="rgba(255,255,255,0.35)" strokeWidth={0.6} />
    </g>
  )
}

/**
 * A spray of flowers and leaves growing out of the (0,0) corner of a 200-unit
 * square; place it in a corner and flip it with `corner`. Blooms open one by one.
 */
export function Cluster({ th, size, corner, seed = 1, live = true, delay = 0, style }: {
  th: StoryTheme; size: string; corner: 'tl' | 'tr' | 'bl' | 'br'; seed?: number; live?: boolean; delay?: number; style?: CSSProperties
}) {
  const id = useId().replace(/:/g, '')
  const flip = `scale(${corner[1] === 'r' ? -1 : 1}, ${corner[0] === 'b' ? -1 : 1})`
  const blooms = [
    { x: 46, y: 46, r: 40 },
    { x: 112, y: 22, r: 26 },
    { x: 22, y: 112, r: 26 },
    { x: 92, y: 84, r: 18 },
    { x: 150, y: 10, r: 14 },
    { x: 10, y: 152, r: 14 },
  ]
  const leaves = [
    { x: 60, y: 60, l: 70, a: 40 }, { x: 70, y: 40, l: 62, a: 8 }, { x: 40, y: 70, l: 62, a: 78 },
    { x: 120, y: 30, l: 44, a: -12 }, { x: 30, y: 120, l: 44, a: 102 }, { x: 96, y: 92, l: 40, a: 46 },
  ]
  const pos: CSSProperties = { [corner[0] === 't' ? 'top' : 'bottom']: 0, [corner[1] === 'l' ? 'left' : 'right']: 0 }
  return (
    <svg
      viewBox="0 0 200 200" aria-hidden="true"
      className="pointer-events-none absolute"
      style={{ width: size, height: size, transform: flip, overflow: 'visible', ...pos, ...style }}
    >
      <BloomDefs id={id} th={th} />
      <g className={live ? 'st-sway' : undefined} style={{ transformOrigin: '0 0' }}>
        {leaves.map((f, i) => (
          <motion.g key={`l${i}`} initial={live ? { opacity: 0, scale: 0.4 } : false} animate={{ opacity: 1, scale: 1 }} transition={{ delay: delay + i * 0.05, duration: 0.8 }}>
            <LeafShape id={id} x={f.x - 30 + rnd(seed + i) * 8} y={f.y - 30 + rnd(seed + i + 9) * 8} l={f.l} rot={f.a + (rnd(seed + i * 3) - 0.5) * 16} />
          </motion.g>
        ))}
        {blooms.map((b, i) => (
          <motion.g key={i} initial={live ? { opacity: 0, scale: 0.2, rotate: -40 } : false} animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: delay + 0.25 + i * 0.09, type: 'spring', stiffness: 120, damping: 14 }}>
            <BloomShape id={id} kind={th.blooms[i % th.blooms.length]} x={b.x} y={b.y} r={b.r} rot={rnd(seed * 7 + i) * 60} />
          </motion.g>
        ))}
      </g>
    </svg>
  )
}

/** Mango leaves and marigolds on a string, the toran over a doorway. */
export function Toran({ th, count = 9, live = true, className = '', style }: { th: StoryTheme; count?: number; live?: boolean; className?: string; style?: CSSProperties }) {
  const id = useId().replace(/:/g, '')
  const w = 400
  const step = w / count
  return (
    <svg viewBox={`0 0 ${w} 86`} preserveAspectRatio="none" aria-hidden="true" className={`pointer-events-none ${className}`} style={style}>
      <BloomDefs id={id} th={{ ...th, petal: ['#f59a12', '#ffcb3d', '#c2410c'] }} />
      <path d={`M0 8Q${w / 2} 22 ${w} 8`} stroke={th.trim} strokeWidth={2} fill="none" />
      {Array.from({ length: count }, (_, i) => {
        const x = step * (i + 0.5)
        const sag = 8 + Math.sin((i + 0.5) / count * Math.PI) * 7
        return (
          <g key={i} className={live ? 'st-swing' : undefined} style={{ transformOrigin: `${x}px ${sag}px`, animationDelay: `${-i * 0.4}s` }}>
            <LeafShape id={id} x={x} y={sag} l={i % 2 ? 58 : 66} rot={90} />
            <BloomShape id={id} kind="marigold" x={x + step / 2} y={sag + 10} r={9} />
          </g>
        )
      })}
    </svg>
  )
}

/** A dotted kolam that draws itself; `draw` false shows it finished. */
export function Kolam({ color, size, draw = true, delay = 0, style }: { color: string; size: string; draw?: boolean; delay?: number; style?: CSSProperties }) {
  const loops = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4
    const x = 50 + Math.cos(a) * 24
    const y = 50 + Math.sin(a) * 24
    return `M50 50Q${r1(50 + Math.cos(a - 0.5) * 46)} ${r1(50 + Math.sin(a - 0.5) * 46)} ${r1(x)} ${r1(y)}Q${r1(50 + Math.cos(a + 0.5) * 46)} ${r1(50 + Math.sin(a + 0.5) * 46)} 50 50`
  })
  const dots = [[50, 50], ...Array.from({ length: 8 }, (_, i) => [50 + Math.cos(i * Math.PI / 4 + Math.PI / 8) * 30, 50 + Math.sin(i * Math.PI / 4 + Math.PI / 8) * 30])]
  const path = (d: string, i: number, w = 1.6) => (
    <motion.path key={d} d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round"
      initial={draw ? { pathLength: 0 } : false} animate={{ pathLength: 1 }} transition={{ delay: delay + i * 0.18, duration: 0.9, ease: 'easeInOut' }} />
  )
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" style={{ width: size, height: size, ...style }}>
      {dots.map(([x, y], i) => <circle key={i} cx={r1(x)} cy={r1(y)} r={1.4} fill={color} />)}
      {loops.map((d, i) => path(d, i))}
      {path('M50 6A44 44 0 1 1 49.9 6', 9, 1.1)}
      {path('M50 14A36 36 0 1 1 49.9 14', 10, 0.8)}
    </svg>
  )
}

/** A brass kalash with mango leaves and a coconut. */
export function Kalash({ color, size }: { color: string; size: string }) {
  return (
    <svg viewBox="0 0 60 64" aria-hidden="true" style={{ width: size, height: size }}>
      <g fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round">
        <path d="M30 6c-6 0-9 5-9 9h18c0-4-3-9-9-9z" fill={color} fillOpacity={0.25} />
        <path d="M21 15c-6-2-11-1-14 2 4 0 8 1 11 3M39 15c6-2 11-1 14 2-4 0-8 1-11 3M24 15c-3-4-7-6-11-6 2 3 5 5 8 7M36 15c3-4 7-6 11-6-2 3-5 5-8 7" />
        <path d="M20 20h20l-2 4c8 4 12 11 12 18 0 10-9 16-20 16S10 52 10 42c0-7 4-14 12-18z" fill={color} fillOpacity={0.18} />
        <path d="M14 40h32M16 46h28" />
        <path d="M24 58h12l2 4H22z" />
      </g>
      <path d="M30 31l1.6 3.4 3.7.4-2.8 2.5.8 3.7-3.3-1.9-3.3 1.9.8-3.7-2.8-2.5 3.7-.4z" fill={color} />
    </svg>
  )
}

const INVOKE: Record<Exclude<Tradition, 'none'>, { en: [string, string]; ta: [string, string] }> = {
  hindu: { en: ['॥ Shree Ganeshaya Namah ॥', ''], ta: ['உ', 'ஸ்ரீ விநாயகர் துணை'] },
  muslim: { en: ['بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', 'In the name of Allah, the Most Gracious, the Most Merciful'], ta: ['بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', 'அளவற்ற அருளாளனும் நிகரற்ற அன்புடையோனுமாகிய அல்லாஹ்வின் திருப்பெயரால்'] },
  christian: { en: ['“Two are better than one.”', 'Ecclesiastes 4:9'], ta: ['“ஒண்டியாயிருப்பதைப் பார்க்கிலும் இருவர் கூடியிருப்பது நலம்”', 'பிரசங்கி 4:9'] },
}

/** The line at the very top: Pillaiyar suzhi / Ganesha, Bismillah or a verse, with its emblem. */
export function Invocation({ tradition, lang, color, muted, serif }: { tradition?: Tradition; lang: Lang; color: string; muted: string; serif: string }) {
  if (!tradition || tradition === 'none') return null
  const [main, sub] = INVOKE[tradition][lang]
  return (
    <div className="flex flex-col items-center gap-[0.6em]" style={{ color }}>
      {tradition === 'hindu' && <Kalash color={color} size="2.6em" />}
      {tradition === 'muslim' && (
        <svg viewBox="0 0 40 40" aria-hidden="true" style={{ width: '1.9em', height: '1.9em' }}>
          <path d="M24 6a14 14 0 1 0 0 28 11 11 0 1 1 0-28z" fill={color} />
          <path d="M29 13l1.2 2.6 2.8.3-2.1 1.9.6 2.8-2.5-1.4-2.5 1.4.6-2.8-2.1-1.9 2.8-.3z" fill={color} />
        </svg>
      )}
      {tradition === 'christian' && (
        <svg viewBox="0 0 30 40" aria-hidden="true" style={{ width: '1.3em', height: '1.8em' }}>
          <path d="M13 2h4v10h10v4H17v22h-4V16H3v-4h10z" fill={color} />
        </svg>
      )}
      <p
        className="text-center leading-tight"
        style={{
          fontFamily: tradition === 'muslim' ? 'Amiri, "Noto Naskh Arabic", serif' : lang === 'ta' ? 'Noto Serif Tamil, serif' : `${serif}, serif`,
          fontSize: tradition === 'hindu' && lang === 'ta' ? '1.6em' : tradition === 'muslim' ? '1.25em' : '0.82em',
          letterSpacing: tradition === 'hindu' && lang === 'en' ? '0.18em' : undefined,
          textTransform: tradition === 'hindu' && lang === 'en' ? 'uppercase' : undefined,
        }}
        dir={tradition === 'muslim' ? 'rtl' : undefined}
      >
        {main}
      </p>
      {sub && <p className="max-w-[26em] text-center text-[0.7em] leading-snug" style={{ color: muted }}>{sub}</p>}
    </div>
  )
}

/** A thin rule with a diamond in the middle. */
export function Rule({ color, width = '9em' }: { color: string; width?: string }) {
  return (
    <svg viewBox="0 0 160 12" aria-hidden="true" style={{ width, height: '0.8em' }}>
      <path d="M0 6h68M92 6h68" stroke={color} strokeWidth={0.8} />
      <path d="M80 1l5 5-5 5-5-5z" fill={color} />
      <circle cx="64" cy="6" r="1.4" fill={color} />
      <circle cx="96" cy="6" r="1.4" fill={color} />
    </svg>
  )
}

/** A clay agal vilakku with a flickering flame. */
export function Diya({ size, delay = 0 }: { size: string; delay?: number }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" style={{ width: size, height: size, overflow: 'visible' }}>
      <ellipse cx="20" cy="18" rx="9" ry="12" fill="#ffb347" opacity={0.25} className="st-glow" style={{ animationDelay: `${delay}s` }} />
      <path d="M20 6c3 5 5 8 5 11a5 5 0 0 1-10 0c0-3 2-6 5-11z" fill="#ffd36b" className="st-flame" style={{ transformOrigin: '20px 22px', animationDelay: `${delay}s` }} />
      <path d="M20 12c1.6 3 2.4 5 2.4 6.6a2.4 2.4 0 0 1-4.8 0c0-1.6.8-3.6 2.4-6.6z" fill="#fff4d0" />
      <path d="M4 24h32c-1 7-8 11-16 11S5 31 4 24z" fill="#b5541c" />
      <path d="M4 24h32" stroke="#e08a3c" strokeWidth={1.4} />
    </svg>
  )
}

/** A paper sky lantern. */
export function Lantern({ size, color }: { size: string; color: string }) {
  return (
    <svg viewBox="0 0 30 40" aria-hidden="true" style={{ width: size, height: size, overflow: 'visible' }}>
      <ellipse cx="15" cy="22" rx="16" ry="18" fill={color} opacity={0.18} />
      <path d="M6 6h18l3 26H3z" fill={color} />
      <path d="M10 6v26M20 6v26" stroke="rgba(255,255,255,0.3)" strokeWidth={0.6} />
      <ellipse cx="15" cy="30" rx="5" ry="2.4" fill="#fff3c4" />
    </svg>
  )
}
