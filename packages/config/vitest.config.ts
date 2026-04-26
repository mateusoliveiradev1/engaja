import { mergeConfig } from "vitest/config";

import { baseVitestConfig } from "@engaja/config/vitest/base";

export default mergeConfig(baseVitestConfig, {
  test: {
    name: "@engaja/config",
  },
});

