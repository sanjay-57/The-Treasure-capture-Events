/*
 * Copy for the /photography/:district/:event landing pages (roadmap 7.2).
 * Each page joins the event's own copy with the district's facts, the travel
 * rule and that event's package prices, so no two pages read alike.
 * No React here: the page, its JSON-LD and any pre-render all build from this.
 */
import type { Bi } from './i18n'
import { DISTRICTS, DISTRICT_FACTS, EVENTS, TRAVEL_FREE_KM, TRAVEL_PER_KM, type DistrictKey, type EventKey } from './data'
import { DEFAULT_PRICES, MIN_HOURS, presetName, tierPitch, tierPreset, type FixedTier, type PriceMap } from './catalogue'
import { tierPrice } from './pricing'

type Setting = 'ceremony' | 'location' | 'corporate'

interface EventLanding {
  /** H1 noun phrase: "Wedding photographer" + " in Madurai"; Tamil puts the place first. */
  phrase: Bi
  /** schema.org serviceType, English only. */
  serviceType: string
  intro: Bi
  covers: Bi[]
  setting: Setting
  /** Price question; {at} becomes "in Madurai" / "மதுரையில்". */
  costQ: Bi
  faq: { q: Bi; a: Bi }
}

const bi = (en: string, ta: string): Bi => ({ en, ta })

export const EVENT_LANDING: Partial<Record<EventKey, EventLanding>> = {
  wedding: {
    phrase: bi('Wedding photographer', 'திருமண புகைப்படக் கலைஞர்'),
    serviceType: 'Wedding photography',
    intro: bi(
      'Traditional photo and video for every ritual, candid frames of the family in between, and an album you’ll open for years. We plan the day with you, from the nalangu and muhurtham to the last guest at the reception.',
      'ஒவ்வொரு சடங்குக்கும் பாரம்பரியப் புகைப்படமும் வீடியோவும், இடையிடையே குடும்பத்தின் கேண்டிட் படங்கள், பல ஆண்டுகள் திறந்து பார்க்கும் ஆல்பம். நலங்கு, முகூர்த்தம் முதல் வரவேற்பின் கடைசி விருந்தினர் வரை, உங்களுடன் சேர்ந்து நாளைத் திட்டமிடுகிறோம்.',
    ),
    covers: [bi('Muhurtham and every ritual', 'முகூர்த்தமும் அனைத்துச் சடங்குகளும்'), bi('Traditional photo and video', 'பாரம்பரியப் புகைப்படம் & வீடியோ'), bi('Candid photography and drone, if you want them', 'விரும்பினால் கேண்டிட் படங்கள், ட்ரோன்'), bi('Wedding album and online gallery', 'திருமண ஆல்பம் & ஆன்லைன் கேலரி')],
    setting: 'ceremony',
    costQ: bi('What does a wedding photographer cost {at}?', '{at} திருமணப் புகைப்படத்துக்கு எவ்வளவு ஆகும்?'),
    faq: {
      q: bi('Can you cover the reception on a different day?', 'வரவேற்பு வேறு நாளில் என்றாலும் வருவீர்களா?'),
      a: bi(
        'Yes. Tell us both dates when you book and we’ll plan the crew for each day. Extra time shows up in your quote.',
        'ஆம். பதிவு செய்யும்போது இரண்டு தேதிகளையும் சொல்லுங்கள்; ஒவ்வொரு நாளுக்கும் குழுவைத் திட்டமிடுவோம். கூடுதல் நேரத்தின் விலை உங்கள் விலைப்பட்டியலில் தெரியும்.',
      ),
    },
  },
  engagement: {
    phrase: bi('Engagement photographer', 'நிச்சயதார்த்தப் புகைப்படக் கலைஞர்'),
    serviceType: 'Engagement photography',
    intro: bi(
      'The ring exchange, the thambulam trays, both families in one frame. An engagement is shorter than a wedding, so we plan the shot list tightly and don’t miss the small moments.',
      'மோதிரம் மாற்றுதல், தாம்பூலத் தட்டுகள், இரு குடும்பங்களும் ஒரே படத்தில். நிச்சயதார்த்தம் திருமணத்தைவிடக் குறுகியது; அதனால் படப் பட்டியலை முன்பே திட்டமிட்டு, சின்னச் சின்னத் தருணங்களையும் தவறவிடுவதில்லை.',
    ),
    covers: [bi('Ring exchange and thambulam', 'மோதிரம் மாற்றுதல் & தாம்பூலம்'), bi('Family group portraits', 'குடும்பக் குழுப் படங்கள்'), bi('Couple portraits', 'ஜோடிப் படங்கள்'), bi('Photo and video, album if you want one', 'படம் & வீடியோ, விரும்பினால் ஆல்பம்')],
    setting: 'ceremony',
    costQ: bi('What does engagement photography cost {at}?', '{at} நிச்சயதார்த்தப் புகைப்படத்துக்கு எவ்வளவு ஆகும்?'),
    faq: {
      q: bi('Can we book the engagement and the wedding together?', 'நிச்சயதார்த்தமும் திருமணமும் சேர்த்துப் பதிவு செய்யலாமா?'),
      a: bi(
        'Yes. Book each as its own event. Where the dates allow we send the same team, so the photos match.',
        'ஆம். ஒவ்வொன்றையும் தனி நிகழ்வாகப் பதிவு செய்யுங்கள். தேதிகள் பொருந்தினால் அதே குழுவை அனுப்புவோம்; படங்களும் ஒரே பாணியில் இருக்கும்.',
      ),
    },
  },
  reception: {
    phrase: bi('Reception photography', 'வரவேற்பு விழா புகைப்படம்'),
    serviceType: 'Wedding reception photography',
    intro: bi(
      'A reception is a long line of guests on stage, bright lights and a lot of happy noise. We light the stage properly, keep the photo queue moving and still catch the laughs at the tables.',
      'வரவேற்பு என்றால் மேடையில் நீண்ட விருந்தினர் வரிசை, பளிச்சென்ற விளக்குகள், நிறைய மகிழ்ச்சி. மேடைக்குச் சரியான விளக்கு அமைத்து, படத்துக்கான வரிசையை நகர்த்திக்கொண்டே, மேசைகளில் சிரிப்புகளையும் கேண்டிட்டாகப் பிடிக்கிறோம்.',
    ),
    covers: [bi('Stage photos with every guest', 'ஒவ்வொரு விருந்தினருடனும் மேடைப் படம்'), bi('Stage lighting kit', 'மேடை விளக்கு அமைப்பு'), bi('Candid guest moments', 'விருந்தினர்களின் கேண்டிட் தருணங்கள்'), bi('Video highlights, LED wall on request', 'வீடியோ ஹைலைட்ஸ், கேட்டால் LED திரை')],
    setting: 'ceremony',
    costQ: bi('What does reception photography cost {at}?', '{at} வரவேற்பு விழா புகைப்படத்துக்கு எவ்வளவு ஆகும்?'),
    faq: {
      q: bi('Do we need a second photographer for a big reception?', 'பெரிய வரவேற்புக்கு இரண்டாவது புகைப்படக் கலைஞர் தேவையா?'),
      a: bi(
        'For 150–400 guests we plan a second photographer, and a three-person team above 400. Tell us the guest count when you book.',
        '150–400 விருந்தினர் என்றால் இரண்டாவது புகைப்படக் கலைஞரைத் திட்டமிடுவோம்; 400-க்கு மேல் என்றால் மூவர் குழு. பதிவு செய்யும்போது விருந்தினர் எண்ணிக்கையைச் சொல்லுங்கள்.',
      ),
    },
  },
  puberty: {
    phrase: bi('Puberty function photography', 'மஞ்சள் நீராட்டு விழா புகைப்படம்'),
    serviceType: 'Puberty ceremony photography',
    intro: bi(
      'Manjal Neerattu Vizha is a proud day for the whole family. We photograph the turmeric bath, the silk saree and the seer from her thai maaman with care and respect, and keep her at ease in front of the camera.',
      'மஞ்சள் நீராட்டு விழா, குடும்பமே பெருமைப்படும் நாள். மஞ்சள் நீராட்டு, பட்டுப் புடவை, தாய்மாமன் சீர் என ஒவ்வொன்றையும் அக்கறையோடும் மரியாதையோடும் படம்பிடிக்கிறோம்; கேமரா முன் அவள் தயக்கமின்றி இருக்க உதவுகிறோம்.',
    ),
    covers: [bi('Turmeric bath and rituals', 'மஞ்சள் நீராட்டும் சடங்குகளும்'), bi('Thai maaman seer and family blessings', 'தாய்மாமன் சீரும் குடும்ப ஆசியும்'), bi('Portraits in her silk saree', 'பட்டுப் புடவையில் தனிப் படங்கள்'), bi('Album, calendar and frame', 'ஆல்பம், காலண்டர், பிரேம்')],
    setting: 'ceremony',
    costQ: bi('What does puberty function photography cost {at}?', '{at} மஞ்சள் நீராட்டு விழா புகைப்படத்துக்கு எவ்வளவு ஆகும்?'),
    faq: {
      q: bi('Can you photograph the function at home?', 'வீட்டில் நடக்கும் விழாவுக்கு வருவீர்களா?'),
      a: bi(
        'Yes. Many families hold it at home. We bring compact lights and work in small rooms without crowding the rituals.',
        'ஆம். பல குடும்பங்கள் வீட்டிலேயே நடத்துகிறார்கள். சிறிய விளக்குகளுடன் வந்து, சடங்குகளுக்கு இடையூறு இல்லாமல் சிறிய அறையிலும் படம்பிடிக்கிறோம்.',
      ),
    },
  },
  earpiercing: {
    phrase: bi('Ear piercing ceremony photography', 'காதுகுத்து விழா புகைப்படம்'),
    serviceType: 'Ear piercing ceremony photography',
    intro: bi(
      'Kaadhu Kuthu is over in a minute and usually happens at the family temple. We’re in position before the moment, catch the child on the maaman’s lap, and stay for the feast and the family groups after.',
      'காதுகுத்து சில நிமிடங்களில் முடிந்துவிடும்; பெரும்பாலும் குலதெய்வக் கோயிலில் நடக்கும். அந்தத் தருணத்துக்கு முன்பே தயாராக நின்று, மாமன் மடியில் குழந்தையைப் படம்பிடித்து, விருந்தும் குடும்பப் படங்களும் முடியும் வரை இருக்கிறோம்.',
    ),
    covers: [bi('The piercing on the maaman’s lap', 'மாமன் மடியில் காதுகுத்து'), bi('Mottai, if it’s the same day', 'அதே நாளில் மொட்டை இருந்தால் அதுவும்'), bi('Family and relatives’ groups', 'குடும்ப & உறவினர் குழுப் படங்கள்'), bi('Album and frame', 'ஆல்பம் & பிரேம்')],
    setting: 'ceremony',
    costQ: bi('What does ear piercing ceremony photography cost {at}?', '{at} காதுகுத்து விழா புகைப்படத்துக்கு எவ்வளவு ஆகும்?'),
    faq: {
      q: bi('What if the temple doesn’t allow cameras inside?', 'கோயிலுக்குள் கேமரா அனுமதி இல்லையென்றால்?'),
      a: bi(
        'Some temples don’t allow photos inside the sanctum. We check with the temple beforehand and photograph the rituals that happen outside it.',
        'சில கோயில்களில் கருவறைக்குள் படம் எடுக்க அனுமதி இல்லை. முன்பே கோயிலில் கேட்டுத் தெரிந்துகொண்டு, வெளியே நடக்கும் சடங்குகளைப் படம்பிடிக்கிறோம்.',
      ),
    },
  },
  naming: {
    phrase: bi('Naming ceremony photography', 'பெயர் சூட்டு விழா புகைப்படம்'),
    serviceType: 'Naming ceremony photography',
    intro: bi(
      'Peyar Soottu is the baby’s first function: the cradle, the name whispered in the ear, grandparents everywhere. We work in soft light, with no flash in the baby’s face.',
      'பெயர் சூட்டு விழா குழந்தையின் முதல் விழா: தொட்டில், காதில் சொல்லும் பெயர், எங்கும் தாத்தா பாட்டிகள். மென்மையான ஒளியில், குழந்தையின் முகத்தில் ஃபிளாஷ் இல்லாமல் படம்பிடிக்கிறோம்.',
    ),
    covers: [bi('Cradle ceremony and naming', 'தொட்டில் சடங்கும் பெயர் சூட்டலும்'), bi('Baby portraits in soft light', 'மென்மையான ஒளியில் குழந்தைப் படங்கள்'), bi('Three generations together', 'மூன்று தலைமுறையும் ஒன்றாக'), bi('Album and calendar', 'ஆல்பம் & காலண்டர்')],
    setting: 'ceremony',
    costQ: bi('What does naming ceremony photography cost {at}?', '{at} பெயர் சூட்டு விழா புகைப்படத்துக்கு எவ்வளவு ஆகும்?'),
    faq: {
      q: bi('Is it safe for a newborn?', 'பிறந்த குழந்தைக்கு இது பாதுகாப்பானதா?'),
      a: bi(
        'Yes. No flash near the baby, short stretches with breaks for feeding, and only the family holds the baby.',
        'ஆம். குழந்தை அருகே ஃபிளாஷ் இல்லை, பால் கொடுக்க இடைவேளையுடன் சிறிது சிறிதாகப் படப்பிடிப்பு, குழந்தையைக் குடும்பத்தினர் மட்டுமே தூக்குவார்கள்.',
      ),
    },
  },
  birthday: {
    phrase: bi('Birthday photographer', 'பிறந்தநாள் புகைப்படக் கலைஞர்'),
    serviceType: 'Birthday party photography',
    intro: bi(
      'First birthdays and family milestones: the decor before the guests arrive, the cake and candles, and the happy chaos after. Easy-going coverage the kids barely notice.',
      'முதல் பிறந்தநாளும் குடும்பத்தின் முக்கிய நாட்களும்: விருந்தினர் வருவதற்கு முன் அலங்காரம், கேக், மெழுகுவர்த்தி, அதன் பிறகு வரும் மகிழ்ச்சிக் கலாட்டா. குழந்தைகள் கவனிக்காத அளவுக்கு இயல்பான படப்பிடிப்பு.',
    ),
    covers: [bi('Decor and the cake table', 'அலங்காரமும் கேக் மேசையும்'), bi('Cake cutting and candles', 'கேக் வெட்டுதல் & மெழுகுவர்த்தி'), bi('Candid kids and guests', 'குழந்தைகள், விருந்தினர்களின் கேண்டிட் படங்கள்'), bi('Family portraits', 'குடும்பப் படங்கள்')],
    setting: 'ceremony',
    costQ: bi('What does a birthday photographer cost {at}?', '{at} பிறந்தநாள் புகைப்படத்துக்கு எவ்வளவு ஆகும்?'),
    faq: {
      q: bi('Can we book just two or three hours?', 'இரண்டு மூன்று மணி நேரம் மட்டும் பதிவு செய்யலாமா?'),
      a: bi(
        `Yes. Coverage starts at ${MIN_HOURS} hours. Set the hours when you book and the price updates as you go.`,
        `ஆம். குறைந்தது ${MIN_HOURS} மணி நேரம். பதிவு செய்யும்போது நேரத்தை அமைத்தால் விலை உடனே மாறும்.`,
      ),
    },
  },
  babyshower: {
    phrase: bi('Baby shower (Valaikappu) photography', 'வளைகாப்பு புகைப்படம்'),
    serviceType: 'Baby shower photography',
    intro: bi(
      'Valaikappu is bangles, blessings and a room full of people who love her. We photograph each bangle going on, the elders’ blessings and soft portraits of the mother-to-be.',
      'வளைகாப்பு என்றால் வளையல்கள், ஆசிகள், அவளை நேசிக்கும் உறவுகள் நிறைந்த அறை. ஒவ்வொரு வளையல் அணிவிப்பையும், பெரியவர்களின் ஆசியையும், தாயாகப் போகிறவளின் மென்மையான படங்களையும் பிடிக்கிறோம்.',
    ),
    covers: [bi('The bangle ceremony', 'வளையல் அணிவிப்பு'), bi('Elders’ blessings', 'பெரியவர்களின் ஆசி'), bi('Maternity portraits', 'கர்ப்பகாலத் தனிப் படங்கள்'), bi('Album and frame', 'ஆல்பம் & பிரேம்')],
    setting: 'ceremony',
    costQ: bi('What does baby shower photography cost {at}?', '{at} வளைகாப்பு புகைப்படத்துக்கு எவ்வளவு ஆகும்?'),
    faq: {
      q: bi('Can we add a maternity shoot?', 'கர்ப்பகாலப் படப்பிடிப்பையும் சேர்க்கலாமா?'),
      a: bi(
        'Yes. Add an outdoor maternity shoot when you book, or ask us about Bumpy Tales, our maternity line.',
        'ஆம். பதிவு செய்யும்போது வெளிப்புறக் கர்ப்பகாலப் படப்பிடிப்பைச் சேருங்கள், அல்லது எங்கள் Bumpy Tales பற்றிக் கேளுங்கள்.',
      ),
    },
  },
  prewedding: {
    phrase: bi('Pre-wedding shoot', 'திருமணத்திற்கு முந்தைய படப்பிடிப்பு'),
    serviceType: 'Pre-wedding photography',
    intro: bi(
      'A relaxed couple shoot before the wedding (or after it), with outfit changes and a place that means something to you. Many couples use these photos on the invite and the welcome board.',
      'திருமணத்துக்கு முன்போ பின்போ, உடை மாற்றங்களுடன், உங்களுக்குப் பிடித்த இடத்தில் நிதானமான ஜோடி படப்பிடிப்பு. பல ஜோடிகள் இந்தப் படங்களை அழைப்பிதழிலும் வரவேற்புப் பலகையிலும் பயன்படுத்துகிறார்கள்.',
    ),
    covers: [bi('Locations planned with you', 'உங்களுடன் சேர்ந்து திட்டமிடும் இடங்கள்'), bi('Outfit changes', 'உடை மாற்றங்கள்'), bi('Edited couple portraits', 'எடிட் செய்த ஜோடிப் படங்கள்'), bi('A short film or drone, if you want', 'விரும்பினால் சிறு வீடியோ அல்லது ட்ரோன்')],
    setting: 'location',
    costQ: bi('What does a pre-wedding shoot cost {at}?', '{at} திருமணத்திற்கு முந்தைய படப்பிடிப்புக்கு எவ்வளவு ஆகும்?'),
    faq: {
      q: bi('Morning or evening?', 'காலையா, மாலையா?'),
      a: bi(
        'Early morning and the hour before sunset give the softest light. We pick a time that suits the place and the season.',
        'அதிகாலையும் சூரியன் மறைவதற்கு முந்தைய ஒரு மணி நேரமும் மென்மையான ஒளி தரும். இடத்துக்கும் பருவத்துக்கும் ஏற்ற நேரத்தைத் தேர்ந்தெடுப்போம்.',
      ),
    },
  },
  outdoor: {
    phrase: bi('Outdoor couple shoot', 'வெளிப்புறப் படப்பிடிப்பு'),
    serviceType: 'Outdoor photography',
    intro: bi(
      'Couples, babies or a mother-to-be, photographed on location in natural light. Tell us a place you love or let us suggest one; we look after the timing and the posing.',
      'ஜோடிகள், குழந்தைகள், தாயாகப் போகிறவர்கள், இயற்கை ஒளியில், வெளிப்புற இடத்தில். உங்களுக்குப் பிடித்த இடத்தைச் சொல்லுங்கள், அல்லது நாங்களே பரிந்துரைக்கிறோம்; நேரமும் போஸும் எங்கள் பொறுப்பு.',
    ),
    covers: [bi('Couple, baby or maternity', 'ஜோடி, குழந்தை அல்லது கர்ப்பகாலம்'), bi('Location suggestions', 'இடப் பரிந்துரைகள்'), bi('Natural-light portraits', 'இயற்கை ஒளிப் படங்கள்'), bi('Edited photos in an online gallery', 'ஆன்லைன் கேலரியில் எடிட் செய்த படங்கள்')],
    setting: 'location',
    costQ: bi('What does an outdoor shoot cost {at}?', '{at} வெளிப்புறப் படப்பிடிப்புக்கு எவ்வளவு ஆகும்?'),
    faq: {
      q: bi('Is there a fee for the location?', 'இடத்துக்குத் தனிக் கட்டணம் உண்டா?'),
      a: bi(
        'Some places charge their own entry or camera fee. We tell you in advance and you pay it at the spot. Most public places have none.',
        'சில இடங்களில் நுழைவு அல்லது கேமரா கட்டணம் உண்டு. முன்பே சொல்வோம், அதை அங்கேயே செலுத்தலாம். பெரும்பாலான பொது இடங்களில் கட்டணம் இல்லை.',
      ),
    },
  },
  model: {
    phrase: bi('Model portfolio shoot', 'மாடல் போர்ட்ஃபோலியோ படப்பிடிப்பு'),
    serviceType: 'Portfolio photography',
    intro: bi(
      'Studio or street, a set of looks that shows your range: clean headshots, full-length frames and a few with attitude. Good for modelling, acting and dance portfolios.',
      'ஸ்டுடியோவோ தெருவோ, உங்கள் திறமையைக் காட்டும் பல தோற்றங்கள்: தெளிவான ஹெட்ஷாட், முழு உருவப் படம், சில ஸ்டைலான படங்கள். மாடலிங், நடிப்பு, நடனப் போர்ட்ஃபோலியோவுக்கு ஏற்றது.',
    ),
    covers: [bi('Headshots', 'ஹெட்ஷாட்'), bi('Full-length looks', 'முழு உருவப் படங்கள்'), bi('Studio and outdoor', 'ஸ்டுடியோ & வெளிப்புறம்'), bi('A retouched final set', 'ரீடச் செய்த இறுதிப் படங்கள்')],
    setting: 'location',
    costQ: bi('What does a portfolio shoot cost {at}?', '{at} போர்ட்ஃபோலியோ படப்பிடிப்புக்கு எவ்வளவு ஆகும்?'),
    faq: {
      q: bi('How many outfits can I bring?', 'எத்தனை உடைகள் கொண்டு வரலாம்?'),
      a: bi(
        'Bring three or four. We plan the order so lighting changes are quick. Tell us the look you’re after when you book.',
        'மூன்று நான்கு கொண்டு வாருங்கள். விளக்கு மாற்றம் விரைவாக இருக்க வரிசையைத் திட்டமிடுவோம். பதிவு செய்யும்போது நீங்கள் விரும்பும் தோற்றத்தைச் சொல்லுங்கள்.',
      ),
    },
  },
  corporate: {
    phrase: bi('Corporate event photography', 'நிறுவன நிகழ்வு புகைப்படம்'),
    serviceType: 'Corporate event photography',
    intro: bi(
      'Conferences, product launches, award nights and team days. Clear shots of every speaker, the stage and the audience, with a set ready for your social media.',
      'மாநாடுகள், அறிமுக விழாக்கள், விருது விழாக்கள், குழு நாட்கள். ஒவ்வொரு பேச்சாளர், மேடை, பார்வையாளர்களின் தெளிவான படங்கள்; சமூக ஊடகங்களுக்கு ஏற்ற தொகுப்புடன்.',
    ),
    covers: [bi('Speakers and stage', 'பேச்சாளர்கள் & மேடை'), bi('Audience and networking', 'பார்வையாளர்கள் & சந்திப்புகள்'), bi('Branding and product shots', 'பிராண்டிங் & பொருள் படங்கள்'), bi('Event video on request', 'கேட்டால் நிகழ்வு வீடியோ')],
    setting: 'corporate',
    costQ: bi('What does corporate event photography cost {at}?', '{at} நிறுவன நிகழ்வு புகைப்படத்துக்கு எவ்வளவு ஆகும்?'),
    faq: {
      q: bi('Can you cover a two-day conference?', 'இரண்டு நாள் மாநாட்டுக்கும் வருவீர்களா?'),
      a: bi(
        'Yes. Book the first day here and mention the other days when we call; we’ll send one quote for the whole event.',
        'ஆம். முதல் நாளை இங்கே பதிவு செய்யுங்கள்; நாங்கள் அழைக்கும்போது மற்ற நாட்களைச் சொல்லுங்கள். முழு நிகழ்வுக்கும் ஒரே விலைப்பட்டியல் அனுப்புவோம்.',
      ),
    },
  },
}

const TIERS: FixedTier[] = ['basic', 'standard', 'premium']

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`

/** "a, b and c" / "a, b, c" */
const list = (items: Bi[]): Bi => ({
  en: items.length > 1 ? `${items.slice(0, -1).map(i => i.en).join(', ')} and ${items.at(-1)!.en}` : (items[0]?.en ?? ''),
  ta: items.map(i => i.ta).join(', '),
})

export interface LandingTier {
  tier: FixedTier
  name: Bi
  pitch: Bi
  price: number
  /** Placeholder price still to be confirmed by the studio. */
  pending: boolean
}

export interface LandingCopy {
  district: DistrictKey
  event: EventKey
  h1: Bi
  description: Bi
  intro: Bi
  /** District paragraph plus a sentence tied to the kind of event. */
  local: Bi
  covers: Bi[]
  towns: Bi[]
  places: Bi[]
  travel: Bi
  tiers: LandingTier[]
  /** Lowest confirmed Bronze-level price, or undefined while it's a placeholder. */
  from?: number
  faq: { q: Bi; a: Bi }[]
  serviceType: string
}

export function landingCopy(district: DistrictKey, event: EventKey, prices: PriceMap = DEFAULT_PRICES): LandingCopy | null {
  const d = DISTRICTS.find(x => x.key === district)
  const ev = EVENTS.find(x => x.key === event)
  const e = EVENT_LANDING[event]
  if (!d || !ev || !e) return null
  const f = DISTRICT_FACTS[district]
  const name = d.name

  const h1 = bi(`${e.phrase.en} ${f.at.en}`, `${f.at.ta} ${e.phrase.ta}`)
  const towns = list(f.towns)
  const places = list(f.places.slice(0, 3))
  // Rotate the landmark per event so a district's ceremony pages don't repeat each other.
  const nearby = f.places[EVENTS.indexOf(ev) % f.places.length]

  const setting: Record<Setting, Bi> = {
    ceremony: bi(
      `Wherever the function is, in ${towns.en}, we come to you: home, temple or mahal. For a portrait break, ${nearby.en} is never far.`,
      `${towns.ta} என எங்கு விழா நடந்தாலும் வருகிறோம்: வீடு, கோயில், மண்டபம். தனிப் படங்களுக்கு ${nearby.ta} அருகிலேயே உள்ளது.`,
    ),
    location: bi(
      `Backdrops we like around ${name.en}: ${places.en}. We suggest the right one for the season and the time of day.`,
      `${name.ta} அருகே எங்களுக்குப் பிடித்த பின்னணிகள்: ${places.ta}. பருவத்துக்கும் நேரத்துக்கும் ஏற்ற இடத்தை நாங்களே பரிந்துரைப்போம்.`,
    ),
    corporate: bi(
      `Hotels, halls and offices across ${towns.en}. We arrive early to set up and stay out of the way of your programme.`,
      `${towns.ta} முழுவதும் ஹோட்டல்கள், மண்டபங்கள், அலுவலகங்கள். முன்கூட்டியே வந்து அமைத்து, உங்கள் நிகழ்ச்சிக்கு இடையூறு இல்லாமல் படம்பிடிக்கிறோம்.`,
    ),
  }
  const local = bi(`${f.blurb.en} ${setting[e.setting].en}`, `${f.blurb.ta} ${setting[e.setting].ta}`)

  const travel = bi(
    `Our ${name.en} team is local. The first ${TRAVEL_FREE_KM} km are free; after that it’s ₹${TRAVEL_PER_KM} per km, shown in your quote before you confirm.`,
    `எங்கள் ${name.ta} குழு உள்ளூரிலேயே உள்ளது. முதல் ${TRAVEL_FREE_KM} கி.மீ இலவசம்; அதற்கு மேல் கி.மீ-க்கு ₹${TRAVEL_PER_KM}. உறுதி செய்வதற்கு முன்பே அது உங்கள் விலைப்பட்டியலில் தெரியும்.`,
  )

  const tiers: LandingTier[] = TIERS.map(tier => ({
    tier,
    name: presetName(ev.tiers, tier),
    pitch: tierPitch(ev.tiers, tier),
    price: tierPrice(event, tier, prices),
    pending: !!tierPreset(ev.tiers, tier).pending,
  }))
  const from = tiers[0].pending ? undefined : tiers[0].price

  const at = (s: string, lang: 'en' | 'ta') => s.replace('{at}', f.at[lang])
  const tierLine = (lang: 'en' | 'ta') => tiers.map(t => `${t.name[lang]} ${inr(t.price)}`).join(', ')
  const priceA = from
    ? bi(
        `${tierLine('en')}, each for one 4-hour session. Travel beyond ${TRAVEL_FREE_KM} km is added at ₹${TRAVEL_PER_KM}/km, and you can change anything in a package before you send it.`,
        `${tierLine('ta')}, ஒவ்வொன்றும் ஒரு 4 மணி நேரத்துக்கு. ${TRAVEL_FREE_KM} கி.மீ-க்கு மேல் பயணத்துக்குக் கி.மீ-க்கு ₹${TRAVEL_PER_KM} சேரும்; அனுப்புவதற்கு முன் தொகுப்பில் எதையும் மாற்றலாம்.`,
      )
    : bi(
        `The ${tiers.map(t => t.name.en).join(', ')} prices are being finalised. The booking flow shows today’s figures, and we confirm the final price when we call.`,
        `${tiers.map(t => t.name.ta).join(', ')} விலைகள் இறுதி செய்யப்படுகின்றன. பதிவில் இன்றைய விலை தெரியும்; நாங்கள் அழைக்கும்போது இறுதி விலையை உறுதி செய்வோம்.`,
      )

  const faq = [
    { q: bi(at(e.costQ.en, 'en'), at(e.costQ.ta, 'ta')), a: priceA },
    {
      q: bi(`Do you travel to ${f.towns[1].en} and ${f.towns[2].en}?`, `${f.towns[1].ta}, ${f.towns[2].ta} போன்ற ஊர்களுக்கும் வருவீர்களா?`),
      a: bi(`Yes, anywhere in ${name.en} district: ${towns.en}. ${travel.en}`, `ஆம், ${name.ta} மாவட்டத்தில் எங்கும்: ${towns.ta}. ${travel.ta}`),
    },
    e.faq,
    {
      q: bi('How do I book?', 'எப்படிப் பதிவு செய்வது?'),
      a: bi(
        `Tap “Check your date” on this page: ${name.en} and ${ev.name.en.toLowerCase()} are already filled in. Choose the guest count, venue and package, then send it. No payment now; we call your family within the day.`,
        `இந்தப் பக்கத்தில் “தேதியைப் பாருங்கள்” என்பதைத் தொடுங்கள்: ${name.ta}, ${ev.name.ta} ஏற்கனவே நிரப்பப்பட்டிருக்கும். விருந்தினர் எண்ணிக்கை, இடம், தொகுப்பைத் தேர்ந்தெடுத்து அனுப்புங்கள். இப்போது கட்டணம் இல்லை; அன்றே உங்கள் குடும்பத்தை அழைப்போம்.`,
      ),
    },
  ]

  const description = bi(
    `${h1.en}. ${ev.blurb.en}${from ? `, packages from ${inr(from)}` : ''}. Local team across ${f.towns.slice(0, 3).map(t => t.en).join(', ')}; first ${TRAVEL_FREE_KM} km free.`,
    `${h1.ta}. ${ev.blurb.ta}${from ? `, தொகுப்புகள் ${inr(from)} முதல்` : ''}. ${f.towns.slice(0, 3).map(t => t.ta).join(', ')} என உள்ளூர்க் குழு; முதல் ${TRAVEL_FREE_KM} கி.மீ இலவசம்.`,
  )

  return { district, event, h1, description, intro: e.intro, local, covers: e.covers, towns: f.towns, places: f.places, travel, tiers, from, faq, serviceType: e.serviceType }
}
