import { Link, useLocation } from 'react-router'
import { motion } from 'motion/react'
import { Icon, type IconName } from '../components/Icon'
import { Container, Eyebrow, LangImg } from '../components/ui'
import { EASE, Parallax, Reveal, RevealText } from '../components/motion'
import { GopuramSkyline, Kolam, TamilOnly } from '../components/tamil'
import { useLang, useT } from '../lib/i18n'
import { useDarkHero, useTitle } from '../lib/ui'

const TITLE = { en: 'Page not found', ta: 'பக்கம் கிடைக்கவில்லை' }

const copy = {
  eyebrow: { en: 'Error 404 · Out of frame', ta: 'பிழை 404 · சட்டகத்திற்கு வெளியே' },
  title: { en: 'This frame didn’t\nmake the album.', ta: 'இந்தப் படம்\nஆல்பத்தில் இல்லை.' },
  lead: {
    en: 'The page you’re looking for has wandered off — like that one cousin who always disappears right before the group photo.',
    ta: 'குழுப் புகைப்படம் எடுக்கும் நேரத்தில் எப்போதும் காணாமல் போகும் அந்த ஒரு உறவினர் போல, நீங்கள் தேடிய பக்கமும் எங்கோ சென்றுவிட்டது.',
  },
  tried: { en: 'You tried', ta: 'நீங்கள் தேடியது' },
  home: { en: 'Back home', ta: 'முகப்புக்குத் திரும்ப' },
  homeSub: { en: 'Start from the beginning', ta: 'முதலிலிருந்து தொடங்குங்கள்' },
  gallery: { en: 'The gallery', ta: 'காட்சியகம்' },
  gallerySub: { en: 'Frames that did make it', ta: 'ஆல்பத்தில் இடம்பெற்ற படங்கள்' },
  book: { en: 'Book a date', ta: 'தேதி பதிவு' },
  bookSub: { en: 'Instant quote in a minute', ta: 'ஒரு நிமிடத்தில் மதிப்பீடு' },
}

export default function NotFound() {
  useTitle(TITLE)
  useDarkHero()
  const t = useT(copy)
  const lang = useLang()
  const { pathname } = useLocation()

  const links: { to: string; icon: IconName; label: string; sub: string; primary?: boolean }[] = [
    { to: '/', icon: 'home', label: t.home, sub: t.homeSub },
    { to: '/gallery', icon: 'image', label: t.gallery, sub: t.gallerySub },
    { to: '/book', icon: 'calendar', label: t.book, sub: t.bookSub, primary: true },
  ]

  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden bg-ink text-white">
      <Parallax className="absolute inset-0 -z-10" offset={90}>
        <LangImg pair={{ en: 'm_couple_mist', ta: 't_temple_tank' }} className="h-full w-full" w={2200} priority dark imgClassName="animate-kenburns" />
      </Parallax>
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/60 to-ink/40" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/75 via-ink/30 to-transparent" />
      <TamilOnly>
        <GopuramSkyline className="pointer-events-none absolute inset-x-0 bottom-0 -z-10" color="#c0163c" opacity={0.3} />
      </TamilOnly>

      {/* Giant outlined 404 */}
      <motion.p
        aria-hidden="true"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.4, ease: EASE, delay: 0.1 }}
        className="pointer-events-none absolute -right-4 top-24 -z-10 select-none font-display text-[42vw] leading-none text-transparent md:-right-6 md:top-16 md:text-[30vw]"
        style={{ WebkitTextStroke: '1px rgba(255,255,255,0.22)' }}
      >
        404
      </motion.p>

      <Container wide className="flex min-h-[100svh] flex-col justify-end pb-[calc(2rem+env(safe-area-inset-bottom))] pt-36 md:pb-16 md:pt-48">
        <TamilOnly>
          <Kolam size={52} className="mb-6 text-ruby-bright" />
        </TamilOnly>
        <Reveal>
          <Eyebrow dark>{t.eyebrow}</Eyebrow>
        </Reveal>
        <RevealText as="h1" immediate delay={0.15} text={t.title} className="t-hero mt-5 max-w-5xl text-white md:mt-6" />
        <Reveal delay={0.45}>
          <p className="t-lead mt-5 max-w-xl text-white/70 md:mt-7">{t.lead}</p>
        </Reveal>
        <Reveal delay={0.55}>
          <p className="mt-5 inline-flex max-w-full items-center gap-2 rounded-full bg-white/[0.06] px-3.5 py-1.5 text-[12.5px] text-white/55 ring-1 ring-white/10">
            <span className="shrink-0">{t.tried}</span>
            <code className="truncate font-mono text-white/80">{pathname}</code>
          </p>
        </Reveal>

        <Reveal delay={0.7} className="mt-10 md:mt-16">
          <nav aria-label={lang === 'ta' ? 'பரிந்துரைக்கப்பட்ட பக்கங்கள்' : 'Suggested pages'} className="glass-dark grid overflow-hidden rounded-3xl sm:grid-cols-3 md:rounded-[26px]">
            {links.map((l, i) => (
              <Link
                key={l.to}
                to={l.to}
                className={`group flex items-center gap-4 px-4 py-4 transition-colors sm:px-5 sm:py-5 duration-300 md:px-7 md:py-6 ${i ? 'border-t border-white/10 sm:border-l sm:border-t-0' : ''} ${l.primary ? 'bg-ruby/85 hover:bg-ruby' : 'hover:bg-white/[0.06]'}`}
              >
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${l.primary ? 'bg-white text-ruby' : 'bg-white/10 text-white'}`}>
                  <Icon name={l.icon} size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-white">{l.label}</span>
                  <span className={`block truncate text-[13px] ${l.primary ? 'text-white/80' : 'text-white/50'}`}>{l.sub}</span>
                </span>
                <Icon name="arrowRight" size={18} className="shrink-0 text-white/60 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-white" />
              </Link>
            ))}
          </nav>
        </Reveal>
      </Container>
    </section>
  )
}
