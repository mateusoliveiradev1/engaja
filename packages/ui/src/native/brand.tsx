import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";

import React from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  engajaBrandAssets,
  flvPalette,
  flvSemanticColors,
  radiusScale,
  spacingScale,
} from "../index.js";

export interface EngajaLogoMarkProps {
  readonly inverse?: boolean;
  readonly size?: "md" | "sm";
  readonly style?: StyleProp<ViewStyle>;
}

export function EngajaLogoMark({
  inverse = false,
  size = "md",
  style,
}: EngajaLogoMarkProps): ReactNode {
  const sizeStyle = size === "sm" ? styles.markSmall : styles.markMedium;

  return (
    <View
      accessibilityLabel={`${engajaBrandAssets.lockup.productName} marca`}
      accessible
      style={[styles.mark, inverse ? styles.markInverse : styles.markDefault, sizeStyle, style]}
    >
      <View style={[styles.block, styles.blockFresh]} />
      <View style={[styles.block, styles.blockWarm]} />
      <View style={[styles.block, styles.blockBold]} />
      <View style={[styles.block, styles.blockDeep]}>
        <Text allowFontScaling={false} style={styles.monogram}>
          {engajaBrandAssets.lockup.monogram}
        </Text>
      </View>
    </View>
  );
}

export interface EngajaWordmarkProps {
  readonly compact?: boolean;
  readonly inverse?: boolean;
  readonly style?: StyleProp<ViewStyle>;
}

export function EngajaWordmark({
  compact = false,
  inverse = false,
  style,
}: EngajaWordmarkProps): ReactNode {
  const textColor = inverse ? flvPalette.white : flvSemanticColors.textPrimary;
  const mutedColor = inverse ? "rgba(255, 255, 255, 0.78)" : flvSemanticColors.textMuted;

  return (
    <View style={[styles.lockup, style]}>
      <EngajaLogoMark inverse={inverse} size={compact ? "sm" : "md"} />
      <View style={styles.lockupCopy}>
        <Text
          allowFontScaling
          maxFontSizeMultiplier={1.2}
          style={[styles.wordmark, { color: textColor }]}
        >
          {engajaBrandAssets.lockup.wordmark}
        </Text>
        {compact ? null : (
          <Text
            allowFontScaling
            maxFontSizeMultiplier={1.2}
            style={[styles.descriptor, { color: mutedColor }]}
          >
            {engajaBrandAssets.lockup.descriptor}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    borderRadius: 3,
    height: "46%",
    width: "46%",
  },
  blockBold: {
    backgroundColor: flvPalette.tomato,
  },
  blockDeep: {
    alignItems: "center",
    backgroundColor: flvPalette.grape,
    justifyContent: "center",
  },
  blockFresh: {
    backgroundColor: flvPalette.leaf,
  },
  blockWarm: {
    backgroundColor: flvPalette.citrus,
  },
  descriptor: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0,
    lineHeight: 16,
  },
  lockup: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacingScale.sm,
  },
  lockupCopy: {
    flexShrink: 1,
    gap: spacingScale.xxs,
  },
  mark: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
    justifyContent: "center",
    overflow: "hidden",
    padding: 4,
  },
  markDefault: {
    backgroundColor: flvPalette.paper,
    borderColor: flvSemanticColors.border,
    borderWidth: 1,
  },
  markInverse: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderColor: "rgba(255, 255, 255, 0.34)",
    borderWidth: 1,
  },
  markMedium: {
    borderRadius: radiusScale.lg,
    height: 48,
    width: 48,
  },
  markSmall: {
    borderRadius: radiusScale.md,
    height: 32,
    width: 32,
  },
  monogram: {
    color: flvPalette.white,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 13,
  },
  wordmark: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 24,
  },
});
