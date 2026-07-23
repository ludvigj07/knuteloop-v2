// scripts/dev-seed-feed.ts — top up the ALREADY-RUNNING dev DB with approved
// submissions so the feed screen has something to swipe through.
//
//   pnpm --filter @knuteloop/api dev:seed-feed
//
// Unlike dev-setup.ts this does NOT drop the database and does NOT touch the
// mobile token — safe to run while dev:all is up. Re-running replaces the
// previous seed batch (idempotent), pending review-queue rows are untouched.
//
// Images: downloaded ONCE from picsum.photos (public test photos, DEV SEED
// ONLY, no user data) into the local uploads dir with REAL storage keys, so
// `imageUrl` resolves exactly like a real upload and the phone never talks to
// picsum. First run needs internet; re-runs reuse the files on disk.

import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { and, asc, eq, inArray, like, sum } from 'drizzle-orm'
import * as schema from '../src/db/schema/index.js'
import { readLocalImage, writeLocalImage } from '../src/lib/storage.js'

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

const BATCH_SIZE = 8

// Deterministic ids ("dead5eed" marks seed rows in the DB) so re-runs can
// delete exactly this batch, and the image keys pass isValidImageKey.
const SEED_IDS = Array.from(
  { length: BATCH_SIZE },
  (_, i) => `dead5eed-0001-4001-8001-${String(i + 1).padStart(12, '0')}`,
)
const seedImageKey = (i: number) => `submissions/${SEED_IDS[i]}.jpg`

// Portrait 9:16 so the fullscreen feed (and its blur-fill) renders like a
// real phone photo. Downloaded to disk on first run, then reused.
async function ensureSeedImage(i: number): Promise<void> {
  const key = seedImageKey(i)
  if (await readLocalImage(key)) return
  const res = await fetch(`https://picsum.photos/seed/knute-${i}/900/1600`)
  if (!res.ok) throw new Error(`picsum ${res.status} for seed image ${i}`)
  await writeLocalImage(key, new Uint8Array(await res.arrayBuffer()))
}

try {
  await Promise.all(Array.from({ length: BATCH_SIZE }, (_, i) => ensureSeedImage(i)))
} catch (err) {
  process.stderr.write(
    `Could not fetch seed images (first run needs internet): ${(err as Error).message}\n`,
  )
  process.exit(1)
}

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
// Frida by name (not "first student" — row order isn't deterministic, and she
// is the seed user with the fullest profile), fallback to any student.
const frida =
  schoolUsers.find((u) => u.russenavn === 'Frida') ??
  schoolUsers.find((u) => u.role === 'student')
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

// Make re-runs clean: remove earlier APPROVED seed rows (the dev-setup ones,
// legacy picsum-URL batches, and previous runs of this script) before
// inserting a fresh batch. Pending rows are left alone so the review queue
// keeps its content.
await supDb
  .delete(schema.submissions)
  .where(
    and(
      eq(schema.submissions.schoolId, stOlav.id),
      eq(schema.submissions.status, 'approved'),
      like(schema.submissions.imageKey, 'bunny/dev-seed/%'),
    ),
  )
await supDb
  .delete(schema.submissions)
  .where(
    and(
      eq(schema.submissions.schoolId, stOlav.id),
      eq(schema.submissions.status, 'approved'),
      like(schema.submissions.imageKey, 'https://picsum.photos/%'),
    ),
  )
await supDb.delete(schema.submissions).where(inArray(schema.submissions.id, SEED_IDS))

// Spread createdAt over the last week so the feed has a realistic timeline.
// Seed rows are 'shared' with sharedAt = createdAt (ADR-0021) — the feed
// filters visibility='shared' and orders by shared_at, so private/defaulted
// rows would leave the dev feed empty.
const now = Date.now()
const batch = schoolKnuter.slice(3, 3 + BATCH_SIZE).map((k, i) => {
  const submittedAt = new Date(now - i * 6 * 60 * 60 * 1000)
  return {
    id: SEED_IDS[i],
    schoolId: stOlav.id,
    userId: frida.id,
    knuteId: k.id,
    imageKey: seedImageKey(i),
    caption: captions[i % captions.length] ?? null,
    status: 'approved' as const,
    visibility: 'shared' as const,
    sharedAt: submittedAt,
    reviewedBy: loke.id,
    reviewedAt: new Date(now - i * 3 * 60 * 60 * 1000),
    createdAt: submittedAt,
  }
})

await supDb.insert(schema.submissions).values(batch)

// Recompute points for EVERY user at the school from their actual approved
// submissions (v2 invariant: points = sum of approved knute points; no stored
// bonus yet). Absolute, not incremental, so re-runs and batch-owner changes
// never leave stale leaderboard points behind.
const sums = await supDb
  .select({ userId: schema.submissions.userId, total: sum(schema.knuter.points) })
  .from(schema.submissions)
  .innerJoin(schema.knuter, eq(schema.submissions.knuteId, schema.knuter.id))
  .where(
    and(eq(schema.submissions.schoolId, stOlav.id), eq(schema.submissions.status, 'approved')),
  )
  .groupBy(schema.submissions.userId)
const pointsByUser = new Map(sums.map((r) => [r.userId, Number(r.total ?? 0)]))
for (const u of schoolUsers) {
  await supDb
    .update(schema.users)
    .set({ points: pointsByUser.get(u.id) ?? 0 })
    .where(eq(schema.users.id, u.id))
}

process.stdout.write(
  `Seeded ${batch.length} approved submissions for ${frida.russenavn} @ ${stOlav.name} (${pointsByUser.get(frida.id) ?? 0}p), images on local disk\n`,
)

await supSql.end({ timeout: 5 })
process.exit(0)
