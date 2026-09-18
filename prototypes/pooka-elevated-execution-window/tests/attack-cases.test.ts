import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  ElevatedWorker,
  PreAppElevatedClient,
  type ActionScope,
  type ClientBinding
} from "../src/index.ts";

function makeHarness(overrides?: Partial<ActionScope>) {
  const root = mkdtempSync(path.join(tmpdir(), "pooka-atk-"));
  const worker = new ElevatedWorker(
    {
      machineId: "machine-doss-proto",
      receiverId: "receiver-preapp-proto",
      sessionTtlMs: 60_000,
      reservationTtlMs: 5_000,
      maxEffects: 2,
      syntheticEffectRoot: path.join(root, "effects")
    },
    "proto-shared-secret-not-for-production"
  );
  const client = new PreAppElevatedClient(worker, 4242, "C:\\Proto\\PreApp.exe");
  const scope: ActionScope = {
    machineId: "machine-doss-proto",
    receiverId: "receiver-preapp-proto",
    handoffId: "handoff-synthetic-001",
    allowedOperations: ["SYNTHETIC_NOOP", "SYNTHETIC_WRITE_MARKER"],
    sessionExpiresAt: new Date(Date.now() + 60_000).toISOString(),
    maxEffects: 2,
    ...overrides
  };
  return {
    root,
    worker,
    client,
    scope,
    cleanup: () => rmSync(root, { recursive: true, force: true })
  };
}

function bindHappy(h: ReturnType<typeof makeHarness>) {
  h.client.prepare(h.scope);
  h.client.confirmOperatorElevation();
  return h.client.bind();
}

describe("attack cases — named ops and binding", () => {
  it("rejects arbitrary / unknown operations (no shell/eval path)", () => {
    const h = makeHarness();
    try {
      bindHappy(h);
      assert.throws(
        () => h.client.reserve(h.scope.handoffId, "rm -rf /", {}),
        /unknown_operation/
      );
      assert.throws(
        () => h.client.reserve(h.scope.handoffId, "eval", { code: "1+1" }),
        /unknown_operation/
      );
      assert.throws(
        () => h.client.reserve(h.scope.handoffId, "SYNTHETIC_READ_MARKER", { markerId: "x" }),
        /operation_out_of_scope/
      );
    } finally {
      h.cleanup();
    }
  });

  it("rejects forged binding (wrong pid / token)", () => {
    const h = makeHarness();
    try {
      const real = bindHappy(h);
      const forged: ClientBinding = {
        ...real,
        clientProcessId: 99999
      };
      assert.throws(
        () =>
          h.worker.reserve({
            binding: forged,
            handoffId: h.scope.handoffId,
            operation: "SYNTHETIC_NOOP",
            payload: {}
          }),
        /client_pid_mismatch/
      );

      const forgedToken: ClientBinding = {
        ...real,
        sessionToken: "0".repeat(64)
      };
      assert.throws(
        () =>
          h.worker.reserve({
            binding: forgedToken,
            handoffId: h.scope.handoffId,
            operation: "SYNTHETIC_NOOP",
            payload: {}
          }),
        /token_mac_mismatch|session_token_mismatch/
      );
    } finally {
      h.cleanup();
    }
  });

  it("rejects wrong machine or receiver in prepare", () => {
    const h = makeHarness();
    try {
      assert.throws(
        () =>
          h.client.prepare({
            ...h.scope,
            machineId: "other-machine"
          }),
        /prepare_machine_mismatch/
      );
      assert.throws(
        () =>
          h.client.prepare({
            ...h.scope,
            receiverId: "other-receiver"
          }),
        /prepare_receiver_mismatch/
      );
    } finally {
      h.cleanup();
    }
  });

  it("rejects wrong handoff id at reservation", () => {
    const h = makeHarness();
    try {
      bindHappy(h);
      assert.throws(
        () => h.client.reserve("handoff-WRONG", "SYNTHETIC_NOOP", {}),
        /handoff_mismatch/
      );
    } finally {
      h.cleanup();
    }
  });

  it("rejects marker path injection in payload", () => {
    const h = makeHarness();
    try {
      bindHappy(h);
      assert.throws(
        () =>
          h.client.reserve(h.scope.handoffId, "SYNTHETIC_WRITE_MARKER", {
            markerId: "../escape"
          }),
        /markerId_invalid/
      );
      assert.throws(
        () =>
          h.client.reserve(h.scope.handoffId, "SYNTHETIC_WRITE_MARKER", {
            markerId: "x",
            extra: "nope"
          }),
        /write_marker_requires_markerId_only/
      );
    } finally {
      h.cleanup();
    }
  });

  it("refuses elevation acknowledgment without Operator confirmation", () => {
    const h = makeHarness();
    try {
      h.client.prepare(h.scope);
      assert.throws(
        () => h.worker.acknowledgeElevation(false),
        /elevation_not_operator_confirmed/
      );
    } finally {
      h.cleanup();
    }
  });

  it("rejects bind before elevation", () => {
    const h = makeHarness();
    try {
      h.client.prepare(h.scope);
      assert.throws(() => h.client.bind(), /bind_requires_elevated_phase/);
    } finally {
      h.cleanup();
    }
  });

  it("enforces max effects", () => {
    const h = makeHarness({ maxEffects: 1 });
    try {
      bindHappy(h);
      h.client.reserve(h.scope.handoffId, "SYNTHETIC_NOOP", {});
      assert.throws(
        () => h.client.reserve(h.scope.handoffId, "SYNTHETIC_NOOP", {}),
        /max_effects_reached/
      );
    } finally {
      h.cleanup();
    }
  });

  it("expires reservation and refuses late execute", async () => {
    const { canExecuteAfterRevocation } = await import("../src/reservation.ts");
    const expiredReservation = {
      reservationId: "rsv_test",
      sessionId: "sess_test",
      operation: "SYNTHETIC_NOOP" as const,
      handoffId: "h1",
      state: "reserved" as const,
      reservedAt: new Date(Date.now() - 60_000).toISOString(),
      reservationExpiresAt: new Date(Date.now() - 1_000).toISOString(),
      irrevocableOnceReserved: true as const,
      effectPayload: {}
    };
    const gate = canExecuteAfterRevocation(expiredReservation, false);
    assert.equal(gate.ok, false);
    if (!gate.ok) assert.equal(gate.reason, "reservation_expired");

    // Single-use: after execute, second execute fails
    const h = makeHarness();
    try {
      bindHappy(h);
      const r = h.client.reserve(h.scope.handoffId, "SYNTHETIC_NOOP", {});
      const first = h.client.execute(r.reservationId);
      assert.equal(first.ok, true);
      const second = h.client.execute(r.reservationId);
      assert.equal(second.ok, false);
      assert.match(second.error ?? "", /reservation_state_executed/);
    } finally {
      h.cleanup();
    }
  });
});
