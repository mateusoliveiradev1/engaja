import {
  engagementArchiveItemPayloadSchema,
  engagementArchivePayloadSchema,
  engagementArchiveSummaryPayloadSchema,
  engagementCampaignClosurePayloadSchema,
  engagementCampaignPayloadSchema,
  engagementCampaignViewPayloadSchema,
  engagementRewardGrantPayloadSchema,
  type EngagementArchiveItemPayload,
  type EngagementArchivePayload,
  type EngagementArchiveSummaryPayload,
  type EngagementCampaignClosurePayload,
  type EngagementCampaignPayload,
  type EngagementCampaignViewPayload,
  type EngagementRewardGrantPayload,
} from "@engaja/contracts";
import type {
  CollaboratorArchiveItem,
  EngagementCampaign,
  RewardGrant,
} from "@engaja/domain";

import type {
  CollaboratorAchievementArchiveResult,
  CollaboratorAchievementArchiveSummaryResult,
  EngagementCampaignClosureResult,
  EngagementCampaignViewResult,
} from "./engagement.js";

export function toEngagementCampaignPayload(
  campaign: EngagementCampaign,
): EngagementCampaignPayload {
  return engagementCampaignPayloadSchema.parse({
    createdAt: campaign.createdAt.toISOString(),
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
    scope: campaign.scope,
    scoringRule: {
      ...(campaign.scoringRule.maxEventsPerUser === undefined
        ? {}
        : { maxEventsPerUser: campaign.scoringRule.maxEventsPerUser }),
      metricType: campaign.scoringRule.metricType,
      pointsPerEligibleEvent: campaign.scoringRule.pointsPerEligibleEvent,
      requireUniqueSources: campaign.scoringRule.requireUniqueSources,
      tieBreakers: [...campaign.scoringRule.tieBreakers],
    },
    settlement: {
      mode: campaign.settlement.mode,
      winnerCount: campaign.settlement.winnerCount,
    },
    startsAt: campaign.window.startsAt.toISOString(),
    status: campaign.status,
    title: campaign.title,
    endsAt: campaign.window.endsAt.toISOString(),
  });
}

export function toEngagementArchiveItemPayload(
  item: CollaboratorArchiveItem,
): EngagementArchiveItemPayload {
  return engagementArchiveItemPayloadSchema.parse({
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
    scope: item.scope,
    sourceAction: item.sourceAction,
    sourceId: item.sourceId,
    sourceType: item.sourceType,
    status: item.status,
    title: item.title,
    type: item.type,
    userId: item.userId,
  });
}

export function toEngagementRewardGrantPayload(
  grant: RewardGrant,
): EngagementRewardGrantPayload {
  return engagementRewardGrantPayloadSchema.parse({
    ...(grant.approvedAt === undefined ? {} : { approvedAt: grant.approvedAt.toISOString() }),
    ...(grant.approvedByUserId === undefined
      ? {}
      : { approvedByUserId: grant.approvedByUserId }),
    campaignId: grant.campaignId,
    ...(grant.canceledAt === undefined ? {} : { canceledAt: grant.canceledAt.toISOString() }),
    ...(grant.canceledByUserId === undefined
      ? {}
      : { canceledByUserId: grant.canceledByUserId }),
    ...(grant.fulfilledAt === undefined ? {} : { fulfilledAt: grant.fulfilledAt.toISOString() }),
    ...(grant.fulfilledByUserId === undefined
      ? {}
      : { fulfilledByUserId: grant.fulfilledByUserId }),
    grantedAt: grant.grantedAt.toISOString(),
    id: grant.id,
    metadata: grant.metadata,
    position: grant.position,
    reward:
      grant.reward.type === "digital"
        ? {
            ...(grant.reward.badgeCode === undefined ? {} : { badgeCode: grant.reward.badgeCode }),
            ...(grant.reward.highlightLabel === undefined
              ? {}
              : { highlightLabel: grant.reward.highlightLabel }),
            ...(grant.reward.points === undefined ? {} : { points: grant.reward.points }),
            title: grant.reward.title,
            type: "digital",
          }
        : {
            approvalPolicyCode: grant.reward.approvalPolicyCode,
            description: grant.reward.description,
            ...(grant.reward.fulfillmentWindowDays === undefined
              ? {}
              : { fulfillmentWindowDays: grant.reward.fulfillmentWindowDays }),
            title: grant.reward.title,
            type: "manual-company-approved",
          },
    scope: grant.scope,
    status: grant.status,
    userId: grant.userId,
    winningScore: grant.winningScore,
  });
}

export function toEngagementCampaignViewPayload(
  view: EngagementCampaignViewResult,
): EngagementCampaignViewPayload {
  return engagementCampaignViewPayloadSchema.parse({
    campaign: toEngagementCampaignPayload(view.campaign),
    leaderboard: view.leaderboard.map((entry) => ({
      displayName: entry.displayName,
      position: entry.position,
      score: entry.score,
      userId: entry.userId,
    })),
    participantCount: view.participantCount,
    ...(view.viewerProgress === undefined
      ? {}
      : {
          viewerProgress: {
            eligibleEventCount: view.viewerProgress.eligibleEventCount,
            ...(view.viewerProgress.lastAwardedAt === undefined
              ? {}
              : { lastAwardedAt: view.viewerProgress.lastAwardedAt.toISOString() }),
            ...(view.viewerProgress.position === undefined
              ? {}
              : { position: view.viewerProgress.position }),
            score: view.viewerProgress.score,
            userId: view.viewerProgress.userId,
          },
        }),
  });
}

export function toEngagementCampaignClosurePayload(
  result: EngagementCampaignClosureResult,
): EngagementCampaignClosurePayload {
  return engagementCampaignClosurePayloadSchema.parse({
    archiveItems: result.archiveItems.map(toEngagementArchiveItemPayload),
    campaign: toEngagementCampaignPayload(result.campaign),
    rewardGrants: result.rewardGrants.map(toEngagementRewardGrantPayload),
  });
}

export function toEngagementArchiveSummaryPayload(
  summary: CollaboratorAchievementArchiveSummaryResult,
): EngagementArchiveSummaryPayload {
  return engagementArchiveSummaryPayloadSchema.parse({
    activeCampaignCount: summary.activeCampaignCount,
    activeStreakDays: summary.activeStreakDays,
    approvedPhotoParticipationCount: summary.approvedPhotoParticipationCount,
    challengeWinCount: summary.challengeWinCount,
    ...(summary.latestActivityAt === undefined
      ? {}
      : { latestActivityAt: summary.latestActivityAt.toISOString() }),
    pendingRewardCount: summary.pendingRewardCount,
    rewardCount: summary.rewardCount,
    validatedBancaContributionCount: summary.validatedBancaContributionCount,
  });
}

export function toEngagementArchivePayload(
  result: CollaboratorAchievementArchiveResult,
): EngagementArchivePayload {
  return engagementArchivePayloadSchema.parse({
    activeCampaigns: result.activeCampaigns.map(toEngagementCampaignViewPayload),
    items: result.items.map(toEngagementArchiveItemPayload),
    rewardGrants: result.rewardGrants.map(toEngagementRewardGrantPayload),
    summary: toEngagementArchiveSummaryPayload(result.summary),
  });
}
