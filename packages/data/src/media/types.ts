import type {
  MediaAccessScopePayload,
  MediaModerationStatePayload,
  MediaTargetTypePayload,
  UploadContentTypePayload,
  UploadTargetContextPayload,
} from "@engaja/contracts";

export const mediaUploadStates = [
  "pending_upload",
  "uploaded",
  "finalized",
  "failed",
  "cleaned",
] as const;

export type MediaUploadState = (typeof mediaUploadStates)[number];

export interface MediaUploadIntentRecord {
  readonly accessScope: MediaAccessScopePayload;
  readonly cleanedAt?: Date | null;
  readonly createdAt: Date;
  readonly departmentId?: string | null;
  readonly expiresAt: Date;
  readonly finalizedAt?: Date | null;
  readonly id: string;
  readonly maxByteSize: number;
  readonly mediaObjectId?: string | null;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly organizationId: string;
  readonly ownerUserId: string;
  readonly requestedContentType: UploadContentTypePayload;
  readonly storageBucket?: string | null;
  readonly storageKey: string;
  readonly storageProvider: string;
  readonly storeId?: string | null;
  readonly targetContext: UploadTargetContextPayload;
  readonly targetType: MediaTargetTypePayload;
  readonly updatedAt: Date;
  readonly uploadedAt?: Date | null;
  readonly uploadedByteSize?: number | null;
  readonly uploadState: MediaUploadState;
}

export interface NewMediaUploadIntentRecord
  extends Omit<MediaUploadIntentRecord, "createdAt" | "updatedAt"> {
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

export interface MediaObjectRecord {
  readonly accessScope: MediaAccessScopePayload;
  readonly byteSize: number;
  readonly contentType: UploadContentTypePayload;
  readonly createdAt: Date;
  readonly departmentId?: string | null;
  readonly finalizedAt?: Date | null;
  readonly height?: number | null;
  readonly id: string;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly moderationState: MediaModerationStatePayload;
  readonly organizationId: string;
  readonly ownerUserId?: string | null;
  readonly sha256Hash: string;
  readonly storageBucket?: string | null;
  readonly storageKey: string;
  readonly storageProvider: string;
  readonly storeId?: string | null;
  readonly targetType: MediaTargetTypePayload;
  readonly updatedAt: Date;
  readonly width?: number | null;
}

export interface NewMediaObjectRecord
  extends Omit<MediaObjectRecord, "createdAt" | "updatedAt"> {
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

export interface MediaBinaryObject {
  readonly body: Uint8Array;
  readonly contentType: UploadContentTypePayload;
  readonly media: MediaObjectRecord;
}

export interface MediaCleanupSummary {
  readonly cleanedIntentCount: number;
  readonly deletedObjectCount: number;
}
