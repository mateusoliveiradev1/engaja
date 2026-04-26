import { describe, expect, it } from "vitest";

import {
  engagementArchiveItemPayloadSchema,
  engagementCampaignPayloadSchema,
  engagementEligibleEventPayloadSchema,
  engagementRewardGrantPayloadSchema,
} from "../src/index.js";

const scope = {
  departmentId: "dept_flv",
  organizationId: "org_demo",
  storeId: "store_001",
} as const;

describe("engagement contracts", () => {
  it("parses campaign payloads with scoring, eligibility and rewards", () => {
    expect(
      engagementCampaignPayloadSchema.parse({
        createdAt: "2026-04-23T12:00:00.000Z",
        createdByUserId: "user_lider",
        description: "Premia as melhores fotos aprovadas da semana.",
        eligibility: {
          eligibleUserIds: ["user_a", "user_b"],
          maxEventsPerDay: 3,
          requiresApprovedFeedPost: true,
          requiresOperationalValidation: false,
        },
        endsAt: "2026-04-30T23:59:59.000Z",
        id: "campaign_weekly_photo",
        objective: "Quem enviar mais fotos aprovadas",
        periodPreset: "weekly",
        reward: {
          badgeCode: "feed-quality-weekly",
          points: 40,
          title: "Badge + destaque semanal",
          type: "digital",
        },
        scope,
        scoringRule: {
          maxEventsPerUser: 10,
          metricType: "approved-photo-post",
          pointsPerEligibleEvent: 10,
          requireUniqueSources: true,
          tieBreakers: [
            { kind: "approved-quality", priority: 1 },
            { kind: "first-to-finish", priority: 2 },
          ],
        },
        settlement: {
          mode: "automatic",
          winnerCount: 3,
        },
        startsAt: "2026-04-23T00:00:00.000Z",
        status: "active",
        title: "Semana da Foto Aprovada",
      }),
    ).toMatchObject({
      id: "campaign_weekly_photo",
      status: "active",
    });
  });

  it("parses eligible event payloads with auditable metadata", () => {
    expect(
      engagementEligibleEventPayloadSchema.parse({
        actorUserId: "user_colaborador",
        awardedAt: "2026-04-24T14:00:00.000Z",
        campaignId: "campaign_weekly_photo",
        id: "event_photo_approved",
        ruleLabel: "Foto aprovada pela lideranca",
        ruleMetadata: {
          moderationState: "approved",
          uniqueSource: true,
        },
        scope,
        scoreValue: 10,
        sourceId: "post_123",
        sourceType: "approved-photo-post",
        status: "counted",
      }),
    ).toMatchObject({
      sourceType: "approved-photo-post",
      status: "counted",
    });
  });

  it("rejects reward archive items without reward status", () => {
    expect(() =>
      engagementArchiveItemPayloadSchema.parse({
        grantingRule: "Top 3 no fechamento semanal",
        id: "archive_reward_missing_status",
        metadata: {},
        occurredAt: "2026-04-30T23:59:59.000Z",
        scope,
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

  it("rejects fulfilled manual grants without approval metadata", () => {
    expect(() =>
      engagementRewardGrantPayloadSchema.parse({
        campaignId: "campaign_weekly_photo",
        fulfilledAt: "2026-05-01T18:00:00.000Z",
        fulfilledByUserId: "user_lider",
        grantedAt: "2026-04-30T23:59:59.000Z",
        id: "reward_manual_without_approval",
        metadata: {},
        position: 1,
        reward: {
          approvalPolicyCode: "rh-timeoff",
          description: "Folga aprovada pela gerencia",
          title: "Folga oficial",
          type: "manual-company-approved",
        },
        scope,
        status: "fulfilled",
        userId: "user_colaborador",
        winningScore: 120,
      }),
    ).toThrow("Approved manual rewards require approvedAt and approvedByUserId.");
  });
});
