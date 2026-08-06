import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import ProductCard from '../components/ProductCard'
import { Button, Pill } from '../components/ui'
import { fromPrice } from '../data/catalog'
import { useCatalog } from '../context/CatalogContext'
import { classNames, money } from '../lib/format'
import usePageMeta from '../lib/usePageMeta'

const SORTS = [
  { id: 'featured', label: 'Featured' },
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
  { id: 'rating', label: 'Top rated' },
  { id: 'fastest', label: 'Ready soonest' },
]

export default function Creations() {
  const { products, categories, occasions } = useCatalog()
  const [params, setParams] = useSearchParams()
  const category = params.get('category') || 'all'
  const occasion = params.get('occasion') || ''
  const [query, setQuery] = useState(params.get('q') || '')
  const [sort, setSort] = useState('featured')
  const [showFilters, setShowFilters] = useState(false)

  usePageMeta({
    title: 'Creations — Cakes, Cupcakes, Cookies & Custom Orders | Dussa BakeLab',
    description:
      'Browse the full Dussa BakeLab menu: signature cakes, piped cupcakes, brown butter cookies, macarons, brownies and bespoke custom designs. Baked to order in Kigali.',
  })

  /** Keep the URL shareable — filters live in the query string, not just state. */
  const setParam = (key, value) => {
    const next = new URLSearchParams(params)
    if (value && value !== 'all') next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  useEffect(() => {
    const handle = setTimeout(() => setParam('q', query.trim()), 350)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const results = useMemo(() => {
    let list = [...products]

    if (category !== 'all') list = list.filter((p) => p.category === category)
    if (occasion) list = list.filter((p) => p.occasions?.includes(occasion))

    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter((p) =>
        [p.name, p.tagline, p.description, ...(p.tags || [])]
          .join(' ')
          .toLowerCase()
          .includes(q),
      )
    }

    switch (sort) {
      case 'price-asc':
        list.sort((a, b) => fromPrice(a) - fromPrice(b))
        break
      case 'price-desc':
        list.sort((a, b) => fromPrice(b) - fromPrice(a))
        break
      case 'rating':
        list.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
      case 'fastest':
        list.sort((a, b) => a.leadDays - b.leadDays)
        break
      default:
        list.sort((a, b) => Number(Boolean(b.bestseller)) - Number(Boolean(a.bestseller)))
    }

    return list
  }, [products, category, occasion, query, sort])

  const activeOccasion = occasions.find((o) => o.id === occasion)
  const custom = products.find((p) => p.slug === 'bespoke-design-cake')
  const hasFilters = category !== 'all' || Boolean(occasion) || Boolean(query.trim())

  const clearAll = () => {
    setQuery('')
    setParams(new URLSearchParams(), { replace: true })
  }

  return (
    <>
      <PageHeader
        eyebrow="The full menu"
        title="Our creations"
        lead="Everything here is made to order. Pick a size, a flavour and a finish, and we take it from there."
        crumbs={[{ label: 'Creations' }]}
      >
        <div className="mt-8 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setParam('category', category === c.id ? 'all' : c.id)}
              className={classNames(
                'rounded-full border px-4 py-2 text-[0.8125rem] font-medium transition-all duration-300',
                category === c.id
                  ? 'border-gold bg-gold text-espresso'
                  : 'border-cream/22 text-cream/75 hover:border-cream/50 hover:text-cream',
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      </PageHeader>

      {/* ------------------------------------------------- toolbar */}
      <div className="sticky top-[68px] z-30 border-b border-caramel/20 bg-cream/92 backdrop-blur-lg">
        <div className="container-x flex flex-wrap items-center gap-3 py-4">
          <div className="relative min-w-[12rem] flex-1">
            <Search
              size={16}
              strokeWidth={1.8}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cocoa/40"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search cakes, flavours, occasions…"
              aria-label="Search creations"
              className="h-11 w-full rounded-full border border-caramel/25 bg-porcelain pl-11 pr-4 text-[0.875rem] text-espresso placeholder:text-cocoa/40 focus:border-caramel focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="flex h-11 items-center gap-2 rounded-full border border-caramel/25 bg-porcelain px-4 text-[0.8125rem] font-medium text-espresso transition-colors hover:border-caramel md:hidden"
            aria-expanded={showFilters}
          >
            <SlidersHorizontal size={15} strokeWidth={1.8} />
            Filters
          </button>

          <div className={classNames('flex items-center gap-3', showFilters ? 'flex' : 'hidden md:flex')}>
            <label className="sr-only" htmlFor="occasion-filter">
              Filter by occasion
            </label>
            <select
              id="occasion-filter"
              value={occasion}
              onChange={(e) => setParam('occasion', e.target.value)}
              className="h-11 rounded-full border border-caramel/25 bg-porcelain px-4 pr-8 text-[0.8125rem] text-espresso focus:border-caramel focus:outline-none"
            >
              <option value="">All occasions</option>
              {occasions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>

            <label className="sr-only" htmlFor="sort-order">
              Sort creations
            </label>
            <select
              id="sort-order"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="h-11 rounded-full border border-caramel/25 bg-porcelain px-4 pr-8 text-[0.8125rem] text-espresso focus:border-caramel focus:outline-none"
            >
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <section className="bg-cream py-12 md:py-16">
        <div className="container-x">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-[0.875rem] text-cocoa/60">
              <strong className="font-medium text-espresso">{results.length}</strong>{' '}
              {results.length === 1 ? 'creation' : 'creations'}
              {activeOccasion && <> for {activeOccasion.label.toLowerCase()}</>}
            </p>

            {hasFilters && (
              <div className="flex flex-wrap items-center gap-2">
                {category !== 'all' && (
                  <Pill tone="gold">{categories.find((c) => c.id === category)?.name}</Pill>
                )}
                {activeOccasion && <Pill tone="gold">{activeOccasion.label}</Pill>}
                {query.trim() && <Pill tone="gold">“{query.trim()}”</Pill>}
                <button
                  type="button"
                  onClick={clearAll}
                  className="inline-flex items-center gap-1 text-[0.78rem] text-cocoa/55 underline-offset-4 hover:text-espresso hover:underline"
                >
                  <X size={12} strokeWidth={2.2} /> Clear
                </button>
              </div>
            )}
          </div>

          <AnimatePresence mode="popLayout">
            {results.length > 0 ? (
              <motion.div
                layout
                className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              >
                {results.map((product, i) => (
                  <ProductCard key={product.slug} product={product} index={i} />
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-16 rounded-[2rem] border border-dashed border-caramel/35 bg-porcelain/60 px-8 py-16 text-center"
              >
                <h2 className="font-display text-2xl text-espresso">Nothing matches that yet</h2>
                <p className="mx-auto mt-3 max-w-sm text-[0.9375rem] text-cocoa/60">
                  Try a different filter, or tell us what you were after and we will make it specially.
                </p>
                <div className="mt-7 flex flex-wrap justify-center gap-3">
                  <Button onClick={clearAll} variant="outline">
                    Clear filters
                  </Button>
                  <Button to="/contact">Request a custom design</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-16 rounded-[2rem] border border-caramel/22 bg-porcelain p-8 text-center md:p-12">
            <h2 className="font-display text-[clamp(1.5rem,3vw,2.1rem)] text-espresso">
              Not seeing what you had in mind?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-[0.9375rem] leading-relaxed text-cocoa/62">
              Custom work is the part we enjoy most. Send a picture, a colour, or an idea you cannot
              quite explain yet, and we will sketch it and price it. Bespoke designs start from{' '}
              {custom ? money(fromPrice(custom)) : 'RWF 65,000'}.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button to={custom ? `/creations/${custom.slug}` : '/contact'} sheen>
                Design something bespoke
              </Button>
              <Button to="/contact" variant="outline">
                Ask a question
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
