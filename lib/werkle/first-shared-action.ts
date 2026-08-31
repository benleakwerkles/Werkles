import type { WerkleFirstSharedStep } from "@/lib/werkle/operating-brief";

export const WERKLE_FIRST_SHARED_ACTION_KEY = "werkles:formation:first-shared-action:v1";
export const WERKLE_FIRST_SHARED_ACTION_VERSION = 1 as const;

export type WerkleFirstSharedAction = Readonly<{
  version: 1;
  formationId: string;
  topicId: WerkleFirstSharedStep["topicId"];
  sourceRevision: number;
  sourceText: string;
  action: string;
  volunteer: string;
  checkIn: string;
  doneWhen: string;
  updatedAt: string;
}>;

function boundedText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.replace(/\s+/g, " ").trim();
  return text.length <= max ? text : null;
}

function safeDate(value: unknown): string | null {
  if (value === "") return "";
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : value;
}

export function werkleFirstSharedActionFrom(value: unknown): WerkleFirstSharedAction | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const expected = ["version", "formationId", "topicId", "sourceRevision", "sourceText", "action", "volunteer", "checkIn", "doneWhen", "updatedAt"];
  if (Object.keys(record).length !== expected.length || !expected.every((key) => key in record)) return null;
  if (record.version !== WERKLE_FIRST_SHARED_ACTION_VERSION) return null;
  const formationId = boundedText(record.formationId, 100);
  const topicId = boundedText(record.topicId, 80) as WerkleFirstSharedStep["topicId"] | null;
  const sourceText = boundedText(record.sourceText, 1400);
  const action = boundedText(record.action, 500);
  const volunteer = boundedText(record.volunteer, 120);
  const checkIn = safeDate(record.checkIn);
  const doneWhen = boundedText(record.doneWhen, 500);
  const updatedAt = boundedText(record.updatedAt, 40);
  if (!formationId || !topicId || !Number.isInteger(record.sourceRevision) || (record.sourceRevision as number) < 1 || !sourceText || action === null || volunteer === null || checkIn === null || doneWhen === null || !updatedAt || Number.isNaN(Date.parse(updatedAt))) return null;
  return Object.freeze({
    version: 1,
    formationId,
    topicId,
    sourceRevision: record.sourceRevision as number,
    sourceText,
    action,
    volunteer,
    checkIn,
    doneWhen,
    updatedAt
  });
}

export function createWerkleFirstSharedAction(
  formationId: string,
  step: WerkleFirstSharedStep,
  draft: Pick<WerkleFirstSharedAction, "action" | "volunteer" | "checkIn" | "doneWhen">,
  updatedAt = new Date().toISOString()
): WerkleFirstSharedAction {
  const parsed = werkleFirstSharedActionFrom({
    version: 1,
    formationId,
    topicId: step.topicId,
    sourceRevision: step.revision,
    sourceText: step.text,
    action: draft.action,
    volunteer: draft.volunteer,
    checkIn: draft.checkIn,
    doneWhen: draft.doneWhen,
    updatedAt
  });
  if (!parsed) throw new Error("First Shared Step plan is invalid.");
  return parsed;
}

export function isWerkleFirstSharedActionCurrent(action: WerkleFirstSharedAction, formationId: string, step: WerkleFirstSharedStep): boolean {
  return action.formationId === formationId && action.topicId === step.topicId && action.sourceRevision === step.revision && action.sourceText === step.text;
}
