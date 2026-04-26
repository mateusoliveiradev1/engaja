## ADDED Requirements

### Requirement: Points ledger
The system SHALL maintain a transparent points ledger for eligible actions such as approved feed posts, completed missions, learning cards, checklists and recognized contributions.

#### Scenario: Eligible action is completed
- **WHEN** a collaborator completes an action with configured points
- **THEN** the system adds a ledger entry with source, amount, timestamp and reason

### Requirement: Badges and achievements
The system SHALL award badges for meaningful patterns such as consistency, quality, teamwork, learning, photo participation and improvement.

#### Scenario: Badge criteria is met
- **WHEN** a collaborator satisfies all criteria for an active badge
- **THEN** the system awards the badge and shows it in the collaborator profile

### Requirement: Healthy rankings
The system SHALL provide rankings that emphasize positive progress and team goals without exposing negative performance or shaming low participation.

#### Scenario: Ranking is displayed
- **WHEN** users view a ranking
- **THEN** the system displays only eligible positive scores and excludes negative operational indicators

### Requirement: Feed-integrated recognition
The system SHALL allow leaders to transform approved feed posts or routine wins into public recognition highlights.

#### Scenario: Leader recognizes feed post
- **WHEN** a leader recognizes an approved post
- **THEN** the recognition is linked to the post and appears in the recipient's recognition history

### Requirement: Peer and leader recognition
The system SHALL allow recognition to be sent by leaders and, when enabled, by peers using configured categories.

#### Scenario: Recognition is sent
- **WHEN** a user sends recognition with recipient, category and message
- **THEN** the system records the recognition and notifies the recipient through the app experience

### Requirement: Anti-abuse limits
The system MUST apply configurable limits to points, reactions and recognition to prevent spam, favoritism or unfair score inflation.

#### Scenario: Recognition limit is reached
- **WHEN** a user reaches the configured recognition limit for a period
- **THEN** the system blocks additional recognition that would exceed the limit

### Requirement: Reward transparency
The system SHALL explain why points, badges or rewards were granted.

#### Scenario: User opens reward details
- **WHEN** a user opens a points or badge detail
- **THEN** the system displays the originating action, date and rule that granted the reward
