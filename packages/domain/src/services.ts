import { timeWindowsOverlap } from "./base.js";
import { updateFeedPost, type FeedModerationAction, type FeedPost, type FeedPostStatus } from "./feed.js";
import { type DomainActor, type FlvRole } from "./identity.js";
import { type AttentionArea, type MetricSnapshot } from "./metrics.js";
import {
  createPointsLedgerEntry,
  type PointsLedgerEntry,
  type RewardRule,
} from "./recognition.js";
import { type CoverageRequirement, type Shift } from "./schedule.js";
import { type ScopedResource, type TenantScope, isTenantScopeWithin, sameOrganization } from "./scope.js";

export const domainPolicyActions = [
  "feed.read",
  "feed.create",
  "feed.moderate",
  "schedule.read",
  "schedule.publish",
  "operations.summary.read",
  "recognition.read",
  "recognition.send",
  "dashboard.read",
  "media.read",
  "media.upload",
] as const;

export type DomainPolicyAction = (typeof domainPolicyActions)[number];

export type DomainPolicyScopeLevel = "own" | "department" | "store" | "organization";

export interface DomainPolicyRequest {
  readonly action: DomainPolicyAction;
  readonly resource: ScopedResource;
}

export interface DomainPolicyDecision {
  readonly allowed: boolean;
  readonly reason: "allowed" | "missing_permission" | "outside_scope";
}

export interface ScheduleValidationIssue {
  readonly code: "coverage_gap" | "ends_before_start" | "overlapping_shift";
  readonly coverageId?: string;
  readonly message: string;
  readonly shiftId?: string;
}

export interface ScheduleValidationResult {
  readonly coverageGapCount: number;
  readonly issues: readonly ScheduleValidationIssue[];
  readonly overlappingAssignmentCount: number;
  readonly valid: boolean;
}

export interface FeedModerationDecision {
  readonly allowed: boolean;
  readonly nextPost?: FeedPost;
  readonly reason:
    | "allowed"
    | "author_only_action"
    | "invalid_transition"
    | "missing_permission";
}

export interface RewardGrantResult {
  readonly granted: boolean;
  readonly ledgerEntry?: PointsLedgerEntry;
  readonly reason: "duplicate_source" | "granted" | "window_limit_reached";
}

const domainPolicyMatrix: Readonly<
  Record<FlvRole, Readonly<Record<DomainPolicyAction, readonly DomainPolicyScopeLevel[]>>>
> = {
  "admin-organizacao": {
    "dashboard.read": ["organization"],
    "feed.create": ["organization", "store", "department"],
    "feed.moderate": ["organization", "store", "department"],
    "feed.read": ["organization", "store", "department"],
    "media.read": ["organization", "store", "department", "own"],
    "media.upload": ["organization", "store", "department", "own"],
    "operations.summary.read": ["organization"],
    "recognition.read": ["organization", "own"],
    "recognition.send": ["organization", "store", "department"],
    "schedule.publish": ["organization"],
    "schedule.read": ["organization", "own"],
  },
  auditor: {
    "dashboard.read": [],
    "feed.create": [],
    "feed.moderate": [],
    "feed.read": [],
    "media.read": ["organization", "store", "department"],
    "media.upload": [],
    "operations.summary.read": ["organization", "store", "department"],
    "recognition.read": [],
    "recognition.send": [],
    "schedule.publish": [],
    "schedule.read": [],
  },
  colaborador: {
    "dashboard.read": [],
    "feed.create": ["department"],
    "feed.moderate": [],
    "feed.read": ["department", "store"],
    "media.read": ["own", "department"],
    "media.upload": ["own", "department"],
    "operations.summary.read": [],
    "recognition.read": ["own"],
    "recognition.send": ["department"],
    "schedule.publish": [],
    "schedule.read": ["own"],
  },
  "gerente-loja": {
    "dashboard.read": ["store"],
    "feed.create": ["store", "department"],
    "feed.moderate": ["store", "department"],
    "feed.read": ["store", "department"],
    "media.read": ["store", "department", "own"],
    "media.upload": ["store", "department", "own"],
    "operations.summary.read": ["store", "department"],
    "recognition.read": ["store", "own"],
    "recognition.send": ["store", "department"],
    "schedule.publish": ["store", "department"],
    "schedule.read": ["store", "own"],
  },
  "lider-setor": {
    "dashboard.read": ["department"],
    "feed.create": ["department"],
    "feed.moderate": ["department"],
    "feed.read": ["department", "store"],
    "media.read": ["department", "own"],
    "media.upload": ["department", "own"],
    "operations.summary.read": ["department"],
    "recognition.read": ["own", "department"],
    "recognition.send": ["department"],
    "schedule.publish": ["department"],
    "schedule.read": ["own", "department"],
  },
};

export function evaluateDomainPolicy(
  actor: DomainActor,
  request: DomainPolicyRequest,
): DomainPolicyDecision {
  const allowedScopes = domainPolicyMatrix[actor.role][request.action];

  if (allowedScopes.length === 0) {
    return {
      allowed: false,
      reason: "missing_permission",
    };
  }

  if (
    allowedScopes.some((scopeLevel) => isResourceAllowedForScopeLevel(actor, request.resource, scopeLevel))
  ) {
    return {
      allowed: true,
      reason: "allowed",
    };
  }

  return {
    allowed: false,
    reason: "outside_scope",
  };
}

export function validateSchedulePlan(
  shifts: readonly Shift[],
  coverageRequirements: readonly CoverageRequirement[],
): ScheduleValidationResult {
  const issues: ScheduleValidationIssue[] = [];
  let coverageGapCount = 0;
  let overlappingAssignmentCount = 0;

  for (const shift of shifts) {
    if (shift.endsAt.getTime() <= shift.startsAt.getTime()) {
      issues.push({
        code: "ends_before_start",
        message: "Shift ends before it starts.",
        shiftId: shift.id,
      });
    }
  }

  const shiftsByUser = new Map<string, Shift[]>();

  for (const shift of shifts) {
    const userShifts = shiftsByUser.get(shift.userId) ?? [];
    userShifts.push(shift);
    shiftsByUser.set(shift.userId, userShifts);
  }

  for (const userShifts of shiftsByUser.values()) {
    const orderedShifts = [...userShifts].sort(
      (left, right) => left.startsAt.getTime() - right.startsAt.getTime(),
    );

    for (let index = 0; index < orderedShifts.length - 1; index += 1) {
      const currentShift = orderedShifts[index];
      const nextShift = orderedShifts[index + 1];

      if (currentShift !== undefined && nextShift !== undefined && timeWindowsOverlap(currentShift, nextShift)) {
        overlappingAssignmentCount += 1;
        issues.push({
          code: "overlapping_shift",
          message: "A collaborator has overlapping shifts.",
          shiftId: nextShift.id,
        });
      }
    }
  }

  for (const coverageRequirement of coverageRequirements) {
      const coveredHeadcount = shifts.filter(
        (shift) =>
          shift.status === "published" &&
          shift.role === coverageRequirement.role &&
          sameOrganization(shift.scope, coverageRequirement.scope) &&
          isScopeCovered(shift.scope, coverageRequirement.scope) &&
          timeWindowsOverlap(shift, coverageRequirement),
      ).length;

    if (coveredHeadcount < coverageRequirement.requiredHeadcount) {
      coverageGapCount += 1;
      issues.push({
        code: "coverage_gap",
        coverageId: coverageRequirement.id,
        message: `Coverage gap for ${coverageRequirement.label}.`,
      });
    }
  }

  return {
    coverageGapCount,
    issues,
    overlappingAssignmentCount,
    valid: issues.length === 0,
  };
}

export function decideFeedModeration(
  post: FeedPost,
  actor: DomainActor,
  action: FeedModerationAction,
  now = new Date(),
): FeedModerationDecision {
  if (action === "submit") {
    if (post.authorUserId !== actor.userId) {
      return {
        allowed: false,
        reason: "author_only_action",
      };
    }

    const nextStatus: FeedPostStatus = actor.role === "colaborador" ? "pending_moderation" : "published";

    return {
      allowed: true,
      nextPost: updateFeedPost(post, {
        status: nextStatus,
        updatedAt: now,
        ...(nextStatus === "published" ? { publishedAt: now } : {}),
      }),
      reason: "allowed",
    };
  }

  const moderationDecision = evaluateDomainPolicy(actor, {
    action: "feed.moderate",
    resource: post.scope,
  });

  if (!moderationDecision.allowed) {
    return {
      allowed: false,
      reason: "missing_permission",
    };
  }

  if (post.status === "removed" && action !== "feature") {
    return {
      allowed: false,
      reason: "invalid_transition",
    };
  }

  switch (action) {
    case "approve":
      return {
        allowed: true,
        nextPost: updateFeedPost(post, {
          publishedAt: post.publishedAt ?? now,
          status: "published",
          updatedAt: now,
        }),
        reason: "allowed",
      };
    case "feature":
      return {
        allowed: true,
        nextPost: updateFeedPost(post, {
          featuredAt: now,
          publishedAt: post.publishedAt ?? now,
          status: "featured",
          updatedAt: now,
        }),
        reason: "allowed",
      };
    case "hide":
      return {
        allowed: true,
        nextPost: updateFeedPost(post, {
          status: "hidden",
          updatedAt: now,
        }),
        reason: "allowed",
      };
    case "pin":
      return {
        allowed: true,
        nextPost: updateFeedPost(post, {
          pinnedAt: now,
          publishedAt: post.publishedAt ?? now,
          status: post.status === "featured" ? "featured" : "published",
          updatedAt: now,
        }),
        reason: "allowed",
      };
    case "remove":
      return {
        allowed: true,
        nextPost: updateFeedPost(post, {
          status: "removed",
          updatedAt: now,
        }),
        reason: "allowed",
      };
  }
}

export function selectVisibleFeedPosts(
  posts: readonly FeedPost[],
  actor: DomainActor,
): readonly FeedPost[] {
  return [...posts]
    .filter((post) => isFeedPostVisibleToActor(post, actor))
    .sort((left, right) => {
      const leftTime = (left.featuredAt ?? left.pinnedAt ?? left.publishedAt ?? left.createdAt).getTime();
      const rightTime = (right.featuredAt ?? right.pinnedAt ?? right.publishedAt ?? right.createdAt).getTime();

      return rightTime - leftTime;
    });
}

export function isFeedPostVisibleToActor(post: FeedPost, actor: DomainActor): boolean {
  if (post.status === "draft") {
    return post.authorUserId === actor.userId;
  }

  if (post.status === "pending_moderation") {
    return post.authorUserId === actor.userId || canModerateFeed(actor, post.scope);
  }

  if (post.status === "hidden" || post.status === "removed") {
    return canModerateFeed(actor, post.scope);
  }

  if (!sameOrganization(actor.scope, post.scope)) {
    return false;
  }

  if (post.visibility === "organization") {
    return true;
  }

  if (post.visibility === "store") {
    return actor.scope.storeId !== undefined && actor.scope.storeId === post.scope.storeId;
  }

  if (post.visibility === "department") {
    return (
      actor.scope.storeId !== undefined &&
      actor.scope.departmentId !== undefined &&
      actor.scope.storeId === post.scope.storeId &&
      actor.scope.departmentId === post.scope.departmentId
    );
  }

  return post.authorUserId === actor.userId || canModerateFeed(actor, post.scope);
}

export function evaluateRewardGrant(input: {
  readonly actorUserId?: string;
  readonly existingEntries: readonly PointsLedgerEntry[];
  readonly occurredAt: Date;
  readonly recipientUserId: string;
  readonly rule: RewardRule;
  readonly scope: TenantScope;
  readonly sourceId?: string;
}): RewardGrantResult {
  const windowStart = new Date(
    input.occurredAt.getTime() - input.rule.windowDays * 24 * 60 * 60 * 1000,
  );
  const awardsInWindow = input.existingEntries.filter(
    (entry) =>
      entry.userId === input.recipientUserId &&
      entry.source === input.rule.source &&
      entry.occurredAt.getTime() >= windowStart.getTime(),
  ).length;

  if (awardsInWindow >= input.rule.maxAwardsPerWindow) {
    return {
      granted: false,
      reason: "window_limit_reached",
    };
  }

  if (
    input.sourceId !== undefined &&
    input.existingEntries.some(
      (entry) =>
        entry.userId === input.recipientUserId &&
        entry.source === input.rule.source &&
        entry.sourceId === input.sourceId,
    )
  ) {
    return {
      granted: false,
      reason: "duplicate_source",
    };
  }

  return {
    granted: true,
    ledgerEntry: createPointsLedgerEntry({
      amount: input.rule.points,
      id: `points_${input.rule.code}_${input.recipientUserId}_${input.occurredAt.getTime()}`,
      occurredAt: input.occurredAt,
      reason: input.rule.reason,
      scope: input.scope,
      source: input.rule.source,
      ...(input.actorUserId === undefined ? {} : { actorUserId: input.actorUserId }),
      ...(input.sourceId === undefined ? {} : { sourceId: input.sourceId }),
      userId: input.recipientUserId,
    }),
    reason: "granted",
  };
}

export function summarizeDashboardMetrics(input: {
  readonly attentionAreas: readonly AttentionArea[];
  readonly metrics: readonly MetricSnapshot[];
  readonly openModerationCount: number;
}): {
  readonly attentionAreaCount: number;
  readonly engagementRate: number;
  readonly openModerationCount: number;
  readonly scheduleGapCount: number;
} {
  const engagementRate = input.metrics.find((metric) => metric.key === "engagement_rate")?.value ?? 0;
  const scheduleGapCount = input.metrics.find((metric) => metric.key === "schedule_gap_count")?.value ?? 0;

  return {
    attentionAreaCount: input.attentionAreas.length,
    engagementRate,
    openModerationCount: input.openModerationCount,
    scheduleGapCount,
  };
}

function canModerateFeed(actor: DomainActor, scope: TenantScope): boolean {
  return evaluateDomainPolicy(actor, {
    action: "feed.moderate",
    resource: scope,
  }).allowed;
}

function isResourceAllowedForScopeLevel(
  actor: DomainActor,
  resource: ScopedResource,
  scopeLevel: DomainPolicyScopeLevel,
): boolean {
  if (scopeLevel === "own") {
    return resource.targetUserId === actor.userId || resource.ownerUserId === actor.userId;
  }

  const actorScopes = [actor.scope, ...(actor.additionalScopes ?? [])];

  return actorScopes.some((actorScope) => {
    if (!sameOrganization(actorScope, resource)) {
      return false;
    }

    if (scopeLevel === "organization") {
      return true;
    }

    if (scopeLevel === "store") {
      return actorScope.storeId !== undefined && actorScope.storeId === resource.storeId;
    }

    return isTenantScopeWithin(actorScope, resource, "department");
  });
}

function isScopeCovered(shiftScope: TenantScope, coverageScope: TenantScope): boolean {
  if (!sameOrganization(shiftScope, coverageScope)) {
    return false;
  }

  if (coverageScope.storeId !== undefined && shiftScope.storeId !== coverageScope.storeId) {
    return false;
  }

  if (coverageScope.departmentId !== undefined && shiftScope.departmentId !== coverageScope.departmentId) {
    return false;
  }

  return true;
}
