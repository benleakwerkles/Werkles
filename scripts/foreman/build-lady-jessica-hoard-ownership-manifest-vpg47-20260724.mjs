import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const outputRelative =
  process.env.VPG47_HOARD_MANIFEST_RESULT ||
  "foreman/receipts/WERKLES_VPG47_LADY_JESSICA_HOARD_OWNERSHIP_MANIFEST_20260724.json";
const outputPath = path.join(root, outputRelative);
const acceptanceRelative =
  "foreman/receipts/WERKLES_VPG47_LADY_JESSICA_FULL_STORY_ACCEPTANCE_RESULTS_20260724.json";

const cycleIds = {
  VPG42: "WERKLES-FLOCK-20260724-145708-ET-BETSY-01",
  VPG43: "WERKLES-FLOCK-20260724-153458-ET-BETSY-01",
  VPG44: "WERKLES-FLOCK-20260724-185700-ET-BETSY-01",
  VPG45: "WERKLES-FLOCK-20260724-221246-ET-BETSY-01",
  VPG46: "WERKLES-FLOCK-20260724-224709-ET-BETSY-01",
  VPG47: "WERKLES-FLOCK-20260724-234703-ET-BETSY-01"
};

const explicitCycle = new Map([
  ["app/beta-signup-form.tsx", "VPG45"],
  ["app/dashboard/profile/page.tsx", "VPG46"],
  ["app/page.tsx", "VPG45"],
  ["components/foundry/home-value-fold.tsx", "VPG45"],
  ["components/squibb/confidence-meter.tsx", "VPG45"],
  ["components/squibb/recommendation-surface.tsx", "VPG46"],
  ["foreman/VPG_SHORTHAND.md", "VPG42-VPG47"],
  ["foreman/gates/APPROVAL_LOG.md", "VPG42-VPG47"],
  ["foreman/receipts/WERKLES_VPG_CYCLE_EVIDENCE_LEDGER.jsonl", "VPG42-VPG47"],
  ["lib/matching/personal-recommendation-contract.ts", "VPG44+VPG46"],
  ["lib/matching/personal-recommendation-disclosure.ts", "VPG46"],
  ["lib/matching/profile-recommendation.ts", "VPG46"],
  ["lib/profile-builder-options.ts", "VPG46"],
  ["lib/squibb/recommendations.ts", "VPG46"],
  ["lib/supabase/request.ts", "VPG44"],
  ["package.json", "VPG43"],
  ["package-lock.json", "VPG43"],
  ["scripts/deploy/deploy-alias-guard.mjs", "VPG44"],
  ["scripts/deploy/deploy-alias-guard-smoke.mjs", "VPG44"],
  [
    "scripts/foreman/test-matching-example-custody-intake-clarity-vpg12-20260717.mjs",
    "VPG44"
  ],
  [
    "scripts/foreman/test-matching-example-custody-intake-clarity-vpg12-browser.mjs",
    "VPG44"
  ],
  ["scripts/foreman/test-matching-tier-a-personal-delivery-20260717.mjs", "VPG46"],
  ["scripts/foreman/test-post-push-tester-journey-vpg40-20260723.mjs", "VPG46"],
  ["scripts/foreman/test-public-language-boundary-vpg17-20260717.mjs", "VPG44"],
  ["scripts/foreman/test-public-momentum-usability-vpg27-20260719.mjs", "VPG46"],
  ["scripts/foreman/test-public-recommendation-activation-vpg26-20260719.mjs", "VPG46"],
  ["scripts/foreman/test-public-tester-continuity-vpg24-20260719.mjs", "VPG46"],
  ["scripts/foreman/test-recommendation-warmth-interaction-vpg35-20260721.mjs", "VPG46"],
  ["scripts/foreman/test-route-audience-readonly-vpg30-20260721.mjs", "VPG44"]
]);

const productOwners = new Map([
  ["app/beta-signup-form.tsx", "Heimerdinker@Betsy; LadyJessica proof"],
  ["app/dashboard/profile/page.tsx", "Heimerdinker@Betsy; LadyJessica proof"],
  ["app/page.tsx", "Heimerdinker@Betsy; LadyJessica proof"],
  ["components/foundry/home-value-fold.tsx", "Heimerdinker@Betsy; LadyJessica proof"],
  ["components/squibb/confidence-meter.tsx", "Heimerdinker@Betsy; LadyJessica proof"],
  ["components/squibb/recommendation-surface.tsx", "Heimerdinker@Betsy; LadyJessica proof"]
]);

function git(args) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024
  });
}

function nulPaths(args) {
  return git([...args, "-z"])
    .split("\0")
    .filter(Boolean)
    .map((value) => value.replaceAll("\\", "/"));
}

function sha256Buffer(value) {
  return createHash("sha256").update(value).digest("hex");
}

function sha256File(relativePath) {
  return sha256Buffer(readFileSync(path.join(root, relativePath)));
}

function detectCycle(relativePath) {
  if (explicitCycle.has(relativePath)) return explicitCycle.get(relativePath);
  const matches = [...relativePath.matchAll(/vpg(4[2-7])/gi)].map((match) => `VPG${match[1]}`);
  const unique = [...new Set(matches)];
  return unique.length ? unique.join("+") : null;
}

function artifactClass(relativePath) {
  const lower = relativePath.toLowerCase();
  if (lower.startsWith("app/") || lower.startsWith("components/") || lower.startsWith("lib/")) {
    return "PRODUCT_SOURCE";
  }
  if (lower === "package.json" || lower === "package-lock.json") return "DEPENDENCY_MANIFEST";
  if (lower.includes("/handoffs/outbox/")) return "HANDOFF_PACKET";
  if (lower.includes("/reviews/gate-")) return "HUMAN_GATE";
  if (lower.includes("/fixtures/")) return "TEST_FIXTURE";
  if (lower.startsWith("scripts/deploy/") || lower.includes("guard-vpg")) return "RELEASE_GUARD";
  if (lower.startsWith("scripts/foreman/")) return "TEST_HARNESS";
  if (lower.endsWith(".json") && lower.includes("/receipts/")) return "RESULT_OR_MANIFEST";
  if (lower.includes("/receipts/")) return "RECEIPT";
  if (lower.includes("/gates/") || lower.endsWith("vpg_shorthand.md")) return "CONTROL_EVIDENCE";
  return "UNCLASSIFIED";
}

function owner(relativePath, artifactType) {
  if (productOwners.has(relativePath)) return productOwners.get(relativePath);
  const upper = relativePath.toUpperCase();
  if (
    upper.includes("LADY_JESSICA") ||
    upper.includes("LADY-JESSICA") ||
    upper.includes("PUBLIC-TESTER-BROWSER-RED-TEAM-VPG44") ||
    upper.includes("ACCESSIBLE-FONT-RESILIENT-PUBLIC-FLOWS-VPG45") ||
    upper.includes("PROFILE-BUILDER-FIRST-SAVE-BROWSER-VPG46") ||
    upper.includes("LADY-JESSICA-HOARD") ||
    upper.includes("LADY-JESSICA-FULL-STORY")
  ) {
    return "LadyJessica@Betsy";
  }
  if (upper.includes("ENDER")) return "Ender@Betsy";
  if (upper.includes("THUFIR")) return "Thufir@Betsy";
  if (upper.includes("BEAN")) return "Bean@Betsy";
  if (upper.includes("DOOZER")) return "Doozer@Betsy";
  if (upper.includes("HEIMERDINKER")) return "Heimerdinker@Betsy";
  if (artifactType === "TEST_HARNESS" || artifactType === "TEST_FIXTURE") {
    return "Heimerdinker/helper Flock; integration Heimerdinker@Betsy";
  }
  return "Heimerdinker@Betsy (integration/custody)";
}

function evidenceFor(cycle) {
  const labels = [...String(cycle ?? "").matchAll(/VPG(4[2-7])/g)].map(
    (match) => `VPG${match[1]}`
  );
  return labels.map((label) => ({
    legacy_label: label,
    cycle_id: cycleIds[label],
    packet_or_receipt_pattern: `foreman/**/${label}*20260724*`
  }));
}

function forbiddenReason(relativePath) {
  const lower = relativePath.toLowerCase();
  if (/(^|\/)\.env(?:\.|$)/.test(lower)) return "SECRET_BEARING_ENV_FILE";
  if (/(^|\/)(node_modules|\.next|dist|coverage|cache|tmp|temp)(\/|$)/.test(lower)) {
    return "GENERATED_OR_CACHE";
  }
  if (/\.(log|tmp|bak|swp)$/.test(lower)) return "LOG_OR_TEMPORARY";
  return null;
}

const staged = new Set([
  ...nulPaths(["diff", "--cached", "--name-only"]),
  ...nulPaths(["diff", "--cached", "--name-only", "--diff-filter=ACMR"])
]);
const modified = new Set(nulPaths(["diff", "--name-only", "HEAD"]));
const untracked = new Set(nulPaths(["ls-files", "--others", "--exclude-standard"]));
const allPaths = [...new Set([...modified, ...untracked, ...staged])].sort();

const entries = allPaths.map((relativePath) => {
  const cycle = detectCycle(relativePath);
  const type = artifactClass(relativePath);
  const forbidden = forbiddenReason(relativePath);
  const unexplained = !cycle || type === "UNCLASSIFIED";
  const status = untracked.has(relativePath)
    ? "UNTRACKED"
    : staged.has(relativePath)
      ? "STAGED_OR_MIXED"
      : "MODIFIED_TRACKED";
  const isSelf = relativePath === outputRelative.replaceAll("\\", "/");
  return {
    path: relativePath,
    git_status: status,
    bytes: statSync(path.join(root, relativePath)).size,
    sha256: isSelf ? null : sha256File(relativePath),
    hash_status: isSelf ? "SELF_REFERENTIAL_MANIFEST_HASH_EXCLUDED" : "SHA256_BOUND",
    cycle,
    owner: owner(relativePath, type),
    artifact_class: type,
    disposition: forbidden ? "EXCLUDE" : unexplained ? "REVIEW" : "INCLUDE",
    reason: forbidden
      ? forbidden
      : unexplained
        ? "NO_COMPLETE_CYCLE_OR_ARTIFACT_ATTRIBUTION"
        : "EVIDENCE_BACKED_VPG42_VPG47_CANDIDATE",
    evidence: evidenceFor(cycle)
  };
});

const unexplained = entries.filter((entry) => entry.disposition === "REVIEW");
assert.equal(
  unexplained.length,
  0,
  `Every dirty path must be explained: ${unexplained.map((entry) => entry.path).join(", ")}`
);

const historicalAcceptance = existsSync(path.join(root, acceptanceRelative))
  ? JSON.parse(readFileSync(path.join(root, acceptanceRelative), "utf8"))
  : null;
const historicalEvidenceImmutable =
  historicalAcceptance?.historicalEvidence?.unchanged === true;

const countBy = (key) =>
  Object.fromEntries(
    [...new Set(entries.map((entry) => entry[key]))]
      .sort()
      .map((value) => [value, entries.filter((entry) => entry[key] === value).length])
  );
const digestEntries = entries.map(({ path: entryPath, git_status, sha256, cycle, owner: entryOwner, artifact_class, disposition }) => ({
  path: entryPath,
  git_status,
  sha256,
  cycle,
  owner: entryOwner,
  artifact_class,
  disposition
}));

const manifest = {
  schema: "werkles.vpg47-lady-jessica-hoard-ownership-manifest/v1",
  generated_at: new Date().toISOString(),
  cycle_id: cycleIds.VPG47,
  seat: "LadyJessica@Betsy",
  integration_owner: "Heimerdinker@Betsy",
  repository: root,
  branch: git(["branch", "--show-current"]).trim(),
  head: git(["rev-parse", "HEAD"]).trim(),
  upstream: git(["rev-parse", "@{upstream}"]).trim(),
  index_empty: staged.size === 0,
  port_3000_excluded: true,
  historical_evidence: {
    acceptance_result: acceptanceRelative,
    checked: Boolean(historicalAcceptance),
    immutable: historicalEvidenceImmutable
  },
  entries,
  summary: {
    dirty_path_count: entries.length,
    modified_tracked_count: entries.filter((entry) => entry.git_status === "MODIFIED_TRACKED").length,
    untracked_count: entries.filter((entry) => entry.git_status === "UNTRACKED").length,
    staged_or_mixed_count: entries.filter((entry) => entry.git_status === "STAGED_OR_MIXED").length,
    include_count: entries.filter((entry) => entry.disposition === "INCLUDE").length,
    exclude_count: entries.filter((entry) => entry.disposition === "EXCLUDE").length,
    review_count: unexplained.length,
    self_referential_hash_exclusions: entries.filter((entry) => entry.sha256 === null).length,
    by_cycle: countBy("cycle"),
    by_artifact_class: countBy("artifact_class"),
    tree_sha256: sha256Buffer(JSON.stringify(digestEntries)),
    zero_unexplained_paths: unexplained.length === 0,
    verdict:
      unexplained.length === 0 && staged.size === 0 && historicalEvidenceImmutable
        ? "PASS"
        : "FAIL"
  }
};

writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(JSON.stringify(manifest.summary, null, 2));
if (manifest.summary.verdict !== "PASS") process.exitCode = 1;
