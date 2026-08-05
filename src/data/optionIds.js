/**
 * Option lists shared by the admin forms and the API validators.
 *
 * Kept free of React imports on purpose so the serverless functions can import
 * it. `ART_VARIANT_IDS` must stay in step with the variants in
 * src/art/CreationArt.jsx — scripts/test-api.mjs asserts that it does.
 */

export const ART_VARIANTS = [
  { id: 'dripCake', label: 'Drip cake' },
  { id: 'tieredCake', label: 'Tiered cake' },
  { id: 'celebrationCake', label: 'Celebration cake with candles' },
  { id: 'cakeSlice', label: 'Cake slice' },
  { id: 'cupcake', label: 'Cupcake' },
  { id: 'cookieStack', label: 'Cookie stack' },
  { id: 'macarons', label: 'Macarons' },
  { id: 'donut', label: 'Doughnut' },
  { id: 'brownies', label: 'Brownies' },
  { id: 'cheesecake', label: 'Cheesecake' },
]

export const ART_VARIANT_IDS = ART_VARIANTS.map((v) => v.id)

export const ART_PALETTES = [
  { id: 'chocolate', label: 'Chocolate' },
  { id: 'vanilla', label: 'Vanilla' },
  { id: 'redVelvet', label: 'Red velvet' },
  { id: 'strawberry', label: 'Strawberry' },
  { id: 'caramel', label: 'Caramel' },
  { id: 'coffee', label: 'Coffee' },
  { id: 'lemon', label: 'Lemon' },
  { id: 'matcha', label: 'Matcha' },
  { id: 'berry', label: 'Berry' },
  { id: 'ivory', label: 'Ivory' },
]

export const PALETTE_IDS = ART_PALETTES.map((p) => p.id)
