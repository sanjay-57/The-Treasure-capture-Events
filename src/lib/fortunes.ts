import type { Bi } from './i18n'

/*
 * Fortune cookies for the e-invites. Each line is written in both languages on
 * its own, not translated word for word. Target is 67 (roadmap 6.3): blessings 15,
 * playful 15, poetic 12, food and home 8, travel 7, elders' wisdom 10. Nothing
 * about in-laws, money or children. The first 10 below are for the example invite.
 */

export type FortuneTone = 'blessing' | 'playful' | 'poetic' | 'home' | 'travel' | 'elders'

export interface Fortune extends Bi {
  tone: FortuneTone
}

export const FORTUNES: Fortune[] = [
  { tone: 'blessing', en: 'May every morning find you laughing at the same joke.', ta: 'ஒவ்வொரு காலையும் ஒரே ஜோக்குக்கு இருவரும் சேர்ந்து சிரிக்கட்டும்.' },
  { tone: 'blessing', en: 'A full house, a warm kitchen and a door that is always open.', ta: 'நிறைந்த வீடு, சூடான அடுப்பு, எப்போதும் திறந்திருக்கும் வாசல்.' },
  { tone: 'playful', en: 'You will lose the remote. You will find each other instead.', ta: 'ரிமோட் தொலையும். ஆனால் ஒருவரை ஒருவர் கண்டுபிடிப்பீர்கள்.' },
  { tone: 'playful', en: 'Today you eat one more vadai than planned. No regrets.', ta: 'இன்று திட்டத்தைவிட ஒரு வடை கூடுதலாகச் சாப்பிடுவீர்கள். வருத்தமே இல்லை.' },
  { tone: 'poetic', en: 'Like jasmine at dusk, the best things open slowly.', ta: 'மாலை மல்லிகை போல, நல்லவை எல்லாம் மெதுவாகத்தான் மலரும்.' },
  { tone: 'poetic', en: 'Two rivers, one sea. The journey is the song.', ta: 'இரண்டு ஆறு, ஒரே கடல். போகும் வழியே பாட்டு.' },
  { tone: 'home', en: 'Filter coffee for two will taste better than for one.', ta: 'ஒருவருக்கான ஃபில்டர் காபியைவிட, இருவருக்கானது இன்னும் ருசி.' },
  { tone: 'travel', en: 'A long road is waiting, and it has a window seat for you.', ta: 'நீண்ட பயணம் காத்திருக்கிறது; உங்களுக்கு ஜன்னல் சீட் உண்டு.' },
  { tone: 'elders', en: 'Patience is the sweetest thing in the pot. Let it cook.', ta: 'பொறுமைதான் பானையில் இனிப்பு. மெதுவாக வேகட்டும்.' },
  { tone: 'elders', en: 'What you sow together, you will harvest together.', ta: 'சேர்ந்து விதைத்தது, சேர்ந்தே அறுவடையாகும்.' },

  // Blessings
  { tone: 'blessing', en: 'May you always have someone to tell your good news to first.', ta: 'நல்ல செய்தி வந்ததும் முதலில் சொல்ல, எப்போதும் பக்கத்தில் ஒருவர் இருக்கட்டும்.' },
  { tone: 'blessing', en: 'However busy life gets, may there always be a little time just for you two.', ta: 'எவ்வளவு வேலை இருந்தாலும், உங்கள் இருவருக்கு மட்டும் கொஞ்ச நேரம் எப்போதும் மிச்சம் இருக்கட்டும்.' },
  { tone: 'blessing', en: 'Hand in hand, may you see a hundred happy years together.', ta: 'கைகோர்த்தபடியே இருவரும் சேர்ந்து நூறு வருடம் சந்தோஷமாக வாழுங்கள்.' },
  { tone: 'blessing', en: 'May good health walk beside you, every single day.', ta: 'ஒவ்வொரு நாளும் நல்ல ஆரோக்கியம் உங்கள் கூடவே இருக்கட்டும்.' },
  { tone: 'blessing', en: 'May every year bring you a brand-new reason to celebrate.', ta: 'ஒவ்வொரு வருடமும் கொண்டாட ஒரு புதுக் காரணம் கிடைக்கட்டும்.' },
  { tone: 'blessing', en: 'May you always look for the good in each other, and find it.', ta: 'ஒருவரிடம் ஒருவர் நல்லதையே தேடுங்கள்; அது எப்போதும் கிடைக்கும்.' },
  { tone: 'blessing', en: 'Peaceful sleep every night and new energy every morning.', ta: 'ஒவ்வொரு இரவும் நிம்மதியான தூக்கம், ஒவ்வொரு காலையும் புது உற்சாகம்.' },
  { tone: 'blessing', en: 'May every blessing from your wedding day follow you home.', ta: 'கல்யாண நாளில் கிடைக்கும் வாழ்த்து எல்லாம் உங்களோடு வீடு வரை வரட்டும்.' },
  { tone: 'blessing', en: "May you stay each other's best friend for life.", ta: 'வாழ்நாள் முழுவதும் ஒருவருக்கொருவர் நல்ல நண்பராக இருங்கள்.' },
  { tone: 'blessing', en: "May the road be smooth, and where it's rough, may you lean on each other.", ta: 'பாதை சுலபமாக இருக்கட்டும்; கரடுமுரடான இடத்தில் ஒருவரை ஒருவர் தாங்கிக்கொள்ளுங்கள்.' },
  { tone: 'blessing', en: 'Whatever your age, may your hearts stay young.', ta: 'வயது எவ்வளவு ஆனாலும், மனம் என்றும் இளமையாக இருக்கட்டும்.' },
  { tone: 'blessing', en: 'May sorry and thank you always come easily between you.', ta: 'மன்னிப்பும் நன்றியும் உங்களுக்குள் எப்போதும் சுலபமாக வரட்டும்.' },
  { tone: 'blessing', en: 'May the good you wish for others come back to you twice over.', ta: 'மற்றவர்களுக்கு நீங்கள் நினைக்கும் நல்லது, இரண்டு மடங்காக உங்களுக்கே திரும்பி வரட்டும்.' },

  // Playful
  { tone: 'playful', en: "A great adventure awaits every evening: deciding what's for dinner.", ta: "தினமும் மாலையில் ஒரு பெரிய சாகசம் காத்திருக்கிறது: 'இன்னிக்கு ராத்திரி என்ன சாப்பாடு?'" },
  { tone: 'playful', en: 'You will win every argument. So will your partner. Somehow.', ta: 'ஒவ்வொரு வாக்குவாதத்திலும் நீங்கள்தான் ஜெயிப்பீர்கள். உங்கள் துணையும்தான். எப்படி என்று மட்டும் கேட்காதீர்கள்!' },
  { tone: 'playful', en: 'Your wedding album will go round the family faster than the sweet box.', ta: 'இனிப்புப் பெட்டியைவிட வேகமாக உங்கள் கல்யாண ஆல்பம் சொந்தக்காரர்கள் கையில் சுற்றும்.' },
  { tone: 'playful', en: 'Lucky number: 2. Lucky colour: whatever your partner is wearing today.', ta: 'அதிர்ஷ்ட எண்: 2. அதிர்ஷ்ட நிறம்: இன்று உங்கள் துணை போட்டிருக்கும் உடையின் நிறம்.' },
  { tone: 'playful', en: "One of you will always be ready early. The other, always 'five minutes away'.", ta: "ஒருவர் எப்போதும் சீக்கிரமே தயார். இன்னொருவர் எப்போதும் 'அஞ்சு நிமிஷத்துல வந்துடறேன்!'" },
  { tone: 'playful', en: 'On the big day, keep smiling: somewhere in the hall, a camera will find you.', ta: 'கல்யாணத்தன்று சிரித்தபடியே இருங்கள்; மண்டபத்தில் எங்கோ ஒரு கேமரா உங்களைத் தேடிக் கண்டுபிடிக்கும்.' },
  { tone: 'playful', en: "Forecast: many 'did you eat?' messages, several times a day, for life.", ta: "முன்னறிவிப்பு: இனி வாழ்நாள் முழுக்க, தினமும் பல முறை 'சாப்பிட்டீங்களா?' மெசேஜ் வரும்." },
  { tone: 'playful', en: 'Come early: the front-row seat and the first round of payasam are yours.', ta: 'சீக்கிரம் வந்துவிடுங்கள்: முன் வரிசை இடமும் முதல் பாயசமும் உங்களுக்குத்தான்.' },
  { tone: 'playful', en: 'Your first big negotiation: whose songs play on the drive.', ta: 'உங்கள் முதல் பெரிய பேச்சுவார்த்தை: பயணத்தில் யாருடைய பாட்டு ஓடும் என்பதுதான்.' },
  { tone: 'playful', en: "You'll finish each other's sentences. And each other's dosas.", ta: 'ஒருவர் பேச்சை இன்னொருவர் முடித்து வைப்பீர்கள். தோசையையும்தான்!' },
  { tone: 'playful', en: "Dear couple, your real fortune isn't in this cookie. It's sitting right beside you.", ta: 'மணமக்களே, உங்கள் உண்மையான அதிர்ஷ்டம் இந்தக் குக்கீயில் இல்லை; பக்கத்திலேயே இருக்கிறது.' },
  { tone: 'playful', en: 'Two toothbrushes, one cup. Everything else is just details.', ta: 'ஒரே டம்ளரில் இரண்டு டூத்பிரஷ். மற்றதெல்லாம் சின்ன விஷயம்.' },
  { tone: 'playful', en: 'Your future is bright, mostly because one of you never switches off the lights.', ta: 'உங்கள் எதிர்காலம் பிரகாசமாக இருக்கும். காரணம், ஒருவர் லைட்டை அணைக்கவே மாட்டார்!' },

  // Poetic
  { tone: 'poetic', en: 'Love is a kolam drawn fresh each morning, never quite the same twice.', ta: 'அன்பு ஒரு கோலம் மாதிரி; தினமும் காலையில் புதிதாகப் போடுவது, ஒருநாளும் ஒரே மாதிரி இருக்காது.' },
  { tone: 'poetic', en: "Like the Vaigai under the sand, love keeps flowing even when you can't see it.", ta: 'மணலுக்கு அடியில் ஓடும் வைகை போல, கண்ணுக்குத் தெரியாதபோதும் அன்பு ஓடிக்கொண்டே இருக்கும்.' },
  { tone: 'poetic', en: 'A lamp loses nothing by lighting another.', ta: 'இன்னொரு விளக்கை ஏற்றுவதால், ஒரு விளக்கு எதையும் இழப்பதில்லை.' },
  { tone: 'poetic', en: "Home is not the walls. It's a voice calling your name from the next room.", ta: 'வீடு என்பது சுவர் இல்லை; பக்கத்து அறையிலிருந்து உங்கள் பெயரைக் கூப்பிடும் ஒரு குரல்.' },
  { tone: 'poetic', en: 'First rain on dry earth: that is what a new beginning smells like.', ta: 'காய்ந்த மண்ணில் விழும் முதல் மழையின் வாசம்: புதுத் தொடக்கம் அப்படித்தான் மணக்கும்.' },
  { tone: 'poetic', en: 'In a sungudi saree, the tied knots become the pattern. So will your bond.', ta: 'சுங்குடிச் சேலையில் கட்டிய முடிச்சுகள்தான் அழகான வடிவமாக மாறும். உங்கள் பந்தமும் அப்படித்தான்.' },
  { tone: 'poetic', en: 'The koel sings before dawn, already sure the sun will come.', ta: 'விடிவதற்கு முன்பே குயில் பாடுகிறது; சூரியன் வரும் என்று அதற்குத் தெரியும்.' },
  { tone: 'poetic', en: 'Some evenings, sitting quietly together on the terrace says everything.', ta: 'சில மாலைகளில், மொட்டை மாடியில் பேசாமல் சேர்ந்து உட்கார்ந்திருப்பதே எல்லாவற்றையும் சொல்லிவிடும்.' },
  { tone: 'poetic', en: 'Tonight you see the same moon from two homes. Soon, from one window.', ta: 'இன்று இரவு இரண்டு வீட்டிலிருந்து ஒரே நிலாவைப் பார்க்கிறீர்கள். சீக்கிரமே ஒரே ஜன்னலிலிருந்து.' },
  { tone: 'poetic', en: 'A kite flies highest when someone steady holds the string.', ta: 'நூலை உறுதியாகப் பிடிக்க ஒருவர் இருந்தால்தான் பட்டம் உயரத்தில் பறக்கும்.' },

  // Food and home
  { tone: 'home', en: 'The best seat in the house: the kitchen at midnight, two plates, one story.', ta: 'வீட்டிலேயே அழகான இடம்: நடுராத்திரியில் சமையலறை, இரண்டு தட்டு, ஒரு கதை.' },
  { tone: 'home', en: 'Hot rasam on a rainy evening fixes almost anything.', ta: 'மழை பெய்யும் மாலையில் ஒரு டம்ளர் சூடான ரசம் போதும்; பாதிக் கவலை பறந்துவிடும்.' },
  { tone: 'home', en: 'May your idlis stay soft and your mornings unhurried.', ta: 'இட்லி எப்போதும் மெத்தென்று இருக்கட்டும்; காலை நேரம் அவசரமில்லாமல் போகட்டும்.' },
  { tone: 'home', en: "Cook together once a week. Burnt or not, it'll be the best meal of the week.", ta: 'வாரம் ஒருமுறை சேர்ந்து சமையுங்கள். கருகினாலும் அதுதான் அந்த வாரத்தின் சிறந்த சாப்பாடு.' },
  { tone: 'home', en: "A banana leaf, a full meal, and someone asking 'a little more?'", ta: "வாழை இலை, வயிறு நிறையச் சாப்பாடு, 'இன்னும் கொஞ்சம் போடட்டுமா?' என்று கேட்க ஒருவர்." },
  { tone: 'home', en: 'Water the plants together. They grow better, and so do you.', ta: 'செடிக்கு இருவரும் சேர்ந்து தண்ணீர் ஊற்றுங்கள். செடியும் செழிக்கும், நீங்களும்தான்.' },
  { tone: 'home', en: 'Sunday mornings: hot pongal and the newspaper split down the middle.', ta: 'ஞாயிறு காலை: சூடான பொங்கல், ஆளுக்குப் பாதி பேப்பர்.' },

  // Travel and adventure
  { tone: 'travel', en: 'Your first trip together will have one wrong turn, and it will be the best part.', ta: 'சேர்ந்து போகும் முதல் பயணத்தில் ஒரு தவறான திருப்பம் வரும்; அதுவே மறக்க முடியாத நினைவாகும்.' },
  { tone: 'travel', en: 'Kodai mist or Kanyakumari waves? Pick one now and save the other for later.', ta: 'கொடைக்கானல் பனியா, கன்னியாகுமரி அலையா? இப்போது ஒன்று; அடுத்ததை அடுத்த முறைக்கு வைத்துக்கொள்ளுங்கள்.' },
  { tone: 'travel', en: 'Pack light, and always stop at the roadside tea stall.', ta: 'பையைக் கொஞ்சமாக எடுத்துக்கொள்ளுங்கள்; வழியில் டீக்கடை வந்தால் கட்டாயம் நிறுத்துங்கள்.' },
  { tone: 'travel', en: 'Somewhere, a sunrise is waiting that only the two of you will see.', ta: 'நீங்கள் இருவர் மட்டும் பார்க்கப்போகும் ஒரு சூரிய உதயம் எங்கோ காத்திருக்கிறது.' },
  { tone: 'travel', en: "Bring back a pebble from every town you visit together. One day they'll tell a story.", ta: 'சேர்ந்து போகும் ஒவ்வொரு ஊரிலிருந்தும் ஒரு கூழாங்கல் எடுத்து வாருங்கள். ஒருநாள் அவை ஒரு கதை சொல்லும்.' },
  { tone: 'travel', en: 'That trip you keep putting off? This is the year.', ta: 'தள்ளிப்போட்டுக்கொண்டே இருக்கும் அந்தப் பயணம்? இந்த வருடமே போய் வாருங்கள்.' },

  // Elders' wisdom
  { tone: 'elders', en: 'Small drops make a flood. Little kindnesses, every day, make a life.', ta: 'சிறு துளி பெரு வெள்ளம். தினமும் காட்டும் சின்ன அன்புதான் பெரிய வாழ்க்கையாகும்.' },
  { tone: 'elders', en: 'No one ever truly lost by giving way a little.', ta: 'கொஞ்சம் விட்டுக்கொடுப்பதால் யாரும் தோற்றுப் போவதில்லை.' },
  { tone: 'elders', en: 'Why pick the raw fruit when the ripe one is right there? Choose the kind word.', ta: 'பழம் இருக்கும்போது காயை ஏன் பறிக்க வேண்டும்? இனிய சொல் இருக்கும்போது கடுஞ்சொல் வேண்டாம்.' },
  { tone: 'elders', en: 'Valluvar says love and goodness at home are its beauty and its reward.', ta: 'வீட்டில் அன்பும் நல்ல குணமும் இருந்தால், அதுவே குடும்ப வாழ்க்கையின் அழகும் பயனும் என்கிறார் வள்ளுவர்.' },
  { tone: 'elders', en: 'Listen all the way to the end before you answer. Half of every quarrel ends there.', ta: 'முழுவதும் கேட்ட பிறகே பதில் சொல்லுங்கள்; பாதிச் சண்டை அங்கேயே தீர்ந்துவிடும்.' },
  { tone: 'elders', en: 'We have seen many monsoons: storms pass, and a roof built together stays.', ta: 'எத்தனையோ மழைக்காலம் பார்த்துவிட்டோம்: புயல் போய்விடும், சேர்ந்து கட்டிய கூரை நிற்கும்.' },
  { tone: 'elders', en: "A full pot doesn't splash, they say. Let your joy be calm and deep.", ta: 'நிறைகுடம் தளும்பாது என்பார்கள். உங்கள் சந்தோஷமும் அமைதியாக, ஆழமாக இருக்கட்டும்.' },
  { tone: 'elders', en: 'Make small promises, and keep every one.', ta: 'சின்னச் சின்ன வாக்குறுதி கொடுங்கள்; ஆனால் ஒவ்வொன்றையும் காப்பாற்றுங்கள்.' },
]

/** Small seeded PRNG (mulberry32), so each device gets its own first fortune. */
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * The next fortune index this device hasn't seen. When all have been seen the
 * cycle starts again. `seed` is per device; `seen` comes from localStorage.
 */
export function nextFortune(seen: number[], seed: number, total = FORTUNES.length): { index: number; seen: number[] } {
  const done = new Set(seen.filter(i => i >= 0 && i < total))
  const pool = done.size >= total ? [] : Array.from({ length: total }, (_, i) => i).filter(i => !done.has(i))
  const fresh = pool.length ? pool : Array.from({ length: total }, (_, i) => i)
  const index = fresh[Math.floor(rng(seed + done.size)() * fresh.length)]
  return { index, seen: pool.length ? [...done, index] : [index] }
}
