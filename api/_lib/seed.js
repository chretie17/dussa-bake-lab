import { PRODUCTS } from '../../src/data/catalog.js'
import { BRAND, CONTACT, FULFILMENT, HOURS } from '../../src/data/site.js'
import { countProducts, getSetting, saveProduct, saveSetting } from './db.js'

export const SETTINGS_KEY = 'business'

/** The shape the site and the admin settings form both read. */
export function defaultSettings() {
  return {
    brand: {
      name: BRAND.name,
      tagline: BRAND.tagline,
      script: BRAND.script,
      description: BRAND.description,
      city: BRAND.city,
      country: BRAND.country,
      founded: BRAND.founded,
    },
    contact: { ...CONTACT },
    hours: HOURS.map((h) => ({ ...h })),
    fulfilment: {
      leadDays: { ...FULFILMENT.leadDays },
      deliveryFee: FULFILMENT.deliveryFee,
      freeDeliveryOver: FULFILMENT.freeDeliveryOver,
      depositPercent: FULFILMENT.depositPercent,
      deliveryZones: [...FULFILMENT.deliveryZones],
      payments: [...FULFILMENT.payments],
    },
  }
}

/**
 * First run on an empty database: copy the menu shipped in the repo into
 * Postgres so the bakery has something to edit rather than a blank screen.
 * Safe to call on every request — it exits immediately once rows exist.
 */
export async function seedIfEmpty() {
  const seeded = { products: 0, settings: false }

  if ((await countProducts()) === 0) {
    for (let i = 0; i < PRODUCTS.length; i += 1) {
      await saveProduct({ ...PRODUCTS[i], position: i * 10, active: true })
      seeded.products += 1
    }
  }

  if (!(await getSetting(SETTINGS_KEY))) {
    await saveSetting(SETTINGS_KEY, defaultSettings())
    seeded.settings = true
  }

  return seeded
}

/** Restores a single product to the version shipped in the repo. */
export function factoryProduct(slug) {
  return PRODUCTS.find((p) => p.slug === slug) || null
}
