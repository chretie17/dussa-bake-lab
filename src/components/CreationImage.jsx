import { useEffect, useState } from 'react'
import { photoFor } from '../data/photography'
import { classNames } from '../lib/format'

/**
 * Show a real photograph instead of the old generated SVG artwork.
 * Uploaded bakery photos take priority over the example photography.
 */
export default function CreationImage({
  photo, art = 'dripCake', flavorArt = 'chocolate', alt = '',
  className = '', imgClassName = '', seed = '', loading = 'lazy',
}) {
  const [failedSource, setFailedSource] = useState('')
  const fallback = photoFor({ seed, art, flavorArt })
  const original = photo || fallback
  const src = failedSource === original && photo ? fallback : original
  const broken = failedSource === fallback

  useEffect(() => setFailedSource(''), [photo, seed, art, flavorArt])

  if (broken) return (
    <div role="img" aria-label={alt || 'Bakery photograph unavailable'} className={classNames('flex aspect-square h-full w-full items-center justify-center bg-blush px-5 text-center text-sm text-cocoa/60', className)}>
      Photograph coming soon
    </div>
  )

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      onError={() => setFailedSource(src)}
      className={classNames('block aspect-square h-full w-full object-cover', className, imgClassName)}
    />
  )
}
