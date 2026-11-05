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
import { photoUrl, type ImgKey } from "../../../lib/images"
import type { Lang } from "../../../lib/i18n"
import type { CinematicSceneProps } from "./types"

/**
 * THE LIVING EDITORIAL
 *
 * A photography-led luxury editorial 3D invitation for The Treasure Capture Events.
 *
 * Palette tokens:
 * - Warm ivory background: #FCF8F7
 * - Pale blush surface: #F3E8E9
 * - Ruby accent: #AA1027
 * - Deeper ruby interaction state: #870C20
 * - Charcoal text: #211E20
 * - Muted grey text: #777174
 * - Fine border: #E8DEDF
 * - Accent gold: #C5A059
 *
 * Master 6-Phase Timeline:
 * 1. loading: Initial layout mounts
 * 2. ready: Folio rests diagonally on blush ground with wrapped ruby ribbon & monogram
 * 3. unwrapping: Ribbon unloops at crossing point, curves outwards, settles on surface
 * 4. opening: Folio cover swings open on spine (rotateY: -130deg), revealing inner display ledge
 * 5. composing: 3 photographic prints lift & glide into an editorial gallery composition; light beam sweeps
 * 6. reading: Seamless handoff to crystal-clear HTML reading surface with zero duplicate text
 */

export type EditorialPhase =
  | "loading"
  | "ready"
  | "unwrapping"
  | "opening"
  | "composing"
  | "reading"

const editorialCopy = {
  masthead: {
    en: "THE LIVING EDITORIAL · FINE ART COLLECTION",
    ta: "தி லிவிங் எடிட்டோரியல் · கலைப்படைப்புத் தொகுப்பு",
  },
  studioName: {
    en: "The Treasure Capture Events",
    ta: "தி ட்ரெஷர் கேப்சர் ஈவென்ட்ஸ்",
  },
  invitationLabel: {
    en: "Fine Art Wedding Invitation",
    ta: "திருமண மங்கள அழைப்பிதழ்",
  },
  togetherWith: {
    en: "Together with their families, cordially invite you to celebrate the wedding ceremony of",
    ta: "குடும்பத்தார் மற்றும் நல்உள்ளங்கள் முன்னிலையில் நடைபெறும் திருமண நல்வரவு",
  },
  parentsLabel: {
    en: "With the blessings of parents",
    ta: "பெற்றோர்களின் நல்லாசிகளுடன்",
  },
  openInvitation: {
    en: "Open invitation folio",
    ta: "அழைப்பிதழைத் திறக்க",
  },
  skip: {
    en: "Skip to details",
    ta: "நேரடியாகப் பார்க்க",
  },
  replay: {
    en: "Replay opening",
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
    en: "Awaiting the Auspicious Day",
    ta: "சுபநாளை எதிர்நோக்கி",
  },
  celebrationDay: {
    en: "Today is the Celebration Day!",
    ta: "இன்று திருமண நன்னாள்!",
  },
  galleryTitle: {
    en: "Curated Studio Portfolio",
    ta: "நிழற்படத் தொகுப்பு",
  },
  gallerySubtitle: {
    en: "Captured in natural light with fine-art tonal grading",
    ta: "இயற்கை ஒளியில் உருவான நளின தருணங்கள்",
  },
  heroCaption: {
    en: "Focal Portrait · Golden Hour Glow",
    ta: "முதன்மை நிழற்படம் · பொன் மாலை ஒளி",
  },
  detailCaption: {
    en: "Intimate Details · Rings & Vows",
    ta: "மங்கலப் பதிவுகள் · மோதிரம் & ஆசிகள்",
  },
  ambientCaption: {
    en: "Atmospheric Radiance · Warm Evening",
    ta: "மாலை நல்வெளிச்சம் · தீபங்கள் & ஆனந்தம்",
  },
  close: {
    en: "Close",
    ta: "மூடு",
  },
  days: { en: "Days", ta: "நாட்கள்" },
  hours: { en: "Hours", ta: "மணிகள்" },
  minutes: { en: "Mins", ta: "நிமிடங்கள்" },
  seconds: { en: "Secs", ta: "வினாடிகள்" },
}

export function LivingEditorial(props: CinematicSceneProps) {
  const { invite, lang, still, size, share, onReady, sample, art } = props
  const id = useId()
  const prefersReduced = useReducedMotion()
  const reduce = prefersReduced || still

  // State machine: loading -> ready -> unwrapping -> opening -> composing -> reading
  const [phase, setPhase] = useState<EditorialPhase>(() =>
    reduce || size ? "reading" : "loading",
  )
  const [sheet, setSheet] = useState<"map" | "share" | null>(null)
  const [cd, setCd] = useState(() => countdown(invite))

  // Subtle pointer parallax (-2deg to +2deg) in ready state
  const [parallax, setParallax] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  })
  const stageRef = useRef<HTMLDivElement>(null)

  // Countdown timer
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

  // Master timeline driver when user triggers opening
  useEffect(() => {
    if (phase === "unwrapping") {
      const t1 = window.setTimeout(() => setPhase("opening"), 1100)
      return () => clearTimeout(t1)
    }
    if (phase === "opening") {
      const t2 = window.setTimeout(() => setPhase("composing"), 1400)
      return () => clearTimeout(t2)
    }
    if (phase === "composing") {
      const t3 = window.setTimeout(() => setPhase("reading"), 2200)
      return () => clearTimeout(t3)
    }
  }, [phase])

  // Desktop pointer parallax
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (phase !== "ready" || reduce) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setParallax({ x: x * 2, y: y * 2 })
  }

  const handlePointerLeave = () => {
    setParallax({ x: 0, y: 0 })
  }

  const startOpening = () => {
    if (phase === "ready") {
      setPhase("unwrapping")
    }
  }

  const skipToDetails = () => {
    setPhase("reading")
  }

  const replay = () => {
    setPhase("ready")
  }

  // Calendar .ics download
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
      "PRODID:-//The Treasure Capture Events//The Living Editorial//EN",
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
        /* share dismissed or rejected */
      }
    }
    setSheet("share")
  }

  // Image assets: couple portraits & fine-art prints
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

  // Date and location formatting
  const dParts = dateParts(invite.date, lang)
  const muhurthamTime = timeLabel(invite.time, lang)
  const rsvp = rsvpUrl(invite, lang)
  const mapsUrl = directionsUrl(invite)

  const isReading = phase === "reading"
  const isAnimating =
    phase === "unwrapping" || phase === "opening" || phase === "composing"

  // Print container dimensions for 1080px export or responsive layout
  const containerStyle: CSSProperties = size
    ? {
        width: `${size.w}px`,
        height: `${size.h}px`,
        maxWidth: `${size.w}px`,
        maxHeight: `${size.h}px`,
      }
    : { minHeight: "100vh" }

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
      {/* Background Architectural Studio Atmosphere */}
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-1000"
        aria-hidden="true"
      >
        {/* Soft studio directional light from top-left */}
        <div
          className="absolute -top-[20%] -left-[10%] h-[140%] w-[120%]"
          style={{
            background:
              "radial-gradient(ellipse at 30% 20%, rgba(255, 255, 255, 0.95) 0%, rgba(243, 232, 233, 0.6) 45%, rgba(232, 222, 223, 0.45) 85%)",
          }}
        />

        {/* Diagonal soft shadow of a tall studio window */}
        <div
          className="absolute inset-0 opacity-25 mix-blend-multiply"
          style={{
            background:
              "linear-gradient(125deg, transparent 0%, transparent 40%, rgba(33, 30, 32, 0.04) 42%, rgba(33, 30, 32, 0.08) 55%, transparent 60%)",
          }}
        />

        {/* Tactile paper grain pattern */}
        <svg className="absolute inset-0 h-full w-full opacity-15" xmlns="http://www.w3.org/2000/svg">
          <filter id={`editorial-grain-${id}`}>
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.75"
              numOctaves="3"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect
            width="100%"
            height="100%"
            filter={`url(#editorial-grain-${id})`}
          />
        </svg>

        {/* Blush table surface horizon edge */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[48%] border-t border-[#E8DEDF]/70"
          style={{
            backgroundColor: "#F3E8E9",
            opacity: 0.6,
          }}
        />
      </div>

      {/* Top Header Bar: Editorial Studio Monogram & Controls */}
      <header className="relative z-30 mx-auto flex max-w-7xl items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center space-x-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#AA1027]/30 bg-[#FCF8F7] text-xs font-semibold tracking-wider text-[#AA1027] shadow-sm">
            {initial1}·{initial2}
          </span>
          <div>
            <p className="font-sans text-[10px] font-semibold tracking-[0.2em] uppercase text-[#777174]">
              {editorialCopy.studioName[lang]}
            </p>
            <p className="text-xs tracking-wider text-[#211E20]/80">
              {editorialCopy.masthead[lang]}
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
             * OPENING 3D FOLIO EXPERIENCE (Desktop Split / Mobile Centered)
             * ========================================================================= */
            <motion.div
              key="opening-scene"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.6 } }}
              className="grid min-h-[calc(100vh-140px)] grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-8"
            >
              {/* Left Column: Editorial Announcement & Open Trigger */}
              <div className="flex flex-col items-center text-center lg:col-span-5 lg:items-start lg:text-left pt-4 lg:pt-0">
                <div className="inline-flex items-center space-x-2 rounded-full border border-[#E8DEDF] bg-white/70 px-3.5 py-1 backdrop-blur-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#AA1027]" />
                  <span className="font-sans text-[11px] font-medium tracking-[0.16em] uppercase text-[#777174]">
                    {editorialCopy.invitationLabel[lang]}
                  </span>
                </div>

                <h1 className="mt-6 text-4xl font-normal leading-[1.08] tracking-tight text-[#211E20] sm:text-5xl lg:text-6xl">
                  <span>{invite[lang][0]}</span>
                  <span className="mx-2 font-sans font-light italic text-[#AA1027]">
                    &amp;
                  </span>
                  <span>{invite[lang][1]}</span>
                </h1>

                <p className="mt-4 max-w-md font-sans text-xs leading-relaxed text-[#777174] sm:text-sm">
                  {editorialCopy.togetherWith[lang]}
                </p>

                {invite.parents && (
                  <p className="mt-2 max-w-md font-sans text-[11px] italic text-[#777174]/90">
                    {editorialCopy.parentsLabel[lang]}: {invite.parents[lang]}
                  </p>
                )}

                {/* Primary Interaction Buttons */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                  <button
                    type="button"
                    onClick={startOpening}
                    disabled={isAnimating}
                    aria-label={editorialCopy.openInvitation[lang]}
                    className="group relative inline-flex items-center space-x-2.5 rounded-full bg-[#AA1027] px-7 py-3.5 text-sm font-medium tracking-wide text-white shadow-lg shadow-[#AA1027]/20 transition-all duration-300 hover:bg-[#870C20] hover:shadow-xl hover:shadow-[#AA1027]/30 focus-visible:ring-2 focus-visible:ring-[#AA1027] focus-visible:ring-offset-2 disabled:opacity-60 cursor-pointer"
                  >
                    <span>{editorialCopy.openInvitation[lang]}</span>
                    <Icon
                      name="arrowRight"
                      size={15}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </button>

                  <button
                    type="button"
                    onClick={skipToDetails}
                    aria-label={editorialCopy.skip[lang]}
                    className="inline-flex items-center rounded-full border border-[#E8DEDF] bg-white/80 px-4 py-3 font-sans text-xs font-medium text-[#777174] transition hover:border-[#AA1027]/40 hover:text-[#211E20] focus-visible:ring-2 focus-visible:ring-[#AA1027] cursor-pointer"
                  >
                    {editorialCopy.skip[lang]}
                  </button>
                </div>

                {/* Event summary chips */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-[#777174] lg:justify-start">
                  <div className="flex items-center space-x-1.5">
                    <Icon name="calendar" size={13} className="text-[#AA1027]" />
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

              {/* Right Column: 3D Editorial Folio & Prints */}
              <div
                className="relative flex items-center justify-center lg:col-span-7 py-6 sm:py-12"
                style={{ perspective: "1400px" }}
              >
                {/* 3D Folio Root Component */}
                <div
                  className="relative transition-transform duration-500 ease-out"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: `rotateX(${16 + parallax.y * 3}deg) rotateY(${-12 + parallax.x * 4}deg) rotateZ(2deg)`,
                  }}
                >
                  {/* Surrounding loose prints partly beneath the folio */}
                  {/* Print A: Detail Shot (tilted left) */}
                  <motion.div
                    animate={
                      phase === "composing"
                        ? {
                            x: -160,
                            y: 40,
                            rotateZ: -12,
                            scale: 1.05,
                            opacity: 1,
                          }
                        : {
                            x: -60,
                            y: 50,
                            rotateZ: -9,
                            scale: 0.95,
                            opacity: 0.9,
                          }
                    }
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute -left-12 -bottom-10 z-0 w-44 rounded-sm bg-white p-2.5 shadow-xl transition-shadow"
                    style={{
                      boxShadow:
                        "0 18px 36px -8px rgba(33, 30, 32, 0.22), 0 6px 12px -4px rgba(33, 30, 32, 0.12)",
                    }}
                  >
                    <div className="relative aspect-square w-full overflow-hidden bg-[#F3E8E9]">
                      <img
                        src={candidPhoto}
                        alt="Candid wedding rings"
                        className="h-full w-full object-cover"
                        loading="eager"
                      />
                    </div>
                    <p className="mt-2 text-center font-sans text-[8px] tracking-wider text-[#777174]">
                      SERIES NO. 02 · DETAILS
                    </p>
                  </motion.div>

                  {/* Print B: Atmospheric Lights (tilted right) */}
                  <motion.div
                    animate={
                      phase === "composing"
                        ? {
                            x: 180,
                            y: -30,
                            rotateZ: 14,
                            scale: 1.05,
                            opacity: 1,
                          }
                        : {
                            x: 70,
                            y: -20,
                            rotateZ: 8,
                            scale: 0.94,
                            opacity: 0.88,
                          }
                    }
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute -right-12 -top-8 z-0 w-48 rounded-sm bg-white p-2.5 shadow-xl transition-shadow"
                    style={{
                      boxShadow:
                        "0 20px 40px -10px rgba(33, 30, 32, 0.24), 0 8px 16px -6px rgba(33, 30, 32, 0.14)",
                    }}
                  >
                    <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#F3E8E9]">
                      <img
                        src={ambientPhoto}
                        alt="Atmospheric warm lights"
                        className="h-full w-full object-cover"
                        loading="eager"
                      />
                    </div>
                    <p className="mt-2 text-center font-sans text-[8px] tracking-wider text-[#777174]">
                      SERIES NO. 03 · EVENING
                    </p>
                  </motion.div>

                  {/* Base / Back Tray of the Folio */}
                  <div
                    className="relative z-10 h-[430px] w-[310px] sm:h-[480px] sm:w-[350px] rounded-lg bg-[#FCF8F7] p-5 border border-[#E8DEDF]"
                    style={{
                      boxShadow:
                        "0 32px 64px -14px rgba(33, 30, 32, 0.26), 0 12px 28px -6px rgba(33, 30, 32, 0.14), inset 0 0 0 1px rgba(255, 255, 255, 0.8)",
                    }}
                  >
                    {/* Inner recessed passe-partout / photo mount */}
                    <div className="relative h-full w-full rounded-md border border-[#E8DEDF] bg-white/95 p-4 shadow-inner flex flex-col items-center justify-between">
                      {/* Inside Headpiece */}
                      <div className="text-center">
                        <span className="font-sans text-[9px] tracking-[0.25em] uppercase text-[#777174]">
                          FINE ART FOLIO EDITION
                        </span>
                        <div className="mx-auto mt-1 h-px w-10 bg-[#AA1027]/30" />
                      </div>

                      {/* Focal Hero Photograph Inside Mount */}
                      <div className="relative aspect-[3/4] w-full max-w-[240px] overflow-hidden rounded-xs border border-[#E8DEDF]/80 bg-[#F3E8E9] shadow-sm">
                        <img
                          src={heroPhoto}
                          alt="Couple wedding portrait"
                          className="h-full w-full object-cover"
                          loading="eager"
                        />
                        {/* Shimmer light sweep when composing */}
                        {phase === "composing" && (
                          <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: "200%" }}
                            transition={{ duration: 1.4, ease: "easeInOut" }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                            style={{ transform: "skewX(-25deg)" }}
                          />
                        )}
                      </div>

                      {/* Inside Caption */}
                      <div className="text-center font-sans text-[10px] text-[#777174]">
                        <p className="font-serif italic text-sm text-[#211E20]">
                          {invite[lang][0]} &amp; {invite[lang][1]}
                        </p>
                        <p className="tracking-wider uppercase text-[8px] mt-0.5">
                          {dParts.day} {dParts.month} {dParts.year}
                        </p>
                      </div>
                    </div>

                    {/* Folio Front Cover (Hinged on the left spine) */}
                    <motion.div
                      animate={
                        phase === "opening" || phase === "composing"
                          ? { rotateY: -135 }
                          : { rotateY: 0 }
                      }
                      transition={{
                        duration: 1.3,
                        ease: [0.25, 1, 0.5, 1],
                      }}
                      className="absolute inset-0 z-20 origin-left rounded-lg border border-[#E8DEDF] bg-[#FCF8F7] p-6 shadow-2xl backface-hidden cursor-pointer"
                      onClick={startOpening}
                      style={{
                        transformStyle: "preserve-3d",
                        backfaceVisibility: "hidden",
                        backgroundImage:
                          "radial-gradient(circle at 50% 30%, rgba(255, 255, 255, 0.9), rgba(252, 248, 247, 0.95))",
                        boxShadow:
                          phase === "ready"
                            ? "0 28px 56px -12px rgba(33, 30, 32, 0.22), 0 8px 20px -4px rgba(33, 30, 32, 0.12)"
                            : "0 10px 25px -5px rgba(33, 30, 32, 0.15)",
                      }}
                    >
                      {/* Linen Grain on Front Cover */}
                      <div className="pointer-events-none absolute inset-0 rounded-lg opacity-25">
                        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
                          <filter id={`linen-${id}`}>
                            <feTurbulence
                              type="fractalNoise"
                              baseFrequency="0.8"
                              numOctaves="2"
                              stitchTiles="stitch"
                            />
                            <feColorMatrix type="saturate" values="0" />
                          </filter>
                          <rect
                            width="100%"
                            height="100%"
                            filter={`url(#linen-${id})`}
                          />
                        </svg>
                      </div>

                      {/* Recessed Cover Window with Small Couple Portrait */}
                      <div className="relative mx-auto mt-3 aspect-square w-32 sm:w-36 overflow-hidden rounded-xs border border-[#E8DEDF] bg-white p-2 shadow-inner">
                        <img
                          src={heroPhoto}
                          alt="Cover portrait"
                          className="h-full w-full object-cover filter contrast-[1.02]"
                        />
                      </div>

                      {/* Debossed Typography on Front Cover */}
                      <div className="relative mt-8 text-center">
                        <p className="font-sans text-[9px] font-medium tracking-[0.24em] uppercase text-[#777174]">
                          {editorialCopy.studioName[lang]}
                        </p>
                        <h2 className="mt-2 text-2xl font-normal tracking-tight text-[#211E20] sm:text-3xl">
                          {invite[lang][0]} &amp; {invite[lang][1]}
                        </h2>
                        <div className="mx-auto my-2.5 h-px w-12 bg-[#AA1027]/40" />
                        <p className="font-sans text-[10px] tracking-widest uppercase text-[#777174]">
                          {dParts.day} · {dParts.month} · {dParts.year}
                        </p>
                      </div>

                      {/* Monogram Seal on Cover */}
                      <div className="absolute bottom-5 left-1/2 -translate-x-1/2">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#C5A059]/60 bg-gradient-to-br from-[#FFFDF9] to-[#F5EFE3] text-xs font-semibold text-[#870C20] shadow-sm">
                          {initial1} &amp; {initial2}
                        </div>
                      </div>

                      {/* -----------------------------------------------------------
                       * RUBY SATIN RIBBON (Wrapped around folio, unloops on trigger)
                       * ----------------------------------------------------------- */}
                      <AnimatePresence>
                        {phase !== "opening" && phase !== "composing" && (
                          <motion.div
                            key="ribbon-assembly"
                            initial={{ opacity: 1 }}
                            exit={{ opacity: 0, transition: { duration: 0.8 } }}
                            className="pointer-events-none absolute inset-0 overflow-visible"
                          >
                            {/* Horizontal Ribbon Band */}
                            <motion.div
                              animate={
                                phase === "unwrapping"
                                  ? {
                                      scaleX: 0,
                                      opacity: 0,
                                      transition: { duration: 0.8, ease: "easeIn" },
                                    }
                                  : { scaleX: 1, opacity: 1 }
                              }
                              className="absolute top-1/2 left-0 right-0 h-9 -translate-y-1/2 bg-gradient-to-r from-[#870C20] via-[#AA1027] to-[#870C20] shadow-md border-y border-[#AA1027]/30"
                            />

                            {/* Vertical Ribbon Band */}
                            <motion.div
                              animate={
                                phase === "unwrapping"
                                  ? {
                                      scaleY: 0,
                                      opacity: 0,
                                      transition: { duration: 0.8, ease: "easeIn" },
                                    }
                                  : { scaleY: 1, opacity: 1 }
                              }
                              className="absolute top-0 bottom-0 left-1/2 w-9 -translate-x-1/2 bg-gradient-to-b from-[#870C20] via-[#AA1027] to-[#870C20] shadow-md border-x border-[#AA1027]/30"
                            />

                            {/* Center Rosette Knot & Wax Seal */}
                            <motion.div
                              animate={
                                phase === "unwrapping"
                                  ? {
                                      scale: 1.4,
                                      opacity: 0,
                                      rotateZ: 45,
                                      transition: { duration: 0.7, ease: "easeOut" },
                                    }
                                  : { scale: 1, opacity: 1, rotateZ: 0 }
                              }
                              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                            >
                              <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#C41E3A] via-[#AA1027] to-[#6E0B1A] text-white shadow-xl ring-2 ring-[#F3E8E9]/60">
                                <span className="font-serif text-sm font-semibold tracking-wider">
                                  {initial1}&amp;{initial2}
                                </span>
                                {/* Satin ribbon tails */}
                                <div className="absolute -bottom-4 -left-2 h-7 w-3 origin-top rotate-15 rounded-xs bg-[#AA1027] shadow-sm" />
                                <div className="absolute -bottom-4 -right-2 h-7 w-3 origin-top -rotate-15 rounded-xs bg-[#AA1027] shadow-sm" />
                              </div>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* =========================================================================
             * READING STATE (Sharp Editorial Layout, Zero Duplicate Text, Rich Actions)
             * ========================================================================= */
            <motion.div
              key="reading-surface"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-12 sm:space-y-16"
            >
              {/* Studio Announcement Header */}
              <div className="mx-auto max-w-3xl text-center pt-2">
                <div className="inline-flex items-center space-x-2 rounded-full border border-[#E8DEDF] bg-white/80 px-4 py-1 backdrop-blur-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#AA1027]" />
                  <span className="font-sans text-[11px] font-medium tracking-[0.2em] uppercase text-[#777174]">
                    {editorialCopy.invitationLabel[lang]}
                  </span>
                </div>

                <p className="mt-4 font-sans text-xs tracking-wider uppercase text-[#777174]">
                  {editorialCopy.togetherWith[lang]}
                </p>

                {/* Names */}
                <h1 className="mt-3 text-5xl font-normal leading-[1.05] tracking-tight text-[#211E20] sm:text-6xl md:text-7xl">
                  <span>{invite[lang][0]}</span>
                  <span className="mx-3 font-sans font-light italic text-[#AA1027]">
                    &amp;
                  </span>
                  <span>{invite[lang][1]}</span>
                </h1>

                {invite.parents && (
                  <p className="mt-3 font-sans text-xs italic text-[#777174]">
                    {editorialCopy.parentsLabel[lang]}: {invite.parents[lang]}
                  </p>
                )}
              </div>

              {/* Central Information Grid: Date, Venue, Countdown */}
              <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
                {/* 1. Auspicious Muhurtham */}
                <div className="flex flex-col justify-between rounded-xl border border-[#E8DEDF] bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                  <div>
                    <div className="flex items-center space-x-2 text-[#AA1027]">
                      <Icon name="calendar" size={16} />
                      <span className="font-sans text-[10px] font-bold tracking-[0.2em] uppercase text-[#777174]">
                        {editorialCopy.muhurtham[lang]}
                      </span>
                    </div>
                    <p className="mt-4 text-2xl font-medium text-[#211E20]">
                      {dParts.weekday}
                    </p>
                    <p className="mt-1 text-3xl font-light text-[#AA1027]">
                      {dParts.day} {dParts.month} {dParts.year}
                    </p>
                    <p className="mt-2 font-sans text-xs text-[#777174]">
                      {muhurthamTime} (IST)
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={downloadCalendarIcs}
                    aria-label={editorialCopy.calendar[lang]}
                    className="mt-6 inline-flex items-center space-x-2 rounded-full border border-[#E8DEDF] bg-[#FCF8F7] px-3.5 py-2 font-sans text-xs font-medium text-[#211E20] transition hover:border-[#AA1027]/40 hover:bg-white cursor-pointer"
                  >
                    <Icon name="calendar" size={13} className="text-[#AA1027]" />
                    <span>{editorialCopy.calendar[lang]}</span>
                  </button>
                </div>

                {/* 2. Venue & Location */}
                <div className="flex flex-col justify-between rounded-xl border border-[#E8DEDF] bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                  <div>
                    <div className="flex items-center space-x-2 text-[#AA1027]">
                      <Icon name="mapPin" size={16} />
                      <span className="font-sans text-[10px] font-bold tracking-[0.2em] uppercase text-[#777174]">
                        {editorialCopy.venue[lang]}
                      </span>
                    </div>
                    <p className="mt-4 text-xl font-medium leading-snug text-[#211E20]">
                      {invite.venue}
                    </p>
                    {invite.address && (
                      <p className="mt-2 font-sans text-xs leading-relaxed text-[#777174]">
                        {invite.address}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {mapsUrl && (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1.5 rounded-full border border-[#E8DEDF] bg-[#FCF8F7] px-3.5 py-2 font-sans text-xs font-medium text-[#211E20] transition hover:border-[#AA1027]/40 hover:bg-white"
                      >
                        <Icon name="mapPin" size={13} className="text-[#AA1027]" />
                        <span>{editorialCopy.directions[lang]}</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setSheet("map")}
                      aria-label={editorialCopy.mapQr[lang]}
                      className="inline-flex items-center space-x-1.5 rounded-full border border-[#E8DEDF] bg-[#FCF8F7] px-3.5 py-2 font-sans text-xs font-medium text-[#211E20] transition hover:border-[#AA1027]/40 hover:bg-white cursor-pointer"
                    >
                      <Icon name="grid" size={13} className="text-[#AA1027]" />
                      <span>{editorialCopy.mapQr[lang]}</span>
                    </button>
                  </div>
                </div>

                {/* 3. Live Countdown Ticker */}
                <div className="flex flex-col justify-between rounded-xl border border-[#E8DEDF] bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                  <div>
                    <div className="flex items-center space-x-2 text-[#AA1027]">
                      <Icon name="clock" size={16} />
                      <span className="font-sans text-[10px] font-bold tracking-[0.2em] uppercase text-[#777174]">
                        {editorialCopy.countdownLabel[lang]}
                      </span>
                    </div>

                    {cd.done ? (
                      <div className="mt-6 text-center">
                        <p className="text-xl font-medium text-[#AA1027]">
                          {editorialCopy.celebrationDay[lang]}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-5 grid grid-cols-4 gap-2 text-center">
                        <div className="rounded-md bg-[#FCF8F7] p-2 border border-[#E8DEDF]/60">
                          <p className="text-2xl font-light text-[#211E20]">
                            {cd.days}
                          </p>
                          <p className="font-sans text-[9px] uppercase text-[#777174]">
                            {editorialCopy.days[lang]}
                          </p>
                        </div>
                        <div className="rounded-md bg-[#FCF8F7] p-2 border border-[#E8DEDF]/60">
                          <p className="text-2xl font-light text-[#211E20]">
                            {cd.hours}
                          </p>
                          <p className="font-sans text-[9px] uppercase text-[#777174]">
                            {editorialCopy.hours[lang]}
                          </p>
                        </div>
                        <div className="rounded-md bg-[#FCF8F7] p-2 border border-[#E8DEDF]/60">
                          <p className="text-2xl font-light text-[#211E20]">
                            {cd.minutes}
                          </p>
                          <p className="font-sans text-[9px] uppercase text-[#777174]">
                            {editorialCopy.minutes[lang]}
                          </p>
                        </div>
                        <div className="rounded-md bg-[#FCF8F7] p-2 border border-[#E8DEDF]/60">
                          <p className="text-2xl font-light text-[#AA1027]">
                            {cd.seconds}
                          </p>
                          <p className="font-sans text-[9px] uppercase text-[#777174]">
                            {editorialCopy.seconds[lang]}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    {rsvp && (
                      <a
                        href={rsvp}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-full items-center justify-center space-x-2 rounded-full bg-[#AA1027] px-4 py-2.5 font-sans text-xs font-semibold text-white shadow-md shadow-[#AA1027]/20 transition-all hover:bg-[#870C20] hover:shadow-lg focus-visible:ring-2 focus-visible:ring-[#AA1027]"
                      >
                        <Icon name="whatsapp" size={14} />
                        <span>{editorialCopy.rsvp[lang]}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Curated Editorial Photo Lookbook */}
              <section className="mx-auto max-w-5xl pt-4">
                <div className="text-center mb-8">
                  <p className="font-sans text-[10px] font-bold tracking-[0.24em] uppercase text-[#AA1027]">
                    {editorialCopy.galleryTitle[lang]}
                  </p>
                  <p className="mt-1 font-sans text-xs text-[#777174]">
                    {editorialCopy.gallerySubtitle[lang]}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-12 items-start">
                  {/* Print 1: Hero Focal Shot (spanning 7 cols) */}
                  <div className="sm:col-span-7 rounded-lg border border-[#E8DEDF] bg-white p-3.5 shadow-md">
                    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xs bg-[#F3E8E9]">
                      <img
                        src={heroPhoto}
                        alt="Hero couple portrait"
                        className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.02]"
                        loading="lazy"
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between font-sans text-[11px] text-[#777174]">
                      <span>{editorialCopy.heroCaption[lang]}</span>
                      <span className="italic">Plate 01</span>
                    </div>
                  </div>

                  {/* Right side: 2 stacked detailed prints (spanning 5 cols) */}
                  <div className="sm:col-span-5 space-y-6">
                    {/* Print 2: Detail Print */}
                    <div className="rounded-lg border border-[#E8DEDF] bg-white p-3 shadow-md">
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xs bg-[#F3E8E9]">
                        <img
                          src={candidPhoto}
                          alt="Detail rings print"
                          className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.02]"
                          loading="lazy"
                        />
                      </div>
                      <div className="mt-2.5 flex items-center justify-between font-sans text-[10px] text-[#777174]">
                        <span>{editorialCopy.detailCaption[lang]}</span>
                        <span className="italic">Plate 02</span>
                      </div>
                    </div>

                    {/* Print 3: Ambient Print */}
                    <div className="rounded-lg border border-[#E8DEDF] bg-white p-3 shadow-md">
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xs bg-[#F3E8E9]">
                        <img
                          src={ambientPhoto}
                          alt="Ambient evening lights"
                          className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.02]"
                          loading="lazy"
                        />
                      </div>
                      <div className="mt-2.5 flex items-center justify-between font-sans text-[10px] text-[#777174]">
                        <span>{editorialCopy.ambientCaption[lang]}</span>
                        <span className="italic">Plate 03</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Action Toolbar & Replay Footer */}
              <div className="mx-auto flex max-w-xl flex-wrap items-center justify-center gap-3 pt-6 border-t border-[#E8DEDF]/80">
                <button
                  type="button"
                  onClick={handleShare}
                  aria-label={editorialCopy.share[lang]}
                  className="inline-flex items-center space-x-2 rounded-full border border-[#E8DEDF] bg-white px-5 py-2.5 font-sans text-xs font-medium text-[#211E20] shadow-xs transition hover:border-[#AA1027]/40 hover:bg-[#FCF8F7] focus-visible:ring-2 focus-visible:ring-[#AA1027] cursor-pointer"
                >
                  <Icon name="share" size={14} className="text-[#AA1027]" />
                  <span>{editorialCopy.share[lang]}</span>
                </button>

                <button
                  type="button"
                  onClick={replay}
                  aria-label={editorialCopy.replay[lang]}
                  className="inline-flex items-center space-x-2 rounded-full border border-[#E8DEDF] bg-white px-5 py-2.5 font-sans text-xs font-medium text-[#211E20] shadow-xs transition hover:border-[#AA1027]/40 hover:bg-[#FCF8F7] focus-visible:ring-2 focus-visible:ring-[#AA1027] cursor-pointer"
                >
                  <Icon name="refresh" size={14} className="text-[#AA1027]" />
                  <span>{editorialCopy.replay[lang]}</span>
                </button>

                {share}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* =========================================================================
       * MODAL / BOTTOM SHEET: MAP & QR CODE
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
                aria-label={editorialCopy.close[lang]}
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
                  text={mapsUrl || (typeof window !== "undefined" ? window.location.href : "")}
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
                aria-label={editorialCopy.close[lang]}
                className="absolute right-4 top-4 rounded-full p-1 text-[#777174] hover:bg-[#E8DEDF]/50 hover:text-[#211E20] focus-visible:ring-2 focus-visible:ring-[#AA1027] cursor-pointer"
              >
                <Icon name="x" size={16} />
              </button>

              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#AA1027]/10 text-[#AA1027]">
                <Icon name="share" size={18} />
              </div>

              <h3 className="mt-3 text-xl font-medium text-[#211E20]">
                {editorialCopy.share[lang]}
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
