## ADDED Requirements

### Requirement: Visual QA gate
The change SHALL include a visual QA gate that reviews the final app screens for generic UI, broken hierarchy, clipped text, overlap, missing states and unfinished copy.

#### Scenario: Visual QA runs
- **WHEN** visual QA captures login, invite signup, collaborator home, leader home and team invite screens
- **THEN** the review passes only if the screens look like a finished Engaja product and have no incoherent layout defects

### Requirement: Auth and invite smoke test
The change SHALL include a smoke test or equivalent verification for login, invite creation, invite acceptance, session restoration and logout.

#### Scenario: Invite-to-login flow is verified
- **WHEN** a leader invites a collaborator and the collaborator accepts the invite
- **THEN** the collaborator can sign in, reach the collaborator home and keep the session across app reload

#### Scenario: Logout flow is verified
- **WHEN** the signed-in user logs out
- **THEN** protected screens are inaccessible until the user signs in again

### Requirement: Database readiness gate
The change SHALL verify real database connectivity, pending-only migrations, seed data and persistent app reads before considering implementation complete.

#### Scenario: Database gate runs
- **WHEN** database readiness verification runs
- **THEN** it confirms migrations are current, seed data exists and API health does not print secrets

### Requirement: Accessibility and mobile usability gate
The final UI SHALL pass basic accessibility and mobile usability checks for contrast, labels, reading order, focus/keyboard behavior where applicable and tap target sizing.

#### Scenario: Critical auth controls are checked
- **WHEN** login, signup and invite controls are reviewed
- **THEN** inputs, errors, buttons and links have clear labels and usable touch targets

#### Scenario: Critical app screens are checked
- **WHEN** collaborator and leader home screens are reviewed
- **THEN** status, navigation and primary actions remain accessible and readable

### Requirement: Secret and environment gate
The change SHALL verify that real credentials are not committed, not exposed in public env, not printed in logs and not bundled into the mobile app.

#### Scenario: Secret scan runs
- **WHEN** the security secret scan runs
- **THEN** it fails if database URLs, auth secrets, invite secrets or session secrets appear in tracked examples, source code, logs or public client config

### Requirement: Standard quality gates
The implementation SHALL pass the repo's standard lint, typecheck, tests, build, security and visual scripts or document any unavailable command with a concrete blocker.

#### Scenario: Quality commands run
- **WHEN** implementation verification runs
- **THEN** `pnpm lint`, `pnpm typecheck`, `pnpm test`, database migration/seed checks and visual QA complete successfully or report a specific blocker

