import { useMemo } from 'react'
import { ArrowRight, CalendarDays, Package, Phone, Truck, Store } from 'lucide-react'
import { Button, Pill } from '../ui'
import { statusMeta } from '../../lib/orders'
import { classNames, money, prettyDate, relativeDay } from '../../lib/format'

const DAY = 86400000
const iso = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10)

/**
 * The first screen of the morning: what has to leave the kitchen today and
 * tomorrow, what still needs a reply, and how the week is going.
 */
export default function OverviewPanel({ orders, products, onGoToOrders, onGoToProducts }) {
  const view = useMemo(() => {
    const now = new Date()
    const today = iso(now)
    const tomorrow = iso(new Date(now.getTime() + DAY))

    const live = orders.filter((o) => !['cancelled'].includes(o.status))
    const open = live.filter((o) => o.status !== 'completed')

    const dueToday = open.filter((o) => o.date === today)
    const dueTomorrow = open.filter((o) => o.date === tomorrow)
    const awaiting = orders.filter((o) => o.status === 'new')
    const overdue = open.filter((o) => o.date && o.date < today)

    const weekAgo = new Date(now.getTime() - 7 * DAY).toISOString()
    const monthAgo = new Date(now.getTime() - 30 * DAY).toISOString()
    const inWeek = live.filter((o) => (o.createdAt || '') >= weekAgo)
    const inMonth = live.filter((o) => (o.createdAt || '') >= monthAgo)

    // Count how often each product has been ordered in the last month.
    const tally = new Map()
    for (const order of inMonth) {
      for (const item of order.items || []) {
        const current = tally.get(item.name) || { name: item.name, count: 0, value: 0 }
        current.count += item.quantity || 1
        current.value += item.linePrice || 0
        tally.set(item.name, current)
      }
    }
    const top = [...tally.values()].sort((a, b) => b.count - a.count).slice(0, 5)

    return {
      dueToday,
      dueTomorrow,
      awaiting,
      overdue,
      weekValue: inWeek.reduce((sum, o) => sum + (o.total || 0), 0),
      weekCount: inWeek.length,
      monthValue: inMonth.reduce((sum, o) => sum + (o.total || 0), 0),
      monthCount: inMonth.length,
      top,
    }
  }, [orders])

  const hidden = products.filter((p) => p.active === false).length
  const noPhoto = products.filter((p) => p.active !== false && !p.photo).length

  return (
    <div className="mt-8 space-y-6">
      {/* ------------------------------------------------- headline */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Due today"
          value={view.dueToday.length}
          tone={view.dueToday.length > 0 ? 'gold' : 'plain'}
        />
        <Stat label="Due tomorrow" value={view.dueTomorrow.length} />
        <Stat
          label="Waiting on you"
          value={view.awaiting.length}
          tone={view.awaiting.length > 0 ? 'alert' : 'plain'}
          hint={view.awaiting.length > 0 ? 'new orders to confirm' : 'all confirmed'}
        />
        <Stat label="Last 7 days" value={money(view.weekValue)} hint={`${view.weekCount} orders`} />
      </div>

      {view.overdue.length > 0 && (
        <button
          type="button"
          onClick={onGoToOrders}
          className="flex w-full items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-left transition-colors hover:bg-red-100/70"
        >
          <CalendarDays size={17} strokeWidth={1.8} className="mt-0.5 shrink-0 text-red-600" />
          <span className="text-[0.875rem] leading-relaxed text-red-800">
            {view.overdue.length} order{view.overdue.length === 1 ? '' : 's'} passed their date
            without being marked completed. Worth a look.
          </span>
        </button>
      )}

      {/* --------------------------------------------------- lists */}
      <div className="grid gap-5 lg:grid-cols-2">
        <DayList
          title="Today"
          subtitle={prettyDate(new Date())}
          orders={view.dueToday}
          empty="Nothing due today. A quiet one."
          onOpen={onGoToOrders}
        />
        <DayList
          title="Tomorrow"
          subtitle={prettyDate(new Date(Date.now() + DAY))}
          orders={view.dueTomorrow}
          empty="Nothing booked for tomorrow yet."
          onOpen={onGoToOrders}
        />
      </div>

      {/* ------------------------------------------------ new orders */}
      {view.awaiting.length > 0 && (
        <section className="rounded-[1.5rem] border border-gold/45 bg-gold/10 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-[1.2rem] text-espresso">Needs your reply</h3>
              <p className="mt-1 text-[0.85rem] text-cocoa/65">
                These came in and have not been confirmed yet.
              </p>
            </div>
            <Button size="sm" onClick={onGoToOrders}>
              Open orders <ArrowRight size={14} strokeWidth={2} />
            </Button>
          </div>

          <ul className="mt-4 space-y-2">
            {view.awaiting.slice(0, 5).map((order) => (
              <li
                key={order.code}
                className="flex flex-wrap items-center gap-3 rounded-xl bg-porcelain px-4 py-3"
              >
                <span className="font-display text-[0.95rem] text-espresso">{order.code}</span>
                <span className="flex-1 text-[0.85rem] text-cocoa/70">{order.name}</span>
                <a
                  href={`tel:${String(order.phone || '').replace(/\s/g, '')}`}
                  className="inline-flex items-center gap-1.5 text-[0.78rem] text-caramel hover:underline"
                >
                  <Phone size={12} /> {order.phone}
                </a>
                <span className="text-[0.8rem] text-cocoa/55">
                  {prettyDate(order.date)} ({relativeDay(order.date)})
                </span>
                <span className="font-display text-[0.95rem] tabular-nums text-espresso">
                  {money(order.total)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ------------------------------------------- money & menu */}
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-[1.5rem] border border-caramel/22 bg-porcelain p-6">
          <h3 className="font-display text-[1.2rem] text-espresso">How it is going</h3>
          <dl className="mt-4 space-y-3 text-[0.9rem]">
            <Row label="Last 7 days">
              {money(view.weekValue)}{' '}
              <span className="text-cocoa/50">({view.weekCount} orders)</span>
            </Row>
            <Row label="Last 30 days">
              {money(view.monthValue)}{' '}
              <span className="text-cocoa/50">({view.monthCount} orders)</span>
            </Row>
            <Row label="Average order">
              {view.monthCount > 0 ? money(view.monthValue / view.monthCount) : '—'}
            </Row>
          </dl>
          <p className="mt-4 text-[0.75rem] leading-relaxed text-cocoa/50">
            Counts every order except cancelled ones, based on when it was placed.
          </p>
        </section>

        <section className="rounded-[1.5rem] border border-caramel/22 bg-porcelain p-6">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-[1.2rem] text-espresso">Most ordered this month</h3>
            <Package size={18} strokeWidth={1.7} className="mt-1 shrink-0 text-caramel" />
          </div>

          {view.top.length === 0 ? (
            <p className="mt-4 text-[0.875rem] text-cocoa/55">
              Nothing ordered in the last month yet.
            </p>
          ) : (
            <ol className="mt-4 space-y-2.5">
              {view.top.map((item, i) => (
                <li key={item.name} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blush text-[0.7rem] font-semibold text-choco">
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate text-[0.875rem] text-espresso">{item.name}</span>
                  <span className="text-[0.8rem] text-cocoa/55">×{item.count}</span>
                  <span className="text-[0.85rem] tabular-nums text-cocoa/70">
                    {money(item.value)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {/* ------------------------------------------------ menu nudges */}
      {(hidden > 0 || noPhoto > 0) && (
        <section className="rounded-[1.5rem] border border-caramel/22 bg-porcelain p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-[1.2rem] text-espresso">Your menu</h3>
              <p className="mt-1 text-[0.85rem] text-cocoa/65">
                {products.filter((p) => p.active !== false).length} showing on the site
                {hidden > 0 && `, ${hidden} hidden`}
                {noPhoto > 0 && `. ${noPhoto} still using the drawing instead of a photo.`}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={onGoToProducts}>
              Manage products <ArrowRight size={14} strokeWidth={2} />
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}

function Stat({ label, value, hint, tone = 'plain' }) {
  const tones = {
    plain: 'border-caramel/22 bg-porcelain',
    gold: 'border-gold/45 bg-gold/12',
    alert: 'border-red-200 bg-red-50',
  }
  return (
    <div className={classNames('rounded-2xl border p-5', tones[tone])}>
      <p className="text-[0.72rem] uppercase tracking-[0.14em] text-cocoa/45">{label}</p>
      <p className="mt-2 font-display text-[1.7rem] leading-none text-espresso">{value}</p>
      {hint && <p className="mt-1.5 text-[0.75rem] text-cocoa/50">{hint}</p>}
    </div>
  )
}

function Row({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-caramel/15 pb-3 last:border-0 last:pb-0">
      <dt className="text-cocoa/60">{label}</dt>
      <dd className="text-right font-medium text-espresso">{children}</dd>
    </div>
  )
}

function DayList({ title, subtitle, orders, empty, onOpen }) {
  return (
    <section className="rounded-[1.5rem] border border-caramel/22 bg-porcelain p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-[1.2rem] text-espresso">{title}</h3>
        <span className="text-[0.78rem] text-cocoa/50">{subtitle}</span>
      </div>

      {orders.length === 0 ? (
        <p className="mt-4 text-[0.875rem] text-cocoa/55">{empty}</p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {orders.map((order) => (
            <li key={order.code}>
              <button
                type="button"
                onClick={onOpen}
                className="flex w-full flex-wrap items-center gap-3 rounded-xl border border-caramel/18 bg-cream/60 px-4 py-3 text-left transition-colors hover:border-caramel/45 hover:bg-cream"
              >
                <span className="shrink-0 text-caramel">
                  {order.fulfilment === 'delivery' ? (
                    <Truck size={15} strokeWidth={1.8} />
                  ) : (
                    <Store size={15} strokeWidth={1.8} />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.875rem] font-medium text-espresso">
                    {order.name}
                  </span>
                  <span className="block truncate text-[0.75rem] text-cocoa/55">
                    {order.time} ·{' '}
                    {(order.items || [])
                      .map((i) => `${i.quantity}× ${i.name}`)
                      .join(', ')}
                  </span>
                </span>
                <Pill tone={order.status === 'ready' ? 'gold' : 'outline'}>
                  {statusMeta(order.status).label}
                </Pill>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
