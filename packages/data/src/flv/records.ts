import type {
  AvailabilityPeriod,
  AttentionArea,
  AttentionAreaSeverity,
  BadgeAward,
  ChecklistItemCompletion,
  ChecklistRun,
  CompletionStatus,
  CoverageRequirement,
  EvidenceRequirementMode,
  FeedAnnouncement,
  FeedCategory,
  FeedComment,
  FeedCommentStatus,
  FeedContentStatus,
  FeedFeedback,
  FeedFeedbackCategory,
  FeedFeedbackStatus,
  FeedPoll,
  FeedPost,
  FeedPostStatus,
  FeedReaction,
  FeedReactionType,
  FlvRole,
  IssueSeverity,
  IssueStatus,
  MetricSnapshot,
  OperationLearningBite,
  OperationIssue,
  PointsLedgerEntry,
  RecognitionCategory,
  RecognitionEvent,
  RewardSource,
  ScheduleNotification,
  ScheduleNotificationStatus,
  ScheduleNotificationType,
  ScheduleRequest,
  ScheduleRequestKind,
  Shift,
  ShiftStatus,
  TenantScope,
  VisibilityScope,
} from "@engaja/domain";
import {
  createAttentionArea,
  createBadgeAward,
  createChecklistItemCompletion,
  createChecklistRun,
  createCoverageRequirement,
  createFeedAnnouncement,
  createFeedComment,
  createFeedFeedback,
  createFeedPoll,
  createFeedPost,
  createFeedReaction,
  createMetricSnapshot,
  createOperationLearningBite,
  createOperationIssue,
  createPointsLedgerEntry,
  createRecognitionEvent,
  createScheduleNotification,
  createScheduleRequest,
  createShift,
  createTenantScope,
} from "@engaja/domain";

export interface FeedMissionLinkRecord {
  readonly missionId?: string;
  readonly missionTitle?: string;
  readonly recognitionCategory?: RecognitionCategory;
  readonly rewardPoints?: number;
  readonly routineTitle?: string;
}

export interface FeedPostRecord {
  readonly authorName: string;
  readonly authorUserId: string;
  readonly caption: string;
  readonly category: FeedCategory;
  readonly createdAt: string;
  readonly departmentId?: string;
  readonly featuredAt?: string;
  readonly id: string;
  readonly missionLink?: FeedMissionLinkRecord;
  readonly organizationId: string;
  readonly pendingSync?: boolean;
  readonly photoUrl?: string;
  readonly pinnedAt?: string;
  readonly publishedAt?: string;
  readonly status: FeedPostStatus;
  readonly storeId?: string;
  readonly title: string;
  readonly updatedAt: string;
  readonly visibility: VisibilityScope;
}

export interface FeedReactionRecord {
  readonly createdAt: string;
  readonly departmentId?: string;
  readonly id: string;
  readonly organizationId: string;
  readonly postId: string;
  readonly storeId?: string;
  readonly type: FeedReactionType;
  readonly userId: string;
}

export interface FeedCommentRecord {
  readonly authorName: string;
  readonly authorUserId: string;
  readonly body: string;
  readonly createdAt: string;
  readonly departmentId?: string;
  readonly id: string;
  readonly moderationReason?: string;
  readonly organizationId: string;
  readonly pendingSync?: boolean;
  readonly postId: string;
  readonly status: FeedCommentStatus;
  readonly storeId?: string;
  readonly updatedAt: string;
}

export interface FeedAnnouncementRecord {
  readonly body: string;
  readonly createdAt: string;
  readonly createdByUserId?: string;
  readonly departmentId?: string;
  readonly id: string;
  readonly organizationId: string;
  readonly publishedAt?: string;
  readonly readByUserIds: readonly string[];
  readonly requiredAcknowledgement: boolean;
  readonly status: FeedContentStatus;
  readonly storeId?: string;
  readonly title: string;
}

export interface FeedPollOptionRecord {
  readonly id: string;
  readonly label: string;
  readonly sortOrder: number;
}

export interface FeedPollVoteRecord {
  readonly createdAt: string;
  readonly id: string;
  readonly optionId: string;
  readonly pollId: string;
  readonly userId: string;
}

export interface FeedPollRecord {
  readonly closesAt?: string;
  readonly createdAt: string;
  readonly createdByUserId?: string;
  readonly departmentId?: string;
  readonly id: string;
  readonly options: readonly FeedPollOptionRecord[];
  readonly organizationId: string;
  readonly prompt: string;
  readonly status: FeedContentStatus;
  readonly storeId?: string;
  readonly title: string;
  readonly votes: readonly FeedPollVoteRecord[];
}

export interface FeedFeedbackRecord {
  readonly authorUserId: string;
  readonly category: FeedFeedbackCategory;
  readonly createdAt: string;
  readonly departmentId?: string;
  readonly id: string;
  readonly message: string;
  readonly organizationId: string;
  readonly status: FeedFeedbackStatus;
  readonly storeId?: string;
}

export interface ShiftRecord {
  readonly breakMinutes: number;
  readonly createdByUserId?: string;
  readonly departmentId?: string;
  readonly endsAt: string;
  readonly id: string;
  readonly organizationId: string;
  readonly publishedAt?: string;
  readonly role: FlvRole;
  readonly startsAt: string;
  readonly status: ShiftStatus;
  readonly storeId?: string;
  readonly title: string;
  readonly userId: string;
}

export interface CoverageRequirementRecord {
  readonly departmentId?: string;
  readonly endsAt: string;
  readonly id: string;
  readonly label: string;
  readonly organizationId: string;
  readonly role: FlvRole;
  readonly requiredHeadcount: number;
  readonly routineResponsibility?: string;
  readonly startsAt: string;
  readonly storeId?: string;
}

export interface ScheduleRequestRecord {
  readonly counterpartShiftId?: string;
  readonly counterpartUserId?: string;
  readonly createdAt: string;
  readonly departmentId?: string;
  readonly endsAt: string;
  readonly id: string;
  readonly kind: ScheduleRequestKind;
  readonly note?: string;
  readonly organizationId: string;
  readonly preferredPeriods?: readonly AvailabilityPeriod[];
  readonly reviewedAt?: string;
  readonly reviewedByUserId?: string;
  readonly requesterUserId: string;
  readonly shiftId?: string;
  readonly startsAt: string;
  readonly status: "accepted" | "approved" | "cancelled" | "pending" | "rejected";
  readonly storeId?: string;
}

export interface ScheduleNotificationRecord {
  readonly createdAt: string;
  readonly departmentId?: string;
  readonly id: string;
  readonly message: string;
  readonly organizationId: string;
  readonly requestId?: string;
  readonly shiftId?: string;
  readonly status: ScheduleNotificationStatus;
  readonly storeId?: string;
  readonly type: ScheduleNotificationType;
  readonly userId: string;
}

export interface ScheduleTeamMemberRecord {
  readonly departmentId?: string;
  readonly displayName: string;
  readonly organizationId: string;
  readonly role: FlvRole;
  readonly storeId?: string;
  readonly userId: string;
}

export interface ChecklistRunRecord {
  readonly assignedUserId?: string;
  readonly completedAt?: string;
  readonly departmentId?: string;
  readonly dueAt: string;
  readonly id: string;
  readonly organizationId: string;
  readonly pendingSync: boolean;
  readonly routineId: string;
  readonly shiftId?: string;
  readonly status: CompletionStatus;
  readonly storeId?: string;
}

export interface ChecklistItemCompletionRecord {
  readonly completedAt?: string;
  readonly completedByUserId?: string;
  readonly departmentId?: string;
  readonly evidenceMode: EvidenceRequirementMode;
  readonly evidencePhotoUrl?: string;
  readonly id: string;
  readonly itemId: string;
  readonly note?: string;
  readonly organizationId: string;
  readonly pendingSync: boolean;
  readonly runId: string;
  readonly shiftId?: string;
  readonly status: CompletionStatus;
  readonly storeId?: string;
}

export interface OperationIssueRecord {
  readonly category: string;
  readonly createdAt: string;
  readonly departmentId?: string;
  readonly evidencePhotoUrls: readonly string[];
  readonly id: string;
  readonly note?: string;
  readonly organizationId: string;
  readonly pendingSync: boolean;
  readonly productName?: string;
  readonly quantity?: number;
  readonly reportedByUserId?: string;
  readonly severity: IssueSeverity;
  readonly shiftId?: string;
  readonly status: IssueStatus;
  readonly storeId?: string;
}

export interface OperationLearningBiteRecord {
  readonly completedAt?: string;
  readonly completedByUserId?: string;
  readonly departmentId?: string;
  readonly description: string;
  readonly durationMinutes: number;
  readonly feedPostId?: string;
  readonly id: string;
  readonly missionTitle?: string;
  readonly organizationId: string;
  readonly pendingSync: boolean;
  readonly pointsAwarded?: number;
  readonly standardId?: string;
  readonly storeId?: string;
  readonly title: string;
}

export interface PointsLedgerRecord {
  readonly actorUserId?: string;
  readonly amount: number;
  readonly departmentId?: string;
  readonly id: string;
  readonly occurredAt: string;
  readonly organizationId: string;
  readonly reason: string;
  readonly source: RewardSource;
  readonly sourceId?: string;
  readonly storeId?: string;
  readonly userId: string;
}

export interface BadgeAwardRecord {
  readonly awardedAt: string;
  readonly code: string;
  readonly departmentId?: string;
  readonly id: string;
  readonly organizationId: string;
  readonly storeId?: string;
  readonly userId: string;
}

export interface RecognitionEventRecord {
  readonly category: RecognitionCategory;
  readonly createdAt: string;
  readonly departmentId?: string;
  readonly id: string;
  readonly message: string;
  readonly organizationId: string;
  readonly pointsAwarded: number;
  readonly recipientUserId: string;
  readonly senderUserId?: string;
  readonly sourceFeedPostId?: string;
  readonly storeId?: string;
}

export interface MetricSnapshotRecord {
  readonly capturedAt: string;
  readonly departmentId?: string;
  readonly id: string;
  readonly key: string;
  readonly organizationId: string;
  readonly storeId?: string;
  readonly value: number;
}

export interface AttentionAreaRecord {
  readonly createdAt: string;
  readonly departmentId?: string;
  readonly description: string;
  readonly id: string;
  readonly organizationId: string;
  readonly severity: AttentionAreaSeverity;
  readonly storeId?: string;
  readonly title: string;
}

export function toFeedPost(record: FeedPostRecord): FeedPost {
  return createFeedPost({
    authorName: record.authorName,
    authorUserId: record.authorUserId,
    caption: record.caption,
    category: record.category,
    createdAt: new Date(record.createdAt),
    ...(record.featuredAt === undefined ? {} : { featuredAt: new Date(record.featuredAt) }),
    id: record.id,
    ...(record.missionLink === undefined ? {} : { missionLink: record.missionLink }),
    ...(record.pendingSync === true ? { pendingSync: true } : {}),
    ...(record.photoUrl === undefined ? {} : { photoUrl: record.photoUrl }),
    ...(record.pinnedAt === undefined ? {} : { pinnedAt: new Date(record.pinnedAt) }),
    ...(record.publishedAt === undefined ? {} : { publishedAt: new Date(record.publishedAt) }),
    scope: toScope(record),
    status: record.status,
    title: record.title,
    updatedAt: new Date(record.updatedAt),
    visibility: record.visibility,
  });
}

export function fromFeedPost(post: FeedPost): FeedPostRecord {
  return {
    authorName: post.authorName,
    authorUserId: post.authorUserId,
    caption: post.caption,
    category: post.category,
    createdAt: post.createdAt.toISOString(),
    ...(post.scope.departmentId === undefined ? {} : { departmentId: post.scope.departmentId }),
    ...(post.featuredAt === undefined ? {} : { featuredAt: post.featuredAt.toISOString() }),
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
            ...(post.missionLink.rewardPoints === undefined
              ? {}
              : { rewardPoints: post.missionLink.rewardPoints }),
            ...(post.missionLink.routineTitle === undefined
              ? {}
              : { routineTitle: post.missionLink.routineTitle }),
          },
        }),
    organizationId: post.scope.organizationId,
    ...(post.pendingSync === true ? { pendingSync: true } : {}),
    ...(post.photoUrl === undefined ? {} : { photoUrl: post.photoUrl }),
    ...(post.pinnedAt === undefined ? {} : { pinnedAt: post.pinnedAt.toISOString() }),
    ...(post.publishedAt === undefined ? {} : { publishedAt: post.publishedAt.toISOString() }),
    status: post.status,
    ...(post.scope.storeId === undefined ? {} : { storeId: post.scope.storeId }),
    title: post.title,
    updatedAt: post.updatedAt.toISOString(),
    visibility: post.visibility,
  };
}

export function toFeedReaction(record: FeedReactionRecord): FeedReaction {
  return createFeedReaction({
    createdAt: new Date(record.createdAt),
    id: record.id,
    postId: record.postId,
    scope: toScope(record),
    type: record.type,
    userId: record.userId,
  });
}

export function fromFeedReaction(reaction: FeedReaction): FeedReactionRecord {
  return {
    createdAt: reaction.createdAt.toISOString(),
    ...(reaction.scope.departmentId === undefined ? {} : { departmentId: reaction.scope.departmentId }),
    id: reaction.id,
    organizationId: reaction.scope.organizationId,
    postId: reaction.postId,
    ...(reaction.scope.storeId === undefined ? {} : { storeId: reaction.scope.storeId }),
    type: reaction.type,
    userId: reaction.userId,
  };
}

export function toFeedComment(record: FeedCommentRecord): FeedComment {
  return createFeedComment({
    authorName: record.authorName,
    authorUserId: record.authorUserId,
    body: record.body,
    createdAt: new Date(record.createdAt),
    id: record.id,
    ...(record.moderationReason === undefined ? {} : { moderationReason: record.moderationReason }),
    ...(record.pendingSync === true ? { pendingSync: true } : {}),
    postId: record.postId,
    scope: toScope(record),
    status: record.status,
    updatedAt: new Date(record.updatedAt),
  });
}

export function fromFeedComment(comment: FeedComment): FeedCommentRecord {
  return {
    authorName: comment.authorName,
    authorUserId: comment.authorUserId,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    ...(comment.scope.departmentId === undefined ? {} : { departmentId: comment.scope.departmentId }),
    id: comment.id,
    ...(comment.moderationReason === undefined ? {} : { moderationReason: comment.moderationReason }),
    organizationId: comment.scope.organizationId,
    ...(comment.pendingSync === true ? { pendingSync: true } : {}),
    postId: comment.postId,
    status: comment.status,
    ...(comment.scope.storeId === undefined ? {} : { storeId: comment.scope.storeId }),
    updatedAt: comment.updatedAt.toISOString(),
  };
}

export function toFeedAnnouncement(record: FeedAnnouncementRecord): FeedAnnouncement {
  return createFeedAnnouncement({
    body: record.body,
    createdAt: new Date(record.createdAt),
    ...(record.createdByUserId === undefined ? {} : { createdByUserId: record.createdByUserId }),
    id: record.id,
    ...(record.publishedAt === undefined ? {} : { publishedAt: new Date(record.publishedAt) }),
    readByUserIds: record.readByUserIds,
    requiredAcknowledgement: record.requiredAcknowledgement,
    scope: toScope(record),
    status: record.status,
    title: record.title,
  });
}

export function fromFeedAnnouncement(announcement: FeedAnnouncement): FeedAnnouncementRecord {
  return {
    body: announcement.body,
    createdAt: announcement.createdAt.toISOString(),
    ...(announcement.createdByUserId === undefined
      ? {}
      : { createdByUserId: announcement.createdByUserId }),
    ...(announcement.scope.departmentId === undefined
      ? {}
      : { departmentId: announcement.scope.departmentId }),
    id: announcement.id,
    organizationId: announcement.scope.organizationId,
    ...(announcement.publishedAt === undefined
      ? {}
      : { publishedAt: announcement.publishedAt.toISOString() }),
    readByUserIds: [...announcement.readByUserIds],
    requiredAcknowledgement: announcement.requiredAcknowledgement,
    status: announcement.status,
    ...(announcement.scope.storeId === undefined ? {} : { storeId: announcement.scope.storeId }),
    title: announcement.title,
  };
}

export function toFeedPoll(record: FeedPollRecord): FeedPoll {
  return createFeedPoll({
    ...(record.closesAt === undefined ? {} : { closesAt: new Date(record.closesAt) }),
    createdAt: new Date(record.createdAt),
    ...(record.createdByUserId === undefined ? {} : { createdByUserId: record.createdByUserId }),
    id: record.id,
    options: record.options,
    prompt: record.prompt,
    scope: toScope(record),
    status: record.status,
    title: record.title,
    votes: record.votes.map((vote) => ({
      createdAt: new Date(vote.createdAt),
      id: vote.id,
      optionId: vote.optionId,
      pollId: vote.pollId,
      userId: vote.userId,
    })),
  });
}

export function fromFeedPoll(poll: FeedPoll): FeedPollRecord {
  return {
    ...(poll.closesAt === undefined ? {} : { closesAt: poll.closesAt.toISOString() }),
    createdAt: poll.createdAt.toISOString(),
    ...(poll.createdByUserId === undefined ? {} : { createdByUserId: poll.createdByUserId }),
    ...(poll.scope.departmentId === undefined ? {} : { departmentId: poll.scope.departmentId }),
    id: poll.id,
    options: poll.options.map((option) => ({
      id: option.id,
      label: option.label,
      sortOrder: option.sortOrder,
    })),
    organizationId: poll.scope.organizationId,
    prompt: poll.prompt,
    status: poll.status,
    ...(poll.scope.storeId === undefined ? {} : { storeId: poll.scope.storeId }),
    title: poll.title,
    votes: poll.votes.map((vote) => ({
      createdAt: vote.createdAt.toISOString(),
      id: vote.id,
      optionId: vote.optionId,
      pollId: vote.pollId,
      userId: vote.userId,
    })),
  };
}

export function toFeedFeedback(record: FeedFeedbackRecord): FeedFeedback {
  return createFeedFeedback({
    authorUserId: record.authorUserId,
    category: record.category,
    createdAt: new Date(record.createdAt),
    id: record.id,
    message: record.message,
    scope: toScope(record),
    status: record.status,
  });
}

export function fromFeedFeedback(feedback: FeedFeedback): FeedFeedbackRecord {
  return {
    authorUserId: feedback.authorUserId,
    category: feedback.category,
    createdAt: feedback.createdAt.toISOString(),
    ...(feedback.scope.departmentId === undefined ? {} : { departmentId: feedback.scope.departmentId }),
    id: feedback.id,
    message: feedback.message,
    organizationId: feedback.scope.organizationId,
    status: feedback.status,
    ...(feedback.scope.storeId === undefined ? {} : { storeId: feedback.scope.storeId }),
  };
}

export function toShift(record: ShiftRecord): Shift {
  return createShift({
    breakMinutes: record.breakMinutes,
    ...(record.createdByUserId === undefined ? {} : { createdByUserId: record.createdByUserId }),
    endsAt: new Date(record.endsAt),
    id: record.id,
    ...(record.publishedAt === undefined ? {} : { publishedAt: new Date(record.publishedAt) }),
    role: record.role,
    scope: toScope(record),
    startsAt: new Date(record.startsAt),
    status: record.status,
    title: record.title,
    userId: record.userId,
  });
}

export function fromShift(shift: Shift): ShiftRecord {
  return {
    breakMinutes: shift.breakMinutes,
    ...(shift.createdByUserId === undefined ? {} : { createdByUserId: shift.createdByUserId }),
    ...(shift.scope.departmentId === undefined ? {} : { departmentId: shift.scope.departmentId }),
    endsAt: shift.endsAt.toISOString(),
    id: shift.id,
    organizationId: shift.scope.organizationId,
    ...(shift.publishedAt === undefined ? {} : { publishedAt: shift.publishedAt.toISOString() }),
    role: shift.role,
    startsAt: shift.startsAt.toISOString(),
    status: shift.status,
    ...(shift.scope.storeId === undefined ? {} : { storeId: shift.scope.storeId }),
    title: shift.title,
    userId: shift.userId,
  };
}

export function toCoverageRequirement(record: CoverageRequirementRecord): CoverageRequirement {
  return createCoverageRequirement({
    endsAt: new Date(record.endsAt),
    id: record.id,
    label: record.label,
    role: record.role,
    requiredHeadcount: record.requiredHeadcount,
    ...(record.routineResponsibility === undefined
      ? {}
      : { routineResponsibility: record.routineResponsibility }),
    scope: toScope(record),
    startsAt: new Date(record.startsAt),
  });
}

export function toScheduleRequest(record: ScheduleRequestRecord): ScheduleRequest {
  return createScheduleRequest({
    ...(record.counterpartShiftId === undefined
      ? {}
      : { counterpartShiftId: record.counterpartShiftId }),
    ...(record.counterpartUserId === undefined ? {} : { counterpartUserId: record.counterpartUserId }),
    createdAt: new Date(record.createdAt),
    endsAt: new Date(record.endsAt),
    id: record.id,
    kind: record.kind,
    ...(record.note === undefined ? {} : { note: record.note }),
    ...(record.preferredPeriods === undefined ? {} : { preferredPeriods: record.preferredPeriods }),
    ...(record.reviewedAt === undefined ? {} : { reviewedAt: new Date(record.reviewedAt) }),
    ...(record.reviewedByUserId === undefined
      ? {}
      : { reviewedByUserId: record.reviewedByUserId }),
    requesterUserId: record.requesterUserId,
    scope: toScope(record),
    ...(record.shiftId === undefined ? {} : { shiftId: record.shiftId }),
    startsAt: new Date(record.startsAt),
    status: record.status,
  });
}

export function fromScheduleRequest(request: ScheduleRequest): ScheduleRequestRecord {
  return {
    ...(request.counterpartShiftId === undefined
      ? {}
      : { counterpartShiftId: request.counterpartShiftId }),
    ...(request.counterpartUserId === undefined
      ? {}
      : { counterpartUserId: request.counterpartUserId }),
    createdAt: request.createdAt.toISOString(),
    ...(request.scope.departmentId === undefined ? {} : { departmentId: request.scope.departmentId }),
    endsAt: request.endsAt.toISOString(),
    id: request.id,
    kind: request.kind,
    ...(request.note === undefined ? {} : { note: request.note }),
    organizationId: request.scope.organizationId,
    ...(request.preferredPeriods === undefined ? {} : { preferredPeriods: request.preferredPeriods }),
    ...(request.reviewedAt === undefined ? {} : { reviewedAt: request.reviewedAt.toISOString() }),
    ...(request.reviewedByUserId === undefined
      ? {}
      : { reviewedByUserId: request.reviewedByUserId }),
    requesterUserId: request.requesterUserId,
    ...(request.shiftId === undefined ? {} : { shiftId: request.shiftId }),
    startsAt: request.startsAt.toISOString(),
    status: request.status,
    ...(request.scope.storeId === undefined ? {} : { storeId: request.scope.storeId }),
  };
}

export function toScheduleNotification(
  record: ScheduleNotificationRecord,
): ScheduleNotification {
  return createScheduleNotification({
    createdAt: new Date(record.createdAt),
    id: record.id,
    message: record.message,
    ...(record.requestId === undefined ? {} : { requestId: record.requestId }),
    scope: toScope(record),
    ...(record.shiftId === undefined ? {} : { shiftId: record.shiftId }),
    status: record.status,
    type: record.type,
    userId: record.userId,
  });
}

export function fromScheduleNotification(
  notification: ScheduleNotification,
): ScheduleNotificationRecord {
  return {
    createdAt: notification.createdAt.toISOString(),
    ...(notification.scope.departmentId === undefined
      ? {}
      : { departmentId: notification.scope.departmentId }),
    id: notification.id,
    message: notification.message,
    organizationId: notification.scope.organizationId,
    ...(notification.requestId === undefined ? {} : { requestId: notification.requestId }),
    ...(notification.shiftId === undefined ? {} : { shiftId: notification.shiftId }),
    status: notification.status,
    ...(notification.scope.storeId === undefined ? {} : { storeId: notification.scope.storeId }),
    type: notification.type,
    userId: notification.userId,
  };
}

export function toChecklistRun(record: ChecklistRunRecord): ChecklistRun {
  return createChecklistRun({
    ...(record.assignedUserId === undefined ? {} : { assignedUserId: record.assignedUserId }),
    ...(record.completedAt === undefined ? {} : { completedAt: new Date(record.completedAt) }),
    dueAt: new Date(record.dueAt),
    id: record.id,
    pendingSync: record.pendingSync,
    routineId: record.routineId as ChecklistRun["routineId"],
    scope: toScope(record),
    ...(record.shiftId === undefined ? {} : { shiftId: record.shiftId }),
    status: record.status,
  });
}

export function fromChecklistRun(run: ChecklistRun): ChecklistRunRecord {
  return {
    ...(run.assignedUserId === undefined ? {} : { assignedUserId: run.assignedUserId }),
    ...(run.completedAt === undefined ? {} : { completedAt: run.completedAt.toISOString() }),
    ...(run.scope.departmentId === undefined ? {} : { departmentId: run.scope.departmentId }),
    dueAt: run.dueAt.toISOString(),
    id: run.id,
    organizationId: run.scope.organizationId,
    pendingSync: run.pendingSync,
    routineId: run.routineId,
    ...(run.shiftId === undefined ? {} : { shiftId: run.shiftId }),
    status: run.status,
    ...(run.scope.storeId === undefined ? {} : { storeId: run.scope.storeId }),
  };
}

export function toChecklistItemCompletion(
  record: ChecklistItemCompletionRecord,
): ChecklistItemCompletion {
  return createChecklistItemCompletion({
    ...(record.completedAt === undefined ? {} : { completedAt: new Date(record.completedAt) }),
    ...(record.completedByUserId === undefined
      ? {}
      : { completedByUserId: record.completedByUserId }),
    evidenceMode: record.evidenceMode,
    ...(record.evidencePhotoUrl === undefined
      ? {}
      : { evidencePhotoUrl: record.evidencePhotoUrl }),
    id: record.id,
    itemId: record.itemId,
    ...(record.note === undefined ? {} : { note: record.note }),
    pendingSync: record.pendingSync,
    runId: record.runId,
    scope: toScope(record),
    ...(record.shiftId === undefined ? {} : { shiftId: record.shiftId }),
    status: record.status,
  });
}

export function fromChecklistItemCompletion(
  completion: ChecklistItemCompletion,
): ChecklistItemCompletionRecord {
  return {
    ...(completion.completedAt === undefined
      ? {}
      : { completedAt: completion.completedAt.toISOString() }),
    ...(completion.completedByUserId === undefined
      ? {}
      : { completedByUserId: completion.completedByUserId }),
    ...(completion.scope.departmentId === undefined
      ? {}
      : { departmentId: completion.scope.departmentId }),
    evidenceMode: completion.evidenceMode,
    ...(completion.evidencePhotoUrl === undefined
      ? {}
      : { evidencePhotoUrl: completion.evidencePhotoUrl }),
    id: completion.id,
    itemId: completion.itemId,
    ...(completion.note === undefined ? {} : { note: completion.note }),
    organizationId: completion.scope.organizationId,
    pendingSync: completion.pendingSync,
    runId: completion.runId,
    ...(completion.shiftId === undefined ? {} : { shiftId: completion.shiftId }),
    status: completion.status,
    ...(completion.scope.storeId === undefined ? {} : { storeId: completion.scope.storeId }),
  };
}

export function toOperationIssue(record: OperationIssueRecord): OperationIssue {
  return createOperationIssue({
    category: record.category,
    createdAt: new Date(record.createdAt),
    evidencePhotoUrls: record.evidencePhotoUrls,
    id: record.id,
    ...(record.note === undefined ? {} : { note: record.note }),
    pendingSync: record.pendingSync,
    ...(record.productName === undefined ? {} : { productName: record.productName }),
    ...(record.quantity === undefined ? {} : { quantity: record.quantity }),
    ...(record.reportedByUserId === undefined
      ? {}
      : { reportedByUserId: record.reportedByUserId }),
    scope: toScope(record),
    severity: record.severity,
    ...(record.shiftId === undefined ? {} : { shiftId: record.shiftId }),
    status: record.status,
  });
}

export function fromOperationIssue(issue: OperationIssue): OperationIssueRecord {
  return {
    category: issue.category,
    createdAt: issue.createdAt.toISOString(),
    ...(issue.scope.departmentId === undefined ? {} : { departmentId: issue.scope.departmentId }),
    evidencePhotoUrls: [...issue.evidencePhotoUrls],
    id: issue.id,
    ...(issue.note === undefined ? {} : { note: issue.note }),
    organizationId: issue.scope.organizationId,
    pendingSync: issue.pendingSync,
    ...(issue.productName === undefined ? {} : { productName: issue.productName }),
    ...(issue.quantity === undefined ? {} : { quantity: issue.quantity }),
    ...(issue.reportedByUserId === undefined ? {} : { reportedByUserId: issue.reportedByUserId }),
    severity: issue.severity,
    ...(issue.shiftId === undefined ? {} : { shiftId: issue.shiftId }),
    status: issue.status,
    ...(issue.scope.storeId === undefined ? {} : { storeId: issue.scope.storeId }),
  };
}

export function toOperationLearningBite(
  record: OperationLearningBiteRecord,
): OperationLearningBite {
  return createOperationLearningBite({
    ...(record.completedAt === undefined ? {} : { completedAt: new Date(record.completedAt) }),
    ...(record.completedByUserId === undefined
      ? {}
      : { completedByUserId: record.completedByUserId }),
    description: record.description,
    durationMinutes: record.durationMinutes,
    ...(record.feedPostId === undefined ? {} : { feedPostId: record.feedPostId }),
    id: record.id,
    ...(record.missionTitle === undefined ? {} : { missionTitle: record.missionTitle }),
    pendingSync: record.pendingSync,
    ...(record.pointsAwarded === undefined ? {} : { pointsAwarded: record.pointsAwarded }),
    scope: toScope(record),
    ...(record.standardId === undefined ? {} : { standardId: record.standardId }),
    title: record.title,
  });
}

export function fromOperationLearningBite(
  bite: OperationLearningBite,
): OperationLearningBiteRecord {
  return {
    ...(bite.completedAt === undefined ? {} : { completedAt: bite.completedAt.toISOString() }),
    ...(bite.completedByUserId === undefined
      ? {}
      : { completedByUserId: bite.completedByUserId }),
    ...(bite.scope.departmentId === undefined ? {} : { departmentId: bite.scope.departmentId }),
    description: bite.description,
    durationMinutes: bite.durationMinutes,
    ...(bite.feedPostId === undefined ? {} : { feedPostId: bite.feedPostId }),
    id: bite.id,
    ...(bite.missionTitle === undefined ? {} : { missionTitle: bite.missionTitle }),
    organizationId: bite.scope.organizationId,
    pendingSync: bite.pendingSync,
    ...(bite.pointsAwarded === undefined ? {} : { pointsAwarded: bite.pointsAwarded }),
    ...(bite.standardId === undefined ? {} : { standardId: bite.standardId }),
    ...(bite.scope.storeId === undefined ? {} : { storeId: bite.scope.storeId }),
    title: bite.title,
  };
}

export function toPointsLedgerEntry(record: PointsLedgerRecord): PointsLedgerEntry {
  return createPointsLedgerEntry({
    ...(record.actorUserId === undefined ? {} : { actorUserId: record.actorUserId }),
    amount: record.amount,
    id: record.id,
    occurredAt: new Date(record.occurredAt),
    reason: record.reason,
    scope: toScope(record),
    source: record.source,
    ...(record.sourceId === undefined ? {} : { sourceId: record.sourceId }),
    userId: record.userId,
  });
}

export function fromPointsLedgerEntry(entry: PointsLedgerEntry): PointsLedgerRecord {
  return {
    ...(entry.actorUserId === undefined ? {} : { actorUserId: entry.actorUserId }),
    amount: entry.amount,
    ...(entry.scope.departmentId === undefined ? {} : { departmentId: entry.scope.departmentId }),
    id: entry.id,
    occurredAt: entry.occurredAt.toISOString(),
    organizationId: entry.scope.organizationId,
    reason: entry.reason,
    source: entry.source,
    ...(entry.sourceId === undefined ? {} : { sourceId: entry.sourceId }),
    ...(entry.scope.storeId === undefined ? {} : { storeId: entry.scope.storeId }),
    userId: entry.userId,
  };
}

export function toBadgeAward(record: BadgeAwardRecord): BadgeAward {
  return createBadgeAward({
    awardedAt: new Date(record.awardedAt),
    code: record.code,
    id: record.id,
    scope: toScope(record),
    userId: record.userId,
  });
}

export function toRecognitionEvent(record: RecognitionEventRecord): RecognitionEvent {
  return createRecognitionEvent({
    category: record.category,
    createdAt: new Date(record.createdAt),
    id: record.id,
    message: record.message,
    pointsAwarded: record.pointsAwarded,
    recipientUserId: record.recipientUserId,
    ...(record.senderUserId === undefined ? {} : { senderUserId: record.senderUserId }),
    ...(record.sourceFeedPostId === undefined
      ? {}
      : { sourceFeedPostId: record.sourceFeedPostId }),
    scope: toScope(record),
  });
}

export function fromRecognitionEvent(event: RecognitionEvent): RecognitionEventRecord {
  return {
    category: event.category,
    createdAt: event.createdAt.toISOString(),
    ...(event.scope.departmentId === undefined ? {} : { departmentId: event.scope.departmentId }),
    id: event.id,
    message: event.message,
    organizationId: event.scope.organizationId,
    pointsAwarded: event.pointsAwarded,
    recipientUserId: event.recipientUserId,
    ...(event.senderUserId === undefined ? {} : { senderUserId: event.senderUserId }),
    ...(event.sourceFeedPostId === undefined
      ? {}
      : { sourceFeedPostId: event.sourceFeedPostId }),
    ...(event.scope.storeId === undefined ? {} : { storeId: event.scope.storeId }),
  };
}

export function toMetricSnapshot(record: MetricSnapshotRecord): MetricSnapshot {
  return createMetricSnapshot({
    capturedAt: new Date(record.capturedAt),
    id: record.id,
    key: record.key,
    scope: toScope(record),
    value: record.value,
  });
}

export function toAttentionArea(record: AttentionAreaRecord): AttentionArea {
  return createAttentionArea({
    createdAt: new Date(record.createdAt),
    description: record.description,
    id: record.id,
    scope: toScope(record),
    severity: record.severity,
    title: record.title,
  });
}

function toScope(record: {
  readonly departmentId?: string;
  readonly organizationId: string;
  readonly storeId?: string;
}): TenantScope {
  return createTenantScope({
    ...(record.departmentId === undefined ? {} : { departmentId: record.departmentId }),
    organizationId: record.organizationId,
    ...(record.storeId === undefined ? {} : { storeId: record.storeId }),
  });
}
