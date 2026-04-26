import { describe, expect, it } from "vitest";

import {
  FLV_MAX_FONT_SIZE_MULTIPLIER,
  FLV_MIN_TOUCH_TARGET,
  createAccessibleHitSlop,
  engajaBrandAssets,
  flvBorderTokens,
  flvElevationTokens,
  flvPalette,
  flvStateCopy,
  flvTypography,
  flvVisualDirection,
  flvVisualQaChecklist,
  getBlockingVisualQaItems,
  getContrastRatio,
  meetsContrastRequirement,
  spacingScale,
} from "../src/index.js";
import { flvImagePerformanceDefaults } from "../src/native/image-performance.js";

describe("FLV UI tokens", () => {
  it("keeps a multi-accent FLV palette and stable spacing scale", () => {
    expect(flvPalette.leaf).toBe("#2F7D32");
    expect(flvPalette.citrus).toBe("#F7B801");
    expect(spacingScale.md).toBe(16);
    expect(flvBorderTokens.cardWidth).toBe(1);
    expect(flvElevationTokens.card.shadowOpacity).toBeLessThanOrEqual(0.1);
  });

  it("defines Engaja brand assets and usage rules for app surfaces", () => {
    expect(engajaBrandAssets.lockup.productName).toBe("Engaja FLV");
    expect(engajaBrandAssets.appIcon.foreground).toContain("tomato");
    expect(engajaBrandAssets.usageRules.auth).toContain("wordmark");
    expect(engajaBrandAssets.usageRules.metadata).toContain("engaja-flv");
  });

  it("defines a product-specific visual direction for FLV", () => {
    expect(flvVisualDirection.principles).toHaveLength(4);
    expect(flvVisualDirection.motionRules.reactions).toContain("scale");
    expect(flvVisualDirection.typographyRules.displayTone).toContain("serif");
  });

  it("keeps typography stable for dynamic text", () => {
    expect(Object.values(flvTypography).every((variant) => variant.letterSpacing === 0)).toBe(true);
  });

  it("provides accessibility helpers for touch targets and contrast", () => {
    expect(FLV_MIN_TOUCH_TARGET).toBe(44);
    expect(FLV_MAX_FONT_SIZE_MULTIPLIER).toBe(1.4);
    expect(createAccessibleHitSlop(32, 40)).toEqual({
      bottom: 2,
      left: 6,
      right: 6,
      top: 2,
    });
    expect(meetsContrastRequirement(flvPalette.ink, flvPalette.surface)).toBe(true);
    expect(getContrastRatio(flvPalette.graphite, flvPalette.paper)).toBeGreaterThan(10);
  });

  it("keeps a blocking visual QA checklist for premium screens", () => {
    expect(flvVisualQaChecklist.some((item) => item.prompt.includes("generic"))).toBe(true);
    expect(flvVisualQaChecklist.some((item) => item.prompt.includes("overlap"))).toBe(true);
    expect(flvVisualQaChecklist.some((item) => item.prompt.includes("nested cards"))).toBe(true);
    expect(getBlockingVisualQaItems()).toHaveLength(5);
  });

  it("defines cached progressive image defaults for feed media", () => {
    expect(flvImagePerformanceDefaults.cachePolicy).toBe("memory-disk");
    expect(flvImagePerformanceDefaults.progressiveTransitionMs).toBe(180);
    expect(flvImagePerformanceDefaults.placeholderBlurhash).toHaveLength(28);
  });

  it("centralizes final state copy for product review", () => {
    expect(flvStateCopy.offline.description).not.toContain("fila local");
    expect(flvStateCopy.permissionDenied.description).not.toContain("escopo");
    expect(flvStateCopy.empty.description).not.toContain("superficie");
  });
});
