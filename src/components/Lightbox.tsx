import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router'
import { AnimatePresence, motion, type PanInfo } from 'motion/react'
import { useLenis } from 'lenis/react'
import { Icon } from './Icon'
import { EASE } from './motion'
import { Kolam } from './tamil'
import { photoUrl, type ImgKey } from '../lib/images'
import { useLang, type Bi } from '../lib/i18n'
import { useStore } from '../lib/store'
import { toast } from '../lib/ui'

export interface LightboxItem {
  id: string
  k?: ImgKey
  url?: string
  title: Bi
  meta?: Bi
  story?: { slug: string; title: Bi }
  bookHref?: string
}

const copy = {
  close: { en: 'Close', ta: 'மூடு' },
  prev: { en: 'Previous', ta: 'முந்தையது' },
  next: { en: 'Next', ta: 'அடுத்தது' },
  share: { en: 'Copy link', ta: 'இணைப்பை நகலெடு' },
  copied: { en: 'Link copied', ta: 'இணைப்பு நகலெடுக்கப்பட்டது' },
  save: { en: 'Save to moodboard', ta: 'மனப்பலகையில் சேர்' },
  saved: { en: 'Saved to your moodboard', ta: 'உங்கள் மனப்பலகையில் சேர்க்கப்பட்டது' },
  fullscreen: { en: 'Full screen', ta: 'முழுத் திரை' },
  story: { en: 'View the full story', ta: 'முழுக் கதையைப் பார்க்க' },
  book: { en: 'Book this look', ta: 'இந்த பாணியில் பதிவு' },
}

const src = (item: LightboxItem, w: number) => (item.k ? photoUrl(item.k, w, undefined, 80) : item.url ?? '')

/**
 * Full-screen viewer. Arrow keys / swipe to move, Esc to close. The current
 * photo is echoed as a heavily blurred ambient backdrop, Apple TV style.
 */
export function Lightbox({ items, index, onIndex, onClose, shareUrl }: { items: LightboxItem[]; index: number | null; onIndex: (i: number) => void; onClose: () => void; shareUrl?: (item: LightboxItem) => string }) {
  const lang = useLang()
  const lenis = useLenis()
  const mood = useStore(s => s.moodboard)
  const toggleMood = useStore(s => s.toggleMood)
  const [dir, setDir] = useState(0)
  const [chrome, setChrome] = useState(true)
  const stripRef = useRef<HTMLDivElement>(null)
  const open = index !== null && items.length > 0
  const item = open ? items[Math.min(index, items.length - 1)] : null

  const go = useCallback(
    (delta: number) => {
      if (index === null) return
      setDir(delta)
      onIndex((index + delta + items.length) % items.length)
    },
    [index, items.length, onIndex],
  )

  useEffect(() => {
    if (!open) return
    lenis?.stop()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      lenis?.start()
      window.removeEventListener('keydown', onKey)
    }
  }, [open, go, onClose, lenis])

  // Keep the active thumbnail in view and warm the neighbours' cache.
  useEffect(() => {
    if (index === null) return
    stripRef.current?.querySelector<HTMLElement>(`[data-i="${index}"]`)?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    for (const d of [1, -1, 2]) {
      const n = items[(index + d + items.length) % items.length]
      if (n) new Image().src = src(n, 1800)
    }
  }, [index, items])

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -80 || info.velocity.x < -400) go(1)
    else if (info.offset.x > 80 || info.velocity.x > 400) go(-1)
    else if (info.offset.y > 140) onClose()
  }

  const share = async () => {
    if (!item) return
    const url = shareUrl ? shareUrl(item) : window.location.href
    try {
      await navigator.clipboard.writeText(url)
      toast(copy.copied[lang])
    } catch {
      /* clipboard unavailable */
    }
  }

  const saved = item ? mood.includes(item.id) : false

  return createPortal(
    <AnimatePresence>
      {open && item && (
        <motion.div
          className="fixed inset-0 z-[85] flex flex-col bg-ink text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          role="dialog"
          aria-modal="true"
          aria-label={item.title[lang]}
        >
          {/* Ambient backdrop */}
          <AnimatePresence initial={false}>
            <motion.img
              key={item.id + '-bg'}
              src={src(item, 200)}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover blur-[70px] saturate-150"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.45 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
            />
          </AnimatePresence>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/60 via-ink/30 to-ink/80" />

          {/* Top bar */}
          <motion.div animate={{ opacity: chrome ? 1 : 0, y: chrome ? 0 : -20 }} className="relative z-10 flex items-center justify-between gap-3 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:p-5">
            <div className="glass-dark flex h-11 items-center gap-3 rounded-full px-4 text-sm">
              <span className="font-semibold tabular-nums">{String((index ?? 0) + 1).padStart(2, '0')}</span>
              <span className="h-3 w-px bg-white/25" />
              <span className="tabular-nums text-white/55">{String(items.length).padStart(2, '0')}</span>
            </div>
            <div className="glass-dark flex h-11 items-center gap-1 rounded-full px-1.5">
              <ToolButton label={copy.save[lang]} onClick={() => { toggleMood(item.id); if (!saved) toast(copy.saved[lang], 'ruby') }}>
                <Icon name="heart" size={18} className={saved ? 'fill-ruby text-ruby' : ''} />
              </ToolButton>
              <ToolButton label={copy.share[lang]} onClick={share}><Icon name="share" size={18} /></ToolButton>
              <ToolButton label={copy.fullscreen[lang]} onClick={() => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.())} className="hidden sm:flex">
                <Icon name="maximize" size={18} />
              </ToolButton>
              <ToolButton label={copy.close[lang]} onClick={onClose} className="!h-10 !w-10 md:!h-9 md:!w-9"><Icon name="x" size={19} /></ToolButton>
            </div>
          </motion.div>

          {/* Stage */}
          <div className="relative z-0 flex min-h-0 flex-1 items-center justify-center px-2 md:px-20" onClick={() => setChrome(c => !c)}>
            <AnimatePresence initial={false} custom={dir} mode="popLayout">
              <motion.img
                key={item.id}
                src={src(item, 1800)}
                srcSet={item.k ? `${src(item, 1000)} 1000w, ${src(item, 1800)} 1800w, ${src(item, 2600)} 2600w` : undefined}
                sizes="100vw"
                alt={item.title[lang]}
                custom={dir}
                variants={{
                  enter: (d: number) => ({ opacity: 0, x: d * 120, scale: 0.96, filter: 'blur(10px)' }),
                  center: { opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' },
                  exit: (d: number) => ({ opacity: 0, x: d * -120, scale: 0.96, filter: 'blur(10px)' }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.6, ease: EASE }}
                drag
                dragSnapToOrigin
                dragElastic={0.25}
                onDragEnd={onDragEnd}
                className="max-h-full max-w-full cursor-grab select-none rounded-lg object-contain shadow-[0_40px_120px_-20px_rgba(0,0,0,0.8)] active:cursor-grabbing"
                draggable={false}
                onClick={e => e.stopPropagation()}
              />
            </AnimatePresence>

            <NavArrow side="left" label={copy.prev[lang]} onClick={() => go(-1)} visible={chrome} />
            <NavArrow side="right" label={copy.next[lang]} onClick={() => go(1)} visible={chrome} />
          </div>

          {/* Caption + filmstrip */}
          <motion.div animate={{ opacity: chrome ? 1 : 0, y: chrome ? 0 : 30 }} className="relative z-10 flex flex-col gap-3 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:p-5">
            <div className="glass-dark mx-auto flex w-full max-w-4xl flex-col gap-3 rounded-3xl p-3.5 md:flex-row md:p-4 md:items-center md:justify-between md:gap-6 md:px-6">
              <AnimatePresence mode="wait">
                <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35 }} className="flex min-w-0 items-center gap-3">
                  {lang === 'ta' && <Kolam size={30} animate={false} className="hidden shrink-0 text-ruby-bright sm:block" strokeWidth={2.4} />}
                  <div className="min-w-0">
                    <p className="line-clamp-2 font-display text-xl leading-tight md:line-clamp-none md:text-2xl">{item.title[lang]}</p>
                    {item.meta && <p className="mt-0.5 truncate text-[13px] text-white/55">{item.meta[lang]}</p>}
                  </div>
                </motion.div>
              </AnimatePresence>
              <div className="flex shrink-0 gap-2 md:flex-wrap">
                {item.story && (
                  <Link to={`/gallery/${item.story.slug}`} onClick={onClose} className="inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-full text-center leading-tight border border-white/20 px-4 md:flex-none text-[13px] font-medium transition hover:border-white/50">
                    {copy.story[lang]} <Icon name="arrowRight" size={15} />
                  </Link>
                )}
                <Link to={item.bookHref ?? '/book'} onClick={onClose} className="inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-full text-center leading-tight bg-ruby px-4 md:flex-none text-[13px] font-semibold transition hover:bg-ruby-bright">
                  {copy.book[lang]} <Icon name="arrowUpRight" size={15} />
                </Link>
              </div>
            </div>

            <div ref={stripRef} className="no-scrollbar mx-auto flex max-w-full gap-1.5 overflow-x-auto px-1 pb-1" data-lenis-prevent>
              {items.map((it, i) => (
                <button
                  key={it.id}
                  data-i={i}
                  type="button"
                  onClick={() => { setDir(i > (index ?? 0) ? 1 : -1); onIndex(i) }}
                  aria-label={it.title[lang]}
                  className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-lg transition-all duration-300 cursor-pointer md:h-14 md:w-14 ${i === index ? 'opacity-100 ring-2 ring-ruby ring-offset-2 ring-offset-ink' : 'opacity-40 hover:opacity-80'}`}
                >
                  <img src={it.k ? photoUrl(it.k, 120, 120) : it.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

function ToolButton({ children, label, onClick, className = '' }: { children: React.ReactNode; label: string; onClick: () => void; className?: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className={`flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white cursor-pointer ${className}`}>
      {children}
    </button>
  )
}

function NavArrow({ side, label, onClick, visible }: { side: 'left' | 'right'; label: string; onClick: () => void; visible: boolean }) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={e => { e.stopPropagation(); onClick() }}
      animate={{ opacity: visible ? 1 : 0 }}
      className={`glass-dark absolute top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full transition hover:bg-white/15 cursor-pointer md:flex ${side === 'left' ? 'left-5' : 'right-5'}`}
    >
      <Icon name={side === 'left' ? 'chevronLeft' : 'chevronRight'} size={22} />
    </motion.button>
  )
}
