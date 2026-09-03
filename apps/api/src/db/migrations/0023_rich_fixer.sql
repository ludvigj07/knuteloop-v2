CREATE TABLE "knute_bookmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"knute_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "knute_bookmarks_user_knute_unique" UNIQUE("user_id","knute_id")
);
--> statement-breakpoint
ALTER TABLE "knute_bookmarks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "knute_bookmarks" ADD CONSTRAINT "knute_bookmarks_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knute_bookmarks" ADD CONSTRAINT "knute_bookmarks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knute_bookmarks" ADD CONSTRAINT "knute_bookmarks_knute_id_knuter_id_fk" FOREIGN KEY ("knute_id") REFERENCES "public"."knuter"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "knute_bookmarks_user_idx" ON "knute_bookmarks" USING btree ("school_id","user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "knute_bookmarks_knute_idx" ON "knute_bookmarks" USING btree ("school_id","knute_id");--> statement-breakpoint
CREATE POLICY "knute_bookmarks_tenant_isolation" ON "knute_bookmarks" AS PERMISSIVE FOR ALL TO "app_role" USING (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid) WITH CHECK (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid);