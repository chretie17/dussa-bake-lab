import { Link } from 'react-router-dom'
import { Mail, MapPin, Phone } from 'lucide-react'
import { InstagramIcon, WhatsAppIcon } from './BrandIcons'
import { LogoMark, Wordmark } from '../art/Logo'
import { NAV_LINKS } from '../data/site'
import { useCatalog } from '../context/CatalogContext'
import { whatsappEnquiryLink } from '../lib/orders'
import { Flourish } from './ui'

export default function Footer() {
  const { brand, contact, hours, fulfilment, categories } = useCatalog()
  const year = new Date().getFullYear()
  const instagramUrl = contact.instagramUrl || `https://www.instagram.com/${contact.instagram}`
  const phoneHref = contact.phoneHref || `tel:+${contact.whatsapp}`

  return (
    <footer className="grain relative overflow-hidden bg-deep text-on-deep">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-accent-soft/16 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-52 right-0 h-[28rem] w-[28rem] rounded-full bg-accent/10 blur-3xl"
      />

      <div className="container-x relative z-10 py-20">
        <div className="text-center">
          <p className="script text-[clamp(2.4rem,6vw,3.6rem)] leading-none text-accent">
            {brand.script}
          </p>
          <Flourish className="mt-7" tone="text-caramel" />
        </div>

        <div className="mt-16 grid gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <div className="flex items-center gap-3">
              <LogoMark className="h-12 w-12" tone="#FAF3EA" accent="#D4A574" />
              <Wordmark tone="#FAF3EA" accent="#D4A574" className="text-[1rem]" />
            </div>
            <p className="mt-5 max-w-xs text-[0.9rem] leading-relaxed text-on-deep/60">
              {brand.description}
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href={whatsappEnquiryLink()}
                target="_blank"
                rel="noreferrer noopener"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-on-deep/20 text-on-deep/80 transition-all hover:border-accent hover:bg-accent hover:text-espresso"
                aria-label="Message Dussa BakeLab on WhatsApp"
              >
                <WhatsAppIcon size={18} />
              </a>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-on-deep/20 text-on-deep/80 transition-all hover:border-accent hover:bg-accent hover:text-espresso"
                aria-label="Dussa BakeLab on Instagram"
              >
                <InstagramIcon size={18} strokeWidth={1.7} />
              </a>
              <a
                href={`mailto:${contact.email}`}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-on-deep/20 text-on-deep/80 transition-all hover:border-accent hover:bg-accent hover:text-espresso"
                aria-label="Email Dussa BakeLab"
              >
                <Mail size={18} strokeWidth={1.7} />
              </a>
            </div>
          </div>

          <nav aria-label="Creations">
            <h3 className="eyebrow text-accent">Creations</h3>
            <ul className="mt-5 space-y-3 text-[0.9rem]">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/creations?category=${c.id}`}
                    className="text-on-deep/65 transition-colors hover:text-accent"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Company">
            <h3 className="eyebrow text-accent">Company</h3>
            <ul className="mt-5 space-y-3 text-[0.9rem]">
              {NAV_LINKS.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-on-deep/65 transition-colors hover:text-accent">
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/admin" className="text-on-deep/40 transition-colors hover:text-accent">
                  Bakery dashboard
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h3 className="eyebrow text-accent">Order via</h3>
            <ul className="mt-5 space-y-4 text-[0.9rem]">
              <li>
                <a
                  href={phoneHref}
                  className="flex items-start gap-3 text-on-deep/65 transition-colors hover:text-accent"
                >
                  <Phone size={16} strokeWidth={1.7} className="mt-0.5 shrink-0 text-caramel" />
                  {contact.phoneDisplay}
                </a>
              </li>
              <li>
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-start gap-3 text-on-deep/65 transition-colors hover:text-accent"
                >
                  <InstagramIcon size={16} strokeWidth={1.7} className="mt-0.5 shrink-0 text-caramel" />
                  @{contact.instagram}
                </a>
              </li>
              <li className="flex items-start gap-3 text-on-deep/65">
                <MapPin size={16} strokeWidth={1.7} className="mt-0.5 shrink-0 text-caramel" />
                {contact.location}
              </li>
            </ul>

            <h3 className="eyebrow mt-8 text-accent">Kitchen hours</h3>
            <ul className="mt-4 space-y-2 text-[0.8rem] text-on-deep/55">
              {hours.map((h) => (
                <li key={h.day} className="flex justify-between gap-4">
                  <span>{h.day}</span>
                  <span className="text-on-deep/75">{h.time}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-y border-on-deep/12 py-5 text-center text-[0.72rem] tracking-[0.12em] text-on-deep/45 uppercase">
          {fulfilment.payments.map((p) => (
            <span key={p}>{p}</span>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 text-[0.78rem] text-on-deep/45 md:flex-row">
          <p>
            © {year} {brand.name}. Baked in {brand.city}, {brand.country}.
          </p>
          <p className="flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-caramel" aria-hidden="true" />
            {`${brand.city}, ${brand.country}`}
          </p>
        </div>
      </div>
    </footer>
  )
}
