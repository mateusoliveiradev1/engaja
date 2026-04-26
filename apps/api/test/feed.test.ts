import { Buffer } from "node:buffer";

import { describe, expect, it } from "vitest";

import { developmentSessionTokens } from "@engaja/security";

import { createApiApp } from "../src/index.js";

const transparentPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO1ePp4AAAAASUVORK5CYII=",
  "base64",
);

describe("feed engagement flow", () => {
  it("returns a hydrated feed home bundle for the engagement surface", async () => {
    const response = await createApiApp().request("/feed/home", {
      headers: {
        authorization: `Bearer ${developmentSessionTokens.colaborador}`,
        "x-request-id": "req_feed_home",
      },
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: {
        announcements: [
          {
            acknowledged: false,
            title: "Reforco antes do pico da tarde",
          },
        ],
        feedbackInboxCount: 1,
        polls: [
          {
            title: "Votacao rapida do setor",
            totalVotes: 1,
          },
        ],
        posts: expect.arrayContaining([
          expect.objectContaining({
            id: "post_demo_photo_mission",
            missionLink: expect.objectContaining({
              recognitionEligible: true,
              rewardEligible: true,
              rewardPoints: 120,
            }),
          }),
          expect.objectContaining({
            id: "post_pending_4",
            status: "pending_moderation",
          }),
        ]),
      },
      requestId: "req_feed_home",
    });
  });

  it("creates a photo post after media finalization and keeps it pending moderation", async () => {
    const app = createApiApp();
    const mediaObject = await finalizeFeedImage(app, developmentSessionTokens.colaborador, "req_feed_media");
    const response = await app.request("/feed/posts", {
      body: JSON.stringify({
        authorName: "Julia Lima",
        caption: "Banca pronta para a abertura premium.",
        category: "mission",
        missionLink: {
          missionId: "mission_opening",
          missionTitle: "Missao abertura impecavel",
          recognitionCategory: "quality",
          rewardPoints: 100,
        },
        photoUrl: mediaObject.readUrl,
        scope: {
          departmentId: "dept_flv",
          organizationId: "org_demo",
          storeId: "store_001",
        },
        title: "Abertura validada",
        visibility: "department",
      }),
      headers: {
        authorization: `Bearer ${developmentSessionTokens.colaborador}`,
        "content-type": "application/json",
        "x-request-id": "req_feed_create",
      },
      method: "POST",
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: {
        missionLink: {
          rewardEligible: false,
        },
        pendingSync: false,
        photoUrl: mediaObject.readUrl,
        status: "pending_moderation",
        title: "Abertura validada",
      },
      requestId: "req_feed_create",
    });
  });

  it("replaces reactions with one-user policy and stores collaborator comments as pending", async () => {
    const app = createApiApp();
    const reactionResponse = await app.request("/feed/reactions", {
      body: JSON.stringify({
        postId: "post_demo_photo_mission",
        type: "aplauso",
      }),
      headers: {
        authorization: `Bearer ${developmentSessionTokens.colaborador}`,
        "content-type": "application/json",
        "x-request-id": "req_feed_reaction",
      },
      method: "POST",
    });
    const commentResponse = await app.request("/feed/comments", {
      body: JSON.stringify({
        authorName: "Julia Lima",
        body: "Consegui manter esse padrao no segundo pico.",
        postId: "post_demo_photo_mission",
      }),
      headers: {
        authorization: `Bearer ${developmentSessionTokens.colaborador}`,
        "content-type": "application/json",
        "x-request-id": "req_feed_comment",
      },
      method: "POST",
    });

    expect(reactionResponse.status).toBe(200);
    const reactionPayload = (await reactionResponse.json()) as {
      data: {
        reactions: Array<{
          count: number;
          selected: boolean;
          type: string;
        }>;
      };
      requestId: string;
    };
    expect(reactionPayload.requestId).toBe("req_feed_reaction");
    expect(reactionPayload.data.reactions.find((reaction) => reaction.type === "like")).toMatchObject({
      count: 0,
      selected: false,
    });
    expect(reactionPayload.data.reactions.find((reaction) => reaction.type === "aplauso")).toMatchObject({
      count: 2,
      selected: true,
    });
    expect(commentResponse.status).toBe(200);
    const commentPayload = (await commentResponse.json()) as {
      data: {
        comments: Array<{
          body: string;
          status: string;
        }>;
      };
      requestId: string;
    };
    expect(commentPayload.requestId).toBe("req_feed_comment");
    expect(commentPayload.data.comments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          body: "Boa leitura de cores e volume.",
          status: "visible",
        }),
        expect.objectContaining({
          body: "Consegui manter esse padrao no segundo pico.",
          status: "pending",
        }),
      ]),
    );
  });

  it("lets leaders approve mission-linked posts and expose reward opportunities", async () => {
    const app = createApiApp();
    const mediaObject = await finalizeFeedImage(app, developmentSessionTokens.colaborador, "req_feed_reward_media");
    const createResponse = await app.request("/feed/posts", {
      body: JSON.stringify({
        authorName: "Julia Lima",
        caption: "Frente de folhas revisada para a missao da manha.",
        category: "mission",
        missionLink: {
          missionId: "mission_reward",
          missionTitle: "Missao frente premium",
          recognitionCategory: "quality",
          rewardPoints: 90,
        },
        photoUrl: mediaObject.readUrl,
        scope: {
          departmentId: "dept_flv",
          organizationId: "org_demo",
          storeId: "store_001",
        },
        title: "Frente revisada",
        visibility: "department",
      }),
      headers: {
        authorization: `Bearer ${developmentSessionTokens.colaborador}`,
        "content-type": "application/json",
        "x-request-id": "req_feed_reward_create",
      },
      method: "POST",
    });
    const createdPayload = (await createResponse.json()) as {
      data: {
        id: string;
      };
    };
    const moderationResponse = await app.request("/feed/moderation", {
      body: JSON.stringify({
        action: "approve",
        postId: createdPayload.data.id,
      }),
      headers: {
        authorization: `Bearer ${developmentSessionTokens["lider-setor"]}`,
        "content-type": "application/json",
        "x-request-id": "req_feed_moderation",
      },
      method: "POST",
    });

    expect(moderationResponse.status).toBe(200);
    await expect(moderationResponse.json()).resolves.toMatchObject({
      data: {
        missionLink: {
          recognitionEligible: true,
          rewardEligible: true,
          rewardPoints: 90,
        },
        status: "published",
      },
      requestId: "req_feed_moderation",
    });
  });

  it("records announcement reads, poll votes and private feedback submissions", async () => {
    const app = createApiApp();
    const announcementResponse = await app.request("/feed/announcements/read", {
      body: JSON.stringify({
        announcementId: "announcement_shift_push",
      }),
      headers: {
        authorization: `Bearer ${developmentSessionTokens.colaborador}`,
        "content-type": "application/json",
        "x-request-id": "req_feed_announcement",
      },
      method: "POST",
    });
    const pollResponse = await app.request("/feed/polls/votes", {
      body: JSON.stringify({
        optionId: "poll_option_b",
        pollId: "poll_layout_priority",
      }),
      headers: {
        authorization: `Bearer ${developmentSessionTokens.colaborador}`,
        "content-type": "application/json",
        "x-request-id": "req_feed_poll",
      },
      method: "POST",
    });
    const feedbackResponse = await app.request("/feed/feedback", {
      body: JSON.stringify({
        category: "idea",
        message: "Podemos destacar folhas premium na ponta central.",
        scope: {
          departmentId: "dept_flv",
          organizationId: "org_demo",
          storeId: "store_001",
        },
      }),
      headers: {
        authorization: `Bearer ${developmentSessionTokens.colaborador}`,
        "content-type": "application/json",
        "x-request-id": "req_feed_feedback",
      },
      method: "POST",
    });

    expect(announcementResponse.status).toBe(200);
    await expect(announcementResponse.json()).resolves.toMatchObject({
      data: {
        acknowledged: true,
        id: "announcement_shift_push",
      },
      requestId: "req_feed_announcement",
    });
    expect(pollResponse.status).toBe(200);
    await expect(pollResponse.json()).resolves.toMatchObject({
      data: {
        totalVotes: 2,
        viewerVoteOptionId: "poll_option_b",
      },
      requestId: "req_feed_poll",
    });
    expect(feedbackResponse.status).toBe(200);
    await expect(feedbackResponse.json()).resolves.toMatchObject({
      data: {
        category: "idea",
        status: "new",
      },
      requestId: "req_feed_feedback",
    });
  });
});

async function finalizeFeedImage(
  app: ReturnType<typeof createApiApp>,
  token: string,
  requestIdPrefix: string,
): Promise<{
  id: string;
  readUrl: string;
}> {
  const intentResponse = await app.request("/media/upload-intents", {
    body: JSON.stringify({
      contentLength: transparentPng.byteLength,
      contentType: "image/png",
      targetContext: "feed-post",
    }),
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "x-request-id": `${requestIdPrefix}_intent`,
    },
    method: "POST",
  });
  const intentPayload = (await intentResponse.json()) as {
    data: {
      intentId: string;
    };
  };

  expect(intentResponse.status).toBe(200);

  const uploadResponse = await app.request(
    `/media/upload-intents/${intentPayload.data.intentId}/content`,
    {
      body: transparentPng,
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "image/png",
        "x-request-id": `${requestIdPrefix}_upload`,
      },
      method: "PUT",
    },
  );

  expect(uploadResponse.status).toBe(204);

  const finalizeResponse = await app.request("/media/finalizations", {
    body: JSON.stringify({
      intentId: intentPayload.data.intentId,
    }),
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "x-request-id": `${requestIdPrefix}_finalize`,
    },
    method: "POST",
  });
  const finalizePayload = (await finalizeResponse.json()) as {
    data: {
      id: string;
      readUrl: string;
    };
  };

  expect(finalizeResponse.status).toBe(200);

  return finalizePayload.data;
}
