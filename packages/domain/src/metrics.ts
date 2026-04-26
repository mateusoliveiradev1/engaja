import {
  assertFiniteNumber,
  assertNonEmptyString,
  assertValidDate,
} from "./base.js";
import { type DomainId, type Entity, createDomainId } from "./ids.js";
import { type TenantScope } from "./scope.js";

export const attentionAreaSeverities = ["info", "warning", "critical"] as const;

export type AttentionAreaSeverity = (typeof attentionAreaSeverities)[number];

export interface MetricSnapshot extends Entity<DomainId<"metric">> {
  readonly capturedAt: Date;
  readonly key: string;
  readonly scope: TenantScope;
  readonly value: number;
}

export interface AttentionArea extends Entity<DomainId<"attention-area">> {
  readonly createdAt: Date;
  readonly description: string;
  readonly scope: TenantScope;
  readonly severity: AttentionAreaSeverity;
  readonly title: string;
}

export function createMetricSnapshot(input: {
  readonly capturedAt: Date;
  readonly id: string;
  readonly key: string;
  readonly scope: TenantScope;
  readonly value: number;
}): MetricSnapshot {
  return {
    capturedAt: assertValidDate(input.capturedAt, "capturedAt"),
    id: createDomainId<"metric">(assertNonEmptyString(input.id, "id")),
    key: assertNonEmptyString(input.key, "key"),
    scope: input.scope,
    value: assertFiniteNumber(input.value, "value"),
  };
}

export function createAttentionArea(input: {
  readonly createdAt: Date;
  readonly description: string;
  readonly id: string;
  readonly scope: TenantScope;
  readonly severity: AttentionAreaSeverity;
  readonly title: string;
}): AttentionArea {
  return {
    createdAt: assertValidDate(input.createdAt, "createdAt"),
    description: assertNonEmptyString(input.description, "description"),
    id: createDomainId<"attention-area">(assertNonEmptyString(input.id, "id")),
    scope: input.scope,
    severity: input.severity,
    title: assertNonEmptyString(input.title, "title"),
  };
}
