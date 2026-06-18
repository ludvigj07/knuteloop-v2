-- Post-generate hardening for the library batch — drizzle-kit emits neither of these.
-- Hand-written to accompany 0013_library_tables (see database.md §3 / the 0012 precedent).

-- 1) FORCE RLS on the tenant table. drizzle emits ENABLE but NOT FORCE; without
--    FORCE the table owner (app_role) bypasses the tenant policy silently.
ALTER TABLE "school_library_imports" FORCE ROW LEVEL SECURITY;--> statement-breakpoint

-- 2) The library_* catalog is shared across schools and curated by admin_role
--    (the Knuteloop super-admin) ONLY. app_role keeps SELECT (from the 0000 default
--    grant) but loses writes, so an app-layer bug can never corrupt the catalog that
--    every school imports from. ADR-0014 / database.md §1.
--
--    DEPLOYMENT INVARIANT: library_* have NO RLS, so a table OWNER bypasses this
--    REVOKE (unlike RLS tables, where FORCE binds the owner). Read-only therefore
--    holds ONLY as long as app_role does not OWN these tables — i.e. migrations MUST
--    run as a privileged role (superuser / admin_role), never as app_role. The
--    read-only tests in library.test.ts assert app_role cannot write, which proves
--    non-ownership in CI; production deploy must preserve the same migration-role.
--
--    NB: dev-setup.ts + test-db.ts run a blanket GRANT ... ON ALL TABLES after
--    migrate(), so they re-apply this REVOKE to reproduce production behaviour.
REVOKE INSERT, UPDATE, DELETE ON "library_knuter" FROM app_role;--> statement-breakpoint
REVOKE INSERT, UPDATE, DELETE ON "library_packs" FROM app_role;--> statement-breakpoint
REVOKE INSERT, UPDATE, DELETE ON "library_pack_memberships" FROM app_role;
