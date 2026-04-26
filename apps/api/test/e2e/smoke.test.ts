import { Buffer } from "node:buffer";

import { describe, expect, it } from "vitest";

import { createTypedApiClient } from "@engaja/data";
import { developmentSessionTokens } from "@engaja/security";

import { createApiApp } from "../../src/index.js";

const transparentPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO1ePp4AAAAASUVORK5CYII=",
  "base64",
);

describe("release smoke flow", () => {
  it("covers login, feed photo post, moderation, schedule publish, checklist completion and recognition", async () => {
    const app = createApiApp({
      now: () => new Date("2026-04-23T12:00:00.000Z"),
    });

    const collaboratorClient = createTypedApiClient({
      accessTokenProvider: () => developmentSessionTokens.colaborador,
      baseUrl: "http://engaja.local",
      fetcher: createAppFetcher(app),
    });
    const leaderClient = createTypedApiClient({
      accessTokenProvider: () => developmentSessionTokens["lider-setor"],
      baseUrl: "http://engaja.local",
      fetcher: createAppFetcher(app),
    });

    const sessionEnvelope = await collaboratorClient.request("auth.session");
    expect(sessionEnvelope.data).toMatchObject({
      id: "user_demo_colaborador",
      role: "colaborador",
    });

    const uploadIntentEnvelope = await collaboratorClient.request("media.uploadIntent", {
      body: {
        contentLength: transparentPng.byteLength,
        contentType: "image/png",
        targetContext: "feed-post",
      },
    });

    const uploadResponse = await app.request(
      new URL(uploadIntentEnvelope.data.uploadUrl).pathname,
      {
        body: transparentPng,
        headers: {
          authorization: `Bearer ${developmentSessionTokens.colaborador}`,
          "content-type": "image/png",
          "x-request-id": "req_smoke_upload_content",
        },
        method: "PUT",
      },
    );
    expect(uploadResponse.status).toBe(204);

    const finalizedMediaEnvelope = await collaboratorClient.request("media.finalize", {
      body: {
        intentId: uploadIntentEnvelope.data.intentId,
      },
    });

    const createdPostEnvelope = await collaboratorClient.request("feed.create", {
      body: {
        authorName: "Julia Lima",
        caption: "Banca pronta para o pico com leitura premium e evidencia visual.",
        category: "mission",
        missionLink: {
          missionId: "mission_smoke_flow",
          missionTitle: "Missao smoke flow",
          recognitionCategory: "quality",
          rewardPoints: 100,
        },
        photoUrl: finalizedMediaEnvelope.data.readUrl,
        scope: {
          departmentId: "dept_flv",
          organizationId: "org_demo",
          storeId: "store_001",
        },
        title: "Smoke flow aprovado",
        visibility: "department",
      },
    });
    expect(createdPostEnvelope.data).toMatchObject({
      pendingSync: false,
      status: "pending_moderation",
      title: "Smoke flow aprovado",
    });

    const moderatedPostEnvelope = await leaderClient.request("feed.moderation.action", {
      body: {
        action: "approve",
        postId: createdPostEnvelope.data.id,
      },
    });
    expect(moderatedPostEnvelope.data).toMatchObject({
      missionLink: {
        recognitionEligible: true,
        rewardEligible: true,
      },
      status: "published",
    });

    const publishedScheduleEnvelope = await leaderClient.request("schedules.publish", {
      body: {
        scope: {
          departmentId: "dept_flv",
          organizationId: "org_demo",
          storeId: "store_001",
        },
        shiftIds: ["shift_friday_collaborator", "shift_friday_carla"],
      },
    });
    expect(publishedScheduleEnvelope.data).toMatchObject({
      notificationCount: 2,
      publishedCount: 2,
    });

    const completedChecklistEnvelope = await collaboratorClient.request("operations.checklist.complete", {
      body: {
        evidencePhotoUrl: "https://images.engaja.local/operations/smoke-checklist.jpg",
        itemId: "replenishment-gaps",
        note: "Checklist fechado no smoke flow.",
        routineId: "replenishment",
        scope: {
          departmentId: "dept_flv",
          organizationId: "org_demo",
          storeId: "store_001",
        },
        shiftId: "shift_today_collaborator",
      },
    });
    expect(completedChecklistEnvelope.data).toMatchObject({
      routines: expect.arrayContaining([
        expect.objectContaining({
          id: "replenishment",
          items: expect.arrayContaining([
            expect.objectContaining({
              id: "replenishment-gaps",
              status: "completed",
            }),
          ]),
        }),
      ]),
      shiftSummary: expect.objectContaining({
        title: "Resumo do turno FLV",
      }),
    });

    const recognitionEnvelope = await leaderClient.request("recognition.feedPost", {
      body: {
        message: "Post aprovado no smoke flow virou destaque positivo.",
        postId: createdPostEnvelope.data.id,
      },
    });
    expect(recognitionEnvelope.data).toMatchObject({
      ledgerEntry: {
        amount: 100,
        source: "feed_post",
        sourceId: createdPostEnvelope.data.id,
      },
      recognition: {
        category: "quality",
        sourceFeedPostId: createdPostEnvelope.data.id,
      },
    });
  });
});

function createAppFetcher(app: ReturnType<typeof createApiApp>): typeof fetch {
  return async (input, init) => {
    const url =
      typeof input === "string"
        ? new URL(input)
        : input instanceof URL
          ? input
          : new URL(input.url);

    return app.request(`${url.pathname}${url.search}`, init);
  };
}
