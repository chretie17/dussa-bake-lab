import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, Copy, Info, MessageCircle, Printer } from 'lucide-react'
import CreationArt from '../art/CreationArt'
import OrderTimeline from '../components/OrderTimeline'
import { Button, Flourish } from '../components/ui'
import { CONTACT, FULFILMENT } from '../data/site'
import { fetchOrder, whatsappOrderLink } from '../lib/orders'
import { money, prettyDate, relativeDay } from '../lib/format'
import usePageMeta from '../lib/usePageMeta'

export default function Confirmation() {
  const { code } = useParams()
  const { state } = useLocation()
  const [order, setOrder] = useState(state?.order || null)
  const [loading, setLoading] = useState(!state?.order)
  const [copied, setCopied] = useState(false)

  usePageMeta({
    title: `Order ${code} confirmed — Dussa BakeLab`,
    description: 'Your Dussa BakeLab order is in. Here is your order code and what happens next.',
  })

  useEffect(() => {
    if (state?.order) return
    let alive = true
    fetchOrder(code).then((found) => {
      if (!alive) return
      setOrder(found)
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [code, state])

  const confetti = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        left: `${(i * 37) % 100}%`,
        delay: (i % 6) * 0.14,
        rotate: (i * 47) % 360,
        color: ['#D4A574', '#B98A5E', '#6B4429', '#E8C9A0'][i % 4],
      })),
    [],
  )

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked — the code is on screen anyway */
    }
  }

  return (
    <>
      <section className="grain relative overflow-hidden bg-deep pb-20 pt-32 text-on-deep md:pt-40">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: 'var(--hero-glow)' }}
        />

        {/* A small shower of caramel confetti on arrival */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-72 overflow-hidden">
          {confetti.map((c, i) => (
            <motion.span
              key={i}
              className="absolute top-0 h-2.5 w-1.5 rounded-[1px]"
              style={{ left: c.left, background: c.color }}
              initial={{ y: -40, opacity: 0, rotate: 0 }}
              animate={{ y: 320, opacity: [0, 1, 1, 0], rotate: c.rotate }}
              transition={{ duration: 2.6, delay: c.delay, ease: 'easeIn' }}
            />
          ))}
        </div>

        <div className="container-x relative z-10 text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-accent/40 bg-accent/15 text-accent"
          >
            <Check size={34} strokeWidth={2.2} />
          </motion.div>

          <p className="eyebrow mt-8 text-accent">Order received</p>
          <h1 className="mt-5 text-[clamp(2.2rem,5.4vw,3.6rem)] leading-[1.06]">
            Thank you{order?.name ? `, ${order.name.split(' ')[0]}` : ''}. We are on it
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[1.0625rem] leading-relaxed text-on-deep/62">
            It has landed in the kitchen. We will confirm the details and the final price
            shortly, usually within a couple of hours while we are open.
          </p>

          <div className="mx-auto mt-9 inline-flex flex-col items-center gap-3 rounded-2xl border border-on-deep/18 bg-on-deep/6 px-8 py-6 backdrop-blur-sm">
            <span className="eyebrow text-on-deep/67">Your order code</span>
            <div className="flex items-center gap-3">
              <span className="font-display text-[clamp(1.8rem,4vw,2.6rem)] leading-none tracking-[0.06em] text-accent">
                {code}
              </span>
              <button
                type="button"
                onClick={copyCode}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-on-deep/22 text-on-deep/70 transition-colors hover:border-accent hover:text-accent"
                aria-label="Copy order code"
              >
                {copied ? <Check size={16} strokeWidth={2.4} /> : <Copy size={16} strokeWidth={1.8} />}
              </button>
            </div>
            <span className="text-[0.78rem] text-on-deep/67">
              Keep this. You can check on your order with it any time
            </span>
          </div>

          {order && (
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Button href={whatsappOrderLink(order)} variant="gold" size="lg" sheen>
                <MessageCircle size={17} strokeWidth={1.9} />
                Send it to us on WhatsApp
              </Button>
              <Button
                to={`/track/${code}`}
                size="lg"
                variant="outlineLight"
              >
                Track this order
              </Button>
            </div>
          )}

          {state?.offline && (
            <div className="mx-auto mt-8 flex max-w-xl items-start gap-3 rounded-2xl border border-accent/30 bg-accent/10 p-5 text-left">
              <Info size={18} strokeWidth={1.8} className="mt-0.5 shrink-0 text-accent" />
              <p className="text-[0.85rem] leading-relaxed text-on-deep/75">
                We saved this order on your device but could not reach our kitchen dashboard just
                now. Please tap <strong className="text-accent">Send it to us on WhatsApp</strong> so
                we definitely get it. Your code stays the same.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="bg-cream py-16 md:py-20">
        <div className="container-x">
          {loading ? (
            <p className="text-center text-cocoa/72">Fetching your order…</p>
          ) : order ? (
            <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
              <div>
                <h2 className="text-[1.6rem] text-espresso">What happens next</h2>
                <OrderTimeline status={order.status || 'new'} className="mt-7" />

                {order.whatsappUpdates !== false && (
                  <div className="mt-9 rounded-2xl border border-caramel/22 bg-porcelain p-6">
                    <h3 className="font-display text-[1.15rem] text-espresso">
                      We will keep you posted on WhatsApp
                    </h3>
                    <p className="mt-2 text-[0.9rem] leading-relaxed text-cocoa/65">
                      A confirmation is on its way to the number you gave us, and we will message
                      you again each time your order moves — confirmed, in the kitchen, then boxed
                      and ready. No need to check back here.
                    </p>
                  </div>
                )}

                <div className="mt-9 rounded-2xl border border-caramel/22 bg-porcelain p-6">
                  <h3 className="font-display text-[1.15rem] text-espresso">
                    {order.payment?.status === 'verified'
                      ? 'Payment received'
                      : order.payment?.status === 'claimed'
                        ? 'Checking your payment'
                        : 'Paying for your order'}
                  </h3>
                  <p className="mt-2 text-[0.9rem] leading-relaxed text-cocoa/65">
                    {order.payment?.status === 'verified' ? (
                      <>
                        Your payment has been checked and received. Nothing more is needed from you
                        — we will take it from here.
                      </>
                    ) : order.payment?.status === 'claimed' ? (
                      <>
                        Thank you — we have your payment note and someone at the bakery is checking
                        it against our Mobile Money statement. You will get a WhatsApp message the
                        moment it is verified.
                      </>
                    ) : (
                      <>
                        We have sent the payment details to your WhatsApp. Pay by{' '}
                        {FULFILMENT.payments.slice(0, 3).join(', ')} or cash on collection, then
                        reply <strong className="text-espresso">PAID</strong> on WhatsApp with a
                        screenshot and we will confirm your order.
                      </>
                    )}
                    {order.depositDue > 0 && order.payment?.status !== 'verified' && (
                      <>
                        {' '}
                        This order is confirmed with a {FULFILMENT.depositPercent}% deposit of{' '}
                        <strong className="text-espresso">{money(order.depositDue)}</strong>.
                      </>
                    )}
                  </p>
                  <p className="mt-4 text-[0.85rem] text-cocoa/60">
                    Anything else? Call{' '}
                    <a href={CONTACT.phoneHref} className="text-caramel underline-offset-4 hover:underline">
                      {CONTACT.phoneDisplay}
                    </a>{' '}
                    or message us any time.
                  </p>
                </div>
              </div>

              <div>
                <div className="rounded-[1.75rem] border border-caramel/25 bg-porcelain p-6 shadow-soft">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="font-display text-[1.25rem] text-espresso">Order details</h2>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="flex items-center gap-1.5 text-[0.78rem] text-cocoa/72 transition-colors hover:text-espresso"
                    >
                      <Printer size={14} strokeWidth={1.8} /> Print
                    </button>
                  </div>

                  <dl className="mt-5 space-y-2.5 text-[0.875rem]">
                    <Row label={order.fulfilment === 'delivery' ? 'Delivery' : 'Collection'}>
                      {prettyDate(order.date)}{' '}
                      <span className="text-cocoa/70">({relativeDay(order.date)})</span>
                    </Row>
                    <Row label="Slot">{order.time}</Row>
                    {order.fulfilment === 'delivery' && <Row label="Address">{order.address}</Row>}
                    <Row label="Contact">
                      {order.name} · {order.phone}
                    </Row>
                    {order.occasion && <Row label="Occasion">{order.occasion}</Row>}
                  </dl>

                  <ul className="mt-6 space-y-3 border-t border-caramel/22 pt-5">
                    {order.items?.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-blush/60">
                          <CreationArt
                            variant={item.art || 'dripCake'}
                            flavor={item.flavorArt || 'chocolate'}
                            seed={`${code}-${i}`}
                            className="h-full w-full"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[0.875rem] text-espresso">
                            {item.quantity} × {item.name}
                          </p>
                          <p className="text-[0.75rem] text-cocoa/72">
                            {[item.sizeLabel, item.flavorLabel, item.frostingLabel]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        </div>
                        <span className="shrink-0 text-[0.85rem] tabular-nums text-espresso">
                          {money(item.linePrice)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <dl className="mt-5 space-y-2 border-t border-caramel/22 pt-5 text-[0.875rem]">
                    <div className="flex justify-between">
                      <dt className="text-cocoa/60">Subtotal</dt>
                      <dd className="tabular-nums">{money(order.subtotal)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-cocoa/60">Delivery</dt>
                      <dd className="tabular-nums">
                        {order.deliveryFee ? money(order.deliveryFee) : 'Free'}
                      </dd>
                    </div>
                    <div className="flex justify-between border-t border-caramel/22 pt-2.5">
                      <dt className="font-medium text-espresso">Total</dt>
                      <dd className="font-display text-[1.4rem] leading-none tabular-nums text-espresso">
                        {money(order.total)}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-6 text-center">
                  <Button to="/creations" variant="outline">
                    Keep browsing
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-lg rounded-[2rem] border border-dashed border-caramel/35 bg-porcelain/60 p-10 text-center">
              <h2 className="font-display text-2xl text-espresso">
                We could not load order {code}
              </h2>
              <p className="mt-3 text-[0.9375rem] text-cocoa/62">
                The order may have been placed on another device. Try the tracker, or message us and
                we will look it up for you.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Button to="/track">Track an order</Button>
                <Link
                  to="/contact"
                  className="inline-flex items-center text-[0.875rem] text-caramel underline-offset-4 hover:underline"
                >
                  Contact us
                </Link>
              </div>
            </div>
          )}

          <Flourish className="mt-16" />
        </div>
      </section>
    </>
  )
}

function Row({ label, children }) {
  return (
    <div className="flex gap-4">
      <dt className="w-24 shrink-0 text-cocoa/70">{label}</dt>
      <dd className="text-espresso">{children}</dd>
    </div>
  )
}
