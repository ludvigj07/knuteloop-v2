import { Hono } from 'hono'
import { and, asc, desc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { auth, type AuthVariables } from '../middleware/auth.js'
import { tenantContext } from '../middleware/tenant-context.js'
import { users, submissions, knuter, schoolClasses } from '../db/schema/index.js'
import { NotFoundError } from '../lib/errors.js'
import { computeStreak } from '../lib/streak.js'
import type { db } from '../db/client.js'

type Variables = AuthVariables & {
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0]
}

// The five knutemapper (folders), in display order. Mirrors the knuter.category
// enum; the mobile client maps these to short Norwegian display labels.
const CATEGORIES = [
  'Generelle',
  'Dobbelknuter',
  'Alkoholknuter',
  'Sexknuter',
  'Fordervett-knuter',
] as const

export const meRoutes = new Hono<{ Variables: Variables }>()
  .use('*', auth())
  .use('*', tenantContext())

  // GET /api/me — the data behind the merged profile + status screen:
  // identity (russenavn, role, russType, quote), headline stats (points, streak,
  // completed, gold), per-category rings, all-time status counts, and the user's
  // last 20 submissions. Every query is tenant-scoped by an explicit school_id
  // filter AND by RLS (defense in depth — backend.md §5).
  .get('/', async (c) => {
    const tx = c.get('tx')
    const userId = c.get('userId')
    const schoolId = c.get('schoolId')

    // className rides along via a LEFT JOIN (null for class-less users). RLS on
    // school_classes also guards the join — a class_id somehow pointing at another
    // school's class resolves to null, never leaks a foreign class name.
    const [user] = await tx
      .select({
        id: users.id,
        russenavn: users.russenavn,
        role: users.role,
        russType: users.russType,
        quote: users.quote,
        isAdult: users.isAdult,
        points: users.points,
        classId: users.classId,
        className: schoolClasses.name,
        createdAt: users.createdAt,
      })
      .from(users)
      .leftJoin(schoolClasses, eq(schoolClasses.id, users.classId))
      .where(and(eq(users.id, userId), eq(users.schoolId, schoolId)))
      .limit(1)

    if (!user) throw new NotFoundError('User')

    // Last 20 submissions for the activity list.
    const mine = await tx
      .select({
        id: submissions.id,
        status: submissions.status,
        knuteId: submissions.knuteId,
        imageKey: submissions.imageKey,
        caption: submissions.caption,
        createdAt: submissions.createdAt,
        reviewedAt: submissions.reviewedAt,
        knuteTitle: knuter.title,
        knutePoints: knuter.points,
        evidenceType: knuter.evidenceType,
      })
      .from(submissions)
      .innerJoin(knuter, eq(knuter.id, submissions.knuteId))
      .where(and(eq(submissions.schoolId, schoolId), eq(submissions.userId, userId)))
      .orderBy(desc(submissions.createdAt))
      .limit(20)

    // All-time status counts (NOT derived from the last-20 slice above — that was
    // a bug; for a user with >20 submissions the counts would be wrong).
    const statusRows = await tx
      .select({
        status: submissions.status,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(submissions)
      .where(and(eq(submissions.schoolId, schoolId), eq(submissions.userId, userId)))
      .groupBy(submissions.status)
    const countByStatus = new Map(statusRows.map((r) => [r.status, r.count]))
    const counts = {
      approved: countByStatus.get('approved') ?? 0,
      pending: countByStatus.get('pending') ?? 0,
      rejected: countByStatus.get('rejected') ?? 0,
    }

    // Headline "fullført" + "gull": distinct knuter (not submissions) the user has
    // an approved submission for, all-time (includes knuter later deactivated).
    // A gull-knute is one the knutesjef flagged is_gold — NOT a points threshold.
    const [agg] = await tx
      .select({
        completed: sql<number>`cast(count(distinct ${submissions.knuteId}) as int)`,
        gold: sql<number>`cast(count(distinct ${submissions.knuteId}) filter (where ${knuter.isGold}) as int)`,
      })
      .from(submissions)
      .innerJoin(knuter, eq(knuter.id, submissions.knuteId))
      .where(
        and(
          eq(submissions.schoolId, schoolId),
          eq(submissions.userId, userId),
          eq(submissions.status, 'approved'),
        ),
      )
    const completedCount = agg?.completed ?? 0
    const goldCount = agg?.gold ?? 0

    // Category rings: total = active knuter in the folder; completed = active
    // knuter in the folder the user has completed. Both filter is_active so
    // `completed` is always a subset of `total` (no completed > total).
    const totalRows = await tx
      .select({
        category: knuter.category,
        total: sql<number>`cast(count(*) as int)`,
      })
      .from(knuter)
      .where(and(eq(knuter.schoolId, schoolId), eq(knuter.isActive, true)))
      .groupBy(knuter.category)
    const completedRows = await tx
      .select({
        category: knuter.category,
        completed: sql<number>`cast(count(distinct ${knuter.id}) as int)`,
      })
      .from(knuter)
      .innerJoin(
        submissions,
        and(
          eq(submissions.knuteId, knuter.id),
          eq(submissions.schoolId, schoolId),
          eq(submissions.userId, userId),
          eq(submissions.status, 'approved'),
        ),
      )
      .where(and(eq(knuter.schoolId, schoolId), eq(knuter.isActive, true)))
      .groupBy(knuter.category)
    const totalByCat = new Map(totalRows.map((r) => [r.category, r.total]))
    const completedByCat = new Map(completedRows.map((r) => [r.category, r.completed]))
    const categories = CATEGORIES.map((category) => ({
      category,
      total: totalByCat.get(category) ?? 0,
      completed: completedByCat.get(category) ?? 0,
    }))

    // Streak: distinct Europe/Oslo days with an approved submission, run-counted
    // in computeStreak(). Oslo day-key computed in SQL → DST-safe, host-tz-independent.
    const dayRows = await tx
      .selectDistinct({
        day: sql<string>`(${submissions.createdAt} AT TIME ZONE 'Europe/Oslo')::date::text`,
      })
      .from(submissions)
      .where(
        and(
          eq(submissions.schoolId, schoolId),
          eq(submissions.userId, userId),
          eq(submissions.status, 'approved'),
        ),
      )
    const todayResult = await tx.execute(
      sql`SELECT (now() AT TIME ZONE 'Europe/Oslo')::date::text AS today`,
    )
    const todayOslo = (todayResult as unknown as Array<{ today: string }>)[0]?.today ?? ''
    const streak = todayOslo ? computeStreak(dayRows.map((r) => r.day), todayOslo) : 0

    return c.json({
      user,
      submissions: mine,
      counts,
      completedCount,
      goldCount,
      streak,
      categories,
    })
  })

  // GET /api/me/classes — the school's classes (school_classes), so the profile
  // screen can render the «Velg klasse» picker. Tenant-scoped by an explicit
  // school_id filter AND RLS; a russ only ever sees their own school's classes.
  .get('/classes', async (c) => {
    const tx = c.get('tx')
    const schoolId = c.get('schoolId')

    const classes = await tx
      .select({ id: schoolClasses.id, name: schoolClasses.name })
      .from(schoolClasses)
      .where(eq(schoolClasses.schoolId, schoolId))
      .orderBy(asc(schoolClasses.name))

    return c.json({ classes })
  })

  // PATCH /api/me/class — the russ claims (or clears) their class. Body:
  // { classId: uuid | null }. null clears the claim (leaves the class views).
  //
  // Security: class_id is a plain column, and the FK to school_classes is checked
  // GLOBALLY (foreign-key checks bypass RLS). So a client could otherwise send
  // another school's class UUID and it would satisfy the FK. We therefore verify
  // the class belongs to THIS school (tenant-scoped SELECT — RLS + explicit
  // filter) before writing. Without this check, a russ could point class_id at a
  // foreign class (harmless on read — the leaderboard join RLS-nulls it — but we
  // reject it at the source rather than rely on read-time defenses).
  .patch(
    '/class',
    zValidator('json', z.object({ classId: z.string().uuid().nullable() }), (result, c) => {
      if (!result.success) {
        return c.json(
          { error: { message: 'Invalid input', issues: result.error.flatten() } },
          400,
        )
      }
      return undefined
    }),
    async (c) => {
      const tx = c.get('tx')
      const userId = c.get('userId')
      const schoolId = c.get('schoolId')
      const { classId } = c.req.valid('json')

      let className: string | null = null
      if (classId !== null) {
        const [cls] = await tx
          .select({ id: schoolClasses.id, name: schoolClasses.name })
          .from(schoolClasses)
          .where(and(eq(schoolClasses.id, classId), eq(schoolClasses.schoolId, schoolId)))
          .limit(1)
        if (!cls) throw new NotFoundError('Klasse')
        className = cls.name
      }

      const updated = await tx
        .update(users)
        .set({ classId, updatedAt: new Date() })
        .where(and(eq(users.id, userId), eq(users.schoolId, schoolId)))
        .returning({ id: users.id })

      if (updated.length === 0) throw new NotFoundError('User')

      return c.json({ classId, className })
    },
  )
