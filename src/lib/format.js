import { CURRENCY } from '../data/site'

const rwf = new Intl.NumberFormat('en-RW', {
  style: 'decimal',
  maximumFractionDigits: 0,
})

/** 45000 -> "RWF 45,000" */
export function money(value) {
  const n = Number(value) || 0
  return `${CURRENCY.symbol} ${rwf.format(Math.round(n))}`
}

/** 45000 -> "45,000" (when the unit is already shown nearby) */
export function amount(value) {
  return rwf.format(Math.round(Number(value) || 0))
}

/** "2026-08-20" -> "Thu, 20 Aug 2026" */
export function prettyDate(value) {
  if (!value) return '—'
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** ISO timestamp -> "20 Aug, 14:32" */
export function prettyDateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** "2026-08-20" -> "in 3 days" / "today" / "2 days ago" */
export function relativeDay(value) {
  if (!value) return ''
  const target = new Date(value)
  if (Number.isNaN(target.getTime())) return ''
  const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const diff = Math.round((startOf(target) - startOf(new Date())) / 86400000)
  if (diff === 0) return 'today'
  if (diff === 1) return 'tomorrow'
  if (diff === -1) return 'yesterday'
  return diff > 0 ? `in ${diff} days` : `${Math.abs(diff)} days ago`
}

/** Today + n days, as a yyyy-mm-dd string suitable for <input type="date" min>. */
export function isoDaysFromNow(days = 0) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

/**
 * Rwandan mobile numbers, in every form people actually type them:
 * 0788722064, 788722064, 250788722064, +250 788 722 064.
 * The national prefix `0` and the country code `250` are both optional.
 */
export function isValidPhone(value) {
  const digits = String(value || '').replace(/[^\d]/g, '')
  return /^(?:250|0)?7[2389]\d{7}$/.test(digits)
}

export function isValidEmail(value) {
  if (!value) return true // email is optional across the site
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value).trim())
}

/** Normalises any local format to 2507xxxxxxxx for wa.me links. */
export function toInternational(phone) {
  const digits = String(phone || '').replace(/[^\d]/g, '')
  if (digits.startsWith('250')) return digits
  if (digits.startsWith('0')) return `250${digits.slice(1)}`
  return `250${digits}`
}

export function classNames(...values) {
  return values.filter(Boolean).join(' ')
}
