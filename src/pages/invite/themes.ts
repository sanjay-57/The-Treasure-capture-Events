import type { InviteTheme } from '../../lib/invite'

/*
 * The look of every invite design, in one place. A design is layers:
 *   base     a CSS background: solid, linear, radial mesh or conic rays
 *   pattern  an SVG tile repeated over it (polka, stripes, plaid, tiles, scales…)
 *   overlay  one large SVG piece (retro sun, rangoli, halftone field)
 *   top / bottom / frame   motif art along the edges
 * plus colours, fonts, an ambient effect and one of four single-screen layouts:
 *   center   everything centred on the background
 *   card     the words sit on a panel over a loud pattern
 *   poster   left-aligned, oversized type
 *   split    two colour blocks, names above, details below
 * Art is SVG strings on a 390-wide grid (one phone width). The PNG export
 * renders the live invite, so the download always matches the screen.
 * No temples: garlands, kolam, silk, lamps, lanterns, leaves, tiles, plaid, waves.
 * Kept free of React.
 */

export type Fx = 'none' | 'petals' | 'twinkle' | 'rain' | 'sway' | 'confetti' | 'float'
export type Layout = 'center' | 'card' | 'poster' | 'split'

/** One piece of art; `w` × `h` on the 390 grid. */
export interface Art { svg: string; w: number; h: number }

export interface Pattern {
  /** SVG tile, repeated. */
  svg: string
  /** Tile size in CSS px. */
  size: number
  opacity: number
  /** Fade the pattern out where the words sit. */
  mask?: 'edges' | 'top' | 'bottom'
}

export interface ThemeStyle {
  /** CSS background of the whole invite. */
  base: string
  /** The design's main solid colour (portrait fill, cover, browser chrome). */
  tone: string
  pattern?: Pattern
  /** One large art piece; `x`, `y` place its centre (% of width / height), `w` its width (% of width). `full` covers the screen. */
  overlay?: Art & { x: number; y: number; w: number; full?: boolean; opacity?: number }
  top?: Art
  bottom?: Art
  frame?: { inset: number; lines: 1 | 2; color: string; corner?: Art }
  texture?: 'paper' | 'silk'
  layout: Layout
  /** The card behind the words (card layout). */
  panel?: { bg: string; border?: string; radius: number; shadow?: string }
  /** Upper colour block (split layout) and its text colours. */
  split?: { bg: string; ink: string; muted: string; accent: string }
  ink: string
  muted: string
  accent: string
  /** Text on an accent fill (the main button). */
  onAccent: string
  /** Countdown cells, soft fills. */
  card: string
  /** Hairlines and outlined buttons. */
  line: string
  dark: boolean
  /** Directions QR as [modules, background]: always dark on light, so it scans. */
  qr: [string, string]
  name: { family: string; weight: number; italic: boolean; upper?: boolean }
  taName: { family: string; weight: number }
  fx: Fx
  fxColors: string[]
  /** Outlined initials above the names. */
  monogram?: boolean
  /** Names in a metallic gradient, left to right. */
  foil?: string[]
  /** Shape of the caricature's frame (premium). */
  portrait?: 'arch' | 'oval' | 'circle'
}

/** The older, gradient-only shape the first ten designs were drawn in. */
interface Legacy {
  bg: string[]; ink: string; muted: string; accent: string; onAccent: string; card: string; line: string; dark: boolean; qr: [string, string]
  name: ThemeStyle['name']; taName: ThemeStyle['taName']; fx: Fx; fxColors: string[]; monogram?: boolean; foil?: string[]; portrait?: ThemeStyle['portrait']
  texture?: ThemeStyle['texture']; frame?: ThemeStyle['frame']; top: Art; bottom: Art
}

export const GRID = 390

// ─── SVG helpers ─────────────────────────────────────────────────────────────

const r1 = (n: number) => Math.round(n * 10) / 10
const doc = (w: number, h: number, body: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`
const art = (w: number, h: number, body: string): Art => ({ svg: doc(w, h, body), w, h })
/** The body plus its mirror image across the vertical centre line. */
const mirror = (body: string, w = GRID) => `${body}<g transform="matrix(-1 0 0 1 ${w} 0)">${body}</g>`
const flipY = (body: string, h: number) => `<g transform="matrix(1 0 0 -1 0 ${h})">${body}</g>`

/** Deterministic 0–1 noise, so the art and the effects look the same every time. */
export const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** A pointed leaf along +x from (x, y), turned by `deg`. */
const leaf = (x: number, y: number, len: number, deg: number, fill: string, w = 0.36) =>
  `<path d="M0 0Q${r1(len / 2)} ${r1(-len * w)} ${len} 0Q${r1(len / 2)} ${r1(len * w)} 0 0Z" transform="translate(${r1(x)} ${r1(y)}) rotate(${r1(deg)})" fill="${fill}"/>`

/** A round flower of `n` petals. */
const flower = (x: number, y: number, r: number, n: number, fill: string, mid: string, stroke = '') => {
  let p = ''
  for (let i = 0; i < n; i++) p += `<ellipse cx="0" cy="${r1(-r * 0.52)}" rx="${r1(r * 0.3)}" ry="${r1(r * 0.52)}" transform="rotate(${r1((i * 360) / n)})"/>`
  return `<g transform="translate(${r1(x)} ${r1(y)})" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="0.7"` : ''}>${p}<circle r="${r1(r * 0.26)}" fill="${mid}"/></g>`
}

const qp = (a: number, b: number, c: number, t: number) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c
const cp = (a: number, b: number, c: number, d: number, t: number) => (1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t * t * c + t ** 3 * d

/** Four-point sparkle. */
const sparkle = (x: number, y: number, r: number, fill: string, op = 1) =>
  `<path d="M0 ${-r}Q${r1(r * 0.18)} ${r1(-r * 0.18)} ${r} 0Q${r1(r * 0.18)} ${r1(r * 0.18)} 0 ${r}Q${r1(-r * 0.18)} ${r1(r * 0.18)} ${-r} 0Q${r1(-r * 0.18)} ${r1(-r * 0.18)} 0 ${-r}Z" transform="translate(${r1(x)} ${r1(y)})" fill="${fill}" opacity="${op}"/>`

// ─── Free themes ─────────────────────────────────────────────────────────────

function ivory(): Legacy {
  const gold = '#8a6d3b'
  const blush = '#d7a98c'
  const sage = '#9a9467'
  const vine = `<path d="M180 46C160 46 150 30 128 34C110 37 108 56 122 57C130 58 133 50 127 46" fill="none" stroke="${gold}" stroke-width="1.1"/>`
    + leaf(150, 38, 13, -150, sage) + leaf(146, 42, 12, 160, sage) + leaf(118, 40, 10, -110, sage)
    + `<line x1="56" y1="46" x2="104" y2="46" stroke="${gold}" stroke-width="0.8"/><circle cx="52" cy="46" r="1.8" fill="${gold}"/>`
  const top = art(GRID, 92, mirror(vine) + flower(195, 46, 13, 8, blush, gold) + flower(195, 46, 6, 8, '#f2dcc8', gold))
  const bottom = art(GRID, 62, mirror(`<line x1="120" y1="30" x2="178" y2="30" stroke="${gold}" stroke-width="0.8"/>${leaf(180, 30, 9, -160, sage)}${leaf(180, 30, 9, 160, sage)}<circle cx="114" cy="30" r="1.5" fill="${gold}"/>`) + flower(195, 30, 9, 6, blush, gold))
  const arm = `<path d="M5 5Q28 7 46 28" fill="none" stroke="${gold}" stroke-width="1"/>${leaf(18, 8, 11, -18, sage)}${leaf(18, 8, 10, 42, sage)}${leaf(31, 14, 10, -8, sage)}${leaf(31, 14, 9, 66, sage)}${flower(46, 29, 4.5, 5, blush, gold)}`
  const corner = art(60, 60, arm + `<g transform="matrix(0 1 1 0 0 0)">${arm}</g>` + flower(8, 8, 8, 6, blush, gold))
  return {
    bg: ['#fbf7ef', '#f4ede0'], ink: '#3a2c1a', muted: 'rgba(58,44,26,0.62)', accent: gold, onAccent: '#fffaf0',
    card: 'rgba(138,109,59,0.07)', line: 'rgba(138,109,59,0.28)', dark: false, qr: ['#3a2c1a', '#ffffff'],
    name: { family: 'Cormorant Garamond', weight: 500, italic: true }, taName: { family: 'Noto Serif Tamil', weight: 500 },
    fx: 'none', fxColors: [], texture: 'paper', frame: { inset: 14, lines: 2, color: 'rgba(138,109,59,0.55)', corner }, top, bottom,
  }
}

function jasmine(): Legacy {
  const green = '#5f8a5a'
  const bud = (x: number, y: number) => `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="2.6" ry="4.2" fill="#fffef9" stroke="#c4d0bd" stroke-width="0.8"/>`
  let strands = `<path d="M0 5Q195 12 390 5" fill="none" stroke="${green}" stroke-width="1.4"/>`
  for (let i = 0; i < 13; i++) {
    const x = 15 + i * 30
    const y0 = 5 + 7 * (1 - ((x - 195) / 195) ** 2)
    const len = 46 + (i % 3) * 26 + (i % 2 ? 12 : 0)
    strands += `<line x1="${x}" y1="${r1(y0)}" x2="${x}" y2="${r1(y0 + len)}" stroke="#b9c8b2" stroke-width="0.7"/>`
    strands += leaf(x, y0 + 2, 9, 140, green) + leaf(x, y0 + 2, 9, 40, green)
    for (let y = y0 + 12; y < y0 + len - 6; y += 9) strands += bud(x, y)
    strands += flower(x, y0 + len, 7, 5, '#ffffff', '#c9d68a', '#c4d0bd')
  }
  const top = art(GRID, 128, strands)
  const bottom = art(GRID, 60, mirror(`${leaf(186, 32, 16, 195, green)}${leaf(178, 30, 13, 160, green)}${bud(166, 26)}${bud(158, 32)}<line x1="110" y1="34" x2="150" y2="34" stroke="${green}" stroke-width="0.7"/>`) + flower(195, 30, 10, 5, '#ffffff', '#c9d68a', '#c4d0bd'))
  return {
    bg: ['#ffffff', '#f5f7f0'], ink: '#26332a', muted: 'rgba(38,51,42,0.6)', accent: green, onAccent: '#ffffff',
    card: 'rgba(95,138,90,0.07)', line: 'rgba(95,138,90,0.25)', dark: false, qr: ['#26332a', '#ffffff'],
    name: { family: 'Cormorant Garamond', weight: 500, italic: false }, taName: { family: 'Noto Serif Tamil', weight: 500 },
    fx: 'none', fxColors: [], texture: 'paper', top, bottom,
  }
}

function kolam(): Legacy {
  const terra = '#a8433e'
  const band = () => {
    let a = 'M0 28'
    let b = 'M0 28'
    let dots = ''
    for (let k = 0; k < 15; k++) {
      const x = k * 26
      const up = k % 2 ? 1 : -1
      a += `Q${x + 13} ${28 + up * 20} ${x + 26} 28`
      b += `Q${x + 13} ${28 - up * 20} ${x + 26} 28`
      dots += `<circle cx="${x + 13}" cy="28" r="2.2" fill="${terra}"/><circle cx="${x}" cy="12" r="1.2" fill="${terra}" opacity="0.7"/><circle cx="${x}" cy="44" r="1.2" fill="${terra}" opacity="0.7"/>`
    }
    return `<path d="${a}" fill="none" stroke="${terra}" stroke-width="1.3"/><path d="${b}" fill="none" stroke="${terra}" stroke-width="1.3"/>${dots}<line x1="0" y1="3" x2="390" y2="3" stroke="${terra}" stroke-width="1.4"/><line x1="0" y1="53" x2="390" y2="53" stroke="${terra}" stroke-width="0.8"/>`
  }
  let rosette = ''
  for (let i = 0; i < 8; i++) rosette += `<ellipse cx="0" cy="-9" rx="4.5" ry="9" fill="none" stroke="${terra}" stroke-width="1.1" transform="rotate(${i * 45})"/>`
  rosette = `<g transform="translate(195 80)">${rosette}<circle r="2.4" fill="${terra}"/></g>`
  for (const [x, y] of [[195, 60], [195, 100], [175, 80], [215, 80]]) rosette += `<circle cx="${x}" cy="${y}" r="1.4" fill="${terra}"/>`
  return {
    bg: ['#f7f0e4', '#efe4d2'], ink: '#3b2a20', muted: 'rgba(59,42,32,0.62)', accent: terra, onAccent: '#fff8ef',
    card: 'rgba(168,67,62,0.07)', line: 'rgba(168,67,62,0.26)', dark: false, qr: ['#3b2a20', '#ffffff'],
    name: { family: 'Arima', weight: 500, italic: false }, taName: { family: 'Arima', weight: 500 },
    fx: 'none', fxColors: [], texture: 'paper', top: art(GRID, 104, band() + rosette), bottom: art(GRID, 56, flipY(band(), 56)),
  }
}

/** Marigold head: a ruffled disc in two tones. */
const marigoldHead = (x: number, y: number, r: number, i: number) => {
  const c = i % 3 === 1 ? ['#ffd23f', '#f59e0b'] : ['#f97316', '#c2410c']
  let ruff = ''
  for (let k = 0; k < 10; k++) ruff += `<circle cx="${r1(Math.cos((k * Math.PI) / 5) * r * 0.62)}" cy="${r1(Math.sin((k * Math.PI) / 5) * r * 0.62)}" r="${r1(r * 0.42)}"/>`
  return `<g transform="translate(${r1(x)} ${r1(y)})" fill="${c[0]}" stroke="${c[1]}" stroke-width="0.6">${ruff}<circle r="${r1(r * 0.4)}" fill="${c[1]}" stroke="none"/></g>`
}

function marigold(): Legacy {
  let s = `<line x1="0" y1="5" x2="390" y2="5" stroke="#6b3a10" stroke-width="1.4"/>`
  for (let x = 6, i = 0; x < 390; x += 16, i++) s += leaf(x, 5, i % 2 ? 26 : 32, 90 + (i % 2 ? 6 : -6), i % 2 ? '#3f8f3a' : '#2e7d32', 0.3)
  const ends = [0, 130, 260, 390]
  let n = 0
  for (let k = 0; k < 3; k++) {
    const [x0, x1] = [ends[k], ends[k + 1]]
    for (let t = 0; t <= 1.0001; t += 1 / 11) s += marigoldHead(qp(x0, (x0 + x1) / 2, x1, t), qp(14, 96, 14, t), 7.5, n++)
  }
  for (const x of [130, 260]) {
    for (let j = 0; j < 4; j++) s += marigoldHead(x, 26 + j * 13, 6.5, j)
    s += leaf(x, 76, 14, 90, '#2e7d32', 0.32)
  }
  let b = ''
  for (let x = 46, i = 0; x <= 344; x += 13, i++) b += marigoldHead(x, 34, 7, i)
  b += mirror(`${leaf(40, 34, 18, 170, '#2e7d32', 0.3)}${leaf(40, 34, 15, 200, '#3f8f3a', 0.3)}`)
  return {
    bg: ['#f8ad42', '#f2921f'], ink: '#3d1204', muted: 'rgba(61,18,4,0.7)', accent: '#8f1d0d', onAccent: '#fff3e0',
    card: 'rgba(255,243,224,0.28)', line: 'rgba(61,18,4,0.25)', dark: false, qr: ['#3d1204', '#fff8ec'],
    name: { family: 'Arima', weight: 600, italic: false }, taName: { family: 'Arima', weight: 600 },
    fx: 'none', fxColors: [], texture: 'paper', top: art(GRID, 120, s), bottom: art(GRID, 60, b),
  }
}

// ─── Premium themes ──────────────────────────────────────────────────────────

function lantern(): Legacy {
  const gold = '#e6b85c'
  const glow = `<defs><radialGradient id="g"><stop offset="0" stop-color="#ffd98a" stop-opacity="0.75"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient></defs>`
  const lamp = (x: number, len: number, k: number) =>
    `<line x1="${x}" y1="0" x2="${x}" y2="${len}" stroke="${gold}" stroke-width="0.8" opacity="0.7"/>`
    + `<g transform="translate(${x} ${len}) scale(${k})">`
    + `<circle cy="30" r="38" fill="url(#g)"/>`
    + `<circle cy="-2" r="3" fill="none" stroke="${gold}" stroke-width="1.2"/>`
    + `<path d="M-9 1H9L14 7H-14Z" fill="#b8893a"/>`
    + `<path d="M-14 7C-23 19-23 39-14 51H14C23 39 23 19 14 7Z" fill="#f2c868"/>`
    + `<ellipse cy="29" rx="10" ry="15" fill="#fff1c2" opacity="0.75"/>`
    + `<path d="M-7 8C-12 20-12 38-7 50M0 7V51M7 8C12 20 12 38 7 50" fill="none" stroke="#a8792e" stroke-width="1"/>`
    + `<path d="M-12 51H12L9 57H-9Z" fill="#b8893a"/>`
    + `<line y1="57" y2="66" stroke="${gold}" stroke-width="1"/><path d="M-3.5 65L0 79L3.5 65Z" fill="${gold}"/>`
    + `</g>`
  let stars = ''
  for (let i = 0; i < 16; i++) stars += sparkle(10 + rnd(i) * 370, 8 + rnd(i + 40) * 150, 1.5 + rnd(i + 80) * 2.5, '#fff3d0', 0.35 + rnd(i + 9) * 0.5)
  const top = art(GRID, 180, glow + stars + lamp(42, 46, 0.78) + lamp(112, 86, 0.95) + lamp(195, 64, 1.18) + lamp(278, 92, 0.95) + lamp(348, 40, 0.78))
  let b = glow
  for (const [x0, x1] of [[0, 195], [195, 390]]) {
    b += `<path d="M${x0} 18Q${(x0 + x1) / 2} 72 ${x1} 18" fill="none" stroke="${gold}" stroke-width="0.7" opacity="0.6"/>`
    for (let t = 1 / 9; t < 1; t += 1 / 9) {
      const x = qp(x0, (x0 + x1) / 2, x1, t)
      const y = qp(18, 72, 18, t) + 3
      b += `<circle cx="${r1(x)}" cy="${r1(y)}" r="9" fill="url(#g)"/><circle cx="${r1(x)}" cy="${r1(y)}" r="2.4" fill="#ffe7ad"/>`
    }
  }
  return {
    bg: ['#0a1230', '#14214c', '#0b1430'], ink: '#fdf6e6', muted: 'rgba(253,246,230,0.6)', accent: gold, onAccent: '#0b1430',
    card: 'rgba(255,255,255,0.05)', line: 'rgba(230,184,92,0.25)', dark: true, qr: ['#0b1430', '#f3d38f'],
    name: { family: 'Cormorant Garamond', weight: 500, italic: true }, taName: { family: 'Noto Serif Tamil', weight: 500 },
    fx: 'twinkle', fxColors: ['#fff3d0', '#e6b85c'], foil: ['#c99a3e', '#fbe7b0', '#e6b85c', '#fff4cf', '#b8862f'], portrait: 'oval', top, bottom: art(GRID, 70, b),
  }
}

function kanjivaram(): Legacy {
  const gold = '#d9a94e'
  const band = () => {
    let s = `<rect width="390" height="10" fill="${gold}"/><rect y="13" width="390" height="1.4" fill="${gold}"/><rect y="17" width="390" height="44" fill="${gold}" opacity="0.1"/>`
    for (let x = 0; x <= 390; x += 48) {
      s += `<g transform="translate(${x} 39)"><ellipse rx="11" ry="15" fill="${gold}"/><ellipse rx="7.5" ry="11" fill="#1d6b66"/><ellipse cy="1" rx="4" ry="6" fill="#16325c"/><circle cy="1" r="1.6" fill="${gold}"/></g>`
      s += `<rect x="${x + 20}" y="35" width="8" height="8" fill="${gold}" transform="rotate(45 ${x + 24} 39)"/><circle cx="${x + 24}" cy="24" r="1.5" fill="${gold}"/><circle cx="${x + 24}" cy="54" r="1.5" fill="${gold}"/>`
    }
    s += `<rect y="63" width="390" height="1.4" fill="${gold}"/><rect y="67" width="390" height="6" fill="${gold}"/>`
    for (let x = 4; x < 390; x += 8) s += `<circle cx="${x}" cy="77" r="1.5" fill="${gold}" opacity="0.8"/>`
    return s
  }
  const motif = (y: number) => `<g transform="translate(195 ${y})">${sparkle(0, 0, 9, gold)}<circle r="2" fill="#5c0f1f"/></g>` + mirror(`<line x1="120" y1="${y}" x2="178" y2="${y}" stroke="${gold}" stroke-width="0.8"/><rect x="113" y="${y - 3}" width="6" height="6" fill="${gold}" transform="rotate(45 116 ${y})"/>`)
  return {
    bg: ['#550d1c', '#781a2e', '#550d1c'], ink: '#fbefd6', muted: 'rgba(251,239,214,0.66)', accent: gold, onAccent: '#4a0b18',
    card: 'rgba(217,169,78,0.08)', line: 'rgba(217,169,78,0.3)', dark: true, qr: ['#4a0b18', '#f1d59a'],
    name: { family: 'Cormorant Garamond', weight: 600, italic: false }, taName: { family: 'Noto Serif Tamil', weight: 600 },
    fx: 'petals', fxColors: ['#d9a94e', '#f1d59a', '#c0392b'], foil: ['#b8862f', '#f7dc97', '#d9a94e', '#fff0c4', '#a8791c'], portrait: 'arch', texture: 'silk',
    frame: { inset: 9, lines: 2, color: 'rgba(217,169,78,0.5)' },
    top: art(GRID, 104, band() + motif(94)), bottom: art(GRID, 104, flipY(band() + motif(94), 104)),
  }
}

function ruby(): Legacy {
  const gold = '#e8c47c'
  const fade = `<defs><linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="0.45" stop-color="${gold}"/><stop offset="1" stop-color="${gold}" stop-opacity="0"/></linearGradient></defs>`
  // Scallops: small arcs along the inner curve of the arch, bulging inward.
  const P = [[36, 150], [36, 52], [116, 28], [195, 28]]
  const Q = [[195, 28], [274, 28], [354, 52], [354, 150]]
  const pts: [number, number][] = []
  for (const C of [P, Q]) for (let i = 0; i < 9; i++) pts.push([cp(C[0][0], C[1][0], C[2][0], C[3][0], i / 9), cp(C[0][1], C[1][1], C[2][1], C[3][1], i / 9)])
  pts.push([354, 150])
  let sc = `M${pts[0][0]} ${pts[0][1]}`
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]) / 2
    sc += `A${r1(d)} ${r1(d)} 0 0 0 ${r1(pts[i][0])} ${r1(pts[i][1])}`
  }
  const curl = `<path d="M195 30C186 36 176 33 177 25C178 19 186 19 186 25" fill="none" stroke="${gold}" stroke-width="1.1"/>${leaf(178, 34, 11, 160, gold, 0.3)}`
    + `<path d="M6 6C34 6 50 18 44 34C40 44 28 40 31 32" fill="none" stroke="${gold}" stroke-width="1.1"/>${leaf(22, 8, 12, 20, gold, 0.3)}${leaf(44, 20, 10, 80, gold, 0.3)}<circle cx="6" cy="6" r="2.4" fill="${gold}"/>`
  const top = art(GRID, 160, fade
    + `<path d="M24 160V96C24 40 110 14 195 14C280 14 366 40 366 96V160" fill="none" stroke="url(#f)" stroke-width="2"/>`
    + `<path d="M36 160V52C36 52 116 28 195 28C274 28 354 52 354 160" fill="none" stroke="url(#f)" stroke-width="0.8"/>`
    + `<path d="${sc}" fill="none" stroke="url(#f)" stroke-width="1"/>`
    + mirror(curl)
    + flower(195, 18, 11, 8, gold, '#8a1729')
    + `<line x1="195" y1="30" x2="195" y2="52" stroke="${gold}" stroke-width="0.8"/><path d="M195 52C190 58 192 64 195 66C198 64 200 58 195 52Z" fill="${gold}"/>`)
  const bottom = art(GRID, 70, mirror(`<path d="M185 36C165 26 150 46 132 40C120 36 122 24 132 26" fill="none" stroke="${gold}" stroke-width="1.1"/>${leaf(160, 36, 12, 200, gold, 0.3)}${leaf(146, 40, 10, 150, gold, 0.3)}<line x1="70" y1="36" x2="118" y2="36" stroke="${gold}" stroke-width="0.7"/><circle cx="64" cy="36" r="1.8" fill="${gold}"/>`) + flower(195, 36, 12, 8, gold, '#8a1729'))
  return {
    bg: ['#6a0e1d', '#951a2f', '#6a0e1d'], ink: '#fff3e3', muted: 'rgba(255,243,227,0.66)', accent: gold, onAccent: '#5a0b18',
    card: 'rgba(232,196,124,0.08)', line: 'rgba(232,196,124,0.3)', dark: true, qr: ['#5a0b18', '#f6e2b8'],
    name: { family: 'Cormorant Garamond', weight: 500, italic: true }, taName: { family: 'Noto Serif Tamil', weight: 500 },
    fx: 'petals', fxColors: ['#f4a7b5', '#e8c47c', '#ffd6dc'], foil: ['#c9a25a', '#fff0c8', '#e8c47c', '#fffaf0', '#b8903e'], portrait: 'arch',
    frame: { inset: 10, lines: 2, color: 'rgba(232,196,124,0.45)' }, top, bottom,
  }
}

/** Plantain leaf along +x: two-tone halves, midrib and side veins. */
const plantain = (x: number, y: number, len: number, wid: number, deg: number, light: string, dark: string) => {
  let veins = ''
  for (let k = 1; k < 12; k++) {
    const vx = (len * k) / 12
    const h = wid * Math.sin((Math.PI * k) / 12) * 0.95
    veins += `M${r1(vx)} 0L${r1(vx + h * 0.5)} ${r1(-h)}M${r1(vx)} 0L${r1(vx + h * 0.5)} ${r1(h)}`
  }
  return `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${deg})">`
    + `<path d="M0 0C${r1(len * 0.2)} ${-wid} ${r1(len * 0.75)} ${-wid} ${len} 0Z" fill="${light}"/>`
    + `<path d="M0 0C${r1(len * 0.2)} ${wid} ${r1(len * 0.75)} ${wid} ${len} 0Z" fill="${dark}"/>`
    + `<path d="${veins}" stroke="#d9efb0" stroke-width="0.5" opacity="0.35"/>`
    + `<path d="M0 0L${len} 0" stroke="#e6f3c4" stroke-width="1.6"/></g>`
}

function banana(): Legacy {
  const gold = '#f2d27a'
  const side = plantain(-24, -8, 200, 24, 52, '#2f7f3c', '#22662f') + plantain(-30, -2, 270, 32, 28, '#4f9e4a', '#3a8a3f')
  const top = art(GRID, 160, mirror(side) + `<line x1="160" y1="40" x2="230" y2="40" stroke="${gold}" stroke-width="0.8"/>${sparkle(195, 40, 7, gold)}`)
  const bottom = art(GRID, 92, plantain(16, 62, 358, 28, 0, '#4f9e4a', '#3a8a3f') + mirror(plantain(-10, 90, 120, 16, -24, '#2f7f3c', '#22662f')))
  return {
    bg: ['#163f25', '#215a35', '#163f25'], ink: '#f6ecc8', muted: 'rgba(246,236,200,0.66)', accent: gold, onAccent: '#163f25',
    card: 'rgba(246,236,200,0.07)', line: 'rgba(242,210,122,0.28)', dark: true, qr: ['#163f25', '#f6ecc8'],
    name: { family: 'Arima', weight: 600, italic: false }, taName: { family: 'Arima', weight: 600 },
    fx: 'sway', fxColors: [], foil: ['#e8c766', '#fff6d2', '#f2d27a', '#fffbe6', '#d8b450'], portrait: 'circle', frame: { inset: 16, lines: 1, color: 'rgba(246,236,200,0.4)' }, top, bottom,
  }
}

function monsoon(): Legacy {
  const lime = '#c9e27a'
  let clouds = ''
  for (const [x, y, k] of [[50, 10, 1.1], [190, 4, 1.4], [330, 12, 1.05]]) {
    clouds += `<g transform="translate(${x} ${y}) scale(${k})" fill="#ffffff" opacity="0.09"><circle cx="-26" cy="14" r="16"/><circle cx="0" cy="6" r="22"/><circle cx="26" cy="14" r="17"/><rect x="-42" y="14" width="84" height="16" rx="8"/></g>`
  }
  let rain = ''
  for (let i = 0; i < 34; i++) {
    const x = rnd(i + 3) * 400 - 5
    const y = 30 + rnd(i + 51) * 90
    rain += `M${r1(x)} ${r1(y)}l-3 13`
  }
  const top = art(GRID, 124, clouds + `<path d="${rain}" stroke="#dbe8ff" stroke-width="1" stroke-linecap="round" opacity="0.4"/>`)
  const petal = `M0 0C-7 -10 -5 -23 0 -30C5 -23 7 -10 0 0Z`
  const lotus = (x: number, y: number, k: number) => {
    let p = ''
    for (const a of [-64, -40, 40, 64]) p += `<path d="${petal}" fill="#e98fb0" transform="rotate(${a})"/>`
    for (const a of [-20, 20]) p += `<path d="${petal}" fill="#f4b2c9" transform="rotate(${a})"/>`
    p += `<path d="${petal}" fill="#fbd3e0"/>`
    return `<g transform="translate(${x} ${y}) scale(${k})">${p}<ellipse cy="-2" rx="5" ry="2.4" fill="${lime}"/></g>`
  }
  const pad = (x: number, y: number, rx: number) => `<path d="M${x} ${y}m${-rx} 0a${rx} ${r1(rx * 0.32)} 0 1 0 ${rx * 2} 0a${rx} ${r1(rx * 0.32)} 0 0 0 ${-rx * 2} 0Z" fill="#3f7d5c"/><path d="M${x} ${y}l${r1(rx * 0.8)} ${r1(-rx * 0.22)}" stroke="#16263f" stroke-width="2"/>`
  const bottom = art(GRID, 112,
    `<g fill="none" stroke="#ffffff" stroke-width="0.7" opacity="0.22"><ellipse cx="195" cy="96" rx="170" ry="12"/><ellipse cx="195" cy="96" rx="110" ry="7"/><ellipse cx="70" cy="104" rx="50" ry="4"/></g>`
    + pad(60, 92, 26) + pad(318, 94, 30) + pad(150, 100, 20) + pad(250, 98, 18)
    + `<path d="M195 92V70M118 94V78M276 96V82" stroke="#3f7d5c" stroke-width="2"/>`
    + lotus(118, 82, 0.85) + lotus(195, 72, 1.15) + lotus(276, 86, 0.8)
    + `<circle cx="352" cy="74" r="4" fill="${lime}"/><path d="M352 78V94" stroke="#3f7d5c" stroke-width="1.6"/>`)
  return {
    bg: ['#16243c', '#213459', '#2a426c'], ink: '#eef3fa', muted: 'rgba(238,243,250,0.62)', accent: lime, onAccent: '#16243c',
    card: 'rgba(255,255,255,0.06)', line: 'rgba(201,226,122,0.28)', dark: true, qr: ['#16243c', '#e4f1bd'],
    name: { family: 'Cormorant Garamond', weight: 500, italic: true }, taName: { family: 'Noto Serif Tamil', weight: 500 },
    fx: 'rain', fxColors: ['#dbe8ff'], foil: ['#d9ef94', '#ffffff', '#c9e27a', '#f4ffd6', '#b5d063'], portrait: 'oval', top, bottom,
  }
}


// ─── Pattern tiles ───────────────────────────────────────────────────────────

const tile = (size: number, body: string, opacity: number, mask?: Pattern['mask']): Pattern => ({ svg: doc(size, size, body), size, opacity, mask })

const grid = (c: string) => tile(34, `<path d="M0 0.5H34M0.5 0V34" stroke="${c}" stroke-width="0.6"/>`, 1)

/** Madras plaid: translucent bands crossing both ways. */
const madras = () => {
  const bands: [number, number, string, number][] = [[6, 20, '#f6c445', 0.6], [34, 6, '#ffffff', 0.55], [46, 30, '#1d2f6f', 0.5], [84, 8, '#1f8a4c', 0.6], [98, 3, '#ffffff', 0.7], [108, 10, '#f6c445', 0.45]]
  let b = ''
  for (const [x, w, c, o] of bands) b += `<rect x="${x}" width="${w}" height="120" fill="${c}" opacity="${o}"/><rect y="${x}" width="120" height="${w}" fill="${c}" opacity="${o * 0.85}"/>`
  b += `<path d="${Array.from({ length: 30 }, (_, i) => `M${i * 8} 0L${i * 8 - 120} 120`).join('')}" stroke="#000" stroke-width="0.5" opacity="0.08"/>`
  return tile(120, b, 1)
}

/** Athangudi floor tile: corner quarter-discs that meet as circles, a four-petal flower in the middle. */
const athangudi = () => {
  const red = '#b3261e', ochre = '#e8a628', green = '#2f6b4f', cream = '#f4e2c4'
  let b = `<rect width="76" height="76" fill="${cream}"/>`
  for (const [x, y] of [[0, 0], [76, 0], [0, 76], [76, 76]]) b += `<circle cx="${x}" cy="${y}" r="22" fill="${red}"/><circle cx="${x}" cy="${y}" r="12" fill="${ochre}"/><circle cx="${x}" cy="${y}" r="5" fill="${green}"/>`
  b += `<g transform="translate(38 38)">`
  for (const a of [0, 90, 45, 135]) b += `<ellipse rx="${a % 90 ? 4 : 6}" ry="${a % 90 ? 13 : 17}" fill="${a % 90 ? green : red}" transform="rotate(${a})"/>`
  b += `<circle r="5" fill="${ochre}"/><circle r="2" fill="${cream}"/></g>`
  b += `<path d="M38 0V8M38 68V76M0 38H8M68 38H76" stroke="${green}" stroke-width="2"/>`
  b += `<rect x="0.75" y="0.75" width="74.5" height="74.5" fill="none" stroke="#7a1a12" stroke-width="1.5" opacity="0.5"/>`
  return tile(76, b, 1)
}

/** Overlapping fan scales (art-deco fans, seigaiha waves): rings filled with the base so each row covers the last. */
const scales = (w: number, fill: string, stroke: string, rings: number, sw = 1) => {
  const h = w / 2
  const fan = (cx: number, cy: number) => {
    let g = `<circle cx="${cx}" cy="${cy}" r="${h}" fill="${fill}"/>`
    for (let i = 0; i < rings; i++) g += `<circle cx="${cx}" cy="${cy}" r="${r1(h - (i * h) / rings - sw)}" fill="none" stroke="${stroke}" stroke-width="${sw}"/>`
    return g
  }
  return doc(w, h, fan(0, 0) + fan(w, 0) + fan(w / 2, h) + fan(0, h * 2) + fan(w, h * 2))
}

/** Peacock-feather scales: gold-rimmed teal plumes with an indigo eye. */
const peacockScales = () => {
  const plume = (x: number, y: number) => `<g transform="translate(${x} ${y})"><ellipse rx="20" ry="25" fill="#0d5c55" stroke="#e7c26a" stroke-width="1.2"/><ellipse cy="3" rx="13" ry="16" fill="#12867a"/><ellipse cy="5" rx="8" ry="10" fill="#e7c26a" opacity="0.9"/><ellipse cy="6" rx="6" ry="7.5" fill="#1f3f8f"/><ellipse cy="7" rx="2.8" ry="3.6" fill="#0a1638"/></g>`
  return { svg: doc(40, 48, plume(0, 0) + plume(40, 0) + plume(20, 24) + plume(0, 48) + plume(40, 48)), size: 40, opacity: 0.55, mask: 'edges' as const }
}

const lotusTile = (c: string) => {
  const petal = 'M0 0C-5 -7 -4 -16 0 -21C4 -16 5 -7 0 0Z'
  const l = (x: number, y: number) => `<g transform="translate(${x} ${y})" fill="none" stroke="${c}" stroke-width="1">${[-50, -25, 0, 25, 50].map(a => `<path d="${petal}" transform="rotate(${a})"/>`).join('')}<path d="M-14 2Q0 7 14 2"/></g>`
  return tile(64, l(16, 26) + l(48, 58) + `<circle cx="48" cy="20" r="1.4" fill="${c}"/><circle cx="16" cy="52" r="1.4" fill="${c}"/>`, 0.32)
}

const terrazzoTile = () => {
  const cols = ['#e2603b', '#2a9d8f', '#e9c46a', '#264653', '#f4a3a8', '#9a8f84']
  let b = ''
  for (let i = 0; i < 34; i++) {
    const x = rnd(i * 5 + 1) * 170, y = rnd(i * 5 + 2) * 170, r = 2.5 + rnd(i * 5 + 3) * (i % 7 === 0 ? 9 : 4.5)
    const n = 4 + Math.floor(rnd(i * 5 + 4) * 3)
    const pts = Array.from({ length: n }, (_, k) => { const a = (k / n) * Math.PI * 2 + rnd(i + k); const rr = r * (0.6 + rnd(i * 9 + k) * 0.5); return `${r1(x + Math.cos(a) * rr)},${r1(y + Math.sin(a) * rr)}` }).join(' ')
    b += `<polygon points="${pts}" fill="${cols[i % cols.length]}" opacity="${i % 7 === 0 ? 0.9 : 0.75}"/>`
  }
  return tile(170, b, 1)
}

const confettiTile = (cols: string[]) => {
  let b = ''
  for (let i = 0; i < 22; i++) {
    const x = rnd(i * 7 + 1) * 130, y = rnd(i * 7 + 2) * 130, a = rnd(i * 7 + 3) * 180, c = cols[i % cols.length]
    const k = i % 4
    b += k === 0 ? `<rect x="-5" y="-2" width="10" height="4" rx="1" fill="${c}" transform="translate(${r1(x)} ${r1(y)}) rotate(${r1(a)})"/>`
      : k === 1 ? `<circle cx="${r1(x)}" cy="${r1(y)}" r="3" fill="${c}"/>`
      : k === 2 ? `<path d="M-7 0q3.5-5 7 0t7 0" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round" transform="translate(${r1(x)} ${r1(y)}) rotate(${r1(a)})"/>`
      : `<path d="M0-4L4 3H-4Z" fill="${c}" transform="translate(${r1(x)} ${r1(y)}) rotate(${r1(a)})"/>`
  }
  return tile(130, b, 0.9)
}

const lattice = (c: string) => tile(36, `<path d="M0 18L18 0L36 18L18 36Z" fill="none" stroke="${c}" stroke-width="0.7"/><circle cx="18" cy="0" r="1.4" fill="${c}"/><circle cx="0" cy="18" r="1.4" fill="${c}"/><circle cx="36" cy="18" r="1.4" fill="${c}"/><circle cx="18" cy="36" r="1.4" fill="${c}"/><circle cx="18" cy="18" r="0.9" fill="${c}"/>`, 0.32)

// ─── Art for the classic free designs ────────────────────────────────────────

/** Kumkum band: a red edge, a row of red dots and gold lozenges, a rosette in the middle. */
const kumkumBand = () => {
  let row = ''
  for (let x = 12, i = 0; x < 390; x += 18, i++) row += i % 2 ? `<rect x="${x - 3}" y="21" width="6" height="6" fill="#c98a0b" transform="rotate(45 ${x} 24)"/>` : `<circle cx="${x}" cy="24" r="3.2" fill="#b0141e"/>`
  return `<rect width="390" height="8" fill="#b0141e"/><rect y="11" width="390" height="1.6" fill="#b0141e"/>${row}<rect y="35" width="390" height="1" fill="#b0141e" opacity="0.6"/>`
    + mirror(`<path d="M120 62H170" stroke="#b0141e" stroke-width="1"/>${leaf(172, 62, 10, -150, '#3f7d3a', 0.32)}${leaf(172, 62, 10, 150, '#3f7d3a', 0.32)}<circle cx="116" cy="62" r="2" fill="#b0141e"/>`)
    + flower(195, 62, 18, 8, '#b0141e', '#ffd84a') + `<circle cx="195" cy="62" r="3" fill="#b0141e"/>`
}

/** A brass kuthuvilakku: four flames round the oil bowl, knotted stem, domed foot, all in a warm glow. */
const brassLamp = () => {
  const flame = (x: number) => `<g transform="translate(${x} 56)"><path d="M0 0C-7 -9 -5 -20 0 -30C5 -20 7 -9 0 0Z" fill="#ffc94d"/><path d="M0 -2C-3 -7 -2 -13 0 -18C2 -13 3 -7 0 -2Z" fill="#fff4c9"/></g>`
  return art(GRID, 190,
    `<defs><radialGradient id="glow"><stop offset="0" stop-color="#ffcf6b" stop-opacity="0.55"/><stop offset="1" stop-color="#ffcf6b" stop-opacity="0"/></radialGradient>`
    + `<linearGradient id="brass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8f6020"/><stop offset="0.45" stop-color="#f6d58a"/><stop offset="1" stop-color="#9a6a24"/></linearGradient></defs>`
    + `<circle cx="195" cy="48" r="110" fill="url(#glow)"/>`
    + flame(150) + flame(172) + flame(218) + flame(240)
    + `<path d="M140 58Q195 86 250 58L244 54Q195 72 146 54Z" fill="url(#brass)"/><ellipse cx="195" cy="55" rx="52" ry="6" fill="#b8862f"/>`
    + `<path d="M191 54V26" stroke="url(#brass)" stroke-width="5"/><path d="M195 8C188 14 188 24 195 28C202 24 202 14 195 8Z" fill="url(#brass)"/><circle cx="195" cy="6" r="2.5" fill="#f6d58a"/>`
    + `<rect x="190" y="70" width="10" height="82" fill="url(#brass)"/>`
    + [86, 108, 130].map(y => `<ellipse cx="195" cy="${y}" rx="12" ry="5" fill="url(#brass)"/>`).join('')
    + `<path d="M150 182Q195 140 240 182Z" fill="url(#brass)"/><ellipse cx="195" cy="182" rx="56" ry="6" fill="#b8862f"/>`)
}

/** Silk saree border: magenta band, gold zari triangles, a green selvedge. */
const pattuBorder = () => {
  let tri = ''
  for (let x = 0; x < 390; x += 20) tri += `<path d="M${x} 58L${x + 10} 44L${x + 20} 58Z" fill="#d9a441"/>`
  let butta = ''
  for (let x = 15; x < 390; x += 30) butta += `<circle cx="${x}" cy="26" r="2.2" fill="#e8c06a"/><circle cx="${x + 15}" cy="20" r="1.3" fill="#e8c06a"/>`
  return `<rect width="390" height="6" fill="#1f6b45"/><rect y="6" width="390" height="52" fill="#a3195b"/><rect y="10" width="390" height="1.4" fill="#d9a441"/>${butta}<rect y="38" width="390" height="2" fill="#d9a441"/>${tri}<rect y="58" width="390" height="3" fill="#d9a441"/><rect y="64" width="390" height="1" fill="#a3195b" opacity="0.5"/>`
}

/** A rose: overlapping petal rings and a spiral heart. */
const rose = (x: number, y: number, r: number, c: string, d: string) =>
  `<g transform="translate(${x} ${y})"><circle r="${r}" fill="${c}"/>${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="${r1(-r * 0.55)}" rx="${r1(r * 0.55)}" ry="${r1(r * 0.42)}" fill="${c}" stroke="${d}" stroke-width="0.8" transform="rotate(${a})"/>`).join('')}<path d="M0 0m-2 0a2 2 0 1 1 4 0a4 4 0 1 1-8 0a6.5 6.5 0 1 1 13 0" fill="none" stroke="${d}" stroke-width="1.2" transform="scale(${r1(r / 12)})"/></g>`

const roseCorner = () => art(120, 120,
  leaf(44, 20, 30, 10, '#7a9a6a') + leaf(20, 46, 30, 80, '#7a9a6a') + leaf(60, 40, 24, 40, '#94b083') + leaf(40, 62, 22, 50, '#94b083')
  + rose(26, 26, 20, '#ec9aab', '#c25670') + rose(66, 18, 12, '#f6c3cd', '#d77a8e') + rose(18, 66, 12, '#f6c3cd', '#d77a8e') + flower(56, 56, 6, 5, '#ffffff', '#e8b04b'))

/** Paisley (mango) motif, two to a tile, in gold line. */
const paisleyTile = () => {
  const boteh = (x: number, y: number, a: number) => `<g transform="translate(${x} ${y}) rotate(${a})" fill="none" stroke="#b8862f" stroke-width="1.1"><path d="M0 16C-11 16 -14 4 -7 -3C-2 -8 5 -11 6 -19C11 -11 13 -2 10 7C8 12 5 16 0 16Z"/><path d="M0 10C-5 10 -7 4 -3 0C0 -3 3 -5 4 -9C6 -5 7 0 5 4C4 7 2 10 0 10Z"/><circle cx="-1" cy="5" r="1.4" fill="#b8862f" stroke="none"/></g>`
  return { svg: doc(72, 72, boteh(18, 20, -20) + boteh(54, 56, 160) + `<circle cx="54" cy="16" r="1.5" fill="#b8862f"/><circle cx="18" cy="56" r="1.5" fill="#b8862f"/>`), size: 72, opacity: 0.45, mask: 'edges' as const }
}

/** Crescent moon in a halo with a scatter of stars. */
const moonTop = () => {
  let stars = ''
  for (let i = 0; i < 18; i++) stars += sparkle(12 + rnd(i + 3) * 366, 10 + rnd(i + 31) * 150, 1.2 + rnd(i + 61) * 2.4, '#fff6d8', 0.4 + rnd(i + 5) * 0.5)
  return art(GRID, 170, `<defs><radialGradient id="h"><stop offset="0" stop-color="#fdf3c9" stop-opacity="0.35"/><stop offset="1" stop-color="#fdf3c9" stop-opacity="0"/></radialGradient><mask id="c"><rect width="390" height="170" fill="#fff"/><circle cx="214" cy="66" r="34" fill="#000"/></mask></defs>`
    + stars + `<circle cx="200" cy="74" r="90" fill="url(#h)"/><circle cx="200" cy="74" r="38" fill="#fdf3c9" mask="url(#c)"/>`)
}

const jasmineSprig = () => art(GRID, 70, mirror(`${leaf(186, 44, 18, 200, '#6f9a68')}${leaf(176, 40, 15, 165, '#88b07f')}${flower(150, 38, 8, 5, '#ffffff', '#f2d27a')}${flower(128, 46, 6, 5, '#ffffff', '#f2d27a')}<ellipse cx="110" cy="42" rx="2.4" ry="4" fill="#fffef6"/><line x1="40" y1="44" x2="100" y2="44" stroke="#f3dc9b" stroke-width="0.7" opacity="0.6"/>`) + flower(195, 40, 11, 5, '#ffffff', '#f2d27a'))

// ─── Overlay art ─────────────────────────────────────────────────────────────

/** A colour rangoli: rings of petals and dots. */
const rangoliArt = () => {
  const cols = ['#ff4d8d', '#ff9f1c', '#ffd166', '#2ec4b6', '#9b5de5', '#ffffff']
  let b = ''
  const rings: [number, number, number, number][] = [[176, 24, 26, 0], [140, 20, 22, 1], [104, 16, 18, 2], [70, 12, 14, 3], [40, 8, 10, 4]]
  for (const [r, n, len, ci] of rings) {
    for (let i = 0; i < n; i++) {
      const a = (i * 360) / n
      b += `<ellipse cx="0" cy="${-r}" rx="${r1(len * 0.34)}" ry="${len}" fill="${cols[ci]}" opacity="0.92" transform="rotate(${r1(a)})"/>`
      b += `<circle cx="0" cy="${-(r + len + 6)}" r="2.2" fill="${cols[(ci + 2) % cols.length]}" transform="rotate(${r1(a + 180 / n)})"/>`
    }
    b += `<circle r="${r - len - 2}" fill="none" stroke="${cols[(ci + 1) % cols.length]}" stroke-width="1.6" stroke-dasharray="2 5"/>`
  }
  return art(420, 420, `<g transform="translate(210 210)">${b}<circle r="18" fill="#ffd166"/><circle r="8" fill="#ff4d8d"/></g>`)
}

/** Stepped art-deco corner. */
const decoCorner = (c: string) => art(70, 70, `<path d="M4 66V4H66M12 66V12H66M20 50V20H50" fill="none" stroke="${c}" stroke-width="1.2"/><path d="M26 26h10v10h-10z" fill="${c}"/>`)

/** Deco fan crest above the names. */
const decoTop = (c: string) => {
  let fan = ''
  for (let i = 0; i <= 12; i++) { const a = Math.PI + (i * Math.PI) / 12; fan += `<line x1="195" y1="96" x2="${r1(195 + Math.cos(a) * 70)}" y2="${r1(96 + Math.sin(a) * 70)}"/>` }
  return art(GRID, 110, `<g stroke="${c}" stroke-width="1" fill="none">${fan}<path d="M125 96A70 70 0 0 1 265 96"/><path d="M145 96A50 50 0 0 1 245 96"/><line x1="30" y1="96" x2="115" y2="96"/><line x1="275" y1="96" x2="360" y2="96"/><line x1="50" y1="102" x2="340" y2="102"/></g>`)
}

/** A thin line with a centre diamond, for clean designs. */
const rule = (c: string, h = 40) => art(GRID, h, `<line x1="120" y1="${h / 2}" x2="183" y2="${h / 2}" stroke="${c}" stroke-width="0.8"/><line x1="207" y1="${h / 2}" x2="270" y2="${h / 2}" stroke="${c}" stroke-width="0.8"/><rect x="190" y="${h / 2 - 5}" width="10" height="10" fill="${c}" transform="rotate(45 195 ${h / 2})"/>`)

const empty = art(GRID, 1, '')

// ─── The designs ─────────────────────────────────────────────────────────────

const gold = { foil: ['#b8862f', '#f7dc97', '#d9a94e', '#fff0c4', '#a8791c'] }
const base = (o: Partial<ThemeStyle> & Pick<ThemeStyle, 'base' | 'tone' | 'ink' | 'muted' | 'accent' | 'onAccent' | 'name' | 'taName'>): ThemeStyle => ({
  layout: 'center', card: 'rgba(0,0,0,0.04)', line: 'rgba(0,0,0,0.16)', dark: false, qr: ['#111111', '#ffffff'], fx: 'none', fxColors: [], ...o,
})

/** The first ten designs, moved onto the layered model. */
function legacy(l: Legacy, extra: Partial<ThemeStyle> = {}): ThemeStyle {
  const { bg, top, bottom, ...rest } = l
  return { ...rest, base: bg.length === 1 ? bg[0] : `linear-gradient(180deg, ${bg.join(', ')})`, tone: bg[Math.floor(bg.length / 2)], top, bottom, layout: 'center', ...extra }
}

const DESIGNS: Record<InviteTheme, () => ThemeStyle> = {
  // Free
  ivory: () => legacy(ivory(), { name: { family: 'Cormorant Garamond', weight: 500, italic: true } }),
  jasmine: () => legacy(jasmine(), { name: { family: 'Italiana', weight: 400, italic: false } }),
  kolam: () => legacy(kolam(), { name: { family: 'Marcellus', weight: 400, italic: false }, taName: { family: 'Arima', weight: 500 } }),
  mono: () => base({
    base: '#0b0b0c', tone: '#0b0b0c', pattern: { ...grid('rgba(255,255,255,0.07)'), mask: 'top' }, layout: 'poster',
    ink: '#f5f5f2', muted: 'rgba(245,245,242,0.55)', accent: '#ffffff', onAccent: '#0b0b0c', card: 'rgba(255,255,255,0.05)', line: 'rgba(255,255,255,0.22)', dark: true,
    name: { family: 'Bodoni Moda', weight: 500, italic: true }, taName: { family: 'Hind Madurai', weight: 500 },
  }),
  marigold: () => legacy(marigold(), { name: { family: 'Yeseva One', weight: 400, italic: false } }),
  blush: () => base({
    base: '#f1d3cd', tone: '#f1d3cd', layout: 'poster', texture: 'paper',
    ink: '#4f1622', muted: 'rgba(79,22,34,0.6)', accent: '#9b3446', onAccent: '#fff4f1', card: 'rgba(155,52,70,0.07)', line: 'rgba(155,52,70,0.25)',
    name: { family: 'Playfair Display', weight: 500, italic: true }, taName: { family: 'Noto Serif Tamil', weight: 600 },
  }),
  turmeric: () => base({
    base: 'radial-gradient(90% 60% at 50% 42%, #ffdc55 0%, #f6bb18 58%, #e39d07 100%)', tone: '#f4b512', texture: 'paper',
    top: art(GRID, 86, kumkumBand()), bottom: art(GRID, 86, flipY(kumkumBand(), 86)), frame: { inset: 12, lines: 2, color: 'rgba(176,20,30,0.55)' },
    ink: '#5a0a0f', muted: 'rgba(90,10,15,0.66)', accent: '#b0141e', onAccent: '#fff4d6', card: 'rgba(255,255,255,0.3)', line: 'rgba(176,20,30,0.3)',
    name: { family: 'Yeseva One', weight: 400, italic: false }, taName: { family: 'Arima', weight: 700 },
  }),
  lamp: () => base({
    base: 'radial-gradient(75% 45% at 50% 14%, #9a3a1c 0%, #561317 52%, #2c070b 100%)', tone: '#561317', top: brassLamp(), bottom: rule('#e9bd6a', 50),
    ink: '#fbf0dc', muted: 'rgba(251,240,220,0.66)', accent: '#f0c36b', onAccent: '#3a0a0d', card: 'rgba(240,195,107,0.08)', line: 'rgba(240,195,107,0.3)', dark: true,
    qr: ['#3a0a0d', '#fbe7bd'], name: { family: 'Cormorant Garamond', weight: 600, italic: true }, taName: { family: 'Noto Serif Tamil', weight: 600 },
    fx: 'float', fxColors: ['#ffcf6b', '#ffe9b0'],
  }),
  pattu: () => base({
    base: '#fbf6ee', tone: '#fbf6ee', texture: 'paper', top: art(GRID, 70, pattuBorder()), bottom: art(GRID, 70, flipY(pattuBorder(), 70)),
    ink: '#3d0f24', muted: 'rgba(61,15,36,0.62)', accent: '#a3195b', onAccent: '#fff6ea', card: 'rgba(163,25,91,0.06)', line: 'rgba(163,25,91,0.25)',
    name: { family: 'Playfair Display', weight: 500, italic: true }, taName: { family: 'Noto Serif Tamil', weight: 600 },
  }),
  moonlit: () => base({
    base: 'linear-gradient(180deg, #08152f 0%, #12285a 55%, #1d3a70 100%)', tone: '#12285a', top: moonTop(), bottom: jasmineSprig(),
    ink: '#f4f1e8', muted: 'rgba(244,241,232,0.64)', accent: '#f3dc9b', onAccent: '#0a1a3a', card: 'rgba(255,255,255,0.06)', line: 'rgba(243,220,155,0.28)', dark: true,
    qr: ['#0a1a3a', '#fbf1d2'], name: { family: 'Italiana', weight: 400, italic: false }, taName: { family: 'Noto Serif Tamil', weight: 600 },
    fx: 'twinkle', fxColors: ['#fff8dc'],
  }),
  rose: () => base({
    base: 'linear-gradient(180deg, #fff8f6 0%, #fbe5e2 100%)', tone: '#fbeeec', texture: 'paper',
    frame: { inset: 14, lines: 1, color: 'rgba(194,86,112,0.35)', corner: roseCorner() },
    ink: '#5b2333', muted: 'rgba(91,35,51,0.6)', accent: '#c25670', onAccent: '#fff8f6', card: 'rgba(194,86,112,0.06)', line: 'rgba(194,86,112,0.25)',
    name: { family: 'Great Vibes', weight: 400, italic: false }, taName: { family: 'Kavivanar', weight: 400 },
  }),
  paisley: () => base({
    base: 'linear-gradient(180deg, #fdf8ef 0%, #f5ead5 100%)', tone: '#f8f0e0', pattern: paisleyTile(),
    frame: { inset: 12, lines: 2, color: 'rgba(168,121,28,0.5)' }, top: rule('#a8791c', 60), bottom: rule('#a8791c', 60),
    ink: '#3b2a12', muted: 'rgba(59,42,18,0.62)', accent: '#a8791c', onAccent: '#fffaf0', card: 'rgba(168,121,28,0.07)', line: 'rgba(168,121,28,0.28)',
    name: { family: 'Bodoni Moda', weight: 500, italic: false }, taName: { family: 'Noto Serif Tamil', weight: 600 },
  }),

  // Premium
  lantern: () => legacy(lantern(), { portrait: 'oval' }),
  kanjivaram: () => legacy(kanjivaram(), { portrait: 'arch', texture: 'silk' }),
  ruby: () => legacy(ruby(), { portrait: 'arch' }),
  banana: () => legacy(banana(), { portrait: 'circle' }),
  monsoon: () => legacy(monsoon(), { portrait: 'oval' }),
  peacock: () => base({
    base: 'radial-gradient(120% 70% at 50% 0%, #17a398 0%, transparent 55%), radial-gradient(110% 60% at 50% 100%, #1e3a8a 0%, transparent 60%), linear-gradient(180deg, #063f3a, #0b2c4a)', tone: '#0a4a47',
    pattern: peacockScales(), ink: '#fdf6e3', muted: 'rgba(253,246,227,0.66)', accent: '#e7c26a', onAccent: '#063f3a', card: 'rgba(255,255,255,0.06)', line: 'rgba(231,194,106,0.32)', dark: true,
    qr: ['#063f3a', '#f6e7bd'], name: { family: 'Cinzel', weight: 500, italic: false }, taName: { family: 'Noto Serif Tamil', weight: 600 },
    fx: 'twinkle', fxColors: ['#fff3c4', '#7ff0e0'], ...gold, portrait: 'oval',
  }),
  athangudi: () => base({
    base: '#f4e2c4', tone: '#b3261e', pattern: athangudi(), layout: 'card',
    panel: { bg: '#fbf4e6', radius: 14, border: '3px double #b3261e', shadow: '0 30px 60px -28px rgba(80,15,10,0.7)' },
    ink: '#3a1a10', muted: 'rgba(58,26,16,0.62)', accent: '#b3261e', onAccent: '#fbf4e6', line: 'rgba(179,38,30,0.3)',
    name: { family: 'Yeseva One', weight: 400, italic: false }, taName: { family: 'Arima', weight: 700 }, portrait: 'arch',
  }),
  sunburst: () => base({
    base: 'radial-gradient(circle at 50% 36%, rgba(255,255,255,0.35), transparent 40%), repeating-conic-gradient(from -4deg at 50% 36%, #ff2e63 0deg 8deg, #ff7a2e 8deg 16deg)', tone: '#ff4f48', layout: 'card',
    panel: { bg: '#fff6e9', radius: 30, shadow: '0 30px 60px -24px rgba(120,10,40,0.7)' },
    ink: '#4a0d22', muted: 'rgba(74,13,34,0.62)', accent: '#e8174f', onAccent: '#fff6e9', line: 'rgba(232,23,79,0.28)',
    name: { family: 'Abril Fatface', weight: 400, italic: false }, taName: { family: 'Arima', weight: 700 },
    fx: 'confetti', fxColors: ['#ffe14d', '#ffffff', '#3dd9ff', '#7c3aed'], portrait: 'circle',
  }),
  aurora: () => base({
    base: 'radial-gradient(60% 45% at 15% 15%, #7c3aed 0%, transparent 70%), radial-gradient(55% 40% at 90% 30%, #14b8a6 0%, transparent 70%), radial-gradient(70% 50% at 30% 95%, #ec4899 0%, transparent 70%), radial-gradient(50% 40% at 95% 90%, #f59e0b 0%, transparent 65%), #0b1020', tone: '#2a1650', layout: 'card',
    panel: { bg: 'rgba(255,255,255,0.13)', border: '1px solid rgba(255,255,255,0.3)', radius: 30, shadow: 'inset 0 1px 0 rgba(255,255,255,0.35), 0 30px 60px -30px rgba(0,0,0,0.7)' },
    ink: '#ffffff', muted: 'rgba(255,255,255,0.7)', accent: '#f5d0fe', onAccent: '#2a1650', card: 'rgba(255,255,255,0.1)', line: 'rgba(255,255,255,0.3)', dark: true,
    qr: ['#2a1650', '#ffffff'], name: { family: 'Fraunces', weight: 400, italic: true }, taName: { family: 'Noto Serif Tamil', weight: 600 },
    fx: 'float', fxColors: ['#ffffff', '#f5d0fe', '#a5f3fc'], foil: ['#fbcfe8', '#ffffff', '#a5f3fc', '#ffffff', '#f5d0fe'], portrait: 'oval',
  }),
  deco: () => base({
    base: 'radial-gradient(80% 50% at 50% 45%, #1c1a16 0%, #0b0b0d 70%)', tone: '#0b0b0d',
    pattern: { svg: scales(60, '#0b0b0d', '#d8b46a', 4, 0.9), size: 60, opacity: 0.3, mask: 'edges' },
    top: decoTop('#d8b46a'), bottom: rule('#d8b46a', 50), frame: { inset: 14, lines: 2, color: 'rgba(216,180,106,0.6)', corner: decoCorner('#d8b46a') },
    ink: '#f7efe0', muted: 'rgba(247,239,224,0.6)', accent: '#d8b46a', onAccent: '#0b0b0d', card: 'rgba(216,180,106,0.07)', line: 'rgba(216,180,106,0.32)', dark: true,
    qr: ['#0b0b0d', '#f1dfb0'], name: { family: 'Cinzel', weight: 500, italic: false }, taName: { family: 'Noto Serif Tamil', weight: 600 },
    fx: 'twinkle', fxColors: ['#f7dc97'], ...gold, portrait: 'arch',
  }),
  lotus: () => base({
    base: 'linear-gradient(180deg, #ffe3ec 0%, #f9b8cf 55%, #f08fb3 100%)', tone: '#f7a8c4', pattern: { ...lotusTile('#a3134f'), mask: 'edges' },
    ink: '#5a1238', muted: 'rgba(90,18,56,0.62)', accent: '#c2185b', onAccent: '#fff0f5', card: 'rgba(255,255,255,0.4)', line: 'rgba(194,24,91,0.28)',
    name: { family: 'Pinyon Script', weight: 400, italic: false }, taName: { family: 'Kavivanar', weight: 400 },
    fx: 'petals', fxColors: ['#ff8fb7', '#ffffff', '#ffc2d6'], portrait: 'circle',
  }),
  madras: () => base({
    base: '#c8102e', tone: '#c8102e', pattern: madras(), layout: 'card',
    panel: { bg: '#fffaf0', radius: 22, border: '2px solid #1d2f6f', shadow: '0 30px 60px -26px rgba(60,0,10,0.75)' },
    ink: '#2a0a0a', muted: 'rgba(42,10,10,0.62)', accent: '#c8102e', onAccent: '#fffaf0', line: 'rgba(29,47,111,0.28)',
    name: { family: 'DM Serif Display', weight: 400, italic: true }, taName: { family: 'Noto Serif Tamil', weight: 700 }, portrait: 'circle',
  }),
  terrazzo: () => base({
    base: '#f3eee6', tone: '#f3eee6', pattern: terrazzoTile(), layout: 'card',
    panel: { bg: 'rgba(243,238,230,0.93)', radius: 200, shadow: '0 0 0 1px rgba(38,70,83,0.15)' },
    ink: '#1f2f36', muted: 'rgba(31,47,54,0.6)', accent: '#e2603b', onAccent: '#ffffff', line: 'rgba(31,47,54,0.2)',
    name: { family: 'Syne', weight: 700, italic: false }, taName: { family: 'Catamaran', weight: 800 }, portrait: 'circle',
  }),
  seigaiha: () => base({
    base: 'linear-gradient(180deg, #0d4bb0 0%, #0b3d91 50%, #062a63 100%)', tone: '#0b3d91',
    pattern: { svg: scales(80, '#0b3d91', 'rgba(255,255,255,0.55)', 5, 1.1), size: 80, opacity: 0.4, mask: 'edges' },
    ink: '#f3f8ff', muted: 'rgba(243,248,255,0.68)', accent: '#9ed8ff', onAccent: '#062a63', card: 'rgba(255,255,255,0.08)', line: 'rgba(158,216,255,0.32)', dark: true,
    qr: ['#062a63', '#e6f4ff'], name: { family: 'Marcellus', weight: 400, italic: false }, taName: { family: 'Noto Serif Tamil', weight: 600 },
    fx: 'float', fxColors: ['#cfe8ff', '#ffffff'], foil: ['#a9d6ff', '#ffffff', '#cfe8ff', '#ffffff', '#8cc8ff'], portrait: 'oval',
  }),
  rangoli: () => base({
    base: 'radial-gradient(90% 60% at 50% 30%, #5b1170 0%, #2a0636 60%, #16031d 100%)', tone: '#3b0a45',
    overlay: { ...rangoliArt(), x: 50, y: 27, w: 128, opacity: 0.5 },
    ink: '#fff5e1', muted: 'rgba(255,245,225,0.68)', accent: '#ffd166', onAccent: '#2a0636', card: 'rgba(255,255,255,0.07)', line: 'rgba(255,209,102,0.32)', dark: true,
    qr: ['#2a0636', '#fff1c9'], name: { family: 'Yeseva One', weight: 400, italic: false }, taName: { family: 'Noto Serif Tamil', weight: 700 },
    fx: 'twinkle', fxColors: ['#ffd166', '#ff4d8d', '#2ec4b6'], foil: ['#ff9f1c', '#ffe7a3', '#ffd166', '#fff6d6', '#ff9f1c'], portrait: 'circle',
  }),
  emerald: () => base({
    base: 'radial-gradient(90% 60% at 50% 35%, #15704f 0%, #0c4a37 55%, #072e22 100%)', tone: '#0c4a37', pattern: { ...lattice('#e2c275'), mask: 'edges' }, texture: 'silk',
    frame: { inset: 12, lines: 2, color: 'rgba(226,194,117,0.55)' }, top: rule('#e2c275', 60), bottom: rule('#e2c275', 60),
    ink: '#f8f1dc', muted: 'rgba(248,241,220,0.66)', accent: '#e2c275', onAccent: '#072e22', card: 'rgba(226,194,117,0.07)', line: 'rgba(226,194,117,0.3)', dark: true,
    qr: ['#072e22', '#f4e6bf'], name: { family: 'Bodoni Moda', weight: 500, italic: true }, taName: { family: 'Noto Serif Tamil', weight: 600 },
    fx: 'petals', fxColors: ['#e2c275', '#f7e3a8'], ...gold, portrait: 'arch',
  }),
  confetti: () => base({
    base: '#ff3e8a', tone: '#ff3e8a', pattern: confettiTile(['#ffe14d', '#38e0ff', '#ffffff', '#7c3aed', '#00d68f']), layout: 'card',
    panel: { bg: '#ffffff', radius: 36, shadow: '10px 10px 0 #2a0b4a' },
    ink: '#2a0b4a', muted: 'rgba(42,11,74,0.6)', accent: '#ff3e8a', onAccent: '#ffffff', line: 'rgba(42,11,74,0.18)',
    name: { family: 'Unbounded', weight: 700, italic: false }, taName: { family: 'Catamaran', weight: 800 },
    fx: 'confetti', fxColors: ['#ffe14d', '#38e0ff', '#ffffff', '#7c3aed'], portrait: 'circle',
  }),
}

const cache = new Map<InviteTheme, ThemeStyle>()

/** The design's full style; built once per theme. Unknown ids get Classic Ivory. */
export function themeStyle(t: InviteTheme): ThemeStyle {
  const key = DESIGNS[t] ? t : 'ivory'
  let s = cache.get(key)
  if (!s) cache.set(key, (s = DESIGNS[key]()))
  return s
}

const urls = new Map<string, string>()
/** SVG markup as a data URL, for <img>, CSS backgrounds and the canvas. */
export function svgUrl(svg: string): string {
  let u = urls.get(svg)
  if (!u) urls.set(svg, (u = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`))
  return u
}
export const artUrl = (a: Art) => svgUrl(a.svg)

/** CSS gradient for foil text. */
export const foilCss = (stops: string[]) => `linear-gradient(100deg, ${stops.join(', ')})`

const TEXTURES = {
  // Fine paper grain, warm brown speckle.
  paper: doc(220, 220, '<filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.36 0 0 0 0 0.27 0 0 0 0 0.16 0 0 0 0.16 0"/></filter><rect width="220" height="220" filter="url(#n)"/>'),
  // Woven silk: two crossing hairline weaves in gold.
  silk: doc(12, 12, '<path d="M0 12L12 0M-3 3L3 -3M9 15L15 9" stroke="#f1d59a" stroke-width="0.6" opacity="0.16"/><path d="M0 0L12 12" stroke="#000" stroke-width="0.6" opacity="0.08"/>'),
}
/** The texture tile as a data URL. */
export const textureUrl = (k: 'paper' | 'silk') => svgUrl(TEXTURES[k])

/** Pattern masks: where the words sit, the pattern fades out. */
export const PATTERN_MASK: Record<NonNullable<Pattern['mask']>, string> = {
  edges: 'linear-gradient(180deg, #000 0%, rgba(0,0,0,0.55) 22%, transparent 40%, transparent 62%, rgba(0,0,0,0.55) 80%, #000 100%)',
  top: 'linear-gradient(180deg, #000 0%, transparent 55%)',
  bottom: 'linear-gradient(0deg, #000 0%, transparent 55%)',
}

/** Positions for the design's effect particles, as fractions of the screen. */
export function fxParticles(s: ThemeStyle) {
  const n = { petals: 14, twinkle: 18, rain: 26, confetti: 22, float: 16, sway: 0, none: 0 }[s.fx]
  return Array.from({ length: n }, (_, i) => ({
    x: rnd(i * 3 + 1),
    y: s.fx === 'twinkle' ? 0.03 + rnd(i * 3 + 2) * 0.94 : rnd(i * 3 + 2),
    size: s.fx === 'rain' ? 14 + rnd(i + 7) * 14 : s.fx === 'twinkle' ? 3 + rnd(i + 7) * 4 : s.fx === 'float' ? 4 + rnd(i + 7) * 8 : 7 + rnd(i + 7) * 6,
    rot: rnd(i + 13) * 360,
    dur: s.fx === 'rain' ? 1.1 + rnd(i + 17) * 0.9 : s.fx === 'twinkle' ? 2.2 + rnd(i + 17) * 2.5 : 9 + rnd(i + 17) * 7,
    delay: rnd(i + 23) * (s.fx === 'rain' ? 2 : 8),
    color: s.fxColors[i % Math.max(1, s.fxColors.length)] ?? '#ffffff',
  }))
}

// ─── Fonts ───────────────────────────────────────────────────────────────────

/** Google Fonts specs for the display faces only invites use (the site already loads Cormorant, Inter, Noto Serif Tamil, Hind Madurai and Arima). */
const FONT_SPECS: Record<string, string> = {
  'Playfair Display': 'Playfair+Display:ital,wght@0,400..900;1,400..900',
  'Great Vibes': 'Great+Vibes',
  'Allura': 'Allura',
  'Amiri': 'Amiri:wght@400;700',
  'Italiana': 'Italiana',
  'Bodoni Moda': 'Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900',
  'Abril Fatface': 'Abril+Fatface',
  'Syne': 'Syne:wght@400..800',
  'Marcellus': 'Marcellus',
  'Pinyon Script': 'Pinyon+Script',
  'DM Serif Display': 'DM+Serif+Display:ital@0;1',
  'Unbounded': 'Unbounded:wght@300..900',
  'Yeseva One': 'Yeseva+One',
  'Cinzel': 'Cinzel:wght@400..900',
  'Fraunces': 'Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900',
  'Anton': 'Anton',
  'Kavivanar': 'Kavivanar',
  'Catamaran': 'Catamaran:wght@300..900',
}

const loaded = new Map<string, Promise<void>>()
/** Loads the Google Fonts stylesheet for these families (once each); resolves when the faces are ready to draw. */
export function ensureFonts(families: string[]): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve()
  const need = families.filter(f => FONT_SPECS[f] && !loaded.has(f))
  if (need.length) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?${need.map(f => `family=${FONT_SPECS[f]}`).join('&')}&display=swap`
    const ready = new Promise<void>(res => { link.onload = () => res(); link.onerror = () => res() })
    document.head.appendChild(link)
    for (const f of need) loaded.set(f, ready.then(() => document.fonts.load(`400 40px "${f}"`, 'Aaதமிழ்').then(() => undefined, () => undefined)))
  }
  const wait = families.map(f => loaded.get(f)).filter(Boolean) as Promise<void>[]
  return Promise.all([...wait, ...families.filter(f => !FONT_SPECS[f]).map(f => document.fonts.load(`400 40px "${f}"`).then(() => undefined, () => undefined))]).then(() => undefined)
}
export const themeFonts = (s: ThemeStyle) => [s.name.family, s.taName.family]
