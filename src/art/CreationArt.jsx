import { useId, useMemo } from 'react'
import { getPalette, seededRandom } from './palettes'

/* ------------------------------------------------------------------ */
/* Geometry helpers                                                     */
/* ------------------------------------------------------------------ */

/** Piped rosette: a squashed spiral, stroked thick with round caps. */
function spiralPath(cx, cy, r, { turns = 2.1, squash = 0.62, steps = 56 } = {}) {
  let d = ''
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps
    const angle = t * turns * Math.PI * 2 - Math.PI / 2
    const radius = r * (1 - t * 0.86)
    const x = cx + Math.cos(angle) * radius
    const y = cy + Math.sin(angle) * radius * squash
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)} `
  }
  return d.trim()
}

/** A soft dome of frosting with a gently rounded lower edge. */
function pipedDome(cx, y, halfWidth, height) {
  const w = halfWidth
  return [
    `M${cx - w} ${y}`,
    `C${cx - w} ${y - height * 1.35} ${cx + w} ${y - height * 1.35} ${cx + w} ${y}`,
    `C${cx + w * 0.62} ${y + height * 0.42} ${cx - w * 0.62} ${y + height * 0.42} ${cx - w} ${y}`,
    'Z',
  ].join(' ')
}

/**
 * Where the front rim of a top ellipse sits at a given x — used to hang
 * ganache drips off the real silhouette instead of a straight line.
 */
function rimY(x, cx, cy, rx, ry) {
  const t = Math.min(1, Math.abs((x - cx) / rx))
  return cy + ry * Math.sqrt(Math.max(0, 1 - t * t))
}

/* ------------------------------------------------------------------ */
/* Shared pieces                                                        */
/* ------------------------------------------------------------------ */

function CakeStand({ palette, y = 316, width = 128 }) {
  return (
    <g>
      <ellipse cx="200" cy={y + 4} rx={width} ry={width * 0.13} fill="#2A1810" opacity="0.1" />
      <ellipse cx="200" cy={y} rx={width} ry={width * 0.135} fill={palette.plate} />
      <ellipse cx="200" cy={y - 5} rx={width} ry={width * 0.135} fill="#FFFDFA" />
      <path
        d={`M188 ${y} h24 l6 30 h-36 z`}
        fill={palette.plate}
        opacity="0.92"
      />
      <ellipse cx="200" cy={y + 32} rx="46" ry="9" fill="#FFFDFA" />
      <ellipse cx="200" cy={y + 35} rx="46" ry="9" fill={palette.plate} opacity="0.8" />
    </g>
  )
}

function Drips({ gradientId, cx, cy, rx, ry, count = 11, rand }) {
  const drips = useMemo(() => {
    const out = []
    for (let i = 0; i < count; i += 1) {
      const t = (i + 0.5) / count
      const x = cx - rx * 0.94 + rx * 1.88 * t
      const width = 11 + rand() * 12
      const length = 16 + rand() * 46 * (1 - Math.abs(t - 0.5) * 0.5)
      out.push({ x, width, length, y: rimY(x, cx, cy, rx, ry) })
    }
    return out
  }, [count, cx, cy, rx, ry, rand])

  return (
    <g>
      {drips.map((d, i) => (
        <rect
          key={i}
          x={d.x - d.width / 2}
          y={d.y - 14}
          width={d.width}
          height={d.length + 14}
          rx={d.width / 2}
          fill={`url(#${gradientId})`}
        />
      ))}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${gradientId})`} />
      <ellipse
        cx={cx - rx * 0.24}
        cy={cy - ry * 0.3}
        rx={rx * 0.5}
        ry={ry * 0.42}
        fill="#FFFFFF"
        opacity="0.12"
      />
    </g>
  )
}

function Rosettes({ palette, positions, r = 20 }) {
  return (
    <g>
      {positions.map(([x, y, scale = 1], i) => (
        <g key={i}>
          <ellipse cx={x} cy={y + r * 0.5 * scale} rx={r * scale} ry={r * 0.4 * scale} fill="#2A1810" opacity="0.14" />
          <path
            d={spiralPath(x, y, r * scale)}
            fill="none"
            stroke={palette.icing[0]}
            strokeWidth={r * 0.5 * scale}
            strokeLinecap="round"
          />
          <path
            d={spiralPath(x, y - r * 0.12 * scale, r * 0.82 * scale)}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={r * 0.16 * scale}
            strokeLinecap="round"
            opacity="0.18"
          />
        </g>
      ))}
    </g>
  )
}

function Garnish({ palette, rand, count = 7, bounds }) {
  const bits = useMemo(() => {
    const [x0, y0, w, h] = bounds
    return Array.from({ length: count }, () => ({
      x: x0 + rand() * w,
      y: y0 + rand() * h,
      s: 6 + rand() * 9,
      r: rand() * 90 - 45,
    }))
  }, [bounds, count, rand])

  return (
    <g>
      {bits.map((b, i) => (
        <rect
          key={i}
          x={b.x}
          y={b.y}
          width={b.s}
          height={b.s * 0.72}
          rx="1.5"
          fill={i % 2 ? palette.accent : palette.crumb}
          transform={`rotate(${b.r} ${b.x + b.s / 2} ${b.y + b.s / 2})`}
        />
      ))}
    </g>
  )
}

function Sprinkles({ rand, count = 22, bounds, colors }) {
  const bits = useMemo(() => {
    const [x0, y0, w, h] = bounds
    return Array.from({ length: count }, (_, i) => ({
      x: x0 + rand() * w,
      y: y0 + rand() * h,
      r: rand() * 180,
      c: colors[i % colors.length],
    }))
  }, [bounds, colors, count, rand])

  return (
    <g>
      {bits.map((b, i) => (
        <rect
          key={i}
          x={b.x}
          y={b.y}
          width="10"
          height="3.4"
          rx="1.7"
          fill={b.c}
          transform={`rotate(${b.r} ${b.x + 5} ${b.y + 1.7})`}
        />
      ))}
    </g>
  )
}

function Cherry({ x, y, scale = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M0 -6 C4 -18 14 -22 20 -26" stroke="#5E3A21" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="0" cy="0" r="13" fill="#B8322C" />
      <circle cx="0" cy="0" r="13" fill="url(#cherryShade)" />
      <ellipse cx="-4.5" cy="-5" rx="4" ry="2.8" fill="#FFFFFF" opacity="0.55" transform="rotate(-30 -4.5 -5)" />
    </g>
  )
}

function Flowers({ positions, palette }) {
  return (
    <g>
      {positions.map(([x, y, s = 1], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse
              key={a}
              cx="0"
              cy="-9"
              rx="6"
              ry="9"
              fill="#FFFDFA"
              transform={`rotate(${a})`}
              opacity="0.96"
            />
          ))}
          <circle cx="0" cy="0" r="5" fill={palette.accent} />
        </g>
      ))}
    </g>
  )
}

/* ------------------------------------------------------------------ */
/* Variants                                                             */
/* ------------------------------------------------------------------ */

function DripCake({ p, ids, rand }) {
  return (
    <g>
      <CakeStand palette={p} />
      <ellipse cx="200" cy="300" rx="104" ry="27" fill={`url(#${ids.sponge})`} />
      <rect x="96" y="176" width="208" height="124" fill={`url(#${ids.sponge})`} />
      <rect x="96" y="176" width="208" height="124" fill={`url(#${ids.sheen})`} />
      <Drips gradientId={ids.icing} cx={200} cy={176} rx={104} ry={27} rand={rand} />
      <Rosettes
        palette={p}
        positions={[
          [200, 158, 1.05],
          [143, 172, 0.92],
          [257, 172, 0.92],
          [172, 186, 0.86],
          [228, 186, 0.86],
        ]}
      />
      <Garnish palette={p} rand={rand} count={6} bounds={[140, 148, 120, 34]} />
    </g>
  )
}

function TieredCake({ p, ids }) {
  const tiers = [
    { y: 254, w: 100, h: 62 },
    { y: 194, w: 78, h: 58 },
    { y: 142, w: 56, h: 50 },
  ]
  return (
    <g>
      <CakeStand palette={p} width={134} />
      {tiers.map((t, i) => (
        <g key={i}>
          <ellipse cx="200" cy={t.y + t.h} rx={t.w} ry={t.w * 0.2} fill={`url(#${ids.icing})`} />
          <rect x={200 - t.w} y={t.y} width={t.w * 2} height={t.h} fill={`url(#${ids.icing})`} />
          <rect x={200 - t.w} y={t.y} width={t.w * 2} height={t.h} fill={`url(#${ids.sheen})`} />
          <ellipse cx="200" cy={t.y} rx={t.w} ry={t.w * 0.2} fill={p.icing[0]} />
          <ellipse cx="200" cy={t.y} rx={t.w * 0.96} ry={t.w * 0.19} fill="#FFFFFF" opacity="0.16" />
          {/* pearl border piped around the base of each tier */}
          {Array.from({ length: 15 }, (_, k) => {
            const a = Math.PI * (k / 14)
            return (
              <circle
                key={k}
                cx={200 - Math.cos(a) * t.w * 0.99}
                cy={t.y + t.h + Math.sin(a) * t.w * 0.2}
                r={t.w * 0.055}
                fill="#FFFDFA"
                opacity="0.9"
              />
            )
          })}
        </g>
      ))}
      <Flowers
        positions={[
          [200, 132, 1.1],
          [166, 148, 0.85],
          [236, 150, 0.8],
          [148, 204, 0.75],
          [252, 262, 0.8],
        ]}
        palette={p}
      />
    </g>
  )
}

function Cupcake({ p, ids, rand }) {
  return (
    <g>
      <ellipse cx="200" cy="342" rx="96" ry="14" fill="#2A1810" opacity="0.12" />
      {/* wrapper */}
      <path
        d="M128 238 h144 l-18 92 a12 12 0 0 1 -12 10 h-84 a12 12 0 0 1 -12 -10 z"
        fill={`url(#${ids.wrapper})`}
      />
      {Array.from({ length: 9 }, (_, i) => (
        <path
          key={i}
          d={`M${140 + i * 15} 240 l${-2 + i * 0.42} 96`}
          stroke="#2A1810"
          strokeOpacity="0.16"
          strokeWidth="2.4"
        />
      ))}
      <path d="M128 238 h144 l-2 12 h-140 z" fill="#2A1810" opacity="0.14" />
      {/* piped frosting, bottom-up */}
      <path d={pipedDome(200, 244, 82, 40)} fill={`url(#${ids.icing})`} />
      <path d={pipedDome(200, 206, 68, 38)} fill={`url(#${ids.icing})`} />
      <path d={pipedDome(200, 172, 52, 34)} fill={`url(#${ids.icing})`} />
      <path d={pipedDome(200, 144, 34, 28)} fill={`url(#${ids.icing})`} />
      <path
        d="M200 100 c14 8 20 18 18 30 -12 6 -24 6 -36 0 -2 -12 4 -22 18 -30 z"
        fill={p.icing[0]}
      />
      {/* left-side highlight so the swirl reads three-dimensional */}
      <path d={pipedDome(178, 240, 34, 32)} fill="#FFFFFF" opacity="0.13" />
      <path d={pipedDome(184, 200, 26, 28)} fill="#FFFFFF" opacity="0.13" />
      <Sprinkles
        rand={rand}
        count={16}
        bounds={[140, 130, 122, 110]}
        colors={[p.accent, '#FFFDFA', p.crumb, '#D4A574']}
      />
      <Cherry x={200} y={106} scale={1} />
    </g>
  )
}

function CookieStack({ p, ids, rand }) {
  const cookies = [
    { x: 200, y: 300, r: 86, rot: 0 },
    { x: 188, y: 246, r: 82, rot: -8 },
    { x: 212, y: 196, r: 78, rot: 12 },
    { x: 196, y: 150, r: 72, rot: -14 },
  ]
  return (
    <g>
      <ellipse cx="200" cy="342" rx="104" ry="16" fill="#2A1810" opacity="0.12" />
      {cookies.map((c, i) => {
        const chips = Array.from({ length: 7 }, () => {
          const a = rand() * Math.PI * 2
          const d = Math.sqrt(rand()) * c.r * 0.68
          return { x: c.x + Math.cos(a) * d, y: c.y + Math.sin(a) * d * 0.42, s: 6 + rand() * 7 }
        })
        return (
          <g key={i} transform={`rotate(${c.rot} ${c.x} ${c.y})`}>
            <ellipse cx={c.x} cy={c.y + 9} rx={c.r} ry={c.r * 0.34} fill={p.sponge[1]} />
            <ellipse cx={c.x} cy={c.y} rx={c.r} ry={c.r * 0.34} fill={`url(#${ids.sponge})`} />
            <ellipse cx={c.x} cy={c.y - 2} rx={c.r * 0.9} ry={c.r * 0.28} fill="#FFFFFF" opacity="0.09" />
            {chips.map((ch, k) => (
              <ellipse key={k} cx={ch.x} cy={ch.y} rx={ch.s} ry={ch.s * 0.62} fill={p.accent} opacity="0.92" />
            ))}
          </g>
        )
      })}
    </g>
  )
}

function CakeSlice({ p, ids }) {
  /**
   * Front face is the cut, so the layers read as sponge / filling / sponge.
   * The top and the right-hand face carry the frosting, which is what you
   * actually see on a slice lifted off a whole cake.
   */
  const LEFT = 122
  const RIGHT = 258
  const TOP = 186
  const BOTTOM = 292
  const DX = 34
  const DY = 24

  const layers = [
    { h: 28, fill: `url(#${ids.sponge})` },
    { h: 13, fill: p.filling },
    { h: 28, fill: `url(#${ids.sponge})` },
    { h: 13, fill: p.filling },
    { h: 24, fill: `url(#${ids.sponge})` },
  ]

  let y = TOP
  const bands = layers.map((l) => {
    const band = { ...l, y }
    y += l.h
    return band
  })

  return (
    <g>
      <ellipse cx="200" cy="306" rx="126" ry="18" fill="#2A1810" opacity="0.1" />
      <ellipse cx="200" cy="300" rx="128" ry="19" fill="#FFFDFA" />
      <ellipse cx="200" cy="295" rx="128" ry="19" fill={p.plate} />

      {/* right-hand face — the frosted outside of the cake */}
      <path
        d={`M${RIGHT} ${TOP} L${RIGHT + DX} ${TOP - DY} L${RIGHT + DX} ${BOTTOM - DY} L${RIGHT} ${BOTTOM} Z`}
        fill={`url(#${ids.icing})`}
      />
      <path
        d={`M${RIGHT} ${TOP} L${RIGHT + DX} ${TOP - DY} L${RIGHT + DX} ${BOTTOM - DY} L${RIGHT} ${BOTTOM} Z`}
        fill="#000000"
        opacity="0.14"
      />

      {/* front face — the cut, showing every layer */}
      {bands.map((band, i) => (
        <rect
          key={i}
          x={LEFT}
          y={band.y}
          width={RIGHT - LEFT}
          height={band.h + 0.5}
          fill={band.fill}
        />
      ))}
      <rect x={LEFT} y={TOP} width={RIGHT - LEFT} height={BOTTOM - TOP} fill={`url(#${ids.sheen})`} />

      {/* top face — frosting, catching the light */}
      <path
        d={`M${LEFT} ${TOP} L${RIGHT} ${TOP} L${RIGHT + DX} ${TOP - DY} L${LEFT + DX} ${TOP - DY} Z`}
        fill={`url(#${ids.icing})`}
      />
      <path
        d={`M${LEFT} ${TOP} L${RIGHT} ${TOP} L${RIGHT + DX} ${TOP - DY} L${LEFT + DX} ${TOP - DY} Z`}
        fill="#FFFFFF"
        opacity="0.14"
      />

      {/* a lip of frosting spilling over the cut edge */}
      <rect x={LEFT} y={TOP - 4} width={RIGHT - LEFT} height="9" rx="4" fill={p.icing[0]} />

      <Rosettes palette={p} positions={[[210, 172, 0.85]]} r={20} />
      <Cherry x={210} y={152} scale={0.72} />
    </g>
  )
}

function Macarons({ p, ids, rand }) {
  const shells = [
    { x: 132, y: 268, r: 54 },
    { x: 268, y: 262, r: 50 },
    { x: 200, y: 198, r: 58 },
  ]
  return (
    <g>
      <ellipse cx="200" cy="330" rx="118" ry="16" fill="#2A1810" opacity="0.12" />
      {shells.map((s, i) => (
        <g key={i}>
          <ellipse cx={s.x} cy={s.y + s.r * 0.62} rx={s.r} ry={s.r * 0.34} fill={p.sponge[1]} />
          {/* the "foot" — the ruffled ring that makes a macaron a macaron */}
          {Array.from({ length: 9 }, (_, k) => (
            <circle
              key={k}
              cx={s.x - s.r * 0.86 + (k * s.r * 1.72) / 8}
              cy={s.y + s.r * 0.16}
              r={s.r * 0.13}
              fill={p.sponge[1]}
            />
          ))}
          <rect x={s.x - s.r} y={s.y - s.r * 0.06} width={s.r * 2} height={s.r * 0.3} fill={p.icing[0]} rx={s.r * 0.1} />
          <path
            d={`M${s.x - s.r} ${s.y} a ${s.r} ${s.r * 0.72} 0 0 1 ${s.r * 2} 0 z`}
            fill={`url(#${ids.sponge})`}
          />
          <ellipse cx={s.x - s.r * 0.3} cy={s.y - s.r * 0.34} rx={s.r * 0.38} ry={s.r * 0.2} fill="#FFFFFF" opacity="0.2" />
          <path
            d={`M${s.x - s.r} ${s.y + s.r * 0.3} a ${s.r} ${s.r * 0.62} 0 0 0 ${s.r * 2} 0 z`}
            fill={`url(#${ids.sponge})`}
          />
        </g>
      ))}
      <Garnish palette={p} rand={rand} count={4} bounds={[150, 300, 100, 18]} />
    </g>
  )
}

function Donut({ p, ids, rand }) {
  return (
    <g>
      <ellipse cx="200" cy="330" rx="106" ry="15" fill="#2A1810" opacity="0.12" />
      <circle cx="200" cy="222" r="112" fill={p.sponge[1]} />
      <circle cx="200" cy="214" r="112" fill={`url(#${ids.sponge})`} />
      <path
        d="M200 108 a106 106 0 0 1 0 212 a106 106 0 0 1 0 -212 z M200 148 a66 66 0 0 0 0 132 a66 66 0 0 0 0 -132 z"
        fill={`url(#${ids.icing})`}
        fillRule="evenodd"
      />
      {/* wobbly glaze edge */}
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2
        return (
          <circle
            key={i}
            cx={200 + Math.cos(a) * 104}
            cy={214 + Math.sin(a) * 104}
            r={13 + (i % 3) * 3}
            fill={p.icing[0]}
          />
        )
      })}
      <circle cx="200" cy="214" r="44" fill={p.sponge[1]} />
      <circle cx="200" cy="218" r="42" fill={`url(#${ids.sponge})`} />
      <Sprinkles
        rand={rand}
        count={26}
        bounds={[112, 126, 176, 176]}
        colors={['#FFFDFA', p.accent, '#D4A574', p.crumb]}
      />
    </g>
  )
}

function Brownies({ p, ids, rand }) {
  const stack = [
    { x: 118, y: 244, w: 164, h: 54, rot: 0 },
    { x: 128, y: 194, w: 148, h: 50, rot: -4 },
    { x: 140, y: 148, w: 130, h: 46, rot: 5 },
  ]
  return (
    <g>
      <ellipse cx="200" cy="316" rx="112" ry="16" fill="#2A1810" opacity="0.13" />
      {stack.map((s, i) => (
        <g key={i} transform={`rotate(${s.rot} ${s.x + s.w / 2} ${s.y + s.h / 2})`}>
          <rect x={s.x} y={s.y} width={s.w} height={s.h} rx="6" fill={p.sponge[1]} />
          <rect x={s.x} y={s.y} width={s.w} height={s.h * 0.78} rx="6" fill={`url(#${ids.sponge})`} />
          <rect x={s.x} y={s.y} width={s.w} height="12" rx="6" fill={p.icing[0]} />
          <rect x={s.x + 6} y={s.y + 3} width={s.w - 12} height="4" rx="2" fill="#FFFFFF" opacity="0.16" />
        </g>
      ))}
      <Garnish palette={p} rand={rand} count={5} bounds={[150, 126, 108, 24]} />
    </g>
  )
}

function Cheesecake({ p, ids, rand }) {
  return (
    <g>
      <CakeStand palette={p} width={126} />
      <ellipse cx="200" cy="298" rx="106" ry="26" fill={p.sponge[1]} />
      <rect x="94" y="252" width="212" height="46" fill={`url(#${ids.crust})`} />
      <rect x="94" y="196" width="212" height="58" fill={`url(#${ids.sponge})`} />
      <rect x="94" y="196" width="212" height="58" fill={`url(#${ids.sheen})`} />
      <ellipse cx="200" cy="196" rx="106" ry="26" fill={p.icing[0]} />
      <ellipse cx="200" cy="194" rx="98" ry="23" fill={`url(#${ids.icing})`} />
      {/* fruit compote pooled on top */}
      {Array.from({ length: 14 }, (_, i) => {
        const a = rand() * Math.PI * 2
        const d = Math.sqrt(rand()) * 80
        return (
          <circle
            key={i}
            cx={200 + Math.cos(a) * d}
            cy={192 + Math.sin(a) * d * 0.24}
            r={7 + rand() * 6}
            fill={p.accent}
            opacity="0.9"
          />
        )
      })}
      <ellipse cx="170" cy="186" rx="30" ry="8" fill="#FFFFFF" opacity="0.18" />
    </g>
  )
}

function CelebrationCake({ p, ids, rand }) {
  return (
    <g>
      <CakeStand palette={p} width={130} />
      <ellipse cx="200" cy="302" rx="106" ry="27" fill={`url(#${ids.sponge})`} />
      <rect x="94" y="212" width="212" height="90" fill={`url(#${ids.sponge})`} />
      <rect x="94" y="212" width="212" height="90" fill={`url(#${ids.sheen})`} />
      <ellipse cx="200" cy="212" rx="106" ry="27" fill={`url(#${ids.icing})`} />
      <ellipse cx="200" cy="209" rx="98" ry="24" fill="#FFFFFF" opacity="0.12" />
      {/* piped shell border */}
      {Array.from({ length: 17 }, (_, i) => {
        const a = Math.PI * (i / 16)
        return (
          <circle
            key={i}
            cx={200 - Math.cos(a) * 105}
            cy={212 + Math.sin(a) * 26}
            r="10"
            fill={p.icing[0]}
          />
        )
      })}
      {/* candles */}
      {[-56, -19, 19, 56].map((dx, i) => (
        <g key={i}>
          <rect x={200 + dx - 5} y="150" width="10" height="60" rx="4" fill={i % 2 ? '#FFFDFA' : p.accent} />
          <rect x={200 + dx - 5} y="150" width="4" height="60" fill="#FFFFFF" opacity="0.28" />
          <path d={`M${200 + dx} 128 c9 10 6 20 0 22 c-6 -2 -9 -12 0 -22 z`} fill="#F5B342" />
          <path d={`M${200 + dx} 136 c5 6 3 12 0 13 c-3 -1 -5 -7 0 -13 z`} fill="#FFF0C2" />
        </g>
      ))}
      <Sprinkles
        rand={rand}
        count={18}
        bounds={[110, 196, 180, 26]}
        colors={['#FFFDFA', p.accent, '#D4A574', '#B8322C']}
      />
    </g>
  )
}

const VARIANTS = {
  dripCake: DripCake,
  tieredCake: TieredCake,
  cupcake: Cupcake,
  cookieStack: CookieStack,
  cakeSlice: CakeSlice,
  macarons: Macarons,
  donut: Donut,
  brownies: Brownies,
  cheesecake: Cheesecake,
  celebrationCake: CelebrationCake,
}

export const ART_VARIANTS = Object.keys(VARIANTS)

/* ------------------------------------------------------------------ */
/* Component                                                            */
/* ------------------------------------------------------------------ */

export default function CreationArt({
  variant = 'dripCake',
  flavor = 'chocolate',
  seed,
  backdrop = true,
  className = '',
  title,
  ...rest
}) {
  const uid = useId().replace(/[:]/g, '')
  const p = getPalette(flavor)
  const Shape = VARIANTS[variant] || DripCake
  const rand = useMemo(() => seededRandom(seed ?? `${variant}-${flavor}`), [seed, variant, flavor])

  const ids = {
    sponge: `sponge-${uid}`,
    icing: `icing-${uid}`,
    sheen: `sheen-${uid}`,
    wrapper: `wrapper-${uid}`,
    crust: `crust-${uid}`,
    halo: `halo-${uid}`,
  }

  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      role={title ? 'img' : 'presentation'}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
      {...rest}
    >
      <defs>
        <linearGradient id={ids.sponge} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={p.sponge[0]} />
          <stop offset="100%" stopColor={p.sponge[1]} />
        </linearGradient>
        <linearGradient id={ids.icing} x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor={p.icing[0]} />
          <stop offset="100%" stopColor={p.icing[1]} />
        </linearGradient>
        <linearGradient id={ids.crust} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C08B54" />
          <stop offset="100%" stopColor="#96693B" />
        </linearGradient>
        <linearGradient id={ids.wrapper} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8A5F3D" />
          <stop offset="45%" stopColor="#B98A5E" />
          <stop offset="100%" stopColor="#6B4429" />
        </linearGradient>
        {/* Left-lit highlight sweeping across every vertical face */}
        <linearGradient id={ids.sheen} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.22" />
          <stop offset="34%" stopColor="#FFFFFF" stopOpacity="0.04" />
          <stop offset="72%" stopColor="#000000" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.16" />
        </linearGradient>
        <radialGradient id={ids.halo} cx="50%" cy="44%" r="58%">
          <stop offset="0%" stopColor={p.glow} stopOpacity="0.95" />
          <stop offset="70%" stopColor={p.glow} stopOpacity="0.25" />
          <stop offset="100%" stopColor={p.glow} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="cherryShade" cx="34%" cy="30%" r="72%">
          <stop offset="0%" stopColor="#E4665F" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#8E1F1A" stopOpacity="0.9" />
        </radialGradient>
      </defs>

      {backdrop && <circle cx="200" cy="188" r="176" fill={`url(#${ids.halo})`} />}
      <Shape p={p} ids={ids} rand={rand} />
    </svg>
  )
}
