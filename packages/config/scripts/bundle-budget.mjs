#!/usr/bin/env node
import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

const targets = {
  api: {
    budgetBytes: 120_000,
    distDir: "apps/api/dist",
    largestFileBudgetBytes: 90_000,
    reportPath: "apps/api/reports/bundle/api.json",
  },
  mobile: {
    budgetBytes: 420_000,
    distDir: "apps/mobile/dist",
    largestFileBudgetBytes: 190_000,
    reportPath: "apps/mobile/reports/bundle/mobile.json",
  },
};

const targetName = process.argv[2];
const target = targets[targetName];

if (target === undefined) {
  console.error(`Usage: node packages/config/scripts/bundle-budget.mjs <${Object.keys(targets).join("|")}>`);
  process.exit(2);
}

const distDir = resolve(repoRoot, target.distDir);
const files = await listJavaScriptFiles(distDir);

if (files.length === 0) {
  console.error(`No JavaScript files found in ${target.distDir}. Run the package build first.`);
  process.exit(1);
}

const fileReports = await Promise.all(
  files.map(async (filePath) => {
    const fileStat = await stat(filePath);

    return {
      bytes: fileStat.size,
      path: relative(repoRoot, filePath).replaceAll("\\", "/"),
    };
  }),
);
const totalBytes = fileReports.reduce((sum, fileReport) => sum + fileReport.bytes, 0);
const largestFile = fileReports.reduce((largest, fileReport) =>
  fileReport.bytes > largest.bytes ? fileReport : largest,
);
const report = {
  budgetBytes: target.budgetBytes,
  files: fileReports.sort((left, right) => right.bytes - left.bytes),
  largestFile,
  largestFileBudgetBytes: target.largestFileBudgetBytes,
  ok: totalBytes <= target.budgetBytes && largestFile.bytes <= target.largestFileBudgetBytes,
  target: targetName,
  totalBytes,
};
const reportPath = resolve(repoRoot, target.reportPath);

await mkdir(dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);

if (!report.ok) {
  console.error(
    `${targetName} bundle budget failed: total ${totalBytes}/${target.budgetBytes} bytes, largest ${largestFile.bytes}/${target.largestFileBudgetBytes} bytes (${largestFile.path}).`,
  );
  process.exit(1);
}

console.log(
  `${targetName} bundle budget ok: total ${totalBytes}/${target.budgetBytes} bytes, largest ${largestFile.bytes}/${target.largestFileBudgetBytes} bytes (${largestFile.path}).`,
);

async function listJavaScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...await listJavaScriptFiles(entryPath));
    } else if (entry.isFile() && extname(entry.name) === ".js") {
      files.push(entryPath);
    }
  }

  return files;
}
