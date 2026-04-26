## ADDED Requirements

### Requirement: Photo-first engagement feed
The system SHALL provide a moderated engagement feed where authorized users can publish FLV-related posts with photos, captions, categories and optional links to missions or routines.

#### Scenario: Collaborator publishes photo post
- **WHEN** a collaborator submits a valid photo, caption and category
- **THEN** the system creates a feed post in pending or published state according to moderation rules

### Requirement: Secure photo upload
The system MUST upload feed photos through a server-approved upload intent with file validation and private storage.

#### Scenario: User requests upload intent
- **WHEN** a user requests to upload a feed photo
- **THEN** the API validates permission, allowed file type and size before returning an upload mechanism

### Requirement: Feed interactions
The system SHALL allow configured reactions and comments on feed posts without exposing negative or abusive interaction patterns.

#### Scenario: User reacts to post
- **WHEN** a user reacts to a visible post
- **THEN** the system stores one reaction per configured reaction type policy for that user and post

### Requirement: Feed moderation
The system SHALL allow leaders to approve, hide, pin, feature or remove feed posts and comments.

#### Scenario: Leader hides post
- **WHEN** a leader hides a post
- **THEN** the post is removed from normal feed visibility and the action is recorded in the audit log

### Requirement: Mission-linked posts
The system SHALL allow posts to be linked to missions, challenges, checklists or quality standards.

#### Scenario: User completes photo challenge
- **WHEN** a user publishes an approved post linked to an active photo mission
- **THEN** the mission completion is updated and eligible rewards can be evaluated

### Requirement: Announcements and polls
The system SHALL support leader announcements and quick polls inside the engagement experience.

#### Scenario: Collaborator acknowledges announcement
- **WHEN** a collaborator marks an announcement as read
- **THEN** the system records the acknowledgement and removes it from required pending actions

### Requirement: Feed performance
The system MUST keep the feed responsive with pagination, virtualization, image placeholders and cached media metadata.

#### Scenario: Feed contains many posts
- **WHEN** the user scrolls through a large feed
- **THEN** the system renders only the necessary visible items and avoids blocking interactions with full-size images

### Requirement: Private feedback
The system SHALL let collaborators send private feedback about blockers, ideas or routines to leadership.

#### Scenario: Collaborator sends feedback
- **WHEN** a collaborator submits feedback with category and message
- **THEN** the system stores it for leader review without publishing it to the feed
