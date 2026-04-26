## 1. Full-Product Audit and Target Direction

- [x] 1.1 Capture baseline screenshots for auth, invite signup, collaborator feed, escala, rotinas, reconhecimento, leader overview, moderation, campaigns, coverage, team/invites and permission states
- [x] 1.2 Audit first viewport quality for every primary screen and list where key action, urgent signal or user context is missing
- [x] 1.3 Audit `apps/mobile/src/app/screens.tsx`, `auth-screens.tsx`, `product-shell.tsx` and `team-access.tsx` for oversized sections, dashboard-like composition, nested cards and inconsistent states
- [x] 1.4 Audit `packages/ui` tokens, primitives, feature components, states, brand and copy for outdated visual patterns or gaps
- [x] 1.5 Define the target product hierarchy for collaborator, leader and unauthenticated journeys before implementation

## 2. Design System, Components and Copy Foundation

- [x] 2.1 Refine color, typography, spacing, radius, border, elevation, media and motion tokens for a modern mobile product look
- [x] 2.2 Refine buttons, icon buttons, inputs, tabs, chips, badges, cards, rows, sheets, toasts and state components for consistent premium polish
- [x] 2.3 Add or refine social components: quick composer, social post card, reaction bar, comment preview/thread, feed priority strip and inline moderation actions
- [x] 2.4 Add or refine operational components: shift summary, coverage decision card, routine checklist, evidence block, issue form, recognition card, campaign progress, ranking and invite/member row
- [x] 2.5 Centralize or normalize final app copy for auth, feed, escala, rotinas, reconhecimento, lideranca, time, errors, empty states, offline and success feedback
- [x] 2.6 Update accessibility defaults for hit targets, labels, dynamic text, focus/pressed states and reduced-motion-safe feedback

## 3. Auth, Invite and App Shell Polish

- [x] 3.1 Remodel login so brand, form hierarchy, validation, loading, error, recovery and session restore states feel final
- [x] 3.2 Remodel invite/signup flow with polished invite context, invalid/expired/revoked states, password setup and success routing
- [x] 3.3 Refine protected route, forbidden, restoring session and logout states with final visual treatment and copy
- [x] 3.4 Refine collaborator and leader navigation shells so tabs, badges, headers, offline state and role context feel consistent
- [x] 3.5 Verify unauthenticated, collaborator, leader, manager, admin and forbidden paths do not expose demo/internal copy

## 4. Social Feed and Posting Experience

- [x] 4.1 Split feed UI from oversized screen code into focused modules where useful while preserving existing feed state/service behavior
- [x] 4.2 Reorder collaborator feed so compact header, quick composer and recent posts appear before secondary operational modules
- [x] 4.3 Wire quick composer collapsed/expanded states to existing validation, upload progress, offline queue, draft reset and post creation behavior
- [x] 4.4 Replace current post rendering with social post cards, polished media handling, metadata, status badges, reaction controls and comment previews
- [x] 4.5 Convert announcements, polls, campaigns, achievement progress and feedback prompt into compact feed-supporting modules
- [x] 4.6 Apply the social post pattern to leader moderation without turning posts into admin rows
- [x] 4.7 Verify feed empty, loading, error, offline, pending sync, pagination and refresh states feel complete and do not duplicate posts

## 5. Collaborator Operational Workflows

- [x] 5.1 Remodel escala collaborator view around today's shift, next shift, request statuses and quick actions
- [x] 5.2 Polish availability, time-off and swap request flows with clear steps, validation, loading, success and error states
- [x] 5.3 Remodel rotinas collaborator view around priority routines, checklist progress, evidence capture and issue logging
- [x] 5.4 Polish checklist completion, evidence thumbnail/fallback, issue severity/category selection and pending sync feedback
- [x] 5.5 Remodel reconhecimento collaborator view with achievement archive, active campaigns, ranking, reward status and send-recognition action
- [x] 5.6 Verify collaborator empty/offline/error states across escala, rotinas and reconhecimento preserve the next useful action

## 6. Leader, Campaigns, Moderation and Team UX

- [x] 6.1 Remodel leader overview around urgent attention areas, moderation queue, coverage gaps, routine completion and team actions
- [x] 6.2 Polish leader campaigns/content views with campaign status, audience, reward, schedule and closure actions
- [x] 6.3 Polish moderation controls for approve, feature, hide, remove and visibility with contextual feedback and permission handling
- [x] 6.4 Remodel coverage/planner surfaces so schedule gaps, conflicts, draft/published states and approvals are decision-focused
- [x] 6.5 Remodel team/invite management with polished member rows, pending invites, role/scope clarity, create/resend/revoke flows and permission states
- [x] 6.6 Verify leader/manager/admin differences are visible where needed and hidden where irrelevant

## 7. Interaction, Data State and Regression Tests

- [x] 7.1 Update feed state tests for reaction switching, optimistic comment insertion, pending sync counts and page merging
- [x] 7.2 Add component or flow tests for quick composer, social post card, comments and moderation actions
- [x] 7.3 Add or update smoke coverage for login, invite signup, session restore, logout and forbidden state
- [x] 7.4 Add or update smoke coverage for collaborator feed, schedule request, routine completion, issue logging and recognition action
- [x] 7.5 Add or update smoke coverage for leader overview, moderation, coverage, campaign and invite management flows
- [x] 7.6 Verify dynamic text, long names, long captions, long comments and long button labels across all remodeled surfaces
- [x] 7.7 Verify image/media fallback and stable dimensions for feed photos, evidence thumbnails and visual cards

## 8. Visual QA and Release Gates

- [x] 8.1 Run visual QA screenshots for auth/login, invite/signup, feed, escala, rotinas, reconhecimento, leader overview, moderation, campaigns, coverage, team/invites and permission states
- [x] 8.2 Capture QA at narrow Android width, standard iPhone width and Expo web preview width
- [x] 8.3 Run copy audit across the app and remove visible terms such as demo, provider, token, fallback, seed, scope and local mode
- [x] 8.4 Run accessibility audit for labels, hit targets, contrast, dynamic text and reduced-motion-safe feedback
- [x] 8.5 Run performance sanity checks for feed pagination, operational lists, media loading and progress updates
- [x] 8.6 Run `pnpm lint`, `pnpm typecheck` and relevant mobile/UI/API tests
- [x] 8.7 Record non-secret QA notes and remaining known issues before marking the product polish pass complete
