import type {
  AttentionArea,
  BadgeAward,
  ChecklistRun,
  ChecklistItemCompletion,
  CollaboratorArchiveItem,
  CoverageRequirement,
  EngagementCampaign,
  EligibleEngagementEvent,
  FlvRole,
  FeedAnnouncement,
  FeedComment,
  FeedFeedback,
  DomainId,
  FeedPoll,
  FeedPost,
  FeedPostStatus,
  FeedReaction,
  MetricSnapshot,
  OperationLearningBite,
  OperationIssue,
  PointsLedgerEntry,
  RecognitionEvent,
  RewardGrant,
  ScheduleNotification,
  ScheduleRequest,
  TenantScope,
  Shift,
} from "@engaja/domain";

export interface FeedRepositoryPort {
  countPostsByStatus(status: FeedPostStatus, scope: TenantScope): Promise<number>;
  deleteReaction(postId: DomainId<"feed-post">, userId: DomainId<"user">): Promise<void>;
  findAnnouncementById(id: DomainId<"announcement">): Promise<FeedAnnouncement | undefined>;
  findPollById(id: DomainId<"poll">): Promise<FeedPoll | undefined>;
  findPostById(id: DomainId<"feed-post">): Promise<FeedPost | undefined>;
  listAnnouncements(scope: TenantScope): Promise<readonly FeedAnnouncement[]>;
  listComments(postId: DomainId<"feed-post">): Promise<readonly FeedComment[]>;
  listFeedback(scope: TenantScope): Promise<readonly FeedFeedback[]>;
  listPolls(scope: TenantScope): Promise<readonly FeedPoll[]>;
  listPosts(scope: TenantScope): Promise<readonly FeedPost[]>;
  listReactions(postId: DomainId<"feed-post">): Promise<readonly FeedReaction[]>;
  saveAnnouncement(announcement: FeedAnnouncement): Promise<FeedAnnouncement>;
  saveComment(comment: FeedComment): Promise<FeedComment>;
  saveFeedback(feedback: FeedFeedback): Promise<FeedFeedback>;
  savePoll(poll: FeedPoll): Promise<FeedPoll>;
  savePost(post: FeedPost): Promise<FeedPost>;
  saveReaction(reaction: FeedReaction): Promise<FeedReaction>;
}

export interface ScheduleRepositoryPort {
  countPendingRequestsForUser(userId: DomainId<"user">, scope: TenantScope): Promise<number>;
  findRequestById(id: DomainId<"schedule-request">): Promise<ScheduleRequest | undefined>;
  findShiftById(id: DomainId<"shift">): Promise<Shift | undefined>;
  listCoverageRequirements(scope: TenantScope): Promise<readonly CoverageRequirement[]>;
  listNotifications(scope: TenantScope): Promise<readonly ScheduleNotification[]>;
  listNotificationsForUser(
    userId: DomainId<"user">,
    scope: TenantScope,
  ): Promise<readonly ScheduleNotification[]>;
  listRequests(scope: TenantScope): Promise<readonly ScheduleRequest[]>;
  listRequestsForUser(
    userId: DomainId<"user">,
    scope: TenantScope,
  ): Promise<readonly ScheduleRequest[]>;
  listShifts(scope: TenantScope): Promise<readonly Shift[]>;
  listShiftsForUser(userId: DomainId<"user">, scope: TenantScope): Promise<readonly Shift[]>;
  listTeamMembers(scope: TenantScope): Promise<readonly ScheduleTeamMember[]>;
  saveNotification(notification: ScheduleNotification): Promise<ScheduleNotification>;
  saveRequest(request: ScheduleRequest): Promise<ScheduleRequest>;
  saveShift(shift: Shift): Promise<Shift>;
}

export interface ScheduleTeamMember {
  readonly displayName: string;
  readonly role: FlvRole;
  readonly userId: DomainId<"user">;
}

export interface OperationsRepositoryPort {
  findChecklistRunById(id: DomainId<"checklist-run">): Promise<ChecklistRun | undefined>;
  listChecklistRuns(scope: TenantScope): Promise<readonly ChecklistRun[]>;
  listChecklistItemCompletions(scope: TenantScope): Promise<readonly ChecklistItemCompletion[]>;
  listIssues(scope: TenantScope): Promise<readonly OperationIssue[]>;
  listLearningBites(scope: TenantScope): Promise<readonly OperationLearningBite[]>;
  saveChecklistItemCompletion(
    completion: ChecklistItemCompletion,
  ): Promise<ChecklistItemCompletion>;
  saveChecklistRun(run: ChecklistRun): Promise<ChecklistRun>;
  saveIssue(issue: OperationIssue): Promise<OperationIssue>;
  saveLearningBite(learningBite: OperationLearningBite): Promise<OperationLearningBite>;
}

export interface RecognitionRepositoryPort {
  listBadgeAwardsForUser(userId: DomainId<"user">, scope: TenantScope): Promise<readonly BadgeAward[]>;
  listLedgerEntries(scope: TenantScope): Promise<readonly PointsLedgerEntry[]>;
  listLedgerEntriesForUser(
    userId: DomainId<"user">,
    scope: TenantScope,
  ): Promise<readonly PointsLedgerEntry[]>;
  listRecognitionEvents(scope: TenantScope): Promise<readonly RecognitionEvent[]>;
  listRecognitionEventsForUser(
    userId: DomainId<"user">,
    scope: TenantScope,
  ): Promise<readonly RecognitionEvent[]>;
  saveBadgeAward(award: BadgeAward): Promise<BadgeAward>;
  saveLedgerEntry(entry: PointsLedgerEntry): Promise<PointsLedgerEntry>;
  saveRecognitionEvent(event: RecognitionEvent): Promise<RecognitionEvent>;
}

export interface EngagementRepositoryPort {
  findCampaignById(id: DomainId<"engagement-campaign">): Promise<EngagementCampaign | undefined>;
  findRewardGrantById(id: DomainId<"reward-grant">): Promise<RewardGrant | undefined>;
  listArchiveItemsForUser(
    userId: DomainId<"user">,
    scope: TenantScope,
  ): Promise<readonly CollaboratorArchiveItem[]>;
  listCampaigns(scope: TenantScope): Promise<readonly EngagementCampaign[]>;
  listEligibleEvents(scope: TenantScope): Promise<readonly EligibleEngagementEvent[]>;
  listRewardGrants(scope: TenantScope): Promise<readonly RewardGrant[]>;
  listRewardGrantsForUser(
    userId: DomainId<"user">,
    scope: TenantScope,
  ): Promise<readonly RewardGrant[]>;
  saveArchiveItem(item: CollaboratorArchiveItem): Promise<CollaboratorArchiveItem>;
  saveCampaign(campaign: EngagementCampaign): Promise<EngagementCampaign>;
  saveEligibleEvent(event: EligibleEngagementEvent): Promise<EligibleEngagementEvent>;
  saveRewardGrant(grant: RewardGrant): Promise<RewardGrant>;
}

export interface MetricsRepositoryPort {
  listAttentionAreas(scope: TenantScope): Promise<readonly AttentionArea[]>;
  listMetricSnapshots(scope: TenantScope): Promise<readonly MetricSnapshot[]>;
}
