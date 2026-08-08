import { useEffect, useState } from 'react'
import { Check, Loader2, RotateCcw, Save } from 'lucide-react'
import { Field, TextArea, TextInput } from '../Field'
import { Button } from '../ui'
import OptionRows from './OptionRows'
import GalleryEditor from './GalleryEditor'
import ImagePicker from './ImagePicker'
import { money } from '../../lib/format'

/**
 * Everything about the business that is not a product: money rules, lead
 * times, delivery zones, contact details and opening hours. Saving here
 * changes the storefront, the order flow and the emails at once.
 */
export default function SettingsPanel({ settings, onSave, onReset, saving, error, adminKey }) {
  const [form, setForm] = useState(settings)
  const [saved, setSaved] = useState(false)

  useEffect(() => setForm(settings), [settings])

  const setIn = (section, key, value) =>
    setForm((f) => ({ ...f, [section]: { ...f[section], [key]: value } }))

  const setLead = (key, value) =>
    setForm((f) => ({
      ...f,
      fulfilment: {
        ...f.fulfilment,
        leadDays: { ...f.fulfilment.leadDays, [key]: Number(value) || 0 },
      },
    }))

  const submit = async () => {
    await onSave(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2400)
  }

  if (!form) return null

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-[0.85rem] text-red-700">{error}</p>
      )}

      {/* ------------------------------------------------- money */}
      <Card
        title="Money & fulfilment"
        note="These drive the basket, the checkout totals and the deposit wording."
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Delivery fee" htmlFor="s-fee" hint="RWF">
            <TextInput
              id="s-fee"
              type="number"
              min="0"
              value={form.fulfilment.deliveryFee}
              onChange={(e) => setIn('fulfilment', 'deliveryFee', Number(e.target.value) || 0)}
            />
          </Field>

          <Field label="Free delivery over" htmlFor="s-free" hint="RWF">
            <TextInput
              id="s-free"
              type="number"
              min="0"
              value={form.fulfilment.freeDeliveryOver}
              onChange={(e) => setIn('fulfilment', 'freeDeliveryOver', Number(e.target.value) || 0)}
            />
          </Field>

          <Field label="Deposit for big orders" htmlFor="s-deposit" hint="%">
            <TextInput
              id="s-deposit"
              type="number"
              min="0"
              max="100"
              value={form.fulfilment.depositPercent}
              onChange={(e) => setIn('fulfilment', 'depositPercent', Number(e.target.value) || 0)}
            />
          </Field>
        </div>

        <p className="mt-4 rounded-xl bg-cream/70 px-4 py-3 text-[0.8rem] text-cocoa/65">
          A {money(form.fulfilment.freeDeliveryOver)} basket currently ships free; anything below it
          pays {money(form.fulfilment.deliveryFee)}.
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          <Field label="Standard lead time" htmlFor="s-lead-std" hint="days">
            <TextInput
              id="s-lead-std"
              type="number"
              min="0"
              value={form.fulfilment.leadDays.standard}
              onChange={(e) => setLead('standard', e.target.value)}
            />
          </Field>
          <Field label="Custom designs" htmlFor="s-lead-custom" hint="days">
            <TextInput
              id="s-lead-custom"
              type="number"
              min="0"
              value={form.fulfilment.leadDays.custom}
              onChange={(e) => setLead('custom', e.target.value)}
            />
          </Field>
          <Field label="Wedding tiers" htmlFor="s-lead-wedding" hint="days">
            <TextInput
              id="s-lead-wedding"
              type="number"
              min="0"
              value={form.fulfilment.leadDays.wedding}
              onChange={(e) => setLead('wedding', e.target.value)}
            />
          </Field>
        </div>
      </Card>

      {/* --------------------------------------------- zones */}
      <Card title="Delivery zones" note="Offered as choices at checkout.">
        <OptionRows
          label="Zones"
          rows={(form.fulfilment.deliveryZones || []).map((z) => ({ zone: z }))}
          onChange={(rows) =>
            setIn('fulfilment', 'deliveryZones', rows.map((r) => r.zone).filter(Boolean))
          }
          addLabel="Add a zone"
          emptyNote="Add at least one zone so customers can pick where they are."
          columns={[{ key: 'zone', label: 'Zone', placeholder: 'Kimihurura · Kacyiru · Remera' }]}
          max={30}
        />

        <div className="mt-6">
          <OptionRows
            label="Payment methods"
            hint="shown in the footer and at checkout"
            rows={(form.fulfilment.payments || []).map((p) => ({ method: p }))}
            onChange={(rows) =>
              setIn('fulfilment', 'payments', rows.map((r) => r.method).filter(Boolean))
            }
            addLabel="Add a method"
            columns={[{ key: 'method', label: 'Method', placeholder: 'MTN Mobile Money' }]}
            max={10}
          />
        </div>
      </Card>

      {/* ------------------------------------------- contact */}
      <Card title="Contact details" note="Used across the site, the footer and every email.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Phone (as displayed)" htmlFor="s-phone">
            <TextInput
              id="s-phone"
              value={form.contact.phoneDisplay || ''}
              onChange={(e) => setIn('contact', 'phoneDisplay', e.target.value)}
              placeholder="0788 722 064"
            />
          </Field>

          <Field label="WhatsApp number" htmlFor="s-wa" hint="digits only, with country code">
            <TextInput
              id="s-wa"
              value={form.contact.whatsapp || ''}
              onChange={(e) => setIn('contact', 'whatsapp', e.target.value)}
              placeholder="250788722064"
            />
          </Field>

          <Field label="Instagram handle" htmlFor="s-ig" hint="without the @">
            <TextInput
              id="s-ig"
              value={form.contact.instagram || ''}
              onChange={(e) => setIn('contact', 'instagram', e.target.value)}
              placeholder="dussa_bakelab"
            />
          </Field>

          <Field label="Email" htmlFor="s-email">
            <TextInput
              id="s-email"
              type="email"
              value={form.contact.email || ''}
              onChange={(e) => setIn('contact', 'email', e.target.value)}
              placeholder="orders@dussabakelab.com"
            />
          </Field>

          <Field
            label="Mobile Money number"
            htmlFor="s-momo"
            hint="customers are asked to pay this"
          >
            <TextInput
              id="s-momo"
              value={form.contact.momoNumber || ''}
              onChange={(e) => setIn('contact', 'momoNumber', e.target.value)}
              placeholder="+250 788 722 064"
            />
          </Field>

          <Field label="Location" htmlFor="s-loc">
            <TextInput
              id="s-loc"
              value={form.contact.location || ''}
              onChange={(e) => setIn('contact', 'location', e.target.value)}
              placeholder="Kigali, Rwanda"
            />
          </Field>
        </div>
      </Card>

      {/* --------------------------------------------- hours */}
      <Card title="Kitchen hours" note="Shown in the footer and on the contact page.">
        <OptionRows
          label="Hours"
          rows={form.hours || []}
          onChange={(v) => setForm((f) => ({ ...f, hours: v }))}
          addLabel="Add a row"
          columns={[
            { key: 'day', label: 'Days', placeholder: 'Monday – Friday' },
            { key: 'time', label: 'Hours', placeholder: '8:00 AM – 7:00 PM' },
          ]}
          max={10}
        />
      </Card>

      {/* ------------------------------------------- gallery */}
      <Card
        title="Photos on the home page"
        note='The moving shelf under "Today on the shelf".'
      >
        <GalleryEditor
          rows={form.gallery || []}
          onChange={(v) => setForm((f) => ({ ...f, gallery: v }))}
          adminKey={adminKey}
        />
      </Card>

      {/* --------------------------------------------- logo */}
      <Card
        title="Your logo"
        note="Shown in the navbar, the footer and the browser tab. Leave it empty to keep the drawn monogram."
      >
        <ImagePicker
          value={form.brand.logoUrl || ''}
          onChange={(url) => setIn('brand', 'logoUrl', url)}
          adminKey={adminKey}
          alt="Your logo"
        />

        <label className="mt-4 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={Boolean(form.brand.logoHasName)}
            onChange={(e) => setIn('brand', 'logoHasName', e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-espresso"
          />
          <span className="text-[0.85rem] leading-relaxed text-cocoa/70">
            My logo already includes the name — don’t print “Dussa BakeLab” next to it.
          </span>
        </label>

        <p className="mt-4 rounded-xl bg-cream/70 px-4 py-3 text-[0.8rem] leading-relaxed text-cocoa/65">
          A square PNG or SVG with a transparent background works best — the site has a light and a
          dark theme, and a logo baked onto a white square will show that square on the dark one.
        </p>
      </Card>

      {/* --------------------------------------------- brand */}
      <Card title="Brand words" note="The headline phrases customers read first.">
        <div className="grid gap-5">
          <Field label="Business name" htmlFor="s-name">
            <TextInput
              id="s-name"
              value={form.brand.name || ''}
              onChange={(e) => setIn('brand', 'name', e.target.value)}
            />
          </Field>

          <Field label="Script line" htmlFor="s-script" hint="the handwritten phrase">
            <TextInput
              id="s-script"
              value={form.brand.script || ''}
              onChange={(e) => setIn('brand', 'script', e.target.value)}
              placeholder="Let's make life sweeter"
            />
          </Field>

          <Field label="Short description" htmlFor="s-desc">
            <TextArea
              id="s-desc"
              rows={3}
              value={form.brand.description || ''}
              onChange={(e) => setIn('brand', 'description', e.target.value)}
            />
          </Field>
        </div>
      </Card>

      <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-caramel/25 bg-porcelain/95 p-4 shadow-lift backdrop-blur">
        <Button variant="ghost" size="sm" onClick={onReset}>
          <RotateCcw size={14} strokeWidth={2} /> Restore defaults
        </Button>
        <Button onClick={submit} disabled={saving} sheen>
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Saving…
            </>
          ) : saved ? (
            <>
              <Check size={16} strokeWidth={2.4} /> Saved
            </>
          ) : (
            <>
              <Save size={16} strokeWidth={1.9} /> Save settings
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

function Card({ title, note, children }) {
  return (
    <section className="rounded-[1.5rem] border border-caramel/22 bg-porcelain p-6">
      <h3 className="font-display text-[1.2rem] text-espresso">{title}</h3>
      {note && <p className="mt-1.5 text-[0.82rem] text-cocoa/55">{note}</p>}
      <div className="mt-5">{children}</div>
    </section>
  )
}
