import {
  acknowledgeFeedAnnouncement,
  createScheduleNotification,
  createScheduleRequest,
  createShift,
  createFeedComment,
  createFeedFeedback,
  createFeedPost,
  createFeedReaction,
  createRecognitionEvent,
  createRewardRule,
  buildHealthyRanking,
  createBadgeDefinition,
  decideFeedModeration,
  evaluateBadgeGrants,
  evaluateRecognitionLimit,
  evaluateRewardGrant,
  isFeedPostVisibleToActor,
  selectVisibleFeedPosts,
  summarizeDashboardMetrics,
  updateScheduleRequest,
  updateShift,
  updateFeedPost,
  validateSchedulePlan,
  voteInFeedPoll,
  type AvailabilityPeriod,
  type BadgeAward,
  type BadgeDefinition,
  type CoverageRequirement,
  type ChecklistItemCompletion,
  type ChecklistRun,
  type DomainId,
  type AttentionArea,
  type FeedAnnouncement,
  type FeedContentStatus,
  type FeedComment,
  type FeedFeedback,
  type FeedFeedbackCategory,
  type FeedModerationAction,
  type FeedPoll,
  type FeedPost,
  type FeedReaction,
  type FeedReactionType,
  type FlvRole,
  type MetricSnapshot,
  type OperationLearningBite,
  type OperationIssue,
  type OperationRoutineId,
  type PointsLedgerEntry,
  type RecognitionCategory,
  type RecognitionEvent,
  type RecognitionLimitPolicy,
  type RewardRule,
  type ScheduleNotification,
  type ScheduleNotificationType,
  type ScheduleRequest,
  type ScheduleRequestKind,
  type ScheduleValidationResult,
  type TenantScope,
  type Shift,
  type VisibilityScope,
} from "@engaja/domain";
import {
  assertAuthorized,
  evaluatePermission,
  type AuthorizationRequest,
  type SecurityActor,
} from "@engaja/security";

import { createApplicationUserId, type ActorContext } from "./context.js";
import type {
  FeedRepositoryPort,
  MetricsRepositoryPort,
  OperationsRepositoryPort,
  RecognitionRepositoryPort,
  ScheduleRepositoryPort,
  ScheduleTeamMember,
} from "./ports.js";

export interface FeedReactionSummaryResult {
  readonly count: number;
  readonly label: string;
  readonly selected: boolean;
  readonly type: FeedReactionType;
}

export interface FeedCommentResult {
  readonly authorName: string;
  readonly body: string;
  readonly createdAt: Date;
  readonly id: DomainId<"feed-comment">;
  readonly pendingSync: boolean;
  readonly status: FeedComment["status"];
}

export interface FeedMissionLinkResult {
  readonly missionId?: DomainId<"mission">;
  readonly missionTitle?: string;
  readonly recognitionCategory?: RecognitionCategory;
  readonly recognitionEligible: boolean;
  readonly rewardEligible: boolean;
  readonly rewardPoints?: number;
  readonly routineTitle?: string;
}

export interface FeedTimelinePostResult {
  readonly authorName: string;
  readonly caption: string;
  readonly category: FeedPost["category"];
  readonly comments: readonly FeedCommentResult[];
  readonly createdAt: Date;
  readonly id: DomainId<"feed-post">;
  readonly missionLink?: FeedMissionLinkResult;
  readonly pendingSync: boolean;
  readonly photoUrl?: string;
  readonly publishedAt?: Date;
  readonly reactions: readonly FeedReactionSummaryResult[];
  readonly status: FeedPost["status"];
  readonly title: string;
  readonly visibility: VisibilityScope;
}

export interface FeedAnnouncementResult {
  readonly acknowledged: boolean;
  readonly body: string;
  readonly id: DomainId<"announcement">;
  readonly publishedAt?: Date;
  readonly requiredAcknowledgement: boolean;
  readonly status: FeedAnnouncement["status"];
  readonly title: string;
}

export interface FeedPollOptionResult {
  readonly id: DomainId<"poll-option">;
  readonly label: string;
  readonly voteCount: number;
}

export interface FeedPollResult {
  readonly closesAt?: Date;
  readonly id: DomainId<"poll">;
  readonly options: readonly FeedPollOptionResult[];
  readonly prompt: string;
  readonly status: FeedPoll["status"];
  readonly title: string;
  readonly totalVotes: number;
  readonly viewerVoteOptionId?: DomainId<"poll-option">;
}

export interface FeedFeedbackResult {
  readonly category: FeedFeedback["category"];
  readonly createdAt: Date;
  readonly id: DomainId<"feed-feedback">;
  readonly message: string;
  readonly status: FeedFeedback["status"];
}

export interface FeedHomeResult {
  readonly announcements: readonly FeedAnnouncementResult[];
  readonly feedbackInboxCount: number;
  readonly nextCursor?: string;
  readonly polls: readonly FeedPollResult[];
  readonly posts: readonly FeedTimelinePostResult[];
}

export interface ScheduleSummaryResult {
  readonly nextShiftStartsAt?: Date;
  readonly pendingRequests: number;
  readonly publishedWeek: string;
  readonly todayShiftStatus: "scheduled" | "day-off" | "missing" | "pending-publication";
  readonly validation: ScheduleValidationResult;
}

export interface ScheduleTimelineDayResult {
  readonly emphasis?: "high" | "medium";
  readonly id: string;
  readonly label: string;
  readonly shift: string;
}

export interface ScheduleShiftResult {
  readonly breakMinutes: number;
  readonly endsAt: Date;
  readonly id: DomainId<"shift">;
  readonly role: FlvRole;
  readonly startsAt: Date;
  readonly status: Shift["status"];
  readonly title: string;
  readonly userId: DomainId<"user">;
  readonly userName: string;
}

export interface ScheduleRequestResult {
  readonly counterpartShiftId?: DomainId<"shift">;
  readonly counterpartUserId?: DomainId<"user">;
  readonly counterpartUserName?: string;
  readonly createdAt: Date;
  readonly endsAt: Date;
  readonly id: DomainId<"schedule-request">;
  readonly kind: ScheduleRequestKind;
  readonly note?: string;
  readonly preferredPeriods?: readonly AvailabilityPeriod[];
  readonly requesterUserId: DomainId<"user">;
  readonly requesterUserName: string;
  readonly reviewedAt?: Date;
  readonly reviewedByUserId?: DomainId<"user">;
  readonly shiftId?: DomainId<"shift">;
  readonly status: ScheduleRequest["status"];
  readonly startsAt: Date;
}

export interface ScheduleNotificationResult {
  readonly createdAt: Date;
  readonly id: DomainId<"schedule-notification">;
  readonly message: string;
  readonly requestId?: DomainId<"schedule-request">;
  readonly shiftId?: DomainId<"shift">;
  readonly status: ScheduleNotification["status"];
  readonly type: ScheduleNotificationType;
  readonly userId: DomainId<"user">;
}

export interface ScheduleCoverageAlertResult {
  readonly assignedHeadcount: number;
  readonly id: DomainId<"coverage">;
  readonly label: string;
  readonly periodLabel: string;
  readonly requiredHeadcount: number;
  readonly requiredRole: FlvRole;
  readonly routineResponsibility?: string;
  readonly severity: "critical" | "ok" | "warning";
}

export interface SchedulePlannerIssueResult {
  readonly coverageId?: DomainId<"coverage">;
  readonly kind: "coverage_gap" | "overlapping_shift" | "time_off_conflict";
  readonly message: string;
  readonly requestId?: DomainId<"schedule-request">;
  readonly shiftId?: DomainId<"shift">;
}

export interface ScheduleTeamMemberResult {
  readonly displayName: string;
  readonly role: FlvRole;
  readonly userId: DomainId<"user">;
}

export interface CollaboratorScheduleViewResult {
  readonly breakMinutesToday: number;
  readonly nextShiftStartsAt?: Date;
  readonly notifications: readonly ScheduleNotificationResult[];
  readonly pendingRequestCount: number;
  readonly requests: readonly ScheduleRequestResult[];
  readonly timelineDays: readonly ScheduleTimelineDayResult[];
  readonly todayShift?: ScheduleShiftResult;
  readonly todayShiftStatus: ScheduleSummaryResult["todayShiftStatus"];
  readonly upcomingShifts: readonly ScheduleShiftResult[];
}

export interface LeaderSchedulePlannerResult {
  readonly coverageAlerts: readonly ScheduleCoverageAlertResult[];
  readonly issues: readonly SchedulePlannerIssueResult[];
  readonly notifications: readonly ScheduleNotificationResult[];
  readonly pendingApprovalCount: number;
  readonly requests: readonly ScheduleRequestResult[];
  readonly shifts: readonly ScheduleShiftResult[];
  readonly teamMembers: readonly ScheduleTeamMemberResult[];
  readonly timelineDays: readonly ScheduleTimelineDayResult[];
  readonly weekLabel: string;
}

export interface SchedulePublishResult {
  readonly coverageGapCount: number;
  readonly notificationCount: number;
  readonly publishedCount: number;
  readonly weekLabel: string;
}

export interface OperationsSummaryResult {
  readonly completedRoutineCount: number;
  readonly openIssueCount: number;
  readonly overdueRoutineCount: number;
  readonly pendingSyncCount: number;
}

export interface RecognitionSummaryResult {
  readonly badgeCount: number;
  readonly points: number;
  readonly recentRecognitionCount: number;
}

export interface RecognitionLedgerEntryResult {
  readonly actorUserId?: DomainId<"user">;
  readonly amount: number;
  readonly id: DomainId<"points-ledger">;
  readonly occurredAt: Date;
  readonly reason: string;
  readonly source: PointsLedgerEntry["source"];
  readonly sourceId?: string;
}

export interface RecognitionBadgeResult {
  readonly awardedAt: Date;
  readonly code: string;
  readonly description: string;
  readonly explanation: string;
  readonly id: DomainId<"badge-award">;
  readonly title: string;
}

export interface RecognitionEventResult {
  readonly category: RecognitionCategory;
  readonly categoryLabel: string;
  readonly createdAt: Date;
  readonly id: DomainId<"recognition">;
  readonly message: string;
  readonly pointsAwarded: number;
  readonly recipientUserId: DomainId<"user">;
  readonly senderUserId?: DomainId<"user">;
  readonly sourceFeedPostId?: DomainId<"feed-post">;
}

export interface RecognitionRewardExplanationResult {
  readonly grantedAt: Date;
  readonly points: number;
  readonly reason: string;
  readonly source: PointsLedgerEntry["source"];
  readonly sourceId?: string;
  readonly title: string;
}

export interface CollaboratorRecognitionProfileResult {
  readonly badges: readonly RecognitionBadgeResult[];
  readonly ledger: readonly RecognitionLedgerEntryResult[];
  readonly recognitionHistory: readonly RecognitionEventResult[];
  readonly rewardExplanations: readonly RecognitionRewardExplanationResult[];
  readonly summary: RecognitionSummaryResult;
}

export interface RecognitionRankingEntryResult {
  readonly badgeCount: number;
  readonly displayName: string;
  readonly points: number;
  readonly position: number;
  readonly recognitionCount: number;
  readonly userId: DomainId<"user">;
}

export interface HealthyRecognitionRankingResult {
  readonly entries: readonly RecognitionRankingEntryResult[];
  readonly framing: string;
  readonly teamGoalPoints: number;
  readonly teamProgressPercent: number;
  readonly totalPositivePoints: number;
}

export interface SendRecognitionResult {
  readonly awardedBadges: readonly RecognitionBadgeResult[];
  readonly ledgerEntry?: RecognitionLedgerEntryResult;
  readonly recognition: RecognitionEventResult;
}

export interface DashboardSummaryResult {
  readonly attentionAreaCount: number;
  readonly attentionAreas: readonly DashboardAttentionAreaResult[];
  readonly checklistMonitor: DashboardChecklistMonitorResult;
  readonly contentItems: readonly DashboardContentItemResult[];
  readonly engagementRate: number;
  readonly filters: DashboardFiltersResult;
  readonly memberInsights: readonly DashboardMemberInsightResult[];
  readonly moderationQueue: readonly FeedTimelinePostResult[];
  readonly openModerationCount: number;
  readonly overview: DashboardOverviewResult;
  readonly scheduleConsole: LeaderSchedulePlannerResult;
  readonly scheduleGapCount: number;
}

export type DashboardMetricKey =
  | "engagement"
  | "feed"
  | "issue"
  | "recognition"
  | "routine"
  | "schedule"
  | "team-progress";

export type DashboardContentType =
  | "announcement"
  | "learning_card"
  | "photo_mission"
  | "poll";

export type DashboardAttentionAreaKind =
  | "coverage_gap"
  | "low_engagement"
  | "moderation_queue"
  | "overdue_routine"
  | "repeated_issue";

export interface DashboardMetricResult {
  readonly key: DashboardMetricKey;
  readonly label: string;
  readonly note: string;
  readonly tone: "accent" | "fresh" | "warm";
  readonly value: string;
}

export interface DashboardOverviewResult {
  readonly generatedAt: Date;
  readonly metrics: readonly DashboardMetricResult[];
  readonly teamProgressPercent: number;
}

export interface DashboardFilterOptionResult {
  readonly id: string;
  readonly label: string;
}

export interface DashboardSelectedFiltersResult {
  readonly contentType?: DashboardContentType;
  readonly dateRangeLabel: string;
  readonly endsAt: Date;
  readonly routineCategory?: OperationRoutineId;
  readonly shiftId?: DomainId<"shift">;
  readonly startsAt: Date;
  readonly storeId?: string;
  readonly teamMemberId?: DomainId<"user">;
}

export interface DashboardFiltersResult {
  readonly contentTypes: readonly DashboardFilterOptionResult[];
  readonly routineCategories: readonly DashboardFilterOptionResult[];
  readonly selected: DashboardSelectedFiltersResult;
  readonly shifts: readonly DashboardFilterOptionResult[];
  readonly stores: readonly DashboardFilterOptionResult[];
  readonly teamMembers: readonly DashboardFilterOptionResult[];
}

export interface DashboardContentItemResult {
  readonly id: string;
  readonly metricLabel: string;
  readonly ownerLabel?: string;
  readonly scheduledFor?: Date;
  readonly status: FeedContentStatus;
  readonly title: string;
  readonly type: DashboardContentType;
}

export interface DashboardRoutineMonitorResult {
  readonly completedCount: number;
  readonly id: OperationRoutineId;
  readonly label: string;
  readonly overdueCount: number;
  readonly totalCount: number;
}

export interface DashboardChecklistMonitorResult {
  readonly completedCount: number;
  readonly completionRate: number;
  readonly overdueCount: number;
  readonly requiredEvidenceMissingCount: number;
  readonly routines: readonly DashboardRoutineMonitorResult[];
  readonly totalCount: number;
  readonly unresolvedIssueCount: number;
}

export interface DashboardMemberInsightResult {
  readonly completedActionCount: number;
  readonly displayName: string;
  readonly engagementCount: number;
  readonly points: number;
  readonly recognitionCount: number;
  readonly role: FlvRole;
  readonly scaleLabel: string;
  readonly userId: DomainId<"user">;
}

export interface DashboardAttentionAreaResult {
  readonly createdAt: Date;
  readonly description: string;
  readonly id: string;
  readonly kind: DashboardAttentionAreaKind;
  readonly severity: "critical" | "info" | "warning";
  readonly sourceCount: number;
  readonly title: string;
}

export interface DashboardFilterInput {
  readonly contentType?: DashboardContentType;
  readonly endsAt?: Date;
  readonly routineCategory?: OperationRoutineId;
  readonly shiftId?: DomainId<"shift">;
  readonly startsAt?: Date;
  readonly storeId?: string;
  readonly teamMemberId?: DomainId<"user">;
}

const reactionLabels: Readonly<Record<FeedReactionType, string>> = {
  aplauso: "Aplauso",
  duvida: "Duvida",
  inspirador: "Inspirador",
  like: "Curtir",
};

const recognitionCategoryLabels: Readonly<Record<RecognitionCategory, string>> = {
  consistency: "Consistencia",
  improvement: "Melhoria",
  learning: "Aprendizado",
  quality: "Qualidade",
  teamwork: "Trabalho em equipe",
};

const defaultRecognitionLimitPolicy: RecognitionLimitPolicy = {
  maxReceivedFromSameActorPerWindow: 2,
  maxSentPerActorWindow: 8,
  peerRecognitionEnabled: true,
  windowDays: 7,
};

const defaultRecognitionRewardRule = createRewardRule({
  code: "recognition-meaningful",
  maxAwardsPerWindow: 8,
  points: 20,
  reason: "Reconhecimento significativo enviado pela equipe",
  source: "recognition",
  windowDays: 7,
});

const defaultBadgeDefinitions: readonly BadgeDefinition[] = [
  createBadgeDefinition({
    code: "consistencia-flv",
    criteria: {
      minimumSourceCount: 3,
      source: "routine_completion",
      type: "ledger_source_count",
    },
    description: "Mantem rotinas completas com constancia durante o ciclo.",
    family: "consistency",
    title: "Consistencia FLV",
  }),
  createBadgeDefinition({
    code: "qualidade-premium",
    criteria: {
      category: "quality",
      minimumRecognitionCount: 2,
      type: "recognition_count",
    },
    description: "Recebe reconhecimentos por cuidado visual e frescor.",
    family: "quality",
    title: "Qualidade premium",
  }),
  createBadgeDefinition({
    code: "time-que-resolve",
    criteria: {
      category: "teamwork",
      minimumRecognitionCount: 2,
      type: "recognition_count",
    },
    description: "Ajuda a equipe a proteger pico, reposicao e passagem de turno.",
    family: "teamwork",
    title: "Time que resolve",
  }),
  createBadgeDefinition({
    code: "aprendizado-em-dia",
    criteria: {
      minimumSourceCount: 2,
      source: "learning",
      type: "ledger_source_count",
    },
    description: "Conclui cards de aprendizagem conectados a padroes reais.",
    family: "learning",
    title: "Aprendizado em dia",
  }),
  createBadgeDefinition({
    code: "participacao-foto",
    criteria: {
      minimumSourceCount: 2,
      source: "feed_post",
      type: "ledger_source_count",
    },
    description: "Transforma registros visuais aprovados em progresso transparente.",
    family: "feed_participation",
    title: "Participacao com foto",
  }),
  createBadgeDefinition({
    code: "melhoria-continua",
    criteria: {
      category: "improvement",
      minimumRecognitionCount: 1,
      type: "recognition_count",
    },
    description: "Converte ideias e pequenos ajustes em melhoria visivel.",
    family: "improvement",
    title: "Melhoria continua",
  }),
];

export async function listFeedTimeline(input: {
  readonly actor: ActorContext;
  readonly feedRepository: FeedRepositoryPort;
  readonly limit?: number;
  readonly scope: TenantScope;
}): Promise<readonly FeedPost[]> {
  assertUseCaseAuthorized(input.actor, {
    action: "feed.read",
    resource: input.scope,
  });

  const posts = await input.feedRepository.listPosts(input.scope);
  const visiblePosts = selectVisibleFeedPosts(posts, input.actor);

  return visiblePosts.slice(0, input.limit ?? visiblePosts.length);
}

export async function getFeedHome(input: {
  readonly actor: ActorContext;
  readonly cursor?: string | undefined;
  readonly feedRepository: FeedRepositoryPort;
  readonly limit?: number | undefined;
  readonly scope: TenantScope;
}): Promise<FeedHomeResult> {
  assertUseCaseAuthorized(input.actor, {
    action: "feed.read",
    resource: input.scope,
  });

  const [posts, announcements, polls, feedback] = await Promise.all([
    input.feedRepository.listPosts(input.scope),
    input.feedRepository.listAnnouncements(input.scope),
    input.feedRepository.listPolls(input.scope),
    input.feedRepository.listFeedback(input.scope),
  ]);
  const visiblePosts = selectVisibleFeedPosts(posts, input.actor);
  const limit = input.limit ?? 6;
  const offset = parseCursor(input.cursor);
  const pagePosts = visiblePosts.slice(offset, offset + limit);
  const nextOffset = offset + pagePosts.length;
  const nextCursor = nextOffset < visiblePosts.length ? String(nextOffset) : undefined;

  return {
    announcements: announcements
      .filter((announcement) => announcement.status === "active")
      .sort(sortByMostRecentDate((announcement) => announcement.publishedAt ?? announcement.createdAt))
      .map((announcement) => toFeedAnnouncementResult(announcement, input.actor.userId)),
    feedbackInboxCount: feedback.filter((item) => item.status !== "resolved").length,
    ...(nextCursor === undefined ? {} : { nextCursor }),
    polls: polls
      .filter((poll) => poll.status === "active")
      .sort(sortByMostRecentDate((poll) => poll.createdAt))
      .map((poll) => toFeedPollResult(poll, input.actor.userId)),
    posts: await Promise.all(
      pagePosts.map((post) => hydrateFeedPost(post, input.actor, input.feedRepository)),
    ),
  };
}

export async function getFeedPostDetail(input: {
  readonly actor: ActorContext;
  readonly feedRepository: FeedRepositoryPort;
  readonly postId: DomainId<"feed-post">;
}): Promise<FeedTimelinePostResult> {
  const post = await input.feedRepository.findPostById(input.postId);

  if (post === undefined) {
    throw new Error("Feed post not found.");
  }

  assertUseCaseAuthorized(input.actor, {
    action: "feed.read",
    resource: post.scope,
  });
  assertFeedPostVisible(post, input.actor);

  return hydrateFeedPost(post, input.actor, input.feedRepository);
}

export async function createFeedTimelinePost(input: {
  readonly actor: ActorContext;
  readonly authorName: string;
  readonly caption: string;
  readonly category: FeedPost["category"];
  readonly feedRepository: FeedRepositoryPort;
  readonly missionLink?: {
    readonly missionId?: string | undefined;
    readonly missionTitle?: string | undefined;
    readonly recognitionCategory?: RecognitionCategory | undefined;
    readonly rewardPoints?: number | undefined;
    readonly routineTitle?: string | undefined;
  };
  readonly now?: Date;
  readonly pendingSync?: boolean;
  readonly photoUrl?: string;
  readonly scope: TenantScope;
  readonly title: string;
  readonly visibility: VisibilityScope;
}): Promise<FeedTimelinePostResult> {
  assertUseCaseAuthorized(input.actor, {
    action: "feed.create",
    resource: input.scope,
  });

  const now = input.now ?? new Date();
  const draftPost = createFeedPost({
    authorName: input.authorName,
    authorUserId: input.actor.userId,
    caption: input.caption,
    category: input.category,
    createdAt: now,
    id: createPostId(input.actor.userId, now),
    ...(input.missionLink === undefined ? {} : { missionLink: input.missionLink }),
    ...(input.pendingSync === true ? { pendingSync: true } : {}),
    ...(input.photoUrl === undefined ? {} : { photoUrl: input.photoUrl }),
    scope: input.scope,
    status: "draft",
    title: input.title,
    updatedAt: now,
    visibility: input.visibility,
  });
  const decision = decideFeedModeration(draftPost, input.actor, "submit", now);

  if (!decision.allowed || decision.nextPost === undefined) {
    throw new Error(`Feed moderation failed: ${decision.reason}.`);
  }

  const savedPost = await input.feedRepository.savePost(decision.nextPost);

  return hydrateFeedPost(savedPost, input.actor, input.feedRepository);
}

export async function updateFeedPostVisibility(input: {
  readonly actor: ActorContext;
  readonly feedRepository: FeedRepositoryPort;
  readonly now?: Date;
  readonly postId: DomainId<"feed-post">;
  readonly visibility: VisibilityScope;
}): Promise<FeedTimelinePostResult> {
  const post = await requirePost(input.feedRepository, input.postId);

  assertFeedPostMutationAllowed(input.actor, post);

  const savedPost = await input.feedRepository.savePost(
    updateFeedPost(post, {
      updatedAt: input.now ?? new Date(),
      visibility: input.visibility,
    }),
  );

  return hydrateFeedPost(savedPost, input.actor, input.feedRepository);
}

export async function deleteFeedTimelinePost(input: {
  readonly actor: ActorContext;
  readonly feedRepository: FeedRepositoryPort;
  readonly now?: Date;
  readonly postId: DomainId<"feed-post">;
}): Promise<FeedTimelinePostResult> {
  const post = await requirePost(input.feedRepository, input.postId);

  assertFeedPostMutationAllowed(input.actor, post);

  const savedPost = await input.feedRepository.savePost(
    updateFeedPost(post, {
      status: "removed",
      updatedAt: input.now ?? new Date(),
    }),
  );

  return hydrateFeedPost(savedPost, input.actor, input.feedRepository);
}

export async function reactToFeedTimelinePost(input: {
  readonly actor: ActorContext;
  readonly feedRepository: FeedRepositoryPort;
  readonly now?: Date;
  readonly postId: DomainId<"feed-post">;
  readonly reactionType: FeedReactionType;
}): Promise<FeedTimelinePostResult> {
  const post = await requirePost(input.feedRepository, input.postId);

  assertUseCaseAuthorized(input.actor, {
    action: "feed.react",
    resource: post.scope,
  });
  assertFeedPostVisible(post, input.actor);

  const existingReactions = await input.feedRepository.listReactions(post.id);
  const existingReaction = existingReactions.find((reaction) => reaction.userId === input.actor.userId);

  if (existingReaction?.type === input.reactionType) {
    await input.feedRepository.deleteReaction(post.id, input.actor.userId);
  } else {
    if (existingReaction !== undefined) {
      await input.feedRepository.deleteReaction(post.id, input.actor.userId);
    }

    await input.feedRepository.saveReaction(
      createFeedReaction({
        createdAt: input.now ?? new Date(),
        id: existingReaction?.id ?? createReactionId(post.id, input.actor.userId),
        postId: post.id,
        scope: post.scope,
        type: input.reactionType,
        userId: input.actor.userId,
      }),
    );
  }

  return hydrateFeedPost(post, input.actor, input.feedRepository);
}

export async function addFeedTimelineComment(input: {
  readonly actor: ActorContext;
  readonly authorName: string;
  readonly body: string;
  readonly feedRepository: FeedRepositoryPort;
  readonly now?: Date;
  readonly pendingSync?: boolean;
  readonly postId: DomainId<"feed-post">;
}): Promise<FeedTimelinePostResult> {
  const post = await requirePost(input.feedRepository, input.postId);

  assertUseCaseAuthorized(input.actor, {
    action: "feed.comment",
    resource: post.scope,
  });
  assertFeedPostVisible(post, input.actor);

  await input.feedRepository.saveComment(
    createFeedComment({
      authorName: input.authorName,
      authorUserId: input.actor.userId,
      body: input.body,
      createdAt: input.now ?? new Date(),
      id: createCommentId(post.id, input.actor.userId, input.now ?? new Date()),
      ...(input.pendingSync === true ? { pendingSync: true } : {}),
      postId: post.id,
      scope: post.scope,
      status: canModerateFeedScope(input.actor, post.scope) ? "visible" : "pending",
      updatedAt: input.now ?? new Date(),
    }),
  );

  return hydrateFeedPost(post, input.actor, input.feedRepository);
}

export async function moderateFeedPost(input: {
  readonly action: FeedModerationAction;
  readonly actor: ActorContext;
  readonly feedRepository: FeedRepositoryPort;
  readonly now?: Date;
  readonly postId: DomainId<"feed-post">;
}): Promise<FeedPost> {
  const post = await requirePost(input.feedRepository, input.postId);

  assertUseCaseAuthorized(input.actor, {
    action: "feed.moderate",
    resource: post.scope,
  });

  const decision = decideFeedModeration(post, input.actor, input.action, input.now ?? new Date());

  if (!decision.allowed || decision.nextPost === undefined) {
    throw new Error(`Feed moderation failed: ${decision.reason}.`);
  }

  return input.feedRepository.savePost(decision.nextPost);
}

export async function acknowledgeFeedAnnouncementUseCase(input: {
  readonly actor: ActorContext;
  readonly announcementId: DomainId<"announcement">;
  readonly feedRepository: FeedRepositoryPort;
}): Promise<FeedAnnouncementResult> {
  const announcement = await input.feedRepository.findAnnouncementById(input.announcementId);

  if (announcement === undefined) {
    throw new Error("Announcement not found.");
  }

  assertUseCaseAuthorized(input.actor, {
    action: "feed.read",
    resource: announcement.scope,
  });

  const savedAnnouncement = await input.feedRepository.saveAnnouncement(
    acknowledgeFeedAnnouncement(announcement, input.actor.userId),
  );

  return toFeedAnnouncementResult(savedAnnouncement, input.actor.userId);
}

export async function voteInFeedPollUseCase(input: {
  readonly actor: ActorContext;
  readonly feedRepository: FeedRepositoryPort;
  readonly now?: Date;
  readonly optionId: DomainId<"poll-option">;
  readonly pollId: DomainId<"poll">;
}): Promise<FeedPollResult> {
  const poll = await input.feedRepository.findPollById(input.pollId);

  if (poll === undefined) {
    throw new Error("Poll not found.");
  }

  assertUseCaseAuthorized(input.actor, {
    action: "feed.read",
    resource: poll.scope,
  });

  const savedPoll = await input.feedRepository.savePoll(
    voteInFeedPoll(poll, {
      createdAt: input.now ?? new Date(),
      id: createPollVoteId(poll.id, input.actor.userId),
      optionId: input.optionId,
      userId: input.actor.userId,
    }),
  );

  return toFeedPollResult(savedPoll, input.actor.userId);
}

export async function submitPrivateFeedFeedback(input: {
  readonly actor: ActorContext;
  readonly category: FeedFeedbackCategory;
  readonly feedRepository: FeedRepositoryPort;
  readonly message: string;
  readonly now?: Date;
  readonly scope: TenantScope;
}): Promise<FeedFeedbackResult> {
  assertUseCaseAuthorized(input.actor, {
    action: "feed.feedback.create",
    resource: {
      ...input.scope,
      targetUserId: input.actor.userId,
    },
  });

  const feedback = await input.feedRepository.saveFeedback(
    createFeedFeedback({
      authorUserId: input.actor.userId,
      category: input.category,
      createdAt: input.now ?? new Date(),
      id: createFeedbackId(input.actor.userId, input.now ?? new Date()),
      message: input.message,
      scope: input.scope,
    }),
  );

  return {
    category: feedback.category,
    createdAt: feedback.createdAt,
    id: feedback.id,
    message: feedback.message,
    status: feedback.status,
  };
}

export async function summarizeSchedule(input: {
  readonly actor: ActorContext;
  readonly now?: Date;
  readonly scheduleRepository: ScheduleRepositoryPort;
  readonly scope: TenantScope;
  readonly targetUserId: DomainId<"user">;
}): Promise<ScheduleSummaryResult> {
  assertUseCaseAuthorized(input.actor, {
    action: "schedule.read",
    resource: {
      ...input.scope,
      targetUserId: input.targetUserId,
    },
  });

  const now = input.now ?? new Date();
  const userShifts = await input.scheduleRepository.listShiftsForUser(input.targetUserId, input.scope);
  const scopeShifts = await input.scheduleRepository.listShifts(input.scope);
  const coverageRequirements = await input.scheduleRepository.listCoverageRequirements(input.scope);
  const validation = validateSchedulePlan(scopeShifts, coverageRequirements);
  const pendingRequests = await input.scheduleRepository.countPendingRequestsForUser(
    input.targetUserId,
    input.scope,
  );
  const nextShift = [...userShifts]
    .filter((shift) => shift.endsAt.getTime() >= now.getTime())
    .sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime())[0];
  const todayShift = userShifts.find((shift) => isSameUtcDate(shift.startsAt, now));

  return {
    ...(nextShift === undefined ? {} : { nextShiftStartsAt: nextShift.startsAt }),
    pendingRequests,
    publishedWeek: isoWeekFromDate(nextShift?.startsAt ?? now),
    todayShiftStatus:
      todayShift === undefined
        ? "day-off"
        : todayShift.status === "draft"
          ? "pending-publication"
          : "scheduled",
    validation,
  };
}

export async function validateScheduleScope(input: {
  readonly actor: ActorContext;
  readonly scheduleRepository: ScheduleRepositoryPort;
  readonly scope: TenantScope;
}): Promise<ScheduleValidationResult> {
  assertUseCaseAuthorized(input.actor, {
    action: "schedule.publish",
    resource: input.scope,
  });

  const shifts = await input.scheduleRepository.listShifts(input.scope);
  const coverageRequirements = await input.scheduleRepository.listCoverageRequirements(input.scope);

  return validateSchedulePlan(shifts, coverageRequirements);
}

export async function getCollaboratorScheduleView(input: {
  readonly actor: ActorContext;
  readonly now?: Date;
  readonly scheduleRepository: ScheduleRepositoryPort;
  readonly scope: TenantScope;
  readonly targetUserId: DomainId<"user">;
}): Promise<CollaboratorScheduleViewResult> {
  assertUseCaseAuthorized(input.actor, {
    action: "schedule.read",
    resource: {
      ...input.scope,
      targetUserId: input.targetUserId,
    },
  });

  const now = input.now ?? new Date();
  const [notifications, requests, teamMembers, userShifts] = await Promise.all([
    input.scheduleRepository.listNotificationsForUser(input.targetUserId, input.scope),
    input.scheduleRepository.listRequestsForUser(input.targetUserId, input.scope),
    input.scheduleRepository.listTeamMembers(input.scope),
    input.scheduleRepository.listShiftsForUser(input.targetUserId, input.scope),
  ]);
  const memberLookup = createScheduleMemberLookup(teamMembers);
  const orderedShifts = [...userShifts].sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime());
  const nextShift = orderedShifts.find((shift) => shift.endsAt.getTime() >= now.getTime());
  const todayShift = orderedShifts.find((shift) => isSameUtcDate(shift.startsAt, now));

  return {
    breakMinutesToday: todayShift?.breakMinutes ?? 0,
    ...(nextShift === undefined ? {} : { nextShiftStartsAt: nextShift.startsAt }),
    notifications: [...notifications]
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .slice(0, 5)
      .map((notification) => toScheduleNotificationResult(notification)),
    pendingRequestCount: requests.filter((request) => isPendingScheduleRequestStatus(request.status)).length,
    requests: [...requests]
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .map((request) => toScheduleRequestResult(request, memberLookup)),
    timelineDays: buildCollaboratorScheduleTimeline(orderedShifts, now),
    ...(todayShift === undefined ? {} : { todayShift: toScheduleShiftResult(todayShift, memberLookup) }),
    todayShiftStatus:
      todayShift === undefined
        ? "day-off"
        : todayShift.status === "draft"
          ? "pending-publication"
          : "scheduled",
    upcomingShifts: orderedShifts
      .filter((shift) => shift.endsAt.getTime() >= now.getTime())
      .slice(0, 4)
      .map((shift) => toScheduleShiftResult(shift, memberLookup)),
  };
}

export async function getLeaderSchedulePlanner(input: {
  readonly actor: ActorContext;
  readonly now?: Date;
  readonly scheduleRepository: ScheduleRepositoryPort;
  readonly scope: TenantScope;
  readonly weekStart?: Date;
}): Promise<LeaderSchedulePlannerResult> {
  assertUseCaseAuthorized(input.actor, {
    action: "schedule.read",
    resource: input.scope,
  });

  const now = input.now ?? new Date();
  const weekStart = startOfIsoWeek(input.weekStart ?? now);
  const weekEnd = addUtcDays(weekStart, 7);
  const [coverageRequirements, notifications, requests, shifts, teamMembers] = await Promise.all([
    input.scheduleRepository.listCoverageRequirements(input.scope),
    input.scheduleRepository.listNotifications(input.scope),
    input.scheduleRepository.listRequests(input.scope),
    input.scheduleRepository.listShifts(input.scope),
    input.scheduleRepository.listTeamMembers(input.scope),
  ]);
  const memberLookup = createScheduleMemberLookup(teamMembers);
  const shiftsInWeek = shifts
    .filter((shift) => timeWindowTouchesRange(shift.startsAt, shift.endsAt, weekStart, weekEnd))
    .sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime());
  const coverageInWeek = coverageRequirements.filter((coverageRequirement) =>
    timeWindowTouchesRange(
      coverageRequirement.startsAt,
      coverageRequirement.endsAt,
      weekStart,
      weekEnd,
    ),
  );
  const validation = validateSchedulePlan(shiftsInWeek, coverageInWeek);
  const coverageAlerts = buildCoverageAlerts(shiftsInWeek, coverageInWeek);
  const issues = [
    ...validation.issues.map((issue) => toSchedulePlannerIssue(issue)),
    ...buildTimeOffConflictIssues(shiftsInWeek, requests),
  ];

  return {
    coverageAlerts,
    issues,
    notifications: [...notifications]
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .slice(0, 6)
      .map((notification) => toScheduleNotificationResult(notification)),
    pendingApprovalCount: requests.filter((request) => isPendingScheduleRequestStatus(request.status)).length,
    requests: [...requests]
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .map((request) => toScheduleRequestResult(request, memberLookup)),
    shifts: shiftsInWeek.map((shift) => toScheduleShiftResult(shift, memberLookup)),
    teamMembers: teamMembers
      .map((member) => ({
        displayName: member.displayName,
        role: member.role,
        userId: member.userId,
      }))
      .sort((left, right) => left.displayName.localeCompare(right.displayName, "pt-BR")),
    timelineDays: buildLeaderScheduleTimeline(shiftsInWeek, coverageAlerts, weekStart),
    weekLabel: formatWeekLabel(weekStart),
  };
}

export async function upsertScheduleShift(input: {
  readonly actor: ActorContext;
  readonly breakMinutes: number;
  readonly endsAt: Date;
  readonly now?: Date;
  readonly role: FlvRole;
  readonly scheduleRepository: ScheduleRepositoryPort;
  readonly scope: TenantScope;
  readonly shiftId?: DomainId<"shift">;
  readonly startsAt: Date;
  readonly title: string;
  readonly userId: DomainId<"user">;
}): Promise<ScheduleShiftResult> {
  assertUseCaseAuthorized(input.actor, {
    action: "schedule.change",
    resource: input.scope,
  });

  const existingShift =
    input.shiftId === undefined ? undefined : await input.scheduleRepository.findShiftById(input.shiftId);
  const now = input.now ?? new Date();
  const nextShift =
    existingShift === undefined
      ? createTemporaryDraftShift({
          actorUserId: input.actor.userId,
          breakMinutes: input.breakMinutes,
          endsAt: input.endsAt,
          now,
          role: input.role,
          scope: input.scope,
          startsAt: input.startsAt,
          title: input.title,
          userId: input.userId,
        })
      : updateShift(existingShift, {
          breakMinutes: input.breakMinutes,
          endsAt: input.endsAt,
          role: input.role,
          scope: input.scope,
          startsAt: input.startsAt,
          title: input.title,
          userId: input.userId,
        });
  const savedShift = await input.scheduleRepository.saveShift(nextShift);
  const teamMembers = await input.scheduleRepository.listTeamMembers(input.scope);
  const memberLookup = createScheduleMemberLookup(teamMembers);

  if (existingShift !== undefined && existingShift.status === "published" && hasShiftChanged(existingShift, savedShift)) {
    const affectedUserIds = new Set([existingShift.userId, savedShift.userId]);

    await Promise.all(
      [...affectedUserIds].map((userId) =>
        input.scheduleRepository.saveNotification(
          createScheduleNotification({
            createdAt: now,
            id: createScheduleNotificationId("schedule_changed", userId, savedShift.id, now),
            message: `Seu turno ${formatShiftTimeRange(savedShift)} foi atualizado pela lideranca.`,
            scope: savedShift.scope,
            shiftId: savedShift.id,
            status: "sent",
            type: "schedule_changed",
            userId,
          }),
        ),
      ),
    );
  }

  return toScheduleShiftResult(savedShift, memberLookup);
}

export async function publishSchedule(input: {
  readonly actor: ActorContext;
  readonly now?: Date;
  readonly scheduleRepository: ScheduleRepositoryPort;
  readonly scope: TenantScope;
  readonly shiftIds?: readonly DomainId<"shift">[];
}): Promise<SchedulePublishResult> {
  assertUseCaseAuthorized(input.actor, {
    action: "schedule.publish",
    resource: input.scope,
  });

  const now = input.now ?? new Date();
  const targetIds =
    input.shiftIds === undefined ? undefined : new Set<string>(input.shiftIds.map((shiftId) => String(shiftId)));
  const shifts = await input.scheduleRepository.listShifts(input.scope);
  const shiftsToPublish = shifts.filter(
    (shift) => shift.status === "draft" && (targetIds === undefined || targetIds.has(shift.id)),
  );
  const publishedShifts = await Promise.all(
    shiftsToPublish.map((shift) =>
      input.scheduleRepository.saveShift(
        updateShift(shift, {
          publishedAt: now,
          status: "published",
        }),
      ),
    ),
  );
  const notifications = publishedShifts.map((shift) =>
    createScheduleNotification({
      createdAt: now,
      id: createScheduleNotificationId("schedule_published", shift.userId, shift.id, now),
      message: `Sua escala ${formatShiftTimeRange(shift)} foi publicada.`,
      scope: shift.scope,
      shiftId: shift.id,
      status: "sent",
      type: "schedule_published",
      userId: shift.userId,
    }),
  );

  await Promise.all(notifications.map((notification) => input.scheduleRepository.saveNotification(notification)));

  const coverageRequirements = await input.scheduleRepository.listCoverageRequirements(input.scope);
  const validation = validateSchedulePlan(
    await input.scheduleRepository.listShifts(input.scope),
    coverageRequirements,
  );

  return {
    coverageGapCount: validation.coverageGapCount,
    notificationCount: notifications.length,
    publishedCount: publishedShifts.length,
    weekLabel: formatWeekLabel(startOfIsoWeek(now)),
  };
}

export async function submitAvailabilityRequest(input: {
  readonly actor: ActorContext;
  readonly endsAt: Date;
  readonly note?: string;
  readonly now?: Date;
  readonly preferredPeriods: readonly AvailabilityPeriod[];
  readonly scheduleRepository: ScheduleRepositoryPort;
  readonly scope: TenantScope;
  readonly startsAt: Date;
}): Promise<ScheduleRequestResult> {
  assertUseCaseAuthorized(input.actor, {
    action: "schedule.request.create",
    resource: {
      ...input.scope,
      targetUserId: input.actor.userId,
    },
  });

  const now = input.now ?? new Date();
  const request = await input.scheduleRepository.saveRequest(
    createScheduleRequest({
      createdAt: now,
      endsAt: input.endsAt,
      id: createScheduleRequestId("availability", input.actor.userId, now),
      kind: "availability",
      ...(input.note === undefined ? {} : { note: input.note }),
      preferredPeriods: input.preferredPeriods,
      requesterUserId: input.actor.userId,
      scope: input.scope,
      startsAt: input.startsAt,
      status: "pending",
    }),
  );
  const teamMembers = await input.scheduleRepository.listTeamMembers(input.scope);
  const reviewRecipients = selectScheduleReviewRecipients(teamMembers, input.actor.userId);

  await Promise.all(
    reviewRecipients.map((recipient) =>
      input.scheduleRepository.saveNotification(
        createScheduleNotification({
          createdAt: now,
          id: createScheduleNotificationId("availability_submitted", recipient.userId, request.id, now),
          message: `${memberNameForUserId(teamMembers, input.actor.userId)} enviou disponibilidade para revisao.`,
          requestId: request.id,
          scope: input.scope,
          status: "sent",
          type: "availability_submitted",
          userId: recipient.userId,
        }),
      ),
    ),
  );

  return toScheduleRequestResult(request, createScheduleMemberLookup(teamMembers));
}

export async function submitTimeOffRequest(input: {
  readonly actor: ActorContext;
  readonly endsAt: Date;
  readonly now?: Date;
  readonly reason: string;
  readonly scheduleRepository: ScheduleRepositoryPort;
  readonly scope: TenantScope;
  readonly startsAt: Date;
}): Promise<ScheduleRequestResult> {
  assertUseCaseAuthorized(input.actor, {
    action: "schedule.request.create",
    resource: {
      ...input.scope,
      targetUserId: input.actor.userId,
    },
  });

  const now = input.now ?? new Date();
  const request = await input.scheduleRepository.saveRequest(
    createScheduleRequest({
      createdAt: now,
      endsAt: input.endsAt,
      id: createScheduleRequestId("time_off", input.actor.userId, now),
      kind: "time_off",
      note: input.reason,
      requesterUserId: input.actor.userId,
      scope: input.scope,
      startsAt: input.startsAt,
      status: "pending",
    }),
  );
  const teamMembers = await input.scheduleRepository.listTeamMembers(input.scope);
  const reviewRecipients = selectScheduleReviewRecipients(teamMembers, input.actor.userId);

  await Promise.all(
    reviewRecipients.map((recipient) =>
      input.scheduleRepository.saveNotification(
        createScheduleNotification({
          createdAt: now,
          id: createScheduleNotificationId("time_off_submitted", recipient.userId, request.id, now),
          message: `${memberNameForUserId(teamMembers, input.actor.userId)} solicitou folga para revisao.`,
          requestId: request.id,
          scope: input.scope,
          status: "sent",
          type: "time_off_submitted",
          userId: recipient.userId,
        }),
      ),
    ),
  );

  return toScheduleRequestResult(request, createScheduleMemberLookup(teamMembers));
}

export async function reviewScheduleRequest(input: {
  readonly actor: ActorContext;
  readonly decision: "approve" | "reject";
  readonly now?: Date;
  readonly requestId: DomainId<"schedule-request">;
  readonly scheduleRepository: ScheduleRepositoryPort;
}): Promise<ScheduleRequestResult> {
  const request = await requireScheduleRequest(input.scheduleRepository, input.requestId);

  if (request.kind === "swap") {
    throw new Error("Swap requests must be approved through the swap workflow.");
  }

  assertUseCaseAuthorized(input.actor, {
    action: "schedule.request.review",
    resource: request.scope,
  });

  const now = input.now ?? new Date();
  const updatedRequest = await input.scheduleRepository.saveRequest(
    updateScheduleRequest(request, {
      reviewedAt: now,
      reviewedByUserId: input.actor.userId,
      status: input.decision === "approve" ? "approved" : "rejected",
    }),
  );
  const teamMembers = await input.scheduleRepository.listTeamMembers(request.scope);

  await input.scheduleRepository.saveNotification(
    createScheduleNotification({
      createdAt: now,
      id: createScheduleNotificationId(
        request.kind === "availability" ? "availability_reviewed" : "time_off_reviewed",
        request.requesterUserId,
        request.id,
        now,
      ),
      message:
        input.decision === "approve"
          ? request.kind === "availability"
            ? "Sua disponibilidade foi aprovada."
            : "Seu pedido de folga foi aprovado."
          : request.kind === "availability"
            ? "Sua disponibilidade foi rejeitada."
            : "Seu pedido de folga foi rejeitado.",
      requestId: updatedRequest.id,
      scope: request.scope,
      status: "sent",
      type: request.kind === "availability" ? "availability_reviewed" : "time_off_reviewed",
      userId: request.requesterUserId,
    }),
  );

  return toScheduleRequestResult(updatedRequest, createScheduleMemberLookup(teamMembers));
}

export async function proposeShiftSwap(input: {
  readonly actor: ActorContext;
  readonly note?: string;
  readonly now?: Date;
  readonly scheduleRepository: ScheduleRepositoryPort;
  readonly scope: TenantScope;
  readonly sourceShiftId: DomainId<"shift">;
  readonly targetShiftId: DomainId<"shift">;
  readonly targetUserId: DomainId<"user">;
}): Promise<ScheduleRequestResult> {
  assertUseCaseAuthorized(input.actor, {
    action: "schedule.request.create",
    resource: {
      ...input.scope,
      targetUserId: input.actor.userId,
    },
  });

  const [sourceShift, targetShift] = await Promise.all([
    requireShift(input.scheduleRepository, input.sourceShiftId),
    requireShift(input.scheduleRepository, input.targetShiftId),
  ]);

  if (sourceShift.userId !== input.actor.userId) {
    throw new Error("Collaborator can only propose swaps for their own assigned shifts.");
  }

  const now = input.now ?? new Date();
  const request = await input.scheduleRepository.saveRequest(
    createScheduleRequest({
      counterpartShiftId: targetShift.id,
      counterpartUserId: input.targetUserId,
      createdAt: now,
      endsAt: sourceShift.endsAt,
      id: createScheduleRequestId("swap", input.actor.userId, now),
      kind: "swap",
      ...(input.note === undefined ? {} : { note: input.note }),
      requesterUserId: input.actor.userId,
      scope: input.scope,
      shiftId: sourceShift.id,
      startsAt: sourceShift.startsAt,
      status: "pending",
    }),
  );
  const teamMembers = await input.scheduleRepository.listTeamMembers(input.scope);

  await input.scheduleRepository.saveNotification(
    createScheduleNotification({
      createdAt: now,
      id: createScheduleNotificationId("swap_proposed", input.targetUserId, request.id, now),
      message: `${memberNameForUserId(teamMembers, input.actor.userId)} propos uma troca de turno para voce.`,
      requestId: request.id,
      scope: input.scope,
      shiftId: sourceShift.id,
      status: "sent",
      type: "swap_proposed",
      userId: input.targetUserId,
    }),
  );

  return toScheduleRequestResult(request, createScheduleMemberLookup(teamMembers));
}

export async function respondToShiftSwap(input: {
  readonly actor: ActorContext;
  readonly now?: Date;
  readonly requestId: DomainId<"schedule-request">;
  readonly response: "accept" | "reject";
  readonly scheduleRepository: ScheduleRepositoryPort;
}): Promise<ScheduleRequestResult> {
  const request = await requireScheduleRequest(input.scheduleRepository, input.requestId);

  if (request.kind !== "swap") {
    throw new Error("Only swap requests can receive collaborator responses.");
  }

  if (request.counterpartUserId !== input.actor.userId) {
    throw new Error("Only the requested collaborator can respond to this swap.");
  }

  assertUseCaseAuthorized(input.actor, {
    action: "schedule.request.create",
    resource: {
      ...request.scope,
      targetUserId: input.actor.userId,
    },
  });

  const now = input.now ?? new Date();
  const updatedRequest = await input.scheduleRepository.saveRequest(
    updateScheduleRequest(request, {
      reviewedAt: now,
      reviewedByUserId: input.actor.userId,
      status: input.response === "accept" ? "accepted" : "rejected",
    }),
  );
  const teamMembers = await input.scheduleRepository.listTeamMembers(request.scope);

  if (input.response === "accept") {
    const reviewRecipients = selectScheduleReviewRecipients(teamMembers, input.actor.userId);

    await Promise.all(
      reviewRecipients.map((recipient) =>
        input.scheduleRepository.saveNotification(
          createScheduleNotification({
            createdAt: now,
            id: createScheduleNotificationId("swap_responded", recipient.userId, request.id, now),
            message: `${memberNameForUserId(teamMembers, input.actor.userId)} aceitou uma troca e aguarda aprovacao.`,
            requestId: request.id,
            scope: request.scope,
            status: "sent",
            type: "swap_responded",
            userId: recipient.userId,
          }),
        ),
      ),
    );
  } else {
    await input.scheduleRepository.saveNotification(
      createScheduleNotification({
        createdAt: now,
        id: createScheduleNotificationId("swap_responded", request.requesterUserId, request.id, now),
        message: "Sua proposta de troca foi recusada.",
        requestId: request.id,
        scope: request.scope,
        status: "sent",
        type: "swap_responded",
        userId: request.requesterUserId,
      }),
    );
  }

  return toScheduleRequestResult(updatedRequest, createScheduleMemberLookup(teamMembers));
}

export async function approveShiftSwap(input: {
  readonly actor: ActorContext;
  readonly now?: Date;
  readonly requestId: DomainId<"schedule-request">;
  readonly scheduleRepository: ScheduleRepositoryPort;
}): Promise<ScheduleRequestResult> {
  const request = await requireScheduleRequest(input.scheduleRepository, input.requestId);

  if (request.kind !== "swap") {
    throw new Error("Only swap requests can be approved in this workflow.");
  }

  assertUseCaseAuthorized(input.actor, {
    action: "schedule.swap.approve",
    resource: request.scope,
  });

  if (request.status !== "accepted") {
    throw new Error("Swap request must be accepted before leader approval.");
  }

  const [sourceShift, targetShift] = await Promise.all([
    requireShift(input.scheduleRepository, request.shiftId),
    requireShift(input.scheduleRepository, request.counterpartShiftId),
  ]);
  const now = input.now ?? new Date();

  await Promise.all([
    input.scheduleRepository.saveShift(updateShift(sourceShift, { userId: targetShift.userId })),
    input.scheduleRepository.saveShift(updateShift(targetShift, { userId: sourceShift.userId })),
  ]);

  const updatedRequest = await input.scheduleRepository.saveRequest(
    updateScheduleRequest(request, {
      reviewedAt: now,
      reviewedByUserId: input.actor.userId,
      status: "approved",
    }),
  );
  const teamMembers = await input.scheduleRepository.listTeamMembers(request.scope);

  await Promise.all(
    [request.requesterUserId, request.counterpartUserId].flatMap((userId) =>
      userId === undefined
        ? []
        : [
            input.scheduleRepository.saveNotification(
              createScheduleNotification({
                createdAt: now,
                id: createScheduleNotificationId("swap_approved", userId, request.id, now),
                message: "A troca de turno foi aprovada e a escala foi atualizada.",
                requestId: request.id,
                scope: request.scope,
                status: "sent",
                type: "swap_approved",
                userId,
              }),
            ),
          ],
    ),
  );

  return toScheduleRequestResult(updatedRequest, createScheduleMemberLookup(teamMembers));
}

export async function summarizeOperations(input: {
  readonly actor: ActorContext;
  readonly operationsRepository: OperationsRepositoryPort;
  readonly scope: TenantScope;
}): Promise<OperationsSummaryResult> {
  assertUseCaseAuthorized(input.actor, {
    action: "operations.summary.read",
    resource: input.scope,
  });

  const checklistRuns = await input.operationsRepository.listChecklistRuns(input.scope);
  const issues = await input.operationsRepository.listIssues(input.scope);

  return {
    completedRoutineCount: checklistRuns.filter((run) => run.status === "completed").length,
    openIssueCount: issues.filter((issue) => issue.status === "open" || issue.status === "in_review").length,
    overdueRoutineCount: checklistRuns.filter((run) => run.status === "overdue").length,
    pendingSyncCount: checklistRuns.filter((run) => run.pendingSync).length,
  };
}

export async function summarizeRecognition(input: {
  readonly actor: ActorContext;
  readonly now?: Date;
  readonly recognitionRepository: RecognitionRepositoryPort;
  readonly scope: TenantScope;
  readonly targetUserId: DomainId<"user">;
}): Promise<RecognitionSummaryResult> {
  assertUseCaseAuthorized(input.actor, {
    action: "recognition.read",
    resource: {
      ...input.scope,
      targetUserId: input.targetUserId,
    },
  });

  const [badgeAwards, ledgerEntries, recognitionEvents] = await Promise.all([
    input.recognitionRepository.listBadgeAwardsForUser(input.targetUserId, input.scope),
    input.recognitionRepository.listLedgerEntriesForUser(input.targetUserId, input.scope),
    input.recognitionRepository.listRecognitionEventsForUser(input.targetUserId, input.scope),
  ]);

  return summarizeRecognitionRecords({
    badgeAwards,
    ledgerEntries,
    now: input.now ?? new Date(),
    recognitionEvents,
  });
}

export async function getRecognitionProfile(input: {
  readonly actor: ActorContext;
  readonly badgeDefinitions?: readonly BadgeDefinition[];
  readonly now?: Date;
  readonly recognitionRepository: RecognitionRepositoryPort;
  readonly scope: TenantScope;
  readonly targetUserId: DomainId<"user">;
}): Promise<CollaboratorRecognitionProfileResult> {
  assertUseCaseAuthorized(input.actor, {
    action: "recognition.read",
    resource: {
      ...input.scope,
      targetUserId: input.targetUserId,
    },
  });

  const now = input.now ?? new Date();
  const [existingBadgeAwards, ledgerEntries, recognitionEvents] = await Promise.all([
    input.recognitionRepository.listBadgeAwardsForUser(input.targetUserId, input.scope),
    input.recognitionRepository.listLedgerEntriesForUser(input.targetUserId, input.scope),
    input.recognitionRepository.listRecognitionEventsForUser(input.targetUserId, input.scope),
  ]);
  const awardedBadges = await saveNewBadgeAwards({
    badgeDefinitions: input.badgeDefinitions ?? defaultBadgeDefinitions,
    existingBadgeAwards,
    ledgerEntries,
    now,
    recognitionEvents,
    recognitionRepository: input.recognitionRepository,
    scope: input.scope,
    userId: input.targetUserId,
  });
  const allBadgeAwards = [...existingBadgeAwards, ...awardedBadges.map((grant) => grant.badgeAward)];

  return {
    badges: [...allBadgeAwards]
      .sort(sortByMostRecentDate((badge) => badge.awardedAt))
      .map((award) => toRecognitionBadgeResult(award, input.badgeDefinitions ?? defaultBadgeDefinitions)),
    ledger: [...ledgerEntries]
      .sort(sortByMostRecentDate((entry) => entry.occurredAt))
      .map(toRecognitionLedgerEntryResult),
    recognitionHistory: [...recognitionEvents]
      .sort(sortByMostRecentDate((event) => event.createdAt))
      .map(toRecognitionEventResult),
    rewardExplanations: [...ledgerEntries]
      .sort(sortByMostRecentDate((entry) => entry.occurredAt))
      .map(toRewardExplanationResult),
    summary: summarizeRecognitionRecords({
      badgeAwards: allBadgeAwards,
      ledgerEntries,
      now,
      recognitionEvents,
    }),
  };
}

export async function grantPointsForEligibleAction(input: {
  readonly actor: ActorContext;
  readonly actorUserId?: DomainId<"user">;
  readonly badgeDefinitions?: readonly BadgeDefinition[];
  readonly now?: Date;
  readonly recognitionRepository: RecognitionRepositoryPort;
  readonly recipientUserId: DomainId<"user">;
  readonly rewardRule: RewardRule;
  readonly scope: TenantScope;
  readonly sourceId?: string;
}): Promise<{
  readonly awardedBadges: readonly RecognitionBadgeResult[];
  readonly granted: boolean;
  readonly ledgerEntry?: RecognitionLedgerEntryResult;
  readonly reason: "duplicate_source" | "granted" | "window_limit_reached";
}> {
  assertUseCaseAuthorized(input.actor, {
    action: "recognition.send",
    resource: {
      ...input.scope,
      targetUserId: input.recipientUserId,
    },
  });

  const now = input.now ?? new Date();
  const existingEntries = await input.recognitionRepository.listLedgerEntriesForUser(
    input.recipientUserId,
    input.scope,
  );
  const rewardDecision = evaluateRewardGrant({
    actorUserId: input.actorUserId ?? input.actor.userId,
    existingEntries,
    occurredAt: now,
    recipientUserId: input.recipientUserId,
    rule: input.rewardRule,
    scope: input.scope,
    ...(input.sourceId === undefined ? {} : { sourceId: input.sourceId }),
  });

  if (!rewardDecision.granted || rewardDecision.ledgerEntry === undefined) {
    return {
      awardedBadges: [],
      granted: false,
      reason: rewardDecision.reason,
    };
  }

  const ledgerEntry = await input.recognitionRepository.saveLedgerEntry(rewardDecision.ledgerEntry);
  const recognitionEvents = await input.recognitionRepository.listRecognitionEventsForUser(
    input.recipientUserId,
    input.scope,
  );
  const existingBadgeAwards = await input.recognitionRepository.listBadgeAwardsForUser(
    input.recipientUserId,
    input.scope,
  );
  const awardedBadges = await saveNewBadgeAwards({
    badgeDefinitions: input.badgeDefinitions ?? defaultBadgeDefinitions,
    existingBadgeAwards,
    ledgerEntries: [...existingEntries, ledgerEntry],
    now,
    recognitionEvents,
    recognitionRepository: input.recognitionRepository,
    scope: input.scope,
    userId: input.recipientUserId,
  });

  return {
    awardedBadges: awardedBadges.map((grant) =>
      toRecognitionBadgeResult(grant.badgeAward, input.badgeDefinitions ?? defaultBadgeDefinitions),
    ),
    granted: true,
    ledgerEntry: toRecognitionLedgerEntryResult(ledgerEntry),
    reason: "granted",
  };
}

export async function sendRecognition(input: {
  readonly actor: ActorContext;
  readonly badgeDefinitions?: readonly BadgeDefinition[];
  readonly category: RecognitionCategory;
  readonly limitPolicy?: RecognitionLimitPolicy;
  readonly message: string;
  readonly now?: Date;
  readonly recognitionRepository: RecognitionRepositoryPort;
  readonly recipientUserId: DomainId<"user">;
  readonly rewardRule?: RewardRule;
  readonly scope: TenantScope;
  readonly sourceFeedPostId?: DomainId<"feed-post">;
}): Promise<SendRecognitionResult> {
  assertUseCaseAuthorized(input.actor, {
    action: "recognition.send",
    resource: {
      ...input.scope,
      targetUserId: input.recipientUserId,
    },
  });

  const now = input.now ?? new Date();
  const existingRecognitionEvents = await input.recognitionRepository.listRecognitionEvents(input.scope);
  const limitDecision = evaluateRecognitionLimit({
    actorRole: input.actor.role,
    actorUserId: input.actor.userId,
    category: input.category,
    existingEvents: existingRecognitionEvents,
    now,
    policy: input.limitPolicy ?? defaultRecognitionLimitPolicy,
    recipientUserId: input.recipientUserId,
  });

  if (!limitDecision.allowed) {
    throw new Error(`Recognition limit reached: ${limitDecision.reason}.`);
  }

  const existingEntries = await input.recognitionRepository.listLedgerEntriesForUser(
    input.recipientUserId,
    input.scope,
  );
  const rewardRule = input.rewardRule ?? defaultRecognitionRewardRule;
  const rewardDecision = evaluateRewardGrant({
    actorUserId: input.actor.userId,
    existingEntries,
    occurredAt: now,
    recipientUserId: input.recipientUserId,
    rule: rewardRule,
    scope: input.scope,
    ...(input.sourceFeedPostId === undefined ? {} : { sourceId: input.sourceFeedPostId }),
  });
  const recognitionEvent = await input.recognitionRepository.saveRecognitionEvent(
    createRecognitionEvent({
      category: input.category,
      createdAt: now,
      id: `recognition_${input.actor.userId}_${input.recipientUserId}_${now.getTime()}`,
      message: input.message,
      pointsAwarded: rewardDecision.ledgerEntry?.amount ?? 0,
      recipientUserId: input.recipientUserId,
      scope: input.scope,
      senderUserId: input.actor.userId,
      ...(input.sourceFeedPostId === undefined
        ? {}
        : { sourceFeedPostId: input.sourceFeedPostId }),
    }),
  );
  const ledgerEntry =
    rewardDecision.granted && rewardDecision.ledgerEntry !== undefined
      ? await input.recognitionRepository.saveLedgerEntry(rewardDecision.ledgerEntry)
      : undefined;
  const existingBadgeAwards = await input.recognitionRepository.listBadgeAwardsForUser(
    input.recipientUserId,
    input.scope,
  );
  const awardedBadges = await saveNewBadgeAwards({
    badgeDefinitions: input.badgeDefinitions ?? defaultBadgeDefinitions,
    existingBadgeAwards,
    ledgerEntries: ledgerEntry === undefined ? existingEntries : [...existingEntries, ledgerEntry],
    now,
    recognitionEvents: [...existingRecognitionEvents, recognitionEvent],
    recognitionRepository: input.recognitionRepository,
    scope: input.scope,
    userId: input.recipientUserId,
  });

  return {
    awardedBadges: awardedBadges.map((grant) =>
      toRecognitionBadgeResult(grant.badgeAward, input.badgeDefinitions ?? defaultBadgeDefinitions),
    ),
    ...(ledgerEntry === undefined ? {} : { ledgerEntry: toRecognitionLedgerEntryResult(ledgerEntry) }),
    recognition: toRecognitionEventResult(recognitionEvent),
  };
}

export async function recognizeFeedPost(input: {
  readonly actor: ActorContext;
  readonly badgeDefinitions?: readonly BadgeDefinition[];
  readonly feedRepository: FeedRepositoryPort;
  readonly message?: string;
  readonly now?: Date;
  readonly postId: DomainId<"feed-post">;
  readonly recognitionRepository: RecognitionRepositoryPort;
}): Promise<SendRecognitionResult> {
  const post = await requirePost(input.feedRepository, input.postId);

  assertUseCaseAuthorized(input.actor, {
    action: "recognition.send",
    resource: {
      ...post.scope,
      targetUserId: post.authorUserId,
    },
  });

  if ((post.status !== "published" && post.status !== "featured") || post.photoUrl === undefined) {
    throw new Error("Only approved photo posts can become recognition highlights.");
  }

  return sendRecognition({
    actor: input.actor,
    ...(input.badgeDefinitions === undefined ? {} : { badgeDefinitions: input.badgeDefinitions }),
    category: post.missionLink?.recognitionCategory ?? "quality",
    message:
      input.message ??
      `Destaque do feed: ${post.title}. O registro virou reconhecimento publico da rotina FLV.`,
    ...(input.now === undefined ? {} : { now: input.now }),
    recognitionRepository: input.recognitionRepository,
    recipientUserId: post.authorUserId,
    rewardRule: createRewardRule({
      code: `feed-post-${post.id}`,
      maxAwardsPerWindow: 20,
      points: post.missionLink?.rewardPoints ?? 20,
      reason: `Post aprovado no feed: ${post.title}`,
      source: "feed_post",
      windowDays: 30,
    }),
    scope: post.scope,
    sourceFeedPostId: post.id,
  });
}

export async function getHealthyRecognitionRanking(input: {
  readonly actor: ActorContext;
  readonly limit?: number;
  readonly recognitionRepository: RecognitionRepositoryPort;
  readonly scope: TenantScope;
  readonly teamGoalPoints?: number;
  readonly teamMembers?: readonly ScheduleTeamMember[];
}): Promise<HealthyRecognitionRankingResult> {
  assertUseCaseAuthorized(input.actor, {
    action: "feed.read",
    resource: input.scope,
  });

  const [ledgerEntries, recognitionEvents] = await Promise.all([
    input.recognitionRepository.listLedgerEntries(input.scope),
    input.recognitionRepository.listRecognitionEvents(input.scope),
  ]);
  const knownUserIds = new Set<string>();

  for (const entry of ledgerEntries) {
    knownUserIds.add(entry.userId);
  }

  for (const event of recognitionEvents) {
    knownUserIds.add(event.recipientUserId);
  }

  for (const member of input.teamMembers ?? []) {
    knownUserIds.add(member.userId);
  }

  const badgeAwardsByUser = new Map<string, readonly BadgeAward[]>();

  await Promise.all(
    [...knownUserIds].map(async (userId) => {
      badgeAwardsByUser.set(
        userId,
        await input.recognitionRepository.listBadgeAwardsForUser(
          createApplicationUserId(userId),
          input.scope,
        ),
      );
    }),
  );

  const ranking = buildHealthyRanking({
    candidates: [...knownUserIds].map((userId) => {
      const member = input.teamMembers?.find((candidate) => candidate.userId === userId);
      const points = ledgerEntries
        .filter((entry) => entry.userId === userId)
        .reduce((sum, entry) => sum + Math.max(entry.amount, 0), 0);

      return {
        badgeCount: badgeAwardsByUser.get(userId)?.length ?? 0,
        displayName: member?.displayName ?? userId,
        eligible: points > 0,
        points,
        recognitionCount: recognitionEvents.filter((event) => event.recipientUserId === userId).length,
        userId: createApplicationUserId(userId),
      };
    }),
    ...(input.limit === undefined ? {} : { limit: input.limit }),
    teamGoalPoints: input.teamGoalPoints ?? 500,
  });

  return {
    entries: ranking.entries.map((entry) => ({
      badgeCount: entry.badgeCount,
      displayName: entry.displayName,
      points: entry.points,
      position: entry.position,
      recognitionCount: entry.recognitionCount,
      userId: entry.userId,
    })),
    framing: "Ranking positivo: aparece apenas progresso elegivel, sem expor indicadores negativos.",
    teamGoalPoints: ranking.teamGoalPoints,
    teamProgressPercent: ranking.teamProgressPercent,
    totalPositivePoints: ranking.totalPositivePoints,
  };
}

async function saveNewBadgeAwards(input: {
  readonly badgeDefinitions: readonly BadgeDefinition[];
  readonly existingBadgeAwards: readonly BadgeAward[];
  readonly ledgerEntries: readonly PointsLedgerEntry[];
  readonly now: Date;
  readonly recognitionEvents: readonly RecognitionEvent[];
  readonly recognitionRepository: RecognitionRepositoryPort;
  readonly scope: TenantScope;
  readonly userId: DomainId<"user">;
}) {
  const grants = evaluateBadgeGrants({
    badgeDefinitions: input.badgeDefinitions,
    existingAwards: input.existingBadgeAwards,
    ledgerEntries: input.ledgerEntries,
    now: input.now,
    recognitionEvents: input.recognitionEvents,
    scope: input.scope,
    userId: input.userId,
  });

  await Promise.all(grants.map((grant) => input.recognitionRepository.saveBadgeAward(grant.badgeAward)));

  return grants;
}

function summarizeRecognitionRecords(input: {
  readonly badgeAwards: readonly BadgeAward[];
  readonly ledgerEntries: readonly PointsLedgerEntry[];
  readonly now: Date;
  readonly recognitionEvents: readonly RecognitionEvent[];
}): RecognitionSummaryResult {
  const recentCutoff = new Date(input.now.getTime() - 30 * 24 * 60 * 60 * 1000);

  return {
    badgeCount: input.badgeAwards.length,
    points: input.ledgerEntries.reduce((sum, entry) => sum + entry.amount, 0),
    recentRecognitionCount: input.recognitionEvents.filter(
      (event) => event.createdAt.getTime() >= recentCutoff.getTime(),
    ).length,
  };
}

function toRecognitionLedgerEntryResult(entry: PointsLedgerEntry): RecognitionLedgerEntryResult {
  return {
    ...(entry.actorUserId === undefined ? {} : { actorUserId: entry.actorUserId }),
    amount: entry.amount,
    id: entry.id,
    occurredAt: entry.occurredAt,
    reason: entry.reason,
    source: entry.source,
    ...(entry.sourceId === undefined ? {} : { sourceId: entry.sourceId }),
  };
}

function toRecognitionBadgeResult(
  award: BadgeAward,
  definitions: readonly BadgeDefinition[],
): RecognitionBadgeResult {
  const definition = definitions.find((candidate) => candidate.code === award.code);

  return {
    awardedAt: award.awardedAt,
    code: award.code,
    description: definition?.description ?? "Conquista registrada no programa de reconhecimento.",
    explanation:
      definition === undefined
        ? "Conquista concedida por regra ativa no periodo."
        : buildBadgeExplanation(definition),
    id: award.id,
    title: definition?.title ?? award.code,
  };
}

function toRecognitionEventResult(event: RecognitionEvent): RecognitionEventResult {
  return {
    category: event.category,
    categoryLabel: recognitionCategoryLabels[event.category],
    createdAt: event.createdAt,
    id: event.id,
    message: event.message,
    pointsAwarded: event.pointsAwarded,
    recipientUserId: event.recipientUserId,
    ...(event.senderUserId === undefined ? {} : { senderUserId: event.senderUserId }),
    ...(event.sourceFeedPostId === undefined ? {} : { sourceFeedPostId: event.sourceFeedPostId }),
  };
}

function toRewardExplanationResult(entry: PointsLedgerEntry): RecognitionRewardExplanationResult {
  return {
    grantedAt: entry.occurredAt,
    points: entry.amount,
    reason: entry.reason,
    source: entry.source,
    ...(entry.sourceId === undefined ? {} : { sourceId: entry.sourceId }),
    title: buildRewardSourceTitle(entry.source),
  };
}

function buildBadgeExplanation(definition: BadgeDefinition): string {
  const criteria = definition.criteria;

  if (criteria.type === "points_total") {
    return `Concedido ao atingir ${criteria.minimumPoints} pontos positivos elegiveis.`;
  }

  if (criteria.type === "ledger_source_count") {
    return `Concedido apos ${criteria.minimumSourceCount} acao(oes) elegiveis de ${buildRewardSourceTitle(criteria.source).toLowerCase()}.`;
  }

  return `Concedido apos ${criteria.minimumRecognitionCount} reconhecimento(s) em ${recognitionCategoryLabels[criteria.category].toLowerCase()}.`;
}

function buildRewardSourceTitle(source: PointsLedgerEntry["source"]): string {
  if (source === "feed_post") {
    return "Post aprovado no feed";
  }

  if (source === "routine_completion") {
    return "Rotina concluida";
  }

  if (source === "learning") {
    return "Aprendizado concluido";
  }

  if (source === "manual_adjustment") {
    return "Ajuste auditado";
  }

  return "Reconhecimento recebido";
}

export async function summarizeDashboard(input: {
  readonly actor: ActorContext;
  readonly feedRepository: FeedRepositoryPort;
  readonly metricsRepository: MetricsRepositoryPort;
  readonly now?: Date;
  readonly operationsRepository: OperationsRepositoryPort;
  readonly recognitionRepository: RecognitionRepositoryPort;
  readonly scheduleRepository: ScheduleRepositoryPort;
  readonly scope: TenantScope;
  readonly filters?: DashboardFilterInput;
}): Promise<DashboardSummaryResult> {
  assertUseCaseAuthorized(input.actor, {
    action: "dashboard.read",
    resource: input.scope,
  });

  const now = input.now ?? new Date();
  const selectedFilters = resolveDashboardSelectedFilters(input.filters, now, input.scope);
  const scheduleConsolePromise = getLeaderSchedulePlanner({
    actor: input.actor,
    now,
    scheduleRepository: input.scheduleRepository,
    scope: input.scope,
    weekStart: selectedFilters.startsAt,
  });
  const [
    announcements,
    attentionAreas,
    checklistItemCompletions,
    checklistRuns,
    feedPosts,
    learningBites,
    metrics,
    openModerationCount,
    operationIssues,
    polls,
    recognitionEvents,
    recognitionLedgerEntries,
    scheduleConsole,
  ] = await Promise.all([
    input.feedRepository.listAnnouncements(input.scope),
    input.metricsRepository.listAttentionAreas(input.scope),
    input.operationsRepository.listChecklistItemCompletions(input.scope),
    input.operationsRepository.listChecklistRuns(input.scope),
    input.feedRepository.listPosts(input.scope),
    input.operationsRepository.listLearningBites(input.scope),
    input.metricsRepository.listMetricSnapshots(input.scope),
    input.feedRepository.countPostsByStatus("pending_moderation", input.scope),
    input.operationsRepository.listIssues(input.scope),
    input.feedRepository.listPolls(input.scope),
    input.recognitionRepository.listRecognitionEvents(input.scope),
    input.recognitionRepository.listLedgerEntries(input.scope),
    scheduleConsolePromise,
  ]);

  const dashboardBase = summarizeDashboardMetrics({
    attentionAreas,
    metrics,
    openModerationCount,
  });
  const periodFeedPosts = filterFeedPostsForDashboard(feedPosts, selectedFilters);
  const periodChecklistRuns = filterChecklistRunsForDashboard(checklistRuns, selectedFilters);
  const periodChecklistItems = filterChecklistItemsForDashboard(
    checklistItemCompletions,
    selectedFilters,
  );
  const periodIssues = filterIssuesForDashboard(operationIssues, selectedFilters);
  const periodRecognitionEvents = filterRecognitionEventsForDashboard(
    recognitionEvents,
    selectedFilters,
  );
  const periodLedgerEntries = filterLedgerEntriesForDashboard(
    recognitionLedgerEntries,
    selectedFilters,
  );
  const filteredLearningBites = filterLearningBitesForDashboard(
    learningBites,
    selectedFilters,
  );
  const contentItems = buildDashboardContentItems({
    announcements,
    feedPosts: periodFeedPosts,
    learningBites: filteredLearningBites,
    polls,
    selected: selectedFilters,
  });
  const checklistMonitor = buildDashboardChecklistMonitor(
    periodChecklistRuns,
    periodChecklistItems,
    periodIssues,
  );
  const scheduleGapCount = scheduleConsole.coverageAlerts.filter(
    (alert) => alert.severity !== "ok",
  ).length;
  const memberInsights = buildDashboardMemberInsights({
    checklistItems: periodChecklistItems,
    feedPosts: periodFeedPosts,
    ledgerEntries: periodLedgerEntries,
    recognitionEvents: periodRecognitionEvents,
    ...(selectedFilters.teamMemberId === undefined
      ? {}
      : { selectedTeamMemberId: selectedFilters.teamMemberId }),
    shifts: scheduleConsole.shifts,
    teamMembers: scheduleConsole.teamMembers,
  });
  const attentionAreaResults = buildDashboardAttentionAreas({
    attentionAreas,
    checklistMonitor,
    engagementRate: dashboardBase.engagementRate,
    issues: periodIssues,
    now,
    openModerationCount,
    scheduleConsole,
  });
  const overview = buildDashboardOverview({
    checklistMonitor,
    engagementRate: dashboardBase.engagementRate,
    feedPosts: periodFeedPosts,
    generatedAt: now,
    issueCount: periodIssues.filter((issue) => issue.status === "open" || issue.status === "in_review").length,
    recognitionEvents: periodRecognitionEvents,
    scheduleGapCount,
    teamProgressPercent: resolveTeamProgressPercent(metrics, periodLedgerEntries),
  });
  const moderationQueue = await Promise.all(
    periodFeedPosts
      .filter((post) => post.status === "pending_moderation")
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .map((post) => hydrateFeedPost(post, input.actor, input.feedRepository)),
  );

  return {
    ...dashboardBase,
    attentionAreaCount: attentionAreaResults.length,
    attentionAreas: attentionAreaResults,
    checklistMonitor,
    contentItems,
    filters: buildDashboardFilters({
      scheduleConsole,
      selected: selectedFilters,
    }),
    memberInsights,
    moderationQueue,
    openModerationCount: moderationQueue.length,
    overview,
    scheduleConsole,
    scheduleGapCount,
  };
}

function resolveDashboardSelectedFilters(
  filters: DashboardFilterInput | undefined,
  now: Date,
  scope: TenantScope,
): DashboardSelectedFiltersResult {
  const endsAt = filters?.endsAt ?? now;
  const startsAt = filters?.startsAt ?? addUtcDays(endsAt, -7);
  const storeId = filters?.storeId ?? scope.storeId;

  return {
    ...(filters?.contentType === undefined ? {} : { contentType: filters.contentType }),
    dateRangeLabel: `${formatUtcDate(startsAt)}-${formatUtcDate(endsAt)}`,
    endsAt,
    ...(filters?.routineCategory === undefined ? {} : { routineCategory: filters.routineCategory }),
    ...(filters?.shiftId === undefined ? {} : { shiftId: filters.shiftId }),
    startsAt,
    ...(storeId === undefined ? {} : { storeId }),
    ...(filters?.teamMemberId === undefined ? {} : { teamMemberId: filters.teamMemberId }),
  };
}

function filterFeedPostsForDashboard(
  posts: readonly FeedPost[],
  filters: DashboardSelectedFiltersResult,
): readonly FeedPost[] {
  return posts.filter((post) => {
    if (!isWithinDashboardDateRange(post.publishedAt ?? post.createdAt, filters)) {
      return false;
    }

    if (filters.teamMemberId !== undefined && post.authorUserId !== filters.teamMemberId) {
      return false;
    }

    if (filters.contentType !== undefined && filters.contentType !== "photo_mission") {
      return false;
    }

    return filters.routineCategory === undefined || post.category === "routine";
  });
}

function filterChecklistRunsForDashboard(
  runs: readonly ChecklistRun[],
  filters: DashboardSelectedFiltersResult,
): readonly ChecklistRun[] {
  return runs.filter((run) => {
    if (!isWithinDashboardDateRange(run.completedAt ?? run.dueAt, filters)) {
      return false;
    }

    if (filters.shiftId !== undefined && run.shiftId !== filters.shiftId) {
      return false;
    }

    if (filters.teamMemberId !== undefined && run.assignedUserId !== filters.teamMemberId) {
      return false;
    }

    return filters.routineCategory === undefined || run.routineId === filters.routineCategory;
  });
}

function filterChecklistItemsForDashboard(
  items: readonly ChecklistItemCompletion[],
  filters: DashboardSelectedFiltersResult,
): readonly ChecklistItemCompletion[] {
  return items.filter((item) => {
    if (item.completedAt !== undefined && !isWithinDashboardDateRange(item.completedAt, filters)) {
      return false;
    }

    if (filters.shiftId !== undefined && item.shiftId !== filters.shiftId) {
      return false;
    }

    return filters.teamMemberId === undefined || item.completedByUserId === filters.teamMemberId;
  });
}

function filterIssuesForDashboard(
  issues: readonly OperationIssue[],
  filters: DashboardSelectedFiltersResult,
): readonly OperationIssue[] {
  return issues.filter((issue) => {
    if (!isWithinDashboardDateRange(issue.createdAt, filters)) {
      return false;
    }

    if (filters.shiftId !== undefined && issue.shiftId !== filters.shiftId) {
      return false;
    }

    return filters.teamMemberId === undefined || issue.reportedByUserId === filters.teamMemberId;
  });
}

function filterLearningBitesForDashboard(
  learningBites: readonly OperationLearningBite[],
  filters: DashboardSelectedFiltersResult,
): readonly OperationLearningBite[] {
  return learningBites.filter((learningBite) => {
    if (filters.contentType !== undefined && filters.contentType !== "learning_card") {
      return false;
    }

    if (
      learningBite.completedAt !== undefined &&
      !isWithinDashboardDateRange(learningBite.completedAt, filters)
    ) {
      return false;
    }

    return filters.teamMemberId === undefined || learningBite.completedByUserId === filters.teamMemberId;
  });
}

function filterRecognitionEventsForDashboard(
  events: readonly RecognitionEvent[],
  filters: DashboardSelectedFiltersResult,
): readonly RecognitionEvent[] {
  return events.filter((event) => {
    if (!isWithinDashboardDateRange(event.createdAt, filters)) {
      return false;
    }

    return filters.teamMemberId === undefined || event.recipientUserId === filters.teamMemberId;
  });
}

function filterLedgerEntriesForDashboard(
  entries: readonly PointsLedgerEntry[],
  filters: DashboardSelectedFiltersResult,
): readonly PointsLedgerEntry[] {
  return entries.filter((entry) => {
    if (!isWithinDashboardDateRange(entry.occurredAt, filters)) {
      return false;
    }

    return filters.teamMemberId === undefined || entry.userId === filters.teamMemberId;
  });
}

function buildDashboardContentItems(input: {
  readonly announcements: readonly FeedAnnouncement[];
  readonly feedPosts: readonly FeedPost[];
  readonly learningBites: readonly OperationLearningBite[];
  readonly polls: readonly FeedPoll[];
  readonly selected: DashboardSelectedFiltersResult;
}): readonly DashboardContentItemResult[] {
  const announcementItems = input.announcements
    .filter(() => input.selected.contentType === undefined || input.selected.contentType === "announcement")
    .filter((announcement) =>
      isWithinDashboardDateRange(announcement.publishedAt ?? announcement.createdAt, input.selected),
    )
    .map((announcement) => ({
      id: announcement.id,
      metricLabel: announcement.requiredAcknowledgement ? "ack obrigatorio" : "informativo",
      ...(announcement.createdByUserId === undefined
        ? {}
        : { ownerLabel: `autor ${announcement.createdByUserId}` }),
      ...(announcement.publishedAt === undefined ? {} : { scheduledFor: announcement.publishedAt }),
      status: announcement.status,
      title: announcement.title,
      type: "announcement" as const,
    }));
  const pollItems = input.polls
    .filter(() => input.selected.contentType === undefined || input.selected.contentType === "poll")
    .filter((poll) => isWithinDashboardDateRange(poll.closesAt ?? poll.createdAt, input.selected))
    .map((poll) => ({
      id: poll.id,
      metricLabel: `${poll.votes.length} voto(s)`,
      ...(poll.createdByUserId === undefined ? {} : { ownerLabel: `autor ${poll.createdByUserId}` }),
      ...(poll.closesAt === undefined ? {} : { scheduledFor: poll.closesAt }),
      status: poll.status,
      title: poll.title,
      type: "poll" as const,
    }));
  const missionItems = input.feedPosts
    .filter(() => input.selected.contentType === undefined || input.selected.contentType === "photo_mission")
    .filter((post) => post.missionLink?.missionTitle !== undefined)
    .map((post) => ({
      id: post.missionLink?.missionId ?? post.id,
      metricLabel:
        post.missionLink?.rewardPoints === undefined
          ? "sem pontos"
          : `${post.missionLink.rewardPoints} pts`,
      ownerLabel: post.authorName,
      scheduledFor: post.publishedAt ?? post.createdAt,
      status: toContentStatusFromFeedPost(post),
      title: post.missionLink?.missionTitle ?? post.title,
      type: "photo_mission" as const,
    }));
  const learningItems = input.learningBites.map((learningBite) => ({
    id: learningBite.id,
    metricLabel:
      learningBite.pointsAwarded === undefined
        ? `${learningBite.durationMinutes} min`
        : `${learningBite.pointsAwarded} pts`,
    ...(learningBite.completedByUserId === undefined
      ? {}
      : { ownerLabel: `concluido por ${learningBite.completedByUserId}` }),
    ...(learningBite.completedAt === undefined ? {} : { scheduledFor: learningBite.completedAt }),
    status: learningBite.completedAt === undefined ? "active" as const : "closed" as const,
    title: learningBite.title,
    type: "learning_card" as const,
  }));

  return [...announcementItems, ...pollItems, ...missionItems, ...learningItems]
    .sort((left, right) => (right.scheduledFor?.getTime() ?? 0) - (left.scheduledFor?.getTime() ?? 0))
    .slice(0, 12);
}

function buildDashboardChecklistMonitor(
  runs: readonly ChecklistRun[],
  items: readonly ChecklistItemCompletion[],
  issues: readonly OperationIssue[],
): DashboardChecklistMonitorResult {
  const itemsByRunId = groupBy(items, (item) => item.runId);
  const routines = runs.map((run) => {
    const runItems = itemsByRunId.get(run.id) ?? [];
    const completedCount = runItems.filter((item) => item.status === "completed").length;
    const overdueCount =
      run.status === "overdue"
        ? Math.max(1, runItems.filter((item) => item.status === "overdue").length)
        : runItems.filter((item) => item.status === "overdue").length;

    return {
      completedCount,
      id: run.routineId,
      label: routineLabel(run.routineId),
      overdueCount,
      totalCount: runItems.length === 0 ? 1 : runItems.length,
    };
  });
  const totalCount = routines.reduce((sum, routine) => sum + routine.totalCount, 0);
  const completedCount = routines.reduce((sum, routine) => sum + routine.completedCount, 0);
  const overdueCount = routines.reduce((sum, routine) => sum + routine.overdueCount, 0);
  const requiredEvidenceMissingCount = items.filter(
    (item) =>
      item.evidenceMode === "required" &&
      item.evidencePhotoUrl === undefined &&
      item.status !== "completed",
  ).length;
  const unresolvedIssueCount = issues.filter(
    (issue) => issue.status === "open" || issue.status === "in_review",
  ).length;

  return {
    completedCount,
    completionRate: totalCount === 0 ? 1 : roundRatio(completedCount / totalCount),
    overdueCount,
    requiredEvidenceMissingCount,
    routines,
    totalCount,
    unresolvedIssueCount,
  };
}

function buildDashboardMemberInsights(input: {
  readonly checklistItems: readonly ChecklistItemCompletion[];
  readonly feedPosts: readonly FeedPost[];
  readonly ledgerEntries: readonly PointsLedgerEntry[];
  readonly recognitionEvents: readonly RecognitionEvent[];
  readonly selectedTeamMemberId?: DomainId<"user">;
  readonly shifts: readonly ScheduleShiftResult[];
  readonly teamMembers: readonly ScheduleTeamMemberResult[];
}): readonly DashboardMemberInsightResult[] {
  return input.teamMembers
    .filter((member) => input.selectedTeamMemberId === undefined || member.userId === input.selectedTeamMemberId)
    .map((member) => {
      const memberShiftCount = input.shifts.filter((shift) => shift.userId === member.userId).length;
      const completedActionCount = input.checklistItems.filter(
        (item) => item.completedByUserId === member.userId && item.status === "completed",
      ).length;
      const engagementCount = input.feedPosts.filter((post) => post.authorUserId === member.userId).length;
      const recognitionCount = input.recognitionEvents.filter(
        (event) => event.recipientUserId === member.userId,
      ).length;
      const points = input.ledgerEntries
        .filter((entry) => entry.userId === member.userId)
        .reduce((sum, entry) => sum + Math.max(0, entry.amount), 0);

      return {
        completedActionCount,
        displayName: member.displayName,
        engagementCount,
        points,
        recognitionCount,
        role: member.role,
        scaleLabel: `${memberShiftCount} turno(s) no recorte`,
        userId: member.userId,
      };
    });
}

function buildDashboardAttentionAreas(input: {
  readonly attentionAreas: readonly AttentionArea[];
  readonly checklistMonitor: DashboardChecklistMonitorResult;
  readonly engagementRate: number;
  readonly issues: readonly OperationIssue[];
  readonly now: Date;
  readonly openModerationCount: number;
  readonly scheduleConsole: LeaderSchedulePlannerResult;
}): readonly DashboardAttentionAreaResult[] {
  const generatedAreas: DashboardAttentionAreaResult[] = [];

  if (input.openModerationCount > 0) {
    generatedAreas.push({
      createdAt: input.now,
      description: `${input.openModerationCount} post(s) aguardam decisao auditavel da lideranca.`,
      id: "attention_moderation_queue",
      kind: "moderation_queue",
      severity: input.openModerationCount >= 3 ? "critical" : "warning",
      sourceCount: input.openModerationCount,
      title: "Fila de moderacao aberta",
    });
  }

  const coverageGaps = input.scheduleConsole.coverageAlerts.filter((alert) => alert.severity !== "ok");

  if (coverageGaps.length > 0) {
    generatedAreas.push({
      createdAt: input.now,
      description: `${coverageGaps.length} janela(s) estao abaixo da cobertura minima no planner.`,
      id: "attention_coverage_gap",
      kind: "coverage_gap",
      severity: coverageGaps.some((alert) => alert.severity === "critical") ? "critical" : "warning",
      sourceCount: coverageGaps.length,
      title: "Cobertura precisa de ajuste",
    });
  }

  if (input.checklistMonitor.overdueCount > 0) {
    generatedAreas.push({
      createdAt: input.now,
      description: `${input.checklistMonitor.overdueCount} item(ns) de rotina passaram da janela ideal.`,
      id: "attention_overdue_routine",
      kind: "overdue_routine",
      severity: input.checklistMonitor.overdueCount >= 3 ? "critical" : "warning",
      sourceCount: input.checklistMonitor.overdueCount,
      title: "Rotinas atrasadas",
    });
  }

  if (input.engagementRate < 0.6) {
    generatedAreas.push({
      createdAt: input.now,
      description: "O engajamento do periodo esta abaixo do alvo de leitura saudavel.",
      id: "attention_low_engagement",
      kind: "low_engagement",
      severity: "warning",
      sourceCount: Math.round(input.engagementRate * 100),
      title: "Engajamento abaixo do alvo",
    });
  }

  for (const [category, count] of groupIssueCategories(input.issues)) {
    if (count >= 2) {
      generatedAreas.push({
        createdAt: input.now,
        description: `A categoria ${category} apareceu ${count} vez(es) no periodo selecionado.`,
        id: `attention_repeated_issue_${slugify(category)}`,
        kind: "repeated_issue",
        severity: count >= 3 ? "critical" : "warning",
        sourceCount: count,
        title: "Desvio repetido em FLV",
      });
    }
  }

  return [
    ...input.attentionAreas.map((area) => ({
      createdAt: area.createdAt,
      description: area.description,
      id: area.id,
      kind: classifyStoredAttentionArea(area),
      severity: area.severity,
      sourceCount: 1,
      title: area.title,
    })),
    ...generatedAreas,
  ].sort(compareAttentionAreas);
}

function buildDashboardOverview(input: {
  readonly checklistMonitor: DashboardChecklistMonitorResult;
  readonly engagementRate: number;
  readonly feedPosts: readonly FeedPost[];
  readonly generatedAt: Date;
  readonly issueCount: number;
  readonly recognitionEvents: readonly RecognitionEvent[];
  readonly scheduleGapCount: number;
  readonly teamProgressPercent: number;
}): DashboardOverviewResult {
  return {
    generatedAt: input.generatedAt,
    metrics: [
      {
        key: "engagement",
        label: "Engajamento",
        note: "participacao do periodo",
        tone: "fresh",
        value: formatPercent(input.engagementRate),
      },
      {
        key: "feed",
        label: "Feed",
        note: "posts no recorte",
        tone: "accent",
        value: String(input.feedPosts.length),
      },
      {
        key: "schedule",
        label: "Escala",
        note: "gaps de cobertura",
        tone: input.scheduleGapCount === 0 ? "fresh" : "warm",
        value: String(input.scheduleGapCount),
      },
      {
        key: "routine",
        label: "Rotinas",
        note: "conclusao operacional",
        tone: input.checklistMonitor.completionRate >= 0.8 ? "fresh" : "warm",
        value: formatPercent(input.checklistMonitor.completionRate),
      },
      {
        key: "issue",
        label: "Desvios",
        note: "abertos ou em revisao",
        tone: input.issueCount === 0 ? "fresh" : "warm",
        value: String(input.issueCount),
      },
      {
        key: "recognition",
        label: "Reconhecimento",
        note: "eventos positivos",
        tone: "accent",
        value: String(input.recognitionEvents.length),
      },
      {
        key: "team-progress",
        label: "Time",
        note: "progresso saudavel",
        tone: input.teamProgressPercent >= 70 ? "fresh" : "accent",
        value: `${input.teamProgressPercent}%`,
      },
    ],
    teamProgressPercent: input.teamProgressPercent,
  };
}

function buildDashboardFilters(input: {
  readonly scheduleConsole: LeaderSchedulePlannerResult;
  readonly selected: DashboardSelectedFiltersResult;
}): DashboardFiltersResult {
  const selectedStoreId = input.selected.storeId;

  return {
    contentTypes: [
      { id: "announcement", label: "Comunicados" },
      { id: "photo_mission", label: "Missoes foto" },
      { id: "poll", label: "Enquetes" },
      { id: "learning_card", label: "Cards de aprendizado" },
    ],
    routineCategories: [
      { id: "opening", label: "Abertura" },
      { id: "replenishment", label: "Reposicao" },
      { id: "quality-review", label: "Qualidade" },
      { id: "cleaning", label: "Limpeza" },
      { id: "labels", label: "Etiquetas" },
      { id: "closing", label: "Fechamento" },
    ],
    selected: input.selected,
    shifts: input.scheduleConsole.shifts.map((shift) => ({
      id: shift.id,
      label: `${shift.title} / ${formatUtcDate(new Date(shift.startsAt))}`,
    })),
    stores:
      selectedStoreId === undefined
        ? []
        : [
            {
              id: selectedStoreId,
              label: `Loja ${selectedStoreId}`,
            },
          ],
    teamMembers: input.scheduleConsole.teamMembers.map((member) => ({
      id: member.userId,
      label: member.displayName,
    })),
  };
}

function isWithinDashboardDateRange(
  date: Date,
  filters: DashboardSelectedFiltersResult,
): boolean {
  return date.getTime() >= filters.startsAt.getTime() && date.getTime() <= filters.endsAt.getTime();
}

function toContentStatusFromFeedPost(post: FeedPost): FeedContentStatus {
  if (post.status === "hidden" || post.status === "removed") {
    return "archived";
  }

  if (post.status === "draft" || post.status === "pending_moderation") {
    return "draft";
  }

  return "active";
}

function resolveTeamProgressPercent(
  metrics: readonly MetricSnapshot[],
  ledgerEntries: readonly PointsLedgerEntry[],
): number {
  const metricValue = metrics.find((metric) => metric.key === "team_progress_percent")?.value;

  if (metricValue !== undefined) {
    return clampPercent(Math.round(metricValue));
  }

  const positivePoints = ledgerEntries.reduce((sum, entry) => sum + Math.max(0, entry.amount), 0);

  return clampPercent(Math.round((positivePoints / 500) * 100));
}

function groupIssueCategories(issues: readonly OperationIssue[]): ReadonlyMap<string, number> {
  const counts = new Map<string, number>();

  for (const issue of issues.filter((item) => item.status === "open" || item.status === "in_review")) {
    counts.set(issue.category, (counts.get(issue.category) ?? 0) + 1);
  }

  return counts;
}

function classifyStoredAttentionArea(area: AttentionArea): DashboardAttentionAreaKind {
  const text = `${area.title} ${area.description}`.toLowerCase();

  if (text.includes("cobertura") || text.includes("escala")) {
    return "coverage_gap";
  }

  if (text.includes("rotina") || text.includes("atras")) {
    return "overdue_routine";
  }

  if (text.includes("engaj")) {
    return "low_engagement";
  }

  if (text.includes("desvio") || text.includes("perda") || text.includes("issue")) {
    return "repeated_issue";
  }

  return "moderation_queue";
}

function compareAttentionAreas(
  left: DashboardAttentionAreaResult,
  right: DashboardAttentionAreaResult,
): number {
  const severityRank = {
    critical: 3,
    warning: 2,
    info: 1,
  } as const;
  const severityDifference = severityRank[right.severity] - severityRank[left.severity];

  if (severityDifference !== 0) {
    return severityDifference;
  }

  return right.createdAt.getTime() - left.createdAt.getTime();
}

function routineLabel(routineId: OperationRoutineId): string {
  if (routineId === "opening") {
    return "Abertura";
  }

  if (routineId === "replenishment") {
    return "Reposicao";
  }

  if (routineId === "quality-review") {
    return "Qualidade";
  }

  if (routineId === "cleaning") {
    return "Limpeza";
  }

  if (routineId === "labels") {
    return "Etiquetas";
  }

  return "Fechamento";
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function roundRatio(value: number): number {
  return Math.round(value * 100) / 100;
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function groupBy<TItem, TKey>(
  items: readonly TItem[],
  keySelector: (item: TItem) => TKey,
): Map<TKey, TItem[]> {
  const groups = new Map<TKey, TItem[]>();

  for (const item of items) {
    const key = keySelector(item);
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }

  return groups;
}

async function hydrateFeedPost(
  post: FeedPost,
  actor: ActorContext,
  feedRepository: FeedRepositoryPort,
): Promise<FeedTimelinePostResult> {
  const [comments, reactions] = await Promise.all([
    feedRepository.listComments(post.id),
    feedRepository.listReactions(post.id),
  ]);

  return {
    authorName: post.authorName,
    caption: post.caption,
    category: post.category,
    comments: selectVisibleComments(comments, actor).map((comment) => ({
      authorName: comment.authorName,
      body: comment.body,
      createdAt: comment.createdAt,
      id: comment.id,
      pendingSync: comment.pendingSync ?? false,
      status: comment.status,
    })),
    createdAt: post.createdAt,
    id: post.id,
    ...(post.missionLink === undefined
      ? {}
      : {
          missionLink: {
            ...(post.missionLink.missionId === undefined ? {} : { missionId: post.missionLink.missionId }),
            ...(post.missionLink.missionTitle === undefined
              ? {}
              : { missionTitle: post.missionLink.missionTitle }),
            ...(post.missionLink.recognitionCategory === undefined
              ? {}
              : { recognitionCategory: post.missionLink.recognitionCategory }),
            recognitionEligible:
              (post.status === "published" || post.status === "featured") &&
              post.photoUrl !== undefined &&
              post.missionLink.recognitionCategory !== undefined,
            rewardEligible:
              (post.status === "published" || post.status === "featured") &&
              post.photoUrl !== undefined &&
              post.missionLink.rewardPoints !== undefined,
            ...(post.missionLink.rewardPoints === undefined
              ? {}
              : { rewardPoints: post.missionLink.rewardPoints }),
            ...(post.missionLink.routineTitle === undefined
              ? {}
              : { routineTitle: post.missionLink.routineTitle }),
          },
        }),
    pendingSync: post.pendingSync ?? false,
    ...(post.photoUrl === undefined ? {} : { photoUrl: post.photoUrl }),
    ...(post.publishedAt === undefined ? {} : { publishedAt: post.publishedAt }),
    reactions: summarizeReactions(reactions, actor.userId),
    status: post.status,
    title: post.title,
    visibility: post.visibility,
  };
}

function summarizeReactions(
  reactions: readonly FeedReaction[],
  viewerUserId: DomainId<"user">,
): readonly FeedReactionSummaryResult[] {
  return Object.entries(reactionLabels).map(([type, label]) => {
    const currentType = type as FeedReactionType;

    return {
      count: reactions.filter((reaction) => reaction.type === currentType).length,
      label,
      selected: reactions.some(
        (reaction) => reaction.type === currentType && reaction.userId === viewerUserId,
      ),
      type: currentType,
    };
  });
}

function selectVisibleComments(
  comments: readonly FeedComment[],
  actor: ActorContext,
): readonly FeedComment[] {
  const canModerate = comments.some((comment) => canModerateFeedScope(actor, comment.scope));

  return comments
    .filter((comment) => {
      if (canModerate) {
        return true;
      }

      if (comment.status === "visible") {
        return true;
      }

      return comment.status === "pending" && comment.authorUserId === actor.userId;
    })
    .sort(sortByMostRecentDate((comment) => comment.createdAt));
}

function toFeedAnnouncementResult(
  announcement: FeedAnnouncement,
  viewerUserId: DomainId<"user">,
): FeedAnnouncementResult {
  return {
    acknowledged: announcement.readByUserIds.includes(viewerUserId),
    body: announcement.body,
    id: announcement.id,
    ...(announcement.publishedAt === undefined ? {} : { publishedAt: announcement.publishedAt }),
    requiredAcknowledgement: announcement.requiredAcknowledgement,
    status: announcement.status,
    title: announcement.title,
  };
}

function toFeedPollResult(
  poll: FeedPoll,
  viewerUserId: DomainId<"user">,
): FeedPollResult {
  const viewerVote = poll.votes.find((vote) => vote.userId === viewerUserId);

  return {
    ...(poll.closesAt === undefined ? {} : { closesAt: poll.closesAt }),
    id: poll.id,
    options: poll.options.map((option) => ({
      id: option.id,
      label: option.label,
      voteCount: poll.votes.filter((vote) => vote.optionId === option.id).length,
    })),
    prompt: poll.prompt,
    status: poll.status,
    title: poll.title,
    totalVotes: poll.votes.length,
    ...(viewerVote === undefined ? {} : { viewerVoteOptionId: viewerVote.optionId }),
  };
}

function toScheduleShiftResult(
  shift: Shift,
  memberLookup: ReadonlyMap<string, ScheduleTeamMember>,
): ScheduleShiftResult {
  return {
    breakMinutes: shift.breakMinutes,
    endsAt: shift.endsAt,
    id: shift.id,
    role: shift.role,
    startsAt: shift.startsAt,
    status: shift.status,
    title: shift.title,
    userId: shift.userId,
    userName: memberLookup.get(shift.userId)?.displayName ?? shift.userId,
  };
}

function toScheduleRequestResult(
  request: ScheduleRequest,
  memberLookup: ReadonlyMap<string, ScheduleTeamMember>,
): ScheduleRequestResult {
  return {
    ...(request.counterpartShiftId === undefined ? {} : { counterpartShiftId: request.counterpartShiftId }),
    ...(request.counterpartUserId === undefined ? {} : { counterpartUserId: request.counterpartUserId }),
    ...(request.counterpartUserId === undefined
      ? {}
      : {
          counterpartUserName:
            memberLookup.get(request.counterpartUserId)?.displayName ?? request.counterpartUserId,
        }),
    createdAt: request.createdAt,
    endsAt: request.endsAt,
    id: request.id,
    kind: request.kind,
    ...(request.note === undefined ? {} : { note: request.note }),
    ...(request.preferredPeriods === undefined ? {} : { preferredPeriods: request.preferredPeriods }),
    requesterUserId: request.requesterUserId,
    requesterUserName: memberLookup.get(request.requesterUserId)?.displayName ?? request.requesterUserId,
    ...(request.reviewedAt === undefined ? {} : { reviewedAt: request.reviewedAt }),
    ...(request.reviewedByUserId === undefined ? {} : { reviewedByUserId: request.reviewedByUserId }),
    ...(request.shiftId === undefined ? {} : { shiftId: request.shiftId }),
    startsAt: request.startsAt,
    status: request.status,
  };
}

function toScheduleNotificationResult(
  notification: ScheduleNotification,
): ScheduleNotificationResult {
  return {
    createdAt: notification.createdAt,
    id: notification.id,
    message: notification.message,
    ...(notification.requestId === undefined ? {} : { requestId: notification.requestId }),
    ...(notification.shiftId === undefined ? {} : { shiftId: notification.shiftId }),
    status: notification.status,
    type: notification.type,
    userId: notification.userId,
  };
}

function toSchedulePlannerIssue(issue: ScheduleValidationResult["issues"][number]): SchedulePlannerIssueResult {
  return {
    ...(issue.coverageId === undefined
      ? {}
      : { coverageId: issue.coverageId as DomainId<"coverage"> }),
    kind: issue.code === "overlapping_shift" ? "overlapping_shift" : "coverage_gap",
    message: issue.message,
    ...(issue.shiftId === undefined ? {} : { shiftId: issue.shiftId as DomainId<"shift"> }),
  };
}

function buildCoverageAlerts(
  shifts: readonly Shift[],
  coverageRequirements: readonly CoverageRequirement[],
): readonly ScheduleCoverageAlertResult[] {
  return coverageRequirements.map((coverageRequirement) => {
    const assignedHeadcount = shifts.filter(
      (shift) =>
        shift.status === "published" &&
        shift.role === coverageRequirement.role &&
        shift.scope.organizationId === coverageRequirement.scope.organizationId &&
        (coverageRequirement.scope.storeId === undefined ||
          shift.scope.storeId === coverageRequirement.scope.storeId) &&
        (coverageRequirement.scope.departmentId === undefined ||
          shift.scope.departmentId === coverageRequirement.scope.departmentId) &&
        shift.startsAt.getTime() < coverageRequirement.endsAt.getTime() &&
        coverageRequirement.startsAt.getTime() < shift.endsAt.getTime(),
    ).length;
    const shortfall = coverageRequirement.requiredHeadcount - assignedHeadcount;

    return {
      assignedHeadcount,
      id: coverageRequirement.id,
      label: coverageRequirement.label,
      periodLabel: `${formatUtcDate(coverageRequirement.startsAt)} / ${formatShiftTimeRange(coverageRequirement)}`,
      requiredHeadcount: coverageRequirement.requiredHeadcount,
      requiredRole: coverageRequirement.role,
      ...(coverageRequirement.routineResponsibility === undefined
        ? {}
        : { routineResponsibility: coverageRequirement.routineResponsibility }),
      severity: shortfall <= 0 ? "ok" : shortfall === 1 ? "warning" : "critical",
    };
  });
}

function buildTimeOffConflictIssues(
  shifts: readonly Shift[],
  requests: readonly ScheduleRequest[],
): readonly SchedulePlannerIssueResult[] {
  const approvedTimeOffRequests = requests.filter(
    (request) => request.kind === "time_off" && request.status === "approved",
  );

  return approvedTimeOffRequests.flatMap((request) =>
    shifts
      .filter(
        (shift) =>
          shift.userId === request.requesterUserId &&
          timeWindowTouchesRange(shift.startsAt, shift.endsAt, request.startsAt, request.endsAt),
      )
      .map((shift) => ({
        kind: "time_off_conflict" as const,
        message: "Ha turno publicado sobrepondo uma folga aprovada.",
        requestId: request.id,
        shiftId: shift.id,
      })),
  );
}

function buildCollaboratorScheduleTimeline(
  shifts: readonly Shift[],
  now: Date,
): readonly ScheduleTimelineDayResult[] {
  const start = startOfUtcDay(now);

  return Array.from({ length: 5 }, (_, index) => {
    const day = addUtcDays(start, index);
    const shiftsForDay = shifts.filter((shift) => isSameUtcDate(shift.startsAt, day));

    return {
      ...(shiftsForDay.length === 0
        ? {}
        : { emphasis: index === 0 ? "high" as const : "medium" as const }),
      id: day.toISOString(),
      label: weekdayLabel(day),
      shift:
        shiftsForDay.length === 0
          ? "Folga"
          : shiftsForDay.length === 1
            ? formatShiftTimeRange(shiftsForDay[0]!)
            : `${shiftsForDay.length} turnos`,
    };
  });
}

function buildLeaderScheduleTimeline(
  shifts: readonly Shift[],
  coverageAlerts: readonly ScheduleCoverageAlertResult[],
  weekStart: Date,
): readonly ScheduleTimelineDayResult[] {
  return Array.from({ length: 7 }, (_, index) => {
    const day = addUtcDays(weekStart, index);
    const shiftsForDay = shifts.filter((shift) => isSameUtcDate(shift.startsAt, day));
    const hasCriticalCoverage = coverageAlerts.some(
      (coverageAlert) =>
        coverageAlert.severity === "critical" &&
        coverageAlert.periodLabel.startsWith(formatUtcDate(day)),
    );

    return {
      ...(hasCriticalCoverage
        ? { emphasis: "high" as const }
        : shiftsForDay.length > 0
          ? { emphasis: "medium" as const }
          : {}),
      id: day.toISOString(),
      label: weekdayLabel(day),
      shift:
        shiftsForDay.length === 0
          ? "Folga"
          : `${shiftsForDay.length} turnos`,
    };
  });
}

function createScheduleMemberLookup(
  teamMembers: readonly ScheduleTeamMember[],
): ReadonlyMap<string, ScheduleTeamMember> {
  return new Map(teamMembers.map((member) => [member.userId, member]));
}

function selectScheduleReviewRecipients(
  teamMembers: readonly ScheduleTeamMember[],
  actorUserId: DomainId<"user">,
): readonly ScheduleTeamMember[] {
  return teamMembers.filter(
    (member) =>
      member.userId !== actorUserId &&
      (member.role === "lider-setor" ||
        member.role === "gerente-loja" ||
        member.role === "admin-organizacao"),
  );
}

function memberNameForUserId(
  teamMembers: readonly ScheduleTeamMember[],
  userId: DomainId<"user">,
): string {
  return teamMembers.find((member) => member.userId === userId)?.displayName ?? userId;
}

async function requireScheduleRequest(
  scheduleRepository: ScheduleRepositoryPort,
  requestId: DomainId<"schedule-request">,
): Promise<ScheduleRequest> {
  const request = await scheduleRepository.findRequestById(requestId);

  if (request === undefined) {
    throw new Error("Schedule request not found.");
  }

  return request;
}

async function requireShift(
  scheduleRepository: ScheduleRepositoryPort,
  shiftId: DomainId<"shift"> | undefined,
): Promise<Shift> {
  if (shiftId === undefined) {
    throw new Error("Shift id is required.");
  }

  const shift = await scheduleRepository.findShiftById(shiftId);

  if (shift === undefined) {
    throw new Error("Shift not found.");
  }

  return shift;
}

function createScheduleRequestId(
  kind: ScheduleRequestKind,
  userId: DomainId<"user">,
  now: Date,
): string {
  return `schedule_request_${kind}_${userId}_${now.getTime()}`;
}

function createScheduleNotificationId(
  type: ScheduleNotificationType,
  userId: DomainId<"user">,
  seed: DomainId<"schedule-request"> | DomainId<"shift">,
  now: Date,
): string {
  return `schedule_notification_${type}_${userId}_${seed}_${now.getTime()}`;
}

function isPendingScheduleRequestStatus(status: ScheduleRequest["status"]): boolean {
  return status === "pending" || status === "accepted";
}

function createTemporaryDraftShift(input: {
  readonly actorUserId: DomainId<"user">;
  readonly breakMinutes: number;
  readonly endsAt: Date;
  readonly now: Date;
  readonly role: FlvRole;
  readonly scope: TenantScope;
  readonly startsAt: Date;
  readonly title: string;
  readonly userId: DomainId<"user">;
}): Shift {
  return createShift({
    breakMinutes: input.breakMinutes,
    createdByUserId: input.actorUserId,
    endsAt: input.endsAt,
    id: `shift_${input.userId}_${input.now.getTime()}`,
    role: input.role,
    scope: input.scope,
    startsAt: input.startsAt,
    status: "draft",
    title: input.title,
    userId: input.userId,
  });
}

function hasShiftChanged(previousShift: Shift, nextShift: Shift): boolean {
  return (
    previousShift.breakMinutes !== nextShift.breakMinutes ||
    previousShift.endsAt.getTime() !== nextShift.endsAt.getTime() ||
    previousShift.startsAt.getTime() !== nextShift.startsAt.getTime() ||
    previousShift.title !== nextShift.title ||
    previousShift.userId !== nextShift.userId
  );
}

function startOfIsoWeek(date: Date): Date {
  const normalized = startOfUtcDay(date);
  const day = normalized.getUTCDay() || 7;

  normalized.setUTCDate(normalized.getUTCDate() - day + 1);

  return normalized;
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(date: Date, days: number): Date {
  const nextDate = new Date(date.getTime());

  nextDate.setUTCDate(nextDate.getUTCDate() + days);

  return nextDate;
}

function timeWindowTouchesRange(
  startsAt: Date,
  endsAt: Date,
  rangeStartsAt: Date,
  rangeEndsAt: Date,
): boolean {
  return startsAt.getTime() < rangeEndsAt.getTime() && rangeStartsAt.getTime() < endsAt.getTime();
}

function formatShiftTimeRange(timeWindow: { readonly endsAt: Date; readonly startsAt: Date }): string {
  return `${formatUtcHourMinute(timeWindow.startsAt)}-${formatUtcHourMinute(timeWindow.endsAt)}`;
}

function formatUtcHourMinute(date: Date): string {
  return `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
}

function formatUtcDate(date: Date): string {
  return `${String(date.getUTCDate()).padStart(2, "0")}/${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function formatWeekLabel(weekStart: Date): string {
  const weekEnd = addUtcDays(weekStart, 6);

  return `Semana ${formatUtcDate(weekStart)}-${formatUtcDate(weekEnd)}`;
}

function weekdayLabel(date: Date): string {
  const weekday = date.getUTCDay();

  if (weekday === 0) {
    return "Dom";
  }

  if (weekday === 1) {
    return "Seg";
  }

  if (weekday === 2) {
    return "Ter";
  }

  if (weekday === 3) {
    return "Qua";
  }

  if (weekday === 4) {
    return "Qui";
  }

  if (weekday === 5) {
    return "Sex";
  }

  return "Sab";
}

async function requirePost(
  feedRepository: FeedRepositoryPort,
  postId: DomainId<"feed-post">,
): Promise<FeedPost> {
  const post = await feedRepository.findPostById(postId);

  if (post === undefined) {
    throw new Error("Feed post not found.");
  }

  return post;
}

function assertFeedPostVisible(post: FeedPost, actor: ActorContext): void {
  if (!isFeedPostVisibleToActor(post, actor)) {
    throw new Error("Feed post is not visible to this actor.");
  }
}

function assertFeedPostMutationAllowed(actor: ActorContext, post: FeedPost): void {
  if (post.authorUserId === actor.userId) {
    return;
  }

  assertUseCaseAuthorized(actor, {
    action: "feed.moderate",
    resource: post.scope,
  });
}

function canModerateFeedScope(actor: ActorContext, scope: TenantScope): boolean {
  return evaluatePermission(toSecurityActor(actor), {
    action: "feed.moderate",
    resource: scope,
  }).allowed;
}

function sortByMostRecentDate<TItem>(pickDate: (item: TItem) => Date) {
  return (left: TItem, right: TItem) => pickDate(right).getTime() - pickDate(left).getTime();
}

function parseCursor(cursor: string | undefined): number {
  if (cursor === undefined) {
    return 0;
  }

  const parsed = Number.parseInt(cursor, 10);

  return Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
}

function createPostId(userId: DomainId<"user">, now: Date): string {
  return `post_${userId}_${now.getTime()}`;
}

function createReactionId(postId: DomainId<"feed-post">, userId: DomainId<"user">): string {
  return `reaction_${postId}_${userId}`;
}

function createCommentId(
  postId: DomainId<"feed-post">,
  userId: DomainId<"user">,
  now: Date,
): string {
  return `comment_${postId}_${userId}_${now.getTime()}`;
}

function createPollVoteId(pollId: DomainId<"poll">, userId: DomainId<"user">): string {
  return `poll_vote_${pollId}_${userId}`;
}

function createFeedbackId(userId: DomainId<"user">, now: Date): string {
  return `feedback_${userId}_${now.getTime()}`;
}

function isSameUtcDate(left: Date, right: Date): boolean {
  return (
    left.getUTCFullYear() === right.getUTCFullYear() &&
    left.getUTCMonth() === right.getUTCMonth() &&
    left.getUTCDate() === right.getUTCDate()
  );
}

function isoWeekFromDate(date: Date): string {
  const normalized = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = normalized.getUTCDay() || 7;

  normalized.setUTCDate(normalized.getUTCDate() + 4 - day);

  const yearStart = new Date(Date.UTC(normalized.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((normalized.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7);

  return `${normalized.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function assertUseCaseAuthorized(actor: ActorContext, request: AuthorizationRequest): void {
  assertAuthorized(toSecurityActor(actor), request);
}

function toSecurityActor(actor: ActorContext): SecurityActor {
  return {
    ...(actor.additionalScopes === undefined ? {} : { additionalScopes: actor.additionalScopes }),
    role: actor.role,
    scope: actor.scope,
    userId: actor.userId,
  };
}
