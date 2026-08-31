export const WORKSHOP_ACTION_PLAN_KEY = "werkles:workshop:action-plan:v1";

export type WorkshopActionPlan = Readonly<{
  version: 1;
  nextOutcome: string;
  firstTest: string;
  resultRule: string;
  owner: string;
  reviewDate: string;
  contextNote: string;
  savedAt: string;
}>;

function boundedText(value: unknown, max: number, required = true): string | null {
  if (typeof value !== "string" || value.length > max) return null;
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (required && !cleaned) return null;
  return cleaned;
}

export function workshopActionPlanFrom(value: unknown): WorkshopActionPlan | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (row.version !== 1) return null;
  const nextOutcome = boundedText(row.nextOutcome, 500);
  const firstTest = boundedText(row.firstTest, 700);
  const resultRule = boundedText(row.resultRule, 700);
  const owner = boundedText(row.owner, 120);
  const contextNote = boundedText(row.contextNote, 800, false);
  if (!nextOutcome || !firstTest || !resultRule || !owner || contextNote === null) return null;
  if (typeof row.reviewDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(row.reviewDate)) return null;
  if (Number.isNaN(Date.parse(`${row.reviewDate}T00:00:00.000Z`))) return null;
  if (typeof row.savedAt !== "string" || Number.isNaN(Date.parse(row.savedAt))) return null;
  return Object.freeze({
    version: 1,
    nextOutcome,
    firstTest,
    resultRule,
    owner,
    reviewDate: row.reviewDate,
    contextNote,
    savedAt: row.savedAt
  });
}

export function createWorkshopActionPlan(
  input: Omit<WorkshopActionPlan, "version" | "savedAt">,
  savedAt = new Date().toISOString()
): WorkshopActionPlan {
  const plan = workshopActionPlanFrom({ version: 1, ...input, savedAt });
  if (!plan) throw new Error("Complete every required Action Plan field before saving.");
  return plan;
}

export function workshopActionPlanDigest(plan: WorkshopActionPlan): string {
  return [
    "WERKLES ACTION PLAN DIGEST",
    `Target outcome: ${plan.nextOutcome}`,
    `Immediate test: ${plan.firstTest}`,
    `Result that counts: ${plan.resultRule}`,
    `Owner: ${plan.owner}`,
    `Review date: ${plan.reviewDate}`,
    ...(plan.contextNote ? [`Context deliberately carried in: ${plan.contextNote}`] : []),
    "Boundary: Working draft from this device. Not an agreement, provider result, or shared commitment."
  ].join("\n");
}
