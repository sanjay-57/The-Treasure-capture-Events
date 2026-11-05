import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from 'motion/react'
import { Icon, type IconName } from '../../components/Icon'
import { EASE } from '../../components/motion'
import { useT } from '../../lib/i18n'
import type { Proof, StudioEvent } from '../types'
import { tableCopy } from './copy'
import { groupByChapter, proofName, quotaState } from './logic'
import { AccentButton, AnimatedCount, ProofImg, QuotaRing } from './ui'

/**
 * Light table: cull one photo at a time like a photographer. Keep or pass,
 * swipe or keyboard (K / X / ← → / Z), undo, with the album tray filling up.
 * Passes are a culling aid only and live in this session; picks persist.
 */

type Decision = 'keep' | 'pass'
type Step = { id: string; cat: string; pos: number; wasKept: boolean; wasPassed: boolean }

const STACK = { gridArea: '1 / 1' } as const
const pad2 = (n: number) => String(n).padStart(2, '0')
const cardWidth = (p: Proof) => `min(100%, calc(var(--stage-h) * ${(p.w / p.h).toFixed(4)}))`

interface Props {
  event: StudioEvent
  proofs: Proof[]
  picked: ReadonlySet<string>
  quotaText: string
  onToggle: (proofId: string) => void
  onSubmit: () => void
}

export function LightTable({ event, proofs, picked, quotaText, onToggle, onSubmit }: Props) {
  const t = useT(tableCopy)
  const groups = useMemo(() => groupByChapter(event.chapters, proofs), [event.chapters, proofs])
  const [cat, setCat] = useState(() => groups[0]?.chapter.key ?? '')
  const [pos, setPos] = useState(0)
  const [dir, setDir] = useState(0)
  const [passed, setPassed] = useState<Set<string>>(() => new Set())
  const [history, setHistory] = useState<Step[]>([])
  const stripRef = useRef<HTMLDivElement>(null)

  const count = picked.size
  const q = quotaState(count, event.quota)
  const byId = useMemo(() => new Map(proofs.map(p => [p.id, p])), [proofs])
  const idx = Math.max(0, groups.findIndex(g => g.chapter.key === cat))
  const group = groups[idx]
  const catIds = group?.proofs ?? []
  const at = Math.min(pos, catIds.length)
  const cur: Proof | undefined = catIds[at]
  const peek: Proof | undefined = catIds[at + 1]
  const isReviewed = (id: string) => picked.has(id) || passed.has(id)
  const reviewedTotal = proofs.filter(p => isReviewed(p.id)).length
  const pendingGroup = [...groups.slice(idx + 1), ...groups.slice(0, idx)].find(g => g.proofs.some(p => !isReviewed(p.id)))
  const kept = useMemo(() => groups.flatMap(g => g.proofs.filter(p => picked.has(p.id))), [groups, picked])

  const decide = (d: Decision) => {
    if (!cur) return
    const wasKept = picked.has(cur.id)
    if ((d === 'keep') !== wasKept) onToggle(cur.id)
    setPassed(p => {
      const n = new Set(p)
      if (d === 'pass') n.add(cur.id)
      else n.delete(cur.id)
      return n
    })
    setHistory(h => [...h.slice(-49), { id: cur.id, cat, pos: at, wasKept, wasPassed: passed.has(cur.id) }])
    setDir(d === 'keep' ? 1 : -1)
    setPos(at + 1)
  }

  const browse = (delta: number) => {
    setDir(0)
    setPos(Math.max(0, Math.min(catIds.length, at + delta)))
  }

  const undo = () => {
    const last = history.at(-1)
    if (!last) return
    if (picked.has(last.id) !== last.wasKept) onToggle(last.id)
    setPassed(p => {
      const n = new Set(p)
      if (last.wasPassed) n.add(last.id)
      else n.delete(last.id)
      return n
    })
    setHistory(h => h.slice(0, -1))
    setDir(0)
    setCat(last.cat)
    setPos(last.pos)
  }

  const openChapter = (key: string) => {
    const g = groups.find(x => x.chapter.key === key)
    const first = g ? g.proofs.findIndex(p => !isReviewed(p.id)) : 0
    setDir(0)
    setCat(key)
    setPos(Math.max(0, first))
  }

  const jumpTo = (id: string) => {
    const p = byId.get(id)
    const g = groups.find(x => x.proofs.some(y => y.id === id))
    if (!p || !g) return
    setDir(0)
    setCat(g.chapter.key)
    setPos(g.proofs.indexOf(p))
  }

  const onKey = useRef<(e: KeyboardEvent) => void>(() => {})
  onKey.current = e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return
    const el = e.target as HTMLElement
    if (el.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return
    if (document.querySelector('[role="dialog"]')) return
    const k = e.key.toLowerCase()
    if (k === 'k') decide('keep')
    else if (k === 'x') decide('pass')
    else if (k === 'z') undo()
    else if (k === 'arrowright') browse(1)
    else if (k === 'arrowleft') browse(-1)
    else return
    e.preventDefault()
  }
  useEffect(() => {
    const h = (e: KeyboardEvent) => onKey.current(e)
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  useEffect(() => {
    const strip = stripRef.current
    const el = strip?.querySelector<HTMLElement>(`[data-i="${at}"]`)
    if (!strip || !el) return
    strip.scrollTo({ left: el.offsetLeft - strip.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' })
  }, [cat, at])

  const catKept = catIds.filter(p => picked.has(p.id)).length
  if (!group) return null

  return (
    <section className="mt-4 overflow-hidden rounded-[24px] bg-[#0f0f11] text-white shadow-[0_40px_90px_-40px_rgba(10,10,11,0.6)]">
      <nav aria-label={t.chapters} className="no-scrollbar flex gap-1 overflow-x-auto border-b border-white/10 p-2 md:p-3" data-lenis-prevent>
        {groups.map((g, i) => {
          const ids = g.proofs
          const on = g.chapter.key === cat
          const k = ids.filter(p => picked.has(p.id)).length
          const ps = ids.filter(p => passed.has(p.id) && !picked.has(p.id)).length
          return (
            <button
              key={g.chapter.key}
              type="button"
              onClick={() => openChapter(g.chapter.key)}
              aria-current={on ? 'page' : undefined}
              className={`relative flex min-w-[128px] shrink-0 flex-col gap-2 rounded-2xl px-3.5 py-3 text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${on ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'}`}
            >
              <span className="flex items-baseline gap-2">
                <span className="font-display text-[12px] italic text-white/40">{pad2(i + 1)}</span>
                <span className={`font-display text-[16px] leading-none ${on ? 'text-white' : 'text-white/50'}`}>{g.chapter.name}</span>
              </span>
              <span className="flex h-1 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
                <motion.span className="h-full bg-[var(--accent)]" animate={{ width: `${ids.length ? (k / ids.length) * 100 : 0}%` }} transition={{ duration: 0.5, ease: EASE }} />
                <motion.span className="h-full bg-white/30" animate={{ width: `${ids.length ? (ps / ids.length) * 100 : 0}%` }} transition={{ duration: 0.5, ease: EASE }} />
              </span>
              <span className="text-[11px] tabular-nums text-white/40">
                <span className={k ? 'text-white' : ''}>{k}</span> / {ids.length}
              </span>
            </button>
          )
        })}
      </nav>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 px-4 pb-5 pt-4 md:px-8 md:pt-6">
          <div className="flex items-center justify-between gap-3 text-[12.5px]">
            <p className="min-w-0 truncate text-white/50" aria-live="polite">
              {cur ? (
                <>
                  {t.frame} <span className="tabular-nums text-white">{pad2(at + 1)}</span> / <span className="tabular-nums">{pad2(catIds.length)}</span>
                  <span className="ml-3 font-mono text-white/35">{proofName(cur)}</span>
                </>
              ) : (
                group.chapter.name
              )}
            </p>
            <button
              type="button"
              onClick={undo}
              disabled={!history.length}
              className="flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-white/15 px-4 text-white/80 transition hover:bg-white/10 disabled:opacity-30 cursor-pointer disabled:cursor-default md:h-9 md:px-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              <Icon name="refresh" size={14} className="-scale-x-100" />
              {t.undo}
            </button>
          </div>

          <div className="relative mt-4 grid h-[var(--stage-h)] place-items-center [--stage-h:min(52vh,460px)] md:mt-5 md:[--stage-h:min(60vh,600px)]">
            {cur && peek && (
              <div key={`peek-${peek.id}`} style={{ ...STACK, width: cardWidth(peek), aspectRatio: `${peek.w} / ${peek.h}` }} className="pointer-events-none translate-y-4 scale-[0.93] overflow-hidden rounded-2xl opacity-35" aria-hidden="true">
                <ProofImg proof={peek} size="full" className="h-full w-full object-cover" />
              </div>
            )}
            <AnimatePresence initial={false} custom={dir} mode="popLayout">
              {cur ? (
                <StageCard key={cur.id} proof={cur} dir={dir} kept={picked.has(cur.id)} onDecide={decide} labels={t} />
              ) : (
                <motion.div key={`end-${cat}`} style={STACK} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.45, ease: EASE }} className="flex max-w-sm flex-col items-center px-4 text-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-ink)]">
                    <Icon name="check" size={26} strokeWidth={2.2} />
                  </span>
                  <h3 className="mt-6 font-display text-[28px] font-medium leading-tight">{pendingGroup ? t.chapterDone : t.allDone}</h3>
                  <p className="mt-2 text-[14px] text-white/60">
                    <span className="font-semibold tabular-nums text-white">{catKept}</span> {t.of} {catIds.length} {t.keptHere}
                  </p>
                  {!pendingGroup && <p className="mt-1 text-[14px] text-white/60">{t.allDoneBody}</p>}
                  <div className="mt-7 flex flex-wrap justify-center gap-2.5">
                    {pendingGroup ? (
                      <AccentButton onClick={() => openChapter(pendingGroup.chapter.key)} icon="arrowRight">
                        {t.continueWith} {pendingGroup.chapter.name}
                      </AccentButton>
                    ) : (
                      <AccentButton onClick={onSubmit} disabled={count === 0} icon="arrowRight">
                        {t.submit}
                      </AccentButton>
                    )}
                    <AccentButton variant="ghost-dark" onClick={() => browse(-catIds.length)}>
                      {t.startOver}
                    </AccentButton>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-6 flex items-center justify-center gap-3 md:gap-4">
            <RoundButton icon="chevronLeft" label={t.prev} onClick={() => browse(-1)} disabled={at === 0} />
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={() => decide('pass')}
              disabled={!cur}
              className="flex h-14 items-center gap-2 rounded-full border border-white/15 px-6 text-[14px] font-semibold text-white/85 transition-colors hover:border-white/40 hover:bg-white/10 disabled:opacity-30 cursor-pointer disabled:cursor-default md:h-16 md:px-7 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20"
            >
              <Icon name="x" size={19} strokeWidth={2} />
              {t.pass}
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={() => decide('keep')}
              disabled={!cur}
              aria-pressed={cur ? picked.has(cur.id) : undefined}
              className="flex h-14 items-center gap-2 rounded-full bg-[var(--accent)] px-7 text-[14px] font-semibold text-[var(--accent-ink)] transition hover:brightness-110 disabled:opacity-30 cursor-pointer disabled:cursor-default md:h-16 md:px-8 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-ring)]"
            >
              <Icon name="heart" size={19} className="fill-current" />
              {cur && picked.has(cur.id) ? t.kept : t.keep}
            </motion.button>
            <RoundButton icon="chevronRight" label={t.next} onClick={() => browse(1)} disabled={!cur} />
          </div>
          <p className="mt-3 text-center text-[12px] text-white/35">
            <span className="md:hidden">{t.swipe}</span>
            <span className="hidden md:inline">{t.keys}</span>
          </p>

          <div ref={stripRef} aria-label={t.filmstrip} className="no-scrollbar relative -mx-4 mt-5 flex gap-1.5 overflow-x-auto border-t border-white/10 px-4 pt-4 md:-mx-8 md:px-8" data-lenis-prevent>
            {catIds.map((p, i) => {
              const on = i === at
              const k = picked.has(p.id)
              const ps = passed.has(p.id) && !k
              return (
                <button
                  key={p.id}
                  type="button"
                  data-i={i}
                  onClick={() => browse(i - at)}
                  aria-label={`${t.show}: ${proofName(p)}`}
                  aria-current={on ? 'true' : undefined}
                  className={`relative h-14 shrink-0 overflow-hidden rounded-md transition duration-300 cursor-pointer md:h-16 ${on ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0f0f11]' : ''} ${ps ? 'opacity-30 grayscale' : on || k ? '' : 'opacity-60 hover:opacity-100'}`}
                  style={{ aspectRatio: `${p.w} / ${p.h}` }}
                >
                  <ProofImg proof={p} className="h-full w-full object-cover" />
                  {k && (
                    <span className="absolute bottom-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-ink)]">
                      <Icon name="heart" size={9} className="fill-current" />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Album tray */}
        <aside className="flex flex-col border-t border-white/10 p-5 md:p-6 lg:border-l lg:border-t-0" aria-label={t.album}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">{t.album}</p>
          <div className="mt-4 flex items-center gap-4">
            <QuotaRing ratio={q.ratio} over={q.kind === 'over'} size={72} dark>
              <span className="font-display text-[20px] font-medium">
                <AnimatedCount value={count} />
              </span>
            </QuotaRing>
            <div className="min-w-0">
              <p className="font-display text-[19px] leading-none">
                {count} <span className="text-white/40">/ {event.quota}</span>
              </p>
              <p className={`mt-1.5 text-[12.5px] leading-snug ${q.kind === 'over' ? 'text-amber-400' : 'text-white/55'}`}>{quotaText}</p>
            </div>
          </div>
          <p className="mt-4 text-[12px] tabular-nums text-white/40">
            {reviewedTotal} {t.of} {proofs.length} {t.reviewed}
          </p>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
            <motion.div className="h-full rounded-full bg-white/50" animate={{ width: `${proofs.length ? (reviewedTotal / proofs.length) * 100 : 0}%` }} transition={{ duration: 0.5, ease: EASE }} />
          </div>
          <div className="no-scrollbar mt-5 min-h-0 flex-1 lg:max-h-[420px] lg:overflow-y-auto" data-lenis-prevent>
            {kept.length === 0 ? (
              <div className="flex h-28 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 text-center text-[12.5px] text-white/40">
                <Icon name="heart" size={18} />
                {t.trayEmpty}
              </div>
            ) : (
              <ul className="grid grid-cols-5 gap-1.5 sm:grid-cols-8 lg:grid-cols-4">
                <AnimatePresence initial={false}>
                  {kept.map(p => (
                    <motion.li key={p.id} layout initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.35, ease: EASE }} className="group relative aspect-square">
                      <button type="button" onClick={() => jumpTo(p.id)} aria-label={`${t.show}: ${proofName(p)}`} className={`block h-full w-full overflow-hidden rounded-md cursor-pointer ${p.id === cur?.id ? 'ring-2 ring-white' : ''}`}>
                        <ProofImg proof={p} className="h-full w-full object-cover" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggle(p.id)}
                        aria-label={`${t.remove}: ${proofName(p)}`}
                        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-ink opacity-0 shadow transition before:absolute before:-inset-2.5 before:content-[''] group-hover:opacity-100 focus-visible:opacity-100 cursor-pointer max-lg:opacity-100"
                      >
                        <Icon name="x" size={11} strokeWidth={2.4} />
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </div>
        </aside>
      </div>
    </section>
  )
}

function StageCard({ proof, dir, kept, onDecide, labels }: { proof: Proof; dir: number; kept: boolean; onDecide: (d: Decision) => void; labels: { keep: string; pass: string; inAlbum: string } }) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-320, 320], [-9, 9])
  const keepStamp = useTransform(x, [24, 130], [0, 1])
  const passStamp = useTransform(x, [-130, -24], [1, 0])
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 120 || info.velocity.x > 700) onDecide('keep')
    else if (info.offset.x < -120 || info.velocity.x < -700) onDecide('pass')
  }
  return (
    <motion.div
      custom={dir}
      variants={{
        enter: { opacity: 0.35, scale: 0.93, y: 16 },
        center: { opacity: 1, scale: 1, y: 0, x: 0 },
        exit: (d: number) => (d ? { x: d * 720, opacity: 0, transition: { duration: 0.5, ease: EASE } } : { opacity: 0, scale: 0.97, transition: { duration: 0.25 } }),
      }}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.5, ease: EASE }}
      drag="x"
      dragSnapToOrigin
      dragElastic={0.9}
      onDragEnd={onDragEnd}
      style={{ ...STACK, x, rotate, width: cardWidth(proof), aspectRatio: `${proof.w} / ${proof.h}` }}
      className="relative z-10 touch-pan-y cursor-grab active:cursor-grabbing"
    >
      <div className={`relative h-full w-full overflow-hidden rounded-2xl bg-white/5 shadow-[0_30px_70px_-25px_rgba(0,0,0,0.9)] ${kept ? 'ring-2 ring-[var(--accent)]' : 'ring-1 ring-white/10'}`}>
        <ProofImg proof={proof} size="full" alt={proofName(proof)} className="pointer-events-none h-full w-full object-cover" />
        {kept && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-2.5 py-1 text-[11px] font-semibold text-[var(--accent-ink)]">
            <Icon name="heart" size={11} className="fill-current" />
            {labels.inAlbum}
          </span>
        )}
        <motion.span style={{ opacity: keepStamp }} className="pointer-events-none absolute left-5 top-5 -rotate-12 rounded-lg border-[3px] border-white bg-[var(--accent)]/70 px-3 py-1 text-[22px] font-bold uppercase tracking-[0.12em] text-white">
          {labels.keep}
        </motion.span>
        <motion.span style={{ opacity: passStamp }} className="pointer-events-none absolute right-5 top-5 rotate-12 rounded-lg border-[3px] border-white bg-black/40 px-3 py-1 text-[22px] font-bold uppercase tracking-[0.12em] text-white">
          {labels.pass}
        </motion.span>
      </div>
    </motion.div>
  )
}

function RoundButton({ icon, label, onClick, disabled }: { icon: IconName; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-25 cursor-pointer disabled:cursor-default sm:flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
    >
      <Icon name={icon} size={20} />
    </button>
  )
}
