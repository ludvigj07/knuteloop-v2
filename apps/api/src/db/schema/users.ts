import { sql } from 'drizzle-orm'
import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
  unique,
  pgPolicy,
} from 'drizzle-orm/pg-core'
import { schools } from './schools'

// Tenant-scoped: full RLS treatment per database.md §1.
// Auth-related columns (email, token_version) will be exercised when auth is wired up.
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    schoolId: uuid('school_id')
      .notNull()
      .references(() => schools.id, { onDelete: 'cascade' }),
    russenavn: text('russenavn').notNull(),
    email: text('email'),
    role: text('role', { enum: ['student', 'knutesjef', 'admin'] })
      .notNull()
      .default('student'),
    points: integer('points').notNull().default(0),
    tokenVersion: integer('token_version').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    pgPolicy('users_tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: 'app_role',
      using: sql`school_id = NULLIF(current_setting('app.school_id', true), '')::uuid`,
      withCheck: sql`school_id = NULLIF(current_setting('app.school_id', true), '')::uuid`,
    }),
    index('users_school_created_idx').on(table.schoolId, table.createdAt.desc()),
    unique('users_school_russenavn_unique').on(table.schoolId, table.russenavn),
    // Leaderboard: ranked by points desc, russenavn as a stable tiebreak,
    // within a school. Partial (active users only) matches the leaderboard
    // query's deleted_at IS NULL filter, so the whole filter+sort is served
    // from the index — no per-request sort of the school's users.
    index('users_school_points_idx')
      .on(table.schoolId, table.points.desc(), table.russenavn)
      .where(sql`deleted_at IS NULL`),
  ],
).enableRLS()
