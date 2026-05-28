CREATE TABLE "knuter" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"points" integer NOT NULL,
	"difficulty" text DEFAULT 'Medium' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "knuter" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "knuter" ADD CONSTRAINT "knuter_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "knuter_school_created_idx" ON "knuter" USING btree ("school_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE POLICY "knuter_tenant_isolation" ON "knuter" AS PERMISSIVE FOR ALL TO "app_role" USING (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid) WITH CHECK (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid);--> statement-breakpoint
ALTER POLICY "users_tenant_isolation" ON "users" TO app_role USING (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid) WITH CHECK (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid);