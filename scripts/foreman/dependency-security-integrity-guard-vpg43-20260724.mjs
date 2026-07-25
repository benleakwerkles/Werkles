#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const DEFAULT_CONTRACT_PATH =
  "scripts/foreman/fixtures/vpg43-dependency-security-candidate-20260724.json";

function normalized(value) {
  if (Array.isArray(value)) return value.map(normalized);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, normalized(entry)])
    );
  }
  return value;
}

function sameJson(left, right) {
  return JSON.stringify(normalized(left)) === JSON.stringify(normalized(right));
}

function versionParts(version) {
  const match = String(version ?? "").match(/^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/);
  return match ? match.slice(1).map(Number) : null;
}

export function compareVersions(left, right) {
  const leftParts = versionParts(left);
  const rightParts = versionParts(right);
  if (!leftParts || !rightParts) return null;
  for (let index = 0; index < 3; index += 1) {
    if (leftParts[index] !== rightParts[index]) return leftParts[index] - rightParts[index];
  }
  return 0;
}

function versionInRange(version, minimum, maximumExclusive) {
  const minimumComparison = compareVersions(version, minimum);
  const maximumComparison = compareVersions(version, maximumExclusive);
  return minimumComparison !== null && maximumComparison !== null
    && minimumComparison >= 0 && maximumComparison < 0;
}

function packageNodes(lock, packageName) {
  const suffix = `/node_modules/${packageName}`;
  return Object.entries(lock?.packages ?? {})
    .filter(([nodePath]) => nodePath === `node_modules/${packageName}` || nodePath.endsWith(suffix))
    .map(([nodePath, metadata]) => ({
      path: nodePath,
      version: metadata?.version,
      resolved: metadata?.resolved,
      integrity: metadata?.integrity
    }))
    .sort((left, right) => left.path.localeCompare(right.path));
}

function nextFamilyNodes(lock) {
  return Object.entries(lock?.packages ?? {})
    .filter(([nodePath]) =>
      nodePath === "node_modules/@next/env"
      || /(?:^|\/)node_modules\/@next\/swc-[^/]+$/.test(nodePath)
    )
    .map(([nodePath, metadata]) => ({
      path: nodePath,
      version: metadata?.version,
      resolved: metadata?.resolved,
      integrity: metadata?.integrity
    }))
    .sort((left, right) => left.path.localeCompare(right.path));
}

function auditSeverityCount(audit, severity) {
  const value = audit?.metadata?.vulnerabilities?.[severity];
  return Number.isInteger(value) ? value : null;
}

export function evaluateDependencySecurityIntegrity(input) {
  const reasons = [];
  const stop = (code, detail) => reasons.push({ code, detail });
  const { contract, manifest, lock, audit, auditError } = input;

  if (contract?.schema !== "werkles.vpg43-dependency-security-contract/v1") {
    stop("CONTRACT_SCHEMA_MISMATCH", contract?.schema ?? null);
  }

  if (manifest?.name !== contract?.root?.name || manifest?.version !== contract?.root?.version) {
    stop("ROOT_IDENTITY_MISMATCH", {
      actual: { name: manifest?.name, version: manifest?.version },
      expected: contract?.root
    });
  }

  if (!sameJson(manifest?.dependencies ?? {}, contract?.root?.dependencies ?? {})) {
    stop("ROOT_DEPENDENCY_SURFACE_MISMATCH", manifest?.dependencies ?? {});
  }
  if (!sameJson(manifest?.devDependencies ?? {}, contract?.root?.devDependencies ?? {})) {
    stop("ROOT_DEV_DEPENDENCY_SURFACE_MISMATCH", manifest?.devDependencies ?? {});
  }
  if (!sameJson(manifest?.optionalDependencies ?? {}, contract?.root?.optionalDependencies ?? {})) {
    stop("ROOT_OPTIONAL_DEPENDENCY_SURFACE_MISMATCH", manifest?.optionalDependencies ?? {});
  }
  if (!sameJson(manifest?.overrides ?? {}, contract?.root?.overrides ?? {})) {
    stop("DEPENDENCY_OVERRIDE_MISMATCH", manifest?.overrides ?? {});
  }

  if (lock?.lockfileVersion !== contract?.lockfile_version) {
    stop("LOCKFILE_VERSION_MISMATCH", lock?.lockfileVersion ?? null);
  }

  const lockRoot = lock?.packages?.[""];
  if (!lockRoot) {
    stop("LOCK_ROOT_MISSING", null);
  } else {
    for (const surface of ["dependencies", "devDependencies", "optionalDependencies"]) {
      if (!sameJson(lockRoot[surface] ?? {}, manifest?.[surface] ?? {})) {
        stop("LOCK_ROOT_SURFACE_MISMATCH", surface);
      }
    }
  }

  const nextNodes = packageNodes(lock, "next");
  const postcssNodes = packageNodes(lock, "postcss");
  const sharpNodes = packageNodes(lock, "sharp");
  const familyNodes = nextFamilyNodes(lock);

  for (const [name, nodes] of [
    ["NEXT", nextNodes],
    ["POSTCSS", postcssNodes],
    ["SHARP", sharpNodes]
  ]) {
    if (nodes.length === 0) stop(`${name}_NODE_MISSING`, null);
  }

  for (const node of nextNodes) {
    if (!versionInRange(
      node.version,
      contract?.versions?.next?.minimum,
      contract?.versions?.next?.maximum_exclusive
    )) {
      stop("NEXT_VERSION_OUT_OF_RANGE", { path: node.path, version: node.version });
    }
  }

  for (const node of postcssNodes) {
    if (!versionInRange(
      node.version,
      contract?.versions?.postcss?.minimum,
      contract?.versions?.postcss?.maximum_exclusive
    )) {
      stop("POSTCSS_VERSION_OUT_OF_RANGE", { path: node.path, version: node.version });
    }
  }

  for (const node of sharpNodes) {
    if (!versionInRange(
      node.version,
      contract?.versions?.sharp?.minimum,
      contract?.versions?.sharp?.maximum_exclusive
    )) {
      stop("SHARP_VERSION_OUT_OF_RANGE", { path: node.path, version: node.version });
    }
  }

  const nextVersion = nextNodes[0]?.version;
  if (familyNodes.length === 0) stop("NEXT_FAMILY_NODE_MISSING", null);
  for (const node of familyNodes) {
    if (node.version !== nextVersion) {
      stop("NEXT_FAMILY_VERSION_MISMATCH", {
        path: node.path,
        version: node.version,
        next: nextVersion
      });
    }
  }

  for (const node of [...nextNodes, ...postcssNodes, ...sharpNodes, ...familyNodes]) {
    if (typeof node.integrity !== "string" || !node.integrity.startsWith("sha512-")) {
      stop("LOCK_INTEGRITY_MISSING", node.path);
    }
    if (typeof node.resolved !== "string" || !node.resolved.startsWith("https://registry.npmjs.org/")) {
      stop("LOCK_RESOLUTION_UNTRUSTED", { path: node.path, resolved: node.resolved ?? null });
    }
  }

  if (auditError) stop("AUDIT_COMMAND_FAILED", auditError);
  if (audit?.auditReportVersion !== 2) {
    stop("AUDIT_EVIDENCE_REQUIRED", audit?.auditReportVersion ?? null);
  } else {
    const high = auditSeverityCount(audit, "high");
    const critical = auditSeverityCount(audit, "critical");
    if (high === null || critical === null) {
      stop("AUDIT_COUNTS_MISSING", audit?.metadata?.vulnerabilities ?? null);
    } else {
      if (high > contract.audit.maximum_high) stop("AUDIT_HIGH_REMAINS", high);
      if (critical > contract.audit.maximum_critical) stop("AUDIT_CRITICAL_REMAINS", critical);
    }

    for (const vulnerability of Object.values(audit.vulnerabilities ?? {})) {
      if (vulnerability?.severity === "high" || vulnerability?.severity === "critical") {
        stop("AUDIT_SEVERE_VULNERABILITY_PRESENT", {
          name: vulnerability.name,
          severity: vulnerability.severity
        });
      }
    }
  }

  return {
    pass: reasons.length === 0,
    reasons,
    evidence: {
      next: nextNodes,
      postcss: postcssNodes,
      sharp: sharpNodes,
      next_family_nodes: familyNodes.length,
      audit: {
        high: auditSeverityCount(audit, "high"),
        critical: auditSeverityCount(audit, "critical"),
        total: audit?.metadata?.vulnerabilities?.total ?? null
      }
    }
  };
}

function readJson(root, relativePath) {
  return JSON.parse(readFileSync(path.join(root, relativePath), "utf8"));
}

function freshProductionAudit(root) {
  const command = process.platform === "win32" ? (process.env.ComSpec || "cmd.exe") : "npm";
  const args = process.platform === "win32"
    ? ["/d", "/s", "/c", "npm.cmd audit --omit=dev --json"]
    : ["audit", "--omit=dev", "--json"];
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    windowsHide: true
  });

  if (result.error) return { audit: null, auditError: result.error.message };
  try {
    return { audit: JSON.parse(result.stdout), auditError: null };
  } catch (error) {
    return {
      audit: null,
      auditError: `Unable to parse npm audit JSON (exit ${result.status}): ${error.message}`
    };
  }
}

function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const contractPath = process.argv[2] || DEFAULT_CONTRACT_PATH;
  const contract = readJson(root, contractPath);
  const manifest = readJson(root, "package.json");
  const lock = readJson(root, "package-lock.json");
  const { audit, auditError } = freshProductionAudit(root);
  const result = evaluateDependencySecurityIntegrity({
    contract,
    manifest,
    lock,
    audit,
    auditError
  });
  console.log(JSON.stringify({ ...result, contract: contractPath }, null, 2));
  process.exitCode = result.pass ? 0 : 1;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) main();
