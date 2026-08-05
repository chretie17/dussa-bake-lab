import { Link } from 'react-router-dom'
import { Mail, MapPin, Phone } from 'lucide-react'
import { InstagramIcon, WhatsAppIcon } from './BrandIcons'
import { LogoMark, Wordmark } from '../art/Logo'
import { BRAND, CONTACT, FULFILMENT, HOURS, NAV_LINKS } from '../data/site'
import { CATEGORIES } from '../data/catalog'
import { whatsappEnquiryLink } from '../lib/orders'
import { Flourish } from './ui'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="grain relative overflow-hidden bg-espresso text-cream">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-caramel/16 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-52 right-0 h-[28rem] w-[28rem] rounded-full bg-gold/10 blur-3xl"
      />

      <div className="container-x relative z-10 py-20">
        <div className="text-center">
          <p className="script text-[clamp(2.4rem,6vw,3.6rem)] leading-none text-gold">
            {BRAND.script}
          </p>
          <Flourish className="mt-7" tone="text-caramel" />
        </div>

        <div className="mt-16 grid gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <div className="flex items-center gap-3">
              <LogoMark className="h-12 w-12" tone="#FAF3EA" accent="#D4A574" />
              <Wordmark tone="#FAF3EA" accent="#D4A574" className="text-[1rem]" />
            </div>
            <p className="mt-5 max-w-xs text-[0.9rem] leading-relaxed text-cream/60">
              {BRAND.description}
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href={whatsappEnquiryLink()}
                target="_blank"
                rel="noreferrer noopener"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-cream/20 text-cream/80 transition-all hover:border-gold hover:bg-gold hover:text-espresso"
                aria-label="Message Dussa BakeLab on WhatsApp"
              >
                <WhatsAppIcon size={18} />
              </a>
              <a
                href={CONTACT.instagramUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-cream/20 text-cream/80 transition-all hover:border-gold hover:bg-gold hover:text-espresso"
                aria-label="Dussa BakeLab on Instagram"
              >
                <InstagramIcon size={18} strokeWidth={1.7} />
              </a>
              <a
                href={`mailto:${CONTACT.email}`}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-cream/20 text-cream/80 transition-all hover:border-gold hover:bg-gold hover:text-espresso"
                aria-label="Email Dussa BakeLab"
              >
                <Mail size={18} strokeWidth={1.7} />
              </a>
            </div>
          </div>

          <nav aria-label="Creations">
            <h3 className="eyebrow text-gold">Creations</h3>
            <ul className="mt-5 space-y-3 text-[0.9rem]">
              {CATEGORIES.map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/creations?category=${c.id}`}
                    className="text-cream/65 transition-colors hover:text-gold"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Company">
            <h3 className="eyebrow text-gold">Company</h3>
            <ul className="mt-5 space-y-3 text-[0.9rem]">
              {NAV_LINKS.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-cream/65 transition-colors hover:text-gold">
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/admin" className="text-cream/40 transition-colors hover:text-gold">
                  Bakery dashboard
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h3 className="eyebrow text-gold">Order via</h3>
            <ul className="mt-5 space-y-4 text-[0.9rem]">
              <li>
                <a
                  href={CONTACT.phoneHref}
                  className="flex items-start gap-3 text-cream/65 transition-colors hover:text-gold"
                >
                  <Phone size={16} strokeWidth={1.7} className="mt-0.5 shrink-0 text-caramel" />
                  {CONTACT.phoneDisplay}
                </a>
              </li>
              <li>
                <a
                  href={CONTACT.instagramUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-start gap-3 text-cream/65 transition-colors hover:text-gold"
                >
                  <InstagramIcon size={16} strokeWidth={1.7} className="mt-0.5 shrink-0 text-caramel" />
                  @{CONTACT.instagram}
                </a>
              </li>
              <li className="flex items-start gap-3 text-cream/65">
                <MapPin size={16} strokeWidth={1.7} className="mt-0.5 shrink-0 text-caramel" />
                {CONTACT.location}
              </li>
            </ul>

            <h3 className="eyebrow mt-8 text-gold">Kitchen hours</h3>
            <ul className="mt-4 space-y-2 text-[0.8rem] text-cream/55">
              {HOURS.map((h) => (
                <li key={h.day} className="flex justify-between gap-4">
                  <span>{h.day}</span>
                  <span className="text-cream/75">{h.time}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-y border-cream/12 py-5 text-center text-[0.72rem] tracking-[0.12em] text-cream/45 uppercase">
          {FULFILMENT.payments.map((p) => (
            <span key={p}>{p}</span>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 text-[0.78rem] text-cream/45 md:flex-row">
          <p>
            © {year} {BRAND.name}. Baked in {BRAND.city}, {BRAND.country}.
          </p>
          <p className="flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-caramel" aria-hidden="true" />
            {BRAND.promise}
          </p>
        </div>
      </div>
    </footer>
  )
}
