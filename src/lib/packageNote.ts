import type { Bi } from './i18n'

/*
 * "How packages and albums work": one bilingual source for the card under the
 * package bar, the Services packages section, the client album studio, the voice
 * guide's package clip and the cart assistant's answers. Keep this file free of
 * React imports; the voice clip script loads it under Node.
 */

export const PACKAGE_ALBUM_TITLE: Bi = { en: 'How packages and albums work', ta: 'தொகுப்பும் ஆல்பமும் எப்படி' }

export const PACKAGE_ALBUM_POINTS: Bi[] = [
  {
    en: 'Every package that lists an album includes that size and sheet count.',
    ta: 'ஆல்பம் உள்ள ஒவ்வொரு தொகுப்பிலும், அதில் சொன்ன அளவும் தாள் எண்ணிக்கையும் அடங்கும்.',
  },
  {
    en: 'You can move up to a bigger album or another line and pay only the difference.',
    ta: 'பெரிய ஆல்பத்துக்கோ வேறு வகைக்கோ மாற்றலாம்; வித்தியாசத் தொகையை மட்டும் கட்டினால் போதும்.',
  },
  {
    en: 'The package album holds individual and candid portraits chosen from your online gallery; group photos go in a landscape album.',
    ta: 'தொகுப்பு ஆல்பத்தில், உங்கள் ஆன்லைன் கேலரியிலிருந்து நீங்கள் தேர்ந்தெடுக்கும் தனிப் படங்களும் கேண்டிட் படங்களும் வரும்; குழுப் படங்கள் landscape ஆல்பத்தில் வரும்.',
  },
  {
    en: 'Running over on the day is charged per extra hour.',
    ta: 'அன்று நேரம் கூடினால், கூடுதல் ஒவ்வொரு மணி நேரத்துக்கும் கட்டணம் உண்டு.',
  },
  {
    en: 'Your gallery stays open for six months.',
    ta: 'உங்கள் கேலரி ஆறு மாதம் திறந்திருக்கும்.',
  },
]

/** The whole note as one paragraph, for speech. */
export const PACKAGE_ALBUM_NOTE: Bi = {
  en: PACKAGE_ALBUM_POINTS.map(p => p.en).join(' '),
  ta: PACKAGE_ALBUM_POINTS.map(p => p.ta).join(' '),
}
