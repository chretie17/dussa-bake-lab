import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import HeroCake from '../components/HeroCake'
import { Button } from '../components/ui'
import { BRAND } from '../data/site'

export default function Hero() {
  const reduceMotion = useReducedMotion()

  const entrance = (delay = 0) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 22 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.85, delay, ease: [0.22, 1, 0.36, 1] },
  })

  return (
    <section
      aria-labelledby="home-hero-title"
      className="relative isolate min-h-[100svh] overflow-hidden bg-[#21120c] text-white"
    >
      {/* Moving bakery footage fills the hero. A cake photograph loads first. */}
      <HeroCake />

      {/* A gentle vignette preserves legibility without hiding the motion. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-[#180d08]/15 via-[#180d08]/55 to-[#180d08]/95 lg:bg-gradient-to-r lg:from-[#180d08]/95 lg:via-[#180d08]/70 lg:to-[#180d08]/25"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_75%_17%,transparent_12%,rgba(14,7,4,0.30)_100%)]"
      />

      <div className="container-x relative z-10 flex min-h-[100svh] flex-col justify-end pb-36 pt-[min(43svh,410px)] sm:pb-32 md:pb-36 lg:min-h-[min(900px,100svh)] lg:justify-center lg:pt-44">
        <div className="max-w-[740px]">
          <motion.p
            {...entrance(0.12)}
            className="eyebrow mb-7 flex items-center gap-3 text-[#f3c996]"
          >
            <span aria-hidden="true" className="h-px w-10 bg-[#f3c996]/80" />
            {BRAND.city}, {BRAND.country} · Est. {BRAND.founded}
          </motion.p>

          <h1
            id="home-hero-title"
            className="font-display text-[clamp(2.8rem,8vw,6.6rem)] font-normal leading-[1.05] tracking-[-0.045em] text-white [text-shadow:0_4px_40px_rgba(0,0,0,0.25)]"
          >
            <motion.span {...entrance(0.25)} className="block italic">
              Bring the people.
            </motion.span>
            <motion.span {...entrance(0.43)} className="mt-1 block">
              We'll bring the <span className="italic text-[#edc18b]">cake.</span>
            </motion.span>
          </h1>

          <motion.p
            {...entrance(0.68)}
            className="mt-8 max-w-lg text-[clamp(1rem,2.1vw,1.2rem)] leading-relaxed text-white/85"
          >
            Birthday coming up? Planning a wedding? Or just craving something sweet?
            Tell us what you have in mind. We bake to order here in Kigali.
          </motion.p>

          <motion.div
            {...entrance(0.83)}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Button to="/order" variant="gold" size="lg" sheen>
              Order your cake
              <ArrowRight
                size={17}
                strokeWidth={2}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Button>
            <Button to="/creations" variant="outlineLight" size="lg">
              Explore the menu
            </Button>
          </motion.div>

          <motion.div
            {...entrance(1.02)}
            className="mt-11 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/20 pt-5 text-[0.75rem] uppercase tracking-[0.16em] text-white/75"
          >
            <span>Cakes & cupcakes</span>
            <span aria-hidden="true" className="h-1 w-1 rounded-full bg-[#edc18b]" />
            <span>Made to order in Kigali</span>
          </motion.div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-8 left-8 z-10 hidden items-center gap-3 text-[0.65rem] uppercase tracking-[0.2em] text-white/65 lg:flex"
      >
        <span className="h-10 w-px bg-gradient-to-t from-white/80 to-transparent" />
        Scroll to discover
      </div>
    </section>
  )
}
