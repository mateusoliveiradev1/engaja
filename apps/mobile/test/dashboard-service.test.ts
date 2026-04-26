import { describe, expect, it } from "vitest";

import { createLeaderDashboardService } from "../src/app/dashboard-service.js";

const offlineFetcher: typeof fetch = async () => {
  throw new Error("offline");
};

const leaderSession = {
  displayName: "Lider FLV",
  role: "lider-setor" as const,
  scope: {
    departmentId: "dept_flv",
    organizationId: "org_demo",
    storeId: "store_001",
  },
  userId: "user_demo_lider",
};

describe("leader dashboard mobile service", () => {
  it("builds the command dashboard from local fallbacks when offline", async () => {
    const service = createLeaderDashboardService(leaderSession, {
      fetcher: offlineFetcher,
      offlineFallback: true,
    });

    const summary = await service.getSummary({
      contentType: "photo_mission",
      teamMemberId: "user_demo_colaborador",
    });

    expect(summary.filters.selected).toMatchObject({
      contentType: "photo_mission",
      storeId: "store_001",
      teamMemberId: "user_demo_colaborador",
    });
    expect(summary.overview.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "engagement" }),
        expect.objectContaining({ key: "schedule" }),
        expect.objectContaining({ key: "routine" }),
      ]),
    );
    expect(summary.contentItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "photo_mission",
        }),
      ]),
    );
    expect(summary.contentItems.every((item) => item.type === "photo_mission")).toBe(true);
    expect(summary.attentionAreas.length).toBeGreaterThan(0);
    expect(summary.checklistMonitor.totalCount).toBeGreaterThan(0);
    expect(summary.memberInsights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: "user_demo_colaborador",
        }),
      ]),
    );
    expect(summary.moderationQueue.every((post) => post.status === "pending_moderation")).toBe(
      true,
    );
  });
});
