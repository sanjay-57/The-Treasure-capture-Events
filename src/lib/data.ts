import type { Bi } from './i18n'
import type { TierSpec } from './catalogue'
import type { ImgKey } from './images'

// ─── Districts ───────────────────────────────────────────────────────────────

export type DistrictKey = 'madurai' | 'chennai' | 'salem' | 'coimbatore' | 'thanjavur' | 'tirunelveli' | 'theni' | 'dindigul'

export interface District {
  key: DistrictKey
  name: Bi
  /** Short line shown on the district gateway card. */
  note: Bi
  img: ImgKey
}

export const DISTRICTS: District[] = [
  { key: 'madurai', name: { en: 'Madurai', ta: 'மதுரை' }, note: { en: 'Head studio · Temple city', ta: 'முதன்மை ஸ்டுடியோ · கோயில் நகரம்' }, img: 'd_madurai' },
  { key: 'chennai', name: { en: 'Chennai', ta: 'சென்னை' }, note: { en: 'Coastal & city weddings', ta: 'கடற்கரை & நகர விழாக்கள்' }, img: 'd_chennai' },
  { key: 'coimbatore', name: { en: 'Coimbatore', ta: 'கோயம்புத்தூர்' }, note: { en: 'Western ghats backdrops', ta: 'மேற்குத் தொடர்ச்சி மலைப் பின்னணி' }, img: 'd_coimbatore' },
  { key: 'thanjavur', name: { en: 'Thanjavur', ta: 'தஞ்சாவூர்' }, note: { en: 'Big Temple heritage', ta: 'பெரிய கோயில் பாரம்பரியம்' }, img: 't_tn_big' },
  { key: 'salem', name: { en: 'Salem', ta: 'சேலம்' }, note: { en: 'Yercaud hills & grand mahals', ta: 'ஏற்காடு மலை & பிரமாண்ட மண்டபங்கள்' }, img: 'd_salem' },
  { key: 'tirunelveli', name: { en: 'Tirunelveli', ta: 'திருநெல்வேலி' }, note: { en: 'Nellaiappar & river ghats', ta: 'நெல்லையப்பர் & தாமிரபரணி' }, img: 'd_tirunelveli' },
  { key: 'theni', name: { en: 'Theni', ta: 'தேனி' }, note: { en: 'Hills, farms & outdoor shoots', ta: 'மலை, வயல் & வெளிப்புறப் படப்பிடிப்பு' }, img: 'd_theni' },
  { key: 'dindigul', name: { en: 'Dindigul', ta: 'திண்டுக்கல்' }, note: { en: 'Kodaikanal pre-wedding trails', ta: 'கொடைக்கானல் திருமணத்திற்கு முந்தைய படப்பிடிப்பு' }, img: 'd_dindigul' },
]

export const districtName = (key: string, lang: 'en' | 'ta') => DISTRICTS.find(d => d.key === key)?.name[lang] ?? key

// ─── Events ──────────────────────────────────────────────────────────────────

export type EventKey =
  | 'wedding' | 'engagement' | 'reception' | 'puberty' | 'earpiercing' | 'naming' | 'birthday'
  | 'babyshower' | 'babyshoot'
  | 'prewedding' | 'outdoor' | 'model' | 'commercial' | 'corporate'

/** Display grouping on the website. */
export type EventBucket = 'family' | 'maternity' | 'special'

export const BUCKETS: { key: EventBucket; name: Bi; blurb: Bi }[] = [
  { key: 'family', name: { en: 'Wedding & family', ta: 'திருமணம் & குடும்பம்' }, blurb: { en: 'Muhurtham to reception and every ceremony around it', ta: 'முகூர்த்தம் முதல் வரவேற்பு வரை, அனைத்து விழாக்களும்' } },
  { key: 'maternity', name: { en: 'Baby & maternity', ta: 'குழந்தை & வளைகாப்பு' }, blurb: { en: 'Valaikappu, newborns and first birthdays', ta: 'வளைகாப்பு, பிறந்த குழந்தை, முதல் பிறந்தநாள்' } },
  { key: 'special', name: { en: 'Special & commercial', ta: 'சிறப்பு & வணிகம்' }, blurb: { en: 'Couple shoots, portfolios, brands and public events', ta: 'ஜோடி படப்பிடிப்பு, போர்ட்ஃபோலியோ, பிராண்டுகள், பொது நிகழ்வுகள்' } },
]

export interface EventType {
  key: EventKey
  bucket: EventBucket
  name: Bi
  blurb: Bi
  img: Bi<ImgKey>
  /** Whether "Bride / Groom meeting" applies, otherwise "Family consultation". */
  couple: boolean
  /** Which fixed-tier presets this event expands to. */
  tiers: TierSpec
}

export const EVENTS: EventType[] = [
  { key: 'wedding', bucket: 'family', name: { en: 'Wedding', ta: 'திருமணம்' }, blurb: { en: 'Muhurtham to reception, every ritual', ta: 'முகூர்த்தம் முதல் வரவேற்பு வரை' }, img: { en: 'm_couple_bokeh', ta: 't_couple_garland' }, couple: true, tiers: { kind: 'family' } },
  { key: 'engagement', bucket: 'family', name: { en: 'Engagement', ta: 'நிச்சயதார்த்தம்' }, blurb: { en: 'Rings, families and first promises', ta: 'மோதிரம், குடும்பம், முதல் வாக்குறுதி' }, img: { en: 'm_ring_hands', ta: 't_ritual_offering' }, couple: true, tiers: { kind: 'family' } },
  { key: 'reception', bucket: 'family', name: { en: 'Reception', ta: 'வரவேற்பு' }, blurb: { en: 'Stage, lights and the whole guest list', ta: 'மேடை, விளக்குகள், அனைத்து விருந்தினரும்' }, img: { en: 'm_rec_stage', ta: 't_lamp_many' }, couple: true, tiers: { kind: 'family' } },
  { key: 'puberty', bucket: 'family', name: { en: 'Puberty ceremony', ta: 'மஞ்சள் நீராட்டு விழா' }, blurb: { en: 'Manjal Neerattu Vizha, with warmth', ta: 'பாரம்பரிய மஞ்சள் நீராட்டு விழா' }, img: { en: 'm_haldi_seated', ta: 't_manjal_bride' }, couple: false, tiers: { kind: 'family' } },
  { key: 'earpiercing', bucket: 'family', name: { en: 'Ear piercing', ta: 'காதுகுத்து' }, blurb: { en: 'Kaadhu Kuthu at home or temple', ta: 'வீட்டிலோ கோயிலிலோ காதுகுத்து' }, img: { en: 'm_baby_smile', ta: 't_temple_mandapam' }, couple: false, tiers: { kind: 'family' } },
  { key: 'naming', bucket: 'family', name: { en: 'Naming ceremony', ta: 'பெயர் சூட்டு விழா' }, blurb: { en: 'Peyar Soottu — the first celebration', ta: 'குழந்தையின் முதல் கொண்டாட்டம்' }, img: { en: 'm_baby_wrap', ta: 't_diya_hands' }, couple: false, tiers: { kind: 'family' } },
  { key: 'birthday', bucket: 'family', name: { en: 'Birthday', ta: 'பிறந்தநாள்' }, blurb: { en: 'Cakes, candles and candid chaos', ta: 'கேக், மெழுகுவர்த்தி, மகிழ்ச்சி' }, img: { en: 'm_bday_girl', ta: 't_diya_many' }, couple: false, tiers: { kind: 'family' } },
  { key: 'babyshower', bucket: 'maternity', name: { en: 'Baby shower', ta: 'வளைகாப்பு' }, blurb: { en: 'Valaikappu bangles and blessings', ta: 'வளையல்களும் ஆசிகளும்' }, img: { en: 'm_mehndi_hands', ta: 't_jewel_set' }, couple: false, tiers: { kind: 'maternity' } },
  { key: 'babyshoot', bucket: 'maternity', name: { en: 'Baby shoot', ta: 'குழந்தை படப்பிடிப்பு' }, blurb: { en: 'Newborn and milestone portraits', ta: 'பிறந்த குழந்தை & மைல்கல் படங்கள்' }, img: { en: 'm_baby_hat', ta: 't_diya_glow' }, couple: false, tiers: { kind: 'maternity' } },
  { key: 'prewedding', bucket: 'special', name: { en: 'Pre / post-wedding', ta: 'திருமணத்திற்கு முன் / பின்' }, blurb: { en: 'A couple shoot before or after the big day', ta: 'பெரிய நாளுக்கு முன்னோ பின்னோ ஜோடி படப்பிடிப்பு' }, img: { en: 'm_couple_pinksky', ta: 't_saree_temple' }, couple: true, tiers: { kind: 'shoot', shootItem: 'prepost_wedding' } },
  { key: 'outdoor', bucket: 'special', name: { en: 'Outdoor shoot', ta: 'வெளிப்புறப் படப்பிடிப்பு' }, blurb: { en: 'Couple, baby or maternity, on location', ta: 'ஜோடி, குழந்தை, வளைகாப்பு — வெளிப்புறத்தில்' }, img: { en: 'm_couple_field', ta: 't_tn_paddy' }, couple: false, tiers: { kind: 'shoot', shootItem: 'outdoor_couple' } },
  { key: 'model', bucket: 'special', name: { en: 'Model portfolio', ta: 'மாடல் போர்ட்ஃபோலியோ' }, blurb: { en: 'Studio or street, looks that land', ta: 'ஸ்டுடியோவோ தெருவோ, கவரும் தோற்றங்கள்' }, img: { en: 'm_bride_studio', ta: 't_dance_pose' }, couple: false, tiers: { kind: 'shoot', shootItem: 'model_portfolio' } },
  { key: 'commercial', bucket: 'special', name: { en: 'Commercial / ad shoot', ta: 'வணிக / விளம்பரப் படப்பிடிப்பு' }, blurb: { en: 'Products, spaces and campaigns', ta: 'பொருட்கள், இடங்கள், பிரச்சாரங்கள்' }, img: { en: 'e_commercial', ta: 'e_commercial' }, couple: false, tiers: { kind: 'shoot', shootItem: 'commercial_shoot' } },
  { key: 'corporate', bucket: 'special', name: { en: 'Corporate event', ta: 'நிறுவன நிகழ்வு' }, blurb: { en: 'Conferences, launches and team days', ta: 'மாநாடுகள், அறிமுகங்கள், குழு நாட்கள்' }, img: { en: 'e_corporate', ta: 'e_corporate' }, couple: false, tiers: { kind: 'corporate' } },
]

export const eventsIn = (bucket: EventBucket) => EVENTS.filter(e => e.bucket === bucket)

export const eventByKey = (key: string) => EVENTS.find(e => e.key === key)

// ─── Crowd & venue ───────────────────────────────────────────────────────────

export type CrowdKey = 'intimate' | 'medium' | 'large' | 'grand'

export const CROWDS: { key: CrowdKey; name: Bi; range: string; add: number; note: Bi }[] = [
  { key: 'intimate', name: { en: 'Intimate', ta: 'சிறிய விழா' }, range: '< 50', add: 0, note: { en: 'Homes, close family', ta: 'வீடு, நெருங்கிய உறவினர்' } },
  { key: 'medium', name: { en: 'Medium', ta: 'நடுத்தரம்' }, range: '50–150', add: 2500, note: { en: 'Small halls', ta: 'சிறிய மண்டபம்' } },
  { key: 'large', name: { en: 'Large', ta: 'பெரியது' }, range: '150–400', add: 6000, note: { en: '+1 second photographer', ta: '+1 கூடுதல் புகைப்படக் கலைஞர்' } },
  { key: 'grand', name: { en: 'Grand', ta: 'பிரமாண்டம்' }, range: '400+', add: 12000, note: { en: 'Three-person team', ta: 'மூவர் குழு' } },
]

export type VenueType = 'home' | 'mahal'

export const VENUES: { key: VenueType; name: Bi; note: Bi; add: number; img: Bi<ImgKey> }[] = [
  { key: 'home', name: { en: 'Home', ta: 'இல்லம்' }, note: { en: 'Intimate, natural light, close quarters', ta: 'இயற்கை ஒளி, நெருக்கமான சூழல்' }, add: 0, img: { en: 'm_haldi_laugh', ta: 't_kolam_door' } },
  { key: 'mahal', name: { en: 'Mahal / Hall', ta: 'மண்டபம்' }, note: { en: 'Stage lighting kit & wide lenses', ta: 'மேடை விளக்கு & அகல லென்ஸ்' }, add: 3000, img: { en: 'm_rec_hall', ta: 't_temple_pillars' } },
]

export const TRAVEL_FREE_KM = 20
export const TRAVEL_PER_KM = 40

// ─── Order pipeline ──────────────────────────────────────────────────────────

export type OrderStatus =
  | 'ENQUIRY'
  | 'TEAM_MEETING'
  | 'BRIDE_GROOM_MEETING'
  | 'EVENT_PICTURES'
  | 'SELECT_PHOTOS'
  | 'ALBUM_CUSTOMIZATION'
  | 'BILLED'
  | 'DELIVERED'

export const STATUS_ORDER: OrderStatus[] = [
  'ENQUIRY',
  'TEAM_MEETING',
  'BRIDE_GROOM_MEETING',
  'EVENT_PICTURES',
  'SELECT_PHOTOS',
  'ALBUM_CUSTOMIZATION',
  'BILLED',
  'DELIVERED',
]

export const STATUS_META: Record<OrderStatus, { name: Bi; desc: Bi; cta?: { label: Bi; to: string } }> = {
  ENQUIRY: {
    name: { en: 'Enquiry received', ta: 'விசாரணை பெறப்பட்டது' },
    desc: { en: 'Thank you for trusting us with your day — we’ll call your family to confirm the date.', ta: 'உங்கள் நாளை எங்களிடம் நம்பி ஒப்படைத்ததற்கு நன்றி — தேதியை உறுதிசெய்ய உங்கள் குடும்பத்தை அழைப்போம்.' },
    cta: { label: { en: 'Track order', ta: 'ஆர்டர் நிலை' }, to: '/dashboard/track' },
  },
  TEAM_MEETING: {
    name: { en: 'Team meeting', ta: 'குழு கூட்டம்' },
    desc: { en: 'Our team is planning coverage and assigning photographers.', ta: 'எங்கள் குழு படப்பிடிப்பைத் திட்டமிட்டு கலைஞர்களை ஒதுக்குகிறது.' },
    cta: { label: { en: 'Track order', ta: 'ஆர்டர் நிலை' }, to: '/dashboard/track' },
  },
  BRIDE_GROOM_MEETING: {
    name: { en: 'Couple meeting', ta: 'மணமக்கள் சந்திப்பு' },
    desc: { en: 'A walkthrough of rituals, shot list and timings with you.', ta: 'சடங்குகள், படப் பட்டியல், நேரம் பற்றி உங்களுடன் கலந்துரையாடல்.' },
    cta: { label: { en: 'Track order', ta: 'ஆர்டர் நிலை' }, to: '/dashboard/track' },
  },
  EVENT_PICTURES: {
    name: { en: 'Event captured', ta: 'நிகழ்வு படம்பிடிக்கப்பட்டது' },
    desc: { en: 'The day is done. Your photos are being culled and graded.', ta: 'விழா முடிந்தது. படங்கள் தேர்ந்தெடுத்து மெருகேற்றப்படுகின்றன.' },
    cta: { label: { en: 'Track order', ta: 'ஆர்டர் நிலை' }, to: '/dashboard/track' },
  },
  SELECT_PHOTOS: {
    name: { en: 'Select your photos', ta: 'படங்களைத் தேர்ந்தெடுக்கவும்' },
    desc: { en: 'Your proofing gallery is open. Pick favourites for the album.', ta: 'உங்கள் தேர்வு கேலரி திறந்துள்ளது. ஆல்பத்திற்கான படங்களைத் தேர்ந்தெடுங்கள்.' },
    cta: { label: { en: 'Select photos', ta: 'படங்களைத் தேர்ந்தெடு' }, to: '/dashboard/photos' },
  },
  ALBUM_CUSTOMIZATION: {
    name: { en: 'Design your album', ta: 'ஆல்பம் வடிவமைப்பு' },
    desc: { en: 'Choose cover, paper, size and typography for your album.', ta: 'அட்டை, தாள், அளவு, எழுத்துருவைத் தேர்ந்தெடுங்கள்.' },
    cta: { label: { en: 'Customize album', ta: 'ஆல்பம் வடிவமை' }, to: '/dashboard/album' },
  },
  BILLED: {
    name: { en: 'Invoice ready', ta: 'ரசீது தயார்' },
    desc: { en: 'Your final invoice is ready. Payments are made offline.', ta: 'இறுதி ரசீது தயார். கட்டணம் நேரடியாகச் செலுத்தலாம்.' },
    cta: { label: { en: 'View invoice', ta: 'ரசீது பார்க்க' }, to: '/dashboard/billing' },
  },
  DELIVERED: {
    name: { en: 'Delivered', ta: 'ஒப்படைக்கப்பட்டது' },
    desc: { en: 'Your album is home. We would love your review.', ta: 'உங்கள் ஆல்பம் வீடு வந்துவிட்டது. உங்கள் கருத்தை எதிர்பார்க்கிறோம்.' },
    cta: { label: { en: 'Leave a review', ta: 'கருத்து தெரிவி' }, to: '/dashboard/review' },
  },
}

/** Couple events say "Couple meeting"; family ceremonies say "Family consultation". */
export function statusName(status: OrderStatus, eventKey: string | undefined, lang: 'en' | 'ta'): string {
  if (status === 'BRIDE_GROOM_MEETING' && eventKey && !eventByKey(eventKey)?.couple) {
    return lang === 'ta' ? 'குடும்ப ஆலோசனை' : 'Family consultation'
  }
  return STATUS_META[status].name[lang]
}

// ─── Team ────────────────────────────────────────────────────────────────────

export type WorkerRole = 'lead' | 'candid' | 'cinema' | 'drone' | 'assistant'

export const ROLES: Record<WorkerRole, Bi> = {
  lead: { en: 'Lead photographer', ta: 'முதன்மை புகைப்படக் கலைஞர்' },
  candid: { en: 'Candid photographer', ta: 'கேண்டிட் புகைப்படக் கலைஞர்' },
  cinema: { en: 'Cinematographer', ta: 'ஒளிப்பதிவாளர்' },
  drone: { en: 'Drone operator', ta: 'ட்ரோன் இயக்குநர்' },
  assistant: { en: 'Assistant / lighting', ta: 'உதவியாளர் / ஒளியமைப்பு' },
}

export interface Worker {
  id: string
  name: Bi
  role: WorkerRole
  district: DistrictKey
  phone: string
  available: boolean
  freelance: boolean
  rating: number
  jobs: number
}

export const SEED_WORKERS: Worker[] = [
  { id: 'w1', name: { en: 'Karthik Raja', ta: 'கார்த்திக் ராஜா' }, role: 'lead', district: 'madurai', phone: '+91 98421 11223', available: true, freelance: false, rating: 4.9, jobs: 312 },
  { id: 'w2', name: { en: 'Anand Kumar', ta: 'ஆனந்த் குமார்' }, role: 'cinema', district: 'chennai', phone: '+91 97890 22334', available: true, freelance: false, rating: 4.8, jobs: 241 },
  { id: 'w3', name: { en: 'Sowmya Ram', ta: 'சௌமியா ராம்' }, role: 'candid', district: 'coimbatore', phone: '+91 94432 33445', available: false, freelance: true, rating: 4.9, jobs: 188 },
  { id: 'w4', name: { en: 'Vignesh P.', ta: 'விக்னேஷ் பி.' }, role: 'lead', district: 'salem', phone: '+91 96554 44556', available: true, freelance: true, rating: 4.7, jobs: 156 },
  { id: 'w5', name: { en: 'Meena Lakshmi', ta: 'மீனா லட்சுமி' }, role: 'candid', district: 'thanjavur', phone: '+91 90030 55667', available: true, freelance: true, rating: 4.8, jobs: 97 },
  { id: 'w6', name: { en: 'Arul Selvan', ta: 'அருள் செல்வன்' }, role: 'drone', district: 'madurai', phone: '+91 99944 66778', available: true, freelance: false, rating: 4.6, jobs: 133 },
  { id: 'w7', name: { en: 'Divya Bharathi', ta: 'திவ்யா பாரதி' }, role: 'cinema', district: 'tirunelveli', phone: '+91 93601 77889', available: false, freelance: true, rating: 4.7, jobs: 84 },
  { id: 'w8', name: { en: 'Surya Prakash', ta: 'சூர்யா பிரகாஷ்' }, role: 'assistant', district: 'dindigul', phone: '+91 95000 88990', available: true, freelance: true, rating: 4.5, jobs: 61 },
]

// ─── Album options ───────────────────────────────────────────────────────────

export const ALBUM = {
  covers: [
    { key: 'leather', name: { en: 'Italian leatherette', ta: 'இத்தாலிய லெதரெட்' } },
    { key: 'velvet', name: { en: 'Royal velvet', ta: 'ராயல் வெல்வெட்' } },
    { key: 'acrylic', name: { en: 'Acrylic photo cover', ta: 'அக்ரிலிக் புகைப்பட அட்டை' } },
    { key: 'linen', name: { en: 'Natural linen', ta: 'இயற்கை லினன்' } },
    { key: 'silk', name: { en: 'Kanchipuram silk', ta: 'காஞ்சிப் பட்டு' } },
  ],
  colors: [
    { key: 'onyx', name: { en: 'Onyx', ta: 'கருமை' }, hex: '#0f0f10', ink: '#ffffff' },
    { key: 'ruby', name: { en: 'Ruby', ta: 'மாணிக்கம்' }, hex: '#9e1233', ink: '#ffffff' },
    { key: 'maroon', name: { en: 'Maroon', ta: 'அரக்கு' }, hex: '#5a0a1c', ink: '#ffffff' },
    { key: 'ivory', name: { en: 'Ivory', ta: 'தந்தம்' }, hex: '#f3f1ec', ink: '#0a0a0b' },
    { key: 'pearl', name: { en: 'Pearl white', ta: 'முத்து வெண்மை' }, hex: '#ffffff', ink: '#0a0a0b' },
    { key: 'charcoal', name: { en: 'Charcoal', ta: 'கரி சாம்பல்' }, hex: '#2a2a2d', ink: '#ffffff' },
  ],
  papers: [
    { key: 'matte', name: { en: 'Fine-art matte', ta: 'ஃபைன்-ஆர்ட் மேட்' }, note: { en: 'Soft, no glare', ta: 'மென்மை, பளபளப்பு இல்லை' } },
    { key: 'lustre', name: { en: 'Lustre silk', ta: 'லஸ்டர் சில்க்' }, note: { en: 'Rich colour, light sheen', ta: 'செழுமையான நிறம்' } },
    { key: 'metallic', name: { en: 'Metallic pearl', ta: 'மெட்டாலிக் பேர்ல்' }, note: { en: 'Luminous highlights', ta: 'ஒளிரும் தோற்றம்' } },
    { key: 'nt', name: { en: 'Non-tearable NT', ta: 'கிழியாத NT' }, note: { en: 'Waterproof, lasts decades', ta: 'நீர்ப்புகா, பல தசாப்தங்கள்' } },
  ],
  sizes: [
    { key: '12x36', name: '12 × 36"', note: { en: 'Panoramic classic', ta: 'பனோரமிக் கிளாசிக்' } },
    { key: '12x30', name: '12 × 30"', note: { en: 'Most popular', ta: 'மிகப் பிரபலம்' } },
    { key: '10x24', name: '10 × 24"', note: { en: 'Compact', ta: 'சிறிய அளவு' } },
    { key: '12x12', name: '12 × 12"', note: { en: 'Square, modern', ta: 'சதுரம், நவீனம்' } },
  ],
  fonts: [
    { key: 'classic', name: { en: 'Classic serif', ta: 'கிளாசிக் செரிஃப்' }, family: "'Cormorant Garamond', serif", italic: true },
    { key: 'tamil-classic', name: { en: 'Tamil classical', ta: 'தமிழ் செவ்வியல்' }, family: "'Noto Serif Tamil', serif", italic: false },
    { key: 'tamil-callig', name: { en: 'Tamil calligraphic', ta: 'தமிழ் எழுத்தணி' }, family: "'Arima', serif", italic: false },
    { key: 'modern', name: { en: 'Modern minimal', ta: 'நவீன எளிமை' }, family: "'Inter', sans-serif", italic: false },
  ],
  sheetOptions: [30, 40, 50, 60],
  sheetPrice: 450,
} as const

export interface AlbumSpec {
  cover: string
  color: string
  paper: string
  size: string
  font: string
  sheets: number
  title: string
  subtitle: string
}

export const DEFAULT_ALBUM: AlbumSpec = {
  cover: 'leather',
  color: 'onyx',
  paper: 'lustre',
  size: '12x30',
  font: 'classic',
  sheets: 30,
  title: '',
  subtitle: '',
}

// ─── Proofing ────────────────────────────────────────────────────────────────

/** Watermarked low-res proofs shown in the selection portal (mocked GCS listing). */
export const PROOF_SETS: Record<'modern' | 'traditional', ImgKey[]> = {
  modern: [
    'm_couple_bokeh', 'm_bride_red', 'm_hands_rings', 'm_couple_royal', 'm_couple_night', 'm_hands_mehndi',
    'm_bride_smile', 'm_couple_white', 'm_stage', 'm_couple_forest', 'm_bride_redlight', 'm_couple_walk',
    'm_rec_toast', 'm_rec_dance', 'm_decor_mandap', 'm_ring_hold', 'm_mehndi_hands', 'm_mehndi_red',
    'm_haldi_bride', 'm_haldi_shower', 'm_bride_nath', 'm_couple_lights', 'm_couple_swing', 'm_bride_veil2',
  ],
  traditional: [
    't_bride_silk', 't_couple_garland', 't_ritual_fire', 't_ritual_hands', 't_ritual_offering', 't_couple_seated',
    't_ritual_garland', 't_bride_henna', 't_saree_gold', 't_saree_purple', 't_jewel_temple', 't_jewel_set',
    't_jasmine_garland', 't_diya_hands', 't_lamp_brass', 't_kolam_hand', 't_mehndi_red', 't_manjal_bride',
    't_manjal_shower', 't_temple_mandapam', 't_dance_temple', 't_saree_sea2', 't_marigold_hands', 't_ritual_color',
  ],
}

/** Group frames — appended after the language sets so existing proof file numbers stay stable. */
export const PROOF_EXTRAS: ImgKey[] = ['m_rec_party', 'm_baby_family', 't_temple_frame', 't_temple_blue']

export type ProofCategory = 'individuals' | 'traditional' | 'groups' | 'candids'

/** Gallery chapters, in display order — Individuals always opens first. */
export const PROOF_CATEGORIES: { key: ProofCategory; name: Bi; blurb: Bi }[] = [
  {
    key: 'individuals',
    name: { en: 'Individuals', ta: 'தனிப்படங்கள்' },
    blurb: { en: 'Portraits of the two of you — and each of you alone.', ta: 'உங்கள் இருவரின் உருவப்படங்கள் — தனித்தனியாகவும்.' },
  },
  {
    key: 'traditional',
    name: { en: 'Traditional', ta: 'பாரம்பரியம்' },
    blurb: { en: 'Rituals, jewellery, lamps and the details that carry the ceremony.', ta: 'சடங்குகள், நகைகள், விளக்குகள் — விழாவைச் சுமக்கும் நுணுக்கங்கள்.' },
  },
  {
    key: 'groups',
    name: { en: 'Groups', ta: 'குழுப்படங்கள்' },
    blurb: { en: 'Family, friends and everyone who came to celebrate.', ta: 'குடும்பம், நண்பர்கள், கொண்டாட வந்த அனைவரும்.' },
  },
  {
    key: 'candids',
    name: { en: 'Candids', ta: 'இயல்புப் படங்கள்' },
    blurb: { en: 'Unposed moments, caught between the ones you planned.', ta: 'திட்டமிடாத தருணங்கள், இயல்பாகப் பிடிக்கப்பட்டவை.' },
  },
]

/** Category per proof (mock — the backend will store this per uploaded file). Unlisted proofs are candids. */
export const PROOF_CATEGORY: Partial<Record<ImgKey, ProofCategory>> = {
  m_bride_red: 'individuals', m_bride_smile: 'individuals', m_bride_redlight: 'individuals', m_bride_nath: 'individuals',
  m_bride_veil2: 'individuals', m_mehndi_red: 'individuals', m_couple_royal: 'individuals', m_couple_white: 'individuals',
  t_bride_silk: 'individuals', t_bride_henna: 'individuals', t_saree_gold: 'individuals', t_saree_purple: 'individuals',
  t_saree_sea2: 'individuals', t_jewel_temple: 'individuals', t_dance_temple: 'individuals', t_manjal_bride: 'individuals',

  m_hands_rings: 'traditional', m_stage: 'traditional', m_decor_mandap: 'traditional', t_couple_garland: 'traditional',
  t_ritual_fire: 'traditional', t_ritual_hands: 'traditional', t_ritual_offering: 'traditional', t_couple_seated: 'traditional',
  t_ritual_garland: 'traditional', t_jewel_set: 'traditional', t_jasmine_garland: 'traditional', t_diya_hands: 'traditional',
  t_lamp_brass: 'traditional', t_kolam_hand: 'traditional', t_temple_mandapam: 'traditional', t_marigold_hands: 'traditional',
  t_ritual_color: 'traditional', t_mehndi_red: 'traditional',

  m_rec_toast: 'groups', m_rec_dance: 'groups', m_rec_party: 'groups', m_baby_family: 'groups',
  t_temple_frame: 'groups', t_temple_blue: 'groups', t_manjal_shower: 'groups', m_haldi_shower: 'groups',
}

/** Magazine cover for a client's gallery, set by the studio. Name and date are free text. */
export interface GalleryCover {
  /** 4–5 proofs collaged into the banner. */
  banner: ImgKey[]
  /** Display picture shown in the middle of the cover. */
  dp: ImgKey
  name: string
  date: string
}
