# Cost Control Notes

This repository keeps a no-spend path for development, testing and demos. That promise
stops at the edge of production concerns: app store publishing, production SLAs, paid
runner minutes, exceeded free tiers and sustained traffic can all require payment.

## Default Matrix

| Area | Default env | Free/local path | Fallback | Cost risk | Guardrail |
| --- | --- | --- | --- | --- | --- |
| Database | `DATABASE_PROVIDER=local-postgres` | Local Postgres or Neon Free for demos | Same Drizzle migrations on local Postgres | Neon storage/compute/branch quotas | Keep local Postgres as the default and only switch to Neon intentionally |
| Auth | `AUTH_PROVIDER=local-better-auth` | Better Auth self-hosted pattern behind the adapter | Local development session adapter | Paid seats, MFA add-ons or enterprise auth SKUs | `AUTH_PROVIDER` stays on a free/local path by default |
| Media storage | `STORAGE_PROVIDER=local-filesystem` | Local filesystem under `.local/media` | Same local adapter with small media fixtures | R2/S3 request and storage charges | Local filesystem is the default adapter; remote storage must be opt-in |
| Email | `EMAIL_PROVIDER=console` | Console adapter for auth/notification previews | Console logs in every environment | Paid SMTP relays and volume billing | Keep local/dev mail on console output |
| Analytics | `ANALYTICS_PROVIDER=local-log` | Local event log/console emission | No-op or structured local logs | Paid event ingestion | Mobile analytics stays on local logging during development |
| CI | `CI_PROVIDER=local` | Run `pnpm ci:local` on the workstation | Optional GitHub Actions Ubuntu workflow | Hosted runner minutes, especially macOS | Local gates are canonical; hosted CI is optional |
| Builds | `BUILD_PROVIDER=expo-local` | Expo CLI with `expo start --dev-client` and `expo run:android` | Local emulator/device | EAS remote build quotas and store credentials | Local Android/dev builds are the default path |
| Monitoring | `MONITORING_PROVIDER=local-log` | Structured local logs and test assertions | Console/file logging | Paid observability ingest and alerts | Paid monitoring is off by default in development |

## Recommended Environment

Use these root-level defaults unless you are intentionally validating a hosted free tier:

```bash
COST_GUARDRAILS_ENABLED=true
ALLOW_METERED_PROVIDERS=false

DATABASE_PROVIDER=local-postgres
AUTH_PROVIDER=local-better-auth
STORAGE_PROVIDER=local-filesystem
EMAIL_PROVIDER=console
ANALYTICS_PROVIDER=local-log
CI_PROVIDER=local
BUILD_PROVIDER=expo-local
MONITORING_PROVIDER=local-log
```

The security package validates these provider choices and blocks metered values such as
`cloudflare-r2`, `s3`, `smtp`, `posthog`, `segment`, `sentry`, `datadog`, `clerk`,
`auth0` and `eas-remote` unless `ALLOW_METERED_PROVIDERS=true` is set on purpose.

## Local CI And Builds

- `pnpm ci:local` is the canonical quality gate and must stay runnable without hosted CI.
- `.github/workflows/ci.yml` mirrors the same command on `ubuntu-latest` only to avoid
  macOS runner cost.
- Expo local development uses `pnpm --filter @engaja/mobile dev` plus
  `pnpm --filter @engaja/mobile android`.
- EAS remote builds are documented as optional free-quota usage only; they are not the
  default workflow for local engineering.

## Seed Budgets

The checked-in development seed intentionally stays tiny so demos fit within local or
free-tier budgets:

- `5` seed users covering the nominal RBAC roles.
- `1` feed post, `1` media object, `1` recognition event and `1` schedule row.
- `48,211` total seed media bytes, below the enforced `75,000` byte budget.

These limits are asserted in `packages/data/src/db/seed/flv-store.ts` and in the data
package tests so we do not silently bloat the default demo dataset.

## Production Boundary

Zero-cost development does not mean zero-cost production. Budget for payment when any
of the following become true:

- The app is submitted to the Play Store or App Store.
- EAS remote builds or paid CI runners are required regularly.
- Hosted auth, storage, analytics or monitoring exceed free usage.
- Production uptime, alerting, backup or compliance requirements require paid plans.
