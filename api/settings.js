import { getSetting, saveSetting, storageMode } from './_lib/db.js'
import { SETTINGS_KEY, defaultSettings, seedIfEmpty } from './_lib/seed.js'
import { sanitiseSettings } from './_lib/product.js'
import { applyCors, adminConfigured, isAdmin, readBody, sendJson } from './_lib/http.js'

export default async function handler(req, res) {
  if (applyCors(req, res)) return

  if (req.method === 'GET') {
    try {
      await seedIfEmpty()
      const settings = await getSetting(SETTINGS_KEY)
      return sendJson(res, 200, {
        settings: settings || defaultSettings(),
        storage: storageMode(),
        secured: adminConfigured(),
      })
    } catch (error) {
      return sendJson(res, 200, {
        settings: defaultSettings(),
        storage: storageMode(),
        error: error.message || 'Could not load settings',
      })
    }
  }

  if (req.method === 'PATCH' || req.method === 'PUT') {
    if (!isAdmin(req)) return sendJson(res, 401, { error: 'Invalid admin key' })

    try {
      const current = (await getSetting(SETTINGS_KEY)) || defaultSettings()
      const next = sanitiseSettings(readBody(req), current)
      await saveSetting(SETTINGS_KEY, next)
      return sendJson(res, 200, { settings: next })
    } catch (error) {
      return sendJson(res, 500, { error: error.message || 'Could not save settings' })
    }
  }

  /* Restores every setting to the values shipped in the repo. */
  if (req.method === 'DELETE') {
    if (!isAdmin(req)) return sendJson(res, 401, { error: 'Invalid admin key' })
    try {
      const restored = defaultSettings()
      await saveSetting(SETTINGS_KEY, restored)
      return sendJson(res, 200, { settings: restored })
    } catch (error) {
      return sendJson(res, 500, { error: error.message || 'Could not reset settings' })
    }
  }

  res.setHeader('Allow', 'GET, PATCH, PUT, DELETE, OPTIONS')
  return sendJson(res, 405, { error: 'Method not allowed' })
}
