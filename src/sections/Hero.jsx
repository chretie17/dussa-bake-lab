import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import HeroCake from '../components/HeroCake'
import { Button } from '../components/ui'
import { BRAND } from '../data/site'

const HEADLINE_A = ['Bring', 'the', 'people.']
const HEADLINE_B = ["We'll", 'bring', 'the']

export default function Hero() {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })

  const cakeY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 140])
  const cakeScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.12])
  const copyY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -70])
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, reduce ? 1 : 0])

  const word = {
    hidden: { opacity: 0, y: '0.6em', rotate: 2 },
    show: { opacity: 1, y: 0, rotate: 0, transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] } },
  }

  return (
    <section
      ref={ref}
      className="grain relative isolate flex min-h-[100svh] items-center overflow-hidden bg-deep pb-16 pt-24 text-on-deep md:pb-16 md:pt-32"
    >
      {/* Warm light pooling behind the cake */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: 'var(--hero-glow)' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-deep to-transparent"
      />

      <div className="container-x relative z-10 grid w-full items-center gap-10 md:gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
        {/* ---------------------------------------------------- copy */}
        <motion.div style={{ y: copyY, opacity: fade }} className="max-w-xl">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="eyebrow flex items-center gap-3 text-accent"
          >
            <span aria-hidden="true" className="h-px w-9 bg-accent/60" />
            {BRAND.city}, {BRAND.country} · est. {BRAND.founded}
          </motion.p>

          <h1 className="mt-5 text-[clamp(2.2rem,7.2vw,4.9rem)] font-light leading-[1.03] tracking-[-0.03em] md:mt-7">
            <motion.span
              className="block italic"
              initial="hidden"
              animate="show"
              transition={{ staggerChildren: 0.07, delayChildren: 0.16 }}
            >
              {HEADLINE_A.map((w, i) => (
                <span key={i} className="inline-block overflow-hidden pb-[0.06em] align-bottom">
                  <motion.span variants={word} className="inline-block">
                    {w}&nbsp;
                  </motion.span>
                </span>
              ))}
            </motion.span>
            <motion.span
              className="mt-1 block"
              initial="hidden"
              animate="show"
              transition={{ staggerChildren: 0.07, delayChildren: 0.5 }}
            >
              {HEADLINE_B.map((w, i) => (
                <span key={i} className="inline-block overflow-hidden pb-[0.06em] align-bottom">
                  <motion.span variants={word} className="inline-block">
                    {w}&nbsp;
                  </motion.span>
                </span>
              ))}
              <span className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                <motion.span variants={word} className="text-gradient-gold inline-block font-normal">
                  cake.
                </motion.span>
              </span>
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.85 }}
            className="mt-7 max-w-lg text-[1.0625rem] leading-relaxed text-on-deep/65"
          >
            Birthday coming up? Planning a wedding? Or just craving something sweet?
            Tell us what you have in mind. We bake to order here in Kigali.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Button to="/order" variant="gold" size="lg" sheen>
              Order your cake
              <ArrowRight size={17} strokeWidth={2} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
            <Button to="/creations" size="lg" variant="outlineLight">
              Explore the menu
            </Button>
          </motion.div>

          <p className="mt-10 border-t border-on-deep/12 pt-7 text-[0.85rem] tracking-wide text-on-deep/65">
            Cakes, cupcakes & treats · Pickup and delivery in Kigali
          </p>
        </motion.div>

        {/* ------------------------------------------------- artwork
            Ordered first on a phone. Below the copy it landed a full screen
            down, so the hero opened on a wall of text with no cake in it. */}
        <motion.div
          style={{ y: cakeY, scale: cakeScale, opacity: fade }}
          className="relative order-first mx-auto w-full max-w-[19rem] sm:max-w-[24rem] md:max-w-[34rem] lg:order-none lg:max-w-none"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.86, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <HeroCake />
          </motion.div>


        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.8 }}
        style={{ opacity: fade }}
        className="absolute inset-x-0 bottom-6 z-10 hidden justify-center md:flex"
      >
        <div className="flex flex-col items-center gap-2.5 text-on-deep/40">
          <span className="eyebrow text-[0.6rem]">Scroll</span>
          <span className="relative h-12 w-px overflow-hidden bg-cream/18">
            <motion.span
              className="absolute inset-x-0 top-0 h-4 bg-gold"
              animate={{ y: [-16, 48] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </span>
        </div>
      </motion.div>
    </section>
  )
}
