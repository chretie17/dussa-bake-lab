/**
 * Local stand-in for Vercel's serverless runtime.
 *
 *   npm run dev:api      # serves /api on http://localhost:3000
 *   npm run dev          # Vite on :5173, proxying /api to :3000
 *
 * It loads the same handlers Vercel deploys, so behaviour matches production.
 * Without DATABASE_URL the handlers use their in-memory store, which persists
 * for as long as this process runs — handy for trying the dashboard offline.
 */
import http from 'node:http'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// Load .env.local / .env so a real DATABASE_URL is picked up when present.
for (const file of ['.env.local', '.env']) {
  try {
    for (const line of readFileSync(join(root, file), 'utf8').split('\n')) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (!match) continue
      const [, key, raw] = match
      if (process.env[key]) continue
      process.env[key] = raw.replace(/^["']|["']$/g, '')
    }
  } catch {
    /* no env file — defaults apply */
  }
}

const routes = [
  { pattern: /^\/api\/orders\/([^/]+)$/, module: '../api/orders/[code].js', params: ['code'] },
  { pattern: /^\/api\/orders$/, module: '../api/orders.js', params: [] },
  { pattern: /^\/api\/catalog\/([^/]+)$/, module: '../api/catalog/[slug].js', params: ['slug'] },
  { pattern: /^\/api\/catalog$/, module: '../api/catalog.js', params: [] },
  { pattern: /^\/api\/images\/([^/]+)$/, module: '../api/images/[id].js', params: ['id'] },
  { pattern: /^\/api\/images$/, module: '../api/images.js', params: [] },
  { pattern: /^\/api\/settings$/, module: '../api/settings.js', params: [] },
  { pattern: /^\/api\/whatsapp-check$/, module: '../api/whatsapp-check.js', params: [] },
  { pattern: /^\/api\/whatsapp$/, module: '../api/whatsapp.js', params: [] },
  { pattern: /^\/api\/health$/, module: '../api/health.js', params: [] },
]

function readBody(req) {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
    })
    req.on('end', () => resolve(data))
  })
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost')
  const route = routes.find((r) => r.pattern.test(url.pathname))

  if (!route) {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: `No API route for ${url.pathname}` }))
    return
  }

  const match = url.pathname.match(route.pattern)
  const query = Object.fromEntries(url.searchParams)
  route.params.forEach((name, i) => {
    query[name] = decodeURIComponent(match[i + 1])
  })

  const raw = await readBody(req)
  let body = {}
  if (raw) {
    try {
      body = JSON.parse(raw)
    } catch {
      body = {}
    }
  }

  // Shim the small slice of Vercel's req/res contract the handlers rely on.
  req.query = query
  req.body = body
  res.status = (code) => {
    res.statusCode = code
    return res
  }
  res.send = (payload) => {
    res.end(payload)
    return res
  }

  try {
    const { default: handler } = await import(route.module)
    await handler(req, res)
  } catch (error) {
    console.error(`[dev-api] ${req.method} ${url.pathname} failed:`, error)
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: error.message }))
    }
  }
})

const port = Number(process.env.API_PORT) || 3000
server.listen(port, () => {
  const mode = process.env.DATABASE_URL ? 'postgres' : 'in-memory (not durable)'
  console.log(`API listening on http://localhost:${port}  ·  storage: ${mode}`)
})
