import { describe, expect, it } from "vitest";

import {
  apiContracts,
  apiHealthPayloadSchema,
  createApiEnvelope,
  parseApiEnvelope,
  uploadIntentRequestSchema,
} from "../src/index.js";

describe("createApiEnvelope", () => {
  it("wraps data with a request id", () => {
    expect(createApiEnvelope({ ok: true }, "req_123")).toEqual({
      data: { ok: true },
      requestId: "req_123",
    });
  });

  it("validates response envelopes with runtime schemas", () => {
    expect(
      parseApiEnvelope(apiHealthPayloadSchema, {
        data: {
          name: "@engaja/api",
          status: "ok",
          version: "0.2.0",
        },
        requestId: "req_health",
      }),
    ).toEqual({
      data: {
        name: "@engaja/api",
        status: "ok",
        version: "0.2.0",
      },
      requestId: "req_health",
    });
  });

  it("defines shared contracts for mobile API consumption", () => {
    expect(apiContracts["feed.list"].path).toBe("/feed/posts");
    expect(apiContracts["media.uploadIntent"].method).toBe("POST");
    expect(
      uploadIntentRequestSchema.parse({
        contentLength: 11_000_000,
        contentType: "image/jpeg",
        targetContext: "feed-post",
      }),
    ).toEqual({
      contentLength: 11_000_000,
      contentType: "image/jpeg",
      targetContext: "feed-post",
    });
  });
});
