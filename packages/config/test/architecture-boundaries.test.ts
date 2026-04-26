import { execSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const pnpmExecutable = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

describe("architecture boundaries", () => {
  it("blocks forbidden imports, cycles and private source imports", () => {
    expect(() =>
      execSync(
        `${pnpmExecutable} --dir "${repoRoot}" exec dependency-cruiser --config .dependency-cruiser.cjs apps packages`,
        {
          cwd: repoRoot,
          encoding: "utf8",
          stdio: "pipe",
          timeout: 120_000,
        },
      ),
    ).not.toThrow();
  }, 120_000);
});
