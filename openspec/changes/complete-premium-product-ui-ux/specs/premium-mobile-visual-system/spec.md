## ADDED Requirements

### Requirement: Contemporary mobile visual direction
The mobile UI SHALL feel like a polished contemporary app with clear hierarchy, restrained surfaces, purposeful color and FLV-specific media treatment.

#### Scenario: User opens a primary mobile screen
- **WHEN** a user opens feed, escala, rotinas, reconhecimento, login or leadership surfaces
- **THEN** the screen uses consistent Engaja visual language, modern spacing, readable hierarchy and no generic dashboard or starter-template appearance

#### Scenario: Screen uses brand colors
- **WHEN** brand colors appear in a screen
- **THEN** the palette balances neutral surfaces, fresh produce accents and status colors without becoming a one-note green, beige or dark dashboard theme

#### Scenario: Screen includes photos or evidence
- **WHEN** a screen includes post photos, evidence thumbnails or produce-related media
- **THEN** the media has stable dimensions, visible subject matter and surrounding context that reinforces FLV work

### Requirement: Social UI components
The shared native UI package SHALL provide reusable social-feed components for post cards, quick composer, reaction controls, comments and priority strips.

#### Scenario: Feed renders a post
- **WHEN** the feed renders a timeline item
- **THEN** it uses a shared social post component rather than ad hoc nested card blocks

#### Scenario: Feed renders reactions
- **WHEN** reactions are shown for a post
- **THEN** they use a shared reaction control with selected, pressed, disabled and count states

#### Scenario: Feed renders comments
- **WHEN** comments are previewed under a post
- **THEN** they use a shared comment preview or thread component with wrapping text and stable spacing

#### Scenario: Feed renders urgent secondary content
- **WHEN** announcements, polls, campaigns or feedback prompts need attention
- **THEN** they can appear in a shared priority strip or compact module that does not dominate the timeline

### Requirement: Operational UI components
The shared native UI package SHALL provide reusable operational components for schedule, routine, recognition, leadership and team management surfaces.

#### Scenario: Schedule surface renders shifts
- **WHEN** shift cards, coverage indicators, request statuses or planner issues are displayed
- **THEN** they use consistent operational components with stable dimensions, clear status colors and readable hierarchy

#### Scenario: Routine surface renders checklists
- **WHEN** checklist items, evidence thumbnails, progress indicators or issue forms are displayed
- **THEN** they use consistent components that support fast scanning and touch-friendly completion

#### Scenario: Recognition surface renders achievements
- **WHEN** achievements, campaigns, rankings, rewards or recognition actions are displayed
- **THEN** they use polished components that feel motivating while staying tied to work outcomes

#### Scenario: Team surface renders access controls
- **WHEN** users, invites, roles, scopes or access states are displayed
- **THEN** they use consistent rows, badges, actions and permission states without exposing internal terms

### Requirement: Product copy system
The shared UI and mobile app SHALL use consistent Brazilian Portuguese copy for actions, states, errors and success feedback across the whole product.

#### Scenario: User sees repeated states
- **WHEN** loading, empty, error, offline, success, permission or pending states appear in different areas
- **THEN** the wording follows the same tone and does not sound technical or temporary

#### Scenario: User sees a primary action
- **WHEN** buttons or icon actions appear in auth, feed, escala, rotinas, reconhecimento, lideranca or time
- **THEN** labels are concise, action-oriented and understandable without extra instructional paragraphs

### Requirement: Native-feeling controls and icons
Interactive controls SHALL look and behave like mobile app controls rather than text-heavy administrative buttons.

#### Scenario: User sees a common action
- **WHEN** actions such as camera, gallery, reaction, comment, send, more, moderate, close or expand are available
- **THEN** the UI uses recognizable icon or icon-plus-label controls with accessible labels

#### Scenario: User presses a control
- **WHEN** the user presses buttons, chips, reaction controls or icon actions
- **THEN** the control shows contained pressed, loading, disabled and success/error feedback without moving surrounding layout

#### Scenario: Control text is long
- **WHEN** a label or user-generated text is longer than expected
- **THEN** the control wraps, truncates or resizes within defined bounds without overlapping adjacent content

### Requirement: Stable responsive composition
The mobile visual system SHALL define stable sizes and responsive constraints for fixed-format UI elements.

#### Scenario: Narrow Android viewport
- **WHEN** the app renders at 360px width
- **THEN** feed cards, composer controls, tabs, badges, buttons and comments remain readable and inside their containers

#### Scenario: Web preview viewport
- **WHEN** the Expo web preview renders the mobile app on a wider viewport
- **THEN** content remains constrained, balanced and free from stretched cards or awkward empty bands

#### Scenario: Data changes after interaction
- **WHEN** reaction counts, upload progress, pending states or comments update
- **THEN** the layout remains stable and does not shift unrelated content unexpectedly

### Requirement: Motion and feedback polish
The UI SHALL use small, purposeful microinteractions for social feedback without compromising performance or accessibility.

#### Scenario: User reacts to content
- **WHEN** the user selects a reaction
- **THEN** the selected state uses a compact visual emphasis that confirms the action

#### Scenario: User publishes a post
- **WHEN** the user starts and completes post submission
- **THEN** the UI shows progress, queued/success feedback and final placement in the timeline

#### Scenario: User prefers reduced motion
- **WHEN** the platform or runtime indicates reduced motion should be respected
- **THEN** the UI preserves state feedback without relying on large animation
