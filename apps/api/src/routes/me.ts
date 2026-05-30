import { Hono } from 'hono'
import { and, desc, eq } from 'drizzle-orm'
import { auth, type AuthVariables } from '../middleware/auth.js'
import { tenantContext } from '../middleware/tenant-context.js'
import { users, submissions, knuter } from '../db/schema/index.js'
import { NotFoundError } from '../lib/errors.js'
import type { db } from '../db/client.js'

type Variables = AuthVariables & {
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0]
}

export const meRoutes = new Hono<{ Variables: Variables }>()
  .use('*', auth())
  .use('*', tenantContext())

  // GET /api/me — current user's profile + their last 20 submissions.
  // Useful for the "my profile" screen and as a self-check after auth.
  .get('/', async (c) => {
    const tx = c.get('tx')
    const userId = c.get('userId')
    const schoolId = c.get('schoolId')

    const [user] = await tx
      .select({
        id: users.id,
        russenavn: users.russenavn,
        role: users.role,
        points: users.points,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(and(eq(users.id, userId), eq(users.schoolId, schoolId)))
      .limit(1)

    if (!user) throw new NotFoundError('User')

    const mine = await tx
      .select({
        id: submissions.id,
        status: submissions.status,
        imageKey: submissions.imageKey,
        caption: submissions.caption,
        createdAt: submissions.createdAt,
        reviewedAt: submissions.reviewedAt,
        knuteTitle: knuter.title,
        knutePoints: knuter.points,
      })
      .from(submissions)
      .innerJoin(knuter, eq(knuter.id, submissions.knuteId))
      .where(eq(submissions.userId, userId))
      .orderBy(desc(submissions.createdAt))
      .limit(20)

    // Pre-computed counters for the header — saves the client from a second pass.
    const counts = {
      approved: mine.filter((s) => s.status === 'approved').length,
      pending: mine.filter((s) => s.status === 'pending').length,
      rejected: mine.filter((s) => s.status === 'rejected').length,
    }

    return c.json({ user, submissions: mine, counts })
  })
