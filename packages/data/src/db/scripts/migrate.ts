import { runMigrations } from "../migrate.js";

const result = await runMigrations();

console.log(
  [
    `Applied ${result.applied.length.toString()} database migration(s) using ${result.provider}.`,
    `Adopted ${result.adopted.length.toString()} existing migration(s).`,
    `Skipped ${result.skipped.length.toString()} current migration(s).`,
  ].join(" "),
);
