## 1. Monorepo and Tooling Foundation

- [x] 1.1 Initialize pnpm workspace with `pnpm-workspace.yaml`, root `package.json`, pinned `packageManager` and strict workspace protocol usage
- [x] 1.2 Configure Turborepo with cached `build`, `dev`, `lint`, `typecheck`, `test`, `test:e2e`, `db:*`, `security:*` and `visual:*` tasks
- [x] 1.3 Create package layout for `apps/mobile`, `apps/api`, `packages/ui`, `packages/domain`, `packages/application`, `packages/data`, `packages/contracts`, `packages/security` and `packages/config`
- [x] 1.4 Configure TypeScript project references, path aliases and `exports` maps for every internal package
- [x] 1.5 Add ESLint flat config, Prettier, import-boundary rules, unused export checks and dependency cycle checks
- [x] 1.6 Add Vitest test setup for domain, application, API and package-level tests
- [x] 1.7 Add root CI-equivalent scripts that run lint, typecheck, tests, security checks and build through Turbo
- [x] 1.8 Add README with stack, workspace commands, architecture rules and local setup expectations
- [x] 1.9 Add `.env.example` files that default to local/free adapters and never require paid credentials for development
- [x] 1.10 Add a cost-control note that lists every provider, its free path, local fallback and overage risk

## 2. Mobile and API Platform

- [x] 2.1 Scaffold `apps/mobile` with Expo SDK 55, React Native, React 19.2 and TypeScript
- [x] 2.2 Configure Expo Router with protected route groups for collaborator, leader and auth flows
- [x] 2.3 Configure development build support for camera, media picker, secure storage and push-notification-ready native capabilities
- [x] 2.4 Scaffold `apps/api` with modular route ownership for auth, feed, schedules, operations, recognition, dashboard, media and audit
- [x] 2.5 Add shared request/response contracts in `packages/contracts` using runtime validation schemas
- [x] 2.6 Add typed API client in `packages/data` for the mobile app to consume API contracts
- [x] 2.7 Add app providers for theme, query/cache, session, offline status, analytics and error boundaries
- [x] 2.8 Verify the mobile bundle does not contain database credentials, Neon drivers or server-only modules

## 3. Neon Database and Persistence

- [x] 3.1 Create Neon project setup documentation with required environment variables and branch strategy
- [x] 3.2 Configure Drizzle ORM, Drizzle Kit, database client and migration output paths
- [x] 3.3 Model multi-tenant base tables for organizations, stores, departments, users, memberships, roles and permissions
- [x] 3.4 Model feed, media, comments, reactions, missions, polls, announcements and moderation tables
- [x] 3.5 Model shift scheduling tables for shifts, availability, time-off requests, swap requests, coverage rules and schedule notifications
- [x] 3.6 Model FLV operations tables for checklists, checklist items, standards, issues, evidence and shift summaries
- [x] 3.7 Model recognition and gamification tables for points ledger, badges, achievements, recognition and anti-abuse counters
- [x] 3.8 Model leader dashboard read models, analytics events and attention-area snapshots
- [x] 3.9 Add indexes for feed pagination, schedule lookup, dashboard filters, permission checks and audit queries
- [x] 3.10 Add RLS-ready tenant/store/department columns and policies where practical
- [x] 3.11 Add seed data for one realistic FLV store with leaders, collaborators, schedules, posts, routines and recognitions
- [x] 3.12 Add migration tests that verify schema creation, constraints and seed integrity against a test database
- [x] 3.13 Add seed users for `colaborador`, `lider-setor`, `gerente-loja`, `admin-organizacao` and `auditor`
- [x] 3.14 Add local Postgres fallback configuration that can run the same Drizzle migrations without Neon

## 4. Enterprise Security Baseline

- [x] 4.1 Implement auth provider adapter with server-side JWT/session verification and no provider lock-in inside domain code
- [x] 4.2 Define RBAC/ABAC permission matrix for `colaborador`, `lider-setor`, `gerente-loja`, `admin-organizacao` and `auditor`
- [x] 4.3 Implement authorization guards for API routes, application use cases and mobile route access
- [x] 4.4 Add store, department and role scoping to every query that returns sensitive data
- [x] 4.5 Implement append-only audit logging for schedule, moderation, recognition, media, permission and sensitive read actions
- [x] 4.6 Add rate limiting for auth, feed posting, comments, reactions, uploads, schedule changes and feedback submissions
- [x] 4.7 Add secure error redaction and structured logging with request IDs and actor context
- [x] 4.8 Add secrets validation and prevent client exposure of server-only environment variables
- [x] 4.9 Add dependency audit, secret scan and static security checks to Turbo/CI scripts
- [x] 4.10 Add API security tests for IDOR, cross-store access, forbidden role actions, upload abuse and rate limits
- [x] 4.11 Add mobile security checklist based on OWASP MASVS expectations for storage, network, auth, platform interaction and privacy
- [x] 4.12 Implement collaborator permissions for own schedule, own requests, assigned routines, allowed feed and own rewards
- [x] 4.13 Implement sector leader permissions for FLV-scoped feed moderation, routines, schedule requests, recognition and dashboard slices
- [x] 4.14 Implement store manager permissions for store-wide dashboards, department leadership and escalated schedule approvals
- [x] 4.15 Implement organization admin permissions for organization, store, department, user, role and integration settings
- [x] 4.16 Implement auditor read-only permissions for audit logs, evidence and scoped sensitive reports
- [x] 4.17 Add permission matrix tests for every role/action/scope combination

## 5. Media Upload and Storage

- [x] 5.1 Define object storage adapter interface for private photo storage
- [x] 5.2 Implement upload intent API with permission checks, allowed MIME types, max file size and target context validation
- [x] 5.3 Implement server-generated storage keys and media metadata persistence in Neon
- [x] 5.4 Implement upload finalization with hash, dimensions, content type, owner, scope and moderation state
- [x] 5.5 Add image EXIF stripping or location metadata prevention strategy
- [x] 5.6 Add quarantine and moderation states for newly uploaded media
- [x] 5.7 Implement signed read URL or proxied media access for authorized users
- [x] 5.8 Add cleanup job or command for orphaned uploads and failed finalization records
- [x] 5.9 Add tests for invalid file type, oversized file, unauthorized upload, duplicate finalization and private media access

## 6. Premium UI/UX System

- [x] 6.1 Define the FLV visual direction with product-specific principles, color palette, spacing, typography, icon style, motion rules and photo treatment
- [x] 6.2 Implement design tokens in `packages/ui` for produce-inspired accents, neutral surfaces, status colors and accessibility-safe contrast
- [x] 6.3 Build UI primitives for text, buttons, icon buttons, inputs, cards, list rows, tabs, sheets, toasts, chips, avatars, badges and metric tiles
- [x] 6.4 Build feed-specific components for photo cards, upload composer, reaction bar, comment preview, moderation banner and post skeleton
- [x] 6.5 Build schedule-specific components for shift cards, weekly timeline, coverage indicator, request status and approval actions
- [x] 6.6 Build operations-specific components for checklists, evidence thumbnails, quality standards, issue forms and shift summaries
- [x] 6.7 Build polished loading, empty, error, offline, permission-denied and success states for every primary flow
- [x] 6.8 Add purposeful microinteractions for posting, reacting, completing checklist items, approving swaps and sending recognition
- [x] 6.9 Add accessibility labels, hit target checks, contrast checks and dynamic text handling to shared components
- [x] 6.10 Add visual QA checklist to block generic UI, text overlap, nested cards, poor hierarchy and unfinished states

## 7. Domain and Application Architecture

- [x] 7.1 Create domain entities and value objects for identity, scope, media, feed, schedule, operations, recognition and metrics
- [x] 7.2 Implement application use cases with dependency inversion and repository interfaces
- [x] 7.3 Keep domain free of React, Expo, API framework, Drizzle, storage SDKs and provider-specific auth code
- [x] 7.4 Add domain services for permission evaluation, schedule validation, reward rules, moderation decisions and feed visibility
- [x] 7.5 Add typed DTO mappers between API contracts, domain objects and database records
- [x] 7.6 Add architecture tests that fail on forbidden imports, circular dependencies and private feature imports
- [x] 7.7 Add unit tests for schedule validation, authorization policies, reward rules, moderation rules and data validation failures

## 8. Engagement Feed with Photos

- [x] 8.1 Build feed home screen with photo-first layout, pagination, virtualization, placeholders and pull-to-refresh
- [x] 8.2 Build post composer with camera/gallery selection, caption, category, mission/routine linking and upload progress
- [x] 8.3 Build API endpoints and use cases for creating, listing, updating visibility and deleting feed posts
- [x] 8.4 Build reactions with one-user policy, anti-spam limits and optimistic UI
- [x] 8.5 Build controlled comments with validation, moderation state and abuse limits
- [x] 8.6 Build leader moderation actions for approve, hide, pin, feature and remove
- [x] 8.7 Build announcements and polls inside the engagement surface
- [x] 8.8 Build private feedback flow for blockers and improvement ideas
- [x] 8.9 Link approved photo posts to missions, rewards and recognition opportunities
- [x] 8.10 Add tests for feed visibility, upload flow, moderation, reactions, comments, mission-linked posts and offline pending states

## 9. Shift Scheduling

- [x] 9.1 Build collaborator scale screen with today's shift, upcoming shifts, breaks and request status
- [x] 9.2 Build leader schedule planner with weekly view, team assignment and shift creation/editing
- [x] 9.3 Implement schedule publishing with affected-user notifications and audit logging
- [x] 9.4 Implement availability submission and leader review
- [x] 9.5 Implement time-off request submission, approval, rejection and visibility
- [x] 9.6 Implement shift swap proposal, collaborator acceptance and leader approval
- [x] 9.7 Implement coverage rules by day, period, role and FLV routine responsibility
- [x] 9.8 Highlight schedule conflicts, coverage gaps and pending approvals in leader views
- [x] 9.9 Add tests for schedule permissions, conflicts, swaps, time-off, coverage gaps and notifications

## 10. FLV Operations

- [x] 10.1 Build routine checklist screens for opening, replenishment, quality review, cleaning, labels and closing
- [x] 10.2 Connect checklist completion to shift context, responsible user, timestamp and pending-sync state
- [x] 10.3 Add required or optional photo evidence to configured checklist and issue actions
- [x] 10.4 Build quality standards library with visual references, concise instructions and related actions
- [x] 10.5 Build loss and issue logging with category, product, quantity, note, evidence and severity
- [x] 10.6 Build learning bites connected to standards, feed posts and missions
- [x] 10.7 Build shift summary with completed routines, overdue items, open issues, evidence and wins
- [x] 10.8 Add tests for checklist completion, evidence requirements, issue metrics, offline routine actions and shift summaries

## 11. Recognition and Gamification

- [x] 11.1 Implement points ledger with source, amount, actor, timestamp, reason and anti-duplication checks
- [x] 11.2 Implement badges for consistency, quality, teamwork, learning, feed participation and improvement
- [x] 11.3 Build collaborator profile with points, badges, recognition history and reward explanations
- [x] 11.4 Build healthy ranking that only shows positive eligible scores and team-progress framing
- [x] 11.5 Build peer and leader recognition flow with category, message, recipient and abuse limits
- [x] 11.6 Build feed-integrated recognition from approved posts and routine wins
- [x] 11.7 Add tests for ledger integrity, badge grants, anti-abuse limits, ranking filtering and feed-linked recognition

## 12. Leader Dashboard

- [x] 12.1 Build dashboard overview with engagement, feed, schedule, routine, issue, recognition and team progress metrics
- [x] 12.2 Add filters for date range, store, shift, team member, routine category and content type
- [x] 12.3 Build feed moderation console with pending queue and audit-visible actions
- [x] 12.4 Build schedule management console with coverage, conflicts and pending approvals
- [x] 12.5 Build content management for announcements, photo missions, polls and learning cards
- [x] 12.6 Build checklist monitoring for completion, overdue routines, unresolved issues and required evidence
- [x] 12.7 Build privacy-aware member detail with scale, engagement, completed actions and recognition history
- [x] 12.8 Build attention areas for repeated issues, coverage gaps, low engagement and overdue routines
- [x] 12.9 Add tests for dashboard filters, moderation, schedule changes, privacy boundaries and attention-area generation

## 13. Performance Engineering

- [x] 13.1 Define performance budgets for app startup, feed render, image loading, API latency, database queries and Turbo task duration
- [x] 13.2 Add list virtualization and memoization checks for feed, schedules, routines and dashboard lists
- [x] 13.3 Add image caching, thumbnail sizing, placeholders and progressive loading behavior
- [x] 13.4 Add API query profiling for feed pagination, schedule lookup, dashboard filters and permission checks
- [x] 13.5 Add database query tests or explain-plan review for critical indexed paths
- [x] 13.6 Add bundle analysis for mobile and API packages
- [x] 13.7 Add performance regression checklist to release verification
- [x] 13.8 Fix any screen, query or bundle path that violates the defined budgets

## 14. Testing, Visual QA and Release Gates

- [x] 14.1 Add integration tests for API routes, repositories, Neon adapters, storage adapters and pending sync behavior
- [x] 14.2 Add mobile component tests for feed, schedule, checklist, recognition, dashboard and all shared states
- [x] 14.3 Add smoke/e2e path for login, feed photo post, leader moderation, schedule publish, checklist completion and recognition
- [x] 14.4 Run visual QA on narrow Android, standard iPhone and tablet-width layouts where supported
- [x] 14.5 Verify no screen has generic template feel, incoherent overlap, clipped text, unreadable contrast or missing primary states
- [x] 14.6 Run accessibility checks for labels, reading order, hit targets and dynamic text on critical screens
- [x] 14.7 Run full `pnpm`/Turbo gates: lint, typecheck, unit tests, integration tests, security scans, build and visual checks
- [x] 14.8 Document production readiness gaps, provider choices still open and next-step decisions after MVP validation

## 15. Zero-Cost Development Guardrails

- [x] 15.1 Document the no-spend development provider matrix for database, auth, storage, email, analytics, CI, builds and monitoring
- [x] 15.2 Configure local filesystem or MinIO-compatible storage as the default development media adapter
- [x] 15.3 Configure Better Auth self-hosted or Neon Auth free path behind the auth adapter without paid SaaS dependency
- [x] 15.4 Configure Mailpit or console email adapter for local development notifications and auth messages
- [x] 15.5 Configure local analytics event logging instead of paid analytics during development
- [x] 15.6 Configure GitHub Actions as optional free-quota CI and keep all required gates runnable locally
- [x] 15.7 Configure Expo local development and local Android/dev builds as default, with EAS remote builds documented as optional free-quota usage
- [x] 15.8 Add environment validation that prevents accidental use of paid/metred providers unless explicitly enabled
- [x] 15.9 Add small seed media and data limits to keep Neon/R2/local storage usage below free development thresholds
- [x] 15.10 Add documentation that production app store publishing, production SLAs, exceeded free tiers or high traffic may require payment
