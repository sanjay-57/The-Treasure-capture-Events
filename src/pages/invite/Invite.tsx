import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"
import { useLocation, useParams } from "react-router"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Icon, type IconName } from "../../components/Icon"
import { Qr } from "../../components/Qr"
import { LangToggle } from "../../components/layout/Nav"
import { useLang, type Lang } from "../../lib/i18n"
import {
  countdown,
  dateParts,
  decodeInvite,
  directionsUrl,
  inviteDay,
  isPremium,
  mapEmbedUrl,
  rsvpUrl,
  timeLabel,
  toTheme,
  type Invite,
  type InviteTheme,
} from "../../lib/invite"
import { FORTUNES, nextFortune } from "../../lib/fortunes"
import { ShareSheet } from "./ShareSheet"
import {
  GRID,
  PATTERN_MASK,
  artUrl,
  ensureFonts,
  foilCss,
  fxParticles,
  svgUrl,
  textureUrl,
  themeFonts,
  themeStyle,
  type ThemeStyle,
} from "./themes"
import { coupleUrl } from "./caricature"
import { StoryInvite, StoryThumb } from "./story/StoryInvite"
import { isStoryTheme, sheetStyle, storyTheme } from "./story/theme"
import { CinematicInvite, isCinematicTheme } from "./cinematic"

/*
 * The invite page (roadmap 6.6). Links open the story page (story/): an
 * opening ritual, then a scrolling page. Below is the classic single-screen
 * card, used by the classic designs' card layout and their PNG: one screen, no scrolling. Names, the date,
 * the venue, a live countdown and the actions (directions, RSVP, map & QR,
 * fortune cookie, share) all fit the phone; the map, the cookie and sharing
 * open as sheets over it. The fortune cookie greets every guest: it opens and
 * cracks by itself just after the invite (or its sealed cover) opens. Every size is in container units of the "stage" (a
 * phone-shaped column, full width on phones), so the same layout fits a real
 * phone, the builder's preview and the 1080-wide PNG. The look of each design
 * comes from `themes.ts`. Premium designs open from a sealed cover and put the
 * couple's caricature (our illustrated couple until theirs is ready) on top.
 */

const SAMPLE: Invite = {
  en: ["Meera", "Arjun"],
  ta: ["மீரா", "அர்ஜுன்"],
  parents: {
    en: "With the blessings of the Sundaram and Raghavan families",
    ta: "சுந்தரம், ராகவன் குடும்பத்தினரின் ஆசியுடன்",
  },
  date: "2027-02-14",
  time: "06:30",
  venue: "Sri Meenakshi Mahal",
  address: "Madurai Main, Madurai 625001",
  lat: 9.9195,
  lng: 78.1193,
  phone: "9876543210",
  theme: "lantern",
}

const copy = {
  weds: { en: "weds", ta: "திருமணம்" },
  muhurtham: { en: "Muhurtham", ta: "முகூர்த்தம்" },
  days: { en: "days", ta: "நாள்" },
  hours: { en: "hrs", ta: "மணி" },
  minutes: { en: "min", ta: "நிமி" },
  seconds: { en: "sec", ta: "விநா" },
  married: { en: "Just married", ta: "திருமணம் நடந்தேறியது" },
  venue: { en: "Venue", ta: "இடம்" },
  directions: { en: "Directions", ta: "வழி" },
  rsvp: { en: "RSVP", ta: "வருகை" },
  map: { en: "Map & QR", ta: "வரைபடம்" },
  scan: { en: "Scan for directions", ta: "வழிக்கு ஸ்கேன் செய்யுங்கள்" },
  cookie: { en: "A fortune for you", ta: "உங்களுக்கு ஒரு வாழ்த்துச் சீட்டு" },
  cookieBtn: { en: "Fortune", ta: "வாழ்த்து" },
  tap: { en: "Tap the cookie", ta: "பிஸ்கட்டைத் தொடுங்கள்" },
  another: { en: "Another cookie", ta: "இன்னொரு பிஸ்கட்" },
  share: { en: "Share", ta: "பகிர்" },
  close: { en: "Close", ta: "மூடு" },
  caricature: { en: "Caricature of the couple", ta: "மணமக்களின் கேரிகேச்சர்" },
  broken: {
    en: "This invite link looks damaged. Ask the couple to send it again.",
    ta: "இந்த அழைப்பிதழ் இணைப்பு சரியாக இல்லை. மீண்டும் அனுப்பச் சொல்லுங்கள்.",
  },
  sample: { en: "Sample invite", ta: "மாதிரி அழைப்பிதழ்" },
  mapTap: { en: "Tap to move the map", ta: "வரைபடத்தை நகர்த்தத் தொடுங்கள்" },
  invited: { en: "You are invited", ta: "அன்புடன் அழைக்கிறோம்" },
  open: { en: "Tap to open", ta: "திறக்கத் தொடுங்கள்" },
}

export type Labels = Record<keyof typeof copy, string>
export const labels = (lang: Lang) =>
  Object.fromEntries(
    Object.entries(copy).map(([k, v]) => [k, v[lang]]),
  ) as Labels

/** Per-device seed and seen list, wrapped so a private window still works. */
const store = {
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

export default function InvitePage() {
  const lang = useLang()
  const { theme } = useParams()
  const { hash, search } = useLocation()
  const payload = hash.replace(/^#/, "")
  // The sample (no payload) can be opened in any layout: /i/lotus?layout=cinematic
  const sampleLayout = new URLSearchParams(search).get("layout")
  const invite = useMemo(
    () =>
      payload
        ? decodeInvite(payload)
        : {
            ...SAMPLE,
            theme: toTheme(theme) ?? SAMPLE.theme,
            layout: sampleLayout === "card" || sampleLayout === "cinematic" ? sampleLayout : SAMPLE.layout,
          },
    [payload, theme, sampleLayout],
  )
  const t = labels(lang)

  useEffect(() => {
    if (!invite) return
    document.title = `${invite[lang][0]} & ${invite[lang][1]}`
    // OG tags from the payload, for previews that run scripts.
    const set = (p: string, c: string) => {
      let m = document.head.querySelector<HTMLMetaElement>(
        `meta[property="${p}"]`,
      )
      if (!m) {
        m = document.createElement("meta")
        m.setAttribute("property", p)
        document.head.appendChild(m)
      }
      m.content = c
    }
    set("og:title", `${invite.en[0]} weds ${invite.en[1]}`)
    set("og:description", `${inviteDay(invite.date, "en")} · ${invite.venue}`)
  }, [invite, lang])

  if (!invite) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-[#0b0d14] px-6 text-center text-white/75">
        {t.broken}
      </div>
    )
  }
  // Story pages (and story designs' cards) colour their sheets from the story theme.
  const s =
    invite.layout === "card" && !isStoryTheme(invite.theme)
      ? themeStyle(invite.theme)
      : sheetStyle(storyTheme(invite.theme))
  return (
    <InviteView
      invite={invite}
      lang={lang}
      sample={!payload}
      share={
        <ShareSheet
          invite={invite}
          url={window.location.href}
          lang={lang}
          art={invite.caricature}
          palette={{
            accent: s.accent,
            onAccent: s.onAccent,
            ink: sheetInk(s),
            line: sheetLine(s),
          }}
        />
      }
    />
  )
}

// Sheets sit on white (light designs) or near-black (dark designs).
const sheetInk = (s: ThemeStyle) => (s.dark ? "#f6f3ee" : "#1c1a18")
const sheetLine = (s: ThemeStyle) =>
  s.dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.14)"

/** Font size that follows the stage's height but never outgrows its width. */
const fs = (h: number, w = h * 1.9): string => `min(${h}cqh, ${w}cqw)`

/**
 * The invite itself, for the page, the builder's preview (`size`) and the PNG
 * (`size` + `still`, which drops motion, the cover and the sheets and prints the
 * directions QR in place of the buttons). `art` overrides the caricature.
 */
export function InviteView({
  invite,
  lang,
  sample = false,
  size,
  still = false,
  art,
  share,
  onReady,
  /** Fixed size (builder preview, PNG); the page fills the screen. */
  /** The share buttons, shown in the share sheet (page only). */
  /** Called once the design's fonts are in (the PNG waits for it). */
}: {
  invite: Invite
  lang: Lang
  sample?: boolean
  size?: { w: number; h: number }
  still?: boolean
  art?: string
  share?: ReactNode
  onReady?: () => void
}) {
  const props = { invite, lang, sample, size, still, art, share, onReady }
  // The 3D scene, where the design has one; its PNG is the story card below.
  if (invite.layout === "cinematic" && !still && isCinematicTheme(invite.theme))
    return <CinematicInvite theme={invite.theme} {...props} />
  // The story page serves every design; the still card is drawn per design (classic) or by the story module.
  if (!(still || invite.layout === "card") || isStoryTheme(invite.theme))
    return <StoryInvite {...props} />
  return <ClassicInvite {...props} />
}

function ClassicInvite({
  invite,
  lang,
  sample = false,
  size,
  still = false,
  art,
  share,
  onReady,
}: {
  invite: Invite
  lang: Lang
  sample?: boolean
  size?: { w: number; h: number }
  still?: boolean
  art?: string
  share?: ReactNode
  onReady?: () => void
}) {
  const t = labels(lang)
  const s = themeStyle(invite.theme)
  const reduce = useReducedMotion() || still
  const premium = isPremium(invite.theme)
  const own = premium ? art || invite.caricature : undefined
  const pic = premium ? own || coupleUrl(s.accent) : undefined
  const [sealed, setSealed] = useState(premium && !size && !still)
  const [sheet, setSheet] = useState<"map" | "cookie" | "share" | null>(null)

  // Guests are greeted with a fortune: the cookie pops open by itself once the invite (or its cover) opens.
  const greeted = useRef(false)
  useEffect(() => {
    if (size || still || sealed || greeted.current) return
    greeted.current = true
    const id = window.setTimeout(() => setSheet((x) => x ?? "cookie"), 1400)
    return () => window.clearTimeout(id)
  }, [size, still, sealed])

  useEffect(() => {
    let live = true
    void ensureFonts(themeFonts(s)).then(() => {
      if (live) onReady?.()
    })
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invite.theme])

  const enter = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 14 },
          animate: { opacity: 1, y: 0 },
          transition: { delay, duration: 1, ease: [0.22, 1, 0.36, 1] as const },
        }

  // The stage: phone-shaped column, full width on phones, centred on wide screens.
  const rootStyle: CSSProperties = size
    ? { width: size.w, height: size.h }
    : { width: "100%", height: "100svh" }
  const stageW = size ? "100%" : "min(100vw, 62svh)"

  return (
    <div
      className="relative isolate overflow-hidden"
      style={{ ...rootStyle, background: s.base, color: s.ink }}
    >
      <Backdrop s={s} still={still} />
      {s.layout === "split" && s.split && (
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[52%]"
          style={{ background: s.split.bg }}
        />
      )}

      <div
        className="absolute inset-y-0 left-1/2 -translate-x-1/2"
        style={{ width: stageW, containerType: "size" }}
      >
        <StageArt s={s} still={still} />
        {s.layout === "split" ? (
          <SplitLayout
            invite={invite}
            lang={lang}
            s={s}
            t={t}
            pic={pic}
            stock={!own}
            enter={enter}
          />
        ) : (
          <MainLayout
            invite={invite}
            lang={lang}
            s={s}
            t={t}
            pic={pic}
            stock={!own}
            enter={enter}
          />
        )}
        <ActionBar
          invite={invite}
          lang={lang}
          s={s}
          t={t}
          still={still}
          onSheet={setSheet}
          canShare={!!share}
        />
      </div>

      {!size && !still && (
        <div className="absolute right-3 top-[calc(env(safe-area-inset-top)+12px)] z-20">
          <LangToggle dark={s.dark} />
        </div>
      )}
      {sample && !size && !still && (
        <p
          className="absolute left-3 top-[calc(env(safe-area-inset-top)+18px)] z-20 rounded-full border px-3 py-1 text-[10.5px] uppercase tracking-[0.18em]"
          style={{
            borderColor: s.line,
            color: s.muted,
            background: s.dark ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.6)",
          }}
        >
          {t.sample}
        </p>
      )}

      <AnimatePresence>
        {sheet && (
          <Sheet
            key={sheet}
            s={s}
            onClose={() => setSheet(null)}
            label={
              sheet === "map" ? t.map : sheet === "cookie" ? t.cookie : t.share
            }
            t={t}
          >
            {sheet === "map" && (
              <MapSheet invite={invite} s={s} t={t} lang={lang} />
            )}
            {sheet === "cookie" && (
              <FortuneCookie
                labels={t}
                lang={lang}
                s={{
                  ...s,
                  ink: sheetInk(s),
                  muted: s.dark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.55)",
                  line: sheetLine(s),
                  card: s.dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                }}
              />
            )}
            {sheet === "share" && share}
          </Sheet>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {sealed && (
          <Cover
            invite={invite}
            lang={lang}
            s={s}
            labels={t}
            onOpen={() => setSealed(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

type Enter = (delay: number) => object
interface PartProps {
  invite: Invite
  lang: Lang
  s: ThemeStyle
  t: Labels
  pic?: string
  stock: boolean
  enter: Enter
}

// ─── Decoration ──────────────────────────────────────────────────────────────

/** Full-screen layers: pattern, full overlay, texture, particles. */
function Backdrop({ s, still }: { s: ThemeStyle; still: boolean }) {
  const p = s.pattern
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {p && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("${svgUrl(p.svg)}")`,
            backgroundSize: `${p.size}px`,
            opacity: p.opacity,
            ...(p.mask
              ? {
                  maskImage: PATTERN_MASK[p.mask],
                  WebkitMaskImage: PATTERN_MASK[p.mask],
                }
              : {}),
          }}
        />
      )}
      {s.overlay?.full && (
        <img
          src={artUrl(s.overlay)}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: s.overlay.opacity ?? 1 }}
        />
      )}
      {s.texture && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("${textureUrl(s.texture)}")`,
            mixBlendMode: s.texture === "paper" ? "multiply" : "normal",
          }}
        >
          {s.texture === "silk" && (
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(115deg, transparent 20%, rgba(255,235,200,0.07) 38%, transparent 52%, rgba(255,235,200,0.05) 70%, transparent 84%)",
              }}
            />
          )}
        </div>
      )}
      {!still && <Particles s={s} />}
    </div>
  )
}

/** Stage-sized layers: placed overlay, frame, top and bottom art. */
function StageArt({ s, still }: { s: ThemeStyle; still: boolean }) {
  const o = s.overlay
  const sway = s.fx === "sway" && !still
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {o && !o.full && (
        <img
          src={artUrl(o)}
          alt=""
          className="absolute max-w-none -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${o.x}%`,
            top: `${o.y}%`,
            width: `${o.w}cqw`,
            opacity: o.opacity ?? 1,
          }}
        />
      )}
      {s.frame && <FrameArt s={s} />}
      {s.top && (
        <motion.img
          src={artUrl(s.top)}
          alt=""
          draggable={false}
          className="absolute inset-x-0 top-0 w-full select-none"
          style={{ transformOrigin: "50% 0" }}
          animate={sway ? { rotate: [-0.8, 0.8, -0.8] } : undefined}
          transition={
            sway
              ? { duration: 7, repeat: Infinity, ease: "easeInOut" }
              : undefined
          }
        />
      )}
      {s.bottom && (
        <img
          src={artUrl(s.bottom)}
          alt=""
          draggable={false}
          className="absolute inset-x-0 bottom-0 w-full select-none"
        />
      )}
    </div>
  )
}

/** Hairline frame (one or two lines) with mirrored corner art. */
function FrameArt({ s }: { s: ThemeStyle }) {
  const f = s.frame!
  const c = f.corner
  return (
    <div className="absolute inset-0">
      <div
        className="absolute border"
        style={{ inset: f.inset, borderColor: f.color }}
      />
      {f.lines === 2 && (
        <div
          className="absolute border"
          style={{ inset: f.inset + 5, borderColor: f.color }}
        />
      )}
      {c &&
        ([
          [1, 1],
          [-1, 1],
          [1, -1],
          [-1, -1],
        ] as const).map(([sx, sy]) => (
          <img
            key={`${sx}${sy}`}
            src={artUrl(c)}
            alt=""
            className="absolute"
            style={{
              width: c.w,
              height: c.h,
              [sx > 0 ? "left" : "right"]: f.inset,
              [sy > 0 ? "top" : "bottom"]: f.inset,
              transform: `scale(${sx}, ${sy})`,
            }}
          />
        ))}
    </div>
  )
}

/** The ambient effect: petals, stars, rain, confetti or rising sparks. Still under reduced motion. */
function Particles({ s }: { s: ThemeStyle }) {
  const reduce = useReducedMotion()
  const ps = useMemo(() => fxParticles(s), [s])
  if (!ps.length) return null
  return (
    <div className="absolute inset-0 overflow-hidden">
      {ps.map((p, i) => {
        const left = `${(p.x * 100).toFixed(1)}%`
        if (s.fx === "twinkle") {
          return (
            <motion.span
              key={i}
              className="absolute rounded-full"
              style={{
                left,
                top: `${(p.y * 100).toFixed(1)}%`,
                width: p.size,
                height: p.size,
                background: p.color,
                boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
              }}
              animate={
                reduce
                  ? { opacity: 0.6 }
                  : { opacity: [0.15, 1, 0.15], scale: [0.7, 1, 0.7] }
              }
              transition={
                reduce
                  ? undefined
                  : {
                      duration: p.dur,
                      delay: p.delay,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }
              }
            />
          )
        }
        if (reduce) return null
        if (s.fx === "rain") {
          return (
            <motion.span
              key={i}
              className="absolute w-px"
              style={{
                left,
                height: p.size,
                rotate: 12,
                background: `linear-gradient(${p.color}00, ${p.color}aa)`,
              }}
              initial={{ top: "-6%" }}
              animate={{ top: "104%" }}
              transition={{
                duration: p.dur,
                delay: p.delay,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          )
        }
        if (s.fx === "float") {
          return (
            <motion.span
              key={i}
              className="absolute rounded-full"
              style={{
                left,
                width: p.size,
                height: p.size,
                background: p.color,
                opacity: 0.5,
                boxShadow: `0 0 ${p.size}px ${p.color}`,
              }}
              initial={{ top: "104%" }}
              animate={{ top: "-6%", x: [0, 10, -8, 6] }}
              transition={{
                duration: p.dur,
                delay: p.delay,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          )
        }
        const confetti = s.fx === "confetti"
        return (
          <motion.span
            key={i}
            className="absolute"
            style={{
              left,
              width: confetti ? p.size * 0.6 : p.size,
              height: confetti ? p.size * 1.1 : p.size * 0.7,
              background: p.color,
              borderRadius: confetti ? 2 : "80% 0 80% 0",
              opacity: 0.88,
            }}
            initial={{ top: "-4%", rotate: p.rot }}
            animate={{
              top: "104%",
              rotate: p.rot + (confetti ? 720 : 300),
              x: [0, 24, -12, 18],
            }}
            transition={{
              duration: confetti ? p.dur * 0.7 : p.dur,
              delay: p.delay,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        )
      })}
    </div>
  )
}

// ─── Content ─────────────────────────────────────────────────────────────────

const fontOf = (s: ThemeStyle, l: Lang): CSSProperties =>
  l === "ta"
    ? {
        fontFamily: `'${s.taName.family}', 'Noto Serif Tamil', serif`,
        fontWeight: s.taName.weight,
      }
    : {
        fontFamily: `'${s.name.family}', serif`,
        fontWeight: s.name.weight,
        fontStyle: s.name.italic ? "italic" : "normal",
        textTransform: s.name.upper ? "uppercase" : undefined,
      }

const foilText = (s: ThemeStyle, onSplit = false): CSSProperties =>
  s.foil && !onSplit
    ? {
        backgroundImage: foilCss(s.foil),
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        filter: s.dark ? "drop-shadow(0 2px 6px rgba(0,0,0,0.35))" : undefined,
      }
    : {}

/** Top padding that clears the design's top art. */
const topPad = (s: ThemeStyle) =>
  s.top
    ? `calc(${((s.top.h / GRID) * 100 * 0.78).toFixed(1)}cqw + 2cqh)`
    : "6cqh"
const botPad = (s: ThemeStyle) =>
  s.bottom
    ? `calc(${((s.bottom.h / GRID) * 100 * 0.6).toFixed(1)}cqw + 11cqh)`
    : "12cqh"

function MainLayout(p: PartProps) {
  const { s } = p
  const poster = s.layout === "poster"
  const body = poster ? <PosterBody {...p} /> : <CentreBody {...p} />
  return (
    <div
      className="absolute inset-0 flex flex-col px-[7cqw]"
      style={{ paddingTop: topPad(s), paddingBottom: botPad(s) }}
    >
      <Fit left={poster}>
        {s.layout === "card" && s.panel ? (
          <div
            className="flex w-full flex-col items-center px-[6cqw] text-center"
            style={{
              background: s.panel.bg,
              border: s.panel.border,
              boxShadow: s.panel.shadow,
              borderRadius:
                s.panel.radius >= 200
                  ? "50cqw 50cqw 28px 28px"
                  : s.panel.radius,
              paddingTop: s.panel.radius >= 200 ? "9cqh" : "3.4cqh",
              paddingBottom: "3cqh",
            }}
          >
            {body}
          </div>
        ) : (
          body
        )}
      </Fit>
    </div>
  )
}

const useIsoLayout = typeof window === "undefined" ? useEffect : useLayoutEffect

/**
 * Holds content in the space it is given and shrinks it (never below 60 %) when
 * it would not fit, so a long name, a short phone or a big portrait never
 * pushes anything off the one screen.
 */
function Fit({
  children,
  left = false,
  anchor = "center",
}: {
  children: ReactNode
  left?: boolean
  anchor?: "center" | "bottom" | "top"
}) {
  const outer = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const [k, setK] = useState(1)
  useIsoLayout(() => {
    const o = outer.current
    const i = inner.current
    if (!o || !i) return
    const fit = () => {
      const need = i.offsetHeight
      const have = o.clientHeight
      setK(need > have && need > 0 ? Math.max(0.6, have / need) : 1)
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(o)
    ro.observe(i)
    return () => ro.disconnect()
  }, [])
  const pos: CSSProperties =
    anchor === "center"
      ? { top: "50%", transform: `translateY(-50%) scale(${k})` }
      : anchor === "bottom"
        ? { bottom: 0, transform: `scale(${k})` }
        : { top: 0, transform: `scale(${k})` }
  return (
    <div ref={outer} className="relative min-h-0 w-full flex-1">
      <div
        ref={inner}
        className={`absolute inset-x-0 flex flex-col ${
          left ? "items-start" : "items-center"
        }`}
        style={{
          ...pos,
          transformOrigin: `${left ? "0%" : "50%"} ${
            anchor === "bottom" ? "100%" : anchor === "top" ? "0%" : "50%"
          }`,
        }}
      >
        {children}
      </div>
    </div>
  )
}

function CentreBody({ invite, lang, s, t, pic, stock, enter }: PartProps) {
  const names = invite[lang]
  const other: Lang = lang === "ta" ? "en" : "ta"
  const nameSize = pic ? (lang === "ta" ? 4.6 : 5.8) : lang === "ta" ? 5.6 : 7.2
  return (
    <div className="flex w-full flex-col items-center text-center">
      {invite.parents?.[lang] && (
        <motion.p
          {...enter(0.2)}
          className="max-w-[86cqw] leading-snug"
          style={{ fontSize: fs(1.45, 3.1), color: s.accent }}
        >
          {invite.parents[lang]}
        </motion.p>
      )}
      {pic && (
        <Portrait
          s={s}
          src={pic}
          stock={stock}
          alt={t.caricature}
          still={!("initial" in enter(0))}
        />
      )}
      {s.monogram && !pic && <Monogram invite={invite} s={s} />}
      <motion.h1 {...enter(0.4)} className="mt-[1.6cqh] max-w-full">
        <span
          className="block break-words leading-[1.05]"
          style={{
            ...fontOf(s, lang),
            ...foilText(s),
            fontSize: fs(nameSize, nameSize * 1.9),
          }}
        >
          {names[0]}
        </span>
        <span
          className="my-[1cqh] flex items-center justify-center gap-3 uppercase tracking-[0.4em]"
          style={{ color: s.accent, fontSize: fs(1.3, 2.8) }}
        >
          <span
            className="h-px w-[9cqw]"
            style={{
              background: `linear-gradient(90deg, transparent, ${s.accent})`,
            }}
          />
          {t.weds}
          <span
            className="h-px w-[9cqw]"
            style={{
              background: `linear-gradient(90deg, ${s.accent}, transparent)`,
            }}
          />
        </span>
        <span
          className="block break-words leading-[1.05]"
          style={{
            ...fontOf(s, lang),
            ...foilText(s),
            fontSize: fs(nameSize, nameSize * 1.9),
          }}
        >
          {names[1]}
        </span>
      </motion.h1>
      <p
        className="mt-[0.8cqh] max-w-full truncate"
        style={{
          ...fontOf(s, other),
          fontWeight: 400,
          fontStyle: "normal",
          textTransform: "none",
          color: s.muted,
          fontSize: fs(other === "ta" ? 1.7 : 2.1),
        }}
      >
        {invite[other][0]} · {invite[other][1]}
      </p>
      <motion.div {...enter(0.6)} className="flex flex-col items-center">
        <DateLockup invite={invite} lang={lang} s={s} t={t} />
        <Venue invite={invite} s={s} />
        <Countdown invite={invite} t={t} s={s} />
      </motion.div>
    </div>
  )
}

/** Poster: left-aligned, oversized names with a big ampersand, details in a ruled column. */
function PosterBody({ invite, lang, s, t, enter }: PartProps) {
  const names = invite[lang]
  const other: Lang = lang === "ta" ? "en" : "ta"
  const size = lang === "ta" ? 6.4 : 9.6
  const d = dateParts(invite.date, lang)
  return (
    <div className="flex w-full flex-col items-start text-left">
      {invite.parents?.[lang] && (
        <motion.p
          {...enter(0.2)}
          className="max-w-[80cqw] leading-snug"
          style={{ fontSize: fs(1.4, 3), color: s.muted }}
        >
          {invite.parents[lang]}
        </motion.p>
      )}
      <motion.h1 {...enter(0.35)} className="mt-[2.4cqh] w-full">
        <span
          className="block break-words leading-[0.98]"
          style={{ ...fontOf(s, lang), fontSize: fs(size, size * 1.7) }}
        >
          {names[0]}
        </span>
        <span
          className="block leading-none"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontStyle: "italic",
            color: s.accent,
            fontSize: fs(size * 0.7, size * 1.2),
          }}
        >
          &amp;
        </span>
        <span
          className="block break-words leading-[0.98]"
          style={{ ...fontOf(s, lang), fontSize: fs(size, size * 1.7) }}
        >
          {names[1]}
        </span>
      </motion.h1>
      <p
        className="mt-[1.2cqh] max-w-full truncate"
        style={{
          ...fontOf(s, other),
          fontWeight: 400,
          fontStyle: "normal",
          textTransform: "none",
          color: s.muted,
          fontSize: fs(other === "ta" ? 1.7 : 2),
        }}
      >
        {invite[other][0]} · {invite[other][1]}
      </p>
      <motion.div
        {...enter(0.55)}
        className="mt-[2.6cqh] w-full border-t pt-[1.8cqh]"
        style={{ borderColor: s.line }}
      >
        <div className="flex items-end gap-[3cqw]">
          <span
            className="leading-[0.85] tabular-nums"
            style={{ ...fontOf(s, "en"), fontSize: fs(9, 17), color: s.accent }}
          >
            {d.day}
          </span>
          <span
            className="pb-[0.6cqh] uppercase leading-tight tracking-[0.18em]"
            style={{ fontSize: fs(1.45, 3) }}
          >
            {d.month} {d.year}
            <span className="block" style={{ color: s.muted }}>
              {d.weekday}
              {invite.time ? ` · ${timeLabel(invite.time, lang)}` : ""}
            </span>
          </span>
        </div>
        <p
          className="mt-[1.6cqh] leading-tight"
          style={{
            fontSize: fs(2.1, 4.4),
            ...fontOf(s, "en"),
            textTransform: "none",
          }}
        >
          {invite.venue}
        </p>
        {invite.address && (
          <p
            className="mt-[0.4cqh] truncate"
            style={{ fontSize: fs(1.4, 3), color: s.muted }}
          >
            {invite.address}
          </p>
        )}
        <Countdown invite={invite} t={t} s={s} left />
      </motion.div>
    </div>
  )
}

/** Split: names on the upper colour block, details on the lower. */
function SplitLayout({ invite, lang, s, t, pic, stock, enter }: PartProps) {
  const sp = s.split!
  const names = invite[lang]
  const other: Lang = lang === "ta" ? "en" : "ta"
  const size = pic ? (lang === "ta" ? 4.6 : 6) : lang === "ta" ? 5.6 : 7.6
  const upper: ThemeStyle = {
    ...s,
    ink: sp.ink,
    muted: sp.muted,
    accent: sp.accent,
  }
  return (
    <>
      <div
        className="absolute inset-x-0 top-0 flex h-[52%] flex-col px-[7cqw] pb-[3cqh] pt-[6cqh] text-center"
        style={{ color: sp.ink }}
      >
        <Fit anchor="bottom">
          {invite.parents?.[lang] && (
            <p
              className="mb-[1.4cqh] max-w-[86cqw] leading-snug"
              style={{ fontSize: fs(1.45, 3.1), color: sp.muted }}
            >
              {invite.parents[lang]}
            </p>
          )}
          {pic && (
            <Portrait
              s={upper}
              src={pic}
              stock={stock}
              alt={t.caricature}
              still
              small
            />
          )}
          <motion.h1 {...enter(0.3)} className="max-w-full">
            <span
              className="block break-words leading-[1.02]"
              style={{ ...fontOf(s, lang), fontSize: fs(size, size * 1.9) }}
            >
              {names[0]}
            </span>
            <span
              className="my-[0.6cqh] block uppercase tracking-[0.4em]"
              style={{ color: sp.accent, fontSize: fs(1.3, 2.8) }}
            >
              {t.weds}
            </span>
            <span
              className="block break-words leading-[1.02]"
              style={{ ...fontOf(s, lang), fontSize: fs(size, size * 1.9) }}
            >
              {names[1]}
            </span>
          </motion.h1>
        </Fit>
      </div>
      <div
        className="absolute inset-x-0 top-[52%] flex flex-col px-[7cqw] pt-[2.4cqh] text-center"
        style={{ bottom: botPad(s) }}
      >
        <Fit anchor="top">
          <p
            className="max-w-full truncate"
            style={{
              ...fontOf(s, other),
              fontWeight: 400,
              fontStyle: "normal",
              color: s.muted,
              fontSize: fs(other === "ta" ? 1.7 : 2.1),
            }}
          >
            {invite[other][0]} · {invite[other][1]}
          </p>
          <motion.div {...enter(0.5)} className="flex flex-col items-center">
            <DateLockup invite={invite} lang={lang} s={s} t={t} />
            <Venue invite={invite} s={s} />
            <Countdown invite={invite} t={t} s={s} />
          </motion.div>
        </Fit>
      </div>
    </>
  )
}

function Monogram({ invite, s }: { invite: Invite; s: ThemeStyle }) {
  return (
    <div
      className="mt-[1.4cqh] flex items-center justify-center rounded-full border"
      style={{ borderColor: s.line, width: fs(10, 20), height: fs(10, 20) }}
    >
      <span
        className="font-['Cormorant_Garamond'] leading-none tracking-[0.08em]"
        style={{
          color: "transparent",
          WebkitTextStroke: `1px ${s.ink}`,
          fontSize: fs(4.2, 8),
        }}
      >
        {(invite.en[0][0] ?? "").toUpperCase()}
        {(invite.en[1][0] ?? "").toUpperCase()}
      </span>
    </div>
  )
}

/** The caricature in the design's frame shape (arch, oval or circle), double rings and a soft glow. */
function Portrait({
  s,
  src,
  stock,
  alt,
  still,
  small = false,
}: {
  s: ThemeStyle
  src: string
  stock: boolean
  alt: string
  still: boolean
  small?: boolean
}) {
  const reduce = useReducedMotion() || still
  const shape = s.portrait ?? "circle"
  const radius = shape === "arch" ? "999px 999px 22px 22px" : "50%"
  const h = small ? 17 : 21
  const w = shape === "circle" ? h : h * 0.8
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      className="relative mt-[2cqh] shrink-0"
      style={{ height: `${h}cqh`, width: `${w}cqh`, marginBottom: "1cqh" }}
    >
      <div
        aria-hidden="true"
        className="absolute -inset-[30%] rounded-full blur-2xl"
        style={{
          background: `radial-gradient(closest-side, ${s.accent}55, transparent)`,
        }}
      />
      <div
        aria-hidden="true"
        className="absolute -inset-[7%]"
        style={{ borderRadius: radius, border: `1.5px solid ${s.accent}` }}
      />
      <div
        aria-hidden="true"
        className="absolute -inset-[3%] opacity-50"
        style={{ borderRadius: radius, border: `1px solid ${s.accent}` }}
      />
      <div
        className="relative h-full w-full overflow-hidden"
        style={{
          borderRadius: radius,
          background: `radial-gradient(circle at 50% 38%, ${s.accent}40, ${s.accent}14 55%, ${s.tone} 100%)`,
        }}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          className={`absolute inset-0 h-full w-full ${
            stock ? "object-contain object-bottom" : "object-cover"
          }`}
        />
      </div>
      {!reduce &&
        [
          [-9, 16],
          [104, 28],
          [-5, 80],
          [100, 74],
        ].map(([x, y], i) => (
          <motion.span
            key={i}
            aria-hidden="true"
            className="absolute h-[1.1cqh] w-[1.1cqh] rotate-45"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              background: s.accent,
              boxShadow: `0 0 10px ${s.accent}`,
            }}
            animate={{ opacity: [0.2, 1, 0.2], scale: [0.6, 1, 0.6] }}
            transition={{
              duration: 2.6 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.4,
            }}
          />
        ))}
    </motion.div>
  )
}

/** Weekday, then month | big day | year between rules, then the muhurtham. */
function DateLockup({
  invite,
  lang,
  s,
  t,
}: {
  invite: Invite
  lang: Lang
  s: ThemeStyle
  t: Labels
}) {
  const p = dateParts(invite.date, lang)
  const cell: CSSProperties = {
    borderColor: s.line,
    fontSize: fs(1.25, 2.7),
    width: "21cqw",
  }
  return (
    <div className="mt-[2cqh] flex flex-col items-center">
      <p
        className="uppercase tracking-[0.32em]"
        style={{ color: s.accent, fontSize: fs(1.25, 2.7) }}
      >
        {p.weekday}
      </p>
      <div className="mt-[0.8cqh] flex items-center gap-[3.5cqw]">
        <span
          className="border-y py-[0.7cqh] uppercase tracking-[0.2em]"
          style={cell}
        >
          {p.month}
        </span>
        <span
          className="min-w-[14cqw] leading-none tabular-nums"
          style={{
            fontFamily: `'${s.name.family}', serif`,
            fontWeight: s.name.weight,
            fontSize: fs(6, 12),
            ...foilText(s),
          }}
        >
          {p.day}
        </span>
        <span className="border-y py-[0.7cqh] tracking-[0.2em]" style={cell}>
          {p.year}
        </span>
      </div>
      {invite.time && (
        <p
          className="mt-[1cqh]"
          style={{ color: s.muted, fontSize: fs(1.55, 3.3) }}
        >
          {t.muhurtham} ·{" "}
          <span style={{ color: s.ink }}>{timeLabel(invite.time, lang)}</span>
        </p>
      )}
    </div>
  )
}

function Venue({ invite, s }: { invite: Invite; s: ThemeStyle }) {
  return (
    <div className="mt-[1.8cqh] flex max-w-[84cqw] flex-col items-center">
      <p
        className="flex items-center gap-1.5 leading-tight"
        style={{
          fontSize: fs(1.95, 4.2),
          fontFamily: `'${s.name.family}', serif`,
          fontWeight: s.name.weight,
        }}
      >
        <Icon
          name="mapPin"
          size={14}
          className="shrink-0"
          style={{ color: s.accent }}
        />
        <span className="line-clamp-2">{invite.venue}</span>
      </p>
      {invite.address && (
        <p
          className="mt-[0.3cqh] max-w-full truncate"
          style={{ fontSize: fs(1.35, 2.9), color: s.muted }}
        >
          {invite.address}
        </p>
      )}
    </div>
  )
}

function Countdown({
  invite,
  t,
  s,
  left = false,
}: {
  invite: Invite
  t: Labels
  s: ThemeStyle
  left?: boolean
}) {
  const [c, setC] = useState(() => countdown(invite))
  useEffect(() => {
    setC(countdown(invite))
    const id = window.setInterval(() => setC(countdown(invite)), 1000)
    return () => clearInterval(id)
  }, [invite])
  if (c.done)
    return (
      <p className="mt-[1.8cqh]" style={{ color: s.accent, fontSize: fs(1.7) }}>
        {t.married}
      </p>
    )
  const cells: [number, string][] = [
    [c.days, t.days],
    [c.hours, t.hours],
    [c.minutes, t.minutes],
    [c.seconds, t.seconds],
  ]
  return (
    <div
      className={`mt-[1.8cqh] flex gap-[1.6cqw] ${
        left ? "" : "justify-center"
      }`}
      role="timer"
      aria-live="off"
    >
      {cells.map(([n, l]) => (
        <div
          key={l}
          className="flex min-w-[13.5cqw] flex-col items-center rounded-[1.6cqh] border px-[1.4cqw] py-[0.7cqh]"
          style={{ background: s.card, borderColor: s.line }}
        >
          <span
            className="font-['Cormorant_Garamond'] leading-none tabular-nums"
            style={{ fontSize: fs(2.6, 5.4) }}
          >
            {String(n).padStart(2, "0")}
          </span>
          <span
            className="mt-[0.3cqh] uppercase tracking-[0.12em]"
            style={{ color: s.muted, fontSize: fs(0.95, 2) }}
          >
            {l}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Actions and sheets ──────────────────────────────────────────────────────

function ActionBar({
  invite,
  lang,
  s,
  t,
  still,
  onSheet,
  canShare,
}: {
  invite: Invite
  lang: Lang
  s: ThemeStyle
  t: Labels
  still: boolean
  onSheet: (k: "map" | "cookie" | "share") => void
  canShare: boolean
}) {
  const rsvp = rsvpUrl(invite, lang)
  const pill =
    "flex items-center justify-center gap-1.5 rounded-full font-semibold whitespace-nowrap"
  const bar: CSSProperties = {
    height: fs(5.4, 11),
    fontSize: fs(1.55, 3.4),
    paddingInline: fs(2.2, 4.6),
  }
  const icon = (
    k: "map" | "cookie" | "share",
    name: IconName,
    label: string,
  ) => (
    <button
      type="button"
      onClick={() => onSheet(k)}
      aria-label={label}
      title={label}
      className={`${pill} aspect-square border cursor-pointer`}
      style={{
        ...bar,
        paddingInline: 0,
        borderColor: s.line,
        color: s.ink,
        background: s.dark ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.55)",
      }}
    >
      <Icon name={name} size={17} />
    </button>
  )
  if (still) {
    // The PNG prints the directions QR where the buttons would be.
    return (
      <div className="absolute inset-x-0 bottom-[3cqh] flex items-center justify-center gap-[3cqw]">
        <Qr
          text={directionsUrl(invite)}
          size={78}
          color={s.qr[0]}
          background={s.qr[1]}
          label={t.scan}
          className="rounded-lg"
        />
        <div
          className="text-left"
          style={{ fontSize: fs(1.3, 2.8), color: s.muted }}
        >
          <p style={{ color: s.ink }}>{t.scan}</p>
          <p className="mt-1 opacity-75">The Treasure Capture Events</p>
        </div>
      </div>
    )
  }
  return (
    <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-[0.8cqh] px-[5cqw] pb-[calc(env(safe-area-inset-bottom)+2.2cqh)]">
      <div className="flex items-center justify-center gap-[1.8cqw]">
        <a
          href={directionsUrl(invite)}
          target="_blank"
          rel="noreferrer"
          className={pill}
          style={{ ...bar, background: s.accent, color: s.onAccent }}
        >
          <Icon name="arrowUpRight" size={15} /> {t.directions}
        </a>
        {rsvp && (
          <a
            href={rsvp}
            target="_blank"
            rel="noreferrer"
            className={`${pill} border`}
            style={{
              ...bar,
              borderColor: s.line,
              color: s.ink,
              background: s.dark
                ? "rgba(0,0,0,0.25)"
                : "rgba(255,255,255,0.55)",
            }}
          >
            <Icon name="whatsapp" size={15} /> {t.rsvp}
          </a>
        )}
        {icon("map", "mapPin", t.map)}
        {icon("cookie", "sparkle", t.cookieBtn)}
        {canShare && icon("share", "share", t.share)}
      </div>
      <p
        className="opacity-60"
        style={{ fontSize: fs(1, 2.2), color: s.muted }}
      >
        The Treasure Capture Events · Madurai
      </p>
    </div>
  )
}

export function Sheet({
  s,
  label,
  t,
  onClose,
  children,
}: {
  s: ThemeStyle
  label: string
  t: Labels
  onClose: () => void
  children: ReactNode
}) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", k)
    return () => window.removeEventListener("keydown", k)
  }, [onClose])
  return (
    <motion.div
      className="absolute inset-0 z-40 flex items-end justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button
        type="button"
        aria-label={t.close}
        onClick={onClose}
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px] cursor-default"
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative max-h-[88%] w-full max-w-[520px] overflow-y-auto rounded-t-[28px] px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-3"
        style={{
          background: s.dark ? "#121214" : "#ffffff",
          color: sheetInk(s),
        }}
        data-lenis-prevent
      >
        <div
          className="mx-auto mb-3 h-1 w-10 rounded-full"
          style={{ background: sheetLine(s) }}
        />
        <div className="mb-3 flex items-center justify-between gap-3">
          <p
            className="text-[12px] uppercase tracking-[0.28em]"
            style={{ color: s.accent }}
          >
            {label}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full cursor-pointer"
            style={{ background: sheetLine(s) }}
            aria-label={t.close}
          >
            <Icon name="x" size={16} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}

export function MapSheet({
  invite,
  s,
  t,
  lang,
}: {
  invite: Invite
  s: ThemeStyle
  t: Labels
  lang: Lang
}) {
  const [live, setLive] = useState(false)
  const rsvp = rsvpUrl(invite, lang)
  return (
    <div>
      <p
        className="text-[20px] leading-tight"
        style={{ fontFamily: `'${s.name.family}', serif` }}
      >
        {invite.venue}
      </p>
      {invite.address && (
        <p className="mt-1 text-[13px] opacity-60">{invite.address}</p>
      )}
      <div
        className="relative mt-4 overflow-hidden rounded-[20px] border"
        style={{ borderColor: sheetLine(s) }}
      >
        <iframe
          title={invite.venue}
          src={mapEmbedUrl(invite)}
          className={`block h-56 w-full ${
            s.dark ? "grayscale-[0.4] invert-[0.88] hue-rotate-180" : ""
          }`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        {!live && (
          <button
            type="button"
            onClick={() => setLive(true)}
            className="absolute inset-0 hidden items-end justify-center pb-3 cursor-pointer [@media(hover:none)]:flex"
          >
            <span className="rounded-full bg-black/70 px-4 py-2 text-[12.5px] font-medium text-white backdrop-blur">
              {t.mapTap}
            </span>
          </button>
        )}
      </div>
      <div className="mt-4 flex items-center gap-4">
        <Qr
          text={directionsUrl(invite)}
          size={104}
          color={s.qr[0]}
          background={s.qr[1]}
          label={t.scan}
          className="shrink-0 rounded-xl"
        />
        <div className="flex flex-1 flex-col gap-2">
          <p className="text-[13px] opacity-65">{t.scan}</p>
          <a
            href={directionsUrl(invite)}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-11 items-center justify-center gap-2 rounded-full text-[14px] font-semibold"
            style={{ background: s.accent, color: s.onAccent }}
          >
            <Icon name="mapPin" size={15} /> {t.directions}
          </a>
          {rsvp && (
            <a
              href={rsvp}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-11 items-center justify-center gap-2 rounded-full border text-[14px] font-semibold"
              style={{ borderColor: sheetLine(s) }}
            >
              <Icon name="whatsapp" size={15} /> {t.rsvp}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Premium only: the invite arrives sealed. Two halves in the design's colours meet
 * at a wax seal with the couple's initials; a tap parts them like doors.
 */
function Cover({
  invite,
  lang,
  s,
  labels,
  onOpen,
}: {
  invite: Invite
  lang: Lang
  s: ThemeStyle
  labels: Labels
  onOpen: () => void
}) {
  const reduce = useReducedMotion()
  const ease = [0.7, 0, 0.2, 1] as const
  const half = (side: "l" | "r") => (
    <motion.div
      className="relative h-full w-1/2 overflow-hidden"
      style={{
        background: s.base,
        backgroundSize: "200% 100%",
        backgroundPosition: side === "l" ? "left" : "right",
        [side === "l" ? "borderRight" : "borderLeft"]: `1px solid ${s.accent}`,
      }}
      exit={reduce ? { opacity: 0 } : { x: side === "l" ? "-100%" : "100%" }}
      transition={{ duration: 1.1, ease, delay: 0.25 }}
    >
      {s.pattern && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("${svgUrl(s.pattern.svg)}")`,
            backgroundSize: `${s.pattern.size}px`,
            opacity: s.pattern.opacity * 0.7,
          }}
        />
      )}
      <div
        className="absolute inset-3 border"
        style={{
          borderColor: s.line,
          [side === "l" ? "borderRight" : "borderLeft"]: "none",
        }}
      />
    </motion.div>
  )
  const initials = `${(invite.en[0][0] ?? "").toUpperCase()}${(invite.en[1][0] ?? "").toUpperCase()}`
  const ink = s.layout === "card" && s.panel ? s.panel.bg : s.ink
  return (
    <motion.div
      className="absolute inset-0 z-50 flex"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, delay: 1.2 }}
    >
      {half("l")}
      {half("r")}
      <motion.button
        type="button"
        onClick={onOpen}
        className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-8 text-center cursor-pointer"
        style={{
          color: ink,
          textShadow:
            s.layout === "card" ? "0 2px 12px rgba(0,0,0,0.45)" : undefined,
        }}
        exit={{ opacity: 0, scale: 0.85 }}
        transition={{ duration: 0.35 }}
      >
        <span className="text-[12px] uppercase tracking-[0.36em]">
          {labels.invited}
        </span>
        <motion.span
          className="flex h-32 w-32 items-center justify-center rounded-full text-[40px] tracking-[0.06em]"
          style={{
            background: `radial-gradient(circle at 35% 30%, ${s.foil?.[1] ?? s.accent}, ${s.accent} 45%, ${s.foil?.[s.foil.length - 1] ?? s.accent})`,
            color: s.onAccent,
            textShadow: "none",
            boxShadow: `0 0 0 6px ${s.accent}33, 0 18px 40px -12px rgba(0,0,0,0.55), inset 0 -6px 14px rgba(0,0,0,0.25)`,
            fontFamily: `'${s.name.family}', serif`,
            fontStyle: s.name.italic ? "italic" : "normal",
          }}
          animate={reduce ? undefined : { scale: [1, 1.04, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          {initials}
        </motion.span>
        <span className="text-[26px] leading-tight" style={fontOf(s, lang)}>
          {invite[lang][0]} &amp; {invite[lang][1]}
        </span>
        <span className="flex items-center gap-2 text-[13px] opacity-80">
          <Icon name="sparkle" size={14} /> {labels.open}
        </span>
      </motion.button>
    </motion.div>
  )
}

// ─── Picker thumbnail ────────────────────────────────────────────────────────

/** A small, static picture of a design for the builder's picker: background, pattern, art and initials. */
export function ThemeThumb({
  theme,
  initials,
  className = "",
}: {
  theme: InviteTheme
  initials: string
  className?: string
}) {
  if (isStoryTheme(theme))
    return (
      <span className={`relative block overflow-hidden ${className}`}>
        <StoryThumb theme={theme} initials={initials} />
        {isCinematicTheme(theme) && (
          <span className="absolute bottom-1 right-1 z-20 rounded border border-amber-400/50 bg-black/75 px-1 py-0.5 text-[8.5px] font-bold uppercase leading-none tracking-wider text-amber-300">
            3D
          </span>
        )}
      </span>
    )
  const s = themeStyle(theme)
  const premium = isPremium(theme)
  return (
    <span
      className={`relative block overflow-hidden ${className}`}
      style={{ background: s.base, containerType: "size" }}
    >
      {s.pattern && (
        <span
          className="absolute inset-0"
          style={{
            backgroundImage: `url("${svgUrl(s.pattern.svg)}")`,
            backgroundSize: `${s.pattern.size * 0.45}px`,
            opacity: s.pattern.opacity,
            ...(s.pattern.mask
              ? {
                  maskImage: PATTERN_MASK[s.pattern.mask],
                  WebkitMaskImage: PATTERN_MASK[s.pattern.mask],
                }
              : {}),
          }}
        />
      )}
      {s.layout === "split" && s.split && (
        <span
          className="absolute inset-x-0 top-0 h-[52%]"
          style={{ background: s.split.bg }}
        />
      )}
      {s.overlay &&
        (s.overlay.full ? (
          <img
            src={artUrl(s.overlay)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{ opacity: s.overlay.opacity ?? 1 }}
          />
        ) : (
          <img
            src={artUrl(s.overlay)}
            alt=""
            className="absolute max-w-none -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${s.overlay.x}%`,
              top: `${s.overlay.y}%`,
              width: `${s.overlay.w}%`,
              opacity: s.overlay.opacity ?? 1,
            }}
          />
        ))}
      {s.frame && (
        <span
          className="absolute inset-[4px] border"
          style={{ borderColor: s.frame.color }}
        />
      )}
      {s.top && (
        <img
          src={artUrl(s.top)}
          alt=""
          className="absolute inset-x-0 top-0 w-full"
        />
      )}
      {s.bottom && (
        <img
          src={artUrl(s.bottom)}
          alt=""
          className="absolute inset-x-0 bottom-0 w-full"
        />
      )}
      {s.layout === "card" && s.panel && (
        <span
          className="absolute inset-x-[14%] inset-y-[22%]"
          style={{
            background: s.panel.bg,
            border: s.panel.border,
            borderRadius:
              s.panel.radius >= 200
                ? "50cqw 50cqw 6px 6px"
                : Math.min(s.panel.radius, 14),
          }}
        />
      )}
      {premium && (
        <span
          className="absolute left-1/2 top-[24%] h-[26%] w-[24%] -translate-x-1/2 overflow-hidden"
          style={{
            borderRadius: s.portrait === "arch" ? "99px 99px 6px 6px" : "50%",
            boxShadow: `0 0 0 1.5px ${s.accent}`,
            background: `${s.accent}22`,
          }}
        >
          <img
            src={coupleUrl(s.accent)}
            alt=""
            className="absolute inset-0 h-full w-full object-contain object-bottom"
          />
        </span>
      )}
      <span
        className={`absolute inset-x-0 -translate-y-1/2 px-1 leading-none ${
          s.layout === "poster" ? "left-[10%] text-left" : "text-center"
        } ${
          premium
            ? "top-[66%]"
            : s.layout === "split"
              ? "top-[40%]"
              : "top-[52%]"
        }`}
        style={{
          ...fontOf(s, "en"),
          fontSize: s.layout === "poster" ? "15cqw" : "12cqw",
          color: s.layout === "split" && s.split ? s.split.ink : s.ink,
          ...foilText(s, s.layout === "split"),
        }}
      >
        {initials}
      </span>
    </span>
  )
}

export function FortuneCookie({
  labels,
  lang,
  s,
}: {
  labels: Labels
  lang: Lang
  s: ThemeStyle
}) {
  const reduce = useReducedMotion()
  const [state, setState] = useState<{ index: number | null; round: number }>({
    index: null,
    round: 0,
  })
  const crack = () => {
    const s = store.read()
    const r = nextFortune(s.seen, s.seed)
    store.write({ seed: s.seed, seen: r.seen })
    setState((x) => ({ index: r.index, round: x.round + 1 }))
  }
  // The cookie cracks by itself a moment after the sheet opens.
  useEffect(() => {
    const id = window.setTimeout(crack, reduce ? 0 : 700)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const open = state.index !== null
  const f = open ? FORTUNES[state.index!] : undefined
  const other: Lang = lang === "ta" ? "en" : "ta"
  return (
    <section className="mx-auto max-w-xl px-2 pb-4 text-center">
      <p
        className="text-[12px] uppercase tracking-[0.3em]"
        style={{ color: s.accent }}
      >
        {labels.cookie}
      </p>
      <div className="relative mx-auto mt-8 h-44 w-64">
        {/* Plate */}
        <span
          className="absolute inset-x-4 bottom-2 h-6 rounded-[50%]"
          style={{ background: s.card }}
        />
        <AnimatePresence mode="wait">
          {!open ? (
            <motion.button
              key={`whole-${state.round}`}
              type="button"
              onClick={crack}
              aria-label={labels.tap}
              className="absolute inset-x-0 bottom-6 mx-auto flex h-28 w-40 items-center justify-center cursor-pointer"
              animate={reduce ? undefined : { rotate: [0, -4, 4, -2, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1.4 }}
              exit={{ opacity: 0 }}
            >
              <CookieShape />
            </motion.button>
          ) : (
            <motion.div
              key={`open-${state.round}`}
              className="absolute inset-0"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {reduce ? null : (
                <>
                  <motion.span
                    className="absolute bottom-6 left-1/2 block h-24 w-20 origin-bottom-right"
                    initial={{ x: "-100%", rotate: 0 }}
                    animate={{ x: "-170%", rotate: -28, y: 6 }}
                    transition={{ type: "spring", stiffness: 220, damping: 14 }}
                  >
                    <CookieShape half="left" />
                  </motion.span>
                  <motion.span
                    className="absolute bottom-6 left-1/2 block h-24 w-20 origin-bottom-left"
                    initial={{ x: 0, rotate: 0 }}
                    animate={{ x: "70%", rotate: 28, y: 6 }}
                    transition={{ type: "spring", stiffness: 220, damping: 14 }}
                  >
                    <CookieShape half="right" />
                  </motion.span>
                  {[...Array(7)].map((_, i) => (
                    <motion.span
                      key={i}
                      className="absolute bottom-10 left-1/2 h-1.5 w-1.5 rounded-full"
                      style={{ background: s.accent }}
                      initial={{ opacity: 1, x: 0, y: 0 }}
                      animate={{
                        opacity: 0,
                        x: (i - 3) * 18,
                        y: 30 + (i % 3) * 8,
                      }}
                      transition={{ duration: 0.8 }}
                    />
                  ))}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence mode="wait">
        {f ? (
          <motion.div
            key={state.round}
            initial={
              reduce ? { opacity: 0 } : { opacity: 0, scaleX: 0.2, y: -30 }
            }
            animate={{ opacity: 1, scaleX: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{
              delay: reduce ? 0 : 0.35,
              duration: 0.6,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mx-auto -mt-6 max-w-sm rounded-md bg-[#f6efe0] px-6 py-5 text-[#2a2216] shadow-[0_20px_40px_-20px_rgba(0,0,0,0.6)]"
          >
            <p
              className={
                lang === "ta"
                  ? "font-['Noto_Serif_Tamil'] text-[17px] leading-relaxed"
                  : "font-['Cormorant_Garamond'] text-[22px] italic leading-snug"
              }
            >
              {f[lang]}
            </p>
            <p className="mt-2 text-[13px] text-[#2a2216]/60">{f[other]}</p>
          </motion.div>
        ) : (
          <p className="-mt-4 text-[13px]" style={{ color: s.muted }}>
            {labels.tap}
          </p>
        )}
      </AnimatePresence>
      {open && (
        <button
          type="button"
          onClick={() => setState((x) => ({ index: null, round: x.round + 1 }))}
          className="mt-6 min-h-11 rounded-full border px-5 text-[13px] cursor-pointer"
          style={{ borderColor: s.line, color: s.ink }}
        >
          {labels.another}
        </button>
      )}
    </section>
  )
}

/** Fortune cookie drawn as a folded crescent; `half` draws one side of the crack. */
function CookieShape({ half }: { half?: "left" | "right" }) {
  const clip =
    half === "left"
      ? "inset(0 50% 0 0)"
      : half === "right"
        ? "inset(0 0 0 50%)"
        : undefined
  return (
    <svg
      viewBox="0 0 160 112"
      className={half ? "h-full w-[200%]" : "h-full w-full"}
      style={{
        clipPath: clip,
        marginLeft: half === "right" ? "-100%" : undefined,
      }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ck" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0c77d" />
          <stop offset="1" stopColor="#c48a3a" />
        </linearGradient>
      </defs>
      <path
        d="M8 74 C 20 18, 140 18, 152 74 C 128 62, 104 70, 80 100 C 56 70, 32 62, 8 74 Z"
        fill="url(#ck)"
      />
      <path
        d="M80 100 C 78 70, 80 46, 80 34"
        stroke="#a46f2a"
        strokeWidth="2"
        fill="none"
        opacity="0.6"
      />
    </svg>
  )
}
