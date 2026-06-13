/**
 * Squibb Concierge Walkthrough v0 — Test Case #0
 * Display-only diagnosis flow. No matching. No candidates.
 */

import type { ConfidenceLabel, HumanGateRequirement } from "@/lib/squibb/walkthrough-types";

export type ConciergeWalkthroughTestCase0 = {
  version: "v0";
  testCaseId: "0";
  input: string;
  statedNeed: string;
  leverageInventory: string[];
  missingLeverageHypotheses: string[];
  diagnosticQuestions: string[];
  speakerTranslation: string;
  recommendationClass: {
    label: string;
    explanation: string;
  };
  confidence: {
    score: number;
    label: ConfidenceLabel;
    why: string;
  };
  humanGates: HumanGateRequirement[];
  smallestReversibleNextStep: string;
};

export const CONCIERGE_WALKTHROUGH_TEST_CASE_0: ConciergeWalkthroughTestCase0 = {
  version: "v0",
  testCaseId: "0",
  input: "I think I need a business partner.",
  statedNeed: "I think I need a business partner.",
  leverageInventory: [
    "Operator intent is clear — they believe a partner is the missing piece.",
    "Domain commitment implied — they are building or buying into a business, not browsing.",
    "Self-diagnosis only — no entity structure, runway, or role split on record yet.",
    "No verified proof of what the partner would actually do (capital, ops, sales, craft)."
  ],
  missingLeverageHypotheses: [
    "Capital leverage — they may need money, not a co-owner.",
    "Operational leverage — they may need someone to run production, not share equity.",
    "Distribution leverage — they may need channels or customers, not a second founder.",
    "Skill leverage — they may need a specialist (legal, finance, technical), not a general partner.",
    "Emotional leverage — loneliness or uncertainty may be masquerading as a partnership need."
  ],
  diagnosticQuestions: [
    "What specific outcome would a partner unlock that you cannot reach alone in 90 days?",
    "Is the gap capital, labor, skill, credibility, or decision-making — rank them.",
    "Would a contractor, advisor, lender, or employee solve the same problem without equity?",
    "What would you give up (control, margin, time) and is that reversible if wrong?",
    "Have you written the first-week job description for this partner — not the title?"
  ],
  speakerTranslation:
    "Stated need is partner-shaped language. Bottleneck is not yet classified. Speaker cannot endorse partner retrieval until need class is established — the word \"partner\" may mean co-founder, investor, operator, or mentor. Matching stays blocked.",
  recommendationClass: {
    label: "Need-class diagnosis required (partner retrieval deferred)",
    explanation:
      "Squibb assigns a recommendation class, not a person. This case stays in diagnosis until leverage inventory and diagnostic answers confirm whether the true need is partnership, capital, ops, or something else."
  },
  confidence: {
    score: 28,
    label: "low",
    why: "Single self-reported sentence. No leverage proof, no entity context, no answered diagnostic questions. Confidence in any partner-shaped move would be irresponsible."
  },
  humanGates: [
    {
      id: "gate-preview",
      label: "Walkthrough preview only",
      kind: "none",
      severity: "info",
      reason: "Static display flow. No outreach, intros, or equity moves.",
      benMustApprove: false
    },
    {
      id: "gate-ben-partner-outreach",
      label: "Ben review before any partner outreach",
      kind: "operator_approval",
      severity: "blocker",
      reason:
        "Introducing or committing to a business partner is irreversible-adjacent. Operator must approve before any candidate retrieval or external intro.",
      benMustApprove: true
    },
    {
      id: "gate-need-class",
      label: "Need class must be confirmed",
      kind: "petra_review",
      severity: "warning",
      reason: "Comptroller may require GO/NO-GO if diagnosis implies production-facing partnership structure.",
      benMustApprove: true
    }
  ],
  smallestReversibleNextStep:
    "Answer the five diagnostic questions in writing — one paragraph each, no names, no candidate search. Revisit when need class is explicit. Matching remains off."
};

export function loadConciergeWalkthroughTestCase0(): ConciergeWalkthroughTestCase0 {
  return CONCIERGE_WALKTHROUGH_TEST_CASE_0;
}
