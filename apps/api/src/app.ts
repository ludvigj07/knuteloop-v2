import { Hono } from 'hono'
import { requestId } from 'hono/request-id'
import { secureHeaders } from 'hono/secure-headers'
import { cors } from 'hono/cors'
import { bodyLimit } from 'hono/body-limit'
import { timeout } from 'hono/timeout'
import { config } from './config.js'
import { errorHandler } from './middleware/error.js'
import { healthRoutes } from './routes/health.js'
import { knuterRoutes } from './routes/knuter.js'
import { submissionRoutes } from './routes/submissions.js'
import { feedRoutes } from './routes/feed.js'
import { leaderboardRoutes } from './routes/leaderboard.js'
import { meRoutes } from './routes/me.js'
import { devRoutes } from './routes/dev.js'
import { uploadRoutes } from './routes/uploads.js'

// Dev-only surfaces (the /api/dev identity switcher + relaxed CORS) mount ONLY in
// explicitly-known dev/test environments. Fail-CLOSED: an unexpected NODE_ENV is
// treated as production. The one residual fail-open is NODE_ENV being UNSET —
// config.ts defaults it to 'development'. SECURITY: any non-local deploy MUST set
// NODE_ENV=production AND a real JWT_DEV_SECRET (config.ts refuses the committed
// default in prod). The durable fix is the real-auth epic (RS256/JWKS, Vipps).
export function isDevEnv(nodeEnv: string): boolean {
  return nodeEnv === 'development' || nodeEnv === 'test'
}

export function buildApp() {
  const app = new Hono()

  app.use('*', requestId())
  // secureHeaders sets X-Content-Type-Options: nosniff and CORP: same-origin, which
  // block the dev image route (mismatched type / cross-origin load from the web
  // client). The /uploads route sets its own headers, so skip security headers there.
  const secure = secureHeaders()
  app.use('*', (c, next) => (c.req.path.startsWith('/uploads/') ? next() : secure(c, next)))
  app.use(
    '*',
    cors({
      origin: (origin) => {
        const allowed = ['https://knuteloop.no', 'https://app.knuteloop.no']
        if (isDevEnv(config.NODE_ENV)) return origin ?? '*'
        return allowed.includes(origin) ? origin : null
      },
      credentials: true,
    }),
  )
  app.use('*', bodyLimit({ maxSize: 10 * 1024 * 1024 }))
  app.use('*', timeout(30_000))

  app.route('/healthz', healthRoutes)
  app.route('/api/knuter', knuterRoutes)
  app.route('/api/submissions', submissionRoutes)
  app.route('/api/feed', feedRoutes)
  app.route('/api/leaderboard', leaderboardRoutes)
  app.route('/api/me', meRoutes)

  // Local image store (PUT/GET) — only when STORAGE_DRIVER=local (dev). In prod,
  // STORAGE_DRIVER=bunny and images are served by Bunny CDN, so this never mounts.
  if (config.STORAGE_DRIVER === 'local') {
    app.route('/uploads', uploadRoutes)
  }

  // Dev-only identity switcher for local testing — NEVER mounted outside dev/test.
  if (isDevEnv(config.NODE_ENV)) {
    app.route('/api/dev', devRoutes)
  }

  app.onError(errorHandler)

  return app
}
