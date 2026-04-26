import {
  createDomainId,
  createTenantScope,
  type DomainId,
  type TenantScope,
} from "@engaja/domain";
import type { FlvRole } from "@engaja/security";

export interface ActorContext {
  readonly additionalScopes?: readonly TenantScope[];
  readonly role: FlvRole;
  readonly scope: TenantScope;
  readonly userId: DomainId<"user">;
}

export function createActorContext(input: {
  readonly additionalScopes?: readonly {
    readonly departmentId?: string;
    readonly organizationId: string;
    readonly storeId?: string;
  }[];
  readonly role: FlvRole;
  readonly scope: {
    readonly departmentId?: string;
    readonly organizationId: string;
    readonly storeId?: string;
  };
  readonly userId: string;
}): ActorContext {
  return {
    ...(input.additionalScopes === undefined
      ? {}
      : {
          additionalScopes: input.additionalScopes.map((scope) =>
            createTenantScope(scope),
          ),
        }),
    role: input.role,
    scope: createTenantScope(input.scope),
    userId: createDomainId<"user">(input.userId),
  };
}

export function createApplicationTenantScope(input: {
  readonly departmentId?: string;
  readonly organizationId: string;
  readonly storeId?: string;
}): TenantScope {
  return createTenantScope(input);
}

export function createApplicationUserId(userId: string): DomainId<"user"> {
  return createDomainId<"user">(userId);
}
