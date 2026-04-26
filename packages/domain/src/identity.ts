import { assertNonEmptyString } from "./base.js";
import { type DomainId, type Entity, createDomainId } from "./ids.js";
import { type TenantScope } from "./scope.js";

export const flvRoles = [
  "colaborador",
  "lider-setor",
  "gerente-loja",
  "admin-organizacao",
  "auditor",
] as const;

export type FlvRole = (typeof flvRoles)[number];

export interface UserIdentity extends Entity<DomainId<"user">> {
  readonly displayName: string;
  readonly role: FlvRole;
  readonly scope: TenantScope;
}

export interface DomainActor {
  readonly additionalScopes?: readonly TenantScope[];
  readonly role: FlvRole;
  readonly scope: TenantScope;
  readonly userId: DomainId<"user">;
}

export function createUserIdentity(input: {
  readonly displayName: string;
  readonly id: string;
  readonly role: FlvRole;
  readonly scope: TenantScope;
}): UserIdentity {
  return {
    displayName: assertNonEmptyString(input.displayName, "displayName"),
    id: createDomainId<"user">(assertNonEmptyString(input.id, "id")),
    role: input.role,
    scope: input.scope,
  };
}
