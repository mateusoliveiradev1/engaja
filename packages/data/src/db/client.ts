import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { drizzle as drizzlePostgres, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { z } from "zod";

import { flvSchema } from "./schema.js";

export type DatabaseProvider = "local-postgres" | "neon";

export interface DatabaseConfig {
  readonly provider: DatabaseProvider;
  readonly url: string;
}

export type EngajaDatabase =
  | NeonHttpDatabase<typeof flvSchema>
  | PostgresJsDatabase<typeof flvSchema>;

export interface DatabaseConnection {
  readonly db: EngajaDatabase;
  readonly provider: DatabaseProvider;
  close(): Promise<void>;
}

const databaseProviderSchema = z.enum(["local-postgres", "neon"]);

export function loadDatabaseConfig(
  env: NodeJS.ProcessEnv = process.env,
): DatabaseConfig {
  const provider = databaseProviderSchema.parse(env.DATABASE_PROVIDER ?? "local-postgres");
  const url = provider === "neon" ? env.NEON_DATABASE_URL : env.DATABASE_URL;

  if (url === undefined || url.trim().length === 0) {
    throw new Error(
      provider === "neon"
        ? "NEON_DATABASE_URL is required when DATABASE_PROVIDER=neon."
        : "DATABASE_URL is required when DATABASE_PROVIDER=local-postgres.",
    );
  }

  return {
    provider,
    url,
  };
}

export function createDatabaseConnection(config = loadDatabaseConfig()): DatabaseConnection {
  if (config.provider === "neon") {
    const sql = neon(config.url);
    const db = drizzleNeon(sql, { schema: flvSchema });

    return {
      db,
      provider: config.provider,
      close: () => Promise.resolve(),
    };
  }

  const sql = postgres(config.url, {
    max: 5,
    prepare: false,
  });
  const db = drizzlePostgres(sql, { schema: flvSchema });

  return {
    db,
    provider: config.provider,
    close: () => sql.end({ timeout: 5 }),
  };
}
