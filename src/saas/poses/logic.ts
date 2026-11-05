import type { EventKey } from '../../lib/data'
import type { InviteTheme } from '../../lib/invite'
import { poseById, posesFor, type Faith, type PoseDef } from '../../lib/poses'
import type { PosePlan } from '../os/types'

/** Pose ids from the library for an event: the common set plus the religion's ritual poses. */
export function poseSetFor(eventKey: EventKey, religion?: Faith): string[] {
  return posesFor(eventKey, religion ? [religion] : []).map(p => p.id)
}

/** Library poses in the plan's order, skipping ids the library no longer has. */
export function planPoses(plan: Pick<PosePlan, 'ids'>): PoseDef[] {
  return plan.ids.map(id => poseById(id)).filter((p): p is PoseDef => !!p)
}

export interface PoseProgress {
  total: number
  yes: number
  no: number
  answered: number
  left: number
  /** Every pose has an answer. */
  complete: boolean
}

export function poseProgress(plan: Pick<PosePlan, 'ids' | 'picks'>): PoseProgress {
  const ids = planPoses(plan).map(p => p.id)
  let yes = 0
  let no = 0
  for (const id of ids) {
    if (plan.picks[id] === 'yes') yes++
    else if (plan.picks[id] === 'no') no++
  }
  const answered = yes + no
  return { total: ids.length, yes, no, answered, left: ids.length - answered, complete: ids.length > 0 && answered === ids.length }
}

/** The shoot-day list: the poses the client said yes to, in the studio's order. */
export function shotList(plan: Pick<PosePlan, 'ids' | 'picks'>): PoseDef[] {
  return planPoses(plan).filter(p => plan.picks[p.id] === 'yes')
}

/** Moves one id up (-1) or down (+1); unchanged at the ends. */
export function moveId(ids: string[], id: string, dir: -1 | 1): string[] {
  const i = ids.indexOf(id)
  const j = i + dir
  if (i < 0 || j < 0 || j >= ids.length) return ids
  const out = [...ids]
  ;[out[i], out[j]] = [out[j], out[i]]
  return out
}

/**
 * Invite designs suggested for a customer's religion. ❓ Content decision for
 * the client: a sensible default until they confirm the mapping. No religion = all.
 */
export const INVITE_THEMES_FOR: Record<Faith, InviteTheme[]> = {
  hindu: ['kolam', 'marigold', 'jasmine', 'pattu', 'turmeric', 'lamp', 'kanjivaram', 'rangoli', 'athangudi', 'lotus'],
  christian: ['ivory', 'rose', 'blush', 'mono', 'deco', 'aurora', 'terrazzo'],
  muslim: ['emerald', 'moonlit', 'lantern', 'paisley', 'seigaiha', 'mono'],
}
