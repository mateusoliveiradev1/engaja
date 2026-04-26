import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { performanceBudgets } from "@engaja/config";

import {
  buildSizedImageUrl,
  feedListPerformanceProps,
  mobileImagePerformancePolicy,
  mobileListPerformanceContracts,
} from "../src/index.js";

const screenSourcePath = resolve(__dirname, "../src/app/screens.tsx");
const feedUiSourcePath = resolve(__dirname, "../src/app/feed-ui.tsx");

describe("mobile performance policies", () => {
  it("keeps feed list virtualization inside the shared render budget", () => {
    expect(feedListPerformanceProps.initialNumToRender).toBe(
      performanceBudgets.feedRender.initialFeedItems,
    );
    expect(feedListPerformanceProps.windowSize).toBeLessThanOrEqual(
      performanceBudgets.feedRender.maxRenderedWindowScreens,
    );
    expect(feedListPerformanceProps.removeClippedSubviews).toBe(true);
    expect(mobileListPerformanceContracts.map((contract) => contract.id)).toEqual([
      "feed.posts",
      "schedules.shifts",
      "operations.routines",
      "dashboard.metrics",
    ]);
  });

  it("documents memoized feed cards and shared list policy usage in the screen source", async () => {
    const screenSource = await readFile(screenSourcePath, "utf8");
    const feedUiSource = await readFile(feedUiSourcePath, "utf8");

    expect(screenSource).toContain("{...feedListPerformanceProps}");
    expect(screenSource).toContain("FeedPostCard");
    expect(feedUiSource).toContain("const FeedPostCard = memo(function FeedPostCard");
    expect(screenSource).toContain("useCallback");
  });

  it("builds sized cached image requests for feed cards", () => {
    expect(mobileImagePerformancePolicy.feedCardWidthPx).toBe(
      performanceBudgets.imageLoading.feedCardWidthPx,
    );
    expect(mobileImagePerformancePolicy.feedCardHeightPx).toBe(
      performanceBudgets.imageLoading.feedCardHeightPx,
    );
    expect(mobileImagePerformancePolicy.progressiveTransitionMs).toBe(
      performanceBudgets.imageLoading.progressiveTransitionMs,
    );
    expect(buildSizedImageUrl("https://images.engaja.local/feed/opening.jpg")).toBe(
      "https://images.engaja.local/feed/opening.jpg?w=720&h=540&fit=cover&format=webp&q=78",
    );
    expect(buildSizedImageUrl(undefined)).toBeUndefined();
  });
});
