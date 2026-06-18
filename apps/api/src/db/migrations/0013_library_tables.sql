CREATE TABLE "library_knuter" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"points" integer NOT NULL,
	"difficulty" text DEFAULT 'Medium' NOT NULL,
	"evidence_type" text DEFAULT 'media' NOT NULL,
	"min_age" integer DEFAULT 17 NOT NULL,
	"suggested_folder" text NOT NULL,
	"region" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library_pack_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pack_id" uuid NOT NULL,
	"library_knute_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "library_pack_membership_unique" UNIQUE("pack_id","library_knute_id")
);
--> statement-breakpoint
CREATE TABLE "library_packs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "library_packs_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "school_library_imports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"library_knute_id" uuid NOT NULL,
	"knute_id" uuid NOT NULL,
	"imported_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "school_library_import_unique" UNIQUE("school_id","library_knute_id")
);
--> statement-breakpoint
ALTER TABLE "school_library_imports" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "knuter" ADD COLUMN "source_library_knute_id" uuid;--> statement-breakpoint
ALTER TABLE "library_pack_memberships" ADD CONSTRAINT "library_pack_memberships_pack_id_library_packs_id_fk" FOREIGN KEY ("pack_id") REFERENCES "public"."library_packs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_pack_memberships" ADD CONSTRAINT "library_pack_memberships_library_knute_id_library_knuter_id_fk" FOREIGN KEY ("library_knute_id") REFERENCES "public"."library_knuter"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_library_imports" ADD CONSTRAINT "school_library_imports_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_library_imports" ADD CONSTRAINT "school_library_imports_library_knute_id_library_knuter_id_fk" FOREIGN KEY ("library_knute_id") REFERENCES "public"."library_knuter"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_library_imports" ADD CONSTRAINT "school_library_imports_knute_id_knuter_id_fk" FOREIGN KEY ("knute_id") REFERENCES "public"."knuter"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_library_imports" ADD CONSTRAINT "school_library_imports_imported_by_user_id_users_id_fk" FOREIGN KEY ("imported_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "library_knuter_folder_idx" ON "library_knuter" USING btree ("suggested_folder");--> statement-breakpoint
CREATE INDEX "library_knuter_region_idx" ON "library_knuter" USING btree ("region");--> statement-breakpoint
CREATE INDEX "library_pack_memberships_pack_idx" ON "library_pack_memberships" USING btree ("pack_id");--> statement-breakpoint
ALTER TABLE "knuter" ADD CONSTRAINT "knuter_source_library_knute_id_library_knuter_id_fk" FOREIGN KEY ("source_library_knute_id") REFERENCES "public"."library_knuter"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "school_library_imports_tenant_isolation" ON "school_library_imports" AS PERMISSIVE FOR ALL TO "app_role" USING (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid) WITH CHECK (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid);