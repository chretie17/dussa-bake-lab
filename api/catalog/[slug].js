import { deleteProduct, getProduct, saveProduct } from '../_lib/db.js'
import { factoryProduct } from '../_lib/seed.js'
import { sanitiseProduct, slugify } from '../_lib/product.js'
import { applyCors, isAdmin, readBody, sendJson } from '../_lib/http.js'

export default async function handler(req, res) {
  if (applyCors(req, res)) return

  const slug = slugify(req.query?.slug)
  if (!slug) return sendJson(res, 400, { error: 'That product reference is not valid.' })

  /* ----------------------------------------------------------- read */
  if (req.method === 'GET') {
    try {
      const product = await getProduct(slug)
      if (!product) return sendJson(res, 404, { error: 'No product with that reference.' })
      return sendJson(res, 200, { product })
    } catch (error) {
      return sendJson(res, 500, { error: error.message || 'Could not load that product' })
    }
  }

  if (!isAdmin(req)) return sendJson(res, 401, { error: 'Invalid admin key' })

  /* --------------------------------------------------------- update */
  if (req.method === 'PUT' || req.method === 'PATCH') {
    const body = readBody(req)

    let existing
    try {
      existing = await getProduct(slug)
    } catch (error) {
      return sendJson(res, 500, { error: error.message || 'Could not read that product' })
    }
    if (!existing) return sendJson(res, 404, { error: 'No product with that reference.' })

    // PATCH merges, PUT replaces — either way the whole record is revalidated
    // so a partial edit can never write an unrenderable product.
    const merged = req.method === 'PATCH' ? { ...existing, ...body } : body
    const { product, error } = sanitiseProduct({ ...merged, slug: body.slug || slug })
    if (error) return sendJson(res, 400, { error })

    try {
      // Renaming the slug moves the row rather than leaving an orphan behind.
      if (product.slug !== slug) await deleteProduct(slug)
      await saveProduct({ ...product, position: product.position ?? existing.position ?? 0 })
      return sendJson(res, 200, { product })
    } catch (dbError) {
      return sendJson(res, 500, { error: dbError.message || 'Could not save the product' })
    }
  }

  /* --------------------------------------------------------- delete */
  if (req.method === 'DELETE') {
    try {
      const existing = await getProduct(slug)
      if (!existing) return sendJson(res, 404, { error: 'No product with that reference.' })
      await deleteProduct(slug)
      return sendJson(res, 200, { deleted: slug, restorable: Boolean(factoryProduct(slug)) })
    } catch (error) {
      return sendJson(res, 500, { error: error.message || 'Could not delete the product' })
    }
  }

  res.setHeader('Allow', 'GET, PUT, PATCH, DELETE, OPTIONS')
  return sendJson(res, 405, { error: 'Method not allowed' })
}
