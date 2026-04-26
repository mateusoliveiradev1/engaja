## ADDED Requirements

### Requirement: Engaja brand identity
The product SHALL include a final Engaja brand identity with logo/wordmark, app header usage, authentication usage and app metadata usage.

#### Scenario: User opens authentication
- **WHEN** a user opens login or invite signup
- **THEN** the screen shows the final Engaja brand identity in a polished first impression

#### Scenario: User navigates authenticated screens
- **WHEN** a user is inside collaborator or leader screens
- **THEN** the brand appears consistently without consuming space needed for daily work

### Requirement: Final visual tokens
The UI package SHALL expose final product tokens for color, typography, spacing, radius, borders, elevation, state colors, photo treatment and motion timing.

#### Scenario: Component uses status feedback
- **WHEN** a component displays success, warning, danger or information feedback
- **THEN** it uses the final semantic token set with accessible contrast

#### Scenario: Component uses brand color
- **WHEN** a component uses a brand accent
- **THEN** the palette remains balanced and does not collapse into a generic single-hue theme

### Requirement: Final product copy
All visible app copy SHALL be final Brazilian Portuguese copy written for real store users, not technical placeholders, internal labels or demo language.

#### Scenario: Copy audit runs
- **WHEN** the implementation is reviewed for copy
- **THEN** visible text contains no user-facing instances of demo, local mode, provider, token, scope, fallback, seed, internal route names or unfinished placeholder text

#### Scenario: User reads a primary action
- **WHEN** a user sees a primary button or menu item
- **THEN** the label states the user action clearly in product language

### Requirement: Centralized copy review
The implementation SHALL make final copy reviewable through a small centralized copy layer or clearly grouped feature copy files.

#### Scenario: Product copy changes
- **WHEN** a label, empty state, error message or success message needs adjustment
- **THEN** the change can be made without hunting across unrelated business logic

### Requirement: Professional error and empty-state language
Errors, empty states and permission messages SHALL explain the situation and next action without leaking secrets, provider names, stack traces or authorization internals.

#### Scenario: Login fails
- **WHEN** a login attempt fails
- **THEN** the app shows a safe message that helps the user retry or recover access without revealing whether the email exists

#### Scenario: No team members exist yet
- **WHEN** a leader opens the team area before adding collaborators
- **THEN** the app explains the next invite action in polished product language

