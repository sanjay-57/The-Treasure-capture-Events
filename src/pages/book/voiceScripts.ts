import type { Bi, Lang } from '../../lib/i18n'
import { PACKAGE_ALBUM_NOTE } from '../../lib/packageNote.ts'

/*
 * The default narration the voice guide speaks on each booking step, in both
 * languages. These are rendered once with Gemini TTS into public/voice by
 * `pnpm voice:clips`; at runtime the player uses the clip when it exists and
 * otherwise speaks the same text live. Keep this file free of React imports —
 * the clip script loads it under Node.
 */

export type ClipId =
  | 'welcome'
  | 'step-district'
  | 'step-event'
  | 'step-venue'
  | 'step-package'
  | 'step-details'
  | 'confirmed'
  | 'help'
  | 'didnt-catch'
  | 'lang-en'
  | 'lang-ta'

export const GUIDE_CLIPS: Record<ClipId, Bi> = {
  welcome: {
    en: 'Vanakkam, and welcome to The Treasure Capture Events. I am your voice guide. I will explain each step as you go, and you can tap the microphone and speak to me in Tamil or English at any time.',
    ta: 'வணக்கம்! The Treasure Capture Events-க்கு உங்களை அன்புடன் வரவேற்கிறோம். நான் உங்கள் குரல் வழிகாட்டி. ஒவ்வொரு படியையும் நான் விளக்குவேன். எப்போது வேண்டுமானாலும் மைக்கைத் தொட்டு, தமிழிலோ ஆங்கிலத்திலோ என்னிடம் பேசலாம்.',
  },
  'step-district': {
    en: 'Step one of five. Choose the district where your celebration will be held. Tap a district card, or just tell me the name, for example, Madurai. We travel across Tamil Nadu and only charge for distance beyond twenty kilometres.',
    ta: 'ஐந்தில் முதல் படி. உங்கள் விழா நடைபெறும் மாவட்டத்தைத் தேர்ந்தெடுங்கள். ஒரு மாவட்ட அட்டையைத் தொடுங்கள், அல்லது மதுரை என்று என்னிடம் சொன்னால் போதும். தமிழ்நாடு முழுவதும் வருகிறோம்; இருபது கிலோமீட்டருக்கு மேல் உள்ள தூரத்திற்கு மட்டுமே பயணக் கட்டணம்.',
  },
  'step-event': {
    en: 'Step two. Tell us what we are celebrating: a wedding, an engagement, a reception, a puberty ceremony, a birthday, and more. Then choose how many hours you would like us there, and roughly how many guests to expect. Your price updates live as you choose.',
    ta: 'இரண்டாம் படி. நாம் எதைக் கொண்டாடுகிறோம் என்று சொல்லுங்கள்: திருமணம், நிச்சயதார்த்தம், வரவேற்பு, மஞ்சள் நீராட்டு விழா, பிறந்தநாள் என எதுவாக இருந்தாலும். பிறகு எத்தனை மணி நேரம் நாங்கள் இருக்க வேண்டும், எத்தனை விருந்தினர்கள் வருவார்கள் என்பதைத் தேர்ந்தெடுங்கள். நீங்கள் தேர்ந்தெடுக்கும்போதே விலை மாறுவதைக் காணலாம்.',
  },
  'step-venue': {
    en: 'Step three. Is the celebration at home or in a mahal? Enter the venue name and address, then pick your date and time. If the date is still tentative, just say so, and we will confirm it on the call.',
    ta: 'மூன்றாம் படி. விழா வீட்டிலா, மண்டபத்திலா? இடத்தின் பெயரையும் முகவரியையும் உள்ளிட்டு, தேதியையும் நேரத்தையும் தேர்ந்தெடுங்கள். தேதி இன்னும் உறுதியாகவில்லை என்றால் அதைச் சொல்லுங்கள்; அழைப்பில் உறுதிசெய்வோம்.',
  },
  'step-package': {
    en: `Step four. There are three packages. For a family function, Bronze is traditional photography for one four-hour session. Silver adds a portrait hour with close family, candid shots, an A4 album, a calendar and a frame. Gold adds a semi-candid film, the ten by twenty-eight album in a wooden box, and a bigger frame. Weddings and outdoor shoots have their own three. Tap a package, then add or remove anything in the list below. ${PACKAGE_ALBUM_NOTE.en} You can also simply tell the assistant what you want, like, add drone, or, what is in Gold.`,
    ta: `நான்காம் படி. மூன்று தொகுப்புகள் உள்ளன. குடும்ப விழாவுக்கு, பிரான்ஸ் தொகுப்பில் நான்கு மணி நேர பாரம்பரியப் புகைப்படம். சில்வரில் இதோடு, நெருங்கிய குடும்பத்துடன் ஒரு மணி நேரப் போர்ட்ரெய்ட், கேண்டிட் படங்கள், A4 ஆல்பம், காலண்டர், ஒரு பிரேம். கோல்டில் இன்னும் செமி-கேண்டிட் வீடியோ, மரப்பெட்டியில் பத்துக்கு இருபத்தெட்டு ஆல்பம், பெரிய பிரேம். திருமணத்துக்கும் அவுட்டோர் ஷூட்டுக்கும் தனியாக மூன்று தொகுப்புகள் உள்ளன. ஒரு தொகுப்பைத் தொட்டு, கீழே உள்ள பட்டியலில் எதையும் சேர்க்கலாம், நீக்கலாம். ${PACKAGE_ALBUM_NOTE.ta} ட்ரோன் சேர், அல்லது கோல்டில் என்ன இருக்கு, என்று உதவியாளரிடம் சொன்னாலே போதும்.`,
  },
  'step-details': {
    en: 'Last step. Tell me your name and mobile number, and I will fill them in for you. Say, read my summary, to hear everything you have chosen with the estimated total. When you are ready, say, send my enquiry. No payment is taken online; we will call you within twenty-four hours.',
    ta: 'கடைசிப் படி. உங்கள் பெயரையும் கைபேசி எண்ணையும் சொல்லுங்கள்; நான் நிரப்பிவிடுகிறேன். சுருக்கம் சொல்லு, என்றால் நீங்கள் தேர்ந்தெடுத்த அனைத்தையும் மதிப்பிடப்பட்ட மொத்தத் தொகையுடன் வாசிக்கிறேன். தயாரானதும், விசாரணையை அனுப்பு, என்று சொல்லுங்கள். இணையத்தில் எந்தக் கட்டணமும் இல்லை; இருபத்து நான்கு மணி நேரத்திற்குள் அழைக்கிறோம்.',
  },
  confirmed: {
    en: 'Thank you! Your enquiry has been sent. A WhatsApp confirmation with your booking reference is on its way, and we will call within twenty-four hours to confirm the date. Nothing is paid until then.',
    ta: 'நன்றி! உங்கள் விசாரணை அனுப்பப்பட்டது. உங்கள் பதிவு எண்ணுடன் WhatsApp உறுதிப்படுத்தல் வந்துகொண்டிருக்கிறது. இருபத்து நான்கு மணி நேரத்திற்குள் அழைத்துத் தேதியை உறுதிசெய்வோம். அதுவரை எந்தக் கட்டணமும் இல்லை.',
  },
  help: {
    en: 'You can say things like, continue, go back, read my total, or, switch to Tamil. On the first step say a district, like Madurai. On the last step say, my name is Priya, my number is 98765 43210, read my summary, or, send my enquiry.',
    ta: 'அடுத்து, பின் செல், மொத்தம் எவ்வளவு, ஆங்கிலத்தில் பேசு, என்று சொல்லலாம். முதல் படியில் மதுரை போன்று ஒரு மாவட்டத்தைச் சொல்லுங்கள். கடைசிப் படியில், என் பெயர் பிரியா, என் எண் 98765 43210, சுருக்கம் சொல்லு, விசாரணையை அனுப்பு, என்றும் சொல்லலாம்.',
  },
  'didnt-catch': {
    en: 'Sorry, I did not catch that. Please try once more, or type it below.',
    ta: 'மன்னிக்கவும், சரியாகக் கேட்கவில்லை. மீண்டும் ஒருமுறை சொல்லுங்கள், அல்லது கீழே தட்டச்சு செய்யுங்கள்.',
  },
  'lang-en': { en: 'Okay, switching to English.', ta: 'Okay, switching to English.' },
  'lang-ta': { en: 'சரி, இனி தமிழில் பேசுகிறேன்.', ta: 'சரி, இனி தமிழில் பேசுகிறேன்.' },
}

/** Narration clip for each booking step, in STEP_PATHS order. */
export const STEP_CLIPS: ClipId[] = ['step-district', 'step-event', 'step-venue', 'step-package', 'step-details']

/** Rupees the way a person would say them, so the TTS reads "45,000 rupees" rather than a symbol. */
export function spokenINR(amount: number, lang: Lang): string {
  const n = Math.round(amount).toLocaleString('en-IN')
  return lang === 'ta' ? `${n} ரூபாய்` : `${n} rupees`
}
