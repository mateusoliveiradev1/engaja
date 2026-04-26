## ADDED Requirements

### Requirement: Every primary mobile journey feels complete
The mobile app SHALL refine all primary user journeys so they feel like a finished, modern product rather than a prototype, dashboard or technical demo.

#### Scenario: User opens authentication
- **WHEN** an unauthenticated user opens login, invite or signup screens
- **THEN** the app presents polished brand identity, concise copy, clear form states, recovery/invalid invite handling and no placeholder or internal wording

#### Scenario: Collaborator enters the app
- **WHEN** a collaborator signs in successfully
- **THEN** the app presents a cohesive collaborator experience across feed, escala, rotinas and reconhecimento with consistent navigation and visual hierarchy

#### Scenario: Leader enters the app
- **WHEN** a leader, manager or admin signs in successfully
- **THEN** the app presents a cohesive leadership experience across painel, campanhas, moderacao, escala and time with clear priority actions

#### Scenario: User lacks permission
- **WHEN** a user reaches a route or action outside their role or scope
- **THEN** the app shows a branded permission state with an appropriate next action and without blank screens or raw technical errors

### Requirement: First viewport carries immediate value
Every primary screen SHALL use its first viewport to show the user's current context, the most important signal and the primary action.

#### Scenario: Collaborator opens a work screen
- **WHEN** a collaborator opens feed, escala, rotinas or reconhecimento
- **THEN** the first viewport makes the next useful action visible without requiring the user to scroll past long explanatory content

#### Scenario: Leader opens a management screen
- **WHEN** a leader opens painel, moderacao, escala, campanhas or time
- **THEN** the first viewport shows the most urgent team signal and the next decision/action

#### Scenario: Screen has secondary modules
- **WHEN** secondary modules such as tips, summaries, archives or explanatory copy are present
- **THEN** they do not displace the primary action or current operational state from the first useful viewport

### Requirement: Cross-surface consistency
The app SHALL use a consistent product language, component rhythm and interaction model across all surfaces.

#### Scenario: User moves between tabs
- **WHEN** a user moves between feed, escala, rotinas, reconhecimento and leadership tabs
- **THEN** navigation, spacing, buttons, cards, tabs, chips, states and icon actions remain consistent and recognizable

#### Scenario: Data is unavailable
- **WHEN** any primary screen is loading, empty, offline, errored or successful
- **THEN** the state uses final visual treatment, final copy and stable layout dimensions

#### Scenario: User completes an action
- **WHEN** a user posts, comments, requests schedule changes, completes routines, sends recognition, moderates content or manages invites
- **THEN** the app confirms the result with consistent success, pending, error or offline feedback

### Requirement: No visible demo or internal product residue
The mobile experience SHALL remove visible placeholder, demo, implementation and internal terminology from user-facing surfaces.

#### Scenario: Copy audit reviews primary screens
- **WHEN** visible text is reviewed across auth, feed, escala, rotinas, reconhecimento, lideranca, time and states
- **THEN** no user-facing copy includes terms such as demo, fallback, seed, provider, token, scope, local mode or implementation-only phrasing

#### Scenario: Technical error occurs
- **WHEN** an API, session, permission or network error appears in the UI
- **THEN** the message explains the user-facing impact and next action without leaking internal details
