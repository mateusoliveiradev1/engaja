import { defineConfig } from "vitest/config";

export const baseVitestConfig = defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    passWithNoTests: true,
  },
});
