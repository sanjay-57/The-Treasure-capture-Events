import { useEffect, useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"
import { Icon } from "../../../components/Icon"
import { Qr } from "../../../components/Qr"
import { useLang, useT } from "../../../lib/i18n"
import { splitCouple, invitePath, type Invite } from "../../../lib/invite"
import { directionsUrl, whatsappShareUrl } from "../../../lib/invite"
import type { Order } from "../../../lib/store"
import { eventByKey } from "../../../lib/data"

const copy = {
  confirmedEyebrow: { en: "Enquiry Registered", ta: "விசாரணை பெறப்பட்டது" },
  title: {
    en: "Your Official 3D E-Invite is Ready!",
    ta: "உங்கள் சிறப்பு 3D மின்-அழைப்பிதழ் தயார்!",
  },
  lead: {
    en: "We have reserved your date and generated your ceremonial 3D invitation.",
    ta: "உங்கள் தேதி குறித்து வைக்கப்பட்டு, சிறப்பு 3D அழைப்பிதழ் உருவாக்கப்பட்டுள்ளது.",
  },
  ref: { en: "Booking Reference", ta: "பதிவு எண்" },
  viewFull: { en: "Experience Full 3D Invite", ta: "முழு 3D அழைப்பிதழைப் பார்க்க" },
  shareWa: { en: "Share on WhatsApp", ta: "WhatsApp-ல் பகிர" },
  continueTracking: {
    en: "Continue to Order Tracking",
    ta: "ஆர்டர் நிலைக்குச் செல்க",
  },
  weds: { en: "weds", ta: "திருமணம்" },
  dateTbc: { en: "Date to be confirmed", ta: "தேதி பின்னர் உறுதிசெய்யப்படும்" },
  timeTbc: { en: "Time to be confirmed", ta: "நேரம் பின்னர் உறுதிசெய்யப்படும்" },
  copied: { en: "Booking ID copied", ta: "பதிவு எண் நகலெடுக்கப்பட்டது" },
}

export function MandatoryEnquiryInvite({
  order,
  onProceed,
}: {
  order: Order
  onProceed: () => void
}) {
  const lang = useLang()
  const t = useT(copy)
  const reduce = useReducedMotion()

  // 3D Reveal State: 'burst' -> 'unfold' -> 'ready'
  const [stage, setStage] = useState<"burst" | "unfold" | "ready">(
    reduce ? "ready" : "burst",
  )

  useEffect(() => {
    if (reduce) return
    const t1 = window.setTimeout(() => setStage("unfold"), 400)
    const t2 = window.setTimeout(() => setStage("ready"), 1400)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [reduce])

  const [bride, groom] = splitCouple(order.client.name)
  const eventInfo = eventByKey(order.eventType)

  // Synthesize canonical invite object from registered order
  const invite: Invite = {
    en: [bride || order.client.name, groom || "Family"],
    ta: [bride || order.client.name, groom || "குடும்பத்தினர்"],
    date: order.date || new Date().toISOString().slice(0, 10),
    time: order.time || "06:30",
    venue: order.venueName || "Madurai",
    address: order.venueAddress || "",
    lat: order.venueCoords?.lat,
    lng: order.venueCoords?.lng,
    phone: order.client.contact,
    theme: "athangudi",
  }

  const fullInviteUrl = `${
    typeof window !== "undefined" ? window.location.origin : ""
  }${invitePath(invite)}`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/90 p-4 backdrop-blur-xl select-none"
      style={{
        perspective: "1200px",
        WebkitPerspective: "1200px",
      }}
      data-lenis-prevent
    >
      {/* Ambient celebratory light wash */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(circle at 50% 30%, #991B1B 0%, #450A18 45%, #050102 100%)",
        }}
      />

      {/* Floating Sparkle Particles (Celebration) */}
      {!reduce && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {[...Array(14)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 4 + (i % 3) * 3,
                height: 4 + (i % 3) * 3,
                background: i % 2 === 0 ? "#FBBF24" : "#F43F5E",
                boxShadow: "0 0 12px currentColor",
                left: `${(i * 7.5) % 96}%`,
                top: `${(i * 8.2) % 90}%`,
              }}
              animate={{
                y: [-15, 15, -15],
                opacity: [0.2, 0.9, 0.2],
                scale: [0.8, 1.3, 0.8],
              }}
              transition={{
                duration: 2 + (i % 3),
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      )}

      {/* 3D Container Stage */}
      <motion.div
        className="relative w-full max-w-[440px] my-auto flex flex-col items-center text-center"
        style={{
          transformStyle: "preserve-3d",
          WebkitTransformStyle: "preserve-3d",
        }}
        initial={
          reduce ? false : { opacity: 0, scale: 0.85, rotateX: 20, z: -100 }
        }
        animate={{ opacity: 1, scale: 1, rotateX: 0, z: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header Badge */}
        <div className="mb-4 flex flex-col items-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/10 px-3.5 py-1 text-[11.5px] font-semibold uppercase tracking-wider text-amber-300 backdrop-blur-md shadow-lg">
            <Icon
              name="sparkle"
              size={13}
              className="text-amber-300 animate-pulse"
            />
            {t.confirmedEyebrow} · #{order.id}
          </span>
          <h2 className="mt-2 text-[22px] sm:text-[25px] font-bold text-white tracking-tight leading-snug">
            {t.title}
          </h2>
          <p className="mt-1 text-[12.5px] text-white/70 max-w-sm">{t.lead}</p>
        </div>

        {/* 3D Articulated Invitation Card Structure */}
        <div
          className="relative w-full rounded-[28px] p-6 shadow-[0_30px_70px_rgba(0,0,0,0.8),0_0_50px_rgba(245,158,11,0.2)] border-2 border-amber-500/50"
          style={{
            transformStyle: "preserve-3d",
            background: "linear-gradient(180deg, #3A0713 0%, #1A0207 100%)",
          }}
        >
          {/* Inner Decorative Arch */}
          <div className="pointer-events-none absolute inset-2.5 rounded-[20px] border border-amber-400/30" />

          {/* Top Temple Garland Silhouette */}
          <div className="mx-auto mb-3 flex items-center justify-center gap-2 text-amber-400/80">
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-amber-400" />
            <span className="text-[10.5px] uppercase tracking-[0.25em] font-serif font-bold text-amber-300">
              {eventInfo ? eventInfo.name[lang] : "Celebration"}
            </span>
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-amber-400" />
          </div>

          {/* Couple Names */}
          <div className="my-2">
            <motion.h3
              className="text-[28px] sm:text-[32px] font-serif font-bold text-amber-100 leading-tight"
              style={{ textShadow: "0 2px 12px rgba(245,158,11,0.3)" }}
              animate={
                stage === "unfold" ? { scale: [0.95, 1.03, 1] } : undefined
              }
              transition={{ duration: 0.5 }}
            >
              {bride || order.client.name}
            </motion.h3>

            <div className="my-1 flex items-center justify-center gap-2">
              <span className="h-px w-6 bg-amber-400/40" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-400">
                {t.weds}
              </span>
              <span className="h-px w-6 bg-amber-400/40" />
            </div>

            <motion.h3
              className="text-[28px] sm:text-[32px] font-serif font-bold text-amber-100 leading-tight"
              style={{ textShadow: "0 2px 12px rgba(245,158,11,0.3)" }}
              animate={
                stage === "unfold" ? { scale: [0.95, 1.03, 1] } : undefined
              }
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {groom || "Family"}
            </motion.h3>
          </div>

          {/* Date & Muhurtham */}
          <div className="my-4 rounded-xl border border-white/10 bg-black/40 p-3 flex items-center justify-around">
            <div className="text-center">
              <span className="text-[10px] uppercase tracking-wider text-white/50 block">
                Date
              </span>
              <span className="text-[14px] font-semibold text-white">
                {order.date || t.dateTbc}
              </span>
            </div>
            <div className="h-7 w-px bg-white/15" />
            <div className="text-center">
              <span className="text-[10px] uppercase tracking-wider text-white/50 block">
                Muhurtham
              </span>
              <span className="text-[14px] font-semibold text-amber-300">
                {order.time ? `${order.time} IST` : "06:30 IST"}
              </span>
            </div>
          </div>

          {/* Venue */}
          <div className="text-center text-[12.5px] text-white/80">
            <p className="flex items-center justify-center gap-1.5 font-semibold text-white/95">
              <Icon name="mapPin" size={14} className="text-amber-400" />
              <span>{order.venueName || "Madurai"}</span>
            </p>
            {order.venueAddress && (
              <p className="text-[11px] text-white/55 truncate mt-0.5">
                {order.venueAddress}
              </p>
            )}
          </div>

          {/* Quick QR Mini Badge */}
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between px-2">
            <div className="text-left text-[11px]">
              <p className="font-semibold text-amber-200">
                The Treasure Capture
              </p>
              <p className="text-white/50">Madurai & 8 Districts</p>
            </div>
            <div className="rounded-md bg-white p-1">
              <Qr
                text={fullInviteUrl}
                size={42}
                color="#000000"
                background="#FFFFFF"
                label="Invite Link"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 w-full flex flex-col gap-2.5">
          {/* Main Action: Open 3D Scene */}
          <a
            href={fullInviteUrl}
            target="_blank"
            rel="noreferrer"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-[14px] font-bold text-black shadow-lg shadow-amber-500/25 transition hover:brightness-110 active:scale-[0.98]"
          >
            <Icon name="sparkle" size={16} />
            <span>{t.viewFull}</span>
          </a>

          {/* WhatsApp Share Action */}
          <a
            href={whatsappShareUrl(invite, lang, fullInviteUrl)}
            target="_blank"
            rel="noreferrer"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-emerald-500/40 bg-[#25D366]/20 text-[13px] font-semibold text-emerald-300 backdrop-blur-md transition hover:bg-[#25D366]/30 active:scale-[0.98]"
          >
            <Icon name="whatsapp" size={16} />
            <span>{t.shareWa}</span>
          </a>

          {/* Proceed to Dashboard / Tracking */}
          <button
            type="button"
            onClick={onProceed}
            className="mt-1 flex h-10 w-full items-center justify-center gap-1.5 text-[12.5px] font-medium text-white/60 hover:text-white transition cursor-pointer"
          >
            <span>{t.continueTracking}</span>
            <Icon name="arrowRight" size={13} />
          </button>
        </div>
      </motion.div>
    </div>
  )
}
