import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import postgres from "postgres";
import { describe, expect, it } from "vitest";

import {
  assertDevelopmentSeedWithinBudget,
  criticalDatabaseQueryReviews,
  developmentSeedBudget,
  developmentSeedSummary,
  developmentSeedUsers,
  loadDatabaseConfig,
  rlsScopedTableNames,
} from "../src/index.js";

const migrationDirectory = fileURLToPath(new URL("../drizzle", import.meta.url));

describe("database configuration", () => {
  it("defaults to the no-spend local Postgres provider", () => {
    expect(
      loadDatabaseConfig({
        DATABASE_PROVIDER: "local-postgres",
        DATABASE_URL: "postgresql://engaja:engaja@localhost:5432/engaja_dev",
      }),
    ).toEqual({
      provider: "local-postgres",
      url: "postgresql://engaja:engaja@localhost:5432/engaja_dev",
    });
  });

  it("requires the Neon URL only when Neon is explicitly selected", () => {
    expect(() =>
      loadDatabaseConfig({
        DATABASE_PROVIDER: "neon",
      }),
    ).toThrow("NEON_DATABASE_URL is required");
  });
});

describe("database migrations", () => {
  it("creates the required FLV persistence tables, indexes and constraints", async () => {
    const migrationSql = await readAllMigrationSql();

    for (const tableName of [
      "organizations",
      "stores",
      "departments",
      "users",
      "auth_credentials",
      "auth_provider_accounts",
      "auth_sessions",
      "access_invites",
      "password_reset_tokens",
      "engagement_campaigns",
      "eligible_engagement_events",
      "reward_grants",
      "collaborator_archive_items",
      "memberships",
      "feed_posts",
      "media_objects",
      "media_upload_intents",
      "shifts",
      "coverage_rules",
      "checklists",
      "issues",
      "points_ledger",
      "recognition_events",
      "dashboard_metric_snapshots",
      "persistent_runtime_records",
      "analytics_events",
      "audit_logs",
    ]) {
      expect(migrationSql).toContain(`CREATE TABLE "${tableName}"`);
    }

    for (const indexName of [
      "engagement_campaigns_scope_status_idx",
      "eligible_engagement_events_campaign_idx",
      "reward_grants_campaign_idx",
      "collaborator_archive_items_user_idx",
      "feed_posts_pagination_idx",
      "shifts_schedule_lookup_idx",
      "dashboard_metric_filters_idx",
      "memberships_permission_lookup_idx",
      "media_upload_intents_state_idx",
      "auth_sessions_lookup_idx",
      "access_invites_lookup_idx",
      "access_invites_scope_status_idx",
      "password_reset_tokens_lookup_idx",
      "persistent_runtime_records_scope_idx",
      "audit_logs_action_idx",
      "audit_logs_query_idx",
    ]) {
      expect(migrationSql).toContain(indexName);
    }

    expect(migrationSql).toContain('CONSTRAINT "shifts_window_ck"');
    expect(migrationSql).toContain('CONSTRAINT "media_objects_byte_size_ck"');
    expect(migrationSql).toContain('CONSTRAINT "points_ledger_amount_nonzero_ck"');
    expect(migrationSql).toContain('CONSTRAINT "engagement_campaigns_window_ck"');
    expect(migrationSql).toContain('CONSTRAINT "eligible_engagement_events_score_nonnegative_ck"');
    expect(migrationSql).toContain('CONSTRAINT "reward_grants_position_positive_ck"');
    expect(migrationSql).toContain('CONSTRAINT "auth_sessions_window_ck"');
    expect(migrationSql).toContain('CONSTRAINT "access_invites_accepted_at_ck"');
    expect(migrationSql).toContain('CONSTRAINT "password_reset_tokens_window_ck"');
  });

  it("enables tenant RLS policies for scoped tables", async () => {
    const migrationSql = await readAllMigrationSql();

    expect(migrationSql).toContain('ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY');
    expect(migrationSql).toContain("current_setting('app.organization_id', true)");

    for (const tableName of rlsScopedTableNames) {
      expect(migrationSql).toContain(`'${tableName}'`);
    }
  });

  it("documents critical explain-plan review paths with matching indexes", async () => {
    const migrationSql = await readAllMigrationSql();

    expect(criticalDatabaseQueryReviews.map((review) => review.id)).toEqual([
      "feed.pagination",
      "schedule.lookup",
      "dashboard.filters",
      "permission.check",
    ]);

    for (const review of criticalDatabaseQueryReviews) {
      expect(review.budgetMs).toBeGreaterThan(0);
      expect(review.queryShape).toContain("organization");
      expect(review.reviewChecklist.length).toBeGreaterThanOrEqual(3);

      for (const indexName of review.requiredIndexes) {
        expect(migrationSql).toContain(indexName);
      }
    }
  });

  (process.env.DATABASE_TEST_URL === undefined ? it.skip : it)(
    "applies migrations in a disposable schema when DATABASE_TEST_URL is configured",
    async () => {
      const databaseTestUrl = process.env.DATABASE_TEST_URL;

      if (databaseTestUrl === undefined) {
        return;
      }

      const client = postgres(databaseTestUrl, { max: 1, prepare: false });
      const schemaName = `engaja_migration_${Date.now().toString()}`;

      try {
        await client.unsafe(`create schema "${schemaName}"`);
        await client.unsafe(`set search_path to "${schemaName}", public`);

        for (const statement of await readMigrationStatements()) {
          await client.unsafe(statement.replaceAll('"public".', `"${schemaName}".`));
        }

        const tables = await client<{ table_name: string }[]>`
          select table_name
          from information_schema.tables
          where table_schema = ${schemaName}
        `;

        expect(tables.map((table) => table.table_name)).toContain("organizations");
        expect(tables.map((table) => table.table_name)).toContain("feed_posts");
        expect(tables.map((table) => table.table_name)).toContain("engagement_campaigns");
        expect(tables.map((table) => table.table_name)).toContain("reward_grants");
        expect(tables.map((table) => table.table_name)).toContain("audit_logs");
      } finally {
        await client.unsafe(`drop schema if exists "${schemaName}" cascade`);
        await client.end({ timeout: 5 });
      }
    },
  );
});

describe("development seed data", () => {
  it("includes one realistic FLV store and all nominal RBAC users", () => {
    expect(developmentSeedSummary).toMatchObject({
      archiveItemCount: 2,
      departmentName: "FLV",
      engagementCampaignCount: 2,
      feedPostCount: 1,
      mediaObjectCount: 1,
      pendingInviteCount: 1,
      organizationSlug: "andru-market",
      rewardGrantCount: 1,
      storeCode: "loja-centro",
      totalSeedMediaBytes: 48_211,
    });

    expect(developmentSeedSummary.includesRoles).toEqual([
      "colaborador",
      "lider-setor",
      "gerente-loja",
      "admin-organizacao",
      "auditor",
    ]);
    expect(new Set(developmentSeedUsers.map((user) => user.email)).size).toBe(
      developmentSeedUsers.length,
    );
  });

  it("keeps the development seed within free-tier media and row budgets", () => {
    expect(developmentSeedSummary.totalUsers).toBeLessThanOrEqual(developmentSeedBudget.maxUsers);
    expect(developmentSeedSummary.totalSeedMediaBytes).toBeLessThanOrEqual(
      developmentSeedBudget.maxTotalMediaBytes,
    );
    expect(() => assertDevelopmentSeedWithinBudget()).not.toThrow();
  });
});

async function readAllMigrationSql(): Promise<string> {
  return (await readMigrationStatements()).join("\n");
}

async function readMigrationStatements(): Promise<readonly string[]> {
  const fileNames = (await readdir(migrationDirectory))
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort((left, right) => left.localeCompare(right));

  const statements: string[] = [];

  for (const fileName of fileNames) {
    const contents = await readFile(join(migrationDirectory, fileName), "utf8");
    statements.push(
      ...contents
        .split("--> statement-breakpoint")
        .map((statement) => statement.trim())
        .filter((statement) => statement.length > 0),
    );
  }

  return statements;
}
