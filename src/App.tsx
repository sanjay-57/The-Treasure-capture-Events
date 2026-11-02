import { lazy, Suspense, type ReactNode } from 'react'
import { Route, Routes } from 'react-router'
import { ReactLenis } from 'lenis/react'
import { MotionConfig } from 'motion/react'
import { LangSync, RequireAdmin, RequireClient, SiteLayout, Toaster } from './components/layout/Shell'
import { LanguageCurtain } from './components/layout/LanguageCurtain'

import Home from './pages/Home'
import Gallery from './pages/Gallery'
import Story from './pages/Story'
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
const DashBilling = lazy(() => import('./pages/dashboard/Billing'))
const DashReview = lazy(() => import('./pages/dashboard/Review'))

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
const AdminBilling = lazy(() => import('./pages/admin/Billing'))
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
            <Route path="gallery/:slug" element={<Story />} />
            <Route path="services" element={<Services />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="terms" element={<Terms />} />
            <Route path="privacy" element={<Privacy />} />
            <Route path="photography" element={<PhotographyIndex />} />
            <Route path="photography/:district" element={<DistrictRedirect />} />
            <Route path="photography/:district/:event" element={<Landing />} />
            <Route path="login" element={<Lazy><Login /></Lazy>} />

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
              <Route path="track" element={<Lazy><DashTrack /></Lazy>} />
              <Route path="photos" element={<Lazy><DashPhotos /></Lazy>} />
              <Route path="album" element={<Lazy><DashAlbum /></Lazy>} />
              <Route path="billing" element={<Lazy><DashBilling /></Lazy>} />
              <Route path="review" element={<Lazy><DashReview /></Lazy>} />
              <Route path="invite" element={<Lazy><DashInvite /></Lazy>} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>

          <Route path="i/:theme" element={<Suspense fallback={<div className="min-h-screen bg-[#0b0d14]" />}><InvitePage /></Suspense>} />
          <Route path="admin/login" element={<Suspense fallback={adminFallback}><AdminLogin /></Suspense>} />
          <Route path="admin" element={<RequireAdmin><Suspense fallback={adminFallback}><AdminLayout /></Suspense></RequireAdmin>}>
            <Route index element={<AdminOverview />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/:id" element={<AdminOrderDetail />} />
            <Route path="team" element={<AdminTeam />} />
            <Route path="cms" element={<AdminCms />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="leads" element={<AdminLeads />} />
            <Route path="showroom" element={<AdminShowroom />} />
            <Route path="billing" element={<AdminBilling />} />
            <Route path="billing/:id" element={<AdminBillingDetail />} />
          </Route>
        </Routes>
        <LanguageCurtain />
        <Toaster />
      </MotionConfig>
    </ReactLenis>
  )
}
