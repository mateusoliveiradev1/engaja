import { describe, expect, it } from "vitest";

import {
  developmentSessionTokens,
  InMemoryAuditLogSink,
  InMemoryRateLimiter,
  type StructuredLogEvent,
} from "@engaja/security";

import { assertApiEnvironmentIsSafe, createApiApp } from "../src/index.js";

describe("API security baseline", () => {
  it("requires authentication for protected routes", async () => {
    const response = await createApiApp().request("/dashboard/summary", {
      headers: {
        "x-request-id": "req_missing_auth",
      },
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "unauthorized",
        message: "Autenticacao obrigatoria.",
      },
      requestId: "req_missing_auth",
    });
  });

  it("denies forbidden role actions without leaking resource existence", async () => {
    const auditSink = new InMemoryAuditLogSink();
    const response = await createApiApp({ auditSink }).request("/dashboard/summary", {
      headers: {
        authorization: `Bearer ${developmentSessionTokens.colaborador}`,
        "x-request-id": "req_forbidden_role",
      },
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "not_found_or_forbidden",
      },
      requestId: "req_forbidden_role",
    });
    expect(auditSink.events).toHaveLength(1);
    expect(auditSink.events[0]).toMatchObject({
      action: "security.deny",
      actorUserId: "user_demo_colaborador",
    });
  });

  it("blocks cross-department access as an IDOR-safe denial", async () => {
    const response = await createApiApp().request(
      "/operations/summary?storeId=store_001&departmentId=dept_padaria",
      {
        headers: {
          authorization: `Bearer ${developmentSessionTokens["lider-setor"]}`,
          "x-request-id": "req_cross_department",
        },
      },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "not_found_or_forbidden",
      },
      requestId: "req_cross_department",
    });
  });

  it("allows scoped archive reads for leaders inside their department", async () => {
    const response = await createApiApp().request(
      "/engagement/archive?userId=user_demo_colaborador",
      {
        headers: {
          authorization: `Bearer ${developmentSessionTokens["lider-setor"]}`,
          "x-request-id": "req_leader_archive_read",
        },
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: {
        items: expect.any(Array),
      },
      requestId: "req_leader_archive_read",
    });
  });

  it("records cross-user archive denial attempts without leaking the target", async () => {
    const auditSink = new InMemoryAuditLogSink();
    const response = await createApiApp({ auditSink }).request(
      "/engagement/archive?userId=user_demo_colaborador_2",
      {
        headers: {
          authorization: `Bearer ${developmentSessionTokens.colaborador}`,
          "x-request-id": "req_cross_user_archive_read",
        },
      },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "not_found_or_forbidden",
      },
      requestId: "req_cross_user_archive_read",
    });
    expect(auditSink.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "security.deny",
          actorUserId: "user_demo_colaborador",
          metadata: expect.objectContaining({
            deniedAction: "engagement.archive.read",
          }),
          requestId: "req_cross_user_archive_read",
          targetType: "engagement_archive",
        }),
      ]),
    );
  });

  it("denies collaborators from managing campaigns and records the security event", async () => {
    const auditSink = new InMemoryAuditLogSink();
    const response = await createApiApp({ auditSink }).request("/engagement/campaigns", {
      body: JSON.stringify({
        description: "Campanha restrita para lideranca.",
        endsAt: "2026-04-30T23:59:00.000Z",
        objective: "Premiar fotos aprovadas.",
        periodPreset: "weekly",
        reward: {
          badgeCode: "campanha-lideranca",
          points: 40,
          title: "Badge de lideranca",
          type: "digital",
        },
        scoringRule: {
          maxEventsPerUser: 5,
          metricType: "approved-photo-post",
          pointsPerEligibleEvent: 10,
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
        title: "Campanha bloqueada",
      }),
      headers: {
        authorization: `Bearer ${developmentSessionTokens.colaborador}`,
        "content-type": "application/json",
        "x-request-id": "req_collaborator_manage_campaign",
      },
      method: "POST",
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "not_found_or_forbidden",
      },
      requestId: "req_collaborator_manage_campaign",
    });
    expect(auditSink.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "security.deny",
          actorUserId: "user_demo_colaborador",
          metadata: expect.objectContaining({
            deniedAction: "engagement.manage",
          }),
          requestId: "req_collaborator_manage_campaign",
          targetType: "engagement_campaign",
        }),
      ]),
    );
  });

  it("allows leader dashboard access inside scope", async () => {
    const response = await createApiApp().request("/dashboard/summary", {
      headers: {
        authorization: `Bearer ${developmentSessionTokens["lider-setor"]}`,
        "x-request-id": "req_leader_dashboard",
      },
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: {
        openModerationCount: 4,
      },
      requestId: "req_leader_dashboard",
    });
  });

  it("audits campaign closure and reward fulfillment management actions", async () => {
    const auditSink = new InMemoryAuditLogSink();
    let currentTime = Date.parse("2026-04-23T12:00:00.000Z");
    const app = createApiApp({
      auditSink,
      now: () => {
        currentTime += 1_000;

        return new Date(currentTime);
      },
    });
    const createResponse = await app.request("/engagement/campaigns", {
      body: JSON.stringify({
        description: "Campanha auditada para fotos aprovadas.",
        endsAt: "2026-04-30T23:59:00.000Z",
        objective: "Premiar a melhor foto aprovada.",
        periodPreset: "weekly",
        reward: {
          badgeCode: "auditoria-engajamento",
          points: 50,
          title: "Badge auditado",
          type: "digital",
        },
        scoringRule: {
          maxEventsPerUser: 5,
          metricType: "approved-photo-post",
          pointsPerEligibleEvent: 10,
          requireUniqueSources: true,
          tieBreakers: [
            {
              kind: "first-to-finish",
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
        title: "Campanha auditada",
      }),
      headers: {
        authorization: `Bearer ${developmentSessionTokens["lider-setor"]}`,
        "content-type": "application/json",
        "x-request-id": "req_engagement_manage_create",
      },
      method: "POST",
    });
    const createPayload = (await createResponse.json()) as {
      readonly data: {
        readonly id: string;
      };
    };
    const closeResponse = await app.request("/engagement/campaigns/close", {
      body: JSON.stringify({
        campaignId: createPayload.data.id,
      }),
      headers: {
        authorization: `Bearer ${developmentSessionTokens["lider-setor"]}`,
        "content-type": "application/json",
        "x-request-id": "req_engagement_manage_close",
      },
      method: "POST",
    });
    const fulfillResponse = await app.request("/engagement/reward-grants/status", {
      body: JSON.stringify({
        rewardGrantId: "reward_banca_approved",
        status: "fulfilled",
      }),
      headers: {
        authorization: `Bearer ${developmentSessionTokens["gerente-loja"]}`,
        "content-type": "application/json",
        "x-request-id": "req_engagement_manage_fulfill",
      },
      method: "POST",
    });

    expect(createResponse.status).toBe(200);
    expect(closeResponse.status).toBe(200);
    expect(fulfillResponse.status).toBe(200);
    expect(auditSink.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "engagement.manage",
          actorUserId: "user_demo_lider",
          metadata: {
            route: "/engagement/campaigns",
          },
          requestId: "req_engagement_manage_create",
          targetType: "engagement_campaign",
        }),
        expect.objectContaining({
          action: "engagement.manage",
          actorUserId: "user_demo_lider",
          metadata: {
            route: "/engagement/campaigns/close",
          },
          requestId: "req_engagement_manage_close",
          targetType: "engagement_campaign",
        }),
        expect.objectContaining({
          action: "engagement.manage",
          actorUserId: "user_demo_gerente",
          metadata: {
            route: "/engagement/reward-grants/status",
          },
          requestId: "req_engagement_manage_fulfill",
          targetType: "reward_grant",
        }),
      ]),
    );
  });

  it("denies auditor upload mutation and records a security event", async () => {
    const auditSink = new InMemoryAuditLogSink();
    const response = await createApiApp({ auditSink }).request("/media/upload-intents", {
      body: JSON.stringify({
        contentLength: 1000,
        contentType: "image/webp",
        targetContext: "feed-post",
      }),
      headers: {
        authorization: `Bearer ${developmentSessionTokens.auditor}`,
        "content-type": "application/json",
        "x-request-id": "req_auditor_upload",
      },
      method: "POST",
    });

    expect(response.status).toBe(403);
    expect(auditSink.events[0]?.action).toBe("security.deny");
  });

  it("rate-limits repeated upload intent requests", async () => {
    const app = createApiApp({
      now: () => new Date("2026-04-22T12:00:00.000Z"),
      rateLimiter: new InMemoryRateLimiter(),
    });
    const init = {
      body: JSON.stringify({
        contentLength: 1000,
        contentType: "image/webp",
        targetContext: "feed-post",
      }),
      headers: {
        authorization: `Bearer ${developmentSessionTokens.colaborador}`,
        "content-type": "application/json",
      },
      method: "POST",
    };

    for (let index = 0; index < 8; index += 1) {
      expect((await app.request("/media/upload-intents", init)).status).toBe(200);
    }

    expect((await app.request("/media/upload-intents", init)).status).toBe(429);
  });

  it("returns redacted validation errors and logs request context", async () => {
    const logs: StructuredLogEvent[] = [];
    const response = await createApiApp({
      logger: (event) => {
        logs.push(event);
      },
    }).request("/media/upload-intents", {
      body: JSON.stringify({
        contentLength: 1000,
        contentType: "application/pdf",
        targetContext: "feed-post",
      }),
      headers: {
        authorization: `Bearer ${developmentSessionTokens.colaborador}`,
        "content-type": "application/json",
        "x-request-id": "req_invalid_upload",
      },
      method: "POST",
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "bad_request",
        message: "Requisicao invalida.",
      },
      requestId: "req_invalid_upload",
    });
    expect(logs[0]).toMatchObject({
      actor: {
        role: "colaborador",
        userId: "user_demo_colaborador",
      },
      requestId: "req_invalid_upload",
    });
  });

  it("prevents server-only secrets from being treated as client environment", () => {
    expect(() =>
      assertApiEnvironmentIsSafe({
        clientEnv: {
          DATABASE_URL: "postgresql://example",
        },
        serverEnv: {
          AUTH_LOCAL_SECRET: "local-secret",
        },
      }),
    ).toThrow("DATABASE_URL must not be exposed");
  });

  it("blocks metered providers unless they are explicitly enabled", () => {
    expect(() =>
      assertApiEnvironmentIsSafe({
        serverEnv: {
          AUTH_LOCAL_SECRET: "local-secret",
          STORAGE_PROVIDER: "cloudflare-r2",
        },
      }),
    ).toThrow("STORAGE_PROVIDER=cloudflare-r2 is metered or paid");
  });
});
