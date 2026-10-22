import { PHOTOS } from '../data/photography'

export default function HeroCake() {
  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-[29rem] overflow-hidden rounded-[2.25rem] border border-cream/15 bg-deep-2 shadow-[0_36px_90px_rgba(0,0,0,0.38)] lg:max-w-none">
      <img
        src={PHOTOS.hero}
        alt="A decorated chocolate cake, shown as an example of bakery photography"
        loading="eager"
        fetchPriority="high"
        decoding="async"
        className="h-full w-full object-cover"
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-deep/30 via-transparent to-transparent" />
    </div>
  )
}
