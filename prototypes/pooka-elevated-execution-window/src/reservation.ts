import { randomBytes } from "node:crypto";
import type {
  ActionScope,
  AuthorizationReservation,
  HandoffId,
  OperationName,
  ReservationId,
  SessionId
} from "./types.ts";
import { assertNamedOperation, validateOperationPayload } from "./operations.ts";

export function newReservationId(): ReservationId {
  return `rsv_${randomBytes(12).toString("hex")}`;
}

/**
 * Fresh canonical authorization/reservation BEFORE effects.
 * Revocation after reserved does not abort this reservation.
 */
export function createReservation(input: {
  sessionId: SessionId;
  handoffId: HandoffId;
  operation: string;
  payload: Record<string, string>;
  scope: ActionScope;
  reservationTtlMs: number;
  now?: Date;
  revokedForNewWork: boolean;
  reservedCount: number;
}): { ok: true; reservation: AuthorizationReservation } | { ok: false; reason: string } {
  const now = input.now ?? new Date();

  if (input.revokedForNewWork) {
    return { ok: false, reason: "session_revoked_for_new_work" };
  }

  if (now.toISOString() >= input.scope.sessionExpiresAt) {
    return { ok: false, reason: "session_expired" };
  }

  if (input.reservedCount >= input.scope.maxEffects) {
    return { ok: false, reason: "max_effects_reached" };
  }

  if (input.handoffId !== input.scope.handoffId) {
    return { ok: false, reason: "handoff_mismatch" };
  }

  let operation: OperationName;
  try {
    operation = assertNamedOperation(input.operation);
  } catch {
    return { ok: false, reason: "unknown_operation" };
  }

  if (!input.scope.allowedOperations.includes(operation)) {
    return { ok: false, reason: "operation_out_of_scope" };
  }

  const payloadCheck = validateOperationPayload(operation, input.payload);
  if (!payloadCheck.ok) return payloadCheck;

  const reservedAt = now.toISOString();
  const reservationExpiresAt = new Date(now.getTime() + input.reservationTtlMs).toISOString();

  return {
    ok: true,
    reservation: {
      reservationId: newReservationId(),
      sessionId: input.sessionId,
      operation,
      handoffId: input.handoffId,
      state: "reserved",
      reservedAt,
      reservationExpiresAt,
      irrevocableOnceReserved: true,
      effectPayload: { ...input.payload }
    }
  };
}

/**
 * Later revocation MUST NOT cancel an already-reserved effect's entitlement.
 * This helper models that rule for tests and worker enforcement.
 */
export function canExecuteAfterRevocation(
  reservation: AuthorizationReservation,
  sessionRevokedForNewWork: boolean,
  now = new Date()
): { ok: true } | { ok: false; reason: string } {
  if (reservation.state !== "reserved") {
    return { ok: false, reason: `reservation_state_${reservation.state}` };
  }
  if (now.toISOString() >= reservation.reservationExpiresAt) {
    return { ok: false, reason: "reservation_expired" };
  }
  // Explicit: revocation of new work does NOT block already-reserved execution.
  void sessionRevokedForNewWork;
  if (!reservation.irrevocableOnceReserved) {
    return { ok: false, reason: "reservation_missing_irrevocable_flag" };
  }
  return { ok: true };
}

export function markExecuted(reservation: AuthorizationReservation): AuthorizationReservation {
  return { ...reservation, state: "executed" };
}

export function markExpired(reservation: AuthorizationReservation): AuthorizationReservation {
  return { ...reservation, state: "expired" };
}
