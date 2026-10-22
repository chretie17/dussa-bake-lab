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

/**
 * Should the film start by itself on this visit? On every screen size —
 * phones included — unless the visitor has asked for less motion or less
 * data, or is on a connection too slow to stream it.
 */
function canAutoplay(reducedMotion) {
  if (reducedMotion) return false
  const connection = navigator.connection
  if (connection?.saveData || /2g/.test(connection?.effectiveType || '')) return false
  return true
}

/**
 * The homepage film.
 *
 * The footage is cinemascope, about 2.39:1, sitting inside YouTube's 16:9
 * player with black bars above and below. The CSS (.hero-film-frame) sizes the
 * player so its *picture* covers the frame, which pushes the bars — and
 * YouTube's own title strip and logo with them — outside it.
 *
 * YouTube's iframe "loads" long before anything plays, so the still is shown
 * first, the player is fetched once the page has settled, and it is faded in
 * only when YouTube itself reports PLAYING. Between loops, when paused, or
 * when scrolled away it fades back to the still.
 *
 * When a phone refuses to autoplay — iPhone Low Power Mode, Android data
 * saver, the Instagram and Facebook in-app browsers — a button on *our* page
 * cannot start it either: the tap happens outside YouTube's frame, and the
 * browser only lets a tap inside the frame start playback. So in that case the
 * player itself is shown and made tappable, with a hint, and the first tap on
 * it starts the film.
 *
 * Renders its controls through `children({ controls, compact })`, so the hero
 * can place them in its own layout.
 */
export default function HeroCake({ children }) {
  const reducedMotion = useReducedMotion()
  const layerRef = useRef(null)
  const frameRef = useRef(null)

  const [mounted, setMounted] = useState(false)
  const [wanted, setWanted] = useState(false)
  const [showing, setShowing] = useState(false)
  const [needsTap, setNeedsTap] = useState(false)

  const talking = useRef(false) // the player has answered us at least once
  const everPlayed = useRef(false)
  const lastState = useRef(null)
  const userPaused = useRef(false)
  const timers = useRef([])

  const src = useMemo(() => (mounted ? embedUrl() : ''), [mounted])

  // Read inside the message handler without re-subscribing it.
  const needsTapRef = useRef(false)
  useEffect(() => {
    needsTapRef.current = needsTap
  }, [needsTap])

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
      const id = window.requestIdleCallback(begin, { timeout: 1500 })
      return () => window.cancelIdleCallback(id)
    }
    const id = window.setTimeout(begin, 700)
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

      const state = data?.event === 'onStateChange' ? data.info : data?.info?.playerState
      if (typeof state !== 'number') return
      lastState.current = state

      if (state === PLAYING) {
        everPlayed.current = true
        setNeedsTap(false)
        setWanted(true)
        userPaused.current = false
      }
      // Mid-film buffering holds the last frame, which is fine to keep on
      // screen. Anything else — ended, paused, cued — goes back to the still,
      // except while we are waiting for a tap, when the player must stay put.
      setShowing((current) =>
        state === PLAYING ? true : state === BUFFERING ? current : current && needsTapRef.current,
      )
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [mounted])

  /** Autoplay was refused: show the player and let a tap reach it. */
  const askForTap = useCallback(() => {
    setNeedsTap(true)
    setShowing(true)
    setWanted(false)
  }, [])

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
    // changed API) should not mean a film that never appears: show it, and
    // let it be tapped in case it is sitting there unplayed.
    later(() => {
      if (!talking.current && !userPaused.current) askForTap()
    }, 6000)

    // One that answers but has not reached PLAYING by now was refused
    // autoplay — unless it is still buffering on a slow connection, in which
    // case keep waiting a while longer before deciding.
    const decide = (attempt) => {
      if (!talking.current || everPlayed.current || userPaused.current) return
      if (lastState.current === BUFFERING && attempt < 5) {
        later(() => decide(attempt + 1), 3000)
        return
      }
      askForTap()
    }
    later(() => decide(0), 7000)
  }

  /* ----------------------------------- pause when scrolled out of view */
  useEffect(() => {
    if (!mounted || !('IntersectionObserver' in window)) return undefined
    const layer = layerRef.current
    if (!layer) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!talking.current || userPaused.current || !everPlayed.current) return
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

  const label = wanted ? 'Pause the background film' : 'Play the background film'
  const icon = wanted ? (
    <Pause size={12} strokeWidth={2.2} aria-hidden="true" />
  ) : (
    <Play size={12} strokeWidth={2.2} className="translate-x-px" aria-hidden="true" />
  )

  /* Full control, for the hero's baseline row on larger screens. */
  const controls = needsTap ? (
    <p className="text-[0.7rem] uppercase tracking-[0.18em] text-white/70">Tap the film to play</p>
  ) : (
    <div className="flex items-center gap-4 text-[0.7rem] uppercase tracking-[0.18em] text-white/70">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={wanted}
        aria-label={label}
        className="group inline-flex items-center gap-2.5 transition-colors hover:text-white focus-visible:rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/35 transition-colors group-hover:border-white/70">
          {icon}
        </span>
        {wanted ? 'Pause film' : 'Play film'}
      </button>
      <a
        href={VIDEO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-white/45 transition-colors hover:text-white/80"
      >
        Film via YouTube
        <ArrowUpRight size={12} aria-hidden="true" />
      </a>
    </div>
  )

  /* A single round button for the corner of the film on a phone. */
  const compact = needsTap ? (
    <span className="pointer-events-none inline-flex items-center gap-2 rounded-full bg-black/40 px-3.5 py-2 text-[0.68rem] uppercase tracking-[0.16em] text-white/90 backdrop-blur-md">
      <Play size={11} strokeWidth={2.4} aria-hidden="true" />
      Tap the film to play
    </span>
  ) : (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={wanted}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/25 text-white backdrop-blur-md transition-colors active:bg-black/45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      {icon}
    </button>
  )

  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#1a0e09]">
        <img
          src={HERO_PHOTO.src}
          srcSet={HERO_PHOTO.srcSet}
          sizes="100vw"
          alt=""
          aria-hidden="true"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="hero-still absolute inset-0 h-full w-full object-cover object-[55%_35%]"
        />

        <div ref={layerRef} className="hero-film-layer">
          {mounted && (
            <iframe
              ref={frameRef}
              title="Background film: baking at Dussa BakeLab"
              src={src}
              // Out of the tab order while it is decoration; reachable when it
              // is the only way to start the film.
              tabIndex={needsTap ? 0 : -1}
              aria-hidden={needsTap ? undefined : 'true'}
              allow="autoplay; encrypted-media"
              referrerPolicy="strict-origin-when-cross-origin"
              onLoad={onFrameLoad}
              className={`hero-film-frame ${showing ? 'is-showing' : ''} ${needsTap ? 'is-tappable' : ''}`}
            />
          )}
        </div>
      </div>

      {typeof children === 'function' ? children({ controls, compact, needsTap }) : children}
    </>
  )
}
