import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  MapPin,
  Minus,
  Plus,
  ShoppingBag,
  Store,
  Trash2,
  Truck,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import CreationImage from '../components/CreationImage'
import { Field, Select, TextArea, TextInput } from '../components/Field'
import { Button, Pill } from '../components/ui'
import { useCatalog } from '../context/CatalogContext'
import { deliveryFeeFor, useCart } from '../context/CartContext'
import { createOrder } from '../lib/orders'
import {
  classNames,
  isValidEmail,
  isValidPhone,
  isoDaysFromNow,
  money,
  prettyDate,
} from '../lib/format'
import usePageMeta from '../lib/usePageMeta'

const STEPS = [
  { id: 'basket', label: 'Your order' },
  { id: 'schedule', label: 'When & where' },
  { id: 'details', label: 'Your details' },
  { id: 'review', label: 'Review' },
]

const TIME_SLOTS = [
  '09:00 – 11:00',
  '11:00 – 13:00',
  '13:00 – 15:00',
  '15:00 – 17:00',
  '17:00 – 19:00',
]

export default function OrderFlow() {
  const navigate = useNavigate()
  const { items, subtotal, count, leadDays, setQuantity, removeItem, clear, openCart } = useCart()
  const { occasions, bestsellers, fulfilment } = useCatalog()

  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState({
    fulfilment: 'delivery',
    date: isoDaysFromNow(Math.max(fulfilment.leadDays?.standard ?? 2, leadDays)),
    time: TIME_SLOTS[2],
    zone: fulfilment.deliveryZones[0] || '',
    address: '',
    name: '',
    phone: '',
    email: '',
    occasion: '',
    notes: '',
    deposit: false,
    whatsappUpdates: true,
  })

  usePageMeta({
    title: 'Book your order — Dussa BakeLab',
    description:
      'Place your Dussa BakeLab order online: choose your creations, pick a delivery or collection slot in Kigali, and confirm in a couple of minutes.',
  })

  const earliestDate = isoDaysFromNow(leadDays)
  const deliveryFee = deliveryFeeFor(subtotal, form.fulfilment, fulfilment)
  const total = subtotal + deliveryFee
  const needsDeposit = useMemo(
    () => items.some((i) => i.category === 'custom') || total >= 120000,
    [items, total],
  )

  const update = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  /** Each step validates only its own fields, so people are never blocked early. */
  const validateStep = (index) => {
    const next = {}

    if (index === 0 && items.length === 0) {
      next.basket = 'Add at least one creation before continuing.'
    }

    if (index === 1) {
      if (!form.date) next.date = 'Pick a date.'
      else if (form.date < earliestDate) {
        next.date = `The earliest we can be ready is ${prettyDate(earliestDate)}.`
      }
      if (!form.time) next.time = 'Choose a slot.'
      if (form.fulfilment === 'delivery' && form.address.trim().length < 6) {
        next.address = 'We need a street, building or landmark to find you.'
      }
    }

    if (index === 2) {
      if (form.name.trim().length < 2) next.name = 'Tell us who the order is for.'
      if (!isValidPhone(form.phone)) next.phone = 'Enter a valid Rwandan number, e.g. 0788 722 064.'
      if (!isValidEmail(form.email)) next.email = 'That email address does not look right.'
      if (needsDeposit && !form.deposit) {
        next.deposit = `Please acknowledge the ${fulfilment.depositPercent}% deposit for custom work.`
      }
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const goNext = () => {
    if (!validateStep(step)) return
    setStep((s) => Math.min(STEPS.length - 1, s + 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goBack = () => {
    setStep((s) => Math.max(0, s - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const submit = async () => {
    // Re-check every step: someone can reach review and then edit an earlier field.
    for (let i = 0; i < 3; i += 1) {
      if (!validateStep(i)) {
        setStep(i)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
    }

    setSubmitting(true)
    setSubmitError('')

    const payload = {
      ...form,
      items: items.map((i) => ({
        slug: i.slug,
        name: i.name,
        category: i.category,
        sizeId: i.sizeId,
        sizeLabel: i.sizeLabel,
        flavorId: i.flavorId,
        flavorLabel: i.flavorLabel,
        frostingId: i.frostingId,
        frostingLabel: i.frostingLabel,
        addonLabels: i.addonLabels,
        message: i.message,
        brief: i.brief,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        linePrice: i.unitPrice * i.quantity,
        art: i.art,
        flavorArt: i.flavorArt,
      })),
      subtotal,
      deliveryFee,
      total,
      depositDue: needsDeposit ? Math.round((total * fulfilment.depositPercent) / 100) : 0,
    }

    const result = await createOrder(payload)
    setSubmitting(false)

    if (result.ok) {
      clear()
      navigate(`/order/confirmed/${result.order.code}`, {
        state: { order: result.order, offline: result.offline },
      })
    } else {
      setSubmitError(result.error || 'We could not place that order. Please try again.')
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Booking"
        title="Let's get this baked"
        lead="Four short steps. You get an order code straight away, and a reply from us not long after."
        crumbs={[{ label: 'Order' }]}
      />

      {/* ------------------------------------------------- stepper */}
      <div className="sticky top-[68px] z-30 border-b border-caramel/20 bg-cream/92 backdrop-blur-lg">
        <div className="container-x py-4">
          <ol className="flex items-center gap-2 md:gap-4">
            {STEPS.map((s, i) => {
              const done = i < step
              const active = i === step
              return (
                <li key={s.id} className="flex flex-1 items-center gap-2 md:gap-3">
                  <button
                    type="button"
                    onClick={() => i < step && setStep(i)}
                    disabled={i > step}
                    className={classNames(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[0.75rem] font-semibold transition-all duration-300',
                      active && 'border-espresso bg-espresso text-cream',
                      done && 'border-caramel bg-caramel text-espresso',
                      !active && !done && 'border-caramel/30 text-cocoa/70',
                      i < step && 'cursor-pointer hover:scale-105',
                    )}
                    aria-current={active ? 'step' : undefined}
                  >
                    {done ? <Check size={14} strokeWidth={3} /> : i + 1}
                  </button>
                  <span
                    className={classNames(
                      'hidden text-[0.8125rem] font-medium transition-colors sm:inline',
                      active ? 'text-espresso' : 'text-cocoa/70',
                    )}
                  >
                    {s.label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <span
                      aria-hidden="true"
                      className={classNames(
                        'h-px flex-1 transition-colors duration-500',
                        i < step ? 'bg-caramel' : 'bg-caramel/22',
                      )}
                    />
                  )}
                </li>
              )
            })}
          </ol>
        </div>
      </div>

      <section className="bg-cream py-12 md:py-16">
        <div className="container-x grid gap-10 lg:grid-cols-[1.35fr_0.65fr] lg:gap-14">
          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* ------------------------------------- step 1 */}
                {step === 0 && (
                  <div>
                    <h2 className="text-[1.75rem] text-espresso">Your order</h2>
                    <p className="mt-2 text-[0.9375rem] text-cocoa/62">
                      {count > 0
                        ? 'Check the quantities and extras before you carry on.'
                        : 'Your basket is empty. Here is what people order most.'}
                    </p>

                    {errors.basket && (
                      <p className="mt-4 rounded-xl bg-error-surface px-4 py-3 text-[0.85rem] text-error-foreground">
                        {errors.basket}
                      </p>
                    )}

                    {items.length > 0 ? (
                      <ul className="mt-7 space-y-3">
                        {items.map((item) => (
                          <motion.li
                            key={item.id}
                            layout
                            exit={{ opacity: 0, x: -30 }}
                            className="flex gap-4 rounded-2xl border border-caramel/22 bg-porcelain p-4"
                          >
                            <Link
                              to={`/creations/${item.slug}`}
                              className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-blush/60"
                            >
                              <CreationImage
                                photo={item.photo}
                                art={item.art}
                                flavorArt={item.flavorArt}
                                alt={item.name}
                                seed={item.id}
                              />
                            </Link>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <h3 className="font-display text-[1.1rem] leading-snug text-espresso">
                                    {item.name}
                                  </h3>
                                  <p className="mt-1 text-[0.8rem] text-cocoa/60">
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
                                    <p className="mt-1 text-[0.75rem] italic text-cocoa/72">
                                      Message: “{item.message}”
                                    </p>
                                  )}
                                  {item.brief && (
                                    <p className="mt-1 line-clamp-2 text-[0.75rem] italic text-cocoa/72">
                                      Brief: {item.brief}
                                    </p>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeItem(item.id)}
                                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-cocoa/70 transition-colors hover:bg-error-surface hover:text-error-foreground"
                                  aria-label={`Remove ${item.name}`}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>

                              <div className="mt-3 flex items-center justify-between gap-3">
                                <div className="flex items-center rounded-full border border-caramel/30">
                                  <button
                                    type="button"
                                    onClick={() => setQuantity(item.id, item.quantity - 1)}
                                    disabled={item.quantity <= 1}
                                    className="flex h-8 w-8 items-center justify-center rounded-full text-cocoa transition-colors hover:bg-blush disabled:opacity-35"
                                    aria-label={`Decrease quantity of ${item.name}`}
                                  >
                                    <Minus size={13} />
                                  </button>
                                  <span className="w-8 text-center text-[0.875rem] tabular-nums">
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setQuantity(item.id, item.quantity + 1)}
                                    className="flex h-8 w-8 items-center justify-center rounded-full text-cocoa transition-colors hover:bg-blush"
                                    aria-label={`Increase quantity of ${item.name}`}
                                  >
                                    <Plus size={13} />
                                  </button>
                                </div>
                                <span className="font-display text-[1.1rem] text-espresso tabular-nums">
                                  {money(item.unitPrice * item.quantity)}
                                </span>
                              </div>
                            </div>
                          </motion.li>
                        ))}
                      </ul>
                    ) : (
                      <div className="mt-7 grid gap-4 sm:grid-cols-3">
                        {bestsellers()
                          .slice(0, 3)
                          .map((p) => (
                            <Link
                              key={p.slug}
                              to={`/creations/${p.slug}`}
                              className="group rounded-2xl border border-caramel/22 bg-porcelain p-4 text-center transition-all hover:-translate-y-1 hover:border-caramel/50 hover:shadow-soft"
                            >
                              <div className="mx-auto w-24 transition-transform duration-500 group-hover:scale-110">
                                <CreationImage
                                  art={p.art}
                                  flavorArt={p.flavorArt}
                                  alt={p.name}
                                  seed={p.slug}
                                />
                              </div>
                              <h3 className="mt-3 font-display text-[1rem] text-espresso">{p.name}</h3>
                              <p className="mt-1 text-[0.75rem] text-cocoa/72">{p.tagline}</p>
                            </Link>
                          ))}
                      </div>
                    )}

                    <div className="mt-7 flex flex-wrap gap-3">
                      <Button to="/creations" variant="outline">
                        {items.length > 0 ? 'Add something else' : 'Browse all creations'}
                      </Button>
                      {items.length > 0 && (
                        <Button variant="ghost" onClick={openCart}>
                          <ShoppingBag size={16} strokeWidth={1.8} /> Open basket
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* ------------------------------------- step 2 */}
                {step === 1 && (
                  <div>
                    <h2 className="text-[1.75rem] text-espresso">When &amp; where</h2>
                    <p className="mt-2 text-[0.9375rem] text-cocoa/62">
                      This basket needs{' '}
                      <strong className="text-espresso">
                        {leadDays} {leadDays === 1 ? 'day' : 'days'}
                      </strong>{' '}
                      of notice, so the earliest slot is {prettyDate(earliestDate)}.
                    </p>

                    <div className="mt-7 grid gap-3 sm:grid-cols-2">
                      {[
                        {
                          id: 'delivery',
                          icon: Truck,
                          title: 'Deliver to me',
                          body: `${money(fulfilment.deliveryFee)} across Kigali · free over ${money(fulfilment.freeDeliveryOver)}`,
                        },
                        {
                          id: 'pickup',
                          icon: Store,
                          title: 'I will collect',
                          body: 'Pick up from our Kigali kitchen at your chosen slot',
                        },
                      ].map((option) => {
                        const Icon = option.icon
                        const active = form.fulfilment === option.id
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => update('fulfilment', option.id)}
                            aria-pressed={active}
                            className={classNames(
                              'flex items-start gap-3 rounded-2xl border p-5 text-left transition-all duration-300',
                              active
                                ? 'border-espresso bg-espresso text-cream shadow-soft'
                                : 'border-caramel/25 bg-porcelain hover:border-caramel',
                            )}
                          >
                            <Icon
                              size={20}
                              strokeWidth={1.7}
                              className={active ? 'text-gold' : 'text-caramel'}
                            />
                            <span>
                              <span className="block font-medium">{option.title}</span>
                              <span
                                className={classNames(
                                  'mt-1 block text-[0.78rem] leading-relaxed',
                                  active ? 'text-cream/60' : 'text-cocoa/72',
                                )}
                              >
                                {option.body}
                              </span>
                            </span>
                          </button>
                        )
                      })}
                    </div>

                    <div className="mt-6 grid gap-5 sm:grid-cols-2">
                      <Field
                        label={form.fulfilment === 'delivery' ? 'Delivery date' : 'Collection date'}
                        htmlFor="date"
                        required
                        error={errors.date}
                        hint={`from ${prettyDate(earliestDate)}`}
                      >
                        <TextInput
                          id="date"
                          type="date"
                          min={earliestDate}
                          value={form.date}
                          error={errors.date}
                          onChange={(e) => update('date', e.target.value)}
                        />
                      </Field>

                      <Field label="Preferred slot" htmlFor="time" required error={errors.time}>
                        <Select
                          id="time"
                          value={form.time}
                          error={errors.time}
                          onChange={(e) => update('time', e.target.value)}
                        >
                          {TIME_SLOTS.map((slot) => (
                            <option key={slot} value={slot}>
                              {slot}
                            </option>
                          ))}
                        </Select>
                      </Field>
                    </div>

                    {form.fulfilment === 'delivery' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-5 grid gap-5 overflow-hidden sm:grid-cols-2"
                      >
                        <Field label="Delivery zone" htmlFor="zone" required>
                          <Select
                            id="zone"
                            value={form.zone}
                            onChange={(e) => update('zone', e.target.value)}
                          >
                            {fulfilment.deliveryZones.map((z) => (
                              <option key={z} value={z}>
                                {z}
                              </option>
                            ))}
                            <option value="Elsewhere in Rwanda">Elsewhere — please quote me</option>
                          </Select>
                        </Field>

                        <Field
                          label="Street, building or landmark"
                          htmlFor="address"
                          required
                          error={errors.address}
                          className="sm:col-span-2"
                        >
                          <TextInput
                            id="address"
                            value={form.address}
                            error={errors.address}
                            placeholder="e.g. KG 11 Ave, Ikaze House, 3rd floor — opposite the pharmacy"
                            onChange={(e) => update('address', e.target.value)}
                          />
                        </Field>
                      </motion.div>
                    )}

                    {form.fulfilment === 'pickup' && (
                      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-caramel/22 bg-porcelain p-5">
                        <MapPin size={18} strokeWidth={1.7} className="mt-0.5 shrink-0 text-caramel" />
                        <p className="text-[0.875rem] leading-relaxed text-cocoa/70">
                          We will send the exact spot and a map pin with your confirmation. Pickups
                          happen at our kitchen in Kigali during the time you choose.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* ------------------------------------- step 3 */}
                {step === 2 && (
                  <div>
                    <h2 className="text-[1.75rem] text-espresso">Your details</h2>
                    <p className="mt-2 text-[0.9375rem] text-cocoa/62">
                      So we can confirm the order and reach you on the day.
                    </p>

                    <div className="mt-7 grid gap-5 sm:grid-cols-2">
                      <Field label="Full name" htmlFor="name" required error={errors.name}>
                        <TextInput
                          id="name"
                          value={form.name}
                          error={errors.name}
                          autoComplete="name"
                          placeholder="Keza Uwase"
                          onChange={(e) => update('name', e.target.value)}
                        />
                      </Field>

                      <Field
                        label="Phone / WhatsApp"
                        htmlFor="phone"
                        required
                        error={errors.phone}
                        hint="Rwandan mobile"
                      >
                        <TextInput
                          id="phone"
                          type="tel"
                          value={form.phone}
                          error={errors.phone}
                          autoComplete="tel"
                          placeholder="0788 722 064"
                          onChange={(e) => update('phone', e.target.value)}
                        />
                      </Field>

                      <Field label="Email" htmlFor="email" error={errors.email} hint="optional">
                        <TextInput
                          id="email"
                          type="email"
                          value={form.email}
                          error={errors.email}
                          autoComplete="email"
                          placeholder="you@example.com"
                          onChange={(e) => update('email', e.target.value)}
                        />
                      </Field>

                      <Field label="Occasion" htmlFor="occasion" hint="helps us finish it right">
                        <Select
                          id="occasion"
                          value={form.occasion}
                          onChange={(e) => update('occasion', e.target.value)}
                        >
                          <option value="">Not specified</option>
                          {occasions.map((o) => (
                            <option key={o.id} value={o.label}>
                              {o.label}
                            </option>
                          ))}
                        </Select>
                      </Field>

                      <Field
                        label="Anything else we should know?"
                        htmlFor="notes"
                        hint="optional"
                        className="sm:col-span-2"
                      >
                        <TextArea
                          id="notes"
                          value={form.notes}
                          placeholder="Allergies, colours, the name to pipe, a gate code, who not to tell…"
                          onChange={(e) => update('notes', e.target.value)}
                        />
                      </Field>
                    </div>

                    <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-caramel/25 bg-porcelain p-5 transition-colors">
                      <input
                        type="checkbox"
                        checked={form.whatsappUpdates}
                        onChange={(e) => update('whatsappUpdates', e.target.checked)}
                        className="sr-only"
                      />
                      <span
                        aria-hidden="true"
                        className={classNames(
                          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors',
                          form.whatsappUpdates
                            ? 'border-espresso bg-espresso text-cream'
                            : 'border-caramel/50',
                        )}
                      >
                        {form.whatsappUpdates && <Check size={13} strokeWidth={3} />}
                      </span>
                      <span className="text-[0.875rem] leading-relaxed text-cocoa/75">
                        <strong className="text-espresso">Send me WhatsApp updates</strong> on this
                        number — a confirmation now, then a message each time the order moves:
                        confirmed, in the kitchen, ready. Untick if you would rather we only email.
                      </span>
                    </label>

                    {needsDeposit && (
                      <label
                        className={classNames(
                          'mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border p-5 transition-colors',
                          errors.deposit
                            ? 'border-error-border bg-error-surface/60'
                            : 'border-caramel/25 bg-porcelain',
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={form.deposit}
                          onChange={(e) => update('deposit', e.target.checked)}
                          className="sr-only"
                        />
                        <span
                          aria-hidden="true"
                          className={classNames(
                            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors',
                            form.deposit ? 'border-espresso bg-espresso text-cream' : 'border-caramel/50',
                          )}
                        >
                          {form.deposit && <Check size={13} strokeWidth={3} />}
                        </span>
                        <span className="text-[0.875rem] leading-relaxed text-cocoa/75">
                          I understand this order is confirmed with a{' '}
                          <strong className="text-espresso">
                            {fulfilment.depositPercent}% deposit (
                            {money(Math.round((total * fulfilment.depositPercent) / 100))})
                          </strong>
                          , with the balance settled before the order leaves the kitchen.
                          {errors.deposit && (
                            <span className="mt-1 block text-[0.78rem] text-error-foreground">
                              {errors.deposit}
                            </span>
                          )}
                        </span>
                      </label>
                    )}
                  </div>
                )}

                {/* ------------------------------------- step 4 */}
                {step === 3 && (
                  <div>
                    <h2 className="text-[1.75rem] text-espresso">Review &amp; confirm</h2>
                    <p className="mt-2 text-[0.9375rem] text-cocoa/62">
                      One last look. Nothing is charged here. We confirm the order and sort out
                      payment with you directly.
                    </p>

                    <div className="mt-7 space-y-4">
                      <ReviewBlock
                        title={form.fulfilment === 'delivery' ? 'Delivery' : 'Collection'}
                        onEdit={() => setStep(1)}
                        rows={[
                          ['Date', prettyDate(form.date)],
                          ['Slot', form.time],
                          form.fulfilment === 'delivery' ? ['Zone', form.zone] : null,
                          form.fulfilment === 'delivery' ? ['Address', form.address] : null,
                        ].filter(Boolean)}
                      />

                      <ReviewBlock
                        title="Contact"
                        onEdit={() => setStep(2)}
                        rows={[
                          ['Name', form.name],
                          ['Phone', form.phone],
                          ['WhatsApp updates', form.whatsappUpdates ? 'Yes' : 'No thanks'],
                          form.email ? ['Email', form.email] : null,
                          form.occasion ? ['Occasion', form.occasion] : null,
                          form.notes ? ['Notes', form.notes] : null,
                        ].filter(Boolean)}
                      />

                      <div className="rounded-2xl border border-caramel/22 bg-porcelain p-5">
                        <div className="flex items-center justify-between">
                          <h3 className="font-display text-[1.1rem] text-espresso">
                            {count} {count === 1 ? 'item' : 'items'}
                          </h3>
                          <button
                            type="button"
                            onClick={() => setStep(0)}
                            className="text-[0.78rem] text-caramel underline-offset-4 hover:underline"
                          >
                            Edit
                          </button>
                        </div>
                        <ul className="mt-4 space-y-3">
                          {items.map((item) => (
                            <li key={item.id} className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-[0.9rem] text-espresso">
                                  {item.quantity} × {item.name}
                                </p>
                                <p className="text-[0.78rem] text-cocoa/72">
                                  {[item.sizeLabel, item.flavorLabel, item.frostingLabel]
                                    .filter(Boolean)
                                    .join(' · ')}
                                </p>
                              </div>
                              <span className="shrink-0 text-[0.9rem] tabular-nums text-espresso">
                                {money(item.unitPrice * item.quantity)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {submitError && (
                      <p className="mt-5 rounded-xl bg-error-surface px-4 py-3 text-[0.85rem] text-error-foreground">
                        {submitError}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* --------------------------------------- navigation */}
            <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-caramel/22 pt-7">
              {step > 0 ? (
                <Button variant="ghost" onClick={goBack}>
                  <ArrowLeft size={16} strokeWidth={1.9} /> Back
                </Button>
              ) : (
                <span />
              )}

              {step < STEPS.length - 1 ? (
                <Button onClick={goNext} size="lg" disabled={step === 0 && items.length === 0}>
                  Continue
                  <ArrowRight
                    size={16}
                    strokeWidth={2}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </Button>
              ) : (
                <Button onClick={submit} size="lg" disabled={submitting} sheen>
                  {submitting ? (
                    <>
                      <Loader2 size={17} className="animate-spin" /> Placing your order…
                    </>
                  ) : (
                    <>
                      Place order · {money(total)}
                      <ArrowRight size={16} strokeWidth={2} />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* ------------------------------------------- summary */}
          <aside className="lg:sticky lg:top-32 lg:self-start">
            <div className="rounded-[1.75rem] border border-caramel/25 bg-porcelain p-6 shadow-soft">
              <h2 className="font-display text-[1.25rem] text-espresso">Order summary</h2>

              <dl className="mt-5 space-y-3 text-[0.9rem]">
                <div className="flex justify-between gap-4">
                  <dt className="text-cocoa/62">Subtotal</dt>
                  <dd className="tabular-nums text-espresso">{money(subtotal)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-cocoa/62">
                    {form.fulfilment === 'delivery' ? 'Delivery' : 'Collection'}
                  </dt>
                  <dd className="tabular-nums text-espresso">
                    {form.fulfilment === 'pickup'
                      ? 'Free'
                      : deliveryFee === 0
                        ? 'Free'
                        : money(deliveryFee)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-caramel/22 pt-3">
                  <dt className="font-medium text-espresso">Total</dt>
                  <dd className="font-display text-[1.5rem] leading-none tabular-nums text-espresso">
                    {money(total)}
                  </dd>
                </div>
                {needsDeposit && (
                  <div className="flex justify-between gap-4 text-[0.8125rem]">
                    <dt className="text-cocoa/72">
                      Deposit to confirm ({fulfilment.depositPercent}%)
                    </dt>
                    <dd className="tabular-nums text-caramel">
                      {money(Math.round((total * fulfilment.depositPercent) / 100))}
                    </dd>
                  </div>
                )}
              </dl>

              <div className="mt-6 space-y-2.5 border-t border-caramel/22 pt-5 text-[0.78rem] text-cocoa/60">
                <p className="flex items-start gap-2">
                  <Check size={14} strokeWidth={2.4} className="mt-0.5 shrink-0 text-caramel" />
                  Made to order, never frozen
                </p>
                <p className="flex items-start gap-2">
                  <Check size={14} strokeWidth={2.4} className="mt-0.5 shrink-0 text-caramel" />
                  Change anything up to 48h before your date
                </p>
                <p className="flex items-start gap-2">
                  <Check size={14} strokeWidth={2.4} className="mt-0.5 shrink-0 text-caramel" />
                  Pay by MoMo, Airtel Money, transfer or cash
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {fulfilment.payments.slice(0, 3).map((p) => (
                  <Pill key={p} tone="outline" className="text-[0.6rem]">
                    {p}
                  </Pill>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}

function ReviewBlock({ title, rows, onEdit }) {
  return (
    <div className="rounded-2xl border border-caramel/22 bg-porcelain p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-[1.1rem] text-espresso">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="text-[0.78rem] text-caramel underline-offset-4 hover:underline"
        >
          Edit
        </button>
      </div>
      <dl className="mt-4 space-y-2 text-[0.875rem]">
        {rows.map(([label, value]) => (
          <div key={label} className="flex gap-4">
            <dt className="w-24 shrink-0 text-cocoa/70">{label}</dt>
            <dd className="text-espresso">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
