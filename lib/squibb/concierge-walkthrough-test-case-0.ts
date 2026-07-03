/**

 * Squibb Concierge User #0 — Test Case #0

 * Display-only diagnosis flow. No matching. No candidates.

 */



import type { ConfidenceLabel, HumanGateRequirement } from "@/lib/squibb/walkthrough-types";



export type ExperimentPrompt = {

  id: string;

  question: string;

  whyItMatters: string;

};



export type ConciergeUser0Flow = {

  version: "user-0";

  testCaseId: "0";

  symptom: {

    quote: string;

    inPlainTerms: string;

  };

  reversibleTest: {

    action: string;

    expectedLearning: string;

    timeCost: string;

    prompts: ExperimentPrompt[];

  };

  recommendation: {

    humanGates: HumanGateRequirement[];

    confidence: {

      score: number;

      label: ConfidenceLabel;

      why: string;

    };

  };

};



export const CONCIERGE_USER_0_FLOW: ConciergeUser0Flow = {

  version: "user-0",

  testCaseId: "0",

  symptom: {

    quote: "I think I need a business partner.",

    inPlainTerms: "You said partner before naming the problem."

  },

  reversibleTest: {

    action: "Answer three questions on paper. No names. No outreach. No equity talk.",

    expectedLearning: "You'll know if the gap is money, help, skill, or clarity — and whether \"partner\" still fits.",

    timeCost: "~30 minutes",

    prompts: [

      {

        id: "outcome",

        question: "What would a partner unlock in 90 days that you can't reach alone?",

        whyItMatters: ""

      },

      {

        id: "alternatives",

        question: "Could a contractor, lender, or hire solve this without equity?",

        whyItMatters: ""

      },

      {

        id: "job-desc",

        question: "What would they do in week one — not their title?",

        whyItMatters: ""

      }

    ]

  },

  recommendation: {

    confidence: {

      score: 28,

      label: "low",

      why: "One sentence in. Zero proof out."

    },

    humanGates: [

      {

        id: "gate-preview",

        label: "Preview only",

        kind: "none",

        severity: "info",

        reason: "Display-only. Nothing sends automatically.",

        benMustApprove: false

      },

      {

        id: "gate-ben-partner-outreach",

        label: "Ben review before outreach",

        kind: "operator_approval",

        severity: "blocker",

        reason: "Partner commitments are hard to undo.",

        benMustApprove: true

      },

      {

        id: "gate-need-class",

        label: "Confirm the real gap",

        kind: "petra_review",

        severity: "warning",

        reason: "Formal partnership may need Comptroller review.",

        benMustApprove: true

      }

    ]

  }

};



/** @deprecated Use loadConciergeUser0Flow */

export type ConciergeWalkthroughTestCase0 = ConciergeUser0Flow;



/** @deprecated Leverage inventory removed from User #0 UX */

export type LeverageItem = {

  id: string;

  label: string;

  detail: string;

  status: "have" | "missing" | "unclear";

};



export function loadConciergeUser0Flow(): ConciergeUser0Flow {

  return CONCIERGE_USER_0_FLOW;

}



export function loadConciergeWalkthroughTestCase0(): ConciergeUser0Flow {

  return loadConciergeUser0Flow();

}


