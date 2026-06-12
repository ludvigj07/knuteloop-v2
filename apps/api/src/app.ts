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

export function buildApp() {
  const app = new Hono()

  app.use('*', requestId())
  app.use('*', secureHeaders())
  app.use(
    '*',
    cors({
      origin: (origin) => {
        const allowed = ['https://knuteloop.no', 'https://app.knuteloop.no']
        if (config.NODE_ENV !== 'production') return origin ?? '*'
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

  app.onError(errorHandler)

  return app
}
