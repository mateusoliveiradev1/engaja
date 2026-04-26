import {
  collaboratorScheduleViewSchema,
  dashboardSummarySchema,
  feedAnnouncementPayloadSchema,
  feedFeedbackPayloadSchema,
  feedHomePayloadSchema,
  feedPollPayloadSchema,
  feedPostPayloadSchema,
  feedPostSummarySchema,
  leaderSchedulePlannerSchema,
  operationsSummarySchema,
  recognitionBadgePayloadSchema,
  recognitionEventPayloadSchema,
  recognitionLedgerEntryPayloadSchema,
  recognitionProfilePayloadSchema,
  recognitionRankingPayloadSchema,
  recognitionRewardExplanationPayloadSchema,
  recognitionSendResultPayloadSchema,
  recognitionSummarySchema,
  scheduleCoverageAlertPayloadSchema,
  scheduleNotificationPayloadSchema,
  schedulePlannerIssuePayloadSchema,
  schedulePublishResultSchema,
  scheduleRequestPayloadSchema,
  scheduleShiftPayloadSchema,
  scheduleSummarySchema,
  scheduleTeamMemberPayloadSchema,
  scheduleTimelineDaySchema,
  type DashboardSummaryPayload,
  type CollaboratorScheduleViewPayload,
  type FeedAnnouncementPayload,
  type FeedFeedbackPayload,
  type FeedHomePayload,
  type FeedPollPayload,
  type FeedPostPayload,
  type FeedPostSummaryPayload,
  type LeaderSchedulePlannerPayload,
  type OperationsSummaryPayload,
  type RecognitionBadgePayload,
  type RecognitionEventPayload,
  type RecognitionLedgerEntryPayload,
  type RecognitionProfilePayload,
  type RecognitionRankingPayload,
  type RecognitionRewardExplanationPayload,
  type RecognitionSendResultPayload,
  type RecognitionSummaryPayload,
  type ScheduleCoverageAlertPayload,
  type ScheduleNotificationPayload,
  type SchedulePlannerIssuePayload,
  type SchedulePublishResultPayload,
  type ScheduleRequestPayload,
  type ScheduleShiftPayload,
  type ScheduleSummaryPayload,
  type ScheduleTeamMemberPayload,
  type ScheduleTimelineDayPayload,
} from "@engaja/contracts";
import type { FeedPost } from "@engaja/domain";

import type {
  CollaboratorScheduleViewResult,
  CollaboratorRecognitionProfileResult,
  DashboardSummaryResult,
  FeedAnnouncementResult,
  FeedFeedbackResult,
  FeedHomeResult,
  FeedPollResult,
  FeedTimelinePostResult,
  LeaderSchedulePlannerResult,
  OperationsSummaryResult,
  HealthyRecognitionRankingResult,
  RecognitionBadgeResult,
  RecognitionEventResult,
  RecognitionLedgerEntryResult,
  RecognitionRewardExplanationResult,
  SendRecognitionResult,
  RecognitionSummaryResult,
  ScheduleCoverageAlertResult,
  ScheduleNotificationResult,
  SchedulePlannerIssueResult,
  SchedulePublishResult,
  ScheduleRequestResult,
  ScheduleShiftResult,
  ScheduleSummaryResult,
  ScheduleTeamMemberResult,
  ScheduleTimelineDayResult,
} from "./use-cases.js";

export function toFeedPostSummaryPayload(post: FeedPost): FeedPostSummaryPayload {
  return feedPostSummarySchema.parse({
    authorName: post.authorName,
    category: post.category,
    id: post.id,
    ...(post.photoUrl === undefined ? {} : { photoUrl: post.photoUrl }),
    publishedAt: (post.publishedAt ?? post.createdAt).toISOString(),
    title: post.title,
  });
}

export function toFeedTimelinePostPayload(post: FeedTimelinePostResult): FeedPostPayload {
  return feedPostPayloadSchema.parse({
    authorName: post.authorName,
    caption: post.caption,
    category: post.category,
    comments: post.comments.map((comment) => ({
      authorName: comment.authorName,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      id: comment.id,
      pendingSync: comment.pendingSync,
      status: comment.status,
    })),
    createdAt: post.createdAt.toISOString(),
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
            recognitionEligible: post.missionLink.recognitionEligible,
            rewardEligible: post.missionLink.rewardEligible,
            ...(post.missionLink.rewardPoints === undefined
              ? {}
              : { rewardPoints: post.missionLink.rewardPoints }),
            ...(post.missionLink.routineTitle === undefined
              ? {}
              : { routineTitle: post.missionLink.routineTitle }),
          },
        }),
    pendingSync: post.pendingSync,
    ...(post.photoUrl === undefined ? {} : { photoUrl: post.photoUrl }),
    ...(post.publishedAt === undefined ? {} : { publishedAt: post.publishedAt.toISOString() }),
    reactions: post.reactions,
    status: post.status,
    title: post.title,
    visibility: post.visibility,
  });
}

export function toFeedAnnouncementPayload(
  announcement: FeedAnnouncementResult,
): FeedAnnouncementPayload {
  return feedAnnouncementPayloadSchema.parse({
    acknowledged: announcement.acknowledged,
    body: announcement.body,
    id: announcement.id,
    ...(announcement.publishedAt === undefined
      ? {}
      : { publishedAt: announcement.publishedAt.toISOString() }),
    requiredAcknowledgement: announcement.requiredAcknowledgement,
    status: announcement.status,
    title: announcement.title,
  });
}

export function toFeedPollPayload(poll: FeedPollResult): FeedPollPayload {
  return feedPollPayloadSchema.parse({
    ...(poll.closesAt === undefined ? {} : { closesAt: poll.closesAt.toISOString() }),
    id: poll.id,
    options: poll.options,
    prompt: poll.prompt,
    status: poll.status,
    title: poll.title,
    totalVotes: poll.totalVotes,
    ...(poll.viewerVoteOptionId === undefined
      ? {}
      : { viewerVoteOptionId: poll.viewerVoteOptionId }),
  });
}

export function toFeedFeedbackPayload(feedback: FeedFeedbackResult): FeedFeedbackPayload {
  return feedFeedbackPayloadSchema.parse({
    category: feedback.category,
    createdAt: feedback.createdAt.toISOString(),
    id: feedback.id,
    message: feedback.message,
    status: feedback.status,
  });
}

export function toFeedHomePayload(home: FeedHomeResult): FeedHomePayload {
  return feedHomePayloadSchema.parse({
    announcements: home.announcements.map(toFeedAnnouncementPayload),
    feedbackInboxCount: home.feedbackInboxCount,
    ...(home.nextCursor === undefined ? {} : { nextCursor: home.nextCursor }),
    polls: home.polls.map(toFeedPollPayload),
    posts: home.posts.map(toFeedTimelinePostPayload),
  });
}

export function toScheduleSummaryPayload(summary: ScheduleSummaryResult): ScheduleSummaryPayload {
  return scheduleSummarySchema.parse({
    ...(summary.nextShiftStartsAt === undefined
      ? {}
      : { nextShiftStartsAt: summary.nextShiftStartsAt.toISOString() }),
    pendingRequests: summary.pendingRequests,
    publishedWeek: summary.publishedWeek,
    todayShiftStatus: summary.todayShiftStatus,
  });
}

export function toScheduleTimelineDayPayload(
  day: ScheduleTimelineDayResult,
): ScheduleTimelineDayPayload {
  return scheduleTimelineDaySchema.parse(day);
}

export function toScheduleShiftPayload(shift: ScheduleShiftResult): ScheduleShiftPayload {
  return scheduleShiftPayloadSchema.parse({
    breakMinutes: shift.breakMinutes,
    endsAt: shift.endsAt.toISOString(),
    id: shift.id,
    role: shift.role,
    startsAt: shift.startsAt.toISOString(),
    status: shift.status,
    title: shift.title,
    userId: shift.userId,
    userName: shift.userName,
  });
}

export function toScheduleRequestPayload(
  request: ScheduleRequestResult,
): ScheduleRequestPayload {
  return scheduleRequestPayloadSchema.parse({
    ...(request.counterpartShiftId === undefined
      ? {}
      : { counterpartShiftId: request.counterpartShiftId }),
    ...(request.counterpartUserId === undefined ? {} : { counterpartUserId: request.counterpartUserId }),
    ...(request.counterpartUserName === undefined
      ? {}
      : { counterpartUserName: request.counterpartUserName }),
    createdAt: request.createdAt.toISOString(),
    endsAt: request.endsAt.toISOString(),
    id: request.id,
    kind: request.kind,
    ...(request.note === undefined ? {} : { note: request.note }),
    ...(request.preferredPeriods === undefined ? {} : { preferredPeriods: request.preferredPeriods }),
    requesterUserId: request.requesterUserId,
    requesterUserName: request.requesterUserName,
    ...(request.reviewedAt === undefined ? {} : { reviewedAt: request.reviewedAt.toISOString() }),
    ...(request.reviewedByUserId === undefined ? {} : { reviewedByUserId: request.reviewedByUserId }),
    ...(request.shiftId === undefined ? {} : { shiftId: request.shiftId }),
    startsAt: request.startsAt.toISOString(),
    status: request.status,
  });
}

export function toScheduleNotificationPayload(
  notification: ScheduleNotificationResult,
): ScheduleNotificationPayload {
  return scheduleNotificationPayloadSchema.parse({
    createdAt: notification.createdAt.toISOString(),
    id: notification.id,
    message: notification.message,
    ...(notification.requestId === undefined ? {} : { requestId: notification.requestId }),
    ...(notification.shiftId === undefined ? {} : { shiftId: notification.shiftId }),
    status: notification.status,
    type: notification.type,
    userId: notification.userId,
  });
}

export function toScheduleCoverageAlertPayload(
  coverageAlert: ScheduleCoverageAlertResult,
): ScheduleCoverageAlertPayload {
  return scheduleCoverageAlertPayloadSchema.parse(coverageAlert);
}

export function toSchedulePlannerIssuePayload(
  issue: SchedulePlannerIssueResult,
): SchedulePlannerIssuePayload {
  return schedulePlannerIssuePayloadSchema.parse(issue);
}

export function toScheduleTeamMemberPayload(
  teamMember: ScheduleTeamMemberResult,
): ScheduleTeamMemberPayload {
  return scheduleTeamMemberPayloadSchema.parse(teamMember);
}

export function toCollaboratorScheduleViewPayload(
  view: CollaboratorScheduleViewResult,
): CollaboratorScheduleViewPayload {
  return collaboratorScheduleViewSchema.parse({
    breakMinutesToday: view.breakMinutesToday,
    ...(view.nextShiftStartsAt === undefined
      ? {}
      : { nextShiftStartsAt: view.nextShiftStartsAt.toISOString() }),
    notifications: view.notifications.map(toScheduleNotificationPayload),
    pendingRequestCount: view.pendingRequestCount,
    requests: view.requests.map(toScheduleRequestPayload),
    timelineDays: view.timelineDays.map(toScheduleTimelineDayPayload),
    ...(view.todayShift === undefined ? {} : { todayShift: toScheduleShiftPayload(view.todayShift) }),
    todayShiftStatus: view.todayShiftStatus,
    upcomingShifts: view.upcomingShifts.map(toScheduleShiftPayload),
  });
}

export function toLeaderSchedulePlannerPayload(
  planner: LeaderSchedulePlannerResult,
): LeaderSchedulePlannerPayload {
  return leaderSchedulePlannerSchema.parse({
    coverageAlerts: planner.coverageAlerts.map(toScheduleCoverageAlertPayload),
    issues: planner.issues.map(toSchedulePlannerIssuePayload),
    notifications: planner.notifications.map(toScheduleNotificationPayload),
    pendingApprovalCount: planner.pendingApprovalCount,
    requests: planner.requests.map(toScheduleRequestPayload),
    shifts: planner.shifts.map(toScheduleShiftPayload),
    teamMembers: planner.teamMembers.map(toScheduleTeamMemberPayload),
    timelineDays: planner.timelineDays.map(toScheduleTimelineDayPayload),
    weekLabel: planner.weekLabel,
  });
}

export function toSchedulePublishResultPayload(
  result: SchedulePublishResult,
): SchedulePublishResultPayload {
  return schedulePublishResultSchema.parse(result);
}

export function toOperationsSummaryPayload(
  summary: OperationsSummaryResult,
): OperationsSummaryPayload {
  return operationsSummarySchema.parse(summary);
}

export function toRecognitionSummaryPayload(
  summary: RecognitionSummaryResult,
): RecognitionSummaryPayload {
  return recognitionSummarySchema.parse(summary);
}

export function toRecognitionLedgerEntryPayload(
  entry: RecognitionLedgerEntryResult,
): RecognitionLedgerEntryPayload {
  return recognitionLedgerEntryPayloadSchema.parse({
    ...(entry.actorUserId === undefined ? {} : { actorUserId: entry.actorUserId }),
    amount: entry.amount,
    id: entry.id,
    occurredAt: entry.occurredAt.toISOString(),
    reason: entry.reason,
    source: entry.source,
    ...(entry.sourceId === undefined ? {} : { sourceId: entry.sourceId }),
  });
}

export function toRecognitionBadgePayload(badge: RecognitionBadgeResult): RecognitionBadgePayload {
  return recognitionBadgePayloadSchema.parse({
    awardedAt: badge.awardedAt.toISOString(),
    code: badge.code,
    description: badge.description,
    explanation: badge.explanation,
    id: badge.id,
    title: badge.title,
  });
}

export function toRecognitionEventPayload(event: RecognitionEventResult): RecognitionEventPayload {
  return recognitionEventPayloadSchema.parse({
    category: event.category,
    categoryLabel: event.categoryLabel,
    createdAt: event.createdAt.toISOString(),
    id: event.id,
    message: event.message,
    pointsAwarded: event.pointsAwarded,
    recipientUserId: event.recipientUserId,
    ...(event.senderUserId === undefined ? {} : { senderUserId: event.senderUserId }),
    ...(event.sourceFeedPostId === undefined ? {} : { sourceFeedPostId: event.sourceFeedPostId }),
  });
}

export function toRecognitionRewardExplanationPayload(
  explanation: RecognitionRewardExplanationResult,
): RecognitionRewardExplanationPayload {
  return recognitionRewardExplanationPayloadSchema.parse({
    grantedAt: explanation.grantedAt.toISOString(),
    points: explanation.points,
    reason: explanation.reason,
    source: explanation.source,
    ...(explanation.sourceId === undefined ? {} : { sourceId: explanation.sourceId }),
    title: explanation.title,
  });
}

export function toRecognitionProfilePayload(
  profile: CollaboratorRecognitionProfileResult,
): RecognitionProfilePayload {
  return recognitionProfilePayloadSchema.parse({
    badges: profile.badges.map(toRecognitionBadgePayload),
    ledger: profile.ledger.map(toRecognitionLedgerEntryPayload),
    recognitionHistory: profile.recognitionHistory.map(toRecognitionEventPayload),
    rewardExplanations: profile.rewardExplanations.map(toRecognitionRewardExplanationPayload),
    summary: toRecognitionSummaryPayload(profile.summary),
  });
}

export function toRecognitionRankingPayload(
  ranking: HealthyRecognitionRankingResult,
): RecognitionRankingPayload {
  return recognitionRankingPayloadSchema.parse({
    entries: ranking.entries,
    framing: ranking.framing,
    teamGoalPoints: ranking.teamGoalPoints,
    teamProgressPercent: ranking.teamProgressPercent,
    totalPositivePoints: ranking.totalPositivePoints,
  });
}

export function toRecognitionSendResultPayload(
  result: SendRecognitionResult,
): RecognitionSendResultPayload {
  return recognitionSendResultPayloadSchema.parse({
    awardedBadges: result.awardedBadges.map(toRecognitionBadgePayload),
    ...(result.ledgerEntry === undefined
      ? {}
      : { ledgerEntry: toRecognitionLedgerEntryPayload(result.ledgerEntry) }),
    recognition: toRecognitionEventPayload(result.recognition),
  });
}

export function toDashboardSummaryPayload(summary: DashboardSummaryResult): DashboardSummaryPayload {
  return dashboardSummarySchema.parse({
    attentionAreaCount: summary.attentionAreaCount,
    attentionAreas: summary.attentionAreas.map((area) => ({
      createdAt: area.createdAt.toISOString(),
      description: area.description,
      id: area.id,
      kind: area.kind,
      severity: area.severity,
      sourceCount: area.sourceCount,
      title: area.title,
    })),
    checklistMonitor: {
      completedCount: summary.checklistMonitor.completedCount,
      completionRate: summary.checklistMonitor.completionRate,
      overdueCount: summary.checklistMonitor.overdueCount,
      requiredEvidenceMissingCount: summary.checklistMonitor.requiredEvidenceMissingCount,
      routines: summary.checklistMonitor.routines.map((routine) => ({
        completedCount: routine.completedCount,
        id: routine.id,
        label: routine.label,
        overdueCount: routine.overdueCount,
        totalCount: routine.totalCount,
      })),
      totalCount: summary.checklistMonitor.totalCount,
      unresolvedIssueCount: summary.checklistMonitor.unresolvedIssueCount,
    },
    contentItems: summary.contentItems.map((item) => ({
      id: item.id,
      metricLabel: item.metricLabel,
      ...(item.ownerLabel === undefined ? {} : { ownerLabel: item.ownerLabel }),
      ...(item.scheduledFor === undefined ? {} : { scheduledFor: item.scheduledFor.toISOString() }),
      status: item.status,
      title: item.title,
      type: item.type,
    })),
    engagementRate: summary.engagementRate,
    filters: {
      contentTypes: summary.filters.contentTypes,
      routineCategories: summary.filters.routineCategories,
      selected: {
        ...(summary.filters.selected.contentType === undefined
          ? {}
          : { contentType: summary.filters.selected.contentType }),
        dateRangeLabel: summary.filters.selected.dateRangeLabel,
        endsAt: summary.filters.selected.endsAt.toISOString(),
        ...(summary.filters.selected.routineCategory === undefined
          ? {}
          : { routineCategory: summary.filters.selected.routineCategory }),
        ...(summary.filters.selected.shiftId === undefined
          ? {}
          : { shiftId: summary.filters.selected.shiftId }),
        startsAt: summary.filters.selected.startsAt.toISOString(),
        ...(summary.filters.selected.storeId === undefined
          ? {}
          : { storeId: summary.filters.selected.storeId }),
        ...(summary.filters.selected.teamMemberId === undefined
          ? {}
          : { teamMemberId: summary.filters.selected.teamMemberId }),
      },
      shifts: summary.filters.shifts,
      stores: summary.filters.stores,
      teamMembers: summary.filters.teamMembers,
    },
    memberInsights: summary.memberInsights.map((member) => ({
      completedActionCount: member.completedActionCount,
      displayName: member.displayName,
      engagementCount: member.engagementCount,
      points: member.points,
      recognitionCount: member.recognitionCount,
      role: member.role,
      scaleLabel: member.scaleLabel,
      userId: member.userId,
    })),
    moderationQueue: summary.moderationQueue.map(toFeedTimelinePostPayload),
    openModerationCount: summary.openModerationCount,
    overview: {
      generatedAt: summary.overview.generatedAt.toISOString(),
      metrics: summary.overview.metrics,
      teamProgressPercent: summary.overview.teamProgressPercent,
    },
    scheduleConsole: toLeaderSchedulePlannerPayload(summary.scheduleConsole),
    scheduleGapCount: summary.scheduleGapCount,
  });
}
