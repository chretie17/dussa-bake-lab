import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { ArrowUpRight, Pause, Play } from 'lucide-react'
import { PHOTOS } from '../data/photography'

// Official privacy-enhanced embed. This is inspiration footage from YouTube,
// not video recorded in Dussa BakeLab's kitchen.
const VIDEO_ID = 'HTXB6flODww'
const VIDEO_URL = `https://www.youtube.com/watch?v=${VIDEO_ID}`
const EMBED_URL = `https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=1&mute=1&playsinline=1&controls=0&loop=1&playlist=${VIDEO_ID}&rel=0&disablekb=1`

/**
 * A cinematic full-hero background. The image is visible immediately, including
 * when YouTube is blocked, slow, or the visitor prefers reduced motion/data use.
 * Our own controls unmount the iframe completely when playback is paused.
 */
export default function HeroCake() {
  const reducedMotion = useReducedMotion()
  const [playing, setPlaying] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const saveData = navigator.connection?.saveData
    setPlaying(!reducedMotion && !saveData)
  }, [reducedMotion])

  const togglePlayback = () => {
    setPlaying((current) => !current)
    setReady(false)
  }

  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#21120c]" aria-hidden="true">
        <img
          src={PHOTOS.hero}
          alt=""
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full scale-[1.03] object-cover object-[55%_30%] opacity-90"
        />
        {playing && (
          <div className="hero-cinema-player absolute inset-0 overflow-hidden">
            <iframe
              title="Bakery video background from YouTube"
              src={EMBED_URL}
              tabIndex={-1}
              allow="autoplay; encrypted-media; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              onLoad={() => setReady(true)}
              className={`hero-cinema-iframe transition-opacity duration-1000 ease-out ${ready ? 'opacity-100' : 'opacity-0'}`}
            />
          </div>
        )}
      </div>

      <div className="absolute bottom-5 left-5 z-20 flex items-center gap-2 text-white sm:bottom-8 sm:left-auto sm:right-8">
        <a
          href={VIDEO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-white/20 bg-[#21120c]/60 px-3.5 text-[0.72rem] tracking-wide text-white/85 backdrop-blur-md transition-colors hover:border-white/40 hover:bg-[#21120c]/80 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          aria-label="Watch the original inspiration video on YouTube"
        >
          Video inspiration
          <ArrowUpRight size={14} aria-hidden="true" />
        </a>
        <button
          type="button"
          onClick={togglePlayback}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/25 bg-[#21120c]/60 px-3.5 text-[0.72rem] tracking-wide text-white backdrop-blur-md transition-colors hover:border-white/50 hover:bg-[#21120c]/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          aria-label={playing ? 'Pause background video' : 'Play background video'}
          aria-pressed={playing}
        >
          {playing ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
          <span>{playing ? 'Pause' : 'Play'}</span>
        </button>
      </div>
    </>
  )
}
