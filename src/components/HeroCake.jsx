import { Suspense, lazy, useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import CreationArt from '../art/CreationArt'
import { useTheme } from '../context/ThemeContext'

const CakeScene = lazy(() => import('../three/CakeScene'))

/**
 * The 3D cake.
 *
 * Phones get it too — the same cake at a lighter setting rather than a flat
 * drawing instead, which is what used to happen and left the hero looking
 * empty on a phone. The drawing is still there for anyone who has asked for
 * less motion or whose browser cannot do WebGL, and it fills the space while
 * the three.js chunk downloads.
 */
export default function HeroCake() {
  const reduce = useReducedMotion()
  const { isBright } = useTheme()
  const [mode, setMode] = useState('art')

  useEffect(() => {
    if (reduce) return

    let supported = false
    try {
      const canvas = document.createElement('canvas')
      supported = Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
    } catch {
      supported = false
    }
    if (!supported) return

    // Phones and low-core machines run the same scene with fewer polygons, no
    // shadow map and a lower pixel ratio. Anything genuinely weak still falls
    // back to the drawing.
    const cores = navigator.hardwareConcurrency || 4
    if (cores < 3) return

    const wide = window.matchMedia('(min-width: 768px)').matches
    setMode(wide && cores >= 4 ? 'high' : 'low')
  }, [reduce])

  const drawing = (
    <CreationArt
      variant="dripCake"
      flavor="chocolate"
      seed="hero-cake"
      title="A chocolate drip cake"
      className="h-full w-full"
    />
  )

  if (mode === 'art') {
    return (
      <div className="mx-auto w-full max-w-[26rem] drop-shadow-[0_40px_60px_rgba(0,0,0,0.28)] md:max-w-none">
        {drawing}
      </div>
    )
  }

  return (
    /* Capped against the viewport as well as the column: on a short laptop
       window a square box is taller than the screen, and the cake ends up
       hanging below the fold. Fit inside the canvas handles the new shape. */
    <div className="relative mx-auto aspect-square max-h-[68svh] w-full cursor-grab active:cursor-grabbing">
      <Suspense fallback={<div className="h-full w-full p-6 opacity-60">{drawing}</div>}>
        <CakeScene bright={isBright} quality={mode} />
      </Suspense>

      <span className="pointer-events-none absolute inset-x-0 -bottom-1 hidden text-center text-[0.66rem] uppercase tracking-[0.18em] text-on-deep/30 md:block">
        Drag to turn
      </span>
    </div>
  )
}
