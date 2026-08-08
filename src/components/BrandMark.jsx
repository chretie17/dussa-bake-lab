import { LogoMark, Wordmark } from '../art/Logo'
import { useCatalog } from '../context/CatalogContext'

/**
 * The logo, wherever it appears.
 *
 * Uses the file uploaded in the dashboard when there is one, and falls back to
 * the drawn monogram otherwise — so the site never sits without a logo while
 * settings load, and swapping it never needs a code change.
 *
 * An uploaded file cannot recolour itself for the two themes the way the drawn
 * mark does, which is worth knowing when picking one: a logo on a transparent
 * background works on both, a white-on-white one will not.
 */
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

/**
 * Mark plus name, as used in the navbar and footer. When the uploaded logo
 * already spells the bakery out, the typed wordmark is dropped so the name is
 * not printed twice.
 */
export function BrandLockup({ markClass = 'h-11 w-11', tone, accent, wordClass = '' }) {
  const { brand } = useCatalog()
  const showWordmark = !(brand?.logoUrl && brand?.logoHasName)

  return (
    <>
      <BrandMark className={markClass} tone={tone} accent={accent} />
      {showWordmark ? (
        <Wordmark tone={tone} accent={accent} className={wordClass} />
      ) : (
        <span className="sr-only">{brand?.name || 'Dussa BakeLab'}</span>
      )}
    </>
  )
}

export default BrandMark
