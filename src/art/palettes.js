/**
 * Flavour palettes for the SVG artwork system.
 *
 * Each palette drives one illustration: `sponge` is the cake crumb, `icing`
 * the frosting/ganache, `accent` the garnish and `glow` the halo behind it.
 */
export const PALETTES = {
  chocolate: {
    sponge: ['#6B4127', '#4A2A18'],
    icing: ['#5C3520', '#331C0F'],
    accent: '#2A1710',
    crumb: '#8A5B39',
    filling: '#F0DCC0',
    glow: '#E8C9A0',
    plate: '#EBDAC7',
  },
  vanilla: {
    sponge: ['#F6E3C4', '#E4C79C'],
    icing: ['#FFF6E9', '#EBD6B8'],
    accent: '#D4A574',
    crumb: '#C79E6E',
    filling: '#E6C79C',
    glow: '#FAE7CC',
    plate: '#F0E2D0',
  },
  redVelvet: {
    sponge: ['#A6362F', '#7A2220'],
    icing: ['#FFF8F0', '#EFD9C6'],
    accent: '#8E2A26',
    crumb: '#C2544A',
    filling: '#FFF8F0',
    glow: '#F3CFC4',
    plate: '#F2DFD3',
  },
  strawberry: {
    sponge: ['#F7D5D2', '#E7ADA9'],
    icing: ['#FCE3E0', '#EDB9B4'],
    accent: '#C9564F',
    crumb: '#E5A7A2',
    filling: '#FFF3F1',
    glow: '#F9DAD6',
    plate: '#F4E3DC',
  },
  caramel: {
    sponge: ['#E6C08A', '#C99B63'],
    icing: ['#D9A75B', '#B07C39'],
    accent: '#8A5F2D',
    crumb: '#D3AA75',
    filling: '#FFF0D8',
    glow: '#F2DBB4',
    plate: '#EFDFC8',
  },
  coffee: {
    sponge: ['#8A6141', '#5E3E28'],
    icing: ['#7A5133', '#4C3020'],
    accent: '#3A2415',
    crumb: '#A2795A',
    filling: '#EFDCC2',
    glow: '#E3C8A6',
    plate: '#EADBC6',
  },
  lemon: {
    sponge: ['#F7E7A8', '#E3CE76'],
    icing: ['#FFF6D2', '#EDDCA1'],
    accent: '#C9A227',
    crumb: '#DFC97F',
    filling: '#FFF9E2',
    glow: '#F8EFC8',
    plate: '#F1E7CF',
  },
  matcha: {
    sponge: ['#C9D6A3', '#A2B378'],
    icing: ['#DCE7BE', '#B4C58C'],
    accent: '#6F8447',
    crumb: '#B7C892',
    filling: '#F3F6E6',
    glow: '#E3EBCD',
    plate: '#E9E9D5',
  },
  berry: {
    sponge: ['#C79BC0', '#9C6C98'],
    icing: ['#E7CFE4', '#C29CBD'],
    accent: '#7A4B75',
    crumb: '#C9A4C4',
    filling: '#F7EDF5',
    glow: '#EBD8E8',
    plate: '#EFE2E9',
  },
  ivory: {
    sponge: ['#FBF2E6', '#EADCC7'],
    icing: ['#FFFCF7', '#F0E4D3'],
    accent: '#C9A87C',
    crumb: '#DCC8AA',
    filling: '#E8D5B8',
    glow: '#F7EEDF',
    plate: '#F1E7D9',
  },
}

export const PALETTE_KEYS = Object.keys(PALETTES)

export function getPalette(name) {
  return PALETTES[name] || PALETTES.chocolate
}

/**
 * Small deterministic PRNG (mulberry32) so garnish scatter is stable across
 * renders — no hydration flicker, no sprinkles jumping on every re-render.
 */
export function seededRandom(seed) {
  let a = typeof seed === 'string' ? hashString(seed) : seed || 1
  return function next() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashString(value) {
  let h = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
