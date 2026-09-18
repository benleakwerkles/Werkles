import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  ElevatedWorker,
  PreAppElevatedClient,
  type ActionScope
} from "../src/index.ts";

describe("lifecycle — expire complete shutdown", () => {
  it("expires session by clock and refuses new work", () => {
    const root = mkdtempSync(path.join(tmpdir(), "pooka-life-"));
    try {
      const worker = new ElevatedWorker(
        {
          machineId: "machine-doss-proto",
          receiverId: "receiver-preapp-proto",
          sessionTtlMs: 1,
          reservationTtlMs: 30_000,
          maxEffects: 2,
          syntheticEffectRoot: path.join(root, "effects")
        },
        "proto-shared-secret-not-for-production"
      );
      const client = new PreAppElevatedClient(worker, 1, "exe");
      const scope: ActionScope = {
        machineId: "machine-doss-proto",
        receiverId: "receiver-preapp-proto",
        handoffId: "h1",
        allowedOperations: ["SYNTHETIC_NOOP"],
        sessionExpiresAt: new Date(Date.now() - 1000).toISOString(),
        maxEffects: 2
      };
      client.prepare(scope);
      client.confirmOperatorElevation();
      // Clock expires the session before bind is allowed.
      assert.throws(() => client.bind(), /expired|bind_requires_elevated_phase/);
      const session = worker.getSession();
      assert.ok(session);
      assert.equal(session.phase, "expired");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("shutdown clears binding and is terminal", () => {
    const root = mkdtempSync(path.join(tmpdir(), "pooka-shut-"));
    try {
      const worker = new ElevatedWorker(
        {
          machineId: "machine-doss-proto",
          receiverId: "receiver-preapp-proto",
          sessionTtlMs: 60_000,
          reservationTtlMs: 30_000,
          maxEffects: 2,
          syntheticEffectRoot: path.join(root, "effects")
        },
        "proto-shared-secret-not-for-production"
      );
      const client = new PreAppElevatedClient(worker, 1, "exe");
      const scope: ActionScope = {
        machineId: "machine-doss-proto",
        receiverId: "receiver-preapp-proto",
        handoffId: "h1",
        allowedOperations: ["SYNTHETIC_NOOP"],
        sessionExpiresAt: new Date(Date.now() + 60_000).toISOString(),
        maxEffects: 2
      };
      client.prepare(scope);
      client.confirmOperatorElevation();
      client.bind();
      const shut = client.shutdown();
      assert.equal(shut.phase, "shutdown");
      assert.throws(() => client.reserve("h1", "SYNTHETIC_NOOP", {}), /client_not_bound|session_shutdown|not_bound/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("complete is terminal and refuses further reserve", () => {
    const root = mkdtempSync(path.join(tmpdir(), "pooka-comp-"));
    try {
      const worker = new ElevatedWorker(
        {
          machineId: "machine-doss-proto",
          receiverId: "receiver-preapp-proto",
          sessionTtlMs: 60_000,
          reservationTtlMs: 30_000,
          maxEffects: 2,
          syntheticEffectRoot: path.join(root, "effects")
        },
        "proto-shared-secret-not-for-production"
      );
      const client = new PreAppElevatedClient(worker, 1, "exe");
      const scope: ActionScope = {
        machineId: "machine-doss-proto",
        receiverId: "receiver-preapp-proto",
        handoffId: "h1",
        allowedOperations: ["SYNTHETIC_NOOP"],
        sessionExpiresAt: new Date(Date.now() + 60_000).toISOString(),
        maxEffects: 2
      };
      client.prepare(scope);
      client.confirmOperatorElevation();
      client.bind();
      client.complete();
      assert.equal(worker.getSession()?.phase, "completed");
      assert.throws(() => client.reserve("h1", "SYNTHETIC_NOOP", {}), /session_completed|session_revoked/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
