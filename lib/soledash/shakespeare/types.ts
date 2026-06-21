/** Shakespeare v0 verdict — display contract only. No classification here. */

export type ShakespeareVerdict = "SWAT" | "RECEIPT" | "STOP" | "HUMAN_GATE";

/** Raw JSON emitted by `scripts/foreman/shakespeare-v0.mjs classify`. */
export type ShakespeareV0Payload = {
  schema: "SHAKESPEARE_V0";
  path?: string;
  intent: string;
  classifier?: string;
  policy?: string;
  verdict: ShakespeareVerdict;
  rule: string;
  reason?: string;
  confidence?: string | null;
  receipt_link?: string | null;
  receiptLink?: string | null;
};

/** Fields rendered by ShakespeareDecisionCard. */
export type ShakespeareDecisionView = {
  intent: string;
  verdict: ShakespeareVerdict;
  rule: string;
  confidence: string | null;
  receiptLink: string | null;
};
