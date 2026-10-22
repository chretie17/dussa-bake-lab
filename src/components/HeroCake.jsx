import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { ArrowUpRight, Pause, Play } from 'lucide-react'
import { PHOTOS } from '../data/photography'

// Official YouTube embed. This cake-decorating footage is by Rosie's Dessert
// Spot and is an inspiration example, not a recording of Dussa's own kitchen.
const VIDEO_ID = '629N793GIIY'
const VIDEO_URL = `https://www.youtube.com/watch?v=${VIDEO_ID}`
const EMBED_URL = `https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=1&mute=1&playsinline=1&controls=1&loop=1&playlist=${VIDEO_ID}&rel=0`

export default function HeroCake() {
  const reducedMotion = useReducedMotion()
  const [playing, setPlaying] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Low-data and reduced-motion visitors get the fast photographic poster.
    // Either group can choose to play the video using the button below.
    setPlaying(!reducedMotion && !navigator.connection?.saveData)
  }, [reducedMotion])

  const toggleVideo = () => {
    setPlaying((wasPlaying) => !wasPlaying)
    setLoaded(false)
  }

  return (
    <figure className="mx-auto w-full max-w-[34rem] overflow-hidden rounded-[1.75rem] border border-caramel/20 bg-deep-2 shadow-[0_30px_85px_rgba(0,0,0,0.24)] lg:max-w-none">
      <div className="relative aspect-video min-h-[205px] w-full bg-espresso">
        <img
          src={PHOTOS.hero}
          alt="Chocolate drip cake photographed close up"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${playing && loaded ? 'opacity-0' : 'opacity-100'}`}
        />

        {playing && (
          <iframe
            title="Gold chocolate drip cake decorating by Rosie's Dessert Spot"
            src={EMBED_URL}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={() => setLoaded(true)}
            className={`absolute inset-0 h-full w-full border-0 transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          />
        )}
      </div>

      <figcaption className="flex items-center justify-between gap-3 bg-deep-2 px-4 py-4 text-on-deep sm:px-5">
        <div className="min-w-0">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-accent">Cake in the making</p>
          <a
            href={VIDEO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-[0.75rem] text-on-deep/75 underline-offset-4 transition hover:text-on-deep hover:underline"
          >
            Inspiration video: Rosie's Dessert Spot
            <ArrowUpRight size={13} aria-hidden="true" />
          </a>
        </div>
        <button
          type="button"
          onClick={toggleVideo}
          className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-accent/40 px-3 text-[0.72rem] font-medium text-on-deep transition hover:bg-on-deep/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          aria-label={playing ? 'Pause cake decorating video' : 'Play cake decorating video'}
        >
          {playing ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
          {playing ? 'Pause' : 'Play'}
        </button>
      </figcaption>
    </figure>
  )
}
