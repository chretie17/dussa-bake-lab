import { motion } from 'framer-motion'
import { Award, HeartHandshake, Leaf, Timer } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import CreationImage from '../components/CreationImage'
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
    body: 'We pay attention to the taste as much as the decoration. If you have ingredient questions, just ask.',
  },
  {
    icon: Timer,
    title: 'Made close to your date',
    body: 'Tell us the date you have in mind and we will help you plan when to order.',
  },
  {
    icon: HeartHandshake,
    title: 'Designed with you',
    body: 'Bring us your ideas or a reference photo and we can work through the design together.',
  },
  {
    icon: Award,
    title: 'Finished by hand',
    body: 'From the colours to the message on top, small details make a cake feel personal.',
  },
]

const TIMELINE = [
  { year: '01', title: 'Tell us what you have in mind', body: 'The occasion, your date and any pictures you would like us to see.' },
  { year: '02', title: 'Choose your cake', body: 'We talk through flavours, sizes and details before confirming the order.' },
  { year: '03', title: 'Into the kitchen', body: 'Your order is prepared and finished for your chosen date.' },
  { year: '04', title: 'Time to share', body: 'Arrange collection or delivery in Kigali, then enjoy it with your people.' },
]

export default function About() {
  usePageMeta({
    title: 'Our story — Dussa BakeLab, Kigali',
    description:
      'Get to know Dussa BakeLab, a Kigali bakery making cakes, cupcakes and treats for every kind of occasion.',
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
              <CreationImage art="tieredCake" flavorArt="ivory" seed="about-hero" alt="A tiered celebration cake" className="w-full rounded-[1.5rem]" />
            </motion.div>
          </div>

          <div>
            <SectionHeading
              eyebrow={`From our kitchen in ${BRAND.city}`}
              title="We believe a cake should taste as good as it looks"
              lead="The best part of a celebration is gathering everyone around the table. We like making the cake that brings them there."
            />

            <div className="mt-6 space-y-4 text-[1rem] leading-relaxed text-cocoa/70">
              <p>
                We make cakes, cupcakes and sweet treats here in Kigali. Every order starts with
                a conversation about what you like, who you are sharing it with and the
                occasion you have in mind.
              </p>
              <p>
                It can be a birthday, a wedding or simply a box of something sweet to take home.
                We will help you choose the flavour, size and finish that feel right.
              </p>
            </div>

            <div className="mt-9 grid grid-cols-2 gap-5 border-t border-caramel/25 pt-8 sm:grid-cols-4">
              {STATS.map((stat) => (
                <div key={stat.label}>
                  <p className="font-display text-[1.7rem] leading-none text-espresso">{stat.value}</p>
                  <p className="mt-2 text-[0.72rem] uppercase tracking-[0.12em] text-cocoa/70">
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
            eyebrow="Ordering from us"
            title="From the first message to the last slice"
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
              Here is what matters to us when we make something for you.
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
