import { describe, expect, it } from "vitest";

import { performanceBudgetChecklist, performanceBudgets } from "../src/index.js";

describe("performance budgets", () => {
  it("defines budgets for every section 13 performance axis", () => {
    expect(performanceBudgets.mobileStartup.coldStartInteractiveMs).toBeLessThanOrEqual(2_200);
    expect(performanceBudgets.feedRender.maxRenderedWindowScreens).toBeLessThanOrEqual(7);
    expect(performanceBudgets.imageLoading.maxThumbnailBytes).toBeLessThanOrEqual(140_000);
    expect(performanceBudgets.apiLatency.feedPaginationP95Ms).toBeLessThanOrEqual(220);
    expect(performanceBudgets.databaseQueries.feedPaginationMs).toBeLessThanOrEqual(55);
    expect(performanceBudgets.turboTasks.localCiMaxMinutes).toBeLessThanOrEqual(8);
    expect(performanceBudgets.bundles.mobileDistBytes).toBeGreaterThan(0);
    expect(performanceBudgetChecklist).toHaveLength(7);
  });
});
