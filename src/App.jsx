import { Suspense, lazy } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CartProvider } from './context/CartContext'
import { CatalogProvider } from './context/CatalogContext'
import { ThemeProvider } from './context/ThemeContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import CartDrawer from './components/CartDrawer'
import FloatingActions from './components/FloatingActions'
import ScrollToTop from './components/ScrollToTop'
import { BrandMark } from './components/BrandMark'

import Home from './pages/Home'

const Creations = lazy(() => import('./pages/Creations'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const OrderFlow = lazy(() => import('./pages/OrderFlow'))
const Confirmation = lazy(() => import('./pages/Confirmation'))
const TrackOrder = lazy(() => import('./pages/TrackOrder'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const Admin = lazy(() => import('./pages/Admin'))
const NotFound = lazy(() => import('./pages/NotFound'))

function PageLoader() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <BrandMark className="h-14 w-14 animate-drift" tone="var(--color-espresso)" accent="var(--color-accent)" />
        <p className="eyebrow text-caramel">Warming the oven</p>
      </div>
    </div>
  )
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
      >
        <Suspense fallback={<PageLoader />}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/creations" element={<Creations />} />
            <Route path="/creations/:slug" element={<ProductDetail />} />
            <Route path="/order" element={<OrderFlow />} />
            <Route path="/order/confirmed/:code" element={<Confirmation />} />
            <Route path="/track" element={<TrackOrder />} />
            <Route path="/track/:code" element={<TrackOrder />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </motion.main>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <CatalogProvider>
      <CartProvider>
      <ScrollToTop />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-espresso focus:px-5 focus:py-3 focus:text-cream"
      >
        Skip to content
      </a>
      <Navbar />
      <div id="main">
        <AnimatedRoutes />
      </div>
      <Footer />
      <CartDrawer />
      <FloatingActions />
      </CartProvider>
      </CatalogProvider>
    </ThemeProvider>
  )
}
