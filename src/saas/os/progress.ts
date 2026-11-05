import type { EventStatus } from '../types'
import { WORK_STAGES, type Project, type WorkStage } from './types'

/** Which editor tabs count as finished (the ✓ on each tab). Pure, shared by panel and tests. */
export type ProjectTab = 'overview' | 'gallery' | 'poses'

export const PROJECT_TABS: ProjectTab[] = ['overview', 'gallery', 'poses']

/** Facts from other stores a tab's ✓ depends on. */
export interface TabCtx {
  /** Status of the project's gallery event, if it has one. */
  galleryStatus?: EventStatus
}

export function tabDone(p: Project, tab: ProjectTab, ctx: TabCtx = {}): boolean {
  switch (tab) {
    case 'overview':
      return !!(p.name.trim() && p.clientNames.trim() && p.phone.trim())
    case 'gallery':
      return ctx.galleryStatus === 'submitted' || ctx.galleryStatus === 'closed'
    case 'poses':
      return !!p.poses?.submittedAt
  }
}

/** `to` if it is further along than `cur`, else `cur`: client submits never move a project backwards. */
export function advanceStage(cur: WorkStage | undefined, to: WorkStage): WorkStage {
  const i = WORK_STAGES.indexOf(cur ?? 'booked')
  return WORK_STAGES.indexOf(to) > i ? to : (cur ?? 'booked')
}
