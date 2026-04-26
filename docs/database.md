# Database Setup

Engaja uses Neon Postgres as the shared development/demo database and the same
Drizzle migrations against local Postgres for no-spend local work.

## Environment

Required variables for API and database tooling:

```bash
DATABASE_PROVIDER=local-postgres
DATABASE_URL=postgresql://engaja:engaja@localhost:5432/engaja_dev
NEON_DATABASE_URL=
ALLOW_METERED_PROVIDERS=false
```

Use `DATABASE_PROVIDER=neon` only when `NEON_DATABASE_URL` points at an intended Neon
branch. Keep mobile `.env` files free of every database variable.

Optional test variable:

```bash
DATABASE_TEST_URL=postgresql://engaja:engaja@localhost:5432/engaja_test
```

When `DATABASE_TEST_URL` is set, the migration test applies SQL inside a disposable
schema and drops it after verification.

## Local Postgres

Start the no-spend local fallback:

```bash
docker compose -f docker-compose.local.yml up -d postgres
pnpm --filter @engaja/data db:migrate
pnpm --filter @engaja/data db:seed
```

The local fallback runs the same generated SQL migration files under
`packages/data/drizzle`.

## Neon Branch Strategy

- `main`: production-like baseline, migrated only from reviewed changes.
- `dev`: shared integration branch for API/mobile development.
- `feature/<change-id>`: temporary branch per risky schema change or demo slice.
- `test/<purpose>`: disposable branch for migration rehearsal when local Postgres is not
  enough.

Create schema changes by editing `packages/data/src/db/schema.ts`, then run:

```bash
pnpm --filter @engaja/data db:generate
pnpm --filter @engaja/data test
```

For Neon Free, delete unused feature/test branches after validation and keep seed media
small. Local Postgres remains the default when avoiding free-tier capacity risk.

## RLS Context

Tenant-scoped tables enable row-level security. API requests must set the Postgres
session variable before tenant queries:

```sql
select set_config('app.organization_id', '<organization uuid>', true);
```

The API layer still owns RBAC/ABAC decisions; database RLS is an additional guard for
tenant isolation.

## Runtime Readiness

The API exposes `GET /ready` for deployment and local smoke checks. It reports the
selected database provider, whether the runtime is using memory or database-backed
repositories, and migration counts from `engaja_migration_journal`. The response is
safe for logs because it never echoes URLs, passwords or tokens.

See `docs/real-database-runtime.md` for the full local setup, first admin and invite
workflow.
