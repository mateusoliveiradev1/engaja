# Real Database Runtime

Use this path when the API and mobile app should persist auth, invite, feed,
routine, schedule, recognition and engagement changes across API restarts.

## Local `.env`

Start from `.env.example` and keep these variables server-only:

```bash
DATABASE_PROVIDER=local-postgres
DATABASE_URL=postgresql://engaja:engaja@localhost:5432/engaja
NEON_DATABASE_URL=

SESSION_SECRET=replace-with-local-dev-value
INVITE_TOKEN_SECRET=replace-with-local-dev-value
AUTH_PROVIDER=local-better-auth
STORAGE_PROVIDER=local-filesystem
LOCAL_STORAGE_DIR=.local/storage
```

The mobile app must only receive public API URLs such as
`EXPO_PUBLIC_API_URL=http://localhost:3000`. Do not copy database URLs, session
secrets or invite token secrets into mobile env files.

## Provider Choices

- `DATABASE_PROVIDER=local-postgres` uses `DATABASE_URL` and is the default safe local
  path.
- `DATABASE_PROVIDER=neon` uses `NEON_DATABASE_URL` and should point at the intended
  branch.
- Leave `ALLOW_METERED_PROVIDERS=false` unless the current session explicitly accepts
  hosted provider usage.

When `DATABASE_PROVIDER` and the matching URL are present, `createApiAppFromEnvironment`
wires Drizzle auth/media repositories and persistent product repositories. If a
provider is set, the matching URL is required. If neither provider nor database URL is
set, the API factory keeps the in-memory development runtime.

## Production-Only Provider Choices

The real database path is release-ready for local and hosted-database validation, but
these providers still need an explicit production decision before an external pilot:

- Email delivery: `EMAIL_PROVIDER=console` is acceptable for local invite verification
  only. Choose a real SMTP or transactional email provider before sending live invites,
  and keep invite tokens out of logs once email delivery is enabled.
- Auth hardening: `AUTH_PROVIDER=local-better-auth` keeps the MVP adapter local and
  no-spend. Before external rollout, choose the hosted/self-hosted auth operating model
  and confirm password policy, recovery, MFA expectations and audit retention.
- Object storage: `STORAGE_PROVIDER=local-filesystem` is the default for local media.
  Before production photo evidence, choose a durable object store, lifecycle policy and
  private media access model.
- Analytics and monitoring: `ANALYTICS_PROVIDER=local-log` and
  `MONITORING_PROVIDER=local-log` keep development free. Before live traffic, choose an
  event sink, error reporting path and alerting owner.
- CI and builds: local CI and Expo local builds remain canonical for this branch.
  Hosted CI, EAS remote builds and store publishing credentials are production rollout
  choices, not hidden MVP requirements.

## Setup

```bash
docker compose -f docker-compose.local.yml up -d postgres
pnpm --filter @engaja/data db:migrate
pnpm --filter @engaja/data db:seed
pnpm --filter @engaja/api dev
```

After the API starts, check readiness:

```bash
curl http://localhost:3000/ready
```

The readiness response reports the provider, persistence mode and migration counts. It
must not include connection strings, tokens or secret values.

## First Admin And Invites

The seed creates a first organization, store, department, roles and a bootstrap admin
record for local development. After the first admin signs in or is bootstrapped with a
real password in the target environment, use the invite API/workflow to add users:

1. Admin creates an invite with role and tenant scope.
2. The API signs the invite token with `INVITE_TOKEN_SECRET`.
3. The recipient accepts the invite, sets a password and receives a database-backed
   session.
4. Admin can resend or revoke pending invites.

Sessions and invites are stored in the selected database when the real runtime is
enabled, so they survive API restarts.

## Mobile Data Behavior

Mobile services call API endpoints by default. The legacy local demo fallback is now
explicit and should be used only in tests or deliberate demo/offline rehearsals:

```ts
createOperationsService(session, {
  fetcher,
  offlineFallback: true,
});
```

For app-level local demos, set `EXPO_PUBLIC_ENABLE_DEMO_FALLBACK=true`. Keep it false
for real QA so feed posts, routine completions, schedules, recognition events and
engagement changes are persisted by the API.
