import { countImages, deleteImage, listImages, saveImage, storageMode } from './_lib/db.js'
import { applyCors, clean, isAdmin, sendJson } from './_lib/http.js'

/** What a browser can safely display, and what we are willing to store. */
const ALLOWED = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

/** After the browser has resized it, a photo this large means something is off. */
const MAX_BYTES = 4 * 1024 * 1024

function makeId(mime) {
  const stamp = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 8)
  return `${stamp}${rand}.${ALLOWED[mime] || 'jpg'}`
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return

  if (!isAdmin(req)) {
    return sendJson(res, 401, { error: 'Invalid admin key' })
  }

  /* ------------------------------------------------------------ list */
  if (req.method === 'GET') {
    try {
      const images = await listImages(300)
      return sendJson(res, 200, { images, count: images.length, storage: storageMode() })
    } catch (error) {
      return sendJson(res, 500, { error: error.message || 'Could not load your images' })
    }
  }

  /* ---------------------------------------------------------- upload */
  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? safeParse(req.body) : req.body || {}
    const dataUrl = String(body.dataUrl || '')

    const match = dataUrl.match(/^data:([a-z/+-]+);base64,(.+)$/i)
    if (!match) {
      return sendJson(res, 400, { error: 'That file could not be read as an image.' })
    }

    const [, mime, base64] = match
    if (!ALLOWED[mime]) {
      return sendJson(res, 400, {
        error: 'Use a JPG, PNG, WebP or GIF. Other formats will not display on the site.',
      })
    }

    const data = Buffer.from(base64, 'base64')
    if (data.length === 0) {
      return sendJson(res, 400, { error: 'That file came through empty.' })
    }
    if (data.length > MAX_BYTES) {
      return sendJson(res, 413, {
        error: 'That image is too large even after resizing. Try a smaller photo.',
      })
    }

    const image = {
      id: makeId(mime),
      filename: clean(body.filename, 160),
      alt: clean(body.alt, 200),
      mime,
      bytes: data.length,
      width: Number(body.width) || 0,
      height: Number(body.height) || 0,
      data,
    }

    try {
      const saved = await saveImage(image)
      return sendJson(res, 201, { image: saved })
    } catch (error) {
      return sendJson(res, 500, { error: error.message || 'Could not save that image' })
    }
  }

  /* ---------------------------------------------------------- delete */
  if (req.method === 'DELETE') {
    const body = typeof req.body === 'string' ? safeParse(req.body) : req.body || {}
    const id = clean(body.id || req.query?.id, 120)
    if (!id) return sendJson(res, 400, { error: 'Which image should be removed?' })

    try {
      await deleteImage(id)
      return sendJson(res, 200, { deleted: id, remaining: await countImages() })
    } catch (error) {
      return sendJson(res, 500, { error: error.message || 'Could not delete that image' })
    }
  }

  res.setHeader('Allow', 'GET, POST, DELETE, OPTIONS')
  return sendJson(res, 405, { error: 'Method not allowed' })
}

function safeParse(text) {
  try {
    return JSON.parse(text)
  } catch {
    return {}
  }
}
