## Context

O repositorio ja tem monorepo pnpm/Turbo, app Expo, API Hono, pacotes `ui`, `security`, `data`, `contracts`, `application` e schema Drizzle com as principais areas do produto. A experiencia atual ainda funciona como demonstracao: o mobile inicia com uma sessao padrao, a API aceita fallback de desenvolvimento, a tela de login nao autentica de verdade e a UI usa muitos blocos com cara de prototipo.

Tambem existe uma string real de banco colocada em `.env.example`. A implementacao deve criar `.env` local para execucao real, mas remover segredos dos exemplos versionados e manter banco, auth e storage fora do bundle mobile.

Stakeholders:

- Colaborador de FLV: entra pelo convite recebido, ve sua rotina, escala, feed, reconhecimento e pendencias.
- Lider de setor: convida colaboradores, modera conteudo, acompanha escala, rotinas, campanhas e painel do time.
- Gerente/admin: controla usuarios, escopos, papeis e bootstrap inicial da organizacao.

## Goals / Non-Goals

**Goals:**

- Fazer o app parecer final, consistente e profissional em todas as telas existentes.
- Definir marca Engaja aplicada no produto: logo, wordmark, cores, ritmo visual, estados e iconografia.
- Trocar copy tecnica/provisoria por copy final em portugues brasileiro, sem termos internos.
- Implementar login e cadastro reais, com registro permitido somente via convite ou bootstrap inicial.
- Permitir convite de colaboradores por usuarios autorizados, com papel, loja, setor, validade, reenvio e revogacao.
- Criar `.env` local seguro, sanear `.env.example` e validar que nenhuma credencial real vai para o mobile.
- Aplicar migrations no banco real, adicionar tabelas de auth/convite/sessao quando necessario e rodar seed minimo.
- Criar gates de qualidade visual, auth, banco e fluxo para validar que o app roda de ponta a ponta.

**Non-Goals:**

- Nao criar cadastro publico aberto sem convite.
- Nao expor credenciais do Neon, segredo de auth ou chaves privadas no app mobile.
- Nao redesenhar a arquitetura de dominio existente alem do necessario para auth, convite e bootstrap real.
- Nao integrar provedor pago obrigatorio de email, auth, analytics ou storage nesta mudanca.
- Nao prometer otimizacao automatica de escala ou funcionalidades novas fora dos fluxos ja existentes.

## Decisions

### Rebuild the mobile experience around final product flows

The mobile app SHALL keep Expo Router and the existing route groups, but the first-run flow changes from demo session to real authentication:

- unauthenticated users land on login;
- invited users can open signup with an invite token/code;
- authenticated collaborators land on the collaborator home;
- authenticated leaders/managers/admins land on the leadership surface;
- forbidden roles see a polished permission state, not a raw redirect or blank page.

The UI rebuild SHALL happen through `packages/ui` tokens and primitives plus screen-level composition in `apps/mobile`. Large screens in `screens.tsx` can be split into focused modules during implementation if needed, but business behavior stays in services/use cases.

Rationale: the app already has many vertical slices, so the fastest path is to finish the product surface rather than introduce a second frontend architecture.

Alternatives considered:

- Replace the whole app shell: too risky and likely to lose working flows.
- Only tweak colors/styles: insufficient because the problem is product completeness, auth flow, copy and information architecture.

### Use an Engaja-specific brand system, not generic dashboard styling

The design system SHALL define:

- a compact Engaja logo/wordmark usable in auth, header and app icon contexts;
- brand tokens for final surfaces, accents, borders, shadows, status colors and photo/evidence treatment;
- mobile-specific density for store work, with clear hierarchy and no marketing-style landing page;
- reusable states for loading, empty, error, offline, success and permission denied;
- icon and action patterns that make primary tasks obvious without explanatory text blocks.

The current FLV palette can be evolved, but the final palette must avoid one-note green/cream dominance. The app should feel operational, fresh and specific to FLV, with camera/photo surfaces carrying product personality.

Rationale: the user explicitly wants a real app, not a generic template. Brand and UI quality become functional requirements.

Alternatives considered:

- Use a third-party UI kit as-is: faster, but would keep the generic feel.
- Full bespoke rendering per screen: visually flexible, but harder to maintain and test.

### Centralize final copy as product content

User-facing copy SHALL be treated as a product asset. Implementation should introduce a small copy map or constants per feature, then remove placeholder language like "modo local", "demo", "escopos", internal provider names or technical success descriptions from UI.

Copy rules:

- Use concise Brazilian Portuguese.
- Address store work naturally: setor, escala, rotina, equipe, convite, acesso, evidencia, reconhecimento.
- Avoid implementation terms: provider, token, scope, fallback, seed, local mode, demo.
- Error messages explain next action without leaking security detail.

Rationale: final copy is part of perceived product quality and must be reviewable in one place.

Alternatives considered:

- Inline all copy in JSX: simpler today, but makes final polish harder to audit.
- Full i18n framework: unnecessary until there is a second language.

### Implement invite-first authentication behind the existing security adapter boundary

Auth SHALL remain behind `packages/security` interfaces. The first real implementation can be local/self-hosted and provider-neutral:

- password credentials are stored server-side only;
- sessions are issued by the API and stored by mobile in SecureStore;
- mobile calls `/auth/session` on launch and after resume;
- protected routes require a verified session;
- logout clears local secure storage and invalidates server session where supported.

Invite flow:

- authorized leader/manager/admin creates an invite for email, role, organization, store and department;
- API stores only a hashed invite token/code, expiry, inviter, intended membership and status;
- invited collaborator opens the link/code, sees the organization/store/department context, sets account details and password;
- accepting an invite creates or updates user, membership and credential records atomically;
- used, expired or revoked invites cannot create accounts;
- leaders can resend or revoke pending invites from the team screen.

Bootstrap:

- first admin access is created through seed/bootstrap config, not public signup;
- after bootstrap, normal collaborator registration requires an invite.

Rationale: this matches the user's desire to send access to collaborators while avoiding open registration and preserving RBAC/ABAC.

Alternatives considered:

- Open self-signup: easier, but unsafe for a private team product.
- External SaaS auth immediately: useful later, but unnecessary before the product flow and database contract are stable.

### Add auth and invitation persistence to the real database

The existing database already has users, memberships, roles and scopes. This change SHALL add missing auth persistence:

- `auth_credentials` or provider account table for email/password or provider subject;
- `auth_sessions` for active sessions, expiry, revocation and device metadata;
- `access_invites` for invite lifecycle and intended membership;
- `password_reset_tokens` or recovery tokens if password recovery is implemented in this slice;
- audit entries for invite create, resend, revoke, accept, login failure lockout and role/scope assignment.

Passwords/tokens MUST be hashed. Raw invite tokens, password reset tokens and session secrets MUST NOT be stored in plaintext.

Rationale: auth must be durable, revocable and auditable in the real database.

Alternatives considered:

- Keep development token parsing: acceptable for tests, not for real app usage.
- Store invite tokens plaintext: easier debugging, unacceptable security posture.

### Make real database setup repeatable and safe

The migration path SHALL support real Neon/Postgres execution without repeatedly applying the same SQL blindly. The current migration helper reads SQL files and executes every statement; implementation should either use Drizzle's migrator/journal or add equivalent migration tracking.

Environment handling:

- create root `.env` locally from the real values already supplied;
- keep `.env` ignored;
- replace real secrets in committed `.env.example` files with placeholders;
- keep mobile env limited to public API URL and Expo public variables;
- validate server-only env names before API startup.

Database commands:

- `pnpm --filter @engaja/data db:migrate` applies pending migrations only;
- `pnpm --filter @engaja/data db:seed` creates initial organization, store, department, roles, first admin and sample operational data;
- a health/check command or API health output confirms the database provider and migration state without printing secrets.

Rationale: a real database must survive repeated local runs, app restarts and partial setup.

Alternatives considered:

- Manual SQL in Neon console: fast once, not repeatable.
- Keep only local Postgres: does not satisfy the request to run against the real database.

### Gate "final UI" with screenshots and smoke flows

Release readiness SHALL include objective gates:

- login, invite signup, collaborator home, leader home and invite management open without visual breakage;
- narrow Android-sized viewport and desktop web preview do not clip text or overlap content;
- auth state changes persist across reload/resume;
- real database migration and seed pass;
- no server-only secrets appear in mobile bundle or public env;
- copy audit finds no placeholder/demo/internal terms.

Rationale: visual quality is subjective, but broken layout, placeholder copy and fake auth can be made testable.

Alternatives considered:

- Manual review only: useful but too easy to regress.
- Pixel-perfect snapshots for every screen: brittle at this stage.

## Risks / Trade-offs

- [Scope is broad and touches most product surfaces] -> Implement in vertical slices: brand tokens, auth, database bootstrap, then screen-by-screen UI completion.
- [Auth implementation may conflict with future provider choice] -> Keep provider-neutral ports and avoid provider-specific concepts in domain/mobile.
- [Real credentials already appeared in an example file] -> Move secrets to `.env`, sanitize examples and recommend rotating the database password if the repo has been shared.
- [Migration helper may fail on an already-migrated database] -> Add migration journal support before running against the real database.
- [UI polish can become endless] -> Use explicit acceptance criteria: complete states, real copy, visual QA screenshots and smoke flows.
- [Email sending may not be configured] -> Support console/manual invite link in local/dev while keeping provider adapter for SMTP later.

## Migration Plan

1. Prepare environment files: create local `.env`, sanitize examples, validate server-only/client-safe variables.
2. Add or adjust database schema for credentials, sessions, invites and recovery.
3. Update migration runner to apply only pending migrations, then generate/apply migrations.
4. Seed first admin, organization, store, department, roles and realistic FLV records.
5. Implement auth API contracts, repositories, service logic and route guards.
6. Implement mobile login, invite signup, session restoration and logout.
7. Implement leader/admin invite management in the team surface.
8. Apply brand/logo/tokens/copy updates across all primary screens.
9. Run database, auth, mobile smoke, visual QA, security and build gates.

Rollback:

- Before production use, reset the Neon development branch and re-run migrations/seed.
- After real users exist, use additive migrations and feature flags for auth UI rollout.
- If invite auth fails, keep admin bootstrap access available through a controlled server-side seed command only.

## Open Questions

- Qual email real sera usado para enviar convites depois do desenvolvimento local: SMTP proprio, Resend, SES ou outro?
- Quem deve ser o primeiro `admin-organizacao` no seed real?
- O convite sera enviado por email agora ou o MVP pode exibir/copiar link de convite para envio manual?
- A recuperacao de senha entra nesta primeira entrega ou fica como fluxo seguinte se o email provider ainda nao estiver decidido?
