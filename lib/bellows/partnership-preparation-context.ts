import type { GhostInteractionMember } from "@/lib/ghost-fleet/interaction";

export const PARTNERSHIP_PREPARATION_CONTEXT_KEY = "werkles:bellows:partnership-preparation-context:v3";

export type PartnershipPracticeExchange = Readonly<{
  questionId: string;
  question: string;
  answer: string;
  source: string;
}>;

export type PartnershipPreparationContext = Readonly<{
  version: 3;
  synthetic: true;
  profileId: string;
  displayName: string;
  roleLabel: string;
  offers: readonly string[];
  seeks: readonly string[];
  fitReasons: readonly string[];
  fitCautions: readonly string[];
  practiceExchanges: readonly PartnershipPracticeExchange[];
}>;

function boundedText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.replace(/\s+/g, " ").trim();
  return text && text.length <= max ? text : null;
}

function boundedList(value: unknown, count: number, itemLength: number): readonly string[] | null {
  if (!Array.isArray(value) || value.length > count) return null;
  const items = value.map((item) => boundedText(item, itemLength));
  if (items.some((item) => item === null)) return null;
  return Object.freeze(items as string[]);
}

function boundedPracticeExchanges(value: unknown): readonly PartnershipPracticeExchange[] | null {
  if (!Array.isArray(value) || value.length > 4) return null;
  const exchanges = value.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    const record = item as Record<string, unknown>;
    const expected = ["questionId", "question", "answer", "source"];
    if (Object.keys(record).length !== expected.length || !expected.every((key) => key in record)) return null;
    const questionId = boundedText(record.questionId, 50);
    const question = boundedText(record.question, 320);
    const answer = boundedText(record.answer, 700);
    const source = boundedText(record.source, 220);
    if (!questionId || !question || !answer || !source) return null;
    return Object.freeze({ questionId, question, answer, source });
  });
  if (exchanges.some((exchange) => exchange === null)) return null;
  return Object.freeze(exchanges as PartnershipPracticeExchange[]);
}

export function partnershipPreparationContextFrom(value: unknown): PartnershipPreparationContext | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const expected = ["version", "synthetic", "profileId", "displayName", "roleLabel", "offers", "seeks", "fitReasons", "fitCautions", "practiceExchanges"];
  if (Object.keys(record).length !== expected.length || !expected.every((key) => key in record)) return null;
  if (record.version !== 3 || record.synthetic !== true) return null;
  const profileId = boundedText(record.profileId, 100);
  const displayName = boundedText(record.displayName, 100);
  const roleLabel = boundedText(record.roleLabel, 100);
  const offers = boundedList(record.offers, 4, 160);
  const seeks = boundedList(record.seeks, 4, 160);
  const fitReasons = boundedList(record.fitReasons, 3, 400);
  const fitCautions = boundedList(record.fitCautions, 3, 280);
  const practiceExchanges = boundedPracticeExchanges(record.practiceExchanges);
  if (!profileId || !displayName || !roleLabel || !offers || !seeks || !fitReasons || !fitCautions || !practiceExchanges) return null;
  return Object.freeze({ version: 3, synthetic: true, profileId, displayName, roleLabel, offers, seeks, fitReasons, fitCautions, practiceExchanges });
}

export function buildPartnershipPreparationContext(
  member: GhostInteractionMember,
  practiceExchanges: readonly PartnershipPracticeExchange[] = []
): PartnershipPreparationContext {
  const candidate = partnershipPreparationContextFrom({
    version: 3,
    synthetic: true,
    profileId: member.id,
    displayName: member.displayName,
    roleLabel: member.roleLabel,
    offers: member.offers.slice(0, 4),
    seeks: member.seeks.slice(0, 4),
    fitReasons: member.fitReasons.slice(0, 3).map((reason) => `${reason.label}: ${reason.detail}`),
    fitCautions: member.fitCautions.slice(0, 3),
    practiceExchanges: practiceExchanges.slice(0, 4)
  });
  if (!candidate) throw new Error("Practice profile cannot create a safe preparation context.");
  return candidate;
}
