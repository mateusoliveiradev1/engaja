import {
  assertNonEmptyString,
  assertPositiveInteger,
  assertValidDate,
} from "./base.js";
import { type DomainId, type Entity, createDomainId } from "./ids.js";
import { type TenantScope } from "./scope.js";

export const rewardSources = [
  "feed_post",
  "routine_completion",
  "recognition",
  "learning",
  "manual_adjustment",
] as const;

export type RewardSource = (typeof rewardSources)[number];

export const recognitionCategories = [
  "quality",
  "teamwork",
  "consistency",
  "learning",
  "improvement",
] as const;

export type RecognitionCategory = (typeof recognitionCategories)[number];

export const badgeFamilies = [
  "consistency",
  "quality",
  "teamwork",
  "learning",
  "feed_participation",
  "improvement",
] as const;

export type BadgeFamily = (typeof badgeFamilies)[number];

export type BadgeCriteria =
  | {
      readonly category: RecognitionCategory;
      readonly minimumRecognitionCount: number;
      readonly type: "recognition_count";
    }
  | {
      readonly minimumSourceCount: number;
      readonly source: RewardSource;
      readonly type: "ledger_source_count";
    }
  | {
      readonly minimumPoints: number;
      readonly type: "points_total";
    };

export interface BadgeDefinition {
  readonly code: string;
  readonly criteria: BadgeCriteria;
  readonly description: string;
  readonly family: BadgeFamily;
  readonly title: string;
}

export interface RewardRule {
  readonly code: string;
  readonly maxAwardsPerWindow: number;
  readonly points: number;
  readonly reason: string;
  readonly source: RewardSource;
  readonly windowDays: number;
}

export interface PointsLedgerEntry extends Entity<DomainId<"points-ledger">> {
  readonly actorUserId?: DomainId<"user">;
  readonly amount: number;
  readonly occurredAt: Date;
  readonly reason: string;
  readonly scope: TenantScope;
  readonly source: RewardSource;
  readonly sourceId?: string;
  readonly userId: DomainId<"user">;
}

export interface BadgeAward extends Entity<DomainId<"badge-award">> {
  readonly awardedAt: Date;
  readonly code: string;
  readonly scope: TenantScope;
  readonly userId: DomainId<"user">;
}

export interface RecognitionEvent extends Entity<DomainId<"recognition">> {
  readonly category: RecognitionCategory;
  readonly createdAt: Date;
  readonly message: string;
  readonly pointsAwarded: number;
  readonly recipientUserId: DomainId<"user">;
  readonly scope: TenantScope;
  readonly senderUserId?: DomainId<"user">;
  readonly sourceFeedPostId?: DomainId<"feed-post">;
}

export interface RecognitionLimitPolicy {
  readonly maxReceivedFromSameActorPerWindow: number;
  readonly maxSentPerActorWindow: number;
  readonly peerRecognitionEnabled: boolean;
  readonly windowDays: number;
}

export interface BadgeGrantResult {
  readonly badgeAward: BadgeAward;
  readonly definition: BadgeDefinition;
}

export interface HealthyRankingCandidate {
  readonly badgeCount: number;
  readonly displayName: string;
  readonly eligible: boolean;
  readonly points: number;
  readonly recognitionCount: number;
  readonly userId: DomainId<"user">;
}

export interface HealthyRankingEntry extends HealthyRankingCandidate {
  readonly position: number;
}

export interface HealthyRankingResult {
  readonly entries: readonly HealthyRankingEntry[];
  readonly teamGoalPoints: number;
  readonly teamProgressPercent: number;
  readonly totalPositivePoints: number;
}

export function createRewardRule(input: {
  readonly code: string;
  readonly maxAwardsPerWindow: number;
  readonly points: number;
  readonly reason: string;
  readonly source: RewardSource;
  readonly windowDays: number;
}): RewardRule {
  return {
    code: assertNonEmptyString(input.code, "code"),
    maxAwardsPerWindow: assertPositiveInteger(input.maxAwardsPerWindow, "maxAwardsPerWindow"),
    points: assertPositiveInteger(input.points, "points"),
    reason: assertNonEmptyString(input.reason, "reason"),
    source: input.source,
    windowDays: assertPositiveInteger(input.windowDays, "windowDays"),
  };
}

export function createBadgeDefinition(input: {
  readonly code: string;
  readonly criteria: BadgeCriteria;
  readonly description: string;
  readonly family: BadgeFamily;
  readonly title: string;
}): BadgeDefinition {
  return {
    code: assertNonEmptyString(input.code, "code"),
    criteria: input.criteria,
    description: assertNonEmptyString(input.description, "description"),
    family: input.family,
    title: assertNonEmptyString(input.title, "title"),
  };
}

export function createPointsLedgerEntry(input: {
  readonly actorUserId?: string;
  readonly amount: number;
  readonly id: string;
  readonly occurredAt: Date;
  readonly reason: string;
  readonly scope: TenantScope;
  readonly source: RewardSource;
  readonly sourceId?: string;
  readonly userId: string;
}): PointsLedgerEntry {
  const amount = Number.isInteger(input.amount) ? input.amount : Number.NaN;

  if (!Number.isInteger(amount) || amount === 0) {
    throw new Error("amount must be a non-zero integer.");
  }

  return {
    ...(input.actorUserId === undefined
      ? {}
      : { actorUserId: createDomainId<"user">(assertNonEmptyString(input.actorUserId, "actorUserId")) }),
    amount,
    id: createDomainId<"points-ledger">(assertNonEmptyString(input.id, "id")),
    occurredAt: assertValidDate(input.occurredAt, "occurredAt"),
    reason: assertNonEmptyString(input.reason, "reason"),
    scope: input.scope,
    source: input.source,
    ...(input.sourceId === undefined ? {} : { sourceId: assertNonEmptyString(input.sourceId, "sourceId") }),
    userId: createDomainId<"user">(assertNonEmptyString(input.userId, "userId")),
  };
}

export function createBadgeAward(input: {
  readonly awardedAt: Date;
  readonly code: string;
  readonly id: string;
  readonly scope: TenantScope;
  readonly userId: string;
}): BadgeAward {
  return {
    awardedAt: assertValidDate(input.awardedAt, "awardedAt"),
    code: assertNonEmptyString(input.code, "code"),
    id: createDomainId<"badge-award">(assertNonEmptyString(input.id, "id")),
    scope: input.scope,
    userId: createDomainId<"user">(assertNonEmptyString(input.userId, "userId")),
  };
}

export function createRecognitionEvent(input: {
  readonly category: RecognitionCategory;
  readonly createdAt: Date;
  readonly id: string;
  readonly message: string;
  readonly pointsAwarded: number;
  readonly recipientUserId: string;
  readonly scope: TenantScope;
  readonly senderUserId?: string;
  readonly sourceFeedPostId?: string;
}): RecognitionEvent {
  return {
    category: input.category,
    createdAt: assertValidDate(input.createdAt, "createdAt"),
    id: createDomainId<"recognition">(assertNonEmptyString(input.id, "id")),
    message: assertNonEmptyString(input.message, "message"),
    pointsAwarded: Math.max(0, input.pointsAwarded),
    recipientUserId: createDomainId<"user">(assertNonEmptyString(input.recipientUserId, "recipientUserId")),
    scope: input.scope,
    ...(input.senderUserId === undefined
      ? {}
      : { senderUserId: createDomainId<"user">(assertNonEmptyString(input.senderUserId, "senderUserId")) }),
    ...(input.sourceFeedPostId === undefined
      ? {}
      : {
          sourceFeedPostId: createDomainId<"feed-post">(
            assertNonEmptyString(input.sourceFeedPostId, "sourceFeedPostId"),
          ),
    }),
  };
}

export function evaluateBadgeGrants(input: {
  readonly badgeDefinitions: readonly BadgeDefinition[];
  readonly existingAwards: readonly BadgeAward[];
  readonly ledgerEntries: readonly PointsLedgerEntry[];
  readonly now: Date;
  readonly recognitionEvents: readonly RecognitionEvent[];
  readonly scope: TenantScope;
  readonly userId: DomainId<"user">;
}): readonly BadgeGrantResult[] {
  const existingCodes = new Set(input.existingAwards.map((award) => award.code));

  return input.badgeDefinitions
    .filter((definition) => !existingCodes.has(definition.code))
    .filter((definition) => isBadgeCriteriaMet(definition.criteria, input))
    .map((definition) => ({
      badgeAward: createBadgeAward({
        awardedAt: input.now,
        code: definition.code,
        id: `badge_${definition.code}_${input.userId}`,
        scope: input.scope,
        userId: input.userId,
      }),
      definition,
    }));
}

export function evaluateRecognitionLimit(input: {
  readonly actorRole: string;
  readonly actorUserId: DomainId<"user">;
  readonly category: RecognitionCategory;
  readonly existingEvents: readonly RecognitionEvent[];
  readonly now: Date;
  readonly policy: RecognitionLimitPolicy;
  readonly recipientUserId: DomainId<"user">;
}): {
  readonly allowed: boolean;
  readonly reason: "allowed" | "peer_recognition_disabled" | "recipient_window_limit" | "sender_window_limit";
} {
  if (input.actorRole === "colaborador" && !input.policy.peerRecognitionEnabled) {
    return {
      allowed: false,
      reason: "peer_recognition_disabled",
    };
  }

  const windowStart = new Date(
    input.now.getTime() - input.policy.windowDays * 24 * 60 * 60 * 1000,
  );
  const eventsInWindow = input.existingEvents.filter(
    (event) => event.createdAt.getTime() >= windowStart.getTime(),
  );
  const sentByActorCount = eventsInWindow.filter(
    (event) => event.senderUserId === input.actorUserId,
  ).length;

  if (sentByActorCount >= input.policy.maxSentPerActorWindow) {
    return {
      allowed: false,
      reason: "sender_window_limit",
    };
  }

  const receivedFromActorCount = eventsInWindow.filter(
    (event) =>
      event.senderUserId === input.actorUserId &&
      event.recipientUserId === input.recipientUserId &&
      event.category === input.category,
  ).length;

  if (receivedFromActorCount >= input.policy.maxReceivedFromSameActorPerWindow) {
    return {
      allowed: false,
      reason: "recipient_window_limit",
    };
  }

  return {
    allowed: true,
    reason: "allowed",
  };
}

export function buildHealthyRanking(input: {
  readonly candidates: readonly HealthyRankingCandidate[];
  readonly limit?: number;
  readonly teamGoalPoints: number;
}): HealthyRankingResult {
  const eligibleCandidates = input.candidates
    .filter((candidate) => candidate.eligible && candidate.points > 0)
    .sort((left, right) => {
      if (right.points !== left.points) {
        return right.points - left.points;
      }

      return left.displayName.localeCompare(right.displayName, "pt-BR");
    });
  const entries = eligibleCandidates
    .slice(0, input.limit ?? eligibleCandidates.length)
    .map((candidate, index) => ({
      ...candidate,
      position: index + 1,
    }));
  const totalPositivePoints = eligibleCandidates.reduce(
    (sum, candidate) => sum + Math.max(candidate.points, 0),
    0,
  );

  return {
    entries,
    teamGoalPoints: input.teamGoalPoints,
    teamProgressPercent:
      input.teamGoalPoints <= 0
        ? 100
        : Math.min(100, Math.round((totalPositivePoints / input.teamGoalPoints) * 100)),
    totalPositivePoints,
  };
}

function isBadgeCriteriaMet(
  criteria: BadgeCriteria,
  input: {
    readonly ledgerEntries: readonly PointsLedgerEntry[];
    readonly recognitionEvents: readonly RecognitionEvent[];
  },
): boolean {
  if (criteria.type === "points_total") {
    return input.ledgerEntries.reduce((sum, entry) => sum + Math.max(entry.amount, 0), 0) >= criteria.minimumPoints;
  }

  if (criteria.type === "ledger_source_count") {
    return input.ledgerEntries.filter((entry) => entry.source === criteria.source).length >= criteria.minimumSourceCount;
  }

  return input.recognitionEvents.filter((event) => event.category === criteria.category).length >= criteria.minimumRecognitionCount;
}
