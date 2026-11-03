import { useState } from "react"
import { motion } from "motion/react"
import { Icon } from "../../../components/Icon"
import { CinematicFramework } from "./CinematicFramework"
import { InviteDetailsCard } from "./InviteDetailsCard"
import type { CinematicSceneProps } from "./types"

export function ChettinadCourtyard(props: CinematicSceneProps) {
  const { invite, lang, still, size, share, onReady, sample, art } = props

  return (
    <CinematicFramework
      invite={invite}
      lang={lang}
      title="The Chettinad Courtyard"
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

        // 3D camera transforms
        const cameraZ = isOpen ? 120 : isOpening ? 80 : 0
        const cameraY = isOpen ? -10 : isOpening ? -5 : 0
        const cameraRotX = 3 + parallax.y * 3
        const cameraRotY = parallax.x * 4

        return (
          <div
            className="relative h-full w-full overflow-hidden flex items-center justify-center"
            style={{
              background:
                "radial-gradient(circle at 50% 35%, #2D1810 0%, #150A06 55%, #080402 100%)",
              transformStyle: "preserve-3d",
              WebkitTransformStyle: "preserve-3d",
            }}
          >
            {/* Camera Rig with smooth transitions and subtle desktop parallax */}
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
              {/* ── Layer 1: Athangudi Tiled Ground Plane (Perspective Floor) ── */}
              <div
                className="absolute -bottom-16 inset-x-0 h-[65%] origin-bottom overflow-hidden pointer-events-none"
                style={{
                  transform: "rotateX(64deg) translateZ(-60px)",
                  transformStyle: "preserve-3d",
                  background:
                    "linear-gradient(180deg, #1A0D07 0%, #36170D 60%, #120703 100%)",
                  boxShadow: "inset 0 40px 80px rgba(0,0,0,0.8)",
                }}
              >
                {/* Athangudi Encaustic Tile Grid */}
                <div
                  className="absolute inset-0 opacity-45"
                  style={{
                    backgroundImage: `radial-gradient(circle at 50% 50%, #D97706 8%, transparent 9%),
                                      linear-gradient(45deg, #7C2D12 25%, transparent 25%, transparent 75%, #7C2D12 75%),
                                      linear-gradient(-45deg, #7C2D12 25%, transparent 25%, transparent 75%, #7C2D12 75%)`,
                    backgroundSize: "72px 72px",
                    backgroundPosition: "0 0, 36px 36px, 36px 36px",
                  }}
                />
                {/* Radial warm lighting puddle on floor from lamps */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(ellipse at 50% 30%, rgba(245,158,11,0.35) 0%, rgba(180,83,9,0.15) 45%, transparent 75%)",
                  }}
                />
              </div>

              {/* ── Layer 2: Courtyard Background & Chettinad Pillars ── */}
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{
                  transform: "translateZ(-140px)",
                  transformStyle: "preserve-3d",
                }}
              >
                {/* Heritage Courtyard Wall Niche */}
                <div className="relative w-[88%] h-[82%] rounded-[36px] border border-[#522513]/40 bg-[#1D0C06] overflow-hidden shadow-2xl flex flex-col items-center justify-center">
                  {/* Distant sunlight/moonlight skylight glow */}
                  <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-amber-500/20 via-amber-700/10 to-transparent" />
                  {/* Subtle traditional terracotta roof tile silhouettes */}
                  <div className="absolute top-0 inset-x-0 h-10 border-b border-[#7C2D12]/30 flex justify-around opacity-40">
                    {[...Array(14)].map((_, i) => (
                      <span
                        key={i}
                        className="w-5 h-8 border-r border-[#7C2D12] rounded-b-md"
                      />
                    ))}
                  </div>
                </div>

                {/* Left Chettinad Carved Wooden Pillar */}
                <div
                  className="absolute left-3 top-8 bottom-12 w-10 sm:w-12 rounded-t-lg shadow-2xl flex flex-col items-center"
                  style={{
                    background:
                      "linear-gradient(90deg, #2B1107 0%, #5E2612 40%, #7C3518 60%, #220B04 100%)",
                    boxShadow: "15px 0 35px rgba(0,0,0,0.6)",
                  }}
                >
                  {/* Pillar Capital Brackets */}
                  <div className="w-14 sm:w-16 h-6 rounded-md bg-[#8A3A19] border-t-2 border-amber-500/40 shadow" />
                  <div className="w-12 sm:w-14 h-4 bg-[#4A1B0B] border-t border-black/40" />
                  {/* Brass Rings on Pillar */}
                  <div className="my-auto w-full h-3 bg-gradient-to-r from-amber-600 via-amber-300 to-amber-700 shadow" />
                  {/* Stone Base */}
                  <div className="w-14 sm:w-16 h-10 rounded-b-md bg-[#2B2825] border-t-2 border-[#57534E]" />
                </div>

                {/* Right Chettinad Carved Wooden Pillar */}
                <div
                  className="absolute right-3 top-8 bottom-12 w-10 sm:w-12 rounded-t-lg shadow-2xl flex flex-col items-center"
                  style={{
                    background:
                      "linear-gradient(90deg, #220B04 0%, #7C3518 40%, #5E2612 60%, #2B1107 100%)",
                    boxShadow: "-15px 0 35px rgba(0,0,0,0.6)",
                  }}
                >
                  {/* Pillar Capital Brackets */}
                  <div className="w-14 sm:w-16 h-6 rounded-md bg-[#8A3A19] border-t-2 border-amber-500/40 shadow" />
                  <div className="w-12 sm:w-14 h-4 bg-[#4A1B0B] border-t border-black/40" />
                  {/* Brass Rings on Pillar */}
                  <div className="my-auto w-full h-3 bg-gradient-to-r from-amber-600 via-amber-300 to-amber-700 shadow" />
                  {/* Stone Base */}
                  <div className="w-14 sm:w-16 h-10 rounded-b-md bg-[#2B2825] border-t-2 border-[#57534E]" />
                </div>
              </div>

              {/* ── Layer 3: Central Invitation Inside The Courtyard ── */}
              <motion.div
                className="relative z-10 flex flex-col items-center justify-center px-4"
                style={{
                  transformStyle: "preserve-3d",
                  WebkitTransformStyle: "preserve-3d",
                }}
                animate={{
                  opacity: isOpen || still ? 1 : isOpening ? [0, 0.3, 1] : 0,
                  y: isOpen || still ? 0 : 20,
                  scale: isOpen || still ? 1 : 0.94,
                  z: isOpen || still ? 20 : -20,
                }}
                transition={{
                  duration: reducedMotion ? 0 : 1.4,
                  delay: reducedMotion || still ? 0 : 1.6,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <InviteDetailsCard
                  invite={invite}
                  lang={lang}
                  art={art}
                  still={still}
                  style={{
                    bg: "rgba(30, 14, 8, 0.92)",
                    border: "1.5px solid rgba(245, 158, 11, 0.4)",
                    text: "#FAF5EE",
                    muted: "#D4B895",
                    accent: "#F59E0B",
                    fontFamily: "Cormorant Garamond, serif",
                    taFontFamily: "Noto Serif Tamil, serif",
                  }}
                />
              </motion.div>

              {/* ── Layer 4: Carved Heritage Double Doors & Archway (Foreground Entrance) ── */}
              <div
                className="absolute inset-0 pointer-events-none flex items-center justify-center"
                style={{
                  transform: "translateZ(70px)",
                  transformStyle: "preserve-3d",
                }}
              >
                {/* Lintel / Top Arch with Mango Leaves & Jasmine Garlands */}
                <div className="absolute top-0 inset-x-2 h-20 sm:h-24 z-30 pointer-events-none">
                  {/* Carved Dark Teak Lintel */}
                  <div
                    className="w-full h-12 sm:h-14 rounded-b-xl border-b-2 border-amber-500/50 flex items-center justify-center shadow-2xl"
                    style={{
                      background:
                        "linear-gradient(180deg, #4A1A0C 0%, #2A0D05 100%)",
                    }}
                  >
                    <div className="w-[85%] h-5 border border-amber-500/30 rounded-sm flex items-center justify-center">
                      <span className="text-[10px] sm:text-[11px] font-serif uppercase tracking-[0.3em] text-amber-300/80">
                        {lang === "ta" ? "சுபகாரியம்" : "Subham · Mangalam"}
                      </span>
                    </div>
                  </div>

                  {/* Hanging Jasmine & Mango Leaf Thoranam Garland */}
                  <div className="w-full flex justify-between px-3 -mt-1.5 opacity-90">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="flex flex-col items-center">
                        {/* Leaf */}
                        <div
                          className="w-4 h-6 rounded-b-full bg-emerald-800 shadow-md border-t border-emerald-600"
                          style={{
                            transform: `rotate(${(i % 2 === 0 ? 1 : -1) * 6}deg)`,
                          }}
                        />
                        {/* Jasmine Buds */}
                        <div className="w-1.5 h-3 bg-amber-50 rounded-full mt-0.5 shadow-sm" />
                        <div className="w-1.5 h-2.5 bg-amber-50 rounded-full mt-0.5 opacity-80" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Door Frame & Double Doors Wrapper */}
                <div
                  className="relative w-[92%] max-w-[420px] h-[85%] rounded-[24px] border-4 border-[#3D170A] overflow-visible shadow-2xl flex"
                  style={{
                    transformStyle: "preserve-3d",
                  }}
                >
                  {/* Left Door Leaf (Pivots inward along left edge) */}
                  <motion.div
                    className="relative w-1/2 h-full origin-left overflow-hidden select-none"
                    style={{
                      transformStyle: "preserve-3d",
                      background:
                        "linear-gradient(90deg, #1A0702 0%, #461C0E 25%, #6B2C16 85%, #341208 100%)",
                      borderRight: "2px solid #1A0702",
                      boxShadow: "inset 0 0 30px rgba(0,0,0,0.85)",
                    }}
                    animate={{
                      rotateY: isOpen || still ? -112 : isOpening ? -108 : 0,
                      opacity: isOpen && !still ? 0.25 : 1,
                    }}
                    transition={{
                      duration: reducedMotion ? 0 : 2.4,
                      ease: [0.25, 1, 0.35, 1],
                    }}
                  >
                    {/* Carved Relief Panels on Left Door */}
                    <div className="absolute inset-3 rounded-lg border-2 border-amber-600/40 p-2 flex flex-col justify-around">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="h-[20%] w-full rounded border border-amber-500/30 bg-[#2D1107]/60 shadow-inner flex items-center justify-center"
                        >
                          {/* Brass Rosette Stud */}
                          <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-amber-700 via-amber-300 to-amber-800 shadow border border-amber-200/50" />
                        </div>
                      ))}
                    </div>

                    {/* Left Half Brass Knocker/Latch on Left Door */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20">
                      <div className="w-5 h-8 rounded-l-full bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 shadow-md border-l border-amber-200" />
                    </div>
                  </motion.div>

                  {/* Right Door Leaf (Pivots inward along right edge) */}
                  <motion.div
                    className="relative w-1/2 h-full origin-right overflow-hidden select-none"
                    style={{
                      transformStyle: "preserve-3d",
                      background:
                        "linear-gradient(270deg, #1A0702 0%, #461C0E 25%, #6B2C16 85%, #341208 100%)",
                      borderLeft: "2px solid #1A0702",
                      boxShadow: "inset 0 0 30px rgba(0,0,0,0.85)",
                    }}
                    animate={{
                      rotateY: isOpen || still ? 112 : isOpening ? 108 : 0,
                      opacity: isOpen && !still ? 0.25 : 1,
                    }}
                    transition={{
                      duration: reducedMotion ? 0 : 2.4,
                      ease: [0.25, 1, 0.35, 1],
                    }}
                  >
                    {/* Carved Relief Panels on Right Door */}
                    <div className="absolute inset-3 rounded-lg border-2 border-amber-600/40 p-2 flex flex-col justify-around">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="h-[20%] w-full rounded border border-amber-500/30 bg-[#2D1107]/60 shadow-inner flex items-center justify-center"
                        >
                          {/* Brass Rosette Stud */}
                          <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-amber-700 via-amber-300 to-amber-800 shadow border border-amber-200/50" />
                        </div>
                      ))}
                    </div>

                    {/* Right Half Brass Knocker/Latch on Right Door */}
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 z-20">
                      <div className="w-5 h-8 rounded-r-full bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 shadow-md border-r border-amber-200" />
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* ── Layer 5: Brass Door Ornament & Interactive Latch (Closed State Target) ── */}
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
                      ? "அழைப்பிதழைத் திறக்க கதவைத் தொடவும்"
                      : "Tap carved doors to open invitation"
                  }
                >
                  <motion.div
                    className="flex flex-col items-center"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6 }}
                  >
                    {/* Glowing Ceremonial Brass Door Plate & Knocker */}
                    <motion.div
                      className="relative flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-tr from-amber-600 via-amber-300 to-amber-700 p-1 shadow-[0_0_50px_rgba(245,158,11,0.6)]"
                      animate={{
                        scale: [1, 1.05, 1],
                        boxShadow: [
                          "0 0 30px rgba(245,158,11,0.4)",
                          "0 0 60px rgba(245,158,11,0.7)",
                          "0 0 30px rgba(245,158,11,0.4)",
                        ],
                      }}
                      transition={{
                        duration: 2.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-[#3B170B] border-2 border-amber-300 text-amber-300">
                        <Icon name="sparkle" size={24} />
                      </div>
                    </motion.div>

                    {/* Touch Action Prompt Pill */}
                    <div className="mt-5 rounded-full border border-amber-400/40 bg-black/75 px-5 py-2 backdrop-blur-md shadow-2xl flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                      <span className="text-[13px] font-semibold tracking-wider text-amber-200">
                        {lang === "ta"
                          ? "அழைப்பிதழைத் திறக்க கதவைத் தொடவும்"
                          : "Tap to open invitation"}
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
