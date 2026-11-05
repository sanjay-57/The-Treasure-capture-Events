import type { EventKey } from './data'
import type { Bi } from './i18n'

/*
 * Pose library — the studio's shot guide that clients rate before the shoot.
 *
 * Every pose has bilingual "how to pose" steps and an illustration served
 * from public/poses/<id>.svg (vector scenes with faceless figures, drawn
 * for this guide). Common poses go to everyone for the event; ritual poses
 * carry a faith tag that only the admin sees when choosing what to send.
 * Clients never see the tag. Commercial / ad shoots have no pose guide.
 */

export type Faith = 'hindu' | 'christian' | 'muslim'

export const FAITHS: { key: Faith; label: Bi; note: Bi }[] = [
  { key: 'hindu', label: { en: 'Hindu rituals', ta: 'இந்து சடங்குகள்' }, note: { en: 'Thaali, maalai maatral, oonjal, aarathi', ta: 'தாலி, மாலை மாற்றல், ஊஞ்சல், ஆரத்தி' } },
  { key: 'christian', label: { en: 'Christian rituals', ta: 'கிறிஸ்தவ சடங்குகள்' }, note: { en: 'Aisle, vows, veil, baptism', ta: 'நடைபாதை, உறுதிமொழி, முக்காடு, ஞானஸ்நானம்' } },
  { key: 'muslim', label: { en: 'Muslim rituals', ta: 'இஸ்லாமிய சடங்குகள்' }, note: { en: 'Nikah, aarsi mushaf, dua, mehndi', ta: 'நிக்காஹ், ஆர்சி முஷஃப், துஆ, மெஹந்தி' } },
]

export type Who = 'her' | 'him' | 'both' | 'you' | 'child' | 'baby' | 'family' | 'parents' | 'elders' | 'group' | 'team'
export const WHO: Record<Who, Bi> = {
  her: { en: 'For her', ta: 'அவளுக்கு' },
  him: { en: 'For him', ta: 'அவனுக்கு' },
  both: { en: 'For both', ta: 'இருவருக்கும்' },
  you: { en: 'For you', ta: 'உங்களுக்கு' },
  child: { en: 'For the child', ta: 'குழந்தைக்கு' },
  baby: { en: 'For the baby', ta: 'பாப்பாவுக்கு' },
  family: { en: 'For the family', ta: 'குடும்பத்தினருக்கு' },
  parents: { en: 'For the parents', ta: 'பெற்றோருக்கு' },
  elders: { en: 'For the elders', ta: 'பெரியவர்களுக்கு' },
  group: { en: 'For the group', ta: 'குழுவினருக்கு' },
  team: { en: 'For the team', ta: 'அணிக்கு' },
}

export interface PoseDef {
  id: string
  title: Bi
  events: EventKey[]
  /** Ritual set this pose belongs to; undefined = common to everyone. */
  faith?: Faith
  steps: { who: Who; text: Bi }[]
  /** Useful items to keep ready. */
  props?: Bi
}

/** Events that get a pose guide (everything except commercial / ad shoots). */
export const POSE_EVENTS: EventKey[] = ['wedding', 'engagement', 'reception', 'puberty', 'earpiercing', 'naming', 'birthday', 'babyshower', 'babyshoot', 'prewedding', 'outdoor', 'model', 'corporate']

const st = (who: Who, en: string, ta: string) => ({ who, text: { en, ta } })
const bi = (en: string, ta: string): Bi => ({ en, ta })

// ─── Library ─────────────────────────────────────────────────────────────────

export const POSES: PoseDef[] = [
  // ── Wedding ──────────────────────────────────────────────────────────────
  {
    id: 'wed-first-look', events: ['wedding', 'reception'],
    title: bi('The first look', 'முதல் பார்வை'),
    steps: [st('him', 'Stand facing away, hands relaxed. Turn slowly only when she taps your shoulder.', 'திரும்பி நில்லுங்கள். அவள் தோளைத் தொட்டதும் மெதுவாகத் திரும்புங்கள்.'), st('her', 'Walk up softly behind him and rest your hand on his shoulder.', 'மெதுவாகப் பின்னால் வந்து அவன் தோளில் கை வையுங்கள்.')],
  },
  {
    id: 'wed-forehead', events: ['wedding', 'engagement', 'reception'],
    title: bi('Forehead kiss', 'நெற்றி முத்தம்'),
    steps: [st('him', 'Cup her face gently in both hands and kiss her forehead.', 'அவள் முகத்தை இரு கைகளால் மென்மையாகப் பிடித்து நெற்றியில் முத்தமிடுங்கள்.'), st('her', 'Close your eyes and rest your hands on his chest.', 'கண்களை மூடி, கைகளை அவன் மார்பில் வையுங்கள்.')],
  },
  {
    id: 'wed-walk', events: ['wedding', 'reception'],
    title: bi('Hand in hand', 'கைகோர்த்து நடை'),
    steps: [st('both', 'Walk slowly, fingers linked. Take small steps so the camera can follow.', 'விரல்களைக் கோர்த்து மெதுவாக நடங்கள். கேமரா பின்தொடர சிறிய அடிகள் வையுங்கள்.'), st('him', 'Look at her, not at the lens.', 'லென்ஸைப் பார்க்காமல் அவளைப் பாருங்கள்.'), st('her', 'Lift the pleats a little with your free hand.', 'மற்ற கையால் கொசுவத்தைச் சற்றுத் தூக்குங்கள்.')],
  },
  {
    id: 'wed-backhug', events: ['wedding', 'engagement', 'reception', 'prewedding'],
    title: bi('The back hug', 'பின்னால் இருந்து அணைப்பு'),
    steps: [st('him', 'Stand behind her, wrap your arms around her waist, chin near her shoulder.', 'அவள் பின்னால் நின்று இடுப்பைச் சுற்றி அணைத்து, தாடையை அவள் தோளருகே வையுங்கள்.'), st('her', 'Rest your hands over his and lean back into him.', 'உங்கள் கைகளை அவன் கைகள் மேல் வைத்து அவன் மீது சாய்ந்து கொள்ளுங்கள்.')],
  },
  {
    id: 'wed-royal', events: ['wedding', 'reception', 'engagement'],
    title: bi('Royal portrait', 'ராஜ கம்பீரம்'),
    steps: [st('her', 'Sit tall, hands folded in your lap, pallu spread over the knee.', 'நிமிர்ந்து அமருங்கள், கைகள் மடியில், முந்தானை முழங்கால் மேல் விரிந்திருக்கட்டும்.'), st('him', 'Stand at her side, one hand on the chair back, chin up.', 'அவள் அருகே நின்று ஒரு கையை நாற்காலியின் பின்புறம் வையுங்கள், தலை நிமிர்ந்து.')],
    props: bi('A carved chair', 'செதுக்கிய நாற்காலி'),
  },
  {
    id: 'wed-family', events: ['wedding', 'engagement', 'reception', 'naming', 'puberty'],
    title: bi('Family portrait', 'குடும்பப் படம்'),
    steps: [st('family', 'Stand close, shoulders angled in towards the centre.', 'நெருக்கமாக நின்று, தோள்களை நடுவை நோக்கித் திருப்புங்கள்.'), st('both', 'Stay in the centre; parents on either side.', 'நீங்கள் நடுவில்; பெற்றோர் இருபுறமும்.')],
  },
  {
    id: 'wed-bride-shoulder', events: ['wedding', 'reception', 'engagement'],
    title: bi('Over the shoulder', 'தோள் வழிப் பார்வை'),
    steps: [st('her', 'Turn your back to the camera, then look back over your shoulder. Let the pallu fall freely.', 'கேமராவுக்கு முதுகைக் காட்டி, தோள் வழியாகத் திரும்பிப் பாருங்கள். முந்தானை சுதந்திரமாகத் தொங்கட்டும்.')],
  },
  {
    id: 'wed-groom-solo', events: ['wedding', 'reception'],
    title: bi('The groom, ready', 'தயாரான மணமகன்'),
    steps: [st('him', 'Adjust your collar or angavastram, eyes down, a half smile.', 'காலரையோ அங்கவஸ்திரத்தையோ சரிசெய்யுங்கள், கண்கள் கீழே, சிறு புன்னகை.')],
  },
  {
    id: 'wed-girls', events: ['wedding', 'reception', 'engagement', 'babyshower'],
    title: bi('Her girls', 'தோழிகளுடன்'),
    steps: [st('her', 'Stand in the middle, hands together at the waist.', 'நடுவில் நின்று, கைகளை இடுப்பில் சேர்த்து வையுங்கள்.'), st('group', 'Lean in, one hand on her shoulder, and laugh at the same joke.', 'அவள் பக்கம் சாய்ந்து, ஒரு கையை அவள் தோளில் வைத்து, ஒன்றாகச் சிரியுங்கள்.')],
  },
  {
    id: 'wed-foreheads', events: ['wedding', 'engagement', 'prewedding'],
    title: bi('Foreheads together', 'நெற்றியோடு நெற்றி'),
    steps: [st('both', 'Face each other, touch foreheads and close your eyes. Hold both hands low between you.', 'ஒருவரை ஒருவர் பார்த்து நெற்றிகளைத் தொட்டு கண்களை மூடுங்கள். இரு கைகளையும் கீழே கோர்த்துக் கொள்ளுங்கள்.')],
  },

  // Hindu wedding rituals
  {
    id: 'wed-thaali', events: ['wedding'], faith: 'hindu',
    title: bi('Tying the thaali', 'தாலி கட்டும் தருணம்'),
    steps: [st('her', 'Sit facing the camera, head slightly bowed, palms joined.', 'கேமராவை நோக்கி அமர்ந்து, தலை சற்றுக் குனிந்து, கைகளைக் கூப்புங்கள்.'), st('him', 'Stand behind her and tie the knot with elbows wide so the thaali stays visible.', 'அவள் பின்னால் நின்று முழங்கைகளை அகலமாக வைத்து முடிச்சிடுங்கள், தாலி தெரிய வேண்டும்.'), st('elders', 'Hold the thaali plate close; keep flowers ready to shower.', 'தாலித் தட்டை அருகில் பிடித்து, பூக்களைத் தூவத் தயாராக இருங்கள்.')],
    props: bi('Thaali on a plate, flowers, akshathai', 'தட்டில் தாலி, பூ, அட்சதை'),
  },
  {
    id: 'wed-maalai', events: ['wedding'], faith: 'hindu',
    title: bi('Garland exchange', 'மாலை மாற்றல்'),
    steps: [st('both', 'Face each other and lift the garland high, as if about to place it.', 'ஒருவரை ஒருவர் பார்த்து, மாலையைப் போடப் போவது போல் உயரத் தூக்குங்கள்.'), st('her', 'Rise slightly on your toes and smile at him.', 'கால் விரல்களில் சற்று உயர்ந்து அவனைப் பார்த்துச் சிரியுங்கள்.')],
    props: bi('Two garlands', 'இரண்டு மாலைகள்'),
  },
  {
    id: 'wed-agni', events: ['wedding'], faith: 'hindu',
    title: bi('Walking around the fire', 'அக்னி வலம்'),
    steps: [st('him', 'Lead the way, holding her little finger.', 'அவள் சுண்டு விரலைப் பிடித்தபடி முன்னால் செல்லுங்கள்.'), st('her', 'Follow half a step behind, eyes on the fire.', 'அரை அடி பின்னால், கண்கள் அக்னியின் மீது.')],
    props: bi('Homam kundam', 'ஹோம குண்டம்'),
  },
  {
    id: 'wed-metti', events: ['wedding'], faith: 'hindu',
    title: bi('Slipping on the metti', 'மெட்டி அணிவித்தல்'),
    steps: [st('him', 'Kneel on one knee and slip the metti onto her toe.', 'ஒரு முழங்காலில் அமர்ந்து அவள் கால் விரலில் மெட்டி அணிவியுங்கள்.'), st('her', 'Sit on a low stool, one hand on his shoulder, looking down at him.', 'தாழ்வான மனையில் அமர்ந்து, ஒரு கையை அவன் தோளில் வைத்து அவனைப் பாருங்கள்.')],
    props: bi('Metti, a low manai', 'மெட்டி, மனை'),
  },
  {
    id: 'wed-kanyadaanam', events: ['wedding'], faith: 'hindu',
    title: bi('Kanyadaanam', 'கன்னிகாதானம்'),
    steps: [st('parents', 'Father places her hand into the groom’s open palm; mother rests her hand on top.', 'தந்தை மகளின் கையை மணமகனின் உள்ளங்கையில் வைக்க, தாய் மேலே கை வைக்கட்டும்.'), st('both', 'Look at your joined hands, not the camera.', 'கேமராவைப் பார்க்காமல் இணைந்த கைகளைப் பாருங்கள்.')],
    props: bi('Coconut, betel leaves, water', 'தேங்காய், வெற்றிலை, நீர்'),
  },
  {
    id: 'wed-oonjal', events: ['wedding'], faith: 'hindu',
    title: bi('On the oonjal', 'ஊஞ்சல்'),
    steps: [st('both', 'Sit side by side on the swing, fingers linked on your laps.', 'ஊஞ்சலில் அருகருகே அமர்ந்து மடியில் விரல்களைக் கோர்த்துக் கொள்ளுங்கள்.'), st('elders', 'Rock the swing gently and circle the coloured rice balls.', 'ஊஞ்சலை மெதுவாக ஆட்டி, வண்ணச் சோற்று உருண்டைகளைச் சுற்றுங்கள்.')],
    props: bi('Decorated swing, rice balls', 'அலங்கார ஊஞ்சல், சோற்று உருண்டைகள்'),
  },
  {
    id: 'wed-akshathai', events: ['wedding'], faith: 'hindu',
    title: bi('Elders’ blessing', 'பெரியோர் ஆசி'),
    steps: [st('both', 'Sit cross-legged, palms joined, heads slightly bowed.', 'சம்மணமிட்டு அமர்ந்து, கைகூப்பி, தலை சற்றுக் குனிந்து.'), st('elders', 'Stand behind and shower akshathai over both heads.', 'பின்னால் நின்று இருவர் தலையிலும் அட்சதை தூவுங்கள்.')],
    props: bi('Akshathai (turmeric rice)', 'அட்சதை'),
  },

  // Christian wedding rituals
  {
    id: 'wed-aisle', events: ['wedding'], faith: 'christian',
    title: bi('Down the aisle', 'நடைபாதையில்'),
    steps: [st('her', 'Hold your father’s arm, bouquet low at your waist.', 'தந்தையின் கையைப் பிடித்து, பூங்கொத்தை இடுப்பளவில் வையுங்கள்.'), st('parents', 'Walk on her side, looking ahead, slow and steady.', 'அவள் அருகே, முன்னோக்கிப் பார்த்து, நிதானமாக நடங்கள்.')],
    props: bi('Bouquet', 'பூங்கொத்து'),
  },
  {
    id: 'wed-vows', events: ['wedding'], faith: 'christian',
    title: bi('Saying the vows', 'திருமண உறுதிமொழி'),
    steps: [st('both', 'Face each other and hold both hands at waist height.', 'ஒருவரை ஒருவர் பார்த்து இரு கைகளையும் இடுப்பளவில் பிடித்துக் கொள்ளுங்கள்.'), st('him', 'Look into her eyes as you speak.', 'பேசும்போது அவள் கண்களைப் பாருங்கள்.')],
  },
  {
    id: 'wed-ring', events: ['wedding', 'engagement'], faith: 'christian',
    title: bi('The ring', 'மோதிரம் அணிவித்தல்'),
    steps: [st('him', 'Hold her hand from below and slide the ring on slowly.', 'அவள் கையைக் கீழிருந்து பிடித்து மெதுவாக மோதிரம் அணிவியுங்கள்.'), st('her', 'Keep the hand relaxed, fingers slightly apart.', 'கையைத் தளர்வாக, விரல்கள் சற்று விலகி இருக்கட்டும்.')],
    props: bi('Rings', 'மோதிரங்கள்'),
  },
  {
    id: 'wed-veil', events: ['wedding'], faith: 'christian',
    title: bi('Lifting the veil', 'முக்காடு விலக்குதல்'),
    steps: [st('him', 'Lift the veil with both hands, slowly, then pause.', 'இரு கைகளாலும் முக்காட்டை மெதுவாகத் தூக்கி, ஒரு கணம் நில்லுங்கள்.'), st('her', 'Chin slightly up, eyes on him.', 'தாடை சற்று மேலே, கண்கள் அவன் மீது.')],
  },
  {
    id: 'wed-church-steps', events: ['wedding'], faith: 'christian',
    title: bi('Petals on the steps', 'படிகளில் மலர் மழை'),
    steps: [st('both', 'Stand two steps up and raise your joined hands with the bouquet.', 'இரண்டு படிகள் மேலே நின்று, பூங்கொத்துடன் இணைந்த கைகளை உயர்த்துங்கள்.'), st('group', 'Throw petals together on the count of three.', 'மூன்று எண்ணியதும் ஒன்றாக மலர் தூவுங்கள்.')],
    props: bi('Petals for guests', 'விருந்தினருக்கு மலர் இதழ்கள்'),
  },

  // Muslim wedding rituals
  {
    id: 'wed-nikah', events: ['wedding'], faith: 'muslim',
    title: bi('Signing the nikahnama', 'நிக்காஹ்நாமா கையெழுத்து'),
    steps: [st('her', 'Sit with the dupatta over your head, pen resting on the papers.', 'துப்பட்டாவைத் தலையில் போட்டு அமர்ந்து, பேனாவைத் தாளின் மேல் வையுங்கள்.'), st('parents', 'Mother stands behind, a hand on her shoulder.', 'தாய் பின்னால் நின்று அவள் தோளில் கை வைக்கட்டும்.')],
    props: bi('Nikahnama, pen', 'நிக்காஹ்நாமா, பேனா'),
  },
  {
    id: 'wed-aarsi', events: ['wedding'], faith: 'muslim',
    title: bi('Aarsi mushaf', 'ஆர்சி முஷஃப்'),
    steps: [st('both', 'Sit close under the dupatta canopy and look at each other in the mirror.', 'துப்பட்டா விதானத்தின் கீழ் நெருக்கமாக அமர்ந்து கண்ணாடியில் ஒருவரை ஒருவர் பாருங்கள்.'), st('group', 'Hold the dupatta high over both heads.', 'துப்பட்டாவை இருவர் தலைக்கு மேலே உயர்த்திப் பிடியுங்கள்.')],
    props: bi('Hand mirror, a long dupatta', 'கைக்கண்ணாடி, நீண்ட துப்பட்டா'),
  },
  {
    id: 'wed-dua', events: ['wedding', 'engagement'], faith: 'muslim',
    title: bi('Dua together', 'சேர்ந்து துஆ'),
    steps: [st('both', 'Sit side by side, palms raised and open, eyes lowered.', 'அருகருகே அமர்ந்து, உள்ளங்கைகளை உயர்த்தித் திறந்து, கண்களைத் தாழ்த்துங்கள்.')],
  },
  {
    id: 'wed-mehndi', events: ['wedding', 'engagement'], faith: 'muslim',
    title: bi('Mehndi hands', 'மெஹந்தி கைகள்'),
    steps: [st('her', 'Hold both palms open at chin height and gaze down at your mehndi.', 'இரு உள்ளங்கைகளையும் தாடையளவில் திறந்து, மெஹந்தியைப் பாருங்கள்.')],
  },
  {
    id: 'wed-rukhsati', events: ['wedding'], faith: 'muslim',
    title: bi('Farewell embrace', 'பிரியா விடை'),
    steps: [st('her', 'Hug your mother tight, head on her shoulder.', 'தாயை இறுக அணைத்து, தலையை அவள் தோளில் சாயுங்கள்.'), st('parents', 'Hold her close, one hand on her head.', 'அவளை அணைத்து, ஒரு கையை அவள் தலையில் வையுங்கள்.')],
  },

  {
    id: 'wed-elegant', events: ['wedding', 'reception', 'engagement'],
    title: bi('Elegant couple', 'நேர்த்தியான ஜோடி'),
    steps: [st('her', 'Stand slightly angled to him, weight on the back foot, bouquet held low at the waist.', 'அவனை நோக்கிச் சற்று சாய்ந்து நில்லுங்கள், எடை பின்காலில், பூங்கொத்து இடுப்பளவில்.'), st('him', 'Stand tall beside her, one hand resting lightly at her back, chin level.', 'அவள் அருகே நிமிர்ந்து நின்று, ஒரு கையை அவள் முதுகில் மென்மையாக வையுங்கள், தாடை நேராக.')],
    props: bi('Bouquet', 'பூங்கொத்து'),
  },
  {
    id: 'wed-chair', events: ['wedding', 'reception', 'engagement'],
    title: bi('Couple on the chair', 'நாற்காலியில் ஜோடி'),
    steps: [st('her', 'Stand by the chair, rest your elbow on the backrest and hold the bouquet low.', 'நாற்காலி அருகே நின்று, முழங்கையை அதன் பின்புறத்தில் ஊன்றி, பூங்கொத்தைக் கீழே பிடியுங்கள்.'), st('him', 'Sit on the chair, one hand on her arm, and look up at her — not the camera.', 'நாற்காலியில் அமர்ந்து, ஒரு கையை அவள் கையில் வைத்து, கேமராவை அல்ல அவளை அண்ணாந்து பாருங்கள்.')],
    props: bi('Chair, wedding bouquet', 'நாற்காலி, திருமணப் பூங்கொத்து'),
  },
  {
    id: 'wed-embrace', events: ['wedding', 'reception', 'engagement', 'prewedding'],
    title: bi('Romantic embrace', 'காதல் அணைப்பு'),
    steps: [st('her', 'Hug him with both arms around his neck and tuck your head under his chin.', 'இரு கைகளாலும் அவன் கழுத்தைச் சுற்றி அணைத்து, தலையை அவன் தாடைக்குக் கீழ் வையுங்கள்.'), st('him', 'Hold her close at the waist, eyes closed, and breathe out.', 'இடுப்பில் அணைத்து, கண்களை மூடி, மெதுவாக மூச்சு விடுங்கள்.')],
  },

  // ── Engagement ───────────────────────────────────────────────────────────
  {
    id: 'eng-rings', events: ['engagement'],
    title: bi('Show the rings', 'மோதிரங்களைக் காட்டுங்கள்'),
    steps: [st('both', 'Stand close and hold your ring hands up together towards the camera.', 'நெருக்கமாக நின்று மோதிரக் கைகளை ஒன்றாகக் கேமராவை நோக்கி உயர்த்துங்கள்.'), st('both', 'Big smiles, heads tilted in.', 'பெரிய புன்னகை, தலைகள் உள்நோக்கிச் சாய்ந்து.')],
    props: bi('Both rings on', 'இரு மோதிரங்களும் அணிந்து'),
  },
  {
    id: 'eng-ring-on', events: ['engagement'],
    title: bi('Putting on the ring', 'மோதிரம் அணிவித்தல்'),
    steps: [st('her', 'Slide the ring on his finger, eyes on his hand.', 'அவன் விரலில் மோதிரம் அணிவியுங்கள், கண்கள் அவன் கையில்.'), st('him', 'Hold your hand out steady and look at her.', 'கையை அசையாமல் நீட்டி அவளைப் பாருங்கள்.')],
  },
  {
    id: 'eng-shoulder', events: ['engagement', 'prewedding', 'reception'],
    title: bi('Head on his shoulder', 'அவன் தோளில் தலை'),
    steps: [st('both', 'Sit close on the sofa, hands linked on his knee.', 'சோபாவில் நெருக்கமாக அமர்ந்து, அவன் முழங்காலில் கைகளைக் கோர்த்துக் கொள்ளுங்கள்.'), st('her', 'Rest your head on his shoulder and look at the camera.', 'அவன் தோளில் தலை சாய்த்து கேமராவைப் பாருங்கள்.')],
  },
  {
    id: 'eng-laugh', events: ['engagement', 'prewedding'],
    title: bi('Shared laugh', 'சேர்ந்து சிரிப்பு'),
    steps: [st('both', 'Stand close, share a private joke and laugh for real.', 'நெருக்கமாக நின்று, ஒரு ரகசிய நகைச்சுவை சொல்லி உண்மையாகச் சிரியுங்கள்.'), st('him', 'Hands at her waist.', 'கைகள் அவள் இடுப்பில்.')],
  },
  {
    id: 'eng-thamboolam', events: ['engagement'], faith: 'hindu',
    title: bi('Exchanging thamboolam', 'தாம்பூலம் மாற்றுதல்'),
    steps: [st('parents', 'Both fathers face each other holding plates of betel, fruit and flowers.', 'இரு தந்தையரும் வெற்றிலை, பழம், பூ தட்டுகளுடன் ஒருவரை ஒருவர் பார்க்கட்டும்.'), st('both', 'Stand between them, palms joined, smiling.', 'நடுவில் கைகூப்பிச் சிரித்தபடி நில்லுங்கள்.')],
    props: bi('Two thamboolam plates', 'இரண்டு தாம்பூலத் தட்டுகள்'),
  },
  {
    id: 'eng-promise', events: ['engagement'], faith: 'christian',
    title: bi('Blessing the rings', 'மோதிர ஆசீர்வாதம்'),
    steps: [st('both', 'Hold hands over the open ring box, heads bowed for the blessing.', 'திறந்த மோதிரப் பெட்டியின் மேல் கைகளைப் பிடித்து, ஆசீர்வாதத்திற்குத் தலை குனியுங்கள்.')],
    props: bi('Ring box', 'மோதிரப் பெட்டி'),
  },
  {
    id: 'eng-bangles', events: ['engagement'], faith: 'muslim',
    title: bi('Bangles from his mother', 'மாமியாரின் வளையல்'),
    steps: [st('elders', 'His mother slips the bangles onto her wrist.', 'அவன் தாய் அவள் மணிக்கட்டில் வளையல் அணிவிக்கட்டும்.'), st('her', 'Hold your hand out and look at the bangles, not the lens.', 'கையை நீட்டி, லென்ஸை அல்ல வளையல்களைப் பாருங்கள்.')],
    props: bi('Bangle tray', 'வளையல் தட்டு'),
  },

  // ── Reception ────────────────────────────────────────────────────────────
  {
    id: 'rec-entry', events: ['reception'],
    title: bi('Grand entry', 'கம்பீர வருகை'),
    steps: [st('both', 'Walk in hand in hand, free hands holding sparklers high.', 'கைகோர்த்து நடந்து வாருங்கள், மற்ற கைகளில் மத்தாப்பு உயர்ந்திருக்கட்டும்.'), st('both', 'Pause at the centre and look at each other.', 'நடுவில் நின்று ஒருவரை ஒருவர் பாருங்கள்.')],
    props: bi('Cold pyro or sparklers', 'கோல்ட் பைரோ அல்லது மத்தாப்பு'),
  },
  {
    id: 'rec-twirl', events: ['reception', 'prewedding'],
    title: bi('The twirl', 'சுழற்றல்'),
    steps: [st('him', 'Raise her hand above her head and turn her once.', 'அவள் கையைத் தலைக்கு மேல் உயர்த்தி ஒருமுறை சுழற்றுங்கள்.'), st('her', 'Let the lehenga flare and look back at him mid-spin.', 'லெஹங்கா விரியட்டும், சுழலும்போது அவனைத் திரும்பிப் பாருங்கள்.')],
  },
  {
    id: 'rec-cake', events: ['reception', 'engagement', 'birthday'],
    title: bi('Cutting the cake', 'கேக் வெட்டுதல்'),
    steps: [st('both', 'Hold the knife together, his hand over hers.', 'கத்தியை ஒன்றாகப் பிடியுங்கள், அவன் கை அவள் கை மேல்.'), st('both', 'Look at each other just as the knife goes in.', 'கத்தி இறங்கும் கணம் ஒருவரை ஒருவர் பாருங்கள்.')],
    props: bi('Cake, ribbon knife', 'கேக், ரிப்பன் கத்தி'),
  },
  {
    id: 'rec-stage', events: ['reception', 'engagement'],
    title: bi('Stage portrait', 'மேடைப் படம்'),
    steps: [st('her', 'Slip your hand through his arm, shoulders angled in.', 'அவன் கையில் உங்கள் கையைக் கோர்த்து, தோள்களை உள்நோக்கித் திருப்புங்கள்.'), st('him', 'Stand tall, free hand relaxed at your side.', 'நிமிர்ந்து நில்லுங்கள், மற்ற கை தளர்வாகப் பக்கவாட்டில்.')],
  },
  {
    id: 'rec-dip', events: ['reception', 'prewedding'],
    title: bi('The dip', 'சாய்த்துப் பிடித்தல்'),
    steps: [st('him', 'Support her back with one arm and lean her gently backwards.', 'ஒரு கையால் அவள் முதுகைத் தாங்கி மெதுவாகப் பின்னால் சாய்த்துப் பிடியுங்கள்.'), st('her', 'Arch your back, one arm around his neck.', 'முதுகை வளைத்து, ஒரு கையை அவன் கழுத்தைச் சுற்றி வையுங்கள்.')],
  },
  {
    id: 'rec-friends', events: ['reception', 'birthday'],
    title: bi('Friends’ cheer', 'நண்பர்களின் ஆரவாரம்'),
    steps: [st('group', 'Gather behind the couple and throw your arms up together.', 'தம்பதிக்குப் பின்னால் கூடி ஒன்றாகக் கைகளை உயர்த்துங்கள்.'), st('both', 'Lean into each other and laugh.', 'ஒருவர் மீது ஒருவர் சாய்ந்து சிரியுங்கள்.')],
  },

  // ── Puberty ceremony ─────────────────────────────────────────────────────
  {
    id: 'pub-portrait', events: ['puberty'],
    title: bi('Seated portrait', 'அமர்ந்த உருவப்படம்'),
    steps: [st('you', 'Sit tall, hands resting in your lap, chin slightly down, eyes to the lens.', 'நிமிர்ந்து அமர்ந்து, கைகள் மடியில், தாடை சற்றுக் கீழே, கண்கள் லென்ஸில்.')],
    props: bi('Garland, a decorated chair', 'மாலை, அலங்கார நாற்காலி'),
  },
  {
    id: 'pub-mirror', events: ['puberty'],
    title: bi('Mirror moment', 'கண்ணாடி முன்'),
    steps: [st('you', 'Hold the mirror at chest height and adjust your jhumka with the other hand.', 'கண்ணாடியை மார்பளவில் பிடித்து, மறு கையால் ஜிமிக்கியைச் சரிசெய்யுங்கள்.')],
    props: bi('Hand mirror', 'கைக்கண்ணாடி'),
  },
  {
    id: 'pub-parents', events: ['puberty', 'birthday'],
    title: bi('With amma and appa', 'அம்மா அப்பாவுடன்'),
    steps: [st('parents', 'Stand behind her chair, a hand each on her shoulders.', 'நாற்காலியின் பின்னால் நின்று, ஆளுக்கு ஒரு கையை அவள் தோளில் வையுங்கள்.'), st('you', 'Sit straight and smile softly.', 'நேராக அமர்ந்து மென்மையாகச் சிரியுங்கள்.')],
  },
  {
    id: 'pub-petals', events: ['puberty', 'naming', 'babyshower'],
    title: bi('Flower shower', 'மலர் மழை'),
    steps: [st('you', 'Look up and laugh as the petals fall.', 'மலர்கள் விழும்போது மேலே பார்த்துச் சிரியுங்கள்.'), st('family', 'Shower petals from above, all at once.', 'மேலிருந்து அனைவரும் ஒரே நேரத்தில் மலர் தூவுங்கள்.')],
    props: bi('Rose and marigold petals', 'ரோஜா, சாமந்தி இதழ்கள்'),
  },
  {
    id: 'pub-swing', events: ['puberty', 'birthday'],
    title: bi('Lounging on the bench', 'பெஞ்சில் சாய்ந்து'),
    steps: [st('you', 'Sit sideways on the bench, lean back on one arm and let the davani fall over the edge.', 'பெஞ்சில் பக்கவாட்டில் அமர்ந்து, ஒரு கையில் சாய்ந்து, தாவணி விளிம்பில் தொங்கட்டும்.')],
  },
  {
    id: 'pub-manjal', events: ['puberty'], faith: 'hindu',
    title: bi('Manjal neerattu', 'மஞ்சள் நீராட்டு'),
    steps: [st('you', 'Sit cross-legged, eyes closed, palms joined.', 'சம்மணமிட்டு, கண்களை மூடி, கைகூப்பி அமருங்கள்.'), st('elders', 'Pour the turmeric water slowly from the pot, over her head.', 'குடத்திலிருந்து மஞ்சள் நீரை மெதுவாக அவள் தலையில் ஊற்றுங்கள்.')],
    props: bi('Brass pot, turmeric water', 'பித்தளைக் குடம், மஞ்சள் நீர்'),
  },
  {
    id: 'pub-aarathi', events: ['puberty', 'babyshower'], faith: 'hindu',
    title: bi('Aarathi', 'ஆரத்தி'),
    steps: [st('elders', 'Two women circle the aarathi plate in front of her, together.', 'இரண்டு பெண்கள் ஒன்றாக அவள் முன் ஆரத்தித் தட்டைச் சுற்றட்டும்.'), st('you', 'Sit with palms joined, look at the flame.', 'கைகூப்பி அமர்ந்து தீபத்தைப் பாருங்கள்.')],
    props: bi('Aarathi plate with camphor', 'கற்பூர ஆரத்தித் தட்டு'),
  },
  {
    id: 'pub-maaman', events: ['puberty', 'earpiercing'], faith: 'hindu',
    title: bi('Gifts from thaai maaman', 'தாய்மாமன் சீர்'),
    steps: [st('elders', 'Uncle presents the seer tray with both hands.', 'தாய்மாமன் சீர்த் தட்டை இரு கைகளாலும் வழங்கட்டும்.'), st('you', 'Receive it with both hands and look up at him.', 'இரு கைகளாலும் பெற்றுக்கொண்டு அவரைப் பாருங்கள்.')],
    props: bi('Seer tray: silk, fruit, sweets', 'சீர்த் தட்டு: பட்டு, பழம், இனிப்பு'),
  },

  // ── Ear piercing ─────────────────────────────────────────────────────────
  {
    id: 'ear-lap', events: ['earpiercing'],
    title: bi('On maaman’s lap', 'மாமன் மடியில்'),
    steps: [st('elders', 'Sit cross-legged with the child on your lap, hands steady at the waist.', 'சம்மணமிட்டு குழந்தையை மடியில் அமர்த்தி, இடுப்பைப் பிடித்துக் கொள்ளுங்கள்.'), st('child', 'Hold a favourite toy or sweet to keep busy.', 'பிடித்த பொம்மையோ இனிப்போ கையில் இருக்கட்டும்.')],
    props: bi('A toy or sweet', 'பொம்மை அல்லது இனிப்பு'),
  },
  {
    id: 'ear-hug', events: ['earpiercing', 'naming', 'babyshoot'],
    title: bi('Comfort hug', 'ஆறுதல் அணைப்பு'),
    steps: [st('parents', 'Hold the child close on your hip, cheek to cheek.', 'குழந்தையை இடுப்பில் அணைத்து, கன்னத்தோடு கன்னம் வையுங்கள்.'), st('child', 'Head on amma’s shoulder.', 'அம்மாவின் தோளில் தலை.')],
  },
  {
    id: 'ear-earrings', events: ['earpiercing'],
    title: bi('New earrings', 'புதுக் கம்மல்'),
    steps: [st('child', 'Turn your head to show the earring, tuck the hair behind the ear.', 'கம்மல் தெரியத் தலையைத் திருப்பி, முடியைக் காதுக்குப் பின் ஒதுக்குங்கள்.')],
  },
  {
    id: 'ear-family', events: ['earpiercing', 'naming', 'birthday'],
    title: bi('Little one in front', 'நடுவில் செல்லம்'),
    steps: [st('child', 'Stand in front, hands on your tummy.', 'முன்னால் நின்று, கைகளை வயிற்றில் வையுங்கள்.'), st('parents', 'Kneel on either side, an arm around the child.', 'இருபுறமும் மண்டியிட்டு, குழந்தையைச் சுற்றிக் கை வையுங்கள்.')],
  },
  {
    id: 'ear-temple', events: ['earpiercing'], faith: 'hindu',
    title: bi('Sandal-paste smiles', 'சந்தனக் குளிர்ச்சி'),
    steps: [st('parents', 'Hold the child up at the temple door after the mottai and sandal paste.', 'மொட்டையும் சந்தனமும் முடிந்ததும் கோயில் வாசலில் குழந்தையைத் தூக்கிப் பிடியுங்கள்.'), st('child', 'A big grin for appa.', 'அப்பாவுக்கு ஒரு பெரிய சிரிப்பு.')],
  },

  // ── Naming ceremony ──────────────────────────────────────────────────────
  {
    id: 'nam-cradle', events: ['naming', 'babyshoot'],
    title: bi('Over the cradle', 'தொட்டில் அருகே'),
    steps: [st('parents', 'Lean over the cradle from both sides, hands on the rim.', 'இருபுறமும் தொட்டிலின் மேல் குனிந்து, கைகளை விளிம்பில் வையுங்கள்.'), st('baby', 'Asleep or awake, both are perfect.', 'தூங்கினாலும் விழித்தாலும் அழகுதான்.')],
    props: bi('Decorated cradle', 'அலங்காரத் தொட்டில்'),
  },
  {
    id: 'nam-lift', events: ['naming', 'babyshoot', 'outdoor'],
    title: bi('Lift to the sky', 'வானம் நோக்கி'),
    steps: [st('parents', 'Mother lifts the baby above her head; father looks up at the baby.', 'தாய் குழந்தையைத் தலைக்கு மேல் உயர்த்த, தந்தை மேலே பார்க்கட்டும்.')],
  },
  {
    id: 'nam-board', events: ['naming'],
    title: bi('The name board', 'பெயர்ப் பலகை'),
    steps: [st('parents', 'Sit together; mother holds the baby, father holds the name board in front.', 'அருகருகே அமருங்கள்; தாய் குழந்தையையும் தந்தை பெயர்ப் பலகையையும் முன்னால் பிடிக்கட்டும்.')],
    props: bi('Name slate or board', 'பெயர்ப் பலகை'),
  },
  {
    id: 'nam-grandparents', events: ['naming', 'babyshoot'],
    title: bi('Grandparents’ blessing', 'தாத்தா பாட்டி ஆசி'),
    steps: [st('elders', 'Grandmother cradles the baby; grandfather touches the baby’s forehead.', 'பாட்டி குழந்தையைத் தாங்க, தாத்தா நெற்றியைத் தொடட்டும்.')],
  },
  {
    id: 'nam-dad-arm', events: ['naming', 'babyshoot'],
    title: bi('In appa’s arms', 'அப்பாவின் கைகளில்'),
    steps: [st('parents', 'Cradle the baby along your forearm and look down, not at the lens.', 'குழந்தையை முன்கையில் தாங்கி, லென்ஸை அல்ல குழந்தையைப் பாருங்கள்.')],
  },
  {
    id: 'nam-rice', events: ['naming'], faith: 'hindu',
    title: bi('Writing the name in rice', 'அரிசியில் பெயர் எழுதுதல்'),
    steps: [st('parents', 'Father guides the baby’s finger through a plate of rice; mother holds the baby.', 'தந்தை குழந்தையின் விரலால் அரிசித் தட்டில் எழுத, தாய் குழந்தையைப் பிடிக்கட்டும்.')],
    props: bi('Plate of raw rice', 'பச்சரிசித் தட்டு'),
  },
  {
    id: 'nam-baptism', events: ['naming'], faith: 'christian',
    title: bi('At the font', 'ஞானஸ்நானத் தொட்டி அருகே'),
    steps: [st('elders', 'Godparent holds the baby in white over the font.', 'ஞானப் பெற்றோர் வெள்ளை உடையில் குழந்தையைத் தொட்டி மேல் பிடிக்கட்டும்.'), st('parents', 'Stand close on the other side, hands joined.', 'மறுபுறம் நெருக்கமாக நின்று கைகளைச் சேர்த்து வையுங்கள்.')],
  },
  {
    id: 'nam-azaan', events: ['naming'], faith: 'muslim',
    title: bi('Azaan in the ear', 'காதில் பாங்கு'),
    steps: [st('parents', 'Father holds the baby upright and softly recites into the right ear.', 'தந்தை குழந்தையை நிமிர்த்திப் பிடித்து வலது காதில் மெதுவாக ஓதட்டும்.')],
  },

  // ── Birthday ─────────────────────────────────────────────────────────────
  {
    id: 'bday-candles', events: ['birthday'],
    title: bi('Blow the candles', 'மெழுகுவர்த்தி ஊதுதல்'),
    steps: [st('child', 'Lean in and blow, cheeks puffed.', 'முன்னால் சாய்ந்து கன்னம் உப்ப ஊதுங்கள்.'), st('family', 'Gather close behind and clap.', 'பின்னால் நெருக்கமாக நின்று கை தட்டுங்கள்.')],
    props: bi('Cake with candles', 'மெழுகுவர்த்தியுடன் கேக்'),
  },
  {
    id: 'bday-smash', events: ['birthday', 'babyshoot'],
    title: bi('Cake smash', 'கேக் விளையாட்டு'),
    steps: [st('child', 'Sit on the floor with the cake; hands in, no rules.', 'கேக்குடன் தரையில் அமர்ந்து கைகளை விடுங்கள், கட்டுப்பாடு இல்லை.')],
    props: bi('Small smash cake, a sheet underneath', 'சிறிய கேக், கீழே விரிப்பு'),
  },
  {
    id: 'bday-fly', events: ['birthday', 'outdoor'],
    title: bi('Up, up and away', 'உயரே பற'),
    steps: [st('parents', 'Lift the child high above your head, arms straight.', 'குழந்தையைத் தலைக்கு மேலே உயரத் தூக்குங்கள், கைகள் நேராக.'), st('child', 'Arms out like wings.', 'கைகளை இறக்கைகளைப் போல விரியுங்கள்.')],
  },
  {
    id: 'bday-balloons', events: ['birthday'],
    title: bi('Balloon jump', 'பலூன் குதிப்பு'),
    steps: [st('child', 'Hold the balloons high and jump on three.', 'பலூன்களை உயர்த்திப் பிடித்து மூன்று எண்ணியதும் குதியுங்கள்.')],
  },
  {
    id: 'bday-gift', events: ['birthday'],
    title: bi('Lost in balloons', 'பலூன் கடலில்'),
    steps: [st('child', 'Lie back among the balloons, arms out, and look straight up at the camera.', 'பலூன்களுக்கு நடுவே படுத்து, கைகளை விரித்து, மேலே கேமராவைப் பாருங்கள்.')],
  },
  {
    id: 'bday-gang', events: ['birthday'],
    title: bi('The birthday gang', 'பிறந்தநாள் கூட்டம்'),
    steps: [st('group', 'Friends around the birthday star, everyone’s hands up.', 'பிறந்தநாள் நாயகரைச் சுற்றி நின்று அனைவரும் கைகளை உயர்த்துங்கள்.'), st('child', 'Stand in the middle and shout “Yay!”', 'நடுவில் நின்று “ஹே!” என்று கத்துங்கள்.')],
  },

  // ── Baby shower ──────────────────────────────────────────────────────────
  {
    id: 'bs-heart', events: ['babyshower', 'outdoor'],
    title: bi('Heart over the bump', 'வயிற்றில் இதயம்'),
    steps: [st('both', 'Stand side by side and make a heart with your hands over the bump.', 'அருகருகே நின்று கைகளால் வயிற்றின் மேல் இதய வடிவம் செய்யுங்கள்.')],
  },
  {
    id: 'bs-bangles', events: ['babyshower'],
    title: bi('Valaikappu bangles', 'வளைகாப்பு வளையல்'),
    steps: [st('elders', 'Women slip glass bangles onto both her wrists, one by one.', 'பெண்கள் ஒவ்வொருவராக அவள் இரு மணிக்கட்டிலும் கண்ணாடி வளையல் அணிவிக்கட்டும்.'), st('you', 'Sit with both hands held out, smiling at the bangles.', 'இரு கைகளையும் நீட்டி, வளையல்களைப் பார்த்துச் சிரியுங்கள்.')],
    props: bi('Plates of glass bangles', 'கண்ணாடி வளையல் தட்டுகள்'),
  },
  {
    id: 'bs-kiss', events: ['babyshower', 'outdoor'],
    title: bi('A kiss for the bump', 'வயிற்றுக்கு முத்தம்'),
    steps: [st('him', 'Kneel and kiss the bump, hands at her waist.', 'மண்டியிட்டு வயிற்றில் முத்தமிடுங்கள், கைகள் அவள் இடுப்பில்.'), st('her', 'Rest a hand on his head, look down at him.', 'அவன் தலையில் கை வைத்து அவனைப் பாருங்கள்.')],
  },
  {
    id: 'bs-profile', events: ['babyshower', 'outdoor'],
    title: bi('Bump profile', 'பக்கவாட்டுத் தோற்றம்'),
    steps: [st('you', 'Turn sideways, both hands under the bump, chin down towards it.', 'பக்கவாட்டில் திரும்பி, இரு கைகளும் வயிற்றுக்குக் கீழே, தாடை அதை நோக்கி.')],
  },
  {
    id: 'bs-mothers', events: ['babyshower'],
    title: bi('Two mothers', 'இரு தாய்மார்'),
    steps: [st('parents', 'Your mother stands beside you; both of you rest a hand on the bump.', 'உங்கள் தாய் அருகே நிற்க, இருவரும் வயிற்றில் கை வையுங்கள்.')],
  },
  {
    id: 'bs-blessing', events: ['babyshower'], faith: 'christian',
    title: bi('Blessing hands', 'ஆசீர்வதிக்கும் கைகள்'),
    steps: [st('elders', 'Place your hands gently on her head for the prayer.', 'ஜெபத்திற்காக அவள் தலையில் மென்மையாகக் கை வையுங்கள்.'), st('you', 'Sit with eyes closed, hands on the bump.', 'கண்களை மூடி, கைகளை வயிற்றில் வைத்து அமருங்கள்.')],
  },
  {
    id: 'bs-dua', events: ['babyshower'], faith: 'muslim',
    title: bi('Mother’s dua', 'தாயின் துஆ'),
    steps: [st('parents', 'Your mother raises her palms in dua beside you.', 'உங்கள் அருகே தாய் உள்ளங்கைகளை உயர்த்தி துஆ செய்யட்டும்.'), st('you', 'Hands on the bump, eyes lowered.', 'கைகள் வயிற்றில், கண்கள் தாழ்ந்து.')],
  },

  // ── Baby shoot ───────────────────────────────────────────────────────────
  {
    id: 'baby-basket', events: ['babyshoot'],
    title: bi('Asleep in a basket', 'கூடையில் உறக்கம்'),
    steps: [st('baby', 'Wrapped snug, curled on the side, in a soft-lined basket.', 'மென்மையான கூடையில், இறுக்கமாகச் சுற்றி, பக்கவாட்டில் சுருண்டு.')],
    props: bi('Basket, soft wrap, warm room', 'கூடை, மென்துணி, கதகதப்பான அறை'),
  },
  {
    id: 'baby-moon', events: ['babyshoot'],
    title: bi('Sleepy in a wrap', 'துணியில் உறக்கம்'),
    steps: [st('baby', 'Swaddled snug with a knit cap, chin tucked, shot from above in soft light.', 'பின்னல் தொப்பியுடன் இறுக்கச் சுற்றி, தாடை உள்ளே, மேலிருந்து மென்மையான ஒளியில்.')],
    props: bi('Soft wrap, knit cap', 'மென்துணி, பின்னல் தொப்பி'),
  },
  {
    id: 'baby-hands', events: ['babyshoot', 'naming'],
    title: bi('In both our hands', 'எங்கள் கைகளில்'),
    steps: [st('parents', 'Sit facing each other and cradle the baby between your hands.', 'ஒருவரை ஒருவர் பார்த்து அமர்ந்து, இருவர் கைகளுக்கு நடுவில் குழந்தையைத் தாங்குங்கள்.')],
  },
  {
    id: 'baby-sibling', events: ['babyshoot', 'naming'],
    title: bi('Big sibling’s kiss', 'அண்ணன்/அக்காவின் முத்தம்'),
    steps: [st('child', 'Lean in and kiss the baby’s cheek, very gently.', 'குனிந்து பாப்பாவின் கன்னத்தில் மெதுவாக முத்தமிடுங்கள்.')],
  },
  {
    id: 'baby-lap', events: ['babyshoot', 'outdoor'],
    title: bi('Amma’s lap', 'அம்மா மடி'),
    steps: [st('parents', 'Sit cross-legged with the baby in your lap and look down at the baby.', 'சம்மணமிட்டு குழந்தையை மடியில் வைத்து குழந்தையைப் பாருங்கள்.')],
  },
  {
    id: 'baby-frame', events: ['babyshoot'],
    title: bi('Flower frame', 'மலர்ச் சட்டகம்'),
    steps: [st('baby', 'Lying wrapped inside a ring of flowers, shot from above.', 'மலர் வளையத்துக்குள் சுற்றிய துணியில் படுத்திருக்க, மேலிருந்து படம்.')],
  },

  // ── Pre / post-wedding ───────────────────────────────────────────────────
  {
    id: 'pre-sunset', events: ['prewedding', 'outdoor'],
    title: bi('Sunset silhouette', 'அந்தி நிழலுருவம்'),
    steps: [st('both', 'Stand against the sun, foreheads close, holding hands low.', 'சூரியனுக்கு எதிரே நின்று, நெற்றிகள் நெருங்கி, கைகளைக் கீழே கோர்த்துக் கொள்ளுங்கள்.')],
  },
  {
    id: 'pre-piggyback', events: ['prewedding', 'outdoor'],
    title: bi('Piggyback', 'முதுகுச் சவாரி'),
    steps: [st('him', 'Carry her on your back, hands under her knees.', 'அவளை முதுகில் சுமந்து, கைகளை அவள் முழங்கால்களுக்குக் கீழ் வையுங்கள்.'), st('her', 'Arms around his neck, cheek next to his.', 'கைகள் அவன் கழுத்தைச் சுற்றி, கன்னம் அவன் கன்னத்தருகே.')],
  },
  {
    id: 'pre-umbrella', events: ['prewedding', 'outdoor'],
    title: bi('Under one umbrella', 'ஒரே குடையின் கீழ்'),
    steps: [st('him', 'Hold the umbrella over both of you, tilted towards her.', 'குடையை இருவருக்கும் மேல், அவள் பக்கம் சாய்த்துப் பிடியுங்கள்.'), st('her', 'Hold his arm and look up at him.', 'அவன் கையைப் பிடித்து அவனை அண்ணாந்து பாருங்கள்.')],
    props: bi('A red umbrella', 'சிவப்புக் குடை'),
  },
  {
    id: 'pre-run', events: ['prewedding', 'outdoor'],
    title: bi('Running together', 'சேர்ந்து ஓட்டம்'),
    steps: [st('her', 'Run ahead and pull him by the hand, look back laughing.', 'முன்னால் ஓடி அவன் கையைப் பிடித்து இழுத்து, சிரித்தபடி திரும்பிப் பாருங்கள்.'), st('him', 'Follow, arm stretched out to her.', 'அவளை நோக்கிக் கை நீட்டியபடி பின்தொடருங்கள்.')],
  },
  {
    id: 'pre-bench', events: ['prewedding', 'outdoor'],
    title: bi('On the bench', 'பெஞ்சில்'),
    steps: [st('him', 'Sit close with your arm around her.', 'அவளைச் சுற்றிக் கை போட்டு நெருக்கமாக அமருங்கள்.'), st('her', 'Rest your head on his shoulder, hands in your lap.', 'அவன் தோளில் தலை சாய்த்து, கைகளை மடியில் வையுங்கள்.')],
  },
  {
    id: 'pre-tea', events: ['prewedding'],
    title: bi('Tea on the steps', 'படியில் தேநீர்'),
    steps: [st('both', 'Sit on the steps, knees touching, sipping tea and talking.', 'படிகளில் முழங்கால் உரச அமர்ந்து, தேநீர் அருந்திப் பேசுங்கள்.')],
    props: bi('Two glasses of tea', 'இரண்டு டம்ளர் தேநீர்'),
  },
  {
    id: 'pre-temple', events: ['prewedding'], faith: 'hindu',
    title: bi('Temple corridor walk', 'கோயில் பிரகார நடை'),
    steps: [st('both', 'Walk slowly between the pillars in silk, hands linked.', 'பட்டு உடையில் தூண்களுக்கு நடுவே கைகோர்த்து மெதுவாக நடங்கள்.'), st('her', 'Hold a little jasmine string in your free hand.', 'மற்ற கையில் சிறிது மல்லிகைச் சரம் வையுங்கள்.')],
  },
  {
    id: 'pre-church', events: ['prewedding'], faith: 'christian',
    title: bi('At the old church door', 'பழைய தேவாலய வாசலில்'),
    steps: [st('both', 'Stand in the doorway, her back against him, his arms around her.', 'வாசலில் நின்று, அவள் முதுகு அவன் மீது, அவன் கைகள் அவளைச் சுற்றி.')],
  },
  {
    id: 'pre-arches', events: ['prewedding'], faith: 'muslim',
    title: bi('Under the arches', 'வளைவுகளின் கீழ்'),
    steps: [st('both', 'Stand under the arch facing each other, his hand at her cheek.', 'வளைவின் கீழ் ஒருவரை ஒருவர் பார்த்து நில்லுங்கள், அவன் கை அவள் கன்னத்தில்.')],
  },

  // ── Outdoor ──────────────────────────────────────────────────────────────
  {
    id: 'out-field', events: ['outdoor', 'prewedding'],
    title: bi('Through the paddy fields', 'வயல் வரப்பில்'),
    steps: [st('both', 'Walk the bund one behind the other, her hand reaching back to him.', 'வரப்பில் ஒருவர் பின் ஒருவராக நடங்கள், அவள் கை பின்னால் அவனை நோக்கி.')],
  },
  {
    id: 'out-tree', events: ['outdoor', 'prewedding'],
    title: bi('Against the tree', 'மரத்தில் சாய்ந்து'),
    steps: [st('her', 'Lean your back on the trunk, hands behind you.', 'மரத்தில் முதுகைச் சாய்த்து, கைகளைப் பின்னால் வையுங்கள்.'), st('him', 'Rest one hand on the trunk beside her and lean in.', 'அவள் அருகே மரத்தில் ஒரு கையை ஊன்றி அவள் பக்கம் சாயுங்கள்.')],
  },
  {
    id: 'out-maternity', events: ['outdoor', 'babyshower'],
    title: bi('Flowing drape', 'பறக்கும் துப்பட்டா'),
    steps: [st('you', 'Walk slowly into the wind, one hand on the bump, the other letting the drape fly.', 'காற்றை நோக்கி மெதுவாக நடங்கள், ஒரு கை வயிற்றில், மறு கையில் துணி பறக்கட்டும்.')],
    props: bi('A long light drape', 'நீண்ட மென்துணி'),
  },
  {
    id: 'out-picnic', events: ['outdoor', 'babyshoot'],
    title: bi('Family picnic', 'குடும்பச் சுற்றுலா'),
    steps: [st('family', 'Sit on the mat with the baby in the middle, all looking at the baby.', 'விரிப்பில் அமர்ந்து, நடுவில் குழந்தை, அனைவரும் குழந்தையைப் பாருங்கள்.')],
    props: bi('A mat, a basket', 'விரிப்பு, கூடை'),
  },
  {
    id: 'out-lake', events: ['outdoor', 'prewedding'],
    title: bi('By the lake', 'ஏரிக்கரையில்'),
    steps: [st('both', 'Sit by the water, knees up, her head on his shoulder.', 'நீர்க்கரையில் முழங்கால் மடக்கி அமருங்கள், அவள் தலை அவன் தோளில்.')],
  },

  // ── Model portfolio ──────────────────────────────────────────────────────
  {
    id: 'model-power', events: ['model'],
    title: bi('Power stance', 'அதிகார நிலை'),
    steps: [st('you', 'Feet hip-width apart, hands on hips, chin slightly down, eyes straight into the lens.', 'பாதங்கள் இடுப்பு அகலத்தில், கைகள் இடுப்பில், தாடை சற்றுக் கீழே, கண்கள் நேராக லென்ஸில்.')],
  },
  {
    id: 'model-shoulder', events: ['model'],
    title: bi('Look back', 'திரும்பிப் பார்'),
    steps: [st('you', 'Turn away from the camera, drop one shoulder and look back over it.', 'கேமராவிலிருந்து திரும்பி, ஒரு தோளைத் தாழ்த்தி அதன் வழியாகத் திரும்பிப் பாருங்கள்.')],
  },
  {
    id: 'model-chair', events: ['model'],
    title: bi('Reverse chair', 'நாற்காலியில் தலைகீழாக'),
    steps: [st('you', 'Straddle the chair backwards, arms folded on the backrest, chin on your arms.', 'நாற்காலியில் பின்புறமாக அமர்ந்து, கைகளை முதுகுச் சாய்வில் மடித்து, தாடையை அவற்றின் மேல் வையுங்கள்.')],
  },
  {
    id: 'model-wall', events: ['model', 'corporate'],
    title: bi('Wall lean', 'சுவரில் சாய்ந்து'),
    steps: [st('you', 'Back to the wall, one foot flat against it, hands in pockets.', 'சுவரில் முதுகைச் சாய்த்து, ஒரு பாதத்தை அதில் ஊன்றி, கைகளைப் பைகளில் வையுங்கள்.')],
  },
  {
    id: 'model-walk', events: ['model'],
    title: bi('The walk-in', 'நடை'),
    steps: [st('you', 'Walk towards the camera with long strides, arms loose, eyes on the lens.', 'நீண்ட அடிகளுடன் கேமராவை நோக்கி நடங்கள், கைகள் தளர்வாக, கண்கள் லென்ஸில்.')],
  },
  {
    id: 'model-floor', events: ['model'],
    title: bi('Under the hat brim', 'தொப்பி நிழலில்'),
    steps: [st('you', 'Tilt the brim low with one hand, chin down, eyes just visible under it.', 'ஒரு கையால் தொப்பி விளிம்பைத் தாழ்த்தி, தாடை கீழே, கண்கள் அதன் கீழ் சற்றே தெரியட்டும்.')],
  },
  {
    id: 'model-pallu', events: ['model', 'puberty'],
    title: bi('Pallu in flight', 'பறக்கும் முந்தானை'),
    steps: [st('you', 'Hold the pallu out at arm’s length and let it catch the breeze; eyes to the lens.', 'முந்தானையைக் கை நீளத்தில் விரித்துக் காற்றில் பறக்க விடுங்கள்; கண்கள் லென்ஸில்.')],
  },

  // ── Corporate ────────────────────────────────────────────────────────────
  {
    id: 'corp-handshake', events: ['corporate'],
    title: bi('The handshake', 'கைகுலுக்கல்'),
    steps: [st('group', 'Shake hands at chest height, both faces turned to the camera.', 'மார்பளவில் கைகுலுக்கி, இருவர் முகமும் கேமராவை நோக்கி.')],
  },
  {
    id: 'corp-speaker', events: ['corporate'],
    title: bi('At the podium', 'மேடைப் பேச்சு'),
    steps: [st('you', 'Stand square to the audience, one hand open in a gesture, mid-sentence.', 'பார்வையாளரை நோக்கி நேராக நின்று, பேசும்போது ஒரு கையைத் திறந்து அசையுங்கள்.')],
  },
  {
    id: 'corp-team', events: ['corporate'],
    title: bi('Team photo', 'அணிப் படம்'),
    steps: [st('team', 'Front row seated, back row standing in the gaps, everyone angled in.', 'முன்வரிசை அமர்ந்து, பின்வரிசை இடைவெளிகளில் நின்று, அனைவரும் உள்நோக்கித் திரும்பி.')],
  },
  {
    id: 'corp-award', events: ['corporate'],
    title: bi('Hands in', 'கைகள் ஒன்றாக'),
    steps: [st('team', 'Stack your hands in the centre, shot from above, everyone leaning in.', 'நடுவில் கைகளை ஒன்றன் மேல் ஒன்றாக வைத்து, அனைவரும் உள்நோக்கிச் சாய்ந்து, மேலிருந்து படம்.')],
  },
  {
    id: 'corp-crossed', events: ['corporate', 'model'],
    title: bi('Arms crossed portrait', 'கைகட்டிய உருவப்படம்'),
    steps: [st('you', 'Arms loosely crossed, weight on the back foot, a relaxed smile.', 'கைகளைத் தளர்வாகக் கட்டி, எடையைப் பின்கால் மீது வைத்து, இயல்பான புன்னகை.')],
  },
  {
    id: 'corp-panel', events: ['corporate'],
    title: bi('Panel discussion', 'கலந்துரையாடல்'),
    steps: [st('group', 'Sit angled towards the speaker; the speaker gestures with the mic.', 'பேசுபவரை நோக்கித் திரும்பி அமருங்கள்; பேசுபவர் மைக்குடன் கை அசைக்கட்டும்.')],
  },
]

// ─── Lookups ─────────────────────────────────────────────────────────────────

const BY_ID = new Map(POSES.map(p => [p.id, p]))
export const poseById = (id: string) => BY_ID.get(id)

/** Poses the studio would send for an event: common ones plus the chosen ritual sets. */
export function posesFor(event: EventKey, faiths: Faith[]): PoseDef[] {
  return POSES.filter(p => p.events.includes(event) && (!p.faith || faiths.includes(p.faith)))
}

/** Ritual sets that have at least one pose for this event. */
export const faithsFor = (event: EventKey): Faith[] => FAITHS.map(f => f.key).filter(k => POSES.some(p => p.faith === k && p.events.includes(event)))

/** Image URL for a pose card. */
export const poseSrc = (pose: PoseDef) => `/poses/${pose.id}.svg`
