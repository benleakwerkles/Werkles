import type { HumanGate } from "@/protocol/index";

import type { GateResolution, GateTier, RedGateCard } from "./types";

const GREEN_MARKERS = [
  "live_transport",
  "green",
  "mechanical",
  "proceed",
  "informational",
  "none",
  "healthy"
] as const;

const BLUE_MARKERS = ["blue", "mock", "simulated", "file_backed", "receipt_after"] as const;

const RED_MARKERS = [
  "true_human_gate",
  "human_gate",
  "red_gate",
  "red",
  "blocked",
  "stop",
  "waiting_on_ben"
] as const;

function gateText(gate: HumanGate): string {
  return [
    gate.classification,
    gate.operator_prompt,
    gate.operator_line,
    gate.detail,
    gate.transport_gap?.headline,
    gate.transport_gap?.reason,
    gate.transport_gap?.manual_step
  ]
    .filter(Boolean)
    .join(" ");
}

function matchesMarker(haystack: string, markers: readonly string[]): boolean {
  return markers.some((m) => haystack.includes(m));
}

function classifyGateText(text: string): {
  verdict: "TRUE_HUMAN_GATE" | "SAFE_MECHANICAL" | "BLOCKED" | "AMBIGUOUS";
  reasons: string[];
} {
  const gatePatterns = [
    /\bgit push\b|\bpush to (?:origin|remote)\b|\bforce push\b/i,
    /\bmerge(?:\s+to|\s+into)?\s+main\b|\bmerge PR\b|\bmerge pull/i,
    /\bdeploy(?:\s+to)?\s+production\b|\blive deploy\b|\bproduction deploy\b/i,
    /\blogin\b|\boauth\b|\baccount creat/i,
    /\bbilling\b|\bcredit card\b|\bstripe live\b|\bsubscription\b/i,
    /\bsecret\b|\bapi key\b|\bcredential\b|\bpassword\b|\b\.env\b/i,
    /\bsql apply\b|\bschema apply\b|\brls\b|\bpolicy change\b|\bmigration apply\b/i,
    /\bproduction data\b|\blive table\b|\binsert into\b|\bupdate\b.*\btable\b/i,
    /\boperator approv\b|\bben must approv\b|\bhuman gate\b/i,
    /\bpublic launch\b|\bgo live\b|\bpublish homepage\b/i
  ];
  const blockedPatterns = [
    /\bmerge(?:\s+to|\s+into)?\s+main\b.*(?:without|no)\s+(?:approval|gate)/i,
    /\bdeploy production\b.*(?:now|immediately)/i,
    /\bexpose secret\b|\bprint.*\.env\b|\bcommit.*\.env\b/i
  ];
  const safePatterns = [
    /\btypecheck\b/i,
    /\bbuild\b(?!\s*pages)/i,
    /\blint\b/i,
    /\bhealth check\b/i,
    /\blocalhost\b|\blocal route\b|\bprobe\b/i,
    /\bdry run\b/i,
    /\bscaffold\b|\bverify\b|\breadback\b/i,
    /\bdisplay-only\b|\bpreview only\b/i,
    /\bformat for speaker\b|\bvalidate receipt\b/i
  ];

  if (blockedPatterns.some((re) => re.test(text))) {
    return { verdict: "BLOCKED", reasons: ["Action matches blocked or forbidden patterns."] };
  }
  const hasGate = gatePatterns.some((re) => re.test(text));
  const hasSafe = safePatterns.some((re) => re.test(text));
  if (hasGate && hasSafe) {
    return { verdict: "AMBIGUOUS", reasons: ["Mixed mechanical and human-gate signals detected."] };
  }
  if (hasGate) {
    return { verdict: "TRUE_HUMAN_GATE", reasons: ["Requires Ben approval per human-gate rules."] };
  }
  if (hasSafe) {
    return { verdict: "SAFE_MECHANICAL", reasons: ["Routine technical proof inside approved scope."] };
  }
  return { verdict: "AMBIGUOUS", reasons: [] };
}

export function resolveGateTier(
  gate: HumanGate,
  ctx?: { mockMode?: boolean; showMockTest?: boolean }
): GateTier {
  const cls = gate.classification.toLowerCase().trim();
  const line = (gate.operator_line ?? "").toLowerCase();
  const combined = gateText(gate).toLowerCase();

  if (gate.transport_gap) return "red";
  if (line.includes("stop: human gate") || line.includes("blocked —")) return "red";
  if (line.includes("proceed: not a human gate")) return "green";

  if (matchesMarker(cls, RED_MARKERS) && !cls.includes("live_transport")) return "red";
  if (matchesMarker(cls, GREEN_MARKERS)) return "green";

  const verdict = classifyGateText(gateText(gate));
  if (verdict.verdict === "TRUE_HUMAN_GATE" || verdict.verdict === "BLOCKED") return "red";
  if (verdict.verdict === "SAFE_MECHANICAL") return "green";

  if (ctx?.mockMode) return "blue";
  if (matchesMarker(cls, BLUE_MARKERS) || matchesMarker(combined, BLUE_MARKERS)) return "blue";

  return "green";
}

export function buildRedGateCard(gate: HumanGate): RedGateCard {
  const gateTextValue = gateText(gate);
  const verdict = classifyGateText(gateTextValue);

  const why =
    verdict.reasons.length > 0
      ? verdict.reasons.join(" ")
      : gate.operator_prompt?.trim() || "Operator approval required before this action proceeds.";

  const consequence =
    gate.transport_gap?.headline?.trim() ||
    gate.operator_line?.trim() ||
    gate.detail?.trim() ||
    "Frontier action dispatches when approved; rejection or deferral holds the line.";

  return {
    tier: "red",
    classification: gate.classification,
    why,
    consequence,
    detail: gate.detail,
    transportGap: gate.transport_gap
  };
}

export function resolveHumanGate(
  gate: HumanGate,
  ctx?: { mockMode?: boolean; showMockTest?: boolean }
): GateResolution {
  const tier = resolveGateTier(gate, ctx);
  return {
    tier,
    redCard: tier === "red" ? buildRedGateCard(gate) : null,
    gate
  };
}

export function isRedHumanGate(gate: HumanGate, ctx?: { mockMode?: boolean; showMockTest?: boolean }): boolean {
  return resolveGateTier(gate, ctx) === "red";
}
