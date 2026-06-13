import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { schools, users } from '../../db/schema/index.js'
import { setupTestDb, type TestHandles } from '../helpers/test-db.js'
import { verifyDevToken } from '../../lib/auth-dev.js'
import { isDevEnv, buildApp } from '../../app.js'
import { productionConfigError, DEFAULT_DEV_SECRET } from '../../config.js'

// The /api/dev/users endpoint is unauthenticated and mints working tokens for
// every user in every school. The ONLY thing keeping it off production is the
// mount gate + the secret guard. config.NODE_ENV is parsed once at module load
// (setup.ts pins it to 'test'), so rather than the brittle re-import dance we
// test the pure gate predicates directly — they are what app.ts/config.ts call.
describe('dev-route + secret gates (fail-closed)', () => {
  it('mounts dev routes only in development/test, never production or unknown envs', () => {
    expect(isDevEnv('development')).toBe(true)
    expect(isDevEnv('test')).toBe(true)
    expect(isDevEnv('production')).toBe(false)
    // Fail-closed: anything unexpected is treated as non-dev.
    expect(isDevEnv('staging')).toBe(false)
    expect(isDevEnv('')).toBe(false)
  })

  it('refuses to boot in production on the committed default secret', () => {
    const err = productionConfigError({
      NODE_ENV: 'production',
      JWT_DEV_SECRET: DEFAULT_DEV_SECRET,
      PORT: 3000,
      LOG_LEVEL: 'info',
    })
    expect(err).toMatch(/refusing to boot/i)
  })

  it('allows production with a real secret, and allows the default secret in dev/test', () => {
    expect(
      productionConfigError({
        NODE_ENV: 'production',
        JWT_DEV_SECRET: 'a-real-production-secret-at-least-32-chars!!',
        PORT: 3000,
        LOG_LEVEL: 'info',
      }),
    ).toBeNull()
    expect(
      productionConfigError({
        NODE_ENV: 'development',
        JWT_DEV_SECRET: DEFAULT_DEV_SECRET,
        PORT: 3000,
        LOG_LEVEL: 'info',
      }),
    ).toBeNull()
  })
})

describe('GET /api/dev/users (happy path)', () => {
  let h: TestHandles
  let app: ReturnType<typeof buildApp>

  beforeAll(async () => {
    h = await setupTestDb()
    app = buildApp() // NODE_ENV=test (setup.ts) → isDevEnv → /api/dev is mounted

    const insertedSchools = await h.superDb
      .insert(schools)
      .values([{ name: 'A vgs' }, { name: 'B vgs' }])
      .returning()

    await h.superDb.insert(users).values([
      { schoolId: insertedSchools[0]!.id, russenavn: 'Loke', role: 'knutesjef' },
      { schoolId: insertedSchools[1]!.id, russenavn: 'Brage', role: 'student' },
    ])
  })

  afterAll(async () => {
    await h?.cleanup()
  })

  it('lists every seeded user across all schools, each with a verifiable token', async () => {
    const res = await app.request('/api/dev/users')
    expect(res.status).toBe(200)

    const body = (await res.json()) as {
      users: {
        userId: string
        russenavn: string
        role: 'student' | 'knutesjef' | 'admin'
        schoolId: string
        schoolName: string
        token: string
      }[]
    }

    // Superuser connection bypasses RLS by design → both schools appear.
    expect(body.users.map((u) => u.russenavn).sort()).toEqual(['Brage', 'Loke'])

    // Each minted token must verify and its claims must match its row exactly —
    // i.e. these are real, usable sessions, scoped to the right school + role.
    for (const u of body.users) {
      const claims = await verifyDevToken(u.token)
      expect(claims.sub).toBe(u.userId)
      expect(claims.school_id).toBe(u.schoolId)
      expect(claims.role).toBe(u.role)
    }
  })
})
