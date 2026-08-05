import { listProducts, saveProduct, storageMode, healthCheck } from './_lib/db.js'
import { seedIfEmpty, defaultSettings, SETTINGS_KEY } from './_lib/seed.js'
import { getSetting } from './_lib/db.js'
import { sanitiseProduct } from './_lib/product.js'
import { applyCors, adminConfigured, isAdmin, readBody, sendJson } from './_lib/http.js'

export default async function handler(req, res) {
  if (applyCors(req, res)) return

  /* ------------------------------------------------------- read menu */
  if (req.method === 'GET') {
    // Only a request that actually presents a key sees hidden products —
    // otherwise an unset ADMIN_KEY would leak drafts onto the storefront.
    const admin = Boolean(req.headers['x-admin-key']) && isAdmin(req)

    try {
      await seedIfEmpty()
      const [products, settings] = await Promise.all([
        listProducts({ includeInactive: Boolean(admin) }),
        getSetting(SETTINGS_KEY),
      ])

      return sendJson(res, 200, {
        products,
        settings: settings || defaultSettings(),
        storage: storageMode(),
        secured: adminConfigured(),
      })
    } catch (error) {
      // The storefront falls back to its bundled menu, so answer with the
      // reason rather than a 500 that looks like the site is broken.
      return sendJson(res, 200, {
        products: [],
        settings: null,
        storage: storageMode(),
        error: error.message || 'Could not load the menu',
      })
    }
  }

  /* ---------------------------------------------------- create/reorder */
  if (req.method === 'POST') {
    if (!isAdmin(req)) return sendJson(res, 401, { error: 'Invalid admin key' })

    const body = readBody(req)

    // Reorder: [{ slug, position }, ...]
    if (Array.isArray(body.order)) {
      try {
        const current = await listProducts({ includeInactive: true })
        const byslug = new Map(current.map((p) => [p.slug, p]))
        for (const entry of body.order.slice(0, 200)) {
          const product = byslug.get(entry.slug)
          if (product) await saveProduct({ ...product, position: Number(entry.position) || 0 })
        }
        return sendJson(res, 200, { products: await listProducts({ includeInactive: true }) })
      } catch (error) {
        return sendJson(res, 500, { error: error.message || 'Could not reorder the menu' })
      }
    }

    const { product, error } = sanitiseProduct(body)
    if (error) return sendJson(res, 400, { error })

    try {
      await seedIfEmpty()
      await saveProduct(product)
      return sendJson(res, 201, { product })
    } catch (dbError) {
      return sendJson(res, 500, { error: dbError.message || 'Could not save the product' })
    }
  }

  /* ------------------------------------------------------ diagnostics */
  if (req.method === 'HEAD') {
    const health = await healthCheck()
    res.status(health.ok ? 200 : 503).end()
    return
  }

  res.setHeader('Allow', 'GET, POST, OPTIONS')
  return sendJson(res, 405, { error: 'Method not allowed' })
}
