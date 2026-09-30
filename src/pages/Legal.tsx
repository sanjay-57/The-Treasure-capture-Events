import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { AnimatePresence, motion, useScroll, useSpring } from 'motion/react'
import { useLenis } from 'lenis/react'
import { Icon } from '../components/Icon'
import { Container, Eyebrow } from '../components/ui'
import { EASE, Reveal, RevealText } from '../components/motion'
import { Kolam, Ornament, TamilOnly, TempleBorder } from '../components/tamil'
import { formatDate, useLang, useT } from '../lib/i18n'
import { useStore } from '../lib/store'
import { useTitle, useUi } from '../lib/ui'
import { useTopPad } from './content/shared'
import { PRIVACY, TERMS, type LegalBlock, type LegalDoc } from './content/legalContent'

const copy = {
  updated: { en: 'Last updated', ta: 'கடைசியாகப் புதுப்பித்தது' },
  read: { en: '{n} min read', ta: '{n} நிமிட வாசிப்பு' },
  print: { en: 'Print', ta: 'அச்சிடு' },
  contents: { en: 'Contents', ta: 'உள்ளடக்கம்' },
  alsoTerms: { en: 'Read our Terms & Conditions', ta: 'எங்கள் விதிமுறைகளைப் படிக்க' },
  alsoPrivacy: { en: 'Read our Privacy Policy', ta: 'எங்கள் தனியுரிமைக் கொள்கையைப் படிக்க' },
  questions: { en: 'Still have a question?', ta: 'இன்னும் கேள்வி உள்ளதா?' },
  talk: { en: 'Talk to the studio', ta: 'ஸ்டுடியோவுடன் பேசுங்கள்' },
  top: { en: 'Back to top', ta: 'மேலே செல்' },
  phone: { en: 'Phone & WhatsApp', ta: 'தொலைபேசி & வாட்ஸ்அப்' },
  email: { en: 'Email', ta: 'மின்னஞ்சல்' },
  address: { en: 'Address', ta: 'முகவரி' },
}

export function Terms() {
  return <LegalPage doc={TERMS} />
}

export function Privacy() {
  return <LegalPage doc={PRIVACY} />
}

function wordCount(doc: LegalDoc, lang: 'en' | 'ta') {
  let n = 0
  for (const s of doc.sections)
    for (const b of s.blocks) {
      if ('p' in b) n += b.p[lang].split(/\s+/).length
      else if ('list' in b) b.list.forEach(x => (n += x[lang].split(/\s+/).length))
      else if ('note' in b) n += b.note[lang].split(/\s+/).length
    }
  return n
}

function LegalPage({ doc }: { doc: LegalDoc }) {
  useTitle(doc.title)
  const t = useT(copy)
  const lang = useLang()
  const pad = useTopPad()
  const lenis = useLenis()
  const { hash } = useLocation()
  const [active, setActive] = useState(doc.sections[0].id)
  const [tocOpen, setTocOpen] = useState(false)
  const navHidden = useUi(s => s.navHidden)
  const article = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: article, offset: ['start 30%', 'end 70%'] })
  const progress = useSpring(scrollYProgress, { stiffness: 160, damping: 30, restDelta: 0.001 })
  const minutes = useMemo(() => Math.max(3, Math.round(wordCount(doc, lang) / (lang === 'ta' ? 120 : 220))), [doc, lang])
  const other = doc.key === 'terms' ? { to: '/privacy', label: t.alsoPrivacy } : { to: '/terms', label: t.alsoTerms }

  // Highlight the section that crosses the upper third of the viewport.
  useEffect(() => {
    const els = doc.sections.map(s => document.getElementById(s.id)).filter((x): x is HTMLElement => !!x)
    const io = new IntersectionObserver(
      entries => {
        const hit = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (hit) setActive(hit.target.id)
      },
      { rootMargin: '-22% 0px -68% 0px' },
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [doc])

  const goTo = (id: string) => {
    setTocOpen(false)
    const el = document.getElementById(id)
    if (!el) return
    if (lenis) lenis.scrollTo(el, { offset: -120 })
    else el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    history.replaceState(history.state, '', `#${id}`)
  }

  // Deep links like /terms#payments — wait for the page transition, then glide there.
  useEffect(() => {
    if (!hash) return
    const id = hash.slice(1)
    const timer = setTimeout(() => {
      const el = document.getElementById(id)
      if (el) (lenis ? lenis.scrollTo(el, { offset: -120 }) : el.scrollIntoView())
    }, 700)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toc = (where: 'm' | 'd') => (
    <ol className="space-y-0.5">
      {doc.sections.map((s, i) => {
        const on = s.id === active
        return (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => goTo(s.id)}
              aria-current={on ? 'location' : undefined}
              className={`group relative flex w-full cursor-pointer items-start gap-3 rounded-xl px-3 py-2 text-left text-[13.5px] leading-snug transition-colors duration-300 ${on ? 'text-ink' : 'text-ink/50 hover:text-ink'}`}
            >
              {on && <motion.span layoutId={`toc-${doc.key}-${where}`} className="absolute inset-0 -z-10 rounded-xl bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05),0_6px_18px_-8px_rgba(0,0,0,0.18)]" transition={{ type: 'spring', stiffness: 400, damping: 36 }} />}
              <span className={`mt-px w-5 shrink-0 font-mono text-[11px] tabular-nums ${on ? 'text-ruby' : 'text-ink/30'}`}>{String(i + 1).padStart(2, '0')}</span>
              <span className={on ? 'font-medium' : ''}>{s.title[lang]}</span>
            </button>
          </li>
        )
      })}
    </ol>
  )

  return (
    <div className={`legal-root relative isolate ${pad}`}>
      <style>{`
        @media print {
          header, footer, .legal-noprint { display: none !important; }
          .legal-root { padding-top: 0 !important; }
          .legal-root .legal-section { break-inside: avoid-page; padding-top: 18px !important; padding-bottom: 18px !important; }
          .legal-root a { color: inherit !important; text-decoration: none !important; }
          @page { margin: 18mm 16mm; }
        }
      `}</style>
      <div className="ambient legal-noprint pointer-events-none absolute inset-x-0 top-0 -z-10 h-[720px]" />
      <TamilOnly>
        <div className="kolam-bg legal-noprint pointer-events-none absolute inset-x-0 top-0 -z-10 h-[620px] opacity-[0.06] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      </TamilOnly>

      {/* Header */}
      <Container wide>
        <div className="max-w-4xl">
          <TamilOnly>
            <Kolam size={52} className="mb-6 text-ruby" />
          </TamilOnly>
          <Reveal>
            <Eyebrow>{doc.eyebrow[lang]}</Eyebrow>
          </Reveal>
          <RevealText as="h1" immediate delay={0.1} text={doc.title[lang]} className="t-hero mt-5 text-ink md:mt-6" />
          <Reveal delay={0.3}>
            <p className="t-lead mt-5 max-w-2xl text-ink/60 md:mt-7">{doc.intro[lang]}</p>
          </Reveal>
          <Reveal delay={0.45} className="mt-6 flex flex-wrap items-center gap-2 md:mt-8 md:gap-2.5">
            <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] text-ink/70">
              <Icon name="calendar" size={15} className="text-ruby" />
              {t.updated} · <span className="font-medium text-ink">{formatDate(doc.updated, lang, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </span>
            <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] text-ink/70">
              <Icon name="clock" size={15} className="text-ruby" />
              {t.read.replace('{n}', String(minutes))}
            </span>
            <button
              type="button"
              onClick={() => window.print()}
              className="legal-noprint hidden h-[38px] cursor-pointer items-center sm:inline-flex gap-2 rounded-full border border-ink/15 px-4 text-[13px] font-medium text-ink transition hover:border-ink/40 hover:bg-ink/[0.03]"
            >
              <PrinterIcon />
              {t.print}
            </button>
          </Reveal>
        </div>
      </Container>

      <Container wide className="mt-10 md:mt-20">
        <TamilOnly>
          <TempleBorder className="legal-noprint mb-8 opacity-80 md:mb-10" />
        </TamilOnly>
        <div className="grid gap-8 md:gap-10 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-16 xl:grid-cols-[300px_minmax(0,1fr)]">
          {/* Mobile contents */}
          <div className="legal-noprint sticky z-20 self-start transition-[top] duration-500 ease-out md:static lg:hidden" style={{ top: navHidden ? 12 : 84 }}>
            <div className="glass-strong overflow-hidden rounded-[22px] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)] md:shadow-none">
              <button type="button" onClick={() => setTocOpen(o => !o)} aria-expanded={tocOpen} className="flex min-h-[52px] w-full cursor-pointer items-center justify-between gap-4 px-4 py-3 text-left sm:px-5 md:min-h-0 md:py-4">
                <span className="flex shrink-0 items-center gap-2">
                  <span className="t-label text-ink/60">{t.contents}</span>
                  <span className="font-mono text-[11px] tabular-nums text-ruby md:hidden">{String(doc.sections.findIndex(s => s.id === active) + 1).padStart(2, '0')}</span>
                </span>
                <span className="flex min-w-0 items-center gap-2.5 text-[13px] text-ink/70 md:gap-3">
                  <span className="truncate md:max-w-[45vw]">{doc.sections.find(s => s.id === active)?.title[lang]}</span>
                  <Icon name="chevronDown" size={16} className={`shrink-0 transition-transform duration-300 ${tocOpen ? 'rotate-180' : ''}`} />
                </span>
              </button>
              <div className="mx-4 h-[2px] overflow-hidden rounded-full bg-ink/[0.06] sm:mx-5 md:hidden">
                <motion.div style={{ scaleX: progress }} className="h-full origin-left rounded-full bg-ruby" />
              </div>
              <AnimatePresence initial={false}>
                {tocOpen && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.45, ease: EASE }} className="overflow-hidden">
                    <div data-lenis-prevent className="max-h-[60svh] overflow-y-auto overscroll-contain border-t border-ink/5 p-2 md:max-h-none md:overflow-visible">{toc('m')}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Sticky desktop contents */}
          <aside className="legal-noprint hidden lg:block" aria-label={t.contents}>
            <div className="sticky top-28">
              <div className="glass-strong rounded-[26px] p-3">
                <div className="flex items-center justify-between px-3 pb-3 pt-2">
                  <span className="t-label text-ink/50">{t.contents}</span>
                  <span className="font-mono text-[11px] tabular-nums text-ink/40">
                    {String(doc.sections.findIndex(s => s.id === active) + 1).padStart(2, '0')} / {String(doc.sections.length).padStart(2, '0')}
                  </span>
                </div>
                <div className="mx-3 mb-2 h-[2px] overflow-hidden rounded-full bg-ink/[0.06]">
                  <motion.div style={{ scaleX: progress }} className="h-full origin-left rounded-full bg-ruby" />
                </div>
                <nav data-lenis-prevent className="max-h-[calc(100svh-15rem)] overflow-y-auto">{toc('d')}</nav>
              </div>
              <Link to={other.to} className="group mt-4 flex items-center justify-between gap-3 rounded-[20px] border border-ink/10 px-5 py-4 text-[13.5px] font-medium text-ink/70 transition hover:border-ink/25 hover:text-ink">
                {other.label}
                <Icon name="arrowRight" size={15} className="shrink-0 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </aside>

          {/* Document */}
          <article ref={article} className="min-w-0">
            {doc.sections.map((s, i) => (
              <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className={`legal-section scroll-mt-40 py-8 md:scroll-mt-32 md:py-14 ${i ? 'border-t border-ink/10' : 'pt-0 md:pt-0'}`}>
                <div className="flex items-baseline gap-3 md:gap-4">
                  <span className="shrink-0 font-mono text-[12px] tabular-nums text-ruby">{String(i + 1).padStart(2, '0')}</span>
                  <h2 id={`${s.id}-h`} className="t-3 text-ink">{s.title[lang]}</h2>
                </div>
                <div className="mt-4 max-w-[68ch] space-y-5 md:mt-5 md:pl-9">
                  {s.blocks.map((b, j) => (
                    <Block key={j} b={b} />
                  ))}
                </div>
              </section>
            ))}

            <div className="legal-noprint mt-6 border-t border-ink/10 pt-10 md:pt-12">
              <Ornament className="!justify-start" />
              <div className="mt-8 flex flex-col gap-6 rounded-[28px] bg-ink p-6 text-white sm:flex-row md:mt-10 sm:items-center sm:justify-between md:p-9">
                <div>
                  <p className="t-3">{t.questions}</p>
                  <Link to={other.to} className="mt-2 inline-flex items-center gap-1.5 text-[14px] text-white/60 transition hover:text-white lg:hidden">
                    {other.label}
                    <Icon name="arrowRight" size={14} />
                  </Link>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link to="/contact" className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ruby px-5 text-sm font-medium text-white transition hover:bg-ruby-bright">
                    {t.talk}
                    <Icon name="arrowRight" size={16} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => (lenis ? lenis.scrollTo(0) : window.scrollTo({ top: 0, behavior: 'smooth' }))}
                    className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-white/20 px-5 text-sm font-medium text-white transition hover:border-white/50"
                  >
                    {t.top}
                  </button>
                </div>
              </div>
            </div>
          </article>
        </div>
      </Container>
      <div className="h-20 md:h-36" />
    </div>
  )
}

function Block({ b }: { b: LegalBlock }) {
  const lang = useLang()
  const body = `text-[15.5px] text-ink/70 md:text-base ${lang === 'ta' ? 'leading-[1.95]' : 'leading-[1.75]'}`
  if ('p' in b) return <p className={body}>{b.p[lang]}</p>
  if ('list' in b)
    return (
      <ul className="space-y-3">
        {b.list.map((x, i) => (
          <li key={i} className={`flex gap-3.5 ${body}`}>
            <span className="mt-[0.72em] h-1.5 w-1.5 shrink-0 rotate-45 bg-ruby" aria-hidden="true" />
            <span>{x[lang]}</span>
          </li>
        ))}
      </ul>
    )
  if ('note' in b)
    return (
      <div className="glass-ruby-tint flex gap-3 rounded-[20px] p-4 sm:gap-3.5 sm:p-5">
        <Icon name="info" size={18} className="mt-0.5 shrink-0 text-ruby" />
        <p className={`${body} !text-ink/80`}>{b.note[lang]}</p>
      </div>
    )
  return <ContactBlock />
}

function ContactBlock() {
  const t = useT(copy)
  const lang = useLang()
  const studio = useStore(s => s.cms.studio)
  const rows = [
    { icon: 'mapPin' as const, k: t.address, v: lang === 'ta' ? studio.addressTa : studio.addressEn },
    { icon: 'phone' as const, k: t.phone, v: studio.phone, href: `tel:${studio.phone.replace(/\s/g, '')}` },
    { icon: 'mail' as const, k: t.email, v: studio.email, href: `mailto:${studio.email}` },
  ]
  return (
    <dl className="grid gap-px overflow-hidden rounded-[22px] border border-ink/10 bg-ink/10 sm:grid-cols-3">
      {rows.map(r => (
        <div key={r.k} className="bg-white p-5">
          <dt className="t-label flex items-center gap-2 text-ink/45">
            <Icon name={r.icon} size={14} className="text-ruby" />
            {r.k}
          </dt>
          <dd className="mt-2 break-words text-[14.5px] font-medium text-ink">{r.href ? <a href={r.href} className="hover:text-ruby">{r.v}</a> : r.v}</dd>
        </div>
      ))}
    </dl>
  )
}

function PrinterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v7H7z" />
    </svg>
  )
}
