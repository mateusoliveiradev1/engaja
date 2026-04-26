import { and, eq, inArray, lt } from "drizzle-orm";

import { uploadContentTypeSchema } from "@engaja/contracts";

import type { EngajaDatabase } from "../db/client.js";
import { mediaObjects, mediaUploadIntents } from "../db/schema.js";

import type {
  MediaObjectRecord,
  MediaUploadIntentRecord,
  NewMediaObjectRecord,
  NewMediaUploadIntentRecord,
} from "./types.js";

export interface MediaRepository {
  createMediaObject(input: NewMediaObjectRecord): Promise<MediaObjectRecord>;
  createUploadIntent(input: NewMediaUploadIntentRecord): Promise<MediaUploadIntentRecord>;
  findMediaObjectById(id: string): Promise<MediaObjectRecord | undefined>;
  findUploadIntentById(id: string): Promise<MediaUploadIntentRecord | undefined>;
  listCleanupCandidates(before: Date, limit?: number): Promise<readonly MediaUploadIntentRecord[]>;
  updateUploadIntent(
    id: string,
    patch: Partial<Omit<MediaUploadIntentRecord, "createdAt" | "id">>,
  ): Promise<MediaUploadIntentRecord | undefined>;
}

export function createDrizzleMediaRepository(db: EngajaDatabase): MediaRepository {
  return {
    async createMediaObject(input) {
      const [record] = await db
        .insert(mediaObjects)
        .values({
          accessScope: input.accessScope,
          byteSize: input.byteSize,
          contentType: input.contentType,
          departmentId: normalizeNullable(input.departmentId),
          finalizedAt: normalizeNullable(input.finalizedAt),
          height: normalizeNullable(input.height),
          id: input.id,
          metadata: { ...input.metadata },
          moderationState: input.moderationState,
          organizationId: input.organizationId,
          ownerUserId: normalizeNullable(input.ownerUserId),
          sha256Hash: input.sha256Hash,
          storageBucket: normalizeNullable(input.storageBucket),
          storageKey: input.storageKey,
          storageProvider: input.storageProvider,
          storeId: normalizeNullable(input.storeId),
          targetType: input.targetType,
          width: normalizeNullable(input.width),
          ...(input.createdAt === undefined ? {} : { createdAt: input.createdAt }),
          ...(input.updatedAt === undefined ? {} : { updatedAt: input.updatedAt }),
        })
        .returning();

      return toMediaObjectRecord(assertReturnedRecord(record, "media object"));
    },
    async createUploadIntent(input) {
      const [record] = await db
        .insert(mediaUploadIntents)
        .values({
          accessScope: input.accessScope,
          cleanedAt: normalizeNullable(input.cleanedAt),
          departmentId: normalizeNullable(input.departmentId),
          expiresAt: input.expiresAt,
          finalizedAt: normalizeNullable(input.finalizedAt),
          id: input.id,
          maxByteSize: input.maxByteSize,
          mediaObjectId: normalizeNullable(input.mediaObjectId),
          metadata: { ...input.metadata },
          organizationId: input.organizationId,
          ownerUserId: input.ownerUserId,
          requestedContentType: input.requestedContentType,
          storageBucket: normalizeNullable(input.storageBucket),
          storageKey: input.storageKey,
          storageProvider: input.storageProvider,
          storeId: normalizeNullable(input.storeId),
          targetContext: input.targetContext,
          targetType: input.targetType,
          uploadedAt: normalizeNullable(input.uploadedAt),
          uploadedByteSize: normalizeNullable(input.uploadedByteSize),
          uploadState: input.uploadState,
          ...(input.createdAt === undefined ? {} : { createdAt: input.createdAt }),
          ...(input.updatedAt === undefined ? {} : { updatedAt: input.updatedAt }),
        })
        .returning();

      return toMediaUploadIntentRecord(assertReturnedRecord(record, "media upload intent"));
    },
    async findMediaObjectById(id) {
      const [record] = await db.select().from(mediaObjects).where(eq(mediaObjects.id, id));

      return record === undefined ? undefined : toMediaObjectRecord(record);
    },
    async findUploadIntentById(id) {
      const [record] = await db.select().from(mediaUploadIntents).where(eq(mediaUploadIntents.id, id));

      return record === undefined ? undefined : toMediaUploadIntentRecord(record);
    },
    async listCleanupCandidates(before, limit = 100) {
      const records = await db
        .select()
        .from(mediaUploadIntents)
        .where(
          and(
            lt(mediaUploadIntents.expiresAt, before),
            inArray(mediaUploadIntents.uploadState, ["pending_upload", "uploaded", "failed"]),
          ),
        )
        .limit(limit);

      return records.map(toMediaUploadIntentRecord);
    },
    async updateUploadIntent(id, patch) {
      const [record] = await db
        .update(mediaUploadIntents)
        .set(sanitizePatch(patch))
        .where(eq(mediaUploadIntents.id, id))
        .returning();

      return record === undefined ? undefined : toMediaUploadIntentRecord(record);
    },
  };
}

export function createInMemoryMediaRepository(): MediaRepository {
  const mediaObjectsById = new Map<string, MediaObjectRecord>();
  const uploadIntentsById = new Map<string, MediaUploadIntentRecord>();

  return {
    createMediaObject(input) {
      const now = input.createdAt ?? new Date();
      const record: MediaObjectRecord = {
        ...input,
        createdAt: now,
        updatedAt: input.updatedAt ?? now,
      };
      mediaObjectsById.set(record.id, cloneMediaObject(record));

      return Promise.resolve(cloneMediaObject(record));
    },
    createUploadIntent(input) {
      const now = input.createdAt ?? new Date();
      const record: MediaUploadIntentRecord = {
        ...input,
        createdAt: now,
        updatedAt: input.updatedAt ?? now,
      };
      uploadIntentsById.set(record.id, cloneUploadIntent(record));

      return Promise.resolve(cloneUploadIntent(record));
    },
    findMediaObjectById(id) {
      const record = mediaObjectsById.get(id);

      return Promise.resolve(record === undefined ? undefined : cloneMediaObject(record));
    },
    findUploadIntentById(id) {
      const record = uploadIntentsById.get(id);

      return Promise.resolve(record === undefined ? undefined : cloneUploadIntent(record));
    },
    listCleanupCandidates(before, limit = 100) {
      return Promise.resolve(
        [...uploadIntentsById.values()]
          .filter(
            (record) =>
              record.expiresAt < before &&
              (record.uploadState === "pending_upload" ||
                record.uploadState === "uploaded" ||
                record.uploadState === "failed"),
          )
          .slice(0, limit)
          .map(cloneUploadIntent),
      );
    },
    updateUploadIntent(id, patch) {
      const current = uploadIntentsById.get(id);

      if (current === undefined) {
        return Promise.resolve(undefined);
      }

      const record: MediaUploadIntentRecord = {
        ...current,
        ...patch,
        metadata: patch.metadata === undefined ? current.metadata : { ...patch.metadata },
        updatedAt: patch.updatedAt ?? new Date(),
      };
      uploadIntentsById.set(id, cloneUploadIntent(record));

      return Promise.resolve(cloneUploadIntent(record));
    },
  };
}

function toMediaObjectRecord(record: typeof mediaObjects.$inferSelect): MediaObjectRecord {
  return {
    ...record,
    contentType: uploadContentTypeSchema.parse(record.contentType),
    metadata: { ...record.metadata },
  };
}

function toMediaUploadIntentRecord(
  record: typeof mediaUploadIntents.$inferSelect,
): MediaUploadIntentRecord {
  return {
    ...record,
    metadata: { ...record.metadata },
    requestedContentType: uploadContentTypeSchema.parse(record.requestedContentType),
  };
}

function sanitizePatch(
  patch: Partial<Omit<MediaUploadIntentRecord, "createdAt" | "id">>,
): Partial<typeof mediaUploadIntents.$inferInsert> {
  return Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined).map(([key, value]) => [
      key,
      key === "metadata" && value !== undefined ? { ...(value as Record<string, unknown>) } : value,
    ]),
  );
}

function cloneMediaObject(record: MediaObjectRecord): MediaObjectRecord {
  return {
    ...record,
    metadata: { ...record.metadata },
  };
}

function cloneUploadIntent(record: MediaUploadIntentRecord): MediaUploadIntentRecord {
  return {
    ...record,
    metadata: { ...record.metadata },
  };
}

function normalizeNullable<TValue>(value: TValue | null | undefined): TValue | null | undefined {
  return value === undefined ? undefined : value;
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
