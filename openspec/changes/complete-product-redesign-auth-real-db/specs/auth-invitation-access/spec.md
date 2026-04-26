## ADDED Requirements

### Requirement: Real authentication gate
The app SHALL require a verified server-backed session for protected product areas and SHALL NOT start authenticated users through a default demo session.

#### Scenario: No session exists
- **WHEN** the app launches without a stored valid session
- **THEN** protected collaborator and leader routes redirect to login

#### Scenario: Invalid session exists
- **WHEN** the app launches with an expired, revoked or invalid session
- **THEN** the app clears local session state and shows login

### Requirement: Login with durable session
Users SHALL sign in with real credentials or a provider-backed auth adapter, and the mobile app SHALL store only the returned session token in secure mobile storage.

#### Scenario: Valid credentials submitted
- **WHEN** a user submits valid login credentials
- **THEN** the API returns a session and the app opens the correct role-based home screen

#### Scenario: Invalid credentials submitted
- **WHEN** a user submits invalid login credentials
- **THEN** the API rejects the attempt, applies auth rate limits and the app shows a safe final error message

### Requirement: Invite creation by authorized users
Authorized leaders, managers and admins SHALL be able to create collaborator access invites with email, role, organization, store, department and expiration.

#### Scenario: Leader invites collaborator
- **WHEN** a leader creates an invite inside their allowed department scope
- **THEN** the system stores a pending invite and makes the invite delivery action available

#### Scenario: Collaborator tries to invite
- **WHEN** a collaborator attempts to create an invite
- **THEN** the system denies the action and records a safe authorization result

### Requirement: Invite token security
Invite tokens SHALL be single-use, expiring and stored only as hashed values in the database.

#### Scenario: Invite is accepted
- **WHEN** an invited user completes signup with a valid pending invite
- **THEN** the invite is marked used and cannot be reused

#### Scenario: Invite is expired or revoked
- **WHEN** a user opens an expired or revoked invite
- **THEN** the app blocks account creation and shows a final recovery path

### Requirement: Signup from invite
Signup SHALL be available only through a valid invite or controlled first-admin bootstrap flow.

#### Scenario: Invited collaborator signs up
- **WHEN** a collaborator accepts a valid invite and submits required account details
- **THEN** the system creates or links the user, credential, membership and role scope atomically

#### Scenario: User opens signup without invite
- **WHEN** a user opens signup without a valid invite
- **THEN** the app explains that access must be sent by an authorized team leader or admin

### Requirement: Invite management
Authorized users SHALL be able to view pending invites, resend delivery, revoke pending invites and see accepted invite status inside the team area.

#### Scenario: Leader revokes invite
- **WHEN** a leader revokes a pending invite inside their scope
- **THEN** the invite can no longer be accepted

#### Scenario: Leader resends invite
- **WHEN** a leader resends a pending invite
- **THEN** the system records the resend and presents the delivery result without exposing raw token storage details

### Requirement: Session lifecycle
The app SHALL support session restoration, logout and role-aware route changes using the server session as the source of truth.

#### Scenario: User logs out
- **WHEN** a user taps logout
- **THEN** the app invalidates or forgets the session, clears secure local storage and returns to login

#### Scenario: Role changes server-side
- **WHEN** a user's role or membership changes on the server
- **THEN** the next session refresh routes the user according to the updated permissions

