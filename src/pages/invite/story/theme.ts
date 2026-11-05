import type { InviteTheme } from '../../../lib/invite'
import { themeStyle, type ThemeStyle } from '../themes'

/*
 * The story invite (layout "story"): an opening ritual (doors, an arch, silk
 * curtains, a gatefold or a sealed envelope) gives way to a scrolling page:
 * invocation and names, scratch-to-reveal date and countdown, the functions on
 * a timeline, the venue, RSVP and a closing blessing. Eleven designs are drawn
 * for it here; every other theme borrows its colours and fonts from
 * `themes.ts` and opens from an envelope.
 *
 * `art` holds optional painted assets (generated outside the app and dropped
 * into /public/invite/<theme>/). With none, everything is drawn in SVG and CSS,
 * so a design is complete before its art arrives. Kept free of React.
 */

export type OpenerKind = 'doors' | 'arch' | 'curtains' | 'strings' | 'gates' | 'envelope'
export type Bloom = 'lotus' | 'rose' | 'marigold' | 'jasmine' | 'bougainvillea' | 'peony'
export type Finale = 'lanterns' | 'petals' | 'stars' | 'diyas' | 'confetti'
export type GatePattern = 'lotus' | 'peacock' | 'kolam' | 'none'

export interface StoryArt {
  /** Still of the closed opener, 9:16. Doors and gates are cut down the middle from it. */
  opener?: string
  /** Short clip of the opener opening (played on tap instead of the CSS animation), 9:16, muted. */
  openerVideo?: string
  /** Painted floral frame with an empty centre, 9:16; sits behind the names. */
  frame?: string
  /** Painted venue, 4:3. */
  venue?: string
}

export interface StoryTheme {
  id: InviteTheme
  opener: OpenerKind
  /** Page background (any CSS background). */
  bg: string
  /** Paper of the cards on the page. */
  paper: string
  ink: string
  muted: string
  accent: string
  onAccent: string
  line: string
  dark: boolean
  /** The opener's material: [base, shadow, highlight]. */
  shell: [string, string, string]
  /** Brass / zari / gold trim. */
  trim: string
  /** Wax seal or medallion. */
  seal: string
  gate: GatePattern
  blooms: Bloom[]
  /** Petal colours for the blooms: [outer, inner, heart]. */
  petal: [string, string, string]
  leaf: string
  finale: Finale
  fx: string[]
  /** Names. */
  script: string
  /** Headings and small caps. */
  serif: string
  ta: string
  art: StoryArt
}

/** Painted assets as they arrive: `ASSETS.lotus = { frame: '/invite/lotus/frame.webp' }`. */
const ASSETS: Partial<Record<InviteTheme, StoryArt>> = {}

type Drawn = Omit<StoryTheme, 'id' | 'art'>

const GOLD = '#d4a64a'

const DRAWN: Partial<Record<InviteTheme, Drawn>> = {
  athangudi: {
    opener: 'doors', gate: 'none',
    bg: 'linear-gradient(180deg, #f6ead6 0%, #f1dfc2 100%)', paper: '#fbf3e4',
    ink: '#3b1f12', muted: 'rgba(59,31,18,0.66)', accent: '#a5432a', onAccent: '#fff6e8', line: 'rgba(120,64,30,0.28)', dark: false,
    shell: ['#6b3a1e', '#3b1f12', '#94582f'], trim: '#d9a24a', seal: '#a5432a',
    blooms: ['marigold', 'jasmine'], petal: ['#f29a1f', '#ffc04a', '#b5520d'], leaf: '#4f7a3a',
    finale: 'diyas', fx: ['#f29a1f', '#ffc04a', '#fff6e8'],
    script: 'Great Vibes', serif: 'Cinzel', ta: 'Kavivanar',
  },
  kanjivaram: {
    opener: 'curtains', gate: 'none',
    bg: 'radial-gradient(120% 70% at 50% 0%, #7a1440 0%, #4a0a24 60%, #2c0515 100%)', paper: 'rgba(255,240,226,0.06)',
    ink: '#fbe9d0', muted: 'rgba(251,233,208,0.7)', accent: '#e2b450', onAccent: '#3a0618', line: 'rgba(226,180,80,0.35)', dark: true,
    shell: ['#a3134f', '#5a0d2c', '#d1306f'], trim: '#e2b450', seal: '#e2b450',
    blooms: ['jasmine', 'rose'], petal: ['#fff7ec', '#f6dccb', '#e2b450'], leaf: '#2f6b47',
    finale: 'petals', fx: ['#e2b450', '#fff1d6', '#d1306f'],
    script: 'Pinyon Script', serif: 'Cinzel', ta: 'Noto Serif Tamil',
  },
  lotus: {
    opener: 'gates', gate: 'lotus',
    bg: 'linear-gradient(180deg, #fff6f4 0%, #fbe7ea 100%)', paper: '#fffaf8',
    ink: '#5b1830', muted: 'rgba(91,24,48,0.64)', accent: '#c2476b', onAccent: '#fff', line: 'rgba(194,71,107,0.28)', dark: false,
    shell: ['#f7d3dc', '#e6a9b9', '#fff0f3'], trim: '#c9a052', seal: '#c9a052',
    blooms: ['lotus', 'peony'], petal: ['#f37a9e', '#ffd0dd', '#f2c14e'], leaf: '#4f8a5b',
    finale: 'petals', fx: ['#f37a9e', '#ffd0dd', '#ffffff'],
    script: 'Great Vibes', serif: 'Cormorant Garamond', ta: 'Kavivanar',
  },
  ruby: {
    opener: 'arch', gate: 'none',
    bg: 'linear-gradient(180deg, #fdf3e8 0%, #f6e3cf 100%)', paper: '#fffaf2',
    ink: '#4a0a16', muted: 'rgba(74,10,22,0.64)', accent: '#9e1631', onAccent: '#fff4e6', line: 'rgba(158,22,49,0.25)', dark: false,
    shell: ['#2f6f86', '#1c4a5c', '#4d93ab'], trim: '#e8b86a', seal: '#9e1631',
    blooms: ['bougainvillea', 'rose'], petal: ['#d9327a', '#f27aa9', '#f6e3a0'], leaf: '#3f7a46',
    finale: 'petals', fx: ['#d9327a', '#f27aa9', '#e8b86a'],
    script: 'Pinyon Script', serif: 'Playfair Display', ta: 'Noto Serif Tamil',
  },
  moonlit: {
    opener: 'envelope', gate: 'none',
    bg: 'radial-gradient(120% 80% at 50% 0%, #1d2a5a 0%, #0f1733 55%, #070b1c 100%)', paper: 'rgba(231,226,207,0.05)',
    ink: '#f3efe2', muted: 'rgba(243,239,226,0.68)', accent: '#e7d9a8', onAccent: '#0f1733', line: 'rgba(231,217,168,0.3)', dark: true,
    shell: ['#18234a', '#0b1230', '#2a3a72'], trim: '#c9c3a8', seal: '#e9e4d2',
    blooms: ['jasmine'], petal: ['#fbfaf4', '#ece8da', '#e7c76a'], leaf: '#3d6b55',
    finale: 'stars', fx: ['#ffffff', '#e7d9a8', '#cbd5ff'],
    script: 'Great Vibes', serif: 'Cormorant Garamond', ta: 'Noto Serif Tamil',
  },
  kolam: {
    opener: 'gates', gate: 'kolam',
    bg: 'linear-gradient(180deg, #faf4ea 0%, #f2e6d3 100%)', paper: '#fffbf4',
    ink: '#4a1a10', muted: 'rgba(74,26,16,0.64)', accent: '#a8321f', onAccent: '#fff8ee', line: 'rgba(168,50,31,0.26)', dark: false,
    shell: ['#9a3220', '#6e2015', '#b8452f'], trim: '#f6efe2', seal: '#f6efe2',
    blooms: ['marigold', 'jasmine'], petal: ['#f4a21c', '#ffd25e', '#a8321f'], leaf: '#4c7a3c',
    finale: 'diyas', fx: ['#f4a21c', '#ffffff', '#a8321f'],
    script: 'Great Vibes', serif: 'Marcellus', ta: 'Arima',
  },
  marigold: {
    opener: 'strings', gate: 'none',
    bg: 'linear-gradient(180deg, #fff3d6 0%, #ffe3a8 100%)', paper: '#fffaf0',
    ink: '#5a1a08', muted: 'rgba(90,26,8,0.66)', accent: '#c24a12', onAccent: '#fff8ea', line: 'rgba(194,74,18,0.28)', dark: false,
    shell: ['#f6a21a', '#d9780d', '#ffc94a'], trim: '#c24a12', seal: '#c24a12',
    blooms: ['marigold', 'rose'], petal: ['#f59a12', '#ffcb3d', '#c2410c'], leaf: '#3f7a2e',
    finale: 'petals', fx: ['#f59a12', '#ffcb3d', '#e2363a'],
    script: 'Allura', serif: 'Cinzel', ta: 'Kavivanar',
  },
  peacock: {
    opener: 'gates', gate: 'peacock',
    bg: 'radial-gradient(120% 75% at 50% 0%, #0b4c50 0%, #06363a 55%, #03211f 100%)', paper: 'rgba(214,178,94,0.06)',
    ink: '#f6edd2', muted: 'rgba(246,237,210,0.7)', accent: '#d6b25e', onAccent: '#06363a', line: 'rgba(214,178,94,0.32)', dark: true,
    shell: ['#0c5a5e', '#06363a', '#178a86'], trim: '#d6b25e', seal: '#1f4fa3',
    blooms: ['lotus', 'rose'], petal: ['#f2a7b8', '#ffe2e8', '#d6b25e'], leaf: '#2c7a55',
    finale: 'lanterns', fx: ['#d6b25e', '#5fd1c3', '#ffffff'],
    script: 'Pinyon Script', serif: 'Cinzel', ta: 'Noto Serif Tamil',
  },
  emerald: {
    opener: 'arch', gate: 'none',
    bg: 'linear-gradient(180deg, #e7f4f1 0%, #cfe9e4 100%)', paper: '#f7fcfa',
    ink: '#0d3b3e', muted: 'rgba(13,59,62,0.66)', accent: '#0f6b6f', onAccent: '#f2ead3', line: 'rgba(15,107,111,0.26)', dark: false,
    shell: ['#2a9a98', '#126b6b', '#5cc2bc'], trim: '#c9a85a', seal: '#c9a85a',
    blooms: ['rose', 'jasmine'], petal: ['#ffffff', '#eef2ee', '#e9d79a'], leaf: '#5a8f6a',
    finale: 'lanterns', fx: ['#c9a85a', '#ffffff', '#5cc2bc'],
    script: 'Great Vibes', serif: 'Cormorant Garamond', ta: 'Noto Serif Tamil',
  },
  rangoli: {
    opener: 'envelope', gate: 'none',
    bg: 'linear-gradient(180deg, #fff6e6 0%, #ffe9c7 100%)', paper: '#fffbf3',
    ink: '#3d0d3a', muted: 'rgba(61,13,58,0.64)', accent: '#d4306a', onAccent: '#fff', line: 'rgba(212,48,106,0.25)', dark: false,
    shell: ['#d4306a', '#9c1f4c', '#f05a8e'], trim: '#ffb81c', seal: '#ffb81c',
    blooms: ['marigold', 'peony'], petal: ['#ff7a1a', '#ffd23f', '#d4306a'], leaf: '#2f8a5a',
    finale: 'confetti', fx: ['#ff7a1a', '#ffd23f', '#d4306a', '#2bb3a6', '#7c3aed'],
    script: 'Allura', serif: 'Playfair Display', ta: 'Kavivanar',
  },
  lamp: {
    opener: 'doors', gate: 'none',
    bg: 'radial-gradient(120% 75% at 50% 0%, #4a250c 0%, #2a1406 55%, #150a03 100%)', paper: 'rgba(240,181,69,0.06)',
    ink: '#fbecd0', muted: 'rgba(251,236,208,0.7)', accent: '#f0b545', onAccent: '#2a1406', line: 'rgba(240,181,69,0.32)', dark: true,
    shell: ['#5a3214', '#2e180a', '#7d4a22'], trim: '#e8b04a', seal: '#e8b04a',
    blooms: ['jasmine', 'marigold'], petal: ['#fffaf0', '#f3e7cf', GOLD], leaf: '#4f7a3a',
    finale: 'diyas', fx: ['#f0b545', '#ffd98a', '#ff9a3c'],
    script: 'Pinyon Script', serif: 'Cinzel', ta: 'Noto Serif Tamil',
  },
}

/** Designs drawn for the story page (the old "3D" set). */
export const STORY_THEMES = Object.keys(DRAWN) as InviteTheme[]
export const isStoryTheme = (t: InviteTheme) => t in DRAWN

const FINALE: Record<ThemeStyle['fx'], Finale> = {
  petals: 'petals', twinkle: 'stars', rain: 'stars', sway: 'petals', confetti: 'confetti', float: 'lanterns', none: 'petals',
}

/** Any other theme on the story page: its own colours and fonts, an envelope opener. */
function fromClassic(id: InviteTheme): Drawn {
  const s = themeStyle(id)
  return {
    opener: 'envelope', gate: 'none',
    bg: s.base, paper: s.dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.72)',
    ink: s.ink, muted: s.muted, accent: s.accent, onAccent: s.onAccent, line: s.line, dark: s.dark,
    shell: [s.tone, shade(s.tone, -0.28), shade(s.tone, 0.18)], trim: s.accent, seal: s.accent,
    blooms: ['jasmine', 'rose'], petal: [s.fxColors[0] ?? '#ffffff', s.fxColors[1] ?? '#f6e7da', s.accent], leaf: '#5a8a5a',
    finale: FINALE[s.fx], fx: s.fxColors.length ? s.fxColors : [s.accent],
    script: s.name.family, serif: 'Cormorant Garamond', ta: s.taName.family,
  }
}

const cache = new Map<InviteTheme, StoryTheme>()

export function storyTheme(id: InviteTheme): StoryTheme {
  let t = cache.get(id)
  if (!t) cache.set(id, (t = { ...(DRAWN[id] ?? fromClassic(id)), id, art: ASSETS[id] ?? {} }))
  return t
}

export const storyFonts = (t: StoryTheme) => [t.script, t.serif, t.ta]

/** The sheets (map, fortune, share) are drawn by the classic page; they get this theme's colours. */
export function sheetStyle(t: StoryTheme): ThemeStyle {
  const base = themeStyle(t.id)
  return { ...base, base: t.dark ? '#120d0a' : '#fffaf4', ink: t.ink, muted: t.muted, accent: t.accent, onAccent: t.onAccent, line: t.line, dark: t.dark, card: t.paper, layout: 'center', panel: undefined, split: undefined }
}

/** #rrggbb lightened (+) or darkened (−) by a fraction. */
export function shade(hex: string, k: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return hex
  const n = parseInt(m[1], 16)
  const ch = (v: number) => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)
  const r = ch(n >> 16), g = ch((n >> 8) & 255), b = ch(n & 255)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}
