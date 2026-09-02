#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, normalize, relative, resolve, sep } from "node:path";

const ROOT = process.cwd();
const WRITE = process.argv.includes("--write");
const DATE = process.env.WERKLES_RELEASE_DATE || "20260823";
const JSON_PATH = join(ROOT, "foreman", "releases", `WERKLES_BVPGM_RELEASE_CANDIDATE_INVENTORY_${DATE}.json`);
const MD_PATH = join(ROOT, "foreman", "releases", `WERKLES_BVPGM_RELEASE_CANDIDATE_INVENTORY_${DATE}.md`);
const EVIDENCE_PATH = join(ROOT, "foreman", "releases", `WERKLES_BVPGM_SOURCE_BOUND_CANDIDATE_EVIDENCE_${DATE}.md`);

const RECEIPTS = [
  "foreman/receipts/WERKLES_VPGM_BROAD_ROTATION_M2_20260822.md",
  "foreman/receipts/WERKLES_VPGM_BROAD_ROTATION_M3_20260822.md",
  "foreman/receipts/WERKLES_VPGM_BROAD_ROTATION_M4_20260822.md",
  "foreman/receipts/WERKLES_VPGM_BROAD_ROTATION_M5_20260822.md",
  "foreman/receipts/WERKLES_VPGM_BROAD_ROTATION_M6_20260822.md",
  "foreman/receipts/WERKLES_VPGM_BROAD_ROTATION_M7_20260823.md",
  "foreman/receipts/WERKLES_VPGM_BROAD_ROTATION_M8_20260823.md",
  "foreman/receipts/WERKLES_VPGM_BROAD_ROTATION_M9_TECH_STACK_20260823.md",
  "foreman/receipts/WERKLES_BVPGM_BROAD_ROTATION_M3_MEMBER_VALUE_20260823.md",
  "foreman/receipts/WERKLES_BVPGM_ACTION_CONSEQUENCE_AND_VALUE_M8_20260823.md",
  "foreman/receipts/WERKLES_BVPGM_MEMBER_VALUE_AND_PROVIDER_CONTINUITY_M9_20260823.md",
  "foreman/receipts/WERKLES_BVPGM_MATCH_TO_WERKLE_AND_RETURN_VALUE_M10_20260823.md",
  "foreman/receipts/WERKLES_BVPGM_FORMATION_RETURN_VALUE_M11_20260823.md",
  "foreman/receipts/WERKLES_BVPGM_TOPIC_EXPERIMENT_RETURN_M12_20260823.md",
  "foreman/receipts/WERKLES_BVPGM_TEST_RESULT_RETURN_M13_20260824.md"
];

const MEMBER_SOURCE_ROOTS = ["app/", "components/", "lib/"];
const MEMBER_DATA_FILES = new Set(["data/ghost-fleet/members.json"]);
const ROOT_PRODUCT_FILES = new Set([
  ".env.example",
  ".gitignore",
  "middleware.ts",
  "next.config.ts",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "styles.css",
  "vercel.json"
]);

const EXCLUDED_PREFIXES = [
  ".codex-logs/",
  ".vscode/",
  "app/draft-reviews/",
  "app/gd/",
  "app/api/nerdkle/",
  "app/api/organism/",
  "app/api/soledash/",
  "app/api/tinkerden/",
  "app/nerdkle/",
  "app/operator/",
  "app/soledash/",
  "app/thinkit/",
  "app/tinkerden/",
  "components/nerdkle/",
  "components/soledash/",
  "components/tinkerden/",
  "data/organism/",
  "data/tinkerden/",
  "foreman/.edge-aeye-crew-profile/",
  "foreman/.playwright/",
  "foreman/courier-proof/",
  "foreman/crew-dispatch/",
  "foreman/receipts/courier-proof/",
  "lib/nerdkle/",
  "lib/organism/",
  "lib/soledash/",
  "lib/tinkerden/",
  "lib/tinkerden-return-system-v0/",
  "public/assets/brand/product-icons/clear-v1/raw/",
  "public/assets/draft/",
  "public/draft-reviews/",
  "scripts/one-off/",
  "scripts/soledash/",
  "scripts/tinkerden/",
  "tinkarden/",
  "tinkerden/",
  "tmp/",
  "tools/"
];

const EXCLUDED_EXACT = new Set([
  "Werkles.code-workspace",
  "AGENTS.md",
  "({src",
  "icon-contact-sheet.png",
  "x.textContent)})"
]);

const SOURCE_EXTENSIONS = new Set([".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx"]);
const RESOLVE_EXTENSIONS = ["", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".css"];

function slash(path) {
  return path.split(sep).join("/");
}

function git(...args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

function statusRows() {
  const raw = execFileSync("git", ["status", "--porcelain=v1", "-z", "--untracked-files=all"], {
    cwd: ROOT,
    encoding: "utf8"
  });
  const fields = raw.split("\0").filter(Boolean);
  const rows = [];
  for (let index = 0; index < fields.length; index += 1) {
    const field = fields[index];
    const status = field.slice(0, 2);
    const path = slash(field.slice(3));
    if (status.includes("R") || status.includes("C")) {
      const target = fields[index + 1];
      if (!target) throw new Error(`Rename/copy row missing target for ${path}`);
      rows.push({ status, path: slash(target), sourcePath: path });
      index += 1;
    } else {
      rows.push({ status, path });
    }
  }
  return rows;
}

function referencedTests() {
  const tests = new Set();
  for (const receipt of RECEIPTS) {
    const absolute = join(ROOT, receipt);
    if (!existsSync(absolute)) continue;
    const text = readFileSync(absolute, "utf8");
    for (const match of text.matchAll(/scripts\/foreman\/[A-Za-z0-9._/-]+\.(?:mjs|js|ts|tsx)/g)) {
      tests.add(match[0]);
    }
  }
  return tests;
}

function isExcluded(path) {
  return EXCLUDED_EXACT.has(path) || EXCLUDED_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function referencedAssets(rows) {
  const assets = new Set();
  const assetPattern = /["'(`]((?:\/assets\/|\/werkles-)[A-Za-z0-9._~!$&+,;=:@%/-]+)/g;
  for (const row of rows) {
    if (!MEMBER_SOURCE_ROOTS.some((prefix) => row.path.startsWith(prefix))) continue;
    if (isExcluded(row.path) || !SOURCE_EXTENSIONS.has(extname(row.path))) continue;
    const absolute = join(ROOT, row.path);
    if (!existsSync(absolute)) continue;
    const text = readFileSync(absolute, "utf8");
    for (const match of text.matchAll(assetPattern)) assets.add(`public${match[1]}`);
  }
  return assets;
}

function classify(path, tests, assets) {
  // Product pages may intentionally reference an existing draft-library asset.
  // Keep those exact dependencies in the bounded candidate even though the rest
  // of the draft library remains excluded.
  if (assets.has(path)) return "candidate_asset";
  if (isExcluded(path)) return "excluded";
  if (RECEIPTS.includes(path)) return "release_evidence";
  if (path.startsWith("foreman/releases/WERKLES_") && path.endsWith(`_${DATE}.md`)) return "release_evidence";
  if (path === "company/PLAID_PERSISTENT_LIQUIDITY_PROOF_V0.md") return "release_evidence";
  if (path.startsWith("supabase/migrations/")) return "blocked_schema";
  if (tests.has(path)) return "candidate_verification";
  if (ROOT_PRODUCT_FILES.has(path)) return "candidate_source";
  if (MEMBER_SOURCE_ROOTS.some((prefix) => path.startsWith(prefix))) return "candidate_source";
  if (MEMBER_DATA_FILES.has(path)) return "candidate_data";
  if (path.startsWith("data/") || path.startsWith("public/")) return "excluded";
  if (path.startsWith("scripts/foreman/")) return "excluded_verification";
  if (path.startsWith("foreman/")) return "excluded";
  return "unresolved";
}

function hashFile(path) {
  const absolute = join(ROOT, path);
  if (!existsSync(absolute)) return { bytes: null, sha256: null, missing: true };
  const bytes = readFileSync(absolute);
  return {
    bytes: statSync(absolute).size,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    missing: false
  };
}

function resolveImport(fromPath, specifier) {
  if (!specifier.startsWith(".") && !specifier.startsWith("@/")) return null;
  const base = specifier.startsWith("@/")
    ? resolve(ROOT, specifier.slice(2))
    : resolve(dirname(join(ROOT, fromPath)), specifier);
  const candidates = [];
  for (const extension of RESOLVE_EXTENSIONS) candidates.push(`${base}${extension}`);
  for (const extension of RESOLVE_EXTENSIONS.slice(1)) candidates.push(join(base, `index${extension}`));
  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return slash(relative(ROOT, candidate));
  }
  return null;
}

function dependencyLeaks(candidateRows, changedPaths) {
  const candidate = new Set(candidateRows.map((row) => row.path));
  const leaks = [];
  const importPattern = /(?:from\s+|import\s*\(|require\s*\()\s*["']([^"']+)["']/g;
  for (const row of candidateRows) {
    if (!SOURCE_EXTENSIONS.has(extname(row.path))) continue;
    const text = readFileSync(join(ROOT, row.path), "utf8");
    for (const match of text.matchAll(importPattern)) {
      const dependency = resolveImport(row.path, match[1]);
      if (!dependency || !changedPaths.has(dependency) || candidate.has(dependency)) continue;
      leaks.push({ importer: row.path, specifier: match[1], dependency });
    }
  }
  return leaks.sort((a, b) => a.importer.localeCompare(b.importer) || a.dependency.localeCompare(b.dependency));
}

function markdown(report) {
  const counts = Object.entries(report.counts)
    .map(([key, value]) => `| \`${key}\` | ${value} |`)
    .join("\n");
  const leaks = report.dependencyLeaks.length
    ? report.dependencyLeaks.map((row) => `- \`${row.importer}\` → \`${row.dependency}\` via \`${row.specifier}\``).join("\n")
    : "- None detected among changed relative imports.";
  const unresolved = report.files
    .filter((row) => row.classification.startsWith("unresolved"))
    .map((row) => `- \`${row.status}\` \`${row.path}\` — \`${row.classification}\``)
    .join("\n") || "- None.";
  const displayDate = `${DATE.slice(0, 4)}-${DATE.slice(4, 6)}-${DATE.slice(6, 8)}`;
  return `# Werkles BVPGM Release Candidate Inventory — ${displayDate}

Status: \`${report.status}\`

This is a deterministic inventory of the dirty shared tree against the intended
member-product release boundary. It is not a commit, sign-off, push approval, or
deployment authorization.

## Baseline

- Branch: \`${report.branch}\`
- Commit: \`${report.commit}\`
- Dirty rows: ${report.dirtyRows}
- Candidate files: ${report.candidateFiles}
- Candidate content digest: \`${report.candidateDigest}\`

## Classification

| Class | Count |
|---|---:|
${counts}

## Changed dependency closure

${leaks}

## Unresolved rows

${unresolved}

## Gate truth

The candidate remains open while unresolved rows or changed dependency leaks
exist. Even after those reach zero, TypeScript, production build, focused
contracts, rendered member-route regression, Heimerdinker sign-off, Lady
Jessica independent review/sign-off, and Ben's explicit approval remain owed.
`;
}

const tests = referencedTests();
const rows = statusRows();
const assets = referencedAssets(rows);
const changedPaths = new Set(rows.map((row) => row.path));
const files = rows
  .map((row) => ({ ...row, classification: classify(row.path, tests, assets), ...hashFile(row.path) }))
  .sort((a, b) => a.path.localeCompare(b.path));
const candidateRows = files.filter((row) => row.classification.startsWith("candidate_"));
const leaks = dependencyLeaks(candidateRows, changedPaths);
const counts = files.reduce((out, row) => {
  out[row.classification] = (out[row.classification] || 0) + 1;
  return out;
}, {});
const candidateDigest = createHash("sha256")
  .update(candidateRows.map((row) => `${row.path}|${row.bytes}|${row.sha256}`).join("\n"), "utf8")
  .digest("hex");
const unresolvedCount = counts.unresolved || 0;
const evidence = existsSync(EVIDENCE_PATH) ? readFileSync(EVIDENCE_PATH, "utf8") : "";
const regressionBound =
  evidence.includes(candidateDigest) &&
  evidence.includes("40/40 receipt-bound M2-M9 plus BVPGM M3-M13 contracts: PASS") &&
  evidence.includes("`npm run typecheck`: PASS") &&
  evidence.includes("`npm run build`: PASS") &&
  evidence.includes("Local HTTP route spine: 10/10 PASS");
const report = {
  schema: "WERKLES_BVPGM_RELEASE_CANDIDATE_INVENTORY_V1",
  generatedAt: new Date().toISOString(),
  branch: git("branch", "--show-current"),
  commit: git("rev-parse", "HEAD"),
  status:
    unresolvedCount === 0 && leaks.length === 0
      ? regressionBound
        ? "SOURCE_BOUNDARY_CLOSED__LOCAL_REGRESSION_PASS__INDEPENDENT_REVIEW_OWED"
        : "SOURCE_BOUNDARY_CLOSED__REGRESSION_OWED"
      : "SOURCE_BOUNDARY_OPEN",
  dirtyRows: rows.length,
  candidateFiles: candidateRows.length,
  candidateDigest,
  counts,
  dependencyLeaks: leaks,
  regressionEvidenceBound: regressionBound,
  receiptSources: RECEIPTS,
  files
};

if (WRITE) {
  writeFileSync(JSON_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  writeFileSync(MD_PATH, markdown(report), "utf8");
}

console.log(JSON.stringify({
  status: report.status,
  dirtyRows: report.dirtyRows,
  candidateFiles: report.candidateFiles,
  counts: report.counts,
  dependencyLeaks: report.dependencyLeaks.length,
  candidateDigest: report.candidateDigest,
  wrote: WRITE ? [slash(relative(ROOT, JSON_PATH)), slash(relative(ROOT, MD_PATH))] : []
}, null, 2));

if (unresolvedCount > 0 || leaks.length > 0) process.exitCode = 2;
