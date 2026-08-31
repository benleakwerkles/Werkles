import "server-only";

import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildSpeakerIntakePacket,
  conciergeIntakeFieldLimit,
  CONCIERGE_INTAKE_QUESTIONS,
  EMPTY_INTAKE_ANSWERS,
  type ConciergeIntakeAnswers,
  type SpeakerIntakePacket
} from "@/lib/squibb/concierge-intake-v0";

export type MemberIntakeRecord = {
  intakeId: string;
  clientSubmissionId: string;
  capturedAt: string;
  answeredCount: number;
  answers: ConciergeIntakeAnswers;
  packet: SpeakerIntakePacket;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function exactAnswers(value: unknown): ConciergeIntakeAnswers | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const allowed = new Set(CONCIERGE_INTAKE_QUESTIONS.map((question) => question.id));
  if (Object.keys(record).some((key) => !allowed.has(key as keyof ConciergeIntakeAnswers))) return null;
  if (!CONCIERGE_INTAKE_QUESTIONS.every((question) => {
    const answer = record[question.id];
    return typeof answer === "string" && answer.length <= conciergeIntakeFieldLimit(question.id);
  })) return null;

  return CONCIERGE_INTAKE_QUESTIONS.reduce<ConciergeIntakeAnswers>((next, question) => {
    next[question.id] = record[question.id] as string;
    return next;
  }, { ...EMPTY_INTAKE_ANSWERS });
}

function strictInstant(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return false;
  try {
    return new Date(value).toISOString() === value;
  } catch {
    return false;
  }
}

function sameAnswers(left: ConciergeIntakeAnswers, right: ConciergeIntakeAnswers) {
  return CONCIERGE_INTAKE_QUESTIONS.every((question) => left[question.id] === right[question.id]);
}

const MEMBER_INTAKE_COLUMNS = "intake_id,client_submission_id,captured_at,answers";

export async function storeMemberIntake(input: {
  supabase: SupabaseClient;
  userId: string;
  clientSubmissionId: string;
  answers: ConciergeIntakeAnswers;
}): Promise<MemberIntakeRecord> {
  if (!isUuid(input.userId) || !isUuid(input.clientSubmissionId)) {
    throw new Error("Authenticated Intake binding is invalid.");
  }
  const answers = exactAnswers(input.answers);
  if (!answers || !CONCIERGE_INTAKE_QUESTIONS.some((question) => answers[question.id].trim().length > 0)) {
    throw new Error("Intake answers are invalid.");
  }

  const capturedAt = new Date().toISOString();
  const intakeId = `member_intake_${capturedAt.replace(/[-:.TZ]/g, "").slice(0, 14)}_${randomUUID().slice(0, 8)}`;

  const { data, error } = await input.supabase
    .from("member_concierge_intakes")
    .insert({
      client_submission_id: input.clientSubmissionId,
      intake_id: intakeId,
      answers
    })
    .select(MEMBER_INTAKE_COLUMNS)
    .single();

  if (!error && data) return parseMemberIntakeRow(data);
  if (error?.code !== "23505") {
    throw new Error("Werkles could not save this Intake to your account.");
  }

  const { data: existing, error: existingError } = await input.supabase
    .from("member_concierge_intakes")
    .select(MEMBER_INTAKE_COLUMNS)
    .eq("user_id", input.userId)
    .eq("client_submission_id", input.clientSubmissionId)
    .maybeSingle();
  if (existingError || !existing) {
    throw new Error("Werkles could not confirm the saved Intake retry.");
  }
  const prior = parseMemberIntakeRow(existing);
  if (!sameAnswers(prior.answers, answers)) {
    throw new Error("This Intake submission ID was already used for different answers.");
  }
  return prior;
}

export async function readLatestMemberIntake(
  supabase: SupabaseClient,
  userId: string
): Promise<MemberIntakeRecord | null> {
  if (!isUuid(userId)) throw new Error("Authenticated Intake binding is invalid.");
  const { data, error } = await supabase
    .from("member_concierge_intakes")
    .select(MEMBER_INTAKE_COLUMNS)
    .eq("user_id", userId)
    .order("captured_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error("Werkles could not load your saved Intake.");
  return data ? parseMemberIntakeRow(data) : null;
}

function parseMemberIntakeRow(value: unknown): MemberIntakeRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Saved Intake is malformed.");
  const row = value as Record<string, unknown>;
  const answers = exactAnswers(row.answers);
  if (
    typeof row.intake_id !== "string" || !row.intake_id.trim() ||
    typeof row.client_submission_id !== "string" || !isUuid(row.client_submission_id) ||
    !strictInstant(row.captured_at) ||
    !answers
  ) {
    throw new Error("Saved Intake is malformed.");
  }

  const packet = buildSpeakerIntakePacket(answers, row.captured_at);
  return Object.freeze({
    intakeId: row.intake_id,
    clientSubmissionId: row.client_submission_id,
    capturedAt: row.captured_at,
    answeredCount: CONCIERGE_INTAKE_QUESTIONS.filter(
      (question) => answers[question.id].trim().length > 0
    ).length,
    answers: Object.freeze({ ...answers }),
    packet: Object.freeze({ ...packet })
  });
}
