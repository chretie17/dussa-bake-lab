import { useId } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

/**
 * The rotating "Fresh quality · Made with love" seal from the brand flyer,
 * rebuilt with an SVG textPath so the ring reads cleanly at any size.
 */
export default function SealBadge({
  text = 'FRESH QUALITY · MADE WITH LOVE · KIGALI RWANDA · ',
  className = '',
  ring = '#D4A574',
  ink = '#FAF3EA',
  fill = '#2A1810',
  duration = 26,
}) {
  const uid = useId().replace(/[:]/g, '')
  const reduce = useReducedMotion()

  return (
    <div className={className}>
      <motion.svg
        viewBox="0 0 200 200"
        className="h-full w-full"
        aria-hidden="true"
        animate={reduce ? undefined : { rotate: 360 }}
        transition={reduce ? undefined : { duration, repeat: Infinity, ease: 'linear' }}
      >
        <defs>
          <path
            id={`seal-${uid}`}
            d="M100 100 m -74 0 a 74 74 0 1 1 148 0 a 74 74 0 1 1 -148 0"
            fill="none"
          />
        </defs>
        <circle cx="100" cy="100" r="96" fill={fill} />
        <circle cx="100" cy="100" r="88" fill="none" stroke={ring} strokeWidth="1" opacity="0.55" />
        <circle cx="100" cy="100" r="56" fill="none" stroke={ring} strokeWidth="1" opacity="0.35" />
        <text
          fill={ink}
          style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: '13px',
            fontWeight: 500,
            letterSpacing: '3.4px',
          }}
        >
          <textPath href={`#seal-${uid}`} startOffset="0%">
            {text.repeat(2)}
          </textPath>
        </text>

        {/* Whisk glyph at the centre */}
        <g stroke={ring} strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M100 74 L100 84" strokeWidth="4" />
          <path d="M100 86 C88 92 86 106 94 116" />
          <path d="M100 86 C95 94 94 106 98 118" />
          <path d="M100 86 C105 94 106 106 102 118" />
          <path d="M100 86 C112 92 114 106 106 116" />
          <path d="M92 112 C97 116 103 116 108 112" strokeWidth="2.4" />
        </g>
        <path d="M84 120 h32 a16 16 0 0 1 -32 0 z" fill={ring} />
      </motion.svg>
    </div>
  )
}
