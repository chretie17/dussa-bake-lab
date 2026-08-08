import { readFileSync } from 'node:fs'
import ordersHandler from '../api/orders.js'
import orderHandler from '../api/orders/[code].js'

function mockRes() {
  const res = {
    headers: {},
    statusCode: 0,
    body: '',
    setHeader(k, v) {
      this.headers[k] = v
    },
    status(code) {
      this.statusCode = code
      return this
    },
    send(body) {
      this.body = body
      return this
    },
    end() {
      return this
    },
  }
  return res
}

const call = async (handler, req) => {
  const res = mockRes()
  await handler(req, res)
  return { status: res.statusCode, json: res.body ? JSON.parse(res.body) : null }
}

let failures = 0
const check = (label, cond, extra = '') => {
  // A thunk is allowed so a multi-line assertion reads well at the call site.
  const ok = typeof cond === 'function' ? cond() : cond
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : ` :: ${extra}`}`)
  if (!ok) failures += 1
}

// --- create ---------------------------------------------------------------
const payload = {
  code: 'DBL-TESTA1',
  name: 'Keza Uwase',
  phone: '0788722064',
  email: 'keza@example.com',
  fulfilment: 'delivery',
  date: '2026-09-01',
  time: '13:00 – 15:00',
  zone: 'Kimihurura · Kacyiru · Remera',
  address: 'KG 11 Ave, Ikaze House',
  occasion: 'Birthday',
  notes: 'No nuts please',
  items: [
    {
      slug: 'signature-chocolate-drip',
      name: 'Signature Chocolate Drip',
      category: 'cakes',
      sizeLabel: '8" round',
      flavorLabel: 'Belgian chocolate',
      quantity: 2,
      unitPrice: 42000,
      linePrice: 84000,
      art: 'dripCake',
      flavorArt: 'chocolate',
    },
  ],
  subtotal: 84000,
  deliveryFee: 0,
  total: 84000,
}

const created = await call(ordersHandler, { method: 'POST', headers: {}, body: payload })
check('POST /api/orders creates an order', created.status === 201, JSON.stringify(created.json))
check('order keeps its code', created.json?.order?.code === 'DBL-TESTA1')
check('order starts as new', created.json?.order?.status === 'new')
check('items are sanitised through', created.json?.order?.items?.length === 1)

// --- validation -----------------------------------------------------------
const noItems = await call(ordersHandler, {
  method: 'POST',
  headers: {},
  body: { ...payload, code: 'DBL-TESTB2', items: [] },
})
check('POST rejects an empty basket', noItems.status === 400)

const noName = await call(ordersHandler, {
  method: 'POST',
  headers: {},
  body: { ...payload, code: 'DBL-TESTC3', name: '', phone: '' },
})
check('POST rejects a missing contact', noName.status === 400)

// --- read -----------------------------------------------------------------
const read = await call(orderHandler, {
  method: 'GET',
  headers: {},
  query: { code: 'dbl-testa1' },
})
check('GET /api/orders/:code is case-insensitive', read.status === 200)
check('GET returns the tracking view', read.json?.order?.total === 84000)
check('GET withholds the address from the public view', read.json?.order?.address === undefined)

const missing = await call(orderHandler, {
  method: 'GET',
  headers: {},
  query: { code: 'DBL-NOPE99' },
})
check('GET 404s an unknown code', missing.status === 404)

const badCode = await call(orderHandler, { method: 'GET', headers: {}, query: { code: 'hello' } })
check('GET 400s a malformed code', badCode.status === 400)

// --- update ---------------------------------------------------------------
const patched = await call(orderHandler, {
  method: 'PATCH',
  headers: {},
  query: { code: 'DBL-TESTA1' },
  body: { status: 'baking', kitchenNote: 'Start the ganache at 6am' },
})
check('PATCH moves the status', patched.json?.order?.status === 'baking', JSON.stringify(patched.json))
check('PATCH stores the kitchen note', patched.json?.order?.kitchenNote === 'Start the ganache at 6am')

const badStatus = await call(orderHandler, {
  method: 'PATCH',
  headers: {},
  query: { code: 'DBL-TESTA1' },
  body: { status: 'exploded' },
})
check('PATCH rejects an unknown status', badStatus.status === 400)

// --- admin listing --------------------------------------------------------
const list = await call(ordersHandler, { method: 'GET', headers: {} })
check('GET /api/orders lists orders', list.status === 200 && list.json.orders.length >= 1)
check('listing reports its storage mode', list.json.storage === 'memory')

// --- admin key ------------------------------------------------------------
process.env.ADMIN_KEY = 'secret-key'
const denied = await call(ordersHandler, { method: 'GET', headers: {} })
check('listing is denied without the admin key', denied.status === 401)

const allowed = await call(ordersHandler, {
  method: 'GET',
  headers: { 'x-admin-key': 'secret-key' },
})
check('listing is allowed with the admin key', allowed.status === 200)
check('listing reports it is secured', allowed.json.secured === true)

const patchDenied = await call(orderHandler, {
  method: 'PATCH',
  headers: {},
  query: { code: 'DBL-TESTA1' },
  body: { status: 'ready' },
})
check('PATCH is denied without the admin key', patchDenied.status === 401)
delete process.env.ADMIN_KEY

// --- method guard ---------------------------------------------------------
const wrongMethod = await call(ordersHandler, { method: 'DELETE', headers: {} })
check('unsupported methods are rejected', wrongMethod.status === 405)


// --- catalogue -------------------------------------------------------------
const { default: catalogHandler } = await import('../api/catalog.js')
const { default: productHandler } = await import('../api/catalog/[slug].js')
const { default: settingsHandler } = await import('../api/settings.js')
const { ART_VARIANT_IDS, PALETTE_IDS } = await import('../src/data/optionIds.js')
// CreationArt is JSX, which node cannot import — read the variant map instead.
const artSource = readFileSync(new URL('../src/art/CreationArt.jsx', import.meta.url), 'utf8')
const RENDERABLE = artSource
  .slice(artSource.indexOf('const VARIANTS = {'), artSource.indexOf('export const ART_VARIANTS'))
  .split('\n')
  .map((line) => line.match(/^\s*(\w+):/)?.[1])
  .filter(Boolean)
const { PALETTE_KEYS } = await import('../src/art/palettes.js')

check(
  'every listed illustration is one the site can actually draw',
  ART_VARIANT_IDS.every((id) => RENDERABLE.includes(id)),
  ART_VARIANT_IDS.filter((id) => !RENDERABLE.includes(id)).join(', '),
)
check(
  'every listed palette exists',
  PALETTE_IDS.every((id) => PALETTE_KEYS.includes(id)),
  PALETTE_IDS.filter((id) => !PALETTE_KEYS.includes(id)).join(', '),
)

const menu = await call(catalogHandler, { method: 'GET', headers: {} })
check('GET /api/catalog seeds and returns the menu', menu.status === 200 && menu.json.products.length > 0)
check('the menu carries settings', Boolean(menu.json.settings?.fulfilment))

const madeProduct = await call(catalogHandler, {
  method: 'POST',
  headers: {},
  body: {
    name: 'Test Tart',
    category: 'treats',
    sizes: [{ label: 'Individual', serves: '1', price: 4500 }],
    leadDays: 1,
  },
})
check('POST /api/catalog creates a product', madeProduct.status === 201, JSON.stringify(madeProduct.json))
check('the web address is generated from the name', madeProduct.json?.product?.slug === 'test-tart')

const noPrice = await call(catalogHandler, {
  method: 'POST',
  headers: {},
  body: { name: 'Free Cake', sizes: [{ label: 'One', price: 0 }] },
})
check('a product with no price is rejected', noPrice.status === 400)

const noSize = await call(catalogHandler, {
  method: 'POST',
  headers: {},
  body: { name: 'Sizeless', sizes: [] },
})
check('a product with no sizes is rejected', noSize.status === 400)

const badArt = await call(catalogHandler, {
  method: 'POST',
  headers: {},
  body: {
    name: 'Odd Art',
    art: 'not-a-real-variant',
    flavorArt: 'neon',
    sizes: [{ label: 'One', price: 1000 }],
  },
})
check('an unknown illustration falls back to a real one', RENDERABLE.includes(badArt.json?.product?.art))
check('an unknown palette falls back to a real one', PALETTE_KEYS.includes(badArt.json?.product?.flavorArt))

const xss = await call(catalogHandler, {
  method: 'POST',
  headers: {},
  body: {
    name: 'Sneaky',
    photo: 'javascript:alert(1)',
    sizes: [{ label: 'One', price: 1000 }],
  },
})
check('a javascript: photo URL is stripped', !xss.json?.product?.photo)

const renamed = await call(productHandler, {
  method: 'PUT',
  headers: {},
  query: { slug: 'test-tart' },
  body: {
    name: 'Passion Tart',
    slug: 'passion-tart',
    category: 'treats',
    sizes: [{ label: 'Individual', serves: '1', price: 5200 }],
    leadDays: 1,
  },
})
check('PUT renames a product', renamed.json?.product?.slug === 'passion-tart')

const oldSlug = await call(productHandler, { method: 'GET', headers: {}, query: { slug: 'test-tart' } })
check('the old web address no longer resolves', oldSlug.status === 404)

const hidden = await call(productHandler, {
  method: 'PATCH',
  headers: {},
  query: { slug: 'passion-tart' },
  body: { active: false },
})
check('PATCH can hide a product', hidden.json?.product?.active === false)

const publicMenu = await call(catalogHandler, { method: 'GET', headers: {} })
check(
  'hidden products are absent from the public menu',
  !publicMenu.json.products.some((p) => p.slug === 'passion-tart'),
)

const adminMenu = await call(catalogHandler, { method: 'GET', headers: { 'x-admin-key': 'x' } })
check(
  'hidden products are visible to the dashboard',
  adminMenu.json.products.some((p) => p.slug === 'passion-tart'),
)

const removed = await call(productHandler, {
  method: 'DELETE',
  headers: {},
  query: { slug: 'passion-tart' },
})
check('DELETE removes a product', removed.status === 200)

// --- settings --------------------------------------------------------------
const settingsPatched = await call(settingsHandler, {
  method: 'PATCH',
  headers: {},
  body: { fulfilment: { deliveryFee: 7500, freeDeliveryOver: 90000, depositPercent: 40 } },
})
check('PATCH /api/settings saves money rules', settingsPatched.json?.settings?.fulfilment?.deliveryFee === 7500)
check('other settings survive a partial patch', Boolean(settingsPatched.json?.settings?.contact?.whatsapp))

const clamped = await call(settingsHandler, {
  method: 'PATCH',
  headers: {},
  body: { fulfilment: { depositPercent: 900, deliveryFee: -50 } },
})
check('a deposit above 100% is clamped', clamped.json?.settings?.fulfilment?.depositPercent === 100)
check('a negative fee is floored at zero', clamped.json?.settings?.fulfilment?.deliveryFee === 0)

// --- catalogue auth --------------------------------------------------------
process.env.ADMIN_KEY = 'secret-key'
const writeDenied = await call(catalogHandler, {
  method: 'POST',
  headers: {},
  body: { name: 'Unauthorised', sizes: [{ label: 'One', price: 1000 }] },
})
check('creating a product is denied without the admin key', writeDenied.status === 401)

const settingsDenied = await call(settingsHandler, {
  method: 'PATCH',
  headers: {},
  body: { fulfilment: { deliveryFee: 1 } },
})
check('changing settings is denied without the admin key', settingsDenied.status === 401)

const readAllowed = await call(catalogHandler, { method: 'GET', headers: {} })
check('the public menu stays readable without a key', readAllowed.status === 200)
delete process.env.ADMIN_KEY


// --- images ----------------------------------------------------------------
const { default: imagesHandler } = await import('../api/images.js')
const { default: imageHandler } = await import('../api/images/[id].js')

// Smallest possible valid PNG.
const PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

const uploaded = await call(imagesHandler, {
  method: 'POST',
  headers: {},
  body: { dataUrl: PNG, filename: 'dot.png', alt: 'a dot', width: 1, height: 1 },
})
check('POST /api/images stores a photo', uploaded.status === 201, JSON.stringify(uploaded.json))
check('the stored photo gets a servable url', /^\/api\/images\//.test(uploaded.json?.image?.url || ''))

const imageId = uploaded.json?.image?.id
const served = mockRes()
await imageHandler({ method: 'GET', headers: {}, query: { id: imageId } }, served)
check('GET /api/images/:id serves the bytes', served.statusCode === 200)
check('it is served as an image', (served.headers['Content-Type'] || '').startsWith('image/'))
check('it is cached hard', /immutable/.test(served.headers['Cache-Control'] || ''))

const notImage = await call(imagesHandler, {
  method: 'POST',
  headers: {},
  body: { dataUrl: 'data:text/html;base64,PHNjcmlwdD4=', filename: 'x.html' },
})
check('a non-image upload is refused', notImage.status === 400)

const junk = await call(imagesHandler, {
  method: 'POST',
  headers: {},
  body: { dataUrl: 'not-a-data-url' },
})
check('a malformed upload is refused', junk.status === 400)

const missingImage = mockRes()
await imageHandler({ method: 'GET', headers: {}, query: { id: 'nope.png' } }, missingImage)
check('an unknown photo 404s', missingImage.statusCode === 404)

const traversal = mockRes()
await imageHandler({ method: 'GET', headers: {}, query: { id: '../../etc/passwd' } }, traversal)
check('a path-traversal id is refused', traversal.statusCode === 400)

const listed = await call(imagesHandler, { method: 'GET', headers: {} })
check('GET /api/images lists them', listed.status === 200 && listed.json.images.length >= 1)
check('the listing leaves the binary out', listed.json.images.every((i) => !i.data))

const galleryPatch = await call(settingsHandler, {
  method: 'PATCH',
  headers: {},
  body: {
    gallery: [
      { url: uploaded.json.image.url, caption: 'Fresh batch' },
      { url: 'javascript:alert(1)', caption: 'bad' },
    ],
  },
})
check('the home gallery accepts a real photo', galleryPatch.json?.settings?.gallery?.length === 1)
check('a javascript: gallery url is dropped', galleryPatch.json?.settings?.gallery?.[0]?.caption === 'Fresh batch')

const removedImage = await call(imagesHandler, {
  method: 'DELETE',
  headers: {},
  body: { id: imageId },
})
check('DELETE removes a photo', removedImage.status === 200)

process.env.ADMIN_KEY = 'secret-key'
const uploadDenied = await call(imagesHandler, {
  method: 'POST',
  headers: {},
  body: { dataUrl: PNG },
})
check('uploading is denied without the admin key', uploadDenied.status === 401)
delete process.env.ADMIN_KEY


// --- whatsapp --------------------------------------------------------------
const {
  parseCommand,
  isAuthorisedSender,
  formatOrder,
  whatsappConfigured,
  customerWhatsappConfigured,
  customerTemplatesConfigured,
  toInternational,
  cleanParam,
  formatCustomerConfirmation,
  formatCustomerStatus,
  sendCustomerOrderConfirmation,
  sendCustomerStatusUpdate,
  CUSTOMER_STATUS_LINES,
} = await import('../api/_lib/whatsapp.js')
const { default: waHandler } = await import('../api/whatsapp.js')

check('whatsapp stays off until it is configured', whatsappConfigured() === false)

check('"confirm DBL-TESTA1" is understood', () => {
  const c = parseCommand('confirm DBL-TESTA1')
  return c.kind === 'status' && c.status === 'confirmed' && c.code === 'DBL-TESTA1'
})
check('"ready dbl-testa1" is case-insensitive', () => {
  const c = parseCommand('ready dbl-testa1')
  return c.status === 'ready' && c.code === 'DBL-TESTA1'
})
check('"done" alone asks which order', parseCommand('done').kind === 'needs-code')
check('a bare code is a lookup', parseCommand('DBL-TESTA1').kind === 'lookup')
check('"today" lists the day', parseCommand('today').kind === 'today')
check('"new" lists what is waiting', parseCommand('new').kind === 'new')
check('anything else gets the help text', parseCommand('hello there').kind === 'unknown')
check('cancel maps to cancelled', parseCommand('cancel DBL-TESTA1').status === 'cancelled')

process.env.WHATSAPP_TO = '250788722064'
check('the bakery number is authorised', isAuthorisedSender('250788722064'))
check('a formatted number still matches', isAuthorisedSender('+250 788 722 064'))
check('any other number is not', isAuthorisedSender('250700000000') === false)
process.env.WHATSAPP_ADMINS = '250799111222'
check('extra admin numbers are honoured', isAuthorisedSender('250799111222'))
delete process.env.WHATSAPP_ADMINS

const waText = formatOrder({
  code: 'DBL-TESTA1',
  name: 'Keza Uwase',
  phone: '0788722064',
  fulfilment: 'delivery',
  date: '2026-09-01',
  time: '13:00 – 15:00',
  address: 'KG 11 Ave',
  total: 84000,
  items: [{ quantity: 2, name: 'Signature Chocolate Drip', sizeLabel: '8" round' }],
})
check('the WhatsApp message names the order', waText.includes('DBL-TESTA1'))
check('it lists the items', waText.includes('2 × Signature Chocolate Drip'))
check('it shows the total', waText.includes('RWF 84,000'))
check('it tells the baker what to reply', /confirm DBL-TESTA1/.test(waText))

// --- whatsapp: messages to the customer ------------------------------------
check('0788722064 becomes 250788722064', toInternational('0788722064') === '250788722064')
check('788722064 becomes 250788722064', toInternational('788722064') === '250788722064')
check('250788722064 is left alone', toInternational('250788722064') === '250788722064')
check('+250 788 722 064 is normalised', toInternational('+250 788 722 064') === '250788722064')
check('an empty number gives an empty string', toInternational('') === '')

check('newlines are stripped from template parameters', cleanParam('one\ntwo') === 'one two')
check('tabs are stripped too', cleanParam('one\ttwo') === 'one two')
check('runs of spaces are squashed', cleanParam('one    two') === 'one two')
check('an empty parameter falls back', cleanParam('') === '—')

const customerOrder = {
  code: 'DBL-TESTA1',
  status: 'confirmed',
  name: 'Keza Uwase',
  phone: '0788722064',
  fulfilment: 'delivery',
  date: '2026-09-01',
  time: '13:00 – 15:00',
  total: 84000,
  depositDue: 33600,
}

const confirmText = formatCustomerConfirmation(customerOrder)
check('the customer message greets them by first name', confirmText.startsWith('Hi Keza,'))
check('it carries the order code', confirmText.includes('DBL-TESTA1'))
check('it carries the total', confirmText.includes('RWF 84,000'))
check('it mentions the deposit when there is one', confirmText.includes('RWF 33,600'))

const statusText = formatCustomerStatus(customerOrder)
check('the status message names the order', statusText.includes('DBL-TESTA1'))
check('it uses the wording for that status', statusText.includes(CUSTOMER_STATUS_LINES.confirmed))
check(
  'every status line is safe to send as a template parameter',
  Object.values(CUSTOMER_STATUS_LINES).every((line) => cleanParam(line) === line),
)

check('customer messaging stays off until it is configured', customerWhatsappConfigured() === false)
const notConfigured = await sendCustomerOrderConfirmation(customerOrder)
check('nothing is sent while it is off', notConfigured.sent === false)

// From here on, stand in for the Graph API so nothing leaves the machine.
const realFetch = globalThis.fetch
let lastCall = null
globalThis.fetch = async (url, options) => {
  lastCall = { url, body: JSON.parse(options.body) }
  return { ok: true, json: async () => ({ messages: [{ id: 'wamid.TEST' }] }) }
}

process.env.WHATSAPP_TOKEN = 'test-token'
process.env.WHATSAPP_PHONE_ID = '1234567890'
check('customer messaging switches on with a token and phone id', customerWhatsappConfigured())
check('but the templates are still missing', customerTemplatesConfigured() === false)

lastCall = null
const plainFallback = await sendCustomerOrderConfirmation(customerOrder)
check('without a template it still tries, as plain text', plainFallback.sent === true)
check('and it really is plain text', lastCall?.body?.type === 'text')
check(
  'the plain text carries the whole message',
  lastCall?.body?.text?.body?.includes('DBL-TESTA1'),
)

process.env.WHATSAPP_CUSTOMER_TEMPLATE = 'dussa_order_confirmation'
process.env.WHATSAPP_STATUS_TEMPLATE = 'dussa_order_status'
check('with both template names set, it is fully configured', customerTemplatesConfigured())

lastCall = null
const sentConfirmation = await sendCustomerOrderConfirmation(customerOrder)
check('the confirmation is sent', sentConfirmation.sent === true)
check('it goes to the customer, not the bakery', lastCall?.body?.to === '250788722064')
check('it goes as a template', lastCall?.body?.type === 'template')
check(
  'it uses the confirmation template',
  lastCall?.body?.template?.name === 'dussa_order_confirmation',
)
check(
  'the confirmation fills all seven parameters',
  lastCall?.body?.template?.components?.[0]?.parameters?.length === 7,
  String(lastCall?.body?.template?.components?.[0]?.parameters?.length),
)
check(
  'the last parameter is the Mobile Money number',
  /\d/.test(lastCall?.body?.template?.components?.[0]?.parameters?.[6]?.text || ''),
)
check('the first parameter is the first name', () => {
  const params = lastCall.body.template.components[0].parameters
  return params[0].text === 'Keza' && params[1].text === 'DBL-TESTA1'
})
check('no parameter contains a newline', () =>
  lastCall.body.template.components[0].parameters.every((p) => !/[\r\n\t]/.test(p.text)),
)

lastCall = null
const sentStatus = await sendCustomerStatusUpdate({ ...customerOrder, status: 'ready' })
check('a status update is sent', sentStatus.sent === true)
check('it uses the status template', lastCall?.body?.template?.name === 'dussa_order_status')
check('the status sentence is passed through', () => {
  const params = lastCall.body.template.components[0].parameters
  return params[2].text === CUSTOMER_STATUS_LINES.ready
})

lastCall = null
const noCopy = await sendCustomerStatusUpdate({ ...customerOrder, status: 'new' })
check('a "new" order does not message the customer twice', noCopy.sent === false)
check('and nothing was sent for it', lastCall === null)

lastCall = null
const optedOut = await sendCustomerOrderConfirmation({ ...customerOrder, whatsappUpdates: false })
check('a customer who opted out is not messaged', optedOut.sent === false && lastCall === null)

lastCall = null
const badPhone = await sendCustomerOrderConfirmation({ ...customerOrder, phone: '12345' })
check('a number that is not a Rwandan mobile is skipped', badPhone.sent === false)
check('and nothing is sent to it', lastCall === null)

globalThis.fetch = realFetch
delete process.env.WHATSAPP_TOKEN
delete process.env.WHATSAPP_PHONE_ID
delete process.env.WHATSAPP_CUSTOMER_TEMPLATE
delete process.env.WHATSAPP_STATUS_TEMPLATE

// --- payments ---------------------------------------------------------------
const {
  looksLikePaymentClaim,
  claimPayment,
  sanitisePayment,
  isProofId,
  newProofId,
  emptyPayment,
} = await import('../api/_lib/payment.js')

check('"PAID" is a payment claim', looksLikePaymentClaim('PAID'))
check('lowercase and padded still counts', looksLikePaymentClaim('  paid  '))
check('"I have paid" counts', looksLikePaymentClaim('I have paid'))
check('"payment sent" counts', looksLikePaymentClaim('payment sent'))
check('Kinyarwanda "nishyuye" counts', looksLikePaymentClaim('nishyuye'))
check('French "j\'ai payé" counts', looksLikePaymentClaim("j'ai payé"))
check('a plain hello is not a claim', looksLikePaymentClaim('hello') === false)
check('asking the price is not a claim', looksLikePaymentClaim('how much is it?') === false)
check('an empty message is not a claim', looksLikePaymentClaim('') === false)

check('a new order starts unpaid', emptyPayment().status === 'unpaid')

const claimed = claimPayment(emptyPayment(), { reference: 'PAID', proofImageId: 'payabc123.jpg' })
check('a claim marks it claimed, not verified', claimed.status === 'claimed')
check('it keeps what they said', claimed.reference === 'PAID')
check('it keeps the screenshot', claimed.proofImageId === 'payabc123.jpg')
check('it stamps the time', Boolean(claimed.claimedAt))

const alreadyVerified = claimPayment({ status: 'verified' }, { reference: 'PAID again' })
check(
  'a later message cannot undo a verified payment',
  alreadyVerified.status === 'verified' && alreadyVerified.reference === undefined,
)

const verifiedPayment = sanitisePayment('verified', claimed)
check('an admin can verify a claim', verifiedPayment.status === 'verified')
check('verifying stamps the time', Boolean(verifiedPayment.verifiedAt))
check('verifying keeps the proof', verifiedPayment.proofImageId === 'payabc123.jpg')

const reset = sanitisePayment('unpaid', verifiedPayment)
check('resetting clears the claim', reset.status === 'unpaid')
check('and clears the trail with it', !reset.proofImageId && !reset.claimedAt)

check('an unknown payment status is ignored', sanitisePayment('rubbish', claimed).status === 'claimed')

check('proof ids are recognised', isProofId('payabc123.jpg'))
check('product photo ids are not', isProofId('a1b2c3d4.png') === false)
check('a generated proof id is recognised', isProofId(newProofId('image/jpeg')))
check('a generated proof id is a legal image id', /^[a-z0-9.]+$/i.test(newProofId('image/png')))
check('two proof ids differ', newProofId('image/jpeg') !== newProofId('image/jpeg'))

// The order API has to accept a payment and confirm the order with it.
const payOrder = await call(ordersHandler, {
  method: 'POST',
  headers: {},
  body: { ...payload, code: 'DBL-PAY001' },
})
check('an order is created for the payment test', payOrder.status === 201)
check('it starts unpaid', payOrder.json?.order?.payment?.status === 'unpaid')

const verifiedPatch = await call(orderHandler, {
  method: 'PATCH',
  headers: {},
  query: { code: 'DBL-PAY001' },
  body: { payment: 'verified' },
})
check('the admin can verify the payment', verifiedPatch.json?.order?.payment?.status === 'verified')
check(
  'verifying a new order confirms it',
  verifiedPatch.json?.order?.status === 'confirmed',
  JSON.stringify(verifiedPatch.json?.order?.status),
)

const publicView = await call(orderHandler, {
  method: 'GET',
  headers: {},
  query: { code: 'DBL-PAY001' },
})
check('the tracker sees the payment status', publicView.json?.order?.payment?.status === 'verified')
check(
  'but never the screenshot or their message',
  publicView.json?.order?.payment?.proofImageId === undefined &&
    publicView.json?.order?.payment?.reference === undefined,
)

// A verified order must not be dragged backwards by verifying again.
const reverify = await call(orderHandler, {
  method: 'PATCH',
  headers: {},
  query: { code: 'DBL-PAY001' },
  body: { payment: 'verified' },
})
check('re-verifying leaves the status alone', reverify.json?.order?.status === 'confirmed')

// webhook verification handshake
process.env.WHATSAPP_VERIFY_TOKEN = 'verify-me'
const verified = mockRes()
await waHandler(
  { method: 'GET', headers: {}, query: { 'hub.mode': 'subscribe', 'hub.verify_token': 'verify-me', 'hub.challenge': '12345' } },
  verified,
)
check('the webhook completes Meta\'s handshake', verified.statusCode === 200 && verified.body === '12345')

const refused = mockRes()
await waHandler(
  { method: 'GET', headers: {}, query: { 'hub.mode': 'subscribe', 'hub.verify_token': 'wrong', 'hub.challenge': '12345' } },
  refused,
)
check('a wrong verify token is refused', refused.statusCode === 403)

// --- a customer reporting a payment, through the real webhook ---------------
{
  const { getOrder, getImage } = await import('../api/_lib/db.js')

  process.env.WHATSAPP_TOKEN = 'test-token'
  process.env.WHATSAPP_PHONE_ID = '1234567890'
  // The bakery is a different number, so our customer is not an admin sender.
  process.env.WHATSAPP_TO = '250799000111'

  const sent = []
  const savedFetch = globalThis.fetch
  globalThis.fetch = async (url, options = {}) => {
    const target = String(url)
    if (target.endsWith('/messages')) {
      sent.push(JSON.parse(options.body))
      return { ok: true, json: async () => ({ messages: [{ id: 'wamid.X' }] }) }
    }
    if (target.endsWith('/MEDIA123')) {
      return {
        ok: true,
        json: async () => ({ url: 'https://lookaside.test/file', mime_type: 'image/jpeg' }),
      }
    }
    if (target.startsWith('https://lookaside.test/')) {
      return { ok: true, arrayBuffer: async () => new Uint8Array([255, 216, 255, 0, 1, 2]).buffer }
    }
    return { ok: false, status: 404, json: async () => ({}) }
  }

  const webhook = (message) => ({
    method: 'POST',
    headers: {},
    body: { entry: [{ changes: [{ value: { messages: [message] } }] }] },
  })

  await call(ordersHandler, {
    method: 'POST',
    headers: {},
    body: { ...payload, code: 'DBL-PAY777', phone: '0788722064' },
  })

  // 1 — a plain "PAID" with no screenshot.
  const textRes = mockRes()
  await waHandler(
    webhook({ from: '250788722064', type: 'text', text: { body: 'PAID' } }),
    textRes,
  )
  const afterText = await getOrder('DBL-PAY777')
  check('a customer PAID reply is recorded', afterText?.payment?.status === 'claimed')
  check('their words are kept', afterText?.payment?.reference === 'PAID')
  check('but the order itself does not move', afterText?.status === 'new')
  check('the customer is thanked', sent.some((m) => m.to === '250788722064'))
  check('and the bakery is told', sent.some((m) => m.to === '250799000111'))

  // 2 — then the screenshot.
  sent.length = 0
  const imageRes = mockRes()
  await waHandler(
    webhook({ from: '250788722064', type: 'image', image: { id: 'MEDIA123' } }),
    imageRes,
  )
  const afterImage = await getOrder('DBL-PAY777')
  check('a screenshot is attached to the order', Boolean(afterImage?.payment?.proofImageId))
  check('it is stored under a proof id', isProofId(afterImage?.payment?.proofImageId || ''))
  const stored = await getImage(afterImage?.payment?.proofImageId)
  check('the image bytes really were saved', stored?.data?.length === 6)
  check('the order still has not moved on its own', afterImage?.status === 'new')

  // 3 — a stranger's number matches no order and changes nothing.
  sent.length = 0
  const strangerRes = mockRes()
  await waHandler(webhook({ from: '250733222111', type: 'text', text: { body: 'PAID' } }), strangerRes)
  check('an unknown number is answered, not ignored', sent.length === 1)
  check('and it is told we cannot match it', /order code/i.test(sent[0]?.text?.body || ''))

  // 4 — small talk from a customer is left alone.
  sent.length = 0
  const chatRes = mockRes()
  await waHandler(
    webhook({ from: '250788722064', type: 'text', text: { body: 'hello, are you open?' } }),
    chatRes,
  )
  check('small talk gets no automated reply', sent.length === 0)

  globalThis.fetch = savedFetch
  delete process.env.WHATSAPP_TOKEN
  delete process.env.WHATSAPP_PHONE_ID
}

process.env.WHATSAPP_TO = '250788722064'

const badSig = mockRes()
process.env.WHATSAPP_APP_SECRET = 'app-secret'
await waHandler({ method: 'POST', headers: { 'x-hub-signature-256': 'sha256=deadbeef' }, body: {} }, badSig)
check('a webhook with a bad signature is rejected', badSig.statusCode === 401)
delete process.env.WHATSAPP_APP_SECRET
delete process.env.WHATSAPP_VERIFY_TOKEN
delete process.env.WHATSAPP_TO

console.log(failures === 0 ? '\nAll API checks passed.' : `\n${failures} check(s) failed.`)
process.exit(failures === 0 ? 0 : 1)
