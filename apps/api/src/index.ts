import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { requestId } from 'hono/request-id'
import { secureHeaders } from 'hono/secure-headers'
import { cors } from 'hono/cors'
import { bodyLimit } from 'hono/body-limit'
import { timeout } from 'hono/timeout'
import { config } from './config.js'
import { logger } from './lib/logger.js'
import { errorHandler } from './middleware/error.js'
import { healthRoutes } from './routes/health.js'

const app = new Hono()

app.use('*', requestId())
app.use('*', secureHeaders())
app.use(
  '*',
  cors({
    origin: (origin) => {
      const allowed = ['https://knuteloop.no', 'https://app.knuteloop.no']
      if (config.NODE_ENV === 'development') return origin ?? '*'
      return allowed.includes(origin) ? origin : null
    },
    credentials: true,
  }),
)
app.use('*', bodyLimit({ maxSize: 10 * 1024 * 1024 }))
app.use('*', timeout(30_000))

app.route('/healthz', healthRoutes)

app.onError(errorHandler)

serve({ fetch: app.fetch, port: config.PORT }, (info) => {
  logger.info({ port: info.port, env: config.NODE_ENV }, 'api server listening')
})
