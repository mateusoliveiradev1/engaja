import { and, eq } from "drizzle-orm";

import { flvRoleSchema, type FlvRole } from "@engaja/contracts";

import type { EngajaDatabase } from "../db/client.js";
import {
  accessInvites,
  authCredentials,
  authSessions,
  memberships,
  roles,
  users,
} from "../db/schema.js";

export type AuthCredentialStatus = "active" | "disabled" | "rotated";
export type AuthSessionStatus = "active" | "revoked" | "expired";
export type AccessInviteStatus = "pending" | "accepted" | "revoked" | "expired";
export type AuthSessionProvider = "password" | "better-auth" | "neon-auth" | "oauth" | "sso";

export interface AuthUserRecord {
  readonly active: boolean;
  readonly createdAt: Date;
  readonly displayName: string;
  readonly email: string;
  readonly id: string;
  readonly phoneNumber?: string;
  readonly preferredName?: string;
  readonly updatedAt: Date;
}

export interface AuthCredentialRecord {
  readonly createdAt: Date;
  readonly email: string;
  readonly failedAttemptCount: number;
  readonly id: string;
  readonly lastVerifiedAt?: Date;
  readonly lockedUntil?: Date;
  readonly passwordHash: string;
  readonly passwordHashVersion: string;
  readonly status: AuthCredentialStatus;
  readonly updatedAt: Date;
  readonly user: AuthUserRecord;
  readonly userId: string;
}

export interface AuthMembershipRecord {
  readonly createdAt: Date;
  readonly departmentId?: string;
  readonly id: string;
  readonly organizationId: string;
  readonly roleCode: FlvRole;
  readonly roleId: string;
  readonly status: "active" | "inactive" | "invited" | "suspended";
  readonly storeId?: string;
  readonly updatedAt: Date;
  readonly userId: string;
}

export interface AuthRoleRecord {
  readonly code: FlvRole;
  readonly id: string;
  readonly organizationId: string;
}

export interface AuthSessionRecord {
  readonly createdAt: Date;
  readonly deviceLabel?: string;
  readonly expiresAt: Date;
  readonly id: string;
  readonly ipAddress?: string;
  readonly issuedAt: Date;
  readonly lastSeenAt?: Date;
  readonly provider: AuthSessionProvider;
  readonly providerSubject: string;
  readonly revokedAt?: Date;
  readonly sessionTokenHash: string;
  readonly status: AuthSessionStatus;
  readonly updatedAt: Date;
  readonly userAgent?: string;
  readonly userId: string;
}

export interface AccessInviteRecord {
  readonly acceptedAt?: Date;
  readonly acceptedByUserId?: string;
  readonly createdAt: Date;
  readonly deliveryChannel: "manual" | "email";
  readonly departmentId?: string;
  readonly email: string;
  readonly expiresAt: Date;
  readonly id: string;
  readonly intendedMembership: Readonly<Record<string, unknown>>;
  readonly invitedByUserId?: string;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly organizationId: string;
  readonly resendCount: number;
  readonly resentAt?: Date;
  readonly revokedAt?: Date;
  readonly revokedByUserId?: string;
  readonly roleCode: FlvRole;
  readonly roleId: string;
  readonly status: AccessInviteStatus;
  readonly storeId?: string;
  readonly tokenHash: string;
  readonly updatedAt: Date;
}

export interface AuthUserSessionContext {
  readonly membership: AuthMembershipRecord;
  readonly user: AuthUserRecord;
}

export interface NewAuthSessionRecord {
  readonly deviceLabel?: string;
  readonly expiresAt: Date;
  readonly id?: string;
  readonly ipAddress?: string;
  readonly issuedAt: Date;
  readonly provider: AuthSessionProvider;
  readonly providerSubject: string;
  readonly sessionTokenHash: string;
  readonly userAgent?: string;
  readonly userId: string;
}

export interface NewAccessInviteRecord {
  readonly deliveryChannel: "manual" | "email";
  readonly departmentId?: string;
  readonly email: string;
  readonly expiresAt: Date;
  readonly id?: string;
  readonly intendedMembership?: Readonly<Record<string, unknown>>;
  readonly invitedByUserId?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly organizationId: string;
  readonly roleCode: FlvRole;
  readonly roleId: string;
  readonly storeId?: string;
  readonly tokenHash: string;
}

export interface AcceptInviteInput {
  readonly credentialId?: string;
  readonly displayName: string;
  readonly email: string;
  readonly inviteId: string;
  readonly now: Date;
  readonly passwordHash: string;
  readonly passwordHashVersion: string;
  readonly phoneNumber?: string;
  readonly preferredName?: string;
}

export interface AcceptedInviteResult {
  readonly credential: AuthCredentialRecord;
  readonly invite: AccessInviteRecord;
  readonly membership: AuthMembershipRecord;
  readonly user: AuthUserRecord;
}

export interface AuthRepository {
  acceptInvite(input: AcceptInviteInput): Promise<AcceptedInviteResult | undefined>;
  createInvite(input: NewAccessInviteRecord): Promise<AccessInviteRecord>;
  createSession(input: NewAuthSessionRecord): Promise<AuthSessionRecord>;
  findCredentialByEmail(email: string): Promise<AuthCredentialRecord | undefined>;
  findInviteById(id: string): Promise<AccessInviteRecord | undefined>;
  findInviteByTokenHash(tokenHash: string): Promise<AccessInviteRecord | undefined>;
  findRoleByCode(
    organizationId: string,
    roleCode: FlvRole,
  ): Promise<AuthRoleRecord | undefined>;
  findSessionByTokenHash(tokenHash: string): Promise<AuthSessionRecord | undefined>;
  findUserSessionContextByUserId(userId: string): Promise<AuthUserSessionContext | undefined>;
  listInvites(scope: {
    readonly departmentId?: string;
    readonly organizationId: string;
    readonly storeId?: string;
  }): Promise<readonly AccessInviteRecord[]>;
  recordCredentialFailure(input: {
    readonly credentialId: string;
    readonly failedAttemptCount: number;
    readonly lockedUntil?: Date;
    readonly updatedAt: Date;
  }): Promise<AuthCredentialRecord | undefined>;
  recordCredentialSuccess(input: {
    readonly credentialId: string;
    readonly lastVerifiedAt: Date;
  }): Promise<AuthCredentialRecord | undefined>;
  resendInvite(input: {
    readonly expiresAt: Date;
    readonly inviteId: string;
    readonly resentAt: Date;
    readonly tokenHash: string;
  }): Promise<AccessInviteRecord | undefined>;
  revokeInvite(input: {
    readonly inviteId: string;
    readonly revokedAt: Date;
    readonly revokedByUserId: string;
  }): Promise<AccessInviteRecord | undefined>;
  revokeSessionByTokenHash(input: {
    readonly revokedAt: Date;
    readonly sessionTokenHash: string;
  }): Promise<AuthSessionRecord | undefined>;
  touchSession(input: {
    readonly lastSeenAt: Date;
    readonly sessionId: string;
  }): Promise<AuthSessionRecord | undefined>;
}

export function createDrizzleAuthRepository(db: EngajaDatabase): AuthRepository {
  return {
    async acceptInvite(input) {
      const invite = await this.findInviteById(input.inviteId);

      if (invite === undefined) {
        return undefined;
      }

      const existingUser = await findUserByEmail(db, input.email);
      const user =
        existingUser ??
        toAuthUserRecord(
          assertReturnedRecord(
            (
              await db
                .insert(users)
                .values({
                  active: true,
                  displayName: input.displayName,
                  email: normalizeEmail(input.email),
                  phoneNumber: normalizeNullable(input.phoneNumber),
                  preferredName: normalizeNullable(input.preferredName),
                })
                .returning()
            )[0],
            "user",
          ),
        );

      const existingCredential = await this.findCredentialByEmail(input.email);
      const credential =
        existingCredential === undefined
          ? toAuthCredentialRecord(
              assertReturnedRecord(
                (
                  await db
                    .insert(authCredentials)
                    .values({
                      ...(input.credentialId === undefined ? {} : { id: input.credentialId }),
                      email: normalizeEmail(input.email),
                      passwordHash: input.passwordHash,
                      passwordHashVersion: input.passwordHashVersion,
                      status: "active",
                      userId: user.id,
                    })
                    .returning()
                )[0],
                "auth credential",
              ),
              user,
            )
          : toAuthCredentialRecord(
              assertReturnedRecord(
                (
                  await db
                    .update(authCredentials)
                    .set({
                      email: normalizeEmail(input.email),
                      failedAttemptCount: 0,
                      lastVerifiedAt: input.now,
                      lockedUntil: null,
                      passwordHash: input.passwordHash,
                      passwordHashVersion: input.passwordHashVersion,
                      status: "active",
                      updatedAt: input.now,
                    })
                    .where(eq(authCredentials.id, existingCredential.id))
                    .returning()
                )[0],
                "auth credential",
              ),
              user,
            );

      await db
        .insert(memberships)
        .values({
          departmentId: normalizeNullable(invite.departmentId),
          organizationId: invite.organizationId,
          roleId: invite.roleId,
          status: "active",
          storeId: normalizeNullable(invite.storeId),
          userId: user.id,
        })
        .onConflictDoNothing();

      const membership = await this.findUserSessionContextByUserId(user.id);
      const acceptedInvite = await updateInviteStatus(db, invite.id, {
        acceptedAt: input.now,
        acceptedByUserId: user.id,
        status: "accepted",
        updatedAt: input.now,
      });

      if (membership === undefined || acceptedInvite === undefined) {
        return undefined;
      }

      return {
        credential,
        invite: acceptedInvite,
        membership: membership.membership,
        user,
      };
    },
    async createInvite(input) {
      const [record] = await db
        .insert(accessInvites)
        .values({
          deliveryChannel: input.deliveryChannel,
          departmentId: normalizeNullable(input.departmentId),
          email: normalizeEmail(input.email),
          expiresAt: input.expiresAt,
          ...(input.id === undefined ? {} : { id: input.id }),
          intendedMembership: { ...(input.intendedMembership ?? {}) },
          invitedByUserId: normalizeNullable(input.invitedByUserId),
          metadata: { ...(input.metadata ?? {}) },
          organizationId: input.organizationId,
          roleCode: input.roleCode,
          roleId: input.roleId,
          storeId: normalizeNullable(input.storeId),
          tokenHash: input.tokenHash,
        })
        .returning();

      return toAccessInviteRecord(assertReturnedRecord(record, "access invite"));
    },
    async createSession(input) {
      const [record] = await db
        .insert(authSessions)
        .values({
          deviceLabel: normalizeNullable(input.deviceLabel),
          expiresAt: input.expiresAt,
          ...(input.id === undefined ? {} : { id: input.id }),
          ipAddress: normalizeNullable(input.ipAddress),
          issuedAt: input.issuedAt,
          provider: input.provider,
          providerSubject: input.providerSubject,
          sessionTokenHash: input.sessionTokenHash,
          userAgent: normalizeNullable(input.userAgent),
          userId: input.userId,
        })
        .returning();

      return toAuthSessionRecord(assertReturnedRecord(record, "auth session"));
    },
    async findCredentialByEmail(email) {
      const [record] = await db
        .select()
        .from(authCredentials)
        .where(eq(authCredentials.email, normalizeEmail(email)))
        .limit(1);

      if (record === undefined) {
        return undefined;
      }

      const user = await findUserById(db, record.userId);

      return user === undefined ? undefined : toAuthCredentialRecord(record, user);
    },
    async findInviteById(id) {
      const [record] = await db
        .select()
        .from(accessInvites)
        .where(eq(accessInvites.id, id))
        .limit(1);

      return record === undefined ? undefined : toAccessInviteRecord(record);
    },
    async findInviteByTokenHash(tokenHash) {
      const [record] = await db
        .select()
        .from(accessInvites)
        .where(eq(accessInvites.tokenHash, tokenHash))
        .limit(1);

      return record === undefined ? undefined : toAccessInviteRecord(record);
    },
    async findRoleByCode(organizationId, roleCode) {
      const [record] = await db
        .select()
        .from(roles)
        .where(and(eq(roles.organizationId, organizationId), eq(roles.code, roleCode)))
        .limit(1);

      return record === undefined
        ? undefined
        : {
            code: flvRoleSchema.parse(record.code),
            id: record.id,
            organizationId,
          };
    },
    async findSessionByTokenHash(tokenHash) {
      const [record] = await db
        .select()
        .from(authSessions)
        .where(eq(authSessions.sessionTokenHash, tokenHash))
        .limit(1);

      return record === undefined ? undefined : toAuthSessionRecord(record);
    },
    async findUserSessionContextByUserId(userId) {
      const user = await findUserById(db, userId);

      if (user === undefined) {
        return undefined;
      }

      const [record] = await db
        .select({
          createdAt: memberships.createdAt,
          departmentId: memberships.departmentId,
          id: memberships.id,
          organizationId: memberships.organizationId,
          roleCode: roles.code,
          roleId: memberships.roleId,
          status: memberships.status,
          storeId: memberships.storeId,
          updatedAt: memberships.updatedAt,
          userId: memberships.userId,
        })
        .from(memberships)
        .innerJoin(roles, eq(memberships.roleId, roles.id))
        .where(and(eq(memberships.userId, userId), eq(memberships.status, "active")))
        .limit(1);

      return record === undefined
        ? undefined
        : {
            membership: toAuthMembershipRecord(record),
            user,
          };
    },
    async listInvites(scope) {
      const conditions = [eq(accessInvites.organizationId, scope.organizationId)];

      if (scope.storeId !== undefined) {
        conditions.push(eq(accessInvites.storeId, scope.storeId));
      }

      if (scope.departmentId !== undefined) {
        conditions.push(eq(accessInvites.departmentId, scope.departmentId));
      }

      const records = await db
        .select()
        .from(accessInvites)
        .where(and(...conditions));

      return records.map(toAccessInviteRecord);
    },
    async recordCredentialFailure(input) {
      const [record] = await db
        .update(authCredentials)
        .set({
          failedAttemptCount: input.failedAttemptCount,
          lockedUntil: normalizeNullable(input.lockedUntil),
          updatedAt: input.updatedAt,
        })
        .where(eq(authCredentials.id, input.credentialId))
        .returning();

      if (record === undefined) {
        return undefined;
      }

      const user = await findUserById(db, record.userId);

      return user === undefined ? undefined : toAuthCredentialRecord(record, user);
    },
    async recordCredentialSuccess(input) {
      const [record] = await db
        .update(authCredentials)
        .set({
          failedAttemptCount: 0,
          lastVerifiedAt: input.lastVerifiedAt,
          lockedUntil: null,
          updatedAt: input.lastVerifiedAt,
        })
        .where(eq(authCredentials.id, input.credentialId))
        .returning();

      if (record === undefined) {
        return undefined;
      }

      const user = await findUserById(db, record.userId);

      return user === undefined ? undefined : toAuthCredentialRecord(record, user);
    },
    async resendInvite(input) {
      const current = await this.findInviteById(input.inviteId);

      if (current === undefined) {
        return undefined;
      }

      const [record] = await db
        .update(accessInvites)
        .set({
          expiresAt: input.expiresAt,
          resendCount: current.resendCount + 1,
          resentAt: input.resentAt,
          status: "pending",
          tokenHash: input.tokenHash,
          updatedAt: input.resentAt,
        })
        .where(eq(accessInvites.id, input.inviteId))
        .returning();

      return record === undefined ? undefined : toAccessInviteRecord(record);
    },
    async revokeInvite(input) {
      return updateInviteStatus(db, input.inviteId, {
        revokedAt: input.revokedAt,
        revokedByUserId: input.revokedByUserId,
        status: "revoked",
        updatedAt: input.revokedAt,
      });
    },
    async revokeSessionByTokenHash(input) {
      const [record] = await db
        .update(authSessions)
        .set({
          revokedAt: input.revokedAt,
          status: "revoked",
          updatedAt: input.revokedAt,
        })
        .where(eq(authSessions.sessionTokenHash, input.sessionTokenHash))
        .returning();

      return record === undefined ? undefined : toAuthSessionRecord(record);
    },
    async touchSession(input) {
      const [record] = await db
        .update(authSessions)
        .set({
          lastSeenAt: input.lastSeenAt,
          updatedAt: input.lastSeenAt,
        })
        .where(eq(authSessions.id, input.sessionId))
        .returning();

      return record === undefined ? undefined : toAuthSessionRecord(record);
    },
  };
}

export function createInMemoryAuthRepository(input: {
  readonly credentials?: readonly AuthCredentialRecord[];
  readonly invites?: readonly AccessInviteRecord[];
  readonly memberships?: readonly AuthMembershipRecord[];
  readonly sessions?: readonly AuthSessionRecord[];
  readonly users?: readonly AuthUserRecord[];
} = {}): AuthRepository {
  const credentials = new Map(
    (input.credentials ?? []).map((credential) => [credential.id, cloneCredential(credential)]),
  );
  const invites = new Map((input.invites ?? []).map((invite) => [invite.id, cloneInvite(invite)]));
  const membershipsById = new Map(
    (input.memberships ?? []).map((membership) => [membership.id, cloneMembership(membership)]),
  );
  const sessions = new Map(
    (input.sessions ?? []).map((session) => [session.id, cloneSession(session)]),
  );
  const usersById = new Map((input.users ?? []).map((user) => [user.id, cloneUser(user)]));

  return {
    acceptInvite(input) {
      const invite = invites.get(input.inviteId);

      if (invite === undefined) {
        return Promise.resolve(undefined);
      }

      const existingUser = [...usersById.values()].find(
        (candidate) => candidate.email === normalizeEmail(input.email),
      );
      const now = input.now;
      const user =
        existingUser ??
        ({
          active: true,
          createdAt: now,
          displayName: input.displayName,
          email: normalizeEmail(input.email),
          id: `user_${cryptoSafeId()}`,
          updatedAt: now,
          ...(input.phoneNumber === undefined ? {} : { phoneNumber: input.phoneNumber }),
          ...(input.preferredName === undefined ? {} : { preferredName: input.preferredName }),
        } satisfies AuthUserRecord);

      usersById.set(user.id, cloneUser(user));

      const credential: AuthCredentialRecord = {
        createdAt: now,
        email: normalizeEmail(input.email),
        failedAttemptCount: 0,
        id: input.credentialId ?? `credential_${cryptoSafeId()}`,
        lastVerifiedAt: now,
        passwordHash: input.passwordHash,
        passwordHashVersion: input.passwordHashVersion,
        status: "active",
        updatedAt: now,
        user,
        userId: user.id,
      };
      credentials.set(credential.id, cloneCredential(credential));

      const membership: AuthMembershipRecord = {
        createdAt: now,
        id: `membership_${cryptoSafeId()}`,
        organizationId: invite.organizationId,
        roleCode: invite.roleCode,
        roleId: invite.roleId,
        status: "active",
        updatedAt: now,
        userId: user.id,
        ...(invite.departmentId === undefined ? {} : { departmentId: invite.departmentId }),
        ...(invite.storeId === undefined ? {} : { storeId: invite.storeId }),
      };
      membershipsById.set(membership.id, cloneMembership(membership));

      const acceptedInvite: AccessInviteRecord = {
        ...invite,
        acceptedAt: now,
        acceptedByUserId: user.id,
        status: "accepted",
        updatedAt: now,
      };
      invites.set(invite.id, cloneInvite(acceptedInvite));

      return Promise.resolve({
        credential: cloneCredential(credential),
        invite: cloneInvite(acceptedInvite),
        membership: cloneMembership(membership),
        user: cloneUser(user),
      });
    },
    createInvite(input) {
      const now = new Date();
      const record: AccessInviteRecord = {
        createdAt: now,
        deliveryChannel: input.deliveryChannel,
        email: normalizeEmail(input.email),
        expiresAt: input.expiresAt,
        id: input.id ?? `invite_${cryptoSafeId()}`,
        intendedMembership: { ...(input.intendedMembership ?? {}) },
        metadata: { ...(input.metadata ?? {}) },
        organizationId: input.organizationId,
        resendCount: 0,
        roleCode: input.roleCode,
        roleId: input.roleId,
        status: "pending",
        tokenHash: input.tokenHash,
        updatedAt: now,
        ...(input.departmentId === undefined ? {} : { departmentId: input.departmentId }),
        ...(input.invitedByUserId === undefined
          ? {}
          : { invitedByUserId: input.invitedByUserId }),
        ...(input.storeId === undefined ? {} : { storeId: input.storeId }),
      };
      invites.set(record.id, cloneInvite(record));

      return Promise.resolve(cloneInvite(record));
    },
    createSession(input) {
      const now = input.issuedAt;
      const record: AuthSessionRecord = {
        createdAt: now,
        expiresAt: input.expiresAt,
        id: input.id ?? `session_${cryptoSafeId()}`,
        issuedAt: input.issuedAt,
        provider: input.provider,
        providerSubject: input.providerSubject,
        sessionTokenHash: input.sessionTokenHash,
        status: "active",
        updatedAt: now,
        userId: input.userId,
        ...(input.deviceLabel === undefined ? {} : { deviceLabel: input.deviceLabel }),
        ...(input.ipAddress === undefined ? {} : { ipAddress: input.ipAddress }),
        ...(input.userAgent === undefined ? {} : { userAgent: input.userAgent }),
      };
      sessions.set(record.id, cloneSession(record));

      return Promise.resolve(cloneSession(record));
    },
    findCredentialByEmail(email) {
      const credential = [...credentials.values()].find(
        (candidate) => candidate.email === normalizeEmail(email),
      );

      return Promise.resolve(credential === undefined ? undefined : cloneCredential(credential));
    },
    findInviteById(id) {
      const invite = invites.get(id);

      return Promise.resolve(invite === undefined ? undefined : cloneInvite(invite));
    },
    findInviteByTokenHash(tokenHash) {
      const invite = [...invites.values()].find((candidate) => candidate.tokenHash === tokenHash);

      return Promise.resolve(invite === undefined ? undefined : cloneInvite(invite));
    },
    findRoleByCode(organizationId, roleCode) {
      return Promise.resolve({
        code: roleCode,
        id: `role_${roleCode}`,
        organizationId,
      });
    },
    findSessionByTokenHash(tokenHash) {
      const session = [...sessions.values()].find(
        (candidate) => candidate.sessionTokenHash === tokenHash,
      );

      return Promise.resolve(session === undefined ? undefined : cloneSession(session));
    },
    findUserSessionContextByUserId(userId) {
      const user = usersById.get(userId);
      const membership = [...membershipsById.values()].find(
        (candidate) => candidate.userId === userId && candidate.status === "active",
      );

      return Promise.resolve(
        user === undefined || membership === undefined
          ? undefined
          : {
              membership: cloneMembership(membership),
              user: cloneUser(user),
            },
      );
    },
    listInvites(scope) {
      return Promise.resolve(
        [...invites.values()]
          .filter(
            (invite) =>
              invite.organizationId === scope.organizationId &&
              (scope.storeId === undefined || invite.storeId === scope.storeId) &&
              (scope.departmentId === undefined || invite.departmentId === scope.departmentId),
          )
          .map(cloneInvite),
      );
    },
    recordCredentialFailure(input) {
      const current = credentials.get(input.credentialId);

      if (current === undefined) {
        return Promise.resolve(undefined);
      }

      const next: AuthCredentialRecord = {
        ...current,
        failedAttemptCount: input.failedAttemptCount,
        updatedAt: input.updatedAt,
        ...(input.lockedUntil === undefined ? {} : { lockedUntil: input.lockedUntil }),
      };
      credentials.set(next.id, cloneCredential(next));

      return Promise.resolve(cloneCredential(next));
    },
    recordCredentialSuccess(input) {
      const current = credentials.get(input.credentialId);

      if (current === undefined) {
        return Promise.resolve(undefined);
      }

      const { lockedUntil: _lockedUntil, ...credentialWithoutLock } = current;
      const next: AuthCredentialRecord = {
        ...credentialWithoutLock,
        failedAttemptCount: 0,
        lastVerifiedAt: input.lastVerifiedAt,
        updatedAt: input.lastVerifiedAt,
      };
      credentials.set(next.id, cloneCredential(next));

      return Promise.resolve(cloneCredential(next));
    },
    resendInvite(input) {
      const current = invites.get(input.inviteId);

      if (current === undefined) {
        return Promise.resolve(undefined);
      }

      const next: AccessInviteRecord = {
        ...current,
        expiresAt: input.expiresAt,
        resendCount: current.resendCount + 1,
        resentAt: input.resentAt,
        status: "pending",
        tokenHash: input.tokenHash,
        updatedAt: input.resentAt,
      };
      invites.set(next.id, cloneInvite(next));

      return Promise.resolve(cloneInvite(next));
    },
    revokeInvite(input) {
      const current = invites.get(input.inviteId);

      if (current === undefined) {
        return Promise.resolve(undefined);
      }

      const next: AccessInviteRecord = {
        ...current,
        revokedAt: input.revokedAt,
        revokedByUserId: input.revokedByUserId,
        status: "revoked",
        updatedAt: input.revokedAt,
      };
      invites.set(next.id, cloneInvite(next));

      return Promise.resolve(cloneInvite(next));
    },
    revokeSessionByTokenHash(input) {
      const current = [...sessions.values()].find(
        (session) => session.sessionTokenHash === input.sessionTokenHash,
      );

      if (current === undefined) {
        return Promise.resolve(undefined);
      }

      const next: AuthSessionRecord = {
        ...current,
        revokedAt: input.revokedAt,
        status: "revoked",
        updatedAt: input.revokedAt,
      };
      sessions.set(next.id, cloneSession(next));

      return Promise.resolve(cloneSession(next));
    },
    touchSession(input) {
      const current = sessions.get(input.sessionId);

      if (current === undefined) {
        return Promise.resolve(undefined);
      }

      const next: AuthSessionRecord = {
        ...current,
        lastSeenAt: input.lastSeenAt,
        updatedAt: input.lastSeenAt,
      };
      sessions.set(next.id, cloneSession(next));

      return Promise.resolve(cloneSession(next));
    },
  };
}

async function findUserById(
  db: EngajaDatabase,
  userId: string,
): Promise<AuthUserRecord | undefined> {
  const [record] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  return record === undefined ? undefined : toAuthUserRecord(record);
}

async function findUserByEmail(
  db: EngajaDatabase,
  email: string,
): Promise<AuthUserRecord | undefined> {
  const [record] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizeEmail(email)))
    .limit(1);

  return record === undefined ? undefined : toAuthUserRecord(record);
}

async function updateInviteStatus(
  db: EngajaDatabase,
  inviteId: string,
  patch: Partial<typeof accessInvites.$inferInsert>,
): Promise<AccessInviteRecord | undefined> {
  const [record] = await db
    .update(accessInvites)
    .set(patch)
    .where(eq(accessInvites.id, inviteId))
    .returning();

  return record === undefined ? undefined : toAccessInviteRecord(record);
}

function toAuthUserRecord(record: typeof users.$inferSelect): AuthUserRecord {
  return {
    active: record.active,
    createdAt: record.createdAt,
    displayName: record.displayName,
    email: record.email,
    id: record.id,
    updatedAt: record.updatedAt,
    ...(record.phoneNumber === null ? {} : { phoneNumber: record.phoneNumber }),
    ...(record.preferredName === null ? {} : { preferredName: record.preferredName }),
  };
}

function toAuthCredentialRecord(
  record: typeof authCredentials.$inferSelect,
  user: AuthUserRecord,
): AuthCredentialRecord {
  return {
    createdAt: record.createdAt,
    email: record.email,
    failedAttemptCount: record.failedAttemptCount,
    id: record.id,
    passwordHash: record.passwordHash,
    passwordHashVersion: record.passwordHashVersion,
    status: record.status,
    updatedAt: record.updatedAt,
    user,
    userId: record.userId,
    ...(record.lastVerifiedAt === null ? {} : { lastVerifiedAt: record.lastVerifiedAt }),
    ...(record.lockedUntil === null ? {} : { lockedUntil: record.lockedUntil }),
  };
}

function toAuthMembershipRecord(record: {
  readonly createdAt: Date;
  readonly departmentId: string | null;
  readonly id: string;
  readonly organizationId: string;
  readonly roleCode: string;
  readonly roleId: string;
  readonly status: "active" | "inactive" | "invited" | "suspended";
  readonly storeId: string | null;
  readonly updatedAt: Date;
  readonly userId: string;
}): AuthMembershipRecord {
  return {
    createdAt: record.createdAt,
    id: record.id,
    organizationId: record.organizationId,
    roleCode: flvRoleSchema.parse(record.roleCode),
    roleId: record.roleId,
    status: record.status,
    updatedAt: record.updatedAt,
    userId: record.userId,
    ...(record.departmentId === null ? {} : { departmentId: record.departmentId }),
    ...(record.storeId === null ? {} : { storeId: record.storeId }),
  };
}

function toAuthSessionRecord(record: typeof authSessions.$inferSelect): AuthSessionRecord {
  return {
    createdAt: record.createdAt,
    expiresAt: record.expiresAt,
    id: record.id,
    issuedAt: record.issuedAt,
    provider: record.provider,
    providerSubject: record.providerSubject,
    sessionTokenHash: record.sessionTokenHash,
    status: record.status,
    updatedAt: record.updatedAt,
    userId: record.userId,
    ...(record.deviceLabel === null ? {} : { deviceLabel: record.deviceLabel }),
    ...(record.ipAddress === null ? {} : { ipAddress: record.ipAddress }),
    ...(record.lastSeenAt === null ? {} : { lastSeenAt: record.lastSeenAt }),
    ...(record.revokedAt === null ? {} : { revokedAt: record.revokedAt }),
    ...(record.userAgent === null ? {} : { userAgent: record.userAgent }),
  };
}

function toAccessInviteRecord(record: typeof accessInvites.$inferSelect): AccessInviteRecord {
  return {
    createdAt: record.createdAt,
    deliveryChannel: record.deliveryChannel as "manual" | "email",
    email: record.email,
    expiresAt: record.expiresAt,
    id: record.id,
    intendedMembership: { ...record.intendedMembership },
    metadata: { ...record.metadata },
    organizationId: record.organizationId,
    resendCount: record.resendCount,
    roleCode: flvRoleSchema.parse(record.roleCode),
    roleId: record.roleId,
    status: record.status,
    tokenHash: record.tokenHash,
    updatedAt: record.updatedAt,
    ...(record.acceptedAt === null ? {} : { acceptedAt: record.acceptedAt }),
    ...(record.acceptedByUserId === null ? {} : { acceptedByUserId: record.acceptedByUserId }),
    ...(record.departmentId === null ? {} : { departmentId: record.departmentId }),
    ...(record.invitedByUserId === null ? {} : { invitedByUserId: record.invitedByUserId }),
    ...(record.resentAt === null ? {} : { resentAt: record.resentAt }),
    ...(record.revokedAt === null ? {} : { revokedAt: record.revokedAt }),
    ...(record.revokedByUserId === null ? {} : { revokedByUserId: record.revokedByUserId }),
    ...(record.storeId === null ? {} : { storeId: record.storeId }),
  };
}

function cloneUser(record: AuthUserRecord): AuthUserRecord {
  return { ...record };
}

function cloneCredential(record: AuthCredentialRecord): AuthCredentialRecord {
  return {
    ...record,
    user: cloneUser(record.user),
  };
}

function cloneMembership(record: AuthMembershipRecord): AuthMembershipRecord {
  return { ...record };
}

function cloneSession(record: AuthSessionRecord): AuthSessionRecord {
  return { ...record };
}

function cloneInvite(record: AccessInviteRecord): AccessInviteRecord {
  return {
    ...record,
    intendedMembership: { ...record.intendedMembership },
    metadata: { ...record.metadata },
  };
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeNullable<TValue>(value: TValue | undefined): TValue | null | undefined {
  return value === undefined ? undefined : value;
}

function cryptoSafeId(): string {
  return Math.random().toString(36).slice(2, 12);
}

function assertReturnedRecord<TRecord>(
  record: TRecord | undefined,
  label: string,
): TRecord {
  if (record === undefined) {
    throw new Error(`The database did not return the inserted ${label}.`);
  }

  return record;
}
