## ADDED Requirements

### Requirement: Full-product visual QA screenshots
The release process SHALL include visual QA screenshots for every primary product area, not only the feed.

#### Scenario: Required collaborator states are captured
- **WHEN** the collaborator experience is ready for review
- **THEN** screenshots exist for auth/login, invite/signup, feed loaded, feed empty, composer expanded, offline queued post, escala, rotinas and reconhecimento

#### Scenario: Required leader states are captured
- **WHEN** the leader experience is ready for review
- **THEN** screenshots exist for leadership overview, moderation, campaigns, schedule coverage, team/invites and permission-denied states

#### Scenario: Required viewport sizes are captured
- **WHEN** visual QA runs
- **THEN** screenshots include narrow Android width, standard iPhone width and Expo web preview width

#### Scenario: Screenshot shows visual regression
- **WHEN** any screenshot shows clipped text, overlapping UI, broken image framing, excessive blank space, weak first viewport, outdated dashboard composition or prototype-like layout
- **THEN** the change is not considered ready for implementation completion

### Requirement: End-to-end UX smoke flows
The polish pass SHALL have smoke coverage for the primary user journeys across the app.

#### Scenario: Auth and invite flow is tested
- **WHEN** smoke QA runs
- **THEN** login, invite signup, session restore, logout and invalid/expired invite states are exercised

#### Scenario: Collaborator daily flow is tested
- **WHEN** smoke QA runs as a collaborator
- **THEN** publish post, react, comment, check schedule, complete routine, add evidence, log issue and open recognition flows are exercised

#### Scenario: Leader daily flow is tested
- **WHEN** smoke QA runs as a leader
- **THEN** review overview, moderate content, inspect coverage, manage campaign context and manage team invite flows are exercised

#### Scenario: Offline flow is tested
- **WHEN** smoke QA runs with offline mode
- **THEN** queued post/comment, unavailable data and retry states remain polished and understandable

### Requirement: Modern UI acceptance checklist
The implementation SHALL pass a checklist that evaluates perceived product quality, not only functional correctness.

#### Scenario: Reviewer checks modernity
- **WHEN** a reviewer evaluates primary app surfaces
- **THEN** the UI passes checks for contemporary hierarchy, clear first viewport, polished controls, consistent spacing, purposeful color, stable media and absence of prototype-like composition

#### Scenario: Reviewer checks card usage
- **WHEN** a screen contains stacked cards or nested panels
- **THEN** each card has a clear repeated-item, modal, tool or state purpose and unnecessary card nesting is removed

#### Scenario: Reviewer checks workflow clarity
- **WHEN** a primary workflow is reviewed
- **THEN** the current context, primary action, status/result feedback and next available action are visible without relying on explanatory paragraphs

#### Scenario: Reviewer checks cross-area consistency
- **WHEN** the reviewer moves across auth, feed, escala, rotinas, reconhecimento, lideranca and time
- **THEN** the app feels like one product with one design system instead of unrelated screens

### Requirement: Copy and accessibility gates
The redesigned UI SHALL keep user-facing copy concise, localized and accessible across the full product.

#### Scenario: Copy audit runs
- **WHEN** visible app text is reviewed
- **THEN** it contains Brazilian Portuguese product language and excludes internal terms such as demo, provider, token, fallback, seed, scope or local mode

#### Scenario: Accessibility audit runs
- **WHEN** interactive controls are reviewed
- **THEN** auth, camera, gallery, reaction, comment, publish, moderation, schedule, routine, recognition and invite controls have accessible names, sufficient hit targets and visible states

#### Scenario: Dynamic text is enabled
- **WHEN** text scaling is active within supported limits
- **THEN** captions, buttons, badges, comments, forms, tabs, cards and composer fields remain usable without overlap or hidden primary actions

### Requirement: Performance and media gates
The redesigned app SHALL preserve responsive interaction, scrolling and reliable media presentation across primary flows.

#### Scenario: Timeline contains many posts
- **WHEN** the feed renders paginated posts with photos and comments
- **THEN** list virtualization and image policies keep scrolling responsive on mobile preview

#### Scenario: Operational lists contain many items
- **WHEN** schedule, routine, recognition, campaign or team lists contain many items
- **THEN** scrolling remains responsive and repeated items keep stable dimensions

#### Scenario: Image loading fails
- **WHEN** a post photo or evidence image cannot load
- **THEN** the app shows a polished fallback with stable dimensions and the surrounding workflow remains readable

#### Scenario: Progress updates
- **WHEN** upload, checklist, campaign, recognition or request progress changes
- **THEN** progress feedback updates without causing unrelated content to jump or re-render unnecessarily
