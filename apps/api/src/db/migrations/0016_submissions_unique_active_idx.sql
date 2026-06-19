-- S0-8: prevent duplicate submissions under a concurrent-POST race.
-- At most ONE active (pending OR approved) submission per (school, user, knute).
-- Rejected rows are excluded → re-submitting after a rejection still works.
-- NOTE: plain (non-CONCURRENTLY) index — at pilot scale the submissions table is
-- tiny and the write-lock is negligible. At national scale, build this with
-- CREATE UNIQUE INDEX CONCURRENTLY manually (outside the migrator's transaction).
-- PRE-CHECK before applying to any DB with real data: there must be no existing
-- duplicate active rows, or the index build fails (see /migration-plan output).
CREATE UNIQUE INDEX "submissions_one_active_per_user_knute_idx" ON "submissions" USING btree ("school_id","user_id","knute_id") WHERE status in ('pending', 'approved');
