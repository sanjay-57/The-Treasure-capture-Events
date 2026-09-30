import { useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { motion, useScroll, useTransform } from 'motion/react'
import { Icon } from '../components/Icon'
import { Button, Container, Eyebrow, Img } from '../components/ui'
import { EASE, ImageReveal, Parallax, Reveal, RevealText, ScrollText } from '../components/motion'
import { KolamCorner, Ornament, TamilOnly, TempleBorder } from '../components/tamil'
import { Lightbox, type LightboxItem } from '../components/Lightbox'
import { CAT_TO_EVENT } from '../components/gallery'
import { ROLES, districtName } from '../lib/data'
import { GALLERY, STORIES } from '../lib/gallery'
import type { ImgKey } from '../lib/images'
import { formatDate, useLang, useT } from '../lib/i18n'
import { useStore } from '../lib/store'
import { useDarkHero, useTitle } from '../lib/ui'
import NotFound from './NotFound'

const copy = {
  back: { en: 'All stories', ta: 'அனைத்துக் கதைகள்' },
  date: { en: 'Date', ta: 'தேதி' },
  venue: { en: 'Venue', ta: 'இடம்' },
  guests: { en: 'Guests', ta: 'விருந்தினர்' },
  frames: { en: 'Frames', ta: 'படங்கள்' },
  crew: { en: 'Photographed by', ta: 'படம்பிடித்தவர்கள்' },
  next: { en: 'Next story', ta: 'அடுத்த கதை' },
  planTitle: { en: 'Plan a story like this', ta: 'இப்படி ஒரு கதையைத் திட்டமிடுங்கள்' },
  planBody: { en: 'The same crew and the same care — for your own family’s sacred day.', ta: 'அதே குழு, அதே அக்கறை — உங்கள் குடும்பத்தின் புனித நாளுக்காக.' },
  plan: { en: 'Begin your story', ta: 'உங்கள் கதையைத் தொடங்குங்கள்' },
}

type Block =
  | { kind: 'full'; k: ImgKey }
  | { kind: 'pair'; a: ImgKey; b: ImgKey }
  | { kind: 'trio'; a: ImgKey; b: ImgKey; c: ImgKey }
  | { kind: 'offset'; k: ImgKey }
  | { kind: 'quote' }

/** Composes a magazine rhythm from a flat list of photos. */
function compose(images: ImgKey[]): Block[] {
  const rest = images.slice(1)
  const out: Block[] = []
  const pattern: Block['kind'][] = ['pair', 'offset', 'quote', 'trio', 'full', 'pair', 'offset', 'trio']
  let i = 0
  for (const kind of pattern) {
    if (kind === 'quote') { out.push({ kind }); continue }
    const need = kind === 'pair' ? 2 : kind === 'trio' ? 3 : 1
    if (i + need > rest.length) continue
    const s = rest.slice(i, i + need)
    i += need
    if (kind === 'pair') out.push({ kind, a: s[0], b: s[1] })
    else if (kind === 'trio') out.push({ kind, a: s[0], b: s[1], c: s[2] })
    else out.push({ kind, k: s[0] } as Block)
  }
  while (i < rest.length) out.push({ kind: 'full', k: rest[i++] })
  if (!out.some(b => b.kind === 'quote')) out.splice(1, 0, { kind: 'quote' })
  return out
}

export default function Story() {
  const { slug } = useParams()
  const story = STORIES.find(s => s.slug === slug)
  useDarkHero(story ? 'hero' : false)
  useTitle(story ? story.title : { en: 'Story', ta: 'கதை' })
  if (!story) return <NotFound />
  return <StoryView key={story.slug} slug={story.slug} />
}

function StoryView({ slug }: { slug: string }) {
  const lang = useLang()
  const t = useT(copy)
  const workers = useStore(s => s.workers)
  const story = STORIES.find(s => s.slug === slug)!
  const next = STORIES[(STORIES.indexOf(story) + 1) % STORIES.length]
  const blocks = useMemo(() => compose(story.images), [story])
  const [open, setOpen] = useState<number | null>(null)

  const crew = useMemo(() => {
    const local = workers.filter(w => w.district === story.district)
    return (local.length ? local : workers).slice(0, 3)
  }, [workers, story.district])

  const lbItems: LightboxItem[] = story.images.map((k, i) => {
    const g = GALLERY.find(x => x.img === k)
    return {
      id: k,
      k,
      title: g?.title ?? story.title,
      meta: { en: `${story.names.en} · ${i + 1} / ${story.images.length}`, ta: `${story.names.ta} · ${i + 1} / ${story.images.length}` },
      bookHref: `/book?event=${g ? CAT_TO_EVENT[g.cat] : 'wedding'}&district=${story.district}`,
    }
  })
  const openKey = (k: ImgKey) => setOpen(story.images.indexOf(k))
  const bookHref = `/book?district=${story.district}`

  return (
    <article>
      <Hero storySlug={slug} />
      <TamilOnly><TempleBorder /></TamilOnly>

      {/* Intro */}
      <section className="relative py-16 md:py-36">
        <Container className="grid gap-10 md:grid-cols-[1fr_280px] md:gap-20">
          <div>
            <Reveal><Eyebrow>{story.event[lang]}</Eyebrow></Reveal>
            <ScrollText text={story.intro[lang]} className="mt-5 font-display text-[clamp(1.35rem,2.8vw,2.4rem)] leading-[1.35] text-ink md:mt-6 md:leading-[1.3]" />
          </div>
          <Reveal delay={0.1} className="self-start md:sticky md:top-32">
            <dl className="divide-y divide-ink/10 border-y border-ink/10 text-sm">
              {[
                [t.date, formatDate(story.date, lang, { day: 'numeric', month: 'long', year: 'numeric' })],
                [t.venue, story.venue[lang]],
                [t.guests, story.guests.toLocaleString('en-IN')],
                [t.frames, String(story.images.length)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-3.5">
                  <dt className="text-ink/45">{k}</dt>
                  <dd className="min-w-0 text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="t-label mt-7 text-ink/45 md:mt-8">{t.crew}</p>
            <ul className="mt-3 space-y-3">
              {crew.map(w => (
                <li key={w.id} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-[12px] font-semibold text-white">{w.name.en.split(' ').map(p => p[0]).join('').slice(0, 2)}</span>
                  <span className="leading-tight">
                    <span className="block text-sm font-medium">{w.name[lang]}</span>
                    <span className="block text-[12px] text-ink/50">{ROLES[w.role][lang]}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        </Container>
      </section>

      {/* Photo sequence */}
      <section className="space-y-3 pb-16 md:space-y-6 md:pb-36">
        {blocks.map((b, i) => (
          <BlockView key={i} block={b} onOpen={openKey} quote={story.quote[lang]} quoteBy={story.quoteBy[lang]} />
        ))}
      </section>

      {/* Plan CTA */}
      <section className="border-t border-ink/10 py-16 md:py-32">
        <Container className="flex flex-col items-center text-center">
          <Ornament className="mb-8" />
          <RevealText text={t.planTitle} className="t-1 max-w-3xl" />
          <Reveal delay={0.1}><p className="t-lead mt-5 max-w-xl text-ink/60">{t.planBody}</p></Reveal>
          <Reveal delay={0.2} className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-center md:mt-9">
            <Button to={bookHref} size="lg" icon="arrowRight">{t.plan}</Button>
            <Button to="/gallery" size="lg" variant="outline" iconLeft="arrowLeft">{t.back}</Button>
          </Reveal>
        </Container>
      </section>

      {/* Next story */}
      <Link to={`/gallery/${next.slug}`} className="group relative block h-[60svh] min-h-[420px] overflow-hidden bg-ink text-white md:h-[70vh] md:min-h-[440px]">
        <Parallax className="absolute inset-0" offset={60}>
          <Img k={next.cover} w={2000} sizes="100vw" dark className="h-full w-full opacity-60 transition-opacity duration-700 group-hover:opacity-80" imgClassName="transition-transform duration-[2s] group-hover:scale-[1.04]" />
        </Parallax>
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
        <Container className="relative flex h-full flex-col justify-end pb-12 md:pb-20">
          <Eyebrow dark>{t.next}</Eyebrow>
          <p className="t-1 mt-4 max-w-3xl">{next.title[lang]}</p>
          <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-accent text-xl italic-accent text-white/75">
            {next.names[lang]}
            <Icon name="arrowRight" size={22} className="transition-transform duration-500 group-hover:translate-x-2" />
          </p>
        </Container>
      </Link>

      <Lightbox items={lbItems} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />
    </article>
  )
}

function Hero({ storySlug }: { storySlug: string }) {
  const lang = useLang()
  const t = useT(copy)
  const story = STORIES.find(s => s.slug === storySlug)!
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const scale = useTransform(scrollYProgress, [0, 1], [1.05, 1.25])
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '18%'])
  const fade = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  return (
    <section ref={ref} className="relative h-[100svh] min-h-[620px] overflow-hidden bg-ink text-white">
      <motion.div style={{ scale, y }} className="absolute inset-0">
        <Img k={story.cover} w={2400} sizes="100vw" priority dark className="h-full w-full" />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/25 to-ink/40" />

      <motion.div style={{ opacity: fade }} className="relative flex h-full flex-col justify-end">
        <Container wide className="pb-10 md:pb-16">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8, ease: EASE }}>
            <Link to="/gallery" className="glass-dark mb-6 inline-flex h-10 items-center md:mb-8 gap-2 rounded-full px-4 text-[13px] text-white/85 transition hover:text-white">
              <Icon name="arrowLeft" size={15} /> {t.back}
            </Link>
          </motion.div>
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-[13px] font-medium text-white/60">
                {story.event[lang]} · {districtName(story.district, lang)}
              </motion.p>
              <RevealText as="h1" text={story.title[lang]} immediate delay={0.35} className="t-1 mt-3 max-w-4xl text-white" />
              <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.9, ease: EASE }} className="mt-4 font-accent text-2xl italic-accent text-white/80 md:text-3xl">
                {story.names[lang]}
              </motion.p>
            </div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.9, ease: EASE }} className="glass-dark hidden rounded-3xl px-6 py-5 text-sm md:block">
              <p className="text-white/50">{formatDate(story.date, lang, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p className="mt-1 font-medium">{story.venue[lang]}</p>
            </motion.div>
          </div>
        </Container>
      </motion.div>
    </section>
  )
}

function Frame({ k, onOpen, className = '', ratio, sizes = '100vw' }: { k: ImgKey; onOpen: (k: ImgKey) => void; className?: string; ratio?: number; sizes?: string }) {
  return (
    <ImageReveal className={`rounded-2xl md:rounded-3xl ${className}`}>
      <button type="button" onClick={() => onOpen(k)} className="group block h-full w-full cursor-zoom-in" aria-label="Open photo">
        <Img k={k} w={1600} ratio={ratio} sizes={sizes} className="h-full w-full" imgClassName="transition-transform duration-[1.4s] ease-out group-hover:scale-[1.03]" />
      </button>
    </ImageReveal>
  )
}

function BlockView({ block, onOpen, quote, quoteBy }: { block: Block; onOpen: (k: ImgKey) => void; quote: string; quoteBy: string }) {
  const lang = useLang()
  const wrap = (c: ReactNode, wide = false) => <Container wide={wide}>{c}</Container>
  switch (block.kind) {
    case 'full':
      return (
        <div className="px-5 md:px-6">
          <Parallax className="h-[62svh] min-h-[380px] rounded-2xl md:min-h-[420px] md:h-[92vh] md:rounded-[32px]" offset={70}>
            <button type="button" onClick={() => onOpen(block.k)} className="block h-full w-full cursor-zoom-in" aria-label="Open photo">
              <Img k={block.k} w={2400} sizes="100vw" className="h-full w-full" />
            </button>
          </Parallax>
        </div>
      )
    case 'pair':
      return wrap(
        <div className="grid gap-3 md:grid-cols-2 md:gap-6">
          <Frame k={block.a} onOpen={onOpen} ratio={4 / 5} sizes="(max-width: 768px) 100vw, 50vw" />
          <Frame k={block.b} onOpen={onOpen} ratio={4 / 5} sizes="(max-width: 768px) 100vw, 50vw" className="md:mt-24" />
        </div>,
        true,
      )
    case 'trio':
      return wrap(
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-6">
          <Frame k={block.a} onOpen={onOpen} ratio={3 / 4} sizes="(max-width: 768px) 50vw, 33vw" />
          <Frame k={block.b} onOpen={onOpen} ratio={3 / 4} sizes="(max-width: 768px) 50vw, 33vw" className="md:-mt-16" />
          <Frame k={block.c} onOpen={onOpen} ratio={3 / 4} sizes="(max-width: 768px) 100vw, 33vw" className="col-span-2 md:col-span-1" />
        </div>,
        true,
      )
    case 'offset':
      return wrap(
        <div className="grid md:grid-cols-12">
          <Frame k={block.k} onOpen={onOpen} ratio={3 / 2} className="md:col-span-8 md:col-start-3" sizes="(max-width: 768px) 100vw, 66vw" />
        </div>,
      )
    case 'quote':
      return wrap(
        <figure className="relative mx-auto max-w-4xl px-2 py-14 text-center md:px-0 md:py-28">
          {lang === 'ta' && (
            <>
              <KolamCorner className="absolute left-0 top-2 md:top-6" />
              <KolamCorner className="absolute bottom-2 right-0 rotate-180 md:bottom-6" />
            </>
          )}
          <Icon name="quote" size={40} className="mx-auto text-ruby" strokeWidth={1.2} />
          <RevealText as="p" text={quote} className="t-2 mt-6 md:mt-8" stagger={0.03} />
          <Reveal delay={0.3}><figcaption className="t-label mt-6 text-ink/50 md:mt-8">— {quoteBy}</figcaption></Reveal>
        </figure>,
      )
  }
}
