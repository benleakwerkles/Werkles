#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const INBOX = "foreman/nerdkle/source_intake/inbox";
const OUTPUT_PATH = "foreman/artifacts/nerdkle_github_source_material_status.json";
const DEFAULT_SOURCE_CLONE = "C:\\Users\\benle\\Desktop\\github\\Werkles";

const VALID_SOURCE_TYPES = new Set([
  "book_architecture",
  "nerdkle_nervous_system",
  "nmclr_proof_body",
  "receipt_crawler",
  "speaker_lore",
  "operator_note",
]);

const VALID_CANONICALITY = new Set([
  "canonical",
  "review_branch",
  "manuscript_only",
  "preserved_only",
  "pending_real_inputs",
  "blocked",
]);

function abs(relPath) {
  return path.join(ROOT, relPath);
}

function exists(relPath) {
  return fs.existsSync(abs(relPath));
}

function readText(relPath) {
  return fs.readFileSync(abs(relPath), "utf8");
}

function readJson(relPath) {
  return JSON.parse(readText(relPath));
}

function listInboxFiles() {
  if (!exists(INBOX)) return [];
  return fs.readdirSync(abs(INBOX), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => path.join(INBOX, entry.name).replace(/\\/g, "/"))
    .sort();
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    windowsHide: true,
    ...options,
  });
  if (result.status !== 0) {
    const stderr = (result.stderr || "").trim();
    const stdout = (result.stdout || "").trim();
    const details = stderr || stdout || `${command} exited ${result.status}`;
    throw new Error(details);
  }
  return (result.stdout || "").trim();
}

function sourceClonePath() {
  return process.env.NERDKLE_GITHUB_SOURCE_CLONE || DEFAULT_SOURCE_CLONE;
}

function hasLocalGitClone(clonePath) {
  return fs.existsSync(path.join(clonePath, ".git"));
}

function git(clonePath, args) {
  return run("git", args, { cwd: clonePath });
}

function gitOk(clonePath, args) {
  const result = spawnSync("git", args, {
    cwd: clonePath,
    encoding: "utf8",
    windowsHide: true,
  });
  return result.status === 0;
}

function validateManifest(manifest) {
  const missing = [];
  for (const field of [
    "source_id",
    "source_type",
    "title",
    "repository_url",
    "branch",
    "commit",
    "packet_path",
    "artifact_paths",
    "canonicality",
    "source_status",
    "evidence_scope",
    "proof_boundary",
    "observed_at",
  ]) {
    if (!Object.prototype.hasOwnProperty.call(manifest, field)) missing.push(field);
  }
  if (!/^[a-f0-9]{40}$/.test(manifest.commit || "")) missing.push("commit_sha40");
  if (!VALID_SOURCE_TYPES.has(manifest.source_type)) missing.push("valid_source_type");
  if (!VALID_CANONICALITY.has(manifest.canonicality)) missing.push("valid_canonicality");
  if (!Array.isArray(manifest.artifact_paths) || manifest.artifact_paths.length === 0) {
    missing.push("artifact_paths");
  }
  return missing;
}

function sha256(text) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

function readGitFile(clonePath, ref, relPath) {
  return git(clonePath, ["show", `${ref}:${relPath}`]);
}

function fileExistsAtRef(clonePath, ref, relPath) {
  return gitOk(clonePath, ["cat-file", "-e", `${ref}:${relPath}`]);
}

function loadPacket(clonePath, ref, packetPath) {
  try {
    return JSON.parse(readGitFile(clonePath, ref, packetPath));
  } catch (error) {
    return {
      parse_error: error.message,
    };
  }
}

function verifyManifest(manifestPath, clonePath, localCloneAvailable) {
  const manifest = readJson(manifestPath);
  const validationMissing = validateManifest(manifest);
  const ref = `origin/${manifest.branch}`;
  const result = {
    manifest_path: manifestPath,
    source_id: manifest.source_id || null,
    title: manifest.title || null,
    source_type: manifest.source_type || null,
    repository_url: manifest.repository_url || null,
    branch: manifest.branch || null,
    branch_ref: ref,
    expected_commit: manifest.commit || null,
    actual_commit: null,
    commit_match: false,
    canonicality: manifest.canonicality || null,
    source_status: manifest.source_status || null,
    evidence_scope: manifest.evidence_scope || null,
    proof_boundary: manifest.proof_boundary || null,
    packet_path: manifest.packet_path || null,
    packet: null,
    artifact_checks: [],
    status: "REJECTED_SOURCE",
    blockers: [],
  };

  if (validationMissing.length) {
    result.blockers.push(...validationMissing.map((field) => `missing_or_invalid:${field}`));
    return result;
  }

  if (!localCloneAvailable) {
    result.blockers.push(`missing_local_github_clone:${clonePath}`);
    result.status = "BLOCKED_SOURCE";
    return result;
  }

  try {
    result.actual_commit = git(clonePath, ["rev-parse", `${ref}^{commit}`]);
  } catch (error) {
    result.blockers.push(`missing_branch_ref:${ref}`);
    result.status = "BLOCKED_SOURCE";
    return result;
  }

  result.commit_match = result.actual_commit === manifest.commit;
  if (!result.commit_match) {
    result.blockers.push(`commit_mismatch:${result.actual_commit}`);
  }

  if (!fileExistsAtRef(clonePath, ref, manifest.packet_path)) {
    result.blockers.push(`missing_packet_path:${manifest.packet_path}`);
  } else {
    result.packet = loadPacket(clonePath, ref, manifest.packet_path);
  }

  for (const artifactPath of manifest.artifact_paths) {
    const artifact = {
      path: artifactPath,
      exists: fileExistsAtRef(clonePath, ref, artifactPath),
      sha256: null,
      byte_count: null,
    };
    if (artifact.exists) {
      const text = readGitFile(clonePath, ref, artifactPath);
      artifact.sha256 = sha256(text);
      artifact.byte_count = Buffer.byteLength(text, "utf8");
    } else {
      result.blockers.push(`missing_artifact_path:${artifactPath}`);
    }
    result.artifact_checks.push(artifact);
  }

  result.status = result.blockers.length ? "BLOCKED_SOURCE" : "VERIFIED_GITHUB_SOURCE";
  return result;
}

function main() {
  const clonePath = sourceClonePath();
  const localCloneAvailable = hasLocalGitClone(clonePath);
  const manifestPaths = listInboxFiles();
  const sources = manifestPaths.map((manifestPath) => verifyManifest(manifestPath, clonePath, localCloneAvailable));
  const verified = sources.filter((source) => source.status === "VERIFIED_GITHUB_SOURCE");
  const blocked = sources.filter((source) => source.status !== "VERIFIED_GITHUB_SOURCE");
  const canonicalSources = verified.filter((source) => source.canonicality === "canonical");
  const reviewSources = verified.filter((source) => source.canonicality !== "canonical");

  const report = {
    artifact_id: "NERDKLE_GITHUB_SOURCE_MATERIAL_STATUS",
    generated_at: new Date().toISOString(),
    status: blocked.length
      ? verified.length ? "PASS_GITHUB_SOURCE_INTAKE_WITH_BLOCKERS" : "BLOCKED_GITHUB_SOURCE_INTAKE"
      : "PASS_GITHUB_SOURCE_INTAKE",
    rule: "GitHub source material proves branch/object existence only. It does not promote review branches or convert manuscript into automation proof.",
    source_clone_path: clonePath,
    local_clone_available: localCloneAvailable,
    manifest_count: sources.length,
    verified_count: verified.length,
    blocked_count: blocked.length,
    canonical_count: canonicalSources.length,
    review_branch_count: reviewSources.length,
    source_ids: verified.map((source) => source.source_id),
    remaining_boundaries: verified
      .filter((source) => source.canonicality !== "canonical")
      .map((source) => ({
        source_id: source.source_id,
        canonicality: source.canonicality,
        source_status: source.source_status,
        proof_boundary: source.proof_boundary,
      })),
    sources,
  };

  fs.mkdirSync(abs(path.dirname(OUTPUT_PATH)), { recursive: true });
  fs.writeFileSync(abs(OUTPUT_PATH), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`${report.status}: wrote ${OUTPUT_PATH}`);
  console.log(`verified_count=${report.verified_count} blocked_count=${report.blocked_count} canonical_count=${report.canonical_count}`);

  if (report.status === "BLOCKED_GITHUB_SOURCE_INTAKE") process.exit(1);
}

try {
  main();
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exit(1);
}
