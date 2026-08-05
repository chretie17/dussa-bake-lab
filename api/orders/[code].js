import { getOrder, saveOrder } from '../_lib/store.js'
import {
  applyCors,
  clean,
  isAdmin,
  normaliseCode,
  readBody,
  sendJson,
} from '../_lib/http.js'

const VALID_STATUSES = new Set([
  'new',
  'confirmed',
  'baking',
  'ready',
  'completed',
  'cancelled',
])

export default async function handler(req, res) {
  if (applyCors(req, res)) return

  const code = normaliseCode(req.query?.code)
  if (!code) {
    return sendJson(res, 400, { error: 'That order code is not valid.' })
  }

  let order
  try {
    order = await getOrder(code)
  } catch (error) {
    return sendJson(res, 500, { error: error.message || 'Could not read that order' })
  }

  if (!order) {
    return sendJson(res, 404, { error: 'No order found with that code.' })
  }

  /* ------------------------------------------------------------ read */
  if (req.method === 'GET') {
    // The code itself is the credential, so only expose what the customer
    // needs to track the order — never the whole record.
    return sendJson(res, 200, {
      order: {
        code: order.code,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        name: order.name,
        fulfilment: order.fulfilment,
        date: order.date,
        time: order.time,
        items: order.items,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        total: order.total,
        depositDue: order.depositDue,
        occasion: order.occasion,
      },
    })
  }

  /* ---------------------------------------------------------- update */
  if (req.method === 'PATCH') {
    if (!isAdmin(req)) {
      return sendJson(res, 401, { error: 'Invalid admin key' })
    }

    const body = readBody(req)
    const next = { ...order, updatedAt: new Date().toISOString() }

    if (body.status) {
      if (!VALID_STATUSES.has(body.status)) {
        return sendJson(res, 400, { error: 'Unknown status' })
      }
      next.status = body.status
    }

    if (typeof body.kitchenNote === 'string') {
      next.kitchenNote = clean(body.kitchenNote, 800)
    }

    try {
      await saveOrder(next)
    } catch (error) {
      return sendJson(res, 500, { error: error.message || 'Could not update that order' })
    }

    return sendJson(res, 200, { order: next })
  }

  res.setHeader('Allow', 'GET, PATCH, OPTIONS')
  return sendJson(res, 405, { error: 'Method not allowed' })
}
