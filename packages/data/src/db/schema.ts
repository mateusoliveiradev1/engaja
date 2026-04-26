import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const jsonObjectDefault = sql`'{}'::jsonb`;
const jsonArrayDefault = sql`'[]'::jsonb`;

const timestamps = () => ({
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const roleCodeEnum = pgEnum("role_code", [
  "colaborador",
  "lider-setor",
  "gerente-loja",
  "admin-organizacao",
  "auditor",
]);

export const membershipStatusEnum = pgEnum("membership_status", [
  "active",
  "inactive",
  "invited",
  "suspended",
]);

export const authCredentialStatusEnum = pgEnum("auth_credential_status", [
  "active",
  "disabled",
  "rotated",
]);

export const authProviderKindEnum = pgEnum("auth_provider_kind", [
  "password",
  "better-auth",
  "neon-auth",
  "oauth",
  "sso",
]);

export const authSessionStatusEnum = pgEnum("auth_session_status", [
  "active",
  "revoked",
  "expired",
]);

export const accessInviteStatusEnum = pgEnum("access_invite_status", [
  "pending",
  "accepted",
  "revoked",
  "expired",
]);

export const recoveryTokenStatusEnum = pgEnum("recovery_token_status", [
  "pending",
  "used",
  "revoked",
  "expired",
]);

export const visibilityScopeEnum = pgEnum("visibility_scope", [
  "private",
  "department",
  "store",
  "organization",
]);

export const moderationStateEnum = pgEnum("moderation_state", [
  "pending",
  "approved",
  "rejected",
  "quarantined",
  "blocked",
]);

export const feedPostStatusEnum = pgEnum("feed_post_status", [
  "draft",
  "pending_moderation",
  "published",
  "hidden",
  "removed",
  "featured",
]);

export const reactionTypeEnum = pgEnum("reaction_type", [
  "like",
  "aplauso",
  "inspirador",
  "duvida",
]);

export const commentStatusEnum = pgEnum("comment_status", [
  "pending",
  "visible",
  "hidden",
  "removed",
]);

export const contentStatusEnum = pgEnum("content_status", [
  "draft",
  "scheduled",
  "active",
  "closed",
  "archived",
]);

export const mediaTargetTypeEnum = pgEnum("media_target_type", [
  "feed_post",
  "mission",
  "evidence",
  "standard",
  "profile",
  "recognition",
]);

export const mediaUploadContextEnum = pgEnum("media_upload_context", [
  "feed-post",
  "routine-evidence",
  "issue-evidence",
]);

export const mediaUploadStateEnum = pgEnum("media_upload_state", [
  "pending_upload",
  "uploaded",
  "finalized",
  "failed",
  "cleaned",
]);

export const shiftStatusEnum = pgEnum("shift_status", [
  "draft",
  "published",
  "cancelled",
  "completed",
]);

export const requestStatusEnum = pgEnum("request_status", [
  "pending",
  "accepted",
  "approved",
  "rejected",
  "cancelled",
]);

export const notificationStatusEnum = pgEnum("notification_status", [
  "queued",
  "sent",
  "failed",
  "read",
]);

export const checklistFrequencyEnum = pgEnum("checklist_frequency", [
  "opening",
  "replenishment",
  "quality_review",
  "cleaning",
  "labels",
  "closing",
]);

export const checklistItemTypeEnum = pgEnum("checklist_item_type", [
  "boolean",
  "count",
  "photo",
  "note",
  "temperature",
]);

export const completionStatusEnum = pgEnum("completion_status", [
  "pending",
  "completed",
  "skipped",
  "blocked",
  "overdue",
]);

export const issueSeverityEnum = pgEnum("issue_severity", ["low", "medium", "high", "critical"]);

export const issueStatusEnum = pgEnum("issue_status", [
  "open",
  "in_review",
  "resolved",
  "cancelled",
]);

export const ledgerSourceEnum = pgEnum("ledger_source", [
  "feed_post",
  "routine_completion",
  "recognition",
  "learning",
  "manual_adjustment",
]);

export const recognitionCategoryEnum = pgEnum("recognition_category", [
  "quality",
  "teamwork",
  "consistency",
  "learning",
  "improvement",
]);

export const achievementStatusEnum = pgEnum("achievement_status", ["active", "paused", "retired"]);

export const analyticsEventKindEnum = pgEnum("analytics_event_kind", [
  "feed",
  "schedule",
  "operations",
  "recognition",
  "dashboard",
  "security",
]);

export const attentionAreaSeverityEnum = pgEnum("attention_area_severity", [
  "info",
  "warning",
  "critical",
]);

export const engagementCampaignStatusEnum = pgEnum("engagement_campaign_status", [
  "draft",
  "scheduled",
  "active",
  "closed",
  "archived",
]);

export const engagementCampaignPeriodPresetEnum = pgEnum("engagement_campaign_period_preset", [
  "weekly",
  "monthly",
  "custom",
]);

export const engagementSettlementModeEnum = pgEnum("engagement_settlement_mode", [
  "automatic",
  "manual-review",
]);

export const engagementMetricTypeEnum = pgEnum("engagement_metric_type", [
  "approved-photo-post",
  "validated-banca-setup",
  "approved-before-after",
  "checklist-linked-evidence",
  "consistency-streak",
]);

export const engagementEventSourceTypeEnum = pgEnum("engagement_event_source_type", [
  "approved-photo-post",
  "validated-banca-setup",
  "approved-before-after",
  "checklist-linked-evidence",
  "consistency-streak",
  "recognition",
  "reward-grant",
  "manual-adjustment",
]);

export const engagementEligibleEventStatusEnum = pgEnum("engagement_eligible_event_status", [
  "counted",
  "excluded",
  "corrected",
  "revoked",
]);

export const engagementArchiveItemTypeEnum = pgEnum("engagement_archive_item_type", [
  "badge-awarded",
  "recognition-received",
  "featured-post",
  "validated-banca",
  "challenge-completed",
  "challenge-won",
  "reward-granted",
  "manual-prize",
]);

export const engagementArchiveItemStatusEnum = pgEnum("engagement_archive_item_status", [
  "recorded",
  "corrected",
  "revoked",
]);

export const engagementRewardTypeEnum = pgEnum("engagement_reward_type", [
  "digital",
  "manual-company-approved",
  "manual-external-informal",
]);

export const engagementRewardGrantStatusEnum = pgEnum("engagement_reward_grant_status", [
  "digital-granted",
  "pending-company-approval",
  "approved-for-fulfillment",
  "fulfilled",
  "canceled",
]);

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 80 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    status: varchar("status", { length: 32 }).notNull().default("active"),
    timezone: varchar("timezone", { length: 80 }).notNull().default("America/Sao_Paulo"),
    settings: jsonb("settings")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(jsonObjectDefault),
    ...timestamps(),
  },
  (table) => [uniqueIndex("organizations_slug_uq").on(table.slug)],
);

export const stores = pgTable(
  "stores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 40 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    timezone: varchar("timezone", { length: 80 }).notNull().default("America/Sao_Paulo"),
    address: jsonb("address").$type<Record<string, unknown>>().notNull().default(jsonObjectDefault),
    active: boolean("active").notNull().default(true),
    ...timestamps(),
  },
  (table) => [
    index("stores_organization_idx").on(table.organizationId),
    uniqueIndex("stores_organization_code_uq").on(table.organizationId, table.code),
  ],
);

export const departments = pgTable(
  "departments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 40 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    active: boolean("active").notNull().default(true),
    ...timestamps(),
  },
  (table) => [
    index("departments_scope_idx").on(table.organizationId, table.storeId),
    uniqueIndex("departments_store_code_uq").on(table.storeId, table.code),
  ],
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 320 }).notNull(),
    displayName: varchar("display_name", { length: 160 }).notNull(),
    preferredName: varchar("preferred_name", { length: 80 }),
    phoneNumber: varchar("phone_number", { length: 40 }),
    externalAuthId: varchar("external_auth_id", { length: 160 }),
    active: boolean("active").notNull().default(true),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex("users_email_uq").on(table.email),
    uniqueIndex("users_external_auth_id_uq").on(table.externalAuthId),
  ],
);

export const roles = pgTable(
  "roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    code: roleCodeEnum("code").notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description").notNull(),
    systemRole: boolean("system_role").notNull().default(true),
    ...timestamps(),
  },
  (table) => [
    index("roles_organization_idx").on(table.organizationId),
    uniqueIndex("roles_organization_code_uq").on(table.organizationId, table.code),
  ],
);

export const permissions = pgTable(
  "permissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: varchar("key", { length: 120 }).notNull(),
    description: text("description").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("permissions_key_uq").on(table.key)],
);

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.roleId, table.permissionId] }),
    index("role_permissions_permission_idx").on(table.permissionId),
  ],
);

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "restrict" }),
    status: membershipStatusEnum("status").notNull().default("active"),
    startsAt: date("starts_at").notNull().defaultNow(),
    endsAt: date("ends_at"),
    ...timestamps(),
  },
  (table) => [
    index("memberships_permission_lookup_idx").on(
      table.organizationId,
      table.storeId,
      table.departmentId,
      table.userId,
    ),
    index("memberships_role_idx").on(table.roleId),
    uniqueIndex("memberships_user_scope_role_uq").on(
      table.userId,
      table.organizationId,
      table.storeId,
      table.departmentId,
      table.roleId,
    ),
  ],
);

export const authCredentials = pgTable(
  "auth_credentials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 320 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    passwordHashVersion: varchar("password_hash_version", { length: 40 })
      .notNull()
      .default("argon2id"),
    status: authCredentialStatusEnum("status").notNull().default("active"),
    failedAttemptCount: integer("failed_attempt_count").notNull().default(0),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    passwordUpdatedAt: timestamp("password_updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(jsonObjectDefault),
    ...timestamps(),
  },
  (table) => [
    index("auth_credentials_user_status_idx").on(table.userId, table.status),
    uniqueIndex("auth_credentials_email_uq").on(table.email),
    uniqueIndex("auth_credentials_user_uq").on(table.userId),
    check("auth_credentials_email_lower_ck", sql`${table.email} = lower(${table.email})`),
    check("auth_credentials_failed_attempts_ck", sql`${table.failedAttemptCount} >= 0`),
  ],
);

export const authProviderAccounts = pgTable(
  "auth_provider_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: authProviderKindEnum("provider").notNull(),
    providerAccountId: varchar("provider_account_id", { length: 240 }).notNull(),
    email: varchar("email", { length: 320 }),
    status: authCredentialStatusEnum("status").notNull().default("active"),
    linkedAt: timestamp("linked_at", { withTimezone: true }).notNull().defaultNow(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(jsonObjectDefault),
    ...timestamps(),
  },
  (table) => [
    index("auth_provider_accounts_user_idx").on(table.userId, table.status),
    uniqueIndex("auth_provider_accounts_provider_subject_uq").on(
      table.provider,
      table.providerAccountId,
    ),
  ],
);

export const authSessions = pgTable(
  "auth_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sessionTokenHash: varchar("session_token_hash", { length: 128 }).notNull(),
    provider: authProviderKindEnum("provider").notNull().default("password"),
    providerSubject: varchar("provider_subject", { length: 240 }).notNull(),
    status: authSessionStatusEnum("status").notNull().default("active"),
    issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    ipAddress: varchar("ip_address", { length: 80 }),
    userAgent: varchar("user_agent", { length: 512 }),
    deviceLabel: varchar("device_label", { length: 160 }),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(jsonObjectDefault),
    ...timestamps(),
  },
  (table) => [
    index("auth_sessions_lookup_idx").on(table.sessionTokenHash, table.status, table.expiresAt),
    index("auth_sessions_user_status_idx").on(table.userId, table.status, table.expiresAt),
    uniqueIndex("auth_sessions_token_hash_uq").on(table.sessionTokenHash),
    check("auth_sessions_window_ck", sql`${table.expiresAt} > ${table.issuedAt}`),
    check(
      "auth_sessions_revoked_at_ck",
      sql`${table.status} <> 'revoked' or ${table.revokedAt} is not null`,
    ),
  ],
);

export const accessInvites = pgTable(
  "access_invites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
    email: varchar("email", { length: 320 }).notNull(),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "restrict" }),
    roleCode: roleCodeEnum("role_code").notNull(),
    tokenHash: varchar("token_hash", { length: 128 }).notNull(),
    status: accessInviteStatusEnum("status").notNull().default("pending"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    invitedByUserId: uuid("invited_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    acceptedByUserId: uuid("accepted_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    revokedByUserId: uuid("revoked_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    resentAt: timestamp("resent_at", { withTimezone: true }),
    resendCount: integer("resend_count").notNull().default(0),
    deliveryChannel: varchar("delivery_channel", { length: 40 }).notNull().default("manual"),
    intendedMembership: jsonb("intended_membership")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(jsonObjectDefault),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(jsonObjectDefault),
    ...timestamps(),
  },
  (table) => [
    index("access_invites_lookup_idx").on(table.tokenHash, table.status, table.expiresAt),
    index("access_invites_email_status_idx").on(table.organizationId, table.email, table.status),
    index("access_invites_scope_status_idx").on(
      table.organizationId,
      table.storeId,
      table.departmentId,
      table.status,
      table.expiresAt,
    ),
    index("access_invites_inviter_idx").on(table.invitedByUserId, table.createdAt),
    uniqueIndex("access_invites_token_hash_uq").on(table.tokenHash),
    check("access_invites_email_lower_ck", sql`${table.email} = lower(${table.email})`),
    check("access_invites_resend_count_ck", sql`${table.resendCount} >= 0`),
    check(
      "access_invites_accepted_at_ck",
      sql`${table.status} <> 'accepted' or ${table.acceptedAt} is not null`,
    ),
    check(
      "access_invites_revoked_at_ck",
      sql`${table.status} <> 'revoked' or ${table.revokedAt} is not null`,
    ),
  ],
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 128 }).notNull(),
    status: recoveryTokenStatusEnum("status").notNull().default("pending"),
    requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    requestIp: varchar("request_ip", { length: 80 }),
    userAgent: varchar("user_agent", { length: 512 }),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(jsonObjectDefault),
    ...timestamps(),
  },
  (table) => [
    index("password_reset_tokens_lookup_idx").on(table.tokenHash, table.status, table.expiresAt),
    index("password_reset_tokens_user_status_idx").on(table.userId, table.status, table.expiresAt),
    uniqueIndex("password_reset_tokens_hash_uq").on(table.tokenHash),
    check("password_reset_tokens_window_ck", sql`${table.expiresAt} > ${table.requestedAt}`),
    check(
      "password_reset_tokens_used_at_ck",
      sql`${table.status} <> 'used' or ${table.usedAt} is not null`,
    ),
    check(
      "password_reset_tokens_revoked_at_ck",
      sql`${table.status} <> 'revoked' or ${table.revokedAt} is not null`,
    ),
  ],
);

export const photoMissions = pgTable(
  "photo_missions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    title: varchar("title", { length: 160 }).notNull(),
    prompt: text("prompt").notNull(),
    rewardPoints: integer("reward_points").notNull().default(0),
    status: contentStatusEnum("status").notNull().default("draft"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    ...timestamps(),
  },
  (table) => [
    index("photo_missions_scope_status_idx").on(
      table.organizationId,
      table.storeId,
      table.departmentId,
      table.status,
      table.startsAt,
    ),
    check("photo_missions_window_ck", sql`${table.endsAt} > ${table.startsAt}`),
  ],
);

export const mediaObjects = pgTable(
  "media_objects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
    ownerUserId: uuid("owner_user_id").references(() => users.id, { onDelete: "set null" }),
    storageProvider: varchar("storage_provider", { length: 40 })
      .notNull()
      .default("local-filesystem"),
    storageBucket: varchar("storage_bucket", { length: 120 }),
    storageKey: varchar("storage_key", { length: 512 }).notNull(),
    contentType: varchar("content_type", { length: 120 }).notNull(),
    byteSize: integer("byte_size").notNull(),
    sha256Hash: varchar("sha256_hash", { length: 64 }).notNull(),
    width: integer("width"),
    height: integer("height"),
    targetType: mediaTargetTypeEnum("target_type").notNull(),
    accessScope: visibilityScopeEnum("access_scope").notNull().default("department"),
    moderationState: moderationStateEnum("moderation_state").notNull().default("quarantined"),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(jsonObjectDefault),
    finalizedAt: timestamp("finalized_at", { withTimezone: true }),
    ...timestamps(),
  },
  (table) => [
    index("media_objects_scope_idx").on(table.organizationId, table.storeId, table.departmentId),
    index("media_objects_owner_idx").on(table.ownerUserId, table.createdAt),
    uniqueIndex("media_objects_storage_key_uq").on(table.storageProvider, table.storageKey),
    check("media_objects_byte_size_ck", sql`${table.byteSize} > 0`),
  ],
);

export const mediaUploadIntents = pgTable(
  "media_upload_intents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
    ownerUserId: uuid("owner_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    storageProvider: varchar("storage_provider", { length: 40 })
      .notNull()
      .default("local-filesystem"),
    storageBucket: varchar("storage_bucket", { length: 120 }),
    storageKey: varchar("storage_key", { length: 512 }).notNull(),
    requestedContentType: varchar("requested_content_type", { length: 120 }).notNull(),
    targetContext: mediaUploadContextEnum("target_context").notNull(),
    targetType: mediaTargetTypeEnum("target_type").notNull(),
    accessScope: visibilityScopeEnum("access_scope").notNull().default("private"),
    uploadState: mediaUploadStateEnum("upload_state").notNull().default("pending_upload"),
    maxByteSize: integer("max_byte_size").notNull(),
    uploadedByteSize: integer("uploaded_byte_size"),
    mediaObjectId: uuid("media_object_id").references(() => mediaObjects.id, {
      onDelete: "set null",
    }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true }),
    finalizedAt: timestamp("finalized_at", { withTimezone: true }),
    cleanedAt: timestamp("cleaned_at", { withTimezone: true }),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(jsonObjectDefault),
    ...timestamps(),
  },
  (table) => [
    index("media_upload_intents_owner_idx").on(table.ownerUserId, table.createdAt),
    index("media_upload_intents_state_idx").on(table.uploadState, table.expiresAt),
    uniqueIndex("media_upload_intents_storage_key_uq").on(table.storageProvider, table.storageKey),
    uniqueIndex("media_upload_intents_media_object_uq").on(table.mediaObjectId),
    check("media_upload_intents_max_byte_size_ck", sql`${table.maxByteSize} > 0`),
    check(
      "media_upload_intents_uploaded_byte_size_ck",
      sql`${table.uploadedByteSize} is null or ${table.uploadedByteSize} > 0`,
    ),
  ],
);

export const feedPosts = pgTable(
  "feed_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
    authorUserId: uuid("author_user_id").references(() => users.id, { onDelete: "set null" }),
    missionId: uuid("mission_id").references(() => photoMissions.id, { onDelete: "set null" }),
    category: varchar("category", { length: 80 }).notNull().default("rotina-flv"),
    caption: text("caption").notNull(),
    status: feedPostStatusEnum("status").notNull().default("pending_moderation"),
    visibilityScope: visibilityScopeEnum("visibility_scope").notNull().default("department"),
    pinnedAt: timestamp("pinned_at", { withTimezone: true }),
    featuredAt: timestamp("featured_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps(),
  },
  (table) => [
    index("feed_posts_pagination_idx").on(
      table.organizationId,
      table.storeId,
      table.departmentId,
      table.status,
      table.publishedAt,
    ),
    index("feed_posts_author_idx").on(table.authorUserId, table.createdAt),
    index("feed_posts_mission_idx").on(table.missionId),
  ],
);

export const feedPostMedia = pgTable(
  "feed_post_media",
  {
    feedPostId: uuid("feed_post_id")
      .notNull()
      .references(() => feedPosts.id, { onDelete: "cascade" }),
    mediaObjectId: uuid("media_object_id")
      .notNull()
      .references(() => mediaObjects.id, { onDelete: "restrict" }),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.feedPostId, table.mediaObjectId] }),
    index("feed_post_media_media_idx").on(table.mediaObjectId),
  ],
);

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    feedPostId: uuid("feed_post_id")
      .notNull()
      .references(() => feedPosts.id, { onDelete: "cascade" }),
    authorUserId: uuid("author_user_id").references(() => users.id, { onDelete: "set null" }),
    body: varchar("body", { length: 500 }).notNull(),
    status: commentStatusEnum("status").notNull().default("pending"),
    moderationReason: text("moderation_reason"),
    ...timestamps(),
  },
  (table) => [
    index("comments_post_status_idx").on(table.feedPostId, table.status, table.createdAt),
    index("comments_author_idx").on(table.authorUserId, table.createdAt),
  ],
);

export const reactions = pgTable(
  "reactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    feedPostId: uuid("feed_post_id")
      .notNull()
      .references(() => feedPosts.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: reactionTypeEnum("type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("reactions_post_idx").on(table.feedPostId),
    uniqueIndex("reactions_post_user_uq").on(table.feedPostId, table.userId),
  ],
);

export const polls = pgTable(
  "polls",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    title: varchar("title", { length: 160 }).notNull(),
    prompt: text("prompt").notNull(),
    status: contentStatusEnum("status").notNull().default("draft"),
    closesAt: timestamp("closes_at", { withTimezone: true }),
    ...timestamps(),
  },
  (table) => [
    index("polls_scope_status_idx").on(table.organizationId, table.storeId, table.status),
  ],
);

export const pollOptions = pgTable(
  "poll_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pollId: uuid("poll_id")
      .notNull()
      .references(() => polls.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 160 }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [index("poll_options_poll_idx").on(table.pollId)],
);

export const pollVotes = pgTable(
  "poll_votes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pollId: uuid("poll_id")
      .notNull()
      .references(() => polls.id, { onDelete: "cascade" }),
    optionId: uuid("option_id")
      .notNull()
      .references(() => pollOptions.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("poll_votes_poll_user_uq").on(table.pollId, table.userId)],
);

export const announcements = pgTable(
  "announcements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    title: varchar("title", { length: 160 }).notNull(),
    body: text("body").notNull(),
    status: contentStatusEnum("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    ...timestamps(),
  },
  (table) => [
    index("announcements_scope_published_idx").on(
      table.organizationId,
      table.storeId,
      table.departmentId,
      table.status,
      table.publishedAt,
    ),
  ],
);

export const moderationActions = pgTable(
  "moderation_actions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    targetType: varchar("target_type", { length: 80 }).notNull(),
    targetId: uuid("target_id").notNull(),
    action: varchar("action", { length: 80 }).notNull(),
    reason: text("reason"),
    previousState: jsonb("previous_state")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(jsonObjectDefault),
    newState: jsonb("new_state")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(jsonObjectDefault),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("moderation_actions_target_idx").on(table.targetType, table.targetId),
    index("moderation_actions_actor_idx").on(table.actorUserId, table.createdAt),
  ],
);

export const shifts = pgTable(
  "shifts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "restrict" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    roleCode: roleCodeEnum("role_code").notNull().default("colaborador"),
    title: varchar("title", { length: 120 }).notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    breakMinutes: integer("break_minutes").notNull().default(0),
    status: shiftStatusEnum("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestamps(),
  },
  (table) => [
    index("shifts_schedule_lookup_idx").on(
      table.organizationId,
      table.storeId,
      table.departmentId,
      table.startsAt,
      table.status,
    ),
    index("shifts_user_lookup_idx").on(table.userId, table.startsAt),
    check("shifts_window_ck", sql`${table.endsAt} > ${table.startsAt}`),
    check("shifts_break_minutes_ck", sql`${table.breakMinutes} >= 0`),
  ],
);

export const availabilityWindows = pgTable(
  "availability_windows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    weekday: integer("weekday").notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    effectiveFrom: date("effective_from").notNull(),
    effectiveTo: date("effective_to"),
    status: requestStatusEnum("status").notNull().default("pending"),
    reviewedByUserId: uuid("reviewed_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestamps(),
  },
  (table) => [
    index("availability_user_idx").on(table.userId, table.weekday, table.effectiveFrom),
    check("availability_weekday_ck", sql`${table.weekday} between 0 and 6`),
  ],
);

export const timeOffRequests = pgTable(
  "time_off_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    startsOn: date("starts_on").notNull(),
    endsOn: date("ends_on").notNull(),
    reason: text("reason"),
    status: requestStatusEnum("status").notNull().default("pending"),
    reviewedByUserId: uuid("reviewed_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    ...timestamps(),
  },
  (table) => [
    index("time_off_scope_status_idx").on(
      table.organizationId,
      table.storeId,
      table.status,
      table.startsOn,
    ),
    check("time_off_window_ck", sql`${table.endsOn} >= ${table.startsOn}`),
  ],
);

export const shiftSwapRequests = pgTable(
  "shift_swap_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "restrict" }),
    requesterUserId: uuid("requester_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    requesterShiftId: uuid("requester_shift_id")
      .notNull()
      .references(() => shifts.id, { onDelete: "cascade" }),
    targetUserId: uuid("target_user_id").references(() => users.id, { onDelete: "set null" }),
    targetShiftId: uuid("target_shift_id").references(() => shifts.id, { onDelete: "set null" }),
    status: requestStatusEnum("status").notNull().default("pending"),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    reviewedByUserId: uuid("reviewed_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    ...timestamps(),
  },
  (table) => [
    index("shift_swap_pending_idx").on(
      table.organizationId,
      table.storeId,
      table.departmentId,
      table.status,
    ),
    index("shift_swap_requester_idx").on(table.requesterUserId, table.createdAt),
  ],
);

export const coverageRules = pgTable(
  "coverage_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "restrict" }),
    weekday: integer("weekday").notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    requiredRoleCode: roleCodeEnum("required_role_code").notNull().default("colaborador"),
    routineCategory: checklistFrequencyEnum("routine_category").notNull(),
    minimumPeople: integer("minimum_people").notNull(),
    active: boolean("active").notNull().default(true),
    ...timestamps(),
  },
  (table) => [
    index("coverage_rules_lookup_idx").on(
      table.storeId,
      table.departmentId,
      table.weekday,
      table.active,
    ),
    check("coverage_minimum_people_ck", sql`${table.minimumPeople} > 0`),
    check("coverage_weekday_ck", sql`${table.weekday} between 0 and 6`),
  ],
);

export const scheduleNotifications = pgTable(
  "schedule_notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    shiftId: uuid("shift_id").references(() => shifts.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 80 }).notNull(),
    status: notificationStatusEnum("status").notNull().default("queued"),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default(jsonObjectDefault),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("schedule_notifications_user_idx").on(table.userId, table.status, table.createdAt),
    index("schedule_notifications_shift_idx").on(table.shiftId),
  ],
);

export const qualityStandards = pgTable(
  "quality_standards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
    title: varchar("title", { length: 160 }).notNull(),
    productCategory: varchar("product_category", { length: 80 }).notNull(),
    instructions: text("instructions").notNull(),
    referenceMediaId: uuid("reference_media_id").references(() => mediaObjects.id, {
      onDelete: "set null",
    }),
    active: boolean("active").notNull().default(true),
    ...timestamps(),
  },
  (table) => [
    index("quality_standards_scope_idx").on(
      table.organizationId,
      table.storeId,
      table.departmentId,
      table.active,
    ),
  ],
);

export const checklists = pgTable(
  "checklists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "restrict" }),
    title: varchar("title", { length: 160 }).notNull(),
    frequency: checklistFrequencyEnum("frequency").notNull(),
    active: boolean("active").notNull().default(true),
    ...timestamps(),
  },
  (table) => [
    index("checklists_scope_frequency_idx").on(
      table.storeId,
      table.departmentId,
      table.frequency,
      table.active,
    ),
  ],
);

export const checklistItems = pgTable(
  "checklist_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    checklistId: uuid("checklist_id")
      .notNull()
      .references(() => checklists.id, { onDelete: "cascade" }),
    standardId: uuid("standard_id").references(() => qualityStandards.id, { onDelete: "set null" }),
    sortOrder: integer("sort_order").notNull().default(0),
    title: varchar("title", { length: 180 }).notNull(),
    instructions: text("instructions"),
    itemType: checklistItemTypeEnum("item_type").notNull().default("boolean"),
    requiresEvidence: boolean("requires_evidence").notNull().default(false),
    active: boolean("active").notNull().default(true),
    ...timestamps(),
  },
  (table) => [index("checklist_items_checklist_idx").on(table.checklistId, table.sortOrder)],
);

export const checklistRuns = pgTable(
  "checklist_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "restrict" }),
    checklistId: uuid("checklist_id")
      .notNull()
      .references(() => checklists.id, { onDelete: "restrict" }),
    shiftId: uuid("shift_id").references(() => shifts.id, { onDelete: "set null" }),
    assignedUserId: uuid("assigned_user_id").references(() => users.id, { onDelete: "set null" }),
    status: completionStatusEnum("status").notNull().default("pending"),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    pendingSync: boolean("pending_sync").notNull().default(false),
    ...timestamps(),
  },
  (table) => [
    index("checklist_runs_due_idx").on(
      table.storeId,
      table.departmentId,
      table.status,
      table.dueAt,
    ),
    index("checklist_runs_shift_idx").on(table.shiftId),
  ],
);

export const checklistItemCompletions = pgTable(
  "checklist_item_completions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    runId: uuid("run_id")
      .notNull()
      .references(() => checklistRuns.id, { onDelete: "cascade" }),
    itemId: uuid("item_id")
      .notNull()
      .references(() => checklistItems.id, { onDelete: "restrict" }),
    completedByUserId: uuid("completed_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    status: completionStatusEnum("status").notNull().default("pending"),
    note: text("note"),
    evidenceMediaId: uuid("evidence_media_id").references(() => mediaObjects.id, {
      onDelete: "set null",
    }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    pendingSync: boolean("pending_sync").notNull().default(false),
    ...timestamps(),
  },
  (table) => [
    index("checklist_item_completions_run_idx").on(table.runId, table.status),
    uniqueIndex("checklist_item_completions_run_item_uq").on(table.runId, table.itemId),
  ],
);

export const issues = pgTable(
  "issues",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "restrict" }),
    shiftId: uuid("shift_id").references(() => shifts.id, { onDelete: "set null" }),
    reportedByUserId: uuid("reported_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    category: varchar("category", { length: 80 }).notNull(),
    productName: varchar("product_name", { length: 160 }),
    quantity: numeric("quantity", { precision: 10, scale: 2 }),
    severity: issueSeverityEnum("severity").notNull().default("medium"),
    status: issueStatusEnum("status").notNull().default("open"),
    note: text("note"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    ...timestamps(),
  },
  (table) => [
    index("issues_attention_idx").on(
      table.organizationId,
      table.storeId,
      table.departmentId,
      table.status,
      table.severity,
    ),
    index("issues_shift_idx").on(table.shiftId),
  ],
);

export const issueEvidence = pgTable(
  "issue_evidence",
  {
    issueId: uuid("issue_id")
      .notNull()
      .references(() => issues.id, { onDelete: "cascade" }),
    mediaObjectId: uuid("media_object_id")
      .notNull()
      .references(() => mediaObjects.id, { onDelete: "restrict" }),
    addedByUserId: uuid("added_by_user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.issueId, table.mediaObjectId] }),
    index("issue_evidence_media_idx").on(table.mediaObjectId),
  ],
);

export const shiftSummaries = pgTable(
  "shift_summaries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "restrict" }),
    shiftId: uuid("shift_id")
      .notNull()
      .references(() => shifts.id, { onDelete: "cascade" }),
    leaderUserId: uuid("leader_user_id").references(() => users.id, { onDelete: "set null" }),
    completedRoutineCount: integer("completed_routine_count").notNull().default(0),
    overdueRoutineCount: integer("overdue_routine_count").notNull().default(0),
    openIssueCount: integer("open_issue_count").notNull().default(0),
    wins: jsonb("wins").$type<readonly string[]>().notNull().default(jsonArrayDefault),
    risks: jsonb("risks").$type<readonly string[]>().notNull().default(jsonArrayDefault),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("shift_summaries_dashboard_idx").on(
      table.organizationId,
      table.storeId,
      table.departmentId,
      table.createdAt,
    ),
    uniqueIndex("shift_summaries_shift_uq").on(table.shiftId),
  ],
);

export const pointsLedger = pgTable(
  "points_ledger",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    source: ledgerSourceEnum("source").notNull(),
    sourceId: uuid("source_id"),
    amount: integer("amount").notNull(),
    reason: varchar("reason", { length: 240 }).notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("points_ledger_user_idx").on(table.userId, table.occurredAt),
    uniqueIndex("points_ledger_source_user_uq").on(
      table.organizationId,
      table.source,
      table.sourceId,
      table.userId,
    ),
    check("points_ledger_amount_nonzero_ck", sql`${table.amount} <> 0`),
  ],
);

export const engagementCampaigns = pgTable(
  "engagement_campaigns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    title: varchar("title", { length: 160 }).notNull(),
    description: text("description").notNull(),
    objective: varchar("objective", { length: 160 }).notNull(),
    status: engagementCampaignStatusEnum("status").notNull().default("draft"),
    periodPreset: engagementCampaignPeriodPresetEnum("period_preset").notNull().default("custom"),
    metricType: engagementMetricTypeEnum("metric_type").notNull(),
    pointsPerEligibleEvent: integer("points_per_eligible_event").notNull().default(1),
    requireUniqueSources: boolean("require_unique_sources").notNull().default(true),
    maxEventsPerUser: integer("max_events_per_user"),
    tieBreakers: jsonb("tie_breakers")
      .$type<readonly Record<string, unknown>[]>()
      .notNull()
      .default(jsonArrayDefault),
    eligibleUserIds: jsonb("eligible_user_ids")
      .$type<readonly string[]>()
      .notNull()
      .default(jsonArrayDefault),
    maxEventsPerDay: integer("max_events_per_day"),
    requiresApprovedFeedPost: boolean("requires_approved_feed_post").notNull().default(false),
    requiresOperationalValidation: boolean("requires_operational_validation")
      .notNull()
      .default(false),
    settlementMode: engagementSettlementModeEnum("settlement_mode").notNull().default("automatic"),
    winnerCount: integer("winner_count").notNull().default(1),
    rewardType: engagementRewardTypeEnum("reward_type").notNull(),
    rewardTitle: varchar("reward_title", { length: 160 }).notNull(),
    rewardConfig: jsonb("reward_config")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(jsonObjectDefault),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    ...timestamps(),
  },
  (table) => [
    index("engagement_campaigns_scope_status_idx").on(
      table.organizationId,
      table.storeId,
      table.departmentId,
      table.status,
      table.startsAt,
    ),
    index("engagement_campaigns_metric_idx").on(
      table.organizationId,
      table.metricType,
      table.status,
      table.startsAt,
    ),
    index("engagement_campaigns_creator_idx").on(table.createdByUserId, table.createdAt),
    check("engagement_campaigns_window_ck", sql`${table.endsAt} > ${table.startsAt}`),
    check("engagement_campaigns_points_per_event_ck", sql`${table.pointsPerEligibleEvent} > 0`),
    check(
      "engagement_campaigns_max_events_per_user_ck",
      sql`${table.maxEventsPerUser} is null or ${table.maxEventsPerUser} > 0`,
    ),
    check(
      "engagement_campaigns_max_events_per_day_ck",
      sql`${table.maxEventsPerDay} is null or ${table.maxEventsPerDay} > 0`,
    ),
    check("engagement_campaigns_winner_count_ck", sql`${table.winnerCount} > 0`),
  ],
);

export const eligibleEngagementEvents = pgTable(
  "eligible_engagement_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
    actorUserId: uuid("actor_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    campaignId: uuid("campaign_id").references(() => engagementCampaigns.id, {
      onDelete: "set null",
    }),
    sourceType: engagementEventSourceTypeEnum("source_type").notNull(),
    sourceId: varchar("source_id", { length: 160 }).notNull(),
    ruleLabel: varchar("rule_label", { length: 160 }).notNull(),
    ruleMetadata: jsonb("rule_metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(jsonObjectDefault),
    scoreValue: integer("score_value").notNull().default(0),
    status: engagementEligibleEventStatusEnum("status").notNull().default("counted"),
    awardedAt: timestamp("awarded_at", { withTimezone: true }).notNull().defaultNow(),
    ...timestamps(),
  },
  (table) => [
    index("eligible_engagement_events_actor_idx").on(table.actorUserId, table.awardedAt),
    index("eligible_engagement_events_campaign_idx").on(
      table.campaignId,
      table.actorUserId,
      table.status,
      table.awardedAt,
    ),
    index("eligible_engagement_events_scope_source_idx").on(
      table.organizationId,
      table.sourceType,
      table.sourceId,
    ),
    uniqueIndex("eligible_engagement_events_campaign_source_uq").on(
      table.organizationId,
      table.campaignId,
      table.actorUserId,
      table.sourceType,
      table.sourceId,
    ),
    check("eligible_engagement_events_score_nonnegative_ck", sql`${table.scoreValue} >= 0`),
  ],
);

export const rewardGrants = pgTable(
  "reward_grants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => engagementCampaigns.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    winningScore: integer("winning_score").notNull().default(0),
    rewardType: engagementRewardTypeEnum("reward_type").notNull(),
    rewardTitle: varchar("reward_title", { length: 160 }).notNull(),
    rewardConfig: jsonb("reward_config")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(jsonObjectDefault),
    status: engagementRewardGrantStatusEnum("status").notNull(),
    grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    approvedByUserId: uuid("approved_by_user_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    fulfilledAt: timestamp("fulfilled_at", { withTimezone: true }),
    fulfilledByUserId: uuid("fulfilled_by_user_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    canceledAt: timestamp("canceled_at", { withTimezone: true }),
    canceledByUserId: uuid("canceled_by_user_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(jsonObjectDefault),
    ...timestamps(),
  },
  (table) => [
    index("reward_grants_campaign_idx").on(table.campaignId, table.position),
    index("reward_grants_user_idx").on(table.userId, table.grantedAt),
    index("reward_grants_status_idx").on(table.organizationId, table.status, table.grantedAt),
    uniqueIndex("reward_grants_campaign_user_uq").on(table.campaignId, table.userId),
    uniqueIndex("reward_grants_campaign_position_uq").on(table.campaignId, table.position),
    check("reward_grants_position_positive_ck", sql`${table.position} > 0`),
    check("reward_grants_winning_score_nonnegative_ck", sql`${table.winningScore} >= 0`),
    check(
      "reward_grants_official_reward_type_ck",
      sql`${table.rewardType} <> 'manual-external-informal'`,
    ),
    check(
      "reward_grants_digital_status_ck",
      sql`${table.rewardType} <> 'digital' or ${table.status} = 'digital-granted'`,
    ),
    check(
      "reward_grants_manual_status_ck",
      sql`${table.rewardType} <> 'manual-company-approved' or ${table.status} <> 'digital-granted'`,
    ),
    check(
      "reward_grants_approved_metadata_ck",
      sql`${table.status} not in ('approved-for-fulfillment', 'fulfilled') or (${table.approvedAt} is not null and ${table.approvedByUserId} is not null)`,
    ),
    check(
      "reward_grants_fulfilled_metadata_ck",
      sql`${table.status} <> 'fulfilled' or (${table.fulfilledAt} is not null and ${table.fulfilledByUserId} is not null)`,
    ),
    check(
      "reward_grants_canceled_metadata_ck",
      sql`${table.status} <> 'canceled' or ${table.canceledAt} is not null`,
    ),
  ],
);

export const collaboratorArchiveItems = pgTable(
  "collaborator_archive_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    campaignId: uuid("campaign_id").references(() => engagementCampaigns.id, {
      onDelete: "set null",
    }),
    rewardGrantId: uuid("reward_grant_id").references(() => rewardGrants.id, {
      onDelete: "set null",
    }),
    sourceType: engagementEventSourceTypeEnum("source_type").notNull(),
    sourceId: varchar("source_id", { length: 160 }).notNull(),
    sourceAction: varchar("source_action", { length: 240 }).notNull(),
    type: engagementArchiveItemTypeEnum("type").notNull(),
    title: varchar("title", { length: 160 }).notNull(),
    grantingRule: varchar("granting_rule", { length: 240 }).notNull(),
    relatedContentReference: varchar("related_content_reference", { length: 240 }),
    responsibleApproverUserId: uuid("responsible_approver_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    rewardStatus: engagementRewardGrantStatusEnum("reward_status"),
    status: engagementArchiveItemStatusEnum("status").notNull().default("recorded"),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(jsonObjectDefault),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    ...timestamps(),
  },
  (table) => [
    index("collaborator_archive_items_user_idx").on(table.userId, table.occurredAt),
    index("collaborator_archive_items_campaign_idx").on(table.campaignId, table.occurredAt),
    index("collaborator_archive_items_reward_idx").on(table.rewardGrantId),
    index("collaborator_archive_items_scope_type_idx").on(
      table.organizationId,
      table.type,
      table.occurredAt,
    ),
    check(
      "collaborator_archive_items_reward_status_ck",
      sql`((${table.type} in ('reward-granted', 'manual-prize')) and ${table.rewardStatus} is not null) or ((${table.type} not in ('reward-granted', 'manual-prize')) and ${table.rewardStatus} is null)`,
    ),
  ],
);

export const badges = pgTable(
  "badges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 80 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    category: recognitionCategoryEnum("category").notNull(),
    description: text("description").notNull(),
    active: boolean("active").notNull().default(true),
    ...timestamps(),
  },
  (table) => [uniqueIndex("badges_organization_code_uq").on(table.organizationId, table.code)],
);

export const achievements = pgTable(
  "achievements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    badgeId: uuid("badge_id").references(() => badges.id, { onDelete: "set null" }),
    code: varchar("code", { length: 80 }).notNull(),
    title: varchar("title", { length: 160 }).notNull(),
    rule: jsonb("rule").$type<Record<string, unknown>>().notNull().default(jsonObjectDefault),
    status: achievementStatusEnum("status").notNull().default("active"),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex("achievements_organization_code_uq").on(table.organizationId, table.code),
  ],
);

export const userAchievements = pgTable(
  "user_achievements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    achievementId: uuid("achievement_id")
      .notNull()
      .references(() => achievements.id, { onDelete: "cascade" }),
    awardedByUserId: uuid("awarded_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    awardedAt: timestamp("awarded_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("user_achievements_user_idx").on(table.userId, table.awardedAt),
    uniqueIndex("user_achievements_user_achievement_uq").on(table.userId, table.achievementId),
  ],
);

export const recognitionEvents = pgTable(
  "recognition_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
    senderUserId: uuid("sender_user_id").references(() => users.id, { onDelete: "set null" }),
    recipientUserId: uuid("recipient_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    category: recognitionCategoryEnum("category").notNull(),
    message: varchar("message", { length: 500 }).notNull(),
    sourceFeedPostId: uuid("source_feed_post_id").references(() => feedPosts.id, {
      onDelete: "set null",
    }),
    sourceChecklistRunId: uuid("source_checklist_run_id").references(() => checklistRuns.id, {
      onDelete: "set null",
    }),
    pointsAwarded: integer("points_awarded").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("recognition_recipient_idx").on(table.recipientUserId, table.createdAt),
    index("recognition_scope_idx").on(
      table.organizationId,
      table.storeId,
      table.departmentId,
      table.createdAt,
    ),
  ],
);

export const recognitionAntiAbuseCounters = pgTable(
  "recognition_anti_abuse_counters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    actorUserId: uuid("actor_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    recipientUserId: uuid("recipient_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    category: recognitionCategoryEnum("category").notNull(),
    windowStartAt: timestamp("window_start_at", { withTimezone: true }).notNull(),
    count: integer("count").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("recognition_abuse_window_uq").on(
      table.organizationId,
      table.actorUserId,
      table.recipientUserId,
      table.category,
      table.windowStartAt,
    ),
  ],
);

export const dashboardMetricSnapshots = pgTable(
  "dashboard_metric_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
    snapshotDate: date("snapshot_date").notNull(),
    metricKey: varchar("metric_key", { length: 120 }).notNull(),
    metricValue: numeric("metric_value", { precision: 12, scale: 2 }).notNull(),
    dimensions: jsonb("dimensions")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(jsonObjectDefault),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("dashboard_metric_filters_idx").on(
      table.organizationId,
      table.storeId,
      table.departmentId,
      table.snapshotDate,
      table.metricKey,
    ),
    uniqueIndex("dashboard_metric_snapshot_uq").on(
      table.organizationId,
      table.storeId,
      table.departmentId,
      table.snapshotDate,
      table.metricKey,
    ),
  ],
);

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    eventName: varchar("event_name", { length: 160 }).notNull(),
    eventKind: analyticsEventKindEnum("event_kind").notNull(),
    properties: jsonb("properties")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(jsonObjectDefault),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("analytics_events_filters_idx").on(
      table.organizationId,
      table.storeId,
      table.departmentId,
      table.eventKind,
      table.occurredAt,
    ),
    index("analytics_events_user_idx").on(table.userId, table.occurredAt),
  ],
);

export const attentionAreaSnapshots = pgTable(
  "attention_area_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
    snapshotDate: date("snapshot_date").notNull(),
    severity: attentionAreaSeverityEnum("severity").notNull(),
    areaType: varchar("area_type", { length: 120 }).notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    description: text("description").notNull(),
    evidence: jsonb("evidence")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(jsonObjectDefault),
    status: varchar("status", { length: 40 }).notNull().default("open"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("attention_area_filters_idx").on(
      table.organizationId,
      table.storeId,
      table.departmentId,
      table.snapshotDate,
      table.severity,
    ),
  ],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    action: varchar("action", { length: 120 }).notNull(),
    targetType: varchar("target_type", { length: 120 }).notNull(),
    targetId: uuid("target_id"),
    requestId: varchar("request_id", { length: 120 }),
    previousState: jsonb("previous_state")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(jsonObjectDefault),
    newState: jsonb("new_state")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(jsonObjectDefault),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(jsonObjectDefault),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("audit_logs_query_idx").on(
      table.organizationId,
      table.storeId,
      table.departmentId,
      table.createdAt,
    ),
    index("audit_logs_actor_idx").on(table.actorUserId, table.createdAt),
    index("audit_logs_target_idx").on(table.targetType, table.targetId),
    index("audit_logs_action_idx").on(table.organizationId, table.action, table.createdAt),
  ],
);

export const persistentRuntimeRecords = pgTable(
  "persistent_runtime_records",
  {
    collection: varchar("collection", { length: 80 }).notNull(),
    recordId: varchar("record_id", { length: 240 }).notNull(),
    organizationId: varchar("organization_id", { length: 160 }).notNull(),
    storeId: varchar("store_id", { length: 160 }),
    departmentId: varchar("department_id", { length: 160 }),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default(jsonObjectDefault),
    ...timestamps(),
  },
  (table) => [
    primaryKey({ columns: [table.collection, table.recordId] }),
    index("persistent_runtime_records_scope_idx").on(
      table.collection,
      table.organizationId,
      table.storeId,
      table.departmentId,
    ),
  ],
);

export const flvSchema = {
  accessInvites,
  achievements,
  analyticsEvents,
  announcements,
  attentionAreaSnapshots,
  authCredentials,
  authProviderAccounts,
  authSessions,
  auditLogs,
  availabilityWindows,
  badges,
  checklistItemCompletions,
  checklistItems,
  checklistRuns,
  checklists,
  collaboratorArchiveItems,
  comments,
  coverageRules,
  dashboardMetricSnapshots,
  departments,
  eligibleEngagementEvents,
  engagementCampaigns,
  feedPostMedia,
  feedPosts,
  issueEvidence,
  issues,
  mediaUploadIntents,
  mediaObjects,
  memberships,
  moderationActions,
  organizations,
  passwordResetTokens,
  permissions,
  persistentRuntimeRecords,
  photoMissions,
  pointsLedger,
  pollOptions,
  pollVotes,
  polls,
  reactions,
  recognitionAntiAbuseCounters,
  recognitionEvents,
  rewardGrants,
  rolePermissions,
  roles,
  scheduleNotifications,
  shiftSummaries,
  shiftSwapRequests,
  shifts,
  stores,
  timeOffRequests,
  userAchievements,
  users,
};

export const rlsScopedTableNames = [
  "stores",
  "departments",
  "roles",
  "memberships",
  "photo_missions",
  "media_upload_intents",
  "media_objects",
  "feed_posts",
  "comments",
  "reactions",
  "polls",
  "announcements",
  "moderation_actions",
  "shifts",
  "availability_windows",
  "time_off_requests",
  "shift_swap_requests",
  "coverage_rules",
  "schedule_notifications",
  "quality_standards",
  "checklists",
  "checklist_runs",
  "engagement_campaigns",
  "eligible_engagement_events",
  "reward_grants",
  "collaborator_archive_items",
  "issues",
  "shift_summaries",
  "points_ledger",
  "badges",
  "achievements",
  "recognition_events",
  "dashboard_metric_snapshots",
  "analytics_events",
  "attention_area_snapshots",
  "audit_logs",
] as const;
