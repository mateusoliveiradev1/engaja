import {
  assertNonEmptyString,
  assertNonNegativeInteger,
  assertPositiveInteger,
  assertValidDate,
  createTimeWindow,
  type TimeWindow,
} from "./base.js";
import { type DomainId, type Entity, createDomainId } from "./ids.js";
import { type TenantScope } from "./scope.js";

export const engagementCampaignStatuses = [
  "draft",
  "scheduled",
  "active",
  "closed",
  "archived",
] as const;

export type EngagementCampaignStatus = (typeof engagementCampaignStatuses)[number];

export const engagementCampaignPeriodPresets = ["weekly", "monthly", "custom"] as const;

export type EngagementCampaignPeriodPreset = (typeof engagementCampaignPeriodPresets)[number];

export const engagementSettlementModes = ["automatic", "manual-review"] as const;

export type EngagementSettlementMode = (typeof engagementSettlementModes)[number];

export const engagementMetricTypes = [
  "approved-photo-post",
  "validated-banca-setup",
  "approved-before-after",
  "checklist-linked-evidence",
  "consistency-streak",
] as const;

export type EngagementMetricType = (typeof engagementMetricTypes)[number];

export const engagementTieBreakerKinds = [
  "approved-quality",
  "consistency",
  "first-to-finish",
] as const;

export type EngagementTieBreakerKind = (typeof engagementTieBreakerKinds)[number];

export const engagementEventSourceTypes = [
  ...engagementMetricTypes,
  "recognition",
  "reward-grant",
  "manual-adjustment",
] as const;

export type EngagementEventSourceType = (typeof engagementEventSourceTypes)[number];

export const engagementEligibleEventStatuses = [
  "counted",
  "excluded",
  "corrected",
  "revoked",
] as const;

export type EngagementEligibleEventStatus = (typeof engagementEligibleEventStatuses)[number];

export const engagementArchiveItemTypes = [
  "badge-awarded",
  "recognition-received",
  "featured-post",
  "validated-banca",
  "challenge-completed",
  "challenge-won",
  "reward-granted",
  "manual-prize",
] as const;

export type EngagementArchiveItemType = (typeof engagementArchiveItemTypes)[number];

export const engagementArchiveItemStatuses = ["recorded", "corrected", "revoked"] as const;

export type EngagementArchiveItemStatus = (typeof engagementArchiveItemStatuses)[number];

export const engagementRewardTypes = [
  "digital",
  "manual-company-approved",
  "manual-external-informal",
] as const;

export type EngagementRewardType = (typeof engagementRewardTypes)[number];

export const engagementRewardGrantStatuses = [
  "digital-granted",
  "pending-company-approval",
  "approved-for-fulfillment",
  "fulfilled",
  "canceled",
] as const;

export type EngagementRewardGrantStatus = (typeof engagementRewardGrantStatuses)[number];

export type EngagementMetadataValue = boolean | number | string;

export type EngagementRuleMetadata = Readonly<Record<string, EngagementMetadataValue>>;

export interface EngagementTieBreakerRule {
  readonly kind: EngagementTieBreakerKind;
  readonly priority: number;
}

export interface EngagementCampaignScoringRule {
  readonly maxEventsPerUser?: number;
  readonly metricType: EngagementMetricType;
  readonly pointsPerEligibleEvent: number;
  readonly requireUniqueSources: boolean;
  readonly tieBreakers: readonly EngagementTieBreakerRule[];
}

export interface EngagementCampaignEligibility {
  readonly eligibleUserIds: readonly DomainId<"user">[];
  readonly maxEventsPerDay?: number;
  readonly requiresApprovedFeedPost: boolean;
  readonly requiresOperationalValidation: boolean;
}

export interface EngagementCampaignSettlement {
  readonly mode: EngagementSettlementMode;
  readonly winnerCount: number;
}

export interface DigitalEngagementRewardDefinition {
  readonly badgeCode?: string;
  readonly highlightLabel?: string;
  readonly points?: number;
  readonly title: string;
  readonly type: "digital";
}

export interface ManualCompanyApprovedRewardDefinition {
  readonly approvalPolicyCode: string;
  readonly description: string;
  readonly fulfillmentWindowDays?: number;
  readonly title: string;
  readonly type: "manual-company-approved";
}

export interface ManualExternalInformalRewardDefinition {
  readonly disclaimer: string;
  readonly note?: string;
  readonly title: string;
  readonly type: "manual-external-informal";
}

export type EngagementCampaignRewardDefinition =
  | DigitalEngagementRewardDefinition
  | ManualCompanyApprovedRewardDefinition
  | ManualExternalInformalRewardDefinition;

export type GrantableEngagementRewardDefinition = Exclude<
  EngagementCampaignRewardDefinition,
  { readonly type: "manual-external-informal" }
>;

export interface EngagementCampaign extends Entity<DomainId<"engagement-campaign">> {
  readonly createdAt: Date;
  readonly createdByUserId: DomainId<"user">;
  readonly description: string;
  readonly eligibility: EngagementCampaignEligibility;
  readonly objective: string;
  readonly periodPreset: EngagementCampaignPeriodPreset;
  readonly reward: EngagementCampaignRewardDefinition;
  readonly scope: TenantScope;
  readonly scoringRule: EngagementCampaignScoringRule;
  readonly settlement: EngagementCampaignSettlement;
  readonly status: EngagementCampaignStatus;
  readonly title: string;
  readonly window: TimeWindow;
}

export interface EligibleEngagementEvent extends Entity<DomainId<"eligible-engagement-event">> {
  readonly actorUserId: DomainId<"user">;
  readonly awardedAt: Date;
  readonly campaignId?: DomainId<"engagement-campaign">;
  readonly ruleLabel: string;
  readonly ruleMetadata: EngagementRuleMetadata;
  readonly scope: TenantScope;
  readonly scoreValue: number;
  readonly sourceId: string;
  readonly sourceType: EngagementEventSourceType;
  readonly status: EngagementEligibleEventStatus;
}

export interface CollaboratorArchiveItem extends Entity<DomainId<"archive-item">> {
  readonly campaignId?: DomainId<"engagement-campaign">;
  readonly grantingRule: string;
  readonly metadata: EngagementRuleMetadata;
  readonly occurredAt: Date;
  readonly relatedContentReference?: string;
  readonly responsibleApproverUserId?: DomainId<"user">;
  readonly rewardGrantId?: DomainId<"reward-grant">;
  readonly rewardStatus?: EngagementRewardGrantStatus;
  readonly scope: TenantScope;
  readonly sourceAction: string;
  readonly sourceId: string;
  readonly sourceType: EngagementEventSourceType;
  readonly status: EngagementArchiveItemStatus;
  readonly title: string;
  readonly type: EngagementArchiveItemType;
  readonly userId: DomainId<"user">;
}

export interface RewardGrant extends Entity<DomainId<"reward-grant">> {
  readonly approvedAt?: Date;
  readonly approvedByUserId?: DomainId<"user">;
  readonly campaignId: DomainId<"engagement-campaign">;
  readonly canceledAt?: Date;
  readonly canceledByUserId?: DomainId<"user">;
  readonly fulfilledAt?: Date;
  readonly fulfilledByUserId?: DomainId<"user">;
  readonly grantedAt: Date;
  readonly metadata: EngagementRuleMetadata;
  readonly position: number;
  readonly reward: GrantableEngagementRewardDefinition;
  readonly scope: TenantScope;
  readonly status: EngagementRewardGrantStatus;
  readonly userId: DomainId<"user">;
  readonly winningScore: number;
}

export function createEngagementCampaign(input: {
  readonly createdAt: Date;
  readonly createdByUserId: string;
  readonly description: string;
  readonly eligibility?: {
    readonly eligibleUserIds?: readonly string[];
    readonly maxEventsPerDay?: number;
    readonly requiresApprovedFeedPost?: boolean;
    readonly requiresOperationalValidation?: boolean;
  };
  readonly endsAt: Date;
  readonly id: string;
  readonly objective: string;
  readonly periodPreset: EngagementCampaignPeriodPreset;
  readonly reward: {
    readonly approvalPolicyCode?: string;
    readonly badgeCode?: string;
    readonly description?: string;
    readonly disclaimer?: string;
    readonly fulfillmentWindowDays?: number;
    readonly highlightLabel?: string;
    readonly note?: string;
    readonly points?: number;
    readonly title: string;
    readonly type: EngagementRewardType;
  };
  readonly scope: TenantScope;
  readonly scoringRule: {
    readonly maxEventsPerUser?: number;
    readonly metricType: EngagementMetricType;
    readonly pointsPerEligibleEvent: number;
    readonly requireUniqueSources?: boolean;
    readonly tieBreakers?: readonly {
      readonly kind: EngagementTieBreakerKind;
      readonly priority?: number;
    }[];
  };
  readonly settlement?: {
    readonly mode?: EngagementSettlementMode;
    readonly winnerCount?: number;
  };
  readonly startsAt: Date;
  readonly status: EngagementCampaignStatus;
  readonly title: string;
}): EngagementCampaign {
  return {
    createdAt: assertValidDate(input.createdAt, "createdAt"),
    createdByUserId: createDomainId<"user">(assertNonEmptyString(input.createdByUserId, "createdByUserId")),
    description: assertLength(input.description, "description", 1, 500),
    eligibility: createEngagementCampaignEligibility(input.eligibility),
    id: createDomainId<"engagement-campaign">(assertNonEmptyString(input.id, "id")),
    objective: assertLength(input.objective, "objective", 1, 160),
    periodPreset: input.periodPreset,
    reward: createEngagementCampaignRewardDefinition(input.reward),
    scope: input.scope,
    scoringRule: createEngagementCampaignScoringRule(input.scoringRule),
    settlement: createEngagementCampaignSettlement(input.settlement),
    status: input.status,
    title: assertLength(input.title, "title", 1, 160),
    window: createTimeWindow(input.startsAt, input.endsAt),
  };
}

export function createEngagementCampaignScoringRule(input: {
  readonly maxEventsPerUser?: number;
  readonly metricType: EngagementMetricType;
  readonly pointsPerEligibleEvent: number;
  readonly requireUniqueSources?: boolean;
  readonly tieBreakers?: readonly {
    readonly kind: EngagementTieBreakerKind;
    readonly priority?: number;
  }[];
}): EngagementCampaignScoringRule {
  return {
    ...(input.maxEventsPerUser === undefined
      ? {}
      : { maxEventsPerUser: assertPositiveInteger(input.maxEventsPerUser, "maxEventsPerUser") }),
    metricType: input.metricType,
    pointsPerEligibleEvent: assertPositiveInteger(input.pointsPerEligibleEvent, "pointsPerEligibleEvent"),
    requireUniqueSources: input.requireUniqueSources ?? true,
    tieBreakers: normalizeTieBreakers(input.tieBreakers),
  };
}

export function createEngagementCampaignEligibility(input?: {
  readonly eligibleUserIds?: readonly string[];
  readonly maxEventsPerDay?: number;
  readonly requiresApprovedFeedPost?: boolean;
  readonly requiresOperationalValidation?: boolean;
}): EngagementCampaignEligibility {
  return {
    eligibleUserIds: (input?.eligibleUserIds ?? []).map((userId) =>
      createDomainId<"user">(assertNonEmptyString(userId, "eligibleUserIds")),
    ),
    ...(input?.maxEventsPerDay === undefined
      ? {}
      : { maxEventsPerDay: assertPositiveInteger(input.maxEventsPerDay, "maxEventsPerDay") }),
    requiresApprovedFeedPost: input?.requiresApprovedFeedPost ?? false,
    requiresOperationalValidation: input?.requiresOperationalValidation ?? false,
  };
}

export function createEngagementCampaignSettlement(input?: {
  readonly mode?: EngagementSettlementMode;
  readonly winnerCount?: number;
}): EngagementCampaignSettlement {
  return {
    mode: input?.mode ?? "automatic",
    winnerCount: assertPositiveInteger(input?.winnerCount ?? 1, "winnerCount"),
  };
}

export function createEngagementCampaignRewardDefinition(input: {
  readonly approvalPolicyCode?: string;
  readonly badgeCode?: string;
  readonly description?: string;
  readonly disclaimer?: string;
  readonly fulfillmentWindowDays?: number;
  readonly highlightLabel?: string;
  readonly note?: string;
  readonly points?: number;
  readonly title: string;
  readonly type: EngagementRewardType;
}): EngagementCampaignRewardDefinition {
  const title = assertLength(input.title, "title", 1, 160);

  if (input.type === "digital") {
    const points =
      input.points === undefined ? undefined : assertNonNegativeInteger(input.points, "points");
    const badgeCode =
      input.badgeCode === undefined
        ? undefined
        : assertLength(input.badgeCode, "badgeCode", 1, 80);
    const highlightLabel =
      input.highlightLabel === undefined
        ? undefined
        : assertLength(input.highlightLabel, "highlightLabel", 1, 120);

    if ((points ?? 0) <= 0 && badgeCode === undefined && highlightLabel === undefined) {
      throw new Error(
        "Digital engagement rewards must grant points, a badge, or an in-app highlight.",
      );
    }

    return {
      ...(badgeCode === undefined ? {} : { badgeCode }),
      ...(highlightLabel === undefined ? {} : { highlightLabel }),
      ...(points === undefined ? {} : { points }),
      title,
      type: "digital",
    };
  }

  if (input.type === "manual-company-approved") {
    return {
      approvalPolicyCode: assertLength(input.approvalPolicyCode ?? "", "approvalPolicyCode", 1, 120),
      description: assertLength(input.description ?? "", "description", 1, 500),
      ...(input.fulfillmentWindowDays === undefined
        ? {}
        : {
            fulfillmentWindowDays: assertPositiveInteger(
              input.fulfillmentWindowDays,
              "fulfillmentWindowDays",
            ),
          }),
      title,
      type: "manual-company-approved",
    };
  }

  return {
    disclaimer: assertLength(input.disclaimer ?? "", "disclaimer", 1, 240),
    ...(input.note === undefined ? {} : { note: assertLength(input.note, "note", 1, 240) }),
    title,
    type: "manual-external-informal",
  };
}

export function createEligibleEngagementEvent(input: {
  readonly actorUserId: string;
  readonly awardedAt: Date;
  readonly campaignId?: string;
  readonly id: string;
  readonly ruleLabel: string;
  readonly ruleMetadata?: Record<string, EngagementMetadataValue>;
  readonly scope: TenantScope;
  readonly scoreValue: number;
  readonly sourceId: string;
  readonly sourceType: EngagementEventSourceType;
  readonly status: EngagementEligibleEventStatus;
}): EligibleEngagementEvent {
  return {
    actorUserId: createDomainId<"user">(assertNonEmptyString(input.actorUserId, "actorUserId")),
    awardedAt: assertValidDate(input.awardedAt, "awardedAt"),
    ...(input.campaignId === undefined
      ? {}
      : {
          campaignId: createDomainId<"engagement-campaign">(
            assertNonEmptyString(input.campaignId, "campaignId"),
          ),
        }),
    id: createDomainId<"eligible-engagement-event">(assertNonEmptyString(input.id, "id")),
    ruleLabel: assertLength(input.ruleLabel, "ruleLabel", 1, 160),
    ruleMetadata: normalizeMetadata(input.ruleMetadata),
    scope: input.scope,
    scoreValue: assertNonNegativeInteger(input.scoreValue, "scoreValue"),
    sourceId: assertLength(input.sourceId, "sourceId", 1, 160),
    sourceType: input.sourceType,
    status: input.status,
  };
}

export function createCollaboratorArchiveItem(input: {
  readonly campaignId?: string;
  readonly grantingRule: string;
  readonly id: string;
  readonly metadata?: Record<string, EngagementMetadataValue>;
  readonly occurredAt: Date;
  readonly relatedContentReference?: string;
  readonly responsibleApproverUserId?: string;
  readonly rewardGrantId?: string;
  readonly rewardStatus?: EngagementRewardGrantStatus;
  readonly scope: TenantScope;
  readonly sourceAction: string;
  readonly sourceId: string;
  readonly sourceType: EngagementEventSourceType;
  readonly status: EngagementArchiveItemStatus;
  readonly title: string;
  readonly type: EngagementArchiveItemType;
  readonly userId: string;
}): CollaboratorArchiveItem {
  const type = input.type;
  const rewardStatus = input.rewardStatus;

  if ((type === "reward-granted" || type === "manual-prize") && rewardStatus === undefined) {
    throw new Error("Reward archive items must expose a rewardStatus.");
  }

  if (type !== "reward-granted" && type !== "manual-prize" && rewardStatus !== undefined) {
    throw new Error("Only reward archive items may expose a rewardStatus.");
  }

  return {
    ...(input.campaignId === undefined
      ? {}
      : {
          campaignId: createDomainId<"engagement-campaign">(
            assertNonEmptyString(input.campaignId, "campaignId"),
          ),
        }),
    grantingRule: assertLength(input.grantingRule, "grantingRule", 1, 240),
    id: createDomainId<"archive-item">(assertNonEmptyString(input.id, "id")),
    metadata: normalizeMetadata(input.metadata),
    occurredAt: assertValidDate(input.occurredAt, "occurredAt"),
    ...(input.relatedContentReference === undefined
      ? {}
      : {
          relatedContentReference: assertLength(
            input.relatedContentReference,
            "relatedContentReference",
            1,
            240,
          ),
        }),
    ...(input.responsibleApproverUserId === undefined
      ? {}
      : {
          responsibleApproverUserId: createDomainId<"user">(
            assertNonEmptyString(input.responsibleApproverUserId, "responsibleApproverUserId"),
          ),
        }),
    ...(input.rewardGrantId === undefined
      ? {}
      : {
          rewardGrantId: createDomainId<"reward-grant">(
            assertNonEmptyString(input.rewardGrantId, "rewardGrantId"),
          ),
        }),
    ...(rewardStatus === undefined ? {} : { rewardStatus }),
    scope: input.scope,
    sourceAction: assertLength(input.sourceAction, "sourceAction", 1, 240),
    sourceId: assertLength(input.sourceId, "sourceId", 1, 160),
    sourceType: input.sourceType,
    status: input.status,
    title: assertLength(input.title, "title", 1, 160),
    type,
    userId: createDomainId<"user">(assertNonEmptyString(input.userId, "userId")),
  };
}

export function createRewardGrant(input: {
  readonly approvedAt?: Date;
  readonly approvedByUserId?: string;
  readonly campaignId: string;
  readonly canceledAt?: Date;
  readonly canceledByUserId?: string;
  readonly fulfilledAt?: Date;
  readonly fulfilledByUserId?: string;
  readonly grantedAt: Date;
  readonly id: string;
  readonly metadata?: Record<string, EngagementMetadataValue>;
  readonly position: number;
  readonly reward: {
    readonly approvalPolicyCode?: string;
    readonly badgeCode?: string;
    readonly description?: string;
    readonly fulfillmentWindowDays?: number;
    readonly highlightLabel?: string;
    readonly points?: number;
    readonly title: string;
    readonly type: Exclude<EngagementRewardType, "manual-external-informal">;
  };
  readonly scope: TenantScope;
  readonly status: EngagementRewardGrantStatus;
  readonly userId: string;
  readonly winningScore: number;
}): RewardGrant {
  const reward = createEngagementCampaignRewardDefinition(input.reward);

  if (reward.type === "manual-external-informal") {
    throw new Error("Informal external rewards cannot create official reward grants.");
  }

  if (reward.type === "digital" && input.status !== "digital-granted") {
    throw new Error("Digital rewards must use the digital-granted status.");
  }

  if (reward.type === "manual-company-approved" && input.status === "digital-granted") {
    throw new Error("Manual company-approved rewards cannot use the digital-granted status.");
  }

  const approvedAt =
    input.approvedAt === undefined ? undefined : assertValidDate(input.approvedAt, "approvedAt");
  const fulfilledAt =
    input.fulfilledAt === undefined ? undefined : assertValidDate(input.fulfilledAt, "fulfilledAt");
  const canceledAt =
    input.canceledAt === undefined ? undefined : assertValidDate(input.canceledAt, "canceledAt");

  if (
    (input.status === "approved-for-fulfillment" || input.status === "fulfilled") &&
    (approvedAt === undefined || input.approvedByUserId === undefined)
  ) {
    throw new Error("Approved manual rewards require approvedAt and approvedByUserId.");
  }

  if (input.status === "fulfilled" && (fulfilledAt === undefined || input.fulfilledByUserId === undefined)) {
    throw new Error("Fulfilled rewards require fulfilledAt and fulfilledByUserId.");
  }

  if (input.status === "canceled" && canceledAt === undefined) {
    throw new Error("Canceled rewards require canceledAt.");
  }

  return {
    ...(approvedAt === undefined ? {} : { approvedAt }),
    ...(input.approvedByUserId === undefined
      ? {}
      : {
          approvedByUserId: createDomainId<"user">(
            assertNonEmptyString(input.approvedByUserId, "approvedByUserId"),
          ),
        }),
    campaignId: createDomainId<"engagement-campaign">(assertNonEmptyString(input.campaignId, "campaignId")),
    ...(canceledAt === undefined ? {} : { canceledAt }),
    ...(input.canceledByUserId === undefined
      ? {}
      : {
          canceledByUserId: createDomainId<"user">(
            assertNonEmptyString(input.canceledByUserId, "canceledByUserId"),
          ),
        }),
    ...(fulfilledAt === undefined ? {} : { fulfilledAt }),
    ...(input.fulfilledByUserId === undefined
      ? {}
      : {
          fulfilledByUserId: createDomainId<"user">(
            assertNonEmptyString(input.fulfilledByUserId, "fulfilledByUserId"),
          ),
        }),
    grantedAt: assertValidDate(input.grantedAt, "grantedAt"),
    id: createDomainId<"reward-grant">(assertNonEmptyString(input.id, "id")),
    metadata: normalizeMetadata(input.metadata),
    position: assertPositiveInteger(input.position, "position"),
    reward,
    scope: input.scope,
    status: input.status,
    userId: createDomainId<"user">(assertNonEmptyString(input.userId, "userId")),
    winningScore: assertNonNegativeInteger(input.winningScore, "winningScore"),
  };
}

function normalizeTieBreakers(
  input?: readonly {
    readonly kind: EngagementTieBreakerKind;
    readonly priority?: number;
  }[],
): readonly EngagementTieBreakerRule[] {
  const tieBreakers = (input ?? []).map((rule, index) => ({
    kind: rule.kind,
    priority: assertPositiveInteger(rule.priority ?? index + 1, "tieBreaker.priority"),
  }));

  const usedPriorities = new Set<number>();

  for (const rule of tieBreakers) {
    if (usedPriorities.has(rule.priority)) {
      throw new Error("Engagement tie-breakers must use unique priorities.");
    }

    usedPriorities.add(rule.priority);
  }

  return tieBreakers.sort((left, right) => left.priority - right.priority);
}

function normalizeMetadata(
  input?: Record<string, EngagementMetadataValue>,
): EngagementRuleMetadata {
  const entries = Object.entries(input ?? {}).map(([key, value]) => {
    const normalizedKey = assertNonEmptyString(key, "metadata.key");

    if (typeof value === "number" && !Number.isFinite(value)) {
      throw new Error("metadata values must be finite.");
    }

    return [normalizedKey, value] as const;
  });

  return Object.fromEntries(entries);
}

function assertLength(value: string, field: string, minimum: number, maximum: number): string {
  const normalized = assertNonEmptyString(value, field);

  if (normalized.length < minimum || normalized.length > maximum) {
    throw new Error(`${field} must contain between ${minimum} and ${maximum} characters.`);
  }

  return normalized;
}
