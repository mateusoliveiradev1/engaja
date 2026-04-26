## ADDED Requirements

### Requirement: Safe real environment setup
The project SHALL create a local `.env` with the real database values needed to run the app while keeping real secrets out of committed example files and client/mobile env files.

#### Scenario: Local environment is prepared
- **WHEN** setup runs for the real database
- **THEN** root `.env` contains the intended server-side database variables and remains ignored by Git

#### Scenario: Example env is reviewed
- **WHEN** `.env.example` files are committed
- **THEN** they contain placeholders or safe sample values instead of real database passwords or auth secrets

### Requirement: Server-only secret isolation
Database URLs, auth secrets, invite signing material and session secrets SHALL remain server-only and MUST NOT be exposed to Expo public variables or the mobile bundle.

#### Scenario: Mobile env is loaded
- **WHEN** the mobile app reads environment variables
- **THEN** it can access only public API URL values and cannot access database or auth secrets

#### Scenario: API env validation runs
- **WHEN** the API starts
- **THEN** it validates required server secrets and rejects unsafe client exposure

### Requirement: Repeatable migrations
Database migration execution SHALL apply only pending migrations against the configured Postgres/Neon database and SHALL be safe to run repeatedly.

#### Scenario: Migrations run the first time
- **WHEN** `pnpm --filter @engaja/data db:migrate` runs against the real database
- **THEN** all pending migrations are applied and recorded in migration metadata

#### Scenario: Migrations run again
- **WHEN** `pnpm --filter @engaja/data db:migrate` runs after the database is already current
- **THEN** it exits successfully without trying to recreate existing tables or constraints

### Requirement: Auth persistence schema
The database SHALL persist credentials/provider accounts, sessions, invites, optional recovery tokens and audit records needed for real authentication and invitation flows.

#### Scenario: Invite auth migration is applied
- **WHEN** the auth migration completes
- **THEN** the database contains tables and constraints for invite lifecycle, sessions and credential/provider account linkage

#### Scenario: Sensitive tokens are stored
- **WHEN** an invite, reset token or session secret is persisted
- **THEN** the database stores a hash or revocable server-side representation rather than a raw token

### Requirement: Real seed data
The seed process SHALL create a minimal operational organization with first admin, store, FLV department, roles, memberships and realistic data needed to open the app after login.

#### Scenario: Seed runs on empty database
- **WHEN** `pnpm --filter @engaja/data db:seed` runs after migrations
- **THEN** the database has a first admin and enough FLV data for collaborator and leader screens to render

#### Scenario: Seed runs repeatedly
- **WHEN** seed runs again against the same database
- **THEN** it remains idempotent or clearly reports existing records without corrupting memberships or duplicate roles

### Requirement: App uses persistent data
The API and mobile app SHALL use real persistent repositories when configured for the real database instead of development-only in-memory repositories.

#### Scenario: App starts with real database config
- **WHEN** the API starts with the real database provider selected
- **THEN** product reads and writes use persistent database-backed repositories

#### Scenario: User creates data
- **WHEN** a signed-in user creates an invite, post, routine action or schedule request
- **THEN** the data survives API restart and can be read again from the database

