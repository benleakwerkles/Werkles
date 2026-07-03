import fs from "node:fs";
import path from "node:path";

import { lookupApprovalPolicy } from "./approval-policy";
import type { ApprovalClassification, ApprovalVerdict } from "./types";

const ROOT = process.cwd();

const SAFE_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /\btypecheck\b/i, label: "typecheck" },
  { re: /\bbuild\b(?!\s*pages)/i, label: "build" },
  { re: /\blint\b/i, label: "lint" },
  { re: /\bhealth check\b/i, label: "health check" },
  { re: /\blocalhost\b|\blocal route\b|\bprobe\b/i, label: "localhost proof" },
  { re: /\bdry run\b/i, label: "dry run" },
  { re: /\bscaffold\b|\bverify\b|\breadback\b/i, label: "scaffold/readback" },
  { re: /\bdisplay-only\b|\bpreview only\b/i, label: "display-only" },
  { re: /\bformat for speaker\b|\bvalidate receipt\b/i, label: "command surface ops" }
];

const GATE_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /\bgit push\b|\bpush to (?:origin|remote)\b|\bforce push\b/i, label: "git push" },
  { re: /\bmerge(?:\s+to|\s+into)?\s+main\b|\bmerge PR\b|\bmerge pull/i, label: "merge" },
  { re: /\bdeploy(?:\s+to)?\s+production\b|\blive deploy\b|\bproduction deploy\b/i, label: "production deploy" },
  { re: /\blogin\b|\boauth\b|\baccount creat/i, label: "login/oauth/account" },
  { re: /\bbilling\b|\bcredit card\b|\bstripe live\b|\bsubscription\b/i, label: "billing" },
  { re: /\bsecret\b|\bapi key\b|\bcredential\b|\bpassword\b|\b\.env\b/i, label: "secrets" },
  { re: /\bsql apply\b|\bschema apply\b|\brls\b|\bpolicy change\b|\bmigration apply\b/i, label: "SQL/schema" },
  { re: /\bproduction data\b|\blive table\b|\binsert into\b|\bupdate\b.*\btable\b/i, label: "production data" },
  { re: /\boperator approv\b|\bben must approv\b|\bhuman gate\b/i, label: "explicit human gate" },
  { re: /\bpublic launch\b|\bgo live\b|\bpublish homepage\b/i, label: "public launch" }
];

const BLOCKED_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /\bmerge(?:\s+to|\s+into)?\s+main\b.*(?:without|no)\s+(?:approval|gate)/i, label: "merge without gate" },
  { re: /\bdeploy production\b.*(?:now|immediately)/i, label: "rush production deploy" },
  { re: /\bexpose secret\b|\bprint.*\.env\b|\bcommit.*\.env\b/i, label: "secret exposure" }
];

function readNextActionHardStops(): string[] {
  try {
    const text = fs.readFileSync(path.join(ROOT, "foreman/NEXT_ACTION.md"), "utf8");
    const block = text.match(/## Hard stops[\s\S]*?(?=##|$)/i)?.[0] ?? "";
    return block
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function hardStopBlocks(text: string): string[] {
  const stops = readNextActionHardStops();
  const lower = text.toLowerCase();
  return stops.filter((stop) => {
    const words = stop.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
    return words.some((w) => lower.includes(w));
  });
}

function hardStopMatches(text: string): string[] {
  return hardStopBlocks(text).map((s) => s.slice(0, 40));
}

export function classifyApprovalAction(actionText: string): ApprovalClassification {
  const text = actionText.trim();
  const matchedSignals: string[] = [];
  const reasons: string[] = [];

  if (!text) {
    return {
      verdict: "AMBIGUOUS",
      approvalClass: null,
      approvalPolicyId: null,
      receiptRequired: false,
      confidence: "high",
      reasons: ["Empty action - paste what the cousin or system is asking to do."],
      matchedSignals: [],
      operatorLine: "AMBIGUOUS - no action text."
    };
  }

  const policy = lookupApprovalPolicy(text);
  if (policy) {
    matchedSignals.push(`policy:${policy.approvalClass}:${policy.candidateId}`);
  }

  for (const { re, label } of BLOCKED_PATTERNS) {
    if (re.test(text)) matchedSignals.push(`blocked:${label}`);
  }

  for (const { re, label } of GATE_PATTERNS) {
    if (re.test(text)) matchedSignals.push(`gate:${label}`);
  }

  for (const { re, label } of SAFE_PATTERNS) {
    if (re.test(text)) matchedSignals.push(`safe:${label}`);
  }

  const stopHits = hardStopMatches(text);
  for (const hit of stopHits) matchedSignals.push(`hard_stop:${hit}`);

  const hasBlocked = matchedSignals.some((s) => s.startsWith("blocked:"));
  const hasGate = matchedSignals.some((s) => s.startsWith("gate:") || s.startsWith("hard_stop:"));
  const hasSafe = matchedSignals.some((s) => s.startsWith("safe:"));
  const hasPolicyGreen = policy?.approvalClass === "GREEN";
  const hasPolicyBlue = policy?.approvalClass === "BLUE";
  const hasPolicyRed = policy?.approvalClass === "RED";

  let verdict: ApprovalVerdict;
  let confidence: ApprovalClassification["confidence"] = "medium";

  if (hasBlocked) {
    verdict = "BLOCKED";
    reasons.push("Action matches blocked or forbidden patterns.");
    confidence = "high";
  } else if (hasPolicyRed || hasGate) {
    verdict = "TRUE_HUMAN_GATE";
    reasons.push(
      hasPolicyRed && policy
        ? `RED policy match: ${policy.candidateLabel}. Requires Ben approval every time.`
        : "Requires Ben approval per foreman/HUMAN_GATES.md."
    );
    confidence = "high";
  } else if (hasPolicyBlue && policy) {
    verdict = "SAFE_MECHANICAL";
    reasons.push(`BLUE policy match: ${policy.candidateLabel}. Execute and write receipt.`);
    confidence = "high";
  } else if (hasPolicyGreen && policy) {
    verdict = "SAFE_MECHANICAL";
    reasons.push(`GREEN policy match: ${policy.candidateLabel}. Execute automatically.`);
    confidence = "high";
  } else if (hasSafe) {
    verdict = "SAFE_MECHANICAL";
    reasons.push("Routine technical proof inside approved scope - proceed without Operator gate.");
    confidence = matchedSignals.filter((s) => s.startsWith("safe:")).length > 1 ? "high" : "medium";
  } else {
    verdict = "AMBIGUOUS";
    reasons.push("No strong match - check foreman/HUMAN_GATES.md before proceeding.");
    confidence = "low";
  }

  const operatorLine =
    policy && verdict === "SAFE_MECHANICAL" && policy.approvalClass === "BLUE"
      ? "PROCEED: BLUE approved class - execute and receipt."
      : policy && verdict === "SAFE_MECHANICAL" && policy.approvalClass === "GREEN"
        ? "PROCEED: GREEN approved class - execute automatically."
        : policy && verdict === "TRUE_HUMAN_GATE" && policy.approvalClass === "RED"
          ? "STOP: RED approved class requires Ben approval every time."
          : verdict === "SAFE_MECHANICAL"
            ? "PROCEED: not a human gate."
            : verdict === "TRUE_HUMAN_GATE"
              ? "STOP: HUMAN GATE."
              : verdict === "BLOCKED"
                ? "BLOCKED - do not proceed."
                : "AMBIGUOUS - Operator review required.";

  return {
    verdict,
    approvalClass: policy?.approvalClass ?? null,
    approvalPolicyId: policy?.candidateId ?? null,
    receiptRequired: policy?.receiptRequired ?? false,
    confidence,
    reasons,
    matchedSignals,
    operatorLine
  };
}
