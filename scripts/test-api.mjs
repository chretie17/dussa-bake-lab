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
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${cond ? '' : ` :: ${extra}`}`)
  if (!cond) failures += 1
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

console.log(failures === 0 ? '\nAll API checks passed.' : `\n${failures} check(s) failed.`)
process.exit(failures === 0 ? 0 : 1)
