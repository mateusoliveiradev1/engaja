CREATE EXTENSION IF NOT EXISTS "pgcrypto";--> statement-breakpoint
CREATE TYPE "public"."achievement_status" AS ENUM('active', 'paused', 'retired');--> statement-breakpoint
CREATE TYPE "public"."analytics_event_kind" AS ENUM('feed', 'schedule', 'operations', 'recognition', 'dashboard', 'security');--> statement-breakpoint
CREATE TYPE "public"."attention_area_severity" AS ENUM('info', 'warning', 'critical');--> statement-breakpoint
CREATE TYPE "public"."checklist_frequency" AS ENUM('opening', 'replenishment', 'quality_review', 'cleaning', 'labels', 'closing');--> statement-breakpoint
CREATE TYPE "public"."checklist_item_type" AS ENUM('boolean', 'count', 'photo', 'note', 'temperature');--> statement-breakpoint
CREATE TYPE "public"."comment_status" AS ENUM('pending', 'visible', 'hidden', 'removed');--> statement-breakpoint
CREATE TYPE "public"."completion_status" AS ENUM('pending', 'completed', 'skipped', 'blocked', 'overdue');--> statement-breakpoint
CREATE TYPE "public"."content_status" AS ENUM('draft', 'scheduled', 'active', 'closed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."feed_post_status" AS ENUM('draft', 'pending_moderation', 'published', 'hidden', 'removed', 'featured');--> statement-breakpoint
CREATE TYPE "public"."issue_severity" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."issue_status" AS ENUM('open', 'in_review', 'resolved', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."ledger_source" AS ENUM('feed_post', 'routine_completion', 'recognition', 'learning', 'manual_adjustment');--> statement-breakpoint
CREATE TYPE "public"."media_target_type" AS ENUM('feed_post', 'mission', 'evidence', 'standard', 'profile', 'recognition');--> statement-breakpoint
CREATE TYPE "public"."membership_status" AS ENUM('active', 'inactive', 'invited', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."moderation_state" AS ENUM('pending', 'approved', 'rejected', 'quarantined', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('queued', 'sent', 'failed', 'read');--> statement-breakpoint
CREATE TYPE "public"."reaction_type" AS ENUM('like', 'aplauso', 'inspirador', 'duvida');--> statement-breakpoint
CREATE TYPE "public"."recognition_category" AS ENUM('quality', 'teamwork', 'consistency', 'learning', 'improvement');--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('pending', 'accepted', 'approved', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."role_code" AS ENUM('colaborador', 'lider-setor', 'gerente-loja', 'admin-organizacao', 'auditor');--> statement-breakpoint
CREATE TYPE "public"."shift_status" AS ENUM('draft', 'published', 'cancelled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."visibility_scope" AS ENUM('private', 'department', 'store', 'organization');--> statement-breakpoint
CREATE TABLE "achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"badge_id" uuid,
	"code" varchar(80) NOT NULL,
	"title" varchar(160) NOT NULL,
	"rule" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "achievement_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"store_id" uuid,
	"department_id" uuid,
	"user_id" uuid,
	"event_name" varchar(160) NOT NULL,
	"event_kind" "analytics_event_kind" NOT NULL,
	"properties" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"store_id" uuid,
	"department_id" uuid,
	"created_by_user_id" uuid,
	"title" varchar(160) NOT NULL,
	"body" text NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attention_area_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"store_id" uuid,
	"department_id" uuid,
	"snapshot_date" date NOT NULL,
	"severity" "attention_area_severity" NOT NULL,
	"area_type" varchar(120) NOT NULL,
	"title" varchar(180) NOT NULL,
	"description" text NOT NULL,
	"evidence" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" varchar(40) DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"store_id" uuid,
	"department_id" uuid,
	"actor_user_id" uuid,
	"action" varchar(120) NOT NULL,
	"target_type" varchar(120) NOT NULL,
	"target_id" uuid,
	"request_id" varchar(120),
	"previous_state" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"new_state" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "availability_windows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"store_id" uuid,
	"department_id" uuid,
	"user_id" uuid NOT NULL,
	"weekday" integer NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"effective_from" date NOT NULL,
	"effective_to" date,
	"status" "request_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "availability_weekday_ck" CHECK ("availability_windows"."weekday" between 0 and 6)
);
--> statement-breakpoint
CREATE TABLE "badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"code" varchar(80) NOT NULL,
	"name" varchar(120) NOT NULL,
	"category" "recognition_category" NOT NULL,
	"description" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checklist_item_completions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"completed_by_user_id" uuid,
	"status" "completion_status" DEFAULT 'pending' NOT NULL,
	"note" text,
	"evidence_media_id" uuid,
	"completed_at" timestamp with time zone,
	"pending_sync" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checklist_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"checklist_id" uuid NOT NULL,
	"standard_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"title" varchar(180) NOT NULL,
	"instructions" text,
	"item_type" "checklist_item_type" DEFAULT 'boolean' NOT NULL,
	"requires_evidence" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checklist_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"department_id" uuid NOT NULL,
	"checklist_id" uuid NOT NULL,
	"shift_id" uuid,
	"assigned_user_id" uuid,
	"status" "completion_status" DEFAULT 'pending' NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"pending_sync" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checklists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"department_id" uuid NOT NULL,
	"title" varchar(160) NOT NULL,
	"frequency" "checklist_frequency" NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"feed_post_id" uuid NOT NULL,
	"author_user_id" uuid,
	"body" varchar(500) NOT NULL,
	"status" "comment_status" DEFAULT 'pending' NOT NULL,
	"moderation_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coverage_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"department_id" uuid NOT NULL,
	"weekday" integer NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"required_role_code" "role_code" DEFAULT 'colaborador' NOT NULL,
	"routine_category" "checklist_frequency" NOT NULL,
	"minimum_people" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coverage_minimum_people_ck" CHECK ("coverage_rules"."minimum_people" > 0),
	CONSTRAINT "coverage_weekday_ck" CHECK ("coverage_rules"."weekday" between 0 and 6)
);
--> statement-breakpoint
CREATE TABLE "dashboard_metric_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"store_id" uuid,
	"department_id" uuid,
	"snapshot_date" date NOT NULL,
	"metric_key" varchar(120) NOT NULL,
	"metric_value" numeric(12, 2) NOT NULL,
	"dimensions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"code" varchar(40) NOT NULL,
	"name" varchar(120) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feed_post_media" (
	"feed_post_id" uuid NOT NULL,
	"media_object_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feed_post_media_feed_post_id_media_object_id_pk" PRIMARY KEY("feed_post_id","media_object_id")
);
--> statement-breakpoint
CREATE TABLE "feed_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"store_id" uuid,
	"department_id" uuid,
	"author_user_id" uuid,
	"mission_id" uuid,
	"category" varchar(80) DEFAULT 'rotina-flv' NOT NULL,
	"caption" text NOT NULL,
	"status" "feed_post_status" DEFAULT 'pending_moderation' NOT NULL,
	"visibility_scope" "visibility_scope" DEFAULT 'department' NOT NULL,
	"pinned_at" timestamp with time zone,
	"featured_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "issue_evidence" (
	"issue_id" uuid NOT NULL,
	"media_object_id" uuid NOT NULL,
	"added_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "issue_evidence_issue_id_media_object_id_pk" PRIMARY KEY("issue_id","media_object_id")
);
--> statement-breakpoint
CREATE TABLE "issues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"department_id" uuid NOT NULL,
	"shift_id" uuid,
	"reported_by_user_id" uuid,
	"category" varchar(80) NOT NULL,
	"product_name" varchar(160),
	"quantity" numeric(10, 2),
	"severity" "issue_severity" DEFAULT 'medium' NOT NULL,
	"status" "issue_status" DEFAULT 'open' NOT NULL,
	"note" text,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_objects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"store_id" uuid,
	"department_id" uuid,
	"owner_user_id" uuid,
	"storage_provider" varchar(40) DEFAULT 'local-filesystem' NOT NULL,
	"storage_bucket" varchar(120),
	"storage_key" varchar(512) NOT NULL,
	"content_type" varchar(120) NOT NULL,
	"byte_size" integer NOT NULL,
	"sha256_hash" varchar(64) NOT NULL,
	"width" integer,
	"height" integer,
	"target_type" "media_target_type" NOT NULL,
	"access_scope" "visibility_scope" DEFAULT 'department' NOT NULL,
	"moderation_state" "moderation_state" DEFAULT 'quarantined' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"finalized_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_objects_byte_size_ck" CHECK ("media_objects"."byte_size" > 0)
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"store_id" uuid,
	"department_id" uuid,
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"status" "membership_status" DEFAULT 'active' NOT NULL,
	"starts_at" date DEFAULT now() NOT NULL,
	"ends_at" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moderation_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"store_id" uuid,
	"department_id" uuid,
	"actor_user_id" uuid,
	"target_type" varchar(80) NOT NULL,
	"target_id" uuid NOT NULL,
	"action" varchar(80) NOT NULL,
	"reason" text,
	"previous_state" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"new_state" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(80) NOT NULL,
	"name" varchar(160) NOT NULL,
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"timezone" varchar(80) DEFAULT 'America/Sao_Paulo' NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(120) NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "photo_missions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"store_id" uuid,
	"department_id" uuid,
	"created_by_user_id" uuid,
	"title" varchar(160) NOT NULL,
	"prompt" text NOT NULL,
	"reward_points" integer DEFAULT 0 NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "photo_missions_window_ck" CHECK ("photo_missions"."ends_at" > "photo_missions"."starts_at")
);
--> statement-breakpoint
CREATE TABLE "points_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"store_id" uuid,
	"department_id" uuid,
	"user_id" uuid NOT NULL,
	"actor_user_id" uuid,
	"source" "ledger_source" NOT NULL,
	"source_id" uuid,
	"amount" integer NOT NULL,
	"reason" varchar(240) NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "points_ledger_amount_nonzero_ck" CHECK ("points_ledger"."amount" <> 0)
);
--> statement-breakpoint
CREATE TABLE "poll_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"poll_id" uuid NOT NULL,
	"label" varchar(160) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "poll_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"poll_id" uuid NOT NULL,
	"option_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "polls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"store_id" uuid,
	"department_id" uuid,
	"created_by_user_id" uuid,
	"title" varchar(160) NOT NULL,
	"prompt" text NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"closes_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quality_standards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"store_id" uuid,
	"department_id" uuid,
	"title" varchar(160) NOT NULL,
	"product_category" varchar(80) NOT NULL,
	"instructions" text NOT NULL,
	"reference_media_id" uuid,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"feed_post_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "reaction_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recognition_anti_abuse_counters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"actor_user_id" uuid NOT NULL,
	"recipient_user_id" uuid NOT NULL,
	"category" "recognition_category" NOT NULL,
	"window_start_at" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recognition_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"store_id" uuid,
	"department_id" uuid,
	"sender_user_id" uuid,
	"recipient_user_id" uuid NOT NULL,
	"category" "recognition_category" NOT NULL,
	"message" varchar(500) NOT NULL,
	"source_feed_post_id" uuid,
	"source_checklist_run_id" uuid,
	"points_awarded" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"code" "role_code" NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text NOT NULL,
	"system_role" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedule_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"store_id" uuid,
	"department_id" uuid,
	"user_id" uuid,
	"shift_id" uuid,
	"type" varchar(80) NOT NULL,
	"status" "notification_status" DEFAULT 'queued' NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"sent_at" timestamp with time zone,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"department_id" uuid NOT NULL,
	"shift_id" uuid NOT NULL,
	"leader_user_id" uuid,
	"completed_routine_count" integer DEFAULT 0 NOT NULL,
	"overdue_routine_count" integer DEFAULT 0 NOT NULL,
	"open_issue_count" integer DEFAULT 0 NOT NULL,
	"wins" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"risks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_swap_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"department_id" uuid NOT NULL,
	"requester_user_id" uuid NOT NULL,
	"requester_shift_id" uuid NOT NULL,
	"target_user_id" uuid,
	"target_shift_id" uuid,
	"status" "request_status" DEFAULT 'pending' NOT NULL,
	"accepted_at" timestamp with time zone,
	"reviewed_by_user_id" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"department_id" uuid NOT NULL,
	"user_id" uuid,
	"role_code" "role_code" DEFAULT 'colaborador' NOT NULL,
	"title" varchar(120) NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"break_minutes" integer DEFAULT 0 NOT NULL,
	"status" "shift_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shifts_window_ck" CHECK ("shifts"."ends_at" > "shifts"."starts_at"),
	CONSTRAINT "shifts_break_minutes_ck" CHECK ("shifts"."break_minutes" >= 0)
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"code" varchar(40) NOT NULL,
	"name" varchar(160) NOT NULL,
	"timezone" varchar(80) DEFAULT 'America/Sao_Paulo' NOT NULL,
	"address" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "time_off_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"store_id" uuid,
	"department_id" uuid,
	"user_id" uuid NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date NOT NULL,
	"reason" text,
	"status" "request_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by_user_id" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "time_off_window_ck" CHECK ("time_off_requests"."ends_on" >= "time_off_requests"."starts_on")
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"achievement_id" uuid NOT NULL,
	"awarded_by_user_id" uuid,
	"awarded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(320) NOT NULL,
	"display_name" varchar(160) NOT NULL,
	"preferred_name" varchar(80),
	"phone_number" varchar(40),
	"external_auth_id" varchar(160),
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_badge_id_badges_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attention_area_snapshots" ADD CONSTRAINT "attention_area_snapshots_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attention_area_snapshots" ADD CONSTRAINT "attention_area_snapshots_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attention_area_snapshots" ADD CONSTRAINT "attention_area_snapshots_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_windows" ADD CONSTRAINT "availability_windows_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_windows" ADD CONSTRAINT "availability_windows_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_windows" ADD CONSTRAINT "availability_windows_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_windows" ADD CONSTRAINT "availability_windows_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_windows" ADD CONSTRAINT "availability_windows_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "badges" ADD CONSTRAINT "badges_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_item_completions" ADD CONSTRAINT "checklist_item_completions_run_id_checklist_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."checklist_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_item_completions" ADD CONSTRAINT "checklist_item_completions_item_id_checklist_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."checklist_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_item_completions" ADD CONSTRAINT "checklist_item_completions_completed_by_user_id_users_id_fk" FOREIGN KEY ("completed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_item_completions" ADD CONSTRAINT "checklist_item_completions_evidence_media_id_media_objects_id_fk" FOREIGN KEY ("evidence_media_id") REFERENCES "public"."media_objects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_checklist_id_checklists_id_fk" FOREIGN KEY ("checklist_id") REFERENCES "public"."checklists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_standard_id_quality_standards_id_fk" FOREIGN KEY ("standard_id") REFERENCES "public"."quality_standards"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_runs" ADD CONSTRAINT "checklist_runs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_runs" ADD CONSTRAINT "checklist_runs_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_runs" ADD CONSTRAINT "checklist_runs_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_runs" ADD CONSTRAINT "checklist_runs_checklist_id_checklists_id_fk" FOREIGN KEY ("checklist_id") REFERENCES "public"."checklists"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_runs" ADD CONSTRAINT "checklist_runs_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_runs" ADD CONSTRAINT "checklist_runs_assigned_user_id_users_id_fk" FOREIGN KEY ("assigned_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklists" ADD CONSTRAINT "checklists_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklists" ADD CONSTRAINT "checklists_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklists" ADD CONSTRAINT "checklists_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_feed_post_id_feed_posts_id_fk" FOREIGN KEY ("feed_post_id") REFERENCES "public"."feed_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coverage_rules" ADD CONSTRAINT "coverage_rules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coverage_rules" ADD CONSTRAINT "coverage_rules_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coverage_rules" ADD CONSTRAINT "coverage_rules_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_metric_snapshots" ADD CONSTRAINT "dashboard_metric_snapshots_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_metric_snapshots" ADD CONSTRAINT "dashboard_metric_snapshots_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_metric_snapshots" ADD CONSTRAINT "dashboard_metric_snapshots_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_post_media" ADD CONSTRAINT "feed_post_media_feed_post_id_feed_posts_id_fk" FOREIGN KEY ("feed_post_id") REFERENCES "public"."feed_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_post_media" ADD CONSTRAINT "feed_post_media_media_object_id_media_objects_id_fk" FOREIGN KEY ("media_object_id") REFERENCES "public"."media_objects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_posts" ADD CONSTRAINT "feed_posts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_posts" ADD CONSTRAINT "feed_posts_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_posts" ADD CONSTRAINT "feed_posts_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_posts" ADD CONSTRAINT "feed_posts_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_posts" ADD CONSTRAINT "feed_posts_mission_id_photo_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."photo_missions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_evidence" ADD CONSTRAINT "issue_evidence_issue_id_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_evidence" ADD CONSTRAINT "issue_evidence_media_object_id_media_objects_id_fk" FOREIGN KEY ("media_object_id") REFERENCES "public"."media_objects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_evidence" ADD CONSTRAINT "issue_evidence_added_by_user_id_users_id_fk" FOREIGN KEY ("added_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_reported_by_user_id_users_id_fk" FOREIGN KEY ("reported_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_objects" ADD CONSTRAINT "media_objects_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_objects" ADD CONSTRAINT "media_objects_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_objects" ADD CONSTRAINT "media_objects_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_objects" ADD CONSTRAINT "media_objects_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photo_missions" ADD CONSTRAINT "photo_missions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photo_missions" ADD CONSTRAINT "photo_missions_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photo_missions" ADD CONSTRAINT "photo_missions_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photo_missions" ADD CONSTRAINT "photo_missions_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_ledger" ADD CONSTRAINT "points_ledger_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_ledger" ADD CONSTRAINT "points_ledger_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_ledger" ADD CONSTRAINT "points_ledger_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_ledger" ADD CONSTRAINT "points_ledger_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_ledger" ADD CONSTRAINT "points_ledger_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_options" ADD CONSTRAINT "poll_options_poll_id_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_poll_id_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_option_id_poll_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."poll_options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "polls" ADD CONSTRAINT "polls_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "polls" ADD CONSTRAINT "polls_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "polls" ADD CONSTRAINT "polls_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "polls" ADD CONSTRAINT "polls_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_standards" ADD CONSTRAINT "quality_standards_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_standards" ADD CONSTRAINT "quality_standards_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_standards" ADD CONSTRAINT "quality_standards_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_standards" ADD CONSTRAINT "quality_standards_reference_media_id_media_objects_id_fk" FOREIGN KEY ("reference_media_id") REFERENCES "public"."media_objects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_feed_post_id_feed_posts_id_fk" FOREIGN KEY ("feed_post_id") REFERENCES "public"."feed_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recognition_anti_abuse_counters" ADD CONSTRAINT "recognition_anti_abuse_counters_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recognition_anti_abuse_counters" ADD CONSTRAINT "recognition_anti_abuse_counters_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recognition_anti_abuse_counters" ADD CONSTRAINT "recognition_anti_abuse_counters_recipient_user_id_users_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recognition_events" ADD CONSTRAINT "recognition_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recognition_events" ADD CONSTRAINT "recognition_events_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recognition_events" ADD CONSTRAINT "recognition_events_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recognition_events" ADD CONSTRAINT "recognition_events_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recognition_events" ADD CONSTRAINT "recognition_events_recipient_user_id_users_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recognition_events" ADD CONSTRAINT "recognition_events_source_feed_post_id_feed_posts_id_fk" FOREIGN KEY ("source_feed_post_id") REFERENCES "public"."feed_posts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recognition_events" ADD CONSTRAINT "recognition_events_source_checklist_run_id_checklist_runs_id_fk" FOREIGN KEY ("source_checklist_run_id") REFERENCES "public"."checklist_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_notifications" ADD CONSTRAINT "schedule_notifications_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_notifications" ADD CONSTRAINT "schedule_notifications_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_notifications" ADD CONSTRAINT "schedule_notifications_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_notifications" ADD CONSTRAINT "schedule_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_notifications" ADD CONSTRAINT "schedule_notifications_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_summaries" ADD CONSTRAINT "shift_summaries_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_summaries" ADD CONSTRAINT "shift_summaries_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_summaries" ADD CONSTRAINT "shift_summaries_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_summaries" ADD CONSTRAINT "shift_summaries_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_summaries" ADD CONSTRAINT "shift_summaries_leader_user_id_users_id_fk" FOREIGN KEY ("leader_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_swap_requests" ADD CONSTRAINT "shift_swap_requests_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_swap_requests" ADD CONSTRAINT "shift_swap_requests_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_swap_requests" ADD CONSTRAINT "shift_swap_requests_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_swap_requests" ADD CONSTRAINT "shift_swap_requests_requester_user_id_users_id_fk" FOREIGN KEY ("requester_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_swap_requests" ADD CONSTRAINT "shift_swap_requests_requester_shift_id_shifts_id_fk" FOREIGN KEY ("requester_shift_id") REFERENCES "public"."shifts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_swap_requests" ADD CONSTRAINT "shift_swap_requests_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_swap_requests" ADD CONSTRAINT "shift_swap_requests_target_shift_id_shifts_id_fk" FOREIGN KEY ("target_shift_id") REFERENCES "public"."shifts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_swap_requests" ADD CONSTRAINT "shift_swap_requests_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_off_requests" ADD CONSTRAINT "time_off_requests_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_off_requests" ADD CONSTRAINT "time_off_requests_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_off_requests" ADD CONSTRAINT "time_off_requests_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_off_requests" ADD CONSTRAINT "time_off_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_off_requests" ADD CONSTRAINT "time_off_requests_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_awarded_by_user_id_users_id_fk" FOREIGN KEY ("awarded_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "achievements_organization_code_uq" ON "achievements" USING btree ("organization_id","code");--> statement-breakpoint
CREATE INDEX "analytics_events_filters_idx" ON "analytics_events" USING btree ("organization_id","store_id","department_id","event_kind","occurred_at");--> statement-breakpoint
CREATE INDEX "analytics_events_user_idx" ON "analytics_events" USING btree ("user_id","occurred_at");--> statement-breakpoint
CREATE INDEX "announcements_scope_published_idx" ON "announcements" USING btree ("organization_id","store_id","department_id","status","published_at");--> statement-breakpoint
CREATE INDEX "attention_area_filters_idx" ON "attention_area_snapshots" USING btree ("organization_id","store_id","department_id","snapshot_date","severity");--> statement-breakpoint
CREATE INDEX "audit_logs_query_idx" ON "audit_logs" USING btree ("organization_id","store_id","department_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_user_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_target_idx" ON "audit_logs" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "availability_user_idx" ON "availability_windows" USING btree ("user_id","weekday","effective_from");--> statement-breakpoint
CREATE UNIQUE INDEX "badges_organization_code_uq" ON "badges" USING btree ("organization_id","code");--> statement-breakpoint
CREATE INDEX "checklist_item_completions_run_idx" ON "checklist_item_completions" USING btree ("run_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "checklist_item_completions_run_item_uq" ON "checklist_item_completions" USING btree ("run_id","item_id");--> statement-breakpoint
CREATE INDEX "checklist_items_checklist_idx" ON "checklist_items" USING btree ("checklist_id","sort_order");--> statement-breakpoint
CREATE INDEX "checklist_runs_due_idx" ON "checklist_runs" USING btree ("store_id","department_id","status","due_at");--> statement-breakpoint
CREATE INDEX "checklist_runs_shift_idx" ON "checklist_runs" USING btree ("shift_id");--> statement-breakpoint
CREATE INDEX "checklists_scope_frequency_idx" ON "checklists" USING btree ("store_id","department_id","frequency","active");--> statement-breakpoint
CREATE INDEX "comments_post_status_idx" ON "comments" USING btree ("feed_post_id","status","created_at");--> statement-breakpoint
CREATE INDEX "comments_author_idx" ON "comments" USING btree ("author_user_id","created_at");--> statement-breakpoint
CREATE INDEX "coverage_rules_lookup_idx" ON "coverage_rules" USING btree ("store_id","department_id","weekday","active");--> statement-breakpoint
CREATE INDEX "dashboard_metric_filters_idx" ON "dashboard_metric_snapshots" USING btree ("organization_id","store_id","department_id","snapshot_date","metric_key");--> statement-breakpoint
CREATE UNIQUE INDEX "dashboard_metric_snapshot_uq" ON "dashboard_metric_snapshots" USING btree ("organization_id","store_id","department_id","snapshot_date","metric_key");--> statement-breakpoint
CREATE INDEX "departments_scope_idx" ON "departments" USING btree ("organization_id","store_id");--> statement-breakpoint
CREATE UNIQUE INDEX "departments_store_code_uq" ON "departments" USING btree ("store_id","code");--> statement-breakpoint
CREATE INDEX "feed_post_media_media_idx" ON "feed_post_media" USING btree ("media_object_id");--> statement-breakpoint
CREATE INDEX "feed_posts_pagination_idx" ON "feed_posts" USING btree ("organization_id","store_id","department_id","status","published_at");--> statement-breakpoint
CREATE INDEX "feed_posts_author_idx" ON "feed_posts" USING btree ("author_user_id","created_at");--> statement-breakpoint
CREATE INDEX "feed_posts_mission_idx" ON "feed_posts" USING btree ("mission_id");--> statement-breakpoint
CREATE INDEX "issue_evidence_media_idx" ON "issue_evidence" USING btree ("media_object_id");--> statement-breakpoint
CREATE INDEX "issues_attention_idx" ON "issues" USING btree ("organization_id","store_id","department_id","status","severity");--> statement-breakpoint
CREATE INDEX "issues_shift_idx" ON "issues" USING btree ("shift_id");--> statement-breakpoint
CREATE INDEX "media_objects_scope_idx" ON "media_objects" USING btree ("organization_id","store_id","department_id");--> statement-breakpoint
CREATE INDEX "media_objects_owner_idx" ON "media_objects" USING btree ("owner_user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "media_objects_storage_key_uq" ON "media_objects" USING btree ("storage_provider","storage_key");--> statement-breakpoint
CREATE INDEX "memberships_permission_lookup_idx" ON "memberships" USING btree ("organization_id","store_id","department_id","user_id");--> statement-breakpoint
CREATE INDEX "memberships_role_idx" ON "memberships" USING btree ("role_id");--> statement-breakpoint
CREATE UNIQUE INDEX "memberships_user_scope_role_uq" ON "memberships" USING btree ("user_id","organization_id","store_id","department_id","role_id");--> statement-breakpoint
CREATE INDEX "moderation_actions_target_idx" ON "moderation_actions" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "moderation_actions_actor_idx" ON "moderation_actions" USING btree ("actor_user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "organizations_slug_uq" ON "organizations" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "permissions_key_uq" ON "permissions" USING btree ("key");--> statement-breakpoint
CREATE INDEX "photo_missions_scope_status_idx" ON "photo_missions" USING btree ("organization_id","store_id","department_id","status","starts_at");--> statement-breakpoint
CREATE INDEX "points_ledger_user_idx" ON "points_ledger" USING btree ("user_id","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "points_ledger_source_user_uq" ON "points_ledger" USING btree ("organization_id","source","source_id","user_id");--> statement-breakpoint
CREATE INDEX "poll_options_poll_idx" ON "poll_options" USING btree ("poll_id");--> statement-breakpoint
CREATE UNIQUE INDEX "poll_votes_poll_user_uq" ON "poll_votes" USING btree ("poll_id","user_id");--> statement-breakpoint
CREATE INDEX "polls_scope_status_idx" ON "polls" USING btree ("organization_id","store_id","status");--> statement-breakpoint
CREATE INDEX "quality_standards_scope_idx" ON "quality_standards" USING btree ("organization_id","store_id","department_id","active");--> statement-breakpoint
CREATE INDEX "reactions_post_idx" ON "reactions" USING btree ("feed_post_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reactions_post_user_uq" ON "reactions" USING btree ("feed_post_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "recognition_abuse_window_uq" ON "recognition_anti_abuse_counters" USING btree ("organization_id","actor_user_id","recipient_user_id","category","window_start_at");--> statement-breakpoint
CREATE INDEX "recognition_recipient_idx" ON "recognition_events" USING btree ("recipient_user_id","created_at");--> statement-breakpoint
CREATE INDEX "recognition_scope_idx" ON "recognition_events" USING btree ("organization_id","store_id","department_id","created_at");--> statement-breakpoint
CREATE INDEX "role_permissions_permission_idx" ON "role_permissions" USING btree ("permission_id");--> statement-breakpoint
CREATE INDEX "roles_organization_idx" ON "roles" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "roles_organization_code_uq" ON "roles" USING btree ("organization_id","code");--> statement-breakpoint
CREATE INDEX "schedule_notifications_user_idx" ON "schedule_notifications" USING btree ("user_id","status","created_at");--> statement-breakpoint
CREATE INDEX "schedule_notifications_shift_idx" ON "schedule_notifications" USING btree ("shift_id");--> statement-breakpoint
CREATE INDEX "shift_summaries_dashboard_idx" ON "shift_summaries" USING btree ("organization_id","store_id","department_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "shift_summaries_shift_uq" ON "shift_summaries" USING btree ("shift_id");--> statement-breakpoint
CREATE INDEX "shift_swap_pending_idx" ON "shift_swap_requests" USING btree ("organization_id","store_id","department_id","status");--> statement-breakpoint
CREATE INDEX "shift_swap_requester_idx" ON "shift_swap_requests" USING btree ("requester_user_id","created_at");--> statement-breakpoint
CREATE INDEX "shifts_schedule_lookup_idx" ON "shifts" USING btree ("organization_id","store_id","department_id","starts_at","status");--> statement-breakpoint
CREATE INDEX "shifts_user_lookup_idx" ON "shifts" USING btree ("user_id","starts_at");--> statement-breakpoint
CREATE INDEX "stores_organization_idx" ON "stores" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "stores_organization_code_uq" ON "stores" USING btree ("organization_id","code");--> statement-breakpoint
CREATE INDEX "time_off_scope_status_idx" ON "time_off_requests" USING btree ("organization_id","store_id","status","starts_on");--> statement-breakpoint
CREATE INDEX "user_achievements_user_idx" ON "user_achievements" USING btree ("user_id","awarded_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_achievements_user_achievement_uq" ON "user_achievements" USING btree ("user_id","achievement_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_uq" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_external_auth_id_uq" ON "users" USING btree ("external_auth_id");
