import {
  useState,
  useId,
  useEffect,
  useRef,
  type ReactNode,
  type CSSProperties,
} from "react"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"
import { Icon } from "../../../components/Icon"
import { LangToggle } from "../../../components/layout/Nav"
import { Qr } from "../../../components/Qr"
import {
  countdown,
  dateParts,
  directionsUrl,
  rsvpUrl,
  timeLabel,
  whatsappShareUrl,
  type Invite,
} from "../../../lib/invite"
import { photoUrl } from "../../../lib/images"
import type { Lang } from "../../../lib/i18n"
import type { CinematicSceneProps } from "./types"

/**
 * THE IMPOSSIBLE FRAME
 *
 * A contemporary sculptural 3D invitation experience for The Treasure Capture Events.
 *
 * The central visual is one continuous sculptural ruby ribbon that transforms through
 * a choreographed 5-phase sequence:
 *
 * 1. loading: Assets initialize
 * 2. ready: The sculptural ruby ribbon rests in a closed monogram loop on an ivory studio ground
 * 3. unwinding: The ribbon releases, curves lengthen and separate with smooth authored motion
 * 4. aperture: The ribbon curls into an outer circular frame while precision ruby blades form
 *    a camera aperture iris that opens to reveal the customer photograph
 * 5. alignment: Inversion & parallax — three slim spatial frames (names/photo, date/time, venue)
 *    glide and lock their ruby edges into one continuous fine border
 * 6. reading: Seamless handoff to crystal-clear HTML invitation layer with zero duplicate text,
 *    and the ribbon settles into a sculptural corner accent
 *
 * Palette Tokens:
 * - Warm ivory: #FCF8F7
 * - Pale blush: #F3E8E9
 * - Deep ruby: #AA1027
 * - Dark ruby: #870C20
 * - Charcoal: #211E20
 * - Muted grey: #777174
 */

export type ImpossiblePhase =
  | "loading"
  | "ready"
  | "unwinding"
  | "aperture"
  | "alignment"
  | "reading"

const frameCopy = {
  masthead: {
    en: "THE IMPOSSIBLE FRAME · FINE ART SCULPTURE",
    ta: "தி இம்பாசிபிள் ஃபிரேம் · சிற்பக்கலை அழைப்பிதழ்",
  },
  studioName: {
    en: "The Treasure Capture Events",
    ta: "தி ட்ரெஷர் கேப்சர் ஈவென்ட்ஸ்",
  },
  invitationLabel: {
    en: "Ceremonial Wedding Invitation",
    ta: "திருமண மங்கள அழைப்பிதழ்",
  },
  togetherWith: {
    en: "Together with their loving families, cordially invite you to celebrate the marriage of",
    ta: "குடும்பத்தார் மற்றும் சுற்றத்தார் முன்னிலையில் நடைபெறும் திருமண நல்வரவு",
  },
  parentsLabel: {
    en: "With the blessings of parents",
    ta: "பெற்றோர்களின் நல்லாசிகளுடன்",
  },
  revealAction: {
    en: "Reveal invitation",
    ta: "அழைப்பிதழைத் திறக்க",
  },
  skip: {
    en: "Skip to details",
    ta: "நேரடியாகப் பார்க்க",
  },
  replay: {
    en: "Replay transformation",
    ta: "மீண்டும் பார்க்க",
  },
  directions: {
    en: "Directions",
    ta: "வழித்தடம்",
  },
  rsvp: {
    en: "RSVP via WhatsApp",
    ta: "வாட்ஸ்அப் வருகை உறுதி",
  },
  mapQr: {
    en: "Venue Map & QR",
    ta: "வரைபடம் & QR",
  },
  share: {
    en: "Share invite",
    ta: "பகிரவும்",
  },
  calendar: {
    en: "Add to calendar",
    ta: "நாள்காட்டியில் சேர்க்க",
  },
  muhurtham: {
    en: "Auspicious Muhurtham",
    ta: "சுப முகூர்த்தம்",
  },
  venue: {
    en: "Ceremonial Venue",
    ta: "திருமண மண்டபம்",
  },
  countdownLabel: {
    en: "Countdown to Celebration",
    ta: "சுபநாளை எதிர்நோக்கி",
  },
  celebrationDay: {
    en: "Today is the Auspicious Day!",
    ta: "இன்று திருமண நன்னாள்!",
  },
  frameOneCaption: {
    en: "Plate I · The Union",
    ta: "பிரிவு I · இணைவு",
  },
  frameTwoCaption: {
    en: "Plate II · Muhurtham Hour",
    ta: "பிரிவு II · சுப முகூர்த்தம்",
  },
  frameThreeCaption: {
    en: "Plate III · The Venue",
    ta: "பிரிவு III · திருமண மண்டபம்",
  },
  close: {
    en: "Close",
    ta: "மூடு",
  },
  days: { en: "Days", ta: "நாட்கள்" },
  hours: { en: "Hours", ta: "Hrs" },
  minutes: { en: "Mins", ta: "Mins" },
  seconds: { en: "Secs", ta: "Secs" },
}

export function ImpossibleFrame(props: CinematicSceneProps) {
  const { invite, lang, still, size, share, onReady, sample, art } = props
  const id = useId()
  const prefersReduced = useReducedMotion()
  const reduce = prefersReduced || still

  // State machine: loading -> ready -> unwinding -> aperture -> alignment -> reading
  const [phase, setPhase] = useState<ImpossiblePhase>(() =>
    reduce || size ? "reading" : "loading",
  )
  const [sheet, setSheet] = useState<"map" | "share" | null>(null)
  const [cd, setCd] = useState(() => countdown(invite))

  // Pointer parallax (-2deg to +2deg) for desktop idle response
  const [parallax, setParallax] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  })
  const stageRef = useRef<HTMLDivElement>(null)

  // Countdown timer interval
  useEffect(() => {
    setCd(countdown(invite))
    const timer = window.setInterval(() => {
      setCd(countdown(invite))
    }, 1000)
    return () => clearInterval(timer)
  }, [invite])

  // Lifecycle & ready trigger
  useEffect(() => {
    if (reduce || size) {
      setPhase("reading")
      onReady?.()
      return
    }
    const timer = window.setTimeout(() => {
      setPhase("ready")
      onReady?.()
    }, 280)
    return () => clearTimeout(timer)
  }, [reduce, size, onReady])

  // Coordinated timeline driver: 7 seconds total choreographed sequence
  useEffect(() => {
    if (phase === "unwinding") {
      // Phase A: Ribbon unwinds (1.6s)
      const t1 = window.setTimeout(() => setPhase("aperture"), 1600)
      return () => clearTimeout(t1)
    }
    if (phase === "aperture") {
      // Phase B: Aperture blades assemble and open (2.0s)
      const t2 = window.setTimeout(() => setPhase("alignment"), 2000)
      return () => clearTimeout(t2)
    }
    if (phase === "alignment") {
      // Phase C & D: Spatial frames separate, rotate & align ruby borders (2.4s)
      const t3 = window.setTimeout(() => setPhase("reading"), 2400)
      return () => clearTimeout(t3)
    }
  }, [phase])

  // Desktop subtle pointer parallax
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (phase !== "ready" || reduce) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setParallax({ x: x * 2.2, y: y * 2.2 })
  }

  const handlePointerLeave = () => {
    setParallax({ x: 0, y: 0 })
  }

  const startReveal = () => {
    if (phase === "ready") {
      setPhase("unwinding")
    }
  }

  const skipToDetails = () => {
    setPhase("reading")
  }

  const replay = () => {
    setPhase("ready")
  }

  // Calendar .ics generator
  const downloadCalendarIcs = () => {
    const [year, month, day] = invite.date.split("-")
    const [hour, minute] = invite.time.split(":")
    const pad = (n: string | number) => String(n).padStart(2, "0")
    const dtStart = `${year}${pad(month)}${pad(day)}T${pad(hour)}${pad(minute)}00`
    const dtEnd = `${year}${pad(month)}${pad(day)}T${pad(Number(hour) + 3)}${pad(minute)}00`
    const title = `${invite.en[0]} & ${invite.en[1]} Wedding Celebration`
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//The Treasure Capture Events//The Impossible Frame//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `SUMMARY:${title}`,
      `DESCRIPTION:${invite.venue}${invite.address ? " - " + invite.address : ""}`,
      `LOCATION:${invite.venue}${invite.address ? ", " + invite.address : ""}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n")

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `${invite.en[0]}-${invite.en[1]}-wedding.ics`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const handleShare = async () => {
    const url = window.location.href
    const title = `${invite[lang][0]} & ${invite[lang][1]} Wedding Invitation`
    if (navigator.share) {
      try {
        await navigator.share({ title, text: title, url })
        return
      } catch {
        /* share dismissed */
      }
    }
    setSheet("share")
  }

  // Photography selection (supporting 0, 1, or multiple photos)
  const heroPhoto =
    art ||
    (invite.caricature
      ? invite.caricature
      : photoUrl("m_couple_field", 900, 1100))
  const candidPhoto = photoUrl("m_hands_rings", 700, 700)
  const ambientPhoto = photoUrl("m_couple_lights", 800, 1000)

  // Monogram initials
  const initial1 = (invite.en[0].trim()[0] || "A").toUpperCase()
  const initial2 = (invite.en[1].trim()[0] || "B").toUpperCase()

  // Formatted date and time
  const dParts = dateParts(invite.date, lang)
  const muhurthamTime = timeLabel(invite.time, lang)
  const rsvp = rsvpUrl(invite, lang)
  const mapsUrl = directionsUrl(invite)

  const isReading = phase === "reading"
  const isAnimating =
    phase === "unwinding" || phase === "aperture" || phase === "alignment"

  // Print container dimensions for 1080px export or responsive layout
  const containerStyle: CSSProperties = size
    ? {
        width: `${size.w}px`,
        height: `${size.h}px`,
        maxWidth: `${size.w}px`,
        maxHeight: `${size.h}px`,
      }
    : { minHeight: "100vh" }

  // 6 camera aperture blades (each blade rotated by 60deg around center)
  const apertureBlades = [0, 1, 2, 3, 4, 5]

  return (
    <div
      ref={stageRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative w-full overflow-hidden text-[#211E20] selection:bg-[#AA1027] selection:text-white"
      style={{
        ...containerStyle,
        backgroundColor: "#FCF8F7",
        fontFamily:
          lang === "ta"
            ? "'Noto Serif Tamil', 'Cormorant Garamond', serif"
            : "'Cormorant Garamond', Georgia, serif",
      }}
    >
      {/* =========================================================================
       * STUDIO ENVIRONMENT & LIGHTING
       * ========================================================================= */}
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-1000"
        aria-hidden="true"
      >
        {/* Soft directional studio light from top-left */}
        <div
          className="absolute -top-[25%] -left-[15%] h-[150%] w-[130%]"
          style={{
            background:
              "radial-gradient(ellipse at 35% 25%, rgba(255, 255, 255, 0.98) 0%, rgba(243, 232, 233, 0.55) 50%, rgba(232, 222, 223, 0.35) 90%)",
          }}
        />

        {/* Subtle horizon line dividing ivory wall and blush exhibition surface */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[46%] border-t border-[#E8DEDF]/60"
          style={{
            backgroundColor: "#F3E8E9",
            opacity: 0.5,
          }}
        />

        {/* Diagonal soft studio shadow */}
        <div
          className="absolute inset-0 opacity-20 mix-blend-multiply"
          style={{
            background:
              "linear-gradient(135deg, transparent 35%, rgba(33, 30, 32, 0.03) 45%, rgba(33, 30, 32, 0.08) 58%, transparent 70%)",
          }}
        />

        {/* Tactile fine paper grain texture */}
        <svg
          className="absolute inset-0 h-full w-full opacity-12"
          xmlns="http://www.w3.org/2000/svg"
        >
          <filter id={`frame-grain-${id}`}>
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.8"
              numOctaves="3"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect
            width="100%"
            height="100%"
            filter={`url(#frame-grain-${id})`}
          />
        </svg>
      </div>

      {/* Top Header Bar: Small Studio Wordmark & Language Toggle */}
      <header className="relative z-30 mx-auto flex max-w-7xl items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center space-x-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#AA1027]/40 bg-[#FCF8F7] text-xs font-semibold tracking-wider text-[#AA1027] shadow-xs">
            {initial1}·{initial2}
          </span>
          <div>
            <p className="font-sans text-[10px] font-semibold tracking-[0.22em] uppercase text-[#777174]">
              {frameCopy.studioName[lang]}
            </p>
            <p className="text-xs tracking-wider text-[#211E20]/80">
              {frameCopy.masthead[lang]}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {sample && (
            <span className="hidden rounded-full border border-[#AA1027]/25 bg-[#AA1027]/5 px-2.5 py-0.5 font-sans text-[11px] font-medium text-[#AA1027] sm:inline-block">
              Sample Preview
            </span>
          )}
          <LangToggle />
        </div>
      </header>

      {/* Main Interactive Stage */}
      <main className="relative z-20 mx-auto max-w-7xl px-4 sm:px-8 pb-16">
        <AnimatePresence mode="wait">
          {!isReading ? (
            /* =========================================================================
             * 3D SCULPTURAL SEQUENCE (Desktop Split / Mobile Centered)
             * ========================================================================= */
            <motion.div
              key="3d-sculpture-stage"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.6 } }}
              className="grid min-h-[calc(100vh-140px)] grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-8"
            >
              {/* Left Column: Typographic Introduction & Reveal Action */}
              <div className="flex flex-col items-center text-center lg:col-span-5 lg:items-start lg:text-left pt-4 lg:pt-0">
                <div className="inline-flex items-center space-x-2 rounded-full border border-[#E8DEDF] bg-white/75 px-3.5 py-1 backdrop-blur-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#AA1027]" />
                  <span className="font-sans text-[11px] font-medium tracking-[0.18em] uppercase text-[#777174]">
                    {frameCopy.invitationLabel[lang]}
                  </span>
                </div>

                <h1 className="mt-6 text-4xl font-normal leading-[1.06] tracking-tight text-[#211E20] sm:text-5xl lg:text-6xl">
                  <span>{invite[lang][0]}</span>
                  <span className="mx-2.5 font-sans font-light italic text-[#AA1027]">
                    &amp;
                  </span>
                  <span>{invite[lang][1]}</span>
                </h1>

                <p className="mt-4 max-w-md font-sans text-xs leading-relaxed text-[#777174] sm:text-sm">
                  {frameCopy.togetherWith[lang]}
                </p>

                {invite.parents && (
                  <p className="mt-2 max-w-md font-sans text-[11px] italic text-[#777174]/90">
                    {frameCopy.parentsLabel[lang]}: {invite.parents[lang]}
                  </p>
                )}

                {/* Primary Action Button */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                  <button
                    type="button"
                    onClick={startReveal}
                    disabled={isAnimating}
                    aria-label={frameCopy.revealAction[lang]}
                    className="group relative inline-flex items-center space-x-2.5 rounded-full bg-[#AA1027] px-7 py-3.5 text-sm font-medium tracking-wide text-white shadow-lg shadow-[#AA1027]/20 transition-all duration-300 hover:bg-[#870C20] hover:shadow-xl hover:shadow-[#AA1027]/30 focus-visible:ring-2 focus-visible:ring-[#AA1027] focus-visible:ring-offset-2 disabled:opacity-60 cursor-pointer active:scale-95"
                  >
                    <span>{frameCopy.revealAction[lang]}</span>
                    <Icon
                      name="arrowRight"
                      size={15}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </button>

                  <button
                    type="button"
                    onClick={skipToDetails}
                    aria-label={frameCopy.skip[lang]}
                    className="inline-flex items-center rounded-full border border-[#E8DEDF] bg-white/80 px-4 py-3 font-sans text-xs font-medium text-[#777174] transition hover:border-[#AA1027]/40 hover:text-[#211E20] focus-visible:ring-2 focus-visible:ring-[#AA1027] cursor-pointer"
                  >
                    {frameCopy.skip[lang]}
                  </button>
                </div>

                {/* Essential Event Metadata Chips */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-[#777174] lg:justify-start">
                  <div className="flex items-center space-x-1.5">
                    <Icon
                      name="calendar"
                      size={13}
                      className="text-[#AA1027]"
                    />
                    <span>
                      {dParts.day} {dParts.month} {dParts.year}
                    </span>
                  </div>
                  <span className="text-[#E8DEDF]">|</span>
                  <div className="flex items-center space-x-1.5">
                    <Icon name="clock" size={13} className="text-[#AA1027]" />
                    <span>{muhurthamTime}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: 3D Sculptural Ribbon & Aperture Transformation */}
              <div
                className="relative flex items-center justify-center lg:col-span-7 py-6 sm:py-10"
                style={{ perspective: "1400px" }}
              >
                {/* 3D Root Rig */}
                <motion.div
                  className="relative flex items-center justify-center transition-transform duration-500 ease-out"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: `rotateX(${14 + parallax.y * 2.5}deg) rotateY(${-10 + parallax.x * 3.5}deg)`,
                  }}
                >
                  {/* Studio Plinth Shadow */}
                  <div
                    className="pointer-events-none absolute -bottom-14 h-16 w-80 rounded-full blur-xl opacity-40"
                    style={{
                      background:
                        "radial-gradient(ellipse at center, rgba(135, 12, 32, 0.45) 0%, rgba(33, 30, 32, 0.2) 50%, transparent 80%)",
                    }}
                  />

                  {/* -----------------------------------------------------------------
                   * 1. HERO SCULPTURE: THE CONTINUOUS RUBY RIBBON MONOGRAM
                   * ----------------------------------------------------------------- */}
                  <AnimatePresence>
                    {(phase === "ready" || phase === "unwinding") && (
                      <motion.div
                        key="sculpture-monogram"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={
                          phase === "unwinding"
                            ? {
                                scale: 1.15,
                                rotateZ: 35,
                                opacity: 0.2,
                                transition: { duration: 1.5, ease: "easeInOut" },
                              }
                            : { scale: 1, rotateZ: 0, opacity: 1 }
                        }
                        exit={{ opacity: 0, transition: { duration: 0.5 } }}
                        className="relative z-10 flex h-[360px] w-[320px] sm:h-[420px] sm:w-[380px] items-center justify-center"
                      >
                        {/* Sculptural Ribbon SVG with Rectangular Cross-Section & Satin Finish */}
                        <svg
                          viewBox="0 0 400 400"
                          className="h-full w-full filter drop-shadow-[0_24px_36px_rgba(135,12,32,0.28)]"
                        >
                          <defs>
                            {/* Rich Ruby Satin-Lacquer Gradient */}
                            <linearGradient
                              id={`ruby-satin-${id}`}
                              x1="0%"
                              y1="0%"
                              x2="100%"
                              y2="100%"
                            >
                              <stop offset="0%" stopColor="#C41E3A" />
                              <stop offset="35%" stopColor="#AA1027" />
                              <stop offset="75%" stopColor="#870C20" />
                              <stop offset="100%" stopColor="#5E0814" />
                            </linearGradient>

                            {/* Specular Ribbon Highlight */}
                            <linearGradient
                              id={`ruby-specular-${id}`}
                              x1="0%"
                              y1="50%"
                              x2="100%"
                              y2="50%"
                            >
                              <stop
                                offset="0%"
                                stopColor="white"
                                stopOpacity="0.45"
                              />
                              <stop
                                offset="40%"
                                stopColor="white"
                                stopOpacity="0.1"
                              />
                              <stop
                                offset="100%"
                                stopColor="white"
                                stopOpacity="0"
                              />
                            </linearGradient>
                          </defs>

                          {/* Outer Continuous Ribbon Loop (Upper & Lower Intertwined Folds) */}
                          <path
                            d="M 200,60 C 290,60 340,130 330,200 C 320,270 260,330 200,330 C 140,330 80,270 70,200 C 60,130 110,60 200,60 Z"
                            fill="none"
                            stroke={`url(#ruby-satin-${id})`}
                            strokeWidth="32"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />

                          {/* Specular Highlight along Outer Ridge */}
                          <path
                            d="M 200,60 C 290,60 340,130 330,200 C 320,270 260,330 200,330 C 140,330 80,270 70,200 C 60,130 110,60 200,60 Z"
                            fill="none"
                            stroke={`url(#ruby-specular-${id})`}
                            strokeWidth="6"
                            strokeLinecap="round"
                          />

                          {/* Intertwined Monogram Loop crossing through center */}
                          <path
                            d="M 130,130 C 180,180 220,220 270,270 C 310,230 310,170 270,130 C 220,180 180,220 130,270"
                            fill="none"
                            stroke={`url(#ruby-satin-${id})`}
                            strokeWidth="24"
                            strokeLinecap="round"
                          />
                        </svg>

                        {/* Central Typographic Medallion with Crisp Initials */}
                        <motion.div
                          animate={
                            phase === "unwinding"
                              ? { scale: 0, opacity: 0 }
                              : { scale: 1, opacity: 1 }
                          }
                          transition={{ duration: 0.8 }}
                          className="absolute flex h-24 w-24 flex-col items-center justify-center rounded-full border-2 border-[#AA1027] bg-[#FCF8F7] p-2 text-center shadow-xl ring-4 ring-[#AA1027]/10"
                        >
                          <span className="font-serif text-2xl font-semibold tracking-wider text-[#AA1027]">
                            {initial1} &amp; {initial2}
                          </span>
                          <span className="font-sans text-[7px] tracking-[0.2em] uppercase text-[#777174]">
                            CEREMONY
                          </span>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* -----------------------------------------------------------------
                   * 2. PHOTOGRAPHIC APERTURE (Phase B: Aperture Iris Assembly)
                   * ----------------------------------------------------------------- */}
                  <AnimatePresence>
                    {(phase === "aperture" || phase === "alignment") && (
                      <motion.div
                        key="aperture-iris"
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={
                          phase === "alignment"
                            ? {
                                scale: 1.25,
                                opacity: 0,
                                transition: { duration: 0.9 },
                              }
                            : { scale: 1, opacity: 1 }
                        }
                        exit={{ opacity: 0 }}
                        className="relative z-20 flex h-[340px] w-[340px] items-center justify-center rounded-full border-4 border-[#AA1027] bg-white p-3 shadow-2xl"
                      >
                        {/* Revealed Customer Photograph inside Aperture Window */}
                        <div className="relative h-64 w-64 overflow-hidden rounded-full bg-[#F3E8E9] shadow-inner">
                          <img
                            src={heroPhoto}
                            alt="Revealed wedding photograph"
                            className="h-full w-full object-cover filter contrast-[1.03]"
                            loading="eager"
                          />
                        </div>

                        {/* 6 Precision Ruby Aperture Blades (Mechanical Camera Iris) */}
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden rounded-full">
                          {apertureBlades.map((bladeIndex) => {
                            const angle = bladeIndex * 60
                            return (
                              <motion.div
                                key={`blade-${bladeIndex}`}
                                initial={{
                                  rotate: angle,
                                  x: 0,
                                  y: 0,
                                }}
                                animate={{
                                  rotate: angle + 36,
                                  x: Math.cos((angle * Math.PI) / 180) * 85,
                                  y: Math.sin((angle * Math.PI) / 180) * 85,
                                }}
                                transition={{
                                  duration: 1.6,
                                  ease: [0.16, 1, 0.3, 1],
                                }}
                                className="absolute h-36 w-44 rounded-l-full border border-white/30"
                                style={{
                                  background:
                                    "linear-gradient(135deg, #C41E3A 0%, #AA1027 40%, #870C20 85%, #5E0814 100%)",
                                  transformOrigin: "center right",
                                  boxShadow:
                                    "0 8px 16px -2px rgba(33, 30, 32, 0.4)",
                                }}
                              />
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* -----------------------------------------------------------------
                   * 3. THE 3 SPATIAL FRAMES (Phase C & D: Parallax & Edge Alignment)
                   * ----------------------------------------------------------------- */}
                  <AnimatePresence>
                    {phase === "alignment" && (
                      <motion.div
                        key="spatial-frames-alignment"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="relative z-30 flex items-center justify-center gap-3"
                        style={{ transformStyle: "preserve-3d" }}
                      >
                        {/* Frame 1: Focal Photo Frame */}
                        <motion.div
                          initial={{ x: -140, z: -100, rotateY: 20 }}
                          animate={{ x: 0, z: 0, rotateY: 0 }}
                          transition={{
                            duration: 1.8,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          className="h-72 w-52 rounded-sm border-2 border-[#AA1027] bg-white p-2 shadow-2xl"
                        >
                          <div className="h-full w-full overflow-hidden bg-[#F3E8E9]">
                            <img
                              src={heroPhoto}
                              alt="Focal frame photograph"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </motion.div>

                        {/* Frame 2: Temporal Date Frame */}
                        <motion.div
                          initial={{ x: 0, z: -50, rotateY: 0 }}
                          animate={{ x: 0, z: 0, rotateY: 0 }}
                          transition={{
                            duration: 1.8,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          className="flex h-72 w-52 flex-col justify-between rounded-sm border-2 border-[#AA1027] bg-[#FCF8F7] p-4 text-center shadow-2xl"
                        >
                          <p className="font-sans text-[9px] tracking-widest uppercase text-[#777174]">
                            AUSPICIOUS MUHURTHAM
                          </p>
                          <div>
                            <p className="text-xl font-medium text-[#211E20]">
                              {dParts.weekday}
                            </p>
                            <p className="text-3xl font-light text-[#AA1027]">
                              {dParts.day} {dParts.month}
                            </p>
                            <p className="text-xs font-light text-[#777174]">
                              {dParts.year}
                            </p>
                          </div>
                          <p className="font-sans text-[10px] text-[#777174]">
                            {muhurthamTime} (IST)
                          </p>
                        </motion.div>

                        {/* Frame 3: Spatial Venue Frame */}
                        <motion.div
                          initial={{ x: 140, z: 50, rotateY: -20 }}
                          animate={{ x: 0, z: 0, rotateY: 0 }}
                          transition={{
                            duration: 1.8,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          className="flex h-72 w-52 flex-col justify-between rounded-sm border-2 border-[#AA1027] bg-[#FCF8F7] p-4 text-center shadow-2xl"
                        >
                          <p className="font-sans text-[9px] tracking-widest uppercase text-[#777174]">
                            CEREMONIAL VENUE
                          </p>
                          <p className="text-lg font-medium leading-snug text-[#211E20]">
                            {invite.venue}
                          </p>
                          <p className="font-sans text-[10px] text-[#777174]">
                            {invite.address || "Tamil Nadu, India"}
                          </p>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            /* =========================================================================
             * FINAL READING STATE (Sharp Editorial Layout & Continuous Ruby Border)
             * ========================================================================= */
            <motion.div
              key="reading-editorial-surface"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative mx-auto max-w-5xl rounded-2xl border-2 border-[#AA1027] bg-white p-6 sm:p-10 shadow-2xl"
            >
              {/* Sculptural Ruby Ribbon Accent in Top-Right Corner */}
              <div
                className="pointer-events-none absolute -top-4 -right-4 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#C41E3A] via-[#AA1027] to-[#870C20] text-white shadow-lg ring-4 ring-[#FCF8F7]"
                title="The Impossible Frame Seal"
              >
                <span className="font-serif text-sm font-semibold tracking-wider">
                  {initial1}&amp;{initial2}
                </span>
              </div>

              {/* Editorial Header */}
              <div className="text-center pt-2">
                <div className="inline-flex items-center space-x-2 rounded-full border border-[#E8DEDF] bg-[#FCF8F7] px-4 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#AA1027]" />
                  <span className="font-sans text-[11px] font-medium tracking-[0.2em] uppercase text-[#777174]">
                    {frameCopy.invitationLabel[lang]}
                  </span>
                </div>

                <p className="mt-4 font-sans text-xs tracking-wider uppercase text-[#777174]">
                  {frameCopy.togetherWith[lang]}
                </p>

                {/* Couple Names */}
                <h1 className="mt-3 text-5xl font-normal leading-[1.05] tracking-tight text-[#211E20] sm:text-6xl md:text-7xl">
                  <span>{invite[lang][0]}</span>
                  <span className="mx-3 font-sans font-light italic text-[#AA1027]">
                    &amp;
                  </span>
                  <span>{invite[lang][1]}</span>
                </h1>

                {invite.parents && (
                  <p className="mt-3 font-sans text-xs italic text-[#777174]">
                    {frameCopy.parentsLabel[lang]}: {invite.parents[lang]}
                  </p>
                )}

                {/* Fine Ruby Rule */}
                <div className="mx-auto my-6 h-0.5 w-24 bg-gradient-to-r from-transparent via-[#AA1027] to-transparent" />
              </div>

              {/* 3 Aligned Editorial Plates (Architecture of the Inversion) */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-12 items-stretch mt-6">
                {/* Plate 1: Photograph Plate (spanning 5 cols) */}
                <div className="sm:col-span-5 flex flex-col justify-between rounded-xl border border-[#E8DEDF] bg-[#FCF8F7] p-3.5 shadow-sm">
                  <div className="relative aspect-[4/5] w-full overflow-hidden rounded-md bg-[#F3E8E9]">
                    <img
                      src={heroPhoto}
                      alt="Ceremonial couple portrait"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between font-sans text-[11px] text-[#777174]">
                    <span>{frameCopy.frameOneCaption[lang]}</span>
                    <span className="italic">{invite[lang][0]} &amp; {invite[lang][1]}</span>
                  </div>
                </div>

                {/* Plate 2 & 3: Muhurtham & Venue (spanning 7 cols) */}
                <div className="sm:col-span-7 flex flex-col justify-between space-y-6">
                  {/* Plate 2: Auspicious Muhurtham */}
                  <div className="flex-1 rounded-xl border border-[#E8DEDF] bg-[#FCF8F7] p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center space-x-2 text-[#AA1027]">
                        <Icon name="calendar" size={16} />
                        <span className="font-sans text-[10px] font-bold tracking-[0.2em] uppercase text-[#777174]">
                          {frameCopy.muhurtham[lang]}
                        </span>
                      </div>
                      <p className="mt-3 text-2xl font-medium text-[#211E20]">
                        {dParts.weekday}
                      </p>
                      <p className="text-3xl font-light text-[#AA1027]">
                        {dParts.day} {dParts.month} {dParts.year}
                      </p>
                      <p className="mt-1 font-sans text-xs text-[#777174]">
                        {muhurthamTime} (IST)
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={downloadCalendarIcs}
                        aria-label={frameCopy.calendar[lang]}
                        className="inline-flex items-center space-x-2 rounded-full border border-[#E8DEDF] bg-white px-3.5 py-2 font-sans text-xs font-medium text-[#211E20] transition hover:border-[#AA1027]/40 hover:bg-[#FCF8F7] cursor-pointer"
                      >
                        <Icon
                          name="calendar"
                          size={13}
                          className="text-[#AA1027]"
                        />
                        <span>{frameCopy.calendar[lang]}</span>
                      </button>
                    </div>
                  </div>

                  {/* Plate 3: Ceremonial Venue */}
                  <div className="flex-1 rounded-xl border border-[#E8DEDF] bg-[#FCF8F7] p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center space-x-2 text-[#AA1027]">
                        <Icon name="mapPin" size={16} />
                        <span className="font-sans text-[10px] font-bold tracking-[0.2em] uppercase text-[#777174]">
                          {frameCopy.venue[lang]}
                        </span>
                      </div>
                      <p className="mt-3 text-xl font-medium text-[#211E20]">
                        {invite.venue}
                      </p>
                      {invite.address && (
                        <p className="mt-1 font-sans text-xs text-[#777174]">
                          {invite.address}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {mapsUrl && (
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1.5 rounded-full border border-[#E8DEDF] bg-white px-3.5 py-2 font-sans text-xs font-medium text-[#211E20] transition hover:border-[#AA1027]/40"
                        >
                          <Icon
                            name="mapPin"
                            size={13}
                            className="text-[#AA1027]"
                          />
                          <span>{frameCopy.directions[lang]}</span>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => setSheet("map")}
                        aria-label={frameCopy.mapQr[lang]}
                        className="inline-flex items-center space-x-1.5 rounded-full border border-[#E8DEDF] bg-white px-3.5 py-2 font-sans text-xs font-medium text-[#211E20] transition hover:border-[#AA1027]/40 cursor-pointer"
                      >
                        <Icon name="grid" size={13} className="text-[#AA1027]" />
                        <span>{frameCopy.mapQr[lang]}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Countdown Card & Primary RSVP Action */}
              <div className="mt-8 rounded-xl border border-[#E8DEDF] bg-[#FCF8F7] p-6 text-center">
                <p className="font-sans text-[10px] font-bold tracking-[0.2em] uppercase text-[#777174]">
                  {frameCopy.countdownLabel[lang]}
                </p>

                {cd.done ? (
                  <p className="mt-3 text-2xl font-medium text-[#AA1027]">
                    {frameCopy.celebrationDay[lang]}
                  </p>
                ) : (
                  <div className="mx-auto mt-4 grid max-w-md grid-cols-4 gap-3 text-center">
                    <div className="rounded-lg bg-white p-2.5 shadow-xs border border-[#E8DEDF]">
                      <p className="text-3xl font-light text-[#211E20]">
                        {cd.days}
                      </p>
                      <p className="font-sans text-[9px] uppercase text-[#777174]">
                        {frameCopy.days[lang]}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white p-2.5 shadow-xs border border-[#E8DEDF]">
                      <p className="text-3xl font-light text-[#211E20]">
                        {cd.hours}
                      </p>
                      <p className="font-sans text-[9px] uppercase text-[#777174]">
                        {frameCopy.hours[lang]}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white p-2.5 shadow-xs border border-[#E8DEDF]">
                      <p className="text-3xl font-light text-[#211E20]">
                        {cd.minutes}
                      </p>
                      <p className="font-sans text-[9px] uppercase text-[#777174]">
                        {frameCopy.minutes[lang]}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white p-2.5 shadow-xs border border-[#E8DEDF]">
                      <p className="text-3xl font-light text-[#AA1027]">
                        {cd.seconds}
                      </p>
                      <p className="font-sans text-[9px] uppercase text-[#777174]">
                        {frameCopy.seconds[lang]}
                      </p>
                    </div>
                  </div>
                )}

                {/* Primary WhatsApp RSVP Button */}
                {rsvp && (
                  <div className="mt-6 flex justify-center">
                    <a
                      href={rsvp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2.5 rounded-full bg-[#AA1027] px-8 py-3.5 font-sans text-sm font-semibold text-white shadow-lg shadow-[#AA1027]/25 transition hover:bg-[#870C20] hover:shadow-xl focus-visible:ring-2 focus-visible:ring-[#AA1027]"
                    >
                      <Icon name="whatsapp" size={16} />
                      <span>{frameCopy.rsvp[lang]}</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Action Toolbar & Replay Control */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 pt-6 border-t border-[#E8DEDF]">
                <button
                  type="button"
                  onClick={handleShare}
                  aria-label={frameCopy.share[lang]}
                  className="inline-flex items-center space-x-2 rounded-full border border-[#E8DEDF] bg-white px-5 py-2.5 font-sans text-xs font-medium text-[#211E20] shadow-xs transition hover:border-[#AA1027]/40 hover:bg-[#FCF8F7] focus-visible:ring-2 focus-visible:ring-[#AA1027] cursor-pointer"
                >
                  <Icon name="share" size={14} className="text-[#AA1027]" />
                  <span>{frameCopy.share[lang]}</span>
                </button>

                <button
                  type="button"
                  onClick={replay}
                  aria-label={frameCopy.replay[lang]}
                  className="inline-flex items-center space-x-2 rounded-full border border-[#E8DEDF] bg-white px-5 py-2.5 font-sans text-xs font-medium text-[#211E20] shadow-xs transition hover:border-[#AA1027]/40 hover:bg-[#FCF8F7] focus-visible:ring-2 focus-visible:ring-[#AA1027] cursor-pointer"
                >
                  <Icon name="refresh" size={14} className="text-[#AA1027]" />
                  <span>{frameCopy.replay[lang]}</span>
                </button>

                {share}
              </div>

              {/* PNG Still Export Representation (Deterministic for 1080px capture) */}
              {still && (
                <div className="mt-6 flex flex-col items-center justify-center p-4 border-t border-[#E8DEDF]">
                  <p className="font-sans text-[10px] tracking-widest uppercase text-[#777174]">
                    SCAN FOR CEREMONIAL LOCATION &amp; RSVP
                  </p>
                  <div className="mt-3 rounded-lg bg-white p-3 shadow-sm border border-[#E8DEDF]">
                    <Qr
                      text={mapsUrl || (typeof window !== "undefined" ? window.location.href : "")}
                      label="Ceremony Location QR Code"
                      size={150}
                      color="#211E20"
                      background="#FFFFFF"
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* =========================================================================
       * MODAL / BOTTOM SHEET: VENUE MAP & QR CODE
       * ========================================================================= */}
      <AnimatePresence>
        {sheet === "map" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#211E20]/60 p-4 backdrop-blur-xs"
            onClick={() => setSheet(null)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm rounded-2xl border border-[#E8DEDF] bg-[#FCF8F7] p-6 text-center shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setSheet(null)}
                aria-label={frameCopy.close[lang]}
                className="absolute right-4 top-4 rounded-full p-1 text-[#777174] hover:bg-[#E8DEDF]/50 hover:text-[#211E20] focus-visible:ring-2 focus-visible:ring-[#AA1027] cursor-pointer"
              >
                <Icon name="x" size={16} />
              </button>

              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#AA1027]/10 text-[#AA1027]">
                <Icon name="mapPin" size={18} />
              </div>

              <h3 className="mt-3 text-xl font-medium text-[#211E20]">
                {invite.venue}
              </h3>
              {invite.address && (
                <p className="mt-1 font-sans text-xs text-[#777174]">
                  {invite.address}
                </p>
              )}

              {/* QR Code Container */}
              <div className="mt-5 flex justify-center rounded-xl bg-white p-4 shadow-inner border border-[#E8DEDF]">
                <Qr
                  text={
                    mapsUrl ||
                    (typeof window !== "undefined" ? window.location.href : "")
                  }
                  label="Venue map QR code"
                  size={180}
                  color="#211E20"
                  background="#FFFFFF"
                />
              </div>
              <p className="mt-3 font-sans text-[11px] text-[#777174]">
                Scan with phone camera for directions
              </p>

              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex w-full items-center justify-center space-x-2 rounded-full bg-[#AA1027] px-4 py-2.5 font-sans text-xs font-semibold text-white shadow-md transition hover:bg-[#870C20]"
                >
                  <Icon name="mapPin" size={14} />
                  <span>Open in Google Maps</span>
                </a>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* MODAL / BOTTOM SHEET: SHARE LINK */}
        {sheet === "share" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#211E20]/60 p-4 backdrop-blur-xs"
            onClick={() => setSheet(null)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm rounded-2xl border border-[#E8DEDF] bg-[#FCF8F7] p-6 text-center shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setSheet(null)}
                aria-label={frameCopy.close[lang]}
                className="absolute right-4 top-4 rounded-full p-1 text-[#777174] hover:bg-[#E8DEDF]/50 hover:text-[#211E20] focus-visible:ring-2 focus-visible:ring-[#AA1027] cursor-pointer"
              >
                <Icon name="x" size={16} />
              </button>

              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#AA1027]/10 text-[#AA1027]">
                <Icon name="share" size={18} />
              </div>

              <h3 className="mt-3 text-xl font-medium text-[#211E20]">
                {frameCopy.share[lang]}
              </h3>

              <div className="mt-4 flex flex-col space-y-3">
                <a
                  href={whatsappShareUrl(
                    invite,
                    lang,
                    typeof window !== "undefined" ? window.location.href : ""
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center space-x-2 rounded-full bg-[#25D366] px-4 py-2.5 font-sans text-xs font-semibold text-white shadow-sm transition hover:opacity-90"
                >
                  <Icon name="whatsapp" size={14} />
                  <span>Share on WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href)
                    alert("Invitation link copied to clipboard!")
                  }}
                  className="inline-flex w-full items-center justify-center space-x-2 rounded-full border border-[#E8DEDF] bg-white px-4 py-2.5 font-sans text-xs font-medium text-[#211E20] transition hover:bg-[#FCF8F7] cursor-pointer"
                >
                  <span>Copy Link</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
