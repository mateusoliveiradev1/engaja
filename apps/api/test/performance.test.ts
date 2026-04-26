import { describe, expect, it } from "vitest";

import { performanceBudgets } from "@engaja/config";
import { developmentSessionTokens, type StructuredLogEvent } from "@engaja/security";

import { apiPerformanceOperationBudgets, createApiApp } from "../src/index.js";

function readOperation(event: StructuredLogEvent): string | undefined {
  return typeof event.metadata === "object" &&
    event.metadata !== null &&
    "operation" in event.metadata
    ? String(event.metadata.operation)
    : undefined;
}

describe("API performance profiling", () => {
  it("logs profile events for critical query paths and permission checks", async () => {
    const events: StructuredLogEvent[] = [];
    const app = createApiApp({
      logger: (event) => events.push(event),
      now: () => new Date("2026-04-23T12:00:00.000Z"),
    });

    await app.request("/feed/home?limit=2", {
      headers: {
        authorization: `Bearer ${developmentSessionTokens.colaborador}`,
        "x-request-id": "req_perf_feed",
      },
    });
    await app.request("/schedules/planner", {
      headers: {
        authorization: `Bearer ${developmentSessionTokens["lider-setor"]}`,
        "x-request-id": "req_perf_schedule",
      },
    });
    await app.request("/dashboard/summary?contentType=photo_mission", {
      headers: {
        authorization: `Bearer ${developmentSessionTokens["lider-setor"]}`,
        "x-request-id": "req_perf_dashboard",
      },
    });

    const operations = events.map(readOperation).filter((operation): operation is string => operation !== undefined);

    expect(operations).toEqual(
      expect.arrayContaining([
        "dashboard.filters",
        "feed.pagination",
        "permission.check",
        "schedule.lookup",
      ]),
    );
    expect(
      events.every((event) =>
        typeof event.metadata === "object" &&
        event.metadata !== null &&
        "budgetMs" in event.metadata &&
        "durationMs" in event.metadata,
      ),
    ).toBe(true);
  });

  it("keeps API profile budgets aligned with shared performance budgets", () => {
    expect(apiPerformanceOperationBudgets["feed.pagination"]).toBe(
      performanceBudgets.apiLatency.feedPaginationP95Ms,
    );
    expect(apiPerformanceOperationBudgets["schedule.lookup"]).toBe(
      performanceBudgets.apiLatency.scheduleLookupP95Ms,
    );
    expect(apiPerformanceOperationBudgets["dashboard.filters"]).toBe(
      performanceBudgets.apiLatency.dashboardFiltersP95Ms,
    );
    expect(apiPerformanceOperationBudgets["permission.check"]).toBe(
      performanceBudgets.apiLatency.permissionCheckP95Ms,
    );
  });
});
