// scripts/dev-token.ts — print signed dev JWTs for every seeded user.
//
//   pnpm dev:token
//
// Connects as superuser (read-only — no writes), lists all schools + their
// users, signs an HS256 token for each, and prints copy-paste-able output.
// Use the printed token in an Authorization: Bearer <token> header.

import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { eq } from 'drizzle-orm'
import * as schema from '../src/db/schema/index.js'
import { signDevToken } from '../src/lib/auth-dev.js'

const APP_URL = process.env.DATABASE_URL
if (!APP_URL) {
  process.stderr.write('DATABASE_URL is not set (check apps/api/.env)\n')
  process.exit(1)
}

const SUPERUSER_URL =
  process.env.SUPERUSER_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/postgres'

// Use the dev DB name from DATABASE_URL, but connect as superuser to bypass
// RLS — we want to list users across all schools.
const supUrl = new URL(SUPERUSER_URL)
const devDbName = new URL(APP_URL).pathname.replace(/^\//, '')
supUrl.pathname = `/${devDbName}`

const sql = postgres(supUrl.toString(), { prepare: false, max: 1 })
const db = drizzle(sql, { schema })

try {
  const rows = await db
    .select({
      schoolId: schema.schools.id,
      schoolName: schema.schools.name,
      userId: schema.users.id,
      russenavn: schema.users.russenavn,
      role: schema.users.role,
    })
    .from(schema.users)
    .innerJoin(schema.schools, eq(schema.users.schoolId, schema.schools.id))

  if (rows.length === 0) {
    process.stdout.write('No users found. Run "pnpm dev:setup" first.\n')
    process.exit(1)
  }

  process.stdout.write('\n=== Knuteloop dev tokens ===\n')
  process.stdout.write('TTL: 15m. Re-run this script to get fresh ones.\n\n')

  for (const r of rows) {
    const token = await signDevToken({
      sub: r.userId,
      school_id: r.schoolId,
      role: r.role as 'student' | 'knutesjef' | 'admin',
    })
    process.stdout.write(`School: ${r.schoolName}\n`)
    process.stdout.write(`  User:  ${r.russenavn} (${r.role})\n`)
    process.stdout.write(`  Token: ${token}\n\n`)
  }

  process.stdout.write('Use in a request like:\n')
  process.stdout.write('  Invoke-RestMethod -Uri http://localhost:3000/api/knuter `\n')
  process.stdout.write('    -Headers @{ Authorization = "Bearer <paste-token-here>" }\n\n')
} finally {
  await sql.end({ timeout: 5 })
}

process.exit(0)
