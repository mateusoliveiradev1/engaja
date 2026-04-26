import { createHash, randomUUID } from "node:crypto";

import type {
  MediaAccessScopePayload,
  MediaObjectPayload,
  MediaTargetTypePayload,
  UploadIntentRequestPayload,
  UploadTargetContextPayload,
} from "@engaja/contracts";
import type { PermissionAction, ScopedResource, SecurityActor } from "@engaja/security";

import { assertAuthorized, evaluatePermission } from "@engaja/security";

import { inspectImageUpload } from "./inspection.js";
import type { MediaRepository } from "./repository.js";
import type { ObjectStorageAdapter } from "./storage.js";
import type {
  MediaBinaryObject,
  MediaCleanupSummary,
  MediaObjectRecord,
  MediaUploadIntentRecord,
} from "./types.js";

const MAX_UPLOAD_BYTES = 10_000_000;
const UPLOAD_INTENT_TTL_MS = 15 * 60_000;

const uploadPolicies = {
  "feed-post": {
    accessScope: "private",
    requiredAction: "feed.create",
    targetType: "feed_post",
  },
  "issue-evidence": {
    accessScope: "private",
    requiredAction: "operations.issue.create",
    targetType: "evidence",
  },
  "routine-evidence": {
    accessScope: "private",
    requiredAction: "operations.routine.complete",
    targetType: "evidence",
  },
} as const satisfies Readonly<
  Record<
    UploadTargetContextPayload,
    {
      readonly accessScope: MediaAccessScopePayload;
      readonly requiredAction: PermissionAction;
      readonly targetType: Extract<MediaTargetTypePayload, "evidence" | "feed_post">;
    }
  >
>;

export interface MediaService {
  createUploadIntent(actor: SecurityActor, request: UploadIntentRequestPayload): Promise<MediaUploadIntentRecord>;
  finalizeUpload(intentId: string, actor: SecurityActor): Promise<MediaObjectRecord>;
  readMediaObject(mediaObjectId: string, actor: SecurityActor): Promise<MediaBinaryObject>;
  runCleanup(now?: Date): Promise<MediaCleanupSummary>;
  storeUploadContent(
    intentId: string,
    actor: SecurityActor,
    input: {
      readonly body: Uint8Array;
      readonly contentType?: string;
    },
  ): Promise<void>;
}

export interface MediaServiceOptions {
  readonly now?: () => Date;
  readonly repository: MediaRepository;
  readonly storage: ObjectStorageAdapter;
}

export class MediaError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.name = "MediaError";
    this.status = status;
  }
}

export function createMediaService(options: MediaServiceOptions): MediaService {
  const now = options.now ?? (() => new Date());

  return {
    async createUploadIntent(actor, request) {
      const policy = uploadPolicies[request.targetContext];
      assertAuthorized(actor, {
        action: policy.requiredAction,
        resource: actor.scope,
      });

      if (request.contentLength > MAX_UPLOAD_BYTES) {
        throw new MediaError("payload_too_large", "Arquivo acima do limite permitido.", 413);
      }

      const createdAt = now();
      const intentId = randomUUID();
      const storageKey = buildStorageKey(actor, intentId, request.contentType, createdAt);

      return options.repository.createUploadIntent({
        accessScope: policy.accessScope,
        createdAt,
        ...(actor.scope.departmentId === undefined ? {} : { departmentId: actor.scope.departmentId }),
        expiresAt: new Date(createdAt.getTime() + UPLOAD_INTENT_TTL_MS),
        id: intentId,
        maxByteSize: request.contentLength,
        metadata: {
          locationMetadataPolicy: "blocked-if-present",
        },
        organizationId: actor.scope.organizationId,
        ownerUserId: actor.userId,
        requestedContentType: request.contentType,
        storageKey,
        storageProvider: options.storage.provider,
        ...(actor.scope.storeId === undefined ? {} : { storeId: actor.scope.storeId }),
        targetContext: request.targetContext,
        targetType: policy.targetType,
        updatedAt: createdAt,
        uploadState: "pending_upload",
      });
    },
    async finalizeUpload(intentId, actor) {
      const intent = await requireOwnedIntent(options.repository, intentId, actor, now());

      if (intent.mediaObjectId !== undefined && intent.mediaObjectId !== null) {
        throw new MediaError("duplicate_finalization", "Upload ja finalizado.", 409);
      }

      if (intent.uploadState !== "uploaded") {
        throw new MediaError(
          "upload_not_ready",
          "O arquivo precisa ser enviado antes da finalizacao.",
          409,
        );
      }

      const storedObject = await options.storage.readObject(intent.storageKey);

      if (storedObject === undefined) {
        await options.repository.updateUploadIntent(intent.id, {
          metadata: withMetadata(intent.metadata, {
            lastFailureReason: "missing_binary_before_finalization",
          }),
          uploadState: "failed",
        });

        throw new MediaError("upload_missing", "Arquivo nao encontrado para finalizacao.", 409);
      }

      const inspection = inspectImageUpload(storedObject.body);

      if (inspection.contentType !== intent.requestedContentType) {
        await failIntent(options.repository, intent, "content_type_mismatch");
        await options.storage.deleteObject(intent.storageKey);
        throw new MediaError("invalid_file_type", "Tipo de arquivo invalido.", 400);
      }

      if (inspection.hasLocationMetadata) {
        await failIntent(options.repository, intent, "location_metadata_detected");
        await options.storage.deleteObject(intent.storageKey);
        throw new MediaError(
          "location_metadata_not_allowed",
          "A imagem contem metadados de localizacao e foi bloqueada.",
          400,
        );
      }

      const finalizedAt = now();
      const mediaObjectId = randomUUID();
      const sha256Hash = createHash("sha256").update(storedObject.body).digest("hex");
      const mediaObject = await options.repository.createMediaObject({
        accessScope: intent.accessScope,
        byteSize: storedObject.body.byteLength,
        contentType: inspection.contentType,
        finalizedAt,
        height: inspection.height,
        id: mediaObjectId,
        metadata: withMetadata(intent.metadata, {
          locationMetadataPolicy: "blocked-if-present",
          locationMetadataPresent: false,
          targetContext: intent.targetContext,
          uploadIntentId: intent.id,
        }),
        moderationState: "quarantined",
        organizationId: intent.organizationId,
        ownerUserId: intent.ownerUserId,
        sha256Hash,
        storageKey: intent.storageKey,
        storageProvider: intent.storageProvider,
        targetType: intent.targetType,
        width: inspection.width,
        ...(intent.departmentId === undefined || intent.departmentId === null
          ? {}
          : { departmentId: intent.departmentId }),
        ...(intent.storageBucket === undefined || intent.storageBucket === null
          ? {}
          : { storageBucket: intent.storageBucket }),
        ...(intent.storeId === undefined || intent.storeId === null ? {} : { storeId: intent.storeId }),
      });

      await options.repository.updateUploadIntent(intent.id, {
        finalizedAt,
        mediaObjectId: mediaObject.id,
        metadata: withMetadata(intent.metadata, {
          finalizedByteSize: storedObject.body.byteLength,
          finalizedSha256Hash: sha256Hash,
          locationMetadataPresent: false,
        }),
        uploadState: "finalized",
      });

      return mediaObject;
    },
    async readMediaObject(mediaObjectId, actor) {
      const media = await options.repository.findMediaObjectById(mediaObjectId);

      if (media === undefined) {
        throw new MediaError("not_found_or_forbidden", "Recurso nao encontrado ou sem permissao.", 404);
      }

      assertCanReadMediaObject(actor, media);

      const storedObject = await options.storage.readObject(media.storageKey);

      if (storedObject === undefined) {
        throw new MediaError("media_not_found", "Arquivo privado nao encontrado.", 404);
      }

      return {
        body: storedObject.body,
        contentType: media.contentType,
        media,
      };
    },
    async runCleanup(cleanupNow = now()) {
      const cleanupCandidates = await options.repository.listCleanupCandidates(cleanupNow);
      let cleanedIntentCount = 0;
      let deletedObjectCount = 0;

      for (const intent of cleanupCandidates) {
        const storedObject = await options.storage.readObject(intent.storageKey);

        if (storedObject !== undefined) {
          await options.storage.deleteObject(intent.storageKey);
          deletedObjectCount += 1;
        }

        await options.repository.updateUploadIntent(intent.id, {
          cleanedAt: cleanupNow,
          metadata: withMetadata(intent.metadata, {
            cleanupReason: "expired_upload_or_failed_finalization",
          }),
          uploadState: "cleaned",
        });
        cleanedIntentCount += 1;
      }

      return {
        cleanedIntentCount,
        deletedObjectCount,
      };
    },
    async storeUploadContent(intentId, actor, input) {
      const intent = await requireOwnedIntent(options.repository, intentId, actor, now());

      if (intent.uploadState !== "pending_upload") {
        throw new MediaError("upload_already_processed", "Upload ja processado para este intent.", 409);
      }

      if (input.body.byteLength > intent.maxByteSize) {
        throw new MediaError("payload_too_large", "Arquivo acima do limite permitido.", 413);
      }

      const inspection = inspectImageUpload(input.body);

      if (inspection.contentType !== intent.requestedContentType) {
        throw new MediaError("invalid_file_type", "Tipo de arquivo invalido.", 400);
      }

      if (
        input.contentType !== undefined &&
        input.contentType.length > 0 &&
        input.contentType !== inspection.contentType
      ) {
        throw new MediaError("invalid_file_type", "Tipo de arquivo invalido.", 400);
      }

      await options.storage.writeObject({
        body: input.body,
        contentType: inspection.contentType,
        storageKey: intent.storageKey,
      });

      await options.repository.updateUploadIntent(intent.id, {
        metadata: withMetadata(intent.metadata, {
          detectedContentType: inspection.contentType,
          detectedHeight: inspection.height,
          detectedWidth: inspection.width,
          locationMetadataPresent: inspection.hasLocationMetadata,
        }),
        uploadedAt: now(),
        uploadedByteSize: input.body.byteLength,
        uploadState: "uploaded",
      });
    },
  };
}

export function toMediaObjectPayload(
  media: MediaObjectRecord,
  readUrl: string,
): MediaObjectPayload {
  return {
    accessScope: media.accessScope,
    byteSize: media.byteSize,
    contentType: media.contentType,
    finalizedAt: (media.finalizedAt ?? media.createdAt).toISOString(),
    id: media.id,
    moderationState: media.moderationState,
    ownerUserId: media.ownerUserId ?? "unknown",
    readUrl,
    sha256Hash: media.sha256Hash,
    storageKey: media.storageKey,
    targetType: media.targetType,
    ...(media.height === undefined || media.height === null ? {} : { height: media.height }),
    ...(media.width === undefined || media.width === null ? {} : { width: media.width }),
  };
}

function assertCanReadMediaObject(actor: SecurityActor, media: MediaObjectRecord): void {
  if (
    media.accessScope === "private" &&
    actor.role === "colaborador" &&
    media.ownerUserId !== undefined &&
    media.ownerUserId !== null &&
    media.ownerUserId !== actor.userId
  ) {
    throw new MediaError("not_found_or_forbidden", "Recurso nao encontrado ou sem permissao.", 404);
  }

  const resource: ScopedResource = {
    organizationId: media.organizationId,
    ...(media.departmentId === undefined || media.departmentId === null
      ? {}
      : { departmentId: media.departmentId }),
    ...(media.ownerUserId === undefined || media.ownerUserId === null
      ? {}
      : { ownerUserId: media.ownerUserId }),
    ...(media.storeId === undefined || media.storeId === null ? {} : { storeId: media.storeId }),
  };
  const decision = evaluatePermission(actor, {
    action: "media.read",
    resource,
  });

  if (!decision.allowed) {
    throw new MediaError(
      "not_found_or_forbidden",
      "Recurso nao encontrado ou sem permissao.",
      decision.safeStatusCode,
    );
  }
}

async function failIntent(
  repository: MediaRepository,
  intent: MediaUploadIntentRecord,
  reason: string,
): Promise<void> {
  await repository.updateUploadIntent(intent.id, {
    metadata: withMetadata(intent.metadata, {
      lastFailureReason: reason,
    }),
    uploadState: "failed",
  });
}

async function requireOwnedIntent(
  repository: MediaRepository,
  intentId: string,
  actor: SecurityActor,
  now: Date,
): Promise<MediaUploadIntentRecord> {
  const intent = await repository.findUploadIntentById(intentId);

  if (intent === undefined || intent.organizationId !== actor.scope.organizationId) {
    throw new MediaError("not_found_or_forbidden", "Recurso nao encontrado ou sem permissao.", 404);
  }

  if (intent.ownerUserId !== actor.userId) {
    throw new MediaError("not_found_or_forbidden", "Recurso nao encontrado ou sem permissao.", 404);
  }

  if (intent.expiresAt.getTime() < now.getTime()) {
    throw new MediaError("upload_intent_expired", "Intent de upload expirado.", 410);
  }

  return intent;
}

function buildStorageKey(
  actor: SecurityActor,
  intentId: string,
  contentType: UploadIntentRequestPayload["contentType"],
  createdAt: Date,
): string {
  const year = createdAt.getUTCFullYear().toString();
  const month = String(createdAt.getUTCMonth() + 1).padStart(2, "0");
  const day = String(createdAt.getUTCDate()).padStart(2, "0");
  const extension = extensionForContentType(contentType);

  return [
    "private",
    sanitizeSegment(actor.scope.organizationId),
    sanitizeSegment(actor.scope.storeId ?? "_"),
    sanitizeSegment(actor.scope.departmentId ?? "_"),
    year,
    month,
    day,
    `${intentId}.${extension}`,
  ].join("/");
}

function extensionForContentType(contentType: UploadIntentRequestPayload["contentType"]): string {
  if (contentType === "image/png") {
    return "png";
  }

  if (contentType === "image/webp") {
    return "webp";
  }

  return "jpg";
}

function sanitizeSegment(value: string): string {
  return value.replaceAll(/[^a-zA-Z0-9_-]/g, "_");
}

function withMetadata(
  current: Readonly<Record<string, unknown>>,
  next: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> {
  return {
    ...current,
    ...next,
  };
}
