import { describe, expect, it } from "vitest";

import {
  createCollaboratorArchiveItem,
  createEligibleEngagementEvent,
  createEngagementCampaign,
  createRewardGrant,
  createTenantScope,
} from "../src/index.js";

const flvScope = createTenantScope({
  departmentId: "dept_flv",
  organizationId: "org_demo",
  storeId: "store_001",
});

describe("engagement domain models", () => {
  it("creates configurable campaigns with scoped eligibility and settlement rules", () => {
    const campaign = createEngagementCampaign({
      createdAt: new Date("2026-04-23T12:00:00.000Z"),
      createdByUserId: "user_lider",
      description: "Premia as melhores fotos aprovadas da semana.",
      eligibility: {
        eligibleUserIds: ["user_a", "user_b"],
        maxEventsPerDay: 3,
        requiresApprovedFeedPost: true,
      },
      endsAt: new Date("2026-04-30T23:59:59.000Z"),
      id: "campaign_weekly_photo",
      objective: "Quem enviar mais fotos aprovadas de FLV",
      periodPreset: "weekly",
      reward: {
        badgeCode: "feed-quality-weekly",
        points: 40,
        title: "Badge + destaque semanal",
        type: "digital",
      },
      scope: flvScope,
      scoringRule: {
        maxEventsPerUser: 10,
        metricType: "approved-photo-post",
        pointsPerEligibleEvent: 10,
        tieBreakers: [
          { kind: "approved-quality", priority: 1 },
          { kind: "first-to-finish", priority: 2 },
        ],
      },
      settlement: {
        winnerCount: 3,
      },
      startsAt: new Date("2026-04-23T00:00:00.000Z"),
      status: "active",
      title: "Semana da Foto Aprovada",
    });

    expect(campaign.scoringRule.tieBreakers).toEqual([
      { kind: "approved-quality", priority: 1 },
      { kind: "first-to-finish", priority: 2 },
    ]);
    expect(campaign.eligibility.eligibleUserIds).toHaveLength(2);
    expect(campaign.reward.type).toBe("digital");
    expect(campaign.window.startsAt.toISOString()).toBe("2026-04-23T00:00:00.000Z");
  });

  it("tracks eligible events with rule metadata for auditability", () => {
    const event = createEligibleEngagementEvent({
      actorUserId: "user_colaborador",
      awardedAt: new Date("2026-04-24T14:00:00.000Z"),
      campaignId: "campaign_weekly_photo",
      id: "event_photo_approved",
      ruleLabel: "Foto aprovada pela lideranca",
      ruleMetadata: {
        moderationState: "approved",
        uniqueSource: true,
      },
      scope: flvScope,
      scoreValue: 10,
      sourceId: "post_123",
      sourceType: "approved-photo-post",
      status: "counted",
    });

    expect(event.ruleMetadata).toEqual({
      moderationState: "approved",
      uniqueSource: true,
    });
    expect(event.scoreValue).toBe(10);
  });

  it("requires reward status for reward archive items", () => {
    expect(() =>
      createCollaboratorArchiveItem({
        grantingRule: "Top 3 no fechamento semanal",
        id: "archive_reward_missing_status",
        occurredAt: new Date("2026-04-30T23:59:59.000Z"),
        scope: flvScope,
        sourceAction: "Campanha encerrada",
        sourceId: "campaign_weekly_photo",
        sourceType: "approved-photo-post",
        status: "recorded",
        title: "Premio semanal",
        type: "reward-granted",
        userId: "user_colaborador",
      }),
    ).toThrow("Reward archive items must expose a rewardStatus.");
  });

  it("enforces approval state before fulfilling manual company rewards", () => {
    expect(() =>
      createRewardGrant({
        campaignId: "campaign_weekly_photo",
        fulfilledAt: new Date("2026-05-01T18:00:00.000Z"),
        fulfilledByUserId: "user_lider",
        grantedAt: new Date("2026-04-30T23:59:59.000Z"),
        id: "reward_manual_without_approval",
        position: 1,
        reward: {
          approvalPolicyCode: "rh-timeoff",
          description: "Folga aprovada pela gerencia",
          title: "Folga oficial",
          type: "manual-company-approved",
        },
        scope: flvScope,
        status: "fulfilled",
        userId: "user_colaborador",
        winningScore: 120,
      }),
    ).toThrow("Approved manual rewards require approvedAt and approvedByUserId.");
  });

  it("creates approved manual grants once governance data exists", () => {
    const grant = createRewardGrant({
      approvedAt: new Date("2026-05-01T10:00:00.000Z"),
      approvedByUserId: "user_gerente",
      campaignId: "campaign_weekly_photo",
      grantedAt: new Date("2026-04-30T23:59:59.000Z"),
      id: "reward_manual_approved",
      metadata: {
        approvalTicket: "APV-32",
      },
      position: 1,
      reward: {
        approvalPolicyCode: "rh-timeoff",
        description: "Folga aprovada pela gerencia",
        title: "Folga oficial",
        type: "manual-company-approved",
      },
      scope: flvScope,
      status: "approved-for-fulfillment",
      userId: "user_colaborador",
      winningScore: 120,
    });

    expect(grant.reward.type).toBe("manual-company-approved");
    expect(grant.status).toBe("approved-for-fulfillment");
    expect(grant.metadata).toEqual({
      approvalTicket: "APV-32",
    });
  });
});
