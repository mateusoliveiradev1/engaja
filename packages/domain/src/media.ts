import {
  assertNonEmptyString,
  assertPositiveInteger,
  assertValidDate,
} from "./base.js";
import { type DomainId, type Entity, createDomainId } from "./ids.js";
import { type TenantScope, type VisibilityScope } from "./scope.js";

export const mediaModerationStates = [
  "pending",
  "approved",
  "rejected",
  "quarantined",
  "blocked",
] as const;

export type MediaModerationState = (typeof mediaModerationStates)[number];

export const mediaTargetTypes = [
  "feed_post",
  "mission",
  "evidence",
  "standard",
  "profile",
  "recognition",
] as const;

export type MediaTargetType = (typeof mediaTargetTypes)[number];

export const supportedMediaContentTypes = ["image/jpeg", "image/png", "image/webp"] as const;

export type SupportedMediaContentType = (typeof supportedMediaContentTypes)[number];

export interface MediaDimensions {
  readonly height: number;
  readonly width: number;
}

export interface MediaAsset extends Entity<DomainId<"media">> {
  readonly accessScope: VisibilityScope;
  readonly byteSize: number;
  readonly contentType: SupportedMediaContentType;
  readonly finalizedAt: Date;
  readonly moderationState: MediaModerationState;
  readonly ownerUserId?: DomainId<"user">;
  readonly scope: TenantScope;
  readonly storageKey: string;
  readonly targetType: MediaTargetType;
  readonly dimensions?: MediaDimensions;
  readonly sha256Hash: string;
}

export function createMediaDimensions(width: number, height: number): MediaDimensions {
  return {
    height: assertPositiveInteger(height, "height"),
    width: assertPositiveInteger(width, "width"),
  };
}

export function createMediaAsset(input: {
  readonly accessScope: VisibilityScope;
  readonly byteSize: number;
  readonly contentType: SupportedMediaContentType;
  readonly dimensions?: MediaDimensions;
  readonly finalizedAt: Date;
  readonly id: string;
  readonly moderationState: MediaModerationState;
  readonly ownerUserId?: string;
  readonly scope: TenantScope;
  readonly sha256Hash: string;
  readonly storageKey: string;
  readonly targetType: MediaTargetType;
}): MediaAsset {
  return {
    accessScope: input.accessScope,
    byteSize: assertPositiveInteger(input.byteSize, "byteSize"),
    contentType: input.contentType,
    ...(input.dimensions === undefined ? {} : { dimensions: input.dimensions }),
    finalizedAt: assertValidDate(input.finalizedAt, "finalizedAt"),
    id: createDomainId<"media">(assertNonEmptyString(input.id, "id")),
    moderationState: input.moderationState,
    ...(input.ownerUserId === undefined
      ? {}
      : { ownerUserId: createDomainId<"user">(assertNonEmptyString(input.ownerUserId, "ownerUserId")) }),
    scope: input.scope,
    sha256Hash: assertNonEmptyString(input.sha256Hash, "sha256Hash"),
    storageKey: assertNonEmptyString(input.storageKey, "storageKey"),
    targetType: input.targetType,
  };
}
