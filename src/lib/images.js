/**
 * Photo handling for the dashboard.
 *
 * Phones shoot 4–8 MB files. We shrink and re-compress in the browser before
 * anything is uploaded, so a photo straight off a camera roll lands at a few
 * hundred kilobytes and the site stays fast on Kigali mobile data.
 */

const MAX_EDGE = 1600
const QUALITY = 0.85
export const ACCEPTED = 'image/jpeg,image/png,image/webp,image/gif'

export function formatBytes(bytes) {
  const n = Number(bytes) || 0
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('That file could not be read.'))
    reader.readAsDataURL(file)
  })
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('That file is not an image we can read.'))
    img.src = dataUrl
  })
}

/** WebP saves roughly a third over JPEG; fall back where it is unsupported. */
function bestFormat() {
  try {
    const probe = document.createElement('canvas')
    probe.width = 1
    probe.height = 1
    return probe.toDataURL('image/webp').startsWith('data:image/webp')
      ? 'image/webp'
      : 'image/jpeg'
  } catch {
    return 'image/jpeg'
  }
}

/**
 * Returns { dataUrl, width, height, bytes, filename } ready to upload.
 * GIFs pass through untouched so animation survives.
 */
export async function prepareImage(file) {
  if (!file) throw new Error('No file chosen.')
  if (!file.type.startsWith('image/')) {
    throw new Error('That is not an image. Choose a JPG, PNG, WebP or GIF.')
  }

  const original = await readAsDataUrl(file)

  if (file.type === 'image/gif') {
    if (file.size > 4 * 1024 * 1024) {
      throw new Error('That GIF is too large. Try one under 4 MB.')
    }
    return {
      dataUrl: original,
      width: 0,
      height: 0,
      bytes: file.size,
      filename: file.name,
    }
  }

  const img = await loadImage(original)
  const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height))
  const width = Math.round(img.width * scale)
  const height = Math.round(img.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, width, height)

  const mime = bestFormat()
  const dataUrl = canvas.toDataURL(mime, QUALITY)

  // Rough byte count from the base64 payload, close enough for a size label.
  const bytes = Math.round((dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75)

  return {
    dataUrl,
    width,
    height,
    bytes,
    filename: file.name.replace(/\.[^.]+$/, '') + (mime === 'image/webp' ? '.webp' : '.jpg'),
  }
}

/* ------------------------------------------------------------------ */
/* API                                                                  */
/* ------------------------------------------------------------------ */

async function call(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    throw new Error('The image service sent something unexpected.')
  }
  if (!res.ok) throw new Error(data?.error || `Upload failed (${res.status})`)
  return data
}

export async function uploadImage(file, adminKey, alt = '') {
  const prepared = await prepareImage(file)
  const data = await call('/api/images', {
    method: 'POST',
    headers: { 'x-admin-key': adminKey || '' },
    body: JSON.stringify({ ...prepared, alt }),
  })
  return data.image
}

export async function listImages(adminKey) {
  const data = await call('/api/images', { headers: { 'x-admin-key': adminKey || '' } })
  return data.images || []
}

export async function deleteImage(id, adminKey) {
  return call('/api/images', {
    method: 'DELETE',
    headers: { 'x-admin-key': adminKey || '' },
    body: JSON.stringify({ id }),
  })
}
