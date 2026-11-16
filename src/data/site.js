/**
 * Single source of truth for business details.
 * Change these values and they propagate across the whole site.
 */

export const BRAND_ASSETS = {
  logo: '/brand/dussa-bakelab-logo.png',
  mark: '/brand/dussa-bakelab-mark.png',
}

export const BRAND = {
  name: 'Dussa BakeLab',
  shortName: 'Dussa',
  tagline: 'Made with the finest ingredients, baked to be loved.',
  script: 'Baked to be loved',
  promise: 'Baked in Kigali · Made to share',
  city: 'Kigali',
  country: 'Rwanda',
  description:
    'Cakes, cupcakes and treats, made to order in Kigali for celebrations and everyday sharing.',
  founded: 2021,
  /**
   * An optional dashboard upload overrides the bundled Dussa logo.
   * Set logoHasName when the file already includes "Dussa BakeLab",
   * so the typed wordmark next to it is dropped rather than repeated.
   */
  logoUrl: '',
  logoHasName: false,
}

export const CONTACT = {
  whatsapp: '250788722064', // international format, no "+" — used for wa.me links
  phoneDisplay: '0788 722 064',
  phoneHref: 'tel:+250788722064',
  instagram: 'dussa_bakelab',
  instagramUrl: 'https://www.instagram.com/dussa_bakelab',
  email: 'orders@dussabakelab.com',
  /** Where customers send Mobile Money. Shown in the WhatsApp order confirmation. */
  momoNumber: '+250 788 722 064',
  location: 'Kigali, Rwanda',
  mapQuery: 'Kigali, Rwanda',
}

export const HOURS = [
  { day: 'Monday – Friday', time: '8:00 AM – 7:00 PM' },
  { day: 'Saturday', time: '9:00 AM – 8:00 PM' },
  { day: 'Sunday', time: '10:00 AM – 5:00 PM · pickups only' },
]

export const FULFILMENT = {
  /** Minimum notice, in days, before a booked collection/delivery date. */
  leadDays: { standard: 2, custom: 4, wedding: 14 },
  deliveryFee: 3000,
  freeDeliveryOver: 60000,
  deliveryZones: [
    'Kigali city centre',
    'Kimihurura · Kacyiru · Remera',
    'Nyarutarama · Gacuriro · Kibagabaga',
    'Gisozi · Kinyinya · Kagugu',
    'Nyamirambo · Kicukiro · Kanombe',
  ],
  depositPercent: 50,
  payments: ['MTN Mobile Money', 'Airtel Money', 'Bank transfer', 'Cash on collection'],
}

export const NAV_LINKS = [
  { label: 'Menu', to: '/creations' },
  { label: 'Order', to: '/order' },
  { label: 'Our story', to: '/about' },
  { label: 'Track order', to: '/track' },
  { label: 'Contact', to: '/contact' },
]

/** Money is quoted in Rwandan francs everywhere on the site. */
export const CURRENCY = { code: 'RWF', symbol: 'RWF' }
