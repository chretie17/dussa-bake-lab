import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Download, KeyRound, Loader2, LogOut, RefreshCw } from 'lucide-react'
import { LogoMark } from '../art/Logo'
import { Button } from '../components/ui'
import { TextInput } from '../components/Field'
import OverviewPanel from '../components/admin/OverviewPanel'
import OrdersPanel from '../components/admin/OrdersPanel'
import MediaPanel from '../components/admin/MediaPanel'
import ProductsPanel from '../components/admin/ProductsPanel'
import SettingsPanel from '../components/admin/SettingsPanel'
import { useCatalog } from '../context/CatalogContext'
import {
  clearAdminKey,
  createProduct,
  fetchAdminCatalog,
  fetchHealth,
  fetchOrders,
  loadAdminKey,
  localOrders,
  ordersToCsv,
  patchOrder,
  removeProduct,
  reorderProducts,
  saveAdminKey,
  updateProduct,
  updateSettings,
} from '../lib/orders'
import { classNames, prettyDateTime } from '../lib/format'
import usePageMeta from '../lib/usePageMeta'

const POLL_MS = 20000

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'orders', label: 'Orders' },
  { id: 'products', label: 'Products' },
  { id: 'photos', label: 'Photos' },
  { id: 'settings', label: 'Settings' },
  { id: 'setup', label: 'Setup' },
]

const TITLES = {
  overview: 'Today at a glance',
  orders: 'Incoming orders',
  products: 'Your menu',
  photos: 'Your photos',
  settings: 'Business settings',
  setup: 'Setup',
}

export default function Admin() {
  const { refresh: refreshStorefront } = useCatalog()

  const [adminKey, setAdminKey] = useState(loadAdminKey)
  const [authed, setAuthed] = useState(false)
  const [keyInput, setKeyInput] = useState('')
  const [tab, setTab] = useState('overview')

  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [settings, setSettings] = useState(null)
  const [health, setHealth] = useState(null)

  const [storage, setStorage] = useState('')
  const [secured, setSecured] = useState(true)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [signInError, setSignInError] = useState('')
  const [lastSync, setLastSync] = useState(null)
  const [busyCode, setBusyCode] = useState('')

  usePageMeta({
    title: 'Kitchen dashboard — Dussa BakeLab',
    description: 'Internal dashboard for Dussa BakeLab orders, products and settings.',
  })

  const load = useCallback(async (key, { silent = false } = {}) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      const orderData = await fetchOrders(key)
      setOrders(Array.isArray(orderData) ? orderData : orderData.orders || [])
      setAuthed(true)
      setLastSync(new Date())

      // The catalogue and health checks are secondary; a failure there must not
      // knock the operator out of the orders view.
      try {
        const catalog = await fetchAdminCatalog(key)
        setProducts(catalog.products || [])
        setSettings(catalog.settings || null)
        setStorage(catalog.storage || '')
        setSecured(catalog.secured !== false)
      } catch {
        /* keep whatever is already loaded */
      }
      try {
        setHealth(await fetchHealth())
      } catch {
        setHealth(null)
      }
    } catch (err) {
      if (/401|admin key/i.test(err.message)) {
        setAuthed(false)
        setSignInError('That key was not accepted.')
      } else {
        // Offline: show what this browser saved so the kitchen is not blind.
        setAuthed(true)
        setStorage('offline')
        setOrders(localOrders())
        setLastSync(new Date())
      }
    } finally {
      setLoading(false)
    }
  }, [])

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
    setSignInError('')
    load(key)
  }

  const signOut = () => {
    clearAdminKey()
    setAdminKey('')
    setAuthed(false)
    setOrders([])
    setProducts([])
    setKeyInput('')
  }

  /* ---------------------------------------------------------- orders */

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
    const blob = new Blob([ordersToCsv(orders)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `dussa-orders-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  /* -------------------------------------------------------- products */

  /** Every catalogue write refreshes the storefront so edits show immediately. */
  const afterCatalogChange = async () => {
    const catalog = await fetchAdminCatalog(adminKey)
    setProducts(catalog.products || [])
    refreshStorefront()
  }

  const handleCreate = async (product) => {
    setBusy(true)
    try {
      await createProduct(product, adminKey)
      await afterCatalogChange()
    } finally {
      setBusy(false)
    }
  }

  const handleUpdate = async (slug, product) => {
    setBusy(true)
    try {
      await updateProduct(slug, product, adminKey)
      await afterCatalogChange()
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (slug) => {
    setBusy(true)
    setError('')
    try {
      await removeProduct(slug, adminKey)
      await afterCatalogChange()
    } catch (err) {
      setError(err.message || 'Could not delete that product.')
    } finally {
      setBusy(false)
    }
  }

  const handleReorder = async (order) => {
    setBusy(true)
    try {
      const next = await reorderProducts(order, adminKey)
      setProducts(next)
      refreshStorefront()
    } catch (err) {
      setError(err.message || 'Could not reorder the menu.')
    } finally {
      setBusy(false)
    }
  }

  /* -------------------------------------------------------- settings */

  const handleSaveSettings = async (next) => {
    setBusy(true)
    setError('')
    try {
      const saved = await updateSettings(next, adminKey)
      setSettings(saved)
      refreshStorefront()
    } catch (err) {
      setError(err.message || 'Could not save those settings.')
    } finally {
      setBusy(false)
    }
  }

  const handleResetSettings = async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'DELETE',
        headers: { 'x-admin-key': adminKey || '' },
      })
      const data = await res.json()
      if (data.settings) setSettings(data.settings)
      refreshStorefront()
    } catch (err) {
      setError(err.message || 'Could not restore the defaults.')
    } finally {
      setBusy(false)
    }
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
              Sign in to manage orders, products and settings.
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

          {signInError && (
            <p className="mt-4 rounded-xl bg-red-500/12 px-4 py-3 text-center text-[0.82rem] text-red-200">
              {signInError}
            </p>
          )}

          <p className="mt-6 text-center text-[0.75rem] leading-relaxed text-cream/35">
            This is the ADMIN_KEY you set on your deployment. If you have not set one yet, any
            word will get you in.
          </p>
        </div>
      </section>
    )
  }

  /* ------------------------------------------------------- dashboard */

  const showSetupWarning = storage === 'memory' || storage === 'offline' || !secured

  return (
    <section className="min-h-[100svh] bg-cream pb-20 pt-28 md:pt-32">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow text-caramel">Kitchen dashboard</p>
            <h1 className="mt-3 text-[clamp(1.8rem,4vw,2.6rem)] text-espresso">
              {TITLES[tab] || 'Dashboard'}
            </h1>
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
            {tab === 'orders' && (
              <Button size="sm" variant="outline" onClick={exportCsv} disabled={orders.length === 0}>
                <Download size={14} strokeWidth={2} /> Export CSV
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={signOut}>
              <LogOut size={14} strokeWidth={2} /> Sign out
            </Button>
          </div>
        </div>

        {/* ---------------------------------------------------- tabs */}
        <div className="mt-7 flex flex-wrap gap-1 border-b border-caramel/22">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={classNames(
                '-mb-px flex items-center gap-2 border-b-2 px-4 pb-3 text-[0.9rem] font-medium transition-colors',
                tab === t.id
                  ? 'border-caramel text-espresso'
                  : 'border-transparent text-cocoa/50 hover:text-espresso',
              )}
            >
              {t.label}
              {t.id === 'setup' && showSetupWarning && (
                <span className="flex h-2 w-2 rounded-full bg-red-500" aria-label="needs attention" />
              )}
            </button>
          ))}
        </div>

        {showSetupWarning && tab !== 'setup' && (
          <button
            type="button"
            onClick={() => setTab('setup')}
            className="mt-6 flex w-full items-start gap-3 rounded-2xl border border-gold/45 bg-gold/12 p-4 text-left transition-colors hover:bg-gold/18"
          >
            <AlertTriangle size={17} strokeWidth={1.8} className="mt-0.5 shrink-0 text-caramel" />
            <span className="text-[0.85rem] leading-relaxed text-cocoa/80">
              {storage === 'memory'
                ? 'No database is connected, so orders are not being saved. Open Setup to fix this.'
                : storage === 'offline'
                  ? 'Cannot reach the order service. Showing what this browser has saved.'
                  : 'This dashboard has no password set. Open Setup to see how to lock it.'}
            </span>
          </button>
        )}

        {error && (
          <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-[0.85rem] text-red-700">{error}</p>
        )}

        {/* ---------------------------------------------------- body */}
        <div className="mt-2">
          {tab === 'overview' && (
            <OverviewPanel
              orders={orders}
              products={products}
              onGoToOrders={() => setTab('orders')}
              onGoToProducts={() => setTab('products')}
            />
          )}

          {tab === 'orders' && (
            <OrdersPanel orders={orders} onChangeStatus={changeStatus} busyCode={busyCode} />
          )}

          {tab === 'products' && (
            <div className="mt-8">
              <ProductsPanel
                adminKey={adminKey}
                products={products}
                loading={loading}
                error={error}
                busy={busy}
                onCreate={handleCreate}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onReorder={handleReorder}
              />
            </div>
          )}

          {tab === 'photos' && (
            <MediaPanel
              adminKey={adminKey}
              usedUrls={products.map((p) => p.photo).filter(Boolean)}
            />
          )}

          {tab === 'settings' && (
            <div className="mt-8">
              {settings ? (
                <SettingsPanel
                  adminKey={adminKey}
                  settings={settings}
                  onSave={handleSaveSettings}
                  onReset={handleResetSettings}
                  saving={busy}
                  error={error}
                />
              ) : (
                <p className="text-cocoa/55">Loading settings…</p>
              )}
            </div>
          )}

          {tab === 'setup' && <SetupPanel health={health} storage={storage} secured={secured} />}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Setup                                                                */
/* ------------------------------------------------------------------ */

function SetupPanel({ health, storage, secured }) {
  const checks = health?.checks || [
    {
      id: 'database',
      label: 'Database',
      ok: storage === 'postgres',
      detail:
        storage === 'postgres'
          ? 'Connected.'
          : 'No database is connected, so orders are held in memory and disappear when the server sleeps.',
    },
    {
      id: 'admin',
      label: 'Dashboard key',
      ok: secured,
      detail: secured ? 'ADMIN_KEY is set.' : 'ADMIN_KEY is not set.',
    },
  ]

  return (
    <div className="mt-8 space-y-6">
      <div className="space-y-3">
        {checks.map((check) => (
          <div
            key={check.id}
            className={classNames(
              'flex items-start gap-3 rounded-2xl border p-5',
              check.ok ? 'border-emerald-200 bg-emerald-50/60' : 'border-gold/45 bg-gold/12',
            )}
          >
            {check.ok ? (
              <CheckCircle2 size={19} strokeWidth={1.8} className="mt-0.5 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle size={19} strokeWidth={1.8} className="mt-0.5 shrink-0 text-caramel" />
            )}
            <div>
              <p className="font-medium text-espresso">{check.label}</p>
              <p className="mt-1 text-[0.875rem] leading-relaxed text-cocoa/70">{check.detail}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-[1.5rem] border border-caramel/22 bg-porcelain p-6">
        <h3 className="font-display text-[1.2rem] text-espresso">Connecting a database</h3>
        <p className="mt-2 text-[0.9rem] leading-relaxed text-cocoa/65">
          Orders, products, photos and settings all live in one Postgres database. Any provider
          works. Neon has a free plan that is plenty for a bakery this size.
        </p>
        <ol className="mt-5 space-y-3 text-[0.9rem] leading-relaxed text-cocoa/75">
          <Step n="1">
            Make a free account at <Code>neon.com</Code> and create a project. Copy the connection
            string it gives you. It starts with <Code>postgresql://</Code>.
          </Step>
          <Step n="2">
            In your Vercel project, open <Code>Settings → Environment Variables</Code> and add{' '}
            <Code>DATABASE_URL</Code> with that connection string.
          </Step>
          <Step n="3">
            Add <Code>ADMIN_KEY</Code> too. Any long phrase you will remember. That becomes the
            password for this dashboard.
          </Step>
          <Step n="4">
            Redeploy. The tables get created for you and your current menu is copied in, ready to
            edit here.
          </Step>
        </ol>
      </div>

      <div className="rounded-[1.5rem] border border-caramel/22 bg-porcelain p-6">
        <h3 className="font-display text-[1.2rem] text-espresso">Email notifications</h3>
        <p className="mt-2 text-[0.9rem] leading-relaxed text-cocoa/65">
          To get an email the moment an order arrives, and to send customers a confirmation and
          updates as you move their order along, make a free account at <Code>resend.com</Code> and
          add two more variables:
        </p>
        <ul className="mt-4 space-y-2 text-[0.9rem] text-cocoa/75">
          <li>
            <Code>RESEND_API_KEY</Code> — the key from your Resend dashboard
          </li>
          <li>
            <Code>ORDER_NOTIFY_EMAIL</Code> — the address that should receive new orders
          </li>
        </ul>
        <p className="mt-4 text-[0.82rem] text-cocoa/55">
          Once a domain is verified in Resend, also set <Code>ORDER_NOTIFY_FROM</Code> to send from
          your own address instead of the shared test one.
        </p>
      </div>
    </div>
  )
}

function Step({ n, children }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-espresso text-[0.7rem] font-semibold text-cream">
        {n}
      </span>
      <span>{children}</span>
    </li>
  )
}

function Code({ children }) {
  return (
    <code className="rounded bg-espresso/8 px-1.5 py-0.5 font-mono text-[0.85em] text-espresso">
      {children}
    </code>
  )
}
