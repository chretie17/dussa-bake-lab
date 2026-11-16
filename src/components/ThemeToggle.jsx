import { motion } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'
import { classNames } from '../lib/format'

/**
 * Swaps the site between the bright look and the darker chocolate one.
 * Drawn as two small cake-tin swatches rather than the usual sun and moon,
 * because this is not a light/dark mode so much as two brand palettes.
 */
export default function ThemeToggle({ className = '', onDark = false }) {
  const { theme, toggle } = useTheme()
  const bright = theme === 'bright'

  return (
    <button
      type="button"
      onClick={toggle}
      role="switch"
      aria-checked={!bright}
      aria-label={bright ? 'Switch to the chocolate look' : 'Switch to the bright look'}
      title={bright ? 'Chocolate look' : 'Bright look'}
      className={classNames(
        'relative flex h-11 w-[5.1rem] shrink-0 items-center rounded-full border p-1 transition-colors duration-400',
        onDark
          ? 'border-white/40 bg-white/10 hover:border-white/70'
          : 'border-caramel/30 bg-blush/45 hover:border-caramel',
        className,
      )}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 34 }}
        className={classNames(
          'flex h-9 w-9 items-center justify-center rounded-full shadow-soft',
          bright ? 'bg-porcelain' : 'ml-auto bg-espresso',
        )}
      >
        <span
          aria-hidden="true"
          className="h-5 w-5 rounded-full ring-1 ring-black/10"
          style={{
            background: bright
              ? 'radial-gradient(circle at 32% 28%, #FFF3DF, #E8C9A0 60%, #C99B63)'
              : 'radial-gradient(circle at 32% 28%, #8A5F3D, #4A2A18 62%, #221109)',
          }}
        />
      </motion.span>

      <span
        aria-hidden="true"
        className={classNames(
          'pointer-events-none absolute inset-y-0 flex items-center text-[0.58rem] font-semibold uppercase tracking-[0.12em] transition-colors duration-300',
          bright ? 'right-3' : 'left-3',
          onDark ? 'text-white/80' : 'text-cocoa/85',
        )}
      >
        {bright ? 'Dark' : 'Light'}
      </span>
    </button>
  )
}
