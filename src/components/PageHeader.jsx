import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { Eyebrow } from './ui'

/** Interior page banner. Colours adapt to the chosen site theme. */
export default function PageHeader({ eyebrow, title, lead, crumbs = [], children }) {
  return (
    <header className="grain relative overflow-hidden bg-deep pb-16 pt-32 text-on-deep md:pb-20 md:pt-40">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: 'var(--hero-glow)' }}
      />

      <div className="container-x relative z-10">
        {crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-7">
            <ol className="flex flex-wrap items-center gap-1.5 text-[0.78rem] text-on-deep/70">
              <li>
                <Link to="/" className="transition-colors hover:text-accent">
                  Home
                </Link>
              </li>
              {crumbs.map((crumb) => (
                <li key={crumb.label} className="flex items-center gap-1.5">
                  <ChevronRight size={13} strokeWidth={2} className="opacity-50" aria-hidden="true" />
                  {crumb.to ? (
                    <Link to={crumb.to} className="transition-colors hover:text-accent">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-on-deep/75">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl"
        >
          {eyebrow && <Eyebrow tone="text-accent">{eyebrow}</Eyebrow>}
          <h1 className="mt-5 text-[clamp(2.2rem,5.4vw,3.8rem)] leading-[1.05]">{title}</h1>
          {lead && (
            <p className="mt-5 max-w-xl text-[1.0625rem] leading-relaxed text-on-deep/80">{lead}</p>
          )}
          {children}
        </motion.div>
      </div>
    </header>
  )
}
