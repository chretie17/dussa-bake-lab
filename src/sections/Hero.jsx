import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
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
        {({ controls }) => (
          <>
            {/* Shade, in three layers: the top so the navbar reads over moving
                footage, the reading side so the headline does, and a soft
                vignette so the frame feels lit rather than cropped. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-36 bg-gradient-to-b from-[#120905]/75 to-transparent md:h-44"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-transparent from-30% via-[#120905]/70 via-55% to-[#120905] md:bg-gradient-to-r md:from-[#120905]/88 md:from-0% md:via-[#120905]/50 md:via-50% md:to-[#120905]/5"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_70%_40%,transparent_35%,rgba(10,5,3,0.5)_100%)]"
            />

            {/* The copy column spans the whole hero, so it lets taps through to
                the film behind it; only its actual content takes them. */}
            <div
              className="container-x pointer-events-none relative z-10 flex min-h-[100svh] flex-col justify-end pb-10 pt-[min(48svh,440px)] md:justify-center md:pb-12 md:pt-32"
            >
              <div className="pointer-events-auto max-w-[44rem]">
                <motion.p
                  {...entrance(0.1)}
                  className="eyebrow mb-5 flex items-center gap-3 text-[#e9c08f] md:mb-8"
                >
                  <span aria-hidden="true" className="h-px w-8 bg-[#e9c08f]/70 md:w-10" />
                  {BRAND.city}, {BRAND.country} · Est. {BRAND.founded}
                </motion.p>

                <h1
                  id="home-hero-title"
                  className="font-display text-[clamp(2.5rem,7.2vw,6rem)] font-light leading-[1.04] tracking-[-0.025em] text-white [text-shadow:0_2px_30px_rgba(0,0,0,0.35)]"
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
                  className="mt-5 max-w-[30rem] text-[clamp(0.98rem,1.6vw,1.125rem)] leading-[1.65] text-white/80 md:mt-8 md:leading-[1.7]"
                >
                  Birthday coming up? Planning a wedding? Or just craving something sweet? Tell us
                  what you have in mind. We bake to order here in Kigali.
                </motion.p>

                <motion.div
                  {...entrance(0.75)}
                  className="mt-7 flex flex-col items-stretch gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 md:mt-9"
                >
                  <Button
                    to="/order"
                    variant="gold"
                    size="lg"
                    sheen
                    className="w-full justify-center sm:w-auto"
                  >
                    Order your cake
                    <ArrowRight
                      size={17}
                      strokeWidth={2}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </Button>

                  {/* A second pill under the first is a lot of button for a
                      phone; there it is a quiet link instead. */}
                  <Link
                    to="/creations"
                    className="group inline-flex items-center justify-center gap-2 py-1 text-[0.95rem] text-white/85 transition-colors hover:text-white sm:hidden"
                  >
                    <span className="border-b border-white/30 pb-0.5 transition-colors group-hover:border-white/70">
                      Explore the menu
                    </span>
                    <ArrowRight size={15} strokeWidth={1.8} aria-hidden="true" />
                  </Link>
                  <span className="hidden sm:block">
                    <Button
                      to="/creations"
                      variant="outlineLight"
                      size="lg"
                      className="!border-white/40 !text-white hover:!bg-white/10"
                    >
                      Explore the menu
                    </Button>
                  </span>
                </motion.div>
              </div>

              {/* One quiet baseline across the bottom: what we make on the
                  left, the film's own control on the right. On a phone the
                  control lives on the film instead, and the eyebrow already
                  says where we are, so the row is left out. */}
              <motion.div
                {...entrance(0.95)}
                className="pointer-events-auto mt-16 hidden flex-wrap items-center justify-between gap-x-8 gap-y-4 border-t border-white/15 pt-5 md:flex"
              >
                <div className="flex items-center gap-5 text-[0.7rem] uppercase tracking-[0.18em] text-white/65">
                  <span>Cakes & cupcakes</span>
                  <span aria-hidden="true" className="h-1 w-1 rounded-full bg-[#e9c08f]" />
                  <span>Made to order in Kigali</span>
                </div>
                {controls}
              </motion.div>
            </div>
          </>
        )}
      </HeroCake>
    </section>
  )
}
