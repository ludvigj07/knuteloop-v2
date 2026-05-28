import { sql } from 'drizzle-orm'
import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  index,
  pgPolicy,
} from 'drizzle-orm/pg-core'
import { schools } from './schools'

// Per-school knuter. Each school's knutesjef creates their own — no shared
// catalog at this stage. A curated library is planned as a separate feature
// later (separate tables, separate import flow), but is NOT modeled here.
//
// Tenant-scoped: full RLS treatment per database.md §1 — enableRLS + policy
// + composite index + FORCE RLS in a hand-written migration.
export const knuter = pgTable(
  'knuter',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    schoolId: uuid('school_id')
      .notNull()
      .references(() => schools.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    points: integer('points').notNull(),
    difficulty: text('difficulty', { enum: ['Lett', 'Medium', 'Hard', 'Valgfri'] })
      .notNull()
      .default('Medium'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    pgPolicy('knuter_tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: 'app_role',
      using: sql`school_id = NULLIF(current_setting('app.school_id', true), '')::uuid`,
      withCheck: sql`school_id = NULLIF(current_setting('app.school_id', true), '')::uuid`,
    }),
    index('knuter_school_created_idx').on(table.schoolId, table.createdAt.desc()),
  ],
).enableRLS()
