import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { AnimatePresence, motion, useScroll, useTransform } from 'motion/react'
import { useLenis } from 'lenis/react'
import { Icon } from '../components/Icon'
import { Button, Container, Eyebrow, Img, Segmented } from '../components/ui'
import { EASE, Reveal, RevealText } from '../components/motion'
import { GopuramSkyline, Kolam, Ornament, TamilOnly } from '../components/tamil'
import { Lightbox } from '../components/Lightbox'
import { StoryCard, itemRatio, toLightbox, useGalleryItems } from '../components/gallery'
import { DISTRICTS, districtName, type DistrictKey } from '../lib/data'
import { GALLERY_CATS, STORIES, storiesForLang, type GalleryCat, type GalleryItem } from '../lib/gallery'
import { photoUrl } from '../lib/images'
import { formatDate, useLang, useT } from '../lib/i18n'
import { useStore } from '../lib/store'
import { toast, useDarkHero, useTitle, useUi } from '../lib/ui'

const copy = {
  eyebrow: { en: 'Portfolio · 2018 — 2026', ta: 'எங்கள் படைப்புகள் · 2018 — 2026' },
  the: { en: 'the', ta: '' },
  title: { en: 'Gallery', ta: 'காட்சியகம்' },
  lead: { en: 'frames from weddings, rituals and quiet in-between moments across eight districts of Tamil Nadu.', ta: 'படங்கள் — தமிழ்நாட்டின் எட்டு மாவட்டங்களில் திருமணங்கள், சடங்குகள், இடைப்பட்ட அமைதியான தருணங்கள்.' },
  scroll: { en: 'Scroll to explore', ta: 'கீழே உருட்டுங்கள்' },
  featured: { en: 'Featured story', ta: 'சிறப்புக் கதை' },
  viewStory: { en: 'View the story', ta: 'கதையைப் பார்க்க' },
  photos: { en: 'photos', ta: 'படங்கள்' },
  guests: { en: 'guests', ta: 'விருந்தினர்' },
  storiesEyebrow: { en: 'Stories', ta: 'கதைகள்' },
  storiesTitle: { en: 'Whole days, told in order.', ta: 'முழு நாள், வரிசையாகச் சொல்லப்பட்ட கதை.' },
  archiveEyebrow: { en: 'The archive', ta: 'படக் களஞ்சியம்' },
  archiveTitle: { en: 'Every frame, a keepsake.', ta: 'ஒவ்வொரு படமும் ஒரு பொக்கிஷம்.' },
  archiveLead: { en: 'Filter by occasion or district. Tap the heart on anything you love to build a moodboard, then send it with your enquiry.', ta: 'விழா அல்லது மாவட்டம் வாரியாகத் தேடுங்கள். பிடித்த படங்களில் இதயத்தைத் தொட்டு மனப்பலகை உருவாக்கி, பதிவுடன் அனுப்புங்கள்.' },
  allDistricts: { en: 'All districts', ta: 'அனைத்து மாவட்டங்கள்' },
  moodboard: { en: 'Moodboard', ta: 'மனப்பலகை' },
  masonry: { en: 'Masonry', ta: 'சுவர்' },
  grid: { en: 'Grid', ta: 'கட்டம்' },
  frames: { en: 'frames', ta: 'படங்கள்' },
  emptyMood: { en: 'Your moodboard is empty', ta: 'உங்கள் மனப்பலகை காலியாக உள்ளது' },
  emptyMoodBody: { en: 'Tap the heart on any photo to save it here.', ta: 'எந்தப் படத்திலும் இதயத்தைத் தொட்டு இங்கே சேமியுங்கள்.' },
  emptyFilter: { en: 'Nothing here yet', ta: 'இங்கு இன்னும் எதுவும் இல்லை' },
  emptyFilterBody: { en: 'Try another district or occasion.', ta: 'வேறு மாவட்டம் அல்லது விழாவைத் தேர்ந்தெடுங்கள்.' },
  reset: { en: 'Show everything', ta: 'அனைத்தையும் காட்டு' },
  saved: { en: 'saved', ta: 'சேமிக்கப்பட்டவை' },
  send: { en: 'Send with enquiry', ta: 'பதிவுடன் அனுப்பு' },
  clear: { en: 'Clear', ta: 'அழி' },
  sentMood: { en: 'Moodboard attached to your booking', ta: 'மனப்பலகை உங்கள் பதிவுடன் இணைக்கப்பட்டது' },
  save: { en: 'Save to moodboard', ta: 'மனப்பலகையில் சேர்' },
  ctaTitle: { en: 'See yourself in these frames?', ta: 'இந்தப் படங்களில் உங்களைக் காண்கிறீர்களா?' },
  ctaBody: { en: 'Tell us your date and district — your quote is ready in a minute.', ta: 'தேதியும் மாவட்டமும் சொல்லுங்கள் — ஒரு நிமிடத்தில் கட்டண மதிப்பீடு.' },
  cta: { en: 'Check my date', ta: 'என் தேதியைச் சரிபார்' },
}

const PAGE = 24

export default function Gallery() {
  useDarkHero('page')
  useTitle({ en: 'Gallery', ta: 'காட்சியகம்' })
  const lang = useLang()
  const t = useT(copy)
  const items = useGalleryItems()
  const stories = storiesForLang(lang)
  const mood = useStore(s => s.moodboard)
  const lenis = useLenis()
  const [params, setParams] = useSearchParams()

  const cat = (params.get('cat') as GalleryCat | null) ?? 'all'
  const district = (params.get('district') as DistrictKey | null) ?? 'all'
  const moodOnly = params.get('view') === 'mood'
  const [layout, setLayout] = useState<'masonry' | 'grid'>('masonry')
  const [limit, setLimit] = useState(PAGE)

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params)
    if (value === null) next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true, preventScrollReset: true })
  }

  const filtered = useMemo(
    () =>
      items.filter(
        i => (moodOnly ? mood.includes(i.id) : true) && (cat === 'all' || i.cat === cat) && (district === 'all' || i.district === district),
      ),
    [items, cat, district, moodOnly, mood],
  )

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: 0 }
    for (const i of items) {
      if (district !== 'all' && i.district !== district) continue
      c.all++
      c[i.cat] = (c[i.cat] ?? 0) + 1
    }
    return c
  }, [items, district])

  useEffect(() => setLimit(PAGE), [cat, district, moodOnly, lang])

  // Lightbox index is derived from ?photo= so any frame can be linked to.
  const photoId = params.get('photo')
  const lbItems = useMemo(() => filtered.map(toLightbox), [filtered])
  const lbIndex = photoId ? lbItems.findIndex(i => i.id === photoId) : -1

  const jumpToArchive = (c?: GalleryCat) => {
    if (c) setParam('cat', c)
    lenis?.scrollTo('#archive', { offset: -20, duration: 1.4 })
  }

  return (
    <div className="bg-ink text-white">
      <WallHero items={items} count={items.length} storyCount={STORIES.length} onPick={jumpToArchive} />

      <FeaturedStory />

      {/* Stories rail */}
      <section className="relative py-16 md:py-32">
        <Container wide>
          <div className="mb-8 flex flex-col justify-between gap-6 md:mb-10 md:flex-row md:items-end">
            <div>
              <Reveal><Eyebrow dark>{t.storiesEyebrow}</Eyebrow></Reveal>
              <RevealText text={t.storiesTitle} className="t-2 mt-4 max-w-2xl text-white" />
            </div>
            <RailArrows targetId="stories-rail" />
          </div>
        </Container>
        <div id="stories-rail" className="no-scrollbar flex snap-x snap-mandatory scroll-pl-5 gap-4 overflow-x-auto scroll-smooth px-5 pb-4 md:scroll-pl-0 md:gap-6 md:px-8 xl:px-[max(2rem,calc((100vw-1440px)/2+2rem))]" data-lenis-prevent-wheel>
          {stories.map((s, i) => (
            <StoryCard key={s.slug} story={s} index={i} className="w-[78vw] shrink-0 snap-start sm:w-[46vw] md:w-[34vw] lg:w-[25vw] xl:w-[340px]" />
          ))}
        </div>
      </section>

      {/* Archive */}
      <section id="archive" className="relative pb-28">
        <TamilOnly><div className="kolam-bg-white pointer-events-none absolute inset-x-0 top-0 h-96 opacity-[0.05] [mask-image:linear-gradient(to_bottom,#000,transparent)]" /></TamilOnly>
        <Container wide className="relative">
          <div className="mb-8 grid gap-4 md:mb-10 md:grid-cols-[1.2fr_1fr] md:items-end md:gap-6">
            <div>
              <Reveal><Eyebrow dark>{t.archiveEyebrow}</Eyebrow></Reveal>
              <RevealText text={t.archiveTitle} className="t-1 mt-4 text-white" />
            </div>
            <Reveal delay={0.1}><p className="t-lead text-white/55 md:pb-2">{t.archiveLead}</p></Reveal>
          </div>
        </Container>

        <FilterBar
          cat={cat}
          counts={counts}
          district={district}
          moodOnly={moodOnly}
          moodCount={mood.length}
          layout={layout}
          total={filtered.length}
          onCat={c => { setParam('view', null); setParam('cat', c === 'all' ? null : c) }}
          onDistrict={d => setParam('district', d === 'all' ? null : d)}
          onMood={() => setParam('view', moodOnly ? null : 'mood')}
          onLayout={setLayout}
          labels={{ all: t.allDistricts, moodboard: t.moodboard, masonry: t.masonry, grid: t.grid, frames: t.frames }}
        />

        <Container wide className="mt-6 md:mt-8">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-24 text-center">
              <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-white/15 text-white/50"><Icon name={moodOnly ? 'heart' : 'image'} size={22} /></span>
              <p className="t-3">{moodOnly ? t.emptyMood : t.emptyFilter}</p>
              <p className="mt-2 text-sm text-white/50">{moodOnly ? t.emptyMoodBody : t.emptyFilterBody}</p>
              <Button variant="glass-dark" className="mt-7" onClick={() => setParams(new URLSearchParams(), { replace: true, preventScrollReset: true })}>{t.reset}</Button>
            </div>
          ) : layout === 'masonry' ? (
            <Masonry items={filtered.slice(0, limit)} onOpen={id => setParam('photo', id)} saveLabel={t.save} />
          ) : (
            <UniformGrid items={filtered.slice(0, limit)} onOpen={id => setParam('photo', id)} saveLabel={t.save} />
          )}
          {limit < filtered.length && <LoadMore onVisible={() => setLimit(l => l + PAGE)} />}
        </Container>
      </section>

      {/* Closing CTA */}
      <section className="relative overflow-hidden border-t border-white/10 py-20 md:py-32">
        <div className="ambient-dark absolute inset-0 opacity-70" />
        <Container className="relative flex flex-col items-center text-center">
          <Ornament dark className="mb-8" />
          <RevealText text={t.ctaTitle} className="t-1 max-w-3xl text-white" />
          <Reveal delay={0.15}><p className="t-lead mt-5 max-w-xl text-white/55">{t.ctaBody}</p></Reveal>
          <Reveal delay={0.25} className="mt-9 w-full sm:w-auto"><Button to="/book" size="lg" icon="arrowRight" className="w-full sm:w-auto">{t.cta}</Button></Reveal>
        </Container>
      </section>

      <MoodboardBar />

      <Lightbox
        items={lbItems}
        index={lbIndex >= 0 ? lbIndex : null}
        onIndex={i => setParam('photo', lbItems[i]?.id ?? null)}
        onClose={() => setParam('photo', null)}
        shareUrl={it => `${window.location.origin}${window.location.pathname}?photo=${it.id}`}
      />
    </div>
  )
}

// ─── Hero: an endless wall of drifting photo columns ─────────────────────────

function WallHero({ items, count, storyCount, onPick }: { items: GalleryItem[]; count: number; storyCount: number; onPick: (c?: GalleryCat) => void }) {
  const lang = useLang()
  const t = useT(copy)
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const titleY = useTransform(scrollYProgress, [0, 1], [0, 160])
  const titleOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])
  const wallScale = useTransform(scrollYProgress, [0, 1], [1, 1.12])

  const columns = useMemo(() => {
    const withImg = items.filter(i => i.img)
    return Array.from({ length: 6 }, (_, c) => withImg.filter((_, i) => i % 6 === c).slice(0, 7))
  }, [items])

  return (
    <section ref={ref} className="relative h-[100svh] min-h-[640px] overflow-hidden">
      <motion.div style={{ scale: wallScale }} className="absolute inset-[-4%] flex gap-3 md:gap-4" aria-hidden="true">
        {columns.map((col, c) => (
          <div key={c} className={`relative flex-1 ${c >= 3 ? 'hidden md:block' : ''} ${c >= 5 ? 'md:hidden lg:block' : ''}`}>
            <div className="animate-wall flex flex-col gap-3 md:gap-4" style={{ animationDuration: `${70 + (c % 3) * 22}s`, animationDirection: c % 2 ? 'reverse' : 'normal' }}>
              {[...col, ...col].map((it, i) => (
                <div key={i} className="overflow-hidden rounded-2xl" style={{ aspectRatio: Math.max(0.62, Math.min(1.4, itemRatio(it))) }}>
                  <img src={photoUrl(it.img!, 420)} alt="" loading={i < 4 ? 'eager' : 'lazy'} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </motion.div>

      <div className="absolute inset-0 bg-ink/55" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_50%,rgba(10,10,11,0.35),rgba(10,10,11,0.92))]" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-ink to-transparent" />
      <TamilOnly>
        <div className="kolam-bg-white absolute inset-0 opacity-[0.06]" />
        <GopuramSkyline className="absolute inset-x-0 bottom-0" color="#0a0a0b" />
      </TamilOnly>

      <motion.div style={{ y: titleY, opacity: titleOpacity }} className="relative z-10 flex h-full flex-col items-center justify-center px-5 pt-16 text-center">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: EASE }}>
          <Eyebrow dark>{t.eyebrow}</Eyebrow>
        </motion.div>
        <h1 className="mt-6 text-white">
          {t.the && (
            <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.3, ease: EASE }} className="block font-display text-3xl italic text-white/70 md:text-5xl">
              {t.the}
            </motion.span>
          )}
          <span className="block overflow-hidden pb-[0.1em]">
            <motion.span initial={{ y: '105%' }} animate={{ y: '0%' }} transition={{ duration: 1.2, delay: 0.35, ease: EASE }} className="t-hero block">
              {t.title}
            </motion.span>
          </span>
        </h1>
        {lang === 'ta' && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8, duration: 1 }} className="mt-2">
            <Kolam size={56} className="text-ruby-bright" />
          </motion.div>
        )}
        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.7, ease: EASE }} className="t-lead mt-6 max-w-xl text-white/70">
          <span className="font-semibold text-white">{count}</span> {t.lead}
          <span className="mt-1 block text-[13px] text-white/45">{storyCount} {lang === 'ta' ? 'முழுக் கதைகள்' : 'full stories'} · 8 {lang === 'ta' ? 'மாவட்டங்கள்' : 'districts'}</span>
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.9, ease: EASE }} className="mt-7 flex max-w-2xl flex-wrap justify-center gap-2 md:mt-9">
          {GALLERY_CATS.filter(c => c.key !== 'all').map(c => (
            <button key={c.key} type="button" onClick={() => onPick(c.key as GalleryCat)} className="glass-dark h-10 rounded-full px-4 text-[13px] font-medium text-white/85 transition hover:bg-white/15 hover:text-white cursor-pointer">
              {c.name[lang]}
            </button>
          ))}
        </motion.div>
      </motion.div>

      <motion.button
        type="button"
        onClick={() => onPick()}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-3 text-[12px] text-white/55 cursor-pointer md:flex"
      >
        {t.scroll}
        <span className="relative h-10 w-[1px] overflow-hidden bg-white/20">
          <motion.span className="absolute inset-x-0 top-0 h-4 bg-white" animate={{ y: [-16, 40] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }} />
        </span>
      </motion.button>
    </section>
  )
}

// ─── Featured story ──────────────────────────────────────────────────────────

function FeaturedStory() {
  const lang = useLang()
  const t = useT(copy)
  const story = storiesForLang(lang)[0]
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['-12%', '12%'])
  const scale = useTransform(scrollYProgress, [0, 0.5], [1.15, 1])
  const strip = story.images.slice(1, 4)

  return (
    <section className="relative pt-10 md:pt-16">
      <Container wide>
        <Reveal className="mb-5 flex items-center justify-between gap-4 md:mb-6">
          <Eyebrow dark>{t.featured}</Eyebrow>
          <span className="shrink-0 text-[13px] text-white/45">{formatDate(story.date, lang, { month: 'long', year: 'numeric' })}</span>
        </Reveal>
        <div ref={ref} className="relative overflow-hidden rounded-3xl md:rounded-[32px]">
          <Link to={`/gallery/${story.slug}`} className="group block">
            <div className="relative h-[74svh] min-h-[500px] overflow-hidden md:h-[78vh] md:min-h-[520px]">
              <AnimatePresence mode="wait">
                <motion.div key={story.slug} style={{ y, scale }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} className="absolute inset-[-12%_0]">
                  <Img k={story.cover} w={2000} sizes="100vw" dark className="h-full w-full" imgClassName="transition-transform duration-[2s] group-hover:scale-[1.03]" />
                </motion.div>
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-ink/10" />
            </div>

            <div className="absolute inset-x-3 bottom-3 flex flex-col gap-4 md:inset-x-8 md:bottom-8 md:flex-row md:items-end md:justify-between">
              <Reveal className="glass-dark max-w-xl rounded-[22px] p-5 md:rounded-[26px] md:p-8">
                <p className="text-[13px] text-white/55">{story.event[lang]} · {story.venue[lang]}</p>
                <p className="t-2 mt-2 text-white">{story.title[lang]}</p>
                <p className="mt-2 font-accent text-xl italic-accent text-white/75">{story.names[lang]}</p>
                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-white/55">
                  <span className="flex items-center gap-1.5"><Icon name="image" size={15} />{story.images.length} {t.photos}</span>
                  <span className="flex items-center gap-1.5"><Icon name="users" size={15} />{story.guests.toLocaleString('en-IN')} {t.guests}</span>
                  <span className="flex items-center gap-1.5"><Icon name="mapPin" size={15} />{districtName(story.district, lang)}</span>
                </div>
                <span className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-ruby px-5 text-sm font-semibold text-white transition group-hover:bg-ruby-bright sm:inline-flex sm:h-auto sm:w-auto sm:py-2.5 md:mt-6">
                  {t.viewStory}
                  <Icon name="arrowRight" size={16} className="transition-transform group-hover:translate-x-1" />
                </span>
              </Reveal>
              <div className="hidden gap-3 lg:flex">
                {strip.map((k, i) => (
                  <motion.div key={k} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.1, duration: 0.9, ease: EASE }} className="h-36 w-28 overflow-hidden rounded-2xl border border-white/15">
                    <Img k={k} w={300} ratio={0.78} dark className="h-full w-full" />
                  </motion.div>
                ))}
              </div>
            </div>
          </Link>
        </div>
      </Container>
    </section>
  )
}

function RailArrows({ targetId }: { targetId: string }) {
  const scroll = (d: number) => {
    const el = document.getElementById(targetId)
    if (el) el.scrollBy({ left: d * el.clientWidth * 0.7, behavior: 'smooth' })
  }
  return (
    <div className="hidden gap-2 md:flex">
      {(['chevronLeft', 'chevronRight'] as const).map((n, i) => (
        <button key={n} type="button" aria-label={i ? 'Next' : 'Previous'} onClick={() => scroll(i ? 1 : -1)} className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 text-white/75 transition hover:border-white/50 hover:text-white cursor-pointer">
          <Icon name={n} size={20} />
        </button>
      ))}
    </div>
  )
}

// ─── Filter bar ──────────────────────────────────────────────────────────────

function FilterBar({
  cat, counts, district, moodOnly, moodCount, layout, total, onCat, onDistrict, onMood, onLayout, labels,
}: {
  cat: string
  counts: Record<string, number>
  district: string
  moodOnly: boolean
  moodCount: number
  layout: 'masonry' | 'grid'
  total: number
  onCat: (c: string) => void
  onDistrict: (d: string) => void
  onMood: () => void
  onLayout: (l: 'masonry' | 'grid') => void
  labels: { all: string; moodboard: string; masonry: string; grid: string; frames: string }
}) {
  const lang = useLang()
  const navHidden = useUi(s => s.navHidden)
  const [open, setOpen] = useState(false)

  return (
    <div className="sticky z-30 px-5 transition-[top] duration-500 ease-out md:px-8" style={{ top: navHidden ? 12 : 84 }}>
      <div className="glass-dark mx-auto flex max-w-[1376px] items-center gap-2 rounded-full p-1.5">
        <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-1 overflow-x-auto" data-lenis-prevent>
          {GALLERY_CATS.map(c => {
            const active = !moodOnly && cat === c.key
            const n = counts[c.key] ?? 0
            if (c.key !== 'all' && n === 0) return null
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => onCat(c.key)}
                className={`relative h-10 shrink-0 rounded-full px-4 text-[13px] font-medium transition-colors cursor-pointer ${active ? 'text-ink' : 'text-white/70 hover:text-white'}`}
              >
                {active && <motion.span layoutId="gal-cat" className="absolute inset-0 -z-10 rounded-full bg-white" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
                <span className="relative">{c.name[lang]}</span>
                <span className={`relative ml-1.5 text-[11px] tabular-nums ${active ? 'text-ink/45' : 'text-white/35'}`}>{n}</span>
              </button>
            )
          })}
        </div>

        <div className="relative hidden shrink-0 md:block">
          <button type="button" onClick={() => setOpen(o => !o)} className="flex h-10 items-center gap-2 rounded-full border border-white/12 px-4 text-[13px] font-medium text-white/80 transition hover:border-white/30 cursor-pointer" aria-expanded={open}>
            <Icon name="mapPin" size={15} />
            {district === 'all' ? labels.all : districtName(district, lang)}
            <Icon name="chevronDown" size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {open && (
              <motion.ul
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="glass-dark absolute right-0 top-12 w-56 origin-top-right rounded-2xl p-1.5"
                onMouseLeave={() => setOpen(false)}
              >
                {[{ key: 'all', name: { en: labels.all, ta: labels.all } }, ...DISTRICTS].map(d => (
                  <li key={d.key}>
                    <button type="button" onClick={() => { onDistrict(d.key); setOpen(false) }} className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[13px] transition cursor-pointer ${district === d.key ? 'bg-white/12 text-white' : 'text-white/70 hover:bg-white/8 hover:text-white'}`}>
                      {d.name[lang]}
                      {district === d.key && <Icon name="check" size={14} className="text-ruby-bright" />}
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        <button
          type="button"
          onClick={onMood}
          aria-pressed={moodOnly}
          className={`flex h-10 shrink-0 items-center gap-2 rounded-full px-3.5 text-[13px] font-medium transition cursor-pointer ${moodOnly ? 'bg-ruby text-white' : 'border border-white/12 text-white/80 hover:border-white/30'}`}
        >
          <Icon name="heart" size={15} className={moodCount > 0 ? 'fill-current' : ''} />
          <span className="hidden sm:inline">{labels.moodboard}</span>
          <span className="tabular-nums">{moodCount}</span>
        </button>

        <Segmented
          dark
          size="sm"
          className="shrink-0 max-lg:hidden"
          value={layout}
          onChange={onLayout}
          options={[
            { value: 'masonry', label: <span className="flex items-center gap-1.5"><Icon name="rows" size={13} />{labels.masonry}</span> },
            { value: 'grid', label: <span className="flex items-center gap-1.5"><Icon name="grid" size={13} />{labels.grid}</span> },
          ]}
        />
        <span className="hidden shrink-0 pr-3 text-[12px] tabular-nums text-white/40 xl:block">{total} {labels.frames}</span>
      </div>

      {/* District chips on small screens */}
      <div className="no-scrollbar -mx-5 mt-2 flex gap-1.5 overflow-x-auto px-5 md:hidden" data-lenis-prevent>
        {[{ key: 'all', name: { en: labels.all, ta: labels.all } }, ...DISTRICTS].map(d => (
          <button key={d.key} type="button" onClick={() => onDistrict(d.key)} className={`h-9 shrink-0 rounded-full px-3.5 text-[12.5px] font-medium transition cursor-pointer ${district === d.key ? 'bg-white text-ink' : 'glass-dark text-white/70'}`}>
            {d.name[lang]}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Grids ───────────────────────────────────────────────────────────────────

function useColumns() {
  const [cols, setCols] = useState(() => (typeof window === 'undefined' ? 4 : window.innerWidth < 640 ? 2 : window.innerWidth < 1024 ? 3 : 4))
  useEffect(() => {
    const on = () => setCols(window.innerWidth < 640 ? 2 : window.innerWidth < 1024 ? 3 : 4)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return cols
}

/** Distributes photos into the shortest column so real aspect ratios tile cleanly. */
function Masonry({ items, onOpen, saveLabel }: { items: GalleryItem[]; onOpen: (id: string) => void; saveLabel: string }) {
  const cols = useColumns()
  const columns = useMemo(() => {
    const out: GalleryItem[][] = Array.from({ length: cols }, () => [])
    const heights = new Array(cols).fill(0)
    for (const it of items) {
      const c = heights.indexOf(Math.min(...heights))
      out[c].push(it)
      heights[c] += 1 / itemRatio(it)
    }
    return out
  }, [items, cols])

  return (
    <div className="flex gap-3 md:gap-4">
      {columns.map((col, c) => (
        <div key={c} className="flex min-w-0 flex-1 flex-col gap-3 md:gap-4">
          <AnimatePresence mode="popLayout" initial={false}>
            {col.map((it, i) => (
              <Tile key={it.id} item={it} index={i + c} onOpen={onOpen} saveLabel={saveLabel} ratio={itemRatio(it)} />
            ))}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}

function UniformGrid({ items, onOpen, saveLabel }: { items: GalleryItem[]; onOpen: (id: string) => void; saveLabel: string }) {
  return (
    <motion.div layout className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3 xl:grid-cols-5">
      <AnimatePresence mode="popLayout" initial={false}>
        {items.map((it, i) => (
          <Tile key={it.id} item={it} index={i} onOpen={onOpen} saveLabel={saveLabel} ratio={4 / 5} compact />
        ))}
      </AnimatePresence>
    </motion.div>
  )
}

function Tile({ item, index, onOpen, saveLabel, ratio, compact = false }: { item: GalleryItem; index: number; onOpen: (id: string) => void; saveLabel: string; ratio: number; compact?: boolean }) {
  const lang = useLang()
  const saved = useStore(s => s.moodboard.includes(item.id))
  const toggleMood = useStore(s => s.toggleMood)
  const cat = GALLERY_CATS.find(c => c.key === item.cat)?.name[lang]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 40, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.25 } }}
      viewport={{ once: true, margin: '0px 0px -6% 0px' }}
      transition={{ duration: 0.9, delay: (index % 4) * 0.06, ease: EASE, layout: { duration: 0.6, ease: EASE } }}
      className={`group relative overflow-hidden bg-ink-2 ${compact ? 'rounded-xl' : 'rounded-2xl'}`}
      style={{ aspectRatio: ratio }}
    >
      <button type="button" onClick={() => onOpen(item.id)} className="absolute inset-0 block h-full w-full cursor-zoom-in" aria-label={item.title[lang]}>
        <Img
          k={item.img}
          src={item.url}
          w={compact ? 500 : 800}
          ratio={compact ? ratio : undefined}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          dark
          className="h-full w-full"
          imgClassName="transition-transform duration-[1.2s] ease-out group-hover:scale-[1.05]"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-ink/75 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        {!compact && (
          <span className="absolute inset-x-2 bottom-2 translate-y-3 opacity-0 transition-all duration-500 ease-out group-hover:translate-y-0 group-hover:opacity-100">
            <span className="glass-dark block rounded-xl px-3.5 py-2.5 text-left">
              <span className="block truncate font-display text-[17px] leading-tight text-white">{item.title[lang]}</span>
              <span className="mt-0.5 block truncate text-[11.5px] text-white/55">{districtName(item.district, lang)} · {cat}</span>
            </span>
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={() => toggleMood(item.id)}
        aria-label={saveLabel}
        aria-pressed={saved}
        className={`absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 cursor-pointer ${
          saved ? 'bg-ruby text-white opacity-100 shadow-ruby' : 'glass-dark text-white opacity-100 md:opacity-0 md:group-hover:opacity-100'
        }`}
      >
        <motion.span key={String(saved)} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}>
          <Icon name="heart" size={16} className={saved ? 'fill-current' : ''} />
        </motion.span>
      </button>
    </motion.div>
  )
}

function LoadMore({ onVisible }: { onVisible: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && onVisible(), { rootMargin: '600px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [onVisible])
  return (
    <div ref={ref} className="flex justify-center py-12">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/15 border-t-ruby" />
    </div>
  )
}

// ─── Moodboard bar ───────────────────────────────────────────────────────────

function MoodboardBar() {
  const t = useT(copy)
  const mood = useStore(s => s.moodboard)
  const clearMood = useStore(s => s.clearMood)
  const updateDraft = useStore(s => s.updateDraft)
  const notes = useStore(s => s.draft.notes)
  const navigate = useNavigate()
  const items = useGalleryItems()
  const saved = mood.map(id => items.find(i => i.id === id)).filter(Boolean) as GalleryItem[]

  const send = () => {
    const line = `Moodboard: ${saved.map(s => s.title.en).join(', ')}`
    updateDraft({ notes: notes.includes('Moodboard:') ? notes.replace(/Moodboard:.*$/m, line) : [notes, line].filter(Boolean).join('\n') })
    toast(t.sentMood, 'ruby')
    navigate('/book')
  }

  return (
    <AnimatePresence>
      {saved.length > 0 && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="fixed inset-x-0 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-3 sm:bottom-4"
        >
          <div className="glass-dark flex w-full max-w-md items-center gap-3 rounded-full py-2 pl-2 pr-2 shadow-2xl sm:w-auto sm:max-w-none">
            <div className="flex shrink-0 -space-x-3">
              <AnimatePresence initial={false}>
                {saved.slice(-4).map((s, i, arr) => (
                  <motion.span key={s.id} layout initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className={`h-10 w-10 overflow-hidden rounded-full border-2 border-ink ${i < arr.length - 2 ? 'hidden sm:block' : ''}`}>
                    <img src={s.img ? photoUrl(s.img, 90, 90) : s.url} alt="" className="h-full w-full object-cover" />
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
            <span className="min-w-0 flex-1 truncate text-[13px] text-white/80 sm:flex-none">
              <span className="font-semibold text-white tabular-nums">{saved.length}</span> {t.saved}
            </span>
            <button type="button" onClick={clearMood} className="hidden rounded-full px-3 py-2 text-[13px] text-white/55 transition hover:text-white sm:block cursor-pointer">{t.clear}</button>
            <button type="button" onClick={send} className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-ruby px-4 text-[13px] font-semibold text-white transition hover:bg-ruby-bright cursor-pointer">
              {t.send}
              <Icon name="arrowRight" size={15} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
