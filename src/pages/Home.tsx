import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { AnimatePresence, motion, useMotionValue, useScroll, useSpring, useTransform } from 'motion/react'
import { Icon } from '../components/Icon'
import { Button, Container, Eyebrow, Img, LangImg, ListenButton, SectionHeading } from '../components/ui'
import { Counter, EASE, ImageReveal, Marquee, Reveal, RevealText, ScrollText, Stagger, StaggerItem } from '../components/motion'
import { GopuramSkyline, Kolam, Ornament, TamilOnly, Thoranam, Vilakku } from '../components/tamil'
import { StoryCard, useGalleryItems } from '../components/gallery'
import { DISTRICTS, EVENTS, districtName, type DistrictKey, type EventKey } from '../lib/data'
import { GALLERY, storiesForLang } from '../lib/gallery'
import { IMG, photoUrl, type ImgKey } from '../lib/images'
import { formatINR, useLang, useT, type Bi } from '../lib/i18n'
import { startingPrice } from '../lib/pricing'
import { useStore } from '../lib/store'
import { useDarkHero, useTitle } from '../lib/ui'

const copy = {
  eyebrow: { en: 'Madurai · Est. 2018 · Eight districts', ta: 'மதுரை · 2018 முதல் · எட்டு மாவட்டங்கள்' },
  heroA: { en: 'Moments,', ta: 'காலத்தால்' },
  heroB: { en: 'treasured', ta: 'அழியாத' },
  heroC: { en: 'forever.', ta: 'நினைவுகள்.' },
  heroLead: { en: 'Wedding, ceremony and portrait photography across Tamil Nadu — documented quietly, edited with care, bound into albums built to outlive us.', ta: 'தமிழ்நாடு முழுவதும் திருமணம், சடங்கு, உருவப்படக் கலை — அமைதியாகப் படம்பிடித்து, அக்கறையுடன் மெருகேற்றி, தலைமுறைகள் தாண்டும் ஆல்பங்களாக.' },
  quote: { en: 'Begin your story with us', ta: 'உங்கள் கதையை எங்களுடன் தொடங்குங்கள்' },
  explore: { en: 'Explore the gallery', ta: 'காட்சியகத்தைப் பார்க்க' },
  nowShowing: { en: 'Now showing', ta: 'இப்போது' },
  manifestoEyebrow: { en: 'The studio', ta: 'எங்கள் ஸ்டுடியோ' },
  manifesto: {
    en: 'We are photographers, filmmakers and album makers from Madurai. For eight years we have followed Tamil families through their most sacred days — quietly, respectfully, and with an eye for the moments nobody posed for.',
    ta: 'நாங்கள் மதுரையைச் சேர்ந்த புகைப்படக் கலைஞர்கள், திரைக் கலைஞர்கள், ஆல்பம் வடிவமைப்பாளர்கள். எட்டு ஆண்டுகளாக தமிழ்க் குடும்பங்களின் புனித நாட்களில் உடனிருந்து — அமைதியாக, மரியாதையுடன், யாரும் போஸ் கொடுக்காத தருணங்களைத் தேடிப் படம்பிடிக்கிறோம்.',
  },
  listen: { en: 'Vanakkam, and welcome to The Treasure Capture Events. Tell us where your families will gather and let us begin your story together — or take a quiet walk through our gallery.', ta: 'வணக்கம், The Treasure Capture Events-க்கு அன்புடன் வரவேற்கிறோம். உங்கள் குடும்பங்கள் கூடும் ஊரைச் சொல்லுங்கள், உங்கள் கதையை இணைந்து தொடங்குவோம் — அல்லது எங்கள் காட்சியகத்தில் சற்று உலாவுங்கள்.' },
  districtEyebrow: { en: 'Where it begins', ta: 'இங்கே தொடங்குகிறது' },
  districtTitle: { en: 'Where will your families gather?', ta: 'உங்கள் குடும்பங்கள் எங்கே கூடுகின்றன?' },
  districtLead: { en: 'Choose your hometown — we come to you, and plan our crew and every ritual around your auspicious day.', ta: 'உங்கள் ஊரைத் தேர்ந்தெடுங்கள் — நாங்கள் உங்களிடம் வருவோம்; உங்கள் சுபதினத்தைச் சுற்றியே குழுவையும் ஒவ்வொரு சடங்கையும் திட்டமிடுவோம்.' },
  storiesEyebrow: { en: 'Stories', ta: 'கதைகள்' },
  storiesTitle: { en: 'Recent stories', ta: 'சமீபத்திய கதைகள்' },
  storiesAll: { en: 'All stories', ta: 'அனைத்துக் கதைகள்' },
  eventsEyebrow: { en: 'What we photograph', ta: 'நாங்கள் படம்பிடிப்பவை' },
  eventsTitle: { en: 'Every ceremony,\nevery family.', ta: 'ஒவ்வொரு சடங்கும்,\nஒவ்வொரு குடும்பமும்.' },
  from: { en: 'from', ta: 'முதல்' },
  stat1: { en: 'Events captured', ta: 'படம்பிடித்த நிகழ்வுகள்' },
  stat2: { en: 'Districts served', ta: 'சேவை மாவட்டங்கள்' },
  stat3: { en: 'Albums delivered', ta: 'வழங்கிய ஆல்பங்கள்' },
  stat4: { en: 'Average Google rating', ta: 'சராசரி கூகிள் மதிப்பீடு' },
  processEyebrow: { en: 'How it works', ta: 'எப்படி செயல்படுகிறது' },
  processTitle: { en: 'From the first hello to an album your grandchildren will hold.', ta: 'முதல் வணக்கம் முதல் உங்கள் பேரக்குழந்தைகள் புரட்டும் ஆல்பம் வரை.' },
  galleryEyebrow: { en: 'From the gallery', ta: 'காட்சியகத்திலிருந்து' },
  galleryTitle: { en: 'Seen through our lens', ta: 'எங்கள் லென்ஸ் வழியே' },
  galleryCta: { en: 'Enter the gallery', ta: 'காட்சியகம் செல்ல' },
  loveEyebrow: { en: 'Kind words', ta: 'அன்பான வார்த்தைகள்' },
  traditionEyebrow: { en: 'Rooted in tradition', ta: 'மரபில் வேரூன்றி' },
  traditionTitle: { en: 'We know the rituals before they begin.', ta: 'சடங்குகள் தொடங்கும் முன்பே அவற்றை அறிவோம்.' },
  traditionBody: {
    en: 'Maalai maatral, kanyadaanam, the tying of the thaali, the first kolam of a Manjal Neerattu morning — our crew is from here. We stand where the priest expects us to, and never where the family needs to be.',
    ta: 'மாலை மாற்றல், கன்னிகாதானம், தாலி கட்டுதல், மஞ்சள் நீராட்டு காலையின் முதல் கோலம் — எங்கள் குழு இந்த மண்ணைச் சேர்ந்தது. அர்ச்சகர் எதிர்பார்க்கும் இடத்தில் நிற்போம்; குடும்பத்திற்குத் தேவையான இடத்தை ஒருபோதும் மறைக்கமாட்டோம்.',
  },
  traditionCta: { en: 'Our services', ta: 'எங்கள் சேவைகள்' },
}

const PROCESS = [
  { icon: 'calendar', en: ['Your auspicious day', 'Share your muhurtham date and hometown — we will hold it dear.'], ta: ['உங்கள் சுபதினம்', 'முகூர்த்த தேதியும் ஊரும் சொல்லுங்கள் — அதை அன்புடன் ஒதுக்கி வைப்போம்.'] },
  { icon: 'users', en: ['Meet as family', 'We sit with you to plan the rituals, the timings and every cherished moment.'], ta: ['குடும்பமாகச் சந்திப்போம்', 'சடங்குகள், நேரம், ஒவ்வொரு இனிய தருணத்தையும் உங்களுடன் அமர்ந்து திட்டமிடுவோம்.'] },
  { icon: 'camera', en: ['The day', 'Our crew arrives early and stays until the last guest.'], ta: ['விழா நாள்', 'எங்கள் குழு முன்னதாக வந்து கடைசி விருந்தினர் வரை இருக்கும்.'] },
  { icon: 'heart', en: ['Pick favourites', 'Choose album photos in your private online gallery.'], ta: ['பிடித்தவை தேர்வு', 'உங்கள் தனிப்பட்ட கேலரியில் ஆல்பப் படங்களைத் தேர்ந்தெடுங்கள்.'] },
  { icon: 'book', en: ['Your album', 'Design the cover, paper and type — delivered to your door.'], ta: ['உங்கள் ஆல்பம்', 'அட்டை, தாள், எழுத்துருவை வடிவமைத்து — வீட்டுக்கே வழங்கல்.'] },
] as const

// The home page only shows frames without faces: hands, rituals, decor, lamps and places.
const HOME_STORY_COVER: Record<string, ImgKey> = {
  'meenakshi-muhurtham': 't_jasmine_garland',
  'golden-hour-chennai': 'm_decor_lights',
  'manjal-neerattu-thanjavur': 't_marigold_strings',
  'kodaikanal-mist': 'd_dindigul',
  'turmeric-henna-coimbatore': 'm_mehndi_hands',
  'nellai-lamps': 't_diya_glow',
}
const storyCover = (s: { slug: string; cover: ImgKey }) => HOME_STORY_COVER[s.slug] ?? s.cover

const HOME_EVENT_IMG: Record<EventKey, Bi<ImgKey>> = {
  wedding: { en: 'm_hands_rings', ta: 't_ritual_garland' },
  engagement: { en: 'm_ring_hands', ta: 't_ritual_offering' },
  reception: { en: 'm_rec_hall', ta: 't_lamp_many' },
  puberty: { en: 't_marigold_heap', ta: 't_manjal_pot' },
  earpiercing: { en: 't_jewel_set', ta: 't_temple_mandapam' },
  naming: { en: 'm_baby_hands', ta: 't_diya_hands' },
  birthday: { en: 'm_bday_candles', ta: 't_diya_many' },
  outdoor: { en: 'm_cam_silhouette', ta: 't_temple_frame' },
}

const HOME_MOSAIC: Bi<ImgKey[]> = {
  en: ['m_mehndi_saree', 'm_ring_box', 'm_rec_hall', 'm_ring_hands', 'm_bday_candles', 'm_decor_stage', 'm_ring_hold'],
  ta: ['t_jewel_set', 't_jasmine_bunch', 't_diya_rows', 't_meenakshi', 't_rangoli_diya', 't_temple_tank', 't_saree_red'],
}

export default function Home() {
  useDarkHero('hero')
  useTitle({ en: 'Wedding & Ceremony Photography in Tamil Nadu', ta: 'தமிழ்நாட்டில் திருமண & விழா புகைப்படக் கலை' })
  return (
    <>
      <Hero />
      <DistrictMarquee />
      <Manifesto />
      <DistrictGateway />
      <Stories />
      <Events />
      <Stats />
      <Process />
      <GalleryMosaic />
      <Tradition />
      <Testimonials />
    </>
  )
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function Hero() {
  const lang = useLang()
  const t = useT(copy)
  const slides = useStore(s => s.cms.heroSlides[lang])
  const [i, setI] = useState(0)
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 180])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0])
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 1.15])

  useEffect(() => setI(0), [lang])
  useEffect(() => {
    if (slides.length < 2) return
    const id = setInterval(() => setI(n => (n + 1) % slides.length), 6500)
    return () => clearInterval(id)
  }, [slides.length, i])

  const current = slides[i % Math.max(1, slides.length)] ?? 'm_couple_lights'
  const isKey = current in IMG
  const caption = GALLERY.find(g => g.img === current)

  return (
    <section ref={ref} className="relative min-h-[100svh] overflow-hidden bg-ink text-white md:h-[100svh] md:min-h-[680px]">
      <motion.div style={{ scale: imgScale }} className="absolute inset-0">
        <AnimatePresence initial={false}>
          <motion.div key={current + lang} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.6, ease: 'easeInOut' }}>
            <div className="animate-kenburns h-full w-full">
              {isKey ? <Img k={current as ImgKey} w={2400} sizes="100vw" priority dark className="h-full w-full" /> : <Img src={current} dark className="h-full w-full" />}
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/35 to-ink/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-transparent to-ink/40" />
      <div className="grain absolute inset-0" />

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        // In Tamil the temple skyline (height = max(110px, 14.4vw)) sits at the bottom, so content rests above it.
        className={`relative z-10 flex min-h-[100svh] items-end md:h-full md:min-h-0 ${lang === 'ta' ? 'pb-[calc(max(110px,14.4vw)+3.25rem)] md:pb-[calc(max(110px,14.4vw)+2rem)]' : 'pb-20 sm:pb-28 md:items-center md:pb-0'}`}
      >
        <Container wide>
          <div className={`max-w-4xl md:pt-24 ${lang === 'ta' ? 'pt-40' : 'pt-28'}`}>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.9, ease: EASE }} className="flex items-center gap-3 md:gap-4">
              <TamilOnly><Vilakku height={54} tone="white" className="h-11 w-auto md:h-[54px]" /></TamilOnly>
              <Eyebrow dark>
                <span>
                  {t.eyebrow.split(' · ').map((part, n, all) => (
                    <Fragment key={part}>
                      <span className="whitespace-nowrap">{part}{n < all.length - 1 ? ' ·' : ''}</span>
                      {n < all.length - 1 && ' '}
                    </Fragment>
                  ))}
                </span>
              </Eyebrow>
            </motion.div>
            <h1 className="t-hero t-hero-home mt-4 md:mt-6" aria-label={`${t.heroA} ${t.heroB} ${t.heroC}`}>
              {[t.heroA, t.heroB, t.heroC].map((line, n) => (
                <span key={line + n} className="block overflow-hidden pb-[0.08em]" aria-hidden="true">
                  <motion.span
                    className={`block ${n === 1 ? 'italic-accent text-ruby-bright' : ''}`}
                    initial={{ y: '110%' }}
                    animate={{ y: '0%' }}
                    transition={{ duration: 1.3, delay: 0.4 + n * 0.13, ease: EASE }}
                  >
                    {line}
                  </motion.span>
                </span>
              ))}
            </h1>
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 1, ease: EASE }} className="t-lead mt-5 max-w-xl text-white/70 md:mt-7">
              {t.heroLead}
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.15, duration: 1, ease: EASE }} className="mt-8 grid gap-3 sm:flex sm:flex-wrap md:mt-9">
              <Button to="/book" size="lg" icon="arrowRight" className="w-full sm:w-auto">{t.quote}</Button>
              <Button to="/gallery" size="lg" variant="glass-dark" className="w-full sm:w-auto">{t.explore}</Button>
            </motion.div>
          </div>
        </Container>
      </motion.div>

      {slides.length > 1 && (
        <div className={`absolute inset-x-5 z-10 flex gap-1.5 md:hidden ${lang === 'ta' ? 'bottom-[calc(max(110px,14.4vw)+0.25rem)]' : 'bottom-5'}`}>
          {slides.map((s, n) => (
            <button key={s + n} type="button" onClick={() => setI(n)} aria-label={`Slide ${n + 1}`} className="flex h-6 flex-1 items-center cursor-pointer">
              <span className="block h-[2px] w-full overflow-hidden rounded-full bg-white/25">
                {n === i && <motion.span key={i + lang} className="block h-full bg-white" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 6.5, ease: 'linear' }} />}
                {n < i && <span className="block h-full w-full bg-white/70" />}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Slide caption with story-style progress */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5, duration: 0.9, ease: EASE }} className={`absolute right-4 z-10 hidden w-72 md:right-8 md:block ${lang === 'ta' ? 'bottom-[calc(max(110px,14.4vw)+1.5rem)]' : 'bottom-6'}`}>
        <div className="glass-dark rounded-2xl p-4">
          <div className="mb-3 flex gap-1.5">
            {slides.map((s, n) => (
              <button key={s + n} type="button" onClick={() => setI(n)} aria-label={`Slide ${n + 1}`} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/20 cursor-pointer">
                {n === i && <motion.span key={i + lang} className="block h-full bg-white" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 6.5, ease: 'linear' }} />}
                {n < i && <span className="block h-full w-full bg-white/70" />}
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={current} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">{t.nowShowing}</p>
              <p className="mt-1 truncate font-display text-lg">{caption ? caption.title[lang] : '—'}</p>
              {caption && <p className="text-[12px] text-white/55">{districtName(caption.district, lang)}</p>}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      <TamilOnly>
        <GopuramSkyline className="pointer-events-none absolute inset-x-0 bottom-0 z-[5]" color="#ffffff" />
      </TamilOnly>
    </section>
  )
}

function DistrictMarquee() {
  const lang = useLang()
  const words = [...EVENTS.map(e => e.name[lang]), ...DISTRICTS.map(d => d.name[lang])]
  return (
    <div className="border-b border-ink/10 bg-white py-5 md:py-6">
      <Marquee speed={60}>
        {words.map((w, i) => (
          <span key={i} className="flex items-center">
            <span className="whitespace-nowrap px-5 font-display text-2xl text-ink/80 md:px-7 md:text-3xl">{w}</span>
            {lang === 'ta' ? <span className="grid grid-cols-2 gap-[3px]">{[0, 1, 2, 3].map(d => <span key={d} className="h-1 w-1 rounded-full bg-ruby" />)}</span> : <span className="h-1.5 w-1.5 rotate-45 bg-ruby" />}
          </span>
        ))}
      </Marquee>
    </div>
  )
}

function Manifesto() {
  const lang = useLang()
  const t = useT(copy)
  return (
    <section className="relative overflow-hidden py-20 md:py-40">
      <TamilOnly><Kolam size={220} className="pointer-events-none absolute -left-20 top-10 h-[160px] w-[160px] text-ruby/15 md:-left-16 md:top-16 md:h-[220px] md:w-[220px]" strokeWidth={0.8} /></TamilOnly>
      <Container className="relative">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Reveal><Eyebrow>{t.manifestoEyebrow}</Eyebrow></Reveal>
          <Reveal><ListenButton text={copy.listen} /></Reveal>
        </div>
        <ScrollText text={t.manifesto} className={`mt-6 font-display text-ink md:mt-8 md:text-[clamp(1.7rem,3.6vw,3.2rem)] md:leading-[1.22] ${lang === 'ta' ? 'text-[1.35rem] leading-[1.6]' : 'text-[1.7rem] leading-[1.22]'}`} />
        <Reveal delay={0.1} className="mt-10 md:mt-12">
          <Link to="/about" className="group inline-flex items-center gap-2 border-b border-ink/20 pb-1 pt-2 text-sm md:pt-0 font-medium transition hover:border-ruby hover:text-ruby">
            {lang === 'ta' ? 'எங்கள் கதை' : 'Our story'}
            <Icon name="arrowRight" size={15} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </Container>
    </section>
  )
}

// ─── District gateway (PRD: pick a district before booking) ──────────────────

function DistrictGateway() {
  const lang = useLang()
  const t = useT(copy)
  const navigate = useNavigate()
  const updateDraft = useStore(s => s.updateDraft)
  const choose = (key: DistrictKey) => {
    updateDraft({ district: key as DistrictKey })
    navigate('/book/event')
  }
  return (
    <section className="relative overflow-hidden bg-mist py-20 md:py-32">
      <div className="ambient absolute inset-0" />
      <Container wide className="relative">
        <SectionHeading eyebrow={t.districtEyebrow} title={t.districtTitle} lead={t.districtLead} />
        <Stagger className="mt-10 grid grid-cols-2 gap-3 md:mt-12 md:grid-cols-4 md:gap-4" gap={0.06}>
          {DISTRICTS.map((d, n) => (
            <StaggerItem key={d.key}>
              <button type="button" onClick={() => choose(d.key)} className={`group relative block w-full overflow-hidden rounded-3xl text-left cursor-pointer ${n === 0 ? 'aspect-[4/5] md:aspect-auto md:h-full' : 'aspect-[4/5]'}`}>
                <Img k={d.img} w={700} ratio={4 / 5} sizes="(max-width: 768px) 50vw, 25vw" className="absolute inset-0" imgClassName="transition-transform duration-[1.4s] ease-out group-hover:scale-[1.07]" />
                <span className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/5 to-transparent" />
                {n === 0 && <span className="glass-ruby absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold md:left-3 md:top-3 md:px-3 md:text-[11px]">{lang === 'ta' ? 'தலைமையகம்' : 'Head studio'}</span>}
                <span className="absolute inset-x-2.5 bottom-2.5 md:inset-x-3 md:bottom-3">
                  <span className="glass flex items-center justify-between gap-2 rounded-2xl px-3 py-2.5 transition-all md:px-3.5 md:py-3 duration-500 group-hover:bg-white/90">
                    <span className="min-w-0">
                      <span className="block font-display text-base leading-tight text-ink [overflow-wrap:anywhere] md:truncate md:text-xl">{d.name[lang]}</span>
                      <span className="mt-0.5 block truncate text-[11px] text-ink/55 md:mt-0 md:text-[11.5px]">{d.note[lang]}</span>
                    </span>
                    <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-white sm:flex transition-colors duration-300 group-hover:bg-ruby">
                      <Icon name="arrowUpRight" size={15} />
                    </span>
                  </span>
                </span>
              </button>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  )
}

// ─── Stories: pinned horizontal scroll on desktop ────────────────────────────

function Stories() {
  const lang = useLang()
  const t = useT(copy)
  const stories = storiesForLang(lang)
  const section = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [distance, setDistance] = useState(0)
  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end end'] })
  const x = useTransform(scrollYProgress, [0, 1], [0, -distance])
  const xs = useSpring(x, { stiffness: 120, damping: 30, mass: 0.4 })

  useLayoutEffect(() => {
    const measure = () => {
      if (!track.current) return
      const desktop = window.innerWidth >= 1024
      setDistance(desktop ? Math.max(0, track.current.scrollWidth - window.innerWidth + 64) : 0)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [lang])

  return (
    <section ref={section} className="relative bg-ink text-white" style={{ height: distance ? `calc(100vh + ${distance}px)` : undefined }}>
      <div className={`${distance ? 'sticky top-0 h-screen' : ''} flex flex-col justify-center overflow-hidden py-20 md:py-24`}>
        <Container wide className="mb-8 flex items-end justify-between gap-6 md:mb-10">
          <div>
            <Reveal><Eyebrow dark>{t.storiesEyebrow}</Eyebrow></Reveal>
            <RevealText text={t.storiesTitle} className="t-1 mt-4 text-white" />
          </div>
          <Button to="/gallery" variant="outline-light" icon="arrowRight" className="max-md:hidden">{t.storiesAll}</Button>
        </Container>
        <motion.div ref={track} style={{ x: distance ? xs : 0 }} className={`flex gap-4 px-5 md:gap-5 md:px-8 ${distance ? '' : 'no-scrollbar snap-x snap-mandatory scroll-px-5 overflow-x-auto overscroll-x-contain md:scroll-px-8'}`}>
          {stories.map((s, n) => (
            <StoryCard key={s.slug} story={s} cover={storyCover(s)} index={n} className="w-[80vw] max-w-[340px] shrink-0 snap-start sm:w-[44vw] sm:max-w-none lg:w-[30vw] xl:w-[27vw]" />
          ))}
          <Link to="/gallery" className="group flex w-[56vw] max-w-[240px] shrink-0 snap-start flex-col sm:w-[30vw] sm:max-w-none items-center justify-center rounded-[28px] border border-white/15 px-4 text-center transition hover:border-white/40 lg:w-[20vw]">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-ruby transition-transform duration-500 group-hover:scale-110"><Icon name="arrowRight" size={24} /></span>
            <span className="t-3 mt-5 !text-white">{t.storiesAll}</span>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

// ─── Events list with cursor-following preview ───────────────────────────────

function Events() {
  const lang = useLang()
  const t = useT(copy)
  const [hover, setHover] = useState<number | null>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 220, damping: 26 })
  const sy = useSpring(my, { stiffness: 220, damping: 26 })
  const listRef = useRef<HTMLUListElement>(null)

  return (
    <section className="relative py-20 md:py-36">
      <Container>
        <div className="grid gap-10 md:grid-cols-[0.8fr_1.2fr] md:gap-12">
          <div className="md:sticky md:top-32 md:self-start">
            <SectionHeading eyebrow={t.eventsEyebrow} title={t.eventsTitle} />
            <Reveal delay={0.2}><Button to="/services" variant="outline" icon="arrowRight" className="mt-6 md:mt-8">{lang === 'ta' ? 'அனைத்துச் சேவைகள்' : 'All services'}</Button></Reveal>
          </div>
          <ul
            ref={listRef}
            className="relative border-t border-ink/10"
            onMouseMove={e => {
              const r = listRef.current?.getBoundingClientRect()
              if (!r) return
              mx.set(e.clientX - r.left)
              my.set(e.clientY - r.top)
            }}
            onMouseLeave={() => setHover(null)}
          >
            {EVENTS.map((ev, n) => (
              <li key={ev.key} onMouseEnter={() => setHover(n)}>
                <Reveal delay={n * 0.04}>
                  <Link to={`/book?event=${ev.key}`} className="group flex items-center gap-4 border-b border-ink/10 py-4 md:py-6">
                    <span className="hidden w-8 text-[12px] tabular-nums text-ink/35 md:block">{String(n + 1).padStart(2, '0')}</span>
                    <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl md:hidden">
                      <Img k={HOME_EVENT_IMG[ev.key][lang]} w={160} ratio={1} className="h-full w-full" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-[1.4rem] leading-tight transition-colors duration-300 group-hover:text-ruby md:text-[2.1rem]">{ev.name[lang]}</span>
                      <span className="mt-1 block text-[13px] leading-snug text-ink/50 md:mt-0.5 md:leading-normal">{ev.blurb[lang]}</span>
                    </span>
                    <span className="hidden text-right text-[13px] text-ink/50 sm:block">
                      {t.from}<br /><span className="text-base font-semibold text-ink">{formatINR(startingPrice(ev.key))}</span>
                    </span>
                    <Icon name="arrowUpRight" size={20} className="shrink-0 text-ink/30 transition-all duration-300 group-hover:rotate-45 group-hover:text-ruby" />
                  </Link>
                </Reveal>
              </li>
            ))}
            <AnimatePresence>
              {hover !== null && (
                <motion.div
                  className="pointer-events-none absolute left-0 top-0 z-10 hidden h-56 w-44 overflow-hidden rounded-2xl shadow-2xl md:block"
                  style={{ x: sx, y: sy, translateX: '-50%', translateY: '-110%' }}
                  initial={{ opacity: 0, scale: 0.8, rotate: -4 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.35, ease: EASE }}
                >
                  <AnimatePresence initial={false}>
                    <motion.img
                      key={hover + lang}
                      src={photoUrl(HOME_EVENT_IMG[EVENTS[hover].key][lang], 400, 500)}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                      initial={{ opacity: 0, scale: 1.1 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.45 }}
                    />
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </ul>
        </div>
      </Container>
    </section>
  )
}

function Stats() {
  const t = useT(copy)
  const stats = [
    { n: 1400, s: '+', label: t.stat1 },
    { n: 8, s: '', label: t.stat2 },
    { n: 960, s: '+', label: t.stat3 },
    { n: 4.9, s: '★', label: t.stat4, decimal: true },
  ]
  return (
    <section className="relative overflow-hidden bg-ink py-16 text-white md:py-28">
      <div className="ambient-dark absolute inset-0" />
      <TamilOnly><div className="kolam-bg-white absolute inset-0 opacity-[0.05]" /></TamilOnly>
      <Container className="relative grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-0 md:gap-y-12">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.08} className="border-l border-white/12 pl-4 md:pl-7">
            <p className="font-display text-[2.6rem] leading-none sm:text-5xl md:text-7xl">
              {s.decimal ? <span>4.9</span> : <Counter to={s.n} />}
              <span className="text-ruby-bright">{s.s}</span>
            </p>
            <p className="mt-2 text-[13px] leading-snug text-white/55 md:text-sm md:leading-normal">{s.label}</p>
          </Reveal>
        ))}
      </Container>
    </section>
  )
}

function Process() {
  const lang = useLang()
  const t = useT(copy)
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.8', 'end 0.6'] })
  const line = useTransform(scrollYProgress, [0, 1], [0, 1])
  return (
    <section className="py-20 md:py-36">
      <Container>
        <SectionHeading eyebrow={t.processEyebrow} title={t.processTitle} align="center" />
        <div ref={ref} className="relative mt-12 md:mt-16">
          <div className="absolute left-[27px] top-0 h-full w-px bg-ink/10 md:left-0 md:right-0 md:top-[27px] md:h-px md:w-full" />
          <motion.div style={{ scaleY: line }} className="absolute left-[27px] top-0 h-full w-px origin-top bg-ruby md:hidden" />
          <motion.div style={{ scaleX: line }} className="absolute left-0 right-0 top-[27px] hidden h-px origin-left bg-ruby md:block" />
          <ol className="relative grid gap-8 md:grid-cols-5 md:gap-6">
            {PROCESS.map((p, i) => (
              <Reveal as="li" key={i} delay={i * 0.1} className="flex gap-5 md:flex-col">
                <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-ink/10 bg-white text-ruby shadow-soft">
                  <Icon name={p.icon} size={22} />
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] font-semibold text-white">{i + 1}</span>
                </span>
                <span className="min-w-0 pt-3 md:pt-0">
                  <span className="t-3 block">{p[lang][0]}</span>
                  <span className="mt-2 block text-sm leading-relaxed text-ink/55">{p[lang][1]}</span>
                </span>
              </Reveal>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  )
}

function GalleryMosaic() {
  const lang = useLang()
  const t = useT(copy)
  const all = useGalleryItems()
  const items = HOME_MOSAIC[lang].map(id => all.find(i => i.id === id)).filter(i => i?.img).map(i => i!)
  const spans = ['col-span-2 row-span-2', '', '', 'md:row-span-2', '', 'md:col-span-2', '']
  return (
    <section className="bg-mist py-20 md:py-32">
      <Container wide>
        <div className="mb-10 flex flex-col items-start justify-between gap-6 md:mb-12 md:flex-row md:items-end">
          <SectionHeading eyebrow={t.galleryEyebrow} title={t.galleryTitle} />
          <Reveal><Button to="/gallery" variant="ink" icon="arrowRight">{t.galleryCta}</Button></Reveal>
        </div>
        <div className="grid auto-rows-[43vw] grid-cols-2 gap-3 md:auto-rows-[15vw] md:grid-cols-4 md:gap-4 xl:auto-rows-[210px]">
          {items.map((it, n) => (
            <ImageReveal key={it.id} delay={(n % 4) * 0.08} className={`rounded-2xl md:rounded-3xl ${spans[n]}`}>
              <Link to={`/gallery?photo=${it.id}`} className="group relative block h-full w-full">
                <Img k={it.img!} w={1000} sizes="(max-width: 768px) 50vw, 33vw" className="h-full w-full" imgClassName="transition-transform duration-[1.4s] group-hover:scale-[1.05]" />
                <span className="glass-dark absolute bottom-3 left-3 translate-y-2 rounded-full px-3 py-1.5 text-[12px] opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">{it.title[lang]}</span>
              </Link>
            </ImageReveal>
          ))}
        </div>
      </Container>
    </section>
  )
}

function Tradition() {
  const lang = useLang()
  const t = useT(copy)
  return (
    <section className="relative overflow-hidden py-20 md:py-36">
      <TamilOnly><Thoranam className="absolute inset-x-0 top-0 h-[46px]" /></TamilOnly>
      <Container wide className="grid items-center gap-16 md:grid-cols-2 md:gap-20">
        <div className="relative mr-4 md:mr-0">
          <ImageReveal className="aspect-[4/5] rounded-[28px] md:rounded-[32px]">
            <LangImg pair={{ en: 'm_mehndi_red', ta: 't_ritual_fire' }} w={1200} sizes="(max-width: 768px) 100vw, 50vw" className="h-full w-full" />
          </ImageReveal>
          <Reveal delay={0.3} className="absolute -bottom-6 -right-4 w-36 sm:w-44 md:-right-10 md:w-56">
            <div className="overflow-hidden rounded-2xl border-[5px] border-white shadow-2xl md:rounded-3xl md:border-[6px]">
              <LangImg pair={{ en: 'm_hands_mehndi', ta: 't_jasmine_garland' }} w={500} ratio={4 / 5} className="aspect-[4/5]" />
            </div>
          </Reveal>
          <TamilOnly>
            <div className="absolute -left-3 -top-8 md:-left-10"><Vilakku height={120} className="h-24 w-auto md:h-[120px]" /></div>
          </TamilOnly>
        </div>
        <div>
          <SectionHeading eyebrow={t.traditionEyebrow} title={t.traditionTitle} />
          <Reveal delay={0.15}><p className="t-lead mt-6 text-ink/60">{t.traditionBody}</p></Reveal>
          <Reveal delay={0.25}>
            <ul className="mt-7 grid grid-cols-2 gap-2.5 text-[13px] md:mt-8 md:gap-3 md:text-sm">
              {(lang === 'ta'
                ? ['மாலை மாற்றல்', 'கன்னிகாதானம்', 'தாலி கட்டுதல்', 'மஞ்சள் நீராட்டு', 'காதுகுத்து', 'பெயர் சூட்டு']
                : ['Maalai maatral', 'Kanyadaanam', 'Thaali tying', 'Manjal Neerattu', 'Kaadhu Kuthu', 'Peyar Soottu']
              ).map(r => (
                <li key={r} className="flex min-w-0 items-center gap-2 rounded-2xl border border-ink/10 px-3 py-3 leading-snug md:gap-2.5 md:px-4 md:leading-normal">
                  <span className="h-1.5 w-1.5 shrink-0 rotate-45 bg-ruby" />{r}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.35}><Button to="/services" variant="ink" icon="arrowRight" className="mt-8 md:mt-9">{t.traditionCta}</Button></Reveal>
        </div>
      </Container>
    </section>
  )
}

function Testimonials() {
  const lang = useLang()
  const t = useT(copy)
  const stories = storiesForLang(lang)
  const [i, setI] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setI(n => (n + 1) % stories.length), 7000)
    return () => clearInterval(id)
  }, [stories.length, i])
  const s = stories[i]
  return (
    <section className="relative overflow-hidden bg-ink py-20 text-white md:py-40">
      <AnimatePresence>
        <motion.div key={s.slug} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 0.35 }} exit={{ opacity: 0 }} transition={{ duration: 1.4 }}>
          <Img k={storyCover(s)} w={1600} dark className="h-full w-full scale-110 blur-sm" />
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 bg-ink/50" />
      <Container className="relative flex flex-col items-center text-center">
        <Eyebrow dark>{t.loveEyebrow}</Eyebrow>
        <div className="glass-dark mt-8 w-full max-w-4xl rounded-[28px] px-5 py-10 md:mt-10 md:rounded-[32px] md:px-16 md:py-16">
          <Ornament dark className="mb-6 md:mb-8" />
          <AnimatePresence mode="wait">
            <motion.figure key={s.slug + lang} initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -10, filter: 'blur(6px)' }} transition={{ duration: 0.7, ease: EASE }}>
              <blockquote className="t-2 text-white">“{s.quote[lang]}”</blockquote>
              <figcaption className="mt-6 text-sm text-white/60 md:mt-8">
                <span className="font-semibold text-white">{s.quoteBy[lang]}</span> · <Link to={`/gallery/${s.slug}`} className="underline-offset-4 hover:underline">{s.title[lang]}</Link>
              </figcaption>
            </motion.figure>
          </AnimatePresence>
          <div className="mt-7 flex justify-center md:mt-10">
            {stories.map((x, n) => (
              <button key={x.slug} type="button" onClick={() => setI(n)} aria-label={x.names[lang]} className="group/dot flex h-8 items-center px-1 cursor-pointer md:h-auto">
                <span className={`block h-1.5 rounded-full transition-all duration-500 ${n === i ? 'w-8 bg-ruby' : 'w-1.5 bg-white/30 group-hover/dot:bg-white/60'}`} />
              </button>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
