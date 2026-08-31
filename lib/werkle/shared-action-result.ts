import type { WerkleFirstSharedAction } from "@/lib/werkle/first-shared-action";

export const WERKLE_SHARED_ACTION_RESULT_KEY = "werkles:formation:shared-action-result:v1";
export const WERKLE_SHARED_ACTION_RESULT_VERSION = 1 as const;

export type WerkleSharedActionResult = Readonly<{
  version: 1;
  formationId: string;
  topicId: WerkleFirstSharedAction["topicId"];
  actionUpdatedAt: string;
  sourceRevision: number;
  sourceText: string;
  actionText: string;
  observed: string;
  interpretation: string;
  nextDecision: string;
  recordedAt: string;
}>;

function boundedText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.replace(/\s+/g, " ").trim();
  return text.length <= max ? text : null;
}

function timestamp(value: unknown): string | null {
  const text = boundedText(value, 40);
  return text && !Number.isNaN(Date.parse(text)) ? text : null;
}

export function werkleSharedActionResultFrom(value: unknown): WerkleSharedActionResult | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const expected = ["version", "formationId", "topicId", "actionUpdatedAt", "sourceRevision", "sourceText", "actionText", "observed", "interpretation", "nextDecision", "recordedAt"];
  if (Object.keys(record).length !== expected.length || !expected.every((key) => key in record)) return null;
  if (record.version !== WERKLE_SHARED_ACTION_RESULT_VERSION) return null;
  const formationId = boundedText(record.formationId, 100);
  const topicId = boundedText(record.topicId, 80) as WerkleFirstSharedAction["topicId"] | null;
  const actionUpdatedAt = timestamp(record.actionUpdatedAt);
  const sourceText = boundedText(record.sourceText, 1400);
  const actionText = boundedText(record.actionText, 500);
  const observed = boundedText(record.observed, 800);
  const interpretation = boundedText(record.interpretation, 800);
  const nextDecision = boundedText(record.nextDecision, 500);
  const recordedAt = timestamp(record.recordedAt);
  if (!formationId || !topicId || !actionUpdatedAt || !Number.isInteger(record.sourceRevision) || (record.sourceRevision as number) < 1 || !sourceText || !actionText || !observed || interpretation === null || !nextDecision || !recordedAt) return null;
  return Object.freeze({
    version: 1,
    formationId,
    topicId,
    actionUpdatedAt,
    sourceRevision: record.sourceRevision as number,
    sourceText,
    actionText,
    observed,
    interpretation,
    nextDecision,
    recordedAt
  });
}

export function createWerkleSharedActionResult(
  action: WerkleFirstSharedAction,
  draft: Pick<WerkleSharedActionResult, "observed" | "interpretation" | "nextDecision">,
  recordedAt = new Date().toISOString()
): WerkleSharedActionResult {
  const result = werkleSharedActionResultFrom({
    version: 1,
    formationId: action.formationId,
    topicId: action.topicId,
    actionUpdatedAt: action.updatedAt,
    sourceRevision: action.sourceRevision,
    sourceText: action.sourceText,
    actionText: action.action,
    observed: draft.observed,
    interpretation: draft.interpretation,
    nextDecision: draft.nextDecision,
    recordedAt
  });
  if (!result) throw new Error("Shared action result is invalid.");
  return result;
}

export function isWerkleSharedActionResultCurrent(result: WerkleSharedActionResult, action: WerkleFirstSharedAction): boolean {
  return result.formationId === action.formationId &&
    result.topicId === action.topicId &&
    result.actionUpdatedAt === action.updatedAt &&
    result.sourceRevision === action.sourceRevision &&
    result.sourceText === action.sourceText &&
    result.actionText === action.action;
}
