import type { Bi } from './i18n'
import type { IconName } from '../components/Icon'

/*
 * The studio's rate card — the single source of truth for everything that
 * carries a price. The cart, the packages, the live quote and the invoice are
 * all built from these rows, so an admin price edit flows everywhere.
 *
 * Facts and prices come from docs/meeting-notes.md and docs/roadmap.md.
 * Unconfirmed price = ₹786 plus `pending: true`; the admin catalogue tab lists
 * every pending item in one place.
 */

export const PLACEHOLDER_PRICE = 786

export type Section = 'crew' | 'addon' | 'deliverable' | 'special'

export type CatalogueId =
  // Crew — priced per session (4 h), scaled by the hours multiplier
  | 'trad_photo' | 'trad_video'
  // Candid styles — bundle groups (see BUNDLES)
  | 'candid_couple' | 'candid_family' | 'candid_guests'
  | 'vid_documentary' | 'vid_moments' | 'vid_cinematic'
  // Package-only crew options
  | 'portrait_hour' | 'candid_individual' | 'couple_portrait_hour'
  // Add-ons
  | 'drone' | 'drone_fpv' | 'pendrive' | 'semi_candid_video' | 'reels'
  | 'einvite' | 'einvite_premium' | 'ledwall' | 'photobooth' | 'selfie360'
  // Albums (one per cart). Line, size, colour and box live in cart.album (Phase 2).
  | 'album_25' | 'album_35' | 'album_45'
  | 'album_1028_25' | 'album_1028_35' | 'album_1028_45'
  | 'album_a4_15' | 'album_1028_pkg_25'
  | 'wooden_box' | 'album_dual'
  // Frames and prints
  | 'frame_a4' | 'frame_a3' | 'frame_12x18' | 'frame_16x24' | 'frame_20x30'
  | 'magazine' | 'minibook' | 'calendar'
  // Included with every booking
  | 'soft_all' | 'soft_edited' | 'trad_film' | 'candid_film' | 'hard_disk_copy' | 'online_gallery'
  // Special shoots — priced per shoot
  | 'prepost_wedding' | 'outdoor_couple' | 'outdoor_baby' | 'outdoor_maternity' | 'model_portfolio' | 'commercial_shoot'
  // Outdoor shoot module: three looks (the packages) and the mini session
  | 'look_temple' | 'look_beach' | 'look_meadow' | 'outdoor_mini'
  // Commercial plans — per month, enquiry only
  | 'commercial_brand' | 'commercial_school'

/** Items that are mutually exclusive — the cart keeps one of each group. */
export type ExclusiveGroup = 'album'

/** Candid style groups that carry a bundle discount. */
export type BundleGroup = 'candid_photo' | 'candid_video'

export interface CatalogueItem {
  id: CatalogueId
  section: Section
  name: Bi
  note?: Bi
  /** Rupees. Zero means included at no charge. */
  price: number
  /**
   * How the price multiplies: per session (× hours multiplier), per piece,
   * per shoot, per month (enquiry only), or not at all.
   */
  unit: 'session' | 'each' | 'shoot' | 'included' | 'month'
  /** Only one item from the group can be in the cart. */
  group?: ExclusiveGroup
  /** Candid style group with a bundle rule. */
  bundle?: BundleGroup
  /** Upper bound for the quantity stepper. */
  max?: number
  /** Price still to be confirmed with the studio. */
  pending?: boolean
  /** Shown with "Ask us" instead of a price; not addable to the cart. */
  onRequest?: boolean
  /** Only reachable through a package, never as a standalone add. */
  packageOnly?: boolean
  /** No mini session: the multiplier is ceil(hours / 4). */
  noMini?: boolean
  /** Only makes sense alongside an outdoor shoot. */
  requiresOutdoor?: boolean
  icon: IconName
  /** Row in the client's Excel sheet, for the audit trail. */
  excelRow?: number
}

const P = PLACEHOLDER_PRICE

export const CATALOGUE: CatalogueItem[] = [
  // ── Crew ──────────────────────────────────────────────────────────────────
  { id: 'trad_photo', section: 'crew', unit: 'session', max: 4, price: 12500, icon: 'camera', excelRow: 1,
    name: { en: 'Traditional photography', ta: 'பாரம்பரிய புகைப்படம்' }, note: { en: 'Stage, rituals and family portraits · 4 h session', ta: 'மேடை, சடங்குகள், குடும்பப் படங்கள் · 4 மணி நேர அமர்வு' } },
  { id: 'trad_video', section: 'crew', unit: 'session', max: 4, price: 10000, icon: 'film', excelRow: 2,
    name: { en: 'Traditional videography', ta: 'பாரம்பரிய வீடியோ' }, note: { en: 'Full coverage, with the 30-min full film', ta: 'முழு வீடியோ, 30 நிமிட முழுப் படத்துடன்' } },
  // Candid photo styles — any 2: 25 % off · all 3: ₹20,000 flat
  { id: 'candid_couple', section: 'crew', unit: 'session', max: 1, bundle: 'candid_photo', price: 6000, icon: 'heart',
    name: { en: 'Candid · couple portraits', ta: 'கேண்டிட் · ஜோடி படங்கள்' }, note: { en: 'The two of you, unposed', ta: 'நீங்கள் இருவரும், இயல்பாக' } },
  { id: 'candid_family', section: 'crew', unit: 'session', max: 1, bundle: 'candid_photo', price: 12000, icon: 'users',
    name: { en: 'Candid · couple & family moments', ta: 'கேண்டிட் · ஜோடி & குடும்ப தருணங்கள்' }, note: { en: 'Rituals and emotions as they happen', ta: 'சடங்குகளும் உணர்வுகளும் நடக்கும்போதே' } },
  { id: 'candid_guests', section: 'crew', unit: 'session', max: 1, bundle: 'candid_photo', price: 7500, icon: 'sparkle',
    name: { en: 'Candid · guests', ta: 'கேண்டிட் · விருந்தினர்கள்' }, note: { en: 'Friends, relatives, the crowd', ta: 'நண்பர்கள், உறவினர்கள், கூட்டம்' } },
  // Candid video styles — any 2: ₹25,000 · all 3: ₹35,000
  { id: 'vid_documentary', section: 'crew', unit: 'session', max: 1, bundle: 'candid_video', price: 13500, icon: 'film',
    name: { en: 'Candid video · documentary', ta: 'கேண்டிட் வீடியோ · ஆவணப் பாணி' }, note: { en: 'The day as it unfolded, with interviews', ta: 'அன்று நடந்தபடியே, பேட்டிகளுடன்' } },
  { id: 'vid_moments', section: 'crew', unit: 'session', max: 1, bundle: 'candid_video', price: 14500, icon: 'play',
    name: { en: 'Candid video · candid moments', ta: 'கேண்டிட் வீடியோ · இயல்பான தருணங்கள்' }, note: { en: 'Laughter, tears, the small things', ta: 'சிரிப்பு, கண்ணீர், சிறிய விஷயங்கள்' } },
  { id: 'vid_cinematic', section: 'crew', unit: 'session', max: 1, bundle: 'candid_video', price: 15500, icon: 'sparkle',
    name: { en: 'Candid video · cinematic', ta: 'கேண்டிட் வீடியோ · சினிமா பாணி' }, note: { en: 'Film-style highlight with music', ta: 'இசையுடன் சினிமா பாணி ஹைலைட்' } },
  // Package-only crew options
  { id: 'portrait_hour', section: 'crew', unit: 'each', max: 1, price: 2250, packageOnly: true, pending: true, icon: 'users',
    name: { en: 'Portrait hour before the event', ta: 'விழாவுக்கு முன் ஒரு மணி நேர படங்கள்' }, note: { en: 'Close family, at the venue', ta: 'நெருங்கிய குடும்பம், மண்டபத்தில்' } },
  { id: 'candid_individual', section: 'crew', unit: 'each', max: 1, price: 2250, packageOnly: true, pending: true, icon: 'sparkle',
    name: { en: '20–25 candid individual shots', ta: '20–25 கேண்டிட் தனிப் படங்கள்' } },
  { id: 'couple_portrait_hour', section: 'crew', unit: 'each', max: 1, price: P, packageOnly: true, pending: true, icon: 'heart',
    name: { en: '1-hour couple portrait session', ta: 'ஒரு மணி நேர ஜோடி படப்பிடிப்பு' } },
  // ── Add-ons ───────────────────────────────────────────────────────────────
  { id: 'drone', section: 'addon', unit: 'session', max: 1, noMini: true, price: 13000, icon: 'drone', excelRow: 5,
    name: { en: 'Drone · slow-motion', ta: 'ட்ரோன் · ஸ்லோ-மோஷன்' }, note: { en: 'Aerial stills & video · no mini session', ta: 'வான்வழி படங்கள் & வீடியோ · மினி அமர்வு இல்லை' } },
  { id: 'drone_fpv', section: 'addon', unit: 'session', max: 1, noMini: true, price: 20000, icon: 'drone',
    name: { en: 'FPV drone', ta: 'FPV ட்ரோன்' }, note: { en: 'Fast fly-through shots', ta: 'வேகமான பறக்கும் காட்சிகள்' } },
  { id: 'pendrive', section: 'addon', unit: 'each', max: 10, price: 1000, icon: 'grid',
    name: { en: 'Pendrive', ta: 'பென்டிரைவ்' }, note: { en: 'All files on a pendrive', ta: 'அனைத்து கோப்புகளும் பென்டிரைவில்' } },
  { id: 'semi_candid_video', section: 'addon', unit: 'each', max: 1, price: 10000, icon: 'play',
    name: { en: 'Semi-candid video', ta: 'செமி-கேண்டிட் வீடியோ' }, note: { en: '10–15 min film', ta: '10–15 நிமிடப் படம்' } },
  { id: 'reels', section: 'addon', unit: 'each', max: 5, price: 7000, requiresOutdoor: true, icon: 'play',
    name: { en: 'Reels + song recreation', ta: 'ரீல்ஸ் + பாடல் மறுஆக்கம்' }, note: { en: 'Only with an outdoor shoot', ta: 'வெளிப்புறப் படப்பிடிப்புடன் மட்டும்' } },
  { id: 'einvite', section: 'addon', unit: 'each', max: 1, price: 0, icon: 'mail', excelRow: 6,
    name: { en: 'E-invite · default designs', ta: 'மின் அழைப்பிதழ் · இயல்பு வடிவங்கள்' }, note: { en: 'Included', ta: 'அடங்கும்' } },
  { id: 'einvite_premium', section: 'addon', unit: 'each', max: 1, price: 1500, icon: 'gem',
    name: { en: 'E-invite · premium with caricature', ta: 'மின் அழைப்பிதழ் · கேரிகேச்சருடன் பிரீமியம்' } },
  { id: 'ledwall', section: 'addon', unit: 'each', max: 1, price: 0, onRequest: true, icon: 'maximize', excelRow: 7,
    name: { en: 'LED wall', ta: 'LED திரை' }, note: { en: 'Live feed for guests · ask us', ta: 'விருந்தினர்களுக்கு நேரலை · எங்களைக் கேளுங்கள்' } },
  { id: 'photobooth', section: 'addon', unit: 'each', max: 1, price: 0, onRequest: true, icon: 'image', excelRow: 8,
    name: { en: 'Photo booth', ta: 'போட்டோ பூத்' }, note: { en: 'Instant printed keepsakes · ask us', ta: 'உடனடி அச்சிட்ட படங்கள் · எங்களைக் கேளுங்கள்' } },
  { id: 'selfie360', section: 'addon', unit: 'each', max: 1, price: 0, onRequest: true, icon: 'refresh', excelRow: 9,
    name: { en: '360° booth', ta: '360° பூத்' }, note: { en: 'Slow-motion spinning videos · ask us', ta: 'சுழலும் ஸ்லோ-மோஷன் வீடியோ · எங்களைக் கேளுங்கள்' } },
  // ── Albums (price by sheet count; line/size/colour/box = cart.album) ──────
  { id: 'album_25', section: 'deliverable', unit: 'each', group: 'album', price: 6500, icon: 'book',
    name: { en: 'Album · 25 sheets', ta: 'ஆல்பம் · 25 தாள்' }, note: { en: 'Acroluxe, Aura, Allura or Pixel Passage', ta: 'அக்ரோலக்ஸ், ஆரா, அல்லூரா அல்லது பிக்சல் பாசேஜ்' } },
  { id: 'album_35', section: 'deliverable', unit: 'each', group: 'album', price: 10000, icon: 'book',
    name: { en: 'Album · 35 sheets', ta: 'ஆல்பம் · 35 தாள்' }, note: { en: 'Acroluxe, Aura, Allura or Pixel Passage', ta: 'அக்ரோலக்ஸ், ஆரா, அல்லூரா அல்லது பிக்சல் பாசேஜ்' } },
  { id: 'album_45', section: 'deliverable', unit: 'each', group: 'album', price: 14500, icon: 'book',
    name: { en: 'Album · 45 sheets', ta: 'ஆல்பம் · 45 தாள்' }, note: { en: 'Acroluxe, Aura, Allura or Pixel Passage', ta: 'அக்ரோலக்ஸ், ஆரா, அல்லூரா அல்லது பிக்சல் பாசேஜ்' } },
  { id: 'album_1028_25', section: 'deliverable', unit: 'each', group: 'album', price: 34999, icon: 'gem',
    name: { en: '10×28 album · 25 sheets', ta: '10×28 ஆல்பம் · 25 தாள்' }, note: { en: 'Wooden box, personalised cover on box and album', ta: 'மரப் பெட்டி, பெட்டியிலும் ஆல்பத்திலும் உங்கள் பெயர்' } },
  { id: 'album_1028_35', section: 'deliverable', unit: 'each', group: 'album', price: 37999, icon: 'gem',
    name: { en: '10×28 album · 35 sheets', ta: '10×28 ஆல்பம் · 35 தாள்' }, note: { en: 'Wooden box, personalised cover on box and album', ta: 'மரப் பெட்டி, பெட்டியிலும் ஆல்பத்திலும் உங்கள் பெயர்' } },
  { id: 'album_1028_45', section: 'deliverable', unit: 'each', group: 'album', price: 39999, icon: 'gem',
    name: { en: '10×28 album · 45 sheets', ta: '10×28 ஆல்பம் · 45 தாள்' }, note: { en: 'Wooden box, personalised cover on box and album', ta: 'மரப் பெட்டி, பெட்டியிலும் ஆல்பத்திலும் உங்கள் பெயர்' } },
  { id: 'album_a4_15', section: 'deliverable', unit: 'each', group: 'album', price: 1500, packageOnly: true, pending: true, icon: 'book',
    name: { en: 'A4 album · 15 sheets', ta: 'A4 ஆல்பம் · 15 தாள்' }, note: { en: 'Paper box · package only', ta: 'காகிதப் பெட்டி · தொகுப்பில் மட்டும்' } },
  { id: 'album_1028_pkg_25', section: 'deliverable', unit: 'each', group: 'album', price: 5000, packageOnly: true, pending: true, icon: 'book',
    name: { en: '10×28 paperback · 25 sheets', ta: '10×28 பேப்பர்பேக் · 25 தாள்' }, note: { en: 'Wooden box · package only', ta: 'மரப் பெட்டி · தொகுப்பில் மட்டும்' } },
  { id: 'wooden_box', section: 'deliverable', unit: 'each', max: 2, price: P, pending: true, icon: 'gem',
    name: { en: 'Wooden box', ta: 'மரப் பெட்டி' }, note: { en: 'For 12×36 or 12×15 albums', ta: '12×36 அல்லது 12×15 ஆல்பங்களுக்கு' } },
  { id: 'album_dual', section: 'deliverable', unit: 'each', max: 1, price: P, pending: true, icon: 'book',
    name: { en: 'Dual books, one box', ta: 'இரு புத்தகங்கள், ஒரு பெட்டி' } },
  // ── Frames and prints ─────────────────────────────────────────────────────
  { id: 'frame_a4', section: 'deliverable', unit: 'each', max: 10, price: 750, packageOnly: true, pending: true, icon: 'image',
    name: { en: 'Frame · A4', ta: 'பிரேம் · A4' } },
  { id: 'frame_a3', section: 'deliverable', unit: 'each', max: 10, price: 1250, packageOnly: true, pending: true, icon: 'image',
    name: { en: 'Frame · A3', ta: 'பிரேம் · A3' } },
  { id: 'frame_12x18', section: 'deliverable', unit: 'each', max: 10, price: P, pending: true, icon: 'image', excelRow: 16,
    name: { en: 'Frame · 12×18 in', ta: 'பிரேம் · 12×18 அங்குலம்' } },
  { id: 'frame_16x24', section: 'deliverable', unit: 'each', max: 10, price: P, pending: true, icon: 'image', excelRow: 17,
    name: { en: 'Frame · 16×24 in', ta: 'பிரேம் · 16×24 அங்குலம்' } },
  { id: 'frame_20x30', section: 'deliverable', unit: 'each', max: 10, price: P, pending: true, icon: 'image', excelRow: 18,
    name: { en: 'Frame · 20×30 in', ta: 'பிரேம் · 20×30 அங்குலம்' } },
  { id: 'magazine', section: 'deliverable', unit: 'each', max: 10, price: 2500, pending: true, icon: 'rows', excelRow: 20,
    name: { en: 'Magazine', ta: 'மேகசின்' }, note: { en: 'Editorial-style printed magazine', ta: 'இதழ் பாணி அச்சு' } },
  { id: 'minibook', section: 'deliverable', unit: 'each', max: 10, price: 3500, pending: true, icon: 'book',
    name: { en: 'Mini book', ta: 'மினி புத்தகம்' }, note: { en: 'Pocket-size album for parents', ta: 'பெற்றோருக்கான சிறிய ஆல்பம்' } },
  { id: 'calendar', section: 'deliverable', unit: 'each', max: 1, price: 749, packageOnly: true, pending: true, icon: 'calendar',
    name: { en: 'Calendar', ta: 'காலண்டர்' }, note: { en: 'Desk or wall calendar · package only', ta: 'மேசை / சுவர் காலண்டர் · தொகுப்பில் மட்டும்' } },
  // ── Included with every booking ───────────────────────────────────────────
  { id: 'soft_all', section: 'deliverable', unit: 'included', price: 0, icon: 'grid', excelRow: 21,
    name: { en: 'All photos · soft copies', ta: 'அனைத்துப் படங்கள் · சாஃப்ட் காப்பி' }, note: { en: 'Every frame we shoot, unedited', ta: 'எடுத்த அனைத்துப் படங்களும்' } },
  { id: 'soft_edited', section: 'deliverable', unit: 'included', price: 0, icon: 'sparkle', excelRow: 22,
    name: { en: 'Edited photos · soft copies', ta: 'எடிட் செய்த படங்கள்' }, note: { en: 'Curated and colour-graded', ta: 'தேர்ந்தெடுத்து எடிட் செய்தவை' } },
  { id: 'trad_film', section: 'deliverable', unit: 'included', price: 0, icon: 'film', excelRow: 23,
    name: { en: 'Traditional video · 30-min full film', ta: 'பாரம்பரிய வீடியோ · 30 நிமிட முழுப் படம்' }, note: { en: 'With traditional videography', ta: 'பாரம்பரிய வீடியோவுடன்' } },
  { id: 'candid_film', section: 'deliverable', unit: 'included', price: 0, icon: 'play', excelRow: 24,
    name: { en: 'Candid highlight · 3–4 min', ta: 'கேண்டிட் ஹைலைட் · 3–4 நிமிடம்' }, note: { en: 'With candid videography', ta: 'கேண்டிட் வீடியோவுடன்' } },
  { id: 'hard_disk_copy', section: 'deliverable', unit: 'included', price: 0, icon: 'grid',
    name: { en: 'Copy to your hard disk', ta: 'உங்கள் ஹார்ட் டிஸ்கில் காப்பி' }, note: { en: "Bring your own hard disk and we'll copy every file onto it", ta: 'உங்கள் ஹார்ட் டிஸ்க் கொண்டு வாருங்கள், எல்லா கோப்புகளையும் காப்பி செய்து தருவோம்' } },
  { id: 'online_gallery', section: 'deliverable', unit: 'included', price: 0, icon: 'image',
    name: { en: 'Online gallery · 6 months', ta: 'ஆன்லைன் கேலரி · 6 மாதம்' }, note: { en: 'Your online gallery stays open for 6 months', ta: 'உங்கள் ஆன்லைன் கேலரி 6 மாதம் திறந்திருக்கும்' } },
  // ── Special shoots ────────────────────────────────────────────────────────
  { id: 'prepost_wedding', section: 'special', unit: 'shoot', max: 2, price: 15000, icon: 'heart', excelRow: 25,
    name: { en: 'Pre / post-wedding shoot', ta: 'திருமணத்திற்கு முன் / பின் படப்பிடிப்பு' }, note: { en: 'Half-day, one location', ta: 'அரை நாள், ஒரு இடம்' } },
  { id: 'outdoor_couple', section: 'special', unit: 'shoot', max: 2, price: 10000, icon: 'users', excelRow: 26,
    name: { en: 'Outdoor couple shoot', ta: 'வெளிப்புற ஜோடி படப்பிடிப்பு' }, note: { en: 'One look', ta: 'ஒரு தோற்றம்' } },
  { id: 'outdoor_baby', section: 'special', unit: 'shoot', max: 2, price: 10000, icon: 'star', excelRow: 27,
    name: { en: 'Outdoor baby shoot', ta: 'வெளிப்புறக் குழந்தை படப்பிடிப்பு' } },
  { id: 'outdoor_maternity', section: 'special', unit: 'shoot', max: 2, price: 10000, icon: 'heart', excelRow: 28,
    name: { en: 'Outdoor maternity shoot', ta: 'வெளிப்புற வளைகாப்பு படப்பிடிப்பு' } },
  { id: 'model_portfolio', section: 'special', unit: 'shoot', max: 2, price: 12000, pending: true, icon: 'eye',
    name: { en: 'Model portfolio shoot', ta: 'மாடல் போர்ட்ஃபோலியோ' }, note: { en: 'Studio or outdoor, half-day', ta: 'ஸ்டுடியோ / வெளிப்புறம், அரை நாள்' } },
  { id: 'commercial_shoot', section: 'special', unit: 'shoot', max: 2, price: 18000, pending: true, icon: 'building',
    name: { en: 'Commercial / ad shoot', ta: 'வணிக / விளம்பரப் படப்பிடிப்பு' }, note: { en: 'Products, interiors, campaigns', ta: 'பொருட்கள், உட்புறம், பிரச்சாரம்' } },
  // ── Outdoor shoot module ──────────────────────────────────────────────────
  { id: 'look_temple', section: 'special', unit: 'shoot', max: 1, price: 10000, icon: 'building',
    name: { en: 'Outdoor · traditional look', ta: 'வெளிப்புறம் · பாரம்பரியத் தோற்றம்' }, note: { en: 'Traditional attire, temple or heritage venue', ta: 'பாரம்பரிய உடை, கோயில் / பாரம்பரிய இடம்' } },
  { id: 'look_beach', section: 'special', unit: 'shoot', max: 1, price: 10000, icon: 'sparkle',
    name: { en: 'Outdoor · beach look', ta: 'வெளிப்புறம் · கடற்கரைத் தோற்றம்' }, note: { en: 'Freestyle attire, on the beach', ta: 'விருப்ப உடை, கடற்கரையில்' } },
  { id: 'look_meadow', section: 'special', unit: 'shoot', max: 1, price: 10000, icon: 'star',
    name: { en: 'Outdoor · meadow look', ta: 'வெளிப்புறம் · புல்வெளித் தோற்றம்' }, note: { en: 'Freestyle attire, early-morning meadow or garden', ta: 'விருப்ப உடை, அதிகாலைப் புல்வெளி / தோட்டம்' } },
  { id: 'outdoor_mini', section: 'special', unit: 'shoot', max: 2, price: 6500, icon: 'camera',
    name: { en: 'Outdoor mini session · 2 h', ta: 'வெளிப்புற மினி அமர்வு · 2 மணி' }, note: { en: '65 % of a full outdoor look', ta: 'முழு வெளிப்புறத் தோற்றத்தில் 65 %' } },
  // ── Commercial plans (enquire, not in the cart) ───────────────────────────
  { id: 'commercial_brand', section: 'special', unit: 'month', price: 25000, icon: 'building',
    name: { en: 'Brand content plan', ta: 'பிராண்ட் உள்ளடக்கத் திட்டம்' }, note: { en: 'Per month · enquire', ta: 'மாதத்திற்கு · விசாரிக்கவும்' } },
  { id: 'commercial_school', section: 'special', unit: 'month', price: 35000, icon: 'building',
    name: { en: 'School / institution plan', ta: 'பள்ளி / நிறுவனத் திட்டம்' }, note: { en: 'Per month · enquire', ta: 'மாதத்திற்கு · விசாரிக்கவும்' } },
]

export const CATALOGUE_BY_ID = Object.fromEntries(CATALOGUE.map(i => [i.id, i])) as Record<CatalogueId, CatalogueItem>
export const itemById = (id: string): CatalogueItem | undefined => CATALOGUE_BY_ID[id as CatalogueId]

/** Items an admin still has to confirm a price for. */
export const pendingItems = (prices: PriceMap = DEFAULT_PRICES) =>
  CATALOGUE.filter(i => i.pending || prices[i.id] === PLACEHOLDER_PRICE)

/** Can the customer add this item on their own? */
export const addable = (i: CatalogueItem) => !i.onRequest && !i.packageOnly && i.unit !== 'month' && i.unit !== 'included'

export const SECTION_META: Record<Section, { name: Bi; blurb: Bi; icon: IconName }> = {
  crew: { name: { en: 'Crew', ta: 'குழு' }, blurb: { en: 'Photographers and videographers for your hours', ta: 'உங்கள் மணி நேரத்திற்கான புகைப்பட & வீடியோ கலைஞர்கள்' }, icon: 'camera' },
  addon: { name: { en: 'Add-ons', ta: 'கூடுதல் சேவைகள்' }, blurb: { en: 'Extras for the day itself', ta: 'விழா நாளுக்கான கூடுதல்கள்' }, icon: 'sparkle' },
  deliverable: { name: { en: 'Deliverables', ta: 'வழங்கல்கள்' }, blurb: { en: 'Albums, frames and prints to keep', ta: 'ஆல்பங்கள், பிரேம்கள், அச்சுகள்' }, icon: 'book' },
  special: { name: { en: 'Special shoots', ta: 'சிறப்புப் படப்பிடிப்புகள்' }, blurb: { en: 'Separate sessions before or after', ta: 'முன் அல்லது பின் தனி அமர்வுகள்' }, icon: 'heart' },
}

/** Sheets in an album item, used by the album studio and proofing quota. */
export const ALBUM_SHEETS: Partial<Record<CatalogueId, number>> = {
  album_25: 25, album_35: 35, album_45: 45, album_1028_25: 25, album_1028_35: 35, album_1028_45: 45, album_a4_15: 15, album_1028_pkg_25: 25,
}
/** The three sheet tiers a customer can move between in the album studio. */
export const ALBUM_TIERS: { id: CatalogueId; sheets: number }[] = [
  { id: 'album_25', sheets: 25 }, { id: 'album_35', sheets: 35 }, { id: 'album_45', sheets: 45 },
]

// ─── Candid bundles ──────────────────────────────────────────────────────────

export interface BundleRule {
  name: Bi
  /** Price when exactly two styles are picked: a percentage off their sum, or a flat amount. */
  two: { pctOff: number } | { flat: number }
  /** Flat price for all three. */
  three: number
}

export const BUNDLES: Record<BundleGroup, BundleRule> = {
  candid_photo: { name: { en: 'Candid photo bundle', ta: 'கேண்டிட் புகைப்படத் தொகுப்பு' }, two: { pctOff: 25 }, three: 20000 },
  candid_video: { name: { en: 'Candid video bundle', ta: 'கேண்டிட் வீடியோத் தொகுப்பு' }, two: { flat: 25000 }, three: 35000 },
}

export const bundleItems = (g: BundleGroup) => CATALOGUE.filter(i => i.bundle === g)

/** Price for the chosen styles in a group, after the bundle rule. */
export function bundlePrice(g: BundleGroup, ids: CatalogueId[], prices: PriceMap = DEFAULT_PRICES): { sum: number; price: number; saving: number } {
  const sum = ids.reduce((s, id) => s + prices[id], 0)
  const rule = BUNDLES[g]
  let price = sum
  if (ids.length === 2) price = 'pctOff' in rule.two ? Math.round(sum * (1 - rule.two.pctOff / 100)) : rule.two.flat
  else if (ids.length >= 3) price = rule.three
  return { sum, price, saving: sum - price }
}

// ─── Coverage: hours → multiplier ────────────────────────────────────────────

export const MIN_HOURS = 2
export const MAX_HOURS = 16
export const SESSION_HOURS = 4

const REMAINDER_MULT: Record<number, number> = { 0: 0, 1: 0.35, 2: 0.65, 3: 1 }

/**
 * A 4-hour session is 1.00. Two hours is a mini session (0.65). Each hour
 * over a full session adds 0.35, then 0.65, and three hours rounds up to the
 * next session.
 */
export function hoursMultiplier(hours: number): number {
  const h = Math.min(MAX_HOURS, Math.max(MIN_HOURS, Math.round(hours)))
  const full = Math.floor(h / SESSION_HOURS)
  const rem = h % SESSION_HOURS
  return Math.round((full + REMAINDER_MULT[rem]) * 100) / 100
}

/** Drone has no mini session: whole sessions only. */
export const droneMultiplier = (hours: number) => Math.ceil(Math.min(MAX_HOURS, Math.max(MIN_HOURS, Math.round(hours))) / SESSION_HOURS)

export interface Coverage {
  hours: number
  multiplier: number
  /** "6 hours = 1 session + 2 hours overtime (+65 %)" */
  label: Bi
}

export function coverageFor(hours: number): Coverage {
  const h = Math.min(MAX_HOURS, Math.max(MIN_HOURS, Math.round(hours)))
  const multiplier = hoursMultiplier(h)
  const full = Math.floor(h / SESSION_HOURS)
  const rem = h % SESSION_HOURS
  const pct = Math.round(REMAINDER_MULT[rem] * 100)
  let en: string
  let ta: string
  if (h < SESSION_HOURS) {
    en = `${h} hours = mini session (${Math.round(multiplier * 100)} % of a session)`
    ta = `${h} மணி நேரம் = மினி அமர்வு (அமர்வில் ${Math.round(multiplier * 100)} %)`
  } else if (rem === 0) {
    en = `${h} hours = ${full} session${full > 1 ? 's' : ''}`
    ta = `${h} மணி நேரம் = ${full} அமர்வு`
  } else if (rem === 3) {
    en = `${h} hours = rounds up to ${full + 1} sessions`
    ta = `${h} மணி நேரம் = ${full + 1} அமர்வாகக் கணக்கிடப்படும்`
  } else {
    en = `${h} hours = ${full} session${full > 1 ? 's' : ''} + ${rem} hour${rem > 1 ? 's' : ''} overtime (+${pct} %)`
    ta = `${h} மணி நேரம் = ${full} அமர்வு + ${rem} மணி நேரம் கூடுதல் (+${pct} %)`
  }
  return { hours: h, multiplier, label: { en, ta } }
}

export const OVERTIME_NOTE: Bi = {
  en: 'Running over on the day is charged per extra hour started: +35 % for one hour, +65 % for two.',
  ta: 'அன்று நேரம் கூடினால், தொடங்கிய ஒவ்வொரு கூடுதல் மணி நேரத்திற்கும் கட்டணம்: ஒரு மணி நேரத்திற்கு +35 %, இரண்டிற்கு +65 %.',
}

// ─── Prices (catalogue + admin overrides) ────────────────────────────────────

export type PriceMap = Record<CatalogueId, number>

export const DEFAULT_PRICES: PriceMap = Object.fromEntries(CATALOGUE.map(i => [i.id, i.price])) as PriceMap

/** Catalogue prices with the admin's overrides applied. */
export function resolvePrices(overrides: Partial<Record<string, number>> = {}): PriceMap {
  const out = { ...DEFAULT_PRICES }
  for (const [k, v] of Object.entries(overrides)) if (k in out && typeof v === 'number' && v >= 0) out[k as CatalogueId] = v
  return out
}

// ─── Cart ────────────────────────────────────────────────────────────────────

export type FixedTier = 'basic' | 'standard' | 'premium'
export type TierKey = FixedTier | 'custom'

export interface Cart {
  /** The package the cart started from, or custom once a main item is removed. */
  tier: TierKey
  /**
   * Legacy whole-session count, kept so older orders and callers keep working.
   * The engine reads `hours` when present and falls back to sessions × 4.
   */
  sessions: number
  /** Hours of coverage on the day (2–16). Drives the per-session multiplier. */
  hours?: number
  /** Quantity per catalogue item. Absent or 0 means not in the cart. */
  items: Partial<Record<CatalogueId, number>>
  /** Package family the tier belongs to. Absent on old carts = family. */
  kind?: PresetKind
  /** Index into the package's variants (e.g. "bigger album"). Absent = the base package. */
  variant?: number
  /** Album spec chosen next to the album item: line, size, orientation, colour, box. */
  album?: AlbumChoice
}

/** The customer's album choices. The price comes from the album item; this is the spec. */
export interface AlbumChoice {
  /** Key into ALBUM_LINES in data.ts. */
  line: 'pixel_passage' | 'aura' | 'acroluxe' | 'allura'
  /** As printed in the catalogue, e.g. "12×18". */
  size: string
  orientation: 'landscape' | 'portrait'
  /** Swatch name from the line's colours. */
  colour?: string
  /** Wooden box ordered with the album. */
  box?: boolean
}

export const MIN_SESSIONS = 1
export const MAX_SESSIONS = 4

/** Hours of coverage → whole sessions, for the legacy `sessions` field. */
export const sessionsForHours = (hours: number) => Math.min(MAX_SESSIONS, Math.max(MIN_SESSIONS, Math.ceil(hours / SESSION_HOURS)))
/** Hours the engine prices a cart at. */
export const cartHours = (cart: Cart) => Math.min(MAX_HOURS, Math.max(MIN_HOURS, cart.hours ?? cart.sessions * SESSION_HOURS))

export const EMPTY_CART: Cart = { tier: 'standard', sessions: 1, hours: SESSION_HOURS, items: {} }

const INCLUDED_IDS = ['soft_all', 'soft_edited', 'trad_film', 'candid_film', 'hard_disk_copy', 'online_gallery'] as const
const CREW_IDS: CatalogueId[] = ['trad_photo', 'trad_video', 'candid_couple', 'candid_family', 'candid_guests', 'vid_documentary', 'vid_moments', 'vid_cinematic']

/** Included deliverables ride along with the crew that produces them. */
export function withIncluded(items: Cart['items']): Cart['items'] {
  const out: Cart['items'] = { ...items }
  for (const k of INCLUDED_IDS) delete out[k]
  const hasCrew = CREW_IDS.some(k => (out[k] ?? 0) > 0)
  if (hasCrew) {
    out.soft_all = 1
    out.soft_edited = 1
    out.hard_disk_copy = 1
    out.online_gallery = 1
  }
  if ((out.trad_video ?? 0) > 0) out.trad_film = 1
  if (bundleItems('candid_video').some(i => (out[i.id] ?? 0) > 0)) out.candid_film = 1
  return out
}

export const cartQty = (cart: Cart, id: CatalogueId) => cart.items[id] ?? 0

/** Items that count as an outdoor shoot, for add-ons like reels that need one. */
export const OUTDOOR_IDS: CatalogueId[] = ['look_temple', 'look_beach', 'look_meadow', 'outdoor_mini', 'outdoor_couple', 'outdoor_baby', 'outdoor_maternity', 'prepost_wedding']
export const hasOutdoor = (items: Cart['items']) => OUTDOOR_IDS.some(id => (items[id] ?? 0) > 0)

/**
 * Sets a quantity, enforcing exclusive groups and item maximums. Removing a
 * package's main item switches the cart to custom; any other change keeps the
 * package (and its saving) and the label becomes "Gold + Drone − Calendar".
 */
export function setCartQty(cart: Cart, id: CatalogueId, qty: number): Cart {
  const item = CATALOGUE_BY_ID[id]
  const items: Cart['items'] = { ...cart.items }
  const n = Math.max(0, Math.min(item.max ?? 99, Math.round(qty)))
  if (item.group) for (const other of CATALOGUE) if (other.group === item.group && other.id !== id) delete items[other.id]
  if (n > 0) items[id] = item.group ? 1 : n
  else delete items[id]
  // Reels need an outdoor shoot: refuse them without one, and drop them when the last one goes.
  if (!hasOutdoor(items)) {
    if (item.requiresOutdoor && n > 0) return cart
    for (const other of CATALOGUE) if (other.requiresOutdoor) delete items[other.id]
  }
  const removesMain = n === 0 && isMainItem(cart, id)
  // Swapping the package album for its variant album keeps the package and switches variant.
  let variant = cart.variant
  let swapsMainAlbum = false
  if (n > 0 && item.group === 'album' && cart.tier !== 'custom') {
    const preset = PRESETS[cart.kind ?? 'family'][cart.tier]
    const base = (preset.variants ?? []).find(v => v.swap.from === id) ? id : undefined
    const vi = (preset.variants ?? []).findIndex(v => v.swap.to === id)
    if (vi >= 0) variant = vi
    else if (base) variant = undefined
    else swapsMainAlbum = mainItems(cart).some(m => m !== id && CATALOGUE_BY_ID[m].group === 'album' && (cart.items[m] ?? 0) > 0)
  }
  const custom = cart.tier === 'custom' || removesMain || swapsMainAlbum
  const tier: TierKey = custom ? 'custom' : cart.tier
  return { ...cart, tier, variant: custom ? undefined : variant, items: withIncluded(items) }
}

export const albumIn = (cart: Cart): CatalogueItem | undefined => CATALOGUE.find(i => i.group === 'album' && (cart.items[i.id] ?? 0) > 0)
export const albumSheets = (cart: Cart): number => ALBUM_SHEETS[albumIn(cart)?.id ?? 'album_25'] ?? 0

const ALBUM_1028_TIERS: Record<number, CatalogueId> = { 25: 'album_1028_25', 35: 'album_1028_35', 45: 'album_1028_45' }

/** Sheet tiers the album studio offers: 25 / 35 / 45. */
export const ALBUM_SHEET_TIERS = [25, 35, 45] as const

/**
 * What moving the cart's album to `sheets` costs on top of the album already
 * paid for: the difference between the two catalogue prices, never negative.
 * A 10×28 album moves within the 10×28 tiers; everything else (including the
 * package-only A4 and 10×28 paperback) moves to the standard 25/35/45 tiers.
 * With no album in the cart the full tier price is due.
 */
export function albumUpgradeCost(cart: Cart, sheets: number, prices: PriceMap = DEFAULT_PRICES): number {
  const current = albumIn(cart)
  const is1028 = current && current.id.startsWith('album_1028_') && current.id !== 'album_1028_pkg_25'
  const targetId = is1028 ? ALBUM_1028_TIERS[sheets] : ALBUM_TIERS.find(t => t.sheets === sheets)?.id
  if (!targetId) return 0
  if (current && ALBUM_SHEETS[current.id] === sheets && (is1028 || ALBUM_TIERS.some(t => t.id === current.id))) return 0
  return Math.max(0, prices[targetId] - (current ? prices[current.id] : 0))
}

/** Items in the cart with their quantities, catalogue order. */
export function cartEntries(cart: Cart): { item: CatalogueItem; qty: number }[] {
  return CATALOGUE.filter(i => (cart.items[i.id] ?? 0) > 0).map(i => ({ item: i, qty: cart.items[i.id]! }))
}

// ─── Packages ────────────────────────────────────────────────────────────────

/**
 * Which package family an event uses. Weddings and family functions get
 * Bronze / Silver / Gold; baby and maternity are lighter; special shoots are
 * priced per shoot; corporate work is crew only, no albums.
 */
export type PresetKind = 'family' | 'wedding' | 'outdoor' | 'maternity' | 'shoot' | 'corporate'

export interface PackageVariant {
  label: Bi
  /** Replace `from` with `to` in the package's items. */
  swap: { from: CatalogueId; to: CatalogueId }
  target: number
}

export interface TierPreset {
  items: Partial<Record<CatalogueId, number>>
  /** Marketing one-liner for the card. */
  pitch: Bi
  /**
   * What the customer pays for the package. When this differs from the sum of
   * its items, the engine adds a "Package saving" line for the difference.
   * Absent = the sum is the price.
   */
  target?: number
  /** Removing one of these ends the package; everything else is an option. */
  main?: CatalogueId[]
  /** Card name when it differs from Bronze / Silver / Gold. */
  name?: Bi
  /** Alternative versions of the package, e.g. a bigger album. */
  variants?: PackageVariant[]
  /** Target price still to be confirmed (₹786). */
  pending?: boolean
}

export const TIER_META: Record<TierKey, { name: Bi; popular?: boolean }> = {
  basic: { name: { en: 'Bronze', ta: 'பிராஞ்ச்' } },
  standard: { name: { en: 'Silver', ta: 'சில்வர்' }, popular: true },
  premium: { name: { en: 'Gold', ta: 'கோல்ட்' } },
  custom: { name: { en: 'Custom', ta: 'நீங்களே மாற்றியது' } },
}

const PRESETS: Record<PresetKind, Record<FixedTier, TierPreset>> = {
  family: {
    basic: {
      items: { trad_photo: 1 },
      target: 12500,
      main: ['trad_photo'],
      pitch: { en: 'Traditional photography, one 4-hour session.', ta: 'பாரம்பரிய புகைப்படம், ஒரு 4 மணி நேர அமர்வு.' },
    },
    standard: {
      items: { trad_photo: 1, portrait_hour: 1, candid_individual: 1, album_a4_15: 1, calendar: 1, frame_a4: 1 },
      target: 19999,
      main: ['trad_photo', 'album_a4_15'],
      variants: [{ label: { en: '12×15 · 25 sheets', ta: '12×15 · 25 தாள்' }, swap: { from: 'album_a4_15', to: 'album_25' }, target: 24999 }],
      pitch: { en: 'Adds a portrait hour, candid individual shots, an A4 album, calendar and frame.', ta: 'ஒரு மணி நேர படங்கள், கேண்டிட் தனிப் படங்கள், A4 ஆல்பம், காலண்டர், பிரேம் கூடுதலாக.' },
    },
    premium: {
      items: { trad_photo: 1, portrait_hour: 1, candid_individual: 1, album_1028_pkg_25: 1, calendar: 1, frame_a3: 1, semi_candid_video: 1 },
      target: 29999,
      main: ['trad_photo', 'album_1028_pkg_25', 'semi_candid_video'],
      variants: [{ label: { en: '12×36 · 35 sheets', ta: '12×36 · 35 தாள்' }, swap: { from: 'album_1028_pkg_25', to: 'album_35' }, target: 34999 }],
      pitch: { en: 'The 10×28 album in a wooden box, semi-candid video, A3 frame and calendar.', ta: 'மரப் பெட்டியில் 10×28 ஆல்பம், செமி-கேண்டிட் வீடியோ, A3 பிரேம், காலண்டர்.' },
    },
  },
  wedding: {
    basic: {
      name: { en: 'Package 1', ta: 'தொகுப்பு 1' },
      items: { trad_photo: 1, trad_video: 1, outdoor_mini: 1 },
      target: P, pending: true,
      main: ['trad_photo', 'trad_video'],
      pitch: { en: 'Traditional photo and video with the 30-min film, plus a 2-hour outdoor mini shoot.', ta: 'பாரம்பரிய படம் & வீடியோ (30 நிமிடப் படம்), 2 மணி நேர வெளிப்புற மினி படப்பிடிப்பு.' },
    },
    standard: {
      name: { en: 'Package 2', ta: 'தொகுப்பு 2' },
      items: { trad_photo: 1, trad_video: 1, look_temple: 1, couple_portrait_hour: 1, frame_a3: 1 },
      target: P, pending: true,
      main: ['trad_photo', 'trad_video', 'look_temple'],
      pitch: { en: 'A full 4-hour outdoor shoot, a couple portrait hour and an A3 frame.', ta: 'முழு 4 மணி நேர வெளிப்புறப் படப்பிடிப்பு, ஜோடி படப்பிடிப்பு, A3 பிரேம்.' },
    },
    premium: {
      name: { en: 'Tier 2', ta: 'அடுக்கு 2' },
      items: { trad_photo: 1, trad_video: 1, album_1028_25: 1 },
      target: P, pending: true,
      main: ['trad_photo', 'trad_video', 'album_1028_25'],
      pitch: { en: 'Coverage with the 10×28 album in a personalised wooden box.', ta: 'தனிப்பயன் மரப் பெட்டியில் 10×28 ஆல்பத்துடன் படப்பிடிப்பு.' },
    },
  },
  outdoor: {
    basic: {
      name: { en: 'Traditional look', ta: 'பாரம்பரியத் தோற்றம்' },
      items: { look_temple: 1 },
      target: 10000,
      main: ['look_temple'],
      pitch: { en: 'Traditional attire at a temple or heritage venue.', ta: 'கோயில் / பாரம்பரிய இடத்தில் பாரம்பரிய உடையில்.' },
    },
    standard: {
      name: { en: 'Beach look', ta: 'கடற்கரைத் தோற்றம்' },
      items: { look_beach: 1 },
      target: 10000,
      main: ['look_beach'],
      pitch: { en: 'Freestyle attire on the beach.', ta: 'கடற்கரையில் விருப்ப உடையில்.' },
    },
    premium: {
      name: { en: 'Meadow look', ta: 'புல்வெளித் தோற்றம்' },
      items: { look_meadow: 1 },
      target: 10000,
      main: ['look_meadow'],
      pitch: { en: 'Freestyle attire in an early-morning meadow or garden.', ta: 'அதிகாலைப் புல்வெளி / தோட்டத்தில் விருப்ப உடையில்.' },
    },
  },
  maternity: {
    basic: {
      items: { trad_photo: 1 },
      pitch: { en: 'One photographer, every photo delivered digitally.', ta: 'ஒரு புகைப்படக் கலைஞர், அனைத்துப் படங்களும் டிஜிட்டலாக.' },
    },
    standard: {
      items: { trad_photo: 1, candid_family: 1, minibook: 1 },
      pitch: { en: 'Candid coverage too, plus a mini book to keep.', ta: 'கேண்டிட் படங்களும், வைத்துக்கொள்ள ஒரு மினி புத்தகமும்.' },
    },
    premium: {
      items: { trad_photo: 1, candid_family: 1, vid_moments: 1, album_25: 1, frame_12x18: 1 },
      pitch: { en: 'Photo, candid video, an album and a framed print.', ta: 'படம், கேண்டிட் வீடியோ, ஆல்பம், பிரேம் செய்த அச்சு.' },
    },
  },
  shoot: {
    basic: {
      items: {},
      pitch: { en: 'The shoot itself, all photos delivered digitally.', ta: 'படப்பிடிப்பு மட்டும், அனைத்துப் படங்களும் டிஜிட்டலாக.' },
    },
    standard: {
      items: { drone: 1, minibook: 1 },
      pitch: { en: 'Adds drone frames and a mini book.', ta: 'ட்ரோன் படங்களும் மினி புத்தகமும் கூடுதலாக.' },
    },
    premium: {
      items: { drone: 1, album_25: 1, frame_20x30: 1, magazine: 1 },
      pitch: { en: 'Drone, album, a large frame and a magazine.', ta: 'ட்ரோன், ஆல்பம், பெரிய பிரேம், மேகசின்.' },
    },
  },
  corporate: {
    basic: {
      items: { trad_photo: 1 },
      pitch: { en: 'Event photography, delivered same week.', ta: 'நிகழ்வுப் புகைப்படம், அதே வாரம் வழங்கல்.' },
    },
    standard: {
      items: { trad_photo: 1, trad_video: 1 },
      pitch: { en: 'Photo and full-length video coverage.', ta: 'புகைப்படம் மற்றும் முழு நீள வீடியோ.' },
    },
    premium: {
      items: { trad_photo: 1, trad_video: 1, candid_family: 1, vid_cinematic: 1, drone: 1 },
      pitch: { en: 'Four cameras and a drone.', ta: 'நான்கு கேமராக்களும் ட்ரோனும்.' },
    },
  },
}

export interface TierSpec {
  kind: PresetKind
  /** Special-shoot events add their own shoot item to every tier. */
  shootItem?: CatalogueId
}

/** A preset's items with a variant's swap applied. */
function presetItems(spec: TierSpec, tier: FixedTier, variant?: number): Cart['items'] {
  const preset = PRESETS[spec.kind][tier]
  const items: Cart['items'] = { ...preset.items }
  const v = variant === undefined ? undefined : preset.variants?.[variant]
  if (v) {
    delete items[v.swap.from]
    items[v.swap.to] = 1
  }
  if (spec.shootItem) items[spec.shootItem] = 1
  return items
}

/** The cart a package expands to for a given event. */
export function tierCart(spec: TierSpec, tier: FixedTier, sessions = 1, hours?: number, variant?: number): Cart {
  const v = variant !== undefined && PRESETS[spec.kind][tier].variants?.[variant] ? variant : undefined
  return { tier, kind: spec.kind, variant: v, sessions, hours: hours ?? sessions * SESSION_HOURS, items: withIncluded(presetItems(spec, tier, v)) }
}

/** Items of the package as it was chosen (variant applied), for packageInfo. */
export const packageBaseItems = (spec: TierSpec, tier: FixedTier, variant?: number) => presetItems(spec, tier, variant)

/** Target price of a package, honouring the chosen variant. */
export function presetTarget(spec: TierSpec, tier: FixedTier, variant?: number): number | undefined {
  const preset = PRESETS[spec.kind][tier]
  const v = variant === undefined ? undefined : preset.variants?.[variant]
  return v ? v.target : preset.target
}

/** Card name: Bronze / Silver / Gold unless the preset names itself. */
export const presetName = (spec: TierSpec, tier: FixedTier): Bi => PRESETS[spec.kind][tier].name ?? TIER_META[tier].name

export const tierPitch = (spec: TierSpec, tier: FixedTier): Bi => PRESETS[spec.kind][tier].pitch
export const tierPreset = (spec: TierSpec, tier: FixedTier): TierPreset => PRESETS[spec.kind][tier]

/** Main items of the cart's package, with the chosen variant's swap applied. */
function mainItems(cart: Cart): CatalogueId[] {
  if (cart.tier === 'custom') return []
  const preset = PRESETS[cart.kind ?? 'family'][cart.tier]
  const v = cart.variant === undefined ? undefined : preset.variants?.[cart.variant]
  return (preset.main ?? []).map(id => (v && v.swap.from === id ? v.swap.to : id))
}
export const isMainItem = (cart: Cart, id: CatalogueId) => mainItems(cart).includes(id)

/** List price of a package's own items at one session, before any saving. */
export function presetSum(spec: TierSpec, tier: FixedTier, prices: PriceMap = DEFAULT_PRICES, variant?: number): number {
  return Object.entries(presetItems(spec, tier, variant)).reduce((s, [id, qty]) => s + prices[id as CatalogueId] * (qty ?? 0), 0)
}

/** Package saving = target − sum. Zero when the package has no target. */
export function presetSaving(spec: TierSpec, tier: FixedTier, prices: PriceMap = DEFAULT_PRICES, variant?: number): number {
  const target = presetTarget(spec, tier, variant)
  return target === undefined ? 0 : target - presetSum(spec, tier, prices, variant)
}

/** Price difference between a package's variant and its base, e.g. Silver 12×15 = +₹5,000. */
export function variantDelta(spec: TierSpec, tier: FixedTier, variant: number, prices: PriceMap = DEFAULT_PRICES): number {
  const base = presetTarget(spec, tier) ?? presetSum(spec, tier, prices)
  const v = presetTarget(spec, tier, variant) ?? presetSum(spec, tier, prices, variant)
  return v - base
}

/** The package family a cart belongs to: its own kind, else the event's. */
export const cartSpec = (cart: Cart, spec?: TierSpec): TierSpec => (spec && (!cart.kind || cart.kind === spec.kind) ? spec : { kind: cart.kind ?? 'family' })

/** Items of the cart's own package (variant applied); empty once the cart is custom. */
export function cartPackageItems(cart: Cart, spec?: TierSpec): Cart['items'] {
  return cart.tier === 'custom' ? {} : presetItems(cartSpec(cart, spec), cart.tier, cart.variant)
}

/** Would setting this quantity end the cart's package? The UI warns first. */
export const endsPackage = (cart: Cart, id: CatalogueId, qty: number) => cart.tier !== 'custom' && setCartQty(cart, id, qty).tier === 'custom'

/** What moving the cart's album to `id` adds to the total (negative when it is cheaper). */
export function albumDelta(cart: Cart, id: CatalogueId, prices: PriceMap = DEFAULT_PRICES): number {
  const current = albumIn(cart)
  return prices[id] - (current ? prices[current.id] : 0)
}

/** Sets the hours of coverage, keeping the legacy sessions field in step. */
export function setCartHours(cart: Cart, hours: number): Cart {
  const h = Math.min(MAX_HOURS, Math.max(MIN_HOURS, Math.round(hours)))
  return { ...cart, hours: h, sessions: sessionsForHours(h) }
}

/** Every package kind, for the admin price tab. */
export const PRESET_KINDS = Object.keys(PRESETS) as PresetKind[]

// ─── Describing a cart ───────────────────────────────────────────────────────

export const tierName = (tier: TierKey): Bi => TIER_META[tier].name

/** The cart's package name, using its preset kind (e.g. "Package 2", "Beach look"). */
export const cartTierName = (cart: Cart): Bi =>
  cart.tier === 'custom' ? TIER_META.custom.name : presetName({ kind: cart.kind ?? 'family' }, cart.tier)

/** Crew lines in the cart. */
export const cartCrew = (cart: Cart) => cartEntries(cart).filter(e => e.item.section === 'crew')

/** Everything beyond the crew that carries a price — the "extras" chips. */
export const cartExtras = (cart: Cart) => cartEntries(cart).filter(e => e.item.section !== 'crew' && e.item.unit !== 'included')

/** Short bilingual label like "Silver · 6 h". */
export const cartLabel = (cart: Cart): Bi => {
  const h = cartHours(cart)
  return {
    en: `${cartTierName(cart).en} · ${h} h`,
    ta: `${cartTierName(cart).ta} · ${h} மணி நேரம்`,
  }
}
