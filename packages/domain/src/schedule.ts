import {
  assertNonEmptyString,
  assertNonNegativeInteger,
  assertPositiveInteger,
  assertValidDate,
  compactOptional,
  createTimeWindow,
  type TimeWindow,
} from "./base.js";
import { type DomainId, type Entity, createDomainId } from "./ids.js";
import { type FlvRole } from "./identity.js";
import { type TenantScope } from "./scope.js";

export const shiftStatuses = ["draft", "published", "cancelled", "completed"] as const;

export type ShiftStatus = (typeof shiftStatuses)[number];

export const scheduleRequestKinds = ["availability", "time_off", "swap"] as const;

export type ScheduleRequestKind = (typeof scheduleRequestKinds)[number];

export const requestStatuses = [
  "pending",
  "accepted",
  "approved",
  "rejected",
  "cancelled",
] as const;

export type RequestStatus = (typeof requestStatuses)[number];

export const availabilityPeriods = ["opening", "midday", "closing"] as const;

export type AvailabilityPeriod = (typeof availabilityPeriods)[number];

export const scheduleNotificationStatuses = ["queued", "sent", "read"] as const;

export type ScheduleNotificationStatus = (typeof scheduleNotificationStatuses)[number];

export const scheduleNotificationTypes = [
  "schedule_published",
  "schedule_changed",
  "availability_submitted",
  "availability_reviewed",
  "time_off_submitted",
  "time_off_reviewed",
  "swap_proposed",
  "swap_responded",
  "swap_approved",
] as const;

export type ScheduleNotificationType = (typeof scheduleNotificationTypes)[number];

export interface Shift extends Entity<DomainId<"shift">>, TimeWindow {
  readonly breakMinutes: number;
  readonly createdByUserId?: DomainId<"user">;
  readonly publishedAt?: Date;
  readonly role: FlvRole;
  readonly scope: TenantScope;
  readonly status: ShiftStatus;
  readonly title: string;
  readonly userId: DomainId<"user">;
}

export interface CoverageRequirement extends Entity<DomainId<"coverage">>, TimeWindow {
  readonly label: string;
  readonly role: FlvRole;
  readonly requiredHeadcount: number;
  readonly routineResponsibility?: string;
  readonly scope: TenantScope;
}

export interface ScheduleRequest extends Entity<DomainId<"schedule-request">>, TimeWindow {
  readonly counterpartShiftId?: DomainId<"shift">;
  readonly counterpartUserId?: DomainId<"user">;
  readonly createdAt: Date;
  readonly kind: ScheduleRequestKind;
  readonly note?: string;
  readonly preferredPeriods?: readonly AvailabilityPeriod[];
  readonly reviewedAt?: Date;
  readonly reviewedByUserId?: DomainId<"user">;
  readonly requesterUserId: DomainId<"user">;
  readonly scope: TenantScope;
  readonly shiftId?: DomainId<"shift">;
  readonly status: RequestStatus;
}

export interface ScheduleNotification extends Entity<DomainId<"schedule-notification">> {
  readonly createdAt: Date;
  readonly message: string;
  readonly requestId?: DomainId<"schedule-request">;
  readonly scope: TenantScope;
  readonly shiftId?: DomainId<"shift">;
  readonly status: ScheduleNotificationStatus;
  readonly type: ScheduleNotificationType;
  readonly userId: DomainId<"user">;
}

export function createShift(input: {
  readonly breakMinutes: number;
  readonly createdByUserId?: string;
  readonly endsAt: Date;
  readonly id: string;
  readonly publishedAt?: Date;
  readonly role: FlvRole;
  readonly scope: TenantScope;
  readonly startsAt: Date;
  readonly status: ShiftStatus;
  readonly title: string;
  readonly userId: string;
}): Shift {
  const timeWindow = createTimeWindow(input.startsAt, input.endsAt);

  return {
    breakMinutes: assertNonNegativeInteger(input.breakMinutes, "breakMinutes"),
    ...(input.createdByUserId === undefined
      ? {}
      : {
          createdByUserId: createDomainId<"user">(
            assertNonEmptyString(input.createdByUserId, "createdByUserId"),
          ),
        }),
    endsAt: timeWindow.endsAt,
    id: createDomainId<"shift">(assertNonEmptyString(input.id, "id")),
    ...(input.publishedAt === undefined ? {} : { publishedAt: input.publishedAt }),
    role: input.role,
    scope: input.scope,
    startsAt: timeWindow.startsAt,
    status: input.status,
    title: assertNonEmptyString(input.title, "title"),
    userId: createDomainId<"user">(assertNonEmptyString(input.userId, "userId")),
  };
}

export function updateShift(
  shift: Shift,
  patch: Partial<Omit<Shift, "id">>,
): Shift {
  return createShift({
    breakMinutes: patch.breakMinutes ?? shift.breakMinutes,
    ...(patch.createdByUserId === undefined && shift.createdByUserId === undefined
      ? {}
      : { createdByUserId: patch.createdByUserId ?? shift.createdByUserId }),
    endsAt: patch.endsAt ?? shift.endsAt,
    id: shift.id,
    ...(patch.publishedAt === undefined && shift.publishedAt === undefined
      ? {}
      : { publishedAt: patch.publishedAt ?? shift.publishedAt }),
    role: patch.role ?? shift.role,
    scope: patch.scope ?? shift.scope,
    startsAt: patch.startsAt ?? shift.startsAt,
    status: patch.status ?? shift.status,
    title: patch.title ?? shift.title,
    userId: patch.userId ?? shift.userId,
  });
}

export function createCoverageRequirement(input: {
  readonly endsAt: Date;
  readonly id: string;
  readonly label: string;
  readonly role: FlvRole;
  readonly requiredHeadcount: number;
  readonly routineResponsibility?: string;
  readonly scope: TenantScope;
  readonly startsAt: Date;
}): CoverageRequirement {
  const timeWindow = createTimeWindow(input.startsAt, input.endsAt);

  return {
    endsAt: timeWindow.endsAt,
    id: createDomainId<"coverage">(assertNonEmptyString(input.id, "id")),
    label: assertNonEmptyString(input.label, "label"),
    role: input.role,
    requiredHeadcount: assertPositiveInteger(input.requiredHeadcount, "requiredHeadcount"),
    ...(input.routineResponsibility === undefined
      ? {}
      : { routineResponsibility: assertNonEmptyString(input.routineResponsibility, "routineResponsibility") }),
    scope: input.scope,
    startsAt: timeWindow.startsAt,
  };
}

export function createScheduleRequest(input: {
  readonly counterpartShiftId?: string;
  readonly counterpartUserId?: string;
  readonly createdAt: Date;
  readonly endsAt: Date;
  readonly id: string;
  readonly kind: ScheduleRequestKind;
  readonly note?: string;
  readonly preferredPeriods?: readonly AvailabilityPeriod[];
  readonly reviewedAt?: Date;
  readonly reviewedByUserId?: string;
  readonly requesterUserId: string;
  readonly scope: TenantScope;
  readonly shiftId?: string;
  readonly startsAt: Date;
  readonly status: RequestStatus;
}): ScheduleRequest {
  const timeWindow = createTimeWindow(input.startsAt, input.endsAt);
  const createdAt = assertValidDate(input.createdAt, "createdAt");
  const reviewedAt =
    input.reviewedAt === undefined ? undefined : assertValidDate(input.reviewedAt, "reviewedAt");
  const preferredPeriods = normalizeAvailabilityPeriods(input.preferredPeriods);

  if (input.kind === "swap") {
    assertNonEmptyString(input.shiftId ?? "", "shiftId");
    assertNonEmptyString(input.counterpartShiftId ?? "", "counterpartShiftId");
    assertNonEmptyString(input.counterpartUserId ?? "", "counterpartUserId");
  }

  if (input.kind === "time_off") {
    assertNonEmptyString(input.note ?? "", "note");
  }

  return {
    ...(input.counterpartShiftId === undefined
      ? {}
      : { counterpartShiftId: createDomainId<"shift">(input.counterpartShiftId) }),
    ...(input.counterpartUserId === undefined
      ? {}
      : { counterpartUserId: createDomainId<"user">(input.counterpartUserId) }),
    createdAt,
    endsAt: timeWindow.endsAt,
    id: createDomainId<"schedule-request">(assertNonEmptyString(input.id, "id")),
    kind: input.kind,
    ...(input.note === undefined ? {} : { note: assertNonEmptyString(input.note, "note") }),
    ...(preferredPeriods === undefined ? {} : { preferredPeriods }),
    ...(reviewedAt === undefined ? {} : { reviewedAt }),
    ...(input.reviewedByUserId === undefined
      ? {}
      : { reviewedByUserId: createDomainId<"user">(input.reviewedByUserId) }),
    requesterUserId: createDomainId<"user">(
      assertNonEmptyString(input.requesterUserId, "requesterUserId"),
    ),
    scope: input.scope,
    ...(input.shiftId === undefined ? {} : { shiftId: createDomainId<"shift">(input.shiftId) }),
    startsAt: timeWindow.startsAt,
    status: input.status,
  };
}

export function updateScheduleRequest(
  request: ScheduleRequest,
  patch: Partial<Omit<ScheduleRequest, "id">>,
): ScheduleRequest {
  return createScheduleRequest({
    ...(patch.counterpartShiftId === undefined && request.counterpartShiftId === undefined
      ? {}
      : { counterpartShiftId: patch.counterpartShiftId ?? request.counterpartShiftId }),
    ...(patch.counterpartUserId === undefined && request.counterpartUserId === undefined
      ? {}
      : { counterpartUserId: patch.counterpartUserId ?? request.counterpartUserId }),
    createdAt: patch.createdAt ?? request.createdAt,
    endsAt: patch.endsAt ?? request.endsAt,
    id: request.id,
    kind: patch.kind ?? request.kind,
    ...(patch.note === undefined && request.note === undefined
      ? {}
      : { note: patch.note ?? request.note }),
    ...(patch.preferredPeriods === undefined && request.preferredPeriods === undefined
      ? {}
      : { preferredPeriods: patch.preferredPeriods ?? request.preferredPeriods }),
    ...(patch.reviewedAt === undefined && request.reviewedAt === undefined
      ? {}
      : { reviewedAt: patch.reviewedAt ?? request.reviewedAt }),
    ...(patch.reviewedByUserId === undefined && request.reviewedByUserId === undefined
      ? {}
      : { reviewedByUserId: patch.reviewedByUserId ?? request.reviewedByUserId }),
    requesterUserId: patch.requesterUserId ?? request.requesterUserId,
    scope: patch.scope ?? request.scope,
    ...(patch.shiftId === undefined && request.shiftId === undefined
      ? {}
      : { shiftId: patch.shiftId ?? request.shiftId }),
    startsAt: patch.startsAt ?? request.startsAt,
    status: patch.status ?? request.status,
  });
}

export function createScheduleNotification(input: {
  readonly createdAt: Date;
  readonly id: string;
  readonly message: string;
  readonly requestId?: string;
  readonly scope: TenantScope;
  readonly shiftId?: string;
  readonly status: ScheduleNotificationStatus;
  readonly type: ScheduleNotificationType;
  readonly userId: string;
}): ScheduleNotification {
  return {
    createdAt: assertValidDate(input.createdAt, "createdAt"),
    id: createDomainId<"schedule-notification">(assertNonEmptyString(input.id, "id")),
    message: assertNonEmptyString(input.message, "message"),
    ...(input.requestId === undefined
      ? {}
      : { requestId: createDomainId<"schedule-request">(input.requestId) }),
    scope: input.scope,
    ...(input.shiftId === undefined ? {} : { shiftId: createDomainId<"shift">(input.shiftId) }),
    status: input.status,
    type: input.type,
    userId: createDomainId<"user">(assertNonEmptyString(input.userId, "userId")),
  };
}

function normalizeAvailabilityPeriods(
  periods: readonly AvailabilityPeriod[] | undefined,
): readonly AvailabilityPeriod[] | undefined {
  const compacted = compactOptional(periods);

  if (compacted === undefined || compacted.length === 0) {
    return undefined;
  }

  const unique = [...new Set(compacted)];

  return unique;
}
