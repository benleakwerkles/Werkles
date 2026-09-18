import { randomBytes } from "node:crypto";
import type {
  ActionScope,
  AuthorizationReservation,
  ClientBinding,
  ExecuteResult,
  IndependentVerification,
  WorkerConfig,
  WorkerSession
} from "./types.ts";
import { buildIntegrityManifest, assertIntegrity } from "./integrity.ts";
import { sealBinding, verifyBinding } from "./binding.ts";
import { createReservation, canExecuteAfterRevocation, markExecuted } from "./reservation.ts";
import { executeSyntheticEffect, verifyEffectIndependently } from "./effects.ts";
import {
  markElevated,
  markBound,
  markExecuting,
  completeSession,
  shutdownSession,
  revokeNewWorkOnly,
  evaluateSessionClock,
  isTerminal
} from "./lifecycle.ts";

/**
 * In-process elevated worker prototype.
 * Live Windows: same contracts over authenticated local IPC (named pipe).
 * No arbitrary shell/eval endpoint exists.
 */
export class ElevatedWorker {
  readonly config: WorkerConfig;
  readonly integrityAtBoot;
  readonly sharedSecretMaterial: string;
  private session: WorkerSession | null = null;
  private binding: ClientBinding | null = null;
  private reservations = new Map<string, AuthorizationReservation>();
  private lastEffectPath: string | null = null;
  private lastEffectId: string | null = null;

  constructor(config: WorkerConfig, sharedSecretMaterial: string) {
    this.config = config;
    this.sharedSecretMaterial = sharedSecretMaterial;
    this.integrityAtBoot = buildIntegrityManifest(config);
  }

  /**
   * Phase: preparation (unelevated or elevated bootstrap).
   * Does not claim UAC happened — Operator must open elevated process separately.
   */
  prepare(scope: ActionScope): WorkerSession {
    if (scope.machineId !== this.config.machineId) {
      throw new Error("prepare_machine_mismatch");
    }
    if (scope.receiverId !== this.config.receiverId) {
      throw new Error("prepare_receiver_mismatch");
    }
    if (scope.maxEffects > this.config.maxEffects) {
      throw new Error("prepare_max_effects_exceeds_config");
    }

    const integrity = buildIntegrityManifest(this.config);
    const check = assertIntegrity(this.integrityAtBoot, integrity);
    if (!check.ok) throw new Error(check.reason);

    this.session = {
      sessionId: `sess_${randomBytes(10).toString("hex")}`,
      phase: "prepared",
      scope,
      binding: null,
      integrity,
      reservedCount: 0,
      executedCount: 0,
      revokedForNewWork: false,
      createdAt: new Date().toISOString(),
      elevatedAt: null,
      completedAt: null
    };
    return this.session;
  }

  /**
   * Phase: elevation acknowledgment.
   * Prototype sets elevated flag only after caller asserts Operator already
   * opened the worker via supported Windows elevation. No password typing.
   */
  acknowledgeElevation(operatorConfirmedElevation: boolean): WorkerSession {
    if (!this.session) throw new Error("no_session");
    if (!operatorConfirmedElevation) {
      throw new Error("elevation_not_operator_confirmed");
    }
    this.session = markElevated(this.session);
    return this.session;
  }

  bindClient(client: Omit<ClientBinding, "sessionToken" | "bindingNonce">): ClientBinding {
    if (!this.session) throw new Error("no_session");
    this.session = evaluateSessionClock(this.session);
    if (this.session.phase !== "elevated") {
      throw new Error(`bind_requires_elevated_phase_have_${this.session.phase}`);
    }
    if (client.machineId !== this.config.machineId || client.receiverId !== this.config.receiverId) {
      throw new Error("bind_scope_mismatch");
    }

    const sealed = sealBinding(client, this.sharedSecretMaterial);
    this.binding = sealed;
    this.session = { ...markBound(this.session), binding: sealed };
    return sealed;
  }

  reserve(input: {
    binding: ClientBinding;
    handoffId: string;
    operation: string;
    payload: Record<string, string>;
  }): AuthorizationReservation {
    if (!this.session || !this.binding) throw new Error("not_bound");
    this.session = evaluateSessionClock(this.session);
    if (isTerminal(this.session.phase)) throw new Error(`session_${this.session.phase}`);

    const bindCheck = verifyBinding({
      presented: input.binding,
      expected: this.binding,
      expectedMachineId: this.config.machineId,
      expectedReceiverId: this.config.receiverId,
      sharedSecretMaterial: this.sharedSecretMaterial
    });
    if (!bindCheck.ok) throw new Error(bindCheck.reason);

    const integrity = buildIntegrityManifest(this.config);
    const integ = assertIntegrity(this.integrityAtBoot, integrity);
    if (!integ.ok) throw new Error(integ.reason);

    const result = createReservation({
      sessionId: this.session.sessionId,
      handoffId: input.handoffId,
      operation: input.operation,
      payload: input.payload,
      scope: this.session.scope,
      reservationTtlMs: this.config.reservationTtlMs,
      revokedForNewWork: this.session.revokedForNewWork,
      reservedCount: this.session.reservedCount
    });
    if (!result.ok) throw new Error(result.reason);

    this.reservations.set(result.reservation.reservationId, result.reservation);
    this.session = {
      ...this.session,
      reservedCount: this.session.reservedCount + 1
    };
    return result.reservation;
  }

  /**
   * Phase: execution of a previously reserved named operation.
   * Fresh reservation already obtained; this consumes it once.
   */
  execute(input: {
    binding: ClientBinding;
    reservationId: string;
  }): ExecuteResult {
    if (!this.session || !this.binding) {
      return { ok: false, reservationId: input.reservationId, operation: "SYNTHETIC_NOOP", effectId: null, error: "not_bound" };
    }
    this.session = evaluateSessionClock(this.session);

    const bindCheck = verifyBinding({
      presented: input.binding,
      expected: this.binding,
      expectedMachineId: this.config.machineId,
      expectedReceiverId: this.config.receiverId,
      sharedSecretMaterial: this.sharedSecretMaterial
    });
    if (!bindCheck.ok) {
      return { ok: false, reservationId: input.reservationId, operation: "SYNTHETIC_NOOP", effectId: null, error: bindCheck.reason };
    }

    const reservation = this.reservations.get(input.reservationId);
    if (!reservation) {
      return { ok: false, reservationId: input.reservationId, operation: "SYNTHETIC_NOOP", effectId: null, error: "unknown_reservation" };
    }

    const gate = canExecuteAfterRevocation(
      reservation,
      this.session.revokedForNewWork
    );
    if (!gate.ok) {
      return {
        ok: false,
        reservationId: reservation.reservationId,
        operation: reservation.operation,
        effectId: null,
        error: gate.reason
      };
    }

    this.session = markExecuting(this.session);
    const effect = executeSyntheticEffect({
      operation: reservation.operation,
      reservationId: reservation.reservationId,
      payload: reservation.effectPayload,
      syntheticEffectRoot: this.config.syntheticEffectRoot
    });

    if (!effect.ok) {
      return {
        ok: false,
        reservationId: reservation.reservationId,
        operation: reservation.operation,
        effectId: null,
        error: effect.reason
      };
    }

    this.reservations.set(reservation.reservationId, markExecuted(reservation));
    this.session = {
      ...this.session,
      executedCount: this.session.executedCount + 1
    };
    this.lastEffectPath = effect.record.markerPath;
    this.lastEffectId = effect.record.effectId;

    return {
      ok: true,
      reservationId: reservation.reservationId,
      operation: reservation.operation,
      effectId: effect.record.effectId
    };
  }

  /** Independent verification — filesystem read, not worker trust. */
  verifyLastEffect(expectedMarkerId: string | null): IndependentVerification {
    if (!this.lastEffectId) {
      return {
        effectId: "none",
        verified: false,
        observedMarker: null,
        verifiedAt: new Date().toISOString(),
        method: "independent_filesystem_read"
      };
    }
    return verifyEffectIndependently({
      effectId: this.lastEffectId,
      markerPath: this.lastEffectPath,
      expectedMarkerId
    });
  }

  revokeNewWork(): WorkerSession {
    if (!this.session) throw new Error("no_session");
    this.session = revokeNewWorkOnly(this.session);
    return this.session;
  }

  complete(): WorkerSession {
    if (!this.session) throw new Error("no_session");
    this.session = completeSession(this.session);
    return this.session;
  }

  shutdown(): WorkerSession {
    if (!this.session) throw new Error("no_session");
    this.session = shutdownSession(this.session);
    this.binding = null;
    return this.session;
  }

  getSession(): WorkerSession | null {
    return this.session ? evaluateSessionClock(this.session) : null;
  }
}
