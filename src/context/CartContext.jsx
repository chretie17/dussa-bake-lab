import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { FULFILMENT } from '../data/site'

const CART_KEY = 'dussa.cart.v1'
const CartContext = createContext(null)

function readCart() {
  try {
    const raw = localStorage.getItem(CART_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Two configurations of the same product are only "the same line" when every
 * option matches — otherwise a 6" vanilla and a 6" chocolate would merge.
 */
function sameConfiguration(a, b) {
  return (
    a.slug === b.slug &&
    a.sizeId === b.sizeId &&
    a.flavorId === b.flavorId &&
    a.frostingId === b.frostingId &&
    (a.message || '') === (b.message || '') &&
    (a.brief || '') === (b.brief || '') &&
    [...(a.addonIds || [])].sort().join(',') === [...(b.addonIds || [])].sort().join(',')
  )
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart)
  const [isOpen, setIsOpen] = useState(false)
  /** Bumped on every add so the nav badge can pulse. */
  const [lastAdded, setLastAdded] = useState(null)

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items))
    } catch {
      /* private mode — the cart simply won't survive a refresh */
    }
  }, [items])

  const addItem = useCallback((item) => {
    setItems((current) => {
      const index = current.findIndex((existing) => sameConfiguration(existing, item))
      if (index >= 0) {
        const next = [...current]
        const merged = { ...next[index], quantity: next[index].quantity + item.quantity }
        merged.linePrice = merged.unitPrice * merged.quantity
        next[index] = merged
        return next
      }
      return [...current, { ...item, id: makeId() }]
    })
    setLastAdded({ name: item.name, at: Date.now() })
    setIsOpen(true)
  }, [])

  const removeItem = useCallback((id) => {
    setItems((current) => current.filter((i) => i.id !== id))
  }, [])

  const setQuantity = useCallback((id, quantity) => {
    setItems((current) =>
      current
        .map((i) =>
          i.id === id
            ? { ...i, quantity: Math.max(1, quantity), linePrice: i.unitPrice * Math.max(1, quantity) }
            : i,
        )
        .filter((i) => i.quantity > 0),
    )
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const value = useMemo(() => {
    const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
    const count = items.reduce((sum, i) => sum + i.quantity, 0)
    /** The longest lead time in the basket decides the earliest possible date. */
    const leadDays = items.reduce((max, i) => Math.max(max, i.leadDays || 1), FULFILMENT.leadDays.standard)

    return {
      items,
      count,
      subtotal,
      leadDays,
      isOpen,
      lastAdded,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      addItem,
      removeItem,
      setQuantity,
      clear,
    }
  }, [items, isOpen, lastAdded, addItem, removeItem, setQuantity, clear])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used inside <CartProvider>')
  return context
}

/** Delivery is free above a threshold — used by the cart drawer and checkout. */
export function deliveryFeeFor(subtotal, fulfilment) {
  if (fulfilment !== 'delivery') return 0
  // An empty basket has nothing to deliver, so it must not carry a fee.
  if (subtotal <= 0) return 0
  return subtotal >= FULFILMENT.freeDeliveryOver ? 0 : FULFILMENT.deliveryFee
}
