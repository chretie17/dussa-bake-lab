import { motion } from 'framer-motion'
import { MessageSquare, PencilRuler, Flame, Truck } from 'lucide-react'
import { Section, SectionHeading } from '../components/ui'
import { PROCESS } from '../data/content'

const ICONS = { chat: MessageSquare, pencil: PencilRuler, oven: Flame, truck: Truck }

export default function ProcessSection() {
  return (
    <Section className="grain relative overflow-hidden bg-deep text-on-deep">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[30rem] w-[46rem] -translate-x-1/2 rounded-full bg-accent-soft/12 blur-[100px]"
      />

      <div className="container-x relative z-10">
        <SectionHeading
          align="center"
          tone="light"
          eyebrow="How it works"
          title="From your idea to your order"
          lead="Choose what you like. We will confirm the details and prepare it for your date."
        />

        <div className="relative mt-16">
          {/* The line the steps sit on */}
          <div
            aria-hidden="true"
            className="absolute left-[1.65rem] top-4 hidden h-[calc(100%-2rem)] w-px bg-gradient-to-b from-caramel/60 via-caramel/25 to-transparent md:block lg:left-0 lg:top-[2.1rem] lg:h-px lg:w-full lg:bg-gradient-to-r"
          />

          <ol className="grid gap-10 md:gap-12 lg:grid-cols-4">
            {PROCESS.map((step, i) => {
              const Icon = ICONS[step.icon] || MessageSquare
              return (
                <motion.li
                  key={step.step}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-70px' }}
                  transition={{ duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                  className="relative flex gap-5 md:gap-6 lg:block"
                >
                  <div className="relative z-10 flex h-[3.3rem] w-[3.3rem] shrink-0 items-center justify-center rounded-full border border-caramel/45 bg-deep text-accent">
                    <Icon size={21} strokeWidth={1.6} />
                  </div>

                  <div className="lg:mt-7">
                    <span className="eyebrow text-caramel/70">Step {step.step}</span>
                    <h3 className="mt-2.5 text-[1.3rem] text-on-deep">{step.title}</h3>
                    <p className="mt-2.5 max-w-xs text-[0.9rem] leading-relaxed text-on-deep/60">
                      {step.body}
                    </p>
                  </div>
                </motion.li>
              )
            })}
          </ol>
        </div>
      </div>
    </Section>
  )
}
