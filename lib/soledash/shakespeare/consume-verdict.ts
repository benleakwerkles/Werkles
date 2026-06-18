import type { ShakespeareDecisionView, ShakespeareV0Payload, ShakespeareVerdict } from "./types";

const VERDICTS = new Set<string>(["SWAT", "RECEIPT", "STOP", "HUMAN_GATE"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asVerdict(value: unknown): ShakespeareVerdict | null {
  if (typeof value !== "string") return null;
  const upper = value.trim().toUpperCase();
  return VERDICTS.has(upper) ? (upper as ShakespeareVerdict) : null;
}

function pickString(record: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

/**
 * Parse Shakespeare classify output (JSON string or object) into card view.
 * Presentation only — does not classify intents.
 */
export function consumeShakespeareVerdict(raw: unknown): ShakespeareDecisionView | null {
  let record: Record<string, unknown> | null = null;

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    if (VERDICTS.has(trimmed.toUpperCase())) {
      return {
        intent: "",
        verdict: trimmed.toUpperCase() as ShakespeareVerdict,
        rule: "raw_verdict",
        confidence: null,
        receiptLink: null
      };
    }
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (isRecord(parsed)) record = parsed;
    } catch {
      return null;
    }
  } else if (isRecord(raw)) {
    record = raw;
  }

  if (!record) return null;

  const verdict = asVerdict(record.verdict);
  const intent = pickString(record, "intent") ?? "";
  const rule = pickString(record, "rule") ?? "—";
  if (!verdict) return null;

  const confidence =
    pickString(record, "confidence") ??
    (typeof record.confidence === "number" ? String(record.confidence) : null);

  const receiptLink =
    pickString(record, "receiptLink", "receipt_link", "receipt_path", "receiptPath") ??
    null;

  return { intent, verdict, rule, confidence, receiptLink };
}

export function consumeShakespearePayload(payload: ShakespeareV0Payload): ShakespeareDecisionView {
  return (
    consumeShakespeareVerdict(payload) ?? {
      intent: payload.intent,
      verdict: payload.verdict,
      rule: payload.rule,
      confidence: payload.confidence ?? null,
      receiptLink: payload.receiptLink ?? payload.receipt_link ?? null
    }
  );
}

export function verdictSlug(verdict: ShakespeareVerdict): string {
  return verdict.toLowerCase().replace(/_/g, "-");
}
