import { lazy, Suspense, type ComponentType } from "react"
import type { CinematicSceneProps, CinematicTheme } from "./types"

type Scene = ComponentType<CinematicSceneProps>
const scene = (load: () => Promise<Record<string, unknown>>, name: string) =>
  lazy(() => load().then((m) => ({ default: m[name] as Scene })))

// One chunk per scene: a guest only downloads the design they were sent.
const SCENES: Record<CinematicTheme, Scene> = {
  athangudi: scene(() => import("./ChettinadCourtyard"), "ChettinadCourtyard"),
  kanjivaram: scene(() => import("./KanjivaramCeremony"), "KanjivaramCeremony"),
  lotus: scene(() => import("./LotusMandapam"), "LotusMandapam"),
  ruby: scene(() => import("./RoyalJharokha"), "RoyalJharokha"),
  moonlit: scene(() => import("./MoonlitJasmine"), "MoonlitJasmine"),
  kolam: scene(() => import("./KolamKeepsake"), "KolamKeepsake"),
  marigold: scene(() => import("./MarigoldMandap"), "MarigoldMandap"),
  peacock: scene(() => import("./MayilMandapam"), "MayilMandapam"),
  emerald: scene(() => import("./SheeshMahal"), "SheeshMahal"),
  rangoli: scene(() => import("./UtsavRangoli"), "UtsavRangoli"),
  lamp: scene(() => import("./TempleHallway"), "TempleHallway"),
}

/** The 3D scene for a design (layout `cinematic`). The PNG never comes here; it uses the story card. */
export function CinematicInvite({ theme, ...props }: CinematicSceneProps & { theme: CinematicTheme }) {
  const Scene = SCENES[theme]
  const box = props.size ? { width: props.size.w, height: props.size.h } : { width: "100%", height: "100svh" }
  return (
    <Suspense fallback={<div className="bg-[#0A0807]" style={box} />}>
      <Scene {...props} />
    </Suspense>
  )
}
