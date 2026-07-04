import { sql } from 'drizzle-orm'
import { pgTable, uuid, text, timestamp, unique, pgPolicy } from 'drizzle-orm/pg-core'
import { schools } from './schools'

// The school's classes (e.g. «3STA»), created by the knutesjef; students CLAIM
// membership via users.class_id (v1 flow: forced button-pick at login — the
// picker returns when real auth lands). A separate table, NOT free text on
// users, so «3STA»/«3sta» can never fragment into two classes and the claim UI
// is a button list. Drives the toppliste's «Klassen min» + «Klassekamp» views.
// Tenant-scoped: full RLS treatment per database.md §1. The unique(school_id,
// name) backing index doubles as the required school_id-leading index.
export const schoolClasses = pgTable(
  'school_classes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    schoolId: uuid('school_id')
      .notNull()
      .references(() => schools.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    pgPolicy('school_classes_tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: 'app_role',
      using: sql`school_id = NULLIF(current_setting('app.school_id', true), '')::uuid`,
      withCheck: sql`school_id = NULLIF(current_setting('app.school_id', true), '')::uuid`,
    }),
    unique('school_classes_school_name_unique').on(table.schoolId, table.name),
  ],
).enableRLS()
