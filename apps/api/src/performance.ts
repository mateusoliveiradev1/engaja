import type { SecurityActor, StructuredLogEvent } from "@engaja/security";

import { createStructuredLogEvent } from "@engaja/security";

export const apiPerformanceOperationBudgets = {
  "dashboard.filters": 320,
  "feed.pagination": 220,
  "permission.check": 18,
  "schedule.lookup": 260,
} as const;

export type ApiPerformanceOperation = keyof typeof apiPerformanceOperationBudgets;

export async function profileApiOperation<TData>(
  input: {
    readonly actor?: SecurityActor;
    readonly logger: (event: StructuredLogEvent) => void;
    readonly metadata?: Readonly<Record<string, unknown>>;
    readonly now: () => Date;
    readonly operation: ApiPerformanceOperation;
    readonly requestId: string;
  },
  handler: () => Promise<TData> | TData,
): Promise<TData> {
  const startedAt = Date.now();
  let status: "error" | "ok" = "ok";

  try {
    return await handler();
  } catch (error) {
    status = "error";
    throw error;
  } finally {
    const durationMs = Math.max(0, Date.now() - startedAt);
    const budgetMs = apiPerformanceOperationBudgets[input.operation];

    input.logger(
      createStructuredLogEvent({
        ...(input.actor === undefined ? {} : { actor: input.actor }),
        level: durationMs > budgetMs || status === "error" ? "warn" : "info",
        message: "API performance profile.",
        metadata: {
          ...(input.metadata ?? {}),
          budgetMs,
          durationMs,
          operation: input.operation,
          status,
        },
        requestId: input.requestId,
        timestamp: input.now(),
      }),
    );
  }
}
