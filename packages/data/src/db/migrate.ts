import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

import { sql } from "drizzle-orm";

import { createDatabaseConnection, loadDatabaseConfig, type EngajaDatabase } from "./client.js";

const migrationDirectory = fileURLToPath(new URL("../../drizzle", import.meta.url));
const migrationJournalTable = "engaja_migration_journal";

interface MigrationDescriptor {
  readonly hash: string;
  readonly name: string;
  readonly source: "drizzle-journal" | "loose-sql";
  readonly statements: readonly string[];
  readonly tag: string;
}

interface MigrationResult {
  readonly adopted: readonly string[];
  readonly applied: readonly string[];
  readonly provider: string;
  readonly skipped: readonly string[];
}

export interface MigrationReadiness {
  readonly appliedCount: number;
  readonly current: boolean;
  readonly driftedCount: number;
  readonly journalReady: boolean;
  readonly latestMigration?: string;
  readonly pendingCount: number;
  readonly provider: string;
}

interface AppliedMigration {
  readonly hash: string;
  readonly name: string;
}

interface DrizzleJournalEntry {
  readonly tag: string;
}

type QueryRow = Readonly<Record<string, unknown>>;
type MigrationJournalSource = "adopted" | "executed";
type DatabaseObjectKind = "index" | "policy" | "table";

interface DatabaseObjectReference {
  readonly kind: DatabaseObjectKind;
  readonly name: string;
}

export async function runMigrations(): Promise<MigrationResult> {
  const config = loadDatabaseConfig();
  const connection = createDatabaseConnection(config);

  try {
    await ensureMigrationJournal(connection.db);

    const migrations = await readMigrationDescriptors();
    const appliedMigrations = new Map(
      (await readAppliedMigrations(connection.db)).map((migration) => [
        migration.name,
        migration.hash,
      ]),
    );
    const applied: string[] = [];
    const adopted: string[] = [];
    const skipped: string[] = [];

    for (const migration of migrations) {
      const appliedHash = appliedMigrations.get(migration.name);

      if (appliedHash !== undefined) {
        if (appliedHash !== migration.hash) {
          throw new Error(
            `Migration ${migration.name} has changed since it was recorded in ${migrationJournalTable}.`,
          );
        }

        skipped.push(migration.name);
        continue;
      }

      if (await migrationAppearsApplied(connection.db, migration)) {
        await recordMigration(connection.db, migration, "adopted");
        adopted.push(migration.name);
        continue;
      }

      for (const statement of migration.statements) {
        await connection.db.execute(sql.raw(statement));
      }

      await recordMigration(connection.db, migration, "executed");
      applied.push(migration.name);
    }

    return {
      adopted,
      applied,
      provider: connection.provider,
      skipped,
    };
  } finally {
    await connection.close();
  }
}

export async function readDatabaseMigrationReadiness(input: {
  readonly db: EngajaDatabase;
  readonly provider: string;
}): Promise<MigrationReadiness> {
  const migrations = await readMigrationDescriptors();
  const journalReady = await databaseObjectExists(input.db, {
    kind: "table",
    name: migrationJournalTable,
  });
  const appliedMigrations = journalReady
    ? new Map(
        (await readAppliedMigrations(input.db)).map((migration) => [
          migration.name,
          migration.hash,
        ]),
      )
    : new Map<string, string>();
  let appliedCount = 0;
  let driftedCount = 0;
  let pendingCount = 0;

  for (const migration of migrations) {
    const appliedHash = appliedMigrations.get(migration.name);

    if (appliedHash === undefined) {
      pendingCount += 1;
      continue;
    }

    if (appliedHash !== migration.hash) {
      driftedCount += 1;
      continue;
    }

    appliedCount += 1;
  }

  const latestMigration = migrations.at(-1)?.name;

  return {
    appliedCount,
    current: journalReady && pendingCount === 0 && driftedCount === 0,
    driftedCount,
    journalReady,
    ...(latestMigration === undefined ? {} : { latestMigration }),
    pendingCount,
    provider: input.provider,
  };
}

async function readMigrationDescriptors(): Promise<readonly MigrationDescriptor[]> {
  const journalEntries = await readDrizzleJournalEntries();
  const migrationFileNames = (await readdir(migrationDirectory))
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort((left, right) => left.localeCompare(right));
  const migrations: MigrationDescriptor[] = [];
  const queuedFileNames = new Set<string>();

  for (const entry of journalEntries) {
    const fileName = `${entry.tag}.sql`;

    if (!migrationFileNames.includes(fileName)) {
      throw new Error(`No file ${fileName} found in ${migrationDirectory}.`);
    }

    migrations.push(await readMigrationDescriptor(fileName, "drizzle-journal"));
    queuedFileNames.add(fileName);
  }

  for (const fileName of migrationFileNames) {
    if (queuedFileNames.has(fileName)) {
      continue;
    }

    migrations.push(await readMigrationDescriptor(fileName, "loose-sql"));
  }

  return migrations;
}

async function readMigrationDescriptor(
  fileName: string,
  source: MigrationDescriptor["source"],
): Promise<MigrationDescriptor> {
  const migrationSql = await readFile(join(migrationDirectory, fileName), "utf8");

  return {
    hash: createHash("sha256").update(migrationSql).digest("hex"),
    name: fileName,
    source,
    statements: splitMigrationStatements(migrationSql),
    tag: basename(fileName, ".sql"),
  };
}

async function readDrizzleJournalEntries(): Promise<readonly DrizzleJournalEntry[]> {
  const journalSql = await readFile(join(migrationDirectory, "meta", "_journal.json"), "utf8");
  const parsedJournal = JSON.parse(journalSql) as unknown;

  if (!isQueryRow(parsedJournal)) {
    throw new Error("Drizzle migration journal must be a JSON object.");
  }

  const entries = parsedJournal.entries;

  if (!Array.isArray(entries)) {
    throw new Error("Drizzle migration journal must contain an entries array.");
  }

  return entries.map(parseDrizzleJournalEntry);
}

function parseDrizzleJournalEntry(entry: unknown): DrizzleJournalEntry {
  if (!isQueryRow(entry) || typeof entry.tag !== "string") {
    throw new Error("Drizzle migration journal entry is missing a tag.");
  }

  return {
    tag: entry.tag,
  };
}

async function ensureMigrationJournal(db: EngajaDatabase): Promise<void> {
  await db.execute(sql`
    create table if not exists engaja_migration_journal (
      name text primary key,
      hash text not null,
      source text not null,
      applied_at timestamp with time zone not null default now()
    )
  `);
}

async function readAppliedMigrations(db: EngajaDatabase): Promise<readonly AppliedMigration[]> {
  const result = await db.execute(sql`
    select name, hash
    from engaja_migration_journal
    order by applied_at, name
  `);

  return resultRows(result).map((row) => {
    if (typeof row.name !== "string" || typeof row.hash !== "string") {
      throw new Error("Migration journal row is invalid.");
    }

    return {
      hash: row.hash,
      name: row.name,
    };
  });
}

async function recordMigration(
  db: EngajaDatabase,
  migration: MigrationDescriptor,
  source: MigrationJournalSource,
): Promise<void> {
  await db.execute(sql`
    insert into engaja_migration_journal (name, hash, source)
    values (${migration.name}, ${migration.hash}, ${source})
    on conflict (name) do update
      set hash = excluded.hash,
          source = excluded.source,
          applied_at = now()
  `);
}

async function migrationAppearsApplied(
  db: EngajaDatabase,
  migration: MigrationDescriptor,
): Promise<boolean> {
  const objectReferences = extractCreatedObjectReferences(migration.statements.join("\n"));

  if (objectReferences.length === 0) {
    return false;
  }

  for (const reference of objectReferences) {
    if (!(await databaseObjectExists(db, reference))) {
      return false;
    }
  }

  return true;
}

async function databaseObjectExists(
  db: EngajaDatabase,
  reference: DatabaseObjectReference,
): Promise<boolean> {
  assertSafeDatabaseObjectName(reference.name);

  if (reference.kind === "policy") {
    const result = await db.execute(sql`
      select exists(
        select 1
        from pg_policies
        where schemaname = 'public'
          and policyname = ${reference.name}
      ) as "exists"
    `);

    return readBooleanCell(result, "exists");
  }

  const result = await db.execute(sql`
    select to_regclass(${`public."${reference.name}"`}) is not null as "exists"
  `);

  return readBooleanCell(result, "exists");
}

function extractCreatedObjectReferences(migrationSql: string): readonly DatabaseObjectReference[] {
  return [
    ...extractQuotedNames(migrationSql, /CREATE TABLE\s+(?:"[^"]+"\.)?"([^"]+)"/g).map(
      (name) => ({ kind: "table", name }) as const,
    ),
    ...extractQuotedNames(migrationSql, /CREATE (?:UNIQUE )?INDEX\s+"([^"]+)"/g).map(
      (name) => ({ kind: "index", name }) as const,
    ),
    ...extractQuotedNames(migrationSql, /CREATE POLICY\s+"([^"]+)"/g).map(
      (name) => ({ kind: "policy", name }) as const,
    ),
  ];
}

function extractQuotedNames(migrationSql: string, pattern: RegExp): readonly string[] {
  const names = new Set<string>();

  while (true) {
    const match = pattern.exec(migrationSql);

    if (match === null) {
      break;
    }

    const name = match[1];

    if (name !== undefined) {
      names.add(name);
    }
  }

  return [...names];
}

function splitMigrationStatements(migrationSql: string): readonly string[] {
  return migrationSql
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);
}

function readBooleanCell(result: unknown, key: string): boolean {
  const value = resultRows(result)[0]?.[key];

  return value === true || value === "true" || value === "t" || value === 1 || value === "1";
}

function resultRows(result: unknown): readonly QueryRow[] {
  if (Array.isArray(result)) {
    return result.filter(isQueryRow);
  }

  if (!isQueryRow(result)) {
    return [];
  }

  const rows = result.rows;

  return Array.isArray(rows) ? rows.filter(isQueryRow) : [];
}

function isQueryRow(value: unknown): value is QueryRow {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertSafeDatabaseObjectName(name: string): void {
  if (!/^[a-z][a-z0-9_]*$/.test(name)) {
    throw new Error(`Unsafe database object name in migration: ${name}.`);
  }
}
