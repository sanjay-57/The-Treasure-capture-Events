import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'motion/react'
import { Icon, type IconName } from '../components/Icon'
import { Container, Eyebrow, IconButton, Img, LangImg, SectionHeading } from '../components/ui'
import { Counter, EASE, ImageReveal, Parallax, Reveal, RevealText, Stagger, StaggerItem } from '../components/motion'
import { GopuramSkyline, Kolam, KolamCorner, Ornament, TamilOnly, TempleBorder, Vilakku } from '../components/tamil'
import { COMMON, useLang, useT, type Bi } from '../lib/i18n'
import { DISTRICTS, ROLES, SEED_WORKERS, type DistrictKey } from '../lib/data'
import type { ImgKey } from '../lib/images'
import { useDarkHero, useTitle } from '../lib/ui'
import { CenterIntro, ClosingCta } from './content/shared'

// ─── Copy ────────────────────────────────────────────────────────────────────

const TITLE = { en: 'The Studio', ta: 'எங்களைப் பற்றி' }

const copy = {
  heroEyebrow: { en: 'The Studio · Madurai · Est. 2018', ta: 'ஸ்டுடியோ · மதுரை · 2018 முதல்' },
  heroTitle: { en: 'Rooted in Madurai.\nMade for memory.', ta: 'மதுரையில் வேரூன்றி,\nநினைவுகளில் நிலைத்து.' },
  heroLead: {
    en: 'We began in 2018 with one camera and a small room on West Masi Street. Today forty-odd photographers, filmmakers and album artisans carry the same promise across eight districts: see the ritual, respect the family, and make something that lasts.',
    ta: '2018-இல் ஒரே ஒரு கேமராவுடன், மேற்கு மாசி வீதியில் ஒரு சிறு அறையில் தொடங்கினோம். இன்று நாற்பதுக்கும் மேற்பட்ட புகைப்படக் கலைஞர்கள், ஒளிப்பதிவாளர்கள், ஆல்பக் கைவினைஞர்கள் எட்டு மாவட்டங்களில் அதே வாக்குறுதியைச் சுமந்து செல்கிறார்கள்: சடங்கைப் புரிந்துகொள், குடும்பத்தை மதி, நிலைத்து நிற்பதை உருவாக்கு.',
  },
  scroll: { en: 'Our story', ta: 'எங்கள் கதை' },

  storyEyebrow: { en: 'Our story', ta: 'எங்கள் கதை' },
  quote: {
    en: 'We don’t direct your day. We learn it — every ritual, every elder, every in-between — and then we stay out of its way.',
    ta: 'உங்கள் விழாவை நாங்கள் இயக்குவதில்லை. ஒவ்வொரு சடங்கையும், ஒவ்வொரு பெரியவரையும், இடையில் நிகழும் ஒவ்வொரு தருணத்தையும் முதலில் அறிந்துகொள்கிறோம் — பிறகு அதன் வழியில் குறுக்கிடாமல் நிற்கிறோம்.',
  },
  quoteBy: { en: 'The studio’s first rule', ta: 'ஸ்டுடியோவின் முதல் விதி' },

  numEyebrow: { en: 'In numbers', ta: 'எண்களில்' },
  numEvents: { en: 'Celebrations photographed', ta: 'படம்பிடித்த விழாக்கள்' },
  numDistricts: { en: 'Districts with local crews', ta: 'உள்ளூர்க் குழுக்கள் உள்ள மாவட்டங்கள்' },
  numAwards: { en: 'Photography awards', ta: 'புகைப்பட விருதுகள்' },
  numCrew: { en: 'Photographers, filmmakers & artisans', ta: 'கலைஞர்கள், ஒளிப்பதிவாளர்கள் & கைவினைஞர்கள்' },

  valEyebrow: { en: 'What we believe', ta: 'எங்கள் நம்பிக்கைகள்' },
  valTitle: { en: 'Four promises we\nkeep at every event', ta: 'ஒவ்வொரு விழாவிலும்\nகாக்கும் நான்கு வாக்குறுதிகள்' },

  ritEyebrow: { en: 'Tradition', ta: 'மரபு' },
  ritTitle: { en: 'How we honour\nthe ritual', ta: 'சடங்குகளைப்\nபோற்றும் விதம்' },
  ritLead: {
    en: 'A Tamil ceremony is choreography handed down for centuries. We learn its order before we lift a camera.',
    ta: 'தமிழ்ச் சடங்கு என்பது நூற்றாண்டுகளாகக் கைமாறி வந்த ஒரு நடனம். கேமராவைத் தூக்கும் முன்பே அதன் வரிசையைக் கற்றுக்கொள்கிறோம்.',
  },
  templeTitle: { en: 'Temple weddings', ta: 'கோயில் திருமணங்கள்' },
  templeBody: {
    en: 'Meenakshi Amman, Thiruparankundram, Pazhamudircholai — every temple has its own photography rules. We never shoot inside the sanctum or interrupt the priest, and we help you secure permissions well in advance.',
    ta: 'மீனாட்சி அம்மன் கோயில், திருப்பரங்குன்றம், பழமுதிர்சோலை — ஒவ்வொரு கோயிலுக்கும் தனிப் புகைப்பட விதிகள் உண்டு. கருவறையில் படம் எடுப்பதில்லை; அர்ச்சகரின் பணிக்கு இடையூறு செய்வதில்லை. தேவையான அனுமதிகளை முன்கூட்டியே பெற உங்களுக்கு உதவுகிறோம்.',
  },
  lampTitle: { en: 'The first light', ta: 'முதல் தீபம்' },
  lampBody: {
    en: 'No flash when the kuthu vilakku is lit. The flame must be the brightest light in the frame — that is our rule. We wait until all five faces glow.',
    ta: 'குத்துவிளக்கு ஏற்றும் தருணத்தில் ஃபிளாஷ் இல்லை. சுடரே சட்டகத்தின் பிரகாசமான ஒளியாக இருக்க வேண்டும் — அதுவே எங்கள் விதி. ஐந்து முகங்களும் ஒளிரும் வரை காத்திருப்போம்.',
  },
  kolamTitle: { en: 'The doorstep kolam', ta: 'வாசல் கோலம்' },
  kolamBody: {
    en: 'A kolam drawn at dawn must be photographed before anyone steps on it. That is why we arrive before the guests — for the kolam, and for the hands that drew it.',
    ta: 'விடியலில் வரையப்படும் கோலம் யாரும் மிதிக்கும் முன்பே படமாக வேண்டும். அதனால்தான் விருந்தினர்களுக்கு முன்பே நாங்கள் வந்துவிடுகிறோம் — கோலத்தையும், அதை வரைந்த கைகளையும் படம்பிடிக்க.',
  },

  btsEyebrow: { en: 'Behind the lens', ta: 'லென்ஸுக்குப் பின்னால்' },
  btsTitle: { en: 'Quiet craft,\nlong before the day', ta: 'விழாவுக்கு முன்பே\nதொடங்கும் அமைதியான உழைப்பு' },
  btsLead: {
    en: 'Scouting light at five in the morning, charging forty batteries the night before, culling two thousand frames before breakfast. The part you never see is why the album feels effortless.',
    ta: 'அதிகாலை ஐந்து மணிக்கே ஒளியைத் தேடிப் பார்ப்பது, முந்தைய இரவே நாற்பது பேட்டரிகளை சார்ஜ் செய்வது, காலை உணவுக்கு முன் இரண்டாயிரம் படங்களைத் தேர்ந்தெடுப்பது. நீங்கள் பார்க்காத இந்த உழைப்பே ஆல்பத்தை இயல்பாக்குகிறது.',
  },
  bts1: { en: 'Dual-card bodies, always', ta: 'எப்போதும் இரட்டை மெமரி கார்டு' },
  bts2: { en: 'Scouting light at 5 am', ta: 'அதிகாலை 5 மணி ஒளித் தேடல்' },
  bts3: { en: 'Primes for the mandapam', ta: 'மண்டபத்திற்கான லென்ஸ்கள்' },
  bts4: { en: 'The edit suite, Madurai', ta: 'எடிட் அறை, மதுரை' },

  teamEyebrow: { en: 'The team', ta: 'எங்கள் குழு' },
  teamTitle: { en: 'The people behind\nthe frames', ta: 'படங்களுக்குப் பின்னால்\nஉள்ள மனிதர்கள்' },
  teamLead: {
    en: 'A core crew in Madurai and trusted leads in every district — plus thirty-odd freelancers we have trained and worked beside for years.',
    ta: 'மதுரையில் ஒரு மையக் குழு, ஒவ்வொரு மாவட்டத்திலும் நம்பிக்கைக்குரிய முன்னணிக் கலைஞர்கள் — கூடவே பல ஆண்டுகளாக நாங்களே பயிற்றுவித்து உடன் பணியாற்றும் முப்பதுக்கும் மேற்பட்ட ஃப்ரீலான்ஸ் கலைஞர்கள்.',
  },
  events: { en: 'events', ta: 'விழாக்கள்' },
  core: { en: 'Core team', ta: 'மையக் குழு' },
  partner: { en: 'Partner', ta: 'கூட்டாளர்' },
  joinUs: { en: '+ 30 more across Tamil Nadu', ta: '+ தமிழ்நாடு முழுவதும் மேலும் 30 பேர்' },

  netEyebrow: { en: 'The network', ta: 'எங்கள் வலையமைப்பு' },
  netTitle: { en: 'One studio,\neight districts', ta: 'ஒரே ஸ்டுடியோ,\nஎட்டு மாவட்டங்கள்' },
  netLead: {
    en: 'Madurai is home. Every district crew trains here, edits here and follows the same checklist — so a wedding in Chennai looks as considered as one on West Masi Street.',
    ta: 'மதுரையே எங்கள் இல்லம். ஒவ்வொரு மாவட்டக் குழுவும் இங்கேயே பயிற்சி பெற்று, இங்கேயே எடிட் செய்து, ஒரே சரிபார்ப்புப் பட்டியலைப் பின்பற்றுகிறது — அதனால் சென்னைத் திருமணமும் மேற்கு மாசி வீதித் திருமணம் போலவே நேர்த்தியாக அமைகிறது.',
  },
  hq: { en: 'Head studio', ta: 'முதன்மை ஸ்டுடியோ' },
  bay: { en: 'Bay of Bengal', ta: 'வங்காள விரிகுடா' },
  ghats: { en: 'Western Ghats', ta: 'மேற்குத் தொடர்ச்சி மலை' },

  tEyebrow: { en: 'Kind words', ta: 'அன்பான வார்த்தைகள்' },
  prev: { en: 'Previous', ta: 'முந்தையது' },
  next: { en: 'Next', ta: 'அடுத்தது' },

  ctaEyebrow: { en: 'Visit us', ta: 'எங்களைச் சந்தியுங்கள்' },
  ctaTitle: { en: 'Come by for\na filter coffee.', ta: 'ஒரு ஃபில்டர் காபிக்கு\nவாருங்கள்.' },
  ctaLead: {
    en: 'Leaf through real albums, feel the papers and meet the people who will photograph your day.',
    ta: 'உண்மையான ஆல்பங்களைப் புரட்டிப் பாருங்கள், தாள்களைத் தொட்டுணருங்கள், உங்கள் விழாவைப் படம்பிடிக்கப் போகும் கலைஞர்களைச் சந்தியுங்கள்.',
  },
  ctaSecondary: { en: 'Directions & hours', ta: 'வழி & நேரம்' },
}

const TIMELINE: { year: string; title: Bi; body: Bi; img: Bi<ImgKey> }[] = [
  {
    year: '2018',
    title: { en: 'A room on West Masi Street', ta: 'மேற்கு மாசி வீதியில் ஒரு அறை' },
    body: {
      en: 'Founded in Madurai, a short walk from the Meenakshi Amman temple — photographing neighbours’ weddings and kaadhu kuthu ceremonies with a single camera.',
      ta: 'மீனாட்சி அம்மன் கோயிலிலிருந்து சில அடி தூரத்தில், மதுரையில் தொடக்கம் — ஒரே கேமராவுடன் அக்கம்பக்கத்தாரின் திருமணங்களையும் காதுகுத்து விழாக்களையும் படம்பிடித்தோம்.',
    },
    img: { en: 'm_cam_eye', ta: 't_meenakshi_corridor' },
  },
  {
    year: '2020',
    title: { en: 'Small weddings, big lessons', ta: 'சிறிய திருமணங்கள், பெரிய பாடங்கள்' },
    body: {
      en: 'When ceremonies shrank to fifty guests, we learned to make intimate days feel grand — and began delivering proof galleries online.',
      ta: 'விழாக்கள் ஐம்பது பேராகச் சுருங்கியபோது, சிறிய நாட்களையும் பிரமாண்டமாக உணரச் செய்யக் கற்றோம் — தேர்வு கேலரிகளை இணையத்தில் வழங்கவும் தொடங்கினோம்.',
    },
    img: { en: 'm_haldi_laugh', ta: 't_diya_hands' },
  },
  {
    year: '2022',
    title: { en: 'Beyond Madurai', ta: 'மதுரையைத் தாண்டி' },
    body: {
      en: 'Crews in Chennai, Coimbatore and Thanjavur, and our first in-house album design studio.',
      ta: 'சென்னை, கோயம்புத்தூர், தஞ்சாவூரில் குழுக்கள்; எங்களின் முதல் சொந்த ஆல்பம் வடிவமைப்புக் கூடம்.',
    },
    img: { en: 'm_couple_fort', ta: 't_tn_big' },
  },
  {
    year: '2024',
    title: { en: 'The Heirloom album', ta: 'பரம்பரைப் பொக்கிஷ ஆல்பம்' },
    body: {
      en: 'Hand-bound albums on archival papers, with Kanchipuram silk covers woven to order for each family.',
      ta: 'நீடித்து நிலைக்கும் தாள்களில் கையால் தைத்த ஆல்பங்கள் — ஒவ்வொரு குடும்பத்திற்கும் ஆர்டருக்கேற்ப நெய்த காஞ்சிப் பட்டு அட்டைகளுடன்.',
    },
    img: { en: 'm_album_open', ta: 't_saree_fabric' },
  },
  {
    year: '2026',
    title: { en: '1,400 celebrations', ta: '1,400 கொண்டாட்டங்கள்' },
    body: {
      en: 'Eight districts, forty-plus crew, twelve awards — and a client portal to select photos and design albums from home.',
      ta: 'எட்டு மாவட்டங்கள், நாற்பதுக்கும் மேற்பட்ட கலைஞர்கள், பன்னிரண்டு விருதுகள் — வீட்டிலிருந்தே படங்களைத் தேர்ந்தெடுத்து ஆல்பம் வடிவமைக்க ஒரு வாடிக்கையாளர் தளமும்.',
    },
    img: { en: 'm_couple_swing', ta: 't_couple_garland' },
  },
]

const VALUES: { icon: IconName; title: Bi; body: Bi }[] = [
  {
    icon: 'book',
    title: { en: 'Ritual first', ta: 'சடங்கே முதன்மை' },
    body: {
      en: 'Before the day, we learn the order of your ceremonies — when the oonjal begins, who the thai maaman is, which elder blesses first. Nothing sacred is missed, and nothing is staged.',
      ta: 'விழாவுக்கு முன்பே உங்கள் சடங்குகளின் வரிசையை அறிந்துகொள்கிறோம் — ஊஞ்சல் எப்போது, தாய்மாமன் யார், முதலில் ஆசீர்வதிக்கும் பெரியவர் யார். புனிதமான எதுவும் தவறுவதில்லை; எதுவும் செயற்கையாக அமைக்கப்படுவதில்லை.',
    },
  },
  {
    icon: 'eye',
    title: { en: 'Quietly present', ta: 'அமைதியான இருப்பு' },
    body: {
      en: 'Long lenses, no flash during pujas, never between the priest and the fire. Families tell us they forgot we were there — until they saw the album.',
      ta: 'நீண்ட லென்ஸ்கள், பூஜையின்போது ஃபிளாஷ் இல்லை, அர்ச்சகருக்கும் அக்னிக்கும் இடையே ஒருபோதும் இல்லை. நாங்கள் இருந்ததையே மறந்துவிட்டதாகக் குடும்பங்கள் சொல்வார்கள் — ஆல்பத்தைப் பார்க்கும் வரை.',
    },
  },
  {
    icon: 'receipt',
    title: { en: 'Honest pricing', ta: 'நேர்மையான கட்டணம்' },
    body: {
      en: 'An instant quote online, a clear invoice and no surprise add-ons on the day. Travel beyond 20 km is shown before you book, not after.',
      ta: 'இணையத்தில் உடனடி மதிப்பீடு, தெளிவான ரசீது, விழா நாளில் எதிர்பாராத கூடுதல் கட்டணம் இல்லை. 20 கி.மீக்கு மேலான பயணக் கட்டணம் பதிவுக்கு முன்பே தெரியும்.',
    },
  },
  {
    icon: 'gem',
    title: { en: 'Made to outlast us', ta: 'எங்களையும் தாண்டி நிலைக்கும்' },
    body: {
      en: 'Archival papers, hand-bound spines and every file backed up in two places. An album should reach your grandchildren in better shape than it reached you.',
      ta: 'நீடித்த தாள்கள், கையால் தைத்த முதுகு, ஒவ்வொரு கோப்பும் இரண்டு இடங்களில் பாதுகாப்பு. ஆல்பம் உங்கள் பேரக்குழந்தைகளைச் சென்றடைய வேண்டும் — இன்னும் அழகாக.',
    },
  },
]

const RITUALS: { title: Bi; body: Bi; img: Bi<ImgKey> }[] = [
  {
    title: { en: 'Muhurtham', ta: 'முகூர்த்தம்' },
    body: {
      en: 'We confirm the auspicious time with your family priest and place two cameras before the thaali — one on the couple, one on the parents’ faces.',
      ta: 'உங்கள் குடும்ப அர்ச்சகரிடம் நல்ல நேரத்தை உறுதி செய்து, தாலி கட்டும் முன் இரண்டு கேமராக்களை அமைக்கிறோம் — ஒன்று மணமக்கள் மீது, மற்றொன்று பெற்றோரின் முகங்களில்.',
    },
    img: { en: 'm_decor_mandap', ta: 't_couple_seated' },
  },
  {
    title: { en: 'The lamp', ta: 'குத்துவிளக்கு' },
    body: {
      en: 'Lamp lighting is shot with available light only. The flame should be the brightest thing in the frame.',
      ta: 'விளக்கேற்றும் தருணம் இயற்கை ஒளியில் மட்டுமே. சுடரே சட்டகத்தின் பிரகாசமான ஒளியாக இருக்க வேண்டும்.',
    },
    img: { en: 'm_decor_candle', ta: 't_lamp_brass' },
  },
  {
    title: { en: 'The kolam', ta: 'கோலம்' },
    body: {
      en: 'We arrive early enough to photograph the kolam before anyone walks on it — and the hands that drew it.',
      ta: 'யாரும் மிதிக்கும் முன்பே கோலத்தைப் படம்பிடிக்கவும், அதை வரைந்த கைகளைப் பதிவு செய்யவும் முன்னதாகவே வருகிறோம்.',
    },
    img: { en: 'm_hands_mehndi', ta: 't_kolam_hand' },
  },
  {
    title: { en: 'The blessing', ta: 'ஆசீர்வாதம்' },
    body: {
      en: 'Every elder who blesses the couple gets a frame. We keep a list with the family, and we check it twice.',
      ta: 'மணமக்களை ஆசீர்வதிக்கும் ஒவ்வொரு பெரியவருக்கும் ஒரு படம். குடும்பத்துடன் சேர்ந்து பட்டியல் வைத்து, இருமுறை சரிபார்க்கிறோம்.',
    },
    img: { en: 'm_baby_family', ta: 't_ritual_garland' },
  },
]

const TESTIMONIALS: { quote: Bi; name: Bi; meta: Bi; img: Bi<ImgKey> }[] = [
  {
    quote: {
      en: 'They knew our rituals better than some of our relatives. My grandmother still carries the album to every family function.',
      ta: 'எங்கள் உறவினர்கள் சிலரை விட அவர்களுக்கு எங்கள் சடங்குகள் நன்றாகத் தெரிந்திருந்தது. என் பாட்டி இன்றும் ஒவ்வொரு குடும்ப விழாவுக்கும் அந்த ஆல்பத்தைக் கொண்டு செல்கிறார்.',
    },
    name: { en: 'Priya & Karthik', ta: 'பிரியா & கார்த்திக்' },
    meta: { en: 'Wedding · Madurai', ta: 'திருமணம் · மதுரை' },
    img: { en: 'm_couple_bokeh', ta: 't_couple_garland' },
  },
  {
    quote: {
      en: 'Our daughter’s manjal neerattu was handled with such respect — two women photographers, no fuss, and the most beautiful light.',
      ta: 'எங்கள் மகளின் மஞ்சள் நீராட்டு விழாவை மிகுந்த மரியாதையுடன் கையாண்டார்கள் — இரண்டு பெண் புகைப்படக் கலைஞர்கள், எந்தச் சலசலப்பும் இல்லை, அழகான ஒளி.',
    },
    name: { en: 'Lakshmi Sundaram', ta: 'லட்சுமி சுந்தரம்' },
    meta: { en: 'Puberty ceremony · Theni', ta: 'மஞ்சள் நீராட்டு விழா · தேனி' },
    img: { en: 'm_haldi_seated', ta: 't_manjal_bride' },
  },
  {
    quote: {
      en: 'We picked our photos from the dashboard over one weekend and the album arrived five weeks later. The silk cover made my mother cry.',
      ta: 'ஒரே வார இறுதியில் டாஷ்போர்டில் படங்களைத் தேர்ந்தெடுத்தோம்; ஐந்து வாரங்களில் ஆல்பம் வந்தது. அந்தப் பட்டு அட்டையைப் பார்த்து என் அம்மா கண்கலங்கினார்.',
    },
    name: { en: 'Arvind & Nivetha', ta: 'அரவிந்த் & நிவேதா' },
    meta: { en: 'Wedding · Chennai', ta: 'திருமணம் · சென்னை' },
    img: { en: 'm_bride_red', ta: 't_bride_silk' },
  },
  {
    quote: {
      en: 'The drone shot of the temple tank at our engagement is now framed in our living room. Guests ask about it every single time.',
      ta: 'எங்கள் நிச்சயதார்த்தத்தில் எடுத்த கோயில் குளத்தின் ட்ரோன் படம் இப்போது எங்கள் வரவேற்பறையில் சட்டமிட்டுத் தொங்குகிறது. வரும் ஒவ்வொருவரும் அதைப் பற்றிக் கேட்கிறார்கள்.',
    },
    name: { en: 'Harish & Deepa', ta: 'ஹரீஷ் & தீபா' },
    meta: { en: 'Engagement · Thanjavur', ta: 'நிச்சயதார்த்தம் · தஞ்சாவூர்' },
    img: { en: 'm_ring_hands', ta: 't_temple_tank' },
  },
]

/** Approximate geography of the eight districts on a 100 × 100 canvas (from lat/long). */
const MAP: Record<DistrictKey, { x: number; y: number; side: 'l' | 'r' }> = {
  chennai: { x: 84, y: 12, side: 'l' },
  salem: { x: 41, y: 35, side: 'r' },
  coimbatore: { x: 15, y: 46, side: 'r' },
  thanjavur: { x: 67, y: 51, side: 'r' },
  dindigul: { x: 37, y: 58, side: 'r' },
  theni: { x: 22, y: 68, side: 'l' },
  madurai: { x: 42, y: 70, side: 'r' },
  tirunelveli: { x: 32, y: 90, side: 'r' },
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function About() {
  useTitle(TITLE)
  useDarkHero()
  return (
    <>
      <Hero />
      <Story />
      <Numbers />
      <Values />
      <Rituals />
      <BehindTheScenes />
      <Team />
      <Network />
      <Testimonials />
      <Cta />
    </>
  )
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function Hero() {
  const t = useT(copy)
  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden bg-ink text-white">
      <Parallax className="absolute inset-0 -z-10" offset={120}>
        <LangImg pair={{ en: 'm_cam_silhouette', ta: 't_meenakshi' }} className="h-full w-full" w={2200} priority dark imgClassName="animate-kenburns" />
      </Parallax>
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/50 to-ink/40" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_12%_0%,rgba(192,22,60,0.32),transparent_70%)]" />
      <TamilOnly>
        <GopuramSkyline className="pointer-events-none absolute inset-x-0 bottom-0 -z-10" color="#c0163c" opacity={0.3} />
      </TamilOnly>

      <Container wide className="flex min-h-[100svh] flex-col justify-end pb-12 pt-32 md:pb-20 md:pt-44">
        <Reveal>
          <Eyebrow dark>{t.heroEyebrow}</Eyebrow>
        </Reveal>
        <RevealText as="h1" immediate delay={0.15} text={t.heroTitle} className="t-hero mt-6 max-w-6xl text-white" />
        <div className="mt-8 grid gap-8 md:mt-10 md:grid-cols-[1fr_auto] md:items-end">
          <Reveal delay={0.5}>
            <p className="t-lead max-w-2xl text-white/70">{t.heroLead}</p>
          </Reveal>
          <Reveal delay={0.7} className="hidden md:block">
            <span className="flex items-center gap-3 text-white/50">
              <span className="t-label">{t.scroll}</span>
              <span className="relative flex h-12 w-7 justify-center rounded-full border border-white/25">
                <motion.span className="mt-2 h-2 w-[3px] rounded-full bg-white" animate={{ y: [0, 14, 0], opacity: [1, 0.2, 1] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }} />
              </span>
            </span>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}

// ─── Story: pull quote + sticky timeline ─────────────────────────────────────

function Story() {
  const t = useT(copy)
  const lang = useLang()
  const [active, setActive] = useState(0)
  const onActive = useCallback((i: number) => setActive(i), [])
  const item = TIMELINE[active]
  return (
    <section className="relative py-24 md:py-40">
      <Container wide>
        <div className="mx-auto max-w-5xl text-center">
          <Reveal>
            <Eyebrow>{t.storyEyebrow}</Eyebrow>
          </Reveal>
          <TamilOnly>
            <Kolam size={52} className="mx-auto mt-6 text-ruby" />
          </TamilOnly>
          <Reveal delay={0.1}>
            <blockquote className={`mt-8 font-display text-[1.7rem] leading-[1.25] text-ink md:text-5xl md:leading-[1.15] ${lang === 'ta' ? 'font-semibold !leading-[1.55] md:text-[2.4rem]' : 'italic-accent'}`}>
              <span className="text-ruby">“</span>
              {t.quote}
              <span className="text-ruby">”</span>
            </blockquote>
          </Reveal>
          <Reveal delay={0.25}>
            <p className="t-label mt-8 text-ink/45">— {t.quoteBy}</p>
          </Reveal>
        </div>

        <Ornament className="my-14 md:my-28" />

        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-20">
          {/* sticky year + image */}
          <div className="hidden lg:block">
            <div className="sticky top-28">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[32px] bg-ink">
                {TIMELINE.map((it, i) => (
                  <motion.div key={it.year} className="absolute inset-0" initial={false} animate={{ opacity: i === active ? 1 : 0, scale: i === active ? 1 : 1.06 }} transition={{ duration: 1, ease: EASE }} aria-hidden={i !== active}>
                    <LangImg pair={it.img} className="h-full w-full" w={1100} sizes="45vw" dark />
                  </motion.div>
                ))}
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
                <div className="absolute bottom-6 left-7 overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={item.year}
                      initial={{ y: '100%' }}
                      animate={{ y: '0%' }}
                      exit={{ y: '-100%' }}
                      transition={{ duration: 0.6, ease: EASE }}
                      className="font-display text-[7.5rem] leading-none text-white xl:text-[9rem]"
                    >
                      {item.year}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          <ol className="relative">
            {TIMELINE.map((it, i) => (
              <TimelineItem key={it.year} i={i} active={i === active} onActive={onActive} />
            ))}
          </ol>
        </div>
      </Container>
    </section>
  )
}

function TimelineItem({ i, active, onActive }: { i: number; active: boolean; onActive: (i: number) => void }) {
  const lang = useLang()
  const it = TIMELINE[i]
  const ref = useRef<HTMLLIElement>(null)
  const inView = useInView(ref, { margin: '-45% 0px -45% 0px' })
  useEffect(() => {
    if (inView) onActive(i)
  }, [inView, onActive, i])
  return (
    <li ref={ref} className="relative border-l border-ink/10 pb-16 pl-8 last:pb-0 md:pl-12 lg:flex lg:min-h-[60svh] lg:flex-col lg:justify-center lg:pb-0">
      <span className={`absolute -left-[6px] top-2 h-[11px] w-[11px] rounded-full ring-4 ring-white transition-colors duration-500 lg:top-1/2 ${active ? 'bg-ruby' : 'bg-ink/20'}`} aria-hidden="true" />
      <ImageReveal className="mb-6 aspect-[16/10] rounded-[22px] lg:hidden">
        <LangImg pair={it.img} className="h-full w-full" w={900} />
      </ImageReveal>
      <p className={`font-display text-5xl leading-none transition-colors duration-500 lg:text-6xl ${active ? 'text-ruby' : 'text-ink/20'}`}>{it.year}</p>
      <h3 className="t-2 mt-4 text-ink">{it.title[lang]}</h3>
      <p className="t-lead mt-4 max-w-lg text-ink/60">{it.body[lang]}</p>
    </li>
  )
}

// ─── Numbers ─────────────────────────────────────────────────────────────────

function Numbers() {
  const t = useT(copy)
  const stats = [
    { to: 1400, suffix: '+', label: t.numEvents },
    { to: 8, suffix: '', label: t.numDistricts },
    { to: 12, suffix: '', label: t.numAwards },
    { to: 40, suffix: '+', label: t.numCrew },
  ]
  return (
    <section className="relative isolate overflow-hidden bg-ink py-20 text-white md:py-28">
      <div className="ambient-dark grain absolute inset-0 -z-10" />
      <TamilOnly>
        <div className="kolam-bg-white pointer-events-none absolute inset-0 -z-10 opacity-[0.05]" />
      </TamilOnly>
      <Container wide>
        <Reveal>
          <Eyebrow dark>{t.numEyebrow}</Eyebrow>
        </Reveal>
        <Stagger className="mt-10 grid grid-cols-2 gap-y-10 md:mt-12 md:gap-y-12 lg:grid-cols-4" gap={0.1}>
          {stats.map((s, i) => (
            <StaggerItem key={i} className={`pr-4 ${i % 2 ? 'border-l border-white/10 pl-5 md:pl-8' : ''} ${i === 2 ? 'lg:border-l lg:pl-8' : ''}`}>
              <p className="font-display text-[2.5rem] leading-none tracking-tight text-white sm:text-[3.4rem] md:text-[5.5rem]">
                <Counter to={s.to} />
                <span className="text-ruby-bright">{s.suffix}</span>
              </p>
              <p className="mt-4 max-w-[14rem] text-[14px] leading-snug text-white/55">{s.label}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  )
}

// ─── Values ──────────────────────────────────────────────────────────────────

function Values() {
  const t = useT(copy)
  const lang = useLang()
  return (
    <section className="relative isolate overflow-hidden py-24 md:py-36">
      <div className="ambient absolute inset-0 -z-10" />
      <Container wide>
        <SectionHeading eyebrow={t.valEyebrow} title={t.valTitle} size="t-1" />
        <Stagger className="mt-14 grid gap-4 md:mt-20 md:grid-cols-2" gap={0.1}>
          {VALUES.map((v, i) => (
            <StaggerItem key={i}>
              <div className="glass-strong group relative h-full overflow-hidden rounded-[26px] p-6 md:rounded-[30px] md:p-10">
                <TamilOnly>
                  <KolamCorner className="absolute right-3 top-3 rotate-90" />
                </TamilOnly>
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ruby text-white shadow-ruby">
                    <Icon name={v.icon} size={22} />
                  </span>
                  <span className="t-label text-ink/35">0{i + 1}</span>
                </div>
                <h3 className="t-2 mt-6 text-ink md:mt-8">{v.title[lang]}</h3>
                <p className="mt-4 max-w-lg text-[15.5px] leading-relaxed text-ink/60">{v.body[lang]}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  )
}

// ─── Rituals ─────────────────────────────────────────────────────────────────

function Rituals() {
  const t = useT(copy)
  const lang = useLang()
  return (
    <section className="relative isolate overflow-hidden bg-ink py-24 text-white md:py-36">
      <div className="ambient-dark absolute inset-0 -z-10" />
      <TamilOnly>
        <TempleBorder className="absolute inset-x-0 top-0" flip />
      </TamilOnly>
      <Container wide>
        <CenterIntro eyebrow={t.ritEyebrow} title={t.ritTitle} lead={t.ritLead} dark />

        <Stagger className="no-scrollbar -mx-5 mt-12 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:scroll-px-0 sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 md:mt-20 lg:grid-cols-4" gap={0.12}>
          {RITUALS.map((r, i) => (
            <StaggerItem key={i} className={`w-[80%] shrink-0 snap-start sm:w-auto ${i % 2 ? 'lg:translate-y-12' : ''}`}>
              <figure className="group relative aspect-[3/4] overflow-hidden rounded-[26px]">
                <LangImg pair={r.img} className="absolute inset-0 h-full w-full" w={700} sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 80vw" dark imgClassName="transition-transform duration-[1.4s] ease-out group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/15 to-transparent" />
                <figcaption className="absolute inset-x-3 bottom-3 rounded-[20px] p-5 glass-dark">
                  <p className="t-label text-ruby-bright">0{i + 1}</p>
                  <p className="t-3 mt-1 text-white">{r.title[lang]}</p>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-white/65">{r.body[lang]}</p>
                </figcaption>
              </figure>
            </StaggerItem>
          ))}
        </Stagger>

        {/* Richer, traditional content only in Tamil mode */}
        <TamilOnly>
          <div className="relative mt-20 overflow-hidden rounded-[26px] border border-white/10 md:mt-36 md:rounded-[32px]">
            <div className="kolam-bg-white pointer-events-none absolute inset-0 opacity-[0.06]" />
            <div className="relative grid lg:grid-cols-[1.1fr_1fr]">
              <div className="relative min-h-[280px] sm:min-h-[320px] lg:min-h-[560px]">
                <div className="absolute inset-0">
                  <Img k="t_gopuram_detail" w={1000} dark className="h-full w-full" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-ink/60" />
                <Vilakku height={150} tone="white" className="absolute bottom-5 left-5 md:bottom-6 md:left-6 drop-shadow-[0_0_24px_rgba(226,38,79,0.5)]" />
              </div>
              <div className="space-y-8 p-6 md:space-y-10 md:p-12">
                {[
                  { title: t.templeTitle, body: t.templeBody },
                  { title: t.lampTitle, body: t.lampBody },
                  { title: t.kolamTitle, body: t.kolamBody },
                ].map((b, i) => (
                  <Reveal key={i} delay={i * 0.1}>
                    <div className="flex gap-4 md:gap-5">
                      <Kolam size={36} className="mt-1 shrink-0 text-ruby-bright" strokeWidth={2.2} />
                      <div>
                        <h3 className="t-3 text-white">{b.title}</h3>
                        <p className="mt-3 text-[15px] leading-[1.9] text-white/65">{b.body}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </TamilOnly>
      </Container>
    </section>
  )
}

// ─── Behind the scenes ───────────────────────────────────────────────────────

function BehindTheScenes() {
  const t = useT(copy)
  const tiles: { pair: Bi<ImgKey>; cap: string; cls: string; offset: number }[] = [
    { pair: { en: 'm_cam_hands', ta: 'm_cam_hands' }, cap: t.bts1, cls: 'col-span-2 aspect-[16/9] md:col-span-4 md:row-span-1', offset: 40 },
    { pair: { en: 'm_cam_dark', ta: 't_lamp_fire' }, cap: t.bts2, cls: 'aspect-[3/4] md:col-span-2 md:row-span-2 md:aspect-auto', offset: 70 },
    { pair: { en: 'm_cam_lens', ta: 'm_cam_lens' }, cap: t.bts3, cls: 'aspect-[3/4] md:col-span-2 md:aspect-[4/3]', offset: 30 },
    { pair: { en: 'm_cam_eye', ta: 't_kolam_hand' }, cap: t.bts4, cls: 'col-span-2 aspect-[16/10] md:col-span-2 md:aspect-[4/3]', offset: 50 },
  ]
  return (
    <section className="py-24 md:py-36">
      <Container wide>
        <div className="grid gap-8 md:grid-cols-2 md:items-end">
          <SectionHeading eyebrow={t.btsEyebrow} title={t.btsTitle} size="t-1" />
          <Reveal delay={0.2}>
            <p className="t-lead max-w-md text-ink/60 md:ml-auto">{t.btsLead}</p>
          </Reveal>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-3 md:mt-20 md:grid-cols-6 md:gap-4">
          {tiles.map((x, i) => (
            <ImageReveal key={i} delay={i * 0.08} className={`relative rounded-[22px] md:rounded-[28px] ${x.cls}`}>
              <Parallax className="absolute inset-0" offset={x.offset}>
                <LangImg pair={x.pair} className="h-full w-full" w={1100} sizes="(min-width:768px) 60vw, 100vw" />
              </Parallax>
              <span className="glass absolute bottom-2.5 left-2.5 max-w-[calc(100%-20px)] rounded-[14px] px-3 py-1.5 text-[12px] font-medium text-ink md:bottom-4 md:left-4 md:max-w-[calc(100%-24px)] md:truncate md:rounded-full md:px-3.5">
                {x.cap}
              </span>
            </ImageReveal>
          ))}
        </div>
      </Container>
    </section>
  )
}

// ─── Team ────────────────────────────────────────────────────────────────────

/** First grapheme of a word, keeping Tamil vowel signs attached to their consonant. */
function firstGrapheme(word: string): string {
  const m = word.match(/^[஀-௿][ா-்ௗ]*/)
  return m ? m[0] : word.charAt(0)
}

function monogram(name: string, lang: 'en' | 'ta'): string {
  const words = name.replace(/\./g, '').split(/\s+/).filter(Boolean)
  if (lang === 'ta') return firstGrapheme(words[0] ?? '')
  return words.slice(0, 2).map(firstGrapheme).join('').toUpperCase()
}

function Team() {
  const t = useT(copy)
  const lang = useLang()
  return (
    <section className="relative isolate overflow-hidden bg-mist py-24 md:py-36">
      <div className="ambient absolute inset-0 -z-10" />
      <Container wide>
        <div className="grid gap-8 md:grid-cols-2 md:items-end">
          <SectionHeading eyebrow={t.teamEyebrow} title={t.teamTitle} size="t-1" />
          <Reveal delay={0.2}>
            <p className="t-lead max-w-md text-ink/60 md:ml-auto">{t.teamLead}</p>
          </Reveal>
        </div>

        <Stagger className="no-scrollbar -mx-5 mt-12 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-2 md:mx-0 md:mt-20 md:grid md:scroll-px-0 md:grid-cols-2 md:gap-4 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-4" gap={0.06}>
          {SEED_WORKERS.map((w, i) => {
            const dark = i % 3 === 0
            const district = DISTRICTS.find(d => d.key === w.district)
            return (
              <StaggerItem key={w.id} className="w-[78%] shrink-0 snap-start min-[480px]:w-[46%] md:w-auto">
                <article
                  className={`group relative flex aspect-[4/5] flex-col overflow-hidden rounded-[28px] p-6 transition-transform duration-500 hover:-translate-y-1 ${
                    dark ? 'bg-ink text-white' : 'glass-strong text-ink'
                  }`}
                >
                  {dark && <div className="ambient-dark pointer-events-none absolute inset-0" />}
                  <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-ruby/25 blur-3xl transition-opacity duration-700 group-hover:opacity-100 md:opacity-60" />
                  <TamilOnly>
                    <KolamCorner className="absolute left-3 top-3" />
                  </TamilOnly>
                  <div className="relative flex items-start justify-between">
                    <span className={`t-label ${dark ? 'text-white/45' : 'text-ink/40'}`}>{w.freelance ? t.partner : t.core}</span>
                    <span className={`flex items-center gap-1 text-[12px] font-semibold ${dark ? 'text-white/70' : 'text-ink/60'}`}>
                      <Icon name="star" size={13} className="fill-ruby text-ruby" />
                      {w.rating.toFixed(1)}
                    </span>
                  </div>
                  <div className="relative flex flex-1 items-center justify-center">
                    <span
                      className={`font-display leading-none transition-transform duration-700 group-hover:scale-105 ${lang === 'ta' ? 'text-[5.5rem] font-semibold' : 'text-[6.5rem] italic-accent'} ${dark ? 'text-white' : 'text-ink'}`}
                      aria-hidden="true"
                    >
                      {monogram(w.name[lang], lang)}
                    </span>
                    <span className={`absolute bottom-1/2 left-1/2 h-px w-24 -translate-x-1/2 translate-y-[3.6rem] ${dark ? 'bg-ruby-bright' : 'bg-ruby'}`} aria-hidden="true" />
                  </div>
                  <div className="relative">
                    <h3 className="font-display text-2xl leading-tight">{w.name[lang]}</h3>
                    <p className={`mt-1 text-[13.5px] ${dark ? 'text-white/60' : 'text-ink/55'}`}>{ROLES[w.role][lang]}</p>
                    <div className={`mt-4 flex items-center justify-between border-t pt-3 text-[12px] ${dark ? 'border-white/10 text-white/50' : 'border-ink/10 text-ink/45'}`}>
                      <span className="flex items-center gap-1.5">
                        <Icon name="mapPin" size={13} />
                        {district?.name[lang]}
                      </span>
                      <span>{w.jobs} {t.events}</span>
                    </div>
                  </div>
                </article>
              </StaggerItem>
            )
          })}
        </Stagger>
        <Reveal className="mt-10 text-center">
          <span className="t-label text-ink/45">{t.joinUs}</span>
        </Reveal>
      </Container>
    </section>
  )
}

// ─── District network map ────────────────────────────────────────────────────

function Network() {
  const t = useT(copy)
  const lang = useLang()
  const [hover, setHover] = useState<DistrictKey | null>(null)
  const hq = MAP.madurai
  return (
    <section className="relative isolate overflow-hidden bg-ink py-24 text-white md:py-36">
      <div className="ambient-dark absolute inset-0 -z-10" />
      <Container wide>
        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <SectionHeading eyebrow={t.netEyebrow} title={t.netTitle} lead={t.netLead} dark size="t-1" />
            <ul className="mt-8 grid grid-cols-2 gap-x-5 border-t border-white/10 md:mt-10 md:gap-x-6">
              {DISTRICTS.map(d => (
                <li key={d.key} className="border-b border-white/10">
                  <button
                    type="button"
                    onMouseEnter={() => setHover(d.key)}
                    onMouseLeave={() => setHover(null)}
                    onFocus={() => setHover(d.key)}
                    onBlur={() => setHover(null)}
                    className={`flex min-h-12 w-full cursor-default items-center gap-2.5 py-3 text-left text-[14.5px] leading-snug md:min-h-0 md:py-3.5 md:text-[15px] md:leading-normal transition-colors ${hover === d.key ? 'text-white' : 'text-white/60'}`}
                  >
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors ${d.key === 'madurai' || hover === d.key ? 'bg-ruby-bright' : 'bg-white/30'}`} />
                    {d.name[lang]}
                    {d.key === 'madurai' && <span className="t-label ml-auto hidden text-ruby-bright sm:inline">HQ</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <Reveal y={40}>
            <div className="glass-dark relative mx-auto aspect-[4/5] w-full max-w-[560px] overflow-hidden rounded-[26px] md:rounded-[32px]">
              {/* dot field */}
              <div
                className="absolute inset-0 opacity-40"
                style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.35) 1px, transparent 1.2px)', backgroundSize: '18px 18px' }}
                aria-hidden="true"
              />
              <TamilOnly>
                <GopuramSkyline className="pointer-events-none absolute inset-x-0 bottom-0" color="#c0163c" opacity={0.25} />
              </TamilOnly>
              <span className="t-label absolute right-3 top-1/2 md:right-5 origin-right -translate-y-1/2 rotate-90 whitespace-nowrap text-white/30">{t.bay}</span>
              <span className="t-label absolute left-3 top-[62%] md:left-5 origin-left -rotate-90 whitespace-nowrap text-white/25">{t.ghats}</span>

              <div className="absolute inset-[7%]">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
                  {DISTRICTS.filter(d => d.key !== 'madurai').map((d, i) => {
                    const p = MAP[d.key]
                    const mx = (hq.x + p.x) / 2
                    const my = (hq.y + p.y) / 2
                    const dx = p.x - hq.x
                    const dy = p.y - hq.y
                    const cx = mx - dy * 0.22
                    const cy = my + dx * 0.22
                    const on = hover === d.key
                    return (
                      <motion.path
                        key={d.key}
                        d={`M${hq.x} ${hq.y} Q${cx} ${cy} ${p.x} ${p.y}`}
                        fill="none"
                        stroke={on ? '#e2264f' : 'rgba(255,255,255,0.35)'}
                        strokeWidth={on ? 2 : 1}
                        strokeDasharray={on ? undefined : '3 4'}
                        vectorEffect="non-scaling-stroke"
                        initial={{ pathLength: 0, opacity: 0 }}
                        whileInView={{ pathLength: 1, opacity: 1 }}
                        viewport={{ once: true, margin: '0px 0px -15% 0px' }}
                        transition={{ duration: 1.6, delay: 0.3 + i * 0.12, ease: EASE }}
                      />
                    )
                  })}
                </svg>

                {DISTRICTS.map((d, i) => {
                  const p = MAP[d.key]
                  const isHq = d.key === 'madurai'
                  const on = hover === d.key || isHq
                  return (
                    <motion.div
                      key={d.key}
                      className="absolute"
                      style={{ left: `${p.x}%`, top: `${p.y}%` }}
                      initial={{ opacity: 0, scale: 0.4 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.7, delay: isHq ? 0.1 : 0.8 + i * 0.1, ease: EASE }}
                      onMouseEnter={() => !isHq && setHover(d.key)}
                      onMouseLeave={() => setHover(null)}
                    >
                      <span className="absolute left-0 top-0 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center">
                        {isHq && <span className="absolute h-4 w-4 rounded-full bg-ruby-bright animate-pulse-ring" />}
                        <span className={`relative rounded-full transition-all duration-300 ${isHq ? 'h-4 w-4 bg-ruby-bright ring-4 ring-ruby/30' : on ? 'h-3 w-3 bg-ruby-bright' : 'h-2.5 w-2.5 bg-white'}`} />
                      </span>
                      <span
                        className={`absolute top-0 -translate-y-1/2 whitespace-nowrap transition-colors duration-300 ${p.side === 'r' ? 'left-3.5' : 'right-3.5 text-right'} ${
                          isHq ? 'glass-ruby rounded-full px-2.5 py-1 text-[12px] font-semibold' : `text-[12px] font-medium md:text-[13px] ${on ? 'text-white' : 'text-white/60'}`
                        }`}
                      >
                        {d.name[lang]}
                        {isHq && <span className="ml-1.5 hidden font-normal text-white/80 sm:inline">· {t.hq}</span>}
                      </span>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}

// ─── Testimonials ────────────────────────────────────────────────────────────

function Testimonials() {
  const t = useT(copy)
  const lang = useLang()
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const n = TESTIMONIALS.length
  const go = useCallback((d: number) => setI(x => (x + d + n) % n), [n])
  useEffect(() => {
    if (paused) return
    const id = setInterval(() => go(1), 7000)
    return () => clearInterval(id)
  }, [paused, go, i])
  const q = TESTIMONIALS[i]
  return (
    <section className="py-24 md:py-36" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <Container wide>
        <div className="grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <ImageReveal className="relative aspect-[4/3] rounded-[26px] bg-ink md:aspect-[4/5] md:rounded-[32px]">
            <AnimatePresence initial={false}>
              <motion.div key={i} className="absolute inset-0" initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.1, ease: EASE }}>
                <LangImg pair={q.img} className="h-full w-full" w={1000} sizes="(min-width:1024px) 40vw, 100vw" dark />
              </motion.div>
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-ink/50 to-transparent" />
            <div className="glass-dark absolute bottom-4 left-4 flex items-center gap-1 rounded-full px-3.5 py-2">
              {Array.from({ length: 5 }, (_, k) => (
                <Icon key={k} name="star" size={14} className="fill-ruby-bright text-ruby-bright" />
              ))}
            </div>
          </ImageReveal>

          <div>
            <Reveal>
              <Eyebrow>{t.tEyebrow}</Eyebrow>
            </Reveal>
            <Icon name="quote" size={56} className="mt-6 h-11 w-11 text-ruby md:mt-8 md:h-14 md:w-14" strokeWidth={1.2} />
            <div className={`relative mt-4 min-h-[15rem] md:min-h-[17rem] ${lang === 'ta' ? 'max-md:min-h-[19rem]' : ''}`} aria-live="polite">
              <AnimatePresence mode="wait">
                <motion.figure key={i + lang} initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -12, filter: 'blur(8px)' }} transition={{ duration: 0.6, ease: EASE }}>
                  <blockquote className={`font-display text-[1.6rem] leading-[1.3] text-ink md:text-[2.4rem] md:leading-[1.2] ${lang === 'ta' ? 'font-semibold !leading-[1.6] max-md:text-[1.3rem] md:text-[1.9rem]' : ''}`}>
                    {q.quote[lang]}
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-4 md:mt-8">
                    <span className="h-px w-10 bg-ruby" />
                    <span>
                      <span className="block font-semibold text-ink">{q.name[lang]}</span>
                      <span className="block text-[13.5px] text-ink/50">{q.meta[lang]}</span>
                    </span>
                  </figcaption>
                </motion.figure>
              </AnimatePresence>
            </div>
            <div className="mt-8 flex items-center gap-3 md:mt-10 md:gap-5">
              <IconButton icon="arrowLeft" label={t.prev} variant="outline" size={48} onClick={() => go(-1)} />
              <IconButton icon="arrowRight" label={t.next} variant="ink" size={48} onClick={() => go(1)} />
              <div className="ml-auto flex gap-2 md:ml-2">
                {TESTIMONIALS.map((_, k) => (
                  <button
                    key={k}
                    type="button"
                    aria-label={`${k + 1} / ${n}`}
                    aria-current={k === i}
                    onClick={() => setI(k)}
                    className={`relative h-1.5 cursor-pointer rounded-full transition-all duration-500 before:absolute before:-inset-x-1 before:-inset-y-4 ${k === i ? 'w-8 bg-ruby' : 'w-1.5 bg-ink/20 hover:bg-ink/40'}`}
                  />
                ))}
              </div>
            </div>
          </div>
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
      pair={{ en: 'm_album_black', ta: 't_diya_rows' }}
      primary={{ label: c.getQuote, to: '/book' }}
      secondary={{ label: t.ctaSecondary, to: '/contact' }}
    />
  )
}

