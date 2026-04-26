## ADDED Requirements

### Requirement: Schedule experience is scan-friendly and actionable
The escala workflow SHALL present today's work, upcoming shifts, requests, availability and leader coverage decisions with polished, mobile-first ergonomics.

#### Scenario: Collaborator views today's schedule
- **WHEN** a collaborator opens escala
- **THEN** the screen highlights today's shift, next shift, request status and useful actions without dense administrative layout

#### Scenario: Collaborator manages schedule requests
- **WHEN** a collaborator submits availability, time off or swap requests
- **THEN** the flow uses clear steps, final copy, status feedback and stable controls

#### Scenario: Leader reviews coverage
- **WHEN** a leader reviews team schedule coverage
- **THEN** the screen highlights gaps, conflicts, draft/published states and approval actions in a visually calm decision surface

### Requirement: Routine workflow supports fast floor execution
The rotina workflow SHALL make checklist completion, evidence capture, issue logging and progress status fast to scan and easy to act on.

#### Scenario: Collaborator opens routines
- **WHEN** a collaborator opens rotinas
- **THEN** the screen highlights priority routines, progress, due context and next checklist action

#### Scenario: Collaborator completes checklist item
- **WHEN** a collaborator marks an item complete or adds evidence
- **THEN** the UI confirms progress without shifting unrelated checklist rows

#### Scenario: Collaborator logs an issue
- **WHEN** a collaborator reports loss, damage, stockout, label or blocker issues
- **THEN** the form is concise, visually polished and returns a clear pending/success state

### Requirement: Recognition experience feels motivating and credible
The reconhecimento workflow SHALL feel rewarding without becoming decorative or detached from store work.

#### Scenario: Collaborator opens recognition
- **WHEN** a collaborator opens reconhecimento
- **THEN** the screen shows current progress, achievements, active campaigns, ranking and available recognition actions with polished hierarchy

#### Scenario: User sends recognition
- **WHEN** a user sends peer recognition
- **THEN** the app confirms the action, points/campaign impact and pending eligibility in clear product language

#### Scenario: User reviews archive
- **WHEN** a user opens achievement archive or campaign history
- **THEN** archived items are scannable, status-aware and visually consistent with the rest of the app

### Requirement: Leadership surfaces support decisions without dashboard clutter
Leader views SHALL surface team attention, moderation, campaigns, coverage and team actions as decision workflows, not generic metric dashboards.

#### Scenario: Leader opens overview
- **WHEN** a leader opens the leadership home
- **THEN** the screen prioritizes urgent attention areas, moderation queue, coverage gaps, routine completion and team actions

#### Scenario: Leader manages campaigns
- **WHEN** a leader opens campaigns or content management
- **THEN** campaign status, audience, schedule, reward and closure actions are visible without overwhelming the screen with raw data tables

#### Scenario: Leader moderates content
- **WHEN** a leader approves, features, hides or removes feed content
- **THEN** moderation happens in context with the post and returns clear feedback

### Requirement: Team and invite management is production-ready
The team access workflow SHALL make collaborator invitations, role/scope clarity and access states feel trustworthy and final.

#### Scenario: Authorized user opens team access
- **WHEN** a leader, manager or admin opens the time/convites surface
- **THEN** pending invites, active members, role/scope context and allowed actions are clear and visually polished

#### Scenario: User creates or resends invite
- **WHEN** an authorized user creates, resends or revokes an invite
- **THEN** the flow shows final validation, loading, success, error and permission states without exposing internal auth terms

#### Scenario: Unauthorized user opens team access
- **WHEN** a collaborator without permission reaches invite management
- **THEN** the app hides controls or shows a branded permission state according to the route context
