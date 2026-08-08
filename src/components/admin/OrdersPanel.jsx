import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Phone, Search } from 'lucide-react'
import { TextInput } from '../Field'
import { Button, Pill } from '../ui'
import { ORDER_STATUSES, statusMeta } from '../../lib/orders'
import { classNames, money, prettyDate, prettyDateTime, relativeDay } from '../../lib/format'

const TONE_CLASSES = {
  gold: 'bg-gold/25 text-cocoa border-gold/45',
  blue: 'bg-sky-100 text-sky-800 border-sky-200',
  amber: 'bg-amber-100 text-amber-800 border-amber-200',
  green: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  slate: 'bg-stone-100 text-stone-700 border-stone-200',
  red: 'bg-red-100 text-red-800 border-red-200',
}

const PAYMENT_TONE = {
  verified: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  claimed: 'bg-amber-100 text-amber-800 border-amber-200',
  unpaid: 'bg-stone-100 text-stone-600 border-stone-200',
}

const PAYMENT_LABEL = {
  verified: 'Paid',
  claimed: 'Says paid',
  unpaid: 'Unpaid',
}

/** The kitchen queue: incoming orders, their details and their status. */
export default function OrdersPanel({
  orders,
  onChangeStatus,
  onChangePayment,
  adminKey,
  busyCode,
}) {
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(null)

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const active = orders.filter((o) => !['completed', 'cancelled'].includes(o.status))
    return [
      { label: 'Open orders', value: active.length },
      { label: 'New today', value: orders.filter((o) => (o.createdAt || '').startsWith(today)).length },
      { label: 'In the kitchen', value: orders.filter((o) => o.status === 'baking').length },
      { label: 'Open value', value: money(active.reduce((sum, o) => sum + (o.total || 0), 0)) },
    ]
  }, [orders])

  const visible = useMemo(() => {
    let list = [...orders]
    if (filter !== 'all') list = list.filter((o) => o.status === filter)

    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter((o) =>
        [o.code, o.name, o.phone, o.email, o.address, o.occasion]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q),
      )
    }

    // Soonest fulfilment date first — that is the kitchen's actual queue.
    return list.sort((a, b) => String(a.date).localeCompare(String(b.date)))
  }, [orders, filter, query])

  const changeStatus = (code, status) => onChangeStatus(code, status)

  return (
    <div>
        {/* -------------------------------------------------- stats */}
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-caramel/22 bg-porcelain p-5">
              <p className="text-[0.72rem] uppercase tracking-[0.14em] text-cocoa/45">{s.label}</p>
              <p className="mt-2 font-display text-[1.7rem] leading-none text-espresso">{s.value}</p>
            </div>
          ))}
        </div>

        {/* ------------------------------------------------ filters */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[13rem] flex-1">
            <Search
              size={16}
              strokeWidth={1.8}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cocoa/40"
              aria-hidden="true"
            />
            <TextInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search code, name, phone, address…"
              className="pl-11"
              aria-label="Search orders"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
              All ({orders.length})
            </FilterChip>
            {ORDER_STATUSES.map((s) => {
              const n = orders.filter((o) => o.status === s.id).length
              if (n === 0 && s.id !== 'new') return null
              return (
                <FilterChip key={s.id} active={filter === s.id} onClick={() => setFilter(s.id)}>
                  {s.label} ({n})
                </FilterChip>
              )
            })}
          </div>
        </div>

        {/* ------------------------------------------------- orders */}
        {visible.length === 0 ? (
          <div className="mt-10 rounded-[2rem] border border-dashed border-caramel/35 bg-porcelain/60 p-14 text-center">
            <h2 className="font-display text-xl text-espresso">
              {orders.length === 0 ? 'No orders yet' : 'Nothing matches that filter'}
            </h2>
            <p className="mt-2 text-[0.9rem] text-cocoa/55">
              {orders.length === 0
                ? 'Orders placed on the website land here automatically.'
                : 'Try a different status or clear the search.'}
            </p>
          </div>
        ) : (
          <ul className="mt-8 space-y-3">
            {visible.map((order) => {
              const isOpen = expanded === order.code
              const meta = statusMeta(order.status)
              return (
                <li
                  key={order.code}
                  className="overflow-hidden rounded-2xl border border-caramel/22 bg-porcelain"
                >
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : order.code)}
                    className="flex w-full flex-wrap items-center gap-4 p-5 text-left transition-colors hover:bg-cream/60"
                    aria-expanded={isOpen}
                  >
                    <div className="min-w-[7.5rem]">
                      <p className="font-display text-[1.05rem] text-espresso">{order.code}</p>
                      <p className="text-[0.72rem] text-cocoa/45">
                        {prettyDateTime(order.createdAt)}
                      </p>
                    </div>

                    <div className="min-w-[9rem] flex-1">
                      <p className="text-[0.9rem] font-medium text-espresso">{order.name}</p>
                      <p className="text-[0.78rem] text-cocoa/55">{order.phone}</p>
                    </div>

                    <div className="min-w-[9rem]">
                      <p className="text-[0.85rem] text-espresso">{prettyDate(order.date)}</p>
                      <p className="text-[0.75rem] text-cocoa/55">
                        {order.fulfilment === 'delivery' ? 'Delivery' : 'Collection'} ·{' '}
                        {relativeDay(order.date)}
                      </p>
                    </div>

                    <div className="min-w-[6rem] text-right">
                      <p className="font-display text-[1.1rem] tabular-nums text-espresso">
                        {money(order.total)}
                      </p>
                      <p className="text-[0.72rem] text-cocoa/45">
                        {order.items?.reduce((n, i) => n + i.quantity, 0)} items
                      </p>
                    </div>

                    <span
                      className={classNames(
                        'shrink-0 rounded-full border px-3 py-1 text-[0.7rem] font-medium',
                        PAYMENT_TONE[order.payment?.status] || PAYMENT_TONE.unpaid,
                      )}
                    >
                      {PAYMENT_LABEL[order.payment?.status] || PAYMENT_LABEL.unpaid}
                    </span>

                    <span
                      className={classNames(
                        'shrink-0 rounded-full border px-3 py-1 text-[0.7rem] font-medium',
                        TONE_CLASSES[meta.tone] || TONE_CLASSES.gold,
                      )}
                    >
                      {meta.label}
                    </span>

                    <ChevronDown
                      size={17}
                      strokeWidth={2}
                      className={classNames(
                        'shrink-0 text-cocoa/40 transition-transform duration-300',
                        isOpen && 'rotate-180',
                      )}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden border-t border-caramel/18 bg-cream/50"
                      >
                        <div className="grid gap-7 p-6 md:grid-cols-[1.2fr_0.8fr]">
                          <div>
                            <h3 className="eyebrow text-cocoa/50">Items</h3>
                            <ul className="mt-3 space-y-3">
                              {order.items?.map((item, i) => (
                                <li key={i} className="rounded-xl border border-caramel/18 bg-porcelain p-3.5">
                                  <div className="flex items-start justify-between gap-4">
                                    <p className="text-[0.9rem] font-medium text-espresso">
                                      {item.quantity} × {item.name}
                                    </p>
                                    <span className="shrink-0 text-[0.85rem] tabular-nums text-cocoa/70">
                                      {money(item.linePrice)}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-[0.78rem] text-cocoa/60">
                                    {[item.sizeLabel, item.flavorLabel, item.frostingLabel]
                                      .filter(Boolean)
                                      .join(' · ')}
                                  </p>
                                  {item.addonLabels?.length > 0 && (
                                    <p className="mt-1 text-[0.75rem] text-caramel">
                                      + {item.addonLabels.join(', ')}
                                    </p>
                                  )}
                                  {item.message && (
                                    <p className="mt-1 text-[0.78rem] italic text-cocoa/65">
                                      Pipe: “{item.message}”
                                    </p>
                                  )}
                                  {item.brief && (
                                    <p className="mt-1.5 rounded-lg bg-blush/60 p-2.5 text-[0.78rem] leading-relaxed text-cocoa/75">
                                      {item.brief}
                                    </p>
                                  )}
                                </li>
                              ))}
                            </ul>

                            {order.notes && (
                              <>
                                <h3 className="eyebrow mt-6 text-cocoa/50">Customer notes</h3>
                                <p className="mt-2 rounded-xl border border-caramel/18 bg-porcelain p-3.5 text-[0.85rem] leading-relaxed text-cocoa/75">
                                  {order.notes}
                                </p>
                              </>
                            )}
                          </div>

                          <div>
                            <h3 className="eyebrow text-cocoa/50">Fulfilment</h3>
                            <dl className="mt-3 space-y-2 text-[0.85rem]">
                              <Detail label="Type">
                                {order.fulfilment === 'delivery' ? 'Delivery' : 'Collection'}
                              </Detail>
                              <Detail label="Date">{prettyDate(order.date)}</Detail>
                              <Detail label="Slot">{order.time}</Detail>
                              {order.zone && <Detail label="Zone">{order.zone}</Detail>}
                              {order.address && <Detail label="Address">{order.address}</Detail>}
                              {order.occasion && <Detail label="Occasion">{order.occasion}</Detail>}
                              {order.email && <Detail label="Email">{order.email}</Detail>}
                              <Detail label="WhatsApp">
                                {order.whatsappUpdates === false ? (
                                  <span className="text-cocoa/55">
                                    Opted out — do not send updates
                                  </span>
                                ) : (
                                  'Gets updates automatically'
                                )}
                              </Detail>
                              <Detail label="Subtotal">{money(order.subtotal)}</Detail>
                              <Detail label="Delivery">
                                {order.deliveryFee ? money(order.deliveryFee) : 'Free'}
                              </Detail>
                              <Detail label="Total">
                                <strong className="text-espresso">{money(order.total)}</strong>
                              </Detail>
                              {order.depositDue > 0 && (
                                <Detail label="Deposit">{money(order.depositDue)}</Detail>
                              )}
                            </dl>

                            <div className="mt-5 flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                href={`tel:${order.phone.replace(/\s/g, '')}`}
                              >
                                <Phone size={13} strokeWidth={2} /> Call
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                href={`https://wa.me/${order.phone.replace(/[^\d]/g, '').replace(/^0/, '250')}?text=${encodeURIComponent(
                                  `Hello ${order.name}, this is Dussa BakeLab about order ${order.code}.`,
                                )}`}
                              >
                                WhatsApp
                              </Button>
                            </div>

                            <PaymentBlock
                              order={order}
                              adminKey={adminKey}
                              busy={busyCode === order.code}
                              onChangePayment={onChangePayment}
                            />

                            <h3 className="eyebrow mt-7 text-cocoa/50">Move to</h3>
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {ORDER_STATUSES.map((s) => (
                                <button
                                  key={s.id}
                                  type="button"
                                  disabled={s.id === order.status || busyCode === order.code}
                                  onClick={() => changeStatus(order.code, s.id)}
                                  className={classNames(
                                    'rounded-full border px-3 py-1.5 text-[0.75rem] font-medium transition-all disabled:opacity-40',
                                    s.id === order.status
                                      ? 'border-espresso bg-espresso text-cream'
                                      : 'border-caramel/30 bg-porcelain text-cocoa hover:border-caramel',
                                  )}
                                >
                                  {s.label}
                                </button>
                              ))}
                            </div>

                            {order.offline && (
                              <Pill tone="gold" className="mt-5">
                                Saved on this device only
                              </Pill>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              )
            })}
          </ul>
        )}
    </div>
  )
}

function FilterChip({ active, children, ...props }) {
  return (
    <button
      type="button"
      className={classNames(
        'rounded-full border px-3.5 py-2 text-[0.78rem] font-medium transition-all',
        active
          ? 'border-espresso bg-espresso text-cream'
          : 'border-caramel/28 bg-porcelain text-cocoa/75 hover:border-caramel',
      )}
      {...props}
    >
      {children}
    </button>
  )
}

/**
 * Money on one order.
 *
 * A customer saying "PAID" on WhatsApp lands here as a claim, with their
 * screenshot if they sent one. Nothing moves until someone here has checked
 * the Mobile Money statement and pressed the button.
 */
function PaymentBlock({ order, adminKey, busy, onChangePayment }) {
  const payment = order.payment || { status: 'unpaid' }
  const proof = payment.proofImageId
    ? `/api/images/${payment.proofImageId}?key=${encodeURIComponent(adminKey || '')}`
    : null

  return (
    <>
      <h3 className="eyebrow mt-7 text-cocoa/50">Payment</h3>
      <div
        className={classNames(
          'mt-3 rounded-2xl border p-4',
          payment.status === 'verified'
            ? 'border-emerald-200 bg-emerald-50/60'
            : payment.status === 'claimed'
              ? 'border-amber-200 bg-amber-50/70'
              : 'border-caramel/20 bg-cream/50',
        )}
      >
        <p className="text-[0.875rem] font-medium text-espresso">
          {payment.status === 'verified'
            ? `Verified${payment.verifiedAt ? ` on ${prettyDateTime(payment.verifiedAt)}` : ''}`
            : payment.status === 'claimed'
              ? `${order.name} says they paid${payment.claimedAt ? ` — ${prettyDateTime(payment.claimedAt)}` : ''}`
              : 'Nothing received yet'}
        </p>

        {payment.status === 'claimed' && (
          <p className="mt-1 text-[0.8rem] leading-relaxed text-cocoa/65">
            Check {money(order.total)} against your Mobile Money statement before you verify. This
            is only what the customer told us.
          </p>
        )}

        {payment.reference && (
          <p className="mt-3 rounded-xl border border-caramel/18 bg-porcelain p-3 text-[0.8rem] italic leading-relaxed text-cocoa/75">
            “{payment.reference}”
          </p>
        )}

        {proof ? (
          <a
            href={proof}
            target="_blank"
            rel="noreferrer"
            className="mt-3 block overflow-hidden rounded-xl border border-caramel/25 bg-porcelain"
          >
            <img
              src={proof}
              alt={`Payment screenshot for ${order.code}`}
              className="max-h-72 w-full object-contain"
            />
            <span className="block px-3 py-2 text-[0.72rem] text-cocoa/55">
              Screenshot from the customer — tap to open full size
            </span>
          </a>
        ) : (
          payment.status === 'claimed' && (
            <p className="mt-3 text-[0.78rem] text-cocoa/55">No screenshot was attached.</p>
          )
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {payment.status !== 'verified' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onChangePayment?.(order.code, 'verified')}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-[0.8rem] font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              Money received — verify
            </button>
          )}
          {payment.status === 'claimed' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onChangePayment?.(order.code, 'unpaid')}
              className="rounded-xl border border-caramel/35 px-4 py-2 text-[0.8rem] text-cocoa/70 transition-colors hover:border-espresso hover:text-espresso disabled:opacity-50"
            >
              Not there — reset
            </button>
          )}
          {payment.status === 'verified' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onChangePayment?.(order.code, 'unpaid')}
              className="rounded-xl border border-caramel/35 px-4 py-2 text-[0.8rem] text-cocoa/70 transition-colors hover:border-espresso hover:text-espresso disabled:opacity-50"
            >
              Undo
            </button>
          )}
        </div>
      </div>
    </>
  )
}

function Detail({ label, children }) {
  return (
    <div className="flex gap-3">
      <dt className="w-20 shrink-0 text-cocoa/45">{label}</dt>
      <dd className="flex-1 text-cocoa/80">{children}</dd>
    </div>
  )
}

