## ADDED Requirements

### Requirement: Mobile platform shell
The system SHALL provide an Expo mobile shell with authenticated navigation, role-aware route groups, shared providers and stable feature entry points.

#### Scenario: Collaborator opens the app
- **WHEN** an authenticated collaborator opens the app
- **THEN** the system displays the collaborator home with feed, scale, routines, missions and recognition access

#### Scenario: Leader opens the app
- **WHEN** an authenticated leader opens the app
- **THEN** the system displays leader navigation for dashboard, feed moderation, schedules, routines, content and recognition

### Requirement: Protected route access
The system MUST enforce route protection before rendering restricted screens.

#### Scenario: Collaborator attempts leader route
- **WHEN** a collaborator navigates to a leader-only route
- **THEN** the system blocks the route and displays an allowed fallback without exposing leader data

### Requirement: No direct database access from mobile
The mobile app MUST NOT contain Neon connection strings, database credentials or direct database clients.

#### Scenario: Mobile app requests data
- **WHEN** the mobile app needs feed, schedule, routine or recognition data
- **THEN** it requests the data through the API contract instead of connecting directly to Neon

### Requirement: Modular mobile boundaries
The system MUST keep app shell, feed, scheduling, operations, gamification and leader features behind explicit public module exports.

#### Scenario: Feature consumes another capability
- **WHEN** one feature needs behavior owned by another capability
- **THEN** it consumes a public contract or use case instead of importing private implementation files

### Requirement: Offline and pending sync states
The system SHALL preserve the last known core experience and clearly mark pending actions when connectivity is weak or unavailable.

#### Scenario: User submits action offline
- **WHEN** a supported action is submitted offline
- **THEN** the system stores it as pending and shows a visible pending-sync state

### Requirement: Mobile observability
The system SHALL emit structured client events and recoverable error reports for critical app flows.

#### Scenario: Feed screen fails to load
- **WHEN** the feed request fails
- **THEN** the system logs a redacted error event and displays a recoverable UI state
