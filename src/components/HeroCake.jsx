import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { ArrowUpRight, Pause, Play } from 'lucide-react'
import { HERO_PHOTO } from '../data/photography'

// Official privacy-enhanced embed. This is inspiration footage from YouTube,
// not video recorded in Dussa BakeLab's kitchen.
const VIDEO_ID = 'HTXB6flODww'
const VIDEO_URL = `https://www.youtube.com/watch?v=${VIDEO_ID}`
const PLAYER_ORIGIN = 'https://www.youtube-nocookie.com'

/* YouTube player states, as reported over postMessage. */
const PLAYING = 1
const BUFFERING = 3

function embedUrl() {
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    playsinline: '1',
    controls: '0',
    loop: '1',
    playlist: VIDEO_ID,
    rel: '0',
    disablekb: '1',
    fs: '0',
    iv_load_policy: '3',
    modestbranding: '1',
    // Lets the player tell us when the film is genuinely playing.
    enablejsapi: '1',
    origin: window.location.origin,
  })
  return `${PLAYER_ORIGIN}/embed/${VIDEO_ID}?${params}`
}

/** Should the film start by itself on this visit? */
function canAutoplay(reducedMotion) {
  if (reducedMotion) return false
  const connection = navigator.connection
  if (connection?.saveData || /2g/.test(connection?.effectiveType || '')) return false
  // Phones start on the still. A streamed background costs real data on a
  // Rwandan mobile plan and takes longest exactly where patience is shortest;
  // the button below plays it for anyone who wants it.
  return window.matchMedia('(min-width: 768px)').matches
}

/**
 * The homepage film.
 *
 * Two things the first version got wrong, and why this one is built as it is:
 *
 * The footage is cinemascope, about 2.39:1, sitting inside YouTube's 16:9
 * player with black bars above and below. Sizing the *player* to cover the
 * hero leaves those bars on screen. The CSS (.hero-film-frame) sizes it so the
 * *picture* covers the hero, which pushes the bars — and YouTube's own title
 * strip and logo with them — outside the frame.
 *
 * And YouTube's iframe "loads" long before anything plays, so revealing it on
 * load showed a black player and a spinner first. The still is shown straight
 * away, the player is only fetched once the page has settled, and it is faded
 * in when YouTube itself reports PLAYING. Between loops, when paused, or when
 * scrolled away it fades back to the still rather than showing YouTube's
 * pause or end screens.
 *
 * Renders its controls through `children`, so the hero can place them in its
 * own layout instead of floating them over the film.
 */
export default function HeroCake({ children }) {
  const reducedMotion = useReducedMotion()
  const layerRef = useRef(null)
  const frameRef = useRef(null)

  const [mounted, setMounted] = useState(false)
  const [wanted, setWanted] = useState(false)
  const [showing, setShowing] = useState(false)

  const talking = useRef(false) // the player has answered us at least once
  const everPlayed = useRef(false)
  const userPaused = useRef(false)
  const timers = useRef([])

  const src = useMemo(() => (mounted ? embedUrl() : ''), [mounted])

  const later = (fn, ms) => {
    timers.current.push(window.setTimeout(fn, ms))
  }

  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), [])

  const send = useCallback((payload) => {
    frameRef.current?.contentWindow?.postMessage(
      JSON.stringify({ id: 'dussa-hero', channel: 'widget', ...payload }),
      PLAYER_ORIGIN,
    )
  }, [])

  /* ------------------------------------------------------ autoplay */
  useEffect(() => {
    if (!canAutoplay(reducedMotion)) return undefined

    // Wait for the page to settle: the headline and the still should never
    // queue behind a video player's scripts.
    const begin = () => {
      setWanted(true)
      setMounted(true)
    }
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(begin, { timeout: 2000 })
      return () => window.cancelIdleCallback(id)
    }
    const id = window.setTimeout(begin, 900)
    return () => window.clearTimeout(id)
  }, [reducedMotion])

  /* ------------------------------------------- what the player says */
  useEffect(() => {
    if (!mounted) return undefined

    const onMessage = (event) => {
      if (event.origin !== PLAYER_ORIGIN) return
      if (event.source !== frameRef.current?.contentWindow) return

      let data
      try {
        data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
      } catch {
        return
      }
      talking.current = true

      const state =
        data?.event === 'onStateChange' ? data.info : data?.info?.playerState
      if (typeof state !== 'number') return

      if (state === PLAYING) everPlayed.current = true
      // Mid-film buffering holds the last frame, which is fine to keep on
      // screen. Anything else — ended, paused, cued — goes back to the still.
      setShowing((current) => (state === PLAYING ? true : state === BUFFERING ? current : false))
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [mounted])

  const onFrameLoad = () => {
    // The player's API is not always ready the instant its page loads, so ask
    // a few times until it answers.
    let tries = 0
    const ask = () => {
      if (talking.current || tries >= 25) return
      tries += 1
      send({ event: 'listening' })
      send({ event: 'command', func: 'addEventListener', args: ['onStateChange'] })
      later(ask, 400)
    }
    ask()

    // A player that never answers at all (an extension eating postMessage, a
    // changed API) should not mean a film that never appears: trust autoplay.
    later(() => {
      if (!talking.current && !userPaused.current) setShowing(true)
    }, 6000)

    // One that answers but never reaches PLAYING was refused autoplay. Stay on
    // the still and let the button say Play.
    later(() => {
      if (talking.current && !everPlayed.current && !userPaused.current) setWanted(false)
    }, 9000)
  }

  /* ----------------------------------- pause when scrolled out of view */
  useEffect(() => {
    if (!mounted || !('IntersectionObserver' in window)) return undefined
    const layer = layerRef.current
    if (!layer) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!talking.current || userPaused.current) return
        send({ event: 'command', func: entry.isIntersecting ? 'playVideo' : 'pauseVideo', args: [] })
      },
      { threshold: 0.15 },
    )
    observer.observe(layer)
    return () => observer.disconnect()
  }, [mounted, send])

  /* ------------------------------------------------------- the button */
  const toggle = () => {
    if (wanted) {
      userPaused.current = true
      setWanted(false)
      setShowing(false)
      if (talking.current) send({ event: 'command', func: 'pauseVideo', args: [] })
      else setMounted(false) // cannot pause a player that will not listen; unload it
      return
    }

    userPaused.current = false
    setWanted(true)
    if (mounted && talking.current) {
      send({ event: 'command', func: 'playVideo', args: [] })
    } else {
      setMounted(true)
    }
  }

  const controls = (
    <div className="flex items-center gap-4 text-[0.7rem] uppercase tracking-[0.18em] text-white/70">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={wanted}
        aria-label={wanted ? 'Pause the background film' : 'Play the background film'}
        className="group inline-flex items-center gap-2.5 transition-colors hover:text-white focus-visible:rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/35 transition-colors group-hover:border-white/70">
          {wanted ? (
            <Pause size={12} strokeWidth={2.2} aria-hidden="true" />
          ) : (
            <Play size={12} strokeWidth={2.2} className="translate-x-px" aria-hidden="true" />
          )}
        </span>
        {wanted ? 'Pause film' : 'Play film'}
      </button>
      <a
        href={VIDEO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="hidden items-center gap-1 text-white/45 transition-colors hover:text-white/80 sm:inline-flex"
      >
        Film via YouTube
        <ArrowUpRight size={12} aria-hidden="true" />
      </a>
    </div>
  )

  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#1a0e09]"
        aria-hidden="true"
      >
        <img
          src={HERO_PHOTO.src}
          srcSet={HERO_PHOTO.srcSet}
          sizes="100vw"
          alt=""
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="hero-still absolute inset-0 h-full w-full object-cover object-[55%_35%]"
        />

        <div ref={layerRef} className="hero-film-layer">
          {mounted && (
            <iframe
              ref={frameRef}
              title="Background film"
              src={src}
              tabIndex={-1}
              allow="autoplay; encrypted-media"
              referrerPolicy="strict-origin-when-cross-origin"
              onLoad={onFrameLoad}
              className={`hero-film-frame ${showing ? 'is-showing' : ''}`}
            />
          )}
        </div>
      </div>

      {typeof children === 'function' ? children(controls) : children}
    </>
  )
}
