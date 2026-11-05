import type { ReactNode } from "react"
import type { Lang } from "../../../lib/i18n"
import type { Invite, InviteTheme } from "../../../lib/invite"

export const CINEMATIC_THEMES = [
  "athangudi",
  "kanjivaram",
  "lotus",
  "ruby",
  "moonlit",
  "kolam",
  "marigold",
  "peacock",
  "emerald",
  "rangoli",
  "lamp",
  "blush",
] as const
export type CinematicTheme = typeof CINEMATIC_THEMES[number]

export const isCinematicTheme = (theme: InviteTheme): theme is CinematicTheme =>
  (CINEMATIC_THEMES as readonly string[]).includes(theme)

export type SceneState = "closed" | "opening" | "opened"

export interface CinematicSceneProps {
  invite: Invite
  lang: Lang
  sample?: boolean
  size?: { w: number; h: number }
  still?: boolean
  art?: string
  share?: ReactNode
  onReady?: () => void
}
