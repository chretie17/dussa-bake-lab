import { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { classNames } from '../lib/format'

/* ------------------------------------------------------------------ */
/* Button                                                              */
/* ------------------------------------------------------------------ */

const VARIANTS = {
  primary:
    'bg-espresso text-cream hover:bg-cocoa shadow-soft hover:shadow-lift border border-espresso',
  gold: 'bg-accent text-accent-contrast hover:opacity-90 shadow-soft hover:shadow-lift border border-accent',
  outline:
    'bg-transparent text-espresso border border-espresso/25 hover:border-espresso hover:bg-espresso/5',
  /** Outline sibling for the "deep" sections. Keeps its own colours so it never
   *  collides with `outline`'s dark text, and follows the chosen theme. */
  outlineLight:
    'bg-transparent text-on-deep border border-on-deep/30 hover:border-on-deep/70 hover:bg-on-deep/10',
  light:
    'bg-porcelain text-espresso border border-caramel/25 hover:bg-blush shadow-soft hover:shadow-lift',
  ghost: 'bg-transparent text-espresso hover:bg-espresso/6 border border-transparent',
  danger: 'bg-transparent text-red-700 border border-red-700/25 hover:bg-red-700/8',
}

const SIZES = {
  sm: 'h-10 px-4 text-[0.8rem]',
  md: 'h-12 px-6 text-[0.875rem]',
  lg: 'h-14 px-8 text-[0.9375rem]',
}

export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', className = '', to, href, sheen = false, children, ...rest },
  ref,
) {
  const cls = classNames(
    'group relative inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-[0.02em]',
    'transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98]',
    'disabled:pointer-events-none disabled:opacity-45',
    VARIANTS[variant] || VARIANTS.primary,
    SIZES[size] || SIZES.md,
    className,
  )

  const inner = (
    <>
      {sheen && (
        <span
          aria-hidden="true"
          className="sheen pointer-events-none absolute inset-0 rounded-full"
        />
      )}
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </>
  )

  if (to) {
    return (
      <Link ref={ref} to={to} className={cls} {...rest}>
        {inner}
      </Link>
    )
  }
  if (href) {
    return (
      <a
        ref={ref}
        href={href}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel={href.startsWith('http') ? 'noreferrer noopener' : undefined}
        className={cls}
        {...rest}
      >
        {inner}
      </a>
    )
  }
  return (
    <button ref={ref} type="button" className={cls} {...rest}>
      {inner}
    </button>
  )
})

/* ------------------------------------------------------------------ */
/* Reveal — scroll-triggered entrance                                  */
/* ------------------------------------------------------------------ */

export function Reveal({
  children,
  delay = 0,
  y = 26,
  once = true,
  className = '',
  as = 'div',
  ...rest
}) {
  const reduce = useReducedMotion()
  const MotionTag = motion[as] || motion.div

  if (reduce) {
    const Tag = as
    return (
      <Tag className={className} {...rest}>
        {children}
      </Tag>
    )
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-80px' }}
      transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
      {...rest}
    >
      {children}
    </MotionTag>
  )
}

/** Staggered container — pair with <Reveal> children for list entrances. */
export function RevealGroup({ children, className = '', stagger = 0.08, ...rest }) {
  const reduce = useReducedMotion()
  if (reduce) {
    return (
      <div className={className} {...rest}>
        {children}
      </div>
    )
  }
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-70px' }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger } } }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

export const revealItem = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
}

/* ------------------------------------------------------------------ */
/* Section scaffolding                                                 */
/* ------------------------------------------------------------------ */

export function Eyebrow({ children, className = '', tone = 'text-caramel' }) {
  return (
    <p className={classNames('eyebrow flex items-center gap-3', tone, className)}>
      <span aria-hidden="true" className="h-px w-8 bg-current opacity-50" />
      {children}
    </p>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = 'left',
  tone = 'dark',
  className = '',
  children,
}) {
  const dark = tone === 'dark'
  return (
    <div
      className={classNames(
        'max-w-2xl',
        align === 'center' && 'mx-auto text-center',
        className,
      )}
    >
      {eyebrow && (
        <div className={align === 'center' ? 'flex justify-center' : ''}>
          <Eyebrow tone={dark ? 'text-caramel' : 'text-gold'}>{eyebrow}</Eyebrow>
        </div>
      )}
      {title && (
        <h2
          className={classNames(
            'mt-5 text-[clamp(2rem,4.6vw,3.4rem)] leading-[1.05]',
            dark ? 'text-espresso' : 'text-on-deep',
          )}
        >
          {title}
        </h2>
      )}
      {lead && (
        <p
          className={classNames(
            'mt-5 text-[1.0625rem] leading-relaxed',
            dark ? 'text-cocoa/80' : 'text-on-deep/80',
          )}
        >
          {lead}
        </p>
      )}
      {children}
    </div>
  )
}

export function Section({ id, className = '', children, ...rest }) {
  return (
    <section id={id} className={classNames('py-20 md:py-28', className)} {...rest}>
      {children}
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Bits                                                                */
/* ------------------------------------------------------------------ */

export function Stars({ value = 5, className = '', size = 14 }) {
  return (
    <span className={classNames('inline-flex items-center gap-0.5', className)} aria-label={`${value} out of 5`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M10 1.6l2.472 5.35 5.84.66-4.33 3.97 1.16 5.76L10 14.42l-5.142 2.92 1.16-5.76L1.688 7.61l5.84-.66z"
            fill={i < Math.round(value) ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
            opacity={i < Math.round(value) ? 1 : 0.35}
          />
        </svg>
      ))}
    </span>
  )
}

export function Pill({ children, className = '', tone = 'cream' }) {
  const tones = {
    cream: 'bg-blush/70 text-cocoa border-caramel/25',
    dark: 'bg-espresso text-cream border-espresso',
    gold: 'bg-gold/22 text-cocoa border-gold/45',
    outline: 'bg-transparent text-cocoa/75 border-caramel/35',
  }
  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.6875rem] font-medium tracking-[0.08em] uppercase',
        tones[tone] || tones.cream,
        className,
      )}
    >
      {children}
    </span>
  )
}

/** Ornamental divider — a small whisk-and-rule flourish between sections. */
export function Flourish({ className = '', tone = 'text-caramel' }) {
  return (
    <div className={classNames('flex items-center justify-center gap-4', tone, className)} aria-hidden="true">
      <span className="h-px w-16 bg-current opacity-30 md:w-28" />
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 2.5l1.9 5.5 5.6.6-4.2 3.7 1.2 5.6L12 15.1 7.5 17.9l1.2-5.6-4.2-3.7 5.6-.6z" fill="currentColor" opacity="0.85" />
      </svg>
      <span className="h-px w-16 bg-current opacity-30 md:w-28" />
    </div>
  )
}

export function Marquee({ items, className = '', duration = 38, tone = 'dark' }) {
  const doubled = [...items, ...items]
  return (
    <div
      className={classNames(
        'pause-on-hover relative flex overflow-hidden',
        tone === 'dark' ? 'bg-espresso text-cream' : 'bg-blush text-cocoa',
        className,
      )}
    >
      <div
        className="animate-marquee flex shrink-0 items-center whitespace-nowrap"
        style={{ '--marquee-duration': `${duration}s` }}
      >
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center">
            <span className="eyebrow px-7 py-4 text-[0.7rem] opacity-90 md:px-10">{item}</span>
            <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true" className="opacity-55">
              <circle cx="4" cy="4" r="4" fill="currentColor" />
            </svg>
          </span>
        ))}
      </div>
    </div>
  )
}

/** Full-bleed decorative arc used to transition between light sections. */
export function ArcTop({ className = '', fill = 'var(--color-cream)' }) {
  return (
    <div className={classNames('pointer-events-none absolute inset-x-0 top-0 h-16 md:h-24', className)} aria-hidden="true">
      <svg viewBox="0 0 1440 96" preserveAspectRatio="none" className="h-full w-full">
        <path d="M0 96 C 340 0 1100 0 1440 96 Z" fill={fill} />
      </svg>
    </div>
  )
}

export function ArcBottom({ className = '', fill = 'var(--color-cream)' }) {
  return (
    <div className={classNames('pointer-events-none absolute inset-x-0 bottom-0 h-16 md:h-24', className)} aria-hidden="true">
      <svg viewBox="0 0 1440 96" preserveAspectRatio="none" className="h-full w-full">
        <path d="M0 0 C 340 96 1100 96 1440 0 Z" fill={fill} />
      </svg>
    </div>
  )
}
