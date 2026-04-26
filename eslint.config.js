import js from "@eslint/js";
import boundaries from "eslint-plugin-boundaries";
import importX from "eslint-plugin-import-x";
import unusedImports from "eslint-plugin-unused-imports";
import tseslint from "typescript-eslint";

const typeCheckedTypeScriptConfigs = tseslint.configs.recommendedTypeChecked.map((config) => ({
  ...config,
  files: ["**/*.ts"],
}));

export default [
  {
    ignores: [
      "**/.expo/**",
      "**/.expo*/**",
      "**/.local/**",
      "**/.turbo/**",
      "**/coverage/**",
      "**/dist/**",
      "**/node_modules/**",
      "**/vitest.config.ts",
    ],
  },
  js.configs.recommended,
  ...typeCheckedTypeScriptConfigs,
  {
    files: ["**/*.{js,cjs,mjs}"],
    languageOptions: {
      globals: {
        console: "readonly",
        __dirname: "readonly",
        module: "readonly",
        process: "readonly",
        require: "readonly",
      },
    },
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      boundaries,
      "import-x": importX,
      "unused-imports": unusedImports,
    },
    settings: {
      "boundaries/elements": [
        { type: "app", pattern: "apps/*/src/**/*" },
        { type: "application", pattern: "packages/application/src/**/*" },
        { type: "config", pattern: "packages/config/src/**/*" },
        { type: "contracts", pattern: "packages/contracts/src/**/*" },
        { type: "data", pattern: "packages/data/src/**/*" },
        { type: "domain", pattern: "packages/domain/src/**/*" },
        { type: "security", pattern: "packages/security/src/**/*" },
        { type: "ui", pattern: "packages/ui/src/**/*" }
      ],
      "import-x/resolver": {
        node: {
          extensions: [".js", ".mjs", ".ts"],
        },
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { fixStyle: "inline-type-imports", prefer: "type-imports" }
      ],
      "@typescript-eslint/no-unused-vars": "off",
      "boundaries/element-types": [
        "error",
        {
          default: "allow",
          rules: [
            { from: ["domain"], disallow: ["app", "application", "data", "security", "ui"] },
            { from: ["contracts"], disallow: ["app", "application", "data", "domain", "security", "ui"] },
            { from: ["application"], disallow: ["app", "data", "ui"] },
            { from: ["ui"], disallow: ["app", "application", "data"] }
          ]
        }
      ],
      "import-x/no-cycle": ["error", { maxDepth: 10 }],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@engaja/*/src/*", "packages/*/src/*", "../../packages/*/src/*"],
              message: "Import public package exports instead of private source paths."
            }
          ]
        }
      ],
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "error",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          vars: "all",
          varsIgnorePattern: "^_"
        }
      ]
    },
  },
  {
    files: ["packages/domain/src/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@neondatabase/*",
                "drizzle-orm",
                "expo",
                "fastify",
                "hono",
                "react",
                "react-native"
              ],
              message: "Domain code must stay framework and provider free."
            }
          ]
        }
      ]
    },
  },
  {
    files: ["**/test/**/*.ts"],
    rules: {
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/require-await": "off",
    },
  },
];
