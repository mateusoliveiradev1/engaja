export const performanceBudgets = {
  apiLatency: {
    dashboardFiltersP95Ms: 320,
    feedPaginationP95Ms: 220,
    permissionCheckP95Ms: 18,
    scheduleLookupP95Ms: 260,
  },
  bundles: {
    apiDistBytes: 120_000,
    apiLargestFileBytes: 90_000,
    mobileDistBytes: 420_000,
    mobileLargestFileBytes: 190_000,
  },
  databaseQueries: {
    dashboardFiltersMs: 85,
    feedPaginationMs: 55,
    permissionLookupMs: 35,
    scheduleLookupMs: 70,
  },
  feedRender: {
    initialFeedItems: 4,
    initialRenderMs: 550,
    itemRenderMs: 8,
    maxRenderedWindowScreens: 7,
  },
  imageLoading: {
    feedCardHeightPx: 540,
    feedCardWidthPx: 720,
    maxFullImageBytes: 350_000,
    maxThumbnailBytes: 140_000,
    placeholderMaxMs: 100,
    progressiveTransitionMs: 180,
  },
  mobileStartup: {
    coldStartInteractiveMs: 2_200,
    firstShellPaintMs: 1_200,
    warmResumeMs: 450,
  },
  turboTasks: {
    localCiMaxMinutes: 8,
    packageBuildMaxSeconds: 45,
    packageTestMaxSeconds: 35,
  },
} as const;

export type PerformanceBudgetCategory = keyof typeof performanceBudgets;

export const performanceBudgetChecklist = [
  "Measure cold mobile shell start and warm resume before release.",
  "Verify feed, schedules, routines and dashboard lists keep bounded render windows.",
  "Confirm feed photos use thumbnails, placeholders, memory-disk cache and progressive transitions.",
  "Review API profile logs for feed pagination, schedule lookup, dashboard filters and permission checks.",
  "Review database plans against the indexed paths documented in the data package.",
  "Run bundle analysis for mobile and API packages after build.",
  "Run Turbo lint, typecheck, tests, security checks, visual QA and build gates.",
] as const;
