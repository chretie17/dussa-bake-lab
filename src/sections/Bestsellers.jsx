import { ArrowRight } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import { Button, Section, SectionHeading } from '../components/ui'
import { bestsellers } from '../data/catalog'

export default function Bestsellers() {
  const products = bestsellers().slice(0, 6)

  return (
    <Section className="relative overflow-hidden bg-cream">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <SectionHeading
            eyebrow="Most requested"
            title="The ones people come back for"
            lead="Six creations that leave the kitchen more often than any others — every one of them customisable."
            className="max-w-xl"
          />
          <Button to="/creations" variant="outline" className="shrink-0">
            See all creations
            <ArrowRight size={16} strokeWidth={2} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product, i) => (
            <ProductCard key={product.slug} product={product} index={i} />
          ))}
        </div>
      </div>
    </Section>
  )
}
