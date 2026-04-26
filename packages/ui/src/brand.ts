export const engajaBrandAssets = {
  appIcon: {
    background: "paper",
    foreground: ["leaf", "citrus", "tomato", "grape"],
    safeAreaPercent: 82,
  },
  lockup: {
    compactLabel: "Engaja",
    descriptor: "Equipes de loja em movimento",
    monogram: "E",
    productName: "Engaja FLV",
    wordmark: "Engaja",
  },
  usageRules: {
    auth: "Use the full wordmark with descriptor before forms to create a confident first impression.",
    header:
      "Use the compact wordmark in authenticated headers so the brand stays present without stealing room from daily work.",
    metadata:
      "Use Engaja FLV as app name, engaja-flv as slug and the four-block icon as mobile metadata artwork.",
  },
} as const;

export type EngajaBrandUsage = keyof typeof engajaBrandAssets.usageRules;
