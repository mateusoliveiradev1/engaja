import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";

import { z } from "zod";

import type { UploadContentTypePayload } from "@engaja/contracts";

export type ObjectStorageProvider = "local-filesystem" | "memory";

export interface StoredObject {
  readonly body: Uint8Array;
  readonly contentType?: UploadContentTypePayload;
}

export interface WriteObjectInput {
  readonly body: Uint8Array;
  readonly contentType?: UploadContentTypePayload;
  readonly storageKey: string;
}

export interface ObjectStorageAdapter {
  readonly bucket?: string;
  readonly provider: ObjectStorageProvider;
  deleteObject(storageKey: string): Promise<void>;
  readObject(storageKey: string): Promise<StoredObject | undefined>;
  writeObject(input: WriteObjectInput): Promise<void>;
}

export interface StorageConfig {
  readonly localDirectory: string;
  readonly provider: "local-filesystem";
}

const storageProviderSchema = z.literal("local-filesystem");

export function loadStorageConfig(env: NodeJS.ProcessEnv = process.env): StorageConfig {
  return {
    localDirectory: env.LOCAL_STORAGE_DIR ?? ".local/media",
    provider: storageProviderSchema.parse(env.STORAGE_PROVIDER ?? "local-filesystem"),
  };
}

export function createStorageAdapterFromEnvironment(
  env: NodeJS.ProcessEnv = process.env,
): ObjectStorageAdapter {
  const config = loadStorageConfig(env);

  return createLocalFilesystemStorageAdapter({
    rootDirectory: config.localDirectory,
  });
}

export function createLocalFilesystemStorageAdapter(options: {
  readonly bucketName?: string;
  readonly rootDirectory: string;
}): ObjectStorageAdapter {
  const rootDirectory = resolve(options.rootDirectory);

  return {
    ...(options.bucketName === undefined ? {} : { bucket: options.bucketName }),
    provider: "local-filesystem",
    async deleteObject(storageKey) {
      const filePath = resolveStoragePath(rootDirectory, storageKey);

      try {
        await rm(filePath);
      } catch (error) {
        if (!isMissingFileError(error)) {
          throw error;
        }
      }
    },
    async readObject(storageKey) {
      const filePath = resolveStoragePath(rootDirectory, storageKey);

      try {
        const body = await readFile(filePath);

        return { body };
      } catch (error) {
        if (isMissingFileError(error)) {
          return undefined;
        }

        throw error;
      }
    },
    async writeObject(input) {
      const filePath = resolveStoragePath(rootDirectory, input.storageKey);
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, input.body);
    },
  };
}

export function createInMemoryObjectStorageAdapter(): ObjectStorageAdapter {
  const objects = new Map<string, StoredObject>();

  return {
    provider: "memory",
    deleteObject(storageKey) {
      objects.delete(storageKey);

      return Promise.resolve();
    },
    readObject(storageKey) {
      const storedObject = objects.get(storageKey);

      return Promise.resolve(
        storedObject === undefined
          ? undefined
          : {
              body: storedObject.body.slice(),
              ...(storedObject.contentType === undefined
                ? {}
                : { contentType: storedObject.contentType }),
            },
      );
    },
    writeObject(input) {
      objects.set(input.storageKey, {
        body: input.body.slice(),
        ...(input.contentType === undefined ? {} : { contentType: input.contentType }),
      });

      return Promise.resolve();
    },
  };
}

function resolveStoragePath(rootDirectory: string, storageKey: string): string {
  const normalizedKey = storageKey.split("/").join(sep);
  const resolvedPath = resolve(rootDirectory, normalizedKey);

  if (resolvedPath !== rootDirectory && !resolvedPath.startsWith(`${rootDirectory}${sep}`)) {
    throw new Error("Storage key resolves outside the configured storage root.");
  }

  return resolvedPath;
}

function isMissingFileError(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}
