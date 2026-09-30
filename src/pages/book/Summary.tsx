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
import { AnimatedINR, hoursLabel, useQuote, useStepAction } from './shared'

const copy = {
  live: { en: 'Live quote', ta: 'நேரலை மதிப்பீடு' },
  updates: { en: 'Updates as you choose', ta: 'நீங்கள் தேர்வு செய்யும்போதே மாறும்' },
  estimated: { en: 'Estimated total', ta: 'மதிப்பிடப்பட்ட மொத்தம்' },
  empty: { en: 'Choose your event to see a live price.', ta: 'நேரலை விலையைக் காண உங்கள் நிகழ்வைத் தேர்ந்தெடுங்கள்.' },
  emptyNote: { en: 'Every line is itemised — no hidden charges.', ta: 'ஒவ்வொரு கட்டணமும் தனித்தனியாகக் காட்டப்படும் — மறைமுகக் கட்டணம் இல்லை.' },
  free: { en: 'Free', ta: 'இலவசம்' },
  noPay: { en: 'No payment now — pay offline after we confirm your date.', ta: 'இப்போது கட்டணம் இல்லை — தேதி உறுதியான பின் நேரடியாகச் செலுத்தலாம்.' },
  gst: { en: 'Indicative, before GST. Final invoice after our call.', ta: 'தோராயமான தொகை, GST தவிர. அழைப்புக்குப் பின் இறுதி ரசீது.' },
  startOver: { en: 'Start over', ta: 'மீண்டும் தொடங்கு' },
  view: { en: 'View quote', ta: 'மதிப்பீடு' },
  hide: { en: 'Hide', ta: 'மூடு' },
  tentative: { en: 'tentative', ta: 'தற்காலிகம்' },
  sheet: { en: 'Your quote', ta: 'உங்கள் மதிப்பீடு' },
  next: { en: 'Continue', ta: 'தொடர்க' },
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
          <ul className="mt-5 space-y-3">
            <AnimatePresence initial={false}>
              {quote.lines.map(line => (
                <motion.li
                  key={line.label.en}
                  layout="position"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.45, ease: EASE }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-4 text-[13.5px]">
                    <div className="min-w-0">
                      <p className="font-medium leading-snug text-ink/85">{line.label[lang]}</p>
                      {line.detail && <p className="mt-0.5 text-[12px] leading-snug text-ink/45">{line.detail[lang]}</p>}
                    </div>
                    <span className={`shrink-0 tabular-nums ${line.amount === 0 ? 'text-ink/40' : 'font-medium text-ink'}`}>
                      {line.amount === 0 ? t.free : formatINR(line.amount)}
                    </span>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
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

const isTextField = (el: EventTarget | null) =>
  el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement || (el instanceof HTMLInputElement && !['checkbox', 'radio', 'range', 'button', 'submit'].includes(el.type))

/**
 * Bottom chrome below lg. Phones get an app-style dock (live total + the
 * step's continue action, hidden while typing); tablets keep the quote pill.
 * Both expand into the itemised quote sheet.
 */
export function MobileQuoteBar() {
  const t = useT(copy)
  const quote = useQuote()
  const action = useStepAction(s => s.action)
  const [open, setOpen] = useState(false)
  const [typing, setTyping] = useState(false)
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
  useEffect(() => {
    const onIn = (e: FocusEvent) => isTextField(e.target) && setTyping(true)
    const onOut = (e: FocusEvent) => isTextField(e.target) && setTyping(false)
    document.addEventListener('focusin', onIn)
    document.addEventListener('focusout', onOut)
    return () => {
      document.removeEventListener('focusin', onIn)
      document.removeEventListener('focusout', onOut)
    }
  }, [])

  const dock = (!!quote || !!action) && !open && !typing

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
                      <span className="truncate">{t.estimated}</span>
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
                <span className="block text-[11px] font-medium text-ink/50">{t.estimated}</span>
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  )
}
