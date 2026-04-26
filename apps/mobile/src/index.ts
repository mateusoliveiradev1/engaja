import type { DataAdapterDescriptor } from "@engaja/data/mobile";
import type { FlvPaletteToken } from "@engaja/ui";

import { mobileApiAdapterDescriptor } from "@engaja/data/mobile";
import { engajaBrandAssets, flvPalette } from "@engaja/ui";

import { developmentBuildCapabilities } from "./native/capabilities.js";
import { mobileRouteGroups } from "./navigation/routes.js";

export * from "./native/capabilities.js";
export * from "./navigation/routes.js";
export * from "./app/dashboard-service.js";
export * from "./app/analytics.js";
export * from "./app/auth-service.js";
export * from "./app/auth-storage.js";
export * from "./performance/image-policy.js";
export * from "./performance/list-policy.js";
export * from "./security/bundle-safety.js";

export interface MobileShellDescriptor {
  readonly apiUrl: string;
  readonly brand: {
    readonly appName: string;
    readonly iconSafeAreaPercent: number;
    readonly wordmark: string;
  };
  readonly dataAdapter: DataAdapterDescriptor;
  readonly nativeCapabilities: readonly string[];
  readonly primaryAccent: FlvPaletteToken;
  readonly protectedRouteGroups: readonly string[];
}

export function createMobileShellDescriptor(apiUrl: string): MobileShellDescriptor {
  return {
    apiUrl,
    brand: {
      appName: engajaBrandAssets.lockup.productName,
      iconSafeAreaPercent: engajaBrandAssets.appIcon.safeAreaPercent,
      wordmark: engajaBrandAssets.lockup.wordmark,
    },
    dataAdapter: mobileApiAdapterDescriptor,
    nativeCapabilities: developmentBuildCapabilities.map((capability) => capability.name),
    primaryAccent: "leaf",
    protectedRouteGroups: Object.values(mobileRouteGroups)
      .filter((routeGroup) => routeGroup.kind === "protected")
      .map((routeGroup) => routeGroup.segment),
  };
}

export function getPrimaryAccentHex(): string {
  return flvPalette.leaf;
}
