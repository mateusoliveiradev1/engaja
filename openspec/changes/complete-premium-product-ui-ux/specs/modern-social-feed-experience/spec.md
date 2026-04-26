## ADDED Requirements

### Requirement: Feed opens as a social timeline
The mobile collaborator feed SHALL prioritize recent people, photos, reactions and comments before secondary operational modules.

#### Scenario: Collaborator opens the feed with posts available
- **WHEN** a collaborator opens the feed tab with at least one visible post
- **THEN** the first viewport shows a compact header, a quick posting entry point and recent social posts before long operational cards

#### Scenario: Feed has announcements and polls
- **WHEN** announcements, polls or campaigns are available together with posts
- **THEN** the feed shows them as compact priority strips, chips or secondary modules that do not push the timeline below the first social content

#### Scenario: Feed is empty
- **WHEN** no posts are visible for the collaborator scope
- **THEN** the feed shows a modern empty timeline state with a primary action to publish a photo and without implying the app is unfinished

### Requirement: Progressive post composer
The feed composer SHALL allow quick photo-first posting while keeping advanced operational fields available through progressive disclosure.

#### Scenario: Composer is collapsed
- **WHEN** the collaborator has not expanded the composer
- **THEN** the composer shows camera/gallery entry, a short caption or prompt, selected visibility/category summary and a primary publish/continue action

#### Scenario: Composer is expanded
- **WHEN** the collaborator chooses to add more context
- **THEN** the composer reveals title, category, visibility, mission, routine, points and recognition controls without changing the layout of existing feed posts

#### Scenario: Required content is missing
- **WHEN** the collaborator tries to publish without required text or photo context
- **THEN** the composer highlights the missing requirement in user-facing language and keeps the draft intact

#### Scenario: Post is submitted offline
- **WHEN** the collaborator publishes while offline
- **THEN** the composer resets after creating a pending timeline item that is visibly queued for sync

### Requirement: Social post cards
Feed posts SHALL use a modern social card pattern with stable media, clear author context, readable caption, status badges and direct interaction controls.

#### Scenario: Post has a photo
- **WHEN** a post includes photo media
- **THEN** the post card presents the photo as the dominant element with stable aspect ratio, author identity, timestamp/status context, caption and operational tags nearby

#### Scenario: Post has mission context
- **WHEN** a post is linked to a mission, routine, reward or recognition category
- **THEN** the post card shows that context as compact metadata without overwhelming the caption or reaction controls

#### Scenario: Post is pending moderation or sync
- **WHEN** a post is pending moderation, pending upload, hidden or removed
- **THEN** the post card communicates the state with clear status treatment while preserving the social layout

### Requirement: Reactions and comments feel immediate
The feed SHALL make reactions and comments feel like native social interactions with optimistic feedback, accessible controls and clear moderation states.

#### Scenario: User reacts to a post
- **WHEN** a user taps a reaction
- **THEN** the selected reaction visibly updates immediately and the count remains consistent after the API response

#### Scenario: User changes reaction
- **WHEN** a user selects a different reaction on the same post
- **THEN** the previous reaction is cleared and the new reaction is selected without duplicating counts

#### Scenario: User comments on a post
- **WHEN** a user writes and submits a comment
- **THEN** the comment appears in the thread preview with pending or visible status according to the user's role

#### Scenario: Comments are long
- **WHEN** a post has multiple or long comments
- **THEN** the feed shows a compact preview and provides an obvious path to read the full thread without clipping text

### Requirement: Leader moderation stays in the feed context
Leader moderation controls SHALL appear in context with the social post and avoid making the feed feel like an admin table.

#### Scenario: Leader views pending posts
- **WHEN** a leader opens the feed or moderation area with pending posts
- **THEN** each pending post keeps its social card layout and exposes approve, feature, hide or remove actions as compact contextual controls

#### Scenario: Collaborator views their moderated post
- **WHEN** a collaborator sees a post waiting for review
- **THEN** the post explains the review state without exposing internal moderation terminology or leader-only controls
