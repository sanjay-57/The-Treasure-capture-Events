import { AnimatePresence, motion } from 'motion/react'
import { useId, type ReactNode } from 'react'
import { useLang } from '../lib/i18n'

/*
 * Traditional Tamil ornaments that appear only in Tamil mode. All drawn in
 * the site palette (ruby / ink / white) so they read as design, not clip-art.
 */

/** Renders children only in Tamil mode, fading them in and out. */
export function TamilOnly({ children }: { children: ReactNode }) {
  const lang = useLang()
  return <AnimatePresence>{lang === 'ta' && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>{children}</motion.div>}</AnimatePresence>
}

// ─── Pulli kolam ─────────────────────────────────────────────────────────────

const KOLAM_DOTS: [number, number][] = []
for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) if (Math.abs(i) + Math.abs(j) <= 2) KOLAM_DOTS.push([60 + i * 20, 60 + j * 20])

const petal = (rot: number) => (
  <path key={rot} d="M60 60 C 48 48, 48 32, 60 26 C 72 32, 72 48, 60 60" transform={`rotate(${rot} 60 60)`} />
)

/** A dot-grid kolam that draws itself when it scrolls into view. */
export function Kolam({ size = 120, className = '', color = 'currentColor', animate = true, strokeWidth = 1.6 }: { size?: number; className?: string; color?: string; animate?: boolean; strokeWidth?: number }) {
  const draw = {
    hidden: { pathLength: 0, opacity: 0 },
    show: (i: number) => ({ pathLength: 1, opacity: 1, transition: { pathLength: { duration: 1.6, delay: i * 0.12, ease: [0.65, 0, 0.35, 1] as const }, opacity: { duration: 0.2, delay: i * 0.12 } } }),
  }
  const Wrap = animate ? motion.g : 'g'
  const wrapProps = animate ? { initial: 'hidden', whileInView: 'show', viewport: { once: true } } : {}
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className={className} aria-hidden="true">
      <Wrap {...wrapProps} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        {[0, 90, 180, 270].map((r, i) => (animate ? <motion.g key={r} custom={i} variants={draw}>{petal(r)}</motion.g> : petal(r)))}
        {[
          'M60 10 L110 60 L60 110 L10 60 Z',
          'M60 60 m -8 0 a 8 8 0 1 0 16 0 a 8 8 0 1 0 -16 0',
          ...[[40, 40], [80, 40], [40, 80], [80, 80]].map(([x, y]) => `M${x} ${y} m -8 0 a 8 8 0 1 0 16 0 a 8 8 0 1 0 -16 0`),
          ...[[60, 20], [100, 60], [60, 100], [20, 60]].map(([x, y]) => `M${x} ${y} m -6.5 0 a 6.5 6.5 0 1 0 13 0 a 6.5 6.5 0 1 0 -13 0`),
        ].map((d, i) => (animate ? <motion.path key={d} d={d} custom={i + 4} variants={draw} /> : <path key={d} d={d} />))}
      </Wrap>
      <g fill={color}>
        {KOLAM_DOTS.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={1.9} />
        ))}
      </g>
    </svg>
  )
}

/** Section divider: ruby diamond in English, a small kolam between rules in Tamil. */
export function Ornament({ className = '', dark = false }: { className?: string; dark?: boolean }) {
  const lang = useLang()
  const rule = dark ? 'bg-white/20' : 'bg-ink/15'
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`} aria-hidden="true">
      <span className={`h-px w-16 md:w-24 ${rule}`} />
      {lang === 'ta' ? <Kolam size={34} className="text-ruby" strokeWidth={2.2} /> : <span className="h-2 w-2 rotate-45 bg-ruby" />}
      <span className={`h-px w-16 md:w-24 ${rule}`} />
    </div>
  )
}

// ─── Thoranam (hanging garland) ──────────────────────────────────────────────

function ThoranamUnit({ i, leaf, flower }: { i: number; leaf: string; flower: string }) {
  const isLeaf = i % 2 === 0
  return (
    <svg width="34" height="46" viewBox="0 0 34 46" className="shrink-0 overflow-visible" aria-hidden="true">
      <path d="M0 4 Q17 10 34 4" fill="none" stroke={leaf} strokeWidth="1.2" opacity="0.6" />
      <g className="animate-sway" style={{ animationDelay: `${(i % 7) * -0.6}s`, transformOrigin: '17px 7px' }}>
        {isLeaf ? (
          <>
            <path d="M17 7 C 8 18, 9 32, 17 44 C 25 32, 26 18, 17 7 Z" fill={leaf} />
            <path d="M17 9 L17 42" stroke="rgba(255,255,255,0.45)" strokeWidth="0.8" />
          </>
        ) : (
          <>
            <path d="M17 7 L17 16" stroke={leaf} strokeWidth="1" />
            {[0, 60, 120, 180, 240, 300].map(a => (
              <circle key={a} cx={17 + Math.cos((a * Math.PI) / 180) * 4.2} cy={21 + Math.sin((a * Math.PI) / 180) * 4.2} r="3" fill={flower} stroke={leaf} strokeWidth="0.6" />
            ))}
            <circle cx="17" cy="21" r="2.4" fill={leaf} />
            <path d="M17 26 L17 31" stroke={leaf} strokeWidth="1" />
            <circle cx="17" cy="33" r="2.2" fill={flower} stroke={leaf} strokeWidth="0.6" />
          </>
        )}
      </g>
    </svg>
  )
}

/** Mango-leaf and flower festoon hung across a doorway, used under the nav in Tamil mode. */
export function Thoranam({ className = '', dark = false }: { className?: string; dark?: boolean }) {
  return (
    <div className={`pointer-events-none flex overflow-hidden ${className}`} aria-hidden="true">
      {Array.from({ length: 64 }, (_, i) => (
        <ThoranamUnit key={i} i={i} leaf="#c0163c" flower={dark ? '#0a0a0b' : '#ffffff'} />
      ))}
    </div>
  )
}

// ─── Kuthu vilakku (brass lamp) ──────────────────────────────────────────────

function Flame({ x, y, delay }: { x: number; y: number; delay: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="animate-flicker" style={{ animationDelay: `${delay}s` }}>
        <path d="M0 0 C -4 -5, -3 -11, 0 -17 C 3 -11, 4 -5, 0 0 Z" fill="url(#flame)" />
        <path d="M0 -1 C -1.6 -4, -1.2 -7, 0 -10 C 1.2 -7, 1.6 -4, 0 -1 Z" fill="#fff" opacity="0.9" />
      </g>
    </g>
  )
}

/** Traditional five-faced lamp with flickering flames. */
export function Vilakku({ height = 160, className = '', tone = 'ink' }: { height?: number; className?: string; tone?: 'ink' | 'white' | 'ruby' }) {
  const body = tone === 'white' ? '#ffffff' : tone === 'ruby' ? '#c0163c' : '#0a0a0b'
  return (
    <svg height={height} viewBox="0 0 80 160" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="flame" cx="0.5" cy="0.8" r="0.8">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.35" stopColor="#ff5a7a" />
          <stop offset="1" stopColor="#c0163c" />
        </radialGradient>
        <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#e2264f" stopOpacity="0.45" />
          <stop offset="1" stopColor="#e2264f" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="40" cy="44" rx="40" ry="26" fill="url(#glow)" />
      <g fill={body}>
        {/* finial */}
        <path d="M40 6 C 44 12, 44 18, 40 22 C 36 18, 36 12, 40 6 Z" />
        <rect x="38.6" y="21" width="2.8" height="10" />
        {/* bowl */}
        <path d="M14 46 Q40 64 66 46 L62 44 Q40 56 18 44 Z" />
        <path d="M10 44 L18 44 L16 48 Z M70 44 L62 44 L64 48 Z" />
        <ellipse cx="40" cy="45" rx="23" ry="4" />
        {/* stem */}
        <rect x="37.5" y="54" width="5" height="62" rx="2" />
        <ellipse cx="40" cy="66" rx="6" ry="3.2" />
        <ellipse cx="40" cy="84" rx="7.5" ry="4" />
        <ellipse cx="40" cy="102" rx="6" ry="3.2" />
        {/* base */}
        <path d="M22 132 Q40 112 58 132 Z" />
        <ellipse cx="40" cy="134" rx="26" ry="5" />
        <rect x="16" y="136" width="48" height="5" rx="2.5" />
        <ellipse cx="40" cy="146" rx="30" ry="5" />
      </g>
      <Flame x={12} y={43} delay={0} />
      <Flame x={27} y={40} delay={-0.7} />
      <Flame x={40} y={39} delay={-1.3} />
      <Flame x={53} y={40} delay={-0.4} />
      <Flame x={68} y={43} delay={-1.8} />
    </svg>
  )
}

// ─── Temple skyline ──────────────────────────────────────────────────────────
// Dravidian temple silhouettes built from their real parts: gopurams (tiered
// gateway towers with a barrel-vault crown and kalasams), vimanas (shrines
// with an onion dome), pillared mandapams and the prakaram wall. Doorways and
// pillar gaps are cut through with a mask so they read on any background.

const SKY_W = 1600
const SKY_H = 230
const GROUND = SKY_H

const rect = (x: number, y: number, w: number, h: number) => `M${x} ${y}h${w}v${h}h${-w}Z`
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

function kalasam(x: number, baseY: number, s: number): string {
  // Pot, collar and pointed spike.
  const r = 2.3 * s
  return (
    `M${x - r} ${baseY} Q${x - r * 1.35} ${baseY - r * 1.4} ${x} ${baseY - r * 2.1} Q${x + r * 1.35} ${baseY - r * 1.4} ${x + r} ${baseY}Z` +
    rect(x - r * 0.55, baseY - r * 2.6, r * 1.1, r * 0.55) +
    `M${x - r * 0.45} ${baseY - r * 2.6}L${x} ${baseY - r * 5.2}L${x + r * 0.45} ${baseY - r * 2.6}Z`
  )
}

interface Shape { d: string; cut: string }

function gopuram(cx: number, baseW: number, h: number, tiers: number): Shape {
  let d = ''
  let cut = ''
  const s = h / 150
  // Stone base storey with a moulded plinth and cornice.
  const baseH = h * 0.2
  let y = GROUND - baseH
  d += rect(cx - baseW / 2 - 3 * s, GROUND - 5 * s, baseW + 6 * s, 5 * s)
  d += rect(cx - baseW / 2, y, baseW, baseH)
  d += rect(cx - baseW / 2 - 3 * s, y - 2.5 * s, baseW + 6 * s, 3 * s)
  // Doorway: tall opening with a rounded top.
  const dw = baseW * 0.2
  const dh = baseH * 0.78
  cut += `M${cx - dw / 2} ${GROUND}V${GROUND - dh + dw / 2}A${dw / 2} ${dw / 2} 0 0 1 ${cx + dw / 2} ${GROUND - dh + dw / 2}V${GROUND}Z`
  y -= 2.5 * s

  // Tiers (talas): each tapers, carries a projecting cornice and corner pavilions.
  const towerH = h * 0.6
  const th = towerH / tiers
  const w0 = baseW * 0.9
  const wTop = baseW * 0.34
  for (let i = 0; i < tiers; i++) {
    const wb = lerp(w0, wTop, i / tiers)
    const wt = lerp(w0, wTop, (i + 1) / tiers)
    const bodyH = th * 0.74
    d += `M${cx - wb / 2} ${y}L${cx - wt / 2} ${y - bodyH}L${cx + wt / 2} ${y - bodyH}L${cx + wb / 2} ${y}Z`
    // Niches down the face of each tier.
    for (const f of [-0.28, 0, 0.28]) cut += rect(cx + f * wt - th * 0.09, y - bodyH * 0.8, th * 0.18, bodyH * 0.55)
    y -= bodyH
    const ledgeH = th * 0.26
    d += rect(cx - wt / 2 - 2.5 * s, y - ledgeH, wt + 5 * s, ledgeH)
    // Corner pavilions (karnakutas) sitting on the ledge ends.
    const k = th * 0.34
    for (const side of [-1, 1]) {
      const kx = cx + side * (wt / 2 - k * 0.2)
      d += `M${kx - k / 2} ${y - ledgeH}Q${kx} ${y - ledgeH - k * 1.2} ${kx + k / 2} ${y - ledgeH}Z`
    }
    y -= ledgeH
  }

  // Crown: a barrel vault (shala) with horned ends and a row of kalasams.
  const wc = wTop * 1.3
  const band = h * 0.03
  d += rect(cx - wc / 2, y - band, wc, band)
  y -= band
  const hc = h * 0.11
  d += `M${cx - wc / 2} ${y}C${cx - wc / 2} ${y - hc * 1.25} ${cx + wc / 2} ${y - hc * 1.25} ${cx + wc / 2} ${y}Z`
  for (const side of [-1, 1]) {
    const ex = cx + side * wc / 2
    d += `M${ex} ${y}Q${ex + side * hc * 0.55} ${y - hc * 0.2} ${ex + side * hc * 0.45} ${y - hc * 0.85}Q${ex + side * hc * 0.1} ${y - hc * 0.55} ${ex - side * hc * 0.25} ${y - hc * 0.45}Z`
  }
  const count = tiers >= 9 ? 7 : 5
  for (let i = 0; i < count; i++) {
    const t = (i / (count - 1)) * 2 - 1 // -1..1
    const kx = cx + t * wc * 0.36
    const ky = y - hc * 0.94 * Math.sqrt(1 - (t * 0.72) ** 2)
    d += kalasam(kx, ky + 1, s * (i === (count - 1) / 2 ? 1.15 : 1))
  }
  return { d, cut }
}

function vimana(cx: number, w: number, h: number): Shape {
  let d = ''
  let cut = ''
  const s = h / 110
  const baseH = h * 0.34
  let y = GROUND - baseH
  d += rect(cx - w / 2 - 3 * s, GROUND - 4 * s, w + 6 * s, 4 * s)
  d += rect(cx - w / 2, y, w, baseH)
  // Pilasters on the sanctum wall.
  for (const f of [-0.3, 0, 0.3]) cut += rect(cx + f * w - 2 * s, y + baseH * 0.2, 4 * s, baseH * 0.55)
  // Stepped storeys, each with a cornice and corner kutas.
  let cw = w
  for (let i = 0; i < 2; i++) {
    d += rect(cx - cw / 2 - 3 * s, y - 3 * s, cw + 6 * s, 3 * s)
    y -= 3 * s
    cw *= 0.74
    const sh = h * 0.1
    d += rect(cx - cw / 2, y - sh, cw, sh)
    for (const side of [-1, 1]) {
      const kx = cx + side * (cw / 2 + 2 * s)
      d += `M${kx - 4 * s} ${y}Q${kx} ${y - 9 * s} ${kx + 4 * s} ${y}Z`
    }
    y -= sh
  }
  // Neck (griva) and the domed sikhara.
  const neckW = cw * 0.55
  d += rect(cx - cw / 2 - 2 * s, y - 2.5 * s, cw + 4 * s, 2.5 * s)
  y -= 2.5 * s
  d += rect(cx - neckW / 2, y - h * 0.05, neckW, h * 0.05)
  y -= h * 0.05
  const dw = cw * 0.95
  const dh = h * 0.2
  d += `M${cx - dw / 2} ${y}C${cx - dw * 0.62} ${y - dh * 0.75} ${cx - dw * 0.22} ${y - dh * 1.08} ${cx} ${y - dh}C${cx + dw * 0.22} ${y - dh * 1.08} ${cx + dw * 0.62} ${y - dh * 0.75} ${cx + dw / 2} ${y}Z`
  d += kalasam(cx, y - dh + 1, s * 1.5)
  return { d, cut }
}

function mandapam(x1: number, x2: number, h: number): Shape {
  const s = h / 40
  let d = rect(x1, GROUND - h, x2 - x1, h)
  let cut = ''
  // Curved eave (kapota) and a parapet of small pavilions.
  d += `M${x1 - 4 * s} ${GROUND - h}Q${(x1 + x2) / 2} ${GROUND - h - 7 * s} ${x2 + 4 * s} ${GROUND - h}Z`
  const n = Math.max(2, Math.round((x2 - x1) / (22 * s)))
  for (let i = 0; i <= n; i++) {
    const px = lerp(x1 + 6 * s, x2 - 6 * s, i / n)
    d += `M${px - 4 * s} ${GROUND - h - 3 * s}Q${px} ${GROUND - h - 12 * s} ${px + 4 * s} ${GROUND - h - 3 * s}Z`
  }
  // Pillar bays.
  const bays = Math.max(3, Math.round((x2 - x1) / (14 * s)))
  const bw = (x2 - x1) / bays
  for (let i = 0; i < bays; i++) cut += rect(x1 + i * bw + bw * 0.28, GROUND - h * 0.78, bw * 0.44, h * 0.66)
  return { d, cut }
}

function wall(): Shape {
  const h = 16
  let d = rect(0, GROUND - h, SKY_W, h) + rect(0, GROUND - h - 3, SKY_W, 3)
  for (let x = 20; x < SKY_W; x += 46) d += `M${x - 4} ${GROUND - h - 3}Q${x} ${GROUND - h - 11} ${x + 4} ${GROUND - h - 3}Z`
  return { d, cut: '' }
}

const SKYLINE: Shape[] = [
  wall(),
  mandapam(300, 420, 40),
  mandapam(590, 680, 46),
  mandapam(920, 1010, 46),
  mandapam(1180, 1300, 40),
  vimana(70, 64, 82),
  vimana(1530, 70, 88),
  gopuram(225, 118, 150, 7),
  vimana(510, 104, 128),
  gopuram(800, 176, 208, 9),
  vimana(1090, 110, 134),
  gopuram(1380, 126, 158, 7),
]
const SKY_PATH = SKYLINE.map(s => s.d).join('')
const SKY_CUT = SKYLINE.map(s => s.cut).join('')

/**
 * Temple skyline silhouette. It sizes itself from its width (true proportions,
 * so tower tops are never cropped); pass only positioning classes.
 */
export function GopuramSkyline({ className = '', color = '#0a0a0b', opacity = 1, minHeight = 110 }: { className?: string; color?: string; opacity?: number; minHeight?: number }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg
      viewBox={`0 0 ${SKY_W} ${SKY_H}`}
      preserveAspectRatio="xMidYMax slice"
      className={`block w-full ${className}`}
      style={{ aspectRatio: `${SKY_W} / ${SKY_H}`, minHeight }}
      aria-hidden="true"
    >
      <defs>
        <mask id={`sky-${id}`} maskUnits="userSpaceOnUse" x="0" y="0" width={SKY_W} height={SKY_H}>
          <rect width={SKY_W} height={SKY_H} fill="#fff" />
          <path d={SKY_CUT} fill="#000" />
        </mask>
      </defs>
      <path d={SKY_PATH} fill={color} opacity={opacity} mask={`url(#sky-${id})`} />
    </svg>
  )
}

/** Koil (temple) saree border — a repeating row of ruby triangles with white dots. */
export function TempleBorder({ className = '', flip = false }: { className?: string; flip?: boolean }) {
  return <div className={`temple-border w-full ${flip ? 'temple-border-down' : ''} ${className}`} aria-hidden="true" />
}

/** Small kolam corner flourish for cards in Tamil mode. */
export function KolamCorner({ className = '' }: { className?: string }) {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" className={className} aria-hidden="true" fill="none" stroke="#c0163c" strokeWidth="1.3" strokeLinecap="round">
      <path d="M2 22 C 2 10, 10 2, 22 2" />
      <path d="M8 22 C 8 14, 14 8, 22 8" opacity="0.6" />
      <circle cx="22" cy="22" r="5" />
      <circle cx="22" cy="22" r="1.4" fill="#c0163c" />
      <circle cx="4" cy="4" r="1.4" fill="#c0163c" />
      <circle cx="12" cy="12" r="1.2" fill="#c0163c" />
    </svg>
  )
}
