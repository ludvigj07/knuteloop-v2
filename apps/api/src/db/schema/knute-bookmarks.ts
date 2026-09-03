import { sql } from 'drizzle-orm'
import type { SchoolId } from '../../lib/ids'
import { pgTable, uuid, timestamp, index, unique, pgPolicy } from 'drizzle-orm/pg-core'
import { schools } from './schools'
import { users } from './users'
import { knuter } from './knuter'

// A student bookmarking a knute they want to do later, so one spotted in the
// feed is not lost in the catalog afterwards. This is the
// FIRST per-user relation to a knute: until now the model only had
// school → knute and user → submission.
//
// Deliberately NOT a "like": nothing here is visible to anyone but the owner,
// there is no count, and nothing is published. Public reaction counts are a
// pressure mechanic we keep out of a product whose users can be 17 (ADR-0023).
//
// Tenant-scoped: full RLS treatment per database.md §1 — enableRLS + policy +
// composite index + FORCE RLS in a hand-written migration. The policy isolates
// by SCHOOL; per-USER privacy is enforced in the route (every query filters on
// the caller's userId), the same way submissions handle ownership.
export const knuteBookmarks = pgTable(
  'knute_bookmarks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    schoolId: uuid('school_id')
      .notNull()
      .references(() => schools.id, { onDelete: 'cascade' })
      .$type<SchoolId>(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // Cascade: a knute the knutesjef deletes disappears from every bookmark list.
    // A bookmark is a pointer, never worth keeping past its target.
    knuteId: uuid('knute_id')
      .notNull()
      .references(() => knuter.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    pgPolicy('knute_bookmarks_tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: 'app_role',
      using: sql`school_id = NULLIF(current_setting('app.school_id', true), '')::uuid`,
      withCheck: sql`school_id = NULLIF(current_setting('app.school_id', true), '')::uuid`,
    }),
    // Bookmarking is idempotent — the route relies on this constraint via
    // onConflictDoNothing rather than reading before writing.
    unique('knute_bookmarks_user_knute_unique').on(table.userId, table.knuteId),
    // The list query: this user's stars, newest first.
    index('knute_bookmarks_user_idx').on(table.schoolId, table.userId, table.createdAt.desc()),
    // For the ON DELETE CASCADE from knuter: without an index leading on knute_id,
    // deleting a knute scans this whole table to find its bookmarks. (The
    // isBookmarked lookups filter on user first and are served by user_idx.)
    index('knute_bookmarks_knute_idx').on(table.schoolId, table.knuteId),
  ],
).enableRLS()
