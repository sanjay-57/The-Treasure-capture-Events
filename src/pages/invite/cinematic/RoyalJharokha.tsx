import { motion } from "motion/react"
import { Icon } from "../../../components/Icon"
import { CinematicFramework } from "./CinematicFramework"
import { InviteDetailsCard } from "./InviteDetailsCard"
import type { CinematicSceneProps } from "./types"

export function RoyalJharokha(props: CinematicSceneProps) {
  const { invite, lang, still, size, share, onReady, sample, art } = props

  return (
    <CinematicFramework
      invite={invite}
      lang={lang}
      title="The Royal Jharokha"
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

        const cameraZ = isOpen ? 100 : isOpening ? 65 : 0
        const cameraRotX = 2 + parallax.y * 3
        const cameraRotY = parallax.x * 4

        return (
          <div
            className="relative h-full w-full overflow-hidden flex items-center justify-center"
            style={{
              background:
                "radial-gradient(circle at 50% 35%, #4C0519 0%, #2B030D 60%, #0F0104 100%)",
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
              {/* ── Background: Palace Hall Alcove with Suspended Brocade & Warm Glow ── */}
              <div
                className="absolute inset-0 pointer-events-none flex items-center justify-center"
                style={{
                  transform: "translateZ(-120px)",
                  transformStyle: "preserve-3d",
                }}
              >
                {/* Deep palace chamber arch */}
                <div className="relative w-[90%] h-[84%] rounded-t-[140px] border-2 border-rose-900/50 bg-[#1F020A] overflow-hidden shadow-2xl flex flex-col items-center">
                  <div className="absolute top-0 inset-x-0 h-44 bg-gradient-to-b from-rose-600/20 via-amber-500/10 to-transparent" />
                  {/* Symmetrical wall brocade motifs */}
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 50% 50%, #F43F5E 2px, transparent 3px)",
                      backgroundSize: "36px 36px",
                    }}
                  />
                </div>
              </div>

              {/* ── Suspended Brass Jhumkas / Bells (Swaying on Left & Right) ── */}
              <div
                className="absolute inset-x-4 top-8 pointer-events-none flex justify-between z-20"
                style={{
                  transform: "translateZ(30px)",
                }}
              >
                {/* Left Suspended Bell */}
                <motion.div
                  className="flex flex-col items-center origin-top"
                  animate={
                    reducedMotion ? undefined : { rotate: [-1.5, 1.5, -1.5] }
                  }
                  transition={{
                    duration: 4.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <div className="w-0.5 h-20 bg-amber-400/70" />
                  <div className="w-6 h-6 rounded-t-full bg-gradient-to-b from-amber-300 to-amber-600 shadow-md border border-amber-200" />
                  <div className="w-1.5 h-3 bg-amber-200 rounded-full -mt-0.5" />
                </motion.div>

                {/* Right Suspended Bell */}
                <motion.div
                  className="flex flex-col items-center origin-top"
                  animate={
                    reducedMotion ? undefined : { rotate: [1.5, -1.5, 1.5] }
                  }
                  transition={{
                    duration: 4.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <div className="w-0.5 h-20 bg-amber-400/70" />
                  <div className="w-6 h-6 rounded-t-full bg-gradient-to-b from-amber-300 to-amber-600 shadow-md border border-amber-200" />
                  <div className="w-1.5 h-3 bg-amber-200 rounded-full -mt-0.5" />
                </motion.div>
              </div>

              {/* ── Middle Layer: The Royal Invitation Card ── */}
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
                    bg: "rgba(38, 3, 13, 0.94)",
                    border: "1.5px solid rgba(244, 63, 94, 0.55)",
                    text: "#FFF1F2",
                    muted: "#FECDD3",
                    accent: "#F43F5E",
                    fontFamily: "Cormorant Garamond, serif",
                    taFontFamily: "Noto Serif Tamil, serif",
                  }}
                />
              </motion.div>

              {/* ── Foreground: The Royal Jharokha Window with Carved Arch & Jaali Screens ── */}
              <div
                className="absolute inset-0 pointer-events-none flex items-center justify-center"
                style={{
                  transform: "translateZ(60px)",
                  transformStyle: "preserve-3d",
                }}
              >
                {/* Outer Sandstone & Ruby Multi-Cusped Arch */}
                <div className="relative w-[92%] max-w-[420px] h-[86%] rounded-t-[140px] border-4 border-[#881337] overflow-visible shadow-2xl flex">
                  {/* Outer Sandstone Trim Header */}
                  <div className="absolute -top-3 inset-x-0 h-6 border-b-2 border-amber-500/40 bg-gradient-to-r from-amber-700 via-amber-400 to-amber-800 rounded-t-xl" />

                  {/* Left Jaali Screen (Swings open outward) */}
                  <motion.div
                    className="relative w-1/2 h-full origin-left overflow-hidden select-none rounded-tl-[130px]"
                    style={{
                      transformStyle: "preserve-3d",
                      background:
                        "linear-gradient(90deg, #3A0410 0%, #500718 100%)",
                      borderRight: "1px solid #881337",
                      boxShadow: "inset 0 0 20px rgba(0,0,0,0.85)",
                    }}
                    animate={{
                      rotateY: isOpen || still ? -110 : isOpening ? -105 : 0,
                      opacity: isOpen && !still ? 0.2 : 1,
                    }}
                    transition={{
                      duration: reducedMotion ? 0 : 2.4,
                      ease: [0.25, 1, 0.35, 1],
                    }}
                  >
                    {/* Intricate Geometric Jaali Lattice (SVG Pattern) */}
                    <div
                      className="absolute inset-2 rounded-tl-[120px] border border-amber-500/30 opacity-70"
                      style={{
                        backgroundImage: `radial-gradient(circle at 50% 50%, #F59E0B 1px, transparent 1px),
                                          linear-gradient(45deg, transparent 40%, rgba(244,63,94,0.4) 40%, rgba(244,63,94,0.4) 60%, transparent 60%)`,
                        backgroundSize: "24px 24px",
                      }}
                    />
                  </motion.div>

                  {/* Right Jaali Screen (Swings open outward) */}
                  <motion.div
                    className="relative w-1/2 h-full origin-right overflow-hidden select-none rounded-tr-[130px]"
                    style={{
                      transformStyle: "preserve-3d",
                      background:
                        "linear-gradient(270deg, #3A0410 0%, #500718 100%)",
                      borderLeft: "1px solid #881337",
                      boxShadow: "inset 0 0 20px rgba(0,0,0,0.85)",
                    }}
                    animate={{
                      rotateY: isOpen || still ? 110 : isOpening ? 105 : 0,
                      opacity: isOpen && !still ? 0.2 : 1,
                    }}
                    transition={{
                      duration: reducedMotion ? 0 : 2.4,
                      ease: [0.25, 1, 0.35, 1],
                    }}
                  >
                    {/* Intricate Geometric Jaali Lattice (SVG Pattern) */}
                    <div
                      className="absolute inset-2 rounded-tr-[120px] border border-amber-500/30 opacity-70"
                      style={{
                        backgroundImage: `radial-gradient(circle at 50% 50%, #F59E0B 1px, transparent 1px),
                                          linear-gradient(45deg, transparent 40%, rgba(244,63,94,0.4) 40%, rgba(244,63,94,0.4) 60%, transparent 60%)`,
                        backgroundSize: "24px 24px",
                      }}
                    />
                  </motion.div>
                </div>
              </div>

              {/* ── Embossed Royal Seal Trigger in Closed State ── */}
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
                      ? "அழைப்பிதழைத் திறக்க அரச முத்திரையைத் தொடவும்"
                      : "Tap royal seal to open invitation"
                  }
                >
                  <motion.div
                    className="flex flex-col items-center"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    {/* Royal Red Lac Seal with Gold Insignia */}
                    <motion.div
                      className="relative flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-tr from-rose-700 via-rose-500 to-amber-500 p-1.5 shadow-[0_0_50px_rgba(244,63,94,0.6)]"
                      animate={{
                        scale: [1, 1.06, 1],
                        boxShadow: [
                          "0 0 30px rgba(244,63,94,0.4)",
                          "0 0 60px rgba(244,63,94,0.7)",
                          "0 0 30px rgba(244,63,94,0.4)",
                        ],
                      }}
                      transition={{
                        duration: 2.8,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#4C0519] border-2 border-amber-300 text-amber-300 shadow-inner">
                        <Icon name="gem" size={26} />
                        <span className="text-[8.5px] uppercase tracking-widest font-semibold text-amber-200 mt-1">
                          {lang === "ta" ? "அரச முத்திரை" : "Royal Seal"}
                        </span>
                      </div>
                    </motion.div>

                    {/* Touch Action Prompt Pill */}
                    <div className="mt-6 rounded-full border border-rose-400/40 bg-black/80 px-5 py-2 backdrop-blur-md shadow-2xl flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse" />
                      <span className="text-[13px] font-semibold tracking-wider text-rose-100">
                        {lang === "ta"
                          ? "அழைப்பிதழைத் திறக்க தொடவும்"
                          : "Tap seal to open"}
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
