import {
  conciergeIntakeFieldLimit,
  CONCIERGE_INTAKE_QUESTIONS,
  type ConciergeIntakeAnswers
} from "@/lib/squibb/concierge-intake-v0";

export const BELLOWS_BROWSER_INTAKE_KEY = "werkles_concierge_intake_draft_v1";

export type BrowserIntakeDraft = {
  version: "v2";
  dirty: boolean;
  completed: boolean;
  updatedAt: string;
  answers: ConciergeIntakeAnswers;
};

export function isBrowserIntakeAnswers(value: unknown): value is ConciergeIntakeAnswers {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return CONCIERGE_INTAKE_QUESTIONS.every((question) => {
    const answer = record[question.id];
    return typeof answer === "string" && answer.length <= conciergeIntakeFieldLimit(question.id);
  });
}

export function readBrowserIntakeDraft(storage: Pick<Storage, "getItem">): BrowserIntakeDraft | null {
  try {
    const raw = storage.getItem(BELLOWS_BROWSER_INTAKE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BrowserIntakeDraft>;
    if (!isBrowserIntakeAnswers(parsed.answers)) return null;
    return {
      version: "v2",
      dirty: parsed.dirty === true,
      completed: parsed.completed === true,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
      answers: parsed.answers
    };
  } catch {
    return null;
  }
}

export function writeBrowserIntakeDraft(
  storage: Pick<Storage, "setItem">,
  answers: ConciergeIntakeAnswers,
  state: Pick<BrowserIntakeDraft, "dirty" | "completed">
) {
  storage.setItem(
    BELLOWS_BROWSER_INTAKE_KEY,
    JSON.stringify({
      version: "v2",
      dirty: state.dirty,
      completed: state.completed,
      updatedAt: new Date().toISOString(),
      answers
    } satisfies BrowserIntakeDraft)
  );
}
