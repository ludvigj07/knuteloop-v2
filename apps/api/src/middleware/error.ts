import type { ErrorHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { logger } from '../lib/logger.js'

export const errorHandler: ErrorHandler = (err, c) => {
  const requestId = c.get('requestId')

  if (err instanceof HTTPException) {
    logger.warn(
      { requestId, status: err.status, msg: err.message },
      'http exception',
    )
    return c.json(
      { error: { message: err.message, requestId } },
      err.status,
    )
  }

  logger.error(
    { requestId, err: err.message, stack: err.stack },
    'unhandled error',
  )
  return c.json(
    { error: { message: 'Internal Server Error', requestId } },
    500,
  )
}
