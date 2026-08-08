import { listOrders, saveOrder, storageMode } from './_lib/db.js'
import { notifyNewOrder, sendCustomerConfirmation } from './_lib/notify.js'
import { notifyOrderOnWhatsApp, sendCustomerOrderConfirmation } from './_lib/whatsapp.js'
import { emptyPayment } from './_lib/payment.js'
import {
  applyCors,
  adminConfigured,
  clean,
  isAdmin,
  normaliseCode,
  readBody,
  sendJson,
  toNumber,
} from './_lib/http.js'

const VALID_FULFILMENT = new Set(['delivery', 'pickup'])

function sanitiseItems(items) {
  if (!Array.isArray(items)) return []
  return items.slice(0, 40).map((item) => ({
    slug: clean(item.slug, 80),
    name: clean(item.name, 120),
    category: clean(item.category, 40),
    sizeId: clean(item.sizeId, 40),
    sizeLabel: clean(item.sizeLabel, 80),
    flavorId: clean(item.flavorId, 40),
    flavorLabel: clean(item.flavorLabel, 80),
    frostingId: clean(item.frostingId, 40),
    frostingLabel: clean(item.frostingLabel, 80),
    addonLabels: Array.isArray(item.addonLabels)
      ? item.addonLabels.slice(0, 12).map((a) => clean(a, 80))
      : [],
    message: clean(item.message, 120),
    brief: clean(item.brief, 1200),
    quantity: Math.min(999, Math.max(1, toNumber(item.quantity) || 1)),
    unitPrice: toNumber(item.unitPrice),
    linePrice: toNumber(item.linePrice),
    art: clean(item.art, 40),
    flavorArt: clean(item.flavorArt, 40),
  }))
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return

  /* ---------------------------------------------------------- list */
  if (req.method === 'GET') {
    if (!isAdmin(req)) {
      return sendJson(res, 401, { error: 'Invalid admin key' })
    }
    try {
      const orders = await listOrders(300)
      return sendJson(res, 200, {
        orders,
        storage: storageMode(),
        secured: adminConfigured(),
      })
    } catch (error) {
      return sendJson(res, 500, { error: error.message || 'Could not load orders' })
    }
  }

  /* -------------------------------------------------------- create */
  if (req.method === 'POST') {
    const body = readBody(req)
    const items = sanitiseItems(body.items)

    if (items.length === 0) {
      return sendJson(res, 400, { error: 'An order needs at least one item.' })
    }

    const name = clean(body.name, 120)
    const phone = clean(body.phone, 40)
    if (!name || !phone) {
      return sendJson(res, 400, { error: 'A name and phone number are required.' })
    }

    const code = normaliseCode(body.code) || `DBL-${Date.now().toString(36).toUpperCase().slice(-7)}`
    const now = new Date().toISOString()

    const order = {
      code,
      status: 'new',
      createdAt: now,
      updatedAt: now,
      name,
      phone,
      email: clean(body.email, 160),
      occasion: clean(body.occasion, 60),
      notes: clean(body.notes, 1200),
      fulfilment: VALID_FULFILMENT.has(body.fulfilment) ? body.fulfilment : 'delivery',
      date: clean(body.date, 20),
      time: clean(body.time, 40),
      zone: clean(body.zone, 120),
      address: clean(body.address, 400),
      items,
      subtotal: toNumber(body.subtotal),
      deliveryFee: toNumber(body.deliveryFee),
      total: toNumber(body.total),
      depositDue: toNumber(body.depositDue),
      // Opt-out, not opt-in: anything but an explicit false means we may send
      // WhatsApp updates to the number they just gave us.
      whatsappUpdates: body.whatsappUpdates !== false,
      payment: emptyPayment(),
    }

    try {
      await saveOrder(order)
    } catch (error) {
      return sendJson(res, 500, { error: error.message || 'Could not save the order' })
    }

    // Fire-and-forget: never let a slow inbox hold up the customer's response.
    // Failures are logged inside the mailer, never surfaced as a failed order.
    notifyNewOrder(order)
    sendCustomerConfirmation(order)
    notifyOrderOnWhatsApp(order)
    sendCustomerOrderConfirmation(order)

    return sendJson(res, 201, { order, storage: storageMode() })
  }

  res.setHeader('Allow', 'GET, POST, OPTIONS')
  return sendJson(res, 405, { error: 'Method not allowed' })
}
