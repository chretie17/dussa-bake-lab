import { applyCors, isAdmin, readBody, sendJson } from './_lib/http.js'
import { toInternational } from './_lib/whatsapp.js'

/**
 * WhatsApp doctor.
 *
 * "Everything is set but nothing arrives" is almost never a code problem, and
 * the server log only sees the failures that reach it. This asks Meta directly:
 * is the token alive, is the number connected, do the templates exist under
 * those exact names and languages, and do they take the number of parameters we
 * send. Then it offers to send one real message and shows precisely what came
 * back.
 *
 * Admin only, and it never returns the token.
 */

const GRAPH = 'https://graph.facebook.com/v21.0'

/** Meta's rejection codes, in the words someone can act on. */
const ADVICE = {
  131047:
    'The 24-hour window is shut and this went as plain text. Expected for a template-less send; not a problem for order messages, which use a template.',
  131030:
    'This number is not on your allowed list. A Meta test number can only message numbers you add under API Setup → "To". Add it there, or connect your real business number.',
  132000: 'The template takes a different number of {{n}} than we sent. The check above says how many.',
  132001: 'No approved template with that name and language. The check above lists what does exist.',
  190: 'The token has expired. Temporary tokens last 24 hours — generate a permanent system user token.',
  100: 'Usually a wrong phone number id, or a template name with a typo.',
  368: 'The number is temporarily blocked by Meta for policy reasons.',
  130429: 'You are sending faster than your tier allows. Wait and try again.',
}

/** What each template is expected to take, and in what order. */
const EXPECTED = {
  customer: {
    env: 'WHATSAPP_CUSTOMER_TEMPLATE',
    count: 7,
    order: 'name, order code, Delivery/Collection, date, time, total, Mobile Money number',
    sample: ['Keza', 'DBL-CHECK1', 'Delivery', 'Sat, 22 Aug', '14:00 - 16:00', 'RWF 68,000', '+250 788 722 064'],
  },
  status: {
    env: 'WHATSAPP_STATUS_TEMPLATE',
    count: 6,
    order: 'name, order code, status sentence, Delivery/Collection, date, time',
    sample: [
      'Keza',
      'DBL-CHECK1',
      'Your order is confirmed and booked into the kitchen.',
      'Delivery',
      'Sat, 22 Aug',
      '14:00 - 16:00',
    ],
  },
}

async function graph(path, token) {
  const res = await fetch(`${GRAPH}/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const body = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, body }
}

/** How many {{n}} a template body actually uses. */
function countParameters(template) {
  const body = (template.components || []).find((c) => c.type === 'BODY')
  const text = body?.text || ''
  const found = text.match(/\{\{(\d+)\}\}/g) || []
  const indexes = found.map((m) => Number(m.replace(/\D/g, '')))
  return indexes.length ? Math.max(...indexes) : 0
}

async function diagnose() {
  const token = process.env.WHATSAPP_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_ID
  const wabaId = process.env.WHATSAPP_WABA_ID
  const lang = process.env.WHATSAPP_TEMPLATE_LANG || 'en'
  const checks = []

  const missing = [
    !token && 'WHATSAPP_TOKEN',
    !phoneId && 'WHATSAPP_PHONE_ID',
    !process.env.WHATSAPP_TO && 'WHATSAPP_TO',
  ].filter(Boolean)

  checks.push({
    id: 'env',
    label: 'Settings present',
    ok: missing.length === 0,
    detail: missing.length
      ? `Still missing: ${missing.join(', ')}. Add them in Vercel and redeploy — a variable added without a redeploy does not reach the running site.`
      : 'Token, phone number id and your own number are all set.',
  })

  if (!token || !phoneId) {
    return { checks, canTest: false }
  }

  /* ---------------------------------------------------- token + number */
  const phone = await graph(
    `${phoneId}?fields=display_phone_number,verified_name,quality_rating,code_verification_status,platform_type`,
    token,
  )

  if (!phone.ok) {
    const code = phone.body?.error?.code
    checks.push({
      id: 'token',
      label: 'Access token',
      ok: false,
      detail:
        code === 190
          ? 'Meta rejected the token. The temporary token on the app dashboard expires 24 hours after it is generated — this is the single most common reason messages stop arriving. Generate a permanent one: Business Settings → Users → System users → add a system user, give it the WhatsApp Business Messaging permission, then generate a token with no expiry.'
          : `Meta refused the request: ${phone.body?.error?.message || phone.status}. Check WHATSAPP_PHONE_ID is the Phone number ID from the API Setup page, not the phone number itself.`,
    })
    return { checks, canTest: false }
  }

  checks.push({
    id: 'token',
    label: 'Access token',
    ok: true,
    detail: 'Accepted by Meta.',
  })

  checks.push({
    id: 'number',
    label: 'Sending number',
    ok: true,
    detail: `${phone.body.verified_name || 'Unnamed'} · ${phone.body.display_phone_number || phoneId}${
      phone.body.quality_rating ? ` · quality ${phone.body.quality_rating}` : ''
    }.`,
  })

  /* --------------------------------------------------------- templates */
  if (!wabaId) {
    checks.push({
      id: 'templates',
      label: 'Templates',
      ok: false,
      detail:
        'Set WHATSAPP_WABA_ID to your WhatsApp Business Account ID and this will check both templates for you — the name, the language and whether they take the number of parameters we send. You will find the ID on the API Setup page, above the phone number id.',
    })
  } else {
    const list = await graph(`${wabaId}/message_templates?limit=200`, token)
    if (!list.ok) {
      checks.push({
        id: 'templates',
        label: 'Templates',
        ok: false,
        detail: `Could not read your templates: ${list.body?.error?.message || list.status}. Check WHATSAPP_WABA_ID.`,
      })
    } else {
      const all = list.body?.data || []
      for (const [key, want] of Object.entries(EXPECTED)) {
        const name = process.env[want.env]
        if (!name) {
          checks.push({
            id: `template-${key}`,
            label: want.env,
            ok: false,
            detail: 'Not set, so this message falls back to plain text and only arrives inside the 24-hour window.',
          })
          continue
        }

        const matches = all.filter((t) => t.name === name)
        if (matches.length === 0) {
          checks.push({
            id: `template-${key}`,
            label: name,
            ok: false,
            detail: `No template with that name. Names on this account: ${all.map((t) => t.name).join(', ') || 'none'}.`,
          })
          continue
        }

        const byLang = matches.find((t) => t.language === lang)
        if (!byLang) {
          checks.push({
            id: `template-${key}`,
            label: name,
            ok: false,
            detail: `Exists, but not in language "${lang}" — it is ${matches
              .map((t) => `"${t.language}"`)
              .join(', ')}. Set WHATSAPP_TEMPLATE_LANG to match exactly; "en" and "en_US" are different templates to Meta.`,
          })
          continue
        }

        const found = countParameters(byLang)
        const approved = byLang.status === 'APPROVED'
        const rightCount = found === want.count

        checks.push({
          id: `template-${key}`,
          label: name,
          ok: approved && rightCount,
          detail: !approved
            ? `Status is ${byLang.status}, not APPROVED, so Meta will not send it.`
            : rightCount
              ? `Approved, language "${byLang.language}", takes ${found} parameters — matches what we send (${want.order}).`
              : `Approved, but its body uses ${found} parameters and we send ${want.count}. Meta rejects the whole message when those differ. Either edit the template body to use {{1}}–{{${want.count}}} in this order — ${want.order} — or tell me the wording you want and I will change the code to match.`,
        })
      }
    }
  }

  return { checks, canTest: true }
}

/** Sends one real message and hands back exactly what Meta said. */
async function testSend(to, which) {
  const token = process.env.WHATSAPP_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_ID
  const number = toInternational(to)

  if (!/^2507[2389]\d{7}$/.test(number)) {
    return { ok: false, error: `"${to}" is not a Rwandan mobile number.` }
  }

  const want = EXPECTED[which]
  const name = want ? process.env[want.env] : ''

  const payload =
    want && name
      ? {
          messaging_product: 'whatsapp',
          to: number,
          type: 'template',
          template: {
            name,
            language: { code: process.env.WHATSAPP_TEMPLATE_LANG || 'en' },
            components: [
              {
                type: 'body',
                parameters: want.sample.map((text) => ({ type: 'text', text })),
              },
            ],
          },
        }
      : {
          messaging_product: 'whatsapp',
          to: number,
          type: 'text',
          text: {
            preview_url: false,
            body: 'Test from your Dussa BakeLab dashboard. If you can read this, plain messages work.',
          },
        }

  const res = await fetch(`${GRAPH}/${phoneId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const body = await res.json().catch(() => ({}))

  if (res.ok) {
    return {
      ok: true,
      to: number,
      messageId: body?.messages?.[0]?.id || '',
      note: 'Meta accepted it. If it still does not appear on the phone, the number is almost certainly not on the allowed list of your test number — a test number can only message recipients you have added under API Setup.',
    }
  }

  const code = body?.error?.code
  return {
    ok: false,
    code,
    error: body?.error?.message || `HTTP ${res.status}`,
    detail: body?.error?.error_data?.details || '',
    advice: ADVICE[code] || 'See the message above — it is Meta\'s own wording.',
  }
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return

  if (!isAdmin(req)) {
    return sendJson(res, 401, { error: 'Invalid admin key' })
  }

  if (req.method === 'GET') {
    try {
      return sendJson(res, 200, await diagnose())
    } catch (error) {
      return sendJson(res, 200, {
        checks: [
          {
            id: 'error',
            label: 'Could not reach Meta',
            ok: false,
            detail: error.message || 'The request to graph.facebook.com failed.',
          },
        ],
        canTest: false,
      })
    }
  }

  if (req.method === 'POST') {
    const body = readBody(req)
    try {
      return sendJson(res, 200, await testSend(body.to, body.template))
    } catch (error) {
      return sendJson(res, 200, { ok: false, error: error.message || 'The send failed.' })
    }
  }

  res.setHeader('Allow', 'GET, POST, OPTIONS')
  return sendJson(res, 405, { error: 'Method not allowed' })
}
