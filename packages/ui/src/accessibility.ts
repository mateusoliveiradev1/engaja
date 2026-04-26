export interface FlvHitSlopInsets {
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
  readonly top: number;
}

export interface FlvAccessibleControlState {
  readonly busy?: boolean;
  readonly checked?: boolean;
  readonly disabled?: boolean;
  readonly expanded?: boolean;
  readonly selected?: boolean;
}

export interface FlvAccessibleControlCopy {
  readonly hint?: string;
  readonly label: string;
  readonly role:
    | "adjustable"
    | "alert"
    | "button"
    | "checkbox"
    | "image"
    | "link"
    | "progressbar"
    | "radio"
    | "search"
    | "summary"
    | "switch"
    | "tab"
    | "text";
  readonly state?: FlvAccessibleControlState;
}

export const FLV_MIN_TOUCH_TARGET = 44;
export const FLV_MAX_FONT_SIZE_MULTIPLIER = 1.4;
export const FLV_REDUCED_MOTION_FEEDBACK_OPACITY = 0.82;
export const FLV_DYNAMIC_TEXT_MAX_LINES = 3;

export const flvAccessibilityDefaults = {
  dynamicText: {
    maxFontSizeMultiplier: FLV_MAX_FONT_SIZE_MULTIPLIER,
    multilineMaxLines: FLV_DYNAMIC_TEXT_MAX_LINES,
  },
  focus: {
    color: "#5D3A7A",
    offset: 2,
    width: 2,
  },
  hitTarget: {
    compact: 36,
    icon: FLV_MIN_TOUCH_TARGET,
    minimum: FLV_MIN_TOUCH_TARGET,
  },
  reducedMotion: {
    opacity: FLV_REDUCED_MOTION_FEEDBACK_OPACITY,
    scale: 1,
  },
} as const;

export function hasMinimumTouchTarget(
  width: number,
  height: number,
  minTarget: number = FLV_MIN_TOUCH_TARGET,
): boolean {
  return width >= minTarget && height >= minTarget;
}

export function createAccessibleHitSlop(
  width: number,
  height: number,
  minTarget: number = FLV_MIN_TOUCH_TARGET,
): FlvHitSlopInsets {
  const horizontalInset = Math.max(0, minTarget - width) / 2;
  const verticalInset = Math.max(0, minTarget - height) / 2;

  return {
    bottom: Math.ceil(verticalInset),
    left: Math.ceil(horizontalInset),
    right: Math.ceil(horizontalInset),
    top: Math.ceil(verticalInset),
  };
}

export function createAccessibleControlCopy({
  hint,
  label,
  role,
  state,
}: FlvAccessibleControlCopy): FlvAccessibleControlCopy {
  return {
    label: label.trim(),
    role,
    ...(hint === undefined ? {} : { hint }),
    ...(state === undefined ? {} : { state }),
  };
}

export function normalizeAccessibleLabel(parts: readonly (number | string | undefined)[]): string {
  return parts
    .filter((part): part is number | string => part !== undefined && `${part}`.trim().length > 0)
    .map((part) => `${part}`.trim())
    .join(", ");
}

export function clampFontSizeMultiplier(
  multiplier: number | undefined,
  maxMultiplier: number = FLV_MAX_FONT_SIZE_MULTIPLIER,
): number {
  if (multiplier === undefined || Number.isNaN(multiplier)) {
    return maxMultiplier;
  }

  return Math.max(1, Math.min(multiplier, maxMultiplier));
}

export function getRelativeLuminance(hexColor: string): number {
  const [red, green, blue] = hexToRgb(hexColor);

  return (
    0.2126 * channelToLinear(red / 255) +
    0.7152 * channelToLinear(green / 255) +
    0.0722 * channelToLinear(blue / 255)
  );
}

export function getContrastRatio(foregroundHex: string, backgroundHex: string): number {
  const foreground = getRelativeLuminance(foregroundHex);
  const background = getRelativeLuminance(backgroundHex);
  const lighter = Math.max(foreground, background);
  const darker = Math.min(foreground, background);

  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

export function meetsContrastRequirement(
  foregroundHex: string,
  backgroundHex: string,
  minimumRatio: number = 4.5,
): boolean {
  return getContrastRatio(foregroundHex, backgroundHex) >= minimumRatio;
}

function hexToRgb(hexColor: string): [number, number, number] {
  const sanitizedHex = hexColor.replace("#", "");
  const normalizedHex =
    sanitizedHex.length === 3
      ? sanitizedHex
          .split("")
          .map((character) => `${character}${character}`)
          .join("")
      : sanitizedHex;

  if (normalizedHex.length !== 6) {
    throw new Error(`Invalid hex color: ${hexColor}`);
  }

  return [
    Number.parseInt(normalizedHex.slice(0, 2), 16),
    Number.parseInt(normalizedHex.slice(2, 4), 16),
    Number.parseInt(normalizedHex.slice(4, 6), 16),
  ];
}

function channelToLinear(channel: number): number {
  return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}
