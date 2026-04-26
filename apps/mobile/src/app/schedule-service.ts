import type {
  AvailabilityPeriodPayload,
  CollaboratorScheduleViewPayload,
  FlvRole,
  LeaderSchedulePlannerPayload,
  ScheduleCoverageAlertPayload,
  ScheduleDecisionPayload,
  ScheduleNotificationPayload,
  SchedulePlannerIssuePayload,
  SchedulePublishResultPayload,
  ScheduleRequestPayload,
  ScheduleShiftPayload,
  ScheduleTeamMemberPayload,
  SwapResponsePayload,
} from "@engaja/contracts";

import { createTypedApiClient } from "@engaja/data/mobile";

import { isMobileDemoFallbackEnabled } from "./demo-fallback.js";
import type { MobileSession } from "./providers.js";

const DEFAULT_API_BASE_URL = resolveApiBaseUrl();
const DEMO_NOW = "2026-04-23T12:00:00.000Z";

interface ScheduleCoverageRule {
  readonly endsAt: string;
  readonly id: string;
  readonly label: string;
  readonly requiredHeadcount: number;
  readonly requiredRole: FlvRole;
  readonly routineResponsibility?: string;
  readonly startsAt: string;
}

interface ScheduleDemoStore {
  coverageRequirements: ScheduleCoverageRule[];
  notifications: ScheduleNotificationPayload[];
  requestCounter: number;
  requests: ScheduleRequestPayload[];
  shifts: ScheduleShiftPayload[];
  teamMembers: ScheduleTeamMemberPayload[];
}

export interface SuggestedSwapCandidate {
  readonly sourceShiftId: string;
  readonly sourceShiftLabel: string;
  readonly targetShiftId: string;
  readonly targetShiftLabel: string;
  readonly targetUserId: string;
  readonly targetUserName: string;
}

export interface ScheduleService {
  approveSwap(input: { readonly requestId: string }): Promise<ScheduleRequestPayload>;
  getCollaboratorView(input?: {
    readonly userId?: string;
  }): Promise<CollaboratorScheduleViewPayload>;
  getLeaderPlanner(input?: { readonly weekStart?: string }): Promise<LeaderSchedulePlannerPayload>;
  getSuggestedSwapCandidate(userId?: string): SuggestedSwapCandidate | undefined;
  publishSchedule(input?: {
    readonly shiftIds?: readonly string[];
  }): Promise<SchedulePublishResultPayload>;
  proposeSwap(input: {
    readonly note?: string;
    readonly sourceShiftId: string;
    readonly targetShiftId: string;
    readonly targetUserId: string;
  }): Promise<ScheduleRequestPayload>;
  respondToSwap(input: {
    readonly requestId: string;
    readonly response: SwapResponsePayload;
  }): Promise<ScheduleRequestPayload>;
  reviewRequest(input: {
    readonly decision: ScheduleDecisionPayload;
    readonly requestId: string;
  }): Promise<ScheduleRequestPayload>;
  submitAvailability(input: {
    readonly endsAt: string;
    readonly note?: string;
    readonly preferredPeriods: readonly AvailabilityPeriodPayload[];
    readonly startsAt: string;
  }): Promise<ScheduleRequestPayload>;
  submitTimeOff(input: {
    readonly endsAt: string;
    readonly reason: string;
    readonly startsAt: string;
  }): Promise<ScheduleRequestPayload>;
  upsertShift(input: {
    readonly breakMinutes: number;
    readonly endsAt: string;
    readonly role: FlvRole;
    readonly shiftId?: string;
    readonly startsAt: string;
    readonly title: string;
    readonly userId: string;
  }): Promise<ScheduleShiftPayload>;
}

let demoStore = createScheduleDemoStore();

export function createScheduleService(
  session: MobileSession,
  options: {
    readonly fetcher?: typeof fetch;
    readonly offlineFallback?: boolean;
  } = {},
): ScheduleService {
  const apiClient = createTypedApiClient({
    accessTokenProvider: () => session.accessToken,
    baseUrl: DEFAULT_API_BASE_URL,
    fetcher: createResilientScheduleFetcher(
      session,
      options.fetcher,
      options.offlineFallback ?? isMobileDemoFallbackEnabled(),
    ),
  });

  return {
    async approveSwap(input) {
      const response = await apiClient.request("schedules.swaps.approve", {
        body: input,
      });

      return response.data;
    },
    async getCollaboratorView(input) {
      const response = await apiClient.request("schedules.collaboratorView", {
        query: {
          departmentId: session.scope.departmentId,
          organizationId: session.scope.organizationId,
          storeId: session.scope.storeId,
          ...(input?.userId === undefined ? {} : { userId: input.userId }),
        },
      });

      return response.data;
    },
    async getLeaderPlanner(input) {
      const response = await apiClient.request("schedules.planner", {
        query: {
          departmentId: session.scope.departmentId,
          organizationId: session.scope.organizationId,
          storeId: session.scope.storeId,
          ...(input?.weekStart === undefined ? {} : { weekStart: input.weekStart }),
        },
      });

      return response.data;
    },
    getSuggestedSwapCandidate(userId = session.userId) {
      return createSuggestedSwapCandidate(userId);
    },
    async publishSchedule(input) {
      const response = await apiClient.request("schedules.publish", {
        body: {
          scope: session.scope,
          ...(input?.shiftIds === undefined ? {} : { shiftIds: [...input.shiftIds] }),
        },
      });

      return response.data;
    },
    async proposeSwap(input) {
      const response = await apiClient.request("schedules.swaps.propose", {
        body: {
          ...(input.note === undefined ? {} : { note: input.note }),
          scope: session.scope,
          sourceShiftId: input.sourceShiftId,
          targetShiftId: input.targetShiftId,
          targetUserId: input.targetUserId,
        },
      });

      return response.data;
    },
    async respondToSwap(input) {
      const response = await apiClient.request("schedules.swaps.respond", {
        body: input,
      });

      return response.data;
    },
    async reviewRequest(input) {
      const response = await apiClient.request("schedules.requests.review", {
        body: input,
      });

      return response.data;
    },
    async submitAvailability(input) {
      const response = await apiClient.request("schedules.availability.create", {
        body: {
          endsAt: input.endsAt,
          ...(input.note === undefined ? {} : { note: input.note }),
          preferredPeriods: [...input.preferredPeriods],
          scope: session.scope,
          startsAt: input.startsAt,
        },
      });

      return response.data;
    },
    async submitTimeOff(input) {
      const response = await apiClient.request("schedules.timeOff.create", {
        body: {
          endsAt: input.endsAt,
          reason: input.reason,
          scope: session.scope,
          startsAt: input.startsAt,
        },
      });

      return response.data;
    },
    async upsertShift(input) {
      const response = await apiClient.request("schedules.shift.upsert", {
        body: {
          breakMinutes: input.breakMinutes,
          endsAt: input.endsAt,
          role: input.role,
          scope: session.scope,
          ...(input.shiftId === undefined ? {} : { shiftId: input.shiftId }),
          startsAt: input.startsAt,
          title: input.title,
          userId: input.userId,
        },
      });

      return response.data;
    },
  };
}

function createResilientScheduleFetcher(
  session: MobileSession,
  primaryFetcher?: typeof fetch,
  offlineFallback = false,
): typeof fetch {
  const fetcher = primaryFetcher ?? fetch;

  return async (input, init) => {
    try {
      return await fetcher(input, init);
    } catch (error) {
      if (!offlineFallback) {
        throw error;
      }

      return handleMockScheduleRequest(input, init, session);
    }
  };
}

async function handleMockScheduleRequest(
  input: Parameters<typeof fetch>[0],
  init: Parameters<typeof fetch>[1],
  session: MobileSession,
): Promise<Response> {
  const url = toUrl(input);
  const method = (init?.method ?? "GET").toUpperCase();

  if (url.pathname === "/schedules/collaborator-view" && method === "GET") {
    const userId = url.searchParams.get("userId") ?? session.userId;

    return jsonResponse(buildCollaboratorView(userId));
  }

  if (url.pathname === "/schedules/planner" && method === "GET") {
    if (!isLeaderRole(session.role)) {
      return errorResponse(
        "not_found_or_forbidden",
        "Acesso insuficiente para abrir o planejamento.",
        403,
      );
    }

    return jsonResponse(buildLeaderPlanner(url.searchParams.get("weekStart") ?? undefined));
  }

  if (url.pathname === "/schedules/shifts" && method === "POST") {
    if (!isLeaderRole(session.role)) {
      return errorResponse("not_found_or_forbidden", "Somente lideranca pode editar turnos.", 403);
    }

    const body =
      (await readJsonBody<{
        breakMinutes: number;
        endsAt: string;
        role: FlvRole;
        shiftId?: string;
        startsAt: string;
        title: string;
        userId: string;
      }>(init)) ?? fail("Missing shift body.");

    return jsonResponse(upsertDemoShift(body, session));
  }

  if (url.pathname === "/schedules/publish" && method === "POST") {
    if (!isLeaderRole(session.role)) {
      return errorResponse(
        "not_found_or_forbidden",
        "Somente lideranca pode publicar escala.",
        403,
      );
    }

    const body =
      (await readJsonBody<{ shiftIds?: string[] }>(init)) ?? fail("Missing publish body.");

    return jsonResponse(publishDemoSchedule(body.shiftIds ?? undefined));
  }

  if (url.pathname === "/schedules/availability" && method === "POST") {
    const body =
      (await readJsonBody<{
        endsAt: string;
        note?: string;
        preferredPeriods: AvailabilityPeriodPayload[];
        startsAt: string;
      }>(init)) ?? fail("Missing availability body.");

    return jsonResponse(createAvailabilityRequest(body, session));
  }

  if (url.pathname === "/schedules/time-off" && method === "POST") {
    const body =
      (await readJsonBody<{
        endsAt: string;
        reason: string;
        startsAt: string;
      }>(init)) ?? fail("Missing time-off body.");

    return jsonResponse(createTimeOffRequest(body, session));
  }

  if (url.pathname === "/schedules/requests/review" && method === "POST") {
    if (!isLeaderRole(session.role)) {
      return errorResponse(
        "not_found_or_forbidden",
        "Somente lideranca pode revisar pedidos.",
        403,
      );
    }

    const body =
      (await readJsonBody<{ decision: ScheduleDecisionPayload; requestId: string }>(init)) ??
      fail("Missing review body.");

    return jsonResponse(reviewDemoRequest(body, session));
  }

  if (url.pathname === "/schedules/swaps" && method === "POST") {
    const body =
      (await readJsonBody<{
        note?: string;
        sourceShiftId: string;
        targetShiftId: string;
        targetUserId: string;
      }>(init)) ?? fail("Missing swap body.");

    return jsonResponse(createSwapRequest(body, session));
  }

  if (url.pathname === "/schedules/swaps/respond" && method === "POST") {
    const body =
      (await readJsonBody<{ requestId: string; response: SwapResponsePayload }>(init)) ??
      fail("Missing swap response body.");

    return jsonResponse(respondToDemoSwap(body, session));
  }

  if (url.pathname === "/schedules/swaps/approve" && method === "POST") {
    if (!isLeaderRole(session.role)) {
      return errorResponse("not_found_or_forbidden", "Somente lideranca pode aprovar trocas.", 403);
    }

    const body =
      (await readJsonBody<{ requestId: string }>(init)) ?? fail("Missing swap approval body.");

    return jsonResponse(approveDemoSwap(body.requestId));
  }

  return errorResponse("not_found", "Nao foi possivel carregar a escala agora.", 404);
}

function buildCollaboratorView(userId: string): CollaboratorScheduleViewPayload {
  const now = new Date(DEMO_NOW);
  const orderedShifts = demoStore.shifts
    .filter((shift) => shift.userId === userId)
    .sort(compareShiftsAscending);
  const requests = demoStore.requests
    .filter((request) => request.requesterUserId === userId || request.counterpartUserId === userId)
    .sort(compareRequestsDescending);
  const notifications = demoStore.notifications
    .filter((notification) => notification.userId === userId)
    .sort(compareNotificationsDescending)
    .slice(0, 5);
  const nextShift = orderedShifts.find(
    (shift) => new Date(shift.endsAt).getTime() >= now.getTime(),
  );
  const todayShift = orderedShifts.find((shift) => isSameUtcDate(shift.startsAt, DEMO_NOW));

  return {
    breakMinutesToday: todayShift?.breakMinutes ?? 0,
    ...(nextShift === undefined ? {} : { nextShiftStartsAt: nextShift.startsAt }),
    notifications: clonePayload(notifications),
    pendingRequestCount: countPendingRequestsForUser(userId),
    requests: clonePayload(requests),
    timelineDays: buildCollaboratorTimelineDays(orderedShifts, now),
    ...(todayShift === undefined ? {} : { todayShift: clonePayload(todayShift) }),
    todayShiftStatus:
      todayShift === undefined
        ? "day-off"
        : todayShift.status === "draft"
          ? "pending-publication"
          : "scheduled",
    upcomingShifts: clonePayload(
      orderedShifts
        .filter((shift) => new Date(shift.endsAt).getTime() >= now.getTime())
        .slice(0, 4),
    ),
  };
}

function buildLeaderPlanner(weekStartInput?: string): LeaderSchedulePlannerPayload {
  const now = new Date(DEMO_NOW);
  const weekStart = startOfIsoWeek(weekStartInput === undefined ? now : new Date(weekStartInput));
  const weekEnd = addUtcDays(weekStart, 7);
  const shifts = demoStore.shifts
    .filter((shift) => timeWindowTouchesRange(shift.startsAt, shift.endsAt, weekStart, weekEnd))
    .sort(compareShiftsAscending);
  const coverageAlerts = buildCoverageAlerts(shifts, weekStart, weekEnd);
  const issues = buildPlannerIssues(shifts, coverageAlerts);

  return {
    coverageAlerts,
    issues,
    notifications: clonePayload(
      [...demoStore.notifications].sort(compareNotificationsDescending).slice(0, 6),
    ),
    pendingApprovalCount: demoStore.requests.filter(isPendingScheduleRequest).length,
    requests: clonePayload([...demoStore.requests].sort(compareRequestsDescending)),
    shifts: clonePayload(shifts),
    teamMembers: clonePayload(
      [...demoStore.teamMembers].sort((left, right) =>
        left.displayName.localeCompare(right.displayName, "pt-BR"),
      ),
    ),
    timelineDays: buildLeaderTimelineDays(shifts, coverageAlerts, weekStart),
    weekLabel: formatWeekLabel(weekStart),
  };
}

function createSuggestedSwapCandidate(userId: string): SuggestedSwapCandidate | undefined {
  const now = new Date(DEMO_NOW).getTime();
  const ownFutureShifts = demoStore.shifts
    .filter(
      (shift) =>
        shift.userId === userId &&
        shift.status === "published" &&
        new Date(shift.startsAt).getTime() > now,
    )
    .sort(compareShiftsAscending);

  for (const sourceShift of ownFutureShifts) {
    const targetShift = demoStore.shifts.find(
      (shift) =>
        shift.userId !== userId &&
        shift.status === "published" &&
        isSameUtcDate(shift.startsAt, sourceShift.startsAt),
    );

    if (targetShift !== undefined) {
      return {
        sourceShiftId: sourceShift.id,
        sourceShiftLabel: `${sourceShift.title} · ${formatShiftTimeRange(sourceShift)}`,
        targetShiftId: targetShift.id,
        targetShiftLabel: `${targetShift.title} · ${formatShiftTimeRange(targetShift)}`,
        targetUserId: targetShift.userId,
        targetUserName: targetShift.userName,
      };
    }
  }

  return undefined;
}

function upsertDemoShift(
  input: {
    readonly breakMinutes: number;
    readonly endsAt: string;
    readonly role: FlvRole;
    readonly shiftId?: string;
    readonly startsAt: string;
    readonly title: string;
    readonly userId: string;
  },
  _session: MobileSession,
): ScheduleShiftPayload {
  const existingShift =
    input.shiftId === undefined
      ? undefined
      : demoStore.shifts.find((shift) => shift.id === input.shiftId);
  const userName = findTeamMemberName(input.userId);
  const nextShift: ScheduleShiftPayload =
    existingShift === undefined
      ? {
          breakMinutes: input.breakMinutes,
          endsAt: input.endsAt,
          id: createMockId("shift"),
          role: input.role,
          startsAt: input.startsAt,
          status: "draft",
          title: input.title,
          userId: input.userId,
          userName,
        }
      : {
          ...existingShift,
          breakMinutes: input.breakMinutes,
          endsAt: input.endsAt,
          role: input.role,
          startsAt: input.startsAt,
          title: input.title,
          userId: input.userId,
          userName,
        };

  demoStore = {
    ...demoStore,
    shifts: replaceById(demoStore.shifts, nextShift, compareShiftsAscending),
  };

  if (
    existingShift !== undefined &&
    existingShift.status === "published" &&
    hasShiftChanged(existingShift, nextShift)
  ) {
    const affectedUserIds = new Set([existingShift.userId, nextShift.userId]);
    const notifications = [...affectedUserIds].map((userId) =>
      createNotification({
        message: `Seu turno ${formatShiftTimeRange(nextShift)} foi atualizado pela lideranca.`,
        shiftId: nextShift.id,
        type: "schedule_changed",
        userId,
      }),
    );

    demoStore = {
      ...demoStore,
      notifications: [...notifications, ...demoStore.notifications].sort(
        compareNotificationsDescending,
      ),
    };
  }

  return clonePayload(nextShift);
}

function publishDemoSchedule(shiftIds?: readonly string[]): SchedulePublishResultPayload {
  const nowIso = new Date(DEMO_NOW).toISOString();
  const targetIds = shiftIds === undefined ? undefined : new Set(shiftIds);
  const publishedShifts: ScheduleShiftPayload[] = [];
  const nextShifts = demoStore.shifts.map((shift) => {
    if (shift.status === "draft" && (targetIds === undefined || targetIds.has(shift.id))) {
      const publishedShift: ScheduleShiftPayload = {
        ...shift,
        status: "published",
      };
      publishedShifts.push(publishedShift);

      return publishedShift;
    }

    return shift;
  });
  const publishNotifications = publishedShifts.map((shift) =>
    createNotification({
      createdAt: nowIso,
      message: `Sua escala ${formatShiftTimeRange(shift)} foi publicada.`,
      shiftId: shift.id,
      type: "schedule_published",
      userId: shift.userId,
    }),
  );

  demoStore = {
    ...demoStore,
    notifications: [...publishNotifications, ...demoStore.notifications].sort(
      compareNotificationsDescending,
    ),
    shifts: nextShifts.sort(compareShiftsAscending),
  };

  const planner = buildLeaderPlanner();

  return {
    coverageGapCount: planner.coverageAlerts.filter((alert) => alert.severity !== "ok").length,
    notificationCount: publishNotifications.length,
    publishedCount: publishedShifts.length,
    weekLabel: formatWeekLabel(startOfIsoWeek(new Date(DEMO_NOW))),
  };
}

function createAvailabilityRequest(
  input: {
    readonly endsAt: string;
    readonly note?: string;
    readonly preferredPeriods: readonly AvailabilityPeriodPayload[];
    readonly startsAt: string;
  },
  session: MobileSession,
): ScheduleRequestPayload {
  const request = createRequestPayload({
    createdAt: new Date(DEMO_NOW).toISOString(),
    endsAt: input.endsAt,
    kind: "availability",
    ...(input.note === undefined ? {} : { note: input.note }),
    preferredPeriods: input.preferredPeriods,
    requesterUserId: session.userId,
    startsAt: input.startsAt,
    status: "pending",
  });
  const reviewRecipients = selectReviewRecipients(session.userId);
  const notifications = reviewRecipients.map((member) =>
    createNotification({
      message: `${findTeamMemberName(session.userId)} enviou disponibilidade para revisao.`,
      requestId: request.id,
      type: "availability_submitted",
      userId: member.userId,
    }),
  );

  demoStore = {
    ...demoStore,
    notifications: [...notifications, ...demoStore.notifications].sort(
      compareNotificationsDescending,
    ),
    requests: replaceById(demoStore.requests, request, compareRequestsDescending),
  };

  return clonePayload(request);
}

function createTimeOffRequest(
  input: {
    readonly endsAt: string;
    readonly reason: string;
    readonly startsAt: string;
  },
  session: MobileSession,
): ScheduleRequestPayload {
  const request = createRequestPayload({
    createdAt: new Date(DEMO_NOW).toISOString(),
    endsAt: input.endsAt,
    kind: "time_off",
    note: input.reason,
    requesterUserId: session.userId,
    startsAt: input.startsAt,
    status: "pending",
  });
  const reviewRecipients = selectReviewRecipients(session.userId);
  const notifications = reviewRecipients.map((member) =>
    createNotification({
      message: `${findTeamMemberName(session.userId)} solicitou folga para revisao.`,
      requestId: request.id,
      type: "time_off_submitted",
      userId: member.userId,
    }),
  );

  demoStore = {
    ...demoStore,
    notifications: [...notifications, ...demoStore.notifications].sort(
      compareNotificationsDescending,
    ),
    requests: replaceById(demoStore.requests, request, compareRequestsDescending),
  };

  return clonePayload(request);
}

function reviewDemoRequest(
  input: {
    readonly decision: ScheduleDecisionPayload;
    readonly requestId: string;
  },
  session: MobileSession,
): ScheduleRequestPayload {
  const request = findRequest(input.requestId);

  if (request.kind === "swap") {
    fail("Swap requests must be approved in the swap workflow.");
  }

  const updatedRequest: ScheduleRequestPayload = {
    ...request,
    reviewedAt: new Date(DEMO_NOW).toISOString(),
    reviewedByUserId: session.userId,
    status: input.decision === "approve" ? "approved" : "rejected",
  };
  const notification = createNotification({
    message:
      input.decision === "approve"
        ? request.kind === "availability"
          ? "Sua disponibilidade foi aprovada."
          : "Seu pedido de folga foi aprovado."
        : request.kind === "availability"
          ? "Sua disponibilidade foi rejeitada."
          : "Seu pedido de folga foi rejeitado.",
    requestId: request.id,
    type: request.kind === "availability" ? "availability_reviewed" : "time_off_reviewed",
    userId: request.requesterUserId,
  });

  demoStore = {
    ...demoStore,
    notifications: [notification, ...demoStore.notifications].sort(compareNotificationsDescending),
    requests: replaceById(demoStore.requests, updatedRequest, compareRequestsDescending),
  };

  return clonePayload(updatedRequest);
}

function createSwapRequest(
  input: {
    readonly note?: string;
    readonly sourceShiftId: string;
    readonly targetShiftId: string;
    readonly targetUserId: string;
  },
  session: MobileSession,
): ScheduleRequestPayload {
  const sourceShift = findShift(input.sourceShiftId);
  const targetShift = findShift(input.targetShiftId);

  if (sourceShift.userId !== session.userId) {
    fail("Collaborator can only propose swaps for their own shifts.");
  }

  const request = createRequestPayload({
    counterpartShiftId: targetShift.id,
    counterpartUserId: input.targetUserId,
    createdAt: new Date(DEMO_NOW).toISOString(),
    endsAt: sourceShift.endsAt,
    kind: "swap",
    ...(input.note === undefined ? {} : { note: input.note }),
    requesterUserId: session.userId,
    shiftId: sourceShift.id,
    startsAt: sourceShift.startsAt,
    status: "pending",
  });
  const notification = createNotification({
    message: `${findTeamMemberName(session.userId)} propos uma troca de turno para voce.`,
    requestId: request.id,
    shiftId: sourceShift.id,
    type: "swap_proposed",
    userId: input.targetUserId,
  });

  demoStore = {
    ...demoStore,
    notifications: [notification, ...demoStore.notifications].sort(compareNotificationsDescending),
    requests: replaceById(demoStore.requests, request, compareRequestsDescending),
  };

  return clonePayload(request);
}

function respondToDemoSwap(
  input: {
    readonly requestId: string;
    readonly response: SwapResponsePayload;
  },
  session: MobileSession,
): ScheduleRequestPayload {
  const request = findRequest(input.requestId);

  if (request.kind !== "swap") {
    fail("Only swap requests can receive collaborator responses.");
  }

  if (request.counterpartUserId !== session.userId) {
    fail("Only the requested collaborator can respond to this swap.");
  }

  const updatedRequest: ScheduleRequestPayload = {
    ...request,
    reviewedAt: new Date(DEMO_NOW).toISOString(),
    reviewedByUserId: session.userId,
    status: input.response === "accept" ? "accepted" : "rejected",
  };
  const notifications =
    input.response === "accept"
      ? selectReviewRecipients(session.userId).map((member) =>
          createNotification({
            message: `${findTeamMemberName(session.userId)} aceitou uma troca e aguarda aprovacao.`,
            requestId: request.id,
            type: "swap_responded",
            userId: member.userId,
          }),
        )
      : [
          createNotification({
            message: "Sua proposta de troca foi recusada.",
            requestId: request.id,
            type: "swap_responded",
            userId: request.requesterUserId,
          }),
        ];

  demoStore = {
    ...demoStore,
    notifications: [...notifications, ...demoStore.notifications].sort(
      compareNotificationsDescending,
    ),
    requests: replaceById(demoStore.requests, updatedRequest, compareRequestsDescending),
  };

  return clonePayload(updatedRequest);
}

function approveDemoSwap(requestId: string): ScheduleRequestPayload {
  const request = findRequest(requestId);

  if (request.kind !== "swap") {
    fail("Only swap requests can be approved.");
  }

  if (request.status !== "accepted") {
    fail("Swap request must be accepted before leader approval.");
  }

  const sourceShift = findShift(request.shiftId ?? fail("Missing source shift."));
  const targetShift = findShift(request.counterpartShiftId ?? fail("Missing target shift."));
  const sourceUserName = findTeamMemberName(sourceShift.userId);
  const targetUserName = findTeamMemberName(targetShift.userId);
  const updatedSourceShift: ScheduleShiftPayload = {
    ...sourceShift,
    userId: targetShift.userId,
    userName: targetUserName,
  };
  const updatedTargetShift: ScheduleShiftPayload = {
    ...targetShift,
    userId: sourceShift.userId,
    userName: sourceUserName,
  };
  const updatedRequest: ScheduleRequestPayload = {
    ...request,
    reviewedAt: new Date(DEMO_NOW).toISOString(),
    reviewedByUserId: "user_demo_lider",
    status: "approved",
  };
  const notifications = [
    createNotification({
      message: "A troca de turno foi aprovada e a escala foi atualizada.",
      requestId: updatedRequest.id,
      type: "swap_approved",
      userId: updatedRequest.requesterUserId,
    }),
    ...(updatedRequest.counterpartUserId === undefined
      ? []
      : [
          createNotification({
            message: "A troca de turno foi aprovada e a escala foi atualizada.",
            requestId: updatedRequest.id,
            type: "swap_approved",
            userId: updatedRequest.counterpartUserId,
          }),
        ]),
  ];

  demoStore = {
    ...demoStore,
    notifications: [...notifications, ...demoStore.notifications].sort(
      compareNotificationsDescending,
    ),
    requests: replaceById(demoStore.requests, updatedRequest, compareRequestsDescending),
    shifts: [
      updatedSourceShift,
      updatedTargetShift,
      ...demoStore.shifts.filter(
        (shift) => shift.id !== sourceShift.id && shift.id !== targetShift.id,
      ),
    ].sort(compareShiftsAscending),
  };

  return clonePayload(updatedRequest);
}

function buildCoverageAlerts(
  shifts: readonly ScheduleShiftPayload[],
  weekStart: Date,
  weekEnd: Date,
): ScheduleCoverageAlertPayload[] {
  return demoStore.coverageRequirements
    .filter((rule) => timeWindowTouchesRange(rule.startsAt, rule.endsAt, weekStart, weekEnd))
    .map((rule) => {
      const assignedHeadcount = shifts.filter(
        (shift) =>
          shift.status === "published" &&
          shift.role === rule.requiredRole &&
          shift.startsAt < rule.endsAt &&
          rule.startsAt < shift.endsAt,
      ).length;
      const shortfall = rule.requiredHeadcount - assignedHeadcount;

      return {
        assignedHeadcount,
        id: rule.id,
        label: rule.label,
        periodLabel: `${formatUtcDate(rule.startsAt)} · ${formatShiftTimeRange(rule)}`,
        requiredHeadcount: rule.requiredHeadcount,
        requiredRole: rule.requiredRole,
        ...(rule.routineResponsibility === undefined
          ? {}
          : { routineResponsibility: rule.routineResponsibility }),
        severity: shortfall <= 0 ? "ok" : shortfall === 1 ? "warning" : "critical",
      };
    });
}

function buildPlannerIssues(
  shifts: readonly ScheduleShiftPayload[],
  coverageAlerts: readonly ScheduleCoverageAlertPayload[],
): SchedulePlannerIssuePayload[] {
  const issues: SchedulePlannerIssuePayload[] = coverageAlerts
    .filter((alert) => alert.severity !== "ok")
    .map((alert) => ({
      coverageId: alert.id,
      kind: "coverage_gap",
      message:
        alert.severity === "critical"
          ? "A cobertura prevista esta abaixo do minimo para o periodo."
          : "A cobertura exige ajuste fino antes da publicacao.",
    }));

  const shiftsByUser = new Map<string, ScheduleShiftPayload[]>();

  for (const shift of shifts) {
    const current = shiftsByUser.get(shift.userId) ?? [];
    current.push(shift);
    shiftsByUser.set(shift.userId, current);
  }

  for (const userShifts of shiftsByUser.values()) {
    const orderedShifts = [...userShifts].sort(compareShiftsAscending);

    for (let index = 1; index < orderedShifts.length; index += 1) {
      const previousShift = orderedShifts[index - 1]!;
      const currentShift = orderedShifts[index]!;

      if (new Date(previousShift.endsAt).getTime() > new Date(currentShift.startsAt).getTime()) {
        issues.push({
          kind: "overlapping_shift",
          message: `Ha turnos sobrepostos para ${currentShift.userName}.`,
          shiftId: currentShift.id,
        });
      }
    }
  }

  const approvedTimeOffRequests = demoStore.requests.filter(
    (request) => request.kind === "time_off" && request.status === "approved",
  );

  for (const request of approvedTimeOffRequests) {
    for (const shift of shifts) {
      if (
        shift.userId === request.requesterUserId &&
        timeWindowTouchesRange(
          shift.startsAt,
          shift.endsAt,
          new Date(request.startsAt),
          new Date(request.endsAt),
        )
      ) {
        issues.push({
          kind: "time_off_conflict",
          message: "Ha turno publicado sobrepondo uma folga aprovada.",
          requestId: request.id,
          shiftId: shift.id,
        });
      }
    }
  }

  return issues;
}

function buildCollaboratorTimelineDays(
  shifts: readonly ScheduleShiftPayload[],
  now: Date,
): CollaboratorScheduleViewPayload["timelineDays"] {
  const start = startOfUtcDay(now);

  return Array.from({ length: 5 }, (_, index) => {
    const day = addUtcDays(start, index);
    const shiftsForDay = shifts.filter((shift) => isSameUtcDate(shift.startsAt, day.toISOString()));

    return {
      emphasis: shiftsForDay.length === 0 ? undefined : index === 0 ? "high" : "medium",
      id: day.toISOString(),
      label: weekdayLabel(day),
      shift:
        shiftsForDay.length === 0
          ? "Folga"
          : shiftsForDay.length === 1
            ? formatShiftTimeRange(shiftsForDay[0]!)
            : `${shiftsForDay.length} turnos`,
    };
  });
}

function buildLeaderTimelineDays(
  shifts: readonly ScheduleShiftPayload[],
  coverageAlerts: readonly ScheduleCoverageAlertPayload[],
  weekStart: Date,
): LeaderSchedulePlannerPayload["timelineDays"] {
  return Array.from({ length: 7 }, (_, index) => {
    const day = addUtcDays(weekStart, index);
    const dayLabel = formatUtcDate(day.toISOString());
    const shiftsForDay = shifts.filter((shift) => isSameUtcDate(shift.startsAt, day.toISOString()));
    const hasCriticalCoverage = coverageAlerts.some(
      (alert) => alert.severity === "critical" && alert.periodLabel.startsWith(dayLabel),
    );

    return {
      emphasis: hasCriticalCoverage ? "high" : shiftsForDay.length > 0 ? "medium" : undefined,
      id: day.toISOString(),
      label: weekdayLabel(day),
      shift: shiftsForDay.length === 0 ? "Folga" : `${shiftsForDay.length} turnos`,
    };
  });
}

function selectReviewRecipients(excludedUserId: string): ScheduleTeamMemberPayload[] {
  return demoStore.teamMembers.filter(
    (member) => member.userId !== excludedUserId && isLeaderRole(member.role),
  );
}

function countPendingRequestsForUser(userId: string): number {
  return demoStore.requests.filter(
    (request) =>
      (request.requesterUserId === userId || request.counterpartUserId === userId) &&
      isPendingScheduleRequest(request),
  ).length;
}

function isPendingScheduleRequest(request: ScheduleRequestPayload): boolean {
  return request.status === "pending" || request.status === "accepted";
}

function createRequestPayload(input: {
  readonly counterpartShiftId?: string;
  readonly counterpartUserId?: string;
  readonly createdAt: string;
  readonly endsAt: string;
  readonly kind: ScheduleRequestPayload["kind"];
  readonly note?: string;
  readonly preferredPeriods?: readonly AvailabilityPeriodPayload[];
  readonly requesterUserId: string;
  readonly shiftId?: string;
  readonly startsAt: string;
  readonly status: ScheduleRequestPayload["status"];
}): ScheduleRequestPayload {
  return {
    ...(input.counterpartShiftId === undefined
      ? {}
      : { counterpartShiftId: input.counterpartShiftId }),
    ...(input.counterpartUserId === undefined
      ? {}
      : { counterpartUserId: input.counterpartUserId }),
    ...(input.counterpartUserId === undefined
      ? {}
      : { counterpartUserName: findTeamMemberName(input.counterpartUserId) }),
    createdAt: input.createdAt,
    endsAt: input.endsAt,
    id: createMockId("request"),
    kind: input.kind,
    ...(input.note === undefined ? {} : { note: input.note }),
    ...(input.preferredPeriods === undefined
      ? {}
      : { preferredPeriods: [...input.preferredPeriods] }),
    requesterUserId: input.requesterUserId,
    requesterUserName: findTeamMemberName(input.requesterUserId),
    ...(input.shiftId === undefined ? {} : { shiftId: input.shiftId }),
    startsAt: input.startsAt,
    status: input.status,
  };
}

function createNotification(input: {
  readonly createdAt?: string;
  readonly message: string;
  readonly requestId?: string;
  readonly shiftId?: string;
  readonly type: ScheduleNotificationPayload["type"];
  readonly userId: string;
}): ScheduleNotificationPayload {
  return {
    createdAt: input.createdAt ?? new Date(DEMO_NOW).toISOString(),
    id: createMockId("notification"),
    message: input.message,
    ...(input.requestId === undefined ? {} : { requestId: input.requestId }),
    ...(input.shiftId === undefined ? {} : { shiftId: input.shiftId }),
    status: "sent",
    type: input.type,
    userId: input.userId,
  };
}

function createScheduleDemoStore(): ScheduleDemoStore {
  const teamMembers: ScheduleTeamMemberPayload[] = [
    {
      displayName: "Julia Lima",
      role: "colaborador",
      userId: "user_demo_colaborador",
    },
    {
      displayName: "Mateus Rocha",
      role: "colaborador",
      userId: "user_demo_colaborador_2",
    },
    {
      displayName: "Carla Nunes",
      role: "colaborador",
      userId: "user_demo_colaborador_3",
    },
    {
      displayName: "Renata Prado",
      role: "lider-setor",
      userId: "user_demo_lider",
    },
    {
      displayName: "Felipe Costa",
      role: "gerente-loja",
      userId: "user_demo_gerente",
    },
    {
      displayName: "Ana Moura",
      role: "admin-organizacao",
      userId: "user_demo_admin",
    },
  ];

  return {
    coverageRequirements: [
      {
        endsAt: "2026-04-23T15:00:00.000Z",
        id: "coverage_thursday_opening",
        label: "Cobertura da abertura de quinta",
        requiredHeadcount: 2,
        requiredRole: "colaborador",
        routineResponsibility: "abertura",
        startsAt: "2026-04-23T06:00:00.000Z",
      },
      {
        endsAt: "2026-04-24T15:00:00.000Z",
        id: "coverage_friday_opening",
        label: "Cobertura da abertura de sexta",
        requiredHeadcount: 2,
        requiredRole: "colaborador",
        routineResponsibility: "abertura",
        startsAt: "2026-04-24T06:00:00.000Z",
      },
      {
        endsAt: "2026-04-25T20:00:00.000Z",
        id: "coverage_saturday_peak",
        label: "Cobertura do pico de sabado",
        requiredHeadcount: 2,
        requiredRole: "colaborador",
        routineResponsibility: "reposicao",
        startsAt: "2026-04-25T11:00:00.000Z",
      },
    ],
    notifications: [
      {
        createdAt: "2026-04-22T12:05:00.000Z",
        id: "schedule_notification_collaborator_publish",
        message: "Sua escala 09:00-17:00 foi publicada.",
        shiftId: "shift_today_collaborator",
        status: "sent",
        type: "schedule_published",
        userId: "user_demo_colaborador",
      },
      {
        createdAt: "2026-04-23T06:42:00.000Z",
        id: "schedule_notification_leader_availability",
        message: "Julia Lima enviou disponibilidade para revisao.",
        requestId: "request_availability_collaborator",
        status: "sent",
        type: "availability_submitted",
        userId: "user_demo_lider",
      },
      {
        createdAt: "2026-04-23T08:26:00.000Z",
        id: "schedule_notification_manager_swap",
        message: "Mateus Rocha aceitou uma troca e aguarda aprovacao.",
        requestId: "request_swap_weekend",
        status: "sent",
        type: "swap_responded",
        userId: "user_demo_gerente",
      },
      {
        createdAt: "2026-04-23T08:26:00.000Z",
        id: "schedule_notification_collaborator_swap",
        message: "Mateus Rocha aceitou sua proposta de troca. Agora falta aprovacao.",
        requestId: "request_swap_weekend",
        status: "sent",
        type: "swap_responded",
        userId: "user_demo_colaborador",
      },
    ],
    requestCounter: 0,
    requests: [
      {
        createdAt: "2026-04-23T06:40:00.000Z",
        endsAt: "2026-04-27T15:00:00.000Z",
        id: "request_availability_collaborator",
        kind: "availability",
        note: "Posso cobrir a abertura da segunda.",
        preferredPeriods: ["opening"],
        requesterUserId: "user_demo_colaborador",
        requesterUserName: "Julia Lima",
        startsAt: "2026-04-27T06:00:00.000Z",
        status: "pending",
      },
      {
        createdAt: "2026-04-22T15:00:00.000Z",
        endsAt: "2026-04-24T18:00:00.000Z",
        id: "request_time_off_mateus",
        kind: "time_off",
        note: "Consulta medica no periodo da tarde.",
        requesterUserId: "user_demo_colaborador_2",
        requesterUserName: "Mateus Rocha",
        reviewedAt: "2026-04-22T18:00:00.000Z",
        reviewedByUserId: "user_demo_lider",
        startsAt: "2026-04-24T09:00:00.000Z",
        status: "approved",
      },
      {
        counterpartShiftId: "shift_saturday_mateus",
        counterpartUserId: "user_demo_colaborador_2",
        counterpartUserName: "Mateus Rocha",
        createdAt: "2026-04-23T08:10:00.000Z",
        endsAt: "2026-04-25T20:00:00.000Z",
        id: "request_swap_weekend",
        kind: "swap",
        note: "Troco meu pico da tarde pelo turno de abertura.",
        requesterUserId: "user_demo_colaborador",
        requesterUserName: "Julia Lima",
        reviewedAt: "2026-04-23T08:25:00.000Z",
        reviewedByUserId: "user_demo_colaborador_2",
        shiftId: "shift_saturday_collaborator",
        startsAt: "2026-04-25T11:00:00.000Z",
        status: "accepted",
      },
    ],
    shifts: [
      createShiftPayload(
        {
          breakMinutes: 45,
          endsAt: "2026-04-23T17:00:00.000Z",
          id: "shift_today_collaborator",
          role: "colaborador",
          startsAt: "2026-04-23T09:00:00.000Z",
          status: "published",
          title: "Abertura FLV",
          userId: "user_demo_colaborador",
        },
        teamMembers,
      ),
      createShiftPayload(
        {
          breakMinutes: 45,
          endsAt: "2026-04-24T15:00:00.000Z",
          id: "shift_friday_collaborator",
          role: "colaborador",
          startsAt: "2026-04-24T06:00:00.000Z",
          status: "draft",
          title: "Reforco de abertura",
          userId: "user_demo_colaborador",
        },
        teamMembers,
      ),
      createShiftPayload(
        {
          breakMinutes: 60,
          endsAt: "2026-04-25T20:00:00.000Z",
          id: "shift_saturday_collaborator",
          role: "colaborador",
          startsAt: "2026-04-25T11:00:00.000Z",
          status: "published",
          title: "Pico da tarde",
          userId: "user_demo_colaborador",
        },
        teamMembers,
      ),
      createShiftPayload(
        {
          breakMinutes: 45,
          endsAt: "2026-04-23T15:00:00.000Z",
          id: "shift_today_mateus",
          role: "colaborador",
          startsAt: "2026-04-23T06:00:00.000Z",
          status: "published",
          title: "Abertura fria",
          userId: "user_demo_colaborador_2",
        },
        teamMembers,
      ),
      createShiftPayload(
        {
          breakMinutes: 60,
          endsAt: "2026-04-24T18:00:00.000Z",
          id: "shift_friday_mateus",
          role: "colaborador",
          startsAt: "2026-04-24T09:00:00.000Z",
          status: "published",
          title: "Frente fria",
          userId: "user_demo_colaborador_2",
        },
        teamMembers,
      ),
      createShiftPayload(
        {
          breakMinutes: 45,
          endsAt: "2026-04-25T15:00:00.000Z",
          id: "shift_saturday_mateus",
          role: "colaborador",
          startsAt: "2026-04-25T06:00:00.000Z",
          status: "published",
          title: "Abertura sabado",
          userId: "user_demo_colaborador_2",
        },
        teamMembers,
      ),
      createShiftPayload(
        {
          breakMinutes: 45,
          endsAt: "2026-04-24T15:00:00.000Z",
          id: "shift_friday_carla",
          role: "colaborador",
          startsAt: "2026-04-24T06:00:00.000Z",
          status: "draft",
          title: "Reposicao premium",
          userId: "user_demo_colaborador_3",
        },
        teamMembers,
      ),
    ],
    teamMembers,
  };
}

function createShiftPayload(
  input: Omit<ScheduleShiftPayload, "userName">,
  teamMembers: readonly ScheduleTeamMemberPayload[],
): ScheduleShiftPayload {
  return {
    ...input,
    userName:
      teamMembers.find((member) => member.userId === input.userId)?.displayName ?? input.userId,
  };
}

function findRequest(requestId: string): ScheduleRequestPayload {
  return (
    demoStore.requests.find((request) => request.id === requestId) ?? fail("Request not found.")
  );
}

function findShift(shiftId: string): ScheduleShiftPayload {
  return demoStore.shifts.find((shift) => shift.id === shiftId) ?? fail("Shift not found.");
}

function findTeamMemberName(userId: string): string {
  return demoStore.teamMembers.find((member) => member.userId === userId)?.displayName ?? userId;
}

function hasShiftChanged(left: ScheduleShiftPayload, right: ScheduleShiftPayload): boolean {
  return (
    left.breakMinutes !== right.breakMinutes ||
    left.endsAt !== right.endsAt ||
    left.role !== right.role ||
    left.startsAt !== right.startsAt ||
    left.title !== right.title ||
    left.userId !== right.userId
  );
}

function replaceById<T extends { readonly id: string }>(
  items: readonly T[],
  nextItem: T,
  sorter: (left: T, right: T) => number,
): T[] {
  return [...items.filter((item) => item.id !== nextItem.id), nextItem].sort(sorter);
}

function compareNotificationsDescending(
  left: ScheduleNotificationPayload,
  right: ScheduleNotificationPayload,
): number {
  return right.createdAt.localeCompare(left.createdAt);
}

function compareRequestsDescending(
  left: ScheduleRequestPayload,
  right: ScheduleRequestPayload,
): number {
  return right.createdAt.localeCompare(left.createdAt);
}

function compareShiftsAscending(left: ScheduleShiftPayload, right: ScheduleShiftPayload): number {
  return left.startsAt.localeCompare(right.startsAt);
}

function createMockId(prefix: string): string {
  demoStore = {
    ...demoStore,
    requestCounter: demoStore.requestCounter + 1,
  };

  return `${prefix}_mobile_${demoStore.requestCounter}`;
}

function startOfIsoWeek(date: Date): Date {
  const day = date.getUTCDay();
  const distance = day === 0 ? -6 : 1 - day;

  return startOfUtcDay(addUtcDays(date, distance));
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function isSameUtcDate(left: string, right: string): boolean {
  const leftDate = new Date(left);
  const rightDate = new Date(right);

  return (
    leftDate.getUTCFullYear() === rightDate.getUTCFullYear() &&
    leftDate.getUTCMonth() === rightDate.getUTCMonth() &&
    leftDate.getUTCDate() === rightDate.getUTCDate()
  );
}

function timeWindowTouchesRange(
  startsAt: string,
  endsAt: string,
  rangeStart: Date,
  rangeEnd: Date,
): boolean {
  return (
    new Date(startsAt).getTime() < rangeEnd.getTime() &&
    rangeStart.getTime() < new Date(endsAt).getTime()
  );
}

function formatShiftTimeRange(timeWindow: {
  readonly endsAt: string;
  readonly startsAt: string;
}): string {
  return `${formatUtcHourMinute(timeWindow.startsAt)}-${formatUtcHourMinute(timeWindow.endsAt)}`;
}

function formatUtcHourMinute(isoString: string): string {
  const date = new Date(isoString);

  return `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
}

function formatUtcDate(isoString: string): string {
  const date = new Date(isoString);

  return `${String(date.getUTCDate()).padStart(2, "0")}/${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function formatWeekLabel(weekStart: Date): string {
  const weekEnd = addUtcDays(weekStart, 6);

  return `Semana ${formatUtcDate(weekStart.toISOString())}-${formatUtcDate(weekEnd.toISOString())}`;
}

function weekdayLabel(date: Date): string {
  const weekday = date.getUTCDay();

  if (weekday === 0) {
    return "Dom";
  }

  if (weekday === 1) {
    return "Seg";
  }

  if (weekday === 2) {
    return "Ter";
  }

  if (weekday === 3) {
    return "Qua";
  }

  if (weekday === 4) {
    return "Qui";
  }

  if (weekday === 5) {
    return "Sex";
  }

  return "Sab";
}

function isLeaderRole(role: FlvRole): boolean {
  return role === "lider-setor" || role === "gerente-loja" || role === "admin-organizacao";
}

function clonePayload<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function jsonResponse<T>(data: T): Response {
  return new Response(
    JSON.stringify({
      data,
      requestId: `req_mobile_schedule_${demoStore.requestCounter + 1}`,
    }),
    {
      headers: {
        "content-type": "application/json",
      },
      status: 200,
    },
  );
}

function errorResponse(code: string, message: string, status: number): Response {
  return new Response(
    JSON.stringify({
      error: {
        code,
        message,
      },
      requestId: `req_mobile_schedule_${demoStore.requestCounter + 1}`,
    }),
    {
      headers: {
        "content-type": "application/json",
      },
      status,
    },
  );
}

function readJsonBody<T>(init: Parameters<typeof fetch>[1]): Promise<T | undefined> {
  if (typeof init?.body !== "string") {
    return Promise.resolve(undefined);
  }

  return Promise.resolve(JSON.parse(init.body) as T);
}

function toUrl(input: Parameters<typeof fetch>[0]): URL {
  if (typeof input === "string") {
    return new URL(input);
  }

  if (input instanceof URL) {
    return input;
  }

  return new URL(input.url);
}

function fail(message: string): never {
  throw new Error(message);
}

function resolveApiBaseUrl(): string {
  const processEnv =
    typeof process === "undefined"
      ? undefined
      : (process.env as Record<string, string | undefined>);
  const configuredBaseUrl = processEnv?.EXPO_PUBLIC_API_URL;

  return configuredBaseUrl === undefined || configuredBaseUrl.length === 0
    ? "http://localhost:3000"
    : configuredBaseUrl;
}
