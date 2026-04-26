import { describe, expect, it } from "vitest";

import { developmentSessionTokens } from "@engaja/security";

import { createApiApp } from "../src/index.js";

describe("leader dashboard route", () => {
  it("returns the command center with filters, queues and privacy-aware team insight", async () => {
    const response = await createApiApp({
      now: () => new Date("2026-04-23T12:00:00.000Z"),
    }).request("/dashboard/summary?contentType=photo_mission&teamMemberId=user_demo_colaborador", {
      headers: {
        authorization: `Bearer ${developmentSessionTokens["lider-setor"]}`,
        "x-request-id": "req_dashboard_summary",
      },
    });

    expect(response.status).toBe(200);

    const payload = (await response.json()) as {
      data: {
        contentItems: Array<{ readonly type: string }>;
        memberInsights: Array<Record<string, unknown>>;
      };
      requestId: string;
    };

    expect(payload).toMatchObject({
      data: {
        attentionAreas: expect.arrayContaining([
          expect.objectContaining({
            kind: "moderation_queue",
          }),
        ]),
        checklistMonitor: expect.objectContaining({
          completionRate: expect.any(Number),
          routines: expect.any(Array),
        }),
        filters: {
          selected: expect.objectContaining({
            contentType: "photo_mission",
            teamMemberId: "user_demo_colaborador",
          }),
        },
        memberInsights: [
          expect.objectContaining({
            userId: "user_demo_colaborador",
          }),
        ],
        moderationQueue: expect.arrayContaining([
          expect.objectContaining({
            status: "pending_moderation",
          }),
        ]),
        overview: {
          metrics: expect.arrayContaining([
            expect.objectContaining({
              key: "engagement",
            }),
            expect.objectContaining({
              key: "schedule",
            }),
          ]),
          teamProgressPercent: expect.any(Number),
        },
        scheduleConsole: expect.objectContaining({
          coverageAlerts: expect.any(Array),
          shifts: expect.any(Array),
        }),
      },
      requestId: "req_dashboard_summary",
    });
    expect(payload.data.contentItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "photo_mission",
        }),
      ]),
    );
    expect(payload.data.contentItems.every((item) => item.type === "photo_mission")).toBe(true);
    expect(payload.data.memberInsights[0]).not.toHaveProperty("openIssueCount");
  });
});
