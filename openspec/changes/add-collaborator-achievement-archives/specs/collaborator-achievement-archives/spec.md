## ADDED Requirements

### Requirement: Unified collaborator archive
The system SHALL present a unified archive in the collaborator profile containing awarded badges, recognitions, featured posts, validated operational evidence, completed challenges and rewards.

#### Scenario: Collaborator opens profile archive
- **WHEN** a collaborator accesses their profile archive
- **THEN** the system displays chronological archive items with type, title, date and current status

### Requirement: Traceable archive details
The system SHALL explain why each archive item exists and link it to the originating challenge, post, recognition or validation action.

#### Scenario: Collaborator opens archive item detail
- **WHEN** a user opens an archive item
- **THEN** the system displays the source action, granting rule, related content reference and responsible approver when applicable

### Requirement: Reward governance visibility
The system SHALL show whether a reward is digital, pending company approval, approved for fulfillment, fulfilled or canceled.

#### Scenario: Collaborator views a real-world reward in archive
- **WHEN** a collaborator opens an archive item for a campaign reward that depends on company approval
- **THEN** the system displays the current approval or fulfillment status and does not present the reward as guaranteed before approval

### Requirement: Personal progress summary
The system SHALL show positive summary metrics derived from archive-eligible events, including active streaks, approved photo participation, validated banca contributions, challenge wins and rewards earned.

#### Scenario: Collaborator views progress summary
- **WHEN** a collaborator opens their profile home
- **THEN** the system displays current summary counters and period labels without exposing negative ranking data

### Requirement: Scoped archive visibility
The system MUST enforce role and scope permissions over archive visibility so collaborators see their own detailed archive and leaders only see archives within authorized store or department scope.

#### Scenario: Unauthorized archive access is blocked
- **WHEN** a user requests an archive outside their authorized scope
- **THEN** the system denies detailed access and records the attempt according to security policy

### Requirement: Corrected archive history
The system SHALL update archive history when source evidence is reversed, hidden or reclassified while preserving auditability of the correction.

#### Scenario: Approved source is later invalidated
- **WHEN** a previously counted post or validation is revoked
- **THEN** the system marks the affected archive item as corrected or revoked and updates impacted totals
