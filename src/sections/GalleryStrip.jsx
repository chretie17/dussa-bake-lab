import { InstagramIcon } from '../components/BrandIcons'
import { GALLERY_PHOTOS } from '../data/photography'
import { useCatalog } from '../context/CatalogContext'
import { Eyebrow } from '../components/ui'

export default function GalleryStrip() {
  const { gallery, contact } = useCatalog()
  const bakeryPhotos = gallery.length > 0
  const items = bakeryPhotos ? gallery : GALLERY_PHOTOS
  const row = [...items, ...items]
  const instagramUrl = contact.instagramUrl || `https://www.instagram.com/${contact.instagram}`

  return (
    <section className="grain relative overflow-hidden bg-deep py-16 text-on-deep">
      <div className="container-x flex flex-wrap items-end justify-between gap-6">
        <div>
          <Eyebrow tone="text-accent">A little inspiration</Eyebrow>
          <h2 className="mt-4 text-[clamp(1.7rem,3.4vw,2.4rem)] text-on-deep">Some sweet ideas</h2>
        </div>
        <a href={instagramUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-2 rounded-full border border-on-deep/22 px-5 py-2.5 text-[0.85rem] text-on-deep/80 transition-all hover:border-accent hover:bg-accent hover:text-espresso">
          <InstagramIcon size={16} strokeWidth={1.8} />@{contact.instagram}
        </a>
      </div>
      <div className="pause-on-hover relative mt-11 flex overflow-hidden">
        <div className="animate-marquee flex shrink-0" style={{ '--marquee-duration': '52s' }}>
          {row.map((item, i) => (
            <figure key={i} className="group mx-2.5 w-40 shrink-0 md:w-52" aria-hidden={i >= items.length}>
              <div className="overflow-hidden rounded-2xl border border-on-deep/12 bg-deep-2/45 p-2 transition-all duration-500 group-hover:border-accent/50">
                <img src={item.url} alt={item.caption || 'Cake and bakery inspiration'} loading="lazy" decoding="async" className="aspect-square w-full rounded-xl object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              {item.caption && <figcaption className="mt-3 text-center text-[0.75rem] uppercase tracking-[0.08em] text-on-deep/55">{item.caption}</figcaption>}
            </figure>
          ))}
        </div>
      </div>
      {!bakeryPhotos && <p className="container-x mt-7 text-center text-[0.78rem] text-on-deep/55">These are inspiration photos. Ask us what we can make for you.</p>}
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-deep to-transparent md:w-40" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-deep to-transparent md:w-40" />
    </section>
  )
}
