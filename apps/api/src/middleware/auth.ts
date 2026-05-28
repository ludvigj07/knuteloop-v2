import { createMiddleware } from 'hono/factory'
import { UnauthorizedError } from '../lib/errors.js'
import { verifyDevToken } from '../lib/auth-dev.js'

export type AuthVariables = {
  userId: string
  schoolId: string
  role: 'student' | 'knutesjef' | 'admin'
}

// Verifies the Authorization: Bearer <token> header and sets userId, schoolId,
// role on the request context. Currently uses HS256 dev tokens (lib/auth-dev.ts).
// When Entra ID is wired up, swap verifyDevToken for the real JWKS verifier —
// nothing else here changes. TODO: add token_version check against users table
// once the login endpoint exists (security.md §2 + §13).
export const auth = () =>
  createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
    const header = c.req.header('Authorization')
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing Bearer token')
    }

    const token = header.slice('Bearer '.length).trim()
    try {
      const claims = await verifyDevToken(token)
      c.set('userId', claims.sub)
      c.set('schoolId', claims.school_id)
      c.set('role', claims.role)
    } catch {
      throw new UnauthorizedError('Invalid token')
    }

    await next()
  })
