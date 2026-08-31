import "server-only";

import { readLatestSpeakerIntakeForOwner } from "@/lib/squibb/concierge-intake-storage";
import { signalsFromConcierge } from "@/lib/matching/signals";
import type { StructuredSignals } from "@/lib/matching/types";
import {
  CONCIERGE_INTAKE_QUESTIONS,
  EMPTY_INTAKE_ANSWERS,
  type ConciergeIntakeAnswers,
  type ConciergeIntakeFieldId
} from "@/lib/squibb/concierge-intake-v0";
import { isGhostFleetEnabled, listGhostMembers, rankGhostsForSignals } from "@/lib/ghost-fleet";
import { describeWorkshopPressure } from "@/lib/owner-surfaces/workshop-pressure";
import {
  buildOpportunityCaseFromSignals,
  type OpportunityCase
} from "@/lib/matching/opportunity-case";

/**
 * One owner-bound read shared by Workshop, Proof, and Dues so the three
 * surfaces cannot drift into telling the member three different stories.
 * Every field is derived from that owner's own intake. Nothing is invented
 * when there is no intake — callers get `hasIntake: false` and say so.
 */

export type OwnerCarryingRow = {
  id: ConciergeIntakeFieldId;
  label: string;
  value: string;
  answered: boolean;
};

export type OwnerProofCheck = {
  id: string;
  label: string;
  /** Why this check matters for this member specifically. */
  why: string;
  /** What a passing check would and would not change. */
  changes: string;
  priority: "high" | "medium" | "low";
};

export type OwnerNextStep = {
  label: string;
  detail: string;
  href?: string;
};

export type OwnerSurfaceState = {
  hasIntake: boolean;
  intakeId: string | null;
  capturedAt: string | null;
  statedNeed: string | null;
  answeredCount: number;
  totalQuestions: number;
  pressure: string;
  carrying: OwnerCarryingRow[];
  missingCoverage: string[];
  opportunityCase: OpportunityCase | null;
  candidates: {
    available: boolean;
    count: number;
    reviewRequired: number;
    topName: string | null;
    topScore: number | null;
  };
  nextSteps: OwnerNextStep[];
  proofChecks: OwnerProofCheck[];
  duesUnlocked: string[];
  duesDoNotChange: string[];
};

const WORKSHOP_LABELS: Record<ConciergeIntakeFieldId, string> = {
  heaviest_lift: "What you are trying to make real",
  business_stage: "Where it is today",
  already_tried: "What you have already tried",
  time_cost: "What is getting in the way",
  stuck_decision: "The next decision",
  success_twelve_months: "What a good year looks like",
  resources_on_hand: "What you already have",
  what_you_offer: "What you can offer",
  constraints: "What cannot change"
};

export function emptyOwnerSurfaceState(): OwnerSurfaceState {
  return {
    hasIntake: false,
    intakeId: null,
    capturedAt: null,
    statedNeed: null,
    answeredCount: 0,
    totalQuestions: CONCIERGE_INTAKE_QUESTIONS.length,
    pressure: "Nothing to read yet — Werkles will not guess at your situation.",
    carrying: [],
    missingCoverage: [],
    opportunityCase: null,
    candidates: { available: false, count: 0, reviewRequired: 0, topName: null, topScore: null },
    nextSteps: [
      {
        label: "Run the concierge intake",
        detail: "A short set of questions about what you are making, what might help, and what you can offer. Everything on this page is built from your answers.",
        href: "/bellows/intake"
      }
    ],
    proofChecks: [],
    duesUnlocked: [],
    duesDoNotChange: [
      "Dues do not verify you, fund you, introduce you, or vouch for anyone else.",
      "Dues do not make an unverified member safe to trust."
    ]
  };
}

function answersFromPacket(symptoms: { id: string; answer: string }[]): ConciergeIntakeAnswers {
  const byId = new Map(symptoms.map((s) => [s.id, s.answer]));
  return CONCIERGE_INTAKE_QUESTIONS.reduce<ConciergeIntakeAnswers>(
    (next, question) => ({ ...next, [question.id]: byId.get(question.id) ?? "" }),
    { ...EMPTY_INTAKE_ANSWERS }
  );
}

function deriveMissingCoverage(signals: StructuredSignals): string[] {
  const coverage: string[] = [];
  if (signals.capitalSeeking) {
    coverage.push("Someone positioned to back, co-sign, or guarantee — not someone chasing the same money.");
  }
  if (signals.partnerSeeking) coverage.push("Operator coverage for the part of the work you cannot hold alone.");
  if (signals.trainingSeeking) coverage.push("A credential or training path, with a name on who teaches it.");
  if (signals.jobSeeking) coverage.push("A role change route that does not cost you the venture.");
  if (signals.relocationSignal) coverage.push("Local ground truth in the place you named.");
  if (coverage.length === 0) {
    coverage.push("Not enough signal yet to say what coverage you are missing. More intake detail changes this.");
  }
  return coverage;
}

function deriveProofChecks(signals: StructuredSignals): OwnerProofCheck[] {
  const checks: OwnerProofCheck[] = [
    {
      id: "identity",
      label: "Identity check",
      why: "Every ranked candidate you see is currently unverified. Yours is the half you control.",
      changes:
        "A pass shows other members that a real person stands behind your intake. It does not vouch for your finances or your business.",
      priority: "high"
    }
  ];

  if (signals.capitalSeeking) {
    checks.push({
      id: "funds",
      label: "Funds check",
      why: "You named money, a lease, or a guarantor. This is the check the other side will ask about first.",
      changes:
        "A pass shows that stated capacity was inspected on a date. It is not a credit decision, an approval, or a promise from anyone.",
      priority: "high"
    });
    checks.push({
      id: "entity",
      label: "Business entity check",
      why: "Lease and lending conversations stall when the entity behind them is unconfirmed.",
      changes: "A pass confirms the entity exists and who is attached to it. It says nothing about whether the deal is good.",
      priority: "medium"
    });
  }

  if (signals.trainingSeeking) {
    checks.push({
      id: "license",
      label: "License or credential copy",
      why: "You named a skill or credential gap, so credential claims on both sides matter more here.",
      changes: "A pass records what document was inspected. It does not certify competence.",
      priority: "medium"
    });
  }

  if (signals.partnerSeeking) {
    checks.push({
      id: "reference",
      label: "Work reference",
      why: "You named partnership. Partnership failures are usually reference failures.",
      changes: "A pass records who vouched and when. It does not transfer their judgment to Werkles.",
      priority: "low"
    });
  }

  return checks;
}

function deriveNextSteps(
  signals: StructuredSignals,
  answeredCount: number,
  candidateCount: number
): OwnerNextStep[] {
  const steps: OwnerNextStep[] = [];

  if (answeredCount < CONCIERGE_INTAKE_QUESTIONS.length) {
    steps.push({
      label: `Finish the intake (${answeredCount} of ${CONCIERGE_INTAKE_QUESTIONS.length} answered)`,
      detail: "Unanswered questions are the main reason a ranking comes back thin.",
      href: "/bellows/intake"
    });
  }

  if (candidateCount > 0) {
    steps.push({
      label: `Read the ${candidateCount} ranked candidates and their reasons`,
      detail: "Rank is a reading order, not a recommendation. Disagreeing with a reason is useful information.",
      href: "/dashboard/intros"
    });
  } else {
    steps.push({
      label: "No candidate cleared the bar yet",
      detail: "Werkles would rather show you nothing than pad the list. More intake detail changes the ranking.",
      href: "/bellows/intake"
    });
  }

  if (signals.capitalSeeking) {
    steps.push({
      label: "Get the cost sheet ready before any money conversation",
      detail: "Every capital-side member in this system asks for numbers first. Werkles cannot produce them for you."
    });
  }

  steps.push({
    label: "Werkles does not act for you",
    detail: "Nothing here sends a message, applies, introduces, or commits. Every outbound move stays yours."
  });

  return steps;
}

function duesUnlockedFor(candidateCount: number, answeredCount: number): string[] {
  return [
    `Concierge intake stored and readable: ${answeredCount > 0 ? "yes" : "not yet"}.`,
    `Ranked candidate readout with visible reasons: ${candidateCount > 0 ? `${candidateCount} available` : "none yet"}.`,
    "Workshop, Proof, and Intros surfaces bound to your own session.",
    "Verification checks available to start when you choose — priced separately from dues."
  ];
}

export async function loadOwnerSurfaceState(ownerId: string | null): Promise<OwnerSurfaceState> {
  if (!ownerId) return emptyOwnerSurfaceState();

  const latest = await readLatestSpeakerIntakeForOwner(ownerId);
  if (!latest) return emptyOwnerSurfaceState();

  const answers = answersFromPacket(latest.packet.symptoms);
  return buildOwnerSurfaceStateFromAnswers(
    latest.stored.intakeId,
    latest.packet.capturedAt,
    answers
  );
}

export async function buildOwnerSurfaceStateFromAnswers(
  intakeId: string,
  capturedAt: string,
  answers: ConciergeIntakeAnswers
): Promise<OwnerSurfaceState> {
  const signals = signalsFromConcierge(intakeId, answers);
  const opportunityCase = buildOpportunityCaseFromSignals(signals);
  const answeredCount = CONCIERGE_INTAKE_QUESTIONS.filter(
    (question) => answers[question.id].trim().length > 0
  ).length;

  const carrying: OwnerCarryingRow[] = CONCIERGE_INTAKE_QUESTIONS.map((question) => ({
    id: question.id,
    label: WORKSHOP_LABELS[question.id],
    value: answers[question.id],
    answered: answers[question.id].trim().length > 0
  }));

  let candidateCount = 0;
  let reviewRequired = 0;
  let topName: string | null = null;
  let topScore: number | null = null;
  const fleetOn = isGhostFleetEnabled();

  if (fleetOn) {
    const ranked = rankGhostsForSignals(signals, await listGhostMembers(), 12);
    candidateCount = ranked.candidates.length;
    reviewRequired = ranked.candidates.filter((c) => c.eligibility === "review_required").length;
    topName = ranked.candidates[0]?.displayName ?? null;
    topScore = ranked.candidates[0]?.score ?? null;
  }

  return {
    hasIntake: true,
    intakeId,
    capturedAt,
    statedNeed: signals.statedNeed,
    answeredCount,
    totalQuestions: CONCIERGE_INTAKE_QUESTIONS.length,
    pressure: describeWorkshopPressure(answers.time_cost),
    carrying,
    missingCoverage: deriveMissingCoverage(signals),
    opportunityCase,
    candidates: { available: fleetOn, count: candidateCount, reviewRequired, topName, topScore },
    nextSteps: deriveNextSteps(signals, answeredCount, candidateCount),
    proofChecks: deriveProofChecks(signals),
    duesUnlocked: duesUnlockedFor(candidateCount, answeredCount),
    duesDoNotChange: [
      "Dues do not verify you, fund you, introduce you, or vouch for anyone else.",
      "Dues do not make an unverified member safe to trust.",
      "Verification checks are priced and run separately from dues."
    ]
  };
}
