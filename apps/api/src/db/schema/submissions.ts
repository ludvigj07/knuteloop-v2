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
    // Who may SEE the evidence (ADR-0021). 'shared' = feed + public profile
    // grid (once approved); 'private' = owner + knutesjef only. Points and
    // streak count either way. Default 'private' = privacy by default (GDPR
    // Art. 25 — some users are minors); the client sends the choice explicitly.
    // Invariant (ADR-0022, code-enforced): 'shared' ⇒ image_key IS NOT NULL —
    // the feed is a visual surface; text-only evidence can never be shared.
    visibility: text('visibility', { enum: ['shared', 'private'] })
      .notNull()
      .default('private'),
    // When the submission FIRST became shared: insert time for born-shared
    // rows, first flip time for late shares. Drives feed ordering (share time,
    // not submit time — a late-shared post surfaces at the top, not buried).
    // Set once and kept on hide/re-share so re-sharing can't bump a post.
    // Invariant (code-enforced): visibility = 'shared' ⇒ shared_at IS NOT NULL.
    sharedAt: timestamp('shared_at', { withTimezone: true }),
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
    // NOTE (ADR-0021): the feed now also filters visibility='shared' and sorts
    // by shared_at — served by submissions_feed_shared_idx below. This index is
    // kept for now (no drive-by removals); drop in a later cleanup migration.
    index('submissions_feed_approved_idx')
      .on(table.schoolId, table.createdAt.desc())
      .where(sql`status = 'approved'`),
    // The feed query's exact shape after ADR-0021: approved AND shared, ordered
    // by share time. Partial → pending/rejected/private rows never bloat it.
    index('submissions_feed_shared_idx')
      .on(table.schoolId, table.sharedAt.desc())
      .where(sql`status = 'approved' and visibility = 'shared'`),
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
