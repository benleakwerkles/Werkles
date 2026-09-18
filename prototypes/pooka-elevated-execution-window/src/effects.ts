import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import type { IndependentVerification, OperationName } from "./types.ts";

export type SyntheticEffectRecord = {
  effectId: string;
  operation: OperationName;
  reservationId: string;
  markerId: string | null;
  markerPath: string | null;
  createdAt: string;
};

/**
 * Synthetic effects only — writes a marker file under the sandbox root.
 * Independent verification re-reads from disk without going through the worker.
 */
export function executeSyntheticEffect(input: {
  operation: OperationName;
  reservationId: string;
  payload: Record<string, string>;
  syntheticEffectRoot: string;
  now?: Date;
}): { ok: true; record: SyntheticEffectRecord } | { ok: false; reason: string } {
  const now = (input.now ?? new Date()).toISOString();
  const effectId = `eff_${randomBytes(8).toString("hex")}`;

  switch (input.operation) {
    case "SYNTHETIC_NOOP":
      return {
        ok: true,
        record: {
          effectId,
          operation: input.operation,
          reservationId: input.reservationId,
          markerId: null,
          markerPath: null,
          createdAt: now
        }
      };
    case "SYNTHETIC_WRITE_MARKER": {
      const markerId = input.payload.markerId;
      if (!markerId) return { ok: false, reason: "missing_markerId" };
      mkdirSync(input.syntheticEffectRoot, { recursive: true });
      const markerPath = path.join(input.syntheticEffectRoot, `${markerId}.marker`);
      // Refuse path escape — basename only already enforced by markerId charset.
      if (path.basename(markerPath) !== `${markerId}.marker`) {
        return { ok: false, reason: "path_escape_refused" };
      }
      writeFileSync(
        markerPath,
        JSON.stringify(
          {
            effectId,
            reservationId: input.reservationId,
            markerId,
            writtenAt: now,
            synthetic: true
          },
          null,
          2
        ),
        "utf8"
      );
      return {
        ok: true,
        record: {
          effectId,
          operation: input.operation,
          reservationId: input.reservationId,
          markerId,
          markerPath,
          createdAt: now
        }
      };
    }
    case "SYNTHETIC_READ_MARKER": {
      const markerId = input.payload.markerId;
      if (!markerId) return { ok: false, reason: "missing_markerId" };
      const markerPath = path.join(input.syntheticEffectRoot, `${markerId}.marker`);
      if (!existsSync(markerPath)) return { ok: false, reason: "marker_not_found" };
      return {
        ok: true,
        record: {
          effectId,
          operation: input.operation,
          reservationId: input.reservationId,
          markerId,
          markerPath,
          createdAt: now
        }
      };
    }
    default:
      return { ok: false, reason: "unknown_operation" };
  }
}

/** Independent verifier — does not call worker; reads filesystem directly. */
export function verifyEffectIndependently(input: {
  effectId: string;
  markerPath: string | null;
  expectedMarkerId: string | null;
}): IndependentVerification {
  const verifiedAt = new Date().toISOString();

  if (!input.markerPath) {
    return {
      effectId: input.effectId,
      verified: input.expectedMarkerId === null,
      observedMarker: null,
      verifiedAt,
      method: "independent_filesystem_read"
    };
  }

  if (!existsSync(input.markerPath)) {
    return {
      effectId: input.effectId,
      verified: false,
      observedMarker: null,
      verifiedAt,
      method: "independent_filesystem_read"
    };
  }

  const raw = readFileSync(input.markerPath, "utf8");
  const parsed = JSON.parse(raw) as { effectId?: string; markerId?: string };
  const match =
    parsed.effectId === input.effectId &&
    (input.expectedMarkerId === null || parsed.markerId === input.expectedMarkerId);

  return {
    effectId: input.effectId,
    verified: match,
    observedMarker: parsed.markerId ?? null,
    verifiedAt,
    method: "independent_filesystem_read"
  };
}
