import { chromium } from 'playwright'

/**
 * Stands in for YouTube's player, faithfully in the two ways that matter:
 *  - a 2.39:1 picture (bright green here) letterboxed with BLACK bars inside
 *    whatever box it is given, exactly as YouTube does with cinemascope;
 *  - it only reports PLAYING over postMessage some time after it has loaded.
 */
const FAKE_PLAYER = `<!doctype html><html><head><style>
  html,body{margin:0;height:100%;background:#000;overflow:hidden}
  #pic{position:absolute;inset:0;margin:auto;background:#2ecc71;
       width:100vw;height:calc(100vw / 2.39);max-height:100vh;max-width:calc(100vh * 2.39)}
</style></head><body><div id="pic"></div><script>
  let told = false
  addEventListener('message', (e) => {
    let d; try { d = JSON.parse(e.data) } catch { return }
    if (d.event === 'listening' && !told) {
      told = true
      parent.postMessage(JSON.stringify({event:'onReady'}), '*')
      setTimeout(() => parent.postMessage(JSON.stringify({event:'infoDelivery',info:{playerState:3}}), '*'), 300)
      setTimeout(() => parent.postMessage(JSON.stringify({event:'onStateChange',info:1}), '*'), ${Number(process.env.PLAY_DELAY || 1500)})
    }
    if (d.event === 'command' && d.func === 'pauseVideo') parent.postMessage(JSON.stringify({event:'onStateChange',info:2}), '*')
    if (d.event === 'command' && d.func === 'playVideo') parent.postMessage(JSON.stringify({event:'onStateChange',info:1}), '*')
  })
  // A tap inside the player starts it, which is the only thing that works
  // once a phone has refused autoplay.
  addEventListener('click', () => {
    window.__tapped = true
    parent.postMessage(JSON.stringify({event:'onStateChange',info:1}), '*')
  })
</script></body></html>`

const STILL = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000"><defs>
<radialGradient id="g" cx="62%" cy="42%" r="70%"><stop offset="0" stop-color="#e8b98a"/>
<stop offset=".45" stop-color="#8a5532"/><stop offset="1" stop-color="#2a160c"/></radialGradient></defs>
<rect width="1600" height="1000" fill="url(#g)"/><ellipse cx="1000" cy="520" rx="330" ry="250" fill="#5a3019" opacity=".85"/>
<ellipse cx="1000" cy="380" rx="330" ry="90" fill="#f3e2c8"/></svg>`
const serveStill = (route) => route.fulfill({ status: 200, contentType: 'image/svg+xml', body: STILL })

const OUT = process.env.SHOT_DIR
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH })
let failures = 0
const check = (label, ok, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : ` :: ${extra}`}`)
  if (!ok) failures += 1
}

async function scanForBars(page) {
  // Black means letterbox. Scan rows across the right of the hero (the side
  // with the least shading) and report any row that is near-black.
  return page.evaluate(async () => {
    const section = document.querySelector('section[aria-labelledby="home-hero-title"]')
    const frame = section.querySelector('iframe')
    const r = section.getBoundingClientRect()
    const fr = frame.getBoundingClientRect()
    const layer = section.querySelector('.hero-film-layer').getBoundingClientRect()
    // Where would the picture be inside the frame? (letterboxed by width)
    const picH = Math.min(fr.height, fr.width / 2.39)
    const picTop = fr.top + (fr.height - picH) / 2
    return {
      layer: { top: layer.top, bottom: layer.bottom, left: layer.left, right: layer.right },
      frame: { w: Math.round(fr.width), h: Math.round(fr.height) },
      picture: { top: Math.round(picTop), bottom: Math.round(picTop + picH) },
      section: { h: Math.round(r.height) },
      opacity: getComputedStyle(frame).opacity,
    }
  })
}

for (const [label, viewport] of [
  ['desktop-wide', { width: 1896, height: 1018 }],
  ['laptop-short', { width: 1280, height: 620 }],
  ['ultrawide', { width: 2560, height: 900 }],
  ['tablet', { width: 820, height: 1180 }],
]) {
  const page = await browser.newPage({ viewport })
  await page.route('https://www.youtube-nocookie.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: FAKE_PLAYER }),
  )
  await page.route('https://images.unsplash.com/**', serveStill)
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' })

  // Before PLAYING is reported the film must be invisible: no black player flash.
  await page.waitForSelector('iframe.hero-film-frame', { state: 'attached', timeout: 8000 })
  await page.waitForTimeout(700)
  const early = await scanForBars(page)
  check(`${label}: the player is hidden until it reports playing`, Number(early.opacity) < 0.05, early.opacity)

  await page.waitForTimeout(3200)
  const g = await scanForBars(page)
  check(`${label}: the film fades in once playing`, Number(g.opacity) > 0.95, g.opacity)
  check(
    `${label}: the picture covers the film area top to bottom`,
    g.picture.top <= g.layer.top && g.picture.bottom >= g.layer.bottom,
    JSON.stringify(g),
  )
  check(
    `${label}: and side to side`,
    g.frame.w >= g.layer.right - g.layer.left,
    JSON.stringify(g),
  )

  // And by pixels, in case the maths above is wrong: no near-black rows in the
  // shade-light right-hand strip of the hero.
  const shot = await page.screenshot({ path: OUT ? `${OUT}/film-${label}.png` : undefined })
  const darkRows = await page.evaluate(async (b64) => {
    const img = new Image()
    img.src = `data:image/png;base64,${b64}`
    await img.decode()
    const c = document.createElement('canvas')
    c.width = img.width
    c.height = img.height
    const ctx = c.getContext('2d')
    ctx.drawImage(img, 0, 0)
    const section = document.querySelector('section[aria-labelledby="home-hero-title"]')
    const h = Math.min(section.getBoundingClientRect().height, img.height)
    const x0 = Math.floor(img.width * 0.86)
    const rows = []
    for (let y = 2; y < h - 2; y += 6) {
      const d = ctx.getImageData(x0, y, Math.floor(img.width * 0.12), 1).data
      let green = 0
      for (let i = 0; i < d.length; i += 4) green += d[i + 1]
      rows.push(green / (d.length / 4))
    }
    // Green channel is ~200 under the picture; a black bar under any of our
    // shading stays below ~12.
    return rows.filter((v) => v < 12).length
  }, shot.toString('base64'))
  check(`${label}: no black letterbox rows on screen`, darkRows === 0, `${darkRows} dark rows`)

  // On a normal-height screen the whole hero fits, film control included.
  // Measured before any click: clicking scrolls the button into view first.
  if (viewport.height >= 800) {
    const control = await page.getByRole('button', { name: /background film/ }).boundingBox()
    check(
      `${label}: the film control is on screen without scrolling`,
      control && control.y + control.height <= viewport.height,
      JSON.stringify(control),
    )
  }

  // Pausing must go back to the still, not to YouTube's pause screen.
  await page.getByRole('button', { name: 'Pause the background film' }).click()
  await page.waitForTimeout(1900)
  const paused = await scanForBars(page)
  check(`${label}: pausing fades back to the still`, Number(paused.opacity) < 0.05, paused.opacity)
  await page.getByRole('button', { name: 'Play the background film' }).click()
  await page.waitForTimeout(1900)
  const resumed = await scanForBars(page)
  check(`${label}: playing again fades the film back in`, Number(resumed.opacity) > 0.95, resumed.opacity)

  await page.close()
}

/* Phones play the film too, in the band above the copy. */
{
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  })
  let playerRequested = false
  await page.route('https://www.youtube-nocookie.com/**', (route) => {
    playerRequested = true
    route.fulfill({ status: 200, contentType: 'text/html', body: FAKE_PLAYER })
  })
  await page.route('https://images.unsplash.com/**', serveStill)
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(4500)

  check('phone: the film starts by itself', playerRequested === true)
  const g = await scanForBars(page)
  check('phone: it fades in once playing', Number(g.opacity) > 0.95, g.opacity)
  check(
    'phone: the picture covers its band with no bars',
    g.picture.top <= g.layer.top && g.picture.bottom >= g.layer.bottom,
    JSON.stringify(g),
  )

  const control = page.getByRole('button', { name: 'Pause the background film' })
  check('phone: a pause control is on the film', await control.isVisible())
  const box = await control.boundingBox()
  const copyTop = await page.evaluate(
    () => document.querySelector('#home-hero-title').closest('div').getBoundingClientRect().top,
  )
  check(
    'phone: the control sits on the film, above the copy',
    box && box.y + box.height <= copyTop + 1,
    JSON.stringify({ box, copyTop }),
  )
  const cta = await page.getByRole('link', { name: /Order your cake/ }).boundingBox()
  check(
    'phone: Order your cake is on screen on arrival',
    cta && cta.y + cta.height <= 844,
    JSON.stringify(cta),
  )
  check(
    'phone: the menu is a quiet link, not a second pill',
    await page.getByRole('link', { name: 'Explore the menu' }).isVisible(),
  )
  await page.screenshot({ path: OUT ? `${OUT}/film-phone-playing.png` : undefined })
  await page.close()
}

/* Save-data on a phone keeps the still and does not stream anything. */
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true })
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'connection', {
      value: { saveData: true, effectiveType: '4g' },
      configurable: true,
    })
  })
  let playerRequested = false
  await page.route('https://www.youtube-nocookie.com/**', (route) => {
    playerRequested = true
    route.fulfill({ status: 200, contentType: 'text/html', body: FAKE_PLAYER })
  })
  await page.route('https://images.unsplash.com/**', serveStill)
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3500)
  check('save-data: nothing is streamed', playerRequested === false)
  check(
    'save-data: a play control is offered instead',
    await page.getByRole('button', { name: 'Play the background film' }).isVisible(),
  )
  await page.close()
}

/* Autoplay refused (Low Power Mode, in-app browsers): the tap must reach the
   player itself, because a tap on our own button cannot start it. */
for (const [label, viewport, mobile] of [
  ['phone', { width: 390, height: 844 }, true],
  ['desktop', { width: 1440, height: 900 }, false],
]) {
  const page = await browser.newPage({ viewport, isMobile: mobile, hasTouch: mobile })
  const refusing = FAKE_PLAYER.replace("info:1}), '*'), ", "info:5}), '*'), ")
  await page.route('https://www.youtube-nocookie.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: refusing }),
  )
  await page.route('https://images.unsplash.com/**', serveStill)
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('iframe.hero-film-frame', { state: 'attached', timeout: 8000 })
  await page.waitForTimeout(3000)
  const before = await scanForBars(page)
  check(`refused ${label}: nothing is revealed while we wait`, Number(before.opacity) < 0.05, before.opacity)

  await page.waitForTimeout(6500)
  const g = await scanForBars(page)
  check(`refused ${label}: the player is shown so it can be tapped`, Number(g.opacity) > 0.95, g.opacity)
  check(
    `refused ${label}: a hint says to tap the film`,
    (await page.getByText('Tap the film to play').filter({ visible: true }).count()) === 1,
  )

  // Somewhere on the film clear of the copy, the topmost element must be the
  // player — otherwise the copy column or a shade swallows the tap.
  const spot = await page.evaluate(() => {
    const layer = document.querySelector('.hero-film-layer').getBoundingClientRect()
    const copy = document.querySelector('#home-hero-title').closest('div').getBoundingClientRect()
    const x = Math.round(layer.left + layer.width * (window.innerWidth < 768 ? 0.5 : 0.78))
    const y = Math.round(
      window.innerWidth < 768 ? layer.top + (copy.top - layer.top) * 0.55 : layer.top + layer.height * 0.5,
    )
    const hit = document.elementFromPoint(x, y)
    return { x, y, hit: hit?.tagName, cls: hit?.className?.toString?.() || '' }
  })
  check(
    `refused ${label}: a tap on the film reaches the player`,
    spot.hit === 'IFRAME',
    JSON.stringify(spot),
  )

  if (mobile) await page.touchscreen.tap(spot.x, spot.y)
  else await page.mouse.click(spot.x, spot.y)
  await page.waitForTimeout(1500)
  check(
    `refused ${label}: the tap starts the film and the normal control returns`,
    await page.getByRole('button', { name: 'Pause the background film' }).isVisible(),
  )
  await page.screenshot({ path: OUT ? `${OUT}/film-refused-${label}.png` : undefined })
  await page.close()
}

await browser.close()
console.log(failures === 0 ? '\nAll film checks passed.' : `\n${failures} film check(s) failed.`)
process.exit(failures ? 1 : 0)
