import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, PackageSearch, Search } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import OrderTimeline from '../components/OrderTimeline'
import CreationArt from '../art/CreationArt'
import { Button, Pill } from '../components/ui'
import { TextInput } from '../components/Field'
import { CONTACT } from '../data/site'
import { fetchOrder, statusMeta, whatsappEnquiryLink } from '../lib/orders'
import { money, prettyDate, prettyDateTime, relativeDay } from '../lib/format'
import usePageMeta from '../lib/usePageMeta'

export default function TrackOrder() {
  const { code: routeCode } = useParams()
  const navigate = useNavigate()
  const [code, setCode] = useState(routeCode || '')
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  usePageMeta({
    title: 'Track your order — Dussa BakeLab',
    description:
      'Enter your Dussa BakeLab order code to see exactly where your cake is — confirmed, in the kitchen, or ready for collection.',
  })

  const lookup = async (value) => {
    const clean = String(value || '').trim().toUpperCase()
    if (!clean) return
    setLoading(true)
    const found = await fetchOrder(clean)
    setOrder(found)
    setSearched(true)
    setLoading(false)
  }

  useEffect(() => {
    if (routeCode) lookup(routeCode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeCode])

  const onSubmit = (e) => {
    e.preventDefault()
    const clean = code.trim().toUpperCase()
    if (!clean) return
    navigate(`/track/${clean}`, { replace: true })
    lookup(clean)
  }

  return (
    <>
      <PageHeader
        eyebrow="Order tracking"
        title="Where is my cake?"
        lead="Enter the code from your confirmation — it looks like DBL-XXXXXXX — and we will show you exactly where the order is."
        crumbs={[{ label: 'Track order' }]}
      />

      <section className="bg-cream py-14 md:py-20">
        <div className="container-x">
          <form onSubmit={onSubmit} className="mx-auto flex max-w-xl flex-col gap-3 sm:flex-row">
            <label htmlFor="track-code" className="sr-only">
              Order code
            </label>
            <div className="relative flex-1">
              <Search
                size={17}
                strokeWidth={1.8}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cocoa/40"
                aria-hidden="true"
              />
              <TextInput
                id="track-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="DBL-XXXXXXX"
                className="pl-11 uppercase tracking-[0.08em]"
                autoComplete="off"
              />
            </div>
            <Button type="submit" size="lg" disabled={loading} className="shrink-0">
              {loading ? <Loader2 size={17} className="animate-spin" /> : 'Track order'}
            </Button>
          </form>

          {searched && !loading && !order && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto mt-12 max-w-lg rounded-[2rem] border border-dashed border-caramel/35 bg-porcelain/60 p-10 text-center"
            >
              <PackageSearch size={34} strokeWidth={1.4} className="mx-auto text-caramel" />
              <h2 className="mt-5 font-display text-2xl text-espresso">No order under that code</h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-cocoa/62">
                Double-check the code from your confirmation. If it still will not load, message us
                on WhatsApp with your name and date — we will find it in seconds.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Button href={whatsappEnquiryLink(`Hello! I'm trying to track order ${code}.`)}>
                  Ask on WhatsApp
                </Button>
                <Button href={CONTACT.phoneHref} variant="outline">
                  Call {CONTACT.phoneDisplay}
                </Button>
              </div>
            </motion.div>
          )}

          {order && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto mt-12 max-w-4xl"
            >
              <div className="overflow-hidden rounded-[2rem] border border-caramel/25 bg-porcelain shadow-soft">
                <div className="grain relative bg-espresso px-7 py-8 text-cream md:px-10">
                  <div className="relative z-10 flex flex-wrap items-start justify-between gap-5">
                    <div>
                      <p className="eyebrow text-gold">Order {order.code}</p>
                      <h2 className="mt-3 text-[1.9rem] leading-tight">
                        {statusMeta(order.status).label}
                      </h2>
                      <p className="mt-2 text-[0.9rem] text-cream/60">
                        {statusMeta(order.status).hint}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[0.72rem] uppercase tracking-[0.14em] text-cream/45">
                        {order.fulfilment === 'delivery' ? 'Delivery' : 'Collection'}
                      </p>
                      <p className="mt-1.5 font-display text-[1.25rem] text-gold">
                        {prettyDate(order.date)}
                      </p>
                      <p className="text-[0.8rem] text-cream/55">
                        {order.time} · {relativeDay(order.date)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-9 p-7 md:grid-cols-2 md:p-10">
                  <div>
                    <h3 className="font-display text-[1.15rem] text-espresso">Progress</h3>
                    <OrderTimeline status={order.status} className="mt-5" />
                    <p className="mt-4 text-[0.78rem] text-cocoa/50">
                      Placed {prettyDateTime(order.createdAt)}
                      {order.updatedAt && order.updatedAt !== order.createdAt && (
                        <> · updated {prettyDateTime(order.updatedAt)}</>
                      )}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-display text-[1.15rem] text-espresso">In this order</h3>
                    <ul className="mt-5 space-y-3">
                      {order.items?.map((item, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-blush/60">
                            <CreationArt
                              variant={item.art || 'dripCake'}
                              flavor={item.flavorArt || 'chocolate'}
                              seed={`${order.code}-${i}`}
                              className="h-full w-full"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[0.875rem] text-espresso">
                              {item.quantity} × {item.name}
                            </p>
                            <p className="truncate text-[0.75rem] text-cocoa/55">
                              {[item.sizeLabel, item.flavorLabel].filter(Boolean).join(' · ')}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-6 flex items-center justify-between border-t border-caramel/22 pt-4">
                      <span className="text-[0.85rem] text-cocoa/60">Order total</span>
                      <span className="font-display text-[1.35rem] tabular-nums text-espresso">
                        {money(order.total)}
                      </span>
                    </div>

                    {order.offline && (
                      <Pill tone="gold" className="mt-4">
                        Saved on this device
                      </Pill>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-7 text-center">
                <p className="text-[0.9rem] text-cocoa/60">
                  Something needs changing? Message us at least 48 hours before your date.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  <Button
                    href={whatsappEnquiryLink(
                      `Hello Dussa BakeLab! I'd like to ask about order ${order.code}.`,
                    )}
                    variant="outline"
                  >
                    Message about this order
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </>
  )
}
