CREATE TYPE "public"."media_upload_context" AS ENUM('feed-post', 'routine-evidence', 'issue-evidence');--> statement-breakpoint
CREATE TYPE "public"."media_upload_state" AS ENUM('pending_upload', 'uploaded', 'finalized', 'failed', 'cleaned');--> statement-breakpoint
CREATE TABLE "media_upload_intents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"store_id" uuid,
	"department_id" uuid,
	"owner_user_id" uuid NOT NULL,
	"storage_provider" varchar(40) DEFAULT 'local-filesystem' NOT NULL,
	"storage_bucket" varchar(120),
	"storage_key" varchar(512) NOT NULL,
	"requested_content_type" varchar(120) NOT NULL,
	"target_context" "media_upload_context" NOT NULL,
	"target_type" "media_target_type" NOT NULL,
	"access_scope" "visibility_scope" DEFAULT 'private' NOT NULL,
	"upload_state" "media_upload_state" DEFAULT 'pending_upload' NOT NULL,
	"max_byte_size" integer NOT NULL,
	"uploaded_byte_size" integer,
	"media_object_id" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"uploaded_at" timestamp with time zone,
	"finalized_at" timestamp with time zone,
	"cleaned_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_upload_intents_max_byte_size_ck" CHECK ("media_upload_intents"."max_byte_size" > 0),
	CONSTRAINT "media_upload_intents_uploaded_byte_size_ck" CHECK ("media_upload_intents"."uploaded_byte_size" is null or "media_upload_intents"."uploaded_byte_size" > 0)
);
--> statement-breakpoint
ALTER TABLE "media_upload_intents" ADD CONSTRAINT "media_upload_intents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_upload_intents" ADD CONSTRAINT "media_upload_intents_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_upload_intents" ADD CONSTRAINT "media_upload_intents_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_upload_intents" ADD CONSTRAINT "media_upload_intents_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_upload_intents" ADD CONSTRAINT "media_upload_intents_media_object_id_media_objects_id_fk" FOREIGN KEY ("media_object_id") REFERENCES "public"."media_objects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "media_upload_intents_owner_idx" ON "media_upload_intents" USING btree ("owner_user_id","created_at");--> statement-breakpoint
CREATE INDEX "media_upload_intents_state_idx" ON "media_upload_intents" USING btree ("upload_state","expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "media_upload_intents_storage_key_uq" ON "media_upload_intents" USING btree ("storage_provider","storage_key");--> statement-breakpoint
CREATE UNIQUE INDEX "media_upload_intents_media_object_uq" ON "media_upload_intents" USING btree ("media_object_id");