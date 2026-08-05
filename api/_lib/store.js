/**
 * Order storage.
 *
 * Uses an Upstash-compatible Redis REST API when one is configured (Vercel KV,
 * Upstash Redis, or anything speaking the same protocol) and falls back to an
 * in-process map otherwise, so the API still works end-to-end on a fresh
 * deployment before any database is attached.
 *
 * Environment variables (either naming scheme works):
 *   KV_REST_API_URL / KV_REST_API_TOKEN
 *   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
 */

const REST_URL =
  process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || ''
const REST_TOKEN =
  process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || ''

export const hasPersistentStore = Boolean(REST_URL && REST_TOKEN)

const INDEX_KEY = 'dussa:orders:index'
const orderKey = (code) => `dussa:order:${code}`

/* ------------------------------------------------------------------ */
/* In-memory fallback                                                   */
/* ------------------------------------------------------------------ */

/**
 * Survives warm invocations of the same serverless instance but not cold
 * starts. Good enough to demo the whole flow; not a database.
 */
function memory() {
  if (!globalThis.__dussaOrders) {
    globalThis.__dussaOrders = { byCode: new Map(), index: [] }
  }
  return globalThis.__dussaOrders
}

/* ------------------------------------------------------------------ */
/* Redis REST                                                           */
/* ------------------------------------------------------------------ */

async function redis(command) {
  const res = await fetch(REST_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REST_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  })

  if (!res.ok) {
    throw new Error(`Storage request failed (${res.status})`)
  }

  const data = await res.json()
  if (data?.error) throw new Error(data.error)
  return data?.result
}

/* ------------------------------------------------------------------ */
/* Public API                                                           */
/* ------------------------------------------------------------------ */

export async function saveOrder(order) {
  if (!hasPersistentStore) {
    const store = memory()
    if (!store.byCode.has(order.code)) store.index.unshift(order.code)
    store.byCode.set(order.code, order)
    return order
  }

  await redis(['SET', orderKey(order.code), JSON.stringify(order)])
  // LREM first so an updated order does not appear twice in the index.
  await redis(['LREM', INDEX_KEY, 0, order.code])
  await redis(['LPUSH', INDEX_KEY, order.code])
  await redis(['LTRIM', INDEX_KEY, 0, 999])
  return order
}

export async function getOrder(code) {
  if (!hasPersistentStore) {
    return memory().byCode.get(code) || null
  }

  const raw = await redis(['GET', orderKey(code)])
  if (!raw) return null
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch {
    return null
  }
}

export async function listOrders(limit = 200) {
  if (!hasPersistentStore) {
    const store = memory()
    return store.index.slice(0, limit).map((code) => store.byCode.get(code)).filter(Boolean)
  }

  const codes = await redis(['LRANGE', INDEX_KEY, 0, limit - 1])
  if (!Array.isArray(codes) || codes.length === 0) return []

  const rows = await redis(['MGET', ...codes.map(orderKey)])
  return (rows || [])
    .map((raw) => {
      if (!raw) return null
      try {
        return typeof raw === 'string' ? JSON.parse(raw) : raw
      } catch {
        return null
      }
    })
    .filter(Boolean)
}
