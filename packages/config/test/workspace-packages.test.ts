import { describe, expect, it } from "vitest";

import { workspacePackageNames } from "../src/index.js";

describe("workspace package registry", () => {
  it("tracks the foundation package layout", () => {
    expect(workspacePackageNames).toContain("@engaja/mobile");
    expect(workspacePackageNames).toContain("@engaja/api");
    expect(workspacePackageNames).toContain("@engaja/domain");
  });
});
