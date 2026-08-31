export const PERSONAL_PLAN_CHECK_IN_KEY = "werkles:bellows:plan-check-in:v1";

export const PERSONAL_PLAN_CHECK_IN_CHOICES = [
  "keep_working",
  "situation_changed",
  "need_person",
  "need_check"
] as const;

export type PersonalPlanCheckInChoice = (typeof PERSONAL_PLAN_CHECK_IN_CHOICES)[number];

export const PERSONAL_PLAN_CHECK_IN_LABELS: Readonly<Record<PersonalPlanCheckInChoice, string>> = Object.freeze({
  keep_working: "The plan still fits",
  situation_changed: "My situation changed",
  need_person: "Another person is now part of the answer",
  need_check: "A claim now needs checking"
});

export type StoredPersonalPlanCheckIn = Readonly<{
  version: 1;
  choice: PersonalPlanCheckInChoice;
  note: string;
  savedAt: string;
}>;

export const PERSONAL_PLAN_CHECK_IN_DESTINATIONS: Readonly<Record<PersonalPlanCheckInChoice, Readonly<{
  label: string;
  href: string;
  explanation: string;
}>>> = Object.freeze({
  keep_working: Object.freeze({
    label: "Return to My Workshop",
    href: "/dashboard/blueprints",
    explanation: "Keep the current direction and carry the next useful result back into your private plan."
  }),
  situation_changed: Object.freeze({
    label: "Update My Intake",
    href: "/bellows/intake",
    explanation: "Change the source answers first so Recommendations, Bellows, and Match Deck can respond to the new situation."
  }),
  need_person: Object.freeze({
    label: "Compare People in Match Deck",
    href: "/dashboard/intros",
    explanation: "Compare people only because another person is now part of the answer—not because the lesson ended."
  }),
  need_check: Object.freeze({
    label: "Choose a Narrow Check",
    href: "/dashboard/crucible",
    explanation: "Name the exact claim that would change the decision before opening any provider or practice check."
  })
});

export function storedPersonalPlanCheckInFrom(value: unknown): StoredPersonalPlanCheckIn | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (row.version !== 1 || !PERSONAL_PLAN_CHECK_IN_CHOICES.includes(row.choice as PersonalPlanCheckInChoice)) return null;
  if (typeof row.note !== "string" || row.note.length > 800) return null;
  if (typeof row.savedAt !== "string" || Number.isNaN(Date.parse(row.savedAt))) return null;
  return Object.freeze({
    version: 1,
    choice: row.choice as PersonalPlanCheckInChoice,
    note: row.note.trim(),
    savedAt: row.savedAt
  });
}

export function createPersonalPlanCheckIn(
  choice: PersonalPlanCheckInChoice,
  note: string,
  savedAt = new Date().toISOString()
): StoredPersonalPlanCheckIn {
  const stored = storedPersonalPlanCheckInFrom({ version: 1, choice, note: note.trim(), savedAt });
  if (!stored) throw new Error("The Bellows check-in could not be saved.");
  return stored;
}
