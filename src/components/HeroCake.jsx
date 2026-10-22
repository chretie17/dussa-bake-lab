import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { Pause, Play, ExternalLink } from 'lucide-react'
import { PHOTOS } from '../data/photography'

// YouTube's official privacy-enhanced player, not a copied or downloaded video.
// The footage belongs to Rosie's Dessert Spot, not to Dussa BakeLab.
const VIDEO_ID = '629N793GIIY'
const VIDEO_URL = `https://www.youtube.com/watch?v=${VIDEO_ID}`
const EMBED_URL = `https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=1&mute=1&playsinline=1&controls=0&loop=1&playlist=${VIDEO_ID}&rel=0`

export default function HeroCake() {
  const reduceMotion = useReducedMotion()
  const [playing, setPlaying] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Respect reduced-motion preferences and mobile data-saving settings.
    // Visitors can still opt in to the video with the Play button.
    setPlaying(!reduceMotion && !navigator.connection?.saveData)
  }, [reduceMotion])

  const toggleVideo = () => {
    setPlaying((wasPlaying) => !wasPlaying)
    setLoaded(false)
  }

  return (
    <figure className="relative mx-auto aspect-[4/5] w-full max-w-[29rem] overflow-hidden rounded-[2.25rem] border border-cream/15 bg-deep-2 shadow-[0_36px_90px_rgba(0,0,0,0.38)] lg:max-w-none">
      <img
        src={PHOTOS.hero}
        alt="A decorated chocolate cake"
        loading="eager"
        fetchPriority="high"
        decoding="async"
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${playing && loaded ? 'opacity-0' : 'opacity-100'}`}
      />

      {playing && (
        <iframe
          key={VIDEO_ID}
          title="Gold chocolate drip cake decorating, by Rosie's Dessert Spot"
          src={EMBED_URL}
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => setLoaded(true)}
          className={`absolute left-1/2 top-1/2 h-full w-[225%] -translate-x-1/2 -translate-y-1/2 border-0 transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

      <button
        type="button"
        onClick={toggleVideo}
        className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/35 bg-black/45 text-white shadow-lg backdrop-blur-md transition hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        aria-label={playing ? 'Pause cake decorating video' : 'Play cake decorating video'}
        title={playing ? 'Pause video' : 'Play video'}
      >
        {playing ? <Pause size={17} fill="currentColor" aria-hidden="true" /> : <Play size={17} fill="currentColor" aria-hidden="true" />}
      </button>

      <figcaption className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-4 px-5 pb-6 text-white md:px-7 md:pb-8">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-amber-200">Cake in the making</p>
          <p className="mt-1 text-xs text-white/85">Video inspiration by Rosie's Dessert Spot</p>
        </div>
        <a
          href={VIDEO_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Watch the original cake decorating video on YouTube"
          title="Watch original video on YouTube"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/40 bg-black/40 text-white backdrop-blur transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <ExternalLink size={16} aria-hidden="true" />
        </a>
      </figcaption>
    </figure>
  )
}
