import { sql } from 'drizzle-orm'
import { pgTable, uuid, timestamp, unique, pgPolicy } from 'drizzle-orm/pg-core'
import { schools } from './schools'
import { users } from './users'
import { knuter } from './knuter'
import { libraryKnuter } from './library'

// Records which library knuter a school has imported (ADR-0014). Powers the
// "added" badge in the browse UI (shown everywhere the knute appears, for any of
// the school's 2+ knutesjefer) and dedupe (each library knute imports once per
// school — the unique constraint below). Tenant-scoped: full RLS.
//
// `knute_id` points at the school's COPY in `knuter`. Deleting that copy cascades
// this row away, so the school can re-import the library knute later.
export const schoolLibraryImports = pgTable(
  'school_library_imports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    schoolId: uuid('school_id')
      .notNull()
      .references(() => schools.id, { onDelete: 'cascade' }),
    libraryKnuteId: uuid('library_knute_id')
      .notNull()
      .references(() => libraryKnuter.id, { onDelete: 'cascade' }),
    knuteId: uuid('knute_id')
      .notNull()
      .references(() => knuter.id, { onDelete: 'cascade' }),
    importedByUserId: uuid('imported_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    pgPolicy('school_library_imports_tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: 'app_role',
      using: sql`school_id = NULLIF(current_setting('app.school_id', true), '')::uuid`,
      withCheck: sql`school_id = NULLIF(current_setting('app.school_id', true), '')::uuid`,
    }),
    // The unique constraint's backing btree index (school_id, library_knute_id) —
    // leading on school_id — satisfies the database.md §1 tenant-index requirement
    // AND serves the route's (school_id, library_knute_id) lookup join. No separate
    // index needed (a standalone one would just duplicate this).
    unique('school_library_import_unique').on(table.schoolId, table.libraryKnuteId),
  ],
).enableRLS()
