import { describe, expect, it } from "vitest";

import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  FLV_DYNAMIC_TEXT_MAX_LINES,
  FLV_MAX_FONT_SIZE_MULTIPLIER,
  FLV_MIN_TOUCH_TARGET,
  createAccessibleHitSlop,
  engajaBrandAssets,
  flvAccessibilityDefaults,
  flvControlTokens,
  flvMediaTokens,
  flvPalette,
  flvSemanticColors,
  flvStatusColors,
  flvTypography,
  getBlockingVisualQaItems,
  hasMinimumTouchTarget,
  meetsContrastRequirement,
  radiusScale,
} from "../src/index.js";

describe("mobile quality gates", () => {
  it("keeps the blocking visual QA checklist explicit for release review", () => {
    expect(getBlockingVisualQaItems().map((item) => item.id)).toEqual([
      "distinct-identity",
      "text-overlap",
      "nested-cards",
      "unfinished-states",
      "hierarchy",
    ]);
  });

  it("enforces minimum hit targets and compensating hit slop for compact controls", () => {
    expect(hasMinimumTouchTarget(FLV_MIN_TOUCH_TARGET, FLV_MIN_TOUCH_TARGET)).toBe(true);
    expect(hasMinimumTouchTarget(36, 28)).toBe(false);
    expect(createAccessibleHitSlop(36, 28)).toEqual({
      bottom: 8,
      left: 4,
      right: 4,
      top: 8,
    });
  });

  it("maintains accessible contrast on the primary product surfaces", () => {
    expect(meetsContrastRequirement(flvSemanticColors.textPrimary, flvSemanticColors.card)).toBe(
      true,
    );
    expect(meetsContrastRequirement(flvPalette.white, flvPalette.leaf)).toBe(true);
    expect(
      meetsContrastRequirement(
        flvStatusColors.warning.foreground,
        flvStatusColors.warning.background,
      ),
    ).toBe(true);
  });

  it("keeps semantic status colors readable", () => {
    for (const statusColor of Object.values(flvStatusColors)) {
      expect(meetsContrastRequirement(statusColor.foreground, statusColor.background)).toBe(true);
    }
  });

  it("keeps shared components within final mobile usability rules", () => {
    expect(radiusScale.lg).toBeLessThanOrEqual(8);
    expect(radiusScale.md).toBeLessThanOrEqual(8);
    expect(Object.values(flvTypography).every((variant) => variant.letterSpacing === 0)).toBe(true);
    expect(engajaBrandAssets.appIcon.safeAreaPercent).toBeGreaterThanOrEqual(80);
  });

  it("keeps dynamic text and long labels bounded in shared controls", () => {
    const primitiveSource = readFileSync(join(process.cwd(), "src/native/primitives.tsx"), "utf8");

    expect(flvAccessibilityDefaults.dynamicText.maxFontSizeMultiplier).toBe(
      FLV_MAX_FONT_SIZE_MULTIPLIER,
    );
    expect(flvAccessibilityDefaults.dynamicText.multilineMaxLines).toBe(
      FLV_DYNAMIC_TEXT_MAX_LINES,
    );
    expect(flvControlTokens.standardHeight).toBeGreaterThanOrEqual(FLV_MIN_TOUCH_TARGET);
    expect(primitiveSource).toContain("maxFontSizeMultiplier={maxFontSizeMultiplier}");
    expect(primitiveSource).toContain("flexShrink: 1");
    expect(primitiveSource).toContain("flexWrap: \"wrap\"");
  });

  it("keeps feed photos, evidence thumbnails and visual cards stable with fallbacks", () => {
    const featureSource = readFileSync(join(process.cwd(), "src/native/features.tsx"), "utf8");

    expect(flvMediaTokens.feedPhotoAspectRatio).toBeCloseTo(4 / 3);
    expect(flvMediaTokens.evidenceAspectRatio).toBeCloseTo(16 / 10);
    expect(flvMediaTokens.minFeedPhotoHeight).toBeGreaterThanOrEqual(232);
    expect(flvMediaTokens.minEvidenceHeight).toBeGreaterThanOrEqual(120);
    expect(featureSource).toContain("postPhotoFallback");
    expect(featureSource).toContain("Sem imagem neste registro");
    expect(featureSource).toContain("Evidencia sem foto");
    expect(featureSource).toContain("minHeight: flvMediaTokens.minFeedPhotoHeight");
    expect(featureSource).toContain("minHeight: flvMediaTokens.minEvidenceHeight");
  });
});
