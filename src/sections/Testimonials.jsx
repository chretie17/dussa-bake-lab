import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react'
import CreationArt from '../art/CreationArt'
import { Section, SectionHeading, Stars } from '../components/ui'
import { TESTIMONIALS } from '../data/content'
import { classNames } from '../lib/format'

export default function Testimonials() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const current = TESTIMONIALS[index]

  useEffect(() => {
    if (paused) return undefined
    const timer = setInterval(() => setIndex((i) => (i + 1) % TESTIMONIALS.length), 6500)
    return () => clearInterval(timer)
  }, [paused])

  const go = (delta) =>
    setIndex((i) => (i + delta + TESTIMONIALS.length) % TESTIMONIALS.length)

  return (
    <Section className="relative overflow-hidden bg-cream">
      <div className="container-x">
        <SectionHeading
          align="center"
          eyebrow="Kind words"
          title="What people tell us"
        />

        <div
          className="relative mx-auto mt-12 max-w-4xl"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="relative overflow-hidden rounded-[2rem] border border-caramel/22 bg-porcelain px-7 py-12 shadow-soft md:px-16 md:py-14">
            <Quote
              size={72}
              strokeWidth={1}
              className="pointer-events-none absolute -left-2 -top-3 text-caramel/12"
              aria-hidden="true"
            />

            <AnimatePresence mode="wait">
              <motion.blockquote
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="relative text-center"
              >
                <div className="mx-auto mb-7 w-24 md:w-28">
                  <CreationArt
                    variant="cakeSlice"
                    flavor={current.flavorArt}
                    seed={`t-${index}`}
                    backdrop={false}
                    className="w-full"
                  />
                </div>

                <Stars value={current.rating} size={16} className="text-gold" />

                <p className="mx-auto mt-6 max-w-2xl font-display text-[clamp(1.15rem,2.4vw,1.6rem)] leading-[1.5] text-espresso">
                  “{current.quote}”
                </p>

                <footer className="mt-7">
                  <p className="font-medium text-espresso">{current.name}</p>
                  <p className="mt-0.5 text-[0.8125rem] text-cocoa/55">{current.role}</p>
                </footer>
              </motion.blockquote>
            </AnimatePresence>

            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-caramel/25 bg-porcelain text-espresso transition-colors hover:bg-blush md:left-4"
              aria-label="Previous review"
            >
              <ChevronLeft size={18} strokeWidth={1.8} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-caramel/25 bg-porcelain text-espresso transition-colors hover:bg-blush md:right-4"
              aria-label="Next review"
            >
              <ChevronRight size={18} strokeWidth={1.8} />
            </button>
          </div>

          <div className="mt-7 flex justify-center gap-2">
            {TESTIMONIALS.map((t, i) => (
              <button
                key={t.name}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show review from ${t.name}`}
                aria-current={i === index}
                className={classNames(
                  'h-1.5 rounded-full transition-all duration-400',
                  i === index ? 'w-8 bg-caramel' : 'w-1.5 bg-caramel/30 hover:bg-caramel/60',
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </Section>
  )
}
