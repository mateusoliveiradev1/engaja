import type { FlvRole } from "@engaja/contracts";
import type { MobileSession } from "../app/providers.js";

export interface MobileRouteGroup {
  readonly allowedFallbackHref: string;
  readonly entryHref: string;
  readonly kind: "public" | "protected";
  readonly requiredAction?: MobileRouteAction;
  readonly requiredRoles: readonly FlvRole[];
  readonly segment: string;
}

type MobileRouteAction = "dashboard.read" | "feed.read";

export const leaderRoles = ["lider-setor", "gerente-loja", "admin-organizacao"] as const;

export const mobileRouteGroups = {
  auth: {
    allowedFallbackHref: "/(collaborator)",
    entryHref: "/(auth)/sign-in",
    kind: "public",
    requiredRoles: [],
    segment: "(auth)",
  },
  collaborator: {
    allowedFallbackHref: "/(auth)/sign-in",
    entryHref: "/(collaborator)",
    kind: "protected",
    requiredAction: "feed.read",
    requiredRoles: ["colaborador", "lider-setor", "gerente-loja", "admin-organizacao"],
    segment: "(collaborator)",
  },
  leader: {
    allowedFallbackHref: "/(collaborator)",
    entryHref: "/(leader)",
    kind: "protected",
    requiredAction: "dashboard.read",
    requiredRoles: leaderRoles,
    segment: "(leader)",
  },
} as const satisfies Record<string, MobileRouteGroup>;

export type MobileRouteGroupKey = keyof typeof mobileRouteGroups;

export interface RouteAccessDecision {
  readonly allowed: boolean;
  readonly redirectTo: string;
}

export function canAccessRouteGroup(
  session: MobileRouteSession | null,
  group: MobileRouteGroupKey,
): RouteAccessDecision {
  const routeGroup = mobileRouteGroups[group];

  if (routeGroup.kind === "public") {
    return {
      allowed: true,
      redirectTo: routeGroup.entryHref,
    };
  }

  if (session === null) {
    return {
      allowed: false,
      redirectTo: "/(auth)/sign-in",
    };
  }

  const requiredRoles: readonly FlvRole[] = routeGroup.requiredRoles;

  const hasRequiredRole = requiredRoles.includes(session.role);
  const hasRequiredPermission =
    routeGroup.requiredAction === undefined ||
    canPerformMobileRouteAction(session.role, routeGroup.requiredAction);

  if (hasRequiredRole && hasRequiredPermission) {
    return {
      allowed: true,
      redirectTo: routeGroup.entryHref,
    };
  }

  return {
    allowed: false,
    redirectTo: routeGroup.allowedFallbackHref,
  };
}

export type MobileRouteSession = Pick<MobileSession, "role"> &
  Partial<Pick<MobileSession, "scope" | "userId">>;

export function getHomeHrefForSession(session: MobileRouteSession | null): string {
  if (session === null) {
    return mobileRouteGroups.auth.entryHref;
  }

  return isLeaderRole(session.role)
    ? mobileRouteGroups.leader.entryHref
    : mobileRouteGroups.collaborator.entryHref;
}

function isLeaderRole(role: FlvRole): boolean {
  const roles: readonly FlvRole[] = leaderRoles;

  return roles.includes(role);
}

function canPerformMobileRouteAction(role: FlvRole, action: MobileRouteAction): boolean {
  if (action === "dashboard.read") {
    return isLeaderRole(role);
  }

  return role !== "auditor";
}
