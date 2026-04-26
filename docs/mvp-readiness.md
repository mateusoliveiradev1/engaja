# MVP Readiness

Updated on 2026-04-24 after completing the auth, real-database and release-gate verification pass.

## Ready Now

- API, repository, storage and pending-sync paths have integration coverage plus a smoke flow that exercises login, feed posting, moderation, schedule publishing, checklist completion and recognition.
- Mobile render tests now cover collaborator feed, schedule, checklist, recognition, leader dashboard and the shared state surfaces used to protect primary flows.
- Visual QA and accessibility expectations are documented, reviewed, backed by narrow/wide web-preview screenshots and tied to the `visual:qa` release gate.
- Zero-cost defaults are now documented and guarded for auth, storage, email, analytics, CI, Expo local builds and development seed budgets.

## Open Gaps

- Native device screenshot automation for Android/iPhone/tablet is still manual-checklist based; this branch captures required web-preview screenshots before release.
- The API and mobile smoke flow still use local-safe adapters for development, so production-only observability, auth hardening and remote storage telemetry still need a later validation pass.
- Performance budgets are checked through existing build/test gates, but real-store network variability and long-session memory profiling still need post-MVP measurement on physical devices.

## Provider Choices Still Open

- Auth adapter: keep the local/free auth adapter for MVP validation, then choose between Better Auth self-hosted and Neon Auth free path before external pilot rollout.
- Object storage: local filesystem remains the no-spend default; production direction is still open between MinIO-compatible/S3-compatible infrastructure and a managed low-cost object store.
- Analytics and monitoring: local structured logging is sufficient for MVP validation, but a production event sink and alerting path still need a final choice once traffic expectations are known.
- Email delivery: console delivery is sufficient for local invite verification, but a transactional email/SMTP provider must be selected before live collaborator invites.

## Next Decisions After MVP Validation

- Decide whether the first pilot needs native screenshot automation and device-farm coverage before broadening beyond internal FLV leadership.
- Confirm which provider stack graduates from local-safe defaults into the first hosted environment, especially auth, object storage and monitoring.
- Use the MVP feedback loop to decide whether the next tranche prioritizes production provider hardening or deeper operational analytics and rollout readiness.
