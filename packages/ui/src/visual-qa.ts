export interface FlvVisualQaItem {
  readonly blocking: boolean;
  readonly id: string;
  readonly prompt: string;
}

export const flvVisualQaChecklist = [
  {
    blocking: true,
    id: "distinct-identity",
    prompt:
      "Reject any screen that reads like a generic SaaS dashboard, default social feed or starter template.",
  },
  {
    blocking: true,
    id: "text-overlap",
    prompt:
      "Verify large text and narrow Android widths do not create overlap, clipping or impossible tap targets.",
  },
  {
    blocking: true,
    id: "nested-cards",
    prompt:
      "Remove unnecessary nested cards when they flatten hierarchy or make the screen feel visually noisy.",
  },
  {
    blocking: true,
    id: "unfinished-states",
    prompt:
      "Confirm loading, empty, error, offline, permission-denied and success states exist for each primary flow.",
  },
  {
    blocking: true,
    id: "hierarchy",
    prompt:
      "Check the primary action, freshest signal and operational risk are visible in the first viewport.",
  },
  {
    blocking: false,
    id: "produce-context",
    prompt:
      "Ensure photo surfaces, evidence thumbnails or produce-inspired color blocking reinforce the FLV context.",
  },
] as const satisfies readonly FlvVisualQaItem[];

export function getBlockingVisualQaItems(): readonly FlvVisualQaItem[] {
  return flvVisualQaChecklist.filter((item) => item.blocking);
}
