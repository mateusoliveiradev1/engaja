import type { UploadContentTypePayload } from "@engaja/contracts";

export interface ImageInspection {
  readonly contentType: UploadContentTypePayload;
  readonly hasLocationMetadata: boolean;
  readonly height: number;
  readonly width: number;
}

export function inspectImageUpload(body: Uint8Array): ImageInspection {
  const contentType = sniffImageContentType(body);

  if (contentType === undefined) {
    throw new Error("Unsupported image payload.");
  }

  const dimensions = readImageDimensions(body, contentType);

  return {
    contentType,
    hasLocationMetadata: containsLocationMetadata(body, contentType),
    height: dimensions.height,
    width: dimensions.width,
  };
}

export function sniffImageContentType(
  body: Uint8Array,
): UploadContentTypePayload | undefined {
  if (
    body.length >= 8 &&
    body[0] === 0x89 &&
    body[1] === 0x50 &&
    body[2] === 0x4e &&
    body[3] === 0x47 &&
    body[4] === 0x0d &&
    body[5] === 0x0a &&
    body[6] === 0x1a &&
    body[7] === 0x0a
  ) {
    return "image/png";
  }

  if (body.length >= 12 && readAscii(body, 0, 4) === "RIFF" && readAscii(body, 8, 4) === "WEBP") {
    return "image/webp";
  }

  if (body.length >= 3 && body[0] === 0xff && body[1] === 0xd8 && body[2] === 0xff) {
    return "image/jpeg";
  }

  return undefined;
}

function readImageDimensions(
  body: Uint8Array,
  contentType: UploadContentTypePayload,
): { readonly height: number; readonly width: number } {
  if (contentType === "image/png") {
    return readPngDimensions(body);
  }

  if (contentType === "image/webp") {
    return readWebpDimensions(body);
  }

  return readJpegDimensions(body);
}

function containsLocationMetadata(
  body: Uint8Array,
  contentType: UploadContentTypePayload,
): boolean {
  if (contentType === "image/jpeg") {
    return jpegContainsGpsExif(body);
  }

  if (contentType === "image/png") {
    return pngContainsExifChunk(body);
  }

  return webpContainsExifChunk(body);
}

function readPngDimensions(body: Uint8Array): { readonly height: number; readonly width: number } {
  if (body.length < 24 || readAscii(body, 12, 4) !== "IHDR") {
    throw new Error("Invalid PNG payload.");
  }

  return {
    height: readUInt32BE(body, 20),
    width: readUInt32BE(body, 16),
  };
}

function readJpegDimensions(body: Uint8Array): { readonly height: number; readonly width: number } {
  let offset = 2;

  while (offset + 8 <= body.length) {
    if (body[offset] !== 0xff) {
      throw new Error("Invalid JPEG marker.");
    }

    const marker = body[offset + 1] ?? -1;

    if (marker === 0xd9 || marker === 0xda) {
      break;
    }

    const segmentLength = readUInt16BE(body, offset + 2);

    if (segmentLength < 2 || offset + 2 + segmentLength > body.length) {
      throw new Error("Invalid JPEG segment length.");
    }

    if (isSofMarker(marker)) {
      return {
        height: readUInt16BE(body, offset + 5),
        width: readUInt16BE(body, offset + 7),
      };
    }

    offset += segmentLength + 2;
  }

  throw new Error("JPEG dimensions not found.");
}

function readWebpDimensions(body: Uint8Array): { readonly height: number; readonly width: number } {
  for (const chunk of iterateWebpChunks(body)) {
    if (chunk.type === "VP8X") {
      return {
        height: readUInt24LE(body, chunk.dataOffset + 7) + 1,
        width: readUInt24LE(body, chunk.dataOffset + 4) + 1,
      };
    }

    if (chunk.type === "VP8L") {
      const bits =
        body[chunk.dataOffset + 1]! |
        (body[chunk.dataOffset + 2]! << 8) |
        (body[chunk.dataOffset + 3]! << 16) |
        (body[chunk.dataOffset + 4]! << 24);

      return {
        height: ((bits >> 14) & 0x3fff) + 1,
        width: (bits & 0x3fff) + 1,
      };
    }

    if (chunk.type === "VP8 ") {
      return {
        height: readUInt16LE(body, chunk.dataOffset + 8) & 0x3fff,
        width: readUInt16LE(body, chunk.dataOffset + 6) & 0x3fff,
      };
    }
  }

  throw new Error("WEBP dimensions not found.");
}

function jpegContainsGpsExif(body: Uint8Array): boolean {
  let offset = 2;

  while (offset + 4 <= body.length) {
    if (body[offset] !== 0xff) {
      return false;
    }

    const marker = body[offset + 1];

    if (marker === 0xd9 || marker === 0xda) {
      return false;
    }

    const segmentLength = readUInt16BE(body, offset + 2);
    const segmentStart = offset + 4;
    const segmentEnd = offset + 2 + segmentLength;

    if (segmentLength < 2 || segmentEnd > body.length) {
      return false;
    }

    if (marker === 0xe1 && readAscii(body, segmentStart, 4) === "Exif") {
      const tiffOffset = segmentStart + 6;

      if (tiffOffset + 8 > segmentEnd) {
        return false;
      }

      const littleEndian = readAscii(body, tiffOffset, 2) === "II";
      const firstIfdOffset = readUInt32(body, tiffOffset + 4, littleEndian);
      const ifdOffset = tiffOffset + firstIfdOffset;

      if (ifdOffset + 2 > segmentEnd) {
        return false;
      }

      const entryCount = readUInt16(body, ifdOffset, littleEndian);

      for (let entryIndex = 0; entryIndex < entryCount; entryIndex += 1) {
        const entryOffset = ifdOffset + 2 + entryIndex * 12;

        if (entryOffset + 12 > segmentEnd) {
          break;
        }

        const tag = readUInt16(body, entryOffset, littleEndian);
        const valueOffset = readUInt32(body, entryOffset + 8, littleEndian);

        if (tag === 0x8825 && valueOffset !== 0) {
          return true;
        }
      }
    }

    offset = segmentEnd;
  }

  return false;
}

function pngContainsExifChunk(body: Uint8Array): boolean {
  let offset = 8;

  while (offset + 8 <= body.length) {
    const chunkLength = readUInt32BE(body, offset);
    const chunkType = readAscii(body, offset + 4, 4);

    if (chunkType === "eXIf") {
      return true;
    }

    offset += chunkLength + 12;
  }

  return false;
}

function webpContainsExifChunk(body: Uint8Array): boolean {
  for (const chunk of iterateWebpChunks(body)) {
    if (chunk.type === "EXIF") {
      return true;
    }
  }

  return false;
}

function *iterateWebpChunks(body: Uint8Array): Generator<{
  readonly dataOffset: number;
  readonly size: number;
  readonly type: string;
}> {
  let offset = 12;

  while (offset + 8 <= body.length) {
    const type = readAscii(body, offset, 4);
    const size = readUInt32LE(body, offset + 4);
    const dataOffset = offset + 8;

    if (dataOffset + size > body.length) {
      break;
    }

    yield { dataOffset, size, type };
    offset = dataOffset + size + (size % 2);
  }
}

function isSofMarker(marker: number): boolean {
  return (
    marker === 0xc0 ||
    marker === 0xc1 ||
    marker === 0xc2 ||
    marker === 0xc3 ||
    marker === 0xc5 ||
    marker === 0xc6 ||
    marker === 0xc7 ||
    marker === 0xc9 ||
    marker === 0xca ||
    marker === 0xcb ||
    marker === 0xcd ||
    marker === 0xce ||
    marker === 0xcf
  );
}

function readAscii(body: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...body.slice(offset, offset + length));
}

function readUInt16(body: Uint8Array, offset: number, littleEndian: boolean): number {
  return littleEndian ? readUInt16LE(body, offset) : readUInt16BE(body, offset);
}

function readUInt16BE(body: Uint8Array, offset: number): number {
  return (body[offset]! << 8) | body[offset + 1]!;
}

function readUInt16LE(body: Uint8Array, offset: number): number {
  return body[offset]! | (body[offset + 1]! << 8);
}

function readUInt24LE(body: Uint8Array, offset: number): number {
  return body[offset]! | (body[offset + 1]! << 8) | (body[offset + 2]! << 16);
}

function readUInt32(body: Uint8Array, offset: number, littleEndian: boolean): number {
  return littleEndian ? readUInt32LE(body, offset) : readUInt32BE(body, offset);
}

function readUInt32BE(body: Uint8Array, offset: number): number {
  return (
    body[offset]! * 0x1000000 +
    (body[offset + 1]! << 16) +
    (body[offset + 2]! << 8) +
    body[offset + 3]!
  );
}

function readUInt32LE(body: Uint8Array, offset: number): number {
  return (
    body[offset]! +
    body[offset + 1]! * 0x100 +
    body[offset + 2]! * 0x10000 +
    body[offset + 3]! * 0x1000000
  );
}
