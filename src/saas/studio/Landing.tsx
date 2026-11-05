import { Link } from 'react-router'
import { Icon, type IconName } from '../../components/Icon'
import { Badge, Button, Container, Eyebrow, SectionHeading } from '../../components/ui'
import { Reveal, Stagger, StaggerItem } from '../../components/motion'
import { formatINR, useLang, useT } from '../../lib/i18n'
import { useTitle } from '../../lib/ui'
import { PRODUCT } from '../brand'
import { useStudioStore } from '../store'
import { planTotal } from '../types'
import { STUDIO_SERVICES, studioServicePath } from './services'

const copy = {
  title: { en: 'For photographers', ta: 'புகைப்படக் கலைஞர்களுக்கு' },
  eyebrow: { en: `${PRODUCT.name} · ${PRODUCT.by}`, ta: `${PRODUCT.name} · ${PRODUCT.by}` },
  h1: { en: 'Let your couples pick their album photos. Keep every RAW where it is.', ta: 'உங்கள் வாடிக்கையாளர்கள் ஆல்பம் படங்களைத் தேர்வு செய்யட்டும். RAW கோப்புகள் உங்கள் வட்டிலேயே இருக்கட்டும்.' },
  lead: {
    en: 'Three services for working photographers: a branded gallery your customers choose album photos in, a manager that remembers which hard drive holds which shoot, and a pose list matched to each event. One plan covers all three.',
    ta: 'பணியிலுள்ள புகைப்படக் கலைஞர்களுக்கு இரண்டு கருவிகள்: வாடிக்கையாளர்கள் தங்கள் கைப்பேசியில் திறக்கும் உங்கள் பிராண்ட் கொண்ட படத் தேர்வு, எந்த ஹார்ட் டிரைவில் எந்த நிகழ்வு உள்ளது என்பதை நினைவில் வைக்கும் மேலாளர்.',
  },
  start: { en: 'Sign in or sign up', ta: 'உள்நுழை அல்லது பதிவு செய்' },
  services: { en: 'Three services', ta: 'மூன்று சேவைகள்' },
  servicesTitle: { en: 'Gallery choosing, storage, poses.', ta: 'காட்சியகத் தேர்வு, சேமிப்பு, போஸ்.' },
  servicesLead: { en: 'Each one works on its own. Your customers only ever see your logo and name.', ta: 'ஒவ்வொன்றும் தனியாகச் செயல்படும். உங்கள் வாடிக்கையாளர்கள் உங்கள் லோகோவையும் பெயரையும் மட்டுமே பார்ப்பார்கள்.' },
  more: { en: 'How it works', ta: 'எப்படி செயல்படுகிறது' },
  planned: { en: 'Coming soon', ta: 'விரைவில்' },
  bestValue: { en: 'Best value', ta: 'சிறந்த மதிப்பு' },
  tools: { en: 'The two tools', ta: 'இரண்டு கருவிகள்' },
  t1: { en: 'Album photo selector', ta: 'ஆல்பம் படத் தேர்வு' },
  t1b: {
    en: 'Drop the card folder or your Lightroom export. Clients get a link with your logo and colours, heart the photos they want within the quota, add notes, and submit. You get the list, ready to paste into Lightroom.',
    ta: 'கார்டு கோப்புறை அல்லது Lightroom ஏற்றுமதியை இடுங்கள். வாடிக்கையாளருக்கு உங்கள் லோகோ, நிறத்துடன் ஒரு இணைப்பு; அளவுக்குள் படங்களைத் தேர்ந்து, குறிப்பு சேர்த்து, சமர்ப்பிப்பார்கள். பட்டியல் Lightroom-ல் ஒட்டத் தயாராக உங்களுக்கு வரும்.',
  },
  t2: { en: 'Storage devices manager', ta: 'சேமிப்பகச் சாதன மேலாளர்' },
  t2b: {
    en: 'Scan each hard drive once. Later, search a client name or a filename and see which drive holds it and which shelf that drive sits on, even when it is unplugged.',
    ta: 'ஒவ்வொரு ஹார்ட் டிரைவையும் ஒருமுறை ஸ்கேன் செய்யுங்கள். பின்னர் வாடிக்கையாளர் பெயர் அல்லது கோப்புப் பெயரைத் தேடினால், அது எந்த டிரைவில், அந்த டிரைவ் எந்த அலமாரியில் என்பது தெரியும், இணைக்காமல் இருந்தாலும்.',
  },
  flow: { en: 'How it works, in four steps', ta: 'நான்கு படிகளில் செயல்முறை' },
  s1: { en: 'Upload the proofs', ta: 'படங்களைப் பதிவேற்றுங்கள்' },
  s1b: {
    en: 'Drag the RAW card folder or a Lightroom JPG export into the event. Subfolders become chapters. Names stay exactly as on your disk.',
    ta: 'RAW கார்டு கோப்புறை அல்லது Lightroom JPG ஏற்றுமதியை நிகழ்வில் இழுத்து விடுங்கள். உட்கோப்புறைகள் அத்தியாயங்களாகும். பெயர்கள் உங்கள் வட்டில் உள்ளபடியே இருக்கும்.',
  },
  s2: { en: 'Share the link', ta: 'இணைப்பைப் பகிருங்கள்' },
  s2b: { en: 'Send the gallery link, PIN and QR on WhatsApp, in English or Tamil.', ta: 'காட்சியக இணைப்பு, PIN, QR-ஐ WhatsApp-ல் ஆங்கிலம் அல்லது தமிழில் அனுப்புங்கள்.' },
  s3: { en: 'The couple picks', ta: 'தம்பதியர் தேர்வு செய்கிறார்கள்' },
  s3b: { en: 'They choose within the quota, leave notes like “crop tighter”, and submit. You see every step.', ta: 'அளவுக்குள் தேர்ந்து, “இன்னும் நெருக்கமாக வெட்டுங்கள்” போன்ற குறிப்புகளுடன் சமர்ப்பிப்பார்கள். ஒவ்வொரு படியும் உங்களுக்குத் தெரியும்.' },
  s4: { en: 'Find the RAWs in Lightroom', ta: 'Lightroom-ல் RAW-களைக் கண்டறியுங்கள்' },
  s4b: {
    en: 'Copy the list, paste it into the Library filter (Text › Filename › Contains), save the result as a collection and start editing.',
    ta: 'பட்டியலை நகலெடுத்து, Library வடிகட்டியில் (Text › Filename › Contains) ஒட்டி, முடிவைத் தொகுப்பாகச் சேமித்து, திருத்தத் தொடங்குங்கள்.',
  },
  rawTitle: { en: 'RAWs never leave your disk', ta: 'RAW கோப்புகள் உங்கள் வட்டை விட்டு வெளியேறாது' },
  rawBody: {
    en: 'Your browser opens each RAW on your own computer, takes the full-size JPEG preview the camera stored inside it, shrinks it to a 2048 px proof with your watermark, and uploads only that, about 1 MB. A wedding costs a few hundred MB of space instead of 100 GB, and the RAW files stay with you.',
    ta: 'உங்கள் உலாவி ஒவ்வொரு RAW-ஐயும் உங்கள் கணினியிலேயே திறந்து, கேமரா அதனுள் வைத்த முழு அளவு JPEG முன்னோட்டத்தை எடுத்து, உங்கள் நீர்க்குறியுடன் 2048 px படமாகச் சுருக்கி, அதை மட்டுமே (சுமார் 1 MB) பதிவேற்றும். ஒரு திருமணத்திற்கு 100 GB பதிலாக சில நூறு MB மட்டுமே; RAW கோப்புகள் உங்களிடமே.',
  },
  rawNote: {
    en: 'The proof shows the straight-from-camera look. If you want clients to see your edits, export JPGs from Lightroom and drop those instead.',
    ta: 'படம் கேமராவிலிருந்து வந்த தோற்றத்தைக் காட்டும். உங்கள் திருத்தங்களை வாடிக்கையாளர் பார்க்க வேண்டுமெனில், Lightroom-லிருந்து JPG ஏற்றுமதி செய்து அவற்றை இடுங்கள்.',
  },
  plans: { en: 'Plans', ta: 'திட்டங்கள்' },
  plansLead: { en: 'Pay for 1, 6 or 12 months up front. No limit on clients or galleries; storage of proofs is included.', ta: '1, 6 அல்லது 12 மாதங்களுக்கு முன்கூட்டியே செலுத்துங்கள். வாடிக்கையாளர் அல்லது காட்சியக வரம்பு இல்லை; படச் சேமிப்பு அடங்கும்.' },
  perMonth: { en: 'per month', ta: 'மாதத்திற்கு' },
  months: { en: 'months', ta: 'மாதங்கள்' },
  total: { en: 'total', ta: 'மொத்தம்' },
  pay: { en: 'Pay by UPI or bank transfer. Your studio switches on as soon as our team confirms the payment.', ta: 'UPI அல்லது வங்கிப் பரிமாற்றம் மூலம் செலுத்துங்கள். எங்கள் குழு கட்டணத்தை உறுதிசெய்ததும் உங்கள் ஸ்டுடியோ இயங்கும்.' },
}

export default function Landing() {
  const t = useT(copy)
  const lang = useLang()
  useTitle(copy.title)
  const plans = useStudioStore(s => s.plans)
  const steps: { icon: IconName; title: string; body: string }[] = [
    { icon: 'image', title: t.s1, body: t.s1b },
    { icon: 'whatsapp', title: t.s2, body: t.s2b },
    { icon: 'heart', title: t.s3, body: t.s3b },
    { icon: 'search', title: t.s4, body: t.s4b },
  ]

  return (
    <div className="pb-24 pt-28 md:pt-36">
      <Container>
        <div className="max-w-3xl">
          <Reveal><Eyebrow>{t.eyebrow}</Eyebrow></Reveal>
          <Reveal delay={0.05}><h1 className="t-1 mt-5 text-ink">{t.h1}</h1></Reveal>
          <Reveal delay={0.12}><p className="t-lead mt-6 max-w-2xl text-ink/60">{t.lead}</p></Reveal>
          <Reveal delay={0.18}>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button to="/studio/login" icon="arrowRight" size="lg">{t.start}</Button>
            </div>
          </Reveal>
        </div>

        <section className="mt-24">
          <SectionHeading eyebrow={t.services} title={t.servicesTitle} lead={t.servicesLead} size="t-3" />
          <Stagger className="mt-10 grid gap-4 md:grid-cols-3">
            {STUDIO_SERVICES.map(s => (
              <StaggerItem key={s.slug}>
                <Link to={studioServicePath(s.slug)} className="group flex h-full flex-col rounded-[26px] border border-ink/[0.08] bg-white p-6 transition hover:-translate-y-0.5 hover:border-ink/20 md:p-8">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink/[0.05] text-ink"><Icon name={s.icon} size={20} /></span>
                    {s.planned && <Badge tone="outline">{t.planned}</Badge>}
                  </div>
                  <h2 className="mt-5 text-[20px] font-semibold tracking-tight text-ink">{s.name[lang]}</h2>
                  <p className="mt-3 flex-1 text-[15px] leading-relaxed text-ink/60">{s.tagline[lang]}</p>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-medium text-ink">
                    {t.more}<Icon name="arrowUpRight" size={14} className="transition-transform duration-300 group-hover:rotate-45" />
                  </span>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        <section className="mt-24">
          <SectionHeading eyebrow={PRODUCT.short} title={t.flow} size="t-3" />
          <Stagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <StaggerItem key={s.title}>
                <div className="h-full rounded-[26px] border border-ink/[0.08] bg-white p-6">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-[34px] leading-none text-ink/20">{i + 1}</span>
                    <Icon name={s.icon} size={20} className="text-ink/50" />
                  </div>
                  <h3 className="mt-5 text-[16px] font-semibold text-ink">{s.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-ink/60">{s.body}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        <section className="mt-24 rounded-[30px] bg-ink p-7 text-white md:p-12">
          <div className="flex items-center gap-3 text-white/60"><Icon name="lock" size={18} /><span className="t-label">RAW · CR2 · CR3 · NEF · ARW · DNG · RAF · ORF · RW2</span></div>
          <h2 className="t-2 mt-5 max-w-2xl">{t.rawTitle}</h2>
          <p className="mt-5 max-w-3xl text-[16px] leading-relaxed text-white/70">{t.rawBody}</p>
          <p className="mt-4 max-w-3xl text-[14px] leading-relaxed text-white/50">{t.rawNote}</p>
        </section>

        <section className="mt-24">
          <SectionHeading eyebrow={t.plans} title={t.plans} lead={t.plansLead} size="t-3" />
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {plans.map(p => (
              <div key={p.key} className="flex flex-col rounded-[26px] border border-ink/[0.08] bg-white p-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[15px] font-semibold text-ink">{p.name}</p>
                  {p.key === 'm12' && <Badge tone="ruby">{t.bestValue}</Badge>}
                </div>
                <p className="mt-4 text-[32px] font-semibold tabular-nums tracking-tight text-ink">{formatINR(p.pricePerMonth)}</p>
                <p className="text-[13px] text-ink/50">{t.perMonth}</p>
                <div className="mt-6 border-t border-ink/[0.06] pt-4">
                  <p className="text-[15px] text-ink"><span className="font-semibold">{formatINR(planTotal(p))}</span> <span className="text-ink/50">{t.total} · {p.months} {t.months}</span></p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-5 text-[13px] text-ink/50">{t.pay}</p>
          <div className="mt-8"><Button to="/studio/login" icon="arrowRight">{t.start}</Button></div>
        </section>
      </Container>
    </div>
  )
}
