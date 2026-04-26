import { describe, expect, it } from "vitest";

import {
  createBadgeDefinition,
  createFeedPost,
  createPointsLedgerEntry,
  createRecognitionEvent,
  createRewardRule,
  type BadgeAward,
  type FeedPost,
  type PointsLedgerEntry,
  type RecognitionEvent,
} from "@engaja/domain";

import {
  createActorContext,
  createApplicationTenantScope,
  createApplicationUserId,
  getHealthyRecognitionRanking,
  getRecognitionProfile,
  grantPointsForEligibleAction,
  recognizeFeedPost,
  sendRecognition,
  type FeedRepositoryPort,
  type RecognitionRepositoryPort,
} from "../src/index.js";

const scope = createApplicationTenantScope({
  departmentId: "dept_flv",
  organizationId: "org_demo",
  storeId: "store_001",
});
const leader = createActorContext({
  role: "lider-setor",
  scope,
  userId: "user_demo_lider",
});
const collaborator = createActorContext({
  role: "colaborador",
  scope,
  userId: "user_demo_colaborador",
});
const recipientUserId = createApplicationUserId("user_demo_recipient");
const recipientActor = createActorContext({
  role: "colaborador",
  scope,
  userId: recipientUserId,
});

describe("recognition use cases", () => {
  it("records eligible ledger entries once and explains the earned badge in the profile", async () => {
    const recognitionRepository = createRecognitionRepositoryHarness({
      ledgerEntries: [
        createPointsLedgerEntry({
          amount: 10,
          id: "points_routine_1",
          occurredAt: new Date("2026-04-20T08:00:00.000Z"),
          reason: "Routine one",
          scope,
          source: "routine_completion",
          sourceId: "routine_1",
          userId: recipientUserId,
        }),
        createPointsLedgerEntry({
          amount: 10,
          id: "points_routine_2",
          occurredAt: new Date("2026-04-21T08:00:00.000Z"),
          reason: "Routine two",
          scope,
          source: "routine_completion",
          sourceId: "routine_2",
          userId: recipientUserId,
        }),
      ],
    });
    const badgeDefinitions = [
      createBadgeDefinition({
        code: "consistency-test",
        criteria: {
          minimumSourceCount: 3,
          source: "routine_completion",
          type: "ledger_source_count",
        },
        description: "Three eligible routines.",
        family: "consistency",
        title: "Consistency test",
      }),
    ];
    const rewardRule = createRewardRule({
      code: "routine-win",
      maxAwardsPerWindow: 10,
      points: 15,
      reason: "Routine win",
      source: "routine_completion",
      windowDays: 7,
    });

    const firstGrant = await grantPointsForEligibleAction({
      actor: leader,
      actorUserId: leader.userId,
      badgeDefinitions,
      now: new Date("2026-04-23T08:00:00.000Z"),
      recognitionRepository,
      recipientUserId,
      rewardRule,
      scope,
      sourceId: "routine_3",
    });
    const duplicateGrant = await grantPointsForEligibleAction({
      actor: leader,
      actorUserId: leader.userId,
      badgeDefinitions,
      now: new Date("2026-04-23T08:01:00.000Z"),
      recognitionRepository,
      recipientUserId,
      rewardRule,
      scope,
      sourceId: "routine_3",
    });
    const profile = await getRecognitionProfile({
      actor: recipientActor,
      badgeDefinitions,
      now: new Date("2026-04-23T08:02:00.000Z"),
      recognitionRepository,
      scope,
      targetUserId: recipientUserId,
    });

    expect(firstGrant).toMatchObject({
      awardedBadges: [
        {
          code: "consistency-test",
          explanation: "Concedido apos 3 acao(oes) elegiveis de rotina concluida.",
        },
      ],
      granted: true,
      ledgerEntry: {
        amount: 15,
        source: "routine_completion",
        sourceId: "routine_3",
      },
      reason: "granted",
    });
    expect(duplicateGrant).toEqual({
      awardedBadges: [],
      granted: false,
      reason: "duplicate_source",
    });
    expect(profile.summary).toMatchObject({
      badgeCount: 1,
      points: 35,
    });
    expect(profile.rewardExplanations[0]).toMatchObject({
      points: 15,
      reason: "Routine win",
      title: "Rotina concluida",
    });
  });

  it("limits repeated peer recognition for the same recipient and category", async () => {
    const recognitionRepository = createRecognitionRepositoryHarness();
    const limitPolicy = {
      maxReceivedFromSameActorPerWindow: 2,
      maxSentPerActorWindow: 10,
      peerRecognitionEnabled: true,
      windowDays: 7,
    };

    await sendRecognition({
      actor: collaborator,
      category: "teamwork",
      limitPolicy,
      message: "Helped protect the peak.",
      now: new Date("2026-04-23T09:00:00.000Z"),
      recognitionRepository,
      recipientUserId,
      scope,
    });
    await sendRecognition({
      actor: collaborator,
      category: "teamwork",
      limitPolicy,
      message: "Helped replenish fast.",
      now: new Date("2026-04-23T09:01:00.000Z"),
      recognitionRepository,
      recipientUserId,
      scope,
    });

    await expect(
      sendRecognition({
        actor: collaborator,
        category: "teamwork",
        limitPolicy,
        message: "Third same-window recognition.",
        now: new Date("2026-04-23T09:02:00.000Z"),
        recognitionRepository,
        recipientUserId,
        scope,
      }),
    ).rejects.toThrow("Recognition limit reached: recipient_window_limit.");
    await expect(recognitionRepository.listRecognitionEvents(scope)).resolves.toHaveLength(2);
  });

  it("builds a healthy ranking from only positive eligible scores", async () => {
    const recognitionRepository = createRecognitionRepositoryHarness({
      ledgerEntries: [
        createPointsLedgerEntry({
          amount: 70,
          id: "points_positive",
          occurredAt: new Date("2026-04-23T10:00:00.000Z"),
          reason: "Positive points",
          scope,
          source: "recognition",
          userId: "user_positive",
        }),
        createPointsLedgerEntry({
          amount: -10,
          id: "points_negative",
          occurredAt: new Date("2026-04-23T10:00:00.000Z"),
          reason: "Manual correction",
          scope,
          source: "manual_adjustment",
          userId: "user_negative",
        }),
      ],
      recognitionEvents: [
        createRecognitionEvent({
          category: "quality",
          createdAt: new Date("2026-04-23T10:01:00.000Z"),
          id: "recognition_positive",
          message: "Great display.",
          pointsAwarded: 20,
          recipientUserId: "user_positive",
          scope,
          senderUserId: leader.userId,
        }),
      ],
    });

    const ranking = await getHealthyRecognitionRanking({
      actor: leader,
      limit: 5,
      recognitionRepository,
      scope,
      teamGoalPoints: 100,
      teamMembers: [
        {
          displayName: "Positive User",
          role: "colaborador",
          userId: createApplicationUserId("user_positive"),
        },
        {
          displayName: "No Points User",
          role: "colaborador",
          userId: createApplicationUserId("user_zero"),
        },
      ],
    });

    expect(ranking.entries).toEqual([
      expect.objectContaining({
        displayName: "Positive User",
        points: 70,
        position: 1,
        recognitionCount: 1,
        userId: "user_positive",
      }),
    ]);
    expect(ranking.totalPositivePoints).toBe(70);
    expect(ranking.teamProgressPercent).toBe(70);
  });

  it("turns approved photo posts into feed-linked recognition and rejects unapproved posts", async () => {
    const approvedPost = createFeedPost({
      authorName: "Julia Lima",
      authorUserId: recipientUserId,
      caption: "Display ready.",
      category: "mission",
      createdAt: new Date("2026-04-23T11:00:00.000Z"),
      id: "post_approved",
      missionLink: {
        missionId: "mission_approved",
        missionTitle: "Approved mission",
        recognitionCategory: "quality",
        rewardPoints: 90,
      },
      photoUrl: "https://example.com/post-approved.webp",
      publishedAt: new Date("2026-04-23T11:05:00.000Z"),
      scope,
      status: "published",
      title: "Approved post",
      updatedAt: new Date("2026-04-23T11:05:00.000Z"),
      visibility: "department",
    });
    const pendingPost = createFeedPost({
      authorName: "Julia Lima",
      authorUserId: recipientUserId,
      caption: "Waiting.",
      category: "mission",
      createdAt: new Date("2026-04-23T11:10:00.000Z"),
      id: "post_pending",
      photoUrl: "https://example.com/post-pending.webp",
      scope,
      status: "pending_moderation",
      title: "Pending post",
      updatedAt: new Date("2026-04-23T11:10:00.000Z"),
      visibility: "department",
    });
    const recognitionRepository = createRecognitionRepositoryHarness();
    const feedRepository = createFeedRepositoryHarness([approvedPost, pendingPost]);

    const result = await recognizeFeedPost({
      actor: leader,
      feedRepository,
      now: new Date("2026-04-23T11:15:00.000Z"),
      postId: approvedPost.id,
      recognitionRepository,
    });

    expect(result).toMatchObject({
      ledgerEntry: {
        amount: 90,
        source: "feed_post",
        sourceId: "post_approved",
      },
      recognition: {
        category: "quality",
        recipientUserId,
        sourceFeedPostId: "post_approved",
      },
    });
    await expect(
      recognizeFeedPost({
        actor: leader,
        feedRepository,
        postId: pendingPost.id,
        recognitionRepository,
      }),
    ).rejects.toThrow("Only approved photo posts can become recognition highlights.");
  });
});

function createRecognitionRepositoryHarness(input?: {
  readonly badgeAwards?: readonly BadgeAward[];
  readonly ledgerEntries?: readonly PointsLedgerEntry[];
  readonly recognitionEvents?: readonly RecognitionEvent[];
}): RecognitionRepositoryPort {
  const badgeAwards = [...(input?.badgeAwards ?? [])];
  const ledgerEntries = [...(input?.ledgerEntries ?? [])];
  const recognitionEvents = [...(input?.recognitionEvents ?? [])];

  return {
    listBadgeAwardsForUser(userId, currentScope) {
      return Promise.resolve(
        badgeAwards.filter(
          (award) => award.userId === userId && award.scope.organizationId === currentScope.organizationId,
        ),
      );
    },
    listLedgerEntries(currentScope) {
      return Promise.resolve(
        ledgerEntries.filter((entry) => entry.scope.organizationId === currentScope.organizationId),
      );
    },
    listLedgerEntriesForUser(userId, currentScope) {
      return Promise.resolve(
        ledgerEntries.filter(
          (entry) => entry.userId === userId && entry.scope.organizationId === currentScope.organizationId,
        ),
      );
    },
    listRecognitionEvents(currentScope) {
      return Promise.resolve(
        recognitionEvents.filter((event) => event.scope.organizationId === currentScope.organizationId),
      );
    },
    listRecognitionEventsForUser(userId, currentScope) {
      return Promise.resolve(
        recognitionEvents.filter(
          (event) =>
            event.recipientUserId === userId &&
            event.scope.organizationId === currentScope.organizationId,
        ),
      );
    },
    saveBadgeAward(award) {
      upsertById(badgeAwards, award);

      return Promise.resolve(award);
    },
    saveLedgerEntry(entry) {
      upsertById(ledgerEntries, entry);

      return Promise.resolve(entry);
    },
    saveRecognitionEvent(event) {
      upsertById(recognitionEvents, event);

      return Promise.resolve(event);
    },
  };
}

function createFeedRepositoryHarness(posts: readonly FeedPost[]): FeedRepositoryPort {
  return {
    countPostsByStatus(status, currentScope) {
      return Promise.resolve(
        posts.filter((post) => post.status === status && post.scope.organizationId === currentScope.organizationId)
          .length,
      );
    },
    deleteReaction() {
      return Promise.resolve();
    },
    findAnnouncementById() {
      return Promise.resolve(undefined);
    },
    findPollById() {
      return Promise.resolve(undefined);
    },
    findPostById(id) {
      return Promise.resolve(posts.find((post) => post.id === id));
    },
    listAnnouncements() {
      return Promise.resolve([]);
    },
    listComments() {
      return Promise.resolve([]);
    },
    listFeedback() {
      return Promise.resolve([]);
    },
    listPolls() {
      return Promise.resolve([]);
    },
    listPosts(currentScope) {
      return Promise.resolve(
        posts.filter((post) => post.scope.organizationId === currentScope.organizationId),
      );
    },
    listReactions() {
      return Promise.resolve([]);
    },
    saveAnnouncement(announcement) {
      return Promise.resolve(announcement);
    },
    saveComment(comment) {
      return Promise.resolve(comment);
    },
    saveFeedback(feedback) {
      return Promise.resolve(feedback);
    },
    savePoll(poll) {
      return Promise.resolve(poll);
    },
    savePost(post) {
      return Promise.resolve(post);
    },
    saveReaction(reaction) {
      return Promise.resolve(reaction);
    },
  };
}

function upsertById<T extends { readonly id: string }>(items: T[], item: T): void {
  const currentIndex = items.findIndex((candidate) => candidate.id === item.id);

  if (currentIndex >= 0) {
    items[currentIndex] = item;
  } else {
    items.push(item);
  }
}
