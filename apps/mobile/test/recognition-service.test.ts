import { describe, expect, it } from "vitest";

import { createRecognitionService } from "../src/app/recognition-service.js";

const offlineFetcher: typeof fetch = async () => {
  throw new Error("offline");
};

const session = {
  displayName: "Colaborador FLV",
  role: "colaborador" as const,
  scope: {
    departmentId: "dept_flv",
    organizationId: "org_demo",
    storeId: "store_001",
  },
  userId: "user_mobile_recognition",
};

describe("recognition mobile service", () => {
  it("keeps profile and healthy ranking available through the offline mock", async () => {
    const service = createRecognitionService(session, {
      fetcher: offlineFetcher,
      offlineFallback: true,
    });

    const profile = await service.getProfile();
    const ranking = await service.getRanking({
      limit: 1,
    });

    expect(profile.summary.points).toBeGreaterThan(0);
    expect(profile.badges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "consistencia-flv",
        }),
      ]),
    );
    expect(ranking.entries).toHaveLength(1);
    expect(ranking.entries[0]).toMatchObject({
      position: 1,
    });
    expect(ranking.framing).toContain("Ranking positivo");
  });

  it("sends recognition offline and applies the mock abuse limit", async () => {
    const service = createRecognitionService(session, {
      fetcher: offlineFetcher,
      offlineFallback: true,
    });
    const recipientUserId = "user_mobile_recognition_limit_target";

    const result = await service.sendRecognition({
      category: "teamwork",
      message: "Apoio consistente no pico.",
      recipientUserId,
    });

    expect(result).toMatchObject({
      ledgerEntry: {
        amount: 20,
        source: "recognition",
      },
      recognition: {
        category: "teamwork",
        recipientUserId,
      },
    });

    await service.sendRecognition({
      category: "teamwork",
      message: "Segundo reconhecimento permitido.",
      recipientUserId,
    });
    await expect(
      service.sendRecognition({
        category: "teamwork",
        message: "Terceiro reconhecimento bloqueado.",
        recipientUserId,
      }),
    ).rejects.toMatchObject({
      status: 429,
    });
  });

  it("creates feed-linked recognition in the offline path", async () => {
    const service = createRecognitionService(session, {
      fetcher: offlineFetcher,
      offlineFallback: true,
    });

    const result = await service.recognizeFeedPost({
      message: "Post aprovado virou destaque.",
      postId: "post_mobile_approved",
    });

    expect(result).toMatchObject({
      ledgerEntry: {
        amount: 120,
        source: "feed_post",
        sourceId: "post_mobile_approved",
      },
      recognition: {
        category: "quality",
        sourceFeedPostId: "post_mobile_approved",
      },
    });
  });
});
