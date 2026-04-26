import { describe, expect, it } from "vitest";

import { createDomainId } from "../src/index.js";

describe("createDomainId", () => {
  it("brands non-empty identifiers", () => {
    expect(createDomainId<"store">("store-flv-001")).toBe("store-flv-001");
  });

  it("rejects empty identifiers", () => {
    expect(() => createDomainId(" ")).toThrow("Domain id cannot be empty.");
  });
});
