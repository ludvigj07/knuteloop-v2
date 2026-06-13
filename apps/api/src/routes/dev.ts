import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { eq } from 'drizzle-orm'
import { schools, users } from '../db/schema/index.js'
import { signDevToken } from '../lib/auth-dev.js'
import { config } from '../config.js'

// ⚠️ DEV-ONLY ROUTES — mounted ONLY in dev/test (see isDevEnv in app.ts).
// GET /api/dev/users lists every seeded user with a signed dev token so the
// mobile dev-login screen can switch identity without editing .env + restarting.
// This MUST NEVER be reachable in production: it mints auth tokens for arbitrary
// users with no credentials. The gating lives at the mount site, not here.

// A superuser connection so we can list users across ALL schools regardless of
// the RLS-bound app_role. Prefer an explicit SUPERUSER_DATABASE_URL (the same
// convention as scripts/dev-setup + dev-token); otherwise derive one from
// DATABASE_URL by swapping in the local postgres/postgres superuser credentials.
function superuserUrl(): string {
  if (!config.DATABASE_URL) {
    throw new HTTPException(500, { message: 'DATABASE_URL is required for /api/dev routes' })
  }
  const target = new URL(config.DATABASE_URL)
  const explicit = process.env.SUPERUSER_DATABASE_URL
  if (explicit) {
    // Keep the explicit superuser creds/host but point at the same dev database.
    const sup = new URL(explicit)
    sup.pathname = target.pathname
    return sup.toString()
  }
  target.username = 'postgres'
  target.password = 'postgres'
  return target.toString()
}

export const devRoutes = new Hono().get('/users', async (c) => {
  const sql = postgres(superuserUrl(), { prepare: false, max: 1 })
  try {
    const db = drizzle(sql)
    const rows = await db
      .select({
        userId: users.id,
        russenavn: users.russenavn,
        role: users.role,
        schoolId: schools.id,
        schoolName: schools.name,
      })
      .from(users)
      .innerJoin(schools, eq(users.schoolId, schools.id))
      .orderBy(schools.name, users.russenavn)

    const result = await Promise.all(
      rows.map(async (r) => ({
        userId: r.userId,
        russenavn: r.russenavn,
        role: r.role,
        schoolId: r.schoolId,
        schoolName: r.schoolName,
        token: await signDevToken({ sub: r.userId, school_id: r.schoolId, role: r.role }, '8h'),
      })),
    )

    return c.json({ users: result })
  } finally {
    await sql.end({ timeout: 5 })
  }
})
