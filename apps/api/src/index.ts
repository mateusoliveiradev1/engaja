import type { ApiPerformanceOperation } from "./performance.js";
import type {
  ApiContractKey,
  ApiEnvelope,
  ApiErrorEnvelope,
  ApiHealthPayload,
  ApiModuleName,
  AccessInvitePayload,
  AuthSessionPayload,
  RouteModuleStatusPayload,
  SessionUserPayload,
} from "@engaja/contracts";
import type {
  AuditLogSink,
  AuthProviderAdapter,
  PermissionAction,
  RateLimitPolicyKey,
  ScopedResource,
  SecurityActor,
  StructuredLogEvent,
} from "@engaja/security";
import type { Context } from "hono";

import { Hono } from "hono";

import {
  acknowledgeFeedAnnouncementUseCase,
  addFeedTimelineComment,
  approveShiftSwap,
  closeEngagementCampaign,
  completeChecklistItem,
  completeLearningBite,
  createActorContext,
  createApplicationTenantScope,
  createApplicationUserId,
  createEngagementCampaignUseCase,
  createFeedTimelinePost,
  createOperationsIssue,
  deleteFeedTimelinePost,
  getCollaboratorAchievementArchive,
  getCollaboratorScheduleView,
  getFeedHome,
  getFeedPostDetail,
  getHealthyRecognitionRanking,
  getLeaderSchedulePlanner,
  getOperationsView,
  getRecognitionProfile,
  listEngagementCampaigns,
  listFeedTimeline,
  moderateFeedPost,
  publishSchedule,
  proposeShiftSwap,
  reactToFeedTimelinePost,
  recognizeFeedPost,
  respondToShiftSwap,
  reviewScheduleRequest,
  sendRecognition,
  summarizeDashboard,
  summarizeOperations,
  summarizeRecognition,
  summarizeSchedule,
  syncChecklistEvidenceCampaignScores,
  syncFeedPostCampaignScores,
  submitPrivateFeedFeedback,
  submitAvailabilityRequest,
  submitTimeOffRequest,
  toCollaboratorScheduleViewPayload,
  toEngagementArchivePayload,
  toEngagementCampaignClosurePayload,
  toEngagementCampaignPayload,
  toEngagementCampaignViewPayload,
  toEngagementRewardGrantPayload,
  toFeedAnnouncementPayload,
  toFeedFeedbackPayload,
  toFeedHomePayload,
  toFeedPollPayload,
  toFeedTimelinePostPayload,
  toDashboardSummaryPayload,
  toFeedPostSummaryPayload,
  toLeaderSchedulePlannerPayload,
  toOperationsViewPayload,
  toOperationsSummaryPayload,
  toRecognitionProfilePayload,
  toRecognitionRankingPayload,
  toRecognitionSendResultPayload,
  toRecognitionSummaryPayload,
  toSchedulePublishResultPayload,
  toScheduleRequestPayload,
  toScheduleShiftPayload,
  toScheduleSummaryPayload,
  upsertScheduleShift,
  updateRewardGrantFulfillment,
  updateFeedPostVisibility,
  voteInFeedPollUseCase,
  type DashboardFilterInput,
} from "@engaja/application";
import {
  createDatabaseConnection,
  createDevelopmentFlvRepositories,
  createDrizzleAuthRepository,
  createDrizzleMediaRepository,
  createInMemoryAuthRepository,
  createInMemoryMediaRepository,
  createInMemoryObjectStorageAdapter,
  createPersistentFlvRepositories,
  createStorageAdapterFromEnvironment,
  createMediaService,
  loadDatabaseConfig,
  MediaError,
  readDatabaseMigrationReadiness,
  toMediaObjectPayload,
  type AuthRepository,
  type AccessInviteRecord,
  type AuthCredentialRecord,
  type AuthMembershipRecord,
  type AuthSessionRecord,
  type AuthUserRecord,
  type DatabaseProvider,
  type MediaService,
  type DevelopmentFlvRepositories,
  type MigrationReadiness,
} from "@engaja/data";
import {
  apiContractVersion,
  accessInviteAcceptRequestSchema,
  accessInviteActionRequestSchema,
  accessInviteCreateRequestSchema,
  authLoginRequestSchema,
  engagementCampaignCloseRequestSchema,
  engagementCampaignCreateRequestSchema,
  engagementRewardGrantUpdateRequestSchema,
  scheduleAvailabilityCreateRequestSchema,
  schedulePublishRequestSchema,
  scheduleRequestReviewRequestSchema,
  scheduleShiftUpsertRequestSchema,
  scheduleSwapApproveRequestSchema,
  scheduleSwapProposalRequestSchema,
  scheduleSwapResponseRequestSchema,
  scheduleTimeOffCreateRequestSchema,
  createApiEnvelope,
  dashboardContentTypeSchema,
  feedAnnouncementReadRequestSchema,
  feedCommentCreateRequestSchema,
  feedFeedbackCreateRequestSchema,
  feedModerationRequestSchema,
  feedPollVoteRequestSchema,
  feedPostCreateRequestSchema,
  feedPostDeleteRequestSchema,
  feedPostVisibilityUpdateRequestSchema,
  feedReactionRequestSchema,
  operationsChecklistItemCompleteRequestSchema,
  operationsIssueCreateRequestSchema,
  operationsLearningCompleteRequestSchema,
  recognitionFeedPostRequestSchema,
  recognitionSendRequestSchema,
  mediaFinalizeRequestSchema,
  operationRoutineIdSchema,
  uploadIntentRequestSchema,
} from "@engaja/contracts";
import {
  AuthorizationError,
  createAuthAdapterFromEnvironment,
  createAuditEvent,
  createDevelopmentAuthAdapter,
  createStructuredLogEvent,
  evaluatePermission,
  extractBearerToken,
  generateInviteToken,
  hashAuthToken,
  hashPassword,
  InMemoryAuditLogSink,
  InMemoryRateLimiter,
  isServerOnlyEnvironmentName,
  isAuthSessionExpired,
  issueSessionToken,
  shouldAuditAction,
  validateSecurityEnvironment,
  verifyPassword,
} from "@engaja/security";

import { profileApiOperation } from "./performance.js";

export type { ApiHealthPayload };
export { apiPerformanceOperationBudgets } from "./performance.js";

export interface ApiRouteModule {
  readonly basePath: `/${string}`;
  readonly contracts: readonly ApiContractKey[];
  readonly name: ApiModuleName;
}

export interface ApiAppOptions {
  readonly authRepository?: AuthRepository;
  readonly auditSink?: AuditLogSink;
  readonly authAdapter?: AuthProviderAdapter;
  readonly inviteBaseUrl?: string;
  readonly inviteSecret?: string;
  readonly logger?: (event: StructuredLogEvent) => void;
  readonly mediaService?: MediaService;
  readonly now?: () => Date;
  readonly persistence?: ApiRuntimePersistence;
  readonly rateLimiter?: InMemoryRateLimiter;
  readonly repositories?: DevelopmentFlvRepositories;
  readonly sessionSecret?: string;
  readonly sessionTtlMs?: number;
}

export interface ApiEnvironmentOptions extends ApiAppOptions {
  readonly env?: Readonly<Record<string, string | undefined>>;
}

interface ApiRuntime {
  readonly authRepository: AuthRepository;
  readonly auditSink: AuditLogSink;
  readonly authAdapter: AuthProviderAdapter;
  readonly inviteBaseUrl: string;
  readonly inviteSecret: string;
  readonly logger: (event: StructuredLogEvent) => void;
  readonly mediaService: MediaService;
  readonly now: () => Date;
  readonly persistence: ApiRuntimePersistence;
  readonly rateLimiter: InMemoryRateLimiter;
  readonly repositories: DevelopmentFlvRepositories;
  readonly sessionSecret: string;
  readonly sessionTtlMs: number;
}

export interface ApiRuntimePersistence {
  readonly mode: "database" | "memory";
  readonly provider: DatabaseProvider | "memory";
  readonly readMigrationReadiness?: () => Promise<MigrationReadiness>;
}

export interface ApiReadinessPayload {
  readonly database: {
    readonly persistence: ApiRuntimePersistence["mode"];
    readonly provider: ApiRuntimePersistence["provider"];
  };
  readonly migrations?: {
    readonly appliedCount: number;
    readonly current: boolean;
    readonly driftedCount: number;
    readonly journalReady: boolean;
    readonly latestMigration?: string;
    readonly pendingCount: number;
  };
  readonly status: "degraded" | "ready";
}

interface ProtectedRouteOptions {
  readonly action: PermissionAction;
  readonly profileOperation?: ApiPerformanceOperation;
  readonly rateLimitKey?: RateLimitPolicyKey;
  readonly resource?: (context: Context, actor: SecurityActor) => ScopedResource;
  readonly targetType: string;
}

interface AuthorizedRouteContext {
  readonly actor: SecurityActor;
  readonly requestId: string;
  readonly resource: ScopedResource;
}

export const apiRouteModules = [
  {
    basePath: "/auth",
    contracts: [
      "auth.login",
      "auth.logout",
      "auth.session",
      "auth.session.refresh",
      "auth.invites.create",
      "auth.invites.list",
      "auth.invites.resend",
      "auth.invites.revoke",
      "auth.invites.accept",
      "auth.signup",
    ],
    name: "auth",
  },
  {
    basePath: "/feed",
    contracts: [
      "feed.list",
      "feed.home",
      "feed.create",
      "feed.visibility.update",
      "feed.delete",
      "feed.reaction.toggle",
      "feed.comment.create",
      "feed.moderation.action",
      "feed.announcement.read",
      "feed.poll.vote",
      "feed.feedback.create",
    ],
    name: "feed",
  },
  {
    basePath: "/schedules",
    contracts: [
      "schedules.summary",
      "schedules.collaboratorView",
      "schedules.planner",
      "schedules.shift.upsert",
      "schedules.publish",
      "schedules.availability.create",
      "schedules.requests.review",
      "schedules.timeOff.create",
      "schedules.swaps.propose",
      "schedules.swaps.respond",
      "schedules.swaps.approve",
    ],
    name: "schedules",
  },
  {
    basePath: "/operations",
    contracts: [
      "operations.summary",
      "operations.view",
      "operations.checklist.complete",
      "operations.issue.create",
      "operations.learning.complete",
    ],
    name: "operations",
  },
  {
    basePath: "/recognition",
    contracts: [
      "recognition.summary",
      "recognition.profile",
      "recognition.ranking",
      "recognition.send",
      "recognition.feedPost",
    ],
    name: "recognition",
  },
  {
    basePath: "/dashboard",
    contracts: ["dashboard.summary"],
    name: "dashboard",
  },
  {
    basePath: "/engagement",
    contracts: [
      "engagement.archive",
      "engagement.campaigns.list",
      "engagement.campaigns.create",
      "engagement.campaigns.close",
      "engagement.rewardGrants.update",
    ],
    name: "engagement",
  },
  {
    basePath: "/media",
    contracts: ["media.uploadIntent", "media.finalize"],
    name: "media",
  },
  {
    basePath: "/audit",
    contracts: ["audit.status"],
    name: "audit",
  },
] as const satisfies readonly ApiRouteModule[];

export function createApiHealthPayload(requestId: string): ApiEnvelope<ApiHealthPayload> {
  return createApiEnvelope(
    {
      name: "@engaja/api",
      status: "ok",
      version: apiContractVersion,
    },
    requestId,
  );
}

export async function createApiReadinessPayload(
  requestId: string,
  persistence: ApiRuntimePersistence,
): Promise<ApiEnvelope<ApiReadinessPayload>> {
  const migrationReadiness = await persistence.readMigrationReadiness?.();

  return createApiEnvelope(
    {
      database: {
        persistence: persistence.mode,
        provider: persistence.provider,
      },
      ...(migrationReadiness === undefined
        ? {}
        : {
            migrations: {
              appliedCount: migrationReadiness.appliedCount,
              current: migrationReadiness.current,
              driftedCount: migrationReadiness.driftedCount,
              journalReady: migrationReadiness.journalReady,
              ...(migrationReadiness.latestMigration === undefined
                ? {}
                : { latestMigration: migrationReadiness.latestMigration }),
              pendingCount: migrationReadiness.pendingCount,
            },
          }),
      status: migrationReadiness === undefined || migrationReadiness.current ? "ready" : "degraded",
    },
    requestId,
  );
}

export function createApiRouteRegistry(): readonly ApiRouteModule[] {
  return apiRouteModules;
}

export function createApiApp(options: ApiAppOptions = {}): Hono {
  const runtime = createApiRuntime(options);
  const app = new Hono();

  app.get("/health", (context) => context.json(createApiHealthPayload(readRequestId(context))));
  app.get("/ready", async (context) =>
    context.json(await createApiReadinessPayload(readRequestId(context), runtime.persistence)),
  );

  app.post("/auth/login", async (context) => handleLoginRoute(context, runtime));
  app.post("/auth/logout", async (context) => handleLogoutRoute(context, runtime));
  app.get("/auth/session", async (context) => handleSessionRoute(context, runtime));
  app.post("/auth/session/refresh", async (context) => handleSessionRefreshRoute(context, runtime));
  app.get("/auth/invites", async (context) => handleInviteListRoute(context, runtime));
  app.post("/auth/invites", async (context) => handleInviteCreateRoute(context, runtime));
  app.post("/auth/invites/resend", async (context) => handleInviteResendRoute(context, runtime));
  app.post("/auth/invites/revoke", async (context) => handleInviteRevokeRoute(context, runtime));
  app.post("/auth/invites/accept", async (context) => handleInviteAcceptRoute(context, runtime));
  app.post("/auth/signup", async (context) => handleInviteAcceptRoute(context, runtime));

  app.get("/engagement/campaigns", (context) =>
    handleProtectedRoute(
      context,
      runtime,
      {
        action: "engagement.campaign.read",
        resource: readScopedResourceFromQuery,
        targetType: "engagement_campaign",
      },
      async (actor, resource) =>
        (
          await listEngagementCampaigns({
            actor: toActorContext(actor),
            engagementRepository: runtime.repositories.engagementRepository,
            scheduleRepository: runtime.repositories.scheduleRepository,
            scope: toTenantScope(resource),
          })
        ).map(toEngagementCampaignViewPayload),
    ),
  );

  app.post("/engagement/campaigns", (context) =>
    handleProtectedRoute(
      context,
      runtime,
      {
        action: "engagement.manage",
        rateLimitKey: "engagement.manage",
        targetType: "engagement_campaign",
      },
      async (actor) => {
        const body = engagementCampaignCreateRequestSchema.parse(await context.req.json());

        return toEngagementCampaignPayload(
          await createEngagementCampaignUseCase({
            actor: toActorContext(actor),
            description: body.description,
            ...(body.eligibility === undefined
              ? {}
              : { eligibility: compactEngagementEligibilityInput(body.eligibility) }),
            endsAt: new Date(body.endsAt),
            engagementRepository: runtime.repositories.engagementRepository,
            now: runtime.now(),
            objective: body.objective,
            periodPreset: body.periodPreset,
            reward: compactEngagementRewardInput(body.reward),
            scoringRule: compactEngagementScoringRuleInput(body.scoringRule),
            scope: toTenantScopeFromPayload(body.scope),
            ...(body.settlement === undefined
              ? {}
              : { settlement: compactEngagementSettlementInput(body.settlement) }),
            startsAt: new Date(body.startsAt),
            ...(body.status === undefined ? {} : { status: body.status }),
            title: body.title,
          }),
        );
      },
    ),
  );

  app.post("/engagement/campaigns/close", (context) =>
    handleProtectedRoute(
      context,
      runtime,
      {
        action: "engagement.manage",
        rateLimitKey: "engagement.manage",
        targetType: "engagement_campaign",
      },
      async (actor) => {
        const body = engagementCampaignCloseRequestSchema.parse(await context.req.json());

        return toEngagementCampaignClosurePayload(
          await closeEngagementCampaign({
            actor: toActorContext(actor),
            campaignId: toDomainId<"engagement-campaign">(body.campaignId),
            engagementRepository: runtime.repositories.engagementRepository,
            now: runtime.now(),
            recognitionRepository: runtime.repositories.recognitionRepository,
          }),
        );
      },
    ),
  );

  app.post("/engagement/reward-grants/status", (context) =>
    handleProtectedRoute(
      context,
      runtime,
      {
        action: "engagement.manage",
        rateLimitKey: "engagement.manage",
        targetType: "reward_grant",
      },
      async (actor) => {
        const body = engagementRewardGrantUpdateRequestSchema.parse(await context.req.json());

        return toEngagementRewardGrantPayload(
          await updateRewardGrantFulfillment({
            actor: toActorContext(actor),
            engagementRepository: runtime.repositories.engagementRepository,
            now: runtime.now(),
            rewardGrantId: toDomainId<"reward-grant">(body.rewardGrantId),
            status: body.status,
          }),
        );
      },
    ),
  );

  app.get("/engagement/archive", (context) =>
    handleProtectedRoute(
      context,
      runtime,
      {
        action: "engagement.archive.read",
        resource: readOwnScopedResourceFromQuery,
        targetType: "engagement_archive",
      },
      async (actor, resource) =>
        toEngagementArchivePayload(
          await getCollaboratorAchievementArchive({
            actor: toActorContext(actor),
            engagementRepository: runtime.repositories.engagementRepository,
            scheduleRepository: runtime.repositories.scheduleRepository,
            scope: toTenantScope(resource),
            targetUserId: toTargetUserId(resource, actor),
          }),
        ),
    ),
  );

  app.get("/feed/posts", (context) =>
    handleProtectedRoute(
      context,
      runtime,
      {
        action: "feed.read",
        resource: readScopedResourceFromQuery,
        targetType: "feed_post",
      },
      async (actor, resource) =>
        (
          await listFeedTimeline({
            actor: toActorContext(actor),
            feedRepository: runtime.repositories.feedRepository,
            scope: toTenantScope(resource),
          })
        ).map(toFeedPostSummaryPayload),
    ),
  );

  app.get("/feed/home", (context) =>
    handleProtectedRoute(
      context,
      runtime,
      {
        action: "feed.read",
        profileOperation: "feed.pagination",
        resource: readScopedResourceFromQuery,
        targetType: "feed_surface",
      },
      async (actor, resource) =>
        toFeedHomePayload(
          await getFeedHome({
            actor: toActorContext(actor),
            feedRepository: runtime.repositories.feedRepository,
            ...(context.req.query("cursor") === undefined
              ? {}
              : { cursor: context.req.query("cursor") }),
            ...(readPositiveIntegerQuery(context, "limit") === undefined
              ? {}
              : { limit: readPositiveIntegerQuery(context, "limit") }),
            scope: toTenantScope(resource),
          }),
        ),
    ),
  );

  app.post("/feed/posts", (context) =>
    handleProtectedRoute(
      context,
      runtime,
      {
        action: "feed.create",
        rateLimitKey: "feed.post",
        targetType: "feed_post",
      },
      async (actor) => {
        const body = feedPostCreateRequestSchema.parse(await context.req.json());

        return toFeedTimelinePostPayload(
          await createFeedTimelinePost({
            actor: toActorContext(actor),
            authorName: body.authorName,
            caption: body.caption,
            category: body.category,
            feedRepository: runtime.repositories.feedRepository,
            ...(body.missionLink === undefined
              ? {}
              : { missionLink: compactFeedMissionLinkInput(body.missionLink) }),
            now: runtime.now(),
            ...(body.pendingSync === true ? { pendingSync: true } : {}),
            ...(body.photoUrl === undefined ? {} : { photoUrl: body.photoUrl }),
            scope: toTenantScopeFromPayload(body.scope),
            title: body.title,
            visibility: body.visibility,
          }),
        );
      },
    ),
  );

  app.post("/feed/posts/visibility", (context) =>
    handleProtectedRoute(
      context,
      runtime,
      {
        action: "feed.create",
        targetType: "feed_post",
      },
      async (actor) => {
        const body = feedPostVisibilityUpdateRequestSchema.parse(await context.req.json());

        return toFeedTimelinePostPayload(
          await updateFeedPostVisibility({
            actor: toActorContext(actor),
            feedRepository: runtime.repositories.feedRepository,
            now: runtime.now(),
            postId: toDomainId<"feed-post">(body.postId),
            visibility: body.visibility,
          }),
        );
      },
    ),
  );

  app.post("/feed/posts/delete", (context) =>
    handleProtectedRoute(
      context,
      runtime,
      {
        action: "feed.create",
        targetType: "feed_post",
      },
      async (actor) => {
        const body = feedPostDeleteRequestSchema.parse(await context.req.json());

        return toFeedTimelinePostPayload(
          await deleteFeedTimelinePost({
            actor: toActorContext(actor),
            feedRepository: runtime.repositories.feedRepository,
            now: runtime.now(),
            postId: toDomainId<"feed-post">(body.postId),
          }),
        );
      },
    ),
  );

  app.post("/feed/reactions", (context) =>
    handleProtectedRoute(
      context,
      runtime,
      {
        action: "feed.react",
        rateLimitKey: "feed.reaction",
        targetType: "feed_reaction",
      },
      async (actor) => {
        const body = feedReactionRequestSchema.parse(await context.req.json());

        return toFeedTimelinePostPayload(
          await reactToFeedTimelinePost({
            actor: toActorContext(actor),
            feedRepository: runtime.repositories.feedRepository,
            now: runtime.now(),
            postId: toDomainId<"feed-post">(body.postId),
            reactionType: body.type,
          }),
        );
      },
    ),
  );

  app.post("/feed/comments", (context) =>
    handleProtectedRoute(
      context,
      runtime,
      {
        action: "feed.comment",
        rateLimitKey: "feed.comment",
        targetType: "feed_comment",
      },
      async (actor) => {
        const body = feedCommentCreateRequestSchema.parse(await context.req.json());

        return toFeedTimelinePostPayload(
          await addFeedTimelineComment({
            actor: toActorContext(actor),
            authorName: body.authorName,
            body: body.body,
            feedRepository: runtime.repositories.feedRepository,
            now: runtime.now(),
            ...(body.pendingSync === true ? { pendingSync: true } : {}),
            postId: toDomainId<"feed-post">(body.postId),
          }),
        );
      },
    ),
  );

  app.post("/feed/moderation", (context) =>
    handleProtectedRoute(
      context,
      runtime,
      {
        action: "feed.moderate",
        targetType: "feed_post",
      },
      async (actor) => {
        const body = feedModerationRequestSchema.parse(await context.req.json());

        const moderatedPost = await moderateFeedPost({
          action: body.action,
          actor: toActorContext(actor),
          feedRepository: runtime.repositories.feedRepository,
          now: runtime.now(),
          postId: toDomainId<"feed-post">(body.postId),
        });

        await syncFeedPostCampaignScores({
          engagementRepository: runtime.repositories.engagementRepository,
          now: runtime.now(),
          post: moderatedPost,
        });

        return toFeedTimelinePostPayload(
          await getFeedPostDetail({
            actor: toActorContext(actor),
            feedRepository: runtime.repositories.feedRepository,
            postId: toDomainId<"feed-post">(body.postId),
          }),
        );
      },
    ),
  );

  app.post("/feed/announcements/read", (context) =>
    handleProtectedRoute(
      context,
      runtime,
      {
        action: "feed.read",
        targetType: "announcement",
      },
      async (actor) => {
        const body = feedAnnouncementReadRequestSchema.parse(await context.req.json());

        return toFeedAnnouncementPayload(
          await acknowledgeFeedAnnouncementUseCase({
            actor: toActorContext(actor),
            announcementId: toDomainId<"announcement">(body.announcementId),
            feedRepository: runtime.repositories.feedRepository,
          }),
        );
      },
    ),
  );

  app.post("/feed/polls/votes", (context) =>
    handleProtectedRoute(
      context,
      runtime,
      {
        action: "feed.read",
        targetType: "poll_vote",
      },
      async (actor) => {
        const body = feedPollVoteRequestSchema.parse(await context.req.json());

        return toFeedPollPayload(
          await voteInFeedPollUseCase({
            actor: toActorContext(actor),
            feedRepository: runtime.repositories.feedRepository,
            now: runtime.now(),
            optionId: toDomainId<"poll-option">(body.optionId),
            pollId: toDomainId<"poll">(body.pollId),
          }),
        );
      },
    ),
  );

  app.post("/feed/feedback", (context) =>
    handleProtectedRoute(
      context,
      runtime,
      {
        action: "feed.feedback.create",
        rateLimitKey: "feedback.submit",
        targetType: "feed_feedback",
      },
      async (actor) => {
        const body = feedFeedbackCreateRequestSchema.parse(await context.req.json());

        return toFeedFeedbackPayload(
          await submitPrivateFeedFeedback({
            actor: toActorContext(actor),
            category: body.category,
            feedRepository: runtime.repositories.feedRepository,
            message: body.message,
            now: runtime.now(),
            scope: toTenantScopeFromPayload(body.scope),
          }),
        );
      },
    ),
  );

  app.get("/schedules/summary", (context) =>
    handleProtectedRoute(
      context,
      runtime,
      {
        action: "schedule.read",
        resource: readOwnScopedResourceFromQuery,
        targetType: "shift",
      },
      async (actor, resource) =>
        toScheduleSummaryPayload(
          await summarizeSchedule({
            actor: toActorContext(actor),
            now: runtime.now(),
            scheduleRepository: runtime.repositories.scheduleRepository,
            scope: toTenantScope(resource),
            targetUserId: toTargetUserId(resource, actor),
          }),
        ),
    ),
  );

  app.get("/schedules/collaborator-view", (context) =>
    handleProtectedRoute(
      context,
      runtime,
      {
        action: "schedule.read",
        profileOperation: "schedule.lookup",
        resource: readOwnScopedResourceFromQuery,
        targetType: "shift_view",
      },
      async (actor, resource) =>
        toCollaboratorScheduleViewPayload(
          await getCollaboratorScheduleView({
            actor: toActorContext(actor),
            now: runtime.now(),
            scheduleRepository: runtime.repositories.scheduleRepository,
            scope: toTenantScope(resource),
            targetUserId: toTargetUserId(resource, actor),
          }),
        ),
    ),
  );

  app.get("/schedules/planner", (context) =>
    handleProtectedRoute(
      context,
      runtime,
      {
        action: "schedule.read",
        profileOperation: "schedule.lookup",
        resource: readScopedResourceFromQuery,
        targetType: "shift_planner",
      },
      async (actor, resource) => {
        const weekStart = readDateTimeQuery(context, "weekStart");

        return toLeaderSchedulePlannerPayload(
          await getLeaderSchedulePlanner({
            actor: toActorContext(actor),
            now: runtime.now(),
            ...(weekStart === undefined ? {} : { weekStart }),
            scheduleRepository: runtime.repositories.scheduleRepository,
            scope: toTenantScope(resource),
          }),
        );
      },
    ),
  );

  app.post("/schedules/shifts", (context) =>
    handleProtectedRoute(
      context,
      runtime,
      {
        action: "schedule.change",
        rateLimitKey: "schedule.change",
        targetType: "shift",
      },
      async (actor) => {
        const body = scheduleShiftUpsertRequestSchema.parse(await context.req.json());

        return toScheduleShiftPayload(
          await upsertScheduleShift({
            actor: toActorContext(actor),
            breakMinutes: body.breakMinutes,
            endsAt: new Date(body.endsAt),
            now: runtime.now(),
            role: body.role,
            scheduleRepository: runtime.repositories.scheduleRepository,
            scope: toTenantScopeFromPayload(body.scope),
            ...(body.shiftId === undefined ? {} : { shiftId: toDomainId<"shift">(body.shiftId) }),
            startsAt: new Date(body.startsAt),
            title: body.title,
            userId: createApplicationUserId(body.userId),
          }),
        );
      },
    ),
  );

  app.post("/schedules/publish", (context) =>
    handleProtectedRoute(
      context,
      runtime,
      {
        action: "schedule.publish",
        rateLimitKey: "schedule.change",
        targetType: "shift",
      },
      async (actor) => {
        const body = schedulePublishRequestSchema.parse(await context.req.json());

        return toSchedulePublishResultPayload(
          await publishSchedule({
            actor: toActorContext(actor),
            now: runtime.now(),
            scheduleRepository: runtime.repositories.scheduleRepository,
            scope: toTenantScopeFromPayload(body.scope),
            ...(body.shiftIds === undefined
              ? {}
              : {
                  shiftIds: body.shiftIds.map((shiftId) => toDomainId<"shift">(shiftId)),
                }),
          }),
        );
      },
    ),
  );

  app.post("/schedules/availability", (context) =>
    handleProtectedRoute(
      context,
      runtime,
      {
        action: "schedule.request.create",
        resource: readOwnScopedResourceFromQuery,
        targetType: "schedule_request",
      },
      async (actor) => {
        const body = scheduleAvailabilityCreateRequestSchema.parse(await context.req.json());

        return toScheduleRequestPayload(
          await submitAvailabilityRequest({
            actor: toActorContext(actor),
            endsAt: new Date(body.endsAt),
            ...(body.note === undefined ? {} : { note: body.note }),
            now: runtime.now(),
            preferredPeriods: body.preferredPeriods,
            scheduleRepository: runtime.repositories.scheduleRepository,
            scope: toTenantScopeFromPayload(body.scope),
            startsAt: new Date(body.startsAt),
          }),
        );
      },
    ),
  );

  app.post("/schedules/time-off", (context) =>
    handleProtectedRoute(
      context,
      runtime,
      {
        action: "schedule.request.create",
        resource: readOwnScopedResourceFromQuery,
        targetType: "schedule_request",
      },
      async (actor) => {
        const body = scheduleTimeOffCreateRequestSchema.parse(await context.req.json());

        return toScheduleRequestPayload(
          await submitTimeOffRequest({
            actor: toActorContext(actor),
            endsAt: new Date(body.endsAt),
            now: runtime.now(),
            reason: body.reason,
            scheduleRepository: runtime.repositories.scheduleRepository,
            scope: toTenantScopeFromPayload(body.scope),
            startsAt: new Date(body.startsAt),
          }),
        );
      },
    ),
  );

  app.post("/schedules/requests/review", (context) =>
    handleProtectedRoute(
      context,
      runtime,
      {
        action: "schedule.request.review",
        targetType: "schedule_request",
      },
      async (actor) => {
        const body = scheduleRequestReviewRequestSchema.parse(await context.req.json());

        return toScheduleRequestPayload(
          await reviewScheduleRequest({
            actor: toActorContext(actor),
            decision: body.decision,
            now: runtime.now(),
            requestId: toDomainId<"schedule-request">(body.requestId),
            scheduleRepository: runtime.repositories.scheduleRepository,
          }),
        );
      },
    ),
  );

  app.post("/schedules/swaps", (context) =>
    handleProtectedRoute(
      context,
      runtime,
      {
        action: "schedule.request.create",
        resource: readOwnScopedResourceFromQuery,
        targetType: "shift_swap",
      },
      async (actor) => {
        const body = scheduleSwapProposalRequestSchema.parse(await context.req.json());

        return toScheduleRequestPayload(
          await proposeShiftSwap({
            actor: toActorContext(actor),
            ...(body.note === undefined ? {} : { note: body.note }),
            now: runtime.now(),
            scheduleRepository: runtime.repositories.scheduleRepository,
            scope: toTenantScopeFromPayload(body.scope),
            sourceShiftId: toDomainId<"shift">(body.sourceShiftId),
            targetShiftId: toDomainId<"shift">(body.targetShiftId),
            targetUserId: createApplicationUserId(body.targetUserId),
          }),
        );
      },
    ),
  );

  app.post("/schedules/swaps/respond", (context) =>
    handleProtectedRoute(
      context,
      runtime,
      {
        action: "schedule.request.create",
        resource: readOwnScopedResourceFromQuery,
        targetType: "shift_swap",
      },
      async (actor) => {
        const body = scheduleSwapResponseRequestSchema.parse(await context.req.json());

        return toScheduleRequestPayload(
          await respondToShiftSwap({
            actor: toActorContext(actor),
            now: runtime.now(),
            requestId: toDomainId<"schedule-request">(body.requestId),
            response: body.response,
            scheduleRepository: runtime.repositories.scheduleRepository,
          }),
        );
      },
    ),
  );

  app.post("/schedules/swaps/approve", (context) =>
    handleProtectedRoute(
      context,
      runtime,
      {
        action: "schedule.swap.approve",
        rateLimitKey: "schedule.change",
        targetType: "shift_swap",
      },
      async (actor) => {
        const body = scheduleSwapApproveRequestSchema.parse(await context.req.json());

        return toScheduleRequestPayload(
          await approveShiftSwap({
            actor: toActorContext(actor),
            now: runtime.now(),
            requestId: toDomainId<"schedule-request">(body.requestId),
            scheduleRepository: runtime.repositories.scheduleRepository,
          }),
        );
      },
    ),
  );

  app.get("/operations/summary", (context) =>
    handleProtectedRoute(
      context,
      runtime,
      {
        action: "operations.summary.read",
        resource: readScopedResourceFromQuery,
        targetType: "shift_summary",
      },
      async (actor, resource) =>
        toOperationsSummaryPayload(
          await summarizeOperations({
            actor: toActorContext(actor),
            operationsRepository: runtime.repositories.operationsRepository,
            scope: toTenantScope(resource),
          }),
        ),
    ),
  );

  app.get("/operations/view", (context) =>
    handleProtectedRoute(
      context,
      runtime,
      {
        action: "operations.routine.read",
        resource: readScopedResourceFromQuery,
        targetType: "shift_summary",
      },
      async (actor, resource) =>
        toOperationsViewPayload(
          await getOperationsView({
            actor: toActorContext(actor),
            operationsRepository: runtime.repositories.operationsRepository,
            scope: toTenantScope(resource),
          }),
        ),
    ),
  );

  app.post("/operations/checklist-items/complete", (context) =>
    handleProtectedRoute(
      context,
      runtime,
      {
        action: "operations.routine.complete",
        targetType: "checklist_item",
      },
      async (actor) => {
        const body = operationsChecklistItemCompleteRequestSchema.parse(await context.req.json());

        const scope = toTenantScopeFromPayload(body.scope);
        const operationsView = await completeChecklistItem({
          actor: toActorContext(actor),
          ...(body.evidencePhotoUrl === undefined
            ? {}
            : { evidencePhotoUrl: body.evidencePhotoUrl }),
          itemId: body.itemId,
          ...(body.note === undefined ? {} : { note: body.note }),
          now: runtime.now(),
          operationsRepository: runtime.repositories.operationsRepository,
          ...(body.pendingSync === undefined ? {} : { pendingSync: body.pendingSync }),
          routineId: body.routineId,
          scope,
          ...(body.shiftId === undefined ? {} : { shiftId: toDomainId<"shift">(body.shiftId) }),
        });

        await syncChecklistEvidenceCampaignScores({
          actorUserId: createApplicationUserId(actor.userId),
          engagementRepository: runtime.repositories.engagementRepository,
          ...(body.evidencePhotoUrl === undefined
            ? {}
            : { evidencePhotoUrl: body.evidencePhotoUrl }),
          itemId: body.itemId,
          now: runtime.now(),
          routineId: body.routineId,
          scope,
        });

        return toOperationsViewPayload(operationsView);
      },
    ),
  );

  app.post("/operations/issues", (context) =>
    handleProtectedRoute(
      context,
      runtime,
      {
        action: "operations.issue.create",
        targetType: "issue",
      },
      async (actor) => {
        const body = operationsIssueCreateRequestSchema.parse(await context.req.json());

        return toOperationsViewPayload(
          await createOperationsIssue({
            actor: toActorContext(actor),
            category: body.category,
            ...(body.evidencePhotoUrls === undefined
              ? {}
              : { evidencePhotoUrls: body.evidencePhotoUrls }),
            ...(body.note === undefined ? {} : { note: body.note }),
            now: runtime.now(),
            operationsRepository: runtime.repositories.operationsRepository,
            ...(body.pendingSync === undefined ? {} : { pendingSync: body.pendingSync }),
            ...(body.productName === undefined ? {} : { productName: body.productName }),
            ...(body.quantity === undefined ? {} : { quantity: body.quantity }),
            scope: toTenantScopeFromPayload(body.scope),
            severity: body.severity,
            ...(body.shiftId === undefined ? {} : { shiftId: toDomainId<"shift">(body.shiftId) }),
          }),
        );
      },
    ),
  );

  app.post("/operations/learning-bites/complete", (context) =>
    handleProtectedRoute(
      context,
      runtime,
      {
        action: "operations.routine.complete",
        targetType: "learning_bite",
      },
      async (actor) => {
        const body = operationsLearningCompleteRequestSchema.parse(await context.req.json());

        return toOperationsViewPayload(
          await completeLearningBite({
            actor: toActorContext(actor),
            learningBiteId: toDomainId<"learning-bite">(body.learningBiteId),
            now: runtime.now(),
            operationsRepository: runtime.repositories.operationsRepository,
            ...(body.pendingSync === undefined ? {} : { pendingSync: body.pendingSync }),
            scope: toTenantScopeFromPayload(body.scope),
          }),
        );
      },
    ),
  );

  app.get("/recognition/summary", (context) =>
    handleProtectedRoute(
      context,
      runtime,
      {
        action: "recognition.read",
        resource: readOwnScopedResourceFromQuery,
        targetType: "recognition",
      },
      async (actor, resource) =>
        toRecognitionSummaryPayload(
          await summarizeRecognition({
            actor: toActorContext(actor),
            now: runtime.now(),
            recognitionRepository: runtime.repositories.recognitionRepository,
            scope: toTenantScope(resource),
            targetUserId: toTargetUserId(resource, actor),
          }),
        ),
    ),
  );

  app.get("/recognition/profile", (context) =>
    handleProtectedRoute(
      context,
      runtime,
      {
        action: "recognition.read",
        resource: readOwnScopedResourceFromQuery,
        targetType: "recognition",
      },
      async (actor, resource) =>
        toRecognitionProfilePayload(
          await getRecognitionProfile({
            actor: toActorContext(actor),
            now: runtime.now(),
            recognitionRepository: runtime.repositories.recognitionRepository,
            scope: toTenantScope(resource),
            targetUserId: toTargetUserId(resource, actor),
          }),
        ),
    ),
  );

  app.get("/recognition/ranking", (context) =>
    handleProtectedRoute(
      context,
      runtime,
      {
        action: "feed.read",
        resource: readScopedResourceFromQuery,
        targetType: "recognition_ranking",
      },
      async (actor, resource) => {
        const limit = readPositiveIntegerQuery(context, "limit");
        const scope = toTenantScope(resource);

        return toRecognitionRankingPayload(
          await getHealthyRecognitionRanking({
            actor: toActorContext(actor),
            ...(limit === undefined ? {} : { limit }),
            recognitionRepository: runtime.repositories.recognitionRepository,
            scope,
            teamMembers: await runtime.repositories.scheduleRepository.listTeamMembers(scope),
          }),
        );
      },
    ),
  );

  app.post("/recognition/events", (context) =>
    handleProtectedRoute(
      context,
      runtime,
      {
        action: "recognition.send",
        rateLimitKey: "recognition.send",
        targetType: "recognition",
      },
      async (actor) => {
        const body = recognitionSendRequestSchema.parse(await context.req.json());

        return toRecognitionSendResultPayload(
          await sendRecognition({
            actor: toActorContext(actor),
            category: body.category,
            message: body.message,
            now: runtime.now(),
            recognitionRepository: runtime.repositories.recognitionRepository,
            recipientUserId: toDomainId<"user">(body.recipientUserId),
            scope: toTenantScopeFromPayload(body.scope),
          }),
        );
      },
    ),
  );

  app.post("/recognition/feed-posts", (context) =>
    handleProtectedRoute(
      context,
      runtime,
      {
        action: "recognition.send",
        rateLimitKey: "recognition.send",
        targetType: "feed_post",
      },
      async (actor) => {
        const body = recognitionFeedPostRequestSchema.parse(await context.req.json());

        return toRecognitionSendResultPayload(
          await recognizeFeedPost({
            actor: toActorContext(actor),
            feedRepository: runtime.repositories.feedRepository,
            ...(body.message === undefined ? {} : { message: body.message }),
            now: runtime.now(),
            postId: toDomainId<"feed-post">(body.postId),
            recognitionRepository: runtime.repositories.recognitionRepository,
          }),
        );
      },
    ),
  );

  app.get("/dashboard/summary", (context) =>
    handleProtectedRoute(
      context,
      runtime,
      {
        action: "dashboard.read",
        profileOperation: "dashboard.filters",
        resource: readScopedResourceFromQuery,
        targetType: "dashboard_metric",
      },
      async (actor, resource) => {
        const dashboardFilters = readDashboardFiltersFromQuery(context);

        return toDashboardSummaryPayload(
          await summarizeDashboard({
            actor: toActorContext(actor),
            feedRepository: runtime.repositories.feedRepository,
            ...(dashboardFilters === undefined ? {} : { filters: dashboardFilters }),
            metricsRepository: runtime.repositories.metricsRepository,
            now: runtime.now(),
            operationsRepository: runtime.repositories.operationsRepository,
            recognitionRepository: runtime.repositories.recognitionRepository,
            scheduleRepository: runtime.repositories.scheduleRepository,
            scope: toTenantScope(resource),
          }),
        );
      },
    ),
  );

  app.post("/media/upload-intents", (context) =>
    handleProtectedRoute(
      context,
      runtime,
      {
        action: "media.upload",
        rateLimitKey: "media.upload",
        targetType: "media_upload_intent",
      },
      async (actor) => {
        const body = uploadIntentRequestSchema.parse(await context.req.json());
        const intent = await runtime.mediaService.createUploadIntent(actor, body);

        return {
          expiresAt: intent.expiresAt.toISOString(),
          intentId: intent.id,
          maxBytes: intent.maxByteSize,
          storageKey: intent.storageKey,
          uploadMethod: "PUT" as const,
          uploadUrl: buildAbsoluteRouteUrl(context, `/media/upload-intents/${intent.id}/content`),
        };
      },
    ),
  );

  app.put("/media/upload-intents/:intentId/content", (context) =>
    handleMediaUploadContentRoute(context, runtime),
  );

  app.post("/media/finalizations", (context) =>
    handleProtectedRoute(
      context,
      runtime,
      {
        action: "media.upload",
        rateLimitKey: "media.upload",
        targetType: "media_object",
      },
      async (actor) => {
        const body = mediaFinalizeRequestSchema.parse(await context.req.json());
        const mediaObject = await runtime.mediaService.finalizeUpload(body.intentId, actor);

        return toMediaObjectPayload(
          mediaObject,
          buildAbsoluteRouteUrl(context, `/media/objects/${mediaObject.id}/content`),
        );
      },
    ),
  );

  app.get("/media/objects/:mediaObjectId/content", (context) =>
    handleMediaReadRoute(context, runtime),
  );

  for (const moduleDefinition of apiRouteModules) {
    app.get(`${moduleDefinition.basePath}/_status`, (context) =>
      context.json(createApiEnvelope(createModuleStatus(moduleDefinition), readRequestId(context))),
    );
  }

  return app;
}

export function createApiAppFromEnvironment(options: ApiEnvironmentOptions = {}): Hono {
  const env = options.env ?? process.env;
  const inviteBaseUrl = options.inviteBaseUrl ?? env.INVITE_BASE_URL;
  const inviteSecret = options.inviteSecret ?? env.INVITE_TOKEN_SECRET;
  const sessionSecret = options.sessionSecret ?? env.SESSION_SECRET;

  assertApiEnvironmentIsSafe({
    serverEnv: env,
  });

  const databaseRuntime = createDatabaseRuntimeFromEnvironment(env, options);
  const authRepository = options.authRepository ?? databaseRuntime?.authRepository;
  const persistence = options.persistence ?? databaseRuntime?.persistence;
  const repositories = options.repositories ?? databaseRuntime?.repositories;

  return createApiApp({
    ...options,
    ...(authRepository === undefined ? {} : { authRepository }),
    authAdapter: options.authAdapter ?? createAuthAdapterFromEnvironment({ env }),
    ...(inviteBaseUrl === undefined ? {} : { inviteBaseUrl }),
    ...(inviteSecret === undefined ? {} : { inviteSecret }),
    mediaService:
      options.mediaService ??
      databaseRuntime?.mediaService ??
      createMediaService({
        ...(options.now === undefined ? {} : { now: options.now }),
        repository: createInMemoryMediaRepository(),
        storage: createStorageAdapterFromEnvironment(env),
      }),
    ...(persistence === undefined ? {} : { persistence }),
    ...(repositories === undefined ? {} : { repositories }),
    ...(sessionSecret === undefined ? {} : { sessionSecret }),
  });
}

interface ApiDatabaseRuntime {
  readonly authRepository: AuthRepository;
  readonly mediaService: MediaService;
  readonly persistence: ApiRuntimePersistence;
  readonly repositories: DevelopmentFlvRepositories;
}

function createDatabaseRuntimeFromEnvironment(
  env: Readonly<Record<string, string | undefined>>,
  options: ApiEnvironmentOptions,
): ApiDatabaseRuntime | undefined {
  if (!isDatabaseRuntimeSelected(env)) {
    return undefined;
  }

  const connection = createDatabaseConnection(loadDatabaseConfig(env));

  return {
    authRepository: createDrizzleAuthRepository(connection.db),
    mediaService: createMediaService({
      ...(options.now === undefined ? {} : { now: options.now }),
      repository: createDrizzleMediaRepository(connection.db),
      storage: createStorageAdapterFromEnvironment(env),
    }),
    persistence: {
      mode: "database",
      provider: connection.provider,
      readMigrationReadiness: () =>
        readDatabaseMigrationReadiness({
          db: connection.db,
          provider: connection.provider,
        }),
    },
    repositories: createPersistentFlvRepositories(connection.db),
  };
}

function isDatabaseRuntimeSelected(env: Readonly<Record<string, string | undefined>>): boolean {
  const provider = env.DATABASE_PROVIDER;

  if (provider === "local-postgres" || provider === "neon") {
    return true;
  }

  return hasNonBlankValue(env.DATABASE_URL) || hasNonBlankValue(env.NEON_DATABASE_URL);
}

function hasNonBlankValue(value: string | undefined): boolean {
  return value !== undefined && value.trim().length > 0;
}

export function createModuleStatus(moduleDefinition: ApiRouteModule): RouteModuleStatusPayload {
  return {
    basePath: moduleDefinition.basePath,
    module: moduleDefinition.name,
    ownedContracts: [...moduleDefinition.contracts],
    status: "ready",
  };
}

export function assertServerOnlyEnvironmentName(name: string): void {
  if (!isServerOnlyEnvironmentName(name)) {
    throw new Error(`${name} is not registered as a server-only environment variable.`);
  }
}

export function assertApiEnvironmentIsSafe(input: {
  readonly clientEnv?: Readonly<Record<string, string | undefined>>;
  readonly serverEnv: Readonly<Record<string, string | undefined>>;
}): void {
  const result = validateSecurityEnvironment({
    serverEnv: input.serverEnv,
    ...(input.clientEnv === undefined ? {} : { clientEnv: input.clientEnv }),
  });

  if (!result.ok) {
    throw new Error(result.errors.join(" "));
  }
}

function createApiRuntime(options: ApiAppOptions): ApiRuntime {
  const now = options.now ?? (() => new Date());

  return {
    authRepository: options.authRepository ?? createInMemoryAuthRepository(),
    auditSink: options.auditSink ?? new InMemoryAuditLogSink(),
    authAdapter: options.authAdapter ?? createDevelopmentAuthAdapter(),
    inviteBaseUrl: options.inviteBaseUrl ?? "https://app.engaja.local/convite",
    inviteSecret: options.inviteSecret ?? "development-invite-secret-value",
    logger: options.logger ?? (() => undefined),
    mediaService:
      options.mediaService ??
      createMediaService({
        now,
        repository: createInMemoryMediaRepository(),
        storage: createInMemoryObjectStorageAdapter(),
      }),
    now,
    persistence: options.persistence ?? {
      mode: "memory",
      provider: "memory",
    },
    rateLimiter: options.rateLimiter ?? new InMemoryRateLimiter(),
    repositories: options.repositories ?? createDevelopmentFlvRepositories(),
    sessionSecret: options.sessionSecret ?? "development-session-secret-value",
    sessionTtlMs: options.sessionTtlMs ?? 1000 * 60 * 60 * 24 * 14,
  };
}

async function handleLoginRoute(context: Context, runtime: ApiRuntime): Promise<Response> {
  const requestId = readRequestId(context);
  const body = authLoginRequestSchema.parse(await context.req.json());
  const email = normalizeEmail(body.email);
  const subject = `${email}:${readClientIp(context)}`;
  const rateLimit = runtime.rateLimiter.consume("auth.login", subject, runtime.now());

  if (!rateLimit.allowed) {
    return context.json(
      createApiErrorEnvelope("rate_limited", "Muitas tentativas.", requestId),
      429,
    );
  }

  const credential = await runtime.authRepository.findCredentialByEmail(email);

  if (credential === undefined || credential.status !== "active" || !credential.user.active) {
    return context.json(
      createApiErrorEnvelope("invalid_credentials", "Email ou senha invalidos.", requestId),
      401,
    );
  }

  const now = runtime.now();

  if (credential.lockedUntil !== undefined && credential.lockedUntil > now) {
    return context.json(
      createApiErrorEnvelope("rate_limited", "Muitas tentativas.", requestId),
      429,
    );
  }

  const passwordMatches = await verifyPassword(body.password, credential.passwordHash);

  if (!passwordMatches) {
    await recordLoginFailure(runtime, credential, requestId, now);

    return context.json(
      createApiErrorEnvelope("invalid_credentials", "Email ou senha invalidos.", requestId),
      401,
    );
  }

  await runtime.authRepository.recordCredentialSuccess({
    credentialId: credential.id,
    lastVerifiedAt: now,
  });

  const sessionContext = await runtime.authRepository.findUserSessionContextByUserId(
    credential.userId,
  );

  if (sessionContext === undefined) {
    return context.json(
      createApiErrorEnvelope("session_unavailable", "Acesso indisponivel.", requestId),
      403,
    );
  }

  const session = await issueRepositorySession(
    runtime,
    sessionContext.user,
    sessionContext.membership,
    {
      ...readSessionMetadata(context, body.deviceLabel),
    },
  );

  return context.json(createApiEnvelope(session, requestId));
}

async function handleLogoutRoute(context: Context, runtime: ApiRuntime): Promise<Response> {
  const requestId = readRequestId(context);
  const verifiedSession = await verifyRuntimeSession(context, runtime);

  if (verifiedSession === undefined) {
    return context.json(
      createApiErrorEnvelope("unauthorized", "Autenticacao obrigatoria.", requestId),
      401,
    );
  }

  if (verifiedSession.source === "repository") {
    await runtime.authRepository.revokeSessionByTokenHash({
      revokedAt: runtime.now(),
      sessionTokenHash: hashAuthToken(verifiedSession.token, runtime.sessionSecret),
    });
  }

  await runtime.auditSink.append(
    createAuditEvent({
      action: "auth.logout",
      actor: verifiedSession.actor,
      requestId,
      targetType: "auth_session",
    }),
  );

  return context.json(createApiEnvelope({ revoked: true }, requestId));
}

async function handleSessionRoute(context: Context, runtime: ApiRuntime): Promise<Response> {
  const requestId = readRequestId(context);
  const subject = context.req.header("x-forwarded-for") ?? "local";
  const rateLimit = runtime.rateLimiter.consume("auth.session", subject, runtime.now());

  if (!rateLimit.allowed) {
    return context.json(
      createApiErrorEnvelope("rate_limited", "Muitas tentativas.", requestId),
      429,
    );
  }

  const verifiedSession = await verifyRuntimeSession(context, runtime);

  if (verifiedSession === undefined) {
    return context.json(
      createApiErrorEnvelope("unauthorized", "Entre novamente para continuar.", requestId),
      401,
    );
  }

  return context.json(createApiEnvelope(createSessionPayload(verifiedSession.actor), requestId));
}

async function handleSessionRefreshRoute(context: Context, runtime: ApiRuntime): Promise<Response> {
  const requestId = readRequestId(context);
  const verifiedSession = await verifyRuntimeSession(context, runtime);

  if (verifiedSession === undefined) {
    return context.json(
      createApiErrorEnvelope("unauthorized", "Entre novamente para continuar.", requestId),
      401,
    );
  }

  if (
    verifiedSession.source === "repository" &&
    verifiedSession.user !== undefined &&
    verifiedSession.membership !== undefined
  ) {
    await runtime.authRepository.revokeSessionByTokenHash({
      revokedAt: runtime.now(),
      sessionTokenHash: hashAuthToken(verifiedSession.token, runtime.sessionSecret),
    });

    const refreshedSession = await issueRepositorySession(
      runtime,
      verifiedSession.user,
      verifiedSession.membership,
      readSessionMetadata(context),
    );

    return context.json(createApiEnvelope(refreshedSession, requestId));
  }

  return context.json(
    createApiEnvelope(
      {
        expiresAt: new Date(runtime.now().getTime() + runtime.sessionTtlMs).toISOString(),
        sessionToken: verifiedSession.token,
        user: createSessionPayload(verifiedSession.actor),
      },
      requestId,
    ),
  );
}

async function handleInviteListRoute(context: Context, runtime: ApiRuntime): Promise<Response> {
  return handleProtectedRoute(
    context,
    runtime,
    {
      action: "invite.list",
      rateLimitKey: "invite.manage",
      resource: readScopedResourceFromQuery,
      targetType: "access_invite",
    },
    async (_actor, resource) =>
      (await runtime.authRepository.listInvites(resource)).map((invite) =>
        toAccessInvitePayload(invite),
      ),
  );
}

async function handleInviteCreateRoute(context: Context, runtime: ApiRuntime): Promise<Response> {
  const requestId = readRequestId(context);
  const verifiedSession = await verifyRuntimeSession(context, runtime);

  if (verifiedSession === undefined) {
    return context.json(
      createApiErrorEnvelope("unauthorized", "Autenticacao obrigatoria.", requestId),
      401,
    );
  }

  const body = accessInviteCreateRequestSchema.parse(await context.req.json());
  const inviteScope = toScopedResourceFromPayload(body.scope);
  const authorization = await authorizeActorForResource(
    context,
    runtime,
    verifiedSession.actor,
    "invite.create",
    inviteScope,
    "access_invite",
  );

  if (authorization instanceof Response) {
    return authorization;
  }

  if (!canInviteRole(verifiedSession.actor, body.role)) {
    await appendSecurityDenyAudit(
      runtime,
      verifiedSession.actor,
      requestId,
      inviteScope,
      "invite.create",
      "access_invite",
      "outside_role_grant",
    );

    return context.json(
      createApiErrorEnvelope(
        "not_found_or_forbidden",
        "Recurso nao encontrado ou sem permissao.",
        requestId,
      ),
      403,
    );
  }

  const rateLimit = runtime.rateLimiter.consume(
    "invite.manage",
    verifiedSession.actor.userId,
    runtime.now(),
  );

  if (!rateLimit.allowed) {
    return context.json(
      createApiErrorEnvelope("rate_limited", "Muitas tentativas.", requestId),
      429,
    );
  }

  const role = await runtime.authRepository.findRoleByCode(body.scope.organizationId, body.role);

  if (role === undefined) {
    return context.json(
      createApiErrorEnvelope("bad_request", "Papel invalido para o convite.", requestId),
      400,
    );
  }

  const token = generateInviteToken({ inviteSecret: runtime.inviteSecret });
  const now = runtime.now();
  const expiresAt = new Date(now.getTime() + (body.expiresInDays ?? 14) * 24 * 60 * 60 * 1000);
  const invite = await runtime.authRepository.createInvite({
    deliveryChannel: "manual",
    email: body.email,
    expiresAt,
    intendedMembership: {
      roleCode: body.role,
      ...body.scope,
    },
    invitedByUserId: verifiedSession.actor.userId,
    organizationId: body.scope.organizationId,
    roleCode: body.role,
    roleId: role.id,
    tokenHash: token.tokenHash,
    ...(body.scope.departmentId === undefined ? {} : { departmentId: body.scope.departmentId }),
    ...(body.scope.storeId === undefined ? {} : { storeId: body.scope.storeId }),
  });

  await runtime.auditSink.append(
    createAuditEvent({
      action: "invite.create",
      actor: verifiedSession.actor,
      metadata: {
        inviteId: invite.id,
        role: invite.roleCode,
      },
      requestId,
      scope: invite,
      targetId: invite.id,
      targetType: "access_invite",
    }),
  );

  return context.json(
    createApiEnvelope(
      toAccessInvitePayload(invite, {
        channel: invite.deliveryChannel,
        inviteUrl: buildInviteUrl(runtime.inviteBaseUrl, token.token),
        token: token.token,
      }),
      requestId,
    ),
  );
}

async function handleInviteResendRoute(context: Context, runtime: ApiRuntime): Promise<Response> {
  const requestId = readRequestId(context);
  const verifiedSession = await verifyRuntimeSession(context, runtime);

  if (verifiedSession === undefined) {
    return context.json(
      createApiErrorEnvelope("unauthorized", "Autenticacao obrigatoria.", requestId),
      401,
    );
  }

  const body = accessInviteActionRequestSchema.parse(await context.req.json());
  const invite = await runtime.authRepository.findInviteById(body.inviteId);

  if (invite === undefined) {
    return context.json(
      createApiErrorEnvelope("not_found", "Convite nao encontrado.", requestId),
      404,
    );
  }

  const authorization = await authorizeActorForResource(
    context,
    runtime,
    verifiedSession.actor,
    "invite.resend",
    invite,
    "access_invite",
  );

  if (authorization instanceof Response) {
    return authorization;
  }

  if (invite.status !== "pending" || invite.expiresAt <= runtime.now()) {
    return context.json(
      createApiErrorEnvelope("invite_unavailable", "Convite indisponivel.", requestId),
      409,
    );
  }

  const token = generateInviteToken({ inviteSecret: runtime.inviteSecret });
  const resentAt = runtime.now();
  const resentInvite = await runtime.authRepository.resendInvite({
    expiresAt: new Date(resentAt.getTime() + 14 * 24 * 60 * 60 * 1000),
    inviteId: invite.id,
    resentAt,
    tokenHash: token.tokenHash,
  });

  if (resentInvite === undefined) {
    return context.json(
      createApiErrorEnvelope("not_found", "Convite nao encontrado.", requestId),
      404,
    );
  }

  await runtime.auditSink.append(
    createAuditEvent({
      action: "invite.resend",
      actor: verifiedSession.actor,
      requestId,
      scope: resentInvite,
      targetId: resentInvite.id,
      targetType: "access_invite",
    }),
  );

  return context.json(
    createApiEnvelope(
      toAccessInvitePayload(resentInvite, {
        channel: resentInvite.deliveryChannel,
        inviteUrl: buildInviteUrl(runtime.inviteBaseUrl, token.token),
        token: token.token,
      }),
      requestId,
    ),
  );
}

async function handleInviteRevokeRoute(context: Context, runtime: ApiRuntime): Promise<Response> {
  const requestId = readRequestId(context);
  const verifiedSession = await verifyRuntimeSession(context, runtime);

  if (verifiedSession === undefined) {
    return context.json(
      createApiErrorEnvelope("unauthorized", "Autenticacao obrigatoria.", requestId),
      401,
    );
  }

  const body = accessInviteActionRequestSchema.parse(await context.req.json());
  const invite = await runtime.authRepository.findInviteById(body.inviteId);

  if (invite === undefined) {
    return context.json(
      createApiErrorEnvelope("not_found", "Convite nao encontrado.", requestId),
      404,
    );
  }

  const authorization = await authorizeActorForResource(
    context,
    runtime,
    verifiedSession.actor,
    "invite.revoke",
    invite,
    "access_invite",
  );

  if (authorization instanceof Response) {
    return authorization;
  }

  if (invite.status !== "pending") {
    return context.json(
      createApiErrorEnvelope("invite_unavailable", "Convite indisponivel.", requestId),
      409,
    );
  }

  const revokedInvite = await runtime.authRepository.revokeInvite({
    inviteId: invite.id,
    revokedAt: runtime.now(),
    revokedByUserId: verifiedSession.actor.userId,
  });

  if (revokedInvite === undefined) {
    return context.json(
      createApiErrorEnvelope("not_found", "Convite nao encontrado.", requestId),
      404,
    );
  }

  await runtime.auditSink.append(
    createAuditEvent({
      action: "invite.revoke",
      actor: verifiedSession.actor,
      requestId,
      scope: revokedInvite,
      targetId: revokedInvite.id,
      targetType: "access_invite",
    }),
  );

  return context.json(createApiEnvelope(toAccessInvitePayload(revokedInvite), requestId));
}

async function handleInviteAcceptRoute(context: Context, runtime: ApiRuntime): Promise<Response> {
  const requestId = readRequestId(context);
  const body = accessInviteAcceptRequestSchema.parse(await context.req.json());
  const tokenHash = hashAuthToken(body.token, runtime.inviteSecret);
  const invite = await runtime.authRepository.findInviteByTokenHash(tokenHash);

  if (invite === undefined) {
    return context.json(
      createApiErrorEnvelope("invite_invalid", "Convite invalido.", requestId),
      404,
    );
  }

  if (invite.status === "accepted") {
    return context.json(
      createApiErrorEnvelope("invite_used", "Convite ja utilizado.", requestId),
      409,
    );
  }

  if (invite.status === "revoked") {
    return context.json(
      createApiErrorEnvelope("invite_revoked", "Convite revogado.", requestId),
      410,
    );
  }

  if (invite.status === "expired" || invite.expiresAt <= runtime.now()) {
    return context.json(
      createApiErrorEnvelope("invite_expired", "Convite expirado.", requestId),
      410,
    );
  }

  if (normalizeEmail(invite.email) !== normalizeEmail(body.email)) {
    return context.json(
      createApiErrorEnvelope("invite_invalid", "Convite invalido.", requestId),
      404,
    );
  }

  const now = runtime.now();
  const passwordHash = await hashPassword(body.password);
  const result = await runtime.authRepository.acceptInvite({
    displayName: body.displayName,
    email: body.email,
    inviteId: invite.id,
    now,
    passwordHash,
    passwordHashVersion: "scrypt",
    ...(body.phoneNumber === undefined ? {} : { phoneNumber: body.phoneNumber }),
    ...(body.preferredName === undefined ? {} : { preferredName: body.preferredName }),
  });

  if (result === undefined) {
    return context.json(
      createApiErrorEnvelope("invite_invalid", "Convite invalido.", requestId),
      404,
    );
  }

  const actor = createActorFromSessionContext(result.user, result.membership);
  const session = await issueRepositorySession(runtime, result.user, result.membership, {
    ...readSessionMetadata(context),
  });

  await runtime.auditSink.append(
    createAuditEvent({
      action: "invite.accept",
      actor,
      requestId,
      scope: result.invite,
      targetId: result.invite.id,
      targetType: "access_invite",
    }),
  );

  return context.json(
    createApiEnvelope(
      {
        invite: toAccessInvitePayload(result.invite),
        session,
      },
      requestId,
    ),
  );
}

interface VerifiedRuntimeSession {
  readonly actor: SecurityActor;
  readonly membership?: AuthMembershipRecord;
  readonly session?: AuthSessionRecord;
  readonly source: "adapter" | "repository";
  readonly token: string;
  readonly user?: AuthUserRecord;
}

async function verifyRuntimeSession(
  context: Context,
  runtime: ApiRuntime,
): Promise<VerifiedRuntimeSession | undefined> {
  const token = extractBearerToken(context.req.header("authorization"));

  if (token === undefined) {
    return undefined;
  }

  const session = await runtime.authRepository.findSessionByTokenHash(
    hashAuthToken(token, runtime.sessionSecret),
  );

  if (session !== undefined) {
    if (session.status !== "active" || isAuthSessionExpired(session.expiresAt, runtime.now())) {
      return undefined;
    }

    const sessionContext = await runtime.authRepository.findUserSessionContextByUserId(
      session.userId,
    );

    if (sessionContext === undefined) {
      return undefined;
    }

    await runtime.authRepository.touchSession({
      lastSeenAt: runtime.now(),
      sessionId: session.id,
    });

    return {
      actor: createActorFromSessionContext(sessionContext.user, sessionContext.membership),
      membership: sessionContext.membership,
      session,
      source: "repository",
      token,
      user: sessionContext.user,
    };
  }

  const verification = await runtime.authAdapter.verifySessionToken(token);

  if (!verification.ok) {
    return undefined;
  }

  return {
    actor: verification.session.actor,
    source: "adapter",
    token,
  };
}

async function issueRepositorySession(
  runtime: ApiRuntime,
  user: AuthUserRecord,
  membership: AuthMembershipRecord,
  metadata: {
    readonly deviceLabel?: string;
    readonly ipAddress?: string;
    readonly userAgent?: string;
  } = {},
): Promise<AuthSessionPayload> {
  const issued = issueSessionToken({
    now: runtime.now(),
    sessionSecret: runtime.sessionSecret,
    ttlMs: runtime.sessionTtlMs,
  });

  await runtime.authRepository.createSession({
    expiresAt: issued.expiresAt,
    issuedAt: issued.issuedAt,
    provider: "password",
    providerSubject: user.id,
    sessionTokenHash: issued.tokenHash,
    userId: user.id,
    ...(metadata.deviceLabel === undefined ? {} : { deviceLabel: metadata.deviceLabel }),
    ...(metadata.ipAddress === undefined ? {} : { ipAddress: metadata.ipAddress }),
    ...(metadata.userAgent === undefined ? {} : { userAgent: metadata.userAgent }),
  });

  return {
    expiresAt: issued.expiresAt.toISOString(),
    sessionToken: issued.token,
    user: createSessionPayload(createActorFromSessionContext(user, membership)),
  };
}

async function recordLoginFailure(
  runtime: ApiRuntime,
  credential: AuthCredentialRecord,
  requestId: string,
  now: Date,
): Promise<void> {
  const failedAttemptCount = credential.failedAttemptCount + 1;
  const lockedUntil =
    failedAttemptCount >= 5 ? new Date(now.getTime() + 15 * 60 * 1000) : undefined;

  await runtime.authRepository.recordCredentialFailure({
    credentialId: credential.id,
    failedAttemptCount,
    updatedAt: now,
    ...(lockedUntil === undefined ? {} : { lockedUntil }),
  });

  const sessionContext = await runtime.authRepository.findUserSessionContextByUserId(
    credential.userId,
  );

  if (sessionContext === undefined) {
    return;
  }

  await runtime.auditSink.append(
    createAuditEvent({
      action: "auth.login_failure",
      metadata: {
        failedAttemptCount,
      },
      requestId,
      scope: sessionContext.membership,
      targetId: credential.id,
      targetType: "auth_credential",
    }),
  );
}

async function authorizeActorForResource(
  context: Context,
  runtime: ApiRuntime,
  actor: SecurityActor,
  action: PermissionAction,
  resource: ScopedResource,
  targetType: string,
): Promise<true | Response> {
  const requestId = readRequestId(context);
  const decision = evaluatePermission(actor, {
    action,
    resource,
  });

  if (decision.allowed) {
    return true;
  }

  await appendSecurityDenyAudit(
    runtime,
    actor,
    requestId,
    resource,
    action,
    targetType,
    decision.reason,
  );

  return context.json(
    createApiErrorEnvelope(
      "not_found_or_forbidden",
      "Recurso nao encontrado ou sem permissao.",
      requestId,
    ),
    decision.safeStatusCode,
  );
}

async function appendSecurityDenyAudit(
  runtime: ApiRuntime,
  actor: SecurityActor,
  requestId: string,
  resource: ScopedResource,
  action: PermissionAction,
  targetType: string,
  reason: string,
): Promise<void> {
  await runtime.auditSink.append(
    createAuditEvent({
      action: "security.deny",
      actor,
      metadata: {
        deniedAction: action,
        reason,
      },
      requestId,
      scope: resource,
      targetType,
    }),
  );
}

function createActorFromSessionContext(
  user: AuthUserRecord,
  membership: AuthMembershipRecord,
): SecurityActor {
  return {
    displayName: user.displayName,
    role: membership.roleCode,
    scope: {
      organizationId: membership.organizationId,
      ...(membership.departmentId === undefined ? {} : { departmentId: membership.departmentId }),
      ...(membership.storeId === undefined ? {} : { storeId: membership.storeId }),
    },
    userId: user.id,
  };
}

function toAccessInvitePayload(
  invite: AccessInviteRecord,
  delivery?: AccessInvitePayload["delivery"],
): AccessInvitePayload {
  return {
    createdAt: invite.createdAt.toISOString(),
    email: invite.email,
    expiresAt: invite.expiresAt.toISOString(),
    id: invite.id,
    resendCount: invite.resendCount,
    role: invite.roleCode,
    scope: {
      organizationId: invite.organizationId,
      ...(invite.departmentId === undefined ? {} : { departmentId: invite.departmentId }),
      ...(invite.storeId === undefined ? {} : { storeId: invite.storeId }),
    },
    status: invite.status,
    updatedAt: invite.updatedAt.toISOString(),
    ...(delivery === undefined ? {} : { delivery }),
    ...(invite.acceptedAt === undefined ? {} : { acceptedAt: invite.acceptedAt.toISOString() }),
    ...(invite.acceptedByUserId === undefined ? {} : { acceptedByUserId: invite.acceptedByUserId }),
    ...(invite.invitedByUserId === undefined ? {} : { invitedByUserId: invite.invitedByUserId }),
    ...(invite.resentAt === undefined ? {} : { resentAt: invite.resentAt.toISOString() }),
    ...(invite.revokedAt === undefined ? {} : { revokedAt: invite.revokedAt.toISOString() }),
    ...(invite.revokedByUserId === undefined ? {} : { revokedByUserId: invite.revokedByUserId }),
  };
}

function canInviteRole(actor: SecurityActor, role: SecurityActor["role"]): boolean {
  if (actor.role === "admin-organizacao") {
    return true;
  }

  if (actor.role === "gerente-loja") {
    return role === "colaborador" || role === "lider-setor";
  }

  return actor.role === "lider-setor" && role === "colaborador";
}

function buildInviteUrl(baseUrl: string, token: string): string {
  const url = new URL(baseUrl);
  url.searchParams.set("convite", token);

  return url.toString();
}

async function handleProtectedRoute<TData>(
  context: Context,
  runtime: ApiRuntime,
  options: ProtectedRouteOptions,
  handler: (actor: SecurityActor, resource: ScopedResource) => Promise<TData> | TData,
): Promise<Response> {
  const authorization = await authorizeProtectedRoute(context, runtime, options);

  if (authorization instanceof Response) {
    return authorization;
  }

  try {
    const data =
      options.profileOperation === undefined
        ? await handler(authorization.actor, authorization.resource)
        : await profileApiOperation(
            {
              actor: authorization.actor,
              logger: runtime.logger,
              metadata: {
                action: options.action,
                path: context.req.path,
                targetType: options.targetType,
              },
              now: runtime.now,
              operation: options.profileOperation,
              requestId: authorization.requestId,
            },
            () => handler(authorization.actor, authorization.resource),
          );

    await appendSuccessfulAudit(
      context,
      runtime,
      options.action,
      authorization.actor,
      authorization.requestId,
      authorization.resource,
      options.targetType,
    );

    return context.json(createApiEnvelope(data, authorization.requestId));
  } catch (error) {
    return handleProtectedRouteError(
      context,
      runtime,
      authorization.requestId,
      authorization.actor,
      error,
    );
  }
}

async function handleMediaUploadContentRoute(
  context: Context,
  runtime: ApiRuntime,
): Promise<Response> {
  const authorization = await authorizeProtectedRoute(context, runtime, {
    action: "media.upload",
    rateLimitKey: "media.upload",
    targetType: "media_upload_intent",
  });

  if (authorization instanceof Response) {
    return authorization;
  }

  try {
    await runtime.mediaService.storeUploadContent(
      requireRouteParam(context, "intentId"),
      authorization.actor,
      {
        body: new Uint8Array(await context.req.raw.arrayBuffer()),
        ...optionalValue("contentType", normalizeContentType(context.req.header("content-type"))),
      },
    );

    await appendSuccessfulAudit(
      context,
      runtime,
      "media.upload",
      authorization.actor,
      authorization.requestId,
      authorization.resource,
      "media_upload_intent",
    );

    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    return handleProtectedRouteError(
      context,
      runtime,
      authorization.requestId,
      authorization.actor,
      error,
    );
  }
}

async function handleMediaReadRoute(context: Context, runtime: ApiRuntime): Promise<Response> {
  const authorization = await authorizeProtectedRoute(context, runtime, {
    action: "media.read",
    targetType: "media_object",
  });

  if (authorization instanceof Response) {
    return authorization;
  }

  try {
    const mediaObject = await runtime.mediaService.readMediaObject(
      requireRouteParam(context, "mediaObjectId"),
      authorization.actor,
    );

    return new Response(mediaObject.body, {
      headers: {
        "cache-control": "private, max-age=60",
        "content-length": String(mediaObject.body.byteLength),
        "content-type": mediaObject.contentType,
      },
      status: 200,
    });
  } catch (error) {
    return handleProtectedRouteError(
      context,
      runtime,
      authorization.requestId,
      authorization.actor,
      error,
    );
  }
}

async function authorizeProtectedRoute(
  context: Context,
  runtime: ApiRuntime,
  options: ProtectedRouteOptions,
): Promise<AuthorizedRouteContext | Response> {
  const requestId = readRequestId(context);
  let actor: SecurityActor | undefined;

  try {
    const verification = await verifyRuntimeSession(context, runtime);

    if (verification === undefined) {
      return context.json(
        createApiErrorEnvelope("unauthorized", "Autenticacao obrigatoria.", requestId),
        401,
      );
    }

    const authorizedActor = verification.actor;
    actor = authorizedActor;
    const resource = options.resource?.(context, authorizedActor) ?? authorizedActor.scope;
    const decision = await profileApiOperation(
      {
        actor: authorizedActor,
        logger: runtime.logger,
        metadata: {
          action: options.action,
          path: context.req.path,
          targetType: options.targetType,
        },
        now: runtime.now,
        operation: "permission.check",
        requestId,
      },
      () =>
        evaluatePermission(authorizedActor, {
          action: options.action,
          resource,
        }),
    );

    if (!decision.allowed) {
      await runtime.auditSink.append(
        createAuditEvent({
          action: "security.deny",
          actor,
          metadata: {
            deniedAction: options.action,
            reason: decision.reason,
          },
          requestId,
          scope: resource,
          targetType: options.targetType,
        }),
      );

      return context.json(
        createApiErrorEnvelope(
          "not_found_or_forbidden",
          "Recurso nao encontrado ou sem permissao.",
          requestId,
        ),
        decision.safeStatusCode,
      );
    }

    if (options.rateLimitKey !== undefined) {
      const rateLimit = runtime.rateLimiter.consume(
        options.rateLimitKey,
        actor.userId,
        runtime.now(),
      );

      if (!rateLimit.allowed) {
        return context.json(
          createApiErrorEnvelope("rate_limited", "Muitas tentativas.", requestId),
          429,
        );
      }
    }

    return {
      actor,
      requestId,
      resource,
    };
  } catch (error) {
    return handleProtectedRouteError(context, runtime, requestId, actor, error);
  }
}

async function appendSuccessfulAudit(
  context: Context,
  runtime: ApiRuntime,
  action: PermissionAction,
  actor: SecurityActor,
  requestId: string,
  resource: ScopedResource,
  targetType: string,
): Promise<void> {
  if (!shouldAuditAction(action)) {
    return;
  }

  await runtime.auditSink.append(
    createAuditEvent({
      action,
      actor,
      metadata: {
        route: context.req.path,
      },
      requestId,
      scope: resource,
      targetType,
    }),
  );
}

function handleProtectedRouteError(
  context: Context,
  runtime: ApiRuntime,
  requestId: string,
  actor: SecurityActor | undefined,
  error: unknown,
): Response {
  runtime.logger(
    createStructuredLogEvent({
      error,
      level: "error",
      message: "API route failed.",
      metadata: {
        path: context.req.path,
      },
      requestId,
      timestamp: runtime.now(),
      ...(actor === undefined ? {} : { actor }),
    }),
  );

  if (isValidationError(error)) {
    return context.json(
      createApiErrorEnvelope("bad_request", "Requisicao invalida.", requestId),
      400,
    );
  }

  if (error instanceof AuthorizationError) {
    return context.json(
      createApiErrorEnvelope(
        "not_found_or_forbidden",
        "Recurso nao encontrado ou sem permissao.",
        requestId,
      ),
      error.decision.safeStatusCode,
    );
  }

  if (error instanceof MediaError) {
    return context.json(
      createApiErrorEnvelope(error.code, error.message, requestId),
      error.status as 400 | 404 | 409 | 410 | 413,
    );
  }

  if (error instanceof Error && error.message.startsWith("Recognition limit reached")) {
    return context.json(
      createApiErrorEnvelope("rate_limited", "Limite de reconhecimento atingido.", requestId),
      429,
    );
  }

  return context.json(
    createApiErrorEnvelope("internal_error", "Nao foi possivel concluir a acao agora.", requestId),
    500,
  );
}

function readRequestId(context: Context): string {
  return context.req.header("x-request-id") ?? "req_development";
}

function readClientIp(context: Context): string {
  return context.req.header("x-forwarded-for") ?? "local";
}

function readSessionMetadata(
  context: Context,
  deviceLabel?: string,
): {
  readonly deviceLabel?: string;
  readonly ipAddress: string;
  readonly userAgent?: string;
} {
  const userAgent = context.req.header("user-agent");

  return {
    ipAddress: readClientIp(context),
    ...(deviceLabel === undefined ? {} : { deviceLabel }),
    ...(userAgent === undefined ? {} : { userAgent }),
  };
}

function readScopedResourceFromQuery(context: Context, actor: SecurityActor): ScopedResource {
  return {
    organizationId: context.req.query("organizationId") ?? actor.scope.organizationId,
    ...optionalValue("departmentId", context.req.query("departmentId") ?? actor.scope.departmentId),
    ...optionalValue("storeId", context.req.query("storeId") ?? actor.scope.storeId),
  };
}

function readOwnScopedResourceFromQuery(context: Context, actor: SecurityActor): ScopedResource {
  return {
    ...readScopedResourceFromQuery(context, actor),
    targetUserId: context.req.query("userId") ?? actor.userId,
  };
}

function toScopedResourceFromPayload(scope: {
  readonly departmentId?: string | undefined;
  readonly organizationId: string;
  readonly storeId?: string | undefined;
}): ScopedResource {
  return {
    organizationId: scope.organizationId,
    ...(scope.departmentId === undefined ? {} : { departmentId: scope.departmentId }),
    ...(scope.storeId === undefined ? {} : { storeId: scope.storeId }),
  };
}

function createSessionPayload(actor: SecurityActor): SessionUserPayload {
  return {
    displayName: actor.displayName ?? displayNameForRole(actor.role),
    id: actor.userId,
    role: actor.role,
    scope: actor.scope,
  };
}

function createApiErrorEnvelope(
  code: string,
  message: string,
  requestId: string,
): ApiErrorEnvelope {
  return {
    error: {
      code,
      message,
    },
    requestId,
  };
}

function displayNameForRole(role: SecurityActor["role"]): string {
  if (role === "admin-organizacao") {
    return "Admin Organizacao";
  }

  if (role === "gerente-loja") {
    return "Gerente de Loja";
  }

  if (role === "lider-setor") {
    return "Lider de Setor";
  }

  if (role === "auditor") {
    return "Auditor";
  }

  return "Colaborador FLV";
}

function toActorContext(actor: SecurityActor) {
  return createActorContext({
    ...(actor.additionalScopes === undefined ? {} : { additionalScopes: actor.additionalScopes }),
    role: actor.role,
    scope: actor.scope,
    userId: actor.userId,
  });
}

function toTenantScope(resource: ScopedResource) {
  return createApplicationTenantScope({
    ...(resource.departmentId === undefined ? {} : { departmentId: resource.departmentId }),
    organizationId: resource.organizationId,
    ...(resource.storeId === undefined ? {} : { storeId: resource.storeId }),
  });
}

function toTenantScopeFromPayload(scope: {
  readonly departmentId?: string | undefined;
  readonly organizationId: string;
  readonly storeId?: string | undefined;
}) {
  return createApplicationTenantScope({
    ...(scope.departmentId === undefined ? {} : { departmentId: scope.departmentId }),
    organizationId: scope.organizationId,
    ...(scope.storeId === undefined ? {} : { storeId: scope.storeId }),
  });
}

function toTargetUserId(resource: ScopedResource, actor: SecurityActor) {
  return createApplicationUserId(resource.targetUserId ?? actor.userId);
}

function compactFeedMissionLinkInput(input: {
  readonly missionId?: string | undefined;
  readonly missionTitle?: string | undefined;
  readonly recognitionCategory?:
    | "quality"
    | "teamwork"
    | "consistency"
    | "learning"
    | "improvement"
    | undefined;
  readonly rewardPoints?: number | undefined;
  readonly routineTitle?: string | undefined;
}) {
  return {
    ...(input.missionId === undefined ? {} : { missionId: input.missionId }),
    ...(input.missionTitle === undefined ? {} : { missionTitle: input.missionTitle }),
    ...(input.recognitionCategory === undefined
      ? {}
      : { recognitionCategory: input.recognitionCategory }),
    ...(input.rewardPoints === undefined ? {} : { rewardPoints: input.rewardPoints }),
    ...(input.routineTitle === undefined ? {} : { routineTitle: input.routineTitle }),
  };
}

function compactEngagementEligibilityInput(input: {
  readonly eligibleUserIds: readonly string[];
  readonly maxEventsPerDay?: number | undefined;
  readonly requiresApprovedFeedPost: boolean;
  readonly requiresOperationalValidation: boolean;
}) {
  return {
    eligibleUserIds: [...input.eligibleUserIds],
    ...(input.maxEventsPerDay === undefined ? {} : { maxEventsPerDay: input.maxEventsPerDay }),
    requiresApprovedFeedPost: input.requiresApprovedFeedPost,
    requiresOperationalValidation: input.requiresOperationalValidation,
  };
}

function compactEngagementRewardInput(input: {
  readonly approvalPolicyCode?: string | undefined;
  readonly badgeCode?: string | undefined;
  readonly description?: string | undefined;
  readonly disclaimer?: string | undefined;
  readonly fulfillmentWindowDays?: number | undefined;
  readonly highlightLabel?: string | undefined;
  readonly note?: string | undefined;
  readonly points?: number | undefined;
  readonly title: string;
  readonly type: "digital" | "manual-company-approved" | "manual-external-informal";
}) {
  return {
    ...(input.approvalPolicyCode === undefined
      ? {}
      : { approvalPolicyCode: input.approvalPolicyCode }),
    ...(input.badgeCode === undefined ? {} : { badgeCode: input.badgeCode }),
    ...(input.description === undefined ? {} : { description: input.description }),
    ...(input.disclaimer === undefined ? {} : { disclaimer: input.disclaimer }),
    ...(input.fulfillmentWindowDays === undefined
      ? {}
      : { fulfillmentWindowDays: input.fulfillmentWindowDays }),
    ...(input.highlightLabel === undefined ? {} : { highlightLabel: input.highlightLabel }),
    ...(input.note === undefined ? {} : { note: input.note }),
    ...(input.points === undefined ? {} : { points: input.points }),
    title: input.title,
    type: input.type,
  };
}

function compactEngagementScoringRuleInput(input: {
  readonly maxEventsPerUser?: number | undefined;
  readonly metricType:
    | "approved-photo-post"
    | "validated-banca-setup"
    | "approved-before-after"
    | "checklist-linked-evidence"
    | "consistency-streak";
  readonly pointsPerEligibleEvent: number;
  readonly requireUniqueSources: boolean;
  readonly tieBreakers: readonly {
    readonly kind: "approved-quality" | "consistency" | "first-to-finish";
    readonly priority: number;
  }[];
}) {
  return {
    ...(input.maxEventsPerUser === undefined ? {} : { maxEventsPerUser: input.maxEventsPerUser }),
    metricType: input.metricType,
    pointsPerEligibleEvent: input.pointsPerEligibleEvent,
    requireUniqueSources: input.requireUniqueSources,
    tieBreakers: [...input.tieBreakers],
  };
}

function compactEngagementSettlementInput(input: {
  readonly mode: "automatic" | "manual-review";
  readonly winnerCount: number;
}) {
  return {
    mode: input.mode,
    winnerCount: input.winnerCount,
  };
}

function isValidationError(error: unknown): boolean {
  return error instanceof Error && error.name === "ZodError";
}

function readPositiveIntegerQuery(context: Context, key: string): number | undefined {
  const value = context.req.query(key);

  if (value === undefined) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isNaN(parsed) || parsed <= 0 ? undefined : parsed;
}

function readDateTimeQuery(context: Context, key: string): Date | undefined {
  const value = context.req.query(key);

  if (value === undefined) {
    return undefined;
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function readDashboardFiltersFromQuery(context: Context): DashboardFilterInput | undefined {
  const startsAt = readDateTimeQuery(context, "startsAt");
  const endsAt = readDateTimeQuery(context, "endsAt");
  const contentType = dashboardContentTypeSchema.safeParse(context.req.query("contentType"));
  const routineCategory = operationRoutineIdSchema.safeParse(context.req.query("routineCategory"));
  const shiftId = context.req.query("shiftId");
  const storeId = context.req.query("storeId");
  const teamMemberId = context.req.query("teamMemberId");
  const filters: DashboardFilterInput = {
    ...(contentType.success ? { contentType: contentType.data } : {}),
    ...(endsAt === undefined ? {} : { endsAt }),
    ...(routineCategory.success ? { routineCategory: routineCategory.data } : {}),
    ...(shiftId === undefined ? {} : { shiftId: toDomainId<"shift">(shiftId) }),
    ...(startsAt === undefined ? {} : { startsAt }),
    ...(storeId === undefined ? {} : { storeId }),
    ...(teamMemberId === undefined ? {} : { teamMemberId: toDomainId<"user">(teamMemberId) }),
  };

  return Object.keys(filters).length === 0 ? undefined : filters;
}

function optionalValue<TKey extends string>(
  key: TKey,
  value: string | undefined,
): Partial<Record<TKey, string>> {
  return value === undefined ? {} : ({ [key]: value } as Record<TKey, string>);
}

function buildAbsoluteRouteUrl(context: Context, path: string): string {
  return new URL(path, context.req.url).toString();
}

function normalizeContentType(value: string | undefined): string | undefined {
  return value === undefined ? undefined : value.split(";")[0]?.trim();
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

type DomainId<TBrand extends string> = string & { readonly __brand: TBrand };

function toDomainId<TBrand extends string>(value: string): DomainId<TBrand> {
  return value as DomainId<TBrand>;
}

function requireRouteParam(context: Context, name: string): string {
  const value = context.req.param(name);

  if (value === undefined || value.length === 0) {
    throw new Error(`Missing required route parameter: ${name}.`);
  }

  return value;
}
