import crypto from 'node:crypto'
import { getOrder, listOrders, saveImage, saveOrder } from './_lib/db.js'
import { notifyPaymentClaim, sendStatusUpdate } from './_lib/notify.js'
import { claimPayment, looksLikePaymentClaim, newProofId } from './_lib/payment.js'
import {
  HELP_TEXT,
  fetchMedia,
  isAuthorisedSender,
  notifyPaymentOnWhatsApp,
  parseCommand,
  sendCustomerStatusUpdate,
  sendPaymentAcknowledgement,
  sendWhatsApp,
  summariseList,
  summariseOrder,
  toInternational,
  customerWhatsappConfigured,
} from './_lib/whatsapp.js'

/**
 * Webhook for WhatsApp.
 *
 * Meta calls GET once to verify the URL, then POSTs here whenever a message
 * arrives. The bakery can text short commands ("confirm DBL-K2XMQ4A", "today")
 * and this moves the order, which is what makes the orders manageable from the
 * phone rather than only from the dashboard.
 *
 * Point Meta at https://yourdomain.com/api/whatsapp and use the same string for
 * the verify token as WHATSAPP_VERIFY_TOKEN.
 */

const DAY = 86400000
const iso = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10)

/** Meta signs every POST; without a matching signature we do not act on it. */
function signatureValid(req, raw) {
  const secret = process.env.WHATSAPP_APP_SECRET
  if (!secret) return true // not configured: fall back to the sender check alone

  const header = req.headers['x-hub-signature-256']
  if (typeof header !== 'string' || !header.startsWith('sha256=')) return false

  const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex')
  const given = header.slice(7)
  if (given.length !== expected.length) return false
  return crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected))
}

async function handleCommand(text, from) {
  const command = parseCommand(text)

  if (command.kind === 'help' || command.kind === 'unknown') {
    return HELP_TEXT
  }

  if (command.kind === 'needs-code') {
    return `Which order? Send it like *${text.trim().split(/\s+/)[0]} DBL-K2XMQ4A*.`
  }

  if (command.kind === 'today' || command.kind === 'tomorrow') {
    const when = command.kind === 'today' ? iso(new Date()) : iso(new Date(Date.now() + DAY))
    const orders = (await listOrders(300)).filter(
      (o) => o.date === when && !['completed', 'cancelled'].includes(o.status),
    )
    return summariseList(orders, `*Due ${command.kind}*`)
  }

  if (command.kind === 'new') {
    const orders = (await listOrders(300)).filter((o) => o.status === 'new')
    return summariseList(orders, '*Waiting for you*')
  }

  const order = await getOrder(command.code)
  if (!order) return `No order here under ${command.code}.`

  if (command.kind === 'lookup') return summariseOrder(order)

  if (order.status === command.status) {
    return `${order.code} is already *${command.status}*.`
  }

  const next = { ...order, status: command.status, updatedAt: new Date().toISOString() }
  await saveOrder(next)

  // The customer hears about it the same way they would from the dashboard —
  // by email, and on their own WhatsApp.
  sendStatusUpdate(next)
  sendCustomerStatusUpdate(next)

  console.log(`[whatsapp] ${from} moved ${order.code} to ${command.status}`)
  return `✅ ${order.code} is now *${command.status}*.\n\n${summariseOrder(next)}`
}

/* ------------------------------------------------------------------ */
/* Customers                                                            */
/* ------------------------------------------------------------------ */

/** The order a customer's message is about: their newest one still in play. */
async function orderForCustomer(from) {
  const sender = toInternational(from)
  if (!sender) return null

  const orders = await listOrders(300)
  return (
    orders
      .filter((o) => toInternational(o.phone) === sender)
      .filter((o) => !['cancelled', 'completed'].includes(o.status))
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))[0] || null
  )
}

/**
 * A customer telling us they have paid.
 *
 * This records a claim and nothing more. Anyone can type "PAID", so the order
 * itself does not move until the bakery has looked at the money and verified
 * it — from the dashboard, or by replying `confirm DBL-XXXXXXX`.
 */
async function handlePaymentClaim(message, order) {
  const isImage = message.type === 'image'
  const reference =
    message.type === 'text' ? message.text?.body : message.image?.caption || 'Sent a screenshot'

  let proofImageId = order.payment?.proofImageId || null

  if (isImage && message.image?.id) {
    const media = await fetchMedia(message.image.id)
    if (media) {
      const id = newProofId(media.mime)
      try {
        await saveImage({
          id,
          filename: `payment-${order.code}`,
          alt: `Payment proof for ${order.code}`,
          mime: media.mime,
          bytes: media.bytes,
          width: 0,
          height: 0,
          data: media.data,
        })
        proofImageId = id
      } catch (error) {
        console.error('[whatsapp] could not store the payment screenshot:', error.message)
      }
    }
  }

  const next = {
    ...order,
    payment: claimPayment(order.payment, { reference, proofImageId }),
    updatedAt: new Date().toISOString(),
  }
  await saveOrder(next)

  // The bakery hears about it both ways; neither is allowed to hold up the reply.
  notifyPaymentOnWhatsApp(next, { withProof: Boolean(proofImageId), reference })
  notifyPaymentClaim(next, { withProof: Boolean(proofImageId), reference })

  console.log(
    `[whatsapp] ${order.code}: payment reported by the customer${proofImageId ? ' with a screenshot' : ''}`,
  )
  return next
}

/**
 * Anything sent by someone who is not the bakery. We only act on payment
 * messages — replying to every "hello" with a menu would be worse than silence,
 * and the bakery sees the conversation in WhatsApp either way.
 */
async function handleCustomerMessage(message, from) {
  const text = message.type === 'text' ? message.text?.body : message.image?.caption
  const isImage = message.type === 'image'

  if (!isImage && !looksLikePaymentClaim(text)) return null

  const order = await orderForCustomer(from)
  if (!order) {
    // Only worth answering if they were clearly talking about money.
    return isImage || looksLikePaymentClaim(text)
      ? 'Thank you. We could not find an open order under this number, so we cannot match this payment yet — please reply with your order code (it looks like DBL-K2XMQ4A) and we will sort it out.'
      : null
  }

  const next = await handlePaymentClaim(message, order)
  await sendPaymentAcknowledgement(next, Boolean(next.payment?.proofImageId))
  return null // the acknowledgement above is the reply
}

export default async function handler(req, res) {
  /* ------------------------------------------------------- verify */
  if (req.method === 'GET') {
    const mode = req.query?.['hub.mode']
    const token = req.query?.['hub.verify_token']
    const challenge = req.query?.['hub.challenge']

    if (mode === 'subscribe' && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      res.status(200).send(String(challenge))
      return
    }
    res.status(403).send('Verification failed')
    return
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    res.status(405).end()
    return
  }

  /* ------------------------------------------------------ receive */
  const raw =
    typeof req.body === 'string' ? req.body : JSON.stringify(req.body === undefined ? {} : req.body)

  if (!signatureValid(req, raw)) {
    console.warn('[whatsapp] rejected a webhook with a bad signature')
    res.status(401).end()
    return
  }

  // Meta retries anything that is not acknowledged quickly, so reply first and
  // do the work afterwards.
  res.status(200).send('ok')

  // Token and phone id are enough to read what came in. WHATSAPP_TO only
  // decides who gets *told*, and a missing one must not make us drop a
  // customer's payment message on the floor.
  if (!customerWhatsappConfigured()) return

  let body = {}
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
  } catch {
    return
  }

  try {
    const messages =
      body?.entry?.[0]?.changes?.[0]?.value?.messages ||
      body?.entry?.flatMap?.((e) => e.changes?.flatMap?.((c) => c.value?.messages || []) || []) ||
      []

    for (const message of messages) {
      if (message.type !== 'text' && message.type !== 'image') continue

      const from = message.from

      // The bakery drives the dashboard by message; everyone else can only
      // report a payment against their own order.
      const reply = isAuthorisedSender(from)
        ? message.type === 'text'
          ? await handleCommand(message.text?.body, from)
          : null
        : await handleCustomerMessage(message, from)

      if (reply) await sendWhatsApp(from, reply)
    }
  } catch (error) {
    console.error('[whatsapp] webhook handling failed:', error.message)
  }
}
