import { useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import { motion } from 'motion/react'
import { useLenis } from 'lenis/react'
import { Icon } from '../../components/Icon'
import { EmptyState } from '../../components/ui'
import { EASE } from '../../components/motion'
import { useT } from '../../lib/i18n'
import type { Pick as ProofPick, Proof, StudioEvent } from '../types'
import { galleryCopy } from './copy'
import { filterCounts, filterProofs, groupByChapter, proofName, type Filter } from './logic'
import { useMinWidth } from './hooks'
import { Heart, ProofImg } from './ui'
import { Lightbox } from './Lightbox'

/** Editorial gallery: chapters, masonry at true aspect ratios, hearts, multi-select. */

const PAGE = 60
const LONG_PRESS_MS = 450

interface Props {
  event: StudioEvent
  proofs: Proof[]
  picks: ProofPick[]
  picked: ReadonlySet<string>
  readOnly: boolean
  onToggle: (proofId: string) => void
  onNote: (proofId: string, note: string) => void
}

/** Shortest-column masonry: earlier photos never move when a new page is appended. */
function columnsOf(proofs: Proof[], n: number): Proof[][] {
  const cols: Proof[][] = Array.from({ length: n }, () => [])
  const h = new Array<number>(n).fill(0)
  for (const p of proofs) {
    let c = 0
    for (let i = 1; i < n; i++) if (h[i] < h[c] - 0.01) c = i
    cols[c].push(p)
    h[c] += p.h / p.w
  }
  return cols
}

export function Gallery({ event, proofs, picks, picked, readOnly, onToggle, onNote }: Props) {
  const t = useT(galleryCopy)
  const lenis = useLenis()
  const md = useMinWidth(768)
  const lg = useMinWidth(1100)
  const cols = lg ? 4 : md ? 3 : 2
  const [filter, setFilter] = useState<Filter>('all')
  const [limit, setLimit] = useState(PAGE)
  const [selectMode, setSelectMode] = useState(false)
  const [open, setOpen] = useState<number | null>(null)
  const [jump, setJump] = useState<string | null>(null)
  const sentinel = useRef<HTMLDivElement>(null)

  const counts = useMemo(() => filterCounts(proofs, picked), [proofs, picked])
  const visible = useMemo(() => filterProofs(proofs, picked, filter), [proofs, picked, filter])
  const groups = useMemo(() => groupByChapter(event.chapters, visible, t.other), [event.chapters, visible, t.other])
  const allGroups = useMemo(() => groupByChapter(event.chapters, proofs, t.other), [event.chapters, proofs, t.other])
  // Lightbox walks the same order the grid shows.
  const flat = useMemo(() => groups.flatMap(g => g.proofs), [groups])
  const indexOf = useMemo(() => new Map(flat.map((p, i) => [p.id, i])), [flat])

  useEffect(() => setLimit(PAGE), [filter])
  useEffect(() => {
    if (readOnly) setSelectMode(false)
  }, [readOnly])

  // Paginated rendering: the next 60 mount as the sentinel nears the viewport.
  useEffect(() => {
    const el = sentinel.current
    if (!el || limit >= flat.length) return
    const io = new IntersectionObserver(es => es.some(e => e.isIntersecting) && setLimit(l => l + PAGE), { rootMargin: '1200px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [limit, flat.length])

  // Chapter jump: make sure the chapter is rendered, then scroll to it.
  const goChapter = (key: string) => {
    let start = 0
    for (const g of groups) {
      if (g.chapter.key === key) break
      start += g.proofs.length
    }
    if (start + 1 > limit) setLimit(Math.ceil((start + PAGE) / PAGE) * PAGE)
    setJump(key)
  }
  useEffect(() => {
    if (!jump) return
    const el = document.getElementById(`ch-${jump}`)
    setJump(null)
    if (!el) return
    if (lenis) lenis.scrollTo(el, { offset: -76 })
    else el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [jump, lenis])

  let budget = limit
  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: t.all },
    { key: 'selected', label: t.selected },
    { key: 'unselected', label: t.unselected },
  ]

  return (
    <div>
      {/* Toolbar: chapter jump list + filters */}
      <div className="sticky top-0 z-30 -mx-4 border-b border-ink/[0.06] bg-white/90 px-4 py-2.5 backdrop-blur-xl md:-mx-8 md:px-8">
        <nav aria-label={t.chapters} className="no-scrollbar flex gap-1.5 overflow-x-auto" data-lenis-prevent>
          {allGroups.map(g => {
            const n = g.proofs.length
            const k = g.proofs.filter(p => picked.has(p.id)).length
            const shown = groups.some(x => x.chapter.key === g.chapter.key)
            return (
              <button
                key={g.chapter.key}
                type="button"
                onClick={() => goChapter(g.chapter.key)}
                disabled={!shown}
                className="flex h-9 shrink-0 items-center gap-2 rounded-full border border-ink/10 px-3.5 text-[13px] text-ink/75 transition hover:border-ink/25 disabled:opacity-35 cursor-pointer disabled:cursor-default focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-ring)]"
              >
                {g.chapter.name}
                <span className="tabular-nums text-[11.5px] text-ink/40">
                  {k > 0 && <span className="text-[var(--accent)]">{k}/</span>}
                  {n}
                </span>
              </button>
            )
          })}
        </nav>
        <div className="mt-2 flex items-center justify-between gap-3">
          <div role="group" aria-label={t.selected} className="inline-flex rounded-full bg-ink/[0.05] p-1 text-[12.5px] font-medium">
            {filters.map(f => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                aria-pressed={filter === f.key}
                className={`h-8 rounded-full px-3 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)] ${filter === f.key ? 'bg-white text-ink shadow-sm' : 'text-ink/55 hover:text-ink'}`}
              >
                {f.label} <span className="tabular-nums text-ink/40">{counts[f.key]}</span>
              </button>
            ))}
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={() => setSelectMode(m => !m)}
              aria-pressed={selectMode}
              className={`hidden h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition sm:inline-flex cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-ring)] ${selectMode ? 'bg-[var(--accent)] text-[var(--accent-ink)]' : 'border border-ink/10 text-ink/70 hover:border-ink/25'}`}
            >
              <Icon name={selectMode ? 'check' : 'grid'} size={15} />
              {selectMode ? t.done : t.selectSeveral}
            </button>
          )}
        </div>
      </div>

      {selectMode && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE }} className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-[var(--accent-soft)] px-4 py-2.5 text-[13px] text-ink/75" role="status">
          <span>{t.selectMode}</span>
          <button type="button" onClick={() => setSelectMode(false)} className="h-9 shrink-0 rounded-full bg-[var(--accent)] px-4 text-[13px] font-semibold text-[var(--accent-ink)] cursor-pointer">
            {t.done}
          </button>
        </motion.div>
      )}

      {flat.length === 0 ? (
        <div className="mt-8">
          {filter === 'selected' ? (
            <EmptyState icon="heart" title={t.emptySelected} body={readOnly ? undefined : t.emptySelectedBody} />
          ) : filter === 'unselected' ? (
            <EmptyState icon="check" title={t.emptyUnselected} />
          ) : (
            <EmptyState icon="image" title={t.emptyAll} />
          )}
        </div>
      ) : (
        <div className="mt-4">
          {groups.map(g => {
            if (budget <= 0) return null
            const shown = g.proofs.slice(0, budget)
            budget -= shown.length
            return (
              <section key={g.chapter.key} id={`ch-${g.chapter.key}`} className="scroll-mt-28 pb-8" aria-label={g.chapter.name}>
                <h2 className="flex items-baseline gap-3 py-3 font-display text-[22px] font-medium md:text-[26px]">
                  {g.chapter.name}
                  <span className="font-sans text-[12.5px] font-normal tabular-nums text-ink/40">{g.proofs.length}</span>
                </h2>
                <div className="flex items-start gap-2 md:gap-3">
                  {columnsOf(shown, cols).map((col, ci) => (
                    <div key={ci} className="flex min-w-0 flex-1 flex-col gap-2 md:gap-3">
                      {col.map(p => (
                        <Tile
                          key={p.id}
                          proof={p}
                          selected={picked.has(p.id)}
                          readOnly={readOnly}
                          selectMode={selectMode}
                          labels={t}
                          onToggle={() => onToggle(p.id)}
                          onOpen={() => setOpen(indexOf.get(p.id) ?? 0)}
                          onLongPress={() => {
                            setSelectMode(true)
                            onToggle(p.id)
                          }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </section>
            )
          })}
          {limit < flat.length && (
            <div ref={sentinel} className="flex justify-center py-8 text-[13px] text-ink/40" aria-live="polite">
              {t.loadingMore}
            </div>
          )}
          {!readOnly && <p className="pb-4 text-center text-[12px] text-ink/40">{t.longPress}</p>}
        </div>
      )}

      <Lightbox proofs={flat} index={open} onIndex={setOpen} picks={picks} picked={picked} readOnly={readOnly} onToggle={onToggle} onNote={onNote} />
    </div>
  )
}

type TileLabels = { view: string; select: string; unselect: string }

function Tile({ proof, selected, readOnly, selectMode, labels, onToggle, onOpen, onLongPress }: { proof: Proof; selected: boolean; readOnly: boolean; selectMode: boolean; labels: TileLabels; onToggle: () => void; onOpen: () => void; onLongPress: () => void }) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const start = useRef<{ x: number; y: number } | null>(null)
  const fired = useRef(false)
  const name = proofName(proof)

  const clear = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = undefined
    start.current = null
  }
  const onDown = (e: RPointerEvent) => {
    if (readOnly || e.button !== 0) return
    fired.current = false
    start.current = { x: e.clientX, y: e.clientY }
    timer.current = setTimeout(() => {
      fired.current = true
      navigator.vibrate?.(15)
      onLongPress()
    }, LONG_PRESS_MS)
  }
  const onMove = (e: RPointerEvent) => {
    const s = start.current
    if (s && Math.hypot(e.clientX - s.x, e.clientY - s.y) > 10) clear()
  }
  const onClick = () => {
    if (fired.current) {
      fired.current = false
      return
    }
    if (selectMode && !readOnly) onToggle()
    else onOpen()
  }

  return (
    <figure className="group relative">
      <div className={`relative overflow-hidden rounded-md bg-ink/[0.05] transition-[box-shadow] duration-300 ${selected ? 'ring-[3px] ring-[var(--accent)] ring-offset-2 ring-offset-white' : ''}`} style={{ aspectRatio: `${proof.w} / ${proof.h}` }}>
        <button
          type="button"
          onClick={onClick}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={clear}
          onPointerCancel={clear}
          onPointerLeave={clear}
          onContextMenu={e => e.preventDefault()}
          aria-label={selectMode && !readOnly ? `${selected ? labels.unselect : labels.select}: ${name}` : `${labels.view}: ${name}`}
          aria-pressed={selectMode && !readOnly ? selected : undefined}
          className={`absolute inset-0 block h-full w-full select-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[var(--accent-ring)] ${selectMode && !readOnly ? 'cursor-pointer' : 'cursor-zoom-in'}`}
          style={{ WebkitTouchCallout: 'none' }}
        >
          <ProofImg proof={proof} className={`h-full w-full object-cover transition-transform duration-500 ${selected && selectMode ? 'scale-[0.94]' : 'group-hover:scale-[1.03]'}`} />
        </button>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-ink/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 [@media(hover:none)]:opacity-100" />
        <span className="pointer-events-none absolute left-2 top-2 max-w-[calc(100%-3.5rem)] truncate font-mono text-[11px] text-white/85 opacity-0 transition-opacity group-hover:opacity-100 md:text-[10.5px] [@media(hover:none)]:opacity-100">{name}</span>
        {(!readOnly || selected) && (
          <div className="absolute right-1.5 top-1.5">
            <Heart selected={selected} onToggle={onToggle} disabled={readOnly} label={`${selected ? labels.unselect : labels.select}: ${name}`} size={32} />
          </div>
        )}
      </div>
    </figure>
  )
}
