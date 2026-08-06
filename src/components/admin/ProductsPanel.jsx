import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
} from 'lucide-react'
import CreationImage from '../CreationImage'
import { TextInput } from '../Field'
import { Button, Pill } from '../ui'
import { ProductEditorPortal } from './ProductEditor'
import { CATEGORIES } from '../../data/catalog'
import { classNames, money } from '../../lib/format'

function priceLabel(product) {
  const prices = (product.sizes || []).map((s) => Number(s.price) || 0).filter(Boolean)
  if (prices.length === 0) return '—'
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  return min === max ? money(min) : `${money(min)} – ${money(max)}`
}

export default function ProductsPanel({
  products,
  loading,
  error,
  onCreate,
  onUpdate,
  onDelete,
  onReorder,
  busy,
  adminKey,
}) {
  const [editing, setEditing] = useState(null)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [confirmDelete, setConfirmDelete] = useState(null)

  const visible = useMemo(() => {
    let list = [...products].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    if (category !== 'all') list = list.filter((p) => p.category === category)
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter((p) =>
        [p.name, p.slug, p.tagline, ...(p.tags || [])].join(' ').toLowerCase().includes(q),
      )
    }
    return list
  }, [products, category, query])

  const startNew = () => {
    setEditing(null)
    setSaveError('')
    setOpen(true)
  }

  const startEdit = (product) => {
    setEditing(product)
    setSaveError('')
    setOpen(true)
  }

  const duplicate = async (product) => {
    const copy = {
      ...product,
      slug: `${product.slug}-copy`,
      name: `${product.name} (copy)`,
      active: false,
      position: (product.position ?? 0) + 1,
    }
    try {
      await onCreate(copy)
    } catch (err) {
      setSaveError(err.message)
    }
  }

  const save = async (form) => {
    setSaving(true)
    setSaveError('')
    try {
      if (editing) await onUpdate(editing.slug, form)
      else await onCreate(form)
      setOpen(false)
      setEditing(null)
    } catch (err) {
      setSaveError(err.message || 'Could not save that product.')
    } finally {
      setSaving(false)
    }
  }

  /** Reordering swaps positions with the neighbour, then persists the whole list. */
  const move = (product, delta) => {
    const ordered = [...products].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    const index = ordered.findIndex((p) => p.slug === product.slug)
    const target = index + delta
    if (index < 0 || target < 0 || target >= ordered.length) return
    ;[ordered[index], ordered[target]] = [ordered[target], ordered[index]]
    onReorder(ordered.map((p, i) => ({ slug: p.slug, position: i * 10 })))
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
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
            placeholder="Search products…"
            className="pl-11"
            aria-label="Search products"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setCategory('all')}
            className={classNames(
              'rounded-full border px-3.5 py-2 text-[0.78rem] font-medium transition-all',
              category === 'all'
                ? 'border-espresso bg-espresso text-cream'
                : 'border-caramel/28 bg-porcelain text-cocoa/75 hover:border-caramel',
            )}
          >
            All ({products.length})
          </button>
          {CATEGORIES.map((c) => {
            const n = products.filter((p) => p.category === c.id).length
            if (n === 0) return null
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={classNames(
                  'rounded-full border px-3.5 py-2 text-[0.78rem] font-medium transition-all',
                  category === c.id
                    ? 'border-espresso bg-espresso text-cream'
                    : 'border-caramel/28 bg-porcelain text-cocoa/75 hover:border-caramel',
                )}
              >
                {c.name} ({n})
              </button>
            )
          })}
        </div>

        <Button onClick={startNew} size="sm" sheen>
          <Plus size={15} strokeWidth={2.2} /> New product
        </Button>
      </div>

      {error && (
        <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-[0.85rem] text-red-700">{error}</p>
      )}
      {saveError && !open && (
        <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-[0.85rem] text-red-700">{saveError}</p>
      )}

      {loading && products.length === 0 ? (
        <div className="mt-10 flex items-center justify-center gap-3 text-cocoa/55">
          <Loader2 size={18} className="animate-spin" /> Loading the menu…
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-8 rounded-[2rem] border border-dashed border-caramel/35 bg-porcelain/60 p-14 text-center">
          <h3 className="font-display text-xl text-espresso">
            {products.length === 0 ? 'No products yet' : 'Nothing matches that search'}
          </h3>
          <p className="mt-2 text-[0.9rem] text-cocoa/55">
            {products.length === 0
              ? 'Add your first one and it shows up on the site right away.'
              : 'Try a different name or category.'}
          </p>
          {products.length === 0 && (
            <Button onClick={startNew} className="mt-6">
              <Plus size={15} strokeWidth={2.2} /> Add a product
            </Button>
          )}
        </div>
      ) : (
        <ul className="mt-6 space-y-2.5">
          {visible.map((product, index) => (
            <motion.li
              key={product.slug}
              layout
              className={classNames(
                'flex flex-wrap items-center gap-4 rounded-2xl border bg-porcelain p-4 transition-colors',
                product.active === false
                  ? 'border-caramel/20 opacity-65'
                  : 'border-caramel/22 hover:border-caramel/45',
              )}
            >
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-blush/50">
                <CreationImage
                  photo={product.photo}
                  art={product.art}
                  flavorArt={product.flavorArt}
                  alt={product.name}
                  seed={product.slug}
                />
              </div>

              <div className="min-w-[10rem] flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-[1.1rem] text-espresso">{product.name}</h3>
                  {product.bestseller && (
                    <Star size={13} className="text-gold" fill="currentColor" strokeWidth={0} />
                  )}
                  {product.active === false && <Pill tone="outline">Hidden</Pill>}
                </div>
                <p className="mt-0.5 text-[0.78rem] text-cocoa/55">
                  {CATEGORIES.find((c) => c.id === product.category)?.name} ·{' '}
                  {(product.sizes || []).length} size
                  {(product.sizes || []).length === 1 ? '' : 's'} · {product.leadDays}d lead
                </p>
              </div>

              <div className="min-w-[8rem] text-right">
                <p className="font-display text-[1.05rem] tabular-nums text-espresso">
                  {priceLabel(product)}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <IconButton
                  label={`Move ${product.name} up`}
                  onClick={() => move(product, -1)}
                  disabled={index === 0 || busy}
                >
                  <ArrowUp size={15} />
                </IconButton>
                <IconButton
                  label={`Move ${product.name} down`}
                  onClick={() => move(product, 1)}
                  disabled={index === visible.length - 1 || busy}
                >
                  <ArrowDown size={15} />
                </IconButton>
                <IconButton
                  label={product.active === false ? `Show ${product.name}` : `Hide ${product.name}`}
                  onClick={() => onUpdate(product.slug, { ...product, active: product.active === false })}
                  disabled={busy}
                >
                  {product.active === false ? <EyeOff size={15} /> : <Eye size={15} />}
                </IconButton>
                <IconButton
                  label={`Duplicate ${product.name}`}
                  onClick={() => duplicate(product)}
                  disabled={busy}
                >
                  <Copy size={15} />
                </IconButton>
                <IconButton label={`Edit ${product.name}`} onClick={() => startEdit(product)}>
                  <Pencil size={15} />
                </IconButton>
                <IconButton
                  label={`Delete ${product.name}`}
                  onClick={() => setConfirmDelete(product)}
                  danger
                >
                  <Trash2 size={15} />
                </IconButton>
              </div>
            </motion.li>
          ))}
        </ul>
      )}

      <ProductEditorPortal
        open={open}
        adminKey={adminKey}
        product={editing}
        onSave={save}
        onClose={() => {
          setOpen(false)
          setEditing(null)
        }}
        saving={saving}
        error={saveError}
      />

      {confirmDelete && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center p-5">
          <div
            className="absolute inset-0 bg-espresso/60 backdrop-blur-sm"
            onClick={() => setConfirmDelete(null)}
          />
          <div className="relative w-full max-w-sm rounded-[1.5rem] border border-caramel/25 bg-cream p-6 shadow-lift">
            <h3 className="font-display text-[1.3rem] text-espresso">
              Delete “{confirmDelete.name}”?
            </h3>
            <p className="mt-2.5 text-[0.9rem] leading-relaxed text-cocoa/65">
              It comes off the site straight away. Orders already placed keep their own record of
              it. If you just want it off the menu for now, hide it instead.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  onUpdate(confirmDelete.slug, { ...confirmDelete, active: false })
                  setConfirmDelete(null)
                }}
              >
                Hide instead
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  onDelete(confirmDelete.slug)
                  setConfirmDelete(null)
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function IconButton({ label, children, danger, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={classNames(
        'flex h-9 w-9 items-center justify-center rounded-lg text-cocoa/55 transition-colors disabled:opacity-30',
        danger ? 'hover:bg-red-50 hover:text-red-600' : 'hover:bg-blush/70 hover:text-espresso',
      )}
      {...props}
    >
      {children}
    </button>
  )
}
