import type { Bi } from '../../../lib/i18n'
import type { ProjectTab } from '../progress'
import type { ProjectStatus } from '../types'

/** Labels shared by the Studio OS screens. */

export const PROJECT_STATUS: Record<ProjectStatus, Bi> = {
  active: { en: 'Active', ta: 'செயலில்' },
  on_hold: { en: 'On hold', ta: 'நிறுத்தி வைக்கப்பட்டது' },
  post_production: { en: 'Post production', ta: 'பின்தயாரிப்பு' },
  delivered: { en: 'Delivered', ta: 'வழங்கப்பட்டது' },
  completed: { en: 'Completed', ta: 'முடிந்தது' },
  cancelled: { en: 'Cancelled', ta: 'ரத்து' },
}
export const PROJECT_STATUSES = Object.keys(PROJECT_STATUS) as ProjectStatus[]

export const TAB_LABEL: Record<ProjectTab, Bi> = {
  overview: { en: 'Overview', ta: 'மேலோட்டம்' },
  gallery: { en: 'Album selection', ta: 'ஆல்பத் தேர்வு' },
  poses: { en: 'Poses', ta: 'போஸ்கள்' },
}
