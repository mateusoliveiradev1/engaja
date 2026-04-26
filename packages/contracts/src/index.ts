import { z } from "zod";

export const apiContractVersion = "0.2.0";

export const flvRoleSchema = z.enum([
  "colaborador",
  "lider-setor",
  "gerente-loja",
  "admin-organizacao",
  "auditor",
]);

export type FlvRole = z.infer<typeof flvRoleSchema>;

export const apiModuleNameSchema = z.enum([
  "auth",
  "engagement",
  "feed",
  "schedules",
  "operations",
  "recognition",
  "dashboard",
  "media",
  "audit",
]);

export type ApiModuleName = z.infer<typeof apiModuleNameSchema>;

export const tenantScopeSchema = z
  .object({
    departmentId: z.string().min(1).optional(),
    organizationId: z.string().min(1),
    storeId: z.string().min(1).optional(),
  })
  .strict();

export type TenantScopePayload = z.infer<typeof tenantScopeSchema>;

export const sessionUserSchema = z
  .object({
    displayName: z.string().min(1),
    id: z.string().min(1),
    role: flvRoleSchema,
    scope: tenantScopeSchema,
  })
  .strict();

export type SessionUserPayload = z.infer<typeof sessionUserSchema>;

export const authSessionPayloadSchema = z
  .object({
    expiresAt: z.string().datetime(),
    sessionToken: z.string().min(32),
    user: sessionUserSchema,
  })
  .strict();

export type AuthSessionPayload = z.infer<typeof authSessionPayloadSchema>;

export const authLoginRequestSchema = z
  .object({
    deviceLabel: z.string().min(1).max(160).optional(),
    email: z.string().email().max(320),
    password: z.string().min(8).max(256),
  })
  .strict();

export type AuthLoginRequestPayload = z.infer<typeof authLoginRequestSchema>;

export const authLogoutResultSchema = z
  .object({
    revoked: z.boolean(),
  })
  .strict();

export type AuthLogoutResultPayload = z.infer<typeof authLogoutResultSchema>;

export const accessInviteStatusSchema = z.enum(["pending", "accepted", "revoked", "expired"]);

export type AccessInviteStatusPayload = z.infer<typeof accessInviteStatusSchema>;

export const accessInviteDeliverySchema = z
  .object({
    channel: z.enum(["manual", "email"]),
    inviteUrl: z.string().url().optional(),
    token: z.string().min(32).optional(),
  })
  .strict();

export type AccessInviteDeliveryPayload = z.infer<typeof accessInviteDeliverySchema>;

export const accessInvitePayloadSchema = z
  .object({
    acceptedAt: z.string().datetime().optional(),
    acceptedByUserId: z.string().min(1).optional(),
    createdAt: z.string().datetime(),
    delivery: accessInviteDeliverySchema.optional(),
    email: z.string().email().max(320),
    expiresAt: z.string().datetime(),
    id: z.string().min(1),
    invitedByUserId: z.string().min(1).optional(),
    resentAt: z.string().datetime().optional(),
    resendCount: z.number().int().nonnegative(),
    revokedAt: z.string().datetime().optional(),
    revokedByUserId: z.string().min(1).optional(),
    role: flvRoleSchema,
    scope: tenantScopeSchema,
    status: accessInviteStatusSchema,
    updatedAt: z.string().datetime(),
  })
  .strict();

export type AccessInvitePayload = z.infer<typeof accessInvitePayloadSchema>;

export const accessInviteCreateRequestSchema = z
  .object({
    email: z.string().email().max(320),
    expiresInDays: z.number().int().min(1).max(30).optional(),
    role: flvRoleSchema,
    scope: tenantScopeSchema,
  })
  .strict();

export type AccessInviteCreateRequestPayload = z.infer<
  typeof accessInviteCreateRequestSchema
>;

export const accessInviteActionRequestSchema = z
  .object({
    inviteId: z.string().min(1),
  })
  .strict();

export type AccessInviteActionRequestPayload = z.infer<
  typeof accessInviteActionRequestSchema
>;

export const accessInviteAcceptRequestSchema = z
  .object({
    displayName: z.string().min(2).max(160),
    email: z.string().email().max(320),
    password: z.string().min(8).max(256),
    phoneNumber: z.string().min(8).max(40).optional(),
    preferredName: z.string().min(1).max(80).optional(),
    token: z.string().min(32),
  })
  .strict();

export type AccessInviteAcceptRequestPayload = z.infer<
  typeof accessInviteAcceptRequestSchema
>;

export const accessInviteAcceptResultSchema = z
  .object({
    invite: accessInvitePayloadSchema,
    session: authSessionPayloadSchema,
  })
  .strict();

export type AccessInviteAcceptResultPayload = z.infer<
  typeof accessInviteAcceptResultSchema
>;

export const apiHealthPayloadSchema = z
  .object({
    name: z.literal("@engaja/api"),
    status: z.literal("ok"),
    version: z.literal(apiContractVersion),
  })
  .strict();

export type ApiHealthPayload = z.infer<typeof apiHealthPayloadSchema>;

export const routeModuleStatusSchema = z
  .object({
    basePath: z.string().startsWith("/"),
    module: apiModuleNameSchema,
    ownedContracts: z.array(z.string().min(1)),
    status: z.literal("ready"),
  })
  .strict();

export type RouteModuleStatusPayload = z.infer<typeof routeModuleStatusSchema>;

export const feedCategorySchema = z.enum([
  "display",
  "quality",
  "routine",
  "mission",
  "announcement",
]);

export type FeedCategoryPayload = z.infer<typeof feedCategorySchema>;

export const feedPostStatusSchema = z.enum([
  "draft",
  "pending_moderation",
  "published",
  "hidden",
  "removed",
  "featured",
]);

export type FeedPostStatusPayload = z.infer<typeof feedPostStatusSchema>;

export const feedReactionTypeSchema = z.enum([
  "like",
  "aplauso",
  "inspirador",
  "duvida",
]);

export type FeedReactionTypePayload = z.infer<typeof feedReactionTypeSchema>;

export const feedCommentStatusSchema = z.enum([
  "pending",
  "visible",
  "hidden",
  "removed",
]);

export type FeedCommentStatusPayload = z.infer<typeof feedCommentStatusSchema>;

export const feedModerationActionSchema = z.enum([
  "approve",
  "hide",
  "pin",
  "feature",
  "remove",
]);

export type FeedModerationActionPayload = z.infer<typeof feedModerationActionSchema>;

export const contentStatusSchema = z.enum([
  "draft",
  "scheduled",
  "active",
  "closed",
  "archived",
]);

export type ContentStatusPayload = z.infer<typeof contentStatusSchema>;

export const recognitionCategorySchema = z.enum([
  "quality",
  "teamwork",
  "consistency",
  "learning",
  "improvement",
]);

export type RecognitionCategoryPayload = z.infer<typeof recognitionCategorySchema>;

export const feedFeedbackCategorySchema = z.enum([
  "blocker",
  "idea",
  "routine",
  "improvement",
]);

export type FeedFeedbackCategoryPayload = z.infer<typeof feedFeedbackCategorySchema>;

export const feedFeedbackStatusSchema = z.enum([
  "new",
  "reviewed",
  "resolved",
]);

export type FeedFeedbackStatusPayload = z.infer<typeof feedFeedbackStatusSchema>;

export const visibilityScopeSchema = z.enum([
  "private",
  "department",
  "store",
  "organization",
]);

export type VisibilityScopePayload = z.infer<typeof visibilityScopeSchema>;

export const feedPostSummarySchema = z
  .object({
    authorName: z.string().min(1),
    category: feedCategorySchema,
    id: z.string().min(1),
    photoUrl: z.string().url().optional(),
    publishedAt: z.string().datetime(),
    title: z.string().min(1),
  })
  .strict();

export type FeedPostSummaryPayload = z.infer<typeof feedPostSummarySchema>;

export const feedMissionLinkRequestSchema = z
  .object({
    missionId: z.string().min(1).optional(),
    missionTitle: z.string().min(1).optional(),
    recognitionCategory: recognitionCategorySchema.optional(),
    rewardPoints: z.number().int().nonnegative().optional(),
    routineTitle: z.string().min(1).optional(),
  })
  .strict();

export type FeedMissionLinkRequestPayload = z.infer<typeof feedMissionLinkRequestSchema>;

export const feedMissionLinkPayloadSchema = feedMissionLinkRequestSchema
  .extend({
    recognitionEligible: z.boolean(),
    rewardEligible: z.boolean(),
  })
  .strict();

export type FeedMissionLinkPayload = z.infer<typeof feedMissionLinkPayloadSchema>;

export const feedReactionSummarySchema = z
  .object({
    count: z.number().int().nonnegative(),
    label: z.string().min(1),
    selected: z.boolean(),
    type: feedReactionTypeSchema,
  })
  .strict();

export type FeedReactionSummaryPayload = z.infer<typeof feedReactionSummarySchema>;

export const feedCommentPayloadSchema = z
  .object({
    authorName: z.string().min(1),
    body: z.string().min(1).max(500),
    createdAt: z.string().datetime(),
    id: z.string().min(1),
    pendingSync: z.boolean(),
    status: feedCommentStatusSchema,
  })
  .strict();

export type FeedCommentPayload = z.infer<typeof feedCommentPayloadSchema>;

export const feedPostPayloadSchema = z
  .object({
    authorName: z.string().min(1),
    caption: z.string().min(1).max(500),
    category: feedCategorySchema,
    comments: z.array(feedCommentPayloadSchema),
    createdAt: z.string().datetime(),
    id: z.string().min(1),
    missionLink: feedMissionLinkPayloadSchema.optional(),
    pendingSync: z.boolean(),
    photoUrl: z.string().url().optional(),
    publishedAt: z.string().datetime().optional(),
    reactions: z.array(feedReactionSummarySchema),
    status: feedPostStatusSchema,
    title: z.string().min(1),
    visibility: visibilityScopeSchema,
  })
  .strict();

export type FeedPostPayload = z.infer<typeof feedPostPayloadSchema>;

export const feedAnnouncementPayloadSchema = z
  .object({
    acknowledged: z.boolean(),
    body: z.string().min(1).max(500),
    id: z.string().min(1),
    publishedAt: z.string().datetime().optional(),
    requiredAcknowledgement: z.boolean(),
    status: contentStatusSchema,
    title: z.string().min(1),
  })
  .strict();

export type FeedAnnouncementPayload = z.infer<typeof feedAnnouncementPayloadSchema>;

export const feedPollOptionPayloadSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    voteCount: z.number().int().nonnegative(),
  })
  .strict();

export type FeedPollOptionPayload = z.infer<typeof feedPollOptionPayloadSchema>;

export const feedPollPayloadSchema = z
  .object({
    closesAt: z.string().datetime().optional(),
    id: z.string().min(1),
    options: z.array(feedPollOptionPayloadSchema),
    prompt: z.string().min(1),
    status: contentStatusSchema,
    title: z.string().min(1),
    totalVotes: z.number().int().nonnegative(),
    viewerVoteOptionId: z.string().min(1).optional(),
  })
  .strict();

export type FeedPollPayload = z.infer<typeof feedPollPayloadSchema>;

export const feedFeedbackPayloadSchema = z
  .object({
    category: feedFeedbackCategorySchema,
    createdAt: z.string().datetime(),
    id: z.string().min(1),
    message: z.string().min(1).max(500),
    status: feedFeedbackStatusSchema,
  })
  .strict();

export type FeedFeedbackPayload = z.infer<typeof feedFeedbackPayloadSchema>;

export const feedHomePayloadSchema = z
  .object({
    announcements: z.array(feedAnnouncementPayloadSchema),
    feedbackInboxCount: z.number().int().nonnegative(),
    nextCursor: z.string().min(1).optional(),
    polls: z.array(feedPollPayloadSchema),
    posts: z.array(feedPostPayloadSchema),
  })
  .strict();

export type FeedHomePayload = z.infer<typeof feedHomePayloadSchema>;

export const feedPostCreateRequestSchema = z
  .object({
    authorName: z.string().min(1),
    caption: z.string().min(1).max(500),
    category: feedCategorySchema,
    missionLink: feedMissionLinkRequestSchema.optional(),
    pendingSync: z.boolean().optional(),
    photoUrl: z.string().url().optional(),
    scope: tenantScopeSchema,
    title: z.string().min(1).max(160),
    visibility: visibilityScopeSchema,
  })
  .strict();

export type FeedPostCreateRequestPayload = z.infer<typeof feedPostCreateRequestSchema>;

export const feedPostVisibilityUpdateRequestSchema = z
  .object({
    postId: z.string().min(1),
    visibility: visibilityScopeSchema,
  })
  .strict();

export type FeedPostVisibilityUpdateRequestPayload = z.infer<
  typeof feedPostVisibilityUpdateRequestSchema
>;

export const feedPostDeleteRequestSchema = z
  .object({
    postId: z.string().min(1),
  })
  .strict();

export type FeedPostDeleteRequestPayload = z.infer<typeof feedPostDeleteRequestSchema>;

export const feedReactionRequestSchema = z
  .object({
    postId: z.string().min(1),
    type: feedReactionTypeSchema,
  })
  .strict();

export type FeedReactionRequestPayload = z.infer<typeof feedReactionRequestSchema>;

export const feedCommentCreateRequestSchema = z
  .object({
    authorName: z.string().min(1),
    body: z.string().min(1).max(500),
    pendingSync: z.boolean().optional(),
    postId: z.string().min(1),
  })
  .strict();

export type FeedCommentCreateRequestPayload = z.infer<typeof feedCommentCreateRequestSchema>;

export const feedModerationRequestSchema = z
  .object({
    action: feedModerationActionSchema,
    postId: z.string().min(1),
  })
  .strict();

export type FeedModerationRequestPayload = z.infer<typeof feedModerationRequestSchema>;

export const feedAnnouncementReadRequestSchema = z
  .object({
    announcementId: z.string().min(1),
  })
  .strict();

export type FeedAnnouncementReadRequestPayload = z.infer<
  typeof feedAnnouncementReadRequestSchema
>;

export const feedPollVoteRequestSchema = z
  .object({
    optionId: z.string().min(1),
    pollId: z.string().min(1),
  })
  .strict();

export type FeedPollVoteRequestPayload = z.infer<typeof feedPollVoteRequestSchema>;

export const feedFeedbackCreateRequestSchema = z
  .object({
    category: feedFeedbackCategorySchema,
    message: z.string().min(1).max(500),
    scope: tenantScopeSchema,
  })
  .strict();

export type FeedFeedbackCreateRequestPayload = z.infer<
  typeof feedFeedbackCreateRequestSchema
>;

export const scheduleShiftStatusSchema = z.enum([
  "draft",
  "published",
  "cancelled",
  "completed",
]);

export type ScheduleShiftStatusPayload = z.infer<typeof scheduleShiftStatusSchema>;

export const scheduleRequestKindSchema = z.enum([
  "availability",
  "time_off",
  "swap",
]);

export type ScheduleRequestKindPayload = z.infer<typeof scheduleRequestKindSchema>;

export const scheduleRequestStatusSchema = z.enum([
  "pending",
  "accepted",
  "approved",
  "rejected",
  "cancelled",
]);

export type ScheduleRequestStatusPayload = z.infer<typeof scheduleRequestStatusSchema>;

export const scheduleNotificationStatusSchema = z.enum([
  "queued",
  "sent",
  "read",
]);

export type ScheduleNotificationStatusPayload = z.infer<
  typeof scheduleNotificationStatusSchema
>;

export const scheduleNotificationTypeSchema = z.enum([
  "schedule_published",
  "schedule_changed",
  "availability_submitted",
  "availability_reviewed",
  "time_off_submitted",
  "time_off_reviewed",
  "swap_proposed",
  "swap_responded",
  "swap_approved",
]);

export type ScheduleNotificationTypePayload = z.infer<
  typeof scheduleNotificationTypeSchema
>;

export const availabilityPeriodSchema = z.enum([
  "opening",
  "midday",
  "closing",
]);

export type AvailabilityPeriodPayload = z.infer<typeof availabilityPeriodSchema>;

export const scheduleDecisionSchema = z.enum(["approve", "reject"]);

export type ScheduleDecisionPayload = z.infer<typeof scheduleDecisionSchema>;

export const swapResponseSchema = z.enum(["accept", "reject"]);

export type SwapResponsePayload = z.infer<typeof swapResponseSchema>;

export const scheduleCoverageSeveritySchema = z.enum([
  "ok",
  "warning",
  "critical",
]);

export type ScheduleCoverageSeverityPayload = z.infer<
  typeof scheduleCoverageSeveritySchema
>;

export const schedulePlannerIssueKindSchema = z.enum([
  "coverage_gap",
  "overlapping_shift",
  "time_off_conflict",
]);

export type SchedulePlannerIssueKindPayload = z.infer<
  typeof schedulePlannerIssueKindSchema
>;

export const scheduleSummarySchema = z
  .object({
    nextShiftStartsAt: z.string().datetime().optional(),
    pendingRequests: z.number().int().nonnegative(),
    publishedWeek: z.string().min(1),
    todayShiftStatus: z.enum(["scheduled", "day-off", "missing", "pending-publication"]),
  })
  .strict();

export type ScheduleSummaryPayload = z.infer<typeof scheduleSummarySchema>;

export const scheduleTimelineDaySchema = z
  .object({
    emphasis: z.enum(["high", "medium"]).optional(),
    id: z.string().min(1),
    label: z.string().min(1),
    shift: z.string().min(1),
  })
  .strict();

export type ScheduleTimelineDayPayload = z.infer<typeof scheduleTimelineDaySchema>;

export const scheduleShiftPayloadSchema = z
  .object({
    breakMinutes: z.number().int().nonnegative(),
    endsAt: z.string().datetime(),
    id: z.string().min(1),
    role: flvRoleSchema,
    startsAt: z.string().datetime(),
    status: scheduleShiftStatusSchema,
    title: z.string().min(1),
    userId: z.string().min(1),
    userName: z.string().min(1),
  })
  .strict();

export type ScheduleShiftPayload = z.infer<typeof scheduleShiftPayloadSchema>;

export const scheduleRequestPayloadSchema = z
  .object({
    counterpartShiftId: z.string().min(1).optional(),
    counterpartUserId: z.string().min(1).optional(),
    counterpartUserName: z.string().min(1).optional(),
    createdAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    id: z.string().min(1),
    kind: scheduleRequestKindSchema,
    note: z.string().min(1).optional(),
    preferredPeriods: z.array(availabilityPeriodSchema).optional(),
    requesterUserId: z.string().min(1),
    requesterUserName: z.string().min(1),
    reviewedAt: z.string().datetime().optional(),
    reviewedByUserId: z.string().min(1).optional(),
    shiftId: z.string().min(1).optional(),
    startsAt: z.string().datetime(),
    status: scheduleRequestStatusSchema,
  })
  .strict();

export type ScheduleRequestPayload = z.infer<typeof scheduleRequestPayloadSchema>;

export const scheduleNotificationPayloadSchema = z
  .object({
    createdAt: z.string().datetime(),
    id: z.string().min(1),
    message: z.string().min(1),
    requestId: z.string().min(1).optional(),
    shiftId: z.string().min(1).optional(),
    status: scheduleNotificationStatusSchema,
    type: scheduleNotificationTypeSchema,
    userId: z.string().min(1),
  })
  .strict();

export type ScheduleNotificationPayload = z.infer<
  typeof scheduleNotificationPayloadSchema
>;

export const scheduleCoverageAlertPayloadSchema = z
  .object({
    assignedHeadcount: z.number().int().nonnegative(),
    id: z.string().min(1),
    label: z.string().min(1),
    periodLabel: z.string().min(1),
    requiredHeadcount: z.number().int().positive(),
    requiredRole: flvRoleSchema,
    routineResponsibility: z.string().min(1).optional(),
    severity: scheduleCoverageSeveritySchema,
  })
  .strict();

export type ScheduleCoverageAlertPayload = z.infer<
  typeof scheduleCoverageAlertPayloadSchema
>;

export const schedulePlannerIssuePayloadSchema = z
  .object({
    coverageId: z.string().min(1).optional(),
    kind: schedulePlannerIssueKindSchema,
    message: z.string().min(1),
    requestId: z.string().min(1).optional(),
    shiftId: z.string().min(1).optional(),
  })
  .strict();

export type SchedulePlannerIssuePayload = z.infer<
  typeof schedulePlannerIssuePayloadSchema
>;

export const scheduleTeamMemberPayloadSchema = z
  .object({
    displayName: z.string().min(1),
    role: flvRoleSchema,
    userId: z.string().min(1),
  })
  .strict();

export type ScheduleTeamMemberPayload = z.infer<
  typeof scheduleTeamMemberPayloadSchema
>;

export const collaboratorScheduleViewSchema = z
  .object({
    breakMinutesToday: z.number().int().nonnegative(),
    nextShiftStartsAt: z.string().datetime().optional(),
    notifications: z.array(scheduleNotificationPayloadSchema),
    pendingRequestCount: z.number().int().nonnegative(),
    requests: z.array(scheduleRequestPayloadSchema),
    timelineDays: z.array(scheduleTimelineDaySchema),
    todayShift: scheduleShiftPayloadSchema.optional(),
    todayShiftStatus: z.enum(["scheduled", "day-off", "missing", "pending-publication"]),
    upcomingShifts: z.array(scheduleShiftPayloadSchema),
  })
  .strict();

export type CollaboratorScheduleViewPayload = z.infer<
  typeof collaboratorScheduleViewSchema
>;

export const leaderSchedulePlannerSchema = z
  .object({
    coverageAlerts: z.array(scheduleCoverageAlertPayloadSchema),
    issues: z.array(schedulePlannerIssuePayloadSchema),
    notifications: z.array(scheduleNotificationPayloadSchema),
    pendingApprovalCount: z.number().int().nonnegative(),
    requests: z.array(scheduleRequestPayloadSchema),
    shifts: z.array(scheduleShiftPayloadSchema),
    teamMembers: z.array(scheduleTeamMemberPayloadSchema),
    timelineDays: z.array(scheduleTimelineDaySchema),
    weekLabel: z.string().min(1),
  })
  .strict();

export type LeaderSchedulePlannerPayload = z.infer<
  typeof leaderSchedulePlannerSchema
>;

export const scheduleShiftUpsertRequestSchema = z
  .object({
    breakMinutes: z.number().int().nonnegative(),
    endsAt: z.string().datetime(),
    role: flvRoleSchema,
    scope: tenantScopeSchema,
    shiftId: z.string().min(1).optional(),
    startsAt: z.string().datetime(),
    title: z.string().min(1),
    userId: z.string().min(1),
  })
  .strict();

export type ScheduleShiftUpsertRequestPayload = z.infer<
  typeof scheduleShiftUpsertRequestSchema
>;

export const schedulePublishRequestSchema = z
  .object({
    scope: tenantScopeSchema,
    shiftIds: z.array(z.string().min(1)).optional(),
  })
  .strict();

export type SchedulePublishRequestPayload = z.infer<
  typeof schedulePublishRequestSchema
>;

export const schedulePublishResultSchema = z
  .object({
    coverageGapCount: z.number().int().nonnegative(),
    notificationCount: z.number().int().nonnegative(),
    publishedCount: z.number().int().nonnegative(),
    weekLabel: z.string().min(1),
  })
  .strict();

export type SchedulePublishResultPayload = z.infer<
  typeof schedulePublishResultSchema
>;

export const scheduleAvailabilityCreateRequestSchema = z
  .object({
    endsAt: z.string().datetime(),
    note: z.string().min(1).optional(),
    preferredPeriods: z.array(availabilityPeriodSchema).min(1),
    scope: tenantScopeSchema,
    startsAt: z.string().datetime(),
  })
  .strict();

export type ScheduleAvailabilityCreateRequestPayload = z.infer<
  typeof scheduleAvailabilityCreateRequestSchema
>;

export const scheduleTimeOffCreateRequestSchema = z
  .object({
    endsAt: z.string().datetime(),
    reason: z.string().min(1),
    scope: tenantScopeSchema,
    startsAt: z.string().datetime(),
  })
  .strict();

export type ScheduleTimeOffCreateRequestPayload = z.infer<
  typeof scheduleTimeOffCreateRequestSchema
>;

export const scheduleRequestReviewRequestSchema = z
  .object({
    decision: scheduleDecisionSchema,
    requestId: z.string().min(1),
  })
  .strict();

export type ScheduleRequestReviewRequestPayload = z.infer<
  typeof scheduleRequestReviewRequestSchema
>;

export const scheduleSwapProposalRequestSchema = z
  .object({
    note: z.string().min(1).optional(),
    scope: tenantScopeSchema,
    sourceShiftId: z.string().min(1),
    targetShiftId: z.string().min(1),
    targetUserId: z.string().min(1),
  })
  .strict();

export type ScheduleSwapProposalRequestPayload = z.infer<
  typeof scheduleSwapProposalRequestSchema
>;

export const scheduleSwapResponseRequestSchema = z
  .object({
    requestId: z.string().min(1),
    response: swapResponseSchema,
  })
  .strict();

export type ScheduleSwapResponseRequestPayload = z.infer<
  typeof scheduleSwapResponseRequestSchema
>;

export const scheduleSwapApproveRequestSchema = z
  .object({
    requestId: z.string().min(1),
  })
  .strict();

export type ScheduleSwapApproveRequestPayload = z.infer<
  typeof scheduleSwapApproveRequestSchema
>;

export const operationsSummarySchema = z
  .object({
    completedRoutineCount: z.number().int().nonnegative(),
    overdueRoutineCount: z.number().int().nonnegative(),
    openIssueCount: z.number().int().nonnegative(),
    pendingSyncCount: z.number().int().nonnegative(),
  })
  .strict();

export type OperationsSummaryPayload = z.infer<typeof operationsSummarySchema>;

export const operationRoutineIdSchema = z.enum([
  "opening",
  "replenishment",
  "quality-review",
  "cleaning",
  "labels",
  "closing",
]);

export type OperationRoutineIdPayload = z.infer<typeof operationRoutineIdSchema>;

export const operationsEvidenceModeSchema = z.enum(["none", "optional", "required"]);

export type OperationsEvidenceModePayload = z.infer<typeof operationsEvidenceModeSchema>;

export const operationsIssueSeveritySchema = z.enum(["low", "medium", "high", "critical"]);

export type OperationsIssueSeverityPayload = z.infer<typeof operationsIssueSeveritySchema>;

export const operationsIssueStatusSchema = z.enum([
  "open",
  "in_review",
  "resolved",
  "cancelled",
]);

export type OperationsIssueStatusPayload = z.infer<typeof operationsIssueStatusSchema>;

export const operationsChecklistItemPayloadSchema = z
  .object({
    completedAt: z.string().datetime().optional(),
    completedByUserId: z.string().min(1).optional(),
    completedByUserName: z.string().min(1).optional(),
    evidenceMode: operationsEvidenceModeSchema,
    evidencePhotoUrl: z.string().url().optional(),
    helper: z.string().min(1).optional(),
    id: z.string().min(1),
    label: z.string().min(1),
    note: z.string().min(1).optional(),
    pendingSync: z.boolean(),
    shiftId: z.string().min(1).optional(),
    status: z.enum(["pending", "completed", "skipped", "blocked", "overdue"]),
  })
  .strict();

export type OperationsChecklistItemPayload = z.infer<
  typeof operationsChecklistItemPayloadSchema
>;

export const operationsRoutinePayloadSchema = z
  .object({
    checklistTitle: z.string().min(1),
    description: z.string().min(1),
    evidence: z
      .object({
        label: z.string().min(1),
        status: z.string().min(1),
      })
      .strict(),
    focusChips: z.array(z.string().min(1)),
    id: operationRoutineIdSchema,
    items: z.array(operationsChecklistItemPayloadSchema),
    label: z.string().min(1),
    note: z.string().min(1),
    standardIds: z.array(z.string().min(1)),
  })
  .strict();

export type OperationsRoutinePayload = z.infer<typeof operationsRoutinePayloadSchema>;

export const operationsQualityStandardPayloadSchema = z
  .object({
    category: z.string().min(1),
    checkpoints: z.array(z.string().min(1)),
    id: z.string().min(1),
    instructions: z.string().min(1),
    referenceLabel: z.string().min(1),
    relatedActionLabels: z.array(z.string().min(1)),
    title: z.string().min(1),
  })
  .strict();

export type OperationsQualityStandardPayload = z.infer<
  typeof operationsQualityStandardPayloadSchema
>;

export const operationsIssuePayloadSchema = z
  .object({
    category: z.string().min(1),
    createdAt: z.string().datetime(),
    evidencePhotoUrls: z.array(z.string().url()),
    id: z.string().min(1),
    note: z.string().min(1).optional(),
    pendingSync: z.boolean(),
    productName: z.string().min(1).optional(),
    quantity: z.number().nonnegative().optional(),
    reportedByUserId: z.string().min(1).optional(),
    reportedByUserName: z.string().min(1).optional(),
    severity: operationsIssueSeveritySchema,
    shiftId: z.string().min(1).optional(),
    status: operationsIssueStatusSchema,
  })
  .strict();

export type OperationsIssuePayload = z.infer<typeof operationsIssuePayloadSchema>;

export const operationsLearningBitePayloadSchema = z
  .object({
    completed: z.boolean(),
    completedAt: z.string().datetime().optional(),
    completedByUserId: z.string().min(1).optional(),
    completedByUserName: z.string().min(1).optional(),
    description: z.string().min(1),
    durationMinutes: z.number().int().positive(),
    feedPostId: z.string().min(1).optional(),
    id: z.string().min(1),
    missionTitle: z.string().min(1).optional(),
    pendingSync: z.boolean(),
    pointsAwarded: z.number().int().nonnegative().optional(),
    standardId: z.string().min(1).optional(),
    title: z.string().min(1),
  })
  .strict();

export type OperationsLearningBitePayload = z.infer<
  typeof operationsLearningBitePayloadSchema
>;

export const operationsShiftSummaryIssuePayloadSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    severity: operationsIssueSeveritySchema,
    status: operationsIssueStatusSchema,
  })
  .strict();

export type OperationsShiftSummaryIssuePayload = z.infer<
  typeof operationsShiftSummaryIssuePayloadSchema
>;

export const operationsShiftSummaryEvidencePayloadSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    photoUrl: z.string().url().optional(),
    status: z.string().min(1),
  })
  .strict();

export type OperationsShiftSummaryEvidencePayload = z.infer<
  typeof operationsShiftSummaryEvidencePayloadSchema
>;

export const operationsShiftSummaryPayloadSchema = z
  .object({
    completedRoutineCount: z.number().int().nonnegative(),
    evidenceCount: z.number().int().nonnegative(),
    evidenceItems: z.array(operationsShiftSummaryEvidencePayloadSchema),
    openIssueCount: z.number().int().nonnegative(),
    openIssues: z.array(operationsShiftSummaryIssuePayloadSchema),
    overdueItemCount: z.number().int().nonnegative(),
    overdueItems: z.array(z.string().min(1)),
    pendingSyncCount: z.number().int().nonnegative(),
    shiftId: z.string().min(1).optional(),
    title: z.string().min(1),
    wins: z.array(z.string().min(1)),
  })
  .strict();

export type OperationsShiftSummaryPayload = z.infer<
  typeof operationsShiftSummaryPayloadSchema
>;

export const operationsViewPayloadSchema = z
  .object({
    highlight: z.string().min(1),
    issues: z.array(operationsIssuePayloadSchema),
    learningBites: z.array(operationsLearningBitePayloadSchema),
    routines: z.array(operationsRoutinePayloadSchema),
    shiftSummary: operationsShiftSummaryPayloadSchema,
    standards: z.array(operationsQualityStandardPayloadSchema),
    summary: operationsSummarySchema,
  })
  .strict();

export type OperationsViewPayload = z.infer<typeof operationsViewPayloadSchema>;

export const operationsChecklistItemCompleteRequestSchema = z
  .object({
    evidencePhotoUrl: z.string().url().optional(),
    itemId: z.string().min(1),
    note: z.string().min(1).optional(),
    pendingSync: z.boolean().optional(),
    routineId: operationRoutineIdSchema,
    scope: tenantScopeSchema,
    shiftId: z.string().min(1).optional(),
  })
  .strict();

export type OperationsChecklistItemCompleteRequestPayload = z.infer<
  typeof operationsChecklistItemCompleteRequestSchema
>;

export const operationsIssueCreateRequestSchema = z
  .object({
    category: z.string().min(1),
    evidencePhotoUrls: z.array(z.string().url()).optional(),
    note: z.string().min(1).optional(),
    pendingSync: z.boolean().optional(),
    productName: z.string().min(1).optional(),
    quantity: z.number().nonnegative().optional(),
    scope: tenantScopeSchema,
    severity: operationsIssueSeveritySchema,
    shiftId: z.string().min(1).optional(),
  })
  .strict();

export type OperationsIssueCreateRequestPayload = z.infer<
  typeof operationsIssueCreateRequestSchema
>;

export const operationsLearningCompleteRequestSchema = z
  .object({
    learningBiteId: z.string().min(1),
    pendingSync: z.boolean().optional(),
    scope: tenantScopeSchema,
  })
  .strict();

export type OperationsLearningCompleteRequestPayload = z.infer<
  typeof operationsLearningCompleteRequestSchema
>;

export const recognitionSummarySchema = z
  .object({
    badgeCount: z.number().int().nonnegative(),
    points: z.number().int().nonnegative(),
    recentRecognitionCount: z.number().int().nonnegative(),
  })
  .strict();

export type RecognitionSummaryPayload = z.infer<typeof recognitionSummarySchema>;

export const recognitionLedgerSourceSchema = z.enum([
  "feed_post",
  "routine_completion",
  "recognition",
  "learning",
  "manual_adjustment",
]);

export type RecognitionLedgerSourcePayload = z.infer<typeof recognitionLedgerSourceSchema>;

export const recognitionLedgerEntryPayloadSchema = z
  .object({
    actorUserId: z.string().min(1).optional(),
    amount: z.number().int(),
    id: z.string().min(1),
    occurredAt: z.string().datetime(),
    reason: z.string().min(1),
    source: recognitionLedgerSourceSchema,
    sourceId: z.string().min(1).optional(),
  })
  .strict();

export type RecognitionLedgerEntryPayload = z.infer<typeof recognitionLedgerEntryPayloadSchema>;

export const recognitionBadgePayloadSchema = z
  .object({
    awardedAt: z.string().datetime(),
    code: z.string().min(1),
    description: z.string().min(1),
    explanation: z.string().min(1),
    id: z.string().min(1),
    title: z.string().min(1),
  })
  .strict();

export type RecognitionBadgePayload = z.infer<typeof recognitionBadgePayloadSchema>;

export const recognitionEventPayloadSchema = z
  .object({
    category: recognitionCategorySchema,
    categoryLabel: z.string().min(1),
    createdAt: z.string().datetime(),
    id: z.string().min(1),
    message: z.string().min(1).max(500),
    pointsAwarded: z.number().int().nonnegative(),
    recipientUserId: z.string().min(1),
    senderUserId: z.string().min(1).optional(),
    sourceFeedPostId: z.string().min(1).optional(),
  })
  .strict();

export type RecognitionEventPayload = z.infer<typeof recognitionEventPayloadSchema>;

export const recognitionRewardExplanationPayloadSchema = z
  .object({
    grantedAt: z.string().datetime(),
    points: z.number().int(),
    reason: z.string().min(1),
    source: recognitionLedgerSourceSchema,
    sourceId: z.string().min(1).optional(),
    title: z.string().min(1),
  })
  .strict();

export type RecognitionRewardExplanationPayload = z.infer<
  typeof recognitionRewardExplanationPayloadSchema
>;

export const recognitionProfilePayloadSchema = z
  .object({
    badges: z.array(recognitionBadgePayloadSchema),
    ledger: z.array(recognitionLedgerEntryPayloadSchema),
    recognitionHistory: z.array(recognitionEventPayloadSchema),
    rewardExplanations: z.array(recognitionRewardExplanationPayloadSchema),
    summary: recognitionSummarySchema,
  })
  .strict();

export type RecognitionProfilePayload = z.infer<typeof recognitionProfilePayloadSchema>;

export const recognitionRankingEntryPayloadSchema = z
  .object({
    badgeCount: z.number().int().nonnegative(),
    displayName: z.string().min(1),
    points: z.number().int().nonnegative(),
    position: z.number().int().positive(),
    recognitionCount: z.number().int().nonnegative(),
    userId: z.string().min(1),
  })
  .strict();

export type RecognitionRankingEntryPayload = z.infer<typeof recognitionRankingEntryPayloadSchema>;

export const recognitionRankingPayloadSchema = z
  .object({
    entries: z.array(recognitionRankingEntryPayloadSchema),
    framing: z.string().min(1),
    teamGoalPoints: z.number().int().positive(),
    teamProgressPercent: z.number().int().min(0).max(100),
    totalPositivePoints: z.number().int().nonnegative(),
  })
  .strict();

export type RecognitionRankingPayload = z.infer<typeof recognitionRankingPayloadSchema>;

export const recognitionSendRequestSchema = z
  .object({
    category: recognitionCategorySchema,
    message: z.string().min(1).max(500),
    recipientUserId: z.string().min(1),
    scope: tenantScopeSchema,
  })
  .strict();

export type RecognitionSendRequestPayload = z.infer<typeof recognitionSendRequestSchema>;

export const recognitionFeedPostRequestSchema = z
  .object({
    message: z.string().min(1).max(500).optional(),
    postId: z.string().min(1),
  })
  .strict();

export type RecognitionFeedPostRequestPayload = z.infer<typeof recognitionFeedPostRequestSchema>;

export const recognitionSendResultPayloadSchema = z
  .object({
    awardedBadges: z.array(recognitionBadgePayloadSchema),
    ledgerEntry: recognitionLedgerEntryPayloadSchema.optional(),
    recognition: recognitionEventPayloadSchema,
  })
  .strict();

export type RecognitionSendResultPayload = z.infer<typeof recognitionSendResultPayloadSchema>;

export const engagementCampaignStatusSchema = z.enum([
  "draft",
  "scheduled",
  "active",
  "closed",
  "archived",
]);

export type EngagementCampaignStatusPayload = z.infer<typeof engagementCampaignStatusSchema>;

export const engagementCampaignPeriodPresetSchema = z.enum(["weekly", "monthly", "custom"]);

export type EngagementCampaignPeriodPresetPayload = z.infer<
  typeof engagementCampaignPeriodPresetSchema
>;

export const engagementSettlementModeSchema = z.enum(["automatic", "manual-review"]);

export type EngagementSettlementModePayload = z.infer<typeof engagementSettlementModeSchema>;

export const engagementMetricTypeSchema = z.enum([
  "approved-photo-post",
  "validated-banca-setup",
  "approved-before-after",
  "checklist-linked-evidence",
  "consistency-streak",
]);

export type EngagementMetricTypePayload = z.infer<typeof engagementMetricTypeSchema>;

export const engagementTieBreakerKindSchema = z.enum([
  "approved-quality",
  "consistency",
  "first-to-finish",
]);

export type EngagementTieBreakerKindPayload = z.infer<typeof engagementTieBreakerKindSchema>;

export const engagementEventSourceTypeSchema = z.enum([
  "approved-photo-post",
  "validated-banca-setup",
  "approved-before-after",
  "checklist-linked-evidence",
  "consistency-streak",
  "recognition",
  "reward-grant",
  "manual-adjustment",
]);

export type EngagementEventSourceTypePayload = z.infer<typeof engagementEventSourceTypeSchema>;

export const engagementEligibleEventStatusSchema = z.enum([
  "counted",
  "excluded",
  "corrected",
  "revoked",
]);

export type EngagementEligibleEventStatusPayload = z.infer<
  typeof engagementEligibleEventStatusSchema
>;

export const engagementArchiveItemTypeSchema = z.enum([
  "badge-awarded",
  "recognition-received",
  "featured-post",
  "validated-banca",
  "challenge-completed",
  "challenge-won",
  "reward-granted",
  "manual-prize",
]);

export type EngagementArchiveItemTypePayload = z.infer<typeof engagementArchiveItemTypeSchema>;

export const engagementArchiveItemStatusSchema = z.enum([
  "recorded",
  "corrected",
  "revoked",
]);

export type EngagementArchiveItemStatusPayload = z.infer<
  typeof engagementArchiveItemStatusSchema
>;

export const engagementRewardTypeSchema = z.enum([
  "digital",
  "manual-company-approved",
  "manual-external-informal",
]);

export type EngagementRewardTypePayload = z.infer<typeof engagementRewardTypeSchema>;

export const engagementRewardGrantStatusSchema = z.enum([
  "digital-granted",
  "pending-company-approval",
  "approved-for-fulfillment",
  "fulfilled",
  "canceled",
]);

export type EngagementRewardGrantStatusPayload = z.infer<
  typeof engagementRewardGrantStatusSchema
>;

export const engagementRuleMetadataSchema = z.record(
  z.string().min(1),
  z.union([z.string().min(1), z.number().finite(), z.boolean()]),
);

export type EngagementRuleMetadataPayload = z.infer<typeof engagementRuleMetadataSchema>;

export const engagementTieBreakerPayloadSchema = z
  .object({
    kind: engagementTieBreakerKindSchema,
    priority: z.number().int().positive(),
  })
  .strict();

export type EngagementTieBreakerPayload = z.infer<typeof engagementTieBreakerPayloadSchema>;

export const engagementCampaignScoringRulePayloadSchema = z
  .object({
    maxEventsPerUser: z.number().int().positive().optional(),
    metricType: engagementMetricTypeSchema,
    pointsPerEligibleEvent: z.number().int().positive(),
    requireUniqueSources: z.boolean(),
    tieBreakers: z.array(engagementTieBreakerPayloadSchema),
  })
  .strict();

export type EngagementCampaignScoringRulePayload = z.infer<
  typeof engagementCampaignScoringRulePayloadSchema
>;

export const engagementCampaignEligibilityPayloadSchema = z
  .object({
    eligibleUserIds: z.array(z.string().min(1)),
    maxEventsPerDay: z.number().int().positive().optional(),
    requiresApprovedFeedPost: z.boolean(),
    requiresOperationalValidation: z.boolean(),
  })
  .strict();

export type EngagementCampaignEligibilityPayload = z.infer<
  typeof engagementCampaignEligibilityPayloadSchema
>;

export const engagementCampaignSettlementPayloadSchema = z
  .object({
    mode: engagementSettlementModeSchema,
    winnerCount: z.number().int().positive(),
  })
  .strict();

export type EngagementCampaignSettlementPayload = z.infer<
  typeof engagementCampaignSettlementPayloadSchema
>;

export const engagementDigitalRewardDefinitionSchema = z
  .object({
    badgeCode: z.string().min(1).optional(),
    highlightLabel: z.string().min(1).optional(),
    points: z.number().int().nonnegative().optional(),
    title: z.string().min(1),
    type: z.literal("digital"),
  })
  .strict();

export type EngagementDigitalRewardDefinitionPayload = z.infer<
  typeof engagementDigitalRewardDefinitionSchema
>;

export const engagementManualCompanyRewardDefinitionSchema = z
  .object({
    approvalPolicyCode: z.string().min(1),
    description: z.string().min(1),
    fulfillmentWindowDays: z.number().int().positive().optional(),
    title: z.string().min(1),
    type: z.literal("manual-company-approved"),
  })
  .strict();

export type EngagementManualCompanyRewardDefinitionPayload = z.infer<
  typeof engagementManualCompanyRewardDefinitionSchema
>;

export const engagementManualExternalRewardDefinitionSchema = z
  .object({
    disclaimer: z.string().min(1),
    note: z.string().min(1).optional(),
    title: z.string().min(1),
    type: z.literal("manual-external-informal"),
  })
  .strict();

export type EngagementManualExternalRewardDefinitionPayload = z.infer<
  typeof engagementManualExternalRewardDefinitionSchema
>;

export const engagementCampaignRewardDefinitionSchema = z.discriminatedUnion("type", [
  engagementDigitalRewardDefinitionSchema,
  engagementManualCompanyRewardDefinitionSchema,
  engagementManualExternalRewardDefinitionSchema,
]).superRefine((reward, ctx) => {
  if (
    reward.type === "digital" &&
    (reward.points ?? 0) <= 0 &&
    reward.badgeCode === undefined &&
    reward.highlightLabel === undefined
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Digital rewards must grant points, a badge, or an in-app highlight.",
      path: ["points"],
    });
  }
});

export type EngagementCampaignRewardDefinitionPayload = z.infer<
  typeof engagementCampaignRewardDefinitionSchema
>;

export const engagementGrantableRewardDefinitionSchema = z.discriminatedUnion("type", [
  engagementDigitalRewardDefinitionSchema,
  engagementManualCompanyRewardDefinitionSchema,
]).superRefine((reward, ctx) => {
  if (
    reward.type === "digital" &&
    (reward.points ?? 0) <= 0 &&
    reward.badgeCode === undefined &&
    reward.highlightLabel === undefined
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Digital rewards must grant points, a badge, or an in-app highlight.",
      path: ["points"],
    });
  }
});

export type EngagementGrantableRewardDefinitionPayload = z.infer<
  typeof engagementGrantableRewardDefinitionSchema
>;

export const engagementCampaignPayloadSchema = z
  .object({
    createdAt: z.string().datetime(),
    createdByUserId: z.string().min(1),
    description: z.string().min(1),
    eligibility: engagementCampaignEligibilityPayloadSchema,
    endsAt: z.string().datetime(),
    id: z.string().min(1),
    objective: z.string().min(1),
    periodPreset: engagementCampaignPeriodPresetSchema,
    reward: engagementCampaignRewardDefinitionSchema,
    scope: tenantScopeSchema,
    scoringRule: engagementCampaignScoringRulePayloadSchema,
    settlement: engagementCampaignSettlementPayloadSchema,
    startsAt: z.string().datetime(),
    status: engagementCampaignStatusSchema,
    title: z.string().min(1),
  })
  .strict();

export type EngagementCampaignPayload = z.infer<typeof engagementCampaignPayloadSchema>;

export const engagementEligibleEventPayloadSchema = z
  .object({
    actorUserId: z.string().min(1),
    awardedAt: z.string().datetime(),
    campaignId: z.string().min(1).optional(),
    id: z.string().min(1),
    ruleLabel: z.string().min(1),
    ruleMetadata: engagementRuleMetadataSchema,
    scope: tenantScopeSchema,
    scoreValue: z.number().int().nonnegative(),
    sourceId: z.string().min(1),
    sourceType: engagementEventSourceTypeSchema,
    status: engagementEligibleEventStatusSchema,
  })
  .strict();

export type EngagementEligibleEventPayload = z.infer<typeof engagementEligibleEventPayloadSchema>;

export const engagementArchiveItemPayloadSchema = z
  .object({
    campaignId: z.string().min(1).optional(),
    grantingRule: z.string().min(1),
    id: z.string().min(1),
    metadata: engagementRuleMetadataSchema,
    occurredAt: z.string().datetime(),
    relatedContentReference: z.string().min(1).optional(),
    responsibleApproverUserId: z.string().min(1).optional(),
    rewardGrantId: z.string().min(1).optional(),
    rewardStatus: engagementRewardGrantStatusSchema.optional(),
    scope: tenantScopeSchema,
    sourceAction: z.string().min(1),
    sourceId: z.string().min(1),
    sourceType: engagementEventSourceTypeSchema,
    status: engagementArchiveItemStatusSchema,
    title: z.string().min(1),
    type: engagementArchiveItemTypeSchema,
    userId: z.string().min(1),
  })
  .strict()
  .superRefine((item, ctx) => {
    const isRewardItem = item.type === "reward-granted" || item.type === "manual-prize";

    if (isRewardItem && item.rewardStatus === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Reward archive items must expose a rewardStatus.",
        path: ["rewardStatus"],
      });
    }

    if (!isRewardItem && item.rewardStatus !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Only reward archive items may expose a rewardStatus.",
        path: ["rewardStatus"],
      });
    }
  });

export type EngagementArchiveItemPayload = z.infer<typeof engagementArchiveItemPayloadSchema>;

export const engagementRewardGrantPayloadSchema = z
  .object({
    approvedAt: z.string().datetime().optional(),
    approvedByUserId: z.string().min(1).optional(),
    campaignId: z.string().min(1),
    canceledAt: z.string().datetime().optional(),
    canceledByUserId: z.string().min(1).optional(),
    fulfilledAt: z.string().datetime().optional(),
    fulfilledByUserId: z.string().min(1).optional(),
    grantedAt: z.string().datetime(),
    id: z.string().min(1),
    metadata: engagementRuleMetadataSchema,
    position: z.number().int().positive(),
    reward: engagementGrantableRewardDefinitionSchema,
    scope: tenantScopeSchema,
    status: engagementRewardGrantStatusSchema,
    userId: z.string().min(1),
    winningScore: z.number().int().nonnegative(),
  })
  .strict()
  .superRefine((grant, ctx) => {
    if (grant.reward.type === "digital" && grant.status !== "digital-granted") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Digital rewards must use the digital-granted status.",
        path: ["status"],
      });
    }

    if (grant.reward.type === "manual-company-approved" && grant.status === "digital-granted") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Manual company-approved rewards cannot use the digital-granted status.",
        path: ["status"],
      });
    }

    if (
      (grant.status === "approved-for-fulfillment" || grant.status === "fulfilled") &&
      (grant.approvedAt === undefined || grant.approvedByUserId === undefined)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Approved manual rewards require approvedAt and approvedByUserId.",
        path: ["approvedAt"],
      });
    }

    if (
      grant.status === "fulfilled" &&
      (grant.fulfilledAt === undefined || grant.fulfilledByUserId === undefined)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Fulfilled rewards require fulfilledAt and fulfilledByUserId.",
        path: ["fulfilledAt"],
      });
    }

    if (grant.status === "canceled" && grant.canceledAt === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Canceled rewards require canceledAt.",
        path: ["canceledAt"],
      });
    }
  });

export type EngagementRewardGrantPayload = z.infer<typeof engagementRewardGrantPayloadSchema>;

export const engagementCampaignCreateRequestSchema = z
  .object({
    description: z.string().min(1).max(500),
    eligibility: engagementCampaignEligibilityPayloadSchema.optional(),
    endsAt: z.string().datetime(),
    objective: z.string().min(1).max(160),
    periodPreset: engagementCampaignPeriodPresetSchema,
    reward: engagementCampaignRewardDefinitionSchema,
    scoringRule: engagementCampaignScoringRulePayloadSchema,
    scope: tenantScopeSchema,
    settlement: engagementCampaignSettlementPayloadSchema.optional(),
    startsAt: z.string().datetime(),
    status: z.enum(["draft", "scheduled", "active"]).optional(),
    title: z.string().min(1).max(160),
  })
  .strict();

export type EngagementCampaignCreateRequestPayload = z.infer<
  typeof engagementCampaignCreateRequestSchema
>;

export const engagementCampaignCloseRequestSchema = z
  .object({
    campaignId: z.string().min(1),
  })
  .strict();

export type EngagementCampaignCloseRequestPayload = z.infer<
  typeof engagementCampaignCloseRequestSchema
>;

export const engagementRewardGrantUpdateRequestSchema = z
  .object({
    rewardGrantId: z.string().min(1),
    status: z.enum(["approved-for-fulfillment", "fulfilled", "canceled"]),
  })
  .strict();

export type EngagementRewardGrantUpdateRequestPayload = z.infer<
  typeof engagementRewardGrantUpdateRequestSchema
>;

export const engagementCampaignLeaderboardEntryPayloadSchema = z
  .object({
    displayName: z.string().min(1),
    position: z.number().int().positive(),
    score: z.number().int().nonnegative(),
    userId: z.string().min(1),
  })
  .strict();

export type EngagementCampaignLeaderboardEntryPayload = z.infer<
  typeof engagementCampaignLeaderboardEntryPayloadSchema
>;

export const engagementCampaignViewerProgressPayloadSchema = z
  .object({
    eligibleEventCount: z.number().int().nonnegative(),
    lastAwardedAt: z.string().datetime().optional(),
    position: z.number().int().positive().optional(),
    score: z.number().int().nonnegative(),
    userId: z.string().min(1),
  })
  .strict();

export type EngagementCampaignViewerProgressPayload = z.infer<
  typeof engagementCampaignViewerProgressPayloadSchema
>;

export const engagementCampaignViewPayloadSchema = z
  .object({
    campaign: engagementCampaignPayloadSchema,
    leaderboard: z.array(engagementCampaignLeaderboardEntryPayloadSchema),
    participantCount: z.number().int().nonnegative(),
    viewerProgress: engagementCampaignViewerProgressPayloadSchema.optional(),
  })
  .strict();

export type EngagementCampaignViewPayload = z.infer<
  typeof engagementCampaignViewPayloadSchema
>;

export const engagementCampaignClosurePayloadSchema = z
  .object({
    archiveItems: z.array(engagementArchiveItemPayloadSchema),
    campaign: engagementCampaignPayloadSchema,
    rewardGrants: z.array(engagementRewardGrantPayloadSchema),
  })
  .strict();

export type EngagementCampaignClosurePayload = z.infer<
  typeof engagementCampaignClosurePayloadSchema
>;

export const engagementArchiveSummaryPayloadSchema = z
  .object({
    activeCampaignCount: z.number().int().nonnegative(),
    activeStreakDays: z.number().int().nonnegative(),
    approvedPhotoParticipationCount: z.number().int().nonnegative(),
    challengeWinCount: z.number().int().nonnegative(),
    latestActivityAt: z.string().datetime().optional(),
    pendingRewardCount: z.number().int().nonnegative(),
    rewardCount: z.number().int().nonnegative(),
    validatedBancaContributionCount: z.number().int().nonnegative(),
  })
  .strict();

export type EngagementArchiveSummaryPayload = z.infer<
  typeof engagementArchiveSummaryPayloadSchema
>;

export const engagementArchivePayloadSchema = z
  .object({
    activeCampaigns: z.array(engagementCampaignViewPayloadSchema),
    items: z.array(engagementArchiveItemPayloadSchema),
    rewardGrants: z.array(engagementRewardGrantPayloadSchema),
    summary: engagementArchiveSummaryPayloadSchema,
  })
  .strict();

export type EngagementArchivePayload = z.infer<typeof engagementArchivePayloadSchema>;

export const dashboardMetricKeySchema = z.enum([
  "engagement",
  "feed",
  "schedule",
  "routine",
  "issue",
  "recognition",
  "team-progress",
]);

export type DashboardMetricKeyPayload = z.infer<typeof dashboardMetricKeySchema>;

export const dashboardMetricPayloadSchema = z
  .object({
    key: dashboardMetricKeySchema,
    label: z.string().min(1),
    note: z.string().min(1),
    tone: z.enum(["accent", "fresh", "warm"]),
    value: z.string().min(1),
  })
  .strict();

export type DashboardMetricPayload = z.infer<typeof dashboardMetricPayloadSchema>;

export const dashboardContentTypeSchema = z.enum([
  "announcement",
  "photo_mission",
  "poll",
  "learning_card",
]);

export type DashboardContentTypePayload = z.infer<typeof dashboardContentTypeSchema>;

export const dashboardAttentionAreaKindSchema = z.enum([
  "coverage_gap",
  "low_engagement",
  "moderation_queue",
  "overdue_routine",
  "repeated_issue",
]);

export type DashboardAttentionAreaKindPayload = z.infer<
  typeof dashboardAttentionAreaKindSchema
>;

export const dashboardFilterOptionSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
  })
  .strict();

export type DashboardFilterOptionPayload = z.infer<typeof dashboardFilterOptionSchema>;

export const dashboardSelectedFiltersSchema = z
  .object({
    contentType: dashboardContentTypeSchema.optional(),
    dateRangeLabel: z.string().min(1),
    endsAt: z.string().datetime(),
    routineCategory: operationRoutineIdSchema.optional(),
    shiftId: z.string().min(1).optional(),
    startsAt: z.string().datetime(),
    storeId: z.string().min(1).optional(),
    teamMemberId: z.string().min(1).optional(),
  })
  .strict();

export type DashboardSelectedFiltersPayload = z.infer<typeof dashboardSelectedFiltersSchema>;

export const dashboardFiltersSchema = z
  .object({
    contentTypes: z.array(dashboardFilterOptionSchema),
    routineCategories: z.array(dashboardFilterOptionSchema),
    selected: dashboardSelectedFiltersSchema,
    shifts: z.array(dashboardFilterOptionSchema),
    stores: z.array(dashboardFilterOptionSchema),
    teamMembers: z.array(dashboardFilterOptionSchema),
  })
  .strict();

export type DashboardFiltersPayload = z.infer<typeof dashboardFiltersSchema>;

export const dashboardContentItemPayloadSchema = z
  .object({
    id: z.string().min(1),
    metricLabel: z.string().min(1),
    ownerLabel: z.string().min(1).optional(),
    scheduledFor: z.string().datetime().optional(),
    status: contentStatusSchema,
    title: z.string().min(1),
    type: dashboardContentTypeSchema,
  })
  .strict();

export type DashboardContentItemPayload = z.infer<typeof dashboardContentItemPayloadSchema>;

export const dashboardRoutineMonitorPayloadSchema = z
  .object({
    completedCount: z.number().int().nonnegative(),
    id: operationRoutineIdSchema,
    label: z.string().min(1),
    overdueCount: z.number().int().nonnegative(),
    totalCount: z.number().int().nonnegative(),
  })
  .strict();

export type DashboardRoutineMonitorPayload = z.infer<
  typeof dashboardRoutineMonitorPayloadSchema
>;

export const dashboardChecklistMonitorPayloadSchema = z
  .object({
    completedCount: z.number().int().nonnegative(),
    completionRate: z.number().min(0).max(1),
    overdueCount: z.number().int().nonnegative(),
    requiredEvidenceMissingCount: z.number().int().nonnegative(),
    routines: z.array(dashboardRoutineMonitorPayloadSchema),
    totalCount: z.number().int().nonnegative(),
    unresolvedIssueCount: z.number().int().nonnegative(),
  })
  .strict();

export type DashboardChecklistMonitorPayload = z.infer<
  typeof dashboardChecklistMonitorPayloadSchema
>;

export const dashboardMemberInsightPayloadSchema = z
  .object({
    completedActionCount: z.number().int().nonnegative(),
    displayName: z.string().min(1),
    engagementCount: z.number().int().nonnegative(),
    points: z.number().int().nonnegative(),
    recognitionCount: z.number().int().nonnegative(),
    role: flvRoleSchema,
    scaleLabel: z.string().min(1),
    userId: z.string().min(1),
  })
  .strict();

export type DashboardMemberInsightPayload = z.infer<
  typeof dashboardMemberInsightPayloadSchema
>;

export const dashboardAttentionAreaPayloadSchema = z
  .object({
    createdAt: z.string().datetime(),
    description: z.string().min(1),
    id: z.string().min(1),
    kind: dashboardAttentionAreaKindSchema,
    severity: z.enum(["info", "warning", "critical"]),
    sourceCount: z.number().int().nonnegative(),
    title: z.string().min(1),
  })
  .strict();

export type DashboardAttentionAreaPayload = z.infer<
  typeof dashboardAttentionAreaPayloadSchema
>;

export const dashboardOverviewPayloadSchema = z
  .object({
    generatedAt: z.string().datetime(),
    metrics: z.array(dashboardMetricPayloadSchema),
    teamProgressPercent: z.number().int().min(0).max(100),
  })
  .strict();

export type DashboardOverviewPayload = z.infer<typeof dashboardOverviewPayloadSchema>;

export const dashboardSummarySchema = z
  .object({
    attentionAreaCount: z.number().int().nonnegative(),
    attentionAreas: z.array(dashboardAttentionAreaPayloadSchema),
    checklistMonitor: dashboardChecklistMonitorPayloadSchema,
    contentItems: z.array(dashboardContentItemPayloadSchema),
    engagementRate: z.number().min(0).max(1),
    filters: dashboardFiltersSchema,
    memberInsights: z.array(dashboardMemberInsightPayloadSchema),
    moderationQueue: z.array(feedPostPayloadSchema),
    openModerationCount: z.number().int().nonnegative(),
    overview: dashboardOverviewPayloadSchema,
    scheduleConsole: leaderSchedulePlannerSchema,
    scheduleGapCount: z.number().int().nonnegative(),
  })
  .strict();

export type DashboardSummaryPayload = z.infer<typeof dashboardSummarySchema>;

export const uploadContentTypeSchema = z.enum(["image/jpeg", "image/png", "image/webp"]);

export type UploadContentTypePayload = z.infer<typeof uploadContentTypeSchema>;

export const uploadTargetContextSchema = z.enum([
  "feed-post",
  "routine-evidence",
  "issue-evidence",
]);

export type UploadTargetContextPayload = z.infer<typeof uploadTargetContextSchema>;

export const mediaAccessScopeSchema = z.enum(["private", "department", "store", "organization"]);

export type MediaAccessScopePayload = z.infer<typeof mediaAccessScopeSchema>;

export const mediaModerationStateSchema = z.enum([
  "pending",
  "approved",
  "rejected",
  "quarantined",
  "blocked",
]);

export type MediaModerationStatePayload = z.infer<typeof mediaModerationStateSchema>;

export const mediaTargetTypeSchema = z.enum([
  "feed_post",
  "mission",
  "evidence",
  "standard",
  "profile",
  "recognition",
]);

export type MediaTargetTypePayload = z.infer<typeof mediaTargetTypeSchema>;

export const uploadIntentRequestSchema = z
  .object({
    contentLength: z.number().int().positive(),
    contentType: uploadContentTypeSchema,
    targetContext: uploadTargetContextSchema,
  })
  .strict();

export type UploadIntentRequestPayload = z.infer<typeof uploadIntentRequestSchema>;

export const uploadIntentPayloadSchema = z
  .object({
    expiresAt: z.string().datetime(),
    intentId: z.string().uuid(),
    maxBytes: z.number().int().positive(),
    storageKey: z.string().min(1),
    uploadMethod: z.literal("PUT"),
    uploadUrl: z.string().url(),
  })
  .strict();

export type UploadIntentPayload = z.infer<typeof uploadIntentPayloadSchema>;

export const mediaFinalizeRequestSchema = z
  .object({
    intentId: z.string().uuid(),
  })
  .strict();

export type MediaFinalizeRequestPayload = z.infer<typeof mediaFinalizeRequestSchema>;

export const mediaObjectPayloadSchema = z
  .object({
    accessScope: mediaAccessScopeSchema,
    byteSize: z.number().int().positive(),
    contentType: uploadContentTypeSchema,
    finalizedAt: z.string().datetime(),
    height: z.number().int().positive().optional(),
    id: z.string().uuid(),
    moderationState: mediaModerationStateSchema,
    ownerUserId: z.string().min(1),
    readUrl: z.string().url(),
    sha256Hash: z.string().length(64),
    storageKey: z.string().min(1),
    targetType: mediaTargetTypeSchema,
    width: z.number().int().positive().optional(),
  })
  .strict();

export type MediaObjectPayload = z.infer<typeof mediaObjectPayloadSchema>;

export interface ApiEnvelope<TData> {
  readonly data: TData;
  readonly requestId: string;
}

export interface ApiErrorEnvelope {
  readonly error: {
    readonly code: string;
    readonly message: string;
  };
  readonly requestId: string;
}

export const apiErrorEnvelopeSchema = z
  .object({
    error: z
      .object({
        code: z.string().min(1),
        message: z.string().min(1),
      })
      .strict(),
    requestId: z.string().min(1),
  })
  .strict();

export function apiEnvelopeSchema<TSchema extends z.ZodType>(dataSchema: TSchema) {
  return z
    .object({
      data: dataSchema,
      requestId: z.string().min(1),
    })
    .strict();
}

export function createApiEnvelope<TData>(data: TData, requestId: string): ApiEnvelope<TData> {
  return {
    data,
    requestId,
  };
}

export function parseApiEnvelope<TSchema extends z.ZodType>(
  dataSchema: TSchema,
  input: unknown,
): ApiEnvelope<z.infer<TSchema>> {
  const parsed = apiEnvelopeSchema(dataSchema).parse(input) as {
    readonly data: z.infer<TSchema>;
    readonly requestId: string;
  };

  return {
    data: parsed.data,
    requestId: parsed.requestId,
  };
}

export const apiContracts = {
  "audit.status": {
    method: "GET",
    path: "/audit/_status",
    response: apiEnvelopeSchema(routeModuleStatusSchema),
  },
  "auth.session": {
    method: "GET",
    path: "/auth/session",
    response: apiEnvelopeSchema(sessionUserSchema),
  },
  "auth.login": {
    method: "POST",
    path: "/auth/login",
    request: authLoginRequestSchema,
    response: apiEnvelopeSchema(authSessionPayloadSchema),
  },
  "auth.logout": {
    method: "POST",
    path: "/auth/logout",
    response: apiEnvelopeSchema(authLogoutResultSchema),
  },
  "auth.session.refresh": {
    method: "POST",
    path: "/auth/session/refresh",
    response: apiEnvelopeSchema(authSessionPayloadSchema),
  },
  "auth.invites.create": {
    method: "POST",
    path: "/auth/invites",
    request: accessInviteCreateRequestSchema,
    response: apiEnvelopeSchema(accessInvitePayloadSchema),
  },
  "auth.invites.list": {
    method: "GET",
    path: "/auth/invites",
    response: apiEnvelopeSchema(z.array(accessInvitePayloadSchema)),
  },
  "auth.invites.resend": {
    method: "POST",
    path: "/auth/invites/resend",
    request: accessInviteActionRequestSchema,
    response: apiEnvelopeSchema(accessInvitePayloadSchema),
  },
  "auth.invites.revoke": {
    method: "POST",
    path: "/auth/invites/revoke",
    request: accessInviteActionRequestSchema,
    response: apiEnvelopeSchema(accessInvitePayloadSchema),
  },
  "auth.invites.accept": {
    method: "POST",
    path: "/auth/invites/accept",
    request: accessInviteAcceptRequestSchema,
    response: apiEnvelopeSchema(accessInviteAcceptResultSchema),
  },
  "auth.signup": {
    method: "POST",
    path: "/auth/signup",
    request: accessInviteAcceptRequestSchema,
    response: apiEnvelopeSchema(accessInviteAcceptResultSchema),
  },
  "dashboard.summary": {
    method: "GET",
    path: "/dashboard/summary",
    response: apiEnvelopeSchema(dashboardSummarySchema),
  },
  "engagement.archive": {
    method: "GET",
    path: "/engagement/archive",
    response: apiEnvelopeSchema(engagementArchivePayloadSchema),
  },
  "engagement.campaigns.close": {
    method: "POST",
    path: "/engagement/campaigns/close",
    request: engagementCampaignCloseRequestSchema,
    response: apiEnvelopeSchema(engagementCampaignClosurePayloadSchema),
  },
  "engagement.campaigns.create": {
    method: "POST",
    path: "/engagement/campaigns",
    request: engagementCampaignCreateRequestSchema,
    response: apiEnvelopeSchema(engagementCampaignPayloadSchema),
  },
  "engagement.campaigns.list": {
    method: "GET",
    path: "/engagement/campaigns",
    response: apiEnvelopeSchema(z.array(engagementCampaignViewPayloadSchema)),
  },
  "engagement.rewardGrants.update": {
    method: "POST",
    path: "/engagement/reward-grants/status",
    request: engagementRewardGrantUpdateRequestSchema,
    response: apiEnvelopeSchema(engagementRewardGrantPayloadSchema),
  },
  "feed.announcement.read": {
    method: "POST",
    path: "/feed/announcements/read",
    request: feedAnnouncementReadRequestSchema,
    response: apiEnvelopeSchema(feedAnnouncementPayloadSchema),
  },
  "feed.comment.create": {
    method: "POST",
    path: "/feed/comments",
    request: feedCommentCreateRequestSchema,
    response: apiEnvelopeSchema(feedPostPayloadSchema),
  },
  "feed.create": {
    method: "POST",
    path: "/feed/posts",
    request: feedPostCreateRequestSchema,
    response: apiEnvelopeSchema(feedPostPayloadSchema),
  },
  "feed.delete": {
    method: "POST",
    path: "/feed/posts/delete",
    request: feedPostDeleteRequestSchema,
    response: apiEnvelopeSchema(feedPostPayloadSchema),
  },
  "feed.feedback.create": {
    method: "POST",
    path: "/feed/feedback",
    request: feedFeedbackCreateRequestSchema,
    response: apiEnvelopeSchema(feedFeedbackPayloadSchema),
  },
  "feed.home": {
    method: "GET",
    path: "/feed/home",
    response: apiEnvelopeSchema(feedHomePayloadSchema),
  },
  "feed.list": {
    method: "GET",
    path: "/feed/posts",
    response: apiEnvelopeSchema(z.array(feedPostSummarySchema)),
  },
  "feed.moderation.action": {
    method: "POST",
    path: "/feed/moderation",
    request: feedModerationRequestSchema,
    response: apiEnvelopeSchema(feedPostPayloadSchema),
  },
  "feed.poll.vote": {
    method: "POST",
    path: "/feed/polls/votes",
    request: feedPollVoteRequestSchema,
    response: apiEnvelopeSchema(feedPollPayloadSchema),
  },
  "feed.reaction.toggle": {
    method: "POST",
    path: "/feed/reactions",
    request: feedReactionRequestSchema,
    response: apiEnvelopeSchema(feedPostPayloadSchema),
  },
  "feed.visibility.update": {
    method: "POST",
    path: "/feed/posts/visibility",
    request: feedPostVisibilityUpdateRequestSchema,
    response: apiEnvelopeSchema(feedPostPayloadSchema),
  },
  "health.read": {
    method: "GET",
    path: "/health",
    response: apiEnvelopeSchema(apiHealthPayloadSchema),
  },
  "media.uploadIntent": {
    method: "POST",
    path: "/media/upload-intents",
    request: uploadIntentRequestSchema,
    response: apiEnvelopeSchema(uploadIntentPayloadSchema),
  },
  "media.finalize": {
    method: "POST",
    path: "/media/finalizations",
    request: mediaFinalizeRequestSchema,
    response: apiEnvelopeSchema(mediaObjectPayloadSchema),
  },
  "operations.summary": {
    method: "GET",
    path: "/operations/summary",
    response: apiEnvelopeSchema(operationsSummarySchema),
  },
  "operations.view": {
    method: "GET",
    path: "/operations/view",
    response: apiEnvelopeSchema(operationsViewPayloadSchema),
  },
  "operations.checklist.complete": {
    method: "POST",
    path: "/operations/checklist-items/complete",
    request: operationsChecklistItemCompleteRequestSchema,
    response: apiEnvelopeSchema(operationsViewPayloadSchema),
  },
  "operations.issue.create": {
    method: "POST",
    path: "/operations/issues",
    request: operationsIssueCreateRequestSchema,
    response: apiEnvelopeSchema(operationsViewPayloadSchema),
  },
  "operations.learning.complete": {
    method: "POST",
    path: "/operations/learning-bites/complete",
    request: operationsLearningCompleteRequestSchema,
    response: apiEnvelopeSchema(operationsViewPayloadSchema),
  },
  "recognition.summary": {
    method: "GET",
    path: "/recognition/summary",
    response: apiEnvelopeSchema(recognitionSummarySchema),
  },
  "recognition.profile": {
    method: "GET",
    path: "/recognition/profile",
    response: apiEnvelopeSchema(recognitionProfilePayloadSchema),
  },
  "recognition.ranking": {
    method: "GET",
    path: "/recognition/ranking",
    response: apiEnvelopeSchema(recognitionRankingPayloadSchema),
  },
  "recognition.send": {
    method: "POST",
    path: "/recognition/events",
    request: recognitionSendRequestSchema,
    response: apiEnvelopeSchema(recognitionSendResultPayloadSchema),
  },
  "recognition.feedPost": {
    method: "POST",
    path: "/recognition/feed-posts",
    request: recognitionFeedPostRequestSchema,
    response: apiEnvelopeSchema(recognitionSendResultPayloadSchema),
  },
  "schedules.collaboratorView": {
    method: "GET",
    path: "/schedules/collaborator-view",
    response: apiEnvelopeSchema(collaboratorScheduleViewSchema),
  },
  "schedules.planner": {
    method: "GET",
    path: "/schedules/planner",
    response: apiEnvelopeSchema(leaderSchedulePlannerSchema),
  },
  "schedules.shift.upsert": {
    method: "POST",
    path: "/schedules/shifts",
    request: scheduleShiftUpsertRequestSchema,
    response: apiEnvelopeSchema(scheduleShiftPayloadSchema),
  },
  "schedules.publish": {
    method: "POST",
    path: "/schedules/publish",
    request: schedulePublishRequestSchema,
    response: apiEnvelopeSchema(schedulePublishResultSchema),
  },
  "schedules.availability.create": {
    method: "POST",
    path: "/schedules/availability",
    request: scheduleAvailabilityCreateRequestSchema,
    response: apiEnvelopeSchema(scheduleRequestPayloadSchema),
  },
  "schedules.requests.review": {
    method: "POST",
    path: "/schedules/requests/review",
    request: scheduleRequestReviewRequestSchema,
    response: apiEnvelopeSchema(scheduleRequestPayloadSchema),
  },
  "schedules.timeOff.create": {
    method: "POST",
    path: "/schedules/time-off",
    request: scheduleTimeOffCreateRequestSchema,
    response: apiEnvelopeSchema(scheduleRequestPayloadSchema),
  },
  "schedules.swaps.propose": {
    method: "POST",
    path: "/schedules/swaps",
    request: scheduleSwapProposalRequestSchema,
    response: apiEnvelopeSchema(scheduleRequestPayloadSchema),
  },
  "schedules.swaps.respond": {
    method: "POST",
    path: "/schedules/swaps/respond",
    request: scheduleSwapResponseRequestSchema,
    response: apiEnvelopeSchema(scheduleRequestPayloadSchema),
  },
  "schedules.swaps.approve": {
    method: "POST",
    path: "/schedules/swaps/approve",
    request: scheduleSwapApproveRequestSchema,
    response: apiEnvelopeSchema(scheduleRequestPayloadSchema),
  },
  "schedules.summary": {
    method: "GET",
    path: "/schedules/summary",
    response: apiEnvelopeSchema(scheduleSummarySchema),
  },
} as const;

export type ApiContractKey = keyof typeof apiContracts;

export function listApiContractKeys(): readonly ApiContractKey[] {
  return Object.keys(apiContracts) as ApiContractKey[];
}
