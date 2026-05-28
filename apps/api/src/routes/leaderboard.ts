import { Hono } from 'hono'
import { and, desc, eq, isNull } from 'drizzle-orm'
import { auth, type AuthVariables } from '../middleware/auth.js'
import { tenantContext } from '../middleware/tenant-context.js'
import { users } from '../db/schema/index.js'
import type { db } from '../db/client.js'

type Variables = AuthVariables & {
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0]
}

export const leaderboardRoutes = new Hono<{ Variables: Variables }>()
  .use('*', auth())
  .use('*', tenantContext())

  // GET /api/leaderboard — ranked list of active users in this school.
  // Soft-deleted users (deletedAt set) are excluded. Sorted by points desc,
  // ties broken by russenavn for stable ordering. Rank is computed
  // sequentially — true rank-equal handling (1, 1, 3) can come later.
  .get('/', async (c) => {
    const tx = c.get('tx')
    const schoolId = c.get('schoolId')
    const currentUserId = c.get('userId')

    const rows = await tx
      .select({
        userId: users.id,
        russenavn: users.russenavn,
        points: users.points,
      })
      .from(users)
      .where(and(eq(users.schoolId, schoolId), isNull(users.deletedAt)))
      .orderBy(desc(users.points), users.russenavn)

    const leaderboard = rows.map((row, idx) => ({
      ...row,
      rank: idx + 1,
      isCurrentUser: row.userId === currentUserId,
    }))

    return c.json({ leaderboard })
  })
