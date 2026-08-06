import { InstagramIcon } from '../components/BrandIcons'
import CreationArt from '../art/CreationArt'
import { GALLERY } from '../data/content'
import { useCatalog } from '../context/CatalogContext'
import { Eyebrow } from '../components/ui'

/** The moving shelf of what came out of the oven today. */
export default function GalleryStrip() {
  const { gallery, contact } = useCatalog()

  // Real photos win when the bakery has uploaded some; otherwise the drawings
  // keep the shelf full rather than leaving a gap on the page.
  const usingPhotos = gallery.length > 0
  const items = usingPhotos ? gallery : GALLERY
  const row = [...items, ...items]

  const instagramUrl = contact.instagramUrl || `https://www.instagram.com/${contact.instagram}`

  return (
    <section className="grain relative overflow-hidden bg-espresso py-16 text-cream">
      <div className="container-x flex flex-wrap items-end justify-between gap-6">
        <div>
          <Eyebrow tone="text-gold">Fresh from the oven</Eyebrow>
          <h2 className="mt-4 text-[clamp(1.7rem,3.4vw,2.4rem)] text-cream">Today on the shelf</h2>
        </div>
        <a
          href={instagramUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-2 rounded-full border border-cream/22 px-5 py-2.5 text-[0.85rem] text-cream/80 transition-all hover:border-gold hover:bg-gold hover:text-espresso"
        >
          <InstagramIcon size={16} strokeWidth={1.8} />@{contact.instagram}
        </a>
      </div>

      <div className="pause-on-hover relative mt-11 flex overflow-hidden">
        <div className="animate-marquee flex shrink-0" style={{ '--marquee-duration': '52s' }}>
          {row.map((item, i) => (
            <figure
              key={i}
              className="group mx-2.5 w-40 shrink-0 md:w-52"
              aria-hidden={i >= items.length}
            >
              <div className="overflow-hidden rounded-2xl border border-cream/12 bg-cocoa/45 p-3 transition-all duration-500 group-hover:border-gold/50 group-hover:bg-cocoa/70">
                <div className="overflow-hidden rounded-xl transition-transform duration-500 group-hover:scale-105">
                  {usingPhotos ? (
                    <img
                      src={item.url}
                      alt={item.caption || ''}
                      loading="lazy"
                      decoding="async"
                      className="aspect-square w-full object-cover"
                    />
                  ) : (
                    <CreationArt
                      variant={item.art}
                      flavor={item.flavorArt}
                      seed={`gal-${i}`}
                      backdrop={false}
                      className="w-full"
                    />
                  )}
                </div>
              </div>
              {item.caption && (
                <figcaption className="mt-3 text-center text-[0.75rem] tracking-[0.08em] text-cream/45 uppercase">
                  {item.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      </div>

      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-espresso to-transparent md:w-40" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-espresso to-transparent md:w-40" />
    </section>
  )
}
