import { Hono } from 'hono'
import { and, desc, eq, isNull } from 'drizzle-orm'
import { auth, type AuthVariables } from '../middleware/auth.js'
import { tenantContext } from '../middleware/tenant-context.js'
import { schoolClasses, users } from '../db/schema/index.js'
import { getRankTitle } from '../lib/rank-titles.js'
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
  // className rides along (LEFT JOIN — null for class-less users) so the
  // client derives «Klassen min» + «Klassekamp» from this one payload. RLS on
  // school_classes also guards the join: a class_id pointing at another
  // school's class resolves to null, never to a foreign class name.
  .get('/', async (c) => {
    const tx = c.get('tx')
    const schoolId = c.get('schoolId')
    const currentUserId = c.get('userId')

    const rows = await tx
      .select({
        userId: users.id,
        russenavn: users.russenavn,
        points: users.points,
        className: schoolClasses.name,
      })
      .from(users)
      .leftJoin(schoolClasses, eq(schoolClasses.id, users.classId))
      .where(and(eq(users.schoolId, schoolId), isNull(users.deletedAt)))
      .orderBy(desc(users.points), users.russenavn)

    const leaderboard = rows.map((row, idx) => ({
      ...row,
      rank: idx + 1,
      rankTitle: getRankTitle(idx + 1),
      isCurrentUser: row.userId === currentUserId,
    }))

    return c.json({ leaderboard })
  })
