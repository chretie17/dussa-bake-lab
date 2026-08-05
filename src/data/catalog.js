/**
 * The Dussa BakeLab menu.
 *
 * Every product carries its own option sets, so the customiser and the price
 * calculator stay entirely data-driven — add an item here and it appears in the
 * catalogue, the search, the occasion finder and the order flow automatically.
 *
 * `art` picks an illustration from src/art/CreationArt.jsx and `flavorArt` picks
 * its palette. To use a real photograph instead, drop the file in
 * public/images/ and set `photo: '/images/your-file.jpg'` — see README.
 */

export const CATEGORIES = [
  {
    id: 'cakes',
    name: 'Cakes',
    blurb: 'for all occasions',
    description:
      'Tall, tender layers finished by hand — the centrepiece of every celebration we bake for.',
    art: 'dripCake',
    flavorArt: 'chocolate',
  },
  {
    id: 'cupcakes',
    name: 'Cupcakes',
    blurb: 'beautifully made',
    description:
      'Individually piped, boxed with care, and impossible to eat just one of.',
    art: 'cupcake',
    flavorArt: 'vanilla',
  },
  {
    id: 'cookies',
    name: 'Cookies',
    blurb: 'baked to perfection',
    description:
      'Crisp at the edge, molten in the middle, still warm when we can manage it.',
    art: 'cookieStack',
    flavorArt: 'caramel',
  },
  {
    id: 'treats',
    name: 'Treats',
    blurb: 'small & sweet',
    description:
      'Brownies, macarons, doughnuts and cheesecakes for the everyday cravings.',
    art: 'macarons',
    flavorArt: 'berry',
  },
  {
    id: 'custom',
    name: 'Custom orders',
    blurb: 'made just for you',
    description:
      'Tiered, sculpted, themed or entirely your own idea — designed with you from sketch to slice.',
    art: 'tieredCake',
    flavorArt: 'ivory',
  },
]

const CAKE_FLAVORS = [
  { id: 'chocolate', label: 'Belgian chocolate', delta: 0 },
  { id: 'vanilla', label: 'Madagascan vanilla', delta: 0 },
  { id: 'redVelvet', label: 'Red velvet', delta: 3000 },
  { id: 'caramel', label: 'Salted caramel', delta: 3000 },
  { id: 'coffee', label: 'Coffee & cocoa', delta: 2000 },
  { id: 'lemon', label: 'Lemon & passion fruit', delta: 2500 },
  { id: 'strawberry', label: 'Strawberry cream', delta: 3000 },
  { id: 'matcha', label: 'Matcha white chocolate', delta: 4000 },
]

const FROSTINGS = [
  { id: 'buttercream', label: 'Silk buttercream', delta: 0 },
  { id: 'ganache', label: 'Whipped ganache', delta: 4000 },
  { id: 'creamcheese', label: 'Cream cheese frosting', delta: 3000 },
  { id: 'fondant', label: 'Smooth fondant finish', delta: 8000 },
  { id: 'naked', label: 'Naked / semi-naked', delta: 0 },
]

const CAKE_ADDONS = [
  { id: 'message', label: 'Hand-piped message plaque', price: 2500 },
  { id: 'flowers', label: 'Fresh edible flowers', price: 6000 },
  { id: 'gold', label: '24k edible gold leaf', price: 9000 },
  { id: 'photo', label: 'Edible photo print', price: 7000 },
  { id: 'candles', label: 'Candles & sparkler set', price: 2000 },
  { id: 'box', label: 'Premium gift box & ribbon', price: 3500 },
]

const BOX_ADDONS = [
  { id: 'box', label: 'Premium gift box & ribbon', price: 3500 },
  { id: 'note', label: 'Handwritten gift note', price: 1000 },
  { id: 'mixed', label: 'Mixed-flavour selection', price: 2000 },
]

export const PRODUCTS = [
  /* ------------------------------- CAKES ------------------------------- */
  {
    slug: 'signature-chocolate-drip',
    name: 'Signature Chocolate Drip',
    category: 'cakes',
    tagline: 'The one on the poster',
    description:
      'Four layers of dark Belgian chocolate sponge under whipped ganache, finished with a slow chocolate drip, piped rosettes and shards of couverture. This is the cake that built Dussa BakeLab.',
    art: 'dripCake',
    flavorArt: 'chocolate',
    bestseller: true,
    rating: 4.9,
    reviews: 128,
    leadDays: 2,
    tags: ['Chocolate', 'Crowd pleaser', 'Birthday'],
    occasions: ['birthday', 'anniversary', 'thanks', 'justbecause'],
    sizes: [
      { id: '6', label: '6" round', serves: '8–10 slices', price: 28000 },
      { id: '8', label: '8" round', serves: '14–18 slices', price: 42000 },
      { id: '10', label: '10" round', serves: '24–30 slices', price: 62000 },
      { id: '12', label: '12" round', serves: '38–45 slices', price: 88000 },
    ],
    flavors: CAKE_FLAVORS,
    frostings: FROSTINGS,
    addons: CAKE_ADDONS,
    allowsMessage: true,
  },
  {
    slug: 'velvet-celebration-cake',
    name: 'Velvet Celebration Cake',
    category: 'cakes',
    tagline: 'Candles included',
    description:
      'Deep red velvet layered with tangy cream cheese frosting, dressed in a shell border, sprinkles and candles. Made for singing around.',
    art: 'celebrationCake',
    flavorArt: 'redVelvet',
    bestseller: true,
    rating: 4.8,
    reviews: 94,
    leadDays: 2,
    tags: ['Red velvet', 'Birthday', 'Kids'],
    occasions: ['birthday', 'graduation', 'baby'],
    sizes: [
      { id: '6', label: '6" round', serves: '8–10 slices', price: 30000 },
      { id: '8', label: '8" round', serves: '14–18 slices', price: 45000 },
      { id: '10', label: '10" round', serves: '24–30 slices', price: 66000 },
    ],
    flavors: CAKE_FLAVORS,
    frostings: FROSTINGS,
    addons: CAKE_ADDONS,
    allowsMessage: true,
  },
  {
    slug: 'ivory-tier-cake',
    name: 'Ivory Tier',
    category: 'cakes',
    tagline: 'Weddings & milestones',
    description:
      'Two or three tiers in ivory buttercream with pearl piping and sugar blossoms. Understated, photogenic and quietly enormous.',
    art: 'tieredCake',
    flavorArt: 'ivory',
    rating: 5,
    reviews: 41,
    leadDays: 14,
    tags: ['Wedding', 'Tiered', 'Elegant'],
    occasions: ['wedding', 'anniversary', 'corporate'],
    sizes: [
      { id: '2t', label: '2 tiers (6" + 8")', serves: '30–40 slices', price: 135000 },
      { id: '3t', label: '3 tiers (6" + 8" + 10")', serves: '60–75 slices', price: 210000 },
      { id: '4t', label: '4 tiers (6"–12")', serves: '100–120 slices', price: 320000 },
    ],
    flavors: CAKE_FLAVORS,
    frostings: FROSTINGS,
    addons: [
      ...CAKE_ADDONS,
      { id: 'tasting', label: 'Pre-wedding tasting box', price: 15000 },
      { id: 'setup', label: 'On-site setup & styling', price: 25000 },
    ],
    allowsMessage: true,
  },
  {
    slug: 'passion-citrus-cake',
    name: 'Passion & Citrus',
    category: 'cakes',
    tagline: 'Bright and tropical',
    description:
      'Lemon sponge soaked in passion fruit syrup, layered with citrus curd and vanilla buttercream. The cake people ask for twice.',
    art: 'dripCake',
    flavorArt: 'lemon',
    rating: 4.7,
    reviews: 63,
    leadDays: 2,
    tags: ['Fruity', 'Light', 'Summer'],
    occasions: ['baby', 'thanks', 'justbecause', 'corporate'],
    sizes: [
      { id: '6', label: '6" round', serves: '8–10 slices', price: 29000 },
      { id: '8', label: '8" round', serves: '14–18 slices', price: 44000 },
      { id: '10', label: '10" round', serves: '24–30 slices', price: 64000 },
    ],
    flavors: CAKE_FLAVORS,
    frostings: FROSTINGS,
    addons: CAKE_ADDONS,
    allowsMessage: true,
  },
  {
    slug: 'midnight-slice-box',
    name: 'Midnight Slice Box',
    category: 'cakes',
    tagline: 'Cake, without the commitment',
    description:
      'Six individually boxed slices across our three signature flavours — the neat answer to an office birthday or a quiet Tuesday.',
    art: 'cakeSlice',
    flavorArt: 'coffee',
    rating: 4.8,
    reviews: 52,
    leadDays: 1,
    tags: ['Gifting', 'Office', 'Sampler'],
    occasions: ['corporate', 'thanks', 'justbecause'],
    sizes: [
      { id: '4', label: 'Box of 4 slices', serves: '4 people', price: 14000 },
      { id: '6', label: 'Box of 6 slices', serves: '6 people', price: 20000 },
      { id: '12', label: 'Box of 12 slices', serves: '12 people', price: 38000 },
    ],
    flavors: CAKE_FLAVORS,
    frostings: [],
    addons: BOX_ADDONS,
    allowsMessage: false,
  },

  /* ------------------------------ CUPCAKES ----------------------------- */
  {
    slug: 'classic-cupcake-box',
    name: 'Classic Cupcake Box',
    category: 'cupcakes',
    tagline: 'Piped tall, boxed neat',
    description:
      'Our everyday hero: soft sponge under a generous swirl of silk buttercream, finished with a cherry or sprinkles. Choose one flavour or let us mix the box.',
    art: 'cupcake',
    flavorArt: 'vanilla',
    bestseller: true,
    rating: 4.9,
    reviews: 176,
    leadDays: 1,
    tags: ['Everyday', 'Gifting', 'Kids'],
    occasions: ['birthday', 'thanks', 'justbecause', 'corporate', 'baby'],
    sizes: [
      { id: '6', label: 'Box of 6', serves: '6 cupcakes', price: 12000 },
      { id: '12', label: 'Box of 12', serves: '12 cupcakes', price: 22000 },
      { id: '24', label: 'Box of 24', serves: '24 cupcakes', price: 41000 },
    ],
    flavors: CAKE_FLAVORS,
    frostings: FROSTINGS.filter((f) => f.id !== 'fondant'),
    addons: BOX_ADDONS,
    allowsMessage: false,
  },
  {
    slug: 'chocolate-hazelnut-cupcakes',
    name: 'Chocolate Hazelnut Cupcakes',
    category: 'cupcakes',
    tagline: 'Filled, not just frosted',
    description:
      'Dark chocolate cupcakes cored and filled with hazelnut praline, topped with a cocoa swirl and a toasted nut.',
    art: 'cupcake',
    flavorArt: 'chocolate',
    rating: 4.9,
    reviews: 88,
    leadDays: 1,
    tags: ['Chocolate', 'Filled', 'Rich'],
    occasions: ['birthday', 'anniversary', 'justbecause'],
    sizes: [
      { id: '6', label: 'Box of 6', serves: '6 cupcakes', price: 15000 },
      { id: '12', label: 'Box of 12', serves: '12 cupcakes', price: 28000 },
    ],
    flavors: CAKE_FLAVORS.filter((f) => ['chocolate', 'coffee', 'caramel'].includes(f.id)),
    frostings: FROSTINGS.filter((f) => f.id !== 'fondant'),
    addons: BOX_ADDONS,
    allowsMessage: false,
  },
  {
    slug: 'garden-party-cupcakes',
    name: 'Garden Party Cupcakes',
    category: 'cupcakes',
    tagline: 'Piped florals, edible petals',
    description:
      'Buttercream roses, ranunculus and leaves piped one at a time in your colour palette. As much a centrepiece as a dessert.',
    art: 'cupcake',
    flavorArt: 'berry',
    rating: 5,
    reviews: 37,
    leadDays: 3,
    tags: ['Floral', 'Bridal', 'Statement'],
    occasions: ['wedding', 'baby', 'anniversary', 'thanks'],
    sizes: [
      { id: '12', label: 'Box of 12', serves: '12 cupcakes', price: 34000 },
      { id: '24', label: 'Box of 24', serves: '24 cupcakes', price: 64000 },
    ],
    flavors: CAKE_FLAVORS,
    frostings: FROSTINGS.filter((f) => f.id !== 'fondant'),
    addons: [...BOX_ADDONS, { id: 'palette', label: 'Bespoke colour palette match', price: 5000 }],
    allowsMessage: false,
  },

  /* ------------------------------- COOKIES ----------------------------- */
  {
    slug: 'brown-butter-chocolate-chip',
    name: 'Brown Butter Chocolate Chip',
    category: 'cookies',
    tagline: 'Crisp edge, molten middle',
    description:
      'Browned butter, two chocolates, a 24-hour rest and a flake of sea salt. Baked to order so they reach you soft.',
    art: 'cookieStack',
    flavorArt: 'caramel',
    bestseller: true,
    rating: 5,
    reviews: 214,
    leadDays: 1,
    tags: ['Bestseller', 'Chewy', 'Sea salt'],
    occasions: ['thanks', 'justbecause', 'corporate', 'birthday'],
    sizes: [
      { id: '6', label: 'Box of 6', serves: '6 cookies', price: 7000 },
      { id: '12', label: 'Box of 12', serves: '12 cookies', price: 13000 },
      { id: '24', label: 'Party box of 24', serves: '24 cookies', price: 24000 },
    ],
    flavors: [
      { id: 'chocolate', label: 'Double chocolate chip', delta: 0 },
      { id: 'caramel', label: 'Brown butter & sea salt', delta: 0 },
      { id: 'vanilla', label: 'White chocolate macadamia', delta: 1000 },
      { id: 'berry', label: 'Raspberry & white chocolate', delta: 1500 },
    ],
    frostings: [],
    addons: BOX_ADDONS,
    allowsMessage: false,
  },
  {
    slug: 'iced-sugar-cookies',
    name: 'Iced Sugar Cookies',
    category: 'cookies',
    tagline: 'Hand-iced, any theme',
    description:
      'Vanilla-bean shortbread cut to your shapes and iced by hand — names, logos, baby feet, graduation caps. Send us a reference and we will draw it.',
    art: 'cookieStack',
    flavorArt: 'ivory',
    rating: 4.9,
    reviews: 69,
    leadDays: 4,
    tags: ['Personalised', 'Favours', 'Gifting'],
    occasions: ['wedding', 'baby', 'graduation', 'corporate'],
    sizes: [
      { id: '12', label: 'Set of 12', serves: '12 cookies', price: 22000 },
      { id: '24', label: 'Set of 24', serves: '24 cookies', price: 40000 },
      { id: '50', label: 'Favour set of 50', serves: '50 cookies', price: 78000 },
    ],
    flavors: [
      { id: 'vanilla', label: 'Vanilla bean shortbread', delta: 0 },
      { id: 'lemon', label: 'Lemon shortbread', delta: 1000 },
      { id: 'chocolate', label: 'Chocolate shortbread', delta: 1000 },
    ],
    frostings: [],
    addons: [
      ...BOX_ADDONS,
      { id: 'logo', label: 'Logo or artwork reproduction', price: 8000 },
      { id: 'sleeve', label: 'Individual sleeves for favours', price: 6000 },
    ],
    allowsMessage: true,
  },

  /* -------------------------------- TREATS ----------------------------- */
  {
    slug: 'fudge-brownie-slab',
    name: 'Fudge Brownie Slab',
    category: 'treats',
    tagline: 'Dense, glossy, unrepentant',
    description:
      '70% dark chocolate brownies with a crackled top and a centre that never quite sets. Cut into generous squares.',
    art: 'brownies',
    flavorArt: 'chocolate',
    bestseller: true,
    rating: 4.9,
    reviews: 143,
    leadDays: 1,
    tags: ['Chocolate', 'Fudgy', 'Sharing'],
    occasions: ['thanks', 'justbecause', 'corporate'],
    sizes: [
      { id: '9', label: 'Tray of 9', serves: '9 squares', price: 15000 },
      { id: '16', label: 'Tray of 16', serves: '16 squares', price: 25000 },
    ],
    flavors: [
      { id: 'chocolate', label: 'Classic dark fudge', delta: 0 },
      { id: 'caramel', label: 'Salted caramel swirl', delta: 2000 },
      { id: 'coffee', label: 'Espresso & walnut', delta: 2000 },
    ],
    frostings: [],
    addons: BOX_ADDONS,
    allowsMessage: false,
  },
  {
    slug: 'macaron-collection',
    name: 'Macaron Collection',
    category: 'treats',
    tagline: 'Twelve tiny obsessions',
    description:
      'Almond shells with a proper foot, matured overnight with ganache and curd fillings. Six flavours, twelve pieces, one box.',
    art: 'macarons',
    flavorArt: 'berry',
    rating: 4.8,
    reviews: 76,
    leadDays: 3,
    tags: ['Delicate', 'Gifting', 'Elegant'],
    occasions: ['wedding', 'anniversary', 'thanks', 'corporate'],
    sizes: [
      { id: '12', label: 'Box of 12', serves: '12 macarons', price: 18000 },
      { id: '24', label: 'Box of 24', serves: '24 macarons', price: 34000 },
    ],
    flavors: [
      { id: 'berry', label: 'Berry selection', delta: 0 },
      { id: 'chocolate', label: 'Chocolate selection', delta: 0 },
      { id: 'lemon', label: 'Citrus selection', delta: 0 },
      { id: 'matcha', label: 'Matcha & pistachio', delta: 2000 },
    ],
    frostings: [],
    addons: BOX_ADDONS,
    allowsMessage: false,
  },
  {
    slug: 'glazed-doughnuts',
    name: 'Glazed Doughnuts',
    category: 'treats',
    tagline: 'Proofed overnight, fried at dawn',
    description:
      'Pillowy brioche doughnuts dipped in glaze while still warm and finished with sprinkles or a dusting of cocoa.',
    art: 'donut',
    flavorArt: 'strawberry',
    rating: 4.7,
    reviews: 91,
    leadDays: 1,
    tags: ['Breakfast', 'Kids', 'Sharing'],
    occasions: ['birthday', 'justbecause', 'corporate'],
    sizes: [
      { id: '6', label: 'Box of 6', serves: '6 doughnuts', price: 9000 },
      { id: '12', label: 'Box of 12', serves: '12 doughnuts', price: 16500 },
    ],
    flavors: [
      { id: 'strawberry', label: 'Strawberry glaze', delta: 0 },
      { id: 'chocolate', label: 'Chocolate glaze', delta: 0 },
      { id: 'vanilla', label: 'Vanilla & sprinkles', delta: 0 },
      { id: 'caramel', label: 'Salted caramel', delta: 1500 },
    ],
    frostings: [],
    addons: BOX_ADDONS,
    allowsMessage: false,
  },
  {
    slug: 'baked-cheesecake',
    name: 'Baked Cheesecake',
    category: 'treats',
    tagline: 'Slow-baked, fruit-topped',
    description:
      'A biscuit base under slow-baked vanilla cheesecake, crowned with seasonal fruit compote. Chilled overnight before it leaves us.',
    art: 'cheesecake',
    flavorArt: 'berry',
    rating: 4.9,
    reviews: 58,
    leadDays: 2,
    tags: ['Dessert', 'Sharing', 'Fruity'],
    occasions: ['anniversary', 'thanks', 'corporate', 'justbecause'],
    sizes: [
      { id: '7', label: '7" round', serves: '10–12 slices', price: 38000 },
      { id: '9', label: '9" round', serves: '16–18 slices', price: 52000 },
    ],
    flavors: [
      { id: 'berry', label: 'Mixed berry compote', delta: 0 },
      { id: 'strawberry', label: 'Strawberry', delta: 0 },
      { id: 'lemon', label: 'Lemon & passion fruit', delta: 1500 },
      { id: 'caramel', label: 'Salted caramel & pecan', delta: 3000 },
    ],
    frostings: [],
    addons: BOX_ADDONS,
    allowsMessage: false,
  },

  /* -------------------------------- CUSTOM ----------------------------- */
  {
    slug: 'bespoke-design-cake',
    name: 'Bespoke Design Cake',
    category: 'custom',
    tagline: 'Your idea, our kitchen',
    description:
      'Bring a reference, a colour, a theme or a half-formed idea. We sketch it, quote it and bake it — sculpted shapes, hand-painted panels, sugar figures and all.',
    art: 'tieredCake',
    flavorArt: 'caramel',
    bestseller: true,
    rating: 5,
    reviews: 47,
    leadDays: 5,
    tags: ['Bespoke', 'Design-led', 'Consultation'],
    occasions: ['birthday', 'wedding', 'corporate', 'graduation', 'baby', 'anniversary'],
    sizes: [
      { id: 'single', label: 'Single tier, custom design', serves: '15–20 slices', price: 65000 },
      { id: 'double', label: 'Two tiers, custom design', serves: '35–45 slices', price: 145000 },
      { id: 'sculpted', label: 'Sculpted / 3D showpiece', serves: 'quoted per design', price: 190000 },
    ],
    flavors: CAKE_FLAVORS,
    frostings: FROSTINGS,
    addons: [
      ...CAKE_ADDONS,
      { id: 'sketch', label: 'Concept sketch before baking', price: 5000 },
      { id: 'setup', label: 'On-site setup & styling', price: 25000 },
    ],
    allowsMessage: true,
    customBrief: true,
  },
  {
    slug: 'corporate-dessert-table',
    name: 'Corporate Dessert Table',
    category: 'custom',
    tagline: 'Branded, styled, delivered',
    description:
      'A full spread built around your brand — logo cookies, branded cupcakes, a centrepiece cake and styling on the day. Priced per guest.',
    art: 'celebrationCake',
    flavorArt: 'ivory',
    rating: 4.9,
    reviews: 23,
    leadDays: 7,
    tags: ['Events', 'Branding', 'Catering'],
    occasions: ['corporate', 'graduation', 'wedding'],
    sizes: [
      { id: '30', label: 'Up to 30 guests', serves: '30 guests', price: 180000 },
      { id: '60', label: 'Up to 60 guests', serves: '60 guests', price: 320000 },
      { id: '100', label: 'Up to 100 guests', serves: '100 guests', price: 520000 },
    ],
    flavors: CAKE_FLAVORS,
    frostings: FROSTINGS,
    addons: [
      { id: 'logo', label: 'Logo reproduction across items', price: 12000 },
      { id: 'setup', label: 'On-site setup & styling', price: 25000 },
      { id: 'stands', label: 'Stand & prop hire', price: 18000 },
    ],
    allowsMessage: true,
    customBrief: true,
  },
]

export const OCCASIONS = [
  {
    id: 'birthday',
    label: 'Birthday',
    note: 'Candles, colour and something everyone recognises.',
    art: 'celebrationCake',
    flavorArt: 'redVelvet',
  },
  {
    id: 'wedding',
    label: 'Wedding',
    note: 'Tiers, tastings and a cake that survives the photos.',
    art: 'tieredCake',
    flavorArt: 'ivory',
  },
  {
    id: 'baby',
    label: 'Baby shower',
    note: 'Soft palettes, iced cookies and gentle flavours.',
    art: 'cupcake',
    flavorArt: 'strawberry',
  },
  {
    id: 'graduation',
    label: 'Graduation',
    note: 'Caps, colours and enough slices for the whole family.',
    art: 'cookieStack',
    flavorArt: 'ivory',
  },
  {
    id: 'corporate',
    label: 'Corporate',
    note: 'Branded, invoiced and delivered on schedule.',
    art: 'macarons',
    flavorArt: 'coffee',
  },
  {
    id: 'anniversary',
    label: 'Anniversary',
    note: 'Grown-up flavours and a quieter kind of beautiful.',
    art: 'cakeSlice',
    flavorArt: 'chocolate',
  },
  {
    id: 'thanks',
    label: 'Thank you',
    note: 'A box that says it better than a message would.',
    art: 'brownies',
    flavorArt: 'caramel',
  },
  {
    id: 'justbecause',
    label: 'Just because',
    note: 'No occasion required. Genuinely.',
    art: 'donut',
    flavorArt: 'strawberry',
  },
]

/* ---------------------------------------------------------------- */
/* Lookups                                                           */
/* ---------------------------------------------------------------- */

export function getProduct(slug) {
  return PRODUCTS.find((p) => p.slug === slug)
}

export function getCategory(id) {
  return CATEGORIES.find((c) => c.id === id)
}

export function productsByCategory(id) {
  return id === 'all' ? PRODUCTS : PRODUCTS.filter((p) => p.category === id)
}

export function productsForOccasion(id) {
  return PRODUCTS.filter((p) => p.occasions?.includes(id))
}

export function bestsellers() {
  return PRODUCTS.filter((p) => p.bestseller)
}

/** Lowest advertised price for a product, used for "from RWF x" labels. */
export function fromPrice(product) {
  return Math.min(...product.sizes.map((s) => s.price))
}

export function priceRange() {
  const all = PRODUCTS.flatMap((p) => p.sizes.map((s) => s.price))
  return { min: Math.min(...all), max: Math.max(...all) }
}

/**
 * Total for one configured line item.
 * Kept pure so the customiser, the cart and the API all agree on the number.
 */
export function computeLinePrice({ product, sizeId, flavorId, frostingId, addonIds = [], quantity = 1 }) {
  if (!product) return 0
  const size = product.sizes.find((s) => s.id === sizeId) || product.sizes[0]
  const flavor = product.flavors?.find((f) => f.id === flavorId)
  const frosting = product.frostings?.find((f) => f.id === frostingId)
  const addons = (product.addons || []).filter((a) => addonIds.includes(a.id))

  const unit =
    (size?.price || 0) +
    (flavor?.delta || 0) +
    (frosting?.delta || 0) +
    addons.reduce((sum, a) => sum + a.price, 0)

  return unit * Math.max(1, Number(quantity) || 1)
}
