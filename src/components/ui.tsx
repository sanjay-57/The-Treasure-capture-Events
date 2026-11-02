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

type Variant = 'ruby' | 'ink' | 'white' | 'glass' | 'glass-dark' | 'glass-ruby' | 'glass-ruby-clear' | 'outline' | 'outline-light' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  ruby: 'btn-ruby text-white',
  ink: 'bg-ink text-white hover:bg-ink-3',
  white: 'bg-white text-ink hover:bg-mist shadow-soft',
  glass: 'glass text-ink hover:bg-white/80',
  'glass-dark': 'glass-dark text-white hover:bg-white/10',
  'glass-ruby': 'glass-ruby glass-ruby-hover text-white',
  'glass-ruby-clear': 'glass-ruby-clear glass-ruby-hover text-white',
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
      {(variant === 'ruby' || variant === 'glass-ruby') && (
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

type GlassTone = 'light' | 'strong' | 'dark' | 'ruby' | 'ruby-clear' | 'ruby-dark' | 'tint'
const GLASS: Record<GlassTone, string> = { light: 'glass', strong: 'glass-strong', dark: 'glass-dark', ruby: 'glass-ruby', 'ruby-clear': 'glass-ruby-clear', 'ruby-dark': 'glass-ruby-dark', tint: 'glass-ruby-tint' }

export function Glass({ children, tone = 'light', className = '', as = 'div' }: { children: ReactNode; tone?: GlassTone; className?: string; as?: 'div' | 'section' | 'aside' | 'article' }) {
  const Tag = as
  return <Tag className={`${GLASS[tone]} rounded-3xl ${className}`}>{children}</Tag>
}

/** Light ruby-glass card with hairline border, for dense app screens. */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`glass-strong rounded-3xl ${className}`}>{children}</div>
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

/**
 * Stack of photos that slowly crossfades through `keys`. Starts on a per-card
 * `offset` (ms) so neighbouring cards don't change in unison.
 */
export function CrossfadeImg({ keys, interval = 5200, offset = 0, ...rest }: { keys: ImgKey[]; interval?: number; offset?: number } & Omit<ImgProps, 'k' | 'src'>) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (keys.length < 2) return
    let id: number | undefined
    const start = window.setTimeout(() => {
      setI(n => (n + 1) % keys.length)
      id = window.setInterval(() => setI(n => (n + 1) % keys.length), interval)
    }, offset + interval)
    return () => { window.clearTimeout(start); if (id) window.clearInterval(id) }
  }, [keys, interval, offset])
  if (keys.length < 2) return <Img k={keys[0]} {...rest} />
  const { className = '', imgClassName = '', ...img } = rest
  return (
    <div className={`${positioned(className)} overflow-hidden ${className}`}>
      {keys.map((k, n) => (
        <Img key={k} k={k} {...img} className={`absolute inset-0 transition-opacity duration-[1400ms] ease-out ${n === i ? 'opacity-100' : 'opacity-0'}`} imgClassName={imgClassName} priority={img.priority && n === 0} />
      ))}
    </div>
  )
}

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

const fieldBase = 'w-full rounded-2xl border bg-white/80 px-4 text-[16px] md:text-[15px] text-ink placeholder:text-ink/35 outline-none transition-all duration-200 focus:border-ruby focus:bg-white focus:ring-4 focus:ring-ruby/10'

export function Field({
  label, value, onChange, type = 'text', placeholder, required, hint, error, rows, icon, autoFocus, inputMode, maxLength, dark = false, name, autoComplete, enterKeyHint,
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean; hint?: string; error?: string
  rows?: number; icon?: IconName; autoFocus?: boolean; inputMode?: 'text' | 'tel' | 'numeric' | 'email'; maxLength?: number; dark?: boolean; name?: string
  autoComplete?: string; enterKeyHint?: 'next' | 'done' | 'send' | 'go'
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
          <textarea id={id} name={name} rows={rows} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required} maxLength={maxLength} autoComplete={autoComplete} enterKeyHint={enterKeyHint} className={`${fieldBase} ${border} ${darkCls} resize-none py-3.5 ${icon ? 'pl-11' : ''}`} />
        ) : (
          <input id={id} name={name} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required} autoFocus={autoFocus} inputMode={inputMode} maxLength={maxLength} autoComplete={autoComplete} enterKeyHint={enterKeyHint} className={`${fieldBase} ${border} ${darkCls} h-[52px] ${icon ? 'pl-11' : ''}`} />
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
            className={`relative z-10 rounded-full font-medium transition-colors duration-300 cursor-pointer ${size === 'sm' ? 'h-10 px-3.5 text-xs md:h-7 md:px-3' : 'h-10 px-4 text-sm md:h-9'} ${active ? (dark ? 'text-ink' : 'text-ink') : dark ? 'text-white/70 hover:text-white' : 'text-ink/55 hover:text-ink'}`}
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
          ? 'border-transparent glass-ruby text-white'
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
        active ? 'border-transparent glass-ruby-tint ring-ruby-glow' : 'border-ink/10 bg-white/70 hover:border-ink/25 hover:bg-white'
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
    ruby: 'glass-ruby text-white',
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

/**
 * Locks native page scroll while `active`. Lenis.stop() only halts wheel
 * smoothing; touch scrolling on phones is native, so the page behind a sheet
 * or menu would still move. Counted, so stacked overlays unlock in order.
 */
let scrollLocks = 0
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    const root = document.documentElement
    if (scrollLocks++ === 0) root.style.overflow = 'hidden'
    return () => {
      if (--scrollLocks === 0) root.style.overflow = ''
    }
  }, [active])
}

/** Glass sheet over a blurred backdrop; a bottom sheet on phones. Locks smooth-scroll while open. */
export function Modal({ open, onClose, children, className = '', label }: { open: boolean; onClose: () => void; children: ReactNode; className?: string; label: string }) {
  const lenis = useLenis()
  const lang = useLang()
  const sheet = useMedia('(max-width: 639px)')
  useScrollLock(open)
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

  // Portals can't render on the server (build-time prerender); the client mounts it after hydration.
  if (typeof document === 'undefined') return null
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
            className={`glass-strong relative max-h-[90svh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-t-[28px] sm:max-h-[92vh] sm:rounded-[28px] ${className}`}
            initial={sheet ? { y: '100%' } : { opacity: 0, y: 40, scale: 0.97 }}
            animate={sheet ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
            exit={sheet ? { y: '100%' } : { opacity: 0, y: 30, scale: 0.98 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <span className="pointer-events-none absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-ink/15 sm:hidden" aria-hidden="true" />
            <button type="button" onClick={onClose} aria-label={lang === 'ta' ? 'மூடு' : 'Close'} className="absolute right-3 top-3 z-10 flex h-11 w-11 sm:right-4 sm:top-4 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-ink/[0.06] text-ink/60 transition hover:bg-ink/10 hover:text-ink cursor-pointer">
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


// ─── Date & time pickers ─────────────────────────────────────────────────────

const pad2 = (n: number) => String(n).padStart(2, '0')
const toISO = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
const fromISO = (v: string) => { const [y, m, d] = v.split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1) }

/**
 * Inline month calendar in the Apple style: month header with arrows, weekday
 * row, day grid with today ringed and the chosen day as a ruby pill. Quick
 * chips jump to common choices. Dates before `min` are disabled.
 */
export function DatePicker({ value, onChange, min, lang = 'en', className = '' }: { value: string; onChange: (iso: string) => void; min?: string; lang?: 'en' | 'ta'; className?: string }) {
  const locale = lang === 'ta' ? 'ta-IN' : 'en-IN'
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const minDate = min ? fromISO(min) : today
  const selected = value ? fromISO(value) : null
  const [view, setView] = useState(() => { const b = selected ?? (minDate > today ? minDate : today); return new Date(b.getFullYear(), b.getMonth(), 1) })
  useEffect(() => { if (selected) setView(new Date(selected.getFullYear(), selected.getMonth(), 1)) }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(view)
  const weekdays = lang === 'ta' ? ['ஞா', 'தி', 'செ', 'பு', 'வி', 'வெ', 'ச'] : Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(new Date(2024, 0, 7 + i))) // Sun..Sat
  const first = new Date(view.getFullYear(), view.getMonth(), 1)
  const lead = first.getDay()
  const dim = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate()
  const cells: (Date | null)[] = [...Array(lead).fill(null), ...Array.from({ length: dim }, (_, i) => new Date(view.getFullYear(), view.getMonth(), i + 1))]
  while (cells.length % 7) cells.push(null)
  const canPrev = new Date(view.getFullYear(), view.getMonth(), 0) >= new Date(minDate.getFullYear(), minDate.getMonth(), 1)
  const shift = (n: number) => setView(v => new Date(v.getFullYear(), v.getMonth() + n, 1))

  const quick: { label: string; d: Date }[] = []
  const addDays = (n: number) => { const d = new Date(today); d.setDate(d.getDate() + n); return d }
  const nextDow = (dow: number) => { const d = new Date(today); d.setDate(d.getDate() + ((dow - d.getDay() + 7) % 7 || 7)); return d }
  quick.push({ label: lang === 'ta' ? 'இன்று' : 'Today', d: today })
  quick.push({ label: lang === 'ta' ? 'நாளை' : 'Tomorrow', d: addDays(1) })
  quick.push({ label: lang === 'ta' ? 'சனி' : 'Saturday', d: nextDow(6) })
  quick.push({ label: lang === 'ta' ? 'ஞாயிறு' : 'Sunday', d: nextDow(0) })

  return (
    <div className={`flex flex-col rounded-[22px] border border-ruby/12 bg-white p-3 shadow-[0_1px_2px_rgba(155,17,30,0.04),0_14px_36px_-20px_rgba(155,17,30,0.25)] sm:p-4 ${className}`}>
      <div className="flex items-center justify-between px-1">
        <button type="button" onClick={() => shift(-1)} disabled={!canPrev} aria-label="Previous month" className="flex h-11 w-11 items-center justify-center rounded-full text-ink/60 transition hover:bg-ruby-soft sm:h-9 sm:w-9 hover:text-ruby disabled:opacity-25 cursor-pointer disabled:cursor-default"><Icon name="chevronLeft" size={18} /></button>
        <AnimatePresence mode="wait" initial={false}>
          <motion.p key={monthLabel} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} className={`whitespace-nowrap font-display font-semibold text-ink ${lang === 'ta' ? 'text-[0.98rem]' : 'text-[1.15rem]'}`}>{monthLabel}</motion.p>
        </AnimatePresence>
        <button type="button" onClick={() => shift(1)} aria-label="Next month" className="flex h-11 w-11 items-center justify-center rounded-full text-ink/60 transition hover:bg-ruby-soft sm:h-9 sm:w-9 hover:text-ruby cursor-pointer"><Icon name="chevronRight" size={18} /></button>
      </div>
      <div className="mt-3 grid grid-cols-7 text-center">
        {weekdays.map((w, i) => <span key={i} className={`py-1 font-semibold uppercase tracking-wider text-ink/40 ${lang === 'ta' ? 'text-[10px]' : 'text-[11px]'}`}>{w}</span>)}
      </div>
      <div role="grid" className="grid flex-1 grid-cols-7 content-start gap-y-1">
        {cells.map((d, i) => {
          if (!d) return <span key={i} />
          const iso = toISO(d)
          const disabled = d < minDate
          const isSel = iso === value
          const isToday = iso === toISO(today)
          return (
            <button
              key={iso}
              type="button"
              role="gridcell"
              aria-selected={isSel}
              disabled={disabled}
              onClick={() => onChange(iso)}
              className={`relative mx-auto flex h-10 w-10 items-center justify-center rounded-full text-[14px] tabular-nums transition-all duration-200 ${
                isSel ? 'bg-ruby font-semibold text-white shadow-ruby' : disabled ? 'text-ink/20 cursor-default' : 'text-ink hover:bg-ruby-soft hover:text-ruby cursor-pointer'
              } ${isToday && !isSel ? 'ring-1 ring-ruby/50 font-semibold' : ''}`}
            >
              {d.getDate()}
            </button>
          )
        })}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-1.5 border-t border-ruby/10 pt-3">
        {quick.map(q => {
          const iso = toISO(q.d)
          const on = iso === value
          return <button key={q.label} type="button" onClick={() => onChange(iso)} className={`h-9 whitespace-nowrap rounded-full px-2 text-[12.5px] font-medium transition cursor-pointer ${on ? 'bg-ruby text-white shadow-ruby' : 'bg-ink/[0.04] text-ink/70 hover:bg-ruby-soft hover:text-ruby'}`}>{q.label}</button>
        })}
      </div>
    </div>
  )
}

export function TimePicker({ value, onChange, lang = 'en', className = '' }: { value: string; onChange: (v: string) => void; lang?: 'en' | 'ta'; className?: string }) {
  const hh = value ? Number(value.split(':')[0]) : NaN
  const mm = value ? Number(value.split(':')[1]) : NaN
  const period: 'AM' | 'PM' = Number.isNaN(hh) ? 'AM' : hh >= 12 ? 'PM' : 'AM'
  // Local text so the user can type freely; committed on blur / Enter / when complete.
  const [hText, setHText] = useState(Number.isNaN(hh) ? '' : String(((hh + 11) % 12) + 1))
  const [mText, setMText] = useState(Number.isNaN(mm) ? '' : pad2(mm))
  const minRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    setHText(Number.isNaN(hh) ? '' : String(((hh + 11) % 12) + 1))
    setMText(Number.isNaN(mm) ? '' : pad2(mm))
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  const commit = (h: string, m: string, p: 'AM' | 'PM') => {
    const hn = Number(h)
    if (!h || Number.isNaN(hn) || hn < 1 || hn > 12) return
    const mn = m === '' ? 0 : Number(m)
    if (Number.isNaN(mn) || mn < 0 || mn > 59) return
    onChange(`${pad2(p === 'PM' ? (hn % 12) + 12 : hn % 12)}:${pad2(mn)}`)
  }
  const onHour = (raw: string) => {
    const v = raw.replace(/\D/g, '').slice(0, 2)
    setHText(v)
    // Auto-advance once the hour is unambiguous (2 digits, or a digit > 1).
    if (v.length === 2 || (v.length === 1 && Number(v) > 1)) { commit(v, mText, period); minRef.current?.focus(); minRef.current?.select() }
  }
  const onMinute = (raw: string) => {
    const v = raw.replace(/\D/g, '').slice(0, 2)
    setMText(v)
    if (v.length === 2) commit(hText, v, period)
  }
  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { e.preventDefault(); commit(hText, mText, period); (e.target as HTMLInputElement).blur() } }

  const slots: { label: string; v: string }[] = [
    { label: lang === 'ta' ? 'அதிகாலை 6:00' : '6:00 AM', v: '06:00' },
    { label: lang === 'ta' ? 'காலை 7:30' : '7:30 AM', v: '07:30' },
    { label: lang === 'ta' ? 'காலை 9:00' : '9:00 AM', v: '09:00' },
    { label: lang === 'ta' ? 'காலை 10:30' : '10:30 AM', v: '10:30' },
    { label: lang === 'ta' ? 'மாலை 5:00' : '5:00 PM', v: '17:00' },
    { label: lang === 'ta' ? 'மாலை 6:30' : '6:30 PM', v: '18:30' },
  ]
  const box = 'h-14 w-full min-w-0 max-w-[4.6rem] flex-1 rounded-2xl border border-ruby/15 bg-mist/60 text-center font-display text-[1.75rem] font-semibold tabular-nums text-ink outline-none transition placeholder:text-ink/25 focus:border-ruby focus:bg-white focus:ring-4 focus:ring-ruby/10'
  return (
    <div className={`rounded-[22px] border border-ruby/12 bg-white p-3 shadow-[0_1px_2px_rgba(155,17,30,0.04),0_14px_36px_-20px_rgba(155,17,30,0.25)] sm:p-4 ${className}`}>
      <div className="flex items-center gap-2 sm:gap-3">
        <input
          type="text" inputMode="numeric" pattern="[0-9]*" placeholder="9" maxLength={2} aria-label="Hour"
          value={hText} onChange={e => onHour(e.target.value)} onBlur={() => commit(hText, mText, period)} onKeyDown={onKey} onFocus={e => e.target.select()}
          className={box}
        />
        <span className="shrink-0 font-display text-[1.7rem] font-semibold text-ink/40">:</span>
        <input
          ref={minRef}
          type="text" inputMode="numeric" pattern="[0-9]*" placeholder="00" maxLength={2} aria-label="Minute"
          value={mText} onChange={e => onMinute(e.target.value)} onBlur={() => { if (mText.length === 1) setMText(pad2(Number(mText))); commit(hText, mText, period) }} onKeyDown={onKey} onFocus={e => e.target.select()}
          className={box}
        />
        <div role="radiogroup" aria-label="AM or PM" className="ml-auto flex h-14 shrink-0 items-center rounded-2xl bg-ink/[0.05] p-1">
          {(['AM', 'PM'] as const).map(p => {
            const on = period === p && !!value
            return (
              <button key={p} type="button" role="radio" aria-checked={on} onClick={() => commit(hText || '9', mText, p)} className={`h-full rounded-xl px-3 text-[13.5px] font-semibold transition cursor-pointer ${on ? 'bg-ruby text-white shadow-ruby' : 'text-ink/60 hover:text-ruby'}`}>
                {lang === 'ta' ? (p === 'AM' ? 'மு.ப' : 'பி.ப') : p}
              </button>
            )
          })}
        </div>
      </div>
      <div className={`mt-3 grid gap-1.5 border-t border-ruby/10 pt-3 ${lang === 'ta' ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {slots.map(sl => {
          const on = sl.v === value
          return <button key={sl.v} type="button" onClick={() => onChange(sl.v)} className={`h-9 whitespace-nowrap rounded-full px-2 text-[12.5px] font-medium tabular-nums transition cursor-pointer ${on ? 'bg-ruby text-white shadow-ruby' : 'bg-ink/[0.04] text-ink/70 hover:bg-ruby-soft hover:text-ruby'}`}>{sl.label}</button>
        })}
      </div>
      <button type="button" onClick={() => { onChange(''); setHText(''); setMText('') }} className={`mt-2 h-7 w-full rounded-full text-[12px] font-medium text-ink/45 transition hover:text-ruby cursor-pointer ${value ? '' : 'invisible'}`}>{lang === 'ta' ? 'நேரத்தை அழி' : 'Clear time'}</button>
    </div>
  )
}
