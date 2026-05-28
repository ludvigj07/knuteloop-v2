import { serve } from '@hono/node-server'
import { buildApp } from './app.js'
import { config } from './config.js'
import { logger } from './lib/logger.js'

const app = buildApp()

serve({ fetch: app.fetch, port: config.PORT }, (info) => {
  logger.info({ port: info.port, env: config.NODE_ENV }, 'api server listening')
})
