import Hero from '../sections/Hero'
import CategoryShowcase from '../sections/CategoryShowcase'
import StorySection from '../sections/StorySection'
import Bestsellers from '../sections/Bestsellers'
import ProcessSection from '../sections/ProcessSection'
import OccasionFinder from '../sections/OccasionFinder'
import GalleryStrip from '../sections/GalleryStrip'
import Testimonials from '../sections/Testimonials'
import InfoCards from '../sections/InfoCards'
import CtaBanner from '../sections/CtaBanner'
import { Marquee } from '../components/ui'
import { MARQUEE_WORDS } from '../data/content'
import usePageMeta from '../lib/usePageMeta'

export default function Home() {
  usePageMeta({
    title: 'Dussa BakeLab — Handcrafted Cakes & Treats in Kigali',
    description:
      'Handcrafted cakes, cupcakes, cookies and custom creations baked to order in Kigali, Rwanda. Order online with delivery across the city.',
  })

  return (
    <>
      <Hero />
      <Marquee items={MARQUEE_WORDS} tone="light" duration={44} />
      <CategoryShowcase />
      <StorySection />
      <Bestsellers />
      <ProcessSection />
      <OccasionFinder />
      <GalleryStrip />
      <Testimonials />
      <InfoCards />
      <CtaBanner />
    </>
  )
}
