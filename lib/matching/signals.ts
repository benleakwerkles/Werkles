import type { ConciergeIntakeAnswers } from "@/lib/squibb/concierge-intake-v0";
import type { DiscoveryIntakeInput } from "@/lib/discovery/schema";
import { diagnoseLeverage } from "@/lib/matching/leverage";
import type { MatchingIntakeSource, StarterProfileDraft, StructuredSignals } from "@/lib/matching/types";
import { kindsForStatus, parseStructuredPathStatuses } from "@/lib/matching/path-state";

const PARTNER_WORDS =
  /\b(partner\w*|co-?founder|co-?own\w*|investor|backer|equity|operator|foreman|right[- ]hand)\b/i;
const CAPITAL_WORDS =
  /\b(loan\w*|borrow\w*|capital|fund\w*|money|credit|financ\w*|bank\w*|lender\w*|invest\w*|lease\w*|co-?signer|guarantor|landlord|storefront|mortgage)\b/i;
/* "I need to hire" is an operator need, not evidence that the member wants a
   job. Employment intent therefore requires job/career language or the person
   explicitly saying they want to get/be hired. */
const JOB_WORDS =
  /\b(job\w*|employment|career\w*|role change|bartend\w*|server|waiter|waitress)\b|\b(?:get|be|being)\s+hired\b/i;
const LEAVE_JOB_FOR_VENTURE =
  /\b(leave|quit|resign|leaving).{0,80}\b(job|employment)\b|\b(job|employment).{0,80}\b(so I can|to open|to start|to leave)\b/i;
const TRAINING_WORDS = /\b(train\w*|certif\w*|licen[cs]\w*|course\w*|class(?:es)?|learn\w*|skill\w*)\b/i;
const RELOC_WORDS = /\b(relocat\w*|mov(?:e|ing)|city|state|zip|metro|area)\b/i;
const NEGATED_INTENT =
  /\b(?:do not|don't|does not|doesn't|is not|isn't|are not|aren't|cannot|can't|not looking for|not seeking|not interested in|not an option|not possible|ruled out|will not|won't|never want|avoid)\b/i;

function tokenize(...parts: string[]): string[] {
  return parts
    .join(" ")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2);
}

function hasAffirmedPattern(text: string, pattern: RegExp) {
  for (const clause of text.split(/[.!?;\n]+|\bbut\b/i)) {
    const match = clause.match(pattern);
    if (!match || match.index === undefined) continue;
    const around = clause.slice(
      Math.max(0, match.index - 45),
      Math.min(clause.length, match.index + match[0].length + 45)
    );
    if (!NEGATED_INTENT.test(around)) return true;
  }
  return false;
}

function phrases(value: string): string[] {
  return value
    /* Preserve numeric separators such as "$2,000" while still turning a
       member's explicit comma/semicolon list into scannable profile items. */
    .split(/,(?!\d)|;|\n+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function assetsFromResourceText(value: string): StructuredSignals["assets"] {
  const checks: Array<[StructuredSignals["assets"][number], RegExp]> = [
    ["Skills", /\b(skill\w*|experience|know how|can do|trained|certif\w*|licen[cs]\w*)\b/i],
    ["Time", /\b(time|hours?|availability|available)\b/i],
    ["Money", /\b(money|cash|saving\w*|budget|capital|fund\w*)\b/i],
    ["Network", /\b(network|relationship\w*|contact\w*|supplier\w*|community|team)\b/i],
    ["Tools", /\b(tool\w*|equipment|machine\w*|software|vehicle|truck|oven)\b/i],
    ["Customers", /\b(customer\w*|client\w*|sales|revenue|orders?|audience)\b/i],
    ["Place", /\b(place|space|shop|office|garage|kitchen|land|storefront)\b/i],
    ["Idea", /\b(idea|prototype|product|design|plan|concept|demo|app)\b/i]
  ];
  return checks.filter(([, pattern]) => pattern.test(value)).map(([asset]) => asset);
}

function buildSignals(
  source: MatchingIntakeSource,
  intakeId: string,
  statedNeed: string,
  currentText: string,
  historicalAttemptText: string,
  lane: StructuredSignals["lane"],
  assets: StructuredSignals["assets"],
  blockerParts: string[],
  goalParts: string[],
  currentIntentText: string,
  starterProfile: StarterProfileDraft,
  pathStatuses: StructuredSignals["pathStatuses"] = []
): StructuredSignals {
  const leverage = diagnoseLeverage(currentText, assets);
  const capitalSeeking = hasAffirmedPattern(currentIntentText, CAPITAL_WORDS);

  return {
    source,
    intakeId,
    statedNeed,
    intakeTextBlob: currentText,
    historicalAttemptText,
    lane,
    assets,
    blockerKeywords: tokenize(...blockerParts),
    goalKeywords: tokenize(...goalParts),
    capitalSeeking,
    partnerSeeking: hasAffirmedPattern(currentIntentText, PARTNER_WORDS),
    jobSeeking:
      hasAffirmedPattern(currentIntentText, JOB_WORDS) &&
      !(capitalSeeking && LEAVE_JOB_FOR_VENTURE.test(currentIntentText)),
    trainingSeeking: hasAffirmedPattern(currentIntentText, TRAINING_WORDS),
    relocationSignal: hasAffirmedPattern(currentIntentText, RELOC_WORDS),
    leverage,
    llmTranslatedBottleneck: null,
    starterProfile,
    pathStatuses,
    consideringKinds: kindsForStatus(pathStatuses, "considering"),
    triedKinds: kindsForStatus(pathStatuses, "tried"),
    ruledOutKinds: kindsForStatus(pathStatuses, "ruled_out")
  };
}

export function signalsFromDiscovery(intakeId: string, input: DiscoveryIntakeInput): StructuredSignals {
  const currentText = [
    input.situation,
    input.goal,
    input.stated_blocker,
    input.one_thing,
    input.constraints,
    input.notes
  ].join(" ");

  return buildSignals(
    "discovery",
    intakeId,
    input.one_thing || input.goal || input.situation,
    currentText,
    input.tried,
    input.lane,
    input.assets,
    [input.stated_blocker, input.constraints],
    [input.goal, input.situation],
    [input.situation, input.goal, input.stated_blocker, input.one_thing].join(" "),
    {
      version: "v1",
      source: "self_reported_intake",
      project: input.situation,
      stage: "",
      goal: input.goal,
      resources: input.assets,
      offers: [],
      seeks: phrases([input.stated_blocker, input.one_thing].filter(Boolean).join(", ")),
      constraints: phrases(input.constraints),
      missing: ["business stage", "what you can offer another member"]
    }
  );
}

export function signalsFromConcierge(intakeId: string, answers: ConciergeIntakeAnswers): StructuredSignals {
  const statedNeed = answers.heaviest_lift.trim() || answers.stuck_decision.trim();
  /* Past attempts are deliberately excluded from current intent. Saying “I
     tried a loan” must not become “I want a loan now.” */
  const pathStatuses = parseStructuredPathStatuses(answers.already_tried);
  const currentIntentText = [
    answers.heaviest_lift,
    answers.time_cost,
    answers.stuck_decision,
    answers.success_twelve_months,
    ...pathStatuses.filter((item) => item.status === "considering").map((item) => item.pathLabel)
  ].join(" ");
  const currentText = [
    answers.heaviest_lift,
    answers.business_stage,
    answers.time_cost,
    answers.stuck_decision,
    answers.success_twelve_months,
    answers.resources_on_hand,
    answers.what_you_offer,
    answers.constraints,
    ...pathStatuses.filter((item) => item.status === "considering").map((item) => item.pathLabel)
  ].join(" ");
  const starterProfile: StarterProfileDraft = {
    version: "v1",
    source: "self_reported_intake",
    project: answers.heaviest_lift.trim(),
    stage: answers.business_stage.trim(),
    goal: answers.success_twelve_months.trim(),
    resources: phrases(answers.resources_on_hand),
    offers: phrases(answers.what_you_offer),
    seeks: phrases([answers.time_cost, answers.stuck_decision].filter(Boolean).join(", ")),
    constraints: phrases(answers.constraints),
    missing: [
      !answers.heaviest_lift.trim() ? "what you are trying to make real" : "",
      !answers.business_stage.trim() ? "business stage" : "",
      !answers.resources_on_hand.trim() ? "what you already have" : "",
      !answers.what_you_offer.trim() ? "what you can offer another member" : "",
      !answers.constraints.trim() ? "what cannot change" : ""
    ].filter(Boolean)
  };

  return buildSignals(
    "bellows_concierge",
    intakeId,
    statedNeed,
    currentText,
    answers.already_tried,
    "Unsure",
    assetsFromResourceText(answers.resources_on_hand),
    [answers.stuck_decision, answers.time_cost],
    [answers.success_twelve_months, answers.heaviest_lift],
    currentIntentText,
    starterProfile,
    pathStatuses
  );
}

/** Free-text / pasted document → signals. Does not invent assets or lane. */
export function signalsFromDocumentText(intakeId: string, title: string, body: string): StructuredSignals {
  const cleaned = body.trim();
  const firstLine = cleaned.split(/\r?\n/).map((line) => line.trim()).find(Boolean) || title.trim();
  const statedNeed = firstLine.slice(0, 280);
  const blob = [title.trim(), cleaned].filter(Boolean).join("\n");

  return buildSignals(
    "discovery",
    intakeId,
    statedNeed,
    blob,
    "",
    "Unsure",
    [],
    [cleaned.slice(0, 400)],
    [statedNeed],
    cleaned,
    {
      version: "v1",
      source: "self_reported_intake",
      project: statedNeed,
      stage: "",
      goal: "",
      resources: [],
      offers: [],
      seeks: phrases(statedNeed),
      constraints: [],
      missing: ["business stage", "goal", "resources", "what you can offer another member", "constraints"]
    }
  );
}

/** @deprecated Use layer0.translatedNeed from runLayer0() */
export function primaryBottleneckFromSignals(signals: StructuredSignals): string {
  if (signals.llmTranslatedBottleneck) return signals.llmTranslatedBottleneck;
  if (signals.capitalSeeking && signals.partnerSeeking) {
    return "Capital and partnership are both named — the nearer bottleneck may be proof and sizing, not a person.";
  }
  if (signals.capitalSeeking) return "Funding or liquidity appears to be the primary bottleneck.";
  if (signals.partnerSeeking) return "Partnership or operator coverage appears to be the primary bottleneck.";
  if (signals.jobSeeking) return "Employment or role change appears to be the primary bottleneck.";
  if (signals.trainingSeeking) return "Skill or credential gap appears to be the primary bottleneck.";
  if (signals.relocationSignal) return "Geography or relocation constraint appears central.";
  return "The stated need should be translated before chasing a specific person, product, or vendor.";
}
