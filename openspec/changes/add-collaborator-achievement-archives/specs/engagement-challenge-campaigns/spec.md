## ADDED Requirements

### Requirement: Configurable engagement campaigns
The system SHALL allow authorized leaders to create time-bound engagement campaigns with objective, metric type, eligibility rules, scope and reward configuration.

#### Scenario: Leader creates a photo challenge
- **WHEN** an authorized leader configures a campaign for approved photo participation
- **THEN** the system stores the campaign with its active period, eligibility scope, scoring rule and reward definition

### Requirement: Verified evidence scoring
The system MUST count only approved feed posts or validated operational evidence that match the active campaign rules.

#### Scenario: Approved banca setup increments campaign score
- **WHEN** a collaborator submits evidence that is validated for a campaign-linked banca setup objective
- **THEN** the system increments only the eligible campaign score for that collaborator

### Requirement: Campaign visibility in feed and profile
The system SHALL surface active campaigns in the feed and profile with the current rules, reward and personal progress.

#### Scenario: Collaborator views an active campaign
- **WHEN** a collaborator opens the feed or profile during an active campaign period
- **THEN** the system shows the campaign callout, reward summary and the collaborator's current progress

### Requirement: Healthy rankings
The system SHALL present campaign rankings as positive motivation by highlighting top eligible placements and the viewer's own progress without exposing lowest performers.

#### Scenario: Ranking is displayed
- **WHEN** a user opens a campaign ranking
- **THEN** the system displays top eligible positions and the viewer's standing while omitting public bottom-of-table visibility

### Requirement: Reward settlement and fulfillment tracking
The system SHALL settle campaign outcomes at the end of the campaign period, grant digital rewards automatically and track manual prize fulfillment when configured.

#### Scenario: Campaign period ends with winners
- **WHEN** an active campaign reaches its end and winners are determined
- **THEN** the system grants automatic rewards, creates manual fulfillment records when needed and shows the result in the winners' archives

### Requirement: Approved real-world reward governance
The system MUST require configured company approval before publishing or fulfilling official real-world rewards such as time off, cash-equivalent prizes or other company-backed benefits.

#### Scenario: Leader configures a folga reward
- **WHEN** a leader creates or updates a campaign with a folga reward
- **THEN** the system requires the configured approval flow before the reward is treated as an official campaign benefit

### Requirement: Informal personal reward separation
The system MUST NOT treat an informal personal reward offered off-platform by a leader as an automatic or guaranteed company obligation.

#### Scenario: Leader wants to promise a personal Pix
- **WHEN** a leader attempts to use a personal cash transfer as a campaign reward without company approval
- **THEN** the system keeps it outside official automatic reward fulfillment and does not represent it as a guaranteed company-backed prize

### Requirement: Anti-gaming controls
The system MUST enforce duplicate detection, moderation dependency, configurable caps and tie-break rules so spam or favoritism cannot inflate campaign outcomes.

#### Scenario: Repeated spam submissions do not inflate results
- **WHEN** a collaborator submits repeated or ineligible content for the same challenge objective
- **THEN** the system excludes non-eligible entries from scoring and preserves an auditable reason for the exclusion
