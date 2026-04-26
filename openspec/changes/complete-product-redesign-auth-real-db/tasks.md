## 1. Environment and Current-State Audit

- [x] 1.1 Review current mobile auth, route guards, API auth/session behavior and provider defaults
- [x] 1.2 Review current UI primitives, tokens, screen composition and visible placeholder/demo copy
- [x] 1.3 Confirm `.env` is ignored and create local `.env` from the real database values without printing secrets
- [x] 1.4 Sanitize root, API and mobile `.env.example` files so committed examples contain placeholders only
- [x] 1.5 Add or update environment validation for server-only database/auth/invite/session secrets and mobile public vars

## 2. Database and Migration Readiness

- [x] 2.1 Replace the migration runner with Drizzle migration journal support or equivalent pending-only tracking
- [x] 2.2 Add database tables and constraints for auth credentials/provider accounts, sessions, access invites and recovery tokens if included
- [x] 2.3 Add indexes, uniqueness rules, expiry fields and status fields for invite/session lookup and revocation
- [x] 2.4 Add audit coverage for invite create, resend, revoke, accept, login failure, logout and role/scope changes
- [x] 2.5 Generate and review Drizzle migrations for the new auth/invite schema
- [x] 2.6 Make seed idempotent for organization, store, FLV department, roles, first admin, memberships and realistic app data
- [x] 2.7 Run migrations and seed against the configured real database and record non-secret verification output

## 3. Auth, Invite and Contracts

- [x] 3.1 Add shared contracts for login, logout, session refresh, invite create/list/resend/revoke/accept and signup
- [x] 3.2 Implement auth repository interfaces and database-backed adapters in `packages/data`
- [x] 3.3 Implement password hashing, token hashing, session issuance, session revocation and invite token generation in `packages/security`
- [x] 3.4 Add permission actions and authorization checks for invite management by leader, manager and admin roles
- [x] 3.5 Add API routes for login, logout, current session, invite management and invite acceptance
- [x] 3.6 Remove unauthenticated default-session fallback from production/runtime API behavior while keeping controlled test helpers
- [x] 3.7 Add tests for invalid login, rate limits, invite expiry, invite reuse, invite revocation and forbidden invite creation

## 4. Mobile Auth and Access UX

- [x] 4.1 Replace default mobile session startup with secure session restoration from API and SecureStore
- [x] 4.2 Build final login screen with brand identity, final copy, validation, loading, error and recovery states
- [x] 4.3 Build invite signup screen with invite context, account details, password setup and invalid/expired invite states
- [x] 4.4 Implement logout, session expiry handling and role-aware routing after session refresh
- [x] 4.5 Add leader/admin team access surface for listing, creating, resending and revoking collaborator invites
- [x] 4.6 Ensure collaborators cannot see invite management controls and leaders cannot invite outside their scope
- [x] 4.7 Add mobile tests or smoke coverage for login, invite signup, session restore and logout

## 5. Brand, Copy and UI System

- [x] 5.1 Define final Engaja logo/wordmark assets and app usage rules for auth, headers and metadata
- [x] 5.2 Update `packages/ui` tokens for final colors, typography, spacing, radius, borders, elevation, status colors and motion
- [x] 5.3 Refine UI primitives so buttons, inputs, tabs, chips, cards, states and icon actions feel like finished product components
- [x] 5.4 Centralize or group final app copy for auth, collaborator, leader, team, empty, error, offline and success states
- [x] 5.5 Remove visible placeholder/demo/internal wording from all mobile screens and API-facing user messages
- [x] 5.6 Add branded permission, empty, loading, error, offline and success states for every primary flow
- [x] 5.7 Verify color contrast, tap targets, text wrapping and dynamic text behavior in shared components

## 6. Full-Screen Product Remodel

- [x] 6.1 Remodel app shell/navigation so unauthenticated, collaborator, leader and forbidden states feel complete
- [x] 6.2 Remodel collaborator feed with photo-first hierarchy, polished composer, reactions, comments, pending sync and states
- [x] 6.3 Remodel collaborator schedule with today's work, upcoming shifts, request states and final empty/error/offline states
- [x] 6.4 Remodel collaborator routines with checklist density, evidence, issue logging, progress and completion feedback
- [x] 6.5 Remodel collaborator recognition with achievement archive, campaign progress, ranking and reward status
- [x] 6.6 Remodel leader overview with attention areas, metrics, moderation, schedule coverage and team actions
- [x] 6.7 Remodel leader campaigns, moderation, coverage and team tabs with final copy and scope-aware controls
- [x] 6.8 Split oversized screen modules where needed without moving business rules into UI components

## 7. Persistent Runtime Integration

- [x] 7.1 Wire API runtime to database-backed repositories when real database config is selected
- [x] 7.2 Ensure mobile data services call API endpoints that persist changes instead of relying on in-memory demo data
- [x] 7.3 Verify invite, session, feed, routine, schedule and recognition changes survive API restart
- [x] 7.4 Add health or readiness output that confirms database provider and migration state without exposing secrets
- [x] 7.5 Update docs for local `.env`, real database setup, first admin bootstrap, invite workflow and safe provider choices

## 8. Verification and Release Gates

- [x] 8.1 Run `pnpm --filter @engaja/data db:migrate` and `pnpm --filter @engaja/data db:seed` against the intended real database
- [x] 8.2 Run auth/invite smoke flow: first admin or leader login, invite collaborator, accept invite, restore session and logout
- [x] 8.3 Run visual QA screenshots for login, invite signup, collaborator home, leader home and team invite screens on narrow mobile and wider web preview
- [x] 8.4 Run copy audit for placeholder, demo, internal and technical terms in visible UI text
- [x] 8.5 Run secret scan and verify real database/auth secrets are absent from tracked files, logs and mobile public config
- [x] 8.6 Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, security checks and visual QA
- [x] 8.7 Document any remaining production-only provider choices, such as real email delivery, before marking the app ready
