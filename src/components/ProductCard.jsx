import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight, Clock } from 'lucide-react'
import CreationImage from './CreationImage'
import { Pill } from './ui'
import { fromPrice } from '../data/catalog'
import { money, classNames } from '../lib/format'

export default function ProductCard({ product, index = 0, className = '' }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.65, delay: Math.min(index * 0.06, 0.4), ease: [0.22, 1, 0.36, 1] }}
      className={classNames('group relative', className)}
    >
      <Link
        to={`/creations/${product.slug}`}
        className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-caramel/20 bg-porcelain transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:border-caramel/45 hover:shadow-lift"
      >
        <div className="relative aspect-[4/3.4] overflow-hidden bg-gradient-to-br from-blush/80 to-cream">
          <div className="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.07]">
            <CreationImage
              photo={product.photo}
              art={product.art}
              flavorArt={product.flavorArt}
              alt={product.name}
              seed={product.slug}
            />
          </div>

          <div className="absolute left-4 top-4 flex flex-col items-start gap-2">
            {product.bestseller && <Pill tone="dark">Featured</Pill>}
          </div>

          <div className="absolute right-4 top-4">
            <span className="flex items-center gap-1 rounded-full bg-porcelain/85 px-2.5 py-1 text-[0.7rem] font-medium text-cocoa backdrop-blur-sm">
              <Clock size={11} strokeWidth={2} className="text-caramel" />
              {product.leadDays}d
            </span>
          </div>

          {/* Slides up on hover to invite the click */}
          <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-espresso/90 to-transparent px-5 pb-4 pt-10 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0">
            <span className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-cream">
              Customise & order <ArrowUpRight size={15} strokeWidth={2} />
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-[1.2rem] leading-snug text-espresso">{product.name}</h3>
          </div>

          <p className="mt-1.5 text-[0.8125rem] italic text-caramel">{product.tagline}</p>
          <p className="mt-3 line-clamp-2 text-[0.875rem] leading-relaxed text-cocoa/65">
            {product.description}
          </p>

          <div className="mt-auto flex items-end justify-between gap-3 pt-5">
            <div>
              <span className="block text-[0.68rem] uppercase tracking-[0.16em] text-cocoa/45">
                From
              </span>
              <span className="font-display text-[1.35rem] text-espresso tabular-nums">
                {money(fromPrice(product))}
              </span>
            </div>
            <div className="flex flex-wrap justify-end gap-1.5">
              {product.tags?.slice(0, 2).map((t) => (
                <Pill key={t} tone="outline" className="text-[0.62rem]">
                  {t}
                </Pill>
              ))}
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  )
}
