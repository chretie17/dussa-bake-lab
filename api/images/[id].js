import { getImage } from '../_lib/db.js'

/**
 * Serves an uploaded image. Public on purpose: these are product photos shown
 * on the storefront. Ids are random, and the filename carries the extension.
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
  // Ids never change once written, so this can be cached hard.
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')

  if (req.method === 'HEAD') {
    res.status(200).end()
    return
  }

  res.status(200).send(data)
}
