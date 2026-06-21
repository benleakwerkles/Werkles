import fs from "node:fs";
import path from "node:path";

import {
  buildInboxDocument,
  buildInboxFilename,
  scanForSecrets,
  validateReceiptShape
} from "./receipt-capture";
import type { ReceiptSaveResult } from "./types";

const ROOT = process.cwd();
const INBOX_DIR = path.join(ROOT, "foreman", "handoffs", "inbox");

export function saveReceiptToInbox(input: {
  body: string;
  sourcePlatform?: string;
  sourceHint?: string;
}): ReceiptSaveResult {
  const secretHits = scanForSecrets(input.body);
  if (secretHits.length > 0) {
    return {
      ok: false,
      path: null,
      filename: null,
      error: "Secret-like content detected. Redact before saving."
    };
  }

  const validation = validateReceiptShape(input.body, input.sourceHint);
  if (!validation.valid) {
    return {
      ok: false,
      path: null,
      filename: null,
      error: validation.issues.join(" ") || "Invalid receipt shape."
    };
  }

  const capturedAt = new Date().toISOString();
  const filename = buildInboxFilename(validation.cousin, validation.receiptToken);
  const document = buildInboxDocument({
    body: input.body,
    cousin: validation.cousin,
    receiptToken: validation.receiptToken,
    sourcePlatform: input.sourcePlatform,
    capturedAt,
    validation
  });

  try {
    fs.mkdirSync(INBOX_DIR, { recursive: true });
    const abs = path.join(INBOX_DIR, filename);
    if (fs.existsSync(abs)) {
      return { ok: false, path: null, filename: null, error: `File already exists: ${filename}` };
    }
    fs.writeFileSync(abs, document, "utf8");
    return { ok: true, path: `foreman/handoffs/inbox/${filename}`, filename, error: null };
  } catch (err) {
    return {
      ok: false,
      path: null,
      filename: null,
      error: err instanceof Error ? err.message : "Write failed."
    };
  }
}

export { validateReceiptShape, scanForSecrets };
