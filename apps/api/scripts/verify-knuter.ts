// One-shot verification script. Re-runs migrations against knuteloop_test,
// seeds one school + user + a handful of knuter, hits GET /api/knuter, and
// prints the response. Not part of the regular dev flow — invoke with:
//   pnpm tsx scripts/verify-knuter.ts
process.env.NODE_ENV = process.env.NODE_ENV ?? 'test'
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgres://app_user:app_user_dev@localhost:5432/knuteloop_test'
process.env.JWT_DEV_SECRET =
  process.env.JWT_DEV_SECRET ?? 'test-secret-must-be-at-least-32-chars-long-for-hs256-please'
process.env.LOG_LEVEL = process.env.LOG_LEVEL ?? 'warn'

const { setupTestDb } = await import('../src/test/helpers/test-db.js')
const { buildApp } = await import('../src/app.js')
const { signDevToken } = await import('../src/lib/auth-dev.js')
const schemas = await import('../src/db/schema/index.js')

const h = await setupTestDb()
const app = buildApp()

const [school] = await h.superDb
  .insert(schemas.schools)
  .values({ name: 'Demo High School' })
  .returning()

const [user] = await h.superDb
  .insert(schemas.users)
  .values({ schoolId: school!.id, russenavn: 'DemoRuss', role: 'student' })
  .returning()

await h.superDb.insert(schemas.knuter).values([
  { schoolId: school!.id, title: 'Spis frokost under pulten', points: 10, difficulty: 'Lett' },
  { schoolId: school!.id, title: 'Klassebilde med solbriller', points: 25, difficulty: 'Medium' },
  { schoolId: school!.id, title: 'Heiarop-video', points: 35, difficulty: 'Medium' },
])

const token = await signDevToken({
  sub: user!.id,
  school_id: school!.id,
  role: 'student',
})

const res = await app.request('/api/knuter', {
  headers: { Authorization: `Bearer ${token}` },
})

process.stdout.write(`HTTP ${res.status} ${res.statusText}\n`)
process.stdout.write(`Content-Type: ${res.headers.get('content-type')}\n\n`)

const body = (await res.json()) as {
  knuter: { title: string; points: number; difficulty: string }[]
}

process.stdout.write(`knuter for Demo High School (${body.knuter.length}):\n`)
for (const k of body.knuter) {
  process.stdout.write(`  - ${k.points.toString().padStart(3)}p  ${k.difficulty.padEnd(8)}  ${k.title}\n`)
}

await h.cleanup()
process.exit(0)
