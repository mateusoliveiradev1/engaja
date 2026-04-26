CREATE TYPE "public"."engagement_archive_item_status" AS ENUM('recorded', 'corrected', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."engagement_archive_item_type" AS ENUM('badge-awarded', 'recognition-received', 'featured-post', 'validated-banca', 'challenge-completed', 'challenge-won', 'reward-granted', 'manual-prize');--> statement-breakpoint
CREATE TYPE "public"."engagement_campaign_period_preset" AS ENUM('weekly', 'monthly', 'custom');--> statement-breakpoint
CREATE TYPE "public"."engagement_campaign_status" AS ENUM('draft', 'scheduled', 'active', 'closed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."engagement_eligible_event_status" AS ENUM('counted', 'excluded', 'corrected', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."engagement_event_source_type" AS ENUM('approved-photo-post', 'validated-banca-setup', 'approved-before-after', 'checklist-linked-evidence', 'consistency-streak', 'recognition', 'reward-grant', 'manual-adjustment');--> statement-breakpoint
CREATE TYPE "public"."engagement_metric_type" AS ENUM('approved-photo-post', 'validated-banca-setup', 'approved-before-after', 'checklist-linked-evidence', 'consistency-streak');--> statement-breakpoint
CREATE TYPE "public"."engagement_reward_grant_status" AS ENUM('digital-granted', 'pending-company-approval', 'approved-for-fulfillment', 'fulfilled', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."engagement_reward_type" AS ENUM('digital', 'manual-company-approved', 'manual-external-informal');--> statement-breakpoint
CREATE TYPE "public"."engagement_settlement_mode" AS ENUM('automatic', 'manual-review');--> statement-breakpoint
CREATE TABLE "collaborator_archive_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"store_id" uuid,
	"department_id" uuid,
	"user_id" uuid NOT NULL,
	"campaign_id" uuid,
	"reward_grant_id" uuid,
	"source_type" "engagement_event_source_type" NOT NULL,
	"source_id" varchar(160) NOT NULL,
	"source_action" varchar(240) NOT NULL,
	"type" "engagement_archive_item_type" NOT NULL,
	"title" varchar(160) NOT NULL,
	"granting_rule" varchar(240) NOT NULL,
	"related_content_reference" varchar(240),
	"responsible_approver_user_id" uuid,
	"reward_status" "engagement_reward_grant_status",
	"status" "engagement_archive_item_status" DEFAULT 'recorded' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "collaborator_archive_items_reward_status_ck" CHECK ((("collaborator_archive_items"."type" in ('reward-granted', 'manual-prize')) and "collaborator_archive_items"."reward_status" is not null) or (("collaborator_archive_items"."type" not in ('reward-granted', 'manual-prize')) and "collaborator_archive_items"."reward_status" is null))
);
--> statement-breakpoint
CREATE TABLE "eligible_engagement_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"store_id" uuid,
	"department_id" uuid,
	"actor_user_id" uuid NOT NULL,
	"campaign_id" uuid,
	"source_type" "engagement_event_source_type" NOT NULL,
	"source_id" varchar(160) NOT NULL,
	"rule_label" varchar(160) NOT NULL,
	"rule_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"score_value" integer DEFAULT 0 NOT NULL,
	"status" "engagement_eligible_event_status" DEFAULT 'counted' NOT NULL,
	"awarded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "eligible_engagement_events_score_nonnegative_ck" CHECK ("eligible_engagement_events"."score_value" >= 0)
);
--> statement-breakpoint
CREATE TABLE "engagement_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"store_id" uuid,
	"department_id" uuid,
	"created_by_user_id" uuid NOT NULL,
	"title" varchar(160) NOT NULL,
	"description" text NOT NULL,
	"objective" varchar(160) NOT NULL,
	"status" "engagement_campaign_status" DEFAULT 'draft' NOT NULL,
	"period_preset" "engagement_campaign_period_preset" DEFAULT 'custom' NOT NULL,
	"metric_type" "engagement_metric_type" NOT NULL,
	"points_per_eligible_event" integer DEFAULT 1 NOT NULL,
	"require_unique_sources" boolean DEFAULT true NOT NULL,
	"max_events_per_user" integer,
	"tie_breakers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"eligible_user_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"max_events_per_day" integer,
	"requires_approved_feed_post" boolean DEFAULT false NOT NULL,
	"requires_operational_validation" boolean DEFAULT false NOT NULL,
	"settlement_mode" "engagement_settlement_mode" DEFAULT 'automatic' NOT NULL,
	"winner_count" integer DEFAULT 1 NOT NULL,
	"reward_type" "engagement_reward_type" NOT NULL,
	"reward_title" varchar(160) NOT NULL,
	"reward_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "engagement_campaigns_window_ck" CHECK ("engagement_campaigns"."ends_at" > "engagement_campaigns"."starts_at"),
	CONSTRAINT "engagement_campaigns_points_per_event_ck" CHECK ("engagement_campaigns"."points_per_eligible_event" > 0),
	CONSTRAINT "engagement_campaigns_max_events_per_user_ck" CHECK ("engagement_campaigns"."max_events_per_user" is null or "engagement_campaigns"."max_events_per_user" > 0),
	CONSTRAINT "engagement_campaigns_max_events_per_day_ck" CHECK ("engagement_campaigns"."max_events_per_day" is null or "engagement_campaigns"."max_events_per_day" > 0),
	CONSTRAINT "engagement_campaigns_winner_count_ck" CHECK ("engagement_campaigns"."winner_count" > 0)
);
--> statement-breakpoint
CREATE TABLE "reward_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"store_id" uuid,
	"department_id" uuid,
	"campaign_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"winning_score" integer DEFAULT 0 NOT NULL,
	"reward_type" "engagement_reward_type" NOT NULL,
	"reward_title" varchar(160) NOT NULL,
	"reward_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "engagement_reward_grant_status" NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approved_at" timestamp with time zone,
	"approved_by_user_id" uuid,
	"fulfilled_at" timestamp with time zone,
	"fulfilled_by_user_id" uuid,
	"canceled_at" timestamp with time zone,
	"canceled_by_user_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reward_grants_position_positive_ck" CHECK ("reward_grants"."position" > 0),
	CONSTRAINT "reward_grants_winning_score_nonnegative_ck" CHECK ("reward_grants"."winning_score" >= 0),
	CONSTRAINT "reward_grants_official_reward_type_ck" CHECK ("reward_grants"."reward_type" <> 'manual-external-informal'),
	CONSTRAINT "reward_grants_digital_status_ck" CHECK ("reward_grants"."reward_type" <> 'digital' or "reward_grants"."status" = 'digital-granted'),
	CONSTRAINT "reward_grants_manual_status_ck" CHECK ("reward_grants"."reward_type" <> 'manual-company-approved' or "reward_grants"."status" <> 'digital-granted'),
	CONSTRAINT "reward_grants_approved_metadata_ck" CHECK ("reward_grants"."status" not in ('approved-for-fulfillment', 'fulfilled') or ("reward_grants"."approved_at" is not null and "reward_grants"."approved_by_user_id" is not null)),
	CONSTRAINT "reward_grants_fulfilled_metadata_ck" CHECK ("reward_grants"."status" <> 'fulfilled' or ("reward_grants"."fulfilled_at" is not null and "reward_grants"."fulfilled_by_user_id" is not null)),
	CONSTRAINT "reward_grants_canceled_metadata_ck" CHECK ("reward_grants"."status" <> 'canceled' or "reward_grants"."canceled_at" is not null)
);
--> statement-breakpoint
ALTER TABLE "collaborator_archive_items" ADD CONSTRAINT "collaborator_archive_items_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaborator_archive_items" ADD CONSTRAINT "collaborator_archive_items_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaborator_archive_items" ADD CONSTRAINT "collaborator_archive_items_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaborator_archive_items" ADD CONSTRAINT "collaborator_archive_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaborator_archive_items" ADD CONSTRAINT "collaborator_archive_items_campaign_id_engagement_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."engagement_campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaborator_archive_items" ADD CONSTRAINT "collaborator_archive_items_reward_grant_id_reward_grants_id_fk" FOREIGN KEY ("reward_grant_id") REFERENCES "public"."reward_grants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaborator_archive_items" ADD CONSTRAINT "collaborator_archive_items_responsible_approver_user_id_users_id_fk" FOREIGN KEY ("responsible_approver_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eligible_engagement_events" ADD CONSTRAINT "eligible_engagement_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eligible_engagement_events" ADD CONSTRAINT "eligible_engagement_events_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eligible_engagement_events" ADD CONSTRAINT "eligible_engagement_events_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eligible_engagement_events" ADD CONSTRAINT "eligible_engagement_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eligible_engagement_events" ADD CONSTRAINT "eligible_engagement_events_campaign_id_engagement_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."engagement_campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engagement_campaigns" ADD CONSTRAINT "engagement_campaigns_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engagement_campaigns" ADD CONSTRAINT "engagement_campaigns_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engagement_campaigns" ADD CONSTRAINT "engagement_campaigns_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engagement_campaigns" ADD CONSTRAINT "engagement_campaigns_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_grants" ADD CONSTRAINT "reward_grants_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_grants" ADD CONSTRAINT "reward_grants_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_grants" ADD CONSTRAINT "reward_grants_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_grants" ADD CONSTRAINT "reward_grants_campaign_id_engagement_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."engagement_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_grants" ADD CONSTRAINT "reward_grants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_grants" ADD CONSTRAINT "reward_grants_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_grants" ADD CONSTRAINT "reward_grants_fulfilled_by_user_id_users_id_fk" FOREIGN KEY ("fulfilled_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_grants" ADD CONSTRAINT "reward_grants_canceled_by_user_id_users_id_fk" FOREIGN KEY ("canceled_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "collaborator_archive_items_user_idx" ON "collaborator_archive_items" USING btree ("user_id","occurred_at");--> statement-breakpoint
CREATE INDEX "collaborator_archive_items_campaign_idx" ON "collaborator_archive_items" USING btree ("campaign_id","occurred_at");--> statement-breakpoint
CREATE INDEX "collaborator_archive_items_reward_idx" ON "collaborator_archive_items" USING btree ("reward_grant_id");--> statement-breakpoint
CREATE INDEX "collaborator_archive_items_scope_type_idx" ON "collaborator_archive_items" USING btree ("organization_id","type","occurred_at");--> statement-breakpoint
CREATE INDEX "eligible_engagement_events_actor_idx" ON "eligible_engagement_events" USING btree ("actor_user_id","awarded_at");--> statement-breakpoint
CREATE INDEX "eligible_engagement_events_campaign_idx" ON "eligible_engagement_events" USING btree ("campaign_id","actor_user_id","status","awarded_at");--> statement-breakpoint
CREATE INDEX "eligible_engagement_events_scope_source_idx" ON "eligible_engagement_events" USING btree ("organization_id","source_type","source_id");--> statement-breakpoint
CREATE UNIQUE INDEX "eligible_engagement_events_campaign_source_uq" ON "eligible_engagement_events" USING btree ("organization_id","campaign_id","actor_user_id","source_type","source_id");--> statement-breakpoint
CREATE INDEX "engagement_campaigns_scope_status_idx" ON "engagement_campaigns" USING btree ("organization_id","store_id","department_id","status","starts_at");--> statement-breakpoint
CREATE INDEX "engagement_campaigns_metric_idx" ON "engagement_campaigns" USING btree ("organization_id","metric_type","status","starts_at");--> statement-breakpoint
CREATE INDEX "engagement_campaigns_creator_idx" ON "engagement_campaigns" USING btree ("created_by_user_id","created_at");--> statement-breakpoint
CREATE INDEX "reward_grants_campaign_idx" ON "reward_grants" USING btree ("campaign_id","position");--> statement-breakpoint
CREATE INDEX "reward_grants_user_idx" ON "reward_grants" USING btree ("user_id","granted_at");--> statement-breakpoint
CREATE INDEX "reward_grants_status_idx" ON "reward_grants" USING btree ("organization_id","status","granted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "reward_grants_campaign_user_uq" ON "reward_grants" USING btree ("campaign_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reward_grants_campaign_position_uq" ON "reward_grants" USING btree ("campaign_id","position");--> statement-breakpoint
DO $$
DECLARE
  tenant_table text;
BEGIN
  FOREACH tenant_table IN ARRAY ARRAY[
    'engagement_campaigns',
    'eligible_engagement_events',
    'reward_grants',
    'collaborator_archive_items'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tenant_table);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL USING (organization_id = nullif(current_setting(''app.organization_id'', true), '''')::uuid) WITH CHECK (organization_id = nullif(current_setting(''app.organization_id'', true), '''')::uuid)',
      tenant_table || '_tenant_isolation',
      tenant_table
    );
  END LOOP;
END $$;
