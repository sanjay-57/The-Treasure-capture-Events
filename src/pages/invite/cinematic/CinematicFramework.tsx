import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Icon, type IconName } from "../../../components/Icon"
import { LangToggle } from "../../../components/layout/Nav"
import { directionsUrl, rsvpUrl, type Invite } from "../../../lib/invite"
import { FORTUNES, nextFortune } from "../../../lib/fortunes"
import type { Lang } from "../../../lib/i18n"
import type { SceneState } from "./types"

const copy = {
  open: { en: "Open invitation", ta: "அழைப்பிதழைத் திறக்க" },
  tapPrompt: { en: "Tap ceremonial latch to open", ta: "திறக்க பூட்டைத் தொடவும்" },
  skip: { en: "Skip animation", ta: "தவிர்க்க" },
  replay: { en: "Replay reveal", ta: "மீண்டும் பார்க்க" },
  directions: { en: "Directions", ta: "வழி" },
  rsvp: { en: "RSVP", ta: "வருகை" },
  map: { en: "Map & QR", ta: "வரைபடம்" },
  cookie: { en: "A fortune for you", ta: "உங்களுக்கு ஒரு வாழ்த்துச் சீட்டு" },
  cookieBtn: { en: "Fortune", ta: "வாழ்த்து" },
  tapCookie: { en: "Tap the cookie", ta: "பிஸ்கட்டைத் தொடுங்கள்" },
  another: { en: "Another cookie", ta: "இன்னொரு பிஸ்கட்" },
  share: { en: "Share", ta: "பகிர்" },
  close: { en: "Close", ta: "மூடு" },
  sample: { en: "Sample invite", ta: "மாதிரி அழைப்பிதழ்" },
}

interface FrameworkProps {
  invite: Invite
  lang: Lang
  title: string
  subtitle?: string
  accentColor: string
  sample?: boolean
  size?: { w: number; h: number }
  still?: boolean
  share?: ReactNode
  onReady?: () => void
  revealDuration?: number
  renderScene: (params: {
    state: SceneState
    onTriggerOpen: () => void
    parallax: { x: number; y: number }
    reducedMotion: boolean
  }) => ReactNode
}

/** Local storage for fortunes viewed */
const fortuneStore = {
  read(): { seed: number; seen: number[] } {
    try {
      const raw = JSON.parse(localStorage.getItem("ttc-fortunes") ?? "null")
      if (raw && typeof raw.seed === "number" && Array.isArray(raw.seen))
        return raw
    } catch {
      /* storage blocked */
    }
    return { seed: Math.floor(Math.random() * 1e9), seen: [] }
  },
  write(v: { seed: number; seen: number[] }) {
    try {
      localStorage.setItem("ttc-fortunes", JSON.stringify(v))
    } catch {
      /* storage blocked */
    }
  },
}

export function CinematicFramework({
  invite,
  lang,
  title,
  subtitle,
  accentColor,
  sample = false,
  size,
  still = false,
  share,
  onReady,
  revealDuration,
  renderScene,
}: FrameworkProps) {
  const t = Object.fromEntries(
    Object.entries(copy).map(([k, v]) => [k, v[lang]]),
  ) as Record<keyof typeof copy, string>

  const prefersReduced = useReducedMotion()
  const reduce = prefersReduced || still

  // State: closed -> opening -> opened
  // If reduced motion or still mode, start directly in 'opened'
  const [state, setState] = useState<SceneState>(() =>
    reduce || size ? "opened" : "closed",
  )
  const [sheet, setSheet] = useState<"map" | "cookie" | "share" | null>(null)

  // Subtle pointer parallax on desktop
  const [parallax, setParallax] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  })
  const stageRef = useRef<HTMLDivElement>(null)

  const handlePointerMove = (e: React.PointerEvent) => {
    if (reduce || still || !stageRef.current) return
    const rect = stageRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const x = Math.max(-1, Math.min(1, (e.clientX - cx) / (rect.width / 2)))
    const y = Math.max(-1, Math.min(1, (e.clientY - cy) / (rect.height / 2)))
    setParallax({ x, y })
  }

  const handlePointerLeave = () => {
    setParallax({ x: 0, y: 0 })
  }

  // Handle open trigger
  const triggerOpen = () => {
    if (state !== "closed") return
    if (reduce) {
      setState("opened")
      return
    }
    setState("opening")
    // Choreographed sequence duration, then enters 'opened'
    const duration = revealDuration ?? 3800
    window.setTimeout(() => {
      setState("opened")
    }, duration)
  }

  const skipAnimation = () => {
    setState("opened")
  }

  const replay = () => {
    setState("closed")
  }

  useEffect(() => {
    if (still || onReady) {
      const id = window.setTimeout(() => onReady?.(), 400)
      return () => window.clearTimeout(id)
    }
  }, [still, onReady])

  // Responsive stage sizing
  const rootStyle: CSSProperties = size
    ? { width: size.w, height: size.h }
    : { width: "100%", height: "100svh" }
  const stageW = size ? "100%" : "min(100vw, 68svh)"

  return (
    <div
      ref={stageRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative isolate overflow-hidden bg-[#0A0807] text-[#FAF8F5] select-none"
      style={{
        ...rootStyle,
        perspective: "1200px",
        WebkitPerspective: "1200px",
      }}
    >
      {/* 3D Scene Viewport */}
      <div
        className="absolute inset-y-0 left-1/2 -translate-x-1/2 flex items-center justify-center"
        style={{
          width: stageW,
          containerType: "size",
          transformStyle: "preserve-3d",
          WebkitTransformStyle: "preserve-3d",
        }}
      >
        {renderScene({
          state,
          onTriggerOpen: triggerOpen,
          parallax,
          reducedMotion: !!reduce,
        })}
      </div>

      {/* Top Header Chrome */}
      {!size && !still && (
        <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+14px)]">
          <div className="flex items-center gap-2">
            {sample && (
              <span className="rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[10.5px] uppercase tracking-[0.18em] text-white/80 backdrop-blur-md">
                {t.sample}
              </span>
            )}
            {/* Skip animation button */}
            {state !== "opened" && (
              <button
                type="button"
                onClick={skipAnimation}
                className="flex items-center gap-1.5 rounded-full border border-white/20 bg-black/50 px-3.5 py-1 text-[11.5px] font-medium text-white/90 backdrop-blur-md transition hover:bg-black/70 hover:border-white/40 focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <Icon name="arrowRight" size={13} />
                <span>{t.skip}</span>
              </button>
            )}
            {/* Replay action */}
            {state === "opened" && !reduce && (
              <button
                type="button"
                onClick={replay}
                className="flex items-center gap-1.5 rounded-full border border-white/20 bg-black/50 px-3 py-1 text-[11.5px] font-medium text-white/80 backdrop-blur-md transition hover:bg-black/70 hover:border-white/40 focus-visible:ring-2 focus-visible:ring-amber-400"
                title={t.replay}
              >
                <Icon name="clock" size={13} />
                <span>{t.replay}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <LangToggle dark={true} />
          </div>
        </header>
      )}

      {/* Bottom Action Bar (in Opened State) */}
      {!still && (
        <AnimatePresence>
          {state === "opened" && (
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="absolute inset-x-0 bottom-0 z-30 flex flex-col items-center gap-2 px-4 pb-[calc(env(safe-area-inset-bottom)+18px)]"
            >
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <a
                  href={directionsUrl(invite)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-11 items-center gap-2 rounded-full px-5 text-[13px] font-semibold text-[#0B0D14] shadow-lg shadow-black/40 transition hover:brightness-110 active:scale-95"
                  style={{ background: accentColor }}
                >
                  <Icon name="arrowUpRight" size={15} />
                  <span>{t.directions}</span>
                </a>

                {rsvpUrl(invite, lang) && (
                  <a
                    href={rsvpUrl(invite, lang)!}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-11 items-center gap-2 rounded-full border border-white/20 bg-black/60 px-4 text-[13px] font-medium text-white backdrop-blur-md transition hover:bg-black/80 hover:border-white/40 active:scale-95"
                  >
                    <Icon name="whatsapp" size={15} />
                    <span>{t.rsvp}</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setSheet("map")}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-md transition hover:bg-black/80 hover:border-white/40 active:scale-95"
                  title={t.map}
                  aria-label={t.map}
                >
                  <Icon name="mapPin" size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => setSheet("cookie")}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/60 text-amber-300 backdrop-blur-md transition hover:bg-black/80 hover:border-white/40 active:scale-95"
                  title={t.cookieBtn}
                  aria-label={t.cookieBtn}
                >
                  <Icon name="sparkle" size={16} />
                </button>

                {share && (
                  <button
                    type="button"
                    onClick={() => setSheet("share")}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-md transition hover:bg-black/80 hover:border-white/40 active:scale-95"
                    title={t.share}
                    aria-label={t.share}
                  >
                    <Icon name="share" size={16} />
                  </button>
                )}
              </div>

              <p className="text-[11px] font-medium tracking-wide text-white/50">
                The Treasure Capture Events · Madurai
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Sheets: Map, Fortune Cookie, Share */}
      <AnimatePresence>
        {sheet && (
          <SheetModal
            onClose={() => setSheet(null)}
            label={
              sheet === "map" ? t.map : sheet === "cookie" ? t.cookie : t.share
            }
            closeLabel={t.close}
            accentColor={accentColor}
          >
            {sheet === "map" && <MapModalContent invite={invite} lang={lang} />}
            {sheet === "cookie" && (
              <FortuneModalContent
                lang={lang}
                labels={t}
                accentColor={accentColor}
              />
            )}
            {sheet === "share" && share}
          </SheetModal>
        )}
      </AnimatePresence>
    </div>
  )
}

function SheetModal({
  onClose,
  label,
  closeLabel,
  accentColor,
  children,
}: {
  onClose: () => void
  label: string
  closeLabel: string
  accentColor: string
  children: ReactNode
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-end justify-center"
    >
      <button
        type="button"
        aria-label={closeLabel}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-default"
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative max-h-[88%] w-full max-w-[500px] overflow-y-auto rounded-t-[28px] bg-[#141210] border-t border-white/10 px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-3 text-[#FAF8F5]"
        data-lenis-prevent
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
        <div className="mb-3 flex items-center justify-between">
          <p
            className="text-[12px] font-semibold uppercase tracking-[0.25em]"
            style={{ color: accentColor }}
          >
            {label}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 transition cursor-pointer"
            aria-label={closeLabel}
          >
            <Icon name="x" size={15} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}

function MapModalContent({ invite, lang }: { invite: Invite; lang: Lang }) {
  const where =
    invite.lat && invite.lng
      ? `${invite.lat},${invite.lng}`
      : encodeURIComponent(invite.venue)
  const embedUrl = `https://www.google.com/maps?q=${where}&output=embed`

  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="relative h-60 w-full overflow-hidden rounded-2xl border border-white/10">
        <iframe
          title="Venue Map"
          src={embedUrl}
          className="h-full w-full border-0"
          loading="lazy"
        />
      </div>
      <div className="flex items-center justify-between gap-3 text-left">
        <div>
          <h4 className="font-semibold text-white/95">{invite.venue}</h4>
          {invite.address && (
            <p className="text-[12px] text-white/60">{invite.address}</p>
          )}
        </div>
        <a
          href={directionsUrl(invite)}
          target="_blank"
          rel="noreferrer"
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-amber-400 px-4 py-2 text-[12px] font-semibold text-black hover:brightness-110"
        >
          <Icon name="arrowUpRight" size={14} />
          <span>{lang === "ta" ? "வழி காண்க" : "Open in Maps"}</span>
        </a>
      </div>
    </div>
  )
}

function FortuneModalContent({
  lang,
  labels,
  accentColor,
}: {
  lang: Lang
  labels: Record<string, string>
  accentColor: string
}) {
  const [index, setIndex] = useState<number | null>(() => {
    const s = fortuneStore.read()
    const r = nextFortune(s.seen, s.seed)
    fortuneStore.write({ seed: s.seed, seen: r.seen })
    return r.index
  })

  const rollAnother = () => {
    const s = fortuneStore.read()
    const r = nextFortune(s.seen, s.seed)
    fortuneStore.write({ seed: s.seed, seen: r.seen })
    setIndex(r.index)
  }

  const f = index !== null ? FORTUNES[index] : null
  const otherLang = lang === "ta" ? "en" : "ta"

  return (
    <div className="py-4 text-center">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-amber-400/10 text-amber-300">
        <Icon name="sparkle" size={32} />
      </div>

      {f && (
        <div className="mx-auto max-w-sm rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md">
          <p
            className={
              lang === "ta"
                ? "font-['Noto_Serif_Tamil'] text-[17px] leading-relaxed text-white/95"
                : "font-serif text-[20px] italic leading-snug text-white/95"
            }
          >
            "{f[lang]}"
          </p>
          <p className="mt-2 text-[12.5px] text-white/55">{f[otherLang]}</p>
        </div>
      )}

      <button
        type="button"
        onClick={rollAnother}
        className="mt-5 rounded-full border border-white/20 bg-white/[0.06] px-5 py-2 text-[12.5px] font-medium text-white/90 hover:bg-white/15 transition cursor-pointer"
      >
        {labels.another}
      </button>
    </div>
  )
}
