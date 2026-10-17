import type { CatalogueId, FixedTier } from '../../lib/catalogue'

/*
 * Local rule-based intent parser for the voice cart assistant (English + Tamil).
 * It is the stand-in for Gemini: see VoiceAssistant.tsx `handle()` for where the
 * Gemini function-calling request replaces `parseIntents`. The Intent shape below
 * doubles as the function/tool schema to give Gemini.
 */

export type Intent =
  | { kind: 'item'; id: CatalogueId; op: 'add' | 'remove'; qty?: number }
  | { kind: 'tier'; tier: FixedTier | 'custom' }
  | { kind: 'sessions'; sessions: number }
  | { kind: 'sessionsDelta'; delta: number }
  | { kind: 'clearExtras' }
  | { kind: 'total' }
  | { kind: 'help' }
  | { kind: 'greet' }
  | { kind: 'next' }

interface Matcher {
  /** English patterns, matched on word boundaries. */
  en: RegExp
  /** Tamil stems, matched as substrings (JS \b does not work for Tamil script). */
  ta: string[]
}

const hit = (text: string, m: Matcher) => m.en.test(text) || m.ta.some(s => text.includes(s))

/** Spoken names → catalogue items. Order matters: more specific phrases first. */
const ITEM_MATCH: [CatalogueId, Matcher][] = [
  ['candid_video', { en: /\b(candid (video|videograph\w*|film|cinemat\w*)|cinematic|highlight film)\b/, ta: ['கேண்டிட் வீடியோ', 'சினிமா'] }],
  ['candid_photo', { en: /\b(candid( photo\w*| camera)?)\b/, ta: ['கேண்டிட்'] }],
  ['trad_video', { en: /\b((traditional |trad )?video\w*)\b/, ta: ['வீடியோ'] }],
  ['trad_photo', { en: /\b((traditional |trad )?photograph\w*|photographer)\b/, ta: ['புகைப்படக் கலைஞர்', 'போட்டோகிராபர்'] }],
  ['drone', { en: /\b(drones?|aerial)\b/, ta: ['ட்ரோன', 'டிரோன', 'ட்ரோண', 'வான்வழி'] }],
  ['ledwall', { en: /\b(led|l e d|big screen|live screen|screen|live wall)\b/, ta: ['எல்இடி', 'எல் இ டி', 'எல்.இ.டி', 'திரை'] }],
  ['einvite', { en: /\b(e[\s-]?invite|invitation|invite)\b/, ta: ['அழைப்பிதழ', 'இன்வைட'] }],
  ['selfie360', { en: /\b(360|three sixty|selfie booth|spinner)\b/, ta: ['360', 'செல்ஃபி', 'செல்பி'] }],
  ['photobooth', { en: /\b(photo ?booth|booth|instant prints?)\b/, ta: ['பூத', 'உடனடி அச்சு', 'உடனடி பிரிண்ட'] }],
  ['magazine', { en: /\b(magazines?)\b/, ta: ['மேகசின', 'மாகசின', 'இதழ'] }],
  ['minibook', { en: /\b(mini ?books?|mini ?albums?|parents?'? (copy|album))\b/, ta: ['மினி', 'சிறிய ஆல்பம', 'பெற்றோர்'] }],
  ['calendar', { en: /\b(calendars?)\b/, ta: ['காலண்டர', 'நாட்காட்டி'] }],
  ['frame_16x24', { en: /\b(frames?|framed)\b/, ta: ['பிரேம', 'ஃப்ரேம', 'சட்டம'] }],
  ['album_30', { en: /\b(albums?|hard ?cop(y|ies))\b/, ta: ['ஆல்பம', 'ஆல்பத்த', 'ஆல்பங்க'] }],
  ['prepost_wedding', { en: /\b(pre[\s-]?shoot|pre[\s-]?wedding|post[\s-]?wedding|couple shoot)\b/, ta: ['ப்ரீ ஷூட', 'ப்ரீஷூட', 'ப்ரீ வெட்டிங', 'முன் படப்பிடிப்ப', 'ஜோடி'] }],
]

/** Album sheet counts spoken with the word album. */
const ALBUM_SHEETS: [RegExp, CatalogueId][] = [
  [/\b(25|twenty[\s-]?five)\b/, 'album_25'], [/\b(30|thirty)\b/, 'album_30'], [/\b(35|thirty[\s-]?five)\b/, 'album_35'],
  [/\b(40|forty)\b/, 'album_40'], [/\b(50|fifty)\b/, 'album_50'], [/\b(60|sixty)\b/, 'album_60'],
]

const TIER_MATCH: Record<FixedTier | 'custom', Matcher> = {
  basic: { en: /\b(basic|essential|simple|cheapest|silver)\b/, ta: ['பேசிக', 'அடிப்படை', 'எளிய', 'சில்வர'] },
  standard: { en: /\b(standard|signature|popular|gold)\b/, ta: ['ஸ்டாண்டர்ட', 'நிலையான', 'பிரபல', 'கோல்ட'] },
  premium: { en: /\b(premium|heirloom|luxury|full package|diamond|top)\b/, ta: ['பிரீமியம', 'பரம்பரை', 'பொக்கிஷ', 'டைமண்ட'] },
  custom: { en: /\b(custom|customi[sz]e|my own|build my own)\b/, ta: ['தனிப்பயன', 'கஸ்டம'] },
}

const REMOVE: Matcher = {
  en: /\b(remove|delete|drop|cancel|without|skip|no|don'?t|do not|take (it )?(off|out)|exclude|minus|not needed)\b/,
  ta: ['வேண்டாம்', 'வேணாம்', 'நீக்கு', 'நீக்க', 'எடுத்துவிடு', 'எடுத்து விடு', 'தவிர்', 'ரத்து', 'இல்லாமல்'],
}
const ADD: Matcher = {
  en: /\b(add|include|want|need|with|plus|put|get|yes|keep|another|one more|extra)\b/,
  ta: ['சேர்', 'வேண்டும்', 'வேணும்', 'போடு', 'வைக்க', 'வையுங்கள்', 'இன்னொரு', 'கூடுதல்'],
}
const CLEAR: Matcher = {
  en: /\b((remove|clear|drop) (all|every ?thing)|(remove|clear|no) (the )?(add[\s-]?ons|extras))\b/,
  ta: ['அனைத்தையும் நீக்கு', 'எல்லாவற்றையும் நீக்கு', 'எல்லாம் வேண்டாம்', 'எதுவும் வேண்டாம்', 'எல்லாத்தையும் நீக்கு'],
}
const TOTAL: Matcher = {
  en: /\b(total|price|cost|how much|quote|amount|budget|summary|my cart|what'?s in)\b/,
  ta: ['எவ்வளவு', 'மொத்த', 'விலை', 'கட்டணம்', 'தொகை', 'செலவு', 'பட்டியல்', 'சுருக்கம்', 'என்ன இருக்கு'],
}
const HELP: Matcher = { en: /\b(help|what can you|options|how does this work|what can i say)\b/, ta: ['உதவி', 'என்ன சொல்ல', 'எப்படி'] }
const GREET: Matcher = { en: /\b(hi|hello|hey|vanakkam|good (morning|evening|afternoon))\b/, ta: ['வணக்கம்'] }
const NEXT: Matcher = { en: /\b(next|continue|proceed|checkout|check out|done|that'?s all|book it)\b/, ta: ['அடுத்து', 'தொடர', 'முடிந்தது', 'போதும்', 'பதிவு செய்'] }
const MORE_SESSION: Matcher = { en: /\b((one|an|1) (more|extra) session|extra session|add (a |one )?session|second session|two sessions)\b/, ta: ['இன்னொரு அமர்வு', 'கூடுதல் அமர்வு', 'இரண்டு அமர்வு'] }
const LESS_SESSION: Matcher = { en: /\b((one|a|1) (less|fewer) session|reduce (a |one )?session|single session|one session)\b/, ta: ['ஒரு அமர்வு', 'அமர்வு குறை'] }

const EN_NUM: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 }
const TA_NUM: [string, number][] = [
  ['ஒன்று', 1], ['ஒரு', 1], ['இரண்டு', 2], ['ரெண்டு', 2], ['மூன்று', 3], ['மூணு', 3], ['நான்கு', 4], ['நாலு', 4], ['ஐந்து', 5], ['அஞ்சு', 5],
]

function parseSessions(text: string): number | null {
  const digits = text.match(/(\d)\s*(?:sessions?|அமர்வு)/)
  if (digits) return Number(digits[1])
  const en = text.match(/\b(one|two|three|four)\s*sessions?\b/)
  if (en) return EN_NUM[en[1]]
  for (const [word, n] of TA_NUM) {
    const i = text.indexOf(word)
    if (i >= 0 && text.slice(i + word.length).trimStart().startsWith('அமர்வு')) return n
  }
  // Hours map onto 5-hour sessions, the way the studio quotes.
  const hours = text.match(/(\d{1,2})\s*(?:h\b|hrs?\b|hours?\b|மணி)/)
  if (hours) return Math.min(4, Math.max(1, Math.round(Number(hours[1]) / 5)))
  if (/\bfull[\s-]?day\b/.test(text) || text.includes('முழு நாள்')) return 2
  if (/\bhalf[\s-]?day\b/.test(text) || text.includes('அரை நாள்')) return 1
  return null
}

/** A count spoken next to an item: "two frames", "3 magazines". */
function parseQty(clause: string): number | undefined {
  const d = clause.match(/\b(\d)\b/)
  if (d) return Number(d[1])
  const w = clause.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\b/)
  if (w) return EN_NUM[w[1]]
  for (const [word, n] of TA_NUM) if (clause.includes(word)) return n
  return undefined
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/(\S)\.(?=\S)/gu, '$1 ')
    .replace(/[^\p{L}\p{M}\p{N}\s'.,;!?-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Splits an utterance into clauses so "add drone but remove the LED wall" does both. */
function clauses(text: string): string[] {
  return text
    .split(/[,;!?.]|\b(?:and|but|also|then)\b|மற்றும்|ஆனால்|பிறகு|அப்புறம்/)
    .map(s => s.trim())
    .filter(Boolean)
}

export function parseIntents(raw: string): Intent[] {
  const text = normalize(raw)
  if (!text) return []
  const out: Intent[] = []
  const push = (i: Intent) => {
    if (!out.some(o => JSON.stringify(o) === JSON.stringify(i))) out.push(i)
  }

  if (hit(text, CLEAR)) push({ kind: 'clearExtras' })

  let lastOp: 'add' | 'remove' = 'add'
  for (const clause of clauses(text)) {
    if (hit(clause, CLEAR)) continue
    const removing = hit(clause, REMOVE)
    const adding = hit(clause, ADD)
    const op: 'add' | 'remove' = removing ? 'remove' : adding ? 'add' : lastOp
    lastOp = op

    let isTier = false
    for (const key of Object.keys(TIER_MATCH) as (FixedTier | 'custom')[]) {
      if (hit(clause, TIER_MATCH[key])) {
        push({ kind: 'tier', tier: key })
        isTier = true
      }
    }

    const sessions = parseSessions(clause)
    if (sessions !== null) push({ kind: 'sessions', sessions })
    else if (hit(clause, MORE_SESSION)) push({ kind: 'sessionsDelta', delta: 1 })
    else if (hit(clause, LESS_SESSION)) push({ kind: 'sessionsDelta', delta: -1 })

    const matched = new Set<CatalogueId>()
    for (const [id, m] of ITEM_MATCH) {
      if (!hit(clause, m)) continue
      // "Premium package" is a tier, not a premium frame; "candid photo" must not also add trad photo.
      if (isTier && (id === 'album_30' || id === 'frame_16x24')) continue
      if (id === 'trad_photo' && matched.has('candid_photo')) continue
      if (id === 'trad_video' && matched.has('candid_video')) continue
      let pick = id
      if (id === 'album_30') for (const [re, sized] of ALBUM_SHEETS) if (re.test(clause)) pick = sized
      matched.add(pick)
      const qty = pick.startsWith('album') ? undefined : parseQty(clause)
      push({ kind: 'item', id: pick, op, qty })
    }
  }

  if (hit(text, TOTAL)) push({ kind: 'total' })
  if (hit(text, NEXT) && !out.some(i => i.kind === 'item' || i.kind === 'tier')) push({ kind: 'next' })
  if (!out.length && hit(text, HELP)) push({ kind: 'help' })
  if (!out.length && hit(text, GREET)) push({ kind: 'greet' })
  return out
}
