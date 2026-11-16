/**
 * Order emails, sent through Resend.
 *
 * Three messages:
 *   • the bakery is told a new order arrived
 *   • the customer gets a confirmation with their tracking code
 *   • the customer is told whenever the kitchen moves their order on
 *
 * Every send is best-effort and never throws: an email problem must not stop
 * an order being saved or a status being updated. Configure with RESEND_API_KEY
 * plus ORDER_NOTIFY_EMAIL; without them these functions quietly do nothing.
 */

const BRAND = {
  ink: '#2A1810',
  cocoa: '#43281A',
  caramel: '#B98A5E',
  gold: '#D4A574',
  cream: '#FAF3EA',
  paper: '#FFFDFA',
}

const STATUS_COPY = {
  confirmed: {
    subject: 'Your order is confirmed',
    heading: 'Your order is confirmed',
    body: 'We have confirmed your order and it is scheduled in the kitchen. Nothing more is needed from you for now.',
  },
  baking: {
    subject: 'Your order is in the kitchen',
    heading: 'We are baking',
    body: 'Your order is being baked and decorated today. We will let you know the moment it is boxed and ready.',
  },
  ready: {
    subject: 'Your order is ready',
    heading: 'Your order is ready',
    body: 'Your order is ready for your scheduled collection or delivery.',
  },
  completed: {
    subject: 'Thank you from Dussa BakeLab',
    heading: 'Enjoy every slice',
    body: 'Thank you for ordering from Dussa BakeLab. We hope you enjoy it and look forward to baking for you again.',
  },
  cancelled: {
    subject: 'Your order has been cancelled',
    heading: 'Order cancelled',
    body: 'This order has been cancelled. If that was not expected, reply to this email or message us on WhatsApp and we will put it right.',
  },
}

/** Statuses that are worth an email; `new` is covered by the confirmation. */
export const NOTIFIABLE_STATUSES = Object.keys(STATUS_COPY)

function money(value) {
  return `RWF ${Number(value || 0).toLocaleString('en-US')}`
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function prettyDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function itemRows(order) {
  return (order.items || [])
    .map((i) => {
      const options = [i.sizeLabel, i.flavorLabel, i.frostingLabel].filter(Boolean).join(' · ')
      const extras = i.addonLabels?.length ? `+ ${i.addonLabels.join(', ')}` : ''
      return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #EADCC7;">
            <div style="font-size:15px;color:${BRAND.ink};font-weight:600;">
              ${i.quantity} × ${escapeHtml(i.name)}
            </div>
            ${options ? `<div style="font-size:13px;color:#8A6B55;margin-top:3px;">${escapeHtml(options)}</div>` : ''}
            ${extras ? `<div style="font-size:12px;color:${BRAND.caramel};margin-top:3px;">${escapeHtml(extras)}</div>` : ''}
            ${i.message ? `<div style="font-size:12px;color:#8A6B55;margin-top:3px;font-style:italic;">Cake message: “${escapeHtml(i.message)}”</div>` : ''}
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #EADCC7;text-align:right;white-space:nowrap;font-size:15px;color:${BRAND.ink};">
            ${money(i.linePrice)}
          </td>
        </tr>`
    })
    .join('')
}

function layout({ preheader, heading, intro, code, bodyHtml, footerNote }) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:${BRAND.cream};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.cream};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${BRAND.paper};border-radius:20px;overflow:hidden;border:1px solid #EADCC7;">

            <tr>
              <td style="background:${BRAND.ink};padding:32px 32px 28px;text-align:center;">
                <div style="font-size:26px;color:${BRAND.cream};letter-spacing:-0.5px;font-weight:600;">Dussa BakeLab</div>
                <div style="font-size:11px;color:${BRAND.gold};letter-spacing:4px;margin-top:6px;">KIGALI · RWANDA</div>
              </td>
            </tr>

            <tr>
              <td style="padding:34px 32px 8px;">
                <h1 style="margin:0;font-size:24px;line-height:1.25;color:${BRAND.ink};font-weight:600;">${escapeHtml(heading)}</h1>
                <p style="margin:14px 0 0;font-size:15px;line-height:1.65;color:#6B5344;">${intro}</p>
              </td>
            </tr>

            ${
              code
                ? `<tr>
                    <td style="padding:24px 32px 0;">
                      <div style="background:${BRAND.cream};border:1px solid #EADCC7;border-radius:14px;padding:18px;text-align:center;">
                        <div style="font-size:11px;letter-spacing:3px;color:#9A8371;">ORDER CODE</div>
                        <div style="font-size:26px;letter-spacing:3px;color:${BRAND.cocoa};font-weight:700;margin-top:6px;">${escapeHtml(code)}</div>
                      </div>
                    </td>
                  </tr>`
                : ''
            }

            <tr><td style="padding:8px 32px 0;">${bodyHtml}</td></tr>

            <tr>
              <td style="padding:28px 32px 34px;">
                <div style="border-top:1px solid #EADCC7;padding-top:20px;font-size:13px;line-height:1.7;color:#8A6B55;">
                  ${footerNote}
                </div>
                <div style="margin-top:18px;font-size:12px;color:#A08D7D;">
                  Dussa BakeLab · Kigali, Rwanda · 0788 722 064<br>
                  <span style="color:${BRAND.caramel};">Made with the finest ingredients, baked to be loved.</span>
                </div>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function orderSummaryHtml(order) {
  const fulfilment = order.fulfilment === 'delivery' ? 'Delivery' : 'Collection'
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:22px;">
      ${itemRows(order)}
      <tr>
        <td style="padding:12px 0 0;font-size:14px;color:#8A6B55;">Subtotal</td>
        <td style="padding:12px 0 0;text-align:right;font-size:14px;color:${BRAND.ink};">${money(order.subtotal)}</td>
      </tr>
      <tr>
        <td style="padding:4px 0 0;font-size:14px;color:#8A6B55;">${fulfilment}</td>
        <td style="padding:4px 0 0;text-align:right;font-size:14px;color:${BRAND.ink};">${order.deliveryFee ? money(order.deliveryFee) : 'Free'}</td>
      </tr>
      <tr>
        <td style="padding:10px 0 0;font-size:16px;font-weight:700;color:${BRAND.ink};">Total</td>
        <td style="padding:10px 0 0;text-align:right;font-size:19px;font-weight:700;color:${BRAND.ink};">${money(order.total)}</td>
      </tr>
      ${
        order.depositDue
          ? `<tr>
              <td style="padding:6px 0 0;font-size:13px;color:${BRAND.caramel};">Deposit to confirm</td>
              <td style="padding:6px 0 0;text-align:right;font-size:13px;color:${BRAND.caramel};">${money(order.depositDue)}</td>
            </tr>`
          : ''
      }
    </table>

    <div style="margin-top:24px;background:${BRAND.cream};border-radius:14px;padding:18px;font-size:14px;line-height:1.8;color:#6B5344;">
      <strong style="color:${BRAND.ink};">${fulfilment}</strong><br>
      ${escapeHtml(prettyDate(order.date))} · ${escapeHtml(order.time || '')}
      ${order.fulfilment === 'delivery' && order.address ? `<br>${escapeHtml(order.address)}${order.zone ? ` — ${escapeHtml(order.zone)}` : ''}` : ''}
    </div>`
}

/* ------------------------------------------------------------------ */
/* Transport                                                            */
/* ------------------------------------------------------------------ */

async function send({ to, subject, html, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || !to) return { sent: false, reason: 'not configured' }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.ORDER_NOTIFY_FROM || 'Dussa BakeLab <orders@resend.dev>',
        to: [to],
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    })
    if (!res.ok) {
      const detail = await res.text()
      console.error('[email] Resend rejected the message:', res.status, detail.slice(0, 300))
      return { sent: false, reason: `resend ${res.status}` }
    }
    return { sent: true }
  } catch (error) {
    console.error('[email] could not reach Resend:', error.message)
    return { sent: false, reason: error.message }
  }
}

/* ------------------------------------------------------------------ */
/* Messages                                                             */
/* ------------------------------------------------------------------ */

/** Tells the bakery an order came in. */
export async function notifyNewOrder(order) {
  const to = process.env.ORDER_NOTIFY_EMAIL
  if (!to) return { sent: false, reason: 'ORDER_NOTIFY_EMAIL not set' }

  const html = layout({
    preheader: `${order.name} · ${money(order.total)} · ${prettyDate(order.date)}`,
    heading: `New order from ${order.name}`,
    intro: `A new order has been placed on the website. Open your dashboard to review and confirm it.`,
    code: order.code,
    bodyHtml: `
      ${orderSummaryHtml(order)}
      <div style="margin-top:22px;background:${BRAND.cream};border-radius:14px;padding:18px;font-size:14px;line-height:1.8;color:#6B5344;">
        <strong style="color:${BRAND.ink};">Customer</strong><br>
        ${escapeHtml(order.name)}<br>
        ${escapeHtml(order.phone)}${order.email ? `<br>${escapeHtml(order.email)}` : ''}
        ${order.occasion ? `<br>Occasion: ${escapeHtml(order.occasion)}` : ''}
      </div>
      ${
        order.notes
          ? `<div style="margin-top:14px;border-left:3px solid ${BRAND.gold};padding:4px 0 4px 14px;font-size:14px;line-height:1.7;color:#6B5344;">
              <strong style="color:${BRAND.ink};">Notes:</strong> ${escapeHtml(order.notes)}
            </div>`
          : ''
      }`,
    footerNote: 'Open your kitchen dashboard to confirm this order and move it through the schedule.',
  })

  return send({
    to,
    subject: `New order ${order.code} — ${order.name} — ${money(order.total)}`,
    html,
    replyTo: order.email || undefined,
  })
}

/** Confirms to the customer that we have their order. */
export async function sendCustomerConfirmation(order) {
  if (!order.email) return { sent: false, reason: 'customer left no email' }

  const html = layout({
    preheader: `Order ${order.code} received — ${prettyDate(order.date)}`,
    heading: `Thank you, ${escapeHtml(String(order.name || '').split(' ')[0] || 'friend')}`,
    intro:
      'We have your order and it is now with our kitchen. We will confirm the details shortly — keep the code below to track it at any time.',
    code: order.code,
    bodyHtml: orderSummaryHtml(order),
    footerNote:
      'Nothing has been charged. We will arrange payment with you directly by MTN Mobile Money, Airtel Money, bank transfer or cash. Need to change something? Reply to this email or message us on WhatsApp at least 48 hours before your date.',
  })

  return send({
    to: order.email,
    subject: `Order ${order.code} received — Dussa BakeLab`,
    html,
    replyTo: process.env.ORDER_NOTIFY_EMAIL || undefined,
  })
}

/** Tells the customer the kitchen moved their order on. */
export async function sendStatusUpdate(order) {
  if (!order.email) return { sent: false, reason: 'customer left no email' }

  const copy = STATUS_COPY[order.status]
  if (!copy) return { sent: false, reason: `no email defined for "${order.status}"` }

  const html = layout({
    preheader: `${copy.subject} — ${order.code}`,
    heading: copy.heading,
    intro: copy.body,
    code: order.code,
    bodyHtml:
      order.status === 'cancelled'
        ? ''
        : `<div style="margin-top:22px;background:${BRAND.cream};border-radius:14px;padding:18px;font-size:14px;line-height:1.8;color:#6B5344;">
            <strong style="color:${BRAND.ink};">${order.fulfilment === 'delivery' ? 'Delivery' : 'Collection'}</strong><br>
            ${escapeHtml(prettyDate(order.date))} · ${escapeHtml(order.time || '')}
            ${order.fulfilment === 'delivery' && order.address ? `<br>${escapeHtml(order.address)}` : ''}
          </div>`,
    footerNote:
      'Questions about this order? Reply to this email or message us on WhatsApp — quote your order code and we will find it straight away.',
  })

  return send({
    to: order.email,
    subject: `${copy.subject} — ${order.code}`,
    html,
    replyTo: process.env.ORDER_NOTIFY_EMAIL || undefined,
  })
}

/**
 * Tells the bakery a customer says they have paid.
 *
 * The screenshot is not attached — it sits behind the dashboard key rather
 * than in an inbox — so this points at the order instead.
 */
export async function notifyPaymentClaim(order, { withProof, reference } = {}) {
  const to = process.env.ORDER_NOTIFY_EMAIL
  if (!to) return { sent: false, reason: 'ORDER_NOTIFY_EMAIL not set' }

  const html = layout({
    preheader: `${order.name} says they paid ${money(order.total)} for ${order.code}`,
    heading: `${escapeHtml(order.name)} reports a payment`,
    intro:
      'A customer has messaged on WhatsApp to say they have paid. The order status will stay the same until you verify that the payment has arrived.',
    code: order.code,
    bodyHtml: `
      <div style="margin-top:22px;background:${BRAND.cream};border-radius:14px;padding:18px;font-size:14px;line-height:1.8;color:#6B5344;">
        <strong style="color:${BRAND.ink};">Amount due</strong><br>
        ${money(order.total)}${order.depositDue ? ` &nbsp;·&nbsp; deposit ${money(order.depositDue)}` : ''}<br><br>
        <strong style="color:${BRAND.ink};">Customer</strong><br>
        ${escapeHtml(order.name)}<br>${escapeHtml(order.phone)}
      </div>
      ${
        reference
          ? `<div style="margin-top:14px;border-left:3px solid ${BRAND.gold};padding:4px 0 4px 14px;font-size:14px;line-height:1.7;color:#6B5344;">
              <strong style="color:${BRAND.ink};">Their message:</strong> ${escapeHtml(String(reference).slice(0, 300))}
            </div>`
          : ''
      }
      <div style="margin-top:18px;font-size:14px;line-height:1.7;color:#6B5344;">
        ${
          withProof
            ? 'A screenshot came with it. Open the order in your dashboard to see it.'
            : 'No screenshot was attached.'
        }
      </div>`,
    footerNote:
      'Check it against your Mobile Money statement. When the money is there, mark the payment verified in your dashboard — that confirms the order and tells the customer.',
  })

  return send({
    to,
    subject: `Payment reported — ${order.code} — ${money(order.total)}`,
    html,
  })
}

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.ORDER_NOTIFY_EMAIL)
}
