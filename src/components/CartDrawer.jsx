import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { money } from '../lib/format'
import { useCatalog } from '../context/CatalogContext'
import CreationImage from './CreationImage'
import { Button } from './ui'

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, setQuantity, subtotal, count } = useCart()
  const { fulfilment } = useCatalog()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isOpen) return undefined
    const onKey = (e) => e.key === 'Escape' && closeCart()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, closeCart])

  const shortfall = fulfilment.freeDeliveryOver - subtotal
  const progress = Math.min(100, (subtotal / fulfilment.freeDeliveryOver) * 100)

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[70]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Your order basket"
        >
          <div className="absolute inset-0 bg-espresso/55 backdrop-blur-sm" onClick={closeCart} />

          <motion.aside
            className="grain absolute inset-y-0 right-0 flex w-[min(26.5rem,94vw)] flex-col bg-cream shadow-lift"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 34 }}
          >
            <header className="relative z-10 flex items-center justify-between border-b border-caramel/20 px-6 py-5">
              <div>
                <p className="eyebrow text-caramel">Your basket</p>
                <h2 className="mt-1 text-xl">
                  {count} {count === 1 ? 'item' : 'items'}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeCart}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-caramel/30 text-espresso transition-colors hover:bg-blush/60"
                aria-label="Close basket"
              >
                <X size={18} strokeWidth={1.7} />
              </button>
            </header>

            {items.length === 0 ? (
              <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blush/70 text-caramel">
                  <ShoppingBag size={30} strokeWidth={1.4} />
                </div>
                <div>
                  <h3 className="text-xl">Nothing sweet in here yet</h3>
                  <p className="mt-2 text-sm text-cocoa/65">
                    Browse the creations and build your box — every item is customisable.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    closeCart()
                    navigate('/creations')
                  }}
                >
                  Explore creations
                </Button>
              </div>
            ) : (
              <>
                <div className="relative z-10 flex-1 space-y-4 overflow-y-auto px-6 py-6">
                  {items.map((item) => (
                    <motion.article
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 40 }}
                      className="flex gap-4 rounded-2xl border border-caramel/20 bg-porcelain/80 p-3"
                    >
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-blush/60">
                        <CreationImage
                          photo={item.photo}
                          art={item.art}
                          flavorArt={item.flavorArt}
                          alt={item.name}
                          seed={item.id}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-display text-[1.05rem] leading-snug">
                          {item.name}
                        </h3>
                        <p className="mt-0.5 truncate text-[0.75rem] text-cocoa/60">
                          {[item.sizeLabel, item.flavorLabel, item.frostingLabel]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                        {item.addonLabels?.length > 0 && (
                          <p className="mt-0.5 truncate text-[0.7rem] text-caramel">
                            + {item.addonLabels.join(', ')}
                          </p>
                        )}

                        <div className="mt-2.5 flex items-center justify-between gap-2">
                          <div className="flex items-center rounded-full border border-caramel/30">
                            <button
                              type="button"
                              onClick={() => setQuantity(item.id, item.quantity - 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-cocoa transition-colors hover:bg-blush/70 disabled:opacity-35"
                              disabled={item.quantity <= 1}
                              aria-label={`Decrease quantity of ${item.name}`}
                            >
                              <Minus size={13} />
                            </button>
                            <span className="w-7 text-center text-sm tabular-nums">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => setQuantity(item.id, item.quantity + 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-cocoa transition-colors hover:bg-blush/70"
                              aria-label={`Increase quantity of ${item.name}`}
                            >
                              <Plus size={13} />
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium tabular-nums">
                              {money(item.unitPrice * item.quantity)}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-cocoa/45 transition-colors hover:bg-red-50 hover:text-red-600"
                              aria-label={`Remove ${item.name}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </div>

                <footer className="relative z-10 space-y-4 border-t border-caramel/20 bg-porcelain/70 px-6 py-5">
                  {shortfall > 0 ? (
                    <div>
                      <p className="text-[0.75rem] text-cocoa/70">
                        Add <strong className="text-espresso">{money(shortfall)}</strong> more for free
                        delivery in Kigali
                      </p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-blush">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-caramel to-gold"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-[0.75rem] font-medium text-green-700">
                      ✓ Free delivery unlocked across Kigali
                    </p>
                  )}

                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-cocoa/70">Subtotal</span>
                    <span className="font-display text-2xl tabular-nums">{money(subtotal)}</span>
                  </div>
                  <p className="text-[0.7rem] text-cocoa/55">
                    Delivery and any deposit are confirmed at the next step.
                  </p>

                  <Button
                    className="w-full"
                    sheen
                    onClick={() => {
                      closeCart()
                      navigate('/order')
                    }}
                  >
                    Continue to booking
                  </Button>
                </footer>
              </>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
