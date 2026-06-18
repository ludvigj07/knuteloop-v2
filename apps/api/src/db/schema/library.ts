import { pgTable, uuid, text, integer, boolean, timestamp, index, unique } from 'drizzle-orm/pg-core'

// The CENTRAL knute library — curated, shared across ALL schools (ADR-0014).
// NOT tenant-scoped: no school_id, no RLS. A knutesjef browses these and imports
// COPIES into their own per-school `knuter` (the import=copy flow lands in PR-3b).
//
// Access model: the app role has SELECT only; only a Knuteloop super-admin
// (admin_role) curates the catalog. The read-only grant is enforced at the DB
// level in migration 0014_library_force_rls_and_grants.sql (and mirrored in the dev
// + test setup, which otherwise re-grant write on ALL tables). A bug in app code
// therefore cannot corrupt the catalog that every school depends on.
//
// INVARIANT (deployment): migrations MUST run as a privileged role (superuser /
// admin_role), NOT as app_role. These tables have no RLS, so a table OWNER bypasses
// the REVOKE — read-only holds only because app_role does not own them. The
// read-only tests in library.test.ts assert app_role cannot write (proving non-ownership
// in CI); production deploy must preserve the same migration-role invariant.

export const libraryKnuter = pgTable(
  'library_knuter',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    description: text('description'),
    points: integer('points').notNull(),
    // Mirror `knuter` exactly so an import is a clean field-for-field copy.
    difficulty: text('difficulty', { enum: ['Lett', 'Medium', 'Hard', 'Valgfri'] })
      .notNull()
      .default('Medium'),
    // 'media' (photo/video) or 'text' (no media — legally sensitive knuter). Copied
    // to the school's knute on import and unrelaxable by the school. ADR-0014.
    evidenceType: text('evidence_type', { enum: ['media', 'text'] }).notNull().default('media'),
    // 17 (all-ages) or 18 (adult-only). Only the Sex folder is 18+ in the seed. ADR-0015.
    minAge: integer('min_age').notNull().default(17),
    // The TYPE axis — the theme this knute belongs to (Generelle / Dobbel / Rampestrek
    // / Alkohol / Sex). On import it becomes the school folder the knute is filed under.
    suggestedFolder: text('suggested_folder').notNull(),
    // The GEOGRAPHY axis — discovery filter only (Stavanger / Oslo / Bergen …). NULL =
    // "Nasjonalt" (works anywhere). Does NOT propagate to school folders on import.
    region: text('region'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('library_knuter_folder_idx').on(table.suggestedFolder),
    index('library_knuter_region_idx').on(table.region),
  ],
)

// Named bundles a knutesjef can import wholesale (e.g. "Anbefalt starter"). A
// library knute can belong to several packs (M2M below), so it can appear in the
// starter pack AND elsewhere. Students never see the word "pakke" — on the school
// side it just becomes folders.
export const libraryPacks = pgTable(
  'library_packs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description'),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('library_packs_name_unique').on(table.name)],
)

// Many-to-many: which library knuter are in which pack.
export const libraryPackMemberships = pgTable(
  'library_pack_memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    packId: uuid('pack_id')
      .notNull()
      .references(() => libraryPacks.id, { onDelete: 'cascade' }),
    libraryKnuteId: uuid('library_knute_id')
      .notNull()
      .references(() => libraryKnuter.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('library_pack_membership_unique').on(table.packId, table.libraryKnuteId),
    index('library_pack_memberships_pack_idx').on(table.packId),
  ],
)
