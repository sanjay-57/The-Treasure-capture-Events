import { motion } from "motion/react"
import { Icon } from "../../../components/Icon"
import { CinematicFramework } from "./CinematicFramework"
import { InviteDetailsCard } from "./InviteDetailsCard"
import type { CinematicSceneProps } from "./types"

export function MoonlitJasmine(props: CinematicSceneProps) {
  const { invite, lang, still, size, share, onReady, sample, art } = props

  return (
    <CinematicFramework
      invite={invite}
      lang={lang}
      title="Moonlit Jasmine"
      accentColor="#60A5FA"
      still={still}
      size={size}
      share={share}
      onReady={onReady}
      sample={sample}
      renderScene={({ state, onTriggerOpen, parallax, reducedMotion }) => {
        const isOpen = state === "opened"
        const isOpening = state === "opening"
        const isClosed = state === "closed"

        const cameraZ = isOpen ? 85 : isOpening ? 50 : 0
        const cameraX = isOpen ? 0 : isOpening ? 10 : 0
        const cameraRotX = 2 + parallax.y * 3
        const cameraRotY = parallax.x * 4

        return (
          <div
            className="relative h-full w-full overflow-hidden flex items-center justify-center"
            style={{
              background:
                "radial-gradient(circle at 50% 25%, #152244 0%, #0B1329 60%, #040814 100%)",
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
                x: cameraX,
                rotateX: cameraRotX,
                rotateY: cameraRotY,
              }}
              transition={{
                duration: reducedMotion ? 0 : isOpening ? 3.0 : 0.8,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {/* ── Background: Silver Moonlight Orb & Silhouetted Garden Trees ── */}
              <div
                className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center"
                style={{
                  transform: "translateZ(-140px)",
                  transformStyle: "preserve-3d",
                }}
              >
                {/* Luminous Silver Full Moon */}
                <div className="absolute top-12 h-36 w-36 rounded-full bg-gradient-to-tr from-slate-200 via-blue-100 to-white shadow-[0_0_80px_rgba(224,231,255,0.4)] opacity-90" />

                {/* Starry Night Sky Ambient Points */}
                <div
                  className="absolute inset-0 opacity-40"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 50% 50%, #93C5FD 1px, transparent 1px)",
                    backgroundSize: "48px 48px",
                  }}
                />

                {/* Distant Temple Tower / Tree Canopy Silhouette */}
                <div className="absolute bottom-0 inset-x-0 h-44 bg-gradient-to-t from-[#040814] via-[#081024] to-transparent" />
              </div>

              {/* ── Midground: Ornamental Heritage Swing (Oonjal) ── */}
              <div
                className="absolute inset-x-8 top-10 bottom-24 pointer-events-none flex justify-between"
                style={{
                  transform: "translateZ(-40px)",
                  transformStyle: "preserve-3d",
                }}
              >
                {/* Left Brass Swing Chain */}
                <div className="w-1.5 h-[70%] bg-gradient-to-b from-amber-300 via-amber-600 to-amber-700 shadow flex flex-col justify-around items-center">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="w-3 h-3 rounded-full border border-amber-300/60"
                    />
                  ))}
                </div>

                {/* Right Brass Swing Chain */}
                <div className="w-1.5 h-[70%] bg-gradient-to-b from-amber-300 via-amber-600 to-amber-700 shadow flex flex-col justify-around items-center">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="w-3 h-3 rounded-full border border-amber-300/60"
                    />
                  ))}
                </div>
              </div>

              {/* ── Middle Layer: The Moonlit Invitation Card ── */}
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
                  delay: reducedMotion || still ? 0 : 1.4,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <InviteDetailsCard
                  invite={invite}
                  lang={lang}
                  art={art}
                  still={still}
                  style={{
                    bg: "rgba(11, 20, 42, 0.92)",
                    border: "1.5px solid rgba(147, 197, 253, 0.45)",
                    text: "#F0F9FF",
                    muted: "#BAE6FD",
                    accent: "#60A5FA",
                    fontFamily: "Cormorant Garamond, serif",
                    taFontFamily: "Noto Serif Tamil, serif",
                  }}
                />
              </motion.div>

              {/* ── Foreground: Dense Hanging Jasmine Garlands (Part during opening) ── */}
              <div
                className="absolute inset-0 pointer-events-none overflow-hidden"
                style={{
                  transform: "translateZ(60px)",
                  transformStyle: "preserve-3d",
                }}
              >
                {/* Left Garland Curtain */}
                <motion.div
                  className="absolute -top-6 left-0 w-1/2 h-full flex justify-around px-2"
                  animate={{
                    x: isOpen || still ? -140 : isOpening ? -130 : 0,
                    rotate: isOpen || still ? -12 : isOpening ? -10 : 0,
                    opacity: isOpen && !still ? 0.3 : 1,
                  }}
                  transition={{
                    duration: reducedMotion ? 0 : 2.4,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="w-1.5 h-full flex flex-col gap-1 items-center">
                        {[...Array(22)].map((_, j) => (
                          <span
                            key={j}
                            className="w-2.5 h-3.5 rounded-full bg-slate-50 border border-emerald-900/30 shadow-sm"
                            style={{
                              transform: `rotate(${((i + j) % 2 === 0 ? 1 : -1) * 8}deg)`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </motion.div>

                {/* Right Garland Curtain */}
                <motion.div
                  className="absolute -top-6 right-0 w-1/2 h-full flex justify-around px-2"
                  animate={{
                    x: isOpen || still ? 140 : isOpening ? 130 : 0,
                    rotate: isOpen || still ? 12 : isOpening ? 10 : 0,
                    opacity: isOpen && !still ? 0.3 : 1,
                  }}
                  transition={{
                    duration: reducedMotion ? 0 : 2.4,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="w-1.5 h-full flex flex-col gap-1 items-center">
                        {[...Array(22)].map((_, j) => (
                          <span
                            key={j}
                            className="w-2.5 h-3.5 rounded-full bg-slate-50 border border-emerald-900/30 shadow-sm"
                            style={{
                              transform: `rotate(${((i + j) % 2 === 0 ? -1 : 1) * 8}deg)`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* ── Warm Brass Hanging Lantern Trigger in Closed State ── */}
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
                      ? "அழைப்பிதழைத் திறக்க விளக்கை தொடவும்"
                      : "Tap lantern to enter moonlit garden"
                  }
                >
                  <motion.div
                    className="flex flex-col items-center"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    {/* Glowing Traditional Brass Lantern */}
                    <motion.div
                      className="relative flex flex-col items-center justify-center h-28 w-20 rounded-2xl bg-gradient-to-b from-amber-600 via-amber-300 to-amber-700 p-1 shadow-[0_0_60px_rgba(245,158,11,0.7)]"
                      animate={{
                        y: [-2, 2, -2],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      {/* Top Ring */}
                      <div className="w-6 h-6 rounded-full border-2 border-amber-200 -mt-4 bg-amber-600" />
                      {/* Glass Body with Warm Light Flame */}
                      <div className="flex h-full w-full flex-col items-center justify-center rounded-xl bg-gradient-to-b from-amber-900/80 via-amber-500/90 to-amber-900/80 border border-amber-200 text-amber-100 shadow-inner">
                        <Icon
                          name="sparkle"
                          size={24}
                          className="text-amber-200 animate-pulse"
                        />
                      </div>
                    </motion.div>

                    {/* Touch Action Prompt Pill */}
                    <div className="mt-6 rounded-full border border-blue-300/40 bg-black/80 px-5 py-2 backdrop-blur-md shadow-2xl flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-blue-300 animate-pulse" />
                      <span className="text-[13px] font-semibold tracking-wider text-blue-100">
                        {lang === "ta"
                          ? "அழைப்பிதழைத் திறக்க தொடவும்"
                          : "Tap to enter garden"}
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
