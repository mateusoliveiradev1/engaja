# Engaja FLV

Mobile-first engagement and operations platform for FLV teams. This repo starts as a
pnpm/Turborepo monorepo with strict package boundaries, TypeScript project references,
workspace protocol dependencies and local-first cost guardrails.

## Stack

- pnpm 10 workspaces with `workspace:*` for all internal dependencies.
- Turborepo for package task orchestration and cacheable quality gates.
- TypeScript 6 with project references, path aliases and public `exports` maps.
- ESLint flat config, Prettier, dependency cycle checks and unused export checks.
- Vitest for domain, application, API and package-level tests.
- Expo mobile app shell, modular API, Neon Postgres/Drizzle persistence and
  local Postgres fallback.

## Workspace Commands

```bash
corepack enable
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm security
pnpm ci:local
```

Useful focused commands:

```bash
pnpm build
pnpm test:e2e
pnpm unused
pnpm cycles
pnpm visual:qa
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

## Architecture Rules

- `apps/mobile` is the mobile composition layer. It must call API/data contracts and
  must never import Neon, Drizzle or server-only drivers.
- `apps/api` owns server routes and delegates product behavior to use cases.
- `packages/application` orchestrates use cases and depends on domain contracts, not
  provider implementations.
- `packages/domain` is business logic only. It must not import React, Expo, API
  frameworks, Drizzle, Neon or storage SDKs.
- `packages/data` owns repository, database, storage and sync adapters.
- `packages/contracts` owns shared API/event validation contracts.
- `packages/security` owns auth helpers, permission matrices, audit helpers and
  redaction utilities.
- `packages/ui` owns design tokens and UI primitives for the FLV product language.
- Every workspace package exposes a public `exports` map; do not import another
  package's private `src` paths.

## Local Setup Expectations

Development defaults are free/local:

- Database uses `DATABASE_PROVIDER=local-postgres` unless Neon Free is explicitly set.
- Auth uses a local/free adapter path while provider choice remains behind an adapter.
- Media uses local filesystem storage by default.
- Email uses console output or Mailpit-style local delivery.
- Analytics uses local event logging.
- Hosted CI, EAS and remote storage are optional free-tier paths, not required for
  local development.

Recommended zero-cost provider flags:

```bash
COST_GUARDRAILS_ENABLED=true
ALLOW_METERED_PROVIDERS=false
CI_PROVIDER=local
BUILD_PROVIDER=expo-local
MONITORING_PROVIDER=local-log
```

Copy `.env.example`, `apps/api/.env.example` and `apps/mobile/.env.example` when a
local environment file is needed. Keep real secrets out of source control.

See `docs/cost-control.md` for the provider matrix and overage guardrails.
See `docs/database.md` for Neon branch strategy, Drizzle migrations and local
Postgres setup.
See `docs/real-database-runtime.md` for database-backed API runtime, first admin,
invite workflow and mobile persistence behavior.
See `docs/mobile-development.md` for Expo local development, Android/dev builds and
the optional EAS path.
See `docs/mobile-security.md` for the mobile security checklist and release gate.
See `docs/performance.md` and `docs/release-verification.md` for performance
budgets, bundle checks and release regression gates.
