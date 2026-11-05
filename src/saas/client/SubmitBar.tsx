import { createPortal } from 'react-dom'
import { motion } from 'motion/react'
import { Icon } from '../../components/Icon'
import { Modal } from '../../components/ui'
import { EASE } from '../../components/motion'
import { formatDate, useLang, useT } from '../../lib/i18n'
import type { Pick as ProofPick, Proof, Studio, StudioEvent } from '../types'
import { fill, submitCopy } from './copy'
import { pickers, quotaState, waLink } from './logic'
import type { SyncState } from './syncQueue'
import { AccentButton, AnimatedCount, ProofImg, QuotaRing } from './ui'

/** Sticky quota bar, the submit confirmation and the thank-you state after submitting. */

export function SaveIndicator({ state }: { state: SyncState }) {
  const t = useT(submitCopy)
  if (state === 'idle') return null
  const label = state === 'saving' ? t.saving : state === 'error' ? t.offline : t.saved
  return (
    <span role="status" aria-live="polite" className="inline-flex items-center gap-1 text-[11.5px] text-ink/45">
      {state === 'saving' ? <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent)]" /> : <Icon name={state === 'error' ? 'info' : 'check'} size={12} />}
      {label}
    </span>
  )
}

export function PickerChips({ picks }: { picks: ProofPick[] }) {
  const t = useT(submitCopy)
  const who = pickers(picks)
  if (who.length < 2) return null
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
      <span className="text-ink/45">{t.whoPicked}</span>
      {who.map(w => (
        <span key={w.name} className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-2.5 py-1 font-medium text-ink/75">
          {w.name} <span className="tabular-nums text-ink/45">{w.count}</span>
        </span>
      ))}
    </div>
  )
}

/** `inPortal`: sits above the portal's mobile tab bar and centres on the content beside its desktop sidebar. */
export function SubmitBar({ count, quota, status, sync, onSubmit, inPortal = false }: { count: number; quota: number; status: string; sync: SyncState; onSubmit: () => void; inPortal?: boolean }) {
  const t = useT(submitCopy)
  const q = quotaState(count, quota)
  if (typeof document === 'undefined') return null
  return createPortal(
    <motion.div
      className={`pointer-events-none fixed inset-x-0 z-40 flex justify-center px-3 ${inPortal ? 'bottom-[calc(4.75rem+env(safe-area-inset-bottom))] lg:bottom-6 lg:pl-72' : 'bottom-[calc(0.75rem+env(safe-area-inset-bottom))] md:bottom-6'}`}
      initial={{ y: 120, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: EASE, delay: 0.3 }}
    >
      <div className="pointer-events-auto flex w-full max-w-lg items-center gap-3 rounded-full border border-ink/[0.06] bg-white/95 py-2 pl-2 pr-2 shadow-[0_20px_50px_-20px_rgba(10,10,11,0.35)] backdrop-blur-xl">
        <QuotaRing ratio={q.ratio} over={q.kind === 'over'} size={44}>
          <Icon name="heart" size={14} className={count ? 'fill-[var(--accent)] text-[var(--accent)]' : 'text-ink/30'} />
        </QuotaRing>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-[15px] font-semibold">
            <AnimatedCount value={count} /> <span className="font-normal text-ink/45">/ {quota}</span>
          </p>
          <p className={`truncate text-[11.5px] ${q.kind === 'over' ? 'font-medium text-amber-700' : 'text-ink/50'}`}>{status}</p>
        </div>
        <span className="hidden sm:inline">
          <SaveIndicator state={sync} />
        </span>
        <AccentButton onClick={onSubmit} disabled={count === 0} icon="arrowRight" className="h-11 shrink-0 !px-4">
          <span className="sm:hidden">{t.submitShort}</span>
          <span className="hidden sm:inline">{t.submit}</span>
        </AccentButton>
      </div>
    </motion.div>,
    document.body,
  )
}

export function SubmitModal({ open, onClose, onConfirm, picks, proofs, quota, status }: { open: boolean; onClose: () => void; onConfirm: () => void; picks: ProofPick[]; proofs: Map<string, Proof>; quota: number; status: string }) {
  const t = useT(submitCopy)
  const count = picks.length
  const notes = picks.filter(p => p.note).length
  const over = count > quota
  const preview = picks.map(p => proofs.get(p.proofId)).filter((p): p is Proof => !!p).slice(0, 5)
  return (
    <Modal open={open} onClose={onClose} label={t.confirmTitle}>
      <div className="p-7 md:p-9">
        <div className="flex -space-x-3">
          {preview.map((p, i) => (
            <span key={p.id} className="relative h-14 w-14 overflow-hidden rounded-2xl border-2 border-white shadow" style={{ zIndex: 5 - i, rotate: `${(i - 2) * 3}deg` }}>
              <ProofImg proof={p} className="h-full w-full object-cover" />
            </span>
          ))}
        </div>
        <h3 className="mt-6 font-display text-[26px] font-medium">{t.confirmTitle}</h3>
        <p className="mt-2 font-display text-[28px] font-semibold text-[var(--accent)]">
          {count} <span className="text-[18px] font-medium text-ink/50">{t.photos}</span>
          {notes > 0 && (
            <span className="ml-2 text-[14px] font-normal text-ink/45">
              · {notes} {t.withNotes}
            </span>
          )}
        </p>
        <p className="mt-3 text-[14.5px] leading-relaxed text-ink/60">{t.confirmBody}</p>
        <p className={`mt-3 text-[13px] ${over ? 'font-medium text-amber-700' : 'text-ink/50'}`}>{status}</p>
        <div className="mt-7 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <AccentButton variant="outline" onClick={onClose}>
            {t.keepChoosing}
          </AccentButton>
          <AccentButton onClick={onConfirm} icon="check">
            {t.submitShort}
          </AccentButton>
        </div>
      </div>
    </Modal>
  )
}

/** Read-only thank-you panel shown above the (view-only) gallery once submitted. */
export function Submitted({ studio, event, count }: { studio: Studio; event: StudioEvent; count: number }) {
  const t = useT(submitCopy)
  const lang = useLang()
  const href = waLink(studio.whatsapp, fill(t.reopenMsg, { title: event.title, count }))
  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }} className="mt-4 flex flex-col gap-4 rounded-[24px] bg-[var(--accent-soft)] p-6 md:flex-row md:items-center md:justify-between md:p-8">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-ink)]">
          <Icon name="check" size={22} strokeWidth={2.2} />
        </span>
        <div>
          <h2 className="font-display text-[24px] font-medium leading-tight">{fill(t.thanksTitle, { studio: studio.name })}</h2>
          <p className="mt-1.5 text-[14px] text-ink/60">{t.thanksBody}</p>
          <p className="mt-1 text-[12.5px] text-ink/45">
            {count} {t.photos}
            {event.submittedAt && ` · ${t.submittedOn} ${formatDate(event.submittedAt, lang)}`}
          </p>
        </div>
      </div>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full border border-ink/15 bg-white px-5 text-[14px] font-semibold transition hover:border-ink/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-ring)]"
      >
        <Icon name="whatsapp" size={17} />
        {t.askReopen}
      </a>
    </motion.section>
  )
}
