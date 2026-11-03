import { motion } from "motion/react"
import { Icon } from "../../../components/Icon"
import { CinematicFramework } from "./CinematicFramework"
import { InviteDetailsCard } from "./InviteDetailsCard"
import type { CinematicSceneProps } from "./types"

export function KanjivaramCeremony(props: CinematicSceneProps) {
  const { invite, lang, still, size, share, onReady, sample, art } = props

  return (
    <CinematicFramework
      invite={invite}
      lang={lang}
      title="The Kanjivaram Ceremony"
      accentColor="#EAB308"
      still={still}
      size={size}
      share={share}
      onReady={onReady}
      sample={sample}
      renderScene={({ state, onTriggerOpen, parallax, reducedMotion }) => {
        const isOpen = state === "opened"
        const isOpening = state === "opening"
        const isClosed = state === "closed"

        const cameraZ = isOpen ? 90 : isOpening ? 60 : 0
        const cameraRotX = 2 + parallax.y * 3
        const cameraRotY = parallax.x * 4

        return (
          <div
            className="relative h-full w-full overflow-hidden flex items-center justify-center"
            style={{
              background:
                "radial-gradient(circle at 50% 40%, #450A18 0%, #20040A 60%, #0D0104 100%)",
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
              {/* ── Background: Deep Silk Textile Drape with Anisotropic Sheen ── */}
              <div
                className="absolute inset-0 pointer-events-none opacity-40"
                style={{
                  backgroundImage: `radial-gradient(ellipse at 50% 50%, rgba(234,179,8,0.18) 0%, transparent 65%),
                                    repeating-linear-gradient(45deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 2px, transparent 2px, transparent 6px)`,
                }}
              />

              {/* ── Middle Layer: The Gold-Edged Invitation Card ── */}
              <motion.div
                className="relative z-10 flex flex-col items-center justify-center px-4"
                style={{
                  transformStyle: "preserve-3d",
                }}
                animate={{
                  opacity: isOpen || still ? 1 : isOpening ? [0, 0.4, 1] : 0,
                  y: isOpen || still ? 0 : 30,
                  z: isOpen || still ? 30 : -20,
                  scale: isOpen || still ? 1 : 0.95,
                }}
                transition={{
                  duration: reducedMotion ? 0 : 1.3,
                  delay: reducedMotion || still ? 0 : 1.5,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <div className="relative">
                  {/* Subtle highlight sweep across the zari border when opened */}
                  {isOpening && !reducedMotion && (
                    <motion.div
                      className="pointer-events-none absolute -inset-2 rounded-[28px] z-20"
                      initial={{ opacity: 0, backgroundPosition: "-200% 0" }}
                      animate={{
                        opacity: [0, 0.8, 0],
                        backgroundPosition: ["-100% 0", "200% 0"],
                      }}
                      transition={{
                        duration: 1.8,
                        delay: 1.6,
                        ease: "easeInOut",
                      }}
                      style={{
                        background:
                          "linear-gradient(115deg, transparent 20%, rgba(254,240,138,0.7) 50%, transparent 80%)",
                        backgroundSize: "200% 100%",
                      }}
                    />
                  )}

                  <InviteDetailsCard
                    invite={invite}
                    lang={lang}
                    art={art}
                    still={still}
                    style={{
                      bg: "linear-gradient(180deg, #500718 0%, #35040E 100%)",
                      border: "2px solid rgba(234, 179, 8, 0.65)",
                      text: "#FFFBEB",
                      muted: "#FDE68A",
                      accent: "#FACC15",
                      fontFamily: "Cormorant Garamond, serif",
                      taFontFamily: "Noto Serif Tamil, serif",
                    }}
                  />
                </div>
              </motion.div>

              {/* ── Foreground: Sculptural Silk Envelope with Zari Borders & Ribbon ── */}
              <div
                className="absolute inset-0 pointer-events-none flex items-center justify-center"
                style={{
                  transform: "translateZ(50px)",
                  transformStyle: "preserve-3d",
                }}
              >
                <div className="relative w-[90%] max-w-[390px] h-[540px] flex items-center justify-center">
                  {/* Top Silk Flap (Folds upward) */}
                  <motion.div
                    className="absolute top-0 inset-x-0 h-1/2 origin-top rounded-t-3xl overflow-hidden shadow-2xl"
                    style={{
                      transformStyle: "preserve-3d",
                      background:
                        "linear-gradient(180deg, #6B1124 0%, #831843 70%, #4A0716 100%)",
                      borderTop: "2px solid rgba(234,179,8,0.4)",
                    }}
                    animate={{
                      rotateX: isOpen || still ? -115 : isOpening ? -110 : 0,
                      opacity: isOpen && !still ? 0.2 : 1,
                    }}
                    transition={{
                      duration: reducedMotion ? 0 : 2.2,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    {/* Zari Border along bottom edge of top flap */}
                    <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-r from-amber-600 via-amber-300 to-amber-700 flex items-center justify-around px-2 shadow">
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="h-4 w-4 rounded-full border border-amber-800 opacity-60 flex items-center justify-center text-[7px] text-amber-950 font-serif"
                        >
                          ❖
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Bottom Silk Flap (Folds downward) */}
                  <motion.div
                    className="absolute bottom-0 inset-x-0 h-1/2 origin-bottom rounded-b-3xl overflow-hidden shadow-2xl"
                    style={{
                      transformStyle: "preserve-3d",
                      background:
                        "linear-gradient(0deg, #6B1124 0%, #831843 70%, #4A0716 100%)",
                      borderBottom: "2px solid rgba(234,179,8,0.4)",
                    }}
                    animate={{
                      rotateX: isOpen || still ? 115 : isOpening ? 110 : 0,
                      opacity: isOpen && !still ? 0.2 : 1,
                    }}
                    transition={{
                      duration: reducedMotion ? 0 : 2.2,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    {/* Zari Border along top edge of bottom flap */}
                    <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-r from-amber-600 via-amber-300 to-amber-700 flex items-center justify-around px-2 shadow">
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="h-4 w-4 rounded-full border border-amber-800 opacity-60 flex items-center justify-center text-[7px] text-amber-950 font-serif"
                        >
                          ❖
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Gold Brocade Ribbon Wrapping the closed envelope */}
                  <motion.div
                    className="absolute inset-x-0 h-12 bg-gradient-to-r from-amber-600 via-amber-300 to-amber-700 shadow-xl border-y border-amber-200/50 flex items-center justify-center"
                    animate={{
                      scaleY: isOpen || still ? 0 : isOpening ? [1, 1.2, 0] : 1,
                      opacity:
                        isOpen || still ? 0 : isOpening ? [1, 0.6, 0] : 1,
                    }}
                    transition={{
                      duration: reducedMotion ? 0 : 1.2,
                      ease: "easeInOut",
                    }}
                  />
                </div>
              </div>

              {/* ── Central Brass Medallion Seal (Interactive trigger in closed state) ── */}
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
                      ? "அழைப்பிதழைத் திறக்க தொடவும்"
                      : "Tap silk medallion to open invitation"
                  }
                >
                  <motion.div
                    className="flex flex-col items-center"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    {/* Embossed Brass Medallion */}
                    <motion.div
                      className="relative flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-tr from-amber-700 via-amber-300 to-amber-800 p-1.5 shadow-[0_0_50px_rgba(234,179,8,0.6)]"
                      animate={{
                        scale: [1, 1.06, 1],
                        rotate: [0, 2, -2, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#520B19] border-2 border-amber-300 text-amber-300 shadow-inner">
                        <Icon name="sparkle" size={26} />
                        <span className="text-[9px] uppercase tracking-widest font-semibold text-amber-200 mt-1">
                          {lang === "ta" ? "சுபம்" : "Zari"}
                        </span>
                      </div>
                    </motion.div>

                    {/* Touch Action Prompt Pill */}
                    <div className="mt-6 rounded-full border border-amber-300/40 bg-black/80 px-5 py-2 backdrop-blur-md shadow-2xl flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-300 animate-pulse" />
                      <span className="text-[13px] font-semibold tracking-wider text-amber-100">
                        {lang === "ta"
                          ? "அழைப்பிதழைத் திறக்க தொடவும்"
                          : "Tap medallion to open"}
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
