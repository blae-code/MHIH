import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "src");
const FUNCTIONS_DIR = path.join(ROOT, "functions");

const SOURCE_EXT = new Set([".js", ".jsx", ".ts", ".tsx"]);
const INVOKE_RE = /base44\.functions\.invoke\(\s*["'`]([A-Za-z0-9_]+)["'`]/g;

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (SOURCE_EXT.has(path.extname(entry.name))) files.push(full);
  }
  return files;
}

const usages = new Map();
for (const file of walk(SRC_DIR)) {
  const text = fs.readFileSync(file, "utf8");
  for (const match of text.matchAll(INVOKE_RE)) {
    const fn = match[1];
    const rel = path.relative(ROOT, file);
    if (!usages.has(fn)) usages.set(fn, []);
    usages.get(fn).push(rel);
  }
}

const missing = [];
for (const [fn, refs] of usages.entries()) {
  const functionPath = path.join(FUNCTIONS_DIR, `${fn}.ts`);
  if (!fs.existsSync(functionPath)) {
    missing.push({ fn, refs });
  }
}

console.log(`Functions invoked from UI: ${usages.size}`);
if (missing.length === 0) {
  console.log("PASS: All invoked functions exist in /functions.");
  process.exit(0);
}

console.error("FAIL: Missing function implementations:");
for (const entry of missing) {
  console.error(`- ${entry.fn}`);
  for (const ref of entry.refs) console.error(`  - ${ref}`);
}
process.exit(1);
