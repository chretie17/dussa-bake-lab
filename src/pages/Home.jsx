import Hero from '../sections/Hero'
import CategoryShowcase from '../sections/CategoryShowcase'
import StorySection from '../sections/StorySection'
import Bestsellers from '../sections/Bestsellers'
import ProcessSection from '../sections/ProcessSection'
import OccasionFinder from '../sections/OccasionFinder'
import GalleryStrip from '../sections/GalleryStrip'
import InfoCards from '../sections/InfoCards'
import CtaBanner from '../sections/CtaBanner'
import { Marquee } from '../components/ui'
import { MARQUEE_WORDS } from '../data/content'
import usePageMeta from '../lib/usePageMeta'

export default function Home() {
  usePageMeta({
    title: 'Dussa BakeLab — Cakes & Treats in Kigali',
    description:
      'Order cakes, cupcakes and sweet treats from Dussa BakeLab in Kigali. Choose your favourites or ask about a custom cake.',
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
      <InfoCards />
      <CtaBanner />
    </>
  )
}
