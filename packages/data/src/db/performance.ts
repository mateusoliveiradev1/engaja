export interface CriticalDatabaseQueryReview {
  readonly budgetMs: number;
  readonly id: string;
  readonly queryShape: string;
  readonly requiredIndexes: readonly string[];
  readonly reviewChecklist: readonly string[];
}

export const criticalDatabaseQueryReviews = [
  {
    budgetMs: 55,
    id: "feed.pagination",
    queryShape:
      "feed_posts by organization/store/department, moderation visibility, published_at desc and cursor id",
    requiredIndexes: ["feed_posts_pagination_idx"],
    reviewChecklist: [
      "No full table scan for scoped feed reads.",
      "ORDER BY uses the pagination index.",
      "Cursor pagination avoids large OFFSET scans.",
    ],
  },
  {
    budgetMs: 70,
    id: "schedule.lookup",
    queryShape:
      "shifts by organization/store/department, user or week window, starts_at and ends_at range",
    requiredIndexes: ["shifts_schedule_lookup_idx"],
    reviewChecklist: [
      "Week window predicates stay sargable.",
      "User schedule lookups keep the same tenant scope predicate.",
      "Coverage checks do not introduce N+1 shift reads.",
    ],
  },
  {
    budgetMs: 85,
    id: "dashboard.filters",
    queryShape:
      "dashboard_metric_snapshots by organization/store/department, metric key and captured_at range",
    requiredIndexes: ["dashboard_metric_filters_idx"],
    reviewChecklist: [
      "Date filters use captured_at range predicates.",
      "Metric key and scope filters stay in the indexed prefix.",
      "Member detail filters do not expose unscoped negative indicators.",
    ],
  },
  {
    budgetMs: 35,
    id: "permission.check",
    queryShape: "memberships by organization/store/department, user and role permission lookup",
    requiredIndexes: ["memberships_permission_lookup_idx"],
    reviewChecklist: [
      "Permission lookup includes organization scope.",
      "Store and department predicates are present when scoped.",
      "Denied checks avoid existence leaks.",
    ],
  },
] as const satisfies readonly CriticalDatabaseQueryReview[];
