import { defineConfig } from "drizzle-kit";

const databaseUrl =
  process.env.NEON_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "postgresql://engaja:engaja@localhost:5432/engaja_dev";

export default defineConfig({
  dbCredentials: {
    url: databaseUrl,
  },
  dialect: "postgresql",
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  strict: true,
  verbose: true,
});
