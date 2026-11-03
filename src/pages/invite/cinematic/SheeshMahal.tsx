import { motion } from "motion/react"
import { Icon } from "../../../components/Icon"
import { CinematicFramework } from "./CinematicFramework"
import { InviteDetailsCard } from "./InviteDetailsCard"
import type { CinematicSceneProps } from "./types"

export function SheeshMahal(props: CinematicSceneProps) {
  const { invite, lang, still, size, share, onReady, sample, art } = props

  return (
    <CinematicFramework
      invite={invite}
      lang={lang}
      title="The Sheesh Mahal"
      accentColor="#10B981"
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
        const cameraRotX = 3 + parallax.y * 3
        const cameraRotY = parallax.x * 4

        return (
          <div
            className="relative h-full w-full overflow-hidden flex items-center justify-center"
            style={{
              background:
                "radial-gradient(circle at 50% 30%, #064E3B 0%, #022C22 55%, #02120E 100%)",
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
              {/* ── Background: Mirror Facet Mosaic Chamber (Thikri Glass) ── */}
              <div
                className="absolute inset-0 pointer-events-none flex items-center justify-center"
                style={{
                  transform: "translateZ(-130px)",
                  transformStyle: "preserve-3d",
                }}
              >
                <div className="relative w-[92%] h-[86%] rounded-[36px] bg-[#02261E] border-2 border-emerald-500/40 shadow-2xl overflow-hidden flex flex-col items-center">
                  {/* Diamond Mirror Tiles Grid with Shimmer */}
                  <div
                    className="absolute inset-0 opacity-25"
                    style={{
                      backgroundImage: `linear-gradient(45deg, #10B981 25%, transparent 25%),
                                        linear-gradient(-45deg, #10B981 25%, transparent 25%),
                                        linear-gradient(45deg, transparent 75%, #10B981 75%),
                                        linear-gradient(-45deg, transparent 75%, #10B981 75%)`,
                      backgroundSize: "36px 36px",
                    }}
                  />
                  <div className="absolute top-0 inset-x-0 h-44 bg-gradient-to-b from-emerald-400/20 via-amber-300/10 to-transparent" />
                </div>
              </div>

              {/* ── Suspended Crystal Chandeliers on Top Left & Right ── */}
              <div
                className="absolute inset-x-6 top-3 pointer-events-none flex justify-between z-20"
                style={{ transform: "translateZ(40px)" }}
              >
                {/* Left Crystal Chandelier */}
                <motion.div
                  className="flex flex-col items-center origin-top"
                  animate={
                    reducedMotion ? undefined : { rotate: [-1.8, 1.8, -1.8] }
                  }
                  transition={{
                    duration: 4.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <div className="w-0.5 h-16 bg-amber-300" />
                  <div className="w-10 h-3 rounded bg-amber-400 shadow flex justify-around">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className="w-1 h-3 bg-cyan-100 rounded-b shadow-sm"
                      />
                    ))}
                  </div>
                </motion.div>

                {/* Right Crystal Chandelier */}
                <motion.div
                  className="flex flex-col items-center origin-top"
                  animate={
                    reducedMotion ? undefined : { rotate: [1.8, -1.8, 1.8] }
                  }
                  transition={{
                    duration: 4.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <div className="w-0.5 h-16 bg-amber-300" />
                  <div className="w-10 h-3 rounded bg-amber-400 shadow flex justify-around">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className="w-1 h-3 bg-cyan-100 rounded-b shadow-sm"
                      />
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* ── Middle Layer: Emerald Velvet & Gold Invitation Card ── */}
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
                    bg: "rgba(2, 38, 30, 0.95)",
                    border: "2px solid rgba(16, 185, 129, 0.65)",
                    text: "#ECFDF5",
                    muted: "#A7F3D0",
                    accent: "#10B981",
                    fontFamily: "Cormorant Garamond, serif",
                    taFontFamily: "Noto Serif Tamil, serif",
                  }}
                />
              </motion.div>

              {/* ── Foreground: Mirrored Palace Archway & Gates (Thikri Facets) ── */}
              <div
                className="absolute inset-0 pointer-events-none flex items-center justify-center"
                style={{
                  transform: "translateZ(60px)",
                  transformStyle: "preserve-3d",
                }}
              >
                <div className="relative w-[92%] max-w-[420px] h-[86%] rounded-t-[140px] border-4 border-[#064E3B] overflow-visible shadow-2xl flex">
                  {/* Left Mirrored Gate Shutter */}
                  <motion.div
                    className="relative w-1/2 h-full origin-left overflow-hidden select-none rounded-tl-[130px]"
                    style={{
                      transformStyle: "preserve-3d",
                      background:
                        "linear-gradient(90deg, #022019 0%, #064E3B 100%)",
                      borderRight: "1.5px solid #10B981",
                      boxShadow: "inset 0 0 25px rgba(0,0,0,0.85)",
                    }}
                    animate={{
                      rotateY: isOpen || still ? -112 : isOpening ? -108 : 0,
                      opacity: isOpen && !still ? 0.2 : 1,
                    }}
                    transition={{
                      duration: reducedMotion ? 0 : 2.4,
                      ease: [0.25, 1, 0.35, 1],
                    }}
                  >
                    {/* Mirror Mosaic Inlay Pattern */}
                    <div
                      className="absolute inset-3 rounded-tl-[120px] border border-amber-300/40 opacity-70"
                      style={{
                        backgroundImage:
                          "radial-gradient(circle at 50% 50%, #6EE7B7 1.5px, transparent 1.5px)",
                        backgroundSize: "20px 20px",
                      }}
                    />
                  </motion.div>

                  {/* Right Mirrored Gate Shutter */}
                  <motion.div
                    className="relative w-1/2 h-full origin-right overflow-hidden select-none rounded-tr-[130px]"
                    style={{
                      transformStyle: "preserve-3d",
                      background:
                        "linear-gradient(270deg, #022019 0%, #064E3B 100%)",
                      borderLeft: "1.5px solid #10B981",
                      boxShadow: "inset 0 0 25px rgba(0,0,0,0.85)",
                    }}
                    animate={{
                      rotateY: isOpen || still ? 112 : isOpening ? 108 : 0,
                      opacity: isOpen && !still ? 0.2 : 1,
                    }}
                    transition={{
                      duration: reducedMotion ? 0 : 2.4,
                      ease: [0.25, 1, 0.35, 1],
                    }}
                  >
                    {/* Mirror Mosaic Inlay Pattern */}
                    <div
                      className="absolute inset-3 rounded-tr-[120px] border border-amber-300/40 opacity-70"
                      style={{
                        backgroundImage:
                          "radial-gradient(circle at 50% 50%, #6EE7B7 1.5px, transparent 1.5px)",
                        backgroundSize: "20px 20px",
                      }}
                    />
                  </motion.div>
                </div>
              </div>

              {/* ── Imperial Emerald Medallion Trigger in Closed State ── */}
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
                      ? "அழைப்பிதழைத் திறக்க அரண்மனை கதவைத் தொடவும்"
                      : "Tap mirror palace medallion to open"
                  }
                >
                  <motion.div
                    className="flex flex-col items-center"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    {/* Glowing Emerald Jewel Medallion */}
                    <motion.div
                      className="relative flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-tr from-emerald-600 via-amber-300 to-emerald-700 p-1.5 shadow-[0_0_50px_rgba(16,185,129,0.7)]"
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
                      <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#022C22] border-2 border-emerald-300 text-emerald-300 shadow-inner">
                        <Icon name="gem" size={26} />
                        <span className="text-[8.5px] uppercase tracking-widest font-bold text-emerald-200 mt-1">
                          {lang === "ta" ? "அரண்மனை" : "Mahal"}
                        </span>
                      </div>
                    </motion.div>

                    {/* Touch Action Prompt Pill */}
                    <div className="mt-6 rounded-full border border-emerald-400/50 bg-black/85 px-6 py-2.5 backdrop-blur-md shadow-2xl flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[13.5px] font-bold tracking-wider text-emerald-100">
                        {lang === "ta"
                          ? "அழைப்பிதழைத் திறக்க தொடவும்"
                          : "Tap to enter mirror palace"}
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
