import { HTTPException } from 'hono/http-exception'

export class ValidationError extends HTTPException {
  constructor(message: string, cause?: unknown) {
    super(400, { message, cause })
  }
}

export class UnauthorizedError extends HTTPException {
  constructor(message = 'Not authenticated') {
    super(401, { message })
  }
}

export class ForbiddenError extends HTTPException {
  constructor(message = 'Not authorized') {
    super(403, { message })
  }
}

export class NotFoundError extends HTTPException {
  constructor(resource: string) {
    super(404, { message: `${resource} not found` })
  }
}

export class ConflictError extends HTTPException {
  constructor(message: string) {
    super(409, { message })
  }
}

export class RateLimitError extends HTTPException {
  constructor() {
    super(429, { message: 'Too many requests' })
  }
}

// True for a Postgres unique-constraint violation (SQLSTATE 23505). Lets a service
// translate a lost check-then-insert race into a clean domain error (e.g. 409) instead
// of letting the raw DB error surface as a 500.
export function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === '23505'
}
