import assert from "node:assert/strict";

import type { HumanGate } from "@/protocol/index";

import { resolveGateTier, resolveHumanGate } from "@/lib/soledash/human-gate/tiers";

function gate(partial: Partial<HumanGate> & Pick<HumanGate, "classification">): HumanGate {
  return {
    operator_prompt: partial.operator_prompt ?? "Gate prompt",
    operator_line: partial.operator_line ?? "",
    detail: partial.detail ?? null,
    transport_gap: partial.transport_gap ?? null,
    ...partial
  };
}

const liveTransport = gate({
  classification: "live_transport",
  operator_line: "Live transport active — operator override on frontier."
});
assert.equal(resolveGateTier(liveTransport), "green");

const proceedLine = gate({
  classification: "mechanical",
  operator_line: "PROCEED: not a human gate."
});
assert.equal(resolveGateTier(proceedLine), "green");

const mockCtx = { mockMode: true };
const informational = gate({ classification: "frontier_ready", operator_line: "Ready to dispatch." });
assert.equal(resolveGateTier(informational, mockCtx), "blue");

const redGate = gate({
  classification: "true_human_gate",
  operator_line: "STOP: HUMAN GATE.",
  detail: "git push to origin requires Ben approval."
});
assert.equal(resolveGateTier(redGate), "red");
assert.ok(resolveHumanGate(redGate).redCard);
assert.match(resolveHumanGate(redGate).redCard!.why, /approval/i);

const transportGap = gate({
  classification: "live_transport",
  operator_line: "Transport blocked.",
  transport_gap: {
    headline: "Manual step required",
    reason: "OAuth login not wired",
    manual_step: "Ben completes login in browser",
    cousin_url: null
  }
});
assert.equal(resolveGateTier(transportGap), "red");

console.log("human-gate-tiers-smoke: ok");
