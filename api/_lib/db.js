import pg from 'pg'

/**
 * Postgres storage for orders, products and settings.
 *
 * Works with any Postgres connection string — Neon, Supabase, Railway, a local
 * database — so you are never locked to one provider. Set DATABASE_URL and the
 * tables are created on first use.
 *
 * With no DATABASE_URL the API falls back to an in-process map so `npm run dev`
 * and the tests work offline. That fallback is explicitly *not* durable, and
 * every endpoint reports which mode it is in so the dashboard can warn you.
 */

const CONNECTION =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.NEON_DATABASE_URL ||
  ''

export const hasDatabase = Boolean(CONNECTION)

/* ------------------------------------------------------------------ */
/* Connection                                                           */
/* ------------------------------------------------------------------ */

/**
 * One pool per warm serverless instance, capped at a single connection.
 * Serverless invocations are short and concurrent, so a wide pool per instance
 * is the fastest way to exhaust a database's connection limit.
 */
function pool() {
  if (!globalThis.__dussaPool) {
    globalThis.__dussaPool = new pg.Pool({
      connectionString: CONNECTION,
      max: 1,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 12000,
      // Hosted Postgres (Neon, Supabase, Railway) terminates TLS with a
      // certificate chain the Lambda runtime does not carry.
      ssl: CONNECTION.includes('localhost') ? false : { rejectUnauthorized: false },
    })
  }
  return globalThis.__dussaPool
}

async function query(text, params = []) {
  const result = await pool().query(text, params)
  return result.rows
}

/* ------------------------------------------------------------------ */
/* Schema                                                               */
/* ------------------------------------------------------------------ */

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS orders (
    code        TEXT PRIMARY KEY,
    status      TEXT NOT NULL DEFAULT 'new',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    data        JSONB NOT NULL
  );
  CREATE INDEX IF NOT EXISTS orders_created_idx ON orders (created_at DESC);
  CREATE INDEX IF NOT EXISTS orders_status_idx  ON orders (status);

  CREATE TABLE IF NOT EXISTS products (
    slug        TEXT PRIMARY KEY,
    position    INTEGER NOT NULL DEFAULT 0,
    active      BOOLEAN NOT NULL DEFAULT true,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    data        JSONB NOT NULL
  );
  CREATE INDEX IF NOT EXISTS products_position_idx ON products (position);

  CREATE TABLE IF NOT EXISTS settings (
    key         TEXT PRIMARY KEY,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    value       JSONB NOT NULL
  );
`

/** Runs once per warm instance — CREATE TABLE IF NOT EXISTS is cheap and safe. */
async function ready() {
  if (!globalThis.__dussaSchema) {
    globalThis.__dussaSchema = query(SCHEMA).catch((error) => {
      // Let the next call retry rather than caching a failed migration.
      globalThis.__dussaSchema = null
      throw error
    })
  }
  return globalThis.__dussaSchema
}

/* ------------------------------------------------------------------ */
/* In-memory fallback                                                   */
/* ------------------------------------------------------------------ */

function memory() {
  if (!globalThis.__dussaMemory) {
    globalThis.__dussaMemory = { orders: new Map(), products: new Map(), settings: new Map() }
  }
  return globalThis.__dussaMemory
}

export const storageMode = () => (hasDatabase ? 'postgres' : 'memory')

/* ------------------------------------------------------------------ */
/* Orders                                                               */
/* ------------------------------------------------------------------ */

export async function saveOrder(order) {
  if (!hasDatabase) {
    memory().orders.set(order.code, order)
    return order
  }
  await ready()
  await query(
    `INSERT INTO orders (code, status, created_at, updated_at, data)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (code) DO UPDATE
       SET status = EXCLUDED.status,
           updated_at = EXCLUDED.updated_at,
           data = EXCLUDED.data`,
    [order.code, order.status, order.createdAt, order.updatedAt || order.createdAt, order],
  )
  return order
}

export async function getOrder(code) {
  if (!hasDatabase) return memory().orders.get(code) || null
  await ready()
  const rows = await query('SELECT data FROM orders WHERE code = $1', [code])
  return rows[0]?.data || null
}

export async function listOrders(limit = 300) {
  if (!hasDatabase) {
    return [...memory().orders.values()].sort((a, b) =>
      String(b.createdAt).localeCompare(String(a.createdAt)),
    )
  }
  await ready()
  const rows = await query(
    'SELECT data FROM orders ORDER BY created_at DESC LIMIT $1',
    [Math.min(1000, Math.max(1, limit))],
  )
  return rows.map((r) => r.data)
}

export async function deleteOrder(code) {
  if (!hasDatabase) return memory().orders.delete(code)
  await ready()
  await query('DELETE FROM orders WHERE code = $1', [code])
  return true
}

/* ------------------------------------------------------------------ */
/* Products                                                             */
/* ------------------------------------------------------------------ */

export async function listProducts({ includeInactive = false } = {}) {
  if (!hasDatabase) {
    return [...memory().products.values()]
      .filter((p) => includeInactive || p.active !== false)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  }
  await ready()
  const rows = await query(
    `SELECT slug, position, active, data FROM products
     ${includeInactive ? '' : 'WHERE active = true'}
     ORDER BY position ASC, slug ASC`,
  )
  return rows.map((r) => ({ ...r.data, slug: r.slug, position: r.position, active: r.active }))
}

export async function getProduct(slug) {
  if (!hasDatabase) return memory().products.get(slug) || null
  await ready()
  const rows = await query('SELECT slug, position, active, data FROM products WHERE slug = $1', [slug])
  if (!rows[0]) return null
  return { ...rows[0].data, slug: rows[0].slug, position: rows[0].position, active: rows[0].active }
}

export async function saveProduct(product) {
  const record = { ...product, updatedAt: new Date().toISOString() }
  if (!hasDatabase) {
    memory().products.set(record.slug, record)
    return record
  }
  await ready()
  await query(
    `INSERT INTO products (slug, position, active, updated_at, data)
     VALUES ($1, $2, $3, now(), $4)
     ON CONFLICT (slug) DO UPDATE
       SET position = EXCLUDED.position,
           active = EXCLUDED.active,
           updated_at = now(),
           data = EXCLUDED.data`,
    [record.slug, record.position ?? 0, record.active !== false, record],
  )
  return record
}

export async function deleteProduct(slug) {
  if (!hasDatabase) return memory().products.delete(slug)
  await ready()
  await query('DELETE FROM products WHERE slug = $1', [slug])
  return true
}

export async function countProducts() {
  if (!hasDatabase) return memory().products.size
  await ready()
  const rows = await query('SELECT count(*)::int AS n FROM products')
  return rows[0]?.n ?? 0
}

/* ------------------------------------------------------------------ */
/* Settings                                                             */
/* ------------------------------------------------------------------ */

export async function getSetting(key) {
  if (!hasDatabase) return memory().settings.get(key) ?? null
  await ready()
  const rows = await query('SELECT value FROM settings WHERE key = $1', [key])
  return rows[0]?.value ?? null
}

export async function saveSetting(key, value) {
  if (!hasDatabase) {
    memory().settings.set(key, value)
    return value
  }
  await ready()
  await query(
    `INSERT INTO settings (key, updated_at, value)
     VALUES ($1, now(), $2)
     ON CONFLICT (key) DO UPDATE SET updated_at = now(), value = EXCLUDED.value`,
    [key, JSON.stringify(value)],
  )
  return value
}

/** One round trip for a health check the dashboard can show plainly. */
export async function healthCheck() {
  if (!hasDatabase) {
    return { ok: false, mode: 'memory', reason: 'DATABASE_URL is not set' }
  }
  try {
    await ready()
    await query('SELECT 1')
    return { ok: true, mode: 'postgres' }
  } catch (error) {
    return { ok: false, mode: 'postgres', reason: error.message }
  }
}
