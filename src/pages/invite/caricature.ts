/*
 * The stock caricature: a hand-drawn Tamil bride and groom, big heads, small
 * shoulders, leaning in. Premium invites show it until the couple's own
 * caricature arrives (drawn by the studio, or made from a photo with Gemini),
 * so a premium invite is never without its hero. Plain SVG string, so the page
 * and the PNG export draw the same thing. Transparent background: the theme's
 * frame supplies the backdrop.
 */

const SKIN_G = '#b47450'
const SKIN_B = '#c98a62'
const HAIR = '#1d1411'
const GOLD = '#d6a640'
const LINE = '#5a3324'

const groom = `
<g transform="rotate(5 104 170)">
  <path d="M22 300C26 250 58 228 104 224C150 228 178 248 184 300Z" fill="#fbf7ee" stroke="#e6dccb" stroke-width="1.5"/>
  <path d="M84 226L104 252L124 226" fill="none" stroke="#e6dccb" stroke-width="2"/>
  <path d="M40 252C70 262 120 288 150 300L120 300C96 286 62 270 34 266Z" fill="#fffdf6"/>
  <path d="M40 252C70 262 120 288 150 300" fill="none" stroke="${GOLD}" stroke-width="4"/>
  <path d="M36 262C64 272 104 290 124 300" fill="none" stroke="${GOLD}" stroke-width="1.6"/>
  <path d="M90 196H118V230C110 236 98 236 90 230Z" fill="${SKIN_G}"/>
  <ellipse cx="56" cy="166" rx="9" ry="13" fill="${SKIN_G}"/>
  <ellipse cx="152" cy="166" rx="9" ry="13" fill="${SKIN_G}"/>
  <ellipse cx="104" cy="160" rx="48" ry="54" fill="${SKIN_G}"/>
  <path d="M55 158C50 100 92 88 116 94C146 98 160 124 154 160C150 138 140 122 120 118C108 128 84 126 70 122C62 132 58 144 55 158Z" fill="${HAIR}"/>
  <path d="M74 146Q86 138 96 146" fill="none" stroke="${HAIR}" stroke-width="4" stroke-linecap="round"/>
  <path d="M112 146Q122 138 134 146" fill="none" stroke="${HAIR}" stroke-width="4" stroke-linecap="round"/>
  <ellipse cx="86" cy="160" rx="5" ry="6.5" fill="${HAIR}"/>
  <ellipse cx="122" cy="160" rx="5" ry="6.5" fill="${HAIR}"/>
  <circle cx="88" cy="158" r="1.8" fill="#fff"/>
  <circle cx="124" cy="158" r="1.8" fill="#fff"/>
  <path d="M104 162Q110 176 102 180" fill="none" stroke="${LINE}" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M80 190C90 182 100 186 104 188C108 186 118 182 128 190C120 194 110 192 104 190C98 192 88 194 80 190Z" fill="${HAIR}"/>
  <path d="M90 198Q104 210 118 198" fill="#fff" stroke="${LINE}" stroke-width="2" stroke-linecap="round"/>
  <ellipse cx="74" cy="182" rx="7" ry="4" fill="#e0805e" opacity="0.35"/>
  <ellipse cx="134" cy="182" rx="7" ry="4" fill="#e0805e" opacity="0.35"/>
  <path d="M104 124V136" stroke="#f3d9a4" stroke-width="3" stroke-linecap="round"/>
  <circle cx="104" cy="133" r="2.6" fill="#c0262d"/>
</g>`

const jasmine = (() => {
  let s = ''
  for (let i = 0; i < 9; i++) {
    const a = -1.2 + (i * 2.4) / 8
    s += `<circle cx="${(238 + Math.cos(a) * 24).toFixed(1)}" cy="${(136 + Math.sin(a) * 24).toFixed(1)}" r="4.6" fill="#fffef6" stroke="#d9dccb" stroke-width="1"/>`
  }
  return s
})()

const coins = (() => {
  let s = ''
  for (let i = 0; i < 9; i++) {
    const t = i / 8
    const x = 168 + t * 60
    const y = 236 + Math.sin(t * Math.PI) * 26
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.2" fill="${GOLD}" stroke="#a8791c" stroke-width="1"/>`
  }
  return s
})()

const bride = `
<g transform="rotate(-6 198 170)">
  <path d="M112 300C118 250 152 228 198 224C244 228 274 250 280 300Z" fill="#8e1630"/>
  <path d="M150 236C190 252 238 282 258 300L226 300C204 282 168 262 142 252Z" fill="#a51d3a"/>
  <path d="M150 236C190 252 238 282 258 300" fill="none" stroke="${GOLD}" stroke-width="6"/>
  <path d="M142 252C168 262 204 282 226 300" fill="none" stroke="${GOLD}" stroke-width="2.4"/>
  <path d="M184 196H212V230C204 236 192 236 184 230Z" fill="${SKIN_B}"/>
  <path d="M168 226Q198 262 228 226" fill="none" stroke="${GOLD}" stroke-width="3"/>
  ${coins}
  <path d="M198 262l-7 10 7 12 7-12Z" fill="#c0262d" stroke="${GOLD}" stroke-width="2"/>
  <circle cx="238" cy="136" r="22" fill="${HAIR}"/>
  ${jasmine}
  <path d="M148 168C140 108 176 92 200 94C230 94 258 112 250 168Z" fill="${HAIR}"/>
  <ellipse cx="198" cy="160" rx="45" ry="51" fill="${SKIN_B}"/>
  <path d="M152 160C150 112 178 100 198 102C222 100 248 114 244 160C236 132 214 120 199 120C186 120 160 130 152 160Z" fill="${HAIR}"/>
  <path d="M198 102V122" stroke="#c0262d" stroke-width="2.4"/>
  <path d="M198 104V124" stroke="${GOLD}" stroke-width="1.2"/>
  <circle cx="198" cy="128" r="4.5" fill="${GOLD}" stroke="#a8791c" stroke-width="1"/>
  <circle cx="198" cy="128" r="1.8" fill="#c0262d"/>
  <circle cx="198" cy="142" r="3.4" fill="#c0262d"/>
  <path d="M170 146Q180 141 190 146" fill="none" stroke="${HAIR}" stroke-width="3" stroke-linecap="round"/>
  <path d="M206 146Q216 141 226 146" fill="none" stroke="${HAIR}" stroke-width="3" stroke-linecap="round"/>
  <path d="M170 160Q180 152 190 160Q180 166 170 160Z" fill="${HAIR}"/>
  <path d="M206 160Q216 152 226 160Q216 166 206 160Z" fill="${HAIR}"/>
  <path d="M168 158L163 154M228 158L233 154" stroke="${HAIR}" stroke-width="2" stroke-linecap="round"/>
  <path d="M198 164Q203 174 196 178" fill="none" stroke="${LINE}" stroke-width="2" stroke-linecap="round"/>
  <circle cx="206" cy="177" r="4" fill="none" stroke="${GOLD}" stroke-width="1.8"/>
  <path d="M186 192Q198 202 210 192" fill="#c43a4a" stroke="#8e1630" stroke-width="1.6" stroke-linecap="round"/>
  <ellipse cx="172" cy="180" rx="7" ry="4" fill="#e8746b" opacity="0.4"/>
  <ellipse cx="224" cy="180" rx="7" ry="4" fill="#e8746b" opacity="0.4"/>
  <path d="M152 172q-4 10 2 16h6q6-6 2-16Z" fill="${GOLD}"/>
  <circle cx="155" cy="192" r="1.6" fill="${GOLD}"/><circle cx="160" cy="193" r="1.6" fill="${GOLD}"/>
  <path d="M244 172q4 10-2 16h-6q-6-6-2-16Z" fill="${GOLD}"/>
  <circle cx="241" cy="192" r="1.6" fill="${GOLD}"/><circle cx="236" cy="193" r="1.6" fill="${GOLD}"/>
</g>`

/** Hearts drifting up between the two, in the theme accent. */
const hearts = (accent: string) =>
  [[150, 92, 1], [138, 70, 0.7], [162, 58, 0.55]].map(([x, y, k]) =>
    `<path d="M0 4C-6-4-14 2-8 9L0 16L8 9C14 2 6-4 0 4Z" fill="${accent}" transform="translate(${x} ${y}) scale(${k})"/>`).join('')

/** The stock couple as an SVG document, 300 × 300. */
export const coupleSvg = (accent = '#c0262d') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">${hearts(accent)}${groom}${bride}</svg>`

const cache = new Map<string, string>()
/** The stock couple as a data URL, for <img> and the canvas. */
export function coupleUrl(accent?: string): string {
  const k = accent ?? ''
  let u = cache.get(k)
  if (!u) cache.set(k, (u = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(coupleSvg(accent))}`))
  return u
}
