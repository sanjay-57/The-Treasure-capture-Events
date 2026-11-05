import { useEffect, useState, type CSSProperties } from "react"
import { motion } from "motion/react"
import { Icon } from "../../../components/Icon"
import { Qr } from "../../../components/Qr"
import {
  countdown,
  dateParts,
  directionsUrl,
  isPremium,
  timeLabel,
  type Invite,
} from "../../../lib/invite"
import { coupleUrl } from "../caricature"
import { Invocation } from "../story/motifs"
import type { Lang } from "../../../lib/i18n"

export interface CardStyle {
  bg: string
  border?: string
  text: string
  muted: string
  accent: string
  fontFamily: string
  taFontFamily: string
  glowColor?: string
}

/** True for a dark ink colour, i.e. the card itself is light (Kolam Keepsake's cream folio). */
function darkInk(color: string): boolean {
  const m = /^#([0-9a-f]{6})$/i.exec(color.trim())
  if (!m) return false
  const n = parseInt(m[1], 16)
  const lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
  return lum < 0.5
}

export function InviteDetailsCard({
  invite,
  lang,
  style,
  art,
  still = false,
  elevated = true,
}: {
  invite: Invite
  lang: Lang
  style: CardStyle
  art?: string
  still?: boolean
  elevated?: boolean
}) {
  const names = invite[lang]
  const otherLang: Lang = lang === "ta" ? "en" : "ta"
  const otherNames = invite[otherLang]
  const premium = isPremium(invite.theme)
  const pic = premium
    ? art || invite.caricature || coupleUrl(style.accent)
    : undefined
  const d = dateParts(invite.date, lang)

  const [cd, setCd] = useState(() => countdown(invite))
  useEffect(() => {
    setCd(countdown(invite))
    const id = window.setInterval(() => setCd(countdown(invite)), 1000)
    return () => clearInterval(id)
  }, [invite])

  // Light cards get dark rules and tiles; dark cards keep the smoky glass look.
  const light = darkInk(style.text)
  const rule = light ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.1)"
  const tile = light
    ? { background: "rgba(0,0,0,0.04)", borderColor: "rgba(0,0,0,0.08)" }
    : { background: "rgba(0,0,0,0.25)", borderColor: "rgba(255,255,255,0.08)" }
  const nameShadow = light ? "none" : "0 2px 10px rgba(0,0,0,0.3)"

  const wedsWord = lang === "ta" ? "திருமணம்" : "weds"
  const muhurthamWord = lang === "ta" ? "முகூர்த்தம்" : "Muhurtham"

  return (
    <div
      className={`relative w-full max-w-[360px] rounded-[24px] p-5 sm:p-6 text-center select-none ${
        elevated
          ? "shadow-[0_25px_60px_-15px_rgba(0,0,0,0.55),0_0_40px_rgba(217,119,6,0.15)]"
          : ""
      }`}
      style={{
        background: style.bg,
        border: style.border || "1px solid rgba(255,255,255,0.12)",
        color: style.text,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {/* Delicate inner decorative border */}
      <div
        className="pointer-events-none absolute inset-2 rounded-[18px] border opacity-40"
        style={{ borderColor: style.accent }}
      />

      {/* Invocation: Pillaiyar Suzhi / Ganesha, Bismillah or a verse, as the couple chose */}
      {invite.tradition && invite.tradition !== "none" && (
        <div className="mb-3 text-[13px]">
          <Invocation
            tradition={invite.tradition}
            lang={lang}
            color={style.accent}
            muted={style.muted}
            serif={style.fontFamily.split(",")[0].trim()}
          />
        </div>
      )}

      {/* Parents Blessing Line */}
      {invite.parents?.[lang] && (
        <p
          className="mb-3 text-[11.5px] leading-relaxed tracking-wide opacity-80"
          style={{ color: style.muted }}
        >
          {invite.parents[lang]}
        </p>
      )}

      {/* Caricature portrait (for premium themes) */}
      {pic && (
        <div
          className="relative mx-auto mb-3 h-20 w-20 overflow-hidden rounded-full border-2 shadow-inner"
          style={{ borderColor: style.accent }}
        >
          <img
            src={pic}
            alt={lang === "ta" ? "மணமக்கள் ஓவியம்" : "Couple portrait"}
            className="h-full w-full object-cover object-top"
          />
        </div>
      )}

      {/* Names */}
      <div className="my-2">
        <h2
          className="text-[26px] sm:text-[30px] font-bold leading-[1.08] tracking-tight"
          style={{
            fontFamily: lang === "ta" ? style.taFontFamily : style.fontFamily,
            color: style.text,
            textShadow: nameShadow,
          }}
        >
          {names[0]}
        </h2>

        <div className="my-1.5 flex items-center justify-center gap-2">
          <span
            className="h-px w-8 opacity-40"
            style={{ background: style.accent }}
          />
          <span
            className="text-[11px] font-medium uppercase tracking-[0.3em]"
            style={{ color: style.accent }}
          >
            {wedsWord}
          </span>
          <span
            className="h-px w-8 opacity-40"
            style={{ background: style.accent }}
          />
        </div>

        <h2
          className="text-[26px] sm:text-[30px] font-bold leading-[1.08] tracking-tight"
          style={{
            fontFamily: lang === "ta" ? style.taFontFamily : style.fontFamily,
            color: style.text,
            textShadow: nameShadow,
          }}
        >
          {names[1]}
        </h2>

        {/* Secondary language names */}
        <p
          className="mt-1.5 text-[12.5px] opacity-65 font-medium"
          style={{
            fontFamily:
              otherLang === "ta" ? style.taFontFamily : style.fontFamily,
            color: style.muted,
          }}
        >
          {otherNames[0]} &amp; {otherNames[1]}
        </p>
      </div>

      {/* Divider */}
      <div
        className="my-3.5 mx-auto h-px w-20 opacity-30"
        style={{ background: style.accent }}
      />

      {/* Date & Muhurtham */}
      <div className="my-2">
        <div className="flex items-center justify-center gap-3">
          <span
            className="text-[34px] sm:text-[38px] font-serif font-bold leading-none"
            style={{ color: style.accent }}
          >
            {d.day}
          </span>
          <div className="text-left text-[12px] leading-tight uppercase tracking-wider font-semibold">
            <span className="block" style={{ color: style.text }}>
              {d.month} {d.year}
            </span>
            <span className="block opacity-65" style={{ color: style.muted }}>
              {d.weekday}
            </span>
          </div>
        </div>

        {invite.time && (
          <p
            className="mt-2 text-[12px] font-medium"
            style={{ color: style.muted }}
          >
            {muhurthamWord} ·{" "}
            <span className="font-semibold" style={{ color: style.text }}>
              {timeLabel(invite.time, lang)}
            </span>
          </p>
        )}
      </div>

      {/* Venue */}
      <div className="mt-3 flex flex-col items-center">
        <p className="flex items-center gap-1.5 text-[14px] sm:text-[15px] font-semibold" style={{ color: style.text }}>
          <Icon
            name="mapPin"
            size={14}
            className="shrink-0"
            style={{ color: style.accent }}
          />
          <span>{invite.venue}</span>
        </p>
        {invite.address && (
          <p
            className="mt-0.5 text-[11.5px] opacity-70 truncate max-w-[280px]"
            style={{ color: style.muted }}
          >
            {invite.address}
          </p>
        )}
      </div>

      {/* Live Countdown (interactive) OR Static QR code (PNG export mode) */}
      {still ? (
        <div className="mt-4 pt-3 border-t flex items-center justify-center gap-3" style={{ borderColor: rule }}>
          <div className="rounded-lg bg-white p-1.5 shadow">
            <Qr
              text={directionsUrl(invite)}
              size={68}
              color="#0B0D14"
              background="#FFFFFF"
              label="Directions"
            />
          </div>
          <div className="text-left text-[11px] leading-tight">
            <p className="font-semibold" style={{ color: style.text }}>
              {lang === "ta" ? "வழிக்கு ஸ்கேன் செய்யவும்" : "Scan for directions"}
            </p>
            <p className="opacity-60" style={{ color: style.muted }}>
              The Treasure Capture Events
            </p>
          </div>
        </div>
      ) : (
        <div
          className="mt-4 pt-3 border-t"
          style={{ borderColor: rule }}
          role="timer"
          aria-live="off"
        >
          {cd.done ? (
            <p
              className="text-[13px] font-semibold"
              style={{ color: style.accent }}
            >
              {lang === "ta" ? "திருமணம் நடந்தேறியது" : "Happily married"}
            </p>
          ) : (
            <div className="flex justify-center gap-1.5">
              {[
                [cd.days, lang === "ta" ? "நாள்" : "days"],
                [cd.hours, lang === "ta" ? "மணி" : "hrs"],
                [cd.minutes, lang === "ta" ? "நிமி" : "min"],
                [cd.seconds, lang === "ta" ? "விநா" : "sec"],
              ].map(([n, l]) => (
                <div
                  key={l as string}
                  className="flex min-w-[46px] flex-col items-center rounded-lg border px-1 py-1"
                  style={tile}
                >
                  <span
                    className="font-serif text-[15px] font-bold leading-none tabular-nums"
                    style={{ color: style.accent }}
                  >
                    {String(n).padStart(2, "0")}
                  </span>
                  <span
                    className="text-[8.5px] uppercase tracking-wider opacity-60 mt-0.5"
                    style={{ color: style.muted }}
                  >
                    {l}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
