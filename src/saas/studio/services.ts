import type { IconName } from '../../components/Icon'
import type { Bi } from '../../lib/i18n'

/**
 * The three services sold to photographers, shown on /for-photographers and
 * each on /for-photographers/<slug>. Marketing copy only; the features live in
 * the studio panel (galleries, drives) and, for poses, in Phase 4 of
 * docs/photographer-saas-plan.md. Limits are stated as they are today.
 */
export type ServiceSlug = 'gallery' | 'storage' | 'poses'

export interface StudioService {
  slug: ServiceSlug
  icon: IconName
  name: Bi
  tagline: Bi
  intro: Bi
  /** Where the photographer finds it once signed in. */
  studioPath: string
  /** The link their customer receives, with the order id on the end. */
  customerLink?: string
  /** Not built yet; the page says so instead of promising it. */
  planned?: boolean
  steps: { title: Bi; body: Bi }[]
  /** What the photographer's customer sees. Always white-labelled. */
  customerSees: Bi[]
  /** Honest limits. */
  limits: Bi[]
}

export const STUDIO_SERVICES: StudioService[] = [
  {
    slug: 'gallery',
    icon: 'heart',
    name: { en: 'Gallery photo choosing', ta: 'காட்சியகப் படத் தேர்வு' },
    tagline: { en: 'Your customers pick their album photos on their phone, under your logo.', ta: 'உங்கள் வாடிக்கையாளர்கள் கைப்பேசியில், உங்கள் லோகோவின் கீழ், ஆல்பம் படங்களைத் தேர்வு செய்கிறார்கள்.' },
    intro: {
      en: 'Drop the card folder or a Lightroom export into the project. Your customer gets one link with their order id; they open it as often as they like, heart photos within the quota, add notes, and submit when done. Their choices are saved between visits. You get the filename list, ready for Lightroom.',
      ta: 'கார்டு கோப்புறை அல்லது Lightroom ஏற்றுமதியை திட்டத்தில் இடுங்கள். வாடிக்கையாளருக்கு ஆர்டர் ஐடியுடன் ஒரு இணைப்பு; எத்தனை முறை வேண்டுமானாலும் திறந்து, அளவுக்குள் படங்களைத் தேர்ந்து, குறிப்பு சேர்த்து, முடிந்ததும் சமர்ப்பிப்பார்கள். தேர்வுகள் வருகைகளுக்கு இடையே சேமிக்கப்படும். கோப்புப் பெயர் பட்டியல் Lightroom-க்குத் தயாராக உங்களுக்கு.',
    },
    studioPath: '/studio/projects/<id>?tab=gallery',
    customerLink: '/gallery/<order id>',
    steps: [
      { title: { en: 'Upload the proofs', ta: 'படங்களைப் பதிவேற்றுங்கள்' }, body: { en: 'Drag the RAW card folder or JPG export into the project. Subfolders become chapters; filenames stay exactly as on your disk.', ta: 'RAW கார்டு கோப்புறை அல்லது JPG ஏற்றுமதியை திட்டத்தில் இழுத்து விடுங்கள். உட்கோப்புறைகள் அத்தியாயங்களாகும்; கோப்புப் பெயர்கள் உங்கள் வட்டில் உள்ளபடியே.' } },
      { title: { en: 'Share one link', ta: 'ஒரு இணைப்பைப் பகிருங்கள்' }, body: { en: 'Copy the gallery link with the order id, or send it with the PIN and QR on WhatsApp, in English or Tamil.', ta: 'ஆர்டர் ஐடியுடன் காட்சியக இணைப்பை நகலெடுங்கள், அல்லது PIN, QR-உடன் WhatsApp-ல் ஆங்கிலம் அல்லது தமிழில் அனுப்புங்கள்.' } },
      { title: { en: 'They choose, in their own time', ta: 'அவர்கள் நேரத்தில் தேர்வு' }, body: { en: 'They heart photos within the quota and leave notes like "crop tighter". If they close the page, their picks are waiting when they come back.', ta: 'அளவுக்குள் படங்களைத் தேர்ந்து, "நெருக்கமாக வெட்டுங்கள்" போன்ற குறிப்புகள் சேர்ப்பார்கள். பக்கத்தை மூடினாலும், திரும்பும்போது தேர்வுகள் காத்திருக்கும்.' } },
      { title: { en: 'Submit, and it comes back to you', ta: 'சமர்ப்பிப்பு, உங்களுக்கே திரும்பும்' }, body: { en: 'Once they submit, the list and notes are in your project, and nowhere else. Paste the filenames into Lightroom\'s Library filter and start editing.', ta: 'சமர்ப்பித்தவுடன் பட்டியலும் குறிப்புகளும் உங்கள் திட்டத்தில் மட்டுமே. கோப்புப் பெயர்களை Lightroom Library வடிகட்டியில் ஒட்டி திருத்தத் தொடங்குங்கள்.' } },
    ],
    customerSees: [
      { en: 'Your logo, your studio name and your accent colour. Nothing about us.', ta: 'உங்கள் லோகோ, ஸ்டுடியோ பெயர், உங்கள் நிறம். எங்களைப் பற்றி எதுவும் இல்லை.' },
      { en: 'The normal grid picker with chapters, a quota counter and notes. The swipe picker stays off unless you ask us to switch it on.', ta: 'அத்தியாயங்கள், அளவு எண்ணிக்கை, குறிப்புகளுடன் சாதாரண கட்டத் தேர்வு. நீங்கள் கேட்காதவரை ஸ்வைப் தேர்வு இயங்காது.' },
      { en: 'Their picks saved on return visits, and a WhatsApp button that reaches you, not us.', ta: 'திரும்பும்போது தேர்வுகள் சேமிப்பில்; எங்களை அல்ல, உங்களைத் தொடர்பு கொள்ளும் WhatsApp பொத்தான்.' },
    ],
    limits: [
      { en: 'Proofs come from the JPEG the camera stored inside each RAW. Some are small (Sony ARW about 1600 px) and a few DNGs fail; export JPGs from Lightroom when that matters.', ta: 'படங்கள் ஒவ்வொரு RAW-க்குள் கேமரா சேமித்த JPEG-இலிருந்து. சில சிறியவை (Sony ARW சுமார் 1600 px), சில DNG தோல்வி; தேவைப்பட்டால் Lightroom-லிருந்து JPG ஏற்றுமதி செய்யுங்கள்.' },
      { en: 'Uploading is from a desktop browser. iPhone Safari cannot pick a folder.', ta: 'பதிவேற்றம் டெஸ்க்டாப் உலாவியில். iPhone Safari கோப்புறையைத் தேர்வு செய்ய முடியாது.' },
    ],
  },
  {
    slug: 'storage',
    icon: 'gem',
    name: { en: 'Storage manager', ta: 'சேமிப்பக மேலாளர்' },
    tagline: { en: 'Know which hard drive holds which shoot, even when it is on the shelf.', ta: 'எந்த ஹார்ட் டிரைவில் எந்த நிகழ்வு என்பதை, அலமாரியில் இருந்தாலும் அறியுங்கள்.' },
    intro: {
      en: 'Scan each drive once from your browser. We keep the file list, not the files. Later, search a customer name or a filename and see the drive, the shelf it sits on and how full it is. A submitted gallery can be traced straight to the drive that holds its RAWs.',
      ta: 'ஒவ்வொரு டிரைவையும் உலாவியில் ஒருமுறை ஸ்கேன் செய்யுங்கள். கோப்புகளை அல்ல, கோப்புப் பட்டியலை மட்டும் வைத்திருக்கிறோம். பின்னர் வாடிக்கையாளர் பெயர் அல்லது கோப்புப் பெயரைத் தேடினால் டிரைவ், அதன் அலமாரி, எவ்வளவு நிரம்பியுள்ளது தெரியும். சமர்ப்பித்த காட்சியகத்தை அதன் RAW உள்ள டிரைவுக்கு நேரடியாகக் கண்டறியலாம்.',
    },
    studioPath: '/studio/drives',
    steps: [
      { title: { en: 'Plug in and scan', ta: 'இணைத்து ஸ்கேன் செய்யுங்கள்' }, body: { en: 'Pick the drive in Chrome or Edge. We read folder and file names, sizes and dates, and write a small marker file so the drive is recognised next time.', ta: 'Chrome அல்லது Edge-ல் டிரைவைத் தேர்வு செய்யுங்கள். கோப்புறை, கோப்புப் பெயர்கள், அளவு, தேதிகளைப் படித்து, அடுத்த முறை அடையாளம் காண சிறிய குறியீட்டுக் கோப்பு எழுதுவோம்.' } },
      { title: { en: 'Label where it lives', ta: 'எங்கே உள்ளது என்று குறியுங்கள்' }, body: { en: 'Give the drive a name and a shelf: "Drive A, black case, shelf 1".', ta: 'டிரைவுக்குப் பெயரும் அலமாரியும் கொடுங்கள்: "டிரைவ் A, கருப்புப் பெட்டி, அலமாரி 1".' } },
      { title: { en: 'Search any time', ta: 'எப்போதும் தேடுங்கள்' }, body: { en: 'Type a couple\'s name or a filename. The result says which drive, which folder and whether it was plugged in recently.', ta: 'தம்பதியர் பெயர் அல்லது கோப்புப் பெயரைத் தட்டச்சு செய்யுங்கள். எந்த டிரைவ், எந்தக் கோப்புறை, சமீபத்தில் இணைக்கப்பட்டதா என முடிவு சொல்லும்.' } },
      { title: { en: 'Trace a gallery to its RAWs', ta: 'காட்சியகத்திலிருந்து RAW வரை' }, body: { en: 'Open a submitted selection and see which drives hold the chosen files, so album work starts without a hunt.', ta: 'சமர்ப்பித்த தேர்வைத் திறந்து, தேர்ந்த கோப்புகள் எந்த டிரைவில் உள்ளன எனப் பாருங்கள்; ஆல்பம் வேலை தேடலின்றித் தொடங்கும்.' } },
    ],
    customerSees: [
      { en: 'Nothing. The storage manager is yours alone; customers never see drive names or file lists.', ta: 'எதுவும் இல்லை. சேமிப்பக மேலாளர் உங்களுக்கு மட்டுமே; வாடிக்கையாளர்கள் டிரைவ் பெயர்களையோ கோப்புப் பட்டியலையோ பார்க்க மாட்டார்கள்.' },
    ],
    limits: [
      { en: 'Scanning needs Chrome or Edge on a desktop; Safari and phones cannot read a drive.', ta: 'ஸ்கேனுக்கு டெஸ்க்டாப்பில் Chrome அல்லது Edge தேவை; Safari, கைப்பேசிகள் டிரைவைப் படிக்க முடியாது.' },
      { en: 'We index names and sizes only. Photos stay on your drive and are never uploaded.', ta: 'பெயர்களையும் அளவுகளையும் மட்டுமே பட்டியலிடுகிறோம். படங்கள் உங்கள் டிரைவிலேயே; பதிவேற்றப்படாது.' },
    ],
  },
  {
    slug: 'poses',
    icon: 'camera',
    name: { en: 'Pose manager', ta: 'போஸ் மேலாளர்' },
    tagline: { en: 'A pose list for each customer, matched to their event and tradition, shared as one link.', ta: 'ஒவ்வொரு வாடிக்கையாளருக்கும் விழா, மரபுக்கேற்ற போஸ் பட்டியல், ஒரே இணைப்பில்.' },
    intro: {
      en: 'Set the event type and tradition (Hindu, Christian or Muslim) on a customer, and a fitting pose list is ready. Tick the poses you plan to shoot, add your own, and send the customer a link with their order id. They see the list, mark favourites, and that comes back to you before the day.',
      ta: 'வாடிக்கையாளரின் விழா வகையும் மரபும் (இந்து, கிறிஸ்தவம், இஸ்லாம்) அமைத்தால், பொருத்தமான போஸ் பட்டியல் தயார். எடுக்கத் திட்டமிட்ட போஸ்களைக் குறித்து, உங்களுடையதைச் சேர்த்து, ஆர்டர் ஐடியுடன் இணைப்பை அனுப்புங்கள். அவர்கள் பட்டியலைப் பார்த்து, பிடித்தவற்றைக் குறிப்பார்கள்; விழா நாளுக்கு முன் அது உங்களுக்குத் திரும்பும்.',
    },
    studioPath: '/studio/projects/<id>?tab=poses',
    customerLink: '/poses/<order id>',
    steps: [
      { title: { en: 'Set the event and tradition', ta: 'விழாவும் மரபும் அமைக்கவும்' }, body: { en: 'On the customer\'s project choose wedding, reception, baby shower and so on, plus Hindu, Christian or Muslim. The pose list and invitation designs follow from that.', ta: 'வாடிக்கையாளர் திட்டத்தில் திருமணம், வரவேற்பு, வளைகாப்பு போன்றவற்றையும், இந்து, கிறிஸ்தவம், இஸ்லாம் என்பதையும் தேர்வு செய்யுங்கள். போஸ் பட்டியலும் அழைப்பிதழ் வடிவங்களும் அதைப் பின்பற்றும்.' } },
      { title: { en: 'Shape the list', ta: 'பட்டியலை வடிவமைக்கவும்' }, body: { en: 'Keep, drop or add poses. Switch the whole feature off for customers who do not need it.', ta: 'போஸ்களை வைக்கலாம், நீக்கலாம், சேர்க்கலாம். தேவையில்லாத வாடிக்கையாளர்களுக்கு முழு அம்சத்தையும் அணைக்கலாம்.' } },
      { title: { en: 'Share the poses link', ta: 'போஸ் இணைப்பைப் பகிரவும்' }, body: { en: 'The customer opens it on their phone with the project PIN, under your logo, and answers Yes or No to each pose. They can leave and come back; answers are saved.', ta: 'வாடிக்கையாளர் திட்ட PIN-உடன் கைப்பேசியில், உங்கள் லோகோவின் கீழ் திறந்து, ஒவ்வொரு போஸுக்கும் ஆம் அல்லது இல்லை என்கிறார்கள். வெளியேறித் திரும்பலாம்; பதில்கள் சேமிக்கப்படும்.' } },
      { title: { en: 'Your crew gets the shot list', ta: 'உங்கள் குழுவுக்கு ஷாட் பட்டியல்' }, body: { en: 'The favourites become a shot list for the day, so nobody on the team has to guess what the family wanted.', ta: 'பிடித்தவை விழா நாளுக்கான ஷாட் பட்டியலாகும்; குடும்பம் என்ன விரும்பியது என்று குழுவில் யாரும் யூகிக்க வேண்டியதில்லை.' } },
    ],
    customerSees: [
      { en: 'Your logo and name only, the pose list with pictures, and a Yes / No on each.', ta: 'உங்கள் லோகோ, பெயர் மட்டும்; படங்களுடன் போஸ் பட்டியல்; ஒவ்வொன்றுக்கும் ஆம் / இல்லை.' },
      { en: 'Their answers waiting when they return, and a send button that unlocks once every pose is answered.', ta: 'திரும்பும்போது பதில்கள் காத்திருக்கும்; எல்லாப் போஸுக்கும் பதிலளித்த பின் அனுப்பும் பொத்தான் திறக்கும்.' },
    ],
    limits: [
      { en: 'The customer must answer every pose before the list can be sent; partial lists stay as drafts on their side.', ta: 'பட்டியலை அனுப்ப வாடிக்கையாளர் எல்லாப் போஸுக்கும் பதிலளிக்க வேண்டும்; பகுதிப் பட்டியல் அவர்கள் பக்கம் வரைவாகவே இருக்கும்.' },
      { en: 'Pose sets exist for Hindu, Christian and Muslim ceremonies; other traditions start from the general set, and you can add your own poses.', ta: 'இந்து, கிறிஸ்தவ, இஸ்லாமிய விழாக்களுக்குப் போஸ் தொகுப்புகள் உள்ளன; பிற மரபுகள் பொதுத் தொகுப்பில் தொடங்கும்; உங்கள் போஸ்களைச் சேர்க்கலாம்.' },
    ],
  },
]

export const studioServiceBySlug = (slug: string | undefined) => STUDIO_SERVICES.find(s => s.slug === slug)
export const studioServicePath = (slug: ServiceSlug) => `/for-photographers/${slug}`
