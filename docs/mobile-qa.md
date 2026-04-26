# Mobile QA Matrix

Reviewed on 2026-04-25 through component-render walkthroughs, token audits, release checklists, state coverage tests, copy scans and Chrome-rendered Expo web screenshots.

## Device Profiles

- Narrow Android: 360x800 baseline for collaborator and leader primary flows.
- Standard iPhone: 393x852 baseline for the default day-to-day shell.
- Tablet Width: 768x1024 baseline for wider leadership and checklist layouts.

## Visual QA

- distinct-identity: PASS. Feed, schedule, operations and dashboard surfaces keep FLV-specific language, photo-first emphasis and produce-led color blocking instead of generic SaaS chrome.
- text-overlap: PASS. Shared typography, spacing and state coverage were reviewed against the narrow Android baseline to avoid clipped headers, stacked badges or broken CTA rows.
- nested-cards: PASS. Primary flows keep one dominant surface per section and avoid card-inside-card noise in the first viewport.
- unfinished-states: PASS. Loading, empty, error, offline, permission and success states now have explicit component coverage in the mobile render tests.
- hierarchy: PASS. Collaborator and leader first viewports surface the primary action, pending work and operational risk before secondary details.
- produce-context: PASS. Photo cards, evidence thumbnails, fresh/warm accents and FLV copy remain visible across the reviewed flows.

## Screenshot Evidence

- Narrow Android 360x800: PASS. Captured auth login, invite signup, collaborator feed, composer expanded, escala, rotinas, reconhecimento, leader overview, moderation, campaigns, coverage, team/invites and permission denied in `reports/visual/screenshots/2026-04-25/*-android-360.png`.
- Standard iPhone 393x852: PASS. Captured the same release matrix in `reports/visual/screenshots/2026-04-25/*-iphone-393.png`.
- Expo web preview 1024x900: PASS. Captured the same release matrix in `reports/visual/screenshots/2026-04-25/*-web-1024.png`.
- Auth bootstrap: PASS. Protected collaborator, leader and permission captures restored sessions through `/auth/session/refresh`, then loaded feed, operations, recognition, dashboard and invite data through a local QA API shim.
- Screenshot diagnostics: PASS. `reports/visual/visual-qa-2026-04-25.json` reports 39 captures with no horizontal overflow, app error text or blank render flags.

## Accessibility QA

- labels: PASS. Primary buttons, tabs, avatars, badges and photo media surfaces expose meaningful accessibility labels in shared primitives.
- reading-order: PASS. Screen scaffolds keep eyebrow, title, subtitle and actionable sections in a linear order that matches the visual hierarchy.
- hit-targets: PASS. Shared controls keep a 44px minimum target or add compensating hit slop when the visual affordance is smaller.
- dynamic-text: PASS. Shared text primitives allow scaling with a capped multiplier and the key screens were reviewed for copy density on the narrow baseline.
- reduced-motion-safe feedback: PASS. Shared press feedback respects reduced-motion state and preserves non-motion visual feedback.

## Flow Coverage

- Sign-in shell: PASS. Auth shell keeps a clear entry CTA, protected-route context and zero-cost development messaging.
- Collaborator feed: PASS. Composer, posts, comments, moderation status and pending-sync affordances render with distinct copy and visible primary actions.
- Collaborator schedule: PASS. Availability, time-off and swap actions remain visible without collapsing the current shift or request status context.
- Collaborator checklist: PASS. Routine tabs, evidence-aware checklist items, issue logging and shift summary remain legible with offline state messaging present.
- Recognition: PASS. Profile summary, badge surfaces and the peer-recognition CTA stay actionable without introducing negative ranking framing.
- Leader dashboard: PASS. Overview metrics, moderation queue, approvals and team detail keep the command-surface hierarchy intact on wider layouts.
- Permission state: PASS. Collaborator access to leader-only routes renders the branded "Area nao liberada" state with a safe next action.

## Release Gate Commands

- `pnpm --filter @engaja/config visual:qa`: PASS.
- `pnpm --filter @engaja/ui test -- --runInBand`: PASS, 15 tests.
- `pnpm --filter @engaja/mobile test`: PASS, 35 tests.
- `pnpm --filter @engaja/api test`: PASS, 53 tests.
- `pnpm lint`: PASS, exit code 0. The run still prints parser noise while ESLint inspects nested React Native files under `apps/mobile/node_modules/@engaja/ui/node_modules/react-native`, but no first-party lint task failed.
- `pnpm typecheck`: PASS.

## Notes

- Copy audit on 2026-04-25 found only code identifiers, storage keys, schema names, request ids and QA fixture ids for blocked terms. Visible app copy uses product language such as "codigo do convite", "area" and "acesso".
- No product-blocking visual, copy, accessibility or performance issues remain from this pass.
