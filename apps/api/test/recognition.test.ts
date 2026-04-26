import { describe, expect, it } from "vitest";

import type {
  RecognitionProfilePayload,
  RecognitionRankingPayload,
  RecognitionSendResultPayload,
} from "@engaja/contracts";
import { developmentSessionTokens } from "@engaja/security";

import { createApiApp } from "../src/index.js";

const scope = {
  departmentId: "dept_flv",
  organizationId: "org_demo",
  storeId: "store_001",
};

describe("recognition API flow", () => {
  it("returns collaborator profile and healthy ranking payloads", async () => {
    const app = createApiApp();
    const profileResponse = await app.request("/recognition/profile", {
      headers: {
        authorization: `Bearer ${developmentSessionTokens.colaborador}`,
        "x-request-id": "req_recognition_profile",
      },
    });
    const rankingResponse = await app.request("/recognition/ranking?limit=3", {
      headers: {
        authorization: `Bearer ${developmentSessionTokens["lider-setor"]}`,
        "x-request-id": "req_recognition_ranking",
      },
    });

    expect(profileResponse.status).toBe(200);
    const profilePayload = await readJson<ApiEnvelope<RecognitionProfilePayload>>(profileResponse);
    expect(profilePayload.requestId).toBe("req_recognition_profile");
    expect(profilePayload.data.ledger).toContainEqual(
      expect.objectContaining({
        reason: "Reconhecimento por qualidade",
        source: "recognition",
      }),
    );
    expect(profilePayload.data.rewardExplanations.length).toBeGreaterThan(0);
    expect(profilePayload.data.summary).toMatchObject({
      points: 120,
      recentRecognitionCount: 1,
    });
    expect(rankingResponse.status).toBe(200);
    const rankingPayload = await readJson<ApiEnvelope<RecognitionRankingPayload>>(rankingResponse);
    expect(rankingPayload.requestId).toBe("req_recognition_ranking");
    expect(rankingPayload.data.entries[0]).toMatchObject({
      position: 1,
    });
    expect(rankingPayload.data.entries[0]?.points).toBeGreaterThan(0);
    expect(rankingPayload.data.framing).toContain("Ranking positivo");
    expect(rankingPayload.data.totalPositivePoints).toBeGreaterThan(0);
  });

  it("lets leaders send recognition and convert approved feed posts into recognition events", async () => {
    let currentTime = Date.parse("2026-04-23T12:00:00.000Z");
    const app = createApiApp({
      now: () => {
        currentTime += 1_000;

        return new Date(currentTime);
      },
    });
    const sendResponse = await app.request("/recognition/events", {
      body: JSON.stringify({
        category: "teamwork",
        message: "Apoio no pico com reposicao limpa.",
        recipientUserId: "user_demo_colaborador_2",
        scope,
      }),
      headers: {
        authorization: `Bearer ${developmentSessionTokens["lider-setor"]}`,
        "content-type": "application/json",
        "x-request-id": "req_recognition_send",
      },
      method: "POST",
    });
    const feedPostResponse = await app.request("/recognition/feed-posts", {
      body: JSON.stringify({
        message: "Post aprovado virou destaque do setor.",
        postId: "post_demo_photo_mission",
      }),
      headers: {
        authorization: `Bearer ${developmentSessionTokens["lider-setor"]}`,
        "content-type": "application/json",
        "x-request-id": "req_recognition_feed_post",
      },
      method: "POST",
    });

    expect(sendResponse.status).toBe(200);
    const sendPayload = await readJson<ApiEnvelope<RecognitionSendResultPayload>>(sendResponse);
    expect(sendPayload).toMatchObject({
      data: {
        ledgerEntry: {
          amount: 20,
          source: "recognition",
        },
        recognition: {
          category: "teamwork",
          recipientUserId: "user_demo_colaborador_2",
        },
      },
      requestId: "req_recognition_send",
    });
    expect(feedPostResponse.status).toBe(200);
    const feedPostPayload = await readJson<ApiEnvelope<RecognitionSendResultPayload>>(feedPostResponse);
    expect(feedPostPayload).toMatchObject({
      data: {
        recognition: {
          category: "quality",
          sourceFeedPostId: "post_demo_photo_mission",
        },
      },
      requestId: "req_recognition_feed_post",
    });
  });

  it("returns 429 when recognition abuse limits are exceeded", async () => {
    let currentTime = Date.parse("2026-04-23T13:00:00.000Z");
    const app = createApiApp({
      now: () => {
        currentTime += 1_000;

        return new Date(currentTime);
      },
    });
    let response = new Response(null, { status: 200 });

    for (let index = 0; index < 11; index += 1) {
      response = await app.request("/recognition/events", {
        body: JSON.stringify({
          category: "improvement",
          message: `Reconhecimento repetido ${index}.`,
          recipientUserId: `user_demo_target_${index}`,
          scope,
        }),
        headers: {
          authorization: `Bearer ${developmentSessionTokens["lider-setor"]}`,
          "content-type": "application/json",
          "x-request-id": `req_recognition_limit_${index}`,
        },
        method: "POST",
      });
    }

    expect(response.status).toBe(429);
    const payload = await readJson<ApiErrorEnvelope>(response);
    expect(payload).toMatchObject({
      error: {
        code: "rate_limited",
      },
      requestId: "req_recognition_limit_10",
    });
  });
});

interface ApiEnvelope<TData> {
  readonly data: TData;
  readonly requestId: string;
}

interface ApiErrorEnvelope {
  readonly error: {
    readonly code: string;
    readonly message: string;
  };
  readonly requestId: string;
}

async function readJson<TPayload>(response: Response): Promise<TPayload> {
  const payload: unknown = await response.json();

  return payload as TPayload;
}
