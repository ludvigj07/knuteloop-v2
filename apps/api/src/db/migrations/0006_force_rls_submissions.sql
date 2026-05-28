-- FORCE RLS for submissions. Without this, the table owner bypasses
-- policies silently. See database.md §3.
ALTER TABLE "submissions" FORCE ROW LEVEL SECURITY;
