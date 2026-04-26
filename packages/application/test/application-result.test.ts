import { describe, expect, it } from "vitest";

import { createApiEnvelope } from "@engaja/contracts";
import { createDomainId } from "@engaja/domain";

import {
  assertApplicationUseCaseAuthorized,
  authorizeApplicationUseCase,
  createApplicationResult,
  type ActorContext,
} from "../src/index.js";

describe("createApplicationResult", () => {
  it("keeps request data tied to the actor context", () => {
    const actor: ActorContext = {
      role: "lider-setor" as const,
      scope: {
        organizationId: createDomainId<"organization">("org_1"),
        storeId: createDomainId<"store">("store_1"),
      },
      userId: createDomainId<"user">("user_1"),
    };

    expect(createApplicationResult(createApiEnvelope({ ok: true }, "req_1"), actor)).toEqual({
      actor,
      envelope: {
        data: { ok: true },
        requestId: "req_1",
      },
    });
  });

  it("authorizes use cases through shared security policies", () => {
    const actor: ActorContext = {
      role: "lider-setor",
      scope: {
        departmentId: createDomainId<"department">("dept_flv"),
        organizationId: createDomainId<"organization">("org_demo"),
        storeId: createDomainId<"store">("store_001"),
      },
      userId: createDomainId<"user">("user_lider"),
    };

    expect(
      authorizeApplicationUseCase(actor, {
        action: "feed.moderate",
        resource: {
          departmentId: "dept_flv",
          organizationId: "org_demo",
          storeId: "store_001",
        },
      }).decision.allowed,
    ).toBe(true);

    expect(() =>
      assertApplicationUseCaseAuthorized(actor, {
        action: "feed.moderate",
        resource: {
          departmentId: "dept_padaria",
          organizationId: "org_demo",
          storeId: "store_001",
        },
      }),
    ).toThrow("Action feed.moderate is not allowed.");
  });
});
