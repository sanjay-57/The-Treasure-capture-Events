import type { Bi } from '../../lib/i18n'

/*
 * Terms & Privacy copy for The Treasure Capture Events. Kept as data so the two
 * languages sit side by side and the layout in Legal.tsx stays generic.
 */

export type LegalBlock = { p: Bi } | { list: Bi[] } | { note: Bi } | { contact: true }

export interface LegalSection {
  id: string
  title: Bi
  blocks: LegalBlock[]
}

export interface LegalDoc {
  key: 'terms' | 'privacy'
  title: Bi
  eyebrow: Bi
  intro: Bi
  updated: string
  sections: LegalSection[]
}

export const TERMS: LegalDoc = {
  key: 'terms',
  title: { en: 'Terms & Conditions', ta: 'விதிமுறைகள் & நிபந்தனைகள்' },
  eyebrow: { en: 'Legal · Bookings', ta: 'சட்டம் · பதிவுகள்' },
  intro: {
    en: 'Plain-language terms for every booking — how dates are held, how payments work, what you receive and when, and who owns the pictures.',
    ta: 'ஒவ்வொரு பதிவுக்குமான எளிய மொழி விதிமுறைகள் — தேதி எப்படி ஒதுக்கப்படுகிறது, கட்டணம் எப்படி, என்ன கிடைக்கும், எப்போது, படங்களின் உரிமை யாருக்கு.',
  },
  updated: '2026-09-15',
  sections: [
    {
      id: 'about',
      title: { en: 'About these terms', ta: 'இந்த விதிமுறைகள் பற்றி' },
      blocks: [
        {
          p: {
            en: 'These terms govern every booking made with The Treasure Capture Events (“the studio”, “we”, “us”), a photography and album studio headquartered at 14, West Masi Street, Madurai 625001, Tamil Nadu. By confirming a booking — online, on WhatsApp, by phone or at the studio — you (“the client”) agree to these terms.',
            ta: 'மதுரை 625001, மேற்கு மாசி வீதி, எண் 14-இல் தலைமையகம் கொண்ட புகைப்பட & ஆல்பம் ஸ்டுடியோவான The Treasure Capture Events (“ஸ்டுடியோ”, “நாங்கள்”) உடன் செய்யப்படும் ஒவ்வொரு பதிவுக்கும் இவ்விதிமுறைகள் பொருந்தும். இணையம், வாட்ஸ்அப், தொலைபேசி அல்லது ஸ்டுடியோவில் நேரில் — எவ்வழியில் பதிவை உறுதி செய்தாலும், நீங்கள் (“வாடிக்கையாளர்”) இவ்விதிமுறைகளை ஏற்றுக்கொள்கிறீர்கள்.',
          },
        },
        {
          p: {
            en: 'Your quote and invoice form part of this agreement. Where they differ from these terms, the invoice prevails. The version of these terms in force on the day you confirm your booking applies to that booking.',
            ta: 'உங்கள் மதிப்பீடும் ரசீதும் இந்த ஒப்பந்தத்தின் பகுதிகள். இவ்விதிமுறைகளிலிருந்து அவை வேறுபட்டால், ரசீதில் உள்ளதே செல்லும். நீங்கள் பதிவை உறுதி செய்த நாளில் நடைமுறையில் உள்ள விதிமுறைகளே அந்தப் பதிவுக்குப் பொருந்தும்.',
          },
        },
      ],
    },
    {
      id: 'booking',
      title: { en: 'Bookings & advance', ta: 'பதிவு & முன்பணம்' },
      blocks: [
        {
          p: {
            en: 'The online quote is an estimate based on the details you enter. A booking is confirmed only when we have verified the date and crew availability and received the advance.',
            ta: 'இணைய மதிப்பீடு நீங்கள் உள்ளிடும் விவரங்களின் அடிப்படையிலான ஒரு கணிப்பு மட்டுமே. தேதியையும் குழுவின் இருப்பையும் சரிபார்த்து, முன்பணம் பெற்ற பிறகே பதிவு உறுதியாகும்.',
          },
        },
        {
          list: [
            { en: 'Advance: 30% of the quoted total, payable to confirm the date.', ta: 'முன்பணம்: தேதியை உறுதி செய்ய மதிப்பீட்டுத் தொகையில் 30%.' },
            { en: 'Second instalment: 50% on or before the event day.', ta: 'இரண்டாம் தவணை: விழா நாளன்று அல்லது அதற்கு முன் 50%.' },
            {
              en: 'Balance: the remaining 20%, plus any approved extras, before the album is dispatched and full-resolution files are released.',
              ta: 'மீதத் தொகை: மீதமுள்ள 20%, ஒப்புக்கொண்ட கூடுதல் சேவைகளுடன் — ஆல்பம் அனுப்புவதற்கும் முழுத் தெளிவுப் படங்களை வழங்குவதற்கும் முன்.',
            },
            { en: 'Prices are in Indian Rupees. GST is added where applicable and shown separately on your invoice.', ta: 'கட்டணங்கள் இந்திய ரூபாயில். பொருந்தும் இடங்களில் GST சேர்க்கப்பட்டு, ரசீதில் தனியாகக் காட்டப்படும்.' },
          ],
        },
      ],
    },
    {
      id: 'tentative',
      title: { en: 'Tentative dates', ta: 'தற்காலிகத் தேதிகள்' },
      blocks: [
        {
          p: {
            en: 'If your muhurtham or venue is not yet fixed, you may mark the date as tentative when booking. We hold a tentative date for 7 days without an advance. If another family asks for the same date during this period, we will contact you first and give you 24 hours to confirm. Unconfirmed dates are released automatically after 7 days.',
            ta: 'முகூர்த்தமோ மண்டபமோ இன்னும் முடிவாகவில்லை என்றால், பதிவின்போது தேதியைத் “தற்காலிகம்” எனக் குறிக்கலாம். முன்பணம் இல்லாமல் 7 நாட்கள் அந்தத் தேதியை ஒதுக்கி வைப்போம். அக்காலத்தில் வேறொரு குடும்பம் அதே தேதியைக் கேட்டால், முதலில் உங்களைத் தொடர்புகொண்டு உறுதி செய்ய 24 மணி நேரம் தருவோம். உறுதி செய்யப்படாத தேதிகள் 7 நாட்களுக்குப் பின் தானாகவே விடுவிக்கப்படும்.',
          },
        },
      ],
    },
    {
      id: 'payments',
      title: { en: 'Payments & invoices', ta: 'கட்டணம் & ரசீதுகள்' },
      blocks: [
        { p: { en: 'We do not take payments on this website. All payments are made offline, through:', ta: 'இந்த இணையதளத்தில் நாங்கள் கட்டணம் பெறுவதில்லை. அனைத்துக் கட்டணங்களும் நேரடியாக, கீழ்க்கண்ட வழிகளில் செலுத்தப்படும்:' } },
        {
          list: [
            { en: 'UPI, to the studio’s verified UPI ID printed on your invoice;', ta: 'ரசீதில் அச்சிடப்பட்ட ஸ்டுடியோவின் சரிபார்க்கப்பட்ட UPI முகவரிக்கு UPI மூலம்;' },
            { en: 'Bank transfer (NEFT, IMPS or RTGS) to the account printed on your invoice;', ta: 'ரசீதில் அச்சிடப்பட்ட கணக்குக்கு வங்கிப் பரிமாற்றம் (NEFT, IMPS, RTGS);' },
            { en: 'Cash at the studio, against a printed receipt.', ta: 'அச்சிட்ட ரசீதுக்கு எதிராக, ஸ்டுடியோவில் ரொக்கம்.' },
          ],
        },
        {
          p: {
            en: 'Invoices, payment receipts and balance statements are issued by the studio and sent to your WhatsApp number and email. Every payment is recorded against your order and shown in your client dashboard.',
            ta: 'ரசீதுகள், கட்டண ஒப்புகைகள், நிலுவை அறிக்கைகள் அனைத்தும் ஸ்டுடியோவால் உருவாக்கப்பட்டு, உங்கள் வாட்ஸ்அப் எண்ணுக்கும் மின்னஞ்சலுக்கும் அனுப்பப்படும். ஒவ்வொரு கட்டணமும் உங்கள் ஆர்டரில் பதிவாகி, வாடிக்கையாளர் பக்கத்தில் காட்டப்படும்.',
          },
        },
        {
          note: {
            en: 'We will never ask for your card number, net-banking password or OTP. If anyone claiming to be from the studio does, please do not pay — call us on the number below.',
            ta: 'உங்கள் கார்டு எண், நெட்பேங்கிங் கடவுச்சொல், OTP ஆகியவற்றை நாங்கள் ஒருபோதும் கேட்க மாட்டோம். ஸ்டுடியோ பெயரில் யாராவது கேட்டால், பணம் செலுத்த வேண்டாம் — கீழுள்ள எண்ணில் எங்களை அழையுங்கள்.',
          },
        },
      ],
    },
    {
      id: 'travel',
      title: { en: 'Travel & extended hours', ta: 'பயணம் & கூடுதல் நேரம்' },
      blocks: [
        {
          list: [
            {
              en: 'Travel is free within 20 km of the nearest studio base. Beyond 20 km, a surcharge of ₹40 per km, calculated on road distance, is added and shown in your quote.',
              ta: 'அருகிலுள்ள ஸ்டுடியோ தளத்திலிருந்து 20 கி.மீ வரை பயணம் இலவசம். 20 கி.மீக்கு மேல், சாலைத் தூரத்தின் அடிப்படையில் கி.மீக்கு ₹40 கூடுதல் கட்டணம் சேர்க்கப்பட்டு மதிப்பீட்டில் காட்டப்படும்.',
            },
            {
              en: 'For venues more than 150 km away, early-morning muhurthams that need overnight travel, or multi-day events, the client provides clean accommodation and meals for the crew, or reimburses them at actuals.',
              ta: '150 கி.மீக்கு மேலான இடங்கள், முந்தைய இரவே பயணிக்க வேண்டிய அதிகாலை முகூர்த்தங்கள், பல நாள் விழாக்கள் ஆகியவற்றுக்கு — குழுவுக்குச் சுத்தமான தங்குமிடமும் உணவும் வாடிக்கையாளர் ஏற்பாடு செய்ய வேண்டும், அல்லது உண்மைச் செலவைத் திருப்பித் தர வேண்டும்.',
            },
            {
              en: 'Coverage beyond the booked hours is charged at the hourly rate on your quote, rounded up to the next half hour.',
              ta: 'பதிவு செய்த நேரத்தைத் தாண்டிய படப்பிடிப்புக்கு, மதிப்பீட்டில் உள்ள மணிநேரக் கட்டணம், அடுத்த அரை மணி நேரத்திற்கு முழுமையாக்கி வசூலிக்கப்படும்.',
            },
            { en: 'For events longer than five hours, we ask that the crew be offered a meal.', ta: 'ஐந்து மணி நேரத்திற்கு மேலான விழாக்களில், குழுவினருக்கு உணவு வழங்குமாறு கேட்டுக்கொள்கிறோம்.' },
          ],
        },
      ],
    },
    {
      id: 'cancellation',
      title: { en: 'Cancellation & rescheduling', ta: 'ரத்து & தேதி மாற்றம்' },
      blocks: [
        {
          list: [
            {
              en: 'Rescheduling: you may move your booking once, free of charge, to any available date within 12 months, with at least 30 days’ notice. The advance carries over in full.',
              ta: 'தேதி மாற்றம்: குறைந்தது 30 நாட்கள் முன்னறிவிப்புடன், 12 மாதங்களுக்குள் கிடைக்கும் எந்தத் தேதிக்கும் ஒருமுறை இலவசமாக மாற்றலாம். முன்பணம் முழுமையாக மாற்றப்படும்.',
            },
            { en: 'Cancellation more than 60 days before the event: 50% of the advance is refunded.', ta: 'விழாவுக்கு 60 நாட்களுக்கு மேல் முன்பாக ரத்து: முன்பணத்தில் 50% திருப்பித் தரப்படும்.' },
            {
              en: 'Cancellation 60 days or less before the event: the advance is non-refundable, as the date has been declined to other families.',
              ta: 'விழாவுக்கு 60 நாட்கள் அல்லது அதற்குக் குறைவான காலத்தில் ரத்து: அந்தத் தேதியை மற்ற குடும்பங்களுக்கு மறுத்திருப்பதால், முன்பணம் திருப்பித் தரப்படாது.',
            },
            { en: 'Cancellation within 7 days of the event: 50% of the total quoted amount is payable.', ta: 'விழாவுக்கு 7 நாட்களுக்குள் ரத்து: மொத்த மதிப்பீட்டுத் தொகையில் 50% செலுத்த வேண்டும்.' },
            {
              en: 'If the studio must cancel for a reason within our control, we will first offer an equally experienced photographer from our team. If you decline, every rupee you have paid is refunded within 7 working days.',
              ta: 'எங்கள் கட்டுப்பாட்டில் உள்ள காரணத்தால் ஸ்டுடியோ ரத்து செய்ய நேர்ந்தால், முதலில் எங்கள் குழுவிலிருந்து அதே அனுபவமுள்ள கலைஞரை வழங்குவோம். நீங்கள் மறுத்தால், செலுத்திய ஒவ்வொரு ரூபாயும் 7 பணி நாட்களுக்குள் திருப்பித் தரப்படும்.',
            },
          ],
        },
      ],
    },
    {
      id: 'deliverables',
      title: { en: 'Deliverables & timelines', ta: 'ஒப்படைப்புகள் & கால அளவு' },
      blocks: [
        {
          p: {
            en: 'What you receive depends on your package and add-ons, as listed on your invoice. Typical timelines, counted from the event day unless stated otherwise:',
            ta: 'உங்களுக்குக் கிடைப்பவை, ரசீதில் குறிப்பிட்ட தொகுப்பு & கூடுதல் சேவைகளைப் பொறுத்தது. வேறுவிதமாகக் குறிப்பிடாவிட்டால், விழா நாளிலிருந்து கணக்கிடப்படும் வழக்கமான கால அளவுகள்:',
          },
        },
        {
          list: [
            { en: 'Online proof gallery — within 10 days', ta: 'இணையத் தேர்வு கேலரி — 10 நாட்களுக்குள்' },
            { en: 'Highlight film and full edited photographs (high-resolution JPEG) — 3 to 4 weeks', ta: 'ஹைலைட் வீடியோ & முழுமையாக எடிட் செய்த படங்கள் (உயர் தெளிவு JPEG) — 3 முதல் 4 வாரங்கள்' },
            { en: 'Documentary film (Heirloom) — 6 to 8 weeks', ta: 'ஆவணப் படம் (பரம்பரைப் பொக்கிஷம்) — 6 முதல் 8 வாரங்கள்' },
            { en: 'Printed album — 30 to 45 days from your approval of the final design', ta: 'அச்சிட்ட ஆல்பம் — இறுதி வடிவமைப்புக்கு நீங்கள் ஒப்புதல் தந்த நாளிலிருந்து 30 முதல் 45 நாட்கள்' },
          ],
        },
        {
          p: {
            en: 'In peak muhurtham months — Thai, Panguni, Vaikasi, Aavani and Karthigai — timelines may extend by up to two weeks; we will tell you in advance if a delay is expected. We deliver edited photographs; RAW or unedited files are not included, but may be provided on request for an archive fee.',
            ta: 'முகூர்த்த மாதங்களில் — தை, பங்குனி, வைகாசி, ஆவணி, கார்த்திகை — கால அளவு இரண்டு வாரங்கள் வரை நீளலாம்; தாமதம் ஏற்படும் என்றால் முன்பே தெரிவிப்போம். நாங்கள் எடிட் செய்த படங்களையே வழங்குகிறோம்; RAW / எடிட் செய்யாத கோப்புகள் இதில் அடங்காது, ஆனால் கோரிக்கையின் பேரில் சேமிப்புக் கட்டணத்துடன் வழங்கலாம்.',
          },
        },
      ],
    },
    {
      id: 'selection',
      title: { en: 'Proof selection window', ta: 'படத் தேர்வுக் காலம்' },
      blocks: [
        {
          list: [
            {
              en: 'Your proof gallery stays open for 30 days. Proofs are low-resolution and watermarked; please do not print or publish them.',
              ta: 'தேர்வு கேலரி 30 நாட்கள் திறந்திருக்கும். மாதிரிப் படங்கள் குறைந்த தெளிவுடனும் நீர்க்குறியுடனும் இருக்கும்; அவற்றை அச்சிடவோ வெளியிடவோ வேண்டாம்.',
            },
            { en: 'You may request one 15-day extension free of charge.', ta: 'ஒருமுறை 15 நாள் நீட்டிப்பை இலவசமாகக் கோரலாம்.' },
            {
              en: 'If no selection is submitted after two reminders, we may design the album from our own curated selection so that it is not delayed indefinitely.',
              ta: 'இரண்டு நினைவூட்டல்களுக்குப் பிறகும் தேர்வு சமர்ப்பிக்கப்படாவிட்டால், ஆல்பம் காலவரையின்றித் தாமதமாகாமல் இருக்க, எங்கள் தேர்விலேயே வடிவமைக்கலாம்.',
            },
            {
              en: 'Changes after submission are free within 48 hours. Later changes are possible until printing begins, but may carry a re-design fee per spread.',
              ta: 'சமர்ப்பித்த 48 மணி நேரத்திற்குள் மாற்றங்கள் இலவசம். அச்சிடத் தொடங்கும் வரை பின்னரும் மாற்றலாம்; ஆனால் ஒவ்வொரு பக்கத்திற்கும் மறுவடிவமைப்புக் கட்டணம் இருக்கலாம்.',
            },
          ],
        },
      ],
    },
    {
      id: 'album',
      title: { en: 'Album production', ta: 'ஆல்பம் தயாரிப்பு' },
      blocks: [
        {
          list: [
            {
              en: 'You choose cover, colour, paper, size, typography and sheet count in your dashboard. Sheets beyond those in your package are ₹450 each.',
              ta: 'அட்டை, நிறம், தாள், அளவு, எழுத்துரு, தாள் எண்ணிக்கை ஆகியவற்றை உங்கள் பக்கத்திலேயே தேர்ந்தெடுக்கலாம். தொகுப்பைத் தாண்டிய ஒவ்வொரு கூடுதல் தாளுக்கும் ₹450.',
            },
            { en: 'We share a digital design proof. Two rounds of revisions are included; further rounds are charged.', ta: 'டிஜிட்டல் வடிவமைப்பு மாதிரியைப் பகிர்வோம். இரண்டு சுற்றுத் திருத்தங்கள் அடங்கும்; அதற்கு மேல் கட்டணம் உண்டு.' },
            {
              en: 'Printing begins once you approve the final design in writing (a WhatsApp message is enough) and the balance is cleared.',
              ta: 'இறுதி வடிவமைப்புக்கு எழுத்துப்பூர்வ ஒப்புதல் (ஒரு வாட்ஸ்அப் செய்தியே போதும்) தந்து, மீதத் தொகை செலுத்திய பின் அச்சிடுதல் தொடங்கும்.',
            },
            {
              en: 'Colours on screen and on paper can differ slightly. Handmade materials such as silk and velvet carry natural variations in weave and tone; these are not defects.',
              ta: 'திரையில் தெரியும் நிறமும் தாளில் அச்சாகும் நிறமும் சிறிது வேறுபடலாம். பட்டு, வெல்வெட் போன்ற கைவினைப் பொருட்களின் நெசவிலும் நிறத்திலும் இயற்கையான வேறுபாடுகள் இருக்கும்; அவை குறைபாடுகள் அல்ல.',
            },
            { en: 'Manufacturing defects reported within 15 days of delivery are corrected free of charge.', ta: 'ஒப்படைத்த 15 நாட்களுக்குள் தெரிவிக்கப்படும் உற்பத்திக் குறைபாடுகள் இலவசமாகச் சரிசெய்யப்படும்.' },
          ],
        },
      ],
    },
    {
      id: 'copyright',
      title: { en: 'Copyright & usage', ta: 'பதிப்புரிமை & பயன்பாடு' },
      blocks: [
        {
          p: {
            en: 'Under the Copyright Act, 1957, the studio owns the copyright in the photographs and films we create. You receive a perpetual, personal licence to print, display and share them with family and friends, including on your own social media.',
            ta: 'பதிப்புரிமைச் சட்டம், 1957-இன்படி, நாங்கள் உருவாக்கும் புகைப்படங்கள் & வீடியோக்களின் பதிப்புரிமை ஸ்டுடியோவுக்கே உரியது. அவற்றை அச்சிடவும், காட்சிப்படுத்தவும், உங்கள் சமூக ஊடகங்கள் உட்பட குடும்பத்தினர், நண்பர்களுடன் பகிரவும் நிரந்தரத் தனிப்பட்ட உரிமம் உங்களுக்கு உண்டு.',
          },
        },
        {
          list: [
            {
              en: 'Commercial use — selling images, advertising, or licensing them to magazines or brands — needs our written permission.',
              ta: 'வணிகப் பயன்பாடு — படங்களை விற்பது, விளம்பரம், பத்திரிகைகள் அல்லது நிறுவனங்களுக்கு உரிமம் வழங்குவது — எங்கள் எழுத்துப்பூர்வ அனுமதி தேவை.',
            },
            { en: 'A credit to the studio when you post is appreciated, never required.', ta: 'பகிரும்போது ஸ்டுடியோவைக் குறிப்பிட்டால் மகிழ்வோம்; அது கட்டாயமல்ல.' },
            {
              en: 'Portfolio consent: we may use a small selection of images on our website, social media and printed samples. You can opt out at booking, or at any time later in writing — we remove images within 7 days.',
              ta: 'போர்ட்ஃபோலியோ ஒப்புதல்: சில படங்களை எங்கள் இணையதளம், சமூக ஊடகங்கள், அச்சு மாதிரிகளில் பயன்படுத்தலாம். பதிவின்போதோ, பின்னர் எப்போது வேண்டுமானாலும் எழுத்துப்பூர்வமாகவோ விலகலாம் — 7 நாட்களுக்குள் படங்களை நீக்குவோம்.',
            },
            {
              en: 'We never publish images of children, puberty ceremonies or private rituals without the family’s explicit written consent.',
              ta: 'குழந்தைகள், மஞ்சள் நீராட்டு விழா, தனிப்பட்ட சடங்குகள் ஆகியவற்றின் படங்களைக் குடும்பத்தின் வெளிப்படையான எழுத்துப்பூர்வ ஒப்புதல் இன்றி ஒருபோதும் வெளியிட மாட்டோம்.',
            },
          ],
        },
      ],
    },
    {
      id: 'responsibilities',
      title: { en: 'Client responsibilities', ta: 'வாடிக்கையாளர் பொறுப்புகள்' },
      blocks: [
        {
          list: [
            {
              en: 'Obtain permission for photography, videography, lighting and any LED wall from your venue, mahal or temple authorities, and pay any fees they charge.',
              ta: 'மண்டபம், அரங்கம் அல்லது கோயில் நிர்வாகத்திடம் புகைப்படம், வீடியோ, ஒளியமைப்பு, LED திரை ஆகியவற்றுக்கான அனுமதியைப் பெற்று, அவர்கள் விதிக்கும் கட்டணங்களைச் செலுத்துதல்.',
            },
            {
              en: 'Drone coverage needs the venue owner’s permission. We fly registered drones with certified remote pilots under the Drone Rules, 2021, and will not fly in red or yellow zones (including near airports and many temples) without airspace clearance, or in unsafe weather. If a flight is not possible, the drone charge is refunded; no other liability arises.',
              ta: 'ட்ரோன் படப்பிடிப்புக்கு இட உரிமையாளரின் அனுமதி அவசியம். ட்ரோன் விதிகள், 2021-இன்படி பதிவுசெய்த ட்ரோன்களைச் சான்றிதழ் பெற்ற இயக்குநர்கள் இயக்குவார்கள். வான்வெளி அனுமதியின்றி சிவப்பு / மஞ்சள் மண்டலங்களிலும் (விமான நிலையங்கள், பல கோயில்களின் அருகில்), பாதுகாப்பற்ற வானிலையிலும் பறக்க மாட்டோம். பறக்க இயலாவிட்டால் ட்ரோன் கட்டணம் திருப்பித் தரப்படும்; வேறு பொறுப்பு எழாது.',
            },
            {
              en: 'Share an accurate schedule, venue address and a family contact person for the day, and tell us about changes at least 48 hours ahead.',
              ta: 'சரியான நிகழ்ச்சி நிரல், இட முகவரி, அன்றைய தினத்திற்கான குடும்பத் தொடர்பாளர் விவரங்களைப் பகிர்ந்து, மாற்றங்களைக் குறைந்தது 48 மணி நேரம் முன்பே தெரிவித்தல்.',
            },
            { en: 'Ensure a safe working environment for the crew and their equipment.', ta: 'குழுவினருக்கும் அவர்களின் கருவிகளுக்கும் பாதுகாப்பான சூழலை உறுதி செய்தல்.' },
          ],
        },
      ],
    },
    {
      id: 'liability',
      title: { en: 'Liability & force majeure', ta: 'பொறுப்பு & தவிர்க்க இயலாத சூழல்கள்' },
      blocks: [
        {
          p: {
            en: 'We shoot on dual-card cameras, carry backup bodies and keep two copies of every file until delivery. Even so, our total liability for any claim is limited to the amount you have paid us for the affected booking.',
            ta: 'இரட்டை மெமரி கார்டு கேமராக்களில் படம்பிடிக்கிறோம், மாற்றுக் கேமராக்களை உடன் வைத்திருக்கிறோம், ஒப்படைக்கும் வரை ஒவ்வொரு கோப்புக்கும் இரண்டு நகல்கள் வைத்திருக்கிறோம். இருப்பினும், எந்தக் கோரிக்கைக்கும் எங்கள் மொத்தப் பொறுப்பு, சம்பந்தப்பட்ட பதிவுக்கு நீங்கள் செலுத்திய தொகைக்கு மட்டுமே வரம்புக்குட்பட்டது.',
          },
        },
        {
          p: {
            en: 'We are not responsible for moments missed because of venue or temple restrictions, guests or other photographers blocking the view, schedule changes made without telling us, or lighting conditions outside our control.',
            ta: 'மண்டப / கோயில் கட்டுப்பாடுகள், பார்வையை மறைக்கும் விருந்தினர்கள் அல்லது பிற புகைப்படக்காரர்கள், எங்களுக்குத் தெரிவிக்காமல் செய்யப்பட்ட நேர மாற்றங்கள், எங்கள் கட்டுப்பாட்டுக்கு அப்பாற்பட்ட ஒளிச் சூழல்கள் — இவற்றால் தவறும் தருணங்களுக்கு நாங்கள் பொறுப்பல்ல.',
          },
        },
        {
          p: {
            en: 'Neither party is liable for failing to perform because of events beyond reasonable control — including floods, cyclones, epidemics, government orders, curfews, strikes or serious illness. We will first try to reschedule; if that is not possible, amounts paid for undelivered services are refunded, less costs already incurred.',
            ta: 'வெள்ளம், புயல், தொற்றுநோய், அரசு உத்தரவுகள், ஊரடங்கு, வேலைநிறுத்தம், கடும் உடல்நலக் குறைவு போன்ற நியாயமான கட்டுப்பாட்டுக்கு அப்பாற்பட்ட நிகழ்வுகளால் கடமையை நிறைவேற்ற இயலாவிட்டால், இரு தரப்பும் பொறுப்பாகாது. முதலில் தேதி மாற்றவே முயல்வோம்; இயலாவிட்டால், வழங்கப்படாத சேவைகளுக்குச் செலுத்திய தொகை, ஏற்கனவே ஆன செலவுகளைக் கழித்து, திருப்பித் தரப்படும்.',
          },
        },
      ],
    },
    {
      id: 'law',
      title: { en: 'Governing law & jurisdiction', ta: 'ஆளும் சட்டம் & நீதி வரம்பு' },
      blocks: [
        {
          p: {
            en: 'These terms are governed by the laws of India. We will always try to resolve a concern through conversation first. If a dispute cannot be settled amicably within 30 days, the courts at Madurai, Tamil Nadu, shall have exclusive jurisdiction.',
            ta: 'இவ்விதிமுறைகள் இந்தியச் சட்டங்களுக்கு உட்பட்டவை. எந்தப் பிரச்சினையையும் முதலில் பேச்சுவார்த்தை மூலம் தீர்க்கவே முயல்வோம். 30 நாட்களுக்குள் சுமுகமாகத் தீர்க்க இயலாவிட்டால், தமிழ்நாடு, மதுரை நீதிமன்றங்களுக்கே பிரத்யேக நீதி வரம்பு உண்டு.',
          },
        },
      ],
    },
    {
      id: 'contact',
      title: { en: 'Contact', ta: 'தொடர்புக்கு' },
      blocks: [{ p: { en: 'Questions about these terms, or about your booking? We are happy to talk them through.', ta: 'இவ்விதிமுறைகள் அல்லது உங்கள் பதிவு குறித்துக் கேள்விகளா? மகிழ்ச்சியுடன் விளக்குகிறோம்.' } }, { contact: true }],
    },
  ],
}

export const PRIVACY: LegalDoc = {
  key: 'privacy',
  title: { en: 'Privacy Policy', ta: 'தனியுரிமைக் கொள்கை' },
  eyebrow: { en: 'Legal · Your data', ta: 'சட்டம் · உங்கள் தரவு' },
  intro: {
    en: 'What we collect, why, who helps us handle it, how long we keep it — and how to ask us to change or delete it.',
    ta: 'நாங்கள் எதைச் சேகரிக்கிறோம், ஏன், அதைக் கையாள யார் உதவுகிறார்கள், எவ்வளவு காலம் வைத்திருக்கிறோம் — அதை மாற்றவோ நீக்கவோ எப்படிக் கேட்பது.',
  },
  updated: '2026-09-15',
  sections: [
    {
      id: 'who',
      title: { en: 'Who we are', ta: 'நாங்கள் யார்' },
      blocks: [
        {
          p: {
            en: 'The Treasure Capture Events, 14, West Masi Street, Madurai 625001, is responsible for the personal data described in this policy — the “Data Fiduciary” under India’s Digital Personal Data Protection Act, 2023. This policy explains what we collect when you use this website, book an event or work with us, and the choices you have.',
            ta: 'மதுரை 625001, மேற்கு மாசி வீதி, எண் 14-இல் உள்ள The Treasure Capture Events, இக்கொள்கையில் விவரிக்கப்பட்ட தனிப்பட்ட தரவுகளுக்குப் பொறுப்பாகும் — இந்திய டிஜிட்டல் தனிப்பட்ட தரவுப் பாதுகாப்புச் சட்டம், 2023-இன்படி “தரவு நம்பிக்கையாளர்”. இந்த இணையதளத்தைப் பயன்படுத்தும்போதும், விழாவைப் பதிவு செய்யும்போதும், எங்களுடன் பணியாற்றும்போதும் நாங்கள் சேகரிப்பவை எவை, உங்களுக்குள்ள தேர்வுகள் எவை என்பதை இக்கொள்கை விளக்குகிறது.',
          },
        },
      ],
    },
    {
      id: 'collect',
      title: { en: 'What we collect', ta: 'நாங்கள் சேகரிப்பவை' },
      blocks: [
        {
          list: [
            { en: 'Contact details — your name, mobile number and, if you share it, your email address.', ta: 'தொடர்பு விவரங்கள் — உங்கள் பெயர், கைபேசி எண், நீங்கள் பகிர்ந்தால் மின்னஞ்சல் முகவரி.' },
            {
              en: 'Event details — ceremony type, date and time, district, venue name and address, guest count, package and add-ons, and any notes you give us.',
              ta: 'விழா விவரங்கள் — விழா வகை, தேதி & நேரம், மாவட்டம், இடத்தின் பெயர் & முகவரி, விருந்தினர் எண்ணிக்கை, தொகுப்பு & கூடுதல் சேவைகள், நீங்கள் தரும் குறிப்புகள்.',
            },
            { en: 'Photographs and films of your event, which naturally include your family and guests.', ta: 'உங்கள் விழாவின் புகைப்படங்களும் வீடியோக்களும் — இயல்பாகவே உங்கள் குடும்பத்தினரும் விருந்தினர்களும் இவற்றில் இடம்பெறுவர்.' },
            { en: 'Your photo selections, album preferences and review, if you leave one.', ta: 'நீங்கள் தேர்ந்தெடுத்த படங்கள், ஆல்பம் விருப்பங்கள், நீங்கள் எழுதும் மதிப்புரை.' },
            {
              en: 'Payment records — amounts, dates, mode (UPI, bank or cash) and reference numbers. We never collect card numbers, banking passwords or OTPs.',
              ta: 'கட்டணப் பதிவுகள் — தொகை, தேதி, முறை (UPI, வங்கி, ரொக்கம்), குறிப்பு எண்கள். கார்டு எண்கள், வங்கிக் கடவுச்சொற்கள், OTP ஆகியவற்றை ஒருபோதும் சேகரிப்பதில்லை.',
            },
            { en: 'Messages you send us on WhatsApp, by phone or by email.', ta: 'வாட்ஸ்அப், தொலைபேசி, மின்னஞ்சல் வழியாக நீங்கள் அனுப்பும் செய்திகள்.' },
          ],
        },
      ],
    },
    {
      id: 'why',
      title: { en: 'Why we use it', ta: 'ஏன் பயன்படுத்துகிறோம்' },
      blocks: [
        {
          list: [
            { en: 'To prepare your quote, confirm your date and call you back.', ta: 'மதிப்பீடு தயாரிக்க, தேதியை உறுதி செய்ய, உங்களைத் திரும்ப அழைக்க.' },
            { en: 'To plan coverage and brief the photographers assigned to your event.', ta: 'படப்பிடிப்பைத் திட்டமிட்டு, உங்கள் விழாவுக்கு ஒதுக்கப்பட்ட கலைஞர்களுக்கு விவரம் அளிக்க.' },
            { en: 'To host your proofs, produce your album and deliver your files.', ta: 'மாதிரிப் படங்களைச் சேமிக்க, ஆல்பம் தயாரிக்க, கோப்புகளை ஒப்படைக்க.' },
            { en: 'To issue invoices and receipts, and to meet our tax and accounting obligations.', ta: 'ரசீதுகள் வழங்கவும், வரி & கணக்கியல் கடமைகளை நிறைவேற்றவும்.' },
            { en: 'To send you order updates on WhatsApp.', ta: 'வாட்ஸ்அப்பில் ஆர்டர் நிலை அறிவிப்புகளை அனுப்ப.' },
            { en: 'To show selected work in our portfolio — only as described in our Terms, and never if you opt out.', ta: 'எங்கள் போர்ட்ஃபோலியோவில் சில படைப்புகளைக் காட்ட — விதிமுறைகளில் குறிப்பிட்டபடி மட்டும்; நீங்கள் விலகினால் ஒருபோதும் இல்லை.' },
          ],
        },
        { note: { en: 'We do not sell your data, and we do not use it for advertising.', ta: 'உங்கள் தரவை நாங்கள் விற்பதில்லை; விளம்பரங்களுக்குப் பயன்படுத்துவதுமில்லை.' } },
      ],
    },
    {
      id: 'sharing',
      title: { en: 'Services we rely on', ta: 'நாங்கள் சார்ந்திருக்கும் சேவைகள்' },
      blocks: [
        { p: { en: 'We share only what each provider needs to do its job:', ta: 'ஒவ்வொரு சேவை வழங்குநருக்கும் அதன் பணிக்குத் தேவையானதை மட்டுமே பகிர்கிறோம்:' } },
        {
          list: [
            {
              en: 'WhatsApp Business Platform (Meta Platforms, Inc.) — to send you order updates, and to send your assigned photographer the venue, timings and a contact number. These messages are also handled under Meta’s own terms and privacy policy.',
              ta: 'வாட்ஸ்அப் பிசினஸ் தளம் (Meta Platforms, Inc.) — உங்களுக்கு ஆர்டர் நிலை அறிவிப்புகளையும், ஒதுக்கப்பட்ட புகைப்படக் கலைஞருக்கு இடம், நேரம், தொடர்பு எண்ணையும் அனுப்ப. இச்செய்திகள் Meta-வின் சொந்த விதிமுறைகள் & தனியுரிமைக் கொள்கையின்படியும் கையாளப்படுகின்றன.',
            },
            {
              en: 'Google Cloud Storage — to store low-resolution, watermarked proofs in private folders linked to your order.',
              ta: 'Google Cloud Storage — உங்கள் ஆர்டருடன் இணைந்த தனிப்பட்ட கோப்புறைகளில் குறைந்த தெளிவு, நீர்க்குறியிட்ட மாதிரிப் படங்களைச் சேமிக்க.',
            },
            { en: 'Google Maps — to estimate the road distance from our studio base to your venue.', ta: 'Google Maps — எங்கள் ஸ்டுடியோ தளத்திலிருந்து உங்கள் இடத்திற்கான சாலைத் தூரத்தைக் கணக்கிட.' },
            { en: 'Google Gemini API — to power the optional voice features described below.', ta: 'Google Gemini API — கீழே விவரிக்கப்பட்ட விருப்பத்தேர்வுக் குரல் வசதிகளை இயக்க.' },
            { en: 'Our crew and freelance partners — only your name, phone number, venue and timings for your event.', ta: 'எங்கள் குழு & ஃப்ரீலான்ஸ் கூட்டாளர்கள் — உங்கள் விழாவுக்கான பெயர், தொலைபேசி எண், இடம், நேரம் மட்டும்.' },
            { en: 'Our album binder and print lab — only the images selected for printing.', ta: 'ஆல்பம் பைண்டர் & அச்சகம் — அச்சிடத் தேர்ந்தெடுத்த படங்கள் மட்டும்.' },
          ],
        },
        {
          p: {
            en: 'Some of these providers may process data outside India under their own safeguards, as permitted by Indian law. We may also disclose information when required by law or by a lawful order of a court or authority.',
            ta: 'இவற்றில் சில சேவை வழங்குநர்கள், இந்தியச் சட்டம் அனுமதிக்கும் வகையில், தங்கள் பாதுகாப்பு நடைமுறைகளுடன் இந்தியாவுக்கு வெளியே தரவைக் கையாளலாம். சட்டப்படி அல்லது நீதிமன்றம் / அதிகார அமைப்பின் முறையான உத்தரவின்படி தேவைப்பட்டால் தகவலை வெளிப்படுத்தலாம்.',
          },
        },
      ],
    },
    {
      id: 'voice',
      title: { en: 'Voice features (Gemini)', ta: 'குரல் வசதிகள் (Gemini)' },
      blocks: [
        {
          p: {
            en: 'The “Listen” buttons and the Tamil voice assistant in the booking cart are optional. When you use them, the text on screen — or the words you speak — is sent to Google’s Gemini API to generate speech or to understand your request. We do not store your voice recordings; Google processes them under its API terms. Some browsers may also use their own built-in speech engine.',
            ta: '“கேளுங்கள்” பொத்தான்களும், பதிவுக் கூடையில் உள்ள தமிழ்க் குரல் உதவியாளரும் விருப்பத்தேர்வுகளே. அவற்றைப் பயன்படுத்தும்போது, திரையில் உள்ள உரை — அல்லது நீங்கள் பேசும் சொற்கள் — குரலை உருவாக்க அல்லது உங்கள் கோரிக்கையைப் புரிந்துகொள்ள Google Gemini API-க்கு அனுப்பப்படும். உங்கள் குரல் பதிவுகளை நாங்கள் சேமிப்பதில்லை; Google அதன் API விதிமுறைகளின்படி அவற்றைக் கையாள்கிறது. சில உலாவிகள் தங்களின் உள்ளமைந்த குரல் இயந்திரத்தையும் பயன்படுத்தலாம்.',
          },
        },
        {
          note: {
            en: 'Please avoid speaking sensitive personal details — such as bank or ID numbers — to the voice assistant.',
            ta: 'வங்கி எண், அடையாள அட்டை எண் போன்ற முக்கியத் தனிப்பட்ட விவரங்களைக் குரல் உதவியாளரிடம் சொல்ல வேண்டாம்.',
          },
        },
      ],
    },
    {
      id: 'photos',
      title: { en: 'Your photographs', ta: 'உங்கள் புகைப்படங்கள்' },
      blocks: [
        {
          p: {
            en: 'Proofs are visible only after you sign in to your client dashboard; gallery links are private and not indexed by search engines. Full-resolution files and RAW backups are kept on encrypted drives at our Madurai studio and in a private cloud backup.',
            ta: 'வாடிக்கையாளர் பக்கத்தில் உள்நுழைந்த பின்பே மாதிரிப் படங்கள் தெரியும்; கேலரி இணைப்புகள் தனிப்பட்டவை, தேடுபொறிகளில் இடம்பெறாது. முழுத் தெளிவுக் கோப்புகளும் RAW காப்புகளும் எங்கள் மதுரை ஸ்டுடியோவில் மறையாக்கம் செய்த டிரைவ்களிலும், தனிப்பட்ட கிளவுட் காப்பிலும் வைக்கப்படுகின்றன.',
          },
        },
      ],
    },
    {
      id: 'retention',
      title: { en: 'How long we keep it', ta: 'எவ்வளவு காலம் வைத்திருப்போம்' },
      blocks: [
        {
          list: [
            { en: 'Enquiries that don’t become bookings — 12 months, then deleted.', ta: 'பதிவாக மாறாத விசாரணைகள் — 12 மாதங்கள், பின் நீக்கப்படும்.' },
            { en: 'Online proofs — removed 90 days after your album is delivered.', ta: 'இணைய மாதிரிப் படங்கள் — ஆல்பம் ஒப்படைத்த 90 நாட்களுக்குப் பின் நீக்கப்படும்.' },
            {
              en: 'Full-resolution files and RAW backups — 12 months after delivery, then securely deleted. Ask us if you’d like a longer archive.',
              ta: 'முழுத் தெளிவுக் கோப்புகள் & RAW காப்புகள் — ஒப்படைத்த 12 மாதங்கள் வரை, பின் பாதுகாப்பாக நீக்கப்படும். நீண்ட காலம் வைத்திருக்க விரும்பினால் கேளுங்கள்.',
            },
            { en: 'Invoices and payment records — 8 years, as required by Indian tax law.', ta: 'ரசீதுகள் & கட்டணப் பதிவுகள் — இந்திய வரிச் சட்டப்படி 8 ஆண்டுகள்.' },
            { en: 'Portfolio images — until you ask us to remove them.', ta: 'போர்ட்ஃபோலியோ படங்கள் — நீக்கச் சொல்லும் வரை.' },
          ],
        },
      ],
    },
    {
      id: 'rights',
      title: { en: 'Your rights', ta: 'உங்கள் உரிமைகள்' },
      blocks: [
        { p: { en: 'Under the Digital Personal Data Protection Act, 2023, you can:', ta: 'டிஜிட்டல் தனிப்பட்ட தரவுப் பாதுகாப்புச் சட்டம், 2023-இன்படி நீங்கள்:' } },
        {
          list: [
            { en: 'ask what personal data we hold about you and how it is used;', ta: 'உங்களைப் பற்றி எந்தத் தரவு எங்களிடம் உள்ளது, அது எப்படிப் பயன்படுகிறது எனக் கேட்கலாம்;' },
            { en: 'correct or update inaccurate details;', ta: 'தவறான விவரங்களைத் திருத்தலாம் அல்லது புதுப்பிக்கலாம்;' },
            { en: 'ask us to erase data we are no longer required by law to keep;', ta: 'சட்டப்படி வைத்திருக்கத் தேவையில்லாத தரவை நீக்கக் கோரலாம்;' },
            { en: 'withdraw consent at any time — for example, to portfolio use or WhatsApp updates;', ta: 'எப்போது வேண்டுமானாலும் ஒப்புதலைத் திரும்பப் பெறலாம் — உதாரணமாக, போர்ட்ஃபோலியோ பயன்பாடு அல்லது வாட்ஸ்அப் அறிவிப்புகள்;' },
            { en: 'nominate someone to exercise these rights on your behalf;', ta: 'உங்கள் சார்பில் இவ்வுரிமைகளைப் பயன்படுத்த ஒருவரை நியமிக்கலாம்;' },
            { en: 'raise a grievance with us and, if it is not resolved, with the Data Protection Board of India.', ta: 'எங்களிடம் குறை தெரிவிக்கலாம்; தீர்வு கிடைக்காவிட்டால் இந்தியத் தரவுப் பாதுகாப்பு வாரியத்தை அணுகலாம்.' },
          ],
        },
        { p: { en: 'We respond to every request within 30 days.', ta: 'ஒவ்வொரு கோரிக்கைக்கும் 30 நாட்களுக்குள் பதிலளிப்போம்.' } },
      ],
    },
    {
      id: 'cookies',
      title: { en: 'Cookies & local storage', ta: 'குக்கீகள் & உள்ளூர் சேமிப்பு' },
      blocks: [
        {
          p: {
            en: 'We do not use advertising or tracking cookies. This website uses your browser’s local storage to remember your language, your booking draft, your sign-in session and whether you have seen the welcome prompt. You can clear it at any time from your browser settings.',
            ta: 'விளம்பர அல்லது கண்காணிப்புக் குக்கீகளை நாங்கள் பயன்படுத்துவதில்லை. உங்கள் மொழி, பதிவு வரைவு, உள்நுழைவு அமர்வு, வரவேற்புச் சாளரத்தைப் பார்த்தீர்களா என்பது ஆகியவற்றை நினைவில் வைக்க, இந்த இணையதளம் உங்கள் உலாவியின் உள்ளூர் சேமிப்பைப் பயன்படுத்துகிறது. உலாவி அமைப்புகளில் எப்போது வேண்டுமானாலும் அதை அழிக்கலாம்.',
          },
        },
        {
          p: {
            en: 'The Google Maps embed on our Contact page and Google Fonts may set their own cookies or log your IP address under Google’s policies.',
            ta: 'எங்கள் தொடர்புப் பக்கத்தில் உள்ள Google Maps வரைபடமும் Google Fonts-உம், Google-இன் கொள்கைகளின்படி தங்களின் குக்கீகளை அமைக்கலாம் அல்லது உங்கள் IP முகவரியைப் பதிவு செய்யலாம்.',
          },
        },
      ],
    },
    {
      id: 'children',
      title: { en: 'Children', ta: 'குழந்தைகள்' },
      blocks: [
        {
          p: {
            en: 'Many of our ceremonies centre on children. Their images are collected only through their parents or guardians, who make every decision about sharing, and are never published without explicit written consent.',
            ta: 'எங்கள் பல விழாக்கள் குழந்தைகளை மையமாகக் கொண்டவை. அவர்களின் படங்கள் பெற்றோர் அல்லது பாதுகாவலர் வழியாக மட்டுமே சேகரிக்கப்படுகின்றன; பகிர்வது குறித்த ஒவ்வொரு முடிவும் அவர்களுடையதே. வெளிப்படையான எழுத்துப்பூர்வ ஒப்புதல் இன்றி ஒருபோதும் வெளியிடப்படாது.',
          },
        },
      ],
    },
    {
      id: 'security',
      title: { en: 'Security', ta: 'பாதுகாப்பு' },
      blocks: [
        {
          p: {
            en: 'Data travels over HTTPS, access to client records is limited to staff who need it and protected by two-step sign-in, and devices holding original files are encrypted. No system is perfectly secure; if a breach affects you, we will inform you and the Data Protection Board as the law requires.',
            ta: 'தரவு HTTPS வழியாகப் பரிமாறப்படுகிறது; வாடிக்கையாளர் பதிவுகளை அணுகும் உரிமை தேவையுள்ள பணியாளர்களுக்கு மட்டும், இரு-படி உள்நுழைவுப் பாதுகாப்புடன்; மூலக் கோப்புகள் உள்ள சாதனங்கள் மறையாக்கம் செய்யப்பட்டவை. எந்த அமைப்பும் முழுமையாகப் பாதுகாப்பானதல்ல; தரவு மீறல் உங்களைப் பாதித்தால், சட்டப்படி உங்களுக்கும் தரவுப் பாதுகாப்பு வாரியத்திற்கும் தெரிவிப்போம்.',
          },
        },
      ],
    },
    {
      id: 'changes',
      title: { en: 'Changes to this policy', ta: 'இக்கொள்கையில் மாற்றங்கள்' },
      blocks: [
        {
          p: {
            en: 'When we make significant changes, we update the date at the top of this page and, for active clients, send a short note on WhatsApp.',
            ta: 'முக்கிய மாற்றங்கள் செய்யும்போது, இப்பக்கத்தின் மேலுள்ள தேதியைப் புதுப்பித்து, நடப்பு வாடிக்கையாளர்களுக்கு வாட்ஸ்அப்பில் ஒரு சிறு குறிப்பையும் அனுப்புவோம்.',
          },
        },
      ],
    },
    {
      id: 'contact',
      title: { en: 'Contact & grievance officer', ta: 'தொடர்பு & குறைதீர் அலுவலர்' },
      blocks: [
        {
          p: {
            en: 'For privacy questions, requests or complaints, write to our Grievance Officer — the Studio Manager — at the address below, mentioning “Privacy” in the subject.',
            ta: 'தனியுரிமை குறித்த கேள்விகள், கோரிக்கைகள், புகார்களுக்கு, எங்கள் குறைதீர் அலுவலரான ஸ்டுடியோ மேலாளருக்கு, தலைப்பில் “தனியுரிமை” எனக் குறிப்பிட்டு, கீழுள்ள முகவரியில் எழுதுங்கள்.',
          },
        },
        { contact: true },
      ],
    },
  ],
}
