import { Hono } from 'hono'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { eq } from 'drizzle-orm'
import { schools, users } from '../db/schema/index.js'
import { signDevToken } from '../lib/auth-dev.js'
import { config } from '../config.js'

// ⚠️ DEV-ONLY ROUTES — mounted ONLY when NODE_ENV !== 'production' (see app.ts).
// GET /api/dev/users lists every seeded user with a signed dev token so the
// mobile dev-login screen can switch identity without editing .env + restarting.
// This MUST NEVER be reachable in production: it mints auth tokens for arbitrary
// users with no credentials. The gating lives at the mount site, not here.

// A superuser connection (postgres/postgres — the local dev convention used by
// dev-setup / dev-token) so we can list users across ALL schools regardless of
// the RLS-bound role the app itself connects as.
function superuserUrl(): string {
  if (!config.DATABASE_URL) {
    throw new Error('DATABASE_URL is required for /api/dev routes')
  }
  const url = new URL(config.DATABASE_URL)
  url.username = 'postgres'
  url.password = 'postgres'
  return url.toString()
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
