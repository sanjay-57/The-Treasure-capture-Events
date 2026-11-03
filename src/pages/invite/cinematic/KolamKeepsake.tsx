import { motion } from "motion/react"
import { Icon } from "../../../components/Icon"
import { CinematicFramework } from "./CinematicFramework"
import { InviteDetailsCard } from "./InviteDetailsCard"
import type { CinematicSceneProps } from "./types"

export function KolamKeepsake(props: CinematicSceneProps) {
  const { invite, lang, still, size, share, onReady, sample, art } = props

  return (
    <CinematicFramework
      invite={invite}
      lang={lang}
      title="The Kolam Keepsake"
      accentColor="#DC2626"
      still={still}
      size={size}
      share={share}
      onReady={onReady}
      sample={sample}
      renderScene={({ state, onTriggerOpen, parallax, reducedMotion }) => {
        const isOpen = state === "opened"
        const isOpening = state === "opening"
        const isClosed = state === "closed"

        const cameraZ = isOpen ? 95 : isOpening ? 60 : 0
        const cameraRotX = 4 + parallax.y * 3
        const cameraRotY = parallax.x * 4

        return (
          <div
            className="relative h-full w-full overflow-hidden flex items-center justify-center"
            style={{
              background:
                "radial-gradient(circle at 50% 30%, #341208 0%, #1A0702 60%, #0A0301 100%)",
              transformStyle: "preserve-3d",
              WebkitTransformStyle: "preserve-3d",
            }}
          >
            {/* Camera Rig */}
            <motion.div
              className="relative h-full w-full flex items-center justify-center"
              style={{
                transformStyle: "preserve-3d",
                WebkitTransformStyle: "preserve-3d",
              }}
              animate={{
                z: cameraZ,
                rotateX: cameraRotX,
                rotateY: cameraRotY,
              }}
              transition={{
                duration: reducedMotion ? 0 : isOpening ? 3.0 : 0.8,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {/* ── Background Ground Plane with Self-Tracing Kolam ── */}
              <div
                className="absolute inset-0 pointer-events-none flex items-center justify-center"
                style={{
                  transform: "translateZ(-90px)",
                  transformStyle: "preserve-3d",
                }}
              >
                {/* Terracotta Floor / Plinth */}
                <div className="relative w-[92%] h-[86%] rounded-[36px] bg-[#220B04] border border-[#5E220F]/50 shadow-2xl overflow-hidden flex items-center justify-center">
                  {/* Tracing Kolam Lines (White rice flour strokes) */}
                  <svg
                    viewBox="0 0 400 400"
                    className="absolute inset-0 h-full w-full opacity-60"
                  >
                    <motion.path
                      d="M 200 40 Q 250 100, 360 200 Q 250 300, 200 360 Q 150 300, 40 200 Q 150 100, 200 40 Z"
                      fill="none"
                      stroke="#FAF5EE"
                      strokeWidth="2.5"
                      strokeDasharray="1200"
                      initial={{ strokeDashoffset: reducedMotion ? 0 : 1200 }}
                      animate={{
                        strokeDashoffset:
                          isOpen || still ? 0 : isOpening ? [1200, 0] : 1200,
                      }}
                      transition={{ duration: 2.2, ease: "easeInOut" }}
                    />
                    <motion.circle
                      cx="200"
                      cy="200"
                      r="140"
                      fill="none"
                      stroke="#EF4444"
                      strokeWidth="1.5"
                      strokeDasharray="900"
                      initial={{ strokeDashoffset: reducedMotion ? 0 : 900 }}
                      animate={{
                        strokeDashoffset:
                          isOpen || still ? 0 : isOpening ? [900, 0] : 900,
                      }}
                      transition={{
                        duration: 2.4,
                        delay: 0.3,
                        ease: "easeInOut",
                      }}
                    />
                  </svg>
                </div>
              </div>

              {/* ── Middle Layer: The Handmade Ivory Keepsake Card Unfolded ── */}
              <motion.div
                className="relative z-10 flex flex-col items-center justify-center px-4"
                style={{
                  transformStyle: "preserve-3d",
                }}
                animate={{
                  opacity: isOpen || still ? 1 : isOpening ? [0, 0.4, 1] : 0,
                  y: isOpen || still ? 0 : 35,
                  z: isOpen || still ? 30 : -20,
                  scale: isOpen || still ? 1 : 0.94,
                  rotateX: isOpen || still ? 0 : 15,
                }}
                transition={{
                  duration: reducedMotion ? 0 : 1.4,
                  delay: reducedMotion || still ? 0 : 1.5,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <InviteDetailsCard
                  invite={invite}
                  lang={lang}
                  art={art}
                  still={still}
                  style={{
                    bg: "rgba(255, 253, 248, 0.96)",
                    border: "2px solid rgba(220, 38, 38, 0.6)",
                    text: "#260B04",
                    muted: "#7F1D1D",
                    accent: "#DC2626",
                    fontFamily: "Cormorant Garamond, serif",
                    taFontFamily: "Noto Serif Tamil, serif",
                  }}
                />
              </motion.div>

              {/* ── Foreground: Sculptural Rosewood Box & Brass Clasp ── */}
              <div
                className="absolute inset-0 pointer-events-none flex items-center justify-center"
                style={{
                  transform: "translateZ(55px)",
                  transformStyle: "preserve-3d",
                }}
              >
                <div className="relative w-[90%] max-w-[400px] h-[520px] flex items-center justify-center">
                  {/* Box Hinged Wooden Lid (Opens upward) */}
                  <motion.div
                    className="absolute inset-0 origin-top rounded-2xl overflow-hidden shadow-2xl border-2 border-[#54210D]"
                    style={{
                      transformStyle: "preserve-3d",
                      background:
                        "linear-gradient(180deg, #4A1A0C 0%, #2B0D05 100%)",
                    }}
                    animate={{
                      rotateX: isOpen || still ? -115 : isOpening ? -110 : 0,
                      opacity: isOpen && !still ? 0.25 : 1,
                    }}
                    transition={{
                      duration: reducedMotion ? 0 : 2.4,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    {/* Brass Corner Brackets on Lid */}
                    <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-amber-400 bg-amber-600/30 rounded-tl" />
                    <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-amber-400 bg-amber-600/30 rounded-tr" />
                    <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-amber-400 bg-amber-600/30 rounded-bl" />
                    <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-amber-400 bg-amber-600/30 rounded-br" />

                    {/* Central Engraved Kolam Motif on Box Lid */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-60">
                      <div className="w-28 h-28 border-2 border-amber-300 rounded-full flex items-center justify-center rotate-45">
                        <div className="w-20 h-20 border border-amber-400 rounded-full" />
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* ── Antique Brass Box Clasp (Trigger in closed state) ── */}
              {isClosed && (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center z-40 pointer-events-auto cursor-pointer"
                  onClick={onTriggerOpen}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      onTriggerOpen()
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={
                    lang === "ta"
                      ? "அழைப்பிதழைத் திறக்க பூட்டைத் தொடவும்"
                      : "Tap box clasp to open invitation"
                  }
                >
                  <motion.div
                    className="flex flex-col items-center"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    {/* Sculptural Brass Clasp */}
                    <motion.div
                      className="relative flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-tr from-amber-700 via-amber-300 to-amber-800 p-1 shadow-[0_0_50px_rgba(245,158,11,0.6)]"
                      animate={{
                        scale: [1, 1.05, 1],
                        boxShadow: [
                          "0 0 30px rgba(245,158,11,0.4)",
                          "0 0 60px rgba(245,158,11,0.7)",
                          "0 0 30px rgba(245,158,11,0.4)",
                        ],
                      }}
                      transition={{
                        duration: 2.6,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#3B170B] border-2 border-amber-200 text-amber-300 shadow-inner">
                        <Icon name="sparkle" size={24} />
                      </div>
                    </motion.div>

                    {/* Touch Action Prompt Pill */}
                    <div className="mt-6 rounded-full border border-amber-400/40 bg-black/80 px-5 py-2 backdrop-blur-md shadow-2xl flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[13px] font-semibold tracking-wider text-amber-100">
                        {lang === "ta"
                          ? "அழைப்பிதழைத் திறக்க பூட்டைத் தொடவும்"
                          : "Tap clasp to open box"}
                      </span>
                    </div>
                  </motion.div>
                </div>
              )}
            </motion.div>
          </div>
        )
      }}
    />
  )
}
