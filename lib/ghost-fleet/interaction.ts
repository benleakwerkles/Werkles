import type { GhostMember } from "@/lib/ghost-fleet/types";

export const GHOST_INTERACTION_QUESTION_IDS = [
  "carry",
  "looking_for",
  "open_questions",
  "first_question"
] as const;

export type GhostInteractionQuestionId = (typeof GHOST_INTERACTION_QUESTION_IDS)[number];

export type GhostInteractionQuestion = Readonly<{
  id: GhostInteractionQuestionId;
  label: string;
  source: string;
}>;

export type GhostInteractionMember = Readonly<{
  id: string;
  rank?: number;
  orderReason?: string;
  synthetic: true;
  displayName: string;
  lane: GhostMember["lane"];
  roleLabel: string;
  place: string;
  openToPartner: boolean;
  introEligibility: GhostMember["introEligibility"];
  offers: readonly string[];
  seeks: readonly string[];
  proofGaps: readonly string[];
  fitReasons: readonly Readonly<{ label: string; detail: string }>[];
  fitCautions: readonly string[];
  proximityLabel?: string;
  snapshotNeed?: string;
}>;

export type GhostInteractionMatchContext = Readonly<{
  rank?: number;
  orderReason?: string;
  proximityLabel?: string;
  reasons?: readonly Readonly<{ label: string; detail: string }>[];
  cautions?: readonly string[];
  snapshotNeed?: string;
}>;

export const GHOST_INTERACTION_QUESTIONS: readonly GhostInteractionQuestion[] = Object.freeze([
  Object.freeze({ id: "carry", label: "What could you take responsibility for?", source: "Their stated offer" }),
  Object.freeze({ id: "looking_for", label: "What would you need from me?", source: "Their stated need" }),
  Object.freeze({ id: "open_questions", label: "What should we clear up first?", source: "Unresolved fit questions" }),
  Object.freeze({ id: "first_question", label: "What would a small working test look like?", source: "Their possible role" })
]);

function freezeStrings(values: string[]) {
  return Object.freeze(values.filter((value) => value.trim()).map((value) => value.trim()));
}

function bounded(value: string, max: number): string {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

export function buildGhostInteractionMember(
  member: GhostMember,
  matchContext?: string | GhostInteractionMatchContext
): GhostInteractionMember | null {
  if (!member.synthetic || !member.id.trim() || !member.displayName.trim()) return null;
  const proximityLabel = typeof matchContext === "string" ? matchContext : matchContext?.proximityLabel;
  const rank = typeof matchContext === "string" ? undefined : matchContext?.rank;
  const orderReason = typeof matchContext === "string" ? undefined : matchContext?.orderReason;
  const snapshotNeed = typeof matchContext === "string" ? undefined : matchContext?.snapshotNeed;
  const fitReasons = Object.freeze((typeof matchContext === "string" ? [] : matchContext?.reasons ?? [])
    .map((reason) => Object.freeze({ label: bounded(reason.label, 100), detail: bounded(reason.detail, 280) }))
    .filter((reason) => reason.label && reason.detail));
  const fitCautions = Object.freeze((typeof matchContext === "string" ? [] : matchContext?.cautions ?? [])
    .slice(0, 3)
    .map((caution) => bounded(caution, 280))
    .filter(Boolean));

  return Object.freeze({
    id: member.id,
    ...(Number.isInteger(rank) && Number(rank) > 0 ? { rank: Number(rank) } : {}),
    ...(orderReason?.trim() ? { orderReason: bounded(orderReason, 180) } : {}),
    synthetic: true,
    displayName: member.displayName.trim(),
    lane: member.lane,
    roleLabel: member.roleLabel.trim(),
    place: [member.city.trim(), member.region.trim()].filter(Boolean).join(", "),
    openToPartner: member.openToPartner,
    introEligibility: member.introEligibility,
    offers: freezeStrings(member.offers),
    seeks: freezeStrings(member.seeks),
    proofGaps: freezeStrings(member.proofGaps),
    fitReasons,
    fitCautions,
    ...(proximityLabel?.trim() ? { proximityLabel: proximityLabel.trim() } : {}),
    ...(snapshotNeed?.trim() ? { snapshotNeed: bounded(snapshotNeed, 220) } : {})
  });
}

function topic(value: string | undefined, fallback: string): string {
  const cleaned = (value ?? "").replace(/\s+/g, " ").trim().replace(/[.!?]+$/, "");
  return (cleaned || fallback).slice(0, 72);
}

const SPOKEN_TOPICS = new Map<string, string>([
  ["chair space", "access to workspace"],
  ["ownership path", "a path toward ownership"],
  ["ownership stake", "an ownership stake"],
  ["paid role", "a paid role"],
  ["direction", "clearer direction"],
  ["build capacity", "extra build capacity"],
  ["shop space", "access to shop space"],
  ["warehouse space", "access to warehouse space"]
]);

function spokenTopic(value: string | undefined, fallback: string): string {
  const cleaned = topic(value, fallback);
  return SPOKEN_TOPICS.get(cleaned.toLowerCase()) ?? `${cleaned.charAt(0).toLowerCase()}${cleaned.slice(1)}`;
}

function firstName(displayName: string): string {
  return displayName.trim().split(/\s+/)[0] || "this person";
}

export function ghostInteractionQuestionsFor(
  member: GhostInteractionMember
): readonly GhostInteractionQuestion[] {
  const name = firstName(member.displayName);
  const offer = spokenTopic(member.offers[0], "useful help");
  const laneTest: Record<GhostInteractionMember["lane"], string> = {
    Backer: `Hey ${name}, if we started small, what would you want the first round of money to accomplish?`,
    Builder: `Hey ${name}, what could we build together in two weeks to see whether we work well together?`,
    Operator: `Hey ${name}, what part of the day-to-day work would you take on first, and how would we know it helped?`,
    Connector: `Hey ${name}, who would you bring into the first conversation, and what would make that introduction useful?`,
    Worker: `Hey ${name}, what small paid piece of work would give both of us a fair test?`,
    Unsure: `Hey ${name}, what small thing could we try together to find out whether this fit is real?`
  };

  return Object.freeze([
    Object.freeze({
      id: "carry",
      label: `Hey ${name}, I see you bring ${offer}. What part of that are you best at, and how could we use it in this Werkle?`,
      source: `Built from ${name}'s stated offer: ${offer}`
    }),
    Object.freeze({
      id: "looking_for",
      label: `What would make this worth your time, ${name}, and what would you need from me?`,
      source: `Built from what ${name} says they need: ${spokenTopic(member.seeks[0], "a fair arrangement")}`
    }),
    Object.freeze({
      id: "open_questions",
      label: `Before we promise each other anything, what would you want us to be clear about?`,
      source: member.fitCautions.length || member.proofGaps.length
        ? "Built from the questions and cautions that are still unresolved"
        : "A standard expectation check because a match is not an agreement"
    }),
    Object.freeze({
      id: "first_question",
      label: laneTest[member.lane],
      source: `Built from ${name}'s possible ${member.lane.toLowerCase()} role in this Werkle`
    })
  ]);
}

export function answerGhostInteractionQuestion(
  member: GhostInteractionMember,
  questionId: GhostInteractionQuestionId
): string {
  const voiceSeed = `${member.id}:${member.displayName}:${member.roleLabel}`;
  const voice = [...voiceSeed].reduce((sum, character) => sum + character.charCodeAt(0), 0) % 3;
  const offer = spokenTopic(member.offers[0], "the part of the work I know best");
  const seek = spokenTopic(member.seeks[0], "a fair arrangement for both of us");

  switch (questionId) {
    case "carry":
      return [
        `I’m strongest at ${offer}. I’d start with one part that is causing headaches, take responsibility for it, and let the results show whether I’m actually helping.`,
        `${offer} is where I’m most useful. Show me where the work keeps slowing down, and I’ll tell you what I can own without pretending I can fix everything.`,
        `The part I know best is ${offer}. Give me one real problem in that lane, and I’ll show you what I can own before either of us talks about a bigger role.`
      ][voice];
    case "looking_for":
      return [
        `I’m looking for ${seek}. I’d want us to be honest about what each person is putting in and what each person hopes to get back before we call it a partnership.`,
        `${seek} matters to me. I don’t need a grand promise—I need a clear role, a fair exchange, and a chance to see how we handle real work together.`,
        `For me, the important part is ${seek}. I’d want to understand your expectations and make sure neither of us is quietly agreeing to a different deal.`
      ][voice];
    case "open_questions":
      return [
        "I’d want us to be clear about who owns what, how decisions get made, how money is handled, and what happens if the trial is not working. The formal checks can stay on a separate list.",
        "I’d start with expectations: the job, the time, the money, and who gets the final call. If we cannot talk plainly about those four things, no verification badge is going to save the partnership.",
        "I’d want a straight conversation about responsibilities, pay, decision-making, and an easy way for either of us to step back. Then we can deal with paperwork and verification without confusing it for trust."
      ][voice];
    case "first_question":
      if (member.lane === "Backer") {
        return `I’d pick one specific use for the money and one result it should produce. If that small test works, we have something real to discuss; if it does not, we learned without putting the whole Werkle at risk.`;
      }
      if (member.lane === "Builder") {
        return `I’d choose one thing we can actually finish in two weeks, split the work clearly, and compare the result with what we promised. That tells us more than another long conversation about chemistry.`;
      }
      if (member.lane === "Operator") {
        return `I’d isolate one repeated part of the operation—scheduling, inventory, customer handoffs, whatever is actually causing trouble. We’d run it together for two weeks and see what became easier, faster, or less expensive.`;
      }
      if (member.lane === "Connector") {
        return "I’d start with one introduction where both people have a clear reason to talk. We would agree on the purpose first, make the introduction, and see whether anything useful actually comes from it.";
      }
      if (member.lane === "Worker") {
        return "I’d choose one small paid job, agree on the result and deadline, and then talk honestly about how it went before either of us promises anything bigger.";
      }
      if (member.lane === "Unsure") {
        return "I’d pick the smallest real task we can do together and use it to learn what the Werkle actually needs next—skill, time, money, equipment, or just a better decision.";
      }
      return "I’d start with one real task, agree on what good looks like, and see how we work together before we make the relationship bigger than the evidence.";
  }
}
