/** Shared helpers for the order endpoints. */

export function sendJson(res, status, body) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.status(status).send(JSON.stringify(body))
}

export function applyCors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return true
  }
  return false
}

/**
 * Admin endpoints are gated by a shared key. When ADMIN_KEY is unset the
 * dashboard is left open — fine for a local run, so the deploy docs call it out
 * as the one variable you must set in production.
 */
export function isAdmin(req) {
  const expected = process.env.ADMIN_KEY
  if (!expected) return true
  const provided = req.headers['x-admin-key']
  return typeof provided === 'string' && provided === expected
}

export function adminConfigured() {
  return Boolean(process.env.ADMIN_KEY)
}

export function readBody(req) {
  if (!req.body) return {}
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body)
    } catch {
      return {}
    }
  }
  return req.body
}

const CODE_PATTERN = /^DBL-[A-Z0-9]{4,12}$/

export function normaliseCode(value) {
  const code = String(value || '').trim().toUpperCase()
  return CODE_PATTERN.test(code) ? code : ''
}

/** Trims free text and caps length so a bad actor cannot fill the store. */
export function clean(value, max = 400) {
  return String(value ?? '').trim().slice(0, max)
}

export function toNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0
}
