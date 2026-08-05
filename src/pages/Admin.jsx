import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  ChevronDown,
  Download,
  KeyRound,
  Loader2,
  LogOut,
  Phone,
  RefreshCw,
  Search,
} from 'lucide-react'
import { LogoMark } from '../art/Logo'
import { Button, Pill } from '../components/ui'
import { TextInput } from '../components/Field'
import {
  ORDER_STATUSES,
  clearAdminKey,
  fetchOrders,
  loadAdminKey,
  localOrders,
  ordersToCsv,
  patchOrder,
  saveAdminKey,
  statusMeta,
} from '../lib/orders'
import { classNames, money, prettyDate, prettyDateTime, relativeDay } from '../lib/format'
import usePageMeta from '../lib/usePageMeta'

const POLL_MS = 20000

const TONE_CLASSES = {
  gold: 'bg-gold/25 text-cocoa border-gold/45',
  blue: 'bg-sky-100 text-sky-800 border-sky-200',
  amber: 'bg-amber-100 text-amber-800 border-amber-200',
  green: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  slate: 'bg-stone-100 text-stone-700 border-stone-200',
  red: 'bg-red-100 text-red-800 border-red-200',
}

export default function Admin() {
  const [adminKey, setAdminKey] = useState(loadAdminKey)
  const [authed, setAuthed] = useState(false)
  const [keyInput, setKeyInput] = useState('')
  const [orders, setOrders] = useState([])
  const [storage, setStorage] = useState('')
  const [secured, setSecured] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastSync, setLastSync] = useState(null)
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(null)
  const [busyCode, setBusyCode] = useState('')

  usePageMeta({
    title: 'Kitchen dashboard — Dussa BakeLab',
    description: 'Internal order dashboard for the Dussa BakeLab kitchen.',
  })

  const load = useCallback(
    async (key, { silent = false } = {}) => {
      if (!silent) setLoading(true)
      setError('')
      try {
        const data = await fetchOrders(key)
        setOrders(data.orders || data)
        setStorage(data.storage || '')
        setSecured(data.secured !== false)
        setAuthed(true)
        setLastSync(new Date())
      } catch (err) {
        // A 401 means the key is wrong; anything else means the API is not
        // reachable, in which case we still show whatever was saved locally.
        if (/401|admin key/i.test(err.message)) {
          setAuthed(false)
          setError('That key was not accepted.')
        } else {
          // The banner below already explains the offline state, so no
          // second error line — just fall back to what this device knows.
          setAuthed(true)
          setStorage('offline')
          setOrders(localOrders())
          setLastSync(new Date())
        }
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  // Only auto-open when a key is already held for this session; a first visit
  // should always meet the sign-in gate.
  useEffect(() => {
    if (adminKey) load(adminKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** New orders should appear without anyone pressing refresh. */
  useEffect(() => {
    if (!authed) return undefined
    const timer = setInterval(() => load(adminKey, { silent: true }), POLL_MS)
    return () => clearInterval(timer)
  }, [authed, adminKey, load])

  const signIn = (e) => {
    e.preventDefault()
    const key = keyInput.trim()
    setAdminKey(key)
    saveAdminKey(key)
    load(key)
  }

  const signOut = () => {
    clearAdminKey()
    setAdminKey('')
    setAuthed(false)
    setOrders([])
    setKeyInput('')
  }

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const active = orders.filter((o) => !['completed', 'cancelled'].includes(o.status))
    return [
      { label: 'Open orders', value: active.length },
      { label: 'New today', value: orders.filter((o) => (o.createdAt || '').startsWith(today)).length },
      { label: 'In the kitchen', value: orders.filter((o) => o.status === 'baking').length },
      {
        label: 'Open value',
        value: money(active.reduce((sum, o) => sum + (o.total || 0), 0)),
      },
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

  const changeStatus = async (code, status) => {
    setBusyCode(code)
    setOrders((current) => current.map((o) => (o.code === code ? { ...o, status } : o)))
    try {
      await patchOrder(code, { status }, adminKey)
    } catch (err) {
      setError(err.message || 'Could not update that order.')
      load(adminKey, { silent: true })
    } finally {
      setBusyCode('')
    }
  }

  const exportCsv = () => {
    const blob = new Blob([ordersToCsv(visible)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `dussa-orders-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  /* ------------------------------------------------------------ auth */
  if (!authed) {
    return (
      <section className="grain flex min-h-[100svh] items-center justify-center bg-espresso px-5 py-32 text-cream">
        <div className="w-full max-w-sm">
          <div className="text-center">
            <LogoMark className="mx-auto h-14 w-14" tone="#FAF3EA" accent="#D4A574" />
            <h1 className="mt-6 text-[1.9rem]">Kitchen dashboard</h1>
            <p className="mt-2 text-[0.9rem] text-cream/55">
              Enter the bakery key to see incoming orders.
            </p>
          </div>

          <form onSubmit={signIn} className="mt-9 space-y-3">
            <div className="relative">
              <KeyRound
                size={16}
                strokeWidth={1.8}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cocoa/40"
                aria-hidden="true"
              />
              <TextInput
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="Admin key"
                className="pl-11"
                autoComplete="current-password"
                aria-label="Admin key"
              />
            </div>
            <Button type="submit" className="w-full" variant="gold" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Open dashboard'}
            </Button>
          </form>

          {error && (
            <p className="mt-4 rounded-xl bg-red-500/12 px-4 py-3 text-center text-[0.82rem] text-red-200">
              {error}
            </p>
          )}

          <p className="mt-6 text-center text-[0.75rem] leading-relaxed text-cream/35">
            The key is the ADMIN_KEY environment variable on your deployment. If it is not set, any
            value will open the dashboard.
          </p>
        </div>
      </section>
    )
  }

  /* ------------------------------------------------------- dashboard */
  return (
    <section className="min-h-[100svh] bg-cream pb-20 pt-28 md:pt-32">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow text-caramel">Kitchen dashboard</p>
            <h1 className="mt-3 text-[clamp(1.8rem,4vw,2.6rem)] text-espresso">Incoming orders</h1>
            <p className="mt-2 text-[0.85rem] text-cocoa/55">
              {lastSync ? `Synced ${prettyDateTime(lastSync)}` : 'Loading…'} · refreshes
              automatically every {POLL_MS / 1000}s
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => load(adminKey)} disabled={loading}>
              <RefreshCw size={14} strokeWidth={2} className={loading ? 'animate-spin' : ''} />
              Refresh
            </Button>
            <Button size="sm" variant="outline" onClick={exportCsv} disabled={visible.length === 0}>
              <Download size={14} strokeWidth={2} /> Export CSV
            </Button>
            <Button size="sm" variant="ghost" onClick={signOut}>
              <LogOut size={14} strokeWidth={2} /> Sign out
            </Button>
          </div>
        </div>

        {(storage === 'memory' || storage === 'offline' || !secured) && (
          <div className="mt-7 space-y-2">
            {storage === 'memory' && (
              <Notice>
                No database is connected, so orders are held in memory and will disappear when the
                serverless function goes cold. Add <Code>KV_REST_API_URL</Code> and{' '}
                <Code>KV_REST_API_TOKEN</Code> in your Vercel project to store them permanently.
              </Notice>
            )}
            {storage === 'offline' && (
              <Notice>
                The order service is unreachable. These are orders saved in this browser only.
              </Notice>
            )}
            {!secured && (
              <Notice>
                <Code>ADMIN_KEY</Code> is not set, so this dashboard is open to anyone with the link.
                Set it in your deployment before going live.
              </Notice>
            )}
          </div>
        )}

        {error && (
          <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-[0.85rem] text-red-700">{error}</p>
        )}

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
    </section>
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

function Detail({ label, children }) {
  return (
    <div className="flex gap-3">
      <dt className="w-20 shrink-0 text-cocoa/45">{label}</dt>
      <dd className="flex-1 text-cocoa/80">{children}</dd>
    </div>
  )
}

function Notice({ children }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-gold/40 bg-gold/12 p-4">
      <AlertTriangle size={17} strokeWidth={1.8} className="mt-0.5 shrink-0 text-caramel" />
      <p className="text-[0.85rem] leading-relaxed text-cocoa/80">{children}</p>
    </div>
  )
}

function Code({ children }) {
  return (
    <code className="rounded bg-espresso/8 px-1.5 py-0.5 font-mono text-[0.8em] text-espresso">
      {children}
    </code>
  )
}
