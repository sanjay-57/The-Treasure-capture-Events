import type { CatalogueId, FixedTier, PresetKind } from '../../lib/catalogue'
import type { AlbumLineKey } from '../../lib/data'

/*
 * Local rule-based intent parser for the voice cart assistant (English + Tamil).
 * It is the stand-in for Gemini: see VoiceAssistant.tsx `handle()` for where the
 * Gemini function-calling request replaces `parseIntents`. The Intent shape below
 * doubles as the function/tool schema to give Gemini.
 */

export type Intent =
  | { kind: 'item'; id: CatalogueId; op: 'add' | 'remove'; qty?: number }
  /**
   * A package. `family` limits the word to one package family ("beach" is a
   * package only for outdoor shoots); elsewhere `fallback` is added as an item.
   */
  | { kind: 'tier'; tier: FixedTier | 'custom'; family?: PresetKind; fallback?: CatalogueId }
  | { kind: 'hours'; hours: number }
  /** A question about a package's contents: "what's in Gold?". Nothing changes. */
  | { kind: 'askPackage'; tier: FixedTier; family?: PresetKind }
  /** A question about albums: "album எவ்வளவு?". Nothing changes. */
  | { kind: 'askAlbum' }
  /** A price question about one item: "how much is drone?". Nothing changes. */
  | { kind: 'askItem'; id: CatalogueId }
  | { kind: 'albumLine'; line: AlbumLineKey }
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
  ['semi_candid_video', { en: /\b(semi[\s-]?candid( video| film)?)\b/, ta: ['செமி'] }],
  ['vid_documentary', { en: /\b(documentary|interviews?)\b/, ta: ['ஆவண', 'பேட்டி'] }],
  ['vid_moments', { en: /\b(candid moments|moments video)\b/, ta: ['இயல்பான தருண'] }],
  ['vid_cinematic', { en: /\b(candid (video|videograph\w*|film|cinemat\w*)|cinematic|cinema style|highlight film)\b/, ta: ['கேண்டிட் வீடியோ', 'சினிமா'] }],
  ['candid_couple', { en: /\b(couple portraits?|couple candid|candid couple)\b/, ta: ['ஜோடி படங்கள', 'ஜோடி கேண்டிட'] }],
  ['candid_guests', { en: /\b(candid (of )?(the )?guests?|guests? candid)\b/, ta: ['விருந்தினர் கேண்டிட', 'கேண்டிட் விருந்தினர'] }],
  ['candid_family', { en: /\b(family moments|candid( photo\w*| camera)?)\b/, ta: ['குடும்ப தருண', 'கேண்டிட்'] }],
  ['trad_video', { en: /\b((traditional |trad )?video\w*)\b/, ta: ['வீடியோ'] }],
  ['trad_photo', { en: /\b((traditional |trad )?photograph\w*|photographer)\b/, ta: ['புகைப்படக் கலைஞர்', 'போட்டோகிராபர்'] }],
  ['drone_fpv', { en: /\b(fpv|f p v|fly[\s-]?through)\b/, ta: ['எஃப்பிவி', 'fpv'] }],
  ['drone', { en: /\b(drones?|aerial)\b/, ta: ['ட்ரோன', 'டிரோன', 'ட்ரோண', 'வான்வழி'] }],
  ['pendrive', { en: /\b(pen ?drives?|usb)\b/, ta: ['பென்டிரைவ', 'பென் டிரைவ'] }],
  ['reels', { en: /\b(reels?|song recreation)\b/, ta: ['ரீல்ஸ', 'ரீல்'] }],
  ['ledwall', { en: /\b(led|l e d|big screen|live screen|screen|live wall)\b/, ta: ['எல்இடி', 'எல் இ டி', 'எல்.இ.டி', 'திரை'] }],
  ['einvite_premium', { en: /\b(caricature|premium (e[\s-]?)?invit\w*)\b/, ta: ['கேரிகேச்சர'] }],
  ['einvite', { en: /\b(e[\s-]?invite|invitation|invite)\b/, ta: ['அழைப்பிதழ', 'இன்வைட'] }],
  ['selfie360', { en: /\b(360|three sixty|selfie booth|spinner)\b/, ta: ['360', 'செல்ஃபி', 'செல்பி'] }],
  ['photobooth', { en: /\b(photo ?booth|booth|instant prints?)\b/, ta: ['பூத', 'உடனடி அச்சு', 'உடனடி பிரிண்ட'] }],
  ['magazine', { en: /\b(magazines?)\b/, ta: ['மேகசின', 'மாகசின', 'இதழ'] }],
  ['minibook', { en: /\b(mini ?books?|mini ?albums?|parents?'? (copy|album))\b/, ta: ['மினி', 'சிறிய ஆல்பம', 'பெற்றோர்'] }],
  ['calendar', { en: /\b(calendars?)\b/, ta: ['காலண்டர', 'நாட்காட்டி'] }],
  ['wooden_box', { en: /\b(wooden box)\b/, ta: ['மரப் பெட்டி', 'மரப்பெட்டி'] }],
  ['frame_16x24', { en: /\b(frames?|framed)\b/, ta: ['பிரேம', 'ஃப்ரேம', 'சட்டம'] }],
  ['album_25', { en: /\b(albums?|hard ?cop(y|ies)|(25|35|45) sheets?)\b/, ta: ['ஆல்பம', 'ஆல்பத்த', 'ஆல்பங்க', 'தாள்'] }],
  ['prepost_wedding', { en: /\b(pre[\s-]?shoot|pre[\s-]?wedding|post[\s-]?wedding|couple shoot)\b/, ta: ['ப்ரீ ஷூட', 'ப்ரீஷூட', 'ப்ரீ வெட்டிங', 'முன் படப்பிடிப்ப'] }],
]

/** When the first id matched, the later ones are the same words and must not also fire. */
const SHADOWS: Partial<Record<CatalogueId, CatalogueId[]>> = {
  semi_candid_video: ['candid_family', 'trad_video', 'vid_cinematic'],
  vid_documentary: ['trad_video'], vid_moments: ['candid_family', 'trad_video', 'vid_cinematic'], vid_cinematic: ['trad_video', 'candid_family'],
  candid_couple: ['candid_family', 'prepost_wedding'], candid_guests: ['candid_family'], candid_family: ['trad_photo'],
  drone_fpv: ['drone'], einvite_premium: ['einvite'], wooden_box: ['album_25'],
}

/** Album sheet counts, and the 10×28 heirloom album. */
const ALBUM_SHEETS: [RegExp, 25 | 35 | 45][] = [
  [/\b(25|twenty[\s-]?five)\b/, 25], [/\b(35|thirty[\s-]?five)\b/, 35], [/\b(45|forty[\s-]?five)\b/, 45],
]
const ALBUM_1028 = /\b10\s*(x|by)?\s*28\b/
const FRAME_SIZES: [RegExp, CatalogueId][] = [
  [/\ba4\b/, 'frame_a4'], [/\ba3\b/, 'frame_a3'], [/\b12\s*(x|by)?\s*18\b/, 'frame_12x18'], [/\b16\s*(x|by)?\s*24\b/, 'frame_16x24'], [/\b20\s*(x|by)?\s*30\b/, 'frame_20x30'],
]

/** Album lines from the Canvera catalogues. */
const LINE_MATCH: [AlbumLineKey, Matcher][] = [
  ['pixel_passage', { en: /\b(pixel( passage)?)\b/, ta: ['பிக்சல்'] }],
  ['aura', { en: /\b(aura)\b/, ta: ['ஆரா'] }],
  ['acroluxe', { en: /\b(acro ?lux\w*)\b/, ta: ['அக்ரோலக்ஸ'] }],
  ['allura', { en: /\b(allura)\b/, ta: ['அல்லூரா'] }],
]

/** Package words. Outdoor looks and wedding package names only mean a package for their own family. */
const TIER_MATCH: { tier: FixedTier | 'custom'; m: Matcher; family?: PresetKind; fallback?: CatalogueId }[] = [
  { tier: 'basic', m: { en: /\b(bronze|basic|essential|simple|cheapest)\b/, ta: ['பிராஞ்ச', 'ப்ரான்ஸ', 'பேசிக', 'அடிப்படை', 'எளிய'] } },
  { tier: 'standard', m: { en: /\b(silver|standard|popular)\b/, ta: ['சில்வர', 'ஸ்டாண்டர்ட', 'பிரபல'] } },
  { tier: 'premium', m: { en: /\b(gold|premium|luxury|full package)\b/, ta: ['கோல்ட', 'தங்க', 'பிரீமியம'] } },
  { tier: 'basic', family: 'wedding', m: { en: /\b(package (1|one))\b/, ta: ['தொகுப்பு 1'] } },
  { tier: 'standard', family: 'wedding', m: { en: /\b(package (2|two))\b/, ta: ['தொகுப்பு 2'] } },
  { tier: 'premium', family: 'wedding', m: { en: /\b(tier (2|two))\b/, ta: ['அடுக்கு 2'] } },
  { tier: 'basic', family: 'outdoor', fallback: 'look_temple', m: { en: /\b(traditional look|temple look)\b/, ta: ['பாரம்பரியத் தோற்ற'] } },
  { tier: 'standard', family: 'outdoor', fallback: 'look_beach', m: { en: /\b(beach)\b/, ta: ['கடற்கரை'] } },
  { tier: 'premium', family: 'outdoor', fallback: 'look_meadow', m: { en: /\b(meadow|garden look)\b/, ta: ['புல்வெளி'] } },
  { tier: 'custom', m: { en: /\b(custom|customi[sz]e|my own|build my own)\b/, ta: ['தனிப்பயன', 'கஸ்டம', 'நீங்களே'] } },
]

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
/** Asking rather than ordering: "what's in Gold", "how much is the album", "ஆல்பம் எவ்வளவு". */
const ASK: Matcher = {
  en: /\b(what'?s in|what is in|what comes (in|with)|what do(es)? (i|you|we) get|includes?|included|how much|price of|cost of|how do(es)? .* work|tell me about|explain)\b/,
  ta: ['என்ன இருக்கு', 'என்ன இருக்கிறது', 'என்னென்ன', 'என்ன உள்ள', 'எவ்வளவு', 'விலை என்ன', 'எப்படி'],
}
/** Words that mean the cart's total, not one thing's price. */
const TOTAL_WORD: Matcher = { en: /\b(total|my cart|summary|quote)\b/, ta: ['மொத்த', 'சுருக்கம்'] }
const HELP: Matcher = { en: /\b(help|what can you|options|how does this work|what can i say)\b/, ta: ['உதவி', 'என்ன சொல்ல', 'எப்படி'] }
const GREET: Matcher = { en: /\b(hi|hello|hey|vanakkam|good (morning|evening|afternoon))\b/, ta: ['வணக்கம்'] }
const NEXT: Matcher = { en: /\b(next|continue|proceed|checkout|check out|done|that'?s all|book it)\b/, ta: ['அடுத்து', 'தொடர', 'முடிந்தது', 'போதும்', 'பதிவு செய்'] }
const ALBUM_WORD: Matcher = { en: /\b(albums?|sheets?)\b/, ta: ['ஆல்பம', 'தாள்'] }
const MORE_SESSION: Matcher = { en: /\b((one|an|1) (more|extra) session|extra session|add (a |one )?session|second session|two sessions)\b/, ta: ['இன்னொரு அமர்வு', 'கூடுதல் அமர்வு', 'இரண்டு அமர்வு'] }
const LESS_SESSION: Matcher = { en: /\b((one|a|1) (less|fewer) session|reduce (a |one )?session|single session|one session)\b/, ta: ['ஒரு அமர்வு', 'அமர்வு குறை'] }

const EN_NUM: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
}
/** Longest first, so "பதினொன்று" is not read as "ஒன்று". */
const TA_NUM: [string, number][] = (
  [
    ['ஒன்று', 1], ['ஒரு', 1], ['இரண்டு', 2], ['ரெண்டு', 2], ['மூன்று', 3], ['மூணு', 3], ['நான்கு', 4], ['நாலு', 4], ['ஐந்து', 5], ['அஞ்சு', 5],
    ['ஆறு', 6], ['ஏழு', 7], ['எட்டு', 8], ['ஒன்பது', 9], ['பத்து', 10], ['பதினொன்று', 11], ['பதினொரு', 11], ['பன்னிரண்டு', 12],
    ['பதிமூன்று', 13], ['பதினான்கு', 14], ['பதினைந்து', 15], ['பதினாறு', 16],
  ] as [string, number][]
).sort((a, b) => b[0].length - a[0].length)

const followedBy = (text: string, word: string, next: string) => {
  const i = text.indexOf(word)
  return i >= 0 && text.slice(i + word.length).trimStart().startsWith(next)
}

/** Whole sessions spoken as sessions: "two sessions", "இரண்டு அமர்வு". */
function parseSessions(text: string): number | null {
  const digits = text.match(/(\d)\s*(?:sessions?|அமர்வு)/)
  if (digits) return Number(digits[1])
  const en = text.match(/\b(one|two|three|four)\s*sessions?\b/)
  if (en) return EN_NUM[en[1]]
  for (const [word, n] of TA_NUM) if (n <= 4 && followedBy(text, word, 'அமர்வு')) return n
  return null
}

/** Hours of coverage: "six hours", "6 h", "ஆறு மணி நேரம்", "full day". */
function parseHours(text: string): number | null {
  const digits = text.match(/(\d{1,2})\s*(?:h\b|hrs?\b|hours?\b|மணி)/)
  if (digits) return Number(digits[1])
  const en = text.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen)\s*(?:hours?|hrs?)\b/)
  if (en) return EN_NUM[en[1]]
  for (const [word, n] of TA_NUM) if (followedBy(text, word, 'மணி')) return n
  if (/\bfull[\s-]?day\b/.test(text) || text.includes('முழு நாள்')) return 8
  if (/\bhalf[\s-]?day\b/.test(text) || text.includes('அரை நாள்')) return 4
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
  const asking = raw.trim().endsWith('?')
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
    // "What's in Gold?" and "album எவ்வளவு?" are answered, never applied.
    if ((asking || hit(clause, ASK)) && !removing && !adding) {
      const tiers = TIER_MATCH.filter(t => t.tier !== 'custom' && hit(clause, t.m))
      for (const t of tiers) push({ kind: 'askPackage', tier: t.tier as FixedTier, family: t.family })
      if (!tiers.length && (hit(clause, ALBUM_WORD) || LINE_MATCH.some(([, m]) => hit(clause, m)))) push({ kind: 'askAlbum' })
      if (tiers.length || out.some(o => o.kind === 'askAlbum')) continue
      const asked = ITEM_MATCH.find(([, m]) => hit(clause, m))
      if (asked) {
        push({ kind: 'askItem', id: asked[0] === 'frame_16x24' ? FRAME_SIZES.find(([re]) => re.test(clause))?.[1] ?? asked[0] : asked[0] })
        continue
      }
    }
    const op: 'add' | 'remove' = removing ? 'remove' : adding ? 'add' : lastOp
    lastOp = op

    let isTier = false
    for (const { tier, m, family, fallback } of TIER_MATCH) {
      if (!hit(clause, m)) continue
      push({ kind: 'tier', tier, family, fallback })
      isTier = true
    }

    const sessions = parseSessions(clause)
    const hours = sessions === null ? parseHours(clause) : null
    if (sessions !== null) push({ kind: 'sessions', sessions })
    else if (hours !== null) push({ kind: 'hours', hours })
    else if (hit(clause, MORE_SESSION)) push({ kind: 'sessionsDelta', delta: 1 })
    else if (hit(clause, LESS_SESSION)) push({ kind: 'sessionsDelta', delta: -1 })

    let line: AlbumLineKey | undefined
    for (const [key, m] of LINE_MATCH) if (hit(clause, m)) line = key
    if (line) push({ kind: 'albumLine', line })

    const matched = new Set<CatalogueId>()
    const shadowed = new Set<CatalogueId>()
    for (const [id, m] of ITEM_MATCH) {
      if (shadowed.has(id) || !hit(clause, m)) continue
      for (const s of SHADOWS[id] ?? []) shadowed.add(s)
      // "Premium package" is a tier, not a premium frame or album; "six hours" is not six of anything.
      if (isTier && (id === 'album_25' || id === 'frame_16x24')) continue
      let pick: CatalogueId = id
      if (id === 'album_25') {
        const sheets = ALBUM_SHEETS.find(([re]) => re.test(clause))?.[1]
        if (ALBUM_1028.test(clause)) pick = `album_1028_${sheets ?? 25}` as CatalogueId
        else if (sheets) pick = `album_${sheets}` as CatalogueId
        // "Aura album" is a line choice; the line intent adds the album when there is none.
        else if (line) continue
      }
      if (id === 'frame_16x24') pick = FRAME_SIZES.find(([re]) => re.test(clause))?.[1] ?? id
      matched.add(pick)
      const qty = pick.startsWith('album') || hours !== null || sessions !== null ? undefined : parseQty(clause)
      push({ kind: 'item', id: pick, op, qty })
    }
    // "35 sheets" on its own still means the album.
    if (!matched.size && !line && hit(clause, ALBUM_WORD) && !isTier) {
      const sheets = ALBUM_SHEETS.find(([re]) => re.test(clause))?.[1]
      if (sheets) push({ kind: 'item', id: `album_${sheets}` as CatalogueId, op })
    }
  }

  const asked = out.some(i => i.kind === 'askPackage' || i.kind === 'askAlbum' || i.kind === 'askItem')
  if (hit(text, TOTAL) && (!asked || hit(text, TOTAL_WORD))) push({ kind: 'total' })
  if (hit(text, NEXT) && !out.some(i => i.kind === 'item' || i.kind === 'tier' || i.kind === 'albumLine')) push({ kind: 'next' })
  if (!out.length && hit(text, HELP)) push({ kind: 'help' })
  if (!out.length && hit(text, GREET)) push({ kind: 'greet' })
  return out
}
