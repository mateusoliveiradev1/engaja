import {
  assertNonEmptyString,
  createTimeWindow,
} from "./base.js";
import { type DomainId, type Entity, createDomainId } from "./ids.js";
import { type TenantScope } from "./scope.js";

export const completionStatuses = [
  "pending",
  "completed",
  "skipped",
  "blocked",
  "overdue",
] as const;

export type CompletionStatus = (typeof completionStatuses)[number];

export const operationRoutineIds = [
  "opening",
  "replenishment",
  "quality-review",
  "cleaning",
  "labels",
  "closing",
] as const;

export type OperationRoutineId = (typeof operationRoutineIds)[number];

export const evidenceRequirementModes = ["none", "optional", "required"] as const;

export type EvidenceRequirementMode = (typeof evidenceRequirementModes)[number];

export const issueSeverities = ["low", "medium", "high", "critical"] as const;

export type IssueSeverity = (typeof issueSeverities)[number];

export const issueStatuses = ["open", "in_review", "resolved", "cancelled"] as const;

export type IssueStatus = (typeof issueStatuses)[number];

export interface ChecklistRun extends Entity<DomainId<"checklist-run">> {
  readonly assignedUserId?: DomainId<"user">;
  readonly completedAt?: Date;
  readonly dueAt: Date;
  readonly pendingSync: boolean;
  readonly routineId: OperationRoutineId;
  readonly scope: TenantScope;
  readonly shiftId?: DomainId<"shift">;
  readonly status: CompletionStatus;
}

export interface ChecklistItemCompletion
  extends Entity<DomainId<"checklist-item-completion">> {
  readonly completedAt?: Date;
  readonly completedByUserId?: DomainId<"user">;
  readonly evidenceMode: EvidenceRequirementMode;
  readonly evidencePhotoUrl?: string;
  readonly itemId: string;
  readonly note?: string;
  readonly pendingSync: boolean;
  readonly runId: DomainId<"checklist-run">;
  readonly scope: TenantScope;
  readonly shiftId?: DomainId<"shift">;
  readonly status: CompletionStatus;
}

export interface OperationIssue extends Entity<DomainId<"issue">> {
  readonly category: string;
  readonly createdAt: Date;
  readonly evidencePhotoUrls: readonly string[];
  readonly note?: string;
  readonly pendingSync: boolean;
  readonly productName?: string;
  readonly quantity?: number;
  readonly reportedByUserId?: DomainId<"user">;
  readonly scope: TenantScope;
  readonly severity: IssueSeverity;
  readonly shiftId?: DomainId<"shift">;
  readonly status: IssueStatus;
}

export interface OperationLearningBite extends Entity<DomainId<"learning-bite">> {
  readonly completedAt?: Date;
  readonly completedByUserId?: DomainId<"user">;
  readonly description: string;
  readonly durationMinutes: number;
  readonly feedPostId?: DomainId<"feed-post">;
  readonly missionTitle?: string;
  readonly pendingSync: boolean;
  readonly pointsAwarded?: number;
  readonly scope: TenantScope;
  readonly standardId?: DomainId<"quality-standard">;
  readonly title: string;
}

export function createChecklistRun(input: {
  readonly assignedUserId?: string;
  readonly completedAt?: Date;
  readonly dueAt: Date;
  readonly id: string;
  readonly pendingSync: boolean;
  readonly routineId: OperationRoutineId;
  readonly scope: TenantScope;
  readonly shiftId?: string;
  readonly status: CompletionStatus;
}): ChecklistRun {
  const dueAt = input.completedAt === undefined ? input.dueAt : createTimeWindow(input.dueAt, input.completedAt).startsAt;

  return {
    ...(input.assignedUserId === undefined
      ? {}
      : { assignedUserId: createDomainId<"user">(assertNonEmptyString(input.assignedUserId, "assignedUserId")) }),
    ...(input.completedAt === undefined ? {} : { completedAt: input.completedAt }),
    dueAt,
    id: createDomainId<"checklist-run">(assertNonEmptyString(input.id, "id")),
    pendingSync: input.pendingSync,
    routineId: input.routineId,
    scope: input.scope,
    ...(input.shiftId === undefined
      ? {}
      : { shiftId: createDomainId<"shift">(assertNonEmptyString(input.shiftId, "shiftId")) }),
    status: input.status,
  };
}

export function createChecklistItemCompletion(input: {
  readonly completedAt?: Date;
  readonly completedByUserId?: string;
  readonly evidenceMode: EvidenceRequirementMode;
  readonly evidencePhotoUrl?: string;
  readonly id: string;
  readonly itemId: string;
  readonly note?: string;
  readonly pendingSync: boolean;
  readonly runId: string;
  readonly scope: TenantScope;
  readonly shiftId?: string;
  readonly status: CompletionStatus;
}): ChecklistItemCompletion {
  return {
    ...(input.completedAt === undefined ? {} : { completedAt: input.completedAt }),
    ...(input.completedByUserId === undefined
      ? {}
      : {
          completedByUserId: createDomainId<"user">(
            assertNonEmptyString(input.completedByUserId, "completedByUserId"),
          ),
        }),
    evidenceMode: input.evidenceMode,
    ...(input.evidencePhotoUrl === undefined ? {} : { evidencePhotoUrl: input.evidencePhotoUrl }),
    id: createDomainId<"checklist-item-completion">(
      assertNonEmptyString(input.id, "id"),
    ),
    itemId: assertNonEmptyString(input.itemId, "itemId"),
    ...(input.note === undefined ? {} : { note: input.note }),
    pendingSync: input.pendingSync,
    runId: createDomainId<"checklist-run">(assertNonEmptyString(input.runId, "runId")),
    scope: input.scope,
    ...(input.shiftId === undefined
      ? {}
      : { shiftId: createDomainId<"shift">(assertNonEmptyString(input.shiftId, "shiftId")) }),
    status: input.status,
  };
}

export function createOperationIssue(input: {
  readonly category: string;
  readonly createdAt: Date;
  readonly evidencePhotoUrls?: readonly string[];
  readonly id: string;
  readonly note?: string;
  readonly pendingSync?: boolean;
  readonly productName?: string;
  readonly quantity?: number;
  readonly reportedByUserId?: string;
  readonly scope: TenantScope;
  readonly severity: IssueSeverity;
  readonly shiftId?: string;
  readonly status: IssueStatus;
}): OperationIssue {
  if (input.quantity !== undefined && (!Number.isFinite(input.quantity) || input.quantity < 0)) {
    throw new Error("quantity must be a finite non-negative number.");
  }

  return {
    category: assertNonEmptyString(input.category, "category"),
    createdAt: input.createdAt,
    evidencePhotoUrls: [...(input.evidencePhotoUrls ?? [])],
    id: createDomainId<"issue">(assertNonEmptyString(input.id, "id")),
    ...(input.note === undefined ? {} : { note: input.note }),
    pendingSync: input.pendingSync ?? false,
    ...(input.productName === undefined ? {} : { productName: input.productName }),
    ...(input.quantity === undefined ? {} : { quantity: input.quantity }),
    ...(input.reportedByUserId === undefined
      ? {}
      : {
          reportedByUserId: createDomainId<"user">(
            assertNonEmptyString(input.reportedByUserId, "reportedByUserId"),
          ),
        }),
    scope: input.scope,
    severity: input.severity,
    ...(input.shiftId === undefined
      ? {}
      : { shiftId: createDomainId<"shift">(assertNonEmptyString(input.shiftId, "shiftId")) }),
    status: input.status,
  };
}

export function createOperationLearningBite(input: {
  readonly completedAt?: Date;
  readonly completedByUserId?: string;
  readonly description: string;
  readonly durationMinutes: number;
  readonly feedPostId?: string;
  readonly id: string;
  readonly missionTitle?: string;
  readonly pendingSync?: boolean;
  readonly pointsAwarded?: number;
  readonly scope: TenantScope;
  readonly standardId?: string;
  readonly title: string;
}): OperationLearningBite {
  if (!Number.isFinite(input.durationMinutes) || input.durationMinutes <= 0) {
    throw new Error("durationMinutes must be a finite positive number.");
  }

  if (
    input.pointsAwarded !== undefined &&
    (!Number.isFinite(input.pointsAwarded) || input.pointsAwarded < 0)
  ) {
    throw new Error("pointsAwarded must be a finite non-negative number.");
  }

  return {
    ...(input.completedAt === undefined ? {} : { completedAt: input.completedAt }),
    ...(input.completedByUserId === undefined
      ? {}
      : {
          completedByUserId: createDomainId<"user">(
            assertNonEmptyString(input.completedByUserId, "completedByUserId"),
          ),
        }),
    description: assertNonEmptyString(input.description, "description"),
    durationMinutes: input.durationMinutes,
    ...(input.feedPostId === undefined
      ? {}
      : {
          feedPostId: createDomainId<"feed-post">(
            assertNonEmptyString(input.feedPostId, "feedPostId"),
          ),
        }),
    id: createDomainId<"learning-bite">(assertNonEmptyString(input.id, "id")),
    ...(input.missionTitle === undefined ? {} : { missionTitle: input.missionTitle }),
    pendingSync: input.pendingSync ?? false,
    ...(input.pointsAwarded === undefined ? {} : { pointsAwarded: input.pointsAwarded }),
    scope: input.scope,
    ...(input.standardId === undefined
      ? {}
      : {
          standardId: createDomainId<"quality-standard">(
            assertNonEmptyString(input.standardId, "standardId"),
          ),
        }),
    title: assertNonEmptyString(input.title, "title"),
  };
}
