import { useEffect, useId, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Icon } from '../../components/Icon'
import { Button, Container, Eyebrow, LangImg } from '../../components/ui'
import { EASE, Reveal, RevealText } from '../../components/motion'
import { Kolam, KolamCorner, TamilOnly } from '../../components/tamil'
import { useLang, type Bi } from '../../lib/i18n'
import type { ImgKey } from '../../lib/images'

/*
 * Building blocks shared by the marketing / content pages
 * (Services, Studio, Contact, Legal, 404).
 */

/** Top padding for pages without a dark hero. Tamil mode hangs a garland under the nav. */
export function useTopPad() {
  const lang = useLang()
  return lang === 'ta' ? 'pt-44 md:pt-56' : 'pt-36 md:pt-48'
}

/** Tracks a media query, e.g. '(min-width: 1024px)'. */
export function useMedia(query: string) {
  const [match, setMatch] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setMatch(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return match
}

// ─── FAQ accordion ───────────────────────────────────────────────────────────

export interface FaqItem {
  q: Bi
  a: Bi
}

/** Accordion with animated height. One item open at a time. */
export function FaqList({ items, dark = false, defaultOpen = 0 }: { items: FaqItem[]; dark?: boolean; defaultOpen?: number | null }) {
  const lang = useLang()
  const [open, setOpen] = useState<number | null>(defaultOpen)
  const base = useId()
  return (
    <div className={`border-t ${dark ? 'border-white/10' : 'border-ink/10'}`}>
      {items.map((it, i) => {
        const isOpen = open === i
        const id = `${base}-${i}`
        return (
          <div key={i} className={`border-b ${dark ? 'border-white/10' : 'border-ink/10'}`}>
            <h3>
              <button
                type="button"
                id={`${id}-q`}
                aria-expanded={isOpen}
                aria-controls={`${id}-a`}
                onClick={() => setOpen(isOpen ? null : i)}
                className="group flex w-full cursor-pointer items-start justify-between gap-4 py-5 text-left md:gap-5 md:py-7"
              >
                <span className={`min-w-0 font-display text-[1.15rem] leading-snug transition-colors md:text-[1.45rem] ${lang === 'ta' ? 'font-semibold' : 'font-medium'} ${dark ? 'text-white' : 'text-ink'} ${isOpen ? '' : dark ? 'group-hover:text-white/80' : 'group-hover:text-ruby'}`}>
                  {it.q[lang]}
                </span>
                <span
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-500 ${
                    isOpen ? 'rotate-45 border-ruby bg-ruby text-white' : dark ? 'border-white/20 text-white/70' : 'border-ink/15 text-ink/60 group-hover:border-ink/40'
                  }`}
                  aria-hidden="true"
                >
                  <Icon name="plus" size={16} />
                </span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`${id}-a`}
                  role="region"
                  aria-labelledby={`${id}-q`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ height: { duration: 0.55, ease: EASE }, opacity: { duration: 0.35 } }}
                  className="overflow-hidden"
                >
                  <motion.p
                    initial={{ y: -8 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.5, ease: EASE }}
                    className={`max-w-2xl pb-6 pr-2 text-[15px] md:pb-7 leading-relaxed md:pr-14 md:text-base ${lang === 'ta' ? 'leading-[1.9]' : ''} ${dark ? 'text-white/65' : 'text-ink/60'}`}
                  >
                    {it.a[lang]}
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

// ─── Closing call to action ──────────────────────────────────────────────────

/** Rounded photo band with a glass panel. Sits above the footer's own dark CTA. */
export function ClosingCta({
  eyebrow, title, lead, pair, primary, secondary,
}: {
  eyebrow: string
  title: string
  lead: string
  pair: Bi<ImgKey>
  primary: { label: string; to: string }
  secondary?: { label: string; to?: string; href?: string; icon?: 'whatsapp' | 'phone' | 'arrowRight' }
}) {
  return (
    <section className="py-16 md:py-32">
      <Container wide>
        <Reveal y={40}>
          <div className="relative isolate overflow-hidden rounded-[28px] bg-ink md:rounded-[40px]">
            <div className="absolute inset-0 -z-10">
              <LangImg pair={pair} className="h-full w-full" w={1800} dark />
            </div>
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/85 via-ink/50 to-ink/10" />
            <div className="grid min-h-[500px] items-end p-3 sm:p-8 md:min-h-[600px] md:grid-cols-[minmax(0,560px)_1fr] md:p-12">
              <div className="glass-dark relative rounded-[22px] p-6 sm:rounded-[24px] sm:p-7 md:rounded-[28px] md:p-10">
                <TamilOnly>
                  <KolamCorner className="absolute right-3 top-3 rotate-90" />
                </TamilOnly>
                <Eyebrow dark>{eyebrow}</Eyebrow>
                <RevealText text={title} className="t-2 mt-4 text-white" />
                <p className="t-lead mt-4 text-white/65">{lead}</p>
                <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
                  <Button to={primary.to} size="lg" icon="arrowRight">{primary.label}</Button>
                  {secondary && (
                    <Button to={secondary.to} href={secondary.href} size="lg" variant="outline-light" iconLeft={secondary.icon}>
                      {secondary.label}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}

// ─── Small pieces ────────────────────────────────────────────────────────────

/** Big outlined numeral, used for step and index numbers. */
export function Numeral({ n, className = '', dark = false }: { n: number | string; className?: string; dark?: boolean }) {
  return (
    <span
      className={`font-display leading-none text-transparent ${className}`}
      style={{ WebkitTextStroke: `1px ${dark ? 'rgba(255,255,255,0.35)' : 'rgba(10,10,11,0.22)'}` }}
      aria-hidden="true"
    >
      {typeof n === 'number' ? String(n).padStart(2, '0') : n}
    </span>
  )
}

/** Centered section intro with an optional kolam that draws in Tamil mode. */
export function CenterIntro({ eyebrow, title, lead, dark = false, children }: { eyebrow: string; title: string; lead?: string; dark?: boolean; children?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
      <TamilOnly>
        <Kolam size={56} className="mb-5 text-ruby" />
      </TamilOnly>
      <Reveal>
        <Eyebrow dark={dark}>{eyebrow}</Eyebrow>
      </Reveal>
      <RevealText text={title} className={`t-1 mt-5 ${dark ? 'text-white' : 'text-ink'}`} />
      {lead && (
        <Reveal delay={0.15}>
          <p className={`t-lead mx-auto mt-6 max-w-2xl ${dark ? 'text-white/60' : 'text-ink/60'}`}>{lead}</p>
        </Reveal>
      )}
      {children}
    </div>
  )
}
