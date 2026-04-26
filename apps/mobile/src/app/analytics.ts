export type MobileAnalyticsProvider = "local-log";

export interface MobileAnalyticsEvent {
  readonly eventName: string;
  readonly occurredAt: string;
  readonly properties: Readonly<Record<string, unknown>>;
  readonly provider: MobileAnalyticsProvider;
}

export function createMobileAnalyticsEmitter(options: {
  readonly env?: Readonly<Record<string, string | undefined>>;
  readonly logger?: (event: MobileAnalyticsEvent) => void;
  readonly now?: () => Date;
} = {}) {
  const provider = loadMobileAnalyticsProvider(options.env);
  const now = options.now ?? (() => new Date());
  const logger =
    options.logger ??
    ((event: MobileAnalyticsEvent) => {
      console.info("[analytics:local-log]", JSON.stringify(event));
    });

  return (eventName: string, properties: Readonly<Record<string, unknown>> = {}) => {
    logger({
      eventName,
      occurredAt: now().toISOString(),
      properties,
      provider,
    });
  };
}

export function loadMobileAnalyticsProvider(
  env: Readonly<Record<string, string | undefined>> = process.env,
): MobileAnalyticsProvider {
  const provider = env.EXPO_PUBLIC_ANALYTICS_PROVIDER ?? "local-log";

  if (provider !== "local-log") {
    throw new Error("Configuracao de analytics invalida para este ambiente.");
  }

  return provider;
}
