import { assertNonEmptyString } from "./base.js";
import { createDomainId, type DomainId } from "./ids.js";

export const flvScopeLevels = ["organization", "store", "department"] as const;

export type FlvScopeLevel = (typeof flvScopeLevels)[number];

export const visibilityScopes = ["private", "department", "store", "organization"] as const;

export type VisibilityScope = (typeof visibilityScopes)[number];

export interface TenantScope {
  readonly organizationId: DomainId<"organization">;
  readonly storeId?: DomainId<"store">;
  readonly departmentId?: DomainId<"department">;
}

export interface ScopedResource extends TenantScope {
  readonly ownerUserId?: DomainId<"user">;
  readonly targetUserId?: DomainId<"user">;
  readonly visibility?: VisibilityScope;
}

export function createTenantScope(input: {
  readonly organizationId: string;
  readonly storeId?: string;
  readonly departmentId?: string;
}): TenantScope {
  return {
    organizationId: createDomainId<"organization">(assertNonEmptyString(input.organizationId, "organizationId")),
    ...(input.storeId === undefined
      ? {}
      : { storeId: createDomainId<"store">(assertNonEmptyString(input.storeId, "storeId")) }),
    ...(input.departmentId === undefined
      ? {}
      : {
          departmentId: createDomainId<"department">(
            assertNonEmptyString(input.departmentId, "departmentId"),
          ),
        }),
  };
}

export function sameOrganization(left: TenantScope, right: TenantScope): boolean {
  return left.organizationId === right.organizationId;
}

export function isTenantScopeWithin(
  parentScope: TenantScope,
  childScope: TenantScope,
  level: Exclude<VisibilityScope, "private">,
): boolean {
  if (!sameOrganization(parentScope, childScope)) {
    return false;
  }

  if (level === "organization") {
    return true;
  }

  if (level === "store") {
    return parentScope.storeId !== undefined && parentScope.storeId === childScope.storeId;
  }

  return (
    parentScope.storeId !== undefined &&
    parentScope.departmentId !== undefined &&
    parentScope.storeId === childScope.storeId &&
    parentScope.departmentId === childScope.departmentId
  );
}
