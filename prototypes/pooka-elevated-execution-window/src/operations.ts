import type { OperationName } from "./types.ts";
import { NAMED_OPERATIONS } from "./types.ts";

export function isNamedOperation(name: string): name is OperationName {
  return (NAMED_OPERATIONS as readonly string[]).includes(name);
}

export function assertNamedOperation(name: string): OperationName {
  if (!isNamedOperation(name)) {
    throw new Error(`REJECTED_UNKNOWN_OPERATION:${name}`);
  }
  return name;
}

/**
 * No arbitrary shell/eval. Operations are pure named handlers.
 * Payload keys are constrained per operation.
 */
export function validateOperationPayload(
  operation: OperationName,
  payload: Record<string, string>
): { ok: true } | { ok: false; reason: string } {
  const keys = Object.keys(payload);

  switch (operation) {
    case "SYNTHETIC_NOOP":
      if (keys.length > 0) return { ok: false, reason: "noop_rejects_payload" };
      return { ok: true };
    case "SYNTHETIC_WRITE_MARKER":
      if (keys.length !== 1 || keys[0] !== "markerId") {
        return { ok: false, reason: "write_marker_requires_markerId_only" };
      }
      if (!/^[a-zA-Z0-9_-]{1,64}$/.test(payload.markerId ?? "")) {
        return { ok: false, reason: "markerId_invalid" };
      }
      return { ok: true };
    case "SYNTHETIC_READ_MARKER":
      if (keys.length !== 1 || keys[0] !== "markerId") {
        return { ok: false, reason: "read_marker_requires_markerId_only" };
      }
      return { ok: true };
    default:
      return { ok: false, reason: "unreachable_operation" };
  }
}
