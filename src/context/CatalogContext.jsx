import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { PRODUCTS, CATEGORIES, OCCASIONS } from '../data/catalog'
import { BRAND, CONTACT, FULFILMENT, HOURS } from '../data/site'

const CatalogContext = createContext(null)

/** The menu and settings bundled with the build, used until the API answers. */
const FALLBACK = {
  products: PRODUCTS,
  settings: {
    brand: {
      name: BRAND.name,
      tagline: BRAND.tagline,
      script: BRAND.script,
      description: BRAND.description,
      city: BRAND.city,
      country: BRAND.country,
      founded: BRAND.founded,
      logoUrl: BRAND.logoUrl,
      logoHasName: BRAND.logoHasName,
    },
    contact: { ...CONTACT },
    hours: HOURS,
    fulfilment: {
      leadDays: { ...FULFILMENT.leadDays },
      deliveryFee: FULFILMENT.deliveryFee,
      freeDeliveryOver: FULFILMENT.freeDeliveryOver,
      depositPercent: FULFILMENT.depositPercent,
      deliveryZones: [...FULFILMENT.deliveryZones],
      payments: [...FULFILMENT.payments],
    },
    gallery: [],
  },
}

/**
 * Serves the live menu from /api/catalog, falling back to the menu bundled in
 * the build. The storefront therefore renders correctly on the very first paint
 * and keeps working if the API is unavailable — the bakery's edits simply
 * replace the defaults once they load.
 */
export function CatalogProvider({ children }) {
  const [products, setProducts] = useState(FALLBACK.products)
  const [settings, setSettings] = useState(FALLBACK.settings)
  const [live, setLive] = useState(false)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/catalog')
      if (!res.ok) throw new Error(String(res.status))
      const data = await res.json()

      if (Array.isArray(data.products) && data.products.length > 0) {
        setProducts(data.products)
        setLive(true)
      }
      if (data.settings) setSettings((current) => ({ ...current, ...data.settings }))
    } catch {
      // Static build data is already on screen; nothing to report to the visitor.
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  /**
   * The browser tab follows the uploaded logo. index.html ships the drawn
   * favicon, so there is always one; this only replaces it once the bakery's
   * own settings have loaded.
   */
  useEffect(() => {
    const url = settings?.brand?.logoUrl
    if (!url) return undefined

    const link = document.querySelector("link[rel='icon']") || document.createElement('link')
    const previous = link.getAttribute('href')
    link.rel = 'icon'
    link.href = url
    if (!link.parentNode) document.head.appendChild(link)

    return () => {
      if (previous) link.setAttribute('href', previous)
    }
  }, [settings?.brand?.logoUrl])

  const value = useMemo(() => {
    const bySlug = new Map(products.map((p) => [p.slug, p]))
    const usedCategories = new Set(products.map((p) => p.category))

    return {
      products,
      settings,
      live,
      loading,
      refresh,
      /** Only categories that actually have something in them. */
      categories: CATEGORIES.filter((c) => usedCategories.has(c.id)),
      occasions: OCCASIONS,
      getProduct: (slug) => bySlug.get(slug) || null,
      productsByCategory: (id) => (id === 'all' ? products : products.filter((p) => p.category === id)),
      productsForOccasion: (id) => products.filter((p) => p.occasions?.includes(id)),
      bestsellers: () => products.filter((p) => p.bestseller),
      contact: settings.contact,
      fulfilment: settings.fulfilment,
      hours: settings.hours,
      gallery: settings.gallery || [],
      brand: settings.brand,
    }
  }, [products, settings, live, loading, refresh])

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export function useCatalog() {
  const context = useContext(CatalogContext)
  if (!context) throw new Error('useCatalog must be used inside <CatalogProvider>')
  return context
}
