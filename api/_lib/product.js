import { clean, toNumber } from './http.js'
import { ART_VARIANT_IDS, PALETTE_IDS } from '../../src/data/optionIds.js'

export const CATEGORY_IDS = ['cakes', 'cupcakes', 'cookies', 'treats', 'custom']

export function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

/** Option rows need stable ids; derive one from the label when none is given. */
function optionId(option, fallback) {
  const id = clean(option.id, 40) || slugify(option.label)
  return id || fallback
}

function sanitiseSizes(sizes) {
  if (!Array.isArray(sizes)) return []
  return sizes
    .slice(0, 12)
    .map((s, i) => ({
      id: optionId(s, `size-${i + 1}`),
      label: clean(s.label, 80),
      serves: clean(s.serves, 80),
      price: toNumber(s.price),
    }))
    .filter((s) => s.label)
}

function sanitiseDeltas(options, max = 20) {
  if (!Array.isArray(options)) return []
  return options
    .slice(0, max)
    .map((o, i) => ({
      id: optionId(o, `option-${i + 1}`),
      label: clean(o.label, 80),
      delta: toNumber(o.delta),
    }))
    .filter((o) => o.label)
}

function sanitiseAddons(addons) {
  if (!Array.isArray(addons)) return []
  return addons
    .slice(0, 20)
    .map((a, i) => ({
      id: optionId(a, `addon-${i + 1}`),
      label: clean(a.label, 90),
      price: toNumber(a.price),
    }))
    .filter((a) => a.label)
}

function sanitiseStrings(values, max, length = 40) {
  if (!Array.isArray(values)) return []
  return values
    .slice(0, max)
    .map((v) => clean(v, length))
    .filter(Boolean)
}

/**
 * Turns whatever the admin form submitted into a product the storefront can
 * render safely. Returns `{ product }` or `{ error }` — never a half-built row.
 */
export function sanitiseProduct(input = {}) {
  const slug = slugify(input.slug || input.name)
  if (!slug) return { error: 'A product needs a name.' }

  const name = clean(input.name, 120)
  if (!name) return { error: 'A product needs a name.' }

  const sizes = sanitiseSizes(input.sizes)
  if (sizes.length === 0) {
    return { error: 'Add at least one size with a label and a price.' }
  }
  if (sizes.every((s) => s.price <= 0)) {
    return { error: 'At least one size needs a price above zero.' }
  }

  const category = CATEGORY_IDS.includes(input.category) ? input.category : 'cakes'
  const art = ART_VARIANT_IDS.includes(input.art) ? input.art : 'dripCake'
  const flavorArt = PALETTE_IDS.includes(input.flavorArt) ? input.flavorArt : 'chocolate'

  // Only same-origin paths and absolute http(s) URLs — no javascript:/data: URIs.
  const rawPhoto = clean(input.photo, 500)
  const photo = /^(\/|https?:\/\/)/i.test(rawPhoto) ? rawPhoto : ''

  const rating = Math.min(5, Math.max(0, Number(input.rating) || 0))

  return {
    product: {
      slug,
      name,
      category,
      tagline: clean(input.tagline, 120),
      description: clean(input.description, 1500),
      photo: photo || undefined,
      art,
      flavorArt,
      bestseller: Boolean(input.bestseller),
      active: input.active !== false,
      position: Number.isFinite(Number(input.position)) ? Number(input.position) : 0,
      rating: rating || undefined,
      reviews: toNumber(input.reviews) || undefined,
      leadDays: Math.min(60, Math.max(0, toNumber(input.leadDays) || 1)),
      tags: sanitiseStrings(input.tags, 8, 40),
      occasions: sanitiseStrings(input.occasions, 12, 40),
      sizes,
      flavors: sanitiseDeltas(input.flavors),
      frostings: sanitiseDeltas(input.frostings),
      addons: sanitiseAddons(input.addons),
      allowsMessage: Boolean(input.allowsMessage),
      customBrief: Boolean(input.customBrief),
    },
  }
}

/** Guards the money and lead-time fields the order flow depends on. */
export function sanitiseSettings(input = {}, current = {}) {
  const brand = { ...current.brand, ...(input.brand || {}) }
  const contact = { ...current.contact, ...(input.contact || {}) }
  const fulfilment = { ...current.fulfilment, ...(input.fulfilment || {}) }

  const cleanedBrand = {}
  for (const [key, value] of Object.entries(brand)) {
    if (typeof value === 'number' || typeof value === 'boolean') {
      cleanedBrand[key] = value
    } else {
      cleanedBrand[key] = clean(value, 400)
    }
  }
  // The logo has to be something a browser will actually load, and nothing that
  // could smuggle a javascript: url into every page of the site.
  if (cleanedBrand.logoUrl && !/^(\/|https?:\/\/|data:image\/)/i.test(cleanedBrand.logoUrl)) {
    cleanedBrand.logoUrl = ''
  }

  const cleanedContact = {}
  for (const [key, value] of Object.entries(contact)) {
    cleanedContact[key] = clean(value, 200)
  }
  // The WhatsApp link only works with digits.
  cleanedContact.whatsapp = String(cleanedContact.whatsapp || '').replace(/[^\d]/g, '')

  const gallery = Array.isArray(input.gallery)
    ? input.gallery
        .slice(0, 24)
        .map((g) => ({ url: clean(g.url, 500), caption: clean(g.caption, 90) }))
        .filter((g) => /^(\/|https?:\/\/)/i.test(g.url))
    : current.gallery || []

  return {
    brand: cleanedBrand,
    contact: cleanedContact,
    gallery,
    hours: Array.isArray(input.hours)
      ? input.hours
          .slice(0, 10)
          .map((h) => ({ day: clean(h.day, 60), time: clean(h.time, 60) }))
          .filter((h) => h.day)
      : current.hours || [],
    fulfilment: {
      leadDays: {
        standard: Math.max(0, toNumber(fulfilment.leadDays?.standard)),
        custom: Math.max(0, toNumber(fulfilment.leadDays?.custom)),
        wedding: Math.max(0, toNumber(fulfilment.leadDays?.wedding)),
      },
      deliveryFee: toNumber(fulfilment.deliveryFee),
      freeDeliveryOver: toNumber(fulfilment.freeDeliveryOver),
      depositPercent: Math.min(100, Math.max(0, toNumber(fulfilment.depositPercent))),
      deliveryZones: sanitiseStrings(fulfilment.deliveryZones, 30, 120),
      payments: sanitiseStrings(fulfilment.payments, 10, 60),
    },
  }
}
