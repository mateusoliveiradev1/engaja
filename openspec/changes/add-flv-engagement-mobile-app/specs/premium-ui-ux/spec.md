## ADDED Requirements

### Requirement: Non-generic FLV visual identity
The system SHALL use a bespoke FLV visual identity rather than a generic social feed, admin dashboard or template UI.

#### Scenario: Primary screens are reviewed
- **WHEN** the app's primary screens are visually reviewed
- **THEN** they communicate a distinct FLV operational product through layout, color, motion, imagery and component language

### Requirement: Photo-first experience
The system SHALL make real FLV photos, visual evidence and produce context first-class UI elements.

#### Scenario: User opens feed post
- **WHEN** a user opens a photo post
- **THEN** the photo, context, author, category and action affordances are clear without visual clutter

### Requirement: Complete screen states
The system MUST provide polished loading, empty, error, offline, permission-denied and success states for every primary flow.

#### Scenario: Feed has no posts
- **WHEN** a user opens an empty feed
- **THEN** the system displays a branded empty state with a clear next action appropriate to the user's role

### Requirement: Mobile accessibility
The system SHALL meet mobile accessibility expectations for labels, contrast, hit targets, reading order and dynamic text.

#### Scenario: Screen reader reads primary action
- **WHEN** a screen reader focuses a primary action
- **THEN** the system announces a meaningful accessible label and current state

### Requirement: Motion and interaction polish
The system SHALL use purposeful microinteractions for feed posting, checklist completion, schedule changes and recognition.

#### Scenario: Checklist item is completed
- **WHEN** a user completes a checklist item
- **THEN** the UI provides immediate, lightweight feedback without shifting surrounding layout unexpectedly

### Requirement: Visual QA gate
The system MUST run visual inspection for key mobile screens before release.

#### Scenario: Visual QA detects overlap
- **WHEN** a screenshot inspection detects overlapping or truncated text
- **THEN** the issue is fixed before the release can be considered complete
