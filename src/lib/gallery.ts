import type { Bi, Lang } from './i18n'
import type { DistrictKey } from './data'
import type { ImgKey } from './images'

export type GalleryCat = 'weddings' | 'prewedding' | 'engagement' | 'reception' | 'ceremonies' | 'little' | 'culture'

export const GALLERY_CATS: { key: GalleryCat | 'all'; name: Bi }[] = [
  { key: 'all', name: { en: 'All work', ta: 'அனைத்தும்' } },
  { key: 'weddings', name: { en: 'Weddings', ta: 'திருமணங்கள்' } },
  { key: 'prewedding', name: { en: 'Pre-wedding & outdoor', ta: 'முன்-திருமண & வெளிப்புறம்' } },
  { key: 'engagement', name: { en: 'Engagements', ta: 'நிச்சயதார்த்தம்' } },
  { key: 'reception', name: { en: 'Receptions & décor', ta: 'வரவேற்பு & அலங்காரம்' } },
  { key: 'ceremonies', name: { en: 'Family ceremonies', ta: 'குடும்ப விழாக்கள்' } },
  { key: 'little', name: { en: 'Birthdays & babies', ta: 'பிறந்தநாள் & குழந்தைகள்' } },
  { key: 'culture', name: { en: 'Temple & culture', ta: 'கோயில் & பண்பாடு' } },
]

/** modern → shown in English, traditional → shown in Tamil, both → always. */
export type Tone = 'modern' | 'traditional' | 'both'

export interface GalleryItem {
  id: string
  img?: ImgKey
  /** External image (added through the Admin CMS). */
  url?: string
  ratio?: number
  cat: GalleryCat
  tone: Tone
  title: Bi
  district: DistrictKey
  story?: string
}

const g = (img: ImgKey, cat: GalleryCat, tone: Tone, en: string, ta: string, district: DistrictKey, story?: string): GalleryItem => ({
  id: img, img, cat, tone, title: { en, ta }, district, story,
})

export const GALLERY: GalleryItem[] = [
  // ── Weddings (contemporary) ──
  g('m_couple_lights', 'weddings', 'modern', 'Under a canopy of lights', 'விளக்குகளின் கீழ்', 'chennai', 'golden-hour-chennai'),
  g('m_couple_bokeh', 'weddings', 'modern', 'The first look', 'முதல் பார்வை', 'chennai', 'golden-hour-chennai'),
  g('m_couple_swing', 'weddings', 'both', 'Oonjal, the swing ritual', 'ஊஞ்சல் சடங்கு', 'madurai'),
  g('m_bride_red', 'weddings', 'modern', 'Crimson and gold', 'சிவப்பும் பொன்னும்', 'chennai', 'golden-hour-chennai'),
  g('m_hands_rings', 'weddings', 'both', 'Hands that hold', 'இணைந்த கைகள்', 'salem'),
  g('m_couple_royal', 'weddings', 'modern', 'A regal portrait', 'அரச தோற்றம்', 'coimbatore'),
  g('m_couple_night', 'weddings', 'modern', 'After the vows', 'வாக்குறுதிக்குப் பின்', 'chennai', 'golden-hour-chennai'),
  g('m_bride_bokeh', 'weddings', 'modern', 'Glow of the evening', 'மாலையின் ஒளி', 'salem'),
  g('m_hands_mehndi', 'weddings', 'both', 'Promise in henna', 'மருதாணியில் வாக்குறுதி', 'madurai'),
  g('m_bride_smile', 'weddings', 'both', 'Unguarded joy', 'இயல்பான மகிழ்ச்சி', 'chennai', 'golden-hour-chennai'),
  g('m_couple_white', 'weddings', 'modern', 'Ivory and red', 'தந்தமும் சிவப்பும்', 'coimbatore'),
  g('m_bride_veil', 'weddings', 'modern', 'Behind the veil', 'முக்காட்டின் பின்னால்', 'madurai'),
  g('m_couple_forest', 'weddings', 'modern', 'A walk among trees', 'மரங்களினூடே நடை', 'theni'),
  g('m_bride_redlight', 'weddings', 'modern', 'Ruby hour', 'மாணிக்க நேரம்', 'chennai'),
  g('m_couple_lights2', 'weddings', 'modern', 'Laughter in the lights', 'ஒளியில் சிரிப்பு', 'chennai', 'golden-hour-chennai'),
  g('m_bride_nath', 'weddings', 'modern', 'The nath, up close', 'மூக்குத்தி அருகில்', 'salem'),
  g('m_bride_dark', 'weddings', 'modern', 'Quiet before the mandap', 'மணமேடைக்கு முன் அமைதி', 'dindigul'),
  g('m_bride_shadow', 'weddings', 'modern', 'Light and shadow', 'ஒளியும் நிழலும்', 'coimbatore'),
  g('m_couple_walk', 'weddings', 'modern', 'Walking into forever', 'என்றென்றும் இணைந்து', 'theni'),
  g('m_bride_veil2', 'weddings', 'modern', 'Veiled in red', 'சிவப்புச் சேலையில்', 'salem'),
  g('m_bride_studio', 'weddings', 'modern', 'Studio bridal portrait', 'ஸ்டுடியோ மணப்பெண்', 'madurai'),

  // ── Weddings (traditional) ──
  g('t_couple_garland', 'weddings', 'both', 'Maalai maatral — exchange of garlands', 'மாலை மாற்றல்', 'madurai', 'meenakshi-muhurtham'),
  g('t_bride_silk', 'weddings', 'both', 'Kanchipuram silk bride', 'காஞ்சிப் பட்டு மணப்பெண்', 'madurai', 'meenakshi-muhurtham'),
  g('t_ritual_fire', 'weddings', 'both', 'Agni, the sacred witness', 'அக்னி சாட்சி', 'madurai', 'meenakshi-muhurtham'),
  g('t_ritual_hands', 'weddings', 'traditional', 'Kanyadaanam', 'கன்னிகாதானம்', 'madurai', 'meenakshi-muhurtham'),
  g('t_ritual_offering', 'weddings', 'traditional', 'Offerings of rice and flowers', 'அரிசியும் மலரும்', 'madurai', 'meenakshi-muhurtham'),
  g('t_couple_seated', 'weddings', 'traditional', 'Seated at the manavarai', 'மணவறையில்', 'thanjavur'),
  g('t_ritual_garland', 'weddings', 'traditional', 'Garlands of blessing', 'ஆசி மாலைகள்', 'madurai', 'meenakshi-muhurtham'),
  g('t_ritual_color', 'weddings', 'traditional', 'Colours of the muhurtham', 'முகூர்த்த வண்ணங்கள்', 'tirunelveli'),
  g('t_bride_henna', 'weddings', 'traditional', 'Maruthaani on the morning of', 'காலை மருதாணி', 'madurai', 'meenakshi-muhurtham'),
  g('t_saree_gold', 'weddings', 'traditional', 'Silk and temple gold', 'பட்டும் கோயில் பொன்னும்', 'thanjavur', 'manjal-neerattu-thanjavur'),
  g('t_saree_sea', 'weddings', 'traditional', 'Silk by the sea', 'கடலருகே பட்டு', 'chennai'),
  g('t_saree_sea2', 'weddings', 'traditional', 'Marina morning', 'மெரினா காலை', 'chennai'),
  g('t_saree_purple', 'weddings', 'traditional', 'Violet Kanjivaram', 'ஊதா காஞ்சிவரம்', 'tirunelveli', 'nellai-lamps'),
  g('t_saree_temple', 'weddings', 'traditional', 'Among temple stones', 'கோயில் கற்களிடையே', 'thanjavur', 'nellai-lamps'),
  g('t_saree_red', 'weddings', 'traditional', 'Zari on red silk', 'சிவப்புப் பட்டில் சரிகை', 'salem'),
  g('t_saree_fabric', 'weddings', 'traditional', 'The korvai border', 'கோர்வை பார்டர்', 'thanjavur'),
  g('t_jewel_temple', 'weddings', 'traditional', 'Temple jewellery', 'கோயில் நகைகள்', 'madurai', 'meenakshi-muhurtham'),
  g('t_jewel_set', 'weddings', 'traditional', 'Kemp stones and pearls', 'கெம்பும் முத்தும்', 'tirunelveli', 'nellai-lamps'),
  g('t_jewel_red', 'weddings', 'traditional', 'The bridal set', 'மணப்பெண் நகைகள்', 'salem'),
  g('t_jewel_emerald', 'weddings', 'traditional', 'Emerald and ruby', 'மரகதமும் மாணிக்கமும்', 'coimbatore'),
  g('t_jewel_smile', 'weddings', 'traditional', 'Adorned', 'அணிகலன்', 'chennai'),
  g('t_mehndi_red', 'weddings', 'traditional', 'Maruthaani patterns', 'மருதாணி கோலங்கள்', 'dindigul'),
  g('t_jasmine_garland', 'weddings', 'both', 'Malli, strung by hand', 'கையால் தொடுத்த மல்லி', 'madurai', 'meenakshi-muhurtham'),

  // ── Pre-wedding & outdoor ──
  g('m_couple_mist', 'prewedding', 'modern', 'Kodai in the mist', 'பனியில் கொடை', 'dindigul', 'kodaikanal-mist'),
  g('m_couple_lake', 'prewedding', 'modern', 'By the lake', 'ஏரிக்கரையில்', 'dindigul', 'kodaikanal-mist'),
  g('m_couple_pinksky', 'prewedding', 'modern', 'Pink sky evening', 'இளஞ்சிவப்பு வானம்', 'chennai'),
  g('m_couple_dupatta', 'prewedding', 'modern', 'Wrapped in red', 'சிவப்பில் சுற்றி', 'coimbatore'),
  g('m_couple_fort', 'prewedding', 'modern', 'Arches of the old fort', 'பழைய கோட்டை வளைவுகள்', 'dindigul'),
  g('m_bride_twirl', 'prewedding', 'modern', 'The twirl', 'சுழல் நடனம்', 'dindigul', 'kodaikanal-mist'),
  g('m_couple_path', 'prewedding', 'modern', 'Down the garden path', 'தோட்டப் பாதையில்', 'dindigul', 'kodaikanal-mist'),
  g('m_couple_garden', 'prewedding', 'modern', 'Among the greens', 'பசுமையினூடே', 'theni', 'kodaikanal-mist'),
  g('m_couple_field', 'prewedding', 'modern', 'Open fields', 'திறந்த வயல்', 'theni'),
  g('m_couple_bw', 'prewedding', 'modern', 'Monochrome', 'கருப்பு வெள்ளை', 'chennai'),
  g('m_couple_dance', 'prewedding', 'modern', 'A dance in the woods', 'காட்டில் ஒரு நடனம்', 'dindigul', 'kodaikanal-mist'),
  g('m_couple_yellow', 'prewedding', 'modern', 'Yellow wall, warm hearts', 'மஞ்சள் சுவர்', 'madurai'),
  g('m_proposal', 'prewedding', 'modern', 'The proposal', 'காதல் முன்மொழிவு', 'dindigul', 'kodaikanal-mist'),
  g('m_bride_rock', 'prewedding', 'modern', 'Falls and flowing red', 'அருவியும் சிவப்பும்', 'theni', 'kodaikanal-mist'),
  g('m_couple_lens', 'prewedding', 'modern', 'Through the lens', 'லென்ஸ் வழியே', 'dindigul', 'kodaikanal-mist'),
  g('m_cp_sunset', 'prewedding', 'modern', 'Last light', 'கடைசி ஒளி', 'chennai'),
  g('m_cp_laugh', 'prewedding', 'modern', 'Just us', 'நாம் மட்டும்', 'coimbatore'),
  g('m_cp_hug', 'prewedding', 'modern', 'Held close', 'அணைப்பில்', 'theni'),
  g('m_cp_bw', 'prewedding', 'modern', 'Studio, black and white', 'ஸ்டுடியோ கருப்பு வெள்ளை', 'madurai'),
  g('m_cp_dark', 'prewedding', 'modern', 'Low-key portrait', 'மங்கிய ஒளி உருவப்படம்', 'madurai'),

  // ── Engagements ──
  g('m_ring_hands', 'engagement', 'both', 'The ring, the moment', 'மோதிரத் தருணம்', 'salem'),
  g('m_ring_hold', 'engagement', 'modern', 'Yes', 'சம்மதம்', 'chennai'),
  g('m_ring_box', 'engagement', 'modern', 'Before the question', 'கேள்விக்கு முன்', 'coimbatore'),
  g('m_ring_hands2', 'engagement', 'modern', 'Offered', 'அர்ப்பணிப்பு', 'salem'),
  g('t_marigold_hands', 'engagement', 'traditional', 'Nichayathartham hands', 'நிச்சயதார்த்தக் கைகள்', 'tirunelveli', 'nellai-lamps'),

  // ── Receptions & décor ──
  g('m_rec_stage', 'reception', 'both', 'The reception stage', 'வரவேற்பு மேடை', 'salem'),
  g('m_rec_toast', 'reception', 'modern', 'A toast to them', 'அவர்களுக்காக', 'chennai', 'golden-hour-chennai'),
  g('m_rec_dance', 'reception', 'modern', 'On the dance floor', 'நடன மேடையில்', 'chennai', 'golden-hour-chennai'),
  g('m_rec_hall', 'reception', 'modern', 'Chandeliers and white linen', 'சரவிளக்குகள்', 'coimbatore'),
  g('m_rec_party', 'reception', 'modern', 'After hours', 'இரவு கொண்டாட்டம்', 'chennai'),
  g('m_stage', 'reception', 'modern', 'Mahal, lit for the night', 'ஒளிரும் மண்டபம்', 'salem'),
  g('m_decor_lights', 'reception', 'modern', 'Fairy lights and long tables', 'மின்மினி விளக்குகள்', 'coimbatore'),
  g('m_decor_stage', 'reception', 'modern', 'Stage in magenta', 'மெஜந்தா மேடை', 'salem'),
  g('m_decor_candle', 'reception', 'modern', 'Candlelit lounge', 'மெழுகுவர்த்தி ஒளி', 'chennai'),
  g('m_decor_mandap', 'reception', 'modern', 'Floral mandap', 'மலர் மணமேடை', 'madurai'),
  g('m_decor_aisle', 'reception', 'modern', 'The aisle', 'நடைபாதை', 'coimbatore'),
  g('m_pool_venue', 'reception', 'modern', 'Poolside celebration', 'நீச்சல் குளக் கொண்டாட்டம்', 'chennai'),
  g('t_lamp_many', 'reception', 'traditional', 'A hundred lamps', 'நூறு விளக்குகள்', 'tirunelveli', 'nellai-lamps'),
  g('t_rangoli_lamps', 'reception', 'traditional', 'Lamps on the kolam', 'கோலத்தில் விளக்குகள்', 'salem'),

  // ── Family ceremonies ──
  g('t_manjal_bride', 'ceremonies', 'both', 'Manjal Neerattu Vizha', 'மஞ்சள் நீராட்டு விழா', 'thanjavur', 'manjal-neerattu-thanjavur'),
  g('t_manjal_shower', 'ceremonies', 'traditional', 'A shower of blessings', 'ஆசி மழை', 'thanjavur', 'manjal-neerattu-thanjavur'),
  g('t_manjal_pot', 'ceremonies', 'traditional', 'Turmeric, freshly ground', 'புதிதாக அரைத்த மஞ்சள்', 'thanjavur', 'manjal-neerattu-thanjavur'),
  g('t_kolam_girls', 'ceremonies', 'traditional', 'Cousins and kolam', 'உறவுகளும் கோலமும்', 'thanjavur', 'manjal-neerattu-thanjavur'),
  g('t_diya_hands', 'ceremonies', 'both', 'Naming day lamp', 'பெயர் சூட்டு விளக்கு', 'madurai'),
  g('m_haldi_umbrella', 'ceremonies', 'modern', 'Haldi under the umbrella', 'குடையின் கீழ் மஞ்சள்', 'coimbatore', 'turmeric-henna-coimbatore'),
  g('m_haldi_bride', 'ceremonies', 'both', 'Turmeric blessings', 'மஞ்சள் ஆசி', 'coimbatore', 'turmeric-henna-coimbatore'),
  g('m_haldi_couple', 'ceremonies', 'modern', 'Haldi mischief', 'மஞ்சள் விளையாட்டு', 'coimbatore', 'turmeric-henna-coimbatore'),
  g('m_haldi_seated', 'ceremonies', 'modern', 'In marigold yellow', 'சாமந்தி மஞ்சளில்', 'coimbatore', 'turmeric-henna-coimbatore'),
  g('m_haldi_shower', 'ceremonies', 'modern', 'Petal rain', 'இதழ் மழை', 'coimbatore', 'turmeric-henna-coimbatore'),
  g('m_haldi_laugh', 'ceremonies', 'modern', 'Laughter, mid-ritual', 'சடங்கின் நடுவே சிரிப்பு', 'coimbatore', 'turmeric-henna-coimbatore'),
  g('m_mehndi_hands', 'ceremonies', 'both', 'Mehendi night', 'மருதாணி இரவு', 'coimbatore', 'turmeric-henna-coimbatore'),
  g('m_mehndi_red', 'ceremonies', 'modern', 'Henna on silk', 'பட்டில் மருதாணி', 'coimbatore', 'turmeric-henna-coimbatore'),
  g('m_mehndi_saree', 'ceremonies', 'modern', 'Patterns and pleats', 'கோலமும் மடிப்பும்', 'coimbatore', 'turmeric-henna-coimbatore'),
  g('m_mehndi_smile', 'ceremonies', 'modern', 'Show us your hands', 'கைகளைக் காட்டு', 'coimbatore', 'turmeric-henna-coimbatore'),

  // ── Birthdays & babies ──
  g('m_baby_wrap', 'little', 'both', 'Seven days old', 'ஏழு நாள் குழந்தை', 'madurai'),
  g('m_baby_smile', 'little', 'both', 'First smile', 'முதல் புன்னகை', 'chennai'),
  g('m_baby_hands', 'little', 'modern', 'Held by many hands', 'பல கைகளில்', 'salem'),
  g('m_baby_bw', 'little', 'modern', 'Tiny, in black and white', 'சின்னஞ்சிறு', 'madurai'),
  g('m_baby_hat', 'little', 'modern', 'Sleepy portrait', 'தூக்கத்தில்', 'coimbatore'),
  g('m_baby_family', 'little', 'modern', 'New parents', 'புதிய பெற்றோர்', 'chennai'),
  g('m_bday_girl', 'little', 'modern', 'Make a wish', 'ஒரு ஆசை', 'chennai'),
  g('m_bday_kids', 'little', 'modern', 'Blow!', 'ஊது!', 'salem'),
  g('m_bday_candles', 'little', 'both', 'Candles and cake', 'மெழுகுவர்த்தியும் கேக்கும்', 'madurai'),
  g('m_bday_cake', 'little', 'modern', 'The cake table', 'கேக் மேசை', 'coimbatore'),
  g('m_bday_hats', 'little', 'modern', 'Party hats', 'பார்ட்டி தொப்பிகள்', 'theni'),

  // ── Temple & culture ──
  g('t_gopuram_silhouette', 'culture', 'both', 'Gopuram at dusk', 'அந்தியில் கோபுரம்', 'madurai'),
  g('t_meenakshi', 'culture', 'traditional', 'Meenakshi Amman gopuram', 'மீனாட்சி அம்மன் கோபுரம்', 'madurai', 'meenakshi-muhurtham'),
  g('t_meenakshi_corridor', 'culture', 'traditional', 'Temple corridor', 'கோயில் பிரகாரம்', 'madurai'),
  g('t_tn_big', 'culture', 'traditional', 'Brihadeeswarar vimanam', 'பெரிய கோயில் விமானம்', 'thanjavur', 'manjal-neerattu-thanjavur'),
  g('t_tn_tanjore', 'culture', 'traditional', 'Thanjavur Big Temple', 'தஞ்சைப் பெரிய கோயில்', 'thanjavur'),
  g('t_gopuram_dusk', 'culture', 'traditional', 'Nellai gopuram', 'நெல்லை கோபுரம்', 'tirunelveli', 'nellai-lamps'),
  g('t_gopuram_colour', 'culture', 'traditional', 'A thousand sculptures', 'ஆயிரம் சிற்பங்கள்', 'madurai'),
  g('t_gopuram_carved', 'culture', 'traditional', 'Carved in stone', 'கல்லில் செதுக்கியது', 'thanjavur'),
  g('t_gopuram_sky', 'culture', 'traditional', 'Tower to the sky', 'வானுயர் கோபுரம்', 'tirunelveli'),
  g('t_gopuram_green', 'culture', 'traditional', 'Hill temple', 'மலைக் கோயில்', 'dindigul'),
  g('t_gopuram_detail', 'culture', 'traditional', 'Detail, eastern tower', 'கிழக்குக் கோபுரம்', 'madurai'),
  g('t_temple_tank', 'culture', 'traditional', 'Temple tank reflections', 'தெப்பக்குள பிரதிபலிப்பு', 'tirunelveli', 'nellai-lamps'),
  g('t_temple_mandapam', 'culture', 'traditional', 'Mandapam view', 'மண்டபக் காட்சி', 'madurai'),
  g('t_temple_gold', 'culture', 'traditional', 'Golden vimanam', 'பொன் விமானம்', 'thanjavur'),
  g('t_temple_pillars', 'culture', 'traditional', 'Thousand-pillar hall', 'ஆயிரங்கால் மண்டபம்', 'madurai'),
  g('t_tn_corridor', 'culture', 'traditional', 'Corridor of light', 'ஒளியின் பிரகாரம்', 'thanjavur'),
  g('t_tn_sunset', 'culture', 'traditional', 'Evening pooja', 'மாலைப் பூஜை', 'tirunelveli'),
  g('t_tn_tower', 'culture', 'traditional', 'Srirangam heights', 'உயர் கோபுரம்', 'thanjavur'),
  g('t_tn_carving', 'culture', 'traditional', 'Stone dancer', 'கல் நர்த்தகி', 'thanjavur'),
  g('t_tn_paddy', 'culture', 'traditional', 'Paddy, Theni', 'தேனி வயல்', 'theni'),
  g('t_tn_mist', 'culture', 'traditional', 'Western ghats', 'மேற்குத் தொடர்ச்சி மலை', 'coimbatore'),
  g('t_kolam_hand', 'culture', 'traditional', 'Drawing the kolam', 'கோலம் வரைதல்', 'madurai', 'nellai-lamps'),
  g('t_kolam_door', 'culture', 'traditional', 'Kolam at the threshold', 'வாசல் கோலம்', 'madurai'),
  g('t_kolam_dark', 'culture', 'traditional', 'Rice flour lines', 'அரிசி மாக் கோடுகள்', 'salem'),
  g('t_rangoli_diya', 'culture', 'traditional', 'Kolam with lamps', 'விளக்குக் கோலம்', 'tirunelveli', 'nellai-lamps'),
  g('t_rangoli_hand', 'culture', 'traditional', 'Colour by hand', 'கை வண்ணம்', 'chennai'),
  g('t_diya_glow', 'culture', 'traditional', 'Agal vilakku', 'அகல் விளக்கு', 'tirunelveli', 'nellai-lamps'),
  g('t_diya_single', 'culture', 'traditional', 'One flame', 'ஒரு சுடர்', 'madurai'),
  g('t_diya_many', 'culture', 'traditional', 'Karthigai Deepam', 'கார்த்திகை தீபம்', 'tirunelveli'),
  g('t_diya_rows', 'culture', 'traditional', 'Rows of light', 'விளக்கு வரிசை', 'thanjavur', 'manjal-neerattu-thanjavur'),
  g('t_lamp_brass', 'culture', 'traditional', 'Kuthu vilakku', 'குத்து விளக்கு', 'thanjavur', 'manjal-neerattu-thanjavur'),
  g('t_lamp_row', 'culture', 'traditional', 'Brass lamps in a row', 'பித்தளை விளக்குகள்', 'madurai'),
  g('t_lamp_fire', 'culture', 'traditional', 'Aarti', 'ஆரத்தி', 'tirunelveli'),
  g('t_jasmine_bunch', 'culture', 'traditional', 'Madurai malli', 'மதுரை மல்லி', 'madurai', 'manjal-neerattu-thanjavur'),
  g('t_jasmine_carpet', 'culture', 'traditional', 'Jasmine, by the kilo', 'கிலோ கணக்கில் மல்லி', 'madurai'),
  g('t_jasmine_star', 'culture', 'traditional', 'Star jasmine', 'நட்சத்திர மல்லி', 'dindigul'),
  g('t_marigold_strings', 'culture', 'traditional', 'Marigold thoranam', 'சாமந்தித் தோரணம்', 'thanjavur', 'manjal-neerattu-thanjavur'),
  g('t_marigold_heap', 'culture', 'traditional', 'Flower market', 'பூ மார்க்கெட்', 'madurai'),
  g('t_marigold_market', 'culture', 'traditional', 'Wedding flowers', 'திருமணப் பூக்கள்', 'salem'),
  g('t_dance_temple', 'culture', 'both', 'Bharatanatyam in the prakaram', 'பிரகாரத்தில் பரதநாட்டியம்', 'thanjavur', 'nellai-lamps'),
  g('t_dance_red', 'culture', 'traditional', 'Arangetram', 'அரங்கேற்றம்', 'chennai'),
  g('t_dance_duo', 'culture', 'traditional', 'Duet', 'இருவர் நடனம்', 'chennai'),
  g('t_dance_yellow', 'culture', 'traditional', 'Mudra', 'முத்திரை', 'coimbatore'),
  g('t_dance_pose', 'culture', 'traditional', 'Abhinaya', 'அபிநயம்', 'madurai'),
  g('t_dance_dark', 'culture', 'traditional', 'On stage', 'மேடையில்', 'chennai'),
  g('t_dance_street', 'culture', 'traditional', 'Street recital', 'தெரு நடனம்', 'madurai'),
  g('t_dance_namaste', 'culture', 'traditional', 'Vanakkam', 'வணக்கம்', 'tirunelveli', 'nellai-lamps'),
]

export function galleryForLang(lang: Lang, items: GalleryItem[] = GALLERY): GalleryItem[] {
  const primary = lang === 'ta' ? 'traditional' : 'modern'
  const keep = items.filter(i => i.tone === 'both' || i.tone === primary)
  // Lead with the images that most suit the chosen language...
  const ordered = [...keep.filter(i => i.tone === primary), ...keep.filter(i => i.tone !== primary)]
  // ...then round-robin through categories so "All" never shows ten temples in a row.
  const seen: Record<string, number> = {}
  return ordered
    .map(i => {
      const nth = (seen[i.cat] = (seen[i.cat] ?? -1) + 1)
      return { i, rank: nth * 10 + GALLERY_CATS.findIndex(c => c.key === i.cat) }
    })
    .sort((a, b) => a.rank - b.rank)
    .map(r => r.i)
}

// ─── Stories ─────────────────────────────────────────────────────────────────

export interface Story {
  slug: string
  tone: 'modern' | 'traditional'
  title: Bi
  names: Bi
  event: Bi
  district: DistrictKey
  venue: Bi
  date: string
  guests: number
  cover: ImgKey
  intro: Bi
  quote: Bi
  quoteBy: Bi
  images: ImgKey[]
}

export const STORIES: Story[] = [
  {
    slug: 'meenakshi-muhurtham',
    tone: 'traditional',
    title: { en: 'Muhurtham in the Temple City', ta: 'கோயில் நகரில் முகூர்த்தம்' },
    names: { en: 'Priya & Karthik', ta: 'ப்ரியா & கார்த்திக்' },
    event: { en: 'Wedding', ta: 'திருமணம்' },
    district: 'madurai',
    venue: { en: 'Sri Meenakshi Mahal, Madurai', ta: 'ஸ்ரீ மீனாட்சி மஹால், மதுரை' },
    date: '2026-02-12',
    guests: 850,
    cover: 't_couple_garland',
    intro: {
      en: 'A 6:00 am muhurtham, four hundred jasmine strings and two families who had waited a long time for this morning. We followed Priya from the first maruthaani line to the last grain of akshathai.',
      ta: 'காலை 6 மணி முகூர்த்தம், நானூறு மல்லிச் சரங்கள், இந்தக் காலைக்காக நீண்ட நாள் காத்திருந்த இரு குடும்பங்கள். முதல் மருதாணிக் கோட்டிலிருந்து கடைசி அட்சதை வரை ப்ரியாவைப் பின்தொடர்ந்தோம்.',
    },
    quote: { en: 'We forgot the cameras were there. Then we saw the album and cried all over again.', ta: 'கேமராக்கள் இருந்ததே மறந்துவிட்டோம். ஆல்பத்தைப் பார்த்ததும் மீண்டும் கண்கலங்கினோம்.' },
    quoteBy: { en: 'Priya, the bride', ta: 'ப்ரியா, மணப்பெண்' },
    images: ['t_couple_garland', 't_bride_henna', 't_jasmine_garland', 't_bride_silk', 't_jewel_temple', 't_ritual_hands', 't_ritual_fire', 't_ritual_offering', 't_ritual_garland', 't_meenakshi', 't_couple_seated', 't_diya_hands'],
  },
  {
    slug: 'golden-hour-chennai',
    tone: 'modern',
    title: { en: 'Golden Lights on the Coast', ta: 'கடற்கரையில் பொன் விளக்குகள்' },
    names: { en: 'Aishwarya & Rahul', ta: 'ஐஸ்வர்யா & ராகுல்' },
    event: { en: 'Wedding & reception', ta: 'திருமணம் & வரவேற்பு' },
    district: 'chennai',
    venue: { en: 'ECR Beach Resort, Chennai', ta: 'ECR கடற்கரை ரிசார்ட், சென்னை' },
    date: '2025-12-06',
    guests: 420,
    cover: 'm_couple_lights',
    intro: {
      en: 'A sunset ceremony that ran into a night of fairy lights and a dance floor that never emptied. Two photographers, one cinematographer and a drone that caught the whole coastline turning gold.',
      ta: 'சூரிய அஸ்தமனத்தில் தொடங்கிய விழா, மின்மினி விளக்குகளும் ஓயாத நடனமுமாக இரவு வரை நீண்டது. இரண்டு புகைப்படக் கலைஞர்கள், ஒரு ஒளிப்பதிவாளர், கடற்கரை பொன்னாக மாறுவதைப் பிடித்த ஒரு ட்ரோன்.',
    },
    quote: { en: 'Every photo feels like the moment itself, not a pose.', ta: 'ஒவ்வொரு படமும் போஸ் அல்ல, அந்தத் தருணமே.' },
    quoteBy: { en: 'Rahul, the groom', ta: 'ராகுல், மணமகன்' },
    images: ['m_couple_lights', 'm_couple_bokeh', 'm_bride_red', 'm_bride_smile', 'm_couple_night', 'm_couple_lights2', 'm_rec_toast', 'm_rec_dance', 'm_decor_lights', 'm_stage', 'm_couple_white', 'm_hands_rings'],
  },
  {
    slug: 'manjal-neerattu-thanjavur',
    tone: 'traditional',
    title: { en: 'Manjal & Marigolds', ta: 'மஞ்சளும் சாமந்தியும்' },
    names: { en: 'Nila’s Manjal Neerattu Vizha', ta: 'நிலாவின் மஞ்சள் நீராட்டு விழா' },
    event: { en: 'Puberty ceremony', ta: 'மஞ்சள் நீராட்டு விழா' },
    district: 'thanjavur',
    venue: { en: 'Family home, Thanjavur', ta: 'குடும்ப இல்லம், தஞ்சாவூர்' },
    date: '2026-05-18',
    guests: 180,
    cover: 't_manjal_bride',
    intro: {
      en: 'Three generations of women, a courtyard of kolam and more marigolds than the flower market could spare. A home ceremony photographed quietly, with respect for every ritual.',
      ta: 'மூன்று தலைமுறைப் பெண்கள், கோலம் நிறைந்த முற்றம், பூ மார்க்கெட்டே தீர்ந்துபோகும் அளவுக்குச் சாமந்திகள். ஒவ்வொரு சடங்கையும் மதித்து, அமைதியாகப் படம்பிடித்த இல்ல விழா.',
    },
    quote: { en: 'They knew every ritual before we explained it. Amma was so relieved.', ta: 'நாங்கள் சொல்லும் முன்பே எல்லாச் சடங்குகளும் அவர்களுக்குத் தெரிந்திருந்தது. அம்மாவுக்கு பெரிய நிம்மதி.' },
    quoteBy: { en: 'Nila’s mother', ta: 'நிலாவின் அம்மா' },
    images: ['t_manjal_bride', 't_manjal_pot', 't_manjal_shower', 't_marigold_strings', 't_kolam_girls', 't_saree_gold', 't_jasmine_bunch', 't_lamp_brass', 't_diya_rows', 't_tn_big'],
  },
  {
    slug: 'kodaikanal-mist',
    tone: 'modern',
    title: { en: 'Into the Kodai Mist', ta: 'கொடைப் பனிக்குள்' },
    names: { en: 'Divya & Arjun', ta: 'திவ்யா & அர்ஜுன்' },
    event: { en: 'Pre-wedding shoot', ta: 'முன்-திருமணப் படப்பிடிப்பு' },
    district: 'dindigul',
    venue: { en: 'Kodaikanal hills, Dindigul', ta: 'கொடைக்கானல் மலை, திண்டுக்கல்' },
    date: '2026-01-21',
    guests: 2,
    cover: 'm_couple_mist',
    intro: {
      en: 'A 5 am drive up the ghat road, a lake that disappeared into cloud and a couple who did not mind getting their feet wet. One location scout, one long day, zero poses held for too long.',
      ta: 'அதிகாலை 5 மணி மலைப்பாதைப் பயணம், மேகத்தில் மறைந்த ஏரி, கால் நனைவதைப் பொருட்படுத்தாத ஜோடி. ஒரு நீண்ட நாள், கட்டாயப் போஸ்கள் இல்லை.',
    },
    quote: { en: 'It felt like a trip with friends who happened to carry cameras.', ta: 'கேமரா வைத்திருக்கும் நண்பர்களுடன் ஒரு பயணம் போல இருந்தது.' },
    quoteBy: { en: 'Divya', ta: 'திவ்யா' },
    images: ['m_couple_mist', 'm_couple_lake', 'm_bride_twirl', 'm_couple_path', 'm_couple_garden', 'm_couple_dance', 'm_proposal', 'm_bride_rock', 'm_couple_lens', 'm_couple_field'],
  },
  {
    slug: 'turmeric-henna-coimbatore',
    tone: 'modern',
    title: { en: 'Turmeric, Then Henna', ta: 'மஞ்சள், பின் மருதாணி' },
    names: { en: 'Sneha & Vikram', ta: 'சினேகா & விக்ரம்' },
    event: { en: 'Haldi & mehendi', ta: 'மஞ்சள் & மருதாணி' },
    district: 'coimbatore',
    venue: { en: 'Farmhouse, Coimbatore', ta: 'பண்ணை வீடு, கோயம்புத்தூர்' },
    date: '2026-03-02',
    guests: 140,
    cover: 'm_haldi_umbrella',
    intro: {
      en: 'Two days before the wedding, a farmhouse turned yellow, then green, then very, very loud. The ceremonies where the best candids live.',
      ta: 'திருமணத்திற்கு இரண்டு நாள் முன், ஒரு பண்ணை வீடு மஞ்சளாகி, பச்சையாகி, மிகுந்த ஆரவாரமானது. சிறந்த கேண்டிட் படங்கள் பிறக்கும் விழாக்கள் இவை.',
    },
    quote: { en: 'The haldi photos are our favourite part of the whole album.', ta: 'முழு ஆல்பத்திலும் மஞ்சள் படங்களே எங்களுக்குப் பிடித்தவை.' },
    quoteBy: { en: 'Sneha', ta: 'சினேகா' },
    images: ['m_haldi_umbrella', 'm_haldi_bride', 'm_haldi_couple', 'm_haldi_shower', 'm_haldi_laugh', 'm_haldi_seated', 'm_mehndi_hands', 'm_mehndi_red', 'm_mehndi_saree', 'm_mehndi_smile'],
  },
  {
    slug: 'nellai-lamps',
    tone: 'traditional',
    title: { en: 'A Hundred Lamps in Nellai', ta: 'நெல்லையில் நூறு விளக்குகள்' },
    names: { en: 'Deepa & Senthil', ta: 'தீபா & செந்தில்' },
    event: { en: 'Engagement', ta: 'நிச்சயதார்த்தம்' },
    district: 'tirunelveli',
    venue: { en: 'Temple mandapam, Tirunelveli', ta: 'கோயில் மண்டபம், திருநெல்வேலி' },
    date: '2025-11-26',
    guests: 260,
    cover: 't_gopuram_dusk',
    intro: {
      en: 'An engagement timed with Karthigai Deepam: a kolam drawn at dawn, a Bharatanatyam offering in the prakaram and a hundred agal lamps lit as the sun went down behind the gopuram.',
      ta: 'கார்த்திகை தீபத்தோடு இணைந்த நிச்சயதார்த்தம்: விடியலில் வரைந்த கோலம், பிரகாரத்தில் பரதநாட்டிய அர்ப்பணிப்பு, கோபுரத்தின் பின் சூரியன் மறைந்தபோது ஏற்றப்பட்ட நூறு அகல் விளக்குகள்.',
    },
    quote: { en: 'They photographed our traditions like they belonged to them too.', ta: 'எங்கள் மரபுகளைத் தங்களுடையதைப் போலவே படம்பிடித்தார்கள்.' },
    quoteBy: { en: 'Senthil', ta: 'செந்தில்' },
    images: ['t_gopuram_dusk', 't_kolam_hand', 't_rangoli_diya', 't_dance_temple', 't_saree_purple', 't_jewel_set', 't_marigold_hands', 't_lamp_many', 't_diya_glow', 't_temple_tank', 't_saree_temple', 't_dance_namaste'],
  },
]

export function storiesForLang(lang: Lang): Story[] {
  const primary = lang === 'ta' ? 'traditional' : 'modern'
  return [...STORIES.filter(s => s.tone === primary), ...STORIES.filter(s => s.tone !== primary)]
}
