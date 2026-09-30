import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion, useInView, useScroll, useTransform } from 'motion/react'
import { useLenis } from 'lenis/react'
import { Icon, type IconName } from '../components/Icon'
import { Badge, Button, Chip, Container, Eyebrow, Img, LangImg, SectionHeading } from '../components/ui'
import { EASE, ImageReveal, Marquee, Parallax, Reveal, RevealText, Stagger, StaggerItem } from '../components/motion'
import { GopuramSkyline, Kolam, KolamCorner, Ornament, TamilOnly, TempleBorder } from '../components/tamil'
import { COMMON, formatINR, useLang, useT, type Bi } from '../lib/i18n'
import { ADDONS, ALBUM, DISTRICTS, EVENTS, PACKAGES, TRAVEL_FREE_KM, TRAVEL_PER_KM, type AddonKey, type EventKey } from '../lib/data'
import { startingPrice } from '../lib/pricing'
import { useDarkHero, useTitle } from '../lib/ui'
import { ClosingCta, FaqList, Numeral, useMedia, type FaqItem } from './content/shared'

// ─── Copy ────────────────────────────────────────────────────────────────────

const TITLE = { en: 'Services & pricing', ta: 'சேவைகள் & கட்டணம்' }

const copy = {
  heroEyebrow: { en: 'Services & pricing', ta: 'சேவைகள் & கட்டணம்' },
  heroTitle: { en: 'Every ceremony,\nbeautifully kept.', ta: 'விழா எதுவானாலும்,\nநினைவு நிலைக்கும்.' },
  heroLead: {
    en: 'Weddings, first birthdays, manjal neerattu, a quiet kaadhu kuthu at the family temple — eight kinds of celebration, one studio that knows the order of every ritual.',
    ta: 'திருமணம், முதல் பிறந்தநாள், மஞ்சள் நீராட்டு, குலதெய்வக் கோயிலில் ஒரு காதுகுத்து — எட்டு வகை விழாக்கள்; ஒவ்வொரு சடங்கின் வரிசையையும் அறிந்த ஒரே ஸ்டுடியோ.',
  },
  seePackages: { en: 'Compare packages', ta: 'தொகுப்புகளை ஒப்பிடுக' },
  factFrom: { en: 'Starting from', ta: 'தொடக்கக் கட்டணம்' },
  factHours: { en: '2 hr minimum', ta: 'குறைந்தது 2 மணிநேரம்' },
  factHoursSub: { en: 'Unlimited digital photos', ta: 'எல்லையற்ற டிஜிட்டல் படங்கள்' },
  factTravel: { en: `Free within ${TRAVEL_FREE_KM} km`, ta: `${TRAVEL_FREE_KM} கி.மீ வரை இலவசம்` },
  factTravelSub: { en: `₹${TRAVEL_PER_KM}/km beyond`, ta: `அதற்கு மேல் கி.மீக்கு ₹${TRAVEL_PER_KM}` },
  factPay: { en: 'Pay offline', ta: 'நேரடிக் கட்டணம்' },
  factPaySub: { en: 'UPI · bank · cash', ta: 'UPI · வங்கி · ரொக்கம்' },

  evEyebrow: { en: 'The ceremonies', ta: 'விழாக்கள்' },
  evTitle: { en: 'What we photograph', ta: 'நாங்கள் படம்பிடிப்பவை' },
  evLead: {
    en: 'Every ceremony has its own rhythm. Scroll through the eight we know by heart — each quote starts with two hours of coverage and unlimited edited photos.',
    ta: 'ஒவ்வொரு விழாவுக்கும் தனி லயம் உண்டு. நாங்கள் மனப்பாடமாக அறிந்த எட்டு விழாக்களைப் பாருங்கள் — ஒவ்வொரு மதிப்பீடும் இரண்டு மணிநேரப் படப்பிடிப்பு, எல்லையற்ற எடிட் செய்த படங்களுடன் தொடங்குகிறது.',
  },
  from: { en: 'From', ta: 'தொடக்கம்' },
  perHour: { en: 'then {x}/hr', ta: 'பிறகு மணிக்கு {x}' },
  covered: { en: 'What’s covered', ta: 'படம்பிடிப்பவை' },
  quote: { en: 'Get a quote', ta: 'மதிப்பீடு பெறுக' },

  pkEyebrow: { en: 'Packages', ta: 'தொகுப்புகள்' },
  pkOne: { en: 'Package', ta: 'தொகுப்பு' },
  pkTitle: { en: 'Three ways to\ntell the story', ta: 'கதை சொல்ல\nமூன்று வழிகள்' },
  pkLead: {
    en: 'Pick a package on top of your event’s base price. You can switch any time before the team meeting.',
    ta: 'உங்கள் விழாவின் அடிப்படைக் கட்டணத்துடன் ஒரு தொகுப்பைச் சேர்க்கவும். குழு கூட்டத்திற்கு முன் எப்போது வேண்டுமானாலும் மாற்றலாம்.',
  },
  included: { en: 'Included', ta: 'அடங்கியது' },
  onTop: { en: 'added to the event base', ta: 'அடிப்படைக் கட்டணத்துடன்' },
  baseOnly: { en: 'event base price only', ta: 'அடிப்படைக் கட்டணம் மட்டும்' },
  popular: { en: 'Most chosen', ta: 'அதிகம் தேர்ந்தது' },
  choose: { en: 'Start with {x}', ta: '{x} உடன் தொடங்கு' },

  adEyebrow: { en: 'Add-ons', ta: 'கூடுதல் சேவைகள்' },
  adTitle: { en: 'Little extras,\nbig moments', ta: 'சிறு சேர்க்கைகள்,\nபெரும் தருணங்கள்' },
  adLead: { en: 'Add any of these while building your quote. Prices are flat, per event.', ta: 'மதிப்பீடு செய்யும்போதே இவற்றைச் சேர்க்கலாம். ஒவ்வொரு விழாவுக்கும் நிலையான கட்டணம்.' },

  prEyebrow: { en: 'How it works', ta: 'செயல்முறை' },
  prTitle: { en: 'From first call\nto the album\nat your door', ta: 'முதல் அழைப்பு முதல்\nவீடு வரும் ஆல்பம் வரை' },
  prLead: { en: 'Seven calm steps. You can follow every one of them live from your client dashboard.', ta: 'ஏழு அமைதியான படிகள். ஒவ்வொன்றையும் உங்கள் வாடிக்கையாளர் பக்கத்தில் நேரலையாகப் பார்க்கலாம்.' },
  prScroll: { en: 'Scroll', ta: 'உருட்டவும்' },

  alEyebrow: { en: 'Album craftsmanship', ta: 'ஆல்பம் கைவினை' },
  alTitle: { en: 'Albums bound to\noutlive us all', ta: 'தலைமுறைகளைத்\nதாண்டும் ஆல்பங்கள்' },
  alLead: {
    en: 'Designed in our Madurai studio, printed on archival papers and hand-bound flat-lay, so every spread opens without a gutter. You choose every material from your dashboard.',
    ta: 'எங்கள் மதுரை ஸ்டுடியோவில் வடிவமைத்து, நீடித்து நிலைக்கும் தாள்களில் அச்சிட்டு, கையால் தைத்த தட்டையான பக்கங்கள் — நடுவில் மடிப்பின்றி முழுப் படமும் விரியும். ஒவ்வொரு பொருளையும் உங்கள் பக்கத்திலேயே தேர்ந்தெடுக்கலாம்.',
  },
  alCovers: { en: 'Covers', ta: 'அட்டைகள்' },
  alPapers: { en: 'Papers', ta: 'தாள்கள்' },
  alColours: { en: 'Colours', ta: 'நிறங்கள்' },
  alSizes: { en: 'Sizes', ta: 'அளவுகள்' },
  alSheets: { en: 'Signature includes 30 sheets, Heirloom 40. Extra sheets are {x} each.', ta: 'சிக்னேச்சரில் 30 தாள்கள், பரம்பரைப் பொக்கிஷத்தில் 40. கூடுதல் தாள் ஒவ்வொன்றும் {x}.' },
  alCap1: { en: 'Flat-lay spreads · no gutter loss', ta: 'தட்டையான பக்கங்கள் · மடிப்பு இழப்பில்லை' },
  alCap2: { en: 'Hand-finished in Madurai', ta: 'மதுரையில் கையால் முடிக்கப்பட்டது' },

  diEyebrow: { en: 'Where we work', ta: 'எங்கள் சேவைப் பகுதிகள்' },
  diTitle: { en: 'Eight districts,\none standard', ta: 'எட்டு மாவட்டங்கள்,\nஒரே தரம்' },
  diLead: {
    en: `Local crews in every district mean no long drives on your day and free travel within ${TRAVEL_FREE_KM} km of each base.`,
    ta: `ஒவ்வொரு மாவட்டத்திலும் உள்ளூர்க் குழு — விழா நாளில் நீண்ட பயணம் இல்லை; ஒவ்வொரு தளத்திலிருந்தும் ${TRAVEL_FREE_KM} கி.மீ வரை பயணம் இலவசம்.`,
  },
  hq: { en: 'Head studio', ta: 'முதன்மை ஸ்டுடியோ' },
  bookHere: { en: 'Book here', ta: 'இங்கே பதிவு' },

  faqEyebrow: { en: 'Questions', ta: 'கேள்விகள்' },
  faqTitle: { en: 'Before you\nbook, ask us', ta: 'பதிவுக்கு முன்\nகேளுங்கள்' },
  faqLead: { en: 'The questions families ask us most. Anything else — we’re a call away.', ta: 'குடும்பங்கள் அடிக்கடி கேட்கும் கேள்விகள். வேறு ஏதேனும் இருந்தால் — ஒரு அழைப்பு போதும்.' },
  faqContact: { en: 'Talk to the studio', ta: 'ஸ்டுடியோவுடன் பேசுங்கள்' },

  ctaEyebrow: { en: 'Your date', ta: 'உங்கள் தேதி' },
  ctaTitle: { en: 'Every muhurtham\ndeserves to be remembered.', ta: 'ஒவ்வொரு முகூர்த்தமும்\nநினைவில் நிலைக்க வேண்டும்.' },
  ctaLead: { en: 'Tell us about your day, and we’ll lovingly hold your date for seven days while your families decide together.', ta: 'உங்கள் விழாவைப் பற்றிச் சொல்லுங்கள் — குடும்பங்கள் கலந்து முடிவெடுக்கும் வரை ஏழு நாட்கள் உங்கள் தேதியை அன்புடன் ஒதுக்கி வைப்போம்.' },
  ctaSecondary: { en: 'Visit the studio', ta: 'ஸ்டுடியோவுக்கு வாருங்கள்' },
}

const RITUALS: Bi[] = [
  { en: 'Muhurtham', ta: 'முகூர்த்தம்' },
  { en: 'Nichayathartham', ta: 'நிச்சயதார்த்தம்' },
  { en: 'Oonjal', ta: 'ஊஞ்சல்' },
  { en: 'Maalai Maatral', ta: 'மாலை மாற்றல்' },
  { en: 'Manjal Neerattu', ta: 'மஞ்சள் நீராட்டு' },
  { en: 'Kaadhu Kuthu', ta: 'காதுகுத்து' },
  { en: 'Peyar Soottu', ta: 'பெயர் சூட்டு' },
  { en: 'Reception', ta: 'வரவேற்பு' },
  { en: 'Outdoor', ta: 'வெளிப்புறம்' },
]

const EVENT_DETAIL: Record<EventKey, { line: Bi; covers: Bi[] }> = {
  wedding: {
    line: {
      en: 'From the dawn muhurtham to the last guest at the reception, we follow the whole day — the sacred and the spontaneous.',
      ta: 'விடியற்காலை முகூர்த்தம் முதல் வரவேற்பின் கடைசி விருந்தினர் வரை — புனிதமும் இயல்பும் கலந்த முழு நாளையும் பின்தொடர்கிறோம்.',
    },
    covers: [
      { en: 'Muhurtham, thaali and saptapadi', ta: 'முகூர்த்தம், தாலி கட்டுதல், சப்தபதி' },
      { en: 'Oonjal, maalai maatral and paal-pazham', ta: 'ஊஞ்சல், மாலை மாற்றல், பால்-பழம்' },
      { en: 'Family portraits and the reception stage', ta: 'குடும்பப் படங்கள் & வரவேற்பு மேடை' },
    ],
  },
  engagement: {
    line: {
      en: 'Nichayathartham is where two families become one. We capture the thattu exchange, the rings and the first shy portraits.',
      ta: 'இரு குடும்பங்கள் ஒன்றாகும் நாள் நிச்சயதார்த்தம். தட்டு மாற்றுதல், மோதிரம், முதல் வெட்கப் புன்னகை — அனைத்தையும் பதிவு செய்கிறோம்.',
    },
    covers: [
      { en: 'Thattu exchange & lagna patrikai', ta: 'தட்டு மாற்றுதல் & லக்னப் பத்திரிகை வாசிப்பு' },
      { en: 'Ring ceremony & couple portraits', ta: 'மோதிரம் மாற்றுதல் & மணமக்கள் படங்கள்' },
      { en: 'Both families, together', ta: 'இரு குடும்பங்களும் ஒன்றாக' },
    ],
  },
  reception: {
    line: {
      en: 'Stage lights, long queues of well-wishers and a dance floor that fills late. Every guest who walks up the stage walks away in a frame.',
      ta: 'மேடை விளக்குகள், வாழ்த்த வரிசையில் நிற்கும் விருந்தினர்கள், இரவில் நிரம்பும் நடன மேடை. மேடைக்கு வரும் ஒவ்வொருவரும் ஒரு படத்தில் இடம்பெறுவர்.',
    },
    covers: [
      { en: 'Every guest on stage, sorted by family', ta: 'மேடையில் ஒவ்வொரு விருந்தினரும், குடும்ப வாரியாக' },
      { en: 'Entry, cake and first dance', ta: 'நுழைவு, கேக், முதல் நடனம்' },
      { en: 'Mahal décor & detail shots', ta: 'மண்டப அலங்காரம் & நுணுக்கப் படங்கள்' },
    ],
  },
  puberty: {
    line: {
      en: 'Manjal Neerattu Vizha is a tender family day. Our team keeps a respectful distance, with women photographers on request.',
      ta: 'மஞ்சள் நீராட்டு விழா ஒரு மென்மையான குடும்ப நாள். எங்கள் குழு மரியாதையான இடைவெளியில் இருக்கும்; விரும்பினால் பெண் புகைப்படக் கலைஞர்கள் மட்டும்.',
    },
    covers: [
      { en: 'Manjal neerattu & aarathi', ta: 'மஞ்சள் நீராட்டு & ஆரத்தி' },
      { en: 'First silk saree portraits', ta: 'முதல் பட்டுப்புடவைப் படங்கள்' },
      { en: 'Thai maaman’s seer & elders’ blessings', ta: 'தாய்மாமன் சீர் & பெரியோர் ஆசீர்வாதம்' },
    ],
  },
  earpiercing: {
    line: {
      en: 'Kaadhu Kuthu is quick and emotional — often at the family temple, on the maternal uncle’s lap. We work fast, quiet and close.',
      ta: 'காதுகுத்து விரைவாக முடியும், உணர்வுமிக்க தருணம் — பெரும்பாலும் குலதெய்வக் கோயிலில், தாய்மாமன் மடியில். நாங்கள் விரைவாக, அமைதியாக, அருகிலிருந்து படம்பிடிக்கிறோம்.',
    },
    covers: [
      { en: 'Temple or home ceremony', ta: 'கோயில் அல்லது வீட்டு விழா' },
      { en: 'Mottai & kaadhu kuthu moments', ta: 'மொட்டை & காதுகுத்துத் தருணங்கள்' },
      { en: 'Thai maaman seer & family feast', ta: 'தாய்மாமன் சீர் & விருந்து' },
    ],
  },
  naming: {
    line: {
      en: 'The first celebration of a new name. Soft window light, gentle hands and a grandmother’s whisper.',
      ta: 'புதிய பெயரின் முதல் கொண்டாட்டம். மென்மையான ஜன்னல் ஒளி, அன்பான கைகள், பாட்டியின் காதோர முணுமுணுப்பு.',
    },
    covers: [
      { en: 'Thottil (cradle) ceremony', ta: 'தொட்டில் இடுதல்' },
      { en: 'The name, whispered in the ear', ta: 'காதில் பெயர் சொல்லுதல்' },
      { en: 'Newborn & three-generation portraits', ta: 'பச்சிளம் குழந்தை & மூன்று தலைமுறைப் படங்கள்' },
    ],
  },
  birthday: {
    line: {
      en: 'From a first birthday to a grandparent’s sixtieth — cake, candles and the candid chaos in between.',
      ta: 'முதல் பிறந்தநாள் முதல் தாத்தா பாட்டியின் அறுபதாம் கல்யாணம் வரை — கேக், மெழுகுவர்த்தி, இடையில் நிகழும் இனிய குழப்பங்கள்.',
    },
    covers: [
      { en: 'Décor, cake table & details', ta: 'அலங்காரம், கேக் மேசை & நுணுக்கங்கள்' },
      { en: 'Candid games & guests', ta: 'விளையாட்டுகள் & விருந்தினர் கேண்டிட்' },
      { en: 'Family portraits on the spot', ta: 'அந்த இடத்திலேயே குடும்பப் படங்கள்' },
    ],
  },
  outdoor: {
    line: {
      en: 'Pre-wedding, maternity or a family portrait walk — temple corridors, paddy fields or the Kodaikanal mist.',
      ta: 'திருமணத்திற்கு முன், தாய்மைக் காலம், அல்லது குடும்பப் படப்பிடிப்பு — கோயில் பிரகாரங்கள், நெல் வயல்கள், கொடைக்கானல் பனிமூட்டம்.',
    },
    covers: [
      { en: 'Location scouting across 8 districts', ta: '8 மாவட்டங்களில் இடத் தேர்வு' },
      { en: 'Styling & posing guidance', ta: 'உடை & போஸ் வழிகாட்டல்' },
      { en: 'Golden-hour & blue-hour sessions', ta: 'பொன்மாலை & நீல மாலை நேரப் படப்பிடிப்பு' },
    ],
  },
}

const ADDON_ICON: Record<AddonKey, IconName> = {
  drone: 'drone',
  ledwall: 'film',
  sameday: 'play',
  extraalbum: 'book',
  preshoot: 'camera',
  booth: 'image',
}

const STEPS: { icon: IconName; title: Bi; body: Bi; when: Bi }[] = [
  {
    icon: 'send',
    title: { en: 'Enquiry', ta: 'விசாரணை' },
    body: { en: 'Build an instant quote online or simply call us. We confirm your date within the day.', ta: 'இணையத்தில் உடனடி மதிப்பீடு பெறுங்கள் அல்லது எங்களை அழையுங்கள். அன்றே தேதியை உறுதி செய்கிறோம்.' },
    when: { en: 'Day 0', ta: 'முதல் நாள்' },
  },
  {
    icon: 'users',
    title: { en: 'Team meeting', ta: 'குழு கூட்டம்' },
    body: { en: 'We plan coverage for your venue, choose lenses and lighting, and assign the crew.', ta: 'உங்கள் இடத்திற்கேற்பப் படப்பிடிப்பைத் திட்டமிட்டு, லென்ஸ், ஒளியமைப்பைத் தேர்ந்து, குழுவை ஒதுக்குகிறோம்.' },
    when: { en: 'Within 3 days', ta: '3 நாட்களுக்குள்' },
  },
  {
    icon: 'heart',
    title: { en: 'Couple / family meeting', ta: 'மணமக்கள் / குடும்பச் சந்திப்பு' },
    body: { en: 'We sit with you — or the elders — to walk through rituals, timings and the must-have shot list.', ta: 'உங்களுடனோ பெரியவர்களுடனோ அமர்ந்து சடங்குகள், நேரம், தவறவிடக் கூடாத படங்களைப் பட்டியலிடுகிறோம்.' },
    when: { en: '2–4 weeks before', ta: '2–4 வாரங்களுக்கு முன்' },
  },
  {
    icon: 'camera',
    title: { en: 'Event day', ta: 'விழா நாள்' },
    body: { en: 'The crew arrives 30 minutes early. Dual-card cameras, backup gear and a quiet presence.', ta: 'குழு 30 நிமிடம் முன்னதாக வரும். இரட்டை மெமரி கார்டு கேமராக்கள், மாற்றுக் கருவிகள், அமைதியான இருப்பு.' },
    when: { en: 'The day', ta: 'அந்த நாள்' },
  },
  {
    icon: 'eye',
    title: { en: 'Online proof selection', ta: 'இணையத்தில் படத் தேர்வு' },
    body: { en: 'A private, watermarked gallery opens in your dashboard. Heart your favourites for the album.', ta: 'உங்கள் பக்கத்தில் தனிப்பட்ட, நீர்க்குறியிட்ட கேலரி திறக்கும். ஆல்பத்திற்குப் பிடித்த படங்களைத் தேர்ந்தெடுங்கள்.' },
    when: { en: 'Within 10 days', ta: '10 நாட்களுக்குள்' },
  },
  {
    icon: 'book',
    title: { en: 'Album design', ta: 'ஆல்பம் வடிவமைப்பு' },
    body: { en: 'Choose cover, paper, size and typography. We design, you approve — two rounds of changes included.', ta: 'அட்டை, தாள், அளவு, எழுத்துருவைத் தேர்ந்தெடுங்கள். நாங்கள் வடிவமைப்போம், நீங்கள் ஒப்புதல் தருவீர்கள் — இரண்டு முறை திருத்தம் இலவசம்.' },
    when: { en: '2–3 weeks', ta: '2–3 வாரங்கள்' },
  },
  {
    icon: 'truck',
    title: { en: 'Delivery', ta: 'ஒப்படைப்பு' },
    body: { en: 'Your hand-bound album and full-resolution files arrive home — with a small thank-you inside.', ta: 'கையால் தைத்த ஆல்பமும் முழுத் தெளிவுப் படங்களும் உங்கள் வீடு வந்து சேரும் — உள்ளே ஒரு சிறு நன்றிக் குறிப்புடன்.' },
    when: { en: '30–45 days', ta: '30–45 நாட்கள்' },
  },
]

const COVER_NOTE: Record<string, Bi> = {
  leather: { en: 'Soft-touch, stitched edges', ta: 'மென்மையான தொடுகை, தைத்த விளிம்புகள்' },
  velvet: { en: 'Deep pile, embossed title', ta: 'அடர்ந்த வெல்வெட், புடைப்புத் தலைப்பு' },
  acrylic: { en: 'Your favourite photo under glass-clear acrylic', ta: 'கண்ணாடி போன்ற அக்ரிலிக்கின் கீழ் உங்கள் விருப்பப் படம்' },
  linen: { en: 'Textured, understated, timeless', ta: 'நெசவு அமைப்பு, எளிமை, காலம் கடந்த அழகு' },
  silk: { en: 'Woven to order with a zari border', ta: 'சரிகைக் கரையுடன் ஆர்டருக்கேற்ப நெய்யப்படுகிறது' },
}

const SIZE_DIM: Record<string, [number, number]> = { '12x36': [36, 12], '12x30': [30, 12], '10x24': [24, 10], '12x12': [24, 12] }

const FAQ: FaqItem[] = [
  {
    q: { en: 'How much advance do we pay to book a date?', ta: 'தேதியைப் பதிவு செய்ய எவ்வளவு முன்பணம் செலுத்த வேண்டும்?' },
    a: {
      en: '30% of the quoted amount confirms your date. 50% is due on the event day and the remaining 20% before the album is dispatched. Every payment is acknowledged with a receipt on WhatsApp.',
      ta: 'மதிப்பீட்டுத் தொகையில் 30% செலுத்தினால் தேதி உறுதியாகும். விழா நாளில் 50%, ஆல்பம் அனுப்பும் முன் மீதமுள்ள 20%. ஒவ்வொரு கட்டணத்திற்கும் ரசீது வாட்ஸ்அப்பில் வரும்.',
    },
  },
  {
    q: { en: 'Do you charge for travel?', ta: 'பயணத்திற்குத் தனிக் கட்டணம் உண்டா?' },
    a: {
      en: `Travel is free within ${TRAVEL_FREE_KM} km of our nearest studio base. Beyond that we add ₹${TRAVEL_PER_KM} per km, shown clearly in your quote before you book. For venues over 150 km away or multi-day events, we also ask for a simple stay for the crew.`,
      ta: `அருகிலுள்ள எங்கள் தளத்திலிருந்து ${TRAVEL_FREE_KM} கி.மீ வரை பயணம் இலவசம். அதற்கு மேல் கி.மீக்கு ₹${TRAVEL_PER_KM} — பதிவுக்கு முன்பே மதிப்பீட்டில் தெளிவாகக் காட்டப்படும். 150 கி.மீக்கு மேல் அல்லது பல நாள் விழாக்களுக்குக் குழுவுக்கு எளிய தங்குமிடம் தேவைப்படும்.`,
    },
  },
  {
    q: { en: 'When will we receive our photos and album?', ta: 'படங்களும் ஆல்பமும் எப்போது கிடைக்கும்?' },
    a: {
      en: 'Your proofing gallery opens within 10 days. The highlight film follows in 3–4 weeks, and the album reaches you 30–45 days after you approve its design. In peak muhurtham months — Thai, Aavani and Karthigai — please allow up to two extra weeks.',
      ta: 'தேர்வு கேலரி 10 நாட்களுக்குள் திறக்கும். ஹைலைட் வீடியோ 3–4 வாரங்களில், வடிவமைப்புக்கு ஒப்புதல் தந்த 30–45 நாட்களில் ஆல்பம் வந்து சேரும். தை, ஆவணி, கார்த்திகை போன்ற முகூர்த்த மாதங்களில் இரண்டு வாரங்கள் கூடுதலாகலாம்.',
    },
  },
  {
    q: { en: 'Will you give us the RAW files?', ta: 'RAW கோப்புகளைத் தருவீர்களா?' },
    a: {
      en: 'We deliver every good frame fully edited in high resolution — usually 600 to 1,500 photos for a wedding. Unedited RAW files are not part of standard packages, but can be shared on request for a small archive fee.',
      ta: 'நல்ல ஒவ்வொரு படத்தையும் முழுமையாக எடிட் செய்து உயர் தெளிவில் தருகிறோம் — ஒரு திருமணத்திற்குப் பொதுவாக 600 முதல் 1,500 படங்கள். எடிட் செய்யாத RAW கோப்புகள் வழக்கமான தொகுப்பில் இல்லை; கோரிக்கையின் பேரில் சிறு கட்டணத்துடன் வழங்கலாம்.',
    },
  },
  {
    q: { en: 'Can you fly a drone at our venue?', ta: 'எங்கள் மண்டபத்தில் ட்ரோன் பறக்க விட முடியுமா?' },
    a: {
      en: 'Yes, with the venue’s permission. We fly a registered drone with a certified pilot under India’s Drone Rules, 2021. Many temples and areas near airports are no-fly zones — if we can’t fly on the day for safety or permission reasons, the drone charge is refunded.',
      ta: 'ஆம், மண்டப நிர்வாகத்தின் அனுமதியுடன். இந்திய ட்ரோன் விதிகள் 2021-இன்படி பதிவுசெய்த ட்ரோனை, சான்றிதழ் பெற்ற இயக்குநர் இயக்குவார். பல கோயில்களும் விமான நிலையத்தின் அருகிலுள்ள பகுதிகளும் பறக்கத் தடை மண்டலங்கள் — பாதுகாப்பு அல்லது அனுமதி காரணமாக அன்று பறக்க இயலாவிட்டால், ட்ரோன் கட்டணம் திருப்பித் தரப்படும்.',
    },
  },
  {
    q: { en: 'Do you offer same-day edits?', ta: 'அன்றே எடிட் செய்து காட்டுவீர்களா?' },
    a: {
      en: 'Yes. Add the Same-day edit reel and an editor on site cuts a 60–90 second film that plays on the big screen before the night ends.',
      ta: 'ஆம். “அன்றே எடிட் ரீல்” சேவையைச் சேர்த்தால், இடத்திலேயே இருக்கும் எடிட்டர் 60–90 வினாடி வீடியோவைத் தயாரித்து, விழா முடியும் முன் பெரிய திரையில் காட்டுவார்.',
    },
  },
  {
    q: { en: 'How do we pay? Is there online payment?', ta: 'எப்படிக் கட்டணம் செலுத்துவது? ஆன்லைன் வசதி உண்டா?' },
    a: {
      en: 'All payments are offline — UPI, bank transfer (NEFT / IMPS) or cash at the studio. We never ask for card details or OTPs. Invoices and receipts are sent on WhatsApp and email.',
      ta: 'அனைத்துக் கட்டணங்களும் நேரடியாக — UPI, வங்கிப் பரிமாற்றம் (NEFT / IMPS) அல்லது ஸ்டுடியோவில் ரொக்கம். கார்டு விவரங்களையோ OTP-யையோ நாங்கள் ஒருபோதும் கேட்பதில்லை. ரசீதுகள் வாட்ஸ்அப்பிலும் மின்னஞ்சலிலும் வரும்.',
    },
  },
  {
    q: { en: 'Can we change our photo selection after submitting?', ta: 'சமர்ப்பித்த பிறகு படத் தேர்வை மாற்றலாமா?' },
    a: {
      en: 'Yes — within 48 hours of submitting, just message us and we’ll reopen your gallery. Once album design has begun, changes are still possible but may add a small re-design fee per spread.',
      ta: 'ஆம் — சமர்ப்பித்த 48 மணி நேரத்திற்குள் ஒரு செய்தி அனுப்பினால் கேலரியை மீண்டும் திறப்போம். ஆல்பம் வடிவமைப்பு தொடங்கிய பின்பும் மாற்றலாம்; ஆனால் ஒவ்வொரு பக்கத்திற்கும் சிறு மறுவடிவமைப்புக் கட்டணம் இருக்கலாம்.',
    },
  },
]

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Services() {
  useTitle(TITLE)
  useDarkHero()
  return (
    <>
      <Hero />
      <RitualMarquee />
      <EventsSection />
      <Packages />
      <Addons />
      <Process />
      <AlbumCraft />
      <Districts />
      <Faq />
      <Cta />
    </>
  )
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function Hero() {
  const t = useT(copy)
  const c = useT(COMMON)
  const lenis = useLenis()
  const minPrice = Math.min(...EVENTS.map(e => startingPrice(e.key)))
  const facts = [
    { k: t.factFrom, v: formatINR(minPrice) },
    { k: t.factHoursSub, v: t.factHours },
    { k: t.factTravelSub, v: t.factTravel },
    { k: t.factPaySub, v: t.factPay },
  ]
  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden bg-ink text-white">
      <Parallax className="absolute inset-0 -z-10" offset={110}>
        <LangImg pair={{ en: 'm_couple_lights', ta: 't_couple_seated' }} className="h-full w-full" w={2200} priority dark imgClassName="animate-kenburns" />
      </Parallax>
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/55 to-ink/35" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/70 via-transparent to-transparent" />
      <TamilOnly>
        <GopuramSkyline className="pointer-events-none absolute inset-x-0 bottom-0 -z-10" color="#c0163c" opacity={0.28} />
      </TamilOnly>

      <Container wide className="flex min-h-[100svh] flex-col justify-end pb-8 pt-32 md:pb-14 md:pt-44">
        <Reveal>
          <Eyebrow dark>{t.heroEyebrow}</Eyebrow>
        </Reveal>
        <RevealText as="h1" immediate delay={0.15} text={t.heroTitle} className="t-hero mt-6 max-w-5xl text-white" />
        <Reveal delay={0.45}>
          <p className="t-lead mt-6 max-w-xl text-white/70 md:mt-7">{t.heroLead}</p>
        </Reveal>
        <Reveal delay={0.6} className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap md:mt-9">
          <Button to="/book" size="lg" icon="arrowRight" className="w-full sm:w-auto">{c.getQuote}</Button>
          <Button size="lg" variant="glass-dark" className="w-full sm:w-auto" onClick={() => lenis?.scrollTo('#packages', { offset: -40 })}>{t.seePackages}</Button>
        </Reveal>

        <Reveal delay={0.75} className="mt-10 md:mt-16">
          <dl className="glass-dark grid grid-cols-2 overflow-hidden rounded-[22px] md:grid-cols-4 md:rounded-[24px]">
            {facts.map((f, i) => (
              <div key={i} className={`min-w-0 px-4 py-4 sm:px-5 sm:py-5 md:px-7 md:py-6 ${i % 2 ? 'border-l border-white/10' : ''} ${i > 1 ? 'border-t border-white/10 md:border-t-0' : ''} ${i === 2 ? 'md:border-l' : ''}`}>
                <dt className="t-label text-white/45">{f.k}</dt>
                <dd className="mt-1.5 font-display text-[1.3rem] leading-tight text-white sm:mt-2 sm:text-2xl md:text-[1.7rem]">{f.v}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </Container>
    </section>
  )
}

function RitualMarquee() {
  const lang = useLang()
  return (
    <div className="relative border-b border-ink/10 bg-white py-6 md:py-9">
      <Marquee speed={48}>
        {RITUALS.map((r, i) => (
          <span key={i} className="flex items-center">
            <span className={`whitespace-nowrap px-5 font-display text-[1.7rem] text-ink sm:px-6 sm:text-3xl md:px-10 md:text-5xl ${lang === 'ta' ? 'font-semibold' : 'italic-accent'}`}>{r[lang]}</span>
            {lang === 'ta' ? <Kolam size={26} animate={false} className="text-ruby" strokeWidth={2.4} /> : <span className="h-2 w-2 rotate-45 bg-ruby" aria-hidden="true" />}
          </span>
        ))}
      </Marquee>
    </div>
  )
}

// ─── Events: pinned image + scrolling list ───────────────────────────────────

function EventsSection() {
  const t = useT(copy)
  const lang = useLang()
  const [active, setActive] = useState(0)
  const ev = EVENTS[active]
  return (
    <section className="relative py-24 md:py-36">
      <Container wide>
        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <SectionHeading eyebrow={t.evEyebrow} title={t.evTitle} lead={t.evLead} size="t-1" />
          <Reveal delay={0.2} className="hidden md:block">
            <p className="t-label text-right text-ink/40">{String(EVENTS.length).padStart(2, '0')} · {lang === 'ta' ? 'விழாக்கள்' : 'ceremonies'}</p>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-16 md:mt-16 lg:mt-20 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-20">
          {/* Pinned photo (desktop) */}
          <div className="hidden lg:block">
            <div className="sticky top-28 h-[calc(100svh-9rem)] min-h-[520px] overflow-hidden rounded-[32px] bg-ink">
              {EVENTS.map((e, i) => (
                <motion.div
                  key={e.key}
                  className="absolute inset-0"
                  initial={false}
                  animate={{ opacity: i === active ? 1 : 0, scale: i === active ? 1 : 1.08 }}
                  transition={{ duration: 1.1, ease: EASE }}
                  aria-hidden={i !== active}
                >
                  <LangImg pair={e.img} className="h-full w-full" w={1400} sizes="50vw" dark />
                </motion.div>
              ))}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
              <TamilOnly>
                <TempleBorder className="absolute inset-x-0 top-0" flip />
              </TamilOnly>

              {/* progress rail */}
              <div className="absolute right-5 top-1/2 flex -translate-y-1/2 flex-col gap-2" aria-hidden="true">
                {EVENTS.map((e, i) => (
                  <span key={e.key} className={`w-[3px] rounded-full transition-all duration-500 ${i === active ? 'h-8 bg-white' : 'h-3 bg-white/35'}`} />
                ))}
              </div>

              <div className="absolute inset-x-5 bottom-5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={ev.key + lang}
                    initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -8, filter: 'blur(6px)' }}
                    transition={{ duration: 0.5, ease: EASE }}
                    className="glass-dark flex items-center justify-between gap-4 rounded-[22px] px-6 py-5"
                  >
                    <div className="min-w-0">
                      <p className="t-label text-white/50">{String(active + 1).padStart(2, '0')} / {String(EVENTS.length).padStart(2, '0')}</p>
                      <p className="mt-1 truncate font-display text-2xl text-white">{ev.name[lang]}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="t-label text-white/50">{t.from}</p>
                      <p className="mt-1 font-display text-2xl text-white">{formatINR(startingPrice(ev.key))}</p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Scrolling list */}
          <div className="flex flex-col gap-16 md:gap-20 lg:gap-0">
            {EVENTS.map((e, i) => (
              <EventRow key={e.key} index={i} active={i === active} onActive={setActive} />
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}

function EventRow({ index, active, onActive }: { index: number; active: boolean; onActive: (i: number) => void }) {
  const t = useT(copy)
  const lang = useLang()
  const e = EVENTS[index]
  const detail = EVENT_DETAIL[e.key]
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { margin: '-45% 0px -45% 0px' })
  const lg = useMedia('(min-width: 1024px)')
  useEffect(() => {
    if (inView) onActive(index)
  }, [inView, onActive, index])

  return (
    <article
      ref={ref}
      onMouseEnter={lg ? () => onActive(index) : undefined}
      className={`relative transition-opacity duration-700 lg:flex lg:min-h-[78svh] lg:flex-col lg:justify-center lg:border-t lg:border-ink/10 lg:py-16 ${lg && !active ? 'lg:opacity-30' : 'opacity-100'}`}
    >
      <ImageReveal className="mb-6 aspect-[4/3] rounded-[22px] sm:mb-8 sm:aspect-[16/11] sm:rounded-[26px] lg:hidden">
        <LangImg pair={e.img} className="h-full w-full" w={1000} />
      </ImageReveal>

      <div className="flex items-baseline gap-3 md:gap-4">
        <Numeral n={index + 1} className="text-5xl md:text-6xl" />
        <span className="t-label text-ruby">{e.blurb[lang]}</span>
      </div>
      <h3 className="t-1 mt-4 text-ink">{e.name[lang]}</h3>
      <p className="t-lead mt-4 max-w-xl text-ink/60 md:mt-5">{detail.line[lang]}</p>

      <p className="t-label mt-6 text-ink/40 md:mt-8">{t.covered}</p>
      <ul className="mt-3 space-y-2.5">
        {detail.covers.map((c, i) => (
          <li key={i} className="flex items-start gap-3 text-[15px] text-ink/75">
            <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rotate-45 bg-ruby" aria-hidden="true" />
            {c[lang]}
          </li>
        ))}
      </ul>

      <div className="mt-7 flex flex-wrap items-end justify-between gap-x-6 gap-y-4 sm:justify-start md:mt-9 md:items-center">
        <div>
          <p className="t-label text-ink/40">{t.from}</p>
          <p className="mt-1 font-display text-3xl leading-none text-ink">{formatINR(startingPrice(e.key))}</p>
          <p className="mt-1.5 text-xs text-ink/45">{t.perHour.replace('{x}', formatINR(e.hourly))}</p>
        </div>
        <Button to={`/book?event=${e.key}`} variant={active ? 'ruby' : 'outline'} icon="arrowRight">{t.quote}</Button>
      </div>
    </article>
  )
}

// ─── Packages ────────────────────────────────────────────────────────────────

function Packages() {
  const t = useT(copy)
  const lang = useLang()
  return (
    <section id="packages" className="relative isolate overflow-hidden bg-mist py-24 md:py-36">
      <div className="ambient absolute inset-0 -z-10" />
      <TamilOnly>
        <div className="kolam-bg pointer-events-none absolute inset-0 -z-10 opacity-[0.07]" />
      </TamilOnly>
      <Container wide>
        <SectionHeading eyebrow={t.pkEyebrow} title={t.pkTitle} lead={t.pkLead} align="center" size="t-1" />

        <Stagger className="mx-auto mt-12 grid max-w-6xl gap-4 md:mt-20 md:gap-5 lg:grid-cols-3 lg:items-stretch" gap={0.12}>
          {PACKAGES.map(p => {
            const hi = !!p.popular
            return (
              <StaggerItem key={p.key} className={hi ? 'lg:-my-4' : ''}>
                <div
                  className={`relative flex h-full flex-col overflow-hidden rounded-[26px] p-6 transition-transform md:rounded-[30px] duration-500 hover:-translate-y-1 md:p-9 ${
                    hi ? 'bg-ink text-white shadow-[0_40px_80px_-30px_rgba(140,13,43,0.55)]' : 'glass-strong text-ink'
                  }`}
                >
                  {hi && <div className="ambient-dark pointer-events-none absolute inset-0 opacity-90" />}
                  <TamilOnly>
                    <KolamCorner className="absolute right-3 top-3 rotate-90 opacity-80" />
                  </TamilOnly>
                  <div className="relative flex items-center justify-between gap-3">
                    <p className={`t-label ${hi ? 'text-white/55' : 'text-ink/45'}`}>{t.pkOne}</p>
                    {hi && <Badge tone="ruby">{t.popular}</Badge>}
                  </div>
                  <h3 className="t-2 relative mt-3">{p.name[lang]}</h3>
                  <p className={`relative mt-3 text-[15px] leading-relaxed ${hi ? 'text-white/65' : 'text-ink/60'}`}>{p.pitch[lang]}</p>

                  <div className={`relative mt-6 border-t pt-5 md:mt-8 md:pt-6 ${hi ? 'border-white/10' : 'border-ink/10'}`}>
                    <p className="font-display text-4xl leading-none md:text-5xl">{p.add ? `+ ${formatINR(p.add)}` : t.included}</p>
                    <p className={`mt-2 text-xs ${hi ? 'text-white/45' : 'text-ink/45'}`}>{p.add ? t.onTop : t.baseOnly}</p>
                  </div>

                  <ul className="relative mt-6 flex-1 space-y-3 md:mt-8 md:space-y-3.5">
                    {p.includes.map((inc, i) => (
                      <li key={i} className="flex items-start gap-3 text-[15px]">
                        <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${hi ? 'bg-ruby text-white' : 'bg-ruby-soft text-ruby'}`}>
                          <Icon name="check" size={12} strokeWidth={2.6} />
                        </span>
                        <span className={i === 0 && p.key !== 'essential' ? (hi ? 'text-white/55' : 'text-ink/50') : ''}>{inc[lang]}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="relative mt-8 md:mt-10">
                    <Button to="/book" variant={hi ? 'ruby' : 'ink'} full icon="arrowRight">
                      {t.choose.replace('{x}', p.name[lang])}
                    </Button>
                  </div>
                </div>
              </StaggerItem>
            )
          })}
        </Stagger>
      </Container>
    </section>
  )
}

// ─── Add-ons ─────────────────────────────────────────────────────────────────

function Addons() {
  const t = useT(copy)
  const lang = useLang()
  return (
    <section className="py-24 md:py-36">
      <Container wide>
        <div className="grid gap-10 md:gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <SectionHeading eyebrow={t.adEyebrow} title={t.adTitle} lead={t.adLead} />
            <Reveal delay={0.25}>
              <ImageReveal className="mt-10 hidden aspect-[4/3] rounded-[26px] lg:block">
                <LangImg pair={{ en: 'm_rec_dance', ta: 't_marigold_strings' }} className="h-full w-full" w={900} />
              </ImageReveal>
            </Reveal>
          </div>
          <Stagger className="grid gap-3 sm:grid-cols-2 md:gap-4" gap={0.07}>
            {ADDONS.map(a => (
              <StaggerItem key={a.key}>
                <div className="group relative flex h-full flex-col rounded-[22px] border border-ink/10 bg-white p-5 sm:rounded-[26px] sm:p-6 transition-all duration-500 hover:-translate-y-1 hover:border-ruby/30 hover:shadow-soft md:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-white transition-colors duration-500 group-hover:bg-ruby">
                      <Icon name={ADDON_ICON[a.key]} size={22} />
                    </span>
                    <span className="font-display text-2xl text-ink">{formatINR(a.price)}</span>
                  </div>
                  <h3 className="t-3 mt-5 text-ink sm:mt-8">{a.name[lang]}</h3>
                  <p className="mt-2 text-[15px] text-ink/55">{a.note[lang]}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </Container>
    </section>
  )
}

// ─── Process: horizontal pinned track on desktop, timeline on mobile ─────────

function Process() {
  const t = useT(copy)
  const lang = useLang()
  const lg = useMedia('(min-width: 1024px)')
  const wrap = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [dist, setDist] = useState(0)

  useLayoutEffect(() => {
    if (!lg) return
    const measure = () => {
      if (track.current) setDist(Math.max(0, track.current.scrollWidth - window.innerWidth))
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (track.current) ro.observe(track.current)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [lg, lang])

  const { scrollYProgress } = useScroll({ target: wrap, offset: ['start start', 'end end'] })
  const x = useTransform(scrollYProgress, [0, 1], [0, -dist])
  const bar = useTransform(scrollYProgress, [0, 1], [0, 1])

  const intro = (
    <div className="flex flex-col justify-center">
      <TamilOnly>
        <Kolam size={52} className="mb-6 text-ruby-bright" />
      </TamilOnly>
      <Eyebrow dark>{t.prEyebrow}</Eyebrow>
      <RevealText text={t.prTitle} className="t-1 mt-5 text-white" />
      <p className="t-lead mt-6 max-w-md text-white/55">{t.prLead}</p>
    </div>
  )

  if (lg) {
    return (
      <section ref={wrap} className="relative bg-ink text-white" style={{ height: `calc(100svh + ${dist}px)` }}>
        <div className="sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden">
          <div className="ambient-dark grain absolute inset-0" />
          <motion.div ref={track} style={{ x }} className="relative flex w-max items-stretch gap-6 pl-[max(2rem,calc((100vw_-_1440px)/2_+_2rem))] pr-[12vw]">
            <div className="w-[min(40vw,520px)] shrink-0 pr-10">{intro}</div>
            {STEPS.map((s, i) => (
              <StepCard key={i} i={i} step={s} />
            ))}
          </motion.div>
          <div className="absolute inset-x-8 bottom-10 mx-auto flex max-w-[1376px] items-center gap-5">
            <span className="t-label text-white/40">{t.prScroll}</span>
            <div className="h-px flex-1 bg-white/10">
              <motion.div style={{ scaleX: bar }} className="h-px origin-left bg-ruby-bright" />
            </div>
            <span className="t-label text-white/40">07</span>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section ref={wrap} className="relative isolate overflow-hidden bg-ink py-20 text-white md:py-24">
      <div className="ambient-dark grain absolute inset-0 -z-10" />
      <Container>
        {intro}
        <ol className="relative mt-12 space-y-4 border-l border-white/12 pl-5 md:mt-14 md:space-y-5 md:pl-6">
          {STEPS.map((s, i) => (
            <Reveal as="li" key={i} className="relative">
              <span className="absolute -left-[25.5px] top-[39px] h-2.5 w-2.5 sm:top-[43px] md:-left-[29.5px] rounded-full bg-ruby-bright ring-4 ring-ink" aria-hidden="true" />
              <StepCard i={i} step={s} compact />
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  )
}

function StepCard({ i, step, compact = false }: { i: number; step: (typeof STEPS)[number]; compact?: boolean }) {
  const lang = useLang()
  return (
    <div className={`glass-dark relative flex shrink-0 flex-col rounded-[28px] ${compact ? 'p-5 sm:p-6' : 'h-[min(62svh,520px)] w-[340px] p-8 xl:w-[380px]'}`}>
      <div className="flex items-start justify-between">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
          <Icon name={step.icon} size={22} />
        </span>
        <Numeral n={i + 1} dark className={compact ? 'text-5xl' : 'text-7xl xl:text-8xl'} />
      </div>
      <div className={compact ? 'mt-6' : 'mt-auto'}>
        <span className="inline-flex rounded-full bg-ruby/90 px-3 py-1 text-[11px] font-semibold tracking-wide text-white">{step.when[lang]}</span>
        <h3 className="t-3 mt-4 text-white">{step.title[lang]}</h3>
        <p className="mt-3 text-[15px] leading-relaxed text-white/60">{step.body[lang]}</p>
      </div>
    </div>
  )
}

// ─── Album craftsmanship ─────────────────────────────────────────────────────

type AlbumTab = 'covers' | 'papers' | 'colours' | 'sizes'

function AlbumCraft() {
  const t = useT(copy)
  const lang = useLang()
  const [tab, setTab] = useState<AlbumTab>('covers')
  const tabs: { key: AlbumTab; label: string }[] = [
    { key: 'covers', label: t.alCovers },
    { key: 'papers', label: t.alPapers },
    { key: 'colours', label: t.alColours },
    { key: 'sizes', label: t.alSizes },
  ]
  return (
    <section className="relative overflow-hidden py-24 md:py-36">
      <Container wide>
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          {/* Collage */}
          <div className="relative pb-14 sm:pb-24">
            <ImageReveal className="aspect-[4/5] w-[86%] rounded-[24px] md:rounded-[30px]">
              <Parallax className="h-full" offset={50}>
                <LangImg pair={{ en: 'm_album_open', ta: 't_jewel_temple' }} className="h-full w-full" w={1100} />
              </Parallax>
            </ImageReveal>
            <ImageReveal delay={0.25} className="absolute bottom-0 right-0 aspect-[4/3] w-[56%] rounded-[20px] border-[5px] border-white md:rounded-[24px] md:border-[6px]">
              <LangImg pair={{ en: 'm_album_bw', ta: 't_saree_gold' }} className="h-full w-full" w={800} />
            </ImageReveal>
            <Reveal delay={0.5} className="absolute left-3 top-3 max-w-[calc(86%-24px)] md:left-6 md:top-6 md:max-w-none">
              <span className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[12px] font-medium leading-snug text-ink md:px-4 md:text-[12.5px] md:leading-normal">
                <Icon name="sparkle" size={14} className="shrink-0 text-ruby" />
                {t.alCap2}
              </span>
            </Reveal>
          </div>

          {/* Materials */}
          <div>
            <SectionHeading eyebrow={t.alEyebrow} title={t.alTitle} lead={t.alLead} />
            <Reveal delay={0.2} className="mt-8 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap md:mt-10">
              {tabs.map(x => (
                <Chip key={x.key} active={tab === x.key} onClick={() => setTab(x.key)} className="justify-center sm:justify-start">{x.label}</Chip>
              ))}
            </Reveal>

            <div className="relative mt-6 min-h-[300px] md:mt-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab + lang}
                  initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -8, filter: 'blur(6px)' }}
                  transition={{ duration: 0.45, ease: EASE }}
                >
                  {tab === 'covers' && (
                    <ul className="divide-y divide-ink/10 border-y border-ink/10">
                      {ALBUM.covers.map(cv => (
                        <li key={cv.key} className="flex items-center justify-between gap-4 py-3.5 md:py-4">
                          <span className="font-display text-xl text-ink md:text-2xl">{cv.name[lang]}</span>
                          <span className="max-w-[60%] text-right text-[13px] leading-snug text-ink/50 md:max-w-none md:text-[13.5px] md:leading-normal">{COVER_NOTE[cv.key]?.[lang]}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {tab === 'papers' && (
                    <div className="grid grid-cols-2 gap-3">
                      {ALBUM.papers.map(p => (
                        <div key={p.key} className="rounded-[18px] border border-ink/10 bg-white p-4 sm:rounded-[22px] sm:p-5">
                          <div className="mb-4 h-12 rounded-xl bg-gradient-to-br from-mist via-white to-smoke sm:mb-5 sm:h-16" aria-hidden="true" />
                          <p className="font-display text-lg leading-tight text-ink sm:text-xl sm:leading-normal">{p.name[lang]}</p>
                          <p className="mt-1 text-[13.5px] text-ink/50">{p.note[lang]}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {tab === 'colours' && (
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 sm:gap-4">
                      {ALBUM.colors.map(cl => (
                        <div key={cl.key} className="flex flex-col items-center text-center">
                          <span className="aspect-[3/4] w-full rounded-xl border border-ink/10 shadow-soft" style={{ background: `linear-gradient(135deg, ${cl.hex}, ${cl.hex} 60%, rgba(255,255,255,0.12))`, backgroundColor: cl.hex }} />
                          <span className="mt-3 text-[13px] font-medium text-ink/70">{cl.name[lang]}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {tab === 'sizes' && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 sm:gap-5">
                      {ALBUM.sizes.map(s => {
                        const [w, h] = SIZE_DIM[s.key] ?? [24, 12]
                        return (
                          <div key={s.key} className="flex flex-col">
                            <div className="flex h-24 items-end">
                              <span className="block rounded-md border border-ink/15 bg-gradient-to-br from-white to-mist shadow-soft" style={{ width: `${(w / 36) * 100}%`, aspectRatio: `${w} / ${h}` }}>
                                <span className="mx-auto block h-full w-px bg-ink/10" />
                              </span>
                            </div>
                            <p className="mt-3 font-display text-xl text-ink">{s.name}</p>
                            <p className="text-[13px] text-ink/50">{s.note[lang]}</p>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
            <Reveal>
              <p className="mt-6 flex items-start gap-2.5 text-[13.5px] text-ink/50">
                <Icon name="info" size={16} className="mt-0.5 shrink-0 text-ruby" />
                {t.alSheets.replace('{x}', formatINR(ALBUM.sheetPrice))} · {t.alCap1}
              </p>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  )
}

// ─── Districts ───────────────────────────────────────────────────────────────

function Districts() {
  const t = useT(copy)
  const lang = useLang()
  return (
    <section className="relative bg-ink py-24 text-white md:py-36">
      <TamilOnly>
        <TempleBorder className="absolute inset-x-0 top-0" flip />
      </TamilOnly>
      <Container wide>
        <div className="grid gap-8 md:grid-cols-2 md:items-end">
          <SectionHeading eyebrow={t.diEyebrow} title={t.diTitle} dark size="t-1" />
          <Reveal delay={0.2}>
            <p className="t-lead max-w-md text-white/60 md:ml-auto">{t.diLead}</p>
          </Reveal>
        </div>
        <Stagger className="mt-12 grid grid-cols-2 gap-3 md:mt-20 md:gap-4 lg:grid-cols-4" gap={0.06}>
          {DISTRICTS.map(d => {
            const hq = d.key === 'madurai'
            return (
              <StaggerItem key={d.key}>
                <Link to={`/book?district=${d.key}`} className="group relative block aspect-[3/4] overflow-hidden rounded-[22px] md:rounded-[28px]">
                  <Img k={d.img} w={700} sizes="(min-width:1024px) 25vw, 50vw" dark className="absolute inset-0 h-full w-full" imgClassName="transition-transform duration-[1.4s] ease-out group-hover:scale-[1.06]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
                  {hq && (
                    <span className="glass-ruby absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-semibold md:left-4 md:top-4">{t.hq}</span>
                  )}
                  <div className="absolute inset-x-2.5 bottom-2.5 rounded-[18px] p-3 md:inset-x-3 md:bottom-3 md:p-4 glass-dark">
                    <p className="font-display text-lg leading-tight text-white md:text-2xl">{d.name[lang]}</p>
                    <p className="mt-1 line-clamp-2 text-[11.5px] leading-snug text-white/60 md:text-[13px]">{d.note[lang]}</p>
                    <span className="mt-2 hidden items-center gap-1 text-[12px] font-medium text-white/80 transition group-hover:text-white md:inline-flex">
                      {t.bookHere}
                      <Icon name="arrowUpRight" size={13} />
                    </span>
                  </div>
                </Link>
              </StaggerItem>
            )
          })}
        </Stagger>
      </Container>
    </section>
  )
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

function Faq() {
  const t = useT(copy)
  return (
    <section className="py-24 md:py-36">
      <Container wide>
        <div className="grid gap-10 md:gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <SectionHeading eyebrow={t.faqEyebrow} title={t.faqTitle} lead={t.faqLead} size="t-1" />
            <Reveal delay={0.3} className="mt-7 md:mt-8">
              <Button to="/contact" variant="outline" icon="arrowRight" className="w-full sm:w-auto">{t.faqContact}</Button>
            </Reveal>
            <TamilOnly>
              <Ornament className="mt-12 !justify-start" />
            </TamilOnly>
          </div>
          <Reveal delay={0.1}>
            <FaqList items={FAQ} />
          </Reveal>
        </div>
      </Container>
    </section>
  )
}

function Cta() {
  const t = useT(copy)
  const c = useT(COMMON)
  return (
    <ClosingCta
      eyebrow={t.ctaEyebrow}
      title={t.ctaTitle}
      lead={t.ctaLead}
      pair={{ en: 'm_couple_night', ta: 't_lamp_many' }}
      primary={{ label: c.getQuote, to: '/book' }}
      secondary={{ label: t.ctaSecondary, to: '/contact' }}
    />
  )
}
