import { Hono } from 'hono'
import { isValidImageKey, readLocalImage, sniffImageType, writeLocalImage } from '../lib/storage.js'

// DEV-ONLY local image store. Mounted at /uploads ONLY when STORAGE_DRIVER=local
// (see app.ts) — in production Bunny serves images, and this route does not exist.
// PUT writes the bytes, GET serves them. No auth: keys are random UUIDs the
// upload-url endpoint just issued (unguessable), and this never runs in prod.
export const uploadRoutes = new Hono()
  .put('/:key{.+}', async (c) => {
    const key = c.req.param('key')
    if (!isValidImageKey(key)) {
      return c.json({ error: { message: 'Invalid image key' } }, 400)
    }
    const body = await c.req.arrayBuffer()
    if (body.byteLength === 0) {
      return c.json({ error: { message: 'Empty body' } }, 400)
    }
    await writeLocalImage(key, new Uint8Array(body))
    return c.body(null, 204)
  })
  .get('/:key{.+}', async (c) => {
    const key = c.req.param('key')
    if (!isValidImageKey(key)) {
      return c.json({ error: { message: 'Invalid image key' } }, 400)
    }
    const bytes = await readLocalImage(key)
    if (!bytes) {
      return c.json({ error: { message: 'Not found' } }, 404)
    }
    return new Response(bytes, {
      headers: {
        // Serve the REAL type (the upload may be PNG even though the client said
        // jpeg) so nosniff browsers render it instead of blocking it.
        'Content-Type': sniffImageType(bytes),
        'Cache-Control': 'public, max-age=31536000, immutable',
        // Loaded from a different origin than the web client (Metro → API), so
        // permit it. (secureHeaders is skipped for /uploads in app.ts.)
        'Cross-Origin-Resource-Policy': 'cross-origin',
      },
    })
  })
