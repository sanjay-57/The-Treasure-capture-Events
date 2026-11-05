import { lazy, Suspense } from 'react'
import { useParams } from 'react-router'
import { SiteLayout } from '../../components/layout/Shell'
import { resolveGalleryCode } from '../links'
import { useOsStore } from '../os/store'
import { useStudioStore } from '../store'

const ClientGallery = lazy(() => import('./ClientGallery'))

/**
 * /gallery/:slug is shared by the TTC story pages and photographer customer
 * galleries. A project or event code opens the white-labelled gallery outside
 * the TTC layout; anything else renders SiteLayout, whose outlet is this
 * route's index child (the Story page). Order codes are 8 lowercase
 * alphanumerics and story slugs are hyphenated words, so they don't collide.
 */
export default function GalleryRoute() {
  const { slug = '' } = useParams()
  const projects = useOsStore(s => s.projects)
  const events = useStudioStore(s => s.events)
  if (!resolveGalleryCode(slug, projects, events)) return <SiteLayout />
  return (
    <Suspense fallback={<div className="min-h-[100svh] bg-white" />}>
      <ClientGallery />
    </Suspense>
  )
}
