## ADDED Requirements

### Requirement: Zero-cost development path
The system SHALL provide a documented development path that does not require paid plans, paid seats or paid infrastructure.

#### Scenario: Developer starts the project locally
- **WHEN** a developer follows the local setup documentation
- **THEN** the app, API, database fallback, storage fallback, auth flow and tests can run without paid services

### Requirement: Free-tier provider matrix
The system SHALL document every external provider used in development with its free option, limits, fallback and cost risk.

#### Scenario: Provider has possible overage
- **WHEN** a development provider can generate paid usage beyond its free tier
- **THEN** the documentation includes a no-cost fallback and a guardrail to avoid accidental charges

### Requirement: Neon free development usage
The system SHALL support Neon Free for shared development and demos while also supporting local Postgres fallback.

#### Scenario: Neon free limit is a concern
- **WHEN** a developer does not want to risk using Neon free-tier capacity
- **THEN** the system can run against local Postgres with the same migrations and seed data

### Requirement: Free auth strategy
The system SHALL use an auth adapter that can run with a free or open-source provider during development.

#### Scenario: Paid auth service is unavailable
- **WHEN** no paid auth provider is configured
- **THEN** the system uses the configured free auth path without changing domain or application code

### Requirement: Free media development storage
The system SHALL support local filesystem or MinIO-compatible development storage before any paid object storage dependency.

#### Scenario: Developer uploads test photo locally
- **WHEN** a developer uploads a photo in local mode
- **THEN** the file is stored in the local storage adapter and metadata is stored in the configured database

### Requirement: Cost guardrails
The system MUST prevent accidental paid usage in development by default.

#### Scenario: Paid provider variable is missing
- **WHEN** paid or metered provider credentials are not configured
- **THEN** the system uses local/free adapters instead of failing into a paid service

### Requirement: Free CI fallback
The system SHALL allow all quality gates to run locally and optionally in free CI quotas.

#### Scenario: CI quota is exhausted
- **WHEN** hosted CI quota is exhausted or disabled
- **THEN** developers can run the same required gates locally with pnpm and Turborepo

### Requirement: Development cost disclaimer
The system MUST distinguish zero-cost development from production publishing or high-traffic operation.

#### Scenario: User reviews deployment notes
- **WHEN** deployment documentation is opened
- **THEN** it states that app store publication, production SLAs, high usage, paid runners or exceeded free tiers may require payment
