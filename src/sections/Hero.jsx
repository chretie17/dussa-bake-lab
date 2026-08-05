import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Star } from 'lucide-react'
import CreationArt from '../art/CreationArt'
import SealBadge from '../components/SealBadge'
import { Button } from '../components/ui'
import { BRAND } from '../data/site'

const HEADLINE_A = ['Made', 'with', 'the', 'finest', 'ingredients,']
const HEADLINE_B = ['baked', 'to', 'be']

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
      className="grain relative isolate flex min-h-[100svh] items-center overflow-hidden bg-espresso pb-24 pt-32 text-cream md:pb-16"
    >
      {/* Warm light pooling behind the cake */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(58% 62% at 72% 44%, rgba(212,165,116,0.30) 0%, rgba(212,165,116,0.06) 46%, transparent 72%), radial-gradient(46% 50% at 12% 88%, rgba(107,68,41,0.5) 0%, transparent 70%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-espresso to-transparent"
      />

      <div className="container-x relative z-10 grid w-full items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
        {/* ---------------------------------------------------- copy */}
        <motion.div style={{ y: copyY, opacity: fade }} className="max-w-xl">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="eyebrow flex items-center gap-3 text-gold"
          >
            <span aria-hidden="true" className="h-px w-9 bg-gold/60" />
            {BRAND.city}, {BRAND.country} · est. {BRAND.founded}
          </motion.p>

          <h1 className="mt-7 text-[clamp(2.6rem,7.2vw,4.9rem)] font-light leading-[1.02] tracking-[-0.03em]">
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
                  loved.
                </motion.span>
              </span>
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.85 }}
            className="mt-7 max-w-lg text-[1.0625rem] leading-relaxed text-cream/65"
          >
            Handcrafted cakes, cupcakes, cookies and custom creations — baked to order in Kigali
            for every occasion worth celebrating.
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

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-cream/12 pt-7"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex text-gold">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
                ))}
              </span>
              <span className="text-[0.8125rem] text-cream/60">
                <strong className="font-medium text-cream">4.9</strong> from 600+ reviews
              </span>
            </div>
            <p className="text-[0.8125rem] text-cream/60">
              <strong className="font-medium text-cream">4,000+</strong> celebrations baked for
            </p>
            <p className="text-[0.8125rem] text-cream/60">
              <strong className="font-medium text-cream">48h</strong> standard turnaround
            </p>
          </motion.div>
        </motion.div>

        {/* ------------------------------------------------- artwork */}
        <motion.div
          style={{ y: cakeY, scale: cakeScale, opacity: fade }}
          className="relative mx-auto w-full max-w-[34rem] lg:max-w-none"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.86, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <CreationArt
              variant="dripCake"
              flavor="chocolate"
              seed="hero-cake"
              className="w-full drop-shadow-[0_40px_60px_rgba(0,0,0,0.45)]"
            />
          </motion.div>

          {/* Rotating flyer seal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="absolute -right-1 top-2 h-24 w-24 md:h-32 md:w-32 lg:-right-4"
          >
            <SealBadge className="h-full w-full" />
          </motion.div>

          {/* Floating supporting creations */}
          <motion.div
            initial={{ opacity: 0, x: -30, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 1, delay: 1.05 }}
            className="animate-drift absolute -left-2 bottom-6 h-24 w-24 md:h-32 md:w-32"
          >
            <CreationArt variant="cupcake" flavor="strawberry" seed="hero-cupcake" backdrop={false} className="h-full w-full drop-shadow-[0_18px_28px_rgba(0,0,0,0.4)]" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 26, y: -16 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="animate-drift absolute -bottom-2 right-4 hidden h-24 w-24 [animation-delay:1.4s] sm:block md:h-28 md:w-28"
          >
            <CreationArt variant="macarons" flavor="berry" seed="hero-macaron" backdrop={false} className="h-full w-full drop-shadow-[0_18px_28px_rgba(0,0,0,0.4)]" />
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
        <div className="flex flex-col items-center gap-2.5 text-cream/40">
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
