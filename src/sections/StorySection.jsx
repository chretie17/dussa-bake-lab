import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import CreationImage from '../components/CreationImage'
import { Button, Reveal, Section, SectionHeading } from '../components/ui'
import { STATS, VALUES } from '../data/content'

export default function StorySection() {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const driftUp = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : 60, reduce ? 0 : -60])
  const driftDown = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : -40, reduce ? 0 : 40])

  return (
    <Section ref={ref} className="relative overflow-hidden bg-blush/45">
      <div className="container-x grid items-center gap-16 lg:grid-cols-2 lg:gap-20">
        {/* --------------------------------------------- collage */}
        <div className="relative order-2 lg:order-1">
          <motion.div style={{ y: driftUp }} className="relative z-10 mx-auto max-w-sm">
            <div className="overflow-hidden rounded-[2rem] border border-caramel/25 bg-gradient-to-br from-porcelain to-blush/70 p-4 shadow-soft">
              <CreationImage art="cakeSlice" flavorArt="chocolate" seed="story-slice" alt="A slice of cake" className="w-full rounded-2xl" />
            </div>
          </motion.div>

          <motion.div
            style={{ y: driftDown }}
            className="absolute -right-2 -top-6 z-20 w-32 md:w-40"
          >
            <div className="overflow-hidden rounded-[1.5rem] border border-caramel/25 bg-porcelain p-2 shadow-lift">
              <CreationImage art="cupcake" flavorArt="vanilla" seed="story-cupcake" alt="A decorated cupcake" className="w-full rounded-xl" />
            </div>
          </motion.div>

          <motion.div
            style={{ y: driftDown }}
            className="absolute -bottom-8 -left-2 z-20 w-28 md:w-36"
          >
            <div className="overflow-hidden rounded-[1.5rem] border border-caramel/25 bg-porcelain p-2 shadow-lift">
              <CreationImage art="cookieStack" flavorArt="caramel" seed="story-cookie" alt="Cookies" className="w-full rounded-xl" />
            </div>
          </motion.div>

          <div
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 -z-0 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/22 blur-3xl"
          />
        </div>

        {/* ------------------------------------------------ copy */}
        <div className="order-1 lg:order-2">
          <SectionHeading
            eyebrow="Sweet moments, made better"
            title={
              <>
                A small kitchen in Kigali with{' '}
                <span className="italic text-caramel">very high standards</span>
              </>
            }
            lead="We started with one oven, a hand whisk, and a stubborn view that a cake should taste as good as it looks. Everything still goes out in small batches, made by hand, on the day."
          />

          <div className="mt-9 grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {VALUES.map((value, i) => (
              <Reveal key={value.title} delay={i * 0.07}>
                <div className="border-l-2 border-caramel/35 pl-4">
                  <h3 className="font-display text-[1.05rem] text-espresso">{value.title}</h3>
                  <p className="mt-1.5 text-[0.875rem] leading-relaxed text-cocoa/65">{value.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-10 grid grid-cols-2 gap-5 border-t border-caramel/25 pt-8 sm:grid-cols-4">
            {STATS.map((stat, i) => (
              <Reveal key={stat.label} delay={i * 0.06}>
                <p className="font-display text-[1.7rem] leading-none text-espresso">{stat.value}</p>
                <p className="mt-2 text-[0.72rem] uppercase tracking-[0.12em] text-cocoa/50">
                  {stat.label}
                </p>
              </Reveal>
            ))}
          </div>

          <div className="mt-10">
            <Button to="/about" variant="outline">
              Read our story
            </Button>
          </div>
        </div>
      </div>
    </Section>
  )
}
