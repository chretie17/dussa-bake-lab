/**
 * Licensed Unsplash example photography, NOT photographs of Dussa orders.
 * Replace with Dussa's own work as original photos become available.
 * https://unsplash.com/license
 */
const image = (id, width = 1100) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=82`

export const PHOTOS = {
  hero: image('photo-1578985545062-69928b1d9587', 1400),
  cake: image('photo-1578985545062-69928b1d9587'),
  birthday: image('photo-1464349095431-e9a21285b5f3'),
  wedding: image('photo-1513278974582-3e1b4a4fa21e'),
  chocolate: image('photo-1587668178277-295251f900ce'),
  slice: image('photo-1571115177098-24ec42ed204d'),
  cupcake: image('photo-1614707267537-b85aaf00c4b7'),
  cookie: image('photo-1499636136210-6f4ee915583e'),
  icedCookie: image('photo-1598839950984-034f6dc7b495'),
  brownie: image('photo-1606313564200-e75d5e30476c'),
  macaron: image('photo-1558326567-98ae2405596b'),
  donut: image('photo-1551024506-0bccd828d307'),
  cheesecake: image('photo-1533134242443-d4fd215305ad'),
}

/**
 * The hero still, in three widths. It is the first thing painted and it stays
 * up while the film loads, so a phone gets 800px and a wide desktop 2000px
 * rather than everyone downloading one size that is too big or too soft.
 */
const HERO_ID = 'photo-1578985545062-69928b1d9587'
export const HERO_PHOTO = {
  src: image(HERO_ID, 1400),
  srcSet: [800, 1400, 2000].map((w) => `${image(HERO_ID, w)} ${w}w`).join(', '),
}

const PRODUCT_PHOTOS = {
  'signature-chocolate-drip': PHOTOS.chocolate,
  'velvet-celebration-cake': PHOTOS.birthday,
  'ivory-tier-cake': PHOTOS.wedding,
  'passion-citrus-cake': PHOTOS.slice,
  'midnight-slice-box': PHOTOS.slice,
  'classic-cupcake-box': PHOTOS.cupcake,
  'chocolate-hazelnut-cupcakes': PHOTOS.cupcake,
  'garden-party-cupcakes': PHOTOS.cupcake,
  'brown-butter-chocolate-chip': PHOTOS.cookie,
  'iced-sugar-cookies': PHOTOS.icedCookie,
  'fudge-brownie-slab': PHOTOS.brownie,
  'macaron-collection': PHOTOS.macaron,
  'glazed-doughnuts': PHOTOS.donut,
  'baked-cheesecake': PHOTOS.cheesecake,
  'bespoke-design-cake': PHOTOS.birthday,
  'corporate-dessert-table': PHOTOS.cake,
}

const CATEGORY_PHOTOS = {
  cakes: PHOTOS.cake,
  cupcakes: PHOTOS.cupcake,
  cookies: PHOTOS.cookie,
  treats: PHOTOS.macaron,
  custom: PHOTOS.wedding,
}
const OCCASION_PHOTOS = {
  birthday: PHOTOS.birthday,
  wedding: PHOTOS.wedding,
  anniversary: PHOTOS.chocolate,
  corporate: PHOTOS.cake,
  graduation: PHOTOS.birthday,
  baby: PHOTOS.cupcake,
  thanks: PHOTOS.cookie,
  justbecause: PHOTOS.cheesecake,
}
const ART_PHOTOS = {
  dripCake: PHOTOS.cake,
  celebrationCake: PHOTOS.birthday,
  tieredCake: PHOTOS.wedding,
  cakeSlice: PHOTOS.slice,
  cupcake: PHOTOS.cupcake,
  cookieStack: PHOTOS.cookie,
  brownies: PHOTOS.brownie,
  macarons: PHOTOS.macaron,
  donut: PHOTOS.donut,
  cheesecake: PHOTOS.cheesecake,
}
export function photoFor({ photo, seed = '', art = 'dripCake' } = {}) {
  if (photo) return photo
  if (PRODUCT_PHOTOS[seed]) return PRODUCT_PHOTOS[seed]
  if (seed.startsWith('cat-')) return CATEGORY_PHOTOS[seed.slice(4)] || PHOTOS.cake
  if (seed.startsWith('occ-')) return OCCASION_PHOTOS[seed.slice(4)] || PHOTOS.cake
  if (seed === 'story-cupcake' || seed === 'hero-cupcake' || seed === 'cta-left') return PHOTOS.cupcake
  if (seed === 'story-cookie') return PHOTOS.cookie
  if (seed === 'cta-right') return PHOTOS.donut
  if (seed === 'about-hero') return PHOTOS.wedding
  return ART_PHOTOS[art] || PHOTOS.cake
}
export const GALLERY_PHOTOS = [
  { url: PHOTOS.chocolate, caption: 'Chocolate cake' },
  { url: PHOTOS.cupcake, caption: 'Cupcakes' },
  { url: PHOTOS.cookie, caption: 'Cookies' },
  { url: PHOTOS.wedding, caption: 'Celebration cakes' },
  { url: PHOTOS.macaron, caption: 'Macarons' },
  { url: PHOTOS.donut, caption: 'Doughnuts' },
  { url: PHOTOS.cheesecake, caption: 'Cheesecake' },
  { url: PHOTOS.brownie, caption: 'Brownies' },
]
