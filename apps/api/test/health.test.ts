import { describe, expect, it } from "vitest";

import {
  apiRouteModules,
  assertServerOnlyEnvironmentName,
  createApiApp,
  createApiHealthPayload,
  createApiReadinessPayload,
} from "../src/index.js";

describe("API foundation", () => {
  it("returns a typed health payload", () => {
    expect(createApiHealthPayload("req_api")).toEqual({
      data: {
        name: "@engaja/api",
        status: "ok",
        version: "0.2.0",
      },
      requestId: "req_api",
    });
  });

  it("registers modular route ownership for product capabilities", () => {
    expect(apiRouteModules.map((moduleDefinition) => moduleDefinition.name)).toEqual([
      "auth",
      "feed",
      "schedules",
      "operations",
      "recognition",
      "dashboard",
      "engagement",
      "media",
      "audit",
    ]);
  });

  it("serves contract-backed health through the Hono app", async () => {
    const response = await createApiApp().request("/health", {
      headers: {
        "x-request-id": "req_hono",
      },
    });

    await expect(response.json()).resolves.toEqual({
      data: {
        name: "@engaja/api",
        status: "ok",
        version: "0.2.0",
      },
      requestId: "req_hono",
    });
  });

  it("reports database readiness without exposing connection details", async () => {
    const response = await createApiApp({
      persistence: {
        mode: "database",
        provider: "local-postgres",
        readMigrationReadiness: () =>
          Promise.resolve({
            appliedCount: 4,
            current: true,
            driftedCount: 0,
            journalReady: true,
            latestMigration: "0004_persistent_runtime_records.sql",
            pendingCount: 0,
            provider: "local-postgres",
          }),
      },
    }).request("/ready", {
      headers: {
        "x-request-id": "req_ready",
      },
    });

    await expect(response.json()).resolves.toEqual({
      data: {
        database: {
          persistence: "database",
          provider: "local-postgres",
        },
        migrations: {
          appliedCount: 4,
          current: true,
          driftedCount: 0,
          journalReady: true,
          latestMigration: "0004_persistent_runtime_records.sql",
          pendingCount: 0,
        },
        status: "ready",
      },
      requestId: "req_ready",
    });
  });

  it("can create a memory readiness payload", async () => {
    await expect(
      createApiReadinessPayload("req_memory", {
        mode: "memory",
        provider: "memory",
      }),
    ).resolves.toEqual({
      data: {
        database: {
          persistence: "memory",
          provider: "memory",
        },
        status: "ready",
      },
      requestId: "req_memory",
    });
  });

  it("keeps server-only environment variables explicit", () => {
    expect(() => assertServerOnlyEnvironmentName("DATABASE_URL")).not.toThrow();
    expect(() => assertServerOnlyEnvironmentName("EXPO_PUBLIC_API_URL")).toThrow(
      "EXPO_PUBLIC_API_URL is not registered",
    );
  });
});
