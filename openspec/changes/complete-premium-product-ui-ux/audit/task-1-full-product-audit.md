# Task 1 - Full-Product Audit and Target Direction

Date: 2026-04-24
Change: `complete-premium-product-ui-ux`

This audit establishes the baseline before implementation. Screenshots were captured from the Expo web preview at `http://localhost:8081` with non-secret local mock sessions injected through the browser runtime. Product data calls were intentionally forced into the existing mobile demo fallback so every protected route could render without adding QA-only app code or requiring persisted credentials.

## Baseline Screenshot Inventory

Screenshots live in `openspec/changes/complete-premium-product-ui-ux/audit/screenshots/baseline-2026-04-24`.

| Surface | Narrow mobile | Wide web preview |
| --- | --- | --- |
| Auth login | `auth-login-narrow.png` | `auth-login-wide.png` |
| Invite signup | `invite-signup-narrow.png` | `invite-signup-wide.png` |
| Collaborator feed | `collaborator-feed-narrow.png` | `collaborator-feed-wide.png` |
| Collaborator escala | `collaborator-escala-narrow.png` | `collaborator-escala-wide.png` |
| Collaborator rotinas | `collaborator-rotinas-narrow.png` | `collaborator-rotinas-wide.png` |
| Collaborator reconhecimento | `collaborator-reconhecimento-narrow.png` | `collaborator-reconhecimento-wide.png` |
| Leader overview | `leader-overview-narrow.png` | `leader-overview-wide.png` |
| Leader campaigns | `leader-campaigns-narrow.png` | `leader-campaigns-wide.png` |
| Leader moderation | `leader-moderation-narrow.png` | `leader-moderation-wide.png` |
| Leader coverage | `leader-coverage-narrow.png` | `leader-coverage-wide.png` |
| Leader team/invites | `leader-team-invites-narrow.png` | `leader-team-invites-wide.png` |
| Permission state | `permission-denied-leader-as-collaborator-narrow.png` | `permission-denied-leader-as-collaborator-wide.png` |

## First Viewport Audit

| Surface | Baseline read | Missing or weak in first viewport | Direction |
| --- | --- | --- | --- |
| Auth login | Brand, title, email/password and CTA are visible on narrow. | Recovery is a secondary card below the fold; validation text appears before the user acts. | Keep form-first, reduce decorative header height, make recovery a quieter inline action. |
| Invite signup | Invite received state is polished and CTA is visible. | The actual account fields start below the state card; invalid/expired context is not visible until scrolling. | Merge invite context with the first form step and show invalid/expired as state variants, not an extra bottom card. |
| Collaborator feed | Shell, metrics, tabs and composer appear before posts. | Recent social posts are not visible in the first viewport; metrics dominate over people/photos. | Compact the header, show quick composer and first post before secondary modules or large metrics. |
| Collaborator escala | Current tab and first schedule section appear near the fold. | Today's shift starts low because global metrics/tabs consume the top. | Put today's shift, next shift and request status immediately under a compact tab header. |
| Collaborator rotinas | Active tab and routine summary are visible. | The next checklist action is below metrics and routine selector. | Promote active routine progress, first checklist action and evidence/issue action above metrics. |
| Collaborator reconhecimento | Recognition tab renders but starts with metric grids. | Motivation/action is delayed; archive and ranking language feels administrative. | Lead with current progress, active campaign, reward status and send-recognition CTA. |
| Leader overview | Campaign CTA, metrics and tabs are visible. | Urgent decision panel begins below the fold; first viewport reads like a dashboard. | Lead with urgent attention queue and next decision, then supporting metrics. |
| Leader campaigns | Campaign tab is reachable and capture shows shell. | Campaign creation/list context starts below the shared metrics; "fulfillment" copy appears later. | Show campaign status, active campaign and close/review action before create form details. |
| Leader moderation | Moderation tab is reachable and success/pending state is visible below fold. | Queue status is below shell; no post context appears in first viewport when pending count is zero. | Keep social post cards, but make queue count/status and action cluster the first useful block. |
| Leader coverage | Coverage tab is reachable; planner content begins below fold. | Gaps/conflicts are not the first visible leadership signal. | Surface primary coverage alert, draft/published state and approval action first. |
| Leader team/invites | Team tab reaches invite form and active members on wide. | Invite management begins below dashboard chrome; scope copy is technical. | Start with pending invites/member rows and clear allowed action, then role/scope details. |
| Permission state | Branded state is visible and no data leaks. | Copy is verbose and repeats the title; button treatment is danger-heavy. | Use one concise reason and one recovery action with role-aware copy. |

## Source Audit: `apps/mobile/src/app`

- `apps/mobile/src/app/screens.tsx` is the main risk surface at roughly 6k+ lines. It owns route composition, tab state, service calls, forms, cards, status copy and many formatting helpers in one file. Key panels start at `CollaboratorHomeScreen` (`screens.tsx:193`), `LeaderHomeScreen` (`screens.tsx:1340`), feed (`screens.tsx:2091`), campaigns (`screens.tsx:3238`), moderation (`screens.tsx:3669`), recognition (`screens.tsx:3773`), schedule (`screens.tsx:4173`), operations (`screens.tsx:4410`), coverage (`screens.tsx:5000`) and team (`screens.tsx:5253`).
- `ScreenScaffold` always renders brand, eyebrow, display title and subtitle before screen content (`packages/ui/src/native/primitives.tsx:562`). Its 48px top padding and large header gap (`packages/ui/src/native/primitives.tsx:936`) make narrow first viewports feel presentation-led before daily work appears.
- `CollaboratorHomeChrome` and `LeaderHomeChrome` place metric tiles before tabs (`apps/mobile/src/app/product-shell.tsx:100`, `apps/mobile/src/app/product-shell.tsx:133`). Because each `MetricTile` is a full `Card` (`packages/ui/src/native/primitives.tsx:459`), the first viewport reads as dashboard chrome on collaborator and leader routes.
- Feed is already separated into a `FlatList`, but its header still includes the full brand/title block, metrics, composer, announcements, polls, archive callout, campaign callout and feedback before timeline posts (`apps/mobile/src/app/screens.tsx:2155`). This conflicts with the social-feed requirement that recent posts appear before secondary operational modules.
- Non-feed collaborator tabs reuse the same top shell and then render panel content (`apps/mobile/src/app/screens.tsx:1243`). Schedule, operations and recognition therefore start below global metrics/tabs even when their most important action is inside `CollaboratorSchedulePanel`, `CollaboratorOperationsPanel` or `CollaboratorRecognitionPanel`.
- Schedule has useful components but remains section-led: today's shift appears after the section header (`apps/mobile/src/app/screens.tsx:4231`), then more metrics and timeline. Quick actions are in a later muted card (`apps/mobile/src/app/screens.tsx:4289`).
- Operations exposes progress and checklist state, but it starts with a summary card, metric row and routine tabs before the actionable checklist (`apps/mobile/src/app/screens.tsx:4508`). The issue form still asks for an evidence URL (`apps/mobile/src/app/screens.tsx:4788`), which feels less native than capture/gallery evidence.
- Recognition is heavily metric/archive oriented: two metric rows lead the panel (`apps/mobile/src/app/screens.tsx:3870`), then filters, archive, detail, badges, ranking and reward grants. Some copy exposes backend-ish concepts like `grantingRule`, `responsibleApproverUserId`, metadata and `fulfillment` (`apps/mobile/src/app/screens.tsx:4013`, `apps/mobile/src/app/screens.tsx:4071`, `apps/mobile/src/app/screens.tsx:4131`).
- Leader campaigns start with a create form (`apps/mobile/src/app/screens.tsx:3269`) before active status or decision context. Campaign review nests reward grant cards inside closure cards (`apps/mobile/src/app/screens.tsx:3596`, `apps/mobile/src/app/screens.tsx:3629`), adding density.
- Leader moderation keeps posts in social context through `PhotoCard` (`apps/mobile/src/app/screens.tsx:3721`), but wraps the already-carded `PhotoCard` in another `Card`, creating nested card chrome.
- Team/invite management renders a create-invite form before invite/member lists (`apps/mobile/src/app/team-access.tsx:201`) and exposes raw delivery links inside nested muted cards (`apps/mobile/src/app/team-access.tsx:356`). `formatWorkArea` and `formatRoleLabel` still produce technical or unpolished copy such as "organizacao", "loja vinculada", "setor vinculado" and "Admin organizacao" (`apps/mobile/src/app/team-access.tsx:434`, `apps/mobile/src/app/team-access.tsx:444`).

## Source Audit: `auth-screens.tsx`, `product-shell.tsx`, `team-access.tsx`

- Auth login is reasonably complete, but the screen is still a full scaffold plus a large form card and a second recovery card (`apps/mobile/src/app/auth-screens.tsx:93`, `apps/mobile/src/app/auth-screens.tsx:101`, `apps/mobile/src/app/auth-screens.tsx:167`). Validation copy appears as passive text near the bottom rather than being tied to field errors.
- Invite signup uses a state card plus a long one-step form (`apps/mobile/src/app/auth-screens.tsx:230`, `apps/mobile/src/app/auth-screens.tsx:249`). It needs progressive steps or compact grouping so password setup and success routing feel intentional.
- Product shell tabs are shared and accessible, but the metric-first layout creates the same first viewport for every journey, even when each tab has a different user goal (`apps/mobile/src/app/product-shell.tsx:91`, `apps/mobile/src/app/product-shell.tsx:128`).
- Team access has permission handling (`apps/mobile/src/app/team-access.tsx:113`) and invite states, but it should become a member/invite row surface with compact role/scope clarity, not a form-first admin panel.

## Source Audit: `packages/ui`

- Tokens are coherent but the baseline screens are dominated by `surface`, `paper`, `cream`, `leaf` and `grape` (`packages/ui/src/foundations.ts:1`, `packages/ui/src/foundations.ts:24`). The next pass should reduce the beige/green dashboard read with crisper neutral contrast and more purposeful status accents.
- Radius stays within the desired 8px card rule (`packages/ui/src/foundations.ts:104`), but the large number of card surfaces and metric tiles creates visual sameness.
- Buttons and icon buttons accept plain string icons (`packages/ui/src/native/primitives.tsx:135`, `packages/ui/src/native/primitives.tsx:190`) and several screens pass text symbols such as `>`, `+`, `ME` and `OFF`. These should be replaced with consistent native-feeling iconography or icon-plus-label patterns.
- Shared social components exist (`PhotoCard`, `ReactionBar`, `CommentPreview`, `ModerationBanner`) but are partial (`packages/ui/src/native/features.tsx:34`, `packages/ui/src/native/features.tsx:121`, `packages/ui/src/native/features.tsx:150`). There is no finished `SocialPostCard`, collapsed/expanded quick composer, comment thread or priority strip with feed-specific states.
- `UploadComposer` is a static component and does not model the live composer states already present in `screens.tsx` (`packages/ui/src/native/features.tsx:100`). The real composer remains implemented ad hoc in the app.
- Operational components exist for shifts, timeline, coverage, checklist, issue and summary (`packages/ui/src/native/features.tsx:205`, `packages/ui/src/native/features.tsx:243`, `packages/ui/src/native/features.tsx:275`, `packages/ui/src/native/features.tsx:443`), but app panels still mix these with local bespoke cards. The next task group should standardize the reusable operational card set.
- State copy is centralized but still generic and ASCII-only in visible text such as "Estado vazio", "Permissao" and "Criar acao" (`packages/ui/src/copy.ts:1`). Product copy should become final Brazilian Portuguese with screen-specific next actions.

## Target Product Hierarchy

### Unauthenticated Journey

1. Compact Engaja identity and trust cue.
2. Primary auth form or invite context.
3. One visible primary action.
4. Inline validation tied to fields.
5. Recovery, invalid/expired invite and help states as secondary but reachable actions.

### Collaborator Journey

1. Compact role/day header with offline/pending state.
2. Active tab first: feed, escala, rotinas or reconhecimento.
3. Primary action and current operational signal before metrics.
4. Supporting modules after the first action is visible.
5. Empty/error/offline/success states that preserve the next useful action.

Feed order:

1. Compact header.
2. Collapsed quick composer with camera/gallery/post CTA.
3. Recent social post(s), photo-first.
4. Priority strips for announcements, polls, campaigns and feedback.
5. Archive/progress modules.

Escala order:

1. Today's shift.
2. Next shift and pending request status.
3. Availability/time-off/swap quick actions.
4. Week timeline and request history.

Rotinas order:

1. Active routine and progress.
2. Next checklist item.
3. Evidence capture and issue logging.
4. Standards, learning and shift summary.

Reconhecimento order:

1. Current progress and campaign eligibility.
2. Send recognition action.
3. Rewards/achievement status.
4. Ranking and archive.

### Leader Journey

1. Compact leadership context and role.
2. Most urgent queue or decision.
3. Primary action cluster.
4. Supporting metrics.
5. Deeper campaign, coverage, moderation and team lists.

Leader overview order:

1. Urgent attention areas.
2. Moderation queue.
3. Coverage gaps and routine completion.
4. Team actions and campaign entry.

Campaigns order:

1. Active/closing campaign status.
2. Audience, reward and schedule.
3. Close/review action.
4. Create/edit details and archive.

Moderation order:

1. Queue count/status.
2. Pending social post card in context.
3. Approve/feature/hide/remove controls.
4. Published/empty queue state.

Coverage order:

1. Primary coverage gap/conflict.
2. Draft/published state.
3. Approval action.
4. Timeline, shifts and notifications.

Team/invites order:

1. Pending invites and active members.
2. Allowed action based on role.
3. Role/scope explanation in human copy.
4. Create/resend/revoke details.

## Implementation Guardrails for Task Groups 2-8

- Do not keep adding card surfaces to solve hierarchy. Prefer compact rows, strips and unframed sections unless the element is a repeated item, modal, tool or state.
- Do not let shared metrics appear before the current action or urgent signal.
- Do not expose internal terms in visible copy: provider, token, fallback, seed, scope, local mode, metadata, fulfillment, granting rule, raw IDs or raw invite URLs.
- Prefer shared social and operational components in `packages/ui/native`; extract only where it supports multiple surfaces or removes real duplication.
- Keep services, contracts and persistence behavior intact unless a screen cannot show existing data needed by the target hierarchy.
