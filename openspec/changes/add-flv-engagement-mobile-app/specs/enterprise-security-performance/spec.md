## ADDED Requirements

### Requirement: Enterprise authorization matrix
The system MUST define and test an authorization matrix for collaborator, leader, admin and future auditor roles.

#### Scenario: Unauthorized user requests protected record
- **WHEN** a user requests a record outside their role, store or department scope
- **THEN** the system denies access without revealing whether the record exists

### Requirement: Named RBAC roles
The system SHALL define named roles for `colaborador`, `lider-setor`, `gerente-loja`, `admin-organizacao` and `auditor`.

#### Scenario: Role permissions are loaded
- **WHEN** the authorization module initializes
- **THEN** it exposes the named roles with documented permissions and scope constraints

### Requirement: Collaborator permissions
The system SHALL allow collaborators to access only their allowed feed, own schedule, assigned routines, own requests, own rewards and permitted recognition actions.

#### Scenario: Collaborator edits schedule
- **WHEN** a collaborator attempts to edit a published schedule directly
- **THEN** the system denies the action and offers request-based flows where available

### Requirement: Sector leader permissions
The system SHALL allow sector leaders to manage FLV-scoped feed moderation, routines, checklists, shift summaries, recognition and schedule requests within their store and department scope.

#### Scenario: Sector leader accesses another department
- **WHEN** a sector leader requests another department's restricted operational data
- **THEN** the system denies access unless an explicit additional scope grants it

### Requirement: Store manager permissions
The system SHALL allow store managers to manage store-wide dashboards, department leaders, escalated schedule approvals and store-scoped reports.

#### Scenario: Store manager assigns sector leader
- **WHEN** a store manager assigns a user as sector leader within their store
- **THEN** the system applies the role within that store scope and records an audit event

### Requirement: Organization admin permissions
The system SHALL allow organization admins to manage organizations, stores, departments, global settings, users, roles and integration settings.

#### Scenario: Admin creates store
- **WHEN** an organization admin creates a new store
- **THEN** the system stores the store under the admin's organization and records an audit event

### Requirement: Auditor permissions
The system SHALL allow auditors read-only access to audit logs, evidence and sensitive reports according to explicit scope.

#### Scenario: Auditor attempts mutation
- **WHEN** an auditor attempts to modify a schedule, post, user or setting
- **THEN** the system denies the mutation and records a security event

### Requirement: Database row protection
The system SHALL enforce tenant, store and department scoping at the API layer and with database row-level protection where practical.

#### Scenario: Cross-store query is attempted
- **WHEN** a user from one store attempts to access another store's scoped data
- **THEN** the system blocks the query and records a security event

### Requirement: Secure upload controls
The system MUST validate uploaded files with allowlisted types, size limits, server-generated names and private storage.

#### Scenario: User uploads invalid file
- **WHEN** a user attempts to upload an unsupported or oversized file
- **THEN** the system rejects the upload before publishing any media record

### Requirement: Security auditability
The system SHALL produce redacted structured logs and audit records for sensitive actions.

#### Scenario: Permission is changed
- **WHEN** a user's role or scope is changed
- **THEN** the system records actor, target, previous value, new value and timestamp

### Requirement: Clean code and SOLID gates
The system MUST enforce architecture boundaries, linting, typechecking and tests before a change is considered complete.

#### Scenario: Feature imports forbidden layer
- **WHEN** a feature imports a forbidden internal module or infrastructure layer
- **THEN** the quality gate fails

### Requirement: Performance budgets
The system SHALL define and verify performance budgets for mobile startup, feed scrolling, image loading, API latency and CI build tasks.

#### Scenario: Feed performance budget fails
- **WHEN** feed rendering exceeds the defined budget during verification
- **THEN** the release is blocked until the regression is fixed or explicitly accepted

### Requirement: Dependency and secret scanning
The system MUST scan dependencies and source files for known vulnerabilities and leaked secrets.

#### Scenario: Secret is committed
- **WHEN** a secret scanning tool detects a credential in source control
- **THEN** the quality gate fails and the credential must be rotated
