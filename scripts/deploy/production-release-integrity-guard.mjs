#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const DEFAULT_RELEASE_CONTRACT = "deploy/production-release-contract.json";
export const DEFAULT_APP_PATHS_MANIFEST = ".next/server/app-paths-manifest.json";

export function evaluateProductionReleaseIntegrity(input = {}) {
  const contractResult = validateContract(input.contract);
  if (!contractResult.ok) {
    return resultFromReasons(
      [{ code: "INVALID_RELEASE_CONTRACT", detail: contractResult.detail }],
      emptyChecks(),
      emptyEvidence(input)
    );
  }

  const contract = contractResult.contract;
  const reasons = [];
  const checks = emptyChecks();
  const headSha = normalizeSha(input.headSha);
  const approvedSha = normalizeSha(input.approvedSha);

  if (typeof input.dirty !== "boolean") {
    reasons.push({ code: "DIRTY_STATE_REQUIRED", detail: "dirty must be an explicit boolean." });
  } else if (input.dirty) {
    reasons.push({ code: "DIRTY_WORKTREE", detail: "Release worktree contains tracked or untracked changes." });
  } else {
    checks.worktree_clean = true;
  }

  if (!headSha) {
    reasons.push({ code: "HEAD_SHA_REQUIRED", detail: "Current HEAD SHA is required." });
  }
  if (!approvedSha) {
    reasons.push({ code: "APPROVED_SHA_REQUIRED", detail: "Approved release SHA is required." });
  }
  if (headSha && approvedSha) {
    if (headSha !== approvedSha) {
      reasons.push({
        code: "HEAD_SHA_MISMATCH",
        detail: `HEAD ${headSha} does not equal approved SHA ${approvedSha}.`
      });
    } else {
      checks.head_matches_approved_sha = true;
    }
  }

  const appPathKeys = manifestKeys(input.appPathsManifest);
  let missingAppPaths = [...contract.required_app_paths];
  if (!appPathKeys) {
    reasons.push({
      code: "APP_PATHS_MANIFEST_REQUIRED",
      detail: "A parsed Next.js app-paths manifest object is required."
    });
  } else {
    const present = new Set(appPathKeys);
    missingAppPaths = contract.required_app_paths.filter((route) => !present.has(route));
    if (missingAppPaths.length) {
      reasons.push({
        code: "MISSING_APP_PATH",
        detail: missingAppPaths.join(", ")
      });
    } else {
      checks.app_paths_complete = true;
    }
  }

  const candidate = isPlainObject(input.candidate) ? input.candidate : null;
  let candidateRoutes = [];
  let missingCandidateRoutes = [...contract.required_candidate_output_routes];
  if (!candidate) {
    reasons.push({
      code: "CANDIDATE_REQUIRED",
      detail: "A parsed Vercel candidate inspection object is required."
    });
  } else {
    if (candidate.name !== contract.candidate.name) {
      reasons.push({
        code: "CANDIDATE_NAME_MISMATCH",
        detail: `Candidate name ${display(candidate.name)} does not equal ${contract.candidate.name}.`
      });
    } else {
      checks.candidate_name_matches = true;
    }

    if (candidate.target !== contract.candidate.target) {
      reasons.push({
        code: "CANDIDATE_TARGET_MISMATCH",
        detail: `Candidate target ${display(candidate.target)} does not equal ${contract.candidate.target}.`
      });
    } else {
      checks.candidate_target_matches = true;
    }

    if (candidate.readyState !== contract.candidate.ready_state) {
      reasons.push({
        code: "CANDIDATE_NOT_READY",
        detail: `Candidate readyState ${display(candidate.readyState)} does not equal ${contract.candidate.ready_state}.`
      });
    } else {
      checks.candidate_ready = true;
    }

    candidateRoutes = collectCandidateRoutes(candidate);
    const present = new Set(candidateRoutes);
    missingCandidateRoutes = contract.required_candidate_output_routes.filter((route) => !present.has(route));
    if (missingCandidateRoutes.length) {
      reasons.push({
        code: "MISSING_CANDIDATE_OUTPUT_ROUTE",
        detail: missingCandidateRoutes.join(", ")
      });
    } else {
      checks.candidate_routes_complete = true;
    }
  }

  return resultFromReasons(reasons, checks, {
    head_sha: headSha || null,
    approved_sha: approvedSha || null,
    dirty: typeof input.dirty === "boolean" ? input.dirty : null,
    candidate_name: candidate?.name ?? null,
    candidate_target: candidate?.target ?? null,
    candidate_ready_state: candidate?.readyState ?? null,
    app_path_count: appPathKeys?.length ?? 0,
    candidate_route_count: candidateRoutes.length,
    missing_app_paths: missingAppPaths,
    missing_candidate_routes: missingCandidateRoutes
  });
}

export function collectCandidateRoutes(candidate) {
  if (!isPlainObject(candidate)) return [];

  const entries = [];
  if (Array.isArray(candidate.output)) entries.push(...candidate.output);
  if (Array.isArray(candidate.outputs)) entries.push(...candidate.outputs);
  if (Array.isArray(candidate.builds)) {
    for (const build of candidate.builds) {
      if (Array.isArray(build?.output)) entries.push(...build.output);
    }
  }

  return [...new Set(entries.map(routeFromOutputEntry).filter(Boolean))].sort();
}

function routeFromOutputEntry(entry) {
  const value = typeof entry === "string" ? entry : entry?.path;
  return String(value ?? "")
    .trim()
    .replace(/^\/+|\/+$/g, "");
}

function manifestKeys(manifest) {
  if (!isPlainObject(manifest)) return null;
  return Object.keys(manifest);
}

function validateContract(contract) {
  if (!isPlainObject(contract)) return { ok: false, detail: "Contract must be a JSON object." };
  if (contract.schema !== "werkles.production-release-contract/v1") {
    return { ok: false, detail: "Unsupported or missing contract schema." };
  }
  if (!isPlainObject(contract.candidate)) {
    return { ok: false, detail: "Contract candidate must be an object." };
  }
  for (const field of ["name", "target", "ready_state"]) {
    if (!nonEmptyString(contract.candidate[field])) {
      return { ok: false, detail: `Contract candidate.${field} must be a non-empty string.` };
    }
  }
  for (const field of ["required_app_paths", "required_candidate_output_routes"]) {
    if (!Array.isArray(contract[field]) || !contract[field].length || !contract[field].every(nonEmptyString)) {
      return { ok: false, detail: `Contract ${field} must be a non-empty string array.` };
    }
  }
  return { ok: true, contract };
}

function resultFromReasons(reasons, checks, evidence) {
  const result = reasons.length ? "STOP" : "PASS";
  return {
    ok: result === "PASS",
    receipt: {
      schema: "werkles.production-release-integrity-receipt/v1",
      result,
      checks,
      evidence,
      reasons
    }
  };
}

function emptyChecks() {
  return {
    worktree_clean: false,
    head_matches_approved_sha: false,
    app_paths_complete: false,
    candidate_name_matches: false,
    candidate_target_matches: false,
    candidate_ready: false,
    candidate_routes_complete: false
  };
}

function emptyEvidence(input) {
  return {
    head_sha: normalizeSha(input.headSha) || null,
    approved_sha: normalizeSha(input.approvedSha) || null,
    dirty: typeof input.dirty === "boolean" ? input.dirty : null,
    candidate_name: input.candidate?.name ?? null,
    candidate_target: input.candidate?.target ?? null,
    candidate_ready_state: input.candidate?.readyState ?? null,
    app_path_count: 0,
    candidate_route_count: 0,
    missing_app_paths: [],
    missing_candidate_routes: []
  };
}

function normalizeSha(value) {
  return String(value ?? "").trim().toLowerCase();
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function display(value) {
  const text = String(value ?? "").trim();
  return text || "<missing>";
}

function parseArgs(argv) {
  const input = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => argv[++index] ?? "";

    if (arg === "--approved-sha") input.approvedSha = next();
    else if (arg === "--candidate") input.candidatePath = next();
    else if (arg === "--contract") input.contractPath = next();
    else if (arg === "--app-paths-manifest") input.appPathsManifestPath = next();
    else if (arg === "--repo-root") input.repoRoot = next();
    else if (arg === "--json") input.json = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return input;
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function gitOutput(repoRoot, args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  }).trim();
}

function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (!args.approvedSha) throw new Error("--approved-sha is required.");
    if (!args.candidatePath) throw new Error("--candidate is required.");

    const repoRoot = path.resolve(args.repoRoot ?? process.cwd());
    const contractPath = path.resolve(repoRoot, args.contractPath ?? DEFAULT_RELEASE_CONTRACT);
    const manifestPath = path.resolve(repoRoot, args.appPathsManifestPath ?? DEFAULT_APP_PATHS_MANIFEST);
    const candidatePath = path.resolve(repoRoot, args.candidatePath);
    const headSha = gitOutput(repoRoot, ["rev-parse", "HEAD"]);
    const dirty = gitOutput(repoRoot, ["status", "--porcelain=v1"]).length > 0;

    const result = evaluateProductionReleaseIntegrity({
      contract: readJson(contractPath),
      dirty,
      headSha,
      approvedSha: args.approvedSha,
      appPathsManifest: readJson(manifestPath),
      candidate: readJson(candidatePath)
    });

    if (args.json) {
      console.log(JSON.stringify(result.receipt, null, 2));
    } else {
      console.log(`release_guard_result=${result.receipt.result}`);
      console.log(`head_sha=${result.receipt.evidence.head_sha ?? ""}`);
      console.log(`approved_sha=${result.receipt.evidence.approved_sha ?? ""}`);
      for (const reason of result.receipt.reasons) {
        console.log(`reason=${reason.code}: ${reason.detail}`);
      }
    }

    process.exit(result.ok ? 0 : 1);
  } catch (error) {
    console.error(`release_guard_error=${error.message}`);
    process.exit(2);
  }
}

const thisFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === thisFile) {
  main();
}
