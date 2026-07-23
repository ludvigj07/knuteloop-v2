---
name: new-endpoint
description: Recipe for adding a new API endpoint the Knuteloop way — middleware chain, validation, tenant scoping, errors, tests. Invoke with method + path + who may call it, e.g. `/new-endpoint POST /api/knuter/:id/archive (knutesjef only)`.
---

# /new-endpoint <method + path + who>

Step-by-step recipe for a tenant-scoped API endpoint. Follow it in order — do not
improvise the structure. **The exemplar is [apps/api/src/routes/folders.ts] — when
this recipe and your instinct disagree, copy the exemplar's shape.**

If no argument was given, ask: method, path, who may call it (student / knutesjef /
admin), and what it reads/writes.

## 0. Before writing code

- The backend rules load automatically when you touch `apps/api/**`. Honor them.
- **One file per resource** in `apps/api/src/routes/`. Adding to an existing resource →
  edit its file. New resource → new file + mount it in `src/app.ts` (`buildApp()` —
  NOT `index.ts`; older docs say index.ts, they are stale).
- If the endpoint needs a **new table** → STOP, run `/new-table` first.
- If it needs a **new npm package**, touches **auth internals**, or loosens anything
  around `evidence_type`/`min_age` → STOP and ask Ludvig.

## 1. The route shape (copy this skeleton)

```ts
import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { auth, type AuthVariables } from '../middleware/auth.js'
import { tenantContext } from '../middleware/tenant-context.js'
import { requireRole } from '../middleware/require-role.js'
import { NotFoundError } from '../lib/errors.js'
import type { db } from '../db/client.js'

type Variables = AuthVariables & {
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0]
}

const idParam = z.object({ id: z.string().uuid() })
const bodySchema = z.object({
  /* every field validated: .trim().min(1).max(N) on strings, .int().min().max() on numbers */
})

export const myResourceRoutes = new Hono<{ Variables: Variables }>()
  .use('*', auth())
  .use('*', tenantContext())

  .post(
    '/:id/verb',
    requireRole('knutesjef', 'admin'), // only if role-gated — omit for all-members endpoints
    zValidator('param', idParam),
    zValidator('json', bodySchema, (result, c) => {
      if (!result.success) {
        return c.json({ error: { message: 'Invalid input', issues: result.error.flatten() } }, 400)
      }
      return undefined
    }),
    async (c) => {
      const tx = c.get('tx') // RLS-scoped transaction — NEVER the global db (lint blocks it)
      const schoolId = c.get('schoolId') // branded SchoolId from the JWT
      const { id } = c.req.valid('param')
      // ...
      return c.json({ myResource: created }, 201)
    },
  )
```

**Non-negotiables inside the handler:**

- **`tx` only.** The global `db` bypasses RLS; ESLint blocks value-importing it here.
- **Defense in depth:** include `eq(table.schoolId, schoolId)` in every WHERE even
  though RLS also filters. Both layers, every time.
- **Cross-tenant lookups return `NotFoundError`** (404), never 403 — a 403 leaks that
  the resource exists.
- **FK-references from client input must be tenant-verified BEFORE writing.** FK
  checks bypass RLS — SELECT the referenced row with a schoolId filter first
  (see `PATCH /api/me/class` in [apps/api/src/routes/me.ts] for the pattern).
- **Typed errors only** (`NotFoundError`, `ConflictError`, … from `lib/errors.ts`) —
  never `return c.json({...}, 404)` from a handler.
- **User-facing error messages in bokmål** ("En mappe med dette navnet finnes allerede").
- **Validate → throw BEFORE the first write.** `tenantContext` currently COMMITs the
  transaction even when a handler throws an HTTPException, so a throw after a write
  commits a partial change (documented in [apps/api/src/lib/library-import.ts]).
- **List endpoints always paginate** — cursor-based on `(created_at, id)`, limit 50.
  Copy the cursor pattern from [apps/api/src/routes/feed.ts].
- **No `console.log`** — Pino logger only; no PII (russenavn/email) in log fields.

## 2. Mount it (only for a NEW resource file)

In `apps/api/src/app.ts` inside `buildApp()`:

```ts
app.route('/api/my-resource', myResourceRoutes)
```

## 3. Shared types (only if mobile consumes the response)

Response shapes the app reads live in `packages/shared` — extend there so mobile
imports from `@knuteloop/shared` instead of redeclaring.

## 4. Tests — minimum four, in the resource's test file

`apps/api/src/test/integration/<resource>.test.ts`. **Exemplar:
[apps/api/src/test/integration/folders.test.ts]** — copy its `beforeAll` (two schools,
users per role, `signDevToken`, `buildApp`). The minimum set:

1. **Happy path** — expected status + response shape.
2. **Unauthenticated** — no Authorization header → 401.
3. **Cross-tenant** — school A token against school B's resource → 404 (or empty list).
   NEVER a response that reveals the resource exists.
4. **Validation** — missing/oversized/wrong-typed field → 400.
5. *(if role-gated)* **Wrong role** — student token → 403.

## 5. Definition of done

- [ ] `pnpm --filter @knuteloop/api typecheck` ✅
- [ ] `pnpm --filter @knuteloop/api lint` ✅ (catches db-import, sql.raw, process.env)
- [ ] `pnpm --filter @knuteloop/api test` ✅ — including the RLS suites
- [ ] Run `/backend-review` on the diff; fix everything it flags
- [ ] Diff ≤ ~300 lines (brother reviews in 10–20 min) — split if bigger
- [ ] PR body: What / Why / How / Tested, in the repo's style
