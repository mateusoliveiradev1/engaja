## ADDED Requirements

### Requirement: Leader command dashboard
The system SHALL provide a leader dashboard with engagement, feed, schedule, routine, issue, recognition and team progress metrics.

#### Scenario: Leader opens dashboard
- **WHEN** a leader opens the dashboard
- **THEN** the system displays current period metrics with filters for date range, team member, store, shift and routine category

### Requirement: Feed moderation console
The system SHALL allow leaders to review, approve, hide, pin and feature posts and comments.

#### Scenario: Leader approves post
- **WHEN** a leader approves a pending post
- **THEN** the post becomes visible to its authorized audience and the action is audited

### Requirement: Schedule management console
The system SHALL allow leaders to create, edit, publish and monitor FLV schedules.

#### Scenario: Leader edits published shift
- **WHEN** a leader changes a published shift
- **THEN** the system updates the schedule, audits the change and notifies affected collaborators

### Requirement: Content and challenge management
The system SHALL allow leaders to create, edit, schedule and deactivate announcements, missions, polls and learning cards.

#### Scenario: Leader schedules photo mission
- **WHEN** a leader creates a photo mission with objective, deadline, audience and reward rules
- **THEN** the system schedules the mission and makes it visible to the selected audience at the configured time

### Requirement: Checklist monitoring
The system SHALL allow leaders to monitor checklist completion, overdue routines, unresolved issues and required evidence.

#### Scenario: Checklist item is overdue
- **WHEN** a checklist item passes its due time without completion
- **THEN** the system marks it as overdue in the leader view

### Requirement: Privacy-aware member insights
The system SHALL show individual progress to leaders while avoiding public exposure of negative or sensitive performance details.

#### Scenario: Leader views member detail
- **WHEN** a leader opens a collaborator detail
- **THEN** the system displays participation, scale, completed actions and recognition history in a leader-only view

### Requirement: Decision-ready attention areas
The system SHALL surface concise attention areas based on incomplete routines, repeated issues, schedule gaps and engagement trends.

#### Scenario: Repeated issue exists
- **WHEN** the same FLV issue category appears repeatedly in the selected period
- **THEN** the system highlights it as an attention area for leadership review
