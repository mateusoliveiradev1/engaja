import type { PropsWithChildren, ReactNode } from "react";
import type {
  Insets,
  PressableProps,
  StyleProp,
  TextInputProps,
  TextProps,
  TextStyle,
  ViewStyle,
} from "react-native";

import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  FLV_MAX_FONT_SIZE_MULTIPLIER,
  FLV_MIN_TOUCH_TARGET,
  createAccessibleHitSlop,
  flvAccessibilityDefaults,
  flvBorderTokens,
  flvControlTokens,
  flvElevationTokens,
  flvLayoutTokens,
  flvMotionTokens,
  flvPalette,
  flvSemanticColors,
  flvStatusColors,
  flvSurfaceTokens,
  flvTypography,
  radiusScale,
  spacingScale,
  type FlvTextVariant,
} from "../index.js";
import { EngajaWordmark } from "./brand.js";

type FlvTextTone = "accent" | "danger" | "default" | "inverse" | "muted" | "success" | "warning";

type ButtonTone = "accent" | "danger" | "ghost" | "primary" | "secondary";
type ChipTone = "bold" | "fresh" | "neutral" | "success" | "warning" | "warm";

const textToneMap: Record<FlvTextTone, string> = {
  accent: flvPalette.grape,
  danger: flvStatusColors.danger.foreground,
  default: flvSemanticColors.textPrimary,
  inverse: flvPalette.white,
  muted: flvSemanticColors.textMuted,
  success: flvStatusColors.success.foreground,
  warning: flvStatusColors.warning.foreground,
};

const cardElevationStyle: ViewStyle =
  Platform.OS === "web"
    ? ({
        boxShadow: "0 3px 10px rgba(20, 33, 23, 0.07)",
      } as ViewStyle)
    : flvElevationTokens.card;

const chipToneMap: Record<
  ChipTone,
  { readonly backgroundColor: string; readonly borderColor: string; readonly color: string }
> = {
  bold: {
    backgroundColor: flvPalette.tomatoSoft,
    borderColor: flvStatusColors.danger.outline,
    color: flvStatusColors.danger.foreground,
  },
  fresh: {
    backgroundColor: flvStatusColors.success.background,
    borderColor: flvStatusColors.success.outline,
    color: flvStatusColors.success.foreground,
  },
  neutral: {
    backgroundColor: flvSemanticColors.cardMuted,
    borderColor: flvSemanticColors.border,
    color: flvSemanticColors.textPrimary,
  },
  success: {
    backgroundColor: flvStatusColors.success.background,
    borderColor: flvStatusColors.success.outline,
    color: flvStatusColors.success.foreground,
  },
  warning: {
    backgroundColor: flvStatusColors.warning.background,
    borderColor: flvStatusColors.warning.outline,
    color: flvStatusColors.warning.foreground,
  },
  warm: {
    backgroundColor: flvStatusColors.warning.background,
    borderColor: flvStatusColors.warning.outline,
    color: flvStatusColors.warning.foreground,
  },
};

export interface FlvTextProps extends TextProps {
  readonly tone?: FlvTextTone;
  readonly variant?: FlvTextVariant;
}

export function FlvText({
  children,
  maxFontSizeMultiplier = FLV_MAX_FONT_SIZE_MULTIPLIER,
  style,
  tone = "default",
  variant = "body",
  ...props
}: FlvTextProps): ReactNode {
  const variantStyle = getTypographyStyle(variant);

  return (
    <Text
      allowFontScaling
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[variantStyle, { color: textToneMap[tone] }, style]}
      {...props}
    >
      {children}
    </Text>
  );
}

export interface CardProps extends PropsWithChildren {
  readonly style?: StyleProp<ViewStyle>;
  readonly tone?: "accent" | "default" | "muted";
}

export function Card({ children, style, tone = "default" }: CardProps): ReactNode {
  return <View style={[styles.card, cardToneStyles[tone], style]}>{children}</View>;
}

export interface ButtonProps {
  readonly accessibilityHint?: string;
  readonly accessibilityLabel?: string;
  readonly disabled?: boolean;
  readonly fullWidth?: boolean;
  readonly icon?: string;
  readonly label: string;
  readonly loading?: boolean;
  readonly loadingLabel?: string;
  readonly onPress?: PressableProps["onPress"];
  readonly tone?: ButtonTone;
}

export function Button({
  accessibilityHint,
  accessibilityLabel,
  disabled = false,
  fullWidth = true,
  icon,
  label,
  loading = false,
  loadingLabel,
  onPress,
  tone = "primary",
}: ButtonProps): ReactNode {
  const palette = buttonToneStyles[tone];
  const isDisabled = disabled || loading;

  return (
    <PressScale
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={[
        styles.button,
        palette.container,
        !fullWidth && styles.buttonAutoWidth,
        isDisabled && styles.buttonDisabled,
      ]}
    >
      <View style={styles.buttonContent}>
        {icon !== undefined ? (
          <View style={[styles.buttonIcon, palette.iconContainer]}>
            <FlvText style={{ color: palette.iconColor }} variant="caption">
              {icon}
            </FlvText>
          </View>
        ) : null}
        <FlvText style={[styles.buttonLabel, { color: palette.labelColor }]} variant="button">
          {loading ? (loadingLabel ?? label) : label}
        </FlvText>
      </View>
    </PressScale>
  );
}

export interface IconButtonProps {
  readonly accessibilityHint?: string;
  readonly accessibilityLabel: string;
  readonly disabled?: boolean;
  readonly icon: string;
  readonly onPress?: PressableProps["onPress"];
  readonly tone?: ButtonTone;
}

export function IconButton({
  accessibilityHint,
  accessibilityLabel,
  disabled = false,
  icon,
  onPress,
  tone = "secondary",
}: IconButtonProps): ReactNode {
  const palette = buttonToneStyles[tone];

  return (
    <PressScale
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={createAccessibleHitSlop(flvControlTokens.iconSize, flvControlTokens.iconSize)}
      onPress={onPress}
      style={[styles.iconButton, palette.container, disabled && styles.buttonDisabled]}
    >
      <FlvText style={{ color: palette.labelColor }} variant="label">
        {icon}
      </FlvText>
    </PressScale>
  );
}

export interface InputProps extends TextInputProps {
  readonly helperText?: string;
  readonly label?: string;
  readonly tone?: "default" | "danger";
}

export function Input({
  helperText,
  label,
  multiline = false,
  style,
  tone = "default",
  ...props
}: InputProps): ReactNode {
  return (
    <View style={styles.inputField}>
      {label !== undefined ? (
        <FlvText accessibilityRole="text" style={styles.inputLabel} variant="label">
          {label}
        </FlvText>
      ) : null}
      <TextInput
        allowFontScaling
        maxFontSizeMultiplier={FLV_MAX_FONT_SIZE_MULTIPLIER}
        multiline={multiline}
        placeholderTextColor={flvSemanticColors.textMuted}
        style={[
          styles.input,
          tone === "danger" ? styles.inputDanger : undefined,
          multiline ? styles.inputMultiline : undefined,
          style,
        ]}
        textAlignVertical={multiline ? "top" : "center"}
        {...props}
      />
      {helperText !== undefined ? (
        <FlvText tone={tone === "danger" ? "danger" : "muted"} variant="caption">
          {helperText}
        </FlvText>
      ) : null}
    </View>
  );
}

export interface ChipProps {
  readonly accessibilityLabel?: string;
  readonly label: string;
  readonly onPress?: PressableProps["onPress"];
  readonly selected?: boolean;
  readonly tone?: ChipTone;
}

export function Chip({
  accessibilityLabel,
  label,
  onPress,
  selected = false,
  tone = "neutral",
}: ChipProps): ReactNode {
  const palette = chipToneMap[tone];
  const content = (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: selected ? flvPalette.grape : palette.backgroundColor,
          borderColor: selected ? flvPalette.grape : palette.borderColor,
        },
      ]}
    >
      <FlvText
        style={[styles.controlLabel, { color: selected ? flvPalette.white : palette.color }]}
        variant="caption"
      >
        {label}
      </FlvText>
    </View>
  );

  if (onPress === undefined) {
    return content;
  }

  return (
    <PressScale
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      hitSlop={createAccessibleHitSlop(36, 28)}
      onPress={onPress}
    >
      {content}
    </PressScale>
  );
}

export interface BadgeProps {
  readonly label: string;
  readonly tone?: "danger" | "info" | "success" | "warning";
}

export function Badge({ label, tone = "info" }: BadgeProps): ReactNode {
  const palette = flvStatusColors[tone];

  return (
    <View
      accessible
      accessibilityLabel={label}
      style={[
        styles.badge,
        {
          backgroundColor: palette.background,
          borderColor: palette.outline,
        },
      ]}
    >
      <FlvText style={{ color: palette.foreground }} variant="caption">
        {label}
      </FlvText>
    </View>
  );
}

export interface AvatarProps {
  readonly initials: string;
  readonly label: string;
  readonly tone?: "fresh" | "warm";
}

export function Avatar({ initials, label, tone = "fresh" }: AvatarProps): ReactNode {
  const palette = tone === "fresh" ? chipToneMap.fresh : chipToneMap.warm;

  return (
    <View accessibilityLabel={label} accessible style={styles.avatarRow}>
      <View
        style={[
          styles.avatarCircle,
          {
            backgroundColor: palette.backgroundColor,
            borderColor: palette.borderColor,
          },
        ]}
      >
        <FlvText style={{ color: palette.color }} variant="label">
          {initials}
        </FlvText>
      </View>
    </View>
  );
}

export interface ListRowProps {
  readonly description?: string;
  readonly leading?: ReactNode;
  readonly title: string;
  readonly trailing?: ReactNode;
}

export function ListRow({ description, leading, title, trailing }: ListRowProps): ReactNode {
  return (
    <View style={styles.listRow}>
      <View style={styles.listRowLeading}>{leading}</View>
      <View style={styles.listRowContent}>
        <FlvText variant="label">{title}</FlvText>
        {description !== undefined ? (
          <FlvText tone="muted" variant="caption">
            {description}
          </FlvText>
        ) : null}
      </View>
      <View style={styles.listRowTrailing}>{trailing}</View>
    </View>
  );
}

export interface TabDescriptor {
  readonly badge?: string;
  readonly id: string;
  readonly label: string;
}

export interface TabsProps {
  readonly activeTabId: string;
  readonly onTabChange: (tabId: string) => void;
  readonly tabs: readonly TabDescriptor[];
}

export function Tabs({ activeTabId, onTabChange, tabs }: TabsProps): ReactNode {
  return (
    <View accessibilityRole="tablist" style={styles.tabsRow}>
      {tabs.map((tab) => {
        const selected = tab.id === activeTabId;

        return (
          <PressScale
            accessibilityLabel={tab.label}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            key={tab.id}
            onPress={() => onTabChange(tab.id)}
            style={[styles.tab, selected ? styles.tabActive : styles.tabIdle]}
          >
            <View style={styles.tabContent}>
              <FlvText
                style={styles.controlLabel}
                tone={selected ? "inverse" : "muted"}
                variant="label"
              >
                {tab.label}
              </FlvText>
              {tab.badge !== undefined ? (
                <View
                  style={[styles.tabBadge, selected ? styles.tabBadgeActive : styles.tabBadgeIdle]}
                >
                  <FlvText
                    style={{
                      color: selected ? flvPalette.grape : flvSemanticColors.textMuted,
                    }}
                    variant="caption"
                  >
                    {tab.badge}
                  </FlvText>
                </View>
              ) : null}
            </View>
          </PressScale>
        );
      })}
    </View>
  );
}

export interface MetricTileProps {
  readonly label: string;
  readonly note?: string;
  readonly tone?: "accent" | "fresh" | "warm";
  readonly value: string;
}

export function MetricTile({ label, note, tone = "fresh", value }: MetricTileProps): ReactNode {
  const accentColor =
    tone === "accent" ? flvPalette.grape : tone === "warm" ? flvPalette.tomato : flvPalette.leaf;

  return (
    <Card style={styles.metricTile}>
      <View style={[styles.metricAccent, { backgroundColor: accentColor }]} />
      <FlvText variant="metric">{value}</FlvText>
      <FlvText tone="muted" variant="caption">
        {label}
      </FlvText>
      {note !== undefined ? (
        <FlvText tone="muted" variant="caption">
          {note}
        </FlvText>
      ) : null}
    </Card>
  );
}

export interface SheetProps extends PropsWithChildren {
  readonly description?: string;
  readonly title: string;
}

export function Sheet({ children, description, title }: SheetProps): ReactNode {
  return (
    <Card style={styles.sheet}>
      <View style={styles.sheetHandle} />
      <FlvText variant="headline">{title}</FlvText>
      {description !== undefined ? (
        <FlvText tone="muted" style={styles.sheetDescription}>
          {description}
        </FlvText>
      ) : null}
      <View style={styles.sheetContent}>{children}</View>
    </Card>
  );
}

export interface ToastProps {
  readonly message: string;
  readonly title: string;
  readonly tone?: "danger" | "info" | "success" | "warning";
}

export function Toast({ message, title, tone = "success" }: ToastProps): ReactNode {
  const palette = flvStatusColors[tone];

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[
        styles.toast,
        {
          backgroundColor: palette.background,
          borderColor: palette.outline,
        },
      ]}
    >
      <View style={[styles.toastIndicator, { backgroundColor: palette.foreground }]} />
      <View style={styles.toastCopy}>
        <FlvText style={{ color: palette.foreground }} variant="label">
          {title}
        </FlvText>
        <FlvText style={{ color: palette.foreground }} variant="caption">
          {message}
        </FlvText>
      </View>
    </View>
  );
}

export interface SectionHeaderProps {
  readonly action?: ReactNode;
  readonly eyebrow?: string;
  readonly title: string;
}

export function SectionHeader({ action, eyebrow, title }: SectionHeaderProps): ReactNode {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderCopy}>
        {eyebrow !== undefined ? (
          <FlvText tone="accent" variant="eyebrow">
            {eyebrow}
          </FlvText>
        ) : null}
        <FlvText variant="headline">{title}</FlvText>
      </View>
      <View>{action}</View>
    </View>
  );
}

export interface ScreenScaffoldProps extends PropsWithChildren {
  readonly eyebrow: string;
  readonly subtitle?: string;
  readonly title: string;
  readonly topAction?: ReactNode;
}

export function ScreenScaffold({
  children,
  eyebrow,
  subtitle,
  title,
  topAction,
}: ScreenScaffoldProps): ReactNode {
  return (
    <View style={styles.screen}>
      <View style={styles.backgroundBand} />
      <View style={styles.backgroundAccentRail} />
      <View style={styles.backgroundSignalBand} />
      <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
        <View style={styles.brandRow}>
          <EngajaWordmark compact />
        </View>
        <View style={styles.screenHeader}>
          <View style={styles.screenHeaderCopy}>
            <FlvText tone="accent" variant="eyebrow">
              {eyebrow}
            </FlvText>
            <FlvText accessibilityRole="header" variant="display">
              {title}
            </FlvText>
            {subtitle !== undefined ? (
              <FlvText style={styles.screenSubtitle} tone="muted">
                {subtitle}
              </FlvText>
            ) : null}
          </View>
          <View>{topAction}</View>
        </View>
        <View style={styles.screenBody}>{children}</View>
      </ScrollView>
    </View>
  );
}

interface PressScaleProps extends PropsWithChildren {
  readonly accessibilityHint?: string | undefined;
  readonly accessibilityLabel?: string | undefined;
  readonly accessibilityRole?: PressableProps["accessibilityRole"] | undefined;
  readonly accessibilityState?: PressableProps["accessibilityState"] | undefined;
  readonly disabled?: boolean | undefined;
  readonly hitSlop?: Insets | undefined;
  readonly onPress?: PressableProps["onPress"] | undefined;
  readonly style?: StyleProp<ViewStyle> | undefined;
}

function PressScale({
  accessibilityHint,
  accessibilityLabel,
  accessibilityRole,
  accessibilityState,
  children,
  disabled = false,
  hitSlop,
  onPress,
  style,
}: PressScaleProps): ReactNode {
  const scale = useRef(new Animated.Value(1)).current;
  const reduceMotion = useReducedMotionPreference();

  const animateTo = (value: number): void => {
    if (reduceMotion) {
      return;
    }

    Animated.spring(scale, {
      bounciness: 3,
      speed: 22,
      toValue: value,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  };

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
      disabled={disabled}
      hitSlop={hitSlop}
      onPress={onPress}
      onPressIn={() => animateTo(flvMotionTokens.pressScale)}
      onPressOut={() => animateTo(1)}
      style={({ pressed }) => [
        styles.pressableReset,
        pressed && reduceMotion ? styles.pressableReducedMotionPressed : undefined,
      ]}
    >
      <Animated.View
        style={[
          style,
          {
            transform: [
              {
                scale: reduceMotion ? flvMotionTokens.reducedMotionScale : scale,
              },
            ],
          },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

function useReducedMotionPreference(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) {
          setReduceMotion(enabled);
        }
      })
      .catch(() => undefined);

    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}

function getTypographyStyle(variant: FlvTextVariant): TextStyle {
  const definition = flvTypography[variant];

  return {
    fontFamily: resolveFontFamily(definition.fontFamily),
    fontSize: definition.fontSize,
    fontWeight: definition.fontWeight,
    letterSpacing: definition.letterSpacing,
    lineHeight: definition.lineHeight,
  };
}

function resolveFontFamily(fontFamily: {
  readonly android: string;
  readonly default: string;
  readonly ios: string;
}): string {
  return Platform.select({
    android: fontFamily.android,
    default: fontFamily.default,
    ios: fontFamily.ios,
  });
}

const cardToneStyles = StyleSheet.create({
  accent: {
    backgroundColor: flvSemanticColors.cardMuted,
    borderColor: flvPalette.mist,
  },
  default: {
    backgroundColor: flvSemanticColors.card,
    borderColor: flvSemanticColors.border,
  },
  muted: {
    backgroundColor: flvSemanticColors.background,
    borderColor: flvSemanticColors.border,
  },
});

const buttonToneStyles: Record<
  ButtonTone,
  {
    readonly container: StyleProp<ViewStyle>;
    readonly iconColor: string;
    readonly iconContainer: StyleProp<ViewStyle>;
    readonly labelColor: string;
  }
> = {
  accent: {
    container: {
      backgroundColor: flvPalette.citrus,
      borderColor: flvPalette.citrus,
    },
    iconColor: flvSemanticColors.textPrimary,
    iconContainer: {
      backgroundColor: "rgba(20, 33, 23, 0.08)",
    },
    labelColor: flvSemanticColors.textPrimary,
  },
  danger: {
    container: {
      backgroundColor: flvPalette.tomato,
      borderColor: flvPalette.tomato,
    },
    iconColor: flvPalette.white,
    iconContainer: {
      backgroundColor: "rgba(255, 255, 255, 0.16)",
    },
    labelColor: flvPalette.white,
  },
  ghost: {
    container: {
      backgroundColor: "transparent",
      borderColor: flvSemanticColors.border,
    },
    iconColor: flvSemanticColors.textPrimary,
    iconContainer: {
      backgroundColor: flvSemanticColors.cardMuted,
    },
    labelColor: flvSemanticColors.textPrimary,
  },
  primary: {
    container: {
      backgroundColor: flvPalette.leaf,
      borderColor: flvPalette.leaf,
    },
    iconColor: flvPalette.white,
    iconContainer: {
      backgroundColor: "rgba(255, 255, 255, 0.16)",
    },
    labelColor: flvPalette.white,
  },
  secondary: {
    container: {
      backgroundColor: flvSemanticColors.card,
      borderColor: flvSemanticColors.border,
    },
    iconColor: flvSemanticColors.textPrimary,
    iconContainer: {
      backgroundColor: flvSemanticColors.cardMuted,
    },
    labelColor: flvSemanticColors.textPrimary,
  },
};

const styles = StyleSheet.create({
  avatarCircle: {
    alignItems: "center",
    borderRadius: radiusScale.pill,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  avatarRow: {
    alignItems: "center",
    flexDirection: "row",
  },
  backgroundAccentRail: {
    backgroundColor: flvPalette.tomato,
    height: 6,
    left: spacingScale.lg,
    pointerEvents: "none",
    position: "absolute",
    right: spacingScale.lg,
    top: 0,
  },
  backgroundBand: {
    backgroundColor: flvPalette.paper,
    height: 164,
    left: 0,
    opacity: 0.6,
    pointerEvents: "none",
    position: "absolute",
    right: 0,
    top: 0,
  },
  backgroundSignalBand: {
    backgroundColor: flvPalette.mist,
    height: 56,
    opacity: 0.72,
    pointerEvents: "none",
    position: "absolute",
    right: 0,
    top: 108,
    width: 112,
  },
  badge: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: radiusScale.pill,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 28,
    paddingHorizontal: spacingScale.sm,
    paddingVertical: spacingScale.xs,
  },
  button: {
    alignItems: "center",
    borderRadius: radiusScale.pill,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: flvControlTokens.standardHeight,
    paddingHorizontal: spacingScale.lg,
    width: "100%",
  },
  buttonAutoWidth: {
    width: undefined,
  },
  buttonContent: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 1,
    gap: spacingScale.sm,
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonIcon: {
    alignItems: "center",
    borderRadius: radiusScale.pill,
    height: 24,
    justifyContent: "center",
    minWidth: 24,
    paddingHorizontal: spacingScale.xs,
  },
  buttonLabel: {
    flexShrink: 1,
    textAlign: "center",
  },
  card: {
    ...cardElevationStyle,
    borderRadius: radiusScale.lg,
    borderWidth: flvBorderTokens.cardWidth,
    gap: spacingScale.md,
    overflow: "hidden",
    padding: spacingScale.lg,
  },
  chip: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: radiusScale.pill,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 28,
    paddingHorizontal: spacingScale.sm,
    paddingVertical: spacingScale.xs,
  },
  controlLabel: {
    flexShrink: 1,
    textAlign: "center",
  },
  iconButton: {
    alignItems: "center",
    borderRadius: radiusScale.pill,
    borderWidth: 1,
    height: flvLayoutTokens.iconButtonSize,
    justifyContent: "center",
    width: flvLayoutTokens.iconButtonSize,
  },
  input: {
    backgroundColor: flvSurfaceTokens.field,
    borderColor: flvSemanticColors.border,
    borderRadius: radiusScale.md,
    borderWidth: 1,
    color: flvSemanticColors.textPrimary,
    fontFamily: resolveFontFamily(flvTypography.body.fontFamily),
    fontSize: flvTypography.body.fontSize,
    lineHeight: flvTypography.body.lineHeight,
    minHeight: flvControlTokens.fieldMinHeight,
    paddingHorizontal: spacingScale.md,
    paddingVertical: spacingScale.md,
  },
  inputDanger: {
    borderColor: flvStatusColors.danger.outline,
  },
  inputField: {
    gap: spacingScale.sm,
  },
  inputLabel: {
    marginBottom: spacingScale.xxs,
  },
  inputMultiline: {
    minHeight: 112,
  },
  listRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacingScale.md,
    minHeight: 52,
  },
  listRowContent: {
    flex: 1,
    gap: spacingScale.xxs,
  },
  listRowLeading: {
    minWidth: 40,
  },
  listRowTrailing: {
    alignItems: "flex-end",
    minWidth: 52,
  },
  metricAccent: {
    borderRadius: radiusScale.pill,
    height: 8,
    width: 48,
  },
  metricTile: {
    flex: 1,
    minWidth: 92,
  },
  pressableReset: {
    alignSelf: "stretch",
  },
  pressableReducedMotionPressed: {
    opacity: flvAccessibilityDefaults.reducedMotion.opacity,
  },
  brandRow: {
    marginBottom: spacingScale.lg,
  },
  screen: {
    backgroundColor: flvSemanticColors.background,
    flex: 1,
  },
  screenBody: {
    gap: spacingScale.xl,
  },
  screenContent: {
    alignSelf: "center",
    maxWidth: flvLayoutTokens.contentMaxWidth,
    paddingBottom: spacingScale.xxxl,
    paddingHorizontal: spacingScale.lg,
    paddingTop: 48,
    width: "100%",
  },
  screenHeader: {
    gap: spacingScale.lg,
    marginBottom: spacingScale.xl,
  },
  screenHeaderCopy: {
    gap: spacingScale.sm,
  },
  screenSubtitle: {
    maxWidth: 480,
  },
  sectionHeader: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: spacingScale.md,
    justifyContent: "space-between",
  },
  sectionHeaderCopy: {
    flex: 1,
    gap: spacingScale.xs,
  },
  sheet: {
    backgroundColor: flvPalette.white,
  },
  sheetContent: {
    gap: spacingScale.md,
  },
  sheetDescription: {
    marginTop: -spacingScale.sm,
  },
  sheetHandle: {
    alignSelf: "center",
    backgroundColor: flvSemanticColors.border,
    borderRadius: radiusScale.pill,
    height: 5,
    marginTop: -spacingScale.xs,
    width: 56,
  },
  tab: {
    borderRadius: radiusScale.pill,
    flex: 1,
    minWidth: 92,
    minHeight: FLV_MIN_TOUCH_TARGET,
    paddingHorizontal: spacingScale.md,
    paddingVertical: spacingScale.sm,
  },
  tabActive: {
    backgroundColor: flvPalette.grape,
  },
  tabBadge: {
    alignItems: "center",
    borderRadius: radiusScale.pill,
    justifyContent: "center",
    minWidth: 26,
    paddingHorizontal: spacingScale.xs,
    paddingVertical: spacingScale.xxs,
  },
  tabBadgeActive: {
    backgroundColor: flvPalette.white,
  },
  tabBadgeIdle: {
    backgroundColor: flvSemanticColors.cardMuted,
  },
  tabContent: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 1,
    flexWrap: "wrap",
    gap: spacingScale.xs,
    justifyContent: "center",
  },
  tabIdle: {
    backgroundColor: flvSemanticColors.card,
  },
  tabsRow: {
    backgroundColor: flvSemanticColors.cardMuted,
    borderRadius: radiusScale.pill,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacingScale.xs,
    padding: spacingScale.xs,
  },
  toast: {
    alignItems: "flex-start",
    borderRadius: radiusScale.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacingScale.md,
    padding: spacingScale.md,
  },
  toastCopy: {
    flex: 1,
    gap: spacingScale.xxs,
  },
  toastIndicator: {
    borderRadius: radiusScale.pill,
    minHeight: 24,
    width: 6,
  },
});
