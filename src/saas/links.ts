import type { Project } from './os/types'
import type { Studio, StudioEvent } from './types'

/**
 * Customer links for one project. One code (Project.code) opens all three:
 * /gallery/<code> (album selection), /poses/<code> (pose chooser), /p/<code> (portal).
 * Every share text carries the studio's name only.
 */

const origin = () => (typeof window !== 'undefined' ? window.location.origin : '')

export const galleryLink = (code: string) => `${origin()}/gallery/${code}`
export const posesLink = (code: string) => `${origin()}/poses/${code}`
export const portalLink = (code: string) => `${origin()}/p/${code}`

export type LinkKind = 'gallery' | 'poses' | 'portal'

const LINK: Record<LinkKind, (code: string) => string> = { gallery: galleryLink, poses: posesLink, portal: portalLink }

const TEXT: Record<LinkKind, { en: string; ta: string }> = {
  gallery: { en: 'Hi {name}! Your photos are ready. Please choose your favourites for the album here:', ta: 'வணக்கம் {name}! உங்கள் படங்கள் தயார். ஆல்பத்துக்குப் பிடித்தவற்றை இங்கே தேர்வு செய்யுங்கள்:' },
  poses: { en: 'Hi {name}! Please tell us which poses you like before the shoot:', ta: 'வணக்கம் {name}! படப்பிடிப்புக்கு முன் உங்களுக்குப் பிடித்த போஸ்களைச் சொல்லுங்கள்:' },
  portal: { en: 'Hi {name}! Your project page, with schedule, payments and deliverables:', ta: 'வணக்கம் {name}! அட்டவணை, கட்டணம், வழங்கல்களுடன் உங்கள் திட்டப் பக்கம்:' },
}

/** WhatsApp message for a customer link, in the studio's language, signed by the studio. */
export function whatsappShare(studio: Pick<Studio, 'name' | 'lang'>, project: Pick<Project, 'code' | 'pin' | 'greetName' | 'clientNames'>, kind: LinkKind, lang: 'en' | 'ta' = studio.lang): string {
  return [TEXT[kind][lang].replace('{name}', project.greetName || project.clientNames), LINK[kind](project.code), `PIN: ${project.pin}`, `— ${studio.name}`].join('\n')
}

export interface GalleryHit {
  /** Set when the code is a project code (or the event is linked to a project). */
  project?: Project
  /** Undefined when the project has no gallery yet. */
  event?: StudioEvent
}

/**
 * /gallery/:code and /s/:code. A project code wins; a legacy event share code
 * (e.g. demo4821) still opens its gallery. null = not ours, so /gallery/<slug>
 * falls through to the TTC story page.
 */
export function resolveGalleryCode(raw: string, projects: readonly Project[], events: readonly StudioEvent[]): GalleryHit | null {
  const code = raw.trim().toLowerCase()
  if (!code) return null
  const project = projects.find(p => p.code === code)
  if (project) return { project, event: project.galleryEventId ? events.find(e => e.id === project.galleryEventId && e.studioId === project.studioId) : undefined }
  const event = events.find(e => e.code === code)
  if (event) return { event, project: projects.find(p => p.galleryEventId === event.id && p.studioId === event.studioId) }
  return null
}

/** Project for a /poses/:code link. */
export const resolvePosesCode = (raw: string, projects: readonly Project[]) => projects.find(p => p.code === raw.trim().toLowerCase())
