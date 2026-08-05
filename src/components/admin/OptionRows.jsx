import { GripVertical, Plus, Trash2 } from 'lucide-react'
import { TextInput } from '../Field'
import { classNames } from '../../lib/format'

/**
 * Repeatable rows for a product's sizes, flavours, finishes and add-ons.
 *
 * `columns` describes each input: { key, label, type, width, placeholder }.
 * The parent owns the array; this only ever calls back with a new one.
 */
export default function OptionRows({
  label,
  hint,
  columns,
  rows = [],
  onChange,
  addLabel = 'Add row',
  emptyNote,
  max = 20,
}) {
  const update = (index, key, value) => {
    const next = rows.map((row, i) => (i === index ? { ...row, [key]: value } : row))
    onChange(next)
  }

  const add = () => {
    const blank = Object.fromEntries(columns.map((c) => [c.key, c.type === 'number' ? 0 : '']))
    onChange([...rows, blank])
  }

  const remove = (index) => onChange(rows.filter((_, i) => i !== index))

  const move = (index, delta) => {
    const target = index + delta
    if (target < 0 || target >= rows.length) return
    const next = [...rows]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <fieldset>
      <div className="flex items-baseline justify-between gap-3">
        <legend className="text-[0.8125rem] font-medium text-cocoa">{label}</legend>
        {hint && <span className="text-[0.72rem] text-cocoa/45">{hint}</span>}
      </div>

      {rows.length === 0 && emptyNote && (
        <p className="mt-2 rounded-xl border border-dashed border-caramel/30 bg-cream/50 px-4 py-3 text-[0.78rem] text-cocoa/55">
          {emptyNote}
        </p>
      )}

      <div className="mt-2 space-y-2">
        {rows.map((row, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="flex shrink-0 flex-col">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                className="text-cocoa/30 transition-colors hover:text-espresso disabled:opacity-25"
                aria-label={`Move ${label} row ${index + 1} up`}
              >
                <GripVertical size={14} />
              </button>
            </div>

            {columns.map((col) => (
              <div key={col.key} className={classNames('min-w-0', col.width || 'flex-1')}>
                <TextInput
                  type={col.type || 'text'}
                  inputMode={col.type === 'number' ? 'numeric' : undefined}
                  value={row[col.key] ?? ''}
                  placeholder={col.placeholder || col.label}
                  aria-label={`${label} — ${col.label}`}
                  onChange={(e) =>
                    update(
                      index,
                      col.key,
                      col.type === 'number' ? Number(e.target.value) || 0 : e.target.value,
                    )
                  }
                  className="h-10 text-[0.85rem]"
                />
              </div>
            ))}

            <button
              type="button"
              onClick={() => remove(index)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-cocoa/40 transition-colors hover:bg-red-50 hover:text-red-600"
              aria-label={`Remove ${label} row ${index + 1}`}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      {rows.length < max && (
        <button
          type="button"
          onClick={add}
          className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-caramel/30 px-3.5 py-1.5 text-[0.78rem] font-medium text-cocoa transition-colors hover:border-caramel hover:bg-blush/50"
        >
          <Plus size={13} strokeWidth={2.2} /> {addLabel}
        </button>
      )}
    </fieldset>
  )
}

/** Comma-separated free text, stored as an array (tags, zones, payments). */
export function ListInput({ label, hint, value = [], onChange, placeholder }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-[0.8125rem] font-medium text-cocoa">{label}</label>
        {hint && <span className="text-[0.72rem] text-cocoa/45">{hint}</span>}
      </div>
      <TextInput
        className="mt-2"
        value={value.join(', ')}
        placeholder={placeholder}
        onChange={(e) =>
          onChange(
            e.target.value
              .split(',')
              .map((v) => v.trim())
              .filter(Boolean),
          )
        }
      />
    </div>
  )
}

export function Toggle({ label, description, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-caramel/22 bg-porcelain p-3.5 transition-colors hover:border-caramel/45">
      <input
        type="checkbox"
        checked={Boolean(checked)}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={classNames(
          'mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors',
          checked ? 'bg-espresso' : 'bg-caramel/30',
        )}
      >
        <span
          className={classNames(
            'h-4 w-4 rounded-full bg-porcelain transition-transform',
            checked && 'translate-x-4',
          )}
        />
      </span>
      <span>
        <span className="block text-[0.85rem] font-medium text-espresso">{label}</span>
        {description && (
          <span className="mt-0.5 block text-[0.75rem] leading-relaxed text-cocoa/55">
            {description}
          </span>
        )}
      </span>
    </label>
  )
}
