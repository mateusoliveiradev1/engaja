import type { AuthorizationRequest, SecurityActor } from "@engaja/security";

import {
  createBadgeAward,
  createCollaboratorArchiveItem,
  createEngagementCampaign,
  createEligibleEngagementEvent,
  createPointsLedgerEntry,
  createRewardGrant,
  type CollaboratorArchiveItem,
  type DomainId,
  type EligibleEngagementEvent,
  type EngagementCampaign,
  type EngagementCampaignStatus,
  type EngagementMetricType,
  type EngagementRewardGrantStatus,
  type FeedPost,
  type OperationRoutineId,
  type RewardGrant,
  type TenantScope,
} from "@engaja/domain";
import { assertAuthorized } from "@engaja/security";

import type { ActorContext } from "./context.js";
import type {
  EngagementRepositoryPort,
  RecognitionRepositoryPort,
  ScheduleRepositoryPort,
} from "./ports.js";

export interface EngagementCampaignLeaderboardEntryResult {
  readonly displayName: string;
  readonly position: number;
  readonly score: number;
  readonly userId: DomainId<"user">;
}

export interface EngagementCampaignViewerProgressResult {
  readonly eligibleEventCount: number;
  readonly lastAwardedAt?: Date;
  readonly position?: number;
  readonly score: number;
  readonly userId: DomainId<"user">;
}

export interface EngagementCampaignViewResult {
  readonly campaign: EngagementCampaign;
  readonly leaderboard: readonly EngagementCampaignLeaderboardEntryResult[];
  readonly participantCount: number;
  readonly viewerProgress?: EngagementCampaignViewerProgressResult;
}

export interface EngagementCampaignClosureResult {
  readonly archiveItems: readonly CollaboratorArchiveItem[];
  readonly campaign: EngagementCampaign;
  readonly rewardGrants: readonly RewardGrant[];
}

export interface CollaboratorAchievementArchiveSummaryResult {
  readonly activeCampaignCount: number;
  readonly activeStreakDays: number;
  readonly approvedPhotoParticipationCount: number;
  readonly challengeWinCount: number;
  readonly latestActivityAt?: Date;
  readonly pendingRewardCount: number;
  readonly rewardCount: number;
  readonly validatedBancaContributionCount: number;
}

export interface CollaboratorAchievementArchiveResult {
  readonly activeCampaigns: readonly EngagementCampaignViewResult[];
  readonly items: readonly CollaboratorArchiveItem[];
  readonly rewardGrants: readonly RewardGrant[];
  readonly summary: CollaboratorAchievementArchiveSummaryResult;
}

interface CampaignScoreAggregate {
  readonly consistencyDayCount: number;
  readonly eligibleEventCount: number;
  readonly firstAwardedAt?: Date;
  readonly lastAwardedAt?: Date;
  readonly qualityTieBreakerValue: number;
  readonly score: number;
  readonly userId: DomainId<"user">;
}

export async function listEngagementCampaigns(input: {
  readonly actor: ActorContext;
  readonly engagementRepository: EngagementRepositoryPort;
  readonly scheduleRepository: ScheduleRepositoryPort;
  readonly scope: TenantScope;
  readonly viewerUserId?: DomainId<"user">;
}): Promise<readonly EngagementCampaignViewResult[]> {
  assertEngagementAuthorized(input.actor, {
    action: "engagement.campaign.read",
    resource: input.scope,
  });

  const [campaigns, eligibleEvents, teamMembers] = await Promise.all([
    input.engagementRepository.listCampaigns(input.scope),
    input.engagementRepository.listEligibleEvents(input.scope),
    input.scheduleRepository.listTeamMembers(input.scope),
  ]);
  const viewerUserId = input.viewerUserId ?? input.actor.userId;

  return [...campaigns]
    .sort((left, right) => right.window.startsAt.getTime() - left.window.startsAt.getTime())
    .map((campaign) =>
      buildCampaignViewResult(
        campaign,
        eligibleEvents.filter((event) => event.campaignId === campaign.id),
        teamMembers,
        viewerUserId,
      ),
    );
}

export async function createEngagementCampaignUseCase(input: {
  readonly actor: ActorContext;
  readonly description: string;
  readonly eligibility?: {
    readonly eligibleUserIds?: readonly string[];
    readonly maxEventsPerDay?: number;
    readonly requiresApprovedFeedPost?: boolean;
    readonly requiresOperationalValidation?: boolean;
  };
  readonly endsAt: Date;
  readonly engagementRepository: EngagementRepositoryPort;
  readonly now?: Date;
  readonly objective: string;
  readonly periodPreset: EngagementCampaign["periodPreset"];
  readonly reward: {
    readonly approvalPolicyCode?: string;
    readonly badgeCode?: string;
    readonly description?: string;
    readonly disclaimer?: string;
    readonly fulfillmentWindowDays?: number;
    readonly highlightLabel?: string;
    readonly note?: string;
    readonly points?: number;
    readonly title: string;
    readonly type: EngagementCampaign["reward"]["type"];
  };
  readonly scoringRule: {
    readonly maxEventsPerUser?: number;
    readonly metricType: EngagementMetricType;
    readonly pointsPerEligibleEvent: number;
    readonly requireUniqueSources?: boolean;
    readonly tieBreakers?: readonly {
      readonly kind: EngagementCampaign["scoringRule"]["tieBreakers"][number]["kind"];
      readonly priority?: number;
    }[];
  };
  readonly scope: TenantScope;
  readonly settlement?: {
    readonly mode?: EngagementCampaign["settlement"]["mode"];
    readonly winnerCount?: number;
  };
  readonly startsAt: Date;
  readonly status?: Extract<EngagementCampaignStatus, "active" | "draft" | "scheduled">;
  readonly title: string;
}): Promise<EngagementCampaign> {
  assertEngagementAuthorized(input.actor, {
    action: "engagement.manage",
    resource: input.scope,
  });

  const now = input.now ?? new Date();
  const rewardType = input.reward.type;
  const campaign = createEngagementCampaign({
    createdAt: now,
    createdByUserId: input.actor.userId,
    description: input.description,
    ...(input.eligibility === undefined ? {} : { eligibility: input.eligibility }),
    endsAt: input.endsAt,
    id: createCampaignId(input.actor.userId, now),
    objective: input.objective,
    periodPreset: input.periodPreset,
    reward: input.reward,
    scoringRule: input.scoringRule,
    scope: input.scope,
    settlement: {
      ...(rewardType === "manual-company-approved"
        ? { mode: "manual-review" as const }
        : input.settlement?.mode === undefined
          ? {}
          : { mode: input.settlement.mode }),
      ...(input.settlement?.winnerCount === undefined
        ? {}
        : { winnerCount: input.settlement.winnerCount }),
    },
    startsAt: input.startsAt,
    status: input.status ?? deriveCampaignStatus(input.startsAt, now),
    title: input.title,
  });

  return input.engagementRepository.saveCampaign(campaign);
}

export async function closeEngagementCampaign(input: {
  readonly actor: ActorContext;
  readonly campaignId: DomainId<"engagement-campaign">;
  readonly engagementRepository: EngagementRepositoryPort;
  readonly now?: Date;
  readonly recognitionRepository: RecognitionRepositoryPort;
}): Promise<EngagementCampaignClosureResult> {
  const campaign = await input.engagementRepository.findCampaignById(input.campaignId);

  if (campaign === undefined) {
    throw new Error("Engagement campaign not found.");
  }

  assertEngagementAuthorized(input.actor, {
    action: "engagement.manage",
    resource: campaign.scope,
  });

  const now = input.now ?? new Date();
  const [eligibleEvents, existingRewardGrants] = await Promise.all([
    input.engagementRepository.listEligibleEvents(campaign.scope),
    input.engagementRepository.listRewardGrants(campaign.scope),
  ]);
  const settledCampaign = await input.engagementRepository.saveCampaign(
    copyCampaign(campaign, {
      status: "closed",
    }),
  );
  const candidateEvents = eligibleEvents.filter(
    (event) =>
      event.campaignId === campaign.id &&
      (event.status === "counted" || event.status === "corrected"),
  );
  const leaderboard = buildCampaignScoreboard(campaign, candidateEvents);
  const winners = leaderboard
    .filter((entry) => entry.score > 0)
    .slice(0, campaign.settlement.winnerCount);
  const rewardGrants: RewardGrant[] = [];
  const archiveItems: CollaboratorArchiveItem[] = [];

  for (const winner of winners) {
    const winningEvent = candidateEvents.find((event) => event.actorUserId === winner.userId);
    const winArchiveItem = await input.engagementRepository.saveArchiveItem(
      createCollaboratorArchiveItem({
        campaignId: campaign.id,
        grantingRule: `Maior pontuacao positiva na campanha ${campaign.title}.`,
        id: createArchiveItemId(
          "challenge-won",
          campaign.id,
          winner.userId,
          String(winner.position),
        ),
        metadata: {
          position: winner.position,
          score: winner.score,
        },
        occurredAt: now,
        ...(winningEvent === undefined
          ? {}
          : {
              relatedContentReference: buildRelatedReferenceForEvent(winningEvent),
            }),
        scope: campaign.scope,
        sourceAction: `Campanha ${campaign.title} encerrada com apuracao formal.`,
        sourceId: campaign.id,
        sourceType: campaign.scoringRule.metricType,
        status: "recorded",
        title: `Vencedor(a) da campanha ${campaign.title}`,
        type: "challenge-won",
        userId: winner.userId,
      }),
    );

    archiveItems.push(winArchiveItem);

    if (campaign.reward.type === "manual-external-informal") {
      continue;
    }

    const existingGrant = existingRewardGrants.find(
      (grant) => grant.campaignId === campaign.id && grant.userId === winner.userId,
    );
    const rewardGrant =
      existingGrant ??
      createRewardGrant({
        campaignId: campaign.id,
        grantedAt: now,
        id: createRewardGrantId(campaign.id, winner.userId, winner.position),
        metadata: {
          campaignMetric: campaign.scoringRule.metricType,
          winningScore: winner.score,
        },
        position: winner.position,
        reward:
          campaign.reward.type === "digital"
            ? {
                ...(campaign.reward.badgeCode === undefined
                  ? {}
                  : { badgeCode: campaign.reward.badgeCode }),
                ...(campaign.reward.highlightLabel === undefined
                  ? {}
                  : { highlightLabel: campaign.reward.highlightLabel }),
                ...(campaign.reward.points === undefined ? {} : { points: campaign.reward.points }),
                title: campaign.reward.title,
                type: "digital",
              }
            : {
                approvalPolicyCode: campaign.reward.approvalPolicyCode,
                description: campaign.reward.description,
                ...(campaign.reward.fulfillmentWindowDays === undefined
                  ? {}
                  : {
                      fulfillmentWindowDays: campaign.reward.fulfillmentWindowDays,
                    }),
                title: campaign.reward.title,
                type: "manual-company-approved",
              },
        scope: campaign.scope,
        status: campaign.reward.type === "digital" ? "digital-granted" : "pending-company-approval",
        userId: winner.userId,
        winningScore: winner.score,
      });
    const savedRewardGrant = await input.engagementRepository.saveRewardGrant(rewardGrant);

    rewardGrants.push(savedRewardGrant);

    const rewardArchiveItem = await input.engagementRepository.saveArchiveItem(
      createCollaboratorArchiveItem({
        campaignId: campaign.id,
        grantingRule: `Recompensa oficial registrada para a campanha ${campaign.title}.`,
        id: createArchiveItemId("reward", campaign.id, winner.userId, savedRewardGrant.id),
        metadata: {
          rewardType: savedRewardGrant.reward.type,
          winningScore: winner.score,
        },
        occurredAt: now,
        rewardGrantId: savedRewardGrant.id,
        rewardStatus: savedRewardGrant.status,
        ...(savedRewardGrant.approvedByUserId === undefined
          ? {}
          : { responsibleApproverUserId: savedRewardGrant.approvedByUserId }),
        scope: campaign.scope,
        sourceAction: `Apuracao da campanha ${campaign.title} registrou a recompensa oficial.`,
        sourceId: savedRewardGrant.id,
        sourceType: "reward-grant",
        status: "recorded",
        title: savedRewardGrant.reward.title,
        type: savedRewardGrant.reward.type === "digital" ? "reward-granted" : "manual-prize",
        userId: winner.userId,
      }),
    );

    archiveItems.push(rewardArchiveItem);

    if (savedRewardGrant.reward.type === "digital") {
      if ((savedRewardGrant.reward.points ?? 0) > 0) {
        await input.recognitionRepository.saveLedgerEntry(
          createPointsLedgerEntry({
            actorUserId: input.actor.userId,
            amount: savedRewardGrant.reward.points ?? 0,
            id: createCampaignPointsLedgerId(campaign.id, winner.userId),
            occurredAt: now,
            reason: `Premio digital da campanha ${campaign.title}.`,
            scope: campaign.scope,
            source: "manual_adjustment",
            sourceId: savedRewardGrant.id,
            userId: winner.userId,
          }),
        );
      }

      if (savedRewardGrant.reward.badgeCode !== undefined) {
        await input.recognitionRepository.saveBadgeAward(
          createBadgeAward({
            awardedAt: now,
            code: savedRewardGrant.reward.badgeCode,
            id: createCampaignBadgeAwardId(
              campaign.id,
              winner.userId,
              savedRewardGrant.reward.badgeCode,
            ),
            scope: campaign.scope,
            userId: winner.userId,
          }),
        );
      }
    }
  }

  return {
    archiveItems,
    campaign: settledCampaign,
    rewardGrants,
  };
}

export async function updateRewardGrantFulfillment(input: {
  readonly actor: ActorContext;
  readonly engagementRepository: EngagementRepositoryPort;
  readonly now?: Date;
  readonly rewardGrantId: DomainId<"reward-grant">;
  readonly status: Extract<
    EngagementRewardGrantStatus,
    "approved-for-fulfillment" | "canceled" | "fulfilled"
  >;
}): Promise<RewardGrant> {
  const rewardGrant = await input.engagementRepository.findRewardGrantById(input.rewardGrantId);

  if (rewardGrant === undefined) {
    throw new Error("Reward grant not found.");
  }

  assertEngagementAuthorized(input.actor, {
    action: "engagement.manage",
    resource: rewardGrant.scope,
  });

  if (rewardGrant.reward.type === "digital") {
    throw new Error("Digital rewards do not support fulfillment updates.");
  }

  const now = input.now ?? new Date();
  const nextRewardGrant = copyRewardGrant(rewardGrant, {
    ...(input.status === "approved-for-fulfillment"
      ? {
          approvedAt: rewardGrant.approvedAt ?? now,
          approvedByUserId: rewardGrant.approvedByUserId ?? input.actor.userId,
          status: "approved-for-fulfillment",
        }
      : {}),
    ...(input.status === "fulfilled"
      ? {
          approvedAt: rewardGrant.approvedAt ?? now,
          approvedByUserId: rewardGrant.approvedByUserId ?? input.actor.userId,
          fulfilledAt: now,
          fulfilledByUserId: input.actor.userId,
          status: "fulfilled",
        }
      : {}),
    ...(input.status === "canceled"
      ? {
          canceledAt: now,
          canceledByUserId: input.actor.userId,
          status: "canceled",
        }
      : {}),
  });
  const savedRewardGrant = await input.engagementRepository.saveRewardGrant(nextRewardGrant);
  const archiveItems = await input.engagementRepository.listArchiveItemsForUser(
    savedRewardGrant.userId,
    savedRewardGrant.scope,
  );

  await Promise.all(
    archiveItems
      .filter((item) => item.rewardGrantId === savedRewardGrant.id)
      .map((item) =>
        input.engagementRepository.saveArchiveItem(
          copyArchiveItem(item, {
            ...(input.status === "approved-for-fulfillment" || input.status === "fulfilled"
              ? { responsibleApproverUserId: input.actor.userId }
              : {}),
            rewardStatus: savedRewardGrant.status,
          }),
        ),
      ),
  );

  return savedRewardGrant;
}

export async function syncFeedPostCampaignScores(input: {
  readonly engagementRepository: EngagementRepositoryPort;
  readonly now?: Date;
  readonly post: FeedPost;
}): Promise<readonly EligibleEngagementEvent[]> {
  const now = input.now ?? new Date();

  if (input.post.status === "published" || input.post.status === "featured") {
    return ingestFeedPostCampaignEvents(input.engagementRepository, input.post, now);
  }

  return revokeFeedPostCampaignEvents(input.engagementRepository, input.post);
}

export async function syncChecklistEvidenceCampaignScores(input: {
  readonly actorUserId: DomainId<"user">;
  readonly engagementRepository: EngagementRepositoryPort;
  readonly evidencePhotoUrl?: string;
  readonly itemId: string;
  readonly now?: Date;
  readonly routineId: OperationRoutineId;
  readonly scope: TenantScope;
}): Promise<readonly EligibleEngagementEvent[]> {
  if (input.evidencePhotoUrl === undefined) {
    return [];
  }

  const now = input.now ?? new Date();
  const [campaigns, eligibleEvents] = await Promise.all([
    input.engagementRepository.listCampaigns(input.scope),
    input.engagementRepository.listEligibleEvents(input.scope),
  ]);
  const savedEvents: EligibleEngagementEvent[] = [];

  for (const campaign of campaigns) {
    if (!canCampaignCountEvent(campaign, now, input.actorUserId)) {
      continue;
    }

    const sourceType = campaign.scoringRule.metricType;

    if (
      sourceType === "validated-banca-setup" &&
      !isValidatedBancaEvidence(input.routineId, input.itemId)
    ) {
      continue;
    }

    if (sourceType === "checklist-linked-evidence") {
      // Any completed checklist evidence can count for this metric.
    } else if (sourceType !== "validated-banca-setup") {
      continue;
    }

    const sourceId =
      sourceType === "validated-banca-setup"
        ? createChecklistRunId(input.routineId)
        : createChecklistCompletionSourceId(input.routineId, input.itemId);

    if (
      campaign.scoringRule.requireUniqueSources &&
      eligibleEvents.some(
        (event) =>
          event.campaignId === campaign.id &&
          event.sourceId === sourceId &&
          event.status !== "revoked",
      )
    ) {
      continue;
    }

    if (!hasCampaignCapacityForEvent(campaign, eligibleEvents, input.actorUserId, now)) {
      continue;
    }

    const savedEvent = await input.engagementRepository.saveEligibleEvent(
      createEligibleEngagementEvent({
        actorUserId: input.actorUserId,
        awardedAt: now,
        campaignId: campaign.id,
        id: createEligibleEventId(campaign.id, sourceId),
        ruleLabel:
          sourceType === "validated-banca-setup"
            ? `Banca validada com evidencia operacional na campanha ${campaign.title}.`
            : `Evidencia operacional elegivel somada na campanha ${campaign.title}.`,
        ruleMetadata: {
          evidenceSource: sourceType,
          itemId: input.itemId,
          routineId: input.routineId,
        },
        scope: campaign.scope,
        scoreValue: campaign.scoringRule.pointsPerEligibleEvent,
        sourceId,
        sourceType,
        status: "counted",
      }),
    );

    await input.engagementRepository.saveArchiveItem(
      createCollaboratorArchiveItem({
        campaignId: campaign.id,
        grantingRule: `Evidencia operacional valida registrada para ${campaign.title}.`,
        id: createArchiveItemId(sourceType, campaign.id, input.actorUserId, sourceId),
        metadata: {
          itemId: input.itemId,
          routineId: input.routineId,
          scoreValue: savedEvent.scoreValue,
        },
        occurredAt: now,
        relatedContentReference: `checklist-item:${sourceId}`,
        scope: campaign.scope,
        sourceAction: savedEvent.ruleLabel,
        sourceId,
        sourceType,
        status: "recorded",
        title:
          sourceType === "validated-banca-setup"
            ? `Banca validada em ${campaign.title}`
            : `Evidencia validada em ${campaign.title}`,
        type: sourceType === "validated-banca-setup" ? "validated-banca" : "challenge-completed",
        userId: input.actorUserId,
      }),
    );

    savedEvents.push(savedEvent);
  }

  return savedEvents;
}

export async function getCollaboratorAchievementArchive(input: {
  readonly actor: ActorContext;
  readonly engagementRepository: EngagementRepositoryPort;
  readonly scheduleRepository: ScheduleRepositoryPort;
  readonly scope: TenantScope;
  readonly targetUserId: DomainId<"user">;
}): Promise<CollaboratorAchievementArchiveResult> {
  assertEngagementAuthorized(input.actor, {
    action: "engagement.archive.read",
    resource: {
      ...input.scope,
      targetUserId: input.targetUserId,
    },
  });

  const [items, rewardGrants, campaignViews] = await Promise.all([
    input.engagementRepository.listArchiveItemsForUser(input.targetUserId, input.scope),
    input.engagementRepository.listRewardGrantsForUser(input.targetUserId, input.scope),
    listEngagementCampaigns({
      actor: input.actor,
      engagementRepository: input.engagementRepository,
      scheduleRepository: input.scheduleRepository,
      scope: input.scope,
      viewerUserId: input.targetUserId,
    }),
  ]);
  const sortedItems = [...items].sort(
    (left, right) => right.occurredAt.getTime() - left.occurredAt.getTime(),
  );
  const sortedRewardGrants = [...rewardGrants].sort(
    (left, right) => right.grantedAt.getTime() - left.grantedAt.getTime(),
  );
  const activeCampaigns = campaignViews.filter(
    (view) => view.campaign.status === "active" || view.campaign.status === "scheduled",
  );

  return {
    activeCampaigns,
    items: sortedItems,
    rewardGrants: sortedRewardGrants,
    summary: buildArchiveSummary(sortedItems, sortedRewardGrants, activeCampaigns.length),
  };
}

function assertEngagementAuthorized(actor: ActorContext, request: AuthorizationRequest): void {
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

function buildCampaignViewResult(
  campaign: EngagementCampaign,
  eligibleEvents: readonly EligibleEngagementEvent[],
  teamMembers: Awaited<ReturnType<ScheduleRepositoryPort["listTeamMembers"]>>,
  viewerUserId: DomainId<"user">,
): EngagementCampaignViewResult {
  const aggregates = buildCampaignScoreboard(campaign, eligibleEvents);
  const leaderboardEntries = aggregates.slice(0, 3).map((entry) => ({
    displayName: resolveDisplayName(entry.userId, teamMembers),
    position: entry.position,
    score: entry.score,
    userId: entry.userId,
  }));
  const viewerAggregate = aggregates.find((entry) => entry.userId === viewerUserId);

  return {
    campaign,
    leaderboard: leaderboardEntries,
    participantCount: aggregates.length,
    ...(viewerAggregate === undefined
      ? {}
      : {
          viewerProgress: {
            eligibleEventCount: viewerAggregate.eligibleEventCount,
            ...(viewerAggregate.lastAwardedAt === undefined
              ? {}
              : { lastAwardedAt: viewerAggregate.lastAwardedAt }),
            position: viewerAggregate.position,
            score: viewerAggregate.score,
            userId: viewerAggregate.userId,
          },
        }),
  };
}

function buildCampaignScoreboard(
  campaign: EngagementCampaign,
  eligibleEvents: readonly EligibleEngagementEvent[],
): Array<CampaignScoreAggregate & { readonly position: number }> {
  const eventsByUserId = new Map<DomainId<"user">, EligibleEngagementEvent[]>();

  for (const event of eligibleEvents) {
    if (event.status !== "counted" && event.status !== "corrected") {
      continue;
    }

    const currentEvents = eventsByUserId.get(event.actorUserId);

    if (currentEvents === undefined) {
      eventsByUserId.set(event.actorUserId, [event]);
      continue;
    }

    currentEvents.push(event);
  }

  return [...eventsByUserId.entries()]
    .map(([userId, events]) => buildCampaignScoreAggregate(userId, events))
    .sort((left, right) =>
      compareCampaignScoreAggregates(left, right, campaign.scoringRule.tieBreakers),
    )
    .map((entry, index) => ({
      ...entry,
      position: index + 1,
    }));
}

function buildCampaignScoreAggregate(
  userId: DomainId<"user">,
  eligibleEvents: readonly EligibleEngagementEvent[],
): CampaignScoreAggregate {
  const sortedEvents = [...eligibleEvents].sort(
    (left, right) => left.awardedAt.getTime() - right.awardedAt.getTime(),
  );
  const awardedDayKeys = new Set(sortedEvents.map((event) => toDateKey(event.awardedAt)));
  const firstAwardedAt = sortedEvents[0]?.awardedAt;
  const lastAwardedAt = sortedEvents.at(-1)?.awardedAt;

  return {
    consistencyDayCount: awardedDayKeys.size,
    eligibleEventCount: sortedEvents.length,
    ...(firstAwardedAt === undefined ? {} : { firstAwardedAt }),
    ...(lastAwardedAt === undefined ? {} : { lastAwardedAt }),
    qualityTieBreakerValue: sortedEvents.reduce(
      (total, event) => total + resolveApprovedQualityTieBreakerValue(event),
      0,
    ),
    score: sortedEvents.reduce((total, event) => total + event.scoreValue, 0),
    userId,
  };
}

function compareCampaignScoreAggregates(
  left: CampaignScoreAggregate,
  right: CampaignScoreAggregate,
  tieBreakers: EngagementCampaign["scoringRule"]["tieBreakers"],
): number {
  if (right.score !== left.score) {
    return right.score - left.score;
  }

  for (const rule of tieBreakers) {
    const comparison = compareCampaignTieBreaker(rule.kind, left, right);

    if (comparison !== 0) {
      return comparison;
    }
  }

  if (right.eligibleEventCount !== left.eligibleEventCount) {
    return right.eligibleEventCount - left.eligibleEventCount;
  }

  const leftFirstAwardedAt = left.firstAwardedAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const rightFirstAwardedAt = right.firstAwardedAt?.getTime() ?? Number.MAX_SAFE_INTEGER;

  if (leftFirstAwardedAt !== rightFirstAwardedAt) {
    return leftFirstAwardedAt - rightFirstAwardedAt;
  }

  return left.userId.localeCompare(right.userId);
}

function compareCampaignTieBreaker(
  kind: EngagementCampaign["scoringRule"]["tieBreakers"][number]["kind"],
  left: CampaignScoreAggregate,
  right: CampaignScoreAggregate,
): number {
  if (kind === "approved-quality" && right.qualityTieBreakerValue !== left.qualityTieBreakerValue) {
    return right.qualityTieBreakerValue - left.qualityTieBreakerValue;
  }

  if (kind === "consistency" && right.consistencyDayCount !== left.consistencyDayCount) {
    return right.consistencyDayCount - left.consistencyDayCount;
  }

  if (kind === "first-to-finish") {
    const leftFinishedAt = left.lastAwardedAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const rightFinishedAt = right.lastAwardedAt?.getTime() ?? Number.MAX_SAFE_INTEGER;

    if (leftFinishedAt !== rightFinishedAt) {
      return leftFinishedAt - rightFinishedAt;
    }
  }

  return 0;
}

function resolveApprovedQualityTieBreakerValue(event: EligibleEngagementEvent): number {
  const candidateKeys = [
    "approvedQualityScore",
    "qualityScore",
    "approvedQualityPoints",
    "qualityPoints",
    "qualityWeight",
  ] as const;

  for (const key of candidateKeys) {
    const candidateValue = event.ruleMetadata[key];

    if (typeof candidateValue === "number" && Number.isFinite(candidateValue)) {
      return candidateValue;
    }
  }

  return 0;
}

function buildArchiveSummary(
  items: readonly CollaboratorArchiveItem[],
  rewardGrants: readonly RewardGrant[],
  activeCampaignCount: number,
): CollaboratorAchievementArchiveSummaryResult {
  const latestActivityAt = items[0]?.occurredAt;

  return {
    activeCampaignCount,
    activeStreakDays: calculateActiveStreakDays(items),
    approvedPhotoParticipationCount: items.filter(
      (item) => item.sourceType === "approved-photo-post" && item.status !== "revoked",
    ).length,
    challengeWinCount: items.filter(
      (item) => item.type === "challenge-won" && item.status !== "revoked",
    ).length,
    ...(latestActivityAt === undefined ? {} : { latestActivityAt }),
    pendingRewardCount: rewardGrants.filter(
      (grant) =>
        grant.status === "pending-company-approval" || grant.status === "approved-for-fulfillment",
    ).length,
    rewardCount: rewardGrants.filter((grant) => grant.status !== "canceled").length,
    validatedBancaContributionCount: items.filter(
      (item) => item.type === "validated-banca" && item.status !== "revoked",
    ).length,
  };
}

async function ingestFeedPostCampaignEvents(
  engagementRepository: EngagementRepositoryPort,
  post: FeedPost,
  now: Date,
): Promise<readonly EligibleEngagementEvent[]> {
  const [campaigns, eligibleEvents] = await Promise.all([
    engagementRepository.listCampaigns(post.scope),
    engagementRepository.listEligibleEvents(post.scope),
  ]);
  const savedEvents: EligibleEngagementEvent[] = [];

  for (const campaign of campaigns) {
    const metricType = campaign.scoringRule.metricType;

    if (metricType !== "approved-photo-post" && metricType !== "approved-before-after") {
      continue;
    }

    if (!canCampaignCountEvent(campaign, now, post.authorUserId)) {
      continue;
    }

    if (metricType === "approved-before-after" && !looksLikeBeforeAfterPost(post)) {
      continue;
    }

    if (
      campaign.scoringRule.requireUniqueSources &&
      eligibleEvents.some(
        (event) =>
          event.campaignId === campaign.id &&
          event.sourceId === post.id &&
          event.status !== "revoked",
      )
    ) {
      continue;
    }

    if (!hasCampaignCapacityForEvent(campaign, eligibleEvents, post.authorUserId, now)) {
      continue;
    }

    const awardedAt = post.publishedAt ?? now;
    const savedEvent = await engagementRepository.saveEligibleEvent(
      createEligibleEngagementEvent({
        actorUserId: post.authorUserId,
        awardedAt,
        campaignId: campaign.id,
        id: createEligibleEventId(campaign.id, post.id),
        ruleLabel: `Foto aprovada pela moderacao e somada na campanha ${campaign.title}.`,
        ruleMetadata: {
          moderationState: post.status,
          sourceTable: "feed_posts",
        },
        scope: campaign.scope,
        scoreValue: campaign.scoringRule.pointsPerEligibleEvent,
        sourceId: post.id,
        sourceType: metricType,
        status: "counted",
      }),
    );

    await engagementRepository.saveArchiveItem(
      createCollaboratorArchiveItem({
        campaignId: campaign.id,
        grantingRule: `Participacao positiva registrada em ${campaign.title}.`,
        id: createArchiveItemId(metricType, campaign.id, post.authorUserId, post.id),
        metadata: {
          scoreValue: savedEvent.scoreValue,
          visibility: post.visibility,
        },
        occurredAt: awardedAt,
        relatedContentReference: `feed-post:${post.id}`,
        scope: campaign.scope,
        sourceAction: savedEvent.ruleLabel,
        sourceId: post.id,
        sourceType: metricType,
        status: "recorded",
        title: `Participacao validada em ${campaign.title}`,
        type: "challenge-completed",
        userId: post.authorUserId,
      }),
    );

    savedEvents.push(savedEvent);
  }

  return savedEvents;
}

async function revokeFeedPostCampaignEvents(
  engagementRepository: EngagementRepositoryPort,
  post: FeedPost,
): Promise<readonly EligibleEngagementEvent[]> {
  const [eligibleEvents, archiveItems] = await Promise.all([
    engagementRepository.listEligibleEvents(post.scope),
    engagementRepository.listArchiveItemsForUser(post.authorUserId, post.scope),
  ]);
  const revokedEvents = await Promise.all(
    eligibleEvents
      .filter(
        (event) =>
          event.sourceId === post.id &&
          (event.sourceType === "approved-photo-post" ||
            event.sourceType === "approved-before-after") &&
          event.status !== "revoked",
      )
      .map((event) =>
        engagementRepository.saveEligibleEvent(
          copyEligibleEvent(event, {
            status: "revoked",
          }),
        ),
      ),
  );

  await Promise.all(
    archiveItems
      .filter(
        (item) =>
          item.sourceId === post.id &&
          (item.sourceType === "approved-photo-post" ||
            item.sourceType === "approved-before-after") &&
          item.status !== "revoked",
      )
      .map((item) =>
        engagementRepository.saveArchiveItem(
          copyArchiveItem(item, {
            status: "corrected",
          }),
        ),
      ),
  );

  return revokedEvents;
}

function canCampaignCountEvent(
  campaign: EngagementCampaign,
  now: Date,
  actorUserId: DomainId<"user">,
): boolean {
  if (
    campaign.status === "draft" ||
    campaign.status === "closed" ||
    campaign.status === "archived"
  ) {
    return false;
  }

  if (
    now.getTime() < campaign.window.startsAt.getTime() ||
    now.getTime() > campaign.window.endsAt.getTime()
  ) {
    return false;
  }

  return (
    campaign.eligibility.eligibleUserIds.length === 0 ||
    campaign.eligibility.eligibleUserIds.includes(actorUserId)
  );
}

function hasCampaignCapacityForEvent(
  campaign: EngagementCampaign,
  eligibleEvents: readonly EligibleEngagementEvent[],
  actorUserId: DomainId<"user">,
  now: Date,
): boolean {
  const actorEvents = eligibleEvents.filter(
    (event) =>
      event.campaignId === campaign.id &&
      event.actorUserId === actorUserId &&
      (event.status === "counted" || event.status === "corrected"),
  );

  if (
    campaign.scoringRule.maxEventsPerUser !== undefined &&
    actorEvents.length >= campaign.scoringRule.maxEventsPerUser
  ) {
    return false;
  }

  if (campaign.eligibility.maxEventsPerDay === undefined) {
    return true;
  }

  const currentDayKey = toDateKey(now);
  const eventsToday = actorEvents.filter(
    (event) => toDateKey(event.awardedAt) === currentDayKey,
  ).length;

  return eventsToday < campaign.eligibility.maxEventsPerDay;
}

function looksLikeBeforeAfterPost(post: FeedPost): boolean {
  const searchable = `${post.title} ${post.caption}`.toLowerCase();

  return searchable.includes("antes") && searchable.includes("depois");
}

function buildRelatedReferenceForEvent(event: EligibleEngagementEvent): string {
  if (event.sourceType === "approved-photo-post" || event.sourceType === "approved-before-after") {
    return `feed-post:${event.sourceId}`;
  }

  return `event:${event.sourceId}`;
}

function calculateActiveStreakDays(items: readonly CollaboratorArchiveItem[]): number {
  const dayKeys = [...new Set(items.map((item) => toDateKey(item.occurredAt)))];

  if (dayKeys.length === 0) {
    return 0;
  }

  let streak = 1;

  for (let index = 1; index < dayKeys.length; index += 1) {
    const previousDate = new Date(`${dayKeys[index - 1]}T00:00:00.000Z`);
    const currentDate = new Date(`${dayKeys[index]}T00:00:00.000Z`);
    const expectedPreviousDay = new Date(previousDate.getTime() - 24 * 60 * 60 * 1000);

    if (toDateKey(expectedPreviousDay) !== toDateKey(currentDate)) {
      break;
    }

    streak += 1;
  }

  return streak;
}

function resolveDisplayName(
  userId: DomainId<"user">,
  teamMembers: Awaited<ReturnType<ScheduleRepositoryPort["listTeamMembers"]>>,
): string {
  return (
    teamMembers.find((member) => member.userId === userId)?.displayName ??
    `Colaborador ${userId.slice(-4)}`
  );
}

function deriveCampaignStatus(
  startsAt: Date,
  now: Date,
): Extract<EngagementCampaignStatus, "active" | "scheduled"> {
  return startsAt.getTime() <= now.getTime() ? "active" : "scheduled";
}

function copyCampaign(
  campaign: EngagementCampaign,
  patch: Partial<Pick<EngagementCampaign, "status">>,
): EngagementCampaign {
  return createEngagementCampaign({
    createdAt: campaign.createdAt,
    createdByUserId: campaign.createdByUserId,
    description: campaign.description,
    eligibility: {
      eligibleUserIds: [...campaign.eligibility.eligibleUserIds],
      ...(campaign.eligibility.maxEventsPerDay === undefined
        ? {}
        : { maxEventsPerDay: campaign.eligibility.maxEventsPerDay }),
      requiresApprovedFeedPost: campaign.eligibility.requiresApprovedFeedPost,
      requiresOperationalValidation: campaign.eligibility.requiresOperationalValidation,
    },
    endsAt: campaign.window.endsAt,
    id: campaign.id,
    objective: campaign.objective,
    periodPreset: campaign.periodPreset,
    reward: {
      ...(campaign.reward.type === "digital"
        ? {
            ...(campaign.reward.badgeCode === undefined
              ? {}
              : { badgeCode: campaign.reward.badgeCode }),
            ...(campaign.reward.highlightLabel === undefined
              ? {}
              : { highlightLabel: campaign.reward.highlightLabel }),
            ...(campaign.reward.points === undefined ? {} : { points: campaign.reward.points }),
            title: campaign.reward.title,
            type: "digital" as const,
          }
        : campaign.reward.type === "manual-company-approved"
          ? {
              approvalPolicyCode: campaign.reward.approvalPolicyCode,
              description: campaign.reward.description,
              ...(campaign.reward.fulfillmentWindowDays === undefined
                ? {}
                : {
                    fulfillmentWindowDays: campaign.reward.fulfillmentWindowDays,
                  }),
              title: campaign.reward.title,
              type: "manual-company-approved" as const,
            }
          : {
              disclaimer: campaign.reward.disclaimer,
              ...(campaign.reward.note === undefined ? {} : { note: campaign.reward.note }),
              title: campaign.reward.title,
              type: "manual-external-informal" as const,
            }),
    },
    scoringRule: {
      ...(campaign.scoringRule.maxEventsPerUser === undefined
        ? {}
        : { maxEventsPerUser: campaign.scoringRule.maxEventsPerUser }),
      metricType: campaign.scoringRule.metricType,
      pointsPerEligibleEvent: campaign.scoringRule.pointsPerEligibleEvent,
      requireUniqueSources: campaign.scoringRule.requireUniqueSources,
      tieBreakers: campaign.scoringRule.tieBreakers,
    },
    scope: campaign.scope,
    settlement: {
      mode: campaign.settlement.mode,
      winnerCount: campaign.settlement.winnerCount,
    },
    startsAt: campaign.window.startsAt,
    status: patch.status ?? campaign.status,
    title: campaign.title,
  });
}

function copyEligibleEvent(
  event: EligibleEngagementEvent,
  patch: Partial<Pick<EligibleEngagementEvent, "status">>,
): EligibleEngagementEvent {
  return createEligibleEngagementEvent({
    actorUserId: event.actorUserId,
    awardedAt: event.awardedAt,
    ...(event.campaignId === undefined ? {} : { campaignId: event.campaignId }),
    id: event.id,
    ruleLabel: event.ruleLabel,
    ruleMetadata: event.ruleMetadata,
    scope: event.scope,
    scoreValue: event.scoreValue,
    sourceId: event.sourceId,
    sourceType: event.sourceType,
    status: patch.status ?? event.status,
  });
}

function copyArchiveItem(
  item: CollaboratorArchiveItem,
  patch: Partial<
    Pick<CollaboratorArchiveItem, "responsibleApproverUserId" | "rewardStatus" | "status">
  >,
): CollaboratorArchiveItem {
  return createCollaboratorArchiveItem({
    ...(item.campaignId === undefined ? {} : { campaignId: item.campaignId }),
    grantingRule: item.grantingRule,
    id: item.id,
    metadata: item.metadata,
    occurredAt: item.occurredAt,
    ...(item.relatedContentReference === undefined
      ? {}
      : { relatedContentReference: item.relatedContentReference }),
    ...(patch.responsibleApproverUserId === undefined
      ? item.responsibleApproverUserId === undefined
        ? {}
        : { responsibleApproverUserId: item.responsibleApproverUserId }
      : { responsibleApproverUserId: patch.responsibleApproverUserId }),
    ...(item.rewardGrantId === undefined ? {} : { rewardGrantId: item.rewardGrantId }),
    ...(patch.rewardStatus === undefined
      ? item.rewardStatus === undefined
        ? {}
        : { rewardStatus: item.rewardStatus }
      : { rewardStatus: patch.rewardStatus }),
    scope: item.scope,
    sourceAction: item.sourceAction,
    sourceId: item.sourceId,
    sourceType: item.sourceType,
    status: patch.status ?? item.status,
    title: item.title,
    type: item.type,
    userId: item.userId,
  });
}

function copyRewardGrant(
  rewardGrant: RewardGrant,
  patch: Partial<
    Pick<
      RewardGrant,
      | "approvedAt"
      | "approvedByUserId"
      | "canceledAt"
      | "canceledByUserId"
      | "fulfilledAt"
      | "fulfilledByUserId"
      | "status"
    >
  >,
): RewardGrant {
  return createRewardGrant({
    ...(patch.approvedAt === undefined
      ? rewardGrant.approvedAt === undefined
        ? {}
        : { approvedAt: rewardGrant.approvedAt }
      : { approvedAt: patch.approvedAt }),
    ...(patch.approvedByUserId === undefined
      ? rewardGrant.approvedByUserId === undefined
        ? {}
        : { approvedByUserId: rewardGrant.approvedByUserId }
      : { approvedByUserId: patch.approvedByUserId }),
    campaignId: rewardGrant.campaignId,
    ...(patch.canceledAt === undefined
      ? rewardGrant.canceledAt === undefined
        ? {}
        : { canceledAt: rewardGrant.canceledAt }
      : { canceledAt: patch.canceledAt }),
    ...(patch.canceledByUserId === undefined
      ? rewardGrant.canceledByUserId === undefined
        ? {}
        : { canceledByUserId: rewardGrant.canceledByUserId }
      : { canceledByUserId: patch.canceledByUserId }),
    ...(patch.fulfilledAt === undefined
      ? rewardGrant.fulfilledAt === undefined
        ? {}
        : { fulfilledAt: rewardGrant.fulfilledAt }
      : { fulfilledAt: patch.fulfilledAt }),
    ...(patch.fulfilledByUserId === undefined
      ? rewardGrant.fulfilledByUserId === undefined
        ? {}
        : { fulfilledByUserId: rewardGrant.fulfilledByUserId }
      : { fulfilledByUserId: patch.fulfilledByUserId }),
    grantedAt: rewardGrant.grantedAt,
    id: rewardGrant.id,
    metadata: rewardGrant.metadata,
    position: rewardGrant.position,
    reward:
      rewardGrant.reward.type === "digital"
        ? {
            ...(rewardGrant.reward.badgeCode === undefined
              ? {}
              : { badgeCode: rewardGrant.reward.badgeCode }),
            ...(rewardGrant.reward.highlightLabel === undefined
              ? {}
              : { highlightLabel: rewardGrant.reward.highlightLabel }),
            ...(rewardGrant.reward.points === undefined
              ? {}
              : { points: rewardGrant.reward.points }),
            title: rewardGrant.reward.title,
            type: "digital",
          }
        : {
            approvalPolicyCode: rewardGrant.reward.approvalPolicyCode,
            description: rewardGrant.reward.description,
            ...(rewardGrant.reward.fulfillmentWindowDays === undefined
              ? {}
              : {
                  fulfillmentWindowDays: rewardGrant.reward.fulfillmentWindowDays,
                }),
            title: rewardGrant.reward.title,
            type: "manual-company-approved",
          },
    scope: rewardGrant.scope,
    status: patch.status ?? rewardGrant.status,
    userId: rewardGrant.userId,
    winningScore: rewardGrant.winningScore,
  });
}

function createCampaignId(userId: DomainId<"user">, now: Date): string {
  return `campaign_${userId}_${now.getTime()}`;
}

function createEligibleEventId(
  campaignId: DomainId<"engagement-campaign">,
  sourceId: string,
): string {
  return `eligible_${campaignId}_${sourceId.replaceAll(":", "_")}`;
}

function createRewardGrantId(
  campaignId: DomainId<"engagement-campaign">,
  userId: DomainId<"user">,
  position: number,
): string {
  return `reward_${campaignId}_${userId}_${position}`;
}

function createArchiveItemId(
  kind: string,
  campaignId: DomainId<"engagement-campaign">,
  userId: DomainId<"user">,
  sourceId: string,
): string {
  return `archive_${kind}_${campaignId}_${userId}_${sourceId.replaceAll(":", "_")}`;
}

function createCampaignPointsLedgerId(
  campaignId: DomainId<"engagement-campaign">,
  userId: DomainId<"user">,
): string {
  return `points_campaign_${campaignId}_${userId}`;
}

function createCampaignBadgeAwardId(
  campaignId: DomainId<"engagement-campaign">,
  userId: DomainId<"user">,
  badgeCode: string,
): string {
  return `badge_campaign_${campaignId}_${userId}_${badgeCode}`;
}

function createChecklistRunId(routineId: OperationRoutineId): string {
  return `run_${routineId}`;
}

function createChecklistCompletionSourceId(routineId: OperationRoutineId, itemId: string): string {
  return `${createChecklistRunId(routineId)}:${itemId}`;
}

function isValidatedBancaEvidence(routineId: OperationRoutineId, itemId: string): boolean {
  return routineId === "opening" && ["opening-display", "opening-front"].includes(itemId);
}

function toDateKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}
