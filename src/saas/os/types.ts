/**
 * Studio OS: the photographer's day-to-day workspace (projects, schedule,
 * quote, payments, contract, deliverables, gallery, poses) and the client
 * portal their couple opens at /p/<code>. Lives beside the album selector and
 * drives manager in src/saas; nothing here imports TTC order data.
 */

import type { EventKey } from '../../lib/data'
import type { Faith } from '../../lib/poses'
import type { FeatureFlags, PickerVersion } from '../types'

export type ProjectStatus = 'active' | 'on_hold' | 'post_production' | 'delivered' | 'completed' | 'cancelled'

export interface ProjectEvent {
  id: string
  name: string
  date: string
  time: string
  venue: string
  /** Google Maps link. Missing → the client portal asks the couple for one. */
  mapsUrl?: string
  note?: string
}

export interface QuoteLine {
  id: string
  label: string
  qty: number
  /** ₹ per unit, whole rupees. */
  rate: number
}

export interface Quote {
  lines: QuoteLine[]
  /** Flat ₹ discount before tax. */
  discount: number
  taxOn: boolean
  /** GST %, 18 by default. */
  taxPct: number
}

/**
 * How a milestone's amount is worked out, in schedule order:
 * - pct: that % of the total with tax
 * - amount: a fixed ₹ amount
 * - upto: whatever brings the running total up to that % (e.g. "Balance to 50%")
 * - rest: everything still left (normally the last milestone)
 */
export type MilestoneMode = 'pct' | 'amount' | 'upto' | 'rest'

export interface Milestone {
  id: string
  label: string
  mode: MilestoneMode
  value: number
  dueDate?: string
}

export type PayMode = 'upi' | 'cash' | 'bank' | 'card' | 'cheque'

export interface ProjectPayment {
  id: string
  amount: number
  mode: PayMode
  at: string
  ref?: string
  note?: string
}

export type DeliverableStatus = 'not_started' | 'in_progress' | 'ready' | 'delivered'

export interface Deliverable {
  id: string
  label: string
  /** What was promised, as shown: "Unlimited", "300 edited", "5–7 min", "No limit", "60 s". */
  spec: string
  /** Items to make, when countable (e.g. 5 reels); null when not. */
  total: number | null
  done: number
  status: DeliverableStatus
  dueDate?: string
  /** Album selector gallery that feeds this deliverable, if any. */
  galleryEventId?: string
}

export interface Contract {
  /** Standard template text; {{client}}, {{studio}}, {{total}} are filled in when shown. */
  body: string
  extraTerms: string
  sentAt?: string
  acceptedAt?: string
  acceptedBy?: string
}

export interface MoodImage {
  id: string
  /** IndexedDB key in the 'previews' store. */
  key: string
  name: string
  by: 'client' | 'studio'
  at: string
}

export interface Moodboard {
  pinterestUrl?: string
  notes: string
  images: MoodImage[]
}

export type RequestStatus = 'open' | 'in_progress' | 'done'

export interface ClientRequest {
  id: string
  text: string
  deliverableId?: string
  status: RequestStatus
  at: string
  reply?: string
  repliedAt?: string
}

export interface ProjectDoc {
  id: string
  name: string
  url: string
  at: string
}

/** Where the work stands, shown to the client as a stepper. Moves forward only on its own (submit); the studio can set any stage. */
export type WorkStage = 'booked' | 'shoot_done' | 'culling' | 'selection_sent' | 'selection_received' | 'editing' | 'album_design' | 'delivered'
export const WORK_STAGES: WorkStage[] = ['booked', 'shoot_done', 'culling', 'selection_sent', 'selection_received', 'editing', 'album_design', 'delivered']

export type PoseAnswer = 'yes' | 'no'

/** Poses the studio sends the client to rate before the shoot (/poses/<code>). Ids are lib/poses POSES ids, in the studio's order. */
export interface PosePlan {
  faiths: Faith[]
  eventKey: EventKey
  ids: string[]
  sentAt?: string
  picks: Record<string, PoseAnswer>
  submittedAt?: string
}

export interface Project {
  id: string
  studioId: string
  /** Client portal: /p/<code>, gated by a 4-digit PIN. */
  code: string
  pin: string
  status: ProjectStatus
  name: string
  type: string
  clientNames: string
  /** Name the portal greets: "Welcome, Divya". */
  greetName: string
  phone: string
  email?: string
  externalLink?: string
  events: ProjectEvent[]
  quote: Quote
  deliverables: Deliverable[]
  milestones: Milestone[]
  payments: ProjectPayment[]
  contract: Contract
  moodboard: Moodboard
  requests: ClientRequest[]
  documents: ProjectDoc[]
  whatsappGroup?: string
  /** Album selector event linked to this project (src/saas/types StudioEvent id). Created with the project; optional only for older saved data. */
  galleryEventId?: string
  /** Free text, e.g. "Chettinad traditional"; shown under the title on the gallery and poses pages. */
  theme: string
  /** Drives posesFor() and the suggested invite themes. */
  religion?: Faith
  /** Copied from studio.featureDefaults at creation. */
  features: FeatureFlags
  /** TTC admin only; undefined = use studio.pickerVersion. */
  pickerOverride?: PickerVersion
  stage: WorkStage
  poses?: PosePlan
  createdAt: string
  updatedAt: string
}
