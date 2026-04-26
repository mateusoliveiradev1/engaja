import { describe, expect, it } from "vitest";

import {
  createAuditEvent,
  createDevelopmentAuthAdapter,
  createDevelopmentSessionToken,
  developmentActors,
  developmentSessionTokens,
  extractBearerToken,
  InMemoryAuditLogSink,
  InMemoryRateLimiter,
  parseDevelopmentSessionToken,
  shouldAuditAction,
} from "../src/index.js";

describe("auth provider adapter", () => {
  it("verifies local development tokens without provider lock-in", async () => {
    const adapter = createDevelopmentAuthAdapter();
    const sessionCredential = createDevelopmentSessionToken(developmentActors["lider-setor"]);

    await expect(adapter.verifySessionToken(sessionCredential)).resolves.toMatchObject({
      ok: true,
      session: {
        actor: {
          role: "lider-setor",
          userId: "user_demo_lider",
        },
        provider: "local-development",
      },
    });
    expect(parseDevelopmentSessionToken(developmentSessionTokens.colaborador)?.role).toBe(
      "colaborador",
    );
  });

  it("keeps missing-token fallback explicit for development-only session reads", async () => {
    await expect(createDevelopmentAuthAdapter().verifySessionToken(undefined)).resolves.toEqual({
      code: "missing_token",
      ok: false,
    });

    await expect(
      createDevelopmentAuthAdapter({ allowMissingToken: true }).verifySessionToken(undefined),
    ).resolves.toMatchObject({
      ok: true,
      session: {
        actor: {
          role: "colaborador",
        },
      },
    });
  });

  it("extracts bearer tokens from authorization headers", () => {
    expect(extractBearerToken("Bearer dev:token")).toBe("dev:token");
    expect(extractBearerToken("Basic abc")).toBeUndefined();
  });
});

describe("audit log and rate limit helpers", () => {
  it("appends immutable audit events for sensitive actions", () => {
    const sink = new InMemoryAuditLogSink();
    const event = createAuditEvent({
      action: "permissions.change",
      actor: developmentActors["admin-organizacao"],
      createdAt: new Date("2026-04-22T12:00:00.000Z"),
      newState: {
        role: "lider-setor",
      },
      previousState: {
        role: "colaborador",
      },
      requestId: "req_audit",
      targetId: "membership_001",
      targetType: "membership",
    });

    sink.append(event);

    expect(shouldAuditAction("permissions.change")).toBe(true);
    expect(shouldAuditAction("engagement.archive.read")).toBe(true);
    expect(shouldAuditAction("invite.create")).toBe(true);
    expect(shouldAuditAction("invite.resend")).toBe(true);
    expect(shouldAuditAction("invite.revoke")).toBe(true);
    expect(shouldAuditAction("invite.accept")).toBe(true);
    expect(shouldAuditAction("auth.login_failure")).toBe(true);
    expect(shouldAuditAction("auth.logout")).toBe(true);
    expect(shouldAuditAction("auth.role_scope.change")).toBe(true);
    expect(sink.events).toHaveLength(1);
    expect(sink.events[0]).toMatchObject({
      action: "permissions.change",
      actorUserId: "user_demo_admin",
      requestId: "req_audit",
      targetType: "membership",
    });
    expect(Object.isFrozen(sink.events[0])).toBe(true);
  });

  it("limits repeated upload attempts by actor and policy", () => {
    const limiter = new InMemoryRateLimiter();
    const now = new Date("2026-04-22T12:00:00.000Z");

    for (let index = 0; index < 8; index += 1) {
      expect(limiter.consume("media.upload", "user_demo", now).allowed).toBe(true);
    }

    expect(limiter.consume("media.upload", "user_demo", now)).toMatchObject({
      allowed: false,
      limit: 8,
      remaining: 0,
    });
  });
});
