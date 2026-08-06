import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import CreationArt from '../art/CreationArt'
import { Button, Section, SectionHeading } from '../components/ui'
import { fromPrice } from '../data/catalog'
import { useCatalog } from '../context/CatalogContext'
import { money, classNames } from '../lib/format'

/**
 * "What are we celebrating?" — picking an occasion filters the catalogue live,
 * which is far friendlier than dropping people straight into a full menu.
 */
export default function OccasionFinder() {
  const { occasions, productsForOccasion } = useCatalog()
  const [active, setActive] = useState(occasions[0].id)
  const occasion = occasions.find((o) => o.id === active) || occasions[0]
  const matches = productsForOccasion(occasion.id).slice(0, 3)

  return (
    <Section className="relative overflow-hidden bg-blush/45">
      <div className="container-x">
        <SectionHeading
          align="center"
          eyebrow="Occasion finder"
          title="What are we celebrating?"
          lead="Tell us the occasion and we will point you at what tends to work for it."
        />

        <div className="mt-11 flex flex-wrap justify-center gap-2.5">
          {occasions.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setActive(o.id)}
              aria-pressed={active === o.id}
              className={classNames(
                'relative rounded-full border px-5 py-2.5 text-[0.85rem] font-medium transition-all duration-300',
                active === o.id
                  ? 'border-espresso bg-espresso text-cream shadow-soft'
                  : 'border-caramel/30 bg-porcelain/70 text-cocoa hover:border-caramel hover:bg-porcelain',
              )}
            >
              {o.label}
            </button>
          ))}
        </div>

        <div className="mt-12 overflow-hidden rounded-[2rem] border border-caramel/25 bg-porcelain shadow-soft">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="grid gap-8 p-7 md:p-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center"
            >
              <div className="flex items-center gap-6">
                <div className="w-28 shrink-0 md:w-36">
                  <CreationArt
                    variant={occasion.art}
                    flavor={occasion.flavorArt}
                    seed={`occ-${occasion.id}`}
                    className="w-full"
                  />
                </div>
                <div>
                  <h3 className="font-display text-[1.75rem] leading-tight text-espresso">
                    {occasion.label}
                  </h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-cocoa/65">
                    {occasion.note}
                  </p>
                  <Link
                    to={`/creations?occasion=${occasion.id}`}
                    className="mt-4 inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-caramel underline-offset-4 hover:underline"
                  >
                    See everything for {occasion.label.toLowerCase()}
                    <ArrowRight size={14} strokeWidth={2} />
                  </Link>
                </div>
              </div>

              <ul className="grid gap-3 sm:grid-cols-3">
                {matches.map((product) => (
                  <li key={product.slug}>
                    <Link
                      to={`/creations/${product.slug}`}
                      className="group flex h-full flex-col rounded-2xl border border-caramel/20 bg-cream/70 p-4 transition-all duration-400 hover:-translate-y-1 hover:border-caramel/50 hover:bg-cream hover:shadow-soft"
                    >
                      <div className="mx-auto w-20 transition-transform duration-500 group-hover:scale-110">
                        <CreationArt
                          variant={product.art}
                          flavor={product.flavorArt}
                          seed={product.slug}
                          backdrop={false}
                          className="w-full"
                        />
                      </div>
                      <h4 className="mt-3 text-center font-display text-[0.98rem] leading-snug text-espresso">
                        {product.name}
                      </h4>
                      <p className="mt-1 text-center text-[0.75rem] text-cocoa/55">
                        from {money(fromPrice(product))}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-10 text-center">
          <Button to="/order" sheen>
            Start your order
            <ArrowRight size={16} strokeWidth={2} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </Section>
  )
}
