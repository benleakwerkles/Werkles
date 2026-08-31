import {
  WERKLE_OPERATING_BRIEF_SECTION_IDS,
  type WerkleOperatingBrief,
  type WerkleOperatingBriefRow
} from "@/lib/werkle/operating-brief";

export const WERKLE_OPERATING_BRIEF_DEVICE_KEY = "werkles:werkle:operating-brief:v1";

export type StoredWerkleOperatingBrief = Readonly<{
  version: 1;
  candidateId: string;
  savedAt: string;
  brief: WerkleOperatingBrief;
}>;

function isText(value: unknown, max: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= max;
}

function isRow(value: unknown): value is WerkleOperatingBriefRow {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  return isText(row.topicId, 80)
    && isText(row.label, 160)
    && isText(row.text, 1400)
    && Number.isInteger(row.revision)
    && Number(row.revision) > 0
    && Array.isArray(row.sourceTrail)
    && row.sourceTrail.length > 0
    && row.sourceTrail.length <= 2
    && row.sourceTrail.every((item) => isText(item, 400))
    && typeof row.adviserReview === "boolean";
}

export function storedWerkleOperatingBriefFrom(value: unknown): StoredWerkleOperatingBrief | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (record.version !== 1 || !isText(record.candidateId, 100) || !/^[a-zA-Z0-9_-]+$/.test(record.candidateId)) return null;
  if (!isText(record.savedAt, 60) || Number.isNaN(Date.parse(record.savedAt))) return null;
  if (!record.brief || typeof record.brief !== "object" || Array.isArray(record.brief)) return null;
  const brief = record.brief as unknown as WerkleOperatingBrief;
  if (brief.version !== 1 || brief.title !== "Werkle Operating Brief" || brief.browserLocal !== true) return null;
  if (!isText(brief.formationId, 128) || !isText(brief.boundaryCopy, 2400) || !isText(brief.sourceRevisionKey, 20000)) return null;
  if (brief.updatedAt !== null && (!isText(brief.updatedAt, 60) || Number.isNaN(Date.parse(brief.updatedAt)))) return null;
  if (!Array.isArray(brief.sections) || brief.sections.length !== WERKLE_OPERATING_BRIEF_SECTION_IDS.length) return null;
  for (const [index, section] of brief.sections.entries()) {
    if (section.id !== WERKLE_OPERATING_BRIEF_SECTION_IDS[index]) return null;
    if (!isText(section.label, 160) || section.emptyMessage !== "Not yet written by both people.") return null;
    if (!Array.isArray(section.rows) || section.rows.length > 12 || !section.rows.every(isRow)) return null;
  }
  return Object.freeze({ version: 1, candidateId: record.candidateId, savedAt: record.savedAt, brief });
}

export function createStoredWerkleOperatingBrief(candidateId: string, brief: WerkleOperatingBrief): StoredWerkleOperatingBrief {
  const stored = storedWerkleOperatingBriefFrom({ version: 1, candidateId, savedAt: new Date().toISOString(), brief });
  if (!stored) throw new Error("The Operating Brief could not be prepared for device storage.");
  return stored;
}

export function storedWerkleOperatingBriefHref(stored: StoredWerkleOperatingBrief): string {
  return `/dashboard/werkles/formation?candidate=${encodeURIComponent(stored.candidateId)}#werkle-operating-brief-title`;
}
