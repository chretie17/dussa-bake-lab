import { countProducts, healthCheck, listOrders } from './_lib/db.js'
import { emailConfigured } from './_lib/notify.js'
import {
  customerTemplatesConfigured,
  customerWhatsappConfigured,
  whatsappConfigured,
} from './_lib/whatsapp.js'
import { adminConfigured, applyCors, sendJson } from './_lib/http.js'

/**
 * Plain-language setup check, surfaced in the admin dashboard.
 * Deliberately reveals no order data — only whether each piece is configured.
 */
export default async function handler(req, res) {
  if (applyCors(req, res)) return

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS')
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  const db = await healthCheck()

  let orderCount = null
  let productCount = null
  if (db.ok) {
    try {
      orderCount = (await listOrders(1000)).length
      productCount = await countProducts()
    } catch {
      /* counts are a nicety; the health verdict above already stands */
    }
  }

  const checks = [
    {
      id: 'database',
      label: 'Database',
      ok: db.ok,
      detail: db.ok
        ? `Connected. ${orderCount ?? 0} orders, ${productCount ?? 0} products stored.`
        : db.reason === 'DATABASE_URL is not set'
          ? 'No DATABASE_URL is set, so orders are held in memory and disappear when the server sleeps. This is why the dashboard can look empty.'
          : `Could not reach the database: ${db.reason}`,
    },
    {
      id: 'admin',
      label: 'Dashboard key',
      ok: adminConfigured(),
      detail: adminConfigured()
        ? 'ADMIN_KEY is set — the dashboard is protected.'
        : 'ADMIN_KEY is not set, so anyone with the link can open this dashboard.',
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      ok: whatsappConfigured(),
      detail: whatsappConfigured()
        ? 'New orders are sent to your WhatsApp, and you can reply with commands to move them along.'
        : 'Set WHATSAPP_TOKEN, WHATSAPP_PHONE_ID and WHATSAPP_TO to get orders on WhatsApp.',
    },
    {
      id: 'whatsapp-customer',
      label: 'Customer WhatsApp updates',
      ok: customerWhatsappConfigured() && customerTemplatesConfigured(),
      detail: !customerWhatsappConfigured()
        ? 'Set up WhatsApp above first, then customers can be messaged too.'
        : customerTemplatesConfigured()
          ? `Customers get a WhatsApp confirmation when they order, and a message every time you move the order along. Using "${process.env.WHATSAPP_CUSTOMER_TEMPLATE}" (6 parameters, language "${process.env.WHATSAPP_CUSTOMER_TEMPLATE_LANG || 'en'}") and "${process.env.WHATSAPP_STATUS_TEMPLATE}" (4 parameters, language "${process.env.WHATSAPP_STATUS_TEMPLATE_LANG || 'en'}"). These have to match your approved templates exactly.`
          : 'Meta only lets us message a customer out of the blue through an approved template. Create the two templates in Meta Business Manager (the README has the exact text), then set WHATSAPP_CUSTOMER_TEMPLATE and WHATSAPP_STATUS_TEMPLATE. Until then customer messages only land if that person happened to message you in the last 24 hours.',
    },
    {
      id: 'email',
      label: 'Email notifications',
      ok: emailConfigured(),
      detail: emailConfigured()
        ? 'New orders are emailed to you, and customers get a confirmation.'
        : 'Set RESEND_API_KEY and ORDER_NOTIFY_EMAIL to be emailed when orders arrive.',
    },
  ]

  return sendJson(res, 200, { ok: checks.every((c) => c.ok), checks })
}
