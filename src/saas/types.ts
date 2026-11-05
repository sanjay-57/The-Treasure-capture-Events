/**
 * Photographer section ("studio" SaaS): the album photo selector and the
 * storage devices manager, sold to other photographers. Nothing in src/saas
 * imports TTC order data, so this folder can move to its own repo later.
 * Prisma models in docs/album-selection-plan.md mirror these shapes.
 */

/** Derived by usage.deriveStatus(), never stored: pending until Paid, active while the paid term runs, paused when revoked or expired, cancelled on decline. */
export type StudioStatus = 'pending' | 'active' | 'paused' | 'cancelled'
export type PlanKey = 'm1' | 'm6' | 'm12'

/** A prepaid term. Prices confirmed by the client: ₹1300 / ₹999 / ₹899 per month. */
export interface Plan {
  key: PlanKey
  name: string
  months: 1 | 6 | 12
  pricePerMonth: number
}

export const planTotal = (p: Plan) => p.pricePerMonth * p.months

export type PaymentStatus = 'pending' | 'paid' | 'revoked'

export interface Subscription {
  plan: PlanKey
  payment: PaymentStatus
  /** Set when admin marks Paid. endsAt = startedAt + plan.months. */
  startedAt?: string
  endsAt?: string
  /** When payment status last changed (revoke time starts the link grace period). */
  changedAt: string
}

/** Which customer photo picker a studio's galleries use. Admin-only; swipe ("light table") is off unless TTC turns it on. */
export type PickerVersion = 'normal' | 'swipe'

/** Per-customer feature switches. Studio.featureDefaults seeds new projects. */
export interface FeatureFlags {
  gallery: boolean
  poses: boolean
  invite: boolean
  portal: boolean
}

export const DEFAULT_FEATURES: FeatureFlags = { gallery: true, poses: true, invite: true, portal: true }

export interface Studio {
  id: string
  name: string
  slug: string
  ownerName: string
  phone: string
  whatsapp: string
  email?: string
  city: string
  /** Required at signup: data URL (≤ 256 px) or a remote URL. */
  logoUrl: string
  /** Hex colour used for buttons, hearts and accents in the client gallery. */
  accent: string
  /** Text burned into every proof, bottom-right. */
  watermark: string
  lang: 'en' | 'ta'
  defaultQuota: number
  /** Days the client has to submit, counted from when the gallery opens. */
  defaultWindowDays: number
  sub: Subscription
  /** Set by TTC admin only. Missing = 'normal'. (Optional so older saved studios and fixtures stay valid; the store seeds it.) */
  pickerVersion?: PickerVersion
  /** Features new customers (projects) start with. Missing = DEFAULT_FEATURES. */
  featureDefaults?: FeatureFlags
  /** "Sign up as a photographer" banner on the client portal. Missing/false = hidden: customer pages carry no TTC copy. */
  portalBanner?: boolean
  createdAt: string
  /** Set on decline or cancel. The only status that is stored rather than derived. */
  cancelledAt?: string
  /** Set once onboarding is finished. */
  onboarded: boolean
  notes: string
}

export type EventStatus = 'draft' | 'uploading' | 'open' | 'submitted' | 'closed' | 'archived'

export interface Chapter {
  key: string
  name: string
  sort: number
}

export interface StudioEvent {
  id: string
  studioId: string
  /** 8-character share code: /s/<code> */
  code: string
  pin?: string
  title: string
  date: string
  clientNames: string
  clientPhone: string
  lang: 'en' | 'ta'
  quota: number
  /** ISO date the client must submit by. */
  deadline: string
  status: EventStatus
  chapters: Chapter[]
  coverProofId?: string
  createdAt: string
  openedAt?: string
  submittedAt?: string
  reopenedAt?: string
  closedAt?: string
  archivedAt?: string
}

export interface Proof {
  id: string
  eventId: string
  chapter: string
  /** Original camera filename without extension, e.g. DSC_4821. The link to the RAW. */
  filename: string
  /** Original extension as uploaded: NEF, CR3, ARW, DNG, JPG… */
  ext: string
  /** raw = preview pulled from inside a RAW file; jpeg = a JPG the photographer exported. */
  source: 'raw' | 'jpeg'
  camera?: string
  /** Camera body serial from EXIF. Separates two bodies that both shoot IMG_0001. */
  serial?: string
  takenAt?: string
  w: number
  h: number
  /** Bytes of the stored ~1 MB preview. */
  bytes: number
  /** Bytes of the file on the photographer's disk (never uploaded). */
  originalBytes: number
  /** IndexedDB key of the preview blob (uploads made in this browser). */
  previewKey?: string
  thumbKey?: string
  /** Remote URL (seed data today, signed B2 URL once the server exists). */
  url?: string
  thumbUrl?: string
  sort: number
}

export interface Pick {
  proofId: string
  /** "Who is choosing?" name from the gate, optional. */
  by?: string
  note?: string
  at: string
}

export type ActivityKind = 'created' | 'uploaded' | 'shared' | 'opened' | 'selected' | 'submitted' | 'reopened' | 'closed' | 'exported' | 'archived'

export interface Activity {
  id: string
  eventId: string
  kind: ActivityKind
  at: string
  meta?: string
}

export type DriveStatus = 'ok' | 'missing' | 'retired'

export interface Drive {
  id: string
  studioId: string
  label: string
  /** UUID written to .tce-drive.json in the drive root on first scan. */
  markerId: string
  capacityBytes?: number
  usedBytes: number
  /** Where the drive physically lives: "shelf 2, red case". */
  kept: string
  notes: string
  lastScanAt?: string
  fileCount: number
  photoCount: number
  videoCount: number
  rawCount: number
  status: DriveStatus
  createdAt: string
}

export type AssetKind = 'photo' | 'raw' | 'video' | 'other'

/** One file on a drive. Stored in IndexedDB (too many for localStorage), keyed by id. */
export interface Asset {
  id: string
  driveId: string
  /** Path from the drive root, forward slashes, e.g. 2026/Sharma wedding/RAW/DSC_4821.NEF */
  path: string
  filename: string
  ext: string
  kind: AssetKind
  bytes: number
  modifiedAt: string
  takenAt?: string
  camera?: string
  serial?: string
  lens?: string
  w?: number
  h?: number
  durationSec?: number
  codec?: string
  /** size + SHA-1 of the first 1 MB, hex. Finds the same file on two drives. */
  fingerprint?: string
  /** Top-level event folder guessed from the path. */
  folder?: string
}

export interface Scan {
  id: string
  driveId: string
  at: string
  added: number
  removed: number
  changed: number
  durationSec: number
}

/** One paid term, written when TTC admin marks a studio Paid. Printable as a receipt. */
export interface StudioTerm {
  id: string
  studioId: string
  plan: PlanKey
  amount: number
  from: string
  to: string
  paidAt: string
  mode: 'upi' | 'cash' | 'bank'
  note: string
}

export interface StudioMessage {
  id: string
  studioId: string
  to: string
  body: string
  template: 'paid' | 'reminder' | 'revoked' | 'custom'
  at: string
}

export type StudioSession = { studioId: string; phone: string; viewAsAdmin?: boolean } | null
