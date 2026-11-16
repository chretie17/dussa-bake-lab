import { LogoMark, Wordmark } from '../art/Logo'
import { BRAND_ASSETS } from '../data/site'
import { useCatalog } from '../context/CatalogContext'

/** Dashboard uploads override the bundled brand assets. */
export function BrandMark({ className = '', tone, accent, ...rest }) {
  const { brand } = useCatalog()

  if (brand?.logoUrl) {
    return (
      <img
        src={brand.logoUrl}
        alt=""
        className={`${className} object-contain`}
        loading="eager"
        {...rest}
      />
    )
  }

  return <LogoMark className={className} tone={tone} accent={accent} {...rest} />
}

/** Compact brand for navigation, drawers and other small spaces. */
export function BrandLockup({ markClass = 'h-11 w-11', tone, accent, wordClass = '' }) {
  const { brand } = useCatalog()
  const hasName = Boolean(brand?.logoUrl && brand?.logoHasName)

  return (
    <span className="inline-flex shrink-0 items-center gap-2.5" role="img" aria-label={brand?.name || 'Dussa BakeLab'}>
      <BrandMark className={hasName ? 'h-12 w-28 sm:w-36' : markClass} tone={tone} accent={accent} />
      {!hasName && <span aria-hidden="true"><Wordmark tone={tone} accent={accent} className={wordClass} /></span>}
    </span>
  )
}

/** Full logo and tagline on a cream ground for readability in either theme. */
export function BrandLogo({ className = '' }) {
  const { brand } = useCatalog()
  return (
    <img
      src={brand?.logoUrl || BRAND_ASSETS.logo}
      alt={brand?.name || 'Dussa BakeLab'}
      width="1254"
      height="1254"
      loading="lazy"
      className={`rounded-2xl bg-[#fff3e9] object-contain p-4 ${className}`}
    />
  )
}

export default BrandMark
