import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TARGET_DIRS = [path.join(ROOT, "src"), path.join(ROOT, "functions")];
const SOURCE_EXT = new Set([".js", ".jsx", ".ts", ".tsx"]);

const bannedPatterns = [
  /role\s*===\s*['"]analyst['"]/g,
  /role\s*===\s*['"]viewer['"]/g,
  /\['admin'\s*,\s*'analyst'/g,
  /\['admin'\s*,\s*'viewer'/g,
  /\['admin'\s*,\s*'analyst'\s*,\s*'viewer'\]/g,
  /\["admin"\s*,\s*"analyst"/g,
  /\["admin"\s*,\s*"viewer"/g,
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (SOURCE_EXT.has(path.extname(entry.name))) files.push(full);
  }
  return files;
}

const findings = [];
for (const root of TARGET_DIRS) {
  for (const file of walk(root)) {
    const text = fs.readFileSync(file, "utf8");
    for (const pattern of bannedPatterns) {
      if (pattern.test(text)) {
        findings.push({ file: path.relative(ROOT, file), pattern: pattern.toString() });
      }
      pattern.lastIndex = 0;
    }
  }
}

if (!findings.length) {
  console.log("PASS: No legacy viewer/analyst role checks found.");
  process.exit(0);
}

console.error("FAIL: Legacy role checks detected:");
for (const f of findings) {
  console.error(`- ${f.file} :: ${f.pattern}`);
}
process.exit(1);
