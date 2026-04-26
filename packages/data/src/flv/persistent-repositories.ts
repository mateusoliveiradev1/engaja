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
  BadgeAward,
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
import { and, eq } from "drizzle-orm";

import type { EngajaDatabase } from "../db/client.js";
import { memberships, persistentRuntimeRecords, roles, users } from "../db/schema.js";
import type { DevelopmentFlvRepositories } from "./repositories.js";
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
  toOperationIssue,
  toOperationLearningBite,
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
  type OperationIssueRecord,
  type OperationLearningBiteRecord,
  type PointsLedgerRecord,
  type RecognitionEventRecord,
  type ScheduleNotificationRecord,
  type ScheduleRequestRecord,
  type ScheduleTeamMemberRecord,
  type ShiftRecord,
} from "./records.js";

type RuntimeCollection =
  | "dashboard.attention"
  | "dashboard.metrics"
  | "engagement.archive"
  | "engagement.campaigns"
  | "engagement.eligible-events"
  | "engagement.reward-grants"
  | "feed.announcements"
  | "feed.comments"
  | "feed.feedback"
  | "feed.polls"
  | "feed.posts"
  | "feed.reactions"
  | "operations.completions"
  | "operations.issues"
  | "operations.learning-bites"
  | "operations.runs"
  | "recognition.badges"
  | "recognition.events"
  | "recognition.ledger"
  | "schedule.coverage"
  | "schedule.notifications"
  | "schedule.requests"
  | "schedule.shifts";

interface ScopeRecord {
  readonly departmentId?: string;
  readonly organizationId: string;
  readonly storeId?: string;
}

interface IdentifiedRecord {
  readonly id: string;
}

interface EngagementCampaignRecord extends ScopeRecord, IdentifiedRecord {
  readonly createdAt: string;
  readonly createdByUserId: string;
  readonly description: string;
  readonly eligibility: EngagementCampaign["eligibility"];
  readonly endsAt: string;
  readonly objective: string;
  readonly periodPreset: EngagementCampaign["periodPreset"];
  readonly reward: EngagementCampaign["reward"];
  readonly scoringRule: EngagementCampaign["scoringRule"];
  readonly settlement: EngagementCampaign["settlement"];
  readonly startsAt: string;
  readonly status: EngagementCampaign["status"];
  readonly title: string;
}

interface EligibleEngagementEventRecord extends ScopeRecord, IdentifiedRecord {
  readonly actorUserId: string;
  readonly awardedAt: string;
  readonly campaignId?: string;
  readonly ruleLabel: string;
  readonly ruleMetadata: EligibleEngagementEvent["ruleMetadata"];
  readonly scoreValue: number;
  readonly sourceId: string;
  readonly sourceType: EligibleEngagementEvent["sourceType"];
  readonly status: EligibleEngagementEvent["status"];
}

interface RewardGrantRecord extends ScopeRecord, IdentifiedRecord {
  readonly approvedAt?: string;
  readonly approvedByUserId?: string;
  readonly campaignId: string;
  readonly canceledAt?: string;
  readonly canceledByUserId?: string;
  readonly fulfilledAt?: string;
  readonly fulfilledByUserId?: string;
  readonly grantedAt: string;
  readonly metadata: RewardGrant["metadata"];
  readonly position: number;
  readonly reward: RewardGrant["reward"];
  readonly status: RewardGrant["status"];
  readonly userId: string;
  readonly winningScore: number;
}

interface CollaboratorArchiveItemRecord extends ScopeRecord, IdentifiedRecord {
  readonly campaignId?: string;
  readonly grantingRule: string;
  readonly metadata: CollaboratorArchiveItem["metadata"];
  readonly occurredAt: string;
  readonly relatedContentReference?: string;
  readonly responsibleApproverUserId?: string;
  readonly rewardGrantId?: string;
  readonly rewardStatus?: CollaboratorArchiveItem["rewardStatus"];
  readonly sourceAction: string;
  readonly sourceId: string;
  readonly sourceType: CollaboratorArchiveItem["sourceType"];
  readonly status: CollaboratorArchiveItem["status"];
  readonly title: string;
  readonly type: CollaboratorArchiveItem["type"];
  readonly userId: string;
}

class PersistentRuntimeRecordStore {
  constructor(private readonly db: EngajaDatabase) {}

  async delete(collection: RuntimeCollection, recordId: string): Promise<void> {
    await this.db
      .delete(persistentRuntimeRecords)
      .where(
        and(
          eq(persistentRuntimeRecords.collection, collection),
          eq(persistentRuntimeRecords.recordId, recordId),
        ),
      );
  }

  async find<TRecord extends IdentifiedRecord>(
    collection: RuntimeCollection,
    recordId: string,
  ): Promise<TRecord | undefined> {
    const rows = await this.db
      .select({ payload: persistentRuntimeRecords.payload })
      .from(persistentRuntimeRecords)
      .where(
        and(
          eq(persistentRuntimeRecords.collection, collection),
          eq(persistentRuntimeRecords.recordId, recordId),
        ),
      )
      .limit(1);

    const row = rows[0];

    return row === undefined ? undefined : (row.payload as unknown as TRecord);
  }

  async list<TRecord extends IdentifiedRecord>(
    collection: RuntimeCollection,
  ): Promise<readonly TRecord[]> {
    const rows = await this.db
      .select({ payload: persistentRuntimeRecords.payload })
      .from(persistentRuntimeRecords)
      .where(eq(persistentRuntimeRecords.collection, collection));

    return rows.map((row) => row.payload as unknown as TRecord);
  }

  async upsert<TRecord extends IdentifiedRecord & object>(
    collection: RuntimeCollection,
    scope: TenantScope,
    record: TRecord,
  ): Promise<void> {
    const now = new Date();
    const payload = record as unknown as Record<string, unknown>;

    await this.db
      .insert(persistentRuntimeRecords)
      .values({
        collection,
        createdAt: now,
        departmentId: scope.departmentId ?? null,
        organizationId: scope.organizationId,
        payload,
        recordId: record.id,
        storeId: scope.storeId ?? null,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        set: {
          departmentId: scope.departmentId ?? null,
          organizationId: scope.organizationId,
          payload,
          storeId: scope.storeId ?? null,
          updatedAt: now,
        },
        target: [persistentRuntimeRecords.collection, persistentRuntimeRecords.recordId],
      });
  }
}

export function createPersistentFlvRepositories(db: EngajaDatabase): DevelopmentFlvRepositories {
  const store = new PersistentRuntimeRecordStore(db);

  return {
    engagementRepository: createPersistentEngagementRepository(store),
    feedRepository: createPersistentFeedRepository(store),
    metricsRepository: createPersistentMetricsRepository(store),
    operationsRepository: createPersistentOperationsRepository(store),
    recognitionRepository: createPersistentRecognitionRepository(store),
    scheduleRepository: createPersistentScheduleRepository(store, db),
  };
}

function createPersistentFeedRepository(store: PersistentRuntimeRecordStore): FeedRepositoryPort {
  return {
    async countPostsByStatus(status, scope) {
      const posts = await listScopedRecords<FeedPostRecord>(store, "feed.posts", scope);

      return posts.filter((record) => record.status === status).length;
    },
    async deleteReaction(postId, userId) {
      const reactions = await store.list<FeedReactionRecord>("feed.reactions");
      const matches = reactions.filter(
        (record) => record.postId === postId && record.userId === userId,
      );

      await Promise.all(matches.map((record) => store.delete("feed.reactions", record.id)));
    },
    async findAnnouncementById(id) {
      const record = await store.find<FeedAnnouncementRecord>("feed.announcements", id);

      return record === undefined ? undefined : toFeedAnnouncement(record);
    },
    async findPollById(id) {
      const record = await store.find<FeedPollRecord>("feed.polls", id);

      return record === undefined ? undefined : toFeedPoll(record);
    },
    async findPostById(id) {
      const record = await store.find<FeedPostRecord>("feed.posts", id);

      return record === undefined ? undefined : toFeedPost(record);
    },
    async listAnnouncements(scope) {
      const records = await listScopedRecords<FeedAnnouncementRecord>(
        store,
        "feed.announcements",
        scope,
      );

      return records.map(toFeedAnnouncement);
    },
    async listComments(postId) {
      const records = await store.list<FeedCommentRecord>("feed.comments");

      return records.filter((record) => record.postId === postId).map(toFeedComment);
    },
    async listFeedback(scope) {
      const records = await listScopedRecords<FeedFeedbackRecord>(store, "feed.feedback", scope);

      return records.map(toFeedFeedback);
    },
    async listPolls(scope) {
      const records = await listScopedRecords<FeedPollRecord>(store, "feed.polls", scope);

      return records.map(toFeedPoll);
    },
    async listPosts(scope) {
      const records = await listScopedRecords<FeedPostRecord>(store, "feed.posts", scope);

      return records.map(toFeedPost);
    },
    async listReactions(postId) {
      const records = await store.list<FeedReactionRecord>("feed.reactions");

      return records.filter((record) => record.postId === postId).map(toFeedReaction);
    },
    async saveAnnouncement(announcement) {
      const record = fromFeedAnnouncement(announcement);
      await store.upsert("feed.announcements", announcement.scope, record);

      return toFeedAnnouncement(record);
    },
    async saveComment(comment) {
      const record = fromFeedComment(comment);
      await store.upsert("feed.comments", comment.scope, record);

      return toFeedComment(record);
    },
    async saveFeedback(feedback) {
      const record = fromFeedFeedback(feedback);
      await store.upsert("feed.feedback", feedback.scope, record);

      return toFeedFeedback(record);
    },
    async savePoll(poll) {
      const record = fromFeedPoll(poll);
      await store.upsert("feed.polls", poll.scope, record);

      return toFeedPoll(record);
    },
    async savePost(post) {
      const record = fromFeedPost(post);
      await store.upsert("feed.posts", post.scope, record);

      return toFeedPost(record);
    },
    async saveReaction(reaction) {
      const record = fromFeedReaction(reaction);
      await store.upsert("feed.reactions", reaction.scope, record);

      return toFeedReaction(record);
    },
  };
}

function createPersistentScheduleRepository(
  store: PersistentRuntimeRecordStore,
  db: EngajaDatabase,
): ScheduleRepositoryPort {
  return {
    async countPendingRequestsForUser(userId, scope) {
      const records = await listScopedRecords<ScheduleRequestRecord>(
        store,
        "schedule.requests",
        scope,
      );

      return records.filter(
        (record) =>
          record.requesterUserId === userId &&
          (record.status === "accepted" || record.status === "pending"),
      ).length;
    },
    async findRequestById(id) {
      const record = await store.find<ScheduleRequestRecord>("schedule.requests", id);

      return record === undefined ? undefined : toScheduleRequest(record);
    },
    async findShiftById(id) {
      const record = await store.find<ShiftRecord>("schedule.shifts", id);

      return record === undefined ? undefined : toShift(record);
    },
    async listCoverageRequirements(scope) {
      const records = await listScopedRecords<CoverageRequirementRecord>(
        store,
        "schedule.coverage",
        scope,
      );

      return records.map(toCoverageRequirement);
    },
    async listNotifications(scope) {
      const records = await listScopedRecords<ScheduleNotificationRecord>(
        store,
        "schedule.notifications",
        scope,
      );

      return records.map(toScheduleNotification);
    },
    async listNotificationsForUser(userId, scope) {
      const records = await listScopedRecords<ScheduleNotificationRecord>(
        store,
        "schedule.notifications",
        scope,
      );

      return records.filter((record) => record.userId === userId).map(toScheduleNotification);
    },
    async listRequests(scope) {
      const records = await listScopedRecords<ScheduleRequestRecord>(
        store,
        "schedule.requests",
        scope,
      );

      return records.map(toScheduleRequest);
    },
    async listRequestsForUser(userId, scope) {
      const records = await listScopedRecords<ScheduleRequestRecord>(
        store,
        "schedule.requests",
        scope,
      );

      return records
        .filter(
          (record) => record.requesterUserId === userId || record.counterpartUserId === userId,
        )
        .map(toScheduleRequest);
    },
    async listShifts(scope) {
      const records = await listScopedRecords<ShiftRecord>(store, "schedule.shifts", scope);

      return records.map(toShift);
    },
    async listShiftsForUser(userId, scope) {
      const records = await listScopedRecords<ShiftRecord>(store, "schedule.shifts", scope);

      return records.filter((record) => record.userId === userId).map(toShift);
    },
    listTeamMembers(scope) {
      return listPersistentTeamMembers(db, scope);
    },
    async saveNotification(notification) {
      const record = fromScheduleNotification(notification);
      await store.upsert("schedule.notifications", notification.scope, record);

      return toScheduleNotification(record);
    },
    async saveRequest(request) {
      const record = fromScheduleRequest(request);
      await store.upsert("schedule.requests", request.scope, record);

      return toScheduleRequest(record);
    },
    async saveShift(shift) {
      const record = fromShift(shift);
      await store.upsert("schedule.shifts", shift.scope, record);

      return toShift(record);
    },
  };
}

function createPersistentOperationsRepository(
  store: PersistentRuntimeRecordStore,
): OperationsRepositoryPort {
  return {
    async findChecklistRunById(id) {
      const record = await store.find<ChecklistRunRecord>("operations.runs", id);

      return record === undefined ? undefined : toChecklistRun(record);
    },
    async listChecklistItemCompletions(scope) {
      const records = await listScopedRecords<ChecklistItemCompletionRecord>(
        store,
        "operations.completions",
        scope,
      );

      return records.map(toChecklistItemCompletion);
    },
    async listChecklistRuns(scope) {
      const records = await listScopedRecords<ChecklistRunRecord>(store, "operations.runs", scope);

      return records.map(toChecklistRun);
    },
    async listIssues(scope) {
      const records = await listScopedRecords<OperationIssueRecord>(
        store,
        "operations.issues",
        scope,
      );

      return records.map(toOperationIssue);
    },
    async listLearningBites(scope) {
      const records = await listScopedRecords<OperationLearningBiteRecord>(
        store,
        "operations.learning-bites",
        scope,
      );

      return records.map(toOperationLearningBite);
    },
    async saveChecklistItemCompletion(completion) {
      const record = fromChecklistItemCompletion(completion);
      await store.upsert("operations.completions", completion.scope, record);

      return toChecklistItemCompletion(record);
    },
    async saveChecklistRun(run) {
      const record = fromChecklistRun(run);
      await store.upsert("operations.runs", run.scope, record);

      return toChecklistRun(record);
    },
    async saveIssue(issue) {
      const record = fromOperationIssue(issue);
      await store.upsert("operations.issues", issue.scope, record);

      return toOperationIssue(record);
    },
    async saveLearningBite(learningBite) {
      const record = fromOperationLearningBite(learningBite);
      await store.upsert("operations.learning-bites", learningBite.scope, record);

      return toOperationLearningBite(record);
    },
  };
}

function createPersistentRecognitionRepository(
  store: PersistentRuntimeRecordStore,
): RecognitionRepositoryPort {
  return {
    async listBadgeAwardsForUser(userId, scope) {
      const records = await listScopedRecords<BadgeAwardRecord>(store, "recognition.badges", scope);

      return records.filter((record) => record.userId === userId).map(toBadgeAward);
    },
    async listLedgerEntries(scope) {
      const records = await listScopedRecords<PointsLedgerRecord>(
        store,
        "recognition.ledger",
        scope,
      );

      return records.map(toPointsLedgerEntry);
    },
    async listLedgerEntriesForUser(userId, scope) {
      const records = await listScopedRecords<PointsLedgerRecord>(
        store,
        "recognition.ledger",
        scope,
      );

      return records.filter((record) => record.userId === userId).map(toPointsLedgerEntry);
    },
    async listRecognitionEvents(scope) {
      const records = await listScopedRecords<RecognitionEventRecord>(
        store,
        "recognition.events",
        scope,
      );

      return records.map(toRecognitionEvent);
    },
    async listRecognitionEventsForUser(userId, scope) {
      const records = await listScopedRecords<RecognitionEventRecord>(
        store,
        "recognition.events",
        scope,
      );

      return records.filter((record) => record.recipientUserId === userId).map(toRecognitionEvent);
    },
    async saveBadgeAward(award) {
      const record = fromBadgeAward(award);
      await store.upsert("recognition.badges", award.scope, record);

      return toBadgeAward(record);
    },
    async saveLedgerEntry(entry) {
      const record = fromPointsLedgerEntry(entry);
      await store.upsert("recognition.ledger", entry.scope, record);

      return toPointsLedgerEntry(record);
    },
    async saveRecognitionEvent(event) {
      const record = fromRecognitionEvent(event);
      await store.upsert("recognition.events", event.scope, record);

      return toRecognitionEvent(record);
    },
  };
}

function createPersistentEngagementRepository(
  store: PersistentRuntimeRecordStore,
): EngagementRepositoryPort {
  return {
    async findCampaignById(id) {
      const record = await store.find<EngagementCampaignRecord>("engagement.campaigns", id);

      return record === undefined ? undefined : toEngagementCampaign(record);
    },
    async findRewardGrantById(id) {
      const record = await store.find<RewardGrantRecord>("engagement.reward-grants", id);

      return record === undefined ? undefined : toRewardGrant(record);
    },
    async listArchiveItemsForUser(userId, scope) {
      const records = await listScopedRecords<CollaboratorArchiveItemRecord>(
        store,
        "engagement.archive",
        scope,
      );

      return records.filter((record) => record.userId === userId).map(toCollaboratorArchiveItem);
    },
    async listCampaigns(scope) {
      const records = await listScopedRecords<EngagementCampaignRecord>(
        store,
        "engagement.campaigns",
        scope,
      );

      return records.map(toEngagementCampaign);
    },
    async listEligibleEvents(scope) {
      const records = await listScopedRecords<EligibleEngagementEventRecord>(
        store,
        "engagement.eligible-events",
        scope,
      );

      return records.map(toEligibleEngagementEvent);
    },
    async listRewardGrants(scope) {
      const records = await listScopedRecords<RewardGrantRecord>(
        store,
        "engagement.reward-grants",
        scope,
      );

      return records.map(toRewardGrant);
    },
    async listRewardGrantsForUser(userId, scope) {
      const records = await listScopedRecords<RewardGrantRecord>(
        store,
        "engagement.reward-grants",
        scope,
      );

      return records.filter((record) => record.userId === userId).map(toRewardGrant);
    },
    async saveArchiveItem(item) {
      const record = fromCollaboratorArchiveItem(item);
      await store.upsert("engagement.archive", item.scope, record);

      return toCollaboratorArchiveItem(record);
    },
    async saveCampaign(campaign) {
      const record = fromEngagementCampaign(campaign);
      await store.upsert("engagement.campaigns", campaign.scope, record);

      return toEngagementCampaign(record);
    },
    async saveEligibleEvent(event) {
      const record = fromEligibleEngagementEvent(event);
      await store.upsert("engagement.eligible-events", event.scope, record);

      return toEligibleEngagementEvent(record);
    },
    async saveRewardGrant(grant) {
      const record = fromRewardGrant(grant);
      await store.upsert("engagement.reward-grants", grant.scope, record);

      return toRewardGrant(record);
    },
  };
}

function createPersistentMetricsRepository(
  store: PersistentRuntimeRecordStore,
): MetricsRepositoryPort {
  return {
    async listAttentionAreas(scope) {
      const records = await listScopedRecords<AttentionAreaRecord>(
        store,
        "dashboard.attention",
        scope,
      );

      return records.map(toAttentionArea);
    },
    async listMetricSnapshots(scope) {
      const records = await listScopedRecords<MetricSnapshotRecord>(
        store,
        "dashboard.metrics",
        scope,
      );

      return records.map(toMetricSnapshot);
    },
  };
}

async function listScopedRecords<TRecord extends IdentifiedRecord & ScopeRecord>(
  store: PersistentRuntimeRecordStore,
  collection: RuntimeCollection,
  scope: TenantScope,
): Promise<readonly TRecord[]> {
  const records = await store.list<TRecord>(collection);

  return records.filter((record) => matchesScope(record, scope));
}

async function listPersistentTeamMembers(
  db: EngajaDatabase,
  scope: TenantScope,
): Promise<readonly ScheduleTeamMember[]> {
  const rows = await db
    .select({
      departmentId: memberships.departmentId,
      displayName: users.displayName,
      organizationId: memberships.organizationId,
      role: roles.code,
      storeId: memberships.storeId,
      userId: users.id,
    })
    .from(memberships)
    .innerJoin(users, eq(memberships.userId, users.id))
    .innerJoin(roles, eq(memberships.roleId, roles.id))
    .where(
      and(eq(memberships.organizationId, scope.organizationId), eq(memberships.status, "active")),
    );

  return rows
    .map<ScheduleTeamMemberRecord>((row) => ({
      ...(row.departmentId === null ? {} : { departmentId: row.departmentId }),
      displayName: row.displayName,
      organizationId: row.organizationId,
      role: row.role,
      ...(row.storeId === null ? {} : { storeId: row.storeId }),
      userId: row.userId,
    }))
    .filter((member) => matchesTeamMemberScope(member, scope))
    .map((member) => ({
      displayName: member.displayName,
      role: member.role,
      userId: member.userId as ScheduleTeamMember["userId"],
    }));
}

function matchesScope(record: ScopeRecord, scope: TenantScope): boolean {
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

function matchesTeamMemberScope(member: ScheduleTeamMemberRecord, scope: TenantScope): boolean {
  if (member.organizationId !== scope.organizationId) {
    return false;
  }

  if (
    scope.storeId !== undefined &&
    member.storeId !== undefined &&
    member.storeId !== scope.storeId
  ) {
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

function fromBadgeAward(award: BadgeAward): BadgeAwardRecord {
  return {
    awardedAt: award.awardedAt.toISOString(),
    code: award.code,
    ...(award.scope.departmentId === undefined ? {} : { departmentId: award.scope.departmentId }),
    id: award.id,
    organizationId: award.scope.organizationId,
    ...(award.scope.storeId === undefined ? {} : { storeId: award.scope.storeId }),
    userId: award.userId,
  };
}

function fromEngagementCampaign(campaign: EngagementCampaign): EngagementCampaignRecord {
  return {
    ...scopeRecord(campaign.scope),
    createdAt: campaign.createdAt.toISOString(),
    createdByUserId: campaign.createdByUserId,
    description: campaign.description,
    eligibility: campaign.eligibility,
    endsAt: campaign.window.endsAt.toISOString(),
    id: campaign.id,
    objective: campaign.objective,
    periodPreset: campaign.periodPreset,
    reward: campaign.reward,
    scoringRule: campaign.scoringRule,
    settlement: campaign.settlement,
    startsAt: campaign.window.startsAt.toISOString(),
    status: campaign.status,
    title: campaign.title,
  };
}

function toEngagementCampaign(record: EngagementCampaignRecord): EngagementCampaign {
  return createEngagementCampaign({
    createdAt: new Date(record.createdAt),
    createdByUserId: record.createdByUserId,
    description: record.description,
    eligibility: record.eligibility,
    endsAt: new Date(record.endsAt),
    id: record.id,
    objective: record.objective,
    periodPreset: record.periodPreset,
    reward: record.reward,
    scope: toScope(record),
    scoringRule: record.scoringRule,
    settlement: record.settlement,
    startsAt: new Date(record.startsAt),
    status: record.status,
    title: record.title,
  });
}

function fromEligibleEngagementEvent(
  event: EligibleEngagementEvent,
): EligibleEngagementEventRecord {
  return {
    ...scopeRecord(event.scope),
    actorUserId: event.actorUserId,
    awardedAt: event.awardedAt.toISOString(),
    ...(event.campaignId === undefined ? {} : { campaignId: event.campaignId }),
    id: event.id,
    ruleLabel: event.ruleLabel,
    ruleMetadata: event.ruleMetadata,
    scoreValue: event.scoreValue,
    sourceId: event.sourceId,
    sourceType: event.sourceType,
    status: event.status,
  };
}

function toEligibleEngagementEvent(record: EligibleEngagementEventRecord): EligibleEngagementEvent {
  return createEligibleEngagementEvent({
    actorUserId: record.actorUserId,
    awardedAt: new Date(record.awardedAt),
    ...(record.campaignId === undefined ? {} : { campaignId: record.campaignId }),
    id: record.id,
    ruleLabel: record.ruleLabel,
    ruleMetadata: record.ruleMetadata,
    scope: toScope(record),
    scoreValue: record.scoreValue,
    sourceId: record.sourceId,
    sourceType: record.sourceType,
    status: record.status,
  });
}

function fromRewardGrant(grant: RewardGrant): RewardGrantRecord {
  return {
    ...scopeRecord(grant.scope),
    ...(grant.approvedAt === undefined ? {} : { approvedAt: grant.approvedAt.toISOString() }),
    ...(grant.approvedByUserId === undefined ? {} : { approvedByUserId: grant.approvedByUserId }),
    campaignId: grant.campaignId,
    ...(grant.canceledAt === undefined ? {} : { canceledAt: grant.canceledAt.toISOString() }),
    ...(grant.canceledByUserId === undefined ? {} : { canceledByUserId: grant.canceledByUserId }),
    ...(grant.fulfilledAt === undefined ? {} : { fulfilledAt: grant.fulfilledAt.toISOString() }),
    ...(grant.fulfilledByUserId === undefined
      ? {}
      : { fulfilledByUserId: grant.fulfilledByUserId }),
    grantedAt: grant.grantedAt.toISOString(),
    id: grant.id,
    metadata: grant.metadata,
    position: grant.position,
    reward: grant.reward,
    status: grant.status,
    userId: grant.userId,
    winningScore: grant.winningScore,
  };
}

function toRewardGrant(record: RewardGrantRecord): RewardGrant {
  return createRewardGrant({
    ...(record.approvedAt === undefined ? {} : { approvedAt: new Date(record.approvedAt) }),
    ...(record.approvedByUserId === undefined ? {} : { approvedByUserId: record.approvedByUserId }),
    campaignId: record.campaignId,
    ...(record.canceledAt === undefined ? {} : { canceledAt: new Date(record.canceledAt) }),
    ...(record.canceledByUserId === undefined ? {} : { canceledByUserId: record.canceledByUserId }),
    ...(record.fulfilledAt === undefined ? {} : { fulfilledAt: new Date(record.fulfilledAt) }),
    ...(record.fulfilledByUserId === undefined
      ? {}
      : { fulfilledByUserId: record.fulfilledByUserId }),
    grantedAt: new Date(record.grantedAt),
    id: record.id,
    metadata: record.metadata,
    position: record.position,
    reward: record.reward,
    scope: toScope(record),
    status: record.status,
    userId: record.userId,
    winningScore: record.winningScore,
  });
}

function fromCollaboratorArchiveItem(item: CollaboratorArchiveItem): CollaboratorArchiveItemRecord {
  return {
    ...scopeRecord(item.scope),
    ...(item.campaignId === undefined ? {} : { campaignId: item.campaignId }),
    grantingRule: item.grantingRule,
    id: item.id,
    metadata: item.metadata,
    occurredAt: item.occurredAt.toISOString(),
    ...(item.relatedContentReference === undefined
      ? {}
      : { relatedContentReference: item.relatedContentReference }),
    ...(item.responsibleApproverUserId === undefined
      ? {}
      : { responsibleApproverUserId: item.responsibleApproverUserId }),
    ...(item.rewardGrantId === undefined ? {} : { rewardGrantId: item.rewardGrantId }),
    ...(item.rewardStatus === undefined ? {} : { rewardStatus: item.rewardStatus }),
    sourceAction: item.sourceAction,
    sourceId: item.sourceId,
    sourceType: item.sourceType,
    status: item.status,
    title: item.title,
    type: item.type,
    userId: item.userId,
  };
}

function toCollaboratorArchiveItem(record: CollaboratorArchiveItemRecord): CollaboratorArchiveItem {
  return createCollaboratorArchiveItem({
    ...(record.campaignId === undefined ? {} : { campaignId: record.campaignId }),
    grantingRule: record.grantingRule,
    id: record.id,
    metadata: record.metadata,
    occurredAt: new Date(record.occurredAt),
    ...(record.relatedContentReference === undefined
      ? {}
      : { relatedContentReference: record.relatedContentReference }),
    ...(record.responsibleApproverUserId === undefined
      ? {}
      : { responsibleApproverUserId: record.responsibleApproverUserId }),
    ...(record.rewardGrantId === undefined ? {} : { rewardGrantId: record.rewardGrantId }),
    ...(record.rewardStatus === undefined ? {} : { rewardStatus: record.rewardStatus }),
    scope: toScope(record),
    sourceAction: record.sourceAction,
    sourceId: record.sourceId,
    sourceType: record.sourceType,
    status: record.status,
    title: record.title,
    type: record.type,
    userId: record.userId,
  });
}

function scopeRecord(scope: TenantScope): ScopeRecord {
  return {
    ...(scope.departmentId === undefined ? {} : { departmentId: scope.departmentId }),
    organizationId: scope.organizationId,
    ...(scope.storeId === undefined ? {} : { storeId: scope.storeId }),
  };
}

function toScope(record: ScopeRecord): TenantScope {
  return createTenantScope({
    ...(record.departmentId === undefined ? {} : { departmentId: record.departmentId }),
    organizationId: record.organizationId,
    ...(record.storeId === undefined ? {} : { storeId: record.storeId }),
  });
}
