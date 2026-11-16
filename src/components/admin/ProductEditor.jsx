import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Loader2, Save, X } from 'lucide-react'
import CreationImage from '../CreationImage'
import { Field, Select, TextArea, TextInput } from '../Field'
import { Button, Pill } from '../ui'
import OptionRows, { ListInput, Toggle } from './OptionRows'
import ImagePicker from './ImagePicker'
import { ART_PALETTES, ART_VARIANTS } from '../../data/optionIds'
import { CATEGORIES, OCCASIONS } from '../../data/catalog'
import { classNames, money } from '../../lib/format'

const BLANK = {
  slug: '',
  name: '',
  category: 'cakes',
  tagline: '',
  description: '',
  photo: '',
  art: 'dripCake',
  flavorArt: 'chocolate',
  bestseller: false,
  active: true,
  rating: 5,
  reviews: 0,
  leadDays: 2,
  tags: [],
  occasions: [],
  sizes: [{ label: '', serves: '', price: 0 }],
  flavors: [],
  frostings: [],
  addons: [],
  allowsMessage: false,
  customBrief: false,
}

const SECTIONS = [
  { id: 'basics', label: 'Basics' },
  { id: 'pricing', label: 'Sizes & prices' },
  { id: 'options', label: 'Options' },
  { id: 'display', label: 'Display' },
]

/**
 * Full-screen editor for one product. Everything the storefront renders is
 * editable here, and the artwork preview updates as you change it.
 */
export default function ProductEditor({ product, onSave, onClose, saving, error, adminKey }) {
  const [form, setForm] = useState(() => ({ ...BLANK, ...(product || {}) }))
  const [section, setSection] = useState('basics')
  const [touchedSlug, setTouchedSlug] = useState(Boolean(product?.slug))

  useEffect(() => {
    setForm({ ...BLANK, ...(product || {}) })
    setTouchedSlug(Boolean(product?.slug))
    setSection('basics')
  }, [product])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  /** New products get their web address from the name until it is edited. */
  const setName = (value) => {
    setForm((f) => ({
      ...f,
      name: value,
      slug: touchedSlug
        ? f.slug
        : value
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, ''),
    }))
  }

  const priceRange = useMemo(() => {
    const prices = (form.sizes || []).map((s) => Number(s.price) || 0).filter((p) => p > 0)
    if (prices.length === 0) return null
    return { min: Math.min(...prices), max: Math.max(...prices) }
  }, [form.sizes])

  const toggleOccasion = (id) =>
    set(
      'occasions',
      form.occasions?.includes(id)
        ? form.occasions.filter((o) => o !== id)
        : [...(form.occasions || []), id],
    )

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label={product ? `Edit ${product.name}` : 'New product'}
    >
      <div className="absolute inset-0 bg-espresso/60 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        className="relative ml-auto flex h-full w-[min(56rem,100vw)] flex-col bg-cream shadow-lift"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 280, damping: 34 }}
      >
        {/* ------------------------------------------------ header */}
        <header className="flex items-start justify-between gap-5 border-b border-caramel/22 bg-porcelain px-6 py-5">
          <div className="min-w-0">
            <p className="eyebrow text-caramel">{product ? 'Edit product' : 'New product'}</p>
            <h2 className="mt-1.5 truncate font-display text-[1.5rem] text-espresso">
              {form.name || 'Untitled creation'}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {priceRange && (
                <Pill tone="gold">
                  {priceRange.min === priceRange.max
                    ? money(priceRange.min)
                    : `${money(priceRange.min)} – ${money(priceRange.max)}`}
                </Pill>
              )}
              {!form.active && <Pill tone="outline">Hidden from the site</Pill>}
              {form.bestseller && <Pill tone="dark">Bestseller</Pill>}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-caramel/30 text-espresso transition-colors hover:bg-blush/60"
            aria-label="Close editor"
          >
            <X size={18} strokeWidth={1.8} />
          </button>
        </header>

        <div className="flex gap-1 border-b border-caramel/18 bg-porcelain px-6">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(s.id)}
              className={classNames(
                '-mb-px border-b-2 px-3 pb-3 pt-1 text-[0.85rem] font-medium transition-colors',
                section === s.id
                  ? 'border-caramel text-espresso'
                  : 'border-transparent text-cocoa/50 hover:text-espresso',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* -------------------------------------------------- body */}
        <div className="flex-1 overflow-y-auto px-6 py-7">
          {section === 'basics' && (
            <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
              <div className="space-y-5">
                <Field label="Name" htmlFor="p-name" required>
                  <TextInput
                    id="p-name"
                    value={form.name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Signature Chocolate Drip"
                  />
                </Field>

                <Field
                  label="Web address"
                  htmlFor="p-slug"
                  hint={`yoursite.com/creations/${form.slug || '…'}`}
                >
                  <TextInput
                    id="p-slug"
                    value={form.slug}
                    onChange={(e) => {
                      setTouchedSlug(true)
                      set('slug', e.target.value)
                    }}
                    placeholder="signature-chocolate-drip"
                  />
                </Field>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Category" htmlFor="p-category" required>
                    <Select
                      id="p-category"
                      value={form.category}
                      onChange={(e) => set('category', e.target.value)}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field
                    label="Lead time"
                    htmlFor="p-lead"
                    hint="days of notice needed"
                    required
                  >
                    <TextInput
                      id="p-lead"
                      type="number"
                      min="0"
                      max="60"
                      value={form.leadDays}
                      onChange={(e) => set('leadDays', Number(e.target.value) || 0)}
                    />
                  </Field>
                </div>

                <Field label="Tagline" htmlFor="p-tagline" hint="the short italic line">
                  <TextInput
                    id="p-tagline"
                    value={form.tagline}
                    onChange={(e) => set('tagline', e.target.value)}
                    placeholder="Chocolate sponge with a ganache finish"
                  />
                </Field>

                <Field label="Description" htmlFor="p-desc">
                  <TextArea
                    id="p-desc"
                    rows={5}
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                    placeholder="Describe the flavours, filling, decoration and serving suggestions."
                  />
                </Field>

                <ListInput
                  label="Tags"
                  hint="comma separated"
                  value={form.tags || []}
                  onChange={(v) => set('tags', v)}
                  placeholder="Chocolate, Crowd pleaser, Birthday"
                />
              </div>

              <div className="space-y-4">
                <div className="overflow-hidden rounded-2xl border border-caramel/22 bg-gradient-to-br from-blush/60 to-porcelain p-4">
                  <CreationImage
                    photo={form.photo}
                    art={form.art}
                    flavorArt={form.flavorArt}
                    alt="Preview"
                    seed={form.slug || 'preview'}
                  />
                </div>
                <p className="text-center text-[0.72rem] text-cocoa/45">
                  Live preview as customers will see it
                </p>
              </div>
            </div>
          )}

          {section === 'pricing' && (
            <div className="space-y-7">
              <OptionRows
                label="Sizes & prices"
                hint="at least one, in RWF"
                rows={form.sizes || []}
                onChange={(v) => set('sizes', v)}
                addLabel="Add a size"
                emptyNote="Every product needs at least one size with a price."
                columns={[
                  { key: 'label', label: 'Size', placeholder: '8" round', width: 'flex-[1.4]' },
                  { key: 'serves', label: 'Serves', placeholder: '14–18 slices', width: 'flex-1' },
                  { key: 'price', label: 'Price', type: 'number', placeholder: '42000', width: 'w-28' },
                ]}
              />

              <div className="rounded-2xl border border-caramel/22 bg-porcelain p-5">
                <h3 className="font-display text-[1.05rem] text-espresso">What the customer sees</h3>
                <p className="mt-2 text-[0.85rem] text-cocoa/65">
                  {priceRange
                    ? `Listed as "from ${money(priceRange.min)}" across the site. Flavour, finish and add-on charges are added on top of the size price.`
                    : 'Add a size with a price and the product will show a "from" price on every card.'}
                </p>
              </div>
            </div>
          )}

          {section === 'options' && (
            <div className="space-y-8">
              <OptionRows
                label="Flavours"
                hint="extra charge added to the size price"
                rows={form.flavors || []}
                onChange={(v) => set('flavors', v)}
                addLabel="Add a flavour"
                emptyNote="No flavour choice — customers order this exactly as described."
                columns={[
                  { key: 'label', label: 'Flavour', placeholder: 'Belgian chocolate' },
                  { key: 'delta', label: 'Extra', type: 'number', placeholder: '0', width: 'w-28' },
                ]}
              />

              <OptionRows
                label="Finishes"
                hint="frosting or coating options"
                rows={form.frostings || []}
                onChange={(v) => set('frostings', v)}
                addLabel="Add a finish"
                emptyNote="No finish choice for this product."
                columns={[
                  { key: 'label', label: 'Finish', placeholder: 'Whipped ganache' },
                  { key: 'delta', label: 'Extra', type: 'number', placeholder: '0', width: 'w-28' },
                ]}
              />

              <OptionRows
                label="Finishing touches"
                hint="optional paid extras"
                rows={form.addons || []}
                onChange={(v) => set('addons', v)}
                addLabel="Add an extra"
                emptyNote="No optional extras offered."
                columns={[
                  { key: 'label', label: 'Extra', placeholder: '24k edible gold leaf' },
                  { key: 'price', label: 'Price', type: 'number', placeholder: '9000', width: 'w-28' },
                ]}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <Toggle
                  label="Allow a message on the cake"
                  description="Shows a field for the words to pipe."
                  checked={form.allowsMessage}
                  onChange={(v) => set('allowsMessage', v)}
                />
                <Toggle
                  label="Ask for a design brief"
                  description="Let customers describe their design ideas when ordering."
                  checked={form.customBrief}
                  onChange={(v) => set('customBrief', v)}
                />
              </div>
            </div>
          )}

          {section === 'display' && (
            <div className="grid gap-7 lg:grid-cols-[1.3fr_0.7fr]">
              <div className="space-y-6">
                <div>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[0.8125rem] font-medium text-cocoa">Photo</span>
                    <span className="text-[0.72rem] text-cocoa/45">
                      leave empty to use the drawing
                    </span>
                  </div>
                  <div className="mt-2">
                    <ImagePicker
                      value={form.photo || ''}
                      onChange={(url) => set('photo', url)}
                      adminKey={adminKey}
                      alt={form.name}
                    />
                  </div>
                  <p className="mt-2.5 text-[0.75rem] leading-relaxed text-cocoa/55">
                    If a photo ever fails to load, the drawing comes back on its own, so customers
                    never see a broken picture.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Illustration" htmlFor="p-art">
                    <Select id="p-art" value={form.art} onChange={(e) => set('art', e.target.value)}>
                      {ART_VARIANTS.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.label}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field label="Colour palette" htmlFor="p-palette">
                    <Select
                      id="p-palette"
                      value={form.flavorArt}
                      onChange={(e) => set('flavorArt', e.target.value)}
                    >
                      {ART_PALETTES.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>

                <div>
                  <p className="text-[0.8125rem] font-medium text-cocoa">Suits these occasions</p>
                  <p className="mt-1 text-[0.72rem] text-cocoa/45">
                    Controls where it appears in the occasion finder and filters.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {OCCASIONS.map((o) => {
                      const on = form.occasions?.includes(o.id)
                      return (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => toggleOccasion(o.id)}
                          aria-pressed={on}
                          className={classNames(
                            'rounded-full border px-3.5 py-1.5 text-[0.78rem] font-medium transition-all',
                            on
                              ? 'border-espresso bg-espresso text-cream'
                              : 'border-caramel/30 bg-porcelain text-cocoa/75 hover:border-caramel',
                          )}
                        >
                          {o.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Rating shown" htmlFor="p-rating" hint="0–5, blank to hide">
                    <TextInput
                      id="p-rating"
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={form.rating ?? ''}
                      onChange={(e) => set('rating', e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Review count" htmlFor="p-reviews">
                    <TextInput
                      id="p-reviews"
                      type="number"
                      min="0"
                      value={form.reviews ?? 0}
                      onChange={(e) => set('reviews', Number(e.target.value) || 0)}
                    />
                  </Field>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Toggle
                    label="Show on the site"
                    description="Turn off to hide it without deleting it."
                    checked={form.active}
                    onChange={(v) => set('active', v)}
                  />
                  <Toggle
                    label="Mark as bestseller"
                    description="Features it on the home page."
                    checked={form.bestseller}
                    onChange={(v) => set('bestseller', v)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="overflow-hidden rounded-2xl border border-caramel/22 bg-gradient-to-br from-blush/60 to-porcelain p-4">
                  <CreationImage
                    photo={form.photo}
                    art={form.art}
                    flavorArt={form.flavorArt}
                    alt="Preview"
                    seed={form.slug || 'preview'}
                  />
                </div>
                <p className="text-center text-[0.72rem] text-cocoa/45">Live preview</p>
              </div>
            </div>
          )}
        </div>

        {/* ------------------------------------------------ footer */}
        <footer className="border-t border-caramel/22 bg-porcelain px-6 py-4">
          {error && (
            <p className="mb-3 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-[0.85rem] text-red-700">
              <AlertCircle size={15} strokeWidth={2} className="mt-0.5 shrink-0" />
              {error}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => onSave(form)} disabled={saving} sheen>
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Save size={16} strokeWidth={1.9} /> Save product
                </>
              )}
            </Button>
          </div>
        </footer>
      </motion.div>
    </motion.div>
  )
}

export function ProductEditorPortal({ open, ...props }) {
  return <AnimatePresence>{open && <ProductEditor {...props} />}</AnimatePresence>
}
