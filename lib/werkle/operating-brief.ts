import {
  werkleActiveStatement,
  werkleTopicStatus,
  type WerkleFormationDraft,
  type WerkleFormationSeed,
  type WerkleTopicDefinition,
  type WerkleTopicDraft,
  type WerkleTopicId
} from "@/lib/werkle/formation";

export const WERKLE_OPERATING_BRIEF_VERSION = 1 as const;

export type WerkleOperatingBriefRow = Readonly<{
  topicId: WerkleTopicId;
  label: string;
  text: string;
  revision: number;
  sourceTrail: readonly string[];
  adviserReview: boolean;
}>;

export const WERKLE_OPERATING_BRIEF_SECTION_IDS = [
  "purpose_customer_test",
  "roles_decisions",
  "contributions_financial_proof",
  "ip_confidentiality",
  "exit_unknowns"
] as const;

export type WerkleOperatingBriefSectionId = (typeof WERKLE_OPERATING_BRIEF_SECTION_IDS)[number];

export type WerkleOperatingBriefSection = Readonly<{
  id: WerkleOperatingBriefSectionId;
  label: string;
  emptyMessage: "Not yet written by both people.";
  rows: readonly WerkleOperatingBriefRow[];
}>;

export type WerkleOperatingBrief = Readonly<{
  version: typeof WERKLE_OPERATING_BRIEF_VERSION;
  formationId: string;
  title: "Werkle Operating Brief";
  browserLocal: true;
  boundaryCopy: string;
  sourceRevisionKey: string;
  updatedAt: string | null;
  sections: readonly WerkleOperatingBriefSection[];
}>;

export type WerkleFirstSharedStep = Readonly<{
  topicId: WerkleTopicId;
  label: string;
  text: string;
  sourceTrail: readonly string[];
  revision: number;
}>;

export type WerkleOperatingBriefOpenTopic = Readonly<{
  topicId: WerkleTopicId;
  label: string;
  status: ReturnType<typeof werkleTopicStatus>;
}>;

const SECTION_LABELS: Readonly<Record<WerkleOperatingBriefSectionId, string>> = Object.freeze({
  purpose_customer_test: "Purpose / Customer / Test",
  roles_decisions: "Who Does What",
  contributions_financial_proof: "Contributions / Shared Wording",
  ip_confidentiality: "What We Said About Ideas & Privacy",
  exit_unknowns: "Pause / Exit / Open Unknowns"
});

const TOPIC_SECTION: Readonly<Record<WerkleTopicId, WerkleOperatingBriefSectionId>> = Object.freeze({
  purpose: "purpose_customer_test",
  first_customer: "purpose_customer_test",
  thirty_day_test: "purpose_customer_test",
  roles: "roles_decisions",
  decision_rights: "roles_decisions",
  contributions: "contributions_financial_proof",
  money_questions: "contributions_financial_proof",
  proof_needs: "contributions_financial_proof",
  ip: "ip_confidentiality",
  confidentiality: "ip_confidentiality",
  exit: "exit_unknowns",
  unknowns: "exit_unknowns"
});

export const WERKLE_OPERATING_BRIEF_BOUNDARY = "Practice summary only. This Werkle Operating Brief is created in this browser from Formation wording both people accepted at the current version. It is not saved to your Werkles account, is not a legal document, and does not create an operating agreement, partnership, exit terms, or tax/entity recommendation. Sections show ‘Not yet written by both people.’ when no accepted wording exists. Excluded by design: private answers, predictions, suggested prompts, proposed, objected, parked, and withdrawn material. Copying or exporting this page does not make it an agreement.";

function safeAcceptedRow(
  seed: WerkleFormationSeed,
  definition: WerkleTopicDefinition,
  topic: WerkleTopicDraft
): WerkleOperatingBriefRow | null {
  if (werkleTopicStatus(topic) !== "accepted") return null;

  const choice = topic.choices.owner;
  if (choice === "partner" && seed.partnerSynthetic) return null;
  if (choice === "combine" && seed.partnerSynthetic && topic.revision === 1) return null;

  const text = werkleActiveStatement(definition, topic);
  if (!text) return null;

  const sourceTrail = choice === "combine"
    ? [definition.ownerSource.origin, definition.partnerSource.origin]
    : [definition.ownerSource.origin];

  return Object.freeze({
    topicId: definition.id,
    label: definition.label,
    text,
    revision: topic.revision,
    sourceTrail: Object.freeze(sourceTrail),
    adviserReview: definition.adviserGate
  });
}

export function createWerkleOperatingBrief(
  seed: WerkleFormationSeed,
  draft: WerkleFormationDraft
): WerkleOperatingBrief {
  const rowsBySection: Record<WerkleOperatingBriefSectionId, WerkleOperatingBriefRow[]> = {
    purpose_customer_test: [],
    roles_decisions: [],
    contributions_financial_proof: [],
    ip_confidentiality: [],
    exit_unknowns: []
  };

  for (const definition of seed.definitions) {
    const row = safeAcceptedRow(seed, definition, draft.topics[definition.id]);
    if (row) rowsBySection[TOPIC_SECTION[definition.id]].push(row);
  }

  const sections = WERKLE_OPERATING_BRIEF_SECTION_IDS.map((id) => Object.freeze({
    id,
    label: SECTION_LABELS[id],
    emptyMessage: "Not yet written by both people." as const,
    rows: Object.freeze(rowsBySection[id])
  }));
  const sourceRevisionKey = JSON.stringify(sections.flatMap((section) => section.rows.map((row) => [row.topicId, row.revision, row.text])));

  return Object.freeze({
    version: WERKLE_OPERATING_BRIEF_VERSION,
    formationId: seed.formationId,
    title: "Werkle Operating Brief",
    browserLocal: true,
    boundaryCopy: WERKLE_OPERATING_BRIEF_BOUNDARY,
    sourceRevisionKey,
    updatedAt: draft.updatedAt,
    sections: Object.freeze(sections)
  });
}

export function isWerkleOperatingBriefCurrent(
  brief: WerkleOperatingBrief,
  seed: WerkleFormationSeed,
  draft: WerkleFormationDraft
): boolean {
  return brief.formationId === seed.formationId && brief.sourceRevisionKey === createWerkleOperatingBrief(seed, draft).sourceRevisionKey;
}

/** Identifies unfinished conversations without copying notes, private text, or
 * generated suggestions into the Operating Brief. */
export function openTopicsForOperatingBriefSection(
  sectionId: WerkleOperatingBriefSectionId,
  seed: WerkleFormationSeed,
  draft: WerkleFormationDraft
): readonly WerkleOperatingBriefOpenTopic[] {
  return Object.freeze(seed.definitions.flatMap((definition) => {
    if (TOPIC_SECTION[definition.id] !== sectionId) return [];
    const status = werkleTopicStatus(draft.topics[definition.id]);
    if (status === "accepted") return [];
    return [Object.freeze({ topicId: definition.id, label: definition.label, status })];
  }));
}

/** The first action anchor is exact accepted wording, never a generated task or
 * inferred assignment. The interface may help members discuss this row, but it
 * may not silently turn it into a promise, deadline, owner, or agreement. */
export function firstSharedStepFromOperatingBrief(
  brief: WerkleOperatingBrief
): WerkleFirstSharedStep | null {
  const row = brief.sections.flatMap((section) => section.rows)[0];
  if (!row) return null;
  return Object.freeze({
    topicId: row.topicId,
    label: row.label,
    text: row.text,
    sourceTrail: Object.freeze([...row.sourceTrail]),
    revision: row.revision
  });
}
