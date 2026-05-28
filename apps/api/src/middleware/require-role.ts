import { createMiddleware } from 'hono/factory'
import { ForbiddenError } from '../lib/errors.js'
import type { AuthVariables } from './auth.js'

// Gate an endpoint to a subset of roles. Must run AFTER auth() so c.get('role')
// is populated. See security.md §5.
export const requireRole = (...allowed: AuthVariables['role'][]) =>
  createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
    const role = c.get('role')
    if (!allowed.includes(role)) {
      throw new ForbiddenError(`Requires role: ${allowed.join(' or ')}`)
    }
    await next()
  })
