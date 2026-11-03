import { motion } from "motion/react"
import { Icon } from "../../../components/Icon"
import { CinematicFramework } from "./CinematicFramework"
import { InviteDetailsCard } from "./InviteDetailsCard"
import type { CinematicSceneProps } from "./types"

export function MayilMandapam(props: CinematicSceneProps) {
  const { invite, lang, still, size, share, onReady, sample, art } = props

  return (
    <CinematicFramework
      invite={invite}
      lang={lang}
      title="The Mayil Mandapam"
      accentColor="#14B8A6"
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
        const cameraRotX = 2 + parallax.y * 3
        const cameraRotY = parallax.x * 4

        return (
          <div
            className="relative h-full w-full overflow-hidden flex items-center justify-center"
            style={{
              background:
                "radial-gradient(circle at 50% 35%, #042F2E 0%, #0F172A 60%, #020617 100%)",
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
              {/* ── Background: Royal Darbar with Inlaid Lapis Lazuli & Gold Arch ── */}
              <div
                className="absolute inset-0 pointer-events-none flex items-center justify-center"
                style={{
                  transform: "translateZ(-130px)",
                  transformStyle: "preserve-3d",
                }}
              >
                <div className="relative w-[92%] h-[86%] rounded-t-[160px] bg-[#02201F] border-2 border-teal-500/40 shadow-2xl overflow-hidden flex flex-col items-center">
                  {/* Peacock Feather Scale Geometric Wall Inlay */}
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: `radial-gradient(circle at 50% 50%, #14B8A6 10%, #064E3B 40%, transparent 70%)`,
                      backgroundSize: "48px 48px",
                    }}
                  />
                  <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-teal-400/20 via-emerald-600/10 to-transparent" />
                </div>
              </div>

              {/* ── Middle Layer: The Peacock Throne Invitation Card ── */}
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
                    bg: "rgba(3, 30, 29, 0.94)",
                    border: "2px solid rgba(20, 184, 166, 0.65)",
                    text: "#F0FDFA",
                    muted: "#99F6E4",
                    accent: "#14B8A6",
                    fontFamily: "Cormorant Garamond, serif",
                    taFontFamily: "Noto Serif Tamil, serif",
                  }}
                />
              </motion.div>

              {/* ── Foreground: Sculpted Peacock Feathers (Concentric 3D Fan) ── */}
              <div
                className="absolute inset-0 pointer-events-none flex items-center justify-center"
                style={{
                  transform: "translateZ(55px)",
                  transformStyle: "preserve-3d",
                }}
              >
                <div className="relative w-80 h-96 flex items-center justify-center">
                  {/* Left Peacock Wing Feathers */}
                  {[-45, -30, -15, 0].map((deg, i) => (
                    <motion.div
                      key={`left-feather-${i}`}
                      className="absolute w-24 h-52 rounded-t-full shadow-2xl origin-bottom"
                      style={{
                        background:
                          "linear-gradient(180deg, #14B8A6 0%, #0F766E 35%, #1E3A8A 70%, #042F2E 100%)",
                        border: "1.5px solid rgba(20,184,166,0.6)",
                        transformStyle: "preserve-3d",
                      }}
                      animate={{
                        rotateZ:
                          isOpen || still
                            ? deg - 55
                            : isOpening
                              ? deg - 50
                              : deg,
                        rotateY: isOpen || still ? -85 : isOpening ? -80 : 0,
                        opacity: isOpen && !still ? 0.2 : 1,
                      }}
                      transition={{
                        duration: reducedMotion ? 0 : 2.2,
                        delay: reducedMotion ? 0 : i * 0.08,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      {/* Peacock Eye Motif at Tip */}
                      <div className="mx-auto mt-3 h-10 w-8 rounded-full border border-amber-300 bg-gradient-to-tr from-amber-400 via-teal-300 to-blue-600 shadow-inner flex items-center justify-center">
                        <div className="h-5 w-4 rounded-full bg-[#02201F] border border-amber-200" />
                      </div>
                    </motion.div>
                  ))}

                  {/* Right Peacock Wing Feathers */}
                  {[0, 15, 30, 45].map((deg, i) => (
                    <motion.div
                      key={`right-feather-${i}`}
                      className="absolute w-24 h-52 rounded-t-full shadow-2xl origin-bottom"
                      style={{
                        background:
                          "linear-gradient(180deg, #14B8A6 0%, #0F766E 35%, #1E3A8A 70%, #042F2E 100%)",
                        border: "1.5px solid rgba(20,184,166,0.6)",
                        transformStyle: "preserve-3d",
                      }}
                      animate={{
                        rotateZ:
                          isOpen || still
                            ? deg + 55
                            : isOpening
                              ? deg + 50
                              : deg,
                        rotateY: isOpen || still ? 85 : isOpening ? 80 : 0,
                        opacity: isOpen && !still ? 0.2 : 1,
                      }}
                      transition={{
                        duration: reducedMotion ? 0 : 2.2,
                        delay: reducedMotion ? 0 : i * 0.08,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      {/* Peacock Eye Motif at Tip */}
                      <div className="mx-auto mt-3 h-10 w-8 rounded-full border border-amber-300 bg-gradient-to-tr from-amber-400 via-teal-300 to-blue-600 shadow-inner flex items-center justify-center">
                        <div className="h-5 w-4 rounded-full bg-[#02201F] border border-amber-200" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* ── Royal Emerald Brooch Trigger in Closed State ── */}
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
                      ? "அழைப்பிதழைத் திறக்க மயில் பதக்கத்தைத் தொடவும்"
                      : "Tap peacock brooch to open invitation"
                  }
                >
                  <motion.div
                    className="flex flex-col items-center"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    {/* Glowing Emerald Peacock Jewel */}
                    <motion.div
                      className="relative flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-tr from-teal-500 via-amber-300 to-emerald-600 p-1.5 shadow-[0_0_50px_rgba(20,184,166,0.7)]"
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
                      <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#042F2E] border-2 border-teal-300 text-teal-200 shadow-inner">
                        <Icon name="gem" size={26} />
                        <span className="text-[8.5px] uppercase tracking-widest font-bold text-teal-300 mt-1">
                          {lang === "ta" ? "மயில்" : "Mayil"}
                        </span>
                      </div>
                    </motion.div>

                    {/* Touch Action Prompt Pill */}
                    <div className="mt-6 rounded-full border border-teal-400/50 bg-black/85 px-6 py-2.5 backdrop-blur-md shadow-2xl flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-teal-400 animate-pulse" />
                      <span className="text-[13.5px] font-bold tracking-wider text-teal-100">
                        {lang === "ta"
                          ? "அழைப்பிதழைத் திறக்க தொடவும்"
                          : "Tap to reveal darbar"}
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
