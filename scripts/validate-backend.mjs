import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const ROOT = process.cwd();
const FUNCTIONS_DIR = path.join(ROOT, "functions");

const ADMIN_ONLY = [
  "approveDecisionMemo",
  "approveRecommendation",
  "reviewReportFindings",
  "publishReportFindings",
  "adjudicateSourceConflict",
  "scheduleReportGeneration",
  "cleanupOldNotifications",
];

const ADMIN_OR_USER = [
  "runScenarioSimulation",
  "runCausalAnalysis",
  "runSentinelScan",
  "runForecastBacktest",
  "queueReportIngestion",
  "runReportIngestionWorker",
  "indexKnowledgeDocs",
  "queryPolicyKnowledge",
  "generateDecisionMemo",
  "rankRecommendations",
  "processImportedReport",
  "reprocessReport",
  "scoreSourceReliability",
  "scanHansards",
  "getReportIngestionStatus",
  "reconcileSourceConflict",
];

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function assert(condition, message, failures) {
  if (!condition) failures.push(message);
}

const failures = [];

const functionFiles = fs.readdirSync(FUNCTIONS_DIR)
  .filter((f) => f.endsWith(".ts") && !f.startsWith("_"))
  .map((f) => path.join(FUNCTIONS_DIR, f));

for (const file of functionFiles) {
  const source = read(file);
  const rel = path.relative(ROOT, file);
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
    reportDiagnostics: true,
    fileName: file,
  });
  const diagnostics = transpiled.diagnostics || [];
  if (diagnostics.length > 0) {
    failures.push(`${rel}: TypeScript syntax diagnostics detected (${diagnostics.length})`);
  }
  assert(source.includes("Deno.serve("), `${rel}: missing Deno.serve entrypoint`, failures);
}

for (const name of ADMIN_ONLY) {
  const file = path.join(FUNCTIONS_DIR, `${name}.ts`);
  assert(fs.existsSync(file), `Missing function file: functions/${name}.ts`, failures);
  if (!fs.existsSync(file)) continue;
  const source = read(file);
  const adminGuard =
    /role\s*!==\s*['"]admin['"]/.test(source) ||
    /user\?\.role\s*!==\s*['"]admin['"]/.test(source) ||
    /if\s*\(\s*user\?\.role\s*!==\s*['"]admin['"]\s*\)/.test(source);
  assert(adminGuard, `functions/${name}.ts: expected admin-only guard`, failures);
}

for (const name of ADMIN_OR_USER) {
  const file = path.join(FUNCTIONS_DIR, `${name}.ts`);
  assert(fs.existsSync(file), `Missing function file: functions/${name}.ts`, failures);
  if (!fs.existsSync(file)) continue;
  const source = read(file);
  const roleGuard =
    /\['admin',\s*'user'\]\.includes\(user\.role\)/.test(source) ||
    /user\?\.role\s*===\s*['"]admin['"][\s\S]{0,80}user\?\.role\s*===\s*['"]user['"]/.test(source) ||
    /user\?\.role\s*===\s*['"]user['"][\s\S]{0,80}user\?\.role\s*===\s*['"]admin['"]/.test(source);
  assert(roleGuard, `functions/${name}.ts: expected admin/user guard`, failures);
}

if (failures.length) {
  console.error("FAIL: backend validation errors");
  for (const f of failures) console.error(`- ${f}`);
  process.exit(1);
}

console.log(`PASS: backend validation succeeded (${functionFiles.length} functions checked).`);
