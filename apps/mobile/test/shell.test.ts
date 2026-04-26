import { describe, expect, it } from "vitest";

import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  assertMobileBundleSafety,
  assertMobilePublicEnvironmentSafety,
  canAccessRouteGroup,
  createMobileAnalyticsEmitter,
  createMobileShellDescriptor,
  developmentBuildCapabilities,
  getHomeHrefForSession,
  getPrimaryAccentHex,
} from "../src/index.js";

describe("mobile shell foundation", () => {
  it("starts with API-only data access and FLV accent tokens", () => {
    expect(createMobileShellDescriptor("http://localhost:3000")).toEqual({
      apiUrl: "http://localhost:3000",
      brand: {
        appName: "Engaja FLV",
        iconSafeAreaPercent: 82,
        wordmark: "Engaja",
      },
      dataAdapter: {
        kind: "api",
        serverOnly: false,
      },
      nativeCapabilities: ["camera", "media-picker", "secure-storage", "push-notifications"],
      primaryAccent: "leaf",
      protectedRouteGroups: ["(collaborator)", "(leader)"],
    });
    expect(getPrimaryAccentHex()).toBe("#2F7D32");
  });

  it("protects leader routes from collaborator sessions", () => {
    expect(canAccessRouteGroup({ role: "colaborador" }, "leader")).toEqual({
      allowed: false,
      redirectTo: "/(collaborator)",
    });
    expect(canAccessRouteGroup({ role: "lider-setor" }, "leader").allowed).toBe(true);
    expect(canAccessRouteGroup({ role: "auditor" }, "leader")).toEqual({
      allowed: false,
      redirectTo: "/(collaborator)",
    });
    expect(getHomeHrefForSession({ role: "gerente-loja" })).toBe("/(leader)");
  });

  it("declares native capabilities that require development builds", () => {
    expect(developmentBuildCapabilities.map((capability) => capability.packageName)).toEqual([
      "expo-camera",
      "expo-image-picker",
      "expo-secure-store",
      "expo-notifications",
    ]);
  });

  it("keeps database drivers and Neon credentials out of the mobile surface", () => {
    const packageJson = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const sourceText = readFileSync(join(process.cwd(), "src/index.ts"), "utf8");

    expect(() =>
      assertMobileBundleSafety({
        dependencies: {
          ...(packageJson.dependencies ?? {}),
          ...(packageJson.devDependencies ?? {}),
        },
        sourceText,
      }),
    ).not.toThrow();
  });

  it("keeps mobile env limited to approved Expo public variables", () => {
    expect(() =>
      assertMobilePublicEnvironmentSafety({
        EXPO_PUBLIC_ANALYTICS_PROVIDER: "local-log",
        EXPO_PUBLIC_API_URL: "http://localhost:3000",
        EXPO_PUBLIC_APP_ENV: "development",
        EXPO_PUBLIC_ENABLE_MOCK_SESSION: "false",
      }),
    ).not.toThrow();

    expect(() =>
      assertMobilePublicEnvironmentSafety({
        AUTH_LOCAL_SECRET: "secret",
        EXPO_PUBLIC_DATABASE_URL: "postgresql://example",
      }),
    ).toThrow("Unsafe mobile public environment");
  });

  it("logs analytics events locally instead of relying on a paid SDK during development", () => {
    const events: Array<{
      eventName: string;
      occurredAt: string;
      properties: Readonly<Record<string, unknown>>;
      provider: "local-log";
    }> = [];
    const emit = createMobileAnalyticsEmitter({
      logger: (event) => {
        events.push(event);
      },
      now: () => new Date("2026-04-23T12:30:00.000Z"),
    });

    emit("feed_opened", {
      screen: "home",
    });

    expect(events).toEqual([
      {
        eventName: "feed_opened",
        occurredAt: "2026-04-23T12:30:00.000Z",
        properties: {
          screen: "home",
        },
        provider: "local-log",
      },
    ]);
  });
});
