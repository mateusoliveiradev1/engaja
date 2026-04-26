import type { ApiEnvelope } from "@engaja/contracts";
import type {
  AuthorizationDecision,
  AuthorizationRequest,
  SecurityActor,
} from "@engaja/security";

import { assertAuthorized, evaluatePermission } from "@engaja/security";
import type { ActorContext } from "./context.js";

export interface ApplicationResult<TData> {
  readonly envelope: ApiEnvelope<TData>;
  readonly actor: ActorContext;
}

export interface ApplicationAuthorizationResult {
  readonly actor: ActorContext;
  readonly decision: AuthorizationDecision;
}

export function createApplicationResult<TData>(
  envelope: ApiEnvelope<TData>,
  actor: ActorContext,
): ApplicationResult<TData> {
  return {
    actor,
    envelope,
  };
}

export function authorizeApplicationUseCase(
  actor: ActorContext,
  request: AuthorizationRequest,
): ApplicationAuthorizationResult {
  return {
    actor,
    decision: evaluatePermission(toSecurityActor(actor), request),
  };
}

export function assertApplicationUseCaseAuthorized(
  actor: ActorContext,
  request: AuthorizationRequest,
): void {
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

export {
  createActorContext,
  createApplicationTenantScope,
  createApplicationUserId,
  type ActorContext,
} from "./context.js";
export type {
  EngagementRepositoryPort,
  FeedRepositoryPort,
  MetricsRepositoryPort,
  OperationsRepositoryPort,
  RecognitionRepositoryPort,
  ScheduleRepositoryPort,
  ScheduleTeamMember,
} from "./ports.js";
export {
  toCollaboratorScheduleViewPayload,
  toFeedAnnouncementPayload,
  toFeedFeedbackPayload,
  toFeedHomePayload,
  toFeedPollPayload,
  toFeedTimelinePostPayload,
  toLeaderSchedulePlannerPayload,
  toDashboardSummaryPayload,
  toFeedPostSummaryPayload,
  toOperationsSummaryPayload,
  toRecognitionBadgePayload,
  toRecognitionEventPayload,
  toRecognitionLedgerEntryPayload,
  toRecognitionProfilePayload,
  toRecognitionRankingPayload,
  toRecognitionRewardExplanationPayload,
  toRecognitionSendResultPayload,
  toRecognitionSummaryPayload,
  toScheduleCoverageAlertPayload,
  toScheduleNotificationPayload,
  toSchedulePlannerIssuePayload,
  toSchedulePublishResultPayload,
  toScheduleRequestPayload,
  toScheduleShiftPayload,
  toScheduleSummaryPayload,
  toScheduleTeamMemberPayload,
  toScheduleTimelineDayPayload,
} from "./mappers.js";
export { toOperationsViewPayload } from "./operations-mappers.js";
export {
  toEngagementArchiveItemPayload,
  toEngagementArchivePayload,
  toEngagementArchiveSummaryPayload,
  toEngagementCampaignClosurePayload,
  toEngagementCampaignPayload,
  toEngagementCampaignViewPayload,
  toEngagementRewardGrantPayload,
} from "./engagement-mappers.js";
export {
  completeChecklistItem,
  completeLearningBite,
  createOperationsIssue,
  getOperationsView,
  type OperationsChecklistItemResult,
  type OperationsIssueResult,
  type OperationsLearningBiteResult,
  type OperationsQualityStandardResult,
  type OperationsRoutineResult,
  type OperationsShiftSummaryResult,
  type OperationsViewResult,
} from "./operations.js";
export {
  acknowledgeFeedAnnouncementUseCase,
  approveShiftSwap,
  addFeedTimelineComment,
  createFeedTimelinePost,
  deleteFeedTimelinePost,
  getCollaboratorScheduleView,
  getFeedHome,
  getFeedPostDetail,
  getHealthyRecognitionRanking,
  getLeaderSchedulePlanner,
  getRecognitionProfile,
  grantPointsForEligibleAction,
  listFeedTimeline,
  moderateFeedPost,
  publishSchedule,
  reactToFeedTimelinePost,
  recognizeFeedPost,
  proposeShiftSwap,
  respondToShiftSwap,
  reviewScheduleRequest,
  sendRecognition,
  summarizeDashboard,
  summarizeOperations,
  summarizeRecognition,
  submitPrivateFeedFeedback,
  submitAvailabilityRequest,
  submitTimeOffRequest,
  summarizeSchedule,
  upsertScheduleShift,
  validateScheduleScope,
  updateFeedPostVisibility,
  voteInFeedPollUseCase,
  type CollaboratorScheduleViewResult,
  type CollaboratorRecognitionProfileResult,
  type DashboardSummaryResult,
  type DashboardAttentionAreaKind,
  type DashboardAttentionAreaResult,
  type DashboardChecklistMonitorResult,
  type DashboardContentItemResult,
  type DashboardContentType,
  type DashboardFilterInput,
  type DashboardFiltersResult,
  type DashboardMemberInsightResult,
  type DashboardMetricKey,
  type DashboardMetricResult,
  type DashboardOverviewResult,
  type DashboardRoutineMonitorResult,
  type FeedAnnouncementResult,
  type FeedCommentResult,
  type FeedFeedbackResult,
  type FeedHomeResult,
  type FeedMissionLinkResult,
  type FeedPollOptionResult,
  type FeedPollResult,
  type FeedReactionSummaryResult,
  type FeedTimelinePostResult,
  type LeaderSchedulePlannerResult,
  type OperationsSummaryResult,
  type HealthyRecognitionRankingResult,
  type RecognitionBadgeResult,
  type RecognitionEventResult,
  type RecognitionLedgerEntryResult,
  type RecognitionRankingEntryResult,
  type RecognitionRewardExplanationResult,
  type RecognitionSummaryResult,
  type SendRecognitionResult,
  type ScheduleCoverageAlertResult,
  type ScheduleNotificationResult,
  type SchedulePlannerIssueResult,
  type SchedulePublishResult,
  type ScheduleRequestResult,
  type ScheduleShiftResult,
  type ScheduleSummaryResult,
  type ScheduleTeamMemberResult,
  type ScheduleTimelineDayResult,
} from "./use-cases.js";
export {
  closeEngagementCampaign,
  createEngagementCampaignUseCase,
  getCollaboratorAchievementArchive,
  listEngagementCampaigns,
  syncChecklistEvidenceCampaignScores,
  syncFeedPostCampaignScores,
  updateRewardGrantFulfillment,
  type CollaboratorAchievementArchiveResult,
  type CollaboratorAchievementArchiveSummaryResult,
  type EngagementCampaignClosureResult,
  type EngagementCampaignLeaderboardEntryResult,
  type EngagementCampaignViewResult,
  type EngagementCampaignViewerProgressResult,
} from "./engagement.js";
