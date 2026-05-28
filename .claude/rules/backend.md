<!--
LOADING: This file is pulled in by apps/api/CLAUDE.md via @-import, which Claude Code
loads automatically when you work under apps/api/. The Cursor-style "globs" frontmatter
below is documentation of intent only — Claude Code does NOT auto-load by glob. If you
ever switch to Cursor, the frontmatter makes these work as native .cursor/rules.
-->
---
description: Backend rules for Hono + Drizzle + PostgreSQL. Loaded via apps/api/CLAUDE.md.
globs:
  - apps/api/**
  - packages/shared/**
---

# Backend Rules — Knuteloop v2

This file defines the production-grade backend patterns for Knuteloop. **Read this in full before writing backend code.** Ludvig cannot catch backend mistakes himself — you are the senior engineer here.

---

## 1. The mental model

Hono is a thin router. Everything important happens in middleware chains and the data layer. The job is to make every request:

1. Identified (request ID)
2. Logged (structured)
3. Secured (headers, CORS, body size, timeout)
4. Authenticated (JWT validated against Entra ID JWKS)
5. Authorized (role check)
6. Tenant-scoped (`school_id` set in JWT, propagated to DB session)
7. Rate-limited (per user)
8. Validated (Zod on input)
9. Handled (business logic in a transaction if multi-table)
10. Errored gracefully (typed errors → `app.onError`)

If any step is skipped, that's a bug — even if the endpoint "works."

---

## 2. Project structure (non-negotiable)

```
apps/api/
├── src/
│   ├── index.ts                    # entry: build app, register middleware, mount routes
│   ├── config.ts                   # typed env via Zod
│   ├── db/
│   │   ├── client.ts               # postgres.js + drizzle instance
│   │   ├── schema/                 # one file per table group
│   │   │   ├── schools.ts
│   │   │   ├── users.ts
│   │   │   ├── knuter.ts
│   │   │   ├── submissions.ts
│   │   │   ├── sponsors.ts
│   │   │   └── index.ts            # barrel export
│   │   └── migrations/             # drizzle-kit output (DO NOT edit by hand once committed)
│   ├── middleware/
│   │   ├── request-id.ts
│   │   ├── logger.ts
│   │   ├── auth.ts                 # JWT verification via jose
│   │   ├── tenant-context.ts       # sets app.school_id on DB session
│   │   ├── rate-limit.ts
│   │   └── error.ts                # app.onError handler
│   ├── routes/                     # ONE FILE PER RESOURCE
│   │   ├── auth.ts
│   │   ├── knuter.ts
│   │   ├── submissions.ts
│   │   ├── sponsors.ts
│   │   ├── feed.ts
│   │   ├── leaderboard.ts
│   │   └── admin/
│   │       ├── schools.ts
│   │       ├── users.ts
│   │       └── reports.ts
│   ├── lib/
│   │   ├── logger.ts               # Pino with redact paths
│   │   ├── errors.ts               # typed HTTPException subclasses
│   │   ├── jose.ts                 # JWKS cache + verify helper
│   │   └── bunny.ts                # storage client
│   └── test/
│       ├── helpers/
│       │   ├── test-db.ts          # testcontainer Postgres
│       │   └── test-app.ts         # build app with test config
│       └── integration/
│           ├── rls.test.ts         # THE most important test file
│           ├── auth.test.ts
│           └── submissions.test.ts
```

**Rules:**
- One resource per route file. When `knuter.ts` exceeds 300 lines, split by sub-resource.
- Routes are PURE handlers — no business logic. Business logic in `lib/<resource>-service.ts` if it grows beyond simple CRUD.
- The DB schema directory is the source of truth for types. Infer Zod schemas from Drizzle schemas via `drizzle-zod` so input validation and DB types can never drift.

---

## 3. The Hono app skeleton (canonical)

```ts
// apps/api/src/index.ts
import { Hono } from 'hono'
import { requestId } from 'hono/request-id'
import { secureHeaders } from 'hono/secure-headers'
import { cors } from 'hono/cors'
import { bodyLimit } from 'hono/body-limit'
import { timeout } from 'hono/timeout'
import { loggerMiddleware } from './middleware/logger'
import { errorHandler } from './middleware/error'
import { authRoutes } from './routes/auth'
import { knuterRoutes } from './routes/knuter'
// ...

const app = new Hono()

// Middleware order matters — read top to bottom = request flow
app.use('*', requestId())
app.use('*', loggerMiddleware)
app.use('*', secureHeaders())
app.use('*', cors({
  origin: (origin) => {
    const allowed = ['https://knuteloop.no', 'https://app.knuteloop.no']
    return allowed.includes(origin) ? origin : null
  },
  credentials: true,
}))
app.use('*', bodyLimit({ maxSize: 10 * 1024 * 1024 })) // 10MB cap
app.use('*', timeout(30_000))

// Mount routes — each handles its own auth + tenant + validation
app.route('/api/auth', authRoutes)
app.route('/api/knuter', knuterRoutes)
// ...

// app.onError MUST be registered last
app.onError(errorHandler)

export default app
```

**Critical:** middleware registered with `app.use('*', ...)` runs for ALL routes. Auth + tenant middleware are mounted **inside route groups**, not globally — because `/api/auth/login` doesn't have a tenant yet.

---

## 4. Error handling — the only pattern that survives production

Define typed errors:

```ts
// apps/api/src/lib/errors.ts
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
```

Global error handler:

```ts
// apps/api/src/middleware/error.ts
import { ErrorHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { logger } from '../lib/logger'

export const errorHandler: ErrorHandler = (err, c) => {
  const requestId = c.get('requestId')
  const userId = c.get('userId')
  const schoolId = c.get('schoolId')

  if (err instanceof HTTPException) {
    logger.warn({ requestId, userId, schoolId, status: err.status, msg: err.message }, 'http exception')
    return c.json({ error: { message: err.message, requestId } }, err.status)
  }

  // Anything not caught: log full detail server-side, return generic to client
  logger.error({ requestId, userId, schoolId, err: err.message, stack: err.stack }, 'unhandled error')
  return c.json({ error: { message: 'Internal Server Error', requestId } }, 500)
}
```

**The handler ALWAYS includes the requestId in the response.** Ludvig can paste it into Sentry/logs to find what happened.

**NEVER** include exception details, stack traces, or DB constraint messages in client responses. Information disclosure → CVE.

---

## 5. Input validation — every endpoint, every time

```ts
// apps/api/src/routes/submissions.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { auth } from '../middleware/auth'
import { tenantContext } from '../middleware/tenant-context'
import { db } from '../db/client'
import { submissions } from '../db/schema'
import { eq, and } from 'drizzle-orm'
import { NotFoundError } from '../lib/errors'

const submissionCreateSchema = z.object({
  knuteId: z.string().uuid(),
  imageKey: z.string().min(1).max(255),
  caption: z.string().max(500).optional(),
})

export const submissionsRoutes = new Hono()
  .use('*', auth())            // 401 if no valid JWT
  .use('*', tenantContext())   // 403 if no schoolId on JWT

  .post('/',
    zValidator('json', submissionCreateSchema, (result, c) => {
      if (!result.success) {
        return c.json({ error: { message: 'Invalid input', issues: result.error.flatten() } }, 400)
      }
    }),
    async (c) => {
      const userId = c.get('userId')
      const schoolId = c.get('schoolId')
      const input = c.req.valid('json')

      const [created] = await db.insert(submissions).values({
        userId,
        schoolId,
        knuteId: input.knuteId,
        imageKey: input.imageKey,
        caption: input.caption,
        status: 'pending',
      }).returning()

      return c.json({ submission: created }, 201)
    }
  )

  .get('/:id',
    zValidator('param', z.object({ id: z.string().uuid() })),
    async (c) => {
      const { id } = c.req.valid('param')
      const schoolId = c.get('schoolId')

      // Defense in depth: explicit schoolId filter AND RLS via tenantContext middleware
      const [submission] = await db.select()
        .from(submissions)
        .where(and(eq(submissions.id, id), eq(submissions.schoolId, schoolId)))
        .limit(1)

      if (!submission) throw new NotFoundError('Submission')
      return c.json({ submission })
    }
  )
```

**Notes:**
- `submissionCreateSchema` is defined in the route file because it's request-shaped. DB-shaped schemas come from `drizzle-zod` (see DB rules).
- Always include the schoolId filter even though RLS will also block. Layered defense.
- `throw new NotFoundError('...')` — never `return c.json(..., 404)` directly. Single source of error formatting.

---

## 6. Auth — Entra ID + russenavn allowlist

The full flow is detailed in `.claude/rules/security.md`. The middleware shape:

```ts
// apps/api/src/middleware/auth.ts
import { createMiddleware } from 'hono/factory'
import { jwtVerify, createRemoteJWKSet } from 'jose'
import { UnauthorizedError } from '../lib/errors'
import { config } from '../config'

const JWKS = createRemoteJWKSet(new URL(config.OIDC_JWKS_URL))

type AuthVariables = {
  userId: string
  schoolId: string
  russenavn: string
  role: 'student' | 'knutesjef' | 'admin'
}

export const auth = () => createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) throw new UnauthorizedError('Missing Bearer token')

  const token = authHeader.slice(7)
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: config.JWT_ISSUER,
      audience: config.JWT_AUDIENCE,
    })

    c.set('userId', payload.sub as string)
    c.set('schoolId', payload.school_id as string)
    c.set('russenavn', payload.russenavn as string)
    c.set('role', payload.role as AuthVariables['role'])

    await next()
  } catch (err) {
    throw new UnauthorizedError('Invalid token')
  }
})
```

Multi-device sessions and "log out everywhere" via `token_version` — see `.claude/rules/security.md`.

---

## 7. Tenant context — the linchpin of multi-tenancy

```ts
// apps/api/src/middleware/tenant-context.ts
import { createMiddleware } from 'hono/factory'
import { sql } from 'drizzle-orm'
import { db } from '../db/client'
import { ForbiddenError } from '../lib/errors'

export const tenantContext = () => createMiddleware(async (c, next) => {
  const schoolId = c.get('schoolId')
  if (!schoolId) throw new ForbiddenError('No tenant context')

  // Set app.school_id on the connection for this request.
  // ALL DB calls during this request go through RLS-enforced policies.
  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.school_id', ${schoolId}, true)`)
    c.set('tx', tx)
    await next()
  })
})
```

**The transaction wrapper is essential.** Aiven uses PgBouncer in transaction-pool mode by default. Session-level `SET` does not survive across queries in that mode. The transaction holds the connection for the duration of the request, and `set_config(..., true)` (with `is_local=true`) scopes to the transaction.

Handlers that need DB access read `tx` from context — never reach for the global `db` instance directly inside an authenticated route.

---

## 8. Logging — Pino with redact paths

```ts
// apps/api/src/lib/logger.ts
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: {
    paths: [
      'password',
      'token',
      'accessToken',
      'refreshToken',
      'authorization',
      'cookie',
      'req.headers.authorization',
      'req.headers.cookie',
      '*.password',
      '*.token',
      '*.accessToken',
      '*.refreshToken',
      'user.email',
      'user.russenavn',
      'russenavn',
      'email',
    ],
    censor: '[REDACTED]',
  },
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
})
```

**Rules:**
- NEVER `console.log` in server code. The `post-edit-quality` hook will flag this.
- ALWAYS pass structured fields, not formatted strings: `logger.info({ userId, action }, 'message')` not `logger.info(`user ${userId} did ${action}`)`.
- NEVER log the request body or response body wholesale. If you need to debug, log specific fields after they've passed redact.
- russenavn IS PII. It's in the redact list. If you need to reference a user in logs, use `userId` (UUID).

---

## 9. Database access patterns

**See `.claude/rules/database.md` for full detail.** Highlights:

- Use Drizzle's typed query builder, not raw SQL. When you must use raw SQL (rare), use the parameterized `sql` template, never `sql.raw()` with user input.
- For list endpoints, ALWAYS paginate. `limit(50).offset(...)` or cursor-based via `(created_at, id)` pairs.
- For "fetch with related data," use Drizzle's relational queries (`db.query.users.findMany({ with: { submissions: true } })`) — they do a single JOIN, not N+1.
- Wrap multi-statement state changes in transactions. Single-row writes don't need it.
- Every list query needs an index on the leading column(s) in WHERE/ORDER BY. Composite `(school_id, created_at DESC)` is the default for tenant-scoped tables.

---

## 10. Rate limiting

Use `hono-rate-limiter` with an in-memory store for development and a Redis/KeyDB store for production. Aiven offers managed Valkey in Helsinki.

Defaults:
- Public auth endpoints (login init): 10 req / 15 min per IP
- Authenticated mutating endpoints: 100 req / min per user
- Read endpoints: 300 req / min per user
- Admin endpoints: 30 req / min per user

When the limit is hit, `RateLimitError` → 429 with `Retry-After` header.

---

## 11. Testing — the non-negotiable suite

Every backend PR must keep these passing:

**`apps/api/src/test/integration/rls.test.ts`** — THE most important file:
- Spins up Postgres via testcontainer.
- Creates two schools (A, B), one user per school.
- For every tenant-scoped table, attempts cross-tenant access via the API:
  - User from school A trying to GET school B's submissions → empty list or 404
  - User from school A trying to POST referencing school B's knute → 400 or 404
  - User from school A trying to PATCH school B's submission → 404
- Verifies RLS catches even if the application code "forgets" the `school_id` filter (do this by temporarily monkey-patching one query to drop the filter and confirming RLS still returns zero rows).

**`apps/api/src/test/integration/auth.test.ts`:**
- Missing Authorization header → 401
- Malformed token → 401
- Expired token → 401
- Token signed by wrong issuer → 401
- Valid token for nonexistent user → 401 (token revocation case)
- Valid token, wrong role for admin endpoint → 403

**Per-resource tests:**
- Happy path
- Validation rejection (missing field, wrong type, oversize string)
- Authorization rejection (wrong role)
- Cross-tenant rejection (always)

**Sponsor data integrity:**
- Sponsor-rapport endpoint requires `admin` role.
- Sponsor analytics queries never leak per-user PII (only aggregates).

CI runs the full integration suite on every PR. Failing tests block merge.

---

## 12. Configuration via typed env

```ts
// apps/api/src/config.ts
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_ISSUER: z.string().url(),
  JWT_AUDIENCE: z.string(),
  OIDC_JWKS_URL: z.string().url(),
  BUNNY_STORAGE_ZONE: z.string(),
  BUNNY_STORAGE_KEY: z.string(),
  BUNNY_CDN_HOSTNAME: z.string(),
  SENTRY_DSN: z.string().url().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
})

export const config = envSchema.parse(process.env)
```

**Rules:**
- NEVER `process.env.X` directly in business code. Always go through `config`.
- On startup, if `config = envSchema.parse(...)` throws, the process exits — fail fast.
- New env vars go in `.env.example` (committed) AND the schema (so types update).

---

## 13. Observability

- **Sentry EU** for errors. Configured in `apps/api/src/lib/sentry.ts`. NEVER ship to Sentry without filtering PII (russenavn, email, full names) via `beforeSend`.
- **Pino** for structured logs. In production, ship to a log aggregator (Aiven Logs, or self-hosted Loki on Hetzner).
- **Plausible EU** for app analytics. NEVER user-identified events — only aggregates.
- **Health endpoint:** `GET /healthz` returns 200 if DB reachable, 503 otherwise. Used by Hetzner / monitoring.

---

## 14. Definition of done (backend)

A backend change is NOT done until:

- [ ] TypeScript compiles with no errors (`pnpm typecheck`)
- [ ] ESLint passes (`pnpm lint`)
- [ ] All tests pass, including RLS integration suite (`pnpm test`)
- [ ] Any new tenant-scoped table has `enableRLS()` AND `FORCE ROW LEVEL SECURITY` AND a policy AND a composite index leading on `school_id`
- [ ] Any new endpoint has: zValidator, auth middleware (if not public), tenant middleware (if tenant-scoped), 3+ tests
- [ ] Any new query has been mentally walked through for N+1, missing index, missing tenant filter
- [ ] Any migration has been classified by `/migration-plan` as SAFE
- [ ] `pino` redact list updated if new PII field introduced
- [ ] `/backend-review` returns clean

---

## 15. When you genuinely don't know

Stop. Ask Ludvig with concrete options. Examples:

- "We need to choose between (a) computing the leaderboard on every read (simple, scales poorly) vs (b) caching in a materialized view refreshed every minute (complex, scales). For 10 schools (a) is fine; nationally we'd need (b). Which now?"
- "This requires a schema change. I've drafted the migration. Want to see it before I run drizzle-kit generate?"
- "I'm not certain this is GDPR-compliant for minors. Should we check Datatilsynet's current guidance before shipping?"

Never silently guess on architecture, security, data residency, GDPR, or schema design.
