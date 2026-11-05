import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { ReactLenis } from 'lenis/react'
import { MotionConfig } from 'motion/react'
import { LangSync, RequireAdmin, RequireClient, SiteLayout, Toaster } from './components/layout/Shell'
import { LanguageCurtain } from './components/layout/LanguageCurtain'

import Home from './pages/Home'
import Gallery from './pages/Gallery'
import Story from './pages/Story'
import GalleryRoute from './saas/client/GalleryRoute'
import Services from './pages/Services'
import About from './pages/About'
import Contact from './pages/Contact'
import { Privacy, Terms } from './pages/Legal'
import NotFound from './pages/NotFound'
import Landing, { DistrictRedirect, PhotographyIndex } from './pages/Landing'
// Booking, dashboard and login aren't prerendered, so they load on demand and
// keep the first download small for phones landing on the public pages.
const Login = lazy(() => import('./pages/Login'))

const BookLayout = lazy(() => import('./pages/book/BookLayout'))
const BookDistrict = lazy(() => import('./pages/book/District'))
const BookEvent = lazy(() => import('./pages/book/Event'))
const BookVenue = lazy(() => import('./pages/book/Venue'))
const BookPackage = lazy(() => import('./pages/book/Package'))
const BookDetails = lazy(() => import('./pages/book/Details'))
const BookConfirmed = lazy(() => import('./pages/book/Confirmed'))

const DashboardLayout = lazy(() => import('./pages/dashboard/DashboardLayout'))
const DashOverview = lazy(() => import('./pages/dashboard/Overview'))
const DashTrack = lazy(() => import('./pages/dashboard/Track'))
const DashPhotos = lazy(() => import('./pages/dashboard/Photos'))
const DashAlbum = lazy(() => import('./pages/dashboard/Album'))
const DashEAlbum = lazy(() => import('./pages/dashboard/EAlbum'))
const DashBilling = lazy(() => import('./pages/dashboard/Billing'))
const DashReview = lazy(() => import('./pages/dashboard/Review'))
const DashPoses = lazy(() => import('./pages/dashboard/Poses'))

// Admin is a separate app for staff only, so it's split out of the public bundle.
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminOverview = lazy(() => import('./pages/admin/Overview'))
const AdminOrders = lazy(() => import('./pages/admin/Orders'))
const AdminOrderDetail = lazy(() => import('./pages/admin/OrderDetail'))
const AdminTeam = lazy(() => import('./pages/admin/Team'))
const AdminCms = lazy(() => import('./pages/admin/Cms'))
const AdminMessages = lazy(() => import('./pages/admin/Messages'))
const AdminLeads = lazy(() => import('./pages/admin/Leads'))
const InvitePage = lazy(() => import('./pages/invite/Invite'))
// Lazy: the builder pulls in the invite page for its live preview.
const DashInvite = lazy(() => import('./pages/dashboard/Invite'))
const AdminShowroom = lazy(() => import('./pages/admin/Showroom'))
const AdminPoses = lazy(() => import('./pages/admin/Poses'))
const AdminShotList = lazy(() => import('./pages/admin/Poses').then(m => ({ default: m.ShotList })))
const AdminServer = lazy(() => import('./pages/admin/Server'))
const AdminBilling = lazy(() => import('./pages/admin/Billing'))
const AdminStudios = lazy(() => import('./pages/admin/photographers/Studios'))
const AdminStudioDetail = lazy(() => import('./pages/admin/photographers/StudioDetail'))
const AdminApprovals = lazy(() => import('./pages/admin/photographers/Approvals'))
const AdminPlans = lazy(() => import('./pages/admin/photographers/Plans'))
const AdminCustomerDetail = lazy(() => import('./pages/admin/photographers/CustomerDetail'))

// Photographer section (src/saas): own layouts, outside the TTC site chrome.
const ForPhotographers = lazy(() => import('./saas/studio/Landing'))
const ForPhotographersService = lazy(() => import('./saas/studio/ServicePage'))
const StudioLogin = lazy(() => import('./saas/studio/StudioLogin'))
const StudioLayout = lazy(() => import('./saas/studio/StudioLayout'))
const StudioOnboarding = lazy(() => import('./saas/studio/Onboarding'))
const StudioEventNew = lazy(() => import('./saas/studio/EventNew'))
const StudioEventDetail = lazy(() => import('./saas/studio/EventDetail'))
const StudioAccount = lazy(() => import('./saas/studio/Account'))
const StudioDrives = lazy(() => import('./saas/drives/Drives'))
const StudioDriveSearch = lazy(() => import('./saas/drives/Search'))
const StudioDriveDetail = lazy(() => import('./saas/drives/DriveDetail'))
const OsDashboard = lazy(() => import('./saas/os/screens/Dashboard'))
const OsProjects = lazy(() => import('./saas/os/screens/Projects'))
const OsProjectEditor = lazy(() => import('./saas/os/screens/ProjectEditor'))
const OsPostProduction = lazy(() => import('./saas/os/screens/PostProduction'))
const OsProfile = lazy(() => import('./saas/os/screens/Profile'))
const OsHow = lazy(() => import('./saas/os/screens/How'))
const ClientGallery = lazy(() => import('./saas/client/ClientGallery'))
const PoseChooser = lazy(() => import('./saas/poses/PoseChooser'))
const ClientPortal = lazy(() => import('./saas/portal/Portal'))
const AdminBillingDetail = lazy(() => import('./pages/admin/Billing').then(m => ({ default: m.BillingDetail })))

/** Blank placeholder while a lazy page loads. */
const Lazy = ({ children }: { children: ReactNode }) => <Suspense fallback={<div className="min-h-[60svh]" />}>{children}</Suspense>

const adminFallback = <div className="min-h-screen bg-ink" />

export default function App() {
  return (
    <ReactLenis root options={{ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true }}>
      <MotionConfig reducedMotion="user">
        <LangSync />
        <Routes>
          <Route element={<SiteLayout />}>
            <Route index element={<Home />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="services" element={<Services />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="terms" element={<Terms />} />
            <Route path="privacy" element={<Privacy />} />
            <Route path="photography" element={<PhotographyIndex />} />
            <Route path="photography/:district" element={<DistrictRedirect />} />
            <Route path="photography/:district/:event" element={<Landing />} />
            <Route path="login" element={<Lazy><Login /></Lazy>} />
            <Route path="for-photographers" element={<Lazy><ForPhotographers /></Lazy>} />
            <Route path="for-photographers/:service" element={<Lazy><ForPhotographersService /></Lazy>} />

            <Route path="book" element={<Lazy><BookLayout /></Lazy>}>
              <Route index element={<Lazy><BookDistrict /></Lazy>} />
              <Route path="event" element={<Lazy><BookEvent /></Lazy>} />
              <Route path="venue" element={<Lazy><BookVenue /></Lazy>} />
              <Route path="package" element={<Lazy><BookPackage /></Lazy>} />
              <Route path="details" element={<Lazy><BookDetails /></Lazy>} />
              <Route path="confirmed/:id" element={<Lazy><BookConfirmed /></Lazy>} />
            </Route>

            <Route path="dashboard" element={<RequireClient><Lazy><DashboardLayout /></Lazy></RequireClient>}>
              <Route index element={<Lazy><DashOverview /></Lazy>} />
              <Route path="poses" element={<Lazy><DashPoses /></Lazy>} />
              <Route path="track" element={<Lazy><DashTrack /></Lazy>} />
              <Route path="photos" element={<Lazy><DashPhotos /></Lazy>} />
              <Route path="album" element={<Lazy><DashAlbum /></Lazy>} />
              <Route path="album/view" element={<Lazy><DashEAlbum /></Lazy>} />
              <Route path="billing" element={<Lazy><DashBilling /></Lazy>} />
              <Route path="review" element={<Lazy><DashReview /></Lazy>} />
              <Route path="invite" element={<Lazy><DashInvite /></Lazy>} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>

          <Route path="i/:theme" element={<Suspense fallback={<div className="min-h-screen bg-[#0b0d14]" />}><InvitePage /></Suspense>} />
          {/* /gallery/:slug: a customer gallery code opens ClientGallery; otherwise SiteLayout renders the Story child. */}
          <Route path="gallery/:slug" element={<GalleryRoute />}>
            <Route index element={<Story />} />
          </Route>
          <Route path="s/:code" element={<Lazy><ClientGallery /></Lazy>} />
          <Route path="poses/:code" element={<Lazy><PoseChooser /></Lazy>} />
          <Route path="p/:code/*" element={<Lazy><ClientPortal /></Lazy>} />
          <Route path="studio/login" element={<Lazy><StudioLogin /></Lazy>} />
          <Route path="studio" element={<Lazy><StudioLayout /></Lazy>}>
            <Route index element={<Lazy><OsDashboard /></Lazy>} />
            <Route path="welcome" element={<Lazy><StudioOnboarding /></Lazy>} />
            <Route path="projects" element={<Lazy><OsProjects /></Lazy>} />
            <Route path="projects/:id" element={<Lazy><OsProjectEditor /></Lazy>} />
            <Route path="galleries" element={<Lazy><OsPostProduction /></Lazy>} />
            <Route path="events" element={<Navigate to="/studio/galleries" replace />} />
            <Route path="events/new" element={<Lazy><StudioEventNew /></Lazy>} />
            <Route path="events/:id" element={<Lazy><StudioEventDetail /></Lazy>} />
            <Route path="drives" element={<Lazy><StudioDrives /></Lazy>} />
            <Route path="drives/search" element={<Lazy><StudioDriveSearch /></Lazy>} />
            <Route path="drives/:id" element={<Lazy><StudioDriveDetail /></Lazy>} />
            <Route path="account" element={<Lazy><StudioAccount /></Lazy>} />
            <Route path="profile" element={<Lazy><OsProfile /></Lazy>} />
            <Route path="settings" element={<Navigate to="/studio" replace />} />
            <Route path="how" element={<Lazy><OsHow /></Lazy>} />
          </Route>
          <Route path="admin/login" element={<Suspense fallback={adminFallback}><AdminLogin /></Suspense>} />
          <Route path="admin" element={<RequireAdmin><Suspense fallback={adminFallback}><AdminLayout /></Suspense></RequireAdmin>}>
            <Route index element={<AdminOverview />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/:id" element={<AdminOrderDetail />} />
            <Route path="team" element={<AdminTeam />} />
            <Route path="cms" element={<AdminCms />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="leads" element={<AdminLeads />} />
            <Route path="poses" element={<AdminPoses />} />
            <Route path="poses/:id" element={<AdminShotList />} />
            <Route path="showroom" element={<AdminShowroom />} />
            <Route path="billing" element={<AdminBilling />} />
            <Route path="server" element={<AdminServer />} />
            <Route path="billing/:id" element={<AdminBillingDetail />} />
            <Route path="photographers" element={<AdminStudios />} />
            <Route path="photographers/approvals" element={<AdminApprovals />} />
            <Route path="photographers/plans" element={<AdminPlans />} />
            <Route path="photographers/:id" element={<AdminStudioDetail />} />
            <Route path="photographers/:id/customers/:code" element={<AdminCustomerDetail />} />
          </Route>
        </Routes>
        <LanguageCurtain />
        <Toaster />
      </MotionConfig>
    </ReactLenis>
  )
}
