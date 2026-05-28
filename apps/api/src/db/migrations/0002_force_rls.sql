-- FORCE RLS for every tenant-scoped table.
-- Without FORCE, the table owner bypasses policies silently. See database.md §3.
ALTER TABLE "users" FORCE ROW LEVEL SECURITY;
