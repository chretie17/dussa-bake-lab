import { motion } from 'framer-motion'
import { Award, HeartHandshake, Leaf, Timer } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import CreationArt from '../art/CreationArt'
import SealBadge from '../components/SealBadge'
import ProcessSection from '../sections/ProcessSection'
import CtaBanner from '../sections/CtaBanner'
import { Button, Flourish, Reveal, Section, SectionHeading } from '../components/ui'
import { BRAND } from '../data/site'
import { STATS, VALUES } from '../data/content'
import usePageMeta from '../lib/usePageMeta'

const PRINCIPLES = [
  {
    icon: Leaf,
    title: 'Real ingredients only',
    body: 'Real chocolate, butter, free-range eggs, proper vanilla, fruit from the market. No compound chocolate, no packet mixes, no preservatives.',
  },
  {
    icon: Timer,
    title: 'Made close to your date',
    body: 'Nothing frozen, nothing sitting in a case. Your order has a bake day, as near your event as is safe.',
  },
  {
    icon: HeartHandshake,
    title: 'Designed with you',
    body: 'For custom work you see a sketch and a fixed price before we start. No surprises at the door.',
  },
  {
    icon: Award,
    title: 'Finished by hand',
    body: 'Every rosette, drip and piped letter is done by hand here. It is also why no two come out identical.',
  },
]

const TIMELINE = [
  {
    year: '2021',
    title: 'One oven, one whisk',
    body: 'It started as weekend orders out of a home kitchen in Kigali. Mostly birthday cakes, mostly for friends of friends.',
  },
  {
    year: '2022',
    title: 'The chocolate drip',
    body: 'A four-layer chocolate cake with a slow ganache drip became the one everyone asked for. Still is.',
  },
  {
    year: '2024',
    title: 'Weddings & events',
    body: 'Tiered cakes, tasting boxes and branded dessert tables went on the menu once companies started calling.',
  },
  {
    year: 'Today',
    title: 'Order online, city-wide',
    body: 'Book in a couple of minutes, follow your order with a code, and have it brought to you anywhere in Kigali.',
  },
]

export default function About() {
  usePageMeta({
    title: 'Our story — Dussa BakeLab, Kigali',
    description:
      'How Dussa BakeLab grew from one oven in Kigali into the bakery behind thousands of celebrations — and the standards we refuse to drop.',
  })

  return (
    <>
      <PageHeader
        eyebrow="Our story"
        title={
          <>
            Sweet moments, <span className="italic text-gradient-gold">made better</span>
          </>
        }
        lead={BRAND.description}
        crumbs={[{ label: 'Our story' }]}
      />

      <Section className="bg-cream">
        <div className="container-x grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto max-w-md rounded-[2.5rem] border border-caramel/25 bg-gradient-to-br from-blush/70 to-porcelain p-8 shadow-soft"
            >
              <CreationArt variant="tieredCake" flavor="ivory" seed="about-hero" className="w-full" />
            </motion.div>
            <div className="absolute -bottom-4 -right-2 h-28 w-28 md:h-36 md:w-36">
              <SealBadge className="h-full w-full" duration={34} />
            </div>
          </div>

          <div>
            <SectionHeading
              eyebrow={`Baked in ${BRAND.city} since ${BRAND.founded}`}
              title="We started because good cake was hard to find"
              lead="Not the kind that is sweet enough to hurt. Not the kind that photographs well and tastes of nothing. Cake with a proper crumb, real chocolate, and a finish that looks like somebody cared."
            />

            <div className="mt-6 space-y-4 text-[1rem] leading-relaxed text-cocoa/70">
              <p>
                What began as weekend orders from a home kitchen turned into a full bakery, but the
                way we work has not changed. Everything is still made in small batches, still
                decorated by hand, and still baked as close to your celebration as we can safely
                manage.
              </p>
              <p>
                We have baked for first birthdays, last-minute apologies, weddings in Nyarutarama
                and Tuesday afternoons that needed rescuing. The occasion changes. The standard does
                not.
              </p>
            </div>

            <div className="mt-9 grid grid-cols-2 gap-5 border-t border-caramel/25 pt-8 sm:grid-cols-4">
              {STATS.map((stat) => (
                <div key={stat.label}>
                  <p className="font-display text-[1.7rem] leading-none text-espresso">{stat.value}</p>
                  <p className="mt-2 text-[0.72rem] uppercase tracking-[0.12em] text-cocoa/50">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------ principles */}
      <Section className="bg-blush/45">
        <div className="container-x">
          <SectionHeading
            align="center"
            eyebrow="What we will not compromise on"
            title="Four things we will not bend on"
          />
          <Flourish className="mt-8" />

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PRINCIPLES.map((p, i) => {
              const Icon = p.icon
              return (
                <Reveal key={p.title} delay={i * 0.08}>
                  <div className="h-full rounded-[1.75rem] border border-caramel/22 bg-porcelain p-7 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-soft">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blush text-choco">
                      <Icon size={21} strokeWidth={1.6} />
                    </div>
                    <h3 className="mt-5 font-display text-[1.15rem] text-espresso">{p.title}</h3>
                    <p className="mt-2.5 text-[0.875rem] leading-relaxed text-cocoa/65">{p.body}</p>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </Section>

      {/* -------------------------------------------------- timeline */}
      <Section className="bg-cream">
        <div className="container-x">
          <SectionHeading
            align="center"
            eyebrow="How we got here"
            title="A short history, in four cakes"
          />

          <div className="relative mx-auto mt-14 max-w-3xl">
            <div
              aria-hidden="true"
              className="absolute left-[4.4rem] top-2 hidden h-[calc(100%-1rem)] w-px bg-gradient-to-b from-caramel/60 via-caramel/30 to-transparent sm:block"
            />
            <ol className="space-y-10">
              {TIMELINE.map((t, i) => (
                <Reveal key={t.year} delay={i * 0.08} as="li" className="relative flex gap-6">
                  <div className="hidden w-14 shrink-0 pt-1 text-right sm:block">
                    <span className="font-display text-[1.05rem] text-caramel">{t.year}</span>
                  </div>
                  <span
                    aria-hidden="true"
                    className="relative z-10 mt-2 hidden h-3 w-3 shrink-0 rounded-full bg-caramel ring-4 ring-cream sm:block"
                  />
                  <div className="flex-1">
                    <span className="font-display text-[1.05rem] text-caramel sm:hidden">{t.year}</span>
                    <h3 className="font-display text-[1.3rem] text-espresso">{t.title}</h3>
                    <p className="mt-2 text-[0.9375rem] leading-relaxed text-cocoa/65">{t.body}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>
      </Section>

      {/* ---------------------------------------------------- values */}
      <Section className="grain relative overflow-hidden bg-deep text-on-deep">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 top-0 h-[30rem] w-[30rem] rounded-full bg-accent-soft/14 blur-3xl"
        />
        <div className="container-x relative z-10 grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="script text-[clamp(2.2rem,5vw,3.2rem)] leading-none text-accent">
              {BRAND.script}
            </p>
            <h2 className="mt-6 text-[clamp(1.8rem,4vw,2.8rem)] leading-[1.1]">
              The promises behind every box
            </h2>
            <p className="mt-5 max-w-md text-[1rem] leading-relaxed text-on-deep/60">
              These are not slogans. They are how the kitchen runs, and the reason people come back.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button to="/creations" variant="gold" sheen>
                See the menu
              </Button>
              <Button
                to="/contact"
                variant="outlineLight"
              >
                Talk to us
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {VALUES.map((v, i) => (
              <Reveal key={v.title} delay={i * 0.07}>
                <div className="h-full rounded-2xl border border-on-deep/14 bg-on-deep/6 p-6">
                  <h3 className="font-display text-[1.1rem] text-accent">{v.title}</h3>
                  <p className="mt-2 text-[0.875rem] leading-relaxed text-on-deep/60">{v.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      <ProcessSection />
      <CtaBanner />
    </>
  )
}
