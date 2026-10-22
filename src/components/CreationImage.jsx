import { useEffect, useState } from 'react'
import { photoFor } from '../data/photography'
import { classNames } from '../lib/format'

/**
 * Real photography throughout the shop. Owner-uploaded photos always take priority.
 * Example photos are only temporary visual references, not Dussa's own products.
 */
export default function CreationImage({
  photo, art = 'dripCake', flavorArt = 'chocolate', alt = '',
  className = '', imgClassName = '', seed = '', loading = 'lazy',
}) {
  const [status, setStatus] = useState('original')
  const fallback = photoFor({ seed, art, flavorArt })
  const source = status === 'original' && photo ? photo : fallback

  useEffect(() => setStatus('original'), [photo, seed, art, flavorArt])

  if (status === 'missing') return (
    <div role="img" aria-label={alt || 'Bakery photograph unavailable'} className={classNames('flex aspect-square h-full w-full items-center justify-center bg-blush px-5 text-center text-sm text-cocoa/60', className)}>
      Photograph coming soon
    </div>
  )

  return (
    <img
      src={source}
      alt={alt}
      loading={loading}
      decoding="async"
      onError={() => setStatus(status === 'original' && photo && photo !== fallback ? 'fallback' : 'missing')}
      className={classNames('block aspect-square h-full w-full object-cover', className, imgClassName)}
    />
  )
}
