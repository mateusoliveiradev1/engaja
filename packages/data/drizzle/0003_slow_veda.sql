CREATE TYPE "public"."access_invite_status" AS ENUM('pending', 'accepted', 'revoked', 'expired');--> statement-breakpoint
CREATE TYPE "public"."auth_credential_status" AS ENUM('active', 'disabled', 'rotated');--> statement-breakpoint
CREATE TYPE "public"."auth_provider_kind" AS ENUM('password', 'better-auth', 'neon-auth', 'oauth', 'sso');--> statement-breakpoint
CREATE TYPE "public"."auth_session_status" AS ENUM('active', 'revoked', 'expired');--> statement-breakpoint
CREATE TYPE "public"."recovery_token_status" AS ENUM('pending', 'used', 'revoked', 'expired');--> statement-breakpoint
CREATE TABLE "access_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"store_id" uuid,
	"department_id" uuid,
	"email" varchar(320) NOT NULL,
	"role_id" uuid NOT NULL,
	"role_code" "role_code" NOT NULL,
	"token_hash" varchar(128) NOT NULL,
	"status" "access_invite_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"invited_by_user_id" uuid,
	"accepted_by_user_id" uuid,
	"accepted_at" timestamp with time zone,
	"revoked_by_user_id" uuid,
	"revoked_at" timestamp with time zone,
	"resent_at" timestamp with time zone,
	"resend_count" integer DEFAULT 0 NOT NULL,
	"delivery_channel" varchar(40) DEFAULT 'manual' NOT NULL,
	"intended_membership" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "access_invites_email_lower_ck" CHECK ("access_invites"."email" = lower("access_invites"."email")),
	CONSTRAINT "access_invites_resend_count_ck" CHECK ("access_invites"."resend_count" >= 0),
	CONSTRAINT "access_invites_accepted_at_ck" CHECK ("access_invites"."status" <> 'accepted' or "access_invites"."accepted_at" is not null),
	CONSTRAINT "access_invites_revoked_at_ck" CHECK ("access_invites"."status" <> 'revoked' or "access_invites"."revoked_at" is not null)
);
--> statement-breakpoint
CREATE TABLE "auth_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"email" varchar(320) NOT NULL,
	"password_hash" text NOT NULL,
	"password_hash_version" varchar(40) DEFAULT 'argon2id' NOT NULL,
	"status" "auth_credential_status" DEFAULT 'active' NOT NULL,
	"failed_attempt_count" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"password_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_verified_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_credentials_email_lower_ck" CHECK ("auth_credentials"."email" = lower("auth_credentials"."email")),
	CONSTRAINT "auth_credentials_failed_attempts_ck" CHECK ("auth_credentials"."failed_attempt_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "auth_provider_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" "auth_provider_kind" NOT NULL,
	"provider_account_id" varchar(240) NOT NULL,
	"email" varchar(320),
	"status" "auth_credential_status" DEFAULT 'active' NOT NULL,
	"linked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_token_hash" varchar(128) NOT NULL,
	"provider" "auth_provider_kind" DEFAULT 'password' NOT NULL,
	"provider_subject" varchar(240) NOT NULL,
	"status" "auth_session_status" DEFAULT 'active' NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"last_seen_at" timestamp with time zone,
	"ip_address" varchar(80),
	"user_agent" varchar(512),
	"device_label" varchar(160),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_sessions_window_ck" CHECK ("auth_sessions"."expires_at" > "auth_sessions"."issued_at"),
	CONSTRAINT "auth_sessions_revoked_at_ck" CHECK ("auth_sessions"."status" <> 'revoked' or "auth_sessions"."revoked_at" is not null)
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(128) NOT NULL,
	"status" "recovery_token_status" DEFAULT 'pending' NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"request_ip" varchar(80),
	"user_agent" varchar(512),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_window_ck" CHECK ("password_reset_tokens"."expires_at" > "password_reset_tokens"."requested_at"),
	CONSTRAINT "password_reset_tokens_used_at_ck" CHECK ("password_reset_tokens"."status" <> 'used' or "password_reset_tokens"."used_at" is not null),
	CONSTRAINT "password_reset_tokens_revoked_at_ck" CHECK ("password_reset_tokens"."status" <> 'revoked' or "password_reset_tokens"."revoked_at" is not null)
);
--> statement-breakpoint
ALTER TABLE "access_invites" ADD CONSTRAINT "access_invites_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_invites" ADD CONSTRAINT "access_invites_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_invites" ADD CONSTRAINT "access_invites_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_invites" ADD CONSTRAINT "access_invites_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_invites" ADD CONSTRAINT "access_invites_invited_by_user_id_users_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_invites" ADD CONSTRAINT "access_invites_accepted_by_user_id_users_id_fk" FOREIGN KEY ("accepted_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_invites" ADD CONSTRAINT "access_invites_revoked_by_user_id_users_id_fk" FOREIGN KEY ("revoked_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_credentials" ADD CONSTRAINT "auth_credentials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_provider_accounts" ADD CONSTRAINT "auth_provider_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "access_invites_lookup_idx" ON "access_invites" USING btree ("token_hash","status","expires_at");--> statement-breakpoint
CREATE INDEX "access_invites_email_status_idx" ON "access_invites" USING btree ("organization_id","email","status");--> statement-breakpoint
CREATE INDEX "access_invites_scope_status_idx" ON "access_invites" USING btree ("organization_id","store_id","department_id","status","expires_at");--> statement-breakpoint
CREATE INDEX "access_invites_inviter_idx" ON "access_invites" USING btree ("invited_by_user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "access_invites_token_hash_uq" ON "access_invites" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "auth_credentials_user_status_idx" ON "auth_credentials" USING btree ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_credentials_email_uq" ON "auth_credentials" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_credentials_user_uq" ON "auth_credentials" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_provider_accounts_user_idx" ON "auth_provider_accounts" USING btree ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_provider_accounts_provider_subject_uq" ON "auth_provider_accounts" USING btree ("provider","provider_account_id");--> statement-breakpoint
CREATE INDEX "auth_sessions_lookup_idx" ON "auth_sessions" USING btree ("session_token_hash","status","expires_at");--> statement-breakpoint
CREATE INDEX "auth_sessions_user_status_idx" ON "auth_sessions" USING btree ("user_id","status","expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_sessions_token_hash_uq" ON "auth_sessions" USING btree ("session_token_hash");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_lookup_idx" ON "password_reset_tokens" USING btree ("token_hash","status","expires_at");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_user_status_idx" ON "password_reset_tokens" USING btree ("user_id","status","expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "password_reset_tokens_hash_uq" ON "password_reset_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("organization_id","action","created_at");