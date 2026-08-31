import "server-only";

import { readLatestSpeakerIntakeForOwner } from "@/lib/squibb/concierge-intake-storage";
import { signalsFromConcierge } from "@/lib/matching/signals";
import type { StructuredSignals } from "@/lib/matching/types";
import {
  CONCIERGE_INTAKE_QUESTIONS,
  EMPTY_INTAKE_ANSWERS,
  type ConciergeIntakeAnswers
} from "@/lib/squibb/concierge-intake-v0";
import {
  GHOST_FLEET_DISCLOSURE,
  isGhostFleetEnabled,
  listGhostMembers,
  rankGhostsForSignals
} from "@/lib/ghost-fleet";
import type { GhostMatchCandidate } from "@/lib/ghost-fleet/types";

/**
 * Recommendation View model — implements the structure in
 * `foreman/handoffs/inbox/FROM_MAKER_RECOMMENDATION_VIEW_V1.md`.
 *
 * Two rules from that spec drive the whole shape:
 *   "Avoid fake precision. Prefer Strong / Medium / Thin / Watch over mysterious
 *    decimal scores. Scores can exist behind the scenes, but the view should lead
 *    with reasons."
 *   "One recommendation. No 'top five' default."
 *
 * So numeric match scores never leave this module, and the model carries exactly
 * one verdict. Candidate names appear only as the doors the verdict points at.
 */

/**
 * Fit strength and risk are separate axes (Ender, CBCC red team 2026-08-03).
 * They shared one ladder, so `Watch` meant "barely a fit" on a candidate and
 * "this counts against you" on a reason — the same chip carrying opposite
 * meanings in one legend. A reader who learned the word in one place misread it
 * in the other.
 */
export type ReasonStrength = "Strong" | "Medium" | "Slim" | "CountsAgainst";

/**
 * The band always carries its object. A chip reading "Thin" beside a person's
 * name reads as a verdict on the person; "Slim evidence" cannot.
 */
export const BAND_LABEL: Record<ReasonStrength, string> = {
  Strong: "Strong evidence",
  Medium: "Medium evidence",
  Slim: "Slim evidence",
  CountsAgainst: "Counts against"
};

/** Risk chips must be visually distinct in shape, not only in text. */
export function bandKind(strength: ReasonStrength): "evidence" | "risk" {
  return strength === "CountsAgainst" ? "risk" : "evidence";
}

export type VisibleReason = {
  signal: string;
  strength: ReasonStrength;
  /** What Werkles actually saw. */
  saw: string;
  /** Why that matters for the call being made. */
  matters: string;
};

export type RecommendationActionKind =
  | "request_intro"
  | "edit_workshop"
  | "add_numbers"
  | "strengthen_profile"
  | "view_proof"
  | "save";

export type RecommendationAction = {
  label: string;
  kind: RecommendationActionKind;
  href?: string;
  enabled: boolean;
  disabledReason?: string;
};

export type RecommendationAlternative = {
  label: string;
  temptingBecause: string;
  notFirstBecause: string;
  couldBecomeRightWhen: string;
};

export type ChangeTrigger = { when: string; then: string };

/** A door the verdict points at. No score, no rank, no private detail. */
export type RecommendationDoor = {
  displayName: string;
  lane: string;
  place: string;
  strength: ReasonStrength;
  leadReason: string;
  reviewRequired: boolean;
  synthetic: boolean;
};

export type RecommendationViewState = "no_intake" | "low_confidence" | "ready" | "no_fit";

export type RecommendationViewModel = {
  state: RecommendationViewState;
  generatedAt: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  askedFor: {
    summary: string;
    laneNeeded: string | null;
    arena: string | null;
    turf: string | null;
    timeline: string | null;
    proofPosture: string;
  };
  heardUnderneath: {
    summary: string;
    /** The tension in the member's own words, when their intake names one. */
    squeeze: string | null;
    because: string;
    confidenceReason: string;
    missingContext: string[];
  };
  visibleReasons: VisibleReason[];
  recommendation: {
    verdict: string;
    body: string;
    primaryAction: RecommendationAction;
    secondaryActions: RecommendationAction[];
  };
  alternatives: RecommendationAlternative[];
  changeTriggers: ChangeTrigger[];
  missingEvidence: string[];
  doors: RecommendationDoor[];
  /** Bound to the branch so the heading never promises what the body cannot pay. */
  doorsHeading: string;
  /** Why the door list is empty, when it is. */
  doorsNote: string | null;
  nextAction: RecommendationAction;
  trustNote: string;
  syntheticDisclosure: string | null;
};

const TRUST_NOTE =
  "Werkles can show fit signals and open a private knock. It does not guarantee safety, solvency, returns, legal readiness, or that the other human is right for you. Claims still need receipts. Big moves still need advisers.";

/** Internal only. The spec forbids leading the view with a number. */
function bandForPoints(points: number): ReasonStrength {
  /* Negative points are a risk, not a weak fit. Separate axis, separate chip. */
  if (points < 0) return "CountsAgainst";
  if (points >= 20) return "Strong";
  if (points >= 12) return "Medium";
  return "Slim";
}

function bandForScore(score: number): ReasonStrength {
  if (score >= 55) return "Strong";
  if (score >= 35) return "Medium";
  return "Slim";
}

function answersFromPacket(symptoms: { id: string; answer: string }[]): ConciergeIntakeAnswers {
  const byId = new Map(symptoms.map((s) => [s.id, s.answer]));
  return CONCIERGE_INTAKE_QUESTIONS.reduce<ConciergeIntakeAnswers>(
    (next, question) => ({ ...next, [question.id]: byId.get(question.id) ?? "" }),
    { ...EMPTY_INTAKE_ANSWERS }
  );
}

function namedPressures(signals: StructuredSignals): string[] {
  const named: string[] = [];
  if (signals.capitalSeeking) named.push("money or a guarantor");
  if (signals.partnerSeeking) named.push("a business partner or experienced manager");
  if (signals.trainingSeeking) named.push("a skill or credential");
  if (signals.jobSeeking) named.push("a role change");
  if (signals.relocationSignal) named.push("geography");
  return named;
}

/**
 * The tension in the member's own words. A welding intake carried the entire
 * problem in one clause — "without dropping the road jobs that pay the bills" —
 * which the page quoted in the receipt and then never referenced again. The
 * interpretation instead printed the detector's category labels joined by "or",
 * which tells a member which pattern matched rather than what was heard.
 */
function squeezeClause(signals: StructuredSignals): string | null {
  const text = signals.statedNeed || signals.intakeTextBlob || "";
  const match = text.match(
    /\b(?:without|while still|but still|and still|but I cannot|without dropping)\b[^.;]{8,150}/i
  );
  if (!match) return null;
  return match[0].trim().replace(/[,;]$/, "");
}

function turfFrom(signals: StructuredSignals): string | null {
  const match = signals.intakeTextBlob.match(/\b(?:in|near|around)\s+([A-Z][a-zA-Z]+)/);
  return match?.[1] ?? null;
}

function laneNeededFrom(signals: StructuredSignals): string | null {
  if (signals.partnerSeeking) return "Operator";
  if (signals.capitalSeeking) return "Backer";
  if (signals.trainingSeeking) return "Trainer or credential holder";
  if (signals.jobSeeking) return "Connector";
  return null;
}

/* Why each signal matters, per signal. One shared sentence repeated down the rail
   made every reason look generated rather than reasoned. */
const WHY_IT_MATTERS: Record<string, string> = {
  /* "the rarest useful match in this pool" was a frequency claim about pool
     composition, computed by nobody, printed to a member as fact, about a
     synthetic pool. Standing rule from Ender's review: no "why it matters" line
     may contain a superlative, a frequency claim, or a count that is not derived
     from data on the page. */
  "Capital posture fits":
    "A backer who is not competing for the same money is the useful kind. It is also the kind where unverified funds hurt most.",
  "Both chasing the same money":
    "Two capital-seeking sides cannot relieve each other. An introduction here costs both of you time.",
  "Open to partnership":
    "Stated openness is weak evidence on its own, but it is the difference between a cold ask and a warm one.",
  "Carries what is blocking you":
    "Coverage aimed at your named blocker is the strongest complement an intake can show without verification.",
  "Two-way, not extractive":
    "Asks that answer something for the other side get answered. One-way asks usually do not.",
  "Has stood where you are":
    "Shared situation is useful for judgment, not for coverage. Someone in the same bind cannot lift it for you.",
  "Same area named":
    "Local means they can show up. It says nothing about whether they should.",
  "Can close a credential gap":
    "A credential path with a name attached beats a search. The credential itself still has to be checked."
};

/**
 * Visible reasons are aggregated from the engine's own reason strings, deduped by
 * signal, and always joined by the two standing reasons Werkles must not hide:
 * nothing is verified, and money-first is a risk when money is the pressure.
 */
function buildVisibleReasons(
  signals: StructuredSignals,
  candidates: GhostMatchCandidate[],
  { nameMembers }: { nameMembers: boolean }
): VisibleReason[] {
  const bySignal = new Map<string, VisibleReason>();

  for (const candidate of candidates.slice(0, 6)) {
    for (const reason of candidate.reasons) {
      if (bySignal.has(reason.label)) continue;
      bySignal.set(reason.label, {
        signal: reason.label,
        strength: bandForPoints(reason.points),
        /* When the verdict shows no doors, the reasons must not argue in favour of
           a named individual the page then refuses to show. That incoherence —
           strongest evidence for a specific person, then no person, then an
           argument against that person's whole lane, then a disabled button —
           reads as a broken machine, not as principle. Naming an unverified member
           is also a trust call routed to Bean and not yet ruled, so the page
           describes the shape of the match instead of the human. */
        saw: nameMembers
          ? reason.detail
          : reason.detail.split(candidate.displayName).join("One member in the pool"),
        matters:
          WHY_IT_MATTERS[reason.label] ??
          "A partial signal. Worth a look, not worth reorganizing your plan around."
      });
    }
  }

  const reasons = [...bySignal.values()];

  reasons.push({
    signal: "Nothing here is verified",
    strength: "CountsAgainst",
    saw: "No member in this readout has passed identity, funds, or credential checks. Neither have you.",
    matters:
      "Fit is not verification. Every name here is a stranger until a check is run, and Werkles does not run one for you automatically."
  });

  if (signals.capitalSeeking) {
    reasons.push({
      signal: "Money before numbers",
      strength: "CountsAgainst",
      saw: "Your intake leads with funding, a lease, or a guarantor.",
      matters:
        "Money conversations tend to fail on numbers you have not assembled yet. That is a preparation gap, not a matching gap."
    });
  }

  return reasons;
}

function actionFor(kind: RecommendationActionKind): RecommendationAction {
  switch (kind) {
    case "request_intro":
      return {
        label: "Knock on this door",
        kind: "request_intro",
        enabled: false,
        /* Spec: do not offer intro knocks when proof posture blocks them. */
        disabledReason:
          "Knocks are closed while every member in this readout is unverified. Werkles will not open a door it cannot vouch for."
      };
    case "edit_workshop":
      /* "Sharpen the Workshop" is internal vocabulary. A member has a business,
         not a Workshop. */
      return { label: "Add to your answers", kind: "edit_workshop", href: "/bellows/intake", enabled: true };
    case "add_numbers":
      /* The surface previously had no enabled forward action anywhere: the knock
         was disabled and the only real next step appeared twice, both times as
         something Werkles would not do for you. */
      return {
        label: "Put your numbers in",
        kind: "add_numbers",
        href: "/bellows/intake",
        enabled: true
      };
    case "strengthen_profile":
      return {
        label: "See what is missing",
        kind: "strengthen_profile",
        href: "/dashboard/crucible",
        enabled: true
      };
    case "view_proof":
      return { label: "Show the proof signals", kind: "view_proof", href: "/dashboard/crucible", enabled: true };
    case "save":
      return { label: "Save this readout", kind: "save", enabled: false, disabledReason: "Saving lands with account binding." };
  }
}

const ALTERNATIVE_BANK: Record<string, RecommendationAlternative> = {
  backer: {
    label: "Backer first",
    temptingBecause: "Cash would buy time, equipment, and breathing room.",
    notFirstBecause:
      "Nobody on either side of this readout has verified funds, and your own numbers are not assembled yet. Money asked for early tends to be money declined.",
    couldBecomeRightWhen: "You can show a cost sheet and a funds check has been run on both sides."
  },
  operator: {
    label: "Experienced manager first",
    temptingBecause: "Someone who has run the schedule, the vendors, and the margin before could hold the part you cannot.",
    notFirstBecause: "Your intake has not yet named which part of the work is actually falling on the floor.",
    couldBecomeRightWhen: "The stuck decision in your intake names a task rather than a feeling."
  },
  connector: {
    label: "Connector first",
    temptingBecause: "More rooms and more customers feels like the answer to almost everything.",
    notFirstBecause: "Attention arriving before operating discipline usually creates expensive chaos.",
    couldBecomeRightWhen: "The service rhythm holds without you improvising every week."
  },
  pause: {
    label: "Full pause",
    temptingBecause: "The proof file is thin on every side, so waiting feels safest.",
    notFirstBecause:
      "There is enough signal in your intake to keep sharpening it. Stopping entirely costs you the only thing that is currently free.",
    couldBecomeRightWhen: "Identity or basic claim receipts fail, or your timeline moves out past a year."
  }
};

function alternativesExcept(excluded: string[]): RecommendationAlternative[] {
  return Object.entries(ALTERNATIVE_BANK)
    .filter(([key]) => !excluded.includes(key))
    .map(([, value]) => value);
}

function buildChangeTriggers(signals: StructuredSignals, answeredCount: number): ChangeTrigger[] {
  const triggers: ChangeTrigger[] = [];

  if (answeredCount < CONCIERGE_INTAKE_QUESTIONS.length) {
    triggers.push({
      when: `you answer the remaining ${CONCIERGE_INTAKE_QUESTIONS.length - answeredCount} intake question(s)`,
      then: "the reasons below get sharper and thin signals either firm up or drop out"
    });
  }
  if (signals.capitalSeeking) {
    triggers.push({
      when: "you can show three months of numbers and a clean cost sheet",
      then: "a capital-side conversation stops being premature"
    });
  }
  if (signals.partnerSeeking) {
    triggers.push({
      when: "you name the specific task that keeps landing on you",
      then: "Werkles can look for someone whose experience fits that job"
    });
  }
  if (!turfFrom(signals)) {
    triggers.push({
      when: "you name the place you actually work in",
      then: "geography becomes a real signal instead of an absent one"
    });
  }
  triggers.push({
    when: "identity and funds checks are run on a candidate",
    then: "that name stops being a stranger and a knock becomes possible"
  });

  return triggers;
}

function missingEvidenceFor(
  signals: StructuredSignals,
  answers: ConciergeIntakeAnswers
): string[] {
  const missing = CONCIERGE_INTAKE_QUESTIONS.filter((q) => answers[q.id].trim().length === 0).map(
    (q) => `Unanswered: ${q.label}`
  );

  missing.push("Identity check — not started on your side");
  if (signals.capitalSeeking) {
    missing.push("Funds check — not started, and it is the first thing a capital conversation asks for");
    missing.push("Cost sheet or margin model — Werkles cannot assemble this for you");
  }
  if (signals.trainingSeeking) missing.push("License or credential copy — not on file");
  if (signals.partnerSeeking) missing.push("Work reference — not on file");
  if (!turfFrom(signals)) missing.push("Turf — no place named in your intake");

  return missing;
}

export function emptyRecommendationView(): RecommendationViewModel {
  return {
    state: "no_intake",
    generatedAt: new Date().toISOString(),
    confidence: "LOW",
    askedFor: {
      summary: "Nothing asked for yet. Werkles will not invent an ask on your behalf.",
      laneNeeded: null,
      arena: null,
      turf: null,
      timeline: null,
      proofPosture: "Nothing on file"
    },
    heardUnderneath: {
      summary: "Nothing to read yet.",
      squeeze: null,
      because: "No answers are attached to this browser session, so there is nothing underneath to read.",
      confidenceReason: "No answers on file.",
      missingContext: ["The intake questions have not been answered from this browser."]
    },
    visibleReasons: [],
    recommendation: {
      verdict: "Next move: answer the intake questions.",
      body:
        "Tell Werkles what you are making, what is getting in the way, what you already have, and what you can offer. The other pages read from those answers without guessing for you.",
      primaryAction: actionFor("edit_workshop"),
      secondaryActions: [actionFor("view_proof")]
    },
    alternatives: [],
    changeTriggers: [],
    missingEvidence: ["The answers themselves"],
    doors: [],
    doorsHeading: "Doors",
    doorsNote: null,
    nextAction: actionFor("edit_workshop"),
    trustNote: TRUST_NOTE,
    syntheticDisclosure: null
  };
}

export async function loadRecommendationView(ownerId: string | null): Promise<RecommendationViewModel> {
  if (!ownerId) return emptyRecommendationView();

  const latest = await readLatestSpeakerIntakeForOwner(ownerId);
  if (!latest) return emptyRecommendationView();

  const answers = answersFromPacket(latest.packet.symptoms);
  return buildRecommendationViewFromAnswers(latest.stored.intakeId, answers);
}

export async function buildRecommendationViewFromAnswers(
  intakeId: string,
  answers: ConciergeIntakeAnswers
): Promise<RecommendationViewModel> {
  const signals = signalsFromConcierge(intakeId, answers);
  const fleetOn = isGhostFleetEnabled();
  const ranked = fleetOn ? rankGhostsForSignals(signals, await listGhostMembers(), 12) : null;
  const candidates = ranked?.candidates ?? [];

  const answeredCount = CONCIERGE_INTAKE_QUESTIONS.filter(
    (question) => answers[question.id].trim().length > 0
  ).length;
  const totalQuestions = CONCIERGE_INTAKE_QUESTIONS.length;
  const pressures = namedPressures(signals);
  const complete = answeredCount >= totalQuestions;

  /* The three-tier confidence word is retired. HIGH was unreachable by
     construction, so a third of the legend was decoration and MEDIUM-as-ceiling
     read to a stranger as "we are bad at this". The explaining sentence already
     did the whole job, so the sentence ships and the label does not. */
  const confidence: RecommendationViewModel["confidence"] =
    complete && pressures.length > 0 ? "MEDIUM" : "LOW";
  const confidenceReason = complete
    ? pressures.length > 0
      ? "Every Intake field is answered, and the answers name a pressure we can read against. Nothing on this page has been verified on either side."
      : "Every Intake field is answered, but none of them name a pressure we can act on yet."
    : `${answeredCount} of ${totalQuestions} answers are in. The missing ones are where fit gets decided.`;

  /* One verdict, chosen by a fixed ladder so the call is auditable. */
  let state: RecommendationViewState = "ready";
  let verdict: string;
  let body: string;
  let primary: RecommendationAction;
  let excludedAlternatives: string[] = [];
  /* Doors must match the verdict. Listing Builders under "open Connector doors"
     is the kind of incoherence that makes a readout look generated. */
  let verdictDoorLane: string | null = null;
  let doorsNote: string | null = null;
  /* A heading that promises "The doors this points at" and then delivers nothing
     is a broken promise in seven words, so the heading is bound to the branch. */
  let doorsHeading = "People this points toward";

  const squeeze = squeezeClause(signals);

  if (!complete) {
    state = "low_confidence";
    /* Ladder state names were doubling as member-facing sentences, which is why
       every state read as an order in internal vocabulary. This state is the one
       most first-time readers will ever see, so it gets plain words. */
    verdict = candidates.length > 0
      ? "You have people to compare now. One more answer may change the order."
      : "Add a little more detail before considering a person.";
    body = candidates.length > 0
      ? `You have answered ${answeredCount} of ${totalQuestions} fields. The practice profiles above are available now; finishing the open field may change who appears first.`
      : `You have answered ${answeredCount} of ${totalQuestions} fields. The open parts remain unknown, so this readout keeps the possible next steps broad instead of pretending it knows more than you said.`;
    primary = actionFor("edit_workshop");
    doorsHeading = "People to consider";
    doorsNote = candidates.length > 0
      ? "These practice profiles are available now. The missing answer may change their order."
      : "Add the missing answers before Werkles points toward specific people.";
  } else if (candidates.length === 0) {
    state = "no_fit";
    /* Kept close to verbatim: Ender's review called this the one ladder string
       that already read like a person wrote it. */
    verdict = "Next move: keep building. No fit worth your time yet.";
    body =
      "Nobody in the pool cleared an honest reason against what you wrote. We would rather hand you an empty page than pad a list. What changes this is detail — the specific task, the named place, the actual number.";
    primary = actionFor("edit_workshop");
    doorsHeading = "People to consider";
    doorsNote = "Nobody in this practice group fits well enough yet.";
  } else if (signals.capitalSeeking) {
    verdict = "Next move: put your numbers on paper before you ask anyone for money.";
    body = [
      "You have the part that is hard to fake — real work, and a real reason to take on more of it.",
      squeeze
        ? `What makes it hard is the part you named yourself: ${squeeze}.`
        : "What you do not have yet is that written down in a form someone can say yes to.",
      "Money is the conversation that fails hardest when it starts before the numbers do, and nothing on this page has been verified on either side. Three months of jobs and a cost sheet turns a long ask into a short one."
    ].join(" ");
    primary = actionFor("add_numbers");
    /* "Backer first" stays in the rejected list — declining it is the verdict.
       Only the path actually being recommended is removed from alternatives. */
    excludedAlternatives = [];
    doorsHeading = "Why nobody appears here yet";
    doorsNote =
      "There is a shape of match here — someone on the funding side rather than competing with you for the same money. No door opens today: nothing on this page is verified, and the first question you would be asked is for a cost sheet you have not written. Write it, and this changes.";
  } else if (signals.partnerSeeking) {
    verdict = "Next move: find someone who can run the work without you standing there.";
    body = [
      "What you wrote reads as too much landing on one person.",
      squeeze ? `The bind you named is real: ${squeeze}.` : "",
      "The useful move is not more attention and not more money — it is someone who has held schedules, vendors, and margin pressure before, and who adds cadence without taking the thing away from you."
    ]
      .filter(Boolean)
      .join(" ");
    primary = actionFor("view_proof");
    excludedAlternatives = ["operator"];
    verdictDoorLane = "Operator";
    doorsHeading = "People this points toward";
  } else {
    verdict = "Next move: make one narrow ask instead of a broad search.";
    body =
      "What you wrote does not name a single hard bottleneck yet, so a wide search would cost you time and get ignored. A narrow ask to a small number of people gets answered.";
    primary = actionFor("view_proof");
    excludedAlternatives = ["connector"];
    verdictDoorLane = "Connector";
    doorsHeading = "People this points toward";
  }

  const doors: RecommendationDoor[] = (verdictDoorLane
    ? candidates.filter((c) => c.lane === verdictDoorLane)
    : []
  )
    .slice(0, 3)
    .map((c) => ({
      displayName: c.displayName,
      lane: c.lane,
      place: `${c.city}, ${c.region}`,
      strength: bandForScore(c.score),
      leadReason: c.reasons[0]?.detail ?? "Reason not recorded.",
      reviewRequired: c.eligibility === "review_required",
      synthetic: true
    }));

  if (verdictDoorLane && doors.length === 0) {
    doorsHeading = "Why nobody appears here yet";
    doorsNote = `No member in the ${verdictDoorLane} lane cleared an honest reason against what you wrote. Werkles would rather show you none than reach for one.`;
  }

  return {
    state,
    generatedAt: new Date().toISOString(),
    confidence,
    askedFor: {
      summary: signals.statedNeed || "Your intake is on file but the first answer is empty.",
      laneNeeded: laneNeededFrom(signals),
      arena: signals.lane === "Unsure" ? null : signals.lane,
      turf: turfFrom(signals),
      timeline: null,
      proofPosture: "Nothing verified yet on either side"
    },
    heardUnderneath: {
      summary:
        pressures.length === 0
          ? "Underneath the ask, nothing is named yet as the thing that is actually stuck."
          : pressures.length === 1
            ? `Underneath the ask, we heard one pressure: you need ${pressures[0]}.`
            : `Underneath the ask, we heard two pressures at once: you need ${pressures
                .slice(0, -1)
                .join(", ")}, and you need ${pressures[pressures.length - 1]}.`,
      /* The interpretation now names the tension rather than the category that
         matched. Werkles saying "money or a guarantor, a partner or operator" was
         the system reading its own detector labels back to a member. */
      squeeze: squeeze ? `Both come out of the same squeeze — ${squeeze}.` : null,
      because:
        pressures.length === 0
          ? "What you wrote describes a situation without naming the thing that is stuck, so getting clear outranks meeting anyone."
          : /* Three separate places insisted the page was not a black box. One is
               confident; three is anxious. This is the one that stays, and it no
               longer names the thing it is not. */
            "That reading comes from your own words, quoted below.",
      confidenceReason,
      missingContext: complete
        ? ["No verification has been run, so every reading here rests on what people typed about themselves."]
        : ["Answers still missing", "No verification on either side"]
    },
    visibleReasons: buildVisibleReasons(signals, candidates, { nameMembers: doors.length > 0 }),
    recommendation: {
      verdict,
      body,
      primaryAction: primary,
      /* Deduped by destination, not only by kind. "Put your numbers in" and "Add to
         your answers" are different kinds pointing at the same page, so filtering on
         kind alone left the same door offered twice under two names. */
      secondaryActions: [actionFor("edit_workshop"), actionFor("request_intro")].filter(
        (a) => a.kind !== primary.kind && (!a.href || a.href !== primary.href)
      )
    },
    alternatives: alternativesExcept(excludedAlternatives),
    changeTriggers: buildChangeTriggers(signals, answeredCount),
    missingEvidence: missingEvidenceFor(signals, answers),
    doors,
    doorsHeading,
    doorsNote,
    nextAction: primary,
    trustNote: TRUST_NOTE,
    syntheticDisclosure: fleetOn && doors.length > 0 ? GHOST_FLEET_DISCLOSURE : null
  };
}
