import { motion } from "motion/react"
import { Icon } from "../../../components/Icon"
import { CinematicFramework } from "./CinematicFramework"
import { InviteDetailsCard } from "./InviteDetailsCard"
import type { CinematicSceneProps } from "./types"

export function MarigoldMandap(props: CinematicSceneProps) {
  const { invite, lang, still, size, share, onReady, sample, art } = props

  return (
    <CinematicFramework
      invite={invite}
      lang={lang}
      title="The Grand Marigold Mandap"
      accentColor="#F59E0B"
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
        const cameraRotX = 3 + parallax.y * 3
        const cameraRotY = parallax.x * 4

        return (
          <div
            className="relative h-full w-full overflow-hidden flex items-center justify-center"
            style={{
              background:
                "radial-gradient(circle at 50% 30%, #451A03 0%, #250902 55%, #0F0301 100%)",
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
              {/* ── Background: Opulent Festive Tent Canopy with Gilded Torans ── */}
              <div
                className="absolute inset-0 pointer-events-none flex items-center justify-center"
                style={{
                  transform: "translateZ(-130px)",
                  transformStyle: "preserve-3d",
                }}
              >
                <div className="relative w-[92%] h-[86%] rounded-[36px] bg-[#2A0B04] border-2 border-amber-600/40 shadow-2xl overflow-hidden flex flex-col items-center">
                  {/* Saffron & Vermilion Festive Tent Fluting */}
                  <div className="absolute inset-0 opacity-25 flex">
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className="h-full flex-1"
                        style={{
                          background: i % 2 === 0 ? "#DC2626" : "#F59E0B",
                        }}
                      />
                    ))}
                  </div>
                  {/* Warm festive glow puddle */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-amber-500/20" />
                </div>
              </div>

              {/* ── Suspended Heavy Brass Temple Bells (Ghanti) on Left & Right ── */}
              <div
                className="absolute inset-x-5 top-4 pointer-events-none flex justify-between z-20"
                style={{ transform: "translateZ(35px)" }}
              >
                {/* Left Brass Bell with Tassel */}
                <motion.div
                  className="flex flex-col items-center origin-top"
                  animate={
                    reducedMotion ? undefined : { rotate: [-2.5, 2.5, -2.5] }
                  }
                  transition={{
                    duration: 3.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <div className="w-1 h-24 bg-gradient-to-b from-amber-200 via-amber-500 to-amber-700 shadow" />
                  <div className="w-8 h-8 rounded-t-full bg-gradient-to-b from-amber-300 via-amber-400 to-amber-700 border border-amber-200 shadow-xl" />
                  <div className="w-2.5 h-4 bg-amber-300 rounded-full -mt-0.5" />
                  <div className="w-3.5 h-10 bg-red-600 rounded-b-md shadow-md mt-0.5" />
                </motion.div>

                {/* Right Brass Bell with Tassel */}
                <motion.div
                  className="flex flex-col items-center origin-top"
                  animate={
                    reducedMotion ? undefined : { rotate: [2.5, -2.5, 2.5] }
                  }
                  transition={{
                    duration: 4.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <div className="w-1 h-24 bg-gradient-to-b from-amber-200 via-amber-500 to-amber-700 shadow" />
                  <div className="w-8 h-8 rounded-t-full bg-gradient-to-b from-amber-300 via-amber-400 to-amber-700 border border-amber-200 shadow-xl" />
                  <div className="w-2.5 h-4 bg-amber-300 rounded-full -mt-0.5" />
                  <div className="w-3.5 h-10 bg-red-600 rounded-b-md shadow-md mt-0.5" />
                </motion.div>
              </div>

              {/* ── Rose Petal Cascade Shower during Opening ── */}
              {isOpening && !reducedMotion && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
                  {[...Array(10)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute rounded-full shadow-lg"
                      style={{
                        width: 14 + (i % 3) * 6,
                        height: 20 + (i % 3) * 6,
                        background:
                          i % 2 === 0
                            ? "linear-gradient(135deg, #EF4444, #991B1B)"
                            : "linear-gradient(135deg, #FBBF24, #D97706)",
                        borderRadius: "60% 0 60% 0",
                        left: `${10 + i * 9}%`,
                      }}
                      initial={{ top: "-10%", opacity: 0, rotate: 0 }}
                      animate={{
                        top: "110%",
                        opacity: [0, 1, 1, 0],
                        rotate: (i % 2 === 0 ? 1 : -1) * 360,
                        x: (i % 2 === 0 ? 1 : -1) * 30,
                      }}
                      transition={{
                        duration: 2.8,
                        delay: 0.2 + i * 0.15,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </div>
              )}

              {/* ── Middle Layer: The Golden Festive Invitation Card ── */}
              <motion.div
                className="relative z-10 flex flex-col items-center justify-center px-4"
                style={{ transformStyle: "preserve-3d" }}
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
                    bg: "rgba(40, 10, 4, 0.94)",
                    border: "2px solid rgba(245, 158, 11, 0.65)",
                    text: "#FFFBEB",
                    muted: "#FDE68A",
                    accent: "#F59E0B",
                    fontFamily: "Cormorant Garamond, serif",
                    taFontFamily: "Noto Serif Tamil, serif",
                  }}
                />
              </motion.div>

              {/* ── Foreground: Dense Cascading Marigold Garlands (Genda Phool Curtain) ── */}
              <div
                className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden"
                style={{
                  transform: "translateZ(65px)",
                  transformStyle: "preserve-3d",
                }}
              >
                {/* Left Dense Marigold Swags */}
                <motion.div
                  className="absolute inset-y-0 left-0 w-1/2 flex justify-around px-2"
                  animate={{
                    x: isOpen || still ? -150 : isOpening ? -140 : 0,
                    rotateY: isOpen || still ? -70 : isOpening ? -65 : 0,
                    opacity: isOpen && !still ? 0.2 : 1,
                  }}
                  transition={{
                    duration: reducedMotion ? 0 : 2.4,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {[...Array(6)].map((_, col) => (
                    <div key={col} className="flex flex-col items-center gap-1">
                      {[...Array(14)].map((_, row) => {
                        const isOrange = (col + row) % 2 === 0
                        return (
                          <div
                            key={row}
                            className="w-7 h-7 rounded-full shadow-lg border border-amber-900/30 flex items-center justify-center"
                            style={{
                              background: isOrange
                                ? "radial-gradient(circle at 40% 40%, #FB923C 0%, #EA580C 65%, #9A3412 100%)"
                                : "radial-gradient(circle at 40% 40%, #FDE047 0%, #EAB308 65%, #A16207 100%)",
                            }}
                          >
                            <span className="w-2 h-2 rounded-full bg-amber-900/40" />
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </motion.div>

                {/* Right Dense Marigold Swags */}
                <motion.div
                  className="absolute inset-y-0 right-0 w-1/2 flex justify-around px-2"
                  animate={{
                    x: isOpen || still ? 150 : isOpening ? 140 : 0,
                    rotateY: isOpen || still ? 70 : isOpening ? 65 : 0,
                    opacity: isOpen && !still ? 0.2 : 1,
                  }}
                  transition={{
                    duration: reducedMotion ? 0 : 2.4,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {[...Array(6)].map((_, col) => (
                    <div key={col} className="flex flex-col items-center gap-1">
                      {[...Array(14)].map((_, row) => {
                        const isOrange = (col + row) % 2 !== 0
                        return (
                          <div
                            key={row}
                            className="w-7 h-7 rounded-full shadow-lg border border-amber-900/30 flex items-center justify-center"
                            style={{
                              background: isOrange
                                ? "radial-gradient(circle at 40% 40%, #FB923C 0%, #EA580C 65%, #9A3412 100%)"
                                : "radial-gradient(circle at 40% 40%, #FDE047 0%, #EAB308 65%, #A16207 100%)",
                            }}
                          >
                            <span className="w-2 h-2 rounded-full bg-amber-900/40" />
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* ── Central Ceremonial Brass Bell Trigger in Closed State ── */}
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
                      ? "அழைப்பிதழைத் திறக்க மணியைத் தொடவும்"
                      : "Tap temple bell to open floral mandap"
                  }
                >
                  <motion.div
                    className="flex flex-col items-center"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    {/* Glowing Sculpted Temple Bell */}
                    <motion.div
                      className="relative flex flex-col items-center justify-center h-28 w-24 rounded-full bg-gradient-to-tr from-amber-700 via-amber-300 to-amber-800 p-2 shadow-[0_0_60px_rgba(245,158,11,0.7)]"
                      animate={{
                        scale: [1, 1.05, 1],
                        rotate: [0, -3, 3, 0],
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#3B1207] border-2 border-amber-300 text-amber-300 shadow-inner">
                        <Icon name="sparkle" size={28} />
                        <span className="text-[9px] uppercase tracking-widest font-serif font-bold text-amber-200 mt-1">
                          {lang === "ta" ? "மங்கலம்" : "Mandap"}
                        </span>
                      </div>
                    </motion.div>

                    {/* Touch Action Prompt Pill */}
                    <div className="mt-6 rounded-full border border-amber-400/50 bg-black/85 px-6 py-2.5 backdrop-blur-md shadow-2xl flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
                      <span className="text-[13.5px] font-bold tracking-wider text-amber-200">
                        {lang === "ta"
                          ? "அழைப்பிதழைத் திறக்க மணியைத் தொடவும்"
                          : "Tap bell to open mandap"}
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
