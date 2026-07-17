import type { ConciergeIntakeAnswers } from "@/lib/squibb/concierge-intake-v0";

import type { DiscoveryIntakeInput } from "@/lib/discovery/schema";

import { diagnoseLeverage } from "@/lib/matching/leverage";

import type { MatchingIntakeSource, StructuredSignals } from "@/lib/matching/types";



const PARTNER_WORDS = /\b(partner(?:ship)?|co[- ]?founder|investor|backer|equity)\b/i;

const CAPITAL_WORDS =
  /\b(loan|capital|fund(?:ing|raise|raising)?|fundrais(?:e|ing)|money|credit|financ(?:e|es|ed|ing|ial|ially)?|bank(?:er|ing)?|lender|invest(?:or|ment|ing|ed)?)\b/i;

const JOB_WORDS = /\b(job|hire|hired|hiring|employment|career|shift|bartend(?:er|ing)?|server|waiter|waitress|kitchen)\b/i;

const TRAINING_WORDS =
  /\b(train(?:ing|ed|er)?|certif(?:y|ied|ication|ications)?|licen[cs](?:e|ed|ing|ure)?|course|class|learn(?:ing)?|skill(?:s)?)\b/i;

const RELOC_WORDS =
  /\b(relocat(?:e|ed|ing|ion)?|(?:move|moved|moving)\s+(?:to|from|across|out\s+of)|(?:new|different|another)\s+(?:city|state|metro|area)|(?:city|state|metro|area)\s+(?:move|relocation))\b/i;

const NEGATED_INTENT_BEFORE_MATCH =
  /\b(?:do\s+not|don't|dont|does\s+not|doesn't|doesnt|did\s+not|didn't|didnt|not|never|no\s+longer)\s+(?:currently\s+)?(?:need|want|seek|seeking|require|look(?:ing)?\s+for|pursue|plan(?:ning)?\s+to|intend(?:ing)?\s+to)\s+(?:(?:to|a|an|any|another|more|new)\s+){0,3}$/i;

const NEGATED_INTENT_SCOPE =
  /\b(?:do\s+not|don't|dont|does\s+not|doesn't|doesnt|did\s+not|didn't|didnt|not|never|no\s+longer)\s+(?:currently\s+)?(?:need|want|seek|seeking|require|look(?:ing)?\s+for|pursue|plan(?:ning)?\s+to|intend(?:ing)?\s+to|interested\s+in|consider(?:ing)?)\b/i;

const DIRECT_NOUN_NEGATION_BEFORE_MATCH =
  /\b(?:no|not|without|need\s+no|want\s+no|seek\s+no)\s+(?:(?:to|a|an|any|another|more|new)\s+){0,3}$/i;

const CANNOT_BEFORE_MATCH =
  /\b(?:cannot|can't|cant|can\s+not)\s+(?:(?:afford|take|accept|pursue|use|seek|get|move|borrow|raise|hire|attend)\s+)?(?:(?:to|a|an|any|another|more|new)\s+){0,3}$/i;

const DOUBLE_NEGATED_INTENT_BEFORE_MATCH =
  /\b(?:do\s+not|don't|dont|does\s+not|doesn't|doesnt|did\s+not|didn't|didnt|not)\s+not\s+(?:currently\s+)?(?:need|want|seek|seeking|require|look(?:ing)?\s+for|pursue|plan(?:ning)?\s+to|intend(?:ing)?\s+to)\s+(?:(?:to|a|an|any|another|more|new)\s+){0,3}$/i;



function tokenize(...parts: string[]): string[] {

  const blob = parts.join(" ").toLowerCase();

  return blob

    .split(/[^a-z0-9]+/)

    .map((t) => t.trim())

    .filter((t) => t.length > 2);

}


function hasAffirmedPattern(text: string, pattern: RegExp) {

  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;

  for (const match of text.matchAll(new RegExp(pattern.source, flags))) {

    const matchIndex = match.index ?? 0;

    const beforeMatch = text.slice(Math.max(0, matchIndex - 180), matchIndex);

    const currentClause =
      beforeMatch
        .split(
          /[.!?;:\n]|\b(?:but|however|instead|yet)\b|\b(?:and|then)\s+(?=(?:(?:i|we)\s+)?(?:need|want|seek|require|look(?:ing)?\s+for|pursue|plan|intend|am|are)\b)/i
        )
        .at(-1) ?? beforeMatch;

    if (DOUBLE_NEGATED_INTENT_BEFORE_MATCH.test(currentClause)) return true;
    if (DIRECT_NOUN_NEGATION_BEFORE_MATCH.test(currentClause)) continue;
    if (CANNOT_BEFORE_MATCH.test(currentClause)) continue;
    if (NEGATED_INTENT_BEFORE_MATCH.test(currentClause)) continue;
    if (NEGATED_INTENT_SCOPE.test(currentClause)) continue;
    return true;

  }

  return false;

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

    capitalSeeking: hasAffirmedPattern(blob, CAPITAL_WORDS),

    partnerSeeking: hasAffirmedPattern(blob, PARTNER_WORDS),

    jobSeeking: hasAffirmedPattern(blob, JOB_WORDS),

    trainingSeeking: hasAffirmedPattern(blob, TRAINING_WORDS),

    relocationSignal: hasAffirmedPattern(blob, RELOC_WORDS),

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

