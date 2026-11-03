import { motion } from "motion/react"
import { Icon } from "../../../components/Icon"
import { CinematicFramework } from "./CinematicFramework"
import { InviteDetailsCard } from "./InviteDetailsCard"
import type { CinematicSceneProps } from "./types"

export function UtsavRangoli(props: CinematicSceneProps) {
  const { invite, lang, still, size, share, onReady, sample, art } = props

  return (
    <CinematicFramework
      invite={invite}
      lang={lang}
      title="The Utsav Rangoli"
      accentColor="#F43F5E"
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
                "radial-gradient(circle at 50% 30%, #3B0720 0%, #1E0310 55%, #0B0106 100%)",
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
              {/* ── Background: Deep Festive Plum & Diya Stepped Altar ── */}
              <div
                className="absolute inset-0 pointer-events-none flex items-center justify-center"
                style={{
                  transform: "translateZ(-130px)",
                  transformStyle: "preserve-3d",
                }}
              >
                <div className="relative w-[92%] h-[86%] rounded-[36px] bg-[#220413] border-2 border-rose-500/40 shadow-2xl overflow-hidden flex flex-col items-center">
                  {/* Concentric Rangoli Geometries in Background */}
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: `radial-gradient(circle at 50% 50%, #FB7185 10%, #E11D48 30%, transparent 60%)`,
                      backgroundSize: "54px 54px",
                    }}
                  />
                  <div className="absolute top-0 inset-x-0 h-44 bg-gradient-to-b from-rose-500/20 via-amber-400/10 to-transparent" />
                </div>
              </div>

              {/* ── Middle Layer: The Celebratory Utsav Invitation Card ── */}
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
                    bg: "rgba(38, 4, 21, 0.94)",
                    border: "2px solid rgba(244, 63, 94, 0.65)",
                    text: "#FFF1F2",
                    muted: "#FECDD3",
                    accent: "#F43F5E",
                    fontFamily: "Cormorant Garamond, serif",
                    taFontFamily: "Noto Serif Tamil, serif",
                  }}
                />
              </motion.div>

              {/* ── Foreground: Concentric Spinning 3D Rangoli Petal Mandala ── */}
              <div
                className="absolute inset-0 pointer-events-none flex items-center justify-center"
                style={{
                  transform: "translateZ(50px)",
                  transformStyle: "preserve-3d",
                }}
              >
                {/* Outer Ring Petals (Turmeric & Magenta) */}
                <motion.div
                  className="absolute w-80 h-80 flex items-center justify-center"
                  animate={{
                    rotate: isOpen || still ? 45 : isOpening ? [0, 90, 45] : 0,
                    scale: isOpen || still ? 1.15 : isOpening ? 1.1 : 1,
                    opacity: isOpen && !still ? 0.2 : 1,
                  }}
                  transition={{
                    duration: reducedMotion ? 0 : 2.5,
                    ease: "easeInOut",
                  }}
                >
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                    <div
                      key={`outer-petal-${deg}`}
                      className="absolute w-12 h-28 rounded-t-full origin-bottom shadow-lg"
                      style={{
                        transform: `rotate(${deg}deg)`,
                        background:
                          "linear-gradient(180deg, #F59E0B 0%, #E11D48 60%, #4C0519 100%)",
                        border: "1px solid rgba(245,158,11,0.5)",
                      }}
                    />
                  ))}
                </motion.div>

                {/* Inner Ring Petals (Peacock Teal & Gold) */}
                <motion.div
                  className="absolute w-60 h-60 flex items-center justify-center"
                  animate={{
                    rotate:
                      isOpen || still ? -45 : isOpening ? [0, -90, -45] : 0,
                    scale: isOpen || still ? 1.1 : isOpening ? 1.05 : 1,
                    opacity: isOpen && !still ? 0.25 : 1,
                  }}
                  transition={{
                    duration: reducedMotion ? 0 : 2.5,
                    ease: "easeInOut",
                  }}
                >
                  {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map(
                    (deg) => (
                      <div
                        key={`inner-petal-${deg}`}
                        className="absolute w-10 h-20 rounded-t-full origin-bottom shadow-lg"
                        style={{
                          transform: `rotate(${deg}deg)`,
                          background:
                            "linear-gradient(180deg, #14B8A6 0%, #BE123C 60%, #881337 100%)",
                          border: "1px solid rgba(251,191,36,0.6)",
                        }}
                      />
                    ),
                  )}
                </motion.div>
              </div>

              {/* ── Central Glowing Brass Diya Trigger in Closed State ── */}
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
                      : "Tap rangoli diya to open celebration"
                  }
                >
                  <motion.div
                    className="flex flex-col items-center"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    {/* Glowing Brass Oil Diya with Flickering Flame */}
                    <motion.div
                      className="relative flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-tr from-rose-600 via-amber-300 to-amber-600 p-1.5 shadow-[0_0_55px_rgba(244,63,94,0.7)]"
                      animate={{
                        scale: [1, 1.06, 1],
                        rotate: [0, -2, 2, 0],
                      }}
                      transition={{
                        duration: 2.8,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#3B0720] border-2 border-amber-300 text-amber-300 shadow-inner">
                        <Icon
                          name="sparkle"
                          size={26}
                          className="text-amber-300 animate-pulse"
                        />
                        <span className="text-[8.5px] uppercase tracking-widest font-bold text-amber-200 mt-1">
                          {lang === "ta" ? "உற்சவம்" : "Utsav"}
                        </span>
                      </div>
                    </motion.div>

                    {/* Touch Action Prompt Pill */}
                    <div className="mt-6 rounded-full border border-rose-400/50 bg-black/85 px-6 py-2.5 backdrop-blur-md shadow-2xl flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-400 animate-pulse" />
                      <span className="text-[13.5px] font-bold tracking-wider text-rose-100">
                        {lang === "ta"
                          ? "அழைப்பிதழைத் திறக்க தொடவும்"
                          : "Tap diya to open"}
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
