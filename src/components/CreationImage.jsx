import { useState } from 'react'
import CreationArt from '../art/CreationArt'
import { classNames } from '../lib/format'

/**
 * Renders a product's photograph when one is configured, and falls back to the
 * illustrated artwork otherwise — including when a photo 404s, so a missing
 * file never leaves a broken image on the page.
 */
export default function CreationImage({
  photo,
  art = 'dripCake',
  flavorArt = 'chocolate',
  alt = '',
  className = '',
  imgClassName = '',
  seed,
  backdrop = true,
  loading = 'lazy',
}) {
  const [failed, setFailed] = useState(false)

  if (photo && !failed) {
    return (
      <img
        src={photo}
        alt={alt}
        loading={loading}
        decoding="async"
        onError={() => setFailed(true)}
        className={classNames('h-full w-full object-cover', className, imgClassName)}
      />
    )
  }

  return (
    <CreationArt
      variant={art}
      flavor={flavorArt}
      seed={seed}
      backdrop={backdrop}
      title={alt || undefined}
      className={classNames('h-full w-full', className)}
    />
  )
}
