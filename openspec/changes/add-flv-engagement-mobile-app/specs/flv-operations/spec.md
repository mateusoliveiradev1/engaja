## ADDED Requirements

### Requirement: FLV routine checklists
The system SHALL provide configurable checklists for FLV routines such as opening, replenishment, quality review, cleaning, price labels and closing.

#### Scenario: Collaborator completes checklist item
- **WHEN** a collaborator marks a checklist item as complete
- **THEN** the system records item status, responsible user, completion timestamp and schedule context when available

### Requirement: Photo evidence for operations
The system SHALL support required or optional photo evidence for checklist items, issues, missions and quality reviews.

#### Scenario: Required evidence is missing
- **WHEN** a task requires photo evidence and the user submits it without a valid photo
- **THEN** the system blocks completion and explains that evidence is required

### Requirement: Quality standards library
The system SHALL provide a mobile-friendly library of FLV standards for freshness, display, handling, storage, hygiene and customer service.

#### Scenario: User opens quality standard
- **WHEN** a user opens a quality standard
- **THEN** the system displays concise instructions, visual reference area and related checklist actions

### Requirement: Loss and issue logging
The system SHALL allow collaborators to log FLV issues such as damaged products, shrink, missing labels, empty displays or blocked tasks.

#### Scenario: Collaborator logs issue
- **WHEN** a collaborator submits issue type, product/category, quantity and note
- **THEN** the system records the issue and includes it in leader operational metrics

### Requirement: Learning bites
The system SHALL provide short operational learning cards connected to real FLV routines, feed posts and missions.

#### Scenario: Collaborator finishes learning card
- **WHEN** a collaborator completes a learning card
- **THEN** the system marks completion and can award eligible engagement points

### Requirement: Shift-aware routine summary
The system SHALL summarize routine completion, open issues, pending actions and wins by shift.

#### Scenario: Leader reviews shift summary
- **WHEN** a leader opens a selected shift summary
- **THEN** the system displays completed routines, overdue items, open issues, evidence and notable wins

### Requirement: Offline-safe routine execution
The system SHALL support offline-safe routine progress for configured checklist and issue actions.

#### Scenario: Routine item is completed offline
- **WHEN** a user completes a supported routine item offline
- **THEN** the system stores it as pending sync and preserves local completion state
