import { getImage } from '../_lib/db.js'
import { isProofId } from '../_lib/payment.js'

/**
 * Serves an uploaded image. Public on purpose: these are product photos shown
 * on the storefront. Ids are random, and the filename carries the extension.
 *
 * Payment screenshots are the exception. They carry someone's phone number and
 * how much they paid, so they need the dashboard key — accepted in the query
 * string as well as the header, because an <img> tag cannot send one.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD')
    res.status(405).end()
    return
  }

  const id = String(req.query?.id || '').trim()
  if (!id || !/^[a-z0-9.]+$/i.test(id)) {
    res.status(400).end()
    return
  }

  if (isProofId(id)) {
    const expected = process.env.ADMIN_KEY
    const given = req.headers['x-admin-key'] || req.query?.key
    if (expected && given !== expected) {
      res.status(401).end()
      return
    }
  }

  let row
  try {
    row = await getImage(id)
  } catch {
    res.status(500).end()
    return
  }

  if (!row) {
    res.status(404).end()
    return
  }

  const data = Buffer.isBuffer(row.data) ? row.data : Buffer.from(row.data)

  res.setHeader('Content-Type', row.mime)
  res.setHeader('Content-Length', String(data.length))
  // Ids never change once written, so this can be cached hard — except for a
  // payment screenshot, which should not sit in a shared cache at all.
  res.setHeader(
    'Cache-Control',
    isProofId(id) ? 'private, no-store' : 'public, max-age=31536000, immutable',
  )

  if (req.method === 'HEAD') {
    res.status(200).end()
    return
  }

  res.status(200).send(data)
}
