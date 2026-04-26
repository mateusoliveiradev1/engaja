## Context

Este e um produto greenfield para engajar e organizar o setor de FLV com qualidade de produto profissional. O repositorio atual contem apenas OpenSpec, entao a implementacao deve nascer com arquitetura de plataforma: mobile app, API, banco Neon, midia segura, design system, dominio isolado, observabilidade, testes e gates de qualidade.

Stakeholders principais:

- Lideranca de FLV: monta escalas, publica desafios, acompanha feed, reconhece pessoas, modera conteudo e toma decisoes.
- Colaboradores de FLV: veem escala, executam rotinas, postam fotos, participam de missoes, recebem feedback e acompanham conquistas.
- Gestao futura: acompanha indicadores por loja/setor, qualidade operacional, engajamento, cobertura de escala e riscos.

Restricoes assumidas:

- O app precisa ser mobile-first, moderno e nao generico.
- O codigo precisa ser modular, limpo, testavel e preparado para crescimento.
- O banco principal deve ser Neon Postgres.
- Fotos e midias devem ser tratadas como superficie critica de seguranca.
- O mobile nunca deve acessar credenciais do banco diretamente.
- O desenvolvimento deve funcionar sem gastar dinheiro, usando execucao local e free tiers monitorados.

## Goals / Non-Goals

**Goals:**

- Criar stack 2026 com pnpm workspaces, Turborepo, Expo SDK 55, React Native, TypeScript, API modular, Neon Postgres e Drizzle ORM.
- Implementar feed de engajamento com fotos, comentarios controlados, reacoes, moderacao e vinculo com missoes/rotinas.
- Implementar gestao de escala com turnos, disponibilidade, folgas, trocas, aprovacoes e cobertura.
- Criar UI/UX premium exclusiva para FLV, com foco em fotos reais, rotina operacional, microinteracoes e acessibilidade.
- Aplicar clean code, SOLID, arquitetura hexagonal, dependency inversion, boundaries estritos e contratos tipados.
- Aplicar seguranca enterprise: RBAC/ABAC, RLS, auditoria, upload seguro, validacao, rate limit, secrets, logs e testes de autorizacao.
- Aplicar performance extrema: listas virtualizadas, cache, imagens otimizadas, render budgets, bundle budgets e profiling.
- Manter um modo de desenvolvimento custo zero documentado, com fallback local para banco, storage, email, analytics, CI e builds.

**Non-Goals:**

- Nao integrar com ERP, folha de pagamento, ponto eletronico ou sistemas fiscais na primeira versao.
- Nao expor banco Neon diretamente ao app mobile.
- Nao armazenar arquivos binarios grandes diretamente no Postgres; Neon guarda metadados, permissoes e auditoria.
- Nao usar UI kit generico como identidade final do produto.
- Nao adotar dependencias experimentais ou canary como base obrigatoria de producao.
- Nao criar ranking negativo, exposicao publica de baixa performance ou competicao toxica.
- Nao exigir plano pago, cartao de credito obrigatorio ou servico pago para desenvolver, testar e demonstrar o MVP.

## Decisions

### Use pnpm workspaces and Turborepo as the platform foundation

The repository SHALL use pnpm workspaces and Turborepo.

Target structure:

- `apps/mobile`: Expo mobile app.
- `apps/api`: modular API used by mobile and future admin.
- `apps/admin`: optional future web admin shell, initially deferred unless implementation needs it.
- `packages/ui`: design system and primitives.
- `packages/domain`: entities, value objects, domain services and business rules.
- `packages/application`: use cases, ports, authorization policies and DTO orchestration.
- `packages/data`: repository implementations, Neon/Drizzle clients, storage adapters and sync adapters.
- `packages/contracts`: API contracts, schemas, event names and shared validation.
- `packages/security`: auth helpers, permission matrix, audit helpers and redaction utilities.
- `packages/config`: TypeScript, ESLint, test, build and release configuration.

Rationale:

- pnpm workspaces provide deterministic local package references through `workspace:*`.
- Turborepo gives a task graph, caching and clear package ownership for a growing TypeScript codebase.
- This layout separates product modules from shared platform packages.

Alternatives considered:

- Single Expo app folder: faster to start, but weak for modularity, API and shared contracts.
- npm/yarn workspaces: workable, but the requested stack is pnpm and pnpm is strong for strict workspaces.

### Use Expo SDK 55, React Native and TypeScript for mobile

The mobile app SHALL use Expo SDK 55, React Native, React 19.2 and TypeScript.

Rationale:

- Expo SDK 55 is the current stable Expo line verified for 2026 and includes React Native 0.83.
- Expo Router supports file-based mobile navigation and keeps route groups maintainable.
- React Native lets the product ship to Android and iOS with one modular codebase.
- TypeScript is mandatory for clean contracts, safe refactors and enterprise maintainability.

Implementation direction:

- Use Expo Router with protected route groups.
- Use development builds for native capabilities.
- Use React Native Reanimated for motion and gesture polish.
- Use FlashList or equivalent virtualization for the feed and long operational lists.
- Use `expo-image` or equivalent for image caching, placeholders and transitions.

Alternatives considered:

- Flutter: strong UI, but less aligned with TypeScript/Turborepo and shared API contracts.
- Native Kotlin/Swift: maximum platform control, higher cost and slower iteration.
- Expo canaries: interesting for future upgrades, but not stable enough as production baseline.

### Use a modular API instead of direct database access from mobile

The mobile app MUST communicate with `apps/api`; it MUST NOT connect directly to Neon.

API architecture:

- Hono or Fastify-style lightweight API layer with route modules per bounded context.
- Zod or equivalent runtime validation for request and response contracts.
- OpenAPI generation for API inspection and tests.
- Use-case orchestration in `packages/application`.
- Domain rules in `packages/domain`.
- Persistence in `packages/data`.

Rationale:

- Direct mobile database access would leak connection risk and weaken authorization.
- A modular API allows rate limits, audit logs, file upload controls, RBAC/ABAC and policy enforcement.
- The API can later serve an admin web app without duplicating business logic.

Alternatives considered:

- Backendless/local-only MVP: too weak for security, feed photos and scheduling.
- Heavy enterprise framework from day one: useful later, but extra complexity before scale is proven.

### Use Neon Postgres with Drizzle ORM

The backend SHALL use Neon serverless Postgres as the primary database and Drizzle ORM for schema-first TypeScript migrations and queries.

Data model principles:

- Multi-tenant-ready schema with `organization_id`, `store_id` and `department_id` where relevant.
- Strict foreign keys, unique constraints, check constraints and indexed query paths.
- RLS policies for sensitive and tenant-scoped tables where practical.
- Append-only audit log for sensitive actions.
- Database migrations committed and reviewed.
- Pooled Neon connections for serverless/API workloads.

Rationale:

- Neon provides serverless Postgres, branching, autoscaling and connection pooling.
- Drizzle keeps database schema close to TypeScript while preserving SQL visibility.
- Postgres fits scheduling, audit logs, feed metadata, permissions, relational metrics and reporting.

Alternatives considered:

- Firebase/Supabase-only: fast for MVP, but the user explicitly requested Neon and stronger SQL control.
- Prisma: excellent DX, but Drizzle is lighter and closer to SQL for high-control schema work.

### Store media in private object storage with Neon metadata

Photos and evidence SHALL be stored in private object storage; Neon SHALL store metadata, ownership, permissions, moderation state, hashes and audit records.

Upload flow:

- Mobile requests an upload intent from the API.
- API validates user permission, file constraints and target context.
- API returns a signed upload URL or direct upload token.
- Storage receives the file under a server-generated path.
- API finalizes metadata after validation.
- Media is private by default and served through signed read URLs or proxied access.

Security controls:

- Allowlist MIME types and extensions.
- Enforce max file size and image dimensions.
- Generate server-side filenames.
- Strip or ignore EXIF location metadata.
- Quarantine files until validation/moderation status is safe.
- Rate-limit upload attempts.

Rationale:

- Photos are central to engagement, but uploads are a high-risk attack surface.
- Postgres is not the right place for large binary objects.

### Build a premium FLV-specific UI/UX language

The product SHALL have a custom visual identity, not a generic admin or social feed.

Design direction:

- Photo-first feed with polished cards, real produce imagery, camera-forward actions and rich but restrained motion.
- Operational command surfaces for escala, rotinas and indicadores.
- Palette inspired by FLV freshness with balanced accents: leaf, citrus, tomato, grape and neutral graphite.
- Dense but calm information architecture for repeated daily use.
- No nested cards, no marketing hero, no generic SaaS dashboard look.
- All text, states and flows in professional Brazilian Portuguese.

Quality gates:

- Every primary screen must have loading, empty, error, offline and success states.
- Every flow must be usable on narrow Android screens.
- Accessibility labels, contrast, hit targets and keyboard/screen-reader behavior must be checked.
- Screenshot review must catch overlap, truncation, generic UI and performance regressions.

### Enforce enterprise security from the first implementation

Security baseline:

- Auth provider behind adapter, with MFA/passkey-ready support.
- JWT/session verification only on server/API.
- RBAC and ABAC permission matrix for collaborator, sector leader, store manager, organization admin and future auditor roles.
- Store/department scoping on every query.
- RLS for tenant-sensitive Neon tables where practical.
- API input and output validation.
- Rate limiting and abuse protection for login, feed, comments, reactions, uploads and scheduling actions.
- Audit log for schedule changes, permission changes, content moderation, recognition and sensitive reads.
- Secrets kept out of app bundles and source control.
- Error redaction and structured security logs.
- Dependency scanning, secret scanning, SAST and security tests in CI.

Rationale:

- Feed photos, schedules and performance insights can expose people, store operations and sensitive behavior.
- Enterprise quality means authorization and auditability are not optional.

### Define RBAC roles explicitly

The first RBAC matrix SHALL include these roles:

- `colaborador`: sees own schedule, team feed for allowed scope, assigned routines, missions, own points and own recognition.
- `lider-setor`: manages FLV team feed moderation, routines, checklists, shift summaries, recognition and schedule requests for their department/store scope.
- `gerente-loja`: manages all departments in a store, approves escalated schedule changes, sees store-level dashboards and can configure leaders.
- `admin-organizacao`: manages organizations, stores, departments, users, roles, global settings, audit access and integration settings.
- `auditor`: read-only access to audit logs, sensitive reports and evidence according to explicit scope.

ABAC dimensions:

- `organization_id`
- `store_id`
- `department_id`
- `shift_id`
- content ownership
- moderation state
- employment/status state

Permission examples:

- Only `lider-setor`, `gerente-loja` and `admin-organizacao` can approve feed posts.
- Only `lider-setor`, `gerente-loja` and `admin-organizacao` can publish schedules.
- Only `gerente-loja` and `admin-organizacao` can assign or remove `lider-setor`.
- Only `admin-organizacao` can create stores, departments and global roles.
- `auditor` can read audit data but cannot mutate operational records.
- `colaborador` can request swaps and time off but cannot approve them.

### Use zero-cost development defaults

The implementation SHALL support a no-spend development path.

Default development choices:

- Package manager/build: pnpm and Turborepo, free and local.
- Mobile: Expo CLI and local development builds; avoid relying on paid remote build capacity.
- Database: Neon Free for shared/dev demos and local Postgres fallback for unlimited local testing.
- Auth: Better Auth self-hosted or Neon Auth free tier through an auth adapter; no paid SaaS dependency required.
- Media storage: local filesystem/MinIO for development; Cloudflare R2 free tier may be used only with documented limits and budget guardrails.
- Email: local Mailpit or console adapter; no paid SMTP required for development.
- Analytics: local event logger during development; paid analytics deferred.
- CI: local `pnpm`/Turbo gates first; GitHub Actions free minutes optional and budget-limited.
- Monitoring: structured local logs and open-source checks; paid observability deferred.

Guardrails:

- Any provider with possible overage MUST have a documented limit and local fallback.
- Development seed media MUST stay small enough to avoid storage costs.
- CI workflows MUST avoid macOS runners by default.
- EAS remote builds MUST be optional; local Android/dev builds are the default development path.
- Production launch costs, app store fees and high-traffic usage are out of the zero-cost development guarantee.

### Apply clean architecture and SOLID boundaries

Dependency direction:

`apps/* -> packages/application -> packages/domain`

Adapters:

`apps/api -> packages/data -> Neon/storage/providers`

UI:

`apps/mobile -> packages/ui + feature modules + application ports`

Rules:

- Domain MUST NOT import React, Expo, API framework, Drizzle or storage SDKs.
- Feature modules MUST NOT import internals from another feature.
- Application use cases MUST depend on interfaces, not concrete adapters.
- API route handlers MUST be thin and delegate to use cases.
- UI screens MUST be composition layers, not business-rule containers.
- Shared packages MUST expose explicit public exports.

### Make performance a tracked requirement

Performance budgets:

- Feed interactions should remain responsive under large post lists.
- Initial mobile shell should avoid unnecessary blocking network calls.
- Images should use placeholders, caching and correct sizing.
- API endpoints should avoid N+1 queries and have explicit indexes.
- Common screens should be profiled before release.
- Turbo tasks should keep CI fast through package-level caching.

Rationale:

- A beautiful app that scrolls poorly or blocks in-store is not professional.
- Performance must be designed into data access, UI lists, images and build tooling.

## Risks / Trade-offs

- [Scope expands into full workforce platform] -> Keep first version focused on FLV feed, escala, rotinas, reconhecimento and lideranca.
- [Premium UI slows implementation] -> Build a small but excellent design system and validate every screen before expanding.
- [Media uploads increase security risk] -> Use signed uploads, validation, moderation, private storage and audit logs.
- [Scheduling logic gets complex] -> Start with manual leader-managed shifts, availability and swap approvals; defer automatic optimization.
- [Enterprise architecture delays MVP] -> Keep boundaries strict but build thin vertical slices end to end.
- [Neon direct access temptation] -> Enforce API-only database access and never ship database credentials to mobile.
- [Performance budgets are ignored] -> Add explicit CI/test tasks and profiling checkpoints.
- [RLS and app authorization drift] -> Test permission matrix at API and database levels.

## Migration Plan

Because this is greenfield, there is no existing runtime migration.

Initial rollout:

1. Scaffold pnpm/Turborepo monorepo and shared package boundaries.
2. Build Expo mobile shell and API shell.
3. Configure Neon, Drizzle schema, migrations and seed data.
4. Implement auth/session adapter, permission matrix, audit log and secure API contracts.
5. Build UI design system and visual identity before full feature buildout.
6. Implement feed/photos as the first vertical slice: mobile UI, API, Neon metadata, storage adapter and moderation.
7. Implement scheduling vertical slice: shifts, availability, swaps and leader approvals.
8. Implement FLV operations, recognition and leader dashboard slices.
9. Add tests, security checks, performance profiling and visual QA.
10. Prepare production checklist and documented backend integration points.

Rollback:

- Before production data, rollback is code and migration reset in Neon development branches.
- After production data, rollback uses additive migrations, feature flags and API compatibility windows.
- Media cleanup jobs must remove orphaned private files if upload finalization fails.

## Open Questions

- Qual auth provider deve ser usado inicialmente: Clerk, Neon Auth, Auth0 ou outro provedor corporativo?
- O object storage preferido sera Cloudflare R2, AWS S3 ou outro S3-compatible?
- A escala precisa considerar regras trabalhistas formais ja no MVP ou apenas planejamento operacional?
- O feed com fotos sera restrito ao setor/loja ou podera ter visibilidade multi-loja?
- Comentarios no feed devem ser liberados desde o MVP ou comecar apenas com reacoes e moderacao?
- Quais metricas de performance devem virar SLA interno: tempo de abertura, FPS do feed, latencia de API ou tempo de build?
