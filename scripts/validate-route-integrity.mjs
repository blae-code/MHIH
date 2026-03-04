import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "src");
const PAGES_CONFIG = path.join(SRC_DIR, "pages.config.js");
const SOURCE_EXT = new Set([".js", ".jsx", ".ts", ".tsx"]);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (SOURCE_EXT.has(path.extname(entry.name))) files.push(full);
  }
  return files;
}

const configText = fs.readFileSync(PAGES_CONFIG, "utf8");
const pageSet = new Set();
for (const match of configText.matchAll(/import\s+\w+\s+from\s+'\.\/pages\/([A-Za-z0-9_]+)'/g)) {
  pageSet.add(match[1]);
}

const routeRefs = new Map();
const routeRegexes = [
  /createPageUrl\(\s*["'`]([A-Za-z0-9_]+)["'`]\s*\)/g,
  /page:\s*["'`]([A-Za-z0-9_]+)["'`]/g,
];

for (const file of walk(SRC_DIR)) {
  const text = fs.readFileSync(file, "utf8");
  const rel = path.relative(ROOT, file);
  for (const re of routeRegexes) {
    for (const match of text.matchAll(re)) {
      const page = match[1];
      if (!routeRefs.has(page)) routeRefs.set(page, []);
      routeRefs.get(page).push(rel);
    }
  }
}

const missing = [];
for (const [page, refs] of routeRefs.entries()) {
  if (!pageSet.has(page)) missing.push({ page, refs });
}

console.log(`Pages registered: ${pageSet.size}`);
console.log(`Routes referenced in UI: ${routeRefs.size}`);
if (missing.length === 0) {
  console.log("PASS: All referenced routes are present in pages.config.js.");
  process.exit(0);
}

console.error("FAIL: Route references missing from pages.config.js:");
for (const entry of missing) {
  console.error(`- ${entry.page}`);
  for (const ref of entry.refs) console.error(`  - ${ref}`);
}
process.exit(1);
