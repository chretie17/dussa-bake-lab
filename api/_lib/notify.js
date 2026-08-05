/**
 * Best-effort "a new order came in" notification.
 *
 * Sends an email through Resend when RESEND_API_KEY and ORDER_NOTIFY_EMAIL are
 * both configured. Any failure is swallowed on purpose — a notification problem
 * must never stop an order from being saved.
 */

function formatOrder(order) {
  const lines = (order.items || [])
    .map(
      (i) =>
        `<li>${i.quantity} × <strong>${i.name}</strong>${
          i.sizeLabel ? ` — ${i.sizeLabel}` : ''
        }${i.flavorLabel ? `, ${i.flavorLabel}` : ''}${
          i.addonLabels?.length ? `<br><small>+ ${i.addonLabels.join(', ')}</small>` : ''
        }${i.message ? `<br><small>Message: “${i.message}”</small>` : ''}</li>`,
    )
    .join('')

  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;color:#2A1810">
      <h2 style="margin:0 0 4px">New order ${order.code}</h2>
      <p style="margin:0 0 18px;color:#6B4429">
        ${order.fulfilment === 'delivery' ? 'Delivery' : 'Collection'} on
        <strong>${order.date}</strong> · ${order.time}
      </p>
      <ul style="padding-left:18px;line-height:1.6">${lines}</ul>
      <p style="line-height:1.7">
        <strong>${order.name}</strong><br>
        ${order.phone}${order.email ? ` · ${order.email}` : ''}<br>
        ${order.fulfilment === 'delivery' ? `${order.zone || ''} — ${order.address || ''}` : 'Collecting from the kitchen'}
      </p>
      ${order.occasion ? `<p>Occasion: ${order.occasion}</p>` : ''}
      ${order.notes ? `<p>Notes: ${order.notes}</p>` : ''}
      <p style="font-size:18px"><strong>Total: RWF ${Number(order.total || 0).toLocaleString()}</strong></p>
    </div>
  `
}

export async function notifyNewOrder(order) {
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.ORDER_NOTIFY_EMAIL
  if (!apiKey || !to) return

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.ORDER_NOTIFY_FROM || 'Dussa BakeLab <orders@resend.dev>',
        to: [to],
        subject: `New order ${order.code} — ${order.name}`,
        html: formatOrder(order),
      }),
    })
  } catch {
    /* notification is a nice-to-have; the order is already stored */
  }
}
