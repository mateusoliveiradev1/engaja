import { describe, expect, it } from "vitest";

import {
  createInMemoryAuthRepository,
  type AccessInviteRecord,
  type AuthCredentialRecord,
  type AuthMembershipRecord,
  type AuthUserRecord,
} from "@engaja/data";
import {
  generateInviteToken,
  hashPassword,
  InMemoryAuditLogSink,
} from "@engaja/security";

import { createApiApp } from "../src/index.js";

const now = new Date("2026-04-24T12:00:00.000Z");
const sessionSecret = "test-session-secret-value";
const inviteSecret = "test-invite-secret-value";
const password = "SenhaSegura123!";

describe("auth and invite API", () => {
  it("rejects invalid login and audits the failed attempt", async () => {
    const { app, auditSink } = await createAuthTestApp();
    const response = await app.request("/auth/login", {
      body: JSON.stringify({
        email: "rafael.lider@engaja.test",
        password: "SenhaErrada123!",
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req_invalid_login",
      },
      method: "POST",
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "invalid_credentials",
      },
      requestId: "req_invalid_login",
    });
    expect(auditSink.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "auth.login_failure",
          targetType: "auth_credential",
        }),
      ]),
    );
  });

  it("rate-limits repeated invalid login attempts", async () => {
    const { app } = await createAuthTestApp();
    const request = {
      body: JSON.stringify({
        email: "rafael.lider@engaja.test",
        password: "SenhaErrada123!",
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    };

    for (let index = 0; index < 5; index += 1) {
      expect((await app.request("/auth/login", request)).status).toBe(401);
    }

    expect((await app.request("/auth/login", request)).status).toBe(429);
  });

  it("denies collaborator invite creation", async () => {
    const { app, auditSink } = await createAuthTestApp();
    const sessionToken = await login(app, "camila.colaborador@engaja.test");
    const response = await app.request("/auth/invites", {
      body: JSON.stringify({
        email: "novo.colaborador@engaja.test",
        role: "colaborador",
        scope: {
          departmentId: "dept_flv",
          organizationId: "org_demo",
          storeId: "store_001",
        },
      }),
      headers: {
        authorization: `Bearer ${sessionToken}`,
        "content-type": "application/json",
        "x-request-id": "req_forbidden_invite",
      },
      method: "POST",
    });

    expect(response.status).toBe(403);
    expect(auditSink.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "security.deny",
          actorUserId: "user_colaborador",
          metadata: expect.objectContaining({
            deniedAction: "invite.create",
          }),
        }),
      ]),
    );
  });

  it("blocks expired invite acceptance", async () => {
    const inviteToken = generateInviteToken({ inviteSecret });
    const { app } = await createAuthTestApp({
      invites: [
        createInviteRecord({
          expiresAt: new Date("2026-04-23T12:00:00.000Z"),
          status: "pending",
          tokenHash: inviteToken.tokenHash,
        }),
      ],
    });
    const response = await acceptInvite(app, inviteToken.token);

    expect(response.status).toBe(410);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "invite_expired",
      },
    });
  });

  it("blocks invite reuse", async () => {
    const inviteToken = generateInviteToken({ inviteSecret });
    const { app } = await createAuthTestApp({
      invites: [
        createInviteRecord({
          acceptedAt: now,
          acceptedByUserId: "user_existing",
          expiresAt: new Date("2026-04-25T12:00:00.000Z"),
          status: "accepted",
          tokenHash: inviteToken.tokenHash,
        }),
      ],
    });
    const response = await acceptInvite(app, inviteToken.token);

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "invite_used",
      },
    });
  });

  it("blocks revoked invite acceptance", async () => {
    const { app } = await createAuthTestApp();
    const sessionToken = await login(app, "rafael.lider@engaja.test");
    const createResponse = await app.request("/auth/invites", {
      body: JSON.stringify({
        email: "novo.colaborador@engaja.test",
        role: "colaborador",
        scope: {
          departmentId: "dept_flv",
          organizationId: "org_demo",
          storeId: "store_001",
        },
      }),
      headers: {
        authorization: `Bearer ${sessionToken}`,
        "content-type": "application/json",
      },
      method: "POST",
    });
    const createPayload = (await createResponse.json()) as {
      readonly data: {
        readonly delivery: {
          readonly token: string;
        };
        readonly id: string;
      };
    };

    const revokeResponse = await app.request("/auth/invites/revoke", {
      body: JSON.stringify({
        inviteId: createPayload.data.id,
      }),
      headers: {
        authorization: `Bearer ${sessionToken}`,
        "content-type": "application/json",
      },
      method: "POST",
    });
    const acceptResponse = await acceptInvite(app, createPayload.data.delivery.token);

    expect(createResponse.status).toBe(200);
    expect(revokeResponse.status).toBe(200);
    expect(acceptResponse.status).toBe(410);
    await expect(acceptResponse.json()).resolves.toMatchObject({
      error: {
        code: "invite_revoked",
      },
    });
  });

  it("smokes leader login, collaborator invite acceptance, session restore and logout", async () => {
    const { app, auditSink } = await createAuthTestApp();
    const leaderSessionToken = await login(app, "rafael.lider@engaja.test");
    const inviteResponse = await app.request("/auth/invites", {
      body: JSON.stringify({
        email: "novo.colaborador@engaja.test",
        role: "colaborador",
        scope: {
          departmentId: "dept_flv",
          organizationId: "org_demo",
          storeId: "store_001",
        },
      }),
      headers: {
        authorization: `Bearer ${leaderSessionToken}`,
        "content-type": "application/json",
        "x-request-id": "req_smoke_invite_create",
      },
      method: "POST",
    });
    const invitePayload = (await inviteResponse.json()) as {
      readonly data: {
        readonly delivery: {
          readonly token: string;
        };
      };
    };

    const acceptResponse = await acceptInvite(app, invitePayload.data.delivery.token);
    const acceptPayload = (await acceptResponse.json()) as {
      readonly data: {
        readonly invite: {
          readonly status: string;
        };
        readonly session: {
          readonly sessionToken: string;
          readonly user: {
            readonly role: string;
          };
        };
      };
    };
    const collaboratorSession = acceptPayload.data.session.sessionToken;
    const restoreResponse = await app.request("/auth/session", {
      headers: {
        authorization: `Bearer ${collaboratorSession}`,
        "x-request-id": "req_smoke_session_restore",
      },
    });
    const logoutResponse = await app.request("/auth/logout", {
      headers: {
        authorization: `Bearer ${collaboratorSession}`,
        "x-request-id": "req_smoke_logout",
      },
      method: "POST",
    });
    const postLogoutSessionResponse = await app.request("/auth/session", {
      headers: {
        authorization: `Bearer ${collaboratorSession}`,
      },
    });

    expect(inviteResponse.status).toBe(200);
    expect(acceptResponse.status).toBe(200);
    expect(acceptPayload.data).toMatchObject({
      invite: {
        status: "accepted",
      },
      session: {
        user: {
          role: "colaborador",
        },
      },
    });
    expect(restoreResponse.status).toBe(200);
    await expect(restoreResponse.json()).resolves.toMatchObject({
      data: {
        role: "colaborador",
      },
      requestId: "req_smoke_session_restore",
    });
    expect(logoutResponse.status).toBe(200);
    await expect(logoutResponse.json()).resolves.toMatchObject({
      data: {
        revoked: true,
      },
      requestId: "req_smoke_logout",
    });
    expect(postLogoutSessionResponse.status).toBe(401);
    expect(auditSink.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: "invite.create" }),
        expect.objectContaining({ action: "invite.accept" }),
        expect.objectContaining({ action: "auth.logout" }),
      ]),
    );
  });
});

async function createAuthTestApp(input: {
  readonly invites?: readonly AccessInviteRecord[];
} = {}) {
  const passwordHash = await hashPassword(password, {
    salt: "auth-invites-test",
  });
  const users = createUsers();
  const credentials = users.map((user) => createCredentialRecord(user, passwordHash));
  const memberships = createMemberships();
  const authRepository = createInMemoryAuthRepository({
    credentials,
    invites: input.invites ?? [],
    memberships,
    users,
  });
  const auditSink = new InMemoryAuditLogSink();
  const app = createApiApp({
    auditSink,
    authRepository,
    inviteBaseUrl: "https://app.engaja.test/convite",
    inviteSecret,
    now: () => now,
    sessionSecret,
  });

  return {
    app,
    auditSink,
  };
}

async function login(app: ReturnType<typeof createApiApp>, email: string): Promise<string> {
  const response = await app.request("/auth/login", {
    body: JSON.stringify({
      email,
      password,
    }),
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
  });
  const payload = (await response.json()) as {
    readonly data: {
      readonly sessionToken: string;
    };
  };

  expect(response.status).toBe(200);

  return payload.data.sessionToken;
}

async function acceptInvite(app: ReturnType<typeof createApiApp>, token: string): Promise<Response> {
  return app.request("/auth/invites/accept", {
    body: JSON.stringify({
      displayName: "Novo Colaborador",
      email: "novo.colaborador@engaja.test",
      password,
      token,
    }),
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
  });
}

function createUsers(): readonly AuthUserRecord[] {
  return [
    {
      active: true,
      createdAt: now,
      displayName: "Rafael Lider",
      email: "rafael.lider@engaja.test",
      id: "user_lider",
      updatedAt: now,
    },
    {
      active: true,
      createdAt: now,
      displayName: "Camila Colaboradora",
      email: "camila.colaborador@engaja.test",
      id: "user_colaborador",
      updatedAt: now,
    },
  ];
}

function createCredentialRecord(
  user: AuthUserRecord,
  passwordHash: string,
): AuthCredentialRecord {
  return {
    createdAt: now,
    email: user.email,
    failedAttemptCount: 0,
    id: `credential_${user.id}`,
    passwordHash,
    passwordHashVersion: "scrypt",
    status: "active",
    updatedAt: now,
    user,
    userId: user.id,
  };
}

function createMemberships(): readonly AuthMembershipRecord[] {
  return [
    {
      createdAt: now,
      departmentId: "dept_flv",
      id: "membership_lider",
      organizationId: "org_demo",
      roleCode: "lider-setor",
      roleId: "role_lider-setor",
      status: "active",
      storeId: "store_001",
      updatedAt: now,
      userId: "user_lider",
    },
    {
      createdAt: now,
      departmentId: "dept_flv",
      id: "membership_colaborador",
      organizationId: "org_demo",
      roleCode: "colaborador",
      roleId: "role_colaborador",
      status: "active",
      storeId: "store_001",
      updatedAt: now,
      userId: "user_colaborador",
    },
  ];
}

function createInviteRecord(
  input: Pick<AccessInviteRecord, "expiresAt" | "status" | "tokenHash"> &
    Partial<Pick<AccessInviteRecord, "acceptedAt" | "acceptedByUserId">>,
): AccessInviteRecord {
  return {
    createdAt: now,
    deliveryChannel: "manual",
    departmentId: "dept_flv",
    email: "novo.colaborador@engaja.test",
    expiresAt: input.expiresAt,
    id: "invite_test",
    intendedMembership: {
      departmentId: "dept_flv",
      organizationId: "org_demo",
      roleCode: "colaborador",
      storeId: "store_001",
    },
    invitedByUserId: "user_lider",
    metadata: {},
    organizationId: "org_demo",
    resendCount: 0,
    roleCode: "colaborador",
    roleId: "role_colaborador",
    status: input.status,
    storeId: "store_001",
    tokenHash: input.tokenHash,
    updatedAt: now,
    ...(input.acceptedAt === undefined ? {} : { acceptedAt: input.acceptedAt }),
    ...(input.acceptedByUserId === undefined
      ? {}
      : { acceptedByUserId: input.acceptedByUserId }),
  };
}
