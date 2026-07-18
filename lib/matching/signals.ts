import type { ConciergeIntakeAnswers } from "@/lib/squibb/concierge-intake-v0";

import type { DiscoveryIntakeInput } from "@/lib/discovery/schema";

import { diagnoseLeverage } from "@/lib/matching/leverage";

import type { MatchingIntakeSource, StructuredSignals } from "@/lib/matching/types";

export type MemberMatchingProfile = {
  primary_goal?: unknown;
  blueprint_narrative?: unknown;
  skills_offered?: unknown;
  skills_sought?: unknown;
  industry_tags?: unknown;
  lane?: unknown;
  work_preference?: unknown;
  location_city?: unknown;
  location_state?: unknown;
  timeline_to_launch?: unknown;
};



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

function profileText(value: unknown, maxLength = 1600): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function profileList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, 160))
    .filter(Boolean)
    .slice(0, 20);
}

function profileLane(value: unknown): StructuredSignals["lane"] {
  return value === "Builder" ||
    value === "Operator" ||
    value === "Backer" ||
    value === "Connector" ||
    value === "Spark"
    ? value
    : "Unsure";
}

export function hasUsableMemberProfileSignal(profile: MemberMatchingProfile): boolean {
  return Boolean(
    profileText(profile.primary_goal) ||
      profileText(profile.blueprint_narrative) ||
      profileList(profile.skills_sought).length > 0
  );
}

/**
 * Adapts only self-reported profile fields into the existing deterministic
 * Matching signal shape. The fixed in-memory key is never returned to the client.
 */
export function signalsFromMemberProfile(profile: MemberMatchingProfile): StructuredSignals | null {
  if (!hasUsableMemberProfileSignal(profile)) return null;

  const primaryGoal = profileText(profile.primary_goal);
  const narrative = profileText(profile.blueprint_narrative);
  const skillsOffered = profileList(profile.skills_offered);
  const skillsSought = profileList(profile.skills_sought);
  const industryTags = profileList(profile.industry_tags);
  const workPreference = profileText(profile.work_preference, 200);
  const locationCity = profileText(profile.location_city, 160);
  const locationState = profileText(profile.location_state, 80);
  const timeline = profileText(profile.timeline_to_launch, 200);
  const statedNeed =
    primaryGoal ||
    (skillsSought.length > 0 ? `I need support with ${skillsSought.join(", ")}.` : narrative);
  const blob = [
    primaryGoal,
    narrative,
    skillsOffered.join(" "),
    skillsSought.join(" "),
    industryTags.join(" "),
    profileText(profile.lane, 80),
    workPreference,
    [locationCity, locationState].filter(Boolean).join(", "),
    timeline
  ]
    .filter(Boolean)
    .join(". ");
  const assets: StructuredSignals["assets"] = [];
  if (skillsOffered.length > 0) assets.push("Skills");
  if (locationCity || locationState) assets.push("Place");

  return buildSignals(
    "member_profile",
    "private-in-memory",
    statedNeed,
    blob,
    profileLane(profile.lane),
    assets,
    [skillsSought.join(" "), workPreference],
    [primaryGoal, narrative, industryTags.join(" "), timeline]
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

