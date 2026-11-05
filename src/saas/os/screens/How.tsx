import { Link } from 'react-router'
import { Icon, type IconName } from '../../../components/Icon'
import { pick, useLang, useT, type Bi } from '../../../lib/i18n'
import { useTitle } from '../../../lib/ui'
import { PageHeader, Panel } from '../../../pages/admin/kit'

const copy = {
  title: { en: 'How it works', ta: 'எப்படி வேலை செய்கிறது' },
  eyebrow: { en: 'Guide', ta: 'வழிகாட்டி' },
  sub: { en: 'Three parts: album selection, the pose chooser, and Data for your drives.', ta: 'மூன்று பகுதிகள்: ஆல்பத் தேர்வு, போஸ் தேர்வு, உங்கள் டிரைவ்களுக்கான தரவு.' },
  album: { en: 'Album selection in 4 steps', ta: '4 படிகளில் ஆல்பத் தேர்வு' },
  projects: { en: 'Projects and poses', ta: 'திட்டங்களும் போஸ்களும்' },
  drives: { en: 'Data: your drives', ta: 'தரவு: உங்கள் டிரைவ்கள்' },
  open: { en: 'Open', ta: 'திற' },
}

const ALBUM: { icon: IconName; h: Bi; b: Bi }[] = [
  { icon: 'plus', h: { en: '1. Create the gallery', ta: '1. காட்சியகத்தை உருவாக்குங்கள்' }, b: { en: 'Post Production → New event. Give the couple’s names, phone, how many photos they pick and a choose-by date. Or create it from a project’s Overview so it is linked.', ta: 'பின்தயாரிப்பு → புதிய நிகழ்வு. தம்பதியர் பெயர், எண், எத்தனை படங்கள், கடைசி தேதி கொடுங்கள். அல்லது திட்டத்தின் மேலோட்டத்தில் உருவாக்கினால் இணைந்துவிடும்.' } },
  { icon: 'image', h: { en: '2. Drop the card folder in', ta: '2. கார்டு கோப்புறையை இடுங்கள்' }, b: { en: 'Small previews are made in your browser and uploaded. Your RAW files never leave your disk; the filename is the link back to them.', ta: 'சிறிய முன்னோட்டங்கள் உங்கள் உலாவியில் உருவாகிப் பதிவேறும். RAW கோப்புகள் உங்கள் வட்டை விட்டு வெளியேறாது; கோப்புப் பெயரே இணைப்பு.' } },
  { icon: 'send', h: { en: '3. Send the link', ta: '3. இணைப்பை அனுப்புங்கள்' }, b: { en: 'Open the gallery and share the link (and PIN) on WhatsApp. The couple taps hearts on the photos they want, from their phone.', ta: 'காட்சியகத்தைத் திறந்து இணைப்பையும் PIN-ஐயும் WhatsApp-ல் பகிருங்கள். தம்பதியர் தங்கள் போனில் விரும்பும் படங்களில் இதயம் தட்டுவார்கள்.' } },
  { icon: 'check', h: { en: '4. Get the list, edit in Lightroom', ta: '4. பட்டியலைப் பெற்று Lightroom-ல் திருத்துங்கள்' }, b: { en: 'When they submit you get the filename list. Copy it into Lightroom’s filter (or export the list) and start the album.', ta: 'சமர்ப்பித்ததும் கோப்புப் பெயர் பட்டியல் கிடைக்கும். Lightroom வடிகட்டியில் ஒட்டி (அல்லது ஏற்றுமதி செய்து) ஆல்பத்தைத் தொடங்குங்கள்.' } },
]

const PROJECT_STEPS: Bi[] = [
  { en: 'When a client books, tap New project and fill in their names and phone. An album selection gallery is made for it.', ta: 'வாடிக்கையாளர் முன்பதிவு செய்ததும், புதிய திட்டம் தட்டி பெயர்களையும் எண்ணையும் நிரப்புங்கள். அதற்கு ஒரு ஆல்பத் தேர்வுக் காட்சியகம் உருவாகும்.' },
  { en: 'In the Poses tab pick the poses for the shoot and send them. Your client marks yes or no on each one.', ta: 'போஸ்கள் தாவலில் படப்பிடிப்புக்கான போஸ்களைத் தேர்ந்து அனுப்புங்கள். வாடிக்கையாளர் ஒவ்வொன்றுக்கும் ஆம் அல்லது இல்லை குறிப்பார்.' },
  { en: 'After the shoot, upload previews in the Album selection tab and share the link with the PIN.', ta: 'படப்பிடிப்புக்குப் பிறகு ஆல்பத் தேர்வு தாவலில் முன்னோட்டங்களைப் பதிவேற்றி இணைப்பையும் PIN-ஐயும் பகிருங்கள்.' },
]

export default function How() {
  const t = useT(copy)
  const lang = useLang()
  useTitle(copy.title)
  return (
    <div>
      <PageHeader eyebrow={t.eyebrow} title={t.title} subtitle={t.sub} />
      <div className="space-y-6">
        <Panel title={t.album} icon="image" action={<Link to="/studio/galleries" className="text-[13px] font-medium text-ink/55 hover:text-ink">{t.open}</Link>}>
          <ol className="grid gap-4 sm:grid-cols-2">
            {ALBUM.map(s => (
              <li key={s.h.en} className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink/[0.05] text-ink/70"><Icon name={s.icon} size={16} /></span>
                <span><span className="block text-[14px] font-semibold text-ink">{pick(lang, s.h)}</span><span className="mt-1 block text-[13px] leading-relaxed text-ink/60">{pick(lang, s.b)}</span></span>
              </li>
            ))}
          </ol>
        </Panel>
        <Panel title={t.projects} icon="book" action={<Link to="/studio/projects" className="text-[13px] font-medium text-ink/55 hover:text-ink">{t.open}</Link>}>
          <ol className="list-decimal space-y-2.5 pl-5 text-[13.5px] leading-relaxed text-ink/70">
            {PROJECT_STEPS.map(s => <li key={s.en}>{pick(lang, s)}</li>)}
          </ol>
        </Panel>
        <Panel title={t.drives} icon="gem" action={<Link to="/studio/drives" className="text-[13px] font-medium text-ink/55 hover:text-ink">{t.open}</Link>}>
          <p className="text-[13.5px] leading-relaxed text-ink/70">
            {pick(lang, {
              en: 'Name each hard disk once and scan it from the browser. Only file details (names, sizes, dates, folders) are kept, never the photos. Later, search a filename (or paste a client’s selection) to see which disk and folder it is on.',
              ta: 'ஒவ்வொரு வன்வட்டுக்கும் ஒருமுறை பெயரிட்டு உலாவியிலிருந்து ஸ்கேன் செய்யுங்கள். கோப்புப் பெயர்களும் கோப்புறைப் பாதைகளும் மட்டுமே சேமிக்கப்படும், படங்கள் அல்ல. பிறகு ஒரு கோப்புப் பெயரைத் தேடினால் (அல்லது வாடிக்கையாளர் தேர்வை ஒட்டினால்) அது எந்த வட்டில், எந்தக் கோப்புறையில் உள்ளது என்று தெரியும்.',
            })}
          </p>
        </Panel>
      </div>
    </div>
  )
}
