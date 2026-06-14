ALTER TABLE "users" ADD COLUMN "russ_type" text DEFAULT 'blue' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "quote" text;--> statement-breakpoint
ALTER TABLE "knuter" ADD COLUMN "category" text DEFAULT 'Generelle' NOT NULL;