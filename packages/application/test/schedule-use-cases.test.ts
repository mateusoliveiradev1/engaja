import { describe, expect, it } from "vitest";

import {
  approveShiftSwap,
  createActorContext,
  createApplicationTenantScope,
  createApplicationUserId,
  getLeaderSchedulePlanner,
  proposeShiftSwap,
  respondToShiftSwap,
  reviewScheduleRequest,
  submitAvailabilityRequest,
  type ScheduleRepositoryPort,
  type ScheduleTeamMember,
} from "../src/index.js";

import {
  createCoverageRequirement,
  createScheduleRequest,
  createShift,
  type CoverageRequirement,
  type DomainId,
  type ScheduleNotification,
  type ScheduleRequest,
  type Shift,
  type TenantScope,
} from "@engaja/domain";

const scope = createApplicationTenantScope({
  departmentId: "dept_flv",
  organizationId: "org_demo",
  storeId: "store_001",
});

const collaboratorActor = createActorContext({
  role: "colaborador",
  scope,
  userId: "user_demo_colaborador",
});

const counterpartActor = createActorContext({
  role: "colaborador",
  scope,
  userId: "user_demo_colaborador_2",
});

const leaderActor = createActorContext({
  role: "lider-setor",
  scope,
  userId: "user_demo_lider",
});

describe("schedule application flows", () => {
  it("surfaces coverage gaps and approved time-off conflicts in the leader planner", async () => {
    const scheduleRepository = createScheduleRepositoryHarness({
      coverageRequirements: [
        createCoverageRequirement({
          endsAt: new Date("2026-04-24T18:00:00.000Z"),
          id: "coverage_friday",
          label: "Cobertura da sexta",
          role: "colaborador",
          requiredHeadcount: 2,
          routineResponsibility: "abertura",
          scope,
          startsAt: new Date("2026-04-24T09:00:00.000Z"),
        }),
      ],
      requests: [
        createScheduleRequest({
          createdAt: new Date("2026-04-23T12:00:00.000Z"),
          endsAt: new Date("2026-04-24T18:00:00.000Z"),
          id: "request_time_off_conflict",
          kind: "time_off",
          note: "Consulta medica",
          requesterUserId: "user_demo_colaborador",
          reviewedAt: new Date("2026-04-23T18:00:00.000Z"),
          reviewedByUserId: "user_demo_lider",
          scope,
          startsAt: new Date("2026-04-24T09:00:00.000Z"),
          status: "approved",
        }),
      ],
      shifts: [
        createShift({
          breakMinutes: 60,
          endsAt: new Date("2026-04-24T18:00:00.000Z"),
          id: "shift_friday_julia",
          role: "colaborador",
          scope,
          startsAt: new Date("2026-04-24T09:00:00.000Z"),
          status: "published",
          title: "Frente fria",
          userId: "user_demo_colaborador",
        }),
      ],
    });

    const planner = await getLeaderSchedulePlanner({
      actor: leaderActor,
      now: new Date("2026-04-23T12:00:00.000Z"),
      scheduleRepository,
      scope,
      weekStart: new Date("2026-04-20T00:00:00.000Z"),
    });

    expect(planner.coverageAlerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          assignedHeadcount: 1,
          id: "coverage_friday",
          requiredHeadcount: 2,
          severity: "warning",
        }),
      ]),
    );
    expect(planner.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          coverageId: "coverage_friday",
          kind: "coverage_gap",
        }),
        expect.objectContaining({
          kind: "time_off_conflict",
          requestId: "request_time_off_conflict",
          shiftId: "shift_friday_julia",
        }),
      ]),
    );
  });

  it("notifies leadership on availability submission and notifies the collaborator after review", async () => {
    const scheduleRepository = createScheduleRepositoryHarness();

    const createdRequest = await submitAvailabilityRequest({
      actor: collaboratorActor,
      endsAt: new Date("2026-04-28T15:00:00.000Z"),
      note: "Posso cobrir a abertura da terca.",
      preferredPeriods: ["opening"],
      scheduleRepository,
      scope,
      startsAt: new Date("2026-04-28T06:00:00.000Z"),
    });

    expect(createdRequest.status).toBe("pending");

    const leaderNotifications = await scheduleRepository.listNotificationsForUser(
      leaderActor.userId,
      scope,
    );

    expect(leaderNotifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          requestId: createdRequest.id,
          type: "availability_submitted",
          userId: leaderActor.userId,
        }),
      ]),
    );

    const reviewedRequest = await reviewScheduleRequest({
      actor: leaderActor,
      decision: "approve",
      requestId: createdRequest.id,
      scheduleRepository,
    });

    expect(reviewedRequest.status).toBe("approved");

    const collaboratorNotifications = await scheduleRepository.listNotificationsForUser(
      collaboratorActor.userId,
      scope,
    );

    expect(collaboratorNotifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          requestId: createdRequest.id,
          type: "availability_reviewed",
          userId: collaboratorActor.userId,
        }),
      ]),
    );
  });

  it("runs the full swap flow and updates assignees after leader approval", async () => {
    const sourceShiftId = "shift_saturday_julia" as DomainId<"shift">;
    const targetShiftId = "shift_saturday_mateus" as DomainId<"shift">;
    const counterpartUserId = createApplicationUserId("user_demo_colaborador_2");
    const scheduleRepository = createScheduleRepositoryHarness({
      shifts: [
        createShift({
          breakMinutes: 60,
          endsAt: new Date("2026-04-26T20:00:00.000Z"),
          id: sourceShiftId,
          role: "colaborador",
          scope,
          startsAt: new Date("2026-04-26T11:00:00.000Z"),
          status: "published",
          title: "Pico da tarde",
          userId: collaboratorActor.userId,
        }),
        createShift({
          breakMinutes: 45,
          endsAt: new Date("2026-04-26T15:00:00.000Z"),
          id: targetShiftId,
          role: "colaborador",
          scope,
          startsAt: new Date("2026-04-26T06:00:00.000Z"),
          status: "published",
          title: "Abertura",
          userId: counterpartUserId,
        }),
      ],
    });

    const proposedRequest = await proposeShiftSwap({
      actor: collaboratorActor,
      note: "Topo trocar meu pico da tarde pela abertura.",
      scheduleRepository,
      scope,
      sourceShiftId,
      targetShiftId,
      targetUserId: counterpartUserId,
    });

    expect(proposedRequest.status).toBe("pending");

    const acceptedRequest = await respondToShiftSwap({
      actor: counterpartActor,
      requestId: proposedRequest.id,
      response: "accept",
      scheduleRepository,
    });

    expect(acceptedRequest.status).toBe("accepted");

    const approvedRequest = await approveShiftSwap({
      actor: leaderActor,
      requestId: proposedRequest.id,
      scheduleRepository,
    });

    expect(approvedRequest.status).toBe("approved");
    await expect(scheduleRepository.findShiftById(sourceShiftId)).resolves.toMatchObject({
      userId: counterpartUserId,
    });
    await expect(scheduleRepository.findShiftById(targetShiftId)).resolves.toMatchObject({
      userId: collaboratorActor.userId,
    });

    const collaboratorNotifications = await scheduleRepository.listNotificationsForUser(
      collaboratorActor.userId,
      scope,
    );

    expect(collaboratorNotifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          requestId: proposedRequest.id,
          type: "swap_approved",
          userId: collaboratorActor.userId,
        }),
      ]),
    );
  });
});

interface ScheduleRepositoryHarnessInput {
  readonly coverageRequirements?: readonly CoverageRequirement[];
  readonly notifications?: readonly ScheduleNotification[];
  readonly requests?: readonly ScheduleRequest[];
  readonly shifts?: readonly Shift[];
  readonly teamMembers?: readonly ScheduleTeamMember[];
}

function createScheduleRepositoryHarness(
  input?: ScheduleRepositoryHarnessInput,
): ScheduleRepositoryPort {
  const coverageRequirements = [...(input?.coverageRequirements ?? [])];
  const notifications = [...(input?.notifications ?? [])];
  const requests = [...(input?.requests ?? [])];
  const shifts = [...(input?.shifts ?? [])];
  const teamMembers = [
    ...(input?.teamMembers ?? [
      createScheduleTeamMember("Julia Lima", "colaborador", "user_demo_colaborador"),
      createScheduleTeamMember("Mateus Rocha", "colaborador", "user_demo_colaborador_2"),
      createScheduleTeamMember("Renata Prado", "lider-setor", "user_demo_lider"),
      createScheduleTeamMember("Felipe Costa", "gerente-loja", "user_demo_gerente"),
    ]),
  ];

  return {
    countPendingRequestsForUser(userId, currentScope) {
      return Promise.resolve(
        requests.filter(
          (request) =>
            matchesScope(request.scope, currentScope) &&
            (request.requesterUserId === userId || request.counterpartUserId === userId) &&
            (request.status === "pending" || request.status === "accepted"),
        ).length,
      );
    },
    findRequestById(id) {
      return Promise.resolve(requests.find((request) => request.id === id));
    },
    findShiftById(id) {
      return Promise.resolve(shifts.find((shift) => shift.id === id));
    },
    listCoverageRequirements(currentScope) {
      return Promise.resolve(
        coverageRequirements.filter((coverageRequirement) =>
          matchesScope(coverageRequirement.scope, currentScope),
        ),
      );
    },
    listNotifications(currentScope) {
      return Promise.resolve(
        notifications.filter((notification) => matchesScope(notification.scope, currentScope)),
      );
    },
    listNotificationsForUser(userId, currentScope) {
      return Promise.resolve(
        notifications.filter(
          (notification) =>
            notification.userId === userId && matchesScope(notification.scope, currentScope),
        ),
      );
    },
    listRequests(currentScope) {
      return Promise.resolve(
        requests.filter((request) => matchesScope(request.scope, currentScope)),
      );
    },
    listRequestsForUser(userId, currentScope) {
      return Promise.resolve(
        requests.filter(
          (request) =>
            matchesScope(request.scope, currentScope) &&
            (request.requesterUserId === userId || request.counterpartUserId === userId),
        ),
      );
    },
    listShifts(currentScope) {
      return Promise.resolve(shifts.filter((shift) => matchesScope(shift.scope, currentScope)));
    },
    listShiftsForUser(userId, currentScope) {
      return Promise.resolve(
        shifts.filter((shift) => shift.userId === userId && matchesScope(shift.scope, currentScope)),
      );
    },
    listTeamMembers() {
      return Promise.resolve(teamMembers);
    },
    saveNotification(notification) {
      upsertEntity(notifications, notification);

      return Promise.resolve(notification);
    },
    saveRequest(request) {
      upsertEntity(requests, request);

      return Promise.resolve(request);
    },
    saveShift(shift) {
      upsertEntity(shifts, shift);

      return Promise.resolve(shift);
    },
  };
}

function createScheduleTeamMember(
  displayName: string,
  role: ScheduleTeamMember["role"],
  userId: string,
): ScheduleTeamMember {
  return {
    displayName,
    role,
    userId: createApplicationUserId(userId),
  };
}

function matchesScope(left: TenantScope, right: TenantScope): boolean {
  return (
    left.organizationId === right.organizationId &&
    left.storeId === right.storeId &&
    left.departmentId === right.departmentId
  );
}

function upsertEntity<T extends { readonly id: string }>(items: T[], nextItem: T): void {
  const currentIndex = items.findIndex((item) => item.id === nextItem.id);

  if (currentIndex >= 0) {
    items[currentIndex] = nextItem;
  } else {
    items.push(nextItem);
  }
}
