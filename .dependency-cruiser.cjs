/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular-dependencies",
      severity: "error",
      comment: "Package and feature modules must stay acyclic.",
      from: {},
      to: {
        circular: true,
      },
    },
    {
      name: "domain-is-provider-free",
      severity: "error",
      comment: "The domain package cannot depend on UI, API, database or provider SDKs.",
      from: {
        path: "^packages/domain/src",
      },
      to: {
        path: "node_modules/(react|react-native|expo|hono|fastify|drizzle-orm|@neondatabase)",
      },
    },
    {
      name: "mobile-has-no-server-drivers",
      severity: "error",
      comment: "The mobile app must not bundle database or server-only SDKs.",
      from: {
        path: "^apps/mobile/src",
      },
      to: {
        path: "node_modules/(drizzle-orm|@neondatabase|pg|postgres|@aws-sdk)",
      },
    },
    {
      name: "no-private-workspace-source-imports",
      severity: "error",
      comment: "Workspace packages must consume public exports instead of private src paths.",
      from: {
        path: "^(apps|packages)/",
      },
      to: {
        path: "packages/.+/src/.+",
        pathNot: "^packages/[^/]+/src",
      },
    },
  ],
  options: {
    cache: false,
    doNotFollow: {
      path: "node_modules",
    },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      mainFields: ["types", "module", "main"],
    },
    exclude: {
      path: "(^|/)(dist|coverage|node_modules|\\.turbo|\\.expo)/",
    },
    tsConfig: {
      fileName: "tsconfig.json",
    },
  },
};
