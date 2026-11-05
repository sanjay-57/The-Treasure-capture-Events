import {
  useState,
  useId,
  useEffect,
  useRef,
  type ReactNode,
  type CSSProperties,
} from "react"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"
import { Icon, type IconName } from "../../../components/Icon"
import { LangToggle } from "../../../components/layout/Nav"
import { Qr } from "../../../components/Qr"
import {
  countdown,
  dateParts,
  directionsUrl,
  inviteDay,
  rsvpUrl,
  timeLabel,
  whatsappShareUrl,
  type Invite,
} from "../../../lib/invite"
import { coupleUrl } from "../caricature"
import { Invocation } from "../story/motifs"
import type { Lang } from "../../../lib/i18n"
import type { CinematicSceneProps } from "./types"

/**
 * The Temple Atelier 3D Invitation
 *
 * A contemporary architectural exhibition of a miniature South Indian temple pavilion.
 * Presented as a luxury architectural model photographed for a design magazine:
 * - Floating rectangular stone plinth on a warm porcelain exhibition ground (#F5F1E8).
 * - Compact 3-bay sculptural pavilion with faceted columns, lotus capitals, and stepped roof.
 * - Shallow water channel with quiet reflections, floating jasmine buds, and asymmetric brass urli.
 * - Editorial split layout on desktop (names & open action on left, pavilion on right).
 * - One coordinated 5-stage timeline:
 *   Stage A: Tactile response & camera orbit toward pavilion entrance.
 *   Stage B: Sectional unfolding (upper roof lifts vertically, carved screen slides aside).
 *   Stage C: Keepsake folio rises from display ledge, rotating brass clasp, cover unfolds on hinge.
 *   Stage D: Seamless handoff from 3D folio to sharp editorial HTML content.
 *   Stage E: Stable, elegant reading state with full event details, directions, RSVP, and replay.
 */

type AtelierPhase = "loading" | "ready" | "opening" | "reading"

const atelierCopy = {
  exhibitionLabel: {
    en: "THE TEMPLE ATELIER · ARCHITECTURAL EXHIBITION",
    ta: "கோவில் சிற்பக்கூடம் · முப்பரிமாணக் கண்காட்சி",
  },
  ceremonialInvitation: {
    en: "Ceremonial Wedding Invitation",
    ta: "திருமண மங்கள அழைப்பிதழ்",
  },
  openInvitation: {
    en: "Open invitation",
    ta: "அழைப்பிதழைத் திறக்க",
  },
  skip: {
    en: "Skip to details",
    ta: "நேரடியாகப் பார்க்க",
  },
  replay: {
    en: "Replay exhibition",
    ta: "மீண்டும் பார்க்க",
  },
  directions: {
    en: "Directions",
    ta: "வழித்தடம்",
  },
  rsvp: {
    en: "RSVP via WhatsApp",
    ta: "வருகையை உறுதிப்படுத்த",
  },
  mapQr: {
    en: "Venue Map & QR",
    ta: "வரைபடம் & QR",
  },
  share: {
    en: "Share invite",
    ta: "பகிரவும்",
  },
  close: {
    en: "Close",
    ta: "மூடு",
  },
  muhurtham: {
    en: "Auspicious Muhurtham",
    ta: "சுப முகூர்த்தம்",
  },
  venue: {
    en: "Ceremonial Venue",
    ta: "திருமண மண்டபம்",
  },
  calendar: {
    en: "Add to calendar",
    ta: "நாள்காட்டியில் சேர்க்க",
  },
}

export function TempleHallway(props: CinematicSceneProps) {
  const { invite, lang, still, size, share, onReady, sample, art } = props
  const id = useId()
  const prefersReduced = useReducedMotion()
  const reduce = prefersReduced || still

  // State machine: loading -> ready -> opening -> reading
  const [phase, setPhase] = useState<AtelierPhase>(() =>
    reduce || size ? "reading" : "loading",
  )
  const [sheet, setSheet] = useState<"map" | "share" | null>(null)
  const [cd, setCd] = useState(() => countdown(invite))

  // Desktop subtle pointer parallax (-1.8deg to +1.8deg) in ready state
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

  // Master timeline duration: 7.2s
  useEffect(() => {
    if (phase !== "opening") return
    const timer = window.setTimeout(() => {
      setPhase("reading")
    }, 7200)
    return () => clearTimeout(timer)
  }, [phase])

  const handlePointerMove = (e: React.PointerEvent) => {
    if (phase !== "ready" || reduce || still || !stageRef.current) return
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

  const triggerOpen = () => {
    if (phase !== "ready") return
    if (reduce) {
      setPhase("reading")
      return
    }
    setPhase("opening")
  }

  const skipToReading = () => {
    setPhase("reading")
  }

  const replay = () => {
    setPhase("ready")
    setParallax({ x: 0, y: 0 })
  }

  // Calendar .ics download helper
  const downloadCalendarIcs = () => {
    // Three hours from the muhurtham (09:00 when no time was given), India time.
    const day = invite.date.replace(/-/g, "")
    const [h, m] = /^\d{1,2}:\d{2}$/.test(invite.time) ? invite.time.split(":").map(Number) : [9, 0]
    const at = (hh: number) => `${day}T${String(Math.min(23, hh)).padStart(2, "0")}${String(m).padStart(2, "0")}00`
    const esc = (v: string) => v.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n")
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//The Treasure Capture Events//Wedding Invite//EN",
      "BEGIN:VEVENT",
      `UID:${day}-${invite.en.join("-").replace(/\W+/g, "")}@thetreasurecapture`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
      `SUMMARY:${esc(`${invite[lang][0]} & ${invite[lang][1]} Wedding`)}`,
      `DESCRIPTION:${esc(`Wedding celebration of ${invite.en[0]} and ${invite.en[1]} at ${invite.venue}`)}`,
      `LOCATION:${esc([invite.venue, invite.address].filter(Boolean).join(", "))}`,
      `DTSTART;TZID=Asia/Kolkata:${at(h)}`,
      `DTEND;TZID=Asia/Kolkata:${at(h + 3)}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n")

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `${invite.en[0]}_${invite.en[1]}_wedding.ics`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const isReading = phase === "reading"
  const isOpening = phase === "opening"
  const isReady = phase === "ready"
  const d = dateParts(invite.date, lang)

  // Responsive stage styling
  const rootStyle: CSSProperties = size
    ? { width: size.w, height: size.h }
    : { minHeight: "100svh" }

  return (
    <div
      ref={stageRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative w-full bg-[#F5F1E8] text-[#232720] antialiased selection:bg-[#A7864A]/20 selection:text-[#232720] overflow-x-hidden"
      style={{
        ...rootStyle,
        fontFamily: "var(--font-sans, system-ui, sans-serif)",
      }}
    >
      {/* ─── Top Utility Navigation ─── */}
      {!size && !still && (
        <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-5 sm:px-8 py-4 backdrop-blur-md bg-[#F5F1E8]/70 border-b border-[#D8C9B3]/40">
          <div className="flex items-center gap-3">
            <span className="text-[10.5px] uppercase tracking-[0.22em] font-serif font-bold text-[#A7864A]">
              TTC · ATELIER
            </span>
            {sample && (
              <span className="rounded-full border border-[#D8C9B3] bg-[#EAE3D5] px-2.5 py-0.5 text-[10px] uppercase tracking-widest text-[#63705A] font-medium">
                Sample
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Skip action during opening */}
            {isOpening && (
              <button
                type="button"
                onClick={skipToReading}
                className="flex items-center gap-1.5 rounded-full border border-[#D8C9B3] bg-[#EAE3D5] px-3.5 py-1 text-xs font-serif font-medium text-[#232720] shadow-sm hover:border-[#A7864A] transition focus-visible:ring-2 focus-visible:ring-[#A7864A]"
              >
                <span>{atelierCopy.skip[lang]}</span>
                <Icon name="arrowRight" size={12} />
              </button>
            )}

            {/* Replay action when settled */}
            {isReading && !reduce && (
              <button
                type="button"
                onClick={replay}
                className="flex items-center gap-1.5 rounded-full border border-[#D8C9B3] bg-[#EAE3D5] px-3 py-1 text-xs font-serif font-medium text-[#63705A] hover:text-[#232720] hover:border-[#A7864A] transition focus-visible:ring-2 focus-visible:ring-[#A7864A]"
                title={atelierCopy.replay[lang]}
              >
                <Icon name="clock" size={12} />
                <span className="hidden sm:inline">{atelierCopy.replay[lang]}</span>
              </button>
            )}

            <LangToggle dark={false} />
          </div>
        </header>
      )}

      {/* ─── Main Content Container ─── */}
      <main className="relative z-10 w-full min-h-screen flex flex-col justify-center px-4 sm:px-8 lg:px-16 pt-20 pb-16">
        {/* Dynamic Split Layout: Transitioning from Exhibition to Reading */}
        <div
          className={`mx-auto w-full max-w-6xl transition-all duration-1000 ${
            isReading
              ? "grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start"
              : "grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center"
          }`}
        >
          {/* ─── Column A: Editorial Typography & Actions (Desktop Left, Mobile Lower) ─── */}
          <div
            className={`transition-all duration-700 ${
              isReading
                ? "order-2 lg:order-1 lg:col-span-7 flex flex-col gap-6"
                : "order-2 lg:order-1 lg:col-span-5 flex flex-col gap-4 text-center lg:text-left items-center lg:items-start"
            }`}
          >
            {/* Exhibition Subheading */}
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.28em] font-serif font-semibold text-[#A7864A]">
              {atelierCopy.exhibitionLabel[lang]}
            </p>

            {/* 1. READY / INITIAL VIEW: Refined Editorial Introduction */}
            {!isReading && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col gap-3 items-center lg:items-start"
              >
                <h1
                  className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#232720] tracking-tight leading-[1.12]"
                  style={{ fontFamily: "Cinzel, Cormorant Garamond, serif" }}
                >
                  <span>{invite[lang][0]}</span>
                  <span className="block text-xl sm:text-2xl font-light italic text-[#A7864A] my-1">
                    {lang === "ta" ? "திருமணம்" : "weds"}
                  </span>
                  <span>{invite[lang][1]}</span>
                </h1>

                {/* Event Summary Lockup */}
                <div className="flex items-center gap-2 text-xs sm:text-sm font-serif text-[#63705A] tracking-wider mt-1">
                  <span>{d.month} {d.day}, {d.year}</span>
                  <span>·</span>
                  <span>{invite.venue}</span>
                </div>

                {/* Tactical "Open Invitation" Button */}
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={triggerOpen}
                    disabled={isOpening}
                    aria-label={atelierCopy.openInvitation[lang]}
                    className="group relative inline-flex items-center gap-3 px-8 py-3.5 rounded-full text-sm font-serif font-semibold tracking-wider text-[#FAF7F0] bg-[#232720] shadow-lg shadow-[#232720]/15 hover:bg-[#A7864A] active:scale-95 transition-all duration-300 focus:outline-none focus-visible:ring-3 focus-visible:ring-[#A7864A] cursor-pointer"
                  >
                    <span>{atelierCopy.openInvitation[lang]}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A7864A] group-hover:bg-[#FAF7F0] transition-colors" />
                    <Icon name="arrowRight" size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* 2. READING STATE: Full Heirloom Editorial Invitation Card (Sharp HTML) */}
            {isReading && (
              <motion.section
                initial={reduce ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full bg-[#FAF7F0] rounded-3xl p-6 sm:p-10 border border-[#D8C9B3]/80 shadow-xl shadow-[#D8C9B3]/25 flex flex-col gap-7 relative overflow-hidden"
              >
                {/* Thin Brass Edge Line & Corner Filigrees */}
                <div className="absolute inset-0 pointer-events-none rounded-3xl border border-[#A7864A]/25 m-2" />
                <CornerOrnament position="top-left" instanceId={id} />
                <CornerOrnament position="top-right" instanceId={id} />
                <CornerOrnament position="bottom-left" instanceId={id} />
                <CornerOrnament position="bottom-right" instanceId={id} />

                {/* Blessing Invocation */}
                <div className="text-center">
                  {invite.tradition && invite.tradition !== "none" && (
                    <div className="mb-3 text-[13px]">
                      <Invocation tradition={invite.tradition} lang={lang} color="#A7864A" muted="#63705A" serif="Cinzel" />
                    </div>
                  )}
                  <p className="text-[11px] uppercase tracking-[0.25em] font-serif text-[#A7864A] font-semibold">
                    {atelierCopy.ceremonialInvitation[lang]}
                  </p>
                  {invite.parents && (
                    <p className="text-xs font-serif text-[#63705A] mt-1.5 italic">
                      {invite.parents[lang]}
                    </p>
                  )}
                </div>

                {/* Couple Names */}
                <div className="text-center py-2 border-y border-[#D8C9B3]/50">
                  <h2
                    className="text-3xl sm:text-4xl font-serif font-bold text-[#232720] tracking-wide"
                    style={{ fontFamily: "Cinzel, Cormorant Garamond, serif" }}
                  >
                    {invite[lang][0]}
                  </h2>
                  <div className="flex items-center justify-center gap-3 my-2">
                    <span className="h-px w-8 bg-[#A7864A]/40" />
                    <span className="text-xs uppercase tracking-[0.25em] font-serif text-[#A7864A]">
                      {lang === "ta" ? "திருமணம்" : "weds"}
                    </span>
                    <span className="h-px w-8 bg-[#A7864A]/40" />
                  </div>
                  <h2
                    className="text-3xl sm:text-4xl font-serif font-bold text-[#232720] tracking-wide"
                    style={{ fontFamily: "Cinzel, Cormorant Garamond, serif" }}
                  >
                    {invite[lang][1]}
                  </h2>
                  {invite.story && (
                    <p className="mx-auto mt-3 max-w-sm text-[13px] font-serif italic leading-relaxed text-[#63705A]">
                      {invite.story}
                    </p>
                  )}
                </div>

                {/* Date & Muhurtham Lockup */}
                <div className="grid grid-cols-2 gap-4 text-center py-2 bg-[#F5F1E8]/60 rounded-2xl p-4 border border-[#D8C9B3]/40">
                  <div className="flex flex-col items-center justify-center border-r border-[#D8C9B3]/60 pr-2">
                    <span className="text-[10px] uppercase tracking-widest font-serif text-[#63705A]">
                      {d.weekday}
                    </span>
                    <span className="text-2xl sm:text-3xl font-serif font-bold text-[#232720] my-0.5">
                      {d.day}
                    </span>
                    <span className="text-xs font-serif text-[#A7864A] font-medium">
                      {d.month} {d.year}
                    </span>
                  </div>

                  <div className="flex flex-col items-center justify-center pl-2">
                    <span className="text-[10px] uppercase tracking-widest font-serif text-[#63705A]">
                      {atelierCopy.muhurtham[lang]}
                    </span>
                    <span className="text-lg sm:text-xl font-serif font-bold text-[#232720] my-0.5">
                      {timeLabel(invite.time, lang)}
                    </span>
                    <span className="text-[10.5px] font-mono text-[#A7864A] tracking-wider">
                      {cd.done
                        ? lang === "ta"
                          ? "மங்கள நாள்"
                          : "Celebration Day"
                        : `${cd.days}d ${cd.hours}h ${cd.minutes}m ${cd.seconds}s`}
                    </span>
                  </div>
                </div>

                {/* The other functions (Nichayathartham, Mehendi, Reception…) in date order */}
                {!!invite.events?.length && (
                  <ol className="flex flex-col gap-2">
                    {[...invite.events]
                      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
                      .map((e, i) => (
                        <li key={i} className="flex items-baseline justify-between gap-3 border-b border-[#D8C9B3]/50 pb-2 last:border-b-0">
                          <span className="font-serif text-[14px] font-semibold text-[#232720]">{e.name}</span>
                          <span className="text-right text-[11.5px] font-serif text-[#63705A]">
                            {inviteDay(e.date, lang)}
                            {e.time ? ` · ${timeLabel(e.time, lang)}` : ""}
                            {e.venue && <span className="block">{e.venue}</span>}
                          </span>
                        </li>
                      ))}
                  </ol>
                )}

                {/* Venue & Location */}
                <div className="text-center flex flex-col items-center gap-1">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-serif text-[#63705A]">
                    {atelierCopy.venue[lang]}
                  </span>
                  <p className="text-lg sm:text-xl font-serif font-bold text-[#232720]">
                    {invite.venue}
                  </p>
                  {invite.address && (
                    <p className="text-xs font-serif text-[#63705A] max-w-md leading-relaxed">
                      {invite.address}
                    </p>
                  )}
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <a
                    href={directionsUrl(invite)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-serif font-semibold text-[#FAF7F0] bg-[#232720] hover:bg-[#A7864A] shadow-md transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A7864A]"
                  >
                    <Icon name="arrowUpRight" size={13} />
                    <span>{atelierCopy.directions[lang]}</span>
                  </a>

                  {rsvpUrl(invite, lang) && (
                    <a
                      href={rsvpUrl(invite, lang) ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-serif font-semibold text-[#232720] bg-[#FAF7F0] border border-[#A7864A] hover:bg-[#A7864A]/10 transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A7864A]"
                    >
                      <Icon name="phone" size={13} className="text-[#A7864A]" />
                      <span>{atelierCopy.rsvp[lang]}</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => setSheet("map")}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-serif font-medium text-[#63705A] bg-[#EAE3D5] hover:text-[#232720] hover:border-[#A7864A] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A7864A]"
                  >
                    <Icon name="mapPin" size={13} />
                    <span>{atelierCopy.mapQr[lang]}</span>
                  </button>

                  <button
                    type="button"
                    onClick={downloadCalendarIcs}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-serif font-medium text-[#63705A] bg-[#EAE3D5] hover:text-[#232720] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A7864A]"
                    title={atelierCopy.calendar[lang]}
                  >
                    <Icon name="calendar" size={13} />
                    <span className="hidden sm:inline">{atelierCopy.calendar[lang]}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSheet("share")}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-serif font-medium text-[#63705A] bg-[#EAE3D5] hover:text-[#232720] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A7864A]"
                  >
                    <Icon name="share" size={13} />
                    <span>{atelierCopy.share[lang]}</span>
                  </button>
                </div>
              </motion.section>
            )}
          </div>

          {/* ─── Column B: The 3D Architectural Model Viewport (Desktop Right, Mobile Top) ─── */}
          <div
            className={`transition-all duration-1000 ${
              isReading
                ? "order-1 lg:order-2 lg:col-span-5 flex items-center justify-center sticky top-24"
                : "order-1 lg:order-2 lg:col-span-7 flex items-center justify-center"
            }`}
          >
            <div
              className={`relative flex items-center justify-center transition-all duration-1000 ${
                isReading
                  ? "w-[300px] h-[340px] sm:w-[360px] sm:h-[400px] scale-90"
                  : "w-[340px] h-[400px] sm:w-[440px] sm:h-[480px] lg:w-[500px] lg:h-[540px]"
              }`}
              style={{
                perspective: 1200,
                WebkitPerspective: 1200,
                transformStyle: "preserve-3d",
              }}
            >
              {/* Soft Ambient Contact Shadow Under Plinth */}
              <div
                className="absolute -bottom-8 w-[85%] h-16 rounded-full pointer-events-none opacity-40"
                style={{
                  background:
                    "radial-gradient(ellipse at center, rgba(35,39,32,0.45) 0%, rgba(35,39,32,0.1) 60%, transparent 80%)",
                  filter: "blur(18px)",
                }}
              />

              {/* 3D Camera Rig with Architectural Three-Quarter Perspective */}
              <motion.div
                className="relative w-full h-full flex items-center justify-center"
                style={{
                  transformStyle: "preserve-3d",
                }}
                animate={{
                  rotateX: isReading ? 18 : isOpening ? 20 : 22 + parallax.y * 1.5,
                  rotateY: isReading ? -22 : isOpening ? -16 : -26 + parallax.x * 2,
                  scale: isReading ? 0.88 : isOpening ? 1.05 : 1,
                  y: isOpening ? -8 : 0,
                }}
                transition={{
                  duration: reduce ? 0 : isOpening ? 6.8 : 0.8,
                  ease: [0.25, 1, 0.35, 1],
                }}
              >
                {/* ─── 1. The Floating Rectangular Stone Plinth with Water Channel ─── */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    width: 360,
                    height: 280,
                    transform: "rotateX(90deg) translateZ(-60px)",
                    transformStyle: "preserve-3d",
                  }}
                >
                  <FloatingStonePlinthSVG instanceId={id} />
                </div>

                {/* ─── 2. Stationary Stepped Foundation & Structural Columns ─── */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    width: 280,
                    height: 240,
                    transform: "translateZ(10px)",
                    transformStyle: "preserve-3d",
                  }}
                >
                  <PavilionStructuralBaysSVG instanceId={id} isReading={isReading} />
                </div>

                {/* ─── 3. Articulated Sectional Screen (Slides aside in Stage B) ─── */}
                <motion.div
                  className="absolute pointer-events-none z-20"
                  style={{
                    width: 140,
                    height: 180,
                    transform: "translateZ(45px)",
                  }}
                  animate={{
                    x: isReading || isOpening ? -80 : 0,
                    opacity: isReading ? 0.35 : isOpening ? 0.5 : 1,
                  }}
                  transition={{
                    duration: reduce ? 0 : 2.6,
                    delay: isOpening ? 1.2 : 0,
                    ease: [0.25, 1, 0.35, 1],
                  }}
                >
                  <CarvedJaaliScreenSVG instanceId={id} />
                </motion.div>

                {/* ─── 4. Articulated Lifting Roof Assembly (Lifts vertically in Stage B) ─── */}
                <motion.div
                  className="absolute pointer-events-none z-30"
                  style={{
                    width: 260,
                    height: 130,
                    top: "14%",
                    transformStyle: "preserve-3d",
                  }}
                  animate={{
                    y: isReading || isOpening ? -50 : 0,
                  }}
                  transition={{
                    duration: reduce ? 0 : 2.8,
                    delay: isOpening ? 1.2 : 0,
                    ease: [0.25, 1, 0.35, 1],
                  }}
                >
                  <SteppedRoofAssemblySVG instanceId={id} />
                </motion.div>

                {/* ─── 5. The Keepsake Folio Inside Pavilion (Unfolds in Stage C) ─── */}
                <motion.div
                  className="absolute z-25 pointer-events-none"
                  style={{
                    width: 130,
                    height: 170,
                    transform: "translateZ(25px)",
                    transformStyle: "preserve-3d",
                  }}
                  animate={{
                    y: isReading ? 0 : isOpening ? [0, -18, -12] : 0,
                    scale: isReading ? 0.95 : isOpening ? [1, 1.15, 1.1] : 1,
                  }}
                  transition={{
                    duration: reduce ? 0 : 2.4,
                    delay: isOpening ? 3.6 : 0,
                    ease: [0.25, 1, 0.35, 1],
                  }}
                >
                  <KeepsakeFolioModel
                    instanceId={id}
                    isOpening={isOpening}
                    isReading={isReading}
                    reduce={!!reduce}
                    lang={lang}
                    names={invite[lang]}
                  />
                </motion.div>

                {/* ─── 6. Finite Jasmine Petals Release in Stage C ─── */}
                {isOpening && !reduce && !still && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-2.5 h-3 rounded-full bg-[#FAF7F0] shadow-sm"
                        style={{
                          left: `${35 + i * 5}%`,
                          top: "40%",
                        }}
                        initial={{ y: -10, opacity: 0 }}
                        animate={{
                          y: 140 + i * 8,
                          x: (i % 2 === 0 ? 1 : -1) * (15 + i * 3),
                          rotate: 90 + i * 40,
                          opacity: [0, 0.9, 0.8, 0],
                        }}
                        transition={{
                          duration: 2.8,
                          delay: 4.2 + i * 0.1,
                          ease: "easeOut",
                        }}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      {/* ─── Interactive Modal Sheets (Map & QR, Share) ─── */}
      <AnimatePresence>
        {sheet === "map" && (
          <ModalBackdrop onClose={() => setSheet(null)} title={atelierCopy.mapQr[lang]}>
            <div className="flex flex-col gap-4 text-center items-center py-2">
              <div className="p-4 bg-[#FAF7F0] rounded-2xl border border-[#D8C9B3] shadow-md">
                <Qr
                  text={directionsUrl(invite)}
                  size={180}
                  label="Directions QR"
                  color="#232720"
                  background="#FAF7F0"
                />
              </div>
              <p className="text-xs font-serif text-[#63705A] max-w-xs">
                Scan with your phone camera to open live navigation to {invite.venue}.
              </p>
              <a
                href={directionsUrl(invite)}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-serif font-semibold text-[#FAF7F0] bg-[#232720] hover:bg-[#A7864A] transition"
              >
                <Icon name="arrowUpRight" size={13} />
                <span>Open in Google Maps</span>
              </a>
            </div>
          </ModalBackdrop>
        )}

        {sheet === "share" && (
          <ModalBackdrop onClose={() => setSheet(null)} title={atelierCopy.share[lang]}>
            <div className="flex flex-col gap-3 py-2">
              <a
                href={whatsappShareUrl(invite, lang, window.location.href)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 text-[#128C7E] font-serif text-sm font-semibold hover:bg-[#25D366]/20 transition"
              >
                <span>Share via WhatsApp</span>
                <Icon name="arrowUpRight" size={15} />
              </a>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href)
                  alert("Link copied to clipboard!")
                }}
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#F5F1E8] border border-[#D8C9B3] text-[#232720] font-serif text-sm font-medium hover:border-[#A7864A] transition"
              >
                <span>Copy Invitation Link</span>
                <Icon name="copy" size={15} />
              </button>
            </div>
          </ModalBackdrop>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ARCHITECTURAL 3D SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Floating Rectangular Stone Plinth with Water Channel & Brass Urli
 */
function FloatingStonePlinthSVG({ instanceId }: { instanceId: string }) {
  const sandstoneGrad = `${instanceId}-plinth-sandstone`
  const waterGrad = `${instanceId}-plinth-water`

  return (
    <svg viewBox="0 0 360 280" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id={sandstoneGrad} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E5DAC9" />
          <stop offset="50%" stopColor="#D8C9B3" />
          <stop offset="100%" stopColor="#C4B39B" />
        </linearGradient>
        <linearGradient id={waterGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8A9AA5" />
          <stop offset="100%" stopColor="#5D6D78" />
        </linearGradient>
      </defs>

      {/* Main Beveled Rectangular Plinth Block */}
      <rect x="15" y="15" width="330" height="250" rx="8" fill={`url(#${sandstoneGrad})`} stroke="#B8A892" strokeWidth="2" />

      {/* Fine Paving Stone Joints */}
      <line x1="15" y1="95" x2="345" y2="95" stroke="#B8A892" strokeWidth="1" opacity="0.6" />
      <line x1="15" y1="175" x2="345" y2="175" stroke="#B8A892" strokeWidth="1" opacity="0.6" />
      <line x1="125" y1="15" x2="125" y2="265" stroke="#B8A892" strokeWidth="1" opacity="0.6" />
      <line x1="235" y1="15" x2="235" y2="265" stroke="#B8A892" strokeWidth="1" opacity="0.6" />

      {/* Shallow Water Channel along Left Edge */}
      <rect x="25" y="30" width="36" height="220" rx="4" fill={`url(#${waterGrad})`} stroke="#9BAAB5" strokeWidth="1.2" />
      {/* Floating White Jasmine Buds in Water */}
      <circle cx="43" cy="70" r="3.5" fill="#FAF7F0" />
      <circle cx="41" cy="130" r="3" fill="#FAF7F0" />
      <circle cx="44" cy="190" r="3.5" fill="#FAF7F0" />

      {/* Asymmetric Antique Brass Urli Bowl with Yellow Marigolds */}
      <circle cx="305" cy="215" r="16" fill="#A7864A" stroke="#D4AF37" strokeWidth="1.5" />
      <circle cx="305" cy="215" r="12" fill="#5D6D78" />
      <circle cx="305" cy="215" r="5" fill="#F59E0B" />
      <circle cx="303" cy="213" r="2" fill="#FEF3C7" />

      {/* Inlaid Central Kolam Motif */}
      <circle cx="180" cy="140" r="28" stroke="#FAF7F0" strokeWidth="1.2" strokeDasharray="2 2" opacity="0.75" />
      <polygon points="180,118 202,140 180,162 158,140" stroke="#FAF7F0" strokeWidth="1.2" fill="none" opacity="0.75" />
      <circle cx="180" cy="140" r="4" fill="#FAF7F0" opacity="0.75" />
    </svg>
  )
}

/**
 * 3-Bay Structural Columns & Recessed Timber Entrance
 */
function PavilionStructuralBaysSVG({
  instanceId,
  isReading,
}: {
  instanceId: string
  isReading: boolean
}) {
  const stoneGrad = `${instanceId}-col-stone`
  const teakGrad = `${instanceId}-door-teak`

  return (
    <svg viewBox="0 0 280 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id={stoneGrad} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#C4B49D" />
          <stop offset="50%" stopColor="#D8C9B3" />
          <stop offset="100%" stopColor="#B3A188" />
        </linearGradient>
        <linearGradient id={teakGrad} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3E271A" />
          <stop offset="100%" stopColor="#25160E" />
        </linearGradient>
      </defs>

      {/* Recessed Timber Doorway at Rear Bay */}
      <rect x="95" y="80" width="90" height="135" rx="2" fill={`url(#${teakGrad})`} stroke="#4E3324" strokeWidth="1.5" />
      {/* Brass Studs on Timber Door */}
      <circle cx="115" cy="120" r="2.5" fill="#D4AF37" />
      <circle cx="165" cy="120" r="2.5" fill="#D4AF37" />
      <circle cx="115" cy="160" r="2.5" fill="#D4AF37" />
      <circle cx="165" cy="160" r="2.5" fill="#D4AF37" />
      {/* Mango Leaf Garland across Door Frame */}
      <path d="M92 84 Q140 94 188 84" stroke="#92400E" strokeWidth="1" fill="none" />
      {[105, 122, 140, 158, 175].map((x, i) => (
        <circle key={i} cx={x} cy={88} r="2.2" fill="#63705A" />
      ))}

      {/* Stepped Stone Podium (Adhishthana) */}
      <rect x="20" y="215" width="240" height="15" rx="2" fill="#C4B49D" stroke="#A8977F" strokeWidth="1" />
      <rect x="30" y="205" width="220" height="10" rx="1" fill="#D8C9B3" stroke="#A8977F" strokeWidth="1" />

      {/* 4 Front & Mid Faceted Columns */}
      {/* Left Front Column */}
      <FacetedColumnBlock x={45} y={60} w={18} h={145} stoneGrad={stoneGrad} />
      {/* Left Interior Column */}
      <FacetedColumnBlock x={80} y={65} w={14} h={140} stoneGrad={stoneGrad} />
      {/* Right Interior Column */}
      <FacetedColumnBlock x={186} y={65} w={14} h={140} stoneGrad={stoneGrad} />
      {/* Right Front Column */}
      <FacetedColumnBlock x={217} y={60} w={18} h={145} stoneGrad={stoneGrad} />
    </svg>
  )
}

function FacetedColumnBlock({
  x,
  y,
  w,
  h,
  stoneGrad,
}: {
  x: number
  y: number
  w: number
  h: number
  stoneGrad: string
}) {
  return (
    <g>
      {/* Lotus Capital */}
      <polygon
        points={`${x - 4},${y} ${x + w + 4},${y} ${x + w},${y + 8} ${x},${y + 8}`}
        fill="#A8977F"
        stroke="#8C7D68"
        strokeWidth="0.8"
      />
      {/* Faceted Shaft */}
      <rect x={x} y={y + 8} width={w} height={h - 16} fill={`url(#${stoneGrad})`} stroke="#8C7D68" strokeWidth="0.8" />
      <line x1={x + w / 2} y1={y + 8} x2={x + w / 2} y2={y + h - 8} stroke="#8C7D68" strokeWidth="0.8" />
      {/* Carved Band */}
      <rect x={x - 1} y={y + h * 0.45} width={w + 2} height={6} rx="1" fill="#A7864A" />
      {/* Base Plinth */}
      <rect x={x - 2} y={y + h - 8} width={w + 4} height={8} rx="1" fill="#A8977F" />
    </g>
  )
}

/**
 * Carved Architectural Jaali Screen (Articulated sliding screen)
 */
function CarvedJaaliScreenSVG({ instanceId }: { instanceId: string }) {
  const jaaliGrad = `${instanceId}-jaali-sandstone`

  return (
    <svg viewBox="0 0 140 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id={jaaliGrad} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#D8C9B3" />
          <stop offset="100%" stopColor="#B3A188" />
        </linearGradient>
      </defs>
      {/* Outer Stone Frame */}
      <rect x="4" y="4" width="132" height="172" rx="4" fill={`url(#${jaaliGrad})`} stroke="#8C7D68" strokeWidth="1.5" />
      {/* Geometric Jaali Perforations */}
      {[25, 55, 85, 115, 145].map((y, i) => (
        <g key={i}>
          <circle cx="35" cy={y} r="6" fill="#232720" opacity="0.35" />
          <circle cx="70" cy={y} r="6" fill="#232720" opacity="0.35" />
          <circle cx="105" cy={y} r="6" fill="#232720" opacity="0.35" />
        </g>
      ))}
    </svg>
  )
}

/**
 * Stepped Roof Assembly with Dravidian Profile & Brass Kalasams (Articulated lifting roof)
 */
function SteppedRoofAssemblySVG({ instanceId }: { instanceId: string }) {
  const roofGrad = `${instanceId}-roof-stone`
  const brassGrad = `${instanceId}-roof-brass`

  return (
    <svg viewBox="0 0 260 130" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id={roofGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E5DAC9" />
          <stop offset="60%" stopColor="#C4B49D" />
          <stop offset="100%" stopColor="#9C8C77" />
        </linearGradient>
        <linearGradient id={brassGrad} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="50%" stopColor="#A7864A" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
      </defs>

      {/* 3 Brass Kalasam Finials */}
      <circle cx="130" cy="12" r="5" fill={`url(#${brassGrad})`} stroke="#FEF3C7" strokeWidth="0.8" />
      <line x1="130" y1="4" x2="130" y2="12" stroke="#FEF3C7" strokeWidth="1.5" />
      <circle cx="95" cy="18" r="4" fill={`url(#${brassGrad})`} stroke="#FEF3C7" strokeWidth="0.6" />
      <circle cx="165" cy="18" r="4" fill={`url(#${brassGrad})`} stroke="#FEF3C7" strokeWidth="0.6" />

      {/* Tier 1 (Apex Shikhara Tier) */}
      <polygon points="80,24 180,24 195,50 65,50" fill={`url(#${roofGrad})`} stroke="#7D6F5E" strokeWidth="1.2" />
      {/* Tier 2 (Middle Cornice Tier) */}
      <polygon points="50,50 210,50 225,82 35,82" fill={`url(#${roofGrad})`} stroke="#7D6F5E" strokeWidth="1.2" />
      {/* Tier 3 (Broad Base Architrave) */}
      <polygon points="20,82 240,82 250,115 10,115" fill={`url(#${roofGrad})`} stroke="#7D6F5E" strokeWidth="1.5" />
      {/* Decorative Dentil Cornice Line */}
      <line x1="18" y1="105" x2="242" y2="105" stroke="#7D6F5E" strokeWidth="1.5" strokeDasharray="4 3" />
    </svg>
  )
}

/**
 * Keepsake Folio 3D Model with Articulated Opening Cover & Rotating Brass Clasp
 */
function KeepsakeFolioModel({
  instanceId,
  isOpening,
  isReading,
  reduce,
  lang,
  names,
}: {
  instanceId: string
  isOpening: boolean
  isReading: boolean
  reduce: boolean
  lang: Lang
  names: [string, string]
}) {
  const isCoverOpen = isReading || isOpening

  return (
    <div
      className="relative w-full h-full flex items-center justify-center rounded-xl overflow-hidden shadow-lg"
      style={{
        background: "linear-gradient(135deg, #FAF7F0 0%, #F5F1E8 100%)",
        border: "1.5px solid rgba(167,134,74,0.5)",
        transformStyle: "preserve-3d",
      }}
    >
      {/* Subtle Embossed Border on Folio Base */}
      <div className="absolute inset-1.5 rounded-lg border border-[#D8C9B3]/80 pointer-events-none" />

      {/* Inner Folio Face (Names in Editorial Script) */}
      <div className="relative z-10 flex flex-col items-center justify-center p-3 text-center">
        <span className="text-[7.5px] uppercase tracking-[0.2em] font-serif text-[#A7864A] font-semibold">
          INVITATION
        </span>
        <span className="text-[11px] font-serif font-bold text-[#232720] mt-0.5 leading-tight">
          {names[0]}
        </span>
        <span className="text-[8px] font-serif text-[#A7864A] italic my-0.5">
          &
        </span>
        <span className="text-[11px] font-serif font-bold text-[#232720] leading-tight">
          {names[1]}
        </span>
      </div>

      {/* Articulated Folio Cover with Rotating Brass Clasp */}
      <motion.div
        className="absolute inset-0 origin-left z-20 rounded-xl flex items-center justify-center shadow-md pointer-events-none"
        style={{
          transformOrigin: "left center",
          transformStyle: "preserve-3d",
          background: "linear-gradient(145deg, #FAF7F0 0%, #EFE8DA 100%)",
          border: "1.5px solid #A7864A",
        }}
        animate={{
          rotateY: isCoverOpen ? -125 : 0,
          opacity: isReading ? 0 : 1,
        }}
        transition={{
          duration: reduce ? 0 : 2.2,
          delay: isOpening ? 4.2 : 0,
          ease: [0.25, 1, 0.35, 1],
        }}
      >
        {/* Rotating Brass Clasp Medallion on Cover */}
        <motion.div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{
            background: "radial-gradient(circle at 35% 30%, #FEF3C7 0%, #A7864A 70%, #78350F 100%)",
            border: "1px solid #FEF3C7",
          }}
          animate={{
            rotate: isCoverOpen ? 45 : 0,
          }}
          transition={{
            duration: reduce ? 0 : 1.2,
            delay: isOpening ? 3.8 : 0,
          }}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-[#FAF7F0] opacity-80" />
        </motion.div>
      </motion.div>
    </div>
  )
}

/**
 * Editorial Corner Filigree Accent
 */
function CornerOrnament({
  position,
  instanceId,
}: {
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right"
  instanceId: string
}) {
  const isTop = position.includes("top")
  const isLeft = position.includes("left")

  return (
    <div
      className={`absolute ${isTop ? "top-3" : "bottom-3"} ${
        isLeft ? "left-3" : "right-3"
      } w-5 h-5 pointer-events-none opacity-60 z-20`}
      style={{
        transform: `${!isLeft ? "scaleX(-1)" : ""} ${!isTop ? "scaleY(-1)" : ""}`,
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 22 V6 C2 3.8 3.8 2 6 2 H22" stroke="#A7864A" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="5" cy="5" r="1.5" fill="#A7864A" />
      </svg>
    </div>
  )
}

/**
 * Modal Sheet Backdrop for Map / Share
 */
function ModalBackdrop({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#232720]/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 15 }}
        className="w-full max-w-sm rounded-3xl bg-[#FAF7F0] p-6 border border-[#D8C9B3] shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#D8C9B3]/50 mb-3">
          <h3 className="text-sm font-serif font-bold text-[#232720] tracking-wide">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded-full text-[#63705A] hover:text-[#232720] hover:bg-[#EAE3D5] transition"
          >
            <Icon name="x" size={16} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}
