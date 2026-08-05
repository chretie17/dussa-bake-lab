import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Clock, Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react'
import { InstagramIcon, WhatsAppIcon } from '../components/BrandIcons'
import PageHeader from '../components/PageHeader'
import { Field, Select, TextArea, TextInput } from '../components/Field'
import { Button, Flourish, Reveal, Section, SectionHeading } from '../components/ui'
import { CONTACT, FULFILMENT, HOURS } from '../data/site'
import { OCCASIONS } from '../data/catalog'
import { FAQS } from '../data/content'
import { whatsappEnquiryLink } from '../lib/orders'
import { classNames, isValidEmail, isValidPhone } from '../lib/format'
import usePageMeta from '../lib/usePageMeta'

const CHANNELS = [
  {
    icon: WhatsAppIcon,
    label: 'WhatsApp',
    value: CONTACT.phoneDisplay,
    note: 'Fastest — usually answered within the hour',
    href: whatsappEnquiryLink(),
    accent: 'bg-[#25D366]/15 text-[#128C4A]',
  },
  {
    icon: Phone,
    label: 'Call us',
    value: CONTACT.phoneDisplay,
    note: 'During kitchen hours',
    href: CONTACT.phoneHref,
    accent: 'bg-blush text-choco',
  },
  {
    icon: InstagramIcon,
    label: 'Instagram',
    value: `@${CONTACT.instagram}`,
    note: 'See what came out of the oven today',
    href: CONTACT.instagramUrl,
    accent: 'bg-gold/22 text-mocha',
  },
  {
    icon: Mail,
    label: 'Email',
    value: CONTACT.email,
    note: 'For quotes, invoices and corporate orders',
    href: `mailto:${CONTACT.email}`,
    accent: 'bg-caramel/18 text-choco',
  },
]

export default function Contact() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', occasion: '', message: '' })
  const [errors, setErrors] = useState({})

  usePageMeta({
    title: 'Contact Dussa BakeLab — Kigali, Rwanda',
    description:
      'Talk to Dussa BakeLab about cakes, custom designs and delivery across Kigali. WhatsApp 0788 722 064, call us, or send an enquiry.',
  })

  const update = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  /**
   * Enquiries hand off to WhatsApp rather than a mailbox nobody watches — it is
   * where the bakery actually replies, and it works without a backend.
   */
  const send = (e) => {
    e.preventDefault()
    const next = {}
    if (form.name.trim().length < 2) next.name = 'Please tell us your name.'
    if (!isValidPhone(form.phone)) next.phone = 'Enter a valid Rwandan number, e.g. 0788 722 064.'
    if (!isValidEmail(form.email)) next.email = 'That email address does not look right.'
    if (form.message.trim().length < 10) next.message = 'A sentence or two helps us answer properly.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    const text = [
      'Hello Dussa BakeLab!',
      '',
      form.message.trim(),
      '',
      `Name: ${form.name.trim()}`,
      `Phone: ${form.phone.trim()}`,
      form.email.trim() ? `Email: ${form.email.trim()}` : null,
      form.occasion ? `Occasion: ${form.occasion}` : null,
    ]
      .filter(Boolean)
      .join('\n')

    window.open(whatsappEnquiryLink(text), '_blank', 'noopener')
  }

  return (
    <>
      <PageHeader
        eyebrow="Say hello"
        title="Let's talk cake"
        lead="Questions about a design, a date or a delivery zone? We answer fast — and we would rather talk it through than have you guess."
        crumbs={[{ label: 'Contact' }]}
      />

      <Section className="bg-cream">
        <div className="container-x">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CHANNELS.map((c, i) => {
              const Icon = c.icon
              return (
                <Reveal key={c.label} delay={i * 0.07}>
                  <a
                    href={c.href}
                    target={c.href.startsWith('http') ? '_blank' : undefined}
                    rel={c.href.startsWith('http') ? 'noreferrer noopener' : undefined}
                    className="group flex h-full flex-col rounded-[1.5rem] border border-caramel/22 bg-porcelain p-6 transition-all duration-500 hover:-translate-y-1.5 hover:border-caramel/50 hover:shadow-soft"
                  >
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${c.accent} transition-transform duration-400 group-hover:scale-110`}
                    >
                      <Icon size={20} strokeWidth={1.7} />
                    </span>
                    <span className="eyebrow mt-5 text-caramel">{c.label}</span>
                    <span className="mt-2 font-display text-[1.1rem] text-espresso">{c.value}</span>
                    <span className="mt-1.5 text-[0.8rem] leading-relaxed text-cocoa/55">
                      {c.note}
                    </span>
                  </a>
                </Reveal>
              )
            })}
          </div>

          <div className="mt-16 grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            {/* ------------------------------------------- form */}
            <div>
              <SectionHeading
                eyebrow="Send an enquiry"
                title="Tell us what you have in mind"
                lead="Fill this in and we will open WhatsApp with your message ready to send — the quickest way to reach the kitchen."
              />

              <form onSubmit={send} className="mt-8 grid gap-5 sm:grid-cols-2">
                <Field label="Your name" htmlFor="c-name" required error={errors.name}>
                  <TextInput
                    id="c-name"
                    value={form.name}
                    error={errors.name}
                    autoComplete="name"
                    placeholder="Keza Uwase"
                    onChange={(e) => update('name', e.target.value)}
                  />
                </Field>

                <Field label="Phone / WhatsApp" htmlFor="c-phone" required error={errors.phone}>
                  <TextInput
                    id="c-phone"
                    type="tel"
                    value={form.phone}
                    error={errors.phone}
                    autoComplete="tel"
                    placeholder="0788 722 064"
                    onChange={(e) => update('phone', e.target.value)}
                  />
                </Field>

                <Field label="Email" htmlFor="c-email" hint="optional" error={errors.email}>
                  <TextInput
                    id="c-email"
                    type="email"
                    value={form.email}
                    error={errors.email}
                    autoComplete="email"
                    placeholder="you@example.com"
                    onChange={(e) => update('email', e.target.value)}
                  />
                </Field>

                <Field label="Occasion" htmlFor="c-occasion" hint="optional">
                  <Select
                    id="c-occasion"
                    value={form.occasion}
                    onChange={(e) => update('occasion', e.target.value)}
                  >
                    <option value="">Not sure yet</option>
                    {OCCASIONS.map((o) => (
                      <option key={o.id} value={o.label}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field
                  label="Your message"
                  htmlFor="c-message"
                  required
                  error={errors.message}
                  className="sm:col-span-2"
                >
                  <TextArea
                    id="c-message"
                    rows={5}
                    value={form.message}
                    error={errors.message}
                    placeholder="The date, roughly how many people, and any design ideas you have seen…"
                    onChange={(e) => update('message', e.target.value)}
                  />
                </Field>

                <div className="sm:col-span-2">
                  <Button type="submit" size="lg" sheen>
                    <Send size={16} strokeWidth={1.9} /> Send via WhatsApp
                  </Button>
                  <p className="mt-3 text-[0.78rem] text-cocoa/50">
                    Ready to book instead?{' '}
                    <a href="/order" className="text-caramel underline-offset-4 hover:underline">
                      Use the order form
                    </a>{' '}
                    and get an order code straight away.
                  </p>
                </div>
              </form>
            </div>

            {/* --------------------------------------- practical */}
            <div className="space-y-5">
              <div className="rounded-[1.5rem] border border-caramel/22 bg-porcelain p-6">
                <div className="flex items-center gap-3">
                  <MapPin size={18} strokeWidth={1.7} className="text-caramel" />
                  <h3 className="font-display text-[1.15rem] text-espresso">Where we bake</h3>
                </div>
                <p className="mt-3 text-[0.9rem] leading-relaxed text-cocoa/65">
                  Our kitchen is in {CONTACT.location}. We are a production kitchen rather than a
                  walk-in shop, so collections happen at a booked slot — we send the exact pin with
                  your confirmation.
                </p>
                <Button
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CONTACT.mapQuery)}`}
                  variant="outline"
                  size="sm"
                  className="mt-4"
                >
                  Open in Maps
                </Button>
              </div>

              <div className="rounded-[1.5rem] border border-caramel/22 bg-porcelain p-6">
                <div className="flex items-center gap-3">
                  <Clock size={18} strokeWidth={1.7} className="text-caramel" />
                  <h3 className="font-display text-[1.15rem] text-espresso">Kitchen hours</h3>
                </div>
                <ul className="mt-4 space-y-2.5 text-[0.875rem]">
                  {HOURS.map((h) => (
                    <li key={h.day} className="flex justify-between gap-4 border-b border-caramel/12 pb-2.5 last:border-0">
                      <span className="text-cocoa/60">{h.day}</span>
                      <span className="text-right text-espresso">{h.time}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[1.5rem] border border-caramel/22 bg-porcelain p-6">
                <h3 className="font-display text-[1.15rem] text-espresso">Delivery zones</h3>
                <ul className="mt-4 space-y-2 text-[0.875rem] text-cocoa/65">
                  {FULFILMENT.deliveryZones.map((z) => (
                    <li key={z} className="flex items-start gap-2.5">
                      <span
                        aria-hidden="true"
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-caramel"
                      />
                      {z}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-[0.8rem] leading-relaxed text-cocoa/55">
                  Somewhere else in Rwanda? Ask us — we quote longer runs case by case.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* --------------------------------------------------- FAQ */}
      <Section className="bg-blush/45">
        <div className="container-x">
          <SectionHeading
            align="center"
            eyebrow="Before you ask"
            title="Frequently asked questions"
          />
          <Flourish className="mt-8" />
          <div className="mx-auto mt-12 max-w-3xl space-y-3">
            {FAQS.map((faq, i) => (
              <FaqItem key={faq.q} faq={faq} index={i} />
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-[0.9375rem] text-cocoa/62">Still not answered?</p>
            <Button href={whatsappEnquiryLink()} className="mt-4" sheen>
              <MessageCircle size={16} strokeWidth={1.9} /> Ask us on WhatsApp
            </Button>
          </div>
        </div>
      </Section>
    </>
  )
}

function FaqItem({ faq, index }) {
  const [open, setOpen] = useState(index === 0)

  return (
    <div className="overflow-hidden rounded-2xl border border-caramel/22 bg-porcelain">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-5 p-5 text-left transition-colors hover:bg-cream/50"
      >
        <span className="font-display text-[1.05rem] leading-snug text-espresso">{faq.q}</span>
        <ChevronDown
          size={18}
          strokeWidth={2}
          className={classNames(
            'shrink-0 text-caramel transition-transform duration-300',
            open && 'rotate-180',
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-5 text-[0.9375rem] leading-relaxed text-cocoa/68">{faq.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
