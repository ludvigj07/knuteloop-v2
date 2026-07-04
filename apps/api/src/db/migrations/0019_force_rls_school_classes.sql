-- FORCE makes the table OWNER obey RLS too (drizzle's enableRLS() only emits
-- ENABLE). Without it the app role — which owns the table in dev — silently
-- bypasses every policy. Same hand-written step as every tenant table
-- (database.md §3).
ALTER TABLE "school_classes" FORCE ROW LEVEL SECURITY;
