// scripts/dev-seed-feed.ts — top up the ALREADY-RUNNING dev DB with approved
// submissions so the feed screen has something to swipe through.
//
//   pnpm --filter @knuteloop/api dev:seed-feed
//
// Unlike dev-setup.ts this does NOT drop the database and does NOT touch the
// mobile token — safe to run while dev:all is up. Re-running adds another
// batch (dev data, duplicates don't matter).

import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { asc, eq, sql } from 'drizzle-orm'
import * as schema from '../src/db/schema/index.js'

const SUPERUSER_URL =
  process.env.SUPERUSER_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/postgres'
const APP_URL = process.env.DATABASE_URL
if (!APP_URL) {
  process.stderr.write('DATABASE_URL is not set (check apps/api/.env)\n')
  process.exit(1)
}

const devDbUrl = new URL(SUPERUSER_URL)
devDbUrl.pathname = new URL(APP_URL).pathname
const supSql = postgres(devDbUrl.toString(), { prepare: false, max: 1 })
const supDb = drizzle(supSql, { schema })

const [stOlav] = await supDb
  .select()
  .from(schema.schools)
  .where(eq(schema.schools.name, 'St. Olav vgs'))
  .limit(1)
if (!stOlav) {
  process.stderr.write('St. Olav vgs not found — run pnpm dev:setup first\n')
  process.exit(1)
}

const schoolUsers = await supDb
  .select()
  .from(schema.users)
  .where(eq(schema.users.schoolId, stOlav.id))
const loke = schoolUsers.find((u) => u.role === 'knutesjef')
const frida = schoolUsers.find((u) => u.role === 'student')
if (!loke || !frida) {
  process.stderr.write('Seed users missing — run pnpm dev:setup first\n')
  process.exit(1)
}

const schoolKnuter = await supDb
  .select()
  .from(schema.knuter)
  .where(eq(schema.knuter.schoolId, stOlav.id))
  .orderBy(asc(schema.knuter.createdAt))
  .limit(12)

const captions = [
  'Endelig klarte jeg den!',
  'Det tok tre forsøk 😅',
  null,
  'Vitne: hele klassen',
  'Aldri igjen',
  'Lettere enn forventet',
  null,
  'Knutesjefen lo høyt',
]

// Spread createdAt over the last week so the feed has a realistic timeline.
const now = Date.now()
const batch = schoolKnuter.slice(3, 3 + 8).map((k, i) => ({
  schoolId: stOlav.id,
  userId: frida.id,
  knuteId: k.id,
  imageKey: `bunny/dev-seed/feed-${i}.webp`,
  caption: captions[i % captions.length] ?? null,
  status: 'approved' as const,
  reviewedBy: loke.id,
  reviewedAt: new Date(now - i * 3 * 60 * 60 * 1000),
  createdAt: new Date(now - i * 6 * 60 * 60 * 1000),
}))

await supDb.insert(schema.submissions).values(batch)

const totalPoints = schoolKnuter.slice(3, 3 + 8).reduce((sum, k) => sum + k.points, 0)
await supDb
  .update(schema.users)
  .set({ points: sql`${schema.users.points} + ${totalPoints}` })
  .where(eq(schema.users.id, frida.id))

process.stdout.write(
  `Seeded ${batch.length} approved submissions for ${frida.russenavn} @ ${stOlav.name} (+${totalPoints}p)\n`,
)

await supSql.end({ timeout: 5 })
process.exit(0)
