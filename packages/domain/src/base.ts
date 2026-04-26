export class DomainValidationError extends Error {
  readonly field: string | undefined;

  constructor(message: string, field?: string) {
    super(message);
    this.name = "DomainValidationError";
    this.field = field;
  }
}

export interface TimeWindow {
  readonly startsAt: Date;
  readonly endsAt: Date;
}

export function assertNonEmptyString(value: string, field: string): string {
  if (value.trim().length === 0) {
    throw new DomainValidationError(`${field} cannot be empty.`, field);
  }

  return value;
}

export function assertPositiveInteger(value: number, field: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new DomainValidationError(`${field} must be a positive integer.`, field);
  }

  return value;
}

export function assertNonNegativeInteger(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new DomainValidationError(`${field} must be a non-negative integer.`, field);
  }

  return value;
}

export function assertFiniteNumber(value: number, field: string): number {
  if (!Number.isFinite(value)) {
    throw new DomainValidationError(`${field} must be a finite number.`, field);
  }

  return value;
}

export function assertValidDate(value: Date, field: string): Date {
  if (Number.isNaN(value.getTime())) {
    throw new DomainValidationError(`${field} must be a valid date.`, field);
  }

  return value;
}

export function createTimeWindow(startsAt: Date, endsAt: Date): TimeWindow {
  const validatedStartsAt = assertValidDate(startsAt, "startsAt");
  const validatedEndsAt = assertValidDate(endsAt, "endsAt");

  if (validatedEndsAt.getTime() <= validatedStartsAt.getTime()) {
    throw new DomainValidationError("endsAt must be after startsAt.", "endsAt");
  }

  return {
    endsAt: validatedEndsAt,
    startsAt: validatedStartsAt,
  };
}

export function timeWindowsOverlap(left: TimeWindow, right: TimeWindow): boolean {
  return left.startsAt.getTime() < right.endsAt.getTime() && right.startsAt.getTime() < left.endsAt.getTime();
}

export function compactOptional<TValue>(value: TValue | undefined): TValue | undefined {
  return value === undefined ? undefined : value;
}
