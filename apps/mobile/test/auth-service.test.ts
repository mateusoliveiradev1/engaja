import { describe, expect, it, vi } from "vitest";

import {
  createMemoryAuthStorage,
  createMobileAuthService,
} from "../src/index.js";

const oldSessionToken = ["sess", "old", "mobile", "fixture", "000000000000"].join("_");
const newSessionToken = ["sess", "new", "mobile", "fixture", "000000000000"].join("_");
const inviteToken = ["invite", "mobile", "fixture", "000000000000"].join("_");

describe("mobile auth service", () => {
  it("logs in with the API contract and maps the durable session", async () => {
    const fetcher = vi.fn<typeof fetch>(async (input, init) => {
      expect(urlFromInput(input).pathname).toBe("/auth/login");
      expect(init?.method).toBe("POST");
      expect(readJsonBody(init)).toMatchObject({
        email: "renata.lider@engaja.test",
      });

      return jsonResponse(createAuthSessionPayload(newSessionToken, "lider-setor"));
    });
    const service = createMobileAuthService({
      baseUrl: "https://api.engaja.test",
      fetcher,
    });

    await expect(
      service.login({
        deviceLabel: "Engaja mobile",
        email: "renata.lider@engaja.test",
        password: "SenhaSegura123!",
      }),
    ).resolves.toMatchObject({
      accessToken: newSessionToken,
      displayName: "Renata Prado",
      role: "lider-setor",
      userId: "user_lider",
    });
  });

  it("accepts an invite and returns the created collaborator session", async () => {
    const fetcher = vi.fn<typeof fetch>(async (input, init) => {
      expect(urlFromInput(input).pathname).toBe("/auth/invites/accept");
      expect(readJsonBody(init)).toMatchObject({
        email: "julia.colaborador@engaja.test",
        token: inviteToken,
      });

      return jsonResponse({
        invite: createInvitePayload("accepted"),
        session: createAuthSessionPayload(newSessionToken, "colaborador"),
      });
    });
    const service = createMobileAuthService({
      baseUrl: "https://api.engaja.test",
      fetcher,
    });

    await expect(
      service.acceptInvite({
        displayName: "Julia Lima",
        email: "julia.colaborador@engaja.test",
        password: "SenhaSegura123!",
        token: inviteToken,
      }),
    ).resolves.toMatchObject({
      accessToken: newSessionToken,
      role: "colaborador",
    });
  });

  it("refreshes a stored session token and logs out with authorization", async () => {
    const requestedPaths: string[] = [];
    const fetcher = vi.fn<typeof fetch>(async (input, init) => {
      const url = urlFromInput(input);

      requestedPaths.push(url.pathname);
      expect(new Headers(init?.headers).get("authorization")).toBe(`Bearer ${oldSessionToken}`);

      if (url.pathname === "/auth/session/refresh") {
        return jsonResponse(createAuthSessionPayload(newSessionToken, "gerente-loja"));
      }

      if (url.pathname === "/auth/logout") {
        return jsonResponse({
          revoked: true,
        });
      }

      return errorResponse("not_found", "Rota nao encontrada.", 404);
    });
    const service = createMobileAuthService({
      baseUrl: "https://api.engaja.test",
      fetcher,
    });

    await expect(service.refreshSession(oldSessionToken)).resolves.toMatchObject({
      accessToken: newSessionToken,
      role: "gerente-loja",
    });
    await expect(service.logout(oldSessionToken)).resolves.toBeUndefined();
    expect(requestedPaths).toEqual(["/auth/session/refresh", "/auth/logout"]);
  });

  it("stores and clears the mobile session token through the storage contract", async () => {
    const storage = createMemoryAuthStorage(oldSessionToken);

    await expect(storage.getSessionToken()).resolves.toBe(oldSessionToken);
    await storage.setSessionToken(newSessionToken);
    expect(storage.read()).toBe(newSessionToken);
    await storage.clearSessionToken();
    await expect(storage.getSessionToken()).resolves.toBeUndefined();
  });
});

function createAuthSessionPayload(
  sessionToken: string,
  role: "colaborador" | "gerente-loja" | "lider-setor",
) {
  return {
    expiresAt: "2026-05-08T12:00:00.000Z",
    sessionToken,
    user: {
      displayName: role === "colaborador" ? "Julia Lima" : "Renata Prado",
      id: role === "colaborador" ? "user_colaborador" : "user_lider",
      role,
      scope: {
        departmentId: "dept_flv",
        organizationId: "org_demo",
        storeId: "store_001",
      },
    },
  };
}

function createInvitePayload(status: "accepted" | "pending") {
  return {
    acceptedAt: status === "accepted" ? "2026-04-24T12:05:00.000Z" : undefined,
    acceptedByUserId: status === "accepted" ? "user_colaborador" : undefined,
    createdAt: "2026-04-24T12:00:00.000Z",
    delivery: {
      channel: "manual",
      inviteUrl: "https://app.engaja.test/convite?convite=abc",
    },
    email: "julia.colaborador@engaja.test",
    expiresAt: "2026-05-08T12:00:00.000Z",
    id: "invite_mobile",
    invitedByUserId: "user_lider",
    resendCount: 0,
    role: "colaborador",
    scope: {
      departmentId: "dept_flv",
      organizationId: "org_demo",
      storeId: "store_001",
    },
    status,
    updatedAt: "2026-04-24T12:05:00.000Z",
  };
}

function jsonResponse(data: unknown): Response {
  return new Response(
    JSON.stringify({
      data,
      requestId: "req_mobile_auth",
    }),
    {
      headers: {
        "content-type": "application/json",
      },
      status: 200,
    },
  );
}

function errorResponse(code: string, message: string, status: number): Response {
  return new Response(
    JSON.stringify({
      error: {
        code,
        message,
      },
      requestId: "req_mobile_auth",
    }),
    {
      headers: {
        "content-type": "application/json",
      },
      status,
    },
  );
}

function urlFromInput(input: Parameters<typeof fetch>[0]): URL {
  if (typeof input === "string") {
    return new URL(input);
  }

  if (input instanceof URL) {
    return input;
  }

  return new URL(input.url);
}

function readJsonBody(init: RequestInit | undefined): unknown {
  if (typeof init?.body !== "string") {
    throw new Error("Expected JSON string request body.");
  }

  return JSON.parse(init.body) as unknown;
}
