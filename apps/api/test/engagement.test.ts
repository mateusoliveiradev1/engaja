import { describe, expect, it } from "vitest";

import { developmentSessionTokens } from "@engaja/security";

import { createApiApp } from "../src/index.js";

describe("engagement API flows", () => {
  it("lists seeded campaigns and returns the collaborator archive with governed rewards", async () => {
    const app = createApiApp();
    const campaignsResponse = await app.request("/engagement/campaigns", {
      headers: {
        authorization: `Bearer ${developmentSessionTokens.colaborador}`,
        "x-request-id": "req_engagement_campaigns",
      },
    });
    const archiveResponse = await app.request("/engagement/archive", {
      headers: {
        authorization: `Bearer ${developmentSessionTokens.colaborador}`,
        "x-request-id": "req_engagement_archive",
      },
    });

    expect(campaignsResponse.status).toBe(200);
    await expect(campaignsResponse.json()).resolves.toMatchObject({
      data: expect.arrayContaining([
        expect.objectContaining({
          campaign: expect.objectContaining({
            id: "campaign_weekly_photo",
            status: "active",
          }),
          viewerProgress: expect.objectContaining({
            score: 10,
          }),
        }),
        expect.objectContaining({
          campaign: expect.objectContaining({
            id: "campaign_banca_nota_10",
            status: "closed",
          }),
        }),
      ]),
      requestId: "req_engagement_campaigns",
    });

    expect(archiveResponse.status).toBe(200);
    await expect(archiveResponse.json()).resolves.toMatchObject({
      data: {
        items: expect.arrayContaining([
          expect.objectContaining({
            title: "Vencedora da campanha Banca Nota 10",
            type: "challenge-won",
          }),
          expect.objectContaining({
            rewardStatus: "approved-for-fulfillment",
            type: "manual-prize",
          }),
        ]),
        rewardGrants: [
          expect.objectContaining({
            id: "reward_banca_approved",
            status: "approved-for-fulfillment",
          }),
        ],
        summary: expect.objectContaining({
          challengeWinCount: 1,
          pendingRewardCount: 1,
          validatedBancaContributionCount: 0,
        }),
      },
      requestId: "req_engagement_archive",
    });
  });

  it("creates a campaign, ingests approved feed evidence, closes the campaign, and updates reward fulfillment", async () => {
    let currentTime = Date.parse("2026-04-23T12:00:00.000Z");
    const app = createApiApp({
      now: () => {
        currentTime += 1_000;

        return new Date(currentTime);
      },
    });
    const createCampaignResponse = await app.request("/engagement/campaigns", {
      body: JSON.stringify({
        description: "Campanha relampago para fotos aprovadas.",
        eligibility: {
          eligibleUserIds: ["user_demo_colaborador"],
          maxEventsPerDay: 1,
          requiresApprovedFeedPost: true,
          requiresOperationalValidation: false,
        },
        endsAt: "2026-04-30T23:59:00.000Z",
        objective: "Destacar a melhor foto aprovada do periodo.",
        periodPreset: "weekly",
        reward: {
          badgeCode: "campeao-relampago",
          points: 60,
          title: "Badge Relampago",
          type: "digital",
        },
        scoringRule: {
          maxEventsPerUser: 5,
          metricType: "approved-photo-post",
          pointsPerEligibleEvent: 12,
          requireUniqueSources: true,
          tieBreakers: [
            {
              kind: "approved-quality",
              priority: 1,
            },
          ],
        },
        scope: {
          departmentId: "dept_flv",
          organizationId: "org_demo",
          storeId: "store_001",
        },
        settlement: {
          mode: "automatic",
          winnerCount: 1,
        },
        startsAt: "2026-04-23T00:00:00.000Z",
        title: "Sprint da Foto Aprovada",
      }),
      headers: {
        authorization: `Bearer ${developmentSessionTokens["lider-setor"]}`,
        "content-type": "application/json",
        "x-request-id": "req_engagement_create",
      },
      method: "POST",
    });
    const createdCampaignPayload = (await createCampaignResponse.json()) as {
      readonly data: {
        readonly id: string;
      };
    };
    const createPostResponse = await app.request("/feed/posts", {
      body: JSON.stringify({
        authorName: "Julia Lima",
        caption: "Foto nova para a sprint.",
        category: "mission",
        missionLink: {
          missionId: "mission_sprint",
          missionTitle: "Sprint visual",
          recognitionCategory: "quality",
          rewardPoints: 90,
        },
        scope: {
          departmentId: "dept_flv",
          organizationId: "org_demo",
          storeId: "store_001",
        },
        title: "Foto sprint",
        visibility: "department",
      }),
      headers: {
        authorization: `Bearer ${developmentSessionTokens.colaborador}`,
        "content-type": "application/json",
        "x-request-id": "req_engagement_feed_create",
      },
      method: "POST",
    });
    const createdPostPayload = (await createPostResponse.json()) as {
      readonly data: {
        readonly id: string;
      };
    };
    const approveResponse = await app.request("/feed/moderation", {
      body: JSON.stringify({
        action: "approve",
        postId: createdPostPayload.data.id,
      }),
      headers: {
        authorization: `Bearer ${developmentSessionTokens["lider-setor"]}`,
        "content-type": "application/json",
        "x-request-id": "req_engagement_feed_approve",
      },
      method: "POST",
    });
    const campaignsResponse = await app.request("/engagement/campaigns", {
      headers: {
        authorization: `Bearer ${developmentSessionTokens.colaborador}`,
        "x-request-id": "req_engagement_campaigns_after_approve",
      },
    });
    const closeResponse = await app.request("/engagement/campaigns/close", {
      body: JSON.stringify({
        campaignId: createdCampaignPayload.data.id,
      }),
      headers: {
        authorization: `Bearer ${developmentSessionTokens["lider-setor"]}`,
        "content-type": "application/json",
        "x-request-id": "req_engagement_close",
      },
      method: "POST",
    });
    const archiveResponse = await app.request("/engagement/archive", {
      headers: {
        authorization: `Bearer ${developmentSessionTokens.colaborador}`,
        "x-request-id": "req_engagement_archive_after_close",
      },
    });
    const fulfillResponse = await app.request("/engagement/reward-grants/status", {
      body: JSON.stringify({
        rewardGrantId: "reward_banca_approved",
        status: "fulfilled",
      }),
      headers: {
        authorization: `Bearer ${developmentSessionTokens["gerente-loja"]}`,
        "content-type": "application/json",
        "x-request-id": "req_engagement_fulfill",
      },
      method: "POST",
    });
    const fulfilledArchiveResponse = await app.request("/engagement/archive", {
      headers: {
        authorization: `Bearer ${developmentSessionTokens.colaborador}`,
        "x-request-id": "req_engagement_archive_fulfilled",
      },
    });

    expect(approveResponse.status).toBe(200);
    expect(campaignsResponse.status).toBe(200);
    await expect(campaignsResponse.json()).resolves.toMatchObject({
      data: expect.arrayContaining([
        expect.objectContaining({
          campaign: expect.objectContaining({
            id: createdCampaignPayload.data.id,
            title: "Sprint da Foto Aprovada",
          }),
          viewerProgress: expect.objectContaining({
            score: 12,
          }),
        }),
      ]),
      requestId: "req_engagement_campaigns_after_approve",
    });

    expect(closeResponse.status).toBe(200);
    await expect(closeResponse.json()).resolves.toMatchObject({
      data: {
        archiveItems: expect.arrayContaining([
          expect.objectContaining({
            title: "Vencedor(a) da campanha Sprint da Foto Aprovada",
            type: "challenge-won",
          }),
          expect.objectContaining({
            rewardStatus: "digital-granted",
            type: "reward-granted",
          }),
        ]),
        campaign: expect.objectContaining({
          id: createdCampaignPayload.data.id,
          status: "closed",
        }),
        rewardGrants: [
          expect.objectContaining({
            status: "digital-granted",
          }),
        ],
      },
      requestId: "req_engagement_close",
    });

    expect(archiveResponse.status).toBe(200);
    await expect(archiveResponse.json()).resolves.toMatchObject({
      data: {
        items: expect.arrayContaining([
          expect.objectContaining({
            title: "Badge Relampago",
            type: "reward-granted",
          }),
        ]),
      },
      requestId: "req_engagement_archive_after_close",
    });

    expect(fulfillResponse.status).toBe(200);
    await expect(fulfillResponse.json()).resolves.toMatchObject({
      data: {
        id: "reward_banca_approved",
        status: "fulfilled",
      },
      requestId: "req_engagement_fulfill",
    });
    await expect(fulfilledArchiveResponse.json()).resolves.toMatchObject({
      data: {
        items: expect.arrayContaining([
          expect.objectContaining({
            rewardStatus: "fulfilled",
            title: "Folga aprovada para retirada",
          }),
        ]),
        rewardGrants: expect.arrayContaining([
          expect.objectContaining({
            id: "reward_banca_approved",
            status: "fulfilled",
          }),
        ]),
      },
      requestId: "req_engagement_archive_fulfilled",
    });
  });

  it("blocks collaborator archive access outside own scope", async () => {
    const response = await createApiApp().request(
      "/engagement/archive?userId=user_demo_colaborador_2",
      {
        headers: {
          authorization: `Bearer ${developmentSessionTokens.colaborador}`,
          "x-request-id": "req_engagement_cross_user",
        },
      },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "not_found_or_forbidden",
      },
      requestId: "req_engagement_cross_user",
    });
  });
});
