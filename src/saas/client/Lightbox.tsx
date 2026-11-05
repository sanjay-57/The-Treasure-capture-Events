import { useCallback, useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useLenis } from 'lenis/react'
import { Icon } from '../../components/Icon'
import { useScrollLock } from '../../components/ui'
import { EASE } from '../../components/motion'
import { useT } from '../../lib/i18n'
import type { Pick as ProofPick, Proof } from '../types'
import { lightboxCopy } from './copy'
import { proofName } from './logic'
import { ProofImg } from './ui'

/**
 * Full-screen viewer: swipe / arrow keys to browse, pinch or double-tap to zoom
 * (plain CSS transform), "Compare" two-up, and a note to the studio on selected photos.
 */

interface Props {
  proofs: Proof[]
  index: number | null
  onIndex: (i: number | null) => void
  picks: ProofPick[]
  picked: ReadonlySet<string>
  readOnly: boolean
  onToggle: (proofId: string) => void
  onNote: (proofId: string, note: string) => void
}

const MAX_ZOOM = 4
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

export function Lightbox({ proofs, index, onIndex, picks, picked, readOnly, onToggle, onNote }: Props) {
  const t = useT(lightboxCopy)
  const lenis = useLenis()
  const open = index !== null && proofs.length > 0
  const i = open ? clamp(index, 0, proofs.length - 1) : 0
  const proof = proofs[i]
  const [dir, setDir] = useState(0)
  const [compareId, setCompareId] = useState<string | null>(null)
  const [zoom, setZoom] = useState({ s: 1, x: 0, y: 0 })
  // If browsing lands on the compared photo, compare against its neighbour instead.
  const compare = compareId ? (compareId === proof?.id ? proofs[(i + 1) % proofs.length] : proofs.find(p => p.id === compareId)) : undefined

  useScrollLock(open)
  useEffect(() => {
    if (!open) return
    lenis?.stop()
    return () => lenis?.start()
  }, [open, lenis])
  useEffect(() => setZoom({ s: 1, x: 0, y: 0 }), [proof?.id])
  useEffect(() => {
    if (!open) setCompareId(null)
  }, [open])

  const go = useCallback(
    (d: number) => {
      if (index === null || !proofs.length) return
      setDir(d)
      onIndex((index + d + proofs.length) % proofs.length)
    },
    [index, proofs.length, onIndex],
  )

  const toggleCompare = useCallback(() => {
    setCompareId(c => (c ? null : proofs.length > 1 ? proofs[(i + 1) % proofs.length].id : null))
  }, [proofs, i])

  const zoomBy = (f: number) => setZoom(z => (z.s * f <= 1.01 ? { s: 1, x: 0, y: 0 } : { ...z, s: clamp(z.s * f, 1, MAX_ZOOM) }))

  // Keyboard. A ref keeps one listener while always seeing fresh state.
  const onKey = useRef<(e: KeyboardEvent) => void>(() => {})
  onKey.current = e => {
    if (!open || !proof) return
    const typing = (e.target as HTMLElement).closest('input, textarea, [contenteditable="true"]')
    if (e.key === 'Escape') {
      if (typing) return (e.target as HTMLElement).blur()
      if (compareId) setCompareId(null)
      else onIndex(null)
      return
    }
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return
    const k = e.key.toLowerCase()
    if (k === 'arrowright') go(1)
    else if (k === 'arrowleft') go(-1)
    else if (!readOnly && (k === 's' || k === ' ')) onToggle(proof.id)
    else if (k === 'c') toggleCompare()
    else if (k === '+' || k === '=') zoomBy(1.5)
    else if (k === '-') zoomBy(1 / 1.5)
    else if (k === '0') setZoom({ s: 1, x: 0, y: 0 })
    else return
    e.preventDefault()
  }
  useEffect(() => {
    const h = (e: KeyboardEvent) => onKey.current(e)
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open && proof && (
        <motion.div
          className="fixed inset-0 z-[85] flex flex-col bg-[#0b0b0d]/[0.97] text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="dialog"
          aria-modal="true"
          aria-label={proofName(proof)}
          data-lenis-prevent
          onContextMenu={e => e.preventDefault()}
        >
          {/* Top bar */}
          <div className="relative z-10 flex items-center justify-between gap-2 p-3 pt-[calc(0.75rem+env(safe-area-inset-top))] md:p-5">
            <span className="inline-flex min-w-0 items-center gap-3 rounded-full bg-white/10 px-4 py-2 text-[13px]">
              <span className="truncate font-mono text-white/90">{proofName(proof)}</span>
              <span className="tabular-nums text-white/40">
                {i + 1} / {proofs.length}
              </span>
            </span>
            <div className="flex shrink-0 items-center gap-2">
              {!compare && (
                <>
                  <RoundBtn icon="minus" label={t.zoomOut} onClick={() => zoomBy(1 / 1.5)} disabled={zoom.s <= 1} className="hidden md:flex" />
                  <RoundBtn icon="plus" label={t.zoomIn} onClick={() => zoomBy(1.5)} disabled={zoom.s >= MAX_ZOOM} className="hidden md:flex" />
                </>
              )}
              {proofs.length > 1 && (
                <button
                  type="button"
                  onClick={toggleCompare}
                  aria-pressed={!!compare}
                  className={`flex h-11 items-center gap-1.5 rounded-full px-4 text-[13px] font-medium transition cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30 ${compare ? 'bg-white text-ink' : 'bg-white/10 hover:bg-white/15'}`}
                >
                  <Icon name="rows" size={15} className="rotate-90" />
                  {compare ? t.exitCompare : t.compare}
                </button>
              )}
              <RoundBtn icon="x" label={t.close} onClick={() => onIndex(null)} />
            </div>
          </div>

          {/* Stage */}
          <div className="relative flex min-h-0 flex-1 items-stretch justify-center overflow-hidden px-2 md:px-20">
            {compare ? (
              <div className="grid h-full w-full grid-rows-2 gap-2 md:grid-cols-2 md:grid-rows-1 md:gap-4">
                <ComparePane proof={proof} selected={picked.has(proof.id)} readOnly={readOnly} onToggle={() => onToggle(proof.id)} labels={t} />
                <ComparePane proof={compare} selected={picked.has(compare.id)} readOnly={readOnly} onToggle={() => onToggle(compare.id)} labels={t} />
              </div>
            ) : (
              <AnimatePresence initial={false} custom={dir} mode="popLayout">
                <motion.div
                  key={proof.id}
                  custom={dir}
                  variants={{
                    enter: (d: number) => ({ opacity: 0, x: d * 60 }),
                    center: { opacity: 1, x: 0 },
                    exit: (d: number) => ({ opacity: 0, x: d * -60 }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35, ease: EASE }}
                  className="flex h-full w-full items-center justify-center"
                >
                  <ZoomStage proof={proof} selected={picked.has(proof.id)} zoom={zoom} setZoom={setZoom} onSwipe={go} />
                </motion.div>
              </AnimatePresence>
            )}
            <RoundBtn icon="chevronLeft" label={t.prev} onClick={() => go(-1)} className="absolute left-4 top-1/2 hidden -translate-y-1/2 md:flex" size={48} />
            <RoundBtn icon="chevronRight" label={t.next} onClick={() => go(1)} className="absolute right-4 top-1/2 hidden -translate-y-1/2 md:flex" size={48} />
          </div>

          {/* Compare strip: pick the second photo */}
          {compare && <CompareStrip proofs={proofs} current={proof.id} value={compare.id} onPick={setCompareId} label={t.compareWith} />}

          {/* Bottom bar */}
          <div className="relative z-10 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:p-5">
            <div className="mx-auto flex max-w-xl items-center justify-center gap-2.5">
              <RoundBtn icon="chevronLeft" label={t.prev} onClick={() => go(-1)} className="md:hidden" size={48} />
              {!compare &&
                (readOnly ? (
                  picked.has(proof.id) && (
                    <span className="inline-flex h-12 items-center gap-2 rounded-full bg-[var(--accent)] px-6 text-[14px] font-semibold text-[var(--accent-ink)]">
                      <Icon name="heart" size={17} className="fill-current" />
                      {t.selected}
                    </span>
                  )
                ) : (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onToggle(proof.id)}
                    aria-pressed={picked.has(proof.id)}
                    className={`inline-flex h-12 items-center gap-2.5 rounded-full px-6 text-[14px] font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30 ${picked.has(proof.id) ? 'bg-[var(--accent)] text-[var(--accent-ink)]' : 'bg-white/10 hover:bg-white/15'}`}
                  >
                    <Icon name="heart" size={18} className={picked.has(proof.id) ? 'fill-current' : ''} />
                    {picked.has(proof.id) ? t.selected : t.select}
                    <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] tabular-nums">{picked.size}</span>
                  </motion.button>
                ))}
              <RoundBtn icon="chevronRight" label={t.next} onClick={() => go(1)} className="md:hidden" size={48} />
            </div>
            {!compare && <NoteBox key={proof.id} proofId={proof.id} pick={picks.find(p => p.proofId === proof.id)} readOnly={readOnly} onNote={onNote} labels={t} />}
            <p className="mt-2 hidden text-center text-[11.5px] text-white/30 lg:block">{t.keys}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

type Zoom = { s: number; x: number; y: number }

/** One photo with pinch, double-tap and drag-to-pan zoom; horizontal swipe browses when not zoomed. */
function ZoomStage({ proof, selected, zoom, setZoom, onSwipe }: { proof: Proof; selected: boolean; zoom: Zoom; setZoom: (z: Zoom | ((z: Zoom) => Zoom)) => void; onSwipe: (d: number) => void }) {
  const pts = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef<{ d: number; s: number } | null>(null)
  const pan = useRef<{ x: number; y: number; zx: number; zy: number } | null>(null)
  const swipe = useRef<{ x: number; y: number } | null>(null)
  const lastTap = useRef(0)
  const moved = useRef(false)
  const [dragX, setDragX] = useState(0)
  const ratio = proof.w / proof.h

  const dist = () => {
    const [a, b] = [...pts.current.values()]
    return Math.hypot(a.x - b.x, a.y - b.y)
  }

  const onDown = (e: RPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    moved.current = false
    if (pts.current.size === 2) {
      pinch.current = { d: dist(), s: zoom.s }
      pan.current = null
      swipe.current = null
      setDragX(0)
    } else if (zoom.s > 1) pan.current = { x: e.clientX, y: e.clientY, zx: zoom.x, zy: zoom.y }
    else swipe.current = { x: e.clientX, y: e.clientY }
  }
  const onMove = (e: RPointerEvent<HTMLDivElement>) => {
    if (!pts.current.has(e.pointerId)) return
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pinch.current && pts.current.size === 2) {
      moved.current = true
      const s = clamp((pinch.current.s * dist()) / pinch.current.d, 1, MAX_ZOOM)
      setZoom(z => (s <= 1.01 ? { s: 1, x: 0, y: 0 } : { ...z, s }))
    } else if (pan.current) {
      const dx = e.clientX - pan.current.x
      const dy = e.clientY - pan.current.y
      if (Math.abs(dx) + Math.abs(dy) > 4) moved.current = true
      setZoom(z => ({ ...z, x: pan.current!.zx + dx / z.s, y: pan.current!.zy + dy / z.s }))
    } else if (swipe.current) {
      const dx = e.clientX - swipe.current.x
      if (Math.abs(dx) > 6) moved.current = true
      setDragX(dx)
    }
  }
  const onUp = (e: RPointerEvent<HTMLDivElement>) => {
    pts.current.delete(e.pointerId)
    if (pts.current.size < 2) pinch.current = null
    if (swipe.current) {
      const dx = e.clientX - swipe.current.x
      const dy = e.clientY - swipe.current.y
      swipe.current = null
      setDragX(0)
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy)) return onSwipe(dx < 0 ? 1 : -1)
    }
    pan.current = null
    if (moved.current || pts.current.size) return
    // Double tap (or double click) toggles zoom.
    const now = Date.now()
    if (now - lastTap.current < 300) {
      lastTap.current = 0
      setZoom(z => (z.s > 1 ? { s: 1, x: 0, y: 0 } : { s: 2.5, x: 0, y: 0 }))
    } else lastTap.current = now
  }

  return (
    <div
      className="relative flex h-full w-full touch-none items-center justify-center overflow-hidden"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      style={{ cursor: zoom.s > 1 ? 'grab' : 'zoom-in' }}
    >
      <div
        className="relative"
        style={{
          aspectRatio: `${proof.w} / ${proof.h}`,
          width: `min(100%, calc((100svh - 15rem) * ${ratio.toFixed(4)}))`,
          transform: `translateX(${dragX}px) scale(${zoom.s}) translate(${zoom.x}px, ${zoom.y}px)`,
          transition: pts.current.size ? 'none' : 'transform 0.25s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <ProofImg proof={proof} size="full" alt={proofName(proof)} className={`pointer-events-none h-full w-full rounded-lg object-contain ${selected ? 'shadow-[0_0_0_3px_var(--accent)]' : ''}`} />
      </div>
    </div>
  )
}

function ComparePane({ proof, selected, readOnly, onToggle, labels }: { proof: Proof; selected: boolean; readOnly: boolean; onToggle: () => void; labels: { select: string; selected: string } }) {
  return (
    <div className="relative flex min-h-0 min-w-0 flex-col items-center justify-center gap-2">
      <div className="relative flex min-h-0 w-full flex-1 items-center justify-center">
        <ProofImg proof={proof} size="full" alt={proofName(proof)} className={`pointer-events-none max-h-full max-w-full rounded-lg object-contain ${selected ? 'shadow-[0_0_0_3px_var(--accent)]' : ''}`} />
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[12px] text-white/60">{proofName(proof)}</span>
        {readOnly ? (
          selected && <Icon name="heart" size={15} className="fill-[var(--accent)] text-[var(--accent)]" />
        ) : (
          <button
            type="button"
            onClick={onToggle}
            aria-pressed={selected}
            aria-label={`${selected ? labels.selected : labels.select}: ${proofName(proof)}`}
            className={`flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-semibold transition cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30 ${selected ? 'bg-[var(--accent)] text-[var(--accent-ink)]' : 'bg-white/10 hover:bg-white/15'}`}
          >
            <Icon name="heart" size={14} className={selected ? 'fill-current' : ''} />
            {selected ? labels.selected : labels.select}
          </button>
        )}
      </div>
    </div>
  )
}

function CompareStrip({ proofs, current, value, onPick, label }: { proofs: Proof[]; current: string; value: string; onPick: (id: string) => void; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const strip = ref.current
    const el = strip?.querySelector<HTMLElement>(`[data-id="${value}"]`)
    if (strip && el) strip.scrollTo({ left: el.offsetLeft - strip.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' })
  }, [value])
  return (
    <div ref={ref} role="listbox" aria-label={label} className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 pt-3" data-lenis-prevent>
      {proofs.map(p =>
        p.id === current ? null : (
          <button
            key={p.id}
            type="button"
            role="option"
            aria-selected={p.id === value}
            data-id={p.id}
            onClick={() => onPick(p.id)}
            aria-label={`${label}: ${proofName(p)}`}
            className={`relative h-12 shrink-0 overflow-hidden rounded-md transition cursor-pointer ${p.id === value ? 'ring-2 ring-white' : 'opacity-55 hover:opacity-100'}`}
            style={{ aspectRatio: `${p.w} / ${p.h}` }}
          >
            <ProofImg proof={p} className="h-full w-full object-cover" />
          </button>
        ),
      )}
    </div>
  )
}

function NoteBox({ proofId, pick, readOnly, onNote, labels }: { proofId: string; pick?: ProofPick; readOnly: boolean; onNote: (id: string, note: string) => void; labels: { note: string; notePlaceholder: string; noteOnlySelected: string } }) {
  const [value, setValue] = useState(pick?.note ?? '')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const save = (v: string) => {
    if (timer.current) clearTimeout(timer.current)
    if ((pick?.note ?? '') !== v.trim()) onNote(proofId, v.trim())
  }
  useEffect(() => () => timer.current && clearTimeout(timer.current), [])

  if (readOnly) return pick?.note ? <p className="mx-auto mt-3 max-w-xl text-center text-[13px] italic text-white/60">“{pick.note}”</p> : null
  if (!pick) return <p className="mx-auto mt-3 max-w-xl text-center text-[12px] text-white/35">{labels.noteOnlySelected}</p>
  return (
    <label className="mx-auto mt-3 block max-w-xl">
      <span className="sr-only">{labels.note}</span>
      <textarea
        value={value}
        rows={1}
        maxLength={280}
        onChange={e => {
          const v = e.target.value
          setValue(v)
          if (timer.current) clearTimeout(timer.current)
          timer.current = setTimeout(() => save(v), 700)
        }}
        onBlur={() => save(value)}
        placeholder={`${labels.note}: ${labels.notePlaceholder}`}
        className="block w-full resize-none rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-[13.5px] text-white placeholder:text-white/35 focus:border-white/30 focus:outline-none focus:ring-4 focus:ring-white/10"
      />
    </label>
  )
}

function RoundBtn({ icon, label, onClick, disabled, className = '', size = 44 }: { icon: 'x' | 'plus' | 'minus' | 'chevronLeft' | 'chevronRight'; label: string; onClick: () => void; disabled?: boolean; className?: string; size?: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      style={{ width: size, height: size }}
      className={`flex shrink-0 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/15 disabled:opacity-30 cursor-pointer disabled:cursor-default focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30 ${className}`}
    >
      <Icon name={icon} size={19} />
    </button>
  )
}
