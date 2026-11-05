import type { Project } from './os/types'
import type { Drive, Pick, Proof, StudioEvent, StudioTerm } from './types'

/**
 * Tenant scoping for the /studio/* screens. Every list a photographer sees is
 * cut down to their own studioId here, so isolation.test.ts can assert it in
 * one place. Proofs and picks have no studioId: they belong to an event, and
 * only the studio's own events count.
 */

type WithStudio = { studioId: string }
export const ownedBy = <T extends WithStudio>(rows: readonly T[], studioId: string | undefined): T[] => (studioId ? rows.filter(r => r.studioId === studioId) : [])

export const projectsOf = (projects: readonly Project[], studioId: string | undefined) => ownedBy(projects, studioId)
export const eventsOf = (events: readonly StudioEvent[], studioId: string | undefined) => ownedBy(events, studioId)
export const drivesOf = (drives: readonly Drive[], studioId: string | undefined) => ownedBy(drives, studioId)
export const termsOf = (terms: readonly StudioTerm[], studioId: string | undefined) => ownedBy(terms, studioId)

export function proofsOf(proofs: readonly Proof[], events: readonly StudioEvent[], studioId: string | undefined): Proof[] {
  const ids = new Set(eventsOf(events, studioId).map(e => e.id))
  return proofs.filter(p => ids.has(p.eventId))
}

export function picksOf(picks: Readonly<Record<string, Pick[]>>, events: readonly StudioEvent[], studioId: string | undefined): Record<string, Pick[]> {
  const out: Record<string, Pick[]> = {}
  for (const e of eventsOf(events, studioId)) if (picks[e.id]) out[e.id] = picks[e.id]
  return out
}

/** A project's gallery, only when it belongs to the same studio. */
export const galleryOf = (p: Pick_<Project, 'galleryEventId' | 'studioId'>, events: readonly StudioEvent[]) =>
  p.galleryEventId ? events.find(e => e.id === p.galleryEventId && e.studioId === p.studioId) : undefined

type Pick_<T, K extends keyof T> = { [P in K]: T[P] }
