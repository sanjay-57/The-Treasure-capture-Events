import { useState, useId } from "react"
import { motion, AnimatePresence } from "motion/react"
import { CinematicFramework } from "./CinematicFramework"
import { InviteDetailsCard } from "./InviteDetailsCard"
import type { CinematicSceneProps } from "./types"

/**
 * The Sacred Temple Prakaram & Raja Gopuram 3D Invitation
 *
 * An authentic Dravidian temple architecture experience celebrating
 * the iconic sacred features of Madurai Meenakshi, Rameshwaram, and Thanjavur:
 *
 * 1. RAJA GOPURAM & KALASAMS: Multi-tiered Dravidian gateway tower crowned with 7 golden Kalasams.
 * 2. CARVED TEAK TEMPLE DOORS (Kovil Kadhavu): Heavy timber doors with brass studs, iron crossbars & Lion ring knocker.
 * 3. 3D DOOR REVEAL: Knocker strike with acoustic shockwave, swinging open in 3D perspective to reveal the corridor.
 * 4. AAYIRAM KAAL MANDAPAM (Thousand Pillar Hall): 4 tiers of sculpted monolithic granite Yali pillars.
 * 5. DEEPA VARISAI (Rows of Burning Oil Diyas): Stepped rows of flickering Agal Vilakku along the polished stone floor.
 * 6. SACRED PADAKOLAM: Traditional white rice-flour temple kolam running down the central stone aisle.
 * 7. SWAYING TEMPLE BELLS & DHOOPAM: Bronze bells swaying on heavy chains with wafting sambrani incense haze.
 * 8. GARBA GRIHA (Inner Sanctum): Radiant Makaratoranam golden arch, twin 7-tiered Kuthuvilakku lamps & brass Urli.
 * 9. PETAL SHOWER & TAMRA PATRA: Cascading rose & marigold petals as the consecrated copper edict unfolds in 3D.
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
          ? "ஆயிரங்கால் மண்டபம் & ராஜகோபுரம்"
          : "Sacred Dravidian Temple Prakaram"
      }
      accentColor="#F59E0B"
      still={still}
      size={size}
      share={share}
      onReady={onReady}
      sample={sample}
      revealDuration={7400}
      renderScene={({ state, onTriggerOpen, parallax, reducedMotion }) => {
        const isOpen = state === "opened"
        const isOpening = state === "opening"
        const isClosed = state === "closed"

        // 3D Camera Rig transforms across the multi-phase journey:
        // Closed: Framed at the Raja Gopuram gateway before the massive carved doors.
        // Opening / Opened: Glides 740px forward through the open doors and down the colonnade!
        const cameraZ = isOpen ? 740 : isOpening ? 740 : 0
        const cameraY = isOpen ? -20 : isOpening ? -20 : 0
        const cameraPitch = isOpen ? 1 : isOpening ? 2 : 4
        const cameraRotX = cameraPitch + parallax.y * 3
        const cameraRotY = parallax.x * 3.5

        return (
          <div
            className="relative h-full w-full overflow-hidden flex items-center justify-center select-none"
            style={{
              background:
                "radial-gradient(circle at 50% 35%, #1f140e 0%, #110905 55%, #050302 100%)",
              perspective: 1200,
              WebkitPerspective: 1200,
              transformStyle: "preserve-3d",
              WebkitTransformStyle: "preserve-3d",
            }}
          >
            {/* Ambient Temple Murk & Dark Granite Vignette */}
            <div
              className="pointer-events-none absolute inset-0 z-0 opacity-80"
              style={{
                background:
                  "radial-gradient(circle at 50% 50%, transparent 40%, rgba(5,3,2,0.9) 100%)",
              }}
            />

            {/* Volumetric Sunbeams Streaming Through Clerestory Stone Skylights */}
            <div
              className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-35 mix-blend-screen"
              aria-hidden="true"
            >
              <div
                className="absolute -top-24 left-1/4 h-[130%] w-52 origin-top -rotate-15"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(251,191,36,0.3) 0%, rgba(217,119,6,0.1) 45%, transparent 85%)",
                  filter: "blur(22px)",
                }}
              />
              <div
                className="absolute -top-24 right-1/4 h-[130%] w-60 origin-top rotate-15"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(251,191,36,0.25) 0%, rgba(217,119,6,0.08) 45%, transparent 85%)",
                  filter: "blur(26px)",
                }}
              />
            </div>

            {/* Floating Sambrani Dhoopam (Sacred Incense Smoke Haze) */}
            {!reducedMotion && !still && (
              <div
                className="pointer-events-none absolute inset-0 z-10 overflow-hidden opacity-45 mix-blend-screen"
                aria-hidden="true"
              >
                {[...Array(7)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      width: 150 + i * 40,
                      height: 100 + i * 30,
                      left: `${12 + i * 13}%`,
                      bottom: "-10%",
                      background:
                        "radial-gradient(ellipse at center, rgba(254,243,199,0.14) 0%, rgba(217,119,6,0.04) 50%, transparent 80%)",
                      filter: "blur(30px)",
                    }}
                    animate={{
                      y: [-20, -560],
                      x: [0, i % 2 === 0 ? 35 : -35],
                      opacity: [0, 0.5, 0],
                      scale: [0.8, 1.45],
                    }}
                    transition={{
                      duration: 8.5 + i * 1.5,
                      repeat: Infinity,
                      delay: i * 1.6,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
            )}

            {/* ─── 3D CAMERA RIG (The Grand Temple Hallway Journey) ─── */}
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
                duration: reducedMotion ? 0 : isOpening ? 7.4 : 0.9,
                ease: [0.25, 0.9, 0.3, 1],
              }}
            >
              {/* ─── 1. Polished Black Granite Hallway Floor with Vanishing Perspective ─── */}
              <div
                className="absolute pointer-events-none"
                style={{
                  width: 920,
                  height: 1500,
                  bottom: -350,
                  transform: "rotateX(75deg) translateZ(-160px)",
                  transformStyle: "preserve-3d",
                  background:
                    "linear-gradient(to top, #140d09 0%, #1f140d 30%, #0d0805 75%, #050302 100%)",
                  boxShadow: "0 -20px 90px rgba(0,0,0,0.95) inset",
                }}
              >
                {/* Stone Slab Grid Joints */}
                <div
                  className="absolute inset-0 opacity-25"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, rgba(245,158,11,0.18) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(245,158,11,0.18) 1px, transparent 1px)
                    `,
                    backgroundSize: "75px 105px",
                  }}
                />

                {/* Central Sacred Rice-Flour Padakolam Aisle */}
                <div
                  className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-44 flex flex-col items-center justify-around opacity-30"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(254,243,199,0.12), transparent)",
                  }}
                >
                  <SacredPadakolamStripSVG />
                </div>

                {/* Floor Reflections of Burning Deepa Flames */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(ellipse at 50% 60%, rgba(245,158,11,0.22) 0%, rgba(217,119,6,0.08) 45%, transparent 75%)",
                  }}
                />
              </div>

              {/* ─── 2. High Carved Stone Hallway Ceiling & Beams ─── */}
              <div
                className="absolute pointer-events-none"
                style={{
                  width: 820,
                  height: 1300,
                  top: -460,
                  transform: "rotateX(-75deg) translateZ(-190px)",
                  background:
                    "linear-gradient(to bottom, #110c08 0%, #1a120b 40%, #080503 100%)",
                }}
              >
                {/* Cross Stone Rafters */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      "linear-gradient(to bottom, rgba(251,191,36,0.22) 2px, transparent 2px)",
                    backgroundSize: "100% 85px",
                  }}
                />
              </div>

              {/* ─── 3. Receding Dravidian Temple Pillars (4 Tiers) ─── */}
              {/* Tier 4: Deep Sanctum Gate Pillars (z: -720px) */}
              <PillarPair
                z={-720}
                xOffset={120}
                scale={0.42}
                opacity={0.7}
                lampGlow={isOpen || isOpening}
                isOpening={isOpening}
                reducedMotion={reducedMotion}
              />

              {/* Tier 3: Mid-Deep Corridor Pillars (z: -480px) */}
              <PillarPair
                z={-480}
                xOffset={150}
                scale={0.58}
                opacity={0.85}
                lampGlow={isOpen || isOpening}
                isOpening={isOpening}
                reducedMotion={reducedMotion}
              />

              {/* Tier 2: Mid-Front Corridor Pillars (z: -240px) */}
              <PillarPair
                z={-240}
                xOffset={190}
                scale={0.78}
                opacity={0.95}
                lampGlow={true}
                isOpening={isOpening}
                reducedMotion={reducedMotion}
              />

              {/* Tier 1: Majestic Foreground Entrance Pillars (z: 40px) */}
              <PillarPair
                z={40}
                xOffset={236}
                scale={1.05}
                opacity={1}
                lampGlow={true}
                isOpening={isOpening}
                reducedMotion={reducedMotion}
                partOnOpen={true}
              />

              {/* ─── 4. DEEPA VARISAI (Rows of Burning Oil Lamps on Floor) ─── */}
              <DeepaVarisaiRows
                isOpening={isOpening}
                isOpen={isOpen}
                reducedMotion={reducedMotion}
              />

              {/* ─── 5. Suspended Temple Bells Along the Ceiling Corridor ─── */}
              {/* Large Central Entrance Bell (Rings on trigger!) */}
              <motion.div
                className="absolute z-20 pointer-events-none"
                style={{
                  top: "10%",
                  transform: "translateZ(90px)",
                }}
                animate={{
                  rotateZ: isOpening
                    ? [0, -20, 16, -14, 9, -5, 2, 0]
                    : [0, -3, 3, 0],
                  scale: isOpening ? [1, 1.18, 0.95, 1.06, 1] : 1,
                }}
                transition={{
                  duration: isOpening ? 2.5 : 4.5,
                  repeat: isOpening ? 0 : Infinity,
                  ease: "easeInOut",
                }}
              >
                <TempleBellSVG size={92} glowing={isOpening} />
                {/* Acoustic Soundwave Ripples on Bell Strike */}
                {isOpening && !reducedMotion && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-amber-400 pointer-events-none"
                    initial={{ scale: 0.5, opacity: 0.95 }}
                    animate={{ scale: 3.8, opacity: 0 }}
                    transition={{
                      duration: 1.9,
                      repeat: 2,
                      ease: "easeOut",
                    }}
                  />
                )}
              </motion.div>

              {/* Receding Hallway Bells */}
              <motion.div
                className="absolute pointer-events-none opacity-80"
                style={{ top: "14%", transform: "translateZ(-260px) scale(0.65)" }}
                animate={{ rotateZ: [-4, 4, -4] }}
                transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
              >
                <TempleBellSVG size={64} />
              </motion.div>
              <motion.div
                className="absolute pointer-events-none opacity-60"
                style={{ top: "17%", transform: "translateZ(-520px) scale(0.42)" }}
                animate={{ rotateZ: [3, -3, 3] }}
                transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              >
                <TempleBellSVG size={54} />
              </motion.div>

              {/* Mango Leaf & Marigold Thoranam Across Entrance Lintels */}
              <div
                className="absolute top-2 w-[440px] pointer-events-none z-30"
                style={{ transform: "translateZ(110px)" }}
              >
                <ThoranamGarlandSVG />
              </div>

              {/* ─── 6. MONUMENTAL CARVED TEAK TEMPLE DOORS (KOVIL KADHAVU) ─── */}
              {/* Positioned at z: 70px. Closed at first, swings open in 3D perspective! */}
              <div
                className="absolute flex items-center justify-center pointer-events-none z-35"
                style={{
                  width: 370,
                  height: 480,
                  transform: "translateZ(70px)",
                  transformStyle: "preserve-3d",
                }}
              >
                {/* Left Carved Temple Door */}
                <motion.div
                  className="absolute left-0 top-0 w-[185px] h-full origin-left overflow-hidden shadow-2xl"
                  style={{
                    transformStyle: "preserve-3d",
                    borderRight: "1px solid rgba(245,158,11,0.4)",
                  }}
                  animate={{
                    rotateY: isOpen || isOpening ? -82 : 0,
                    opacity: isOpen ? 0.05 : isOpening ? [1, 1, 0.4, 0.08] : 1,
                  }}
                  transition={{
                    duration: reducedMotion ? 0 : 3.4,
                    delay: isOpening ? 1.0 : 0,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <TempleDoorLeafSVG side="left" />
                </motion.div>

                {/* Right Carved Temple Door */}
                <motion.div
                  className="absolute right-0 top-0 w-[185px] h-full origin-right overflow-hidden shadow-2xl"
                  style={{
                    transformStyle: "preserve-3d",
                    borderLeft: "1px solid rgba(245,158,11,0.4)",
                  }}
                  animate={{
                    rotateY: isOpen || isOpening ? 82 : 0,
                    opacity: isOpen ? 0.05 : isOpening ? [1, 1, 0.4, 0.08] : 1,
                  }}
                  transition={{
                    duration: reducedMotion ? 0 : 3.4,
                    delay: isOpening ? 1.0 : 0,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <TempleDoorLeafSVG side="right" />
                </motion.div>
              </div>

              {/* ─── 7. THE INNER SANCTUM (Garba Griha Portal at z: -800px) ─── */}
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
                  className="absolute -inset-28 rounded-full pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(245,158,11,0.55) 0%, rgba(217,119,6,0.22) 45%, transparent 75%)",
                    filter: "blur(44px)",
                  }}
                  animate={{
                    scale: isOpen || isOpening ? [1, 1.25, 1.1] : [0.9, 1.05, 0.9],
                    opacity: isOpen || isOpening ? [0.65, 0.95, 0.75] : 0.4,
                  }}
                  transition={{
                    duration: 3.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                {/* Golden Makaratoranam Sanctum Arch */}
                <div
                  className="relative w-[370px] h-[490px] flex items-center justify-center"
                  style={{
                    filter: "drop-shadow(0 0 28px rgba(245,158,11,0.5))",
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

              {/* ─── 8. Cascading Rose & Marigold Petal Shower in Sanctum ─── */}
              {(isOpening || isOpen) && !reducedMotion && !still && (
                <div
                  className="pointer-events-none absolute inset-0 z-25 overflow-hidden"
                  aria-hidden="true"
                >
                  {[...Array(24)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute rounded-full"
                      style={{
                        width: 9 + (i % 5) * 2,
                        height: 7 + (i % 4) * 2,
                        left: `${12 + (i * 3.8) % 76}%`,
                        top: "-5%",
                        background:
                          i % 2 === 0
                            ? "linear-gradient(135deg, #F43F5E 0%, #BE123C 100%)"
                            : "linear-gradient(135deg, #FBBF24 0%, #D97706 100%)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                        transform: `translateZ(${110 - i * 14}px)`,
                      }}
                      initial={{ y: -50, opacity: 0, rotate: 0 }}
                      animate={{
                        y: 740,
                        opacity: [0, 0.95, 0.9, 0],
                        rotate: [0, 180 + i * 45],
                        x: [0, i % 2 === 0 ? 35 : -35, i % 3 === 0 ? -25 : 25],
                      }}
                      transition={{
                        duration: 4.8 + (i % 4) * 0.7,
                        repeat: Infinity,
                        delay: 3.2 + i * 0.2,
                        ease: "easeOut",
                      }}
                    />
                  ))}
                </div>
              )}

              {/* ─── 9. THE CONSECRATED TEMPLE INVITATION CARD (TAMRA PATRA) ─── */}
              {/* Unfolds in 3D perspective from the sanctum altar during Transition 4 */}
              <motion.div
                className="relative z-30 flex items-center justify-center"
                style={{
                  transformStyle: "preserve-3d",
                  WebkitTransformStyle: "preserve-3d",
                }}
                animate={{
                  z: isOpen ? 725 : isOpening ? 725 : -220,
                  scale: isOpen ? 1 : isOpening ? 1 : 0.42,
                  rotateX: isOpen ? 0 : isOpening ? [28, 14, 0] : 34,
                  opacity: isOpen ? 1 : isOpening ? [0, 0.1, 0.85, 1] : 0,
                }}
                transition={{
                  duration: reducedMotion ? 0 : 7.4,
                  times: [0, 0.5, 0.78, 1],
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {/* Antique Copper / Bronze Inscription Frame with Gold Finials */}
                <div
                  className="relative rounded-3xl p-2.5 overflow-hidden"
                  style={{
                    background:
                      "linear-gradient(145deg, #3D2617 0%, #22150C 50%, #150D07 100%)",
                    border: "2px solid rgba(245,158,11,0.65)",
                    boxShadow:
                      "0 25px 75px rgba(0,0,0,0.85), 0 0 35px rgba(245,158,11,0.3) inset",
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
                      transition={{ duration: 2.2, delay: 5.2, ease: "easeInOut" }}
                      style={{
                        background:
                          "linear-gradient(105deg, transparent 25%, rgba(254,243,199,0.38) 50%, transparent 75%)",
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
                        border: "1px solid rgba(245,158,11,0.45)",
                        text: "#FEF3C7",
                        muted: "#D97706",
                        accent: "#F59E0B",
                        fontFamily: "Cinzel, Cormorant Garamond, serif",
                        taFontFamily: "Noto Serif Tamil, Kavivanar, serif",
                        glowColor: "rgba(245,158,11,0.38)",
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* ─── 10. CLOSED STATE: RAJA GOPURAM PORTAL & LION RING KNOCKER ─── */}
            <AnimatePresence>
              {isClosed && (
                <motion.div
                  className="absolute z-40 flex flex-col items-center justify-center p-6 text-center cursor-pointer group"
                  onClick={onTriggerOpen}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85, y: -40 }}
                  transition={{ duration: 0.7 }}
                >
                  {/* Raja Gopuram Silhouette & 7 Golden Kalasams Overhead */}
                  <div className="mb-4 pointer-events-none flex flex-col items-center opacity-85">
                    <RajaGopuramCrestSVG />
                  </div>

                  {/* Sacred Lion-Head Brass Ring Knocker (Singha Mukha) */}
                  <div className="relative flex items-center justify-center mb-5">
                    <motion.div
                      className="absolute -inset-10 rounded-full"
                      style={{
                        background:
                          "radial-gradient(circle, rgba(245,158,11,0.4) 0%, rgba(217,119,6,0.12) 60%, transparent 80%)",
                      }}
                      animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.85, 0.5] }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />

                    {/* Sculpted Brass Knocker Medallion */}
                    <motion.div
                      className="relative h-24 w-24 rounded-full flex items-center justify-center shadow-2xl"
                      style={{
                        background:
                          "radial-gradient(circle at 35% 30%, #FDE68A 0%, #D97706 60%, #78350F 100%)",
                        border: "3px solid #FDE68A",
                        boxShadow:
                          "0 15px 35px rgba(0,0,0,0.85), 0 0 25px rgba(245,158,11,0.6)",
                      }}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.94 }}
                    >
                      <LionHeadKnockerSVG />
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
                        ? "புனித மங்கள கோவில் அழைப்பிதழ்"
                        : "Sacred Ceremonial Temple Invitation"}
                    </p>
                    <h2
                      className="text-2xl sm:text-3xl font-serif font-bold text-amber-100 tracking-wide"
                      style={{
                        textShadow: "0 2px 14px rgba(245,158,11,0.55)",
                      }}
                    >
                      {invite[lang][0]} & {invite[lang][1]}
                    </h2>
                    <p className="mt-2 text-xs text-amber-200/90 tracking-wider flex items-center gap-2 bg-amber-950/70 border border-amber-600/40 rounded-full px-4 py-1.5 backdrop-blur-sm group-hover:border-amber-400/80 transition-colors">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      {lang === "ta"
                        ? "கோவில் கதவைத் திறந்து நுழையத் தொடவும்"
                        : "Tap Lion Knocker to Open Temple Doors"}
                    </p>
                    <p className="text-[10px] text-amber-300/50 mt-1 italic tracking-widest font-mono">
                      {lang === "ta"
                        ? "ஆயிரங்கால் மண்டப முப்பரிமாணப் பிரகாரப் பயணம்"
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
// SUB-COMPONENTS: Sculpted Temple Features & SVG Assets
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Raja Gopuram Crest with 7 Sacred Golden Kalasams
 */
function RajaGopuramCrestSVG() {
  return (
    <div className="relative w-72 h-20 flex flex-col items-center">
      <svg viewBox="0 0 280 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <linearGradient id="gopuramGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="45%" stopColor="#F59E0B" />
            <stop offset="85%" stopColor="#B45309" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>
        </defs>

        {/* 7 Golden Kalasam Spires */}
        {[30, 65, 100, 140, 180, 215, 250].map((x, i) => {
          const isCenter = i === 3
          const isMid = i === 2 || i === 4
          const h = isCenter ? 38 : isMid ? 32 : 26
          const y = isCenter ? 6 : isMid ? 12 : 18
          return (
            <g key={i}>
              {/* Spire Needle */}
              <line x1={x} y1={y} x2={x} y2={y + 12} stroke="#FEF3C7" strokeWidth="2.5" />
              {/* Kalasam Pot Body */}
              <circle cx={x} cy={y + 18} r={isCenter ? 8 : 6.5} fill="url(#gopuramGold)" stroke="#FEF3C7" strokeWidth="1" />
              {/* Stepped Base */}
              <rect x={x - 8} y={y + 25} width={16} height={6} rx="1.5" fill="#B45309" />
            </g>
          )
        })}

        {/* Upper Gopuram Shikhara Roofline */}
        <path
          d="M10 50 Q140 38 270 50 L260 70 H20 Z"
          fill="#2A1D15"
          stroke="url(#gopuramGold)"
          strokeWidth="2"
        />
        {/* Tiered Decorative Cornice */}
        <line x1="20" y1="62" x2="260" y2="62" stroke="#F59E0B" strokeWidth="2" strokeDasharray="5 3" />
      </svg>
    </div>
  )
}

/**
 * Carved Teak Temple Door Leaf (Single Side) with Brass Studs & Relief
 */
function TempleDoorLeafSVG({ side }: { side: "left" | "right" }) {
  const isLeft = side === "left"

  return (
    <div className="relative w-full h-full">
      <svg viewBox="0 0 185 480" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <linearGradient id="doorTeakGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#25160E" />
            <stop offset="40%" stopColor="#3B2417" />
            <stop offset="80%" stopColor="#22140D" />
            <stop offset="100%" stopColor="#150B07" />
          </linearGradient>
          <linearGradient id="doorBrassStud" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="50%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>
        </defs>

        {/* Main Solid Teak Timber Leaf */}
        <rect width="185" height="480" fill="url(#doorTeakGrad)" />

        {/* Heavy Iron/Brass Reinforcement Crossbars */}
        {[40, 150, 260, 370, 460].map((y, i) => (
          <g key={i}>
            <rect x="0" y={y} width="185" height="18" fill="#1C110A" stroke="#5A3A25" strokeWidth="1" />
            {/* Brass Elephant-Spike Studs (Anai Kal) along Crossbar */}
            {[25, 65, 105, 145].map((x, j) => (
              <g key={j}>
                <circle cx={x} cy={y + 9} r="6" fill="url(#doorBrassStud)" stroke="#FEF3C7" strokeWidth="0.8" />
                <circle cx={x} cy={y + 9} r="2.5" fill="#451A03" />
              </g>
            ))}
          </g>
        ))}

        {/* Carved Lotus Rosette Panels between Crossbars */}
        {[70, 180, 290, 400].map((y, i) => (
          <g key={i}>
            <rect x="15" y={y} width="155" height="70" rx="3" fill="#2E1B11" stroke="#4A2F1E" strokeWidth="1.5" />
            {/* Center Floral Rosette */}
            <circle cx="92" cy={y + 35} r="18" stroke="#D97706" strokeWidth="1.5" fill="#3B2316" />
            <circle cx="92" cy={y + 35} r="6" fill="#F59E0B" />
          </g>
        ))}

        {/* Vertical Border Trim */}
        <rect x={isLeft ? 175 : 0} y="0" width="10" height="480" fill="#4A2E1C" stroke="#D97706" strokeWidth="0.8" />
      </svg>
    </div>
  )
}

/**
 * Lion-Head Brass Ring Knocker (Singha Mukha Door Knocker)
 */
function LionHeadKnockerSVG() {
  return (
    <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14">
      {/* Heavy Brass Ring */}
      <circle cx="30" cy="40" r="14" stroke="#451A03" strokeWidth="5" fill="none" />
      <circle cx="30" cy="40" r="14" stroke="#FDE68A" strokeWidth="2.5" fill="none" />

      {/* Lion Head (Singha Mukha) Crest */}
      <path
        d="M20 18 C15 10 25 6 30 10 C35 6 45 10 40 18 C46 22 44 32 30 35 C16 32 14 22 20 18 Z"
        fill="#78350F"
        stroke="#FDE68A"
        strokeWidth="1.5"
      />
      {/* Eyes & Mane */}
      <circle cx="25" cy="20" r="2.5" fill="#FEF3C7" />
      <circle cx="35" cy="20" r="2.5" fill="#FEF3C7" />
      <circle cx="30" cy="27" r="3" fill="#D97706" />
    </svg>
  )
}

/**
 * Sacred Padakolam Runner Strip along the Hallway Floor
 */
function SacredPadakolamStripSVG() {
  return (
    <svg viewBox="0 0 160 800" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Repeating Geometric Sacred Lotus Kolam Motifs */}
      {[50, 180, 310, 440, 570, 700].map((y, i) => (
        <g key={i}>
          {/* Central 8-Petal Star Kolam */}
          <circle cx="80" cy={y} r="32" stroke="#FEF3C7" strokeWidth="1.8" strokeDasharray="3 3" />
          <polygon points={`80,${y - 24} 98,${y} 80,${y + 24} 62,${y}`} stroke="#FEF3C7" strokeWidth="2" fill="none" />
          <polygon points={`80,${y - 18} 94,${y} 80,${y + 18} 66,${y}`} stroke="#F59E0B" strokeWidth="1.5" fill="none" />
          <circle cx="80" cy={y} r="5" fill="#FEF3C7" />

          {/* Border Linking Vines */}
          <line x1="80" y1={y + 35} x2="80" y2={y + 95} stroke="#FEF3C7" strokeWidth="1.5" strokeDasharray="4 4" />
        </g>
      ))}
    </svg>
  )
}

/**
 * Stepped Deepa Varisai (Rows of Burning Oil Lamps on Floor)
 */
function DeepaVarisaiRows({
  isOpening,
  isOpen,
  reducedMotion,
}: {
  isOpening: boolean
  isOpen: boolean
  reducedMotion: boolean
}) {
  const lit = isOpening || isOpen

  return (
    <div
      className="absolute pointer-events-none w-full flex justify-between px-16 sm:px-24"
      style={{
        bottom: "8%",
        transform: "translateZ(-120px)",
      }}
    >
      {/* Left Deepa Row */}
      <div className="flex gap-4 items-center">
        {[...Array(5)].map((_, i) => (
          <AgalDiyaFlame key={i} lit={lit} delay={i * 0.15} />
        ))}
      </div>

      {/* Right Deepa Row */}
      <div className="flex gap-4 items-center">
        {[...Array(5)].map((_, i) => (
          <AgalDiyaFlame key={i} lit={lit} delay={i * 0.15 + 0.1} />
        ))}
      </div>
    </div>
  )
}

/**
 * Traditional Clay/Brass Agal Vilakku with Animated Flame & Halo
 */
function AgalDiyaFlame({ lit, delay }: { lit: boolean; delay: number }) {
  return (
    <div className="relative flex flex-col items-center">
      {/* Flame */}
      {lit && (
        <motion.div
          className="relative flex items-center justify-center -mb-1"
          animate={{
            scale: [0.9, 1.2, 0.95, 1.15, 0.9],
            opacity: [0.85, 1, 0.9, 1, 0.85],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay,
            ease: "easeInOut",
          }}
        >
          {/* Flame Ambient Halo */}
          <div
            className="absolute -inset-2 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(251,191,36,0.55) 0%, rgba(217,119,6,0.18) 60%, transparent 80%)",
              filter: "blur(5px)",
            }}
          />
          {/* Teardrop Flame */}
          <div
            className="w-2.5 h-4 rounded-full"
            style={{
              background:
                "linear-gradient(to top, #EA580C 0%, #F59E0B 50%, #FEF3C7 100%)",
              clipPath: "polygon(50% 0%, 100% 70%, 50% 100%, 0% 70%)",
              boxShadow: "0 0 10px #FBBF24",
            }}
          />
        </motion.div>
      )}

      {/* Terracotta / Brass Bowl */}
      <svg viewBox="0 0 32 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-3">
        <ellipse cx="16" cy="7" rx="14" ry="5" fill="#78350F" stroke="#FDE68A" strokeWidth="1" />
        <ellipse cx="16" cy="6" rx="10" ry="3" fill="#451A03" />
      </svg>
    </div>
  )
}

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
  partOnOpen = false,
}: {
  z: number
  xOffset: number
  scale: number
  opacity: number
  lampGlow: boolean
  isOpening: boolean
  reducedMotion: boolean
  partOnOpen?: boolean
}) {
  const leftX = partOnOpen && isOpening && !reducedMotion ? -(xOffset + 260) : -xOffset
  const rightX = partOnOpen && isOpening && !reducedMotion ? xOffset + 260 : xOffset
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
          duration: isOpening ? 3.8 : 0.8,
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
          duration: isOpening ? 3.8 : 0.8,
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
        filter: glowing
          ? "drop-shadow(0 0 16px rgba(245,158,11,0.8))"
          : "drop-shadow(0 8px 16px rgba(0,0,0,0.7))",
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
    <svg viewBox="0 0 440 52" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
      {/* Hanging Cord */}
      <path d="M0 8 Q220 28 440 8" stroke="#B45309" strokeWidth="2.5" fill="none" />
      {/* Fresh Green Mango Leaves (Mavilai) */}
      {[35, 80, 125, 170, 220, 270, 315, 360, 405].map((x, i) => (
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
