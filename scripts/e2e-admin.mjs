import { chromium } from 'playwright'

/**
 * Browser walk-through of the kitchen dashboard, run against the dev server
 * with the local API attached:
 *
 *   npm run dev:api      # terminal 1
 *   npm run dev          # terminal 2
 *   npm run test:admin   # terminal 3
 */
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173'
const OUT = process.env.SHOT_DIR || ''

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
)
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } })

const errors = []
page.on('pageerror', (e) => errors.push(String(e)))

let failures = 0
const check = async (label, fn) => {
  try {
    const ok = await fn()
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`)
    if (!ok) failures += 1
  } catch (e) {
    console.log(`FAIL  ${label} :: ${e.message}`)
    failures += 1
  }
}

const shot = async (name) => {
  if (OUT) await page.screenshot({ path: `${OUT}/${name}.png` })
}

// 1 — sign in
await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' })
await check('the dashboard asks for a key first', async () =>
  page.getByLabel('Admin key').isVisible(),
)
await page.getByLabel('Admin key').fill('local-dev')
await page.getByRole('button', { name: 'Open dashboard' }).click()
await page.waitForTimeout(1800)

await check('signing in opens the dashboard', async () =>
  page.getByRole('heading', { name: /Today at a glance/ }).isVisible(),
)
await check('missing setup is flagged, not hidden', async () =>
  page.getByText(/No database is connected/).first().isVisible(),
)
await shot('admin-1-orders')

// 2 — products tab
await page.getByRole('button', { name: 'Products', exact: true }).click()
await page.waitForTimeout(900)
const seeded = await page.locator('ul > li').count()
await check('the seeded menu is listed', () => seeded >= 16)
await shot('admin-2-products')

// 3 — create a product
await page.getByRole('button', { name: /New product/ }).click()
await page.waitForTimeout(700)
await page.getByLabel('Name').fill('Passion Fruit Tart')
await check('the web address is derived from the name', async () =>
  (await page.getByLabel('Web address').inputValue()) === 'passion-fruit-tart',
)
await page.getByLabel('Tagline').fill('Sharp, bright, gone by noon')
await page.getByLabel('Description').fill('A crisp pastry shell filled with passion fruit curd.')

await page.getByRole('button', { name: 'Sizes & prices' }).click()
await page.waitForTimeout(300)
await page.getByLabel('Sizes & prices — Size').first().fill('Individual')
await page.getByLabel('Sizes & prices — Serves').first().fill('1 tart')
await page.getByLabel('Sizes & prices — Price').first().fill('4500')

await page.getByRole('button', { name: 'Save product' }).click()
await page.waitForTimeout(1600)

await check('the new product appears in the list', async () =>
  page.getByRole('heading', { name: 'Passion Fruit Tart' }).isVisible(),
)
await check('its price renders formatted', async () =>
  page.getByText('RWF 4,500').first().isVisible(),
)
await shot('admin-3-created')

// 4 — it must reach the storefront
await page.goto(`${BASE}/creations`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
await check('the storefront shows the new product', async () =>
  page.getByRole('heading', { name: 'Passion Fruit Tart' }).isVisible(),
)

await page.goto(`${BASE}/creations/passion-fruit-tart`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await check('its product page opens with the price', async () =>
  (await page.getByRole('heading', { name: 'Passion Fruit Tart', level: 1 }).isVisible()) &&
  (await page.getByText('RWF 4,500').first().isVisible()),
)

// 5 — edit the price, confirm it propagates
await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1600)
await page.getByRole('button', { name: 'Products', exact: true }).click()
await page.waitForTimeout(1500)
await page.getByLabel('Edit Passion Fruit Tart').click()
await page.waitForTimeout(700)
await page.getByRole('button', { name: 'Sizes & prices' }).click()
await page.waitForTimeout(300)
await page.getByLabel('Sizes & prices — Price').first().fill('5200')
await page.getByRole('button', { name: 'Save product' }).click()
await page.waitForTimeout(1600)

await page.goto(`${BASE}/creations/passion-fruit-tart`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1400)
await check('an edited price shows on the storefront', async () =>
  page.getByText('RWF 5,200').first().isVisible(),
)

// 6 — hiding takes it off the site
await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1600)
await page.getByRole('button', { name: 'Products', exact: true }).click()
await page.waitForTimeout(800)
await page.getByLabel('Hide Passion Fruit Tart').click()
await page.waitForTimeout(1400)

await page.goto(`${BASE}/creations`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
await check('a hidden product is not on the storefront', async () =>
  (await page.getByRole('heading', { name: 'Passion Fruit Tart' }).count()) === 0,
)

// 7 — settings drive the storefront
await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1600)
await page.getByRole('button', { name: 'Settings', exact: true }).click()
await page.waitForTimeout(900)
await page.getByLabel('Delivery fee').fill('7500')
await page.getByLabel('Free delivery over').fill('90000')
await page.getByRole('button', { name: /Save settings/ }).click()
await page.waitForTimeout(1500)
await shot('admin-4-settings')

await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1600)
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.72))
await page.waitForTimeout(1200)
await check('the new delivery fee reaches the home page', async () =>
  page.getByText('RWF 7,500 citywide').isVisible(),
)

// 8 — delete cleans up
await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1600)
await page.getByRole('button', { name: 'Products', exact: true }).click()
await page.waitForTimeout(800)
await page.getByLabel('Delete Passion Fruit Tart').click()
await page.waitForTimeout(500)
await check('deleting asks for confirmation first', async () =>
  page.getByText(/Delete “Passion Fruit Tart”\?/).isVisible(),
)
await page.getByRole('button', { name: 'Delete', exact: true }).click()
await page.waitForTimeout(1500)
await check('the product is gone from the dashboard', async () =>
  (await page.getByRole('heading', { name: 'Passion Fruit Tart' }).count()) === 0,
)


// 9 — photos: upload, attach to a product, and check it reaches the site
await page.getByRole('button', { name: 'Photos', exact: true }).click()
await page.waitForTimeout(900)

// Make a genuine oversized JPEG in the page and feed it to the file input.
const jpegBase64 = await page.evaluate(() => {
  const c = document.createElement('canvas')
  c.width = 2400
  c.height = 1800
  const x = c.getContext('2d')
  const g = x.createLinearGradient(0, 0, 2400, 1800)
  g.addColorStop(0, '#6B4127')
  g.addColorStop(1, '#F0DCC0')
  x.fillStyle = g
  x.fillRect(0, 0, 2400, 1800)
  x.fillStyle = '#2A1810'
  x.beginPath()
  x.arc(1200, 900, 500, 0, Math.PI * 2)
  x.fill()
  return c.toDataURL('image/jpeg', 0.95).split(',')[1]
})

await page.setInputFiles('input[type=file]', {
  name: 'test-cake.jpg',
  mimeType: 'image/jpeg',
  buffer: Buffer.from(jpegBase64, 'base64'),
})
await page.waitForTimeout(3000)

await check('an uploaded photo appears in the library', async () =>
  (await page.locator('figure').count()) >= 1,
)
const meta = await page.locator('figure p').nth(1).innerText().catch(() => '')
await check('a 2400px photo is shrunk on the way in', () => /1600×1200/.test(meta))
await shot('admin-5-photos')

await page.getByRole('button', { name: 'Products', exact: true }).click()
await page.waitForTimeout(1200)
await page.getByLabel(/^Edit /).first().click()
await page.waitForTimeout(800)
await page.getByRole('button', { name: 'Display' }).click()
await page.waitForTimeout(400)
await page.getByRole('button', { name: /Choose an earlier photo/ }).click()
await page.waitForTimeout(1200)
await page.locator('button:has(img)').first().click()
await page.waitForTimeout(600)
await check('the picked photo previews in the editor', async () =>
  page.getByRole('button', { name: /Remove/ }).isVisible(),
)
await page.getByRole('button', { name: 'Save product' }).click()
await page.waitForTimeout(2000)

await page.goto(`${BASE}/creations`, { waitUntil: 'networkidle' })
await page.waitForTimeout(2000)
await check('the photo shows on the storefront', async () =>
  (await page.locator('img[src^="/api/images/"]').count()) >= 1,
)
await check('the image endpoint serves real image bytes', async () =>
  page.evaluate(async () => {
    const img = document.querySelector('img[src^="/api/images/"]')
    if (!img) return false
    const r = await fetch(img.src)
    return r.ok && (r.headers.get('content-type') || '').startsWith('image/')
  }),
)

// 10 — the overview tab is the landing screen and reads the same orders
await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1800)
await check('the dashboard opens on the overview', async () =>
  page.getByRole('heading', { name: /Today at a glance/ }).isVisible(),
)
await check('the overview shows the day lists', async () =>
  (await page.getByRole('heading', { name: 'Today', exact: true }).isVisible()) &&
  (await page.getByRole('heading', { name: 'Tomorrow', exact: true }).isVisible()),
)
await shot('admin-6-overview')

console.log(errors.length ? `\nPAGE ERRORS:\n${[...new Set(errors)].join('\n')}` : '\nno page errors')
console.log(failures === 0 ? 'All admin checks passed.' : `${failures} check(s) failed.`)

await browser.close()
process.exit(failures === 0 ? 0 : 1)
