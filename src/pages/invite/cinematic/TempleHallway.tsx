import { useState, useId } from "react"
import { motion, AnimatePresence } from "motion/react"
import { CinematicFramework } from "./CinematicFramework"
import { InviteDetailsCard } from "./InviteDetailsCard"
import type { CinematicSceneProps } from "./types"

/**
 * The Grand Temple Prakaram (Aayiram Kaal Mandapam) 3D Invitation
 *
 * An immersive Dravidian temple corridor experience inspired by the magnificent
 * Thousand Pillar Halls of Madurai Meenakshi, Rameshwaram, and Thanjavur:
 * - 4 Receding tiers of sculpted monolithic granite Yali pillars in deep 3D perspective
 * - Suspended bronze temple bells swaying on heavy chains with resonant ripple waves
 * - Hanging cast-brass oil lamps (Agal Vilakku) with animated flickering flame glows
 * - Polished black granite floor with vanishing-point perspective and reflections
 * - Volumetric sunbeams streaming through high stone clerestory skylights
 * - A 7.2-second multi-stage cinematic corridor traverse with camera fly-through
 * - Glowing Makaratoranam golden sanctum archway, ceremonial brass Urli & petal rain
 * - Sacred gold-etched royal temple decree / copper edict card unfolding in 3D
 */
export function TempleHallway(props: CinematicSceneProps) {
  const { invite, lang, still, size, share, onReady, sample, art } = props
  const id = useId()

  return (
    <CinematicFramework
      invite={invite}
      lang={lang}
      title={lang === "ta" ? "கோவில் பிரகாரம் 3D" : "The Temple Corridor 3D"}
      subtitle={
        lang === "ta"
          ? "ஆயிரங்கால் மண்டபப் பிரகாரம்"
          : "Sacred Thousand Pillar Hallway"
      }
      accentColor="#F59E0B"
      still={still}
      size={size}
      share={share}
      onReady={onReady}
      sample={sample}
      revealDuration={7200}
      renderScene={({ state, onTriggerOpen, parallax, reducedMotion }) => {
        const isOpen = state === "opened"
        const isOpening = state === "opening"
        const isClosed = state === "closed"

        // 3D Camera Rig transforms across the multi-phase journey
        // During opening: camera sweeps forward 720px down the temple colonnade
        const cameraZ = isOpen ? 680 : isOpening ? 680 : 0
        const cameraY = isOpen ? -18 : isOpening ? -18 : 0
        const cameraPitch = isOpen ? 1 : isOpening ? 2 : 4
        const cameraRotX = cameraPitch + parallax.y * 3
        const cameraRotY = parallax.x * 3.5

        return (
          <div
            className="relative h-full w-full overflow-hidden flex items-center justify-center select-none"
            style={{
              background:
                "radial-gradient(circle at 50% 40%, #1c140e 0%, #0e0906 60%, #050302 100%)",
              perspective: 1200,
              WebkitPerspective: 1200,
              transformStyle: "preserve-3d",
              WebkitTransformStyle: "preserve-3d",
            }}
          >
            {/* Ambient Temple Murk & Vignette */}
            <div
              className="pointer-events-none absolute inset-0 z-0 opacity-80"
              style={{
                background:
                  "radial-gradient(circle at 50% 50%, transparent 40%, rgba(5,3,2,0.85) 100%)",
              }}
            />

            {/* Volumetric Sunbeams through High Temple Skylights */}
            <div
              className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-30 mix-blend-screen"
              aria-hidden="true"
            >
              <div
                className="absolute -top-20 left-1/4 h-[120%] w-48 origin-top -rotate-12"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(251,191,36,0.25) 0%, rgba(217,119,6,0.08) 50%, transparent 90%)",
                  filter: "blur(20px)",
                }}
              />
              <div
                className="absolute -top-20 right-1/4 h-[120%] w-56 origin-top rotate-12"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(251,191,36,0.22) 0%, rgba(217,119,6,0.06) 50%, transparent 90%)",
                  filter: "blur(24px)",
                }}
              />
            </div>

            {/* Floating Sambrani Dhoopam (Incense Smoke Haze) */}
            {!reducedMotion && !still && (
              <div
                className="pointer-events-none absolute inset-0 z-10 overflow-hidden opacity-40 mix-blend-screen"
                aria-hidden="true"
              >
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      width: 140 + i * 40,
                      height: 100 + i * 30,
                      left: `${15 + i * 14}%`,
                      bottom: "-10%",
                      background:
                        "radial-gradient(ellipse at center, rgba(254,243,199,0.12) 0%, rgba(217,119,6,0.04) 50%, transparent 80%)",
                      filter: "blur(28px)",
                    }}
                    animate={{
                      y: [-20, -500],
                      x: [0, (i % 2 === 0 ? 30 : -30)],
                      opacity: [0, 0.45, 0],
                      scale: [0.8, 1.4],
                    }}
                    transition={{
                      duration: 8 + i * 1.5,
                      repeat: Infinity,
                      delay: i * 1.8,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
            )}

            {/* ─── 3D CAMERA RIG (The Great Hallway Corridor) ─── */}
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
                duration: reducedMotion ? 0 : isOpening ? 7.2 : 0.9,
                ease: [0.25, 0.9, 0.3, 1],
              }}
            >
              {/* ─── 1. Polished Black Granite Hallway Floor with Vanishing Perspective ─── */}
              <div
                className="absolute pointer-events-none"
                style={{
                  width: 850,
                  height: 1400,
                  bottom: -320,
                  transform: "rotateX(75deg) translateZ(-160px)",
                  transformStyle: "preserve-3d",
                  background:
                    "linear-gradient(to top, #140d09 0%, #1e140d 30%, #0d0805 75%, #050302 100%)",
                  boxShadow: "0 -20px 80px rgba(0,0,0,0.9) inset",
                }}
              >
                {/* Stone Slab Floor Grid Joints */}
                <div
                  className="absolute inset-0 opacity-25"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, rgba(245,158,11,0.15) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(245,158,11,0.15) 1px, transparent 1px)
                    `,
                    backgroundSize: "70px 100px",
                  }}
                />
                {/* Central Hallway Ceremonial Brass Runner / Kolam strip */}
                <div
                  className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-48 opacity-25"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(245,158,11,0.18), transparent)",
                  }}
                />
                {/* Floor Diya Light Reflections */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(ellipse at 50% 60%, rgba(245,158,11,0.2) 0%, rgba(217,119,6,0.08) 40%, transparent 75%)",
                  }}
                />
              </div>

              {/* ─── 2. High Carved Stone Hallway Ceiling & Beams ─── */}
              <div
                className="absolute pointer-events-none"
                style={{
                  width: 750,
                  height: 1200,
                  top: -420,
                  transform: "rotateX(-75deg) translateZ(-180px)",
                  background:
                    "linear-gradient(to bottom, #110c08 0%, #1a120b 40%, #080503 100%)",
                }}
              >
                {/* Cross Stone Rafters */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      "linear-gradient(to bottom, rgba(251,191,36,0.2) 2px, transparent 2px)",
                    backgroundSize: "100% 80px",
                  }}
                />
              </div>

              {/* ─── 3. Receding Dravidian Temple Pillars (4 Progressive Tiers) ─── */}
              {/* Tier 4: Deep Sanctum Gate Pillars (z: -720px) */}
              <PillarPair
                z={-720}
                xOffset={120}
                scale={0.42}
                opacity={0.7}
                lampGlow={isOpen || isOpening}
                isOpening={isOpening}
                reducedMotion={reducedMotion}
                tier={4}
              />

              {/* Tier 3: Mid-Deep Corridor Pillars (z: -480px) */}
              <PillarPair
                z={-480}
                xOffset={148}
                scale={0.58}
                opacity={0.85}
                lampGlow={isOpen || isOpening}
                isOpening={isOpening}
                reducedMotion={reducedMotion}
                tier={3}
              />

              {/* Tier 2: Mid-Front Corridor Pillars (z: -240px) */}
              <PillarPair
                z={-240}
                xOffset={185}
                scale={0.78}
                opacity={0.95}
                lampGlow={true}
                isOpening={isOpening}
                reducedMotion={reducedMotion}
                tier={2}
              />

              {/* Tier 1: Majestic Foreground Entrance Pillars (z: 40px) */}
              {/* Sweeps outward laterally as the camera glides through! */}
              <PillarPair
                z={40}
                xOffset={230}
                scale={1.05}
                opacity={1}
                lampGlow={true}
                isOpening={isOpening}
                reducedMotion={reducedMotion}
                tier={1}
                partOnOpen={true}
              />

              {/* ─── 4. Suspended Temple Bells Along the Ceiling Corridor ─── */}
              {/* Large Central Entrance Bell (Rings on trigger!) */}
              <motion.div
                className="absolute z-20 pointer-events-none"
                style={{
                  top: "11%",
                  transform: "translateZ(80px)",
                }}
                animate={{
                  rotateZ: isOpening
                    ? [0, -18, 15, -12, 8, -4, 2, 0]
                    : [0, -3, 3, 0],
                  scale: isOpening ? [1, 1.15, 0.96, 1.05, 1] : 1,
                }}
                transition={{
                  duration: isOpening ? 2.4 : 4.5,
                  repeat: isOpening ? 0 : Infinity,
                  ease: "easeInOut",
                }}
              >
                <TempleBellSVG size={88} glowing={isOpening} />
                {/* Acoustic Soundwave Ripples on Bell Strike */}
                {isOpening && !reducedMotion && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-amber-400 pointer-events-none"
                    initial={{ scale: 0.5, opacity: 0.9 }}
                    animate={{ scale: 3.5, opacity: 0 }}
                    transition={{
                      duration: 1.8,
                      repeat: 2,
                      ease: "easeOut",
                    }}
                  />
                )}
              </motion.div>

              {/* Receding Hallway Bells (Middle & Deep) */}
              <motion.div
                className="absolute pointer-events-none opacity-80"
                style={{ top: "15%", transform: "translateZ(-260px) scale(0.65)" }}
                animate={{ rotateZ: [-4, 4, -4] }}
                transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
              >
                <TempleBellSVG size={64} />
              </motion.div>
              <motion.div
                className="absolute pointer-events-none opacity-60"
                style={{ top: "18%", transform: "translateZ(-520px) scale(0.42)" }}
                animate={{ rotateZ: [3, -3, 3] }}
                transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              >
                <TempleBellSVG size={54} />
              </motion.div>

              {/* Mango Leaf & Marigold Thoranam Across Entrance Lintels */}
              <div
                className="absolute top-2 w-[420px] pointer-events-none z-30"
                style={{ transform: "translateZ(100px)" }}
              >
                <ThoranamGarlandSVG />
              </div>

              {/* ─── 5. The Inner Sanctum (Garba Griha Portal at z: -800px) ─── */}
              <motion.div
                className="absolute flex flex-col items-center justify-center pointer-events-none"
                style={{
                  transform: "translateZ(-800px)",
                  transformStyle: "preserve-3d",
                }}
                animate={{
                  opacity: isOpen || isOpening ? 1 : 0.65,
                  scale: isOpen || isOpening ? 1.08 : 1,
                }}
                transition={{ duration: 4.5, ease: "easeOut" }}
              >
                {/* Divine Sanctum Back-Glow Aura */}
                <motion.div
                  className="absolute -inset-24 rounded-full pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(245,158,11,0.5) 0%, rgba(217,119,6,0.2) 45%, transparent 75%)",
                    filter: "blur(40px)",
                  }}
                  animate={{
                    scale: isOpen || isOpening ? [1, 1.25, 1.1] : [0.9, 1.05, 0.9],
                    opacity: isOpen || isOpening ? [0.6, 0.9, 0.75] : 0.4,
                  }}
                  transition={{
                    duration: 3.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                {/* Golden Makaratoranam Sanctum Arch */}
                <div
                  className="relative w-[360px] h-[480px] flex items-center justify-center"
                  style={{
                    filter: "drop-shadow(0 0 25px rgba(245,158,11,0.45))",
                  }}
                >
                  <MakaratoranamArchSVG />

                  {/* Sacred Brass Urli with Floating Lotuses at Sanctum Base */}
                  <div
                    className="absolute -bottom-16 z-10"
                    style={{ transform: "translateZ(30px) rotateX(25deg)" }}
                  >
                    <BrassUrliSVG />
                  </div>

                  {/* Flanking Monumental 7-Tiered Kuthuvilakku Lamps */}
                  <div
                    className="absolute -left-16 bottom-0"
                    style={{ transform: "translateZ(40px)" }}
                  >
                    <KuthuvilakkuGrandSVG lit={isOpen || isOpening} />
                  </div>
                  <div
                    className="absolute -right-16 bottom-0"
                    style={{ transform: "translateZ(40px) scaleX(-1)" }}
                  >
                    <KuthuvilakkuGrandSVG lit={isOpen || isOpening} />
                  </div>
                </div>
              </motion.div>

              {/* ─── 6. Cascading Rose & Marigold Petal Shower in Sanctum ─── */}
              {(isOpening || isOpen) && !reducedMotion && !still && (
                <div
                  className="pointer-events-none absolute inset-0 z-25 overflow-hidden"
                  aria-hidden="true"
                >
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute rounded-full"
                      style={{
                        width: 9 + (i % 5) * 2,
                        height: 7 + (i % 4) * 2,
                        left: `${15 + (i * 4.2) % 70}%`,
                        top: "-5%",
                        background:
                          i % 2 === 0
                            ? "linear-gradient(135deg, #F43F5E 0%, #BE123C 100%)"
                            : "linear-gradient(135deg, #FBBF24 0%, #D97706 100%)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                        transform: `translateZ(${100 - i * 15}px)`,
                      }}
                      initial={{ y: -50, opacity: 0, rotate: 0 }}
                      animate={{
                        y: 720,
                        opacity: [0, 0.95, 0.9, 0],
                        rotate: [0, 180 + i * 45],
                        x: [0, (i % 2 === 0 ? 35 : -35), (i % 3 === 0 ? -25 : 25)],
                      }}
                      transition={{
                        duration: 4.8 + (i % 4) * 0.7,
                        repeat: Infinity,
                        delay: 3.2 + (i * 0.22),
                        ease: "easeOut",
                      }}
                    />
                  ))}
                </div>
              )}

              {/* ─── 7. THE CEREMONIAL TEMPLE INVITATION CARD / ROYAL EDICT ─── */}
              {/* Positioned at the heart of the sanctum; unfolds in 3D during Transition 4 */}
              <motion.div
                className="relative z-30 flex items-center justify-center"
                style={{
                  transformStyle: "preserve-3d",
                  WebkitTransformStyle: "preserve-3d",
                }}
                animate={{
                  z: isOpen ? 690 : isOpening ? 690 : -200,
                  scale: isOpen ? 1 : isOpening ? 1 : 0.45,
                  rotateX: isOpen ? 0 : isOpening ? [25, 12, 0] : 32,
                  opacity: isOpen ? 1 : isOpening ? [0, 0.1, 0.8, 1] : 0,
                }}
                transition={{
                  duration: reducedMotion ? 0 : 7.2,
                  times: [0, 0.5, 0.75, 1],
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {/* Antique Copper / Bronze Inscription Frame with Gold Finials */}
                <div
                  className="relative rounded-3xl p-2.5 overflow-hidden"
                  style={{
                    background:
                      "linear-gradient(145deg, #3D2617 0%, #22150C 50%, #150D07 100%)",
                    border: "2px solid rgba(245,158,11,0.6)",
                    boxShadow:
                      "0 25px 70px rgba(0,0,0,0.85), 0 0 35px rgba(245,158,11,0.3) inset",
                  }}
                >
                  {/* Ornate Gold Filigree Corner Accents */}
                  <TempleCornerFlourish position="top-left" />
                  <TempleCornerFlourish position="top-right" />
                  <TempleCornerFlourish position="bottom-left" />
                  <TempleCornerFlourish position="bottom-right" />

                  {/* Traveling Specular Shimmer on Reveal */}
                  {isOpening && !reducedMotion && (
                    <motion.div
                      className="absolute inset-0 pointer-events-none z-40"
                      initial={{ x: "-100%" }}
                      animate={{ x: "200%" }}
                      transition={{ duration: 2.2, delay: 5.0, ease: "easeInOut" }}
                      style={{
                        background:
                          "linear-gradient(105deg, transparent 25%, rgba(254,243,199,0.35) 50%, transparent 75%)",
                      }}
                    />
                  )}

                  {/* Main Wedding Invitation Card Component */}
                  <div className="relative z-10 max-w-[340px] sm:max-w-[370px]">
                    <InviteDetailsCard
                      invite={invite}
                      lang={lang}
                      still={still}
                      art={art}
                      style={{
                        bg: "linear-gradient(180deg, #1C120B 0%, #130B06 100%)",
                        border: "1px solid rgba(245,158,11,0.4)",
                        text: "#FEF3C7",
                        muted: "#D97706",
                        accent: "#F59E0B",
                        fontFamily: "Cinzel, Cormorant Garamond, serif",
                        taFontFamily: "Noto Serif Tamil, Kavivanar, serif",
                        glowColor: "rgba(245,158,11,0.35)",
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* ─── 8. CLOSED STATE: SACRED BRASS TEMPLE BELL SEAL (TAP TO ENTER) ─── */}
            <AnimatePresence>
              {isClosed && (
                <motion.div
                  className="absolute z-40 flex flex-col items-center justify-center p-6 text-center cursor-pointer group"
                  onClick={onTriggerOpen}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85, y: -40 }}
                  transition={{ duration: 0.7 }}
                >
                  {/* Resonant Aura Back-Ring */}
                  <div className="relative flex items-center justify-center mb-6">
                    <motion.div
                      className="absolute -inset-8 rounded-full"
                      style={{
                        background:
                          "radial-gradient(circle, rgba(245,158,11,0.35) 0%, rgba(217,119,6,0.1) 60%, transparent 80%)",
                      }}
                      animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.85, 0.5] }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />

                    {/* Ornate Ceremonial Temple Bell Emblem */}
                    <motion.div
                      className="relative h-24 w-24 rounded-full flex items-center justify-center shadow-2xl"
                      style={{
                        background:
                          "radial-gradient(circle at 35% 30%, #FDE68A 0%, #D97706 60%, #78350F 100%)",
                        border: "3px solid #FDE68A",
                        boxShadow:
                          "0 15px 35px rgba(0,0,0,0.8), 0 0 25px rgba(245,158,11,0.6)",
                      }}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.94 }}
                    >
                      <TempleBellSVG size={52} glowing={true} />
                    </motion.div>
                  </div>

                  {/* Sacred Invitation Titles */}
                  <motion.div
                    className="flex flex-col items-center gap-1.5"
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <p className="text-xs uppercase tracking-[0.25em] text-amber-300/80 font-medium font-serif">
                      {lang === "ta"
                        ? "புனித மங்கள அழைப்பிதழ்"
                        : "Sacred Ceremonial Invitation"}
                    </p>
                    <h2
                      className="text-2xl sm:text-3xl font-serif font-bold text-amber-100 tracking-wide"
                      style={{
                        textShadow: "0 2px 14px rgba(245,158,11,0.5)",
                      }}
                    >
                      {invite[lang][0]} & {invite[lang][1]}
                    </h2>
                    <p className="mt-2 text-xs text-amber-200/90 tracking-wider flex items-center gap-2 bg-amber-950/60 border border-amber-600/40 rounded-full px-4 py-1.5 backdrop-blur-sm group-hover:border-amber-400/80 transition-colors">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      {lang === "ta"
                        ? "பிரகாரத்தினுள் நுழையத் தொடவும்"
                        : "Tap to Enter the Temple Corridor"}
                    </p>
                    <p className="text-[10px] text-amber-300/50 mt-1 italic tracking-widest font-mono">
                      {lang === "ta"
                        ? "ஆயிரங்கால் மண்டப முப்பரிமாணப் பயணம்"
                        : "An immersive 3D Temple Corridor Journey"}
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      }}
    />
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS: Sculpted Granite Pillars, Temple Bells, Makaratoranam & Urli
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Receding Dravidian Temple Pillar Pair with attached cast brass oil lamps
 */
function PillarPair({
  z,
  xOffset,
  scale,
  opacity,
  lampGlow,
  isOpening,
  reducedMotion,
  tier,
  partOnOpen = false,
}: {
  z: number
  xOffset: number
  scale: number
  opacity: number
  lampGlow: boolean
  isOpening: boolean
  reducedMotion: boolean
  tier: number
  partOnOpen?: boolean
}) {
  // During opening fly-through:
  // Foreground Tier 1 pillars sweep smoothly outward to let the camera through!
  const leftX = partOnOpen && isOpening && !reducedMotion ? -(xOffset + 240) : -xOffset
  const rightX = partOnOpen && isOpening && !reducedMotion ? (xOffset + 240) : xOffset
  const partOpacity = partOnOpen && isOpening && !reducedMotion ? 0 : opacity

  return (
    <div
      className="absolute pointer-events-none w-full flex justify-center items-center"
      style={{
        transform: `translateZ(${z}px) scale(${scale})`,
        transformStyle: "preserve-3d",
      }}
    >
      {/* Left Dravidian Granite Pillar */}
      <motion.div
        className="absolute"
        animate={{ x: leftX, opacity: partOpacity }}
        transition={{
          duration: isOpening ? 3.6 : 0.8,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <DravidianYaliPillarSVG lampGlow={lampGlow} />
      </motion.div>

      {/* Right Dravidian Granite Pillar */}
      <motion.div
        className="absolute"
        animate={{ x: rightX, opacity: partOpacity }}
        transition={{
          duration: isOpening ? 3.6 : 0.8,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <div style={{ transform: "scaleX(-1)" }}>
          <DravidianYaliPillarSVG lampGlow={lampGlow} />
        </div>
      </motion.div>
    </div>
  )
}

/**
 * Dravidian Monolithic Carved Granite Pillar with Yali corbel & burning oil lamp
 */
function DravidianYaliPillarSVG({ lampGlow }: { lampGlow: boolean }) {
  return (
    <div className="relative w-28 h-[540px] flex flex-col items-center">
      <svg
        viewBox="0 0 110 520"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_15px_30px_rgba(0,0,0,0.85)]"
      >
        <defs>
          <linearGradient id="graniteGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2A1D15" />
            <stop offset="35%" stopColor="#3E2B20" />
            <stop offset="70%" stopColor="#221711" />
            <stop offset="100%" stopColor="#150E0A" />
          </linearGradient>
          <linearGradient id="brassLampGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="60%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>
        </defs>

        {/* ─── Pillar Capital / Corbel Bracket with Mythical Yali Beast ─── */}
        <path
          d="M10 0 H100 L90 35 H75 C85 45 92 65 88 85 C82 95 65 92 60 80 L58 100 H35 L40 70 C30 75 22 65 24 50 L18 35 H10 Z"
          fill="url(#graniteGrad)"
          stroke="#52392A"
          strokeWidth="1.5"
        />
        {/* Sculpted Padma (Lotus) Crown Band */}
        <rect x="25" y="100" width="60" height="15" rx="3" fill="#3E2B20" stroke="#5A3E2D" />
        <circle cx="35" cy="107" r="3" fill="#D97706" opacity="0.8" />
        <circle cx="55" cy="107" r="3" fill="#D97706" opacity="0.8" />
        <circle cx="75" cy="107" r="3" fill="#D97706" opacity="0.8" />

        {/* ─── Octagonal Granite Pillar Shaft with Carved Relief ─── */}
        <rect x="30" y="115" width="50" height="310" fill="url(#graniteGrad)" stroke="#4A3426" />
        {/* Fluting & Stone Relief Lines */}
        <line x1="42" y1="115" x2="42" y2="425" stroke="#1C120B" strokeWidth="2" />
        <line x1="55" y1="115" x2="55" y2="425" stroke="#4D3526" strokeWidth="2.5" />
        <line x1="68" y1="115" x2="68" y2="425" stroke="#1C120B" strokeWidth="2" />

        {/* Mid-Pillar Carved Kalasam / Medallion Band */}
        <rect x="27" y="240" width="56" height="24" rx="2" fill="#36251B" stroke="#634531" />
        <polygon points="55,244 62,252 55,260 48,252" fill="#D97706" opacity="0.9" />

        {/* ─── Tiered Stepped Stone Plinth Base (Upapitham) ─── */}
        <rect x="25" y="425" width="60" height="20" rx="3" fill="#36251B" stroke="#4D3526" />
        <rect x="18" y="445" width="74" height="25" rx="4" fill="#2A1D15" stroke="#4D3526" />
        <rect x="10" y="470" width="90" height="30" rx="5" fill="#1E140E" stroke="#3E2B20" />

        {/* ─── Mounted Cast-Brass Agal Vilakku (Hanging Oil Lamp) ─── */}
        {/* Brass Arm */}
        <path
          d="M78 200 C105 200 110 215 105 235"
          stroke="url(#brassLampGrad)"
          strokeWidth="3.5"
          fill="none"
        />
        {/* Oil Bowl & Chain */}
        <line x1="105" y1="235" x2="105" y2="255" stroke="#D97706" strokeWidth="2" />
        <path d="M92 255 Q105 265 118 255 Z" fill="url(#brassLampGrad)" stroke="#FDE68A" strokeWidth="1" />
        {/* Flame Wick Base */}
        <circle cx="105" cy="253" r="2.5" fill="#B45309" />
      </svg>

      {/* Burning Oil Lamp Flame with Dynamic Radiant Glow */}
      <div className="absolute right-[-4px] top-[242px]">
        {lampGlow && (
          <motion.div
            className="relative flex items-center justify-center"
            animate={{ scale: [0.95, 1.15, 0.98, 1.1], opacity: [0.85, 1, 0.9, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Ambient Flame Glow Halo */}
            <div
              className="absolute -inset-4 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(251,191,36,0.55) 0%, rgba(217,119,6,0.2) 60%, transparent 80%)",
                filter: "blur(6px)",
              }}
            />
            {/* Inner White-Gold Teardrop Flame */}
            <div
              className="w-3 h-5 rounded-full"
              style={{
                background:
                  "linear-gradient(to top, #EA580C 0%, #F59E0B 50%, #FEF3C7 100%)",
                clipPath: "polygon(50% 0%, 100% 70%, 50% 100%, 0% 70%)",
                boxShadow: "0 0 12px #FBBF24",
              }}
            />
          </motion.div>
        )}
      </div>
    </div>
  )
}

/**
 * Carved Solid Brass Temple Bell (Kovil Mani) with clapper and hanging link chain
 */
function TempleBellSVG({ size = 70, glowing = false }: { size?: number; glowing?: boolean }) {
  return (
    <div
      className="relative flex flex-col items-center"
      style={{
        width: size,
        filter: glowing ? "drop-shadow(0 0 16px rgba(245,158,11,0.8))" : "drop-shadow(0 8px 16px rgba(0,0,0,0.7))",
      }}
    >
      <svg viewBox="0 0 80 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <defs>
          <linearGradient id="bellGoldGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="30%" stopColor="#F59E0B" />
            <stop offset="70%" stopColor="#B45309" />
            <stop offset="100%" stopColor="#451A03" />
          </linearGradient>
        </defs>

        {/* Chain Links */}
        <line x1="40" y1="0" x2="40" y2="30" stroke="#B45309" strokeWidth="4" strokeDasharray="3 3" />
        <circle cx="40" cy="30" r="5" stroke="#F59E0B" strokeWidth="2.5" fill="none" />

        {/* Bell Crown / Finial */}
        <path d="M34 35 H46 L44 45 H36 Z" fill="url(#bellGoldGrad)" />

        {/* Bell Dome Flare */}
        <path
          d="M36 45 C32 60 16 75 14 92 C14 100 66 100 66 92 C64 75 48 60 44 45 Z"
          fill="url(#bellGoldGrad)"
          stroke="#FEF3C7"
          strokeWidth="1.5"
        />

        {/* Bottom Lip Ring & Engravings */}
        <ellipse cx="40" cy="94" rx="26" ry="6" fill="#D97706" stroke="#FEF3C7" strokeWidth="1.5" />
        <ellipse cx="40" cy="94" rx="22" ry="4" fill="#78350F" />

        {/* Bell Clapper with Red Silk Tassel */}
        <line x1="40" y1="94" x2="40" y2="108" stroke="#F59E0B" strokeWidth="3" />
        <circle cx="40" cy="110" r="4.5" fill="#FEF3C7" stroke="#92400E" strokeWidth="1" />
        <path d="M38 114 L36 126 H44 L42 114 Z" fill="#DC2626" />
      </svg>
    </div>
  )
}

/**
 * Golden Makaratoranam Sanctum Archway (Sacred Portal)
 */
function MakaratoranamArchSVG() {
  return (
    <svg
      viewBox="0 0 380 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      <defs>
        <linearGradient id="toranamGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="40%" stopColor="#F59E0B" />
          <stop offset="80%" stopColor="#B45309" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
      </defs>

      {/* Main Arch Frame */}
      <path
        d="M60 480 V220 C60 110 320 110 320 220 V480"
        stroke="url(#toranamGold)"
        strokeWidth="18"
        strokeLinecap="round"
      />
      {/* Inner Decorative Arch Line */}
      <path
        d="M85 480 V230 C85 145 295 145 295 230 V480"
        stroke="#FEF3C7"
        strokeWidth="3"
        strokeDasharray="6 4"
        opacity="0.8"
      />

      {/* Central Kirtimukha (Face of Glory) Apex Crown */}
      <circle cx="190" cy="95" r="24" fill="url(#toranamGold)" stroke="#FEF3C7" strokeWidth="2" />
      <circle cx="190" cy="95" r="14" fill="#78350F" />
      <polygon points="190,75 196,88 184,88" fill="#FEF3C7" />
      {/* Kalasam Spire on Apex */}
      <path d="M185 71 L190 48 L195 71 Z" fill="url(#toranamGold)" stroke="#FEF3C7" strokeWidth="1.5" />

      {/* Left Mythical Makara Beast Flare */}
      <path
        d="M50 200 C30 185 20 160 30 135 C42 120 65 130 68 150 C70 170 55 190 50 200 Z"
        fill="url(#toranamGold)"
        stroke="#FEF3C7"
        strokeWidth="1.5"
      />
      {/* Right Mythical Makara Beast Flare */}
      <path
        d="M330 200 C350 185 360 160 350 135 C338 120 315 130 312 150 C310 170 325 190 330 200 Z"
        fill="url(#toranamGold)"
        stroke="#FEF3C7"
        strokeWidth="1.5"
      />
    </svg>
  )
}

/**
 * Sacred Brass Urli with Floating Lotuses & Flickering Agal Vilakku
 */
function BrassUrliSVG() {
  return (
    <div className="relative w-56 h-28 flex flex-col items-center justify-center">
      <svg viewBox="0 0 200 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <defs>
          <linearGradient id="urliGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="50%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>
        </defs>
        {/* Urli Deep Brass Bowl */}
        <ellipse cx="100" cy="45" rx="88" ry="30" fill="url(#urliGold)" stroke="#FEF3C7" strokeWidth="2.5" />
        {/* Water Surface Pool */}
        <ellipse cx="100" cy="45" rx="76" ry="22" fill="#1E293B" opacity="0.9" />

        {/* Floating Pink Lotus Blossom at Center */}
        <circle cx="100" cy="45" r="14" fill="#F43F5E" />
        <circle cx="95" cy="42" r="8" fill="#FB7185" />
        <circle cx="105" cy="42" r="8" fill="#FB7185" />
        <circle cx="100" cy="40" r="9" fill="#FDA4AF" />
        <circle cx="100" cy="45" r="4" fill="#FDE047" />

        {/* Scattered Marigold Petals */}
        <circle cx="65" cy="46" r="6" fill="#F59E0B" />
        <circle cx="75" cy="52" r="5" fill="#FBBF24" />
        <circle cx="128" cy="44" r="6" fill="#F59E0B" />
        <circle cx="138" cy="50" r="5" fill="#FBBF24" />

        {/* Floating Clay Diya (Agal Vilakku) */}
        <ellipse cx="100" cy="56" rx="8" ry="4" fill="#B45309" stroke="#FDE68A" strokeWidth="1" />
        <circle cx="100" cy="54" r="2.5" fill="#F59E0B" />
      </svg>
    </div>
  )
}

/**
 * Monumental 7-Tiered Brass Temple Kuthuvilakku Lamp with Mayil/Annam Crest
 */
function KuthuvilakkuGrandSVG({ lit = true }: { lit?: boolean }) {
  return (
    <div className="relative w-24 h-[420px] flex flex-col items-center">
      <svg viewBox="0 0 90 440" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <linearGradient id="kuthuGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="40%" stopColor="#F59E0B" />
            <stop offset="85%" stopColor="#92400E" />
            <stop offset="100%" stopColor="#451A03" />
          </linearGradient>
        </defs>

        {/* Annam / Peacock Crest at Apex */}
        <path d="M45 25 C40 15 35 12 38 5 C45 2 52 10 50 18 C55 12 60 8 64 12 C62 20 54 25 45 25 Z" fill="url(#kuthuGrad)" stroke="#FEF3C7" strokeWidth="1" />

        {/* Central Spindle Rod */}
        <rect x="42" y="25" width="6" height="370" fill="url(#kuthuGrad)" stroke="#FEF3C7" strokeWidth="0.8" />

        {/* Tier 1 Bowl (Top) */}
        <ellipse cx="45" cy="55" rx="16" ry="6" fill="url(#kuthuGrad)" stroke="#FEF3C7" strokeWidth="1.2" />
        {/* Tier 2 Bowl */}
        <ellipse cx="45" cy="105" rx="22" ry="7" fill="url(#kuthuGrad)" stroke="#FEF3C7" strokeWidth="1.2" />
        {/* Tier 3 Bowl */}
        <ellipse cx="45" cy="160" rx="27" ry="8" fill="url(#kuthuGrad)" stroke="#FEF3C7" strokeWidth="1.2" />
        {/* Tier 4 Bowl */}
        <ellipse cx="45" cy="220" rx="31" ry="9" fill="url(#kuthuGrad)" stroke="#FEF3C7" strokeWidth="1.2" />
        {/* Tier 5 Bowl */}
        <ellipse cx="45" cy="280" rx="35" ry="10" fill="url(#kuthuGrad)" stroke="#FEF3C7" strokeWidth="1.2" />
        {/* Tier 6 Bowl */}
        <ellipse cx="45" cy="340" rx="38" ry="11" fill="url(#kuthuGrad)" stroke="#FEF3C7" strokeWidth="1.2" />

        {/* Stepped Pedestal Base */}
        <rect x="30" y="390" width="30" height="15" rx="3" fill="url(#kuthuGrad)" />
        <ellipse cx="45" cy="420" rx="38" ry="14" fill="url(#kuthuGrad)" stroke="#FEF3C7" strokeWidth="1.5" />
      </svg>

      {/* Radiant Glowing Flame Tips along the 7 Tiers */}
      {lit && (
        <div className="absolute inset-0 pointer-events-none">
          {[50, 100, 155, 215, 275, 335].map((y, i) => (
            <motion.div
              key={i}
              className="absolute left-1/2 -translate-x-1/2 rounded-full"
              style={{
                top: y,
                width: 6,
                height: 9,
                background:
                  "linear-gradient(to top, #EA580C 0%, #F59E0B 60%, #FEF3C7 100%)",
                boxShadow: "0 0 10px #FBBF24",
              }}
              animate={{
                scale: [0.85, 1.2, 0.9],
                opacity: [0.8, 1, 0.85],
              }}
              transition={{
                duration: 1.2 + i * 0.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Hanging Mango Leaf (Mavilai) and Marigold Thoranam
 */
function ThoranamGarlandSVG() {
  return (
    <svg viewBox="0 0 420 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
      {/* Hanging Cord */}
      <path d="M0 8 Q210 28 420 8" stroke="#B45309" strokeWidth="2.5" fill="none" />
      {/* Fresh Green Mango Leaves (Mavilai) */}
      {[35, 75, 120, 165, 210, 255, 300, 345, 385].map((x, i) => (
        <g key={i}>
          <path
            d={`M${x} 15 C${x - 8} 30 ${x - 5} 42 ${x} 48 C${x + 5} 42 ${x + 8} 30 ${x} 15 Z`}
            fill="#15803D"
            stroke="#166534"
            strokeWidth="1"
          />
          <circle cx={x} cy={16} r="4" fill="#F59E0B" />
        </g>
      ))}
    </svg>
  )
}

/**
 * Antique Gold Temple Corner Flourish
 */
function TempleCornerFlourish({
  position,
}: {
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right"
}) {
  const isTop = position.includes("top")
  const isLeft = position.includes("left")

  return (
    <div
      className={`absolute ${isTop ? "top-2" : "bottom-2"} ${
        isLeft ? "left-2" : "right-2"
      } w-8 h-8 pointer-events-none opacity-80`}
      style={{
        transform: `${!isLeft ? "scaleX(-1)" : ""} ${!isTop ? "scaleY(-1)" : ""}`,
      }}
    >
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M4 36 V12 C4 7.5 7.5 4 12 4 H36"
          stroke="#F59E0B"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="8" cy="8" r="3" fill="#FDE68A" />
        <path d="M12 12 Q20 14 20 20 Q14 20 12 12 Z" fill="#D97706" />
      </svg>
    </div>
  )
}
