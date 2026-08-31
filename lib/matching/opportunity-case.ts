import type { RecommendationKind } from "@/lib/squibb/recommendations";

import { buildMatchingReadout } from "@/lib/matching/deliver";
import { runLayer0 } from "@/lib/matching/layer0";
import { evaluateNotMatch } from "@/lib/matching/not-match";
import { scorePaths } from "@/lib/matching/score-paths";
import { starterProfileForSignals } from "@/lib/matching/starter-profile";
import type {
  ScoredPath,
  ShadowMatchingRun,
  StarterProfileDraft,
  StructuredSignals
} from "@/lib/matching/types";

export type OpportunityProvenance = "self_reported" | "rule_derived" | "missing";

export type OpportunityFact = Readonly<{
  id: "project" | "stage" | "goal" | "current_obstacle" | "resources" | "offer" | "constraints";
  label: string;
  value: string;
  provenance: OpportunityProvenance;
}>;

export type OpportunityPathSupport = Readonly<{
  kind: RecommendationKind;
  rank: number;
  rulesScore: number;
  support: "directly_supported" | "partial_support" | "needs_more_information" | "excluded_by_rules";
  raisedBy: readonly OpportunityFact[];
  loweredBy: readonly string[];
}>;

export type OpportunityProfileContribution = Readonly<
  Omit<StarterProfileDraft, "resources" | "offers" | "seeks" | "constraints" | "missing"> & {
    resources: readonly string[];
    offers: readonly string[];
    seeks: readonly string[];
    constraints: readonly string[];
    missing: readonly string[];
  }
>;

export type OpportunityCase = Readonly<{
  version: "v1";
  intakeId: string;
  facts: readonly OpportunityFact[];
  memberPathStatuses: readonly Readonly<{
    pathId: StructuredSignals["pathStatuses"][number]["pathId"];
    pathLabel: string;
    status: "considering" | "tried" | "ruled_out";
  }>[];
  hypotheses: readonly Readonly<{
    statement: string;
    provenance: "rule_derived";
    evidenceFor: readonly string[];
    missingEvidence: readonly string[];
    falsifiers: readonly string[];
  }>[];
  notMatch: Readonly<{
    outcome: ShadowMatchingRun["notMatch"]["outcome"];
    reason: string;
    suppressedPaths: readonly Readonly<{ kind: RecommendationKind; reason: string }>[];
  }>;
  paths: readonly OpportunityPathSupport[];
  profileContribution: OpportunityProfileContribution;
}>;

type OpportunityCaseRun = Pick<
  ShadowMatchingRun,
  "intakeId" | "signals" | "layer0" | "notMatch" | "readout"
>;

const PATH_FACTS: Record<RecommendationKind, readonly OpportunityFact["id"][]> = {
  translate_need: ["project", "current_obstacle", "goal", "constraints"],
  verify_proof: ["project", "stage", "goal", "resources"],
  stage_intro_candidate: ["current_obstacle", "offer", "constraints"],
  find_partner: ["current_obstacle", "offer", "constraints"],
  find_equipment: ["current_obstacle", "resources", "constraints"],
  find_banker: ["current_obstacle", "resources", "constraints"],
  find_credit_union: ["current_obstacle", "resources", "constraints"],
  find_better_job: ["goal", "current_obstacle", "constraints"],
  stay_current_job: ["goal", "resources", "constraints"],
  relocate: ["goal", "current_obstacle", "constraints"],
  get_training: ["current_obstacle", "resources", "goal"],
  raise_capital: ["current_obstacle", "resources", "goal", "constraints"]
};

function join(values: readonly string[]): string {
  return values.map((value) => value.trim()).filter(Boolean).join("; ");
}

function fact(
  id: OpportunityFact["id"],
  label: string,
  value: string
): OpportunityFact {
  const clean = value.trim();
  return Object.freeze({
    id,
    label,
    value: clean,
    provenance: clean ? "self_reported" : "missing"
  });
}

function buildFacts(profile: StarterProfileDraft): readonly OpportunityFact[] {
  return Object.freeze([
    fact("project", "What you are making real", profile.project),
    fact("stage", "Where it is today", profile.stage),
    fact("goal", "What a good result looks like", profile.goal),
    fact("current_obstacle", "What is in the way", join(profile.seeks)),
    fact("resources", "What you have to work with", join(profile.resources)),
    fact("offer", "What you can offer another member", join(profile.offers)),
    fact("constraints", "What cannot change", join(profile.constraints))
  ]);
}

function supportForPath(path: ScoredPath, facts: readonly OpportunityFact[]): OpportunityPathSupport {
  const relevant = PATH_FACTS[path.kind]
    .map((id) => facts.find((item) => item.id === id))
    .filter((item): item is OpportunityFact => Boolean(item));
  const raisedBy = Object.freeze(relevant.filter((item) => item.provenance === "self_reported"));
  const missing = relevant
    .filter((item) => item.provenance === "missing")
    .map((item) => `${item.label} was not provided.`);
  const loweredBy = Object.freeze([
    ...(path.disqualified && path.disqualifyReason ? [path.disqualifyReason] : []),
    ...missing
  ]);

  const support: OpportunityPathSupport["support"] = path.disqualified
    ? "excluded_by_rules"
    : raisedBy.length >= 2
      ? "directly_supported"
      : raisedBy.length === 1
        ? "partial_support"
        : "needs_more_information";

  return Object.freeze({
    kind: path.kind,
    rank: path.rank,
    rulesScore: path.score,
    support,
    raisedBy,
    loweredBy
  });
}

function hasDirectIntent(kind: RecommendationKind, run: OpportunityCaseRun): boolean {
  const signals = run.signals;
  if (kind === "translate_need" || kind === "verify_proof") return Boolean(signals.statedNeed.trim());
  // Persisted local preview runs created before the structured path-status
  // contract do not have consideringKinds. Treat that missing field as no
  // explicit current intent instead of crashing the member walkthrough.
  if (Array.isArray(signals.consideringKinds) && signals.consideringKinds.includes(kind)) return true;
  if (["find_banker", "find_credit_union", "raise_capital"].includes(kind)) return signals.capitalSeeking;
  if (["find_partner", "stage_intro_candidate"].includes(kind)) return signals.partnerSeeking;
  if (kind === "find_equipment") return false;
  if (kind === "find_better_job" || kind === "stay_current_job") return signals.jobSeeking;
  if (kind === "relocate") return signals.relocationSignal;
  if (kind === "get_training") return signals.trainingSeeking;
  return false;
}

function pathSupport(path: ScoredPath, facts: readonly OpportunityFact[], run: OpportunityCaseRun) {
  const basic = supportForPath(path, facts);
  if (basic.support === "excluded_by_rules" || hasDirectIntent(path.kind, run)) return basic;
  return Object.freeze({
    ...basic,
    support: basic.raisedBy.length > 0 ? "partial_support" as const : "needs_more_information" as const,
    loweredBy: Object.freeze([
      ...basic.loweredBy,
      "No explicit current intent for this path was found in the member's answers."
    ])
  });
}

function freezeProfile(profile: StarterProfileDraft): OpportunityProfileContribution {
  return Object.freeze({
    ...profile,
    resources: Object.freeze([...profile.resources]),
    offers: Object.freeze([...profile.offers]),
    seeks: Object.freeze([...profile.seeks]),
    constraints: Object.freeze([...profile.constraints]),
    missing: Object.freeze([...profile.missing])
  });
}

/**
 * One causal object shared by solution reasoning and later formation matching.
 * It never fills a member field from a rule. Rules may propose hypotheses, but
 * only explicit self-report enters profileContribution.
 */
export function buildOpportunityCase(
  run: OpportunityCaseRun,
  scoredPaths: readonly ScoredPath[] = run.readout.scoredPaths
): OpportunityCase {
  const starterProfile = starterProfileForSignals(run.signals);
  const facts = buildFacts(starterProfile);
  const missingEvidence = Object.freeze([
    ...run.readout.proofGaps,
    ...facts
      .filter((item) => item.provenance === "missing")
      .map((item) => item.label)
  ].filter((value, index, values) => value && values.indexOf(value) === index));
  const evidenceFor = Object.freeze(
    facts
      .filter((item) => item.provenance === "self_reported")
      .slice(0, 4)
      .map((item) => `${item.label}: ${item.value}`)
  );
  const hypothesisStatements = [
    run.layer0.translatedNeed,
    ...run.layer0.alternativeHypotheses
  ].filter((value, index, values) => value.trim() && values.indexOf(value) === index);
  const hypotheses = Object.freeze(
    hypothesisStatements.slice(0, 4).map((statement) => Object.freeze({
      statement,
      provenance: "rule_derived" as const,
      evidenceFor,
      missingEvidence,
      falsifiers: Object.freeze([...run.readout.falsifiers])
    }))
  );
  const suppressedPaths = Object.freeze(
    run.notMatch.disqualified.map((item) => Object.freeze({ ...item }))
  );
  const paths = Object.freeze(scoredPaths.map((path) => pathSupport(path, facts, run)));
  const memberPathStatuses = Object.freeze(
    (run.signals.pathStatuses ?? []).map((item) => Object.freeze({ ...item }))
  );

  return Object.freeze({
    version: "v1",
    intakeId: run.intakeId,
    facts,
    memberPathStatuses,
    hypotheses,
    notMatch: Object.freeze({
      outcome: run.notMatch.outcome,
      reason: run.notMatch.reason,
      suppressedPaths
    }),
    paths,
    profileContribution: freezeProfile(starterProfile)
  });
}

/** Pure local evaluation for every surface that has the same owner signals. */
export function buildOpportunityCaseFromSignals(signals: StructuredSignals): OpportunityCase {
  const layer0 = runLayer0(signals);
  const notMatch = evaluateNotMatch(signals, layer0);
  const scoredPaths = scorePaths(signals, layer0, notMatch);
  const readout = buildMatchingReadout(signals, layer0, notMatch, scoredPaths);
  return buildOpportunityCase({
    intakeId: signals.intakeId,
    signals,
    layer0,
    notMatch,
    readout
  }, scoredPaths);
}
