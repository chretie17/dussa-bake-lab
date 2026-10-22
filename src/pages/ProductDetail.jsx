import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronRight, Clock, Minus, Plus, ShoppingBag, Sparkles, Truck } from 'lucide-react'
import CreationImage from '../components/CreationImage'
import ProductCard from '../components/ProductCard'
import { Button, Flourish, Pill, Stars } from '../components/ui'
import { PALETTES } from '../art/palettes'
import { computeLinePrice, getCategory } from '../data/catalog'
import { useCatalog } from '../context/CatalogContext'
import { useCart } from '../context/CartContext'
import { classNames, money } from '../lib/format'
import usePageMeta from '../lib/usePageMeta'
import NotFound from './NotFound'

const TABS = [
  { id: 'about', label: 'About this creation' },
  { id: 'ingredients', label: 'Ingredients & allergens' },
  { id: 'care', label: 'Storage & serving' },
]

export default function ProductDetail() {
  const { slug } = useParams()
  const { products, getProduct, fulfilment, loading } = useCatalog()
  const product = getProduct(slug)
  const { addItem } = useCart()

  const [sizeId, setSizeId] = useState(product?.sizes?.[0]?.id)
  const [flavorId, setFlavorId] = useState(product?.flavors?.[0]?.id)
  const [frostingId, setFrostingId] = useState(product?.frostings?.[0]?.id)
  const [addonIds, setAddonIds] = useState([])
  const [message, setMessage] = useState('')
  const [brief, setBrief] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [tab, setTab] = useState('about')
  const [added, setAdded] = useState(false)

  usePageMeta({
    title: product ? `${product.name} — Dussa BakeLab` : 'Creation not found — Dussa BakeLab',
    description: product?.description,
  })

  const size = product?.sizes.find((s) => s.id === sizeId) || product?.sizes[0]
  const flavor = product?.flavors?.find((f) => f.id === flavorId)
  const frosting = product?.frostings?.find((f) => f.id === frostingId)

  const unitPrice = useMemo(
    () =>
      product
        ? computeLinePrice({ product, sizeId, flavorId, frostingId, addonIds, quantity: 1 })
        : 0,
    [product, sizeId, flavorId, frostingId, addonIds],
  )

  // Wait for the live menu before deciding a slug is unknown, otherwise a
  // newly added product 404s for anyone who lands on it directly.
  if (!product) return loading ? <ProductSkeleton /> : <NotFound />

  const category = getCategory(product.category)
  /** The selected flavour repaints the illustration, so the choice is visible. */
  const artFlavor = PALETTES[flavorId] ? flavorId : product.flavorArt
  const related = products.filter(
    (p) => p.slug !== product.slug && (p.category === product.category || p.bestseller),
  ).slice(0, 3)

  const toggleAddon = (id) =>
    setAddonIds((current) =>
      current.includes(id) ? current.filter((a) => a !== id) : [...current, id],
    )

  const handleAdd = () => {
    addItem({
      slug: product.slug,
      name: product.name,
      category: product.category,
      art: product.art,
      flavorArt: artFlavor,
      photo: product.photo,
      leadDays: product.leadDays,
      sizeId: size.id,
      sizeLabel: size.label,
      serves: size.serves,
      flavorId: flavor?.id || null,
      flavorLabel: flavor?.label || null,
      frostingId: frosting?.id || null,
      frostingLabel: frosting?.label || null,
      addonIds,
      addonLabels: (product.addons || [])
        .filter((a) => addonIds.includes(a.id))
        .map((a) => a.label),
      message: message.trim(),
      brief: brief.trim(),
      quantity,
      unitPrice,
      linePrice: unitPrice * quantity,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2200)
  }

  return (
    <>
      <div className="bg-cream pt-28 md:pt-32">
        <div className="container-x">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 text-[0.78rem] text-cocoa/50">
              <li>
                <Link to="/" className="transition-colors hover:text-caramel">
                  Home
                </Link>
              </li>
              <li className="flex items-center gap-1.5">
                <ChevronRight size={13} strokeWidth={2} className="opacity-45" aria-hidden="true" />
                <Link to="/creations" className="transition-colors hover:text-caramel">
                  Creations
                </Link>
              </li>
              <li className="flex items-center gap-1.5">
                <ChevronRight size={13} strokeWidth={2} className="opacity-45" aria-hidden="true" />
                <Link
                  to={`/creations?category=${product.category}`}
                  className="transition-colors hover:text-caramel"
                >
                  {category?.name}
                </Link>
              </li>
              <li className="flex items-center gap-1.5">
                <ChevronRight size={13} strokeWidth={2} className="opacity-45" aria-hidden="true" />
                <span className="text-espresso/75">{product.name}</span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <section className="bg-cream py-10 md:py-14">
        <div className="container-x grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          {/* ------------------------------------------------ visual */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="relative overflow-hidden rounded-[2rem] border border-caramel/22 bg-gradient-to-br from-blush/70 to-porcelain p-6 shadow-soft"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={artFlavor}
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.04 }}
                  transition={{ duration: 0.4 }}
                >
                  <CreationImage
                    photo={product.photo}
                    art={product.art}
                    flavorArt={artFlavor}
                    alt={product.name}
                    seed={product.slug}
                    loading="eager"
                  />
                </motion.div>
              </AnimatePresence>

              <div className="absolute left-6 top-6 flex flex-col gap-2">
                {product.bestseller && <Pill tone="dark">Featured</Pill>}
                {product.customBrief && <Pill tone="gold">Bespoke</Pill>}
              </div>
            </motion.div>
            {!product.photo && (
              <p className="mt-3 text-center text-[0.78rem] text-cocoa/55">
                Example photo for inspiration. Your cake will be made to your order.
              </p>
            )}

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-caramel/20 bg-porcelain p-4 text-center">
                <Clock size={16} strokeWidth={1.7} className="mx-auto text-caramel" />
                <p className="mt-2 text-[0.72rem] uppercase tracking-[0.1em] text-cocoa/50">Lead time</p>
                <p className="mt-0.5 text-[0.9rem] font-medium text-espresso">
                  {product.leadDays} {product.leadDays === 1 ? 'day' : 'days'}
                </p>
              </div>
              <div className="rounded-2xl border border-caramel/20 bg-porcelain p-4 text-center">
                <Sparkles size={16} strokeWidth={1.7} className="mx-auto text-caramel" />
                <p className="mt-2 text-[0.72rem] uppercase tracking-[0.1em] text-cocoa/50">Serves</p>
                <p className="mt-0.5 text-[0.9rem] font-medium text-espresso">{size.serves}</p>
              </div>
              <div className="rounded-2xl border border-caramel/20 bg-porcelain p-4 text-center">
                <Truck size={16} strokeWidth={1.7} className="mx-auto text-caramel" />
                <p className="mt-2 text-[0.72rem] uppercase tracking-[0.1em] text-cocoa/50">Delivery</p>
                <p className="mt-0.5 text-[0.9rem] font-medium text-espresso">Kigali-wide</p>
              </div>
            </div>
          </div>

          {/* -------------------------------------------- customiser */}
          <div>
            <p className="eyebrow text-caramel">{category?.name}</p>
            <h1 className="mt-3 text-[clamp(2rem,4.4vw,3rem)] leading-[1.08] text-espresso">
              {product.name}
            </h1>
            <p className="mt-2 font-display text-[1.1rem] italic text-caramel">{product.tagline}</p>

            {product.rating && (
              <div className="mt-4 flex items-center gap-3">
                <Stars value={product.rating} size={15} className="text-gold" />
                <span className="text-[0.82rem] text-cocoa/60">
                  {product.rating} · {product.reviews} reviews
                </span>
              </div>
            )}

            <p className="mt-6 text-[1rem] leading-relaxed text-cocoa/70">{product.description}</p>

            <div className="mt-6 flex flex-wrap gap-2">
              {product.tags?.map((t) => (
                <Pill key={t} tone="outline">
                  {t}
                </Pill>
              ))}
            </div>

            {/* ---------------------------------------------- size */}
            <fieldset className="mt-9">
              <legend className="eyebrow text-cocoa/55">Choose a size</legend>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {product.sizes.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSizeId(s.id)}
                    aria-pressed={sizeId === s.id}
                    className={classNames(
                      'flex items-center justify-between rounded-2xl border p-4 text-left transition-all duration-300',
                      sizeId === s.id
                        ? 'border-espresso bg-espresso text-cream shadow-soft'
                        : 'border-caramel/25 bg-porcelain hover:border-caramel',
                    )}
                  >
                    <span>
                      <span className="block text-[0.9rem] font-medium">{s.label}</span>
                      <span
                        className={classNames(
                          'mt-0.5 block text-[0.75rem]',
                          sizeId === s.id ? 'text-cream/60' : 'text-cocoa/50',
                        )}
                      >
                        {s.serves}
                      </span>
                    </span>
                    <span className="shrink-0 font-display text-[1.05rem] tabular-nums">
                      {money(s.price)}
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>

            {/* -------------------------------------------- flavour */}
            {product.flavors?.length > 0 && (
              <fieldset className="mt-8">
                <legend className="eyebrow text-cocoa/55">Flavour</legend>
                <div className="mt-4 flex flex-wrap gap-2">
                  {product.flavors.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFlavorId(f.id)}
                      aria-pressed={flavorId === f.id}
                      className={classNames(
                        'flex items-center gap-2 rounded-full border px-4 py-2.5 text-[0.83rem] transition-all duration-300',
                        flavorId === f.id
                          ? 'border-caramel bg-caramel/18 font-medium text-espresso'
                          : 'border-caramel/25 bg-porcelain text-cocoa/75 hover:border-caramel',
                      )}
                    >
                      {PALETTES[f.id] && (
                        <span
                          aria-hidden="true"
                          className="h-3.5 w-3.5 rounded-full ring-1 ring-black/10"
                          style={{
                            background: `linear-gradient(135deg, ${PALETTES[f.id].sponge[0]}, ${PALETTES[f.id].icing[1]})`,
                          }}
                        />
                      )}
                      {f.label}
                      {f.delta > 0 && (
                        <span className="text-[0.72rem] text-caramel">+{money(f.delta)}</span>
                      )}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            {/* ------------------------------------------- frosting */}
            {product.frostings?.length > 0 && (
              <fieldset className="mt-8">
                <legend className="eyebrow text-cocoa/55">Finish</legend>
                <div className="mt-4 flex flex-wrap gap-2">
                  {product.frostings.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFrostingId(f.id)}
                      aria-pressed={frostingId === f.id}
                      className={classNames(
                        'rounded-full border px-4 py-2.5 text-[0.83rem] transition-all duration-300',
                        frostingId === f.id
                          ? 'border-caramel bg-caramel/18 font-medium text-espresso'
                          : 'border-caramel/25 bg-porcelain text-cocoa/75 hover:border-caramel',
                      )}
                    >
                      {f.label}
                      {f.delta > 0 && (
                        <span className="ml-1.5 text-[0.72rem] text-caramel">+{money(f.delta)}</span>
                      )}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            {/* --------------------------------------------- addons */}
            {product.addons?.length > 0 && (
              <fieldset className="mt-8">
                <legend className="eyebrow text-cocoa/55">Finishing touches</legend>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {product.addons.map((a) => {
                    const checked = addonIds.includes(a.id)
                    return (
                      <label
                        key={a.id}
                        className={classNames(
                          'flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-[0.85rem] transition-all duration-300',
                          checked
                            ? 'border-caramel bg-caramel/12'
                            : 'border-caramel/22 bg-porcelain hover:border-caramel/50',
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleAddon(a.id)}
                          className="sr-only"
                        />
                        <span
                          aria-hidden="true"
                          className={classNames(
                            'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors',
                            checked ? 'border-espresso bg-espresso text-cream' : 'border-caramel/45',
                          )}
                        >
                          {checked && <Check size={13} strokeWidth={3} />}
                        </span>
                        <span className="flex-1 text-cocoa/80">{a.label}</span>
                        <span className="shrink-0 text-[0.78rem] font-medium text-caramel">
                          +{money(a.price)}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </fieldset>
            )}

            {/* -------------------------------------------- message */}
            {product.allowsMessage && (
              <div className="mt-8">
                <label htmlFor="cake-message" className="eyebrow text-cocoa/55">
                  Message on the cake
                </label>
                <input
                  id="cake-message"
                  type="text"
                  maxLength={60}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Happy Birthday, Keza!"
                  className="mt-3 h-12 w-full rounded-xl border border-caramel/25 bg-porcelain px-4 text-[0.9rem] text-espresso placeholder:text-cocoa/35 focus:border-caramel focus:outline-none"
                />
                <p className="mt-1.5 text-right text-[0.7rem] text-cocoa/45">{message.length}/60</p>
              </div>
            )}

            {product.customBrief && (
              <div className="mt-6">
                <label htmlFor="brief" className="eyebrow text-cocoa/55">
                  Tell us your idea
                </label>
                <textarea
                  id="brief"
                  rows={4}
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  placeholder="Theme, colours, a reference you have seen, the guest of honour's favourite thing…"
                  className="mt-3 w-full rounded-xl border border-caramel/25 bg-porcelain p-4 text-[0.9rem] leading-relaxed text-espresso placeholder:text-cocoa/35 focus:border-caramel focus:outline-none"
                />
                <p className="mt-2 text-[0.78rem] text-cocoa/55">
                  We will reply with a sketch and a firm quote before anything is baked.
                </p>
              </div>
            )}

            {/* ------------------------------------------ add to bag */}
            <div className="mt-10 rounded-[1.5rem] border border-caramel/25 bg-porcelain p-5 shadow-soft">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-[0.72rem] uppercase tracking-[0.14em] text-cocoa/45">
                    Total for {quantity} × {size.label}
                  </p>
                  <p className="mt-1 font-display text-[2rem] leading-none text-espresso tabular-nums">
                    {money(unitPrice * quantity)}
                  </p>
                </div>

                <div className="flex items-center rounded-full border border-caramel/30 bg-cream">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="flex h-11 w-11 items-center justify-center rounded-full text-cocoa transition-colors hover:bg-blush disabled:opacity-35"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={15} />
                  </button>
                  <span className="w-9 text-center text-[0.95rem] tabular-nums">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                    className="flex h-11 w-11 items-center justify-center rounded-full text-cocoa transition-colors hover:bg-blush"
                    aria-label="Increase quantity"
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>

              <Button onClick={handleAdd} size="lg" className="mt-5 w-full" sheen>
                {added ? (
                  <>
                    <Check size={18} strokeWidth={2.4} /> Added to your basket
                  </>
                ) : (
                  <>
                    <ShoppingBag size={17} strokeWidth={1.9} /> Add to basket
                  </>
                )}
              </Button>

              <p className="mt-3 text-center text-[0.78rem] text-cocoa/55">
                We need at least {product.leadDays}{' '}
                {product.leadDays === 1 ? 'day' : 'days'} notice · free delivery over{' '}
                {money(fulfilment.freeDeliveryOver)}
              </p>
            </div>

            {/* ----------------------------------------------- tabs */}
            <div className="mt-12">
              <div className="flex flex-wrap gap-x-6 gap-y-2 border-b border-caramel/22">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={classNames(
                      'relative -mb-px border-b-2 pb-3 text-[0.85rem] font-medium transition-colors',
                      tab === t.id
                        ? 'border-caramel text-espresso'
                        : 'border-transparent text-cocoa/50 hover:text-espresso',
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="pt-5 text-[0.9375rem] leading-relaxed text-cocoa/70">
                {tab === 'about' && (
                  <div className="space-y-3">
                    <p>{product.description}</p>
                    <p>
                      Your order is prepared for your chosen date. Tell us if you have a favourite flavour, colour or finishing touch in mind.
                    </p>
                  </div>
                )}
                {tab === 'ingredients' && (
                  <div className="space-y-3">
                    <p>
                      Ingredients vary depending on your choice of flavour, filling and decorations. Ask us for the full ingredient details before ordering.
                    </p>
                    <p>
                      <strong className="font-medium text-espresso">Allergens:</strong> contains
                      dairy, eggs, gluten and may contain nuts. Our kitchen handles all four, so we
                      cannot promise an allergen-free environment. Eggless and lower-sugar versions
                      are available if you ask; add a note at checkout.
                    </p>
                  </div>
                )}
                {tab === 'care' && (
                  <div className="space-y-3">
                    <p>
                      Keep buttercream and ganache cakes in the fridge, then bring them out 45
                      minutes before serving. That is when they taste best.
                    </p>
                    <p>
                      Cookies, brownies and macarons keep in a sealed box at room temperature for
                      three or four days. Wedding tiers arrive assembled and should stay cool and out
                      of the sun until you cut them.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-blush/40 py-16 md:py-20">
        <div className="container-x">
          <div className="text-center">
            <p className="eyebrow text-caramel">You might also like</p>
            <h2 className="mt-4 text-[clamp(1.6rem,3.4vw,2.4rem)] text-espresso">
              More from the kitchen
            </h2>
            <Flourish className="mt-6" />
          </div>

          <div className="mt-11 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p, i) => (
              <ProductCard key={p.slug} product={p} index={i} />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

/** Shown while the live menu loads, so a valid product never flashes a 404. */
function ProductSkeleton() {
  return (
    <div className="bg-cream pb-24 pt-32">
      <div className="container-x grid gap-12 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="aspect-square animate-pulse rounded-[2rem] bg-blush/60" />
        <div className="space-y-4">
          <div className="h-4 w-24 animate-pulse rounded bg-blush/60" />
          <div className="h-12 w-3/4 animate-pulse rounded bg-blush/60" />
          <div className="h-4 w-full animate-pulse rounded bg-blush/50" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-blush/50" />
          <div className="mt-8 grid gap-2 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-blush/50" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
