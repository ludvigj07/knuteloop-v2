CREATE TABLE "knute_folder_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"knute_id" uuid NOT NULL,
	"folder_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "knute_folder_membership_unique" UNIQUE("knute_id","folder_id")
);
--> statement-breakpoint
ALTER TABLE "knute_folder_memberships" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "knute_folders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "knute_folders_school_name_unique" UNIQUE("school_id","name")
);
--> statement-breakpoint
ALTER TABLE "knute_folders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "knute_folder_memberships" ADD CONSTRAINT "knute_folder_memberships_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knute_folder_memberships" ADD CONSTRAINT "knute_folder_memberships_knute_id_knuter_id_fk" FOREIGN KEY ("knute_id") REFERENCES "public"."knuter"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knute_folder_memberships" ADD CONSTRAINT "knute_folder_memberships_folder_id_knute_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."knute_folders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knute_folders" ADD CONSTRAINT "knute_folders_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "knute_folder_memberships_folder_idx" ON "knute_folder_memberships" USING btree ("school_id","folder_id");--> statement-breakpoint
CREATE INDEX "knute_folder_memberships_knute_idx" ON "knute_folder_memberships" USING btree ("school_id","knute_id");--> statement-breakpoint
CREATE INDEX "knute_folders_school_sort_idx" ON "knute_folders" USING btree ("school_id","sort_order");--> statement-breakpoint
CREATE POLICY "knute_folder_memberships_tenant_isolation" ON "knute_folder_memberships" AS PERMISSIVE FOR ALL TO "app_role" USING (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid) WITH CHECK (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "knute_folders_tenant_isolation" ON "knute_folders" AS PERMISSIVE FOR ALL TO "app_role" USING (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid) WITH CHECK (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid);