ALTER TABLE "users" ADD COLUMN "is_adult" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "knuter" ADD COLUMN "evidence_type" text DEFAULT 'media' NOT NULL;--> statement-breakpoint
ALTER TABLE "knuter" ADD COLUMN "min_age" integer DEFAULT 17 NOT NULL;