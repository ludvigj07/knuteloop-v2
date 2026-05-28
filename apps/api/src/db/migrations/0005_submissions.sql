CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"knute_id" uuid NOT NULL,
	"image_key" text NOT NULL,
	"caption" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "submissions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_knute_id_knuter_id_fk" FOREIGN KEY ("knute_id") REFERENCES "public"."knuter"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "submissions_school_created_idx" ON "submissions" USING btree ("school_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "submissions_user_idx" ON "submissions" USING btree ("school_id","user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "submissions_pending_idx" ON "submissions" USING btree ("school_id","created_at" DESC NULLS LAST) WHERE status = 'pending';--> statement-breakpoint
CREATE POLICY "submissions_tenant_isolation" ON "submissions" AS PERMISSIVE FOR ALL TO "app_role" USING (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid) WITH CHECK (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid);