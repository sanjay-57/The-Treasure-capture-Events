import type { ReactNode } from "react"
import type { Bi, Lang } from "../../../lib/i18n"
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
] as const
export type CinematicTheme = typeof CINEMATIC_THEMES[number]

export const isCinematicTheme = (theme: InviteTheme): theme is CinematicTheme =>
  (CINEMATIC_THEMES as readonly string[]).includes(theme)

/** What the 3D scene is called and shows, for the builder's "How it opens" choice. */
export const CINEMATIC_META: Record<CinematicTheme, { name: Bi; blurb: Bi }> = {
  athangudi: {
    name: { en: "Chettinad Courtyard", ta: "செட்டிநாட்டு முற்றம்" },
    blurb: { en: "Carved timber doors, Athangudi floor, brass lamps & floral garland", ta: "மரக் கதவுகள், ஆத்தங்குடி தரை, பித்தளை விளக்குகள், மலர் மாலை" },
  },
  kanjivaram: {
    name: { en: "Kanjivaram Ceremony", ta: "காஞ்சிப் பட்டு" },
    blurb: { en: "Sculptural silk folds, golden zari borders & brass medallion", ta: "அரக்குப் பட்டு மடிப்புகள், ஜரிகைப் பட்டைகள், பித்தளை முத்திரை" },
  },
  lotus: {
    name: { en: "Lotus Mandapam", ta: "தாமரை மண்டபம்" },
    blurb: { en: "A sculpted lotus blooms in an ivory & gold temple pavilion", ta: "கோயில் மண்டபத்தில் விரியும் சிற்பத் தாமரை மலர்" },
  },
  ruby: {
    name: { en: "Royal Jharokha", ta: "ராஜ ஜரோகா" },
    blurb: { en: "Sandstone palace arch, carved jaali screens & royal seal", ta: "அரண்மனை ஜன்னல், ஜாலி திரைகள், அரச முத்திரை" },
  },
  moonlit: {
    name: { en: "Moonlit Jasmine", ta: "நிலா மல்லிகை" },
    blurb: { en: "Evening garden, swaying jasmine garlands & moonlit panel", ta: "மாலைத் தோட்டம், ஊஞ்சல், தொங்கும் மல்லிகைச் சரம்" },
  },
  kolam: {
    name: { en: "Kolam Keepsake", ta: "கோலப் பெட்டகம்" },
    blurb: { en: "Heirloom rosewood keepsake box with a self-tracing kolam", ta: "மரப் பெட்டகம், தானாக வரையும் கோலம், பித்தளைப் பூட்டு" },
  },
  marigold: {
    name: { en: "Grand Marigold Mandap", ta: "செண்டுமல்லி மண்டபம்" },
    blurb: { en: "Cascading marigold canopy, brass temple bells & a rose-petal shower", ta: "செண்டுமல்லி மாலைத் தோரணம், கோவில் மணி, ரோஜா இதழ் மழை" },
  },
  peacock: {
    name: { en: "Mayil Mandapam", ta: "மயில் மண்டபம்" },
    blurb: { en: "Royal peacock darbar, iridescent feather fan & emerald brooch", ta: "ராஜ மயில் தோகை விசிறி, மரகதப் பதக்கம், பொன் ஜரிகை" },
  },
  emerald: {
    name: { en: "Sheesh Mahal", ta: "கண்ணாடி அரண்மனை" },
    blurb: { en: "Mirror-mosaic arches, crystal chandeliers & emerald velvet", ta: "கண்ணாடி மாளிகை வளைவுகள், சரவிளக்குகள், மரகத வெல்வெட்" },
  },
  rangoli: {
    name: { en: "Utsav Rangoli Mandala", ta: "உற்சவ ரங்கோலி" },
    blurb: { en: "A spinning floral rangoli & a glowing brass diya altar", ta: "சுழலும் மலர் ரங்கோலி, ஒளிரும் பித்தளை அகல் விளக்குகள்" },
  },
  lamp: {
    name: { en: "The Temple Atelier", ta: "கோவில் சிற்பக்கூடம்" },
    blurb: { en: "A miniature temple pavilion whose roof lifts to reveal a keepsake folio", ta: "கோவில் சிற்ப மாதிரி மண்டபம்; கூரை உயர்ந்து சுவடி வெளிப்படும்" },
  },
}

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
