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

/* A phone starts on the still and never loads the player unless asked. */
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  let playerRequested = false
  await page.route('https://www.youtube-nocookie.com/**', (route) => {
    playerRequested = true
    route.fulfill({ status: 200, contentType: 'text/html', body: FAKE_PLAYER })
  })
  await page.route('https://images.unsplash.com/**', serveStill)
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(4000)
  check('phone: the player is not downloaded on arrival', playerRequested === false)
  check(
    'phone: the film control offers to play',
    await page.getByRole('button', { name: 'Play the background film' }).isVisible(),
  )
  await page.screenshot({ path: OUT ? `${OUT}/film-phone-still.png` : undefined })

  await page.getByRole('button', { name: 'Play the background film' }).click()
  await page.waitForTimeout(4000)
  check('phone: tapping play loads the film', playerRequested === true)
  const g = await scanForBars(page)
  check('phone: it fades in once playing', Number(g.opacity) > 0.95, g.opacity)
  check(
    'phone: the picture covers its band',
    g.picture.top <= g.layer.top && g.picture.bottom >= g.layer.bottom,
    JSON.stringify(g),
  )
  await page.screenshot({ path: OUT ? `${OUT}/film-phone-playing.png` : undefined })
  await page.close()
}

/* A player that refuses autoplay must leave the still up, not a black box. */
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const refusing = FAKE_PLAYER.replace("info:1}), '*'), ", "info:5}), '*'), ")
  await page.route('https://www.youtube-nocookie.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: refusing }),
  )
  await page.route('https://images.unsplash.com/**', serveStill)
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('iframe.hero-film-frame', { state: 'attached', timeout: 8000 })
  await page.waitForTimeout(11000)
  const g = await scanForBars(page)
  check('refused autoplay: the black player never shows', Number(g.opacity) < 0.05, g.opacity)
  check(
    'refused autoplay: the button falls back to Play',
    await page.getByRole('button', { name: 'Play the background film' }).isVisible(),
  )
  await page.close()
}

await browser.close()
console.log(failures === 0 ? '\nAll film checks passed.' : `\n${failures} film check(s) failed.`)
process.exit(failures ? 1 : 0)
