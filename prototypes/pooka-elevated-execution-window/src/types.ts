/**
 * Pooka Elevated Execution Window — shared types (prototype).
 * Synthetic / isolated only. Does not touch PUB/Swanson modules.
 */

export type MachineId = string;
export type ReceiverId = string;
export type HandoffId = string;
export type SessionId = string;
export type ReservationId = string;
export type OperationName = "SYNTHETIC_NOOP" | "SYNTHETIC_WRITE_MARKER" | "SYNTHETIC_READ_MARKER";

export type SessionPhase =
  | "prepared"
  | "elevated"
  | "bound"
  | "executing"
  | "completed"
  | "expired"
  | "shutdown";

export type ReservationState = "pending" | "reserved" | "executed" | "expired" | "aborted";

/** Canonical allowlist — anything else is rejected. */
export const NAMED_OPERATIONS = [
  "SYNTHETIC_NOOP",
  "SYNTHETIC_WRITE_MARKER",
  "SYNTHETIC_READ_MARKER"
] as const satisfies readonly OperationName[];

export type ActionScope = {
  machineId: MachineId;
  receiverId: ReceiverId;
  handoffId: HandoffId;
  allowedOperations: OperationName[];
  /** Absolute ISO expiry for the elevated session window. */
  sessionExpiresAt: string;
  /** Max effects that may be reserved/executed in this session. */
  maxEffects: number;
};

export type ClientBinding = {
  machineId: MachineId;
  receiverId: ReceiverId;
  clientProcessId: number;
  clientExecutableHash: string;
  sessionToken: string;
  bindingNonce: string;
};

export type IntegrityManifest = {
  workerCodeHash: string;
  configHash: string;
  operationsHash: string;
  computedAt: string;
};

export type AuthorizationReservation = {
  reservationId: ReservationId;
  sessionId: SessionId;
  operation: OperationName;
  handoffId: HandoffId;
  state: ReservationState;
  reservedAt: string;
  /** Reservation TTL — effect must execute before this. */
  reservationExpiresAt: string;
  /**
   * Once state becomes "reserved", later session revocation MUST NOT
   * cancel this reservation's entitlement to complete its single effect.
   * (Revocation may refuse NEW reservations.)
   */
  irrevocableOnceReserved: true;
  effectPayload: Record<string, string>;
};

export type ExecuteResult = {
  ok: boolean;
  reservationId: ReservationId;
  operation: OperationName;
  effectId: string | null;
  error?: string;
};

export type IndependentVerification = {
  effectId: string;
  verified: boolean;
  observedMarker: string | null;
  verifiedAt: string;
  method: "independent_filesystem_read";
};

export type WorkerConfig = {
  machineId: MachineId;
  receiverId: ReceiverId;
  sessionTtlMs: number;
  reservationTtlMs: number;
  maxEffects: number;
  /** Sandbox root for synthetic markers only. */
  syntheticEffectRoot: string;
};

export type WorkerSession = {
  sessionId: SessionId;
  phase: SessionPhase;
  scope: ActionScope;
  binding: ClientBinding | null;
  integrity: IntegrityManifest;
  reservedCount: number;
  executedCount: number;
  /** If true, refuse NEW reservations; already-reserved may still execute. */
  revokedForNewWork: boolean;
  createdAt: string;
  elevatedAt: string | null;
  completedAt: string | null;
};
