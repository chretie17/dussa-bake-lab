import { CONTACT } from '../data/site'
import { money, prettyDate } from './format'

const LOCAL_ORDERS_KEY = 'dussa.orders.v1'
const ADMIN_KEY_STORE = 'dussa.adminKey.v1'

export const ORDER_STATUSES = [
  { id: 'new', label: 'New', hint: 'Received, awaiting confirmation', tone: 'gold' },
  { id: 'confirmed', label: 'Confirmed', hint: 'Quoted and locked into the schedule', tone: 'blue' },
  { id: 'baking', label: 'In the kitchen', hint: 'Being baked and decorated', tone: 'amber' },
  { id: 'ready', label: 'Ready', hint: 'Boxed and waiting for collection or dispatch', tone: 'green' },
  { id: 'completed', label: 'Completed', hint: 'Delivered or collected', tone: 'slate' },
  { id: 'cancelled', label: 'Cancelled', hint: 'Called off', tone: 'red' },
]

export function statusMeta(id) {
  return ORDER_STATUSES.find((s) => s.id === id) || ORDER_STATUSES[0]
}

/* ------------------------------------------------------------------ */
/* Local mirror                                                         */
/* ------------------------------------------------------------------ */

function readLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeLocal(orders) {
  try {
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders.slice(0, 200)))
  } catch {
    /* storage full or blocked — the order still reached the API */
  }
}

function upsertLocal(order) {
  const orders = readLocal().filter((o) => o.code !== order.code)
  orders.unshift(order)
  writeLocal(orders)
  return order
}

export function localOrders() {
  return readLocal()
}

/** Order codes are customer-facing, so keep them short and unambiguous. */
export function generateCode() {
  const alphabet = 'ACDEFHJKLMNPRTUVWXY3479'
  let tail = ''
  for (let i = 0; i < 4; i += 1) {
    tail += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  const stamp = Date.now().toString(36).slice(-3).toUpperCase()
  return `DBL-${stamp}${tail}`
}

/* ------------------------------------------------------------------ */
/* API                                                                  */
/* ------------------------------------------------------------------ */

async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    throw new Error('Unexpected response from the order service')
  }
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`)
  }
  return data
}

/**
 * Submits an order. The site is designed to stay usable even when the API is
 * unreachable (no deployment yet, offline, blocked network): the order is
 * always mirrored locally and the customer always gets a code plus a WhatsApp
 * hand-off, so nothing is silently lost.
 */
export async function createOrder(payload) {
  const draft = {
    ...payload,
    code: payload.code || generateCode(),
    status: 'new',
    createdAt: new Date().toISOString(),
  }

  try {
    const data = await request('/api/orders', {
      method: 'POST',
      body: JSON.stringify(draft),
    })
    const order = data?.order || draft
    upsertLocal(order)
    return { ok: true, offline: false, order }
  } catch (error) {
    upsertLocal({ ...draft, offline: true })
    return { ok: true, offline: true, order: { ...draft, offline: true }, error: error.message }
  }
}

export async function fetchOrder(code) {
  const clean = String(code || '').trim().toUpperCase()
  if (!clean) return null
  try {
    const data = await request(`/api/orders/${encodeURIComponent(clean)}`)
    if (data?.order) {
      upsertLocal(data.order)
      return data.order
    }
  } catch {
    /* fall through to the local mirror */
  }
  return readLocal().find((o) => o.code === clean) || null
}

export async function fetchOrders(adminKey) {
  const data = await request('/api/orders', {
    headers: { 'x-admin-key': adminKey || '' },
  })
  return data?.orders || []
}

export async function patchOrder(code, patch, adminKey) {
  const data = await request(`/api/orders/${encodeURIComponent(code)}`, {
    method: 'PATCH',
    headers: { 'x-admin-key': adminKey || '' },
    body: JSON.stringify(patch),
  })
  if (data?.order) upsertLocal(data.order)
  return data?.order
}

export function saveAdminKey(key) {
  try {
    sessionStorage.setItem(ADMIN_KEY_STORE, key)
  } catch {
    /* ignore */
  }
}

export function loadAdminKey() {
  try {
    return sessionStorage.getItem(ADMIN_KEY_STORE) || ''
  } catch {
    return ''
  }
}

export function clearAdminKey() {
  try {
    sessionStorage.removeItem(ADMIN_KEY_STORE)
  } catch {
    /* ignore */
  }
}

/* ------------------------------------------------------------------ */
/* Hand-off                                                             */
/* ------------------------------------------------------------------ */

/** Builds the pre-filled WhatsApp message the customer sends to the bakery. */
export function whatsappOrderLink(order) {
  const lines = [
    `Hello Dussa BakeLab! I've just placed order ${order.code} on your website.`,
    '',
    ...order.items.map(
      (i) =>
        `• ${i.quantity} × ${i.name}${i.sizeLabel ? ` (${i.sizeLabel})` : ''}${
          i.flavorLabel ? ` — ${i.flavorLabel}` : ''
        }`,
    ),
    '',
    `${order.fulfilment === 'delivery' ? 'Delivery' : 'Collection'}: ${prettyDate(order.date)}${
      order.time ? ` at ${order.time}` : ''
    }`,
    order.fulfilment === 'delivery' && order.address ? `Address: ${order.address}` : null,
    `Total: ${money(order.total)}`,
    '',
    `Name: ${order.name}`,
    `Phone: ${order.phone}`,
  ].filter(Boolean)

  return `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`
}

export function whatsappEnquiryLink(message) {
  const text = message || `Hello Dussa BakeLab! I'd like to ask about an order.`
  return `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`
}

/** Flattens orders to CSV for the admin export button. */
export function ordersToCsv(orders) {
  const header = [
    'Code',
    'Placed',
    'Status',
    'Customer',
    'Phone',
    'Email',
    'Fulfilment',
    'Date',
    'Time',
    'Address',
    'Occasion',
    'Items',
    'Subtotal',
    'Delivery',
    'Total',
    'Notes',
  ]
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const rows = orders.map((o) =>
    [
      o.code,
      o.createdAt,
      o.status,
      o.name,
      o.phone,
      o.email,
      o.fulfilment,
      o.date,
      o.time,
      o.address,
      o.occasion,
      (o.items || [])
        .map((i) => `${i.quantity}x ${i.name}${i.sizeLabel ? ` (${i.sizeLabel})` : ''}`)
        .join(' | '),
      o.subtotal,
      o.deliveryFee,
      o.total,
      o.notes,
    ]
      .map(escape)
      .join(','),
  )
  return [header.join(','), ...rows].join('\n')
}

/* ------------------------------------------------------------------ */
/* Admin: catalogue & settings                                          */
/* ------------------------------------------------------------------ */

export async function fetchAdminCatalog(adminKey) {
  return request('/api/catalog', { headers: { 'x-admin-key': adminKey || '' } })
}

export async function createProduct(product, adminKey) {
  const data = await request('/api/catalog', {
    method: 'POST',
    headers: { 'x-admin-key': adminKey || '' },
    body: JSON.stringify(product),
  })
  return data?.product
}

export async function updateProduct(slug, product, adminKey) {
  const data = await request(`/api/catalog/${encodeURIComponent(slug)}`, {
    method: 'PUT',
    headers: { 'x-admin-key': adminKey || '' },
    body: JSON.stringify(product),
  })
  return data?.product
}

export async function removeProduct(slug, adminKey) {
  return request(`/api/catalog/${encodeURIComponent(slug)}`, {
    method: 'DELETE',
    headers: { 'x-admin-key': adminKey || '' },
  })
}

export async function reorderProducts(order, adminKey) {
  const data = await request('/api/catalog', {
    method: 'POST',
    headers: { 'x-admin-key': adminKey || '' },
    body: JSON.stringify({ order }),
  })
  return data?.products || []
}

export async function fetchSettings() {
  const data = await request('/api/settings')
  return data?.settings
}

export async function updateSettings(settings, adminKey) {
  const data = await request('/api/settings', {
    method: 'PATCH',
    headers: { 'x-admin-key': adminKey || '' },
    body: JSON.stringify(settings),
  })
  return data?.settings
}

export async function fetchHealth() {
  return request('/api/health')
}

/** Asks Meta directly whether WhatsApp is really working. */
export async function checkWhatsApp(adminKey) {
  return request('/api/whatsapp-check', { headers: { 'x-admin-key': adminKey || '' } })
}

/** Sends one real message so the failure, if any, is Meta's own words. */
export async function sendWhatsAppTest(to, template, adminKey) {
  return request('/api/whatsapp-check', {
    method: 'POST',
    headers: { 'x-admin-key': adminKey || '' },
    body: JSON.stringify({ to, template }),
  })
}
