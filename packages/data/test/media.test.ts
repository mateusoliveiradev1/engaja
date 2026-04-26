import { Buffer } from "node:buffer";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { developmentActors } from "@engaja/security";

import {
  createStorageAdapterFromEnvironment,
  createInMemoryMediaRepository,
  createInMemoryObjectStorageAdapter,
  createMediaService,
  loadStorageConfig,
  MediaError,
} from "../src/index.js";

const transparentPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO1ePp4AAAAASUVORK5CYII=",
  "base64",
);

describe("media service", () => {
  it("creates, uploads, finalizes and serves private media objects", async () => {
    const mediaService = createMediaService({
      repository: createInMemoryMediaRepository(),
      storage: createInMemoryObjectStorageAdapter(),
    });

    const intent = await mediaService.createUploadIntent(developmentActors.colaborador, {
      contentLength: transparentPng.byteLength,
      contentType: "image/png",
      targetContext: "feed-post",
    });

    await mediaService.storeUploadContent(intent.id, developmentActors.colaborador, {
      body: transparentPng,
      contentType: "image/png",
    });

    const mediaObject = await mediaService.finalizeUpload(intent.id, developmentActors.colaborador);
    const storedObject = await mediaService.readMediaObject(mediaObject.id, developmentActors.colaborador);

    expect(mediaObject).toMatchObject({
      accessScope: "private",
      contentType: "image/png",
      height: 1,
      moderationState: "quarantined",
      targetType: "feed_post",
      width: 1,
    });
    expect(Buffer.from(storedObject.body).equals(transparentPng)).toBe(true);
  });

  it("rejects finalization when the image includes EXIF metadata chunks", async () => {
    const mediaService = createMediaService({
      repository: createInMemoryMediaRepository(),
      storage: createInMemoryObjectStorageAdapter(),
    });
    const pngWithExifChunk = appendExifChunk(transparentPng);
    const intent = await mediaService.createUploadIntent(developmentActors.colaborador, {
      contentLength: pngWithExifChunk.byteLength,
      contentType: "image/png",
      targetContext: "feed-post",
    });

    await mediaService.storeUploadContent(intent.id, developmentActors.colaborador, {
      body: pngWithExifChunk,
      contentType: "image/png",
    });

    await expect(
      mediaService.finalizeUpload(intent.id, developmentActors.colaborador),
    ).rejects.toMatchObject({
      code: "location_metadata_not_allowed",
      status: 400,
    });
  });

  it("cleans up expired uploaded intents and deletes orphaned binaries", async () => {
    let currentNow = new Date("2026-04-22T12:00:00.000Z");
    const mediaService = createMediaService({
      now: () => currentNow,
      repository: createInMemoryMediaRepository(),
      storage: createInMemoryObjectStorageAdapter(),
    });
    const intent = await mediaService.createUploadIntent(developmentActors.colaborador, {
      contentLength: transparentPng.byteLength,
      contentType: "image/png",
      targetContext: "feed-post",
    });

    await mediaService.storeUploadContent(intent.id, developmentActors.colaborador, {
      body: transparentPng,
      contentType: "image/png",
    });
    currentNow = new Date("2026-04-22T12:20:00.000Z");

    await expect(
      mediaService.finalizeUpload(intent.id, developmentActors.colaborador),
    ).rejects.toBeInstanceOf(MediaError);

    const cleanup = await mediaService.runCleanup();

    expect(cleanup).toEqual({
      cleanedIntentCount: 1,
      deletedObjectCount: 1,
    });
  });

  it("uses the local filesystem adapter as the default no-spend storage path", async () => {
    const storageRoot = await mkdtemp(join(tmpdir(), "engaja-media-"));

    try {
      expect(
        loadStorageConfig({
          LOCAL_STORAGE_DIR: storageRoot,
          STORAGE_PROVIDER: "local-filesystem",
        }),
      ).toEqual({
        localDirectory: storageRoot,
        provider: "local-filesystem",
      });

      const storage = createStorageAdapterFromEnvironment({
        LOCAL_STORAGE_DIR: storageRoot,
        STORAGE_PROVIDER: "local-filesystem",
      });

      await storage.writeObject({
        body: transparentPng,
        contentType: "image/png",
        storageKey: "private/org_demo/store_001/dept_flv/demo.png",
      });

      await expect(
        readFile(join(storageRoot, "private", "org_demo", "store_001", "dept_flv", "demo.png")),
      ).resolves.toBeDefined();
      await expect(
        storage.readObject("private/org_demo/store_001/dept_flv/demo.png"),
      ).resolves.toMatchObject({
        body: expect.any(Uint8Array),
      });
    } finally {
      await rm(storageRoot, { force: true, recursive: true });
    }
  });
});

function appendExifChunk(sourcePng: Uint8Array): Uint8Array {
  const exifData = Buffer.from("location=blocked", "utf8");
  const chunk = Buffer.alloc(8 + exifData.length + 4);

  chunk.writeUInt32BE(exifData.length, 0);
  chunk.write("eXIf", 4, "ascii");
  exifData.copy(chunk, 8);
  chunk.writeUInt32BE(0, 8 + exifData.length);

  return Buffer.concat([sourcePng.subarray(0, sourcePng.length - 12), chunk, sourcePng.subarray(sourcePng.length - 12)]);
}
