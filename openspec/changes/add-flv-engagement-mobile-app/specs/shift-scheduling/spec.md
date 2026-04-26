## ADDED Requirements

### Requirement: Shift schedule management
The system SHALL allow leaders to create, edit and publish shifts for FLV team members.

#### Scenario: Leader publishes schedule
- **WHEN** a leader publishes a weekly schedule
- **THEN** collaborators assigned to shifts can view their current and upcoming shifts

### Requirement: Collaborator schedule view
The system SHALL provide each collaborator with a clear mobile view of today's shift, upcoming shifts, breaks and pending schedule requests.

#### Scenario: Collaborator opens scale screen
- **WHEN** a collaborator opens the scale screen
- **THEN** the system displays today's shift status and the next scheduled shifts

### Requirement: Availability and time-off requests
The system SHALL allow collaborators to submit availability and time-off requests for leader review.

#### Scenario: Collaborator requests time off
- **WHEN** a collaborator submits a time-off request with date range and reason
- **THEN** the system stores the request as pending and notifies leadership for review

### Requirement: Shift swap workflow
The system SHALL support shift swap requests with collaborator proposal and leader approval.

#### Scenario: Leader approves shift swap
- **WHEN** a leader approves a valid shift swap request
- **THEN** the system updates both affected schedules and records an audit event

### Requirement: Coverage visibility
The system SHALL show leaders coverage by day, period, role and FLV routine responsibility.

#### Scenario: Schedule has coverage gap
- **WHEN** a published schedule leaves a required period uncovered
- **THEN** the system highlights the gap in the leader schedule view

### Requirement: Schedule notifications
The system SHALL notify affected users when schedules are published, changed, approved or rejected.

#### Scenario: Shift is changed
- **WHEN** a leader changes a collaborator's published shift
- **THEN** the system records the change and sends a schedule update notification
