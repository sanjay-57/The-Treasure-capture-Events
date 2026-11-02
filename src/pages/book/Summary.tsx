import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useLenis } from 'lenis/react'
import { Icon, type IconName } from '../../components/Icon'
import { EASE } from '../../components/motion'
import { TempleBorder, KolamCorner } from '../../components/tamil'
import { formatDate, formatINR, useLang, useT } from '../../lib/i18n'
import { useStore } from '../../lib/store'
import { CROWDS, VENUES, districtName, eventByKey } from '../../lib/data'
import { CATALOGUE_BY_ID, OVERTIME_NOTE, cartHours, cartTierName } from '../../lib/catalogue'
import type { Quote, QuoteLine } from '../../lib/pricing'
import { AnimatedINR, hoursLabel, useQuote, useStepAction, useTypingInField } from './shared'

const copy = {
  live: { en: 'Live quote', ta: 'நேரலை மதிப்பீடு' },
  updates: { en: 'Updates as you choose', ta: 'நீங்கள் தேர்வு செய்யும்போதே மாறும்' },
  estimated: { en: 'Estimated total', ta: 'மதிப்பிடப்பட்ட மொத்தம்' },
  empty: { en: 'Choose your event to see a live price.', ta: 'நேரலை விலையைக் காண உங்கள் நிகழ்வைத் தேர்ந்தெடுங்கள்.' },
  emptyNote: { en: 'Every line is itemised — no hidden charges.', ta: 'ஒவ்வொரு கட்டணமும் தனித்தனியாகக் காட்டப்படும் — மறைமுகக் கட்டணம் இல்லை.' },
  free: { en: 'Included', ta: 'அடங்கும்' },
  session: { en: 'session', ta: 'அமர்வு' },
  sessions: { en: 'sessions', ta: 'அமர்வுகள்' },
  hours: { en: 'h', ta: 'மணி நேரம்' },
  noPay: { en: 'No payment now — pay offline after we confirm your date.', ta: 'இப்போது கட்டணம் இல்லை — தேதி உறுதியான பின் நேரடியாகச் செலுத்தலாம்.' },
  gst: { en: 'Indicative estimate. We confirm the date and send the final quote on WhatsApp.', ta: 'தோராயமான மதிப்பீடு. தேதியை உறுதி செய்து இறுதி மதிப்பீட்டை WhatsApp-ல் அனுப்புவோம்.' },
  startOver: { en: 'Start over', ta: 'மீண்டும் தொடங்கு' },
  view: { en: 'View quote', ta: 'மதிப்பீடு' },
  hide: { en: 'Hide', ta: 'மூடு' },
  tentative: { en: 'tentative', ta: 'தற்காலிகம்' },
  sheet: { en: 'Your quote', ta: 'உங்கள் மதிப்பீடு' },
  next: { en: 'Continue', ta: 'தொடர்க' },
  pkgFor: { en: 'package', ta: 'தொகுப்பு' },
  added: { en: 'Your additions', ta: 'நீங்கள் சேர்த்தவை' },
  removed: { en: 'Removed', ta: 'நீக்கியவை' },
}

/** Line rows, shared by the section view and the package view. */
function LineList({ lines, plus = false, gold = false }: { lines: QuoteLine[]; plus?: boolean; gold?: boolean }) {
  const lang = useLang()
  const t = useT(copy)
  return (
    <ul className="mt-1.5 space-y-1.5">
      <AnimatePresence initial={false}>
        {lines.map(line => (
          <motion.li
            key={line.id ?? `${line.label.en}|${line.detail?.en ?? ''}`}
            layout="position"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="flex items-start justify-between gap-4 text-[13px]">
              <div className="min-w-0">
                <p className="leading-snug text-ink/80">
                  {plus && <span className="mr-1 font-semibold text-ruby">+</span>}
                  {line.label[lang]}
                </p>
                {line.detail && <p className="mt-0.5 text-[11.5px] leading-snug text-ink/45">{line.detail[lang]}</p>}
              </div>
              <span className={`shrink-0 tabular-nums ${line.kind === 'saving' ? `font-semibold ${gold ? 'text-gold-deep' : 'text-ruby'}` : line.amount === 0 ? 'text-ink/35' : 'text-ink/70'}`}>
                {line.amount === 0 ? t.free : `${plus ? '+' : ''}${formatINR(line.amount)}`}
              </span>
            </div>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  )
}

function GroupHead({ title, amount, sub, gold = false }: { title: string; amount?: number; sub?: string; gold?: boolean }) {
  const t = useT(copy)
  return (
    <div className="flex items-baseline justify-between gap-3">
      <p className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] ${gold ? 'text-gold-deep' : 'text-ruby'}`}>
        {gold && <Icon name="gem" size={12} />}
        {title}
        {sub && <span className="ml-1.5 normal-case tracking-normal text-ink/45">· {sub}</span>}
      </p>
      {amount !== undefined && <span className="text-[13px] font-semibold tabular-nums text-ink">{amount === 0 ? t.free : formatINR(amount)}</span>}
    </div>
  )
}

/**
 * A cart that is still a package reads as: the package and its items (with
 * the saving), then what was added, then what was taken out.
 */
function PackageGroups({ quote, hours }: { quote: Quote; hours: number }) {
  const lang = useLang()
  const t = useT(copy)
  const pkg = quote.package!
  const added = new Set(pkg.added)
  const catalogue = quote.lines.filter(l => l.section !== 'travel' && l.section !== 'adjustment' && l.section !== 'tax')
  const isBundle = (l: QuoteLine) => !!l.bundle
  const own = catalogue.filter(l => !(l.id && added.has(l.id)) && !isBundle(l))
  const extra = catalogue.filter(l => (l.id && added.has(l.id)) || isBundle(l))
  const rest = quote.sections.filter(sec => sec.key === 'travel' || sec.key === 'adjustment' || sec.key === 'tax')
  const sum = (ls: QuoteLine[]) => ls.reduce((s, l) => s + l.amount, 0)
  return (
    <>
      {/* The package itself, in gold; whatever the customer changes follows as + / − lines */}
      <motion.section layout="position" className="overflow-hidden rounded-2xl border border-gold/35 bg-gradient-to-b from-gold-soft to-white/60 p-3.5">
        <GroupHead title={`${pkg.name[lang]} ${t.pkgFor}`} amount={sum(own)} sub={`${hours} ${t.hours}`} gold />
        <LineList lines={own} gold />
      </motion.section>
      <AnimatePresence initial={false}>
        {extra.length > 0 && (
          <motion.section key="added" layout="position" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.45, ease: EASE }} className="overflow-hidden">
            <GroupHead title={t.added} amount={sum(extra)} />
            <LineList lines={extra} plus />
          </motion.section>
        )}
        {pkg.removed.length > 0 && (
          <motion.section key="removed" layout="position" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.45, ease: EASE }} className="overflow-hidden">
            <GroupHead title={t.removed} />
            <ul className="mt-1.5 space-y-1">
              {pkg.removed.map(id => (
                <li key={id} className="text-[13px] leading-snug text-ink/45">
                  <span className="mr-1 font-semibold">−</span>
                  <span className="line-through decoration-ink/25">{CATALOGUE_BY_ID[id].name[lang]}</span>
                </li>
              ))}
            </ul>
          </motion.section>
        )}
        {rest.map(sec => (
          <motion.section key={sec.key} layout="position" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.45, ease: EASE }} className="overflow-hidden">
            <GroupHead title={sec.name[lang]} amount={sec.amount} />
            <LineList lines={sec.lines} />
          </motion.section>
        ))}
      </AnimatePresence>
    </>
  )
}

function SummaryChips() {
  const lang = useLang()
  const d = useStore(s => s.draft)
  const t = useT(copy)
  const ev = eventByKey(d.eventType)
  const chips: { icon: IconName; label: string }[] = []
  if (d.district) chips.push({ icon: 'mapPin', label: districtName(d.district, lang) })
  if (ev) chips.push({ icon: 'sparkle', label: ev.name[lang] })
  if (ev) chips.push({ icon: 'clock', label: hoursLabel(d.durationHours, lang) })
  if (ev) chips.push({ icon: 'gem', label: cartTierName(d.cart)[lang] })
  if (ev) chips.push({ icon: 'users', label: CROWDS.find(c => c.key === d.crowd)?.name[lang] ?? '' })
  if (d.venueAddress) chips.push({ icon: d.venueType === 'home' ? 'home' : 'building', label: VENUES.find(v => v.key === d.venueType)?.name[lang] ?? '' })
  if (d.date) chips.push({ icon: 'calendar', label: formatDate(d.date, lang, { day: 'numeric', month: 'short' }) + (d.dateCertainty === 'tentative' ? ` · ${t.tentative}` : '') })
  if (!chips.length) return null
  return (
    <ul className="flex flex-wrap gap-1.5">
      <AnimatePresence initial={false}>
        {chips.map(c => (
          <motion.li
            key={c.icon}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink/[0.05] px-2.5 py-1 text-[12px] font-medium text-ink/70"
          >
            <Icon name={c.icon} size={13} className="text-ruby" />
            {c.label}
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  )
}

/** The itemised quote body, shared by the desktop panel and the mobile sheet. */
export function SummaryBody({ compact = false }: { compact?: boolean }) {
  const lang = useLang()
  const t = useT(copy)
  const quote = useQuote()
  const hours = useStore(s => cartHours(s.draft.cart))
  const resetDraft = useStore(s => s.resetDraft)
  const navigate = useNavigate()

  return (
    <div>
      {!compact && (
        <div className="flex items-center justify-between gap-3">
          <span className="t-label text-ink/55">{t.live}</span>
          <span className="flex items-center gap-2 text-[11px] text-ink/45">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inset-0 rounded-full bg-ruby animate-pulse-ring" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-ruby" />
            </span>
            {t.updates}
          </span>
        </div>
      )}

      <div className={compact ? '' : 'mt-5'}>
        <SummaryChips />
      </div>

      {quote ? (
        <>
          <div className="mt-6 border-t hairline pt-5">
            <p className="text-[12px] font-medium text-ink/50">{t.estimated}</p>
            <AnimatedINR value={quote.total} className="mt-1 block font-display text-[2.6rem] font-semibold leading-none tracking-tight text-ink" />
          </div>
          <div className="mt-5 space-y-4">
            {quote.package ? (
              <PackageGroups quote={quote} hours={hours} />
            ) : (
              <AnimatePresence initial={false}>
                {quote.sections.map(sec => (
                  <motion.section
                    key={sec.key}
                    layout="position"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.45, ease: EASE }}
                    className="overflow-hidden"
                  >
                    <GroupHead title={sec.name[lang]} amount={sec.amount} sub={sec.key === 'crew' ? `${hours} ${t.hours}` : undefined} />
                    <LineList lines={sec.lines} />
                  </motion.section>
                ))}
              </AnimatePresence>
            )}
            <p className="text-[11.5px] leading-snug text-ink/45">{OVERTIME_NOTE[lang]}</p>
          </div>
        </>
      ) : (
        <div className="mt-6 border-t hairline pt-5">
          <p className="font-display text-[1.35rem] leading-snug text-ink/80">{t.empty}</p>
          <div className="mt-5 space-y-2.5" aria-hidden="true">
            {[78, 56, 64].map(w => (
              <div key={w} className="flex items-center justify-between gap-6">
                <span className="skeleton h-2.5 rounded-full" style={{ width: `${w}%` }} />
                <span className="skeleton h-2.5 w-12 rounded-full" />
              </div>
            ))}
          </div>
          <p className="mt-5 text-[12px] text-ink/45">{t.emptyNote}</p>
        </div>
      )}

      <div className="mt-6 rounded-2xl bg-ruby-soft/70 p-3.5">
        <p className="flex items-start gap-2.5 text-[12.5px] font-medium leading-snug text-ruby-deep">
          <Icon name="lock" size={15} className="mt-px" />
          {t.noPay}
        </p>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-[11px] leading-snug text-ink/40">{t.gst}</p>
        {quote && (
          <button
            type="button"
            onClick={() => {
              resetDraft()
              navigate('/book')
            }}
            className={`inline-flex shrink-0 items-center gap-1 rounded-full text-[12px] font-medium text-ink/50 transition hover:bg-ink/[0.05] hover:text-ink cursor-pointer ${compact ? 'h-10 px-3' : 'px-2 py-1'}`}
          >
            <Icon name="refresh" size={13} />
            {t.startOver}
          </button>
        )}
      </div>
    </div>
  )
}

/** Sticky glass panel beside the steps on desktop. */
export function QuotePanel() {
  const lang = useLang()
  return (
    <div className="relative">
      {/* Soft colour behind the glass so the blur has something to refract */}
      <div aria-hidden="true" className="pointer-events-none absolute -right-10 top-10 -z-10 h-56 w-56 rounded-full bg-ruby/20 blur-3xl animate-float" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-8 bottom-4 -z-10 h-40 w-40 rounded-full bg-ink/10 blur-3xl" />
      <aside className="glass-strong relative overflow-hidden rounded-[28px] p-6" aria-label={lang === 'ta' ? 'மதிப்பீடு' : 'Quote summary'}>
        {lang === 'ta' && (
          <>
            <TempleBorder className="absolute inset-x-0 top-0 opacity-80" />
            <KolamCorner className="pointer-events-none absolute -bottom-1 -right-1 rotate-180 opacity-60" />
          </>
        )}
        <div className={lang === 'ta' ? 'pt-3' : ''}>
          <SummaryBody />
        </div>
      </aside>
    </div>
  )
}

/**
 * Bottom chrome below lg. Phones get an app-style dock (live total + the
 * step's continue action, hidden while typing); tablets keep the quote pill.
 * Both expand into the itemised quote sheet.
 */
export function MobileQuoteBar() {
  const lang = useLang()
  const t = useT(copy)
  const quote = useQuote()
  const action = useStepAction(s => s.action)
  const [open, setOpen] = useState(false)
  const typing = useTypingInField()
  const lenis = useLenis()

  useEffect(() => {
    if (!open) return
    lenis?.stop()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => {
      lenis?.start()
      window.removeEventListener('keydown', onKey)
    }
  }, [open, lenis])

  // The on-screen keyboard needs the room; tuck the dock away while a field has focus.
  const dock = (!!quote || !!action) && !open && !typing

  if (typeof document === 'undefined') return null
  return createPortal(
    <div className="lg:hidden">
      <AnimatePresence>
        {dock && (
          <motion.div
            key="dock"
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(10px+env(safe-area-inset-bottom))] md:hidden"
          >
            <div className="glass-strong rounded-[26px] p-1.5">
              {action?.disabled && action.hint && <p className="px-3.5 pb-1.5 pt-2 text-[12px] leading-snug text-ink/55">{action.hint}</p>}
              <div className="flex items-center gap-1.5">
                {quote && (
                  <button
                    type="button"
                    onClick={() => setOpen(true)}
                    aria-expanded={open}
                    aria-haspopup="dialog"
                    className="flex min-h-12 min-w-0 flex-1 flex-col justify-center rounded-[20px] px-3.5 text-left transition active:bg-ink/[0.05] cursor-pointer"
                  >
                    <span className="flex items-center gap-1 text-[11px] font-medium text-ink/50">
                      <span className="truncate">{quote.package ? quote.package.label[lang] : t.estimated}</span>
                      <Icon name="chevronDown" size={13} className="shrink-0 rotate-180" />
                    </span>
                    <AnimatedINR value={quote.total} className="block truncate font-display text-[1.35rem] font-semibold leading-tight text-ink" />
                  </button>
                )}
                {action ? (
                  <button
                    type="button"
                    onClick={() => !action.busy && action.onNext()}
                    disabled={action.disabled}
                    aria-label={action.label}
                    className={`inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ruby px-5 text-[15px] font-medium text-white shadow-ruby transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-ink/15 disabled:text-ink/45 disabled:shadow-none cursor-pointer ${quote ? 'shrink-0' : 'flex-1'}`}
                  >
                    {action.busy ? (
                      <motion.span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
                    ) : (
                      <>
                        {action.short ?? t.next}
                        <Icon name={action.icon ?? 'arrowRight'} size={17} />
                      </>
                    )}
                  </button>
                ) : (
                  <button type="button" onClick={() => setOpen(true)} className="inline-flex h-12 shrink-0 items-center gap-1.5 rounded-full bg-ink px-5 text-[14px] font-medium text-white cursor-pointer">
                    {t.view}
                    <Icon name="chevronDown" size={15} className="rotate-180" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {quote && !open && (
          <motion.div
            key="bar"
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ duration: 0.55, ease: EASE }}
            className="fixed inset-x-3 bottom-3 z-40 hidden pb-[env(safe-area-inset-bottom)] md:block"
          >
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-expanded={open}
              className="glass-strong flex w-full items-center justify-between gap-3 rounded-full py-2 pl-5 pr-2 text-left cursor-pointer"
            >
              <span className="min-w-0">
                <span className="block truncate text-[11px] font-medium text-ink/50">{quote.package ? quote.package.label[lang] : t.estimated}</span>
                <AnimatedINR value={quote.total} className="block font-display text-[1.5rem] font-semibold leading-tight text-ink" />
              </span>
              <span className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-ink px-4 text-[13px] font-medium text-white">
                {t.view}
                <Icon name="chevronDown" size={15} className="rotate-180" />
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div key="sheet" className="fixed inset-0 z-[70] flex items-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <div className="absolute inset-0 bg-ink/35 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={t.sheet}
              data-lenis-prevent
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.55, ease: EASE }}
              className="glass-strong relative max-h-[86dvh] w-full overflow-y-auto overscroll-contain rounded-t-[30px] px-5 pb-[calc(24px+env(safe-area-inset-bottom))] pt-3"
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-ink/15" aria-hidden="true" />
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="t-3">{t.sheet}</p>
                <button type="button" onClick={() => setOpen(false)} className="flex h-10 shrink-0 items-center gap-1 rounded-full bg-ink/[0.06] px-4 text-[13px] font-medium text-ink/70 cursor-pointer">
                  {t.hide}
                  <Icon name="chevronDown" size={15} />
                </button>
              </div>
              <SummaryBody compact />
              {/* Phones: carry on straight from the quote instead of closing it first */}
              {action && (
                <div className="sticky bottom-0 -mx-5 mt-5 bg-gradient-to-t from-white via-white/95 to-white/0 px-5 pb-[calc(12px+env(safe-area-inset-bottom))] pt-4 md:hidden">
                  <button
                    type="button"
                    onClick={() => {
                      if (action.busy || action.disabled) return
                      setOpen(false)
                      action.onNext()
                    }}
                    disabled={action.disabled}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ruby px-5 text-[15px] font-medium text-white shadow-ruby transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-ink/15 disabled:text-ink/45 disabled:shadow-none cursor-pointer"
                  >
                    {action.label}
                    <Icon name={action.icon ?? 'arrowRight'} size={17} />
                  </button>
                  {action.disabled && action.hint && <p className="mt-2 text-center text-[12px] leading-snug text-ink/55">{action.hint}</p>}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  )
}
