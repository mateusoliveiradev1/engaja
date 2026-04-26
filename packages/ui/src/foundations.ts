export const flvPalette = {
  citrus: "#F7B801",
  cream: "#F2EBDD",
  fog: "#E4DDCF",
  grape: "#5D3A7A",
  graphite: "#202427",
  info: "#1F617E",
  ink: "#142117",
  leaf: "#2F7D32",
  line: "#C9CBBF",
  mist: "#D9E6D5",
  moss: "#5E7242",
  paper: "#FFFCF6",
  sage: "#A8C198",
  sky: "#DDEEF4",
  success: "#215F31",
  surface: "#F7F4EC",
  tomato: "#C44732",
  tomatoSoft: "#F4D8D3",
  warning: "#8A5E00",
  white: "#FFFFFF",
} as const;

export const flvSemanticColors = {
  accentBold: flvPalette.tomato,
  accentFresh: flvPalette.leaf,
  accentWarm: flvPalette.citrus,
  background: flvPalette.surface,
  border: flvPalette.line,
  card: flvPalette.paper,
  cardMuted: flvPalette.cream,
  infoSurface: flvPalette.sky,
  panel: flvPalette.white,
  photoShade: "#D7E4C8",
  successSurface: "#E4F1E4",
  textMuted: "#4A5348",
  textPrimary: flvPalette.ink,
  warningSurface: "#F6EAC9",
} as const;

export const flvSurfaceTokens = {
  appBackground: flvSemanticColors.background,
  card: flvSemanticColors.card,
  cardMuted: flvSemanticColors.cardMuted,
  elevated: flvSemanticColors.panel,
  field: flvPalette.white,
  inverse: flvPalette.graphite,
  overlay: "rgba(20, 33, 23, 0.42)",
  pressed: "rgba(20, 33, 23, 0.08)",
} as const;

export const flvBorderTokens = {
  cardWidth: 1,
  focusWidth: 2,
  hairlineWidth: 1,
} as const;

export const flvElevationTokens = {
  card: {
    elevation: 1,
    shadowColor: "#142117",
    shadowOffset: {
      height: 3,
      width: 0,
    },
    shadowOpacity: 0.07,
    shadowRadius: 10,
  },
  raised: {
    elevation: 2,
    shadowColor: "#142117",
    shadowOffset: {
      height: 5,
      width: 0,
    },
    shadowOpacity: 0.1,
    shadowRadius: 14,
  },
} as const;

export const flvStatusColors = {
  danger: {
    background: flvPalette.tomatoSoft,
    foreground: "#7B261A",
    outline: "#D9998F",
  },
  info: {
    background: flvPalette.sky,
    foreground: "#17485E",
    outline: "#9CC7D5",
  },
  success: {
    background: "#E4F1E4",
    foreground: "#1E522A",
    outline: "#A9CCB0",
  },
  warning: {
    background: "#F7EBC7",
    foreground: "#744C00",
    outline: "#DCC27C",
  },
} as const;

export const spacingScale = {
  lg: 24,
  md: 16,
  sm: 8,
  xl: 32,
  xs: 4,
  xxl: 40,
  xxs: 2,
  xxxl: 48,
} as const;

export const flvLayoutTokens = {
  contentMaxWidth: 560,
  fixedFooterHeight: 72,
  iconButtonSize: 44,
  mediaAspectRatio: 4 / 3,
  screenGutter: spacingScale.lg,
  sectionGap: spacingScale.xl,
  tabMinWidth: 92,
} as const;

export const radiusScale = {
  lg: 8,
  md: 8,
  pill: 999,
  sm: 6,
  xl: 8,
} as const;

export const flvMediaTokens = {
  evidenceAspectRatio: 16 / 10,
  feedPhotoAspectRatio: 4 / 3,
  fallbackBackground: flvSemanticColors.photoShade,
  maxPreviewHeight: 320,
  minEvidenceHeight: 120,
  minFeedPhotoHeight: 232,
  thumbnailSize: 72,
} as const;

export const flvControlTokens = {
  borderRadius: radiusScale.pill,
  compactHeight: 36,
  fieldMinHeight: 54,
  hitTarget: 44,
  iconSize: 20,
  standardHeight: 52,
} as const;

export const flvTypography = {
  body: {
    fontFamily: {
      android: "sans-serif",
      default: "System",
      ios: "Avenir Next",
    },
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 24,
    letterSpacing: 0,
  },
  button: {
    fontFamily: {
      android: "sans-serif-medium",
      default: "System",
      ios: "Avenir Next Demi Bold",
    },
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
    letterSpacing: 0,
  },
  caption: {
    fontFamily: {
      android: "sans-serif-medium",
      default: "System",
      ios: "Avenir Next Demi Bold",
    },
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
    letterSpacing: 0,
  },
  display: {
    fontFamily: {
      android: "serif",
      default: "System",
      ios: "Georgia",
    },
    fontSize: 34,
    fontWeight: "700",
    lineHeight: 40,
    letterSpacing: 0,
  },
  eyebrow: {
    fontFamily: {
      android: "sans-serif-medium",
      default: "System",
      ios: "Avenir Next Condensed",
    },
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
    letterSpacing: 0,
  },
  headline: {
    fontFamily: {
      android: "serif",
      default: "System",
      ios: "Georgia",
    },
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 28,
    letterSpacing: 0,
  },
  label: {
    fontFamily: {
      android: "sans-serif-medium",
      default: "System",
      ios: "Avenir Next Demi Bold",
    },
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    letterSpacing: 0,
  },
  metric: {
    fontFamily: {
      android: "serif",
      default: "System",
      ios: "Georgia",
    },
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 32,
    letterSpacing: 0,
  },
  title: {
    fontFamily: {
      android: "serif",
      default: "System",
      ios: "Georgia",
    },
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 34,
    letterSpacing: 0,
  },
} as const;

export const flvMotionTokens = {
  emphasisDurationMs: 280,
  pressScale: 0.97,
  reducedMotionOpacity: 0.82,
  reducedMotionScale: 1,
  settleDurationMs: 220,
  swiftDurationMs: 160,
} as const;

export const flvVisualDirection = {
  colorPalette: {
    accents: [flvPalette.leaf, flvPalette.citrus, flvPalette.tomato, flvPalette.grape],
    neutralSurfaces: [flvPalette.surface, flvPalette.paper, flvPalette.cream],
  },
  iconStyle: {
    badges: "lozenge chips with bold condensed labels",
    shapeLanguage: "crisp cards, pill controls and cropped produce blocks",
    strokeWeight: "medium to bold",
  },
  motionRules: {
    checklistCompletion: "pulse the control and tint the row without moving sibling content",
    posting: "compress the CTA slightly on press and settle quickly after submission",
    reactions: "animate the selected reaction with a compact scale bump",
    recognition: "use warm accent feedback that feels celebratory but still operational",
    scheduleApproval: "confirm approvals with contained motion on the action cluster",
  },
  photoTreatment: {
    captionSurface: "cream or white floating card over dense photo blocks",
    cropBias: "portrait-first with visible produce texture or evidence context",
    overlays: "soft leaf-tinted overlays instead of heavy black gradients",
  },
  principles: [
    "Photo surfaces lead the composition, while operational context stays close to the media.",
    "Information density stays calm through strong spacing rhythm and restrained color blocking.",
    "Every screen should feel store-real and FLV-specific, never like a template dashboard.",
    "Brazilian Portuguese copy is concise, professional and action-oriented.",
  ],
  spacingRules: {
    cardPadding: spacingScale.lg,
    screenGutter: spacingScale.lg,
    sectionSpacing: spacingScale.xl,
  },
  typographyRules: {
    bodyTone: "clean sans-serif for scanning repeated daily work",
    displayTone: "warm editorial serif for hierarchy and product personality",
    labels: "condensed or medium weight labels for chips, stats and badges",
  },
} as const;

export type FlvPaletteToken = keyof typeof flvPalette;
export type FlvTextVariant = keyof typeof flvTypography;
