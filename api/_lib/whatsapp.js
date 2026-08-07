/**
 * WhatsApp Cloud API.
 *
 * Two jobs:
 *   • push every new order to the bakery's WhatsApp the moment it is placed
 *   • let the bakery reply with a short command to move an order along
 *
 * Set WHATSAPP_TOKEN, WHATSAPP_PHONE_ID and WHATSAPP_TO to switch it on. With
 * those unset nothing here runs and the rest of the site is unaffected.
 *
 * One rule worth knowing: Meta only lets you send a plain text message inside
 * 24 hours of the other person's last message. Because the bakery replies to
 * these notifications, that window normally stays open by itself. If it does
 * close, Meta rejects the send with error 131047 and we log exactly that, along
 * with what to do about it. Set WHATSAPP_TEMPLATE to an approved template name
 * to send through the window instead.
 */

const GRAPH = 'https://graph.facebook.com/v21.0'

export function whatsappConfigured() {
  return Boolean(
    process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID && process.env.WHATSAPP_TO,
  )
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
