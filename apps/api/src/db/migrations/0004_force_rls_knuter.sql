-- FORCE RLS for knuter. Without this, the table owner bypasses policies
-- silently. See database.md §3.
ALTER TABLE "knuter" FORCE ROW LEVEL SECURITY;
