import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useLenis } from 'lenis/react'
import { Icon, type IconName } from './Icon'
import { EASE, RevealText, Reveal } from './motion'
import { IMG, photoSrcSet, photoUrl, type ImgKey } from '../lib/images'
import { useLang, type Bi } from '../lib/i18n'
import { useSpeaker } from '../lib/speech'

// ─── Layout ──────────────────────────────────────────────────────────────────

export function Container({ children, className = '', wide = false }: { children: ReactNode; className?: string; wide?: boolean }) {
  return <div className={`mx-auto w-full pl-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] md:pl-[max(2rem,env(safe-area-inset-left))] md:pr-[max(2rem,env(safe-area-inset-right))] ${wide ? 'max-w-[1440px]' : 'max-w-6xl'} ${className}`}>{children}</div>
}

// ─── Buttons ─────────────────────────────────────────────────────────────────

type Variant = 'ruby' | 'ink' | 'white' | 'glass' | 'glass-dark' | 'outline' | 'outline-light' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  ruby: 'bg-ruby text-white hover:bg-ruby-bright shadow-ruby',
  ink: 'bg-ink text-white hover:bg-ink-3',
  white: 'bg-white text-ink hover:bg-mist shadow-soft',
  glass: 'glass text-ink hover:bg-white/80',
  'glass-dark': 'glass-dark text-white hover:bg-white/10',
  outline: 'border border-ink/15 text-ink hover:border-ink/40 hover:bg-ink/[0.03]',
  'outline-light': 'border border-white/25 text-white hover:border-white/60 hover:bg-white/5',
  ghost: 'text-ink/70 hover:text-ink hover:bg-ink/[0.04]',
}

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-4 text-[13px] gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-14 px-7 text-[15px] gap-2.5',
}

interface ButtonProps {
  children: ReactNode
  variant?: Variant
  size?: Size
  to?: string
  href?: string
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
  icon?: IconName
  iconLeft?: IconName
  full?: boolean
  className?: string
  ariaLabel?: string
}

/** Pill button. Pass `to` for an in-app link, `href` for external. */
export function Button({ children, variant = 'ruby', size = 'md', to, href, onClick, type = 'button', disabled, icon, iconLeft, full, className = '', ariaLabel }: ButtonProps) {
  const cls = `group relative inline-flex max-w-full items-center justify-center overflow-hidden rounded-full text-center font-medium tracking-tight transition-all duration-300 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 cursor-pointer select-none ${VARIANTS[variant]} ${SIZES[size]} ${full ? 'w-full' : ''} ${className}`
  const content = (
    <>
      {variant === 'ruby' && (
        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
      )}
      {iconLeft && <Icon name={iconLeft} size={size === 'sm' ? 15 : 17} />}
      <span className="relative leading-tight">{children}</span>
      {icon && <Icon name={icon} size={size === 'sm' ? 15 : 17} className="relative transition-transform duration-300 group-hover:translate-x-0.5" />}
    </>
  )
  if (to) return <Link to={to} className={cls} aria-label={ariaLabel} onClick={onClick}>{content}</Link>
  if (href) return <a href={href} target="_blank" rel="noreferrer" className={cls} aria-label={ariaLabel}>{content}</a>
  return <button type={type} onClick={onClick} disabled={disabled} className={cls} aria-label={ariaLabel}>{content}</button>
}

export function IconButton({ icon, onClick, label, variant = 'glass', size = 40, className = '', to }: { icon: IconName; onClick?: () => void; label: string; variant?: Variant; size?: number; className?: string; to?: string }) {
  const cls = `inline-flex items-center justify-center rounded-full transition-all duration-300 active:scale-95 cursor-pointer ${VARIANTS[variant]} ${className}`
  if (to) return <Link to={to} aria-label={label} title={label} className={cls} style={{ width: size, height: size }}><Icon name={icon} size={Math.round(size * 0.45)} /></Link>
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className={cls} style={{ width: size, height: size }}>
      <Icon name={icon} size={Math.round(size * 0.45)} />
    </button>
  )
}

// ─── Glass surfaces ──────────────────────────────────────────────────────────

type GlassTone = 'light' | 'strong' | 'dark' | 'ruby' | 'tint'
const GLASS: Record<GlassTone, string> = { light: 'glass', strong: 'glass-strong', dark: 'glass-dark', ruby: 'glass-ruby', tint: 'glass-ruby-tint' }

export function Glass({ children, tone = 'light', className = '', as = 'div' }: { children: ReactNode; tone?: GlassTone; className?: string; as?: 'div' | 'section' | 'aside' | 'article' }) {
  const Tag = as
  return <Tag className={`${GLASS[tone]} rounded-3xl ${className}`}>{children}</Tag>
}

/** Plain white card with hairline border, for dense app screens. */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl border hairline bg-white shadow-soft ${className}`}>{children}</div>
}

// ─── Typography ──────────────────────────────────────────────────────────────

export function Eyebrow({ children, dark = false, className = '' }: { children: ReactNode; dark?: boolean; className?: string }) {
  const lang = useLang()
  return (
    <span className={`t-eyebrow inline-flex items-start gap-2.5 leading-[1.5] ${dark ? 'text-white/70' : 'text-ink/55'} ${className}`}>
      {lang === 'ta' ? (
        <span className="mt-[calc(0.75em-4.5px)] grid shrink-0 grid-cols-2 gap-[3px]" aria-hidden="true">
          {[0, 1, 2, 3].map(i => <span key={i} className="h-[3px] w-[3px] rounded-full bg-ruby" />)}
        </span>
      ) : (
        <span className="mt-[calc(0.75em-0.5px)] h-px w-6 shrink-0 bg-ruby" aria-hidden="true" />
      )}
      {children}
    </span>
  )
}

export function SectionHeading({
  eyebrow, title, lead, align = 'left', dark = false, className = '', size = 't-2',
}: { eyebrow?: string; title: string; lead?: string; align?: 'left' | 'center'; dark?: boolean; className?: string; size?: 't-1' | 't-2' | 't-3' }) {
  return (
    <div className={`${align === 'center' ? 'mx-auto text-center items-center' : 'items-start'} flex max-w-3xl flex-col ${className}`}>
      {eyebrow && <Reveal><Eyebrow dark={dark}>{eyebrow}</Eyebrow></Reveal>}
      <RevealText text={title} className={`${size} mt-4 ${dark ? 'text-white' : 'text-ink'}`} />
      {lead && (
        <Reveal delay={0.15}>
          <p className={`t-lead mt-5 max-w-2xl ${dark ? 'text-white/65' : 'text-ink/60'}`}>{lead}</p>
        </Reveal>
      )}
    </div>
  )
}

// ─── Images ──────────────────────────────────────────────────────────────────

interface ImgProps {
  k?: ImgKey
  src?: string
  alt?: string
  /** Largest rendered width in px; drives srcset. */
  w?: number
  /** Force a crop ratio (w/h). Omit to keep the photo's natural ratio. */
  ratio?: number
  sizes?: string
  className?: string
  imgClassName?: string
  priority?: boolean
  dark?: boolean
}

/** Adds `relative` only when the caller hasn't positioned the element itself (e.g. `absolute inset-0`). */
const positioned = (cls: string) => (/\b(absolute|fixed|sticky)\b/.test(cls) ? '' : 'relative')

/** Photo with a shimmering placeholder and a soft blur-up once loaded. */
export function Img({ k, src, alt, w = 1200, ratio, sizes = '100vw', className = '', imgClassName = '', priority = false, dark = false }: ImgProps) {
  const [loaded, setLoaded] = useState(false)
  const ref = useRef<HTMLImageElement>(null)
  const url = k ? photoUrl(k, w, ratio ? Math.round(w / ratio) : undefined) : src
  const srcSet = k ? photoSrcSet(k, [480, 800, 1200, 1800, 2400].filter(x => x <= Math.max(w * 1.5, 800)), ratio) : undefined

  useEffect(() => {
    if (ref.current?.complete && ref.current.naturalWidth > 0) setLoaded(true)
  }, [url])

  return (
    <div className={`${positioned(className)} overflow-hidden ${loaded ? '' : dark ? 'skeleton-dark' : 'skeleton'} ${className}`}>
      <img
        ref={ref}
        src={url}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt ?? (k ? IMG[k].alt : '')}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={() => setLoaded(true)}
        className={`h-full w-full object-cover transition-[opacity,filter,transform] duration-[900ms] ease-out ${loaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-md scale-[1.03]'} ${imgClassName}`}
      />
    </div>
  )
}

/** Picks the modern or traditional photo for the current language and crossfades on switch. */
export function LangImg({ pair, className = '', ...rest }: Omit<ImgProps, 'k' | 'src'> & { pair: Bi<ImgKey> }) {
  const lang = useLang()
  const k = pair[lang]
  return (
    <div className={`${positioned(className)} overflow-hidden ${className}`}>
      <AnimatePresence initial={false}>
        <motion.div key={k} className="absolute inset-0" initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1, ease: EASE }}>
          <Img k={k} className="h-full w-full" {...rest} />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ─── Form controls ───────────────────────────────────────────────────────────

const fieldBase = 'w-full rounded-2xl border bg-white/80 px-4 text-base md:text-[15px] text-ink placeholder:text-ink/35 outline-none transition-all duration-200 focus:border-ruby focus:bg-white focus:ring-4 focus:ring-ruby/10'

export function Field({
  label, value, onChange, type = 'text', placeholder, required, hint, error, rows, icon, autoFocus, inputMode, maxLength, dark = false, name,
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean; hint?: string; error?: string
  rows?: number; icon?: IconName; autoFocus?: boolean; inputMode?: 'text' | 'tel' | 'numeric' | 'email'; maxLength?: number; dark?: boolean; name?: string
}) {
  const id = useId()
  const border = error ? 'border-ruby' : dark ? 'border-white/15' : 'border-ink/10'
  const darkCls = dark ? '!bg-white/5 !text-white placeholder:!text-white/35 focus:!bg-white/10' : ''
  return (
    <div>
      <label htmlFor={id} className={`t-label mb-2 flex items-center gap-1 ${dark ? 'text-white/60' : 'text-ink/55'}`}>
        {label}
        {required && <span className="text-ruby">*</span>}
      </label>
      <div className="relative">
        {icon && <Icon name={icon} size={17} className={`pointer-events-none absolute left-4 top-[15px] ${dark ? 'text-white/40' : 'text-ink/35'}`} />}
        {rows ? (
          <textarea id={id} name={name} rows={rows} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required} maxLength={maxLength} className={`${fieldBase} ${border} ${darkCls} resize-none py-3.5 ${icon ? 'pl-11' : ''}`} />
        ) : (
          <input id={id} name={name} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required} autoFocus={autoFocus} inputMode={inputMode} maxLength={maxLength} className={`${fieldBase} ${border} ${darkCls} h-[52px] ${icon ? 'pl-11' : ''}`} />
        )}
      </div>
      {(error || hint) && <p className={`mt-1.5 text-xs ${error ? 'text-ruby' : dark ? 'text-white/45' : 'text-ink/45'}`}>{error || hint}</p>}
    </div>
  )
}

export function Select({ label, value, onChange, options, required }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; required?: boolean }) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="t-label mb-2 flex items-center gap-1 text-ink/55">
        {label}
        {required && <span className="text-ruby">*</span>}
      </label>
      <div className="relative">
        <select id={id} value={value} onChange={e => onChange(e.target.value)} required={required} className={`${fieldBase} border-ink/10 h-[52px] appearance-none pr-10 cursor-pointer`}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <Icon name="chevronDown" size={16} className="pointer-events-none absolute right-4 top-[18px] text-ink/40" />
      </div>
    </div>
  )
}

/** Apple-style segmented control with a sliding glass thumb. */
export function Segmented<T extends string>({ value, onChange, options, dark = false, size = 'md', className = '' }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; dark?: boolean; size?: 'sm' | 'md'; className?: string }) {
  const id = useId()
  return (
    <div role="radiogroup" className={`relative inline-flex rounded-full p-1 ${dark ? 'bg-white/10' : 'bg-ink/[0.05]'} ${className}`}>
      {options.map(o => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`relative z-10 rounded-full font-medium transition-colors duration-300 cursor-pointer ${size === 'sm' ? 'h-7 px-3 text-xs' : 'h-10 px-4 text-sm md:h-9'} ${active ? (dark ? 'text-ink' : 'text-ink') : dark ? 'text-white/70 hover:text-white' : 'text-ink/55 hover:text-ink'}`}
          >
            {active && <motion.span layoutId={`seg-${id}`} className="absolute inset-0 -z-10 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_14px_-4px_rgba(0,0,0,0.18)]" transition={{ type: 'spring', stiffness: 420, damping: 36 }} />}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/** Selectable pill. */
export function Chip({ active, onClick, children, dark = false, className = '' }: { active: boolean; onClick: () => void; children: ReactNode; dark?: boolean; className?: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-all duration-300 cursor-pointer active:scale-[0.97] ${
        active
          ? 'border-ruby bg-ruby text-white shadow-ruby'
          : dark
            ? 'border-white/15 bg-white/5 text-white/75 hover:border-white/40 hover:text-white'
            : 'border-ink/10 bg-white/70 text-ink/70 hover:border-ink/30 hover:text-ink'
      } ${className}`}
    >
      {children}
    </button>
  )
}

/** Large selectable card used for choices in the booking flow and album builder. */
export function ChoiceCard({ active, onClick, children, className = '' }: { active: boolean; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`group relative w-full overflow-hidden rounded-3xl border text-left transition-all duration-300 cursor-pointer active:scale-[0.99] ${
        active ? 'border-ruby bg-ruby-soft/70 ring-4 ring-ruby/10' : 'border-ink/10 bg-white/70 hover:border-ink/25 hover:bg-white'
      } ${className}`}
    >
      {children}
      <span className={`absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full border transition-all duration-300 ${active ? 'border-ruby bg-ruby text-white scale-100' : 'border-ink/15 bg-white/80 text-transparent scale-90'}`}>
        <Icon name="check" size={14} strokeWidth={2.4} />
      </span>
    </button>
  )
}

export function Badge({ children, tone = 'muted', className = '' }: { children: ReactNode; tone?: 'ruby' | 'ink' | 'muted' | 'outline' | 'white'; className?: string }) {
  const tones = {
    ruby: 'bg-ruby text-white',
    ink: 'bg-ink text-white',
    muted: 'bg-ink/[0.06] text-ink/70',
    outline: 'border border-ink/15 text-ink/70',
    white: 'bg-white/90 text-ink',
  }
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${tones[tone]} ${className}`}>{children}</span>
}

// ─── Modal ───────────────────────────────────────────────────────────────────

function useMedia(query: string) {
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

/** Glass sheet over a blurred backdrop; a bottom sheet on phones. Locks smooth-scroll while open. */
export function Modal({ open, onClose, children, className = '', label }: { open: boolean; onClose: () => void; children: ReactNode; className?: string; label: string }) {
  const lenis = useLenis()
  const lang = useLang()
  const sheet = useMedia('(max-width: 639px)')
  useEffect(() => {
    if (!open) return
    lenis?.stop()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      lenis?.start()
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose, lenis])

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-md" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            data-lenis-prevent
            className={`glass-strong relative max-h-[90svh] w-full max-w-lg overflow-y-auto rounded-t-[28px] sm:max-h-[92vh] sm:rounded-[28px] ${className}`}
            initial={sheet ? { y: '100%' } : { opacity: 0, y: 40, scale: 0.97 }}
            animate={sheet ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
            exit={sheet ? { y: '100%' } : { opacity: 0, y: 30, scale: 0.98 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <span className="pointer-events-none absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-ink/15 sm:hidden" aria-hidden="true" />
            <button type="button" onClick={onClose} aria-label={lang === 'ta' ? 'மூடு' : 'Close'} className="absolute right-4 top-4 z-10 flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-ink/[0.06] text-ink/60 transition hover:bg-ink/10 hover:text-ink cursor-pointer">
              <Icon name="x" size={16} />
            </button>
            {children}
            <div className="h-[env(safe-area-inset-bottom)] sm:hidden" aria-hidden="true" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

// ─── Misc ────────────────────────────────────────────────────────────────────

/** Reads text aloud in the current language (Gemini TTS stand-in). */
export function ListenButton({ text, dark = false, className = '' }: { text: Bi; dark?: boolean; className?: string }) {
  const lang = useLang()
  const { speak, stop, speaking, supported } = useSpeaker(lang)
  if (!supported) return null
  return (
    <button
      type="button"
      onClick={() => (speaking ? stop() : speak(text[lang]))}
      className={`inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-[13px] font-medium transition cursor-pointer ${dark ? 'glass-dark hover:bg-white/10' : 'glass hover:bg-white'} ${className}`}
      aria-label={speaking ? 'Stop' : 'Listen'}
    >
      <span className="relative flex h-4 w-4 items-center justify-center">
        {speaking && <span className="absolute inset-0 rounded-full bg-ruby/40 animate-pulse-ring" />}
        <Icon name={speaking ? 'pause' : 'volume'} size={15} className={speaking ? 'text-ruby' : ''} />
      </span>
      {speaking ? (lang === 'ta' ? 'நிறுத்து' : 'Stop') : lang === 'ta' ? 'குரலில் கேளுங்கள்' : 'Listen'}
    </button>
  )
}

export function EmptyState({ icon, title, body, action }: { icon: IconName; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-ink/15 px-6 py-16 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-ink/[0.04] text-ink/40">
        <Icon name={icon} size={22} />
      </span>
      <p className="t-3">{title}</p>
      {body && <p className="mt-2 max-w-sm text-sm text-ink/55">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="group inline-flex items-center gap-2 text-sm font-medium text-ink/55 transition hover:text-ink">
      <Icon name="arrowLeft" size={16} className="transition-transform group-hover:-translate-x-0.5" />
      {children}
    </Link>
  )
}

/** Horizontal step progress used by multi-step flows. */
export function Steps({ steps, current, onStep }: { steps: string[]; current: number; onStep?: (i: number) => void }) {
  const shown = Math.min(current, steps.length - 1)
  return (
    <div className="w-full">
      <ol className="flex w-full items-center gap-2">
        {steps.map((s, i) => {
          const done = i < current
          const active = i === current
          return (
            <li key={s} className="flex min-w-0 flex-1 flex-col gap-2">
              <button
                type="button"
                disabled={!onStep || i > current}
                onClick={() => onStep?.(i)}
                className="-my-[18px] flex h-10 w-full items-center disabled:cursor-default cursor-pointer sm:my-0 sm:h-1"
                aria-label={s}
              >
                <span className="block h-1 w-full overflow-hidden rounded-full bg-ink/10">
                  <motion.span className="block h-full rounded-full bg-ruby" initial={false} animate={{ width: done ? '100%' : active ? '45%' : '0%' }} transition={{ duration: 0.7, ease: EASE }} />
                </span>
              </button>
              <span className={`hidden truncate text-[12px] font-medium sm:block ${active ? 'text-ink' : done ? 'text-ink/60' : 'text-ink/35'}`}>
                {i + 1}. {s}
              </span>
            </li>
          )
        })}
      </ol>
      <p className="mt-2.5 truncate text-[12px] font-medium text-ink/60 sm:hidden">
        <span className="tabular-nums">{shown + 1} / {steps.length}</span> · <span className="text-ink">{steps[shown]}</span>
      </p>
    </div>
  )
}
