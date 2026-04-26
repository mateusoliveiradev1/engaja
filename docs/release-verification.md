# Release Verification

Use this checklist after feature work and before marking the MVP release-ready.

- Run `pnpm ci:local` from the repo root.
- Run `pnpm test:e2e` from the repo root when a change touches cross-surface workflows.
- Run `pnpm bundle:analyze` after a fresh build.
- Confirm feed scrolling uses the shared virtualized list policy.
- Confirm schedule, routine and dashboard lists are either virtualized or explicitly
  bounded and memoized by their mobile performance contract.
- Confirm feed images use thumbnails, placeholders, memory-disk caching and
  progressive loading.
- Review API performance profile events for feed pagination, schedule lookup,
  dashboard filters and permission checks.
- Review database critical query checks against the current migration indexes.
- Re-run visual QA after any UI or list-rendering change.
- Review [docs/engagement-campaign-operations.md](/C:/Users/Liiiraa/Documents/estudos/engaja/docs/engagement-campaign-operations.md) before shipping archive or campaign changes that affect moderation, ranking or reward fulfillment.
- Review [docs/mobile-qa.md](/C:/Users/Liiiraa/Documents/estudos/engaja/docs/mobile-qa.md) for the current layout and accessibility evidence.
- Review [docs/cost-control.md](/C:/Users/Liiiraa/Documents/estudos/engaja/docs/cost-control.md) and [docs/mobile-development.md](/C:/Users/Liiiraa/Documents/estudos/engaja/docs/mobile-development.md) before switching away from the local/free defaults.
- Review [docs/mvp-readiness.md](/C:/Users/Liiiraa/Documents/estudos/engaja/docs/mvp-readiness.md) for the remaining release gaps and open provider decisions.
