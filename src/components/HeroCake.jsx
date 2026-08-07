import { Suspense, lazy, useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import CreationArt from '../art/CreationArt'
import { useTheme } from '../context/ThemeContext'

const CakeScene = lazy(() => import('../three/CakeScene'))

/**
 * The 3D cake, loaded only when it makes sense to.
 *
 * three.js is a heavy download and a real workload for the GPU, so we skip it
 * on small screens, when the visitor has asked for less motion, and on devices
 * without WebGL. In every one of those cases the drawn cake takes its place,
 * which is why the hero never sits empty while a big bundle downloads.
 */
export default function HeroCake() {
  const reduce = useReducedMotion()
  const { isBright } = useTheme()
  const [use3d, setUse3d] = useState(false)

  useEffect(() => {
    if (reduce) return

    const wideEnough = window.matchMedia('(min-width: 768px)').matches
    if (!wideEnough) return

    // A machine that reports very few cores tends to struggle with this.
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) return

    let supported = false
    try {
      const canvas = document.createElement('canvas')
      supported = Boolean(
        canvas.getContext('webgl2') ||
          canvas.getContext('webgl') ||
          canvas.getContext('experimental-webgl'),
      )
    } catch {
      supported = false
    }

    setUse3d(supported)
  }, [reduce])

  if (!use3d) {
    return (
      <CreationArt
        variant="dripCake"
        flavor="chocolate"
        seed="hero-cake"
        title="A chocolate drip cake"
        className="w-full drop-shadow-[0_40px_60px_rgba(0,0,0,0.28)]"
      />
    )
  }

  return (
    <div className="relative aspect-square w-full cursor-grab active:cursor-grabbing">
      <Suspense
        fallback={
          <CreationArt
            variant="dripCake"
            flavor="chocolate"
            seed="hero-cake"
            className="h-full w-full"
          />
        }
      >
        <CakeScene bright={isBright} />
      </Suspense>

      <span className="pointer-events-none absolute inset-x-0 bottom-1 text-center text-[0.68rem] uppercase tracking-[0.18em] text-on-deep/35">
        Drag to turn
      </span>
    </div>
  )
}
