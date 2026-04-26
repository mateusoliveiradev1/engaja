import type {
  EngagementRepositoryPort,
  FeedRepositoryPort,
  MetricsRepositoryPort,
  OperationsRepositoryPort,
  RecognitionRepositoryPort,
  ScheduleRepositoryPort,
  ScheduleTeamMember,
} from "@engaja/application";
import type {
  CollaboratorArchiveItem,
  EligibleEngagementEvent,
  EngagementCampaign,
  RewardGrant,
  TenantScope,
} from "@engaja/domain";
import {
  createCollaboratorArchiveItem,
  createEligibleEngagementEvent,
  createEngagementCampaign,
  createRewardGrant,
  createTenantScope,
} from "@engaja/domain";

import {
  fromChecklistItemCompletion,
  fromChecklistRun,
  fromFeedAnnouncement,
  fromFeedComment,
  fromFeedFeedback,
  fromFeedPoll,
  fromFeedPost,
  fromFeedReaction,
  fromOperationIssue,
  fromOperationLearningBite,
  fromPointsLedgerEntry,
  fromRecognitionEvent,
  fromScheduleNotification,
  fromScheduleRequest,
  fromShift,
  toAttentionArea,
  toBadgeAward,
  toChecklistItemCompletion,
  toChecklistRun,
  toCoverageRequirement,
  toFeedAnnouncement,
  toFeedComment,
  toFeedFeedback,
  toFeedPoll,
  toFeedPost,
  toFeedReaction,
  toMetricSnapshot,
  toOperationLearningBite,
  toOperationIssue,
  toPointsLedgerEntry,
  toRecognitionEvent,
  toScheduleNotification,
  toScheduleRequest,
  toShift,
  type AttentionAreaRecord,
  type BadgeAwardRecord,
  type ChecklistItemCompletionRecord,
  type ChecklistRunRecord,
  type CoverageRequirementRecord,
  type FeedAnnouncementRecord,
  type FeedCommentRecord,
  type FeedFeedbackRecord,
  type FeedPollRecord,
  type FeedPostRecord,
  type FeedReactionRecord,
  type MetricSnapshotRecord,
  type OperationLearningBiteRecord,
  type OperationIssueRecord,
  type PointsLedgerRecord,
  type RecognitionEventRecord,
  type ScheduleNotificationRecord,
  type ScheduleRequestRecord,
  type ScheduleTeamMemberRecord,
  type ShiftRecord,
} from "./records.js";

export interface DevelopmentFlvRepositories {
  readonly engagementRepository: EngagementRepositoryPort;
  readonly feedRepository: FeedRepositoryPort;
  readonly metricsRepository: MetricsRepositoryPort;
  readonly operationsRepository: OperationsRepositoryPort;
  readonly recognitionRepository: RecognitionRepositoryPort;
  readonly scheduleRepository: ScheduleRepositoryPort;
}

export function createInMemoryFeedRepository(input: {
  readonly announcements?: readonly FeedAnnouncementRecord[];
  readonly comments?: readonly FeedCommentRecord[];
  readonly feedback?: readonly FeedFeedbackRecord[];
  readonly polls?: readonly FeedPollRecord[];
  readonly posts: readonly FeedPostRecord[];
  readonly reactions?: readonly FeedReactionRecord[];
}): FeedRepositoryPort {
  const announcements = [...(input.announcements ?? [])];
  const comments = [...(input.comments ?? [])];
  const feedback = [...(input.feedback ?? [])];
  const polls = [...(input.polls ?? [])];
  const posts = [...input.posts];
  const reactions = [...(input.reactions ?? [])];

  return {
    countPostsByStatus(status, scope) {
      return Promise.resolve(
        posts.filter((record) => record.status === status && matchesScope(record, scope)).length,
      );
    },
    deleteReaction(postId, userId) {
      const currentIndex = reactions.findIndex(
        (record) => record.postId === postId && record.userId === userId,
      );

      if (currentIndex >= 0) {
        reactions.splice(currentIndex, 1);
      }

      return Promise.resolve();
    },
    findAnnouncementById(id) {
      const record = announcements.find((candidate) => candidate.id === id);

      return Promise.resolve(record === undefined ? undefined : toFeedAnnouncement(record));
    },
    findPollById(id) {
      const record = polls.find((candidate) => candidate.id === id);

      return Promise.resolve(record === undefined ? undefined : toFeedPoll(record));
    },
    findPostById(id) {
      const record = posts.find((candidate) => candidate.id === id);

      return Promise.resolve(record === undefined ? undefined : toFeedPost(record));
    },
    listAnnouncements(scope) {
      return Promise.resolve(
        announcements.filter((record) => matchesScope(record, scope)).map(toFeedAnnouncement),
      );
    },
    listComments(postId) {
      return Promise.resolve(comments.filter((record) => record.postId === postId).map(toFeedComment));
    },
    listFeedback(scope) {
      return Promise.resolve(feedback.filter((record) => matchesScope(record, scope)).map(toFeedFeedback));
    },
    listPolls(scope) {
      return Promise.resolve(polls.filter((record) => matchesScope(record, scope)).map(toFeedPoll));
    },
    listPosts(scope) {
      return Promise.resolve(posts.filter((record) => matchesScope(record, scope)).map(toFeedPost));
    },
    listReactions(postId) {
      return Promise.resolve(
        reactions.filter((record) => record.postId === postId).map(toFeedReaction),
      );
    },
    saveAnnouncement(announcement) {
      const record = fromFeedAnnouncement(announcement);
      const currentIndex = announcements.findIndex((candidate) => candidate.id === announcement.id);

      if (currentIndex >= 0) {
        announcements[currentIndex] = record;
      } else {
        announcements.push(record);
      }

      return Promise.resolve(toFeedAnnouncement(record));
    },
    saveComment(comment) {
      const record = fromFeedComment(comment);
      const currentIndex = comments.findIndex((candidate) => candidate.id === comment.id);

      if (currentIndex >= 0) {
        comments[currentIndex] = record;
      } else {
        comments.push(record);
      }

      return Promise.resolve(toFeedComment(record));
    },
    saveFeedback(item) {
      const record = fromFeedFeedback(item);
      const currentIndex = feedback.findIndex((candidate) => candidate.id === item.id);

      if (currentIndex >= 0) {
        feedback[currentIndex] = record;
      } else {
        feedback.push(record);
      }

      return Promise.resolve(toFeedFeedback(record));
    },
    savePoll(poll) {
      const record = fromFeedPoll(poll);
      const currentIndex = polls.findIndex((candidate) => candidate.id === poll.id);

      if (currentIndex >= 0) {
        polls[currentIndex] = record;
      } else {
        polls.push(record);
      }

      return Promise.resolve(toFeedPoll(record));
    },
    savePost(post) {
      const record = fromFeedPost(post);
      const currentIndex = posts.findIndex((candidate) => candidate.id === post.id);

      if (currentIndex >= 0) {
        posts[currentIndex] = record;
      } else {
        posts.push(record);
      }

      return Promise.resolve(toFeedPost(record));
    },
    saveReaction(reaction) {
      const record = fromFeedReaction(reaction);
      const currentIndex = reactions.findIndex((candidate) => candidate.id === reaction.id);

      if (currentIndex >= 0) {
        reactions[currentIndex] = record;
      } else {
        reactions.push(record);
      }

      return Promise.resolve(toFeedReaction(record));
    },
  };
}

export function createInMemoryScheduleRepository(input: {
  readonly coverageRequirements: readonly CoverageRequirementRecord[];
  readonly notifications: readonly ScheduleNotificationRecord[];
  readonly requests: readonly ScheduleRequestRecord[];
  readonly shifts: readonly ShiftRecord[];
  readonly teamMembers: readonly ScheduleTeamMemberRecord[];
}): ScheduleRepositoryPort {
  const shifts = [...input.shifts];
  const coverageRequirements = [...input.coverageRequirements];
  const notifications = [...input.notifications];
  const requests = [...input.requests];
  const teamMembers = [...input.teamMembers];

  return {
    countPendingRequestsForUser(userId, scope) {
      return Promise.resolve(
        requests.filter(
          (request) =>
            (request.requesterUserId === userId || request.counterpartUserId === userId) &&
            (request.status === "pending" || request.status === "accepted") &&
            matchesScope(request, scope),
        ).length,
      );
    },
    findRequestById(id) {
      const record = requests.find((candidate) => candidate.id === id);

      return Promise.resolve(record === undefined ? undefined : toScheduleRequest(record));
    },
    findShiftById(id) {
      const record = shifts.find((candidate) => candidate.id === id);

      return Promise.resolve(record === undefined ? undefined : toShift(record));
    },
    listCoverageRequirements(scope) {
      return Promise.resolve(
        coverageRequirements.filter((record) => matchesScope(record, scope)).map(toCoverageRequirement),
      );
    },
    listNotifications(scope) {
      return Promise.resolve(
        notifications
          .filter((record) => matchesScope(record, scope))
          .map(toScheduleNotification),
      );
    },
    listNotificationsForUser(userId, scope) {
      return Promise.resolve(
        notifications
          .filter((record) => record.userId === userId && matchesScope(record, scope))
          .map(toScheduleNotification),
      );
    },
    listRequests(scope) {
      return Promise.resolve(
        requests.filter((record) => matchesScope(record, scope)).map(toScheduleRequest),
      );
    },
    listRequestsForUser(userId, scope) {
      return Promise.resolve(
        requests
          .filter(
            (record) =>
              (record.requesterUserId === userId || record.counterpartUserId === userId) &&
              matchesScope(record, scope),
          )
          .map(toScheduleRequest),
      );
    },
    listShifts(scope) {
      return Promise.resolve(shifts.filter((record) => matchesScope(record, scope)).map(toShift));
    },
    listShiftsForUser(userId, scope) {
      return Promise.resolve(
        shifts.filter((record) => record.userId === userId && matchesScope(record, scope)).map(toShift),
      );
    },
    listTeamMembers(scope) {
      return Promise.resolve(
        teamMembers
          .filter((member) => matchesTeamMemberScope(member, scope))
          .map<ScheduleTeamMember>((member) => ({
            displayName: member.displayName,
            role: member.role,
            userId: member.userId as ScheduleTeamMember["userId"],
          })),
      );
    },
    saveNotification(notification) {
      const record = fromScheduleNotification(notification);
      const currentIndex = notifications.findIndex((candidate) => candidate.id === notification.id);

      if (currentIndex >= 0) {
        notifications[currentIndex] = record;
      } else {
        notifications.push(record);
      }

      return Promise.resolve(toScheduleNotification(record));
    },
    saveRequest(request) {
      const record = fromScheduleRequest(request);
      const currentIndex = requests.findIndex((candidate) => candidate.id === request.id);

      if (currentIndex >= 0) {
        requests[currentIndex] = record;
      } else {
        requests.push(record);
      }

      return Promise.resolve(toScheduleRequest(record));
    },
    saveShift(shift) {
      const record = fromShift(shift);
      const currentIndex = shifts.findIndex((candidate) => candidate.id === shift.id);

      if (currentIndex >= 0) {
        shifts[currentIndex] = record;
      } else {
        shifts.push(record);
      }

      return Promise.resolve(toShift(record));
    },
  };
}

export function createInMemoryOperationsRepository(input: {
  readonly checklistRuns: readonly ChecklistRunRecord[];
  readonly checklistItemCompletions: readonly ChecklistItemCompletionRecord[];
  readonly issues: readonly OperationIssueRecord[];
  readonly learningBites: readonly OperationLearningBiteRecord[];
}): OperationsRepositoryPort {
  const checklistRuns = [...input.checklistRuns];
  const checklistItemCompletions = [...input.checklistItemCompletions];
  const issues = [...input.issues];
  const learningBites = [...input.learningBites];

  return {
    findChecklistRunById(id) {
      const record = checklistRuns.find((candidate) => candidate.id === id);

      return Promise.resolve(record === undefined ? undefined : toChecklistRun(record));
    },
    listChecklistItemCompletions(scope) {
      return Promise.resolve(
        checklistItemCompletions
          .filter((record) => matchesScope(record, scope))
          .map(toChecklistItemCompletion),
      );
    },
    listChecklistRuns(scope) {
      return Promise.resolve(checklistRuns.filter((record) => matchesScope(record, scope)).map(toChecklistRun));
    },
    listIssues(scope) {
      return Promise.resolve(issues.filter((record) => matchesScope(record, scope)).map(toOperationIssue));
    },
    listLearningBites(scope) {
      return Promise.resolve(
        learningBites.filter((record) => matchesScope(record, scope)).map(toOperationLearningBite),
      );
    },
    saveChecklistItemCompletion(completion) {
      const record = fromChecklistItemCompletion(completion);
      const currentIndex = checklistItemCompletions.findIndex(
        (candidate) => candidate.id === completion.id,
      );

      if (currentIndex >= 0) {
        checklistItemCompletions[currentIndex] = record;
      } else {
        checklistItemCompletions.push(record);
      }

      return Promise.resolve(toChecklistItemCompletion(record));
    },
    saveChecklistRun(run) {
      const record = fromChecklistRun(run);
      const currentIndex = checklistRuns.findIndex((candidate) => candidate.id === run.id);

      if (currentIndex >= 0) {
        checklistRuns[currentIndex] = record;
      } else {
        checklistRuns.push(record);
      }

      return Promise.resolve(toChecklistRun(record));
    },
    saveIssue(issue) {
      const record = fromOperationIssue(issue);
      const currentIndex = issues.findIndex((candidate) => candidate.id === issue.id);

      if (currentIndex >= 0) {
        issues[currentIndex] = record;
      } else {
        issues.push(record);
      }

      return Promise.resolve(toOperationIssue(record));
    },
    saveLearningBite(learningBite) {
      const record = fromOperationLearningBite(learningBite);
      const currentIndex = learningBites.findIndex((candidate) => candidate.id === learningBite.id);

      if (currentIndex >= 0) {
        learningBites[currentIndex] = record;
      } else {
        learningBites.push(record);
      }

      return Promise.resolve(toOperationLearningBite(record));
    },
  };
}

export function createInMemoryRecognitionRepository(input: {
  readonly badgeAwards: readonly BadgeAwardRecord[];
  readonly ledgerEntries: readonly PointsLedgerRecord[];
  readonly recognitionEvents: readonly RecognitionEventRecord[];
}): RecognitionRepositoryPort {
  const badgeAwards = [...input.badgeAwards];
  const ledgerEntries = [...input.ledgerEntries];
  const recognitionEvents = [...input.recognitionEvents];

  return {
    listBadgeAwardsForUser(userId, scope) {
      return Promise.resolve(
        badgeAwards
          .filter((record) => record.userId === userId && matchesScope(record, scope))
          .map(toBadgeAward),
      );
    },
    listLedgerEntries(scope) {
      return Promise.resolve(
        ledgerEntries
          .filter((record) => matchesScope(record, scope))
          .map(toPointsLedgerEntry),
      );
    },
    listLedgerEntriesForUser(userId, scope) {
      return Promise.resolve(
        ledgerEntries
          .filter((record) => record.userId === userId && matchesScope(record, scope))
          .map(toPointsLedgerEntry),
      );
    },
    listRecognitionEvents(scope) {
      return Promise.resolve(
        recognitionEvents
          .filter((record) => matchesScope(record, scope))
          .map(toRecognitionEvent),
      );
    },
    listRecognitionEventsForUser(userId, scope) {
      return Promise.resolve(
        recognitionEvents
          .filter((record) => record.recipientUserId === userId && matchesScope(record, scope))
          .map(toRecognitionEvent),
      );
    },
    saveBadgeAward(award) {
      const record: BadgeAwardRecord = {
        awardedAt: award.awardedAt.toISOString(),
        code: award.code,
        ...(award.scope.departmentId === undefined ? {} : { departmentId: award.scope.departmentId }),
        id: award.id,
        organizationId: award.scope.organizationId,
        ...(award.scope.storeId === undefined ? {} : { storeId: award.scope.storeId }),
        userId: award.userId,
      };
      const currentIndex = badgeAwards.findIndex((candidate) => candidate.id === award.id);

      if (currentIndex >= 0) {
        badgeAwards[currentIndex] = record;
      } else {
        badgeAwards.push(record);
      }

      return Promise.resolve(toBadgeAward(record));
    },
    saveLedgerEntry(entry) {
      const record = fromPointsLedgerEntry(entry);
      const currentIndex = ledgerEntries.findIndex((candidate) => candidate.id === entry.id);

      if (currentIndex >= 0) {
        ledgerEntries[currentIndex] = record;
      } else {
        ledgerEntries.push(record);
      }

      return Promise.resolve(toPointsLedgerEntry(record));
    },
    saveRecognitionEvent(event) {
      const record = fromRecognitionEvent(event);
      const currentIndex = recognitionEvents.findIndex((candidate) => candidate.id === event.id);

      if (currentIndex >= 0) {
        recognitionEvents[currentIndex] = record;
      } else {
        recognitionEvents.push(record);
      }

      return Promise.resolve(toRecognitionEvent(record));
    },
  };
}

export function createInMemoryEngagementRepository(input: {
  readonly archiveItems?: readonly CollaboratorArchiveItem[];
  readonly campaigns?: readonly EngagementCampaign[];
  readonly eligibleEvents?: readonly EligibleEngagementEvent[];
  readonly rewardGrants?: readonly RewardGrant[];
} = {}): EngagementRepositoryPort {
  const archiveItems = [...(input.archiveItems ?? [])];
  const campaigns = [...(input.campaigns ?? [])];
  const eligibleEvents = [...(input.eligibleEvents ?? [])];
  const rewardGrants = [...(input.rewardGrants ?? [])];

  return {
    findCampaignById(id) {
      return Promise.resolve(campaigns.find((campaign) => campaign.id === id));
    },
    findRewardGrantById(id) {
      return Promise.resolve(rewardGrants.find((grant) => grant.id === id));
    },
    listArchiveItemsForUser(userId, scope) {
      return Promise.resolve(
        archiveItems.filter((item) => item.userId === userId && matchesScope(item.scope, scope)),
      );
    },
    listCampaigns(scope) {
      return Promise.resolve(campaigns.filter((campaign) => matchesScope(campaign.scope, scope)));
    },
    listEligibleEvents(scope) {
      return Promise.resolve(
        eligibleEvents.filter((event) => matchesScope(event.scope, scope)),
      );
    },
    listRewardGrants(scope) {
      return Promise.resolve(rewardGrants.filter((grant) => matchesScope(grant.scope, scope)));
    },
    listRewardGrantsForUser(userId, scope) {
      return Promise.resolve(
        rewardGrants.filter((grant) => grant.userId === userId && matchesScope(grant.scope, scope)),
      );
    },
    saveArchiveItem(item) {
      const currentIndex = archiveItems.findIndex((candidate) => candidate.id === item.id);

      if (currentIndex >= 0) {
        archiveItems[currentIndex] = item;
      } else {
        archiveItems.push(item);
      }

      return Promise.resolve(item);
    },
    saveCampaign(campaign) {
      const currentIndex = campaigns.findIndex((candidate) => candidate.id === campaign.id);

      if (currentIndex >= 0) {
        campaigns[currentIndex] = campaign;
      } else {
        campaigns.push(campaign);
      }

      return Promise.resolve(campaign);
    },
    saveEligibleEvent(event) {
      const currentIndex = eligibleEvents.findIndex((candidate) => candidate.id === event.id);

      if (currentIndex >= 0) {
        eligibleEvents[currentIndex] = event;
      } else {
        eligibleEvents.push(event);
      }

      return Promise.resolve(event);
    },
    saveRewardGrant(grant) {
      const currentIndex = rewardGrants.findIndex((candidate) => candidate.id === grant.id);

      if (currentIndex >= 0) {
        rewardGrants[currentIndex] = grant;
      } else {
        rewardGrants.push(grant);
      }

      return Promise.resolve(grant);
    },
  };
}

export function createInMemoryMetricsRepository(input: {
  readonly attentionAreas: readonly AttentionAreaRecord[];
  readonly metricSnapshots: readonly MetricSnapshotRecord[];
}): MetricsRepositoryPort {
  const attentionAreas = [...input.attentionAreas];
  const metricSnapshots = [...input.metricSnapshots];

  return {
    listAttentionAreas(scope) {
      return Promise.resolve(attentionAreas.filter((record) => matchesScope(record, scope)).map(toAttentionArea));
    },
    listMetricSnapshots(scope) {
      return Promise.resolve(metricSnapshots.filter((record) => matchesScope(record, scope)).map(toMetricSnapshot));
    },
  };
}

export function createDevelopmentFlvRepositories(): DevelopmentFlvRepositories {
  const feedPosts: readonly FeedPostRecord[] = [
    {
      authorName: "Equipe FLV",
      authorUserId: "user_demo_colaborador",
      caption: "Foto da bancada aprovada na missao de abertura.",
      category: "mission",
      createdAt: "2026-04-22T11:58:00.000Z",
      departmentId: "dept_flv",
      id: "post_demo_photo_mission",
      missionLink: {
        missionId: "mission_morning_showcase",
        missionTitle: "Missao foto da bancada impecavel",
        recognitionCategory: "quality",
        rewardPoints: 120,
        routineTitle: "Abertura premium",
      },
      organizationId: "org_demo",
      photoUrl: "https://example.com/flv-demo-photo.webp",
      publishedAt: "2026-04-22T12:00:00.000Z",
      status: "published",
      storeId: "store_001",
      title: "Missao foto da bancada impecavel",
      updatedAt: "2026-04-22T12:00:00.000Z",
      visibility: "department",
    },
    {
      authorName: "Equipe FLV",
      authorUserId: "user_demo_colaborador",
      caption: "Fila de moderacao 1.",
      category: "quality",
      createdAt: "2026-04-22T12:10:00.000Z",
      departmentId: "dept_flv",
      id: "post_pending_1",
      organizationId: "org_demo",
      status: "pending_moderation",
      storeId: "store_001",
      title: "Aguardando moderacao 1",
      updatedAt: "2026-04-22T12:10:00.000Z",
      visibility: "department",
    },
    {
      authorName: "Equipe FLV",
      authorUserId: "user_demo_colaborador",
      caption: "Fila de moderacao 2.",
      category: "quality",
      createdAt: "2026-04-22T12:11:00.000Z",
      departmentId: "dept_flv",
      id: "post_pending_2",
      organizationId: "org_demo",
      status: "pending_moderation",
      storeId: "store_001",
      title: "Aguardando moderacao 2",
      updatedAt: "2026-04-22T12:11:00.000Z",
      visibility: "department",
    },
    {
      authorName: "Equipe FLV",
      authorUserId: "user_demo_colaborador",
      caption: "Fila de moderacao 3.",
      category: "routine",
      createdAt: "2026-04-22T12:12:00.000Z",
      departmentId: "dept_flv",
      id: "post_pending_3",
      organizationId: "org_demo",
      status: "pending_moderation",
      storeId: "store_001",
      title: "Aguardando moderacao 3",
      updatedAt: "2026-04-22T12:12:00.000Z",
      visibility: "department",
    },
    {
      authorName: "Equipe FLV",
      authorUserId: "user_demo_colaborador",
      caption: "Fila de moderacao 4.",
      category: "display",
      createdAt: "2026-04-22T12:13:00.000Z",
      departmentId: "dept_flv",
      id: "post_pending_4",
      organizationId: "org_demo",
      status: "pending_moderation",
      storeId: "store_001",
      title: "Aguardando moderacao 4",
      updatedAt: "2026-04-22T12:13:00.000Z",
      visibility: "department",
    },
  ];
  const feedReactions: readonly FeedReactionRecord[] = [
    {
      createdAt: "2026-04-22T12:05:00.000Z",
      departmentId: "dept_flv",
      id: "reaction_demo_like",
      organizationId: "org_demo",
      postId: "post_demo_photo_mission",
      storeId: "store_001",
      type: "like",
      userId: "user_demo_colaborador",
    },
    {
      createdAt: "2026-04-22T12:06:00.000Z",
      departmentId: "dept_flv",
      id: "reaction_demo_aplauso",
      organizationId: "org_demo",
      postId: "post_demo_photo_mission",
      storeId: "store_001",
      type: "aplauso",
      userId: "user_demo_lider",
    },
  ];
  const feedComments: readonly FeedCommentRecord[] = [
    {
      authorName: "Lider de Setor",
      authorUserId: "user_demo_lider",
      body: "Boa leitura de cores e volume.",
      createdAt: "2026-04-22T12:07:00.000Z",
      departmentId: "dept_flv",
      id: "comment_demo_visible",
      organizationId: "org_demo",
      postId: "post_demo_photo_mission",
      status: "visible",
      storeId: "store_001",
      updatedAt: "2026-04-22T12:07:00.000Z",
    },
    {
      authorName: "Julia Lima",
      authorUserId: "user_demo_colaborador",
      body: "Posso repetir essa padronizacao no segundo pico.",
      createdAt: "2026-04-22T12:08:00.000Z",
      departmentId: "dept_flv",
      id: "comment_demo_pending",
      organizationId: "org_demo",
      postId: "post_demo_photo_mission",
      status: "pending",
      storeId: "store_001",
      updatedAt: "2026-04-22T12:08:00.000Z",
    },
  ];
  const feedAnnouncements: readonly FeedAnnouncementRecord[] = [
    {
      body: "Conferir reforco da ilha fria antes das 16h.",
      createdAt: "2026-04-23T10:00:00.000Z",
      createdByUserId: "user_demo_lider",
      departmentId: "dept_flv",
      id: "announcement_shift_push",
      organizationId: "org_demo",
      publishedAt: "2026-04-23T10:05:00.000Z",
      readByUserIds: ["user_demo_lider"],
      requiredAcknowledgement: true,
      status: "active",
      storeId: "store_001",
      title: "Reforco antes do pico da tarde",
    },
  ];
  const feedPolls: readonly FeedPollRecord[] = [
    {
      createdAt: "2026-04-23T09:00:00.000Z",
      createdByUserId: "user_demo_lider",
      departmentId: "dept_flv",
      id: "poll_layout_priority",
      options: [
        {
          id: "poll_option_a",
          label: "Ilha de folhas premium",
          sortOrder: 0,
        },
        {
          id: "poll_option_b",
          label: "Ponta de tomate grape",
          sortOrder: 1,
        },
      ],
      organizationId: "org_demo",
      prompt: "Qual frente merece o destaque visual da tarde?",
      status: "active",
      storeId: "store_001",
      title: "Votacao rapida do setor",
      votes: [
        {
          createdAt: "2026-04-23T09:10:00.000Z",
          id: "poll_vote_demo_1",
          optionId: "poll_option_a",
          pollId: "poll_layout_priority",
          userId: "user_demo_lider",
        },
      ],
    },
  ];
  const feedFeedback: readonly FeedFeedbackRecord[] = [
    {
      authorUserId: "user_demo_colaborador",
      category: "blocker",
      createdAt: "2026-04-23T11:45:00.000Z",
      departmentId: "dept_flv",
      id: "feedback_demo_1",
      message: "Faltou etiqueta de reposicao para a ponta de melao.",
      organizationId: "org_demo",
      status: "new",
      storeId: "store_001",
    },
  ];
  const teamMembers: readonly ScheduleTeamMemberRecord[] = [
    {
      departmentId: "dept_flv",
      displayName: "Julia Lima",
      organizationId: "org_demo",
      role: "colaborador",
      storeId: "store_001",
      userId: "user_demo_colaborador",
    },
    {
      departmentId: "dept_flv",
      displayName: "Mateus Rocha",
      organizationId: "org_demo",
      role: "colaborador",
      storeId: "store_001",
      userId: "user_demo_colaborador_2",
    },
    {
      departmentId: "dept_flv",
      displayName: "Carla Nunes",
      organizationId: "org_demo",
      role: "colaborador",
      storeId: "store_001",
      userId: "user_demo_colaborador_3",
    },
    {
      departmentId: "dept_flv",
      displayName: "Renata Prado",
      organizationId: "org_demo",
      role: "lider-setor",
      storeId: "store_001",
      userId: "user_demo_lider",
    },
    {
      displayName: "Felipe Costa",
      organizationId: "org_demo",
      role: "gerente-loja",
      storeId: "store_001",
      userId: "user_demo_gerente",
    },
    {
      displayName: "Ana Moura",
      organizationId: "org_demo",
      role: "admin-organizacao",
      userId: "user_demo_admin",
    },
  ];
  const shifts: readonly ShiftRecord[] = [
    {
      breakMinutes: 60,
      createdByUserId: "user_demo_lider",
      departmentId: "dept_flv",
      endsAt: "2026-04-23T17:00:00.000Z",
      id: "shift_today_collaborator",
      organizationId: "org_demo",
      publishedAt: "2026-04-22T12:00:00.000Z",
      role: "colaborador",
      startsAt: "2026-04-23T09:00:00.000Z",
      status: "published",
      storeId: "store_001",
      title: "Abertura FLV",
      userId: "user_demo_colaborador",
    },
    {
      breakMinutes: 45,
      createdByUserId: "user_demo_lider",
      departmentId: "dept_flv",
      endsAt: "2026-04-24T15:00:00.000Z",
      id: "shift_friday_collaborator",
      organizationId: "org_demo",
      role: "colaborador",
      startsAt: "2026-04-24T06:00:00.000Z",
      status: "draft",
      storeId: "store_001",
      title: "Reforco de abertura",
      userId: "user_demo_colaborador",
    },
    {
      breakMinutes: 60,
      createdByUserId: "user_demo_lider",
      departmentId: "dept_flv",
      endsAt: "2026-04-25T20:00:00.000Z",
      id: "shift_saturday_collaborator",
      organizationId: "org_demo",
      publishedAt: "2026-04-22T12:00:00.000Z",
      role: "colaborador",
      startsAt: "2026-04-25T11:00:00.000Z",
      status: "published",
      storeId: "store_001",
      title: "Pico da tarde",
      userId: "user_demo_colaborador",
    },
    {
      breakMinutes: 45,
      createdByUserId: "user_demo_lider",
      departmentId: "dept_flv",
      endsAt: "2026-04-23T15:00:00.000Z",
      id: "shift_today_mateus",
      organizationId: "org_demo",
      publishedAt: "2026-04-22T12:00:00.000Z",
      role: "colaborador",
      startsAt: "2026-04-23T06:00:00.000Z",
      status: "published",
      storeId: "store_001",
      title: "Abertura fria",
      userId: "user_demo_colaborador_2",
    },
    {
      breakMinutes: 60,
      createdByUserId: "user_demo_lider",
      departmentId: "dept_flv",
      endsAt: "2026-04-24T18:00:00.000Z",
      id: "shift_friday_mateus",
      organizationId: "org_demo",
      publishedAt: "2026-04-22T12:00:00.000Z",
      role: "colaborador",
      startsAt: "2026-04-24T09:00:00.000Z",
      status: "published",
      storeId: "store_001",
      title: "Frente fria",
      userId: "user_demo_colaborador_2",
    },
    {
      breakMinutes: 45,
      createdByUserId: "user_demo_lider",
      departmentId: "dept_flv",
      endsAt: "2026-04-25T15:00:00.000Z",
      id: "shift_saturday_mateus",
      organizationId: "org_demo",
      publishedAt: "2026-04-22T12:00:00.000Z",
      role: "colaborador",
      startsAt: "2026-04-25T06:00:00.000Z",
      status: "published",
      storeId: "store_001",
      title: "Abertura sabado",
      userId: "user_demo_colaborador_2",
    },
    {
      breakMinutes: 45,
      createdByUserId: "user_demo_lider",
      departmentId: "dept_flv",
      endsAt: "2026-04-24T15:00:00.000Z",
      id: "shift_friday_carla",
      organizationId: "org_demo",
      role: "colaborador",
      startsAt: "2026-04-24T06:00:00.000Z",
      status: "draft",
      storeId: "store_001",
      title: "Reposicao premium",
      userId: "user_demo_colaborador_3",
    },
  ];
  const coverageRequirements: readonly CoverageRequirementRecord[] = [
    {
      departmentId: "dept_flv",
      endsAt: "2026-04-23T15:00:00.000Z",
      id: "coverage_thursday_opening",
      label: "Cobertura da abertura de quinta",
      organizationId: "org_demo",
      role: "colaborador",
      requiredHeadcount: 2,
      routineResponsibility: "abertura",
      startsAt: "2026-04-23T06:00:00.000Z",
      storeId: "store_001",
    },
    {
      departmentId: "dept_flv",
      endsAt: "2026-04-24T15:00:00.000Z",
      id: "coverage_friday_opening",
      label: "Cobertura da abertura de sexta",
      organizationId: "org_demo",
      role: "colaborador",
      requiredHeadcount: 2,
      routineResponsibility: "abertura",
      startsAt: "2026-04-24T06:00:00.000Z",
      storeId: "store_001",
    },
    {
      departmentId: "dept_flv",
      endsAt: "2026-04-25T20:00:00.000Z",
      id: "coverage_saturday_peak",
      label: "Cobertura do pico de sabado",
      organizationId: "org_demo",
      role: "colaborador",
      requiredHeadcount: 2,
      routineResponsibility: "reposicao",
      startsAt: "2026-04-25T11:00:00.000Z",
      storeId: "store_001",
    },
  ];
  const requests: readonly ScheduleRequestRecord[] = [
    {
      createdAt: "2026-04-23T06:40:00.000Z",
      departmentId: "dept_flv",
      endsAt: "2026-04-27T15:00:00.000Z",
      id: "request_availability_collaborator",
      kind: "availability",
      note: "Posso cobrir a abertura da segunda.",
      organizationId: "org_demo",
      preferredPeriods: ["opening"],
      requesterUserId: "user_demo_colaborador",
      startsAt: "2026-04-27T06:00:00.000Z",
      status: "pending",
      storeId: "store_001",
    },
    {
      createdAt: "2026-04-22T15:00:00.000Z",
      departmentId: "dept_flv",
      endsAt: "2026-04-24T18:00:00.000Z",
      id: "request_time_off_mateus",
      kind: "time_off",
      note: "Consulta medica no periodo da tarde.",
      organizationId: "org_demo",
      requesterUserId: "user_demo_colaborador_2",
      reviewedAt: "2026-04-22T18:00:00.000Z",
      reviewedByUserId: "user_demo_lider",
      startsAt: "2026-04-24T09:00:00.000Z",
      status: "approved",
      storeId: "store_001",
    },
    {
      counterpartShiftId: "shift_saturday_mateus",
      counterpartUserId: "user_demo_colaborador_2",
      createdAt: "2026-04-23T08:10:00.000Z",
      departmentId: "dept_flv",
      endsAt: "2026-04-25T20:00:00.000Z",
      id: "request_swap_weekend",
      kind: "swap",
      note: "Troco meu pico da tarde pelo turno de abertura.",
      organizationId: "org_demo",
      requesterUserId: "user_demo_colaborador",
      reviewedAt: "2026-04-23T08:25:00.000Z",
      reviewedByUserId: "user_demo_colaborador_2",
      shiftId: "shift_saturday_collaborator",
      startsAt: "2026-04-25T11:00:00.000Z",
      status: "accepted",
      storeId: "store_001",
    },
  ];
  const notifications: readonly ScheduleNotificationRecord[] = [
    {
      createdAt: "2026-04-22T12:05:00.000Z",
      departmentId: "dept_flv",
      id: "schedule_notification_collaborator_publish",
      message: "Sua escala 09:00-17:00 foi publicada.",
      organizationId: "org_demo",
      shiftId: "shift_today_collaborator",
      status: "sent",
      storeId: "store_001",
      type: "schedule_published",
      userId: "user_demo_colaborador",
    },
    {
      createdAt: "2026-04-23T06:42:00.000Z",
      departmentId: "dept_flv",
      id: "schedule_notification_leader_availability",
      message: "Julia Lima enviou disponibilidade para revisao.",
      organizationId: "org_demo",
      requestId: "request_availability_collaborator",
      status: "sent",
      storeId: "store_001",
      type: "availability_submitted",
      userId: "user_demo_lider",
    },
    {
      createdAt: "2026-04-23T08:26:00.000Z",
      departmentId: "dept_flv",
      id: "schedule_notification_manager_swap",
      message: "Mateus Rocha aceitou uma troca e aguarda aprovacao.",
      organizationId: "org_demo",
      requestId: "request_swap_weekend",
      status: "sent",
      storeId: "store_001",
      type: "swap_responded",
      userId: "user_demo_gerente",
    },
    {
      createdAt: "2026-04-23T08:26:00.000Z",
      departmentId: "dept_flv",
      id: "schedule_notification_collaborator_swap",
      message: "Mateus Rocha aceitou sua proposta de troca. Agora falta aprovacao.",
      organizationId: "org_demo",
      requestId: "request_swap_weekend",
      status: "sent",
      storeId: "store_001",
      type: "swap_responded",
      userId: "user_demo_colaborador",
    },
  ];
  const checklistRuns: readonly ChecklistRunRecord[] = [
    {
      assignedUserId: "user_demo_colaborador",
      completedAt: "2026-04-23T09:35:00.000Z",
      departmentId: "dept_flv",
      dueAt: "2026-04-23T09:30:00.000Z",
      id: "checklist_run_1",
      organizationId: "org_demo",
      pendingSync: false,
      routineId: "opening",
      shiftId: "shift_today_collaborator",
      status: "completed",
      storeId: "store_001",
    },
    {
      assignedUserId: "user_demo_colaborador",
      completedAt: "2026-04-23T10:35:00.000Z",
      departmentId: "dept_flv",
      dueAt: "2026-04-23T10:30:00.000Z",
      id: "checklist_run_2",
      organizationId: "org_demo",
      pendingSync: false,
      routineId: "quality-review",
      shiftId: "shift_today_collaborator",
      status: "completed",
      storeId: "store_001",
    },
    {
      assignedUserId: "user_demo_colaborador",
      departmentId: "dept_flv",
      dueAt: "2026-04-23T12:30:00.000Z",
      id: "checklist_run_3",
      organizationId: "org_demo",
      pendingSync: true,
      routineId: "replenishment",
      shiftId: "shift_today_collaborator",
      status: "pending",
      storeId: "store_001",
    },
    {
      assignedUserId: "user_demo_colaborador",
      departmentId: "dept_flv",
      dueAt: "2026-04-23T08:45:00.000Z",
      id: "checklist_run_4",
      organizationId: "org_demo",
      pendingSync: false,
      routineId: "cleaning",
      shiftId: "shift_today_collaborator",
      status: "overdue",
      storeId: "store_001",
    },
    {
      assignedUserId: "user_demo_colaborador",
      departmentId: "dept_flv",
      dueAt: "2026-04-23T11:45:00.000Z",
      id: "checklist_run_5",
      organizationId: "org_demo",
      pendingSync: false,
      routineId: "labels",
      shiftId: "shift_today_collaborator",
      status: "pending",
      storeId: "store_001",
    },
    {
      assignedUserId: "user_demo_colaborador",
      departmentId: "dept_flv",
      dueAt: "2026-04-23T17:00:00.000Z",
      id: "checklist_run_6",
      organizationId: "org_demo",
      pendingSync: false,
      routineId: "closing",
      shiftId: "shift_today_collaborator",
      status: "pending",
      storeId: "store_001",
    },
  ];
  const checklistItemCompletions: readonly ChecklistItemCompletionRecord[] = [
    {
      completedAt: "2026-04-23T09:05:00.000Z",
      completedByUserId: "user_demo_colaborador",
      departmentId: "dept_flv",
      evidenceMode: "none",
      id: "checklist_run_1:opening-temperature",
      itemId: "opening-temperature",
      organizationId: "org_demo",
      pendingSync: false,
      runId: "checklist_run_1",
      shiftId: "shift_today_collaborator",
      status: "completed",
      storeId: "store_001",
    },
    {
      completedAt: "2026-04-23T09:08:00.000Z",
      completedByUserId: "user_demo_colaborador",
      departmentId: "dept_flv",
      evidenceMode: "required",
      evidencePhotoUrl: "https://images.engaja.local/operations/opening-front.jpg",
      id: "checklist_run_1:opening-front",
      itemId: "opening-front",
      note: "Frente premium pronta com folhas e ervas vivas.",
      organizationId: "org_demo",
      pendingSync: false,
      runId: "checklist_run_1",
      shiftId: "shift_today_collaborator",
      status: "completed",
      storeId: "store_001",
    },
    {
      completedAt: "2026-04-23T09:12:00.000Z",
      completedByUserId: "user_demo_colaborador",
      departmentId: "dept_flv",
      evidenceMode: "optional",
      evidencePhotoUrl: "https://images.engaja.local/operations/opening-breakage.jpg",
      id: "checklist_run_1:opening-breakage",
      itemId: "opening-breakage",
      note: "Quebra separada antes da reposicao principal.",
      organizationId: "org_demo",
      pendingSync: false,
      runId: "checklist_run_1",
      shiftId: "shift_today_collaborator",
      status: "completed",
      storeId: "store_001",
    },
    {
      completedAt: "2026-04-23T09:20:00.000Z",
      completedByUserId: "user_demo_colaborador",
      departmentId: "dept_flv",
      evidenceMode: "none",
      id: "checklist_run_1:opening-cleanline",
      itemId: "opening-cleanline",
      organizationId: "org_demo",
      pendingSync: false,
      runId: "checklist_run_1",
      shiftId: "shift_today_collaborator",
      status: "completed",
      storeId: "store_001",
    },
    {
      completedAt: "2026-04-23T10:04:00.000Z",
      completedByUserId: "user_demo_colaborador",
      departmentId: "dept_flv",
      evidenceMode: "none",
      id: "checklist_run_2:quality-ripeness",
      itemId: "quality-ripeness",
      organizationId: "org_demo",
      pendingSync: false,
      runId: "checklist_run_2",
      shiftId: "shift_today_collaborator",
      status: "completed",
      storeId: "store_001",
    },
    {
      completedAt: "2026-04-23T10:08:00.000Z",
      completedByUserId: "user_demo_colaborador",
      departmentId: "dept_flv",
      evidenceMode: "required",
      evidencePhotoUrl: "https://images.engaja.local/operations/quality-damaged.jpg",
      id: "checklist_run_2:quality-damaged",
      itemId: "quality-damaged",
      note: "Avarias retiradas da frente da banca.",
      organizationId: "org_demo",
      pendingSync: false,
      runId: "checklist_run_2",
      shiftId: "shift_today_collaborator",
      status: "completed",
      storeId: "store_001",
    },
    {
      completedAt: "2026-04-23T10:12:00.000Z",
      completedByUserId: "user_demo_colaborador",
      departmentId: "dept_flv",
      evidenceMode: "optional",
      evidencePhotoUrl: "https://images.engaja.local/operations/quality-reference.jpg",
      id: "checklist_run_2:quality-reference",
      itemId: "quality-reference",
      organizationId: "org_demo",
      pendingSync: false,
      runId: "checklist_run_2",
      shiftId: "shift_today_collaborator",
      status: "completed",
      storeId: "store_001",
    },
    {
      completedAt: "2026-04-23T10:20:00.000Z",
      completedByUserId: "user_demo_colaborador",
      departmentId: "dept_flv",
      evidenceMode: "none",
      id: "checklist_run_2:quality-escalation",
      itemId: "quality-escalation",
      note: "Sem escalonamento adicional neste ciclo.",
      organizationId: "org_demo",
      pendingSync: false,
      runId: "checklist_run_2",
      shiftId: "shift_today_collaborator",
      status: "completed",
      storeId: "store_001",
    },
    {
      completedAt: "2026-04-23T11:05:00.000Z",
      completedByUserId: "user_demo_colaborador",
      departmentId: "dept_flv",
      evidenceMode: "optional",
      evidencePhotoUrl: "https://images.engaja.local/operations/replenishment-berries.jpg",
      id: "checklist_run_3:replenishment-berries",
      itemId: "replenishment-berries",
      organizationId: "org_demo",
      pendingSync: true,
      runId: "checklist_run_3",
      shiftId: "shift_today_collaborator",
      status: "completed",
      storeId: "store_001",
    },
    {
      completedAt: "2026-04-23T11:10:00.000Z",
      completedByUserId: "user_demo_colaborador",
      departmentId: "dept_flv",
      evidenceMode: "none",
      id: "checklist_run_5:labels-origin",
      itemId: "labels-origin",
      organizationId: "org_demo",
      pendingSync: false,
      runId: "checklist_run_5",
      shiftId: "shift_today_collaborator",
      status: "completed",
      storeId: "store_001",
    },
  ];
  const issues: readonly OperationIssueRecord[] = [
    {
      category: "Perda e quebra",
      createdAt: "2026-04-23T11:00:00.000Z",
      departmentId: "dept_flv",
      evidencePhotoUrls: ["https://images.engaja.local/operations/loss-issue.jpg"],
      id: "issue_open_1",
      note: "Tomate grape com quebra no segundo pico. Lote separado e lider avisado.",
      organizationId: "org_demo",
      pendingSync: false,
      productName: "Tomate grape",
      quantity: 6,
      reportedByUserId: "user_demo_colaborador",
      severity: "medium",
      shiftId: "shift_today_collaborator",
      status: "open",
      storeId: "store_001",
    },
    {
      category: "Etiqueta divergente",
      createdAt: "2026-04-23T08:40:00.000Z",
      departmentId: "dept_flv",
      evidencePhotoUrls: ["https://images.engaja.local/operations/label-issue.jpg"],
      id: "issue_resolved_1",
      note: "Preco ajustado antes da abertura da loja.",
      organizationId: "org_demo",
      pendingSync: false,
      productName: "Manga palmer",
      quantity: 1,
      reportedByUserId: "user_demo_colaborador",
      severity: "low",
      shiftId: "shift_today_collaborator",
      status: "resolved",
      storeId: "store_001",
    },
  ];
  const learningBites: readonly OperationLearningBiteRecord[] = [
    {
      completedAt: "2026-04-23T09:55:00.000Z",
      completedByUserId: "user_demo_colaborador",
      departmentId: "dept_flv",
      description: "Aprenda a comparar cor, firmeza e brilho antes de manter frutas sensiveis na frente.",
      durationMinutes: 4,
      feedPostId: "post_demo_photo_mission",
      id: "learning_bite_1",
      missionTitle: "Missao abertura impecavel",
      organizationId: "org_demo",
      pendingSync: false,
      pointsAwarded: 30,
      standardId: "standard_quality_review",
      storeId: "store_001",
      title: "Triagem expressa de frutas sensiveis",
    },
    {
      departmentId: "dept_flv",
      description: "Veja como reforcar a ilha central sem perder leitura, fluxo e altura comercial.",
      durationMinutes: 3,
      feedPostId: "post_demo_photo_mission",
      id: "learning_bite_2",
      missionTitle: "Missao pico sem ruptura",
      organizationId: "org_demo",
      pendingSync: false,
      pointsAwarded: 20,
      standardId: "standard_replenishment_peak",
      storeId: "store_001",
      title: "Reposicao invisivel no pico",
    },
    {
      departmentId: "dept_flv",
      description: "Revise como documentar quebra, observacoes e evidencias para a troca de time.",
      durationMinutes: 5,
      id: "learning_bite_3",
      organizationId: "org_demo",
      pendingSync: false,
      standardId: "standard_closing_handover",
      storeId: "store_001",
      title: "Passagem de turno com contexto",
    },
  ];
  const ledgerEntries: readonly PointsLedgerRecord[] = [
    {
      amount: 20,
      departmentId: "dept_flv",
      id: "points_1",
      occurredAt: "2026-04-23T08:00:00.000Z",
      organizationId: "org_demo",
      reason: "Reconhecimento por qualidade",
      source: "recognition",
      sourceId: "recognition_demo",
      storeId: "store_001",
      userId: "user_demo_colaborador",
    },
    {
      amount: 100,
      departmentId: "dept_flv",
      id: "points_2",
      occurredAt: "2026-04-15T08:00:00.000Z",
      organizationId: "org_demo",
      reason: "Missao concluida",
      source: "feed_post",
      sourceId: "post_demo_photo_mission",
      storeId: "store_001",
      userId: "user_demo_colaborador",
    },
  ];
  const badgeAwards: readonly BadgeAwardRecord[] = [
    {
      awardedAt: "2026-04-20T12:00:00.000Z",
      code: "consistencia-flv",
      departmentId: "dept_flv",
      id: "badge_1",
      organizationId: "org_demo",
      storeId: "store_001",
      userId: "user_demo_colaborador",
    },
    {
      awardedAt: "2026-04-21T12:00:00.000Z",
      code: "qualidade-premium",
      departmentId: "dept_flv",
      id: "badge_2",
      organizationId: "org_demo",
      storeId: "store_001",
      userId: "user_demo_colaborador",
    },
  ];
  const recognitionEvents: readonly RecognitionEventRecord[] = [
    {
      category: "quality",
      createdAt: "2026-04-23T08:00:00.000Z",
      departmentId: "dept_flv",
      id: "recognition_demo",
      message: "Excelente abertura da banca.",
      organizationId: "org_demo",
      pointsAwarded: 20,
      recipientUserId: "user_demo_colaborador",
      senderUserId: "user_demo_lider",
      sourceFeedPostId: "post_demo_photo_mission",
      storeId: "store_001",
    },
  ];
  const engagementScope = createTenantScope({
    departmentId: "dept_flv",
    organizationId: "org_demo",
    storeId: "store_001",
  });
  const engagementCampaigns: readonly EngagementCampaign[] = [
    createEngagementCampaign({
      createdAt: new Date("2026-04-22T00:00:00.000Z"),
      createdByUserId: "user_demo_lider",
      description:
        "Campanha exemplo para destacar quem manteve constancia em fotos aprovadas no feed FLV.",
      eligibility: {
        eligibleUserIds: ["user_demo_colaborador"],
        maxEventsPerDay: 1,
        requiresApprovedFeedPost: true,
        requiresOperationalValidation: false,
      },
      endsAt: new Date("2026-04-29T23:59:00.000Z"),
      id: "campaign_weekly_photo",
      objective: "Aumentar a participacao com fotos aprovadas e de boa qualidade durante a semana.",
      periodPreset: "weekly",
      reward: {
        badgeCode: "foto-aprovada-semana",
        highlightLabel: "Destaque no perfil",
        points: 40,
        title: "Badge Foto Aprovada da Semana",
        type: "digital",
      },
      scoringRule: {
        maxEventsPerUser: 7,
        metricType: "approved-photo-post",
        pointsPerEligibleEvent: 10,
        requireUniqueSources: true,
        tieBreakers: [
          { kind: "approved-quality", priority: 1 },
          { kind: "first-to-finish", priority: 2 },
        ],
      },
      scope: engagementScope,
      settlement: {
        mode: "automatic",
        winnerCount: 1,
      },
      startsAt: new Date("2026-04-22T00:00:00.000Z"),
      status: "active",
      title: "Semana da Foto Aprovada",
    }),
    createEngagementCampaign({
      createdAt: new Date("2026-04-16T00:00:00.000Z"),
      createdByUserId: "user_demo_lider",
      description: "Campanha exemplo para premiar a melhor execucao validada de banca FLV.",
      eligibility: {
        eligibleUserIds: ["user_demo_colaborador"],
        maxEventsPerDay: 1,
        requiresApprovedFeedPost: false,
        requiresOperationalValidation: true,
      },
      endsAt: new Date("2026-04-23T08:00:00.000Z"),
      id: "campaign_banca_nota_10",
      objective: "Reforcar capricho operacional com evidencias validadas de banca pronta para abertura.",
      periodPreset: "weekly",
      reward: {
        approvalPolicyCode: "rh-folga-flv",
        description: "Folga de 1 turno com aprovacao da gerente da loja.",
        fulfillmentWindowDays: 30,
        title: "Folga aprovada na escala",
        type: "manual-company-approved",
      },
      scoringRule: {
        maxEventsPerUser: 5,
        metricType: "validated-banca-setup",
        pointsPerEligibleEvent: 15,
        requireUniqueSources: true,
        tieBreakers: [
          { kind: "approved-quality", priority: 1 },
          { kind: "consistency", priority: 2 },
        ],
      },
      scope: engagementScope,
      settlement: {
        mode: "manual-review",
        winnerCount: 1,
      },
      startsAt: new Date("2026-04-16T00:00:00.000Z"),
      status: "closed",
      title: "Banca Nota 10",
    }),
  ];
  const eligibleEngagementEvents: readonly EligibleEngagementEvent[] = [
    createEligibleEngagementEvent({
      actorUserId: "user_demo_colaborador",
      awardedAt: new Date("2026-04-22T08:40:00.000Z"),
      campaignId: "campaign_weekly_photo",
      id: "eligible_weekly_photo_1",
      ruleLabel: "Foto publicada e aprovada pela moderacao da campanha semanal.",
      ruleMetadata: {
        moderationState: "approved",
        sourceTable: "feed_posts",
      },
      scope: engagementScope,
      scoreValue: 10,
      sourceId: "post_demo_photo_mission",
      sourceType: "approved-photo-post",
      status: "counted",
    }),
    createEligibleEngagementEvent({
      actorUserId: "user_demo_colaborador",
      awardedAt: new Date("2026-04-23T07:12:00.000Z"),
      campaignId: "campaign_banca_nota_10",
      id: "eligible_banca_1",
      ruleLabel: "Banca validada com evidencia operacional na abertura.",
      ruleMetadata: {
        checklistRunId: "checklist_run_1",
        validationSource: "checklist-run",
      },
      scope: engagementScope,
      scoreValue: 15,
      sourceId: "checklist_run_1",
      sourceType: "validated-banca-setup",
      status: "counted",
    }),
  ];
  const rewardGrants: readonly RewardGrant[] = [
    createRewardGrant({
      approvedAt: new Date("2026-04-23T09:00:00.000Z"),
      approvedByUserId: "user_demo_gerente",
      campaignId: "campaign_banca_nota_10",
      grantedAt: new Date("2026-04-23T08:20:00.000Z"),
      id: "reward_banca_approved",
      metadata: {
        campaignMetric: "validated-banca-setup",
        evidenceSource: "checklist-run",
        winningEventId: "eligible_banca_1",
      },
      position: 1,
      reward: {
        approvalPolicyCode: "rh-folga-flv",
        description: "Folga de 1 turno com aprovacao da gerente da loja.",
        fulfillmentWindowDays: 30,
        title: "Folga aprovada na escala",
        type: "manual-company-approved",
      },
      scope: engagementScope,
      status: "approved-for-fulfillment",
      userId: "user_demo_colaborador",
      winningScore: 15,
    }),
  ];
  const archiveItems: readonly CollaboratorArchiveItem[] = [
    createCollaboratorArchiveItem({
      campaignId: "campaign_banca_nota_10",
      grantingRule: "Maior numero de bancas validadas dentro do periodo da campanha.",
      id: "archive_banca_win",
      metadata: {
        position: 1,
        winningScore: 15,
      },
      occurredAt: new Date("2026-04-23T08:20:00.000Z"),
      relatedContentReference: "checklist-run:checklist_run_1",
      scope: engagementScope,
      sourceAction: "Banca validada na apuracao final da campanha.",
      sourceId: "checklist_run_1",
      sourceType: "validated-banca-setup",
      status: "recorded",
      title: "Vencedora da campanha Banca Nota 10",
      type: "challenge-won",
      userId: "user_demo_colaborador",
    }),
    createCollaboratorArchiveItem({
      campaignId: "campaign_banca_nota_10",
      grantingRule: "Premio oficial da campanha Banca Nota 10 com governanca interna.",
      id: "archive_banca_prize",
      metadata: {
        approvalPolicyCode: "rh-folga-flv",
        fulfillmentWindowDays: 30,
      },
      occurredAt: new Date("2026-04-23T09:00:00.000Z"),
      relatedContentReference: "campaign:campaign_banca_nota_10",
      responsibleApproverUserId: "user_demo_gerente",
      rewardGrantId: "reward_banca_approved",
      rewardStatus: "approved-for-fulfillment",
      scope: engagementScope,
      sourceAction: "Premio manual aprovado pela gerente da loja.",
      sourceId: "reward_banca_approved",
      sourceType: "reward-grant",
      status: "recorded",
      title: "Folga aprovada para retirada",
      type: "manual-prize",
      userId: "user_demo_colaborador",
    }),
  ];
  const metricSnapshots: readonly MetricSnapshotRecord[] = [
    {
      capturedAt: "2026-04-23T12:00:00.000Z",
      departmentId: "dept_flv",
      id: "metric_engagement",
      key: "engagement_rate",
      organizationId: "org_demo",
      storeId: "store_001",
      value: 0.76,
    },
    {
      capturedAt: "2026-04-23T12:00:00.000Z",
      departmentId: "dept_flv",
      id: "metric_schedule_gap",
      key: "schedule_gap_count",
      organizationId: "org_demo",
      storeId: "store_001",
      value: 1,
    },
  ];
  const attentionAreas: readonly AttentionAreaRecord[] = [
    {
      createdAt: "2026-04-23T12:00:00.000Z",
      departmentId: "dept_flv",
      description: "A fila de moderacao precisa ser revisada antes do fechamento.",
      id: "attention_1",
      organizationId: "org_demo",
      severity: "warning",
      storeId: "store_001",
      title: "Posts pendentes",
    },
    {
      createdAt: "2026-04-23T12:00:00.000Z",
      departmentId: "dept_flv",
      description: "A cobertura da abertura ainda depende de reforco.",
      id: "attention_2",
      organizationId: "org_demo",
      severity: "critical",
      storeId: "store_001",
      title: "Cobertura incompleta",
    },
  ];

  return {
    engagementRepository: createInMemoryEngagementRepository({
      archiveItems,
      campaigns: engagementCampaigns,
      eligibleEvents: eligibleEngagementEvents,
      rewardGrants,
    }),
    feedRepository: createInMemoryFeedRepository({
      announcements: feedAnnouncements,
      comments: feedComments,
      feedback: feedFeedback,
      polls: feedPolls,
      posts: feedPosts,
      reactions: feedReactions,
    }),
    metricsRepository: createInMemoryMetricsRepository({
      attentionAreas,
      metricSnapshots,
    }),
    operationsRepository: createInMemoryOperationsRepository({
      checklistItemCompletions,
      checklistRuns,
      issues,
      learningBites,
    }),
    recognitionRepository: createInMemoryRecognitionRepository({
      badgeAwards,
      ledgerEntries,
      recognitionEvents,
    }),
    scheduleRepository: createInMemoryScheduleRepository({
      coverageRequirements,
      notifications,
      requests,
      shifts,
      teamMembers,
    }),
  };
}

function matchesScope(
  record: {
    readonly departmentId?: string;
    readonly organizationId: string;
    readonly storeId?: string;
  },
  scope: TenantScope,
): boolean {
  if (record.organizationId !== scope.organizationId) {
    return false;
  }

  if (scope.storeId !== undefined && record.storeId !== scope.storeId) {
    return false;
  }

  if (scope.departmentId !== undefined && record.departmentId !== scope.departmentId) {
    return false;
  }

  return true;
}

function matchesTeamMemberScope(
  member: ScheduleTeamMemberRecord,
  scope: TenantScope,
): boolean {
  if (member.organizationId !== scope.organizationId) {
    return false;
  }

  if (scope.storeId !== undefined && member.storeId !== undefined && member.storeId !== scope.storeId) {
    return false;
  }

  if (scope.departmentId === undefined) {
    return true;
  }

  if (member.departmentId === scope.departmentId) {
    return true;
  }

  return member.role === "gerente-loja" || member.role === "admin-organizacao";
}
