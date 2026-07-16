/**
 * Squibb Recommendation Surface v1 — UI/workflow types and static demo deck.
 * No AI model. No matching engine. Operator-facing presentation only.
 */

export type RecommendationKind =
  | "translate_need"
  | "verify_proof"
  | "stage_intro_candidate"
  | "find_partner"
  | "find_equipment"
  | "find_banker"
  | "find_credit_union"
  | "find_better_job"
  | "stay_current_job"
  | "relocate"
  | "get_training"
  | "raise_capital";

export type EvidenceStrength = "verified" | "self_reported" | "inferred" | "missing";

export type ConfidenceLabel = "low" | "medium" | "high";

export type HumanGateSeverity = "info" | "warning" | "blocker";

export type HumanGateKind =
  | "none"
  | "operator_approval"
  | "petra_review"
  | "crucible_proof"
  | "legal_review"
  | "financial_commitment"
  | "external_intro";

export interface EvidenceItem {
  id: string;
  label: string;
  strength: EvidenceStrength;
  source?: string;
}

export interface HumanGateRequirement {
  id: string;
  label: string;
  kind: HumanGateKind;
  severity: HumanGateSeverity;
  reason: string;
  benMustApprove: boolean;
}

export interface SquibbRecommendation {
  id: string;
  kind: RecommendationKind;
  rank: number;
  title: string;
  headline: string;
  squibbNote: string;
  reasoning: {
    statedNeed: string;
    translatedNeed?: string;
    rationale: string[];
    counterpoint?: string;
  };
  confidence: {
    score: number;
    label: ConfidenceLabel;
    why: string;
  };
  evidence: EvidenceItem[];
  humanGates: HumanGateRequirement[];
  suggestedAgent: string;
  suggestedTool?: string;
  keepOriginalPathLabel: string;
}

export interface SquibbRecommendationSession {
  version: "v1";
  statedNeed: string;
  operatorContext: string;
  squibbIntro: string;
  source?: SquibbRecommendationSessionSource;
  ranked: SquibbRecommendation[];
  catalog: SquibbRecommendation[];
}

export type SquibbRecommendationSessionSource = {
  mode: "demo" | "latest_intake";
  label: string;
  detail: string;
  intakeId?: string;
  packetPath?: string;
  speakerEntryPath?: string;
  capturedAt?: string;
  answeredCount?: number;
  totalQuestions?: number;
  symptomBlock?: string;
};

export type SquibbRecommendationSessionInput = {
  statedNeed?: string;
  operatorContext?: string;
  squibbIntro?: string;
  source?: SquibbRecommendationSessionSource;
  symptomBlock?: string;
};

export const RECOMMENDATION_KIND_LABELS: Record<RecommendationKind, string> = {
  translate_need: "Translate need",
  verify_proof: "Verify proof",
  stage_intro_candidate: "Stage intro candidate",
  find_partner: "Find partner",
  find_equipment: "Find equipment",
  find_banker: "Find banker",
  find_credit_union: "Find credit union",
  find_better_job: "Find better job",
  stay_current_job: "Stay in current job",
  relocate: "Relocate",
  get_training: "Get training",
  raise_capital: "Raise capital"
};

const DEMO_STATED_NEED =
  "I need a business partner and investor before I can buy the bakery equipment.";

function baseGates(kind: RecommendationKind): HumanGateRequirement[] {
  const shared: HumanGateRequirement[] = [
    {
      id: "gate-preview",
      label: "Recommendation only",
      kind: "none",
      severity: "info",
      reason: "Nothing here sends an introduction, commits funds, or creates a contract.",
      benMustApprove: false
    }
  ];

  switch (kind) {
    case "stage_intro_candidate":
    case "raise_capital":
    case "find_banker":
      return [
        ...shared,
        {
          id: "gate-petra-capital",
          label: "Capital structure approval",
          kind: "petra_review",
          severity: "blocker",
          reason: "Securities, lending, and ownership moves require expert review.",
          benMustApprove: true
        },
        {
          id: "gate-crucible-financial",
          label: "Financial claims verification",
          kind: "crucible_proof",
          severity: "warning",
          reason: "Revenue, liquidity, and business-stage claims must be verified before lender intro.",
          benMustApprove: false
        }
      ];
    case "translate_need":
    case "verify_proof":
      return [
        ...shared,
        {
          id: "gate-human-read",
          label: "Human review before action",
          kind: "operator_approval",
          severity: "warning",
          reason: "A human must choose whether this becomes an introduction, task, or request for evidence.",
          benMustApprove: true
        }
      ];
    case "find_partner":
    case "find_credit_union":
      return [
        ...shared,
        {
          id: "gate-operator-intro",
          label: "Your approval — guarded introduction",
          kind: "operator_approval",
          severity: "warning",
          reason: "Warm introductions and partnership conversations require your approval.",
          benMustApprove: true
        },
        {
          id: "gate-legal-partner",
          label: "Legal review — partnership terms",
          kind: "legal_review",
          severity: "info",
          reason: "Equity, operating agreements, and co-ownership need counsel before signing.",
          benMustApprove: true
        }
      ];
    case "find_better_job":
    case "stay_current_job":
    case "relocate":
      return [
        ...shared,
        {
          id: "gate-operator-career",
          label: "Your judgment — career move",
          kind: "operator_approval",
          severity: "warning",
          reason: "Job change versus staying put is a human judgment call Werkles cannot make for you.",
          benMustApprove: true
        }
      ];
    default:
      return shared;
  }
}

function makeRecommendation(
  kind: RecommendationKind,
  rank: number,
  overrides: Partial<SquibbRecommendation> & Pick<SquibbRecommendation, "id" | "title" | "headline" | "squibbNote" | "reasoning" | "confidence" | "evidence">
): SquibbRecommendation {
  return {
    kind,
    rank,
    suggestedAgent: "Werkles recommendation guide",
    keepOriginalPathLabel: "Keep original path",
    humanGates: baseGates(kind),
    ...overrides
  };
}

/** Ranked deck for the demo scenario — Layer 0 translation, not a live match. */
const rankedDeck: SquibbRecommendation[] = [
  makeRecommendation("find_equipment", 1, {
    id: "rec-equipment",
    title: "Find equipment first",
    headline: "The oven quote is the nearer bottleneck — not the partner.",
    squibbNote:
      "Squibb: You said partner and investor. The priced asset is already on the table. Partners show up faster when the machine is real.",
    reasoning: {
      statedNeed: DEMO_STATED_NEED,
      translatedNeed: "Validate equipment cost and seller before raising or partnering.",
      rationale: [
        "A specific oven quote exists — capital ask can be sized to a number.",
        "Equipment purchase does not require equity dilution on day one.",
        "Proof of a real asset makes lender and partner conversations concrete."
      ],
      counterpoint: "If the seller is unverified, pause equipment and verify before any capital move."
    },
    confidence: {
      score: 78,
      label: "high",
      why: "Named asset, price band, and seller contact are present in the information provided."
    },
    evidence: [
      { id: "e1", label: "Oven quote $42k–$48k (self-reported)", strength: "self_reported", source: "Your intake" },
      { id: "e2", label: "Seller business listing found", strength: "inferred", source: "Public listing" },
      { id: "e3", label: "Revenue history for bakery", strength: "missing" },
      { id: "e4", label: "Equipment inspection report", strength: "missing" }
    ],
    suggestedAgent: "Werkles guide + local specialist",
    suggestedTool: "Equipment seller check",
    humanGates: [
      ...baseGates("find_equipment"),
      {
        id: "gate-equipment-purchase",
        label: "Financial commitment — equipment purchase",
        kind: "financial_commitment",
        severity: "blocker",
        reason: "No deposit or purchase without your approval and a verified seller.",
        benMustApprove: true
      }
    ]
  }),
  makeRecommendation("find_credit_union", 2, {
    id: "rec-cu",
    title: "Find credit union",
    headline: "Member-owned lending may fit equipment better than equity.",
    squibbNote:
      "Squibb: Credit unions often underwrite equipment when the story is boring and documented. Less theater than a 'strategic partner.'",
    reasoning: {
      statedNeed: DEMO_STATED_NEED,
      translatedNeed: "Equipment-backed member lending before equity partner search.",
      rationale: [
        "Fixed asset collateral maps cleanly to CU equipment programs.",
        "Lower dilution than bringing a partner for the same dollars.",
        "Faster path if personal credit and down payment are in range."
      ]
    },
    confidence: {
      score: 62,
      label: "medium",
      why: "Structure fits, but liquidity band and personal guarantee appetite are unverified."
    },
    evidence: [
      { id: "e5", label: "Working style: Builder / hands-on operator", strength: "self_reported" },
      { id: "e6", label: "Liquidity band verified", strength: "missing" },
      { id: "e7", label: "Local CU programs researched", strength: "inferred" }
    ],
    suggestedAgent: "Werkles research guide",
    suggestedTool: "Credit union equipment checklist",
    humanGates: baseGates("find_credit_union")
  }),
  makeRecommendation("get_training", 3, {
    id: "rec-training",
    title: "Get training",
    headline: "Commercial baking ops training reduces expensive partner dependency.",
    squibbNote:
      "Squibb: Sometimes the missing 'partner' is a week of operator training, not a co-founder.",
    reasoning: {
      statedNeed: DEMO_STATED_NEED,
      translatedNeed: "Close skill gap before sharing equity for operational coverage.",
      rationale: [
        "First commercial kitchen — production scheduling is a known blind spot.",
        "Training is reversible; partnership is not.",
        "Certification becomes proof for lenders and future hires."
      ]
    },
    confidence: {
      score: 55,
      label: "medium",
      why: "Skill gap is plausible from intake, but no training quotes or schedules on file."
    },
    evidence: [
      { id: "e8", label: "First commercial kitchen (self-reported)", strength: "self_reported" },
      { id: "e9", label: "Prior production volume", strength: "missing" }
    ],
    suggestedAgent: "Training planner",
    suggestedTool: "Training plan"
  })
];

export function buildLiveIntakeRankedDeck(statedNeed: string, symptomBlock?: string): SquibbRecommendation[] {
  const sourceEvidence: EvidenceItem[] = [
    { id: "live-intake-source", label: "Latest intake", strength: "self_reported", source: "Your intake" },
    { id: "live-human-translation", label: "Human translation not completed", strength: "missing" },
    { id: "live-third-party-proof", label: "Third-party proof not attached", strength: "missing" }
  ];

  return [
    makeRecommendation("translate_need", 1, {
      id: "rec-translate-need",
      title: "Translate the bottleneck",
      headline: "Turn the intake into one plain next-move hypothesis before chasing people or money.",
      squibbNote:
        "Squibb: The stated ask is source material, not the verdict. Translate it before anyone starts shopping for a solution.",
      reasoning: {
        statedNeed,
        translatedNeed: "Human-readable bottleneck statement from the latest intake.",
        rationale: [
          "The intake is symptom-only by design, so the first action is translation rather than matching.",
          "A translated bottleneck gives reviewers something concrete to critique.",
          "This prevents the first packet from becoming an unearned intro, funding ask, or vendor hunt."
        ],
        counterpoint: symptomBlock
          ? "Source symptoms are present. Human review still has to decide what they mean."
          : "No symptom block was available, so this stays a source-review move."
      },
      confidence: {
        score: 72,
        label: "high",
        why: "A current intake exists, but the translation slot is still open."
      },
      evidence: sourceEvidence,
      suggestedAgent: "Human review",
      suggestedTool: "Intake summary",
      keepOriginalPathLabel: "Keep raw intake only"
    }),
    makeRecommendation("verify_proof", 2, {
      id: "rec-proof-gap",
      title: "Name the proof gap",
      headline: "List the one or two facts that would make the next move safer.",
      squibbNote:
        "Squibb: Before asking who can help, ask what proof would change the decision.",
      reasoning: {
        statedNeed,
        translatedNeed: "A proof request that can be answered before dispatch.",
        rationale: [
          "Most Werkles moves should not rely on self-report alone.",
          "Proof gaps can become smaller packets: quote, license, identity, funds posture, reference, or current status.",
          "A proof packet lets the operator move without pretending the full recommendation is verified."
        ]
      },
      confidence: {
        score: 64,
        label: "medium",
        why: "The need is present, but the exact proof target still needs a human read."
      },
      evidence: sourceEvidence,
      suggestedAgent: "Evidence review",
      suggestedTool: "Evidence request",
      keepOriginalPathLabel: "Skip proof packet for now"
    }),
    makeRecommendation("stage_intro_candidate", 3, {
      id: "rec-intro-candidate",
      title: "Stage one guarded candidate",
      headline: "Create a candidate packet only after translation and proof gap are visible.",
      squibbNote:
        "Squibb: A candidate is not an intro. It is a thing a human can approve, reject, or sharpen.",
      reasoning: {
        statedNeed,
        translatedNeed: "A guarded candidate packet for a person, lender, space, tool, or training path.",
        rationale: [
          "The operator gets momentum without sending anything outside Werkles.",
          "The candidate packet can carry gates instead of hiding them.",
          "A staged candidate gives Swanson's relay build a useful payload to route later."
        ]
      },
      confidence: {
        score: 52,
        label: "medium",
        why: "Candidate staging is useful, but premature until translation and proof gaps are visible."
      },
      evidence: sourceEvidence,
      suggestedAgent: "Candidate review",
      suggestedTool: "Candidate information",
      keepOriginalPathLabel: "Do not stage candidate"
    })
  ];
}

/** Full catalog — one exemplar card per recommendation type for UI reference. */
const catalogDeck: SquibbRecommendation[] = (
  Object.keys(RECOMMENDATION_KIND_LABELS) as RecommendationKind[]
).map((kind, index) => {
  const label = RECOMMENDATION_KIND_LABELS[kind];
  return makeRecommendation(kind, index + 1, {
    id: `catalog-${kind}`,
    title: label,
    headline: `Consider whether “${label.toLowerCase()}” fits your situation.`,
    squibbNote: `Squibb: This is one option to consider — not a decision made for you.`,
    reasoning: {
      statedNeed: DEMO_STATED_NEED,
      rationale: [
        `Frames ${label.toLowerCase()} as one possible next step.`,
        "Reasoning stays evidence-led; Squibb widens the map without deciding.",
        "Ground this option in your intake before acting."
      ]
    },
    confidence: {
      score: 40 + (index % 3) * 15,
      label: index % 3 === 0 ? "low" : index % 3 === 1 ? "medium" : "high",
      why: "This example is not yet grounded in your intake."
    },
    evidence: [
      { id: `${kind}-ev-1`, label: "Your stated need on file", strength: "self_reported" },
      { id: `${kind}-ev-2`, label: "Verification step", strength: "missing" },
      { id: `${kind}-ev-3`, label: "Third-party proof", strength: "missing" }
    ],
    suggestedAgent: "Werkles recommendation guide",
    keepOriginalPathLabel: "Ignore this option"
  });
});

export function loadSquibbRecommendationSession(): SquibbRecommendationSession {
  return {
    version: "v1",
    statedNeed: DEMO_STATED_NEED,
    operatorContext: "First commercial bakery · equipment financing decision",
    squibbIntro:
      "Squibb notices what is easy to miss. These are ranked options — not orders. You hold the decision.",
    ranked: rankedDeck,
    catalog: catalogDeck
  };
}

export function confidenceLabelFromScore(score: number): ConfidenceLabel {
  if (score >= 70) return "high";
  if (score >= 45) return "medium";
  return "low";
}
