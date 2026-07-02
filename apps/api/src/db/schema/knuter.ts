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
import { libraryKnuter } from './library'

// Per-school knuter — the school's own list: custom knuter the knutesjef
// creates PLUS copies imported from the central library (./library.ts via
// lib/library-import.ts; provenance in source_library_knute_id). ADR-0014.
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
    // LEGACY theme axis (the five v1 folders). Real folders are knute_folders +
    // knute_folder_memberships (ADR-0014); this enum survives only because the
    // profile category rings (routes/me.ts) still read it. Slated for removal.
    category: text('category', {
      enum: ['Generelle', 'Dobbelknuter', 'Alkoholknuter', 'Sexknuter', 'Fordervett-knuter'],
    })
      .notNull()
      .default('Generelle'),
    // "Gullknute" — a special, usually traditional knute the knutesjef marks as
    // gold. It is an EXPLICIT choice, NOT a points threshold (v1 mis-modelled it
    // as points >= N). Drives the gold count + gold styling. See ADR-0013.
    isGold: boolean('is_gold').notNull().default(false),
    // Evidence required to submit: 'media' (photo/video) or 'text' (no media). Text-only
    // for sensitive knuter to mitigate legal risk; library-set + unrelaxable by schools. ADR-0014.
    evidenceType: text('evidence_type', { enum: ['media', 'text'] }).notNull().default('media'),
    // Minimum age to see/submit: 17 (all-ages) or 18 (adult-only). Gated against the
    // user's Vipps-verified is_adult flag — minors never see/submit 18+ knuter. ADR-0015.
    minAge: integer('min_age').notNull().default(17),
    // Provenance: the central-library knute this was imported from (ADR-0014).
    // NULL for school-created (custom) knuter. ON DELETE SET NULL so retiring a
    // library entry never deletes a school's own copy.
    sourceLibraryKnuteId: uuid('source_library_knute_id').references(() => libraryKnuter.id, {
      onDelete: 'set null',
    }),
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
