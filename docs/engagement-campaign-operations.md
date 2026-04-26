# Engagement Campaign Operations

Updated on 2026-04-23 after completing the collaborator achievement archive rollout safeguards.

## Non-Negotiable Rules

- Count only approved feed posts or validated operational evidence. Pending, hidden, removed, duplicate, or out-of-scope evidence must not change campaign scores.
- Keep public ranking surfaces positive. Show top placements and each collaborator's own progress, but do not expose bottom-of-table views or shame-oriented comparisons.
- Treat company-backed rewards and informal personal gestures differently. `folga`, cash-equivalent prizes, vouchers, and similar benefits only become official campaign rewards after the configured company approval flow is attached.
- Do not publish personal `Pix`, off-platform gifts, or other informal leader promises as guaranteed system rewards.
- Preserve correction history. If approved evidence is later revoked, keep the archive item and mark it as corrected instead of deleting the trace.

## Moderation And Validation Dependencies

- Feed-based campaigns depend on active moderation coverage during the campaign window. If the moderation queue is backlogged, campaign standings will lag and can change after reviews land.
- Before closing a campaign tied to feed posts, confirm the relevant moderation queue is clear for the campaign period.
- Checklist or banca campaigns depend on validated evidence with the expected operational item mapping. Unsupported checklist items must not be counted just because a photo exists.
- Hidden or removed feed posts must trigger score revocation and archive correction before any winner communication is finalized.
- Reward approval and fulfillment actions must stay inside the authorized organization, store, and department scope for the acting leader or manager.

## Campaign Setup Checklist

- Define the campaign scope first: organization, store, department, eligible collaborators, and the exact metric template.
- Set anti-gaming controls explicitly: `maxEventsPerDay`, `maxEventsPerUser`, required unique sources, and the tie-break rule order.
- Prefer a digital-only reward for the first pilot in a department. Use manual company-approved rewards only when the approver and fulfillment owner are already aligned.
- When a manual company-approved reward is used, fill in the approval policy code, fulfillment window, and internal owner before publishing the campaign.
- Explain the reward state clearly in campaign copy: `pending-company-approval`, `approved-for-fulfillment`, `fulfilled`, or `canceled`.

## Closing And Fulfillment

- Close campaigns only after moderation and validation dependencies are reconciled for the campaign period.
- Review the winner list for corrected or revoked evidence before communicating results.
- Manual company-approved rewards move through a tracked state machine: `pending-company-approval` -> `approved-for-fulfillment` -> `fulfilled` or `canceled`.
- Keep fulfillment updates inside the app so the collaborator archive remains the source of truth for reward status.
- If a winning event is later invalidated, document the correction in the archive and communicate the reason before promising fulfillment.

## Suggested Rollout Sequence

1. Start with one FLV department using a digital-only photo campaign.
2. Add a validated banca campaign after the team can keep moderation and checklist validation current in the same operating rhythm.
3. Introduce manual company-approved rewards only after the store manager or equivalent approver commits to the approval and fulfillment cadence.
4. Expand store-wide only after a pilot shows the moderation queue, audit trail, and reward fulfillment states are staying reliable.
