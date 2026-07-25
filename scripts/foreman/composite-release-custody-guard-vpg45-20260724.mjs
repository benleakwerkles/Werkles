#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const RELEASE_CUSTODY_REQUEST_SCHEMA =
  "werkles.production-release-custody-request/v1";
export const RELEASE_CUSTODY_TRUSTED_SCHEMA =
  "werkles.production-release-custody-trusted-evidence/v1";
export const REQUIRED_PRODUCTION_RELEASE_PHRASE =
  "APPROVE WERKLES PRODUCTION RELEASE";
export const REQUIRED_PRODUCTION_RELEASE_SCOPE =
  "PRODUCTION_DEPLOY_AND_ALIAS";

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonicalize(value[key])])
  );
}

function digest(value) {
  return createHash("sha256")
    .update(JSON.stringify(canonicalize(value)))
    .digest("hex");
}

function withoutSnapshotDigest(trustedEvidence) {
  if (!trustedEvidence || typeof trustedEvidence !== "object") return trustedEvidence;
  const { snapshotDigest: _snapshotDigest, ...body } = trustedEvidence;
  return body;
}

export function trustedEvidenceDigest(trustedEvidence) {
  return digest(withoutSnapshotDigest(trustedEvidence));
}

function normalizedAliases(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(
    value
      .map((alias) => String(alias ?? "").trim().toLowerCase())
      .filter(Boolean)
  )].sort();
}

function aliasesEqual(left, right) {
  const a = normalizedAliases(left);
  const b = normalizedAliases(right);
  return a.length === b.length && a.every((alias, index) => alias === b[index]);
}

function sha(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return /^[a-f0-9]{40}$/.test(normalized) ? normalized : "";
}

function deploymentId(value) {
  const normalized = String(value ?? "").trim();
  return /^dpl_[A-Za-z0-9]+$/.test(normalized) ? normalized : "";
}

function recordDigest(value) {
  return /^[a-f0-9]{64}$/i.test(String(value ?? "").trim());
}

export function evaluateCompositeReleaseCustody(request = {}, trustedEvidence = {}) {
  request =
    request && typeof request === "object" && !Array.isArray(request) ? request : {};
  trustedEvidence =
    trustedEvidence && typeof trustedEvidence === "object" && !Array.isArray(trustedEvidence)
      ? trustedEvidence
      : {};
  const reasons = [];
  const stop = (code, detail) => {
    if (!reasons.some((reason) => reason.code === code)) reasons.push({ code, detail });
  };

  if (request.schema !== RELEASE_CUSTODY_REQUEST_SCHEMA) {
    stop("INVALID_REQUEST_SCHEMA", request.schema ?? null);
  }
  if (trustedEvidence.schema !== RELEASE_CUSTODY_TRUSTED_SCHEMA) {
    stop("TRUSTED_EVIDENCE_REQUIRED", trustedEvidence.schema ?? null);
  }

  const observedDigest =
    trustedEvidence.schema === RELEASE_CUSTODY_TRUSTED_SCHEMA
      ? trustedEvidenceDigest(trustedEvidence)
      : null;
  if (
    !observedDigest ||
    trustedEvidence.snapshotDigest !== observedDigest ||
    request.evidenceDigest !== observedDigest
  ) {
    stop("EVIDENCE_DIGEST_MISMATCH", {
      request: request.evidenceDigest ?? null,
      trusted: trustedEvidence.snapshotDigest ?? null,
      observed: observedDigest
    });
  }

  const git = trustedEvidence.git ?? {};
  if (git.dirty !== false) stop("DIRTY_WORKTREE", git.dirty ?? null);
  if (git.untrackedCount !== 0) stop("UNTRACKED_EVIDENCE", git.untrackedCount ?? null);
  if (
    typeof request.branch !== "string" ||
    !request.branch.trim() ||
    typeof git.branch !== "string" ||
    !git.branch.trim() ||
    request.branch !== git.branch
  ) {
    stop("BRANCH_MISMATCH", { request: request.branch ?? null, observed: git.branch ?? null });
  }

  const requestHead = sha(request.headSha);
  const observedHead = sha(git.headSha);
  if (!requestHead || requestHead !== observedHead) {
    stop("HEAD_MISMATCH", { request: request.headSha ?? null, observed: git.headSha ?? null });
  }
  if (!observedHead || sha(git.upstreamSha) !== observedHead) {
    stop("UPSTREAM_MISMATCH", { head: git.headSha ?? null, upstream: git.upstreamSha ?? null });
  }

  const release = trustedEvidence.release ?? {};
  const requestCandidateDeployment = deploymentId(request.candidateDeploymentId);
  const releaseCandidateDeployment = deploymentId(release.candidateDeploymentId);
  const requestProductionDeployment = deploymentId(request.productionDeploymentId);
  const releaseProductionDeployment = deploymentId(release.productionDeploymentId);
  if (release.result !== "PASS") {
    stop("RELEASE_INTEGRITY_NOT_PASS", release.result ?? null);
  }
  if (
    sha(release.headSha) !== requestHead ||
    !requestCandidateDeployment ||
    !releaseCandidateDeployment ||
    releaseCandidateDeployment !== requestCandidateDeployment ||
    !requestProductionDeployment ||
    !releaseProductionDeployment ||
    releaseProductionDeployment !== requestProductionDeployment ||
    !recordDigest(release.recordDigest)
  ) {
    stop("RELEASE_BINDING_MISMATCH", {
      headSha: release.headSha ?? null,
      candidateDeploymentId: release.candidateDeploymentId ?? null,
      productionDeploymentId: release.productionDeploymentId ?? null
    });
  }

  if (
    !requestCandidateDeployment ||
    !releaseCandidateDeployment ||
    requestCandidateDeployment !== releaseCandidateDeployment
  ) {
    stop("CANDIDATE_DEPLOYMENT_MISMATCH", request.candidateDeploymentId ?? null);
  }
  if (sha(release.candidateSourceSha) !== requestHead) {
    stop("CANDIDATE_SOURCE_MISMATCH", release.candidateSourceSha ?? null);
  }
  if (
    !requestProductionDeployment ||
    !releaseProductionDeployment ||
    requestProductionDeployment !== releaseProductionDeployment
  ) {
    stop("PRODUCTION_DEPLOYMENT_MISMATCH", request.productionDeploymentId ?? null);
  }

  const rollback = trustedEvidence.rollback ?? {};
  const requestRollbackDeployment = deploymentId(request.rollbackDeploymentId);
  const observedRollbackDeployment = deploymentId(rollback.deploymentId);
  if (
    !requestRollbackDeployment ||
    !observedRollbackDeployment ||
    requestRollbackDeployment !== observedRollbackDeployment
  ) {
    stop("ROLLBACK_DEPLOYMENT_MISMATCH", {
      request: request.rollbackDeploymentId ?? null,
      observed: rollback.deploymentId ?? null
    });
  }
  if (rollback.isCoexistence !== false) {
    stop("ROLLBACK_MISLABELED_AS_COEXISTENCE", rollback.isCoexistence ?? null);
  }

  const requestAliases = normalizedAliases(request.aliases);
  const observedAliases = normalizedAliases(trustedEvidence.aliases);
  if (
    requestAliases.length === 0 ||
    observedAliases.length === 0 ||
    !aliasesEqual(requestAliases, observedAliases)
  ) {
    stop("ALIAS_SET_MISMATCH", {
      request: requestAliases,
      observed: observedAliases
    });
  }

  const cycle = trustedEvidence.cycle ?? {};
  if (
    cycle.status !== "COMPLETED" ||
    cycle.guardResult !== "PASS" ||
    !recordDigest(cycle.recordDigest)
  ) {
    stop("CYCLE_INCOMPLETE", {
      status: cycle.status ?? null,
      guardResult: cycle.guardResult ?? null
    });
  }
  if (request.cycleId !== cycle.id || request.legacyLabel !== cycle.legacyLabel) {
    stop("CYCLE_MISMATCH", {
      request: [request.cycleId ?? null, request.legacyLabel ?? null],
      observed: [cycle.id ?? null, cycle.legacyLabel ?? null]
    });
  }

  const j = trustedEvidence.j;
  if (!j || j.result !== "PASS" || !recordDigest(j.recordDigest)) {
    stop("J_RECEIPT_MISSING", j?.result ?? null);
  } else {
    if (j.cycleId !== request.cycleId || j.legacyLabel !== request.legacyLabel) {
      stop("J_CYCLE_MISMATCH", {
        request: [request.cycleId ?? null, request.legacyLabel ?? null],
        observed: [j.cycleId ?? null, j.legacyLabel ?? null]
      });
    }
    if (
      j.branch !== request.branch ||
      sha(j.headSha) !== requestHead ||
      sha(j.upstreamSha) !== requestHead ||
      j.remoteEqual !== true
    ) {
      stop("J_BINDING_MISMATCH", {
        branch: j.branch ?? null,
        headSha: j.headSha ?? null,
        upstreamSha: j.upstreamSha ?? null,
        remoteEqual: j.remoteEqual ?? null
      });
    }
  }

  const approval = trustedEvidence.approval;
  if (
    !approval ||
    approval.authoritative !== true ||
    approval.recordPresent !== true ||
    approval.sourcePath !== "foreman/gates/APPROVAL_LOG.md" ||
    !recordDigest(approval.recordDigest)
  ) {
    stop("APPROVAL_RECORD_NOT_AUTHORITATIVE", approval?.sourcePath ?? null);
  } else {
    if (
      approval.scope !== REQUIRED_PRODUCTION_RELEASE_SCOPE ||
      approval.decision !== "APPROVE" ||
      approval.phrase !== REQUIRED_PRODUCTION_RELEASE_PHRASE
    ) {
      stop("APPROVAL_SCOPE_MISMATCH", {
        scope: approval.scope ?? null,
        decision: approval.decision ?? null,
        phrase: approval.phrase ?? null
      });
    }
    if (
      approval.cycleId !== request.cycleId ||
      approval.legacyLabel !== request.legacyLabel ||
      approval.branch !== request.branch ||
      sha(approval.headSha) !== requestHead ||
      deploymentId(approval.candidateDeploymentId) !== deploymentId(request.candidateDeploymentId) ||
      deploymentId(approval.productionDeploymentId) !== deploymentId(request.productionDeploymentId) ||
      deploymentId(approval.rollbackDeploymentId) !== deploymentId(request.rollbackDeploymentId) ||
      !aliasesEqual(approval.aliases, request.aliases) ||
      approval.harveyMode !== request.harveyMode
    ) {
      stop("APPROVAL_BINDING_MISMATCH", {
        cycleId: approval.cycleId ?? null,
        branch: approval.branch ?? null,
        headSha: approval.headSha ?? null
      });
    }
  }

  const harvey = trustedEvidence.harvey ?? {};
  if (
    harvey.result !== "PASS" ||
    harvey.state !== "RESOLVED" ||
    !harvey.mode
  ) {
    stop("HARVEY_DISPOSITION_UNRESOLVED", {
      result: harvey.result ?? null,
      state: harvey.state ?? null,
      mode: harvey.mode ?? null
    });
  }
  if (
    harvey.authority !== "HUMAN_GATE_APPROVAL_LOG" ||
    harvey.executionAuthorized !== true ||
    harvey.recordPresent !== true ||
    !recordDigest(harvey.recordDigest)
  ) {
    stop("HARVEY_AUTHORITY_MISSING", {
      authority: harvey.authority ?? null,
      executionAuthorized: harvey.executionAuthorized ?? null
    });
  }
  if (
    harvey.cycleId !== request.cycleId ||
    harvey.mode !== request.harveyMode ||
    deploymentId(harvey.candidateDeploymentId) !== deploymentId(request.candidateDeploymentId) ||
    deploymentId(harvey.productionDeploymentId) !== deploymentId(request.productionDeploymentId) ||
    deploymentId(harvey.rollbackDeploymentId) !== deploymentId(request.rollbackDeploymentId)
  ) {
    stop("HARVEY_BINDING_MISMATCH", {
      cycleId: harvey.cycleId ?? null,
      mode: harvey.mode ?? null
    });
  }

  const result = reasons.length ? "STOP" : "PASS";
  const receipt = {
    schema: "werkles.production-release-custody-receipt/v1",
    evidenceAuthority: "UNVERIFIED_CALLER_INPUT",
    result,
    evaluatedEvidenceDigest: observedDigest,
    bindings: {
      branch: request.branch ?? null,
      headSha: requestHead || null,
      candidateDeploymentId: request.candidateDeploymentId ?? null,
      productionDeploymentId: request.productionDeploymentId ?? null,
      rollbackDeploymentId: request.rollbackDeploymentId ?? null,
      aliases: normalizedAliases(request.aliases),
      cycleId: request.cycleId ?? null,
      legacyLabel: request.legacyLabel ?? null,
      harveyMode: request.harveyMode ?? null
    },
    reasons
  };

  return { ok: result === "PASS", result, reasons, receipt };
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => argv[++index] ?? "";
    if (arg === "--request") args.requestPath = next();
    else if (arg === "--trusted-evidence") args.trustedEvidencePath = next();
    else if (arg === "--json") args.json = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (!args.requestPath) throw new Error("--request is required.");
    if (!args.trustedEvidencePath) throw new Error("--trusted-evidence is required.");
    const request = JSON.parse(readFileSync(path.resolve(args.requestPath), "utf8"));
    const trustedEvidence = JSON.parse(
      readFileSync(path.resolve(args.trustedEvidencePath), "utf8")
    );
    const evaluated = evaluateCompositeReleaseCustody(request, trustedEvidence);
    const cliReceipt = evaluated.ok
      ? {
          ...evaluated.receipt,
          result: "STOP",
          reasons: [
            ...evaluated.receipt.reasons,
            {
              code: "NON_AUTHORITATIVE_EVIDENCE_SOURCE",
              detail:
                "Raw --trusted-evidence JSON is test input, not independently collected release authority."
            }
          ]
        }
      : evaluated.receipt;
    console.log(args.json
      ? JSON.stringify(cliReceipt, null, 2)
      : `release_custody_result=${cliReceipt.result}`);
    process.exit(cliReceipt.result === "PASS" ? 0 : 1);
  } catch (error) {
    console.error(`release_custody_error=${error.message}`);
    process.exit(2);
  }
}

const thisFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === thisFile) main();
