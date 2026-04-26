import { describe, expect, it } from "vitest";

import {
  createApplicationTenantScope,
  createActorContext,
  type EngagementRepositoryPort,
  type RecognitionRepositoryPort,
  type ScheduleRepositoryPort,
  closeEngagementCampaign,
  listEngagementCampaigns,
  syncChecklistEvidenceCampaignScores,
  syncFeedPostCampaignScores,
} from "../src/index.js";
import {
  createEngagementCampaign,
  createEligibleEngagementEvent,
  createFeedPost,
  type CollaboratorArchiveItem,
  type DomainId,
  type EligibleEngagementEvent,
  type EngagementCampaign,
  type FeedPost,
  type RewardGrant,
  type TenantScope,
} from "@engaja/domain";

const scope = createApplicationTenantScope({
  departmentId: "dept_flv",
  organizationId: "org_demo",
  storeId: "store_001",
});

const leader = createActorContext({
  role: "lider-setor",
  scope: {
    departmentId: "dept_flv",
    organizationId: "org_demo",
    storeId: "store_001",
  },
  userId: "user_demo_lider",
});

describe("engagement application use cases", () => {
  it("enforces feed eligibility, duplicate protection, and per-user caps for approved photo campaigns", async () => {
    const engagementRepository = createEngagementRepositoryHarness({
      campaigns: [
        createCampaignFixture({
          eligibility: {
            eligibleUserIds: ["user_demo_colaborador"],
            maxEventsPerDay: 1,
            requiresApprovedFeedPost: true,
            requiresOperationalValidation: false,
          },
          endsAt: "2026-04-30T23:59:59.000Z",
          id: "campaign_photo_caps",
          scoringRule: {
            maxEventsPerUser: 2,
            metricType: "approved-photo-post",
            pointsPerEligibleEvent: 10,
            requireUniqueSources: true,
            tieBreakers: [{ kind: "approved-quality", priority: 1 }],
          },
          startsAt: "2026-04-23T00:00:00.000Z",
          title: "Campanha com caps",
        }),
      ],
    });

    await expect(
      syncFeedPostCampaignScores({
        engagementRepository,
        now: new Date("2026-04-23T09:00:00.000Z"),
        post: createFeedPostFixture({
          id: "post_photo_1",
          publishedAt: "2026-04-23T09:00:00.000Z",
          status: "published",
        }),
      }),
    ).resolves.toHaveLength(1);

    await expect(
      syncFeedPostCampaignScores({
        engagementRepository,
        now: new Date("2026-04-23T09:00:00.000Z"),
        post: createFeedPostFixture({
          id: "post_photo_1",
          publishedAt: "2026-04-23T09:00:00.000Z",
          status: "published",
        }),
      }),
    ).resolves.toHaveLength(0);

    await expect(
      syncFeedPostCampaignScores({
        engagementRepository,
        now: new Date("2026-04-23T11:00:00.000Z"),
        post: createFeedPostFixture({
          id: "post_photo_2",
          publishedAt: "2026-04-23T11:00:00.000Z",
          status: "published",
        }),
      }),
    ).resolves.toHaveLength(0);

    await expect(
      syncFeedPostCampaignScores({
        engagementRepository,
        now: new Date("2026-04-24T09:00:00.000Z"),
        post: createFeedPostFixture({
          id: "post_photo_pending",
          publishedAt: "2026-04-24T09:00:00.000Z",
          status: "pending_moderation",
        }),
      }),
    ).resolves.toHaveLength(0);

    await expect(
      syncFeedPostCampaignScores({
        engagementRepository,
        now: new Date("2026-04-24T10:00:00.000Z"),
        post: createFeedPostFixture({
          id: "post_photo_3",
          publishedAt: "2026-04-24T10:00:00.000Z",
          status: "published",
        }),
      }),
    ).resolves.toHaveLength(1);

    await expect(
      syncFeedPostCampaignScores({
        engagementRepository,
        now: new Date("2026-04-25T10:00:00.000Z"),
        post: createFeedPostFixture({
          id: "post_photo_4",
          publishedAt: "2026-04-25T10:00:00.000Z",
          status: "published",
        }),
      }),
    ).resolves.toHaveLength(0);

    await expect(engagementRepository.listEligibleEvents(scope)).resolves.toHaveLength(2);
    await expect(
      engagementRepository.listArchiveItemsForUser(
        "user_demo_colaborador" as DomainId<"user">,
        scope,
      ),
    ).resolves.toHaveLength(2);
  });

  it("counts only validated operational evidence for banca setup campaigns", async () => {
    const engagementRepository = createEngagementRepositoryHarness({
      campaigns: [
        createCampaignFixture({
          eligibility: {
            eligibleUserIds: ["user_demo_colaborador"],
            maxEventsPerDay: 1,
            requiresApprovedFeedPost: false,
            requiresOperationalValidation: true,
          },
          endsAt: "2026-04-30T23:59:59.000Z",
          id: "campaign_banca_validation",
          scoringRule: {
            maxEventsPerUser: 2,
            metricType: "validated-banca-setup",
            pointsPerEligibleEvent: 15,
            requireUniqueSources: true,
            tieBreakers: [{ kind: "consistency", priority: 1 }],
          },
          startsAt: "2026-04-23T00:00:00.000Z",
          title: "Banca validada",
        }),
      ],
    });

    await expect(
      syncChecklistEvidenceCampaignScores({
        actorUserId: "user_demo_colaborador" as DomainId<"user">,
        engagementRepository,
        itemId: "opening-front",
        routineId: "opening",
        scope,
      }),
    ).resolves.toHaveLength(0);

    await expect(
      syncChecklistEvidenceCampaignScores({
        actorUserId: "user_demo_colaborador" as DomainId<"user">,
        engagementRepository,
        evidencePhotoUrl: "https://example.com/evidence-invalid.webp",
        itemId: "opening-temperature",
        routineId: "opening",
        scope,
      }),
    ).resolves.toHaveLength(0);

    await expect(
      syncChecklistEvidenceCampaignScores({
        actorUserId: "user_demo_colaborador" as DomainId<"user">,
        engagementRepository,
        evidencePhotoUrl: "https://example.com/evidence-valid.webp",
        itemId: "opening-front",
        routineId: "opening",
        scope,
      }),
    ).resolves.toHaveLength(1);
  });

  it("marks archive items corrected when approved feed evidence is later hidden", async () => {
    const engagementRepository = createEngagementRepositoryHarness({
      campaigns: [
        createCampaignFixture({
          endsAt: "2026-04-30T23:59:59.000Z",
          id: "campaign_photo_correction",
          scoringRule: {
            maxEventsPerUser: 5,
            metricType: "approved-photo-post",
            pointsPerEligibleEvent: 10,
            requireUniqueSources: true,
            tieBreakers: [{ kind: "first-to-finish", priority: 1 }],
          },
          startsAt: "2026-04-23T00:00:00.000Z",
          title: "Correcao de arquivo",
        }),
      ],
    });
    const publishedPost = createFeedPostFixture({
      id: "post_to_revoke",
      publishedAt: "2026-04-23T12:00:00.000Z",
      status: "published",
    });

    await syncFeedPostCampaignScores({
      engagementRepository,
      post: publishedPost,
    });

    await expect(
      syncFeedPostCampaignScores({
        engagementRepository,
        post: createFeedPostFixture({
          id: "post_to_revoke",
          publishedAt: "2026-04-23T12:00:00.000Z",
          status: "hidden",
        }),
      }),
    ).resolves.toHaveLength(1);

    await expect(engagementRepository.listEligibleEvents(scope)).resolves.toEqual([
      expect.objectContaining({
        sourceId: "post_to_revoke",
        status: "revoked",
      }),
    ]);
    await expect(
      engagementRepository.listArchiveItemsForUser(
        "user_demo_colaborador" as DomainId<"user">,
        scope,
      ),
    ).resolves.toEqual([
      expect.objectContaining({
        sourceId: "post_to_revoke",
        status: "corrected",
      }),
    ]);
  });

  it("prefers higher approved quality when a campaign closes with tied scores", async () => {
    const engagementRepository = createEngagementRepositoryHarness({
      campaigns: [
        createCampaignFixture({
          endsAt: "2026-04-30T23:59:59.000Z",
          id: "campaign_tie_quality",
          reward: {
            approvalPolicyCode: "mgr-voucher",
            description: "Voucher oficial com aprovacao da gerencia.",
            title: "Voucher oficial",
            type: "manual-company-approved",
          },
          scoringRule: {
            maxEventsPerUser: 5,
            metricType: "approved-photo-post",
            pointsPerEligibleEvent: 10,
            requireUniqueSources: true,
            tieBreakers: [{ kind: "approved-quality", priority: 1 }],
          },
          startsAt: "2026-04-23T00:00:00.000Z",
          title: "Desempate por qualidade",
        }),
      ],
      eligibleEvents: [
        createEligibleEventFixture({
          awardedAt: "2026-04-23T08:00:00.000Z",
          campaignId: "campaign_tie_quality",
          id: "quality_a_1",
          metadata: { approvedQualityScore: 7 },
          sourceId: "post_quality_a_1",
          userId: "user_demo_colaborador",
        }),
        createEligibleEventFixture({
          awardedAt: "2026-04-23T11:00:00.000Z",
          campaignId: "campaign_tie_quality",
          id: "quality_a_2",
          metadata: { approvedQualityScore: 6 },
          sourceId: "post_quality_a_2",
          userId: "user_demo_colaborador",
        }),
        createEligibleEventFixture({
          awardedAt: "2026-04-23T07:30:00.000Z",
          campaignId: "campaign_tie_quality",
          id: "quality_b_1",
          metadata: { approvedQualityScore: 5 },
          sourceId: "post_quality_b_1",
          userId: "user_demo_colaborador_2",
        }),
        createEligibleEventFixture({
          awardedAt: "2026-04-23T09:00:00.000Z",
          campaignId: "campaign_tie_quality",
          id: "quality_b_2",
          metadata: { approvedQualityScore: 4 },
          sourceId: "post_quality_b_2",
          userId: "user_demo_colaborador_2",
        }),
      ],
    });

    await expect(
      closeEngagementCampaign({
        actor: leader,
        campaignId: "campaign_tie_quality" as DomainId<"engagement-campaign">,
        engagementRepository,
        now: new Date("2026-04-30T23:59:59.000Z"),
        recognitionRepository: createRecognitionRepositoryHarness(),
      }),
    ).resolves.toMatchObject({
      rewardGrants: [
        expect.objectContaining({
          userId: "user_demo_colaborador",
          winningScore: 20,
        }),
      ],
    });
  });

  it("prefers consistent contributors when consistency is configured as the tie-breaker", async () => {
    const campaign = createCampaignFixture({
      endsAt: "2026-04-30T23:59:59.000Z",
      id: "campaign_tie_consistency",
      scoringRule: {
        maxEventsPerUser: 5,
        metricType: "approved-photo-post",
        pointsPerEligibleEvent: 10,
        requireUniqueSources: true,
        tieBreakers: [{ kind: "consistency", priority: 1 }],
      },
      startsAt: "2026-04-23T00:00:00.000Z",
      title: "Desempate por consistencia",
    });
    const engagementRepository = createEngagementRepositoryHarness({
      campaigns: [campaign],
      eligibleEvents: [
        createEligibleEventFixture({
          awardedAt: "2026-04-23T08:00:00.000Z",
          campaignId: campaign.id,
          id: "consistency_a_1",
          sourceId: "post_consistency_a_1",
          userId: "user_demo_colaborador",
        }),
        createEligibleEventFixture({
          awardedAt: "2026-04-24T08:00:00.000Z",
          campaignId: campaign.id,
          id: "consistency_a_2",
          sourceId: "post_consistency_a_2",
          userId: "user_demo_colaborador",
        }),
        createEligibleEventFixture({
          awardedAt: "2026-04-23T09:00:00.000Z",
          campaignId: campaign.id,
          id: "consistency_b_1",
          sourceId: "post_consistency_b_1",
          userId: "user_demo_colaborador_2",
        }),
        createEligibleEventFixture({
          awardedAt: "2026-04-23T10:00:00.000Z",
          campaignId: campaign.id,
          id: "consistency_b_2",
          sourceId: "post_consistency_b_2",
          userId: "user_demo_colaborador_2",
        }),
      ],
    });

    await expect(
      listEngagementCampaigns({
        actor: leader,
        engagementRepository,
        scheduleRepository: createScheduleRepositoryHarness(),
        scope,
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        leaderboard: [
          expect.objectContaining({
            position: 1,
            userId: "user_demo_colaborador",
          }),
          expect.objectContaining({
            position: 2,
            userId: "user_demo_colaborador_2",
          }),
        ],
      }),
    ]);
  });

  it("uses first-to-finish as the configured tie-breaker instead of first activity time", async () => {
    const engagementRepository = createEngagementRepositoryHarness({
      campaigns: [
        createCampaignFixture({
          endsAt: "2026-04-30T23:59:59.000Z",
          id: "campaign_tie_finish",
          reward: {
            approvalPolicyCode: "mgr-voucher",
            description: "Voucher oficial com aprovacao da gerencia.",
            title: "Voucher oficial",
            type: "manual-company-approved",
          },
          scoringRule: {
            maxEventsPerUser: 5,
            metricType: "approved-photo-post",
            pointsPerEligibleEvent: 10,
            requireUniqueSources: true,
            tieBreakers: [{ kind: "first-to-finish", priority: 1 }],
          },
          startsAt: "2026-04-23T00:00:00.000Z",
          title: "Desempate por conclusao",
        }),
      ],
      eligibleEvents: [
        createEligibleEventFixture({
          awardedAt: "2026-04-23T08:00:00.000Z",
          campaignId: "campaign_tie_finish",
          id: "finish_a_1",
          sourceId: "post_finish_a_1",
          userId: "user_demo_colaborador",
        }),
        createEligibleEventFixture({
          awardedAt: "2026-04-23T11:00:00.000Z",
          campaignId: "campaign_tie_finish",
          id: "finish_a_2",
          sourceId: "post_finish_a_2",
          userId: "user_demo_colaborador",
        }),
        createEligibleEventFixture({
          awardedAt: "2026-04-23T09:00:00.000Z",
          campaignId: "campaign_tie_finish",
          id: "finish_b_1",
          sourceId: "post_finish_b_1",
          userId: "user_demo_colaborador_2",
        }),
        createEligibleEventFixture({
          awardedAt: "2026-04-23T10:00:00.000Z",
          campaignId: "campaign_tie_finish",
          id: "finish_b_2",
          sourceId: "post_finish_b_2",
          userId: "user_demo_colaborador_2",
        }),
      ],
    });

    await expect(
      closeEngagementCampaign({
        actor: leader,
        campaignId: "campaign_tie_finish" as DomainId<"engagement-campaign">,
        engagementRepository,
        now: new Date("2026-04-30T23:59:59.000Z"),
        recognitionRepository: createRecognitionRepositoryHarness(),
      }),
    ).resolves.toMatchObject({
      rewardGrants: [
        expect.objectContaining({
          userId: "user_demo_colaborador_2",
          winningScore: 20,
        }),
      ],
    });
  });
});

function createCampaignFixture(input: {
  readonly eligibility?: {
    readonly eligibleUserIds?: readonly string[];
    readonly maxEventsPerDay?: number;
    readonly requiresApprovedFeedPost?: boolean;
    readonly requiresOperationalValidation?: boolean;
  };
  readonly endsAt: string;
  readonly id: string;
  readonly reward?: {
    readonly approvalPolicyCode?: string;
    readonly badgeCode?: string;
    readonly description?: string;
    readonly points?: number;
    readonly title: string;
    readonly type: "digital" | "manual-company-approved";
  };
  readonly scoringRule: {
    readonly maxEventsPerUser?: number;
    readonly metricType: EngagementCampaign["scoringRule"]["metricType"];
    readonly pointsPerEligibleEvent: number;
    readonly requireUniqueSources: boolean;
    readonly tieBreakers: readonly {
      readonly kind: EngagementCampaign["scoringRule"]["tieBreakers"][number]["kind"];
      readonly priority: number;
    }[];
  };
  readonly startsAt: string;
  readonly title: string;
}): EngagementCampaign {
  return createEngagementCampaign({
    createdAt: new Date("2026-04-23T07:00:00.000Z"),
    createdByUserId: leader.userId,
    description: `Configuracao de teste para ${input.title}.`,
    ...(input.eligibility === undefined ? {} : { eligibility: input.eligibility }),
    endsAt: new Date(input.endsAt),
    id: input.id,
    objective: `Apurar ${input.title.toLowerCase()}.`,
    periodPreset: "weekly",
    reward: input.reward ?? {
      badgeCode: "badge-teste",
      points: 20,
      title: "Badge de teste",
      type: "digital",
    },
    scope,
    scoringRule: {
      ...(input.scoringRule.maxEventsPerUser === undefined
        ? {}
        : { maxEventsPerUser: input.scoringRule.maxEventsPerUser }),
      metricType: input.scoringRule.metricType,
      pointsPerEligibleEvent: input.scoringRule.pointsPerEligibleEvent,
      requireUniqueSources: input.scoringRule.requireUniqueSources,
      tieBreakers: input.scoringRule.tieBreakers,
    },
    settlement: {
      ...(input.reward?.type === "manual-company-approved" ? { mode: "manual-review" } : {}),
      winnerCount: 1,
    },
    startsAt: new Date(input.startsAt),
    status: "active",
    title: input.title,
  });
}

function createFeedPostFixture(input: {
  readonly id: string;
  readonly publishedAt: string;
  readonly status: FeedPost["status"];
  readonly authorUserId?: string;
}): FeedPost {
  const publishedAt = new Date(input.publishedAt);

  return createFeedPost({
    authorName: "Julia Lima",
    authorUserId: input.authorUserId ?? "user_demo_colaborador",
    caption: "Registro de campanha no feed.",
    category: "mission",
    createdAt: publishedAt,
    id: input.id,
    photoUrl: `https://example.com/${input.id}.webp`,
    ...(input.status === "published" || input.status === "featured" || input.status === "hidden"
      ? { publishedAt }
      : {}),
    scope,
    status: input.status,
    title: `Post ${input.id}`,
    updatedAt: publishedAt,
    visibility: "department",
  });
}

function createEligibleEventFixture(input: {
  readonly awardedAt: string;
  readonly campaignId: string;
  readonly id: string;
  readonly metadata?: Record<string, boolean | number | string>;
  readonly sourceId: string;
  readonly userId: string;
}): EligibleEngagementEvent {
  return createEligibleEngagementEvent({
    actorUserId: input.userId,
    awardedAt: new Date(input.awardedAt),
    campaignId: input.campaignId,
    id: input.id,
    ruleLabel: "Evento elegivel de teste.",
    ...(input.metadata === undefined ? {} : { ruleMetadata: input.metadata }),
    scope,
    scoreValue: 10,
    sourceId: input.sourceId,
    sourceType: "approved-photo-post",
    status: "counted",
  });
}

function createEngagementRepositoryHarness(
  input: {
    readonly archiveItems?: readonly CollaboratorArchiveItem[];
    readonly campaigns?: readonly EngagementCampaign[];
    readonly eligibleEvents?: readonly EligibleEngagementEvent[];
    readonly rewardGrants?: readonly RewardGrant[];
  } = {},
): EngagementRepositoryPort {
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
    listArchiveItemsForUser(userId, currentScope) {
      return Promise.resolve(
        archiveItems.filter(
          (item) => item.userId === userId && matchesScope(item.scope, currentScope),
        ),
      );
    },
    listCampaigns(currentScope) {
      return Promise.resolve(
        campaigns.filter((campaign) => matchesScope(campaign.scope, currentScope)),
      );
    },
    listEligibleEvents(currentScope) {
      return Promise.resolve(
        eligibleEvents.filter((event) => matchesScope(event.scope, currentScope)),
      );
    },
    listRewardGrants(currentScope) {
      return Promise.resolve(
        rewardGrants.filter((grant) => matchesScope(grant.scope, currentScope)),
      );
    },
    listRewardGrantsForUser(userId, currentScope) {
      return Promise.resolve(
        rewardGrants.filter(
          (grant) => grant.userId === userId && matchesScope(grant.scope, currentScope),
        ),
      );
    },
    saveArchiveItem(item) {
      upsertEntity(archiveItems, item);

      return Promise.resolve(item);
    },
    saveCampaign(campaign) {
      upsertEntity(campaigns, campaign);

      return Promise.resolve(campaign);
    },
    saveEligibleEvent(event) {
      upsertEntity(eligibleEvents, event);

      return Promise.resolve(event);
    },
    saveRewardGrant(grant) {
      upsertEntity(rewardGrants, grant);

      return Promise.resolve(grant);
    },
  };
}

function createRecognitionRepositoryHarness(): RecognitionRepositoryPort {
  return {
    listBadgeAwardsForUser() {
      return Promise.resolve([]);
    },
    listLedgerEntries() {
      return Promise.resolve([]);
    },
    listLedgerEntriesForUser() {
      return Promise.resolve([]);
    },
    listRecognitionEvents() {
      return Promise.resolve([]);
    },
    listRecognitionEventsForUser() {
      return Promise.resolve([]);
    },
    saveBadgeAward(award) {
      return Promise.resolve(award);
    },
    saveLedgerEntry(entry) {
      return Promise.resolve(entry);
    },
    saveRecognitionEvent(event) {
      return Promise.resolve(event);
    },
  };
}

function createScheduleRepositoryHarness(): ScheduleRepositoryPort {
  return {
    countPendingRequestsForUser() {
      return Promise.resolve(0);
    },
    findRequestById() {
      return Promise.resolve(undefined);
    },
    findShiftById() {
      return Promise.resolve(undefined);
    },
    listCoverageRequirements() {
      return Promise.resolve([]);
    },
    listNotifications() {
      return Promise.resolve([]);
    },
    listNotificationsForUser() {
      return Promise.resolve([]);
    },
    listRequests() {
      return Promise.resolve([]);
    },
    listRequestsForUser() {
      return Promise.resolve([]);
    },
    listShifts() {
      return Promise.resolve([]);
    },
    listShiftsForUser() {
      return Promise.resolve([]);
    },
    listTeamMembers() {
      return Promise.resolve([
        {
          displayName: "Julia Lima",
          role: "colaborador" as const,
          userId: "user_demo_colaborador" as DomainId<"user">,
        },
        {
          displayName: "Mateus Rocha",
          role: "colaborador" as const,
          userId: "user_demo_colaborador_2" as DomainId<"user">,
        },
      ]);
    },
    saveNotification(notification) {
      return Promise.resolve(notification);
    },
    saveRequest(request) {
      return Promise.resolve(request);
    },
    saveShift(shift) {
      return Promise.resolve(shift);
    },
  };
}

function matchesScope(recordScope: TenantScope, currentScope: TenantScope): boolean {
  if (recordScope.organizationId !== currentScope.organizationId) {
    return false;
  }

  if (currentScope.storeId !== undefined && recordScope.storeId !== currentScope.storeId) {
    return false;
  }

  if (
    currentScope.departmentId !== undefined &&
    recordScope.departmentId !== currentScope.departmentId
  ) {
    return false;
  }

  return true;
}

function upsertEntity<TEntity extends { readonly id: string }>(
  entities: TEntity[],
  entity: TEntity,
): void {
  const currentIndex = entities.findIndex((candidate) => candidate.id === entity.id);

  if (currentIndex >= 0) {
    entities[currentIndex] = entity;
    return;
  }

  entities.push(entity);
}
