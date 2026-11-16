import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, ShoppingBag, X, Phone } from 'lucide-react'
import { BrandLockup } from './BrandMark'
import { NAV_LINKS, CONTACT } from '../data/site'
import { useCart } from '../context/CartContext'
import ThemeToggle from './ThemeToggle'
import { useTheme } from '../context/ThemeContext'
import { classNames } from '../lib/format'
import { Button } from './ui'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { count, openCart } = useCart()
  const { isBright } = useTheme()
  const { pathname } = useLocation()

  /**
   * Over the hero the bar is transparent. The hero is a dark film in both
   * themes, so its ink is always light there — following the theme instead
   * put dark brown links on dark footage under the bright theme.
   */
  const overHero = pathname === '/' && !scrolled
  const heroDark = overHero && !isBright
  const heroInk = heroDark ? '#FAF3EA' : 'var(--color-espresso)'
  const heroAccent = heroDark ? '#E9C08F' : 'var(--color-caramel)'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <>
      <header
        className={classNames(
          'fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
          overHero
            ? 'bg-transparent py-4'
            : 'glass border-b border-caramel/18 py-2 shadow-[0_1px_24px_-12px_rgba(42,24,16,0.5)]',
        )}
      >
        <nav className="container-x flex items-center justify-between gap-3 sm:gap-6" aria-label="Main">
          <Link
            to="/"
            className="group flex shrink-0 items-center gap-2.5"
            aria-label="Dussa BakeLab — home"
          >
            <BrandLockup
              markClass="h-11 w-11 md:h-12 md:w-12"
              wordClass="text-[0.72rem] sm:text-[0.9rem]"
              tone={overHero ? heroInk : 'var(--color-espresso)'}
              accent={overHero ? heroAccent : 'var(--color-caramel)'}
            />
          </Link>

          <ul className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    classNames(
                      'relative rounded-full px-4 py-2.5 text-[0.875rem] font-medium transition-colors duration-300',
                      heroDark
                        ? 'text-white/80 hover:text-white'
                        : 'text-cocoa/75 hover:text-espresso',
                      isActive && (heroDark ? 'text-white' : 'text-espresso'),
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {link.label}
                      {isActive && (
                        <motion.span
                          layoutId="nav-active"
                          className={classNames(
                            'absolute inset-x-3 -bottom-0.5 h-px',
                            heroDark ? 'bg-[#E9C08F]' : 'bg-caramel',
                          )}
                          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <a
              href={CONTACT.phoneHref}
              className={classNames(
                'hidden items-center gap-2 rounded-full px-3 py-2 text-[0.8125rem] font-medium transition-colors xl:inline-flex',
                heroDark ? 'text-white/75 hover:text-white' : 'text-cocoa/85 hover:text-espresso',
              )}
            >
              <Phone size={15} strokeWidth={1.8} />
              {CONTACT.phoneDisplay}
            </a>

            <ThemeToggle onDark={heroDark} className="hidden sm:flex" />

            <button
              type="button"
              onClick={openCart}
              className={classNames(
                'relative flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-300',
                heroDark
                  ? 'border-white/30 text-white hover:bg-white/10'
                  : 'border-caramel/30 text-espresso hover:border-caramel hover:bg-blush/60',
              )}
              aria-label={`Open order basket, ${count} item${count === 1 ? '' : 's'}`}
            >
              <ShoppingBag size={18} strokeWidth={1.7} />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[0.6875rem] font-semibold text-accent-contrast"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Wrapped rather than given `hidden` directly: the button's own
                `inline-flex` would otherwise fight the display utility. */}
            <span className="hidden md:block">
              <Button to="/order" size="sm" variant={overHero ? 'gold' : 'primary'}>
                Order now
              </Button>
            </span>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className={classNames(
                'flex h-11 w-11 items-center justify-center rounded-full border transition-colors lg:hidden',
                heroDark
                  ? 'border-white/30 text-white hover:bg-white/10'
                  : 'border-caramel/30 text-espresso hover:bg-blush/60',
              )}
              aria-label="Open menu"
            >
              <Menu size={19} strokeWidth={1.7} />
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-[60] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/65 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              className="grain absolute inset-y-0 right-0 flex w-[min(23rem,88vw)] flex-col bg-cream shadow-lift"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 36 }}
            >
              <div className="relative z-10 flex items-center justify-between border-b border-caramel/20 px-6 py-5">
                <BrandLockup wordClass="text-[0.8rem]" tone="var(--color-espresso)" accent="var(--color-caramel)" />
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-caramel/30 text-espresso"
                  aria-label="Close menu"
                >
                  <X size={18} strokeWidth={1.7} />
                </button>
              </div>

              <ul className="relative z-10 flex-1 overflow-y-auto px-6 py-6">
                {[{ label: 'Home', to: '/' }, ...NAV_LINKS].map((link, i) => (
                  <motion.li
                    key={link.to}
                    initial={{ opacity: 0, x: 22 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.06 + i * 0.05, duration: 0.45 }}
                    className="border-b border-caramel/15 last:border-0"
                  >
                    <NavLink
                      to={link.to}
                      className={({ isActive }) =>
                        classNames(
                          'block py-4 font-display text-2xl transition-colors',
                          isActive ? 'text-caramel' : 'text-espresso hover:text-choco',
                        )
                      }
                    >
                      {link.label}
                    </NavLink>
                  </motion.li>
                ))}
              </ul>

              <div className="relative z-10 space-y-3 border-t border-caramel/20 px-6 py-6">
                <div className="flex items-center justify-between gap-3 pb-1">
                  <span className="text-[0.85rem] text-cocoa/70">Theme</span>
                  <ThemeToggle />
                </div>
                <Button to="/order" className="w-full" sheen>
                  Start an order
                </Button>
                <a
                  href={CONTACT.phoneHref}
                  className="flex items-center justify-center gap-2 text-sm text-cocoa/70"
                >
                  <Phone size={15} strokeWidth={1.8} /> {CONTACT.phoneDisplay}
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
