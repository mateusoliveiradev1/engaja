import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";

const root = resolve(process.argv[2] ?? ".");
const ignoredDirs = new Set([
  ".expo",
  ".git",
  ".local",
  ".turbo",
  "coverage",
  "dist",
  "node_modules",
]);
const scannedExtensions = new Set([
  ".cjs",
  ".css",
  ".env",
  ".example",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".ts",
  ".tsx",
  ".yaml",
  ".yml",
]);

const secretPatterns = [
  /AKIA[0-9A-Z]{16}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /["']?(?:api|auth|access|secret)[_-]?key["']?\s*[:=]\s*["']?[A-Za-z0-9_./+=-]{24,}(?:["']|(?=\s|$|[,;}]))/i,
  /["']?(?:token|password)["']?\s*[:=]\s*["']?[A-Za-z0-9_./+=-]{24,}(?:["']|(?=\s|$|[,;}]))/i,
];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) {
        files.push(...(await walk(fullPath)));
      }
      continue;
    }

    if (entry.isFile() && scannedExtensions.has(extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

const files = await walk(root);
const findings = [];

for (const file of files) {
  const text = await readFile(file, "utf8");

  for (const pattern of secretPatterns) {
    if (pattern.test(text)) {
      findings.push(relative(root, file));
      break;
    }
  }
}

if (findings.length > 0) {
  console.error("Potential secrets found:");
  for (const finding of findings) {
    console.error(`- ${finding}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Secret scan passed for ${files.length} files.`);
}
