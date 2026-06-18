import { sql } from 'drizzle-orm'
import { pgTable, uuid, text, integer, timestamp, index, unique, pgPolicy } from 'drizzle-orm/pg-core'
import { schools } from './schools'
import { knuter } from './knuter'

// Per-school folders the knutesjef creates to organize their knuter (the
// school side of the library — ADR-0014). The "Alle knuter" view is implicit
// (the unfiltered knute list), NOT a stored folder. Tenant-scoped: full RLS.
export const knuteFolders = pgTable(
  'knute_folders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    schoolId: uuid('school_id')
      .notNull()
      .references(() => schools.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    pgPolicy('knute_folders_tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: 'app_role',
      using: sql`school_id = NULLIF(current_setting('app.school_id', true), '')::uuid`,
      withCheck: sql`school_id = NULLIF(current_setting('app.school_id', true), '')::uuid`,
    }),
    index('knute_folders_school_sort_idx').on(table.schoolId, table.sortOrder),
    unique('knute_folders_school_name_unique').on(table.schoolId, table.name),
  ],
).enableRLS()

// Many-to-many knute ↔ folder. A knute can sit in several folders (and is always
// in the implicit "Alle knuter" view regardless). Tenant-scoped: full RLS.
export const knuteFolderMemberships = pgTable(
  'knute_folder_memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    schoolId: uuid('school_id')
      .notNull()
      .references(() => schools.id, { onDelete: 'cascade' }),
    knuteId: uuid('knute_id')
      .notNull()
      .references(() => knuter.id, { onDelete: 'cascade' }),
    folderId: uuid('folder_id')
      .notNull()
      .references(() => knuteFolders.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    pgPolicy('knute_folder_memberships_tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: 'app_role',
      using: sql`school_id = NULLIF(current_setting('app.school_id', true), '')::uuid`,
      withCheck: sql`school_id = NULLIF(current_setting('app.school_id', true), '')::uuid`,
    }),
    unique('knute_folder_membership_unique').on(table.knuteId, table.folderId),
    index('knute_folder_memberships_folder_idx').on(table.schoolId, table.folderId),
    index('knute_folder_memberships_knute_idx').on(table.schoolId, table.knuteId),
  ],
).enableRLS()
