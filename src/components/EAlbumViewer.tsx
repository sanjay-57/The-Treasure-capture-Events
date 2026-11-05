import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useLenis } from 'lenis/react'
import { Icon } from './Icon'
import { useScrollLock } from './ui'
import { GRAIN, Surface, isLight } from './AlbumSurface'
import { Kolam } from './tamil'
import { ALBUM, type AlbumSpec } from '../lib/data'
import { photoUrl, type ImgKey } from '../lib/images'
import { useLang, useT } from '../lib/i18n'

/*
 * E-album: the client's chosen photos as a cinematic virtual album.
 *
 * The album lies on a dark velvet table seen from above. The cover lifts on its
 * spine (no hands), a title page turns, and every spread is toured by a camera
 * that glides into each photo before the next leaf flips. The sequence is a
 * small state machine (`View`) advanced by timers while `playing`; every step
 * can also be driven by hand (arrows, the transport bar, tapping a photo).
 *
 * Geometry: pages are laid out at a fixed logical size (2W × H for a spread)
 * and the whole stage is scaled to fit the viewport, so camera maths stay in
 * one coordinate system regardless of screen.
 */

const copy = {
  close: { en: 'Close', ta: 'மூடு' },
  play: { en: 'Play', ta: 'இயக்கு' },
  pause: { en: 'Pause', ta: 'நிறுத்து' },
  prev: { en: 'Previous page', ta: 'முந்தைய பக்கம்' },
  next: { en: 'Next page', ta: 'அடுத்த பக்கம்' },
  replay: { en: 'Watch again', ta: 'மீண்டும் பார்க்க' },
  tapHint: { en: 'Tap a photo to look closer', ta: 'நெருங்கிப் பார்க்க படத்தைத் தொடுங்கள்' },
  cover: { en: 'Cover', ta: 'அட்டை' },
  titlePage: { en: 'Title page', ta: 'தலைப்புப் பக்கம்' },
  spread: { en: 'Spread', ta: 'பக்கம்' },
  closing: { en: 'The last page', ta: 'கடைசிப் பக்கம்' },
  theEnd: { en: 'Made with love', ta: 'அன்புடன் உருவாக்கியது' },
  fin: { en: 'Every spread here is a sample. The real design arrives from our album makers.', ta: 'இவை மாதிரிப் பக்கங்கள். உண்மையான வடிவமைப்பு எங்கள் ஆல்பம் தயாரிப்பாளர்களிடமிருந்து வரும்.' },
  photographs: { en: 'photographs', ta: 'புகைப்படங்கள்' },
  studio: { en: 'The Treasure Captures', ta: 'தி ட்ரெஷர் கேப்சர்ஸ்' },
  album: { en: 'Wedding album', ta: 'திருமண ஆல்பம்' },
  colophon: { en: 'Captured by', ta: 'படமாக்கியது' },
  keys: { en: '← → to turn · space to pause · esc to close', ta: '← → பக்கம் · space நிறுத்த · esc மூட' },
  loading: { en: 'Opening your album', ta: 'உங்கள் ஆல்பம் திறக்கிறது' },
}

// ─── Timing (ms) ─────────────────────────────────────────────────────────────

const T = {
  closedHold: 2400,
  flip: 1600,
  arrive: 1500,
  focus: 2800,
  done: 1200,
  frontMatter: 2600,
  settle: 120,
}

const GLIDE = { duration: 1.5, ease: [0.65, 0, 0.3, 1] as const }
const SNAP = { duration: 0.9, ease: [0.3, 0, 0.2, 1] as const }

// ─── Geometry ────────────────────────────────────────────────────────────────

const PAGE_H = 620
const SIZE_RATIO: Record<string, { ratio: number; hf: number }> = {
  '12x36': { ratio: 1.5, hf: 1 },
  '12x30': { ratio: 1.25, hf: 1 },
  '10x24': { ratio: 1.2, hf: 10 / 12 },
  '12x12': { ratio: 1, hf: 1 },
}

const colorOf = (key: string) => ALBUM.colors.find(c => c.key === key) ?? ALBUM.colors[0]
const fontOf = (key: string) => ALBUM.fonts.find(f => f.key === key) ?? ALBUM.fonts[0]
const layoutOf = (key: string) => ALBUM.layouts.find(l => l.key === key) ?? ALBUM.layouts[0]

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16)
  const mix = (c: number) => Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)
  return `rgb(${mix((n >> 16) & 255)}, ${mix((n >> 8) & 255)}, ${mix(n & 255)})`
}

type Cell = readonly [number, number, number, number]
interface PhotoSpread {
  layout: string
  cells: readonly Cell[]
  photos: ImgKey[]
}

/**
 * Deal the photos into spreads. The client's chosen layout leads, then the
 * sequence varies so consecutive spreads never look alike. Layouts with more
 * cells than photos left are skipped so the last spread is never half empty.
 */
function dealSpreads(photos: ImgKey[], first: string): PhotoSpread[] {
  const seq = ['story', 'classic', 'collage', 'panorama', 'classic', 'story', 'collage', 'panorama', 'classic']
  const order = [first, ...seq.filter(k => k !== first)]
  const out: PhotoSpread[] = []
  let i = 0
  let n = 0
  while (i < photos.length && out.length < 40) {
    let key = order[n % order.length]
    if (layoutOf(key).cells.length > photos.length - i) key = photos.length - i >= 2 ? 'classic' : 'panorama'
    const l = layoutOf(key)
    out.push({ layout: l.key, cells: l.cells, photos: photos.slice(i, i + l.cells.length) })
    i += l.cells.length
    n += 1
  }
  return out
}

// ─── View state ──────────────────────────────────────────────────────────────

/**
 * Spread numbering: 0 closed (front cover up), 1 title spread, 2…N photo
 * spreads, N+1 colophon, N+2 closed again (back cover up). `focus` walks the
 * cells of a photo spread: -1 overview on arrival, 0…n-1 a photo, n overview
 * before the leaf turns.
 */
interface View {
  spread: number
  focus: number
  flip: { a: number; b: number; dir: 1 | -1 } | null
}

export interface EAlbumViewerProps {
  open: boolean
  onClose: () => void
  spec: AlbumSpec
  photos: ImgKey[]
}

export function EAlbumViewer({ open, onClose, spec, photos }: EAlbumViewerProps) {
  const lenis = useLenis()
  useScrollLock(open)
  useEffect(() => {
    if (!open) return
    lenis?.stop()
    return () => lenis?.start()
  }, [open, lenis])

  if (typeof document === 'undefined') return null
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] overflow-hidden bg-ink text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          role="dialog"
          aria-modal="true"
          data-lenis-prevent
        >
          <Scene spec={spec} photos={photos} onClose={onClose} />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

function Scene({ spec, photos, onClose }: { spec: AlbumSpec; photos: ImgKey[]; onClose: () => void }) {
  const t = useT(copy)
  const lang = useLang()
  const spreads = useMemo(() => dealSpreads(photos, spec.layout ?? 'classic'), [photos, spec.layout])
  const N = spreads.length + 1 // last photo spread index
  const LAST = N + 2 // closed again
  const geo = SIZE_RATIO[spec.size] ?? SIZE_RATIO['12x30']
  const H = PAGE_H * geo.hf
  const W = H * geo.ratio

  const [view, setView] = useState<View>({ spread: 0, focus: -1, flip: null })
  const [playing, setPlaying] = useState(true)
  const [ready, setReady] = useState(false)
  const [chromeOn, setChromeOn] = useState(true)
  const idle = useRef<number>(0)

  const isPhoto = (i: number) => i >= 2 && i <= N
  const spreadAt = (i: number) => (isPhoto(i) ? spreads[i - 2] : null)

  // Warm the first few photos so the cover opens onto loaded pages.
  useEffect(() => {
    const first = spreads.slice(0, 2).flatMap(s => s.photos)
    let pending = first.length
    if (!pending) {
      setReady(true)
      return
    }
    const done = () => --pending <= 0 && setReady(true)
    for (const k of first) {
      const img = new Image()
      img.onload = done
      img.onerror = done
      img.src = photoUrl(k, 1400)
    }
    const guard = window.setTimeout(() => setReady(true), 2500)
    return () => window.clearTimeout(guard)
  }, [spreads])

  const startFlip = useCallback(
    (to: number) => {
      setView(v => {
        if (v.flip || to < 0 || to > LAST || to === v.spread) return v
        const dir: 1 | -1 = to > v.spread ? 1 : -1
        return { spread: to, focus: -1, flip: { a: Math.min(v.spread, to), b: Math.max(v.spread, to), dir } }
      })
    },
    [LAST],
  )
  /** The reader took over: hold the tour until they press play again. */
  const turn = useCallback(
    (to: number) => {
      setPlaying(false)
      startFlip(to)
    },
    [startFlip],
  )

  // Flip lands: settle on the new spread.
  useEffect(() => {
    if (!view.flip) return
    const id = window.setTimeout(() => setView(v => ({ ...v, flip: null, focus: -1 })), T.flip + T.settle)
    return () => window.clearTimeout(id)
  }, [view.flip])

  // Auto tour: schedule the next beat from wherever we are.
  useEffect(() => {
    if (!playing || !ready || view.flip) return
    const s = spreadAt(view.spread)
    let delay: number
    let next: () => void
    if (view.spread === LAST) {
      setPlaying(false)
      return
    } else if (view.spread === 0) {
      delay = T.closedHold
      next = () => startFlip(1)
    } else if (!s) {
      delay = T.frontMatter
      next = () => startFlip(view.spread + 1)
    } else if (view.focus < 0) {
      delay = T.arrive
      next = () => setView(v => ({ ...v, focus: 0 }))
    } else if (view.focus < s.cells.length) {
      delay = T.focus
      next = () => setView(v => ({ ...v, focus: v.focus + 1 }))
    } else {
      delay = T.done
      next = () => startFlip(view.spread + 1)
    }
    const id = window.setTimeout(next, delay)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, ready, view, LAST, startFlip])

  const replay = () => {
    setView({ spread: 0, focus: -1, flip: null })
    setPlaying(true)
  }
  const focusCell = (i: number) => {
    setPlaying(false)
    setView(v => (v.flip ? v : { ...v, focus: v.focus === i ? (spreadAt(v.spread)?.cells.length ?? 0) : i }))
  }

  // Keyboard transport.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') turn(view.spread + 1)
      else if (e.key === 'ArrowLeft') turn(view.spread - 1)
      else if (e.key === ' ') {
        e.preventDefault()
        setPlaying(p => !p)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, turn, view.spread])

  // Chrome fades while the camera is on a photo; any pointer activity brings it back.
  const poke = () => {
    setChromeOn(true)
    window.clearTimeout(idle.current)
    idle.current = window.setTimeout(() => setChromeOn(false), 2600)
  }
  useEffect(() => () => window.clearTimeout(idle.current), [])
  const cur = spreadAt(view.spread)
  const onPhoto = !!cur && !view.flip && view.focus >= 0 && view.focus < cur.cells.length
  const chrome = chromeOn || !onPhoto

  // Stage fit.
  const box = useRef<HTMLDivElement>(null)
  const [vp, setVp] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setVp({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const pad = vp.w < 640 ? 0.9 : 0.78
  const fit = vp.w ? Math.min((vp.w * pad) / (2 * W), (vp.h * 0.66) / H) : 0.4

  // Camera: top view for the closed book, a gentle tilt over spreads, flat and close on a photo.
  const closed = view.spread === 0 || view.spread === LAST
  const camera = useMemo(() => {
    if (onPhoto && cur) {
      const [cx, cy, cw, ch] = cur.cells[view.focus]
      const cellW = (cw / 100) * 2 * W
      const cellH = (ch / 100) * H
      const availW = vp.w / Math.max(fit, 0.01)
      const availH = vp.h / Math.max(fit, 0.01)
      const z = Math.max(1.15, Math.min(3.6, Math.min(availW / cellW, availH / cellH) * 0.84))
      const relX = ((cx + cw / 2) / 100) * 2 * W - W
      const relY = ((cy + ch / 2) / 100) * H - H / 2
      return { scale: z, x: -z * relX, y: -z * relY, rotateX: 0, rotateZ: 0 }
    }
    if (closed) return { scale: 1.2, x: 0, y: 0, rotateX: 38, rotateZ: -5 }
    return { scale: 1, x: 0, y: 0, rotateX: 16, rotateZ: 0 }
  }, [onPhoto, cur, view.focus, closed, W, H, vp, fit])

  const color = colorOf(spec.color)
  const label =
    view.spread === 0 || view.spread === LAST
      ? t.cover
      : view.spread === 1
        ? t.titlePage
        : view.spread === N + 1
          ? t.closing
          : `${t.spread} ${view.spread - 1} / ${spreads.length}`
  const ended = view.spread === LAST && !view.flip

  return (
    <div ref={box} className="absolute inset-0 select-none" onPointerMove={poke} onPointerDown={poke}>
      <Table hex={color.hex} />

      {/* Stage */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: 2600, perspectiveOrigin: '50% 42%' }}>
        <motion.div
          className="relative"
          style={{ width: 2 * W, height: H, transformStyle: 'preserve-3d' }}
          initial={false}
          animate={{ scale: fit }}
          transition={SNAP}
        >
          <motion.div
            className="absolute inset-0"
            style={{ transformStyle: 'preserve-3d', transformOrigin: '50% 50%' }}
            initial={false}
            animate={camera}
            transition={onPhoto ? GLIDE : { ...GLIDE, duration: 1.7 }}
          >
            <Book view={view} spec={spec} spreads={spreads} W={W} H={H} N={N} onCell={focusCell} />
          </motion.div>
        </motion.div>
      </div>

      {/* Loading veil */}
      <AnimatePresence>
        {!ready && (
          <motion.div className="absolute inset-0 z-20 flex items-center justify-center bg-ink" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
            <div className="flex flex-col items-center gap-4">
              <motion.span className="h-10 w-10 rounded-full border border-white/20 border-t-white/80" animate={{ rotate: 360 }} transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }} />
              <p className="t-label text-white/50">{t.loading}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top chrome */}
      <motion.div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-4 sm:p-6" animate={{ opacity: chrome ? 1 : 0, y: chrome ? 0 : -8 }} transition={{ duration: 0.5 }}>
        <div className="min-w-0">
          <p className="t-label text-white/45">{t.album}</p>
          <p className="mt-1 truncate font-display text-[20px] font-medium leading-tight sm:text-[24px]">{spec.title || t.studio}</p>
          <p className="mt-0.5 text-[12.5px] tabular-nums text-white/50">{label}</p>
        </div>
        <button type="button" onClick={onClose} aria-label={t.close} className="pointer-events-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20 cursor-pointer">
          <Icon name="x" size={18} />
        </button>
      </motion.div>

      {/* Transport */}
      <motion.div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-3 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-6" animate={{ opacity: chrome ? 1 : 0, y: chrome ? 0 : 10 }} transition={{ duration: 0.5 }}>
        <Progress count={LAST + 1} at={view.spread} />
        <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-white/10 p-1.5 backdrop-blur-md">
          <Transport icon="chevronLeft" label={t.prev} onClick={() => turn(view.spread - 1)} disabled={view.spread === 0 || !!view.flip} />
          <button
            type="button"
            onClick={() => (ended ? replay() : setPlaying(p => !p))}
            aria-label={ended ? t.replay : playing ? t.pause : t.play}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-ink transition hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Icon name={ended ? 'refresh' : playing ? 'pause' : 'play'} size={20} className={ended || !playing ? 'translate-x-px' : ''} />
          </button>
          <Transport icon="chevronRight" label={t.next} onClick={() => turn(view.spread + 1)} disabled={view.spread === LAST || !!view.flip} />
        </div>
        <p className="text-[11.5px] text-white/40">{cur ? t.tapHint : ''}</p>
        <p className="hidden text-[11px] text-white/25 lg:block">{t.keys}</p>
      </motion.div>

      {/* Ending card */}
      <AnimatePresence>
        {ended && (
          <motion.div className="pointer-events-none absolute inset-0 z-10 flex items-end justify-center pb-[26svh] sm:items-center sm:pb-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9, delay: 0.5 }}>
            <div className="mx-6 max-w-md text-center">
              {lang === 'ta' ? <Kolam size={44} className="mx-auto text-white/60" strokeWidth={1.2} /> : <span className="mx-auto block h-px w-12 bg-white/40" />}
              <p className="t-label mt-4 text-white/50">{t.theEnd}</p>
              <p className="mt-2 font-display text-[30px] font-medium leading-tight sm:text-[36px]">{spec.title || t.studio}</p>
              <p className="mt-3 text-[13px] leading-relaxed text-white/50">{t.fin}</p>
              <div className="pointer-events-auto mt-6 flex items-center justify-center gap-2">
                <button type="button" onClick={replay} className="flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-ink transition hover:scale-[1.03] active:scale-95 cursor-pointer">
                  <Icon name="refresh" size={16} /> {t.replay}
                </button>
                <button type="button" onClick={onClose} className="flex h-11 items-center rounded-full bg-white/10 px-5 text-[14px] font-semibold text-white transition hover:bg-white/20 cursor-pointer">
                  {t.close}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Transport({ icon, label, onClick, disabled }: { icon: 'chevronLeft' | 'chevronRight'; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} className="flex h-11 w-11 items-center justify-center rounded-full text-white transition hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-default">
      <Icon name={icon} size={20} />
    </button>
  )
}

function Progress({ count, at }: { count: number; at: number }) {
  return (
    <div className="flex items-center gap-1" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className={`h-1 rounded-full transition-all duration-500 ${i === at ? 'w-6 bg-white' : i < at ? 'w-1.5 bg-white/60' : 'w-1.5 bg-white/20'}`} />
      ))}
    </div>
  )
}

/** Velvet tabletop: deep ink, a warm pool of light where the album sits, and the album colour bleeding softly into the shadows. */
function Table({ hex }: { hex: string }) {
  const lang = useLang()
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <div className="absolute inset-0" style={{ background: `radial-gradient(70% 55% at 50% 48%, ${shade(hex, -0.6)} 0%, #121214 45%, #060607 100%)` }} />
      <div className="absolute inset-0 opacity-[0.35] mix-blend-soft-light" style={{ backgroundImage: GRAIN, backgroundSize: '220px' }} />
      <motion.div
        className="absolute left-1/2 top-[44%] h-[70vmin] w-[90vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: 'radial-gradient(ellipse at center, rgba(255,235,200,0.14), transparent 65%)' }}
        animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.06, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />
      {lang === 'ta' && <div className="kolam-bg-white absolute inset-0 opacity-[0.05]" style={{ maskImage: 'radial-gradient(ellipse at center, #000 20%, transparent 70%)', WebkitMaskImage: 'radial-gradient(ellipse at center, #000 20%, transparent 70%)' }} />}
    </div>
  )
}

// ─── The book ────────────────────────────────────────────────────────────────

interface BookProps {
  view: View
  spec: AlbumSpec
  spreads: PhotoSpread[]
  W: number
  H: number
  N: number
  onCell: (i: number) => void
}

/**
 * Every leaf is a persistent element hinged on the spine: leaf k carries the
 * right page of spread k on its front and the left page of spread k+1 on its
 * back, and simply rotates to -180° once the reader is past it. Nothing mounts
 * or unmounts during a turn, so images never reload mid-flip. Leaves far from
 * the current spread render blank to keep the DOM light.
 */
function Book({ view, spec, spreads, W, H, N, onCell }: BookProps) {
  const LAST = N + 2
  const { spread, flip } = view
  // Closed on either end, the book sits centred under the camera; open, the spine is the centre.
  const offset = spread === 0 ? -W / 2 : spread === LAST ? W / 2 : 0
  const thickness = 10 + spec.sheets * 0.22
  const leftOpen = spread > 0
  const rightOpen = spread < LAST
  const deep = -(LAST + 6)

  return (
    <motion.div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }} initial={false} animate={{ x: offset }} transition={GLIDE}>
      {/* floor shadow */}
      <div className="absolute" style={{ left: 0, top: 0, width: 2 * W, height: H, transform: `translateZ(${deep - thickness}px)` }}>
        <motion.div className="absolute inset-0" initial={false} animate={{ left: leftOpen ? 0 : W, right: rightOpen ? 0 : W }} transition={GLIDE} style={{ top: 0, bottom: 0, boxShadow: '0 60px 90px -30px rgba(0,0,0,0.75), 0 20px 30px -10px rgba(0,0,0,0.5)', background: '#111' }} />
      </div>
      <PageBlock side="left" W={W} H={H} thickness={thickness} visible={leftOpen} z={deep} />
      <PageBlock side="right" W={W} H={H} thickness={thickness} visible={rightOpen} z={deep} />

      {Array.from({ length: LAST }, (_, k) => {
        const turned = k < spread
        const depth = turned ? -(spread - 1 - k) : -(k - spread)
        const near = Math.abs(k - spread) <= 2 || Math.abs(k + 1 - spread) <= 2
        const live = !flip && (k === spread || k === spread - 1)
        return <Leaf key={k} k={k} turned={turned} depth={depth} flipping={!!flip && flip.a === k} near={near} live={live} view={view} spec={spec} spreads={spreads} W={W} H={H} N={N} onCell={onCell} />
      })}

      {/* shadow thrown on the page the leaf leaves or lands on */}
      {flip && (
        <motion.div
          key={`${flip.a}-${flip.dir}`}
          className="pointer-events-none absolute inset-y-0"
          style={{ left: flip.dir === 1 ? 0 : W, width: W, z: 1, background: flip.dir === 1 ? 'linear-gradient(90deg, transparent 30%, rgba(0,0,0,0.45))' : 'linear-gradient(270deg, transparent 30%, rgba(0,0,0,0.45))' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.6, 0.6, 0] }}
          transition={{ duration: T.flip / 1000, ease: 'linear' }}
        />
      )}
      {/* gutter shadow */}
      <motion.div className="pointer-events-none absolute inset-y-0 left-1/2 w-[14%] -translate-x-1/2" style={{ z: 1, background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.14) 44%, rgba(0,0,0,0.32) 50%, rgba(0,0,0,0.12) 56%, transparent)' }} initial={false} animate={{ opacity: leftOpen && rightOpen ? 1 : 0 }} transition={{ duration: 0.4 }} />
    </motion.div>
  )
}

/** Stacked page edges under each half so the open album has visible depth. */
function PageBlock({ side, W, H, thickness, visible, z }: { side: 'left' | 'right'; W: number; H: number; thickness: number; visible: boolean; z: number }) {
  const lines = Math.max(3, Math.round(thickness / 2.2))
  const shadow = Array.from({ length: lines }, (_, i) => `${side === 'left' ? -(i + 1) * 0.6 : (i + 1) * 0.6}px ${(i + 1) * 1.1}px 0 ${i % 2 ? '#d9d9dc' : '#f4f4f5'}`).join(', ')
  return (
    <motion.div
      className="pointer-events-none absolute rounded-[3px]"
      style={{ left: side === 'left' ? 2 : W, top: 2, width: W - 2, height: H - 4, background: '#fff', boxShadow: shadow, transform: `translateZ(${z}px)` }}
      initial={false}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.4 }}
    />
  )
}

interface LeafProps extends BookProps {
  k: number
  turned: boolean
  depth: number
  flipping: boolean
  near: boolean
  live: boolean
}

const FLIP_EASE = [0.55, 0.05, 0.25, 1] as const

function Leaf({ k, turned, depth, flipping, near, live, view, spec, spreads, W, H, N, onCell }: LeafProps) {
  const face: CSSProperties = { position: 'absolute', inset: 0, backfaceVisibility: 'hidden', overflow: 'hidden' }
  const sec = T.flip / 1000
  const sheen = flipping ? { opacity: [0, 0.9, 0.9, 0] } : { opacity: 0 }
  const sheenT = flipping ? { duration: sec, ease: 'linear' as const } : { duration: 0 }
  // Front is live when this leaf tops the right stack, back when it tops the left.
  const frontLive = live && !turned
  const backLive = live && turned
  return (
    <motion.div
      className="absolute"
      style={{ left: W, top: 0, width: W, height: H, transformOrigin: '0% 50%', transformStyle: 'preserve-3d' }}
      initial={false}
      animate={{ rotateY: turned ? -180 : 0, z: depth }}
      transition={flipping ? { duration: sec, ease: FLIP_EASE } : { duration: 0 }}
    >
      <div style={{ ...face, borderRadius: '2px 4px 4px 2px' }}>
        {near ? <Page index={k} side="right" spec={spec} spreads={spreads} W={W} H={H} N={N} view={frontLive ? view : null} onCell={onCell} /> : <Blank />}
        <motion.div className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.35), rgba(0,0,0,0) 35%, rgba(255,255,255,0.18) 70%, rgba(0,0,0,0.25))' }} initial={false} animate={sheen} transition={sheenT} />
      </div>
      <div style={{ ...face, transform: 'rotateY(180deg)', borderRadius: '4px 2px 2px 4px' }}>
        {near ? <Page index={k + 1} side="left" spec={spec} spreads={spreads} W={W} H={H} N={N} view={backLive ? view : null} onCell={onCell} /> : <Blank />}
        <motion.div className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(270deg, rgba(0,0,0,0.35), rgba(0,0,0,0) 35%, rgba(255,255,255,0.18) 70%, rgba(0,0,0,0.25))' }} initial={false} animate={sheen} transition={sheenT} />
      </div>
    </motion.div>
  )
}

// ─── Pages ───────────────────────────────────────────────────────────────────

interface PageProps {
  index: number
  side: 'left' | 'right'
  spec: AlbumSpec
  spreads: PhotoSpread[]
  W: number
  H: number
  N: number
  /** Current view when this page is live (tappable, highlights the focused photo); null on a turning leaf. */
  view: View | null
  onCell: (i: number) => void
}

/** Renders one page of a numbered spread: cover faces, endpapers, title page, colophon, or half of a photo spread. */
function Page({ index, side, spec, spreads, W, H, N, view, onCell }: PageProps) {
  const LAST = N + 2
  const color = colorOf(spec.color)
  if (index === 0) return side === 'right' ? <CoverFace spec={spec} photo={spreads[0]?.photos[0]} W={W} /> : null
  if (index === LAST) return side === 'left' ? <CoverFace spec={spec} W={W} back /> : null
  if (index === 1) return side === 'left' ? <Endpaper hex={color.hex} spec={spec} W={W} /> : <TitlePage spec={spec} W={W} />
  if (index === N + 1) return side === 'left' ? <Colophon spec={spec} W={W} count={spreads.reduce((n, s) => n + s.photos.length, 0)} /> : <Endpaper hex={color.hex} spec={spec} W={W} />
  const s = spreads[index - 2]
  if (!s) return <Blank />
  return <PhotoHalf spread={s} n={index - 1} side={side} spec={spec} W={W} H={H} view={view} onCell={onCell} />
}

const Blank = () => <div className="absolute inset-0 bg-white" />

function CoverFace({ spec, photo, W, back = false }: { spec: AlbumSpec; photo?: ImgKey; W: number; back?: boolean }) {
  const color = colorOf(spec.color)
  const font = fontOf(spec.font)
  const light = isLight(color.hex)
  const acrylic = spec.cover === 'acrylic'
  const ink = acrylic ? '#ffffff' : color.ink
  const titleStyle: CSSProperties = {
    fontFamily: font.family,
    fontStyle: font.italic ? 'italic' : 'normal',
    color: ink,
    textShadow: light && !acrylic ? '0 1px 0 rgba(255,255,255,0.7), 0 -1px 0 rgba(0,0,0,0.08)' : '0 1px 1px rgba(0,0,0,0.45), 0 -0.5px 0 rgba(255,255,255,0.15)',
  }
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: back ? '6px 2px 2px 6px' : '2px 6px 6px 2px', boxShadow: back ? 'inset -3px 0 6px rgba(0,0,0,0.25)' : 'inset 3px 0 6px rgba(0,0,0,0.25)' }}>
      <Surface cover={back && acrylic ? 'leather' : spec.cover} hex={color.hex} photo={back ? undefined : photo}>
        {!back && (
          <div className={`absolute inset-0 flex flex-col items-center px-[10%] text-center ${acrylic ? 'justify-end pb-[11%]' : 'justify-center'}`}>
            <p className="max-w-full break-words leading-[1.1]" style={{ ...titleStyle, fontSize: Math.max(18, W * 0.085) }}>
              {spec.title || '—'}
            </p>
            {spec.subtitle && (
              <p className="mt-3 max-w-full break-words" style={{ ...titleStyle, fontStyle: 'normal', fontFamily: font.key === 'modern' ? font.family : undefined, fontSize: Math.max(9, W * 0.03), letterSpacing: '0.22em', opacity: 0.85 }}>
                {spec.subtitle}
              </p>
            )}
            {!acrylic && spec.cover !== 'silk' && <span className="mt-4 h-px w-10" style={{ background: ink, opacity: 0.4 }} />}
          </div>
        )}
        {back && (
          <div className="absolute inset-x-0 bottom-[8%] flex justify-center">
            <span className="t-label" style={{ color: ink, opacity: 0.45, fontSize: Math.max(8, W * 0.022) }}>
              The Treasure Captures
            </span>
          </div>
        )}
      </Surface>
      <div className={`pointer-events-none absolute inset-y-0 w-5 ${back ? 'right-0' : 'left-0'}`} style={{ background: back ? 'linear-gradient(270deg, rgba(0,0,0,0.28), rgba(255,255,255,0.06) 40%, transparent)' : 'linear-gradient(90deg, rgba(0,0,0,0.28), rgba(255,255,255,0.06) 40%, transparent)' }} />
    </div>
  )
}

function Endpaper({ hex, spec, W }: { hex: string; spec: AlbumSpec; W: number }) {
  const base = shade(hex, isLight(hex) ? -0.08 : -0.35)
  const ink = isLight(hex) ? 'rgba(10,10,11,0.35)' : 'rgba(255,255,255,0.35)'
  const initials = spec.title
    .split(/\s*&\s*|\s+and\s+/i)
    .map(s => s.trim()[0])
    .filter(Boolean)
    .slice(0, 2)
    .join(' · ')
  const font = fontOf(spec.font)
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: base }}>
      <div className="absolute inset-0 opacity-50 mix-blend-soft-light" style={{ backgroundImage: GRAIN, backgroundSize: '160px' }} />
      <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(circle, ${ink} 0.8px, transparent 1.3px)`, backgroundSize: '18px 18px', opacity: 0.5 }} />
      <div className="absolute inset-[6%] rounded-[2px] border" style={{ borderColor: ink }} />
      {initials && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span style={{ fontFamily: font.family, fontStyle: font.italic ? 'italic' : 'normal', color: ink, fontSize: W * 0.13, letterSpacing: '0.08em' }}>{initials}</span>
        </div>
      )}
    </div>
  )
}

function TitlePage({ spec, W }: { spec: AlbumSpec; W: number }) {
  const t = useT(copy)
  const lang = useLang()
  const font = fontOf(spec.font)
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#faf8f3] text-ink">
      <div className="absolute inset-0 opacity-[0.12] mix-blend-multiply" style={{ backgroundImage: GRAIN, backgroundSize: '140px' }} />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-[12%] text-center">
        {lang === 'ta' ? <Kolam size={W * 0.12} className="text-ruby/70" strokeWidth={1.2} animate={false} /> : <span className="block h-px bg-ruby/50" style={{ width: W * 0.12 }} />}
        <p className="t-label mt-[6%] text-ink/45" style={{ fontSize: Math.max(8, W * 0.024) }}>
          {t.album}
        </p>
        <p className="mt-[4%] max-w-full break-words leading-[1.08]" style={{ fontFamily: font.family, fontStyle: font.italic ? 'italic' : 'normal', fontSize: Math.max(20, W * 0.11) }}>
          {spec.title || '—'}
        </p>
        {spec.subtitle && (
          <p className="mt-[5%] text-ink/55" style={{ fontSize: Math.max(9, W * 0.032), letterSpacing: '0.2em' }}>
            {spec.subtitle}
          </p>
        )}
        <span className="mt-[8%] block h-px bg-ink/15" style={{ width: W * 0.08 }} />
        <p className="mt-[4%] text-ink/40" style={{ fontSize: Math.max(8, W * 0.022), letterSpacing: '0.16em' }}>
          {t.studio.toUpperCase()}
        </p>
      </div>
    </div>
  )
}

function Colophon({ spec, W, count }: { spec: AlbumSpec; W: number; count: number }) {
  const t = useT(copy)
  const font = fontOf(spec.font)
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#faf8f3] text-ink">
      <div className="absolute inset-0 opacity-[0.12] mix-blend-multiply" style={{ backgroundImage: GRAIN, backgroundSize: '140px' }} />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-[14%] text-center">
        <p style={{ fontFamily: font.family, fontStyle: font.italic ? 'italic' : 'normal', fontSize: Math.max(16, W * 0.07) }}>{t.theEnd}</p>
        <p className="mt-[4%] text-ink/55" style={{ fontSize: Math.max(9, W * 0.03), letterSpacing: '0.14em' }}>
          {count} {t.photographs}
        </p>
        <span className="mt-[8%] block h-px bg-ink/15" style={{ width: W * 0.08 }} />
        <p className="mt-[5%] text-ink/40" style={{ fontSize: Math.max(8, W * 0.022), letterSpacing: '0.16em' }}>
          {t.colophon.toUpperCase()}
        </p>
        <p className="mt-[2%] text-ink/70" style={{ fontFamily: font.family, fontSize: Math.max(12, W * 0.045) }}>
          {t.studio}
        </p>
      </div>
    </div>
  )
}

/** One half of a photo spread. The full 2W layout is drawn and clipped, so panoramas run across the gutter. */
function PhotoHalf({ spread, n, side, spec, W, H, view, onCell }: { spread: PhotoSpread; n: number; side: 'left' | 'right'; spec: AlbumSpec; W: number; H: number; view: View | null; onCell: (i: number) => void }) {
  const matte = spec.paper === 'matte'
  const filter = matte ? 'contrast(0.95) saturate(0.93)' : spec.paper === 'metallic' ? 'contrast(1.05) saturate(1.08)' : undefined
  const focused = view && view.focus >= 0 && view.focus < spread.cells.length ? view.focus : -1
  return (
    <div className="absolute inset-0 bg-white">
      <div className="absolute inset-0 opacity-[0.07] mix-blend-multiply" style={{ backgroundImage: GRAIN, backgroundSize: '120px' }} />
      <div className="absolute top-0" style={{ left: side === 'left' ? 0 : -W, width: 2 * W, height: H }}>
        {spread.cells.map(([x, y, w, h], i) => {
          const big = w >= 40 || h >= 60
          const k = spread.photos[i]
          if (!k) return null
          return (
            <button
              key={i}
              type="button"
              disabled={!view}
              tabIndex={view ? 0 : -1}
              onClick={() => onCell(i)}
              aria-label={`${n}.${i + 1}`}
              className={`absolute overflow-hidden bg-ink/5 ${view ? 'cursor-pointer' : 'cursor-default'}`}
              style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%`, boxShadow: focused === i ? '0 0 0 2px rgba(155,17,30,0.6)' : '0 1px 2px rgba(0,0,0,0.08)', transition: 'box-shadow 0.4s' }}
            >
              <img src={photoUrl(k, big ? 1400 : 900)} alt="" draggable={false} className="h-full w-full object-cover" style={{ filter }} loading="eager" decoding="async" />
              {spec.paper !== 'matte' && <span className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(125deg, transparent 40%, rgba(255,255,255,0.14) 52%, transparent 64%)' }} />}
            </button>
          )
        })}
      </div>
      {/* page number */}
      <span className={`pointer-events-none absolute bottom-[2.2%] font-display italic text-ink/35 ${side === 'left' ? 'left-[3.5%]' : 'right-[3.5%]'}`} style={{ fontSize: Math.max(8, W * 0.022) }}>
        {String(side === 'left' ? n * 2 - 1 : n * 2).padStart(2, '0')}
      </span>
      {spec.paper === 'metallic' && <div className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(120deg, rgba(255,255,255,0) 30%, rgba(255,240,244,0.22) 50%, rgba(255,255,255,0) 70%)', mixBlendMode: 'screen' }} />}
    </div>
  )
}

/** Launcher card: the closed album resting on the table, shown on the e-album page before the viewer opens. */
export function EAlbumPoster({ spec, photo, children, className = '' }: { spec: AlbumSpec; photo?: ImgKey; children?: ReactNode; className?: string }) {
  const color = colorOf(spec.color)
  const font = fontOf(spec.font)
  const ink = spec.cover === 'acrylic' ? '#fff' : color.ink
  return (
    <div className={`relative isolate overflow-hidden rounded-[28px] sm:rounded-[32px] ${className}`} style={{ background: `radial-gradient(80% 70% at 50% 40%, ${shade(color.hex, -0.55)} 0%, #121214 55%, #060607 100%)` }}>
      <div className="pointer-events-none absolute inset-0 opacity-[0.35] mix-blend-soft-light" style={{ backgroundImage: GRAIN, backgroundSize: '220px' }} />
      <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: 1400 }}>
        <motion.div
          className="relative h-[62%] overflow-hidden rounded-[3px_6px_6px_3px] shadow-[0_40px_60px_-20px_rgba(0,0,0,0.8)]"
          style={{ aspectRatio: (SIZE_RATIO[spec.size] ?? SIZE_RATIO['12x30']).ratio, transformStyle: 'preserve-3d' }}
          initial={{ rotateX: 40, rotateZ: -6, y: 10 }}
          animate={{ rotateX: [40, 36, 40], y: [10, 2, 10] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Surface cover={spec.cover} hex={color.hex} photo={photo}>
            <div className={`absolute inset-0 flex flex-col items-center px-[10%] text-center ${spec.cover === 'acrylic' ? 'justify-end pb-[11%]' : 'justify-center'}`}>
              <p className="max-w-full break-words text-[clamp(14px,2.6vw,26px)] leading-[1.1]" style={{ fontFamily: font.family, fontStyle: font.italic ? 'italic' : 'normal', color: ink }}>
                {spec.title || '—'}
              </p>
            </div>
          </Surface>
        </motion.div>
      </div>
      {children}
    </div>
  )
}
