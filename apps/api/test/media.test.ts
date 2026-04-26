import { Buffer } from "node:buffer";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  createDevelopmentSessionToken,
  developmentSessionTokens,
  type SecurityActor,
} from "@engaja/security";

import { createApiApp, createApiAppFromEnvironment } from "../src/index.js";

const transparentPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO1ePp4AAAAASUVORK5CYII=",
  "base64",
);

describe("media upload and private access flow", () => {
  it("rejects unsupported MIME types at upload-intent creation", async () => {
    const response = await createApiApp().request("/media/upload-intents", {
      body: JSON.stringify({
        contentLength: 512,
        contentType: "application/pdf",
        targetContext: "feed-post",
      }),
      headers: {
        authorization: `Bearer ${developmentSessionTokens.colaborador}`,
        "content-type": "application/json",
        "x-request-id": "req_invalid_media_type",
      },
      method: "POST",
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "bad_request",
        message: "Requisicao invalida.",
      },
      requestId: "req_invalid_media_type",
    });
  });

  it("rejects oversized uploads before creating the intent", async () => {
    const response = await createApiApp().request("/media/upload-intents", {
      body: JSON.stringify({
        contentLength: 10_000_001,
        contentType: "image/png",
        targetContext: "feed-post",
      }),
      headers: {
        authorization: `Bearer ${developmentSessionTokens.colaborador}`,
        "content-type": "application/json",
        "x-request-id": "req_oversized_intent",
      },
      method: "POST",
    });

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "payload_too_large",
        message: "Arquivo acima do limite permitido.",
      },
      requestId: "req_oversized_intent",
    });
  });

  it("prevents another collaborator from uploading content to someone else's intent", async () => {
    const app = createApiApp();
    const intentId = await createUploadIntent(app, developmentSessionTokens.colaborador);
    const intruderToken = createToken({
      role: "colaborador",
      scope: {
        departmentId: "dept_flv",
        organizationId: "org_demo",
        storeId: "store_001",
      },
      userId: "user_intruder",
    });
    const response = await app.request(`/media/upload-intents/${intentId}/content`, {
      body: transparentPng,
      headers: {
        authorization: `Bearer ${intruderToken}`,
        "content-type": "image/png",
        "x-request-id": "req_cross_user_upload",
      },
      method: "PUT",
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "not_found_or_forbidden",
        message: "Recurso nao encontrado ou sem permissao.",
      },
      requestId: "req_cross_user_upload",
    });
  });

  it("rejects duplicate finalization for the same upload intent", async () => {
    const app = createApiApp();
    const intentId = await createUploadIntent(app, developmentSessionTokens.colaborador);
    await uploadIntentContent(app, intentId, developmentSessionTokens.colaborador);

    const firstResponse = await finalizeIntent(app, intentId, developmentSessionTokens.colaborador, "req_finalize_once");

    expect(firstResponse.status).toBe(200);

    const duplicateResponse = await finalizeIntent(
      app,
      intentId,
      developmentSessionTokens.colaborador,
      "req_finalize_duplicate",
    );

    expect(duplicateResponse.status).toBe(409);
    await expect(duplicateResponse.json()).resolves.toEqual({
      error: {
        code: "duplicate_finalization",
        message: "Upload ja finalizado.",
      },
      requestId: "req_finalize_duplicate",
    });
  });

  it("serves finalized private media only to the owner or authorized users", async () => {
    const app = createApiApp();
    const intentId = await createUploadIntent(app, developmentSessionTokens.colaborador);

    await uploadIntentContent(app, intentId, developmentSessionTokens.colaborador);

    const finalizedResponse = await finalizeIntent(
      app,
      intentId,
      developmentSessionTokens.colaborador,
      "req_finalize_private_media",
    );
    const finalizedPayload = (await finalizedResponse.json()) as {
      data: {
        id: string;
      };
    };
    const ownerReadResponse = await app.request(
      `/media/objects/${finalizedPayload.data.id}/content`,
      {
        headers: {
          authorization: `Bearer ${developmentSessionTokens.colaborador}`,
          "x-request-id": "req_owner_private_media",
        },
      },
    );
    const otherCollaboratorToken = createToken({
      role: "colaborador",
      scope: {
        departmentId: "dept_flv",
        organizationId: "org_demo",
        storeId: "store_001",
      },
      userId: "user_same_department_other_collaborator",
    });
    const deniedReadResponse = await app.request(
      `/media/objects/${finalizedPayload.data.id}/content`,
      {
        headers: {
          authorization: `Bearer ${otherCollaboratorToken}`,
          "x-request-id": "req_denied_private_media",
        },
      },
    );

    expect(ownerReadResponse.status).toBe(200);
    expect(Buffer.from(await ownerReadResponse.arrayBuffer()).equals(transparentPng)).toBe(true);
    expect(deniedReadResponse.status).toBe(404);
    await expect(deniedReadResponse.json()).resolves.toEqual({
      error: {
        code: "not_found_or_forbidden",
        message: "Recurso nao encontrado ou sem permissao.",
      },
      requestId: "req_denied_private_media",
    });
  });

  it("uses local filesystem storage when the API is configured from the development environment", async () => {
    const storageRoot = await mkdtemp(join(tmpdir(), "engaja-api-media-"));

    try {
      const app = createApiAppFromEnvironment({
        env: {
          AUTH_LOCAL_SECRET: "local-secret",
          AUTH_PROVIDER: "local-better-auth",
          INVITE_TOKEN_SECRET: "local-invite-secret",
          LOCAL_STORAGE_DIR: storageRoot,
          SESSION_SECRET: "local-session-secret",
          STORAGE_PROVIDER: "local-filesystem",
        },
      });
      const response = await app.request("/media/upload-intents", {
        body: JSON.stringify({
          contentLength: transparentPng.byteLength,
          contentType: "image/png",
          targetContext: "feed-post",
        }),
        headers: {
          authorization: `Bearer ${developmentSessionTokens.colaborador}`,
          "content-type": "application/json",
          "x-request-id": "req_local_filesystem_intent",
        },
        method: "POST",
      });
      const payload = (await response.json()) as {
        data: {
          intentId: string;
          storageKey: string;
        };
      };

      expect(response.status).toBe(200);

      await uploadIntentContent(app, payload.data.intentId, developmentSessionTokens.colaborador);

      await expect(
        readFile(join(storageRoot, ...payload.data.storageKey.split("/"))),
      ).resolves.toBeDefined();
    } finally {
      await rm(storageRoot, { force: true, recursive: true });
    }
  });
});

async function createUploadIntent(app: ReturnType<typeof createApiApp>, token: string): Promise<string> {
  const response = await app.request("/media/upload-intents", {
    body: JSON.stringify({
      contentLength: transparentPng.byteLength,
      contentType: "image/png",
      targetContext: "feed-post",
    }),
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "x-request-id": "req_create_upload_intent",
    },
    method: "POST",
  });
  const payload = (await response.json()) as {
    data: {
      intentId: string;
    };
  };

  expect(response.status).toBe(200);

  return payload.data.intentId;
}

async function uploadIntentContent(
  app: ReturnType<typeof createApiApp>,
  intentId: string,
  token: string,
): Promise<void> {
  const response = await app.request(`/media/upload-intents/${intentId}/content`, {
    body: transparentPng,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "image/png",
      "x-request-id": "req_upload_content",
    },
    method: "PUT",
  });

  expect(response.status).toBe(204);
}

function finalizeIntent(
  app: ReturnType<typeof createApiApp>,
  intentId: string,
  token: string,
  requestId: string,
): Promise<Response> {
  return Promise.resolve(
    app.request("/media/finalizations", {
      body: JSON.stringify({
        intentId,
      }),
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        "x-request-id": requestId,
      },
      method: "POST",
    }),
  );
}

function createToken(actor: SecurityActor): string {
  return createDevelopmentSessionToken(actor);
}
