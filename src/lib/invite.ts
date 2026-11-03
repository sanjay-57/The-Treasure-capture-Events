/*
 * E-invites without a server: the whole invite travels in the URL fragment as
 * base64url JSON, `/i/<theme>#<payload>`. Twenty-nine single-screen designs,
 * twelve free and seventeen premium; old links with the retired `gopuram` id
 * open as Lantern Night. When the backend lands, the same page reads
 * `/api/invite/<code>` instead and links shrink to `/i/abc123`.
 * Keep this file free of React imports.
 */

export const FREE_THEMES = [
  "ivory",
  "jasmine",
  "kolam",
  "mono",
  "marigold",
  "blush",
  "turmeric",
  "lamp",
  "pattu",
  "moonlit",
  "rose",
  "paisley",
] as const

export const PREMIUM_THEMES = [
  "lantern",
  "kanjivaram",
  "ruby",
  "banana",
  "monsoon",
  "peacock",
  "athangudi",
  "sunburst",
  "aurora",
  "deco",
  "lotus",
  "madras",
  "terrazzo",
  "seigaiha",
  "rangoli",
  "emerald",
  "confetti",
] as const

export type InviteTheme = typeof FREE_THEMES[number] | typeof PREMIUM_THEMES[number]

export const isPremium = (t: InviteTheme) =>
  (PREMIUM_THEMES as readonly string[]).includes(t)

/** Retired theme ids that old links and saved drafts may still carry. */

const RETIRED: Record<string, InviteTheme> = {
  gopuram: "lantern",
  sage: "rose",
  polka: "turmeric",
  stripe: "pattu",
  sunset: "moonlit",
  halftone: "paisley",
  duo: "lamp",
  temple: "lamp",
}

/** A theme id from a link, route or saved draft, with retired ids mapped forward; null if unknown. */

export function toTheme(s: unknown): InviteTheme | null {
  if (typeof s !== "string") return null

  const t = RETIRED[s] ?? s

  return (FREE_THEMES as readonly string[]).includes(t) ||
    (PREMIUM_THEMES as readonly string[]).includes(t)
    ? t as InviteTheme
    : null
}

export interface Invite {
  /** Names in English and Tamil: [bride, groom]. */

  en: [string, string]

  ta: [string, string]

  parents?: { en: string; ta: string }

  /** ISO date and 24 h muhurtham time, local to the venue. */

  date: string

  time: string

  venue: string

  address?: string

  lat?: number

  lng?: number

  /** Couple's WhatsApp number for RSVP. */

  phone?: string

  theme: InviteTheme

  caricature?: string
}

// Short keys keep the fragment near 300 bytes.

type Wire = {
  e: [string, string]
  t: [string, string]
  p?: [string, string]
  d: string
  h: string
  v: string
  a?: string
  l?: [number, number]
  w?: string
  m: InviteTheme
  c?: string
}

const toB64Url = (s: string) => {
  const bytes = new TextEncoder().encode(s)

  let bin = ""

  for (const b of bytes) bin += String.fromCharCode(b)

  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

const fromB64Url = (s: string) => {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"))

  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))
}

/** Coordinates to 5 decimals (about 1 m), which is all a map pin needs. */

const round5 = (n: number) => Math.round(n * 1e5) / 1e5

export function encodeInvite(i: Invite): string {
  const w: Wire = {
    e: i.en,
    t: i.ta,
    d: i.date,
    h: i.time,
    v: i.venue,
    m: i.theme,
  }

  if (i.parents) w.p = [i.parents.en, i.parents.ta]

  if (i.address) w.a = i.address

  if (i.lat !== undefined && i.lng !== undefined)
    w.l = [round5(i.lat), round5(i.lng)]

  if (i.phone) w.w = i.phone

  if (i.caricature) w.c = i.caricature

  return toB64Url(JSON.stringify(w))
}

/** Null for a damaged or hand-edited link, so the page can show a friendly error. */

export function decodeInvite(payload: string): Invite | null {
  try {
    const w = JSON.parse(fromB64Url(payload)) as Wire

    const theme = toTheme(w.m)

    if (
      !Array.isArray(w.e) ||
      !Array.isArray(w.t) ||
      typeof w.d !== "string" ||
      typeof w.v !== "string" ||
      !theme
    )
      return null

    return {
      en: w.e,
      ta: w.t,
      date: w.d,
      time: w.h ?? "",
      venue: w.v,
      theme,

      parents: w.p ? { en: w.p[0], ta: w.p[1] } : undefined,

      address: w.a,
      lat: w.l?.[0],
      lng: w.l?.[1],
      phone: w.w,
      caricature: w.c,
    }
  } catch {
    return null
  }
}

export const invitePath = (i: Invite) => `/i/${i.theme}#${encodeInvite(i)}`

const where = (i: Invite) =>
  i.lat !== undefined && i.lng !== undefined
    ? `${round5(i.lat)},${round5(i.lng)}`
    : encodeURIComponent([i.venue, i.address].filter(Boolean).join(", "))

/** Keyless Google Maps embed for the iframe. */

export const mapEmbedUrl = (i: Invite) =>
  `https://www.google.com/maps?q=${where(i)}&output=embed`

/** One-tap directions; also the QR code target. */

export const directionsUrl = (i: Invite) =>
  `https://www.google.com/maps/dir/?api=1&destination=${where(i)}`

/** RSVP on WhatsApp to the couple, with the "We'll be there" message prefilled. */

export function rsvpUrl(i: Invite, lang: "en" | "ta"): string | null {
  if (!i.phone) return null

  const d = i.phone.replace(/\D/g, "")

  const to = d.length === 10 ? "91" + d : d

  const text =
    lang === "ta"
      ? `${i.ta[0]} – ${i.ta[1]} திருமணத்துக்கு நாங்கள் வருகிறோம்!`
      : `We'll be there for ${i.en[0]} & ${i.en[1]}'s wedding!`

  return `https://wa.me/${to}?text=${encodeURIComponent(text)}`
}

/** Time left until the muhurtham (India time, +05:30), floored to whole seconds; zeros once it has passed. */

export function countdown(i: Pick<Invite, "date" | "time">, now = Date.now()) {
  const at = Date.parse(`${i.date}T${i.time || "00:00"}:00+05:30`)

  const left = Math.max(0, Math.floor((at - now) / 1000))

  return {
    done: left === 0,
    days: Math.floor(left / 86400),
    hours: Math.floor((left % 86400) / 3600),
    minutes: Math.floor((left % 3600) / 60),
    seconds: left % 60,
  }
}

// ─── Themes, sharing and the builder ─────────────────────────────────────────

/**
 * Picker metadata per theme; every theme is a finished design. The look itself
 * (colours, fonts, motif art) lives in `pages/invite/themes.ts`, shared by the
 * page and the PNG. `swatch` is [background, accent] for compact chips.
 */

export const THEME_META: Record<InviteTheme, {
  name: { en: string; ta: string };
  blurb: { en: string; ta: string };
  swatch: [string, string];
}> = {
  ivory: {
    name: { en: "Classic Ivory", ta: "கிளாசிக் ஐவரி" },
    blurb: {
      en: "Cream paper, double gold frame, floral corners",
      ta: "கிரீம் தாள், இரட்டைத் தங்கச் சட்டம், மலர் மூலைகள்",
    },
    swatch: ["#f6f1e7", "#8a6d3b"],
  },

  jasmine: {
    name: { en: "Jasmine Strands", ta: "மல்லிகைச் சரம்" },
    blurb: {
      en: "White, hanging jasmine, leaf green",
      ta: "வெள்ளை, தொங்கும் மல்லிகை, இலைப் பச்சை",
    },
    swatch: ["#fdfcf8", "#5f8a5a"],
  },

  kolam: {
    name: { en: "Kolam Keepsake 3D", ta: "கோலப் பெட்டகம் 3D" },
    blurb: {
      en: "Heirloom rosewood keepsake box with self-tracing kolam",
      ta: "மரப் பெட்டகம், தானாக வரையும் கோலம், பித்தளைப் பூட்டு",
    },
    swatch: ["#341208", "#DC2626"],
  },

  mono: {
    name: { en: "Modern Mono", ta: "கருப்பு வெள்ளை" },
    blurb: {
      en: "Black poster, huge serif type, fine grid",
      ta: "கருப்பு போஸ்டர், பெரிய எழுத்து, மெல்லிய கட்டம்",
    },
    swatch: ["#0b0b0c", "#ffffff"],
  },

  marigold: {
    name: { en: "Grand Marigold Mandap 3D", ta: "செண்டுமல்லி மண்டபம் 3D" },
    blurb: {
      en: "Cascading genda phool canopy, brass temple bells & rose petal shower",
      ta: "செண்டுமல்லி மாலைத் தோரணம், கோவில் மணி, ரோஜா இதழ் மழை",
    },
    swatch: ["#451A03", "#F59E0B"],
  },

  blush: {
    name: { en: "Blush Editorial", ta: "இளஞ்சிவப்பு" },
    blurb: {
      en: "Solid dusty pink, big italic names",
      ta: "ஒற்றை இளஞ்சிவப்பு, பெரிய சாய்வு எழுத்து",
    },
    swatch: ["#f1d3cd", "#9b3446"],
  },

  turmeric: {
    name: { en: "Turmeric & Kumkum", ta: "மஞ்சள் குங்குமம்" },
    blurb: {
      en: "Turmeric gold, kumkum-red bands and rosette",
      ta: "மஞ்சள், குங்குமச் சிவப்புப் பட்டைகள், மலர்",
    },
    swatch: ["#f4b512", "#b0141e"],
  },

  lamp: {
    name: { en: "Temple Hallway 3D", ta: "கோவில் பிரகாரம் 3D" },
    blurb: {
      en: "Immersive Dravidian temple corridor with receding Yali pillars, swaying bells, flickering diyas & royal scroll",
      ta: "ஆயிரங்கால் மண்டபம், யாளிக் தூண்கள், கோவில் மணி, தீப வரிசை & தாமிர சாசனம்",
    },
    swatch: ["#17120E", "#F59E0B"],
  },

  pattu: {
    name: { en: "Pattu Border", ta: "பட்டுக் கரை" },
    blurb: {
      en: "Ivory with a magenta-and-zari silk border",
      ta: "ஐவரியில் மெஜந்தா ஜரிகைப் பட்டுக் கரை",
    },
    swatch: ["#fbf6ee", "#a3195b"],
  },

  moonlit: {
    name: { en: "Moonlit Jasmine 3D", ta: "நிலா மல்லிகை 3D" },
    blurb: {
      en: "Evening garden, swaying jasmine garlands & moonlit panel",
      ta: "மாலைத் தோட்டம், ஊஞ்சல், தொங்கும் மல்லிகைச் சரம்",
    },
    swatch: ["#152244", "#60A5FA"],
  },

  rose: {
    name: { en: "Rose Garden", ta: "ரோஜாத் தோட்டம்" },
    blurb: {
      en: "Blush paper, rose corners, script names",
      ta: "இளஞ்சிவப்புத் தாள், ரோஜா மூலைகள், கையெழுத்துப் பெயர்கள்",
    },
    swatch: ["#fbeeec", "#c25670"],
  },

  paisley: {
    name: { en: "Paisley Gold", ta: "மாங்காய்க் கோலம்" },
    blurb: {
      en: "Cream with gold paisley and a double frame",
      ta: "கிரீமில் தங்க மாங்காய் வடிவம், இரட்டைச் சட்டம்",
    },
    swatch: ["#f8f0e0", "#a8791c"],
  },

  lantern: {
    name: { en: "Lantern Night", ta: "லாந்தர் இரவு" },
    blurb: {
      en: "Deep navy, swaying brass lanterns, stars",
      ta: "அடர் நீலம், அசையும் பித்தளை லாந்தர்கள், நட்சத்திரங்கள்",
    },
    swatch: ["#0d1736", "#e6b85c"],
  },

  kanjivaram: {
    name: { en: "Kanjivaram Ceremony 3D", ta: "காஞ்சிப் பட்டு 3D" },
    blurb: {
      en: "Sculptural silk folds, golden zari borders & brass medallion",
      ta: "அரக்குப் பட்டு மடிப்புகள், ஜரிகைப் பட்டைகள், பித்தளை முத்திரை",
    },
    swatch: ["#450A18", "#EAB308"],
  },

  ruby: {
    name: { en: "Royal Jharokha 3D", ta: "ராஜ ஜரோகா 3D" },
    blurb: {
      en: "Sandstone palace arch, carved jaali screens & royal seal",
      ta: "அரண்மனை ஜன்னல், ஜாலி திரைகள், அரச முத்திரை",
    },
    swatch: ["#4C0519", "#F43F5E"],
  },

  banana: {
    name: { en: "Banana-leaf Feast", ta: "வாழை இலை விருந்து" },
    blurb: {
      en: "Plantain leaves, cream and gold",
      ta: "வாழை இலைகள், கிரீம், தங்கம்",
    },
    swatch: ["#1f5530", "#f2d27a"],
  },

  monsoon: {
    name: { en: "Monsoon Garden", ta: "மழைக்காலத் தோட்டம்" },
    blurb: {
      en: "Dusky blue, rain, lotus pond, lime",
      ta: "மங்கிய நீலம், மழை, தாமரைக் குளம்",
    },
    swatch: ["#1f3050", "#c9e27a"],
  },

  peacock: {
    name: { en: "Mayil Mandapam 3D", ta: "மயில் மண்டபம் 3D" },
    blurb: {
      en: "Royal peacock darbar, iridescent feather fan & emerald brooch",
      ta: "ராஜ மயில் தோகை விசிறி, மரகதப் பதக்கம், பொன் ஜரிகை",
    },
    swatch: ["#042F2E", "#14B8A6"],
  },

  athangudi: {
    name: { en: "Chettinad Courtyard 3D", ta: "செட்டிநாட்டு முற்றம் 3D" },
    blurb: {
      en: "Carved timber doors, Athangudi floor, brass lamps & floral garland",
      ta: "மரக் கதவுகள், ஆத்தங்குடி தரை, பித்தளை விளக்குகள், மலர் மாலை",
    },
    swatch: ["#2D1810", "#F59E0B"],
  },

  sunburst: {
    name: { en: "Sunburst", ta: "சூரியக் கதிர்" },
    blurb: {
      en: "Magenta and orange rays, confetti",
      ta: "மெஜந்தா, ஆரஞ்சுக் கதிர்கள், வண்ணத் துகள்கள்",
    },
    swatch: ["#ff2e63", "#ff7a2e"],
  },

  aurora: {
    name: { en: "Aurora Glass", ta: "அரோரா" },
    blurb: {
      en: "Violet, teal and pink mesh, glass card",
      ta: "ஊதா, நீலப்பச்சை, இளஞ்சிவப்பு ஒளி, கண்ணாடி அட்டை",
    },
    swatch: ["#3b1d7a", "#f0abfc"],
  },

  deco: {
    name: { en: "Midnight Deco", ta: "மிட்நைட் டெகோ" },
    blurb: {
      en: "Black and gold art-deco fans",
      ta: "கருப்பு, தங்க ஆர்ட் டெகோ விசிறிகள்",
    },
    swatch: ["#0b0b0d", "#d8b46a"],
  },

  lotus: {
    name: { en: "Lotus Mandapam 3D", ta: "தாமரை மண்டபம் 3D" },
    blurb: {
      en: "Sculpted lotus bloom in an ivory & gold temple pavilion",
      ta: "கோயில் மண்டபத்தில் விரியும் சிற்பத் தாமரை மலர்",
    },
    swatch: ["#201323", "#F472B6"],
  },

  madras: {
    name: { en: "Madras Check", ta: "மதராஸ் கட்டம்" },
    blurb: { en: "Loud madras plaid, cream card", ta: "மதராஸ் கட்டம், கிரீம் அட்டை" },
    swatch: ["#c8102e", "#f6c445"],
  },

  terrazzo: {
    name: { en: "Terrazzo", ta: "டெராசோ" },
    blurb: {
      en: "Speckled stone chips, modern type",
      ta: "கற்சில்லுத் தரை, நவீன எழுத்து",
    },
    swatch: ["#f3eee6", "#e2603b"],
  },

  seigaiha: {
    name: { en: "Ocean Waves", ta: "கடல் அலை" },
    blurb: {
      en: "Royal blue with stacked wave scales",
      ta: "நீலத்தில் அடுக்கு அலைகள்",
    },
    swatch: ["#0b3d91", "#9ed8ff"],
  },

  rangoli: {
    name: { en: "Utsav Rangoli Mandala 3D", ta: "உற்சவ ரங்கோலி 3D" },
    blurb: {
      en: "Concentric spinning 3D floral rangoli & glowing brass diya altar",
      ta: "சுழலும் 3D மலர் ரங்கோலி, ஒளிரும் பித்தளை அகல் விளக்குகள்",
    },
    swatch: ["#3B0720", "#F43F5E"],
  },

  emerald: {
    name: { en: "Sheesh Mahal 3D", ta: "கண்ணாடி அரண்மனை 3D" },
    blurb: {
      en: "Thikri mirror mosaic arches, crystal chandeliers & emerald velvet",
      ta: "கண்ணாடி மாளிகை வளைவுகள், சரவிளக்குகள், மரகத வெல்வெட்",
    },
    swatch: ["#064E3B", "#10B981"],
  },

  confetti: {
    name: { en: "Confetti Pop", ta: "வண்ணத் துகள்" },
    blurb: {
      en: "Hot pink, flying confetti, white card",
      ta: "இளஞ்சிவப்பு, பறக்கும் துகள்கள், வெள்ளை அட்டை",
    },
    swatch: ["#ff3e8a", "#ffe14d"],
  },
}

/** Catalogue id of the ₹1,500 premium e-invite add-on (roadmap 1.3). */

export const PREMIUM_INVITE_ITEM = "einvite_premium"

/** Premium themes unlock once the premium e-invite is in the order or showroom cart. Free themes are always open. */

export const premiumUnlocked = (
  items: Partial<Record<string, number>> | undefined,
) => (items?.[PREMIUM_INVITE_ITEM] ?? 0) > 0

export const themeOpen = (theme: InviteTheme, premium: boolean) =>
  premium || !isPremium(theme)

/** The wedding day as the invite prints it, in India time. */

export function inviteDay(date: string, lang: "en" | "ta") {
  const d = new Date(`${date}T00:00:00+05:30`)

  if (Number.isNaN(d.getTime())) return date

  return d.toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  })
}

/** The short message that goes with a forwarded link, in the sender's language. */

export function shareText(i: Invite, lang: "en" | "ta") {
  const time = i.time
    ? lang === "ta"
      ? `, முகூர்த்தம் ${i.time}`
      : `, muhurtham ${i.time}`
    : ""

  return lang === "ta"
    ? `${i.ta[0]} – ${i.ta[1]} திருமணம்! ${inviteDay(i.date, "ta")}${time}, ${i.venue}. உங்களுக்கான அழைப்பிதழ்:`
    : `${i.en[0]} & ${i.en[1]} are getting married! ${inviteDay(i.date, "en")}${time}, at ${i.venue}. Your invitation:`
}

/** WhatsApp's own share picker (no number), with the message and the link. */

export const whatsappShareUrl = (i: Invite, lang: "en" | "ta", url: string) =>
  `https://wa.me/?text=${encodeURIComponent(`${shareText(i, lang)}\n${url}`)}`

/** "9.9195, 78.1193" (as Google Maps copies it) or a maps link with `@lat,lng` / `q=lat,lng`. */

export function parseLatLng(s: string): { lat: number; lng: number } | null {
  const m = s.match(/(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)/)

  if (!m) return null

  const lat = Number(m[1])

  const lng = Number(m[2])

  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null
}

/** Best guess at [bride, groom] from an order name such as "Priya & Karthik". */

export function splitCouple(name: string): [string, string] {
  const parts = name
    .split(/\s*(?:&|\band\b|\/|,|\+)\s*/i)
    .map((p) => p.trim())
    .filter(Boolean)

  return parts.length >= 2 ? [parts[0], parts[1]] : [parts[0] ?? "", ""]
}

/** What the builder form holds: plain strings, so every field can sit half-typed. */

export interface InviteDraft {
  brideEn: string

  groomEn: string

  brideTa: string

  groomTa: string

  parentsEn: string

  parentsTa: string

  date: string

  time: string

  venue: string

  address: string

  /** "lat, lng" as pasted from Google Maps. */

  pin: string

  phone: string

  theme: InviteTheme

  /** A hosted caricature image. The uploaded one stays on the device and never enters the link. */

  caricatureUrl: string
}

export const BLANK_DRAFT: InviteDraft = {
  brideEn: "",
  groomEn: "",
  brideTa: "",
  groomTa: "",
  parentsEn: "",
  parentsTa: "",

  date: "",
  time: "",
  venue: "",
  address: "",
  pin: "",
  phone: "",
  theme: "ivory",
  caricatureUrl: "",
}

/** Fields still needed before the link can be made. */

export function draftMissing(d: InviteDraft): ("names" | "date" | "venue")[] {
  const out: ("names" | "date" | "venue")[] = []

  if (!d.brideEn.trim() || !d.groomEn.trim()) out.push("names")

  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date)) out.push("date")

  if (!d.venue.trim()) out.push("venue")

  return out
}

/** Builder form to invite. Blank Tamil names fall back to the English ones so the Tamil view never shows a gap. */

export function draftToInvite(d: InviteDraft): Invite {
  const pin = parseLatLng(d.pin)

  const en: [string, string] = [d.brideEn.trim(), d.groomEn.trim()]

  const i: Invite = {
    en,
    ta: [d.brideTa.trim() || en[0], d.groomTa.trim() || en[1]],
    date: d.date,
    time: d.time,
    venue: d.venue.trim(),
    theme: d.theme,
  }

  const pe = d.parentsEn.trim()

  const pt = d.parentsTa.trim()

  if (pe || pt) i.parents = { en: pe || pt, ta: pt || pe }

  if (d.address.trim()) i.address = d.address.trim()

  if (pin) {
    i.lat = pin.lat
    i.lng = pin.lng
  }

  if (d.phone.trim()) i.phone = d.phone.trim()

  // Only hosted images travel in the link; data URLs would blow the fragment up.

  if (isPremium(d.theme) && /^https:\/\//.test(d.caricatureUrl.trim()))
    i.caricature = d.caricatureUrl.trim()

  return i
}

/** The wedding day split for the date lockup (weekday · month | day | year), in India time. */

export function dateParts(date: string, lang: "en" | "ta") {
  const d = new Date(`${date}T00:00:00+05:30`)

  if (Number.isNaN(d.getTime()))
    return { weekday: "", day: date, month: "", year: "" }

  const f = (o: Intl.DateTimeFormatOptions) =>
    d.toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", {
      ...o,
      timeZone: "Asia/Kolkata",
    })

  return {
    weekday: f({ weekday: "long" }),
    day: f({ day: "numeric" }),
    month: f({ month: "long" }),
    year: f({ year: "numeric" }),
  }
}

/** "06:30" → "6:30 am" (or the Tamil equivalent); anything else is returned as typed. */

export function timeLabel(time: string, lang: "en" | "ta") {
  const m = time.match(/^(\d{1,2}):(\d{2})$/)

  if (!m) return time

  return new Date(
    Date.UTC(2000, 0, 1, Number(m[1]), Number(m[2])),
  ).toLocaleTimeString(lang === "ta" ? "ta-IN" : "en-IN", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  })
}
