## ADDED Requirements

### Requirement: Modular API platform
The system SHALL provide a server-side API with separate modules for auth, feed, schedules, operations, recognition, dashboard, media and audit.

#### Scenario: API receives a feed request
- **WHEN** an authenticated client requests feed posts
- **THEN** the API validates the session, applies scope policies and returns only posts the user is authorized to see

### Requirement: Neon Postgres persistence
The system SHALL use Neon Postgres as the primary relational database for product data.

#### Scenario: Data model is migrated
- **WHEN** a schema change is introduced
- **THEN** the system applies it through a versioned migration committed to the repository

### Requirement: Drizzle schema and migrations
The system MUST define database tables, relations, indexes and migrations through Drizzle or an equivalent typed SQL migration workflow.

#### Scenario: Developer changes database schema
- **WHEN** a developer adds a new persisted entity
- **THEN** the change includes typed schema definitions and generated migration files

### Requirement: Server-side data access only
The system MUST restrict Neon database access to server-side code and controlled developer tooling.

#### Scenario: Mobile bundle is built
- **WHEN** the mobile app is bundled
- **THEN** no Neon connection string or database driver is included in the mobile artifact

### Requirement: Secure media metadata
The system SHALL store media ownership, storage key, moderation state, hash, dimensions, content type and access scope in Neon.

#### Scenario: Photo upload is finalized
- **WHEN** a photo upload is finalized successfully
- **THEN** the system stores immutable media metadata and links it to the authorized feed post, mission or evidence record

### Requirement: Audit log
The system SHALL record an audit event for sensitive actions including schedule changes, moderation, recognition, permission changes and media operations.

#### Scenario: Leader approves a shift swap
- **WHEN** a leader approves a shift swap
- **THEN** the system records actor, target, timestamp, previous state and new state in the audit log
