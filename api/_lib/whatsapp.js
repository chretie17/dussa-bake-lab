/**
 * WhatsApp Cloud API.
 *
 * Three jobs:
 *   • push every new order to the bakery's WhatsApp the moment it is placed
 *   • let the bakery reply with a short command to move an order along
 *   • send the customer their own confirmation and every status change after it
 *
 * Set WHATSAPP_TOKEN, WHATSAPP_PHONE_ID and WHATSAPP_TO to switch it on. With
 * those unset nothing here runs and the rest of the site is unaffected.
 *
 * One rule shapes all of this. Meta only lets you send a plain text message
 * inside 24 hours of the other person's last message. The bakery keeps its own
 * window open by replying to notifications, but a customer who has just ordered
 * on the website has never messaged us, so their first message *must* go
 * through a template Meta has approved. Set WHATSAPP_CUSTOMER_TEMPLATE and
 * WHATSAPP_STATUS_TEMPLATE to those template names — README has the exact text
 * to submit. Without them we still try plain text, which only lands for a
 * customer who happens to have messaged the bakery recently.
 */

const GRAPH = 'https://graph.facebook.com/v21.0'

export function whatsappConfigured() {
  return Boolean(
    process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID && process.env.WHATSAPP_TO,
  )
}

/** Messaging customers needs no WHATSAPP_TO — that number is the bakery's own. */
export function customerWhatsappConfigured() {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID)
}

/** Are the approved customer templates in place, or are we on the fallback? */
export function customerTemplatesConfigured() {
  return Boolean(process.env.WHATSAPP_CUSTOMER_TEMPLATE && process.env.WHATSAPP_STATUS_TEMPLATE)
}

/**
 * Local Rwandan formats to the 2507xxxxxxxx that the Cloud API expects:
 * 0788722064, 788722064, 250788722064 and +250 788 722 064 all land the same.
 */
export function toInternational(phone) {
  const digits = String(phone || '').replace(/[^\d]/g, '')
  if (!digits) return ''
  if (digits.startsWith('250')) return digits
  if (digits.startsWith('0')) return `250${digits.slice(1)}`
  return `250${digits}`
}

/**
 * Meta rejects a template parameter containing a newline, a tab, or four or
 * more spaces in a row. Everything we pass in comes from a customer-typed form,
 * so squash all of that before it reaches the API.
 */
export function cleanParam(value, fallback = '—') {
  const text = String(value ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
  return (text || fallback).slice(0, 900)
}

function money(value) {
  return `RWF ${Number(value || 0).toLocaleString('en-US')}`
}

function prettyDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

/* ------------------------------------------------------------------ */
/* Sending                                                              */
/* ------------------------------------------------------------------ */

async function post(payload) {
  const res = await fetch(`${GRAPH}/${process.env.WHATSAPP_PHONE_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messaging_product: 'whatsapp', ...payload }),
  })

  const body = await res.json().catch(() => ({}))

  if (!res.ok) {
    const code = body?.error?.code
    if (code === 131047) {
      console.error(
        '[whatsapp] The 24-hour window is closed, so a plain message was refused. ' +
          'Send any WhatsApp message to your business number to reopen it, or set ' +
          'WHATSAPP_TEMPLATE to an approved template name.',
      )
    } else {
      console.error('[whatsapp] send failed:', res.status, JSON.stringify(body?.error || body))
    }
    return { sent: false, code, error: body?.error?.message || `HTTP ${res.status}` }
  }

  return { sent: true, id: body?.messages?.[0]?.id }
}

/** Plain text to a number, or an approved template when one is configured. */
export async function sendWhatsApp(to, text) {
  if (!whatsappConfigured()) return { sent: false, reason: 'not configured' }

  const template = process.env.WHATSAPP_TEMPLATE
  if (template) {
    return post({
      to,
      type: 'template',
      template: {
        name: template,
        language: { code: process.env.WHATSAPP_TEMPLATE_LANG || 'en' },
        components: [{ type: 'body', parameters: [{ type: 'text', text: text.slice(0, 1024) }] }],
      },
    })
  }

  return post({ to, type: 'text', text: { preview_url: false, body: text.slice(0, 4000) } })
}

/** Sends a named approved template with positional {{1}}, {{2}}… parameters. */
export async function sendTemplate(to, name, params = []) {
  return post({
    to,
    type: 'template',
    template: {
      name,
      language: { code: process.env.WHATSAPP_TEMPLATE_LANG || 'en' },
      components: params.length
        ? [
            {
              type: 'body',
              parameters: params.map((p) => ({ type: 'text', text: cleanParam(p) })),
            },
          ]
        : [],
    },
  })
}

/* ------------------------------------------------------------------ */
/* Messages                                                             */
/* ------------------------------------------------------------------ */

export function formatOrder(order) {
  const lines = [
    `🎂 *New order ${order.code}*`,
    '',
    ...(order.items || []).map((i) => {
      const bits = [i.sizeLabel, i.flavorLabel, i.frostingLabel].filter(Boolean).join(', ')
      let line = `• ${i.quantity} × ${i.name}`
      if (bits) line += `\n   ${bits}`
      if (i.addonLabels?.length) line += `\n   + ${i.addonLabels.join(', ')}`
      if (i.message) line += `\n   Pipe: "${i.message}"`
      return line
    }),
    '',
    `${order.fulfilment === 'delivery' ? '🚚 Delivery' : '🏠 Collection'}: ${prettyDate(order.date)} · ${order.time || ''}`,
    order.fulfilment === 'delivery' && order.address ? `📍 ${order.address}` : null,
    '',
    `👤 ${order.name}`,
    `📞 ${order.phone}`,
    order.email ? `✉️ ${order.email}` : null,
    order.occasion ? `🎉 ${order.occasion}` : null,
    order.notes ? `📝 ${order.notes}` : null,
    '',
    `*Total: ${money(order.total)}*`,
    order.depositDue ? `Deposit to confirm: ${money(order.depositDue)}` : null,
    '',
    `Reply *confirm ${order.code}* to accept it, or send *help* for the other commands.`,
  ]
  return lines.filter((l) => l !== null).join('\n')
}

/** Fires when an order comes in. Never throws. */
export async function notifyOrderOnWhatsApp(order) {
  if (!whatsappConfigured()) return { sent: false, reason: 'not configured' }
  try {
    return await sendWhatsApp(process.env.WHATSAPP_TO, formatOrder(order))
  } catch (error) {
    console.error('[whatsapp] could not reach the API:', error.message)
    return { sent: false, error: error.message }
  }
}

/* ------------------------------------------------------------------ */
/* Messages to the customer                                             */
/* ------------------------------------------------------------------ */

/**
 * One short sentence per status, written to read well on a phone. These are
 * passed into the status template as {{3}}, so they must stay single-line.
 */
export const CUSTOMER_STATUS_LINES = {
  confirmed: 'Your order is confirmed and booked into the kitchen. Nothing more is needed from you for now.',
  baking: 'Your order is being baked and decorated today. We will message again once it is boxed.',
  ready: 'Your order is finished, boxed and chilled. See you at your slot.',
  completed: 'Your order is complete. Thank you for letting us bake for you — enjoy every slice.',
  cancelled: 'Your order has been cancelled. If that was not expected, reply to this message and we will put it right.',
}

/** Statuses the customer hears about on WhatsApp. */
export const CUSTOMER_NOTIFIABLE_STATUSES = Object.keys(CUSTOMER_STATUS_LINES)

function firstName(order) {
  return String(order.name || '').trim().split(/\s+/)[0] || 'there'
}

function fulfilmentWord(order) {
  return order.fulfilment === 'delivery' ? 'Delivery' : 'Collection'
}

/**
 * Decides whether we may message this customer at all, and on what number.
 * Returns `{ ok: false, reason }` so callers can log a straight answer.
 */
function customerTarget(order) {
  if (!customerWhatsappConfigured()) return { ok: false, reason: 'not configured' }
  if (order?.whatsappUpdates === false) return { ok: false, reason: 'customer opted out' }

  const to = toInternational(order?.phone)
  if (!/^2507[2389]\d{7}$/.test(to)) {
    return { ok: false, reason: `"${order?.phone || ''}" is not a Rwandan mobile number` }
  }
  return { ok: true, to }
}

/** What the customer reads when we fall back to a plain message. */
export function formatCustomerConfirmation(order) {
  return [
    `Hi ${firstName(order)}, thank you — Dussa BakeLab has your order.`,
    '',
    `Order code: ${order.code}`,
    `${fulfilmentWord(order)}: ${prettyDate(order.date)}${order.time ? `, ${order.time}` : ''}`,
    `Total: ${money(order.total)}`,
    order.depositDue ? `Deposit to confirm: ${money(order.depositDue)}` : null,
    '',
    'We will message you here each time your order moves along. Nothing has been charged yet — we will arrange payment with you directly.',
  ]
    .filter((l) => l !== null)
    .join('\n')
}

export function formatCustomerStatus(order) {
  const line = CUSTOMER_STATUS_LINES[order.status]
  return [
    `Hi ${firstName(order)} — an update on order ${order.code}.`,
    '',
    line,
    order.status === 'cancelled'
      ? null
      : `${fulfilmentWord(order)}: ${prettyDate(order.date)}${order.time ? `, ${order.time}` : ''}`,
    '',
    'Dussa BakeLab · Kigali',
  ]
    .filter((l) => l !== null)
    .join('\n')
}

async function sendToCustomer(order, { template, params, fallbackText, label }) {
  const target = customerTarget(order)
  if (!target.ok) {
    console.log(`[whatsapp] no ${label} for ${order?.code}: ${target.reason}`)
    return { sent: false, reason: target.reason }
  }

  try {
    if (template) {
      const result = await sendTemplate(target.to, template, params)
      if (result.sent) return result
      // A template that has not been approved yet should not silently lose the
      // message — try plain text, which lands if the window happens to be open.
      console.warn(`[whatsapp] template "${template}" failed, trying plain text instead`)
    } else {
      console.warn(
        `[whatsapp] no customer template configured, so the ${label} goes as plain text — ` +
          'it will only arrive if this customer messaged you in the last 24 hours.',
      )
    }
    // Deliberately not sendWhatsApp(): that one falls back to the bakery's own
    // WHATSAPP_TEMPLATE, which is the wrong message to put in front of a customer.
    return await post({
      to: target.to,
      type: 'text',
      text: { preview_url: false, body: fallbackText.slice(0, 4000) },
    })
  } catch (error) {
    console.error(`[whatsapp] could not send the ${label}:`, error.message)
    return { sent: false, error: error.message }
  }
}

/** Confirms the order to the customer, the moment it is placed. */
export async function sendCustomerOrderConfirmation(order) {
  return sendToCustomer(order, {
    label: 'order confirmation',
    template: process.env.WHATSAPP_CUSTOMER_TEMPLATE || '',
    params: [
      firstName(order),
      order.code,
      fulfilmentWord(order),
      prettyDate(order.date),
      order.time || 'to be agreed',
      money(order.total),
    ],
    fallbackText: formatCustomerConfirmation(order),
  })
}

/** Tells the customer their order has moved on. */
export async function sendCustomerStatusUpdate(order) {
  const line = CUSTOMER_STATUS_LINES[order?.status]
  if (!line) {
    return { sent: false, reason: `no customer message for "${order?.status}"` }
  }

  return sendToCustomer(order, {
    label: `${order.status} update`,
    template: process.env.WHATSAPP_STATUS_TEMPLATE || '',
    params: [
      firstName(order),
      order.code,
      line,
      fulfilmentWord(order),
      prettyDate(order.date),
      order.time || 'to be agreed',
    ],
    fallbackText: formatCustomerStatus(order),
  })
}

/* ------------------------------------------------------------------ */
/* Receiving                                                            */
/* ------------------------------------------------------------------ */

export const COMMANDS = {
  confirm: 'confirmed',
  accept: 'confirmed',
  baking: 'baking',
  bake: 'baking',
  start: 'baking',
  ready: 'ready',
  done: 'completed',
  complete: 'completed',
  delivered: 'completed',
  cancel: 'cancelled',
}

export const HELP_TEXT = [
  '*Dussa BakeLab commands*',
  '',
  '*today* — what is due today',
  '*tomorrow* — what is due tomorrow',
  '*new* — orders waiting for you',
  '*DBL-XXXXXXX* — show that order',
  '',
  'To move an order along:',
  '*confirm DBL-XXXXXXX*',
  '*baking DBL-XXXXXXX*',
  '*ready DBL-XXXXXXX*',
  '*done DBL-XXXXXXX*',
  '*cancel DBL-XXXXXXX*',
].join('\n')

/**
 * Works out what the bakery asked for. Returns
 * `{ kind, status?, code? }`, where kind is one of:
 * help, status, lookup, today, tomorrow, new, unknown.
 */
export function parseCommand(raw) {
  const text = String(raw || '').trim()
  if (!text) return { kind: 'unknown' }

  const lower = text.toLowerCase()
  const code = (text.toUpperCase().match(/DBL-[A-Z0-9]{4,12}/) || [])[0] || null

  if (/^(help|menu|commands|\?)$/.test(lower)) return { kind: 'help' }
  if (/^today\b/.test(lower)) return { kind: 'today' }
  if (/^tomorrow\b/.test(lower)) return { kind: 'tomorrow' }
  if (/^(new|pending|waiting)\b/.test(lower)) return { kind: 'new' }

  const word = lower.split(/\s+/)[0]
  if (COMMANDS[word]) {
    if (!code) return { kind: 'needs-code', status: COMMANDS[word] }
    return { kind: 'status', status: COMMANDS[word], code }
  }

  if (code) return { kind: 'lookup', code }
  return { kind: 'unknown' }
}

export function summariseOrder(order) {
  const items = (order.items || [])
    .map((i) => `${i.quantity}× ${i.name}${i.sizeLabel ? ` (${i.sizeLabel})` : ''}`)
    .join(', ')
  return [
    `*${order.code}* — ${order.status}`,
    `${order.name} · ${order.phone}`,
    `${order.fulfilment === 'delivery' ? 'Delivery' : 'Collection'} ${prettyDate(order.date)} ${order.time || ''}`,
    items,
    `*${money(order.total)}*`,
  ].join('\n')
}

export function summariseList(orders, heading) {
  if (orders.length === 0) return `${heading}\n\nNothing.`
  return [
    heading,
    '',
    ...orders.map(
      (o) =>
        `*${o.code}* ${o.name} · ${o.time || ''} · ${money(o.total)} · _${o.status}_`,
    ),
  ].join('\n')
}

/** Only the bakery's own number may drive the dashboard by message. */
export function isAuthorisedSender(from) {
  const allowed = String(process.env.WHATSAPP_TO || '').replace(/[^\d]/g, '')
  const extra = String(process.env.WHATSAPP_ADMINS || '')
    .split(',')
    .map((n) => n.replace(/[^\d]/g, ''))
    .filter(Boolean)
  const sender = String(from || '').replace(/[^\d]/g, '')
  return sender === allowed || extra.includes(sender)
}
