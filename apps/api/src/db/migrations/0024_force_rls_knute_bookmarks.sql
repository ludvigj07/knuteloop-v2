-- FORCE RLS for knute_bookmarks. drizzle-kit emits ENABLE but NOT FORCE;
-- without FORCE the table owner (app_role) bypasses the tenant policy
-- silently. See database.md §3. Hand-written to accompany 0023_rich_fixer.
ALTER TABLE "knute_bookmarks" FORCE ROW LEVEL SECURITY;
