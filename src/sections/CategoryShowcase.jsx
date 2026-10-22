import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import CreationImage from '../components/CreationImage'
import { Section, SectionHeading, Flourish } from '../components/ui'
import { useCatalog } from '../context/CatalogContext'

/** The flyer's "Our delicious creations" strip, rebuilt as an interactive rail. */
export default function CategoryShowcase() {
  const { categories } = useCatalog()

  return (
    <Section id="creations" className="relative overflow-hidden bg-cream">
      <div className="container-x">
        <SectionHeading
          align="center"
          eyebrow="Something for everyone"
          title="What we make"
          lead="A birthday cake, a box of cupcakes, or just a treat for yourself. Take a look and tell us what you fancy."
        />
        <Flourish className="mt-8" />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {categories.map((category, i) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 34 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-70px' }}
              transition={{ duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                to={`/creations?category=${category.id}`}
                className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-caramel/22 bg-gradient-to-b from-porcelain to-cream p-6 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-2 hover:border-caramel/50 hover:shadow-lift"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 -top-24 h-48 bg-gold/0 blur-2xl transition-colors duration-700 group-hover:bg-gold/22"
                />

                <div className="relative mx-auto w-full max-w-[11rem] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110 group-hover:-rotate-2">
                  <CreationImage
                    photo={category.photo}
                    art={category.art}
                    flavorArt={category.flavorArt}
                    seed={`cat-${category.id}`}
                    alt={`An example of ${category.name.toLowerCase()}`}
                    className="w-full rounded-2xl"
                  />
                </div>

                <div className="relative mt-4 flex-1 text-center">
                  <h3 className="text-[1.3rem] leading-tight text-espresso">{category.name}</h3>
                  <p className="mt-1 text-[0.8125rem] italic text-caramel">{category.blurb}</p>
                  <p className="mt-3 text-[0.8125rem] leading-relaxed text-cocoa/60">
                    {category.description}
                  </p>
                </div>

                <span className="relative mt-6 inline-flex items-center justify-center gap-1.5 text-[0.78rem] font-medium uppercase tracking-[0.14em] text-espresso/70 transition-colors group-hover:text-caramel">
                  Browse
                  <ArrowUpRight
                    size={14}
                    strokeWidth={2}
                    className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  )
}
