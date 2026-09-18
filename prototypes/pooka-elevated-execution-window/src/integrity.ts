import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import type { IntegrityManifest, WorkerConfig } from "./types.ts";
import { NAMED_OPERATIONS } from "./types.ts";

const SRC_DIR = path.dirname(fileURLToPath(import.meta.url));

export function sha256Text(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

export function sha256File(filePath: string): string {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

/** Hash the protected worker surface: core modules + named-ops table + config. */
export function buildIntegrityManifest(config: WorkerConfig): IntegrityManifest {
  const protectedFiles = [
    "types.ts",
    "integrity.ts",
    "operations.ts",
    "reservation.ts",
    "binding.ts",
    "lifecycle.ts",
    "effects.ts",
    "worker.ts",
    "client.ts"
  ];

  const codeCombined = protectedFiles
    .map((name) => {
      const full = path.join(SRC_DIR, name);
      return `${name}:${sha256File(full)}`;
    })
    .join("|");

  return {
    workerCodeHash: sha256Text(codeCombined),
    configHash: sha256Text(JSON.stringify(canonicalizeConfig(config))),
    operationsHash: sha256Text(NAMED_OPERATIONS.join(",")),
    computedAt: new Date().toISOString()
  };
}

export function canonicalizeConfig(config: WorkerConfig): WorkerConfig {
  return {
    machineId: config.machineId,
    receiverId: config.receiverId,
    sessionTtlMs: config.sessionTtlMs,
    reservationTtlMs: config.reservationTtlMs,
    maxEffects: config.maxEffects,
    syntheticEffectRoot: path.normalize(config.syntheticEffectRoot)
  };
}

export function assertIntegrity(
  expected: IntegrityManifest,
  actual: IntegrityManifest
): { ok: true } | { ok: false; reason: string } {
  if (expected.workerCodeHash !== actual.workerCodeHash) {
    return { ok: false, reason: "worker_code_integrity_mismatch" };
  }
  if (expected.configHash !== actual.configHash) {
    return { ok: false, reason: "config_integrity_mismatch" };
  }
  if (expected.operationsHash !== actual.operationsHash) {
    return { ok: false, reason: "operations_allowlist_integrity_mismatch" };
  }
  return { ok: true };
}
