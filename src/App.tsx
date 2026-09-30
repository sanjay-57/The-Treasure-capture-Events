import { lazy, Suspense } from 'react'
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
import Login from './pages/Login'

import BookLayout from './pages/book/BookLayout'
import BookDistrict from './pages/book/District'
import BookEvent from './pages/book/Event'
import BookVenue from './pages/book/Venue'
import BookPackage from './pages/book/Package'
import BookDetails from './pages/book/Details'
import BookConfirmed from './pages/book/Confirmed'

import DashboardLayout from './pages/dashboard/DashboardLayout'
import DashOverview from './pages/dashboard/Overview'
import DashTrack from './pages/dashboard/Track'
import DashPhotos from './pages/dashboard/Photos'
import DashAlbum from './pages/dashboard/Album'
import DashBilling from './pages/dashboard/Billing'
import DashReview from './pages/dashboard/Review'

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
const AdminBilling = lazy(() => import('./pages/admin/Billing'))

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
            <Route path="login" element={<Login />} />

            <Route path="book" element={<BookLayout />}>
              <Route index element={<BookDistrict />} />
              <Route path="event" element={<BookEvent />} />
              <Route path="venue" element={<BookVenue />} />
              <Route path="package" element={<BookPackage />} />
              <Route path="details" element={<BookDetails />} />
              <Route path="confirmed/:id" element={<BookConfirmed />} />
            </Route>

            <Route path="dashboard" element={<RequireClient><DashboardLayout /></RequireClient>}>
              <Route index element={<DashOverview />} />
              <Route path="track" element={<DashTrack />} />
              <Route path="photos" element={<DashPhotos />} />
              <Route path="album" element={<DashAlbum />} />
              <Route path="billing" element={<DashBilling />} />
              <Route path="review" element={<DashReview />} />
            </Route>

            <Route path="*" element={<NotFound />} />
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
            <Route path="billing" element={<AdminBilling />} />
          </Route>
        </Routes>
        <LanguageCurtain />
        <Toaster />
      </MotionConfig>
    </ReactLenis>
  )
}
