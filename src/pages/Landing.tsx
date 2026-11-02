import { useMemo } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { motion } from 'motion/react'
import { Icon } from '../components/Icon'
import { Button, Container, Eyebrow, Img, LangImg, SectionHeading } from '../components/ui'
import { EASE, Reveal, RevealText } from '../components/motion'
import { Ornament, TamilOnly, TempleBorder } from '../components/tamil'
import { DISTRICTS, DISTRICT_FACTS, eventByKey, type DistrictKey, type EventKey } from '../lib/data'
import { EVENT_GALLERY_CAT, eventGallery } from '../lib/gallery'
import { EVENT_LANDING, landingCopy, type LandingCopy } from '../lib/landing'
import { LANDING_EVENTS, breadcrumbJsonLd, faqJsonLd, jsonLdString, landingPath, parseLandingSlug, serviceJsonLd } from '../lib/seo'
import { formatINR, useLang, useT, type Lang } from '../lib/i18n'
import { usePrices, useStore } from '../lib/store'
import { useDarkHero, useSeo, useTitle } from '../lib/ui'
import NotFound from './NotFound'

const copy = {
  home: { en: 'Home', ta: 'முகப்பு' },
  areas: { en: 'Areas we cover', ta: 'நாங்கள் வரும் இடங்கள்' },
  check: { en: 'Check your date', ta: 'தேதியைப் பாருங்கள்' },
  whatsapp: { en: 'WhatsApp us', ta: 'வாட்ஸ்அப்' },
  from: { en: 'Packages from', ta: 'தொகுப்புகள்' },
  fromSuffix: { en: '', ta: 'முதல்' },
  covered: { en: 'What we cover', ta: 'நாங்கள் படம்பிடிப்பவை' },
  local: { en: 'Close to home', ta: 'உங்கள் ஊரிலேயே' },
  towns: { en: 'Towns we cover', ta: 'நாங்கள் வரும் ஊர்கள்' },
  places: { en: 'Well-known backdrops', ta: 'பிரபலமான பின்னணிகள்' },
  travel: { en: 'Travel', ta: 'பயணம்' },
  packages: { en: 'Packages and prices', ta: 'தொகுப்புகளும் விலையும்' },
  packagesLead: { en: 'One 4-hour session, before travel. Change anything in the package when you book.', ta: 'ஒரு 4 மணி நேரத்துக்கு, பயணம் தனி. பதிவு செய்யும்போது தொகுப்பில் எதையும் மாற்றலாம்.' },
  toConfirm: { en: 'price to confirm', ta: 'விலை உறுதி செய்ய வேண்டும்' },
  choose: { en: 'Choose this', ta: 'இதைத் தேர்ந்தெடுங்கள்' },
  work: { en: 'From our work', ta: 'எங்கள் படங்களிலிருந்து' },
  seeAll: { en: 'See the gallery', ta: 'காட்சியகத்தைப் பாருங்கள்' },
  faq: { en: 'Questions families ask', ta: 'குடும்பங்கள் கேட்கும் கேள்விகள்' },
  otherDistricts: { en: 'Same event, other districts', ta: 'அதே நிகழ்வு, மற்ற மாவட்டங்கள்' },
  otherEvents: { en: 'More in', ta: 'மேலும்' },
  indexTitle: { en: 'Photography across\nTamil Nadu', ta: 'தமிழ்நாடு முழுவதும்\nபுகைப்படம்' },
  indexLead: {
    en: 'Eight districts, each with a local team. Pick your district and the function to see what we cover, what it costs and photos from our own work.',
    ta: 'எட்டு மாவட்டங்கள், ஒவ்வொன்றிலும் உள்ளூர்க் குழு. உங்கள் மாவட்டத்தையும் விழாவையும் தேர்ந்தெடுத்து, நாங்கள் படம்பிடிப்பவை, விலை, எங்கள் படங்களைப் பாருங்கள்.',
  },
}

const INDEX_TITLE = { en: 'Photography across Tamil Nadu', ta: 'தமிழ்நாடு முழுவதும் புகைப்படம்' }
const INDEX_SEO = {
  en: 'Wedding and family-function photography in Madurai, Chennai, Coimbatore, Thanjavur, Salem, Tirunelveli, Theni and Dindigul, with local teams and clear prices.',
  ta: 'மதுரை, சென்னை, கோயம்புத்தூர், தஞ்சாவூர், சேலம், திருநெல்வேலி, தேனி, திண்டுக்கல்லில் திருமணமும் குடும்ப விழாக்களும்: உள்ளூர்க் குழு, தெளிவான விலை.',
}

/** Short link label for an event inside a district list: the H1 phrase without the place. */
const phrase = (e: EventKey, lang: Lang) => EVENT_LANDING[e]?.phrase[lang] ?? eventByKey(e)?.name[lang] ?? e

/** /photography/:district/:event — unknown slugs fall through to NotFound. */
export default function Landing() {
  const { district, event } = useParams()
  const parsed = parseLandingSlug(district, event)
  const prices = usePrices()
  const page = useMemo(() => (parsed ? landingCopy(parsed.district, parsed.event, prices) : null), [parsed?.district, parsed?.event, prices])
  useDarkHero(page ? 'hero' : false)
  useTitle(page ? page.h1 : { en: 'Page not found', ta: 'பக்கம் கிடைக்கவில்லை' })
  useSeo(page ? page.description : INDEX_SEO)
  if (!page) return <NotFound />
  return <LandingView key={`${page.district}/${page.event}`} page={page} />
}

/** /photography/:district has no page of its own; send it to the district's wedding page. */
export function DistrictRedirect() {
  const { district } = useParams()
  const d = DISTRICTS.find(x => x.key === district)
  if (!d) return <NotFound />
  return <Navigate to={landingPath(d.key, 'wedding')} replace />
}

function LandingView({ page }: { page: LandingCopy }) {
  const lang = useLang()
  const t = useT(copy)
  const wa = useStore(s => s.cms.studio.whatsapp).replace(/\D/g, '')
  const d = DISTRICTS.find(x => x.key === page.district)!
  const ev = eventByKey(page.event)!
  const path = landingPath(page.district, page.event)
  const bookHref = `/book?district=${page.district}&event=${page.event}`

  // This event's photos, the ones shot in this district first.
  const photos = useMemo(() => {
    const all = eventGallery(page.event, lang, 30).filter(g => g.img)
    return [...all.filter(g => g.district === page.district), ...all.filter(g => g.district !== page.district)].slice(0, 8)
  }, [page.event, page.district, lang])

  const jsonLd = useMemo(() => [
    breadcrumbJsonLd([
      { name: copy.home[lang], path: '/' },
      { name: copy.areas[lang], path: '/photography' },
      { name: page.h1[lang], path },
    ], lang),
    serviceJsonLd({ name: page.h1[lang], serviceType: page.serviceType, description: page.description[lang], area: d.name.en, path, lang, price: page.from }),
    faqJsonLd(page.faq.map(f => ({ q: f.q[lang], a: f.a[lang] }))),
  ].map(jsonLdString), [page, lang, path, d])

  return (
    <article>
      {jsonLd.map((s, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: s }} />)}

      {/* Hero */}
      <section className="relative min-h-[78svh] overflow-hidden bg-ink text-white md:min-h-[82vh]">
        <LangImg pair={ev.img} w={2400} sizes="100vw" priority dark className="absolute inset-0 h-full w-full opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-ink/30" />
        <Container wide className="relative flex min-h-[78svh] flex-col justify-end pb-12 pt-36 md:min-h-[82vh] md:pb-20">
          <motion.nav initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8, ease: EASE }} aria-label={lang === 'ta' ? 'பாதை' : 'Breadcrumb'}>
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-white/60">
              <li><Link to="/" className="hover:text-white">{t.home}</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link to="/photography" className="hover:text-white">{t.areas}</Link></li>
              <li aria-hidden="true">/</li>
              <li className="text-white/85">{d.name[lang]}</li>
            </ol>
          </motion.nav>
          <RevealText as="h1" text={page.h1[lang]} immediate delay={0.3} className="t-1 mt-5 max-w-4xl text-white" />
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.9, ease: EASE }} className="t-lead mt-5 max-w-2xl text-white/75">
            {page.intro[lang]}
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85, duration: 0.9, ease: EASE }} className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Button to={bookHref} size="lg" icon="arrowRight">{t.check}</Button>
            <Button href={`https://wa.me/${wa}`} size="lg" variant="glass-ruby" iconLeft="whatsapp">{t.whatsapp}</Button>
            {page.from !== undefined && (
              <p className="text-sm text-white/65 sm:ml-3">{t.from} <span className="font-semibold text-white">{formatINR(page.from)}</span> {t.fromSuffix}</p>
            )}
          </motion.div>
        </Container>
      </section>
      <TamilOnly><TempleBorder /></TamilOnly>

      {/* What we cover + the district */}
      <section className="py-16 md:py-28">
        <Container className="grid gap-12 md:grid-cols-2 md:gap-20">
          <div>
            <Reveal><Eyebrow>{t.covered}</Eyebrow></Reveal>
            <ul className="mt-6 space-y-4">
              {page.covers.map((c, i) => (
                <Reveal as="li" key={i} delay={i * 0.05} className="flex gap-3 text-[17px] text-ink/80">
                  <Icon name="check" size={18} className="mt-1 shrink-0 text-ruby" strokeWidth={2.2} />
                  {c[lang]}
                </Reveal>
              ))}
            </ul>
          </div>
          <div>
            <Reveal><Eyebrow>{t.local} · {d.name[lang]}</Eyebrow></Reveal>
            <Reveal delay={0.05}><p className="t-lead mt-6 text-ink/70">{page.local[lang]}</p></Reveal>
            <Reveal delay={0.1}>
              <p className="t-label mt-8 text-ink/45">{t.towns}</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {page.towns.map(x => <li key={x.en} className="rounded-full border border-ink/12 px-3.5 py-1.5 text-[13px] text-ink/70">{x[lang]}</li>)}
              </ul>
              <p className="t-label mt-6 text-ink/45">{t.places}</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {page.places.map(x => <li key={x.en} className="flex items-center gap-1.5 rounded-full border border-ink/12 px-3.5 py-1.5 text-[13px] text-ink/70"><Icon name="mapPin" size={13} className="text-ruby" />{x[lang]}</li>)}
              </ul>
              <p className="mt-6 flex gap-2.5 text-sm text-ink/60"><Icon name="truck" size={17} className="mt-0.5 shrink-0 text-ruby" /><span><span className="font-medium text-ink/80">{t.travel}: </span>{page.travel[lang]}</span></p>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Packages */}
      <section className="border-t border-ink/10 py-16 md:py-28">
        <Container>
          <SectionHeading eyebrow={ev.name[lang]} title={t.packages} lead={t.packagesLead} />
          <div className="mt-10 grid gap-4 md:mt-14 md:grid-cols-3 md:gap-6">
            {page.tiers.map((p, i) => (
              <Reveal key={p.tier} delay={i * 0.06} className="flex h-full flex-col rounded-3xl border border-ink/10 bg-white/60 p-6 md:p-7">
                <p className="t-label text-ink/45">{p.name[lang]}</p>
                <p className="mt-3 font-display text-4xl leading-none text-ink">{formatINR(p.price)}</p>
                {p.pending && <p className="mt-2 text-[12px] text-ruby">{t.toConfirm}</p>}
                <p className="mt-4 flex-1 text-[15px] leading-relaxed text-ink/60">{p.pitch[lang]}</p>
                <Button to={bookHref} variant="outline" icon="arrowRight" className="mt-6 self-start">{t.choose}</Button>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Photos */}
      {photos.length > 0 && (
        <section className="pb-16 md:pb-28">
          <Container className="flex items-end justify-between gap-4">
            <Reveal><Eyebrow>{t.work}</Eyebrow></Reveal>
            <Link to={`/gallery?cat=${EVENT_GALLERY_CAT[page.event]}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink/70 hover:text-ink">
              {t.seeAll} <Icon name="arrowRight" size={15} />
            </Link>
          </Container>
          <div className="no-scrollbar mt-6 flex snap-x snap-mandatory scroll-pl-4 gap-3 overflow-x-auto overscroll-x-contain px-4 pb-2 md:scroll-pl-[max(2rem,calc((100vw-80rem)/2))] md:gap-4 md:px-[max(2rem,calc((100vw-80rem)/2))]" data-lenis-prevent-wheel>
            {photos.map(g => (
              <Img key={g.id} k={g.img} alt={g.title[lang]} w={640} ratio={4 / 5} sizes="(min-width: 768px) 22vw, 64vw" className="w-[64vw] shrink-0 snap-start rounded-2xl sm:w-[40vw] md:w-[22vw]" />
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="border-t border-ink/10 py-16 md:py-28">
        <Container className="grid gap-10 md:grid-cols-[1fr_1.4fr] md:gap-20">
          <SectionHeading eyebrow={d.name[lang]} title={t.faq} />
          <div className="divide-y divide-ink/10 border-y border-ink/10">
            {page.faq.map((f, i) => (
              <details key={i} className="group py-5" open={i === 0}>
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-[17px] font-medium text-ink">
                  {f.q[lang]}
                  <Icon name="plus" size={18} className="mt-1 shrink-0 text-ruby transition-transform group-open:rotate-45" />
                </summary>
                <p className="mt-3 text-[15px] leading-relaxed text-ink/65">{f.a[lang]}</p>
              </details>
            ))}
          </div>
        </Container>
      </section>

      {/* Related pages */}
      <section className="border-t border-ink/10 py-16 md:py-24">
        <Container className="grid gap-10 md:grid-cols-2 md:gap-20">
          <nav aria-label={t.otherDistricts}>
            <p className="t-label text-ink/45">{t.otherDistricts}</p>
            <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-[15px]">
              {DISTRICTS.filter(x => x.key !== page.district).map(x => (
                <li key={x.key}><Link to={landingPath(x.key, page.event)} className="inline-flex min-h-11 items-center text-ink/70 hover:text-ruby md:min-h-0 md:py-1">{x.name[lang]}</Link></li>
              ))}
            </ul>
          </nav>
          <nav aria-label={`${t.otherEvents} ${d.name[lang]}`}>
            <p className="t-label text-ink/45">{t.otherEvents} · {d.name[lang]}</p>
            <ul className="mt-4 grid gap-x-6 gap-y-2 text-[15px] sm:grid-cols-2">
              {LANDING_EVENTS.filter(e => e !== page.event).map(e => (
                <li key={e}><Link to={landingPath(page.district, e)} className="inline-flex min-h-11 items-center text-ink/70 hover:text-ruby md:min-h-0 md:py-1">{phrase(e, lang)}</Link></li>
              ))}
            </ul>
          </nav>
        </Container>
        <Container className="mt-14 flex flex-col items-center text-center md:mt-20">
          <Ornament className="mb-6" />
          <Button to={bookHref} size="lg" icon="arrowRight">{t.check}</Button>
        </Container>
      </section>
    </article>
  )
}

/** /photography — every district with links to its event pages. */
export function PhotographyIndex() {
  const lang = useLang()
  const t = useT(copy)
  useTitle(INDEX_TITLE)
  useSeo(INDEX_SEO)
  const jsonLd = useMemo(() => jsonLdString(breadcrumbJsonLd([{ name: copy.home[lang], path: '/' }, { name: copy.areas[lang], path: '/photography' }], lang)), [lang])

  return (
    <div className="pb-16 pt-36 md:pb-28 md:pt-48">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <Container>
        <Reveal><Eyebrow>{t.areas}</Eyebrow></Reveal>
        <RevealText as="h1" text={t.indexTitle} immediate className="t-1 mt-4 max-w-4xl" />
        <Reveal delay={0.1}><p className="t-lead mt-6 max-w-2xl text-ink/60">{t.indexLead}</p></Reveal>

        <div className="mt-12 grid gap-4 md:mt-16 md:grid-cols-2 md:gap-6">
          {DISTRICTS.map((d, i) => <DistrictCard key={d.key} district={d.key} delay={(i % 2) * 0.06} />)}
        </div>
      </Container>
    </div>
  )
}

function DistrictCard({ district, delay }: { district: DistrictKey; delay: number }) {
  const lang = useLang()
  const d = DISTRICTS.find(x => x.key === district)!
  return (
    <Reveal delay={delay} as="section" className="overflow-hidden rounded-3xl border border-ink/10 bg-white/60">
      <Link to={landingPath(district, 'wedding')} className="group relative block h-40 overflow-hidden bg-ink md:h-48">
        <Img k={d.img} w={1000} sizes="(min-width: 768px) 45vw, 100vw" dark className="h-full w-full opacity-75" imgClassName="transition-transform duration-[1.6s] group-hover:scale-[1.04]" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          <h2 className="t-3">{d.name[lang]}</h2>
          <p className="mt-1 text-[13px] text-white/70">{d.note[lang]}</p>
        </div>
      </Link>
      <div className="p-5 md:p-6">
        <p className="text-[14px] leading-relaxed text-ink/60">{DISTRICT_FACTS[district].towns.map(x => x[lang]).join(' · ')}</p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {LANDING_EVENTS.map(e => (
            <li key={e}>
              <Link to={landingPath(district, e)} className="inline-flex min-h-10 items-center rounded-full border border-ink/12 px-3 py-1.5 text-[13px] text-ink/70 transition md:min-h-0 hover:border-ruby/50 hover:text-ruby">
                {eventByKey(e)!.name[lang]}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  )
}
