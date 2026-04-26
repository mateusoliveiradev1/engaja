import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(scriptDirectory, "../../..");
const qaDocumentPath = join(workspaceRoot, "docs", "mobile-qa.md");
const outputDirectory = join(workspaceRoot, "packages", "config", "reports", "visual");
const outputPath = join(outputDirectory, "qa-summary.json");

const requiredChecks = [
  { id: "narrow-android", label: "Narrow Android" },
  { id: "standard-iphone", label: "Standard iPhone" },
  { id: "tablet-width", label: "Tablet Width" },
  { id: "distinct-identity", label: "distinct-identity" },
  { id: "text-overlap", label: "text-overlap" },
  { id: "nested-cards", label: "nested-cards" },
  { id: "unfinished-states", label: "unfinished-states" },
  { id: "hierarchy", label: "hierarchy" },
  { id: "produce-context", label: "produce-context" },
  { id: "labels", label: "labels" },
  { id: "reading-order", label: "reading-order" },
  { id: "hit-targets", label: "hit-targets" },
  { id: "dynamic-text", label: "dynamic-text" },
];

const qaDocument = await readFile(qaDocumentPath, "utf8");
const missingChecks = requiredChecks.filter((check) => !qaDocument.includes(check.label));

const report = {
  checkedAt: new Date().toISOString(),
  document: qaDocumentPath,
  missingChecks: missingChecks.map((check) => check.id),
  status: missingChecks.length === 0 ? "passed" : "failed",
};

await mkdir(outputDirectory, { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (missingChecks.length > 0) {
  console.error(
    `visual:qa failed. Missing mobile QA evidence for: ${missingChecks
      .map((check) => check.id)
      .join(", ")}`,
  );
  process.exitCode = 1;
} else {
  console.log(`visual:qa passed. Report written to ${outputPath}`);
}
