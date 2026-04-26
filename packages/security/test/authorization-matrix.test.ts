import { describe, expect, it } from "vitest";

import {
  canRolePerform,
  developmentActors,
  evaluatePermission,
  flvRoles,
  getPermissionRulesForRole,
  permissionActions,
  permissionMatrix,
  permissionScopeLevels,
  roleDocumentation,
  type FlvRole,
  type PermissionAction,
  type PermissionScopeLevel,
  type ScopedResource,
  type SecurityActor,
} from "../src/index.js";

describe("RBAC and ABAC authorization matrix", () => {
  it("exposes documented named roles", () => {
    expect(flvRoles).toEqual([
      "colaborador",
      "lider-setor",
      "gerente-loja",
      "admin-organizacao",
      "auditor",
    ]);

    for (const role of flvRoles) {
      expect(roleDocumentation[role].length).toBeGreaterThan(20);
      expect(getPermissionRulesForRole(role).length).toBeGreaterThan(0);
    }
  });

  it("denies collaborator direct schedule edits", () => {
    expect(
      evaluatePermission(developmentActors.colaborador, {
        action: "schedule.change",
        resource: sameDepartmentResource(developmentActors.colaborador),
      }),
    ).toMatchObject({
      allowed: false,
      reason: "missing_permission",
      safeStatusCode: 403,
    });
  });

  it("denies sector leaders outside their department without revealing existence", () => {
    expect(
      evaluatePermission(developmentActors["lider-setor"], {
        action: "operations.summary.read",
        resource: {
          departmentId: "dept_padaria",
          organizationId: "org_demo",
          storeId: "store_001",
        },
      }),
    ).toMatchObject({
      allowed: false,
      reason: "outside_scope",
      safeStatusCode: 404,
    });
  });

  it("allows store managers to assign sector leaders inside their store", () => {
    expect(
      evaluatePermission(developmentActors["gerente-loja"], {
        action: "roles.manage",
        resource: {
          organizationId: "org_demo",
          storeId: "store_001",
        },
      }).allowed,
    ).toBe(true);
  });

  it("allows sector leaders to read schedules inside their department", () => {
    expect(
      evaluatePermission(developmentActors["lider-setor"], {
        action: "schedule.read",
        resource: sameDepartmentResource(developmentActors["lider-setor"]),
      }).allowed,
    ).toBe(true);
  });

  it("allows organization admins to manage stores inside their organization", () => {
    expect(
      evaluatePermission(developmentActors["admin-organizacao"], {
        action: "store.manage",
        resource: {
          organizationId: "org_demo",
        },
      }).allowed,
    ).toBe(true);
  });

  it("keeps auditor access read-only", () => {
    expect(
      evaluatePermission(developmentActors.auditor, {
        action: "audit.read",
        resource: {
          organizationId: "org_demo",
          storeId: "store_001",
        },
      }).allowed,
    ).toBe(true);

    expect(
      evaluatePermission(developmentActors.auditor, {
        action: "media.upload",
        resource: {
          organizationId: "org_demo",
          storeId: "store_001",
        },
      }).allowed,
    ).toBe(false);
  });

  it("has deterministic decisions for every role, action and scope level", () => {
    for (const role of flvRoles) {
      const actor = fullScopeActor(role);

      for (const action of permissionActions) {
        for (const scopeLevel of permissionScopeLevels) {
          const decision = evaluatePermission(actor, {
            action,
            resource: resourceForScope(scopeLevel, actor),
          });

          expect(decision.allowed).toBe(expectedPermission(role, action, scopeLevel));
        }
      }
    }
  });
});

function fullScopeActor(role: FlvRole): SecurityActor {
  return {
    role,
    scope: {
      departmentId: "dept_flv",
      organizationId: "org_demo",
      storeId: "store_001",
    },
    userId: `user_${role}`,
  };
}

function resourceForScope(scopeLevel: PermissionScopeLevel, actor: SecurityActor): ScopedResource {
  if (scopeLevel === "own") {
    return {
      ...actor.scope,
      targetUserId: actor.userId,
    };
  }

  if (scopeLevel === "department") {
    return actor.scope;
  }

  if (scopeLevel === "store") {
    return {
      organizationId: actor.scope.organizationId,
      ...(actor.scope.storeId === undefined ? {} : { storeId: actor.scope.storeId }),
    };
  }

  return {
    organizationId: actor.scope.organizationId,
  };
}

function expectedPermission(
  role: FlvRole,
  action: PermissionAction,
  scopeLevel: PermissionScopeLevel,
): boolean {
  return (
    canRolePerform(role, action) &&
    permissionMatrix[role].some(
      (permission) =>
        permission.action === action &&
        permission.scopes.some((allowedScope) => scopeCoversResource(allowedScope, scopeLevel)),
    )
  );
}

function sameDepartmentResource(actor: SecurityActor): ScopedResource {
  return {
    organizationId: actor.scope.organizationId,
    ...(actor.scope.departmentId === undefined ? {} : { departmentId: actor.scope.departmentId }),
    ...(actor.scope.storeId === undefined ? {} : { storeId: actor.scope.storeId }),
  };
}

function scopeCoversResource(
  allowedScope: PermissionScopeLevel,
  resourceScope: PermissionScopeLevel,
): boolean {
  if (resourceScope === "own") {
    return true;
  }

  if (allowedScope === "organization") {
    return true;
  }

  if (allowedScope === "store") {
    return resourceScope === "store" || resourceScope === "department";
  }

  if (allowedScope === "department") {
    return resourceScope === "department";
  }

  return false;
}
