import type { ConciergeIntakeAnswers } from "@/lib/squibb/concierge-intake-v0";
import type { DiscoveryIntakeInput } from "@/lib/discovery/schema";
import { diagnoseLeverage } from "@/lib/matching/leverage";
import type { MatchingIntakeSource, StructuredSignals } from "@/lib/matching/types";

const PARTNER_WORDS = /\b(partner|co-founder|cofounder|investor|backer|equity)\b/i;
const CAPITAL_WORDS = /\b(loan|capital|fund|fundraising|money|credit|financ|bank|lender|invest)\b/i;
const JOB_WORDS = /\b(job|hire|hired|employment|shift|bartend|server|waiter|waitress|kitchen)\b/i;
const TRAINING_WORDS = /\b(train|certif|license|course|class|learn|skill)\b/i;
const RELOC_WORDS = /\b(relocat|move|city|state|zip|metro|area)\b/i;

function tokenize(...parts: string[]): string[] {
  const blob = parts.join(" ").toLowerCase();
  return blob
    .split(/[^a-z0-9]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 2);
}

function hasPattern(text: string, pattern: RegExp) {
  return pattern.test(text);
}

function buildSignals(
  source: MatchingIntakeSource,
  intakeId: string,
  statedNeed: string,
  blob: string,
  lane: StructuredSignals["lane"],
  assets: StructuredSignals["assets"],
  blockerParts: string[],
  goalParts: string[]
): StructuredSignals {
  const leverage = diagnoseLeverage(blob, assets);
  return {
    source,
    intakeId,
    statedNeed,
    intakeTextBlob: blob,
    lane,
    assets,
    blockerKeywords: tokenize(...blockerParts),
    goalKeywords: tokenize(...goalParts),
    capitalSeeking: hasPattern(blob, CAPITAL_WORDS),
    partnerSeeking: hasPattern(blob, PARTNER_WORDS),
    jobSeeking: hasPattern(blob, JOB_WORDS),
    trainingSeeking: hasPattern(blob, TRAINING_WORDS),
    relocationSignal: hasPattern(blob, RELOC_WORDS),
    leverage,
    llmTranslatedBottleneck: null
  };
}

export function signalsFromDiscovery(intakeId: string, input: DiscoveryIntakeInput): StructuredSignals {
  const blob = [
    input.situation,
    input.goal,
    input.stated_blocker,
    input.one_thing,
    input.tried,
    input.constraints,
    input.notes
  ].join(" ");

  return buildSignals(
    "discovery",
    intakeId,
    input.one_thing || input.goal || input.situation,
    blob,
    input.lane,
    input.assets,
    [input.stated_blocker, input.constraints],
    [input.goal, input.situation]
  );
}

export function signalsFromConcierge(intakeId: string, answers: ConciergeIntakeAnswers): StructuredSignals {
  const blob = Object.values(answers).join(" ");
  const statedNeed = answers.heaviest_lift.trim() || answers.stuck_decision.trim();

  return buildSignals(
    "bellows_concierge",
    intakeId,
    statedNeed,
    blob,
    "Unsure",
    [],
    [answers.stuck_decision, answers.time_cost],
    [answers.success_twelve_months, answers.heaviest_lift]
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
