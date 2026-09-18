import type {
  ActionScope,
  AuthorizationReservation,
  ClientBinding,
  ExecuteResult,
  IndependentVerification
} from "./types.ts";
import { ElevatedWorker } from "./worker.ts";
import { sha256Text } from "./integrity.ts";

/**
 * PreApp-side client stub (prototype).
 * Talks to in-process worker; live build would use named-pipe IPC with same messages.
 * Separates: prepare → (Operator elevation) → bind → reserve → execute → verify.
 */
export class PreAppElevatedClient {
  private binding: ClientBinding | null = null;
  private readonly worker: ElevatedWorker;
  private readonly clientProcessId: number;
  private readonly clientExecutablePath: string;

  constructor(worker: ElevatedWorker, clientProcessId: number, clientExecutablePath: string) {
    this.worker = worker;
    this.clientProcessId = clientProcessId;
    this.clientExecutablePath = clientExecutablePath;
  }

  prepare(scope: ActionScope) {
    return this.worker.prepare(scope);
  }

  /**
   * Elevation is Operator-owned. Client only acknowledges after supported
   * Windows elevation opened the worker. No unattended password / UAC bypass.
   */
  confirmOperatorElevation() {
    return this.worker.acknowledgeElevation(true);
  }

  bind() {
    this.binding = this.worker.bindClient({
      machineId: this.worker.config.machineId,
      receiverId: this.worker.config.receiverId,
      clientProcessId: this.clientProcessId,
      clientExecutableHash: sha256Text(this.clientExecutablePath)
    });
    return this.binding;
  }

  reserve(handoffId: string, operation: string, payload: Record<string, string>): AuthorizationReservation {
    if (!this.binding) throw new Error("client_not_bound");
    return this.worker.reserve({
      binding: this.binding,
      handoffId,
      operation,
      payload
    });
  }

  execute(reservationId: string): ExecuteResult {
    if (!this.binding) throw new Error("client_not_bound");
    return this.worker.execute({
      binding: this.binding,
      reservationId
    });
  }

  verify(expectedMarkerId: string | null): IndependentVerification {
    return this.worker.verifyLastEffect(expectedMarkerId);
  }

  revokeNewWork() {
    return this.worker.revokeNewWork();
  }

  complete() {
    return this.worker.complete();
  }

  shutdown() {
    this.binding = null;
    return this.worker.shutdown();
  }
}

/** Full happy-path orchestration with phases kept distinct. */
export function runSyntheticHappyPath(input: {
  worker: ElevatedWorker;
  client: PreAppElevatedClient;
  scope: ActionScope;
  markerId: string;
}): {
  phases: string[];
  execute: ExecuteResult;
  verification: IndependentVerification;
} {
  const phases: string[] = [];

  input.client.prepare(input.scope);
  phases.push("prepare");

  // Elevation is a separate Operator step — simulated confirmation only.
  input.client.confirmOperatorElevation();
  phases.push("elevate_ack");

  input.client.bind();
  phases.push("bind");

  const reservation = input.client.reserve(input.scope.handoffId, "SYNTHETIC_WRITE_MARKER", {
    markerId: input.markerId
  });
  phases.push("reserve");

  const execute = input.client.execute(reservation.reservationId);
  phases.push("execute");

  const verification = input.client.verify(input.markerId);
  phases.push("independent_verify");

  input.client.complete();
  phases.push("complete");

  return { phases, execute, verification };
}
