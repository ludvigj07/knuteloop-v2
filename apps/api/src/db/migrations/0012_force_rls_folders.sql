-- FORCE RLS for the new tenant tables. drizzle-kit emits ENABLE but NOT FORCE;
-- without FORCE the table owner (app_role) bypasses the policies silently.
-- See database.md §3. Hand-written to accompany 0011_knute_folders.
ALTER TABLE "knute_folders" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "knute_folder_memberships" FORCE ROW LEVEL SECURITY;
