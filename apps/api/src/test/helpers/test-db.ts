import postgres from 'postgres'
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import * as schema from '../../db/schema/index.js'

const SUPERUSER_BASE_URL =
  process.env.TEST_SUPERUSER_URL ?? 'postgres://postgres:postgres@localhost:5432'
const TEST_DB = process.env.TEST_DB_NAME ?? 'knuteloop_test'
const APP_USER_PASSWORD = 'app_user_dev'

const MIGRATIONS_DIR = new URL('../../db/migrations', import.meta.url).pathname.replace(
  /^\/([A-Za-z]:)/,
  '$1',
)

export type TestHandles = {
  superSql: ReturnType<typeof postgres>
  superDb: PostgresJsDatabase<typeof schema>
  appSql: ReturnType<typeof postgres>
  appDb: PostgresJsDatabase<typeof schema>
  testDbUrl: string
  appUserUrl: string
  cleanup: () => Promise<void>
}

// Spin up a fresh `knuteloop_test` DB, apply all migrations, return two
// drizzle handles: one connected as superuser (bypasses RLS — seeds data),
// one as app_user (the role we test RLS against).
export async function setupTestDb(): Promise<TestHandles> {
  // 1. Connect to the `postgres` admin DB to drop/recreate the test DB.
  const adminUrl = `${SUPERUSER_BASE_URL}/postgres`
  const adminSql = postgres(adminUrl, { prepare: false, max: 1 })
  try {
    await adminSql.unsafe(`DROP DATABASE IF EXISTS "${TEST_DB}" WITH (FORCE)`)
    await adminSql.unsafe(`CREATE DATABASE "${TEST_DB}"`)
  } finally {
    await adminSql.end({ timeout: 5 })
  }

  // 2. Connect to the fresh test DB as superuser. Apply migrations.
  const testDbUrl = `${SUPERUSER_BASE_URL}/${TEST_DB}`
  const superSql = postgres(testDbUrl, { prepare: false, max: 1 })
  const superDb = drizzle(superSql, { schema })

  await migrate(superDb, { migrationsFolder: MIGRATIONS_DIR })

  // 3. Grant on the newly-created tables. ALTER DEFAULT PRIVILEGES in 0000
  // only takes effect for tables created AFTER it ran by the SAME role.
  // The migration runner here IS the same role (postgres), so default
  // privileges should have applied — but explicit grants are belt-and-suspenders.
  await superSql.unsafe(`
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_role;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_role;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO admin_role;
  `)
  // Shared tables are read-only for the app role (database.md §1): the
  // library catalog (ADR-0014 / migration 0014) AND schools (migration 0021 —
  // app_role could otherwise cascade-DELETE a whole school). Re-apply after
  // the blanket grant above so RLS/grants tests see prod behaviour.
  // KEEP IN SYNC with migrations 0014 + 0021: the blanket grant undoes any
  // migration REVOKE, so every read-only table must be re-revoked here.
  // (Helper refactor tracked: derive grants by re-running the REVOKEs from
  // the migration files instead of this parallel list.)
  await superSql.unsafe(`
    REVOKE INSERT, UPDATE, DELETE ON library_knuter, library_packs, library_pack_memberships, schools FROM app_role;
  `)

  // 4. Connect as app_user — the role whose RLS we test.
  const appUserUrl = `postgres://app_user:${APP_USER_PASSWORD}@localhost:5432/${TEST_DB}`
  const appSql = postgres(appUserUrl, { prepare: false, max: 1 })
  const appDb = drizzle(appSql, { schema })

  return {
    superSql,
    superDb,
    appSql,
    appDb,
    testDbUrl,
    appUserUrl,
    cleanup: async () => {
      await appSql.end({ timeout: 5 })
      await superSql.end({ timeout: 5 })
    },
  }
}

// Sanity helper unused by the test but useful for debugging migration ordering.
export function listMigrations(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((f) => `${f} (${readFileSync(join(MIGRATIONS_DIR, f), 'utf8').length} bytes)`)
}
