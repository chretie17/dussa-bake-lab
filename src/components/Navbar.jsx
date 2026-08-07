import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, ShoppingBag, X, Phone } from 'lucide-react'
import { LogoMark, Wordmark } from '../art/Logo'
import { NAV_LINKS, CONTACT } from '../data/site'
import { useCart } from '../context/CartContext'
import { useTheme } from '../context/ThemeContext'
import ThemeToggle from './ThemeToggle'
import { classNames } from '../lib/format'
import { Button } from './ui'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { count, openCart } = useCart()
  const { isBright } = useTheme()
  const { pathname } = useLocation()

  /** Over the hero the bar is transparent; its ink follows the theme. */
  const overHero = pathname === '/' && !scrolled
  const heroInk = isBright ? '#2F1C11' : '#FAF3EA'
  const heroAccent = isBright ? '#A0692F' : '#D4A574'

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
        <nav className="container-x flex items-center justify-between gap-6" aria-label="Main">
          <Link
            to="/"
            className="group flex shrink-0 items-center gap-2.5"
            aria-label="Dussa BakeLab — home"
          >
            <LogoMark
              className="h-11 w-11 transition-transform duration-500 group-hover:rotate-[-6deg] md:h-12 md:w-12"
              tone={overHero ? heroInk : 'var(--color-espresso)'}
              accent={overHero ? heroAccent : 'var(--color-caramel)'}
            />
            <Wordmark
              className="hidden text-[0.9rem] sm:inline-flex"
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
                      overHero
                        ? 'text-on-deep/80 hover:text-on-deep'
                        : 'text-cocoa/75 hover:text-espresso',
                      isActive && (overHero ? 'text-on-deep' : 'text-espresso'),
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
                            overHero ? 'bg-accent' : 'bg-caramel',
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
                overHero ? 'text-on-deep/75 hover:text-on-deep' : 'text-cocoa/70 hover:text-espresso',
              )}
            >
              <Phone size={15} strokeWidth={1.8} />
              {CONTACT.phoneDisplay}
            </a>

            <ThemeToggle onDark={overHero} className="hidden sm:flex" />

            <button
              type="button"
              onClick={openCart}
              className={classNames(
                'relative flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-300',
                overHero
                  ? 'border-on-deep/25 text-on-deep hover:bg-on-deep/10'
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
                    className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[0.6875rem] font-semibold text-espresso"
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
                overHero
                  ? 'border-on-deep/25 text-on-deep hover:bg-on-deep/10'
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
              className="absolute inset-0 bg-espresso/55 backdrop-blur-sm"
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
                <Wordmark className="text-[0.9rem]" tone="#2A1810" />
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
                  <span className="text-[0.85rem] text-cocoa/70">Look</span>
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
