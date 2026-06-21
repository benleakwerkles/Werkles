import type { ReceiptValidation } from "./types";

const SECRET_PATTERNS = [
  /\bsk_live_[a-zA-Z0-9]+\b/,
  /\bsk_test_[a-zA-Z0-9]+\b/,
  /\bghp_[a-zA-Z0-9]+\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /-----BEGIN (?:RSA )?PRIVATE KEY-----/
];

const COUSIN_FROM_RE = /^FROM_([A-Z0-9_]+)/m;
const GD_RECEIPT_RE = /GD_RECEIPT:\s*(GD_RECEIPT[^\s`]+)/i;
const RECEIVED_RE = /^RECEIVED\b/m;

export function scanForSecrets(text: string): string[] {
  const hits: string[] = [];
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(text)) hits.push(pattern.source);
  }
  return hits;
}

export function detectCousin(text: string, sourceHint?: string): string | null {
  const fromLine = text.match(/^#\s*FROM[_\s]+([A-Z0-9]+)/im)?.[1];
  if (fromLine) return fromLine.toUpperCase();

  const filenameHint = sourceHint?.match(/FROM_([A-Z0-9_]+)/i)?.[1];
  if (filenameHint) return filenameHint.toUpperCase();

  const token = text.match(GD_RECEIPT_RE)?.[1];
  if (token) {
    const parts = token.split("_");
    if (parts.length >= 4) {
      return parts[parts.length - 2]?.toUpperCase() ?? null;
    }
  }

  for (const cousin of ["PETRA", "ENDER", "SKYBRO", "BEAN", "COMPUTER", "MAKER", "CURSOR", "CODEX"]) {
    if (new RegExp(`\\b${cousin}\\b`, "i").test(text.slice(0, 400))) return cousin;
  }

  return null;
}

export function validateReceiptShape(text: string, sourceHint?: string): ReceiptValidation {
  const trimmed = text.trim();
  const issues: string[] = [];
  const warnings: string[] = [];

  if (!trimmed) {
    return {
      valid: false,
      score: 0,
      cousin: null,
      receiptToken: null,
      hasReceivedLine: false,
      hasGdReceipt: false,
      hasJsonBlock: false,
      issues: ["Empty response"],
      warnings: []
    };
  }

  const secretHits = scanForSecrets(trimmed);
  if (secretHits.length > 0) {
    issues.push("Possible secret material detected — do not save. Redact first.");
  }

  const hasReceivedLine = RECEIVED_RE.test(trimmed) || /\bRECEIVED\b/.test(trimmed.split("\n")[0] ?? "");
  const receiptToken = trimmed.match(GD_RECEIPT_RE)?.[1] ?? null;
  const hasGdReceipt = Boolean(receiptToken);
  const hasJsonBlock = /```json[\s\S]*?```/.test(trimmed) || /"receipt_token"\s*:/.test(trimmed);

  if (!hasReceivedLine) issues.push('Missing RECEIVED line (expected near top).');
  if (!hasGdReceipt) warnings.push("Missing GD_RECEIPT token — GD runs cannot auto-collect.");
  if (!hasJsonBlock) warnings.push("No JSON metadata block — optional but helps synthesis.");

  const cousin = detectCousin(trimmed, sourceHint);
  if (!cousin) warnings.push("Could not infer cousin — filename will use UNKNOWN.");

  let score = 0;
  if (hasReceivedLine) score += 40;
  if (hasGdReceipt) score += 35;
  if (hasJsonBlock) score += 15;
  if (cousin) score += 10;

  const valid = issues.length === 0 && hasReceivedLine;

  return {
    valid,
    score,
    cousin,
    receiptToken,
    hasReceivedLine,
    hasGdReceipt,
    hasJsonBlock,
    issues,
    warnings
  };
}

export function buildInboxFilename(cousin: string | null, receiptToken: string | null): string {
  const slug = (receiptToken ?? "RESPONSE")
    .replace(/^GD_RECEIPT_/, "")
    .replace(/[^a-zA-Z0-9_]+/g, "_")
    .slice(0, 64);
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const who = cousin ?? "UNKNOWN";
  return `FROM_${who}_${slug}_${ts}.md`;
}

export function buildInboxDocument(input: {
  body: string;
  cousin: string | null;
  receiptToken: string | null;
  sourcePlatform?: string;
  capturedAt: string;
  validation: ReceiptValidation;
}): string {
  const meta = {
    captured_by: "soledash_command_surface_v0",
    captured_at: input.capturedAt,
    cousin: input.cousin,
    receipt_token: input.receiptToken,
    source_platform: input.sourcePlatform ?? "paste",
    validation_score: input.validation.score,
    validation_valid: input.validation.valid
  };

  return `# FROM ${input.cousin ?? "UNKNOWN"} (SoleDash capture)

<!-- soledash-meta:${JSON.stringify(meta)} -->

${input.body.trim()}
`;
}
