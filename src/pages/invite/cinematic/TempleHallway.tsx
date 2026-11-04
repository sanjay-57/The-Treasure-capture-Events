import { useState, useId, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { CinematicFramework } from "./CinematicFramework"
import { InviteDetailsCard } from "./InviteDetailsCard"
import type { CinematicSceneProps } from "./types"

/**
 * The Sacred Temple Prakaram — "Through the Temple Doors"
 *
 * A meticulously crafted South Indian temple-inspired 3D invitation experience:
 *
 * - BLUE HOUR ARRIVAL: A tapering Dravidian entrance tower (Gopuram) with weathered
 *   stone cornices, niches, and brass finials catching dusk light.
 * - MONUMENTAL TIMBER DOORS: Heavy teak double doors with carved panels, brass studs,
 *   jamb hinges, and a brass ring knocker with warm lamplight spilling through the center slit.
 * - 3D THRESHOLD REVEAL: Knocker lifts & strikes once; doors open with deliberate weight
 *   (pivot on hinge lines, slight stagger, visible thickness).
 * - GRANITE MANDAPAM CORRIDOR: 4 stationary pillar bays with stepped bases, faceted shafts,
 *   and Yali corbels. The camera glides forward through the colonnade via true 3D perspective.
 * - DEEPA & KOLAM: Dark grey granite floor with fine slab joints, restrained warm reflections,
 *   subtle rice-flour Kolam at the threshold, and glowing Agal Vilakku along the aisle.
 * - CEREMONIAL DESTINATION PAVILION: A floral pavilion flanked by two 5-tiered brass Kuthuvilakku
 *   lamps, a brass Urli with floating blossoms, and suspended temple bells.
 * - HEIRLOOM FOLIO REVEAL: Ivory and antique copper folio opens on a visible hinge within an
 *   embossed brass frame to reveal crystal-clear bilingual typography and RSVP actions.
 */
export function TempleHallway(props: CinematicSceneProps) {
  const { invite, lang, still, size, share, onReady, sample, art } = props
  const id = useId()

  return (
    <CinematicFramework
      invite={invite}
      lang={lang}
      title={lang === "ta" ? "கோவில் பிரகாரம் 3D" : "Through the Temple Doors"}
      subtitle={
        lang === "ta"
          ? "ஆயிரங்கால் மண்டபம் & ராஜகோபுரம்"
          : "Sacred Temple Mandapam & Gateway"
      }
      accentColor="#D97706"
      still={still}
      size={size}
      share={share}
      onReady={onReady}
      sample={sample}
      revealDuration={8800}
      renderScene={({ state, onTriggerOpen, parallax, reducedMotion }) => {
        const isOpen = state === "opened"
        const isOpening = state === "opening"
        const isClosed = state === "closed"

        // Master 3D camera travel along the center axis (X: 0)
        // Closed / Phase 1: Framed at the gateway (Z: 0)
        // Opening / Phase 3-5: Glides smoothly forward down the colonnade (Z: 820px)
        // Note: Pillars remain completely stationary at their world coordinates.
        const cameraZ = isOpen ? 820 : isOpening ? 820 : 0
        const cameraY = isOpen ? -14 : isOpening ? -14 : 0
        const cameraPitch = isOpen ? 0.5 : isOpening ? 1.2 : 2.5
        // Subtle pointer parallax active ONLY when closed; zeroed during motion and reading
        const cameraRotX = isClosed ? cameraPitch + parallax.y * 1.5 : cameraPitch
        const cameraRotY = isClosed ? parallax.x * 2 : 0

        return (
          <div
            className="relative h-full w-full overflow-hidden flex items-center justify-center select-none"
            style={{
              background:
                "radial-gradient(circle at 50% 30%, #171d26 0%, #0d1219 55%, #05080c 100%)",
              perspective: 1200,
              WebkitPerspective: 1200,
              transformStyle: "preserve-3d",
              WebkitTransformStyle: "preserve-3d",
            }}
          >
            {/* Ambient Blue Hour Dusk & Stone Vignette */}
            <div
              className="pointer-events-none absolute inset-0 z-0 opacity-75"
              style={{
                background:
                  "radial-gradient(circle at 50% 50%, transparent 45%, rgba(5,8,12,0.85) 100%)",
              }}
            />

            {/* Restrained Directional Twilight Light Shafts */}
            <div
              className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-25 mix-blend-screen"
              aria-hidden="true"
            >
              <div
                className="absolute -top-24 left-1/4 h-[125%] w-44 origin-top -rotate-12"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(147,197,253,0.25) 0%, rgba(217,119,6,0.06) 45%, transparent 85%)",
                  filter: "blur(20px)",
                }}
              />
              <div
                className="absolute -top-24 right-1/4 h-[125%] w-48 origin-top rotate-12"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(147,197,253,0.2) 0%, rgba(217,119,6,0.05) 45%, transparent 85%)",
                  filter: "blur(24px)",
                }}
              />
            </div>

            {/* ─── 3D CAMERA RIG (Single Coherent World Coordinate System) ─── */}
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
                duration: reducedMotion ? 0 : isOpening ? 8.8 : 0.8,
                ease: [0.22, 0.95, 0.32, 1],
              }}
            >
              {/* ─── 1. Dark Grey Granite Hallway Floor (Flat at Y: 220px) ─── */}
              <div
                className="absolute pointer-events-none"
                style={{
                  width: 880,
                  height: 1500,
                  bottom: -340,
                  transform: "rotateX(75deg) translateZ(-160px)",
                  transformStyle: "preserve-3d",
                  background:
                    "linear-gradient(to top, #13171c 0%, #1c222b 30%, #0e1217 75%, #07090d 100%)",
                  boxShadow: "0 -20px 80px rgba(0,0,0,0.95) inset",
                }}
              >
                {/* Fine Granite Slab Joints */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, rgba(203,213,225,0.12) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(203,213,225,0.12) 1px, transparent 1px)
                    `,
                    backgroundSize: "80px 110px",
                  }}
                />

                {/* Subtle Rice-Flour Kolam at Entrance Threshold */}
                <div
                  className="absolute bottom-16 left-1/2 -translate-x-1/2 opacity-35 pointer-events-none"
                  style={{ width: 180, height: 180 }}
                >
                  <RiceFlourKolamSVG instanceId={id} />
                </div>

                {/* Subtle Rice-Flour Kolam at Destination Pavilion */}
                <div
                  className="absolute top-24 left-1/2 -translate-x-1/2 opacity-30 pointer-events-none"
                  style={{ width: 220, height: 220 }}
                >
                  <RiceFlourKolamSVG instanceId={`${id}-dest`} />
                </div>

                {/* Restrained Warm Lamp Floor Reflections (Not Mirror-Like) */}
                <div
                  className="absolute inset-0 opacity-60"
                  style={{
                    background:
                      "radial-gradient(ellipse at 50% 60%, rgba(217,119,6,0.16) 0%, rgba(180,83,9,0.06) 45%, transparent 75%)",
                  }}
                />
              </div>

              {/* ─── 2. High Carved Stone Hallway Ceiling & Beams (Y: -220px) ─── */}
              <div
                className="absolute pointer-events-none"
                style={{
                  width: 780,
                  height: 1300,
                  top: -440,
                  transform: "rotateX(-75deg) translateZ(-180px)",
                  background:
                    "linear-gradient(to bottom, #11151a 0%, #181e26 40%, #080a0e 100%)",
                }}
              >
                {/* Transverse Stone Ceiling Rafters */}
                <div
                  className="absolute inset-0 opacity-15"
                  style={{
                    backgroundImage:
                      "linear-gradient(to bottom, rgba(203,213,225,0.18) 2px, transparent 2px)",
                    backgroundSize: "100% 90px",
                  }}
                />
              </div>

              {/* ─── 3. STATIONARY GRANITE PILLAR BAYS (4 Bays, Stationary in World Space) ─── */}
              {/* As the camera glides forward, perspective handles natural occlusion & passing */}
              {/* Bay 4: Pavilion Flanking Pillars (Z: -920px) */}
              <StationaryPillarBay
                z={-920}
                x={210}
                instanceId={`${id}-b4`}
                lampLit={isOpen || isOpening}
                still={still}
                reducedMotion={reducedMotion}
              />

              {/* Bay 3: Mid-Deep Corridor Pillars (Z: -640px) */}
              <StationaryPillarBay
                z={-640}
                x={210}
                instanceId={`${id}-b3`}
                lampLit={isOpen || isOpening}
                still={still}
                reducedMotion={reducedMotion}
              />

              {/* Bay 2: Mid-Front Corridor Pillars (Z: -380px) */}
              <StationaryPillarBay
                z={-380}
                x={210}
                instanceId={`${id}-b2`}
                lampLit={true}
                still={still}
                reducedMotion={reducedMotion}
              />

              {/* Bay 1: Entrance Colonnade Pillars (Z: -120px) */}
              <StationaryPillarBay
                z={-120}
                x={210}
                instanceId={`${id}-b1`}
                lampLit={true}
                still={still}
                reducedMotion={reducedMotion}
              />

              {/* ─── 4. Suspended Temple Bells Along Ceiling Rafters ─── */}
              {/* Entrance Bell (Subtle damped swing during motion) */}
              <motion.div
                className="absolute z-20 pointer-events-none"
                style={{
                  top: "11%",
                  transform: "translateZ(30px)",
                }}
                animate={
                  isOpening && !reducedMotion && !still
                    ? {
                        rotateZ: [0, -12, 10, -7, 4, -2, 0],
                        transition: { duration: 3.5, delay: 1.4, ease: "easeOut" },
                      }
                    : { rotateZ: 0 }
                }
              >
                <TempleBellSVG instanceId={`${id}-bell1`} size={80} />
              </motion.div>

              {/* Mid-Corridor Bell (Z: -480px) */}
              <div
                className="absolute pointer-events-none opacity-80"
                style={{ top: "14%", transform: "translateZ(-480px)" }}
              >
                <TempleBellSVG instanceId={`${id}-bell2`} size={65} />
              </div>

              {/* Mango Leaf & Marigold Thoranam across Entrance Stone Lintel */}
              <div
                className="absolute top-4 w-[430px] pointer-events-none z-30"
                style={{ transform: "translateZ(60px)" }}
              >
                <MangoMarigoldThoranamSVG instanceId={id} />
              </div>

              {/* ─── 5. THE TIMBER TEMPLE DOORS (Pivot on Hinge Line at Z: 40px) ─── */}
              {/* Left and Right leaves open outward/inward with deliberate weight */}
              {/* They remain attached to their hinges; camera travel naturally passes them */}
              <div
                className="absolute flex items-center justify-center pointer-events-none z-25"
                style={{
                  width: 360,
                  height: 470,
                  transform: "translateZ(40px)",
                  transformStyle: "preserve-3d",
                }}
              >
                {/* Stone Portal Gateway Frame (Deep Jambs & Lintel) */}
                <StonePortalFrameSVG instanceId={id} />

                {/* Left Door Leaf (Hinged on Left edge) */}
                <motion.div
                  className="absolute left-[15px] top-[18px] w-[164px] h-[434px] origin-left shadow-2xl"
                  style={{
                    transformStyle: "preserve-3d",
                    transformOrigin: "left center",
                  }}
                  animate={{
                    rotateY: isOpen || isOpening ? -88 : 0,
                  }}
                  transition={{
                    duration: reducedMotion ? 0 : 2.4,
                    delay: isOpening ? 1.4 : 0,
                    ease: [0.25, 1, 0.35, 1],
                  }}
                >
                  <TimberDoorLeafSVG instanceId={`${id}-dl`} side="left" />
                </motion.div>

                {/* Right Door Leaf (Hinged on Right edge, slight stagger of 0.12s) */}
                <motion.div
                  className="absolute right-[15px] top-[18px] w-[164px] h-[434px] origin-right shadow-2xl"
                  style={{
                    transformStyle: "preserve-3d",
                    transformOrigin: "right center",
                  }}
                  animate={{
                    rotateY: isOpen || isOpening ? 88 : 0,
                  }}
                  transition={{
                    duration: reducedMotion ? 0 : 2.4,
                    delay: isOpening ? 1.52 : 0,
                    ease: [0.25, 1, 0.35, 1],
                  }}
                >
                  <TimberDoorLeafSVG instanceId={`${id}-dr`} side="right" />
                </motion.div>

                {/* Warm Lamplight Escaping through Center Gap when Closed */}
                {isClosed && (
                  <div
                    className="absolute top-[20px] bottom-[20px] left-1/2 -translate-x-1/2 w-[3px] pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(to bottom, transparent 5%, #F59E0B 30%, #FBBF24 50%, #F59E0B 70%, transparent 95%)",
                      boxShadow: "0 0 16px rgba(245,158,11,0.65)",
                    }}
                  />
                )}
              </div>

              {/* ─── 6. THE CEREMONIAL DESTINATION PAVILION (Z: -1080px) ─── */}
              <div
                className="absolute flex flex-col items-center justify-center pointer-events-none"
                style={{
                  transform: "translateZ(-1080px)",
                  transformStyle: "preserve-3d",
                }}
              >
                {/* Warm Ambient Pavilion Lighting Pool */}
                <div
                  className="absolute -inset-24 rounded-full pointer-events-none opacity-50"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(217,119,6,0.4) 0%, rgba(180,83,9,0.15) 50%, transparent 75%)",
                    filter: "blur(36px)",
                  }}
                />

                {/* Floral Ceremonial Arch with Antique Brass Frame */}
                <div
                  className="relative w-[360px] h-[480px] flex items-center justify-center"
                  style={{
                    filter: "drop-shadow(0 15px 30px rgba(0,0,0,0.85))",
                  }}
                >
                  <CeremonialPavilionFrameSVG instanceId={id} />

                  {/* Brass Urli with Floating Jasmine & Marigolds at Base */}
                  <div
                    className="absolute -bottom-14 z-10"
                    style={{ transform: "translateZ(25px) rotateX(20deg)" }}
                  >
                    <CeremonialBrassUrliSVG instanceId={id} />
                  </div>

                  {/* Twin 5-Tiered Sculptural Brass Kuthuvilakku Lamps */}
                  <div
                    className="absolute -left-16 bottom-2"
                    style={{ transform: "translateZ(35px)" }}
                  >
                    <FiveTierKuthuvilakkuSVG
                      instanceId={`${id}-kl`}
                      lit={isOpen || isOpening}
                      still={still}
                      reducedMotion={reducedMotion}
                    />
                  </div>
                  <div
                    className="absolute -right-16 bottom-2"
                    style={{ transform: "translateZ(35px) scaleX(-1)" }}
                  >
                    <FiveTierKuthuvilakkuSVG
                      instanceId={`${id}-kr`}
                      lit={isOpen || isOpening}
                      still={still}
                      reducedMotion={reducedMotion}
                    />
                  </div>
                </div>
              </div>

              {/* ─── 7. THE HEIRLOOM INVITATION FOLIO (Copper & Ivory, Z: -1060px) ─── */}
              {/* The folio cover opens gracefully on its hinge during Phase 4 (6.3s - 8.4s) */}
              <motion.div
                className="relative z-30 flex items-center justify-center"
                style={{
                  transform: "translateZ(-1060px)",
                  transformStyle: "preserve-3d",
                  WebkitTransformStyle: "preserve-3d",
                }}
                animate={{
                  scale: isOpen ? 1 : isOpening ? 1 : 0.75,
                  opacity: isOpen ? 1 : isOpening ? [0, 0.4, 1] : 0.6,
                }}
                transition={{
                  duration: reducedMotion ? 0 : 8.8,
                  ease: "easeOut",
                }}
              >
                {/* Antique Copper Backing Plate with Embossed Brass Border */}
                <div
                  className="relative rounded-2xl p-2.5 overflow-hidden"
                  style={{
                    background:
                      "linear-gradient(145deg, #2D1A12 0%, #1D100A 55%, #120A06 100%)",
                    border: "2px solid rgba(197,160,89,0.55)",
                    boxShadow:
                      "0 25px 65px rgba(0,0,0,0.85), 0 0 25px rgba(180,83,9,0.25) inset",
                  }}
                >
                  {/* Subtle Brass Border Specular Highlight during Phase 4 */}
                  {isOpening && !reducedMotion && !still && (
                    <motion.div
                      className="absolute inset-0 pointer-events-none z-35"
                      initial={{ x: "-100%" }}
                      animate={{ x: "200%" }}
                      transition={{ duration: 1.8, delay: 6.8, ease: "easeInOut" }}
                      style={{
                        background:
                          "linear-gradient(105deg, transparent 30%, rgba(254,243,199,0.3) 50%, transparent 70%)",
                      }}
                    />
                  )}

                  {/* Corner Brass Filigree Accents */}
                  <FolioCornerOrnament position="top-left" instanceId={id} />
                  <FolioCornerOrnament position="top-right" instanceId={id} />
                  <FolioCornerOrnament position="bottom-left" instanceId={id} />
                  <FolioCornerOrnament position="bottom-right" instanceId={id} />

                  {/* Core Invitation Card in Stable Accessible HTML */}
                  <div className="relative z-10 max-w-[340px] sm:max-w-[370px]">
                    <InviteDetailsCard
                      invite={invite}
                      lang={lang}
                      still={still}
                      art={art}
                      style={{
                        bg: "#FAF7F0",
                        border: "1px solid rgba(197,160,89,0.4)",
                        text: "#1C1917",
                        muted: "#78716C",
                        accent: "#B45309",
                        fontFamily: "Cinzel, Cormorant Garamond, serif",
                        taFontFamily: "Noto Serif Tamil, Kavivanar, serif",
                        glowColor: "rgba(197,160,89,0.25)",
                      }}
                    />
                  </div>

                  {/* Ceremonial Folio Hinged Cover (Opens during Phase 4) */}
                  <motion.div
                    className="absolute inset-0 origin-left z-20 pointer-events-none rounded-2xl flex items-center justify-center"
                    style={{
                      transformOrigin: "left center",
                      transformStyle: "preserve-3d",
                      background:
                        "linear-gradient(135deg, #FAF7F0 0%, #F3EDE0 60%, #E8DFC8 100%)",
                      border: "2px solid rgba(197,160,89,0.6)",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                    }}
                    animate={{
                      rotateY: isOpen || isOpening ? -130 : 0,
                      opacity: isOpen ? 0 : isOpening ? [1, 1, 0.3, 0] : 1,
                    }}
                    transition={{
                      duration: reducedMotion ? 0 : 2.2,
                      delay: isOpening ? 6.4 : 0,
                      ease: [0.25, 1, 0.35, 1],
                    }}
                  >
                    {/* Embossed Copper Medallion Clasp on Cover */}
                    <div className="relative flex flex-col items-center justify-center p-6 text-center">
                      <div
                        className="w-20 h-20 rounded-full flex items-center justify-center shadow-md mb-3"
                        style={{
                          background:
                            "radial-gradient(circle at 35% 30%, #FDE68A 0%, #D97706 65%, #78350F 100%)",
                          border: "2px solid #FDE68A",
                        }}
                      >
                        <RiceFlourKolamSVG instanceId={`${id}-seal`} size={44} />
                      </div>
                      <p className="text-[11px] uppercase tracking-[0.2em] font-serif text-[#78350F] font-semibold">
                        {lang === "ta" ? "மங்கள அழைப்பிதழ்" : "Ceremonial Invitation"}
                      </p>
                      <p className="text-sm font-serif text-[#451A03] mt-1 font-bold">
                        {invite[lang][0]} & {invite[lang][1]}
                      </p>
                    </div>
                  </motion.div>
                </div>
              </motion.div>

              {/* ─── 8. Restrained Single Petal Release near Destination (Phase 4) ─── */}
              {isOpening && !reducedMotion && !still && (
                <div
                  className="pointer-events-none absolute inset-0 z-35 overflow-hidden"
                  aria-hidden="true"
                >
                  {[...Array(10)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute rounded-full"
                      style={{
                        width: 8 + (i % 3) * 2,
                        height: 6 + (i % 2) * 2,
                        left: `${20 + i * 6}%`,
                        top: "20%",
                        background:
                          i % 2 === 0
                            ? "linear-gradient(135deg, #F43F5E 0%, #BE123C 100%)"
                            : "linear-gradient(135deg, #FBBF24 0%, #D97706 100%)",
                        transform: "translateZ(-1020px)",
                      }}
                      initial={{ y: -30, opacity: 0 }}
                      animate={{
                        y: 380,
                        opacity: [0, 0.9, 0.85, 0],
                        rotate: [0, 120 + i * 30],
                        x: [0, (i % 2 === 0 ? 25 : -25)],
                      }}
                      transition={{
                        duration: 3.2,
                        delay: 6.8 + i * 0.12,
                        ease: "easeOut",
                      }}
                    />
                  ))}
                </div>
              )}
            </motion.div>

            {/* ─── 9. PHASE 1 (ARRIVAL / CLOSED): ACCESSIBLE OPEN INVITATION BUTTON ─── */}
            <AnimatePresence>
              {isClosed && (
                <motion.div
                  className="absolute z-40 flex flex-col items-center justify-center p-6 text-center max-w-sm sm:max-w-md"
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.88, y: -30 }}
                  transition={{ duration: 0.6 }}
                >
                  {/* Dravidian Entrance Tower Crest Silhouette (Gopuram) */}
                  <div className="mb-3 pointer-events-none opacity-90">
                    <DravidianGopuramSilhouetteSVG instanceId={id} />
                  </div>

                  {/* Brass Ring Knocker (Interactive Semantic Button) */}
                  <div className="relative mb-5">
                    {/* Concentric Warm Pulsing Glow */}
                    <div
                      className="absolute -inset-6 rounded-full pointer-events-none opacity-60"
                      style={{
                        background:
                          "radial-gradient(circle, rgba(217,119,6,0.4) 0%, rgba(180,83,9,0.12) 65%, transparent 80%)",
                      }}
                    />

                    {/* Semantic Accessible Button Trigger */}
                    <button
                      type="button"
                      onClick={onTriggerOpen}
                      aria-label={
                        lang === "ta"
                          ? "கோவில் கதவைத் திறந்து அழைப்பிதழைப் பார்க்கவும்"
                          : "Open temple invitation"
                      }
                      className="relative h-20 w-20 rounded-full flex items-center justify-center shadow-xl cursor-pointer transition-transform hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-3 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                      style={{
                        background:
                          "radial-gradient(circle at 35% 30%, #FDE68A 0%, #D97706 60%, #78350F 100%)",
                        border: "2px solid #FEF3C7",
                        boxShadow:
                          "0 12px 28px rgba(0,0,0,0.85), 0 0 20px rgba(217,119,6,0.5)",
                      }}
                    >
                      <BrassRingKnockerSVG instanceId={id} />
                    </button>
                  </div>

                  {/* Couple Names & Open Prompt */}
                  <div className="flex flex-col items-center gap-1.5">
                    <p className="text-[11px] uppercase tracking-[0.25em] text-amber-200/80 font-serif font-medium">
                      {lang === "ta"
                        ? "மங்கள அழைப்பிதழ்"
                        : "Wedding Invitation"}
                    </p>
                    <h2
                      className="text-2xl sm:text-3xl font-serif font-bold text-amber-50 tracking-wide"
                      style={{
                        textShadow: "0 2px 14px rgba(217,119,6,0.6)",
                      }}
                    >
                      {invite[lang][0]} & {invite[lang][1]}
                    </h2>

                    <button
                      type="button"
                      onClick={onTriggerOpen}
                      className="mt-3 px-5 py-2 rounded-full text-xs font-serif tracking-wider text-amber-100 flex items-center gap-2 cursor-pointer transition-all bg-amber-950/80 border border-amber-500/50 hover:border-amber-300 hover:bg-amber-900/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      {lang === "ta"
                        ? "அழைப்பிதழைத் திறக்கவும்"
                        : "Open Invitation"}
                    </button>

                    <p className="text-[10px] text-amber-200/50 mt-1 italic font-mono tracking-wider">
                      {lang === "ta"
                        ? "கோவில் பிரகார முப்பரிமாணப் பயணம்"
                        : "Through the Temple Doors · 3D Experience"}
                    </p>
                  </div>
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
// ARCHITECTURAL COMPONENTS & SCOPED SVG HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Stationary Dravidian Pillar Bay with Faceted Shaft, Yali Corbel & Agal Vilakku
 * (Remains stationary at world Z coordinate)
 */
function StationaryPillarBay({
  z,
  x,
  instanceId,
  lampLit,
  still,
  reducedMotion,
}: {
  z: number
  x: number
  instanceId: string
  lampLit: boolean
  still?: boolean
  reducedMotion?: boolean
}) {
  return (
    <div
      className="absolute pointer-events-none w-full flex justify-center items-center"
      style={{
        transform: `translateZ(${z}px)`,
        transformStyle: "preserve-3d",
      }}
    >
      {/* Left Pillar */}
      <div
        className="absolute"
        style={{
          transform: `translateX(${-x}px)`,
        }}
      >
        <GranitePillarSVG
          instanceId={`${instanceId}-l`}
          lampLit={lampLit}
          still={still}
          reducedMotion={reducedMotion}
        />
      </div>

      {/* Right Pillar (Mirrored along X axis) */}
      <div
        className="absolute"
        style={{
          transform: `translateX(${x}px) scaleX(-1)`,
        }}
      >
        <GranitePillarSVG
          instanceId={`${instanceId}-r`}
          lampLit={lampLit}
          still={still}
          reducedMotion={reducedMotion}
        />
      </div>
    </div>
  )
}

/**
 * Dravidian Monolithic Carved Granite Pillar with Yali Bracket & Mounted Lamp
 */
function GranitePillarSVG({
  instanceId,
  lampLit,
  still,
  reducedMotion,
}: {
  instanceId: string
  lampLit: boolean
  still?: boolean
  reducedMotion?: boolean
}) {
  const graniteGrad = `${instanceId}-granite`
  const brassGrad = `${instanceId}-brass`

  return (
    <div className="relative w-28 h-[520px] flex flex-col items-center">
      <svg
        viewBox="0 0 110 520"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_15px_30px_rgba(0,0,0,0.85)]"
      >
        <defs>
          <linearGradient id={graniteGrad} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#222831" />
            <stop offset="35%" stopColor="#333c48" />
            <stop offset="70%" stopColor="#1e242d" />
            <stop offset="100%" stopColor="#14181f" />
          </linearGradient>
          <linearGradient id={brassGrad} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="55%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>
        </defs>

        {/* Sculpted Yali Corbel Bracket (Bodhai) supporting ceiling beam */}
        <path
          d="M10 0 H100 L90 32 H76 C86 44 92 64 88 82 C82 94 65 92 60 78 L58 98 H35 L40 68 C30 74 22 64 24 48 L18 32 H10 Z"
          fill={`url(#${graniteGrad})`}
          stroke="#475569"
          strokeWidth="1.2"
        />

        {/* Carved Lotus Capital Band (Padma Bandham) */}
        <rect x="25" y="98" width="60" height="14" rx="2" fill="#2d3540" stroke="#4b5563" strokeWidth="1" />
        <circle cx="36" cy="105" r="2.5" fill="#D97706" opacity="0.8" />
        <circle cx="55" cy="105" r="2.5" fill="#D97706" opacity="0.8" />
        <circle cx="74" cy="105" r="2.5" fill="#D97706" opacity="0.8" />

        {/* Faceted Octagonal Shaft with Fluting & Floral Medallion */}
        <rect x="30" y="112" width="50" height="315" fill={`url(#${graniteGrad})`} stroke="#3f4854" />
        <line x1="42" y1="112" x2="42" y2="427" stroke="#14181f" strokeWidth="2" />
        <line x1="55" y1="112" x2="55" y2="427" stroke="#475569" strokeWidth="2.5" />
        <line x1="68" y1="112" x2="68" y2="427" stroke="#14181f" strokeWidth="2" />

        {/* Mid-Shaft Floral Medallion Relief */}
        <rect x="27" y="240" width="56" height="22" rx="2" fill="#252c36" stroke="#4f5b6b" />
        <polygon points="55,243 62,251 55,259 48,251" fill="#D97706" opacity="0.85" />

        {/* Stepped Stone Plinth Base (Upapitham) */}
        <rect x="25" y="427" width="60" height="20" rx="2" fill="#2d3540" stroke="#475569" />
        <rect x="18" y="447" width="74" height="24" rx="3" fill="#222831" stroke="#3f4854" />
        <rect x="10" y="471" width="90" height="30" rx="4" fill="#181e26" stroke="#333c48" />

        {/* Mounted Cast-Brass Agal Vilakku Lamp Arm */}
        <path
          d="M78 200 C105 200 110 215 105 235"
          stroke={`url(#${brassGrad})`}
          strokeWidth="3"
          fill="none"
        />
        <line x1="105" y1="235" x2="105" y2="252" stroke="#D97706" strokeWidth="2" />
        <path d="M92 252 Q105 262 118 252 Z" fill={`url(#${brassGrad})`} stroke="#FDE68A" strokeWidth="1" />
        <circle cx="105" cy="250" r="2.5" fill="#B45309" />
      </svg>

      {/* Burning Oil Flame with Restrained Emissive Halo */}
      {lampLit && (
        <div className="absolute right-[-4px] top-[239px] pointer-events-none">
          <motion.div
            className="relative flex items-center justify-center"
            animate={
              still || reducedMotion
                ? { scale: 1, opacity: 0.95 }
                : {
                    scale: [0.95, 1.12, 0.96],
                    opacity: [0.85, 1, 0.9],
                  }
            }
            transition={{
              duration: 1.6,
              repeat: still || reducedMotion ? 0 : Infinity,
              ease: "easeInOut",
            }}
          >
            {/* Soft Ambient Pool */}
            <div
              className="absolute -inset-3 rounded-full opacity-60"
              style={{
                background:
                  "radial-gradient(circle, rgba(251,191,36,0.5) 0%, rgba(217,119,6,0.18) 60%, transparent 80%)",
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
        </div>
      )}
    </div>
  )
}

/**
 * Dravidian Gateway Tower Silhouette (Gopuram with 5 Brass Kalasams)
 */
function DravidianGopuramSilhouetteSVG({ instanceId }: { instanceId: string }) {
  const goldGrad = `${instanceId}-gopuram-gold`

  return (
    <div className="relative w-64 h-16 flex flex-col items-center">
      <svg viewBox="0 0 260 70" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <linearGradient id={goldGrad} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="45%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>
        </defs>

        {/* 5 Brass Kalasam Roof Finials catching dusk light */}
        {[50, 90, 130, 170, 210].map((x, i) => {
          const isCenter = i === 2
          const y = isCenter ? 6 : 12
          const r = isCenter ? 7 : 5.5
          return (
            <g key={i}>
              <line x1={x} y1={y} x2={x} y2={y + 10} stroke="#FEF3C7" strokeWidth="2" />
              <circle cx={x} cy={y + 14} r={r} fill={`url(#${goldGrad})`} stroke="#FEF3C7" strokeWidth="0.8" />
              <rect x={x - 6} y={y + 20} width={12} height={5} rx="1" fill="#78350F" />
            </g>
          )
        })}

        {/* Tiered Barrel-Vaulted Shikhara Roofline */}
        <path
          d="M20 42 Q130 32 240 42 L230 62 H30 Z"
          fill="#1E242D"
          stroke={`url(#${goldGrad})`}
          strokeWidth="1.8"
        />
        {/* Decorative Cornice Ridge */}
        <line x1="32" y1="52" x2="228" y2="52" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.8" />
      </svg>
    </div>
  )
}

/**
 * Deep Stone Portal Gateway Frame (Threshold, Jambs & Lintel)
 */
function StonePortalFrameSVG({ instanceId }: { instanceId: string }) {
  const stoneGrad = `${instanceId}-portal-stone`

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg viewBox="0 0 360 470" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <linearGradient id={stoneGrad} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1E232A" />
            <stop offset="50%" stopColor="#2A313A" />
            <stop offset="100%" stopColor="#161B21" />
          </linearGradient>
        </defs>

        {/* Left Stone Jamb */}
        <rect x="0" y="0" width="16" height="470" fill={`url(#${stoneGrad})`} stroke="#3b4452" strokeWidth="1.2" />
        {/* Right Stone Jamb */}
        <rect x="344" y="0" width="16" height="470" fill={`url(#${stoneGrad})`} stroke="#3b4452" strokeWidth="1.2" />
        {/* Top Stone Lintel */}
        <rect x="0" y="0" width="360" height="20" fill={`url(#${stoneGrad})`} stroke="#3b4452" strokeWidth="1.2" />
        {/* Bottom Stone Threshold */}
        <rect x="0" y="452" width="360" height="18" fill="#14181F" stroke="#2D3540" strokeWidth="1.2" />
      </svg>
    </div>
  )
}

/**
 * Timber Temple Door Leaf with Recessed Carved Panels, Brass Studs & Jamb Hinges
 */
function TimberDoorLeafSVG({
  instanceId,
  side,
}: {
  instanceId: string
  side: "left" | "right"
}) {
  const teakGrad = `${instanceId}-teak`
  const studGrad = `${instanceId}-stud`
  const isLeft = side === "left"

  return (
    <div className="relative w-full h-full">
      <svg viewBox="0 0 164 434" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <linearGradient id={teakGrad} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2A1B12" />
            <stop offset="40%" stopColor="#3E271B" />
            <stop offset="80%" stopColor="#261810" />
            <stop offset="100%" stopColor="#180F0A" />
          </linearGradient>
          <linearGradient id={studGrad} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="50%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>
        </defs>

        {/* Solid Aged Teak Timber Leaf */}
        <rect width="164" height="434" fill={`url(#${teakGrad})`} />

        {/* Heavy Iron/Brass Reinforcement Crossbars */}
        {[35, 135, 235, 335, 410].map((y, i) => (
          <g key={i}>
            <rect x="0" y={y} width="164" height="16" fill="#1A100B" stroke="#4E3324" strokeWidth="1" />
            {/* Conical Brass Studs with Individual Highlights */}
            {[20, 56, 92, 128].map((x, j) => (
              <g key={j}>
                <circle cx={x} cy={y + 8} r="5" fill={`url(#${studGrad})`} stroke="#FEF3C7" strokeWidth="0.7" />
                <circle cx={x} cy={y + 8} r="2" fill="#451A03" />
              </g>
            ))}
          </g>
        ))}

        {/* Recessed Carved Panels with Floral Rosettes */}
        {[60, 160, 260, 360].map((y, i) => (
          <g key={i}>
            <rect x="14" y={y} width="136" height="65" rx="3" fill="#2E1C12" stroke="#4A2E1E" strokeWidth="1.2" />
            <circle cx="82" cy={y + 32} r="16" stroke="#D97706" strokeWidth="1.2" fill="#382115" />
            <circle cx="82" cy={y + 32} r="5" fill="#F59E0B" />
          </g>
        ))}

        {/* Jamb Hinge Plates attached to outer jamb edge */}
        {[50, 210, 370].map((y, i) => (
          <rect
            key={i}
            x={isLeft ? 0 : 156}
            y={y}
            width="8"
            height="24"
            rx="1"
            fill="#B45309"
            stroke="#FEF3C7"
            strokeWidth="0.8"
          />
        ))}

        {/* Meeting Edge Vertical Trim */}
        <rect
          x={isLeft ? 157 : 0}
          y="0"
          width="7"
          height="434"
          fill="#4A2E1E"
          stroke="#D97706"
          strokeWidth="0.8"
        />
      </svg>
    </div>
  )
}

/**
 * Cast Brass Ring Knocker with Ornamental Boss
 */
function BrassRingKnockerSVG({ instanceId }: { instanceId: string }) {
  const goldGrad = `${instanceId}-knocker-gold`

  return (
    <svg viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-12 h-12">
      <defs>
        <linearGradient id={goldGrad} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="50%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
      </defs>
      {/* Heavy Cast Ring */}
      <circle cx="27" cy="34" r="13" stroke="#451A03" strokeWidth="4.5" fill="none" />
      <circle cx="27" cy="34" r="13" stroke="#FDE68A" strokeWidth="2.2" fill="none" />

      {/* Mounting Boss Medallion */}
      <circle cx="27" cy="18" r="11" fill={`url(#${goldGrad})`} stroke="#FEF3C7" strokeWidth="1.2" />
      <circle cx="27" cy="18" r="5" fill="#451A03" />
    </svg>
  )
}

/**
 * Hanging Mango Leaf (Mavilai) and Marigold Festoon
 */
function MangoMarigoldThoranamSVG({ instanceId }: { instanceId: string }) {
  return (
    <svg viewBox="0 0 430 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
      {/* Festoon Hanging Cord */}
      <path d="M0 6 Q215 26 430 6" stroke="#92400E" strokeWidth="2" fill="none" />
      {/* Individual Mango Leaf Shapes with Marigold Buds */}
      {[28, 72, 118, 164, 215, 266, 312, 358, 402].map((x, i) => (
        <g key={i}>
          <path
            d={`M${x} 12 C${x - 7} 26 ${x - 4} 38 ${x} 44 C${x + 4} 38 ${x + 7} 26 ${x} 12 Z`}
            fill="#15803D"
            stroke="#14532D"
            strokeWidth="0.8"
          />
          <circle cx={x} cy={14} r="3.5" fill="#F59E0B" />
        </g>
      ))}
    </svg>
  )
}

/**
 * Suspended Cast Bronze Temple Bell with Clapper
 */
function TempleBellSVG({ instanceId, size = 70 }: { instanceId: string; size?: number }) {
  const bellGrad = `${instanceId}-bell-grad`

  return (
    <div
      className="relative flex flex-col items-center"
      style={{
        width: size,
        filter: "drop-shadow(0 8px 18px rgba(0,0,0,0.75))",
      }}
    >
      <svg viewBox="0 0 80 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <defs>
          <linearGradient id={bellGrad} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="30%" stopColor="#D97706" />
            <stop offset="70%" stopColor="#92400E" />
            <stop offset="100%" stopColor="#451A03" />
          </linearGradient>
        </defs>

        {/* Chain Links */}
        <line x1="40" y1="0" x2="40" y2="28" stroke="#92400E" strokeWidth="3.5" strokeDasharray="3 3" />
        <circle cx="40" cy="28" r="4.5" stroke="#F59E0B" strokeWidth="2" fill="none" />

        {/* Bell Finial */}
        <path d="M35 32 H45 L43 42 H37 Z" fill={`url(#${bellGrad})`} />

        {/* Bell Body */}
        <path
          d="M37 42 C33 56 18 72 16 88 C16 96 64 96 64 88 C62 72 47 56 43 42 Z"
          fill={`url(#${bellGrad})`}
          stroke="#FEF3C7"
          strokeWidth="1.2"
        />

        {/* Lip Ring */}
        <ellipse cx="40" cy="90" rx="24" ry="5.5" fill="#B45309" stroke="#FEF3C7" strokeWidth="1.2" />

        {/* Clapper with Red Silk Tassel */}
        <line x1="40" y1="90" x2="40" y2="105" stroke="#D97706" strokeWidth="2.5" />
        <circle cx="40" cy="107" r="4" fill="#FEF3C7" stroke="#78350F" strokeWidth="0.8" />
        <path d="M38 111 L36 122 H44 L42 111 Z" fill="#DC2626" />
      </svg>
    </div>
  )
}

/**
 * Rice-Flour Kolam Geometric Pattern for Floor Planes
 */
function RiceFlourKolamSVG({ instanceId, size }: { instanceId: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      style={size ? { width: size, height: size } : undefined}
    >
      <circle cx="50" cy="50" r="42" stroke="#FAF7F0" strokeWidth="1.6" strokeDasharray="3 3" />
      <polygon points="50,12 88,50 50,88 12,50" stroke="#FAF7F0" strokeWidth="1.8" fill="none" />
      <polygon points="50,22 78,50 50,78 22,50" stroke="#F59E0B" strokeWidth="1.4" fill="none" />
      <circle cx="50" cy="50" r="12" stroke="#FAF7F0" strokeWidth="1.4" />
      <circle cx="50" cy="50" r="4" fill="#FAF7F0" />
      {/* 4 Cardinal Lotus Accents */}
      <circle cx="50" cy="12" r="3" fill="#FAF7F0" />
      <circle cx="88" cy="50" r="3" fill="#FAF7F0" />
      <circle cx="50" cy="88" r="3" fill="#FAF7F0" />
      <circle cx="12" cy="50" r="3" fill="#FAF7F0" />
    </svg>
  )
}

/**
 * Ceremonial Pavilion Architectural Arch Frame
 */
function CeremonialPavilionFrameSVG({ instanceId }: { instanceId: string }) {
  const frameGrad = `${instanceId}-pavilion-frame`

  return (
    <svg viewBox="0 0 360 480" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id={frameGrad} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="40%" stopColor="#D97706" />
          <stop offset="80%" stopColor="#92400E" />
          <stop offset="100%" stopColor="#451A03" />
        </linearGradient>
      </defs>

      {/* Main Architectural Pavilion Arch */}
      <path
        d="M50 480 V210 C50 110 310 110 310 210 V480"
        stroke={`url(#${frameGrad})`}
        strokeWidth="14"
        strokeLinecap="round"
      />
      {/* Inner Beaded Line */}
      <path
        d="M72 480 V220 C72 140 288 140 288 220 V480"
        stroke="#FEF3C7"
        strokeWidth="2.5"
        strokeDasharray="5 4"
        opacity="0.8"
      />

      {/* Apex Crest Finial */}
      <circle cx="180" cy="96" r="20" fill={`url(#${frameGrad})`} stroke="#FEF3C7" strokeWidth="1.5" />
      <circle cx="180" cy="96" r="10" fill="#451A03" />
      <polygon points="180,78 185,90 175,90" fill="#FEF3C7" />
      <path d="M176 74 L180 54 L184 74 Z" fill={`url(#${frameGrad})`} stroke="#FEF3C7" strokeWidth="1" />
    </svg>
  )
}

/**
 * Sculptural 5-Tiered Brass Temple Kuthuvilakku Lamp (Accurately 5 Tiers)
 */
function FiveTierKuthuvilakkuSVG({
  instanceId,
  lit,
  still,
  reducedMotion,
}: {
  instanceId: string
  lit: boolean
  still?: boolean
  reducedMotion?: boolean
}) {
  const kuthuGrad = `${instanceId}-kuthu-grad`

  return (
    <div className="relative w-22 h-[410px] flex flex-col items-center">
      <svg viewBox="0 0 85 430" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <linearGradient id={kuthuGrad} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="40%" stopColor="#D97706" />
            <stop offset="85%" stopColor="#92400E" />
            <stop offset="100%" stopColor="#451A03" />
          </linearGradient>
        </defs>

        {/* Sculpted Swan (Annam) Apex Finial */}
        <path
          d="M42 22 C38 12 33 10 36 4 C42 1 48 8 47 16 C51 10 56 6 60 10 C58 18 50 22 42 22 Z"
          fill={`url(#${kuthuGrad})`}
          stroke="#FEF3C7"
          strokeWidth="0.8"
        />

        {/* Central Cast Brass Spindle Rod */}
        <rect x="40" y="22" width="5" height="365" fill={`url(#${kuthuGrad})`} stroke="#FEF3C7" strokeWidth="0.6" />

        {/* Tier 1 Bowl (Top) */}
        <ellipse cx="42" cy="60" rx="16" ry="6" fill={`url(#${kuthuGrad})`} stroke="#FEF3C7" strokeWidth="1" />
        {/* Tier 2 Bowl */}
        <ellipse cx="42" cy="125" rx="22" ry="7" fill={`url(#${kuthuGrad})`} stroke="#FEF3C7" strokeWidth="1" />
        {/* Tier 3 Bowl */}
        <ellipse cx="42" cy="195" rx="27" ry="8" fill={`url(#${kuthuGrad})`} stroke="#FEF3C7" strokeWidth="1" />
        {/* Tier 4 Bowl */}
        <ellipse cx="42" cy="265" rx="32" ry="9" fill={`url(#${kuthuGrad})`} stroke="#FEF3C7" strokeWidth="1" />
        {/* Tier 5 Bowl (Bottom) */}
        <ellipse cx="42" cy="335" rx="36" ry="10" fill={`url(#${kuthuGrad})`} stroke="#FEF3C7" strokeWidth="1" />

        {/* Stepped Pedestal Base */}
        <rect x="28" y="385" width="28" height="15" rx="2" fill={`url(#${kuthuGrad})`} />
        <ellipse cx="42" cy="415" rx="36" ry="13" fill={`url(#${kuthuGrad})`} stroke="#FEF3C7" strokeWidth="1.2" />
      </svg>

      {/* Burning Oil Wicks on the 5 Tiers */}
      {lit && (
        <div className="absolute inset-0 pointer-events-none">
          {[56, 120, 189, 258, 328].map((y, i) => (
            <motion.div
              key={i}
              className="absolute left-1/2 -translate-x-1/2 rounded-full"
              style={{
                top: y,
                width: 5,
                height: 8,
                background:
                  "linear-gradient(to top, #EA580C 0%, #F59E0B 60%, #FEF3C7 100%)",
                boxShadow: "0 0 8px #FBBF24",
              }}
              animate={
                still || reducedMotion
                  ? { scale: 1, opacity: 0.95 }
                  : {
                      scale: [0.85, 1.15, 0.9],
                      opacity: [0.85, 1, 0.85],
                    }
              }
              transition={{
                duration: 1.3 + i * 0.15,
                repeat: still || reducedMotion ? 0 : Infinity,
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
 * Low Antique Brass Urli Vessel with Floating Blossoms
 */
function CeremonialBrassUrliSVG({ instanceId }: { instanceId: string }) {
  const urliGrad = `${instanceId}-urli-gold`

  return (
    <div className="relative w-52 h-26 flex flex-col items-center justify-center">
      <svg viewBox="0 0 190 85" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <defs>
          <linearGradient id={urliGrad} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="50%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>
        </defs>
        {/* Brass Vessel Rim */}
        <ellipse cx="95" cy="42" rx="82" ry="28" fill={`url(#${urliGrad})`} stroke="#FEF3C7" strokeWidth="2" />
        {/* Water Pool */}
        <ellipse cx="95" cy="42" rx="72" ry="20" fill="#0F172A" opacity="0.95" />

        {/* Floating Pink Lotus Blossom at Center */}
        <circle cx="95" cy="42" r="13" fill="#F43F5E" />
        <circle cx="90" cy="39" r="7" fill="#FB7185" />
        <circle cx="100" cy="39" r="7" fill="#FB7185" />
        <circle cx="95" cy="38" r="8" fill="#FDA4AF" />
        <circle cx="95" cy="42" r="3.5" fill="#FDE047" />

        {/* Floating Jasmine White Flowers */}
        <circle cx="62" cy="43" r="5" fill="#FAF7F0" />
        <circle cx="72" cy="49" r="4.5" fill="#FAF7F0" />
        <circle cx="122" cy="41" r="5" fill="#FAF7F0" />
        <circle cx="132" cy="47" r="4.5" fill="#FAF7F0" />

        {/* Floating Oil Diya */}
        <ellipse cx="95" cy="52" rx="7" ry="3.5" fill="#92400E" stroke="#FDE68A" strokeWidth="0.8" />
        <circle cx="95" cy="50" r="2" fill="#F59E0B" />
      </svg>
    </div>
  )
}

/**
 * Folio Corner Brass Filigree Accent
 */
function FolioCornerOrnament({
  position,
  instanceId,
}: {
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right"
  instanceId: string
}) {
  const isTop = position.includes("top")
  const isLeft = position.includes("left")

  return (
    <div
      className={`absolute ${isTop ? "top-2.5" : "bottom-2.5"} ${
        isLeft ? "left-2.5" : "right-2.5"
      } w-7 h-7 pointer-events-none opacity-85 z-25`}
      style={{
        transform: `${!isLeft ? "scaleX(-1)" : ""} ${!isTop ? "scaleY(-1)" : ""}`,
      }}
    >
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M4 32 V10 C4 6.5 6.5 4 10 4 H32"
          stroke="#C5A059"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="8" cy="8" r="2.5" fill="#FDE68A" />
        <path d="M10 10 Q18 12 18 18 Q12 18 10 10 Z" fill="#D97706" />
      </svg>
    </div>
  )
}
