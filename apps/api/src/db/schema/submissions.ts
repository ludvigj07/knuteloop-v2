import { sql } from 'drizzle-orm'
import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  uniqueIndex,
  pgPolicy,
} from 'drizzle-orm/pg-core'
import { schools } from './schools'
import { users } from './users'
import { knuter } from './knuter'

// Tenant-scoped: each submission belongs to one school. Full RLS treatment.
// Status lifecycle: pending → approved | rejected (set by knutesjef review).
// image_key is the Bunny storage key; for now any non-empty string is accepted.
// Real Bunny existence verification comes when the storage integration ships.
export const submissions = pgTable(
  'submissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    schoolId: uuid('school_id')
      .notNull()
      .references(() => schools.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    knuteId: uuid('knute_id')
      .notNull()
      .references(() => knuter.id),
    // Bunny storage key for media submissions. NULL for text-only knuter
    // (evidence_type='text') — there the caption IS the evidence (ADR-0014).
    imageKey: text('image_key'),
    caption: text('caption'),
    status: text('status', { enum: ['pending', 'approved', 'rejected'] })
      .notNull()
      .default('pending'),
    reviewedBy: uuid('reviewed_by').references(() => users.id),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    pgPolicy('submissions_tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: 'app_role',
      using: sql`school_id = NULLIF(current_setting('app.school_id', true), '')::uuid`,
      withCheck: sql`school_id = NULLIF(current_setting('app.school_id', true), '')::uuid`,
    }),
    // List feeds / leaderboards: ordered by created_at desc within a school.
    index('submissions_school_created_idx').on(table.schoolId, table.createdAt.desc()),
    // Per-user history (profile screen, etc.).
    index('submissions_user_idx').on(table.schoolId, table.userId, table.createdAt.desc()),
    // Knutesjef "pending review" queue — partial index keeps it small.
    index('submissions_pending_idx')
      .on(table.schoolId, table.createdAt.desc())
      .where(sql`status = 'pending'`),
    // Social feed: approved submissions newest-first within a school. Partial
    // index matches the feed query's WHERE status = 'approved' filter exactly,
    // so the feed never has to scan/sort pending+rejected rows.
    index('submissions_feed_approved_idx')
      .on(table.schoolId, table.createdAt.desc())
      .where(sql`status = 'approved'`),
    // At most ONE active (pending OR approved) submission per (school, user, knute).
    // DB-level guard against the duplicate-submission race (S0-8): the application
    // read-then-insert check can be passed by two concurrent POSTs, but this unique
    // index makes the second INSERT fail → the handler catches it and returns 409.
    // Rejected rows are excluded, so re-submitting after a rejection still works.
    uniqueIndex('submissions_one_active_per_user_knute_idx')
      .on(table.schoolId, table.userId, table.knuteId)
      .where(sql`status in ('pending', 'approved')`),
  ],
).enableRLS()
