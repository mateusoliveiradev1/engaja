export const forbiddenMobileDependencyNames = [
  "@neondatabase/serverless",
  "drizzle-orm",
  "pg",
  "postgres",
  "postgres.js",
] as const;

export const forbiddenMobileSourcePatterns = [
  "AUTH_LOCAL_SECRET",
  "DATABASE_URL",
  "INVITE_TOKEN_SECRET",
  "NEON_DATABASE_URL",
  "NEON_CONNECTION_STRING",
  "SESSION_SECRET",
  "@neondatabase/serverless",
  "drizzle-orm",
] as const;

export const allowedMobilePublicEnvironmentNames = [
  "EXPO_PUBLIC_ANALYTICS_PROVIDER",
  "EXPO_PUBLIC_API_URL",
  "EXPO_PUBLIC_APP_ENV",
  "EXPO_PUBLIC_ENABLE_MOCK_SESSION",
] as const;

export interface MobileBundleSafetyReport {
  readonly forbiddenDependencies: readonly string[];
  readonly forbiddenSourcePatterns: readonly string[];
}

export interface MobilePublicEnvironmentSafetyReport {
  readonly missingRequiredPublicNames: readonly string[];
  readonly serverOnlyNames: readonly string[];
  readonly unexpectedPublicNames: readonly string[];
}

export function inspectMobileBundleSafety(input: {
  readonly dependencies: Readonly<Record<string, string>>;
  readonly sourceText: string;
}): MobileBundleSafetyReport {
  return {
    forbiddenDependencies: forbiddenMobileDependencyNames.filter(
      (dependencyName) => input.dependencies[dependencyName] !== undefined,
    ),
    forbiddenSourcePatterns: forbiddenMobileSourcePatterns.filter((pattern) =>
      input.sourceText.includes(pattern),
    ),
  };
}

export function inspectMobilePublicEnvironmentSafety(
  env: Readonly<Record<string, string | undefined>>,
): MobilePublicEnvironmentSafetyReport {
  const allowedPublicNames = new Set<string>(allowedMobilePublicEnvironmentNames);
  const unexpectedPublicNames = Object.keys(env).filter(
    (name) => name.startsWith("EXPO_PUBLIC_") && !allowedPublicNames.has(name),
  );
  const serverOnlyNames = Object.keys(env).filter((name) =>
    forbiddenMobileSourcePatterns.some((pattern) => name.includes(pattern)),
  );
  const missingRequiredPublicNames =
    (env.EXPO_PUBLIC_API_URL ?? "").trim().length === 0 ? ["EXPO_PUBLIC_API_URL"] : [];

  return {
    missingRequiredPublicNames,
    serverOnlyNames,
    unexpectedPublicNames,
  };
}

export function assertMobileBundleSafety(input: {
  readonly dependencies: Readonly<Record<string, string>>;
  readonly sourceText: string;
}): void {
  const report = inspectMobileBundleSafety(input);

  if (report.forbiddenDependencies.length > 0 || report.forbiddenSourcePatterns.length > 0) {
    throw new Error(
      `Mobile bundle includes server-only surface: ${[
        ...report.forbiddenDependencies,
        ...report.forbiddenSourcePatterns,
      ].join(", ")}`,
    );
  }
}

export function assertMobilePublicEnvironmentSafety(
  env: Readonly<Record<string, string | undefined>>,
): void {
  const report = inspectMobilePublicEnvironmentSafety(env);
  const failures = [
    ...report.serverOnlyNames,
    ...report.unexpectedPublicNames,
    ...report.missingRequiredPublicNames.map((name) => `${name} missing`),
  ];

  if (failures.length > 0) {
    throw new Error(`Unsafe mobile public environment: ${failures.join(", ")}`);
  }
}
