import type { AddonKey, PackageKey } from '../../lib/data'

/*
 * Local rule-based intent parser for the voice cart assistant (English + Tamil).
 * It is the stand-in for Gemini: see VoiceAssistant.tsx `handle()` for where the
 * Gemini function-calling request replaces `parseIntents`. The Intent shape below
 * doubles as the function/tool schema to give Gemini.
 */

export type Intent =
  | { kind: 'addon'; key: AddonKey; op: 'add' | 'remove' }
  | { kind: 'package'; key: PackageKey }
  | { kind: 'hours'; hours: number }
  | { kind: 'hoursDelta'; delta: number }
  | { kind: 'clearAddons' }
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

const ADDON_MATCH: Record<AddonKey, Matcher> = {
  drone: { en: /\b(drones?|aerial)\b/, ta: ['ட்ரோன', 'டிரோன', 'ட்ரோண', 'வான்வழி'] },
  ledwall: { en: /\b(led|l e d|big screen|live screen|screen|live wall)\b/, ta: ['எல்இடி', 'எல் இ டி', 'எல்.இ.டி', 'திரை'] },
  sameday: { en: /\b(same[\s-]?day|reel|highlight reel)\b/, ta: ['அன்றே', 'ரீல', 'சேம் டே', 'அதே நாள'] },
  extraalbum: { en: /\b(albums?)\b/, ta: ['ஆல்பம', 'ஆல்பத்த', 'ஆல்பங்க'] },
  preshoot: { en: /\b(pre[\s-]?shoot|pre[\s-]?wedding|pre[\s-]?event|outdoor shoot)\b/, ta: ['ப்ரீ ஷூட', 'ப்ரீஷூட', 'ப்ரீ வெட்டிங', 'முன் படப்பிடிப்ப', 'வெளிப்புற'] },
  booth: { en: /\b(booth|instant prints?|photo booth)\b/, ta: ['பூத', 'உடனடி அச்சு', 'உடனடி பிரிண்ட'] },
}

const PACKAGE_MATCH: Record<PackageKey, Matcher> = {
  essential: { en: /\b(essential|basic|simple|cheapest)\b/, ta: ['எசென்ஷியல', 'எசன்ஷியல', 'அடிப்படை', 'எளிய'] },
  signature: { en: /\b(signature|popular|standard)\b/, ta: ['சிக்னேச்சர', 'சிக்னேசர', 'சிக்நேச்சர', 'பிரபல'] },
  heirloom: { en: /\b(heirloom|premium|luxury|full package)\b/, ta: ['பரம்பரை', 'பொக்கிஷ', 'ஹெய்ர்லூம', 'ஏர்லூம', 'பிரீமியம'] },
}

const REMOVE: Matcher = {
  en: /\b(remove|delete|drop|cancel|without|skip|no|don'?t|do not|take (it )?(off|out)|exclude|minus|not needed)\b/,
  ta: ['வேண்டாம்', 'வேணாம்', 'நீக்கு', 'நீக்க', 'எடுத்துவிடு', 'எடுத்து விடு', 'தவிர்', 'ரத்து', 'இல்லாமல்'],
}
const ADD: Matcher = {
  en: /\b(add|include|want|need|with|plus|put|get|yes|keep)\b/,
  ta: ['சேர்', 'வேண்டும்', 'வேணும்', 'போடு', 'வைக்க', 'வையுங்கள்'],
}
const CLEAR: Matcher = {
  en: /\b((remove|clear|drop) (all|every ?thing)|(remove|clear|no) (the )?add[\s-]?ons)\b/,
  ta: ['அனைத்தையும் நீக்கு', 'எல்லாவற்றையும் நீக்கு', 'எல்லாம் வேண்டாம்', 'எதுவும் வேண்டாம்', 'எல்லாத்தையும் நீக்கு'],
}
const TOTAL: Matcher = {
  en: /\b(total|price|cost|how much|quote|amount|budget|summary|my cart|what'?s in)\b/,
  ta: ['எவ்வளவு', 'மொத்த', 'விலை', 'கட்டணம்', 'தொகை', 'செலவு', 'பட்டியல்', 'சுருக்கம்', 'என்ன இருக்கு'],
}
const HELP: Matcher = { en: /\b(help|what can you|options|how does this work|what can i say)\b/, ta: ['உதவி', 'என்ன சொல்ல', 'எப்படி'] }
const GREET: Matcher = { en: /\b(hi|hello|hey|vanakkam|good (morning|evening|afternoon))\b/, ta: ['வணக்கம்'] }
const NEXT: Matcher = { en: /\b(next|continue|proceed|checkout|check out|done|that'?s all|book it)\b/, ta: ['அடுத்து', 'தொடர', 'முடிந்தது', 'போதும்', 'பதிவு செய்'] }
const MORE_HOUR: Matcher = { en: /\b((one|an|1) (more|extra) hour|extra hour|add (an |one )?hour)\b/, ta: ['இன்னும் ஒரு மணி', 'கூடுதல் ஒரு மணி', 'கூடுதலாக ஒரு மணி'] }
const LESS_HOUR: Matcher = { en: /\b((one|an|1) (less|fewer) hour|reduce (an |one )?hour)\b/, ta: ['ஒரு மணி குறை', 'ஒரு மணி நேரம் குறை'] }

const EN_NUM: Record<string, number> = {
  two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14,
}
// Longer words first so பதினொன்று is not read as ஒன்று etc.
const TA_NUM: [string, number][] = [
  ['பதின்மூன்று', 13], ['பதினான்கு', 14], ['பதினாலு', 14], ['பன்னிரண்டு', 12], ['பனிரெண்டு', 12], ['பன்னெண்டு', 12], ['பதினொன்று', 11], ['பதினொரு', 11],
  ['இரண்டு', 2], ['ரெண்டு', 2], ['மூன்று', 3], ['மூணு', 3], ['நான்கு', 4], ['நாலு', 4], ['ஐந்து', 5], ['அஞ்சு', 5],
  ['ஒன்பது', 9], ['பத்து', 10], ['ஆறு', 6], ['ஏழு', 7], ['எட்டு', 8],
]

function parseHours(text: string): number | null {
  const digits = text.match(/(\d{1,2})\s*(?:-\s*)?(?:h\b|hrs?\b|hours?\b|மணி)/)
  if (digits) return Number(digits[1])
  const en = text.match(/\b(two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen)\s*(?:-\s*)?hours?\b/)
  if (en) return EN_NUM[en[1]]
  for (const [word, n] of TA_NUM) {
    const i = text.indexOf(word)
    if (i >= 0 && text.slice(i + word.length).trimStart().startsWith('மணி')) return n
  }
  if (/\bhalf[\s-]?day\b/.test(text) || text.includes('அரை நாள்')) return 4
  if (/\bfull[\s-]?day\b/.test(text) || text.includes('முழு நாள்')) return 8
  return null
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    // Dotted abbreviations (l.e.d, எல்.இ.டி) become spaced letters so they survive clause splitting.
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

  if (hit(text, CLEAR)) push({ kind: 'clearAddons' })

  let lastOp: 'add' | 'remove' = 'add'
  for (const clause of clauses(text)) {
    if (hit(clause, CLEAR)) continue
    const removing = hit(clause, REMOVE)
    const adding = hit(clause, ADD)
    const op: 'add' | 'remove' = removing ? 'remove' : adding ? 'add' : lastOp
    lastOp = op

    let isPackage = false
    for (const key of Object.keys(PACKAGE_MATCH) as PackageKey[]) {
      if (hit(clause, PACKAGE_MATCH[key])) {
        push({ kind: 'package', key })
        isPackage = true
      }
    }

    const hours = parseHours(clause)
    if (hours !== null) push({ kind: 'hours', hours })
    else if (hit(clause, MORE_HOUR)) push({ kind: 'hoursDelta', delta: 1 })
    else if (hit(clause, LESS_HOUR)) push({ kind: 'hoursDelta', delta: -1 })

    for (const key of Object.keys(ADDON_MATCH) as AddonKey[]) {
      // "Heirloom album" describes the package, not an extra album copy.
      if (key === 'extraalbum' && isPackage) continue
      if (hit(clause, ADDON_MATCH[key])) push({ kind: 'addon', key, op })
    }
  }

  if (hit(text, TOTAL)) push({ kind: 'total' })
  if (hit(text, NEXT) && !out.some(i => i.kind === 'addon' || i.kind === 'package')) push({ kind: 'next' })
  if (!out.length && hit(text, HELP)) push({ kind: 'help' })
  if (!out.length && hit(text, GREET)) push({ kind: 'greet' })
  return out
}
