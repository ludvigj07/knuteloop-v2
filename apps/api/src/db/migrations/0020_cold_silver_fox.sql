ALTER TABLE "submissions" ADD COLUMN "visibility" text DEFAULT 'private' NOT NULL;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "shared_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "submissions_feed_shared_idx" ON "submissions" USING btree ("school_id","shared_at" DESC NULLS LAST) WHERE status = 'approved' and visibility = 'shared';