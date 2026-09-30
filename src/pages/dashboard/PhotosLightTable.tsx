import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from 'motion/react'
import { Icon, type IconName } from '../../components/Icon'
import { Button, Img } from '../../components/ui'
import { EASE, Reveal } from '../../components/motion'
import { PROOF_CATEGORIES, eventByKey, type ProofCategory } from '../../lib/data'
import { useLang, useT } from '../../lib/i18n'
import { IMG, photoUrl, type ImgKey } from '../../lib/images'
import { useStore, type Order } from '../../lib/store'
import { toast } from '../../lib/ui'
import { FloatingBar, PHOTO_QUOTA, gcsPath, isProof, proofCategory, proofFile, resolveCover, useProofs } from './shared'
import { AnimatedCount, SubmitSelectionModal, Watermark, pad2, ratioOf, useQuotaStatus } from './proofing'

/**
 * Proofing, version 2 — the light table. Instead of browsing a gallery, the
 * client culls one frame at a time like a photographer: keep or pass, swipe or
 * keyboard, with an album tray filling up beside the stage.
 */

const copy = {
  eyebrow: { en: 'Light table', ta: 'ஒளி மேசை' },
  lead: {
    en: 'One frame at a time. Keep the ones that make you feel something, pass on the rest — you can always undo or come back.',
    ta: 'ஒவ்வொரு படமாக. மனதைத் தொடுவதைச் சேர்த்து, மற்றவற்றைத் தவிர்க்கவும் — எப்போதும் செயல்தவிர்க்கலாம், திரும்ப வரலாம்.',
  },
  chapters: { en: 'Gallery chapters', ta: 'கேலரி அத்தியாயங்கள்' },
  chapter: { en: 'Chapter', ta: 'அத்தியாயம்' },
  frame: { en: 'Frame', ta: 'படம்' },
  keep: { en: 'Keep', ta: 'சேர்' },
  kept: { en: 'Kept', ta: 'சேர்த்தது' },
  pass: { en: 'Pass', ta: 'தவிர்' },
  inAlbum: { en: 'In album', ta: 'ஆல்பத்தில்' },
  undo: { en: 'Undo', ta: 'செயல்தவிர்' },
  prev: { en: 'Previous photo', ta: 'முந்தைய படம்' },
  next: { en: 'Next photo', ta: 'அடுத்த படம்' },
  keys: { en: 'K keep · X pass · ← → browse · Z undo', ta: 'K சேர் · X தவிர் · ← → உலாவ · Z செயல்தவிர்' },
  swipe: { en: 'Swipe right to keep, left to pass', ta: 'சேர்க்க வலப்புறம், தவிர்க்க இடப்புறம் இழுக்கவும்' },
  filmstrip: { en: 'Frames in this chapter', ta: 'இந்த அத்தியாயத்தின் படங்கள்' },
  album: { en: 'Your album', ta: 'உங்கள் ஆல்பம்' },
  reviewed: { en: 'reviewed', ta: 'பார்த்தவை' },
  of: { en: 'of', ta: '/' },
  trayEmpty: { en: 'Frames you keep land here.', ta: 'நீங்கள் சேர்க்கும் படங்கள் இங்கே வரும்.' },
  remove: { en: 'Remove from album', ta: 'ஆல்பத்திலிருந்து நீக்கு' },
  show: { en: 'Show', ta: 'காட்டு' },
  submit: { en: 'Submit selection', ta: 'தேர்வைச் சமர்ப்பி' },
  chapterDone: { en: 'Chapter reviewed', ta: 'அத்தியாயம் பார்த்து முடிந்தது' },
  keptHere: { en: 'kept from this chapter', ta: 'இந்த அத்தியாயத்திலிருந்து சேர்த்தவை' },
  allDone: { en: 'Every frame reviewed', ta: 'எல்லாப் படங்களும் பார்த்து முடிந்தது' },
  allDoneBody: { en: 'Happy with your picks? Send them to our album designers.', ta: 'தேர்வுகள் திருப்தியா? எங்கள் ஆல்ப வடிவமைப்பாளர்களுக்கு அனுப்புங்கள்.' },
  continueWith: { en: 'Continue with', ta: 'தொடர்க:' },
  startOver: { en: 'Review again', ta: 'மீண்டும் பார்' },
  quotaToast: { en: 'You’ve reached the album quota', ta: 'ஆல்ப வரம்பை அடைந்துவிட்டீர்கள்' },
  onlyIds: { en: 'Only your list of selected file names is saved.', ta: 'தேர்ந்த கோப்புப் பெயர்களின் பட்டியல் மட்டுமே சேமிக்கப்படும்.' },
}

type Decision = 'keep' | 'pass'
type Step = { id: ImgKey; cat: ProofCategory; pos: number; wasKept: boolean; wasPassed: boolean }

/** Card width that fits the stage height (`--stage-h`) without overflowing the column. */
const cardWidth = (id: ImgKey) => `min(100%, calc(var(--stage-h) * ${ratioOf(id).toFixed(4)}))`
const STACK = { gridArea: '1 / 1' } as const

export function LightTable({ order }: { order: Order }) {
  const t = useT(copy)
  const lang = useLang()
  const toggleSelection = useStore(s => s.toggleSelection)
  const proofs = useProofs()
  const [cat, setCat] = useState<ProofCategory>(PROOF_CATEGORIES[0].key)
  const [pos, setPos] = useState(0)
  // Which way the leaving card flies: 1 kept (right), -1 passed (left), 0 just browsing.
  const [dir, setDir] = useState(0)
  // Passes are only a culling aid, so they live in the session; the selection is what persists.
  const [passed, setPassed] = useState<Set<ImgKey>>(() => new Set())
  const [history, setHistory] = useState<Step[]>([])
  const [confirm, setConfirm] = useState(false)
  const stripRef = useRef<HTMLDivElement>(null)

  const selected = useMemo(() => new Set(order.selection.filter(isProof)), [order.selection])
  const count = selected.size
  const quota = PHOTO_QUOTA[order.packageId]
  const status = useQuotaStatus(count, quota)

  const byCat = useMemo(() => {
    const m = Object.fromEntries(PROOF_CATEGORIES.map(c => [c.key, [] as ImgKey[]])) as Record<ProofCategory, ImgKey[]>
    for (const id of proofs) m[proofCategory(id)].push(id)
    return m
  }, [proofs])

  const catIds = byCat[cat]
  const at = Math.min(pos, catIds.length)
  const id: ImgKey | undefined = catIds[at]
  const peek: ImgKey | undefined = catIds[at + 1]
  const idx = PROOF_CATEGORIES.findIndex(c => c.key === cat)
  const isReviewed = (x: ImgKey) => selected.has(x) || passed.has(x)
  const reviewedTotal = proofs.filter(isReviewed).length
  const pendingCat = [...PROOF_CATEGORIES.slice(idx + 1), ...PROOF_CATEGORIES.slice(0, idx)].find(c => byCat[c.key].some(x => !isReviewed(x)))
  const kept = useMemo(() => PROOF_CATEGORIES.flatMap(c => byCat[c.key].filter(x => selected.has(x))), [byCat, selected])

  const decide = (d: Decision) => {
    if (!id) return
    const wasKept = selected.has(id)
    if (d === 'keep' && !wasKept) {
      if (count + 1 === quota) toast(t.quotaToast)
      toggleSelection(order.id, id)
    }
    if (d === 'pass' && wasKept) toggleSelection(order.id, id)
    setPassed(p => {
      const n = new Set(p)
      if (d === 'pass') n.add(id)
      else n.delete(id)
      return n
    })
    setHistory(h => [...h.slice(-49), { id, cat, pos: at, wasKept, wasPassed: passed.has(id) }])
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
    if (selected.has(last.id) !== last.wasKept) toggleSelection(order.id, last.id)
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

  const openChapter = (key: ProofCategory) => {
    const first = byCat[key].findIndex(x => !isReviewed(x))
    setDir(0)
    setCat(key)
    setPos(Math.max(0, first))
  }

  const jumpTo = (x: ImgKey) => {
    const c = proofCategory(x)
    setDir(0)
    setCat(c)
    setPos(byCat[c].indexOf(x))
  }

  // Keyboard culling. A ref keeps the listener bound once while always seeing fresh state.
  const onKey = useRef<(e: KeyboardEvent) => void>(() => {})
  onKey.current = e => {
    if (confirm || e.metaKey || e.ctrlKey || e.altKey) return
    const el = e.target as HTMLElement
    if (el.closest('input, textarea, select, [contenteditable="true"]')) return
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

  // Keep the current frame centred in the filmstrip without scrolling the page.
  useEffect(() => {
    const strip = stripRef.current
    const el = strip?.querySelector<HTMLElement>(`[data-i="${at}"]`)
    if (!strip || !el) return
    strip.scrollTo({ left: el.offsetLeft - strip.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' })
  }, [cat, at])

  const cover = resolveCover(order, lang)
  const ev = eventByKey(order.eventType)
  const catKept = catIds.filter(x => selected.has(x)).length

  return (
    <div>
      {/* Header */}
      <Reveal y={12}>
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-10">
          <div className="flex items-center gap-4">
            <span className="h-16 w-16 shrink-0 rounded-full bg-white p-1 shadow-soft ring-1 ring-ruby/25 md:h-20 md:w-20">
              <Img k={cover.dp} w={200} ratio={1} sizes="80px" className="h-full w-full rounded-full" />
            </span>
            <div className="min-w-0">
              <p className="t-label text-ruby">
                {t.eyebrow}
                {ev && <span className="text-ink/40"> · {ev.name[lang]}</span>}
              </p>
              <h1 className="mt-1 text-balance font-display text-[28px] font-medium leading-[1.1] md:text-[38px]">{cover.name}</h1>
              <p className="mt-1 font-display text-[15px] italic text-ink/50">{cover.date}</p>
            </div>
          </div>
          <p className="max-w-sm text-[14px] leading-relaxed text-ink/55">{t.lead}</p>
        </div>
      </Reveal>

      {/* Workspace */}
      <Reveal y={20}>
        <section className="mt-8 overflow-hidden rounded-[28px] bg-ink text-white shadow-[0_40px_90px_-40px_rgba(10,10,11,0.6)] md:mt-10">
          {/* Chapters */}
          <nav aria-label={t.chapters} className="no-scrollbar flex gap-1 overflow-x-auto border-b border-white/10 p-2 md:p-3" data-lenis-prevent>
            {PROOF_CATEGORIES.map((c, i) => {
              const ids = byCat[c.key]
              const on = c.key === cat
              const k = ids.filter(x => selected.has(x)).length
              const p = ids.filter(x => passed.has(x) && !selected.has(x)).length
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => openChapter(c.key)}
                  aria-current={on ? 'page' : undefined}
                  className={`relative flex min-w-[132px] shrink-0 flex-col gap-2 rounded-2xl px-3.5 py-3 text-left transition-colors cursor-pointer ${on ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'}`}
                >
                  <span className="flex items-baseline gap-2">
                    <span className="font-display text-[12px] italic text-ruby-bright">{pad2(i + 1)}</span>
                    <span className={`font-display text-[17px] leading-none ${on ? 'text-white' : 'text-white/50'}`}>{c.name[lang]}</span>
                  </span>
                  <span className="flex h-1 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
                    <motion.span className="h-full bg-ruby-bright" animate={{ width: `${ids.length ? (k / ids.length) * 100 : 0}%` }} transition={{ duration: 0.5, ease: EASE }} />
                    <motion.span className="h-full bg-white/30" animate={{ width: `${ids.length ? (p / ids.length) * 100 : 0}%` }} transition={{ duration: 0.5, ease: EASE }} />
                  </span>
                  <span className="text-[11px] tabular-nums text-white/40">
                    <span className={k ? 'text-ruby-bright' : ''}>{k}</span> / {ids.length}
                  </span>
                </button>
              )
            })}
          </nav>

          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px]">
            {/* Stage */}
            <div className="min-w-0 px-4 pb-5 pt-4 md:px-8 md:pt-6">
              <div className="flex items-center justify-between gap-3 text-[12.5px]">
                <p className="min-w-0 truncate text-white/50">
                  {id ? (
                    <>
                      {t.frame} <span className="tabular-nums text-white">{pad2(at + 1)}</span> / <span className="tabular-nums">{pad2(catIds.length)}</span>
                      <span className="ml-3 font-mono text-white/35">{proofFile(id)}</span>
                    </>
                  ) : (
                    <>
                      {t.chapter} {pad2(idx + 1)} · {PROOF_CATEGORIES[idx].name[lang]}
                    </>
                  )}
                </p>
                <button
                  type="button"
                  onClick={undo}
                  disabled={!history.length}
                  className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-white/15 px-3.5 text-white/80 transition hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-default"
                >
                  <Icon name="refresh" size={14} className="-scale-x-100" />
                  {t.undo}
                </button>
              </div>

              <div className="relative mt-4 grid h-[var(--stage-h)] place-items-center [--stage-h:min(52vh,460px)] md:mt-5 md:[--stage-h:min(60vh,600px)]">
                {id && peek && (
                  <div key={`peek-${peek}`} style={{ ...STACK, width: cardWidth(peek), aspectRatio: `${IMG[peek].w} / ${IMG[peek].h}` }} className="pointer-events-none translate-y-4 scale-[0.93] overflow-hidden rounded-2xl opacity-35" aria-hidden="true">
                    <img src={photoUrl(peek, 1400)} alt="" draggable={false} className="h-full w-full object-cover" />
                  </div>
                )}
                <AnimatePresence initial={false} custom={dir} mode="popLayout">
                  {id ? (
                    <StageCard key={id} id={id} dir={dir} kept={selected.has(id)} onDecide={decide} />
                  ) : (
                    <motion.div key={`end-${cat}`} style={STACK} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.45, ease: EASE }} className="flex max-w-sm flex-col items-center px-4 text-center">
                      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-ruby text-white shadow-ruby">
                        <Icon name="check" size={26} strokeWidth={2.2} />
                      </span>
                      <h3 className="mt-6 font-display text-[30px] font-medium leading-tight">{pendingCat ? t.chapterDone : t.allDone}</h3>
                      <p className="mt-2 text-[14px] text-white/60">
                        <span className="font-semibold text-ruby-bright tabular-nums">{catKept}</span> {t.of} {catIds.length} {t.keptHere}
                      </p>
                      {!pendingCat && <p className="mt-1 text-[14px] text-white/60">{t.allDoneBody}</p>}
                      <div className="mt-7 flex flex-wrap justify-center gap-2.5">
                        {pendingCat ? (
                          <Button onClick={() => openChapter(pendingCat.key)} icon="arrowRight">
                            {t.continueWith} {pendingCat.name[lang]}
                          </Button>
                        ) : (
                          <Button onClick={() => setConfirm(true)} disabled={count === 0} icon="arrowRight">
                            {t.submit}
                          </Button>
                        )}
                        <Button variant="outline-light" onClick={() => browse(-catIds.length)}>
                          {t.startOver}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Decisions */}
              <div className="mt-6 flex items-center justify-center gap-3 md:gap-4">
                <RoundButton icon="chevronLeft" label={t.prev} onClick={() => browse(-1)} disabled={at === 0} />
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.92 }}
                  onClick={() => decide('pass')}
                  disabled={!id}
                  className="flex h-14 items-center gap-2 rounded-full border border-white/15 px-6 text-[14px] font-semibold text-white/85 transition-colors hover:border-white/40 hover:bg-white/10 disabled:opacity-30 cursor-pointer disabled:cursor-default md:h-16 md:px-7"
                >
                  <Icon name="x" size={19} strokeWidth={2} />
                  {t.pass}
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.92 }}
                  onClick={() => decide('keep')}
                  disabled={!id}
                  className="flex h-14 items-center gap-2 rounded-full bg-ruby px-7 text-[14px] font-semibold text-white shadow-ruby transition-colors hover:bg-ruby-bright disabled:opacity-30 cursor-pointer disabled:cursor-default md:h-16 md:px-8"
                >
                  <Icon name="heart" size={19} className="fill-white" />
                  {id && selected.has(id) ? t.kept : t.keep}
                </motion.button>
                <RoundButton icon="chevronRight" label={t.next} onClick={() => browse(1)} disabled={!id} />
              </div>
              <p className="mt-3 text-center text-[12px] text-white/35">
                <span className="md:hidden">{t.swipe}</span>
                <span className="hidden md:inline">{t.keys}</span>
              </p>

              {/* Filmstrip */}
              <div ref={stripRef} aria-label={t.filmstrip} className="no-scrollbar relative -mx-4 mt-5 flex gap-1.5 overflow-x-auto border-t border-white/10 px-4 pt-4 md:-mx-8 md:px-8" data-lenis-prevent>
                {catIds.map((x, i) => {
                  const cur = i === at
                  const k = selected.has(x)
                  const p = passed.has(x) && !k
                  return (
                    <button
                      key={x}
                      type="button"
                      data-i={i}
                      onClick={() => browse(i - at)}
                      aria-label={`${t.show}: ${proofFile(x)}`}
                      aria-current={cur ? 'true' : undefined}
                      className={`relative h-14 shrink-0 overflow-hidden rounded-md transition duration-300 cursor-pointer md:h-16 ${cur ? 'ring-2 ring-white ring-offset-2 ring-offset-ink' : ''} ${p ? 'opacity-30 grayscale' : cur || k ? '' : 'opacity-60 hover:opacity-100'}`}
                      style={{ aspectRatio: `${IMG[x].w} / ${IMG[x].h}` }}
                    >
                      <Img k={x} w={200} sizes="120px" className="h-full w-full" dark />
                      {k && (
                        <span className="absolute bottom-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-ruby">
                          <Icon name="heart" size={9} className="fill-white text-white" />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Album tray */}
            <aside className="flex flex-col border-t border-white/10 p-5 md:p-6 lg:border-l lg:border-t-0">
              <p className="t-label text-white/45">{t.album}</p>
              <div className="mt-4 flex items-center gap-4">
                <QuotaRing value={count / quota} over={count > quota}>
                  <span className="font-display text-[22px] font-medium tabular-nums">
                    <AnimatedCount value={count} />
                  </span>
                </QuotaRing>
                <div className="min-w-0">
                  <p className="font-display text-[20px] leading-none">
                    {count} <span className="text-white/40">/ {quota}</span>
                  </p>
                  <p className={`mt-1.5 text-[12.5px] leading-snug ${count > quota ? 'text-ruby-bright' : 'text-white/55'}`}>{status}</p>
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
                      {kept.map(x => (
                        <motion.li key={x} layout initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.35, ease: EASE }} className="group relative aspect-square">
                          <button type="button" onClick={() => jumpTo(x)} aria-label={`${t.show}: ${proofFile(x)}`} className={`block h-full w-full overflow-hidden rounded-md cursor-pointer ${x === id ? 'ring-2 ring-white' : ''}`}>
                            <Img k={x} w={160} ratio={1} sizes="72px" className="h-full w-full" dark />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleSelection(order.id, x)}
                            aria-label={`${t.remove}: ${proofFile(x)}`}
                            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-ink opacity-0 shadow transition group-hover:opacity-100 focus-visible:opacity-100 cursor-pointer max-lg:opacity-100"
                          >
                            <Icon name="x" size={11} strokeWidth={2.4} />
                          </button>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                )}
              </div>

              <Button onClick={() => setConfirm(true)} disabled={count === 0} icon="arrowRight" full className="mt-5 hidden lg:inline-flex">
                {t.submit}
              </Button>
            </aside>
          </div>
        </section>
      </Reveal>

      <div className="mt-8 flex flex-col items-center gap-1.5 text-center text-[11.5px] text-ink/40">
        <p>{t.onlyIds}</p>
        <p className="flex min-w-0 max-w-full items-center gap-1.5">
          <Icon name="lock" size={12} className="shrink-0" />
          <code className="truncate font-mono text-ink/55">{gcsPath(order)}</code>
        </p>
      </div>

      {/* Phone submit bar — the tray holds it on desktop */}
      <FloatingBar className="lg:hidden">
        <div className="glass-dark pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-full py-2 pl-5 pr-2">
          <Icon name="heart" size={15} className="shrink-0 fill-ruby-bright text-ruby-bright" />
          <span className="min-w-0 flex-1 text-[15px] font-semibold tabular-nums text-white">
            <AnimatedCount value={count} /> <span className="font-normal text-white/50">/ {quota}</span>
          </span>
          <Button onClick={() => setConfirm(true)} disabled={count === 0} icon="arrowRight" className="shrink-0 !px-4">
            {t.submit}
          </Button>
        </div>
      </FloatingBar>

      <SubmitSelectionModal order={order} selected={selected} open={confirm} onClose={() => setConfirm(false)} />
    </div>
  )
}

/** The frame on the stage. Drag it right to keep, left to pass; it flies off the way it was decided. */
function StageCard({ id, dir, kept, onDecide }: { id: ImgKey; dir: number; kept: boolean; onDecide: (d: Decision) => void }) {
  const t = useT(copy)
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
      style={{ ...STACK, x, rotate, width: cardWidth(id), aspectRatio: `${IMG[id].w} / ${IMG[id].h}` }}
      className="relative z-10 touch-pan-y cursor-grab active:cursor-grabbing"
    >
      <div className={`relative h-full w-full overflow-hidden rounded-2xl bg-ink-3 shadow-[0_30px_70px_-25px_rgba(0,0,0,0.9)] transition-shadow duration-500 ${kept ? 'ring-2 ring-ruby-bright' : 'ring-1 ring-white/10'}`}>
        <img src={photoUrl(id, 1400)} alt={IMG[id].alt} draggable={false} className="pointer-events-none h-full w-full select-none object-cover" />
        <Watermark size="md" />
        {kept && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-ruby px-2.5 py-1 text-[11px] font-semibold text-white shadow-ruby">
            <Icon name="heart" size={11} className="fill-white" />
            {t.inAlbum}
          </span>
        )}
        <motion.span style={{ opacity: keepStamp }} className="pointer-events-none absolute left-5 top-5 -rotate-12 rounded-lg border-[3px] border-ruby-bright bg-ink/30 px-3 py-1 text-[22px] font-bold uppercase tracking-[0.12em] text-ruby-bright">
          {t.keep}
        </motion.span>
        <motion.span style={{ opacity: passStamp }} className="pointer-events-none absolute right-5 top-5 rotate-12 rounded-lg border-[3px] border-white bg-ink/30 px-3 py-1 text-[22px] font-bold uppercase tracking-[0.12em] text-white">
          {t.pass}
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
      className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-25 disabled:hover:bg-transparent cursor-pointer disabled:cursor-default sm:flex"
    >
      <Icon name={icon} size={20} />
    </button>
  )
}

/** Album quota as a ring; turns solid when the quota is exceeded. */
function QuotaRing({ value, over, children }: { value: number; over: boolean; children: ReactNode }) {
  const size = 76
  const stroke = 5
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-white/10" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={over ? '#ffffff' : '#e2264f'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - Math.min(1, value)) }}
          transition={{ duration: 0.6, ease: EASE }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}
