import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import HeroCake from '../components/HeroCake'
import { Button } from '../components/ui'
import { BRAND } from '../data/site'

export default function Hero() {
  const reduceMotion = useReducedMotion()

  const entrance = (delay = 0) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 1, delay, ease: [0.22, 1, 0.36, 1] },
  })

  return (
    <section
      aria-labelledby="home-hero-title"
      className="relative isolate min-h-[100svh] overflow-hidden bg-[#1a0e09] text-white"
    >
      <HeroCake>
        {(filmControls) => (
          <>
            {/* Shade, in three layers: the top so the navbar reads over moving
                footage, the reading side so the headline does, and a soft
                vignette so the frame feels lit rather than cropped. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-44 bg-gradient-to-b from-[#120905]/70 to-transparent"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-transparent via-[#120905]/60 to-[#120905]/95 md:bg-gradient-to-r md:from-[#120905]/88 md:via-[#120905]/50 md:to-[#120905]/5"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_70%_45%,transparent_35%,rgba(10,5,3,0.55)_100%)]"
            />

            <div className="container-x relative z-10 flex min-h-[100svh] flex-col justify-end pb-10 pt-[min(46svh,420px)] md:justify-center md:pb-12 md:pt-32">
              <div className="max-w-[44rem]">
                <motion.p
                  {...entrance(0.1)}
                  className="eyebrow mb-6 flex items-center gap-3 text-[#e9c08f] md:mb-8"
                >
                  <span aria-hidden="true" className="h-px w-10 bg-[#e9c08f]/70" />
                  {BRAND.city}, {BRAND.country} · Est. {BRAND.founded}
                </motion.p>

                <h1
                  id="home-hero-title"
                  className="font-display text-[clamp(2.6rem,7.2vw,6rem)] font-light leading-[1.04] tracking-[-0.025em] text-white [text-shadow:0_2px_30px_rgba(0,0,0,0.35)]"
                >
                  <motion.span {...entrance(0.22)} className="block italic">
                    Bring the people.
                  </motion.span>
                  <motion.span {...entrance(0.38)} className="block">
                    We’ll bring the <span className="italic text-[#e9c08f]">cake.</span>
                  </motion.span>
                </h1>

                <motion.p
                  {...entrance(0.6)}
                  className="mt-7 max-w-[30rem] text-[clamp(1rem,1.6vw,1.125rem)] leading-[1.7] text-white/80 md:mt-8"
                >
                  Birthday coming up? Planning a wedding? Or just craving something sweet? Tell us
                  what you have in mind. We bake to order here in Kigali.
                </motion.p>

                <motion.div {...entrance(0.75)} className="mt-9 flex flex-wrap items-center gap-3">
                  <Button to="/order" variant="gold" size="lg" sheen>
                    Order your cake
                    <ArrowRight
                      size={17}
                      strokeWidth={2}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </Button>
                  <Button
                    to="/creations"
                    variant="outlineLight"
                    size="lg"
                    className="!border-white/40 !text-white hover:!bg-white/10"
                  >
                    Explore the menu
                  </Button>
                </motion.div>
              </div>

              {/* One quiet baseline across the bottom: what we make on the
                  left, the film's own control on the right — part of the
                  layout, not chips floating over the footage. */}
              <motion.div
                {...entrance(0.95)}
                className="mt-12 flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-t border-white/15 pt-5 md:mt-16"
              >
                <div className="flex flex-col gap-2 text-[0.7rem] uppercase tracking-[0.18em] text-white/65 sm:flex-row sm:items-center sm:gap-5">
                  <span>Cakes & cupcakes</span>
                  <span aria-hidden="true" className="hidden h-1 w-1 rounded-full bg-[#e9c08f] sm:block" />
                  <span>Made to order in Kigali</span>
                </div>
                {filmControls}
              </motion.div>
            </div>
          </>
        )}
      </HeroCake>
    </section>
  )
}
