import { Check } from 'lucide-react'
import { ORDER_STATUSES } from '../lib/orders'
import { classNames } from '../lib/format'

/** Public-facing progress bar — cancellations get their own, quieter treatment. */
const FLOW = ORDER_STATUSES.filter((s) => s.id !== 'cancelled')

export default function OrderTimeline({ status = 'new', className = '' }) {
  if (status === 'cancelled') {
    return (
      <div className={classNames('rounded-2xl border border-red-200 bg-red-50 p-5', className)}>
        <p className="font-medium text-red-800">This order was cancelled</p>
        <p className="mt-1 text-[0.85rem] text-red-700/80">
          If that was not expected, message us on WhatsApp and we will sort it out.
        </p>
      </div>
    )
  }

  const currentIndex = Math.max(
    0,
    FLOW.findIndex((s) => s.id === status),
  )

  return (
    <ol className={classNames('relative space-y-0', className)}>
      {FLOW.map((s, i) => {
        const done = i < currentIndex
        const active = i === currentIndex
        const last = i === FLOW.length - 1
        return (
          <li key={s.id} className="relative flex gap-4 pb-7 last:pb-0">
            {!last && (
              <span
                aria-hidden="true"
                className={classNames(
                  'absolute left-[0.9375rem] top-8 h-[calc(100%-1.5rem)] w-px transition-colors duration-500',
                  done ? 'bg-caramel' : 'bg-caramel/22',
                )}
              />
            )}

            <span
              className={classNames(
                'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[0.7rem] font-semibold transition-all duration-400',
                done && 'border-caramel bg-caramel text-espresso',
                active && 'border-espresso bg-espresso text-cream',
                !done && !active && 'border-caramel/30 bg-porcelain text-cocoa/40',
              )}
            >
              {done ? <Check size={14} strokeWidth={3} /> : i + 1}
            </span>

            <div className="pt-1">
              <p
                className={classNames(
                  'text-[0.9375rem] font-medium transition-colors',
                  active ? 'text-espresso' : done ? 'text-cocoa/75' : 'text-cocoa/45',
                )}
              >
                {s.label}
                {active && (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-gold/25 px-2 py-0.5 text-[0.62rem] uppercase tracking-[0.1em] text-cocoa">
                    Now
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-[0.8rem] text-cocoa/55">{s.hint}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
