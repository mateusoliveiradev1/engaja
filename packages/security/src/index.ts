import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

export const flvRoles = [
  "colaborador",
  "lider-setor",
  "gerente-loja",
  "admin-organizacao",
  "auditor",
] as const;

export type FlvRole = (typeof flvRoles)[number];

export const permissionActions = [
  "session.read",
  "feed.read",
  "feed.create",
  "feed.comment",
  "feed.react",
  "feed.feedback.create",
  "feed.moderate",
  "feed.announcement.manage",
  "feed.poll.manage",
  "schedule.read",
  "schedule.request.create",
  "schedule.request.review",
  "schedule.publish",
  "schedule.change",
  "schedule.swap.approve",
  "operations.routine.read",
  "operations.routine.complete",
  "operations.routine.manage",
  "operations.issue.create",
  "operations.issue.manage",
  "operations.summary.read",
  "operations.evidence.read",
  "engagement.campaign.read",
  "engagement.archive.read",
  "engagement.manage",
  "recognition.read",
  "recognition.send",
  "recognition.manage",
  "recognition.points.adjust",
  "dashboard.read",
  "dashboard.memberDetail.read",
  "dashboard.sensitiveReport.read",
  "media.upload",
  "media.read",
  "media.moderate",
  "invite.list",
  "invite.create",
  "invite.resend",
  "invite.revoke",
  "permissions.change",
  "users.manage",
  "roles.manage",
  "organization.manage",
  "store.manage",
  "department.manage",
  "integrations.manage",
  "audit.read",
  "security.event.read",
  "settings.manage",
] as const;

export type PermissionAction = (typeof permissionActions)[number];

export const permissionScopeLevels = ["own", "department", "store", "organization"] as const;

export type PermissionScopeLevel = (typeof permissionScopeLevels)[number];

export interface SecurityTenantScope {
  readonly departmentId?: string;
  readonly organizationId: string;
  readonly storeId?: string;
}

export interface SecurityActor {
  readonly additionalScopes?: readonly SecurityTenantScope[];
  readonly displayName?: string;
  readonly role: FlvRole;
  readonly scope: SecurityTenantScope;
  readonly userId: string;
}

export interface ScopedResource extends SecurityTenantScope {
  readonly ownerUserId?: string;
  readonly targetUserId?: string;
}

export interface PermissionRule {
  readonly action: PermissionAction;
  readonly description: string;
  readonly kind: "read" | "write";
  readonly scopes: readonly PermissionScopeLevel[];
}

export type PermissionMatrix = Readonly<Record<FlvRole, readonly PermissionRule[]>>;

export interface AuthorizationRequest {
  readonly action: PermissionAction;
  readonly resource?: ScopedResource;
}

export interface AuthorizationDecision {
  readonly allowed: boolean;
  readonly reason:
    | "allowed"
    | "missing_permission"
    | "missing_resource_scope"
    | "outside_scope"
    | "read_only_role";
  readonly safeStatusCode: 403 | 404;
}

export class AuthorizationError extends Error {
  readonly action: PermissionAction;
  readonly decision: AuthorizationDecision;

  constructor(action: PermissionAction, decision: AuthorizationDecision) {
    super(`Action ${action} is not allowed.`);
    this.name = "AuthorizationError";
    this.action = action;
    this.decision = decision;
  }
}

const collaboratorRules: readonly PermissionRule[] = [
  rule("session.read", ["own"], "Read own authenticated session.", "read"),
  rule("feed.read", ["department", "store"], "Read allowed department or store feed.", "read"),
  rule("feed.create", ["department"], "Create own FLV feed posts in allowed department.", "write"),
  rule("feed.comment", ["department"], "Comment on visible feed posts.", "write"),
  rule("feed.react", ["department"], "React to visible feed posts.", "write"),
  rule(
    "feed.feedback.create",
    ["own", "department"],
    "Submit private improvement feedback.",
    "write",
  ),
  rule("schedule.read", ["own"], "Read own schedule and request status.", "read"),
  rule(
    "schedule.request.create",
    ["own"],
    "Create own availability, time-off and swap requests.",
    "write",
  ),
  rule("operations.routine.read", ["own", "department"], "Read assigned FLV routines.", "read"),
  rule(
    "operations.routine.complete",
    ["own", "department"],
    "Complete assigned FLV routines.",
    "write",
  ),
  rule(
    "operations.issue.create",
    ["department"],
    "Log FLV issues inside allowed department.",
    "write",
  ),
  rule("operations.evidence.read", ["own", "department"], "Read own or assigned evidence.", "read"),
  rule(
    "engagement.campaign.read",
    ["department"],
    "Read active engagement campaigns in the department.",
    "read",
  ),
  rule(
    "engagement.archive.read",
    ["own"],
    "Read own achievement archive and reward status.",
    "read",
  ),
  rule("recognition.read", ["own"], "Read own rewards and recognition history.", "read"),
  rule("recognition.send", ["department"], "Send permitted peer recognition.", "write"),
  rule("media.upload", ["own", "department"], "Upload own feed or evidence media.", "write"),
  rule("media.read", ["own", "department"], "Read allowed private media.", "read"),
];

const sectorLeaderRules: readonly PermissionRule[] = [
  ...collaboratorRules,
  rule("schedule.read", ["department"], "Read department schedules and planner views.", "read"),
  rule("feed.moderate", ["department"], "Moderate FLV feed posts and comments.", "write"),
  rule("feed.announcement.manage", ["department"], "Manage department announcements.", "write"),
  rule("feed.poll.manage", ["department"], "Manage department polls.", "write"),
  rule("schedule.request.review", ["department"], "Review schedule requests.", "write"),
  rule("schedule.publish", ["department"], "Publish department schedules.", "write"),
  rule("schedule.change", ["department"], "Change department shifts.", "write"),
  rule("schedule.swap.approve", ["department"], "Approve department shift swaps.", "write"),
  rule(
    "operations.routine.manage",
    ["department"],
    "Manage department routines and checklists.",
    "write",
  ),
  rule("operations.issue.manage", ["department"], "Manage department FLV issues.", "write"),
  rule("operations.summary.read", ["department"], "Read department shift summaries.", "read"),
  rule(
    "engagement.archive.read",
    ["department"],
    "Read scoped achievement archives for department members.",
    "read",
  ),
  rule(
    "engagement.manage",
    ["department"],
    "Create, close and fulfill scoped engagement campaigns.",
    "write",
  ),
  rule("recognition.manage", ["department"], "Manage department recognition flows.", "write"),
  rule("dashboard.read", ["department"], "Read department dashboard slices.", "read"),
  rule(
    "dashboard.memberDetail.read",
    ["department"],
    "Read leader-only collaborator detail.",
    "read",
  ),
  rule("media.moderate", ["department"], "Moderate department media.", "write"),
  rule("invite.list", ["department"], "List pending department access invites.", "read"),
  rule("invite.create", ["department"], "Create department collaborator access invites.", "write"),
  rule("invite.resend", ["department"], "Resend pending department access invites.", "write"),
  rule("invite.revoke", ["department"], "Revoke pending department access invites.", "write"),
];

const storeManagerRules: readonly PermissionRule[] = [
  ...sectorLeaderRules,
  rule("feed.read", ["store"], "Read store-wide feed.", "read"),
  rule("feed.moderate", ["store"], "Moderate store-wide feed.", "write"),
  rule("media.read", ["store"], "Read store-scoped private media.", "read"),
  rule("media.moderate", ["store"], "Moderate store-scoped media.", "write"),
  rule("invite.list", ["store"], "List store access invites.", "read"),
  rule("invite.create", ["store"], "Create store-scoped access invites.", "write"),
  rule("invite.resend", ["store"], "Resend store-scoped access invites.", "write"),
  rule("invite.revoke", ["store"], "Revoke store-scoped access invites.", "write"),
  rule("schedule.read", ["store"], "Read store schedules.", "read"),
  rule("schedule.request.review", ["store"], "Review store schedule requests.", "write"),
  rule("schedule.publish", ["store"], "Publish store schedules.", "write"),
  rule("schedule.change", ["store"], "Change store shifts.", "write"),
  rule("schedule.swap.approve", ["store"], "Approve escalated store shift swaps.", "write"),
  rule("operations.summary.read", ["store"], "Read store operational summaries.", "read"),
  rule("engagement.campaign.read", ["store"], "Read store engagement campaigns.", "read"),
  rule("engagement.archive.read", ["store"], "Read store achievement archives.", "read"),
  rule("engagement.manage", ["store"], "Manage store engagement campaigns and rewards.", "write"),
  rule("dashboard.read", ["store"], "Read store-wide dashboards.", "read"),
  rule("dashboard.memberDetail.read", ["store"], "Read store member detail.", "read"),
  rule("dashboard.sensitiveReport.read", ["store"], "Read store sensitive reports.", "read"),
  rule("department.manage", ["store"], "Manage store departments.", "write"),
  rule("users.manage", ["store"], "Manage store users.", "write"),
  rule("roles.manage", ["store"], "Assign or remove store leaders.", "write"),
  rule("audit.read", ["store"], "Read store audit history.", "read"),
  rule("security.event.read", ["store"], "Read store security events.", "read"),
];

const organizationAdminRules: readonly PermissionRule[] = [
  ...storeManagerRules,
  rule("feed.read", ["organization"], "Read organization feed.", "read"),
  rule("feed.moderate", ["organization"], "Moderate organization feed.", "write"),
  rule("media.read", ["organization"], "Read organization private media.", "read"),
  rule("media.moderate", ["organization"], "Moderate organization media.", "write"),
  rule("invite.list", ["organization"], "List organization access invites.", "read"),
  rule("invite.create", ["organization"], "Create organization access invites.", "write"),
  rule("invite.resend", ["organization"], "Resend organization access invites.", "write"),
  rule("invite.revoke", ["organization"], "Revoke organization access invites.", "write"),
  rule("schedule.read", ["organization"], "Read organization schedules.", "read"),
  rule("schedule.publish", ["organization"], "Publish organization schedules.", "write"),
  rule("schedule.change", ["organization"], "Change organization schedules.", "write"),
  rule("operations.summary.read", ["organization"], "Read organization operations.", "read"),
  rule(
    "engagement.campaign.read",
    ["organization"],
    "Read organization engagement campaigns.",
    "read",
  ),
  rule(
    "engagement.archive.read",
    ["organization"],
    "Read organization achievement archives.",
    "read",
  ),
  rule(
    "engagement.manage",
    ["organization"],
    "Manage organization engagement campaigns and rewards.",
    "write",
  ),
  rule("dashboard.read", ["organization"], "Read organization dashboards.", "read"),
  rule("dashboard.memberDetail.read", ["organization"], "Read organization member detail.", "read"),
  rule(
    "dashboard.sensitiveReport.read",
    ["organization"],
    "Read organization sensitive reports.",
    "read",
  ),
  rule(
    "permissions.change",
    ["organization"],
    "Change permissions and scoped memberships.",
    "write",
  ),
  rule("users.manage", ["organization"], "Manage organization users.", "write"),
  rule("roles.manage", ["organization"], "Manage organization roles.", "write"),
  rule("organization.manage", ["organization"], "Manage organization settings.", "write"),
  rule("store.manage", ["organization"], "Create and manage stores.", "write"),
  rule("department.manage", ["organization"], "Create and manage departments.", "write"),
  rule("integrations.manage", ["organization"], "Manage integration settings.", "write"),
  rule("audit.read", ["organization"], "Read organization audit history.", "read"),
  rule("security.event.read", ["organization"], "Read organization security events.", "read"),
  rule("settings.manage", ["organization"], "Manage global settings.", "write"),
  rule(
    "recognition.points.adjust",
    ["organization"],
    "Adjust points through audited admin flow.",
    "write",
  ),
];

const auditorRules: readonly PermissionRule[] = [
  rule("session.read", ["own"], "Read own authenticated session.", "read"),
  rule("audit.read", ["organization", "store", "department"], "Read scoped audit logs.", "read"),
  rule(
    "security.event.read",
    ["organization", "store", "department"],
    "Read scoped security events.",
    "read",
  ),
  rule(
    "dashboard.sensitiveReport.read",
    ["organization", "store", "department"],
    "Read explicitly scoped sensitive reports.",
    "read",
  ),
  rule(
    "operations.evidence.read",
    ["organization", "store", "department"],
    "Read scoped evidence.",
    "read",
  ),
  rule(
    "engagement.campaign.read",
    ["organization", "store", "department"],
    "Read scoped engagement campaigns.",
    "read",
  ),
  rule(
    "engagement.archive.read",
    ["organization", "store", "department"],
    "Read scoped achievement archives.",
    "read",
  ),
  rule(
    "media.read",
    ["organization", "store", "department"],
    "Read scoped evidence media.",
    "read",
  ),
];

export const permissionMatrix: PermissionMatrix = {
  "admin-organizacao": organizationAdminRules,
  auditor: auditorRules,
  colaborador: collaboratorRules,
  "gerente-loja": storeManagerRules,
  "lider-setor": sectorLeaderRules,
};

export const roleDocumentation: Readonly<Record<FlvRole, string>> = {
  "admin-organizacao":
    "Manages organizations, stores, departments, users, roles, global settings, audit access and integrations.",
  auditor:
    "Read-only access to audit logs, evidence and sensitive reports according to explicit scope.",
  colaborador:
    "Accesses own schedule, own requests, assigned routines, allowed feed and own rewards.",
  "gerente-loja":
    "Manages store-wide dashboards, department leadership and escalated schedule approvals.",
  "lider-setor":
    "Manages FLV-scoped feed moderation, routines, schedule requests, recognition and dashboard slices.",
};

export const routePermissionActions = {
  audit: "audit.read",
  collaborator: "feed.read",
  dashboard: "dashboard.read",
  engagement: "engagement.campaign.read",
  feed: "feed.read",
  leader: "dashboard.read",
  media: "media.upload",
  operations: "operations.routine.read",
  recognition: "recognition.read",
  schedules: "schedule.read",
} as const satisfies Readonly<Record<string, PermissionAction>>;

export const authAuditActions = [
  "invite.create",
  "invite.resend",
  "invite.revoke",
  "invite.accept",
  "auth.login_failure",
  "auth.logout",
  "auth.role_scope.change",
] as const;

export type AuthAuditAction = (typeof authAuditActions)[number];

export const auditRequiredActions = [
  "feed.moderate",
  "schedule.publish",
  "schedule.change",
  "schedule.swap.approve",
  "engagement.archive.read",
  "engagement.manage",
  "recognition.send",
  "recognition.manage",
  "recognition.points.adjust",
  "media.upload",
  "media.moderate",
  "permissions.change",
  "users.manage",
  "roles.manage",
  "audit.read",
  "security.event.read",
] as const satisfies readonly PermissionAction[];

export const requiredAuditActions = [...auditRequiredActions, ...authAuditActions] as const;

export type AuditRequiredAction = (typeof auditRequiredActions)[number];
export type RequiredAuditAction = (typeof requiredAuditActions)[number];

export interface AuditEvent {
  readonly action: string;
  readonly actorUserId?: string;
  readonly createdAt: string;
  readonly departmentId?: string;
  readonly id: string;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly newState: Readonly<Record<string, unknown>>;
  readonly organizationId: string;
  readonly previousState: Readonly<Record<string, unknown>>;
  readonly requestId?: string;
  readonly storeId?: string;
  readonly targetId?: string;
  readonly targetType: string;
}

export interface AuditLogSink {
  append(event: AuditEvent): Promise<void> | void;
}

export class InMemoryAuditLogSink implements AuditLogSink {
  readonly events: AuditEvent[] = [];

  append(event: AuditEvent): void {
    this.events.push(deepFreezeAuditEvent(event));
  }
}

export interface CreateAuditEventInput {
  readonly action: string;
  readonly actor?: SecurityActor;
  readonly createdAt?: Date;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly newState?: Readonly<Record<string, unknown>>;
  readonly previousState?: Readonly<Record<string, unknown>>;
  readonly requestId?: string;
  readonly scope?: SecurityTenantScope;
  readonly targetId?: string;
  readonly targetType: string;
}

export const rateLimitPolicies = {
  "auth.login": { maxAttempts: 5, windowMs: 300_000 },
  "auth.session": { maxAttempts: 30, windowMs: 60_000 },
  "feed.comment": { maxAttempts: 20, windowMs: 60_000 },
  "feed.post": { maxAttempts: 12, windowMs: 300_000 },
  "feed.reaction": { maxAttempts: 60, windowMs: 60_000 },
  "feedback.submit": { maxAttempts: 6, windowMs: 300_000 },
  "engagement.manage": { maxAttempts: 12, windowMs: 300_000 },
  "media.upload": { maxAttempts: 8, windowMs: 300_000 },
  "invite.manage": { maxAttempts: 20, windowMs: 300_000 },
  "recognition.send": { maxAttempts: 10, windowMs: 300_000 },
  "schedule.change": { maxAttempts: 20, windowMs: 300_000 },
} as const;

export type RateLimitPolicyKey = keyof typeof rateLimitPolicies;

export interface RateLimitDecision {
  readonly allowed: boolean;
  readonly limit: number;
  readonly remaining: number;
  readonly resetAt: string;
}

export class InMemoryRateLimiter {
  private readonly buckets = new Map<string, RateLimitBucket>();

  consume(policyKey: RateLimitPolicyKey, subject: string, now = new Date()): RateLimitDecision {
    const policy = rateLimitPolicies[policyKey];
    const key = `${policyKey}:${subject}`;
    const nowMs = now.getTime();
    const current = this.buckets.get(key);
    const bucket =
      current === undefined || nowMs >= current.resetAtMs
        ? { count: 0, resetAtMs: nowMs + policy.windowMs }
        : current;

    bucket.count += 1;
    this.buckets.set(key, bucket);

    const allowed = bucket.count <= policy.maxAttempts;

    return {
      allowed,
      limit: policy.maxAttempts,
      remaining: Math.max(policy.maxAttempts - bucket.count, 0),
      resetAt: new Date(bucket.resetAtMs).toISOString(),
    };
  }
}

interface RateLimitBucket {
  count: number;
  resetAtMs: number;
}

export type AuthProviderKind = "local-development" | "better-auth" | "neon-auth" | "custom";

export const developmentDatabaseProviders = ["local-postgres", "neon"] as const;

export type DevelopmentDatabaseProvider = (typeof developmentDatabaseProviders)[number];

export const developmentAuthProviders = [
  "development",
  "local-better-auth",
  "neon-auth",
  "clerk",
  "auth0",
] as const;

export type DevelopmentAuthProvider = (typeof developmentAuthProviders)[number];

export const developmentStorageProviders = [
  "local-filesystem",
  "minio-compatible",
  "cloudflare-r2",
  "s3",
] as const;

export type DevelopmentStorageProvider = (typeof developmentStorageProviders)[number];

export const developmentEmailProviders = ["console", "smtp"] as const;

export type DevelopmentEmailProvider = (typeof developmentEmailProviders)[number];

export const developmentAnalyticsProviders = ["local-log", "posthog", "segment"] as const;

export type DevelopmentAnalyticsProvider = (typeof developmentAnalyticsProviders)[number];

export const developmentCiProviders = ["local", "github-actions"] as const;

export type DevelopmentCiProvider = (typeof developmentCiProviders)[number];

export const developmentBuildProviders = ["expo-local", "eas-remote"] as const;

export type DevelopmentBuildProvider = (typeof developmentBuildProviders)[number];

export const developmentMonitoringProviders = ["local-log", "sentry", "datadog"] as const;

export type DevelopmentMonitoringProvider = (typeof developmentMonitoringProviders)[number];

export interface DevelopmentPlatformConfig {
  readonly allowMeteredProviders: boolean;
  readonly analyticsProvider: DevelopmentAnalyticsProvider;
  readonly authProvider: DevelopmentAuthProvider;
  readonly buildProvider: DevelopmentBuildProvider;
  readonly ciProvider: DevelopmentCiProvider;
  readonly costGuardrailsEnabled: boolean;
  readonly databaseProvider: DevelopmentDatabaseProvider;
  readonly emailProvider: DevelopmentEmailProvider;
  readonly monitoringProvider: DevelopmentMonitoringProvider;
  readonly storageProvider: DevelopmentStorageProvider;
}

export interface DevelopmentPlatformValidationResult {
  readonly errors: readonly string[];
  readonly ok: boolean;
  readonly warnings: readonly string[];
}

export interface VerifiedSession {
  readonly actor: SecurityActor;
  readonly expiresAt?: string;
  readonly provider: AuthProviderKind;
  readonly providerSubject: string;
}

export type SessionVerificationResult =
  | {
      readonly ok: true;
      readonly session: VerifiedSession;
    }
  | {
      readonly code: "invalid_token" | "missing_token";
      readonly ok: false;
    };

export interface AuthProviderAdapter {
  readonly provider: AuthProviderKind;
  verifySessionToken(token: string | undefined): Promise<SessionVerificationResult>;
}

export interface PasswordHashOptions {
  readonly blockSize?: number;
  readonly cost?: number;
  readonly keyLength?: number;
  readonly parallelization?: number;
  readonly salt?: string;
}

export interface IssuedAuthSessionToken {
  readonly expiresAt: Date;
  readonly issuedAt: Date;
  readonly token: string;
  readonly tokenHash: string;
}

export interface GeneratedInviteToken {
  readonly token: string;
  readonly tokenHash: string;
}

const scryptAsync = promisify(scryptCallback) as (
  password: string,
  salt: string,
  keyLength: number,
  options: {
    readonly N: number;
    readonly p: number;
    readonly r: number;
  },
) => Promise<Buffer>;

const defaultPasswordHashOptions = {
  blockSize: 8,
  cost: 16_384,
  keyLength: 64,
  parallelization: 1,
} as const satisfies Required<Omit<PasswordHashOptions, "salt">>;

export async function hashPassword(
  password: string,
  options: PasswordHashOptions = {},
): Promise<string> {
  assertPasswordCanBeHashed(password);

  const salt = options.salt ?? randomBytes(16).toString("base64url");
  const cost = options.cost ?? defaultPasswordHashOptions.cost;
  const blockSize = options.blockSize ?? defaultPasswordHashOptions.blockSize;
  const parallelization =
    options.parallelization ?? defaultPasswordHashOptions.parallelization;
  const keyLength = options.keyLength ?? defaultPasswordHashOptions.keyLength;
  const key = await scryptAsync(password, salt, keyLength, {
    N: cost,
    p: parallelization,
    r: blockSize,
  });

  return [
    "scrypt",
    String(cost),
    String(blockSize),
    String(parallelization),
    salt,
    key.toString("base64url"),
  ].join("$");
}

export async function verifyPassword(password: string, encodedHash: string): Promise<boolean> {
  const parsed = parsePasswordHash(encodedHash);

  if (parsed === undefined) {
    return false;
  }

  const computed = await scryptAsync(password, parsed.salt, parsed.key.length, {
    N: parsed.cost,
    p: parsed.parallelization,
    r: parsed.blockSize,
  });

  return computed.length === parsed.key.length && timingSafeEqual(computed, parsed.key);
}

export function generateOpaqueAuthToken(prefix: "inv" | "sess" | "tok" = "tok"): string {
  return `${prefix}_${randomBytes(32).toString("base64url")}`;
}

export function hashAuthToken(token: string, secret: string): string {
  assertTokenSecret(secret);

  return createHmac("sha256", secret).update(token).digest("hex");
}

export function issueSessionToken(input: {
  readonly now?: Date;
  readonly sessionSecret: string;
  readonly ttlMs?: number;
}): IssuedAuthSessionToken {
  const issuedAt = input.now ?? new Date();
  const token = generateOpaqueAuthToken("sess");
  const ttlMs = input.ttlMs ?? 1000 * 60 * 60 * 24 * 14;
  const expiresAt = new Date(issuedAt.getTime() + ttlMs);

  return {
    expiresAt,
    issuedAt,
    token,
    tokenHash: hashAuthToken(token, input.sessionSecret),
  };
}

export function generateInviteToken(input: { readonly inviteSecret: string }): GeneratedInviteToken {
  const token = generateOpaqueAuthToken("inv");

  return {
    token,
    tokenHash: hashAuthToken(token, input.inviteSecret),
  };
}

export function isAuthSessionExpired(expiresAt: Date | string, now = new Date()): boolean {
  const expiresAtDate = typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;

  return expiresAtDate.getTime() <= now.getTime();
}

export interface DevelopmentAuthAdapterOptions {
  readonly allowMissingToken?: boolean;
  readonly defaultActor?: SecurityActor;
  readonly provider?: Exclude<AuthProviderKind, "custom">;
}

export const developmentActors = {
  "admin-organizacao": actor("user_demo_admin", "admin-organizacao", {
    organizationId: "org_demo",
  }),
  auditor: actor("user_demo_auditor", "auditor", {
    organizationId: "org_demo",
    storeId: "store_001",
  }),
  colaborador: actor("user_demo_colaborador", "colaborador", {
    departmentId: "dept_flv",
    organizationId: "org_demo",
    storeId: "store_001",
  }),
  "gerente-loja": actor("user_demo_gerente", "gerente-loja", {
    organizationId: "org_demo",
    storeId: "store_001",
  }),
  "lider-setor": actor("user_demo_lider", "lider-setor", {
    departmentId: "dept_flv",
    organizationId: "org_demo",
    storeId: "store_001",
  }),
} as const satisfies Readonly<Record<FlvRole, SecurityActor>>;

export const developmentSessionTokens = Object.fromEntries(
  flvRoles.map((roleName) => [
    roleName,
    createDevelopmentSessionToken(developmentActors[roleName]),
  ]),
) as Readonly<Record<FlvRole, string>>;

export const serverOnlyEnvironmentPrefixes = [
  "AUTH_",
  "DATABASE_",
  "INVITE_",
  "JWT_",
  "NEON_",
  "PASSWORD_RESET_",
  "R2_SECRET",
  "RECOVERY_",
  "SESSION_",
  "S3_SECRET",
  "STRIPE_SECRET",
] as const;

export const mobilePublicEnvironmentNames = [
  "EXPO_PUBLIC_ANALYTICS_PROVIDER",
  "EXPO_PUBLIC_API_URL",
  "EXPO_PUBLIC_APP_ENV",
  "EXPO_PUBLIC_ENABLE_MOCK_SESSION",
] as const;

export type MobilePublicEnvironmentName = (typeof mobilePublicEnvironmentNames)[number];

export interface EnvironmentValidationResult {
  readonly errors: readonly string[];
  readonly ok: boolean;
  readonly warnings: readonly string[];
}

export interface EnvironmentValidationInput {
  readonly clientEnv?: Readonly<Record<string, string | undefined>>;
  readonly requiredServerNames?: readonly string[];
  readonly serverEnv: Readonly<Record<string, string | undefined>>;
}

export interface StructuredLogEvent {
  readonly actor?: {
    readonly role: FlvRole;
    readonly userId: string;
  };
  readonly level: "debug" | "error" | "info" | "warn";
  readonly message: string;
  readonly metadata: unknown;
  readonly requestId: string;
  readonly timestamp: string;
}

export function getPermissionRulesForRole(roleName: FlvRole): readonly PermissionRule[] {
  return permissionMatrix[roleName];
}

export function canRolePerform(roleName: FlvRole, action: PermissionAction): boolean {
  return getPermissionRulesForRole(roleName).some((permission) => permission.action === action);
}

export function evaluatePermission(
  actorContext: SecurityActor,
  request: AuthorizationRequest,
): AuthorizationDecision {
  const matchingRules = getPermissionRulesForRole(actorContext.role).filter(
    (permission) => permission.action === request.action,
  );

  if (matchingRules.length === 0) {
    return deny("missing_permission", 403);
  }

  if (
    actorContext.role === "auditor" &&
    matchingRules.some((permission) => permission.kind === "write")
  ) {
    return deny("read_only_role", 403);
  }

  const resource = request.resource ?? actorContext.scope;

  for (const permission of matchingRules) {
    if (isResourceAllowedForPermission(actorContext, permission, resource)) {
      return {
        allowed: true,
        reason: "allowed",
        safeStatusCode: 403,
      };
    }
  }

  return deny("outside_scope", 404);
}

export function assertAuthorized(actorContext: SecurityActor, request: AuthorizationRequest): void {
  const decision = evaluatePermission(actorContext, request);

  if (!decision.allowed) {
    throw new AuthorizationError(request.action, decision);
  }
}

export function scopeForActor(actorContext: SecurityActor): ScopedResource {
  return {
    organizationId: actorContext.scope.organizationId,
    ownerUserId: actorContext.userId,
    targetUserId: actorContext.userId,
    ...(actorContext.scope.departmentId === undefined
      ? {}
      : { departmentId: actorContext.scope.departmentId }),
    ...(actorContext.scope.storeId === undefined ? {} : { storeId: actorContext.scope.storeId }),
  };
}

export function createAuditEvent(input: CreateAuditEventInput): AuditEvent {
  const scope = input.scope ?? input.actor?.scope;

  if (scope === undefined) {
    throw new Error("Audit event scope is required.");
  }

  const createdAt = input.createdAt ?? new Date();

  return {
    action: input.action,
    createdAt: createdAt.toISOString(),
    id: `audit_${createdAt.getTime()}_${Math.random().toString(36).slice(2, 10)}`,
    metadata: input.metadata ?? {},
    newState: input.newState ?? {},
    organizationId: scope.organizationId,
    previousState: input.previousState ?? {},
    targetType: input.targetType,
    ...(input.actor === undefined ? {} : { actorUserId: input.actor.userId }),
    ...(input.requestId === undefined ? {} : { requestId: input.requestId }),
    ...(input.targetId === undefined ? {} : { targetId: input.targetId }),
    ...(scope.departmentId === undefined ? {} : { departmentId: scope.departmentId }),
    ...(scope.storeId === undefined ? {} : { storeId: scope.storeId }),
  };
}

export function shouldAuditAction(action: string): boolean {
  return requiredAuditActions.includes(action as RequiredAuditAction);
}

export function extractBearerToken(authorizationHeader: string | undefined): string | undefined {
  if (authorizationHeader === undefined) {
    return undefined;
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || token === undefined || token.length === 0) {
    return undefined;
  }

  return token;
}

export function createDevelopmentSessionToken(sessionActor: SecurityActor): string {
  const storeId = sessionActor.scope.storeId ?? "_";
  const departmentId = sessionActor.scope.departmentId ?? "_";

  return [
    "dev",
    encodeURIComponent(sessionActor.userId),
    sessionActor.role,
    encodeURIComponent(sessionActor.scope.organizationId),
    encodeURIComponent(storeId),
    encodeURIComponent(departmentId),
  ].join(":");
}

export function parseDevelopmentSessionToken(token: string): SecurityActor | undefined {
  const [kind, userId, roleName, organizationId, storeId, departmentId] = token.split(":");

  if (
    kind !== "dev" ||
    userId === undefined ||
    !isFlvRole(roleName) ||
    organizationId === undefined ||
    storeId === undefined ||
    departmentId === undefined
  ) {
    return undefined;
  }

  return actor(
    decodeURIComponent(userId),
    roleName,
    compactScope({
      departmentId: decodeOptionalTokenValue(departmentId),
      organizationId: decodeURIComponent(organizationId),
      storeId: decodeOptionalTokenValue(storeId),
    }),
  );
}

export function createDevelopmentAuthAdapter(
  options: DevelopmentAuthAdapterOptions = {},
): AuthProviderAdapter {
  const provider = options.provider ?? "local-development";

  return {
    provider,
    verifySessionToken(token) {
      if (token === undefined) {
        if (options.allowMissingToken === true) {
          const defaultActor = options.defaultActor ?? developmentActors.colaborador;

          return Promise.resolve({
            ok: true,
            session: {
              actor: defaultActor,
              provider,
              providerSubject: defaultActor.userId,
            },
          });
        }

        return Promise.resolve({
          code: "missing_token",
          ok: false,
        });
      }

      const parsedActor = parseDevelopmentSessionToken(token);

      if (parsedActor === undefined) {
        return Promise.resolve({
          code: "invalid_token",
          ok: false,
        });
      }

      return Promise.resolve({
        ok: true,
        session: {
          actor: parsedActor,
          provider,
          providerSubject: parsedActor.userId,
        },
      });
    },
  };
}

export function loadDevelopmentPlatformConfig(
  env: Readonly<Record<string, string | undefined>> = process.env,
): DevelopmentPlatformConfig {
  return {
    allowMeteredProviders: readBooleanEnvironment(
      env.ALLOW_METERED_PROVIDERS,
      false,
      "ALLOW_METERED_PROVIDERS",
    ),
    analyticsProvider: readEnvironmentProvider(
      env.ANALYTICS_PROVIDER,
      "local-log",
      developmentAnalyticsProviders,
      "ANALYTICS_PROVIDER",
    ),
    authProvider: readEnvironmentProvider(
      env.AUTH_PROVIDER,
      "local-better-auth",
      developmentAuthProviders,
      "AUTH_PROVIDER",
    ),
    buildProvider: readEnvironmentProvider(
      env.BUILD_PROVIDER,
      "expo-local",
      developmentBuildProviders,
      "BUILD_PROVIDER",
    ),
    ciProvider: readEnvironmentProvider(
      env.CI_PROVIDER,
      "local",
      developmentCiProviders,
      "CI_PROVIDER",
    ),
    costGuardrailsEnabled: readBooleanEnvironment(
      env.COST_GUARDRAILS_ENABLED,
      true,
      "COST_GUARDRAILS_ENABLED",
    ),
    databaseProvider: readEnvironmentProvider(
      env.DATABASE_PROVIDER,
      "local-postgres",
      developmentDatabaseProviders,
      "DATABASE_PROVIDER",
    ),
    emailProvider: readEnvironmentProvider(
      env.EMAIL_PROVIDER,
      "console",
      developmentEmailProviders,
      "EMAIL_PROVIDER",
    ),
    monitoringProvider: readEnvironmentProvider(
      env.MONITORING_PROVIDER,
      "local-log",
      developmentMonitoringProviders,
      "MONITORING_PROVIDER",
    ),
    storageProvider: readEnvironmentProvider(
      env.STORAGE_PROVIDER,
      "local-filesystem",
      developmentStorageProviders,
      "STORAGE_PROVIDER",
    ),
  };
}

export function validateDevelopmentPlatformConfig(
  config: DevelopmentPlatformConfig,
): DevelopmentPlatformValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const selectedProviders = {
    ANALYTICS_PROVIDER: config.analyticsProvider,
    AUTH_PROVIDER: config.authProvider,
    BUILD_PROVIDER: config.buildProvider,
    CI_PROVIDER: config.ciProvider,
    DATABASE_PROVIDER: config.databaseProvider,
    EMAIL_PROVIDER: config.emailProvider,
    MONITORING_PROVIDER: config.monitoringProvider,
    STORAGE_PROVIDER: config.storageProvider,
  } as const satisfies Readonly<Record<string, string>>;

  if (!config.costGuardrailsEnabled) {
    warnings.push("COST_GUARDRAILS_ENABLED=false disables the zero-cost development guardrails.");
  }

  for (const [envName, provider] of Object.entries(selectedProviders)) {
    if (!isMeteredDevelopmentProvider(provider)) {
      continue;
    }

    if (!config.costGuardrailsEnabled || config.allowMeteredProviders) {
      warnings.push(`${envName}=${provider} is enabled and may exceed free development budgets.`);
      continue;
    }

    errors.push(
      `${envName}=${provider} is metered or paid. Set ALLOW_METERED_PROVIDERS=true only when you intentionally want to use a paid/free-quota path.`,
    );
  }

  return {
    errors,
    ok: errors.length === 0,
    warnings,
  };
}

export function getDevelopmentRequiredServerEnvironmentNames(
  env: Readonly<Record<string, string | undefined>> = process.env,
): readonly string[] {
  const config = loadDevelopmentPlatformConfig(env);
  const requiredNames = new Set<string>();

  if (config.authProvider === "development" || config.authProvider === "local-better-auth") {
    requiredNames.add("AUTH_LOCAL_SECRET");
  }

  if (env.DATABASE_PROVIDER === "neon") {
    requiredNames.add("NEON_DATABASE_URL");
  }

  if (env.DATABASE_PROVIDER === "local-postgres") {
    requiredNames.add("DATABASE_URL");
  }

  if (env.AUTH_PROVIDER !== undefined || env.APP_ENV === "production") {
    requiredNames.add("INVITE_TOKEN_SECRET");
    requiredNames.add("SESSION_SECRET");
  }

  return [...requiredNames];
}

export function createAuthAdapterFromEnvironment(
  options: DevelopmentAuthAdapterOptions & {
    readonly env?: Readonly<Record<string, string | undefined>>;
  } = {},
): AuthProviderAdapter {
  const config = loadDevelopmentPlatformConfig(options.env);

  if (config.authProvider === "neon-auth") {
    return createDevelopmentAuthAdapter({
      ...options,
      provider: "neon-auth",
    });
  }

  if (config.authProvider === "local-better-auth") {
    return createDevelopmentAuthAdapter({
      ...options,
      provider: "better-auth",
    });
  }

  return createDevelopmentAuthAdapter({
    ...options,
    provider: "local-development",
  });
}

export function isServerOnlyEnvironmentName(name: string): boolean {
  return serverOnlyEnvironmentPrefixes.some((prefix) => name.startsWith(prefix));
}

export function validateSecurityEnvironment(
  input: EnvironmentValidationInput,
): EnvironmentValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const requiredServerNames = new Set(input.requiredServerNames ?? []);

  try {
    const platformValidation = validateDevelopmentPlatformConfig(
      loadDevelopmentPlatformConfig(input.serverEnv),
    );

    errors.push(...platformValidation.errors);
    warnings.push(...platformValidation.warnings);

    for (const name of getDevelopmentRequiredServerEnvironmentNames(input.serverEnv)) {
      requiredServerNames.add(name);
    }
  } catch (error) {
    errors.push(
      error instanceof Error
        ? error.message
        : "Invalid zero-cost development provider configuration.",
    );
  }

  for (const name of requiredServerNames) {
    const value = input.serverEnv[name];

    if (value === undefined || value.trim().length === 0) {
      errors.push(`${name} is required on the server.`);
    }
  }

  for (const [name, value] of Object.entries(input.serverEnv)) {
    if (isServerOnlyEnvironmentName(name) && isPlaceholderSecret(value)) {
      warnings.push(`${name} still uses a placeholder value.`);
    }
  }

  for (const exposedName of findServerOnlyClientEnvironmentNames(input.clientEnv ?? {})) {
    errors.push(`${exposedName} must not be exposed to the client environment.`);
  }

  return {
    errors,
    ok: errors.length === 0,
    warnings,
  };
}

export function findServerOnlyClientEnvironmentNames(
  clientEnv: Readonly<Record<string, string | undefined>>,
): readonly string[] {
  return Object.keys(clientEnv).filter((name) => isServerOnlyEnvironmentName(name));
}

export function findUnexpectedMobilePublicEnvironmentNames(
  clientEnv: Readonly<Record<string, string | undefined>>,
): readonly string[] {
  return Object.keys(clientEnv).filter(
    (name) =>
      name.startsWith("EXPO_PUBLIC_") &&
      !(mobilePublicEnvironmentNames as readonly string[]).includes(name),
  );
}

export function validateMobilePublicEnvironment(
  clientEnv: Readonly<Record<string, string | undefined>>,
): EnvironmentValidationResult {
  const errors: string[] = [];

  errors.push(
    ...findServerOnlyClientEnvironmentNames(clientEnv).map(
      (name) => `${name} must not be exposed to the client environment.`,
    ),
  );
  errors.push(
    ...findUnexpectedMobilePublicEnvironmentNames(clientEnv).map(
      (name) => `${name} is not an approved mobile public environment variable.`,
    ),
  );

  if ((clientEnv.EXPO_PUBLIC_API_URL ?? "").trim().length === 0) {
    errors.push("EXPO_PUBLIC_API_URL is required for the mobile app.");
  }

  return {
    errors,
    ok: errors.length === 0,
    warnings: [],
  };
}

export function assertSafeClientEnvironment(
  clientEnv: Readonly<Record<string, string | undefined>>,
): void {
  const exposedNames = findServerOnlyClientEnvironmentNames(clientEnv);
  const unexpectedNames = findUnexpectedMobilePublicEnvironmentNames(clientEnv);

  if (exposedNames.length > 0 || unexpectedNames.length > 0) {
    throw new Error(
      `Unsafe client environment variables: ${[...exposedNames, ...unexpectedNames].join(", ")}.`,
    );
  }
}

export function redactSensitiveRecord(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => redactSensitiveRecord(entry));
  }

  if (!isPlainRecord(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => [
      key,
      shouldRedactKey(key) ? "[REDACTED]" : redactSensitiveRecord(entryValue),
    ]),
  );
}

export function redactError(error: unknown): { readonly message: string; readonly name: string } {
  if (error instanceof AuthorizationError) {
    return {
      message: "Acesso negado.",
      name: error.name,
    };
  }

  if (error instanceof Error) {
    return {
      message: containsSensitiveText(error.message) ? "Erro interno redigido." : error.message,
      name: error.name,
    };
  }

  return {
    message: "Erro interno.",
    name: "Error",
  };
}

export function createStructuredLogEvent(input: {
  readonly actor?: SecurityActor;
  readonly error?: unknown;
  readonly level: StructuredLogEvent["level"];
  readonly message: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly requestId: string;
  readonly timestamp?: Date;
}): StructuredLogEvent {
  const metadata =
    input.error === undefined
      ? (input.metadata ?? {})
      : {
          ...(input.metadata ?? {}),
          error: redactError(input.error),
        };

  const event = {
    level: input.level,
    message: input.message,
    metadata: redactSensitiveRecord(metadata),
    requestId: input.requestId,
    timestamp: (input.timestamp ?? new Date()).toISOString(),
  };

  if (input.actor === undefined) {
    return event;
  }

  return {
    ...event,
    actor: {
      role: input.actor.role,
      userId: input.actor.userId,
    },
  };
}

function assertPasswordCanBeHashed(password: string): void {
  if (password.length < 8) {
    throw new Error("Password must have at least 8 characters.");
  }
}

function assertTokenSecret(secret: string): void {
  if (secret.trim().length < 16) {
    throw new Error("Token secret must have at least 16 characters.");
  }
}

function parsePasswordHash(encodedHash: string):
  | {
      readonly blockSize: number;
      readonly cost: number;
      readonly key: Buffer;
      readonly parallelization: number;
      readonly salt: string;
    }
  | undefined {
  const [algorithm, cost, blockSize, parallelization, salt, key] = encodedHash.split("$");

  if (
    algorithm !== "scrypt" ||
    cost === undefined ||
    blockSize === undefined ||
    parallelization === undefined ||
    salt === undefined ||
    key === undefined
  ) {
    return undefined;
  }

  const parsedCost = Number.parseInt(cost, 10);
  const parsedBlockSize = Number.parseInt(blockSize, 10);
  const parsedParallelization = Number.parseInt(parallelization, 10);

  if (
    Number.isNaN(parsedCost) ||
    Number.isNaN(parsedBlockSize) ||
    Number.isNaN(parsedParallelization)
  ) {
    return undefined;
  }

  return {
    blockSize: parsedBlockSize,
    cost: parsedCost,
    key: Buffer.from(key, "base64url"),
    parallelization: parsedParallelization,
    salt,
  };
}

function rule(
  action: PermissionAction,
  scopes: readonly PermissionScopeLevel[],
  description: string,
  kind: PermissionRule["kind"],
): PermissionRule {
  return {
    action,
    description,
    kind,
    scopes,
  };
}

function actor(userId: string, role: FlvRole, scope: SecurityTenantScope): SecurityActor {
  return {
    role,
    scope,
    userId,
  };
}

function compactScope(scope: {
  readonly departmentId?: string | undefined;
  readonly organizationId: string;
  readonly storeId?: string | undefined;
}): SecurityTenantScope {
  return {
    organizationId: scope.organizationId,
    ...(scope.departmentId === undefined ? {} : { departmentId: scope.departmentId }),
    ...(scope.storeId === undefined ? {} : { storeId: scope.storeId }),
  };
}

function deny(
  reason: Exclude<AuthorizationDecision["reason"], "allowed">,
  safeStatusCode: AuthorizationDecision["safeStatusCode"],
): AuthorizationDecision {
  return {
    allowed: false,
    reason,
    safeStatusCode,
  };
}

function isResourceAllowedForPermission(
  actorContext: SecurityActor,
  permission: PermissionRule,
  resource: ScopedResource,
): boolean {
  if (!sameOrganization(actorContext.scope, resource)) {
    return false;
  }

  return permission.scopes.some((scopeLevel) => {
    if (scopeLevel === "own") {
      return isOwnResource(actorContext, resource);
    }

    return actorScopes(actorContext).some((actorScope) =>
      isResourceInsideScope(actorScope, resource, scopeLevel),
    );
  });
}

function actorScopes(actorContext: SecurityActor): readonly SecurityTenantScope[] {
  return [actorContext.scope, ...(actorContext.additionalScopes ?? [])];
}

function isResourceInsideScope(
  actorScope: SecurityTenantScope,
  resource: ScopedResource,
  scopeLevel: Exclude<PermissionScopeLevel, "own">,
): boolean {
  if (!sameOrganization(actorScope, resource)) {
    return false;
  }

  if (scopeLevel === "organization") {
    return true;
  }

  if (scopeLevel === "store") {
    return actorScope.storeId !== undefined && actorScope.storeId === resource.storeId;
  }

  return (
    actorScope.storeId !== undefined &&
    actorScope.departmentId !== undefined &&
    actorScope.storeId === resource.storeId &&
    actorScope.departmentId === resource.departmentId
  );
}

function isOwnResource(actorContext: SecurityActor, resource: ScopedResource): boolean {
  const targetUserId = resource.targetUserId ?? resource.ownerUserId;

  return (
    targetUserId === actorContext.userId &&
    sameOrganization(actorContext.scope, resource) &&
    (resource.storeId === undefined ||
      actorContext.scope.storeId === undefined ||
      actorContext.scope.storeId === resource.storeId) &&
    (resource.departmentId === undefined ||
      actorContext.scope.departmentId === undefined ||
      actorContext.scope.departmentId === resource.departmentId)
  );
}

function sameOrganization(left: SecurityTenantScope, right: SecurityTenantScope): boolean {
  return left.organizationId === right.organizationId;
}

function isFlvRole(value: string | undefined): value is FlvRole {
  return value !== undefined && (flvRoles as readonly string[]).includes(value);
}

function decodeOptionalTokenValue(value: string): string | undefined {
  const decoded = decodeURIComponent(value);

  return decoded === "_" ? undefined : decoded;
}

function readEnvironmentProvider<TProvider extends string>(
  value: string | undefined,
  defaultValue: TProvider,
  allowedValues: readonly TProvider[],
  envName: string,
): TProvider {
  const resolvedValue = value ?? defaultValue;

  if ((allowedValues as readonly string[]).includes(resolvedValue)) {
    return resolvedValue as TProvider;
  }

  throw new Error(`${envName} must be one of: ${allowedValues.join(", ")}.`);
}

function readBooleanEnvironment(
  value: string | undefined,
  defaultValue: boolean,
  envName: string,
): boolean {
  if (value === undefined) {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  throw new Error(`${envName} must be a boolean-like value.`);
}

function deepFreezeAuditEvent(event: AuditEvent): AuditEvent {
  Object.freeze(event.metadata);
  Object.freeze(event.previousState);
  Object.freeze(event.newState);

  return Object.freeze({ ...event });
}

function isPlaceholderSecret(value: string | undefined): boolean {
  if (value === undefined) {
    return false;
  }

  const normalized = value.trim().toLowerCase();

  return (
    normalized.length === 0 ||
    normalized === "change-me" ||
    normalized === "replace-me" ||
    normalized === "replace-with-local-dev-value"
  );
}

function isMeteredDevelopmentProvider(provider: string): boolean {
  return [
    "auth0",
    "clerk",
    "cloudflare-r2",
    "datadog",
    "eas-remote",
    "posthog",
    "s3",
    "segment",
    "sentry",
    "smtp",
  ].includes(provider);
}

function shouldRedactKey(key: string): boolean {
  const normalized = key.toLowerCase();

  return (
    normalized.includes("authorization") ||
    normalized.includes("cookie") ||
    normalized.includes("database_url") ||
    normalized.includes("password") ||
    normalized.includes("secret") ||
    normalized.includes("token")
  );
}

function containsSensitiveText(value: string): boolean {
  const normalized = value.toLowerCase();

  return (
    normalized.includes("database_url") ||
    normalized.includes("secret") ||
    normalized.includes("token")
  );
}

function isPlainRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
