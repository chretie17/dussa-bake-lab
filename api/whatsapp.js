import crypto from 'node:crypto'
import { getOrder, listOrders, saveOrder } from './_lib/db.js'
import { sendStatusUpdate } from './_lib/notify.js'
import {
  HELP_TEXT,
  isAuthorisedSender,
  parseCommand,
  sendCustomerStatusUpdate,
  sendWhatsApp,
  summariseList,
  summariseOrder,
  whatsappConfigured,
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

  if (!whatsappConfigured()) return

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
      if (message.type !== 'text') continue

      const from = message.from
      if (!isAuthorisedSender(from)) {
        console.log(`[whatsapp] ignoring a message from ${from} (not an admin number)`)
        continue
      }

      const reply = await handleCommand(message.text?.body, from)
      if (reply) await sendWhatsApp(from, reply)
    }
  } catch (error) {
    console.error('[whatsapp] webhook handling failed:', error.message)
  }
}
