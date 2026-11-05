import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { Icon, type IconName } from '../../components/Icon'
import { type Bi, type Lang } from '../../lib/i18n'
import { idbGet } from '../blobs'
import type { MilestoneState } from '../os/money'
import type { DeliverableStatus, Project, RequestStatus } from '../os/types'
import type { Studio } from '../types'

/** Shared pieces of the client portal, all in the studio's accent (never TTC ruby). */

export interface PortalCtx {
  project: Project
  studio: Studio
  /** Absolute base path of this portal, e.g. /p/divya2rk */
  base: string
  lang: Lang
}

const Ctx = createContext<PortalCtx | null>(null)
export const PortalProvider = Ctx.Provider
export function usePortal(): PortalCtx {
  const v = useContext(Ctx)
  if (!v) throw new Error('usePortal outside PortalProvider')
  return v
}

export function PCard({ children, className = '', title, icon, action }: { children: ReactNode; className?: string; title?: string; icon?: IconName; action?: ReactNode }) {
  return (
    <section className={`rounded-3xl border border-ink/[0.07] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] sm:p-6 print:border-ink/20 print:shadow-none ${className}`}>
      {(title || action) && (
        <header className="mb-4 flex items-center justify-between gap-3">
          {title && (
            <h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-ink/55">
              {icon && <Icon name={icon} size={16} className="text-[var(--accent)]" />}
              {title}
            </h2>
          )}
          {action}
        </header>
      )}
      {children}
    </section>
  )
}

export function PageTitle({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-[28px] font-medium leading-tight sm:text-[34px]">{title}</h1>
        {sub && <p className="mt-1.5 text-[14px] text-ink/55">{sub}</p>}
      </div>
      {action}
    </div>
  )
}

type Tone = 'good' | 'warn' | 'bad' | 'accent' | 'muted'
const TONE: Record<Tone, string> = {
  good: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  warn: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  bad: 'bg-red-50 text-red-700 ring-red-600/15',
  accent: 'bg-[var(--accent-soft)] text-[var(--accent)] ring-[var(--accent-ring)]',
  muted: 'bg-ink/[0.04] text-ink/60 ring-ink/10',
}

export function Chip({ tone = 'muted', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-[11.5px] font-semibold ring-1 ring-inset ${TONE[tone]}`}>{children}</span>
}

export const MILESTONE_CHIP: Record<MilestoneState, { tone: Tone; label: Bi }> = {
  paid: { tone: 'good', label: { en: 'Paid', ta: 'செலுத்தப்பட்டது' } },
  partial: { tone: 'accent', label: { en: 'Part paid', ta: 'பகுதி செலுத்தப்பட்டது' } },
  overdue: { tone: 'bad', label: { en: 'Overdue', ta: 'தாமதம்' } },
  due: { tone: 'warn', label: { en: 'Due', ta: 'செலுத்த வேண்டியது' } },
  upcoming: { tone: 'muted', label: { en: 'Upcoming', ta: 'வரவிருக்கும்' } },
}

export const DELIVERABLE_CHIP: Record<DeliverableStatus, { tone: Tone; label: Bi }> = {
  not_started: { tone: 'muted', label: { en: 'Not started', ta: 'தொடங்கவில்லை' } },
  in_progress: { tone: 'accent', label: { en: 'In progress', ta: 'நடைபெறுகிறது' } },
  ready: { tone: 'good', label: { en: 'Ready', ta: 'தயார்' } },
  delivered: { tone: 'good', label: { en: 'Delivered', ta: 'வழங்கப்பட்டது' } },
}

export const REQUEST_CHIP: Record<RequestStatus, { tone: Tone; label: Bi }> = {
  open: { tone: 'warn', label: { en: 'Sent', ta: 'அனுப்பப்பட்டது' } },
  in_progress: { tone: 'accent', label: { en: 'In progress', ta: 'நடைபெறுகிறது' } },
  done: { tone: 'good', label: { en: 'Done', ta: 'முடிந்தது' } },
}

export function Bar({ ratio, className = '' }: { ratio: number; className?: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, ratio)) * 100)
  return (
    <div className={`h-2 overflow-hidden rounded-full bg-ink/[0.07] ${className}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-700" style={{ width: `${pct}%` }} />
    </div>
  )
}

/** Small round action link (WhatsApp, call, directions). */
export function PillLink({ href, icon, children, external = true, tone = 'outline' }: { href: string; icon: IconName; children: ReactNode; external?: boolean; tone?: 'outline' | 'accent' | 'wa' }) {
  const look =
    tone === 'accent'
      ? 'bg-[var(--accent)] text-[var(--accent-ink)] hover:brightness-110'
      : tone === 'wa'
        ? 'bg-[#25D366] text-white hover:brightness-105'
        : 'border border-ink/12 text-ink/80 hover:bg-ink/[0.04]'
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-ring)] print:hidden ${look}`}
    >
      <Icon name={icon} size={15} />
      {children}
    </a>
  )
}

/** Object URL for a blob in IndexedDB 'previews'; revoked on unmount. */
export function useBlobSrc(key: string | undefined): string | undefined {
  const [src, setSrc] = useState<string>()
  useEffect(() => {
    if (!key) return setSrc(undefined)
    let live = true
    let url: string | undefined
    idbGet<Blob>('previews', key)
      .then(b => {
        if (!live || !b) return
        url = URL.createObjectURL(b)
        setSrc(url)
      })
      .catch(() => live && setSrc(undefined))
    return () => {
      live = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [key])
  return src
}
