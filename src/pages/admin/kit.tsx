import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Icon, type IconName } from '../../components/Icon'
import { Button, Modal } from '../../components/ui'
import { EASE } from '../../components/motion'
import { KolamCorner } from '../../components/tamil'
import { STATUS_ORDER, statusName, type OrderStatus } from '../../lib/data'
import { formatDateTime, useLang, useT, type Bi, type Lang } from '../../lib/i18n'
import type { OutboxMessage } from '../../lib/store'

/*
 * Admin-only building blocks. Dense, calm surfaces on mist; ruby is reserved
 * for "needs attention" and primary actions, ink for settled states.
 */

// ─── Shared copy ─────────────────────────────────────────────────────────────

export const AC = {
  overview: { en: 'Overview', ta: 'மேலோட்டம்' },
  orders: { en: 'Orders', ta: 'ஆர்டர்கள்' },
  team: { en: 'Team', ta: 'குழு' },
  cms: { en: 'Website CMS', ta: 'இணையதள உள்ளடக்கம்' },
  messages: { en: 'Messages', ta: 'செய்திகள்' },
  leads: { en: 'Leads', ta: 'வாய்ப்புகள்' },
  billing: { en: 'Billing', ta: 'கட்டணம்' },
  console: { en: 'Studio console', ta: 'ஸ்டுடியோ நிர்வாகம்' },
  search: { en: 'Search', ta: 'தேடு' },
  cancel: { en: 'Cancel', ta: 'ரத்து' },
  confirm: { en: 'Confirm', ta: 'உறுதிசெய்' },
  save: { en: 'Save changes', ta: 'மாற்றங்களைச் சேமி' },
  discard: { en: 'Discard', ta: 'கைவிடு' },
  unsaved: { en: 'You have unsaved changes', ta: 'சேமிக்கப்படாத மாற்றங்கள் உள்ளன' },
  saved: { en: 'Changes saved — live on the website', ta: 'மாற்றங்கள் சேமிக்கப்பட்டன — இணையதளத்தில் நேரலையில்' },
  all: { en: 'All', ta: 'அனைத்தும்' },
  noResults: { en: 'Nothing matches these filters', ta: 'இந்த வடிகட்டிகளுக்குப் பொருந்துவது இல்லை' },
  clearFilters: { en: 'Clear filters', ta: 'வடிகட்டிகளை நீக்கு' },
  paid: { en: 'Paid', ta: 'செலுத்தப்பட்டது' },
  due: { en: 'Due', ta: 'நிலுவை' },
  fullyPaid: { en: 'Fully paid', ta: 'முழுமையாகச் செலுத்தப்பட்டது' },
  waSent: { en: 'WhatsApp sent to client', ta: 'வாடிக்கையாளருக்கு WhatsApp அனுப்பப்பட்டது' },
  waDispatched: { en: 'Job sent to crew on WhatsApp', ta: 'பணி விவரம் குழுவினருக்கு WhatsApp-ல் அனுப்பப்பட்டது' },
  today: { en: 'Today', ta: 'இன்று' },
  tbc: { en: 'Date TBC', ta: 'தேதி உறுதியாகவில்லை' },
  staff: { en: 'Staff', ta: 'நிரந்தரப் பணியாளர்' },
  freelance: { en: 'Freelance', ta: 'ஃப்ரீலான்ஸ்' },
  available: { en: 'Available', ta: 'கிடைக்கிறார்' },
  busy: { en: 'Unavailable', ta: 'கிடைக்கவில்லை' },
  client: { en: 'Client', ta: 'வாடிக்கையாளர்' },
  crew: { en: 'Crew', ta: 'குழுவினர்' },
  delivered: { en: 'Delivered', ta: 'ஒப்படைக்கப்பட்டது' },
  read: { en: 'Delivered · read', ta: 'சேர்ந்தது · படிக்கப்பட்டது' },
} satisfies Record<string, Bi>

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const nextStatus = (s: OrderStatus): OrderStatus | null => STATUS_ORDER[STATUS_ORDER.indexOf(s) + 1] ?? null
export const stageIndex = (s: OrderStatus) => STATUS_ORDER.indexOf(s)

type GraphemeSegmenter = { segment: (s: string) => Iterable<{ segment: string }> }
const SegCtor = (Intl as unknown as { Segmenter?: new (l?: string, o?: { granularity: 'grapheme' }) => GraphemeSegmenter }).Segmenter
const seg = SegCtor ? new SegCtor(undefined, { granularity: 'grapheme' }) : null
/** Tamil letters carry combining vowel signs, so take the first grapheme, not the first code unit. */
const firstGrapheme = (w: string) => (seg ? [...seg.segment(w)][0]?.segment ?? '' : w.charAt(0))

export function initials(name: string): string {
  const words = name.replace(/[&.]/g, ' ').split(/\s+/).filter(Boolean)
  if (!words.length) return '·'
  const picked = words.length === 1 ? [words[0]] : [words[0], words[words.length - 1]]
  return picked.map(firstGrapheme).join('').toUpperCase()
}

export function relTime(iso: string | undefined, lang: Lang): string {
  if (!iso) return '—'
  const diff = (new Date(iso).getTime() - Date.now()) / 1000
  const rtf = new Intl.RelativeTimeFormat(lang === 'ta' ? 'ta-IN' : 'en-IN', { numeric: 'auto', style: 'short' })
  const abs = Math.abs(diff)
  if (abs < 45) return lang === 'ta' ? 'இப்போது' : 'just now'
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour')
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), 'day')
  if (abs < 86400 * 365) return rtf.format(Math.round(diff / (86400 * 30)), 'month')
  return rtf.format(Math.round(diff / (86400 * 365)), 'year')
}

/** Whole days from today until a yyyy-mm-dd date (negative if past). */
export function daysUntil(date: string): number | null {
  if (!date) return null
  const d = new Date(date + 'T00:00:00')
  if (Number.isNaN(d.getTime())) return null
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - t.getTime()) / 864e5)
}

export function inDays(n: number, lang: Lang): string {
  if (n === 0) return lang === 'ta' ? 'இன்று' : 'Today'
  if (n === 1) return lang === 'ta' ? 'நாளை' : 'Tomorrow'
  if (n > 0) return lang === 'ta' ? `${n} நாளில்` : `in ${n} days`
  return lang === 'ta' ? `${-n} நாள் முன்` : `${-n} days ago`
}

export const digits = (phone: string) => phone.replace(/\D/g, '')
export const telHref = (phone: string) => `tel:+${digits(phone).length === 10 ? '91' + digits(phone) : digits(phone)}`
export const waHref = (phone: string, text = '') => {
  const d = digits(phone)
  return `https://wa.me/${d.length === 10 ? '91' + d : d}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}

const PHONE_MQ = '(max-width: 767px)'
const subscribePhone = (cb: () => void) => {
  const m = window.matchMedia(PHONE_MQ)
  m.addEventListener('change', cb)
  return () => m.removeEventListener('change', cb)
}
/** True below the md breakpoint. */
export const useIsPhone = () => useSyncExternalStore(subscribePhone, () => window.matchMedia(PHONE_MQ).matches, () => false)

export const MODE_LABEL: Record<'upi' | 'cash' | 'bank', Bi> = {
  upi: { en: 'UPI', ta: 'UPI' },
  cash: { en: 'Cash', ta: 'ரொக்கம்' },
  bank: { en: 'Bank transfer', ta: 'வங்கிப் பரிமாற்றம்' },
}

// ─── Page chrome ─────────────────────────────────────────────────────────────

export function PageHeader({ eyebrow, title, subtitle, actions, children }: { eyebrow?: string; title: string; subtitle?: ReactNode; actions?: ReactNode; children?: ReactNode }) {
  const lang = useLang()
  return (
    <header className="mb-7 flex flex-col gap-5 md:mb-9 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="t-eyebrow mb-3 flex items-center gap-2.5 text-ink/45">
            {lang === 'ta' ? (
              <span className="grid grid-cols-2 gap-[3px]" aria-hidden="true">
                {[0, 1, 2, 3].map(i => <span key={i} className="h-[3px] w-[3px] rounded-full bg-ruby" />)}
              </span>
            ) : (
              <span className="h-px w-5 bg-ruby" aria-hidden="true" />
            )}
            {eyebrow}
          </p>
        )}
        <h1 className={`break-words font-display font-medium text-ink ${lang === 'ta' ? 'text-[24px] leading-[1.3] sm:text-[26px] md:text-[32px]' : 'text-[30px] leading-[1.05] tracking-[-0.015em] sm:text-[34px] sm:leading-[1.02] md:text-[44px]'}`}>{title}</h1>
        {subtitle && <p className="mt-2.5 max-w-2xl text-[14px] leading-relaxed text-ink/55">{subtitle}</p>}
        {children}
      </div>
      {actions && <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:shrink-0">{actions}</div>}
    </header>
  )
}

/** White panel with a small header row. */
export function Panel({
  title, subtitle, icon, action, children, className = '', bodyClass = 'p-5 md:p-6', kolam = false, id,
}: { title?: string; subtitle?: ReactNode; icon?: IconName; action?: ReactNode; children: ReactNode; className?: string; bodyClass?: string; kolam?: boolean; id?: string }) {
  const lang = useLang()
  return (
    <section id={id} className={`relative rounded-[26px] border hairline bg-white shadow-[0_1px_2px_rgba(10,10,11,0.04),0_10px_30px_-18px_rgba(10,10,11,0.18)] ${className}`}>
      {kolam && lang === 'ta' && <KolamCorner className="pointer-events-none absolute right-3 top-3 opacity-50" />}
      {title && (
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 border-b hairline px-5 py-4 md:flex-nowrap md:px-6">
          <div className="flex min-w-[min(100%,11rem)] flex-1 items-center gap-3 md:min-w-0">
            {icon && (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-ink/[0.045] text-ink/70">
                <Icon name={icon} size={16} />
              </span>
            )}
            <div className="min-w-0">
              <h2 className="truncate text-[15px] font-semibold tracking-tight text-ink">{title}</h2>
              {subtitle && <p className="mt-0.5 text-[12.5px] text-ink/50">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  )
}

// ─── Status ──────────────────────────────────────────────────────────────────

/** Tone by stage: new = ruby, in-flight = ruby tint, post-event = ink tint, billed = ink, delivered = outline. */
function statusTone(s: OrderStatus) {
  const i = stageIndex(s)
  if (s === 'ENQUIRY') return { pill: 'bg-ruby text-white', dot: 'bg-white' }
  if (i <= 2) return { pill: 'bg-ruby-soft text-ruby-deep', dot: 'bg-ruby' }
  if (i <= 5) return { pill: 'bg-ink/[0.06] text-ink', dot: 'bg-ruby' }
  if (s === 'BILLED') return { pill: 'bg-ink text-white', dot: 'bg-ruby-bright' }
  return { pill: 'border border-ink/15 text-ink/60', dot: '' }
}

export function StatusPill({ status, eventType, className = '' }: { status: OrderStatus; eventType?: string; className?: string }) {
  const lang = useLang()
  const tone = statusTone(status)
  return (
    <span className={`inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-[5px] text-[11.5px] font-semibold leading-none ${tone.pill} ${className}`}>
      {status === 'DELIVERED' ? <Icon name="check" size={12} strokeWidth={2.4} /> : <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${tone.dot}`} />}
      <span className="truncate">{statusName(status, eventType, lang)}</span>
    </span>
  )
}

/** Eight hairline segments showing how far through the pipeline an order is. */
export function StageMeter({ status, className = '' }: { status: OrderStatus; className?: string }) {
  const idx = stageIndex(status)
  return (
    <span className={`flex items-center gap-[3px] ${className}`} aria-label={`${idx + 1}/${STATUS_ORDER.length}`}>
      {STATUS_ORDER.map((s, i) => (
        <span key={s} className={`h-[3px] flex-1 rounded-full transition-colors duration-500 ${i <= idx ? (idx === STATUS_ORDER.length - 1 ? 'bg-ink' : 'bg-ruby') : 'bg-ink/10'}`} />
      ))}
    </span>
  )
}

// ─── People ──────────────────────────────────────────────────────────────────

export function Avatar({ name, size = 36, tone = 'ink', className = '', title }: { name: string; size?: number; tone?: 'ink' | 'ruby' | 'soft' | 'muted'; className?: string; title?: string }) {
  const tones = {
    ink: 'bg-ink text-white',
    ruby: 'bg-gradient-to-br from-ruby-bright to-ruby-deep text-white',
    soft: 'bg-ruby-soft text-ruby-deep',
    muted: 'bg-ink/[0.07] text-ink/60',
  }
  return (
    <span
      title={title ?? name}
      className={`inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold tracking-wide ${tones[tone]} ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.36)) }}
    >
      {initials(name)}
    </span>
  )
}

export function AvatarStack({ names, max = 3, size = 28, empty }: { names: string[]; max?: number; size?: number; empty?: ReactNode }) {
  if (!names.length) return <>{empty ?? <span className="text-[12px] text-ink/35">—</span>}</>
  const shown = names.slice(0, max)
  return (
    <span className="flex items-center">
      {shown.map((n, i) => (
        <Avatar key={n + i} name={n} size={size} tone={i === 0 ? 'ink' : 'soft'} className="ring-2 ring-white [&:not(:first-child)]:-ml-2" />
      ))}
      {names.length > max && (
        <span className="-ml-2 inline-flex items-center justify-center rounded-full bg-ink/[0.07] text-[10.5px] font-semibold text-ink/60 ring-2 ring-white" style={{ width: size, height: size }}>
          +{names.length - max}
        </span>
      )}
    </span>
  )
}

// ─── Controls ────────────────────────────────────────────────────────────────

export function SearchInput({ value, onChange, placeholder, className = '', autoFocus }: { value: string; onChange: (v: string) => void; placeholder: string; className?: string; autoFocus?: boolean }) {
  return (
    <label className={`group relative flex h-10 items-center rounded-full border border-ink/10 bg-white pl-10 pr-3 transition focus-within:border-ruby focus-within:ring-4 focus-within:ring-ruby/10 ${className}`}>
      <Icon name="search" size={16} className="pointer-events-none absolute left-3.5 text-ink/35 transition group-focus-within:text-ruby" />
      <span className="sr-only">{placeholder}</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="h-full w-full min-w-0 bg-transparent text-[16px] text-ink outline-none placeholder:text-ink/35 md:text-[14px]"
      />
      {value && (
        <button type="button" onClick={() => onChange('')} aria-label="Clear" className="-mr-1 ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink/[0.06] md:mr-0 md:h-6 md:w-6 text-ink/50 transition hover:bg-ink/10 hover:text-ink cursor-pointer">
          <Icon name="x" size={12} />
        </button>
      )}
    </label>
  )
}

/** Compact pill-shaped native select for toolbars. */
export function MiniSelect<T extends string>({ value, onChange, options, label, icon, className = '' }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string; icon?: IconName; className?: string }) {
  const id = useId()
  const active = options[0] && value !== options[0].value
  return (
    <div className={`relative ${className}`}>
      <label htmlFor={id} className="sr-only">{label}</label>
      {icon && <Icon name={icon} size={15} className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${active ? 'text-ruby' : 'text-ink/40'}`} />}
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value as T)}
        className={`h-10 w-full cursor-pointer appearance-none rounded-full border bg-white pr-9 text-[13.5px] font-medium outline-none transition focus:border-ruby focus:ring-4 focus:ring-ruby/10 ${icon ? 'pl-9' : 'pl-4'} ${active ? 'border-ruby/40 text-ink' : 'border-ink/10 text-ink/70'}`}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <Icon name="chevronDown" size={14} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
    </div>
  )
}

export function Switch({ checked, onChange, label, dark = false, size = 'md' }: { checked: boolean; onChange: (v: boolean) => void; label: string; dark?: boolean; size?: 'sm' | 'md' }) {
  const w = size === 'sm' ? 36 : 44
  const h = size === 'sm' ? 22 : 26
  const k = h - 6
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      onClick={() => onChange(!checked)}
      className={`relative shrink-0 rounded-full transition-colors duration-300 cursor-pointer ${checked ? 'bg-ruby' : dark ? 'bg-white/15' : 'bg-ink/15'}`}
      style={{ width: w, height: h }}
    >
      <motion.span
        className="absolute top-[3px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.25)]"
        style={{ width: k, height: k }}
        initial={false}
        animate={{ left: checked ? w - k - 3 : 3 }}
        transition={{ type: 'spring', stiffness: 500, damping: 34 }}
      />
    </button>
  )
}

/** Thin ruby progress bar that animates to its value. */
export function Progress({ value, className = '', dark = false }: { value: number; className?: string; dark?: boolean }) {
  const v = Math.max(0, Math.min(1, value))
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full ${dark ? 'bg-white/15' : 'bg-ink/[0.07]'} ${className}`}>
      <motion.div className={`h-full rounded-full ${v >= 1 ? (dark ? 'bg-white' : 'bg-ink') : 'bg-ruby'}`} initial={{ width: 0 }} animate={{ width: `${v * 100}%` }} transition={{ duration: 1, ease: EASE }} />
    </div>
  )
}

/** Tab strip with a sliding ink thumb. */
export function Tabs<T extends string>({ value, onChange, options, className = '' }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; icon?: IconName; count?: number }[]; className?: string }) {
  const id = useId()
  return (
    <div role="tablist" className={`no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 md:-mx-1 md:px-1 ${className}`} data-lenis-prevent>
      {options.map(o => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={`relative flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[13.5px] font-medium transition-colors duration-300 cursor-pointer ${active ? 'text-white' : 'text-ink/60 hover:bg-ink/[0.04] hover:text-ink'}`}
          >
            {active && <motion.span layoutId={`tab-${id}`} className="absolute inset-0 -z-0 rounded-full bg-ink shadow-[0_8px_20px_-10px_rgba(10,10,11,0.6)]" transition={{ type: 'spring', stiffness: 420, damping: 36 }} />}
            {o.icon && <Icon name={o.icon} size={15} className="relative" />}
            <span className="relative whitespace-nowrap">{o.label}</span>
            {o.count !== undefined && (
              <span className={`relative rounded-full px-1.5 py-px text-[10.5px] font-semibold tabular-nums ${active ? 'bg-white/15 text-white' : 'bg-ink/[0.06] text-ink/50'}`}>{o.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─── Dialogs ─────────────────────────────────────────────────────────────────

export function ConfirmModal({
  open, onClose, onConfirm, title, body, confirmLabel, tone = 'ruby', icon = 'info', children,
}: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; body?: ReactNode; confirmLabel: string; tone?: 'ruby' | 'ink'; icon?: IconName; children?: ReactNode }) {
  const t = useT(AC)
  return (
    <Modal open={open} onClose={onClose} label={title}>
      <div className="p-6 pt-7 md:p-8">
        <span className={`mb-5 flex h-11 w-11 items-center justify-center rounded-2xl ${tone === 'ruby' ? 'bg-ruby-soft text-ruby' : 'bg-ink/[0.06] text-ink'}`}>
          <Icon name={icon} size={20} />
        </span>
        <h2 className="pr-10 text-[20px] font-semibold tracking-tight text-ink">{title}</h2>
        {body && <div className="mt-2 text-[14px] leading-relaxed text-ink/60">{body}</div>}
        {children && <div className="mt-5">{children}</div>}
        <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose}>{t.cancel}</Button>
          <Button
            variant={tone === 'ruby' ? 'ruby' : 'ink'}
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

/** Floating glass bar that appears when a form has unsaved edits. */
export function SaveBar({ show, onSave, onDiscard }: { show: boolean; onSave: () => void; onDiscard: () => void }) {
  const t = useT(AC)
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ duration: 0.45, ease: EASE }}
          className="glass-dark fixed bottom-[calc(76px+env(safe-area-inset-bottom))] left-1/2 z-40 flex w-[calc(100%-24px)] max-w-md -translate-x-1/2 items-center gap-2 rounded-full py-1.5 pl-4 pr-1.5 md:bottom-5 md:gap-3 md:py-2 md:pl-5 md:pr-2 lg:left-[calc(50%+136px)]"
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inset-0 rounded-full bg-ruby-bright animate-pulse-ring" />
            <span className="relative h-2 w-2 rounded-full bg-ruby-bright" />
          </span>
          <span className="min-w-0 flex-1 truncate text-[13px] text-white/80">{t.unsaved}</span>
          <button type="button" onClick={onDiscard} className="h-10 shrink-0 rounded-full px-3 text-[13px] font-medium text-white/65 transition hover:text-white md:h-9 cursor-pointer">{t.discard}</button>
          <button type="button" onClick={onSave} className="h-10 shrink-0 rounded-full bg-ruby px-4 text-[13px] font-semibold text-white transition hover:bg-ruby-bright md:h-9 cursor-pointer">{t.save}</button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── WhatsApp previews ───────────────────────────────────────────────────────

/** Outgoing business message bubble in ink, with template id and read ticks in ruby. */
export function WaBubble({ body, template, at, compact = false, className = '' }: { body: string; template?: string; at?: string; compact?: boolean; className?: string }) {
  const lang = useLang()
  return (
    <div className={`flex justify-end ${className}`}>
      <div className={`relative max-w-[88%] rounded-[20px] rounded-tr-[6px] bg-ink text-white shadow-[0_10px_24px_-14px_rgba(10,10,11,0.7)] ${compact ? 'px-3.5 py-2.5' : 'px-4 py-3'}`}>
        <svg className="absolute -right-[6px] top-0 text-ink" width="10" height="12" viewBox="0 0 10 12" aria-hidden="true"><path d="M0 0h10L0 12Z" fill="currentColor" /></svg>
        {template && (
          <span className="mb-1.5 inline-flex items-center gap-1 rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[10px] tracking-tight text-white/65">
            <Icon name="sparkle" size={10} className="text-ruby-bright" />
            {template}
          </span>
        )}
        <p className={`whitespace-pre-line break-words leading-relaxed text-white/92 ${compact ? 'text-[12.5px]' : 'text-[13.5px]'}`}>{body}</p>
        <p className="mt-1 flex items-center justify-end gap-1 text-[10.5px] text-white/45">
          {at ? formatDateTime(at, lang) : lang === 'ta' ? 'இப்போது' : 'now'}
          <svg width="16" height="10" viewBox="0 0 16 10" className="text-ruby-bright" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="m1 5 3 3 6-7M7 8l1 0 6-7" />
          </svg>
        </p>
      </div>
    </div>
  )
}

/** A phone-ish chat frame around one or more bubbles. */
export function WaFrame({ name, sub, children, className = '' }: { name: string; sub?: string; children: ReactNode; className?: string }) {
  const lang = useLang()
  return (
    <div className={`overflow-hidden rounded-[22px] border hairline bg-mist ${className}`}>
      <div className="flex items-center gap-2.5 border-b hairline bg-white px-4 py-2.5">
        <Avatar name={name} size={30} tone="muted" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-ink">{name}</p>
          {sub && <p className="truncate text-[11px] text-ink/45">{sub}</p>}
        </div>
        <Icon name="whatsapp" size={16} className="text-ink/40" />
      </div>
      <div className="relative space-y-2.5 px-4 py-4">
        <div className={`pointer-events-none absolute inset-0 opacity-[0.05] ${lang === 'ta' ? 'kolam-bg' : ''}`} style={lang === 'ta' ? undefined : { backgroundImage: 'radial-gradient(rgba(10,10,11,0.9) 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
        <div className="relative space-y-2.5">{children}</div>
      </div>
    </div>
  )
}

export function WaMessage({ m, compact }: { m: OutboxMessage; compact?: boolean }) {
  return <WaBubble body={m.body} template={m.template} at={m.at} compact={compact} />
}

// ─── Misc ────────────────────────────────────────────────────────────────────

/** Copies text and briefly flips its icon to a check. */
export function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => {
        navigator.clipboard?.writeText(text).catch(() => {})
        setDone(true)
        window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => setDone(false), 1400)
      }}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink/40 md:h-7 md:w-7 transition hover:bg-ink/[0.05] hover:text-ink cursor-pointer"
    >
      <Icon name={done ? 'check' : 'copy'} size={13} className={done ? 'text-ruby' : ''} />
    </button>
  )
}

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map(i => (
        <Icon key={i} name="star" size={size} className={i <= Math.round(value) ? 'text-ruby' : 'text-ink/15'} fill={i <= Math.round(value) ? 'currentColor' : 'none'} strokeWidth={1.4} />
      ))}
    </span>
  )
}

/** Small label/value pair used in detail grids. */
export function Meta({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <dt className="t-label text-ink/40">{label}</dt>
      <dd className="mt-1.5 text-[14px] font-medium text-ink">{children}</dd>
    </div>
  )
}

/** Compact text input for dense admin forms. */
export function TextInput({
  label, value, onChange, placeholder, type = 'text', inputMode, prefix, className = '', rows, autoFocus, required, lang,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; inputMode?: 'text' | 'tel' | 'numeric' | 'email' | 'url' | 'decimal'
  prefix?: string; className?: string; rows?: number; autoFocus?: boolean; required?: boolean; lang?: string
}) {
  const id = useId()
  const base = 'w-full rounded-2xl border border-ink/10 bg-white text-[16px] text-ink md:text-[14px] outline-none transition placeholder:text-ink/30 focus:border-ruby focus:ring-4 focus:ring-ruby/10'
  return (
    <div className={className}>
      <label htmlFor={id} className="t-label mb-1.5 flex items-center gap-1 text-ink/50">
        {label}
        {required && <span className="text-ruby">*</span>}
      </label>
      {rows ? (
        <textarea id={id} lang={lang} rows={rows} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={`${base} resize-none px-3.5 py-2.5 leading-relaxed`} />
      ) : (
        <div className="relative">
          {prefix && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] font-medium text-ink/40">{prefix}</span>}
          <input id={id} lang={lang} type={type} inputMode={inputMode} value={value} autoFocus={autoFocus} required={required} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={`${base} h-11 ${prefix ? 'pl-8' : 'pl-3.5'} pr-3.5`} />
        </div>
      )}
    </div>
  )
}

/** Select matching TextInput's height and label style. */
export function FormSelect<T extends string>({ label, value, onChange, options, className = '' }: { label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; className?: string }) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="t-label mb-1.5 block text-ink/50">{label}</label>
      <div className="relative">
        <select id={id} value={value} onChange={e => onChange(e.target.value as T)} className="h-11 w-full cursor-pointer appearance-none rounded-2xl border border-ink/10 bg-white pl-3.5 pr-9 text-[16px] text-ink md:text-[14px] outline-none transition focus:border-ruby focus:ring-4 focus:ring-ruby/10">
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <Icon name="chevronDown" size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
      </div>
    </div>
  )
}
