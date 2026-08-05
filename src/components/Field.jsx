import { AlertCircle } from 'lucide-react'
import { classNames } from '../lib/format'

const baseInput =
  'w-full rounded-xl border bg-porcelain px-4 text-[0.9375rem] text-espresso placeholder:text-cocoa/35 transition-colors focus:outline-none'

export function Field({ label, hint, error, required, htmlFor, children, className = '' }) {
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-[0.8125rem] font-medium text-cocoa">
          {label}
          {required && (
            <span className="ml-1 text-caramel" aria-hidden="true">
              *
            </span>
          )}
        </label>
        {hint && <span className="text-[0.72rem] text-cocoa/45">{hint}</span>}
      </div>
      <div className="mt-2">{children}</div>
      {error && (
        <p className="mt-1.5 flex items-center gap-1.5 text-[0.75rem] text-red-700" role="alert">
          <AlertCircle size={13} strokeWidth={2} />
          {error}
        </p>
      )}
    </div>
  )
}

export function TextInput({ error, className = '', ...props }) {
  return (
    <input
      className={classNames(
        baseInput,
        'h-12',
        error ? 'border-red-400 focus:border-red-500' : 'border-caramel/25 focus:border-caramel',
        className,
      )}
      aria-invalid={error ? 'true' : undefined}
      {...props}
    />
  )
}

export function TextArea({ error, className = '', rows = 4, ...props }) {
  return (
    <textarea
      rows={rows}
      className={classNames(
        baseInput,
        'py-3 leading-relaxed',
        error ? 'border-red-400 focus:border-red-500' : 'border-caramel/25 focus:border-caramel',
        className,
      )}
      aria-invalid={error ? 'true' : undefined}
      {...props}
    />
  )
}

export function Select({ error, className = '', children, ...props }) {
  return (
    <select
      className={classNames(
        baseInput,
        'h-12 pr-9',
        error ? 'border-red-400 focus:border-red-500' : 'border-caramel/25 focus:border-caramel',
        className,
      )}
      aria-invalid={error ? 'true' : undefined}
      {...props}
    >
      {children}
    </select>
  )
}
