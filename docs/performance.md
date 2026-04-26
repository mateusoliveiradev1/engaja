# Performance Engineering

The FLV app treats performance as a release requirement, not a later polish pass.
Budgets live in `packages/config/src/performance.ts` and are verified by focused
tests, bundle analysis and release checks.

## Budgets

- Mobile startup: first shell paint within 1200 ms, cold interactive within 2200 ms
  and warm resume within 450 ms.
- Feed render: first four items render initially, item render work stays below 8 ms
  and the virtualized window stays within seven screens.
- Images: feed cards request 720 x 540 thumbnails, keep thumbnails below 140 KB,
  show placeholders quickly and use progressive transitions.
- API: feed pagination, schedule lookup, dashboard filters and permission checks
  emit profile logs and stay within their p95 targets.
- Database: critical indexed paths have documented query shapes and review checks.
- Bundles: mobile and API dist output stay under their package budgets.
- Turbo: local CI, package build and package test durations stay within the shared
  budget table.

## Regression Checklist

Before release, run these gates:

```bash
pnpm test --filter @engaja/config
pnpm test --filter @engaja/mobile
pnpm test --filter @engaja/api
pnpm test --filter @engaja/data
pnpm build
pnpm bundle:analyze
pnpm ci:local
```

Review API profile logs for `feed.pagination`, `schedule.lookup`,
`dashboard.filters` and `permission.check`. A warning-level profile event means the
release is blocked until the regression is fixed or explicitly accepted.

Review the data package's critical query review table when schema, filters,
pagination or permission lookup behavior changes. Every listed path must keep a
matching migration index.
