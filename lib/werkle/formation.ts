export const WERKLE_FORMATION_VERSION = 1 as const;

export const WERKLE_TOPIC_IDS = [
  "purpose",
  "first_customer",
  "thirty_day_test",
  "roles",
  "decision_rights",
  "contributions",
  "money_questions",
  "proof_needs",
  "exit",
  "ip",
  "confidentiality",
  "unknowns"
] as const;

export type WerkleTopicId = (typeof WERKLE_TOPIC_IDS)[number];
export type WerkleParticipantId = "owner" | "partner";
export type WerkleResolutionChoice = "owner" | "partner" | "combine" | "private" | "park";
export type WerkleTopicStatus = "unstarted" | "proposed" | "accepted" | "objected" | "parked" | "private";

export type WerkleSourceStatement = Readonly<{
  id: string;
  author: WerkleParticipantId;
  text: string;
  origin: string;
}>;

export type WerkleTopicDefinition = Readonly<{
  id: WerkleTopicId;
  group: "foundation" | "working_agreement" | "hard_edges";
  label: string;
  question: string;
  why: string;
  floor: boolean;
  adviserGate: boolean;
  lesson?: Readonly<{ label: string; href: string }>;
  ownerSource: WerkleSourceStatement;
  partnerSource: WerkleSourceStatement;
  partnerPosition: Readonly<{
    choice: WerkleResolutionChoice;
    reason: string;
    question: string;
    note: string;
  }>;
  suggestedJoint: string;
}>;

export type WerkleSyntheticPartnerProfile = Readonly<{
  summary: string;
  workPace: string;
  followThrough: string;
  decisionStyle: string;
  disagreementStyle: string;
  availability: string;
  contributionPosture: string;
  financialScenario: string;
}>;

export type WerkleFormationEvent = Readonly<{
  id: string;
  topicId: WerkleTopicId;
  actor: WerkleParticipantId;
  kind: "choice" | "rewrite" | "accept" | "note" | "withdraw";
  detail: string;
  at: string;
}>;

export type WerkleTopicDraft = Readonly<{
  choices: Readonly<Record<WerkleParticipantId, WerkleResolutionChoice | null>>;
  jointText: string;
  revision: number;
  acceptedRevision: Readonly<Record<WerkleParticipantId, number | null>>;
  notes: Readonly<Record<WerkleParticipantId, string>>;
}>;

export type WerkleFormationDraft = Readonly<{
  version: typeof WERKLE_FORMATION_VERSION;
  formationId: string;
  ownerLabel: string;
  partnerLabel: string;
  updatedAt: string | null;
  topics: Readonly<Record<WerkleTopicId, WerkleTopicDraft>>;
  events: readonly WerkleFormationEvent[];
}>;

export type WerkleFormationSeed = Readonly<{
  formationId: string;
  partnerId: string;
  storageKey: string;
  ownerLabel: string;
  partnerLabel: string;
  partnerSynthetic: true;
  partnerProfile: WerkleSyntheticPartnerProfile;
  reasonForTable: string;
  definitions: readonly WerkleTopicDefinition[];
}>;

const MAX_TEXT = 1400;
const MAX_NOTE = 500;
const MAX_EVENTS = 240;

export function cleanWerkleText(value: unknown, max = MAX_TEXT): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

function emptyTopic(definition: WerkleTopicDefinition): WerkleTopicDraft {
  const partnerChoice = definition.partnerPosition.choice;
  return Object.freeze({
    choices: Object.freeze({ owner: null, partner: partnerChoice }),
    jointText: definition.suggestedJoint,
    revision: 1,
    acceptedRevision: Object.freeze({ owner: null, partner: partnerChoice === "combine" ? 1 : null }),
    notes: Object.freeze({
      owner: "",
      partner: definition.partnerPosition.note
    })
  });
}

export function createWerkleFormationDraft(seed: WerkleFormationSeed): WerkleFormationDraft {
  return Object.freeze({
    version: WERKLE_FORMATION_VERSION,
    formationId: seed.formationId,
    ownerLabel: seed.ownerLabel,
    partnerLabel: seed.partnerLabel,
    updatedAt: null,
    topics: Object.freeze(Object.fromEntries(seed.definitions.map((definition) => [definition.id, emptyTopic(definition)])) as Record<WerkleTopicId, WerkleTopicDraft>),
    events: Object.freeze([])
  });
}

function isChoice(value: unknown): value is WerkleResolutionChoice {
  return value === "owner" || value === "partner" || value === "combine" || value === "private" || value === "park";
}

export function restoreWerkleFormationDraft(value: unknown, seed: WerkleFormationSeed): WerkleFormationDraft | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (record.version !== WERKLE_FORMATION_VERSION || record.formationId !== seed.formationId) return null;
  if (!record.topics || typeof record.topics !== "object" || Array.isArray(record.topics)) return null;
  const storedTopics = record.topics as Record<string, unknown>;
  const topics = {} as Record<WerkleTopicId, WerkleTopicDraft>;

  for (const definition of seed.definitions) {
    const raw = storedTopics[definition.id];
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const topic = raw as Record<string, unknown>;
    const choices = topic.choices as Record<string, unknown> | undefined;
    const accepted = topic.acceptedRevision as Record<string, unknown> | undefined;
    const notes = topic.notes as Record<string, unknown> | undefined;
    const ownerChoice = choices?.owner == null ? null : choices.owner;
    const partnerChoice = choices?.partner == null ? null : choices.partner;
    if ((ownerChoice !== null && !isChoice(ownerChoice)) || (partnerChoice !== null && !isChoice(partnerChoice))) return null;
    const revision = Number(topic.revision);
    if (!Number.isInteger(revision) || revision < 1 || revision > 1000) return null;
    const ownerAccepted = accepted?.owner == null ? null : Number(accepted.owner);
    const partnerAccepted = accepted?.partner == null ? null : Number(accepted.partner);
    if ((ownerAccepted !== null && (!Number.isInteger(ownerAccepted) || ownerAccepted < 1 || ownerAccepted > revision)) ||
        (partnerAccepted !== null && (!Number.isInteger(partnerAccepted) || partnerAccepted < 1 || partnerAccepted > revision))) return null;
    const jointText = cleanWerkleText(topic.jointText);
    if (!jointText) return null;
    topics[definition.id] = Object.freeze({
      choices: Object.freeze({ owner: ownerChoice as WerkleResolutionChoice | null, partner: partnerChoice as WerkleResolutionChoice | null }),
      jointText,
      revision,
      acceptedRevision: Object.freeze({ owner: ownerAccepted, partner: partnerAccepted }),
      notes: Object.freeze({ owner: cleanWerkleText(notes?.owner, MAX_NOTE), partner: cleanWerkleText(notes?.partner, MAX_NOTE) })
    });
  }

  const rawEvents = Array.isArray(record.events) ? record.events.slice(-MAX_EVENTS) : [];
  const events = rawEvents.flatMap((raw): WerkleFormationEvent[] => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
    const event = raw as Record<string, unknown>;
    const topicId = event.topicId;
    const actor = event.actor;
    const kind = event.kind;
    if (!WERKLE_TOPIC_IDS.includes(topicId as WerkleTopicId) || (actor !== "owner" && actor !== "partner") ||
        (kind !== "choice" && kind !== "rewrite" && kind !== "accept" && kind !== "note" && kind !== "withdraw")) return [];
    return [{
      id: cleanWerkleText(event.id, 100) || `${topicId}-${rawEvents.indexOf(raw)}`,
      topicId: topicId as WerkleTopicId,
      actor,
      kind,
      detail: cleanWerkleText(event.detail, 300),
      at: cleanWerkleText(event.at, 40)
    }];
  });

  return Object.freeze({
    version: WERKLE_FORMATION_VERSION,
    formationId: seed.formationId,
    ownerLabel: seed.ownerLabel,
    partnerLabel: seed.partnerLabel,
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : null,
    topics: Object.freeze(topics),
    events: Object.freeze(events)
  });
}

export function werkleTopicStatus(topic: WerkleTopicDraft): WerkleTopicStatus {
  const { owner, partner } = topic.choices;
  if (owner === null && partner === null) return "unstarted";
  if (owner === null || partner === null) return "proposed";
  if (owner !== partner) return "objected";
  if (owner === "park") return "parked";
  if (owner === "private") return "private";
  if (owner === "combine" && (topic.acceptedRevision.owner !== topic.revision || topic.acceptedRevision.partner !== topic.revision)) return "proposed";
  return "accepted";
}

export function werkleActiveStatement(definition: WerkleTopicDefinition, topic: WerkleTopicDraft): string | null {
  if (werkleTopicStatus(topic) !== "accepted") return null;
  const choice = topic.choices.owner;
  if (choice === "owner") return definition.ownerSource.text;
  if (choice === "partner") return definition.partnerSource.text;
  if (choice === "combine") return topic.jointText;
  return null;
}

export function werkleFormationSummary(seed: WerkleFormationSeed, draft: WerkleFormationDraft) {
  const rows = seed.definitions.map((definition) => ({ definition, topic: draft.topics[definition.id], status: werkleTopicStatus(draft.topics[definition.id]) }));
  const counts = rows.reduce<Record<WerkleTopicStatus, number>>((all, row) => ({ ...all, [row.status]: all[row.status] + 1 }), {
    unstarted: 0,
    proposed: 0,
    accepted: 0,
    objected: 0,
    parked: 0,
    private: 0
  });
  const floorReady = rows.filter((row) => row.definition.floor).every((row) => row.status === "accepted" || ((row.definition.id === "first_customer" || row.definition.id === "exit") && row.status === "parked" && Boolean(row.topic.notes.owner.trim() || row.topic.notes.partner.trim())));
  const adviserReady = floorReady && rows.filter((row) => row.definition.adviserGate).every((row) => row.status === "accepted" || ((row.status === "parked" || row.status === "objected") && Boolean(row.topic.notes.owner.trim() || row.topic.notes.partner.trim())));
  return Object.freeze({ counts: Object.freeze(counts), floorReady, adviserReady, rows: Object.freeze(rows) });
}
