import { describe, expect, it } from "vitest";

import {
  assertSafeClientEnvironment,
  createAuthAdapterFromEnvironment,
  createStructuredLogEvent,
  findUnexpectedMobilePublicEnvironmentNames,
  findServerOnlyClientEnvironmentNames,
  isServerOnlyEnvironmentName,
  loadDevelopmentPlatformConfig,
  redactError,
  redactSensitiveRecord,
  validateDevelopmentPlatformConfig,
  validateMobilePublicEnvironment,
  validateSecurityEnvironment,
} from "../src/index.js";

describe("server-only environment names", () => {
  it("classifies database and auth secrets as server-only", () => {
    expect(isServerOnlyEnvironmentName("DATABASE_URL")).toBe(true);
    expect(isServerOnlyEnvironmentName("AUTH_LOCAL_SECRET")).toBe(true);
    expect(isServerOnlyEnvironmentName("INVITE_TOKEN_SECRET")).toBe(true);
    expect(isServerOnlyEnvironmentName("SESSION_SECRET")).toBe(true);
  });

  it("allows Expo public variables", () => {
    expect(isServerOnlyEnvironmentName("EXPO_PUBLIC_API_URL")).toBe(false);
  });

  it("blocks server-only names from client environments", () => {
    expect(
      findServerOnlyClientEnvironmentNames({
        DATABASE_URL: "postgresql://example",
        EXPO_PUBLIC_API_URL: "http://localhost:3000",
      }),
    ).toEqual(["DATABASE_URL"]);
    expect(() =>
      assertSafeClientEnvironment({
        AUTH_LOCAL_SECRET: "secret",
      }),
    ).toThrow("Unsafe client environment variables");
  });

  it("validates required server secrets without exposing them to the client", () => {
    expect(
      validateSecurityEnvironment({
        clientEnv: {
          EXPO_PUBLIC_API_URL: "http://localhost:3000",
        },
        requiredServerNames: ["AUTH_LOCAL_SECRET"],
        serverEnv: {
          AUTH_LOCAL_SECRET: "replace-with-local-dev-value",
        },
      }),
    ).toEqual({
      errors: [],
      ok: true,
      warnings: ["AUTH_LOCAL_SECRET still uses a placeholder value."],
    });
  });

  it("requires real database and durable auth secrets when real providers are selected", () => {
    expect(
      validateSecurityEnvironment({
        serverEnv: {
          AUTH_LOCAL_SECRET: "replace-with-local-dev-value",
          AUTH_PROVIDER: "local-better-auth",
          DATABASE_PROVIDER: "neon",
          INVITE_TOKEN_SECRET: "replace-with-local-dev-value",
          NEON_DATABASE_URL: "postgresql://user:password@example.neon.tech/engaja",
          SESSION_SECRET: "replace-with-local-dev-value",
        },
      }),
    ).toEqual({
      errors: [],
      ok: true,
      warnings: [
        "AUTH_LOCAL_SECRET still uses a placeholder value.",
        "INVITE_TOKEN_SECRET still uses a placeholder value.",
        "SESSION_SECRET still uses a placeholder value.",
      ],
    });

    expect(
      validateSecurityEnvironment({
        serverEnv: {
          AUTH_PROVIDER: "local-better-auth",
          DATABASE_PROVIDER: "neon",
        },
      }).errors,
    ).toEqual([
      "AUTH_LOCAL_SECRET is required on the server.",
      "NEON_DATABASE_URL is required on the server.",
      "INVITE_TOKEN_SECRET is required on the server.",
      "SESSION_SECRET is required on the server.",
    ]);
  });

  it("validates the narrow Expo public environment surface", () => {
    expect(
      validateMobilePublicEnvironment({
        EXPO_PUBLIC_ANALYTICS_PROVIDER: "local-log",
        EXPO_PUBLIC_API_URL: "http://localhost:3000",
        EXPO_PUBLIC_APP_ENV: "development",
        EXPO_PUBLIC_ENABLE_MOCK_SESSION: "false",
      }),
    ).toEqual({
      errors: [],
      ok: true,
      warnings: [],
    });

    expect(
      findUnexpectedMobilePublicEnvironmentNames({
        EXPO_PUBLIC_API_URL: "http://localhost:3000",
        EXPO_PUBLIC_DATABASE_URL: "postgresql://example",
      }),
    ).toEqual(["EXPO_PUBLIC_DATABASE_URL"]);

    expect(
      validateMobilePublicEnvironment({
        DATABASE_URL: "postgresql://example",
        EXPO_PUBLIC_DATABASE_URL: "postgresql://example",
      }).errors,
    ).toEqual([
      "DATABASE_URL must not be exposed to the client environment.",
      "EXPO_PUBLIC_DATABASE_URL is not an approved mobile public environment variable.",
      "EXPO_PUBLIC_API_URL is required for the mobile app.",
    ]);
  });

  it("loads zero-cost provider defaults for local development", () => {
    expect(loadDevelopmentPlatformConfig({})).toEqual({
      allowMeteredProviders: false,
      analyticsProvider: "local-log",
      authProvider: "local-better-auth",
      buildProvider: "expo-local",
      ciProvider: "local",
      costGuardrailsEnabled: true,
      databaseProvider: "local-postgres",
      emailProvider: "console",
      monitoringProvider: "local-log",
      storageProvider: "local-filesystem",
    });
  });

  it("blocks metered providers unless they are intentionally enabled", () => {
    expect(
      validateDevelopmentPlatformConfig(
        loadDevelopmentPlatformConfig({
          STORAGE_PROVIDER: "cloudflare-r2",
        }),
      ),
    ).toEqual({
      errors: [
        "STORAGE_PROVIDER=cloudflare-r2 is metered or paid. Set ALLOW_METERED_PROVIDERS=true only when you intentionally want to use a paid/free-quota path.",
      ],
      ok: false,
      warnings: [],
    });
  });

  it("maps free auth providers to the adapter layer without changing consumers", async () => {
    const betterAuthAdapter = createAuthAdapterFromEnvironment({
      env: {
        AUTH_PROVIDER: "local-better-auth",
      },
    });
    const neonAuthAdapter = createAuthAdapterFromEnvironment({
      env: {
        AUTH_PROVIDER: "neon-auth",
      },
    });

    expect(betterAuthAdapter.provider).toBe("better-auth");
    expect(neonAuthAdapter.provider).toBe("neon-auth");
    await expect(neonAuthAdapter.verifySessionToken(undefined)).resolves.toEqual({
      code: "missing_token",
      ok: false,
    });
  });

  it("redacts secrets from records, errors and structured logs", () => {
    expect(
      redactSensitiveRecord({
        nested: {
          token: "dev:secret-token",
        },
        safe: "visible",
      }),
    ).toEqual({
      nested: {
        token: "[REDACTED]",
      },
      safe: "visible",
    });

    expect(redactError(new Error("DATABASE_URL leaked"))).toEqual({
      message: "Erro interno redigido.",
      name: "Error",
    });

    expect(
      createStructuredLogEvent({
        level: "error",
        message: "failed",
        metadata: {
          authorization: "Bearer secret",
        },
        requestId: "req_log",
        timestamp: new Date("2026-04-22T12:00:00.000Z"),
      }),
    ).toEqual({
      actor: undefined,
      level: "error",
      message: "failed",
      metadata: {
        authorization: "[REDACTED]",
      },
      requestId: "req_log",
      timestamp: "2026-04-22T12:00:00.000Z",
    });
  });
});
