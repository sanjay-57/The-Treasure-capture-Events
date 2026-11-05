import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Icon, type IconName } from '../../components/Icon'
import { EASE } from '../../components/motion'
import { useLang, type Lang } from '../../lib/i18n'
import { useStore } from '../../lib/store'
import { useProofSrc } from '../blobs'
import type { Proof } from '../types'
import { gateCopy } from './copy'

/** Small building blocks of the client gallery, all in the studio's accent (never TTC ruby). */

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { icon?: IconName; variant?: 'accent' | 'outline' | 'ghost-dark'; children: ReactNode }

export function AccentButton({ icon, variant = 'accent', className = '', children, type = 'button', ...rest }: BtnProps) {
  const look =
    variant === 'accent'
      ? 'bg-[var(--accent)] text-[var(--accent-ink)] shadow-[0_10px_30px_-12px_var(--accent-ring)] hover:brightness-110'
      : variant === 'outline'
        ? 'border border-ink/15 text-ink hover:bg-ink/[0.04]'
        : 'border border-white/20 text-white hover:bg-white/10'
  return (
    <button
      type={type}
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[14px] font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-ring)] disabled:cursor-default disabled:opacity-40 cursor-pointer ${look} ${className}`}
      {...rest}
    >
      {children}
      {icon && <Icon name={icon} size={17} />}
    </button>
  )
}

/** Proof image with soft protection: no right-click save, no drag, no iOS long-press callout. */
export function ProofImg({ proof, size = 'thumb', className = '', alt = '' }: { proof: Proof; size?: 'thumb' | 'full'; className?: string; alt?: string }) {
  const src = useProofSrc(proof, size)
  if (!src) return <span className={`block animate-pulse bg-ink/[0.06] ${className}`} aria-hidden="true" />
  return (
    <img
      src={src}
      alt={alt}
      loading={size === 'thumb' ? 'lazy' : 'eager'}
      decoding="async"
      draggable={false}
      onContextMenu={e => e.preventDefault()}
      onDragStart={e => e.preventDefault()}
      style={{ WebkitTouchCallout: 'none' }}
      className={`select-none ${className}`}
    />
  )
}

export function Heart({ selected, onToggle, label, size = 36, disabled = false }: { selected: boolean; onToggle: () => void; label: string; size?: number; disabled?: boolean }) {
  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={e => {
        e.stopPropagation()
        onToggle()
      }}
      whileTap={{ scale: 0.82 }}
      aria-pressed={selected}
      aria-label={label}
      className={`relative flex items-center justify-center rounded-full transition-colors duration-300 cursor-pointer before:absolute before:-inset-1.5 before:content-[''] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-ring)] disabled:cursor-default ${
        selected ? 'bg-[var(--accent)] text-[var(--accent-ink)] shadow-[0_6px_18px_-6px_var(--accent-ring)]' : 'bg-white/85 text-ink backdrop-blur hover:bg-white'
      }`}
      style={{ width: size, height: size }}
    >
      <AnimatePresence>
        {selected && (
          <motion.span key="burst" className="absolute inset-0 rounded-full border-2 border-[var(--accent)]" initial={{ scale: 1, opacity: 0.9 }} animate={{ scale: 1.9, opacity: 0 }} transition={{ duration: 0.6, ease: EASE }} />
        )}
      </AnimatePresence>
      <Icon name="heart" size={Math.round(size * 0.45)} strokeWidth={1.8} className={selected ? 'fill-current' : ''} />
    </motion.button>
  )
}

export function AnimatedCount({ value }: { value: number }) {
  return (
    <span className="relative inline-flex overflow-hidden align-bottom tabular-nums">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={value} initial={{ y: '100%', opacity: 0 }} animate={{ y: '0%', opacity: 1 }} exit={{ y: '-100%', opacity: 0 }} transition={{ duration: 0.35, ease: EASE }} className="inline-block">
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

/** Album quota as a ring in the studio accent; dashed amber when over quota. */
export function QuotaRing({ ratio, over, size = 56, dark = false, children }: { ratio: number; over: boolean; size?: number; dark?: boolean; children?: ReactNode }) {
  const stroke = Math.max(4, Math.round(size / 14))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className={dark ? 'text-white/10' : 'text-ink/10'} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={over ? '#d97706' : 'var(--accent)'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - Math.min(1, ratio)) }}
          transition={{ duration: 0.6, ease: EASE }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}

/**
 * EN / TA switch. Calls the shared language setter directly (not requestLang),
 * so the TTC language curtain never plays over a studio's gallery.
 */
export function LangToggle({ onPick, dark = false }: { onPick?: (l: Lang) => void; dark?: boolean }) {
  const lang = useLang()
  const set = (l: Lang) => {
    useStore.getState().setLang(l)
    onPick?.(l)
  }
  return (
    <div role="group" aria-label={gateCopy.language[lang]} className={`inline-flex rounded-full p-1 text-[12.5px] font-semibold ${dark ? 'bg-white/10' : 'bg-ink/[0.05]'}`}>
      {(['en', 'ta'] as const).map(l => (
        <button
          key={l}
          type="button"
          onClick={() => set(l)}
          aria-pressed={lang === l}
          lang={l}
          className={`h-8 rounded-full px-3 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)] ${
            lang === l ? (dark ? 'bg-white text-ink' : 'bg-white text-ink shadow-sm') : dark ? 'text-white/60 hover:text-white' : 'text-ink/55 hover:text-ink'
          }`}
        >
          {l === 'en' ? 'EN' : 'தமிழ்'}
        </button>
      ))}
    </div>
  )
}

export function Notice({ icon, title, body, children }: { icon: IconName; title: string; body?: string; children?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
        <Icon name={icon} size={24} />
      </span>
      <h1 className="mt-6 font-display text-[28px] font-medium leading-tight">{title}</h1>
      {body && <p className="mt-3 text-[14.5px] leading-relaxed text-ink/60">{body}</p>}
      {children && <div className="mt-7 flex flex-wrap justify-center gap-2.5">{children}</div>}
    </div>
  )
}
