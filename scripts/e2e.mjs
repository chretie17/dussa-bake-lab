import { chromium } from 'playwright'

/**
 * Browser walk-through of the whole ordering path, run against `npm run preview`.
 *
 *   npm run build && npm run preview          # in one terminal
 *   npm run test:e2e                          # in another
 *
 * Set SHOT_DIR to also capture screenshots along the way.
 */
const BASE = process.env.BASE_URL || 'http://127.0.0.1:4173'
const OUT = process.env.SHOT_DIR || ''

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
)
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

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

// 1 — customise a product and add it to the basket
await page.goto(`${BASE}/creations/signature-chocolate-drip`, { waitUntil: 'networkidle' })
await page.getByRole('button', { name: /10" round/ }).click()
await page.getByRole('button', { name: /Salted caramel/ }).first().click()
await page.getByRole('button', { name: /Whipped ganache/ }).click()
await page.getByText('24k edible gold leaf').first().click()
await page.getByLabel('Message on the cake').fill('Happy Birthday, Keza!')
await page.getByRole('button', { name: 'Increase quantity' }).click()

await check('live total reflects size + flavour + finish + add-on × 2', async () => {
  const text = await page.locator('p.font-display.tabular-nums').first().innerText()
  // 62,000 + 3,000 caramel + 4,000 ganache + 9,000 gold = 78,000 × 2
  return text.replace(/[^\d]/g, '') === '156000'
})

await page.getByRole('button', { name: /Add to basket/ }).click()
await page.waitForTimeout(700)
await check('basket drawer opens with the item', async () =>
  (await page.getByRole('dialog', { name: /basket/i }).isVisible()) &&
  (await page.getByText('Signature Chocolate Drip').first().isVisible()),
)

// 2 — walk the booking flow
await page.getByRole('button', { name: /Continue to booking/ }).click()
await page.waitForURL('**/order')
await page.waitForTimeout(1400)
if (OUT) await page.screenshot({ path: `${OUT}/e2e-1-basket.png` })

await check('step 1 lists the configured item', async () =>
  (await page.getByText('24k edible gold leaf').first().isVisible()),
)

await page.getByRole('button', { name: 'Continue' }).click()
await page.waitForTimeout(500)

// leave the address blank on purpose — validation must stop us here
await page.getByRole('button', { name: 'Continue' }).click()
await page.waitForTimeout(400)
await check('blank delivery address blocks the step', async () =>
  page.getByText(/street, building or landmark to find you/i).isVisible(),
)

await page.getByLabel(/Street, building or landmark/).fill('KG 11 Ave, Ikaze House, 3rd floor')
await page.getByRole('button', { name: 'Continue' }).click()
await page.waitForTimeout(500)

await page.getByLabel('Full name').fill('Keza Uwase')
await page.getByLabel(/Phone \/ WhatsApp/).fill('0755 000 111')
await page.getByRole('button', { name: 'Continue' }).click()
await page.waitForTimeout(400)
await check('an invalid Rwandan number is rejected', async () =>
  page.getByText(/valid Rwandan number/i).isVisible(),
)

await page.getByLabel(/Phone \/ WhatsApp/).fill('0788 722 064')
await page.locator('#email').fill('keza@example.com')

// This basket is over the deposit threshold, so the acknowledgement is required.
await page.getByRole('button', { name: 'Continue' }).click()
await page.waitForTimeout(400)
// The percentage is a live setting, so match the sentence, not the number.
await check('the deposit acknowledgement is enforced', async () =>
  page.getByText(/acknowledge the \d+% deposit/i).isVisible(),
)
await page.locator('label:has(input[type="checkbox"])').filter({ hasText: 'I understand this order' }).click()
await page.waitForTimeout(300)
console.log('  deposit checked =', await page.locator('input[type="checkbox"]').first().isChecked())
await page.getByRole('button', { name: 'Continue' }).click()
await page.waitForTimeout(600)

await check('review step shows the contact details', async () =>
  (await page.getByText('Keza Uwase').first().isVisible()) &&
  (await page.getByText('KG 11 Ave, Ikaze House, 3rd floor').first().isVisible()),
)
if (OUT) await page.screenshot({ path: `${OUT}/e2e-2-review.png` })

// 3 — submit. This runs with or without an API behind the preview server: the
//     customer must land on a real confirmation either way.
await page.getByRole('button', { name: /Place order/ }).click()
await page.waitForURL('**/order/confirmed/**', { timeout: 15000 })
await page.waitForTimeout(1500)

const code = page.url().split('/').pop()
await check('confirmation issues an order code', () => /^DBL-[A-Z0-9]{7}$/.test(code))
await check('confirmation shows the customer name', async () =>
  page.getByText(/Thank you, Keza/).isVisible(),
)
await check('the confirmation shows what was ordered', async () =>
  (await page.getByText('Signature Chocolate Drip').first().isVisible()) &&
  (await page.getByText(/RWF/).first().isVisible()),
)
await check('an unreachable API is disclosed rather than hidden', async () => {
  // When the order could not be stored the page must say so and offer WhatsApp;
  // when it was stored, that warning must be absent.
  const warned = await page.getByText(/could not reach our kitchen dashboard/i).count()
  const tracked = await page.getByRole('link', { name: /Track this order/ }).count()
  return warned === 0 ? tracked > 0 : true
})
if (OUT) await page.screenshot({ path: `${OUT}/e2e-3-confirmed.png`, fullPage: false })

// 4 — the code must resolve in the public tracker
await page.goto(`${BASE}/track/${code}`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await check('the order is findable in the tracker', async () =>
  (await page.getByText(`Order ${code}`).isVisible()) &&
  (await page.getByText('Signature Chocolate Drip').first().isVisible()),
)
if (OUT) await page.screenshot({ path: `${OUT}/e2e-4-track.png` })

// 5 — the basket must be empty again after checkout
await page.goto(`${BASE}/order`, { waitUntil: 'networkidle' })
await page.waitForTimeout(800)
await check('the basket is cleared after ordering', async () =>
  page.getByText(/Your basket is empty/).isVisible(),
)


// 6 — the two looks
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
await check('the site starts on the bright look', async () =>
  (await page.evaluate(() => document.documentElement.getAttribute('data-theme'))) === 'bright',
)
await page.getByRole('switch').first().click()
await page.waitForTimeout(900)
await check('the switch moves it to chocolate', async () =>
  (await page.evaluate(() => document.documentElement.getAttribute('data-theme'))) === 'chocolate',
)
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
await check('the choice survives a reload', async () =>
  (await page.evaluate(() => document.documentElement.getAttribute('data-theme'))) === 'chocolate',
)
await page.getByRole('switch').first().click()
await page.waitForTimeout(700)

console.log(errors.length ? `\nPAGE ERRORS:\n${[...new Set(errors)].join('\n')}` : '\nno page errors')
console.log(failures === 0 ? 'All E2E checks passed.' : `${failures} check(s) failed.`)

await browser.close()
process.exit(failures === 0 ? 0 : 1)
