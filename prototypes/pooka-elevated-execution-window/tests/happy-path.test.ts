import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  ElevatedWorker,
  PreAppElevatedClient,
  runSyntheticHappyPath,
  type ActionScope
} from "../src/index.ts";

function makeHarness() {
  const root = mkdtempSync(path.join(tmpdir(), "pooka-elev-"));
  const worker = new ElevatedWorker(
    {
      machineId: "machine-doss-proto",
      receiverId: "receiver-preapp-proto",
      sessionTtlMs: 60_000,
      reservationTtlMs: 30_000,
      maxEffects: 3,
      syntheticEffectRoot: path.join(root, "effects")
    },
    "proto-shared-secret-not-for-production"
  );
  const client = new PreAppElevatedClient(worker, 4242, "C:\\Proto\\PreApp.exe");
  const scope: ActionScope = {
    machineId: "machine-doss-proto",
    receiverId: "receiver-preapp-proto",
    handoffId: "handoff-synthetic-001",
    allowedOperations: ["SYNTHETIC_NOOP", "SYNTHETIC_WRITE_MARKER", "SYNTHETIC_READ_MARKER"],
    sessionExpiresAt: new Date(Date.now() + 60_000).toISOString(),
    maxEffects: 3
  };
  return {
    root,
    worker,
    client,
    scope,
    cleanup: () => rmSync(root, { recursive: true, force: true })
  };
}

describe("pooka elevated execution window — happy path", () => {
  it("separates prepare, elevate, bind, reserve, execute, independent verify, complete", () => {
    const h = makeHarness();
    try {
      const result = runSyntheticHappyPath({
        worker: h.worker,
        client: h.client,
        scope: h.scope,
        markerId: "marker-alpha"
      });

      assert.deepEqual(result.phases, [
        "prepare",
        "elevate_ack",
        "bind",
        "reserve",
        "execute",
        "independent_verify",
        "complete"
      ]);
      assert.equal(result.execute.ok, true);
      assert.ok(result.execute.effectId);
      assert.equal(result.verification.verified, true);
      assert.equal(result.verification.method, "independent_filesystem_read");
      assert.equal(result.verification.observedMarker, "marker-alpha");
      assert.equal(h.worker.getSession()?.phase, "completed");
    } finally {
      h.cleanup();
    }
  });

  it("allows already-reserved effect after revoke-new-work", () => {
    const h = makeHarness();
    try {
      h.client.prepare(h.scope);
      h.client.confirmOperatorElevation();
      h.client.bind();
      const reservation = h.client.reserve(h.scope.handoffId, "SYNTHETIC_WRITE_MARKER", {
        markerId: "marker-irrevocable"
      });
      h.client.revokeNewWork();

      // New reservation must fail.
      assert.throws(
        () => h.client.reserve(h.scope.handoffId, "SYNTHETIC_NOOP", {}),
        /session_revoked_for_new_work/
      );

      // Already-reserved may still execute.
      const exec = h.client.execute(reservation.reservationId);
      assert.equal(exec.ok, true);
      const verification = h.client.verify("marker-irrevocable");
      assert.equal(verification.verified, true);
    } finally {
      h.cleanup();
    }
  });
});
