import { motion } from "motion/react"
import { Icon } from "../../../components/Icon"
import { CinematicFramework } from "./CinematicFramework"
import { InviteDetailsCard } from "./InviteDetailsCard"
import type { CinematicSceneProps } from "./types"

export function LotusMandapam(props: CinematicSceneProps) {
  const { invite, lang, still, size, share, onReady, sample, art } = props

  return (
    <CinematicFramework
      invite={invite}
      lang={lang}
      title="The Lotus Mandapam"
      accentColor="#F472B6"
      still={still}
      size={size}
      share={share}
      onReady={onReady}
      sample={sample}
      renderScene={({ state, onTriggerOpen, parallax, reducedMotion }) => {
        const isOpen = state === "opened"
        const isOpening = state === "opening"
        const isClosed = state === "closed"

        const cameraZ = isOpen ? 90 : isOpening ? 50 : 0
        const cameraY = isOpen ? -15 : isOpening ? -8 : 0
        const cameraRotX = 3 + parallax.y * 3
        const cameraRotY = parallax.x * 4

        return (
          <div
            className="relative h-full w-full overflow-hidden flex items-center justify-center"
            style={{
              background:
                "radial-gradient(circle at 50% 30%, #201323 0%, #0D1615 50%, #040909 100%)",
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
                y: cameraY,
                rotateX: cameraRotX,
                rotateY: cameraRotY,
              }}
              transition={{
                duration: reducedMotion ? 0 : isOpening ? 3.2 : 0.8,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {/* ── Background: Temple Pavilion Water Basin with Light Reflections ── */}
              <div
                className="absolute inset-0 pointer-events-none opacity-40 overflow-hidden"
                style={{
                  background:
                    "radial-gradient(ellipse at 50% 75%, #064E3B 0%, #02261E 60%, transparent 100%)",
                }}
              >
                {/* Subtle Water Rings / Waves */}
                <div
                  className="absolute inset-x-0 bottom-0 h-48 opacity-30"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 50% 50%, #10B981 1px, transparent 2px)",
                    backgroundSize: "32px 32px",
                  }}
                />
              </div>

              {/* ── Mandapam Pavilion Pillars (Architectural depth) ── */}
              <div
                className="absolute inset-x-6 top-6 bottom-16 pointer-events-none flex justify-between"
                style={{
                  transform: "translateZ(-100px)",
                  transformStyle: "preserve-3d",
                }}
              >
                {/* Left Gold Pavilion Pillar */}
                <div className="w-8 h-full rounded-t-lg bg-gradient-to-b from-amber-600 via-amber-300 to-amber-800 shadow-2xl opacity-60 flex flex-col justify-between">
                  <div className="w-12 -ml-2 h-5 rounded bg-amber-400" />
                  <div className="w-12 -ml-2 h-8 rounded-b bg-stone-800" />
                </div>
                {/* Right Gold Pavilion Pillar */}
                <div className="w-8 h-full rounded-t-lg bg-gradient-to-b from-amber-600 via-amber-300 to-amber-800 shadow-2xl opacity-60 flex flex-col justify-between">
                  <div className="w-12 -ml-2 h-5 rounded bg-amber-400" />
                  <div className="w-12 -ml-2 h-8 rounded-b bg-stone-800" />
                </div>
              </div>

              {/* ── Floating Drifting Petals during Opening Sequence ── */}
              {isOpening && !reducedMotion && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute rounded-full shadow-lg"
                      style={{
                        width: 18 + (i % 3) * 6,
                        height: 26 + (i % 3) * 8,
                        background:
                          "linear-gradient(135deg, #F472B6 0%, #DB2777 60%, #FDF2F8 100%)",
                        borderRadius: "60% 0 60% 0",
                        left: `${15 + i * 14}%`,
                      }}
                      initial={{
                        top: "20%",
                        opacity: 0,
                        rotate: i * 30,
                        x: 0,
                      }}
                      animate={{
                        top: "80%",
                        opacity: [0, 0.9, 0],
                        rotate: i * 30 + 120,
                        x: (i % 2 === 0 ? 1 : -1) * 35,
                      }}
                      transition={{
                        duration: 3.2,
                        delay: 0.3 + i * 0.2,
                        ease: "easeOut",
                      }}
                    />
                  ))}
                </div>
              )}

              {/* ── Middle Layer: The Sacred Mandapam Invitation Card ── */}
              <motion.div
                className="relative z-10 flex flex-col items-center justify-center px-4"
                style={{
                  transformStyle: "preserve-3d",
                }}
                animate={{
                  opacity: isOpen || still ? 1 : isOpening ? [0, 0.4, 1] : 0,
                  y: isOpen || still ? 0 : 25,
                  z: isOpen || still ? 25 : -15,
                  scale: isOpen || still ? 1 : 0.94,
                }}
                transition={{
                  duration: reducedMotion ? 0 : 1.3,
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
                    bg: "rgba(15, 23, 20, 0.92)",
                    border: "1.5px solid rgba(244, 114, 182, 0.5)",
                    text: "#FFFDF7",
                    muted: "#FBCFE8",
                    accent: "#F472B6",
                    fontFamily: "Cormorant Garamond, serif",
                    taFontFamily: "Noto Serif Tamil, serif",
                  }}
                />
              </motion.div>

              {/* ── Sculptural Lotus Petals (Concentric 3D Bloom Layers) ── */}
              <div
                className="absolute inset-0 pointer-events-none flex items-center justify-center"
                style={{
                  transform: "translateZ(45px)",
                  transformStyle: "preserve-3d",
                }}
              >
                <div className="relative w-72 h-72 flex items-center justify-center">
                  {/* Outer Sepals (6 Emerald & Pink Petals) */}
                  {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                    <motion.div
                      key={`outer-${i}`}
                      className="absolute w-24 h-40 rounded-t-full shadow-2xl origin-bottom"
                      style={{
                        background:
                          "linear-gradient(180deg, #F472B6 0%, #9D174D 45%, #064E3B 100%)",
                        border: "1px solid rgba(244,114,182,0.4)",
                        transformStyle: "preserve-3d",
                      }}
                      animate={{
                        rotateZ: deg,
                        rotateX: isOpen || still ? 85 : isOpening ? 80 : 25,
                        scale: isOpen || still ? 0.85 : 1,
                        opacity: isOpen && !still ? 0.2 : 1,
                      }}
                      transition={{
                        duration: reducedMotion ? 0 : 2.2,
                        delay: reducedMotion ? 0 : i * 0.05,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    />
                  ))}

                  {/* Middle Tier (6 Delicate Rose Petals) */}
                  {[30, 90, 150, 210, 270, 330].map((deg, i) => (
                    <motion.div
                      key={`mid-${i}`}
                      className="absolute w-20 h-36 rounded-t-full shadow-xl origin-bottom"
                      style={{
                        background:
                          "linear-gradient(180deg, #FDF2F8 0%, #F472B6 40%, #BE185D 100%)",
                        border: "1px solid rgba(254,242,248,0.6)",
                        transformStyle: "preserve-3d",
                      }}
                      animate={{
                        rotateZ: deg,
                        rotateX: isOpen || still ? 75 : isOpening ? 70 : 15,
                        scale: isOpen || still ? 0.85 : 1,
                        opacity: isOpen && !still ? 0.25 : 1,
                      }}
                      transition={{
                        duration: reducedMotion ? 0 : 2.0,
                        delay: reducedMotion ? 0 : 0.15 + i * 0.05,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* ── Interactive Lotus Bud Trigger in Closed State ── */}
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
                      ? "அழைப்பிதழைத் திறக்க தாமரையைத் தொடவும்"
                      : "Tap lotus to reveal invitation"
                  }
                >
                  <motion.div
                    className="flex flex-col items-center"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    {/* Glowing Lotus Bud Jewel */}
                    <motion.div
                      className="relative flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-tr from-rose-500 via-pink-300 to-amber-300 p-1.5 shadow-[0_0_50px_rgba(244,114,182,0.6)]"
                      animate={{
                        scale: [1, 1.06, 1],
                        boxShadow: [
                          "0 0 35px rgba(244,114,182,0.4)",
                          "0 0 60px rgba(244,114,182,0.7)",
                          "0 0 35px rgba(244,114,182,0.4)",
                        ],
                      }}
                      transition={{
                        duration: 2.6,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#1A0A16] border-2 border-pink-200 text-pink-300 shadow-inner">
                        <Icon name="sparkle" size={26} />
                      </div>
                    </motion.div>

                    {/* Touch Prompt Pill */}
                    <div className="mt-6 rounded-full border border-pink-400/40 bg-black/80 px-5 py-2 backdrop-blur-md shadow-2xl flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-pink-400 animate-pulse" />
                      <span className="text-[13px] font-semibold tracking-wider text-pink-200">
                        {lang === "ta"
                          ? "அழைப்பிதழைத் திறக்க தாமரையைத் தொடவும்"
                          : "Tap lotus to bloom"}
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
