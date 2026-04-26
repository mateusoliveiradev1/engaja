## ADDED Requirements

### Requirement: Complete final mobile surface
The mobile app SHALL remodel every primary user-facing surface as a finished product experience, including authentication, collaborator home, leader home, feed, schedule, routines, recognition, team/invite management, loading states and protected-route states.

#### Scenario: Unauthenticated user opens the app
- **WHEN** a user opens the app without a valid session
- **THEN** the app shows the final Engaja login experience instead of entering a demo session

#### Scenario: Collaborator enters the app
- **WHEN** a collaborator signs in successfully
- **THEN** the app opens the collaborator experience with polished navigation for feed, escala, rotinas and reconhecimento

#### Scenario: Leader enters the app
- **WHEN** a leader signs in successfully
- **THEN** the app opens the leadership experience with polished navigation for painel, campanhas, moderacao, escala and time

### Requirement: Role-specific information architecture
The mobile app SHALL present different home priorities for collaborators and leaders, without exposing irrelevant controls or internal implementation details.

#### Scenario: Collaborator views daily work
- **WHEN** a collaborator opens the home screen
- **THEN** the primary hierarchy highlights today's shift, pending routines, feed activity and recognition status

#### Scenario: Leader views team work
- **WHEN** a leader opens the home screen
- **THEN** the primary hierarchy highlights team attention areas, moderation, schedule coverage, routine completion and invite/team actions

### Requirement: Product-specific FLV visual language
The UI SHALL feel specific to Engaja and FLV work through photo-forward compositions, operational density, produce/evidence context, polished action controls and brand-consistent components.

#### Scenario: User reviews feed content
- **WHEN** a user views feed posts or evidence
- **THEN** photos and operational context are visually prominent and the layout does not resemble a generic social feed template

#### Scenario: User reviews operational data
- **WHEN** a user views schedules, routines or dashboard metrics
- **THEN** information is dense enough for repeated work while remaining readable, scan-friendly and visually calm

### Requirement: Finished states for every primary flow
Every primary screen SHALL include loading, empty, error, offline, success and permission-denied states where applicable, using final copy and final visual treatment.

#### Scenario: Data is loading
- **WHEN** a screen is waiting for API data
- **THEN** it shows a polished loading state that preserves layout stability

#### Scenario: User loses connection
- **WHEN** a user is offline during a flow that can continue locally or needs retry
- **THEN** the app shows an offline state with the next available action in final user-facing language

#### Scenario: User lacks permission
- **WHEN** a user opens a route or action outside their role and scope
- **THEN** the app shows a branded permission state instead of a blank screen or technical error

### Requirement: Mobile ergonomic layout
The UI SHALL fit narrow Android, standard iPhone and wider web preview layouts without clipped text, incoherent overlap, unstable controls or hidden primary actions.

#### Scenario: Narrow mobile viewport
- **WHEN** the app is rendered on a 360px-wide mobile viewport
- **THEN** all visible text, tabs, buttons, inputs and cards remain readable and inside their containers

#### Scenario: User interacts with controls
- **WHEN** a user taps navigation tabs, inputs, icon buttons, invite actions or primary CTAs
- **THEN** controls have usable hit targets, clear pressed/disabled/loading states and no layout shift

